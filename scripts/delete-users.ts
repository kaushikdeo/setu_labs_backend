/**
 * Usage:
 *   pnpm script:delete-users                    # dry run — shows what would be deleted
 *   pnpm script:delete-users --email foo@x.com  # delete one user + their audit logs
 *   pnpm script:delete-users --all              # delete ALL users + all audit logs
 *   pnpm script:delete-users --all --confirm    # actually execute --all (safety gate)
 */

import '../src/config/env';
import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { UserModel } from '../src/modules/user/user.model';
import { AuditLogModel } from '../src/modules/audit/audit.model';

const args = process.argv.slice(2);
const emailArg = args.find((_, i) => args[i - 1] === '--email');
const deleteAll = args.includes('--all');
const confirmed = args.includes('--confirm');
const dryRun = !emailArg && !deleteAll;

async function run() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log(`Connected to MongoDB — db: ${env.mongodbDb}\n`);

  if (dryRun) {
    const userCount = await UserModel.countDocuments();
    const auditCount = await AuditLogModel.countDocuments();
    console.log(`DRY RUN — no changes made`);
    console.log(`  Users     : ${userCount}`);
    console.log(`  Audit logs: ${auditCount}`);
    console.log(`\nOptions:`);
    console.log(`  --email <email>       Delete one user and their audit logs`);
    console.log(`  --all --confirm       Delete ALL users and all audit logs`);
    return;
  }

  if (emailArg) {
    const user = await UserModel.findOne({ email: emailArg.toLowerCase() });
    if (!user) {
      console.error(`No user found with email: ${emailArg}`);
      process.exit(1);
    }

    const userId = user._id.toString();
    const auditCount = await AuditLogModel.countDocuments({ userId });

    await UserModel.deleteOne({ _id: user._id });
    await AuditLogModel.deleteMany({ userId });

    console.log(`Deleted user: ${user.name} <${user.email}> (id: ${userId})`);
    console.log(`Deleted ${auditCount} audit log(s) for this user`);
    return;
  }

  if (deleteAll) {
    if (!confirmed) {
      const userCount = await UserModel.countDocuments();
      const auditCount = await AuditLogModel.countDocuments();
      console.log(`This will permanently delete:`);
      console.log(`  ${userCount} user(s)`);
      console.log(`  ${auditCount} audit log(s)`);
      console.log(`\nRe-run with --all --confirm to proceed.`);
      return;
    }

    const { deletedCount: users } = await UserModel.deleteMany({});
    const { deletedCount: audits } = await AuditLogModel.deleteMany({});
    console.log(`Deleted ${users} user(s) and ${audits} audit log(s)`);
  }
}

run()
  .catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
