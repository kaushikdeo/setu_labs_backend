import Joi from 'joi';

export const createTestResultSchema = Joi.object({
  testTypeId: Joi.string().required(),
  instrumentId: Joi.string().required(),
  readings: Joi.object().required(),
}).unknown(true);
