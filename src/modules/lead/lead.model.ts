import { Schema, model, Document, Types } from 'mongoose';
import { HoldReason } from '../crm-health/hold.types';

export enum LeadSource {
  WEB_FORM = 'web_form',
  LINKEDIN = 'linkedin',
  COLD_CALL = 'cold_call',
  REFERRAL = 'referral',
  TRADE_EVENT = 'trade_event',
  WHATSAPP = 'whatsapp',
  EMAIL_CAMPAIGN = 'email_campaign',
  OTHER = 'other',
}

export enum LeadTemperature {
  HOT = 'hot',
  WARM = 'warm',
  COLD = 'cold',
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  HOT = 'hot',
  WARM = 'warm',
  COLD = 'cold',
  QUALIFIED = 'qualified',
  CONVERTED = 'converted',
  NOT_INTERESTED = 'not_interested',
  STALE = 'stale',
  ON_HOLD = 'on_hold',
}

export enum LeadPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum DecisionTimeline {
  IMMEDIATE = 'immediate',
  SHORT = 'short',
  MEDIUM = 'medium',
  LONG = 'long',
}

export enum BudgetStatus {
  UNKNOWN = 'unknown',
  YES = 'yes',
  NO = 'no',
  PENDING = 'pending',
}

export enum FollowUpMode {
  PHONE = 'phone',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  SITE_VISIT = 'site_visit',
  VIDEO_CALL = 'video_call',
}

export enum LeadIndustry {
  MANUFACTURING = 'manufacturing',
  REAL_ESTATE = 'real_estate',
  HOSPITALITY = 'hospitality',
  HEALTHCARE = 'healthcare',
  IT_OFFICES = 'it_offices',
  GOVERNMENT = 'government',
}

export enum LeadProductInterest {
  HVAC = 'hvac',
  FIRE_SAFETY = 'fire_safety',
  SOLAR_MEP = 'solar_mep',
  AMC = 'amc',
  TURNKEY = 'turnkey',
}

export interface ILead extends Document {
  code: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  company?: string;
  designation?: string;
  department?: string;
  city?: string;
  state?: string;
  source: LeadSource;
  campaign?: string;
  referredBy?: string;
  productInterest?: LeadProductInterest;
  estimatedValue?: number;
  expectedCloseDate?: Date;
  industry?: LeadIndustry;
  decisionTimeline?: DecisionTimeline;
  budgetStatus?: BudgetStatus;
  temperature: LeadTemperature;
  tags: string[];
  assignedUserId: Types.ObjectId;
  followUpDate?: Date;
  followUpMode?: FollowUpMode;
  priority: LeadPriority;
  notes?: string;
  status: LeadStatus;
  createdBy: string;
  lastActivityAt: Date;
  convertedAt?: Date | null;
  holdReason?: HoldReason | null;
  holdUntil?: Date | null;
  holdNotes?: string | null;
  heldAt?: Date | null;
  heldBy?: Types.ObjectId | null;
  previousStatus?: string | null;
  alertSnoozedUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    company: { type: String, trim: true },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    source: { type: String, enum: Object.values(LeadSource), required: true },
    campaign: { type: String, trim: true },
    referredBy: { type: String, trim: true },
    productInterest: { type: String, enum: Object.values(LeadProductInterest) },
    estimatedValue: { type: Number, min: 0 },
    expectedCloseDate: { type: Date },
    industry: { type: String, enum: Object.values(LeadIndustry) },
    decisionTimeline: { type: String, enum: Object.values(DecisionTimeline) },
    budgetStatus: { type: String, enum: Object.values(BudgetStatus) },
    temperature: { type: String, enum: Object.values(LeadTemperature), required: true, default: LeadTemperature.WARM },
    tags: { type: [String], default: [] },
    assignedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    followUpDate: { type: Date },
    followUpMode: { type: String, enum: Object.values(FollowUpMode) },
    priority: { type: String, enum: Object.values(LeadPriority), default: LeadPriority.NORMAL },
    notes: { type: String, trim: true },
    status: { type: String, enum: Object.values(LeadStatus), default: LeadStatus.NEW },
    createdBy: { type: String, required: true },
    lastActivityAt: { type: Date, default: () => new Date() },
    convertedAt: { type: Date, default: null },
    holdReason: { type: String, enum: Object.values(HoldReason), default: null },
    holdUntil: { type: Date, default: null },
    holdNotes: { type: String, trim: true, default: null },
    heldAt: { type: Date, default: null },
    heldBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    previousStatus: { type: String, default: null },
    alertSnoozedUntil: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        if (ret.assignedUserId) {
          ret.assignedUserId = (ret.assignedUserId as { toString(): string }).toString();
        }
        return ret;
      },
    },
  },
);

leadSchema.index({ assignedUserId: 1 });
leadSchema.index({ temperature: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ followUpDate: 1 });
leadSchema.index({ lastActivityAt: -1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index(
  { firstName: 'text', lastName: 'text', company: 'text', mobile: 'text', email: 'text' },
  { name: 'lead_search_idx' },
);

export const LeadModel = model<ILead>('Lead', leadSchema);
