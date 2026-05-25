import { Schema, model, Document } from 'mongoose';

export enum IndustryType {
  PHARMA = 'pharma',
  HOSPITAL = 'hospital',
  NABL_LAB = 'nabl_lab',
  CLEANROOM = 'cleanroom',
  HVAC = 'hvac',
  BIOTECH = 'biotech',
  FOOD_BEVERAGE = 'food_beverage',
  MEDICAL_DEVICE = 'medical_device',
  OTHER = 'other',
}

export enum CompanyType {
  CLIENT = 'client',
  INTERNAL = 'internal',
  VENDOR = 'vendor',
}

export enum OrganizationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface IOrganization extends Document {
  // SECTION 1 — BASIC COMPANY INFORMATION
  companyName: string;
  companyCode: string;
  industryType: IndustryType;
  companyType: CompanyType;
  status: OrganizationStatus;
  country: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  pincode: string;
  timezone: string;
  website?: string;
  logoUrl?: string;

  // SECTION 2 — COMPLIANCE INFORMATION
  isNablAccredited: boolean;
  nablCertificateNumber?: string;
  isGmpCertified: boolean;
  isWhoGmpCertified: boolean;
  isUsfdaApproved: boolean;
  isMhraApproved: boolean;
  isEuGmpCertified: boolean;
  isIso17025Applicable: boolean;
  is21CfrPart11Required: boolean;
  isAnnex11Required: boolean;
  isAlcoaPlusApplicable: boolean;
  isCsvApplicable: boolean;
  isValidationRequired: boolean;
  isCalibrationRequired: boolean;

  // SECTION 3 — PRIMARY CONTACT INFORMATION
  primaryContactName: string;
  primaryContactDesignation: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  alternatePhone?: string;
  qaHeadName?: string;
  engineeringHeadName?: string;
  itContactName?: string;
  billingContactName?: string;

  // SECTION 4 — BUSINESS CONFIGURATION
  defaultValidationFrequencyDays: number;
  defaultCalibrationFrequencyDays: number;
  isReportApprovalWorkflowEnabled: boolean;
  isAutoReportGenerationEnabled: boolean;
  isAutoEmailReportsEnabled: boolean;
  isQrCodeEnabled: boolean;
  isESignatureEnabled: boolean;
  isMultiSiteEnabled: boolean;
  isMultiLabEnabled: boolean;
  isAmcEnabled: boolean;
  isReminderEngineEnabled: boolean;

  // SECTION 5 — NOTIFICATION SETTINGS
  reminderDaysBeforeDue: number;
  escalationDays: number;
  isEmailNotificationsEnabled: boolean;
  isSmsNotificationsEnabled: boolean;
  isWhatsAppNotificationsEnabled: boolean;
  isDailySummaryEmailEnabled: boolean;
  isFailedValidationAlertsEnabled: boolean;

  // SECTION 7 — ACCESS & SECURITY SETTINGS
  isMfaEnabled: boolean;
  passwordExpiryDays: number;
  sessionTimeoutMinutes: number;
  isIpRestrictionEnabled: boolean;
  isDeviceRestrictionEnabled: boolean;
  isAuditLoggingEnabled: boolean;
  isESignatureMandatory: boolean;
  isApprovalWorkflowMandatory: boolean;

  // SECTION 8 — INITIAL SYSTEM CONFIGURATION
  defaultReportTemplate: string;
  defaultUnitSystem: 'metric' | 'imperial';
  reportNumberingFormat: string;
  certificateNumberingFormat: string;
  timeFormat: '12h' | '24h';
  temperatureUnit: 'C' | 'F' | 'K';
  pressureUnit: 'Pa' | 'bar' | 'psi' | 'mbar';

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    // SECTION 1
    companyName: { type: String, required: true, trim: true },
    companyCode: { type: String, required: true, unique: true, trim: true },
    industryType: { type: String, enum: Object.values(IndustryType), required: true },
    companyType: { type: String, enum: Object.values(CompanyType), required: true },
    status: { type: String, enum: Object.values(OrganizationStatus), default: OrganizationStatus.ACTIVE, required: true },
    country: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    pincode: { type: String, required: true, trim: true },
    timezone: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    logoUrl: { type: String, trim: true },

    // SECTION 2
    isNablAccredited: { type: Boolean, default: false },
    nablCertificateNumber: { type: String, trim: true },
    isGmpCertified: { type: Boolean, default: false },
    isWhoGmpCertified: { type: Boolean, default: false },
    isUsfdaApproved: { type: Boolean, default: false },
    isMhraApproved: { type: Boolean, default: false },
    isEuGmpCertified: { type: Boolean, default: false },
    isIso17025Applicable: { type: Boolean, default: false },
    is21CfrPart11Required: { type: Boolean, default: false },
    isAnnex11Required: { type: Boolean, default: false },
    isAlcoaPlusApplicable: { type: Boolean, default: false },
    isCsvApplicable: { type: Boolean, default: false },
    isValidationRequired: { type: Boolean, default: true },
    isCalibrationRequired: { type: Boolean, default: true },

    // SECTION 3
    primaryContactName: { type: String, required: true, trim: true },
    primaryContactDesignation: { type: String, required: true, trim: true },
    primaryContactEmail: { type: String, required: true, trim: true, lowercase: true },
    primaryContactPhone: { type: String, required: true, trim: true },
    alternatePhone: { type: String, trim: true },
    qaHeadName: { type: String, trim: true },
    engineeringHeadName: { type: String, trim: true },
    itContactName: { type: String, trim: true },
    billingContactName: { type: String, trim: true },

    // SECTION 4
    defaultValidationFrequencyDays: { type: Number, default: 365 },
    defaultCalibrationFrequencyDays: { type: Number, default: 365 },
    isReportApprovalWorkflowEnabled: { type: Boolean, default: true },
    isAutoReportGenerationEnabled: { type: Boolean, default: false },
    isAutoEmailReportsEnabled: { type: Boolean, default: false },
    isQrCodeEnabled: { type: Boolean, default: true },
    isESignatureEnabled: { type: Boolean, default: true },
    isMultiSiteEnabled: { type: Boolean, default: false },
    isMultiLabEnabled: { type: Boolean, default: false },
    isAmcEnabled: { type: Boolean, default: true },
    isReminderEngineEnabled: { type: Boolean, default: true },

    // SECTION 5
    reminderDaysBeforeDue: { type: Number, default: 30 },
    escalationDays: { type: Number, default: 7 },
    isEmailNotificationsEnabled: { type: Boolean, default: true },
    isSmsNotificationsEnabled: { type: Boolean, default: false },
    isWhatsAppNotificationsEnabled: { type: Boolean, default: false },
    isDailySummaryEmailEnabled: { type: Boolean, default: false },
    isFailedValidationAlertsEnabled: { type: Boolean, default: true },

    // SECTION 7
    isMfaEnabled: { type: Boolean, default: false },
    passwordExpiryDays: { type: Number, default: 90 },
    sessionTimeoutMinutes: { type: Number, default: 30 },
    isIpRestrictionEnabled: { type: Boolean, default: false },
    isDeviceRestrictionEnabled: { type: Boolean, default: false },
    isAuditLoggingEnabled: { type: Boolean, default: true },
    isESignatureMandatory: { type: Boolean, default: true },
    isApprovalWorkflowMandatory: { type: Boolean, default: true },

    // SECTION 8
    defaultReportTemplate: { type: String, default: 'standard-v1' },
    defaultUnitSystem: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    reportNumberingFormat: { type: String, default: 'REP-{{YYYY}}-{{SEQ}}' },
    certificateNumberingFormat: { type: String, default: 'CERT-{{YYYY}}-{{SEQ}}' },
    timeFormat: { type: String, enum: ['12h', '24h'], default: '24h' },
    temperatureUnit: { type: String, enum: ['C', 'F', 'K'], default: 'C' },
    pressureUnit: { type: String, enum: ['Pa', 'bar', 'psi', 'mbar'], default: 'mbar' },

    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const OrganizationModel = model<IOrganization>('Organization', organizationSchema);
