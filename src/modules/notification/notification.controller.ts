import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';

export class NotificationController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unreadOnly = req.query.unread === 'true';
      const data = await notificationService.listForUser(req.user!.id, req.user!.organizationId!, unreadOnly);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  markRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await notificationService.markRead(req.params.id, req.user!.id, req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
