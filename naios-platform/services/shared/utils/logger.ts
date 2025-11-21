/**
 * NAIOS Platform - Logging Utility
 *
 * Comprehensive logging utility using Winston with structured logging,
 * multiple transports, and contextual information.
 *
 * @module shared/utils/logger
 * @version 1.0.0
 */

import winston from 'winston';
import path from 'path';

// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_FORMAT = process.env.LOG_FORMAT || 'json';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// CUSTOM LOG FORMATS
// ============================================================================

/**
 * Custom format for development (colorized and pretty-printed)
 */
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

/**
 * Custom format for production (JSON structured logging)
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ============================================================================
// WINSTON LOGGER INSTANCE
// ============================================================================

/**
 * Create and configure Winston logger instance
 */
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'naios-platform',
    environment: NODE_ENV
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: NODE_ENV === 'production' ? prodFormat : devFormat
    })
  ],
  // Don't exit on error
  exitOnError: false
});

// Add file transports in production
if (NODE_ENV === 'production') {
  const logDir = process.env.LOG_DIR || 'logs';

  // Error log
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  );

  // Combined log
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  );
}

// ============================================================================
// HELPER METHODS
// ============================================================================

/**
 * Log with context
 *
 * @param level - Log level
 * @param message - Log message
 * @param context - Additional context
 */
function logWithContext(
  level: string,
  message: string,
  context?: Record<string, any>
): void {
  logger.log(level, message, {
    ...context,
    timestamp: new Date().toISOString()
  });
}

/**
 * Create a child logger with additional context
 *
 * @param context - Context to add to all logs
 * @returns Child logger instance
 *
 * @example
 * ```typescript
 * const requestLogger = createChildLogger({ requestId: '123' });
 * requestLogger.info('Processing request');
 * ```
 */
export function createChildLogger(context: Record<string, any>) {
  return logger.child(context);
}

// ============================================================================
// EXPORT LOGGER WITH CONVENIENCE METHODS
// ============================================================================

export default {
  ...logger,
  createChildLogger
};
