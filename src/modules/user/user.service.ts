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
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
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

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await UserModel.create({
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash,
      role: data.role || UserRole.VALIDATION_ENGINEER,
      onboardingCompleted: true, // Users added by admin don't need onboarding
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
