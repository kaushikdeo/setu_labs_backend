import Joi from 'joi';
import { ActivityType } from './activity.model';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const listActivitiesQuerySchema = Joi.object({
  entityType: Joi.string().valid('lead', 'prospect').required(),
  entityId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'entityId must be a valid id',
  }),
  type: Joi.string().valid(...Object.values(ActivityType)).optional(),
});

export const createActivitySchema = Joi.object({
  entityType: Joi.string().valid('lead', 'prospect').required(),
  entityId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'entityId must be a valid id',
  }),
  type: Joi.string().valid(...Object.values(ActivityType)).required(),
  title: Joi.string().min(1).required(),
  description: Joi.string().optional().allow('', null),
  direction: Joi.string().valid('in', 'out').optional(),
  outcome: Joi.string().valid('positive', 'neutral', 'objection').optional(),
  nextStep: Joi.string().optional().allow('', null),
  occurredAt: Joi.date().optional(),
  metadata: Joi.object().optional(),
});
