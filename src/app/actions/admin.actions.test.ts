import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBookAction } from './admin.actions';
import * as sessionModule from '@/lib/session';
import * as dbModule from '@/db/client';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Admin Book Actions', () => {
  const mockQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue({
      userId: 1,
      email: 'admin@ebookstore.com',
      name: 'System Admin',
      role: 'admin',
    });
    vi.spyOn(dbModule, 'getDatabaseExecutor').mockReturnValue({
      query: mockQuery,
      transaction: vi.fn(),
    } as any);
  });

  it('inserts book with default No-Cover when cover_image_url is omitted', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 99 }]);

    const formData = new FormData();
    formData.set('title', 'Designing Data-Intensive Applications');
    formData.set('isbn', '978-1449373320');
    formData.set('price', '890');

    await createBookAction(formData);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql = mockQuery.mock.calls[0][0];
    const params = mockQuery.mock.calls[0][1];

    expect(sql).toContain('cover_image_url');
    expect(params[0]).toBe('Designing Data-Intensive Applications');
    expect(params[1]).toBe('978-1449373320');
    expect(params[2]).toBe(890);
    expect(params[3]).toBeNull(); // discount_price
    expect(params[4]).toBe('/images/no-cover.svg'); // fallback to /images/no-cover.svg
  });

  it('inserts book with provided cover_image_url (URL or Base64)', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 100 }]);

    const customUrl = 'https://example.com/covers/custom.jpg';
    const formData = new FormData();
    formData.set('title', 'Clean Architecture');
    formData.set('isbn', '978-0134494166');
    formData.set('price', '650');
    formData.set('discount_price', '590');
    formData.set('cover_image_url', customUrl);

    await createBookAction(formData);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const params = mockQuery.mock.calls[0][1];
    expect(params[4]).toBe(customUrl);
    expect(params[3]).toBe(590);
  });

  it('rejects creation if user is not an admin', async () => {
    vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue({
      userId: 2,
      email: 'customer@example.com',
      name: 'Somchai Customer',
      role: 'customer',
    });

    const formData = new FormData();
    formData.set('title', 'Hacking Web Apps');
    formData.set('isbn', '978-1111111111');
    formData.set('price', '500');

    await expect(createBookAction(formData)).rejects.toThrow();
  });
});
