/**
 * One-time migration: converts flat threshold shape → ISO-class-keyed shape.
 *
 * Old flat shapes handled:
 *   particle_count   : { 'ISO 5_0_5um': 3520, 'ISO 5_5um': 29, ... }
 *   air / hepa       : { minAcph: 20, maxPaoLeakagePercent: 0.01, ... }
 *
 * New shape for all: Record<isoClass|'default', Record<fieldKey, { min?, max? }>>
 */
import mongoose from 'mongoose';
import { TestTypeModel } from '../modules/test-type/test-type.model';
import { env } from '../config/env';

const ISO_CLASSES = ['ISO 5', 'ISO 6', 'ISO 7', 'ISO 8', 'Grade A', 'Grade B', 'Grade C', 'Grade D'];

type IsoClassEntry = { description?: string; fields: Record<string, { min?: number; max?: number }> };

const PARTICLE_DEFAULTS: Record<string, IsoClassEntry> = {
  'ISO 5':   { description: '≥0.5µm ≤ 3,520/m³; ≥5µm ≤ 29/m³',           fields: { count_0_5um: { max: 3520 },      count_5um: { max: 29 } } },
  'ISO 6':   { description: '≥0.5µm ≤ 35,200/m³; ≥5µm ≤ 293/m³',         fields: { count_0_5um: { max: 35200 },     count_5um: { max: 293 } } },
  'ISO 7':   { description: '≥0.5µm ≤ 352,000/m³; ≥5µm ≤ 2,930/m³',      fields: { count_0_5um: { max: 352000 },    count_5um: { max: 2930 } } },
  'ISO 8':   { description: '≥0.5µm ≤ 3,520,000/m³; ≥5µm ≤ 29,300/m³',   fields: { count_0_5um: { max: 3520000 },   count_5um: { max: 29300 } } },
  'Grade A': { description: '≥0.5µm ≤ 3,520/m³; ≥5µm ≤ 20/m³',           fields: { count_0_5um: { max: 3520 },      count_5um: { max: 20 } } },
  'Grade B': { description: '≥0.5µm ≤ 352,000/m³; ≥5µm ≤ 2,900/m³',      fields: { count_0_5um: { max: 352000 },    count_5um: { max: 2900 } } },
  'Grade C': { description: '≥0.5µm ≤ 3,520,000/m³; ≥5µm ≤ 29,000/m³',   fields: { count_0_5um: { max: 3520000 },   count_5um: { max: 29000 } } },
  'Grade D': { description: '≥0.5µm ≤ 10,000,000/m³; ≥5µm ≤ 100,000/m³', fields: { count_0_5um: { max: 10000000 },  count_5um: { max: 100000 } } },
};

function isAlreadyMigrated(thresholds: Record<string, any>): boolean {
  const firstVal = Object.values(thresholds)[0];
  if (firstVal == null) return true;
  // New format has { description?, fields: {...} } per class
  return typeof firstVal === 'object' && 'fields' in firstVal;
}

function buildClassEntry(fields: Record<string, { min?: number; max?: number }>, description: string): IsoClassEntry {
  return { description, fields };
}

function migrateFlat(
  thresholds: Record<string, any>,
  calcKey: string,
): Record<string, IsoClassEntry> {
  if (calcKey === 'particle_count') {
    return PARTICLE_DEFAULTS;
  }

  const resolveNum = (v: any): number | undefined => {
    if (typeof v === 'number') return v;
    if (typeof v === 'object' && v !== null) return v.min ?? v.max ?? undefined;
    return undefined;
  };

  const minAcph = resolveNum(thresholds.actualAcph ?? thresholds.minAcph);
  const maxPao = resolveNum(thresholds.paoLeakagePercent ?? thresholds.maxPaoLeakagePercent);

  const fields: Record<string, { min?: number; max?: number }> = {};
  if (minAcph != null) fields['minAcph'] = { min: minAcph };
  if (maxPao != null) fields['maxPaoLeakagePercent'] = { max: maxPao };

  if (Object.keys(fields).length === 0) return {};

  const desc = calcKey === 'hepa_filter_integrity'
    ? `PAO leakage ≤ ${maxPao ?? 0.01}% of upstream concentration`
    : `ACPH ≥ ${minAcph ?? 20} ACH; PAO leakage ≤ ${maxPao ?? 0.01}%`;

  return Object.fromEntries([...ISO_CLASSES, 'default'].map((cls) => [cls, buildClassEntry(fields, desc)]));
}

async function run() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log('Connected to MongoDB');

  const all = await TestTypeModel.find({});
  let migrated = 0;

  for (const tt of all) {
    const thresholds = (tt.acceptanceCriteria?.thresholds ?? {}) as Record<string, any>;

    if (isAlreadyMigrated(thresholds)) {
      console.log(`  SKIP (already migrated): ${tt.name}`);
      continue;
    }

    const newThresholds = migrateFlat(thresholds, tt.calculationKey);
    await TestTypeModel.findByIdAndUpdate(tt._id, {
      $set: { 'acceptanceCriteria.thresholds': newThresholds },
    });
    console.log(`  MIGRATED: ${tt.name}`);
    migrated++;
  }

  console.log(`\nDone. ${migrated} test type(s) migrated.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
