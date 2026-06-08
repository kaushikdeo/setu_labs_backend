"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadModel = exports.LeadProductInterest = exports.LeadIndustry = exports.FollowUpMode = exports.BudgetStatus = exports.DecisionTimeline = exports.LeadPriority = exports.LeadStatus = exports.LeadTemperature = exports.LeadSource = void 0;
const mongoose_1 = require("mongoose");
const hold_types_1 = require("../crm-health/hold.types");
var LeadSource;
(function (LeadSource) {
    LeadSource["WEB_FORM"] = "web_form";
    LeadSource["LINKEDIN"] = "linkedin";
    LeadSource["COLD_CALL"] = "cold_call";
    LeadSource["REFERRAL"] = "referral";
    LeadSource["TRADE_EVENT"] = "trade_event";
    LeadSource["WHATSAPP"] = "whatsapp";
    LeadSource["EMAIL_CAMPAIGN"] = "email_campaign";
    LeadSource["OTHER"] = "other";
})(LeadSource || (exports.LeadSource = LeadSource = {}));
var LeadTemperature;
(function (LeadTemperature) {
    LeadTemperature["HOT"] = "hot";
    LeadTemperature["WARM"] = "warm";
    LeadTemperature["COLD"] = "cold";
})(LeadTemperature || (exports.LeadTemperature = LeadTemperature = {}));
var LeadStatus;
(function (LeadStatus) {
    LeadStatus["NEW"] = "new";
    LeadStatus["CONTACTED"] = "contacted";
    LeadStatus["HOT"] = "hot";
    LeadStatus["WARM"] = "warm";
    LeadStatus["COLD"] = "cold";
    LeadStatus["QUALIFIED"] = "qualified";
    LeadStatus["CONVERTED"] = "converted";
    LeadStatus["NOT_INTERESTED"] = "not_interested";
    LeadStatus["STALE"] = "stale";
    LeadStatus["ON_HOLD"] = "on_hold";
})(LeadStatus || (exports.LeadStatus = LeadStatus = {}));
var LeadPriority;
(function (LeadPriority) {
    LeadPriority["LOW"] = "low";
    LeadPriority["NORMAL"] = "normal";
    LeadPriority["HIGH"] = "high";
    LeadPriority["URGENT"] = "urgent";
})(LeadPriority || (exports.LeadPriority = LeadPriority = {}));
var DecisionTimeline;
(function (DecisionTimeline) {
    DecisionTimeline["IMMEDIATE"] = "immediate";
    DecisionTimeline["SHORT"] = "short";
    DecisionTimeline["MEDIUM"] = "medium";
    DecisionTimeline["LONG"] = "long";
})(DecisionTimeline || (exports.DecisionTimeline = DecisionTimeline = {}));
var BudgetStatus;
(function (BudgetStatus) {
    BudgetStatus["UNKNOWN"] = "unknown";
    BudgetStatus["YES"] = "yes";
    BudgetStatus["NO"] = "no";
    BudgetStatus["PENDING"] = "pending";
})(BudgetStatus || (exports.BudgetStatus = BudgetStatus = {}));
var FollowUpMode;
(function (FollowUpMode) {
    FollowUpMode["PHONE"] = "phone";
    FollowUpMode["EMAIL"] = "email";
    FollowUpMode["WHATSAPP"] = "whatsapp";
    FollowUpMode["SITE_VISIT"] = "site_visit";
    FollowUpMode["VIDEO_CALL"] = "video_call";
})(FollowUpMode || (exports.FollowUpMode = FollowUpMode = {}));
var LeadIndustry;
(function (LeadIndustry) {
    LeadIndustry["MANUFACTURING"] = "manufacturing";
    LeadIndustry["REAL_ESTATE"] = "real_estate";
    LeadIndustry["HOSPITALITY"] = "hospitality";
    LeadIndustry["HEALTHCARE"] = "healthcare";
    LeadIndustry["IT_OFFICES"] = "it_offices";
    LeadIndustry["GOVERNMENT"] = "government";
})(LeadIndustry || (exports.LeadIndustry = LeadIndustry = {}));
var LeadProductInterest;
(function (LeadProductInterest) {
    LeadProductInterest["HVAC"] = "hvac";
    LeadProductInterest["FIRE_SAFETY"] = "fire_safety";
    LeadProductInterest["SOLAR_MEP"] = "solar_mep";
    LeadProductInterest["AMC"] = "amc";
    LeadProductInterest["TURNKEY"] = "turnkey";
})(LeadProductInterest || (exports.LeadProductInterest = LeadProductInterest = {}));
const leadSchema = new mongoose_1.Schema({
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
    assignedUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    followUpDate: { type: Date },
    followUpMode: { type: String, enum: Object.values(FollowUpMode) },
    priority: { type: String, enum: Object.values(LeadPriority), default: LeadPriority.NORMAL },
    notes: { type: String, trim: true },
    status: { type: String, enum: Object.values(LeadStatus), default: LeadStatus.NEW },
    createdBy: { type: String, required: true },
    lastActivityAt: { type: Date, default: () => new Date() },
    convertedAt: { type: Date, default: null },
    holdReason: { type: String, enum: Object.values(hold_types_1.HoldReason), default: null },
    holdUntil: { type: Date, default: null },
    holdNotes: { type: String, trim: true, default: null },
    heldAt: { type: Date, default: null },
    heldBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    previousStatus: { type: String, default: null },
    alertSnoozedUntil: { type: Date, default: null },
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            if (ret.assignedUserId) {
                ret.assignedUserId = ret.assignedUserId.toString();
            }
            return ret;
        },
    },
});
leadSchema.index({ assignedUserId: 1 });
leadSchema.index({ temperature: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ followUpDate: 1 });
leadSchema.index({ lastActivityAt: -1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ firstName: 'text', lastName: 'text', company: 'text', mobile: 'text', email: 'text' }, { name: 'lead_search_idx' });
exports.LeadModel = (0, mongoose_1.model)('Lead', leadSchema);
