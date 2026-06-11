import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { logger } from '../../config/logger';
import { IUser, UserModel, UserRole } from './user.model';
import { AppError } from '../../utils/app-error';
import { orgFilter } from '../../utils/tenant';

const SALT_ROUNDS = 12;

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  customerId?: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  customerId?: string;
  isActive: boolean;
  onboardingCompleted: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

function toSafeUser(user: IUser): SafeUser {
  return {
    id: (user._id as { toString(): string }).toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId.toString(),
    customerId: user.customerId?.toString() ?? undefined,
    isActive: user.isActive,
    onboardingCompleted: user.onboardingCompleted,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

export class UserService {
  async getUserById(id: string, organizationId: string): Promise<SafeUser | null> {
    logger.debug('Fetching user by ID', { id });
    const user = await UserModel.findOne({ _id: id, ...orgFilter(organizationId) });
    if (!user) return null;
    return toSafeUser(user);
  }

  async getAllUsers(organizationId: string): Promise<SafeUser[]> {
    logger.debug('Fetching all users');
    const users = await UserModel.find(orgFilter(organizationId));
    return users.map(toSafeUser);
  }

  async createUser(data: CreateUserDto, organizationId: string): Promise<SafeUser> {
    const existing = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new AppError(409, 'Email already registered');
    }

    const role = data.role || UserRole.VALIDATION_ENGINEER;
    if (role === UserRole.CUSTOMER && !data.customerId) {
      throw new AppError(400, 'customerId is required when creating a customer user');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await UserModel.create({
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash,
      role,
      ...orgFilter(organizationId),
      customerId: data.customerId ? new Types.ObjectId(data.customerId) : undefined,
      onboardingCompleted: true,
    });

    logger.info('User created by admin', { userId: user._id });
    return toSafeUser(user);
  }

  async updateRole(id: string, role: UserRole, organizationId: string): Promise<SafeUser | null> {
    const user = await UserModel.findOneAndUpdate(
      { _id: id, ...orgFilter(organizationId) },
      { role },
      { new: true },
    );
    if (!user) return null;
    return toSafeUser(user);
  }

  async updateStatus(
    id: string,
    isActive: boolean,
    organizationId: string,
  ): Promise<SafeUser | null> {
    const user = await UserModel.findOneAndUpdate(
      { _id: id, ...orgFilter(organizationId) },
      { isActive },
      { new: true },
    );
    if (!user) return null;
    return toSafeUser(user);
  }
}
