import bcrypt from 'bcryptjs';
import { logger } from '../../config/logger';
import { IUser, UserModel, UserRole } from './user.model';
import { AppError } from '../../utils/app-error';

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
    customerId: user.customerId?.toString() ?? undefined,
    isActive: user.isActive,
    onboardingCompleted: user.onboardingCompleted,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

export class UserService {
  async getUserById(id: string): Promise<SafeUser | null> {
    logger.debug('Fetching user by ID', { id });
    const user = await UserModel.findById(id);
    if (!user) return null;
    return toSafeUser(user);
  }

  async getAllUsers(): Promise<SafeUser[]> {
    logger.debug('Fetching all users');
    const users = await UserModel.find();
    return users.map(toSafeUser);
  }

  async createUser(data: CreateUserDto): Promise<SafeUser> {
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
      customerId: data.customerId ?? undefined,
      onboardingCompleted: true,
    });

    logger.info('User created by admin', { userId: user._id });
    return toSafeUser(user);
  }

  async updateRole(id: string, role: UserRole): Promise<SafeUser | null> {
    const user = await UserModel.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) return null;
    return toSafeUser(user);
  }

  async updateStatus(id: string, isActive: boolean): Promise<SafeUser | null> {
    const user = await UserModel.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!user) return null;
    return toSafeUser(user);
  }
}
