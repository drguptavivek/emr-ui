/**
 * Pure mechanical helpers for L1 primitive inputs.
 * Zero runtime imports from @drguptavivek/emr-controller so SSR bundles remain 100% type-only.
 */

const pad2 = (n: number): string => String(n).padStart(2, '0');
const pad4 = (n: number): string => String(n).padStart(4, '0');

/**
 * Normalizes an empty string to `null` so "not entered" is never conflated with `""`.
 */
export function emptyToNull(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  return raw;
}

/**
 * Normalizes either a UTC/offset ISO-8601 instant (`'2026-10-14T09:30:00Z'`) or a
 * zone-less local datetime string (`'2026-10-14T15:00'`) into the local wall-clock
 * `'YYYY-MM-DDTHH:mm'` (or `'YYYY-MM-DDTHH:mm:ss'`) string expected by native
 * `datetime-local` controls. Never shifts UTC by stripping `'Z'`.
 */
export function toLocalDateTimeInputValue(
  value: string | null | undefined,
  precision: 'minute' | 'second' = 'minute',
): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const zoned = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  if (!zoned) {
    const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(trimmed);
    if (!m) return '';
    return precision === 'second'
      ? `${m[1]}T${m[2]}:${m[3]}:${m[4] ?? '00'}`
      : `${m[1]}T${m[2]}:${m[3]}`;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return '';
  const datePart = `${pad4(parsed.getFullYear())}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
  const hm = `${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`;
  return precision === 'second'
    ? `${datePart}T${hm}:${pad2(parsed.getSeconds())}`
    : `${datePart}T${hm}`;
}

/**
 * Converts a local wall-clock datetime (`'YYYY-MM-DDTHH:mm'` or `'YYYY-MM-DDTHH:mm:ss'`)
 * into the canonical UTC ISO-8601 wire string (`'YYYY-MM-DDTHH:mm:ssZ'`), or `null` when empty/invalid.
 */
export function localDateTimeToUtcIso(localValue: string | null | undefined): string | null {
  if (!localValue) return null;
  const trimmed = localValue.trim();
  if (!trimmed) return null;
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(trimmed);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const second = Number(m[6] ?? '0');
  const instant = new Date(year, month - 1, day, hour, minute, second);
  if (Number.isNaN(instant.getTime())) return null;
  return instant.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Formats an emitted `datetime-local` value according to `wireFormat` and `precision`.
 */
export function formatDateTimeEmission(
  rawLocalValue: string | null | undefined,
  wireFormat: 'utc' | 'local' = 'utc',
  precision: 'minute' | 'second' = 'minute',
): string | null {
  if (!rawLocalValue) return null;
  const trimmed = rawLocalValue.trim();
  if (!trimmed) return null;
  if (wireFormat === 'utc') {
    return localDateTimeToUtcIso(trimmed);
  }
  const normalized = toLocalDateTimeInputValue(trimmed, precision);
  return normalized || null;
}

/**
 * Projects an ISO partial/full date (`'YYYY-MM-DD'`, `'YYYY-MM'`, `'YYYY'`) into the native input's value.
 */
export function toDateInputDomValue(
  value: string | null | undefined,
  precision: 'day' | 'month' | 'year' = 'day',
): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (precision === 'year') {
    const m = /^(\d{4})/.exec(trimmed);
    return m ? m[1] : '';
  }
  if (precision === 'month') {
    const m = /^(\d{4}-\d{2})/.exec(trimmed);
    return m ? m[1] : '';
  }
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  return m ? m[1] : '';
}

/**
 * Parses a raw DOM value from a date/month/year input into `'YYYY-MM-DD'`, `'YYYY-MM'`, `'YYYY'`,
 * `null` (when cleared), or `undefined` (when mid-typing an incomplete year draft).
 */
export function parseDateInputDomValue(
  raw: string,
  precision: 'day' | 'month' | 'year' = 'day',
): string | null | undefined {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  if (precision === 'year') {
    if (!/^\d{4}$/.test(trimmed)) return undefined;
    const year = Number(trimmed);
    if (year < 1 || year > 9999) return undefined;
    return pad4(year);
  }
  if (precision === 'month') {
    return /^\d{4}-\d{2}$/.test(trimmed) ? trimmed : undefined;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : undefined;
}

/**
 * Projects a date `min`/`max` constraint to match the active `precision`.
 */
export function toDateBoundDomValue(
  bound: string | null | undefined,
  precision: 'day' | 'month' | 'year' = 'day',
): string | null {
  const formatted = toDateInputDomValue(bound, precision);
  return formatted || null;
}

export interface StepNumberOptions {
  readonly step?: number;
  readonly min?: number;
  readonly max?: number;
  readonly mode?: 'decimal' | 'integer';
  readonly precision?: number;
}

export function resolveQuantityStep(options: {
  readonly mode?: 'decimal' | 'integer';
  readonly precision?: number;
  readonly step?: number;
} = {}): number {
  const { mode = 'decimal', precision, step } = options;
  if (typeof step === 'number' && Number.isFinite(step) && step > 0) {
    return mode === 'integer' ? Math.max(1, Math.round(step)) : step;
  }
  if (mode === 'integer' || precision === 0) return 1;
  if (typeof precision === 'number' && Number.isFinite(precision) && precision > 0) {
    return Number((10 ** -Math.min(10, Math.floor(precision))).toFixed(Math.min(10, Math.floor(precision))));
  }
  return 1;
}

export function sanitizeQuantityText(
  raw: string,
  mode: 'decimal' | 'integer',
  options?: { readonly allowNegative?: boolean },
): string {
  const allowNegative = options?.allowNegative ?? true;
  const noSpaces = raw.replace(/[\s\u00A0\u202F]+/g, '');
  const normalized =
    mode === 'decimal' && !noSpaces.includes('.') && noSpaces.includes(',')
      ? noSpaces.replace(',', '.')
      : noSpaces;
  let out = '';
  let seenDot = false;
  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (ch >= '0' && ch <= '9') {
      out += ch;
    } else if (ch === '-' && allowNegative && out.length === 0) {
      out += ch;
    } else if (ch === '.' && mode === 'decimal' && !seenDot) {
      out += ch;
      seenDot = true;
    }
  }
  return out;
}

export function parseQuantityDraft(
  raw: string,
  mode: 'decimal' | 'integer',
  options?: { readonly allowNegative?: boolean },
): number | null | 'incomplete' {
  const clean = sanitizeQuantityText(raw.trim(), mode, options);
  if (clean === '') return null;
  if (clean === '-' || clean === '.' || clean === '-.') return 'incomplete';
  if (mode === 'decimal' && clean.endsWith('.')) return 'incomplete';
  const n = Number(clean);
  if (!Number.isFinite(n)) return 'incomplete';
  return mode === 'integer' ? Math.trunc(n) : n;
}

/**
 * Computes the next stepped numeric value with floating-point drift protection and min/max clamping.
 */
export function stepNumberValue(
  current: number | null | undefined,
  direction: -1 | 1,
  options: StepNumberOptions = {},
): number {
  const isInteger = options.mode === 'integer' || options.precision === 0;
  const effectiveStep = resolveQuantityStep(options);
  const base =
    current !== null && current !== undefined && Number.isFinite(current)
      ? current
      : direction > 0
        ? (options.min ?? 0) - effectiveStep
        : (options.max ?? 0) + effectiveStep;

  const stepDecimals = (() => {
    if (options.precision !== undefined && options.precision >= 0) return options.precision;
    const text = String(effectiveStep);
    const dot = text.indexOf('.');
    return dot >= 0 ? Math.min(6, text.length - dot - 1) : 0;
  })();

  let next = Number((base + direction * effectiveStep).toFixed(Math.max(stepDecimals, 4)));
  if (isInteger) {
    next = Math.round(next);
  } else if (options.precision !== undefined && options.precision >= 0) {
    next = Number(next.toFixed(options.precision));
  } else {
    next = Number(next.toFixed(Math.max(stepDecimals, 4)));
  }

  if (options.min !== undefined && next < options.min) next = options.min;
  if (options.max !== undefined && next > options.max) next = options.max;
  return Object.is(next, -0) ? 0 : next;
}

/**
 * Mechanically derives up to 2 uppercase initials from a display name when explicit `initials` are omitted.
 */
export function deriveAvatarInitials(name: string, explicitInitials?: string): string {
  if (explicitInitials && explicitInitials.trim()) {
    return explicitInitials.trim().slice(0, 3).toUpperCase();
  }
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function sanitizeTimeText(raw: string, hourCycle: '24' | '12' = '24'): string {
  return hourCycle === '12' ? raw.replace(/[^\d:. aApPmM]/g, '') : raw.replace(/[^\d:. ]/g, '');
}

export function parseTimeText(
  raw: string,
  options: { readonly precision?: 'minute' | 'second'; readonly hourCycle?: '24' | '12' } = {},
): { readonly kind: 'empty' } | { readonly kind: 'valid'; readonly value: string } | { readonly kind: 'draft' } {
  const { precision = 'minute', hourCycle = '24' } = options;
  const trimmed = raw.trim();
  if (!trimmed) return { kind: 'empty' };

  const m12 = trimmed.match(/^(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([aApP]\.?[mM]\.?)$/);
  if (m12) {
    let hh = Number(m12[1]);
    const mm = Number(m12[2]);
    const ss = m12[3] !== undefined ? Number(m12[3]) : 0;
    const isPm = m12[4]!.toLowerCase().startsWith('p');
    if (hh < 1 || hh > 12 || mm > 59 || ss > 59) return { kind: 'draft' };
    if (hh === 12) hh = isPm ? 12 : 0;
    else if (isPm) hh += 12;
    const base = `${pad2(hh)}:${pad2(mm)}`;
    return { kind: 'valid', value: precision === 'second' ? `${base}:${pad2(ss)}` : base };
  }

  if (hourCycle === '12') return { kind: 'draft' };

  const m24 = trimmed.match(/^(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?$/);
  if (!m24) return { kind: 'draft' };
  const hh = Number(m24[1]);
  const mm = Number(m24[2]);
  const ss = m24[3] !== undefined ? Number(m24[3]) : 0;
  if (hh > 23 || mm > 59 || ss > 59) return { kind: 'draft' };
  if (precision === 'second' && m24[3] === undefined) {
    return { kind: 'valid', value: `${pad2(hh)}:${pad2(mm)}:00` };
  }
  const base = `${pad2(hh)}:${pad2(mm)}`;
  return { kind: 'valid', value: precision === 'second' ? `${base}:${pad2(ss)}` : base };
}

export function formatTimeDisplay(
  value: string | null | undefined,
  options: { readonly precision?: 'minute' | 'second'; readonly hourCycle?: '24' | '12' } = {},
): string {
  const { precision = 'minute', hourCycle = '24' } = options;
  if (!value) return '';
  const m = value.trim().match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return value;
  const hh24 = Number(m[1]);
  const mm = m[2]!;
  const ss = m[3] ?? '00';
  if (hourCycle === '12') {
    const period = hh24 >= 12 ? 'PM' : 'AM';
    const hh12 = hh24 % 12 === 0 ? 12 : hh24 % 12;
    const base = `${pad2(hh12)}:${mm}`;
    return precision === 'second' ? `${base}:${ss} ${period}` : `${base} ${period}`;
  }
  const base = `${pad2(hh24)}:${mm}`;
  return precision === 'second' ? `${base}:${ss}` : base;
}

export function isTimeOutOfBounds(value: string | null | undefined, min?: string, max?: string): boolean {
  const norm = (v?: string | null) => {
    if (!v) return null;
    const m = v.trim().match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    return m ? `${m[1]}:${m[2]}:${m[3] ?? '00'}` : null;
  };
  const nVal = norm(value);
  if (!nVal) return false;
  const nMin = norm(min);
  const nMax = norm(max);
  if (nMin && nVal < nMin) return true;
  if (nMax && nVal > nMax) return true;
  return false;
}

export function resolveTimePlaceholder(
  precision: 'minute' | 'second' = 'minute',
  hourCycle: '24' | '12' = '24',
  explicit?: string,
): string {
  if (explicit && explicit.trim()) return explicit;
  if (hourCycle === '12') return precision === 'second' ? 'hh:mm:ss AM' : 'hh:mm AM';
  return precision === 'second' ? 'hh:mm:ss' : 'hh:mm';
}

function isValidYmdUi(y: number, m: number, d: number): boolean {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (y < 1 || y > 9999 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function sanitizeDateDisplayText(
  raw: string,
  format: 'dd-mm-yyyy' | 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'mm/dd/yyyy' = 'dd-mm-yyyy',
): string {
  const sep = format.includes('/') ? '/' : '-';
  return raw.replace(/[^\d/-]/g, '').replace(/[/-]/g, sep);
}

export function formatIsoDateDisplay(
  isoDate: string | null | undefined,
  format: 'dd-mm-yyyy' | 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'mm/dd/yyyy' = 'dd-mm-yyyy',
): string {
  if (!isoDate) return '';
  const m = isoDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  const [, yyyy, mm, dd] = m;
  if (format === 'dd/mm/yyyy') return `${dd}/${mm}/${yyyy}`;
  if (format === 'mm/dd/yyyy') return `${mm}/${dd}/${yyyy}`;
  if (format === 'yyyy-mm-dd') return `${yyyy}-${mm}-${dd}`;
  return `${dd}-${mm}-${yyyy}`;
}

export function parseDateDisplayText(
  raw: string,
  format: 'dd-mm-yyyy' | 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'mm/dd/yyyy' = 'dd-mm-yyyy',
): { readonly kind: 'empty' } | { readonly kind: 'valid'; readonly value: string } | { readonly kind: 'draft' } {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: 'empty' };
  const parts = trimmed.split(/[/-]/);
  if (parts.length !== 3 || parts.some((p) => !/^\d+$/.test(p))) return { kind: 'draft' };
  let y: number;
  let m: number;
  let d: number;
  if (format === 'yyyy-mm-dd') {
    if (parts[0]!.length !== 4) return { kind: 'draft' };
    y = Number(parts[0]);
    m = Number(parts[1]);
    d = Number(parts[2]);
  } else if (format === 'mm/dd/yyyy') {
    if (parts[2]!.length !== 4) return { kind: 'draft' };
    m = Number(parts[0]);
    d = Number(parts[1]);
    y = Number(parts[2]);
  } else {
    if (parts[2]!.length !== 4) return { kind: 'draft' };
    d = Number(parts[0]);
    m = Number(parts[1]);
    y = Number(parts[2]);
  }
  if (!isValidYmdUi(y, m, d)) return { kind: 'draft' };
  return { kind: 'valid', value: `${pad4(y)}-${pad2(m)}-${pad2(d)}` };
}

export function splitDateTimeParts(
  value: string | null | undefined,
  timePrecision: 'minute' | 'second' = 'minute',
): { readonly date: string | null; readonly time: string | null } {
  if (!value) return { date: null, time: null };
  const local = toLocalDateTimeInputValue(value, timePrecision);
  if (!local) return { date: null, time: null };
  const [date, time] = local.split('T');
  return { date: date ?? null, time: time ?? null };
}

export function joinDateTimeParts(
  dateIso: string | null | undefined,
  time24: string | null | undefined,
  wireFormat: 'utc' | 'local' = 'utc',
  timePrecision: 'minute' | 'second' = 'minute',
): string | null {
  if (!dateIso || !time24) return null;
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso.trim());
  const tm = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time24.trim());
  if (!dm || !tm) return null;
  const sec = tm[3] ?? '00';
  const local =
    timePrecision === 'second'
      ? `${dm[1]}-${dm[2]}-${dm[3]}T${tm[1]}:${tm[2]}:${sec}`
      : `${dm[1]}-${dm[2]}-${dm[3]}T${tm[1]}:${tm[2]}`;
  return wireFormat === 'local' ? local : localDateTimeToUtcIso(local);
}

export function isDateTimeOutOfBounds(
  value: string | null | undefined,
  min?: string,
  max?: string,
  wireFormat: 'utc' | 'local' = 'utc',
): boolean {
  if (!value || (!min && !max)) return false;
  if (wireFormat === 'utc') {
    const t = Date.parse(value);
    if (Number.isNaN(t)) return false;
    if (min) {
      const tMin = Date.parse(min);
      if (!Number.isNaN(tMin) && t < tMin) return true;
    }
    if (max) {
      const tMax = Date.parse(max);
      if (!Number.isNaN(tMax) && t > tMax) return true;
    }
    return false;
  }
  const norm = (v?: string) => {
    if (!v) return null;
    const m = v.trim().match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    return m ? `${m[1]}T${m[2]}:${m[3]}:${m[4] ?? '00'}` : null;
  };
  const nVal = norm(value);
  if (!nVal) return false;
  const nMin = norm(min);
  const nMax = norm(max);
  if (nMin && nVal < nMin) return true;
  if (nMax && nVal > nMax) return true;
  return false;
}

// ── Shared Calendar & Time Popover Pure Helpers (Angular UI) ──

export const EMR_UI_CALENDAR_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const EMR_UI_CALENDAR_MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const EMR_UI_CALENDAR_WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
export const EMR_UI_HOURS_24: readonly number[] = Array.from({ length: 24 }, (_, i) => i);
export const EMR_UI_HOURS_12: readonly number[] = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
export const EMR_UI_MINUTES_60: readonly number[] = Array.from({ length: 60 }, (_, i) => i);

export interface EmrUiCalendarDayCell {
  readonly iso: string;
  readonly day: number;
  readonly inMonth: boolean;
  readonly isSelected: boolean;
  readonly isToday: boolean;
  readonly ariaLabel: string;
}

function daysInMonthUi(year: number, month: number): number {
  if (month === 2) return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function todayUiCalendarParts(): { year: number; month: number; day: number; isoDay: string; isoMonth: string; isoYear: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return {
    year: y,
    month: m,
    day: d,
    isoDay: `${pad4(y)}-${pad2(m)}-${pad2(d)}`,
    isoMonth: `${pad4(y)}-${pad2(m)}`,
    isoYear: pad4(y),
  };
}

export function parseUiIsoParts(iso: string | null | undefined): { year: number; month?: number; day?: number } | null {
  if (!iso) return null;
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(iso.trim());
  if (!m) return null;
  return {
    year: Number(m[1]),
    month: m[2] ? Number(m[2]) : undefined,
    day: m[3] ? Number(m[3]) : undefined,
  };
}

export function stepUiCalendarMonth(year: number, month: number, delta: -1 | 1): { year: number; month: number } {
  let y = year;
  let m = month + delta;
  if (m < 1) {
    m = 12;
    y = Math.max(1, y - 1);
  } else if (m > 12) {
    m = 1;
    y += 1;
  }
  return { year: y, month: m };
}

export function buildUiYearPage(centerYear: number): { startYear: number; endYear: number; years: readonly number[] } {
  const base = Math.max(1, Math.floor((centerYear - 1) / 12) * 12 + 1);
  return {
    startYear: base,
    endYear: base + 11,
    years: Array.from({ length: 12 }, (_, i) => base + i),
  };
}

export function buildUiCalendarMonthGrid(
  viewYear: number,
  viewMonth: number,
  selectedIso: string | null | undefined,
  todayIso: string,
): readonly EmrUiCalendarDayCell[] {
  const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay();
  const leading = (firstDow + 6) % 7;
  const prev = stepUiCalendarMonth(viewYear, viewMonth, -1);
  const prevDays = daysInMonthUi(prev.year, prev.month);
  const curDays = daysInMonthUi(viewYear, viewMonth);
  const next = stepUiCalendarMonth(viewYear, viewMonth, 1);

  const cells: EmrUiCalendarDayCell[] = [];
  for (let i = 0; i < 42; i++) {
    let y = viewYear;
    let m = viewMonth;
    let d = 1;
    let inMonth = true;
    if (i < leading) {
      y = prev.year;
      m = prev.month;
      d = prevDays - (leading - 1 - i);
      inMonth = false;
    } else if (i >= leading + curDays) {
      y = next.year;
      m = next.month;
      d = i - (leading + curDays) + 1;
      inMonth = false;
    } else {
      d = i - leading + 1;
    }
    const iso = `${pad4(y)}-${pad2(m)}-${pad2(d)}`;
    cells.push({
      iso,
      day: d,
      inMonth,
      isSelected: selectedIso === iso,
      isToday: todayIso === iso,
      ariaLabel: `${d} ${EMR_UI_CALENDAR_MONTH_NAMES[m - 1]} ${y}`,
    });
  }
  return cells;
}

export function extractUiTimeParts(value: string | null | undefined): { hour: number; minute: number; second: number } {
  const m = value ? /^(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value) : null;
  if (m) {
    return {
      hour: Math.min(23, Math.max(0, Number(m[1]))),
      minute: Math.min(59, Math.max(0, Number(m[2]))),
      second: Math.min(59, Math.max(0, Number(m[3] ?? '0'))),
    };
  }
  const now = new Date();
  return { hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds() };
}

export function formatUiTime24(
  hour: number,
  minute: number,
  second: number,
  precision: 'minute' | 'second' = 'minute',
): string {
  return precision === 'second'
    ? `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`
    : `${pad2(hour)}:${pad2(minute)}`;
}

export function nowUiTime24(precision: 'minute' | 'second' = 'minute'): string {
  const now = new Date();
  return formatUiTime24(now.getHours(), now.getMinutes(), now.getSeconds(), precision);
}
