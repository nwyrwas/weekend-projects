import { type ErrorCode, ERROR_CODES } from '../config/constants.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    errorCode: ErrorCode,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR, details);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(message, 401, ERROR_CODES.UNAUTHORIZED);
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(message, 403, ERROR_CODES.FORBIDDEN);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(message, 404, ERROR_CODES.NOT_FOUND);
  }

  static conflict(message: string, errorCode: ErrorCode = ERROR_CODES.CONFLICT): AppError {
    return new AppError(message, 409, errorCode);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, 500, ERROR_CODES.INTERNAL_ERROR);
  }

  static invalidCredentials(): AppError {
    return new AppError('Invalid email or password', 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  static invalidToken(): AppError {
    return new AppError('Invalid token', 401, ERROR_CODES.INVALID_TOKEN);
  }

  static tokenExpired(): AppError {
    return new AppError('Token has expired', 401, ERROR_CODES.TOKEN_EXPIRED);
  }

  static userExists(): AppError {
    return new AppError('User with this email already exists', 409, ERROR_CODES.USER_EXISTS);
  }

  static userNotFound(): AppError {
    return new AppError('User not found', 404, ERROR_CODES.USER_NOT_FOUND);
  }

  static rateLimitExceeded(): AppError {
    return new AppError('Too many requests, please try again later', 429, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  }
}
