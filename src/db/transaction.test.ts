import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseExecutor } from './client';
import { runTransaction } from './transaction';
import { ConflictError, ValidationError } from '@/lib/errors';

class MockTransactionalDatabaseExecutor implements DatabaseExecutor {
  public orders: any[] = [];
  public orderItems: any[] = [];
  public snapshotOrders: any[] = [];
  public snapshotOrderItems: any[] = [];
  public inTransaction = false;

  async query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
    const trimmed = queryText.trim();

    if (trimmed.startsWith('INSERT INTO orders')) {
      const order = { id: params[0], order_number: params[1], status: 'PENDING' };
      this.orders.push(order);
      return [order] as unknown as T[];
    }

    if (trimmed.startsWith('INSERT INTO order_items')) {
      if (params[1] === -999) {
        const err: any = new Error('Violates check constraint price > 0');
        err.code = '23514';
        throw err;
      }
      const item = { id: params[0], unit_price: params[1] };
      this.orderItems.push(item);
      return [item] as unknown as T[];
    }

    return [] as T[];
  }

  async transaction<T>(callback: (tx: DatabaseExecutor) => Promise<T>): Promise<T> {
    this.inTransaction = true;
    this.snapshotOrders = [...this.orders];
    this.snapshotOrderItems = [...this.orderItems];

    try {
      const result = await callback(this);
      this.inTransaction = false;
      return result;
    } catch (error) {
      // Rollback
      this.orders = [...this.snapshotOrders];
      this.orderItems = [...this.snapshotOrderItems];
      this.inTransaction = false;
      throw error;
    }
  }
}

describe('Atomic Multi-Query Transaction Execution & Rollback Slice (Ticket 02)', () => {
  let mockDb: MockTransactionalDatabaseExecutor;

  beforeEach(() => {
    mockDb = new MockTransactionalDatabaseExecutor();
  });

  it('successfully commits multi-statement operations within an atomic transaction', async () => {
    const result = await runTransaction(mockDb, async (tx) => {
      await tx.query('INSERT INTO orders (id, order_number) VALUES ($1, $2);', [1, 'ord-1001']);
      await tx.query('INSERT INTO order_items (id, unit_price) VALUES ($1, $2);', [10, 450.0]);
      return { orderId: 1, itemCount: 1 };
    });

    expect(result).toEqual({ orderId: 1, itemCount: 1 });
    expect(mockDb.orders.length).toBe(1);
    expect(mockDb.orderItems.length).toBe(1);
    expect(mockDb.orders[0].id).toBe(1);
    expect(mockDb.orderItems[0].id).toBe(10);
  });

  it('automatically rolls back preceding mutations if a subsequent statement fails', async () => {
    await expect(
      runTransaction(mockDb, async (tx) => {
        // Step 1: Insert order (succeeds)
        await tx.query('INSERT INTO orders (id, order_number) VALUES ($1, $2);', [2, 'ord-1002']);
        // Step 2: Insert order item with invalid price (triggers constraint check failure)
        await tx.query('INSERT INTO order_items (id, unit_price) VALUES ($1, $2);', [20, -999]);
      })
    ).rejects.toThrow(ValidationError);

    // Verify rollback: order #2 was NOT committed to the table!
    expect(mockDb.orders.length).toBe(0);
    expect(mockDb.orderItems.length).toBe(0);
  });

  it('leaves zero orphaned records in any participating tables upon mid-flight exception', async () => {
    // Seed initial state
    mockDb.orders = [{ id: 99, order_number: 'ord-existing', status: 'PENDING' }];

    await expect(
      runTransaction(mockDb, async (tx) => {
        await tx.query('INSERT INTO orders (id, order_number) VALUES ($1, $2);', [100, 'ord-orphaned']);
        throw new ConflictError('Simulated unexpected business conflict midway');
      })
    ).rejects.toThrow(ConflictError);

    // Initial state is intact, new order was rolled back
    expect(mockDb.orders.length).toBe(1);
    expect(mockDb.orders[0].id).toBe(99);
  });
});
