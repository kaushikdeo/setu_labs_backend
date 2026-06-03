import { Schema, model, Document } from 'mongoose';

export type AuditAction =
  | 'auth.register'
  | 'auth.login'
  | 'auth.login_failed'
  | 'auth.logout'
  | 'auth.token_refresh'
  | 'org.create'
  | 'org.update'
  | 'customer.create'
  | 'customer.update'
  | 'site.create'
  | 'site.update'
  | 'site.deactivate'
  | 'equipment.create'
  | 'equipment.update'
  | 'equipment.delete'
  | 'instrument.create'
  | 'instrument.update'
  | 'visit.create'
  | 'visit.update'
  | 'visit.delete'
  | 'visit.task.start'
  | 'visit.task.complete'
  | 'report.create'
  | 'report.submit'
  | 'report.approve'
  | 'report.reject'
  | 'report.request_changes';

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
