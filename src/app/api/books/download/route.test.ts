import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { DatabaseExecutor, setDatabaseExecutor } from '@/db/client';

class MockRouteDatabaseExecutor implements DatabaseExecutor {
  public downloadTokensTable: any[] = [];
  public downloadLogsTable: any[] = [];
  public booksTable: any[] = [
    { id: 101, title: 'Designing Data-Intensive Applications', file_format: 'PDF' },
  ];

  async query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
    const trimmed = queryText.trim();

    // Query book
    if (trimmed.includes('FROM books WHERE id = $1')) {
      const book = this.booksTable.find((b) => String(b.id) === String(params[0]));
      return (book ? [book] : []) as unknown as T[];
    }

    // Query token by token UUID
    if (trimmed.includes('FROM download_tokens WHERE token = $1')) {
      const token = this.downloadTokensTable.find((t) => t.token === params[0]);
      return (token ? [token] : []) as unknown as T[];
    }

    // Update download count (increment)
    if (trimmed.startsWith('UPDATE download_tokens') && trimmed.includes('download_count = download_count + 1')) {
      const token = this.downloadTokensTable.find((t) => String(t.id) === String(params[0]));
      if (token) {
        token.download_count += 1;
        return [token] as unknown as T[];
      }
      return [] as T[];
    }

    // Insert download log
    if (trimmed.startsWith('INSERT INTO download_logs')) {
      const log = {
        id: this.downloadLogsTable.length + 1,
        download_token_id: params[0],
        user_id: params[1],
        book_id: params[2],
        ip_address: params[3],
        user_agent: params[4],
        downloaded_at: new Date().toISOString(),
      };
      this.downloadLogsTable.push(log);
      return [log] as unknown as T[];
    }

    return [] as T[];
  }
}

describe('Gated Digital Fulfillment Route Handler Slice (Tickets 02 & 03)', () => {
  let mockDb: MockRouteDatabaseExecutor;

  beforeEach(() => {
    mockDb = new MockRouteDatabaseExecutor();
    setDatabaseExecutor(mockDb);

    // Seed valid active token
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    mockDb.downloadTokensTable = [
      {
        id: 1,
        token: 'valid-token-uuid-1234',
        user_id: 10,
        book_id: 101,
        expires_at: futureDate.toISOString(),
        max_downloads: 5,
        download_count: 0,
        is_revoked: false,
        created_at: new Date().toISOString(),
      },
    ];
  });

  it('returns 400 Bad Request when token parameter is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/books/download');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('token is required');
  });

  it('returns 404 Not Found when token does not exist in database', async () => {
    const req = new NextRequest('http://localhost:3000/api/books/download?token=non-existent-uuid');
    const res = await GET(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('not found');
    expect(mockDb.downloadLogsTable.length).toBe(0);
  });

  it('returns 403 Forbidden when token is revoked', async () => {
    mockDb.downloadTokensTable[0].is_revoked = true;

    const req = new NextRequest('http://localhost:3000/api/books/download?token=valid-token-uuid-1234');
    const res = await GET(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('revoked');
    expect(mockDb.downloadLogsTable.length).toBe(0);
  });

  it('returns 410 Gone when token has expired', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    mockDb.downloadTokensTable[0].expires_at = pastDate.toISOString();

    const req = new NextRequest('http://localhost:3000/api/books/download?token=valid-token-uuid-1234');
    const res = await GET(req);

    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error).toContain('expired');
    expect(mockDb.downloadLogsTable.length).toBe(0);
  });

  it('returns 403 Forbidden when token download quota is exhausted (download_count >= 5)', async () => {
    mockDb.downloadTokensTable[0].download_count = 5;

    const req = new NextRequest('http://localhost:3000/api/books/download?token=valid-token-uuid-1234');
    const res = await GET(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('quota exceeded');
    expect(mockDb.downloadLogsTable.length).toBe(0);
  });

  it('authorized download returns 200 OK with application/pdf binary and attachment filename header', async () => {
    const req = new NextRequest('http://localhost:3000/api/books/download?token=valid-token-uuid-1234', {
      headers: {
        'user-agent': 'Vitest-Test-Browser/1.0',
        'x-forwarded-for': '198.51.100.25',
      },
    });

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('content-disposition')).toBe(
      'attachment; filename="Designing_Data-Intensive_Applications.pdf"'
    );
    expect(res.headers.get('cache-control')).toBe('no-store, private');

    const arrayBuffer = await res.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThan(100);
    const headerPrefix = Buffer.from(arrayBuffer).subarray(0, 5).toString();
    expect(headerPrefix).toBe('%PDF-');
  });

  it('atomically increments download_count and commits client telemetry into download_logs', async () => {
    const req = new NextRequest('http://localhost:3000/api/books/download?token=valid-token-uuid-1234', {
      headers: {
        'user-agent': 'Chrome/120.0 (Windows NT 10.0)',
        'x-forwarded-for': '203.0.113.88',
      },
    });

    await GET(req);

    // Verify counter increment
    expect(mockDb.downloadTokensTable[0].download_count).toBe(1);

    // Verify audit log creation
    expect(mockDb.downloadLogsTable.length).toBe(1);
    const log = mockDb.downloadLogsTable[0];
    expect(log.download_token_id).toBe(1);
    expect(log.user_id).toBe(10);
    expect(log.book_id).toBe(101);
    expect(log.ip_address).toBe('203.0.113.88');
    expect(log.user_agent).toBe('Chrome/120.0 (Windows NT 10.0)');
  });
});
