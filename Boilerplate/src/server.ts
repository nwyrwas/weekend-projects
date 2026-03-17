import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './prisma/client.js';
import { logger } from './middleware/logging.js';

const app = createApp();

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    logger.info('Database connected successfully');

    const server = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT, env: env.NODE_ENV }, `Server started on port ${env.PORT}`);
    });

    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info({ signal }, 'Received shutdown signal');

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await disconnectDatabase();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error({ error }, 'Error during database disconnection');
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => {
      void gracefulShutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      void gracefulShutdown('SIGINT');
    });

    process.on('uncaughtException', (error) => {
      logger.fatal({ error }, 'Uncaught exception');
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.fatal({ reason }, 'Unhandled rejection');
      process.exit(1);
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

void startServer();
