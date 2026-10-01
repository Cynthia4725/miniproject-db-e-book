import { getDatabaseExecutor } from '@/db/client';
import { generateUuidV4 } from '@/lib/uuid';
import {
  ClientTelemetryInput,
  DownloadTokenEntity,
  MintTokenInput,
  PublicDownloadTokenDto,
  TokenVerificationResult,
} from './token.dto';
import { ExpiredError, ForbiddenError, NotFoundError } from '@/lib/errors';

export class DownloadTokenRepository {
  private db = getDatabaseExecutor();

  async mintToken(input: MintTokenInput): Promise<DownloadTokenEntity> {
    const token = input.explicitToken || generateUuidV4();
    const maxDownloads = input.maxDownloads ?? 5;
    const downloadCount = 0;
    const isRevoked = false;

    // Default 30-day expiration
    let expiresAt = input.explicitExpiresAt;
    if (!expiresAt) {
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + 30);
      expiresAt = expiration.toISOString();
    }

    const insertQuery = `
      INSERT INTO download_tokens (
        token, user_id, book_id, expires_at, max_downloads, download_count, is_revoked
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const rows = await this.db.query(insertQuery, [
      token,
      input.userId,
      input.bookId,
      expiresAt,
      maxDownloads,
      downloadCount,
      isRevoked,
    ]);

    const created = rows[0];
    return {
      id: created.id,
      token: created.token,
      userId: created.user_id,
      bookId: created.book_id,
      expiresAt: created.expires_at,
      maxDownloads: Number(created.max_downloads),
      downloadCount: Number(created.download_count),
      isRevoked: Boolean(created.is_revoked),
      createdAt: created.created_at,
    };
  }

  async findByToken(token: string): Promise<DownloadTokenEntity | null> {
    const query = `
      SELECT * FROM download_tokens WHERE token = $1 LIMIT 1;
    `;
    const rows = await this.db.query(query, [token]);
    if (!rows || rows.length === 0) {
      return null;
    }
    const row = rows[0];
    return {
      id: row.id,
      token: row.token,
      userId: row.user_id,
      bookId: row.book_id,
      expiresAt: row.expires_at,
      maxDownloads: Number(row.max_downloads),
      downloadCount: Number(row.download_count),
      isRevoked: Boolean(row.is_revoked),
      createdAt: row.created_at,
    };
  }

  async verifyAndConsumeToken(
    token: string,
    telemetry: ClientTelemetryInput = {}
  ): Promise<TokenVerificationResult> {
    const tokenRecord = await this.findByToken(token);
    if (!tokenRecord) {
      throw new NotFoundError(`Download token not found: ${token}`);
    }

    if (tokenRecord.isRevoked) {
      throw new ForbiddenError('Download token has been revoked.');
    }

    const now = new Date();
    const expiry = new Date(tokenRecord.expiresAt);
    if (now > expiry) {
      throw new ExpiredError('Download link has expired.');
    }

    if (tokenRecord.downloadCount >= tokenRecord.maxDownloads) {
      throw new ForbiddenError(
        `Download quota exceeded. Maximum ${tokenRecord.maxDownloads} downloads allowed.`
      );
    }

    // Atomic increment
    const updateQuery = `
      UPDATE download_tokens 
      SET download_count = download_count + 1 
      WHERE id = $1
      RETURNING *;
    `;
    await this.db.query(updateQuery, [tokenRecord.id]);

    // Insert into download_logs
    const insertLogQuery = `
      INSERT INTO download_logs (
        download_token_id, user_id, book_id, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    await this.db.query(insertLogQuery, [
      tokenRecord.id,
      tokenRecord.userId,
      tokenRecord.bookId,
      telemetry.ipAddress || null,
      telemetry.userAgent || null,
    ]);

    const remaining = tokenRecord.maxDownloads - (tokenRecord.downloadCount + 1);

    return {
      valid: true,
      token: tokenRecord.token,
      bookId: tokenRecord.bookId,
      userId: tokenRecord.userId,
      remainingDownloads: remaining,
      expiresAt: tokenRecord.expiresAt,
    };
  }

  toPublicDto(token: DownloadTokenEntity): PublicDownloadTokenDto {
    const remaining = Math.max(0, token.maxDownloads - token.downloadCount);
    return {
      token: token.token,
      remainingDownloads: remaining,
      maxDownloads: token.maxDownloads,
      expiresAt: token.expiresAt,
    };
  }
}
