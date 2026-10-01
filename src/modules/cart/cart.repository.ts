import { getDatabaseExecutor, mapDatabaseError } from '@/db/client';
import { generateUuidV4 } from '@/lib/uuid';
import { ValidationError, NotFoundError } from '@/lib/errors';
import {
  ActiveCartDemandStat,
  CartEntity,
  CartItemDetail,
  CartItemEntity,
  CartWithItemsDto,
  CheckoutInput,
  CheckoutResultDto,
} from './cart.dto';

export class CartRepository {
  private db = getDatabaseExecutor();

  /**
   * Ticket 01: Get or automatically create user shopping cart
   */
  async getOrCreateCart(userId: number | string): Promise<CartEntity> {
    try {
      const selectQuery = `
        SELECT id, user_id, updated_at 
        FROM carts 
        WHERE user_id = $1 
        LIMIT 1;
      `;
      const existing = await this.db.query(selectQuery, [userId]);
      if (existing && existing.length > 0) {
        return {
          id: existing[0].id,
          userId: existing[0].user_id,
          updatedAt: existing[0].updated_at,
        };
      }

      const insertQuery = `
        INSERT INTO carts (user_id)
        VALUES ($1)
        RETURNING id, user_id, updated_at;
      `;
      const created = await this.db.query(insertQuery, [userId]);
      return {
        id: created[0].id,
        userId: created[0].user_id,
        updatedAt: created[0].updated_at,
      };
    } catch (err) {
      throw mapDatabaseError(err);
    }
  }

  /**
   * Ticket 01: Add item to cart with digital goods idempotency
   */
  async addItem(cartId: number | string, bookId: number | string): Promise<CartItemEntity> {
    try {
      const query = `
        INSERT INTO cart_items (cart_id, book_id)
        VALUES ($1, $2)
        ON CONFLICT (cart_id, book_id) DO UPDATE SET cart_id = EXCLUDED.cart_id
        RETURNING id, cart_id, book_id, added_at;
      `;
      const rows = await this.db.query(query, [cartId, bookId]);
      const row = rows[0];
      return {
        id: row.id,
        cartId: row.cart_id,
        bookId: row.book_id,
        addedAt: row.added_at,
      };
    } catch (err) {
      throw mapDatabaseError(err);
    }
  }

  /**
   * Ticket 01: Remove item from cart
   */
  async removeItem(cartId: number | string, bookId: number | string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM cart_items 
        WHERE cart_id = $1 AND book_id = $2;
      `;
      await this.db.query(query, [cartId, bookId]);
      return true;
    } catch (err) {
      throw mapDatabaseError(err);
    }
  }

  /**
   * Ticket 01: Get active cart with items and catalog details
   */
  async getCartWithItems(userId: number | string): Promise<CartWithItemsDto> {
    const cart = await this.getOrCreateCart(userId);

    const query = `
      SELECT 
        ci.id,
        ci.cart_id,
        ci.book_id,
        ci.added_at,
        b.title,
        b.cover_image_url,
        b.price,
        b.discount_price
      FROM cart_items ci
      JOIN books b ON ci.book_id = b.id
      WHERE ci.cart_id = $1
      ORDER BY ci.added_at ASC;
    `;

    const rows = await this.db.query(query, [cart.id]);

    let subtotal = 0;
    const items: CartItemDetail[] = (rows || []).map((row) => {
      const price = Number(row.price);
      const discountPrice = row.discount_price != null ? Number(row.discount_price) : null;
      const effectivePrice = discountPrice !== null ? discountPrice : price;
      subtotal += effectivePrice;

      return {
        id: row.id,
        cartId: row.cart_id,
        bookId: row.book_id,
        title: row.title,
        coverImageUrl: row.cover_image_url,
        price,
        discountPrice,
        effectivePrice,
        addedAt: row.added_at,
      };
    });

    return {
      cartId: cart.id,
      userId: cart.userId,
      items,
      totalItems: items.length,
      subtotal,
      updatedAt: cart.updatedAt,
    };
  }

  /**
   * Ticket 02: Cascade delete user for relational cascade verification
   */
  async deleteUserCascade(userId: number | string): Promise<void> {
    try {
      await this.db.query('DELETE FROM users WHERE id = $1;', [userId]);
    } catch (err) {
      throw mapDatabaseError(err);
    }
  }

  /**
   * Ticket 02: Cascade delete book for relational cascade verification
   */
  async deleteBookCascade(bookId: number | string): Promise<void> {
    try {
      await this.db.query('DELETE FROM books WHERE id = $1;', [bookId]);
    } catch (err) {
      throw mapDatabaseError(err);
    }
  }

  /**
   * Ticket 02: Admin query for active cart demand statistics
   */
  async getActiveCartDemandStats(): Promise<ActiveCartDemandStat[]> {
    try {
      const query = `
        SELECT 
          ci.book_id,
          b.title,
          COUNT(*)::INT AS in_cart_count
        FROM cart_items ci
        JOIN books b ON ci.book_id = b.id
        GROUP BY ci.book_id, b.title
        ORDER BY in_cart_count DESC;
      `;
      const rows = await this.db.query(query);
      return (rows || []).map((row) => ({
        bookId: row.book_id,
        title: row.title,
        inCartCount: Number(row.in_cart_count),
      }));
    } catch (err) {
      throw mapDatabaseError(err);
    }
  }

  /**
   * Ticket 03: Atomic Cart-to-Order Checkout & Price Snapshot
   */
  async checkout(input: CheckoutInput): Promise<CheckoutResultDto> {
    const cart = await this.getOrCreateCart(input.userId);
    const cartData = await this.getCartWithItems(input.userId);

    if (!cartData.items || cartData.items.length === 0) {
      throw new ValidationError('Cannot checkout an empty shopping cart.');
    }

    const subtotal = cartData.subtotal;
    let discountAmount = 0;
    let couponId: number | string | null = null;

    if (input.couponCode && input.couponCode.trim()) {
      const couponQuery = `
        SELECT * FROM coupons 
        WHERE code = $1 AND is_active = TRUE
        LIMIT 1;
      `;
      const coupons = await this.db.query(couponQuery, [input.couponCode.trim()]);
      if (coupons && coupons.length > 0) {
        const coupon = coupons[0];
        const minSpend = Number(coupon.min_spend || 0);
        if (subtotal >= minSpend) {
          couponId = coupon.id;
          if (coupon.discount_type === 'PERCENTAGE') {
            discountAmount = subtotal * (Number(coupon.discount_value) / 100);
          } else {
            discountAmount = Number(coupon.discount_value);
          }
          discountAmount = Math.min(discountAmount, subtotal);
        }
      }
    }

    const netAmount = subtotal - discountAmount;
    const orderUuid = generateUuidV4();

    try {
      // 1. Insert order
      const insertOrderQuery = `
        INSERT INTO orders (
          order_number, user_id, subtotal_amount, discount_amount, net_amount, coupon_id, order_status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
        RETURNING id;
      `;
      const orderRows = await this.db.query(insertOrderQuery, [
        orderUuid,
        input.userId,
        subtotal,
        discountAmount,
        netAmount,
        couponId,
      ]);
      const orderId = orderRows[0].id;

      // 2. Snapshot frozen prices into order_items
      for (const item of cartData.items) {
        const insertItemQuery = `
          INSERT INTO order_items (order_id, book_id, unit_price)
          VALUES ($1, $2, $3);
        `;
        await this.db.query(insertItemQuery, [orderId, item.bookId, item.effectivePrice]);
      }

      // 3. Clear cart items
      await this.db.query('DELETE FROM cart_items WHERE cart_id = $1;', [cart.id]);

      return {
        orderId,
        orderNumber: orderUuid,
        subtotal,
        discountAmount,
        netAmount,
        itemCount: cartData.items.length,
      };
    } catch (err) {
      throw mapDatabaseError(err);
    }
  }
}
