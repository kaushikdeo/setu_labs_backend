import { Request } from 'express';
import { AuditAction, AuditLogModel, IAuditLog } from './audit.model';
import { logger } from '../../config/logger';

export interface ActivityEntry {
  action: AuditAction;
  timestamp: Date;
  ip: string;
  metadata: Record<string, unknown>;
}

export class AuditService {
  async logEvent(
    action: AuditAction,
    req: Request,
    userId: string | null = null,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      await AuditLogModel.create({
        userId,
        action,
        ip: req.ip ?? req.socket.remoteAddress ?? 'unknown',
        userAgent: req.headers['user-agent'] ?? '',
        metadata,
        timestamp: new Date(),
      });
    } catch (err) {
      logger.error('Failed to write audit log', { action, userId, err });
    }
  }

  async getRecentActivity(userId: string | null, limit = 50): Promise<ActivityEntry[]> {
    const query = userId ? { userId } : {};
    const logs: IAuditLog[] = await AuditLogModel.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return logs.map((log) => ({
      action: log.action,
      timestamp: log.timestamp,
      ip: log.ip,
      metadata: log.metadata,
    }));
  }
}

export const auditService = new AuditService();
