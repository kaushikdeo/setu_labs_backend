/**
 * Drops global testtypes.code_1 index and creates compound { organizationId, code } unique index.
 *
 * Usage:
 *   pnpm script:migrate-test-type-index
 *   pnpm script:migrate-test-type-index --confirm
 */

import '../src/config/env';
import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { TestTypeModel } from '../src/modules/test-type/test-type.model';

const confirmed = process.argv.includes('--confirm');

async function run() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log(`Connected — db: ${env.mongodbDb}\n`);

  const collection = TestTypeModel.collection;
  const indexes = await collection.indexes();
  console.log('Current indexes:');
  for (const idx of indexes) {
    console.log(`  ${idx.name}: ${JSON.stringify(idx.key)}`);
  }

  const hasGlobalCode = indexes.some((idx) => idx.name === 'code_1');
  const hasCompound = indexes.some(
    (idx) =>
      idx.key?.organizationId === 1 &&
      idx.key?.code === 1 &&
      idx.unique === true,
  );

  if (!confirmed) {
    console.log('\nDRY RUN');
    if (hasGlobalCode) console.log('  Will drop: code_1');
    if (!hasCompound) console.log('  Will create: { organizationId: 1, code: 1 } unique');
    console.log('\nRe-run with --confirm to apply.');
    return;
  }

  if (hasGlobalCode) {
    await collection.dropIndex('code_1');
    console.log('Dropped index: code_1');
  }

  await TestTypeModel.syncIndexes();
  console.log('Synced indexes (compound organizationId + code unique).');

  const after = await collection.indexes();
  console.log('\nIndexes after migration:');
  for (const idx of after) {
    console.log(`  ${idx.name}: ${JSON.stringify(idx.key)}`);
  }
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
