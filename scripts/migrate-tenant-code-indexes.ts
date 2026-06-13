/**
 * Drops global code_1 indexes and creates compound { organizationId, code } unique indexes.
 *
 * Usage:
 *   pnpm script:migrate-tenant-code-indexes
 *   pnpm script:migrate-tenant-code-indexes --confirm
 */

import '../src/config/env';
import mongoose, { Model } from 'mongoose';
import { env } from '../src/config/env';
import { LeadModel } from '../src/modules/lead/lead.model';
import { ProspectModel } from '../src/modules/prospect/prospect.model';
import { OpportunityModel } from '../src/modules/opportunity/opportunity.model';
import { VisitModel } from '../src/modules/visit/visit.model';
import { CustomerModel } from '../src/modules/customer/customer.model';
import { EquipmentModel } from '../src/modules/equipment/equipment.model';
import { MasterInstrumentModel } from '../src/modules/instrument/instrument.model';
import { TestTypeModel } from '../src/modules/test-type/test-type.model';

const confirmed = process.argv.includes('--confirm');

const COLLECTIONS: { label: string; model: Model<unknown> }[] = [
  { label: 'leads', model: LeadModel },
  { label: 'prospects', model: ProspectModel },
  { label: 'opportunities', model: OpportunityModel },
  { label: 'visits', model: VisitModel },
  { label: 'customers', model: CustomerModel },
  { label: 'equipment', model: EquipmentModel },
  { label: 'masterinstruments', model: MasterInstrumentModel },
  { label: 'testtypes', model: TestTypeModel },
];

function hasCompoundCodeIndex(indexes: { key?: Record<string, number>; unique?: boolean }[]): boolean {
  return indexes.some(
    (idx) =>
      idx.key?.organizationId === 1 &&
      idx.key?.code === 1 &&
      idx.unique === true,
  );
}

async function migrateCollection(label: string, model: Model<unknown>): Promise<void> {
  const collection = model.collection;
  const indexes = await collection.indexes();

  console.log(`\n[${label}]`);
  for (const idx of indexes) {
    console.log(`  ${idx.name}: ${JSON.stringify(idx.key)}`);
  }

  const hasGlobalCode = indexes.some((idx) => idx.name === 'code_1');
  const hasCompound = hasCompoundCodeIndex(indexes);

  if (!confirmed) {
    if (hasGlobalCode) console.log('  Will drop: code_1');
    if (!hasCompound) console.log('  Will create: { organizationId: 1, code: 1 } unique');
    return;
  }

  if (hasGlobalCode) {
    await collection.dropIndex('code_1');
    console.log('  Dropped index: code_1');
  }

  if (!hasCompound) {
    await collection.createIndex({ organizationId: 1, code: 1 }, { unique: true });
    console.log('  Created index: organizationId_1_code_1');
  }

  if (label === 'masterinstruments') {
    const legacyIndexes = ['serialNumber_1', 'certificateNumber_1'];
    for (const name of legacyIndexes) {
      const current = await collection.indexes();
      if (current.some((idx) => idx.name === name)) {
        await collection.dropIndex(name);
        console.log(`  Dropped index: ${name}`);
      }
    }
    for (const [fields, label] of [
      [{ organizationId: 1, serialNumber: 1 }, 'organizationId_1_serialNumber_1'],
      [{ organizationId: 1, certificateNumber: 1 }, 'organizationId_1_certificateNumber_1'],
    ] as const) {
      try {
        await collection.createIndex(fields, { unique: true });
        console.log(`  Created index: ${label}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`  Skipped ${label} — resolve duplicate data first: ${msg}`);
      }
    }
  }

  const after = await collection.indexes();
  console.log('  Indexes after migration:');
  for (const idx of after) {
    console.log(`    ${idx.name}: ${JSON.stringify(idx.key)}`);
  }
}

async function run() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log(`Connected — db: ${env.mongodbDb}`);
  if (!confirmed) console.log('\nDRY RUN — re-run with --confirm to apply');

  for (const { label, model } of COLLECTIONS) {
    await migrateCollection(label, model);
  }
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
