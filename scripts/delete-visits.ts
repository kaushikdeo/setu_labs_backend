/**
 * Usage:
 *   pnpm script:delete-visits                   # dry run — shows what would be deleted
 *   pnpm script:delete-visits --id <visitId>    # delete one visit and its tasks
 *   pnpm script:delete-visits --all             # preview count before deletion
 *   pnpm script:delete-visits --all --confirm   # actually delete ALL visits and tasks
 */

import '../src/config/env';
import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { VisitModel } from '../src/modules/visit/visit.model';
import { VisitTaskModel } from '../src/modules/visit/visit-task.model';

const args = process.argv.slice(2);
const idArg = args.find((_, i) => args[i - 1] === '--id');
const deleteAll = args.includes('--all');
const confirmed = args.includes('--confirm');
const dryRun = !idArg && !deleteAll;

async function run() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log(`Connected to MongoDB — db: ${env.mongodbDb}\n`);

  if (dryRun) {
    const visitCount = await VisitModel.countDocuments();
    const taskCount = await VisitTaskModel.countDocuments();
    console.log(`DRY RUN — no changes made`);
    console.log(`  Visits     : ${visitCount}`);
    console.log(`  Visit tasks: ${taskCount}`);
    console.log(`\nOptions:`);
    console.log(`  --id <visitId>        Delete one visit and its tasks`);
    console.log(`  --all --confirm       Delete ALL visits and all tasks`);
    return;
  }

  if (idArg) {
    if (!mongoose.Types.ObjectId.isValid(idArg)) {
      console.error(`Invalid ObjectId: ${idArg}`);
      process.exit(1);
    }

    const visit = await VisitModel.findById(idArg);
    if (!visit) {
      console.error(`No visit found with id: ${idArg}`);
      process.exit(1);
    }

    const taskCount = await VisitTaskModel.countDocuments({ visitId: visit._id });
    await VisitTaskModel.deleteMany({ visitId: visit._id });
    await VisitModel.deleteOne({ _id: visit._id });

    console.log(`Deleted visit: ${visit.code} (id: ${idArg})`);
    console.log(`Deleted ${taskCount} task(s) for this visit`);
    return;
  }

  if (deleteAll) {
    if (!confirmed) {
      const visitCount = await VisitModel.countDocuments();
      const taskCount = await VisitTaskModel.countDocuments();
      console.log(`This will permanently delete:`);
      console.log(`  ${visitCount} visit(s)`);
      console.log(`  ${taskCount} visit task(s)`);
      console.log(`\nRe-run with --all --confirm to proceed.`);
      return;
    }

    const { deletedCount: tasks } = await VisitTaskModel.deleteMany({});
    const { deletedCount: visits } = await VisitModel.deleteMany({});
    console.log(`Deleted ${visits} visit(s) and ${tasks} task(s)`);
  }
}

run()
  .catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
