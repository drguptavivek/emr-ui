import type {
  EmrCodedValue,
  EmrFieldDefinition,
  EmrPartialDate,
  EmrSignatureStroke,
} from '@drguptavivek/emr-controller';

export interface CodedChip {
  readonly concept: EmrCodedValue;
  readonly key: string;
  readonly system: string;
}

export const codedConceptKey = (c: EmrCodedValue): string => `${c.system}|${c.code}`;

/** Normalises a single concept, concept array, or null into display chips with resolved system names. */
export const codedInputChips = (
  value: EmrCodedValue | readonly EmrCodedValue[] | null,
  systemLabels?: Readonly<Record<string, string>>,
): CodedChip[] => {
  const list =
    value === null ? [] : Array.isArray(value) ? (value as readonly EmrCodedValue[]) : [value as EmrCodedValue];
  return list.map(concept => ({
    concept,
    key: codedConceptKey(concept),
    system: systemLabels?.[concept.system] ?? concept.system,
  }));
};

// Spreads `amounts` first so an existing slot keeps controller-added fields such as `householdLabel`.
export {
  ANATOMIC_LATERALITY_OPTIONS,
  DEFAULT_ADDRESS_REQUIRED_PARTS,
  DEFAULT_ADDRESS_USE_OPTIONS,
  DEFAULT_LATERALITY_CONFIRMATION_LABEL,
  OPHTHALMIC_LATERALITY_OPTIONS,
  REFRACTION_DEFAULT_BOUNDS,
  applySlotPreset,
  compareRangeBounds,
  expandMacroTriggerAtCursor,
  extractActiveMacroTrigger,
  extractDurationPartValidation,
  formatRefractionPartDisplay,
  formatSignatureAttestation,
  formatSlotReadout,
  hasAnyAddressValue,
  hasMacroValidationState,
  hasPhoneClearableValue,
  hasRefractionValue,
  hasSignatureValidationState,
  isAddressPartInvalid,
  isPhoneExtensionVisible,
  isPresetActive,
  isRangeInverted,
  isSignaturePadLocked,
  mapPointerToSignaturePoint,
  mergeFieldFrameMessages,
  normalizeFieldFrameLayout,
  normalizeLateralityDomain,
  parsePairedNumberDraft,
  resolveAddressPartValidation,
  resolveAddressRootMessages,
  resolveDurationFieldConfig,
  resolveLateralityOptions,
  resolveLateralityValidation,
  resolvePairedNumberStep,
  resolvePairedSideMode,
  resolvePairedSideValidation,
  resolvePhonePartValidation,
  resolveRangeFieldMessages,
  resolveRangeSideValidation,
  resolveRefractionEyeDescription,
  resolveRefractionPartValidation,
  resolveSignatureCanvasGeometry,
  resolveVisualAcuityEyeDescription,
  resolveVisualAcuityPartValidation,
  sanitizePairedNumberText,
  setSlotAmount,
  stepPairedNumber,
  stepRefractionPart,
  toggleSlot,
  validateRangeField,
} from '@drguptavivek/emr-controller';

export function resolveRangeNumericMode(
  numericMode?: 'decimal' | 'integer',
  precision?: number,
  definition?: EmrFieldDefinition,
): 'decimal' | 'integer' {
  if (numericMode === 'integer' || numericMode === 'decimal') return numericMode;
  if (precision === 0 || definition?.contract?.valueType === 'integer') return 'integer';
  return 'decimal';
}

// ---------------------------------------------------------------------------
// Pure helpers for L2 contract & specialty fields
// ---------------------------------------------------------------------------

/**
 * Detects a trailing SmartPhrase / macro token starting with `.` or `/` at the end of `text`
 * when preceded by start-of-input or whitespace (e.g. `"Fundus: .mac"` -> `".mac"`).
 * Never matches decimals (`"12.5"`) or dates (`"12/05"`).
 */
export function extractTrailingMacroToken(text: string): string | null {
  if (!text) return null;
  const match = /(?:^|\s)([./][A-Za-z][A-Za-z0-9_-]*|[./])$/.exec(text);
  return match ? match[1]! : null;
}

/** Formats attachment byte size mechanically (`"512 B"`, `"14.2 KB"`, `"2.4 MB"`). */
export { formatByteSize } from '@drguptavivek/emr-controller';

/** Converts `ScaleFieldViewModel['anchors']` into L1 `EmrScaleAnchor` entries. */
export function buildScaleAnchors(
  min: number,
  max: number,
  anchors?: { readonly minLabel?: string; readonly midLabel?: string; readonly maxLabel?: string },
  variant: 'likert' | 'vas' = 'likert',
): { value: number; label: string }[] {
  if (!anchors) return [];
  const result: { value: number; label: string }[] = [];
  if (anchors.minLabel) result.push({ value: min, label: anchors.minLabel });
  if (anchors.midLabel) {
    const mid = (min + max) / 2;
    result.push({ value: variant === 'likert' ? Math.round(mid) : mid, label: anchors.midLabel });
  }
  if (anchors.maxLabel) result.push({ value: max, label: anchors.maxLabel });
  return result;
}

/** Adapts an existing ISO partial date string when switching precision (`year` | `month` | `day`). */
export { adaptPartialDateForPrecision as adaptPartialDatePrecision } from '@drguptavivek/emr-controller';

/** Formats SVG polyline points string `"x1,y1 x2,y2 ..."` for web signature rendering. */
export function signaturePolylinePoints(stroke: EmrSignatureStroke): string {
  return stroke.points.map(p => `${Number(p.x.toFixed(1))},${Number(p.y.toFixed(1))}`).join(' ');
}

export interface SignatureSegmentGeometry {
  readonly key: string;
  readonly cx: number;
  readonly cy: number;
  readonly length: number;
  readonly angleDeg: number;
}

/**
 * Projects a stroke from viewBox coordinates into rendered box coordinates using uniform
 * `xMidYMid meet` scaling for React Native `<View>` segment rendering.
 */
export function projectSignatureStrokeForBox(
  stroke: EmrSignatureStroke,
  boxWidth: number,
  boxHeight: number,
  viewBoxWidth = 420,
  viewBoxHeight = 140,
): EmrSignatureStroke {
  const vbW = viewBoxWidth > 0 && Number.isFinite(viewBoxWidth) ? viewBoxWidth : 420;
  const vbH = viewBoxHeight > 0 && Number.isFinite(viewBoxHeight) ? viewBoxHeight : 140;
  if (boxWidth <= 0 || boxHeight <= 0) return stroke;
  const scale = Math.min(boxWidth / vbW, boxHeight / vbH);
  if (!Number.isFinite(scale) || scale <= 0) return stroke;
  const offsetX = (boxWidth - vbW * scale) / 2;
  const offsetY = (boxHeight - vbH * scale) / 2;
  return {
    points: stroke.points.map(p => ({
      x: Number((p.x * scale + offsetX).toFixed(1)),
      y: Number((p.y * scale + offsetY).toFixed(1)),
    })),
  };
}

/**
 * Computes line-segment center, length, and rotation angle in degrees for native View-based
 * signature rendering (zero external native dependencies).
 */
export function computeSignatureSegments(
  stroke: EmrSignatureStroke,
  strokeIndex = 0,
): readonly SignatureSegmentGeometry[] {
  const pts = stroke.points;
  if (pts.length < 2) return [];
  const segments: SignatureSegmentGeometry[] = [];
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]!;
    const curr = pts[i]!;
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const length = Math.hypot(dx, dy);
    if (length < 0.25) continue;
    segments.push({
      key: `${strokeIndex}-${i}`,
      cx: (prev.x + curr.x) / 2,
      cy: (prev.y + curr.y) / 2,
      length,
      angleDeg: (Math.atan2(dy, dx) * 180) / Math.PI,
    });
  }
  return segments;
}
