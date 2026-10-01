import { isValidUuid } from './uuid';
import { ValidationError } from './errors';
import { OrderEntity, PublicOrderDto } from '@/modules/orders/order.dto';
import {
  DownloadTokenEntity,
  PublicDownloadTokenDto,
} from '@/modules/fulfillment/token.dto';

/**
 * Validates whether an incoming route/query parameter is a valid UUID.
 * Throws a ValidationError (HTTP 400) if invalid.
 */
export function validatePublicUuid(value: unknown, paramName: string = 'parameter'): string {
  if (!isValidUuid(value)) {
    throw new ValidationError(
      `Invalid ${paramName}: Expected a valid RFC 4122 UUID v4 identifier.`,
      'INVALID_UUID'
    );
  }
  return value;
}

/**
 * Sanitizes an OrderEntity for public external viewing, stripping internal numeric IDs.
 */
export function sanitizeOrderForPublic(order: OrderEntity): PublicOrderDto {
  return {
    orderNumber: order.orderNumber,
    subtotalAmount: order.subtotalAmount,
    discountAmount: order.discountAmount,
    netAmount: order.netAmount,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      bookId: item.bookId,
      unitPrice: item.unitPrice,
    })),
  };
}

/**
 * Prepares an OrderEntity for administrative inspection, preserving internal IDs for audit.
 */
export function sanitizeOrderForAdmin(order: OrderEntity): OrderEntity {
  return { ...order };
}

/**
 * Sanitizes a DownloadTokenEntity for public viewing, stripping internal token ID.
 */
export function sanitizeDownloadTokenForPublic(
  token: DownloadTokenEntity
): PublicDownloadTokenDto {
  const remaining = Math.max(0, token.maxDownloads - token.downloadCount);
  return {
    token: token.token,
    remainingDownloads: remaining,
    maxDownloads: token.maxDownloads,
    expiresAt: token.expiresAt,
  };
}

/**
 * Recursive security assertion proving that no internal sequential `id` exists in a public DTO.
 */
export function assertNoInternalIdLeaked(payload: any, path: string = 'root'): void {
  if (!payload || typeof payload !== 'object') {
    return;
  }

  if (Array.isArray(payload)) {
    payload.forEach((item, index) => {
      assertNoInternalIdLeaked(item, `${path}[${index}]`);
    });
    return;
  }

  for (const [key, value] of Object.entries(payload)) {
    if (key === 'id' && typeof value === 'number') {
      throw new Error(`Security leak: internal ID detected in public surface at ${path}.${key}`);
    }
    if (key === 'userId' || key === 'orderId' || key === 'user_id' || key === 'order_id') {
      throw new Error(`Security leak: internal foreign key detected in public surface at ${path}.${key}`);
    }
    if (value && typeof value === 'object') {
      assertNoInternalIdLeaked(value, `${path}.${key}`);
    }
  }
}
