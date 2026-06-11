/**
 * Usage:
 *   pnpm script:create-super-admin --email admin@example.com --name "Admin User" --password 'SecurePass123'
 */

import '../src/config/env';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env';
import { UserModel, UserRole } from '../src/modules/user/user.model';
import { createStubOrganization } from '../src/utils/org-provisioning';
import { OrganizationModel } from '../src/modules/organization/organization.model';

const SALT_ROUNDS = 12;

const args = process.argv.slice(2);

function getArg(flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1 || index + 1 >= args.length) return undefined;
  return args[index + 1];
}

const email = getArg('--email');
const name = getArg('--name');
const password = getArg('--password');

async function run() {
  if (!email || !name || !password) {
    console.error('Missing required arguments.');
    console.error(
      'Usage: pnpm script:create-super-admin --email <email> --name <name> --password <password>',
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log(`Connected to MongoDB — db: ${env.mongodbDb}\n`);

  const normalizedEmail = email.toLowerCase();
  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) {
    console.error(`User already exists with email: ${normalizedEmail}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const organization = await createStubOrganization({ name, email: normalizedEmail }, normalizedEmail);

  const user = await UserModel.create({
    email: normalizedEmail,
    name,
    passwordHash,
    role: UserRole.SUPER_ADMIN,
    organizationId: organization._id,
    onboardingCompleted: false,
  });

  await OrganizationModel.findByIdAndUpdate(organization._id, {
    createdBy: user._id.toString(),
  });

  console.log('Super admin created:');
  console.log(`  id                  : ${user._id.toString()}`);
  console.log(`  email               : ${user.email}`);
  console.log(`  name                : ${user.name}`);
  console.log(`  role                : ${user.role}`);
  console.log(`  organizationId      : ${organization._id.toString()}`);
  console.log(`  onboardingCompleted : ${user.onboardingCompleted}`);
  console.log('\nSign in and complete onboarding to fill organization profile.');
}

run()
  .catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
