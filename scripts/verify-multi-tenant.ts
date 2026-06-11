/**
 * Verify all collections have organizationId set.
 *
 * Usage:
 *   pnpm script:verify-multi-tenant
 */

import '../src/config/env';
import mongoose, { Model } from 'mongoose';
import { env } from '../src/config/env';
import { UserModel } from '../src/modules/user/user.model';
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
import { OrganizationModel } from '../src/modules/organization/organization.model';

const COLLECTIONS: Array<{ label: string; model: Model<unknown> }> = [
  { label: 'users', model: UserModel as Model<unknown> },
  { label: 'customers', model: CustomerModel as Model<unknown> },
  { label: 'sites', model: SiteModel as Model<unknown> },
  { label: 'leads', model: LeadModel as Model<unknown> },
  { label: 'lead-segments', model: LeadSegmentModel as Model<unknown> },
  { label: 'prospects', model: ProspectModel as Model<unknown> },
  { label: 'opportunities', model: OpportunityModel as Model<unknown> },
  { label: 'activities', model: ActivityModel as Model<unknown> },
  { label: 'quotes', model: QuoteModel as Model<unknown> },
  { label: 'visits', model: VisitModel as Model<unknown> },
  { label: 'visit-tasks', model: VisitTaskModel as Model<unknown> },
  { label: 'test-results', model: TaskTestResultModel as Model<unknown> },
  { label: 'reports', model: ReportModel as Model<unknown> },
  { label: 'instruments', model: MasterInstrumentModel as Model<unknown> },
  { label: 'equipment', model: EquipmentModel as Model<unknown> },
  { label: 'test-types', model: TestTypeModel as Model<unknown> },
  { label: 'tc-templates', model: TcTemplateModel as Model<unknown> },
  { label: 'audit-logs', model: AuditLogModel as Model<unknown> },
  { label: 'notifications', model: NotificationModel as Model<unknown> },
  { label: 'sr-counters', model: SrCounterModel as Model<unknown> },
];

async function countMissing(model: Model<unknown>): Promise<number> {
  return model.countDocuments({
    $or: [{ organizationId: null }, { organizationId: { $exists: false } }],
  });
}

async function run() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log(`Connected — db: ${env.mongodbDb}\n`);

  if (!UserModel.schema.paths.organizationId) {
    console.error('User model missing organizationId — stale .model.js files may shadow .ts schemas.');
    process.exit(1);
  }

  let hasMissing = false;
  for (const { label, model } of COLLECTIONS) {
    const missing = await countMissing(model);
    const total = await model.countDocuments();
    console.log(`${label.padEnd(16)} ${missing} missing / ${total} total`);
    if (missing > 0) hasMissing = true;
  }

  const orgCount = await OrganizationModel.countDocuments();
  console.log(`\norganizations     ${orgCount} total`);

  if (hasMissing) {
    console.error('\nVerification failed.');
    process.exit(1);
  }

  console.log('\nVerification passed.');
}

run()
  .catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
