import mongoose from 'mongoose';
import { TestTypeModel } from '../modules/test-type/test-type.model';
import { env } from '../config/env';

const testTypes = [
  {
    code: 'AIR_VELOCITY_ACPH_PAO',
    name: 'Air Velocity / ACPH / PAO Filter Integrity',
    description: 'Combined test measuring air velocity, air changes per hour (ACPH), and PAO filter integrity using Anemometer and Aerosol Photometer',
    category: 'validation',
    requiredInstrumentType: 'Anemometer / Aerosol Photometer',
    applicableEquipmentTypes: ['Biosafety Cabinet', 'Laminar Air Flow', 'Clean Air Room'],
    calculationKey: 'air_velocity_acph_pao',
    acceptanceCriteria: {
      description: 'ACPH ≥ threshold per ISO class; PAO leakage ≤ 0.01%; Air velocity within ±20% of reference',
      thresholds: {
        'ISO 5':   { description: 'ACPH ≥ 20 ACH; PAO leakage ≤ 0.01%', fields: { minAcph: { min: 20 }, maxPaoLeakagePercent: { max: 0.01 } } },
        'ISO 6':   { description: 'ACPH ≥ 20 ACH; PAO leakage ≤ 0.01%', fields: { minAcph: { min: 20 }, maxPaoLeakagePercent: { max: 0.01 } } },
        'ISO 7':   { description: 'ACPH ≥ 20 ACH; PAO leakage ≤ 0.01%', fields: { minAcph: { min: 20 }, maxPaoLeakagePercent: { max: 0.01 } } },
        'ISO 8':   { description: 'ACPH ≥ 20 ACH; PAO leakage ≤ 0.01%', fields: { minAcph: { min: 20 }, maxPaoLeakagePercent: { max: 0.01 } } },
        'Grade A': { description: 'ACPH ≥ 20 ACH; PAO leakage ≤ 0.01%', fields: { minAcph: { min: 20 }, maxPaoLeakagePercent: { max: 0.01 } } },
        'Grade B': { description: 'ACPH ≥ 20 ACH; PAO leakage ≤ 0.01%', fields: { minAcph: { min: 20 }, maxPaoLeakagePercent: { max: 0.01 } } },
        'Grade C': { description: 'ACPH ≥ 20 ACH; PAO leakage ≤ 0.01%', fields: { minAcph: { min: 20 }, maxPaoLeakagePercent: { max: 0.01 } } },
        'Grade D': { description: 'ACPH ≥ 20 ACH; PAO leakage ≤ 0.01%', fields: { minAcph: { min: 20 }, maxPaoLeakagePercent: { max: 0.01 } } },
        default:   { description: 'ACPH ≥ 20 ACH; PAO leakage ≤ 0.01%', fields: { minAcph: { min: 20 }, maxPaoLeakagePercent: { max: 0.01 } } },
      },
    },
    headerFields: [
      { key: 'occupancyState', label: 'Occupancy State', type: 'text', required: false },
      {
        key: 'isoClass',
        label: 'Class',
        type: 'select',
        required: false,
        options: ['ISO 5', 'ISO 6', 'ISO 7', 'ISO 8', 'Grade A', 'Grade B', 'Grade C', 'Grade D'],
      },
      { key: 'departmentArea', label: 'Department / Area', type: 'text', required: false },
      { key: 'numberOfFilters', label: 'No. of Filters', type: 'number', required: false },
      { key: 'ahuNumber', label: 'AHU No.', type: 'text', required: false },
      {
        key: 'guideline',
        label: 'Guideline',
        type: 'text',
        required: false,
        defaultValue: 'ISO 14644-1,2,3,4 PART',
      },
    ],
    tableColumns: [
      { key: 'srNo', label: 'Sr. No.', type: 'text', required: true },
      { key: 'roomName', label: 'Room Name', type: 'text', required: true },
      { key: 'noOfGrill', label: 'No. of Grill', unit: '', type: 'number', required: true },
      { key: 'grillTagNo', label: 'Grill Tag No.', type: 'text', required: false },
      { key: 'v1', label: 'V1', unit: 'FT/MT', type: 'number', required: true },
      { key: 'v2', label: 'V2', unit: 'FT/MT', type: 'number', required: false },
      { key: 'v3', label: 'V3', unit: 'FT/MT', type: 'number', required: false },
      { key: 'v4', label: 'V4', unit: 'FT/MT', type: 'number', required: false },
      { key: 'v5', label: 'V5', unit: 'FT/MT', type: 'number', required: false },
      { key: 'avg', label: 'AVG', unit: 'FT/MT', type: 'computed', computedFrom: 'mean(v1,v2,v3,v4,v5)' },
      { key: 'grillSize', label: 'Grill Size', unit: 'ft²', type: 'number', required: true },
      { key: 'cfmCmh', label: 'CFM/CMH', unit: '', type: 'computed', computedFrom: 'avg*grillSize' },
      { key: 'totalCfmCmh', label: 'Total CFM/CMH', unit: '', type: 'computed', computedFrom: 'sum_by_room(cfmCmh)' },
      { key: 'roomSize', label: 'Room Size', unit: 'FT³/M³', type: 'number', required: false },
      { key: 'actualAcph', label: 'Actual ACPH', unit: 'ACH', type: 'computed', computedFrom: '(totalCfmCmh*60)/roomSize' },
      { key: 'paoLeakagePercent', label: 'PAO Leakage IN (%)', unit: '%', type: 'number', required: false },
      { key: 'upstreamConcentration', label: 'Upstream Concentration', unit: 'µg/L', type: 'number', required: false },
    ],
  },
  {
    code: 'PARTICLE_COUNT',
    name: 'Non-Viable Particle Count',
    description: 'Measures airborne non-viable particle counts at 0.5µm and 5.0µm using a Particle Counter, compared against ISO 14644-1 class limits',
    category: 'validation',
    requiredInstrumentType: 'Air Particle Counter',
    applicableEquipmentTypes: ['Biosafety Cabinet', 'Laminar Air Flow', 'Clean Air Room'],
    calculationKey: 'particle_count',
    acceptanceCriteria: {
      description: 'All location particle counts must be within ISO 14644-1 class limits',
      thresholds: {
        'ISO 5':   { description: '≥0.5µm ≤ 3,520/m³; ≥5µm ≤ 29/m³',             fields: { count_0_5um: { max: 3520 },      count_5um: { max: 29 } } },
        'ISO 6':   { description: '≥0.5µm ≤ 35,200/m³; ≥5µm ≤ 293/m³',           fields: { count_0_5um: { max: 35200 },     count_5um: { max: 293 } } },
        'ISO 7':   { description: '≥0.5µm ≤ 352,000/m³; ≥5µm ≤ 2,930/m³',        fields: { count_0_5um: { max: 352000 },    count_5um: { max: 2930 } } },
        'ISO 8':   { description: '≥0.5µm ≤ 3,520,000/m³; ≥5µm ≤ 29,300/m³',     fields: { count_0_5um: { max: 3520000 },   count_5um: { max: 29300 } } },
        'Grade A': { description: '≥0.5µm ≤ 3,520/m³; ≥5µm ≤ 20/m³',             fields: { count_0_5um: { max: 3520 },      count_5um: { max: 20 } } },
        'Grade B': { description: '≥0.5µm ≤ 352,000/m³; ≥5µm ≤ 2,900/m³',        fields: { count_0_5um: { max: 352000 },    count_5um: { max: 2900 } } },
        'Grade C': { description: '≥0.5µm ≤ 3,520,000/m³; ≥5µm ≤ 29,000/m³',     fields: { count_0_5um: { max: 3520000 },   count_5um: { max: 29000 } } },
        'Grade D': { description: '≥0.5µm ≤ 10,000,000/m³; ≥5µm ≤ 100,000/m³',   fields: { count_0_5um: { max: 10000000 },  count_5um: { max: 100000 } } },
      },
    },
    headerFields: [
      {
        key: 'isoClass',
        label: 'ISO Class',
        type: 'select',
        required: true,
        options: ['ISO 5', 'ISO 6', 'ISO 7', 'ISO 8', 'Grade A', 'Grade B', 'Grade C', 'Grade D'],
      },
      { key: 'samplingVolume', label: 'Sampling Volume', unit: 'L', type: 'number', required: false },
      { key: 'departmentArea', label: 'Department / Area', type: 'text', required: false },
      { key: 'ahuNumber', label: 'AHU No.', type: 'text', required: false },
    ],
    tableColumns: [
      { key: 'srNo', label: 'Sr. No.', type: 'text', required: true },
      { key: 'locationName', label: 'Location Name', type: 'text', required: true },
      { key: 'count_0_5um', label: '≥0.5µm', unit: '/m³', type: 'number', required: true },
      { key: 'count_5um', label: '≥5.0µm', unit: '/m³', type: 'number', required: true },
      { key: 'result_0_5um', label: 'Result (0.5µm)', type: 'computed', computedFrom: 'iso_limit(count_0_5um,isoClass,0.5)' },
      { key: 'result_5um', label: 'Result (5µm)', type: 'computed', computedFrom: 'iso_limit(count_5um,isoClass,5)' },
    ],
  },
  {
    code: 'HEPA_FILTER_INTEGRITY',
    name: 'HEPA Filter Integrity Test (DOP/PAO)',
    description: 'Tests HEPA filter integrity by challenging with DOP/PAO aerosol and measuring downstream leakage using an Aerosol Photometer',
    category: 'validation',
    requiredInstrumentType: 'Aerosol Photometer',
    applicableEquipmentTypes: ['Biosafety Cabinet', 'Laminar Air Flow', 'Clean Air Room'],
    calculationKey: 'hepa_filter_integrity',
    acceptanceCriteria: {
      description: 'Filter Integrity % (PAO leakage) must be ≤ 0.01% of upstream concentration',
      thresholds: {
        'ISO 5':   { description: 'PAO leakage ≤ 0.01% of upstream concentration', fields: { maxPaoLeakagePercent: { max: 0.01 } } },
        'ISO 6':   { description: 'PAO leakage ≤ 0.01% of upstream concentration', fields: { maxPaoLeakagePercent: { max: 0.01 } } },
        'ISO 7':   { description: 'PAO leakage ≤ 0.01% of upstream concentration', fields: { maxPaoLeakagePercent: { max: 0.01 } } },
        'ISO 8':   { description: 'PAO leakage ≤ 0.01% of upstream concentration', fields: { maxPaoLeakagePercent: { max: 0.01 } } },
        'Grade A': { description: 'PAO leakage ≤ 0.01% of upstream concentration', fields: { maxPaoLeakagePercent: { max: 0.01 } } },
        'Grade B': { description: 'PAO leakage ≤ 0.01% of upstream concentration', fields: { maxPaoLeakagePercent: { max: 0.01 } } },
        'Grade C': { description: 'PAO leakage ≤ 0.01% of upstream concentration', fields: { maxPaoLeakagePercent: { max: 0.01 } } },
        'Grade D': { description: 'PAO leakage ≤ 0.01% of upstream concentration', fields: { maxPaoLeakagePercent: { max: 0.01 } } },
        default:   { description: 'PAO leakage ≤ 0.01% of upstream concentration', fields: { maxPaoLeakagePercent: { max: 0.01 } } },
      },
    },
    headerFields: [
      {
        key: 'isoClass',
        label: 'Class',
        type: 'select',
        required: false,
        options: ['ISO 5', 'ISO 6', 'ISO 7', 'ISO 8', 'Grade A', 'Grade B', 'Grade C', 'Grade D'],
      },
      { key: 'departmentArea', label: 'Department / Area', type: 'text', required: false },
      { key: 'numberOfFilters', label: 'No. of Filters', type: 'number', required: false },
      { key: 'ahuNumber', label: 'AHU No.', type: 'text', required: false },
      { key: 'guideline', label: 'Guideline', type: 'text', required: false, defaultValue: 'ISO 14644-3' },
    ],
    tableColumns: [
      { key: 'filterName', label: 'Filter Name', type: 'text', required: true },
      { key: 'filterId', label: 'Filter Id', type: 'text', required: true },
      { key: 'upstreamConcentration', label: 'Upstream Concentration', unit: 'µg/L', type: 'number', required: true },
      { key: 'filterIntegrityPercent', label: 'Filter Integrity %', unit: '%', type: 'number', required: true },
      { key: 'result', label: 'Result (Pass or Fail)', type: 'computed', computedFrom: 'hepa_integrity(filterIntegrityPercent)' },
    ],
  },
];

async function seed() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log('Connected to MongoDB');

  for (const tt of testTypes) {
    await TestTypeModel.findOneAndUpdate({ code: tt.code }, tt, { upsert: true, new: true });
    console.log(`Seeded: ${tt.name}`);
  }

  console.log('Test type seeding complete');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
