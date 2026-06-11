import { MasterInstrumentModel, IMasterInstrument, InstrumentStatus } from './instrument.model';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';
import { orgFilter } from '../../utils/tenant';

export class InstrumentService {
  async createInstrument(data: Partial<IMasterInstrument>, userId: string, organizationId: string): Promise<IMasterInstrument> {
    const code = data.code || `INST-${Date.now()}`;

    const existing = await MasterInstrumentModel.findOne({ code, ...orgFilter(organizationId) });
    if (existing) {
      throw new AppError(400, 'Instrument with this code already exists');
    }

    const instrument = await MasterInstrumentModel.create({
      ...data,
      code,
      ...orgFilter(organizationId),
      createdBy: userId,
    });

    logger.info('Master instrument created', { instrumentId: instrument._id, createdBy: userId });
    return instrument;
  }

  async getAllInstruments(organizationId: string): Promise<IMasterInstrument[]> {
    return MasterInstrumentModel.find(orgFilter(organizationId)).sort({ createdAt: -1 });
  }

  async getInstrumentById(id: string, organizationId: string): Promise<IMasterInstrument> {
    const instrument = await MasterInstrumentModel.findOne({ _id: id, ...orgFilter(organizationId) });
    if (!instrument) {
      throw new AppError(404, 'Master instrument not found');
    }
    return instrument;
  }

  async updateInstrument(id: string, data: Partial<IMasterInstrument>, userId: string, organizationId: string): Promise<IMasterInstrument> {
    const { _id, id: _, __v, createdAt, updatedAt, createdBy, ...updateData } = data as any;
    const instrument = await MasterInstrumentModel.findOneAndUpdate({ _id: id, ...orgFilter(organizationId) }, updateData, { new: true });
    if (!instrument) {
      throw new AppError(404, 'Master instrument not found');
    }
    logger.info('Master instrument updated', { instrumentId: id, updatedBy: userId });
    return instrument;
  }

  async isInstrumentValid(id: string, organizationId: string): Promise<boolean> {
    const instrument = await MasterInstrumentModel.findOne({ _id: id, ...orgFilter(organizationId) });
    if (!instrument) return false;

    const now = new Date();
    if (instrument.status !== InstrumentStatus.ACTIVE) return false;
    if (instrument.calibrationDueDate < now) {
      instrument.status = InstrumentStatus.EXPIRED;
      await instrument.save();
      return false;
    }

    return true;
  }
}
