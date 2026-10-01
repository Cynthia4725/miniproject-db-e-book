import { describe, it, expect, beforeEach } from 'vitest';
import { OrderRepository } from './order.repository';
import { isValidUuid } from '@/lib/uuid';
import { DatabaseExecutor, setDatabaseExecutor } from '@/db/client';

class MockDatabaseExecutor implements DatabaseExecutor {
  public ordersTable: any[] = [];
  public orderItemsTable: any[] = [];
  public booksTable: any[] = [
    { id: 1, title: 'Designing Data-Intensive Applications', price: 650.0 },
    { id: 2, title: 'Database Internals', price: 890.0 },
  ];
  private nextOrderId = 1;
  private nextOrderItemId = 1;

  async query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
    const trimmed = queryText.trim();

    // Insert Order
    if (trimmed.startsWith('INSERT INTO orders')) {
      const orderNumber = params[0];
      // Check unique constraint on order_number
      if (this.ordersTable.some((o) => o.order_number === orderNumber)) {
        const error: any = new Error('duplicate key value violates unique constraint "orders_order_number_key"');
        error.code = '23505';
        throw error;
      }
      const order = {
        id: this.nextOrderId++,
        order_number: orderNumber,
        user_id: params[1],
        subtotal_amount: params[2],
        discount_amount: params[3] || 0,
        net_amount: params[4],
        coupon_id: params[5] || null,
        order_status: params[6] || 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.ordersTable.push(order);
      return [order] as unknown as T[];
    }

    // Insert Order Items
    if (trimmed.startsWith('INSERT INTO order_items')) {
      const item = {
        id: this.nextOrderItemId++,
        order_id: params[0],
        book_id: params[1],
        unit_price: params[2],
        created_at: new Date().toISOString(),
      };
      this.orderItemsTable.push(item);
      return [item] as unknown as T[];
    }

    // Find Order by order_number
    if (trimmed.includes('FROM orders') && trimmed.includes('WHERE order_number = $1')) {
      const order = this.ordersTable.find((o) => o.order_number === params[0]);
      return (order ? [order] : []) as unknown as T[];
    }

    // Find Order Items by order_id
    if (trimmed.includes('FROM order_items') && trimmed.includes('WHERE order_id = $1')) {
      const items = this.orderItemsTable.filter((i) => i.order_id === params[0]);
      return items as unknown as T[];
    }

    return [] as T[];
  }
}

describe('Order Public UUID Identification & Lookup Slice (Ticket 01)', () => {
  let mockDb: MockDatabaseExecutor;
  let orderRepo: OrderRepository;

  beforeEach(() => {
    mockDb = new MockDatabaseExecutor();
    setDatabaseExecutor(mockDb);
    orderRepo = new OrderRepository();
  });

  it('automatically populates order_number with a valid UUID v4 distinct from internal BIGINT id', async () => {
    const order = await orderRepo.createOrder({
      userId: 10,
      subtotalAmount: 1540.0,
      discountAmount: 0,
      netAmount: 1540.0,
      items: [
        { bookId: 1, unitPrice: 650.0 },
        { bookId: 2, unitPrice: 890.0 },
      ],
    });

    expect(order.id).toBeDefined();
    expect(typeof order.id).toBe('number');
    expect(order.orderNumber).toBeDefined();
    expect(isValidUuid(order.orderNumber)).toBe(true);
    expect(order.orderStatus).toBe('PENDING');
  });

  it('enforces unique constraint on order_number and rejects duplicates', async () => {
    const firstOrder = await orderRepo.createOrder({
      userId: 10,
      subtotalAmount: 650.0,
      netAmount: 650.0,
      items: [{ bookId: 1, unitPrice: 650.0 }],
    });

    // Attempting to create an order with the same order_number explicitly must violate uniqueness
    await expect(
      orderRepo.createOrder({
        userId: 11,
        subtotalAmount: 650.0,
        netAmount: 650.0,
        items: [{ bookId: 1, unitPrice: 650.0 }],
        explicitOrderNumber: firstOrder.orderNumber,
      })
    ).rejects.toThrow(/unique constraint/i);
  });

  it('links order items using the internal BIGINT order_id foreign key', async () => {
    const order = await orderRepo.createOrder({
      userId: 10,
      subtotalAmount: 1540.0,
      netAmount: 1540.0,
      items: [
        { bookId: 1, unitPrice: 650.0 },
        { bookId: 2, unitPrice: 890.0 },
      ],
    });

    expect(mockDb.orderItemsTable.length).toBe(2);
    expect(mockDb.orderItemsTable[0].order_id).toBe(order.id);
    expect(mockDb.orderItemsTable[1].order_id).toBe(order.id);
    expect(mockDb.orderItemsTable[0].order_id).not.toBe(order.orderNumber);
  });

  it('retrieves order and its child items using public order_number UUID', async () => {
    const created = await orderRepo.createOrder({
      userId: 10,
      subtotalAmount: 650.0,
      netAmount: 650.0,
      items: [{ bookId: 1, unitPrice: 650.0 }],
    });

    const found = await orderRepo.findByOrderNumber(created.orderNumber);
    expect(found).not.toBeNull();
    expect(found?.orderNumber).toBe(created.orderNumber);
    expect(found?.items.length).toBe(1);
    expect(found?.items[0].unitPrice).toBe(650.0);
  });

  it('preserves frozen unit_price even if catalog book price changes later', async () => {
    const order = await orderRepo.createOrder({
      userId: 10,
      subtotalAmount: 650.0,
      netAmount: 650.0,
      items: [{ bookId: 1, unitPrice: 650.0 }],
    });

    // Simulate book catalog price update
    mockDb.booksTable[0].price = 999.0;

    const fetched = await orderRepo.findByOrderNumber(order.orderNumber);
    expect(fetched?.items[0].unitPrice).toBe(650.0);
  });

  it('does not expose internal BIGINT id in public DTO representation', async () => {
    const created = await orderRepo.createOrder({
      userId: 10,
      subtotalAmount: 650.0,
      netAmount: 650.0,
      items: [{ bookId: 1, unitPrice: 650.0 }],
    });

    const publicDto = orderRepo.toPublicDto(created);
    expect((publicDto as any).id).toBeUndefined();
    expect(publicDto.orderNumber).toBe(created.orderNumber);
    expect(publicDto.items[0]).not.toHaveProperty('orderId');
  });
});
