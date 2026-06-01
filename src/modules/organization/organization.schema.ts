import Joi from 'joi';
import { IndustryType, CompanyType, OrganizationStatus, SrCounterScope } from './organization.model';

export const createOrganizationSchema = Joi.object({
  // SECTION 1
  companyName: Joi.string().required(),
  companyCode: Joi.string().optional(),
  industryType: Joi.string().valid(...Object.values(IndustryType)).required(),
  companyType: Joi.string().valid(...Object.values(CompanyType)).required(),
  status: Joi.string().valid(...Object.values(OrganizationStatus)).default(OrganizationStatus.ACTIVE),
  country: Joi.string().required(),
  state: Joi.string().required(),
  city: Joi.string().required(),
  addressLine1: Joi.string().required(),
  addressLine2: Joi.string().allow('', null).optional(),
  pincode: Joi.string().required(),
  timezone: Joi.string().required(),
  website: Joi.string().uri().allow('', null).optional(),
  logoUrl: Joi.string().uri().allow('', null).optional(),
  abbreviation: Joi.string().max(6).allow('', null).optional(),
  srCounterScope: Joi.string().valid(...Object.values(SrCounterScope)).default(SrCounterScope.PER_YEAR),

  // SECTION 2
  isNablAccredited: Joi.boolean().default(false),
  nablCertificateNumber: Joi.string().allow('', null).optional(),
  isGmpCertified: Joi.boolean().default(false),
  isWhoGmpCertified: Joi.boolean().default(false),
  isUsfdaApproved: Joi.boolean().default(false),
  isMhraApproved: Joi.boolean().default(false),
  isEuGmpCertified: Joi.boolean().default(false),
  isIso17025Applicable: Joi.boolean().default(false),
  is21CfrPart11Required: Joi.boolean().default(false),
  isAnnex11Required: Joi.boolean().default(false),
  isAlcoaPlusApplicable: Joi.boolean().default(false),
  isCsvApplicable: Joi.boolean().default(false),
  isValidationRequired: Joi.boolean().default(true),
  isCalibrationRequired: Joi.boolean().default(true),

  // SECTION 3
  primaryContactName: Joi.string().required(),
  primaryContactDesignation: Joi.string().required(),
  primaryContactEmail: Joi.string().email().required(),
  primaryContactPhone: Joi.string().required(),
  alternatePhone: Joi.string().allow('', null).optional(),
  qaHeadName: Joi.string().allow('', null).optional(),
  engineeringHeadName: Joi.string().allow('', null).optional(),
  itContactName: Joi.string().allow('', null).optional(),
  billingContactName: Joi.string().allow('', null).optional(),

  // SECTION 4
  defaultValidationFrequencyDays: Joi.number().default(365),
  defaultCalibrationFrequencyDays: Joi.number().default(365),
  isReportApprovalWorkflowEnabled: Joi.boolean().default(true),
  isAutoReportGenerationEnabled: Joi.boolean().default(false),
  isAutoEmailReportsEnabled: Joi.boolean().default(false),
  isQrCodeEnabled: Joi.boolean().default(true),
  isESignatureEnabled: Joi.boolean().default(true),
  isMultiSiteEnabled: Joi.boolean().default(false),
  isMultiLabEnabled: Joi.boolean().default(false),
  isAmcEnabled: Joi.boolean().default(true),
  isReminderEngineEnabled: Joi.boolean().default(true),

  // SECTION 5
  reminderDaysBeforeDue: Joi.number().default(30),
  escalationDays: Joi.number().default(7),
  isEmailNotificationsEnabled: Joi.boolean().default(true),
  isSmsNotificationsEnabled: Joi.boolean().default(false),
  isWhatsAppNotificationsEnabled: Joi.boolean().default(false),
  isDailySummaryEmailEnabled: Joi.boolean().default(false),
  isFailedValidationAlertsEnabled: Joi.boolean().default(true),

  // SECTION 7
  isMfaEnabled: Joi.boolean().default(false),
  passwordExpiryDays: Joi.number().default(90),
  sessionTimeoutMinutes: Joi.number().default(30),
  isIpRestrictionEnabled: Joi.boolean().default(false),
  isDeviceRestrictionEnabled: Joi.boolean().default(false),
  isAuditLoggingEnabled: Joi.boolean().default(true),
  isESignatureMandatory: Joi.boolean().default(true),
  isApprovalWorkflowMandatory: Joi.boolean().default(true),

  // SECTION 8
  defaultReportTemplate: Joi.string().default('standard-v1'),
  defaultUnitSystem: Joi.string().valid('metric', 'imperial').default('metric'),
  reportNumberingFormat: Joi.string().default('REP-{{YYYY}}-{{SEQ}}'),
  certificateNumberingFormat: Joi.string().default('CERT-{{YYYY}}-{{SEQ}}'),
  timeFormat: Joi.string().valid('12h', '24h').default('24h'),
  temperatureUnit: Joi.string().valid('C', 'F', 'K').default('C'),
  pressureUnit: Joi.string().valid('Pa', 'bar', 'psi', 'mbar').default('mbar'),
});

export const updateOrganizationSchema = createOrganizationSchema.fork(
  Object.keys(createOrganizationSchema.describe().keys),
  (schema) => schema.optional(),
);
