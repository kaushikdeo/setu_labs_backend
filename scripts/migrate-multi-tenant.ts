/**
 * Multi-tenant data migration (Wave 1 backfill).
 *
 * Usage:
 *   pnpm script:migrate-multi-tenant
 *   pnpm script:migrate-multi-tenant --user-org-map ./migration-user-org.json
 *   pnpm script:migrate-multi-tenant --primary-org-id <orgId> --confirm
 *   pnpm script:migrate-multi-tenant --user-org-map ./map.json --confirm
 */

import '../src/config/env';
import fs from 'node:fs';
import mongoose, { Model, Types } from 'mongoose';
import { env } from '../src/config/env';
import { UserModel, UserRole } from '../src/modules/user/user.model';
import { OrganizationModel } from '../src/modules/organization/organization.model';
import { createStubOrganization } from '../src/utils/org-provisioning';
import { CustomerModel } from '../src/modules/customer/customer.model';
import { SiteModel } from '../src/modules/customer/site.model';
import { LeadModel } from '../src/modules/lead/lead.model';
import { LeadSegmentModel } from '../src/modules/lead/lead-segment.model';
import { ProspectModel } from '../src/modules/prospect/prospect.model';
import { OpportunityModel } from '../src/modules/opportunity/opportunity.model';
import { ActivityModel } from '../src/modules/activity/activity.model';
import { QuoteModel } from '../src/modules/quote/quote.model';
import { VisitModel } from '../src/modules/visit/visit.model';
import { VisitTaskModel } from '../src/modules/visit/visit-task.model';
import { TaskTestResultModel } from '../src/modules/test-result/test-result.model';
import { ReportModel } from '../src/modules/report/report.model';
import { MasterInstrumentModel } from '../src/modules/instrument/instrument.model';
import { EquipmentModel } from '../src/modules/equipment/equipment.model';
import { TestTypeModel } from '../src/modules/test-type/test-type.model';
import { TcTemplateModel } from '../src/modules/tc-template/tc-template.model';
import { AuditLogModel } from '../src/modules/audit/audit.model';
import { NotificationModel } from '../src/modules/notification/notification.model';
import { SrCounterModel } from '../src/modules/sr-counter/sr-counter.model';

const args = process.argv.slice(2);
const confirmed = args.includes('--confirm');

function getArg(flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1 || index + 1 >= args.length) return undefined;
  return args[index + 1];
}

const userOrgMapPath = getArg('--user-org-map');
const primaryOrgIdArg = getArg('--primary-org-id');

type OwnerField = 'createdBy' | 'userId' | 'recipientUserId' | 'primary';

interface CollectionConfig {
  label: string;
  model: Model<unknown>;
  ownerField: OwnerField;
}

const COLLECTIONS: CollectionConfig[] = [
  { label: 'customers', model: CustomerModel as Model<unknown>, ownerField: 'createdBy' },
  { label: 'sites', model: SiteModel as Model<unknown>, ownerField: 'createdBy' },
  { label: 'leads', model: LeadModel as Model<unknown>, ownerField: 'createdBy' },
  { label: 'lead-segments', model: LeadSegmentModel as Model<unknown>, ownerField: 'createdBy' },
  { label: 'prospects', model: ProspectModel as Model<unknown>, ownerField: 'createdBy' },
  { label: 'opportunities', model: OpportunityModel as Model<unknown>, ownerField: 'createdBy' },
  { label: 'activities', model: ActivityModel as Model<unknown>, ownerField: 'createdBy' },
  { label: 'quotes', model: QuoteModel as Model<unknown>, ownerField: 'createdBy' },
  { label: 'visits', model: VisitModel as Model<unknown>, ownerField: 'createdBy' },
  { label: 'visit-tasks', model: VisitTaskModel as Model<unknown>, ownerField: 'createdBy' },
  { label: 'test-results', model: TaskTestResultModel as Model<unknown>, ownerField: 'createdBy' },
  { label: 'reports', model: ReportModel as Model<unknown>, ownerField: 'createdBy' },
  { label: 'instruments', model: MasterInstrumentModel as Model<unknown>, ownerField: 'createdBy' },
  { label: 'equipment', model: EquipmentModel as Model<unknown>, ownerField: 'createdBy' },
  { label: 'test-types', model: TestTypeModel as Model<unknown>, ownerField: 'primary' },
  { label: 'tc-templates', model: TcTemplateModel as Model<unknown>, ownerField: 'createdBy' },
  { label: 'audit-logs', model: AuditLogModel as Model<unknown>, ownerField: 'userId' },
  { label: 'notifications', model: NotificationModel as Model<unknown>, ownerField: 'recipientUserId' },
];

function loadUserOrgMap(filePath: string): Record<string, string> {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw) as Record<string, string>;
  const normalized: Record<string, string> = {};
  for (const [email, orgId] of Object.entries(parsed)) {
    normalized[email.toLowerCase()] = orgId;
  }
  return normalized;
}

function resolveOrgForOwner(
  ownerId: string | null | undefined,
  userOrgMap: Map<string, string>,
  primaryOrgId: string,
): string {
  if (!ownerId) return primaryOrgId;
  return userOrgMap.get(ownerId) ?? primaryOrgId;
}

async function countMissing(model: Model<unknown>): Promise<number> {
  return model.countDocuments({
    $or: [{ organizationId: null }, { organizationId: { $exists: false } }],
  });
}

async function run() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log(`Connected to MongoDB — db: ${env.mongodbDb}`);
  console.log(confirmed ? 'MODE: WRITE (--confirm)\n' : 'MODE: DRY RUN (no writes)\n');

  if (!UserModel.schema.paths.organizationId || !LeadModel.schema.paths.organizationId) {
    console.error(
      'Models missing organizationId in schema. Remove stale src/modules/**/*.model.js files that shadow .ts schemas.',
    );
    process.exit(1);
  }

  const manualEmailOrgMap = userOrgMapPath ? loadUserOrgMap(userOrgMapPath) : {};
  const users = await UserModel.find().lean();
  const superAdmins = users.filter((u) => u.role === UserRole.SUPER_ADMIN);
  const existingOrgs = await OrganizationModel.find().lean();

  console.log('Preflight:');
  console.log(`  users        : ${users.length}`);
  console.log(`  super_admins : ${superAdmins.length}`);
  console.log(`  organizations: ${existingOrgs.length}`);

  const adminOrgMap = new Map<string, string>();
  const orgsToCreate: Array<{ adminId: string; adminName: string; adminEmail: string }> = [];

  for (const admin of superAdmins) {
    const adminId = admin._id.toString();
    const matchedOrg = existingOrgs.find((o) => o.createdBy === adminId);
    if (matchedOrg) {
      adminOrgMap.set(adminId, matchedOrg._id.toString());
      console.log(`  super_admin ${admin.email} → existing org ${matchedOrg.companyName} (${matchedOrg._id})`);
    } else {
      orgsToCreate.push({ adminId, adminName: admin.name, adminEmail: admin.email });
      console.log(`  super_admin ${admin.email} → will create stub org`);
    }
  }

  let primaryOrgId = primaryOrgIdArg;
  if (!primaryOrgId) {
    if (existingOrgs.length === 1) {
      primaryOrgId = existingOrgs[0]._id.toString();
    } else if (existingOrgs.length > 1) {
      const flagged = existingOrgs[0]._id.toString();
      primaryOrgId = flagged;
      console.log(`  WARNING: multiple orgs — using first as primary (${flagged}). Pass --primary-org-id to override.`);
    } else if (superAdmins.length > 0) {
      primaryOrgId = adminOrgMap.get(superAdmins[0]._id.toString()) ?? 'PENDING_PRIMARY_ORG';
    }
  }

  if (!primaryOrgId) {
    console.error('Cannot determine primary org. Create an organization or pass --primary-org-id.');
    process.exit(1);
  }

  console.log(`  primary org  : ${primaryOrgId}`);

  const userOrgMap = new Map<string, string>();

  for (const admin of superAdmins) {
    const adminId = admin._id.toString();
    if (adminOrgMap.has(adminId)) {
      userOrgMap.set(adminId, adminOrgMap.get(adminId)!);
    }
  }

  const unmappedStaff: string[] = [];

  for (const user of users) {
    const userId = user._id.toString();
    if (userOrgMap.has(userId)) continue;

    const manualOrg = manualEmailOrgMap[user.email.toLowerCase()];
    if (manualOrg) {
      userOrgMap.set(userId, manualOrg);
      continue;
    }

    if (user.role === UserRole.CUSTOMER) {
      continue;
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      userOrgMap.set(userId, primaryOrgId);
      unmappedStaff.push(`${user.email} (${user.role}) → primary org (default)`);
    }
  }

  if (unmappedStaff.length > 0) {
    console.log('\nStaff assigned to primary org by default:');
    for (const line of unmappedStaff) console.log(`  ${line}`);
    console.log('  Override with --user-org-map if needed.');
  }

  if (!confirmed) {
    console.log('\nDry-run summary (no changes written):');
    console.log(`  stub orgs to create: ${orgsToCreate.length}`);
    console.log(`  users to backfill   : ${users.filter((u) => !u.organizationId).length}`);

    for (const { label, model } of COLLECTIONS) {
      const missing = await countMissing(model);
      console.log(`  ${label.padEnd(16)}: ${missing} missing organizationId`);
    }
    const srMissing = await countMissing(SrCounterModel as Model<unknown>);
    console.log(`  ${'sr-counters'.padEnd(16)}: ${srMissing} missing organizationId`);

    console.log('\nRe-run with --confirm to apply. Take a MongoDB backup first.');
    return;
  }

  for (const pending of orgsToCreate) {
    const admin = await UserModel.findById(pending.adminId);
    if (!admin) continue;
    const org = await createStubOrganization(
      { name: admin.name, email: admin.email },
      adminId,
    );
    const orgId = org._id.toString();
    adminOrgMap.set(pending.adminId, orgId);
    userOrgMap.set(pending.adminId, orgId);
    console.log(`Created stub org for ${pending.adminEmail}: ${orgId}`);
    if (primaryOrgId === 'PENDING_PRIMARY_ORG') {
      primaryOrgId = orgId;
    }
  }

  if (primaryOrgId === 'PENDING_PRIMARY_ORG') {
    const first = adminOrgMap.values().next().value;
    if (!first) {
      console.error('No organization available for primary org assignment.');
      process.exit(1);
    }
    primaryOrgId = first;
  }

  for (const [userId, orgId] of userOrgMap.entries()) {
    await UserModel.updateOne(
      {
        _id: new Types.ObjectId(userId),
        $or: [{ organizationId: null }, { organizationId: { $exists: false } }],
      },
      { $set: { organizationId: new Types.ObjectId(orgId) } },
    );
  }

  let orphanCount = 0;

  for (const { label, model, ownerField } of COLLECTIONS) {
    const docs = await model
      .find({ $or: [{ organizationId: null }, { organizationId: { $exists: false } }] })
      .select({ _id: 1, createdBy: 1, userId: 1, recipientUserId: 1 })
      .lean();

    let updated = 0;
    for (const doc of docs) {
      const d = doc as Record<string, unknown>;
      let orgId: string;

      if (ownerField === 'primary') {
        orgId = primaryOrgId;
      } else if (ownerField === 'createdBy') {
        orgId = resolveOrgForOwner(d.createdBy as string | undefined, userOrgMap, primaryOrgId);
        if (!d.createdBy) orphanCount++;
      } else if (ownerField === 'userId') {
        orgId = resolveOrgForOwner(d.userId as string | undefined, userOrgMap, primaryOrgId);
        if (!d.userId) orphanCount++;
      } else {
        const recipientId = (d.recipientUserId as Types.ObjectId | undefined)?.toString();
        orgId = resolveOrgForOwner(recipientId, userOrgMap, primaryOrgId);
        if (!recipientId) orphanCount++;
      }

      await model.updateOne({ _id: d._id }, { $set: { organizationId: new Types.ObjectId(orgId) } });
      updated++;
    }
    console.log(`Backfilled ${label}: ${updated}`);
  }

  const customerUsers = users.filter((u) => u.role === UserRole.CUSTOMER && u.customerId);
  let customerUsersUpdated = 0;
  for (const user of customerUsers) {
    const customer = await CustomerModel.findById(user.customerId).lean();
    if (!customer?.organizationId) continue;
    await UserModel.updateOne(
      { _id: user._id },
      { $set: { organizationId: customer.organizationId } },
    );
    userOrgMap.set(user._id.toString(), customer.organizationId.toString());
    customerUsersUpdated++;
  }
  console.log(`Backfilled customer users: ${customerUsersUpdated}`);

  const srDocs = await SrCounterModel.find({
    $or: [{ organizationId: null }, { organizationId: { $exists: false } }],
  });
  for (const doc of srDocs) {
    await SrCounterModel.updateOne(
      { _id: doc._id },
      { $set: { organizationId: new Types.ObjectId(primaryOrgId) } },
    );
  }
  console.log(`Backfilled sr-counters: ${srDocs.length}`);
  if (orphanCount > 0) {
    console.log(`  WARNING: ${orphanCount} record(s) used primary org fallback (missing owner field)`);
  }

  console.log('\nVerification:');
  let hasMissing = false;
  const userMissing = await countMissing(UserModel as Model<unknown>);
  console.log(`  ${'users'.padEnd(16)}: ${userMissing} missing`);
  if (userMissing > 0) hasMissing = true;

  for (const { label, model } of COLLECTIONS) {
    const missing = await countMissing(model);
    console.log(`  ${label.padEnd(16)}: ${missing} missing`);
    if (missing > 0) hasMissing = true;
  }

  const srMissing = await countMissing(SrCounterModel as Model<unknown>);
  console.log(`  ${'sr-counters'.padEnd(16)}: ${srMissing} missing`);
  if (srMissing > 0) hasMissing = true;

  if (hasMissing) {
    console.error('\nMigration incomplete — some records still lack organizationId.');
    process.exit(1);
  }

  console.log('\nMigration complete. All collections have organizationId.');
}

run()
  .catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
