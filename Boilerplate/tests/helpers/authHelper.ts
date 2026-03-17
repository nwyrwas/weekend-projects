import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';

interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export function generateTestAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'test-access-secret-key-min-32-characters-long', {
    expiresIn: '15m',
  });
}

export function generateTestRefreshToken(userId: string, tokenId: string): string {
  return jwt.sign(
    { userId, tokenId },
    process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key-min-32-characters-long',
    { expiresIn: '7d' }
  );
}

export function generateExpiredAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'test-access-secret-key-min-32-characters-long', {
    expiresIn: '-1s',
  });
}

export function generateInvalidToken(): string {
  return 'invalid.token.here';
}
