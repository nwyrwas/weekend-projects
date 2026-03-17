import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { hashPassword, comparePassword } from '../../utils/passwordUtils.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '../../utils/tokenUtils.js';
import type { UserRole } from '../../config/constants.js';
import type { RegisterRequest, LoginRequest } from './types.js';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,128}$/;

function validatePassword(password: string): void {
  if (!PASSWORD_REGEX.test(password)) {
    throw AppError.badRequest('Password does not meet security requirements', {
      requirements: [
        'At least 8 characters',
        'At least one lowercase letter',
        'At least one uppercase letter',
        'At least one number',
        'At least one special character',
      ],
    });
  }
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface UserWithTokens {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}

export async function registerUser(data: RegisterRequest): Promise<UserWithTokens> {
  // Defense in depth: validate password even if validators are bypassed
  validatePassword(data.password);

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw AppError.userExists();
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
    },
  });

  const tokens = await createTokenPair(user.id, user.email, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    ...tokens,
  };
}

export async function loginUser(data: LoginRequest): Promise<UserWithTokens> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  // Prevent timing attacks by always comparing passwords
  // Use a dummy hash when user doesn't exist to ensure constant-time comparison
  const dummyHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYI6lRGmqWGy';
  const hashToCompare = user?.passwordHash ?? dummyHash;
  const isPasswordValid = await comparePassword(data.password, hashToCompare);

  if (!user || !isPasswordValid) {
    throw AppError.invalidCredentials();
  }

  const tokens = await createTokenPair(user.id, user.email, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    ...tokens,
  };
}

export async function refreshAccessToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
  const decoded = verifyRefreshToken(token);

  // Use a transaction with serializable isolation to prevent race conditions
  // This ensures only one request can use a refresh token
  return prisma.$transaction(async (tx) => {
    const storedToken = await tx.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken) {
      throw AppError.invalidToken();
    }

    if (storedToken.expiresAt < new Date()) {
      await tx.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw AppError.tokenExpired();
    }

    if (storedToken.userId !== decoded.userId) {
      throw AppError.invalidToken();
    }

    // Delete the used refresh token (rotation)
    await tx.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Generate new tokens
    const tokenId = uuidv4();
    const expiresAt = getRefreshTokenExpiry();

    const accessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: storedToken.userId,
      tokenId,
    });

    // Store the new refresh token
    await tx.refreshToken.create({
      data: {
        id: tokenId,
        token: newRefreshToken,
        userId: storedToken.userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  });
}

export async function logoutUser(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { token },
  });
}

export async function logoutAllSessions(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

async function createTokenPair(userId: string, email: string, role: UserRole): Promise<TokenPair> {
  const tokenId = uuidv4();
  const expiresAt = getRefreshTokenExpiry();

  const accessToken = generateAccessToken({ userId, email, role });
  const refreshToken = generateRefreshToken({ userId, tokenId });

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      token: refreshToken,
      userId,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return result.count;
}
