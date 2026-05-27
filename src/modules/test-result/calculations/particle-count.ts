export interface ParticleCountRow {
  srNo?: string;
  locationName?: string;
  count_0_5um?: number;
  count_5um?: number;
}

export interface ParticleCountReadings {
  isoClass?: string;
  samplingVolume?: number;
  departmentArea?: string;
  rows?: ParticleCountRow[];
  sections?: Array<{ fields: Record<string, any>; rows: ParticleCountRow[] }>;
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

function enrichRow(
  row: ParticleCountRow,
  limits: { um_0_5: number | null; um_5: number | null },
  failReasons: string[],
): ParticleCountRow & { result_0_5um: string; result_5um: string } {
  const result_0_5um =
    limits.um_0_5 != null && typeof row.count_0_5um === 'number'
      ? row.count_0_5um <= limits.um_0_5 ? 'Pass' : 'Fail'
      : 'N/A';
  const result_5um =
    limits.um_5 != null && typeof row.count_5um === 'number'
      ? row.count_5um <= limits.um_5 ? 'Pass' : 'Fail'
      : 'N/A';

  if (result_0_5um === 'Fail') {
    failReasons.push(`"${row.locationName}": ≥0.5µm count ${row.count_0_5um} > limit ${limits.um_0_5}`);
  }
  if (result_5um === 'Fail') {
    failReasons.push(`"${row.locationName}": ≥5µm count ${row.count_5um} > limit ${limits.um_5}`);
  }

  return { ...row, result_0_5um, result_5um };
}

export function calculate(
  readings: ParticleCountReadings,
  thresholds: IsoThresholds,
): { calculatedValues: Record<string, any>; result: 'Pass' | 'Fail'; conclusion: string } {
  const limits = getLimits(thresholds, readings.isoClass);
  const failReasons: string[] = [];

  if (Array.isArray(readings.sections) && readings.sections.length > 0) {
    const enrichedSections = readings.sections.map((section) => ({
      fields: section.fields,
      rows: (section.rows ?? []).map((row) => enrichRow(row, limits, failReasons)),
    }));

    const result: 'Pass' | 'Fail' = failReasons.length === 0 ? 'Pass' : 'Fail';
    const conclusion =
      result === 'Pass'
        ? `All particle counts are within ${readings.isoClass ?? 'specified'} limits. Test PASSED.`
        : `Test FAILED: ${failReasons.join('; ')}`;

    return {
      calculatedValues: { sections: enrichedSections, limits },
      result,
      conclusion,
    };
  }

  const enriched = (readings.rows || []).map((row) => enrichRow(row, limits, failReasons));

  const result: 'Pass' | 'Fail' = failReasons.length === 0 ? 'Pass' : 'Fail';
  const conclusion =
    result === 'Pass'
      ? `All particle counts are within ${readings.isoClass ?? 'specified'} limits. Test PASSED.`
      : `Test FAILED: ${failReasons.join('; ')}`;

  return {
    calculatedValues: { rows: enriched, limits },
    result,
    conclusion,
  };
}
