import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('Password Hashing & Verification (crypto.scrypt)', () => {
  it('hashes password and verifies successfully with correct password', async () => {
    const raw = 'SuperSecret123!';
    const hashed = await hashPassword(raw);

    expect(hashed).toContain(':');
    const [salt, hex] = hashed.split(':');
    expect(salt).toHaveLength(32); // 16 bytes in hex = 32 chars
    expect(hex).toHaveLength(128); // 64 bytes in hex = 128 chars

    const isValid = await verifyPassword(raw, hashed);
    expect(isValid).toBe(true);
  });

  it('rejects verification with incorrect password', async () => {
    const raw = 'CorrectPassword123';
    const hashed = await hashPassword(raw);

    const isValid = await verifyPassword('WrongPassword!', hashed);
    expect(isValid).toBe(false);
  });

  it('produces unique salts and hashes for the same password', async () => {
    const raw = 'IdenticalPassword';
    const hash1 = await hashPassword(raw);
    const hash2 = await hashPassword(raw);

    expect(hash1).not.toBe(hash2);
    expect(await verifyPassword(raw, hash1)).toBe(true);
    expect(await verifyPassword(raw, hash2)).toBe(true);
  });

  it('verifies seeded demo hashes', async () => {
    expect(await verifyPassword('password123', 'scrypt_demo_hash_somchai')).toBe(true);
    expect(await verifyPassword('somchai123', 'scrypt_demo_hash_somchai')).toBe(true);
    expect(await verifyPassword('wrongpassword', 'scrypt_demo_hash_somchai')).toBe(false);

    expect(await verifyPassword('admin123', 'scrypt_demo_hash_admin')).toBe(true);
    expect(await verifyPassword('wrongadmin', 'scrypt_demo_hash_admin')).toBe(false);
  });

  it('handles empty or malformed inputs gracefully without throwing', async () => {
    expect(await verifyPassword('', 'salt:hash')).toBe(false);
    expect(await verifyPassword('pass', '')).toBe(false);
    expect(await verifyPassword('pass', 'invalid-format-without-colon')).toBe(false);
  });
});
