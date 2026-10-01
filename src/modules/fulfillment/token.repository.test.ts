import { describe, it, expect, beforeEach } from 'vitest';
import { DownloadTokenRepository } from './token.repository';
import { isValidUuid } from '@/lib/uuid';
import { DatabaseExecutor, setDatabaseExecutor } from '@/db/client';
import { ExpiredError, ForbiddenError, NotFoundError } from '@/lib/errors';

class MockTokenDatabaseExecutor implements DatabaseExecutor {
  public tokensTable: any[] = [];
  public downloadLogsTable: any[] = [];
  private nextTokenId = 1;
  private nextLogId = 1;

  async query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
    const trimmed = queryText.trim();

    // Insert Download Token
    if (trimmed.startsWith('INSERT INTO download_tokens')) {
      const token = params[0];
      if (this.tokensTable.some((t) => t.token === token)) {
        const error: any = new Error('duplicate key value violates unique constraint "download_tokens_token_key"');
        error.code = '23505';
        throw error;
      }
      const record = {
        id: this.nextTokenId++,
        token: token,
        user_id: params[1],
        book_id: params[2],
        expires_at: params[3],
        max_downloads: params[4] ?? 5,
        download_count: params[5] ?? 0,
        is_revoked: params[6] ?? false,
        created_at: new Date().toISOString(),
      };
      this.tokensTable.push(record);
      return [record] as unknown as T[];
    }

    // Find Token by token UUID
    if (trimmed.includes('FROM download_tokens') && trimmed.includes('WHERE token = $1')) {
      const found = this.tokensTable.find((t) => t.token === params[0]);
      return (found ? [found] : []) as unknown as T[];
    }

    // Increment download count
    if (trimmed.startsWith('UPDATE download_tokens') && trimmed.includes('download_count = download_count + 1')) {
      const tokenRecord = this.tokensTable.find((t) => t.id === params[0]);
      if (tokenRecord) {
        tokenRecord.download_count += 1;
        return [tokenRecord] as unknown as T[];
      }
      return [] as T[];
    }

    // Insert Download Log
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

    return [] as T[];
  }
}

describe('Download Token UUID Generation & Gated Verification Slice (Ticket 02)', () => {
  let mockDb: MockTokenDatabaseExecutor;
  let tokenRepo: DownloadTokenRepository;

  beforeEach(() => {
    mockDb = new MockTokenDatabaseExecutor();
    setDatabaseExecutor(mockDb);
    tokenRepo = new DownloadTokenRepository();
  });

  it('provisions a download token with UUID v4, internal BIGINT id, 30-day expiry, and quota 5', async () => {
    const tokenRecord = await tokenRepo.mintToken({
      userId: 10,
      bookId: 101,
    });

    expect(tokenRecord.id).toBeDefined();
    expect(typeof tokenRecord.id).toBe('number');
    expect(isValidUuid(tokenRecord.token)).toBe(true);
    expect(tokenRecord.maxDownloads).toBe(5);
    expect(tokenRecord.downloadCount).toBe(0);
    expect(tokenRecord.isRevoked).toBe(false);

    const expiryDate = new Date(tokenRecord.expiresAt);
    const now = new Date();
    const diffDays = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(Math.round(diffDays)).toBe(30);
  });

  it('rejects duplicate token insertion at the database constraint level', async () => {
    const first = await tokenRepo.mintToken({
      userId: 10,
      bookId: 101,
    });

    await expect(
      tokenRepo.mintToken({
        userId: 11,
        bookId: 102,
        explicitToken: first.token,
      })
    ).rejects.toThrow(/unique constraint/i);
  });

  it('retrieves and validates active download token by public UUID string', async () => {
    const created = await tokenRepo.mintToken({
      userId: 10,
      bookId: 101,
    });

    const status = await tokenRepo.verifyAndConsumeToken(created.token, {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Vitest',
    });

    expect(status.valid).toBe(true);
    expect(status.remainingDownloads).toBe(4);
    expect(mockDb.tokensTable[0].download_count).toBe(1);
    expect(mockDb.downloadLogsTable.length).toBe(1);
    expect(mockDb.downloadLogsTable[0].download_token_id).toBe(created.id);
  });

  it('fails with NotFoundError when token UUID does not exist', async () => {
    await expect(
      tokenRepo.verifyAndConsumeToken('00000000-0000-4000-8000-000000000000', {
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent',
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('fails with ExpiredError when token has expired', async () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const token = await tokenRepo.mintToken({
      userId: 10,
      bookId: 101,
      explicitExpiresAt: pastDate,
    });

    await expect(
      tokenRepo.verifyAndConsumeToken(token.token, {
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent',
      })
    ).rejects.toThrow(ExpiredError);
  });

  it('fails with ForbiddenError when token quota is exhausted', async () => {
    const token = await tokenRepo.mintToken({
      userId: 10,
      bookId: 101,
    });

    // Exhaust 5 downloads
    mockDb.tokensTable[0].download_count = 5;

    await expect(
      tokenRepo.verifyAndConsumeToken(token.token, {
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent',
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it('does not expose internal BIGINT id in public token DTO', async () => {
    const token = await tokenRepo.mintToken({
      userId: 10,
      bookId: 101,
    });

    const publicDto = tokenRepo.toPublicDto(token);
    expect((publicDto as any).id).toBeUndefined();
    expect(publicDto.token).toBe(token.token);
    expect(publicDto.remainingDownloads).toBe(5);
  });
});
