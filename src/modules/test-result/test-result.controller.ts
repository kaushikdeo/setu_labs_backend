import { Request, Response, NextFunction } from 'express';
import { TestResultService } from './test-result.service';

const service = new TestResultService();

export const getResultsByTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await service.getByTask(req.params.taskId);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

export const getResultById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getById(req.params.resultId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const createResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.create(req.params.taskId, req.body, (req as any).user.id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const recalculateResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.recalculate(req.params.resultId, (req as any).user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const updateResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.update(req.params.resultId, req.body, (req as any).user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
