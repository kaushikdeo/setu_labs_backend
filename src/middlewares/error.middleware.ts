import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { AppError } from '../utils/app-error';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError && err.isOperational;

  logger.error(err.message, {
    statusCode,
    method: req.method,
    url: req.originalUrl,
    isOperational,
    stack: err.stack,
    ...(Object.keys(req.body || {}).length && { body: req.body }),
    ...(Object.keys(req.params || {}).length && { params: req.params }),
    ...(Object.keys(req.query || {}).length && { query: req.query }),
  });

  return res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : 'Internal server error',
  });
};
