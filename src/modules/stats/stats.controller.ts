import { Request, Response, NextFunction } from 'express';
import { StatsService } from './stats.service';

const statsService = new StatsService();

export class StatsController {
  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await statsService.getDashboardStats(req.user!.organizationId!);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
