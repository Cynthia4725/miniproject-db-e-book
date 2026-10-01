export type UserRole = 'customer' | 'admin';

export interface UserRow {
  id: string | number;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface BookRow {
  id: string | number;
  title: string;
  subtitle: string | null;
  isbn: string | null;
  publisher_id: string | number | null;
  price: string | number;
  discount_price: string | number | null;
  cover_image_url: string;
  sample_file_url: string | null;
  file_url: string;
  file_format: 'PDF' | 'EPUB';
  file_size_bytes: string | number;
  page_count: number | null;
  publication_date: string | null;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

export type OrderStatus = 'PENDING' | 'PAYMENT_SUBMITTED' | 'PAID' | 'REJECTED' | 'CANCELLED';

export interface OrderRow {
  id: string | number;
  order_number: string; // UUID v4
  user_id: string | number;
  subtotal_amount: string | number;
  discount_amount: string | number;
  net_amount: string | number;
  coupon_id: string | number | null;
  order_status: OrderStatus;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface OrderItemRow {
  id: string | number;
  order_id: string | number;
  book_id: string | number;
  unit_price: string | number;
  created_at: string | Date;
}

export interface DownloadTokenRow {
  id: string | number;
  token: string; // UUID v4
  user_id: string | number;
  book_id: string | number;
  expires_at: string | Date;
  max_downloads: number;
  download_count: number;
  is_revoked: boolean;
  created_at: string | Date;
}

export interface DownloadLogRow {
  id: string | number;
  download_token_id: string | number | null;
  user_id: string | number;
  book_id: string | number;
  ip_address: string | null;
  user_agent: string | null;
  downloaded_at: string | Date;
}

export type PaymentStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export type PaymentMethod = 'PROMPTPAY' | 'CREDIT_CARD' | 'BANK_TRANSFER';

export interface PaymentRow {
  id: string | number;
  order_id: string | number;
  payment_method: string;
  amount_paid: string | number;
  slip_image_url: string;
  transferred_at: string | Date;
  status: PaymentStatus;
  verified_by_user_id: string | number | null;
  verified_at: string | Date | null;
  rejection_reason: string | null;
  created_at: string | Date;
}

export interface UserLibraryRow {
  id: string | number;
  user_id: string | number;
  book_id: string | number;
  order_id: string | number;
  granted_at: string | Date;
}

