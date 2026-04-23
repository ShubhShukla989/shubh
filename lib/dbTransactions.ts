/**
 * Database Transaction Helpers
 *
 * Provides utilities for safe database transactions.
 * Ensures data consistency for multi-step operations.
 */

import { db } from './db';
import { logger } from './logger';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Execute a function within a database transaction
 * Automatically rolls back on error
 */
export async function withTransaction<T>(
  fn: (tx: NodePgDatabase) => Promise<T>,
  operationName: string = 'transaction'
): Promise<T> {
  const startTime = Date.now();

  try {
    logger.debug(`Starting transaction: ${operationName}`);

    const result = await db.transaction(async (tx) => {
      return await fn(tx);
    });

    const duration = Date.now() - startTime;
    logger.debug(`Transaction completed: ${operationName}`, { duration: `${duration}ms` });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Transaction failed: ${operationName}`, error as Error, { duration: `${duration}ms` });
    throw error;
  }
}

/**
 * Execute multiple operations in a transaction
 * Useful for batch operations
 */
export async function batchTransaction<T>(
  operations: Array<(tx: NodePgDatabase) => Promise<T>>,
  operationName: string = 'batch-transaction'
): Promise<T[]> {
  return withTransaction(async (tx) => {
    const results: T[] = [];

    for (const operation of operations) {
      const result = await operation(tx);
      results.push(result);
    }

    return results;
  }, operationName);
}

/**
 * Retry a transaction on failure
 * Useful for handling transient errors
 */
export async function retryTransaction<T>(
  fn: (tx: NodePgDatabase) => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    operationName = 'retry-transaction',
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(fn, `${operationName} (attempt ${attempt})`);
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        logger.warn(`Transaction failed, retrying...`, {
          operationName,
          attempt,
          maxRetries,
          error: lastError.message,
        });

        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  logger.error(`Transaction failed after ${maxRetries} attempts`, lastError!, {
    operationName,
  });

  throw lastError;
}

/**
 * Check if error is a constraint violation
 */
export function isConstraintError(error: any): boolean {
  if (!error) return false;

  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';

  return (
    message.includes('unique constraint') ||
    message.includes('foreign key constraint') ||
    message.includes('check constraint') ||
    code === '23505' || // PostgreSQL unique violation
    code === '23503'    // PostgreSQL foreign key violation
  );
}

/**
 * Check if error is a deadlock
 */
export function isDeadlockError(error: any): boolean {
  if (!error) return false;

  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';

  return (
    message.includes('deadlock') ||
    code === '40p01' // PostgreSQL deadlock
  );
}

/**
 * Handle database errors with appropriate logging and response
 */
export function handleDatabaseError(error: any, operation: string): never {
  if (isConstraintError(error)) {
    logger.warn(`Constraint violation in ${operation}`, {
      error: error.message,
    });
    throw new Error('Data constraint violation. Please check your input.');
  }

  if (isDeadlockError(error)) {
    logger.warn(`Deadlock detected in ${operation}`, {
      error: error.message,
    });
    throw new Error('Database is busy. Please try again.');
  }

  logger.error(`Database error in ${operation}`, error);
  throw new Error('Database operation failed');
}

/**
 * Safe upsert helper
 * Handles race conditions with proper error handling
 */
export async function safeUpsert<T>(
  operation: (tx: NodePgDatabase) => Promise<T>,
  operationName: string = 'upsert'
): Promise<T> {
  try {
    return await withTransaction(operation, operationName);
  } catch (error) {
    if (isConstraintError(error)) {
      logger.debug(`Retrying ${operationName} after constraint error`);
      return await withTransaction(operation, `${operationName}-retry`);
    }
    throw error;
  }
}
