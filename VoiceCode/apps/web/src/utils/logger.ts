/**
 * Production-Safe Logger Utility
 *
 * SECURITY: Prevents sensitive data from being logged in production.
 * Only logs in development mode unless explicitly allowed.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  /** Always log regardless of environment (use sparingly) */
  forceLog?: boolean;
  /** Sanitize object properties before logging */
  sanitize?: boolean;
}

/** Properties that should never be logged (all lowercase for case-insensitive matching) */
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'apikey',
  'api_key',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'authorization',
  'cookie',
  'session',
  'creditcard',
  'credit_card',
  'ssn',
  'email', // Be careful with PII
]);

/**
 * Sanitize an object by removing sensitive keys
 */
function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Check if we should log based on environment
 */
function shouldLog(level: LogLevel, options?: LoggerOptions): boolean {
  // Always log errors
  if (level === 'error') {
    return true;
  }

  // Force log if explicitly requested
  if (options?.forceLog) {
    return true;
  }

  // Only log debug/info/warn in development
  return import.meta.env.DEV;
}

/**
 * Format arguments for logging
 */
function formatArgs(args: unknown[], options?: LoggerOptions): unknown[] {
  if (!options?.sanitize) {
    return args;
  }

  return args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      return sanitizeObject(arg);
    }
    return arg;
  });
}

/**
 * Production-safe logger
 *
 * @example
 * ```ts
 * import { logger } from '@/utils/logger';
 *
 * logger.debug('Debug message');           // Only in dev
 * logger.info('Info message');             // Only in dev
 * logger.warn('Warning message');          // Only in dev
 * logger.error('Error message');           // Always logged
 * logger.error('User data:', { sanitize: true }, userData); // Sanitized
 * ```
 */
export const logger = {
  /**
   * Debug level logging (development only)
   */
  debug(...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * Info level logging (development only)
   */
  info(...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Warning level logging (development only)
   */
  warn(...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Error level logging (always logged, sanitized)
   */
  error(...args: unknown[]): void {
    // Always sanitize error logs to prevent accidental PII exposure
    const sanitizedArgs = formatArgs(args, { sanitize: true });
    console.error('[ERROR]', ...sanitizedArgs);
  },

  /**
   * Log with explicit options
   */
  log(level: LogLevel, options: LoggerOptions, ...args: unknown[]): void {
    if (!shouldLog(level, options)) {
      return;
    }

    const formattedArgs = formatArgs(args, options);
    const prefix = `[${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        console.debug(prefix, ...formattedArgs);
        break;
      case 'info':
        console.info(prefix, ...formattedArgs);
        break;
      case 'warn':
        console.warn(prefix, ...formattedArgs);
        break;
      case 'error':
        console.error(prefix, ...formattedArgs);
        break;
    }
  },

  /**
   * Group related logs (development only)
   */
  group(label: string, fn: () => void): void {
    if (!import.meta.env.DEV) {
      return;
    }
    console.group(label);
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  },

  /**
   * Time an operation (development only)
   */
  time(label: string): () => void {
    if (!import.meta.env.DEV) {
      return () => {};
    }
    console.time(label);
    return () => console.timeEnd(label);
  },
};

export default logger;
