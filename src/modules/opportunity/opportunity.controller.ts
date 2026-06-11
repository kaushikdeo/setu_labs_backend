import { Request, Response, NextFunction } from 'express';
import { ListOpportunitiesFilters, opportunityService } from './opportunity.service';
import { OpportunityStage, OpportunityStatus, OpportunityType } from './opportunity.model';
import { followUpService } from '../follow-up/follow-up.service';
import { ActivityType } from '../activity/activity.model';

function parseFilters(query: Request['query']): ListOpportunitiesFilters {
  const f: ListOpportunitiesFilters = {};
  if (typeof query.q === 'string') f.q = query.q;
  if (typeof query.stage === 'string' && query.stage) f.stage = query.stage as OpportunityStage;
  if (typeof query.status === 'string' && query.status)
    f.status = query.status as OpportunityStatus;
  if (typeof query.type === 'string' && query.type) f.type = query.type as OpportunityType;
  if (typeof query.assignedUserId === 'string' && query.assignedUserId) {
    f.assignedUserId = query.assignedUserId;
  }
  if (typeof query.deadlineFrom === 'string' && query.deadlineFrom)
    f.deadlineFrom = query.deadlineFrom;
  if (typeof query.deadlineTo === 'string' && query.deadlineTo) f.deadlineTo = query.deadlineTo;
  if (typeof query.scope === 'string') f.scope = query.scope as ListOpportunitiesFilters['scope'];
  if (typeof query.sort === 'string') f.sort = query.sort;
  if (query.page !== undefined) f.page = Number(query.page);
  if (query.limit !== undefined) f.limit = Number(query.limit);
  return f;
}

export class OpportunityController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await opportunityService.list(
        parseFilters(req.query),
        req.user!.id,
        req.user!.organizationId!,
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  stats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await opportunityService.stats(req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  kanban = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await opportunityService.kanban(
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
      const data = await opportunityService.forecast(req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  stale = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await opportunityService.staleList(req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  winLoss = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await opportunityService.winLoss(req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await opportunityService.getById(req.params.id, req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getByProspectId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await opportunityService.findByProspectId(
        req.params.prospectId,
        req.user!.organizationId!,
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  convertFromProspect = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await opportunityService.convertFromProspect(
        req.params.prospectId,
        req.body,
        req.user!.id,
        req.user!.organizationId!,
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  createStandalone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await opportunityService.createStandalone(
        req.body,
        req.user!.id,
        req.user!.organizationId!,
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await opportunityService.update(
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
      const data = await opportunityService.changeStage(
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
      const data = await opportunityService.markWon(
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
      const data = await opportunityService.markLost(
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
      const data = await opportunityService.putOnHold(
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
      const data = await opportunityService.resume(
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
      const data = await opportunityService.snooze(
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
      await opportunityService.remove(req.params.id, req.user!.id, req.user!.organizationId!);
      res.status(200).json({ success: true, message: 'Opportunity deleted' });
    } catch (err) {
      next(err);
    }
  };

  clearFollowUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await followUpService.clearFollowUp(
        'opportunity',
        req.params.id,
        req.user!.organizationId!,
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  completeFollowUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doneAsMap: Record<string, ActivityType> = {
        call: ActivityType.CALL,
        email: ActivityType.EMAIL,
        whatsapp: ActivityType.WHATSAPP,
        site_visit: ActivityType.SITE_VISIT,
        demo: ActivityType.DEMO,
        note: ActivityType.NOTE,
      };
      const doneAs = doneAsMap[req.body.doneAs as string] ?? ActivityType.NOTE;
      const data = await followUpService.completeFollowUp(
        'opportunity',
        req.params.id,
        { ...req.body, doneAs },
        req.user!.id,
        req.user!.organizationId!,
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
