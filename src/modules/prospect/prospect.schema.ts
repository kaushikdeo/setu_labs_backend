import Joi from 'joi';
import {
  AuthorityType,
  DecisionMakerCount,
  LostReason,
  PipelineStage,
  ProspectStatus,
} from './prospect.model';
import {
  BudgetStatus,
  DecisionTimeline,
  FollowUpMode,
  LeadIndustry,
  LeadProductInterest,
  LeadTemperature,
} from '../lead/lead.model';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const convertLeadSchema = Joi.object({
  dealValue: Joi.number().min(1).required(),
  expectedCloseDate: Joi.date().required(),
  stage: Joi.string().valid(...Object.values(PipelineStage)).required(),
  winProbability: Joi.number().integer().min(0).max(100).optional(),
  budgetStatus: Joi.string().valid(...Object.values(BudgetStatus)).required(),
  authorityType: Joi.string().valid(...Object.values(AuthorityType)).required(),
  confirmedNeed: Joi.string().min(1).required(),
  decisionTimeline: Joi.string().valid(...Object.values(DecisionTimeline)).required(),
  decisionMakerCount: Joi.string().valid(...Object.values(DecisionMakerCount)).optional().allow('', null),
  competitors: Joi.array().items(Joi.string()).optional(),
  qualificationNotes: Joi.string().optional().allow('', null),
  assignedUserId: Joi.string().pattern(objectIdPattern).optional().messages({
    'string.pattern.base': 'assignedUserId must be a valid user id',
  }),
});

export const updateProspectSchema = Joi.object({
  firstName: Joi.string().min(1).optional(),
  lastName: Joi.string().min(1).optional(),
  mobile: Joi.string().min(6).optional(),
  email: Joi.string().email({ tlds: { allow: false } }).optional().allow('', null),
  company: Joi.string().optional().allow('', null),
  designation: Joi.string().optional().allow('', null),
  city: Joi.string().optional().allow('', null),
  state: Joi.string().optional().allow('', null),
  productInterest: Joi.string().valid(...Object.values(LeadProductInterest)).optional().allow('', null),
  industry: Joi.string().valid(...Object.values(LeadIndustry)).optional().allow('', null),
  temperature: Joi.string().valid(...Object.values(LeadTemperature)).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  assignedUserId: Joi.string().pattern(objectIdPattern).optional(),
  dealValue: Joi.number().min(0).optional(),
  expectedCloseDate: Joi.date().optional(),
  winProbability: Joi.number().integer().min(0).max(100).optional(),
  budgetStatus: Joi.string().valid(...Object.values(BudgetStatus)).optional(),
  authorityType: Joi.string().valid(...Object.values(AuthorityType)).optional(),
  decisionMakerCount: Joi.string().valid(...Object.values(DecisionMakerCount)).optional().allow('', null),
  confirmedNeed: Joi.string().optional(),
  decisionTimeline: Joi.string().valid(...Object.values(DecisionTimeline)).optional(),
  qualificationNotes: Joi.string().optional().allow('', null),
  competitors: Joi.array().items(Joi.string()).optional(),
  nextFollowUpDate: Joi.date().optional().allow(null),
  nextFollowUpMode: Joi.string().valid(...Object.values(FollowUpMode)).optional().allow('', null),
  demoDate: Joi.date().optional().allow(null),
  demoCompletedAt: Joi.date().optional().allow(null),
}).unknown(true);

export const listProspectsQuerySchema = Joi.object({
  q: Joi.string().optional().allow(''),
  stage: Joi.string().valid(...Object.values(PipelineStage)).optional().allow(''),
  status: Joi.string().valid(...Object.values(ProspectStatus)).optional().allow(''),
  temperature: Joi.string().valid(...Object.values(LeadTemperature)).optional().allow(''),
  assignedUserId: Joi.string().pattern(objectIdPattern).optional().allow(''),
  closeFrom: Joi.date().optional().allow(''),
  closeTo: Joi.date().optional().allow(''),
  scope: Joi.string().valid('all', 'hot', 'qualified', 'mine', 'stale').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string()
    .valid(
      'created_desc',
      'value_desc',
      'close_asc',
      'stage',
      'days_in_stage',
      'assignee',
      'last_activity',
    )
    .optional(),
}).unknown(true);

export const changeStageSchema = Joi.object({
  stage: Joi.string().valid(...Object.values(PipelineStage)).required(),
  note: Joi.string().optional().allow('', null),
});

export const markWonSchema = Joi.object({
  poNumber: Joi.string().min(1).required(),
  poDate: Joi.date().required(),
  note: Joi.string().optional().allow('', null),
});

export const markLostSchema = Joi.object({
  lostReason: Joi.string().valid(...Object.values(LostReason)).required(),
  lostToCompetitor: Joi.string().optional().allow('', null),
  note: Joi.string().optional().allow('', null),
});

const completionTypes = ['call', 'email', 'whatsapp', 'site_visit', 'demo', 'note'];

export const completeFollowUpSchema = Joi.object({
  doneAs: Joi.string().valid(...completionTypes).required(),
  title: Joi.string().min(1).required(),
  note: Joi.string().optional().allow('', null),
  reschedule: Joi.object({
    occurredAt: Joi.date().greater('now').required().messages({
      'date.greater': 'Reschedule date must be in the future',
    }),
    mode: Joi.string().valid(...Object.values(FollowUpMode)).required(),
    note: Joi.string().optional().allow('', null),
  }).optional(),
});

export const completedFollowUpsQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(180).optional(),
  scope: Joi.string().valid('mine', 'all').optional(),
});
