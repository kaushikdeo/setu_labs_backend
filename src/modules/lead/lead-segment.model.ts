import { Schema, model, Document, Types } from 'mongoose';

export interface ILeadSegment extends Document {
  name: string;
  ownerId: Types.ObjectId;
  filters: Record<string, unknown>;
  isShared: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const leadSegmentSchema = new Schema<ILeadSegment>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    filters: { type: Schema.Types.Mixed, default: {} },
    isShared: { type: Boolean, default: false },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        if (ret.ownerId) {
          ret.ownerId = (ret.ownerId as { toString(): string }).toString();
        }
        return ret;
      },
    },
  },
);

leadSegmentSchema.index({ ownerId: 1 });
leadSegmentSchema.index({ isShared: 1 });

export const LeadSegmentModel = model<ILeadSegment>('LeadSegment', leadSegmentSchema);
