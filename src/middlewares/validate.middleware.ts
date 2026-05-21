import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

interface ValidationSchemas {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}

export const validate = (schemas: Joi.ObjectSchema | ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const schemaMap: ValidationSchemas =
      'validate' in schemas ? { body: schemas as Joi.ObjectSchema } : schemas;

    const errors: string[] = [];

    if (schemaMap.body) {
      const { error, value } = schemaMap.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details.map((d) => d.message));
      } else {
        req.body = value;
      }
    }

    if (schemaMap.params) {
      const { error, value } = schemaMap.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details.map((d) => d.message));
      } else {
        req.params = value;
      }
    }

    if (schemaMap.query) {
      const { error, value } = schemaMap.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details.map((d) => d.message));
      } else {
        req.query = value;
      }
    }

    if (errors.length) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.join(', '),
      });
      return;
    }

    next();
  };
};
