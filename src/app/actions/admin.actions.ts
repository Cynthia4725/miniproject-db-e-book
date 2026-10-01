'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser, requireRole } from '@/lib/session';
import { PaymentRepository } from '@/modules/payments/payment.repository';
import { getDatabaseExecutor } from '@/db/client';

export async function verifyPaymentAction(
  paymentId: number | string,
  decision: 'APPROVED' | 'REJECTED',
  rejectionReason?: string
): Promise<void> {
  const user = await getCurrentUser();
  await requireRole(user, ['admin']);

  const paymentRepo = new PaymentRepository();
  await paymentRepo.reviewPayment({
    paymentId,
    adminUserId: user!.userId,
    decision,
    rejectionReason: decision === 'REJECTED' ? rejectionReason || 'Invalid slip' : undefined,
  });

  revalidatePath('/admin/orders');
  revalidatePath('/admin/analytics');
  revalidatePath('/library');
}

export async function updateBookPriceAction(
  bookId: number | string,
  price: number,
  discountPrice?: number | null
): Promise<void> {
  const user = await getCurrentUser();
  await requireRole(user, ['admin']);

  const db = getDatabaseExecutor();
  await db.query(
    'UPDATE books SET price = $1, discount_price = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3;',
    [price, discountPrice != null ? discountPrice : null, bookId]
  );

  revalidatePath('/admin/books');
  revalidatePath('/');
}

export async function toggleBookStatusAction(
  bookId: number | string,
  isActive: boolean
): Promise<void> {
  const user = await getCurrentUser();
  await requireRole(user, ['admin']);

  const db = getDatabaseExecutor();
  await db.query(
    'UPDATE books SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;',
    [isActive, bookId]
  );

  revalidatePath('/admin/books');
  revalidatePath('/');
}

const DEFAULT_NO_COVER_URL = '/images/no-cover.svg';

export async function createBookAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  await requireRole(user, ['admin']);

  const title = formData.get('title')?.toString().trim();
  const isbn = formData.get('isbn')?.toString().trim();
  const price = Number(formData.get('price'));
  const discountPrice = formData.get('discount_price')
    ? Number(formData.get('discount_price'))
    : null;

  // Cover image: either uploaded base64 data url, or direct url, or fallback default
  const coverImageUrlRaw = formData.get('cover_image_url')?.toString().trim();
  const coverImageUrl = coverImageUrlRaw && coverImageUrlRaw.length > 0
    ? coverImageUrlRaw
    : DEFAULT_NO_COVER_URL;

  if (!title || !isbn || isNaN(price)) {
    throw new Error('Title, ISBN, and valid price are required');
  }

  const db = getDatabaseExecutor();
  await db.query(
    `INSERT INTO books (title, isbn, price, discount_price, cover_image_url, publisher_id) 
     VALUES ($1, $2, $3, $4, $5, 1) RETURNING id;`,
    [title, isbn, price, discountPrice, coverImageUrl]
  );

  revalidatePath('/admin/books');
  revalidatePath('/');
}
