import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).pipe(z.number().positive()).default('3000'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
      .default('info'),

    DATABASE_URL: z.string().url().startsWith('postgresql://'),

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    CORS_ORIGIN: z.string().default('http://localhost:3000'),

    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),
    AUTH_RATE_LIMIT_WINDOW_MS: z
      .string()
      .transform(Number)
      .pipe(z.number().positive())
      .default('900000'),
    AUTH_RATE_LIMIT_MAX_REQUESTS: z
      .string()
      .transform(Number)
      .pipe(z.number().positive())
      .default('5'),

    COOKIE_DOMAIN: z.string().optional().default(''),
    COOKIE_SECURE: z
      .string()
      .transform((val) => val === 'true')
      .default('false'),
    COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  })
  .refine(
    (data) => {
      // SameSite=none requires Secure=true
      if (data.COOKIE_SAME_SITE === 'none' && !data.COOKIE_SECURE) {
        return false;
      }
      return true;
    },
    {
      message: 'COOKIE_SECURE must be true when COOKIE_SAME_SITE is "none"',
      path: ['COOKIE_SECURE'],
    }
  )
  .refine(
    (data) => {
      // Production should use secure cookies
      if (data.NODE_ENV === 'production' && !data.COOKIE_SECURE) {
        return false;
      }
      return true;
    },
    {
      message: 'COOKIE_SECURE must be true in production environment',
      path: ['COOKIE_SECURE'],
    }
  );

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  return result.data;
}

export const env = validateEnv();
