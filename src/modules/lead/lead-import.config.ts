import {
  BudgetStatus,
  DecisionTimeline,
  FollowUpMode,
  LeadIndustry,
  LeadProductInterest,
  LeadSource,
  LeadTemperature,
  LeadPriority,
} from './lead.model';

export const MAX_IMPORT_ROWS = 500;

export const TEMPLATE_HEADERS = [
  'First Name *',
  'Last Name *',
  'Mobile *',
  'Email',
  'Company',
  'Designation',
  'Department',
  'City',
  'State',
  'Source',
  'Campaign',
  'Referred By',
  'Product Interest',
  'Industry',
  'Estimated Value',
  'Expected Close Date',
  'Decision Timeline',
  'Budget Status',
  'Temperature',
  'Tags',
  'Assigned To Email',
  'Follow Up Date',
  'Follow Up Mode',
  'Priority',
  'Notes',
] as const;

export const TEMPLATE_FIELD_GUIDE: readonly (readonly string[])[] = [
  ['Field', 'Required', 'Notes', 'Allowed values'],
  ['First Name', 'Yes', 'Contact first name', ''],
  ['Last Name', 'Yes', 'Contact last name', ''],
  ['Mobile', 'Yes', 'Primary phone; must be unique', ''],
  ['Email', 'No', 'Valid email', ''],
  ['Company', 'No', 'Organization name', ''],
  ['Designation', 'No', 'Job title', ''],
  ['Department', 'No', 'Department / function', ''],
  ['City', 'No', '', ''],
  ['State', 'No', '', ''],
  ['Source', 'No*', 'Defaults from import screen if blank', Object.values(LeadSource).join(', ')],
  ['Campaign', 'No', 'Marketing campaign name', ''],
  ['Referred By', 'No', 'Referrer name', ''],
  ['Product Interest', 'No', '', Object.values(LeadProductInterest).join(', ')],
  ['Industry', 'No', '', Object.values(LeadIndustry).join(', ')],
  ['Estimated Value', 'No', 'Number ≥ 0', ''],
  ['Expected Close Date', 'No', 'YYYY-MM-DD', ''],
  ['Decision Timeline', 'No', '', Object.values(DecisionTimeline).join(', ')],
  ['Budget Status', 'No', '', Object.values(BudgetStatus).join(', ')],
  ['Temperature', 'No*', 'Defaults to warm if blank', Object.values(LeadTemperature).join(', ')],
  ['Tags', 'No', 'Comma-separated', ''],
  ['Assigned To Email', 'No*', 'User email; defaults from import screen', ''],
  ['Follow Up Date', 'No', 'YYYY-MM-DD', ''],
  ['Follow Up Mode', 'No', '', Object.values(FollowUpMode).join(', ')],
  ['Priority', 'No', 'Defaults to normal', Object.values(LeadPriority).join(', ')],
  ['Notes', 'No', 'Free text', ''],
];

const normalizeHeader = (h: string) =>
  h
    .trim()
    .toLowerCase()
    .replace(/\*+$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const HEADER_TO_FIELD: Record<string, string> = {
  'first name': 'firstName',
  firstname: 'firstName',
  'last name': 'lastName',
  lastname: 'lastName',
  mobile: 'mobile',
  phone: 'mobile',
  'phone number': 'mobile',
  email: 'email',
  company: 'company',
  designation: 'designation',
  department: 'department',
  city: 'city',
  state: 'state',
  source: 'source',
  campaign: 'campaign',
  'referred by': 'referredBy',
  referredby: 'referredBy',
  'product interest': 'productInterest',
  productinterest: 'productInterest',
  industry: 'industry',
  'estimated value': 'estimatedValue',
  estimatedvalue: 'estimatedValue',
  'expected close date': 'expectedCloseDate',
  expectedclosedate: 'expectedCloseDate',
  'decision timeline': 'decisionTimeline',
  decisiontimeline: 'decisionTimeline',
  'budget status': 'budgetStatus',
  budgetstatus: 'budgetStatus',
  temperature: 'temperature',
  tags: 'tags',
  'assigned to email': 'assignedToEmail',
  assignedtoemail: 'assignedToEmail',
  assignee: 'assignedToEmail',
  'follow up date': 'followUpDate',
  followupdate: 'followUpDate',
  'follow up mode': 'followUpMode',
  followupmode: 'followUpMode',
  priority: 'priority',
  notes: 'notes',
};

export function mapHeader(header: string): string | null {
  const key = normalizeHeader(header);
  return HEADER_TO_FIELD[key] ?? null;
}

function labelMap<T extends string>(entries: [string, T][]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [label, value] of entries) {
    out[label.toLowerCase()] = value;
    out[value] = value;
  }
  return out;
}

export const SOURCE_MAP = labelMap<LeadSource>([
  ['Web form', LeadSource.WEB_FORM],
  ['LinkedIn', LeadSource.LINKEDIN],
  ['Cold call', LeadSource.COLD_CALL],
  ['Referral', LeadSource.REFERRAL],
  ['Trade event', LeadSource.TRADE_EVENT],
  ['WhatsApp', LeadSource.WHATSAPP],
  ['Email campaign', LeadSource.EMAIL_CAMPAIGN],
  ['Other', LeadSource.OTHER],
]);

export const TEMPERATURE_MAP = labelMap<LeadTemperature>([
  ['Hot', LeadTemperature.HOT],
  ['Warm', LeadTemperature.WARM],
  ['Cold', LeadTemperature.COLD],
]);

export const PRIORITY_MAP = labelMap<LeadPriority>([
  ['Low', LeadPriority.LOW],
  ['Normal', LeadPriority.NORMAL],
  ['High', LeadPriority.HIGH],
  ['Urgent', LeadPriority.URGENT],
]);

export const INDUSTRY_MAP = labelMap<LeadIndustry>([
  ['Manufacturing', LeadIndustry.MANUFACTURING],
  ['Real estate', LeadIndustry.REAL_ESTATE],
  ['Hospitality', LeadIndustry.HOSPITALITY],
  ['Healthcare', LeadIndustry.HEALTHCARE],
  ['IT offices', LeadIndustry.IT_OFFICES],
  ['Government', LeadIndustry.GOVERNMENT],
]);

export const PRODUCT_MAP = labelMap<LeadProductInterest>([
  ['HVAC', LeadProductInterest.HVAC],
  ['Fire safety', LeadProductInterest.FIRE_SAFETY],
  ['Solar MEP', LeadProductInterest.SOLAR_MEP],
  ['AMC', LeadProductInterest.AMC],
  ['Turnkey', LeadProductInterest.TURNKEY],
]);

export const TIMELINE_MAP = labelMap<DecisionTimeline>([
  ['Immediate', DecisionTimeline.IMMEDIATE],
  ['Short', DecisionTimeline.SHORT],
  ['Medium', DecisionTimeline.MEDIUM],
  ['Long', DecisionTimeline.LONG],
]);

export const BUDGET_MAP = labelMap<BudgetStatus>([
  ['Unknown', BudgetStatus.UNKNOWN],
  ['Yes', BudgetStatus.YES],
  ['No', BudgetStatus.NO],
  ['Pending', BudgetStatus.PENDING],
]);

export const FOLLOWUP_MAP = labelMap<FollowUpMode>([
  ['Phone', FollowUpMode.PHONE],
  ['Email', FollowUpMode.EMAIL],
  ['WhatsApp', FollowUpMode.WHATSAPP],
  ['Site visit', FollowUpMode.SITE_VISIT],
  ['Video call', FollowUpMode.VIDEO_CALL],
]);
