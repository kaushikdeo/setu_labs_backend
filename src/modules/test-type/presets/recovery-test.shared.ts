export const ISO_CLASS_OPTIONS = [
  'ISO 5',
  'ISO 6',
  'ISO 7',
  'ISO 8',
  'Grade A',
  'Grade B',
  'Grade C',
  'Grade D',
];

export const RECOVERY_TEST_ISO_THRESHOLDS = {
  'ISO 5': {
    description: '≥0.5µm ≤ 3,520/m³; ≥5µm ≤ 29/m³',
    fields: { count_0_5um: { max: 3520 }, count_5um: { max: 29 } },
  },
  'ISO 6': {
    description: '≥0.5µm ≤ 35,200/m³; ≥5µm ≤ 293/m³',
    fields: { count_0_5um: { max: 35200 }, count_5um: { max: 293 } },
  },
  'ISO 7': {
    description: '≥0.5µm ≤ 352,000/m³; ≥5µm ≤ 2,930/m³',
    fields: { count_0_5um: { max: 352000 }, count_5um: { max: 2930 } },
  },
  'ISO 8': {
    description: '≥0.5µm ≤ 3,520,000/m³; ≥5µm ≤ 29,300/m³',
    fields: { count_0_5um: { max: 3520000 }, count_5um: { max: 29300 } },
  },
  'Grade A': {
    description: '≥0.5µm ≤ 3,520/m³; ≥5µm ≤ 20/m³',
    fields: { count_0_5um: { max: 3520 }, count_5um: { max: 20 } },
  },
  'Grade B': {
    description: '≥0.5µm ≤ 352,000/m³; ≥5µm ≤ 2,900/m³',
    fields: { count_0_5um: { max: 352000 }, count_5um: { max: 2900 } },
  },
  'Grade C': {
    description: '≥0.5µm ≤ 3,520,000/m³; ≥5µm ≤ 29,000/m³',
    fields: { count_0_5um: { max: 3520000 }, count_5um: { max: 29000 } },
  },
  'Grade D': {
    description: '≥0.5µm ≤ 10,000,000/m³; ≥5µm ≤ 100,000/m³',
    fields: { count_0_5um: { max: 10000000 }, count_5um: { max: 100000 } },
  },
  default: {
    description: 'No specific ISO class selected',
    fields: {},
  },
};

export const RECOVERY_TEST_HEADER_FIELDS = [
  {
    key: 'isoClass',
    label: 'ISO Class / Grade',
    type: 'select' as const,
    required: true,
    options: ISO_CLASS_OPTIONS,
  },
  {
    key: 'recoveryTimeLimit',
    label: 'Recovery Time Limit',
    unit: 'min',
    type: 'number' as const,
    required: true,
    defaultValue: '5',
  },
  {
    key: 'departmentArea',
    label: 'Department / Area',
    type: 'text' as const,
    required: false,
  },
];

export const RECOVERY_TEST_TABLE_COLUMNS = [
  {
    key: 'equipmentDetails',
    label: 'Equipment Details',
    type: 'text' as const,
    required: true,
    scope: 'section' as const,
  },
  {
    key: 'sectionRemarks',
    label: 'Remarks',
    type: 'text' as const,
    required: false,
    scope: 'section' as const,
  },
  {
    key: 'phase',
    label: 'Test Values',
    type: 'text' as const,
    required: true,
    scope: 'row' as const,
  },
  {
    key: 'endTime',
    label: 'End Time of Reading',
    type: 'text' as const,
    required: true,
    scope: 'row' as const,
  },
  {
    key: 'count_0_5um',
    label: '0.5 µm',
    unit: '/m³',
    type: 'number' as const,
    required: true,
    scope: 'row' as const,
  },
  {
    key: 'count_5um',
    label: '5.0 µm',
    unit: '/m³',
    type: 'number' as const,
    required: true,
    scope: 'row' as const,
  },
];

export const RECOVERY_TEST_ACCEPTANCE_CRITERIA = {
  description:
    'Particle counts must return to ISO class limits within the specified recovery time (ISO 14644-3 / NSF/ANSI 49)',
  thresholds: RECOVERY_TEST_ISO_THRESHOLDS,
};

export const RECOVERY_TEST_RESULT_SUMMARY_COLUMNS = [
  { key: 'equipmentDetails', label: 'Equipment' },
  { key: '_result', label: 'Result' },
];

export const RECOVERY_TEST_CALCULATION_KEY = 'recovery_test';

export const AIR_FLOW_RECOVERY_CALCULATION_KEY = 'air_flow_recovery_test';
