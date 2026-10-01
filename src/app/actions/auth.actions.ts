'use server';

import { revalidatePath } from 'next/cache';
import { clearSessionCookie, DEMO_USERS, setSessionCookie } from '@/lib/session';
import { UserRepository } from '@/modules/users/user.repository';
import { hashPassword, verifyPassword } from '@/lib/password';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

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

export async function registerAction(formData: FormData): Promise<AuthActionResult> {
  const fullName = formData.get('full_name')?.toString().trim();
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const phone = formData.get('phone')?.toString().trim();
  const password = formData.get('password')?.toString();
  const confirmPassword = formData.get('confirm_password')?.toString();

  if (!fullName || fullName.length < 2) {
    return { success: false, error: 'กรุณากรอกชื่อ-นามสกุลอย่างน้อย 2 ตัวอักษร' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { success: false, error: 'กรุณากรอกอีเมลที่ถูกต้อง (ตัวอย่าง: name@example.com)' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
  }

  if (password !== confirmPassword) {
    return { success: false, error: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน' };
  }

  const userRepo = new UserRepository();
  const existingUser = await userRepo.findByEmail(email);
  if (existingUser) {
    return {
      success: false,
      error: 'อีเมลนี้ถูกลงทะเบียนไว้ในระบบแล้ว กรุณาใช้อีเมลอื่น หรือเข้าสู่ระบบ',
    };
  }

  const passwordHash = await hashPassword(password);
  const newUser = await userRepo.createUser({
    email,
    passwordHash,
    fullName,
    phone: phone || null,
    role: 'customer',
  });

  // Automatically sign in the registered customer
  await setSessionCookie({
    userId: Number(newUser.id),
    email: newUser.email,
    name: newUser.full_name,
    role: 'customer',
  });

  revalidatePath('/', 'layout');
  return { success: true, redirectUrl: '/' };
}

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return { success: false, error: 'กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน' };
  }

  const userRepo = new UserRepository();
  const user = await userRepo.findByEmail(email);

  if (!user) {
    return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
  }

  const isPasswordValid = await verifyPassword(password, user.password_hash);
  if (!isPasswordValid) {
    return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
  }

  await setSessionCookie({
    userId: Number(user.id),
    email: user.email,
    name: user.full_name,
    role: user.role,
  });

  revalidatePath('/', 'layout');
  const redirectUrl = user.role === 'admin' ? '/admin/orders' : '/';
  return { success: true, redirectUrl };
}
