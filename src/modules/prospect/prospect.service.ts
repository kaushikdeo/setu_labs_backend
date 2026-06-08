import { PipelineStage as MongoPipelineStage, Types } from 'mongoose';
import {
  AuthorityType,
  DecisionMakerCount,
  IProspect,
  LostReason,
  PipelineStage,
  ProspectModel,
  ProspectStatus,
} from './prospect.model';
import {
  BudgetStatus,
  DecisionTimeline,
  FollowUpMode,
  ILead,
  LeadModel,
  LeadStatus,
} from '../lead/lead.model';
import { activityService } from '../activity/activity.service';
import { ActivityType } from '../activity/activity.model';
import { followUpService } from '../follow-up/follow-up.service';
import { srCounterService } from '../sr-counter/sr-counter.service';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';
import { computeHealth, staleCutoffFor } from '../crm-health/compute-health';
import { enrichWithHealth } from '../crm-health/enrich-health';
import { PutOnHoldDto, ResumeDto, SnoozeDto } from '../crm-health/hold.types';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const NEGOTIATION_LARGE_DEAL_THRESHOLD = 2_500_000;

const STAGE_DEFAULT_PROBABILITY: Record<PipelineStage, number> = {
  [PipelineStage.NEW]: 15,
  [PipelineStage.QUALIFIED]: 25,
  [PipelineStage.DEMO_SCHEDULED]: 35,
  [PipelineStage.DEMO_DONE]: 50,
  [PipelineStage.QUOTE_IN_PROGRESS]: 55,
  [PipelineStage.QUOTATION_SENT]: 65,
  [PipelineStage.FOLLOW_UP]: 65,
  [PipelineStage.NEGOTIATION]: 80,
  [PipelineStage.PO_EXPECTED]: 90,
  [PipelineStage.WON]: 100,
  [PipelineStage.LOST]: 0,
};

const OPEN_STAGES: PipelineStage[] = [
  PipelineStage.NEW,
  PipelineStage.QUALIFIED,
  PipelineStage.DEMO_SCHEDULED,
  PipelineStage.DEMO_DONE,
  PipelineStage.QUOTE_IN_PROGRESS,
  PipelineStage.QUOTATION_SENT,
  PipelineStage.FOLLOW_UP,
  PipelineStage.NEGOTIATION,
  PipelineStage.PO_EXPECTED,
];

const QUALIFIED_STAGES: PipelineStage[] = OPEN_STAGES.filter((s) => s !== PipelineStage.NEW);

function pad(n: number, width = 4): string {
  return String(n).padStart(width, '0');
}

function staleCutoff(): Date {
  return staleCutoffFor('prospect');
}

function weightedValue(deal: number, probability: number): number {
  return Math.round((deal * probability) / 100);
}

function buildSortStage(sort?: string): Record<string, 1 | -1> {
  switch (sort) {
    case 'value_desc':
      return { dealValue: -1, createdAt: -1 };
    case 'close_asc':
      return { expectedCloseDate: 1, createdAt: -1 };
    case 'stage':
      return { stageRank: 1, createdAt: -1 };
    case 'days_in_stage':
      return { stageChangedAt: 1, createdAt: -1 };
    case 'assignee':
      return { 'assignee.name': 1, createdAt: -1 };
    case 'last_activity':
      return { lastActivityAt: -1 };
    case 'created_desc':
    default:
      return { createdAt: -1 };
  }
}

const STAGE_RANK_BRANCHES = [
  PipelineStage.NEW,
  PipelineStage.QUALIFIED,
  PipelineStage.DEMO_SCHEDULED,
  PipelineStage.DEMO_DONE,
  PipelineStage.QUOTE_IN_PROGRESS,
  PipelineStage.QUOTATION_SENT,
  PipelineStage.FOLLOW_UP,
  PipelineStage.NEGOTIATION,
  PipelineStage.PO_EXPECTED,
  PipelineStage.WON,
  PipelineStage.LOST,
].map((s, idx) => ({ case: { $eq: ['$stage', s] }, then: idx }));

const PROJECT_PROSPECT = {
  id: '$_id',
  _id: 0,
  code: 1,
  leadId: 1,
  leadCode: 1,
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
  productInterest: 1,
  industry: 1,
  temperature: 1,
  tags: 1,
  assignedUserId: 1,
  assignee: 1,
  dealValue: 1,
  expectedCloseDate: 1,
  winProbability: 1,
  weightedValue: 1,
  stage: 1,
  status: 1,
  daysInStage: 1,
  budgetStatus: 1,
  authorityType: 1,
  decisionMakerCount: 1,
  confirmedNeed: 1,
  decisionTimeline: 1,
  qualificationNotes: 1,
  competitors: 1,
  lastActivityAt: 1,
  nextFollowUpDate: 1,
  nextFollowUpMode: 1,
  demoDate: 1,
  demoCompletedAt: 1,
  poNumber: 1,
  poDate: 1,
  wonAt: 1,
  lostAt: 1,
  lostReason: 1,
  lostToCompetitor: 1,
  convertedAt: 1,
  convertedBy: 1,
  createdBy: 1,
  stageChangedAt: 1,
  holdReason: 1,
  holdUntil: 1,
  holdNotes: 1,
  heldAt: 1,
  previousStatus: 1,
  previousStage: 1,
  alertSnoozedUntil: 1,
  createdAt: 1,
  updatedAt: 1,
};

const ENRICH_STAGES: MongoPipelineStage[] = [
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
      daysInStage: {
        $floor: {
          $divide: [
            { $subtract: ['$$NOW', { $ifNull: ['$stageChangedAt', '$convertedAt'] }] },
            1000 * 60 * 60 * 24,
          ],
        },
      },
      stageRank: { $switch: { branches: STAGE_RANK_BRANCHES, default: 99 } },
    },
  },
];

export interface ListProspectsFilters {
  q?: string;
  stage?: PipelineStage;
  status?: ProspectStatus;
  temperature?: string;
  assignedUserId?: string;
  closeFrom?: string | Date;
  closeTo?: string | Date;
  scope?: 'all' | 'hot' | 'qualified' | 'mine' | 'stale' | 'on_hold' | 'at_risk' | 'needs_attention';
  page?: number;
  limit?: number;
  sort?: string;
}

export interface ConvertLeadDto {
  dealValue: number;
  expectedCloseDate: Date | string;
  stage: PipelineStage;
  winProbability?: number;
  budgetStatus: BudgetStatus;
  authorityType: AuthorityType;
  confirmedNeed: string;
  decisionTimeline: DecisionTimeline;
  decisionMakerCount?: DecisionMakerCount;
  competitors?: string[];
  qualificationNotes?: string;
  assignedUserId?: string;
}

export interface ChangeStageDto {
  stage: PipelineStage;
  note?: string;
}

export interface MarkWonDto {
  poNumber: string;
  poDate: Date | string;
  note?: string;
}

export interface MarkLostDto {
  lostReason: LostReason;
  lostToCompetitor?: string;
  note?: string;
}

export class ProspectService {
  private buildMatch(filters: ListProspectsFilters, callerUserId: string): Record<string, unknown> {
    const match: Record<string, unknown> = {};

    if (filters.scope === 'mine') {
      match.assignedUserId = new Types.ObjectId(callerUserId);
    } else if (filters.assignedUserId) {
      match.assignedUserId = new Types.ObjectId(filters.assignedUserId);
    }

    if (filters.scope === 'hot') {
      match.temperature = 'hot';
      match.status = ProspectStatus.OPEN;
    } else if (filters.temperature) {
      match.temperature = filters.temperature;
    }

    if (filters.scope === 'qualified') {
      match.status = ProspectStatus.OPEN;
      match.stage = { $in: QUALIFIED_STAGES };
    } else if (filters.scope === 'on_hold') {
      match.status = ProspectStatus.ON_HOLD;
    } else if (filters.scope === 'stale') {
      match.status = ProspectStatus.OPEN;
      match.lastActivityAt = { $lt: staleCutoff() };
    } else if (filters.scope === 'at_risk' || filters.scope === 'needs_attention') {
      match.status = ProspectStatus.OPEN;
    }

    if (filters.stage) match.stage = filters.stage;
    if (filters.status) match.status = filters.status;

    if (filters.closeFrom || filters.closeTo) {
      const range: Record<string, Date> = {};
      if (filters.closeFrom) range.$gte = new Date(filters.closeFrom);
      if (filters.closeTo) range.$lte = new Date(filters.closeTo);
      match.expectedCloseDate = range;
    }

    if (filters.q && filters.q.trim()) {
      match.$text = { $search: filters.q.trim() };
    }

    return match;
  }

  async list(filters: ListProspectsFilters, callerUserId: string) {
    const match = this.buildMatch(filters, callerUserId);
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.max(1, Math.min(MAX_PAGE_SIZE, filters.limit ?? DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * limit;
    const sortStage = buildSortStage(filters.sort);

    const pipeline: MongoPipelineStage[] = [
      { $match: match },
      ...ENRICH_STAGES,
      { $sort: sortStage },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }, { $project: PROJECT_PROSPECT }],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const [agg] = await ProspectModel.aggregate(pipeline);
    let data = ((agg?.data ?? []) as Record<string, unknown>[]).map((row) =>
      enrichWithHealth(row, 'prospect'),
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
        : ((agg?.total?.[0]?.count ?? 0) as number);
    return { data, page, limit, total };
  }

  async getById(id: string): Promise<unknown> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid prospect id');
    const [doc] = await ProspectModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      ...ENRICH_STAGES,
      { $project: PROJECT_PROSPECT },
    ]);
    if (!doc) throw new AppError(404, 'Prospect not found');
    return enrichWithHealth(doc as Record<string, unknown>, 'prospect');
  }

  async findByLeadId(leadId: string): Promise<unknown | null> {
    if (!Types.ObjectId.isValid(leadId)) return null;
    const [doc] = await ProspectModel.aggregate([
      { $match: { leadId: new Types.ObjectId(leadId) } },
      ...ENRICH_STAGES,
      { $project: PROJECT_PROSPECT },
    ]);
    return doc ?? null;
  }

  async stats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const stale = staleCutoff();

    const [agg] = await ProspectModel.aggregate([
      {
        $facet: {
          open: [
            { $match: { status: ProspectStatus.OPEN } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pipelineValue: { $sum: '$dealValue' },
                weighted: { $sum: '$weightedValue' },
                hotCount: {
                  $sum: { $cond: [{ $eq: ['$temperature', 'hot'] }, 1, 0] },
                },
                qualifiedCount: {
                  $sum: { $cond: [{ $in: ['$stage', QUALIFIED_STAGES] }, 1, 0] },
                },
                staleCount: {
                  $sum: { $cond: [{ $lt: ['$lastActivityAt', stale] }, 1, 0] },
                },
                followUpsDueToday: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ['$nextFollowUpDate', null] },
                          { $gte: ['$nextFollowUpDate', today] },
                          { $lt: ['$nextFollowUpDate', tomorrow] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                overdueFollowUps: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ['$nextFollowUpDate', null] },
                          { $lt: ['$nextFollowUpDate', today] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          won: [
            { $match: { status: ProspectStatus.WON, wonAt: { $gte: monthStart } } },
            { $count: 'count' },
          ],
          lost: [
            { $match: { status: ProspectStatus.LOST, lostAt: { $gte: monthStart } } },
            { $count: 'count' },
          ],
          onHold: [{ $match: { status: ProspectStatus.ON_HOLD } }, { $count: 'count' }],
          onHoldValue: [
            { $match: { status: ProspectStatus.ON_HOLD } },
            { $group: { _id: null, total: { $sum: '$dealValue' } } },
          ],
          onHoldExpiring: [
            {
              $match: {
                status: ProspectStatus.ON_HOLD,
                holdUntil: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), $ne: null },
              },
            },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const o = agg?.open?.[0] ?? {};
    const onHoldCount = agg?.onHold?.[0]?.count ?? 0;
    const onHoldValue = agg?.onHoldValue?.[0]?.total ?? 0;
    const onHoldExpiringSoon = agg?.onHoldExpiring?.[0]?.count ?? 0;

    const openProspects = await ProspectModel.find({ status: ProspectStatus.OPEN }).lean();
    let atRiskCount = 0;
    let criticalCount = 0;
    for (const p of openProspects) {
      const { healthStatus } = computeHealth({
        entityType: 'prospect',
        status: p.status,
        lastActivityAt: p.lastActivityAt,
        followUpDate: p.nextFollowUpDate,
        expectedCloseDate: p.expectedCloseDate,
        stage: p.stage,
        stageChangedAt: p.stageChangedAt,
      });
      if (healthStatus === 'at_risk') atRiskCount += 1;
      if (healthStatus === 'critical') criticalCount += 1;
    }

    return {
      totalActive: o.total ?? 0,
      pipelineValue: o.pipelineValue ?? 0,
      weightedValue: o.weighted ?? 0,
      hotCount: o.hotCount ?? 0,
      qualifiedCount: o.qualifiedCount ?? 0,
      staleCount: o.staleCount ?? 0,
      onHoldCount,
      onHoldValue,
      atRiskCount,
      criticalCount,
      onHoldExpiringSoon,
      followUpsDueToday: o.followUpsDueToday ?? 0,
      overdueFollowUps: o.overdueFollowUps ?? 0,
      wonThisMonth: agg?.won?.[0]?.count ?? 0,
      lostThisMonth: agg?.lost?.[0]?.count ?? 0,
    };
  }

  async kanban(filters: ListProspectsFilters, callerUserId: string) {
    const match = this.buildMatch(filters, callerUserId);
    match.status = ProspectStatus.OPEN;

    const docs = await ProspectModel.aggregate([
      { $match: match },
      ...ENRICH_STAGES,
      { $sort: { dealValue: -1 } },
      { $project: PROJECT_PROSPECT },
    ]);

    const columns = OPEN_STAGES.map((stage) => {
      const stageDocs = (docs as Array<{ stage: PipelineStage; dealValue: number }>).filter(
        (p) => p.stage === stage,
      );
      return {
        stage,
        count: stageDocs.length,
        totalValue: stageDocs.reduce((acc, p) => acc + (p.dealValue || 0), 0),
        prospects: stageDocs,
      };
    });

    const onHoldDocs = await ProspectModel.aggregate([
      { $match: { status: ProspectStatus.ON_HOLD } },
      ...ENRICH_STAGES,
      { $sort: { dealValue: -1 } },
      { $project: PROJECT_PROSPECT },
    ]);

    columns.push({
      stage: 'on_hold' as PipelineStage,
      count: onHoldDocs.length,
      totalValue: (onHoldDocs as Array<{ dealValue: number }>).reduce(
        (acc, p) => acc + (p.dealValue || 0),
        0,
      ),
      prospects: onHoldDocs,
    });

    return { columns };
  }

  async forecast(callerUserId: string) {
    const docs = (await ProspectModel.aggregate([
      { $match: { status: ProspectStatus.OPEN } },
      ...ENRICH_STAGES,
      { $sort: { expectedCloseDate: 1 } },
      { $project: PROJECT_PROSPECT },
    ])) as Array<{
      dealValue: number;
      winProbability: number;
      weightedValue: number;
      expectedCloseDate: Date | string;
      assignedUserId: string;
      assignee?: { id?: string; name?: string };
    }>;
    void callerUserId;

    const total = docs.reduce((acc, p) => acc + (p.dealValue || 0), 0);
    const weighted = docs.reduce(
      (acc, p) => acc + (p.weightedValue || weightedValue(p.dealValue, p.winProbability)),
      0,
    );

    const monthMap = new Map<string, { key: string; label: string; total: number; weighted: number; count: number }>();
    const repMap = new Map<string, { key: string; label: string; total: number; weighted: number; count: number }>();

    docs.forEach((p) => {
      const d = new Date(p.expectedCloseDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      const existing = monthMap.get(key) ?? { key, label, total: 0, weighted: 0, count: 0 };
      existing.total += p.dealValue;
      existing.weighted += p.weightedValue || weightedValue(p.dealValue, p.winProbability);
      existing.count += 1;
      monthMap.set(key, existing);

      const repKey = String(p.assignedUserId);
      const repLabel = p.assignee?.name ?? 'Unassigned';
      const rep = repMap.get(repKey) ?? { key: repKey, label: repLabel, total: 0, weighted: 0, count: 0 };
      rep.total += p.dealValue;
      rep.weighted += p.weightedValue || weightedValue(p.dealValue, p.winProbability);
      rep.count += 1;
      repMap.set(repKey, rep);
    });

    const byMonth = [...monthMap.values()].sort((a, b) => a.key.localeCompare(b.key));
    const byRep = [...repMap.values()].sort((a, b) => b.weighted - a.weighted);

    const conservative = docs
      .filter((p) => p.winProbability >= 75)
      .reduce((acc, p) => acc + (p.weightedValue || weightedValue(p.dealValue, p.winProbability)), 0);

    return {
      total,
      weighted,
      byMonth,
      byRep,
      scenarios: { conservative, mostLikely: weighted, optimistic: total },
      rows: docs,
    };
  }

  async followUps(callerUserId: string) {
    return followUpService.listOpen('prospect', callerUserId);
  }

  private async autoTasksForStage(prospect: IProspect, stage: PipelineStage, userId: string): Promise<void> {
    const now = Date.now();
    const daysFromNow = (n: number) => new Date(now + n * 86400000);

    switch (stage) {
      case PipelineStage.DEMO_SCHEDULED: {
        const due = prospect.demoDate
          ? new Date(new Date(prospect.demoDate).getTime() - 86400000)
          : daysFromNow(1);
        await activityService.logSystem('prospect', prospect._id as Types.ObjectId, ActivityType.FOLLOW_UP, 'Confirm demo logistics', { occurredAt: due }, userId);
        break;
      }
      case PipelineStage.DEMO_DONE:
        await activityService.logSystem('prospect', prospect._id as Types.ObjectId, ActivityType.FOLLOW_UP, 'Send quotation', { occurredAt: daysFromNow(3) }, userId);
        break;
      case PipelineStage.QUOTATION_SENT:
        for (const d of [3, 7, 14, 21]) {
          await activityService.logSystem(
            'prospect',
            prospect._id as Types.ObjectId,
            ActivityType.FOLLOW_UP,
            `Follow up on quote (day ${d})`,
            { occurredAt: daysFromNow(d) },
            userId,
          );
        }
        break;
      case PipelineStage.NEGOTIATION:
        if (prospect.dealValue >= NEGOTIATION_LARGE_DEAL_THRESHOLD) {
          await activityService.logSystem(
            'prospect',
            prospect._id as Types.ObjectId,
            ActivityType.SYSTEM,
            'Manager notified — large deal in negotiation',
            {},
            userId,
          );
        }
        break;
      default:
        break;
    }
  }

  async convertLead(leadId: string, dto: ConvertLeadDto, userId: string): Promise<IProspect> {
    if (!Types.ObjectId.isValid(leadId)) throw new AppError(400, 'Invalid lead id');
    const existing = await ProspectModel.findOne({ leadId: new Types.ObjectId(leadId) });
    if (existing) throw new AppError(409, 'Lead has already been converted');

    const lead: ILead | null = await LeadModel.findById(leadId);
    if (!lead) throw new AppError(404, 'Lead not found');

    const probability = dto.winProbability ?? STAGE_DEFAULT_PROBABILITY[dto.stage];
    const seq = await srCounterService.nextSequence('prospect');
    const code = `PR-${pad(seq)}`;

    const assignedUserId = dto.assignedUserId
      ? new Types.ObjectId(dto.assignedUserId)
      : lead.assignedUserId;

    const now = new Date();

    const prospect = await ProspectModel.create({
      code,
      leadId: lead._id,
      leadCode: lead.code,
      firstName: lead.firstName,
      lastName: lead.lastName,
      mobile: lead.mobile,
      email: lead.email,
      company: lead.company,
      designation: lead.designation,
      city: lead.city,
      state: lead.state,
      source: lead.source,
      campaign: lead.campaign,
      productInterest: lead.productInterest,
      industry: lead.industry,
      temperature: lead.temperature,
      tags: [...(lead.tags ?? [])],
      assignedUserId,
      dealValue: dto.dealValue,
      expectedCloseDate: new Date(dto.expectedCloseDate),
      winProbability: probability,
      weightedValue: weightedValue(dto.dealValue, probability),
      stage: dto.stage,
      status: ProspectStatus.OPEN,
      stageChangedAt: now,
      budgetStatus: dto.budgetStatus,
      authorityType: dto.authorityType,
      decisionMakerCount: dto.decisionMakerCount,
      confirmedNeed: dto.confirmedNeed,
      decisionTimeline: dto.decisionTimeline,
      qualificationNotes: dto.qualificationNotes,
      competitors: dto.competitors ?? [],
      lastActivityAt: now,
      convertedAt: now,
      convertedBy: userId,
      createdBy: userId,
      ...(lead.followUpDate
        ? {
            nextFollowUpDate: lead.followUpDate,
            nextFollowUpMode: lead.followUpMode ?? undefined,
          }
        : {}),
    });

    await LeadModel.findByIdAndUpdate(lead._id, {
      status: LeadStatus.CONVERTED,
      convertedAt: now,
      lastActivityAt: now,
    });

    await activityService.relinkLeadActivitiesToProspect(
      lead._id as Types.ObjectId,
      prospect._id as Types.ObjectId,
    );

    await activityService.logSystem(
      'prospect',
      prospect._id as Types.ObjectId,
      ActivityType.CONVERSION,
      `Lead converted to prospect ${prospect.code}`,
      {
        description: `Converted from ${lead.code}`,
        metadata: { leadId: String(lead._id), leadCode: lead.code },
      },
      userId,
    );

    await this.autoTasksForStage(prospect, dto.stage, userId);

    logger.info('Lead converted to prospect', { leadId, prospectId: prospect._id, code, by: userId });
    return prospect;
  }

  async update(id: string, patch: Record<string, unknown>, userId: string): Promise<IProspect> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid prospect id');
    const prev = await ProspectModel.findById(id);
    if (!prev) throw new AppError(404, 'Prospect not found');
    if (prev.status !== ProspectStatus.OPEN) {
      throw new AppError(400, 'Closed prospects cannot be edited');
    }

    const {
      _id: _ignored1,
      id: _ignored2,
      __v: _ignored3,
      code: _ignored4,
      leadId: _ignored5,
      createdBy: _ignored6,
      createdAt: _ignored7,
      updatedAt: _ignored8,
      status: _ignored9,
      stage: _ignored10,
      stageChangedAt: _ignored11,
      ...updateData
    } = patch as Record<string, unknown>;

    const now = new Date();
    const updated = await ProspectModel.findByIdAndUpdate(
      id,
      { ...updateData, lastActivityAt: now },
      { new: true, runValidators: true },
    );
    if (!updated) throw new AppError(404, 'Prospect not found');

    if (updateData.dealValue !== undefined || updateData.winProbability !== undefined) {
      updated.weightedValue = weightedValue(updated.dealValue, updated.winProbability);
      await updated.save();
    }

    await activityService.logSystem(
      'prospect',
      updated._id as Types.ObjectId,
      ActivityType.SYSTEM,
      'Prospect details updated',
      {},
      userId,
    );

    return updated;
  }

  async changeStage(id: string, dto: ChangeStageDto, userId: string): Promise<IProspect> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid prospect id');
    const prev = await ProspectModel.findById(id);
    if (!prev) throw new AppError(404, 'Prospect not found');
    if (prev.status !== ProspectStatus.OPEN) {
      throw new AppError(400, 'Closed prospects cannot change stage');
    }
    if (prev.stage === dto.stage) return prev;

    const now = new Date();
    const probability = STAGE_DEFAULT_PROBABILITY[dto.stage];
    prev.stage = dto.stage;
    prev.winProbability = probability;
    prev.weightedValue = weightedValue(prev.dealValue, probability);
    prev.stageChangedAt = now;
    prev.lastActivityAt = now;
    await prev.save();

    await activityService.logSystem(
      'prospect',
      prev._id as Types.ObjectId,
      ActivityType.STAGE_CHANGE,
      `Stage changed: ${prev.stage}`,
      {
        description: dto.note,
        metadata: { fromStage: prev.stage, toStage: dto.stage },
      },
      userId,
    );

    await this.autoTasksForStage(prev, dto.stage, userId);
    return prev;
  }

  async markWon(id: string, dto: MarkWonDto, userId: string): Promise<IProspect> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid prospect id');
    const prev = await ProspectModel.findById(id);
    if (!prev) throw new AppError(404, 'Prospect not found');

    const now = new Date();
    prev.stage = PipelineStage.WON;
    prev.status = ProspectStatus.WON;
    prev.poNumber = dto.poNumber;
    prev.poDate = new Date(dto.poDate);
    prev.wonAt = now;
    prev.winProbability = 100;
    prev.weightedValue = prev.dealValue;
    prev.stageChangedAt = now;
    prev.lastActivityAt = now;
    await prev.save();

    await activityService.logSystem(
      'prospect',
      prev._id as Types.ObjectId,
      ActivityType.WON,
      `Deal won — PO ${dto.poNumber}`,
      {
        description: dto.note,
        metadata: { poNumber: dto.poNumber, poDate: prev.poDate },
      },
      userId,
    );
    return prev;
  }

  async markLost(id: string, dto: MarkLostDto, userId: string): Promise<IProspect> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid prospect id');
    const prev = await ProspectModel.findById(id);
    if (!prev) throw new AppError(404, 'Prospect not found');

    const now = new Date();
    prev.stage = PipelineStage.LOST;
    prev.status = ProspectStatus.LOST;
    prev.lostReason = dto.lostReason;
    prev.lostToCompetitor = dto.lostToCompetitor;
    prev.lostAt = now;
    prev.winProbability = 0;
    prev.weightedValue = 0;
    prev.stageChangedAt = now;
    prev.lastActivityAt = now;
    await prev.save();

    await activityService.logSystem(
      'prospect',
      prev._id as Types.ObjectId,
      ActivityType.LOST,
      `Deal lost — ${dto.lostReason}`,
      {
        description: dto.note,
        metadata: { lostReason: dto.lostReason, lostToCompetitor: dto.lostToCompetitor },
      },
      userId,
    );
    return prev;
  }

  async remove(id: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid prospect id');
    const res = await ProspectModel.findByIdAndDelete(id);
    if (!res) throw new AppError(404, 'Prospect not found');
    logger.info('Prospect deleted', { id, by: userId });
  }

  async clearFollowUp(id: string): Promise<IProspect> {
    return followUpService.clearFollowUp('prospect', id) as Promise<IProspect>;
  }

  async syncFollowUpFromActivity(prospectId: string, occurredAt: Date, mode?: string): Promise<void> {
    return followUpService.syncFromActivity('prospect', prospectId, occurredAt, mode);
  }

  async touchLastActivity(prospectId: string): Promise<void> {
    return followUpService.touchLastActivity('prospect', prospectId);
  }

  async completeFollowUp(
    id: string,
    dto: {
      doneAs: ActivityType;
      title: string;
      note?: string;
      reschedule?: { occurredAt: Date | string; mode: FollowUpMode; note?: string };
    },
    userId: string,
  ): Promise<{ prospect: IProspect; completedFollowUpId: string | null; touchpointId: string; scheduledId: string | null }> {
    const result = await followUpService.completeFollowUp('prospect', id, dto, userId);
    return {
      prospect: result.entity as IProspect,
      completedFollowUpId: result.completedFollowUpId,
      touchpointId: result.touchpointId,
      scheduledId: result.scheduledId,
    };
  }

  async listCompletedFollowUps(
    days: number,
    callerUserId: string,
    scope?: 'mine' | 'all',
  ): Promise<unknown[]> {
    return followUpService.listCompleted('prospect', days, callerUserId, scope);
  }

  async putOnHold(id: string, dto: PutOnHoldDto, userId: string): Promise<IProspect> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid prospect id');
    const prev = await ProspectModel.findById(id);
    if (!prev) throw new AppError(404, 'Prospect not found');
    if ([ProspectStatus.WON, ProspectStatus.LOST, ProspectStatus.ON_HOLD].includes(prev.status)) {
      throw new AppError(400, 'Prospect cannot be put on hold in its current status');
    }

    prev.previousStatus = prev.status;
    prev.previousStage = prev.stage;
    prev.status = ProspectStatus.ON_HOLD;
    prev.holdReason = dto.holdReason;
    prev.holdUntil = dto.holdUntil ? new Date(dto.holdUntil) : null;
    prev.holdNotes = dto.holdNotes ?? null;
    prev.heldAt = new Date();
    prev.heldBy = new Types.ObjectId(userId);
    await prev.save();
    await followUpService.clearFollowUp('prospect', id);

    await activityService.logSystem(
      'prospect',
      prev._id as Types.ObjectId,
      ActivityType.ON_HOLD,
      'Prospect put on hold',
      {
        description: dto.holdNotes ?? undefined,
        metadata: { holdReason: dto.holdReason, holdUntil: prev.holdUntil },
      },
      userId,
    );
    return prev;
  }

  async resume(id: string, dto: ResumeDto, userId: string): Promise<IProspect> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid prospect id');
    const prev = await ProspectModel.findById(id);
    if (!prev) throw new AppError(404, 'Prospect not found');
    if (prev.status !== ProspectStatus.ON_HOLD) throw new AppError(400, 'Prospect is not on hold');

    prev.status = (prev.previousStatus as ProspectStatus) ?? ProspectStatus.OPEN;
    if (prev.previousStage) prev.stage = prev.previousStage as PipelineStage;
    prev.previousStatus = null;
    prev.previousStage = null;
    prev.holdReason = null;
    prev.holdUntil = null;
    prev.holdNotes = null;
    prev.heldAt = null;
    prev.heldBy = null;
    prev.lastActivityAt = new Date();
    await prev.save();

    if (dto.followUpDate) {
      const mode = (dto.followUpMode ?? FollowUpMode.PHONE) as FollowUpMode;
      await followUpService.syncFromActivity('prospect', id, new Date(dto.followUpDate), mode);
    }

    await activityService.logSystem(
      'prospect',
      prev._id as Types.ObjectId,
      ActivityType.RESUMED,
      'Prospect resumed from hold',
      { description: dto.note ?? undefined },
      userId,
    );
    return prev;
  }

  async snooze(id: string, dto: SnoozeDto, _userId: string): Promise<IProspect> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid prospect id');
    const until = new Date();
    until.setDate(until.getDate() + dto.days);
    const prev = await ProspectModel.findByIdAndUpdate(id, { alertSnoozedUntil: until }, { new: true });
    if (!prev) throw new AppError(404, 'Prospect not found');
    return prev;
  }
}

export const prospectService = new ProspectService();
