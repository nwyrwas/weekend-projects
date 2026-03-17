import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../../src/middleware/auth';
import { generateTestAccessToken, generateExpiredAccessToken, generateInvalidToken } from '../../helpers';
import { AppError } from '../../../src/utils/AppError';

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('should call next() with valid token', () => {
      const token = generateTestAccessToken({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'USER',
      });

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(mockReq.user?.email).toBe('test@example.com');
      expect(mockReq.user?.role).toBe('USER');
    });

    it('should throw error without authorization header', () => {
      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error with invalid bearer format', () => {
      mockReq.headers = {
        authorization: 'InvalidFormat token',
      };

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);
    });

    it('should throw error with empty token', () => {
      mockReq.headers = {
        authorization: 'Bearer ',
      };

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);
    });

    it('should throw error with invalid token', () => {
      mockReq.headers = {
        authorization: `Bearer ${generateInvalidToken()}`,
      };

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);
    });

    it('should throw error with expired token', () => {
      const expiredToken = generateExpiredAccessToken({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'USER',
      });

      mockReq.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);
    });
  });

  describe('authorize', () => {
    it('should call next() when user has required role', () => {
      mockReq.user = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'admin@example.com',
        role: 'ADMIN',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      const middleware = authorize('ADMIN');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() when user has one of multiple required roles', () => {
      mockReq.user = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'moderator@example.com',
        role: 'MODERATOR',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      const middleware = authorize('ADMIN', 'MODERATOR');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw error when user lacks required role', () => {
      mockReq.user = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        role: 'USER',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      const middleware = authorize('ADMIN');

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);
    });

    it('should throw error when no user is present', () => {
      mockReq.user = undefined;

      const middleware = authorize('ADMIN');

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);
    });

    it('should call next() when no roles are specified (any authenticated user)', () => {
      mockReq.user = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        role: 'USER',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      const middleware = authorize();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
