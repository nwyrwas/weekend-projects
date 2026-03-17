import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken, type DecodedAccessToken } from '../utils/tokenUtils.js';
import type { UserRole } from '../config/constants.js';

declare global {
  namespace Express {
    interface Request {
      user?: DecodedAccessToken;
      requestId?: string;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('No token provided');
  }

  const token = authHeader.slice(7);

  if (!token) {
    throw AppError.unauthorized('No token provided');
  }

  const decoded = verifyAccessToken(token);
  req.user = decoded;
  next();
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      throw AppError.forbidden('Insufficient permissions');
    }

    next();
  };
}
