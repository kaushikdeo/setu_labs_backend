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
import { HoldReason } from '../crm-health/hold.types';

export enum PipelineStage {
  NEW = 'new',
  QUALIFIED = 'qualified',
  DEMO_SCHEDULED = 'demo_scheduled',
  DEMO_DONE = 'demo_done',
  QUOTE_IN_PROGRESS = 'quote_in_progress',
  QUOTATION_SENT = 'quotation_sent',
  FOLLOW_UP = 'follow_up',
  NEGOTIATION = 'negotiation',
  PO_EXPECTED = 'po_expected',
  WON = 'won',
  LOST = 'lost',
}

export enum ProspectStatus {
  OPEN = 'open',
  ON_HOLD = 'on_hold',
  WON = 'won',
  LOST = 'lost',
}

export enum AuthorityType {
  DECISION_MAKER = 'decision_maker',
  INFLUENCER = 'influencer',
  COMMITTEE_MEMBER = 'committee_member',
}

export enum DecisionMakerCount {
  ONE = 'one',
  TWO_THREE = 'two_three',
  FOUR_PLUS = 'four_plus',
}

export enum LostReason {
  PRICE = 'price',
  COMPETITOR = 'competitor',
  TIMING = 'timing',
  SCOPE_CHANGE = 'scope_change',
  BUDGET_LOST = 'budget_lost',
  NO_RESPONSE = 'no_response',
  OTHER = 'other',
}

export interface IProspect extends Document {
  code: string;
  leadId: Types.ObjectId;
  leadCode?: string;
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
  dealValue: number;
  expectedCloseDate: Date;
  winProbability: number;
  weightedValue: number;
  stage: PipelineStage;
  status: ProspectStatus;
  stageChangedAt: Date;
  budgetStatus: BudgetStatus;
  authorityType: AuthorityType;
  decisionMakerCount?: DecisionMakerCount;
  confirmedNeed: string;
  decisionTimeline: DecisionTimeline;
  qualificationNotes?: string;
  competitors: string[];
  lastActivityAt: Date;
  nextFollowUpDate?: Date | null;
  nextFollowUpMode?: FollowUpMode | null;
  demoDate?: Date | null;
  demoCompletedAt?: Date | null;
  poNumber?: string;
  poDate?: Date | null;
  wonAt?: Date | null;
  lostAt?: Date | null;
  lostReason?: LostReason;
  lostToCompetitor?: string;
  convertedAt: Date;
  convertedBy: string;
  createdBy: string;
  holdReason?: HoldReason | null;
  holdUntil?: Date | null;
  holdNotes?: string | null;
  heldAt?: Date | null;
  heldBy?: Types.ObjectId | null;
  previousStatus?: string | null;
  previousStage?: string | null;
  alertSnoozedUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const prospectSchema = new Schema<IProspect>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, unique: true },
    leadCode: { type: String, trim: true },
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
    temperature: { type: String, enum: Object.values(LeadTemperature), required: true, default: LeadTemperature.WARM },
    tags: { type: [String], default: [] },
    assignedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dealValue: { type: Number, required: true, min: 0 },
    expectedCloseDate: { type: Date, required: true },
    winProbability: { type: Number, required: true, min: 0, max: 100, default: 50 },
    weightedValue: { type: Number, required: true, min: 0, default: 0 },
    stage: { type: String, enum: Object.values(PipelineStage), required: true, default: PipelineStage.NEW },
    status: { type: String, enum: Object.values(ProspectStatus), required: true, default: ProspectStatus.OPEN },
    stageChangedAt: { type: Date, default: () => new Date() },
    budgetStatus: { type: String, enum: Object.values(BudgetStatus), required: true },
    authorityType: { type: String, enum: Object.values(AuthorityType), required: true },
    decisionMakerCount: { type: String, enum: Object.values(DecisionMakerCount) },
    confirmedNeed: { type: String, required: true, trim: true },
    decisionTimeline: { type: String, enum: Object.values(DecisionTimeline), required: true },
    qualificationNotes: { type: String, trim: true },
    competitors: { type: [String], default: [] },
    lastActivityAt: { type: Date, default: () => new Date() },
    nextFollowUpDate: { type: Date, default: null },
    nextFollowUpMode: { type: String, enum: Object.values(FollowUpMode), default: null },
    demoDate: { type: Date, default: null },
    demoCompletedAt: { type: Date, default: null },
    poNumber: { type: String, trim: true },
    poDate: { type: Date, default: null },
    wonAt: { type: Date, default: null },
    lostAt: { type: Date, default: null },
    lostReason: { type: String, enum: Object.values(LostReason) },
    lostToCompetitor: { type: String, trim: true },
    convertedAt: { type: Date, required: true, default: () => new Date() },
    convertedBy: { type: String, required: true },
    createdBy: { type: String, required: true },
    holdReason: { type: String, enum: Object.values(HoldReason), default: null },
    holdUntil: { type: Date, default: null },
    holdNotes: { type: String, trim: true, default: null },
    heldAt: { type: Date, default: null },
    heldBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    previousStatus: { type: String, default: null },
    previousStage: { type: String, default: null },
    alertSnoozedUntil: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        if (ret.leadId) ret.leadId = (ret.leadId as { toString(): string }).toString();
        if (ret.assignedUserId)
          ret.assignedUserId = (ret.assignedUserId as { toString(): string }).toString();
        return ret;
      },
    },
  },
);

prospectSchema.index({ assignedUserId: 1 });
prospectSchema.index({ stage: 1 });
prospectSchema.index({ status: 1 });
prospectSchema.index({ temperature: 1 });
prospectSchema.index({ expectedCloseDate: 1 });
prospectSchema.index({ nextFollowUpDate: 1 });
prospectSchema.index({ lastActivityAt: -1 });
prospectSchema.index({ createdAt: -1 });
prospectSchema.index(
  { firstName: 'text', lastName: 'text', company: 'text', mobile: 'text', email: 'text', code: 'text' },
  { name: 'prospect_search_idx' },
);

export const ProspectModel = model<IProspect>('Prospect', prospectSchema);
