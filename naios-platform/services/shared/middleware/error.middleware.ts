/**
 * NAIOS Platform - Error Handling Middleware
 *
 * Centralized error handling for Express applications
 *
 * @module shared/middleware/error
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiError } from '../types';

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Conflict error
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
    this.name = 'ConflictError';
  }
}

/**
 * Bad request error
 */
export class BadRequestError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'BAD_REQUEST', message, details);
    this.name = 'BadRequestError';
  }
}

/**
 * Internal server error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(500, 'INTERNAL_ERROR', message, details);
    this.name = 'InternalServerError';
  }
}

// ============================================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================================

/**
 * Global error handling middleware
 *
 * @example
 * ```typescript
 * app.use(errorHandler);
 * ```
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate request ID if not exists
  const requestId = (req as any).id || 'unknown';

  // Default error response
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;
  let stack: string | undefined = undefined;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  }
  // Handle validation errors from libraries
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.message;
  }
  // Handle database errors
  else if ((err as any).code) {
    const dbError = err as any;

    switch (dbError.code) {
      case '23505': // Unique violation
        statusCode = 409;
        errorCode = 'DUPLICATE_ENTRY';
        message = 'A record with this value already exists';
        details = { constraint: dbError.constraint };
        break;

      case '23503': // Foreign key violation
        statusCode = 400;
        errorCode = 'FOREIGN_KEY_VIOLATION';
        message = 'Referenced record does not exist';
        details = { constraint: dbError.constraint };
        break;

      case '23502': // Not null violation
        statusCode = 400;
        errorCode = 'MISSING_REQUIRED_FIELD';
        message = 'Required field is missing';
        details = { column: dbError.column };
        break;

      case '22P02': // Invalid text representation
        statusCode = 400;
        errorCode = 'INVALID_DATA_TYPE';
        message = 'Invalid data type provided';
        break;

      default:
        statusCode = 500;
        errorCode = 'DATABASE_ERROR';
        message = 'Database operation failed';
    }
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    stack = err.stack;
  }

  // Log the error
  logger.error('Request error', {
    requestId,
    statusCode,
    errorCode,
    message,
    details,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user_id: (req as any).user?.user_id
  });

  // Send error response
  const errorResponse: ApiError = {
    code: errorCode,
    message,
    details,
    timestamp: new Date().toISOString(),
    request_id: requestId
  };

  if (stack) {
    errorResponse.stack = stack;
  }

  res.status(statusCode).json({
    success: false,
    error: errorResponse
  });
}

/**
 * 404 Not Found handler
 *
 * @example
 * ```typescript
 * app.use(notFoundHandler);
 * ```
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 *
 * @param fn - Async function to wrap
 * @returns Wrapped function
 *
 * @example
 * ```typescript
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsers();
 *   res.json({ success: true, data: users });
 * }));
 * ```
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================================================
// EXPORT ALL ERROR UTILITIES
// ============================================================================

export default {
  // Error classes
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  InternalServerError,

  // Middleware
  errorHandler,
  notFoundHandler,
  asyncHandler
};
