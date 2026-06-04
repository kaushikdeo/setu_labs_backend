import { Request, Response, NextFunction } from 'express';
import { tcTemplateService } from './tc-template.service';
import { TcOpportunityType } from './tc-template.model';

export class TcTemplateController {
  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tcTemplateService.list();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tcTemplateService.getById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getDefault = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tcTemplateService.getDefaultForType(req.params.type as TcOpportunityType);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tcTemplateService.create(req.body, req.user!.id);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tcTemplateService.update(req.params.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await tcTemplateService.remove(req.params.id);
      res.status(200).json({ success: true, message: 'Template deleted' });
    } catch (err) {
      next(err);
    }
  };
}
