import { PipelineStage as MongoPipelineStage, Types } from 'mongoose';
import {
  DrawingsStatus,
  IOpportunity,
  OpportunityLossReason,
  OpportunityModel,
  OpportunityStage,
  OpportunityStatus,
  OpportunityType,
  PaymentMilestone,
  PaymentTermsPreset,
  SiteVisitStatus,
  WarrantyPeriod,
} from './opportunity.model';
import {
  BudgetStatus,
  DecisionTimeline,
  FollowUpMode,
  LeadIndustry,
  LeadProductInterest,
  LeadSource,
  LeadTemperature,
} from '../lead/lead.model';
import { AuthorityType, IProspect, ProspectModel } from '../prospect/prospect.model';
import { activityService } from '../activity/activity.service';
import { ActivityModel, ActivityType } from '../activity/activity.model';
import { srCounterService } from '../sr-counter/sr-counter.service';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const STALE_THRESHOLD_DAYS = 7;
const ATRISK_THRESHOLD_DAYS = 14;

const STAGE_DEFAULT_PROBABILITY: Record<OpportunityStage, number> = {
  [OpportunityStage.SCOPE_DEFINED]: 40,
  [OpportunityStage.QUOTE_IN_PROGRESS]: 40,
  [OpportunityStage.UNDER_REVIEW]: 45,
  [OpportunityStage.QUOTE_APPROVED]: 50,
  [OpportunityStage.QUOTE_SENT]: 55,
  [OpportunityStage.REVISION_REQUESTED]: 60,
  [OpportunityStage.NEGOTIATION]: 70,
  [OpportunityStage.VERBAL_COMMITMENT]: 90,
  [OpportunityStage.WON]: 100,
  [OpportunityStage.LOST]: 0,
};

const OPEN_STAGES: OpportunityStage[] = [
  OpportunityStage.SCOPE_DEFINED,
  OpportunityStage.QUOTE_IN_PROGRESS,
  OpportunityStage.UNDER_REVIEW,
  OpportunityStage.QUOTE_APPROVED,
  OpportunityStage.QUOTE_SENT,
  OpportunityStage.REVISION_REQUESTED,
  OpportunityStage.NEGOTIATION,
  OpportunityStage.VERBAL_COMMITMENT,
];

const STAGE_RANK_BRANCHES = [
  OpportunityStage.SCOPE_DEFINED,
  OpportunityStage.QUOTE_IN_PROGRESS,
  OpportunityStage.UNDER_REVIEW,
  OpportunityStage.QUOTE_APPROVED,
  OpportunityStage.QUOTE_SENT,
  OpportunityStage.REVISION_REQUESTED,
  OpportunityStage.NEGOTIATION,
  OpportunityStage.VERBAL_COMMITMENT,
  OpportunityStage.WON,
  OpportunityStage.LOST,
].map((s, idx) => ({ case: { $eq: ['$stage', s] }, then: idx }));

function pad(n: number, width = 4): string {
  return String(n).padStart(width, '0');
}

function staleCutoff(): Date {
  const d = new Date();
  d.setDate(d.getDate() - STALE_THRESHOLD_DAYS);
  return d;
}

function weightedValue(deal: number, probability: number): number {
  return Math.round((deal * probability) / 100);
}

function buildSortStage(sort?: string): Record<string, 1 | -1> {
  switch (sort) {
    case 'value_desc':
      return { dealValue: -1, createdAt: -1 };
    case 'deadline_asc':
      return { submissionDeadline: 1, createdAt: -1 };
    case 'stage':
      return { stageRank: 1, createdAt: -1 };
    case 'days_in_stage':
      return { stageChangedAt: 1, createdAt: -1 };
    case 'last_activity':
      return { lastActivityAt: -1 };
    case 'created_desc':
    default:
      return { createdAt: -1 };
  }
}

const PROJECT_OPPORTUNITY = {
  id: '$_id',
  _id: 0,
  code: 1,
  prospectId: 1,
  prospectCode: 1,
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
  quotationOwnerId: 1,
  quotationOwner: 1,
  technicalReviewerId: 1,
  technicalReviewer: 1,
  name: 1,
  type: 1,
  dealValue: 1,
  expectedCloseDate: 1,
  winProbability: 1,
  weightedValue: 1,
  approvalThreshold: 1,
  stage: 1,
  status: 1,
  stageChangedAt: 1,
  daysInStage: 1,
  scopeOfWork: 1,
  siteLocation: 1,
  siteVisitStatus: 1,
  siteVisitDate: 1,
  technicalSpecs: 1,
  drawingsStatus: 1,
  paymentTermsPreset: 1,
  paymentMilestones: 1,
  paymentNotes: 1,
  deliveryTimeline: 1,
  warrantyPeriod: 1,
  submissionDeadline: 1,
  budgetStatus: 1,
  authorityType: 1,
  decisionMakerCount: 1,
  confirmedNeed: 1,
  decisionTimeline: 1,
  qualificationNotes: 1,
  competitors: 1,
  activeQuoteId: 1,
  activeQuoteNumber: 1,
  activeQuoteStatus: 1,
  activeQuoteValue: 1,
  activeQuoteMarginPct: 1,
  quoteCount: 1,
  lastActivityAt: 1,
  nextFollowUpDate: 1,
  nextFollowUpMode: 1,
  poNumber: 1,
  poDate: 1,
  poDocumentUrl: 1,
  wonAt: 1,
  wonValue: 1,
  lostAt: 1,
  lossReason: 1,
  competitorWon: 1,
  competitorPrice: 1,
  priceGap: 1,
  customerFeedback: 1,
  convertedAt: 1,
  convertedBy: 1,
  createdBy: 1,
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
    $lookup: {
      from: 'users',
      localField: 'quotationOwnerId',
      foreignField: '_id',
      as: 'quotationOwner',
    },
  },
  {
    $lookup: {
      from: 'users',
      localField: 'technicalReviewerId',
      foreignField: '_id',
      as: 'technicalReviewer',
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
      quotationOwner: {
        $arrayElemAt: [
          {
            $map: {
              input: '$quotationOwner',
              as: 'a',
              in: { id: '$$a._id', name: '$$a.name', email: '$$a.email' },
            },
          },
          0,
        ],
      },
      technicalReviewer: {
        $arrayElemAt: [
          {
            $map: {
              input: '$technicalReviewer',
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
            { $subtract: ['$$NOW', { $ifNull: ['$stageChangedAt', '$createdAt'] }] },
            1000 * 60 * 60 * 24,
          ],
        },
      },
      stageRank: { $switch: { branches: STAGE_RANK_BRANCHES, default: 99 } },
    },
  },
];

export interface ListOpportunitiesFilters {
  q?: string;
  stage?: OpportunityStage;
  status?: OpportunityStatus;
  type?: OpportunityType;
  assignedUserId?: string;
  deadlineFrom?: string | Date;
  deadlineTo?: string | Date;
  scope?: 'all' | 'mine' | 'stale' | 'due-this-week' | 'pending-approvals';
  page?: number;
  limit?: number;
  sort?: string;
}

export interface ConvertProspectDto {
  name: string;
  type: OpportunityType;
  submissionDeadline: Date | string;
  scopeOfWork: string;
  siteLocation?: string;
  siteVisitStatus: SiteVisitStatus;
  siteVisitDate?: Date | string | null;
  technicalSpecs: string;
  drawingsStatus: DrawingsStatus;
  paymentTermsPreset: PaymentTermsPreset;
  paymentMilestones?: PaymentMilestone[];
  paymentNotes?: string;
  deliveryTimeline: string;
  warrantyPeriod: WarrantyPeriod;
  quotationOwnerId: string;
  technicalReviewerId?: string;
  approvalThreshold: number;
  assignedUserId?: string;
  dealValue?: number;
  expectedCloseDate?: Date | string;
}

export interface CreateStandaloneDto extends ConvertProspectDto {
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  company?: string;
  city?: string;
  state?: string;
  industry?: LeadIndustry;
  productInterest?: LeadProductInterest;
  source: LeadSource;
  temperature?: LeadTemperature;
  budgetStatus?: BudgetStatus;
  authorityType?: AuthorityType;
  decisionTimeline?: DecisionTimeline;
  confirmedNeed?: string;
  competitors?: string[];
}

export interface ChangeStageDto {
  stage: OpportunityStage;
  note?: string;
}

export interface MarkWonDto {
  poNumber: string;
  poDate: Date | string;
  wonValue: number;
  poDocumentUrl?: string;
  note?: string;
}

export interface MarkLostDto {
  lossReason: OpportunityLossReason;
  competitorWon?: string;
  competitorPrice?: number;
  customerFeedback?: string;
  note?: string;
}

export class OpportunityService {
  private buildMatch(
    filters: ListOpportunitiesFilters,
    callerUserId: string
  ): Record<string, unknown> {
    const match: Record<string, unknown> = {};

    if (filters.scope === 'mine') {
      match.assignedUserId = new Types.ObjectId(callerUserId);
    } else if (filters.assignedUserId) {
      match.assignedUserId = new Types.ObjectId(filters.assignedUserId);
    }

    if (filters.scope === 'stale') {
      match.status = OpportunityStatus.OPEN;
      match.lastActivityAt = { $lt: staleCutoff() };
    }

    if (filters.scope === 'due-this-week') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      match.submissionDeadline = { $gte: start, $lte: end };
      match.status = OpportunityStatus.OPEN;
    }

    if (filters.scope === 'pending-approvals') {
      match.stage = OpportunityStage.UNDER_REVIEW;
      match.status = OpportunityStatus.OPEN;
    }

    if (filters.stage) match.stage = filters.stage;
    if (filters.status) match.status = filters.status;
    if (filters.type) match.type = filters.type;

    if (filters.deadlineFrom || filters.deadlineTo) {
      const range: Record<string, Date> = {};
      if (filters.deadlineFrom) range.$gte = new Date(filters.deadlineFrom);
      if (filters.deadlineTo) range.$lte = new Date(filters.deadlineTo);
      match.submissionDeadline = range;
    }

    if (filters.q && filters.q.trim()) {
      match.$text = { $search: filters.q.trim() };
    }

    return match;
  }

  async list(filters: ListOpportunitiesFilters, callerUserId: string) {
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
          data: [{ $skip: skip }, { $limit: limit }, { $project: PROJECT_OPPORTUNITY }],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const [agg] = await OpportunityModel.aggregate(pipeline);
    const data = (agg?.data ?? []) as unknown[];
    const total = (agg?.total?.[0]?.count ?? 0) as number;
    return { data, page, limit, total };
  }

  async getById(id: string): Promise<unknown> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid opportunity id');
    const [doc] = await OpportunityModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      ...ENRICH_STAGES,
      { $project: PROJECT_OPPORTUNITY },
    ]);
    if (!doc) throw new AppError(404, 'Opportunity not found');
    return doc;
  }

  async findByProspectId(prospectId: string): Promise<unknown | null> {
    if (!Types.ObjectId.isValid(prospectId)) return null;
    const [doc] = await OpportunityModel.aggregate([
      { $match: { prospectId: new Types.ObjectId(prospectId) } },
      ...ENRICH_STAGES,
      { $project: PROJECT_OPPORTUNITY },
    ]);
    return doc ?? null;
  }

  async stats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const stale = staleCutoff();

    const [agg] = await OpportunityModel.aggregate([
      {
        $facet: {
          open: [
            { $match: { status: OpportunityStatus.OPEN } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pipelineValue: { $sum: '$dealValue' },
                weighted: { $sum: '$weightedValue' },
                quotesPendingSend: {
                  $sum: {
                    $cond: [{ $eq: ['$stage', OpportunityStage.QUOTE_APPROVED] }, 1, 0],
                  },
                },
                pendingApprovals: {
                  $sum: {
                    $cond: [{ $eq: ['$stage', OpportunityStage.UNDER_REVIEW] }, 1, 0],
                  },
                },
                staleCount: {
                  $sum: { $cond: [{ $lt: ['$lastActivityAt', stale] }, 1, 0] },
                },
                submissionsDueThisWeek: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$submissionDeadline', today] },
                          { $lte: ['$submissionDeadline', weekEnd] },
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
            { $match: { status: OpportunityStatus.WON, wonAt: { $gte: monthStart } } },
            { $count: 'count' },
          ],
          lost: [
            { $match: { status: OpportunityStatus.LOST, lostAt: { $gte: monthStart } } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const o = agg?.open?.[0] ?? {};
    return {
      totalActive: o.total ?? 0,
      pipelineValue: o.pipelineValue ?? 0,
      weightedValue: o.weighted ?? 0,
      quotesPendingSend: o.quotesPendingSend ?? 0,
      pendingApprovals: o.pendingApprovals ?? 0,
      staleCount: o.staleCount ?? 0,
      submissionsDueThisWeek: o.submissionsDueThisWeek ?? 0,
      wonThisMonth: agg?.won?.[0]?.count ?? 0,
      lostThisMonth: agg?.lost?.[0]?.count ?? 0,
    };
  }

  async kanban(filters: ListOpportunitiesFilters, callerUserId: string) {
    const match = this.buildMatch(filters, callerUserId);
    match.status = OpportunityStatus.OPEN;

    const docs = (await OpportunityModel.aggregate([
      { $match: match },
      ...ENRICH_STAGES,
      { $sort: { dealValue: -1 } },
      { $project: PROJECT_OPPORTUNITY },
    ])) as Array<{ stage: OpportunityStage; dealValue: number }>;

    const columns = OPEN_STAGES.map((stage) => {
      const stageDocs = docs.filter((d) => d.stage === stage);
      return {
        stage,
        count: stageDocs.length,
        totalValue: stageDocs.reduce((acc, d) => acc + (d.dealValue || 0), 0),
        opportunities: stageDocs,
      };
    });
    return { columns };
  }

  async forecast() {
    const docs = (await OpportunityModel.aggregate([
      { $match: { status: OpportunityStatus.OPEN } },
      ...ENRICH_STAGES,
      { $sort: { expectedCloseDate: 1 } },
      { $project: PROJECT_OPPORTUNITY },
    ])) as Array<{
      dealValue: number;
      winProbability: number;
      weightedValue: number;
      expectedCloseDate: Date | string;
      assignedUserId: string;
      assignee?: { id?: string; name?: string };
    }>;

    const total = docs.reduce((acc, p) => acc + (p.dealValue || 0), 0);
    const weighted = docs.reduce(
      (acc, p) => acc + (p.weightedValue || weightedValue(p.dealValue, p.winProbability)),
      0
    );

    const monthMap = new Map<
      string,
      { key: string; label: string; total: number; weighted: number; count: number }
    >();
    const repMap = new Map<
      string,
      { key: string; label: string; total: number; weighted: number; count: number }
    >();

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
      const rep = repMap.get(repKey) ?? {
        key: repKey,
        label: repLabel,
        total: 0,
        weighted: 0,
        count: 0,
      };
      rep.total += p.dealValue;
      rep.weighted += p.weightedValue || weightedValue(p.dealValue, p.winProbability);
      rep.count += 1;
      repMap.set(repKey, rep);
    });

    const byMonth = [...monthMap.values()].sort((a, b) => a.key.localeCompare(b.key));
    const byRep = [...repMap.values()].sort((a, b) => b.weighted - a.weighted);
    const conservative = docs
      .filter((p) => p.winProbability >= 75)
      .reduce(
        (acc, p) => acc + (p.weightedValue || weightedValue(p.dealValue, p.winProbability)),
        0
      );

    return {
      total,
      weighted,
      byMonth,
      byRep,
      scenarios: { conservative, mostLikely: weighted, optimistic: total },
      rows: docs,
    };
  }

  async staleList() {
    return OpportunityModel.aggregate([
      { $match: { status: OpportunityStatus.OPEN, lastActivityAt: { $lt: staleCutoff() } } },
      ...ENRICH_STAGES,
      { $sort: { lastActivityAt: 1 } },
      { $project: PROJECT_OPPORTUNITY },
    ]);
  }

  async winLoss() {
    const docs = (await OpportunityModel.find({
      status: { $in: [OpportunityStatus.WON, OpportunityStatus.LOST] },
    })
      .populate('assignedUserId', 'name')
      .lean()) as Array<{
      status: OpportunityStatus;
      dealValue: number;
      wonAt?: Date;
      lostAt?: Date;
      createdAt: Date;
      lossReason?: OpportunityLossReason;
      competitorWon?: string;
      priceGap?: number;
      type: OpportunityType;
      source: LeadSource;
      assignedUserId: { _id: Types.ObjectId; name?: string } | Types.ObjectId | string;
    }>;

    const won = docs.filter((d) => d.status === OpportunityStatus.WON);
    const lost = docs.filter((d) => d.status === OpportunityStatus.LOST);
    const winRatePct =
      won.length + lost.length === 0
        ? 0
        : Math.round((won.length * 1000) / (won.length + lost.length)) / 10;

    const cycleDays = (closed: Date | undefined, created: Date) =>
      closed
        ? Math.max(0, Math.floor((closed.getTime() - new Date(created).getTime()) / 86400000))
        : 0;

    const cycles = docs.map((d) =>
      cycleDays(d.status === OpportunityStatus.WON ? d.wonAt : d.lostAt, d.createdAt)
    );
    const avgCycleDays = cycles.length
      ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length)
      : 0;

    const byLossReason = new Map<OpportunityLossReason, { count: number; value: number }>();
    const byCompetitor = new Map<string, { count: number; value: number }>();
    lost.forEach((d) => {
      if (d.lossReason) {
        const e = byLossReason.get(d.lossReason) ?? { count: 0, value: 0 };
        e.count += 1;
        e.value += d.dealValue;
        byLossReason.set(d.lossReason, e);
      }
      if (d.competitorWon) {
        const e = byCompetitor.get(d.competitorWon) ?? { count: 0, value: 0 };
        e.count += 1;
        e.value += d.dealValue;
        byCompetitor.set(d.competitorWon, e);
      }
    });

    const buildGroup = <K extends string>(
      items: typeof docs,
      key: (d: (typeof docs)[number]) => K
    ) => {
      const m = new Map<K, { won: number; lost: number }>();
      items.forEach((d) => {
        const k = key(d);
        const e = m.get(k) ?? { won: 0, lost: 0 };
        if (d.status === OpportunityStatus.WON) e.won += 1;
        else e.lost += 1;
        m.set(k, e);
      });
      return [...m.entries()].map(([k, v]) => ({
        key: k,
        won: v.won,
        lost: v.lost,
        winRatePct: v.won + v.lost === 0 ? 0 : Math.round((v.won * 1000) / (v.won + v.lost)) / 10,
      }));
    };

    const byTypeRaw = buildGroup(docs, (d) => d.type);
    const bySourceRaw = buildGroup(docs, (d) => d.source);
    const byRepRaw = buildGroup(docs, (d) => {
      const a = d.assignedUserId as
        | { _id?: Types.ObjectId; name?: string }
        | Types.ObjectId
        | string;
      if (typeof a === 'string') return a;
      if (a instanceof Types.ObjectId) return String(a);
      return String(a._id ?? a);
    });

    const repNames = new Map<string, string>();
    docs.forEach((d) => {
      const a = d.assignedUserId as
        | { _id?: Types.ObjectId; name?: string }
        | Types.ObjectId
        | string;
      if (typeof a === 'object' && !(a instanceof Types.ObjectId) && a?._id) {
        repNames.set(String(a._id), a.name ?? '');
      }
    });

    const priceLosses = lost.filter(
      (d) => d.lossReason === OpportunityLossReason.PRICE_HIGH && d.priceGap !== undefined
    );
    const avgPriceGapWhenLostOnPrice = priceLosses.length
      ? Math.round(priceLosses.reduce((a, b) => a + (b.priceGap ?? 0), 0) / priceLosses.length)
      : 0;

    return {
      wonCount: won.length,
      lostCount: lost.length,
      winRatePct,
      avgCycleDays,
      totalWonValue: won.reduce((a, b) => a + b.dealValue, 0),
      totalLostValue: lost.reduce((a, b) => a + b.dealValue, 0),
      byLossReason: [...byLossReason.entries()].map(([reason, v]) => ({
        reason,
        count: v.count,
        value: v.value,
      })),
      byCompetitor: [...byCompetitor.entries()].map(([competitor, v]) => ({
        competitor,
        count: v.count,
        value: v.value,
      })),
      byType: byTypeRaw.map((r) => ({
        type: r.key,
        won: r.won,
        lost: r.lost,
        winRatePct: r.winRatePct,
      })),
      byRep: byRepRaw.map((r) => ({
        userId: r.key,
        name: repNames.get(r.key) ?? r.key,
        won: r.won,
        lost: r.lost,
        winRatePct: r.winRatePct,
      })),
      bySource: bySourceRaw.map((r) => ({
        source: r.key,
        won: r.won,
        lost: r.lost,
        winRatePct: r.winRatePct,
      })),
      avgPriceGapWhenLostOnPrice,
      atRiskThresholdDays: ATRISK_THRESHOLD_DAYS,
    };
  }

  private async autoTasksForStage(
    opp: IOpportunity,
    stage: OpportunityStage,
    userId: string
  ): Promise<void> {
    const now = Date.now();
    const daysFromNow = (n: number) => new Date(now + n * 86400000);

    switch (stage) {
      case OpportunityStage.QUOTE_SENT:
        for (const d of [3, 7, 14]) {
          await activityService.logSystem(
            'opportunity',
            opp._id as Types.ObjectId,
            ActivityType.FOLLOW_UP,
            `Follow up on quote (day ${d})`,
            { occurredAt: daysFromNow(d) },
            userId
          );
        }
        break;
      case OpportunityStage.NEGOTIATION:
        if (opp.dealValue >= opp.approvalThreshold) {
          await activityService.logSystem(
            'opportunity',
            opp._id as Types.ObjectId,
            ActivityType.SYSTEM,
            'Manager notified — large deal in negotiation',
            {},
            userId
          );
        }
        break;
      case OpportunityStage.VERBAL_COMMITMENT:
        await activityService.logSystem(
          'opportunity',
          opp._id as Types.ObjectId,
          ActivityType.FOLLOW_UP,
          'Chase PO document',
          { occurredAt: daysFromNow(2) },
          userId
        );
        break;
      default:
        break;
    }
  }

  async convertFromProspect(
    prospectId: string,
    dto: ConvertProspectDto,
    userId: string
  ): Promise<IOpportunity> {
    if (!Types.ObjectId.isValid(prospectId)) throw new AppError(400, 'Invalid prospect id');
    const existing = await OpportunityModel.findOne({ prospectId: new Types.ObjectId(prospectId) });
    if (existing) throw new AppError(409, 'Prospect has already been converted to an opportunity');

    const prospect: IProspect | null = await ProspectModel.findById(prospectId);
    if (!prospect) throw new AppError(404, 'Prospect not found');

    const seq = await srCounterService.nextSequence('opportunity');
    const code = `OPP-${pad(seq)}`;

    const stage = OpportunityStage.SCOPE_DEFINED;
    const probability = STAGE_DEFAULT_PROBABILITY[stage];
    const dealValue = dto.dealValue ?? prospect.dealValue;
    const expectedCloseDate = dto.expectedCloseDate
      ? new Date(dto.expectedCloseDate)
      : prospect.expectedCloseDate;
    const assignedUserId = dto.assignedUserId
      ? new Types.ObjectId(dto.assignedUserId)
      : prospect.assignedUserId;
    const now = new Date();

    const opp = await OpportunityModel.create({
      code,
      prospectId: prospect._id,
      prospectCode: prospect.code,

      firstName: prospect.firstName,
      lastName: prospect.lastName,
      mobile: prospect.mobile,
      email: prospect.email,
      company: prospect.company,
      designation: prospect.designation,
      city: prospect.city,
      state: prospect.state,
      source: prospect.source,
      campaign: prospect.campaign,
      productInterest: prospect.productInterest,
      industry: prospect.industry,
      temperature: prospect.temperature,
      tags: [...(prospect.tags ?? [])],

      assignedUserId,
      quotationOwnerId: new Types.ObjectId(dto.quotationOwnerId),
      technicalReviewerId: dto.technicalReviewerId
        ? new Types.ObjectId(dto.technicalReviewerId)
        : null,

      name: dto.name.trim(),
      type: dto.type,
      dealValue,
      expectedCloseDate,
      winProbability: probability,
      weightedValue: weightedValue(dealValue, probability),
      approvalThreshold: dto.approvalThreshold,

      stage,
      status: OpportunityStatus.OPEN,
      stageChangedAt: now,

      scopeOfWork: dto.scopeOfWork,
      siteLocation: dto.siteLocation,
      siteVisitStatus: dto.siteVisitStatus,
      siteVisitDate: dto.siteVisitDate ? new Date(dto.siteVisitDate) : null,

      technicalSpecs: dto.technicalSpecs,
      drawingsStatus: dto.drawingsStatus,

      paymentTermsPreset: dto.paymentTermsPreset,
      paymentMilestones: dto.paymentMilestones ?? [],
      paymentNotes: dto.paymentNotes,
      deliveryTimeline: dto.deliveryTimeline,
      warrantyPeriod: dto.warrantyPeriod,

      submissionDeadline: new Date(dto.submissionDeadline),

      budgetStatus: prospect.budgetStatus,
      authorityType: prospect.authorityType,
      decisionMakerCount: prospect.decisionMakerCount,
      confirmedNeed: prospect.confirmedNeed,
      decisionTimeline: prospect.decisionTimeline,
      qualificationNotes: prospect.qualificationNotes,
      competitors: [...(prospect.competitors ?? [])],

      lastActivityAt: now,
      convertedAt: now,
      convertedBy: userId,
      createdBy: userId,
    });

    await activityService.logSystem(
      'opportunity',
      opp._id as Types.ObjectId,
      ActivityType.CONVERSION,
      `Prospect converted to opportunity ${opp.code}`,
      {
        description: `Converted from ${prospect.code}`,
        metadata: { prospectId: String(prospect._id), prospectCode: prospect.code },
      },
      userId
    );

    logger.info('Prospect converted to opportunity', {
      prospectId,
      opportunityId: opp._id,
      code,
      by: userId,
    });
    return opp;
  }

  async createStandalone(dto: CreateStandaloneDto, userId: string): Promise<IOpportunity> {
    const seq = await srCounterService.nextSequence('opportunity');
    const code = `OPP-${pad(seq)}`;
    const stage = OpportunityStage.SCOPE_DEFINED;
    const probability = STAGE_DEFAULT_PROBABILITY[stage];
    const dealValue = dto.dealValue ?? 0;
    const now = new Date();
    const assignedUserId = dto.assignedUserId
      ? new Types.ObjectId(dto.assignedUserId)
      : new Types.ObjectId(userId);

    const opp = await OpportunityModel.create({
      code,
      prospectId: null,
      prospectCode: undefined,

      firstName: dto.firstName,
      lastName: dto.lastName,
      mobile: dto.mobile,
      email: dto.email,
      company: dto.company,
      city: dto.city,
      state: dto.state,
      source: dto.source,
      industry: dto.industry,
      productInterest: dto.productInterest,
      temperature: dto.temperature ?? LeadTemperature.WARM,
      tags: [],

      assignedUserId,
      quotationOwnerId: new Types.ObjectId(dto.quotationOwnerId),
      technicalReviewerId: dto.technicalReviewerId
        ? new Types.ObjectId(dto.technicalReviewerId)
        : null,

      name: dto.name.trim(),
      type: dto.type,
      dealValue,
      expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : new Date(),
      winProbability: probability,
      weightedValue: weightedValue(dealValue, probability),
      approvalThreshold: dto.approvalThreshold,

      stage,
      status: OpportunityStatus.OPEN,
      stageChangedAt: now,

      scopeOfWork: dto.scopeOfWork,
      siteLocation: dto.siteLocation,
      siteVisitStatus: dto.siteVisitStatus,
      siteVisitDate: dto.siteVisitDate ? new Date(dto.siteVisitDate) : null,

      technicalSpecs: dto.technicalSpecs,
      drawingsStatus: dto.drawingsStatus,

      paymentTermsPreset: dto.paymentTermsPreset,
      paymentMilestones: dto.paymentMilestones ?? [],
      paymentNotes: dto.paymentNotes,
      deliveryTimeline: dto.deliveryTimeline,
      warrantyPeriod: dto.warrantyPeriod,

      submissionDeadline: new Date(dto.submissionDeadline),

      budgetStatus: dto.budgetStatus ?? BudgetStatus.UNKNOWN,
      authorityType: dto.authorityType ?? AuthorityType.DECISION_MAKER,
      confirmedNeed: dto.confirmedNeed ?? dto.scopeOfWork.slice(0, 200),
      decisionTimeline: dto.decisionTimeline ?? DecisionTimeline.MEDIUM,
      competitors: dto.competitors ?? [],

      lastActivityAt: now,
      createdBy: userId,
    });

    await activityService.logSystem(
      'opportunity',
      opp._id as Types.ObjectId,
      ActivityType.SYSTEM,
      `Opportunity ${opp.code} created`,
      {},
      userId
    );

    return opp;
  }

  async update(id: string, patch: Record<string, unknown>, userId: string): Promise<IOpportunity> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid opportunity id');
    const prev = await OpportunityModel.findById(id);
    if (!prev) throw new AppError(404, 'Opportunity not found');
    if (prev.status !== OpportunityStatus.OPEN) {
      throw new AppError(400, 'Closed opportunities cannot be edited');
    }

    const FORBIDDEN_KEYS = new Set([
      '_id',
      'id',
      '__v',
      'code',
      'prospectId',
      'createdBy',
      'createdAt',
      'updatedAt',
      'status',
      'stage',
      'stageChangedAt',
    ]);
    const updateData: Record<string, unknown> = {};
    Object.entries(patch as Record<string, unknown>).forEach(([k, v]) => {
      if (!FORBIDDEN_KEYS.has(k)) updateData[k] = v;
    });

    const now = new Date();
    if (updateData.assignedUserId && typeof updateData.assignedUserId === 'string') {
      updateData.assignedUserId = new Types.ObjectId(updateData.assignedUserId as string);
    }
    if (updateData.quotationOwnerId && typeof updateData.quotationOwnerId === 'string') {
      updateData.quotationOwnerId = new Types.ObjectId(updateData.quotationOwnerId as string);
    }
    if (updateData.technicalReviewerId && typeof updateData.technicalReviewerId === 'string') {
      updateData.technicalReviewerId = new Types.ObjectId(updateData.technicalReviewerId as string);
    }

    const updated = await OpportunityModel.findByIdAndUpdate(
      id,
      { ...updateData, lastActivityAt: now },
      { new: true, runValidators: true }
    );
    if (!updated) throw new AppError(404, 'Opportunity not found');

    if (updateData.dealValue !== undefined || updateData.winProbability !== undefined) {
      updated.weightedValue = weightedValue(updated.dealValue, updated.winProbability);
      await updated.save();
    }

    await activityService.logSystem(
      'opportunity',
      updated._id as Types.ObjectId,
      ActivityType.SYSTEM,
      'Opportunity details updated',
      {},
      userId
    );

    return updated;
  }

  async changeStage(id: string, dto: ChangeStageDto, userId: string): Promise<IOpportunity> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid opportunity id');
    const prev = await OpportunityModel.findById(id);
    if (!prev) throw new AppError(404, 'Opportunity not found');
    if (prev.status !== OpportunityStatus.OPEN && dto.stage !== prev.stage) {
      throw new AppError(400, 'Closed opportunities cannot change stage');
    }
    if (prev.stage === dto.stage) return prev;

    const now = new Date();
    const fromStage = prev.stage;
    const probability = STAGE_DEFAULT_PROBABILITY[dto.stage];
    prev.stage = dto.stage;
    prev.winProbability = probability;
    prev.weightedValue = weightedValue(prev.dealValue, probability);
    prev.stageChangedAt = now;
    prev.lastActivityAt = now;
    await prev.save();

    await activityService.logSystem(
      'opportunity',
      prev._id as Types.ObjectId,
      ActivityType.STAGE_CHANGE,
      `Stage changed: ${fromStage} → ${dto.stage}`,
      {
        description: dto.note,
        metadata: { fromStage, toStage: dto.stage },
      },
      userId
    );

    await this.autoTasksForStage(prev, dto.stage, userId);
    return prev;
  }

  async markWon(id: string, dto: MarkWonDto, userId: string): Promise<IOpportunity> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid opportunity id');
    const prev = await OpportunityModel.findById(id);
    if (!prev) throw new AppError(404, 'Opportunity not found');

    const now = new Date();
    prev.stage = OpportunityStage.WON;
    prev.status = OpportunityStatus.WON;
    prev.poNumber = dto.poNumber;
    prev.poDate = new Date(dto.poDate);
    prev.poDocumentUrl = dto.poDocumentUrl;
    prev.wonAt = now;
    prev.wonValue = dto.wonValue;
    prev.winProbability = 100;
    prev.weightedValue = prev.dealValue;
    prev.stageChangedAt = now;
    prev.lastActivityAt = now;
    await prev.save();

    await activityService.logSystem(
      'opportunity',
      prev._id as Types.ObjectId,
      ActivityType.WON,
      `Deal won — PO ${dto.poNumber}`,
      {
        description: dto.note,
        metadata: {
          poNumber: dto.poNumber,
          poDate: prev.poDate,
          wonValue: dto.wonValue,
        },
      },
      userId
    );
    return prev;
  }

  async markLost(id: string, dto: MarkLostDto, userId: string): Promise<IOpportunity> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid opportunity id');
    const prev = await OpportunityModel.findById(id);
    if (!prev) throw new AppError(404, 'Opportunity not found');

    const now = new Date();
    prev.stage = OpportunityStage.LOST;
    prev.status = OpportunityStatus.LOST;
    prev.lossReason = dto.lossReason;
    prev.competitorWon = dto.competitorWon;
    prev.competitorPrice = dto.competitorPrice ?? 0;
    prev.customerFeedback = dto.customerFeedback;
    if (dto.competitorPrice !== undefined && prev.dealValue) {
      prev.priceGap = dto.competitorPrice - prev.dealValue;
    }
    prev.lostAt = now;
    prev.winProbability = 0;
    prev.weightedValue = 0;
    prev.stageChangedAt = now;
    prev.lastActivityAt = now;
    await prev.save();

    await activityService.logSystem(
      'opportunity',
      prev._id as Types.ObjectId,
      ActivityType.LOST,
      `Deal lost — ${dto.lossReason}`,
      {
        description: dto.note,
        metadata: { lossReason: dto.lossReason, competitorWon: dto.competitorWon },
      },
      userId
    );
    return prev;
  }

  async remove(id: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid opportunity id');
    const res = await OpportunityModel.findByIdAndDelete(id);
    if (!res) throw new AppError(404, 'Opportunity not found');
    await ActivityModel.deleteMany({ entityType: 'opportunity', entityId: new Types.ObjectId(id) });
    logger.info('Opportunity deleted', { id, by: userId });
  }

  async touchLastActivity(opportunityId: string): Promise<void> {
    if (!Types.ObjectId.isValid(opportunityId)) return;
    await OpportunityModel.findByIdAndUpdate(opportunityId, { lastActivityAt: new Date() });
  }

  async syncFollowUpFromActivity(
    opportunityId: string,
    occurredAt: Date,
    mode?: string
  ): Promise<void> {
    if (!Types.ObjectId.isValid(opportunityId)) return;
    const isFuture = occurredAt.getTime() > Date.now();
    const update: Record<string, unknown> = { nextFollowUpDate: occurredAt };
    if (mode && Object.values(FollowUpMode).includes(mode as FollowUpMode)) {
      update.nextFollowUpMode = mode;
    }
    if (!isFuture) {
      update.lastActivityAt = new Date();
    }
    await OpportunityModel.findByIdAndUpdate(opportunityId, update);
  }

  async updateActiveQuoteDenorm(
    opportunityId: string,
    fields: {
      activeQuoteId?: Types.ObjectId | null;
      activeQuoteNumber?: string | null;
      activeQuoteStatus?: string | null;
      activeQuoteValue?: number;
      activeQuoteMarginPct?: number;
      quoteCount?: number;
    }
  ): Promise<void> {
    if (!Types.ObjectId.isValid(opportunityId)) return;
    const update: Record<string, unknown> = {};
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined) update[k] = v;
    });
    if (Object.keys(update).length) {
      await OpportunityModel.findByIdAndUpdate(opportunityId, update);
    }
  }
}

export const opportunityService = new OpportunityService();
