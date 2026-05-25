/**
 * Patches UI-created test types that are missing tableColumns / calculationKey
 * by matching them to the master config using name keywords.
 */
import mongoose from 'mongoose';
import { TestTypeModel } from '../modules/test-type/test-type.model';
import { env } from '../config/env';

const AIR_VELOCITY_CONFIG = {
  calculationKey: 'air_velocity_acph_pao',
  acceptanceCriteria: {
    description: 'ACPH ≥ threshold per ISO class; PAO leakage ≤ 0.01%; Air velocity within ±20% of reference',
    thresholds: { minAcph: 20, maxPaoLeakagePercent: 0.01, velocityTolerancePercent: 20 },
  },
  headerFields: [
    { key: 'occupancyState', label: 'Occupancy State', type: 'text', required: false },
    { key: 'isoClass', label: 'Class', type: 'select', required: false, options: ['ISO 5', 'ISO 6', 'ISO 7', 'ISO 8', 'Grade A', 'Grade B', 'Grade C', 'Grade D'] },
    { key: 'departmentArea', label: 'Department / Area', type: 'text', required: false },
    { key: 'numberOfFilters', label: 'No. of Filters', type: 'number', required: false },
    { key: 'ahuNumber', label: 'AHU No.', type: 'text', required: false },
    { key: 'guideline', label: 'Guideline', type: 'text', required: false, defaultValue: 'ISO 14644-1,2,3,4 PART' },
  ],
  tableColumns: [
    { key: 'srNo', label: 'Sr. No.', type: 'text', required: true },
    { key: 'roomName', label: 'Room Name', type: 'text', required: true },
    { key: 'noOfGrill', label: 'No. of Grill', type: 'number', required: true },
    { key: 'grillTagNo', label: 'Grill Tag No.', type: 'text', required: false },
    { key: 'v1', label: 'V1', unit: 'FT/MT', type: 'number', required: true },
    { key: 'v2', label: 'V2', unit: 'FT/MT', type: 'number', required: false },
    { key: 'v3', label: 'V3', unit: 'FT/MT', type: 'number', required: false },
    { key: 'v4', label: 'V4', unit: 'FT/MT', type: 'number', required: false },
    { key: 'v5', label: 'V5', unit: 'FT/MT', type: 'number', required: false },
    { key: 'avg', label: 'AVG', unit: 'FT/MT', type: 'computed', computedFrom: 'mean(v1,v2,v3,v4,v5)' },
    { key: 'grillSize', label: 'Grill Size', unit: 'ft²', type: 'number', required: true },
    { key: 'cfmCmh', label: 'CFM/CMH', type: 'computed', computedFrom: 'avg*grillSize' },
    { key: 'totalCfmCmh', label: 'Total CFM/CMH', type: 'computed', computedFrom: 'sum_by_room(cfmCmh)' },
    { key: 'roomSize', label: 'Room Size', unit: 'FT³/M³', type: 'number', required: false },
    { key: 'actualAcph', label: 'Actual ACPH', unit: 'ACH', type: 'computed', computedFrom: '(totalCfmCmh*60)/roomSize' },
    { key: 'paoLeakagePercent', label: 'PAO Leakage IN (%)', unit: '%', type: 'number', required: false },
    { key: 'upstreamConcentration', label: 'Upstream Concentration', unit: 'µg/L', type: 'number', required: false },
  ],
};

const HEPA_CONFIG = {
  calculationKey: 'hepa_filter_integrity',
  acceptanceCriteria: {
    description: 'Filter Integrity % (PAO leakage) must be ≤ 0.01% of upstream concentration',
    thresholds: { maxPaoLeakagePercent: 0.01 },
  },
  headerFields: [
    { key: 'isoClass', label: 'Class', type: 'select', required: false, options: ['ISO 5', 'ISO 6', 'ISO 7', 'ISO 8', 'Grade A', 'Grade B', 'Grade C', 'Grade D'] },
    { key: 'departmentArea', label: 'Department / Area', type: 'text', required: false },
    { key: 'numberOfFilters', label: 'No. of Filters', type: 'number', required: false },
    { key: 'guideline', label: 'Guideline', type: 'text', required: false, defaultValue: 'ISO 14644-3' },
  ],
  tableColumns: [
    { key: 'filterName', label: 'Filter Name', type: 'text', required: true },
    { key: 'filterId', label: 'Filter Id', type: 'text', required: true },
    { key: 'upstreamConcentration', label: 'Upstream Concentration', unit: 'µg/L', type: 'number', required: true },
    { key: 'filterIntegrityPercent', label: 'Filter Integrity %', unit: '%', type: 'number', required: true },
    { key: 'result', label: 'Result (Pass or Fail)', type: 'computed', computedFrom: 'hepa_integrity(filterIntegrityPercent)' },
  ],
};

const PARTICLE_CONFIG = {
  calculationKey: 'particle_count',
  acceptanceCriteria: {
    description: 'All location particle counts must be within ISO 14644-1 class limits',
    thresholds: { 'ISO 5_0_5um': 3520, 'ISO 5_5um': 29, 'ISO 6_0_5um': 35200, 'ISO 6_5um': 293, 'ISO 7_0_5um': 352000, 'ISO 7_5um': 2930, 'ISO 8_0_5um': 3520000, 'ISO 8_5um': 29300 },
  },
  headerFields: [
    { key: 'isoClass', label: 'ISO Class', type: 'select', required: true, options: ['ISO 5', 'ISO 6', 'ISO 7', 'ISO 8', 'Grade A', 'Grade B', 'Grade C', 'Grade D'] },
    { key: 'samplingVolume', label: 'Sampling Volume', unit: 'L', type: 'number', required: false },
    { key: 'departmentArea', label: 'Department / Area', type: 'text', required: false },
  ],
  tableColumns: [
    { key: 'srNo', label: 'Sr. No.', type: 'text', required: true },
    { key: 'locationName', label: 'Location Name', type: 'text', required: true },
    { key: 'count_0_5um', label: '≥0.5µm', unit: '/m³', type: 'number', required: true },
    { key: 'count_5um', label: '≥5.0µm', unit: '/m³', type: 'number', required: true },
    { key: 'result_0_5um', label: 'Result (0.5µm)', type: 'computed', computedFrom: 'iso_limit(count_0_5um,isoClass,0.5)' },
    { key: 'result_5um', label: 'Result (5µm)', type: 'computed', computedFrom: 'iso_limit(count_5um,isoClass,5)' },
  ],
};

function resolveConfig(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('hepa') || lower.includes('integrity') || lower.includes('dop')) return HEPA_CONFIG;
  if (lower.includes('particle')) return PARTICLE_CONFIG;
  if (lower.includes('air') || lower.includes('velocity') || lower.includes('acph')) return AIR_VELOCITY_CONFIG;
  return null;
}

async function patch() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log('Connected to MongoDB');

  const all = await TestTypeModel.find({});
  let patched = 0;

  for (const tt of all) {
    if (tt.tableColumns?.length > 0 && tt.calculationKey) {
      console.log(`  SKIP (already configured): ${tt.name}`);
      continue;
    }

    const config = resolveConfig(tt.name);
    if (!config) {
      console.log(`  NO MATCH: ${tt.name}`);
      continue;
    }

    await TestTypeModel.findByIdAndUpdate(tt._id, {
      $set: {
        calculationKey: config.calculationKey,
        acceptanceCriteria: config.acceptanceCriteria,
        headerFields: config.headerFields,
        tableColumns: config.tableColumns,
      },
    });
    console.log(`  PATCHED: ${tt.name}  →  ${config.calculationKey}`);
    patched++;
  }

  console.log(`\nDone. ${patched} test type(s) patched.`);
  await mongoose.disconnect();
}

patch().catch((err) => {
  console.error(err);
  process.exit(1);
});
