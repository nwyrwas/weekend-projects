import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import {
  httpLogger,
  requestIdMiddleware,
  sanitizeMiddleware,
  globalRateLimiter,
  errorHandler,
  notFoundHandler,
} from './middleware/index.js';
import { authRoutes } from './modules/auth/index.js';
import { usersRoutes } from './modules/users/index.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());

  const corsOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: corsOrigins.length === 1 && corsOrigins[0] === '*' ? '*' : corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposedHeaders: ['X-Request-ID'],
    })
  );

  app.use(requestIdMiddleware);

  app.use(httpLogger);

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  app.use(sanitizeMiddleware);

  app.use(globalRateLimiter);

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  });

  app.use('/auth', authRoutes);
  app.use('/users', usersRoutes);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
}
