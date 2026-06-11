import { Request, Response, NextFunction } from 'express';
import { tcTemplateService } from './tc-template.service';
import { TcOpportunityType } from './tc-template.model';

export class TcTemplateController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tcTemplateService.list(req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tcTemplateService.getById(req.params.id, req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getDefault = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tcTemplateService.getDefaultForType(req.params.type as TcOpportunityType, req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tcTemplateService.create(req.body, req.user!.id, req.user!.organizationId!);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tcTemplateService.update(req.params.id, req.body, req.user!.organizationId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await tcTemplateService.remove(req.params.id, req.user!.organizationId!);
      res.status(200).json({ success: true, message: 'Template deleted' });
    } catch (err) {
      next(err);
    }
  };
}
