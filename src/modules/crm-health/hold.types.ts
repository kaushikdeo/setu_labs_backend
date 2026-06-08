export enum HoldReason {
  CUSTOMER_REQUESTED = 'customer_requested',
  BUDGET_FROZEN = 'budget_frozen',
  PROJECT_DEFERRED = 'project_deferred',
  AWAITING_TENDER = 'awaiting_tender',
  NO_RESPONSE = 'no_response',
  OTHER = 'other',
}

export interface PutOnHoldDto {
  holdReason: HoldReason;
  holdUntil?: Date | string | null;
  holdNotes?: string | null;
}

export interface ResumeDto {
  note?: string | null;
  followUpDate?: Date | string | null;
  followUpMode?: string | null;
}

export interface SnoozeDto {
  days: number;
}
