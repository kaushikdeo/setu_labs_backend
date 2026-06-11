import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { UserModel, UserRole } from '../user/user.model';
import { SafeUser } from '../user/user.service';
import { AppError } from '../../utils/app-error';
import { createStubOrganization } from '../../utils/org-provisioning';
import { OrganizationModel } from '../organization/organization.model';

const SALT_ROUNDS = 12;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

function toSafeUser(user: InstanceType<typeof UserModel>): SafeUser {
  return {
    id: (user._id as { toString(): string }).toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId!.toString(),
    customerId: user.customerId?.toString() ?? undefined,
    isActive: user.isActive,
    onboardingCompleted: user.onboardingCompleted,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

function signTokenPair(
  userId: string,
  email: string,
  role: UserRole,
  organizationId: string,
  customerId?: string,
): TokenPair {
  const payload: Record<string, unknown> = { sub: userId, email, role, organizationId };
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
    if (!env.registrationEnabled) {
      throw new AppError(403, 'Registration is disabled');
    }

    const existing = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new AppError(409, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const email = data.email.toLowerCase();
    const organization = await createStubOrganization(
      { name: data.name, email },
      email,
    );

    const user = await UserModel.create({
      email,
      name: data.name,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      organizationId: organization._id,
      onboardingCompleted: false,
    });

    await OrganizationModel.findByIdAndUpdate(organization._id, {
      createdBy: user._id.toString(),
    });

    const { accessToken, refreshToken } = signTokenPair(
      user._id.toString(),
      user.email,
      user.role,
      organization._id.toString(),
    );

    user.refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    user.lastLoginAt = new Date();
    await user.save();

    logger.info('User registered', { userId: user._id, organizationId: organization._id });
    return { user: toSafeUser(user), accessToken, refreshToken };
  }

  async login(data: { email: string; password: string }): Promise<AuthResult> {
    const user = await UserModel.findOne({ email: data.email.toLowerCase() });

    if (!user || !user.isActive) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!user.organizationId) {
      throw new AppError(403, 'User is not assigned to an organization');
    }

    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      logger.warn('Login failed — invalid password', { email: data.email });
      throw new AppError(401, 'Invalid credentials');
    }

    const customerId = user.customerId?.toString();
    const { accessToken, refreshToken } = signTokenPair(
      user._id.toString(),
      user.email,
      user.role,
      user.organizationId.toString(),
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
    if (!user || !user.isActive || !user.refreshTokenHash || !user.organizationId) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const tokenMatch = await bcrypt.compare(incomingRefreshToken, user.refreshTokenHash);
    if (!tokenMatch) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const customerId = user.customerId?.toString();
    const { accessToken, refreshToken } = signTokenPair(
      user._id.toString(),
      user.email,
      user.role,
      user.organizationId.toString(),
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
