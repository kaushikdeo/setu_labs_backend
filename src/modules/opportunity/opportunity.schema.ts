import Joi from 'joi';
import {
  DrawingsStatus,
  OpportunityLossReason,
  OpportunityStage,
  OpportunityStatus,
  OpportunityType,
  PaymentTermsPreset,
  SiteVisitStatus,
  WarrantyPeriod,
} from './opportunity.model';
import {
  BudgetStatus,
  DecisionTimeline,
  FollowUpMode,
  LeadIndustry,
  LeadProductInterest,
  LeadSource,
  LeadTemperature,
} from '../lead/lead.model';
import { AuthorityType } from '../prospect/prospect.model';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const milestoneSchema = Joi.object({
  label: Joi.string().required(),
  percent: Joi.number().min(0).max(100).required(),
  trigger: Joi.string().optional().allow('', null),
});

export const convertProspectSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  type: Joi.string()
    .valid(...Object.values(OpportunityType))
    .required(),
  submissionDeadline: Joi.date().required(),

  scopeOfWork: Joi.string().min(1).required(),
  siteLocation: Joi.string().optional().allow('', null),
  siteVisitStatus: Joi.string()
    .valid(...Object.values(SiteVisitStatus))
    .required(),
  siteVisitDate: Joi.date().optional().allow(null),

  technicalSpecs: Joi.string().min(1).required(),
  drawingsStatus: Joi.string()
    .valid(...Object.values(DrawingsStatus))
    .required(),

  paymentTermsPreset: Joi.string()
    .valid(...Object.values(PaymentTermsPreset))
    .required(),
  paymentMilestones: Joi.array().items(milestoneSchema).optional(),
  paymentNotes: Joi.string().optional().allow('', null),
  deliveryTimeline: Joi.string().min(1).required(),
  warrantyPeriod: Joi.string()
    .valid(...Object.values(WarrantyPeriod))
    .required(),

  quotationOwnerId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'quotationOwnerId must be a valid user id',
  }),
  technicalReviewerId: Joi.string().pattern(objectIdPattern).optional().allow('', null),
  approvalThreshold: Joi.number().min(0).required(),
  assignedUserId: Joi.string().pattern(objectIdPattern).optional(),

  dealValue: Joi.number().min(0).optional(),
  expectedCloseDate: Joi.date().optional(),
});

export const createStandaloneOpportunitySchema = convertProspectSchema.append({
  firstName: Joi.string().min(1).required(),
  lastName: Joi.string().min(1).required(),
  mobile: Joi.string().min(6).required(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .optional()
    .allow('', null),
  company: Joi.string().optional().allow('', null),
  city: Joi.string().optional().allow('', null),
  state: Joi.string().optional().allow('', null),
  industry: Joi.string()
    .valid(...Object.values(LeadIndustry))
    .optional()
    .allow('', null),
  productInterest: Joi.string()
    .valid(...Object.values(LeadProductInterest))
    .optional()
    .allow('', null),
  source: Joi.string()
    .valid(...Object.values(LeadSource))
    .required(),
  temperature: Joi.string()
    .valid(...Object.values(LeadTemperature))
    .optional(),
  budgetStatus: Joi.string()
    .valid(...Object.values(BudgetStatus))
    .optional(),
  authorityType: Joi.string()
    .valid(...Object.values(AuthorityType))
    .optional(),
  decisionTimeline: Joi.string()
    .valid(...Object.values(DecisionTimeline))
    .optional(),
  confirmedNeed: Joi.string().optional().allow('', null),
  competitors: Joi.array().items(Joi.string()).optional(),
});

export const updateOpportunitySchema = Joi.object({
  name: Joi.string().min(1).optional(),
  assignedUserId: Joi.string().pattern(objectIdPattern).optional(),
  quotationOwnerId: Joi.string().pattern(objectIdPattern).optional(),
  technicalReviewerId: Joi.string().pattern(objectIdPattern).optional().allow('', null),
  approvalThreshold: Joi.number().min(0).optional(),
  dealValue: Joi.number().min(0).optional(),
  expectedCloseDate: Joi.date().optional(),
  winProbability: Joi.number().integer().min(0).max(100).optional(),
  scopeOfWork: Joi.string().optional(),
  siteLocation: Joi.string().optional().allow('', null),
  siteVisitStatus: Joi.string()
    .valid(...Object.values(SiteVisitStatus))
    .optional(),
  siteVisitDate: Joi.date().optional().allow(null),
  technicalSpecs: Joi.string().optional(),
  drawingsStatus: Joi.string()
    .valid(...Object.values(DrawingsStatus))
    .optional(),
  paymentTermsPreset: Joi.string()
    .valid(...Object.values(PaymentTermsPreset))
    .optional(),
  paymentMilestones: Joi.array().items(milestoneSchema).optional(),
  paymentNotes: Joi.string().optional().allow('', null),
  deliveryTimeline: Joi.string().optional(),
  warrantyPeriod: Joi.string()
    .valid(...Object.values(WarrantyPeriod))
    .optional(),
  submissionDeadline: Joi.date().optional(),
  nextFollowUpDate: Joi.date().optional().allow(null),
  nextFollowUpMode: Joi.string()
    .valid(...Object.values(FollowUpMode))
    .optional()
    .allow('', null),
  tags: Joi.array().items(Joi.string()).optional(),
}).min(1);

export const listOpportunitiesQuerySchema = Joi.object({
  q: Joi.string().optional().allow(''),
  stage: Joi.string()
    .valid(...Object.values(OpportunityStage))
    .optional()
    .allow(''),
  status: Joi.string()
    .valid(...Object.values(OpportunityStatus))
    .optional()
    .allow(''),
  type: Joi.string()
    .valid(...Object.values(OpportunityType))
    .optional()
    .allow(''),
  assignedUserId: Joi.string().pattern(objectIdPattern).optional().allow(''),
  deadlineFrom: Joi.date().optional().allow(''),
  deadlineTo: Joi.date().optional().allow(''),
  scope: Joi.string()
    .valid('all', 'mine', 'stale', 'on_hold', 'at_risk', 'needs_attention', 'due-this-week', 'pending-approvals')
    .optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string()
    .valid('created_desc', 'value_desc', 'deadline_asc', 'stage', 'days_in_stage', 'last_activity')
    .optional(),
}).unknown(true);

export const changeStageSchema = Joi.object({
  stage: Joi.string()
    .valid(...Object.values(OpportunityStage))
    .required(),
  note: Joi.string().optional().allow('', null),
});

export const markWonSchema = Joi.object({
  poNumber: Joi.string().min(1).required(),
  poDate: Joi.date().required(),
  wonValue: Joi.number().min(0).required(),
  poDocumentUrl: Joi.string().uri().optional().allow('', null),
  note: Joi.string().optional().allow('', null),
});

export const markLostSchema = Joi.object({
  lossReason: Joi.string()
    .valid(...Object.values(OpportunityLossReason))
    .required(),
  competitorWon: Joi.string().optional().allow('', null),
  competitorPrice: Joi.number().min(0).optional(),
  customerFeedback: Joi.string().optional().allow('', null),
  note: Joi.string().optional().allow('', null),
});
