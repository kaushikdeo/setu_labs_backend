import Joi from 'joi';

export const createTestTypeSchema = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().optional().allow(''),
  category: Joi.string().valid('validation', 'calibration').required(),
  requiredInstrumentType: Joi.string().required(),
  applicableEquipmentTypes: Joi.array().items(Joi.string()).min(1).required(),
  isActive: Joi.boolean().optional(),
}).unknown(true);

export const updateTestTypeSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional().allow(''),
  category: Joi.string().valid('validation', 'calibration').optional(),
  requiredInstrumentType: Joi.string().optional(),
  applicableEquipmentTypes: Joi.array().items(Joi.string()).min(1).optional(),
  isActive: Joi.boolean().optional(),
}).unknown(true);
