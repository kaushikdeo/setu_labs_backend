import { Types } from 'mongoose';
import { AppError } from './app-error';

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
