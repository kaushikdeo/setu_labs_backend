import {
  RECOVERY_TEST_ACCEPTANCE_CRITERIA,
  AIR_FLOW_RECOVERY_CALCULATION_KEY,
  RECOVERY_TEST_HEADER_FIELDS,
  RECOVERY_TEST_RESULT_SUMMARY_COLUMNS,
  RECOVERY_TEST_TABLE_COLUMNS,
} from './recovery-test.shared';

export const AIR_FLOW_RECOVERY_TEST_PRESET = {
  code: 'AIR_FLOW_RECOVERY_TEST_TEMPLATE',
  name: 'Air Flow Recovery Test',
  description:
    'Air flow equipment recovery test after particle generation challenge. Sectioned table with INITIAL, PARTICLE GENERATION, and RECOVERY PERIOD readings per ISO 14644-3 / NSF/ANSI 49.',
  category: 'validation' as const,
  requiredInstrumentType: 'Air Particle Counter',
  applicableEquipmentTypes: [
    'Laminar Air Flow',
    'Biosafety Cabinet',
    'Clean Air Room',
    'Isolator',
  ],
  calculationKey: AIR_FLOW_RECOVERY_CALCULATION_KEY,
  showEquipmentDetails: false,
  showGraph: false,
  dueDateDays: 365,
  headerFields: RECOVERY_TEST_HEADER_FIELDS,
  tableColumns: RECOVERY_TEST_TABLE_COLUMNS,
  acceptanceCriteria: RECOVERY_TEST_ACCEPTANCE_CRITERIA,
  resultSummaryColumns: RECOVERY_TEST_RESULT_SUMMARY_COLUMNS,
};
