import { Types } from 'mongoose';
import { ITcTemplate, TcOpportunityType, TcTemplateModel } from './tc-template.model';
import { AppError } from '../../utils/app-error';
import { orgFilter } from '../../utils/tenant';

export interface CreateTcTemplateDto {
  name: string;
  opportunityType: TcOpportunityType;
  body: string;
  isDefault?: boolean;
}

export type UpdateTcTemplateDto = Partial<CreateTcTemplateDto>;

export class TcTemplateService {
  async list(organizationId: string): Promise<ITcTemplate[]> {
    return TcTemplateModel.find(orgFilter(organizationId)).sort({ opportunityType: 1, isDefault: -1, name: 1 }).exec();
  }

  async getById(id: string, organizationId: string): Promise<ITcTemplate> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid template id');
    const doc = await TcTemplateModel.findOne({ _id: id, ...orgFilter(organizationId) });
    if (!doc) throw new AppError(404, 'Template not found');
    return doc;
  }

  async getDefaultForType(type: TcOpportunityType, organizationId: string): Promise<ITcTemplate | null> {
    return TcTemplateModel.findOne({ opportunityType: type, isDefault: true, ...orgFilter(organizationId) });
  }

  async create(dto: CreateTcTemplateDto, userId: string, organizationId: string): Promise<ITcTemplate> {
    if (dto.isDefault) {
      await TcTemplateModel.updateMany(
        { opportunityType: dto.opportunityType, isDefault: true, ...orgFilter(organizationId) },
        { $set: { isDefault: false } }
      );
    }
    return TcTemplateModel.create({
      name: dto.name.trim(),
      opportunityType: dto.opportunityType,
      body: dto.body,
      isDefault: !!dto.isDefault,
      ...orgFilter(organizationId),
      createdBy: userId,
    });
  }

  async update(id: string, dto: UpdateTcTemplateDto, organizationId: string): Promise<ITcTemplate> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid template id');
    const existing = await TcTemplateModel.findOne({ _id: id, ...orgFilter(organizationId) });
    if (!existing) throw new AppError(404, 'Template not found');

    const nextType = dto.opportunityType ?? existing.opportunityType;
    if (dto.isDefault === true) {
      await TcTemplateModel.updateMany(
        { opportunityType: nextType, isDefault: true, _id: { $ne: existing._id }, ...orgFilter(organizationId) },
        { $set: { isDefault: false } }
      );
    }

    if (dto.name !== undefined) existing.name = dto.name.trim();
    if (dto.opportunityType !== undefined) existing.opportunityType = dto.opportunityType;
    if (dto.body !== undefined) existing.body = dto.body;
    if (dto.isDefault !== undefined) existing.isDefault = dto.isDefault;
    await existing.save();
    return existing;
  }

  async remove(id: string, organizationId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid template id');
    const res = await TcTemplateModel.findOneAndDelete({ _id: id, ...orgFilter(organizationId) });
    if (!res) throw new AppError(404, 'Template not found');
  }
}

export const tcTemplateService = new TcTemplateService();
