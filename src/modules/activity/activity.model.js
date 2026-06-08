"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityModel = exports.ActivityType = void 0;
const mongoose_1 = require("mongoose");
var ActivityType;
(function (ActivityType) {
    ActivityType["CALL"] = "call";
    ActivityType["EMAIL"] = "email";
    ActivityType["WHATSAPP"] = "whatsapp";
    ActivityType["SITE_VISIT"] = "site_visit";
    ActivityType["DEMO"] = "demo";
    ActivityType["NOTE"] = "note";
    ActivityType["STAGE_CHANGE"] = "stage_change";
    ActivityType["CONVERSION"] = "conversion";
    ActivityType["WON"] = "won";
    ActivityType["LOST"] = "lost";
    ActivityType["FOLLOW_UP"] = "follow_up";
    ActivityType["ON_HOLD"] = "on_hold";
    ActivityType["RESUMED"] = "resumed";
    ActivityType["SYSTEM"] = "system";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
const activitySchema = new mongoose_1.Schema({
    entityType: { type: String, enum: ['lead', 'prospect', 'opportunity'], required: true },
    entityId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    linkedProspectId: { type: mongoose_1.Schema.Types.ObjectId, default: null },
    type: { type: String, enum: Object.values(ActivityType), required: true },
    direction: { type: String, enum: ['in', 'out'] },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    outcome: { type: String, enum: ['positive', 'neutral', 'objection'] },
    nextStep: { type: String, trim: true },
    occurredAt: { type: Date, required: true, default: () => new Date() },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    createdBy: { type: String, required: true },
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            if (ret.entityId)
                ret.entityId = ret.entityId.toString();
            if (ret.linkedProspectId)
                ret.linkedProspectId = ret.linkedProspectId.toString();
            return ret;
        },
    },
});
activitySchema.index({ entityType: 1, entityId: 1, occurredAt: -1 });
activitySchema.index({ linkedProspectId: 1, occurredAt: -1 });
activitySchema.index({ type: 1 });
activitySchema.index({ occurredAt: -1 });
exports.ActivityModel = (0, mongoose_1.model)('Activity', activitySchema);
