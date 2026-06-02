import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { UserModel, UserRole } from '../user/user.model';
import { SafeUser } from '../user/user.service';
import { AppError } from '../../utils/app-error';

const SALT_ROUNDS = 12;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  isFirstUser?: boolean;
}

function toSafeUser(user: InstanceType<typeof UserModel>): SafeUser {
  return {
    id: (user._id as { toString(): string }).toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    customerId: (user as any).customerId?.toString() ?? undefined,
    isActive: user.isActive,
    onboardingCompleted: user.onboardingCompleted,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

function signTokenPair(userId: string, email: string, role: UserRole, customerId?: string): TokenPair {
  const payload: Record<string, unknown> = { sub: userId, email, role };
  if (customerId) payload.customerId = customerId;

  const accessToken = jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign({ sub: userId }, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpiresIn,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
}

export class AuthService {
  async register(data: { email: string; password: string; name: string }): Promise<AuthResult> {
    const existing = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new AppError(409, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const userCount = await UserModel.countDocuments();
    const role = userCount === 0 ? UserRole.SUPER_ADMIN : UserRole.VALIDATION_ENGINEER;

    const user = await UserModel.create({
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash,
      role,
    });

    const { accessToken, refreshToken } = signTokenPair(
      user._id.toString(),
      user.email,
      user.role,
    );

    user.refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    user.lastLoginAt = new Date();
    await user.save();

    logger.info('User registered', { userId: user._id });
    return { user: toSafeUser(user), accessToken, refreshToken, isFirstUser: userCount === 0 };
  }

  async login(data: { email: string; password: string }): Promise<AuthResult> {
    const user = await UserModel.findOne({ email: data.email.toLowerCase() });

    if (!user || !user.isActive) {
      throw new AppError(401, 'Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      logger.warn('Login failed — invalid password', { email: data.email });
      throw new AppError(401, 'Invalid credentials');
    }

    const customerId = (user as any).customerId?.toString();
    const { accessToken, refreshToken } = signTokenPair(
      user._id.toString(),
      user.email,
      user.role,
      customerId,
    );

    user.refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    user.lastLoginAt = new Date();
    await user.save();

    logger.info('User logged in', { userId: user._id });
    return { user: toSafeUser(user), accessToken, refreshToken };
  }

  async refresh(incomingRefreshToken: string): Promise<TokenPair> {
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(incomingRefreshToken, env.refreshTokenSecret) as jwt.JwtPayload;
    } catch {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const user = await UserModel.findById(payload.sub);
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const tokenMatch = await bcrypt.compare(incomingRefreshToken, user.refreshTokenHash);
    if (!tokenMatch) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const customerId = (user as any).customerId?.toString();
    const { accessToken, refreshToken } = signTokenPair(
      user._id.toString(),
      user.email,
      user.role,
      customerId,
    );

    user.refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await user.save();

    return { accessToken, refreshToken };
  }

  async logout(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { refreshTokenHash: null });
    logger.info('User logged out', { userId });
  }
}

export const authService = new AuthService();
