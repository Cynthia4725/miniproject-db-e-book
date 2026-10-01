import { DatabaseExecutor, getDatabaseExecutor, mapDatabaseError } from './client';

export async function runTransaction<T>(
  executorOrCallback: DatabaseExecutor | ((tx: DatabaseExecutor) => Promise<T>),
  maybeCallback?: (tx: DatabaseExecutor) => Promise<T>
): Promise<T> {
  const executor =
    typeof executorOrCallback === 'function'
      ? getDatabaseExecutor()
      : executorOrCallback;
  const callback =
    typeof executorOrCallback === 'function'
      ? executorOrCallback
      : maybeCallback!;

  if (!callback) {
    throw new Error('A transaction callback function must be provided.');
  }

  try {
    if (executor.transaction) {
      return await executor.transaction(async (tx) => {
        try {
          return await callback(tx);
        } catch (innerErr) {
          throw mapDatabaseError(innerErr);
        }
      });
    }

    // Default transactional boundary using BEGIN / COMMIT / ROLLBACK
    await executor.query('BEGIN');
    try {
      const result = await callback(executor);
      await executor.query('COMMIT');
      return result;
    } catch (innerErr) {
      try {
        await executor.query('ROLLBACK');
      } catch (rollbackErr) {
        // Rollback attempt failed or connection disconnected
      }
      throw mapDatabaseError(innerErr);
    }
  } catch (err) {
    throw mapDatabaseError(err);
  }
}
