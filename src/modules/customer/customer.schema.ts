import Joi from 'joi';
import { CustomerStatus } from './customer.model';
import { SiteType } from './site.model';
import { IndustryType } from '../organization/organization.model';

export const createCustomerSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().optional(),
  industryType: Joi.string().valid(...Object.values(IndustryType)).required(),
  status: Joi.string().valid(...Object.values(CustomerStatus)).default(CustomerStatus.ACTIVE),
  primaryContactName: Joi.string().required(),
  primaryContactEmail: Joi.string().email().required(),
  primaryContactPhone: Joi.string().required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  pincode: Joi.string().required(),
  abbreviation: Joi.string().max(6).allow('', null).optional(),
  gstin: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
  reportSettings: Joi.object({
    preparedBy: Joi.boolean().default(false),
    testTakenBy: Joi.boolean().default(false),
    reviewedAndAuthorizedBy: Joi.boolean().default(false),
    verifiedBy: Joi.boolean().default(false),
    approvedBy: Joi.boolean().default(false),
    authorizedBy: Joi.boolean().default(false),
    witnessedBy: Joi.boolean().default(false),
    reviewedBy: Joi.boolean().default(false),
    reviewedByEAM: Joi.boolean().default(false),
    checkedBy: Joi.boolean().default(false),
    dueDate: Joi.boolean().default(false),
    electronicSign: Joi.boolean().default(false),
    withoutElectronicSign: Joi.boolean().default(false),
    signatureImg: Joi.boolean().default(false),
  }).default({}),
}).unknown(true);

export const updateCustomerSchema = createCustomerSchema.fork(
  Object.keys(createCustomerSchema.describe().keys),
  (schema) => schema.optional(),
);

export const createSiteSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().optional(),
  siteType: Joi.string().valid(...Object.values(SiteType)).required(),
  addressLine1: Joi.string().required(),
  addressLine2: Joi.string().allow('', null).optional(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  pincode: Joi.string().required(),
  contactName: Joi.string().allow('', null).optional(),
  contactPhone: Joi.string().allow('', null).optional(),
  contactEmail: Joi.string().email().allow('', null).optional(),
  isActive: Joi.boolean().default(true),
}).unknown(true);

export const updateSiteSchema = createSiteSchema.fork(
  Object.keys(createSiteSchema.describe().keys),
  (schema) => schema.optional(),
);
