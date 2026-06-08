import { Schema, model, Document, Types } from 'mongoose';

export type ActivityEntityType = 'lead' | 'prospect' | 'opportunity';

export enum ActivityType {
  CALL = 'call',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  SITE_VISIT = 'site_visit',
  DEMO = 'demo',
  NOTE = 'note',
  STAGE_CHANGE = 'stage_change',
  CONVERSION = 'conversion',
  WON = 'won',
  LOST = 'lost',
  FOLLOW_UP = 'follow_up',
  ON_HOLD = 'on_hold',
  RESUMED = 'resumed',
  SYSTEM = 'system',
}

export type ActivityDirection = 'in' | 'out';
export type ActivityOutcome = 'positive' | 'neutral' | 'objection';

export interface IActivity extends Document {
  entityType: ActivityEntityType;
  entityId: Types.ObjectId;
  linkedProspectId?: Types.ObjectId | null;
  type: ActivityType;
  direction?: ActivityDirection;
  title: string;
  description?: string;
  outcome?: ActivityOutcome;
  nextStep?: string;
  occurredAt: Date;
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    entityType: { type: String, enum: ['lead', 'prospect', 'opportunity'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    linkedProspectId: { type: Schema.Types.ObjectId, default: null },
    type: { type: String, enum: Object.values(ActivityType), required: true },
    direction: { type: String, enum: ['in', 'out'] },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    outcome: { type: String, enum: ['positive', 'neutral', 'objection'] },
    nextStep: { type: String, trim: true },
    occurredAt: { type: Date, required: true, default: () => new Date() },
    metadata: { type: Schema.Types.Mixed },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        if (ret.entityId) ret.entityId = (ret.entityId as { toString(): string }).toString();
        if (ret.linkedProspectId)
          ret.linkedProspectId = (ret.linkedProspectId as { toString(): string }).toString();
        return ret;
      },
    },
  }
);

activitySchema.index({ entityType: 1, entityId: 1, occurredAt: -1 });
activitySchema.index({ linkedProspectId: 1, occurredAt: -1 });
activitySchema.index({ type: 1 });
activitySchema.index({ occurredAt: -1 });

export const ActivityModel = model<IActivity>('Activity', activitySchema);
