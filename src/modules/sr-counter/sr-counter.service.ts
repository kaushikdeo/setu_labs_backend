import { Types } from 'mongoose';
import { SrCounterModel } from './sr-counter.model';

export class SrCounterService {
  async ensureFloor(key: string, floor: number, organizationId?: string): Promise<void> {
    if (floor <= 0) return;

    await SrCounterModel.findOneAndUpdate(
      { key },
      {
        $max: { sequence: floor },
        ...(organizationId
          ? { $setOnInsert: { organizationId: new Types.ObjectId(organizationId) } }
          : {}),
      },
      { upsert: true },
    );
  }

  async nextSequence(key: string, organizationId?: string): Promise<number> {
    const doc = await SrCounterModel.findOneAndUpdate(
      { key },
      {
        $inc: { sequence: 1 },
        ...(organizationId
          ? { $setOnInsert: { organizationId: new Types.ObjectId(organizationId) } }
          : {}),
      },
      { upsert: true, new: true },
    );
    return doc.sequence;
  }

  async nextSequenceWithFloor(
    key: string,
    floor: number,
    organizationId?: string,
  ): Promise<number> {
    await this.ensureFloor(key, floor, organizationId);
    return this.nextSequence(key, organizationId);
  }
}

export const srCounterService = new SrCounterService();
