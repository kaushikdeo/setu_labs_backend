/**
 * Clone test types from one organization to another.
 *
 * Usage:
 *   pnpm script:clone-test-types --from-org-id <id> --to-org-id <id>
 *   pnpm script:clone-test-types --from-org-id <id> --to-org-id <id> --code AIR_VELOCITY_TEST_AREA
 *   pnpm script:clone-test-types --from-org-id <id> --to-org-id <id> --include-inactive
 *   pnpm script:clone-test-types --from-org-id <id> --to-org-id <id> --confirm
 *
 * Skips when target org already has a test type with the same name (--force to override).
 */

import '../src/config/env';
import mongoose, { Types } from 'mongoose';
import { env } from '../src/config/env';
import { OrganizationModel } from '../src/modules/organization/organization.model';
import { TestTypeModel, ITestType } from '../src/modules/test-type/test-type.model';
import { appendUniqueId, orgFilter } from '../src/utils/tenant';

const args = process.argv.slice(2);
const confirmed = args.includes('--confirm');
const includeInactive = args.includes('--include-inactive');
const skipExisting = !args.includes('--force');

function getArg(flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1 || index + 1 >= args.length) return undefined;
  return args[index + 1];
}

const fromOrgId = getArg('--from-org-id');
const toOrgId = getArg('--to-org-id');
const codeFilter = getArg('--code');

function clonePayload(
  source: ITestType,
  targetOrgId: Types.ObjectId,
): Record<string, unknown> {
  return {
    code: appendUniqueId(source.code),
    name: source.name,
    abbreviation: source.abbreviation,
    description: source.description,
    category: source.category,
    requiredInstrumentType: source.requiredInstrumentType,
    applicableEquipmentTypes: [...(source.applicableEquipmentTypes ?? [])],
    headerFields: source.headerFields?.map((f) => ({ ...f })) ?? [],
    tableColumns: source.tableColumns?.map((c) => ({ ...c })) ?? [],
    resultSummaryColumns: source.resultSummaryColumns?.map((c) => ({ ...c })) ?? [],
    acceptanceCriteria: {
      description: source.acceptanceCriteria?.description ?? '',
      thresholds: JSON.parse(JSON.stringify(source.acceptanceCriteria?.thresholds ?? {})),
    },
    calculationKey: source.calculationKey,
    showEquipmentDetails: source.showEquipmentDetails,
    showGraph: source.showGraph,
    dueDateDays: source.dueDateDays,
    isActive: source.isActive,
    organizationId: targetOrgId,
  };
}

async function resolveOrg(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    console.error(`Invalid organization id: ${id}`);
    process.exit(1);
  }
  const org = await OrganizationModel.findById(id).lean();
  if (!org) {
    console.error(`Organization not found: ${id}`);
    process.exit(1);
  }
  return org;
}

async function findExistingInTarget(
  targetOrgId: string,
  source: ITestType,
): Promise<ITestType | null> {
  return TestTypeModel.findOne({
    ...orgFilter(targetOrgId),
    name: source.name,
  });
}

async function run() {
  if (!fromOrgId || !toOrgId) {
    console.error('Missing required arguments.');
    console.error('Usage:');
    console.error(
      '  pnpm script:clone-test-types --from-org-id <id> --to-org-id <id> [--code <code>] [--include-inactive] [--force] [--confirm]',
    );
    process.exit(1);
  }

  if (fromOrgId === toOrgId) {
    console.error('Source and target organization must differ.');
    process.exit(1);
  }

  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log(`Connected — db: ${env.mongodbDb}`);
  console.log(confirmed ? 'MODE: WRITE (--confirm)\n' : 'MODE: DRY RUN\n');

  const [fromOrg, toOrg] = await Promise.all([resolveOrg(fromOrgId), resolveOrg(toOrgId)]);
  console.log(`From: ${fromOrg.companyName} (${fromOrgId})`);
  console.log(`To:   ${toOrg.companyName} (${toOrgId})\n`);

  const filter: Record<string, unknown> = { ...orgFilter(fromOrgId) };
  if (!includeInactive) filter.isActive = true;
  if (codeFilter) {
    filter.$or = [{ code: codeFilter }, { code: new RegExp(`^${codeFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_`, 'i') }];
  }

  const sources = await TestTypeModel.find(filter).sort({ name: 1 }).lean();
  if (sources.length === 0) {
    console.log('No test types matched.');
    return;
  }

  console.log(`Found ${sources.length} test type(s) to clone.\n`);

  let cloned = 0;
  let skipped = 0;

  for (const source of sources) {
    const existing = skipExisting
      ? await findExistingInTarget(toOrgId, source as ITestType)
      : null;

    if (existing) {
      skipped += 1;
      console.log(`SKIP  ${source.name} (${source.code}) — already exists as ${existing.code}`);
      continue;
    }

    const payload = clonePayload(source as ITestType, new Types.ObjectId(toOrgId));
    console.log(`CLONE ${source.name}`);
    console.log(`      source code: ${source.code}`);
    console.log(`      new code:    ${payload.code}`);

    if (confirmed) {
      await TestTypeModel.create(payload);
      cloned += 1;
    }
  }

  console.log('\nSummary:');
  console.log(`  matched : ${sources.length}`);
  console.log(`  cloned  : ${cloned}`);
  console.log(`  skipped : ${skipped}`);

  if (!confirmed) {
    console.log(`  (dry run — ${sources.length - skipped} would clone; add --confirm to write)`);
    console.log('\nRe-run with --confirm to write. Use --force to clone even if the same name exists in target.');
  }
}

run()
  .catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
