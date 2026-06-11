import { Types } from 'mongoose';
import {
  OrganizationModel,
  IndustryType,
  CompanyType,
  OrganizationStatus,
  IOrganization,
} from '../modules/organization/organization.model';

export function stubOrgPayload(
  user: { name: string; email: string },
  createdBy: string,
): Partial<IOrganization> {
  return {
    companyName: `${user.name}'s Organization`,
    companyCode: `ORG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    industryType: IndustryType.OTHER,
    companyType: CompanyType.INTERNAL,
    status: OrganizationStatus.ACTIVE,
    country: 'Pending',
    state: 'Pending',
    city: 'Pending',
    addressLine1: 'Pending',
    pincode: '000000',
    timezone: 'UTC',
    primaryContactName: user.name,
    primaryContactDesignation: 'Administrator',
    primaryContactEmail: user.email,
    primaryContactPhone: '0000000000',
    createdBy,
  };
}

export async function createStubOrganization(
  user: { name: string; email: string },
  createdBy: string,
): Promise<IOrganization> {
  return OrganizationModel.create(stubOrgPayload(user, createdBy));
}
