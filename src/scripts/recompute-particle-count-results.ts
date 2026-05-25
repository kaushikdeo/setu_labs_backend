import mongoose from 'mongoose';
import { TaskTestResultModel } from '../modules/test-result/test-result.model';
import { TestTypeModel } from '../modules/test-type/test-type.model';
import { calculate } from '../modules/test-result/calculations/particle-count';
import { env } from '../config/env';

async function run() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log('Connected to MongoDB');

  const particleTestTypes = await TestTypeModel.find({ calculationKey: 'particle_count' });
  const typeIds = particleTestTypes.map((t) => t._id);

  const results = await TaskTestResultModel.find({ testTypeId: { $in: typeIds } });
  console.log(`Found ${results.length} particle count test result(s)`);

  let patched = 0;
  for (const r of results) {
    const readings = r.readings as any;
    const hasSections = Array.isArray(readings?.sections) && readings.sections.length > 0;
    const hasRows = Array.isArray(readings?.rows) && readings.rows.length > 0;
    const hasCalcSections = Array.isArray((r.calculatedValues as any)?.sections) && (r.calculatedValues as any).sections.length > 0;
    const hasCalcRows = Array.isArray((r.calculatedValues as any)?.rows) && (r.calculatedValues as any).rows.length > 0;

    if (hasCalcSections || hasCalcRows) {
      console.log(`  SKIP (already computed): ${r.reportNumber}`);
      continue;
    }

    if (!hasSections && !hasRows) {
      console.log(`  SKIP (no readings data): ${r.reportNumber}`);
      continue;
    }

    const testType = particleTestTypes.find((t) => t._id.equals(r.testTypeId as any));
    const thresholds = (testType?.acceptanceCriteria?.thresholds ?? {}) as Record<string, number>;

    const { calculatedValues, result, conclusion } = calculate(readings, thresholds);

    await TaskTestResultModel.findByIdAndUpdate(r._id, {
      $set: { calculatedValues, result, conclusion },
    });
    console.log(`  PATCHED: ${r.reportNumber} → ${result}`);
    patched++;
  }

  console.log(`\nDone. ${patched} record(s) recomputed.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
