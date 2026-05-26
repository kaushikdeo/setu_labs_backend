import Joi from 'joi';

export const createTestResultSchema = Joi.object({
  testTypeId: Joi.string().required(),
  instrumentId: Joi.string().required(),
  testPerformedBy: Joi.string().optional().allow(''),
  witness: Joi.string().optional().allow(''),
  visualInspection: Joi.string().optional().allow(''),
  readings: Joi.object().required(),
}).unknown(true);
