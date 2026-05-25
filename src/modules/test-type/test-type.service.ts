import { TestTypeModel, ITestType } from './test-type.model';
import { AppError } from '../../utils/app-error';

export class TestTypeService {
  async getAll(): Promise<ITestType[]> {
    return TestTypeModel.find({ isActive: true }).sort({ name: 1 });
  }

  async getAllIncludingInactive(): Promise<ITestType[]> {
    return TestTypeModel.find().sort({ name: 1 });
  }

  async getById(id: string): Promise<ITestType> {
    const testType = await TestTypeModel.findById(id);
    if (!testType) throw new AppError(404, 'Test type not found');
    return testType;
  }

  async getByCode(code: string): Promise<ITestType | null> {
    return TestTypeModel.findOne({ code, isActive: true });
  }

  async create(data: Partial<ITestType>): Promise<ITestType> {
    const existing = await TestTypeModel.findOne({ code: data.code });
    if (existing) throw new AppError(409, `Test type with code "${data.code}" already exists`);
    return TestTypeModel.create(data);
  }

  async update(id: string, data: Partial<ITestType>): Promise<ITestType> {
    const testType = await TestTypeModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!testType) throw new AppError(404, 'Test type not found');
    return testType;
  }

  async deactivate(id: string): Promise<ITestType> {
    const testType = await TestTypeModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!testType) throw new AppError(404, 'Test type not found');
    return testType;
  }
}
