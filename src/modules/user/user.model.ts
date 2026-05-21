import { Schema, model, Document } from 'mongoose';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  QA_REVIEWER = 'qa_reviewer',
  VALIDATION_ENGINEER = 'validation_engineer',
  CALIBRATION_ENGINEER = 'calibration_engineer',
  VALIDATION_HEAD = 'validation_head',
  CUSTOMER = 'customer',
  AUDITOR = 'auditor',
}

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  refreshTokenHash: string | null;
  isActive: boolean;
  onboardingCompleted: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.VALIDATION_ENGINEER },
    refreshTokenHash: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    onboardingCompleted: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);


export const UserModel = model<IUser>('User', userSchema);
