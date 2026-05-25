/**
 * Delete visits, test results, test types, instruments, and equipment.
 *
 * Usage:
 *   pnpm script:delete-operational           # dry run
 *   pnpm script:delete-operational --confirm # execute
 */

import '../src/config/env';
import mongoose from 'mongoose';
import { env } from '../src/config/env';

import { TaskTestResultModel } from '../src/modules/test-result/test-result.model';
import { VisitTaskModel } from '../src/modules/visit/visit-task.model';
import { VisitModel } from '../src/modules/visit/visit.model';
import { TestTypeModel } from '../src/modules/test-type/test-type.model';
import { MasterInstrumentModel } from '../src/modules/instrument/instrument.model';
import { EquipmentModel } from '../src/modules/equipment/equipment.model';

const confirmed = process.argv.includes('--confirm');

async function run() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log(`Connected → db: ${env.mongodbDb}\n`);

  const counts = {
    testResults:  await TaskTestResultModel.countDocuments(),
    visitTasks:   await VisitTaskModel.countDocuments(),
    visits:       await VisitModel.countDocuments(),
    testTypes:    await TestTypeModel.countDocuments(),
    instruments:  await MasterInstrumentModel.countDocuments(),
    equipment:    await EquipmentModel.countDocuments(),
  };

  console.log('Current document counts:');
  Object.entries(counts).forEach(([col, n]) => console.log(`  ${col.padEnd(14)}: ${n}`));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`  ${'TOTAL'.padEnd(14)}: ${total}`);

  if (!confirmed) {
    console.log('\nDRY RUN — no changes made.');
    console.log('Re-run with --confirm to delete.');
    return;
  }

  console.log('\nDeleting...');
  const del = async (label: string, fn: () => Promise<mongoose.mongo.DeleteResult>) => {
    const { deletedCount } = await fn();
    console.log(`  ✓ ${label.padEnd(14)}: ${deletedCount} deleted`);
  };

  await del('testResults',  () => TaskTestResultModel.deleteMany({}));
  await del('visitTasks',   () => VisitTaskModel.deleteMany({}));
  await del('visits',       () => VisitModel.deleteMany({}));
  await del('testTypes',    () => TestTypeModel.deleteMany({}));
  await del('instruments',  () => MasterInstrumentModel.deleteMany({}));
  await del('equipment',    () => EquipmentModel.deleteMany({}));

  console.log('\nDone.');
}

run()
  .catch((err) => { console.error('Script failed:', err); process.exit(1); })
  .finally(() => mongoose.disconnect());
