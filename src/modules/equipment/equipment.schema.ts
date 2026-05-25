import Joi from 'joi';
import { EquipmentStatus } from './equipment.model';

export const createEquipmentSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().optional(),
  equipmentType: Joi.string().valid('equipment', 'area').default('equipment'),
  serialNumber: Joi.when('equipmentType', {
    is: 'area',
    then: Joi.string().allow('', null).optional(),
    otherwise: Joi.string().required().messages({ 'any.required': 'Serial number is required' }),
  }),
  make: Joi.when('equipmentType', {
    is: 'area',
    then: Joi.string().allow('', null).optional(),
    otherwise: Joi.string().required().messages({ 'any.required': 'Make is required' }),
  }),
  model: Joi.when('equipmentType', {
    is: 'area',
    then: Joi.string().allow('', null).optional(),
    otherwise: Joi.string().required().messages({ 'any.required': 'Model is required' }),
  }),
  validationFrequencyDays: Joi.number().default(365),
  calibrationFrequencyDays: Joi.number().default(365),
  status: Joi.string().valid(...Object.values(EquipmentStatus)).default(EquipmentStatus.ACTIVE),
  notes: Joi.string().allow('', null).optional(),
}).unknown(true);

export const updateEquipmentSchema = createEquipmentSchema.fork(
  Object.keys(createEquipmentSchema.describe().keys),
  (schema) => schema.optional()
);
