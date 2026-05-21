import { Schema, model, Document } from 'mongoose';

export type AuditAction =
  | 'auth.register'
  | 'auth.login'
  | 'auth.login_failed'
  | 'auth.logout'
  | 'auth.token_refresh'
  | 'org.create'
  | 'org.update';

export interface IAuditLog extends Document {
  userId: string | null;
  action: AuditAction;
  ip: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: String, default: null },
    action: { type: String, required: true },
    ip: { type: String, required: true },
    userAgent: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: () => new Date() },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLogModel = model<IAuditLog>('AuditLog', auditLogSchema);
