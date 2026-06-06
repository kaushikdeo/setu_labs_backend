export interface QuoteCompanyProfile {
  name: string;
  addressLines: string[];
  gstin: string;
  logoUrl?: string;
  email: string;
  phone: string;
  signatoryName: string;
  signatoryTitle: string;
  bank: {
    name: string;
    accountName: string;
    accountNo: string;
    ifsc: string;
    micr: string;
    branch: string;
    accountType: string;
  };
}

export const DEFAULT_QUOTE_COMPANY: QuoteCompanyProfile = {
  name: 'SciFi Sebex Private Limited',
  addressLines: [
    'Shop 1, 4th Floor, Harekrushna Heights, Above Fashion',
    'Corner Shop, Vidya Valley School Road, Sus Pune - 411021',
    'Pune Maharashtra 411021',
    'India',
  ],
  gstin: '27ABGCS8970H1ZR',
  email: 'info@sebex.in',
  phone: '8369685172',
  signatoryName: 'Director',
  signatoryTitle: 'Director',
  bank: {
    name: 'State Bank of India',
    accountName: 'SCIFI SEBEX PRIVATE LIMITED',
    accountNo: '00000044495395199',
    ifsc: 'SBIN0008043',
    micr: '411002020',
    branch: 'Dattawadi (Pune)',
    accountType: 'Cash Credit',
  },
};

const STATE_GST_CODES: Record<string, string> = {
  maharashtra: '27',
  karnataka: '29',
  delhi: '07',
  gujarat: '24',
  tamilnadu: '33',
  'tamil nadu': '33',
  telangana: '36',
  'uttar pradesh': '09',
  westbengal: '19',
  'west bengal': '19',
};

export function gstStateCode(state?: string): string {
  if (!state) return '27';
  const key = state.trim().toLowerCase();
  return STATE_GST_CODES[key] ?? '27';
}

export function formatPlaceOfSupply(state?: string): string {
  if (!state) return 'Maharashtra (27)';
  const code = gstStateCode(state);
  const label = state
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return `${label} (${code})`;
}
