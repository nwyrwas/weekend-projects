import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

interface CreateUserOptions {
  email?: string;
  password?: string;
  role?: Role;
}

interface CreatedUser {
  id: string;
  email: string;
  role: Role;
  password: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createUser(options: CreateUserOptions = {}): Promise<CreatedUser> {
  const email = options.email || `test-${uuidv4()}@example.com`;
  const password = options.password || 'TestPassword123!';
  const role = options.role || 'USER';

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
    },
  });

  return {
    ...user,
    password,
  };
}

export async function createAdmin(options: Omit<CreateUserOptions, 'role'> = {}): Promise<CreatedUser> {
  return createUser({ ...options, role: 'ADMIN' });
}

export async function createModerator(options: Omit<CreateUserOptions, 'role'> = {}): Promise<CreatedUser> {
  return createUser({ ...options, role: 'MODERATOR' });
}

interface CreateRefreshTokenOptions {
  userId: string;
  token?: string;
  expiresAt?: Date;
}

export async function createRefreshToken(options: CreateRefreshTokenOptions) {
  const token = options.token || uuidv4();
  const expiresAt = options.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return prisma.refreshToken.create({
    data: {
      token,
      userId: options.userId,
      expiresAt,
    },
  });
}

export async function createExpiredRefreshToken(userId: string) {
  return createRefreshToken({
    userId,
    expiresAt: new Date(Date.now() - 1000),
  });
}

export { prisma };
