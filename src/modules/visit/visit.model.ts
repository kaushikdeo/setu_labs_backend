import { Schema, model, Document, Types } from 'mongoose';

export enum VisitStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum VisitType {
  VALIDATION = 'validation',
  CALIBRATION = 'calibration',
}

export interface IVisit extends Document {
  code: string;
  srNumber?: string;
  customerId: Types.ObjectId;
  siteId: Types.ObjectId;
  type: VisitType;
  scheduledDate: Date;
  validationDate?: Date;
  dueDate?: Date;
  completedDate?: Date;
  assignedEngineerId: Types.ObjectId;
  status: VisitStatus;
  notes?: string;
  organizationId?: Types.ObjectId | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const visitSchema = new Schema<IVisit>(
  {
    code: { type: String, required: true, trim: true },
    srNumber: { type: String, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
    type: { type: String, enum: Object.values(VisitType), required: true },
    scheduledDate: { type: Date, required: true },
    validationDate: { type: Date },
    dueDate: { type: Date },
    completedDate: { type: Date },
    assignedEngineerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(VisitStatus),
      default: VisitStatus.SCHEDULED,
    },
    notes: { type: String, trim: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

visitSchema.index({ customerId: 1, scheduledDate: -1 });
visitSchema.index({ assignedEngineerId: 1, status: 1 });
visitSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const VisitModel = model<IVisit>('Visit', visitSchema);
