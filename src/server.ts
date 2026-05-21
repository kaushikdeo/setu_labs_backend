import './config/env';
import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';

const PORT = env.port;

async function start() {
  await connectDatabase();
  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${env.nodeEnv} mode`);
  });

  function gracefulShutdown(signal: string) {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('HTTP server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown — connections did not close in time');
      process.exit(1);
    }, 10_000);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason: Error) => {
    logger.error('Unhandled Rejection:', reason);
    gracefulShutdown('unhandledRejection');
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
