/**
 * Delete all operational and seed data from every collection.
 *
 * Usage:
 *   pnpm script:delete-all                  # dry run — shows counts only
 *   pnpm script:delete-all --confirm        # wipe all data (keeps users)
 *   pnpm script:delete-all --confirm --all  # wipe all data including users
 */

import '../src/config/env';
import mongoose from 'mongoose';
import { env } from '../src/config/env';

import { TestTypeModel } from '../src/modules/test-type/test-type.model';
import { TaskTestResultModel } from '../src/modules/test-result/test-result.model';
import { VisitTaskModel } from '../src/modules/visit/visit-task.model';
import { VisitModel } from '../src/modules/visit/visit.model';
import { MasterInstrumentModel } from '../src/modules/instrument/instrument.model';
import { EquipmentModel } from '../src/modules/equipment/equipment.model';
import { CustomerModel } from '../src/modules/customer/customer.model';
import { SiteModel } from '../src/modules/customer/site.model';
import { AuditLogModel } from '../src/modules/audit/audit.model';
import { UserModel } from '../src/modules/user/user.model';

const args = process.argv.slice(2);
const confirmed = args.includes('--confirm');
const includeUsers = args.includes('--all');

async function run() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log(`Connected → db: ${env.mongodbDb}\n`);

  const counts = {
    testTypes:       await TestTypeModel.countDocuments(),
    testResults:     await TaskTestResultModel.countDocuments(),
    visitTasks:      await VisitTaskModel.countDocuments(),
    visits:          await VisitModel.countDocuments(),
    instruments:     await MasterInstrumentModel.countDocuments(),
    equipment:       await EquipmentModel.countDocuments(),
    customers:       await CustomerModel.countDocuments(),
    sites:           await SiteModel.countDocuments(),
    auditLogs:       await AuditLogModel.countDocuments(),
    users:           await UserModel.countDocuments(),
  };

  console.log('Current document counts:');
  Object.entries(counts).forEach(([col, n]) => {
    const skip = col === 'users' && !includeUsers;
    console.log(`  ${col.padEnd(14)}: ${n}${skip ? '  (skipped — use --all to include)' : ''}`);
  });

  if (!confirmed) {
    console.log('\nDRY RUN — no changes made.');
    console.log('Re-run with --confirm to delete (add --all to also delete users).');
    return;
  }

  console.log('\nDeleting...');

  const del = async (label: string, fn: () => Promise<mongoose.mongo.DeleteResult>) => {
    const { deletedCount } = await fn();
    console.log(`  ✓ ${label.padEnd(16)}: ${deletedCount} deleted`);
  };

  await del('testResults',   () => TaskTestResultModel.deleteMany({}));
  await del('visitTasks',    () => VisitTaskModel.deleteMany({}));
  await del('visits',        () => VisitModel.deleteMany({}));
  await del('testTypes',     () => TestTypeModel.deleteMany({}));

  // Clear availableTestTypeIds on instruments without deleting the instruments
  const { modifiedCount } = await MasterInstrumentModel.updateMany({}, { $set: { availableTestTypeIds: [] } });
  console.log(`  ✓ instruments      : availableTestTypeIds cleared on ${modifiedCount} document(s)`);

  await del('equipment',     () => EquipmentModel.deleteMany({}));
  await del('customers',     () => CustomerModel.deleteMany({}));
  await del('sites',         () => SiteModel.deleteMany({}));
  await del('auditLogs',     () => AuditLogModel.deleteMany({}));

  if (includeUsers) {
    await del('users',       () => UserModel.deleteMany({}));
  }

  console.log('\nDone.');
}

run()
  .catch((err) => { console.error('Script failed:', err); process.exit(1); })
  .finally(() => mongoose.disconnect());
