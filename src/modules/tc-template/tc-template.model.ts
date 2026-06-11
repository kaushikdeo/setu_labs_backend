import { Schema, model, Document, Types } from 'mongoose';

export enum TcOpportunityType {
  SUPPLY_INSTALL = 'supply_install',
  SUPPLY_ONLY = 'supply_only',
  AMC = 'amc',
  TURNKEY = 'turnkey',
  CONSULTANCY = 'consultancy',
}

export interface ITcTemplate extends Document {
  name: string;
  opportunityType: TcOpportunityType;
  body: string;
  isDefault: boolean;
  organizationId?: Types.ObjectId | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const tcTemplateSchema = new Schema<ITcTemplate>(
  {
    name: { type: String, required: true, trim: true },
    opportunityType: {
      type: String,
      enum: Object.values(TcOpportunityType),
      required: true,
    },
    body: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
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
  }
);

tcTemplateSchema.index({ opportunityType: 1, isDefault: -1 });

export const TcTemplateModel = model<ITcTemplate>('TcTemplate', tcTemplateSchema);
