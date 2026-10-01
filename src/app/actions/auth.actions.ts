'use server';

import { revalidatePath } from 'next/cache';
import { clearSessionCookie, DEMO_USERS, setSessionCookie } from '@/lib/session';

export async function switchDemoRoleAction(role: 'customer' | 'admin') {
  const targetUser = DEMO_USERS[role];
  if (targetUser) {
    await setSessionCookie(targetUser);
  }
  revalidatePath('/', 'layout');
  return { success: true, user: targetUser };
}

export async function logoutAction() {
  await clearSessionCookie();
  revalidatePath('/', 'layout');
  return { success: true };
}
