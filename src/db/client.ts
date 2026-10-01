import { neon, NeonQueryFunction } from '@neondatabase/serverless';

export interface DatabaseExecutor {
  query<T = any>(queryText: string, params?: any[]): Promise<T[]>;
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
    const sql = this.getClient();
    const result = await sql(queryText, params);
    return result as unknown as T[];
  }
}

let activeExecutor: DatabaseExecutor = new NeonDatabaseExecutor();

export function setDatabaseExecutor(executor: DatabaseExecutor) {
  activeExecutor = executor;
}

export function getDatabaseExecutor(): DatabaseExecutor {
  return activeExecutor;
}
