import { TestTypeModel, ITestType } from './test-type.model';
import { AppError } from '../../utils/app-error';
import { appendUniqueId, orgFilter } from '../../utils/tenant';

export class TestTypeService {
  async getAll(organizationId: string): Promise<ITestType[]> {
    return TestTypeModel.find({ isActive: true, ...orgFilter(organizationId) }).sort({ name: 1 });
  }

  async getAllIncludingInactive(organizationId: string): Promise<ITestType[]> {
    return TestTypeModel.find(orgFilter(organizationId)).sort({ name: 1 });
  }

  async getById(id: string, organizationId: string): Promise<ITestType> {
    const testType = await TestTypeModel.findOne({ _id: id, ...orgFilter(organizationId) });
    if (!testType) throw new AppError(404, 'Test type not found');
    return testType;
  }

  async getByCode(code: string, organizationId: string): Promise<ITestType | null> {
    return TestTypeModel.findOne({ code, isActive: true, ...orgFilter(organizationId) });
  }

  async create(data: Partial<ITestType>, organizationId: string): Promise<ITestType> {
    if (!data.code?.trim()) {
      throw new AppError(400, 'Test type code is required');
    }

    const code = appendUniqueId(data.code);
    return TestTypeModel.create({ ...data, code, ...orgFilter(organizationId) });
  }

  async update(id: string, data: Partial<ITestType>, organizationId: string): Promise<ITestType> {
    if (data.code) {
      const duplicate = await TestTypeModel.findOne({
        code: data.code,
        _id: { $ne: id },
        ...orgFilter(organizationId),
      });
      if (duplicate) throw new AppError(409, `Test type with code "${data.code}" already exists`);
    }

    const testType = await TestTypeModel.findOneAndUpdate({ _id: id, ...orgFilter(organizationId) }, data, { new: true, runValidators: true });
    if (!testType) throw new AppError(404, 'Test type not found');
    return testType;
  }

  async deactivate(id: string, organizationId: string): Promise<ITestType> {
    const testType = await TestTypeModel.findOneAndUpdate({ _id: id, ...orgFilter(organizationId) }, { isActive: false }, { new: true });
    if (!testType) throw new AppError(404, 'Test type not found');
    return testType;
  }
}
