# ISO-Class-Keyed Thresholds

## Overview

`TestType.acceptanceCriteria.thresholds` is now a two-level map:

```
Record<isoClass | "default", Record<fieldKey, { min?: number; max?: number }>>
```

Each ISO class (or `"default"`) carries its own set of field-level min/max limits. Calc functions resolve the correct threshold set at runtime using `readings.isoClass`.

---

## Data Shape

```json
{
  "ISO 5":   { "count_0_5um": { "max": 3520 }, "count_5um": { "max": 29 } },
  "ISO 6":   { "count_0_5um": { "max": 35200 }, "count_5um": { "max": 293 } },
  "ISO 7":   { "count_0_5um": { "max": 352000 }, "count_5um": { "max": 2930 } },
  "ISO 8":   { "count_0_5um": { "max": 3520000 }, "count_5um": { "max": 29300 } },
  "Grade A": { "count_0_5um": { "max": 3520 }, "count_5um": { "max": 20 } },
  "Grade B": { "count_0_5um": { "max": 352000 }, "count_5um": { "max": 2900 } },
  "Grade C": { "count_0_5um": { "max": 3520000 }, "count_5um": { "max": 29000 } },
  "Grade D": { "count_0_5um": { "max": 10000000 }, "count_5um": { "max": 100000 } }
}
```

For tests with class-agnostic thresholds (e.g. HEPA):

```json
{
  "default": { "maxPaoLeakagePercent": { "max": 0.01 } }
}
```

---

## Resolution Order (Backend & Frontend)

All calc functions and frontend evaluators use the same pattern:

```typescript
const classThresholds = thresholds[readings.isoClass ?? ''] ?? thresholds['default'] ?? {};
```

If no matching ISO class is found, falls back to `"default"`, then to an empty object.

---

## Affected Files

| Layer | File | Change |
|---|---|---|
| Backend model | `test-type.model.ts` | `thresholds` type updated |
| Backend calc | `particle-count.ts` | Removed hardcoded `ISO_LIMITS`; uses DB thresholds |
| Backend calc | `air-velocity-acph-pao.ts` | Resolves `minAcph` / `maxPaoLeakagePercent` by class |
| Backend calc | `hepa-filter-integrity.ts` | Resolves `maxPaoLeakagePercent` by class |
| Backend service | `test-result.service.ts` | Removed incorrect `as Record<string, number>` cast |
| Backend seed | `seed-test-types.ts` | Updated to new structure |
| Backend migration | `migrate-thresholds.ts` | One-time migration for existing documents |
| Frontend types | `test-result.types.ts` | `thresholds` type updated |
| Frontend admin | `AddTestPage.tsx` | New "Acceptance Criteria" tab; ISO-class-keyed editor |
| Frontend entry | `AddTestResultPage.tsx` | `resolveClassThresholds` helper; `check_thresholds` uses isoClass |
| Frontend PDF | `TestCertificatePDF.tsx` | Removed `ISO_LIMITS_PDF`; uses `resolvePdfThresholds` |

---

## Migration

Run once against production DB after deploying the backend:

```bash
npx ts-node src/scripts/migrate-thresholds.ts
```

The script detects old flat-shape documents and converts them to the new ISO-class-keyed format using the standard ISO 14644-1 defaults.

---

## Admin UI: Acceptance Criteria Tab

`AddTestPage.tsx` now has two tabs:

- **Test Structure** — header fields, table columns, result summary, display options
- **Acceptance Criteria** — description + per-ISO-class threshold editor

In the criteria tab, admins select an ISO class from a dropdown to add a new section. Each section has a list of `{ field, min, max }` rows. Any of the 8 standard classes or `"default"` can be configured.
