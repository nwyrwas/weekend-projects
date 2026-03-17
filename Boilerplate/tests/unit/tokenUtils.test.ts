import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '../../src/utils/tokenUtils';
import { AppError } from '../../src/utils/AppError';

describe('Token Utils', () => {
  const mockAccessPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'USER' as const,
  };

  const mockRefreshPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    tokenId: '987fcdeb-51a2-3c4d-5e6f-789012345678',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = generateAccessToken(mockAccessPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload in token', () => {
      const token = generateAccessToken(mockAccessPayload);
      const decoded = jwt.decode(token) as jwt.JwtPayload;

      expect(decoded.userId).toBe(mockAccessPayload.userId);
      expect(decoded.email).toBe(mockAccessPayload.email);
      expect(decoded.role).toBe(mockAccessPayload.role);
    });

    it('should set expiration time', () => {
      const token = generateAccessToken(mockAccessPayload);
      const decoded = jwt.decode(token) as jwt.JwtPayload;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat!);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = generateRefreshToken(mockRefreshPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload in token', () => {
      const token = generateRefreshToken(mockRefreshPayload);
      const decoded = jwt.decode(token) as jwt.JwtPayload;

      expect(decoded.userId).toBe(mockRefreshPayload.userId);
      expect(decoded.tokenId).toBe(mockRefreshPayload.tokenId);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and return decoded payload for valid token', () => {
      const token = generateAccessToken(mockAccessPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(mockAccessPayload.userId);
      expect(decoded.email).toBe(mockAccessPayload.email);
      expect(decoded.role).toBe(mockAccessPayload.role);
    });

    it('should throw AppError for invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow(AppError);
    });

    it('should throw AppError with INVALID_TOKEN code for malformed token', () => {
      try {
        verifyAccessToken('invalid.token.here');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).errorCode).toBe('INVALID_TOKEN');
      }
    });

    it('should throw AppError for expired token', () => {
      const expiredToken = jwt.sign(
        mockAccessPayload,
        process.env.JWT_ACCESS_SECRET || 'test-access-secret-key-min-32-characters-long',
        { expiresIn: '-1s' }
      );

      try {
        verifyAccessToken(expiredToken);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).errorCode).toBe('TOKEN_EXPIRED');
      }
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and return decoded payload for valid token', () => {
      const token = generateRefreshToken(mockRefreshPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.userId).toBe(mockRefreshPayload.userId);
      expect(decoded.tokenId).toBe(mockRefreshPayload.tokenId);
    });

    it('should throw AppError for invalid token', () => {
      expect(() => verifyRefreshToken('invalid.token.here')).toThrow(AppError);
    });
  });

  describe('getRefreshTokenExpiry', () => {
    it('should return a future date', () => {
      const expiry = getRefreshTokenExpiry();
      const now = new Date();

      expect(expiry).toBeInstanceOf(Date);
      expect(expiry.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should return approximately 7 days in the future for default config', () => {
      const expiry = getRefreshTokenExpiry();
      const now = new Date();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const diff = expiry.getTime() - now.getTime();

      expect(diff).toBeGreaterThan(sevenDaysMs - 1000);
      expect(diff).toBeLessThan(sevenDaysMs + 1000);
    });
  });
});
