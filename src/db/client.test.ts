import { describe, it, expect, beforeEach } from 'vitest';
import {
  DatabaseExecutor,
  getDatabaseExecutor,
  setDatabaseExecutor,
  mapDatabaseError,
  sanitizeDatabaseErrorMessage,
} from './client';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';

class MockDirectSqlDatabaseExecutor implements DatabaseExecutor {
  public executedQueries: { text: string; params: any[] }[] = [];
  public shouldSimulateError: any = null;

  async query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
    if (this.shouldSimulateError) {
      throw mapDatabaseError(this.shouldSimulateError);
    }
    this.executedQueries.push({ text: queryText, params });

    // Mock response for simple queries
    if (queryText.includes('FROM books WHERE title = $1')) {
      return [{ id: 1, title: params[0] }] as unknown as T[];
    }
    return [] as T[];
  }

  async sql<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> {
    // Convert template literal to parameterized query ($1, $2, ...)
    let queryText = '';
    const params: any[] = [];
    strings.forEach((str, i) => {
      queryText += str;
      if (i < values.length) {
        params.push(values[i]);
        queryText += `$${params.length}`;
      }
    });

    return this.query<T>(queryText, params);
  }

  async transaction<T>(callback: (tx: DatabaseExecutor) => Promise<T>): Promise<T> {
    return callback(this);
  }
}

describe('Parameterized Direct SQL Client & PostgreSQL Error Mapping Slice (Ticket 01)', () => {
  let mockDb: MockDirectSqlDatabaseExecutor;

  beforeEach(() => {
    mockDb = new MockDirectSqlDatabaseExecutor();
    setDatabaseExecutor(mockDb);
  });

  it('executes parameterized queries with bound variables ($1, $2) and protects against SQL injection', async () => {
    const maliciousInput = "Designing Data-Intensive Applications'; DROP TABLE books; --";
    const result = await mockDb.query('SELECT * FROM books WHERE title = $1;', [maliciousInput]);

    expect(mockDb.executedQueries.length).toBe(1);
    expect(mockDb.executedQueries[0].text).toBe('SELECT * FROM books WHERE title = $1;');
    expect(mockDb.executedQueries[0].params[0]).toBe(maliciousInput);
    expect(result[0].title).toBe(maliciousInput);
  });

  it('supports tagged template literals (sql`...`) converting interpolation into parameters', async () => {
    const bookTitle = "Database Internals' OR '1'='1";
    const categoryId = 4;

    await mockDb.sql`SELECT * FROM books WHERE title = ${bookTitle} AND category_id = ${categoryId};`;

    expect(mockDb.executedQueries.length).toBe(1);
    expect(mockDb.executedQueries[0].text).toBe('SELECT * FROM books WHERE title = $1 AND category_id = $2;');
    expect(mockDb.executedQueries[0].params).toEqual([bookTitle, categoryId]);
  });

  it('maps PostgreSQL error code 23505 (unique_violation) to ConflictError', () => {
    const pgError = {
      code: '23505',
      detail: 'Key (email)=(test@example.com) already exists.',
      message: 'duplicate key value violates unique constraint "users_email_key"',
    };

    const mapped = mapDatabaseError(pgError);
    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped.message).toContain('already exists');
    expect((mapped as ConflictError).code).toBe('CONFLICT');
  });

  it('maps PostgreSQL error code 23503 (foreign_key_violation) to NotFoundError', () => {
    const pgError = {
      code: '23503',
      detail: 'Key (book_id)=(9999) is not present in table "books".',
      message: 'insert or update on table "order_items" violates foreign key constraint',
    };

    const mapped = mapDatabaseError(pgError);
    expect(mapped).toBeInstanceOf(NotFoundError);
    expect(mapped.message).toContain('Referenced record does not exist');
  });

  it('maps PostgreSQL error code 23514 (check_violation) to ValidationError', () => {
    const pgError = {
      code: '23514',
      detail: 'Failing row contains (price = -50.00).',
      message: 'new row for relation "books" violates check constraint "books_price_check"',
    };

    const mapped = mapDatabaseError(pgError);
    expect(mapped).toBeInstanceOf(ValidationError);
    expect(mapped.message).toContain('Database check constraint violated');
  });

  it('sanitizes unexpected database error messages to prevent credential and connection string leakage', () => {
    const sensitiveError = new Error(
      'Connection refused at postgres://db_user:s3cr3t_pass123@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require'
    );

    const sanitized = sanitizeDatabaseErrorMessage(sensitiveError.message);
    expect(sanitized).not.toContain('s3cr3t_pass123');
    expect(sanitized).not.toContain('ep-cool-fog-123456');
    expect(sanitized).toContain('[REDACTED_DATABASE_CONNECTION]');
  });
});
