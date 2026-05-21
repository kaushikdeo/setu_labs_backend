import Joi from 'joi';
import { UserRole } from './user.model';

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).required(),
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
});

export const getUserSchema = Joi.object({
  id: Joi.string().required(),
});

export const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid(...Object.values(UserRole)).required(),
});

export const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});
