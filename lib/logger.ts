/**
 * Structured Logging System
 * 
 * Provides consistent, structured logging across the application.
 * Replaces console.log/error with proper logging infrastructure.
 * Integrates with error monitoring services (Sentry, etc.)
 * 
 * Fix for Assumptions: 7.2, 13.1, 13.2
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

// Error monitoring integration (Sentry, Datadog, etc.)
interface ErrorMonitoring {
  captureException(error: Error, context?: LogContext): void;
  captureMessage(message: string, level: string, context?: LogContext): void;
}

class Logger {
  private isDevelopment: boolean;
  private errorMonitoring?: ErrorMonitoring;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.initializeErrorMonitoring();
  }

  /**
   * Initialize error monitoring service
   * Supports Sentry or similar services
   */
  private initializeErrorMonitoring(): void {
    // Check if Sentry is configured
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && typeof window !== 'undefined') {
      // Client-side Sentry integration
      // Note: Actual Sentry initialization should be done in _app.tsx
      // This is just the logger integration point
    }

    // Server-side error monitoring
    if (process.env.SENTRY_DSN && typeof window === 'undefined') {
      try {
        // Dynamic import to avoid bundling if not configured
        // Only load Sentry if it's actually installed
        const Sentry = eval('require')('@sentry/nextjs');
        this.errorMonitoring = {
          captureException: (error: Error, context?: LogContext) => {
            Sentry.captureException(error, { extra: context });
          },
          captureMessage: (message: string, level: string, context?: LogContext) => {
            Sentry.captureMessage(message, level as any, { extra: context });
          },
        };
      } catch (e) {
        // Sentry not installed, continue without monitoring
        if (this.isDevelopment) {
          console.warn('Error monitoring not configured (Sentry not installed)');
        }
      }
    }
  }

  /**
   * Format log entry as JSON for production, pretty print for development
   */
  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty print for development
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[entry.level];

      let output = `${emoji} [${entry.level.toUpperCase()}] ${entry.message}`;
      
      if (entry.context && Object.keys(entry.context).length > 0) {
        output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
      }
      
      if (entry.error) {
        output += `\n  Error: ${entry.error.message}`;
        if (entry.error.stack) {
          output += `\n  Stack: ${entry.error.stack}`;
        }
      }
      
      return output;
    } else {
      // JSON for production (easy to parse by log aggregators)
      return JSON.stringify(entry);
    }
  }

  /**
   * Write log to appropriate output
   */
  private write(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }

    const formatted = this.formatLog(entry);

    // Write to appropriate stream
    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }

    // Send to error monitoring service
    if (this.errorMonitoring) {
      if (level === 'error' && error) {
        this.errorMonitoring.captureException(error, context);
      } else if (level === 'error' || level === 'warn') {
        this.errorMonitoring.captureMessage(message, level, context);
      }
    }
  }

  /**
   * Debug level logging (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.write('debug', message, context);
    }
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    this.write('info', message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    this.write('warn', message, context);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.write('error', message, context, error);
  }

  /**
   * Log database query (development only)
   */
  query(sql: string, params?: any[], duration?: number): void {
    if (this.isDevelopment) {
      this.debug('Database Query', {
        sql,
        params,
        duration: duration ? `${duration}ms` : undefined,
      });
    }
  }

  /**
   * Log API request
   */
  request(method: string, path: string, context?: LogContext): void {
    this.info(`${method} ${path}`, context);
  }

  /**
   * Log API response
   */
  response(method: string, path: string, status: number, duration: number): void {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    this.write(level, `${method} ${path} ${status}`, {
      status,
      duration: `${duration}ms`,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Helper to measure execution time
 */
export async function measureTime<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.debug(`${operation} completed`, { duration: `${duration}ms` });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${operation} failed`, error as Error, { duration: `${duration}ms` });
    throw error;
  }
}

/**
 * Helper to log and rethrow errors
 */
export function logAndThrow(message: string, error: Error, context?: LogContext): never {
  logger.error(message, error, context);
  throw error;
}
