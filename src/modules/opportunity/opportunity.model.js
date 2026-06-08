"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpportunityModel = exports.OpportunityLossReason = exports.PaymentTermsPreset = exports.DrawingsStatus = exports.SiteVisitStatus = exports.WarrantyPeriod = exports.OpportunityType = exports.OpportunityStatus = exports.OpportunityStage = void 0;
const mongoose_1 = require("mongoose");
const lead_model_1 = require("../lead/lead.model");
const prospect_model_1 = require("../prospect/prospect.model");
const hold_types_1 = require("../crm-health/hold.types");
var OpportunityStage;
(function (OpportunityStage) {
    OpportunityStage["SCOPE_DEFINED"] = "scope_defined";
    OpportunityStage["QUOTE_IN_PROGRESS"] = "quote_in_progress";
    OpportunityStage["UNDER_REVIEW"] = "under_review";
    OpportunityStage["QUOTE_APPROVED"] = "quote_approved";
    OpportunityStage["QUOTE_SENT"] = "quote_sent";
    OpportunityStage["REVISION_REQUESTED"] = "revision_requested";
    OpportunityStage["NEGOTIATION"] = "negotiation";
    OpportunityStage["VERBAL_COMMITMENT"] = "verbal_commitment";
    OpportunityStage["WON"] = "won";
    OpportunityStage["LOST"] = "lost";
})(OpportunityStage || (exports.OpportunityStage = OpportunityStage = {}));
var OpportunityStatus;
(function (OpportunityStatus) {
    OpportunityStatus["OPEN"] = "open";
    OpportunityStatus["ON_HOLD"] = "on_hold";
    OpportunityStatus["WON"] = "won";
    OpportunityStatus["LOST"] = "lost";
})(OpportunityStatus || (exports.OpportunityStatus = OpportunityStatus = {}));
var OpportunityType;
(function (OpportunityType) {
    OpportunityType["SUPPLY_INSTALL"] = "supply_install";
    OpportunityType["SUPPLY_ONLY"] = "supply_only";
    OpportunityType["AMC"] = "amc";
    OpportunityType["TURNKEY"] = "turnkey";
    OpportunityType["CONSULTANCY"] = "consultancy";
})(OpportunityType || (exports.OpportunityType = OpportunityType = {}));
var WarrantyPeriod;
(function (WarrantyPeriod) {
    WarrantyPeriod["NONE"] = "none";
    WarrantyPeriod["M12"] = "12m";
    WarrantyPeriod["M24"] = "24m";
    WarrantyPeriod["M36"] = "36m";
})(WarrantyPeriod || (exports.WarrantyPeriod = WarrantyPeriod = {}));
var SiteVisitStatus;
(function (SiteVisitStatus) {
    SiteVisitStatus["COMPLETED"] = "completed";
    SiteVisitStatus["SCHEDULED"] = "scheduled";
    SiteVisitStatus["NOT_REQUIRED"] = "not_required";
})(SiteVisitStatus || (exports.SiteVisitStatus = SiteVisitStatus = {}));
var DrawingsStatus;
(function (DrawingsStatus) {
    DrawingsStatus["ATTACHED"] = "attached";
    DrawingsStatus["PENDING"] = "pending";
    DrawingsStatus["NOT_REQUIRED"] = "not_required";
})(DrawingsStatus || (exports.DrawingsStatus = DrawingsStatus = {}));
var PaymentTermsPreset;
(function (PaymentTermsPreset) {
    PaymentTermsPreset["ADV_30_BAL_60"] = "adv_30_bal_60";
    PaymentTermsPreset["ADV_50_BAL_50"] = "adv_50_bal_50";
    PaymentTermsPreset["MILESTONES"] = "milestones";
    PaymentTermsPreset["NET_30"] = "net_30";
    PaymentTermsPreset["CUSTOM"] = "custom";
})(PaymentTermsPreset || (exports.PaymentTermsPreset = PaymentTermsPreset = {}));
var OpportunityLossReason;
(function (OpportunityLossReason) {
    OpportunityLossReason["PRICE_HIGH"] = "price_high";
    OpportunityLossReason["COMPETITOR_RELATIONSHIP"] = "competitor_relationship";
    OpportunityLossReason["COMPETITOR_SPECS"] = "competitor_specs";
    OpportunityLossReason["CANCELLED"] = "cancelled";
    OpportunityLossReason["POSTPONED"] = "postponed";
    OpportunityLossReason["BUDGET_NOT_APPROVED"] = "budget_not_approved";
    OpportunityLossReason["NO_RESPONSE"] = "no_response";
    OpportunityLossReason["SPEC_MISMATCH"] = "spec_mismatch";
    OpportunityLossReason["INCUMBENT"] = "incumbent";
    OpportunityLossReason["LOST_TENDER"] = "lost_tender";
    OpportunityLossReason["OTHER"] = "other";
})(OpportunityLossReason || (exports.OpportunityLossReason = OpportunityLossReason = {}));
const milestoneSchema = new mongoose_1.Schema({
    label: { type: String, required: true, trim: true },
    percent: { type: Number, required: true, min: 0, max: 100 },
    trigger: { type: String, trim: true },
}, { _id: false });
const opportunitySchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true, trim: true },
    prospectId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Prospect', default: null },
    prospectCode: { type: String, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    company: { type: String, trim: true },
    designation: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    source: { type: String, enum: Object.values(lead_model_1.LeadSource), required: true },
    campaign: { type: String, trim: true },
    productInterest: { type: String, enum: Object.values(lead_model_1.LeadProductInterest) },
    industry: { type: String, enum: Object.values(lead_model_1.LeadIndustry) },
    temperature: {
        type: String,
        enum: Object.values(lead_model_1.LeadTemperature),
        required: true,
        default: lead_model_1.LeadTemperature.WARM,
    },
    tags: { type: [String], default: [] },
    assignedUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    quotationOwnerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    technicalReviewerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(OpportunityType), required: true },
    dealValue: { type: Number, required: true, min: 0 },
    expectedCloseDate: { type: Date, required: true },
    winProbability: { type: Number, required: true, min: 0, max: 100, default: 40 },
    weightedValue: { type: Number, required: true, min: 0, default: 0 },
    approvalThreshold: { type: Number, required: true, min: 0, default: 2500000 },
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
    budgetStatus: { type: String, enum: Object.values(lead_model_1.BudgetStatus), required: true },
    authorityType: { type: String, enum: Object.values(prospect_model_1.AuthorityType), required: true },
    decisionMakerCount: { type: String, enum: Object.values(prospect_model_1.DecisionMakerCount) },
    confirmedNeed: { type: String, required: true, trim: true },
    decisionTimeline: { type: String, enum: Object.values(lead_model_1.DecisionTimeline), required: true },
    qualificationNotes: { type: String, trim: true },
    competitors: { type: [String], default: [] },
    activeQuoteId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Quote', default: null },
    activeQuoteNumber: { type: String, trim: true },
    activeQuoteStatus: { type: String, trim: true },
    activeQuoteValue: { type: Number, default: 0 },
    activeQuoteMarginPct: { type: Number, default: 0 },
    quoteCount: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: () => new Date() },
    nextFollowUpDate: { type: Date, default: null },
    nextFollowUpMode: { type: String, enum: Object.values(lead_model_1.FollowUpMode), default: null },
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
    holdReason: { type: String, enum: Object.values(hold_types_1.HoldReason), default: null },
    holdUntil: { type: Date, default: null },
    holdNotes: { type: String, trim: true, default: null },
    heldAt: { type: Date, default: null },
    heldBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    previousStatus: { type: String, default: null },
    previousStage: { type: String, default: null },
    alertSnoozedUntil: { type: Date, default: null },
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            if (ret.prospectId)
                ret.prospectId = ret.prospectId.toString();
            if (ret.assignedUserId)
                ret.assignedUserId = ret.assignedUserId.toString();
            if (ret.quotationOwnerId)
                ret.quotationOwnerId = ret.quotationOwnerId.toString();
            if (ret.technicalReviewerId)
                ret.technicalReviewerId = ret.technicalReviewerId.toString();
            if (ret.activeQuoteId)
                ret.activeQuoteId = ret.activeQuoteId.toString();
            return ret;
        },
    },
});
opportunitySchema.index({ assignedUserId: 1 });
opportunitySchema.index({ stage: 1 });
opportunitySchema.index({ status: 1 });
opportunitySchema.index({ submissionDeadline: 1 });
opportunitySchema.index({ lastActivityAt: -1 });
opportunitySchema.index({ expectedCloseDate: 1 });
opportunitySchema.index({ prospectId: 1 });
opportunitySchema.index({ createdAt: -1 });
opportunitySchema.index({
    name: 'text',
    firstName: 'text',
    lastName: 'text',
    company: 'text',
    mobile: 'text',
    email: 'text',
    code: 'text',
}, { name: 'opportunity_search_idx' });
exports.OpportunityModel = (0, mongoose_1.model)('Opportunity', opportunitySchema);
