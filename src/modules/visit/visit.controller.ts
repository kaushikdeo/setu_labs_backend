import { Request, Response, NextFunction } from 'express';
import { VisitService } from './visit.service';
import { auditService } from '../audit/audit.service';

const visitService = new VisitService();

export class VisitController {
  getAllVisits = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const visits = await visitService.getAllVisits(req.query);
      res.status(200).json({ success: true, data: visits });
    } catch (error) {
      next(error);
    }
  };

  getVisitById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const visit = await visitService.getVisitById(req.params.id);
      const tasks = await visitService.getTasksByVisit(req.params.id);
      res.status(200).json({ success: true, data: { ...visit, tasks } });
    } catch (error) {
      next(error);
    }
  };

  createVisit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const visit = await visitService.createVisit(req.body, req.user!.id);
      await auditService.logEvent('visit.create', req, req.user!.id, {
        visitId: visit._id,
        code: visit.code,
      });
      res.status(201).json({ success: true, data: visit });
    } catch (error) {
      next(error);
    }
  };

  updateVisit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const visit = await visitService.updateVisit(req.params.id, req.body, req.user!.id);
      await auditService.logEvent('visit.update', req, req.user!.id, {
        visitId: req.params.id,
        updatedFields: Object.keys(req.body),
      });
      res.status(200).json({ success: true, data: visit });
    } catch (error) {
      next(error);
    }
  };

  deleteVisit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await visitService.deleteVisit(req.params.id, req.user!.id);
      await auditService.logEvent('visit.delete', req, req.user!.id, {
        visitId: req.params.id,
      });
      res.status(200).json({ success: true, message: 'Service request deleted' });
    } catch (error) {
      next(error);
    }
  };

  getTasksByVisit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tasks = await visitService.getTasksByVisit(req.params.id);
      res.status(200).json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  };

  addTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await visitService.addTask(req.params.id, req.body, req.user!.id);
      res.status(201).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  };

  updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await visitService.updateTask(req.params.id, req.params.taskId, req.body, req.user!.id);
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  };

  startVisit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const visit = await visitService.startVisit(
        req.params.id,
        req.body.validationDate,
        req.user!.id,
        req.body.dueDate,
      );
      await auditService.logEvent('visit.start', req, req.user!.id, {
        visitId: req.params.id,
        validationDate: visit.validationDate,
        dueDate: visit.dueDate,
      });
      res.status(200).json({ success: true, data: visit });
    } catch (error) {
      next(error);
    }
  };

  startTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await visitService.startTask(req.params.id, req.params.taskId, req.body, req.user!.id);
      await auditService.logEvent('visit.task.start', req, req.user!.id, {
        visitId: req.params.id,
        taskId: req.params.taskId,
      });
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  };

  completeTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await visitService.completeTask(req.params.id, req.params.taskId, req.body, req.user!.id);
      await auditService.logEvent('visit.task.complete', req, req.user!.id, {
        visitId: req.params.id,
        taskId: req.params.taskId,
      });
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  };
}
