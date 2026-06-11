import { Schema, model, Document, Types } from 'mongoose';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  QA_REVIEWER = 'qa_reviewer',
  VALIDATION_ENGINEER = 'validation_engineer',
  CALIBRATION_ENGINEER = 'calibration_engineer',
  VALIDATION_HEAD = 'validation_head',
  CUSTOMER = 'customer',
  AUDITOR = 'auditor',
  SALES = 'sales',
  SALES_MANAGER = 'sales_manager',
}

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  organizationId: Types.ObjectId;
  customerId?: Types.ObjectId;
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
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    refreshTokenHash: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    onboardingCompleted: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        delete ret._id;
        delete ret.passwordHash;
        delete ret.refreshTokenHash;
        delete ret.__v;
        if (ret.customerId) {
          ret.customerId = (ret.customerId as { toString(): string }).toString();
        }
        return ret;
      },
    },
  },
);


export const UserModel = model<IUser>('User', userSchema);
