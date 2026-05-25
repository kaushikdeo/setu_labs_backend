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
  rows: ParticleCountRow[];
}

const ISO_LIMITS: Record<string, { um_0_5: number; um_5: number }> = {
  'ISO 5':  { um_0_5: 3520,      um_5: 29 },
  'ISO 6':  { um_0_5: 35200,     um_5: 293 },
  'ISO 7':  { um_0_5: 352000,    um_5: 2930 },
  'ISO 8':  { um_0_5: 3520000,   um_5: 29300 },
  'Grade A': { um_0_5: 3520,     um_5: 20 },
  'Grade B': { um_0_5: 352000,   um_5: 2900 },
  'Grade C': { um_0_5: 3520000,  um_5: 29000 },
  'Grade D': { um_0_5: 10000000, um_5: 100000 },
};

export function calculate(
  readings: ParticleCountReadings,
  _thresholds: Record<string, number>,
): { calculatedValues: Record<string, any>; result: 'Pass' | 'Fail'; conclusion: string } {
  const limits = ISO_LIMITS[readings.isoClass ?? ''] ?? null;
  const failReasons: string[] = [];

  const enriched = (readings.rows || []).map((row) => {
    const result_0_5um =
      limits && typeof row.count_0_5um === 'number'
        ? row.count_0_5um <= limits.um_0_5 ? 'Pass' : 'Fail'
        : 'N/A';
    const result_5um =
      limits && typeof row.count_5um === 'number'
        ? row.count_5um <= limits.um_5 ? 'Pass' : 'Fail'
        : 'N/A';

    if (result_0_5um === 'Fail') {
      failReasons.push(`"${row.locationName}": ≥0.5µm count ${row.count_0_5um} > limit ${limits?.um_0_5}`);
    }
    if (result_5um === 'Fail') {
      failReasons.push(`"${row.locationName}": ≥5µm count ${row.count_5um} > limit ${limits?.um_5}`);
    }

    return { ...row, result_0_5um, result_5um };
  });

  const result: 'Pass' | 'Fail' = failReasons.length === 0 ? 'Pass' : 'Fail';
  const conclusion =
    result === 'Pass'
      ? `All particle counts are within ${readings.isoClass ?? 'specified'} limits. Test PASSED.`
      : `Test FAILED: ${failReasons.join('; ')}`;

  return {
    calculatedValues: { rows: enriched, limits: limits ?? {} },
    result,
    conclusion,
  };
}
