import { Schema, model, Document, Types } from 'mongoose';

export enum NotificationType {
  FOLLOW_UP_DUE = 'follow_up_due',
  FOLLOW_UP_OVERDUE = 'follow_up_overdue',
  FOLLOW_UP_UPCOMING = 'follow_up_upcoming',
  ACTIVITY_FOLLOW_UP = 'activity_follow_up',
  STALE_ENTITY = 'stale_entity',
  HOLD_RESURFACE = 'hold_resurface',
  CLOSE_DATE_MISSED = 'close_date_missed',
  SUBMISSION_DEADLINE = 'submission_deadline',
  QUOTE_EXPIRING = 'quote_expiring',
  REVIEW_ESCALATION = 'review_escalation',
  DAILY_SUMMARY = 'daily_summary',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
}

export enum NotificationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface INotification extends Document {
  organizationId?: Types.ObjectId | null;
  recipientUserId: Types.ObjectId;
  type: NotificationType;
  channel: NotificationChannel;
  severity: NotificationSeverity;
  title: string;
  body: string;
  entityType?: string;
  entityId?: Types.ObjectId;
  dedupeKey: string;
  readAt?: Date | null;
  sentAt?: Date | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    channel: { type: String, enum: Object.values(NotificationChannel), required: true },
    severity: { type: String, enum: Object.values(NotificationSeverity), required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    entityType: { type: String },
    entityId: { type: Schema.Types.ObjectId },
    dedupeKey: { type: String, required: true, unique: true },
    readAt: { type: Date, default: null },
    sentAt: { type: Date, default: () => new Date() },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        if (ret.recipientUserId)
          ret.recipientUserId = (ret.recipientUserId as { toString(): string }).toString();
        if (ret.entityId) ret.entityId = (ret.entityId as { toString(): string }).toString();
        return ret;
      },
    },
  },
);

notificationSchema.index({ recipientUserId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ organizationId: 1 });

export const NotificationModel = model<INotification>('Notification', notificationSchema);
