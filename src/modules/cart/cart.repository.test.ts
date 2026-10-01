import { describe, it, expect, beforeEach } from 'vitest';
import { CartRepository } from './cart.repository';
import { DatabaseExecutor, setDatabaseExecutor } from '@/db/client';
import { NotFoundError, ValidationError } from '@/lib/errors';

class MockCartDatabaseExecutor implements DatabaseExecutor {
  public usersTable: any[] = [
    { id: 1, name: 'Alice Customer', email: 'alice@example.com' },
    { id: 2, name: 'Bob Customer', email: 'bob@example.com' },
  ];

  public booksTable: any[] = [
    {
      id: 101,
      title: 'Designing Data-Intensive Applications',
      price: 650.0,
      discount_price: 590.0,
      cover_image_url: 'https://example.com/ddia.jpg',
      is_active: true,
    },
    {
      id: 102,
      title: 'Database Internals',
      price: 890.0,
      discount_price: null,
      cover_image_url: 'https://example.com/dbi.jpg',
      is_active: true,
    },
    {
      id: 103,
      title: 'Site Reliability Engineering',
      price: 750.0,
      discount_price: 700.0,
      cover_image_url: 'https://example.com/sre.jpg',
      is_active: true,
    },
  ];

  public couponsTable: any[] = [
    {
      id: 501,
      code: 'DISCOUNT50',
      discount_type: 'FIXED',
      discount_value: 50.0,
      min_spend: 500.0,
      valid_from: '2020-01-01',
      valid_to: '2030-01-01',
      usage_limit: 100,
      times_used: 0,
      is_active: true,
    },
    {
      id: 502,
      code: 'PERCENT10',
      discount_type: 'PERCENTAGE',
      discount_value: 10.0,
      min_spend: 100.0,
      valid_from: '2020-01-01',
      valid_to: '2030-01-01',
      usage_limit: 100,
      times_used: 0,
      is_active: true,
    },
  ];

  public cartsTable: any[] = [];
  public cartItemsTable: any[] = [];
  public ordersTable: any[] = [];
  public orderItemsTable: any[] = [];

  public shouldFailTransaction = false;

  async query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
    const normalized = queryText.replace(/\s+/g, ' ').trim();

    if (this.shouldFailTransaction && (normalized.startsWith('INSERT INTO orders') || normalized.startsWith('DELETE FROM cart_items'))) {
      throw new Error('Simulated atomic checkout transaction failure');
    }

    // 1. Find cart by user_id
    if (normalized.includes('FROM carts WHERE user_id = $1')) {
      const cart = this.cartsTable.find((c) => String(c.user_id) === String(params[0]));
      return (cart ? [cart] : []) as unknown as T[];
    }

    // 2. Find cart by id
    if (normalized.includes('FROM carts WHERE id = $1')) {
      const cart = this.cartsTable.find((c) => String(c.id) === String(params[0]));
      return (cart ? [cart] : []) as unknown as T[];
    }

    // 3. Insert cart
    if (normalized.startsWith('INSERT INTO carts')) {
      const userExists = this.usersTable.some((u) => String(u.id) === String(params[0]));
      if (!userExists) {
        const error: any = new Error('Foreign key violation in carts');
        error.code = '23503';
        throw error;
      }
      const newCart = {
        id: this.cartsTable.length + 1,
        user_id: params[0],
        updated_at: new Date().toISOString(),
      };
      this.cartsTable.push(newCart);
      return [newCart] as unknown as T[];
    }

    // 4. Find cart item by cart_id and book_id
    if (normalized.startsWith('SELECT') && normalized.includes('FROM cart_items WHERE cart_id = $1 AND book_id = $2')) {
      const item = this.cartItemsTable.find(
        (ci) => String(ci.cart_id) === String(params[0]) && String(ci.book_id) === String(params[1])
      );
      return (item ? [item] : []) as unknown as T[];
    }

    // 5. Insert cart item (idempotent / ON CONFLICT)
    if (normalized.startsWith('INSERT INTO cart_items')) {
      const cartId = params[0];
      const bookId = params[1];

      const cartExists = this.cartsTable.some((c) => String(c.id) === String(cartId));
      const bookExists = this.booksTable.some((b) => String(b.id) === String(bookId));
      if (!cartExists || !bookExists) {
        const error: any = new Error('Foreign key violation in cart_items');
        error.code = '23503';
        throw error;
      }

      const existing = this.cartItemsTable.find(
        (ci) => String(ci.cart_id) === String(cartId) && String(ci.book_id) === String(bookId)
      );

      if (existing) {
        // Idempotent ON CONFLICT DO NOTHING
        return [existing] as unknown as T[];
      }

      const newItem = {
        id: this.cartItemsTable.length + 1,
        cart_id: cartId,
        book_id: bookId,
        added_at: new Date().toISOString(),
      };
      this.cartItemsTable.push(newItem);
      return [newItem] as unknown as T[];
    }

    // 6. Delete specific cart item
    if (normalized.includes('DELETE FROM cart_items') && normalized.includes('book_id = $2')) {
      const initialLen = this.cartItemsTable.length;
      this.cartItemsTable = this.cartItemsTable.filter(
        (ci) => !(String(ci.cart_id) === String(params[0]) && String(ci.book_id) === String(params[1]))
      );
      return [{ count: initialLen - this.cartItemsTable.length }] as unknown as T[];
    }

    // 7. Delete all cart items for a cart
    if (normalized.includes('DELETE FROM cart_items WHERE cart_id = $1')) {
      const initialLen = this.cartItemsTable.length;
      this.cartItemsTable = this.cartItemsTable.filter(
        (ci) => String(ci.cart_id) !== String(params[0])
      );
      return [{ count: initialLen - this.cartItemsTable.length }] as unknown as T[];
    }

    // 8. Admin query: active cart demand stats (checked before general join)
    if (normalized.includes('FROM cart_items ci') && normalized.includes('GROUP BY ci.book_id')) {
      const counts: Record<string, number> = {};
      for (const item of this.cartItemsTable) {
        counts[String(item.book_id)] = (counts[String(item.book_id)] || 0) + 1;
      }
      const results = Object.entries(counts).map(([bookId, count]) => {
        const book = this.booksTable.find((b) => String(b.id) === bookId);
        return {
          book_id: Number(bookId),
          title: book?.title || 'Unknown',
          in_cart_count: count,
        };
      });
      return results as unknown as T[];
    }

    // 9. Join cart items with books
    if (normalized.includes('FROM cart_items ci') && normalized.includes('JOIN books b ON ci.book_id = b.id')) {
      const cartId = params[0];
      const items = this.cartItemsTable
        .filter((ci) => String(ci.cart_id) === String(cartId))
        .map((ci) => {
          const book = this.booksTable.find((b) => String(b.id) === String(ci.book_id));
          return {
            id: ci.id,
            cart_id: ci.cart_id,
            book_id: ci.book_id,
            added_at: ci.added_at,
            title: book?.title || 'Unknown Title',
            cover_image_url: book?.cover_image_url || null,
            price: Number(book?.price || 0),
            discount_price: book?.discount_price != null ? Number(book.discount_price) : null,
          };
        });
      return items as unknown as T[];
    }

    // 9. Cascade delete user
    if (normalized.startsWith('DELETE FROM users WHERE id = $1')) {
      const userId = params[0];
      this.usersTable = this.usersTable.filter((u) => String(u.id) !== String(userId));
      // Cascade to carts & cart_items
      const userCarts = this.cartsTable.filter((c) => String(c.user_id) === String(userId));
      const userCartIds = userCarts.map((c) => String(c.id));
      this.cartsTable = this.cartsTable.filter((c) => String(c.user_id) !== String(userId));
      this.cartItemsTable = this.cartItemsTable.filter((ci) => !userCartIds.includes(String(ci.cart_id)));
      return [{ count: 1 }] as unknown as T[];
    }

    // 10. Cascade delete book
    if (normalized.startsWith('DELETE FROM books WHERE id = $1')) {
      const bookId = params[0];
      this.booksTable = this.booksTable.filter((b) => String(b.id) !== String(bookId));
      // Cascade to cart_items
      this.cartItemsTable = this.cartItemsTable.filter((ci) => String(ci.book_id) !== String(bookId));
      return [{ count: 1 }] as unknown as T[];
    }


    // 12. Coupon lookup
    if (normalized.includes('FROM coupons WHERE code = $1')) {
      const coupon = this.couponsTable.find((c) => c.code === params[0] && c.is_active);
      return (coupon ? [coupon] : []) as unknown as T[];
    }

    // 13. Insert order
    if (normalized.startsWith('INSERT INTO orders')) {
      const order = {
        id: this.ordersTable.length + 1,
        order_number: params[0],
        user_id: params[1],
        subtotal_amount: params[2],
        discount_amount: params[3],
        net_amount: params[4],
        coupon_id: params[5],
        order_status: 'PENDING',
        created_at: new Date().toISOString(),
      };
      this.ordersTable.push(order);
      return [order] as unknown as T[];
    }

    // 14. Insert order item
    if (normalized.startsWith('INSERT INTO order_items')) {
      const item = {
        id: this.orderItemsTable.length + 1,
        order_id: params[0],
        book_id: params[1],
        unit_price: params[2],
        created_at: new Date().toISOString(),
      };
      this.orderItemsTable.push(item);
      return [item] as unknown as T[];
    }

    return [] as T[];
  }
}

describe('CartRepository Test Suite (Spec-0006 / ADR-0006)', () => {
  let mockDb: MockCartDatabaseExecutor;
  let cartRepo: CartRepository;

  beforeEach(() => {
    mockDb = new MockCartDatabaseExecutor();
    setDatabaseExecutor(mockDb);
    cartRepo = new CartRepository();
  });

  describe('Ticket 01: Cart Lifecycle & Digital Idempotency Slice', () => {
    it('creates a new cart automatically when user has no active cart', async () => {
      const cart = await cartRepo.getOrCreateCart(1);
      expect(cart).toBeDefined();
      expect(cart.userId).toBe(1);
      expect(mockDb.cartsTable.length).toBe(1);
    });

    it('returns the existing cart if user already has one', async () => {
      const cart1 = await cartRepo.getOrCreateCart(1);
      const cart2 = await cartRepo.getOrCreateCart(1);
      expect(cart1.id).toBe(cart2.id);
      expect(mockDb.cartsTable.length).toBe(1);
    });

    it('adds an e-book item into cart_items successfully', async () => {
      const cart = await cartRepo.getOrCreateCart(1);
      const item = await cartRepo.addItem(cart.id, 101);

      expect(item).toBeDefined();
      expect(item.cartId).toBe(cart.id);
      expect(item.bookId).toBe(101);
      expect(mockDb.cartItemsTable.length).toBe(1);
    });

    it('enforces digital goods idempotency: adding the same book twice does not duplicate rows', async () => {
      const cart = await cartRepo.getOrCreateCart(1);
      await cartRepo.addItem(cart.id, 101);
      await cartRepo.addItem(cart.id, 101);

      expect(mockDb.cartItemsTable.length).toBe(1);
    });

    it('throws NotFoundError when attempting to add a non-existent book', async () => {
      const cart = await cartRepo.getOrCreateCart(1);
      await expect(cartRepo.addItem(cart.id, 99999)).rejects.toThrow(NotFoundError);
    });

    it('removes an item from cart_items cleanly', async () => {
      const cart = await cartRepo.getOrCreateCart(1);
      await cartRepo.addItem(cart.id, 101);
      await cartRepo.addItem(cart.id, 102);
      expect(mockDb.cartItemsTable.length).toBe(2);

      await cartRepo.removeItem(cart.id, 101);
      expect(mockDb.cartItemsTable.length).toBe(1);
      expect(mockDb.cartItemsTable[0].book_id).toBe(102);
    });

    it('retrieves cart with items joined with catalog details and computes subtotal correctly', async () => {
      const cart = await cartRepo.getOrCreateCart(1);
      // Book 101 (discount_price 590) and Book 102 (price 890, no discount)
      await cartRepo.addItem(cart.id, 101);
      await cartRepo.addItem(cart.id, 102);

      const cartView = await cartRepo.getCartWithItems(1);
      expect(cartView.totalItems).toBe(2);
      expect(cartView.items.length).toBe(2);

      // Book 101 effective price is 590
      const item101 = cartView.items.find((i) => Number(i.bookId) === 101);
      expect(item101?.effectivePrice).toBe(590);
      expect(item101?.title).toBe('Designing Data-Intensive Applications');

      // Book 102 effective price is 890
      const item102 = cartView.items.find((i) => Number(i.bookId) === 102);
      expect(item102?.effectivePrice).toBe(890);

      // Subtotal = 590 + 890 = 1480
      expect(cartView.subtotal).toBe(1480);
    });
  });

  describe('Ticket 02: Referential Integrity & Cart Deletion Cascade Slice', () => {
    it('cascades and deletes cart and cart_items when user is deleted', async () => {
      const cart = await cartRepo.getOrCreateCart(1);
      await cartRepo.addItem(cart.id, 101);
      expect(mockDb.cartsTable.length).toBe(1);
      expect(mockDb.cartItemsTable.length).toBe(1);

      await cartRepo.deleteUserCascade(1);
      expect(mockDb.cartsTable.length).toBe(0);
      expect(mockDb.cartItemsTable.length).toBe(0);
    });

    it('cascades and purges book from all active carts when book is deleted from catalog', async () => {
      const cart1 = await cartRepo.getOrCreateCart(1);
      const cart2 = await cartRepo.getOrCreateCart(2);

      await cartRepo.addItem(cart1.id, 101);
      await cartRepo.addItem(cart2.id, 101);
      await cartRepo.addItem(cart1.id, 102);
      expect(mockDb.cartItemsTable.length).toBe(3);

      await cartRepo.deleteBookCascade(101);
      // Book 101 purged from both carts, only book 102 remains in cart 1
      expect(mockDb.cartItemsTable.length).toBe(1);
      expect(mockDb.cartItemsTable[0].book_id).toBe(102);
    });

    it('queries active cart demand stats for store administrators', async () => {
      const cart1 = await cartRepo.getOrCreateCart(1);
      const cart2 = await cartRepo.getOrCreateCart(2);

      await cartRepo.addItem(cart1.id, 101);
      await cartRepo.addItem(cart2.id, 101);
      await cartRepo.addItem(cart1.id, 102);

      const stats = await cartRepo.getActiveCartDemandStats();
      expect(stats.length).toBe(2);

      const stat101 = stats.find((s) => Number(s.bookId) === 101);
      expect(stat101?.inCartCount).toBe(2);

      const stat102 = stats.find((s) => Number(s.bookId) === 102);
      expect(stat102?.inCartCount).toBe(1);
    });
  });

  describe('Ticket 03: Atomic Cart-to-Order Checkout & Price Snapshot Slice', () => {
    it('throws ValidationError when attempting to checkout an empty cart', async () => {
      await expect(cartRepo.checkout({ userId: 1 })).rejects.toThrow(ValidationError);
    });

    it('atomically snapshots prices into order_items, creates order, and clears cart_items', async () => {
      const cart = await cartRepo.getOrCreateCart(1);
      await cartRepo.addItem(cart.id, 101); // 590
      await cartRepo.addItem(cart.id, 102); // 890

      const result = await cartRepo.checkout({ userId: 1 });
      expect(result).toBeDefined();
      expect(result.orderNumber).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(result.subtotal).toBe(1480);
      expect(result.discountAmount).toBe(0);
      expect(result.netAmount).toBe(1480);
      expect(result.itemCount).toBe(2);

      // Verify orders table
      expect(mockDb.ordersTable.length).toBe(1);
      expect(mockDb.ordersTable[0].order_status).toBe('PENDING');

      // Verify order_items table has snapshot prices
      expect(mockDb.orderItemsTable.length).toBe(2);
      const orderItem101 = mockDb.orderItemsTable.find((oi) => Number(oi.book_id) === 101);
      expect(orderItem101?.unit_price).toBe(590);

      // Verify cart_items was completely wiped
      expect(mockDb.cartItemsTable.length).toBe(0);
    });

    it('correctly calculates fixed discount coupon during checkout', async () => {
      const cart = await cartRepo.getOrCreateCart(1);
      await cartRepo.addItem(cart.id, 101); // 590

      const result = await cartRepo.checkout({
        userId: 1,
        couponCode: 'DISCOUNT50',
      });

      expect(result.subtotal).toBe(590);
      expect(result.discountAmount).toBe(50);
      expect(result.netAmount).toBe(540);
      expect(mockDb.cartItemsTable.length).toBe(0);
    });

    it('correctly calculates percentage discount coupon during checkout', async () => {
      const cart = await cartRepo.getOrCreateCart(1);
      await cartRepo.addItem(cart.id, 102); // 890

      const result = await cartRepo.checkout({
        userId: 1,
        couponCode: 'PERCENT10',
      });

      expect(result.subtotal).toBe(890);
      expect(result.discountAmount).toBe(89); // 10% of 890
      expect(result.netAmount).toBe(801);
      expect(mockDb.cartItemsTable.length).toBe(0);
    });

    it('rolls back and preserves cart_items if transaction fails', async () => {
      const cart = await cartRepo.getOrCreateCart(1);
      await cartRepo.addItem(cart.id, 101);

      mockDb.shouldFailTransaction = true;

      await expect(cartRepo.checkout({ userId: 1 })).rejects.toThrow();
      // Cart items must remain preserved
      expect(mockDb.cartItemsTable.length).toBe(1);
    });
  });
});
