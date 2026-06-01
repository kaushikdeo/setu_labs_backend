import { Schema, model, Document } from 'mongoose';

export interface ISrCounter extends Document {
  key: string;
  sequence: number;
}

const srCounterSchema = new Schema<ISrCounter>({
  key: { type: String, required: true, unique: true },
  sequence: { type: Number, default: 0 },
});

export const SrCounterModel = model<ISrCounter>('SrCounter', srCounterSchema);
