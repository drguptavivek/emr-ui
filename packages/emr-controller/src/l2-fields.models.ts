import type { ClinicalAssessmentStatus, ClinicalOption, EmrBadge, EmrTone } from './models.js';
import type { ClinicalAssessmentStatusOption } from './clinical-form.models.js';
import type { EmrFieldDefinition, EmrPartialDate } from './field-contract.models.js';
import {
  resolveQuantityStep,
  type EmrDateTimeDisplayFormat,
  type EmrDateTimeWireFormat,
  type EmrQuantityNumericMode,
  type EmrQuantitySize,
  type EmrSegmentedOption,
  type EmrTimeHourCycle,
  type EmrTimePrecision,
} from './l1-primitives.models.js';
import type { EmrValidationMessage } from './validation.models.js';

// ─────────────────────────────────────────────────────────────
// Shared L1 mechanical data structures (serializable, no DOM handles)
// ─────────────────────────────────────────────────────────────

export type { EmrSegmentedOption };

export interface EmrFileSelectionItem {
  readonly name: string;
  readonly sizeBytes: number;
  readonly mimeType: string;
  readonly lastModified?: number;
}

// ─────────────────────────────────────────────────────────────
// Canonical datetime wire-format helpers (UTC ISO-8601 <-> local wall-clock)
// ─────────────────────────────────────────────────────────────

const pad2 = (n: number): string => String(n).padStart(2, '0');
const pad4 = (n: number): string => String(n).padStart(4, '0');

/**
 * Normalizes either a UTC/offset ISO-8601 instant (`'2026-10-14T09:30:00Z'`) or a
 * zone-less local datetime string (`'2026-10-14T15:00'`) into the local wall-clock
 * `'YYYY-MM-DDTHH:mm'` (or `'YYYY-MM-DDTHH:mm:ss'`) string expected by native
 * `datetime-local` controls. Never shifts UTC by stripping `'Z'`.
 */
export function toLocalDateTimeInputValue(
  value: string | null | undefined,
  precision: 'minute' | 'second' = 'minute'
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
  return precision === 'second' ? `${datePart}T${hm}:${pad2(parsed.getSeconds())}` : `${datePart}T${hm}`;
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

// ─────────────────────────────────────────────────────────────
// L2 Contract-Completing Field Models & Intents
// ─────────────────────────────────────────────────────────────

// 1. EmrScaleField (Likert / VAS + six-state ClinicalAssessmentStatus)
export interface ScaleFieldViewModel {
  readonly definition?: EmrFieldDefinition;
  readonly label: string;
  readonly variant: 'likert' | 'vas';
  readonly value: number | null;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly majorInterval?: number;
  readonly minorInterval?: number;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly anchors?: {
    readonly minLabel?: string;
    readonly midLabel?: string;
    readonly maxLabel?: string;
  };
  readonly optionTones?: Readonly<Record<number, EmrTone>>;
  readonly tone?: EmrTone;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
  readonly unit?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly valueText?: string;
  readonly clearable?: boolean;
}

export type FieldFrameLayout = 'vertical' | 'horizontal' | 'inline';

export type FieldFrameIntent = {
  readonly type: 'statusChangeRequested';
  readonly status: ClinicalAssessmentStatus | undefined;
};

export function normalizeFieldFrameLayout(layout: unknown): FieldFrameLayout {
  return layout === 'horizontal' || layout === 'inline' ? layout : 'vertical';
}

export function mergeFieldFrameMessages(
  error?: string,
  warning?: string,
  info?: string,
  messages?: readonly EmrValidationMessage[],
): readonly EmrValidationMessage[] {
  const out: EmrValidationMessage[] = [];
  const seen = new Set<string>();
  const push = (severity: EmrValidationMessage['severity'], message?: string) => {
    const trimmed = message?.trim();
    if (!trimmed) return;
    const key = `${severity}:${trimmed}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ path: [], severity, message: trimmed });
  };
  push('error', error);
  push('warning', warning);
  push('info', info);
  for (const m of messages ?? []) push(m.severity, m.message);
  return out;
}

export function resolveScaleMidValue(min: number, max: number, variant: 'likert' | 'vas' = 'likert'): number {
  const raw = (min + max) / 2;
  return variant === 'likert' ? Math.round(raw) : raw;
}

export function buildScaleAnchors(
  min: number,
  max: number,
  variant: 'likert' | 'vas' = 'likert',
  anchors?: ScaleFieldViewModel['anchors'],
): readonly { readonly value: number; readonly label: string }[] {
  if (!anchors) return [];
  const out: { readonly value: number; readonly label: string }[] = [];
  if (anchors.minLabel) out.push({ value: min, label: anchors.minLabel });
  if (anchors.midLabel) out.push({ value: resolveScaleMidValue(min, max, variant), label: anchors.midLabel });
  if (anchors.maxLabel) out.push({ value: max, label: anchors.maxLabel });
  return out;
}

export type ScaleFieldIntent =
  | { readonly type: 'valueChangeRequested'; readonly value: number | null }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

// 2. EmrPartialDateField (Year / Year-Month / Full-Date + status)
export interface PartialDateFieldViewModel {
  readonly definition?: EmrFieldDefinition;
  readonly label: string;
  readonly value: EmrPartialDate | null;
  readonly min?: string;
  readonly max?: string;
  readonly displayFormat?: EmrDateTimeDisplayFormat;
  readonly defaultPrecision?: EmrPartialDate['precision'];
  readonly clearable?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export const DEFAULT_PARTIAL_DATE_PRECISION_OPTIONS: readonly EmrSegmentedOption<EmrPartialDate['precision']>[] = [
  { value: 'year', label: 'Year' },
  { value: 'month', label: 'Year & month' },
  { value: 'day', label: 'Full date' },
];

/**
 * Adapts an existing `EmrPartialDate` when switching precision.
 * Truncates finer -> coarser (`day` -> `month` -> `year`), and returns `null` when going
 * coarser -> finer so unrecorded `-01` / `-01-01` segments are NEVER fabricated.
 */
export function adaptPartialDateForPrecision(
  current: EmrPartialDate | null,
  nextPrecision: EmrPartialDate['precision'],
): EmrPartialDate | null {
  if (!current || !current.value) return null;
  const parts = current.value.split('-');
  const y = parts[0];
  if (!y || !/^\d{4}$/.test(y)) return null;
  if (nextPrecision === 'year') {
    return { value: y, precision: 'year' };
  }
  const m = parts[1] && /^\d{2}$/.test(parts[1]) ? parts[1] : undefined;
  if (nextPrecision === 'month') {
    return m ? { value: `${y}-${m}`, precision: 'month' } : null;
  }
  const d = parts[2] && /^\d{2}$/.test(parts[2]) ? parts[2] : undefined;
  return m && d ? { value: `${y}-${m}-${d}`, precision: 'day' } : null;
}

export type PartialDateFieldIntent =
  | { readonly type: 'precisionChangeRequested'; readonly precision: EmrPartialDate['precision'] }
  | { readonly type: 'valueChangeRequested'; readonly value: EmrPartialDate | null }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

// 3. EmrAttachmentField (File / Camera / Scanner attachment refs + status)
export interface EmrAttachmentRef {
  readonly id: string;
  readonly title: string;
  readonly contentType: string;
  readonly sizeBytes?: number;
  readonly uploadedAt?: string;
  readonly statusBadge?: EmrBadge;
  readonly url?: string;
}

export interface AttachmentFieldViewModel {
  readonly definition?: EmrFieldDefinition;
  readonly label: string;
  readonly items: readonly EmrAttachmentRef[];
  readonly accept?: string;
  readonly multiple?: boolean;
  readonly maxItems?: number;
  readonly allowCamera?: boolean;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
  readonly layout?: FieldFrameLayout;
  readonly showMetadata?: boolean;
}

export function formatByteSize(bytes?: number): string {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type AttachmentFieldIntent =
  | { readonly type: 'filesSelected'; readonly files: readonly EmrFileSelectionItem[] }
  | { readonly type: 'captureRequested'; readonly mode: 'camera' | 'scanner' }
  | { readonly type: 'itemSelected'; readonly id: string }
  | { readonly type: 'itemRemoveRequested'; readonly id: string }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

// 4. EmrPairedField (BP Systolic/Diastolic, C/D ratio, OD/OS paired entry)
export type PairedFieldMode = 'text' | 'decimal' | 'integer';

export interface EmrPairedFieldValue {
  readonly first: string | number | null;
  readonly second: string | number | null;
}

export interface PairedFieldViewModel {
  readonly definition?: EmrFieldDefinition;
  readonly label: string;
  readonly mode?: PairedFieldMode;
  readonly firstMode?: PairedFieldMode;
  readonly secondMode?: PairedFieldMode;
  readonly firstLabel: string;
  readonly secondLabel: string;
  readonly firstPlaceholder?: string;
  readonly secondPlaceholder?: string;
  readonly separator?: string;
  readonly unit?: string;
  readonly value: EmrPairedFieldValue | null;
  readonly min?: number;
  readonly max?: number;
  readonly firstMin?: number;
  readonly firstMax?: number;
  readonly secondMin?: number;
  readonly secondMax?: number;
  readonly step?: number;
  readonly firstStep?: number;
  readonly secondStep?: number;
  readonly precision?: number;
  readonly firstPrecision?: number;
  readonly secondPrecision?: number;
  readonly maxLength?: number;
  readonly firstMaxLength?: number;
  readonly secondMaxLength?: number;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly firstRequired?: boolean;
  readonly secondRequired?: boolean;
  readonly readOnly?: boolean;
  readonly firstReadOnly?: boolean;
  readonly secondReadOnly?: boolean;
  readonly clearable?: boolean;
  readonly showSteppers?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly layout?: FieldFrameLayout;
  readonly showMetadata?: boolean;
}

export type PairedFieldIntent =
  | { readonly type: 'firstChangeRequested'; readonly value: string | number | null }
  | { readonly type: 'secondChangeRequested'; readonly value: string | number | null }
  | { readonly type: 'clearRequested' }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

export interface PairedSideValidationState {
  readonly firstHasError: boolean;
  readonly secondHasError: boolean;
  readonly firstHasWarning: boolean;
  readonly secondHasWarning: boolean;
}

/**
 * Resolves per-side error/warning states from `EmrValidationMessage.path`:
 * - Last segment `'first'` applies only to the first side.
 * - Last segment `'second'` applies only to the second side.
 * - Empty, root, or other paths apply to both sides.
 */
export function resolvePairedSideValidation(
  messages?: readonly EmrValidationMessage[],
): PairedSideValidationState {
  let firstHasError = false;
  let secondHasError = false;
  let firstHasWarning = false;
  let secondHasWarning = false;
  for (const m of messages ?? []) {
    if (m.severity !== 'error' && m.severity !== 'warning') continue;
    const last = m.path.length > 0 ? m.path[m.path.length - 1] : undefined;
    const applyFirst = last === 'first' || last !== 'second';
    const applySecond = last === 'second' || last !== 'first';
    if (m.severity === 'error') {
      if (applyFirst) firstHasError = true;
      if (applySecond) secondHasError = true;
    } else {
      if (applyFirst) firstHasWarning = true;
      if (applySecond) secondHasWarning = true;
    }
  }
  return { firstHasError, secondHasError, firstHasWarning, secondHasWarning };
}

/**
 * Resolves the effective input mode for a paired side, falling back from explicit side mode
 * to group mode, then to `definition.contract.valueType` (`'integer'` | `'decimal'`), else `'text'`.
 */
export function resolvePairedSideMode(
  explicitMode?: PairedFieldMode,
  groupMode?: PairedFieldMode,
  definition?: EmrFieldDefinition,
): PairedFieldMode {
  if (explicitMode === 'text' || explicitMode === 'decimal' || explicitMode === 'integer') {
    return explicitMode;
  }
  if (groupMode === 'text' || groupMode === 'decimal' || groupMode === 'integer') {
    return groupMode;
  }
  const vt = definition?.contract?.valueType;
  if (vt === 'integer' || vt === 'decimal') return vt;
  return 'text';
}

/**
 * Sanitizes raw text for a numeric paired input side without clamping or dropping out-of-range values.
 */
export function sanitizePairedNumberText(text: string, mode: 'decimal' | 'integer'): string {
  const noSpaces = text.replace(/[\s\u00A0\u202F]+/g, '');
  const normalized =
    mode === 'decimal' && !noSpaces.includes('.') && noSpaces.includes(',')
      ? noSpaces.replace(',', '.')
      : noSpaces;
  let out = '';
  let seenDot = false;
  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i]!;
    if (ch >= '0' && ch <= '9') {
      out += ch;
    } else if (ch === '-' && out.length === 0) {
      out += ch;
    } else if (ch === '.' && mode === 'decimal' && !seenDot) {
      out += ch;
      seenDot = true;
    }
  }
  return out;
}

export type PairedNumberDraftParse =
  | { readonly complete: true; readonly value: number | null }
  | { readonly complete: false };

/**
 * Parses a numeric draft on a paired field side:
 * - Preserves incomplete drafts (`"-"`, `"-."`, `"."`, `"12."`).
 * - Emits `null` when empty.
 * - Truncates via `Math.trunc` for `'integer'`.
 * - Never drops or clamps out-of-range valid numbers on typing.
 */
export function parsePairedNumberDraft(
  text: string,
  mode: 'decimal' | 'integer',
): PairedNumberDraftParse {
  const trimmed = text.trim();
  if (trimmed === '') return { complete: true, value: null };
  if (trimmed === '-' || trimmed === '.' || trimmed === '-.' || trimmed.endsWith('.')) {
    return { complete: false };
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return { complete: false };
  const val = mode === 'integer' ? Math.trunc(n) : n;
  return { complete: true, value: Object.is(val, -0) ? 0 : val };
}

/**
 * Computes the effective step increment for a numeric paired side.
 */
export function resolvePairedNumberStep(options: {
  readonly mode: 'decimal' | 'integer';
  readonly precision?: number;
  readonly step?: number;
}): number {
  const { mode, precision, step } = options;
  if (typeof step === 'number' && Number.isFinite(step) && step > 0) {
    return mode === 'integer' ? Math.max(1, Math.round(step)) : step;
  }
  if (mode === 'integer' || precision === 0) return 1;
  if (typeof precision === 'number' && Number.isFinite(precision) && precision > 0) {
    const decimals = Math.min(10, Math.floor(precision));
    return Number((10 ** -decimals).toFixed(decimals));
  }
  return 0.1;
}

/**
 * Steps a numeric paired side value up or down, clamping to optional `min`/`max` bounds.
 */
export function stepPairedNumber(options: {
  readonly current: number | null;
  readonly delta: -1 | 1;
  readonly mode: 'decimal' | 'integer';
  readonly step?: number;
  readonly precision?: number;
  readonly min?: number;
  readonly max?: number;
}): number {
  const { current, delta, mode, min, max } = options;
  const step = resolvePairedNumberStep({ mode, precision: options.precision, step: options.step });
  const base = current !== null && Number.isFinite(current) ? current : (min ?? 0);
  const raw = current === null && min !== undefined ? min : base + delta * step;
  const inferredDecimals =
    options.precision ?? (String(step).includes('.') ? String(step).split('.')[1]?.length : undefined);
  let next: number;
  if (mode === 'integer') {
    next = Math.round(raw);
  } else if (typeof inferredDecimals === 'number' && Number.isFinite(inferredDecimals) && inferredDecimals >= 0) {
    const d = Math.min(10, Math.floor(inferredDecimals));
    next = Number(raw.toFixed(d));
  } else {
    next = Number(raw.toPrecision(12));
  }
  if (min !== undefined && next < min) next = min;
  if (max !== undefined && next > max) next = max;
  return Object.is(next, -0) ? 0 : next;
}

// 5. EmrDurationInput (Amount + UCUM calendar/time unit)
export type EmrDurationUnit = 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a';

export interface EmrDurationValue {
  readonly amount: number | null;
  readonly unit: EmrDurationUnit;
}

export interface DurationFieldViewModel {
  readonly definition?: EmrFieldDefinition;
  readonly label: string;
  readonly value: EmrDurationValue | null;
  readonly unitOptions: readonly { readonly value: EmrDurationUnit; readonly label: string }[];
  readonly mode?: EmrQuantityNumericMode;
  readonly precision?: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly placeholder?: string;
  readonly unitPlaceholder?: string;
  readonly unitLabel?: string;
  readonly showSteppers?: boolean;
  readonly clearable?: boolean;
  readonly size?: EmrQuantitySize;
  readonly layout?: FieldFrameLayout;
  readonly showMetadata?: boolean;
  readonly labelHidden?: boolean;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type DurationFieldIntent =
  | { readonly type: 'amountChangeRequested'; readonly amount: number | null }
  | { readonly type: 'unitChangeRequested'; readonly unit: EmrDurationUnit }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined }
  | { readonly type: 'clearRequested' };

export interface DurationFieldConfigOverrides {
  readonly definition?: EmrFieldDefinition;
  readonly mode?: EmrQuantityNumericMode;
  readonly precision?: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly placeholder?: string;
  readonly unitPlaceholder?: string;
  readonly unitLabel?: string;
  readonly showSteppers?: boolean;
  readonly clearable?: boolean;
  readonly size?: EmrQuantitySize;
  readonly layout?: FieldFrameLayout;
  readonly showMetadata?: boolean;
  readonly labelHidden?: boolean;
  readonly readOnly?: boolean;
  readonly required?: boolean;
  readonly hint?: string;
}

export interface DurationFieldResolvedConfig {
  readonly definition?: EmrFieldDefinition;
  readonly label: string;
  readonly mode: EmrQuantityNumericMode;
  readonly precision?: number;
  readonly min: number;
  readonly max?: number;
  readonly step: number;
  readonly allowNegative: boolean;
  readonly placeholder: string;
  readonly unitPlaceholder: string;
  readonly unitLabel: string;
  readonly showSteppers: boolean;
  readonly clearable: boolean;
  readonly size: EmrQuantitySize;
  readonly layout: FieldFrameLayout;
  readonly showMetadata: boolean;
  readonly labelHidden: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
  readonly hint?: string;
}

/**
 * Resolves effective configuration for `EmrDurationInput` across model, field definition,
 * and component-level prop overrides. Defaults `min` to `0`, derives numeric `mode`,
 * and computes `step` via `resolveQuantityStep`.
 */
export function resolveDurationFieldConfig(
  model: DurationFieldViewModel,
  overrides?: DurationFieldConfigOverrides,
): DurationFieldResolvedConfig {
  const def = overrides?.definition ?? model.definition;
  const label = model.label || def?.presentation?.label || '';
  const precision = overrides?.precision ?? model.precision ?? def?.presentation?.precision;
  const mode: EmrQuantityNumericMode =
    overrides?.mode ??
    model.mode ??
    (precision === 0 || def?.contract?.valueType === 'integer' ? 'integer' : 'decimal');
  const min = overrides?.min ?? model.min ?? def?.presentation?.min ?? 0;
  const max = overrides?.max ?? model.max ?? def?.presentation?.max;
  const step = resolveQuantityStep({
    mode,
    precision,
    step: overrides?.step ?? model.step ?? def?.presentation?.step,
  });
  const minCard = def?.contract?.cardinality?.min;
  return {
    definition: def,
    label,
    mode,
    precision,
    min,
    max,
    step,
    allowNegative: min < 0,
    placeholder: overrides?.placeholder ?? model.placeholder ?? def?.presentation?.placeholder ?? '',
    unitPlaceholder: overrides?.unitPlaceholder ?? model.unitPlaceholder ?? 'Unit',
    unitLabel: overrides?.unitLabel ?? model.unitLabel ?? 'Unit',
    showSteppers: overrides?.showSteppers ?? model.showSteppers ?? true,
    clearable: overrides?.clearable ?? model.clearable ?? false,
    size: overrides?.size ?? model.size ?? 'md',
    layout: normalizeFieldFrameLayout(overrides?.layout ?? model.layout),
    showMetadata: (overrides?.showMetadata ?? true) && model.showMetadata !== false,
    labelHidden: Boolean(overrides?.labelHidden || model.labelHidden),
    readOnly: Boolean(overrides?.readOnly || model.readOnly || def?.contract?.readOnly),
    required: Boolean(overrides?.required || model.required || (minCard !== undefined && minCard >= 1)),
    hint: overrides?.hint ?? model.hint ?? def?.presentation?.hint,
  };
}

export interface DurationPartValidation {
  readonly amountError: string;
  readonly unitError: string;
  readonly amountWarning: string;
  readonly unitWarning: string;
  readonly hasAnyError: boolean;
  readonly hasAnyWarning: boolean;
}

/**
 * Inspects `EmrValidationMessage.path` (`['amount']` / `['value']` -> amount only;
 * `['unit']` -> unit only; root/un-scoped -> both amount & unit), suppressing
 * per-side warnings whenever that side has an error.
 */
export function extractDurationPartValidation(
  messages?: readonly EmrValidationMessage[],
  overrides?: { readonly error?: string; readonly warning?: string },
): DurationPartValidation {
  const amountErrors: string[] = [];
  const unitErrors: string[] = [];
  const amountWarnings: string[] = [];
  const unitWarnings: string[] = [];

  const pushUnique = (list: string[], text?: string) => {
    const trimmed = typeof text === 'string' ? text.trim() : '';
    if (trimmed && !list.includes(trimmed)) list.push(trimmed);
  };

  pushUnique(amountErrors, overrides?.error);
  pushUnique(unitErrors, overrides?.error);
  pushUnique(amountWarnings, overrides?.warning);
  pushUnique(unitWarnings, overrides?.warning);

  for (const m of messages ?? []) {
    if (m.severity !== 'error' && m.severity !== 'warning') continue;
    const trimmed = m.message?.trim();
    if (!trimmed) continue;
    const last = m.path.length > 0 ? m.path[m.path.length - 1] : undefined;
    const isAmountOnly = last === 'amount' || last === 'value';
    const isUnitOnly = last === 'unit';
    const applyAmount = isAmountOnly || !isUnitOnly;
    const applyUnit = isUnitOnly || !isAmountOnly;
    if (m.severity === 'error') {
      if (applyAmount) pushUnique(amountErrors, trimmed);
      if (applyUnit) pushUnique(unitErrors, trimmed);
    } else {
      if (applyAmount) pushUnique(amountWarnings, trimmed);
      if (applyUnit) pushUnique(unitWarnings, trimmed);
    }
  }

  const amountError = amountErrors.join(' · ');
  const unitError = unitErrors.join(' · ');
  const amountWarning = amountError ? '' : amountWarnings.join(' · ');
  const unitWarning = unitError ? '' : unitWarnings.join(' · ');

  return {
    amountError,
    unitError,
    amountWarning,
    unitWarning,
    hasAnyError: Boolean(amountError || unitError),
    hasAnyWarning: Boolean(amountWarning || unitWarning),
  };
}

// 6. EmrRangeField (Low–High numeric, date, time, or datetime range)
export type EmrRangeKind = 'number' | 'date' | 'time' | 'datetime';

export interface EmrRangeValue {
  readonly low: number | string | null;
  readonly high: number | string | null;
}

export interface RangeFieldViewModel {
  readonly definition?: EmrFieldDefinition;
  readonly label: string;
  readonly kind: EmrRangeKind;
  readonly value: EmrRangeValue | null;
  readonly unit?: string;
  readonly layout?: FieldFrameLayout;
  readonly showMetadata?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly clearable?: boolean;
  readonly numericMode?: 'decimal' | 'integer';
  readonly precision?: number;
  readonly showSteppers?: boolean;
  readonly displayFormat?: EmrDateTimeDisplayFormat;
  readonly timePrecision?: EmrTimePrecision;
  readonly hourCycle?: EmrTimeHourCycle;
  readonly wireFormat?: EmrDateTimeWireFormat;
  readonly min?: number | string;
  readonly max?: number | string;
  readonly step?: number;
  readonly lowLabel?: string;
  readonly highLabel?: string;
  readonly lowPlaceholder?: string;
  readonly highPlaceholder?: string;
  readonly lowMin?: number | string;
  readonly lowMax?: number | string;
  readonly highMin?: number | string;
  readonly highMax?: number | string;
  readonly lowRequired?: boolean;
  readonly highRequired?: boolean;
  readonly lowError?: string;
  readonly highError?: string;
  readonly lowWarning?: string;
  readonly highWarning?: string;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type RangeFieldIntent =
  | { readonly type: 'lowChangeRequested'; readonly low: number | string | null }
  | { readonly type: 'highChangeRequested'; readonly high: number | string | null }
  | { readonly type: 'rangeChangeRequested'; readonly value: EmrRangeValue | null }
  | { readonly type: 'clearRequested' }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

export interface RangeSideValidationState {
  readonly lowInvalid: boolean;
  readonly highInvalid: boolean;
  readonly lowWarning: boolean;
  readonly highWarning: boolean;
}

export interface RangeFieldValidationOptions {
  readonly allowEqual?: boolean;
}

function normalizeRangeTime(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(raw.trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = Number(m[3] ?? '00');
  if (hh > 23 || mm > 59 || ss > 59) return null;
  return `${m[1]}:${m[2]}:${m[3] ?? '00'}`;
}

function normalizeRangeLocalDateTime(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(raw.trim());
  if (!m) return null;
  return `${m[1]}T${m[2]}:${m[3]}:${m[4] ?? '00'}`;
}

/**
 * Compares two range bounds (`low` vs `high`) according to `kind` and optional `wireFormat`.
 * Returns `-1` when `low < high`, `0` when equal, `1` when `low > high`, or `null` when
 * either bound is missing or unparseable.
 */
export function compareRangeBounds(
  kind: EmrRangeKind,
  low: number | string | null | undefined,
  high: number | string | null | undefined,
  wireFormat: EmrDateTimeWireFormat = 'utc',
): -1 | 0 | 1 | null {
  if (low === null || low === undefined || low === '') return null;
  if (high === null || high === undefined || high === '') return null;

  if (kind === 'number') {
    const a = typeof low === 'number' ? low : Number(low);
    const b = typeof high === 'number' ? high : Number(high);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return a < b ? -1 : a > b ? 1 : 0;
  }

  if (kind === 'date') {
    if (typeof low !== 'string' || typeof high !== 'string') return null;
    const a = low.trim();
    const b = high.trim();
    if (!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(a) || !/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(b)) {
      return null;
    }
    return a < b ? -1 : a > b ? 1 : 0;
  }

  if (kind === 'time') {
    const a = normalizeRangeTime(low);
    const b = normalizeRangeTime(high);
    if (!a || !b) return null;
    return a < b ? -1 : a > b ? 1 : 0;
  }

  // kind === 'datetime'
  if (typeof low !== 'string' || typeof high !== 'string') return null;
  if (wireFormat === 'local') {
    const a = normalizeRangeLocalDateTime(low);
    const b = normalizeRangeLocalDateTime(high);
    if (!a || !b) return null;
    return a < b ? -1 : a > b ? 1 : 0;
  }
  const ta = Date.parse(low.trim());
  const tb = Date.parse(high.trim());
  if (Number.isNaN(ta) || Number.isNaN(tb)) return null;
  return ta < tb ? -1 : ta > tb ? 1 : 0;
}

/**
 * Returns `true` when both bounds are present and `low > high`.
 */
export function isRangeInverted(
  kind: EmrRangeKind,
  value: EmrRangeValue | null | undefined,
  wireFormat: EmrDateTimeWireFormat = 'utc',
): boolean {
  if (!value) return false;
  return compareRangeBounds(kind, value.low, value.high, wireFormat) === 1;
}

/**
 * Evaluates requiredness, per-bound min/max constraints, and bound ordering (`low <= high`, or
 * `low < high` when `options.allowEqual === false`) for a `RangeFieldViewModel`.
 */
export function validateRangeField(
  model: RangeFieldViewModel,
  options?: RangeFieldValidationOptions,
): readonly EmrValidationMessage[] {
  const out: EmrValidationMessage[] = [];
  const def = model.definition;
  const wireFormat = model.wireFormat ?? 'utc';
  const low = model.value?.low ?? null;
  const high = model.value?.high ?? null;
  const isMissing = (v: number | string | null): boolean => v === null || v === undefined || v === '';

  const minCard = def?.contract?.cardinality?.min;
  const groupRequired = Boolean(model.required || (minCard !== undefined && minCard >= 1));
  const lowRequired = Boolean(model.lowRequired ?? groupRequired);
  const highRequired = Boolean(model.highRequired ?? groupRequired);
  const lowLabel = model.lowLabel ?? (model.kind === 'number' ? 'Low' : 'From');
  const highLabel = model.highLabel ?? (model.kind === 'number' ? 'High' : 'To');

  if (lowRequired && isMissing(low)) {
    out.push({ path: ['low'], severity: 'error', message: `${lowLabel} is required.` });
  }
  if (highRequired && isMissing(high)) {
    out.push({ path: ['high'], severity: 'error', message: `${highLabel} is required.` });
  }

  const defMin = model.kind === 'number' ? def?.presentation?.min : undefined;
  const defMax = model.kind === 'number' ? def?.presentation?.max : undefined;
  const effLowMin = model.lowMin ?? model.min ?? defMin;
  const effLowMax = model.lowMax ?? model.max ?? defMax;
  const effHighMin = model.highMin ?? model.min ?? defMin;
  const effHighMax = model.highMax ?? model.max ?? defMax;

  if (!isMissing(low)) {
    if (effLowMin !== undefined && compareRangeBounds(model.kind, low, effLowMin, wireFormat) === -1) {
      out.push({ path: ['low'], severity: 'error', message: `${lowLabel} must be at least ${effLowMin}.` });
    }
    if (effLowMax !== undefined && compareRangeBounds(model.kind, low, effLowMax, wireFormat) === 1) {
      out.push({ path: ['low'], severity: 'error', message: `${lowLabel} must be at most ${effLowMax}.` });
    }
  }
  if (!isMissing(high)) {
    if (effHighMin !== undefined && compareRangeBounds(model.kind, high, effHighMin, wireFormat) === -1) {
      out.push({ path: ['high'], severity: 'error', message: `${highLabel} must be at least ${effHighMin}.` });
    }
    if (effHighMax !== undefined && compareRangeBounds(model.kind, high, effHighMax, wireFormat) === 1) {
      out.push({ path: ['high'], severity: 'error', message: `${highLabel} must be at most ${effHighMax}.` });
    }
  }

  const cmp = compareRangeBounds(model.kind, low, high, wireFormat);
  if (cmp === 1) {
    out.push({ path: [], severity: 'error', message: `${lowLabel} must not exceed ${highLabel}.` });
  } else if (options?.allowEqual === false && cmp === 0) {
    out.push({ path: [], severity: 'error', message: `${lowLabel} must be less than ${highLabel}.` });
  }

  return out;
}

/**
 * Merges `lowError`, `highError`, `lowWarning`, `highWarning`, and `messages` into a
 * deduplicated list of `EmrValidationMessage` entries preserving per-side paths.
 */
export function resolveRangeFieldMessages(
  model: Pick<RangeFieldViewModel, 'lowError' | 'highError' | 'lowWarning' | 'highWarning' | 'messages'>,
): readonly EmrValidationMessage[] {
  const out: EmrValidationMessage[] = [];
  const seen = new Set<string>();
  const push = (
    path: readonly (string | number)[],
    severity: EmrValidationMessage['severity'],
    message?: string,
  ) => {
    const trimmed = typeof message === 'string' ? message.trim() : '';
    if (!trimmed) return;
    const key = `${path.join('.')}|${severity}|${trimmed}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ path, severity, message: trimmed });
  };
  push(['low'], 'error', model.lowError);
  push(['high'], 'error', model.highError);
  push(['low'], 'warning', model.lowWarning);
  push(['high'], 'warning', model.highWarning);
  for (const m of model.messages ?? []) {
    push(m.path, m.severity, m.message);
  }
  return out;
}

/**
 * Resolves per-side error/warning states from `EmrValidationMessage.path`:
 * - Last segment `'low'` applies only to the low bound.
 * - Last segment `'high'` applies only to the high bound.
 * - Empty, root, or other paths apply to both bounds.
 * Suppresses per-side warnings when that side is invalid.
 */
export function resolveRangeSideValidation(
  messages?: readonly EmrValidationMessage[],
): RangeSideValidationState {
  let lowInvalid = false;
  let highInvalid = false;
  let rawLowWarning = false;
  let rawHighWarning = false;
  for (const m of messages ?? []) {
    if (m.severity !== 'error' && m.severity !== 'warning') continue;
    const last = m.path.length > 0 ? m.path[m.path.length - 1] : undefined;
    const applyLow = last === 'low' || last !== 'high';
    const applyHigh = last === 'high' || last !== 'low';
    if (m.severity === 'error') {
      if (applyLow) lowInvalid = true;
      if (applyHigh) highInvalid = true;
    } else {
      if (applyLow) rawLowWarning = true;
      if (applyHigh) rawHighWarning = true;
    }
  }
  return {
    lowInvalid,
    highInvalid,
    lowWarning: !lowInvalid && rawLowWarning,
    highWarning: !highInvalid && rawHighWarning,
  };
}

// 7. EmrSignatureCaptureField (Stylus/pointer drawn signature pad)
export interface EmrSignaturePoint {
  readonly x: number;
  readonly y: number;
}

export interface EmrSignatureStroke {
  readonly points: readonly EmrSignaturePoint[];
}

export interface SignatureCaptureViewModel {
  readonly definition?: EmrFieldDefinition;
  readonly label: string;
  readonly labelHidden?: boolean;
  readonly layout?: FieldFrameLayout;
  readonly showMetadata?: boolean;
  readonly signatoryName?: string;
  readonly signatoryRole?: string;
  readonly signedAt?: string;
  readonly strokes: readonly EmrSignatureStroke[];
  readonly width?: number;
  readonly height?: number;
  readonly penWidth?: number;
  readonly clearable?: boolean;
  readonly undoable?: boolean;
  readonly emptyPrompt?: string;
  readonly showStrokeCount?: boolean;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type SignatureCaptureIntent =
  | { readonly type: 'strokeAdded'; readonly stroke: EmrSignatureStroke }
  | { readonly type: 'undoRequested' }
  | { readonly type: 'clearRequested' }
  | FieldFrameIntent;

export interface SignatureCanvasGeometry {
  readonly width: number;
  readonly height: number;
  readonly baselineY: number;
  readonly baselineInset: number;
}

export interface SignatureClientRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface SignatureValidationState {
  readonly hasError: boolean;
  readonly hasWarning: boolean;
  readonly firstError: string;
  readonly firstWarning: string;
}

export function resolveSignatureCanvasGeometry(
  width?: number,
  height?: number,
): SignatureCanvasGeometry {
  const w = typeof width === 'number' && Number.isFinite(width) && width > 0 ? Math.round(width) : 420;
  const h = typeof height === 'number' && Number.isFinite(height) && height > 0 ? Math.round(height) : 140;
  return {
    width: w,
    height: h,
    baselineY: Math.round(h * 0.78),
    baselineInset: Math.min(16, Math.max(8, Math.round(w * 0.04))),
  };
}

export function mapPointerToSignaturePoint(
  clientX: number,
  clientY: number,
  rect: SignatureClientRect,
  viewBoxWidth = 420,
  viewBoxHeight = 140,
): EmrSignaturePoint {
  const vbW = viewBoxWidth > 0 && Number.isFinite(viewBoxWidth) ? viewBoxWidth : 420;
  const vbH = viewBoxHeight > 0 && Number.isFinite(viewBoxHeight) ? viewBoxHeight : 140;
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 0, y: 0 };
  }
  const scale = Math.min(rect.width / vbW, rect.height / vbH);
  if (!Number.isFinite(scale) || scale <= 0) {
    return { x: 0, y: 0 };
  }
  const offsetX = (rect.width - vbW * scale) / 2;
  const offsetY = (rect.height - vbH * scale) / 2;
  const rawX = (clientX - rect.left - offsetX) / scale;
  const rawY = (clientY - rect.top - offsetY) / scale;
  const clampedX = Math.max(0, Math.min(vbW, rawX));
  const clampedY = Math.max(0, Math.min(vbH, rawY));
  const x = Number(clampedX.toFixed(1));
  const y = Number(clampedY.toFixed(1));
  return {
    x: Object.is(x, -0) ? 0 : x,
    y: Object.is(y, -0) ? 0 : y,
  };
}

export function isSignaturePadLocked(
  model: Pick<SignatureCaptureViewModel, 'readOnly' | 'definition'>,
  readOnlyProp?: boolean,
): boolean {
  return Boolean(readOnlyProp || model.readOnly || model.definition?.contract?.readOnly);
}

export function formatSignatureAttestation(
  model: Pick<
    SignatureCaptureViewModel,
    'signatoryName' | 'signatoryRole' | 'signedAt' | 'strokes' | 'showStrokeCount'
  >,
): string {
  const meta = [model.signatoryName, model.signatoryRole, model.signedAt]
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean)
    .join(' · ');
  const count = model.strokes.length;
  if (meta) {
    if (model.showStrokeCount && count > 0) {
      return `${meta} · ${count} ${count === 1 ? 'stroke' : 'strokes'}`;
    }
    return meta;
  }
  if (count > 0) {
    return model.showStrokeCount === false
      ? 'Signature captured'
      : `${count} stroke(s) recorded`;
  }
  return 'Unsigned';
}

export function hasSignatureValidationState(
  messages?: readonly EmrValidationMessage[],
): SignatureValidationState {
  const firstError = messages?.find((m) => m.severity === 'error')?.message?.trim() ?? '';
  const firstWarning = messages?.find((m) => m.severity === 'warning')?.message?.trim() ?? '';
  const hasError = Boolean(firstError);
  const hasWarning = !hasError && Boolean(firstWarning);
  return {
    hasError,
    hasWarning,
    firstError,
    firstWarning,
  };
}

// 8. EmrPhoneInput (FHIR ContactPoint phone + messaging channels)
export type EmrPhoneChannel = 'voice' | 'sms' | 'whatsapp';

export interface EmrPhoneCountryOption {
  readonly code: string;
  readonly label: string;
  readonly keywords?: readonly string[];
  readonly description?: string;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly badge?: EmrBadge | string;
  readonly tone?: EmrTone;
  readonly group?: string;
}

export interface EmrPhoneChannelOption {
  readonly id: EmrPhoneChannel;
  readonly label: string;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
}

export interface PhoneFieldViewModel {
  readonly definition?: EmrFieldDefinition;
  readonly label: string;
  readonly countryCode: string;
  readonly countryOptions: readonly EmrPhoneCountryOption[];
  readonly nationalNumber: string;
  readonly extension?: string;
  readonly showExtension?: boolean;
  readonly placeholder?: string;
  readonly extensionPlaceholder?: string;
  readonly maxLength?: number;
  readonly extensionMaxLength?: number;
  readonly clearable?: boolean;
  readonly showPhoneIcon?: boolean;
  readonly formattedPreview?: string;
  readonly channels?: readonly EmrPhoneChannel[];
  readonly availableChannels?: readonly EmrPhoneChannelOption[];
  readonly verifiedBadge?: EmrBadge;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly layout?: FieldFrameLayout;
  readonly showMetadata?: boolean;
}

export type PhoneFieldIntent =
  | { readonly type: 'countryCodeChangeRequested'; readonly countryCode: string }
  | { readonly type: 'numberChangeRequested'; readonly nationalNumber: string }
  | { readonly type: 'extensionChangeRequested'; readonly extension: string }
  | { readonly type: 'channelToggleRequested'; readonly channel: EmrPhoneChannel }
  | { readonly type: 'clearRequested' }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

export type PhonePartKey = 'countryCode' | 'nationalNumber' | 'extension' | 'channels';

export interface PhonePartValidationState {
  readonly countryCodeInvalid: boolean;
  readonly countryCodeWarning: boolean;
  readonly nationalNumberInvalid: boolean;
  readonly nationalNumberWarning: boolean;
  readonly extensionInvalid: boolean;
  readonly extensionWarning: boolean;
  readonly channelsInvalid: boolean;
  readonly channelsWarning: boolean;
  readonly hasAnyError: boolean;
  readonly hasAnyWarning: boolean;
}

/**
 * Resolves per-part validation flags from `EmrValidationMessage.path`:
 * - Last segment `'countryCode'`, `'nationalNumber'`, `'extension'`, or `'channels'` targets that part only.
 * - Untargeted root or un-scoped messages target both `countryCode` and `nationalNumber`.
 * - Warnings on a part are suppressed whenever that part also has an error.
 */
export function resolvePhonePartValidation(
  messages?: readonly EmrValidationMessage[],
): PhonePartValidationState {
  let countryCodeInvalid = false;
  let nationalNumberInvalid = false;
  let extensionInvalid = false;
  let channelsInvalid = false;
  let countryCodeWarn = false;
  let nationalNumberWarn = false;
  let extensionWarn = false;
  let channelsWarn = false;

  for (const m of messages ?? []) {
    if (m.severity !== 'error' && m.severity !== 'warning') continue;
    const last = m.path.length > 0 ? m.path[m.path.length - 1] : undefined;
    const isScoped =
      last === 'countryCode' ||
      last === 'nationalNumber' ||
      last === 'extension' ||
      last === 'channels';
    const hitCountry = last === 'countryCode' || !isScoped;
    const hitNumber = last === 'nationalNumber' || !isScoped;
    const hitExt = last === 'extension';
    const hitChannels = last === 'channels';
    if (m.severity === 'error') {
      if (hitCountry) countryCodeInvalid = true;
      if (hitNumber) nationalNumberInvalid = true;
      if (hitExt) extensionInvalid = true;
      if (hitChannels) channelsInvalid = true;
    } else {
      if (hitCountry) countryCodeWarn = true;
      if (hitNumber) nationalNumberWarn = true;
      if (hitExt) extensionWarn = true;
      if (hitChannels) channelsWarn = true;
    }
  }

  const countryCodeWarning = !countryCodeInvalid && countryCodeWarn;
  const nationalNumberWarning = !nationalNumberInvalid && nationalNumberWarn;
  const extensionWarning = !extensionInvalid && extensionWarn;
  const channelsWarning = !channelsInvalid && channelsWarn;

  return {
    countryCodeInvalid,
    countryCodeWarning,
    nationalNumberInvalid,
    nationalNumberWarning,
    extensionInvalid,
    extensionWarning,
    channelsInvalid,
    channelsWarning,
    hasAnyError: countryCodeInvalid || nationalNumberInvalid || extensionInvalid || channelsInvalid,
    hasAnyWarning: countryCodeWarning || nationalNumberWarning || extensionWarning || channelsWarning,
  };
}

/**
 * Returns `true` when the extension input should be rendered (`showExtension === true`, or
 * `showExtension === undefined` and `extension !== undefined`).
 */
export function isPhoneExtensionVisible(showExtension?: boolean, extension?: string): boolean {
  if (showExtension === false) return false;
  if (showExtension === true) return true;
  return extension !== undefined;
}

/**
 * Returns `true` when either `nationalNumber` or `extension` has a non-empty value to clear.
 */
export function hasPhoneClearableValue(nationalNumber?: string, extension?: string): boolean {
  return Boolean(nationalNumber || extension);
}

// 9. EmrAddressField (Structured regional/FHIR Address)
export type EmrAddressUse = 'home' | 'work' | 'temp' | 'billing';

export type EmrAddressPart = keyof EmrAddressValue;

export interface EmrAddressValue {
  readonly line1: string;
  readonly line2?: string;
  readonly city: string;
  readonly district?: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface EmrAddressPartLabels {
  readonly use?: string;
  readonly line1?: string;
  readonly line2?: string;
  readonly city?: string;
  readonly district?: string;
  readonly state?: string;
  readonly postalCode?: string;
  readonly country?: string;
  readonly clear?: string;
}

export const DEFAULT_ADDRESS_USE_OPTIONS: readonly {
  readonly value: EmrAddressUse;
  readonly label: string;
}[] = [
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'temp', label: 'Temp' },
  { value: 'billing', label: 'Billing' },
];

export const DEFAULT_ADDRESS_REQUIRED_PARTS: readonly EmrAddressPart[] = [
  'line1',
  'city',
  'state',
  'postalCode',
  'country',
];

export interface AddressFieldViewModel {
  readonly definition?: EmrFieldDefinition;
  readonly label: string;
  readonly use?: EmrAddressUse;
  readonly useOptions?: readonly { readonly value: EmrAddressUse; readonly label: string }[];
  readonly value: EmrAddressValue;
  readonly stateOptions?: readonly ClinicalOption[];
  readonly countryOptions?: readonly ClinicalOption[];
  readonly showDistrict?: boolean;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly error?: string;
  readonly warning?: string;
  readonly info?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly requiredParts?: readonly EmrAddressPart[];
  readonly readOnly?: boolean;
  readonly clearable?: boolean;
  readonly layout?: FieldFrameLayout;
  readonly showMetadata?: boolean;
  readonly labels?: EmrAddressPartLabels;
  readonly placeholders?: Partial<Record<EmrAddressPart, string>>;
  readonly maxLengths?: Partial<Record<EmrAddressPart, number>>;
}

export type AddressFieldIntent =
  | { readonly type: 'fieldChangeRequested'; readonly part: EmrAddressPart; readonly value: string }
  | { readonly type: 'useChangeRequested'; readonly use: EmrAddressUse }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined }
  | { readonly type: 'cleared' };

export interface AddressPartValidationState {
  readonly line1Invalid: boolean;
  readonly line1Warning: boolean;
  readonly line2Invalid: boolean;
  readonly line2Warning: boolean;
  readonly cityInvalid: boolean;
  readonly cityWarning: boolean;
  readonly districtInvalid: boolean;
  readonly districtWarning: boolean;
  readonly stateInvalid: boolean;
  readonly stateWarning: boolean;
  readonly postalCodeInvalid: boolean;
  readonly postalCodeWarning: boolean;
  readonly countryInvalid: boolean;
  readonly countryWarning: boolean;
  readonly hasAnyError: boolean;
  readonly hasAnyWarning: boolean;
}

const ADDRESS_PART_SET: ReadonlySet<string> = new Set<EmrAddressPart>([
  'line1',
  'line2',
  'city',
  'district',
  'state',
  'postalCode',
  'country',
]);

/**
 * Merges top-level `error`, `warning`, `info`, and path-addressed `messages` for an
 * `AddressFieldViewModel` while preserving each message's `EmrNodePath` for per-part routing.
 */
export function resolveAddressRootMessages(
  model: Pick<AddressFieldViewModel, 'error' | 'warning' | 'info' | 'messages'>,
): readonly EmrValidationMessage[] {
  const out: EmrValidationMessage[] = [];
  const seen = new Set<string>();
  const push = (
    path: readonly (string | number)[],
    severity: EmrValidationMessage['severity'],
    message?: string,
  ) => {
    const trimmed = typeof message === 'string' ? message.trim() : '';
    if (!trimmed) return;
    const key = `${path.join('.')}|${severity}|${trimmed}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ path, severity, message: trimmed });
  };
  push([], 'error', model.error);
  push([], 'warning', model.warning);
  push([], 'info', model.info);
  for (const m of model.messages ?? []) {
    push(m.path, m.severity, m.message);
  }
  return out;
}

/**
 * Resolves per-part validation flags from `EmrValidationMessage.path`:
 * - Last segment matching one of the 7 `EmrAddressPart` keys targets that part only.
 * - Blanket/root or unscoped messages apply to the 5 core parts (`line1`, `city`, `state`,
 *   `postalCode`, `country`) and NEVER mark optional `line2` or `district` invalid/warning.
 * - Warnings on a part are suppressed whenever that part also has an error.
 */
export function resolveAddressPartValidation(
  messages?: readonly EmrValidationMessage[],
): AddressPartValidationState {
  let line1Inv = false;
  let line2Inv = false;
  let cityInv = false;
  let districtInv = false;
  let stateInv = false;
  let postalInv = false;
  let countryInv = false;
  let line1Warn = false;
  let line2Warn = false;
  let cityWarn = false;
  let districtWarn = false;
  let stateWarn = false;
  let postalWarn = false;
  let countryWarn = false;

  for (const m of messages ?? []) {
    if (m.severity !== 'error' && m.severity !== 'warning') continue;
    const last = m.path.length > 0 ? m.path[m.path.length - 1] : undefined;
    const scoped = typeof last === 'string' && ADDRESS_PART_SET.has(last) ? (last as EmrAddressPart) : undefined;
    const isErr = m.severity === 'error';
    const apply = (part: EmrAddressPart) => (scoped ? scoped === part : part !== 'line2' && part !== 'district');
    if (apply('line1')) {
      if (isErr) line1Inv = true;
      else line1Warn = true;
    }
    if (apply('line2')) {
      if (isErr) line2Inv = true;
      else line2Warn = true;
    }
    if (apply('city')) {
      if (isErr) cityInv = true;
      else cityWarn = true;
    }
    if (apply('district')) {
      if (isErr) districtInv = true;
      else districtWarn = true;
    }
    if (apply('state')) {
      if (isErr) stateInv = true;
      else stateWarn = true;
    }
    if (apply('postalCode')) {
      if (isErr) postalInv = true;
      else postalWarn = true;
    }
    if (apply('country')) {
      if (isErr) countryInv = true;
      else countryWarn = true;
    }
  }

  const line1Warning = !line1Inv && line1Warn;
  const line2Warning = !line2Inv && line2Warn;
  const cityWarning = !cityInv && cityWarn;
  const districtWarning = !districtInv && districtWarn;
  const stateWarning = !stateInv && stateWarn;
  const postalCodeWarning = !postalInv && postalWarn;
  const countryWarning = !countryInv && countryWarn;

  return {
    line1Invalid: line1Inv,
    line1Warning,
    line2Invalid: line2Inv,
    line2Warning,
    cityInvalid: cityInv,
    cityWarning,
    districtInvalid: districtInv,
    districtWarning,
    stateInvalid: stateInv,
    stateWarning,
    postalCodeInvalid: postalInv,
    postalCodeWarning,
    countryInvalid: countryInv,
    countryWarning,
    hasAnyError: line1Inv || line2Inv || cityInv || districtInv || stateInv || postalInv || countryInv,
    hasAnyWarning:
      line1Warning ||
      line2Warning ||
      cityWarning ||
      districtWarning ||
      stateWarning ||
      postalCodeWarning ||
      countryWarning,
  };
}

/**
 * Returns `true` when the given `part` has an error in either a pre-computed
 * `AddressPartValidationState` or raw `EmrValidationMessage[]`.
 */
export function isAddressPartInvalid(
  source: AddressPartValidationState | readonly EmrValidationMessage[] | undefined,
  part: EmrAddressPart,
): boolean {
  if (!source) return false;
  const state = Array.isArray(source)
    ? resolveAddressPartValidation(source as readonly EmrValidationMessage[])
    : (source as AddressPartValidationState);
  switch (part) {
    case 'line1':
      return state.line1Invalid;
    case 'line2':
      return state.line2Invalid;
    case 'city':
      return state.cityInvalid;
    case 'district':
      return state.districtInvalid;
    case 'state':
      return state.stateInvalid;
    case 'postalCode':
      return state.postalCodeInvalid;
    case 'country':
      return state.countryInvalid;
  }
}

/**
 * Returns `true` when any field of `EmrAddressValue` holds a non-empty string.
 */
export function hasAnyAddressValue(value: Partial<EmrAddressValue> | null | undefined): boolean {
  if (!value) return false;
  return Boolean(
    value.line1 ||
    value.line2 ||
    value.city ||
    value.district ||
    value.state ||
    value.postalCode ||
    value.country,
  );
}

// 10. EmrMacroTextField (Narrative note field with controlled '.' / '/' SmartPhrase expansion)
export interface EmrMacroSuggestion {
  readonly trigger: string;
  readonly label: string;
  readonly expansionPreview: string;
  readonly category?: string;
}

export interface MacroTextFieldViewModel {
  readonly definition?: EmrFieldDefinition;
  readonly label: string;
  readonly value: string;
  readonly suggestions: readonly EmrMacroSuggestion[];
  readonly suggestionsOpen: boolean;
  readonly dictating?: boolean;
  readonly dictationEnabled?: boolean;
  readonly clearable?: boolean;
  readonly maxLength?: number;
  readonly showCounter?: boolean;
  readonly autoResize?: boolean;
  readonly rows?: number;
  readonly placeholder?: string;
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
  readonly layout?: FieldFrameLayout;
  readonly showMetadata?: boolean;
}

export type MacroTextFieldIntent =
  | { readonly type: 'valueChangeRequested'; readonly value: string }
  | { readonly type: 'macroQueryRequested'; readonly trigger: string }
  | { readonly type: 'macroSelected'; readonly trigger: string }
  | { readonly type: 'macroDismissRequested' }
  | { readonly type: 'dictationToggleRequested' }
  | { readonly type: 'clearRequested' }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

export interface MacroTriggerExpansionResult {
  readonly value: string;
  readonly cursor: number;
}

export interface MacroValidationState {
  readonly hasError: boolean;
  readonly hasWarning: boolean;
}

/**
 * Extracts a trailing `.phrase` or `/phrase` SmartPhrase trigger immediately before `cursorIndex`
 * when preceded by start-of-input or whitespace. Rejects numeric decimals (`.5`, `12.5`),
 * fractions (`6/6`), slash pairs (`OD/OS`), and trailing whitespace (`. `).
 */
export function extractActiveMacroTrigger(
  text: string,
  cursorIndex: number = text.length,
): string | null {
  if (!text) return null;
  const safeCursor = Math.max(0, Math.min(text.length, cursorIndex));
  const prefix = text.slice(0, safeCursor);
  const match = /(?:^|\s)([./][A-Za-z][A-Za-z0-9_-]*|[./])$/.exec(prefix);
  return match ? match[1]! : null;
}

/**
 * Replaces the active macro trigger immediately preceding `cursorIndex` (or inserts at `cursorIndex`
 * when no active trigger is present) and returns the updated text and cursor position.
 */
export function expandMacroTriggerAtCursor(
  text: string,
  cursorIndex: number,
  expansion: string,
): MacroTriggerExpansionResult {
  const safeCursor = Math.max(0, Math.min(text.length, cursorIndex));
  const trigger = extractActiveMacroTrigger(text, safeCursor);
  const start = trigger ? safeCursor - trigger.length : safeCursor;
  const before = text.slice(0, start);
  const after = text.slice(safeCursor);
  return {
    value: `${before}${expansion}${after}`,
    cursor: before.length + expansion.length,
  };
}

/**
 * Resolves error/warning flags for `EmrMacroTextField`, suppressing warning border styling
 * whenever an error message is also present.
 */
export function hasMacroValidationState(
  messages?: readonly EmrValidationMessage[],
): MacroValidationState {
  let hasError = false;
  let hasWarn = false;
  for (const m of messages ?? []) {
    if (m.severity === 'error') hasError = true;
    else if (m.severity === 'warning') hasWarn = true;
  }
  return {
    hasError,
    hasWarning: !hasError && hasWarn,
  };
}

// 11. EmrLateralityField (OD/OS/OU or Right/Left/Bilateral with optional surgical-site confirmation)
export type EmrLateralityCode =
  | 'OD'
  | 'OS'
  | 'OU'
  | 'right'
  | 'left'
  | 'bilateral'
  | 'unilateral-unspecified';

export type EmrLateralityDomain = 'ophthalmic' | 'anatomic' | 'anatomical';
export type LateralityDomain = EmrLateralityDomain;

export interface LateralityOption {
  readonly code: EmrLateralityCode;
  readonly label: string;
  readonly shortLabel?: string;
  readonly description?: string;
  readonly icon?: string;
  readonly ariaLabel?: string;
  readonly readOnly?: boolean;
  readonly disabled?: boolean;
  readonly tone?: EmrTone;
}

export interface LateralityFieldViewModel {
  readonly label: string;
  readonly definition?: EmrFieldDefinition;
  readonly domain?: EmrLateralityDomain;
  readonly value: EmrLateralityCode | null;
  readonly options?: readonly LateralityOption[];
  readonly requiresConfirmation?: boolean;
  readonly confirmed?: boolean;
  readonly confirmationLabel?: string;
  readonly layout?: FieldFrameLayout;
  readonly showMetadata?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly clearable?: boolean;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type LateralityFieldIntent =
  | { readonly type: 'lateralitySelected'; readonly code: EmrLateralityCode | null }
  | { readonly type: 'confirmationChangeRequested'; readonly confirmed: boolean }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

export interface LateralityValidationState {
  readonly groupHasError: boolean;
  readonly groupHasWarning: boolean;
  readonly confirmationHasError: boolean;
  readonly confirmationHasWarning: boolean;
}

export const DEFAULT_LATERALITY_CONFIRMATION_LABEL = 'Surgical site and laterality verified';

export const OPHTHALMIC_LATERALITY_OPTIONS: readonly LateralityOption[] = [
  { code: 'OD', label: 'Right Eye', shortLabel: 'OD' },
  { code: 'OS', label: 'Left Eye', shortLabel: 'OS' },
  { code: 'OU', label: 'Both Eyes', shortLabel: 'OU' },
];

export const ANATOMIC_LATERALITY_OPTIONS: readonly LateralityOption[] = [
  { code: 'right', label: 'Right', shortLabel: 'R' },
  { code: 'left', label: 'Left', shortLabel: 'L' },
  { code: 'bilateral', label: 'Bilateral', shortLabel: 'BIL' },
  { code: 'unilateral-unspecified', label: 'Unilateral (unspecified)', shortLabel: 'U' },
];

/**
 * Normalizes `'ophthalmic' | 'anatomic' | 'anatomical'` into `'ophthalmic' | 'anatomic'`,
 * inferring `'ophthalmic'` when `domain` is omitted and `options` contain `'OD' | 'OS' | 'OU'`.
 */
export function normalizeLateralityDomain(
  domain?: EmrLateralityDomain,
  options?: readonly LateralityOption[],
): 'ophthalmic' | 'anatomic' {
  if (domain === 'ophthalmic') return 'ophthalmic';
  if (domain === 'anatomic' || domain === 'anatomical') return 'anatomic';
  if (options?.some((o) => o.code === 'OD' || o.code === 'OS' || o.code === 'OU')) {
    return 'ophthalmic';
  }
  return 'anatomic';
}

/**
 * Returns non-empty `model.options` or the canonical preset list for `model.domain`.
 */
export function resolveLateralityOptions(
  model: Pick<LateralityFieldViewModel, 'domain' | 'options'>,
): readonly LateralityOption[] {
  if (model.options && model.options.length > 0) return model.options;
  return normalizeLateralityDomain(model.domain) === 'ophthalmic'
    ? OPHTHALMIC_LATERALITY_OPTIONS
    : ANATOMIC_LATERALITY_OPTIONS;
}

/**
 * Splits `EmrValidationMessage[]` into independent radiogroup vs. confirmation checkbox
 * error/warning flags, suppressing warnings on a part whenever that part has an error.
 */
export function resolveLateralityValidation(
  messages?: readonly EmrValidationMessage[],
): LateralityValidationState {
  let groupHasError = false;
  let groupHasWarning = false;
  let confirmationHasError = false;
  let confirmationHasWarning = false;

  for (const m of messages ?? []) {
    if (m.severity !== 'error' && m.severity !== 'warning') continue;
    const rawLast = m.path.length > 0 ? m.path[m.path.length - 1] : undefined;
    const last = typeof rawLast === 'string' ? rawLast.trim().toLowerCase() : '';
    const isConfirm =
      last === 'confirmed' || last === 'confirmation' || last === 'confirm';
    if (isConfirm) {
      if (m.severity === 'error') confirmationHasError = true;
      else confirmationHasWarning = true;
    } else {
      if (m.severity === 'error') groupHasError = true;
      else groupHasWarning = true;
    }
  }

  return {
    groupHasError,
    groupHasWarning: !groupHasError && groupHasWarning,
    confirmationHasError,
    confirmationHasWarning: !confirmationHasError && confirmationHasWarning,
  };
}

// 12. EmrVisualAcuityField (Snellen / LogMAR / ETDRS + Low Vision + Pinhole)
export type EmrAcuityNotation = 'snellen-m' | 'snellen-ft' | 'logmar' | 'etdrs' | 'low-vision';
export type EmrAcuityCorrection = 'unaided' | 'habitual' | 'best-corrected' | 'contact-lens';

export interface VisualAcuityFieldLabels {
  readonly notationLabel?: string;
  readonly correctionLabel?: string;
  readonly valueLabel?: string;
  readonly pinholeLabel?: string;
  readonly derivedLabel?: string;
  readonly clearLabel?: string;
  readonly eyeDescriptions?: Partial<Record<'OD' | 'OS' | 'OU', string>>;
}

export interface VisualAcuityFieldViewModel {
  readonly definition?: EmrFieldDefinition;
  readonly label: string;
  readonly eye?: 'OD' | 'OS' | 'OU';
  readonly notation: EmrAcuityNotation;
  readonly notationOptions: readonly EmrSegmentedOption<EmrAcuityNotation>[];
  readonly correction: EmrAcuityCorrection;
  readonly correctionOptions: readonly EmrSegmentedOption<EmrAcuityCorrection>[];
  readonly value: string | null;
  readonly valueOptions: readonly ClinicalOption[];
  readonly valuePlaceholder?: string;
  readonly pinholeValue?: string | null;
  readonly pinholeOptions?: readonly ClinicalOption[];
  readonly pinholePlaceholder?: string;
  readonly pinholeRequired?: boolean;
  readonly showPinhole?: boolean;
  readonly derivedDisplay?: string;
  readonly derivedTone?: EmrTone;
  readonly labels?: VisualAcuityFieldLabels;
  readonly layout?: FieldFrameLayout;
  readonly showMetadata?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly clearable?: boolean;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type VisualAcuityFieldIntent =
  | { readonly type: 'notationChangeRequested'; readonly notation: EmrAcuityNotation }
  | { readonly type: 'correctionChangeRequested'; readonly correction: EmrAcuityCorrection }
  | { readonly type: 'valueChangeRequested'; readonly value: string | null }
  | { readonly type: 'pinholeChangeRequested'; readonly value: string | null }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

export interface VisualAcuityPartValidationState {
  readonly rootHasError: boolean;
  readonly rootHasWarning: boolean;
  readonly valueHasError: boolean;
  readonly valueHasWarning: boolean;
  readonly pinholeHasError: boolean;
  readonly pinholeHasWarning: boolean;
  readonly notationHasError: boolean;
  readonly notationHasWarning: boolean;
  readonly correctionHasError: boolean;
  readonly correctionHasWarning: boolean;
  readonly valueMessage?: string;
  readonly pinholeMessage?: string;
  readonly notationMessage?: string;
  readonly correctionMessage?: string;
}

const DEFAULT_EYE_DESCRIPTIONS: Record<'OD' | 'OS' | 'OU', string> = {
  OD: 'Right eye (OD)',
  OS: 'Left eye (OS)',
  OU: 'Both eyes (OU)',
};

/**
 * Resolves an expanded, screen-reader-friendly laterality description for `OD` / `OS` / `OU`.
 */
export function resolveVisualAcuityEyeDescription(
  eye: 'OD' | 'OS' | 'OU',
  labels?: VisualAcuityFieldLabels,
): string {
  return labels?.eyeDescriptions?.[eye] ?? DEFAULT_EYE_DESCRIPTIONS[eye];
}

/**
 * Routes `EmrValidationMessage.path` entries to `value`, `pinhole`, `notation`, or `correction`
 * sub-controls. Root/un-scoped errors propagate onto primary `value` when no sub-part explicitly
 * owns an error; warnings are suppressed on any part that already has an error.
 */
export function resolveVisualAcuityPartValidation(
  messages?: readonly EmrValidationMessage[],
): VisualAcuityPartValidationState {
  let rootHasError = false;
  let rootHasWarning = false;
  let valueErr = false;
  let valueWarn = false;
  let pinholeErr = false;
  let pinholeWarn = false;
  let notationErr = false;
  let notationWarn = false;
  let correctionErr = false;
  let correctionWarn = false;

  const valueErrors: string[] = [];
  const valueWarnings: string[] = [];
  const pinholeErrors: string[] = [];
  const pinholeWarnings: string[] = [];
  const notationErrors: string[] = [];
  const notationWarnings: string[] = [];
  const correctionErrors: string[] = [];
  const correctionWarnings: string[] = [];

  const pushUnique = (list: string[], text?: string) => {
    const trimmed = typeof text === 'string' ? text.trim() : '';
    if (trimmed && !list.includes(trimmed)) list.push(trimmed);
  };

  for (const m of messages ?? []) {
    if (m.severity !== 'error' && m.severity !== 'warning') continue;
    const isErr = m.severity === 'error';
    const rawLast = m.path && m.path.length > 0 ? m.path[m.path.length - 1] : undefined;
    const last = typeof rawLast === 'string' ? rawLast.trim().toLowerCase() : '';

    if (last === 'value' || last === 'acuity') {
      if (isErr) {
        valueErr = true;
        pushUnique(valueErrors, m.message);
      } else {
        valueWarn = true;
        pushUnique(valueWarnings, m.message);
      }
    } else if (last === 'pinhole' || last === 'pinholevalue' || last === 'pinhole_value') {
      if (isErr) {
        pinholeErr = true;
        pushUnique(pinholeErrors, m.message);
      } else {
        pinholeWarn = true;
        pushUnique(pinholeWarnings, m.message);
      }
    } else if (last === 'notation') {
      if (isErr) {
        notationErr = true;
        pushUnique(notationErrors, m.message);
      } else {
        notationWarn = true;
        pushUnique(notationWarnings, m.message);
      }
    } else if (last === 'correction') {
      if (isErr) {
        correctionErr = true;
        pushUnique(correctionErrors, m.message);
      } else {
        correctionWarn = true;
        pushUnique(correctionWarnings, m.message);
      }
    } else {
      if (isErr) rootHasError = true;
      else rootHasWarning = true;
    }
  }

  const anyPartError = valueErr || pinholeErr || notationErr || correctionErr;
  const anyPartWarning = valueWarn || pinholeWarn || notationWarn || correctionWarn;

  const valueHasError = valueErr || (rootHasError && !anyPartError);
  const pinholeHasError = pinholeErr;
  const notationHasError = notationErr;
  const correctionHasError = correctionErr;

  const valueHasWarning =
    !valueHasError && (valueWarn || (rootHasWarning && !anyPartError && !anyPartWarning));
  const pinholeHasWarning = !pinholeHasError && pinholeWarn;
  const notationHasWarning = !notationHasError && notationWarn;
  const correctionHasWarning = !correctionHasError && correctionWarn;

  const pickMsg = (errs: string[], warns: string[], hasErr: boolean, hasWarn: boolean): string | undefined => {
    if (hasErr && errs.length > 0) return errs.join(' · ');
    if (hasWarn && warns.length > 0) return warns.join(' · ');
    return undefined;
  };

  return {
    rootHasError,
    rootHasWarning: !rootHasError && rootHasWarning,
    valueHasError,
    valueHasWarning,
    pinholeHasError,
    pinholeHasWarning,
    notationHasError,
    notationHasWarning,
    correctionHasError,
    correctionHasWarning,
    valueMessage: pickMsg(valueErrors, valueWarnings, valueHasError, valueHasWarning),
    pinholeMessage: pickMsg(pinholeErrors, pinholeWarnings, pinholeHasError, pinholeHasWarning),
    notationMessage: pickMsg(notationErrors, notationWarnings, notationHasError, notationHasWarning),
    correctionMessage: pickMsg(correctionErrors, correctionWarnings, correctionHasError, correctionHasWarning),
  };
}

// 13. EmrRefractionField (Sphere / Cylinder / Axis / Add clinical refraction)
export type EmrRefractionPart = 'sphere' | 'cylinder' | 'axis' | 'nearAdd';

export interface EmrRefractionValue {
  readonly sphere: number | null;
  readonly cylinder: number | null;
  readonly axis: number | null;
  readonly nearAdd?: number | null;
}

export interface RefractionFieldViewModel {
  readonly label: string;
  readonly definition?: EmrFieldDefinition;
  readonly eye?: 'OD' | 'OS';
  readonly value: EmrRefractionValue;
  readonly sphereMin?: number;
  readonly sphereMax?: number;
  readonly sphereStep?: number;
  readonly cylinderMin?: number;
  readonly cylinderMax?: number;
  readonly cylinderStep?: number;
  readonly axisMin?: number;
  readonly axisMax?: number;
  readonly axisStep?: number;
  readonly nearAddMin?: number;
  readonly nearAddMax?: number;
  readonly nearAddStep?: number;
  readonly showNearAdd?: boolean;
  readonly formattedSummary?: string;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
  readonly layout?: FieldFrameLayout;
  readonly showMetadata?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly clearable?: boolean;
}

export type RefractionFieldIntent =
  | { readonly type: 'sphereChangeRequested'; readonly sphere: number | null }
  | { readonly type: 'cylinderChangeRequested'; readonly cylinder: number | null }
  | { readonly type: 'axisChangeRequested'; readonly axis: number | null }
  | { readonly type: 'nearAddChangeRequested'; readonly nearAdd: number | null }
  | { readonly type: 'clearRequested' }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

export interface RefractionPartConfig {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly precision: number;
  readonly unit: string;
  readonly label: string;
}

export const REFRACTION_DEFAULT_BOUNDS: Readonly<Record<EmrRefractionPart, RefractionPartConfig>> = {
  sphere: { min: -30, max: 30, step: 0.25, precision: 2, unit: 'D', label: 'Sphere (SPH)' },
  cylinder: { min: -15, max: 15, step: 0.25, precision: 2, unit: 'D', label: 'Cylinder (CYL)' },
  axis: { min: 1, max: 180, step: 1, precision: 0, unit: '°', label: 'Axis' },
  nearAdd: { min: 0, max: 6, step: 0.25, precision: 2, unit: 'D', label: 'Near Add' },
};

export interface RefractionPartValidationState {
  readonly hasError: boolean;
  readonly hasWarning: boolean;
}

const REFRACTION_PARTS: readonly EmrRefractionPart[] = ['sphere', 'cylinder', 'axis', 'nearAdd'];

/**
 * Evaluates per-part error/warning state from `EmrValidationMessage.path` for `EmrRefractionField`.
 * - A message targets `part` if its `path` includes or ends with `part`.
 * - A whole-field message (empty path or path mentioning none of the 4 parts) applies to all parts.
 * - Warnings are suppressed on a part that already has an error (`hasError` takes precedence).
 */
export function resolveRefractionPartValidation(
  messages: readonly EmrValidationMessage[] | undefined,
  part: EmrRefractionPart,
): RefractionPartValidationState {
  let hasError = false;
  let rawWarning = false;
  for (const m of messages ?? []) {
    if (m.severity !== 'error' && m.severity !== 'warning') continue;
    const path = m.path ?? [];
    const mentionsAnyPart = path.some(
      (seg) => typeof seg === 'string' && (REFRACTION_PARTS as readonly string[]).includes(seg),
    );
    const targetsThisPart = path.includes(part) || !mentionsAnyPart;
    if (!targetsThisPart) continue;
    if (m.severity === 'error') hasError = true;
    else rawWarning = true;
  }
  return { hasError, hasWarning: !hasError && rawWarning };
}

/**
 * Formats a refraction sub-value to fixed precision for unfocused display (e.g. `-2` -> `'-2.00'`, `90` -> `'90'`).
 */
export function formatRefractionPartDisplay(
  value: number | null | undefined,
  precision: number,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  const d = Math.max(0, Math.min(6, Math.floor(precision)));
  const normalized = Number(value.toFixed(d));
  const safe = Object.is(normalized, -0) ? 0 : normalized;
  return safe.toFixed(d);
}

/**
 * Returns `true` when any visible refraction measurement part is populated.
 */
export function hasRefractionValue(
  value: EmrRefractionValue | null | undefined,
  showNearAdd?: boolean,
): boolean {
  if (!value) return false;
  return (
    value.sphere != null ||
    value.cylinder != null ||
    value.axis != null ||
    Boolean(showNearAdd && value.nearAdd != null)
  );
}

/**
 * Resolves accessible long description for ophthalmic eye badge (`OD` / `OS`).
 */
export function resolveRefractionEyeDescription(eye: 'OD' | 'OS'): string {
  return eye === 'OD' ? 'Right eye (OD)' : 'Left eye (OS)';
}

/**
 * Steps a refraction sub-value up or down by `step` within `[min, max]`, avoiding floating-point drift
 * and starting from `0` (when `0` is in range) or `min`/`max` when the current value is `null`.
 */
export function stepRefractionPart(options: {
  readonly current: number | null;
  readonly delta: -1 | 1;
  readonly part: EmrRefractionPart;
  readonly step?: number;
  readonly min?: number;
  readonly max?: number;
}): number {
  const cfg = REFRACTION_DEFAULT_BOUNDS[options.part];
  const mode: 'decimal' | 'integer' = cfg.precision === 0 ? 'integer' : 'decimal';
  const min = options.min ?? cfg.min;
  const max = options.max ?? cfg.max;
  const step = resolvePairedNumberStep({
    mode,
    precision: cfg.precision,
    step: options.step ?? cfg.step,
  });

  let raw: number;
  if (options.current === null || !Number.isFinite(options.current)) {
    if (min > 0) raw = min;
    else if (max < 0) raw = max;
    else raw = options.delta * step;
  } else {
    raw = options.current + options.delta * step;
  }

  let next =
    mode === 'integer'
      ? Math.round(raw)
      : Number(raw.toFixed(cfg.precision));
  if (next < min) next = min;
  if (next > max) next = max;
  return Object.is(next, -0) ? 0 : next;
}
