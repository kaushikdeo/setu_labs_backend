"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = exports.NotificationSeverity = exports.NotificationChannel = exports.NotificationType = void 0;
const mongoose_1 = require("mongoose");
var NotificationType;
(function (NotificationType) {
    NotificationType["FOLLOW_UP_DUE"] = "follow_up_due";
    NotificationType["FOLLOW_UP_OVERDUE"] = "follow_up_overdue";
    NotificationType["FOLLOW_UP_UPCOMING"] = "follow_up_upcoming";
    NotificationType["ACTIVITY_FOLLOW_UP"] = "activity_follow_up";
    NotificationType["STALE_ENTITY"] = "stale_entity";
    NotificationType["HOLD_RESURFACE"] = "hold_resurface";
    NotificationType["CLOSE_DATE_MISSED"] = "close_date_missed";
    NotificationType["SUBMISSION_DEADLINE"] = "submission_deadline";
    NotificationType["QUOTE_EXPIRING"] = "quote_expiring";
    NotificationType["REVIEW_ESCALATION"] = "review_escalation";
    NotificationType["DAILY_SUMMARY"] = "daily_summary";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["IN_APP"] = "in_app";
    NotificationChannel["EMAIL"] = "email";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
var NotificationSeverity;
(function (NotificationSeverity) {
    NotificationSeverity["INFO"] = "info";
    NotificationSeverity["WARNING"] = "warning";
    NotificationSeverity["CRITICAL"] = "critical";
})(NotificationSeverity || (exports.NotificationSeverity = NotificationSeverity = {}));
const notificationSchema = new mongoose_1.Schema({
    organizationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Organization', default: null },
    recipientUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    channel: { type: String, enum: Object.values(NotificationChannel), required: true },
    severity: { type: String, enum: Object.values(NotificationSeverity), required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    entityType: { type: String },
    entityId: { type: mongoose_1.Schema.Types.ObjectId },
    dedupeKey: { type: String, required: true, unique: true },
    readAt: { type: Date, default: null },
    sentAt: { type: Date, default: () => new Date() },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            if (ret.recipientUserId)
                ret.recipientUserId = ret.recipientUserId.toString();
            if (ret.entityId)
                ret.entityId = ret.entityId.toString();
            return ret;
        },
    },
});
notificationSchema.index({ recipientUserId: 1, readAt: 1, createdAt: -1 });
exports.NotificationModel = (0, mongoose_1.model)('Notification', notificationSchema);
