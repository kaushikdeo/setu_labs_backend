import { randomBytes } from 'node:crypto';
import { Types } from 'mongoose';
import { AppError } from './app-error';

const UNIQUE_SUFFIX_RE = /_[a-f0-9]{8}$/i;

export function appendUniqueId(value: string): string {
  const base = value.trim().replace(UNIQUE_SUFFIX_RE, '').replace(/_+$/, '');
  const suffix = randomBytes(4).toString('hex');
  return `${base}_${suffix}`;
}

export function orgFilter(organizationId: string): { organizationId: Types.ObjectId } {
  return { organizationId: new Types.ObjectId(organizationId) };
}

export function assertSameOrg(
  doc: { organizationId?: Types.ObjectId | null } | null | undefined,
  organizationId: string,
): void {
  if (!doc?.organizationId) return;
  if (doc.organizationId.toString() !== organizationId) {
    throw new AppError(403, 'Access denied');
  }
}
