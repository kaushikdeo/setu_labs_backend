import { OrganizationModel, IOrganization } from './organization.model';
import { UserModel } from '../user/user.model';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';

export class OrganizationService {
  async createOrganization(data: Partial<IOrganization>, userId: string): Promise<IOrganization> {
    const existing = await OrganizationModel.findOne();
    if (existing) {
      throw new AppError(400, 'Organization already exists');
    }

    const companyCode = data.companyCode || `ORG-${Date.now()}`;

    const organization = await OrganizationModel.create({
      ...data,
      companyCode,
      createdBy: userId,
    });

    await UserModel.findByIdAndUpdate(userId, { onboardingCompleted: true });

    logger.info('Organization created', { organizationId: organization._id, createdBy: userId });
    return organization;
  }

  async getOrganization(): Promise<IOrganization | null> {
    return OrganizationModel.findOne();
  }

  async updateOrganization(data: Partial<IOrganization>, userId: string): Promise<IOrganization | null> {
    // Remove protected fields to prevent Mongoose errors
    const { _id, id, createdBy, createdAt, updatedAt, __v, ...updateData } = data as any;

    const organization = await OrganizationModel.findOneAndUpdate({}, updateData, { new: true });
    if (!organization) {
      throw new AppError(404, 'Organization not found');
    }
    logger.info('Organization updated', { organizationId: organization._id, updatedBy: userId });
    return organization;
  }
}
