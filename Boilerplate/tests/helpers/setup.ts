import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-min-32-characters-long';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-characters-long';
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.CORS_ORIGIN = '*';
  process.env.LOG_LEVEL = 'error';
  process.env.RATE_LIMIT_WINDOW_MS = '900000';
  process.env.RATE_LIMIT_MAX_REQUESTS = '1000';
  process.env.AUTH_RATE_LIMIT_WINDOW_MS = '900000';
  process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = '100';
  process.env.COOKIE_SECURE = 'false';
  process.env.COOKIE_SAME_SITE = 'lax';
});

afterAll(async () => {
  await prisma.$disconnect();
});
