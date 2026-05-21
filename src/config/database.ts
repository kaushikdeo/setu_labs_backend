import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  logger.info(`MongoDB connected — db: ${env.mongodbDb}`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
