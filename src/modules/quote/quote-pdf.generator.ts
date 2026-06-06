import PDFDocument from 'pdfkit';
import { IQuote, IQuoteLineItem } from './quote.model';
import { IOpportunity } from '../opportunity/opportunity.model';
import { IOrganization } from '../organization/organization.model';
import {
  DEFAULT_QUOTE_COMPANY,
  QuoteCompanyProfile,
  formatPlaceOfSupply,
} from './quote-pdf.config';
import {
  amountInIndianWords,
  formatIndianCurrency,
  formatLineItemDescription,
  formatQuoteDate,
  splitBulletLines,
} from './quote-pdf.utils';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const FRAME = 30;
const PAD = 10;
const LEFT = FRAME + PAD;
const TOP = FRAME + PAD;
const CONTENT_W = PAGE_W - 2 * FRAME - 2 * PAD;
const PAGE_BOTTOM = PAGE_H - FRAME - PAD - 18;

const BORDER = '#333333';
const HEADER_BG = '#e8e8e8';
const TEXT = '#111111';
const MUTED = '#333333';

const TBL = { srW: 28, qtyW: 52, rateW: 62, amtW: 72 };
const TBL_DESC_W = CONTENT_W - TBL.srW - TBL.qtyW - TBL.rateW - TBL.amtW;

export interface QuotePdfInput {
  quote: IQuote;
  opportunity: IOpportunity;
  organization?: IOrganization | null;
  tcBody?: string;
}

interface CustomerBlock {
  name: string;
  lines: string[];
}

interface TermsBlock {
  heading?: string;
  lines: string[];
}

function tblCols() {
  const x0 = LEFT;
  return {
    x0,
    x1: x0 + TBL.srW,
    x2: x0 + TBL.srW + TBL_DESC_W,
    x3: x0 + TBL.srW + TBL_DESC_W + TBL.qtyW,
    x4: x0 + TBL.srW + TBL_DESC_W + TBL.qtyW + TBL.rateW,
    x5: x0 + CONTENT_W,
  };
}

function companyFromOrg(org: IOrganization | null | undefined): QuoteCompanyProfile {
  if (!org) return DEFAULT_QUOTE_COMPANY;
  return {
    name: org.companyName,
    addressLines: [
      org.addressLine1,
      org.addressLine2,
      `${org.city} ${org.state} ${org.pincode}`,
      org.country,
    ].filter(Boolean) as string[],
    gstin: org.gstin?.trim() || DEFAULT_QUOTE_COMPANY.gstin,
    logoUrl: org.logoUrl?.trim() || undefined,
    email: org.primaryContactEmail,
    phone: org.primaryContactPhone,
    signatoryName: org.primaryContactName,
    signatoryTitle: org.primaryContactDesignation || 'Director',
    bank: DEFAULT_QUOTE_COMPANY.bank,
  };
}

async function loadLogoBuffer(url?: string): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('image') || contentType.includes('svg')) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function customerBlock(opp: IOpportunity): CustomerBlock {
  const name = opp.company?.trim() || `${opp.firstName} ${opp.lastName}`.trim() || '—';
  const lines = [
    opp.siteLocation,
    [opp.city, opp.state].filter(Boolean).join(' '),
    'India',
    opp.mobile ? `Phone ${opp.mobile}` : undefined,
    opp.email,
  ].filter(Boolean) as string[];
  return { name, lines };
}

function buildTermsBlocks(quote: IQuote, tcBody?: string): TermsBlock[] {
  const blocks: TermsBlock[] = [];
  if (quote.scopeOfSupply?.trim()) {
    blocks.push({ heading: 'Scope of Work:', lines: splitBulletLines(quote.scopeOfSupply) });
  }
  const payment = [quote.paymentNotes?.trim(), quote.paymentTermsPreset].filter(Boolean).join(' — ');
  if (payment) {
    blocks.push({ heading: 'Payment Terms:', lines: splitBulletLines(payment) });
  }
  if (quote.deliveryTimeline?.trim()) {
    blocks.push({ heading: 'Delivery:', lines: splitBulletLines(quote.deliveryTimeline) });
  }
  if (quote.warrantyPeriod && quote.warrantyPeriod !== 'none') {
    blocks.push({ lines: [`· Warranty: ${quote.warrantyPeriod}`] });
  }
  if (quote.validityNote?.trim()) {
    blocks.push({ lines: [`· Valid until: ${quote.validityNote.trim()}`] });
  }
  if (quote.specialConditions?.trim()) {
    blocks.push({
      heading: 'Special Conditions:',
      lines: splitBulletLines(quote.specialConditions),
    });
  }
  if (quote.inclusions?.length) {
    blocks.push({
      heading: 'Inclusions:',
      lines: quote.inclusions.map((i) => `· ${i}`),
    });
  }
  if (quote.exclusions?.length) {
    blocks.push({
      heading: 'Exclusions:',
      lines: quote.exclusions.map((e) => `· ${e}`),
    });
  }
  if (tcBody?.trim()) {
    blocks.push({ lines: splitBulletLines(tcBody) });
  }
  if (!blocks.length) {
    blocks.push({
      lines: [
        '· Standard SciFi Sebex service and supply terms apply.',
        '· Quote valid until the date mentioned above.',
      ],
    });
  }
  return blocks;
}

function strokeBox(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number): void {
  doc.save().lineWidth(0.5).strokeColor(BORDER).rect(x, y, w, h).stroke().restore();
}

function strokeVLines(
  doc: PDFKit.PDFDocument,
  xs: number[],
  y: number,
  h: number,
): void {
  doc.save().lineWidth(0.5).strokeColor(BORDER);
  for (const x of xs) doc.moveTo(x, y).lineTo(x, y + h).stroke();
  doc.restore();
}

function ensureSpaceAt(doc: PDFKit.PDFDocument, y: number, needed: number): number {
  if (y + needed > PAGE_BOTTOM) {
    doc.addPage();
    return TOP;
  }
  return y;
}

function measureLineRow(
  doc: PDFKit.PDFDocument,
  title: string,
  details: string[],
): number {
  const descW = TBL_DESC_W - 8;
  doc.font('Helvetica').fontSize(9);
  let h = doc.heightOfString(title, { width: descW }) + 2;
  doc.fontSize(8);
  for (const d of details) {
    h += doc.heightOfString(d, { width: descW }) + 1;
  }
  return Math.max(22, h + 10);
}

function drawLineItemsHeader(doc: PDFKit.PDFDocument, y: number): number {
  const c = tblCols();
  const h = 22;
  doc.save().fillColor(HEADER_BG).rect(c.x0, y, CONTENT_W, h).fill().restore();
  strokeBox(doc, c.x0, y, CONTENT_W, h);
  strokeVLines(doc, [c.x1, c.x2, c.x3, c.x4], y, h);

  const ty = y + 6;
  doc.font('Helvetica-Bold').fontSize(8).fillColor(TEXT);
  doc.text('Sr.\nNo.', c.x0 + 2, ty, { width: TBL.srW - 4, align: 'center' });
  doc.text('Item & Description', c.x1 + 4, ty, { width: TBL_DESC_W - 8 });
  doc.text('Qty', c.x2 + 2, ty, { width: TBL.qtyW - 4, align: 'right' });
  doc.text('Rate', c.x3 + 2, ty, { width: TBL.rateW - 4, align: 'right' });
  doc.text('Amount', c.x4 + 2, ty, { width: TBL.amtW - 4, align: 'right' });
  return y + h;
}

function drawLineItemRow(
  doc: PDFKit.PDFDocument,
  item: IQuoteLineItem,
  index: number,
  y: number,
  rowH: number,
): number {
  const c = tblCols();
  const { title, details } = formatLineItemDescription(item.description, item.notes);

  strokeBox(doc, c.x0, y, CONTENT_W, rowH);
  strokeVLines(doc, [c.x1, c.x2, c.x3, c.x4], y, rowH);

  const cy = y + 5;
  doc.font('Helvetica').fontSize(9).fillColor(TEXT);
  doc.text(String(index + 1), c.x0 + 2, cy, { width: TBL.srW - 4, align: 'center' });

  let dy = cy;
  doc.font('Helvetica').fontSize(9).text(title, c.x1 + 4, dy, { width: TBL_DESC_W - 8 });
  dy = doc.y + 1;
  doc.fontSize(8).fillColor(MUTED);
  for (const line of details) {
    doc.text(line, c.x1 + 4, dy, { width: TBL_DESC_W - 8 });
    dy = doc.y + 1;
  }

  doc.font('Helvetica').fontSize(9).fillColor(TEXT);
  doc.text(item.quantity.toFixed(2), c.x2 + 2, cy, { width: TBL.qtyW - 4, align: 'right' });
  doc.text(formatIndianCurrency(item.unitRate), c.x3 + 2, cy, {
    width: TBL.rateW - 4,
    align: 'right',
  });
  doc.text(formatIndianCurrency(item.netAmount), c.x4 + 2, cy, {
    width: TBL.amtW - 4,
    align: 'right',
  });

  return y + rowH;
}

function drawLineItemsTable(
  doc: PDFKit.PDFDocument,
  items: IQuoteLineItem[],
  startY: number,
): number {
  let y = drawLineItemsHeader(doc, startY);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const { title, details } = formatLineItemDescription(item.description, item.notes);
    const rowH = measureLineRow(doc, title, details);
    if (y + rowH > PAGE_BOTTOM) {
      doc.addPage();
      y = drawLineItemsHeader(doc, TOP);
    }
    y = drawLineItemRow(doc, item, i, y, rowH);
  }
  return y;
}

function drawCompanyHeader(
  doc: PDFKit.PDFDocument,
  company: QuoteCompanyProfile,
  logoBuffer: Buffer | null,
): number {
  const LOGO = 56;
  let textX = LEFT;
  let y = TOP;

  if (logoBuffer) {
    doc.image(logoBuffer, LEFT, y, { fit: [LOGO, LOGO] });
    textX = LEFT + LOGO + 10;
  }

  doc.font('Helvetica-Bold').fontSize(12).fillColor(TEXT);
  doc.text(company.name, textX, y, { width: CONTENT_W * 0.55 });
  y = Math.max(doc.y, y + LOGO) + 2;

  doc.font('Helvetica').fontSize(8).fillColor(MUTED);
  for (const line of company.addressLines) {
    doc.text(line, textX, y, { width: CONTENT_W * 0.55 });
    y += 10;
  }
  doc.text(`GSTIN ${company.gstin}`, textX, y);
  y += 10;
  doc.text(company.email, textX, y);
  y += 10;
  doc.text(`Mobile No: ${company.phone}`, textX, y);
  y += 6;

  doc.font('Helvetica-Bold').fontSize(24).fillColor(TEXT);
  doc.text('Quotation', LEFT, TOP, { width: CONTENT_W, align: 'right' });

  return Math.max(y + 8, TOP + LOGO + 8);
}

function drawMetaBox(
  doc: PDFKit.PDFDocument,
  quote: IQuote,
  opportunity: IOpportunity,
  reference: string,
  y: number,
): number {
  const h = 56;
  const mid = LEFT + CONTENT_W / 2;
  strokeBox(doc, LEFT, y, CONTENT_W, h);
  doc.save().lineWidth(0.5).strokeColor(BORDER);
  doc.moveTo(mid, y).lineTo(mid, y + h).stroke();
  doc.restore();

  const py = y + 8;
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED);
  doc.text(`Quotation no : ${quote.number}`, LEFT + 8, py);
  doc.text(`Quotation Date : ${formatQuoteDate(quote.quoteDate)}`, LEFT + 8, py + 13);
  doc.text(`Reference : ${reference}`, LEFT + 8, py + 26);
  doc.text(
    `Place Of Supply : ${formatPlaceOfSupply(opportunity.state)}`,
    mid + 8,
    py,
    { width: CONTENT_W / 2 - 16 },
  );
  return y + h + 6;
}

function drawBillShipRow(
  doc: PDFKit.PDFDocument,
  billTo: CustomerBlock,
  shipTo: CustomerBlock,
  y: number,
): number {
  const halfW = CONTENT_W / 2;
  const headerH = 18;
  const pad = 8;

  doc.font('Helvetica').fontSize(8.5);
  const billContentH =
    doc.heightOfString(billTo.name, { width: halfW - 2 * pad }) +
    2 +
    billTo.lines.reduce((h, l) => h + doc.heightOfString(l, { width: halfW - 2 * pad }) + 2, 0);
  const shipContentH =
    doc.heightOfString(shipTo.name, { width: halfW - 2 * pad }) +
    2 +
    shipTo.lines.reduce((h, l) => h + doc.heightOfString(l, { width: halfW - 2 * pad }) + 2, 0);
  const bodyH = Math.max(billContentH, shipContentH) + pad;
  const totalH = headerH + bodyH;

  strokeBox(doc, LEFT, y, CONTENT_W, totalH);
  doc.save().lineWidth(0.5).strokeColor(BORDER);
  doc.moveTo(LEFT + halfW, y).lineTo(LEFT + halfW, y + totalH).stroke();
  doc.moveTo(LEFT, y + headerH).lineTo(LEFT + CONTENT_W, y + headerH).stroke();
  doc.restore();

  doc.save().fillColor(HEADER_BG).rect(LEFT, y, halfW, headerH).fill().restore();
  doc.save().fillColor(HEADER_BG).rect(LEFT + halfW, y, halfW, headerH).fill().restore();
  strokeVLines(doc, [LEFT + halfW], y, headerH);

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(TEXT);
  doc.text('Bill To', LEFT, y + 5, { width: halfW, align: 'center' });
  doc.text('Ship To', LEFT + halfW, y + 5, { width: halfW, align: 'center' });

  let by = y + headerH + pad;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(TEXT);
  doc.text(billTo.name, LEFT + pad, by, { width: halfW - 2 * pad });
  by = doc.y + 2;
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED);
  for (const line of billTo.lines) {
    doc.text(line, LEFT + pad, by, { width: halfW - 2 * pad });
    by += doc.heightOfString(line, { width: halfW - 2 * pad }) + 2;
  }

  let sy = y + headerH + pad;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(TEXT);
  doc.text(shipTo.name, LEFT + halfW + pad, sy, { width: halfW - 2 * pad });
  sy = doc.y + 2;
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED);
  for (const line of shipTo.lines) {
    doc.text(line, LEFT + halfW + pad, sy, { width: halfW - 2 * pad });
    sy += doc.heightOfString(line, { width: halfW - 2 * pad }) + 2;
  }

  return y + totalH + 6;
}

function drawSubjectRow(doc: PDFKit.PDFDocument, subject: string, y: number): number {
  const h = 22;
  strokeBox(doc, LEFT, y, CONTENT_W, h);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(TEXT);
  doc.text('Subject :', LEFT + 8, y + 6, { width: 52 });
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED);
  doc.text(subject, LEFT + 58, y + 6, { width: CONTENT_W - 66 });
  return y + h + 4;
}

function measureFooterHeight(doc: PDFKit.PDFDocument, quote: IQuote): number {
  const leftW = CONTENT_W * 0.58;
  const words = amountInIndianWords(quote.amountInclGst);
  doc.font('Helvetica-BoldOblique').fontSize(8.5);
  const wordsH = doc.heightOfString(words, { width: leftW - 16 }) + 28;
  const bankLines = 8;
  const bankH = bankLines * 11 + 36;
  const totalsH = 78;
  const signH = 72;
  return Math.max(wordsH + bankH, totalsH + signH) + 8;
}

function drawFooterSummary(
  doc: PDFKit.PDFDocument,
  quote: IQuote,
  company: QuoteCompanyProfile,
  items: IQuoteLineItem[],
  y: number,
): number {
  const leftW = CONTENT_W * 0.58;
  const rightW = CONTENT_W - leftW;
  const blockH = measureFooterHeight(doc, quote);

  strokeBox(doc, LEFT, y, CONTENT_W, blockH);
  doc.save().lineWidth(0.5).strokeColor(BORDER);
  doc.moveTo(LEFT + leftW, y).lineTo(LEFT + leftW, y + blockH).stroke();
  doc.restore();

  let ly = y + 8;
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text('Total In Words', LEFT + 8, ly);
  ly += 12;
  const words = amountInIndianWords(quote.amountInclGst);
  doc.font('Helvetica-BoldOblique').fontSize(8.5).fillColor(TEXT);
  doc.text(words, LEFT + 8, ly, { width: leftW - 16 });
  ly = doc.y + 10;

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(TEXT).text('Bank Details', LEFT + 8, ly);
  ly += 12;
  doc.font('Helvetica').fontSize(8).fillColor(MUTED);
  const bankLines = [
    'DETAILS FOR ONLINE TRANSFER:',
    `· Bank Name: ${company.bank.name}`,
    `· Bank Account Name: ${company.bank.accountName}`,
    `· Bank Account No.: ${company.bank.accountNo}`,
    `· IFSC Code: ${company.bank.ifsc}`,
    `· MICR Code: ${company.bank.micr}`,
    `· Branch Name: ${company.bank.branch}`,
    `· Account Type: ${company.bank.accountType}`,
  ];
  for (const line of bankLines) {
    doc.text(line, LEFT + 8, ly, { width: leftW - 16 });
    ly += 11;
  }

  const totalsTop = y + 8;
  const labelX = LEFT + leftW + 8;
  const valX = LEFT + leftW + rightW - 88;
  const valW = 80;
  let ty = totalsTop;

  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED);
  doc.text('Total Taxable Amount', labelX, ty, { width: rightW - 100 });
  doc.text(formatIndianCurrency(quote.amountExclGst), valX, ty, { width: valW, align: 'right' });
  ty += 14;

  const gstRate = items[0]?.gstRate ?? 18;
  if (quote.cgstTotal > 0) {
    doc.text(`CGST9 (${gstRate / 2}%)`, labelX, ty, { width: rightW - 100 });
    doc.text(formatIndianCurrency(quote.cgstTotal), valX, ty, { width: valW, align: 'right' });
    ty += 14;
    doc.text(`SGST9 (${gstRate / 2}%)`, labelX, ty, { width: rightW - 100 });
    doc.text(formatIndianCurrency(quote.sgstTotal), valX, ty, { width: valW, align: 'right' });
    ty += 14;
  } else if (quote.igstTotal > 0) {
    doc.text(`IGST (${gstRate}%)`, labelX, ty, { width: rightW - 100 });
    doc.text(formatIndianCurrency(quote.igstTotal), valX, ty, { width: valW, align: 'right' });
    ty += 14;
  }

  doc.save().lineWidth(0.5).strokeColor(BORDER);
  doc.moveTo(labelX, ty + 2).lineTo(LEFT + CONTENT_W - 8, ty + 2).stroke();
  doc.restore();
  ty += 8;

  doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT);
  doc.text('Total', labelX, ty, { width: rightW - 100 });
  doc.text(formatIndianCurrency(quote.amountInclGst), valX, ty, { width: valW, align: 'right' });

  const signY = y + blockH - 64;
  doc.save().lineWidth(0.5).strokeColor(BORDER);
  doc.moveTo(LEFT + leftW, signY - 6).lineTo(LEFT + CONTENT_W, signY - 6).stroke();
  doc.restore();

  doc.font('Helvetica').fontSize(8.5).fillColor(TEXT);
  doc.text(company.signatoryName, labelX, signY, { width: rightW - 16 });
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED);
  doc.text(company.signatoryTitle, labelX, signY + 44, {
    width: rightW - 16,
    align: 'center',
  });

  return y + blockH + 8;
}

function drawTermsSection(
  doc: PDFKit.PDFDocument,
  blocks: TermsBlock[],
  y: number,
): number {
  y = ensureSpaceAt(doc, y, 30);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT).text('Terms & Conditions', LEFT, y);
  y += 14;

  for (const block of blocks) {
    if (block.heading) {
      const hH = doc.heightOfString(block.heading, { width: CONTENT_W }) + 4;
      y = ensureSpaceAt(doc, y, hH);
      doc.font('Helvetica-Bold').fontSize(8).fillColor(TEXT).text(block.heading, LEFT, y, {
        width: CONTENT_W,
      });
      y += hH;
    }
    for (const line of block.lines) {
      const lineH = doc.heightOfString(line, { width: CONTENT_W }) + 3;
      y = ensureSpaceAt(doc, y, lineH);
      doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(line, LEFT, y, { width: CONTENT_W });
      y += lineH;
    }
    y += 4;
  }
  return y;
}

function stampPageFrames(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.save().lineWidth(0.75).strokeColor(BORDER);
    doc.rect(FRAME, FRAME, PAGE_W - 2 * FRAME, PAGE_H - 2 * FRAME).stroke();
    doc.restore();
    doc.font('Helvetica').fontSize(8).fillColor(MUTED);
    doc.text(String(i + 1), PAGE_W - FRAME - 8, PAGE_H - FRAME + 2, {
      width: 20,
      align: 'right',
    });
  }
}

export async function generateQuotePdfBuffer(input: QuotePdfInput): Promise<Buffer> {
  const { quote, opportunity, organization, tcBody } = input;
  const company = companyFromOrg(organization);
  const logoBuffer = await loadLogoBuffer(company.logoUrl);
  const items = (quote.lineItems ?? []).filter((l) => !l.isOptional);
  const subject =
    opportunity.name?.trim() || quote.opportunityName?.trim() || quote.scopeOfSupply?.trim() || '—';
  const reference =
    opportunity.qualificationNotes?.trim() || opportunity.confirmedNeed?.trim() || '—';
  const billTo = customerBlock(opportunity);
  const shipTo = customerBlock(opportunity);
  const termsBlocks = buildTermsBlocks(quote, tcBody);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let y = drawCompanyHeader(doc, company, logoBuffer);
    y = drawMetaBox(doc, quote, opportunity, reference, y);
    y = drawBillShipRow(doc, billTo, shipTo, y);
    y = drawSubjectRow(doc, subject, y);
    y = drawLineItemsTable(doc, items, y);

    const footerH = measureFooterHeight(doc, quote);
    if (y + footerH + 60 > PAGE_BOTTOM) {
      doc.addPage();
      y = TOP;
    }
    y = drawFooterSummary(doc, quote, company, items, y);
    drawTermsSection(doc, termsBlocks, y);

    stampPageFrames(doc);
    doc.end();
  });
}
