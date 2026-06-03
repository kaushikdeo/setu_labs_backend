import { PipelineStage, Types } from 'mongoose';
import { ILead, LeadModel, LeadStatus, LeadTemperature } from './lead.model';
import { ILeadSegment, LeadSegmentModel } from './lead-segment.model';
import { srCounterService } from '../sr-counter/sr-counter.service';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';

export interface ListLeadsFilters {
  q?: string;
  temperature?: string;
  source?: string;
  status?: string;
  priority?: string;
  assignedUserId?: string;
  followUpFrom?: string | Date;
  followUpTo?: string | Date;
  scope?: 'all' | 'hot' | 'stale' | 'mine';
  page?: number;
  limit?: number;
  sort?: string;
  segmentId?: string;
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
  conversionRate: number;
  conversionRateDelta: number | null;
  avgResponseTimeHours: number | null;
}

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const STALE_THRESHOLD_DAYS = 14;

function pad(n: number, width = 4): string {
  return String(n).padStart(width, '0');
}

function staleCutoff(): Date {
  const d = new Date();
  d.setDate(d.getDate() - STALE_THRESHOLD_DAYS);
  return d;
}

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

    if (filters.scope === 'stale') {
      match.lastActivityAt = { $lt: staleCutoff() };
      match.status = { $ne: LeadStatus.CONVERTED };
    }

    if (filters.followUpFrom || filters.followUpTo) {
      const range: Record<string, Date> = {};
      if (filters.followUpFrom) range.$gte = new Date(filters.followUpFrom);
      if (filters.followUpTo) range.$lte = new Date(filters.followUpTo);
      match.followUpDate = range;
    }

    if (filters.q && filters.q.trim()) {
      match.$text = { $search: filters.q.trim() };
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
    const data = (aggregated?.data ?? []) as unknown[];
    const total = (aggregated?.total?.[0]?.count ?? 0) as number;

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
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);
    if (!docs.length) throw new AppError(404, 'Lead not found');
    return docs[0];
  }

  async create(data: Partial<ILead>, userId: string): Promise<ILead> {
    if (!data.assignedUserId) throw new AppError(400, 'assignedUserId is required');

    const seq = await srCounterService.nextSequence('lead');
    const code = `LD-${pad(seq)}`;

    const now = new Date();
    const lead = await LeadModel.create({
      ...data,
      code,
      createdBy: userId,
      lastActivityAt: now,
    });
    logger.info('Lead created', { leadId: lead._id, code, createdBy: userId });
    return lead;
  }

  async update(id: string, data: Partial<ILead>, userId: string): Promise<ILead> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid lead id');
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
      { ...updateData, lastActivityAt: new Date() },
      { new: true, runValidators: true },
    );
    if (!lead) throw new AppError(404, 'Lead not found');
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
                status: { $ne: LeadStatus.CONVERTED },
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
    const total = (agg?.total?.[0]?.count ?? 0) as number;
    const converted = (agg?.converted?.[0]?.count ?? 0) as number;
    const avgRaw = (agg?.avgResponse?.[0]?.avg ?? null) as number | null;

    return {
      totalMTD,
      totalMTDChangePct: lastMonth ? Math.round(((totalMTD - lastMonth) / lastMonth) * 100) : null,
      hotCount,
      staleCount,
      conversionRate: total ? Math.round((converted / total) * 100) : 0,
      conversionRateDelta: null,
      avgResponseTimeHours: avgRaw === null ? null : Math.round(avgRaw * 10) / 10,
    };
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
