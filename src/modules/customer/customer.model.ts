import { Schema, model, Document } from 'mongoose';
import { IndustryType } from '../organization/organization.model';

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface ICustomerReportSettings {
  preparedBy?: boolean;
  testTakenBy?: boolean;
  reviewedAndAuthorizedBy?: boolean;
  verifiedBy?: boolean;
  approvedBy?: boolean;
  authorizedBy?: boolean;
  witnessedBy?: boolean;
  reviewedBy?: boolean;
  reviewedByEAM?: boolean;
  checkedBy?: boolean;
  dueDate?: boolean;
  electronicSign?: boolean;
  withoutElectronicSign?: boolean;
  signatureImg?: boolean;
}

export interface ICustomer extends Document {
  name: string;
  code: string;
  industryType: IndustryType;
  status: CustomerStatus;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  abbreviation?: string;
  gstin?: string;
  notes?: string;
  reportSettings?: ICustomerReportSettings;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    industryType: { type: String, enum: Object.values(IndustryType), required: true },
    status: {
      type: String,
      enum: Object.values(CustomerStatus),
      default: CustomerStatus.ACTIVE,
      required: true,
    },
    primaryContactName: { type: String, required: true, trim: true },
    primaryContactEmail: { type: String, required: true, trim: true, lowercase: true },
    primaryContactPhone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    abbreviation: { type: String, trim: true, uppercase: true, maxlength: 6 },
    gstin: { type: String, trim: true },
    notes: { type: String, trim: true },
    reportSettings: { type: Schema.Types.Mixed, default: {} },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const CustomerModel = model<ICustomer>('Customer', customerSchema);
