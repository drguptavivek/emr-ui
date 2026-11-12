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

/**
 * Computes the next stepped numeric value with floating-point drift protection and min/max clamping.
 */
export function stepNumberValue(
  current: number | null | undefined,
  direction: -1 | 1,
  options: StepNumberOptions = {},
): number {
  const isInteger = options.mode === 'integer' || options.precision === 0;
  const rawStep = options.step !== undefined && options.step > 0 ? options.step : isInteger ? 1 : 1;
  const effectiveStep = isInteger ? Math.max(1, Math.round(rawStep)) : rawStep;
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
