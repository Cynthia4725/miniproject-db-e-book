import { OrderStatus } from '@/db/types';

export interface CreateOrderItemInput {
  bookId: number | string;
  unitPrice: number;
}

export interface CreateOrderInput {
  userId: number | string;
  subtotalAmount: number;
  discountAmount?: number;
  netAmount: number;
  couponId?: number | string | null;
  orderStatus?: OrderStatus;
  items: CreateOrderItemInput[];
  explicitOrderNumber?: string;
}

export interface OrderItemEntity {
  id: number | string;
  orderId: number | string;
  bookId: number | string;
  unitPrice: number;
  createdAt: string | Date;
}

export interface OrderEntity {
  id: number | string;
  orderNumber: string;
  userId: number | string;
  subtotalAmount: number;
  discountAmount: number;
  netAmount: number;
  couponId: number | string | null;
  orderStatus: OrderStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: OrderItemEntity[];
}

export interface PublicOrderItemDto {
  bookId: number | string;
  unitPrice: number;
}

export interface PublicOrderDto {
  orderNumber: string;
  subtotalAmount: number;
  discountAmount: number;
  netAmount: number;
  orderStatus: OrderStatus;
  createdAt: string | Date;
  items: PublicOrderItemDto[];
}
