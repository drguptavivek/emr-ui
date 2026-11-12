/**
 * Pure L1 Wave 2 logic bridge: re-exports deterministic controller algorithms/constants
 * so `.tsx` component modules maintain type-only controller imports per architecture.spec.ts.
 */
import {
  addTagValues,
  applyInputMask,
  applyOtpSlotEdit,
  clampCropRect,
  clampRangeSliderPair,
  clampSliderValue,
  clampStraightenAngle,
  collapseBreadcrumbs,
  collectAllExpandableTreeIds,
  computeSelectAllState,
  computeTreeNodeCheckState,
  DEFAULT_ASPECT_PRESETS,
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  DEFAULT_IMAGE_CROP_TRANSFORM,
  DEFAULT_IMAGE_VIEWPORT,
  filterOptionsLocally,
  flattenVisibleTreeNodes,
  formatImageTransformCss,
  formatTreeSelectionLabel,
  groupOptions,
  isIsoDateInRange,
  isIsoRangeEdge,
  normalizeDateRangeSelection,
  normalizeOtpSlots,
  resolveTreeNodePath,
  rotateImage90,
  splitTagTokens,
  stepImageZoom,
  toggleAccordionId,
  toggleCheckboxGroupValue,
  toggleSelectAllValues,
  toggleTreeNodeCheck,
} from '@drguptavivek/emr-controller';

export {
  addTagValues,
  applyInputMask,
  applyOtpSlotEdit,
  clampCropRect,
  clampRangeSliderPair,
  clampSliderValue,
  clampStraightenAngle,
  collapseBreadcrumbs,
  collectAllExpandableTreeIds,
  computeSelectAllState,
  computeTreeNodeCheckState,
  DEFAULT_ASPECT_PRESETS,
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  DEFAULT_IMAGE_CROP_TRANSFORM,
  DEFAULT_IMAGE_VIEWPORT,
  filterOptionsLocally,
  flattenVisibleTreeNodes,
  formatImageTransformCss,
  formatTreeSelectionLabel,
  groupOptions,
  isIsoDateInRange,
  isIsoRangeEdge,
  normalizeDateRangeSelection,
  normalizeOtpSlots,
  resolveTreeNodePath,
  rotateImage90,
  splitTagTokens,
  stepImageZoom,
  toggleAccordionId,
  toggleCheckboxGroupValue,
  toggleSelectAllValues,
  toggleTreeNodeCheck,
};

/** Formats byte count cleanly for L1 image upload cards without upward L2 imports. */
export function formatL1ByteSize(sizeBytes?: number): string {
  if (sizeBytes === undefined || !Number.isFinite(sizeBytes) || sizeBytes < 0) return '';
  if (sizeBytes < 1024) return `${Math.round(sizeBytes)} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Validates and normalises a `#RGB` or `#RRGGBB` hex colour string, or returns null when incomplete/invalid. */
export function normalizeHexColor(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) {
    return withHash.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const r = withHash[1]!;
    const g = withHash[2]!;
    const b = withHash[3]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}
