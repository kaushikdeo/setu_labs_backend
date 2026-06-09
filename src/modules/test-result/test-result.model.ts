import { Schema, model, Document, Types } from 'mongoose';

export interface IEnvironmentalConditions {
  temperatureStart?: number;
  temperatureEnd?: number;
  humidityStart?: number;
  humidityEnd?: number;
  pressureStart?: number;
  pressureEnd?: number;
  remarks?: string;
}

export interface ITaskTestResult extends Document {
  visitTaskId: Types.ObjectId;
  testTypeId: Types.ObjectId;
  instrumentId: Types.ObjectId;
  reportNumber: string;
  testPerformedBy?: string;
  witness?: string;
  visualInspection?: string;
  environmentalConditions?: IEnvironmentalConditions;
  readings: Record<string, any>;
  calculatedValues: Record<string, any>;
  result: 'Pass' | 'Fail';
  conclusion: string;
  createdBy: string;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const environmentalConditionsSchema = new Schema<IEnvironmentalConditions>(
  {
    temperatureStart: { type: Number },
    temperatureEnd: { type: Number },
    humidityStart: { type: Number },
    humidityEnd: { type: Number },
    pressureStart: { type: Number },
    pressureEnd: { type: Number },
    remarks: { type: String, trim: true },
  },
  { _id: false },
);

const testResultSchema = new Schema<ITaskTestResult>(
  {
    visitTaskId: { type: Schema.Types.ObjectId, ref: 'VisitTask', required: true },
    testTypeId: { type: Schema.Types.ObjectId, ref: 'TestType', required: true },
    instrumentId: { type: Schema.Types.ObjectId, ref: 'MasterInstrument', required: true },
    reportNumber: { type: String, required: true, unique: true, trim: true },
    testPerformedBy: { type: String, trim: true },
    witness: { type: String, trim: true },
    visualInspection: { type: String, trim: true },
    environmentalConditions: { type: environmentalConditionsSchema },
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
