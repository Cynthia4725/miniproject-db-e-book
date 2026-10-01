import { getDatabaseExecutor } from '@/db/client';
import { generateUuidV4 } from '@/lib/uuid';
import {
  CreateOrderInput,
  OrderEntity,
  OrderItemEntity,
  PublicOrderDto,
} from './order.dto';

export class OrderRepository {
  private db = getDatabaseExecutor();

  async createOrder(input: CreateOrderInput): Promise<OrderEntity> {
    const orderNumber = input.explicitOrderNumber || generateUuidV4();
    const discountAmount = input.discountAmount ?? 0;
    const orderStatus = input.orderStatus ?? 'PENDING';

    const insertOrderQuery = `
      INSERT INTO orders (
        order_number, user_id, subtotal_amount, discount_amount, net_amount, coupon_id, order_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const orderRows = await this.db.query(insertOrderQuery, [
      orderNumber,
      input.userId,
      input.subtotalAmount,
      discountAmount,
      input.netAmount,
      input.couponId || null,
      orderStatus,
    ]);

    const createdOrderRow = orderRows[0];
    const orderId = createdOrderRow.id;
    const items: OrderItemEntity[] = [];

    for (const item of input.items) {
      const insertItemQuery = `
        INSERT INTO order_items (order_id, book_id, unit_price)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const itemRows = await this.db.query(insertItemQuery, [
        orderId,
        item.bookId,
        item.unitPrice,
      ]);
      const createdItemRow = itemRows[0];
      items.push({
        id: createdItemRow.id,
        orderId: createdItemRow.order_id,
        bookId: createdItemRow.book_id,
        unitPrice: Number(createdItemRow.unit_price),
        createdAt: createdItemRow.created_at,
      });
    }

    return {
      id: createdOrderRow.id,
      orderNumber: createdOrderRow.order_number,
      userId: createdOrderRow.user_id,
      subtotalAmount: Number(createdOrderRow.subtotal_amount),
      discountAmount: Number(createdOrderRow.discount_amount),
      netAmount: Number(createdOrderRow.net_amount),
      couponId: createdOrderRow.coupon_id,
      orderStatus: createdOrderRow.order_status,
      createdAt: createdOrderRow.created_at,
      updatedAt: createdOrderRow.updated_at,
      items,
    };
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderEntity | null> {
    const findOrderQuery = `
      SELECT * FROM orders WHERE order_number = $1 LIMIT 1;
    `;
    const orderRows = await this.db.query(findOrderQuery, [orderNumber]);
    if (!orderRows || orderRows.length === 0) {
      return null;
    }

    const orderRow = orderRows[0];
    const findItemsQuery = `
      SELECT * FROM order_items WHERE order_id = $1;
    `;
    const itemRows = await this.db.query(findItemsQuery, [orderRow.id]);

    const items: OrderItemEntity[] = itemRows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      bookId: row.book_id,
      unitPrice: Number(row.unit_price),
      createdAt: row.created_at,
    }));

    return {
      id: orderRow.id,
      orderNumber: orderRow.order_number,
      userId: orderRow.user_id,
      subtotalAmount: Number(orderRow.subtotal_amount),
      discountAmount: Number(orderRow.discount_amount),
      netAmount: Number(orderRow.net_amount),
      couponId: orderRow.coupon_id,
      orderStatus: orderRow.order_status,
      createdAt: orderRow.created_at,
      updatedAt: orderRow.updated_at,
      items,
    };
  }

  toPublicDto(order: OrderEntity): PublicOrderDto {
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
}
