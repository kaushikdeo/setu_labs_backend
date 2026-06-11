import { Request, Response, NextFunction } from 'express';
import { ListProspectsFilters, prospectService } from './prospect.service';
import { PipelineStage, ProspectStatus } from './prospect.model';

function parseFilters(query: Request['query']): ListProspectsFilters {
  const f: ListProspectsFilters = {};
  if (typeof query.q === 'string') f.q = query.q;
  if (typeof query.stage === 'string' && query.stage) f.stage = query.stage as PipelineStage;
  if (typeof query.status === 'string' && query.status) f.status = query.status as ProspectStatus;
  if (typeof query.temperature === 'string' && query.temperature) f.temperature = query.temperature;
  if (typeof query.assignedUserId === 'string' && query.assignedUserId) f.assignedUserId = query.assignedUserId;
  if (typeof query.closeFrom === 'string' && query.closeFrom) f.closeFrom = query.closeFrom;
  if (typeof query.closeTo === 'string' && query.closeTo) f.closeTo = query.closeTo;
  if (typeof query.scope === 'string') f.scope = query.scope as ListProspectsFilters['scope'];
  if (typeof query.sort === 'string') f.sort = query.sort;
  if (query.page !== undefined) f.page = Number(query.page);
  if (query.limit !== undefined) f.limit = Number(query.limit);
  return f;
}

export class ProspectController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await prospectService.list(
        parseFilters(req.query),
        req.user!.id,
        req.user!.organizationId!,
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  stats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prospectService.stats(req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  kanban = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prospectService.kanban(
        parseFilters(req.query),
        req.user!.id,
        req.user!.organizationId!,
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  forecast = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prospectService.forecast(req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  followUps = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prospectService.followUps(req.user!.id, req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prospectService.getById(req.params.id, req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getByLeadId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prospectService.findByLeadId(req.params.leadId, req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  convert = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prospect = await prospectService.convertLead(
        req.params.leadId,
        req.body,
        req.user!.id,
        req.user!.organizationId!,
      );
      res.status(201).json({ success: true, data: prospect });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prospectService.update(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.organizationId!,
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  changeStage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prospectService.changeStage(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.organizationId!,
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  markWon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prospectService.markWon(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.organizationId!,
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  markLost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prospectService.markLost(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.organizationId!,
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  putOnHold = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prospectService.putOnHold(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.organizationId!,
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  resume = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prospectService.resume(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.organizationId!,
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  snooze = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prospectService.snooze(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.organizationId!,
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prospectService.remove(req.params.id, req.user!.id, req.user!.organizationId!);
      res.status(200).json({ success: true, message: 'Prospect deleted' });
    } catch (err) {
      next(err);
    }
  };

  clearFollowUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prospectService.clearFollowUp(req.params.id, req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  completeFollowUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prospectService.completeFollowUp(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.organizationId!,
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  completedFollowUps = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = req.query.days ? Number(req.query.days) : 30;
      const scope = (req.query.scope as 'mine' | 'all' | undefined) ?? 'all';
      const data = await prospectService.listCompletedFollowUps(
        days,
        req.user!.id,
        req.user!.organizationId!,
        scope,
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
