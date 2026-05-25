import { Request, Response, NextFunction } from 'express';
import { TestTypeService } from './test-type.service';
import { createTestTypeSchema, updateTestTypeSchema } from './test-type.schema';
import { AppError } from '../../utils/app-error';

const service = new TestTypeService();

export const getAllTestTypes = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const testTypes = await service.getAllIncludingInactive();
    res.json({ success: true, data: testTypes });
  } catch (err) {
    next(err);
  }
};

export const getTestTypeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testType = await service.getById(req.params.id);
    res.json({ success: true, data: testType });
  } catch (err) {
    next(err);
  }
};

export const createTestType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = createTestTypeSchema.validate(req.body);
    if (error) throw new AppError(400, error.details[0].message);
    const testType = await service.create(value);
    res.status(201).json({ success: true, data: testType });
  } catch (err) {
    next(err);
  }
};

export const updateTestType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = updateTestTypeSchema.validate(req.body);
    if (error) throw new AppError(400, error.details[0].message);
    const testType = await service.update(req.params.id, value);
    res.json({ success: true, data: testType });
  } catch (err) {
    next(err);
  }
};

export const deactivateTestType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deactivate(req.params.id);
    res.json({ success: true, message: 'Test type deactivated' });
  } catch (err) {
    next(err);
  }
};
