import { AppError } from '../../src/utils/AppError';
import { ERROR_CODES } from '../../src/config/constants';

describe('AppError', () => {
  describe('constructor', () => {
    it('should create an error with correct properties', () => {
      const error = new AppError('Test error', 400, ERROR_CODES.VALIDATION_ERROR);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.isOperational).toBe(true);
    });

    it('should accept optional details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new AppError('Test error', 400, ERROR_CODES.VALIDATION_ERROR, details);

      expect(error.details).toEqual(details);
    });

    it('should be an instance of Error', () => {
      const error = new AppError('Test error', 400, ERROR_CODES.VALIDATION_ERROR);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should have a stack trace', () => {
      const error = new AppError('Test error', 400, ERROR_CODES.VALIDATION_ERROR);

      expect(error.stack).toBeDefined();
    });
  });

  describe('static factory methods', () => {
    describe('badRequest', () => {
      it('should create a 400 error', () => {
        const error = AppError.badRequest('Bad request');

        expect(error.statusCode).toBe(400);
        expect(error.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
        expect(error.message).toBe('Bad request');
      });

      it('should accept details', () => {
        const details = { errors: ['field1', 'field2'] };
        const error = AppError.badRequest('Bad request', details);

        expect(error.details).toEqual(details);
      });
    });

    describe('unauthorized', () => {
      it('should create a 401 error with default message', () => {
        const error = AppError.unauthorized();

        expect(error.statusCode).toBe(401);
        expect(error.errorCode).toBe(ERROR_CODES.UNAUTHORIZED);
        expect(error.message).toBe('Unauthorized');
      });

      it('should accept custom message', () => {
        const error = AppError.unauthorized('Custom unauthorized message');

        expect(error.message).toBe('Custom unauthorized message');
      });
    });

    describe('forbidden', () => {
      it('should create a 403 error with default message', () => {
        const error = AppError.forbidden();

        expect(error.statusCode).toBe(403);
        expect(error.errorCode).toBe(ERROR_CODES.FORBIDDEN);
        expect(error.message).toBe('Forbidden');
      });

      it('should accept custom message', () => {
        const error = AppError.forbidden('Access denied');

        expect(error.message).toBe('Access denied');
      });
    });

    describe('notFound', () => {
      it('should create a 404 error with default message', () => {
        const error = AppError.notFound();

        expect(error.statusCode).toBe(404);
        expect(error.errorCode).toBe(ERROR_CODES.NOT_FOUND);
        expect(error.message).toBe('Resource not found');
      });

      it('should accept custom message', () => {
        const error = AppError.notFound('User not found');

        expect(error.message).toBe('User not found');
      });
    });

    describe('conflict', () => {
      it('should create a 409 error', () => {
        const error = AppError.conflict('Resource already exists');

        expect(error.statusCode).toBe(409);
        expect(error.errorCode).toBe(ERROR_CODES.CONFLICT);
        expect(error.message).toBe('Resource already exists');
      });

      it('should accept custom error code', () => {
        const error = AppError.conflict('User exists', ERROR_CODES.USER_EXISTS);

        expect(error.errorCode).toBe(ERROR_CODES.USER_EXISTS);
      });
    });

    describe('internal', () => {
      it('should create a 500 error with default message', () => {
        const error = AppError.internal();

        expect(error.statusCode).toBe(500);
        expect(error.errorCode).toBe(ERROR_CODES.INTERNAL_ERROR);
        expect(error.message).toBe('Internal server error');
      });
    });

    describe('invalidCredentials', () => {
      it('should create a 401 error for invalid credentials', () => {
        const error = AppError.invalidCredentials();

        expect(error.statusCode).toBe(401);
        expect(error.errorCode).toBe(ERROR_CODES.INVALID_CREDENTIALS);
        expect(error.message).toBe('Invalid email or password');
      });
    });

    describe('invalidToken', () => {
      it('should create a 401 error for invalid token', () => {
        const error = AppError.invalidToken();

        expect(error.statusCode).toBe(401);
        expect(error.errorCode).toBe(ERROR_CODES.INVALID_TOKEN);
        expect(error.message).toBe('Invalid token');
      });
    });

    describe('tokenExpired', () => {
      it('should create a 401 error for expired token', () => {
        const error = AppError.tokenExpired();

        expect(error.statusCode).toBe(401);
        expect(error.errorCode).toBe(ERROR_CODES.TOKEN_EXPIRED);
        expect(error.message).toBe('Token has expired');
      });
    });

    describe('userExists', () => {
      it('should create a 409 error for existing user', () => {
        const error = AppError.userExists();

        expect(error.statusCode).toBe(409);
        expect(error.errorCode).toBe(ERROR_CODES.USER_EXISTS);
        expect(error.message).toBe('User with this email already exists');
      });
    });

    describe('userNotFound', () => {
      it('should create a 404 error for user not found', () => {
        const error = AppError.userNotFound();

        expect(error.statusCode).toBe(404);
        expect(error.errorCode).toBe(ERROR_CODES.USER_NOT_FOUND);
        expect(error.message).toBe('User not found');
      });
    });

    describe('rateLimitExceeded', () => {
      it('should create a 429 error for rate limit', () => {
        const error = AppError.rateLimitExceeded();

        expect(error.statusCode).toBe(429);
        expect(error.errorCode).toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED);
        expect(error.message).toBe('Too many requests, please try again later');
      });
    });
  });
});
