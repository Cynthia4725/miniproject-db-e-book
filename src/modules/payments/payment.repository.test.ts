import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentRepository } from './payment.repository';
import { DatabaseExecutor, setDatabaseExecutor } from '@/db/client';
import { InvalidStateTransitionError, NotFoundError, ValidationError } from '@/lib/errors';

class MockPaymentDatabaseExecutor implements DatabaseExecutor {
  public ordersTable: any[] = [];
  public orderItemsTable: any[] = [];
  public paymentsTable: any[] = [];
  public userLibraryTable: any[] = [];
  public downloadTokensTable: any[] = [];
  private nextPaymentId = 1;
  public simulateFailureOnPaymentInsert = false;

  async query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
    const trimmed = queryText.trim();

    // Find order by ID
    if (trimmed.includes('FROM orders') && trimmed.includes('WHERE id = $1')) {
      const order = this.ordersTable.find((o) => String(o.id) === String(params[0]));
      return (order ? [order] : []) as unknown as T[];
    }

    // Find order by order_number
    if (trimmed.includes('FROM orders') && trimmed.includes('WHERE order_number = $1')) {
      const order = this.ordersTable.find((o) => o.order_number === params[0]);
      return (order ? [order] : []) as unknown as T[];
    }

    // Insert Payment
    if (trimmed.startsWith('INSERT INTO payments')) {
      if (this.simulateFailureOnPaymentInsert) {
        throw new Error('Database disk error during payment insertion');
      }
      const payment = {
        id: this.nextPaymentId++,
        order_id: params[0],
        payment_method: params[1] || 'PROMPTPAY',
        amount_paid: params[2],
        slip_image_url: params[3],
        transferred_at: params[4],
        status: params[5] || 'PENDING_REVIEW',
        verified_by_user_id: null,
        verified_at: null,
        rejection_reason: null,
        created_at: new Date().toISOString(),
      };
      this.paymentsTable.push(payment);
      return [payment] as unknown as T[];
    }

    // Update order status
    if (trimmed.startsWith('UPDATE orders SET order_status = $1')) {
      const newStatus = params[0];
      const orderId = params[1];
      const order = this.ordersTable.find((o) => String(o.id) === String(orderId));
      if (order) {
        order.order_status = newStatus;
        order.updated_at = new Date().toISOString();
        return [order] as unknown as T[];
      }
      return [] as T[];
    }

    // Find payments for order
    if (trimmed.includes('FROM payments') && trimmed.includes('WHERE order_id = $1')) {
      const payments = this.paymentsTable.filter((p) => String(p.order_id) === String(params[0]));
      return payments as unknown as T[];
    }

    // Find single payment by ID
    if (trimmed.includes('FROM payments') && trimmed.includes('WHERE id = $1')) {
      const payment = this.paymentsTable.find((p) => String(p.id) === String(params[0]));
      return (payment ? [payment] : []) as unknown as T[];
    }

    // Find order items by order_id
    if (trimmed.includes('FROM order_items') && trimmed.includes('WHERE order_id = $1')) {
      const items = this.orderItemsTable.filter((i) => String(i.order_id) === String(params[0]));
      return items as unknown as T[];
    }


    // Update payment record (admin review)
    if (trimmed.startsWith('UPDATE payments SET')) {
      // SET status = $1, verified_by_user_id = $2, verified_at = $3, rejection_reason = $4 WHERE id = $5
      const paymentId = params[4];
      const payment = this.paymentsTable.find((p) => String(p.id) === String(paymentId));
      if (payment) {
        payment.status = params[0];
        payment.verified_by_user_id = params[1];
        payment.verified_at = params[2];
        payment.rejection_reason = params[3];
        return [payment] as unknown as T[];
      }
      return [] as T[];
    }

    // Insert into user_library
    if (trimmed.startsWith('INSERT INTO user_library')) {
      const entry = {
        id: this.userLibraryTable.length + 1,
        user_id: params[0],
        book_id: params[1],
        order_id: params[2],
        granted_at: new Date().toISOString(),
      };
      // Unique constraint on (user_id, book_id)
      const exists = this.userLibraryTable.find(
        (e) => String(e.user_id) === String(entry.user_id) && String(e.book_id) === String(entry.book_id)
      );
      if (!exists) {
        this.userLibraryTable.push(entry);
      }
      return [entry] as unknown as T[];
    }

    // Insert into download_tokens
    if (trimmed.startsWith('INSERT INTO download_tokens')) {
      const tokenRecord = {
        id: this.downloadTokensTable.length + 1,
        token: params[0],
        user_id: params[1],
        book_id: params[2],
        expires_at: params[3],
        max_downloads: params[4] || 5,
        download_count: 0,
        is_revoked: false,
        created_at: new Date().toISOString(),
      };
      this.downloadTokensTable.push(tokenRecord);
      return [tokenRecord] as unknown as T[];
    }

    return [] as T[];
  }
}


describe('Payment Slip Submission & State Transition Slice (Ticket 01)', () => {
  let mockDb: MockPaymentDatabaseExecutor;
  let paymentRepo: PaymentRepository;

  beforeEach(() => {
    mockDb = new MockPaymentDatabaseExecutor();
    setDatabaseExecutor(mockDb);
    paymentRepo = new PaymentRepository();

    // Seed mock order
    mockDb.ordersTable = [
      {
        id: 100,
        order_number: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        user_id: 10,
        subtotal_amount: 650.0,
        discount_amount: 0,
        net_amount: 650.0,
        order_status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  });

  it('submits payment evidence and creates a row in payments table with status PENDING_REVIEW', async () => {
    const payment = await paymentRepo.submitPaymentSlip({
      orderId: 100,
      paymentMethod: 'PROMPTPAY',
      amountPaid: 650.0,
      slipImageUrl: 'https://storage.example.com/slips/slip-100.jpg',
      transferredAt: '2026-10-02T00:30:00Z',
    });

    expect(payment.id).toBeDefined();
    expect(payment.orderId).toBe(100);
    expect(payment.status).toBe('PENDING_REVIEW');
    expect(payment.paymentMethod).toBe('PROMPTPAY');
    expect(payment.amountPaid).toBe(650.0);
    expect(payment.slipImageUrl).toBe('https://storage.example.com/slips/slip-100.jpg');
    expect(payment.transferredAt).toBe('2026-10-02T00:30:00Z');
    expect(mockDb.paymentsTable.length).toBe(1);
  });

  it('atomically transitions order_status from PENDING to PAYMENT_SUBMITTED', async () => {
    await paymentRepo.submitPaymentSlip({
      orderId: 100,
      amountPaid: 650.0,
      slipImageUrl: 'https://storage.example.com/slips/slip-100.jpg',
      transferredAt: '2026-10-02T00:30:00Z',
    });

    const updatedOrder = mockDb.ordersTable.find((o) => o.id === 100);
    expect(updatedOrder?.order_status).toBe('PAYMENT_SUBMITTED');
  });

  it('throws NotFoundError if the order does not exist', async () => {
    await expect(
      paymentRepo.submitPaymentSlip({
        orderId: 9999,
        amountPaid: 650.0,
        slipImageUrl: 'https://storage.example.com/slips/slip-9999.jpg',
        transferredAt: '2026-10-02T00:30:00Z',
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('throws InvalidStateTransitionError when submitting slip for an order already in PAID status', async () => {
    mockDb.ordersTable[0].order_status = 'PAID';

    await expect(
      paymentRepo.submitPaymentSlip({
        orderId: 100,
        amountPaid: 650.0,
        slipImageUrl: 'https://storage.example.com/slips/slip-100.jpg',
        transferredAt: '2026-10-02T00:30:00Z',
      })
    ).rejects.toThrow(InvalidStateTransitionError);
  });

  it('throws InvalidStateTransitionError when submitting slip for an order in REJECTED status', async () => {
    mockDb.ordersTable[0].order_status = 'REJECTED';

    await expect(
      paymentRepo.submitPaymentSlip({
        orderId: 100,
        amountPaid: 650.0,
        slipImageUrl: 'https://storage.example.com/slips/slip-100.jpg',
        transferredAt: '2026-10-02T00:30:00Z',
      })
    ).rejects.toThrow(InvalidStateTransitionError);
  });

  it('throws InvalidStateTransitionError when submitting slip for an order in CANCELLED status', async () => {
    mockDb.ordersTable[0].order_status = 'CANCELLED';

    await expect(
      paymentRepo.submitPaymentSlip({
        orderId: 100,
        amountPaid: 650.0,
        slipImageUrl: 'https://storage.example.com/slips/slip-100.jpg',
        transferredAt: '2026-10-02T00:30:00Z',
      })
    ).rejects.toThrow(InvalidStateTransitionError);
  });

  it('ensures rollback/safety: if payment insertion fails, order status remains PENDING', async () => {
    mockDb.simulateFailureOnPaymentInsert = true;

    await expect(
      paymentRepo.submitPaymentSlip({
        orderId: 100,
        amountPaid: 650.0,
        slipImageUrl: 'https://storage.example.com/slips/slip-100.jpg',
        transferredAt: '2026-10-02T00:30:00Z',
      })
    ).rejects.toThrow(/disk error/i);

    const order = mockDb.ordersTable.find((o) => o.id === 100);
    expect(order?.order_status).toBe('PENDING');
  });

  it('retrieves payment history for an order', async () => {
    await paymentRepo.submitPaymentSlip({
      orderId: 100,
      amountPaid: 650.0,
      slipImageUrl: 'https://storage.example.com/slips/slip-100.jpg',
      transferredAt: '2026-10-02T00:30:00Z',
    });

    const payments = await paymentRepo.getPaymentsByOrderId(100);
    expect(payments.length).toBe(1);
    expect(payments[0].orderId).toBe(100);
    expect(payments[0].status).toBe('PENDING_REVIEW');
  });

  it('transforms payment entity to public DTO hiding internal IDs', async () => {
    const payment = await paymentRepo.submitPaymentSlip({
      orderId: 100,
      amountPaid: 650.0,
      slipImageUrl: 'https://storage.example.com/slips/slip-100.jpg',
      transferredAt: '2026-10-02T00:30:00Z',
    });

    const publicDto = paymentRepo.toPublicDto(payment);
    expect((publicDto as any).id).toBeUndefined();
    expect((publicDto as any).orderId).toBeUndefined();
    expect((publicDto as any).verifiedByUserId).toBeUndefined();
    expect(publicDto.amountPaid).toBe(650.0);
    expect(publicDto.status).toBe('PENDING_REVIEW');
  });
});

describe('Admin Payment Verification & Atomic Fulfillment Slice (Ticket 02)', () => {
  let mockDb: MockPaymentDatabaseExecutor;
  let paymentRepo: PaymentRepository;
  let submittedPaymentId: number;

  beforeEach(async () => {
    mockDb = new MockPaymentDatabaseExecutor();
    setDatabaseExecutor(mockDb);
    paymentRepo = new PaymentRepository();

    // Seed mock order
    mockDb.ordersTable = [
      {
        id: 200,
        order_number: 'b2c3d4e5-f6a7-4b5c-9d0e-123456789abc',
        user_id: 42,
        subtotal_amount: 1540.0,
        discount_amount: 0,
        net_amount: 1540.0,
        order_status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Seed order items (2 books)
    mockDb.orderItemsTable = [
      { id: 1, order_id: 200, book_id: 101, unit_price: 650.0 },
      { id: 2, order_id: 200, book_id: 102, unit_price: 890.0 },
    ];

    // Submit payment slip to put order into PAYMENT_SUBMITTED
    const payment = await paymentRepo.submitPaymentSlip({
      orderId: 200,
      amountPaid: 1540.0,
      slipImageUrl: 'https://storage.example.com/slips/slip-200.jpg',
      transferredAt: '2026-10-02T00:30:00Z',
    });
    submittedPaymentId = Number(payment.id);
  });

  it('approving a payment atomically updates payment status to APPROVED with admin ID and timestamp', async () => {
    const result = await paymentRepo.reviewPayment({
      paymentId: submittedPaymentId,
      adminUserId: 999,
      decision: 'APPROVED',
    });

    expect(result.payment.status).toBe('APPROVED');
    expect(result.payment.verifiedByUserId).toBe(999);
    expect(result.payment.verifiedAt).toBeDefined();
  });

  it('approving a payment atomically transitions orders.order_status from PAYMENT_SUBMITTED to PAID', async () => {
    const result = await paymentRepo.reviewPayment({
      paymentId: submittedPaymentId,
      adminUserId: 999,
      decision: 'APPROVED',
    });

    expect(result.orderStatus).toBe('PAID');
    const order = mockDb.ordersTable.find((o) => o.id === 200);
    expect(order?.order_status).toBe('PAID');
  });

  it('approving a payment atomically inserts purchased books into user_library', async () => {
    await paymentRepo.reviewPayment({
      paymentId: submittedPaymentId,
      adminUserId: 999,
      decision: 'APPROVED',
    });

    expect(mockDb.userLibraryTable.length).toBe(2);
    expect(mockDb.userLibraryTable.map((e) => e.book_id)).toEqual(
      expect.arrayContaining([101, 102])
    );
    expect(mockDb.userLibraryTable[0].user_id).toBe(42);
    expect(mockDb.userLibraryTable[1].user_id).toBe(42);
  });

  it('approving a payment atomically mints download_tokens with UUID v4, 30d expiry, max_downloads = 5', async () => {
    await paymentRepo.reviewPayment({
      paymentId: submittedPaymentId,
      adminUserId: 999,
      decision: 'APPROVED',
    });

    expect(mockDb.downloadTokensTable.length).toBe(2);
    for (const tokenRecord of mockDb.downloadTokensTable) {
      expect(tokenRecord.token).toBeDefined();
      expect(tokenRecord.max_downloads).toBe(5);
      expect(tokenRecord.download_count).toBe(0);
      expect(tokenRecord.is_revoked).toBe(false);
      // Expiry is approximately 30 days ahead
      const expiry = new Date(tokenRecord.expires_at).getTime();
      const now = Date.now();
      expect(expiry - now).toBeGreaterThan(28 * 24 * 60 * 60 * 1000);
    }
  });

  it('rejecting a payment requires rejection_reason and updates payment and order to REJECTED', async () => {
    const result = await paymentRepo.reviewPayment({
      paymentId: submittedPaymentId,
      adminUserId: 999,
      decision: 'REJECTED',
      rejectionReason: 'Slip amount does not match order total.',
    });

    expect(result.payment.status).toBe('REJECTED');
    expect(result.payment.rejectionReason).toBe('Slip amount does not match order total.');
    expect(result.orderStatus).toBe('REJECTED');

    const order = mockDb.ordersTable.find((o) => o.id === 200);
    expect(order?.order_status).toBe('REJECTED');
  });

  it('rejecting a payment without a reason throws ValidationError', async () => {
    await expect(
      paymentRepo.reviewPayment({
        paymentId: submittedPaymentId,
        adminUserId: 999,
        decision: 'REJECTED',
        rejectionReason: '   ',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('rejecting a payment guarantees zero rows in user_library and zero download_tokens', async () => {
    await paymentRepo.reviewPayment({
      paymentId: submittedPaymentId,
      adminUserId: 999,
      decision: 'REJECTED',
      rejectionReason: 'Slip is unreadable.',
    });

    expect(mockDb.userLibraryTable.length).toBe(0);
    expect(mockDb.downloadTokensTable.length).toBe(0);
  });

  it('attempting to review a payment for an order in terminal state (PAID/REJECTED) throws InvalidStateTransitionError', async () => {
    // First approve
    await paymentRepo.reviewPayment({
      paymentId: submittedPaymentId,
      adminUserId: 999,
      decision: 'APPROVED',
    });

    // Attempting to reject already approved order must throw
    await expect(
      paymentRepo.reviewPayment({
        paymentId: submittedPaymentId,
        adminUserId: 999,
        decision: 'REJECTED',
        rejectionReason: 'Changed mind',
      })
    ).rejects.toThrow(InvalidStateTransitionError);
  });

  it('attempting to approve when order is still PENDING throws InvalidStateTransitionError', async () => {
    // Manually force order back to PENDING while payment exists
    const order = mockDb.ordersTable.find((o) => o.id === 200);
    order.order_status = 'PENDING';

    await expect(
      paymentRepo.reviewPayment({
        paymentId: submittedPaymentId,
        adminUserId: 999,
        decision: 'APPROVED',
      })
    ).rejects.toThrow(InvalidStateTransitionError);
  });
});


