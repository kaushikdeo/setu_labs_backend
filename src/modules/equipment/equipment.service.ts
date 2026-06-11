import { EquipmentModel, IEquipment } from './equipment.model';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';
import { orgFilter } from '../../utils/tenant';

export class EquipmentService {
  async createEquipment(data: Partial<IEquipment>, userId: string, organizationId: string): Promise<IEquipment> {
    const code = data.code || `EQP-${Date.now()}`;

    const existing = await EquipmentModel.findOne({ code, ...orgFilter(organizationId) });
    if (existing) {
      throw new AppError(400, 'Equipment with this code already exists');
    }

    const equipment = await EquipmentModel.create({
      ...data,
      code,
      ...orgFilter(organizationId),
      createdBy: userId,
    });

    logger.info('Equipment created', { equipmentId: equipment._id, createdBy: userId });
    return equipment;
  }

  async getAllEquipment(filters: any = {}, organizationId: string): Promise<IEquipment[]> {
    const query: any = { ...orgFilter(organizationId) };
    if (filters.status) query.status = filters.status;

    return EquipmentModel.find(query)
      .sort({ createdAt: -1 });
  }

  async getEquipmentById(id: string, organizationId: string): Promise<IEquipment> {
    const equipment = await EquipmentModel.findOne({ _id: id, ...orgFilter(organizationId) });
    if (!equipment) {
      throw new AppError(404, 'Equipment not found');
    }
    return equipment;
  }

  async updateEquipment(id: string, data: Partial<IEquipment>, userId: string, organizationId: string): Promise<IEquipment> {
    const { _id, id: _, __v, createdAt, updatedAt, createdBy, ...updateData } = data as any;
    const equipment = await EquipmentModel.findOneAndUpdate({ _id: id, ...orgFilter(organizationId) }, updateData, { new: true });
    if (!equipment) {
      throw new AppError(404, 'Equipment not found');
    }
    logger.info('Equipment updated', { equipmentId: id, updatedBy: userId });
    return equipment;
  }

  async deleteEquipment(id: string, userId: string, organizationId: string): Promise<void> {
    const equipment = await EquipmentModel.findOneAndDelete({ _id: id, ...orgFilter(organizationId) });
    if (!equipment) {
      throw new AppError(404, 'Equipment not found');
    }
    logger.info('Equipment deleted', { equipmentId: id, deletedBy: userId });
  }
}
