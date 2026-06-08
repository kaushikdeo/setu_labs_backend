"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteModel = exports.Uom = exports.GstType = exports.ReviewState = exports.QuoteStatus = void 0;
const mongoose_1 = require("mongoose");
const opportunity_model_1 = require("../opportunity/opportunity.model");
var QuoteStatus;
(function (QuoteStatus) {
    QuoteStatus["DRAFT"] = "draft";
    QuoteStatus["UNDER_REVIEW"] = "under_review";
    QuoteStatus["APPROVED"] = "approved";
    QuoteStatus["SENT"] = "sent";
    QuoteStatus["REVISION_REQUESTED"] = "revision_requested";
    QuoteStatus["ACCEPTED"] = "accepted";
    QuoteStatus["REJECTED"] = "rejected";
    QuoteStatus["SUPERSEDED"] = "superseded";
})(QuoteStatus || (exports.QuoteStatus = QuoteStatus = {}));
var ReviewState;
(function (ReviewState) {
    ReviewState["PENDING"] = "pending";
    ReviewState["APPROVED"] = "approved";
    ReviewState["RETURNED"] = "returned";
    ReviewState["SKIPPED"] = "skipped";
})(ReviewState || (exports.ReviewState = ReviewState = {}));
var GstType;
(function (GstType) {
    GstType["CGST_SGST"] = "cgst_sgst";
    GstType["IGST"] = "igst";
    GstType["NIL"] = "nil";
})(GstType || (exports.GstType = GstType = {}));
var Uom;
(function (Uom) {
    Uom["NOS"] = "nos";
    Uom["SQFT"] = "sqft";
    Uom["KW"] = "kw";
    Uom["TR"] = "tr";
    Uom["HOURS"] = "hours";
    Uom["YEARS"] = "years";
    Uom["MONTHS"] = "months";
    Uom["LOT"] = "lot";
})(Uom || (exports.Uom = Uom = {}));
const lineItemSchema = new mongoose_1.Schema({
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
}, { _id: false });
const reviewSchema = new mongoose_1.Schema({
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
}, { _id: false });
const milestoneSchema = new mongoose_1.Schema({
    label: { type: String, required: true, trim: true },
    percent: { type: Number, required: true, min: 0, max: 100 },
    trigger: { type: String, trim: true },
}, { _id: false });
const quoteSchema = new mongoose_1.Schema({
    opportunityId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
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
    type: { type: String, enum: Object.values(opportunity_model_1.OpportunityType), required: true },
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
        enum: Object.values(opportunity_model_1.WarrantyPeriod),
        required: true,
        default: opportunity_model_1.WarrantyPeriod.M12,
    },
    validityNote: { type: String, trim: true },
    specialConditions: { type: String, trim: true },
    scopeOfSupply: { type: String, trim: true },
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    tcTemplateId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'TcTemplate', default: null },
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
    supersededByQuoteId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Quote', default: null },
    createdBy: { type: String, required: true },
    createdByName: { type: String },
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            if (ret.opportunityId)
                ret.opportunityId = ret.opportunityId.toString();
            if (ret.tcTemplateId)
                ret.tcTemplateId = ret.tcTemplateId.toString();
            if (ret.supersededByQuoteId)
                ret.supersededByQuoteId = ret.supersededByQuoteId.toString();
            return ret;
        },
    },
});
quoteSchema.index({ opportunityId: 1, version: -1 });
quoteSchema.index({ status: 1 });
quoteSchema.index({ createdAt: -1 });
exports.QuoteModel = (0, mongoose_1.model)('Quote', quoteSchema);
