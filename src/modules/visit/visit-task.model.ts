import { Schema, model, Document, Types } from 'mongoose';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface IPlannedTest {
  instrumentId: Types.ObjectId;
  testTypeId: Types.ObjectId;
  status: 'pending' | 'completed';
  srNumber?: string;
}

export interface IVisitTask extends Document {
  visitId: Types.ObjectId;
  equipmentId: Types.ObjectId;
  instrumentId?: Types.ObjectId;
  plannedTests: IPlannedTest[];
  area?: string;
  testPerformedBy?: string;
  witness?: string;
  visualInspection?: string;
  testCondition?: string;
  observations?: string;
  remarks?: string;
  status: TaskStatus;
  completedAt?: Date;
  organizationId?: Types.ObjectId | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const visitTaskSchema = new Schema<IVisitTask>(
  {
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', required: true },
    equipmentId: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true },
    instrumentId: { type: Schema.Types.ObjectId, ref: 'MasterInstrument' },
    plannedTests: [
      {
        instrumentId: { type: Schema.Types.ObjectId, ref: 'MasterInstrument', required: true },
        testTypeId: { type: Schema.Types.ObjectId, ref: 'TestType', required: true },
        status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
        srNumber: { type: String, trim: true },
        _id: false,
      },
    ],
    area: { type: String, trim: true },
    testPerformedBy: { type: String, trim: true },
    witness: { type: String, trim: true },
    visualInspection: { type: String, trim: true },
    testCondition: { type: String, trim: true },
    observations: { type: String, trim: true },
    remarks: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
    },
    completedAt: { type: Date },
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

visitTaskSchema.index({ visitId: 1 });
visitTaskSchema.index({ equipmentId: 1 });

export const VisitTaskModel = model<IVisitTask>('VisitTask', visitTaskSchema);
