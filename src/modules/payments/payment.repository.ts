import { getDatabaseExecutor } from '@/db/client';
import { InvalidStateTransitionError, NotFoundError, ValidationError } from '@/lib/errors';
import { generateUuidV4 } from '@/lib/uuid';
import {
  PaymentEntity,
  PublicPaymentDto,
  ReviewPaymentInput,
  ReviewPaymentResult,
  SubmitPaymentInput,
} from './payment.dto';
import { OrderItemRow, OrderRow, PaymentRow } from '@/db/types';

export class PaymentRepository {
  private db = getDatabaseExecutor();

  async submitPaymentSlip(input: SubmitPaymentInput): Promise<PaymentEntity> {
    // 1. Fetch order and validate state
    const orderRows = await this.db.query<OrderRow>(
      `SELECT * FROM orders WHERE id = $1 LIMIT 1;`,
      [input.orderId]
    );

    if (!orderRows || orderRows.length === 0) {
      throw new NotFoundError(`Order with ID ${input.orderId} not found.`);
    }

    const order = orderRows[0];

    // State machine check: Only PENDING can proceed
    if (
      order.order_status === 'PAID' ||
      order.order_status === 'REJECTED' ||
      order.order_status === 'CANCELLED'
    ) {
      throw new InvalidStateTransitionError(
        `Cannot submit payment slip for order in terminal or invalid status '${order.order_status}'.`
      );
    }

    const paymentMethod = input.paymentMethod || 'PROMPTPAY';
    const status = 'PENDING_REVIEW';
    const transferredAt =
      typeof input.transferredAt === 'string'
        ? input.transferredAt
        : input.transferredAt.toISOString();

    // 2. Insert payment record (FIRST)
    const insertPaymentQuery = `
      INSERT INTO payments (
        order_id, payment_method, amount_paid, slip_image_url, transferred_at, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const paymentRows = await this.db.query<PaymentRow>(insertPaymentQuery, [
      input.orderId,
      paymentMethod,
      input.amountPaid,
      input.slipImageUrl,
      transferredAt,
      status,
    ]);

    const createdPayment = paymentRows[0];

    // 3. Atomically transition parent order status to PAYMENT_SUBMITTED
    await this.db.query(
      `UPDATE orders SET order_status = $1 WHERE id = $2 RETURNING *;`,
      ['PAYMENT_SUBMITTED', input.orderId]
    );

    return {
      id: createdPayment.id,
      orderId: createdPayment.order_id,
      paymentMethod: createdPayment.payment_method,
      amountPaid: Number(createdPayment.amount_paid),
      slipImageUrl: createdPayment.slip_image_url,
      transferredAt: createdPayment.transferred_at,
      status: createdPayment.status,
      verifiedByUserId: createdPayment.verified_by_user_id,
      verifiedAt: createdPayment.verified_at,
      rejectionReason: createdPayment.rejection_reason,
      createdAt: createdPayment.created_at,
    };
  }

  async reviewPayment(input: ReviewPaymentInput): Promise<ReviewPaymentResult> {
    // 1. Fetch payment
    const paymentRows = await this.db.query<PaymentRow>(
      `SELECT * FROM payments WHERE id = $1 LIMIT 1;`,
      [input.paymentId]
    );

    if (!paymentRows || paymentRows.length === 0) {
      throw new NotFoundError(`Payment with ID ${input.paymentId} not found.`);
    }

    const payment = paymentRows[0];

    if (payment.status !== 'PENDING_REVIEW') {
      throw new InvalidStateTransitionError(
        `Cannot review payment with status '${payment.status}'. Payment is already finalized.`
      );
    }

    // 2. Fetch associated order
    const orderRows = await this.db.query<OrderRow>(
      `SELECT * FROM orders WHERE id = $1 LIMIT 1;`,
      [payment.order_id]
    );

    if (!orderRows || orderRows.length === 0) {
      throw new NotFoundError(`Order associated with payment not found.`);
    }

    const order = orderRows[0];

    if (order.order_status !== 'PAYMENT_SUBMITTED') {
      throw new InvalidStateTransitionError(
        `Cannot review payment for order in '${order.order_status}' status.`
      );
    }

    const now = new Date().toISOString();

    // 3. Handle REJECTED decision
    if (input.decision === 'REJECTED') {
      const reason = input.rejectionReason?.trim();
      if (!reason) {
        throw new ValidationError('Rejection reason is required when rejecting a payment.');
      }

      const updatePaymentQuery = `
        UPDATE payments SET
          status = $1,
          verified_by_user_id = $2,
          verified_at = $3,
          rejection_reason = $4
        WHERE id = $5
        RETURNING *;
      `;
      const updatedPaymentRows = await this.db.query<PaymentRow>(updatePaymentQuery, [
        'REJECTED',
        input.adminUserId,
        now,
        reason,
        input.paymentId,
      ]);

      await this.db.query(
        `UPDATE orders SET order_status = $1 WHERE id = $2 RETURNING *;`,
        ['REJECTED', order.id]
      );

      const p = updatedPaymentRows[0];
      return {
        payment: {
          id: p.id,
          orderId: p.order_id,
          paymentMethod: p.payment_method,
          amountPaid: Number(p.amount_paid),
          slipImageUrl: p.slip_image_url,
          transferredAt: p.transferred_at,
          status: p.status,
          verifiedByUserId: p.verified_by_user_id,
          verifiedAt: p.verified_at,
          rejectionReason: p.rejection_reason,
          createdAt: p.created_at,
        },
        orderStatus: 'REJECTED',
      };
    }

    // 4. Handle APPROVED decision
    const updatePaymentQuery = `
      UPDATE payments SET
        status = $1,
        verified_by_user_id = $2,
        verified_at = $3,
        rejection_reason = $4
      WHERE id = $5
      RETURNING *;
    `;
    const updatedPaymentRows = await this.db.query<PaymentRow>(updatePaymentQuery, [
      'APPROVED',
      input.adminUserId,
      now,
      null,
      input.paymentId,
    ]);

    await this.db.query(
      `UPDATE orders SET order_status = $1 WHERE id = $2 RETURNING *;`,
      ['PAID', order.id]
    );

    // Fetch order items to fulfill
    const orderItems = await this.db.query<OrderItemRow>(
      `SELECT * FROM order_items WHERE order_id = $1;`,
      [order.id]
    );

    const grantedBookIds: (number | string)[] = [];
    const downloadTokenIds: (number | string)[] = [];

    // Calculate 30-day token expiration
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 30);
    const expiresAt = expiration.toISOString();

    for (const item of orderItems) {
      // Grant ownership in user_library
      const libraryInsertQuery = `
        INSERT INTO user_library (user_id, book_id, order_id)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      await this.db.query(libraryInsertQuery, [order.user_id, item.book_id, order.id]);
      grantedBookIds.push(item.book_id);

      // Mint download token (30-day expiration, 5 max downloads)
      const tokenUuid = generateUuidV4();
      const insertTokenQuery = `
        INSERT INTO download_tokens (
          token, user_id, book_id, expires_at, max_downloads, download_count, is_revoked
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      const tokenRows = await this.db.query(insertTokenQuery, [
        tokenUuid,
        order.user_id,
        item.book_id,
        expiresAt,
        5,
        0,
        false,
      ]);
      if (tokenRows && tokenRows.length > 0) {
        downloadTokenIds.push(tokenRows[0].id ?? tokenRows[0].token);
      }
    }

    const p = updatedPaymentRows[0];
    return {
      payment: {
        id: p.id,
        orderId: p.order_id,
        paymentMethod: p.payment_method,
        amountPaid: Number(p.amount_paid),
        slipImageUrl: p.slip_image_url,
        transferredAt: p.transferred_at,
        status: p.status,
        verifiedByUserId: p.verified_by_user_id,
        verifiedAt: p.verified_at,
        rejectionReason: p.rejection_reason,
        createdAt: p.created_at,
      },
      orderStatus: 'PAID',
      grantedBookIds,
      downloadTokenIds,
    };
  }

  async getPaymentsByOrderId(orderId: number | string): Promise<PaymentEntity[]> {
    const rows = await this.db.query<PaymentRow>(
      `SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at ASC;`,
      [orderId]
    );

    return rows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      paymentMethod: row.payment_method,
      amountPaid: Number(row.amount_paid),
      slipImageUrl: row.slip_image_url,
      transferredAt: row.transferred_at,
      status: row.status,
      verifiedByUserId: row.verified_by_user_id,
      verifiedAt: row.verified_at,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
    }));
  }

  async getPaymentById(paymentId: number | string): Promise<PaymentEntity | null> {
    const rows = await this.db.query<PaymentRow>(
      `SELECT * FROM payments WHERE id = $1 LIMIT 1;`,
      [paymentId]
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      orderId: row.order_id,
      paymentMethod: row.payment_method,
      amountPaid: Number(row.amount_paid),
      slipImageUrl: row.slip_image_url,
      transferredAt: row.transferred_at,
      status: row.status,
      verifiedByUserId: row.verified_by_user_id,
      verifiedAt: row.verified_at,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
    };
  }

  toPublicDto(payment: PaymentEntity): PublicPaymentDto {
    return {
      paymentMethod: payment.paymentMethod,
      amountPaid: payment.amountPaid,
      slipImageUrl: payment.slipImageUrl,
      transferredAt: payment.transferredAt,
      status: payment.status,
      createdAt: payment.createdAt,
      rejectionReason: payment.rejectionReason,
    };
  }
}

