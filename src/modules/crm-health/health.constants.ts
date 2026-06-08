export const STALE_THRESHOLD_DAYS_LEAD = 14;
export const STALE_THRESHOLD_DAYS_PROSPECT = 14;
export const STALE_THRESHOLD_DAYS_OPPORTUNITY = 7;
export const AT_RISK_DAYS_IN_STAGE = 14;
export const AT_RISK_QUOTE_SENT_DAYS = 14;
export const ATTENTION_DEADLINE_DAYS = 3;
export const HOLD_EXPIRING_SOON_DAYS = 7;

export type CrmEntityType = 'lead' | 'prospect' | 'opportunity';

export type HealthStatus = 'healthy' | 'attention' | 'stale' | 'at_risk' | 'critical';

export type HealthReason =
  | 'inactive'
  | 'follow_up_overdue'
  | 'deadline_soon'
  | 'close_date_missed'
  | 'days_in_stage'
  | 'quote_no_response';
