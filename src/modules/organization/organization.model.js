"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationModel = exports.SrCounterScope = exports.OrganizationStatus = exports.CompanyType = exports.IndustryType = void 0;
const mongoose_1 = require("mongoose");
var IndustryType;
(function (IndustryType) {
    IndustryType["PHARMA"] = "pharma";
    IndustryType["HOSPITAL"] = "hospital";
    IndustryType["NABL_LAB"] = "nabl_lab";
    IndustryType["CLEANROOM"] = "cleanroom";
    IndustryType["HVAC"] = "hvac";
    IndustryType["BIOTECH"] = "biotech";
    IndustryType["FOOD_BEVERAGE"] = "food_beverage";
    IndustryType["MEDICAL_DEVICE"] = "medical_device";
    IndustryType["OTHER"] = "other";
})(IndustryType || (exports.IndustryType = IndustryType = {}));
var CompanyType;
(function (CompanyType) {
    CompanyType["CLIENT"] = "client";
    CompanyType["INTERNAL"] = "internal";
    CompanyType["VENDOR"] = "vendor";
})(CompanyType || (exports.CompanyType = CompanyType = {}));
var OrganizationStatus;
(function (OrganizationStatus) {
    OrganizationStatus["ACTIVE"] = "active";
    OrganizationStatus["INACTIVE"] = "inactive";
})(OrganizationStatus || (exports.OrganizationStatus = OrganizationStatus = {}));
var SrCounterScope;
(function (SrCounterScope) {
    SrCounterScope["PER_YEAR"] = "per_year";
    SrCounterScope["PER_YEAR_CUSTOMER"] = "per_year_customer";
    SrCounterScope["PER_YEAR_CUSTOMER_TYPE"] = "per_year_customer_type";
})(SrCounterScope || (exports.SrCounterScope = SrCounterScope = {}));
const organizationSchema = new mongoose_1.Schema({
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
    gstin: { type: String, trim: true, uppercase: true },
    logoUrl: { type: String, trim: true },
    abbreviation: { type: String, trim: true, uppercase: true, maxlength: 6 },
    srCounterScope: {
        type: String,
        enum: Object.values(SrCounterScope),
        default: SrCounterScope.PER_YEAR,
    },
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
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
exports.OrganizationModel = (0, mongoose_1.model)('Organization', organizationSchema);
