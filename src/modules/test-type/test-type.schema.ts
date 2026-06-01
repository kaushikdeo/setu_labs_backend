import Joi from 'joi';

export const createTestTypeSchema = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  abbreviation: Joi.string().max(6).allow('', null).optional(),
  description: Joi.string().optional().allow(''),
  category: Joi.string().valid('validation', 'calibration').required(),
  requiredInstrumentType: Joi.string().optional().allow(''),
  applicableEquipmentTypes: Joi.array().items(Joi.string()).min(0).optional(),
  isActive: Joi.boolean().optional(),
}).unknown(true);

export const updateTestTypeSchema = Joi.object({
  name: Joi.string().optional(),
  abbreviation: Joi.string().max(6).allow('', null).optional(),
  description: Joi.string().optional().allow(''),
  category: Joi.string().valid('validation', 'calibration').optional(),
  requiredInstrumentType: Joi.string().optional(),
  applicableEquipmentTypes: Joi.array().items(Joi.string()).min(1).optional(),
  isActive: Joi.boolean().optional(),
}).unknown(true);
