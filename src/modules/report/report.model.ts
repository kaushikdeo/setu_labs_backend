import { Schema, model, Document, Types } from 'mongoose';

export enum ReportStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHANGES_REQUESTED = 'changes_requested',
}

export type ApprovalAction = 'submitted' | 'approved' | 'rejected' | 'resubmitted' | 'changes_requested';

export interface IApprovalHistoryEntry {
  action: ApprovalAction;
  comment?: string;
  performedBy: string;
  performedAt: Date;
}

export interface IReport extends Document {
  visitId: Types.ObjectId;
  customerId: Types.ObjectId;
  title: string;
  status: ReportStatus;
  submittedForApprovalAt?: Date;
  submittedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
  approvalHistory: IApprovalHistoryEntry[];
  organizationId?: Types.ObjectId | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const approvalHistorySchema = new Schema<IApprovalHistoryEntry>(
  {
    action: { type: String, enum: ['submitted', 'approved', 'rejected', 'resubmitted', 'changes_requested'], required: true },
    comment: { type: String, trim: true },
    performedBy: { type: String, required: true },
    performedAt: { type: Date, required: true },
  },
  { _id: false },
);

const reportSchema = new Schema<IReport>(
  {
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.DRAFT,
    },
    submittedForApprovalAt: { type: Date },
    submittedBy: { type: String },
    approvedAt: { type: Date },
    approvedBy: { type: String },
    approvalHistory: { type: [approvalHistorySchema], default: [] },
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

reportSchema.index({ customerId: 1, status: 1 });
reportSchema.index({ visitId: 1 });

export const ReportModel = model<IReport>('Report', reportSchema);
