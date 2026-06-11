const ISO_CLASS_OPTIONS = [
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

export const RECOVERY_TEST_PRESET = {
  code: 'RECOVERY_TEST',
  name: 'Recovery Test',
  description:
    'Equipment recovery test after particle generation challenge. Captures initial, particle generation, and recovery period readings per ISO 14644-3 / NSF/ANSI 49.',
  category: 'validation' as const,
  requiredInstrumentType: 'Air Particle Counter',
  applicableEquipmentTypes: [
    'Biosafety Cabinet',
    'Laminar Air Flow',
    'Clean Air Room',
  ],
  calculationKey: 'recovery_test',
  showEquipmentDetails: false,
  showGraph: false,
  dueDateDays: 365,
  headerFields: [
    {
      key: 'isoClass',
      label: 'ISO Class / Grade',
      type: 'select',
      required: true,
      options: ISO_CLASS_OPTIONS,
    },
    {
      key: 'recoveryTimeLimit',
      label: 'Recovery Time Limit',
      unit: 'min',
      type: 'number',
      required: true,
      defaultValue: '5',
    },
    {
      key: 'departmentArea',
      label: 'Department / Area',
      type: 'text',
      required: false,
    },
  ],
  tableColumns: [
    {
      key: 'equipmentDetails',
      label: 'Equipment Details',
      type: 'text',
      required: true,
      scope: 'section',
    },
    {
      key: 'sectionRemarks',
      label: 'Remarks',
      type: 'text',
      required: false,
      scope: 'section',
    },
    {
      key: 'phase',
      label: 'Test Values',
      type: 'text',
      required: true,
      scope: 'row',
    },
    {
      key: 'endTime',
      label: 'End Time of Reading',
      type: 'text',
      required: true,
      scope: 'row',
    },
    {
      key: 'count_0_5um',
      label: '0.5 µm',
      unit: '/m³',
      type: 'number',
      required: true,
      scope: 'row',
    },
    {
      key: 'count_5um',
      label: '5.0 µm',
      unit: '/m³',
      type: 'number',
      required: true,
      scope: 'row',
    },
  ],
  acceptanceCriteria: {
    description:
      'Particle counts must return to ISO class limits within the specified recovery time (ISO 14644-3 / NSF/ANSI 49)',
    thresholds: RECOVERY_TEST_ISO_THRESHOLDS,
  },
  resultSummaryColumns: [
    { key: 'equipmentDetails', label: 'Equipment' },
    { key: '_result', label: 'Result' },
  ],
};
