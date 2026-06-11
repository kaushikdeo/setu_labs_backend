import { Schema, model, Document, Types } from 'mongoose';

export interface IHeaderField {
  key: string;
  label: string;
  unit?: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  options?: string[];
  defaultValue?: string;
}

export interface ITableColumn {
  key: string;
  label: string;
  unit?: string;
  type: 'text' | 'number' | 'computed';
  required?: boolean;
  computedFrom?: string;
  scope?: 'section' | 'row';
}

export interface IResultSummaryColumn {
  key: string;
  label: string;
}

export interface ITestType extends Document {
  code: string;
  name: string;
  abbreviation?: string;
  description?: string;
  category: 'validation' | 'calibration';
  requiredInstrumentType: string;
  applicableEquipmentTypes: string[];
  headerFields: IHeaderField[];
  tableColumns: ITableColumn[];
  resultSummaryColumns?: IResultSummaryColumn[];
  acceptanceCriteria: {
    description: string;
    thresholds: Record<string, { description?: string; fields: Record<string, { min?: number; max?: number }> }>;
  };
  calculationKey: string;
  showEquipmentDetails?: boolean;
  showGraph?: boolean;
  dueDateDays?: number;
  isActive: boolean;
  organizationId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const headerFieldSchema = new Schema<IHeaderField>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    unit: String,
    type: { type: String, enum: ['text', 'number', 'select'], required: true },
    required: { type: Boolean, default: false },
    options: [String],
    defaultValue: String,
  },
  { _id: false },
);

const tableColumnSchema = new Schema<ITableColumn>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    unit: String,
    type: { type: String, enum: ['text', 'number', 'computed'], required: true },
    required: { type: Boolean, default: false },
    computedFrom: String,
    scope: { type: String, enum: ['section', 'row'], default: 'row' },
  },
  { _id: false },
);

const resultSummaryColumnSchema = new Schema<IResultSummaryColumn>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false },
);

const testTypeSchema = new Schema<ITestType>(
  {
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    abbreviation: { type: String, trim: true, uppercase: true, maxlength: 6 },
    description: { type: String, trim: true },
    category: { type: String, enum: ['validation', 'calibration'], required: true, default: 'validation' },
    requiredInstrumentType: { type: String, trim: true, default: '' },
    applicableEquipmentTypes: [{ type: String, trim: true }],
    headerFields: [headerFieldSchema],
    tableColumns: [tableColumnSchema],
    resultSummaryColumns: [resultSummaryColumnSchema],
    acceptanceCriteria: {
      description: { type: String, default: '' },
      thresholds: { type: Schema.Types.Mixed, default: {} },
    },
    calculationKey: { type: String, default: '' },
    showEquipmentDetails: { type: Boolean, default: true },
    showGraph: { type: Boolean, default: true },
    dueDateDays: { type: Number },
    isActive: { type: Boolean, default: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
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

testTypeSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const TestTypeModel = model<ITestType>('TestType', testTypeSchema);
