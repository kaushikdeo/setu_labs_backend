import { PipelineStage as MongoPipelineStage, Types } from 'mongoose';
import { ActivityEntityType, ActivityModel, ActivityType } from '../activity/activity.model';
import { activityService } from '../activity/activity.service';
import { FollowUpMode, ILead, LeadModel, LeadStatus } from '../lead/lead.model';
import { IProspect, ProspectModel, ProspectStatus } from '../prospect/prospect.model';
import { IOpportunity, OpportunityModel, OpportunityStatus } from '../opportunity/opportunity.model';
import { AppError } from '../../utils/app-error';

export type FollowUpEntityType = Extract<ActivityEntityType, 'lead' | 'prospect' | 'opportunity'>;
export type FollowUpEntityFilter = FollowUpEntityType | 'all';

type EntityDoc = ILead | IProspect | IOpportunity;

interface EntityConfig {
  dateField: 'followUpDate' | 'nextFollowUpDate';
  modeField: 'followUpMode' | 'nextFollowUpMode';
  openMatch: Record<string, unknown>;
  valueField: 'estimatedValue' | 'dealValue';
  notFoundLabel: string;
  collectionName: string;
}

const ENTITY_META: Record<FollowUpEntityType, EntityConfig> = {
  lead: {
    dateField: 'followUpDate',
    modeField: 'followUpMode',
    openMatch: { status: { $nin: [LeadStatus.CONVERTED, LeadStatus.ON_HOLD] } },
    valueField: 'estimatedValue',
    notFoundLabel: 'Lead not found',
    collectionName: 'leads',
  },
  prospect: {
    dateField: 'nextFollowUpDate',
    modeField: 'nextFollowUpMode',
    openMatch: { status: ProspectStatus.OPEN },
    valueField: 'dealValue',
    notFoundLabel: 'Prospect not found',
    collectionName: 'prospects',
  },
  opportunity: {
    dateField: 'nextFollowUpDate',
    modeField: 'nextFollowUpMode',
    openMatch: { status: OpportunityStatus.OPEN },
    valueField: 'dealValue',
    notFoundLabel: 'Opportunity not found',
    collectionName: 'opportunities',
  },
};

function getModel(entityType: FollowUpEntityType) {
  switch (entityType) {
    case 'lead':
      return LeadModel;
    case 'prospect':
      return ProspectModel;
    case 'opportunity':
      return OpportunityModel;
  }
}

async function updateEntity(
  entityType: FollowUpEntityType,
  id: string,
  update: Record<string, unknown>,
  options?: { new?: boolean },
) {
  switch (entityType) {
    case 'lead':
      return LeadModel.findByIdAndUpdate(id, update, options);
    case 'prospect':
      return ProspectModel.findByIdAndUpdate(id, update, options);
    case 'opportunity':
      return OpportunityModel.findByIdAndUpdate(id, update, options);
  }
}

async function findEntity(entityType: FollowUpEntityType, id: string) {
  switch (entityType) {
    case 'lead':
      return LeadModel.findById(id);
    case 'prospect':
      return ProspectModel.findById(id);
    case 'opportunity':
      return OpportunityModel.findById(id);
  }
}

const ENRICH_ASSIGNEE: MongoPipelineStage[] = [
  {
    $lookup: {
      from: 'users',
      localField: 'assignedUserId',
      foreignField: '_id',
      as: 'assignee',
    },
  },
  {
    $addFields: {
      assignee: {
        $arrayElemAt: [
          {
            $map: {
              input: '$assignee',
              as: 'a',
              in: { id: '$$a._id', name: '$$a.name', email: '$$a.email' },
            },
          },
          0,
        ],
      },
    },
  },
];

function getFollowUpDate(doc: EntityDoc, entityType: FollowUpEntityType): Date | null | undefined {
  const cfg = ENTITY_META[entityType];
  if (entityType === 'lead') return (doc as ILead)[cfg.dateField as 'followUpDate'];
  if (entityType === 'prospect') return (doc as IProspect)[cfg.dateField as 'nextFollowUpDate'];
  return (doc as IOpportunity)[cfg.dateField as 'nextFollowUpDate'];
}

function toFollowUpRow(doc: Record<string, unknown>, entityType: FollowUpEntityType) {
  const cfg = ENTITY_META[entityType];
  const date = doc[cfg.dateField] as Date;
  const mode = doc[cfg.modeField] as FollowUpMode | undefined;
  return {
    entityType,
    id: String(doc._id ?? doc.id),
    code: doc.code as string,
    firstName: doc.firstName as string,
    lastName: doc.lastName as string,
    company: doc.company as string | undefined,
    mobile: doc.mobile as string | undefined,
    email: doc.email as string | undefined,
    stage: doc.stage as string | undefined,
    status: doc.status as string,
    value: (doc[cfg.valueField] as number | undefined) ?? 0,
    followUpDate: date,
    followUpMode: mode,
    lastActivityAt: doc.lastActivityAt as Date,
    expectedCloseDate: doc.expectedCloseDate as Date | undefined,
    assignee: doc.assignee,
  };
}

export interface CompleteFollowUpDto {
  doneAs: ActivityType;
  title: string;
  note?: string;
  reschedule?: { occurredAt: Date | string; mode: FollowUpMode; note?: string };
}

class FollowUpService {
  private meta(entityType: FollowUpEntityType): EntityConfig {
    return ENTITY_META[entityType];
  }

  async listOpen(
    entityType: FollowUpEntityFilter,
    callerUserId: string,
    scope?: 'mine' | 'all',
  ) {
    const types: FollowUpEntityType[] =
      entityType === 'all' ? ['lead', 'prospect', 'opportunity'] : [entityType];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekAhead = new Date(today);
    weekAhead.setDate(weekAhead.getDate() + 7);

    const allDocs: ReturnType<typeof toFollowUpRow>[] = [];

    for (const type of types) {
      const cfg = this.meta(type);
      const match: Record<string, unknown> = {
        ...cfg.openMatch,
        [cfg.dateField]: { $ne: null },
      };
      if (scope === 'mine') {
        match.assignedUserId = new Types.ObjectId(callerUserId);
      }

      const docs = (await getModel(type).aggregate([
        { $match: match },
        ...ENRICH_ASSIGNEE,
      ])) as Record<string, unknown>[];

      allDocs.push(...docs.map((d) => toFollowUpRow(d, type)));
    }

    const overdue = allDocs
      .filter((p) => new Date(p.followUpDate!) < today)
      .sort(
        (a, b) =>
          new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
      );
    const dueToday = allDocs
      .filter(
        (p) =>
          new Date(p.followUpDate!) >= today && new Date(p.followUpDate!) < tomorrow,
      )
      .sort((a, b) => b.value - a.value);
    const upcoming = allDocs
      .filter(
        (p) =>
          new Date(p.followUpDate!) >= tomorrow &&
          new Date(p.followUpDate!) <= weekAhead,
      )
      .sort((a, b) => {
        const aClose = a.expectedCloseDate ? new Date(a.expectedCloseDate).getTime() : Infinity;
        const bClose = b.expectedCloseDate ? new Date(b.expectedCloseDate).getTime() : Infinity;
        return aClose - bClose;
      });

    return { overdue, dueToday, upcoming };
  }

  async syncFromActivity(
    entityType: ActivityEntityType,
    entityId: string | Types.ObjectId,
    occurredAt: Date,
    mode?: string,
  ): Promise<void> {
    if (entityType !== 'lead' && entityType !== 'prospect' && entityType !== 'opportunity') {
      return;
    }
    const id = String(entityId);
    if (!Types.ObjectId.isValid(id)) return;

    const cfg = this.meta(entityType);
    const isFuture = occurredAt.getTime() > Date.now();
    const update: Record<string, unknown> = { [cfg.dateField]: occurredAt };
    if (mode && Object.values(FollowUpMode).includes(mode as FollowUpMode)) {
      update[cfg.modeField] = mode;
    }
    if (!isFuture) {
      update.lastActivityAt = new Date();
    }
    await updateEntity(entityType, id, update);
  }

  async touchLastActivity(entityType: ActivityEntityType, entityId: string | Types.ObjectId): Promise<void> {
    if (entityType !== 'lead' && entityType !== 'prospect' && entityType !== 'opportunity') {
      return;
    }
    const id = String(entityId);
    if (!Types.ObjectId.isValid(id)) return;
    await updateEntity(entityType, id, { lastActivityAt: new Date() });
  }

  async clearFollowUp(entityType: FollowUpEntityType, id: string): Promise<EntityDoc> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, `Invalid ${entityType} id`);
    const cfg = this.meta(entityType);
    const updated = await updateEntity(
      entityType,
      id,
      { [cfg.dateField]: null, [cfg.modeField]: null },
      { new: true },
    );
    if (!updated) throw new AppError(404, cfg.notFoundLabel);
    return updated as EntityDoc;
  }

  async completeFollowUp(
    entityType: FollowUpEntityType,
    id: string,
    dto: CompleteFollowUpDto,
    userId: string,
  ) {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, `Invalid ${entityType} id`);
    const cfg = this.meta(entityType);
    const doc = await findEntity(entityType, id);
    if (!doc) throw new AppError(404, cfg.notFoundLabel);

    const now = new Date();
    const eid = doc._id as Types.ObjectId;
    const followUpDate = getFollowUpDate(doc, entityType);

    const openFilter: Record<string, unknown> = {
      entityType,
      entityId: eid,
      type: ActivityType.FOLLOW_UP,
      $or: [{ 'metadata.completedAt': { $exists: false } }, { 'metadata.completedAt': null }],
    };

    let openFollowUp = followUpDate
      ? await ActivityModel.findOne({ ...openFilter, occurredAt: followUpDate })
          .sort({ createdAt: -1 })
          .exec()
      : null;
    if (!openFollowUp) {
      openFollowUp = await ActivityModel.findOne(openFilter).sort({ occurredAt: -1 }).exec();
    }

    let completedFollowUpId: string | null = null;
    if (openFollowUp) {
      const meta = (openFollowUp.metadata as Record<string, unknown> | undefined) ?? {};
      openFollowUp.set('metadata', {
        ...meta,
        completedAt: now,
        completedAs: dto.doneAs,
        completedBy: userId,
      });
      openFollowUp.markModified('metadata');
      await openFollowUp.save();
      completedFollowUpId = String(openFollowUp._id);
    }

    const touchpoint = await activityService.add(
      {
        entityType,
        entityId: String(eid),
        type: dto.doneAs,
        title: dto.title,
        description: dto.note,
        occurredAt: now,
        metadata: completedFollowUpId
          ? { completesFollowUpId: completedFollowUpId }
          : undefined,
      },
      userId,
    );

    let scheduledId: string | null = null;
    if (dto.reschedule) {
      const scheduled = await activityService.add(
        {
          entityType,
          entityId: String(eid),
          type: ActivityType.FOLLOW_UP,
          title: `Follow up via ${dto.reschedule.mode}`,
          description: dto.reschedule.note,
          occurredAt: new Date(dto.reschedule.occurredAt),
          metadata: { mode: dto.reschedule.mode },
        },
        userId,
      );
      scheduledId = String(scheduled._id);
      await updateEntity(entityType, String(eid), {
        [cfg.dateField]: scheduled.occurredAt,
        [cfg.modeField]: dto.reschedule.mode,
        lastActivityAt: now,
      });
    } else {
      await updateEntity(entityType, String(eid), {
        [cfg.dateField]: null,
        [cfg.modeField]: null,
        lastActivityAt: now,
      });
    }

    const fresh = await findEntity(entityType, id);
    return {
      entity: fresh as EntityDoc,
      entityType,
      completedFollowUpId,
      touchpointId: String(touchpoint._id),
      scheduledId,
    };
  }

  async listCompleted(
    entityType: FollowUpEntityFilter,
    days: number,
    callerUserId: string,
    scope?: 'mine' | 'all',
  ) {
    const since = new Date(Date.now() - Math.max(1, days) * 86400000);
    const types: FollowUpEntityType[] =
      entityType === 'all' ? ['lead', 'prospect', 'opportunity'] : [entityType];

    const results: unknown[] = [];

    for (const type of types) {
      const cfg = this.meta(type);
      const collectionName = cfg.collectionName;

      const entityMatch: Record<string, unknown> = {};
      if (scope === 'mine') {
        entityMatch.assignedUserId = new Types.ObjectId(callerUserId);
      }

      const pipeline: MongoPipelineStage[] = [
        {
          $match: {
            entityType: type,
            type: ActivityType.FOLLOW_UP,
            'metadata.completedAt': { $ne: null, $exists: true, $gte: since },
          },
        },
        {
          $lookup: {
            from: collectionName,
            localField: 'entityId',
            foreignField: '_id',
            as: 'entity',
          },
        },
        { $unwind: '$entity' },
        ...(Object.keys(entityMatch).length
          ? [{ $match: { 'entity.assignedUserId': entityMatch.assignedUserId } }]
          : []),
        {
          $lookup: {
            from: 'users',
            localField: 'entity.assignedUserId',
            foreignField: '_id',
            as: 'assignee',
          },
        },
        {
          $addFields: {
            assignee: {
              $arrayElemAt: [
                {
                  $map: {
                    input: '$assignee',
                    as: 'a',
                    in: { id: '$$a._id', name: '$$a.name', email: '$$a.email' },
                  },
                },
                0,
              ],
            },
          },
        },
        { $sort: { 'metadata.completedAt': -1 } },
        {
          $addFields: {
            activityIdStr: { $toString: '$_id' },
            entityFlat: {
              entityType: type,
              id: { $toString: '$entity._id' },
              code: '$entity.code',
              firstName: '$entity.firstName',
              lastName: '$entity.lastName',
              company: '$entity.company',
              stage: '$entity.stage',
              status: '$entity.status',
              value: {
                $ifNull: [
                  type === 'lead' ? '$entity.estimatedValue' : '$entity.dealValue',
                  0,
                ],
              },
              assignedUserId: { $toString: '$entity.assignedUserId' },
            },
          },
        },
        {
          $project: {
            _id: 0,
            id: '$activityIdStr',
            activityId: '$activityIdStr',
            entityType: type,
            occurredAt: 1,
            completedAt: '$metadata.completedAt',
            completedAs: '$metadata.completedAs',
            mode: '$metadata.mode',
            title: 1,
            description: 1,
            entity: '$entityFlat',
            assignee: 1,
          },
        },
      ];

      const rows = await ActivityModel.aggregate(pipeline);
      results.push(...rows);
    }

    return results.sort((a, b) => {
      const aTime = new Date((a as { completedAt: Date }).completedAt).getTime();
      const bTime = new Date((b as { completedAt: Date }).completedAt).getTime();
      return bTime - aTime;
    });
  }

  async syncFromDirectPatch(
    entityType: FollowUpEntityType,
    id: string,
    followUpDate: Date | null | undefined,
    followUpMode: FollowUpMode | null | undefined,
    userId: string,
  ): Promise<void> {
    if (!followUpDate) return;
    await activityService.add(
      {
        entityType,
        entityId: id,
        type: ActivityType.FOLLOW_UP,
        title: `Follow up via ${followUpMode ?? 'phone'}`,
        occurredAt: new Date(followUpDate),
        metadata: followUpMode ? { mode: followUpMode } : undefined,
      },
      userId,
    );
    await this.syncFromActivity(entityType, id, new Date(followUpDate), followUpMode ?? undefined);
  }
}

export const followUpService = new FollowUpService();
