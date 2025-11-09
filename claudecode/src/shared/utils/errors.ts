export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class IntegrationError extends AppError {
  constructor(
    public integration: string,
    message: string,
    public originalError?: Error
  ) {
    super(`${integration} integration error: ${message}`, 502);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, public originalError?: Error) {
    super(`Database error: ${message}`, 500);
  }
}

export class AgentError extends AppError {
  constructor(
    public agentId: string,
    message: string,
    public originalError?: Error
  ) {
    super(`Agent ${agentId} error: ${message}`, 500);
  }
}

export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

export function handleError(error: Error): { message: string; statusCode: number } {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  return {
    message: 'An unexpected error occurred',
    statusCode: 500,
  };
}
