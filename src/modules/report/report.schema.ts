import Joi from 'joi';

export const createReportSchema = Joi.object({
  visitId: Joi.string().required(),
});

export const submitReportSchema = Joi.object({
  comment: Joi.string().optional().allow(''),
});

export const rejectReportSchema = Joi.object({
  comment: Joi.string().required().messages({ 'any.required': 'A comment is required when rejecting' }),
});

export const approveReportSchema = Joi.object({
  comment: Joi.string().optional().allow(''),
});

export const requestChangesSchema = Joi.object({
  comment: Joi.string().required().messages({ 'any.required': 'A comment is required when requesting changes' }),
});
