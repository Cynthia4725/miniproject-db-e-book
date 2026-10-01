export interface MintTokenInput {
  userId: number | string;
  bookId: number | string;
  explicitToken?: string;
  explicitExpiresAt?: string;
  maxDownloads?: number;
}

export interface DownloadTokenEntity {
  id: number | string;
  token: string;
  userId: number | string;
  bookId: number | string;
  expiresAt: string;
  maxDownloads: number;
  downloadCount: number;
  isRevoked: boolean;
  createdAt: string;
}

export interface ClientTelemetryInput {
  ipAddress?: string;
  userAgent?: string;
}

export interface TokenVerificationResult {
  valid: boolean;
  token: string;
  bookId: number | string;
  userId: number | string;
  remainingDownloads: number;
  expiresAt: string;
}

export interface PublicDownloadTokenDto {
  token: string;
  remainingDownloads: number;
  maxDownloads: number;
  expiresAt: string;
}

export interface BookDownloadAuditStat {
  bookId: number | string;
  totalDownloads: number;
  uniqueDownloaders: number;
}

export interface UserDownloadAuditStat {
  userId: number | string;
  totalDownloads: number;
  uniqueBooksDownloaded: number;
}

