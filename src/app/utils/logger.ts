/**
 * Centralized logging utility for the application
 * Provides structured logging with environment-aware behavior
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, context ? context : '');
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context ? context : '');
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context ? context : '');
  }

  /**
   * Log error messages (always logged)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorInfo = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      ...context,
    } : { error, ...context };

    console.error(`[ERROR] ${message}`, errorInfo);
  }

  /**
   * Log API errors with structured format
   */
  apiError(endpoint: string, error: Error | unknown, context?: LogContext): void {
    this.error(`API Error at ${endpoint}`, error, {
      endpoint,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();
