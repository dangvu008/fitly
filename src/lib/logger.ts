/**
 * Production-safe logging utility
 * 
 * Provides structured logging with log levels that can be controlled
 * based on environment. In production, only warnings and errors are logged.
 * 
 * @example
 * import { logger } from '@/lib/logger';
 * 
 * logger.debug('Processing started', { itemCount: 5 });
 * logger.info('User logged in', { userId: '123' });
 * logger.warn('Rate limit approaching', { remaining: 10 });
 * logger.error('Failed to process', new Error('Network error'));
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: unknown;
}

interface Logger {
  /** Debug level - only shown in development */
  debug(message: string, data?: LogData): void;
  /** Info level - general information */
  info(message: string, data?: LogData): void;
  /** Warning level - potential issues */
  warn(message: string, data?: LogData): void;
  /** Error level - errors and exceptions */
  error(message: string, error?: Error | unknown, data?: LogData): void;
}

const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

/**
 * Format log message with timestamp and level
 */
const formatMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

/**
 * Sanitize data to prevent logging sensitive information
 */
const sanitizeData = (data?: LogData): LogData | undefined => {
  if (!data) return undefined;
  
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];
  const sanitized: LogData = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

export const logger: Logger = {
  debug: (message: string, data?: LogData): void => {
    // Only log debug in development
    if (isDevelopment) {
      console.debug(formatMessage('debug', message), sanitizeData(data) ?? '');
    }
  },

  info: (message: string, data?: LogData): void => {
    // Log info in development, skip in production unless explicitly enabled
    if (isDevelopment) {
      console.info(formatMessage('info', message), sanitizeData(data) ?? '');
    }
  },

  warn: (message: string, data?: LogData): void => {
    // Always log warnings
    console.warn(formatMessage('warn', message), sanitizeData(data) ?? '');
  },

  error: (message: string, error?: Error | unknown, data?: LogData): void => {
    // Always log errors
    const errorInfo = error instanceof Error 
      ? { name: error.name, message: error.message, stack: isDevelopment ? error.stack : undefined }
      : error;
    
    console.error(formatMessage('error', message), {
      error: errorInfo,
      ...sanitizeData(data),
    });
  },
};

/**
 * Create a scoped logger with a prefix
 * 
 * @example
 * const authLogger = createScopedLogger('Auth');
 * authLogger.info('User logged in'); // [Auth] User logged in
 */
export const createScopedLogger = (scope: string): Logger => ({
  debug: (message, data) => logger.debug(`[${scope}] ${message}`, data),
  info: (message, data) => logger.info(`[${scope}] ${message}`, data),
  warn: (message, data) => logger.warn(`[${scope}] ${message}`, data),
  error: (message, error, data) => logger.error(`[${scope}] ${message}`, error, data),
});

export default logger;
