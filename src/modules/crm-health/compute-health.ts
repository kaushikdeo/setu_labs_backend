import {
  ATTENTION_DEADLINE_DAYS,
  AT_RISK_DAYS_IN_STAGE,
  AT_RISK_QUOTE_SENT_DAYS,
  CrmEntityType,
  HealthReason,
  HealthStatus,
  STALE_THRESHOLD_DAYS_LEAD,
  STALE_THRESHOLD_DAYS_OPPORTUNITY,
  STALE_THRESHOLD_DAYS_PROSPECT,
} from './health.constants';

export interface HealthInput {
  entityType: CrmEntityType;
  status: string;
  lastActivityAt?: Date | string | null;
  followUpDate?: Date | string | null;
  expectedCloseDate?: Date | string | null;
  submissionDeadline?: Date | string | null;
  stage?: string | null;
  stageChangedAt?: Date | string | null;
  quoteSentAt?: Date | string | null;
}

export interface HealthResult {
  healthStatus: HealthStatus;
  healthReasons: HealthReason[];
}

const TERMINAL_LEAD = new Set(['converted', 'not_interested']);
const TERMINAL_DEAL = new Set(['won', 'lost']);

function daysSince(date: Date | string | null | undefined, now: Date): number {
  if (!date) return 0;
  const d = new Date(date);
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(date: Date | string | null | undefined, now: Date): number {
  if (!date) return Infinity;
  const d = new Date(date);
  return Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function isFollowUpOverdue(date: Date | string | null | undefined, now: Date): boolean {
  if (!date) return false;
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d < now;
}

function staleThreshold(entityType: CrmEntityType): number {
  switch (entityType) {
    case 'lead':
      return STALE_THRESHOLD_DAYS_LEAD;
    case 'prospect':
      return STALE_THRESHOLD_DAYS_PROSPECT;
    case 'opportunity':
      return STALE_THRESHOLD_DAYS_OPPORTUNITY;
  }
}

function isTerminal(entityType: CrmEntityType, status: string): boolean {
  if (status === 'on_hold') return true;
  if (entityType === 'lead') return TERMINAL_LEAD.has(status);
  return TERMINAL_DEAL.has(status);
}

export function computeHealth(input: HealthInput, now = new Date()): HealthResult {
  const reasons: HealthReason[] = [];

  if (input.status === 'on_hold') {
    return { healthStatus: 'healthy', healthReasons: [] };
  }

  if (isTerminal(input.entityType, input.status)) {
    return { healthStatus: 'healthy', healthReasons: [] };
  }

  const inactiveDays = daysSince(input.lastActivityAt, now);
  const staleDays = staleThreshold(input.entityType);
  const isStale = inactiveDays >= staleDays;

  const followUpDate = input.followUpDate;
  const followUpOverdue = isFollowUpOverdue(followUpDate, now);
  if (followUpOverdue) reasons.push('follow_up_overdue');

  const closeDate = input.expectedCloseDate ?? input.submissionDeadline;
  const daysToClose = daysUntil(closeDate, now);
  if (closeDate && daysToClose < 0) {
    reasons.push('close_date_missed');
  } else if (closeDate && daysToClose <= ATTENTION_DEADLINE_DAYS) {
    reasons.push('deadline_soon');
  }

  if (isStale) reasons.push('inactive');

  if (input.entityType === 'prospect' && input.stageChangedAt) {
    const daysInStage = daysSince(input.stageChangedAt, now);
    if (daysInStage >= AT_RISK_DAYS_IN_STAGE) reasons.push('days_in_stage');
  }

  if (input.entityType === 'opportunity' && input.stage === 'quote_sent' && input.quoteSentAt) {
    const daysSinceQuote = daysSince(input.quoteSentAt, now);
    if (daysSinceQuote >= AT_RISK_QUOTE_SENT_DAYS) reasons.push('quote_no_response');
  }

  const hasAtRisk = reasons.includes('days_in_stage') || reasons.includes('quote_no_response');
  const hasAttention = reasons.includes('follow_up_overdue') || reasons.includes('deadline_soon');
  const hasCritical =
    (isStale && followUpOverdue) ||
    reasons.includes('close_date_missed') ||
    (isStale && hasAtRisk);

  let healthStatus: HealthStatus = 'healthy';
  if (hasCritical) healthStatus = 'critical';
  else if (hasAtRisk) healthStatus = 'at_risk';
  else if (isStale) healthStatus = 'stale';
  else if (hasAttention) healthStatus = 'attention';

  return { healthStatus, healthReasons: reasons };
}

export function staleCutoffFor(entityType: CrmEntityType): Date {
  const d = new Date();
  d.setDate(d.getDate() - staleThreshold(entityType));
  return d;
}
