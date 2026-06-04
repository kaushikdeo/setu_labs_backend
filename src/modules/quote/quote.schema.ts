import Joi from 'joi';
import { QuoteStatus, Uom } from './quote.model';
import { WarrantyPeriod } from '../opportunity/opportunity.model';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const milestoneSchema = Joi.object({
  label: Joi.string().required(),
  percent: Joi.number().min(0).max(100).required(),
  trigger: Joi.string().optional().allow('', null),
});

const lineItemCreateSchema = Joi.object({
  description: Joi.string().min(1).required(),
  hsnCode: Joi.string().optional().allow('', null),
  sacCode: Joi.string().optional().allow('', null),
  quantity: Joi.number().min(0).required(),
  uom: Joi.string()
    .valid(...Object.values(Uom))
    .required(),
  unitRate: Joi.number().min(0).required(),
  discountPct: Joi.number().min(0).max(100).optional(),
  gstRate: Joi.number().min(0).max(100).required(),
  costPrice: Joi.number().min(0).optional(),
  isOptional: Joi.boolean().optional(),
  notes: Joi.string().optional().allow('', null),
});

const lineItemUpdateSchema = Joi.object({
  description: Joi.string().min(1).optional(),
  hsnCode: Joi.string().optional().allow('', null),
  sacCode: Joi.string().optional().allow('', null),
  quantity: Joi.number().min(0).optional(),
  uom: Joi.string()
    .valid(...Object.values(Uom))
    .optional(),
  unitRate: Joi.number().min(0).optional(),
  discountPct: Joi.number().min(0).max(100).optional(),
  gstRate: Joi.number().min(0).max(100).optional(),
  costPrice: Joi.number().min(0).optional().allow(null),
  isOptional: Joi.boolean().optional(),
  notes: Joi.string().optional().allow('', null),
}).min(1);

export const createQuoteSchema = Joi.object({
  opportunityId: Joi.string().pattern(objectIdPattern).required(),
  validityDate: Joi.date().optional(),
  paymentTermsPreset: Joi.string().optional(),
  paymentMilestones: Joi.array().items(milestoneSchema).optional(),
  paymentNotes: Joi.string().optional().allow('', null),
  deliveryTimeline: Joi.string().optional(),
  warrantyPeriod: Joi.string()
    .valid(...Object.values(WarrantyPeriod))
    .optional(),
  scopeOfSupply: Joi.string().optional().allow('', null),
  inclusions: Joi.array().items(Joi.string()).optional(),
  exclusions: Joi.array().items(Joi.string()).optional(),
  specialConditions: Joi.string().optional().allow('', null),
  tcTemplateId: Joi.string().pattern(objectIdPattern).optional().allow('', null),
  notesForReviewer: Joi.string().optional().allow('', null),
  overheadAllocation: Joi.number().min(0).max(100).optional(),
  lineItems: Joi.array().items(lineItemCreateSchema).optional(),
});

export const updateQuoteSchema = Joi.object({
  validityDate: Joi.date().optional(),
  paymentTermsPreset: Joi.string().optional(),
  paymentMilestones: Joi.array().items(milestoneSchema).optional(),
  paymentNotes: Joi.string().optional().allow('', null),
  deliveryTimeline: Joi.string().optional(),
  warrantyPeriod: Joi.string()
    .valid(...Object.values(WarrantyPeriod))
    .optional(),
  scopeOfSupply: Joi.string().optional().allow('', null),
  inclusions: Joi.array().items(Joi.string()).optional(),
  exclusions: Joi.array().items(Joi.string()).optional(),
  specialConditions: Joi.string().optional().allow('', null),
  tcTemplateId: Joi.string().pattern(objectIdPattern).optional().allow('', null),
  notesForReviewer: Joi.string().optional().allow('', null),
  overheadAllocation: Joi.number().min(0).max(100).optional(),
  tdsDeduction: Joi.number().min(0).optional(),
}).min(1);

export const addLineItemSchema = lineItemCreateSchema;
export const updateLineItemSchema = lineItemUpdateSchema;
export const reorderLineItemsSchema = Joi.object({
  orderedIds: Joi.array().items(Joi.string()).min(1).required(),
});

export const submitForReviewSchema = Joi.object({
  note: Joi.string().optional().allow('', null),
});

export const reviewActionSchema = Joi.object({
  approve: Joi.boolean().required(),
  comments: Joi.string().optional().allow('', null),
});

export const sendQuoteSchema = Joi.object({
  to: Joi.array()
    .items(Joi.string().email({ tlds: { allow: false } }))
    .min(1)
    .required(),
  cc: Joi.array()
    .items(Joi.string().email({ tlds: { allow: false } }))
    .optional(),
  bcc: Joi.array()
    .items(Joi.string().email({ tlds: { allow: false } }))
    .optional(),
  subject: Joi.string().min(1).required(),
  body: Joi.string().min(1).required(),
});

export const acceptQuoteSchema = Joi.object({
  customerPoNumber: Joi.string().optional().allow('', null),
});

export const rejectQuoteSchema = Joi.object({
  reason: Joi.string().min(1).required(),
});

export const listQuotesQuerySchema = Joi.object({
  opportunityId: Joi.string().pattern(objectIdPattern).optional(),
  status: Joi.string()
    .valid(...Object.values(QuoteStatus))
    .optional()
    .allow(''),
  ownerUserId: Joi.string().pattern(objectIdPattern).optional(),
}).unknown(true);
