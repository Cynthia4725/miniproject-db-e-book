export interface CartEntity {
  id: number | string;
  userId: number | string;
  updatedAt: string | Date;
}

export interface CartItemEntity {
  id: number | string;
  cartId: number | string;
  bookId: number | string;
  addedAt: string | Date;
}

export interface CartItemDetail {
  id: number | string;
  cartId: number | string;
  bookId: number | string;
  title: string;
  coverImageUrl?: string | null;
  price: number;
  discountPrice?: number | null;
  effectivePrice: number;
  addedAt: string | Date;
}

export interface CartWithItemsDto {
  cartId: number | string;
  userId: number | string;
  items: CartItemDetail[];
  totalItems: number;
  subtotal: number;
  updatedAt: string | Date;
}

export interface ActiveCartDemandStat {
  bookId: number | string;
  title: string;
  inCartCount: number;
}

export interface CheckoutInput {
  userId: number | string;
  couponCode?: string | null;
}

export interface CheckoutResultDto {
  orderId: number | string;
  orderNumber: string;
  subtotal: number;
  discountAmount: number;
  netAmount: number;
  itemCount: number;
}
