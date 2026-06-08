import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import { createLeadSchema } from './lead.schema';
import {
  BUDGET_MAP,
  FOLLOWUP_MAP,
  INDUSTRY_MAP,
  MAX_IMPORT_ROWS,
  PRODUCT_MAP,
  PRIORITY_MAP,
  SOURCE_MAP,
  TEMPLATE_FIELD_GUIDE,
  TEMPLATE_HEADERS,
  TEMPERATURE_MAP,
  TIMELINE_MAP,
  mapHeader,
} from './lead-import.config';
import { ILead, LeadModel } from './lead.model';
import { UserModel } from '../user/user.model';
import { srCounterService } from '../sr-counter/sr-counter.service';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';

const NULLABLE_ENUM_FIELDS = [
  'followUpMode',
  'productInterest',
  'industry',
  'decisionTimeline',
  'budgetStatus',
] as const;

const IMPORT_TTL_MS = 30 * 60 * 1000;

export interface ImportDefaults {
  assignedUserId: string;
  source: string;
  temperature?: string;
}

export interface ImportFieldError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ImportValidateResult {
  importId: string | null;
  totalRows: number;
  valid: boolean;
  errors: ImportFieldError[];
  preview: Array<{ rowNumber: number; firstName: string; lastName: string; mobile: string }>;
}

export interface ImportCommitResult {
  imported: number;
  leads: Array<{ rowNumber: number; id: string; code: string }>;
}

interface CachedImport {
  rows: Partial<ILead>[];
  rowNumbers: number[];
  createdAt: number;
}

const importCache = new Map<string, CachedImport>();

function normalizePayload(data: Partial<ILead>): Partial<ILead> {
  const out = { ...data } as Record<string, unknown>;
  for (const key of NULLABLE_ENUM_FIELDS) {
    if (out[key] === '' || out[key] === null) delete out[key];
  }
  return out as Partial<ILead>;
}

function pad(n: number, width = 4): string {
  return String(n).padStart(width, '0');
}

function cellStr(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function parseExcelDate(value: unknown): Date | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === 'number' && value > 0) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? undefined : d;
}

function parseEnum<T extends string>(
  raw: string,
  map: Record<string, T>,
  fieldLabel: string,
): { value?: T; error?: string } {
  if (!raw) return {};
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  const value = map[key] ?? map[raw.trim()];
  if (!value) {
    return {
      error: `Invalid ${fieldLabel} "${raw}". Use one of: ${[...new Set(Object.values(map))].join(', ')}`,
    };
  }
  return { value };
}

function parseTags(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

type ParsedRow = {
  rowNumber: number;
  cells: Record<string, string>;
  raw: Record<string, unknown>;
};

function parseSheetRows(buffer: Buffer): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new AppError(400, 'Spreadsheet has no sheets');

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][];
  if (!matrix.length) throw new AppError(400, 'Spreadsheet is empty');

  const headerRow = matrix[0].map((h) => cellStr(h));
  const fieldIndexes: Array<{ field: string; col: number }> = [];
  const unknownHeaders: string[] = [];

  headerRow.forEach((header, col) => {
    if (!header) return;
    const field = mapHeader(header);
    if (field) fieldIndexes.push({ field, col });
    else unknownHeaders.push(header);
  });

  if (!fieldIndexes.length) {
    throw new AppError(
      400,
      `No recognized columns. Use the template headers (e.g. First Name, Last Name, Mobile). Unknown: ${unknownHeaders.join(', ') || 'none'}`,
    );
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < matrix.length; i++) {
    const line = matrix[i] ?? [];
    const cells: Record<string, string> = {};
    const raw: Record<string, unknown> = {};
    let hasValue = false;
    for (const { field, col } of fieldIndexes) {
      const value = line[col];
      raw[field] = value;
      const v = cellStr(value);
      if (v) hasValue = true;
      cells[field] = v;
    }
    if (!hasValue) continue;
    rows.push({ rowNumber: i + 1, cells, raw });
  }

  if (!rows.length) throw new AppError(400, 'No data rows found in spreadsheet');
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new AppError(400, `Maximum ${MAX_IMPORT_ROWS} rows per import`);
  }
  return rows;
}

function purgeExpiredCache(): void {
  const now = Date.now();
  for (const [id, entry] of importCache) {
    if (now - entry.createdAt > IMPORT_TTL_MS) importCache.delete(id);
  }
}

export class LeadImportService {
  buildTemplateBuffer(): Buffer {
    const leadsSheet = XLSX.utils.aoa_to_sheet([[...TEMPLATE_HEADERS]]);
    leadsSheet['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 18 }));

    const guideSheet = XLSX.utils.aoa_to_sheet(
      TEMPLATE_FIELD_GUIDE.map((row) => [...row]),
    );
    guideSheet['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 36 }, { wch: 48 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, leadsSheet, 'Leads');
    XLSX.utils.book_append_sheet(wb, guideSheet, 'Field guide');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async validate(
    buffer: Buffer,
    defaults: ImportDefaults,
  ): Promise<ImportValidateResult> {
    purgeExpiredCache();

    const parsedRows = parseSheetRows(buffer);
    const errors: ImportFieldError[] = [];
    const validPayloads: Array<{ rowNumber: number; payload: Partial<ILead> }> = [];
    const mobilesInFile = new Map<string, number[]>();

    const defaultAssignee = await UserModel.findById(defaults.assignedUserId).lean();
    if (!defaultAssignee) {
      throw new AppError(400, 'Default assignee user not found');
    }

    const assigneeEmails = new Map<string, string>();
    const uniqueAssigneeEmails = [
      ...new Set(parsedRows.map((r) => r.cells.assignedToEmail?.toLowerCase()).filter(Boolean)),
    ];
    if (uniqueAssigneeEmails.length) {
      const users = await UserModel.find({
        email: { $in: uniqueAssigneeEmails },
        isActive: true,
      }).lean();
      for (const u of users) {
        assigneeEmails.set(u.email.toLowerCase(), String(u._id));
      }
    }

    for (const { rowNumber, cells, raw } of parsedRows) {
      const rowErrors: ImportFieldError[] = [];
      const payload: Record<string, unknown> = {};

      const firstName = cells.firstName;
      const lastName = cells.lastName;
      const mobile = cells.mobile;

      if (!firstName) rowErrors.push({ rowNumber, field: 'firstName', message: 'First Name is required' });
      if (!lastName) rowErrors.push({ rowNumber, field: 'lastName', message: 'Last Name is required' });
      if (!mobile) rowErrors.push({ rowNumber, field: 'mobile', message: 'Mobile is required' });

      if (firstName) payload.firstName = firstName;
      if (lastName) payload.lastName = lastName;
      if (mobile) {
        payload.mobile = mobile;
        const norm = mobile.replace(/\s+/g, '');
        const list = mobilesInFile.get(norm) ?? [];
        list.push(rowNumber);
        mobilesInFile.set(norm, list);
      }

      if (cells.email) payload.email = cells.email.toLowerCase();
      if (cells.company) payload.company = cells.company;
      if (cells.designation) payload.designation = cells.designation;
      if (cells.department) payload.department = cells.department;
      if (cells.city) payload.city = cells.city;
      if (cells.state) payload.state = cells.state;
      if (cells.campaign) payload.campaign = cells.campaign;
      if (cells.referredBy) payload.referredBy = cells.referredBy;
      if (cells.notes) payload.notes = cells.notes;

      const sourceRaw = cells.source || defaults.source;
      const sourceParsed = parseEnum(sourceRaw, SOURCE_MAP, 'Source');
      if (sourceParsed.error) rowErrors.push({ rowNumber, field: 'source', message: sourceParsed.error });
      else payload.source = sourceParsed.value ?? defaults.source;

      const tempRaw = cells.temperature || defaults.temperature || 'warm';
      const tempParsed = parseEnum(tempRaw, TEMPERATURE_MAP, 'Temperature');
      if (tempParsed.error) rowErrors.push({ rowNumber, field: 'temperature', message: tempParsed.error });
      else payload.temperature = tempParsed.value ?? 'warm';

      if (cells.productInterest) {
        const p = parseEnum(cells.productInterest, PRODUCT_MAP, 'Product Interest');
        if (p.error) rowErrors.push({ rowNumber, field: 'productInterest', message: p.error });
        else payload.productInterest = p.value;
      }

      if (cells.industry) {
        const p = parseEnum(cells.industry, INDUSTRY_MAP, 'Industry');
        if (p.error) rowErrors.push({ rowNumber, field: 'industry', message: p.error });
        else payload.industry = p.value;
      }

      if (cells.decisionTimeline) {
        const p = parseEnum(cells.decisionTimeline, TIMELINE_MAP, 'Decision Timeline');
        if (p.error) rowErrors.push({ rowNumber, field: 'decisionTimeline', message: p.error });
        else payload.decisionTimeline = p.value;
      }

      if (cells.budgetStatus) {
        const p = parseEnum(cells.budgetStatus, BUDGET_MAP, 'Budget Status');
        if (p.error) rowErrors.push({ rowNumber, field: 'budgetStatus', message: p.error });
        else payload.budgetStatus = p.value;
      }

      if (cells.followUpMode) {
        const p = parseEnum(cells.followUpMode, FOLLOWUP_MAP, 'Follow Up Mode');
        if (p.error) rowErrors.push({ rowNumber, field: 'followUpMode', message: p.error });
        else payload.followUpMode = p.value;
      }

      if (cells.priority) {
        const p = parseEnum(cells.priority, PRIORITY_MAP, 'Priority');
        if (p.error) rowErrors.push({ rowNumber, field: 'priority', message: p.error });
        else payload.priority = p.value;
      } else {
        payload.priority = 'normal';
      }

      if (cells.estimatedValue) {
        const n = Number(cells.estimatedValue.replace(/,/g, ''));
        if (!Number.isFinite(n) || n < 0) {
          rowErrors.push({ rowNumber, field: 'estimatedValue', message: 'Estimated Value must be a number ≥ 0' });
        } else {
          payload.estimatedValue = n;
        }
      }

      if (cells.expectedCloseDate || raw.expectedCloseDate) {
        const d = parseExcelDate(raw.expectedCloseDate ?? cells.expectedCloseDate);
        if (!d) {
          rowErrors.push({
            rowNumber,
            field: 'expectedCloseDate',
            message: 'Expected Close Date must be a valid date (YYYY-MM-DD)',
          });
        } else payload.expectedCloseDate = d;
      }

      if (cells.followUpDate || raw.followUpDate) {
        const d = parseExcelDate(raw.followUpDate ?? cells.followUpDate);
        if (!d) {
          rowErrors.push({
            rowNumber,
            field: 'followUpDate',
            message: 'Follow Up Date must be a valid date (YYYY-MM-DD)',
          });
        } else payload.followUpDate = d;
      }

      if (cells.tags) payload.tags = parseTags(cells.tags);

      let assignedUserId = defaults.assignedUserId;
      if (cells.assignedToEmail) {
        const email = cells.assignedToEmail.toLowerCase();
        const uid = assigneeEmails.get(email);
        if (!uid) {
          rowErrors.push({
            rowNumber,
            field: 'assignedToEmail',
            message: `No active user found with email "${cells.assignedToEmail}"`,
          });
        } else {
          assignedUserId = uid;
        }
      }
      payload.assignedUserId = assignedUserId;

      const { error: joiError } = createLeadSchema.validate(normalizePayload(payload as Partial<ILead>), {
        abortEarly: false,
      });
      if (joiError) {
        for (const detail of joiError.details) {
          const field = detail.path.join('.') || 'row';
          if (!rowErrors.some((e) => e.field === field && e.message === detail.message)) {
            rowErrors.push({ rowNumber, field, message: detail.message });
          }
        }
      }

      errors.push(...rowErrors);
      if (!rowErrors.length) {
        validPayloads.push({ rowNumber, payload: normalizePayload(payload as Partial<ILead>) });
      }
    }

    for (const [, rowNumbers] of mobilesInFile) {
      if (rowNumbers.length > 1) {
        for (const rowNumber of rowNumbers) {
          errors.push({
            rowNumber,
            field: 'mobile',
            message: `Duplicate mobile in file (rows: ${rowNumbers.join(', ')})`,
          });
        }
      }
    }

    const fileMobiles = [...mobilesInFile.keys()];
    if (fileMobiles.length) {
      const lookupMobiles = [
        ...new Set(parsedRows.map((r) => r.cells.mobile).filter(Boolean)),
        ...fileMobiles,
      ];
      const existing = await LeadModel.find({ mobile: { $in: lookupMobiles } })
        .select('mobile code')
        .lean();
      const existingByNorm = new Map(
        existing.map((l) => [l.mobile.replace(/\s+/g, ''), l]),
      );

      for (const { rowNumber, cells } of parsedRows) {
        const norm = cells.mobile?.replace(/\s+/g, '');
        if (!norm) continue;
        const match = existingByNorm.get(norm);
        if (match) {
          errors.push({
            rowNumber,
            field: 'mobile',
            message: `Mobile already exists on lead ${match.code}`,
          });
        }
      }
    }

    const dedupedErrors = dedupeErrors(errors);
    const valid = dedupedErrors.length === 0;

    let importId: string | null = null;
    if (valid && validPayloads.length === parsedRows.length) {
      importId = randomUUID();
      importCache.set(importId, {
        rows: validPayloads.map((v) => v.payload),
        rowNumbers: validPayloads.map((v) => v.rowNumber),
        createdAt: Date.now(),
      });
    }

    return {
      importId,
      totalRows: parsedRows.length,
      valid,
      errors: dedupedErrors,
      preview: parsedRows.slice(0, 10).map((r) => ({
        rowNumber: r.rowNumber,
        firstName: r.cells.firstName ?? '',
        lastName: r.cells.lastName ?? '',
        mobile: r.cells.mobile ?? '',
      })),
    };
  }

  async commit(importId: string, userId: string): Promise<ImportCommitResult> {
    purgeExpiredCache();
    const cached = importCache.get(importId);
    if (!cached) throw new AppError(400, 'Import session expired or not found. Validate again.');

    const session = await mongoose.startSession();
    session.startTransaction();

    const created: ImportCommitResult['leads'] = [];

    try {
      for (let i = 0; i < cached.rows.length; i++) {
        const data = cached.rows[i];
        const rowNumber = cached.rowNumbers[i];
        const seq = await srCounterService.nextSequence('lead');
        const code = `LD-${pad(seq)}`;
        const now = new Date();

        const [lead] = await LeadModel.create(
          [
            {
              ...data,
              code,
              createdBy: userId,
              lastActivityAt: now,
            },
          ],
          { session },
        );

        created.push({ rowNumber, id: String(lead._id), code });
      }

      await session.commitTransaction();
      importCache.delete(importId);
      logger.info('Lead import committed', { importId, count: created.length, userId });
      return { imported: created.length, leads: created };
    } catch (err) {
      await session.abortTransaction();
      logger.error('Lead import failed', { importId, err });
      throw new AppError(500, 'Import failed. No leads were created.');
    } finally {
      session.endSession();
    }
  }
}

function dedupeErrors(errors: ImportFieldError[]): ImportFieldError[] {
  const seen = new Set<string>();
  return errors.filter((e) => {
    const key = `${e.rowNumber}|${e.field}|${e.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const leadImportService = new LeadImportService();
