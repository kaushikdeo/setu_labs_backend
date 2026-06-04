import { Types, PipelineStage } from 'mongoose';
import { ActivityEntityType, ActivityModel, ActivityType, IActivity } from './activity.model';
import { AppError } from '../../utils/app-error';

export interface CreateActivityInput {
  entityType: ActivityEntityType;
  entityId: string;
  type: ActivityType;
  title: string;
  description?: string;
  direction?: 'in' | 'out';
  outcome?: 'positive' | 'neutral' | 'objection';
  nextStep?: string;
  occurredAt?: Date | string;
  metadata?: Record<string, unknown>;
}

export class ActivityService {
  async list(
    entityType: ActivityEntityType,
    entityId: string,
    type?: ActivityType
  ): Promise<unknown[]> {
    if (!Types.ObjectId.isValid(entityId)) throw new AppError(400, 'Invalid entityId');
    const eid = new Types.ObjectId(entityId);

    const match: Record<string, unknown> = {
      $or: [{ entityType, entityId: eid }],
    };
    if (entityType === 'prospect') {
      (match.$or as Record<string, unknown>[]).push({ linkedProspectId: eid });
    }
    if (type) match.type = type;

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: 'users',
          let: { creator: '$createdBy' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $cond: [
                    { $regexMatch: { input: '$$creator', regex: /^[0-9a-fA-F]{24}$/ } },
                    { $eq: ['$_id', { $toObjectId: '$$creator' }] },
                    false,
                  ],
                },
              },
            },
            { $project: { name: 1 } },
          ],
          as: 'creator',
        },
      },
      {
        $addFields: {
          createdByName: { $arrayElemAt: ['$creator.name', 0] },
        },
      },
      { $sort: { occurredAt: -1 } },
      {
        $project: {
          id: '$_id',
          _id: 0,
          entityType: 1,
          entityId: 1,
          linkedProspectId: 1,
          type: 1,
          direction: 1,
          title: 1,
          description: 1,
          outcome: 1,
          nextStep: 1,
          occurredAt: 1,
          metadata: 1,
          createdBy: 1,
          createdByName: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    return ActivityModel.aggregate(pipeline);
  }

  async add(input: CreateActivityInput, userId: string): Promise<IActivity> {
    if (!Types.ObjectId.isValid(input.entityId)) throw new AppError(400, 'Invalid entityId');
    return ActivityModel.create({
      entityType: input.entityType,
      entityId: new Types.ObjectId(input.entityId),
      type: input.type,
      title: input.title,
      description: input.description,
      direction: input.direction,
      outcome: input.outcome,
      nextStep: input.nextStep,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      metadata: input.metadata,
      createdBy: userId,
    });
  }

  async logSystem(
    entityType: ActivityEntityType,
    entityId: Types.ObjectId | string,
    type: ActivityType,
    title: string,
    extras: Partial<Pick<IActivity, 'description' | 'occurredAt' | 'metadata'>> = {},
    userId = 'system'
  ): Promise<IActivity> {
    const eid = typeof entityId === 'string' ? new Types.ObjectId(entityId) : entityId;
    return ActivityModel.create({
      entityType,
      entityId: eid,
      type,
      title,
      description: extras.description,
      occurredAt: extras.occurredAt ? new Date(extras.occurredAt) : new Date(),
      metadata: extras.metadata,
      createdBy: userId,
    });
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid activity id');
    const res = await ActivityModel.findByIdAndDelete(id);
    if (!res) throw new AppError(404, 'Activity not found');
  }

  async relinkLeadActivitiesToProspect(
    leadId: Types.ObjectId,
    prospectId: Types.ObjectId
  ): Promise<void> {
    await ActivityModel.updateMany(
      { entityType: 'lead', entityId: leadId },
      { $set: { linkedProspectId: prospectId } }
    );
  }
}

export const activityService = new ActivityService();
