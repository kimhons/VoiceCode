/**
 * Logger Service
 * Structured logging with level-based filtering.
 * In production builds, debug/info logs are stripped by Vite's dead-code elimination.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LOG_LEVEL: LogLevel = import.meta.env.DEV ? 'debug' : 'warn';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL];
}

function formatEntry(entry: LogEntry): string {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
  const ctx = entry.context ? ` [${entry.context}]` : '';
  return `${prefix}${ctx} ${entry.message}`;
}

function createEntry(
  level: LogLevel,
  message: string,
  context?: string,
  data?: Record<string, unknown>
): LogEntry {
  return {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  };
}

export const logger = {
  debug(message: string, context?: string, data?: Record<string, unknown>): void {
    if (import.meta.env.DEV && shouldLog('debug')) {
      const entry = createEntry('debug', message, context, data);
      console.debug(formatEntry(entry), data ?? '');
    }
  },

  info(message: string, context?: string, data?: Record<string, unknown>): void {
    if (import.meta.env.DEV && shouldLog('info')) {
      const entry = createEntry('info', message, context, data);
      console.info(formatEntry(entry), data ?? '');
    }
  },

  warn(message: string, context?: string, data?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      const entry = createEntry('warn', message, context, data);
      console.warn(formatEntry(entry), data ?? '');
    }
  },

  error(message: string, context?: string, data?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      const entry = createEntry('error', message, context, data);
      console.error(formatEntry(entry), data ?? '');
    }
  },
};
