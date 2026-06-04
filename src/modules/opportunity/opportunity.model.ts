import { Schema, model, Document, Types } from 'mongoose';
import {
  BudgetStatus,
  DecisionTimeline,
  FollowUpMode,
  LeadIndustry,
  LeadProductInterest,
  LeadSource,
  LeadTemperature,
} from '../lead/lead.model';
import { AuthorityType, DecisionMakerCount } from '../prospect/prospect.model';

export enum OpportunityStage {
  SCOPE_DEFINED = 'scope_defined',
  QUOTE_IN_PROGRESS = 'quote_in_progress',
  UNDER_REVIEW = 'under_review',
  QUOTE_APPROVED = 'quote_approved',
  QUOTE_SENT = 'quote_sent',
  REVISION_REQUESTED = 'revision_requested',
  NEGOTIATION = 'negotiation',
  VERBAL_COMMITMENT = 'verbal_commitment',
  WON = 'won',
  LOST = 'lost',
}

export enum OpportunityStatus {
  OPEN = 'open',
  WON = 'won',
  LOST = 'lost',
}

export enum OpportunityType {
  SUPPLY_INSTALL = 'supply_install',
  SUPPLY_ONLY = 'supply_only',
  AMC = 'amc',
  TURNKEY = 'turnkey',
  CONSULTANCY = 'consultancy',
}

export enum WarrantyPeriod {
  NONE = 'none',
  M12 = '12m',
  M24 = '24m',
  M36 = '36m',
}

export enum SiteVisitStatus {
  COMPLETED = 'completed',
  SCHEDULED = 'scheduled',
  NOT_REQUIRED = 'not_required',
}

export enum DrawingsStatus {
  ATTACHED = 'attached',
  PENDING = 'pending',
  NOT_REQUIRED = 'not_required',
}

export enum PaymentTermsPreset {
  ADV_30_BAL_60 = 'adv_30_bal_60',
  ADV_50_BAL_50 = 'adv_50_bal_50',
  MILESTONES = 'milestones',
  NET_30 = 'net_30',
  CUSTOM = 'custom',
}

export enum OpportunityLossReason {
  PRICE_HIGH = 'price_high',
  COMPETITOR_RELATIONSHIP = 'competitor_relationship',
  COMPETITOR_SPECS = 'competitor_specs',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
  BUDGET_NOT_APPROVED = 'budget_not_approved',
  NO_RESPONSE = 'no_response',
  SPEC_MISMATCH = 'spec_mismatch',
  INCUMBENT = 'incumbent',
  LOST_TENDER = 'lost_tender',
  OTHER = 'other',
}

export interface PaymentMilestone {
  label: string;
  percent: number;
  trigger?: string;
}

export interface IOpportunity extends Document {
  code: string;
  prospectId?: Types.ObjectId | null;
  prospectCode?: string;

  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  company?: string;
  designation?: string;
  city?: string;
  state?: string;
  source: LeadSource;
  campaign?: string;
  productInterest?: LeadProductInterest;
  industry?: LeadIndustry;
  temperature: LeadTemperature;
  tags: string[];

  assignedUserId: Types.ObjectId;
  quotationOwnerId: Types.ObjectId;
  technicalReviewerId?: Types.ObjectId | null;

  name: string;
  type: OpportunityType;

  dealValue: number;
  expectedCloseDate: Date;
  winProbability: number;
  weightedValue: number;
  approvalThreshold: number;

  stage: OpportunityStage;
  status: OpportunityStatus;
  stageChangedAt: Date;

  scopeOfWork: string;
  siteLocation?: string;
  siteVisitStatus: SiteVisitStatus;
  siteVisitDate?: Date | null;

  technicalSpecs: string;
  drawingsStatus: DrawingsStatus;

  paymentTermsPreset: PaymentTermsPreset;
  paymentMilestones: PaymentMilestone[];
  paymentNotes?: string;
  deliveryTimeline: string;
  warrantyPeriod: WarrantyPeriod;

  submissionDeadline: Date;

  budgetStatus: BudgetStatus;
  authorityType: AuthorityType;
  decisionMakerCount?: DecisionMakerCount;
  confirmedNeed: string;
  decisionTimeline: DecisionTimeline;
  qualificationNotes?: string;
  competitors: string[];

  activeQuoteId?: Types.ObjectId | null;
  activeQuoteNumber?: string;
  activeQuoteStatus?: string;
  activeQuoteValue?: number;
  activeQuoteMarginPct?: number;
  quoteCount: number;

  lastActivityAt: Date;
  nextFollowUpDate?: Date | null;
  nextFollowUpMode?: FollowUpMode | null;

  poNumber?: string;
  poDate?: Date | null;
  poDocumentUrl?: string;
  wonAt?: Date | null;
  wonValue?: number;
  lostAt?: Date | null;
  lossReason?: OpportunityLossReason;
  competitorWon?: string;
  competitorPrice?: number;
  priceGap?: number;
  customerFeedback?: string;

  convertedAt?: Date | null;
  convertedBy?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<PaymentMilestone>(
  {
    label: { type: String, required: true, trim: true },
    percent: { type: Number, required: true, min: 0, max: 100 },
    trigger: { type: String, trim: true },
  },
  { _id: false }
);

const opportunitySchema = new Schema<IOpportunity>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    prospectId: { type: Schema.Types.ObjectId, ref: 'Prospect', default: null },
    prospectCode: { type: String, trim: true },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    company: { type: String, trim: true },
    designation: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    source: { type: String, enum: Object.values(LeadSource), required: true },
    campaign: { type: String, trim: true },
    productInterest: { type: String, enum: Object.values(LeadProductInterest) },
    industry: { type: String, enum: Object.values(LeadIndustry) },
    temperature: {
      type: String,
      enum: Object.values(LeadTemperature),
      required: true,
      default: LeadTemperature.WARM,
    },
    tags: { type: [String], default: [] },

    assignedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quotationOwnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    technicalReviewerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    name: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(OpportunityType), required: true },

    dealValue: { type: Number, required: true, min: 0 },
    expectedCloseDate: { type: Date, required: true },
    winProbability: { type: Number, required: true, min: 0, max: 100, default: 40 },
    weightedValue: { type: Number, required: true, min: 0, default: 0 },
    approvalThreshold: { type: Number, required: true, min: 0, default: 2_500_000 },

    stage: {
      type: String,
      enum: Object.values(OpportunityStage),
      required: true,
      default: OpportunityStage.SCOPE_DEFINED,
    },
    status: {
      type: String,
      enum: Object.values(OpportunityStatus),
      required: true,
      default: OpportunityStatus.OPEN,
    },
    stageChangedAt: { type: Date, default: () => new Date() },

    scopeOfWork: { type: String, required: true, trim: true },
    siteLocation: { type: String, trim: true },
    siteVisitStatus: {
      type: String,
      enum: Object.values(SiteVisitStatus),
      required: true,
      default: SiteVisitStatus.NOT_REQUIRED,
    },
    siteVisitDate: { type: Date, default: null },

    technicalSpecs: { type: String, required: true, trim: true },
    drawingsStatus: {
      type: String,
      enum: Object.values(DrawingsStatus),
      required: true,
      default: DrawingsStatus.PENDING,
    },

    paymentTermsPreset: {
      type: String,
      enum: Object.values(PaymentTermsPreset),
      required: true,
      default: PaymentTermsPreset.ADV_30_BAL_60,
    },
    paymentMilestones: { type: [milestoneSchema], default: [] },
    paymentNotes: { type: String, trim: true },
    deliveryTimeline: { type: String, required: true, trim: true },
    warrantyPeriod: {
      type: String,
      enum: Object.values(WarrantyPeriod),
      required: true,
      default: WarrantyPeriod.M12,
    },

    submissionDeadline: { type: Date, required: true },

    budgetStatus: { type: String, enum: Object.values(BudgetStatus), required: true },
    authorityType: { type: String, enum: Object.values(AuthorityType), required: true },
    decisionMakerCount: { type: String, enum: Object.values(DecisionMakerCount) },
    confirmedNeed: { type: String, required: true, trim: true },
    decisionTimeline: { type: String, enum: Object.values(DecisionTimeline), required: true },
    qualificationNotes: { type: String, trim: true },
    competitors: { type: [String], default: [] },

    activeQuoteId: { type: Schema.Types.ObjectId, ref: 'Quote', default: null },
    activeQuoteNumber: { type: String, trim: true },
    activeQuoteStatus: { type: String, trim: true },
    activeQuoteValue: { type: Number, default: 0 },
    activeQuoteMarginPct: { type: Number, default: 0 },
    quoteCount: { type: Number, default: 0 },

    lastActivityAt: { type: Date, default: () => new Date() },
    nextFollowUpDate: { type: Date, default: null },
    nextFollowUpMode: { type: String, enum: Object.values(FollowUpMode), default: null },

    poNumber: { type: String, trim: true },
    poDate: { type: Date, default: null },
    poDocumentUrl: { type: String, trim: true },
    wonAt: { type: Date, default: null },
    wonValue: { type: Number, default: 0 },
    lostAt: { type: Date, default: null },
    lossReason: { type: String, enum: Object.values(OpportunityLossReason) },
    competitorWon: { type: String, trim: true },
    competitorPrice: { type: Number, default: 0 },
    priceGap: { type: Number, default: 0 },
    customerFeedback: { type: String, trim: true },

    convertedAt: { type: Date, default: null },
    convertedBy: { type: String, trim: true },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        if (ret.prospectId) ret.prospectId = (ret.prospectId as { toString(): string }).toString();
        if (ret.assignedUserId)
          ret.assignedUserId = (ret.assignedUserId as { toString(): string }).toString();
        if (ret.quotationOwnerId)
          ret.quotationOwnerId = (ret.quotationOwnerId as { toString(): string }).toString();
        if (ret.technicalReviewerId)
          ret.technicalReviewerId = (ret.technicalReviewerId as { toString(): string }).toString();
        if (ret.activeQuoteId)
          ret.activeQuoteId = (ret.activeQuoteId as { toString(): string }).toString();
        return ret;
      },
    },
  }
);

opportunitySchema.index({ assignedUserId: 1 });
opportunitySchema.index({ stage: 1 });
opportunitySchema.index({ status: 1 });
opportunitySchema.index({ submissionDeadline: 1 });
opportunitySchema.index({ lastActivityAt: -1 });
opportunitySchema.index({ expectedCloseDate: 1 });
opportunitySchema.index({ prospectId: 1 });
opportunitySchema.index({ createdAt: -1 });
opportunitySchema.index(
  {
    name: 'text',
    firstName: 'text',
    lastName: 'text',
    company: 'text',
    mobile: 'text',
    email: 'text',
    code: 'text',
  },
  { name: 'opportunity_search_idx' }
);

export const OpportunityModel = model<IOpportunity>('Opportunity', opportunitySchema);
