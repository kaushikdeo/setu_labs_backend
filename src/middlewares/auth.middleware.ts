import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';
import { UserRole } from '../modules/user/user.model';
import { UserModel } from '../modules/user/user.model';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  customerId?: string;
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication required'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;

    let organizationId = payload.organizationId;
    if (!organizationId) {
      const user = await UserModel.findById(payload.sub).select('organizationId').lean();
      if (!user?.organizationId) {
        return next(new AppError(401, 'Invalid or expired token'));
      }
      organizationId = user.organizationId.toString();
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      organizationId,
      customerId: payload.customerId,
    };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
};
