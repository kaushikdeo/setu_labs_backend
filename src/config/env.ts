import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';

const NODE_ENV = process.env.NODE_ENV || 'development';

dotenv.config({
  path: path.resolve(process.cwd(), `.env.${NODE_ENV}`),
});

const envSchema = Joi.object({
  PORT: Joi.number().required(),
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').required(),
  NODE_ENV: Joi.string().valid('development', 'qa', 'production', 'test').required(),
  MONGODB_URI: Joi.string().required(),
  MONGODB_DB: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  REFRESH_TOKEN_SECRET: Joi.string().required(),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
}).unknown();

const { error, value } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export const env = {
  nodeEnv: NODE_ENV,
  port: Number(value.PORT),
  logLevel: value.LOG_LEVEL as string,
  mongodbUri: value.MONGODB_URI as string,
  mongodbDb: value.MONGODB_DB as string,
  jwtSecret: value.JWT_SECRET as string,
  jwtExpiresIn: value.JWT_EXPIRES_IN as string,
  refreshTokenSecret: value.REFRESH_TOKEN_SECRET as string,
  refreshTokenExpiresIn: value.REFRESH_TOKEN_EXPIRES_IN as string,
};
