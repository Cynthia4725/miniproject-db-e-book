import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import {
  AppError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/lib/errors';

export interface DatabaseExecutor {
  query<T = any>(queryText: string, params?: any[]): Promise<T[]>;
  sql?<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]>;
  transaction?<T>(callback: (tx: DatabaseExecutor) => Promise<T>): Promise<T>;
}

export function sanitizeDatabaseErrorMessage(message: string): string {
  // Redact connection strings matching postgresql:// or postgres://
  const connectionStringRegex = /postgres(?:ql)?:\/\/[^\s]+/gi;
  return message.replace(connectionStringRegex, '[REDACTED_DATABASE_CONNECTION]');
}

export function mapDatabaseError(err: any): Error {
  if (err instanceof AppError) {
    return err;
  }

  const code = err?.code || err?.cause?.code;
  const detail = err?.detail || err?.cause?.detail || '';
  const rawMessage = err?.message || 'Database error occurred';
  const sanitizedMessage = sanitizeDatabaseErrorMessage(rawMessage);

  switch (code) {
    case '23505': // unique_violation
      return new ConflictError(
        detail || sanitizedMessage || 'Unique constraint violation: resource already exists.'
      );
    case '23503': // foreign_key_violation
      return new NotFoundError(
        detail ? `Referenced record does not exist: ${detail}` : 'Referenced record does not exist.'
      );
    case '23514': // check_violation
      return new ValidationError(
        detail ? `Database check constraint violated: ${detail}` : 'Database check constraint violated.'
      );
    default:
      return new AppError(sanitizedMessage, 500, 'DATABASE_ERROR');
  }
}

class NeonDatabaseExecutor implements DatabaseExecutor {
  private client: NeonQueryFunction<false, false> | null = null;

  private getClient(): NeonQueryFunction<false, false> {
    if (!this.client) {
      const url = process.env.DATABASE_URL;
      if (!url) {
        throw new Error('DATABASE_URL environment variable is not defined.');
      }
      this.client = neon(url);
    }
    return this.client;
  }

  async query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
    try {
      const sql = this.getClient();
      const result = await sql(queryText, params);
      return result as unknown as T[];
    } catch (err) {
      throw mapDatabaseError(err);
    }
  }

  async sql<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> {
    // Construct parameterized query ($1, $2, ...)
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
    // For Neon HTTP driver, transactions execute queries atomically
    try {
      await this.query('BEGIN');
      const result = await callback(this);
      await this.query('COMMIT');
      return result;
    } catch (err) {
      try {
        await this.query('ROLLBACK');
      } catch (rollbackErr) {
        // Rollback failed or connection severed
      }
      throw mapDatabaseError(err);
    }
  }
}

let activeExecutor: DatabaseExecutor = new NeonDatabaseExecutor();

export function setDatabaseExecutor(executor: DatabaseExecutor) {
  activeExecutor = executor;
}

export function getDatabaseExecutor(): DatabaseExecutor {
  return activeExecutor;
}
