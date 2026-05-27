const FALLBACK_VELOCITY_KEYS = ['v1', 'v2', 'v3', 'v4', 'v5'];

function getVelocityKeys(testType?: any): string[] {
  const avgCol = testType?.tableColumns?.find(
    (c: any) => c.key === 'avg' && typeof c.computedFrom === 'string' && c.computedFrom.startsWith('mean('),
  );
  if (!avgCol) return FALLBACK_VELOCITY_KEYS;
  return avgCol.computedFrom.slice(5, -1).split(',').map((s: string) => s.trim());
}

function mean(vals: (number | string | undefined)[]): number {
  const nums = vals.map(Number).filter((v) => !isNaN(v) && v > 0);
  if (!nums.length) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

interface FlatRow {
  [key: string]: number | string | undefined;
}

interface SectionEntry {
  fields: Record<string, string>;
  rows: FlatRow[];
}

interface EnrichedRow extends FlatRow {
  avg: number;
  cfmCmh: number;
}

interface EnrichedSection {
  fields: Record<string, string>;
  rows: EnrichedRow[];
  totalCfmCmh: number;
  actualAcph: number | null;
}

function enrichSections(
  sections: SectionEntry[],
  velocityKeys: string[],
  thresholds: { minAcph: number; maxPaoLeakagePercent: number },
  failReasons: string[],
): EnrichedSection[] {
  return sections.map((section) => {
    const roomName = section.fields['roomName'] ?? `Section ${sections.indexOf(section) + 1}`;
    const roomSize = Number(section.fields['roomSize'] ?? 0);

    const enrichedRows: EnrichedRow[] = section.rows.map((row) => {
      const avg = mean(velocityKeys.map((k) => row[k]));
      const grillSize = Number(row['grillSize']) || 0;
      const cfmCmh = Number((avg * grillSize).toFixed(2));

      const pao = Number(row['paoLeakagePercent']);
      if (!isNaN(pao) && pao > 0 && pao > thresholds.maxPaoLeakagePercent) {
        failReasons.push(
          `Room "${roomName}" / Grill "${row['grillTagNo'] || '?'}": PAO leakage ${pao}% > ${thresholds.maxPaoLeakagePercent}%`,
        );
      }

      return { ...row, avg: Number(avg.toFixed(2)), cfmCmh };
    });

    const totalCfmCmh = Number(enrichedRows.reduce((s, r) => s + r.cfmCmh, 0).toFixed(2));
    const actualAcph = roomSize > 0 ? Number(((totalCfmCmh * 60) / roomSize).toFixed(2)) : null;

    if (actualAcph !== null && actualAcph < thresholds.minAcph) {
      failReasons.push(`Room "${roomName}": ACPH ${actualAcph} < required ${thresholds.minAcph}`);
    }

    return { fields: section.fields, rows: enrichedRows, totalCfmCmh, actualAcph };
  });
}

// Legacy: support old nested { atRest: { rooms: [...] }, inOperation: { rooms: [...] } } format
function legacyRoomsToSections(rooms: any[]): SectionEntry[] {
  return (rooms ?? []).map((room: any) => ({
    fields: { srNo: room.srNo ?? '', roomName: room.roomName ?? '', roomSize: String(room.roomSize ?? '') },
    rows: room.grills ?? [],
  }));
}

type IsoClassEntry = { description?: string; fields: Record<string, { min?: number; max?: number }> };
type IsoThresholds = Record<string, IsoClassEntry>;

function resolveThresholds(
  thresholds: IsoThresholds,
  isoClass: string | undefined,
): { minAcph: number; maxPaoLeakagePercent: number } {
  const classEntry = thresholds[isoClass ?? ''] ?? thresholds['default'];
  const fields = classEntry?.fields ?? {};
  return {
    minAcph: fields['minAcph']?.min ?? 20,
    maxPaoLeakagePercent: fields['maxPaoLeakagePercent']?.max ?? 0.01,
  };
}

export function calculate(
  readings: any,
  thresholds: IsoThresholds,
  testType?: any,
): { calculatedValues: Record<string, any>; result: 'Pass' | 'Fail'; conclusion: string } {
  const t = resolveThresholds(thresholds, readings.isoClass);
  const velocityKeys = getVelocityKeys(testType);
  const failReasons: string[] = [];

  // New format: { sections: [...] }
  if (Array.isArray(readings.sections)) {
    const enriched = enrichSections(readings.sections, velocityKeys, t, failReasons);
    const result: 'Pass' | 'Fail' = failReasons.length === 0 ? 'Pass' : 'Fail';
    const conclusion =
      result === 'Pass'
        ? 'All air velocity, ACPH and PAO filter integrity values are within acceptance criteria. Test PASSED.'
        : `Test FAILED: ${failReasons.join('; ')}`;
    return { calculatedValues: { sections: enriched }, result, conclusion };
  }

  // Legacy format: { atRest: { rooms: [...] }, inOperation: { rooms: [...] } }
  const atRestSections = legacyRoomsToSections(readings.atRest?.rooms ?? []);
  const inOperationSections = legacyRoomsToSections(readings.inOperation?.rooms ?? []);
  const enrichedAtRest = enrichSections(atRestSections, velocityKeys, t, failReasons);
  const enrichedInOperation = enrichSections(inOperationSections, velocityKeys, t, failReasons);

  const result: 'Pass' | 'Fail' = failReasons.length === 0 ? 'Pass' : 'Fail';
  const conclusion =
    result === 'Pass'
      ? 'All air velocity, ACPH and PAO filter integrity values are within acceptance criteria for both At Rest and In Operation states. Test PASSED.'
      : `Test FAILED: ${failReasons.join('; ')}`;

  return {
    calculatedValues: {
      atRest: { sections: enrichedAtRest },
      inOperation: { sections: enrichedInOperation },
    },
    result,
    conclusion,
  };
}
