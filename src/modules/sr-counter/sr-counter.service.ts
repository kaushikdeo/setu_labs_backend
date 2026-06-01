import { SrCounterModel } from './sr-counter.model';

export class SrCounterService {
  async nextSequence(key: string): Promise<number> {
    const doc = await SrCounterModel.findOneAndUpdate(
      { key },
      { $inc: { sequence: 1 } },
      { upsert: true, new: true },
    );
    return doc.sequence;
  }
}

export const srCounterService = new SrCounterService();
