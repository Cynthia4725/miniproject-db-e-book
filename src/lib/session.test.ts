import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  signSession,
  verifySession,
  DEMO_USERS,
  requireRole,
  requireUser,
  SessionUser,
} from './session';
import { ForbiddenError, AppError } from './errors';

describe('Session Authentication & Role Guards (Ticket 01)', () => {
  const sampleCustomer: SessionUser = {
    userId: 1,
    name: 'Somchai Customer',
    email: 'somchai@example.com',
    role: 'customer',
  };

  const sampleAdmin: SessionUser = {
    userId: 2,
    name: 'Store Admin',
    email: 'admin@ebookstore.com',
    role: 'admin',
  };

  it('signs and verifies a valid session payload successfully', () => {
    const token = signSession(sampleCustomer);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.includes('.')).toBe(true);

    const verified = verifySession(token);
    expect(verified).toBeDefined();
    expect(verified?.userId).toBe(1);
    expect(verified?.email).toBe('somchai@example.com');
    expect(verified?.role).toBe('customer');
  });

  it('returns null when verifying a tampered token signature', () => {
    const token = signSession(sampleCustomer);
    const [payload, signature] = token.split('.');
    const tamperedToken = `${payload}.invalidsignature123`;

    const verified = verifySession(tamperedToken);
    expect(verified).toBeNull();
  });

  it('returns null when verifying a malformed token', () => {
    expect(verifySession('')).toBeNull();
    expect(verifySession('notavalidtoken')).toBeNull();
  });

  it('requireUser rejects when no user is authenticated', async () => {
    await expect(requireUser(null)).rejects.toThrow(AppError);
  });

  it('requireRole allows users with permitted roles', async () => {
    const user = await requireRole(sampleAdmin, ['admin']);
    expect(user.role).toBe('admin');

    const customerUser = await requireRole(sampleCustomer, ['customer', 'admin']);
    expect(customerUser.role).toBe('customer');
  });

  it('requireRole throws ForbiddenError (403) when user lacks required role', async () => {
    await expect(requireRole(sampleCustomer, ['admin'])).rejects.toThrow(ForbiddenError);
  });

  it('provides predefined demo users for customer and admin', () => {
    expect(DEMO_USERS.customer.role).toBe('customer');
    expect(DEMO_USERS.customer.email).toBe('somchai@example.com');
    expect(DEMO_USERS.admin.role).toBe('admin');
    expect(DEMO_USERS.admin.email).toBe('admin@ebookstore.com');
  });
});
