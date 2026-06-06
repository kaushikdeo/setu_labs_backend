import { Schema, model, Document, Types } from 'mongoose';
import {
  OpportunityType,
  PaymentMilestone,
  WarrantyPeriod,
} from '../opportunity/opportunity.model';

export enum QuoteStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  SENT = 'sent',
  REVISION_REQUESTED = 'revision_requested',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  SUPERSEDED = 'superseded',
}

export enum ReviewState {
  PENDING = 'pending',
  APPROVED = 'approved',
  RETURNED = 'returned',
  SKIPPED = 'skipped',
}

export enum GstType {
  CGST_SGST = 'cgst_sgst',
  IGST = 'igst',
  NIL = 'nil',
}

export enum Uom {
  NOS = 'nos',
  SQFT = 'sqft',
  KW = 'kw',
  TR = 'tr',
  HOURS = 'hours',
  YEARS = 'years',
  MONTHS = 'months',
  LOT = 'lot',
}

export interface IQuoteLineItem {
  id: string;
  sortOrder: number;
  description: string;
  hsnCode?: string;
  sacCode?: string;
  quantity: number;
  uom: Uom;
  unitRate: number;
  discountPct: number;
  discountAmount: number;
  netAmount: number;
  gstRate: number;
  gstType: GstType;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  gstAmount: number;
  totalWithGst: number;
  costPrice?: number;
  lineMarginPct?: number;
  isOptional: boolean;
  notes?: string;
}

export interface IQuoteReviewLog {
  type: 'technical' | 'manager';
  state: ReviewState;
  userId?: string;
  userName?: string;
  comments?: string;
  at?: Date;
}

export interface IQuote extends Document {
  opportunityId: Types.ObjectId;
  opportunityName: string;
  customer: string;
  number: string;
  version: number;
  status: QuoteStatus;
  isPrimary: boolean;

  quoteDate: Date;
  validityDate: Date;
  type: OpportunityType;

  amountExclGst: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  gstTotal: number;
  amountInclGst: number;
  tdsDeduction: number;
  netPayable: number;

  lineItems: IQuoteLineItem[];

  paymentTermsPreset: string;
  paymentMilestones: PaymentMilestone[];
  paymentNotes?: string;
  deliveryTimeline: string;
  warrantyPeriod: WarrantyPeriod;
  validityNote?: string;
  specialConditions?: string;
  scopeOfSupply?: string;
  inclusions: string[];
  exclusions: string[];
  tcTemplateId?: Types.ObjectId | null;
  tcTemplateName?: string;

  totalCost: number;
  overheadAllocation: number;
  marginPct: number;
  marginBelowFloor: boolean;
  notesForReviewer?: string;

  requiresManagerReview: boolean;
  technicalReview: IQuoteReviewLog;
  managerReview: IQuoteReviewLog;

  pdfUrl?: string;
  pdfGeneratedAt?: Date;
  sentAt?: Date;
  sentTo: string[];
  sentCc: string[];
  sentBy?: string;

  customerPoNumber?: string;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  supersededAt?: Date;
  supersededByQuoteId?: Types.ObjectId | null;

  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<IQuoteLineItem>(
  {
    id: { type: String, required: true },
    sortOrder: { type: Number, required: true, default: 0 },
    description: { type: String, default: '', trim: true },
    hsnCode: { type: String, trim: true },
    sacCode: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    uom: { type: String, enum: Object.values(Uom), required: true },
    unitRate: { type: Number, required: true, min: 0 },
    discountPct: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, required: true, min: 0 },
    gstRate: { type: Number, required: true, min: 0, max: 100 },
    gstType: { type: String, enum: Object.values(GstType), required: true },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    totalWithGst: { type: Number, required: true },
    costPrice: { type: Number, min: 0 },
    lineMarginPct: { type: Number },
    isOptional: { type: Boolean, default: false },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const reviewSchema = new Schema<IQuoteReviewLog>(
  {
    type: { type: String, enum: ['technical', 'manager'], required: true },
    state: {
      type: String,
      enum: Object.values(ReviewState),
      required: true,
      default: ReviewState.PENDING,
    },
    userId: { type: String },
    userName: { type: String },
    comments: { type: String },
    at: { type: Date },
  },
  { _id: false }
);

const milestoneSchema = new Schema<PaymentMilestone>(
  {
    label: { type: String, required: true, trim: true },
    percent: { type: Number, required: true, min: 0, max: 100 },
    trigger: { type: String, trim: true },
  },
  { _id: false }
);

const quoteSchema = new Schema<IQuote>(
  {
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true },
    opportunityName: { type: String, required: true, trim: true },
    customer: { type: String, required: true, trim: true },
    number: { type: String, required: true, unique: true, trim: true },
    version: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: Object.values(QuoteStatus),
      required: true,
      default: QuoteStatus.DRAFT,
    },
    isPrimary: { type: Boolean, default: true },

    quoteDate: { type: Date, default: () => new Date() },
    validityDate: { type: Date, required: true },
    type: { type: String, enum: Object.values(OpportunityType), required: true },

    amountExclGst: { type: Number, default: 0 },
    cgstTotal: { type: Number, default: 0 },
    sgstTotal: { type: Number, default: 0 },
    igstTotal: { type: Number, default: 0 },
    gstTotal: { type: Number, default: 0 },
    amountInclGst: { type: Number, default: 0 },
    tdsDeduction: { type: Number, default: 0 },
    netPayable: { type: Number, default: 0 },

    lineItems: { type: [lineItemSchema], default: [] },

    paymentTermsPreset: { type: String, required: true },
    paymentMilestones: { type: [milestoneSchema], default: [] },
    paymentNotes: { type: String, trim: true },
    deliveryTimeline: { type: String, required: true, trim: true },
    warrantyPeriod: {
      type: String,
      enum: Object.values(WarrantyPeriod),
      required: true,
      default: WarrantyPeriod.M12,
    },
    validityNote: { type: String, trim: true },
    specialConditions: { type: String, trim: true },
    scopeOfSupply: { type: String, trim: true },
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    tcTemplateId: { type: Schema.Types.ObjectId, ref: 'TcTemplate', default: null },
    tcTemplateName: { type: String, trim: true },

    totalCost: { type: Number, default: 0 },
    overheadAllocation: { type: Number, default: 0, min: 0, max: 100 },
    marginPct: { type: Number, default: 0 },
    marginBelowFloor: { type: Boolean, default: false },
    notesForReviewer: { type: String, trim: true },

    requiresManagerReview: { type: Boolean, default: false },
    technicalReview: {
      type: reviewSchema,
      default: () => ({ type: 'technical', state: ReviewState.PENDING }),
    },
    managerReview: {
      type: reviewSchema,
      default: () => ({ type: 'manager', state: ReviewState.PENDING }),
    },

    pdfUrl: { type: String, trim: true },
    pdfGeneratedAt: { type: Date },
    sentAt: { type: Date },
    sentTo: { type: [String], default: [] },
    sentCc: { type: [String], default: [] },
    sentBy: { type: String },

    customerPoNumber: { type: String, trim: true },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    supersededAt: { type: Date },
    supersededByQuoteId: { type: Schema.Types.ObjectId, ref: 'Quote', default: null },

    createdBy: { type: String, required: true },
    createdByName: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        if (ret.opportunityId)
          ret.opportunityId = (ret.opportunityId as { toString(): string }).toString();
        if (ret.tcTemplateId)
          ret.tcTemplateId = (ret.tcTemplateId as { toString(): string }).toString();
        if (ret.supersededByQuoteId)
          ret.supersededByQuoteId = (ret.supersededByQuoteId as { toString(): string }).toString();
        return ret;
      },
    },
  }
);

quoteSchema.index({ opportunityId: 1, version: -1 });
quoteSchema.index({ status: 1 });
quoteSchema.index({ createdAt: -1 });

export const QuoteModel = model<IQuote>('Quote', quoteSchema);
