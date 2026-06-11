import { Types } from 'mongoose';
import { NotificationModel } from './notification.model';
import { AppError } from '../../utils/app-error';
import { orgFilter } from '../../utils/tenant';

export class NotificationService {
  async listForUser(userId: string, organizationId: string, unreadOnly = false) {
    const match: Record<string, unknown> = {
      recipientUserId: new Types.ObjectId(userId),
      ...orgFilter(organizationId),
    };
    if (unreadOnly) match.readAt = null;

    return NotificationModel.find(match).sort({ createdAt: -1 }).limit(50).lean();
  }

  async markRead(id: string, userId: string, organizationId: string) {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid notification id');
    const doc = await NotificationModel.findOneAndUpdate(
      { _id: id, recipientUserId: new Types.ObjectId(userId), ...orgFilter(organizationId) },
      { readAt: new Date() },
      { new: true },
    );
    if (!doc) throw new AppError(404, 'Notification not found');
    return doc;
  }
}

export const notificationService = new NotificationService();
