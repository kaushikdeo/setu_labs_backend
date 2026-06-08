import { Types } from 'mongoose';
import { NotificationModel } from './notification.model';
import { AppError } from '../../utils/app-error';

export class NotificationService {
  async listForUser(userId: string, unreadOnly = false) {
    const match: Record<string, unknown> = {
      recipientUserId: new Types.ObjectId(userId),
    };
    if (unreadOnly) match.readAt = null;

    return NotificationModel.find(match).sort({ createdAt: -1 }).limit(50).lean();
  }

  async markRead(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid notification id');
    const doc = await NotificationModel.findOneAndUpdate(
      { _id: id, recipientUserId: new Types.ObjectId(userId) },
      { readAt: new Date() },
      { new: true },
    );
    if (!doc) throw new AppError(404, 'Notification not found');
    return doc;
  }
}

export const notificationService = new NotificationService();
