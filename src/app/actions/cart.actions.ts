'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CartRepository } from '@/modules/cart/cart.repository';
import { PaymentRepository } from '@/modules/payments/payment.repository';
import { OrderRepository } from '@/modules/orders/order.repository';
import { getCurrentUser, DEMO_USERS, setSessionCookie } from '@/lib/session';

async function getOrInitUser() {
  let user = await getCurrentUser();
  if (!user) {
    user = DEMO_USERS.customer;
    await setSessionCookie(user);
  }
  return user;
}

export async function addToCartAction(bookId: number | string): Promise<void> {
  const user = await getOrInitUser();
  const cartRepo = new CartRepository();
  const cart = await cartRepo.getOrCreateCart(user.userId);
  await cartRepo.addItem(cart.id, bookId);
  revalidatePath('/cart');
  revalidatePath('/');
}

export async function removeFromCartAction(bookId: number | string): Promise<void> {
  const user = await getOrInitUser();
  const cartRepo = new CartRepository();
  const cart = await cartRepo.getOrCreateCart(user.userId);
  await cartRepo.removeItem(cart.id, bookId);
  revalidatePath('/cart');
}

export async function checkoutAction(couponCode?: string): Promise<void> {
  const user = await getOrInitUser();
  const cartRepo = new CartRepository();
  
  const result = await cartRepo.checkout({
    userId: user.userId,
    couponCode: couponCode || null,
  });

  revalidatePath('/cart');
  redirect(`/orders/${result.orderNumber}/pay`);
}

export async function submitSlipAction(orderNumber: string, slipImageUrl: string): Promise<void> {
  const user = await getOrInitUser();
  const orderRepo = new OrderRepository();
  const order = await orderRepo.findByOrderNumber(orderNumber);
  if (!order) {
    throw new Error('Order not found');
  }

  const paymentRepo = new PaymentRepository();
  await paymentRepo.submitPaymentSlip({
    orderId: order.id,
    amountPaid: order.netAmount,
    slipImageUrl: slipImageUrl || 'https://placehold.co/400x600/png?text=PromptPay+Slip',
    transferredAt: new Date().toISOString(),
  });

  revalidatePath(`/orders/${orderNumber}/pay`);
  revalidatePath('/library');
  revalidatePath('/admin/orders');
  redirect('/library');
}
