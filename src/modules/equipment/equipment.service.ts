import { EquipmentModel, IEquipment } from './equipment.model';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';

export class EquipmentService {
  async createEquipment(data: Partial<IEquipment>, userId: string): Promise<IEquipment> {
    const code = data.code || `EQP-${Date.now()}`;
    
    const existing = await EquipmentModel.findOne({ code });
    if (existing) {
      throw new AppError(400, 'Equipment with this code already exists');
    }

    const equipment = await EquipmentModel.create({
      ...data,
      code,
      createdBy: userId,
    });

    logger.info('Equipment created', { equipmentId: equipment._id, createdBy: userId });
    return equipment;
  }

  async getAllEquipment(filters: any = {}): Promise<IEquipment[]> {
    const query: any = {};
    if (filters.status) query.status = filters.status;

    return EquipmentModel.find(query)
      .sort({ createdAt: -1 });
  }

  async getEquipmentById(id: string): Promise<IEquipment> {
    const equipment = await EquipmentModel.findById(id);
    if (!equipment) {
      throw new AppError(404, 'Equipment not found');
    }
    return equipment;
  }

  async updateEquipment(id: string, data: Partial<IEquipment>, userId: string): Promise<IEquipment> {
    const { _id, id: _, __v, createdAt, updatedAt, createdBy, ...updateData } = data as any;
    const equipment = await EquipmentModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!equipment) {
      throw new AppError(404, 'Equipment not found');
    }
    logger.info('Equipment updated', { equipmentId: id, updatedBy: userId });
    return equipment;
  }

  async deleteEquipment(id: string, userId: string): Promise<void> {
    const equipment = await EquipmentModel.findByIdAndDelete(id);
    if (!equipment) {
      throw new AppError(404, 'Equipment not found');
    }
    logger.info('Equipment deleted', { equipmentId: id, deletedBy: userId });
  }
}
