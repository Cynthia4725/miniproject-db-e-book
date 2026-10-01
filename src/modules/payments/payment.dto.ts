import { PaymentMethod, PaymentStatus } from '@/db/types';

export interface SubmitPaymentInput {
  orderId: number | string;
  amountPaid: number;
  slipImageUrl: string;
  transferredAt: string | Date;
  paymentMethod?: PaymentMethod;
}

export interface PaymentEntity {
  id: number | string;
  orderId: number | string;
  paymentMethod: string;
  amountPaid: number;
  slipImageUrl: string;
  transferredAt: string | Date;
  status: PaymentStatus;
  verifiedByUserId?: number | string | null;
  verifiedAt?: string | Date | null;
  rejectionReason?: string | null;
  createdAt: string | Date;
}

export interface PublicPaymentDto {
  paymentMethod: string;
  amountPaid: number;
  slipImageUrl: string;
  transferredAt: string | Date;
  status: PaymentStatus;
  createdAt: string | Date;
  rejectionReason?: string | null;
}

export interface ReviewPaymentInput {
  paymentId: number | string;
  adminUserId: number | string;
  decision: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export interface ReviewPaymentResult {
  payment: PaymentEntity;
  orderStatus: string;
  grantedBookIds?: (number | string)[];
  downloadTokenIds?: (number | string)[];
}
