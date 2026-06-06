const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`.trim();
}

function threeDigits(n: number): string {
  if (n === 0) return '';
  if (n < 100) return twoDigits(n);
  return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${twoDigits(n % 100)}` : ''}`;
}

function indianWords(n: number): string {
  if (n === 0) return 'Zero';
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));
  return parts.join(' ');
}

export function amountInIndianWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let out = `Indian Rupee ${indianWords(rupees)}`;
  if (paise > 0) out += ` And ${indianWords(paise)} Paise`;
  return `${out} Only`;
}

export function formatIndianCurrency(value: number): string {
  const fixed = value.toFixed(2);
  const [intPart, dec] = fixed.split('.');
  if (intPart.length <= 3) return `${intPart}.${dec}`;
  const last3 = intPart.slice(-3);
  let rest = intPart.slice(0, -3);
  const groups: string[] = [last3];
  while (rest.length > 0) {
    groups.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  return `${groups.join(',')}.${dec}`;
}

export function formatQuoteDate(d: Date | string): string {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function splitBulletLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      if (/^[·•\-–]/.test(l)) return l.replace(/^[•\-–]\s*/, '· ');
      return `· ${l}`;
    });
}

export function formatLineItemDescription(
  raw: string,
  notes?: string,
): { title: string; details: string[] } {
  const combined = [raw?.trim(), notes?.trim()].filter(Boolean).join('\n');
  const lines = combined.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { title: '—', details: [] };
  const title = lines[0];
  const details = lines.slice(1).map((l) => {
    if (/^[·•\-–]/.test(l)) return l.replace(/^[•\-–]\s*/, '· ');
    if (/^(make|model|sr|serial|range|hsn|sac)/i.test(l)) return `· ${l}`;
    return `· ${l}`;
  });
  return { title, details };
}
