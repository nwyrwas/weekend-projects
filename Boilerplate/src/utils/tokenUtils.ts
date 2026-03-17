import jwt, { type JwtPayload, type SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';
import type { UserRole } from '../config/constants.js';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export interface DecodedAccessToken extends AccessTokenPayload, JwtPayload {}
export interface DecodedRefreshToken extends RefreshTokenPayload, JwtPayload {}

export function generateAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    algorithm: 'HS256',
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    algorithm: 'HS256',
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): DecodedAccessToken {
  try {
    // Enforce algorithm to prevent algorithm confusion attacks
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    }) as DecodedAccessToken;
    return decoded;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw AppError.tokenExpired();
    }
    throw AppError.invalidToken();
  }
}

export function verifyRefreshToken(token: string): DecodedRefreshToken {
  try {
    // Enforce algorithm to prevent algorithm confusion attacks
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
    }) as DecodedRefreshToken;
    return decoded;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw AppError.tokenExpired();
    }
    throw AppError.invalidToken();
  }
}

export function getRefreshTokenExpiry(): Date {
  const expiresIn = env.JWT_REFRESH_EXPIRES_IN;
  const now = new Date();

  const match = expiresIn.match(/^(\d+)([smhdw])$/);
  if (!match) {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  const value = parseInt(match[1] as string, 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  const multiplier = multipliers[unit as string] ?? 7 * 24 * 60 * 60 * 1000;
  return new Date(now.getTime() + value * multiplier);
}
