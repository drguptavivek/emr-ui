/** Pure parse/format and controlled-draft mechanics for L1 numeric, date, time, and datetime inputs. */

import type { ClinicalFieldValue, ClinicalQuantityValue } from '@drguptavivek/emr-controller';
import { localDateTimeToUtcIso, toLocalDateTimeInputValue } from '@drguptavivek/emr-controller';

export { localDateTimeToUtcIso, toLocalDateTimeInputValue };

/** Display order only; the value is always ISO (`YYYY-MM-DD`, `YYYY-MM`, or `YYYY`). Comes from the locale (labels provider): en-IN dd-mm-yyyy. */
export type DateDisplayFormat = 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'yyyy-mm-dd' | 'mm-yyyy' | 'yyyy-mm' | 'yyyy';
export type DatePrecision = 'day' | 'month' | 'year';
export type TimePrecision = 'minute' | 'second';

/**
 * 'empty' = cleared (emit null). 'valid' = a real calendar date / clock time (emit value).
 * 'draft' = incomplete or impossible (31-02-2026): stays on screen, never emitted.
 */
export type TextParse = { status: 'empty' } | { status: 'valid'; value: string } | { status: 'draft' };

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

function daysIn(year: number, month: number): number {
  if (month === 2) return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

// ---- pure L1 numeric draft & step mechanics ------------------------------------------------

export function sanitizeNumberText(text: string, integer: boolean): string {
  const cleaned = text.replace(integer ? /[^\d-]/g : /[^\d.-]/g, '');
  const sign = cleaned.startsWith('-') ? '-' : '';
  const body = cleaned.replace(/-/g, '');
  if (integer) return sign + body;
  const [whole, ...rest] = body.split('.');
  return sign + whole + (rest.length ? '.' + rest.join('') : '');
}

export function parseNumberDraft(text: string): { complete: true; value: number | null } | { complete: false } {
  if (text === '') return { complete: true, value: null };
  if (text === '-' || text === '-.' || text === '.' || text.endsWith('.')) return { complete: false };
  const n = Number(text);
  if (Number.isNaN(n)) return { complete: false };
  return { complete: true, value: n };
}

export function isQuantity(value: ClinicalFieldValue | undefined): value is ClinicalQuantityValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && 'value' in value && 'unit' in value;
}

export function numberTextOf(value: ClinicalFieldValue | undefined): string {
  if (typeof value === 'number') return String(value);
  if (isQuantity(value)) return value.value === null ? '' : String(value.value);
  return '';
}

/**
 * Computes numeric step from field type, optional display precision, and optional explicit step.
 * `'integer'` -> `1`; explicit `step` wins; `precision` -> `10 ** -precision` (rounded cleanly); fallback `0.01`.
 */
export function computePrecisionStep(
  type: 'integer' | 'decimal' | 'quantity',
  precision?: number,
  explicitStep?: number,
): number {
  if (explicitStep !== undefined && explicitStep > 0) return explicitStep;
  if (type === 'integer') return 1;
  if (precision !== undefined) {
    if (precision <= 0) return 1;
    return Number((10 ** -precision).toFixed(precision));
  }
  return 0.01;
}

/**
 * Resolves the displayed string for a controlled numeric input.
 * - When `!editable` (`readOnly` or `disabled`) or `!focused`, always snaps to the accepted `value` prop
 *   so controller-rejected edits and half-typed drafts never remain stuck on screen.
 */
export function resolveControlledNumberDraft(params: {
  draft: string;
  value: ClinicalFieldValue | undefined;
  focused: boolean;
  editable: boolean;
}): string {
  const external = numberTextOf(params.value);
  if (!params.editable || !params.focused) return external;
  return params.draft;
}

// ---- pure L1 date / time / datetime parse & bounds mechanics -------------------------------

/** Resolve effective display format for a given precision and base format. */
export function resolveDateFormat(format: DateDisplayFormat = 'dd-mm-yyyy', precision: DatePrecision = 'day'): DateDisplayFormat {
  if (format === 'yyyy' || precision === 'year') return 'yyyy';
  if (format === 'yyyy-mm' || format === 'mm-yyyy') return format;
  if (precision === 'month') return format === 'yyyy-mm-dd' ? 'yyyy-mm' : 'mm-yyyy';
  return format;
}

/** Strips anything a date can't contain, as typed. */
export function sanitizeDateText(text: string, format: DateDisplayFormat = 'dd-mm-yyyy'): string {
  const maxLen = format === 'yyyy' ? 4 : format === 'yyyy-mm' || format === 'mm-yyyy' ? 7 : 10;
  return text.replace(/[^\d\-/. ]/g, '').slice(0, maxLen);
}

export function parseDateText(text: string, baseFormat: DateDisplayFormat, precision: DatePrecision = 'day'): TextParse {
  const format = resolveDateFormat(baseFormat, precision);
  const trimmed = text.trim();
  if (trimmed === '') return { status: 'empty' };

  if (format === 'yyyy') {
    if (!/^\d{4}$/.test(trimmed)) return { status: 'draft' };
    const year = Number(trimmed);
    if (year < 1) return { status: 'draft' };
    return { status: 'valid', value: pad(year, 4) };
  }

  if (format === 'yyyy-mm' || format === 'mm-yyyy') {
    const digits = /^\d{6}$/.test(trimmed)
      ? (format === 'yyyy-mm' ? [trimmed.slice(0, 4), trimmed.slice(4, 6)] : [trimmed.slice(0, 2), trimmed.slice(2, 6)])
      : null;
    const parts = digits ?? trimmed.split(/[-/. ]+/);
    if (parts.length !== 2 || parts.some(part => !/^\d+$/.test(part))) return { status: 'draft' };
    const [a, b] = parts as [string, string];
    const [m, y] = format === 'mm-yyyy' ? [a, b] : [b, a];
    if (y.length !== 4 || m.length > 2) return { status: 'draft' };
    const year = Number(y), month = Number(m);
    if (year < 1 || month < 1 || month > 12) return { status: 'draft' };
    return { status: 'valid', value: `${pad(year, 4)}-${pad(month)}` };
  }

  // Numeric keypads have no separator: 8 bare digits read in display order (05032026 → 05-03-2026).
  const digits = /^\d{8}$/.test(trimmed)
    ? (format === 'yyyy-mm-dd' ? [trimmed.slice(0, 4), trimmed.slice(4, 6), trimmed.slice(6)] : [trimmed.slice(0, 2), trimmed.slice(2, 4), trimmed.slice(4)])
    : null;
  const parts = digits ?? trimmed.split(/[-/. ]+/);
  if (parts.length !== 3 || parts.some(part => !/^\d+$/.test(part))) return { status: 'draft' };
  const [a, b, c] = parts as [string, string, string];
  const [d, m, y] = format === 'dd-mm-yyyy' ? [a, b, c] : format === 'mm-dd-yyyy' ? [b, a, c] : [c, b, a];
  if (y.length !== 4 || d.length > 2 || m.length > 2) return { status: 'draft' };
  const year = Number(y), month = Number(m), day = Number(d);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysIn(year, month)) return { status: 'draft' };
  return { status: 'valid', value: `${pad(year, 4)}-${pad(month)}-${pad(day)}` };
}

/** ISO `YYYY-MM-DD`, `YYYY-MM`, or `YYYY` to display text; anything else (null, malformed) shows empty. */
export function formatDate(iso: string | null | undefined, baseFormat: DateDisplayFormat, precision: DatePrecision = 'day'): string {
  const format = resolveDateFormat(baseFormat, precision);
  if (!iso) return '';
  if (format === 'yyyy') {
    const matchY = /^(\d{4})/.exec(iso);
    return matchY ? matchY[1]! : '';
  }
  if (format === 'yyyy-mm' || format === 'mm-yyyy') {
    const matchYM = /^(\d{4})-(\d{2})/.exec(iso);
    if (!matchYM) return '';
    const [, y, m] = matchYM;
    return format === 'mm-yyyy' ? `${m}-${y}` : `${y}-${m}`;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return '';
  const [, y, m, d] = match;
  return format === 'dd-mm-yyyy' ? `${d}-${m}-${y}` : format === 'mm-dd-yyyy' ? `${m}-${d}-${y}` : `${y}-${m}-${d}`;
}

/** Checks whether an ISO date (`YYYY-MM-DD`, `YYYY-MM`, or `YYYY`) falls outside optional ISO `min` / `max` bounds. */
export function isIsoDateOutOfBounds(
  iso: string | null | undefined,
  min?: string,
  max?: string,
  precision: DatePrecision = 'day',
): boolean {
  if (!iso) return false;
  const len = precision === 'year' ? 4 : precision === 'month' ? 7 : 10;
  const target = iso.slice(0, len);
  if (target.length < len) return false;
  if (min && min.length >= 4) {
    const minPrefix = min.slice(0, Math.min(len, min.length));
    if (target.slice(0, minPrefix.length) < minPrefix) return true;
  }
  if (max && max.length >= 4) {
    const maxPrefix = max.slice(0, Math.min(len, max.length));
    if (target.slice(0, maxPrefix.length) > maxPrefix) return true;
  }
  return false;
}

export function sanitizeTimeText(text: string, withSeconds = false): string {
  return text.replace(/[^\d:. ]/g, '').slice(0, withSeconds ? 8 : 5);
}

/** `H:mm` / `HH:mm` (or `HH:mm:ss` when `withSeconds` is true or `'second'`), separators `:` `.` or space. */
export function parseTimeText(text: string, withSeconds: boolean | TimePrecision = false): TextParse {
  const sec = withSeconds === true || withSeconds === 'second';
  const trimmed = text.trim();
  if (trimmed === '') return { status: 'empty' };
  if (sec) {
    const matchSec = /^(\d{1,2})[:. ](\d{2})(?:[:. ](\d{2}))?$/.exec(trimmed);
    if (!matchSec) return { status: 'draft' };
    const hour = Number(matchSec[1]), minute = Number(matchSec[2]), second = Number(matchSec[3] ?? '0');
    if (hour > 23 || minute > 59 || second > 59) return { status: 'draft' };
    return { status: 'valid', value: `${pad(hour)}:${pad(minute)}:${pad(second)}` };
  }
  const match = /^(\d{1,2})[:. ](\d{2})$/.exec(trimmed);
  if (!match) return { status: 'draft' };
  const hour = Number(match[1]), minute = Number(match[2]);
  if (hour > 23 || minute > 59) return { status: 'draft' };
  return { status: 'valid', value: `${pad(hour)}:${pad(minute)}` };
}

/** `HH:mm` or `HH:mm:ss` when `withSeconds` is true or `'second'`, or empty. */
export function formatTime(value: string | null | undefined, withSeconds: boolean | TimePrecision = false): string {
  const sec = withSeconds === true || withSeconds === 'second';
  if (!value) return '';
  if (sec) {
    const matchSec = /^(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
    if (!matchSec) return '';
    return `${matchSec[1]}:${matchSec[2]}:${matchSec[3] ?? '00'}`;
  }
  return /^\d{2}:\d{2}/.exec(value)?.[0] ?? '';
}

/**
 * Datetime values are UTC instants (ISO-8601 with Z); the user sees and types the device's local
 * date and wall-clock time. Both halves are needed: one alone is no instant (null).
 */
export function joinDateTime(date: string | null, time: string | null): string | null {
  if (!date || !time) return null;
  return localDateTimeToUtcIso(`${date}T${time}`);
}

/** Local date and time of a UTC instant. A legacy zone-less value is read as local wall-clock time. */
export function splitDateTime(value: string | null | undefined, withSeconds = false): { date: string | null; time: string | null } {
  const local = toLocalDateTimeInputValue(value, withSeconds ? 'second' : 'minute');
  if (!local) return { date: null, time: null };
  const [datePart, timePart] = local.split('T');
  return {
    date: datePart ?? null,
    time: timePart ? formatTime(timePart, withSeconds) : null,
  };
}

/** Same instant, whatever the spelling (…:00Z vs …:00.000Z vs an offset). */
export function sameInstant(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return !a && !b;
  return Date.parse(a) === Date.parse(b);
}

/**
 * Resolves the displayed string for `EmrTypedText` (date or time).
 * - `!editable`: always reverts to the accepted `value` prop.
 * - `!focused`: if `draft` parsed to a valid/empty value (or out-of-bounds value), snaps to accepted `value` prop
 *   so controller-rejected values never stay stuck on screen; incomplete drafts stay visible with invalid styling.
 */
export function resolveControlledTemporalDraft(params: {
  draft: string;
  value: string | null;
  mode: DateDisplayFormat | 'time' | 'time-seconds';
  focused: boolean;
  editable: boolean;
  min?: string;
  max?: string;
}): string {
  if (params.mode === 'time' || params.mode === 'time-seconds') {
    const withSec = params.mode === 'time-seconds';
    const formattedTime = formatTime(params.value, withSec);
    if (!params.editable) return formattedTime;
    if (params.focused) return params.draft;
    const parsedTime = parseTimeText(params.draft, withSec);
    return parsedTime.status === 'draft' ? params.draft : formattedTime;
  }
  const formattedDate = formatDate(params.value, params.mode);
  if (!params.editable) return formattedDate;
  if (params.focused) return params.draft;
  const parsedDate = parseDateText(params.draft, params.mode);
  return parsedDate.status === 'draft' ? params.draft : formattedDate;
}

/**
 * Resolves `{ date, time }` parts for `EmrDateTimeText`.
 * - `!editable`: discards any half-typed draft and snaps back to `splitDateTime(value)`.
 * - `!focused`: when both halves are present or both are null (i.e. not half-typed), snaps back to `splitDateTime(value)`
 *   so rejected datetime edits never remain stuck on screen.
 */
export function resolveControlledDateTimeParts(params: {
  parts: { date: string | null; time: string | null };
  value: string | null;
  withSeconds: boolean;
  focused: boolean;
  editable: boolean;
}): { date: string | null; time: string | null } {
  const external = splitDateTime(params.value, params.withSeconds);
  if (!params.editable) return external;
  const halfTyped = (params.parts.date !== null) !== (params.parts.time !== null);
  if (!params.focused && !halfTyped) return external;
  return params.parts;
}

// ---- pure L1 calendar grid mechanics -------------------------------------------------------

export const CALENDAR_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const CALENDAR_MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const CALENDAR_WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;

export interface CalendarDayCell {
  readonly iso: string;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly inMonth: boolean;
  readonly isSelected: boolean;
  readonly isToday: boolean;
  readonly isDisabled: boolean;
  readonly ariaLabel: string;
}

/** Extracts numeric `{ year, month, day }` from ISO `YYYY-MM-DD`, `YYYY-MM`, or `YYYY`. */
export function parseIsoParts(iso: string | null | undefined): { year: number; month: number; day: number } | null {
  if (!iso) return null;
  const full = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (full) {
    const year = Number(full[1]), month = Number(full[2]), day = Number(full[3]);
    if (year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysIn(year, month)) {
      return { year, month, day };
    }
    return null;
  }
  const ym = /^(\d{4})-(\d{2})$/.exec(iso);
  if (ym) {
    const year = Number(ym[1]), month = Number(ym[2]);
    if (year >= 1 && month >= 1 && month <= 12) return { year, month, day: 1 };
    return null;
  }
  const yOnly = /^(\d{4})$/.exec(iso);
  if (yOnly) {
    const year = Number(yOnly[1]);
    if (year >= 1) return { year, month: 1, day: 1 };
  }
  return null;
}

/** Local wall-clock today in ISO parts (`YYYY-MM-DD`, `YYYY-MM`, `YYYY`). */
export function todayCalendarParts(now = new Date()): {
  year: number;
  month: number;
  day: number;
  isoDay: string;
  isoMonth: string;
  isoYear: string;
} {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const isoYear = pad(year, 4);
  const isoMonth = `${isoYear}-${pad(month)}`;
  const isoDay = `${isoMonth}-${pad(day)}`;
  return { year, month, day, isoDay, isoMonth, isoYear };
}

/** Steps `(year, month)` by `deltaMonths` (positive or negative) across year boundaries. */
export function stepCalendarMonth(year: number, month: number, deltaMonths: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + deltaMonths;
  const nextYear = Math.max(1, Math.floor(total / 12));
  const nextMonth = (((total % 12) + 12) % 12) + 1;
  return { year: nextYear, month: nextMonth };
}

/** Builds a fixed 42-cell (6 × 7, Monday-first) Gregorian month grid for consistent popover height. */
export function buildCalendarMonthGrid(
  year: number,
  month: number,
  selectedIso: string | null | undefined,
  todayIsoStr: string,
  minIso?: string,
  maxIso?: string,
): readonly CalendarDayCell[] {
  // JS getDay(): 0 = Sunday .. 6 = Saturday -> Monday-first offset 0..6
  const firstDow = new Date(year, month - 1, 1).getDay();
  const leading = (firstDow + 6) % 7;
  const prev = stepCalendarMonth(year, month, -1);
  const next = stepCalendarMonth(year, month, 1);
  const prevDays = daysIn(prev.year, prev.month);
  const currDays = daysIn(year, month);

  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < 42; i++) {
    let cellY = year;
    let cellM = month;
    let cellD: number;
    let inMonth = true;

    if (i < leading) {
      cellY = prev.year;
      cellM = prev.month;
      cellD = prevDays - leading + 1 + i;
      inMonth = false;
    } else if (i < leading + currDays) {
      cellD = i - leading + 1;
    } else {
      cellY = next.year;
      cellM = next.month;
      cellD = i - (leading + currDays) + 1;
      inMonth = false;
    }

    const iso = `${pad(cellY, 4)}-${pad(cellM)}-${pad(cellD)}`;
    const monthLabel = CALENDAR_MONTH_NAMES[cellM - 1] ?? '';
    cells.push({
      iso,
      year: cellY,
      month: cellM,
      day: cellD,
      inMonth,
      isSelected: Boolean(selectedIso && selectedIso === iso),
      isToday: iso === todayIsoStr,
      isDisabled: isIsoDateOutOfBounds(iso, minIso, maxIso, 'day'),
      ariaLabel: `${cellD} ${monthLabel} ${cellY}`,
    });
  }
  return cells;
}

/** Returns a stable 12-year block (e.g. 2020–2031) containing `year`. */
export function buildYearPage(year: number): { startYear: number; endYear: number; years: readonly number[] } {
  const offset = ((year - 2020) % 12 + 12) % 12;
  const startYear = Math.max(1, year - offset);
  const years: number[] = [];
  for (let i = 0; i < 12; i++) years.push(startYear + i);
  return { startYear, endYear: startYear + 11, years };
}
