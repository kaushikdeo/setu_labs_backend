export interface HepaFilterRow {
  filterName?: string;
  filterId?: string;
  upstreamConcentration?: number;
  filterIntegrityPercent?: number;
}

export interface HepaFilterReadings {
  isoClass?: string;
  departmentArea?: string;
  numberOfFilters?: number;
  guideline?: string;
  rows: HepaFilterRow[];
}

const MAX_LEAKAGE_PERCENT = 0.01;

export function calculate(
  readings: HepaFilterReadings,
  thresholds: Record<string, number>,
): { calculatedValues: Record<string, any>; result: 'Pass' | 'Fail'; conclusion: string } {
  const maxLeakage = thresholds.maxPaoLeakagePercent ?? MAX_LEAKAGE_PERCENT;
  const failReasons: string[] = [];

  const enriched = (readings.rows || []).map((row) => {
    const val = typeof row.filterIntegrityPercent === 'number'
      ? row.filterIntegrityPercent
      : parseFloat(String(row.filterIntegrityPercent));

    const rowResult: 'Pass' | 'Fail' | 'N/A' = isNaN(val) ? 'N/A' : val <= maxLeakage ? 'Pass' : 'Fail';

    if (rowResult === 'Fail') {
      failReasons.push(
        `Filter "${row.filterId ?? row.filterName}": integrity ${val}% exceeds limit ${maxLeakage}%`,
      );
    }

    return { ...row, result: rowResult };
  });

  const result: 'Pass' | 'Fail' = failReasons.length === 0 ? 'Pass' : 'Fail';
  const conclusion =
    result === 'Pass'
      ? `All HEPA filters passed integrity test (leakage ≤ ${maxLeakage}%). Test PASSED.`
      : `Test FAILED: ${failReasons.join('; ')}`;

  return {
    calculatedValues: { rows: enriched, maxLeakagePercent: maxLeakage },
    result,
    conclusion,
  };
}
