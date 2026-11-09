/** Pure parse/format for the typed date and time inputs. Wire values are ISO; display order is a prop. */

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
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi, s = 0] = time.split(':').map(Number);
  return new Date(y!, mo! - 1, d!, h!, mi!, s).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Local date and time of a UTC instant. A legacy zone-less value is read as local wall-clock time. */
export function splitDateTime(value: string | null | undefined, withSeconds = false): { date: string | null; time: string | null } {
  if (!value) return { date: null, time: null };
  const zoned = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
  if (!zoned) {
    const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2})?)/.exec(value);
    if (!match) return { date: null, time: null };
    return {
      date: match[1] ?? null,
      time: withSeconds ? formatTime(match[2], true) : formatTime(match[2], false),
    };
  }
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return { date: null, time: null };
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const hhmm = `${pad2(at.getHours())}:${pad2(at.getMinutes())}`;
  return {
    date: `${String(at.getFullYear()).padStart(4, '0')}-${pad2(at.getMonth() + 1)}-${pad2(at.getDate())}`,
    time: withSeconds ? `${hhmm}:${pad2(at.getSeconds())}` : hhmm,
  };
}

/** Same instant, whatever the spelling (…:00Z vs …:00.000Z vs an offset). */
export function sameInstant(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return !a && !b;
  return Date.parse(a) === Date.parse(b);
}
