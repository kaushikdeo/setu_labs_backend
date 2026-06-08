"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProspectModel = exports.LostReason = exports.DecisionMakerCount = exports.AuthorityType = exports.ProspectStatus = exports.PipelineStage = void 0;
const mongoose_1 = require("mongoose");
const lead_model_1 = require("../lead/lead.model");
const hold_types_1 = require("../crm-health/hold.types");
var PipelineStage;
(function (PipelineStage) {
    PipelineStage["NEW"] = "new";
    PipelineStage["QUALIFIED"] = "qualified";
    PipelineStage["DEMO_SCHEDULED"] = "demo_scheduled";
    PipelineStage["DEMO_DONE"] = "demo_done";
    PipelineStage["QUOTE_IN_PROGRESS"] = "quote_in_progress";
    PipelineStage["QUOTATION_SENT"] = "quotation_sent";
    PipelineStage["FOLLOW_UP"] = "follow_up";
    PipelineStage["NEGOTIATION"] = "negotiation";
    PipelineStage["PO_EXPECTED"] = "po_expected";
    PipelineStage["WON"] = "won";
    PipelineStage["LOST"] = "lost";
})(PipelineStage || (exports.PipelineStage = PipelineStage = {}));
var ProspectStatus;
(function (ProspectStatus) {
    ProspectStatus["OPEN"] = "open";
    ProspectStatus["ON_HOLD"] = "on_hold";
    ProspectStatus["WON"] = "won";
    ProspectStatus["LOST"] = "lost";
})(ProspectStatus || (exports.ProspectStatus = ProspectStatus = {}));
var AuthorityType;
(function (AuthorityType) {
    AuthorityType["DECISION_MAKER"] = "decision_maker";
    AuthorityType["INFLUENCER"] = "influencer";
    AuthorityType["COMMITTEE_MEMBER"] = "committee_member";
})(AuthorityType || (exports.AuthorityType = AuthorityType = {}));
var DecisionMakerCount;
(function (DecisionMakerCount) {
    DecisionMakerCount["ONE"] = "one";
    DecisionMakerCount["TWO_THREE"] = "two_three";
    DecisionMakerCount["FOUR_PLUS"] = "four_plus";
})(DecisionMakerCount || (exports.DecisionMakerCount = DecisionMakerCount = {}));
var LostReason;
(function (LostReason) {
    LostReason["PRICE"] = "price";
    LostReason["COMPETITOR"] = "competitor";
    LostReason["TIMING"] = "timing";
    LostReason["SCOPE_CHANGE"] = "scope_change";
    LostReason["BUDGET_LOST"] = "budget_lost";
    LostReason["NO_RESPONSE"] = "no_response";
    LostReason["OTHER"] = "other";
})(LostReason || (exports.LostReason = LostReason = {}));
const prospectSchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true, trim: true },
    leadId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Lead', required: true, unique: true },
    leadCode: { type: String, trim: true },
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
    temperature: { type: String, enum: Object.values(lead_model_1.LeadTemperature), required: true, default: lead_model_1.LeadTemperature.WARM },
    tags: { type: [String], default: [] },
    assignedUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    dealValue: { type: Number, required: true, min: 0 },
    expectedCloseDate: { type: Date, required: true },
    winProbability: { type: Number, required: true, min: 0, max: 100, default: 50 },
    weightedValue: { type: Number, required: true, min: 0, default: 0 },
    stage: { type: String, enum: Object.values(PipelineStage), required: true, default: PipelineStage.NEW },
    status: { type: String, enum: Object.values(ProspectStatus), required: true, default: ProspectStatus.OPEN },
    stageChangedAt: { type: Date, default: () => new Date() },
    budgetStatus: { type: String, enum: Object.values(lead_model_1.BudgetStatus), required: true },
    authorityType: { type: String, enum: Object.values(AuthorityType), required: true },
    decisionMakerCount: { type: String, enum: Object.values(DecisionMakerCount) },
    confirmedNeed: { type: String, required: true, trim: true },
    decisionTimeline: { type: String, enum: Object.values(lead_model_1.DecisionTimeline), required: true },
    qualificationNotes: { type: String, trim: true },
    competitors: { type: [String], default: [] },
    lastActivityAt: { type: Date, default: () => new Date() },
    nextFollowUpDate: { type: Date, default: null },
    nextFollowUpMode: { type: String, enum: Object.values(lead_model_1.FollowUpMode), default: null },
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
            if (ret.leadId)
                ret.leadId = ret.leadId.toString();
            if (ret.assignedUserId)
                ret.assignedUserId = ret.assignedUserId.toString();
            return ret;
        },
    },
});
prospectSchema.index({ assignedUserId: 1 });
prospectSchema.index({ stage: 1 });
prospectSchema.index({ status: 1 });
prospectSchema.index({ temperature: 1 });
prospectSchema.index({ expectedCloseDate: 1 });
prospectSchema.index({ nextFollowUpDate: 1 });
prospectSchema.index({ lastActivityAt: -1 });
prospectSchema.index({ createdAt: -1 });
prospectSchema.index({ firstName: 'text', lastName: 'text', company: 'text', mobile: 'text', email: 'text', code: 'text' }, { name: 'prospect_search_idx' });
exports.ProspectModel = (0, mongoose_1.model)('Prospect', prospectSchema);
