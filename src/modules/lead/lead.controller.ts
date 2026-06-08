import { Request, Response, NextFunction } from 'express';
import { leadService, ListLeadsFilters } from './lead.service';
import { leadImportService } from './lead-import.service';
import { importDefaultsSchema } from './lead.schema';
import { followUpService } from '../follow-up/follow-up.service';
import { ActivityType } from '../activity/activity.model';

function parseFilters(query: Request['query']): ListLeadsFilters {
  const f: ListLeadsFilters = {};
  if (typeof query.q === 'string') f.q = query.q;
  if (typeof query.temperature === 'string' && query.temperature) f.temperature = query.temperature;
  if (typeof query.source === 'string' && query.source) f.source = query.source;
  if (typeof query.status === 'string' && query.status) f.status = query.status;
  if (typeof query.priority === 'string' && query.priority) f.priority = query.priority;
  if (typeof query.assignedUserId === 'string' && query.assignedUserId) f.assignedUserId = query.assignedUserId;
  if (typeof query.followUpFrom === 'string' && query.followUpFrom) f.followUpFrom = query.followUpFrom;
  if (typeof query.followUpTo === 'string' && query.followUpTo) f.followUpTo = query.followUpTo;
  if (typeof query.scope === 'string') f.scope = query.scope as ListLeadsFilters['scope'];
  if (typeof query.sort === 'string') f.sort = query.sort;
  if (typeof query.segmentId === 'string' && query.segmentId) f.segmentId = query.segmentId;
  if (typeof query.tags === 'string' && query.tags) f.tags = query.tags;
  else if (Array.isArray(query.tags)) f.tags = query.tags.filter((t): t is string => typeof t === 'string');
  if (query.page !== undefined) f.page = Number(query.page);
  if (query.limit !== undefined) f.limit = Number(query.limit);
  return f;
}

export class LeadController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = parseFilters(req.query);
      const result = await leadService.list(filters, req.user!.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await leadService.getById(req.params.id);
      res.status(200).json({ success: true, data: lead });
    } catch (error) {
      next(error);
    }
  };

  stats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await leadService.stats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await leadService.create(req.body, req.user!.id);
      res.status(201).json({ success: true, data: lead });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await leadService.update(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data: lead });
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await leadService.remove(req.params.id, req.user!.id);
      res.status(200).json({ success: true, message: 'Lead deleted' });
    } catch (error) {
      next(error);
    }
  };

  listSegments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const segments = await leadService.listSegments(req.user!.id);
      res.status(200).json({ success: true, data: segments });
    } catch (error) {
      next(error);
    }
  };

  createSegment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const segment = await leadService.createSegment(req.body, req.user!.id);
      res.status(201).json({ success: true, data: segment });
    } catch (error) {
      next(error);
    }
  };

  updateSegment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const segment = await leadService.updateSegment(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data: segment });
    } catch (error) {
      next(error);
    }
  };

  removeSegment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await leadService.removeSegment(req.params.id, req.user!.id);
      res.status(200).json({ success: true, message: 'Segment deleted' });
    } catch (error) {
      next(error);
    }
  };

  importTemplate = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const buffer = leadImportService.buildTemplateBuffer();
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename="leads-import-template.xlsx"');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  validateImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file?.buffer) {
        res.status(400).json({ success: false, message: 'Excel file is required' });
        return;
      }
      let defaultsRaw: unknown = req.body.defaults;
      if (typeof defaultsRaw === 'string') {
        defaultsRaw = JSON.parse(defaultsRaw);
      }
      const { error, value: defaults } = importDefaultsSchema.validate(defaultsRaw);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0]?.message ?? 'Invalid defaults' });
        return;
      }
      const result = await leadImportService.validate(req.file.buffer, defaults);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  commitImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await leadImportService.commit(req.body.importId, req.user!.id);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  clearFollowUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await followUpService.clearFollowUp('lead', req.params.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  putOnHold = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await leadService.putOnHold(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  resume = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await leadService.resume(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  snooze = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await leadService.snooze(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
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
        'lead',
        req.params.id,
        { ...req.body, doneAs },
        req.user!.id,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
