import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerAction, loginAction } from './auth.actions';
import { UserRepository } from '@/modules/users/user.repository';
import * as sessionModule from '@/lib/session';
import * as passwordModule from '@/lib/password';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/session')>();
  return {
    ...actual,
    setSessionCookie: vi.fn().mockResolvedValue(undefined),
    clearSessionCookie: vi.fn().mockResolvedValue(undefined),
  };
});

describe('Authentication Server Actions (Ticket 03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerAction', () => {
    it('rejects short full name', async () => {
      const formData = new FormData();
      formData.set('full_name', 'A');
      formData.set('email', 'test@example.com');
      formData.set('password', '123456');
      formData.set('confirm_password', '123456');

      const res = await registerAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toContain('ชื่อ-นามสกุล');
    });

    it('rejects invalid email format', async () => {
      const formData = new FormData();
      formData.set('full_name', 'John Doe');
      formData.set('email', 'notanemail');
      formData.set('password', '123456');
      formData.set('confirm_password', '123456');

      const res = await registerAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toContain('อีเมล');
    });

    it('rejects short password', async () => {
      const formData = new FormData();
      formData.set('full_name', 'John Doe');
      formData.set('email', 'valid@example.com');
      formData.set('password', '123');
      formData.set('confirm_password', '123');

      const res = await registerAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toContain('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
    });

    it('rejects mismatched passwords', async () => {
      const formData = new FormData();
      formData.set('full_name', 'John Doe');
      formData.set('email', 'valid@example.com');
      formData.set('password', '123456');
      formData.set('confirm_password', '654321');

      const res = await registerAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toContain('ไม่ตรงกัน');
    });

    it('rejects registration when email already exists', async () => {
      vi.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValueOnce({
        id: 10,
        email: 'existing@example.com',
        password_hash: 'hash',
        full_name: 'Existing User',
        phone: null,
        role: 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const formData = new FormData();
      formData.set('full_name', 'Existing User');
      formData.set('email', 'existing@example.com');
      formData.set('password', 'secret123');
      formData.set('confirm_password', 'secret123');

      const res = await registerAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toContain('ถูกลงทะเบียนไว้ในระบบแล้ว');
    });

    it('successfully registers new user, hashes password with scrypt, and sets session cookie', async () => {
      vi.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValueOnce(null);
      vi.spyOn(UserRepository.prototype, 'createUser').mockResolvedValueOnce({
        id: 99,
        email: 'newuser@example.com',
        password_hash: 'mock_salt:mock_hash',
        full_name: 'New Customer',
        phone: '0812345678',
        role: 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const formData = new FormData();
      formData.set('full_name', 'New Customer');
      formData.set('email', 'newuser@example.com');
      formData.set('phone', '0812345678');
      formData.set('password', 'secret123');
      formData.set('confirm_password', 'secret123');

      const res = await registerAction(formData);
      expect(res.success).toBe(true);
      expect(res.redirectUrl).toBe('/');
      expect(sessionModule.setSessionCookie).toHaveBeenCalledWith({
        userId: 99,
        email: 'newuser@example.com',
        name: 'New Customer',
        role: 'customer',
      });
    });
  });

  describe('loginAction', () => {
    it('rejects missing credentials', async () => {
      const formData = new FormData();
      const res = await loginAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toContain('กรุณากรอกอีเมลและรหัสผ่าน');
    });

    it('rejects unknown email', async () => {
      vi.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValueOnce(null);

      const formData = new FormData();
      formData.set('email', 'unknown@example.com');
      formData.set('password', 'anypassword');

      const res = await loginAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toContain('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    });

    it('rejects incorrect password', async () => {
      vi.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValueOnce({
        id: 1,
        email: 'user@example.com',
        password_hash: 'stored_hash',
        full_name: 'Test User',
        phone: null,
        role: 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      vi.spyOn(passwordModule, 'verifyPassword').mockResolvedValueOnce(false);

      const formData = new FormData();
      formData.set('email', 'user@example.com');
      formData.set('password', 'wrongpassword');

      const res = await loginAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toContain('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    });

    it('logs in successfully and sets session cookie for customer', async () => {
      vi.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValueOnce({
        id: 1,
        email: 'user@example.com',
        password_hash: 'stored_hash',
        full_name: 'Test User',
        phone: null,
        role: 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      vi.spyOn(passwordModule, 'verifyPassword').mockResolvedValueOnce(true);

      const formData = new FormData();
      formData.set('email', 'user@example.com');
      formData.set('password', 'correctpassword');

      const res = await loginAction(formData);
      expect(res.success).toBe(true);
      expect(res.redirectUrl).toBe('/');
      expect(sessionModule.setSessionCookie).toHaveBeenCalledWith({
        userId: 1,
        email: 'user@example.com',
        name: 'Test User',
        role: 'customer',
      });
    });

    it('logs in successfully and redirects admin to /admin/orders', async () => {
      vi.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValueOnce({
        id: 2,
        email: 'admin@ebookstore.com',
        password_hash: 'stored_hash',
        full_name: 'Admin User',
        phone: null,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      vi.spyOn(passwordModule, 'verifyPassword').mockResolvedValueOnce(true);

      const formData = new FormData();
      formData.set('email', 'admin@ebookstore.com');
      formData.set('password', 'adminpassword');

      const res = await loginAction(formData);
      expect(res.success).toBe(true);
      expect(res.redirectUrl).toBe('/admin/orders');
    });
  });
});
