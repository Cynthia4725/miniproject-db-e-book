import crypto from 'crypto';
import { cookies } from 'next/headers';
import { ForbiddenError, UnauthorizedError } from './errors';

export interface SessionUser {
  userId: number;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

export const SESSION_COOKIE_NAME = 'ebook_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'ebook-store-academic-secure-key-2026';

export const DEMO_USERS = {
  customer: {
    userId: 1,
    name: 'สมชาย ใจดี (Somchai)',
    email: 'somchai@example.com',
    role: 'customer' as const,
  },
  admin: {
    userId: 2,
    name: 'ผู้ดูแลระบบ (Admin)',
    email: 'admin@ebookstore.com',
    role: 'admin' as const,
  },
};

/**
 * Signs a session payload with HMAC-SHA256
 */
export function signSession(user: SessionUser): string {
  const jsonPayload = Buffer.from(JSON.stringify(user)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(jsonPayload)
    .digest('base64url');
  return `${jsonPayload}.${signature}`;
}

/**
 * Verifies a signed session token
 */
export function verifySession(token?: string | null): SessionUser | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payloadBase64, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const rawJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed.userId !== 'number' || !parsed.role) {
      return null;
    }
    return {
      userId: parsed.userId,
      email: parsed.email,
      name: parsed.name,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

/**
 * Retrieves the currently authenticated user from incoming request cookies
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    return verifySession(sessionToken);
  } catch {
    return null;
  }
}

/**
 * Sets the HTTP-only session cookie
 */
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();
  const token = signSession(user);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clears the session cookie (logout)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Requires an authenticated user session
 */
export async function requireUser(user?: SessionUser | null): Promise<SessionUser> {
  const current = user !== undefined ? user : await getCurrentUser();
  if (!current) {
    throw new UnauthorizedError('Authentication required to access this resource.');
  }
  return current;
}

/**
 * Enforces role-based authorization guard
 */
export async function requireRole(
  user: SessionUser | null | undefined,
  allowedRoles: Array<'customer' | 'admin'>
): Promise<SessionUser> {
  const current = await requireUser(user);
  if (!allowedRoles.includes(current.role)) {
    throw new ForbiddenError(
      `Access forbidden. Requires one of [${allowedRoles.join(', ')}] role.`
    );
  }
  return current;
}
