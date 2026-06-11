import { Request, Response, NextFunction } from 'express';
import { TestResultService } from './test-result.service';

const service = new TestResultService();

export const getResultsByTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await service.getByTask(req.params.taskId, req.user!.organizationId!);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

export const getResultById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getById(req.params.resultId, req.user!.organizationId!);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const createResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.create(req.params.taskId, req.body, req.user!.id, req.user!.organizationId!);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const recalculateResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.recalculate(req.params.resultId, req.user!.id, req.user!.organizationId!);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const updateResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.update(req.params.resultId, req.body, req.user!.id, req.user!.organizationId!);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
