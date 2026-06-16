import { Model } from 'mongoose';
import { AppError } from '../../utils/app-error';
import { orgFilter } from '../../utils/tenant';
import { srCounterService } from './sr-counter.service';

const MAX_CODE_ATTEMPTS = 5;

export function isMongoDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 11000
  );
}

export async function maxPrefixedCodeSequence(
  model: Model<{ code?: string }>,
  organizationId: string,
  prefix: string,
): Promise<number> {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(`^${escaped}(\\d+)$`);
  const docs = await model
    .find({ ...orgFilter(organizationId), code: new RegExp(`^${escaped}`) })
    .select('code')
    .lean();

  let max = 0;
  for (const doc of docs) {
    const match = doc.code?.match(rx);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return max;
}

export async function createWithPrefixedCode<T>(
  model: Model<{ code?: string }>,
  organizationId: string,
  prefix: string,
  counterKey: string,
  formatCode: (seq: number) => string,
  payload: Record<string, unknown>,
): Promise<T> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const floor = await maxPrefixedCodeSequence(model, organizationId, prefix);
    const seq = await srCounterService.nextSequenceWithFloor(counterKey, floor, organizationId);
    const code = formatCode(seq);

    try {
      return (await model.create({ ...payload, code })) as T;
    } catch (err) {
      if (isMongoDuplicateKeyError(err) && attempt < MAX_CODE_ATTEMPTS - 1) continue;
      throw err;
    }
  }

  throw new AppError(500, `Failed to allocate a unique ${prefix} code`);
}
