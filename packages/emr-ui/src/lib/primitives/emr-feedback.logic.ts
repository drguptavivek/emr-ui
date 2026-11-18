import type {
  EmrBadgeShape,
  EmrBadgeSize,
  EmrBadgeVariant,
  EmrChipSize,
  EmrChipVariant,
  EmrStateMessageKind,
  EmrStateMessageSize,
  EmrTone,
} from '@drguptavivek/emr-controller';

const VALID_TONES = new Set<EmrTone>(['neutral', 'info', 'success', 'warning', 'danger']);
const VALID_VARIANTS = new Set<EmrBadgeVariant>(['soft', 'solid', 'outline']);
const VALID_SIZES = new Set<EmrBadgeSize>(['sm', 'md']);
const VALID_SHAPES = new Set<EmrBadgeShape>(['pill', 'rounded']);

export function normalizeEmrBadgeTone(tone?: string | null): EmrTone {
  return tone && VALID_TONES.has(tone as EmrTone) ? (tone as EmrTone) : 'neutral';
}

export function normalizeEmrBadgeVariant(variant?: string | null): EmrBadgeVariant {
  return variant && VALID_VARIANTS.has(variant as EmrBadgeVariant) ? (variant as EmrBadgeVariant) : 'soft';
}

export function normalizeEmrBadgeSize(size?: string | null): EmrBadgeSize {
  return size && VALID_SIZES.has(size as EmrBadgeSize) ? (size as EmrBadgeSize) : 'md';
}

export function normalizeEmrBadgeShape(shape?: string | null): EmrBadgeShape {
  return shape && VALID_SHAPES.has(shape as EmrBadgeShape) ? (shape as EmrBadgeShape) : 'pill';
}

export function formatEmrBadgeCount(
  count: number | undefined,
  maxCount = 99,
  showZero = false,
): { visible: boolean; text: string | null } {
  if (typeof count !== 'number' || !Number.isFinite(count)) {
    return { visible: true, text: null };
  }
  const intCount = Math.max(0, Math.trunc(count));
  if (intCount === 0 && !showZero) {
    return { visible: false, text: null };
  }
  const resolvedMax =
    typeof maxCount === 'number' && Number.isFinite(maxCount) && maxCount >= 1
      ? Math.trunc(maxCount)
      : 99;
  return {
    visible: true,
    text: intCount > resolvedMax ? `${resolvedMax}+` : String(intCount),
  };
}

export function normalizeEmrChipTone(tone?: string | null): EmrTone {
  return normalizeEmrBadgeTone(tone);
}

export function normalizeEmrChipVariant(variant?: string | null): EmrChipVariant {
  return normalizeEmrBadgeVariant(variant);
}

export function normalizeEmrChipSize(size?: string | null): EmrChipSize {
  return normalizeEmrBadgeSize(size);
}

export function canMutateEmrChip(disabled: boolean, readOnly: boolean): boolean {
  return !disabled && !readOnly;
}

export function resolveEmrChipRemoveLabel(removeLabel?: string | null, label?: string | null): string {
  if (removeLabel && removeLabel.trim()) return removeLabel.trim();
  if (label && label.trim()) return `Remove ${label.trim()}`;
  return 'Remove';
}

export function normalizeEmrStateMessageKind(kind?: string | null): EmrStateMessageKind {
  if (kind === 'loading' || kind === 'error' || kind === 'empty') return kind;
  return 'empty';
}

export function normalizeEmrStateMessageSize(size?: string | null, compact = false): EmrStateMessageSize {
  if (compact || size === 'sm') return 'sm';
  return 'md';
}

export function resolveEmrStateMessageTitle(kind: EmrStateMessageKind, title?: string | null): string {
  if (title && title.trim()) return title.trim();
  if (kind === 'loading') return 'Loading…';
  if (kind === 'error') return 'Something went wrong';
  return 'Nothing to show';
}

export function resolveEmrStateMessageRole(kind: EmrStateMessageKind): 'alert' | 'status' {
  return kind === 'error' ? 'alert' : 'status';
}
