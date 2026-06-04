import Joi from 'joi';
import { TcOpportunityType } from './tc-template.model';

export const createTcTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  opportunityType: Joi.string()
    .valid(...Object.values(TcOpportunityType))
    .required(),
  body: Joi.string().min(1).required(),
  isDefault: Joi.boolean().optional(),
});

export const updateTcTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  opportunityType: Joi.string()
    .valid(...Object.values(TcOpportunityType))
    .optional(),
  body: Joi.string().min(1).optional(),
  isDefault: Joi.boolean().optional(),
}).min(1);
