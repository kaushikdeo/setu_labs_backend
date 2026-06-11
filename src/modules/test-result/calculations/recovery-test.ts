export interface RecoveryTestRow {
  phase?: string;
  endTime?: string;
  count_0_5um?: number;
  count_5um?: number;
  remarks?: string;
}

export interface RecoveryTestReadings {
  isoClass?: string;
  recoveryTimeLimit?: number | string;
  equipmentName?: string;
  departmentArea?: string;
  rows?: RecoveryTestRow[];
  sections?: Array<{ fields: Record<string, any>; rows: RecoveryTestRow[] }>;
}

type IsoClassEntry = { description?: string; fields: Record<string, { min?: number; max?: number }> };
type IsoThresholds = Record<string, IsoClassEntry>;

function getLimits(
  thresholds: IsoThresholds,
  isoClass: string | undefined,
): { um_0_5: number | null; um_5: number | null } {
  const classEntry = thresholds[isoClass ?? ''] ?? thresholds['default'];
  const fields = classEntry?.fields ?? {};
  return {
    um_0_5: fields['count_0_5um']?.max ?? null,
    um_5: fields['count_5um']?.max ?? null,
  };
}

function rowStatus(
  row: RecoveryTestRow,
  limits: { um_0_5: number | null; um_5: number | null },
): { result_0_5um: string; result_5um: string; withinLimits: boolean | null } {
  const c05 = typeof row.count_0_5um === 'number' ? row.count_0_5um : parseFloat(String(row.count_0_5um));
  const c5 = typeof row.count_5um === 'number' ? row.count_5um : parseFloat(String(row.count_5um));

  const result_0_5um =
    limits.um_0_5 != null && !isNaN(c05) ? (c05 <= limits.um_0_5 ? 'Pass' : 'Fail') : 'N/A';
  const result_5um =
    limits.um_5 != null && !isNaN(c5) ? (c5 <= limits.um_5 ? 'Pass' : 'Fail') : 'N/A';

  const evaluated = result_0_5um !== 'N/A' || result_5um !== 'N/A';
  const withinLimits = evaluated
    ? (result_0_5um === 'Pass' || result_0_5um === 'N/A') &&
      (result_5um === 'Pass' || result_5um === 'N/A')
    : null;

  return { result_0_5um, result_5um, withinLimits };
}

function enrichRows(
  rows: RecoveryTestRow[],
  limits: { um_0_5: number | null; um_5: number | null },
): {
  enriched: Array<RecoveryTestRow & { result_0_5um: string; result_5um: string; recovered: string }>;
  recoveryIndex: number;
  finalWithinLimits: boolean | null;
} {
  let recoveryIndex = -1;

  const statuses = rows.map((r) => rowStatus(r, limits));

  for (let i = 0; i < statuses.length; i++) {
    if (statuses[i].withinLimits === true) {
      recoveryIndex = i;
      break;
    }
  }

  const enriched = rows.map((row, i) => {
    const s = statuses[i];
    const recovered =
      s.withinLimits === null
        ? 'N/A'
        : recoveryIndex >= 0 && i >= recoveryIndex && s.withinLimits
          ? 'Recovered'
          : 'Not Recovered';
    return {
      ...row,
      result_0_5um: s.result_0_5um,
      result_5um: s.result_5um,
      recovered,
    };
  });

  const lastEvaluated = [...statuses].reverse().find((s) => s.withinLimits !== null);
  const finalWithinLimits = lastEvaluated ? lastEvaluated.withinLimits : null;

  return { enriched, recoveryIndex, finalWithinLimits };
}

export function calculate(
  readings: RecoveryTestReadings,
  thresholds: IsoThresholds,
): { calculatedValues: Record<string, any>; result: 'Pass' | 'Fail'; conclusion: string } {
  const limits = getLimits(thresholds, readings.isoClass);
  const recoveryLimit = Number(readings.recoveryTimeLimit);
  const recoveryLimitText =
    !isNaN(recoveryLimit) && recoveryLimit > 0 ? `${recoveryLimit} min` : 'the specified limit';

  const buildConclusion = (
    recoveryIndex: number,
    finalWithinLimits: boolean | null,
    contextLabel?: string,
  ): { result: 'Pass' | 'Fail'; conclusion: string } => {
    const scope = contextLabel ? `${contextLabel}: ` : '';
    if (finalWithinLimits === null) {
      return {
        result: 'Fail',
        conclusion: `${scope}No valid particle count readings to evaluate recovery against ${readings.isoClass ?? 'specified'} limits.`,
      };
    }
    if (recoveryIndex < 0 || !finalWithinLimits) {
      return {
        result: 'Fail',
        conclusion: `${scope}Particle counts did not return to ${readings.isoClass ?? 'specified'} limits within ${recoveryLimitText}. Test FAILED.`,
      };
    }
    return {
      result: 'Pass',
      conclusion: `${scope}Particle counts recovered to ${readings.isoClass ?? 'specified'} limits within ${recoveryLimitText} (reading #${recoveryIndex + 1}). Test PASSED.`,
    };
  };

  if (Array.isArray(readings.sections) && readings.sections.length > 0) {
    const sectionResults = readings.sections.map((section, idx) => {
      const { enriched, recoveryIndex, finalWithinLimits } = enrichRows(section.rows ?? [], limits);
      const label =
        (section.fields?.equipmentDetails as string) ||
        (section.fields?.roomName as string) ||
        (section.fields?.locationName as string) ||
        `Section ${idx + 1}`;
      const { result, conclusion } = buildConclusion(recoveryIndex, finalWithinLimits, label);
      return { fields: section.fields, rows: enriched, recoveryIndex, result, conclusion };
    });

    const failed = sectionResults.filter((s) => s.result === 'Fail');
    const overall: 'Pass' | 'Fail' = failed.length === 0 ? 'Pass' : 'Fail';
    const conclusion =
      overall === 'Pass'
        ? `All sections recovered to ${readings.isoClass ?? 'specified'} limits within ${recoveryLimitText}. Test PASSED.`
        : `Test FAILED: ${failed.map((s) => s.conclusion).join('; ')}`;

    return {
      calculatedValues: { sections: sectionResults, limits, recoveryTimeLimit: recoveryLimit || null },
      result: overall,
      conclusion,
    };
  }

  const { enriched, recoveryIndex, finalWithinLimits } = enrichRows(readings.rows ?? [], limits);
  const { result, conclusion } = buildConclusion(recoveryIndex, finalWithinLimits);

  return {
    calculatedValues: {
      rows: enriched,
      limits,
      recoveryTimeLimit: recoveryLimit || null,
      recoveryIndex,
    },
    result,
    conclusion,
  };
}
