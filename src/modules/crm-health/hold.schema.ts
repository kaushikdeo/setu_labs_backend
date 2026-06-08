import Joi from 'joi';
import { FollowUpMode } from '../lead/lead.model';
import { HoldReason } from './hold.types';

export const putOnHoldSchema = Joi.object({
  holdReason: Joi.string().valid(...Object.values(HoldReason)).required(),
  holdUntil: Joi.date().optional().allow('', null),
  holdNotes: Joi.string().optional().allow('', null),
});

export const resumeSchema = Joi.object({
  note: Joi.string().optional().allow('', null),
  followUpDate: Joi.date().optional().allow('', null),
  followUpMode: Joi.string().valid(...Object.values(FollowUpMode)).optional().allow('', null),
});

export const snoozeSchema = Joi.object({
  days: Joi.number().integer().min(1).max(90).required(),
});
