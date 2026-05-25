import { Schema, model, Document, Types } from 'mongoose';

export enum SiteType {
  MANUFACTURING = 'manufacturing',
  LABORATORY = 'laboratory',
  WAREHOUSE = 'warehouse',
  OFFICE = 'office',
  OTHER = 'other',
}

export interface ISite extends Document {
  customerId: Types.ObjectId;
  name: string;
  code: string;
  siteType: SiteType;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const siteSchema = new Schema<ISite>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    siteType: {
      type: String,
      enum: Object.values(SiteType),
      default: SiteType.MANUFACTURING,
      required: true,
    },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Ensure site code is unique within a customer
siteSchema.index({ customerId: 1, code: 1 }, { unique: true });

export const SiteModel = model<ISite>('Site', siteSchema);
