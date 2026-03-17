import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../config/constants.js';
import { env } from '../config/env.js';
import { logger } from './logging.js';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId: string | undefined;
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.requestId;

  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
      requestId,
    };

    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, 'Server error');
    } else {
      logger.warn({ err: { message: err.message, code: err.errorCode }, requestId }, 'Client error');
    }

    res.status(err.statusCode).json(response);
    return;
  }

  logger.error({ err, requestId }, 'Unhandled error');

  const response: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
    requestId,
  };

  res.status(500).json(response);
};

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404, ERROR_CODES.NOT_FOUND));
}
