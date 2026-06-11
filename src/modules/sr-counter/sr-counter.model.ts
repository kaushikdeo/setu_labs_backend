import { Schema, model, Document, Types } from 'mongoose';

export interface ISrCounter extends Document {
  key: string;
  sequence: number;
  organizationId?: Types.ObjectId | null;
}

const srCounterSchema = new Schema<ISrCounter>({
  key: { type: String, required: true, unique: true },
  sequence: { type: Number, default: 0 },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
});

srCounterSchema.index({ organizationId: 1, key: 1 }, { unique: true, sparse: true });

export const SrCounterModel = model<ISrCounter>('SrCounter', srCounterSchema);
