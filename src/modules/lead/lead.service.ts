import { PipelineStage, Types } from 'mongoose';
import { ILead, LeadModel, LeadStatus, LeadTemperature, FollowUpMode } from './lead.model';
import { ILeadSegment, LeadSegmentModel } from './lead-segment.model';
import { srCounterService } from '../sr-counter/sr-counter.service';
import { followUpService } from '../follow-up/follow-up.service';
import { activityService } from '../activity/activity.service';
import { ActivityType } from '../activity/activity.model';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';
import { computeHealth, staleCutoffFor } from '../crm-health/compute-health';
import { enrichWithHealth } from '../crm-health/enrich-health';
import { PutOnHoldDto, ResumeDto, SnoozeDto } from '../crm-health/hold.types';

const NULLABLE_ENUM_FIELDS = [
  'followUpMode',
  'productInterest',
  'industry',
  'decisionTimeline',
  'budgetStatus',
] as const;

function normalizePayload(data: Partial<ILead>): Partial<ILead> {
  const out = { ...data } as Record<string, unknown>;
  for (const key of NULLABLE_ENUM_FIELDS) {
    if (out[key] === '' || out[key] === null) delete out[key];
  }
  return out as Partial<ILead>;
}

export interface ListLeadsFilters {
  q?: string;
  temperature?: string;
  source?: string;
  status?: string;
  priority?: string;
  assignedUserId?: string;
  followUpFrom?: string | Date;
  followUpTo?: string | Date;
  scope?: 'all' | 'hot' | 'stale' | 'mine' | 'on_hold' | 'at_risk' | 'needs_attention';
  page?: number;
  limit?: number;
  sort?: string;
  segmentId?: string;
  tags?: string | string[];
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseTagsFilter(tags: string | string[] | undefined): string[] {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : tags.split(',');
  return list.map((t) => t.trim()).filter(Boolean);
}

export interface ListLeadsResult {
  data: unknown[];
  page: number;
  limit: number;
  total: number;
}

export interface LeadStatsResult {
  totalMTD: number;
  totalMTDChangePct: number | null;
  hotCount: number;
  staleCount: number;
  onHoldCount: number;
  atRiskCount: number;
  criticalCount: number;
  onHoldExpiringSoon: number;
  conversionRate: number;
  conversionRateDelta: number | null;
  avgResponseTimeHours: number | null;
}

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
function pad(n: number, width = 4): string {
  return String(n).padStart(width, '0');
}

function staleCutoff(): Date {
  return staleCutoffFor('lead');
}

const ACTIVE_LEAD_STATUSES = {
  $nin: [LeadStatus.CONVERTED, LeadStatus.NOT_INTERESTED, LeadStatus.ON_HOLD],
};

function buildSortStage(sort?: string): Record<string, 1 | -1> {
  switch (sort) {
    case 'value_desc':
      return { estimatedValue: -1, createdAt: -1 };
    case 'temperature':
      return { temperatureRank: 1, createdAt: -1 };
    case 'follow_up_asc':
      return { followUpDate: 1, createdAt: -1 };
    case 'assignee':
      return { 'assignee.name': 1, createdAt: -1 };
    case 'created_desc':
    default:
      return { createdAt: -1 };
  }
}

export class LeadService {
  async list(filters: ListLeadsFilters, callerUserId: string): Promise<ListLeadsResult> {
    const match: Record<string, unknown> = {};

    if (filters.scope === 'mine') {
      match.assignedUserId = new Types.ObjectId(callerUserId);
    } else if (filters.assignedUserId) {
      match.assignedUserId = new Types.ObjectId(filters.assignedUserId);
    }

    if (filters.scope === 'hot' || filters.temperature === LeadTemperature.HOT) {
      match.temperature = LeadTemperature.HOT;
    } else if (filters.temperature) {
      match.temperature = filters.temperature;
    }

    if (filters.source) match.source = filters.source;
    if (filters.status) match.status = filters.status;
    if (filters.priority) match.priority = filters.priority;

    if (filters.scope === 'on_hold') {
      match.status = LeadStatus.ON_HOLD;
    } else if (filters.scope === 'stale') {
      match.lastActivityAt = { $lt: staleCutoff() };
      match.status = ACTIVE_LEAD_STATUSES;
    } else if (filters.scope === 'at_risk' || filters.scope === 'needs_attention') {
      match.status = ACTIVE_LEAD_STATUSES;
    }

    if (filters.followUpFrom || filters.followUpTo) {
      const range: Record<string, Date> = {};
      if (filters.followUpFrom) {
        const d = new Date(filters.followUpFrom);
        d.setHours(0, 0, 0, 0);
        range.$gte = d;
      }
      if (filters.followUpTo) {
        const d = new Date(filters.followUpTo);
        d.setHours(23, 59, 59, 999);
        range.$lte = d;
      }
      match.followUpDate = range;
    }

    if (filters.q && filters.q.trim()) {
      const term = escapeRegex(filters.q.trim());
      const rx = new RegExp(term, 'i');
      match.$or = [
        { firstName: rx },
        { lastName: rx },
        { company: rx },
        { mobile: rx },
        { email: rx },
        { code: rx },
        { tags: rx },
      ];
    }

    const tagList = parseTagsFilter(filters.tags);
    if (tagList.length > 0) {
      match.tags = {
        $all: tagList.map((t) => new RegExp(`^${escapeRegex(t)}$`, 'i')),
      };
    }

    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.max(1, Math.min(MAX_PAGE_SIZE, filters.limit ?? DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * limit;

    const sortStage = buildSortStage(filters.sort);

    const pipeline: PipelineStage[] = [
      { $match: match },
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
          temperatureRank: {
            $switch: {
              branches: [
                { case: { $eq: ['$temperature', 'hot'] }, then: 0 },
                { case: { $eq: ['$temperature', 'warm'] }, then: 1 },
                { case: { $eq: ['$temperature', 'cold'] }, then: 2 },
              ],
              default: 3,
            },
          },
        },
      },
      { $sort: sortStage },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                id: '$_id',
                _id: 0,
                code: 1,
                firstName: 1,
                lastName: 1,
                mobile: 1,
                email: 1,
                company: 1,
                designation: 1,
                department: 1,
                city: 1,
                state: 1,
                source: 1,
                campaign: 1,
                referredBy: 1,
                productInterest: 1,
                estimatedValue: 1,
                expectedCloseDate: 1,
                industry: 1,
                decisionTimeline: 1,
                budgetStatus: 1,
                temperature: 1,
                tags: 1,
                assignedUserId: 1,
                assignee: 1,
                followUpDate: 1,
                followUpMode: 1,
                priority: 1,
                notes: 1,
                status: 1,
                createdBy: 1,
                lastActivityAt: 1,
                convertedAt: 1,
                holdReason: 1,
                holdUntil: 1,
                holdNotes: 1,
                heldAt: 1,
                previousStatus: 1,
                alertSnoozedUntil: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const [aggregated] = await LeadModel.aggregate(pipeline);
    let data = ((aggregated?.data ?? []) as Record<string, unknown>[]).map((row) =>
      enrichWithHealth(row, 'lead'),
    );

    if (filters.scope === 'at_risk') {
      data = data.filter((r) => r.healthStatus === 'at_risk' || r.healthStatus === 'critical');
    } else if (filters.scope === 'needs_attention') {
      data = data.filter((r) =>
        ['attention', 'stale', 'at_risk', 'critical'].includes(String(r.healthStatus)),
      );
    }

    const total =
      filters.scope === 'at_risk' || filters.scope === 'needs_attention'
        ? data.length
        : ((aggregated?.total?.[0]?.count ?? 0) as number);

    return { data, page, limit, total };
  }

  async getById(id: string): Promise<unknown> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid lead id');
    const docs = await LeadModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
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
      {
        $project: {
          id: '$_id',
          _id: 0,
          code: 1,
          firstName: 1,
          lastName: 1,
          mobile: 1,
          email: 1,
          company: 1,
          designation: 1,
          department: 1,
          city: 1,
          state: 1,
          source: 1,
          campaign: 1,
          referredBy: 1,
          productInterest: 1,
          estimatedValue: 1,
          expectedCloseDate: 1,
          industry: 1,
          decisionTimeline: 1,
          budgetStatus: 1,
          temperature: 1,
          tags: 1,
          assignedUserId: 1,
          assignee: 1,
          followUpDate: 1,
          followUpMode: 1,
          priority: 1,
          notes: 1,
          status: 1,
          createdBy: 1,
          lastActivityAt: 1,
          convertedAt: 1,
          holdReason: 1,
          holdUntil: 1,
          holdNotes: 1,
          heldAt: 1,
          previousStatus: 1,
          alertSnoozedUntil: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);
    if (!docs.length) throw new AppError(404, 'Lead not found');
    return enrichWithHealth(docs[0] as Record<string, unknown>, 'lead');
  }

  async create(data: Partial<ILead>, userId: string): Promise<ILead> {
    if (!data.assignedUserId) throw new AppError(400, 'assignedUserId is required');

    const seq = await srCounterService.nextSequence('lead');
    const code = `LD-${pad(seq)}`;

    const now = new Date();
    const lead = await LeadModel.create({
      ...normalizePayload(data),
      code,
      createdBy: userId,
      lastActivityAt: now,
    });
    logger.info('Lead created', { leadId: lead._id, code, createdBy: userId });
    return lead;
  }

  async update(id: string, data: Partial<ILead>, userId: string): Promise<ILead> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid lead id');
    const prev = await LeadModel.findById(id);
    if (!prev) throw new AppError(404, 'Lead not found');

    const {
      _id: _ignored1,
      id: _ignored2,
      __v: _ignored3,
      createdAt: _ignored4,
      updatedAt: _ignored5,
      createdBy: _ignored6,
      code: _ignored7,
      ...updateData
    } = data as Record<string, unknown>;

    const lead = await LeadModel.findByIdAndUpdate(
      id,
      { ...normalizePayload(updateData as Partial<ILead>), lastActivityAt: new Date() },
      { new: true, runValidators: true },
    );
    if (!lead) throw new AppError(404, 'Lead not found');

    if ('followUpDate' in updateData) {
      const newDate = updateData.followUpDate as Date | null | undefined;
      const prevTime = prev.followUpDate?.getTime();
      const newTime = newDate ? new Date(newDate).getTime() : undefined;
      if (!newDate) {
        await followUpService.clearFollowUp('lead', id);
      } else if (newTime !== prevTime) {
        const mode = (updateData.followUpMode ?? lead.followUpMode ?? FollowUpMode.PHONE) as FollowUpMode;
        await activityService.add(
          {
            entityType: 'lead',
            entityId: id,
            type: ActivityType.FOLLOW_UP,
            title: `Follow up via ${mode}`,
            occurredAt: new Date(newDate),
            metadata: { mode },
          },
          userId,
        );
        await followUpService.syncFromActivity('lead', id, new Date(newDate), mode);
      }
    }

    logger.info('Lead updated', { leadId: id, updatedBy: userId });
    return lead;
  }

  async remove(id: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid lead id');
    const result = await LeadModel.findByIdAndDelete(id);
    if (!result) throw new AppError(404, 'Lead not found');
    logger.info('Lead deleted', { leadId: id, deletedBy: userId });
  }

  async stats(): Promise<LeadStatsResult> {
    const mtdStart = new Date();
    mtdStart.setDate(1);
    mtdStart.setHours(0, 0, 0, 0);
    const lastMonthStart = new Date(mtdStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const cutoff = staleCutoff();

    const [agg] = await LeadModel.aggregate([
      {
        $facet: {
          totalMTD: [{ $match: { createdAt: { $gte: mtdStart } } }, { $count: 'count' }],
          lastMonth: [
            { $match: { createdAt: { $gte: lastMonthStart, $lt: mtdStart } } },
            { $count: 'count' },
          ],
          hot: [
            {
              $match: {
                temperature: LeadTemperature.HOT,
                status: { $ne: LeadStatus.CONVERTED },
              },
            },
            { $count: 'count' },
          ],
          stale: [
            {
              $match: {
                lastActivityAt: { $lt: cutoff },
                status: ACTIVE_LEAD_STATUSES,
              },
            },
            { $count: 'count' },
          ],
          onHold: [{ $match: { status: LeadStatus.ON_HOLD } }, { $count: 'count' }],
          onHoldExpiring: [
            {
              $match: {
                status: LeadStatus.ON_HOLD,
                holdUntil: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), $ne: null },
              },
            },
            { $count: 'count' },
          ],
          total: [{ $count: 'count' }],
          converted: [
            { $match: { status: LeadStatus.CONVERTED } },
            { $count: 'count' },
          ],
          avgResponse: [
            {
              $project: {
                hours: {
                  $divide: [
                    { $subtract: ['$lastActivityAt', '$createdAt'] },
                    1000 * 60 * 60,
                  ],
                },
              },
            },
            { $match: { hours: { $gt: 0 } } },
            { $group: { _id: null, avg: { $avg: '$hours' } } },
          ],
        },
      },
    ]);

    const totalMTD = (agg?.totalMTD?.[0]?.count ?? 0) as number;
    const lastMonth = (agg?.lastMonth?.[0]?.count ?? 0) as number;
    const hotCount = (agg?.hot?.[0]?.count ?? 0) as number;
    const staleCount = (agg?.stale?.[0]?.count ?? 0) as number;
    const onHoldCount = (agg?.onHold?.[0]?.count ?? 0) as number;
    const onHoldExpiringSoon = (agg?.onHoldExpiring?.[0]?.count ?? 0) as number;
    const total = (agg?.total?.[0]?.count ?? 0) as number;
    const converted = (agg?.converted?.[0]?.count ?? 0) as number;
    const avgRaw = (agg?.avgResponse?.[0]?.avg ?? null) as number | null;

    const activeLeads = await LeadModel.find({ status: ACTIVE_LEAD_STATUSES }).lean();
    let atRiskCount = 0;
    let criticalCount = 0;
    for (const lead of activeLeads) {
      const { healthStatus } = computeHealth({
        entityType: 'lead',
        status: lead.status,
        lastActivityAt: lead.lastActivityAt,
        followUpDate: lead.followUpDate,
        expectedCloseDate: lead.expectedCloseDate,
      });
      if (healthStatus === 'at_risk') atRiskCount += 1;
      if (healthStatus === 'critical') criticalCount += 1;
    }

    return {
      totalMTD,
      totalMTDChangePct: lastMonth ? Math.round(((totalMTD - lastMonth) / lastMonth) * 100) : null,
      hotCount,
      staleCount,
      onHoldCount,
      atRiskCount,
      criticalCount,
      onHoldExpiringSoon,
      conversionRate: total ? Math.round((converted / total) * 100) : 0,
      conversionRateDelta: null,
      avgResponseTimeHours: avgRaw === null ? null : Math.round(avgRaw * 10) / 10,
    };
  }

  async putOnHold(id: string, dto: PutOnHoldDto, userId: string): Promise<ILead> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid lead id');
    const lead = await LeadModel.findById(id);
    if (!lead) throw new AppError(404, 'Lead not found');
    if ([LeadStatus.CONVERTED, LeadStatus.NOT_INTERESTED, LeadStatus.ON_HOLD].includes(lead.status)) {
      throw new AppError(400, 'Lead cannot be put on hold in its current status');
    }

    lead.previousStatus = lead.status;
    lead.status = LeadStatus.ON_HOLD;
    lead.holdReason = dto.holdReason;
    lead.holdUntil = dto.holdUntil ? new Date(dto.holdUntil) : null;
    lead.holdNotes = dto.holdNotes ?? null;
    lead.heldAt = new Date();
    lead.heldBy = new Types.ObjectId(userId);
    await lead.save();
    await followUpService.clearFollowUp('lead', id);

    await activityService.logSystem(
      'lead',
      lead._id as Types.ObjectId,
      ActivityType.ON_HOLD,
      'Lead put on hold',
      {
        description: dto.holdNotes ?? undefined,
        metadata: { holdReason: dto.holdReason, holdUntil: lead.holdUntil },
      },
      userId,
    );
    return lead;
  }

  async resume(id: string, dto: ResumeDto, userId: string): Promise<ILead> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid lead id');
    const lead = await LeadModel.findById(id);
    if (!lead) throw new AppError(404, 'Lead not found');
    if (lead.status !== LeadStatus.ON_HOLD) throw new AppError(400, 'Lead is not on hold');

    const restoreStatus = (lead.previousStatus as LeadStatus) ?? LeadStatus.NEW;
    lead.status = restoreStatus;
    lead.previousStatus = null;
    lead.holdReason = null;
    lead.holdUntil = null;
    lead.holdNotes = null;
    lead.heldAt = null;
    lead.heldBy = null;
    lead.lastActivityAt = new Date();
    await lead.save();

    if (dto.followUpDate) {
      const mode = (dto.followUpMode ?? FollowUpMode.PHONE) as FollowUpMode;
      lead.followUpDate = new Date(dto.followUpDate);
      lead.followUpMode = mode;
      await lead.save();
      await activityService.add(
        {
          entityType: 'lead',
          entityId: id,
          type: ActivityType.FOLLOW_UP,
          title: `Follow up via ${mode}`,
          occurredAt: new Date(dto.followUpDate),
          metadata: { mode },
        },
        userId,
      );
      await followUpService.syncFromActivity('lead', id, new Date(dto.followUpDate), mode);
    }

    await activityService.logSystem(
      'lead',
      lead._id as Types.ObjectId,
      ActivityType.RESUMED,
      'Lead resumed from hold',
      { description: dto.note ?? undefined },
      userId,
    );
    return lead;
  }

  async snooze(id: string, dto: SnoozeDto, _userId: string): Promise<ILead> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid lead id');
    const until = new Date();
    until.setDate(until.getDate() + dto.days);
    const lead = await LeadModel.findByIdAndUpdate(id, { alertSnoozedUntil: until }, { new: true });
    if (!lead) throw new AppError(404, 'Lead not found');
    return lead;
  }

  // Segments

  async listSegments(callerUserId: string): Promise<unknown[]> {
    const docs = await LeadSegmentModel.aggregate([
      {
        $match: {
          $or: [{ ownerId: new Types.ObjectId(callerUserId) }, { isShared: true }],
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          as: 'owner',
        },
      },
      {
        $addFields: {
          ownerName: { $arrayElemAt: ['$owner.name', 0] },
        },
      },
      {
        $project: {
          id: '$_id',
          _id: 0,
          name: 1,
          ownerId: 1,
          ownerName: 1,
          filters: 1,
          isShared: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { updatedAt: -1 } },
    ]);
    return docs;
  }

  async createSegment(
    data: { name: string; filters: Record<string, unknown>; isShared?: boolean },
    userId: string,
  ): Promise<ILeadSegment> {
    const segment = await LeadSegmentModel.create({
      name: data.name,
      filters: data.filters ?? {},
      isShared: data.isShared ?? false,
      ownerId: new Types.ObjectId(userId),
      createdBy: userId,
    });
    return segment;
  }

  async updateSegment(
    id: string,
    data: Partial<{ name: string; filters: Record<string, unknown>; isShared: boolean }>,
    userId: string,
  ): Promise<ILeadSegment> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid segment id');
    const segment = await LeadSegmentModel.findById(id);
    if (!segment) throw new AppError(404, 'Segment not found');
    if (segment.ownerId.toString() !== userId) {
      throw new AppError(403, 'Only the owner can update this segment');
    }
    Object.assign(segment, data);
    await segment.save();
    return segment;
  }

  async removeSegment(id: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid segment id');
    const segment = await LeadSegmentModel.findById(id);
    if (!segment) throw new AppError(404, 'Segment not found');
    if (segment.ownerId.toString() !== userId) {
      throw new AppError(403, 'Only the owner can delete this segment');
    }
    await segment.deleteOne();
  }
}

export const leadService = new LeadService();
