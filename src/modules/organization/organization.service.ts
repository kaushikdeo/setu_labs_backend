import { OrganizationModel, IOrganization } from './organization.model';
import { UserModel } from '../user/user.model';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';

export class OrganizationService {
  async getOrganization(organizationId: string): Promise<IOrganization | null> {
    return OrganizationModel.findById(organizationId);
  }

  async updateOrganization(
    organizationId: string,
    data: Partial<IOrganization>,
    userId: string,
  ): Promise<IOrganization | null> {
    const { _id, id, createdBy, createdAt, updatedAt, __v, ...updateData } = data as Record<
      string,
      unknown
    >;

    const organization = await OrganizationModel.findByIdAndUpdate(
      organizationId,
      updateData,
      { new: true },
    );
    if (!organization) {
      throw new AppError(404, 'Organization not found');
    }

    const user = await UserModel.findById(userId);
    if (user && !user.onboardingCompleted) {
      await UserModel.findByIdAndUpdate(userId, { onboardingCompleted: true });
    }

    logger.info('Organization updated', { organizationId: organization._id, updatedBy: userId });
    return organization;
  }
}
