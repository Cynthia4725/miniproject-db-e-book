import { describe, it, expect, beforeEach } from 'vitest';
import { LibraryRepository } from './library.repository';
import { DownloadTokenRepository } from './token.repository';
import { DatabaseExecutor, setDatabaseExecutor } from '@/db/client';
import { ForbiddenError, ExpiredError } from '@/lib/errors';

class MockLibraryDatabaseExecutor implements DatabaseExecutor {
  public booksTable: any[] = [
    {
      id: 101,
      title: 'Designing Data-Intensive Applications',
      cover_image_url: 'https://example.com/covers/ddia.jpg',
      file_format: 'PDF',
      file_size_bytes: 25000000,
    },
    {
      id: 102,
      title: 'Database Internals',
      cover_image_url: 'https://example.com/covers/dbi.jpg',
      file_format: 'PDF',
      file_size_bytes: 18000000,
    },
  ];

  public ordersTable: any[] = [];
  public userLibraryTable: any[] = [];
  public downloadTokensTable: any[] = [];
  public downloadLogsTable: any[] = [];
  private nextLogId = 1;

  async query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
    const trimmed = queryText.trim();

    // Query user library join books join orders
    if (trimmed.includes('FROM user_library') && trimmed.includes('JOIN books') && trimmed.includes('JOIN orders')) {
      const userId = params[0];
      const results: any[] = [];

      for (const entry of this.userLibraryTable) {
        if (String(entry.user_id) !== String(userId)) continue;
        const order = this.ordersTable.find((o) => String(o.id) === String(entry.order_id));
        if (!order || order.order_status !== 'PAID') continue;

        const book = this.booksTable.find((b) => String(b.id) === String(entry.book_id));
        if (!book) continue;

        results.push({
          library_id: entry.id,
          user_id: entry.user_id,
          book_id: entry.book_id,
          order_id: entry.order_id,
          granted_at: entry.granted_at,
          title: book.title,
          cover_image_url: book.cover_image_url,
          file_format: book.file_format,
          file_size_bytes: book.file_size_bytes,
          order_status: order.order_status,
        });
      }

      return results as unknown as T[];
    }

    // Find token
    if (trimmed.includes('FROM download_tokens') && trimmed.includes('WHERE token = $1')) {
      const token = this.downloadTokensTable.find((t) => t.token === params[0]);
      return (token ? [token] : []) as unknown as T[];
    }

    // Update download token count
    if (trimmed.startsWith('UPDATE download_tokens') && trimmed.includes('download_count = download_count + 1')) {
      const tokenId = params[0];
      const token = this.downloadTokensTable.find((t) => t.id === tokenId);
      if (token) {
        token.download_count += 1;
        return [token] as unknown as T[];
      }
      return [] as T[];
    }

    // Insert download log
    if (trimmed.startsWith('INSERT INTO download_logs')) {
      const log = {
        id: this.nextLogId++,
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

    // Download audit query by book
    if (trimmed.includes('FROM download_logs') && trimmed.includes('GROUP BY book_id')) {
      const statsMap = new Map<any, { total: number; userIds: Set<any> }>();
      for (const log of this.downloadLogsTable) {
        if (!statsMap.has(log.book_id)) {
          statsMap.set(log.book_id, { total: 0, userIds: new Set() });
        }
        const s = statsMap.get(log.book_id)!;
        s.total += 1;
        s.userIds.add(log.user_id);
      }

      const rows = Array.from(statsMap.entries()).map(([bookId, stat]) => ({
        book_id: bookId,
        total_downloads: stat.total,
        unique_downloaders: stat.userIds.size,
      }));
      return rows as unknown as T[];
    }

    // Download audit query by user
    if (trimmed.includes('FROM download_logs') && trimmed.includes('GROUP BY user_id')) {
      const statsMap = new Map<any, { total: number; bookIds: Set<any> }>();
      for (const log of this.downloadLogsTable) {
        if (!statsMap.has(log.user_id)) {
          statsMap.set(log.user_id, { total: 0, bookIds: new Set() });
        }
        const s = statsMap.get(log.user_id)!;
        s.total += 1;
        s.bookIds.add(log.book_id);
      }

      const rows = Array.from(statsMap.entries()).map(([userId, stat]) => ({
        user_id: userId,
        total_downloads: stat.total,
        unique_books_downloaded: stat.bookIds.size,
      }));
      return rows as unknown as T[];
    }

    return [] as T[];
  }
}

describe('Gated Library Ownership & Download Audit Telemetry Slice (Ticket 03)', () => {
  let mockDb: MockLibraryDatabaseExecutor;
  let libraryRepo: LibraryRepository;
  let tokenRepo: DownloadTokenRepository;

  beforeEach(() => {
    mockDb = new MockLibraryDatabaseExecutor();
    setDatabaseExecutor(mockDb);
    libraryRepo = new LibraryRepository();
    tokenRepo = new DownloadTokenRepository();

    // Seed Orders:
    // Order 1: PAID (book 101)
    // Order 2: PENDING (book 102)
    // Order 3: REJECTED (book 102)
    mockDb.ordersTable = [
      { id: 1, user_id: 50, order_status: 'PAID' },
      { id: 2, user_id: 50, order_status: 'PENDING' },
      { id: 3, user_id: 50, order_status: 'REJECTED' },
    ];

    // Seed library table
    mockDb.userLibraryTable = [
      { id: 1, user_id: 50, book_id: 101, order_id: 1, granted_at: '2026-10-01T10:00:00Z' },
      { id: 2, user_id: 50, book_id: 102, order_id: 2, granted_at: '2026-10-01T11:00:00Z' },
      { id: 3, user_id: 50, book_id: 102, order_id: 3, granted_at: '2026-10-01T12:00:00Z' },
    ];

    // Seed active download token for book 101
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 30);
    mockDb.downloadTokensTable = [
      {
        id: 1,
        token: 'token-uuid-101',
        user_id: 50,
        book_id: 101,
        expires_at: expiration.toISOString(),
        max_downloads: 5,
        download_count: 0,
        is_revoked: false,
        created_at: new Date().toISOString(),
      },
    ];
  });

  it('getUserLibrary returns only books associated with verified, PAID orders', async () => {
    const library = await libraryRepo.getUserLibrary(50);
    expect(library.length).toBe(1);
    expect(library[0].bookId).toBe(101);
    expect(library[0].title).toBe('Designing Data-Intensive Applications');
    expect(library[0].orderStatus).toBe('PAID');
  });

  it('guarantees books from unpaid (PENDING) or REJECTED orders do NOT appear in the user library', async () => {
    const library = await libraryRepo.getUserLibrary(50);
    const bookIds = library.map((item) => item.bookId);
    expect(bookIds).not.toContain(102);
  });

  it('transforms user library items to public DTO hiding orderId and internal libraryId', async () => {
    const library = await libraryRepo.getUserLibrary(50);
    const publicDto = libraryRepo.toPublicDto(library[0]);

    expect((publicDto as any).libraryId).toBeUndefined();
    expect((publicDto as any).orderId).toBeUndefined();
    expect((publicDto as any).orderStatus).toBeUndefined();
    expect(publicDto.bookId).toBe(101);
    expect(publicDto.title).toBe('Designing Data-Intensive Applications');
  });

  it('successfully fulfills a download request and commits client telemetry into download_logs', async () => {
    const result = await tokenRepo.verifyAndConsumeToken('token-uuid-101', {
      ipAddress: '203.0.113.195',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });

    expect(result.valid).toBe(true);
    expect(result.remainingDownloads).toBe(4);

    expect(mockDb.downloadLogsTable.length).toBe(1);
    const log = mockDb.downloadLogsTable[0];
    expect(log.download_token_id).toBe(1);
    expect(log.user_id).toBe(50);
    expect(log.book_id).toBe(101);
    expect(log.ip_address).toBe('203.0.113.195');
    expect(log.user_agent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
  });

  it('blocks download when token quota is exhausted (max_downloads reached)', async () => {
    mockDb.downloadTokensTable[0].download_count = 5;

    await expect(
      tokenRepo.verifyAndConsumeToken('token-uuid-101', { ipAddress: '127.0.0.1' })
    ).rejects.toThrow(ForbiddenError);
  });

  it('blocks download when token has expired', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    mockDb.downloadTokensTable[0].expires_at = pastDate.toISOString();

    await expect(
      tokenRepo.verifyAndConsumeToken('token-uuid-101', { ipAddress: '127.0.0.1' })
    ).rejects.toThrow(ExpiredError);
  });

  it('aggregates download activity per book and per user for analytical audit reporting', async () => {
    // Perform 3 downloads across two users
    await tokenRepo.verifyAndConsumeToken('token-uuid-101', { ipAddress: '1.1.1.1' });
    await tokenRepo.verifyAndConsumeToken('token-uuid-101', { ipAddress: '1.1.1.2' });

    // Another user downloading book 101
    mockDb.downloadTokensTable.push({
      id: 2,
      token: 'token-uuid-101-user51',
      user_id: 51,
      book_id: 101,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      max_downloads: 5,
      download_count: 0,
      is_revoked: false,
      created_at: new Date().toISOString(),
    });
    await tokenRepo.verifyAndConsumeToken('token-uuid-101-user51', { ipAddress: '1.1.1.3' });

    const bookStats = await tokenRepo.getDownloadAuditStatsByBook();
    expect(bookStats.length).toBe(1);
    expect(bookStats[0].bookId).toBe(101);
    expect(bookStats[0].totalDownloads).toBe(3);
    expect(bookStats[0].uniqueDownloaders).toBe(2);

    const userStats = await tokenRepo.getDownloadAuditStatsByUser();
    expect(userStats.length).toBe(2);
    const user50 = userStats.find((u) => u.userId === 50);
    expect(user50?.totalDownloads).toBe(2);
    expect(user50?.uniqueBooksDownloaded).toBe(1);
  });
});
