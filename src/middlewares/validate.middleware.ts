import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

interface ValidationSchemas {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}

type FieldLocation = 'body' | 'params' | 'query';

interface FieldError {
  field: string;
  location: FieldLocation;
  message: string;
  type?: string;
}

function collect(error: Joi.ValidationError | undefined, location: FieldLocation): FieldError[] {
  if (!error) return [];
  return error.details.map((d) => ({
    field: d.path.length ? d.path.join('.') : (d.context?.key as string | undefined) ?? '',
    location,
    message: d.message,
    type: d.type,
  }));
}

export const validate = (schemas: Joi.ObjectSchema | ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const schemaMap: ValidationSchemas =
      'validate' in schemas ? { body: schemas as Joi.ObjectSchema } : schemas;

    const errors: FieldError[] = [];

    if (schemaMap.body) {
      const { error, value } = schemaMap.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) errors.push(...collect(error, 'body'));
      else req.body = value;
    }

    if (schemaMap.params) {
      const { error, value } = schemaMap.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) errors.push(...collect(error, 'params'));
      else req.params = value;
    }

    if (schemaMap.query) {
      const { error, value } = schemaMap.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) errors.push(...collect(error, 'query'));
      else req.query = value;
    }

    if (errors.length) {
      const summary = errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      res.status(400).json({
        success: false,
        message: `Validation failed: ${summary}`,
        errors,
      });
      return;
    }

    next();
  };
};
