import { Schema, model, Document, Types } from 'mongoose';

export interface ITaskTestResult extends Document {
  visitTaskId: Types.ObjectId;
  testTypeId: Types.ObjectId;
  instrumentId: Types.ObjectId;
  reportNumber: string;
  readings: Record<string, any>;
  calculatedValues: Record<string, any>;
  result: 'Pass' | 'Fail';
  conclusion: string;
  createdBy: string;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const testResultSchema = new Schema<ITaskTestResult>(
  {
    visitTaskId: { type: Schema.Types.ObjectId, ref: 'VisitTask', required: true },
    testTypeId: { type: Schema.Types.ObjectId, ref: 'TestType', required: true },
    instrumentId: { type: Schema.Types.ObjectId, ref: 'MasterInstrument', required: true },
    reportNumber: { type: String, required: true, unique: true, trim: true },
    readings: { type: Schema.Types.Mixed, required: true },
    calculatedValues: { type: Schema.Types.Mixed, default: {} },
    result: { type: String, enum: ['Pass', 'Fail'], required: true },
    conclusion: { type: String, required: true },
    createdBy: { type: String, required: true },
    completedAt: { type: Date, required: true },
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

testResultSchema.index({ visitTaskId: 1 });

export const TaskTestResultModel = model<ITaskTestResult>('TaskTestResult', testResultSchema);
