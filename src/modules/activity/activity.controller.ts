import { Request, Response, NextFunction } from 'express';
import { activityService } from './activity.service';
import { ActivityEntityType, ActivityType } from './activity.model';
import { prospectService } from '../prospect/prospect.service';

export class ActivityController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entityType = req.query.entityType as ActivityEntityType;
      const entityId = req.query.entityId as string;
      const type = (req.query.type as ActivityType | undefined) || undefined;
      const data = await activityService.list(entityType, entityId, type);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const activity = await activityService.add(req.body, userId);

      if (
        activity.entityType === 'prospect' &&
        activity.type === ActivityType.FOLLOW_UP
      ) {
        const meta = activity.metadata as Record<string, unknown> | undefined;
        const mode = typeof meta?.mode === 'string' ? (meta.mode as string) : undefined;
        await prospectService.syncFollowUpFromActivity(
          activity.entityId.toString(),
          activity.occurredAt,
          mode,
        );
      } else if (activity.entityType === 'prospect') {
        await prospectService.touchLastActivity(activity.entityId.toString());
      }

      res.status(201).json({ success: true, data: activity });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await activityService.remove(req.params.id);
      res.status(200).json({ success: true, message: 'Activity deleted' });
    } catch (err) {
      next(err);
    }
  };
}
