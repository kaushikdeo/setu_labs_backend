import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import {
  GstType,
  IQuote,
  IQuoteLineItem,
  IQuoteReviewLog,
  QuoteModel,
  QuoteStatus,
  ReviewState,
  Uom,
} from './quote.model';
import {
  IOpportunity,
  OpportunityModel,
  OpportunityStage,
  OpportunityType,
  PaymentMilestone,
  PaymentTermsPreset,
  WarrantyPeriod,
} from '../opportunity/opportunity.model';
import { opportunityService } from '../opportunity/opportunity.service';
import { TcTemplateModel } from '../tc-template/tc-template.model';
import { activityService } from '../activity/activity.service';
import { ActivityType } from '../activity/activity.model';
import { srCounterService } from '../sr-counter/sr-counter.service';
import { UserModel } from '../user/user.model';
import { AppError } from '../../utils/app-error';
import { OrganizationModel } from '../organization/organization.model';
import { generateQuotePdfBuffer } from './quote-pdf.generator';
import { storageService } from '../storage/storage.service';

const HOME_STATE = 'maharashtra';
const MANAGER_REVIEW_DISCOUNT_THRESHOLD = 5;

const MARGIN_FLOOR_BY_TYPE: Record<OpportunityType, number> = {
  [OpportunityType.SUPPLY_INSTALL]: 28,
  [OpportunityType.SUPPLY_ONLY]: 22,
  [OpportunityType.AMC]: 35,
  [OpportunityType.TURNKEY]: 25,
  [OpportunityType.CONSULTANCY]: 45,
};

const DEFAULT_VALIDITY_DAYS = 30;

function pad(n: number, width = 3): string {
  return String(n).padStart(width, '0');
}

function detectGstType(state: string | undefined): GstType {
  if (!state) return GstType.IGST;
  return state.trim().toLowerCase() === HOME_STATE ? GstType.CGST_SGST : GstType.IGST;
}

function buildLineItem(
  input: Partial<IQuoteLineItem>,
  defaults: { gstType: GstType; sortOrder?: number }
): IQuoteLineItem {
  const quantity = Number(input.quantity ?? 0);
  const unitRate = Number(input.unitRate ?? 0);
  const discountPct = Math.min(100, Math.max(0, Number(input.discountPct ?? 0)));
  const gstRate = Math.max(0, Number(input.gstRate ?? 0));
  const gross = quantity * unitRate;
  const discountAmount = Math.round(((gross * discountPct) / 100) * 100) / 100;
  const netAmount = Math.round((gross - discountAmount) * 100) / 100;
  const gstAmount = Math.round(((netAmount * gstRate) / 100) * 100) / 100;
  const cgst = defaults.gstType === GstType.CGST_SGST ? Math.round((gstAmount / 2) * 100) / 100 : 0;
  const sgst = defaults.gstType === GstType.CGST_SGST ? Math.round((gstAmount / 2) * 100) / 100 : 0;
  const igst = defaults.gstType === GstType.IGST ? gstAmount : 0;
  const totalWithGst = Math.round((netAmount + gstAmount) * 100) / 100;
  const costPrice = input.costPrice;
  const lineCost = costPrice !== undefined ? costPrice * quantity : undefined;
  const lineMarginPct =
    lineCost !== undefined && netAmount > 0
      ? Math.round(((netAmount - lineCost) / netAmount) * 1000) / 10
      : undefined;

  return {
    id: input.id ?? randomUUID(),
    sortOrder: input.sortOrder ?? defaults.sortOrder ?? 0,
    description: (input.description ?? '').trim(),
    hsnCode: input.hsnCode || undefined,
    sacCode: input.sacCode || undefined,
    quantity,
    uom: (input.uom ?? Uom.NOS) as Uom,
    unitRate,
    discountPct,
    discountAmount,
    netAmount,
    gstRate,
    gstType: defaults.gstType,
    cgstAmount: cgst,
    sgstAmount: sgst,
    igstAmount: igst,
    gstAmount,
    totalWithGst,
    costPrice,
    lineMarginPct,
    isOptional: !!input.isOptional,
    notes: input.notes || undefined,
  };
}

function recomputeTotals(quote: IQuote): {
  amountExclGst: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstTotal: number;
  amountInclGst: number;
  netPayable: number;
  totalCost: number;
  marginPct: number;
  marginBelowFloor: boolean;
  maxDiscountPct: number;
} {
  const items = (quote.lineItems ?? []).filter((l) => !l.isOptional);
  const amountExclGst = round2(items.reduce((a, l) => a + l.netAmount, 0));
  const cgst = round2(items.reduce((a, l) => a + l.cgstAmount, 0));
  const sgst = round2(items.reduce((a, l) => a + l.sgstAmount, 0));
  const igst = round2(items.reduce((a, l) => a + l.igstAmount, 0));
  const gstTotal = round2(cgst + sgst + igst);
  const amountInclGst = round2(amountExclGst + gstTotal);
  const netPayable = round2(amountInclGst - (quote.tdsDeduction ?? 0));
  const totalCost = round2(
    items.reduce((a, l) => a + (l.costPrice !== undefined ? l.costPrice * l.quantity : 0), 0)
  );
  const overhead = round2((amountExclGst * (quote.overheadAllocation ?? 0)) / 100);
  const totalCostWithOverhead = round2(totalCost + overhead);
  const marginPct =
    amountExclGst > 0
      ? Math.round(((amountExclGst - totalCostWithOverhead) / amountExclGst) * 1000) / 10
      : 0;
  const floor = MARGIN_FLOOR_BY_TYPE[quote.type] ?? 25;
  const marginBelowFloor = totalCost > 0 && marginPct < floor;
  const maxDiscountPct = items.reduce((m, l) => Math.max(m, l.discountPct ?? 0), 0);

  return {
    amountExclGst,
    cgst,
    sgst,
    igst,
    gstTotal,
    amountInclGst,
    netPayable,
    totalCost: totalCostWithOverhead,
    marginPct,
    marginBelowFloor,
    maxDiscountPct,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function recomputeAndSave(quote: IQuote): Promise<IQuote> {
  const totals = recomputeTotals(quote);
  quote.amountExclGst = totals.amountExclGst;
  quote.cgstTotal = totals.cgst;
  quote.sgstTotal = totals.sgst;
  quote.igstTotal = totals.igst;
  quote.gstTotal = totals.gstTotal;
  quote.amountInclGst = totals.amountInclGst;
  quote.netPayable = totals.netPayable;
  quote.totalCost = totals.totalCost;
  quote.marginPct = totals.marginPct;
  quote.marginBelowFloor = totals.marginBelowFloor;
  quote.requiresManagerReview =
    quote.amountExclGst >= (quote.overheadAllocation === undefined ? 0 : 0) &&
    (quote.amountExclGst >= 2_500_000 ||
      totals.maxDiscountPct > MANAGER_REVIEW_DISCOUNT_THRESHOLD ||
      totals.marginBelowFloor);
  await quote.save();
  return quote;
}

function buildVersionNumber(parentNumber: string, version: number): string {
  return parentNumber.replace(/-V\d+$/i, `-V${version}`);
}

async function loadOpportunityOr404(opportunityId: Types.ObjectId): Promise<IOpportunity> {
  const opp = await OpportunityModel.findById(opportunityId);
  if (!opp) throw new AppError(404, 'Opportunity not found');
  return opp;
}

async function syncOpportunityWithPrimaryQuote(opportunityId: Types.ObjectId): Promise<void> {
  const primary = await QuoteModel.findOne({ opportunityId, isPrimary: true }).sort({
    version: -1,
  });
  const count = await QuoteModel.countDocuments({ opportunityId });
  await opportunityService.updateActiveQuoteDenorm(String(opportunityId), {
    activeQuoteId: primary ? (primary._id as Types.ObjectId) : null,
    activeQuoteNumber: primary?.number ?? null,
    activeQuoteStatus: primary?.status ?? null,
    activeQuoteValue: primary?.amountInclGst ?? 0,
    activeQuoteMarginPct: primary?.marginPct ?? 0,
    quoteCount: count,
  });
}

export interface ListQuotesFilters {
  opportunityId?: string;
  status?: QuoteStatus | '';
  ownerUserId?: string;
}

export interface CreateQuoteDto {
  opportunityId: string;
  validityDate?: Date | string;
  paymentTermsPreset?: string;
  paymentMilestones?: PaymentMilestone[];
  paymentNotes?: string;
  deliveryTimeline?: string;
  warrantyPeriod?: WarrantyPeriod;
  scopeOfSupply?: string;
  inclusions?: string[];
  exclusions?: string[];
  specialConditions?: string;
  tcTemplateId?: string | null;
  notesForReviewer?: string;
  overheadAllocation?: number;
  lineItems?: Array<Partial<IQuoteLineItem>>;
}

export type UpdateQuoteDto = Partial<{
  validityDate: Date | string;
  paymentTermsPreset: string;
  paymentMilestones: PaymentMilestone[];
  paymentNotes: string;
  deliveryTimeline: string;
  warrantyPeriod: WarrantyPeriod;
  scopeOfSupply: string;
  inclusions: string[];
  exclusions: string[];
  specialConditions: string;
  tcTemplateId: string | null;
  notesForReviewer: string;
  overheadAllocation: number;
  tdsDeduction: number;
}>;

export interface ReviewActionDto {
  approve: boolean;
  comments?: string;
}

export interface SendQuoteDto {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
}

export interface AcceptQuoteDto {
  customerPoNumber?: string;
}

export interface RejectQuoteDto {
  reason: string;
}

export class QuoteService {
  async list(filters: ListQuotesFilters): Promise<IQuote[]> {
    const match: Record<string, unknown> = {};
    if (filters.opportunityId && Types.ObjectId.isValid(filters.opportunityId)) {
      match.opportunityId = new Types.ObjectId(filters.opportunityId);
    }
    if (filters.status) match.status = filters.status;
    return QuoteModel.find(match).sort({ createdAt: -1 }).exec();
  }

  async listForOpportunity(opportunityId: string): Promise<IQuote[]> {
    if (!Types.ObjectId.isValid(opportunityId)) throw new AppError(400, 'Invalid opportunity id');
    return QuoteModel.find({ opportunityId: new Types.ObjectId(opportunityId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getById(id: string): Promise<IQuote> {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid quote id');
    const doc = await QuoteModel.findById(id);
    if (!doc) throw new AppError(404, 'Quote not found');
    return doc;
  }

  async pendingApprovals(): Promise<Record<string, unknown>[]> {
    const rows = await QuoteModel.find({ status: QuoteStatus.UNDER_REVIEW })
      .sort({ updatedAt: 1 })
      .lean();

    return rows.map((q) => {
      const submittedAt = q.updatedAt;
      const ageHours = Math.max(
        0,
        Math.floor((Date.now() - new Date(submittedAt).getTime()) / 3_600_000)
      );
      let awaiting: 'technical' | 'manager' | 'both' = 'both';
      const techDone = q.technicalReview?.state === ReviewState.APPROVED;
      const mgrNeeded = !!q.requiresManagerReview;
      const mgrDone = q.managerReview?.state === ReviewState.APPROVED || !mgrNeeded;
      if (!techDone && !mgrDone) awaiting = mgrNeeded ? 'both' : 'technical';
      else if (!techDone) awaiting = 'technical';
      else if (!mgrDone) awaiting = 'manager';
      const maxDiscountPct = (q.lineItems ?? []).reduce(
        (m, l) => Math.max(m, l.discountPct ?? 0),
        0
      );
      return {
        quoteId: String(q._id),
        quoteNumber: q.number,
        opportunityId: String(q.opportunityId),
        opportunityName: q.opportunityName,
        customer: q.customer,
        value: q.amountInclGst,
        marginPct: q.marginPct,
        maxDiscountPct,
        submittedByName: q.createdByName ?? q.createdBy,
        submittedAt,
        ageHours,
        awaiting,
      };
    });
  }

  async create(dto: CreateQuoteDto, userId: string): Promise<IQuote> {
    if (!Types.ObjectId.isValid(dto.opportunityId))
      throw new AppError(400, 'Invalid opportunity id');
    const opp = await loadOpportunityOr404(new Types.ObjectId(dto.opportunityId));

    const seq = await srCounterService.nextSequence(`quote-${new Date().getFullYear()}`);
    const number = `QT-${new Date().getFullYear()}-${pad(seq)}-V1`;
    const validity = dto.validityDate
      ? new Date(dto.validityDate)
      : new Date(Date.now() + DEFAULT_VALIDITY_DAYS * 86400000);

    const gstType = detectGstType(opp.state);
    const lineItems: IQuoteLineItem[] = (dto.lineItems ?? []).map((l, idx) =>
      buildLineItem(l, { gstType, sortOrder: idx })
    );

    let tcTemplateName: string | undefined;
    let tcTemplateId: Types.ObjectId | null = null;
    if (dto.tcTemplateId && Types.ObjectId.isValid(dto.tcTemplateId)) {
      const tpl = await TcTemplateModel.findById(dto.tcTemplateId);
      if (tpl) {
        tcTemplateId = tpl._id as Types.ObjectId;
        tcTemplateName = tpl.name;
      }
    }

    const user = await UserModel.findById(userId).lean();

    const quote = await QuoteModel.create({
      opportunityId: opp._id,
      opportunityName: opp.name,
      customer: opp.company ?? `${opp.firstName} ${opp.lastName}`,
      number,
      version: 1,
      status: QuoteStatus.DRAFT,
      isPrimary: true,
      quoteDate: new Date(),
      validityDate: validity,
      type: opp.type,
      lineItems,
      paymentTermsPreset:
        dto.paymentTermsPreset ?? opp.paymentTermsPreset ?? PaymentTermsPreset.ADV_30_BAL_60,
      paymentMilestones: dto.paymentMilestones ?? opp.paymentMilestones,
      paymentNotes: dto.paymentNotes ?? opp.paymentNotes,
      deliveryTimeline: dto.deliveryTimeline ?? opp.deliveryTimeline,
      warrantyPeriod: dto.warrantyPeriod ?? opp.warrantyPeriod,
      scopeOfSupply: dto.scopeOfSupply ?? opp.scopeOfWork,
      inclusions: dto.inclusions ?? [],
      exclusions: dto.exclusions ?? [],
      specialConditions: dto.specialConditions,
      tcTemplateId,
      tcTemplateName,
      notesForReviewer: dto.notesForReviewer,
      overheadAllocation: dto.overheadAllocation ?? 0,
      createdBy: userId,
      createdByName: user?.name,
    });

    await recomputeAndSave(quote);

    await opportunityService
      .changeStage(
        String(opp._id),
        { stage: OpportunityStage.QUOTE_IN_PROGRESS, note: `Draft quote ${quote.number} started` },
        userId
      )
      .catch(() => undefined);
    await syncOpportunityWithPrimaryQuote(opp._id as Types.ObjectId);

    await activityService.logSystem(
      'opportunity',
      opp._id as Types.ObjectId,
      ActivityType.SYSTEM,
      `Quote ${quote.number} created`,
      { metadata: { quoteId: String(quote._id), quoteNumber: quote.number } },
      userId
    );

    return quote;
  }

  async update(id: string, dto: UpdateQuoteDto): Promise<IQuote> {
    const quote = await this.getById(id);
    if (quote.status !== QuoteStatus.DRAFT && quote.status !== QuoteStatus.REVISION_REQUESTED) {
      throw new AppError(400, 'Quote can only be edited in draft or revision state');
    }
    if (dto.validityDate !== undefined) quote.validityDate = new Date(dto.validityDate);
    if (dto.paymentTermsPreset !== undefined) quote.paymentTermsPreset = dto.paymentTermsPreset;
    if (dto.paymentMilestones !== undefined) quote.paymentMilestones = dto.paymentMilestones;
    if (dto.paymentNotes !== undefined) quote.paymentNotes = dto.paymentNotes;
    if (dto.deliveryTimeline !== undefined) quote.deliveryTimeline = dto.deliveryTimeline;
    if (dto.warrantyPeriod !== undefined) quote.warrantyPeriod = dto.warrantyPeriod;
    if (dto.scopeOfSupply !== undefined) quote.scopeOfSupply = dto.scopeOfSupply;
    if (dto.inclusions !== undefined) quote.inclusions = dto.inclusions;
    if (dto.exclusions !== undefined) quote.exclusions = dto.exclusions;
    if (dto.specialConditions !== undefined) quote.specialConditions = dto.specialConditions;
    if (dto.notesForReviewer !== undefined) quote.notesForReviewer = dto.notesForReviewer;
    if (dto.overheadAllocation !== undefined) quote.overheadAllocation = dto.overheadAllocation;
    if (dto.tdsDeduction !== undefined) quote.tdsDeduction = dto.tdsDeduction;
    if (dto.tcTemplateId !== undefined) {
      if (dto.tcTemplateId && Types.ObjectId.isValid(dto.tcTemplateId)) {
        const tpl = await TcTemplateModel.findById(dto.tcTemplateId);
        quote.tcTemplateId = tpl ? (tpl._id as Types.ObjectId) : null;
        quote.tcTemplateName = tpl?.name;
      } else {
        quote.tcTemplateId = null;
        quote.tcTemplateName = undefined;
      }
    }
    await recomputeAndSave(quote);
    await syncOpportunityWithPrimaryQuote(quote.opportunityId);
    return quote;
  }

  async addLineItem(id: string, payload: Partial<IQuoteLineItem>): Promise<IQuote> {
    const quote = await this.getById(id);
    if (quote.status !== QuoteStatus.DRAFT && quote.status !== QuoteStatus.REVISION_REQUESTED) {
      throw new AppError(400, 'Line items can only be edited in draft state');
    }
    const opp = await loadOpportunityOr404(quote.opportunityId);
    const gstType = detectGstType(opp.state);
    const nextSort = quote.lineItems?.length ?? 0;
    quote.lineItems.push(buildLineItem(payload, { gstType, sortOrder: nextSort }));
    await recomputeAndSave(quote);
    await syncOpportunityWithPrimaryQuote(quote.opportunityId);
    return quote;
  }

  async updateLineItem(
    id: string,
    lineId: string,
    payload: Partial<IQuoteLineItem>
  ): Promise<IQuote> {
    const quote = await this.getById(id);
    if (quote.status !== QuoteStatus.DRAFT && quote.status !== QuoteStatus.REVISION_REQUESTED) {
      throw new AppError(400, 'Line items can only be edited in draft state');
    }
    const idx = quote.lineItems.findIndex((l) => l.id === lineId);
    if (idx < 0) throw new AppError(404, 'Line item not found');
    const opp = await loadOpportunityOr404(quote.opportunityId);
    const gstType = detectGstType(opp.state);
    const existingRaw = quote.lineItems[idx] as IQuoteLineItem & {
      toObject?: () => IQuoteLineItem;
    };
    const existing = existingRaw.toObject?.() ?? { ...existingRaw };
    quote.lineItems[idx] = buildLineItem(
      { ...existing, ...payload, id: existing.id, sortOrder: existing.sortOrder },
      { gstType },
    );
    await recomputeAndSave(quote);
    await syncOpportunityWithPrimaryQuote(quote.opportunityId);
    return quote;
  }

  async removeLineItem(id: string, lineId: string): Promise<IQuote> {
    const quote = await this.getById(id);
    if (quote.status !== QuoteStatus.DRAFT && quote.status !== QuoteStatus.REVISION_REQUESTED) {
      throw new AppError(400, 'Line items can only be edited in draft state');
    }
    quote.lineItems = quote.lineItems.filter((l) => l.id !== lineId);
    quote.lineItems.forEach((l, idx) => (l.sortOrder = idx));
    await recomputeAndSave(quote);
    await syncOpportunityWithPrimaryQuote(quote.opportunityId);
    return quote;
  }

  async reorderLineItems(id: string, orderedIds: string[]): Promise<IQuote> {
    const quote = await this.getById(id);
    if (quote.status !== QuoteStatus.DRAFT && quote.status !== QuoteStatus.REVISION_REQUESTED) {
      throw new AppError(400, 'Line items can only be edited in draft state');
    }
    const map = new Map(quote.lineItems.map((l) => [l.id, l]));
    const reordered: IQuoteLineItem[] = [];
    orderedIds.forEach((lid, idx) => {
      const item = map.get(lid);
      if (item) {
        item.sortOrder = idx;
        reordered.push(item);
      }
    });
    if (reordered.length !== quote.lineItems.length) {
      throw new AppError(400, 'orderedIds must contain every line item id');
    }
    quote.lineItems = reordered;
    await quote.save();
    return quote;
  }

  async submitForReview(id: string, note: string | undefined, userId: string): Promise<IQuote> {
    const quote = await this.getById(id);
    if (quote.status !== QuoteStatus.DRAFT && quote.status !== QuoteStatus.REVISION_REQUESTED) {
      throw new AppError(400, 'Only draft quotes can be submitted for review');
    }
    if (quote.lineItems.length === 0) {
      throw new AppError(400, 'Add at least one line item before submitting for review');
    }
    const missingDescription = quote.lineItems.find(
      (l) => !l.isOptional && !l.description?.trim(),
    );
    if (missingDescription) {
      throw new AppError(400, 'Every line item must have a description before submitting');
    }
    await recomputeAndSave(quote);
    quote.status = QuoteStatus.UNDER_REVIEW;
    quote.technicalReview = { type: 'technical', state: ReviewState.PENDING };
    quote.managerReview = quote.requiresManagerReview
      ? { type: 'manager', state: ReviewState.PENDING }
      : { type: 'manager', state: ReviewState.SKIPPED };
    if (note) quote.notesForReviewer = note;
    await quote.save();

    await opportunityService
      .changeStage(
        String(quote.opportunityId),
        {
          stage: OpportunityStage.UNDER_REVIEW,
          note: `Quote ${quote.number} submitted for review`,
        },
        userId
      )
      .catch(() => undefined);
    await syncOpportunityWithPrimaryQuote(quote.opportunityId);

    await activityService.logSystem(
      'opportunity',
      quote.opportunityId,
      ActivityType.SYSTEM,
      `Quote ${quote.number} submitted for review`,
      {
        metadata: {
          quoteId: String(quote._id),
          quoteNumber: quote.number,
          requiresManagerReview: quote.requiresManagerReview,
        },
      },
      userId
    );
    return quote;
  }

  async technicalAction(id: string, dto: ReviewActionDto, userId: string): Promise<IQuote> {
    const quote = await this.getById(id);
    if (quote.status !== QuoteStatus.UNDER_REVIEW)
      throw new AppError(400, 'Quote is not under review');
    const user = await UserModel.findById(userId).lean();
    const log: IQuoteReviewLog = {
      type: 'technical',
      state: dto.approve ? ReviewState.APPROVED : ReviewState.RETURNED,
      userId,
      userName: user?.name,
      comments: dto.comments,
      at: new Date(),
    };
    quote.technicalReview = log;
    if (!dto.approve) {
      quote.status = QuoteStatus.REVISION_REQUESTED;
      await quote.save();
      await opportunityService
        .changeStage(
          String(quote.opportunityId),
          { stage: OpportunityStage.REVISION_REQUESTED, note: 'Technical review returned' },
          userId
        )
        .catch(() => undefined);
    } else if (
      !quote.requiresManagerReview ||
      quote.managerReview?.state === ReviewState.APPROVED
    ) {
      quote.status = QuoteStatus.APPROVED;
      await quote.save();
      await opportunityService
        .changeStage(
          String(quote.opportunityId),
          { stage: OpportunityStage.QUOTE_APPROVED, note: `Quote ${quote.number} approved` },
          userId
        )
        .catch(() => undefined);
    } else {
      await quote.save();
    }
    await syncOpportunityWithPrimaryQuote(quote.opportunityId);
    return quote;
  }

  async managerAction(id: string, dto: ReviewActionDto, userId: string): Promise<IQuote> {
    const quote = await this.getById(id);
    if (quote.status !== QuoteStatus.UNDER_REVIEW)
      throw new AppError(400, 'Quote is not under review');
    if (!quote.requiresManagerReview)
      throw new AppError(400, 'This quote does not need manager review');
    const user = await UserModel.findById(userId).lean();
    const log: IQuoteReviewLog = {
      type: 'manager',
      state: dto.approve ? ReviewState.APPROVED : ReviewState.RETURNED,
      userId,
      userName: user?.name,
      comments: dto.comments,
      at: new Date(),
    };
    quote.managerReview = log;
    if (!dto.approve) {
      quote.status = QuoteStatus.REVISION_REQUESTED;
      await quote.save();
      await opportunityService
        .changeStage(
          String(quote.opportunityId),
          { stage: OpportunityStage.REVISION_REQUESTED, note: 'Manager review returned' },
          userId
        )
        .catch(() => undefined);
    } else if (quote.technicalReview?.state === ReviewState.APPROVED) {
      quote.status = QuoteStatus.APPROVED;
      await quote.save();
      await opportunityService
        .changeStage(
          String(quote.opportunityId),
          { stage: OpportunityStage.QUOTE_APPROVED, note: `Quote ${quote.number} approved` },
          userId
        )
        .catch(() => undefined);
    } else {
      await quote.save();
    }
    await syncOpportunityWithPrimaryQuote(quote.opportunityId);
    return quote;
  }

  async buildPdfBuffer(id: string): Promise<Buffer> {
    const quote = await this.getById(id);
    const opportunity = await OpportunityModel.findById(quote.opportunityId);
    if (!opportunity) throw new AppError(404, 'Opportunity not found');

    let tcBody: string | undefined;
    if (quote.tcTemplateId) {
      const tpl = await TcTemplateModel.findById(quote.tcTemplateId).lean();
      tcBody = (tpl as { body?: string } | null)?.body;
    }

    const organization = await OrganizationModel.findOne().lean();
    return generateQuotePdfBuffer({
      quote,
      opportunity,
      organization,
      tcBody,
    });
  }

  async generatePdf(id: string): Promise<IQuote> {
    const quote = await this.getById(id);
    if (quote.lineItems.filter((l) => !l.isOptional).length === 0) {
      throw new AppError(400, 'Add at least one line item before generating a PDF');
    }

    const buffer = await this.buildPdfBuffer(id);
    const filename = `${quote.number.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;

    try {
      const uploaded = await storageService.uploadImage(
        buffer,
        'application/pdf',
        'quotes',
        filename,
      );
      quote.pdfUrl = uploaded.url;
    } catch {
      quote.pdfUrl = `/api/quotes/${id}/pdf`;
    }

    quote.pdfGeneratedAt = new Date();
    await quote.save();
    return quote;
  }

  async streamPdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const quote = await this.getById(id);
    if (quote.lineItems.filter((l) => !l.isOptional).length === 0) {
      throw new AppError(400, 'Add at least one line item before downloading the PDF');
    }
    const buffer = await this.buildPdfBuffer(id);
    const filename = `${quote.number.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
    return { buffer, filename };
  }

  async send(id: string, dto: SendQuoteDto, userId: string): Promise<IQuote> {
    let quote = await this.getById(id);
    if (quote.status !== QuoteStatus.APPROVED) {
      throw new AppError(400, 'Only approved quotes can be sent');
    }
    if (!quote.pdfUrl) {
      await this.generatePdf(id);
      quote = await this.getById(id);
    }
    quote.status = QuoteStatus.SENT;
    quote.sentAt = new Date();
    quote.sentTo = dto.to;
    quote.sentCc = dto.cc ?? [];
    quote.sentBy = userId;
    await quote.save();

    await opportunityService
      .changeStage(
        String(quote.opportunityId),
        { stage: OpportunityStage.QUOTE_SENT, note: `Quote ${quote.number} sent to customer` },
        userId
      )
      .catch(() => undefined);
    await syncOpportunityWithPrimaryQuote(quote.opportunityId);

    await activityService.add(
      {
        entityType: 'opportunity',
        entityId: String(quote.opportunityId),
        type: ActivityType.EMAIL,
        direction: 'out',
        title: `Quote ${quote.number} sent to ${dto.to.join(', ')}`,
        description: dto.body,
        occurredAt: new Date(),
        metadata: { quoteId: String(quote._id), to: dto.to, cc: dto.cc, subject: dto.subject },
      },
      userId
    );

    return quote;
  }

  async reviseFrom(parentId: string, userId: string): Promise<IQuote> {
    const parent = await this.getById(parentId);
    const user = await UserModel.findById(userId).lean();
    const child = await QuoteModel.create({
      opportunityId: parent.opportunityId,
      opportunityName: parent.opportunityName,
      customer: parent.customer,
      number: buildVersionNumber(parent.number, parent.version + 1),
      version: parent.version + 1,
      status: QuoteStatus.DRAFT,
      isPrimary: true,
      quoteDate: new Date(),
      validityDate: parent.validityDate,
      type: parent.type,
      lineItems: parent.lineItems.map((l) => ({ ...l, id: randomUUID() })),
      paymentTermsPreset: parent.paymentTermsPreset,
      paymentMilestones: parent.paymentMilestones,
      paymentNotes: parent.paymentNotes,
      deliveryTimeline: parent.deliveryTimeline,
      warrantyPeriod: parent.warrantyPeriod,
      validityNote: parent.validityNote,
      specialConditions: parent.specialConditions,
      scopeOfSupply: parent.scopeOfSupply,
      inclusions: parent.inclusions,
      exclusions: parent.exclusions,
      tcTemplateId: parent.tcTemplateId,
      tcTemplateName: parent.tcTemplateName,
      overheadAllocation: parent.overheadAllocation,
      notesForReviewer: parent.notesForReviewer,
      technicalReview: { type: 'technical', state: ReviewState.PENDING },
      managerReview: { type: 'manager', state: ReviewState.PENDING },
      createdBy: userId,
      createdByName: user?.name,
    });

    await recomputeAndSave(child);

    parent.isPrimary = false;
    parent.status = QuoteStatus.SUPERSEDED;
    parent.supersededAt = new Date();
    parent.supersededByQuoteId = child._id as Types.ObjectId;
    await parent.save();

    await opportunityService
      .changeStage(
        String(parent.opportunityId),
        { stage: OpportunityStage.QUOTE_IN_PROGRESS, note: `Revision ${child.number} created` },
        userId
      )
      .catch(() => undefined);
    await syncOpportunityWithPrimaryQuote(parent.opportunityId);

    await activityService.logSystem(
      'opportunity',
      parent.opportunityId,
      ActivityType.SYSTEM,
      `Quote revised from ${parent.number} → ${child.number}`,
      { metadata: { fromQuoteId: String(parent._id), toQuoteId: String(child._id) } },
      userId
    );

    return child;
  }

  async accept(id: string, dto: AcceptQuoteDto, userId: string): Promise<IQuote> {
    const quote = await this.getById(id);
    if (quote.status !== QuoteStatus.SENT)
      throw new AppError(400, 'Only sent quotes can be accepted');
    quote.status = QuoteStatus.ACCEPTED;
    quote.acceptedAt = new Date();
    quote.customerPoNumber = dto.customerPoNumber;
    await quote.save();
    await syncOpportunityWithPrimaryQuote(quote.opportunityId);

    await activityService.logSystem(
      'opportunity',
      quote.opportunityId,
      ActivityType.SYSTEM,
      `Quote ${quote.number} accepted by customer`,
      { metadata: { quoteId: String(quote._id), customerPoNumber: dto.customerPoNumber } },
      userId
    );
    return quote;
  }

  async reject(id: string, dto: RejectQuoteDto, userId: string): Promise<IQuote> {
    const quote = await this.getById(id);
    if (quote.status !== QuoteStatus.SENT)
      throw new AppError(400, 'Only sent quotes can be rejected');
    quote.status = QuoteStatus.REJECTED;
    quote.rejectedAt = new Date();
    quote.rejectionReason = dto.reason;
    await quote.save();
    await syncOpportunityWithPrimaryQuote(quote.opportunityId);

    await activityService.logSystem(
      'opportunity',
      quote.opportunityId,
      ActivityType.SYSTEM,
      `Quote ${quote.number} rejected by customer`,
      { description: dto.reason, metadata: { quoteId: String(quote._id) } },
      userId
    );
    return quote;
  }

  async remove(id: string): Promise<void> {
    const quote = await this.getById(id);
    if (quote.status !== QuoteStatus.DRAFT) {
      throw new AppError(400, 'Only draft quotes can be deleted');
    }
    await QuoteModel.findByIdAndDelete(quote._id);
    await syncOpportunityWithPrimaryQuote(quote.opportunityId);
  }
}

export const quoteService = new QuoteService();
