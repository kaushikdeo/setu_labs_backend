import Joi from 'joi';
import { FollowUpMode } from '../lead/lead.model';

const completionTypes = ['call', 'email', 'whatsapp', 'site_visit', 'demo', 'note'];

export const completeFollowUpSchema = Joi.object({
  doneAs: Joi.string().valid(...completionTypes).required(),
  title: Joi.string().min(1).required(),
  note: Joi.string().optional().allow('', null),
  reschedule: Joi.object({
    occurredAt: Joi.date().greater('now').required().messages({
      'date.greater': 'Reschedule date must be in the future',
    }),
    mode: Joi.string().valid(...Object.values(FollowUpMode)).required(),
    note: Joi.string().optional().allow('', null),
  }).optional(),
});

export const followUpsQuerySchema = Joi.object({
  entityType: Joi.string().valid('all', 'lead', 'prospect', 'opportunity').optional(),
  scope: Joi.string().valid('mine', 'all').optional(),
});

export const completedFollowUpsQuerySchema = Joi.object({
  entityType: Joi.string().valid('all', 'lead', 'prospect', 'opportunity').optional(),
  days: Joi.number().integer().min(1).max(180).optional(),
  scope: Joi.string().valid('mine', 'all').optional(),
});

export const entityTypeParamSchema = Joi.object({
  entityType: Joi.string().valid('lead', 'prospect', 'opportunity').required(),
  id: Joi.string().hex().length(24).required(),
});
