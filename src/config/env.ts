import dotenv from 'dotenv';
import path from 'node:path';
import Joi from 'joi';

const NODE_ENV = process.env.NODE_ENV || 'development';

dotenv.config({
  path: path.resolve(process.cwd(), `.env.${NODE_ENV}`),
});

const envSchema = Joi.object({
  PORT: Joi.number().default(3001),
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').required(),
  NODE_ENV: Joi.string().valid('development', 'qa', 'production', 'test').required(),
  MONGODB_URI: Joi.string().required(),
  MONGODB_DB: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  REFRESH_TOKEN_SECRET: Joi.string().required(),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
  // Storage — exactly one provider's credentials must be present
  STORAGE_PROVIDER: Joi.string().valid('cloudinary', 's3', 'azure').default('cloudinary'),
  CLOUDINARY_CLOUD_NAME: Joi.when('STORAGE_PROVIDER', { is: 'cloudinary', then: Joi.string().required(), otherwise: Joi.string().allow('').optional() }),
  CLOUDINARY_API_KEY: Joi.when('STORAGE_PROVIDER', { is: 'cloudinary', then: Joi.string().required(), otherwise: Joi.string().allow('').optional() }),
  CLOUDINARY_API_SECRET: Joi.when('STORAGE_PROVIDER', { is: 'cloudinary', then: Joi.string().required(), otherwise: Joi.string().allow('').optional() }),
  AWS_REGION: Joi.when('STORAGE_PROVIDER', { is: 's3', then: Joi.string().required(), otherwise: Joi.string().allow('').optional() }),
  AWS_ACCESS_KEY_ID: Joi.when('STORAGE_PROVIDER', { is: 's3', then: Joi.string().required(), otherwise: Joi.string().allow('').optional() }),
  AWS_SECRET_ACCESS_KEY: Joi.when('STORAGE_PROVIDER', { is: 's3', then: Joi.string().required(), otherwise: Joi.string().allow('').optional() }),
  AWS_S3_BUCKET: Joi.when('STORAGE_PROVIDER', { is: 's3', then: Joi.string().required(), otherwise: Joi.string().allow('').optional() }),
  AZURE_STORAGE_CONNECTION_STRING: Joi.when('STORAGE_PROVIDER', { is: 'azure', then: Joi.string().required(), otherwise: Joi.string().allow('').optional() }),
  AZURE_STORAGE_CONTAINER: Joi.when('STORAGE_PROVIDER', { is: 'azure', then: Joi.string().required(), otherwise: Joi.string().allow('').optional() }),
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
  // Storage
  storageProvider: value.STORAGE_PROVIDER as 'cloudinary' | 's3' | 'azure',
  cloudinaryCloudName: value.CLOUDINARY_CLOUD_NAME as string,
  cloudinaryApiKey: value.CLOUDINARY_API_KEY as string,
  cloudinaryApiSecret: value.CLOUDINARY_API_SECRET as string,
  awsRegion: value.AWS_REGION as string,
  awsAccessKeyId: value.AWS_ACCESS_KEY_ID as string,
  awsSecretAccessKey: value.AWS_SECRET_ACCESS_KEY as string,
  awsS3Bucket: value.AWS_S3_BUCKET as string,
  azureStorageConnectionString: value.AZURE_STORAGE_CONNECTION_STRING as string,
  azureStorageContainer: value.AZURE_STORAGE_CONTAINER as string,
};
