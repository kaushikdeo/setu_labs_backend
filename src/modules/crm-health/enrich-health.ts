import { computeHealth, HealthInput } from './compute-health';

export function enrichWithHealth<T extends Record<string, unknown>>(
  row: T,
  entityType: 'lead' | 'prospect' | 'opportunity',
): T & { healthStatus: string; healthReasons: string[] } {
  const input: HealthInput = {
    entityType,
    status: String(row.status ?? ''),
    lastActivityAt: row.lastActivityAt as Date | string | null,
    followUpDate: (row.followUpDate ?? row.nextFollowUpDate) as Date | string | null,
    expectedCloseDate: row.expectedCloseDate as Date | string | null,
    submissionDeadline: row.submissionDeadline as Date | string | null,
    stage: row.stage as string | null,
    stageChangedAt: row.stageChangedAt as Date | string | null,
  };
  const { healthStatus, healthReasons } = computeHealth(input);
  return { ...row, healthStatus, healthReasons };
}
