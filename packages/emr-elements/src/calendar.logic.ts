/**
 * Pure L1 calendar grid, date text parse/format, and anchored popover geometry for `@drguptavivek/emr-elements`.
 * Zero clinical rules — pure Gregorian calendar and UI mechanics.
 */

export type LitDateDisplayFormat = 'yyyy-mm-dd' | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'yyyy-mm' | 'mm-yyyy' | 'yyyy';
export type LitDatePrecision = 'day' | 'month' | 'year';
export type LitDateParse = { status: 'empty' } | { status: 'valid'; value: string } | { status: 'draft' };

export const LIT_CALENDAR_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const LIT_CALENDAR_MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const LIT_CALENDAR_WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;

export interface LitCalendarDayCell {
  readonly iso: string;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly inMonth: boolean;
  readonly isSelected: boolean;
  readonly isToday: boolean;
  readonly ariaLabel: string;
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

function daysIn(year: number, month: number): number {
  if (month === 2) return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function resolveLitDateFormat(
  baseFormat: LitDateDisplayFormat = 'yyyy-mm-dd',
  precision: LitDatePrecision = 'day',
): LitDateDisplayFormat {
  if (baseFormat === 'yyyy' || precision === 'year') return 'yyyy';
  if (baseFormat === 'yyyy-mm' || baseFormat === 'mm-yyyy') return baseFormat;
  if (precision === 'month') return baseFormat === 'yyyy-mm-dd' ? 'yyyy-mm' : 'mm-yyyy';
  return baseFormat;
}

export function sanitizeLitDateText(text: string, format: LitDateDisplayFormat = 'yyyy-mm-dd'): string {
  const maxLen = format === 'yyyy' ? 4 : format === 'yyyy-mm' || format === 'mm-yyyy' ? 7 : 10;
  return text.replace(/[^\d\-/. ]/g, '').slice(0, maxLen);
}

export function parseLitDateText(
  text: string,
  baseFormat: LitDateDisplayFormat = 'yyyy-mm-dd',
  precision: LitDatePrecision = 'day',
): LitDateParse {
  const format = resolveLitDateFormat(baseFormat, precision);
  const trimmed = text.trim();
  if (trimmed === '') return { status: 'empty' };

  if (format === 'yyyy') {
    if (!/^\d{4}$/.test(trimmed)) return { status: 'draft' };
    const year = Number(trimmed);
    if (year < 1) return { status: 'draft' };
    return { status: 'valid', value: pad(year, 4) };
  }

  if (format === 'yyyy-mm' || format === 'mm-yyyy') {
    // Also accept canonical ISO YYYY-MM regardless of displayFormat
    const isoMatch = /^(\d{4})-(\d{2})$/.exec(trimmed);
    if (isoMatch) {
      const y = Number(isoMatch[1]), m = Number(isoMatch[2]);
      if (y >= 1 && m >= 1 && m <= 12) return { status: 'valid', value: `${pad(y, 4)}-${pad(m)}` };
      return { status: 'draft' };
    }
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

  // Always accept canonical ISO YYYY-MM-DD even when displayFormat is dd-mm-yyyy
  const canonicalIso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (canonicalIso) {
    const year = Number(canonicalIso[1]), month = Number(canonicalIso[2]), day = Number(canonicalIso[3]);
    if (year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysIn(year, month)) {
      return { status: 'valid', value: `${pad(year, 4)}-${pad(month)}-${pad(day)}` };
    }
    return { status: 'draft' };
  }

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

export function formatLitDate(
  iso: string | null | undefined,
  baseFormat: LitDateDisplayFormat = 'yyyy-mm-dd',
  precision: LitDatePrecision = 'day',
): string {
  const format = resolveLitDateFormat(baseFormat, precision);
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

export function parseLitIsoParts(iso: string | null | undefined): { year: number; month: number; day: number } | null {
  if (!iso) return null;
  const full = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (full) {
    const year = Number(full[1]), month = Number(full[2]), day = Number(full[3]);
    if (year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysIn(year, month)) return { year, month, day };
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

export function todayLitCalendarParts(now = new Date()): {
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

export function stepLitCalendarMonth(year: number, month: number, deltaMonths: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + deltaMonths;
  const nextYear = Math.max(1, Math.floor(total / 12));
  const nextMonth = (((total % 12) + 12) % 12) + 1;
  return { year: nextYear, month: nextMonth };
}

export function buildLitCalendarMonthGrid(
  year: number,
  month: number,
  selectedIso: string | null | undefined,
  todayIsoStr: string,
): readonly LitCalendarDayCell[] {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const leading = (firstDow + 6) % 7;
  const prev = stepLitCalendarMonth(year, month, -1);
  const next = stepLitCalendarMonth(year, month, 1);
  const prevDays = daysIn(prev.year, prev.month);
  const currDays = daysIn(year, month);

  const cells: LitCalendarDayCell[] = [];
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
    const monthLabel = LIT_CALENDAR_MONTH_NAMES[cellM - 1] ?? '';
    cells.push({
      iso,
      year: cellY,
      month: cellM,
      day: cellD,
      inMonth,
      isSelected: Boolean(selectedIso && selectedIso === iso),
      isToday: iso === todayIsoStr,
      ariaLabel: `${cellD} ${monthLabel} ${cellY}`,
    });
  }
  return cells;
}

export function buildLitYearPage(year: number): { startYear: number; endYear: number; years: readonly number[] } {
  const offset = ((year - 2020) % 12 + 12) % 12;
  const startYear = Math.max(1, year - offset);
  const years: number[] = [];
  for (let i = 0; i < 12; i++) years.push(startYear + i);
  return { startYear, endYear: startYear + 11, years };
}

/** Computes viewport-clamped `position: fixed` coordinates for dropdowns & calendar popovers, with jsdom fallback. */
export function computeFixedPopoverStyle(
  anchorEl: HTMLElement | null | undefined,
  desiredWidth: number,
  estimatedHeight: number,
  matchAnchorWidth = false,
): string {
  if (!anchorEl || typeof anchorEl.getBoundingClientRect !== 'function') {
    return `position: absolute; top: calc(100% + 4px); left: 0; width: ${desiredWidth}px;`;
  }
  const rect = anchorEl.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    // Non-layout environment (e.g. jsdom)
    return `position: absolute; top: calc(100% + 4px); left: 0; width: ${desiredWidth}px;`;
  }
  const vw = typeof window !== 'undefined' ? window.innerWidth || 1280 : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight || 800 : 800;
  const width = Math.min(
    matchAnchorWidth ? Math.max(rect.width, desiredWidth) : desiredWidth,
    Math.max(200, vw - 24),
  );
  const left = Math.max(12, Math.min(rect.left, vw - width - 12));
  const flipUp = rect.bottom + estimatedHeight + 12 > vh && rect.top > estimatedHeight;
  const top = flipUp ? Math.max(12, rect.top - estimatedHeight - 6) : rect.bottom + 6;
  return `position: fixed; top: ${Math.round(top)}px; left: ${Math.round(left)}px; width: ${Math.round(width)}px;`;
}
