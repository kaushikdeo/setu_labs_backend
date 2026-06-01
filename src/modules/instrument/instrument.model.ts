import { Schema, model, Document, Types } from 'mongoose';

export enum InstrumentStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
}

export interface IMasterInstrument extends Omit<Document, 'model'> {
  name: string;
  code: string; // Unique ID
  serialNumber: string;
  make: string;
  model: string;
  lastCalibrationDate: Date;
  calibrationDueDate: Date;
  certificateNumber: string;
  certificateFileUrl?: string;
  certificateFilePublicId?: string;
  accuracy?: string;
  range?: string;
  status: InstrumentStatus;
  notes?: string;
  availableTestTypeIds: Types.ObjectId[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const instrumentSchema = new Schema<IMasterInstrument>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    serialNumber: { type: String, required: true, trim: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    lastCalibrationDate: { type: Date, required: true },
    calibrationDueDate: { type: Date, required: true },
    certificateNumber: { type: String, required: true, trim: true },
    certificateFileUrl: { type: String, trim: true },
    certificateFilePublicId: { type: String, trim: true },
    accuracy: { type: String, trim: true },
    range: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(InstrumentStatus),
      default: InstrumentStatus.ACTIVE,
    },
    notes: { type: String, trim: true },
    availableTestTypeIds: [{ type: Schema.Types.ObjectId, ref: 'TestType' }],
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

export const MasterInstrumentModel = model<IMasterInstrument>('MasterInstrument', instrumentSchema);
