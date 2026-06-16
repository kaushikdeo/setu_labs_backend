/**
 * Assigns uuid to leads missing one.
 *
 * Usage:
 *   pnpm script:backfill-lead-uuid
 *   pnpm script:backfill-lead-uuid --confirm
 */

import { randomUUID } from 'crypto';
import '../src/config/env';
import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { LeadModel } from '../src/modules/lead/lead.model';

const confirmed = process.argv.includes('--confirm');

async function run() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  const missing = await LeadModel.countDocuments({
    $or: [{ uuid: { $exists: false } }, { uuid: null }, { uuid: '' }],
  });
  console.log(`Leads missing uuid: ${missing}`);

  if (!confirmed) {
    console.log('Re-run with --confirm to apply.');
    return;
  }

  const cursor = LeadModel.find({
    $or: [{ uuid: { $exists: false } }, { uuid: null }, { uuid: '' }],
  })
    .select('_id')
    .cursor();

  let updated = 0;
  for await (const doc of cursor) {
    await LeadModel.updateOne({ _id: doc._id }, { $set: { uuid: randomUUID() } });
    updated += 1;
  }

  console.log(`Backfilled uuid on ${updated} leads.`);
}

run()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
