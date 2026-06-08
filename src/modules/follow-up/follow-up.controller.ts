import { Request, Response, NextFunction } from 'express';
import { followUpService, FollowUpEntityFilter, FollowUpEntityType } from './follow-up.service';
import { ActivityType } from '../activity/activity.model';

const DONE_AS_MAP: Record<string, ActivityType> = {
  call: ActivityType.CALL,
  email: ActivityType.EMAIL,
  whatsapp: ActivityType.WHATSAPP,
  site_visit: ActivityType.SITE_VISIT,
  demo: ActivityType.DEMO,
  note: ActivityType.NOTE,
};

export class FollowUpController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entityType = ((req.query.entityType as string) ?? 'all') as FollowUpEntityFilter;
      const scope = (req.query.scope as 'mine' | 'all' | undefined) ?? 'all';
      const data = await followUpService.listOpen(entityType, req.user!.id, scope);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  completed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entityType = ((req.query.entityType as string) ?? 'all') as FollowUpEntityFilter;
      const days = req.query.days ? Number(req.query.days) : 30;
      const scope = (req.query.scope as 'mine' | 'all' | undefined) ?? 'all';
      const data = await followUpService.listCompleted(entityType, days, req.user!.id, scope);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  complete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entityType = req.params.entityType as FollowUpEntityType;
      const doneAs = DONE_AS_MAP[req.body.doneAs as string] ?? ActivityType.NOTE;
      const data = await followUpService.completeFollowUp(
        entityType,
        req.params.id,
        { ...req.body, doneAs },
        req.user!.id,
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  clear = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entityType = req.params.entityType as FollowUpEntityType;
      const data = await followUpService.clearFollowUp(entityType, req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
