import { describe, it, expect } from 'vitest';
import {
  validatePublicUuid,
  sanitizeOrderForPublic,
  sanitizeOrderForAdmin,
  sanitizeDownloadTokenForPublic,
  assertNoInternalIdLeaked,
} from '@/lib/sanitizer';
import { ValidationError } from '@/lib/errors';
import { OrderEntity } from '@/modules/orders/order.dto';
import { DownloadTokenEntity } from '@/modules/fulfillment/token.dto';

describe('Public DTO Sanitization & Tamper-Proof Error Handling Slice (Ticket 03)', () => {
  const sampleOrder: OrderEntity = {
    id: 1042,
    orderNumber: 'c0a80101-0000-4000-8000-000000000001',
    userId: 88,
    subtotalAmount: 1540.0,
    discountAmount: 100.0,
    netAmount: 1440.0,
    couponId: 5,
    orderStatus: 'PAID',
    createdAt: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-01T12:05:00Z',
    items: [
      {
        id: 501,
        orderId: 1042,
        bookId: 1,
        unitPrice: 650.0,
        createdAt: '2026-10-01T12:00:00Z',
      },
    ],
  };

  const sampleToken: DownloadTokenEntity = {
    id: 99,
    token: 'e0a80101-0000-4000-8000-000000000002',
    userId: 88,
    bookId: 1,
    expiresAt: '2026-11-01T12:00:00Z',
    maxDownloads: 5,
    downloadCount: 1,
    isRevoked: false,
    createdAt: '2026-10-01T12:00:00Z',
  };

  it('validates incoming URL parameter against RFC 4122 UUID format regex', () => {
    const validUuid = 'c0a80101-0000-4000-8000-000000000001';
    expect(validatePublicUuid(validUuid, 'order_number')).toBe(validUuid);
  });

  it('throws ValidationError (HTTP 400) immediately when supplied with a malformed non-UUID parameter', () => {
    expect(() => validatePublicUuid('1042', 'order_number')).toThrow(ValidationError);
    expect(() => validatePublicUuid('sql-injection-probe-1=1;', 'token')).toThrow(ValidationError);
    expect(() => validatePublicUuid(null, 'order_number')).toThrow(ValidationError);
    expect(() => validatePublicUuid('', 'token')).toThrow(ValidationError);
  });

  it('omits orders.id, user_id, and items[].orderId from public-facing DTO', () => {
    const publicDto = sanitizeOrderForPublic(sampleOrder);

    expect((publicDto as any).id).toBeUndefined();
    expect((publicDto as any).userId).toBeUndefined();
    expect(publicDto.orderNumber).toBe(sampleOrder.orderNumber);
    expect((publicDto.items[0] as any).id).toBeUndefined();
    expect((publicDto.items[0] as any).orderId).toBeUndefined();
    expect(publicDto.items[0].bookId).toBe(1);
    expect(publicDto.items[0].unitPrice).toBe(650.0);

    expect(() => assertNoInternalIdLeaked(publicDto)).not.toThrow();
  });

  it('omits download_tokens.id from public download status response', () => {
    const publicToken = sanitizeDownloadTokenForPublic(sampleToken);

    expect((publicToken as any).id).toBeUndefined();
    expect(publicToken.token).toBe(sampleToken.token);
    expect(publicToken.remainingDownloads).toBe(4);
    expect(publicToken.maxDownloads).toBe(5);

    expect(() => assertNoInternalIdLeaked(publicToken)).not.toThrow();
  });

  it('retains internal id in administrative DTO for staff inspection', () => {
    const adminDto = sanitizeOrderForAdmin(sampleOrder);
    expect(adminDto.id).toBe(1042);
    expect(adminDto.orderNumber).toBe(sampleOrder.orderNumber);
  });

  it('regression: fails assertNoInternalIdLeaked when raw database entity is passed', () => {
    expect(() => assertNoInternalIdLeaked(sampleOrder)).toThrow(
      /Security leak: internal ID detected in public surface/i
    );
  });
});
