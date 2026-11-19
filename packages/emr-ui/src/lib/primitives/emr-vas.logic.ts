import type {
  EmrVasAnchorsProp,
  EmrVasAnchorsSummary,
  EmrVasOrientation,
  EmrVasPrecision,
  EmrVasSize,
  EmrVasTick,
} from '@drguptavivek/emr-controller';

export type { EmrVasAnchorsProp, EmrVasAnchorsSummary, EmrVasOrientation, EmrVasPrecision, EmrVasSize, EmrVasTick };

export const EMR_VAS_MAX_TICKS = 400;
export const EMR_VAS_TRACK_INSET_PX = 14;

export function resolveVasStep(
  min: number,
  max: number,
  step?: number,
  precision: EmrVasPrecision = 'integer',
): number {
  if (typeof step === 'number' && Number.isFinite(step) && step >= 0) return step;
  if (precision === 'decimal') return Math.abs(max - min) <= 20 ? 0.1 : 0.5;
  return 1;
}

export function vasPercent(value: number, min: number, max: number): number {
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return 0;
  return Math.max(0, Math.min(100, ((value - min) / span) * 100));
}

export function snapVasValue(raw: number, min: number, max: number, step: number): number {
  const clamped = Math.max(min, Math.min(max, raw));
  if (!Number.isFinite(step) || step <= 0) return Number(clamped.toFixed(4));
  const snapped = min + Math.round((clamped - min) / step) * step;
  const bounded = Math.max(min, Math.min(max, snapped));
  return Number(bounded.toFixed(6));
}

export function vasValueFromOffset(
  offset: number,
  length: number,
  min: number,
  max: number,
  step: number,
  vertical = false,
  inset = EMR_VAS_TRACK_INSET_PX,
): number {
  const effectiveLength = Math.max(1, length - inset * 2);
  const clampedOffset = Math.max(inset, Math.min(length - inset, offset));
  const rawFraction = (clampedOffset - inset) / effectiveLength;
  const fraction = vertical ? 1 - rawFraction : rawFraction;
  return snapVasValue(min + fraction * (max - min), min, max, step);
}

export function resolveVasAnchors(
  anchors: EmrVasAnchorsProp | undefined,
  min: number,
  max: number,
): EmrVasAnchorsSummary {
  if (!anchors) return { minLabel: null, midLabel: null, maxLabel: null };
  if (!Array.isArray(anchors)) {
    const obj = anchors as { minLabel?: string; midLabel?: string; maxLabel?: string };
    return {
      minLabel: obj.minLabel ?? null,
      midLabel: obj.midLabel ?? null,
      maxLabel: obj.maxLabel ?? null,
    };
  }
  if (anchors.length === 0) return { minLabel: null, midLabel: null, maxLabel: null };
  const midTarget = min + (max - min) / 2;
  const span = Math.max(1e-6, Math.abs(max - min));
  let minLabel: string | null = null;
  let midLabel: string | null = null;
  let maxLabel: string | null = null;
  for (const a of anchors) {
    if (Math.abs(a.value - min) <= span * 0.05) {
      minLabel = a.label;
    } else if (Math.abs(a.value - max) <= span * 0.05) {
      maxLabel = a.label;
    } else if (Math.abs(a.value - midTarget) <= span * 0.15) {
      midLabel = a.label;
    }
  }
  return { minLabel, midLabel, maxLabel };
}

export function formatVasValue(
  value: number | null | undefined,
  step: number,
  unmarkedLabel = 'Unmarked',
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return unmarkedLabel;
  if (step > 0 && step < 1) {
    const decimals = Math.min(3, Math.max(1, Math.ceil(-Math.log10(step))));
    return value.toFixed(decimals);
  }
  return String(Number(value.toFixed(2)));
}

export function resolveVasTicks(
  min: number,
  max: number,
  majorInterval = 10,
  minorInterval?: number,
  maxTicks = EMR_VAS_MAX_TICKS,
): readonly EmrVasTick[] {
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return [];
  const major = Number.isFinite(majorInterval) && majorInterval > 0 ? majorInterval : span;
  const minor =
    typeof minorInterval === 'number' && Number.isFinite(minorInterval) && minorInterval > 0
      ? minorInterval
      : major;
  const step = Math.min(major, minor);
  const count = Math.min(maxTicks, Math.floor(span / step + 1e-6) + 1);
  const ticks: EmrVasTick[] = [];
  for (let i = 0; i < count; i += 1) {
    const val = Number((min + i * step).toFixed(6));
    if (val > max + 1e-6) break;
    const isMajor = Math.abs(((val - min) / major) - Math.round((val - min) / major)) < 1e-4;
    ticks.push({
      value: val,
      percent: vasPercent(val, min, max),
      major: isMajor,
      label: isMajor ? String(Number(val.toFixed(4))) : null,
    });
  }
  return ticks;
}

export function resolveVasKeyValue(
  key: string,
  currentValue: number | null | undefined,
  options: { readonly min: number; readonly max: number; readonly step: number; readonly majorInterval?: number },
): number | null {
  const { min, max, step, majorInterval = 10 } = options;
  const fine = step > 0 ? step : Math.abs(max - min) <= 20 ? 0.1 : 1;
  const coarse = majorInterval > 0 ? majorInterval : fine * 10;
  const cur = currentValue !== null && currentValue !== undefined && Number.isFinite(currentValue) ? currentValue : min;
  switch (key) {
    case 'Home':
      return min;
    case 'End':
      return max;
    case 'ArrowRight':
    case 'ArrowUp':
      return snapVasValue(currentValue == null ? min : cur + fine, min, max, step);
    case 'ArrowLeft':
    case 'ArrowDown':
      return snapVasValue(currentValue == null ? max : cur - fine, min, max, step);
    case 'PageUp':
      return snapVasValue(cur + coarse, min, max, step);
    case 'PageDown':
      return snapVasValue(cur - coarse, min, max, step);
    default:
      return null;
  }
}

export function canMutateVas(disabled: boolean, readOnly: boolean): boolean {
  return !disabled && !readOnly;
}
