import Joi from 'joi';
import {
  BudgetStatus,
  DecisionTimeline,
  FollowUpMode,
  LeadIndustry,
  LeadPriority,
  LeadProductInterest,
  LeadSource,
  LeadStatus,
  LeadTemperature,
} from './lead.model';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const createLeadSchema = Joi.object({
  firstName: Joi.string().min(1).required(),
  lastName: Joi.string().min(1).required(),
  mobile: Joi.string().min(6).required(),
  email: Joi.string().email({ tlds: { allow: false } }).optional().allow('', null),
  company: Joi.string().optional().allow('', null),
  designation: Joi.string().optional().allow('', null),
  department: Joi.string().optional().allow('', null),
  city: Joi.string().optional().allow('', null),
  state: Joi.string().optional().allow('', null),
  source: Joi.string().valid(...Object.values(LeadSource)).required(),
  campaign: Joi.string().optional().allow('', null),
  referredBy: Joi.string().optional().allow('', null),
  productInterest: Joi.string().valid(...Object.values(LeadProductInterest)).optional().allow('', null),
  estimatedValue: Joi.number().min(0).optional().allow(null),
  expectedCloseDate: Joi.date().optional().allow('', null),
  industry: Joi.string().valid(...Object.values(LeadIndustry)).optional().allow('', null),
  decisionTimeline: Joi.string().valid(...Object.values(DecisionTimeline)).optional().allow('', null),
  budgetStatus: Joi.string().valid(...Object.values(BudgetStatus)).optional().allow('', null),
  temperature: Joi.string().valid(...Object.values(LeadTemperature)).required(),
  tags: Joi.array().items(Joi.string()).optional(),
  assignedUserId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'assignedUserId must be a valid user id',
  }),
  followUpDate: Joi.date().optional().allow('', null),
  followUpMode: Joi.string().valid(...Object.values(FollowUpMode)).optional().allow('', null),
  priority: Joi.string().valid(...Object.values(LeadPriority)).optional(),
  notes: Joi.string().optional().allow('', null),
}).unknown(true);

export const updateLeadSchema = Joi.object({
  firstName: Joi.string().min(1).optional(),
  lastName: Joi.string().min(1).optional(),
  mobile: Joi.string().min(6).optional(),
  email: Joi.string().email({ tlds: { allow: false } }).optional().allow('', null),
  company: Joi.string().optional().allow('', null),
  designation: Joi.string().optional().allow('', null),
  department: Joi.string().optional().allow('', null),
  city: Joi.string().optional().allow('', null),
  state: Joi.string().optional().allow('', null),
  source: Joi.string().valid(...Object.values(LeadSource)).optional(),
  campaign: Joi.string().optional().allow('', null),
  referredBy: Joi.string().optional().allow('', null),
  productInterest: Joi.string().valid(...Object.values(LeadProductInterest)).optional().allow('', null),
  estimatedValue: Joi.number().min(0).optional().allow(null),
  expectedCloseDate: Joi.date().optional().allow('', null),
  industry: Joi.string().valid(...Object.values(LeadIndustry)).optional().allow('', null),
  decisionTimeline: Joi.string().valid(...Object.values(DecisionTimeline)).optional().allow('', null),
  budgetStatus: Joi.string().valid(...Object.values(BudgetStatus)).optional().allow('', null),
  temperature: Joi.string().valid(...Object.values(LeadTemperature)).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  assignedUserId: Joi.string().pattern(objectIdPattern).optional(),
  followUpDate: Joi.date().optional().allow('', null),
  followUpMode: Joi.string().valid(...Object.values(FollowUpMode)).optional().allow('', null),
  priority: Joi.string().valid(...Object.values(LeadPriority)).optional(),
  notes: Joi.string().optional().allow('', null),
  status: Joi.string().valid(...Object.values(LeadStatus)).optional(),
}).unknown(true);

export const listLeadsQuerySchema = Joi.object({
  q: Joi.string().optional().allow(''),
  temperature: Joi.string().valid(...Object.values(LeadTemperature)).optional().allow(''),
  source: Joi.string().valid(...Object.values(LeadSource)).optional().allow(''),
  status: Joi.string().valid(...Object.values(LeadStatus)).optional().allow(''),
  priority: Joi.string().valid(...Object.values(LeadPriority)).optional().allow(''),
  assignedUserId: Joi.string().pattern(objectIdPattern).optional().allow(''),
  followUpFrom: Joi.date().optional().allow(''),
  followUpTo: Joi.date().optional().allow(''),
  scope: Joi.string().valid('all', 'hot', 'stale', 'mine').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string().valid('created_desc', 'value_desc', 'temperature', 'follow_up_asc', 'assignee').optional(),
  segmentId: Joi.string().pattern(objectIdPattern).optional().allow(''),
  tags: Joi.alternatives()
    .try(Joi.string().allow(''), Joi.array().items(Joi.string()))
    .optional(),
}).unknown(true);

export const createSegmentSchema = Joi.object({
  name: Joi.string().min(1).required(),
  filters: Joi.object().required(),
  isShared: Joi.boolean().optional(),
});

export const updateSegmentSchema = Joi.object({
  name: Joi.string().min(1).optional(),
  filters: Joi.object().optional(),
  isShared: Joi.boolean().optional(),
});
