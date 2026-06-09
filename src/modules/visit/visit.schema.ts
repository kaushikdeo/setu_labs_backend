import Joi from 'joi';

export const createVisitSchema = Joi.object({
  customerId: Joi.string().required(),
  siteId: Joi.string().required(),
  type: Joi.string().valid('validation', 'calibration').required(),
  scheduledDate: Joi.date().required(),
  assignedEngineerId: Joi.string().required(),
  notes: Joi.string().optional().allow(''),
}).unknown(true);

export const updateVisitSchema = Joi.object({
  type: Joi.string().valid('validation', 'calibration').optional(),
  scheduledDate: Joi.date().optional(),
  validationDate: Joi.date().optional(),
  dueDate: Joi.date().optional().allow(null),
  assignedEngineerId: Joi.string().optional(),
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').optional(),
  completedDate: Joi.date().optional(),
  notes: Joi.string().optional().allow(''),
}).unknown(true);

export const startVisitSchema = Joi.object({
  validationDate: Joi.date().required(),
  dueDate: Joi.date().optional(),
}).unknown(true);

const plannedTestSchema = Joi.object({
  instrumentId: Joi.string().required(),
  testTypeId: Joi.string().required(),
});

export const createTaskSchema = Joi.object({
  equipmentId: Joi.string().required(),
  instrumentId: Joi.string().optional().allow(''),
  plannedTests: Joi.array().items(plannedTestSchema).optional(),
  area: Joi.string().optional().allow(''),
  testPerformedBy: Joi.string().optional().allow(''),
  witness: Joi.string().optional().allow(''),
  visualInspection: Joi.string().optional().allow(''),
  testCondition: Joi.string().optional().allow(''),
  observations: Joi.string().optional().allow(''),
  remarks: Joi.string().optional().allow(''),
}).unknown(true);

export const updateTaskSchema = Joi.object({
  equipmentId: Joi.string().optional(),
  instrumentId: Joi.string().optional().allow(''),
  plannedTests: Joi.array().items(plannedTestSchema).optional(),
  area: Joi.string().optional().allow(''),
  testPerformedBy: Joi.string().optional().allow(''),
  witness: Joi.string().optional().allow(''),
  visualInspection: Joi.string().optional().allow(''),
  testCondition: Joi.string().optional().allow(''),
  observations: Joi.string().optional().allow(''),
  remarks: Joi.string().optional().allow(''),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'failed').optional(),
}).unknown(true);

export const startTaskSchema = Joi.object({
  equipmentId: Joi.string().optional(),
  area: Joi.string().optional().allow(''),
  instrumentId: Joi.string().optional().allow(''),
  testPerformedBy: Joi.string().optional().allow(''),
  witness: Joi.string().optional().allow(''),
  visualInspection: Joi.string().optional().allow(''),
}).unknown(true);

export const completeTaskSchema = Joi.object({
  observations: Joi.string().optional().allow(''),
  remarks: Joi.string().optional().allow(''),
}).unknown(true);
