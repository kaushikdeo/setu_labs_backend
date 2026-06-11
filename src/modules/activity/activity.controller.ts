import { Request, Response, NextFunction } from 'express';
import { activityService } from './activity.service';
import { ActivityEntityType, ActivityType } from './activity.model';
import { followUpService } from '../follow-up/follow-up.service';

export class ActivityController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entityType = req.query.entityType as ActivityEntityType;
      const entityId = req.query.entityId as string;
      const type = (req.query.type as ActivityType | undefined) || undefined;
      const data = await activityService.list(entityType, entityId, req.user!.organizationId!, type);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const organizationId = req.user!.organizationId!;
      const activity = await activityService.add(req.body, userId, organizationId);

      if (activity.type === ActivityType.FOLLOW_UP) {
        const meta = activity.metadata as Record<string, unknown> | undefined;
        const mode = typeof meta?.mode === 'string' ? (meta.mode as string) : undefined;
        await followUpService.syncFromActivity(
          activity.entityType,
          activity.entityId,
          activity.occurredAt,
          organizationId,
          mode,
        );
      } else if (
        activity.entityType === 'lead' ||
        activity.entityType === 'prospect' ||
        activity.entityType === 'opportunity'
      ) {
        await followUpService.touchLastActivity(activity.entityType, activity.entityId, organizationId);
      }

      res.status(201).json({ success: true, data: activity });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await activityService.remove(req.params.id, req.user!.organizationId!);
      res.status(200).json({ success: true, message: 'Activity deleted' });
    } catch (err) {
      next(err);
    }
  };
}
