/**
 * Seed or update the Air Flow Recovery Test template for one or all organizations.
 *
 * Usage:
 *   pnpm script:seed-air-flow-recovery-test --org-id <id> --confirm
 *   pnpm script:seed-air-flow-recovery-test --all-orgs --confirm
 */

import '../src/config/env';
import mongoose, { Types } from 'mongoose';
import { env } from '../src/config/env';
import { OrganizationModel } from '../src/modules/organization/organization.model';
import { TestTypeModel } from '../src/modules/test-type/test-type.model';
import { AIR_FLOW_RECOVERY_TEST_PRESET } from '../src/modules/test-type/presets/air-flow-recovery-test.preset';
import { orgFilter } from '../src/utils/tenant';

const args = process.argv.slice(2);
const confirmed = args.includes('--confirm');
const allOrgs = args.includes('--all-orgs');

function getArg(flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1 || index + 1 >= args.length) return undefined;
  return args[index + 1];
}

const orgId = getArg('--org-id');

async function upsertForOrg(organizationId: string, orgName: string) {
  const existing = await TestTypeModel.findOne({
    ...orgFilter(organizationId),
    code: AIR_FLOW_RECOVERY_TEST_PRESET.code,
  });

  const payload = {
    ...AIR_FLOW_RECOVERY_TEST_PRESET,
    organizationId: new Types.ObjectId(organizationId),
    isActive: true,
  };

  if (existing) {
    if (!confirmed) {
      console.log(
        `  UPDATE ${orgName} — existing "${AIR_FLOW_RECOVERY_TEST_PRESET.name}" (${existing.code})`,
      );
      return 'update';
    }
    await TestTypeModel.findByIdAndUpdate(existing._id, payload, {
      new: true,
      runValidators: true,
    });
    console.log(
      `  UPDATED ${orgName} — ${AIR_FLOW_RECOVERY_TEST_PRESET.name} (${existing.code})`,
    );
    return 'updated';
  }

  if (!confirmed) {
    console.log(`  CREATE ${orgName} — ${AIR_FLOW_RECOVERY_TEST_PRESET.name}`);
    return 'create';
  }

  const created = await TestTypeModel.create(payload);
  console.log(
    `  CREATED ${orgName} — ${AIR_FLOW_RECOVERY_TEST_PRESET.name} (${created.code})`,
  );
  return 'created';
}

async function run() {
  if (!orgId && !allOrgs) {
    console.error('Provide --org-id <id> or --all-orgs');
    process.exit(1);
  }

  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log(`Connected — db: ${env.mongodbDb}`);
  console.log(confirmed ? 'MODE: WRITE (--confirm)\n' : 'MODE: DRY RUN\n');

  const orgs = allOrgs
    ? await OrganizationModel.find({}).lean()
    : [await OrganizationModel.findById(orgId).lean()].filter(Boolean);

  if (orgs.length === 0) {
    console.error('No organizations matched.');
    process.exit(1);
  }

  let created = 0;
  let updated = 0;
  let pending = 0;

  for (const org of orgs) {
    const id = org!._id.toString();
    const result = await upsertForOrg(id, org!.companyName);
    if (result === 'created') created += 1;
    else if (result === 'updated') updated += 1;
    else pending += 1;
  }

  console.log('\nSummary:');
  console.log(`  organizations : ${orgs.length}`);
  console.log(`  created       : ${created}`);
  console.log(`  updated       : ${updated}`);
  if (!confirmed) {
    console.log(`  pending       : ${pending}`);
    console.log('\nRe-run with --confirm to write.');
  }
}

run()
  .catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
