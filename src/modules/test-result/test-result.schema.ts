import Joi from 'joi';

const environmentalConditionsSchema = Joi.object({
  temperatureStart: Joi.number().optional().allow(null),
  temperatureEnd: Joi.number().optional().allow(null),
  humidityStart: Joi.number().min(0).max(100).optional().allow(null),
  humidityEnd: Joi.number().min(0).max(100).optional().allow(null),
  pressureStart: Joi.number().optional().allow(null),
  pressureEnd: Joi.number().optional().allow(null),
  remarks: Joi.string().allow('').optional(),
}).optional();

export const createTestResultSchema = Joi.object({
  testTypeId: Joi.string().required(),
  instrumentId: Joi.string().required(),
  testPerformedBy: Joi.string().optional().allow(''),
  witness: Joi.string().optional().allow(''),
  visualInspection: Joi.string().optional().allow(''),
  environmentalConditions: environmentalConditionsSchema,
  readings: Joi.object().required(),
}).unknown(true);

export const updateTestResultSchema = Joi.object({
  testPerformedBy: Joi.string().optional().allow(''),
  witness: Joi.string().optional().allow(''),
  visualInspection: Joi.string().optional().allow(''),
  environmentalConditions: environmentalConditionsSchema,
  readings: Joi.object().required(),
}).unknown(true);
