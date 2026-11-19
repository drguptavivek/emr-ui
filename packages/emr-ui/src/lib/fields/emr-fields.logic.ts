import type {
  AddressFieldViewModel,
  AddressPartValidationState,
  DurationFieldConfigOverrides,
  DurationFieldResolvedConfig,
  DurationFieldViewModel,
  DurationPartValidation,
  EmrAddressPart,
  EmrAddressUse,
  EmrAddressValue,
  EmrDateTimeWireFormat,
  EmrFieldDefinition,
  EmrLateralityDomain,
  EmrQuantityNumericMode,
  EmrRangeKind,
  EmrRangeValue,
  EmrRefractionPart,
  EmrRefractionValue,
  EmrSignaturePoint,
  EmrValidationMessage,
  FieldFrameLayout,
  LateralityFieldViewModel,
  LateralityOption,
  LateralityValidationState,
  MacroTriggerExpansionResult,
  MacroValidationState,
  PairedFieldMode,
  PairedNumberDraftParse,
  PairedSideValidationState,
  PhonePartValidationState,
  RangeFieldValidationOptions,
  RangeFieldViewModel,
  RangeSideValidationState,
  RefractionPartConfig,
  RefractionPartValidationState,
  SignatureCanvasGeometry,
  SignatureCaptureViewModel,
  SignatureClientRect,
  SignatureValidationState,
  VisualAcuityFieldLabels,
  VisualAcuityPartValidationState,
} from '@drguptavivek/emr-controller';
import { resolveQuantityStep } from '../primitives/emr-inputs.logic';

/**
 * Resolves per-side error/warning states from `EmrValidationMessage.path` without runtime
 * imports from `@drguptavivek/emr-controller` so Angular SSR bundles remain type-only.
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

/**
 * Parses a numeric draft on a paired field side while preserving incomplete drafts and
 * never silently dropping or clamping out-of-range valid numbers on typing.
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

export function normalizeFieldLayout(layout?: FieldFrameLayout): FieldFrameLayout {
  return layout === 'horizontal' || layout === 'inline' ? layout : 'vertical';
}

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
    layout: normalizeFieldLayout(overrides?.layout ?? model.layout),
    showMetadata: (overrides?.showMetadata ?? true) && model.showMetadata !== false,
    labelHidden: Boolean(overrides?.labelHidden || model.labelHidden),
    readOnly: Boolean(overrides?.readOnly || model.readOnly || def?.contract?.readOnly),
    required: Boolean(overrides?.required || model.required || (minCard !== undefined && minCard >= 1)),
    hint: overrides?.hint ?? model.hint ?? def?.presentation?.hint,
  };
}

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

export function isRangeInverted(
  kind: EmrRangeKind,
  value: EmrRangeValue | null | undefined,
  wireFormat: EmrDateTimeWireFormat = 'utc',
): boolean {
  if (!value) return false;
  return compareRangeBounds(kind, value.low, value.high, wireFormat) === 1;
}

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

export function resolveRangeNumericMode(
  numericMode?: 'decimal' | 'integer',
  precision?: number,
  definition?: EmrFieldDefinition,
): 'decimal' | 'integer' {
  if (numericMode === 'integer' || numericMode === 'decimal') return numericMode;
  if (precision === 0 || definition?.contract?.valueType === 'integer') return 'integer';
  return 'decimal';
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

/**
 * Mirrors `@drguptavivek/emr-controller` `resolvePhonePartValidation` for Angular SSR type-only imports.
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

export function isPhoneExtensionVisible(showExtension?: boolean, extension?: string): boolean {
  if (showExtension === false) return false;
  if (showExtension === true) return true;
  return extension !== undefined;
}

export function hasPhoneClearableValue(nationalNumber?: string, extension?: string): boolean {
  return Boolean(nationalNumber || extension);
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
 * Mirrors `@drguptavivek/emr-controller` `resolveAddressRootMessages` for Angular SSR type-only imports.
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
 * Mirrors `@drguptavivek/emr-controller` `resolveAddressPartValidation` for Angular SSR type-only imports.
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

export function resolveLateralityOptions(
  model: Pick<LateralityFieldViewModel, 'domain' | 'options'>,
): readonly LateralityOption[] {
  if (model.options && model.options.length > 0) return model.options;
  return normalizeLateralityDomain(model.domain) === 'ophthalmic'
    ? OPHTHALMIC_LATERALITY_OPTIONS
    : ANATOMIC_LATERALITY_OPTIONS;
}

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

const DEFAULT_VA_EYE_DESCRIPTIONS: Record<'OD' | 'OS' | 'OU', string> = {
  OD: 'Right eye (OD)',
  OS: 'Left eye (OS)',
  OU: 'Both eyes (OU)',
};

export function resolveVisualAcuityEyeDescription(
  eye: 'OD' | 'OS' | 'OU',
  labels?: VisualAcuityFieldLabels,
): string {
  return labels?.eyeDescriptions?.[eye] ?? DEFAULT_VA_EYE_DESCRIPTIONS[eye];
}

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

export const REFRACTION_DEFAULT_BOUNDS: Readonly<Record<EmrRefractionPart, RefractionPartConfig>> = {
  sphere: { min: -30, max: 30, step: 0.25, precision: 2, unit: 'D', label: 'Sphere (SPH)' },
  cylinder: { min: -15, max: 15, step: 0.25, precision: 2, unit: 'D', label: 'Cylinder (CYL)' },
  axis: { min: 1, max: 180, step: 1, precision: 0, unit: '°', label: 'Axis' },
  nearAdd: { min: 0, max: 6, step: 0.25, precision: 2, unit: 'D', label: 'Near Add' },
};

const REFRACTION_PARTS: readonly EmrRefractionPart[] = ['sphere', 'cylinder', 'axis', 'nearAdd'];

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

export function resolveRefractionEyeDescription(eye: 'OD' | 'OS'): string {
  return eye === 'OD' ? 'Right eye (OD)' : 'Left eye (OS)';
}

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
