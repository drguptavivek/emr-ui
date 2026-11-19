import { html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import {
  addTagValues,
  applyInputMask,
  applyOtpSlotEdit,
  buildDateRangeCalendarGrid,
  buildEmrTreeSelectSummary,
  canClearEmrColorPicker,
  canCopyEmrValue,
  canOpenEmrMenu,
  canOpenEmrSplitMenu,
  canSelectEmrBreadcrumb,
  canSelectEmrMenuItem,
  canToggleAccordionItem,
  canTriggerEmrSplitPrimary,
  clampCropRect,
  clampRangeSliderPair,
  clampSliderValue,
  clampStraightenAngle,
  clearEmrToggleGroupValues,
  clearTreeSelection,
  clearUnlockedTags,
  collapseBreadcrumbs,
  collectAllExpandableTreeIds,
  commitDateRangeEndpoint,
  commitTagInputValues,
  computeAspectLockedCropRect,
  computeCroppedCanvasPlan,
  computeSelectAllState,
  countSliderStepDecimals,
  DEFAULT_ASPECT_PRESETS,
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  DEFAULT_IMAGE_CROP_TRANSFORM,
  DEFAULT_IMAGE_VIEWPORT,
  editMaskedInputWithCaret,
  extractOtpTypedInput,
  filterOptionsLocally,
  findEmrMenuTypeaheadIndex,
  findNextEnabledSearchOptionIndex,
  findNextTreeRowIndex,
  findTypeaheadTreeRowIndex,
  flattenVisibleTreeNodes,
  formatByteSize,
  formatCheckboxSelectionCount,
  formatCopyButtonLabel,
  formatDateRangeMonthTitle,
  formatEmrBadgeCount,
  formatEmrSegmentedBadge,
  formatImageTransformCss,
  formatSliderValue,
  formatTreeSelectionLabel,
  getContrastCheckTone,
  getDateRangeWeekdays,
  groupOptions,
  inferMaskInputMode,
  isCheckboxOptionBlockedByMax,
  isCheckboxOptionLocked,
  isEmrTreeClearable,
  isIsoDateInRange,
  isIsoRangeEdge,
  isTagLocked,
  moveAccordionFocusIndex,
  moveColorSwatchFocusIndex,
  moveEmrMenuFocusIndex,
  normalizeEmrBadgeShape,
  normalizeEmrBadgeSize,
  normalizeEmrBadgeTone,
  normalizeEmrBadgeVariant,
  normalizeEmrToggleGroupLabelPlacement,
  normalizeEmrToggleGroupOrientation,
  normalizeEmrToggleGroupSize,
  normalizeEmrToggleGroupVariant,
  normalizeHexColor,
  normalizeOtpSlots,
  popLastUnlockedTag,
  rankAndFilterOptions,
  rankTagSuggestions,
  removeTagInputAtIndex,
  removeTreeSelectionChip,
  resolveAccordionExpandedIds,
  resolveClosestRangeThumb,
  resolveColorSwatchTabStopIndex,
  resolveComboboxDisplayValue,
  resolveCopyFeedbackDurationMs,
  resolveCustomSearchCandidate,
  resolveDefaultActiveOptionIndex,
  resolveDefaultExpandedTreeIds,
  resolveEmrSelectCloseOnSelect,
  resolveEmrTagsValue,
  resolveEmrToggleGroupValues,
  resolveEmrToggleStateLabel,
  resolveEmrTreeSelectDefaultExpanded,
  resolveInitialCalendarMonth,
  resolveOtpClearSlot,
  resolveRangeThumbKeyValue,
  resolveSliderKeyStepValue,
  rotateImage90,
  selectDateRangeCalendarDay,
  sliderValuePercent,
  splitMatchHighlightSegments,
  splitRotationDegrees,
  splitTagTokens,
  stepCalendarMonth,
  stepImageZoom,
  toggleAccordionId,
  toggleEmrToggleGroupValue,
  toggleSelectAllValues,
  toggleTreeNodeCheck,
  validateUploadedImageFile,
  type EmrAccordionItem,
  type EmrAspectPreset,
  type EmrBadge,
  type EmrBreadcrumbItem,
  type EmrColorSwatch,
  type EmrControlVariant,
  type EmrDateRangePreset,
  type EmrDateRangeValue,
  type EmrFileSelectionItem,
  type EmrFlatTreeRow,
  type EmrTagInputSize,
  type EmrTagInputVariant,
  type EmrToggleGroupLabelPlacement,
  type EmrToggleGroupOrientation,
  type EmrToggleGroupSize,
  type EmrToggleGroupVariant,
  type EmrTone,
  type EmrImageCropRect,
  type EmrImageCropResult,
  type EmrImageCropTransform,
  type EmrImageItem,
  type EmrImageViewportState,
  type EmrMaskResult,
  type EmrMenuItem,
  type EmrOption,
  type EmrOptionGroup,
  type EmrScoredOption,
  type EmrSearchSelectFilterMode,
  type EmrSearchSelectSize,
  type EmrSliderMark,
  type EmrTreeCheckStrategy,
  type EmrTreeNode,
  type EmrUploadedImageItem,
  type EmrValidationMessage,
} from '@drguptavivek/emr-controller';
import { todayLitCalendarParts } from './calendar.logic.js';
import { EmrLitElement, defineEmrElement, emrShadowStyles } from './foundations.js';
import { renderEmrSvgIcon, type EmrLitIconName } from './icons.js';

let l1Wave2IdSeq = 0;
const nextL1Wave2Id = (prefix: string): string => `${prefix}-${++l1Wave2IdSeq}`;

const l1Wave2Styles = css`
  .choice-group-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .choice-group-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .choice-group-count {
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
    color: var(--emr-text-muted);
    font-variant-numeric: tabular-nums;
  }
  .choice-group-section-label {
    grid-column: 1 / -1;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    color: var(--emr-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: 4px;
  }
  .clear-inline-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    color: var(--emr-text-muted);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-semibold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .clear-inline-btn:hover:not(:disabled) {
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }
  .clear-inline-btn:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: 2px;
  }
  .checkbox-box {
    width: 18px;
    height: 18px;
    border: 1.5px solid var(--emr-border);
    border-radius: 4px;
    background: var(--emr-surface);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .checkbox-box--sm {
    width: 16px;
    height: 16px;
  }
  .checkbox-box[data-checked="true"],
  .checkbox-box[data-mixed="true"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary);
    color: var(--emr-on-primary);
  }

  .toggle-group-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .toggle-group-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .toggle-group-list--horizontal {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .toggle-group-list--grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr));
    gap: 8px;
  }
  @media (max-width: 480px) {
    .toggle-group-list--grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .toggle-row-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 8px 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    font-weight: var(--emr-weight-medium);
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    text-align: left;
    box-sizing: border-box;
  }
  .toggle-row-btn--sm {
    font-size: var(--emr-text-sm);
    padding: 6px 10px;
    gap: 8px;
  }
  .toggle-row-btn--card {
    padding: 10px 14px;
    align-items: flex-start;
  }
  .toggle-row-btn--inline {
    border-color: transparent;
    background: transparent;
    padding: 6px 4px;
    width: fit-content;
    max-width: 100%;
  }
  .toggle-row-btn--inline.toggle-row-btn--between {
    width: 100%;
  }
  .toggle-row-btn--start {
    flex-direction: row-reverse;
    justify-content: flex-end;
  }
  .toggle-row-btn--between {
    flex-direction: row-reverse;
    justify-content: space-between;
  }
  .toggle-row-btn:hover:not(:disabled):not(.toggle-row-btn--readonly):not([aria-checked="true"]):not(.toggle-row-btn--inline) {
    background: var(--emr-surface-soft);
    border-color: var(--emr-focus);
  }
  .toggle-row-btn:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: 2px;
  }
  .toggle-row-btn[aria-checked="true"]:not(.toggle-row-btn--inline) {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
  }
  .toggle-row-btn--tone-info[aria-checked="true"]:not(.toggle-row-btn--inline) {
    border-color: var(--emr-info);
    background: color-mix(in srgb, var(--emr-info) 10%, var(--emr-surface));
  }
  .toggle-row-btn--tone-success[aria-checked="true"]:not(.toggle-row-btn--inline) {
    border-color: var(--emr-success);
    background: color-mix(in srgb, var(--emr-success) 10%, var(--emr-surface));
  }
  .toggle-row-btn--tone-warning[aria-checked="true"]:not(.toggle-row-btn--inline) {
    border-color: var(--emr-warning);
    background: color-mix(in srgb, var(--emr-warning) 10%, var(--emr-surface));
  }
  .toggle-row-btn--tone-danger[aria-checked="true"]:not(.toggle-row-btn--inline) {
    border-color: var(--emr-danger);
    background: color-mix(in srgb, var(--emr-danger) 10%, var(--emr-surface));
  }
  .toggle-row-btn--warning:not(.toggle-row-btn--invalid):not(.toggle-row-btn--inline) {
    border-color: var(--emr-warning);
  }
  .toggle-row-btn--invalid:not(.toggle-row-btn--inline) {
    border-color: var(--emr-danger);
  }
  .toggle-row-btn--readonly:not(.toggle-row-btn--inline) {
    background: var(--emr-surface-soft);
    border-style: dashed;
    cursor: default;
  }
  .toggle-row-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .switch-cluster {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .switch-state-label {
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    color: var(--emr-text-muted);
  }
  .toggle-row-btn[aria-checked="true"] .switch-state-label {
    color: var(--emr-primary);
  }
  .switch-track {
    width: 42px;
    height: 24px;
    border-radius: 999px;
    padding: 2px;
    border: 1px solid transparent;
    background: var(--emr-border);
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    box-sizing: border-box;
  }
  .toggle-row-btn--sm .switch-track {
    width: 38px;
    height: 22px;
  }
  .toggle-row-btn--warning:not(.toggle-row-btn--invalid) .switch-track {
    border-color: var(--emr-warning);
  }
  .toggle-row-btn--invalid .switch-track {
    border-color: var(--emr-danger);
  }
  .toggle-row-btn[aria-checked="true"] .switch-track {
    background: var(--emr-primary);
  }
  .switch-thumb {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--emr-surface);
    box-shadow: var(--emr-shadow);
    transform: translateX(0);
    transition: transform 140ms ease;
  }
  .toggle-row-btn--sm .switch-thumb {
    width: 16px;
    height: 16px;
  }
  .toggle-row-btn[aria-checked="true"] .switch-thumb {
    transform: translateX(18px);
  }
  .toggle-row-btn--sm[aria-checked="true"] .switch-thumb {
    transform: translateX(16px);
  }
  .row-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .row-title-line {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .row-icon {
    display: inline-flex;
    align-items: center;
    color: var(--emr-text-muted);
    flex-shrink: 0;
  }
  .row-desc {
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
  }

  .tree-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }
  .tree-search-wrap {
    position: relative;
    flex: 1 1 160px;
    min-width: 0;
    display: flex;
    align-items: center;
  }
  .tree-search-icon {
    position: absolute;
    left: 10px;
    color: var(--emr-text-muted);
    display: inline-flex;
    pointer-events: none;
  }
  .tree-search-input {
    width: 100%;
    padding-left: 34px;
    padding-right: 40px;
    box-sizing: border-box;
  }
  .tree-search-clear {
    position: absolute;
    right: 0;
    min-width: 44px;
    min-height: 44px;
    border: 0;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-text-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .tree-search-clear:hover {
    color: var(--emr-text);
  }
  .tree-list {
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    padding: 4px;
    max-height: var(--tree-max-height, 320px);
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .tree-list[aria-invalid="true"] {
    border-color: var(--emr-danger);
  }
  .tree-list[data-warning="true"]:not([aria-invalid="true"]) {
    border-color: var(--emr-warning);
  }
  .tree-list[aria-readonly="true"] {
    background: var(--emr-surface-soft);
    border-style: dashed;
  }
  .tree-list[data-disabled="true"] {
    opacity: 0.65;
  }
  .tree-empty {
    padding: 18px 12px;
    text-align: center;
    color: var(--emr-text-muted);
    font-size: var(--emr-text-md);
  }
  .tree-row {
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    padding-left: calc(10px + var(--tree-depth, 0) * 18px);
    border: 1px solid transparent;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    text-align: left;
    cursor: pointer;
    box-sizing: border-box;
    width: 100%;
  }
  .tree-list--sm .tree-row {
    font-size: var(--emr-text-sm);
    padding: 3px 8px;
    padding-left: calc(8px + var(--tree-depth, 0) * 16px);
  }
  .tree-row:hover:not(:disabled) {
    background: var(--emr-surface-soft);
  }
  .tree-row:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: -2px;
  }
  .tree-row[aria-selected="true"],
  .tree-row[aria-checked="true"] {
    background: var(--emr-primary-soft);
    border-color: var(--emr-primary-border);
    color: var(--emr-primary-contrast);
  }
  .tree-row[data-readonly="true"] {
    border-style: dashed;
    border-color: var(--emr-border);
  }
  .tree-row:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .tree-twisty {
    min-width: 44px;
    min-height: 44px;
    margin: -4px 0 -4px -8px;
    border-radius: var(--emr-radius-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--emr-text-muted);
    flex-shrink: 0;
  }
  .tree-twisty:hover {
    background: var(--emr-surface-raised);
    color: var(--emr-text);
  }
  .tree-match {
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
    font-weight: var(--emr-weight-bold);
    border-radius: 3px;
    padding: 0 2px;
  }

  .popover-anchor {
    position: relative;
    width: 100%;
  }
  .select-shell {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    min-height: 44px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    overflow: hidden;
  }
  .select-shell--filled {
    background: var(--emr-surface-soft);
    border-color: transparent;
  }
  .select-shell--subtle {
    background: transparent;
    border-color: transparent;
  }
  .select-shell[data-open="true"] {
    border-color: var(--emr-primary);
  }
  .select-shell[data-invalid="true"] {
    border-color: var(--emr-danger);
  }
  .select-shell[data-warning="true"]:not([data-invalid="true"]) {
    border-color: var(--emr-warning);
  }
  .select-shell[data-readonly="true"] {
    background: var(--emr-surface-soft);
    border-style: dashed;
  }
  .select-shell[data-disabled="true"] {
    background: var(--emr-surface-soft);
    opacity: 0.6;
  }
  .select-chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 6px 0 6px 10px;
    max-width: calc(100% - 88px);
  }
  .select-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 28px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    color: var(--emr-text);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
  }
  .select-chip[data-readonly="true"] {
    border-style: dashed;
  }
  .select-chip--overflow {
    color: var(--emr-text-muted);
  }
  .select-chip-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    min-height: 24px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .select-chip-remove:hover {
    background: var(--emr-surface-raised);
  }
  .select-chip-remove:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: 1px;
  }
  .trigger-btn {
    flex: 1 1 80px;
    min-height: 44px;
    min-width: 0;
    padding: 0 12px;
    border: 0;
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    cursor: pointer;
    text-align: left;
  }
  .trigger-btn--sm {
    font-size: var(--emr-text-sm);
    padding: 0 10px;
  }
  .trigger-btn:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: -3px;
  }
  .trigger-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .trigger-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .trigger-text--placeholder {
    color: var(--emr-text-muted);
  }
  .trigger-bar {
    display: flex;
    align-items: stretch;
    gap: 6px;
    width: 100%;
  }
  .clear-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    color: var(--emr-text-muted);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-semibold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .clear-btn:hover:not(:disabled) {
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }
  .trigger-clear-btn {
    min-width: 44px;
    min-height: 44px;
    border: 0;
    border-left: 1px solid var(--emr-border);
    background: transparent;
    color: var(--emr-text-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }
  .trigger-clear-btn:hover {
    background: var(--emr-surface-soft);
    color: var(--emr-text);
  }
  .dropdown-panel {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-width: 100%;
    box-sizing: border-box;
    padding: 8px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    box-shadow: var(--emr-shadow);
    z-index: 9999;
  }

  :host-context(.emr-print) .tree-list {
    max-height: none !important;
    overflow: visible !important;
  }
  :host-context(.emr-print) .tree-toolbar,
  :host-context(.emr-print) [data-emr-print="hide"] {
    display: none !important;
  }
  @media print {
    .tree-list {
      max-height: none !important;
      overflow: visible !important;
    }
    .tree-toolbar,
    [data-emr-print="hide"] {
      display: none !important;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .switch-thumb {
      transition: none;
    }
  }

  :host([data-open="true"]) {
    position: relative;
    z-index: 100;
  }
  .combo-bar {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
  .combo-input-wrap {
    position: relative;
    flex: 1 1 0%;
    min-width: 0;
    display: flex;
    align-items: center;
  }
  .combo-input {
    width: 100%;
    min-width: 0;
    min-height: 44px;
    font-size: var(--emr-text-md);
  }
  .combo-input::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
  }
  .combo-input--sm { font-size: var(--emr-text-sm); }
  .combo-input--filled { background: var(--emr-surface-soft); border-color: transparent; }
  .combo-input--subtle { background: transparent; border-color: transparent; }
  .combo-input--subtle:hover,
  .combo-input--subtle:focus { border-color: var(--emr-border); background: var(--emr-surface); }
  .combo-btn--subtle { background: transparent; border-color: transparent; }
  .combo-btn--subtle:hover:not(:disabled) { border-color: var(--emr-border); background: var(--emr-surface); }
  .combo-warning { color: var(--emr-warning); font-size: var(--emr-text-xs); }
  .combo-input--invalid { border-color: var(--emr-danger); }
  .combo-input--warning { border-color: var(--emr-warning); }
  .combo-input--readonly { border-style: dashed; background: var(--emr-surface-soft); }
  .combo-input--loading { padding-right: 34px; }
  .combo-spinner-wrap {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--emr-text-muted);
    pointer-events: none;
    display: inline-flex;
    align-items: center;
  }
  .combo-spinner {
    animation: emr-combo-spin 0.9s linear infinite;
    flex-shrink: 0;
  }
  @keyframes emr-combo-spin {
    to { transform: rotate(360deg); }
  }
  .combo-panel {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 4px);
    max-height: 280px;
    overflow: auto;
    margin-top: 0;
    z-index: 100;
  }
  .combo-group-header {
    padding: 6px 8px 4px;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    color: var(--emr-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .combo-option {
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    text-align: left;
  }
  .combo-option--active {
    background: var(--emr-surface-raised);
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }
  .combo-option--selected {
    background: var(--emr-primary-soft, var(--emr-surface-raised));
  }
  .combo-option--readonly { cursor: default; }
  .combo-option-check {
    width: 16px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--emr-primary);
    flex-shrink: 0;
  }
  .combo-option-body {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .combo-option-top {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .combo-code {
    font-family: var(--emr-font-mono, monospace);
    font-size: var(--emr-text-xs);
    color: var(--emr-text-muted);
    background: var(--emr-surface-soft);
    border: 1px solid var(--emr-border);
    border-radius: 4px;
    padding: 0 5px;
  }
  .combo-best-match {
    font-size: var(--emr-text-2xs);
    font-weight: var(--emr-weight-bold);
    color: var(--emr-primary);
    background: var(--emr-primary-soft, var(--emr-surface-raised));
    border-radius: 4px;
    padding: 1px 6px;
  }
  .combo-option-meta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .combo-badge {
    font-size: var(--emr-text-2xs);
    font-weight: var(--emr-weight-medium);
    border-radius: 999px;
    padding: 1px 8px;
    border: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    color: var(--emr-text-muted);
  }
  .combo-badge--info { background: var(--emr-info-soft, var(--emr-surface-soft)); color: var(--emr-info); border-color: var(--emr-info); }
  .combo-badge--success { background: var(--emr-success-soft, var(--emr-surface-soft)); color: var(--emr-success); border-color: var(--emr-success); }
  .combo-badge--warning { background: var(--emr-warning-soft, var(--emr-surface-soft)); color: var(--emr-warning); border-color: var(--emr-warning); }
  .combo-badge--danger { background: var(--emr-danger-soft, var(--emr-surface-soft)); color: var(--emr-danger); border-color: var(--emr-danger); }
  .combo-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    color: var(--emr-text-muted);
    font-size: var(--emr-text-sm);
  }
  .emr-match-highlight {
    background: var(--emr-primary-soft, var(--emr-surface-raised));
    color: var(--emr-primary);
    font-weight: var(--emr-weight-bold);
    border-radius: 2px;
    padding: 0 1px;
  }

  .viewer-shell {
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius-lg);
    background: var(--emr-surface);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }
  .viewer-shell--invalid {
    border-color: var(--emr-danger);
  }
  .viewer-shell--warning:not(.viewer-shell--invalid) {
    border-color: var(--emr-warning);
  }
  .viewer-shell--readonly {
    border-style: dashed;
  }
  .viewer-shell--disabled {
    opacity: 0.55;
  }
  .viewer-shell--fullscreen {
    position: fixed;
    inset: 0;
    z-index: 10000;
    border-radius: 0;
    background: var(--emr-surface);
    padding: 16px;
  }
  .viewer-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 6px;
  }
  .viewer-toolbar .emr-btn {
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .viewer-toolbar .emr-btn[aria-pressed="true"] {
    background: var(--emr-primary-soft);
    border-color: var(--emr-primary);
    color: var(--emr-primary-contrast);
  }
  .viewer-straighten {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    font-size: var(--emr-text-xs);
    color: var(--emr-text-muted);
  }
  .viewer-straighten input[type="range"] {
    min-height: 44px;
    cursor: pointer;
  }
  .viewer-stage {
    position: relative;
    min-height: 240px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    user-select: none;
  }
  .viewer-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    transform-origin: center center;
    transition: transform 60ms linear;
    pointer-events: none;
  }
  .viewer-thumbs {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding: 4px 0;
  }
  .viewer-thumb-btn {
    min-width: 48px;
    min-height: 48px;
    width: 48px;
    height: 48px;
    padding: 2px;
    border: 2px solid var(--emr-border);
    border-radius: var(--emr-radius-sm);
    background: var(--emr-surface);
    cursor: pointer;
    overflow: hidden;
    flex: 0 0 auto;
  }
  .viewer-thumb-btn[aria-current="true"] {
    border-color: var(--emr-primary);
  }
  .viewer-thumb-btn img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 3px;
    display: block;
  }

  .cropper-stage {
    position: relative;
    min-height: 260px;
    height: 280px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    user-select: none;
  }
  .crop-box {
    position: absolute;
    border: 2px solid var(--emr-primary);
    box-shadow: 0 0 0 9999px color-mix(in srgb, var(--emr-text) 42%, transparent);
    background: transparent;
    cursor: move;
    touch-action: none;
    box-sizing: border-box;
  }
  .crop-box:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 85%, transparent);
    outline-offset: 2px;
  }
  .crop-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(to right, transparent 33.2%, color-mix(in srgb, var(--emr-surface) 55%, transparent) 33.3%, transparent 33.8%, transparent 66.2%, color-mix(in srgb, var(--emr-surface) 55%, transparent) 66.6%, transparent 67.1%),
      linear-gradient(to bottom, transparent 33.2%, color-mix(in srgb, var(--emr-surface) 55%, transparent) 33.3%, transparent 33.8%, transparent 66.2%, color-mix(in srgb, var(--emr-surface) 55%, transparent) 66.6%, transparent 67.1%);
  }
  .crop-readout {
    position: absolute;
    top: 4px;
    left: 4px;
    padding: 2px 6px;
    border-radius: 6px;
    background: var(--emr-primary);
    color: var(--emr-primary-contrast);
    font-size: var(--emr-text-2xs);
    font-weight: var(--emr-weight-bold);
    pointer-events: none;
    font-variant-numeric: tabular-nums;
  }
  .crop-handle {
    position: absolute;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    background: transparent;
    border: 0;
    padding: 0;
    touch-action: none;
  }
  .crop-handle::after {
    content: '';
    width: 14px;
    height: 14px;
    border-radius: 999px;
    border: 2px solid var(--emr-surface);
    background: var(--emr-primary);
  }
  .crop-handle--nw { left: -22px; top: -22px; cursor: nwse-resize; }
  .crop-handle--ne { right: -22px; top: -22px; cursor: nesw-resize; }
  .crop-handle--sw { left: -22px; bottom: -22px; cursor: nesw-resize; }
  .crop-handle--se { right: -22px; bottom: -22px; cursor: nwse-resize; }

  .upload-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
  }
  @media (max-width: 480px) {
    .upload-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .upload-card {
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .upload-card--readonly {
    background: var(--emr-surface-soft);
    border-style: dashed;
  }
  .upload-thumb-wrap {
    position: relative;
    width: 100%;
    height: 140px;
    border-radius: var(--emr-radius-sm);
    background: var(--emr-surface-soft);
    overflow: hidden;
  }
  .upload-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .upload-edited-badge {
    position: absolute;
    top: 8px;
    right: 8px;
  }
  .upload-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }
  .upload-name {
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-bold);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .upload-caption {
    min-height: 44px;
    width: 100%;
    box-sizing: border-box;
  }
  .upload-caption[readonly] {
    background: var(--emr-surface-soft);
    border-style: dashed;
  }
  .upload-dropzone {
    border: 1.5px dashed var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    padding: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .upload-dropzone[data-dragover="true"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
  }
  .upload-dropzone[data-invalid="true"] {
    border-color: var(--emr-danger);
  }
  .upload-dropzone[data-warning="true"]:not([data-invalid="true"]) {
    border-color: var(--emr-warning);
  }
  .upload-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: color-mix(in srgb, var(--emr-text) 55%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .upload-modal-dialog {
    width: 100%;
    max-width: 780px;
    max-height: 92vh;
    overflow: auto;
    background: var(--emr-surface);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius-lg);
    padding: 14px;
    display: grid;
    gap: 10px;
  }
  .upload-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .upload-action-btn {
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .tag-wrap {
    position: relative;
    width: 100%;
  }
  .tag-shell {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 8px;
    min-height: var(--emr-control-height);
    max-width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
  }
  .tag-shell:focus-within {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: 2px;
    border-color: var(--emr-primary);
  }
  .tag-shell--sm {
    min-height: 36px;
    padding: 3px 6px;
    gap: 4px;
  }
  .tag-shell--filled {
    background: var(--emr-surface-soft);
    border-color: transparent;
  }
  .tag-shell--subtle {
    background: transparent;
    border-color: transparent;
    border-bottom-color: var(--emr-border);
    border-radius: 0;
  }
  .tag-shell--readonly {
    border-style: dashed;
    background: var(--emr-surface-soft);
  }
  .tag-shell--disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .tag-shell--invalid {
    border-color: var(--emr-danger);
  }
  .tag-shell--warning {
    border-color: var(--emr-warning);
  }
  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    min-width: 0;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
    border: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    color: var(--emr-text);
  }
  .tag-chip--locked {
    border-style: dashed;
  }
  .tag-chip--info {
    background: color-mix(in srgb, var(--emr-primary) 14%, transparent);
    border-color: color-mix(in srgb, var(--emr-primary) 40%, transparent);
    color: var(--emr-primary);
  }
  .tag-chip--success {
    background: color-mix(in srgb, var(--emr-success) 14%, transparent);
    border-color: color-mix(in srgb, var(--emr-success) 40%, transparent);
    color: var(--emr-success);
  }
  .tag-chip--warning {
    background: color-mix(in srgb, var(--emr-warning) 14%, transparent);
    border-color: color-mix(in srgb, var(--emr-warning) 40%, transparent);
    color: var(--emr-warning);
  }
  .tag-chip--danger {
    background: color-mix(in srgb, var(--emr-danger) 14%, transparent);
    border-color: color-mix(in srgb, var(--emr-danger) 40%, transparent);
    color: var(--emr-danger);
  }
  .tag-chip-lock {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0.78;
  }
  .tag-chip-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tag-chip-remove {
    min-width: 44px;
    min-height: 44px;
    margin: -10px -8px -10px 0;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .tag-chip-remove:hover {
    background: color-mix(in srgb, currentColor 12%, transparent);
  }
  .tag-chip-remove:focus-visible {
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }
  .tag-bare-input {
    flex: 1 1 100px;
    min-width: 80px;
    min-height: 36px;
    border: 0;
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    outline: none;
  }

  .dr-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    width: 100%;
    max-width: 100%;
  }
  .dr-bar .emr-control {
    flex: 1 1 120px;
    min-width: 0;
    font-variant-numeric: tabular-nums;
  }
  .dr-bar--sm .emr-control { min-height: 44px; }
  .dr-bar--lg .emr-control { min-height: 48px; }
  .dr-bar--filled .emr-control {
    background: var(--emr-surface-soft);
    border-color: transparent;
  }
  .dr-bar--subtle .emr-control {
    background: transparent;
    border-color: transparent;
    border-bottom-color: var(--emr-border);
    border-radius: 0;
  }
  .dr-bar--readonly .emr-control {
    border-style: dashed;
    background: var(--emr-surface-soft);
  }
  .dr-bar--warning .emr-control { border-color: var(--emr-warning); }
  .dr-bar--invalid .emr-control[aria-invalid="true"],
  .dr-bar--invalid .emr-control { border-color: var(--emr-danger); }
  .dr-sep {
    display: inline-flex;
    align-items: center;
    color: var(--emr-text-muted);
    flex: 0 0 auto;
  }
  .dr-icon-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }
  .dr-cal-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 4px;
  }
  .dr-weekday {
    text-align: center;
    font-size: var(--emr-text-2xs);
    font-weight: var(--emr-weight-bold);
    color: var(--emr-text-muted);
    padding: 4px 0;
  }
  .dr-day-cell {
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    font-variant-numeric: tabular-nums;
  }
  .dr-day-cell--outside { opacity: 0.45; }
  .dr-day-cell--today:not(.cal-day--edge) {
    box-shadow: inset 0 0 0 1px var(--emr-primary);
  }

  .slider-wrap {
    --emr-slider-accent: var(--emr-primary);
    --emr-slider-rail-h: 6px;
    --emr-slider-thumb-size: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .slider-wrap[data-tone="info"] { --emr-slider-accent: var(--emr-info); }
  .slider-wrap[data-tone="success"] { --emr-slider-accent: var(--emr-success); }
  .slider-wrap[data-tone="warning"] { --emr-slider-accent: var(--emr-warning); }
  .slider-wrap[data-tone="danger"] { --emr-slider-accent: var(--emr-danger); }
  .slider-wrap--invalid { --emr-slider-accent: var(--emr-danger); }
  .slider-wrap--warning:not(.slider-wrap--invalid) { --emr-slider-accent: var(--emr-warning); }
  .slider-wrap--sm { --emr-slider-rail-h: 4px; --emr-slider-thumb-size: 18px; }
  .slider-wrap--lg { --emr-slider-rail-h: 8px; --emr-slider-thumb-size: 24px; }
  .slider-wrap--disabled { opacity: 0.55; }
  .slider-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-width: 0;
  }
  .slider-track {
    position: relative;
    flex: 1 1 auto;
    min-width: 120px;
    min-height: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
    touch-action: none;
    user-select: none;
  }
  .slider-wrap--readonly .slider-track { cursor: default; }
  .slider-wrap--disabled .slider-track { cursor: not-allowed; }
  .slider-rail {
    position: relative;
    width: 100%;
    height: var(--emr-slider-rail-h);
    border-radius: 999px;
    background: var(--emr-border);
  }
  .slider-wrap--readonly .slider-rail {
    border: 1px dashed var(--emr-border);
    background: var(--emr-surface-soft);
  }
  .slider-fill {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 999px;
    background: var(--emr-slider-accent);
  }
  .slider-thumb {
    position: absolute;
    top: 50%;
    left: var(--emr-pos, 0%);
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 0;
    padding: 0;
    cursor: grab;
    z-index: 2;
  }
  .slider-thumb--active,
  .slider-thumb:focus-visible { z-index: 4; outline: none; }
  .slider-thumb::after {
    content: '';
    width: var(--emr-slider-thumb-size);
    height: var(--emr-slider-thumb-size);
    border-radius: 999px;
    background: var(--emr-surface);
    border: 2.5px solid var(--emr-slider-accent);
    box-shadow: var(--emr-shadow);
    transition: transform 120ms ease;
  }
  .slider-thumb:hover:not([aria-disabled="true"]):not([aria-readonly="true"])::after {
    transform: scale(1.12);
  }
  .slider-thumb:focus-visible::after {
    outline: 3px solid var(--emr-focus);
    outline-offset: 2px;
  }
  .slider-value-badge {
    min-width: 56px;
    text-align: center;
    font-variant-numeric: tabular-nums;
    flex: 0 0 auto;
  }
  .slider-marks {
    position: relative;
    min-height: 28px;
  }
  .slider-mark {
    position: absolute;
    left: var(--emr-pos, 0%);
    top: 0;
    transform: translateX(-50%);
    min-width: 28px;
    min-height: 28px;
    padding: 2px 4px;
    border: 0;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-text-muted);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    white-space: nowrap;
  }
  .slider-mark--start { transform: translateX(0); }
  .slider-mark--end { transform: translateX(-100%); }
  .slider-mark--active {
    color: var(--emr-slider-accent);
    font-weight: var(--emr-weight-bold);
  }
  .slider-mark:disabled { cursor: default; }

  .masked-affix {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    padding-left: 10px;
    padding-right: 4px;
    box-sizing: border-box;
  }
  .masked-affix--lg { min-height: 48px; }
  .masked-affix--filled {
    background: var(--emr-surface-soft);
    border-color: transparent;
  }
  .masked-affix--subtle {
    background: transparent;
    border-color: transparent;
    border-bottom-color: var(--emr-border);
    border-radius: 0;
  }
  .masked-affix[data-readonly="true"] {
    border-style: dashed;
    background: var(--emr-surface-soft);
  }
  .masked-affix[data-warning="true"]:not([data-invalid="true"]) {
    border-color: var(--emr-warning);
  }
  .masked-affix[data-invalid="true"] {
    border-color: var(--emr-danger);
  }
  .masked-affix:focus-within {
    outline: 3px solid var(--emr-focus);
    outline-offset: 2px;
  }
  .masked-input-bare {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 40px;
    border: 0;
    background: transparent;
    color: var(--emr-text);
    font-family: var(--emr-font-mono);
    font-size: var(--emr-text-md);
    font-variant-numeric: tabular-nums;
    outline: none;
  }
  .masked-hint-badge {
    font-family: var(--emr-font-mono);
    font-size: var(--emr-text-2xs);
    color: var(--emr-text-muted);
    padding: 0 6px;
    white-space: nowrap;
  }
  .masked-hint-badge--complete { color: var(--emr-success); }

  .otp-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .otp-slot {
    width: 44px;
    min-width: 44px;
    height: 48px;
    min-height: 48px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    text-align: center;
    font-family: var(--emr-font-mono);
    font-size: var(--emr-text-lg);
    font-weight: var(--emr-weight-bold);
    font-variant-numeric: tabular-nums;
  }
  .otp-slot--sm { height: 44px; min-height: 44px; font-size: var(--emr-text-md); }
  .otp-slot--lg { width: 48px; min-width: 48px; height: 52px; min-height: 52px; font-size: var(--emr-text-xl); }
  .otp-slot--filled { background: var(--emr-surface-soft); border-color: transparent; }
  .otp-slot--subtle {
    background: transparent;
    border-color: transparent;
    border-bottom-color: var(--emr-border);
    border-radius: 0;
  }
  .otp-slot:hover:not(:disabled):not([readonly]) { border-color: var(--emr-focus); }
  .otp-slot[readonly] { border-style: dashed; background: var(--emr-surface-soft); }
  .otp-slot:disabled { opacity: 0.55; cursor: not-allowed; }
  .otp-slot[data-warning="true"]:not([aria-invalid="true"]) { border-color: var(--emr-warning); }
  .otp-slot[aria-invalid="true"] { border-color: var(--emr-danger); }
  .otp-slot:focus-visible {
    outline: 3px solid var(--emr-focus);
    outline-offset: 2px;
    border-color: var(--emr-primary);
  }
  .otp-sep {
    color: var(--emr-text-muted);
    font-weight: var(--emr-weight-bold);
    padding: 0 2px;
  }

  .menu-root {
    position: relative;
    display: inline-block;
    max-width: 100%;
  }
  .menu-chevron {
    display: inline-flex;
    transition: transform 150ms ease;
  }
  .menu-chevron--open {
    transform: rotate(180deg);
  }
  .menu-list {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 210px;
    max-width: min(320px, calc(100vw - 24px));
    padding: 4px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    box-shadow: var(--emr-shadow);
    display: flex;
    flex-direction: column;
    gap: 2px;
    z-index: 9999;
  }
  .menu-list--end {
    left: auto;
    right: 0;
  }
  .menu-item {
    min-height: 44px;
    min-width: 44px;
    padding: 8px 12px;
    border: 0;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    cursor: pointer;
    text-align: left;
  }
  .menu-item-lead {
    display: inline-flex;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;
  }
  .menu-item-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .menu-item:hover:not(:disabled):not([aria-disabled="true"]) {
    background: var(--emr-surface-soft);
  }
  .menu-item:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: 2px;
  }
  .menu-item--danger {
    color: var(--emr-danger);
  }
  .menu-item:disabled,
  .menu-item[aria-disabled="true"] {
    opacity: 0.48;
    cursor: not-allowed;
  }
  .menu-divider {
    height: 1px;
    background: var(--emr-border);
    margin: 4px 0;
  }
  .split-group {
    display: inline-flex;
    align-items: stretch;
    max-width: 100%;
  }
  .split-primary {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  .split-trigger {
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: 1px solid color-mix(in srgb, currentColor 25%, transparent);
  }
  .split-primary:focus-visible,
  .split-trigger:focus-visible {
    position: relative;
    z-index: 1;
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: 2px;
  }
  .split-spinner {
    animation: emr-combo-spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  .accordion-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .accordion-list--flush {
    gap: 0;
    border-top: 1px solid var(--emr-border);
    border-bottom: 1px solid var(--emr-border);
  }
  .accordion-list--flush .accordion-item {
    border: 0;
    border-radius: 0;
    background: transparent;
  }
  .accordion-list--flush .accordion-item + .accordion-item {
    border-top: 1px solid var(--emr-border);
  }
  .accordion-list--card {
    gap: 12px;
  }
  .accordion-list--card .accordion-item {
    box-shadow: var(--emr-shadow);
  }
  .accordion-item {
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    overflow: hidden;
  }
  .accordion-heading {
    margin: 0;
  }
  .accordion-header-btn {
    width: 100%;
    min-height: 48px;
    padding: 10px 14px;
    border: 0;
    background: var(--emr-surface-soft);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    font-weight: var(--emr-weight-semibold);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    cursor: pointer;
    text-align: left;
  }
  .accordion-list--sm .accordion-header-btn {
    min-height: 44px;
    padding: 8px 12px;
    font-size: var(--emr-text-sm);
  }
  .accordion-header-btn:hover:not(:disabled):not([aria-disabled="true"]) {
    background: var(--emr-surface-raised);
  }
  .accordion-header-btn:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: 2px;
  }
  .accordion-header-btn:disabled,
  .accordion-header-btn[aria-disabled="true"] {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .accordion-title-lead {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .accordion-chevron {
    display: inline-flex;
    flex-shrink: 0;
    transition: transform 150ms ease;
  }
  .accordion-chevron--open {
    transform: rotate(180deg);
  }
  .accordion-panel {
    padding: 12px 14px;
    border-top: 1px solid var(--emr-border);
    font-size: var(--emr-text-sm);
  }
  .accordion-list--sm .accordion-panel {
    padding: 10px 12px;
  }
  @media (prefers-reduced-motion: reduce) {
    .menu-chevron,
    .accordion-chevron {
      transition: none;
    }
    .split-spinner {
      animation: none;
    }
  }

  .breadcrumb-list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
    max-width: 100%;
  }
  .breadcrumb-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
  }
  .breadcrumb-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0 8px;
    border: 0;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-primary-contrast);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    text-decoration: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    max-width: 100%;
  }
  .breadcrumb-btn:hover:not(:disabled):not([aria-disabled="true"]) {
    background: var(--emr-surface-soft);
    text-decoration: underline;
  }
  .breadcrumb-btn:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: 2px;
  }
  .breadcrumb-btn:disabled,
  .breadcrumb-btn[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .breadcrumb-current {
    min-height: 44px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--emr-text);
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-bold);
    max-width: 100%;
  }
  .breadcrumb-list--sm .breadcrumb-btn,
  .breadcrumb-list--sm .breadcrumb-current {
    font-size: var(--emr-text-xs);
  }
  .breadcrumb-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: min(240px, 68vw);
  }

  .swatch-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .swatch-btn {
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    border-radius: var(--emr-radius);
    border: 2px solid var(--emr-border);
    background: var(--swatch-color, var(--emr-primary));
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .swatch-btn[aria-checked="true"] {
    border-color: var(--emr-text);
    box-shadow: inset 0 0 0 2px var(--emr-surface);
  }
  .swatch-btn:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: 2px;
  }
  .hex-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .swatch-preview-dot {
    width: 44px;
    height: 44px;
    border-radius: var(--emr-radius);
    border: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    flex: 0 0 auto;
  }
  .hex-input {
    width: 140px;
    max-width: 100%;
    font-family: var(--emr-font-mono);
  }
  .clear-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
  }
  .clear-btn:hover:not(:disabled) {
    background: var(--emr-surface-raised);
    border-color: var(--emr-focus);
  }
  .clear-btn:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: 2px;
  }
  .copy-btn--copied {
    border-color: var(--emr-success);
    color: var(--emr-success);
  }
  .copy-btn--icon-only {
    width: 44px;
    min-width: 44px;
    padding: 0;
  }

  .cal-day--in-range {
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
  }
  .cal-day--edge {
    background: var(--emr-primary);
    color: var(--emr-on-primary);
    font-weight: var(--emr-weight-bold);
  }
`;

function renderOptionBadgeLit(badge: EmrBadge | string | undefined, fallbackTone?: EmrTone) {
  const presentation = formatEmrSegmentedBadge(badge, fallbackTone);
  if (!presentation) return nothing;
  return html`<span class=${`emr-badge emr-badge--sm emr-badge--${presentation.tone}`}>${presentation.text}</span>`;
}

function asLitIcon(name: string | undefined): EmrLitIconName | null {
  switch (name) {
    case 'calendar':
    case 'clock':
    case 'eye':
    case 'eye-off':
    case 'lock':
    case 'unlock':
    case 'plus':
    case 'minus':
    case 'check':
    case 'close':
    case 'chevron-down':
    case 'chevron-up':
    case 'chevron-left':
    case 'chevron-right':
    case 'search':
    case 'warning':
    case 'info':
    case 'danger':
    case 'trash':
    case 'undo':
    case 'upload':
    case 'download':
    case 'camera':
    case 'scanner':
    case 'mic':
    case 'phone':
    case 'file':
    case 'user':
    case 'pen':
    case 'copy':
    case 'more-vertical':
    case 'more-horizontal':
    case 'star':
    case 'maximize':
    case 'minimize':
    case 'crop':
    case 'rotate-ccw':
    case 'rotate-cw':
    case 'flip-h':
    case 'flip-v':
      return name;
    default:
      return null;
  }
}

/** 1. EmrToggleGroupElement (`emr-toggle-group`) */
export class EmrToggleGroupElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-toggle-group');
  private isFocusedInside = false;

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel: string | null = null;
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) options: readonly EmrOption[] = [];
  @property({ attribute: false }) value: readonly string[] | string | null = [];
  @property({ attribute: false }) values?: readonly string[];
  @property({ type: Boolean }) multiple = true;
  @property({ type: Boolean }) allowEmpty = true;
  @property({ type: String }) orientation: EmrToggleGroupOrientation = 'vertical';
  @property({ type: Number }) columns = 2;
  @property({ type: String }) variant: EmrToggleGroupVariant | 'standard' = 'tile';
  @property({ type: String }) size: EmrToggleGroupSize = 'md';
  @property({ type: String }) labelPlacement: EmrToggleGroupLabelPlacement = 'space-between';
  @property({ type: Boolean }) showStateLabels = false;
  @property({ type: String }) onLabel = 'On';
  @property({ type: String }) offLabel = 'Off';
  @property({ type: Boolean }) showSelectAll = false;
  @property({ type: String }) selectAllLabel = 'Enable all';
  @property({ attribute: false }) exclusiveValues: readonly string[] = [];
  @property({ type: Number }) minSelections?: number;
  @property({ type: Number }) maxSelections?: number;
  @property({ type: Boolean }) showSelectionCount = false;
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';

  private get effectiveValues(): readonly string[] {
    return resolveEmrToggleGroupValues({
      value: this.value,
      values: this.values,
      multiple: this.multiple,
    });
  }

  private emitSelection(next: readonly string[]): void {
    this.dispatchEvent(new CustomEvent<readonly string[]>('valuesChange', { detail: next, bubbles: true, composed: true }));
    this.emitValueChange(this.multiple ? next : (next[0] ?? null));
  }

  private toggleOption(opt: EmrOption): void {
    if (this.readOnly || this.disabled || isCheckboxOptionLocked(opt)) return;
    const current = this.effectiveValues;
    const next = toggleEmrToggleGroupValue({
      current,
      toggledValue: opt.value,
      options: this.options,
      multiple: this.multiple,
      allowEmpty: this.allowEmpty,
      exclusiveValues: this.exclusiveValues,
      maxSelections: this.maxSelections,
    });
    if (next !== current) {
      this.emitSelection(next);
      if (!this.multiple && next.length === 0) {
        this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
      }
    }
  }

  private toggleAll(): void {
    if (this.readOnly || this.disabled || !this.multiple) return;
    const next = toggleSelectAllValues(this.effectiveValues, this.options, {
      exclusiveValues: this.exclusiveValues,
      maxSelections: this.maxSelections,
    });
    this.emitSelection(next);
  }

  private handleClear(): void {
    if (this.readOnly || this.disabled) return;
    const next = clearEmrToggleGroupValues(this.effectiveValues, this.options);
    this.emitSelection(next);
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
  }

  private handleFocusIn(): void {
    if (!this.isFocusedInside) {
      this.isFocusedInside = true;
      this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
    }
  }

  private handleFocusOut(event: FocusEvent): void {
    const currentTarget = event.currentTarget as HTMLElement | null;
    const relatedTarget = event.relatedTarget as Node | null;
    if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    if (this.isFocusedInside) {
      this.isFocusedInside = false;
      this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
    }
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const current = this.effectiveValues;
    const normalizedVariant = normalizeEmrToggleGroupVariant(this.variant);
    const normalizedSize = normalizeEmrToggleGroupSize(this.size);
    const normalizedOrientation = normalizeEmrToggleGroupOrientation(this.orientation);
    const normalizedPlacement = normalizeEmrToggleGroupLabelPlacement(this.labelPlacement);
    const isInvalid = this.invalid || Boolean(this.error);
    const isWarning = !isInvalid && Boolean(this.warning);
    const listCls = [
      'toggle-group-list',
      normalizedOrientation === 'horizontal' ? 'toggle-group-list--horizontal' : '',
      normalizedOrientation === 'grid' ? 'toggle-group-list--grid' : '',
    ].filter(Boolean).join(' ');
    const listStyle = normalizedOrientation === 'grid' ? `--cols: ${Math.max(1, this.columns)};` : '';
    const placementCls =
      normalizedPlacement === 'start'
        ? ' toggle-row-btn--start'
        : normalizedPlacement === 'space-between'
          ? ' toggle-row-btn--between'
          : '';
    const variantCls =
      normalizedVariant === 'card'
        ? ' toggle-row-btn--card'
        : normalizedVariant === 'inline'
          ? ' toggle-row-btn--inline'
          : '';
    const sizeCls = normalizedSize === 'sm' ? ' toggle-row-btn--sm' : '';
    const stateCls = `${isInvalid ? ' toggle-row-btn--invalid' : ''}${isWarning ? ' toggle-row-btn--warning' : ''}`;
    const selectedSet = new Set(current);
    const selectAllState =
      this.showSelectAll && this.multiple
        ? computeSelectAllState(current, this.options, this.exclusiveValues)
        : 'none';
    const hasClearable = this.options.some((o) => selectedSet.has(o.value) && !isCheckboxOptionLocked(o));
    const showClear = this.clearable && !this.readOnly && !this.disabled && hasClearable;
    const iconSize = normalizedSize === 'sm' ? 11 : 12;
    const optionGroups = groupOptions(this.options);

    const group = html`<div
      id=${id}
      role="group"
      class="toggle-group-stack"
      data-orientation=${normalizedOrientation}
      data-variant=${normalizedVariant}
      aria-label=${this.ariaLabel || this.label || 'Toggle options'}
      aria-required=${this.required ? 'true' : nothing}
      aria-readonly=${this.readOnly ? 'true' : nothing}
      aria-invalid=${isInvalid ? 'true' : nothing}
      aria-describedby=${!this.labelHidden && (this.error || this.warning || this.hint) ? msgId : nothing}
      @focusin=${() => this.handleFocusIn()}
      @focusout=${(e: FocusEvent) => this.handleFocusOut(e)}
    >
      ${this.showSelectAll && this.multiple
        ? html`<button
            type="button"
            role="checkbox"
            data-select-all="true"
            class=${`toggle-row-btn toggle-row-btn--inline${this.readOnly ? ' toggle-row-btn--readonly' : ''}${placementCls}${sizeCls}`}
            aria-checked=${selectAllState === 'mixed' ? 'mixed' : String(selectAllState === 'all')}
            aria-readonly=${this.readOnly ? 'true' : nothing}
            ?disabled=${this.disabled}
            @click=${() => this.toggleAll()}
          >
            <span
              class=${`checkbox-box${normalizedSize === 'sm' ? ' checkbox-box--sm' : ''}`}
              data-checked=${selectAllState === 'all' ? 'true' : nothing}
              data-mixed=${selectAllState === 'mixed' ? 'true' : nothing}
              aria-hidden="true"
            >
              ${selectAllState === 'mixed'
                ? renderEmrSvgIcon('minus', iconSize)
                : selectAllState === 'all'
                  ? renderEmrSvgIcon('check', iconSize)
                  : nothing}
            </span>
            <span>${this.selectAllLabel}</span>
          </button>`
        : nothing}
      <div class=${listCls} style=${listStyle}>
        ${optionGroups.map((grp) => html`
          ${grp.label ? html`<div class="choice-group-section-label">${grp.label}</div>` : nothing}
          ${grp.options.map((opt) => {
            const checked = selectedSet.has(opt.value);
            const optReadOnly = this.readOnly || Boolean(opt.readOnly);
            const optDisabled =
              this.disabled ||
              Boolean(opt.disabled) ||
              (this.multiple && isCheckboxOptionBlockedByMax(opt.value, current, this.maxSelections));
            const toneCls = opt.tone ? ` toggle-row-btn--tone-${opt.tone}` : '';
            const optIcon = asLitIcon(opt.icon);
            return html`<button
              type="button"
              role="switch"
              class=${`toggle-row-btn${optReadOnly ? ' toggle-row-btn--readonly' : ''}${placementCls}${variantCls}${sizeCls}${stateCls}${toneCls}`}
              aria-checked=${String(checked)}
              aria-readonly=${optReadOnly ? 'true' : nothing}
              ?disabled=${optDisabled}
              @click=${() => this.toggleOption(opt)}
            >
              <span class="switch-cluster" aria-hidden="true">
                <span class="switch-track"><span class="switch-thumb"></span></span>
                ${this.showStateLabels
                  ? html`<span class="switch-state-label">${resolveEmrToggleStateLabel(checked, this.onLabel, this.offLabel)}</span>`
                  : nothing}
              </span>
              <span class="row-copy">
                <span class="row-title-line">
                  ${optIcon ? html`<span class="row-icon" aria-hidden="true">${renderEmrSvgIcon(optIcon, 14)}</span>` : nothing}
                  <span>${opt.label}</span>
                  ${opt.readOnly ? html`<span class="row-icon" aria-label="Read-only option">${renderEmrSvgIcon('lock', 12)}</span>` : nothing}
                  ${renderOptionBadgeLit(opt.badge, opt.tone)}
                </span>
                ${opt.description ? html`<span class="row-desc">${opt.description}</span>` : nothing}
              </span>
            </button>`;
          })}
        `)}
      </div>
    </div>`;

    if (this.labelHidden) return group;

    return html`<div class="emr-field" part="field">
      ${this.label || this.showSelectionCount || showClear
        ? html`<div class="choice-group-top">
            ${this.label
              ? html`<span class="emr-label">${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</span>`
              : html`<span></span>`}
            ${this.showSelectionCount || showClear
              ? html`<div class="choice-group-actions" data-emr-print="hide">
                  ${this.showSelectionCount
                    ? html`<span class="choice-group-count">${formatCheckboxSelectionCount(current, this.maxSelections)}</span>`
                    : nothing}
                  ${showClear
                    ? html`<button
                        type="button"
                        class="clear-inline-btn"
                        aria-label=${`${this.clearLabel} ${this.label || this.ariaLabel || 'selection'}`}
                        @click=${() => this.handleClear()}
                      >
                        ${renderEmrSvgIcon('close', 14)}
                        <span>${this.clearLabel}</span>
                      </button>`
                    : nothing}
                </div>`
              : nothing}
          </div>`
        : nothing}
      ${group}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.warning
          ? html`<span id=${msgId} class="emr-warning" role="status">${this.warning}</span>`
          : this.hint
            ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
            : nothing}
    </div>`;
  }
}

/** 2. EmrTreeViewElement (`emr-tree-view`) */
export class EmrTreeViewElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-tree-view');
  private isFocusedInside = false;
  private typeaheadBuffer = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel: string | null = null;
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) nodes: readonly EmrTreeNode[] = [];
  @property({ attribute: false }) selectedIds: readonly string[] = [];
  @property({ attribute: false }) values?: readonly string[];
  @property({ attribute: false }) expandedIds?: readonly string[];
  @property({ attribute: false }) defaultExpandedIds?: readonly string[];
  @property({ type: Boolean }) multiple = false;
  @property({ type: String }) checkStrategy: EmrTreeCheckStrategy = 'cascade';
  @property({ type: Number }) maxSelections?: number;
  @property({ type: Boolean }) searchable = false;
  @property({ type: String }) searchQuery = '';
  @property({ type: String }) searchPlaceholder = 'Filter hierarchy…';
  @property({ type: Boolean }) highlightMatch = true;
  @property({ type: Boolean }) showExpandControls = false;
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: String }) size: 'md' | 'sm' = 'md';
  @property({ type: Number }) maxHeight = 320;
  @property({ type: String }) emptyMessage = 'No matching items';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';

  @state() private localExpandedIds: readonly string[] = [];
  @state() private expandedInit = false;
  @state() private focusedNodeId: string | null = null;

  get value(): readonly string[] | string | null {
    const ids = this.effectiveSelectedIds;
    return this.multiple ? ids : (ids[0] ?? null);
  }
  set value(next: readonly string[] | string | null) {
    if (Array.isArray(next)) {
      this.selectedIds = next;
      if (this.values !== undefined) this.values = next;
    } else if (typeof next === 'string' && next) {
      this.selectedIds = [next];
      if (this.values !== undefined) this.values = [next];
    } else {
      this.selectedIds = [];
      if (this.values !== undefined) this.values = [];
    }
  }

  private get effectiveSelectedIds(): readonly string[] {
    return this.values !== undefined ? this.values : this.selectedIds;
  }

  private get activeExpandedIds(): readonly string[] {
    if (this.expandedIds !== undefined) return this.expandedIds;
    if (!this.expandedInit) {
      return resolveDefaultExpandedTreeIds(this.nodes, this.defaultExpandedIds);
    }
    return this.localExpandedIds;
  }

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private emitSelection(nextIds: readonly string[]): void {
    this.selectedIds = nextIds;
    if (this.values !== undefined) this.values = nextIds;
    this.dispatchEvent(new CustomEvent<readonly string[]>('selectedIdsChange', { detail: nextIds, bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent<readonly string[]>('valuesChange', { detail: nextIds, bubbles: true, composed: true }));
    this.emitValueChange(this.multiple ? nextIds : (nextIds[0] ?? null));
  }

  private emitExpanded(nextExpanded: readonly string[]): void {
    this.expandedInit = true;
    this.localExpandedIds = nextExpanded;
    if (this.expandedIds !== undefined) this.expandedIds = nextExpanded;
    this.dispatchEvent(new CustomEvent<readonly string[]>('expandedIdsChange', { detail: nextExpanded, bubbles: true, composed: true }));
  }

  private toggleExpand(id: string): void {
    if (this.disabled) return;
    const set = new Set(this.activeExpandedIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.emitExpanded(Array.from(set));
  }

  private activateRow(row: EmrFlatTreeRow): void {
    if (this.disabled || row.node.disabled) return;
    this.focusedNodeId = row.node.id;
    if (!row.selectable && row.hasChildren && this.checkStrategy !== 'cascade') {
      this.toggleExpand(row.node.id);
      return;
    }
    if (this.readOnly || row.node.readOnly) return;
    this.dispatchEvent(new CustomEvent<EmrTreeNode>('nodeActivated', { detail: row.node, bubbles: true, composed: true }));
    if (this.multiple) {
      const next = toggleTreeNodeCheck(
        this.nodes,
        this.effectiveSelectedIds,
        row.node.id,
        this.checkStrategy,
        this.maxSelections,
      );
      if (next !== this.effectiveSelectedIds) {
        this.emitSelection(next);
      }
    } else {
      const current = this.effectiveSelectedIds[0] ?? null;
      const nextVal = this.clearable && current === row.node.id ? null : row.node.id;
      this.emitSelection(nextVal ? [nextVal] : []);
    }
  }

  private clearAll(): void {
    if (this.locked) return;
    const next = clearTreeSelection(this.nodes, this.effectiveSelectedIds);
    this.emitSelection(next);
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
  }

  private focusNodeById(nodeId: string): void {
    this.focusedNodeId = nodeId;
    const items = Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? []);
    const target = items.find((el) => el.getAttribute('data-node-id') === nodeId);
    target?.focus();
  }

  private handleFocusIn(): void {
    if (!this.isFocusedInside) {
      this.isFocusedInside = true;
      this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
    }
  }

  private handleFocusOut(event: FocusEvent): void {
    const currentTarget = event.currentTarget as HTMLElement | null;
    const relatedTarget = event.relatedTarget as Node | null;
    if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    if (this.isFocusedInside) {
      this.isFocusedInside = false;
      this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
    }
  }

  private renderHighlighted(text: string) {
    if (!this.highlightMatch || !this.searchQuery) return text;
    return splitMatchHighlightSegments(text, this.searchQuery).map((seg) =>
      seg.matched ? html`<mark class="tree-match">${seg.text}</mark>` : seg.text,
    );
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const selectedIds = this.effectiveSelectedIds;
    const isInvalid = this.invalid || Boolean(this.error);
    const isWarning = !isInvalid && Boolean(this.warning);
    const rows = flattenVisibleTreeNodes(this.nodes, this.activeExpandedIds, {
      searchQuery: this.searchQuery,
      selectedIds,
      checkStrategy: this.checkStrategy,
    });
    const tabStopId =
      (this.focusedNodeId && rows.some((r) => r.node.id === this.focusedNodeId && !r.node.disabled)
        ? this.focusedNodeId
        : null) ??
      (selectedIds[0] && rows.some((r) => r.node.id === selectedIds[0] && !r.node.disabled)
        ? selectedIds[0]
        : null) ??
      rows.find((r) => !r.node.disabled)?.node.id ??
      rows[0]?.node.id ??
      null;
    const showClear = isEmrTreeClearable({
      clearable: this.clearable,
      disabled: this.disabled,
      readOnly: this.readOnly,
      multiple: this.multiple,
      value: selectedIds[0] ?? null,
      values: selectedIds,
      nodes: this.nodes,
    });
    const iconSize = this.size === 'sm' ? 11 : 12;

    const body = html`<div
      class="emr-field"
      @focusin=${() => this.handleFocusIn()}
      @focusout=${(e: FocusEvent) => this.handleFocusOut(e)}
    >
      ${this.searchable || (!this.labelHidden && (this.showExpandControls || showClear))
        ? html`<div class="tree-toolbar" data-emr-print="hide">
            ${this.searchable
              ? html`<div class="tree-search-wrap">
                  <span class="tree-search-icon" aria-hidden="true">${renderEmrSvgIcon('search', 14)}</span>
                  <input
                    type="search"
                    class="emr-control tree-search-input"
                    placeholder=${this.searchPlaceholder}
                    aria-label=${this.searchPlaceholder}
                    .value=${this.searchQuery}
                    ?disabled=${this.disabled}
                    @input=${(e: Event) => {
                      const q = (e.target as HTMLInputElement).value;
                      this.searchQuery = q;
                      this.dispatchEvent(new CustomEvent<string>('searchQueryChange', { detail: q, bubbles: true, composed: true }));
                    }}
                    @keydown=${(e: KeyboardEvent) => {
                      if (e.key === 'ArrowDown') {
                        const firstIdx = findNextTreeRowIndex(rows, -1, 'ArrowDown');
                        if (firstIdx >= 0) {
                          e.preventDefault();
                          this.focusNodeById(rows[firstIdx]!.node.id);
                        }
                      }
                    }}
                  />
                  ${this.searchQuery && !this.disabled
                    ? html`<button
                        type="button"
                        class="tree-search-clear"
                        aria-label="Clear search"
                        @click=${() => {
                          this.searchQuery = '';
                          this.dispatchEvent(new CustomEvent<string>('searchQueryChange', { detail: '', bubbles: true, composed: true }));
                        }}
                      >${renderEmrSvgIcon('close', 14)}</button>`
                    : nothing}
                </div>`
              : nothing}
            ${!this.labelHidden && (this.showExpandControls || showClear)
              ? html`<div class="choice-group-actions">
                  ${this.showExpandControls
                    ? html`<button
                          type="button"
                          class="emr-btn emr-btn--ghost"
                          ?disabled=${this.disabled}
                          @click=${() => this.emitExpanded(collectAllExpandableTreeIds(this.nodes))}
                        >Expand all</button>
                        <button
                          type="button"
                          class="emr-btn emr-btn--ghost"
                          ?disabled=${this.disabled}
                          @click=${() => this.emitExpanded([])}
                        >Collapse all</button>`
                    : nothing}
                  ${showClear
                    ? html`<button
                        type="button"
                        class="clear-inline-btn"
                        aria-label=${`${this.clearLabel} ${this.label || this.ariaLabel || 'selection'}`}
                        @click=${() => this.clearAll()}
                      >
                        ${renderEmrSvgIcon('close', 14)}
                        <span>${this.clearLabel}</span>
                      </button>`
                    : nothing}
                </div>`
              : nothing}
          </div>`
        : nothing}
      <div
        id=${id}
        role="tree"
        class=${`tree-list${this.size === 'sm' ? ' tree-list--sm' : ''}`}
        style=${`--tree-max-height: ${Math.max(120, this.maxHeight)}px;`}
        data-emr-print="expand"
        aria-label=${this.ariaLabel || this.label || 'Tree view'}
        aria-multiselectable=${this.multiple ? 'true' : nothing}
        aria-required=${this.required ? 'true' : nothing}
        aria-readonly=${this.readOnly ? 'true' : nothing}
        aria-invalid=${isInvalid ? 'true' : nothing}
        data-warning=${isWarning ? 'true' : nothing}
        data-disabled=${this.disabled ? 'true' : nothing}
        aria-describedby=${!this.labelHidden && (this.error || this.warning || this.hint) ? msgId : nothing}
      >
        ${rows.length === 0 ? html`<div class="tree-empty" role="status">${this.emptyMessage}</div>` : nothing}
        ${rows.map((row, idx) => {
          const isSelected = this.multiple ? row.checkState === 'checked' : selectedIds.includes(row.node.id);
          const showCheckbox = this.multiple && (row.selectable || this.checkStrategy === 'cascade');
          const rowDisabled = this.disabled || Boolean(row.node.disabled);
          const rowIcon = asLitIcon(row.node.icon);
          return html`<button
            type="button"
            role="treeitem"
            class="tree-row"
            data-node-id=${row.node.id}
            data-readonly=${row.node.readOnly ? 'true' : nothing}
            style=${`--tree-depth: ${row.depth};`}
            tabindex=${rowDisabled ? -1 : (tabStopId === row.node.id ? 0 : -1)}
            aria-level=${String(row.depth + 1)}
            aria-expanded=${row.hasChildren ? String(row.expanded) : nothing}
            aria-selected=${String(isSelected)}
            aria-checked=${showCheckbox ? (row.checkState === 'mixed' ? 'mixed' : String(row.checkState === 'checked')) : nothing}
            aria-readonly=${this.readOnly || row.node.readOnly ? 'true' : nothing}
            ?disabled=${rowDisabled}
            @focus=${() => {
              this.focusedNodeId = row.node.id;
            }}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
                e.preventDefault();
                const nextIdx = findNextTreeRowIndex(rows, idx, e.key);
                if (nextIdx >= 0) this.focusNodeById(rows[nextIdx]!.node.id);
              } else if (e.key === 'ArrowRight' && row.hasChildren) {
                e.preventDefault();
                if (!row.expanded) {
                  this.toggleExpand(row.node.id);
                } else {
                  const nextIdx = findNextTreeRowIndex(rows, idx, 'ArrowDown');
                  if (nextIdx > idx && rows[nextIdx]!.depth > row.depth) {
                    this.focusNodeById(rows[nextIdx]!.node.id);
                  }
                }
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (row.hasChildren && row.expanded) {
                  this.toggleExpand(row.node.id);
                } else if (row.parentId) {
                  const parentRow = rows.find((r) => r.node.id === row.parentId);
                  if (parentRow && !parentRow.node.disabled) {
                    this.focusNodeById(parentRow.node.id);
                  }
                }
              } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                this.typeaheadBuffer += e.key;
                if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
                this.typeaheadTimer = setTimeout(() => {
                  this.typeaheadBuffer = '';
                  this.typeaheadTimer = null;
                }, 500);
                const matchIdx = findTypeaheadTreeRowIndex(rows, this.typeaheadBuffer, idx);
                if (matchIdx >= 0) this.focusNodeById(rows[matchIdx]!.node.id);
              }
            }}
            @click=${() => this.activateRow(row)}
          >
            <span
              class="tree-twisty"
              aria-hidden="true"
              @click=${(e: Event) => {
                if (!row.hasChildren) return;
                e.stopPropagation();
                this.toggleExpand(row.node.id);
              }}
            >
              ${row.hasChildren ? renderEmrSvgIcon(row.expanded ? 'chevron-down' : 'chevron-right', 14) : nothing}
            </span>
            ${showCheckbox
              ? html`<span
                  class=${`checkbox-box${this.size === 'sm' ? ' checkbox-box--sm' : ''}`}
                  data-checked=${row.checkState === 'checked' ? 'true' : nothing}
                  data-mixed=${row.checkState === 'mixed' ? 'true' : nothing}
                  aria-hidden="true"
                >
                  ${row.checkState === 'mixed'
                    ? renderEmrSvgIcon('minus', iconSize)
                    : row.checkState === 'checked'
                      ? renderEmrSvgIcon('check', iconSize)
                      : nothing}
                </span>`
              : nothing}
            ${rowIcon ? html`<span class="row-icon" aria-hidden="true">${renderEmrSvgIcon(rowIcon, 14)}</span>` : nothing}
            <span class="row-copy">
              <span class="row-title-line">
                <span>${this.renderHighlighted(row.node.label)}</span>
                ${row.node.code ? html`<span class="emr-badge emr-badge--sm emr-badge--neutral">${this.renderHighlighted(row.node.code)}</span>` : nothing}
                ${row.node.readOnly ? html`<span class="row-icon" aria-label="Read-only node">${renderEmrSvgIcon('lock', 12)}</span>` : nothing}
                ${renderOptionBadgeLit(row.node.badge, row.node.tone)}
              </span>
              ${row.node.description ? html`<span class="row-desc">${this.renderHighlighted(row.node.description)}</span>` : nothing}
            </span>
          </button>`;
        })}
      </div>
    </div>`;

    if (this.labelHidden) return body;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<span class="emr-label">${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</span>`
        : nothing}
      ${body}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.warning
          ? html`<span id=${msgId} class="emr-warning" role="status">${this.warning}</span>`
          : this.hint
            ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
            : nothing}
    </div>`;
  }
}

/** 3. EmrTreeSelectElement (`emr-tree-select`) */
export class EmrTreeSelectElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-tree-select');
  private isFocusedInside = false;

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel: string | null = null;
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) placeholder = 'Select item…';
  @property({ attribute: false }) nodes: readonly EmrTreeNode[] = [];
  @property({ type: String }) value: string | null = null;
  @property({ attribute: false }) selectedIds: readonly string[] = [];
  @property({ attribute: false }) values?: readonly string[];
  @property({ attribute: false }) expandedIds?: readonly string[];
  @property({ attribute: false }) defaultExpandedIds?: readonly string[];
  @property({ type: Boolean }) multiple = false;
  @property({ type: String }) checkStrategy: EmrTreeCheckStrategy = 'cascade';
  @property({ type: String }) displayMode: 'path' | 'leaf' = 'path';
  @property({ type: String }) separator = ' / ';
  @property({ type: Boolean }) closeOnSelect?: boolean;
  @property({ type: Number }) maxTagCount?: number;
  @property({ type: Number }) maxSelections?: number;
  @property({ type: Boolean }) searchable = true;
  @property({ type: String }) searchPlaceholder = 'Filter options…';
  @property({ type: Boolean }) showExpandControls = false;
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: String }) variant: 'outline' | 'filled' | 'subtle' = 'outline';
  @property({ type: String }) size: 'md' | 'sm' = 'md';
  @property({ type: Boolean }) loading = false;
  @property({ type: Boolean }) open = false;
  @property({ type: String }) emptyMessage = 'No matching items';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';

  @state() private localExpandedIds: readonly string[] = [];
  @state() private expandedInit = false;

  private readonly onDocumentPointerDown = (e: Event) => {
    if (!this.open) return;
    if (!e.composedPath().includes(this)) {
      this.setOpen(false);
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', this.onDocumentPointerDown);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', this.onDocumentPointerDown);
    }
  }

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private get effectiveIds(): readonly string[] {
    if (this.multiple) {
      return this.values !== undefined ? this.values : this.selectedIds;
    }
    if (this.value) return [this.value];
    return [];
  }

  private get activeExpandedIds(): readonly string[] {
    if (this.expandedIds !== undefined) return this.expandedIds;
    if (!this.expandedInit) {
      return resolveEmrTreeSelectDefaultExpanded(
        this.nodes,
        this.value,
        this.effectiveIds,
        this.defaultExpandedIds,
      );
    }
    return this.localExpandedIds;
  }

  private setOpen(next: boolean, restoreFocus = false): void {
    if (this.locked && next) return;
    this.open = next;
    this.dispatchEvent(new CustomEvent<boolean>('openChange', { detail: next, bubbles: true, composed: true }));
    if (!next && restoreFocus) {
      this.updateComplete.then(() => {
        this.shadowRoot?.querySelector<HTMLButtonElement>('.trigger-btn')?.focus();
      });
    }
  }

  private emitMultiIds(nextIds: readonly string[]): void {
    this.selectedIds = nextIds;
    if (this.values !== undefined) this.values = nextIds;
    this.dispatchEvent(new CustomEvent<readonly string[]>('selectedIdsChange', { detail: nextIds, bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent<readonly string[]>('valuesChange', { detail: nextIds, bubbles: true, composed: true }));
    this.emitValueChange(nextIds);
  }

  private removeChip(targetId: string): void {
    if (this.locked) return;
    const next = removeTreeSelectionChip(this.nodes, this.effectiveIds, targetId, this.checkStrategy);
    if (next !== this.effectiveIds) {
      this.emitMultiIds(next);
    }
  }

  private clearAll(): void {
    if (this.locked) return;
    if (this.multiple) {
      const next = clearTreeSelection(this.nodes, this.effectiveIds);
      this.emitMultiIds(next);
    } else {
      const kept = this.value ? clearTreeSelection(this.nodes, [this.value]) : [];
      const nextVal = kept[0] ?? null;
      this.value = nextVal;
      this.selectedIds = nextVal ? [nextVal] : [];
      this.dispatchEvent(new CustomEvent<readonly string[]>('selectedIdsChange', { detail: this.selectedIds, bubbles: true, composed: true }));
      this.emitValueChange(nextVal);
    }
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
  }

  private handleFocusIn(): void {
    if (!this.isFocusedInside) {
      this.isFocusedInside = true;
      this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
    }
  }

  private handleFocusOut(event: FocusEvent): void {
    const currentTarget = event.currentTarget as HTMLElement | null;
    const relatedTarget = event.relatedTarget as Node | null;
    if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    if (this.isFocusedInside) {
      this.isFocusedInside = false;
      this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
    }
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const ids = this.effectiveIds;
    const isInvalid = this.invalid || Boolean(this.error);
    const isWarning = !isInvalid && Boolean(this.warning);
    const summary = buildEmrTreeSelectSummary({
      nodes: this.nodes,
      multiple: this.multiple,
      value: this.value,
      values: ids,
      displayMode: this.displayMode,
      separator: this.separator,
      placeholder: this.placeholder,
      maxTagCount: this.maxTagCount,
    });
    const showClear = isEmrTreeClearable({
      clearable: this.clearable,
      disabled: this.disabled,
      readOnly: this.readOnly,
      multiple: this.multiple,
      value: this.value,
      values: ids,
      nodes: this.nodes,
    });
    const shellCls = [
      'select-shell',
      this.variant === 'filled' ? 'select-shell--filled' : '',
      this.variant === 'subtle' ? 'select-shell--subtle' : '',
    ].filter(Boolean).join(' ');
    const triggerCls = `trigger-btn${this.size === 'sm' ? ' trigger-btn--sm' : ''}`;

    const control = html`<div
      class="popover-anchor"
      @focusin=${() => this.handleFocusIn()}
      @focusout=${(e: FocusEvent) => this.handleFocusOut(e)}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === 'Escape' && this.open) {
          e.preventDefault();
          e.stopPropagation();
          this.setOpen(false, true);
        }
      }}
    >
      <div
        class=${shellCls}
        data-open=${this.open && !this.locked ? 'true' : nothing}
        data-invalid=${isInvalid ? 'true' : nothing}
        data-warning=${isWarning ? 'true' : nothing}
        data-readonly=${this.readOnly ? 'true' : nothing}
        data-disabled=${this.disabled ? 'true' : nothing}
      >
        ${this.multiple && (summary.visibleChips.length > 0 || summary.overflowCount > 0)
          ? html`<div class="select-chips" aria-label=${this.ariaLabel || this.label || 'Selected items'}>
              ${summary.visibleChips.map((chip) => html`
                <span class="select-chip" data-readonly=${chip.readOnly ? 'true' : nothing}>
                  <span>${chip.label}</span>
                  ${chip.readOnly
                    ? html`<span class="row-icon" aria-hidden="true">${renderEmrSvgIcon('lock', 11)}</span>`
                    : !this.locked && !chip.disabled
                      ? html`<button
                          type="button"
                          class="select-chip-remove"
                          aria-label=${`Remove ${chip.label}`}
                          @click=${(e: Event) => {
                            e.stopPropagation();
                            this.removeChip(chip.id);
                          }}
                        >${renderEmrSvgIcon('close', 12)}</button>`
                      : nothing}
                </span>
              `)}
              ${summary.overflowCount > 0
                ? html`<span class="select-chip select-chip--overflow">+${summary.overflowCount}</span>`
                : nothing}
            </div>`
          : nothing}
        <button
          id=${id}
          type="button"
          role="combobox"
          class=${triggerCls}
          aria-expanded=${String(this.open && !this.locked)}
          aria-haspopup="tree"
          aria-controls=${this.open && !this.locked ? `${id}-panel` : nothing}
          aria-label=${this.ariaLabel || (this.labelHidden ? (this.label || 'Select item') : nothing) || nothing}
          aria-required=${this.required ? 'true' : nothing}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          aria-invalid=${isInvalid ? 'true' : nothing}
          aria-busy=${this.loading ? 'true' : nothing}
          aria-describedby=${!this.labelHidden && (this.error || this.warning || this.hint) ? msgId : nothing}
          ?disabled=${this.disabled}
          @click=${() => this.setOpen(!this.open)}
          @keydown=${(e: KeyboardEvent) => {
            if (this.locked) return;
            if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !this.open) {
              e.preventDefault();
              this.setOpen(true);
            }
          }}
        >
          ${!this.multiple || (!summary.visibleChips.length && summary.overflowCount === 0)
            ? html`<span class=${`trigger-text${!summary.hasSelection ? ' trigger-text--placeholder' : ''}`}>${summary.text}</span>`
            : html`<span class="trigger-text"></span>`}
          <span aria-hidden="true">${renderEmrSvgIcon(this.open ? 'chevron-up' : 'chevron-down', 16)}</span>
        </button>
        ${showClear
          ? html`<button
              type="button"
              class="trigger-clear-btn"
              data-clear-btn="true"
              data-emr-print="hide"
              aria-label=${`${this.clearLabel} ${this.label || this.ariaLabel || 'selection'}`}
              @click=${(e: Event) => {
                e.stopPropagation();
                this.clearAll();
              }}
            >${renderEmrSvgIcon('close', 14)}</button>`
          : nothing}
      </div>
      ${this.open && !this.locked
        ? html`<div id=${`${id}-panel`} class="dropdown-panel">
            <emr-tree-view
              labelHidden
              .label=${this.label || this.ariaLabel || 'Options'}
              .nodes=${this.nodes}
              .selectedIds=${ids}
              .expandedIds=${this.activeExpandedIds}
              .multiple=${this.multiple}
              .checkStrategy=${this.checkStrategy}
              .maxSelections=${this.maxSelections}
              .searchable=${this.searchable}
              .searchPlaceholder=${this.searchPlaceholder}
              .showExpandControls=${this.showExpandControls}
              .emptyMessage=${this.emptyMessage}
              .size=${this.size}
              @expandedIdsChange=${(e: CustomEvent<readonly string[]>) => {
                e.stopPropagation();
                this.expandedInit = true;
                this.localExpandedIds = e.detail;
                if (this.expandedIds !== undefined) this.expandedIds = e.detail;
                this.dispatchEvent(new CustomEvent<readonly string[]>('expandedIdsChange', { detail: e.detail, bubbles: true, composed: true }));
              }}
              @selectedIdsChange=${(e: CustomEvent<readonly string[]>) => {
                e.stopPropagation();
                const nextIds = e.detail;
                const shouldClose = resolveEmrSelectCloseOnSelect(this.multiple, this.closeOnSelect);
                if (this.multiple) {
                  this.emitMultiIds(nextIds);
                  if (shouldClose) this.setOpen(false, true);
                } else {
                  const nextVal = nextIds[0] ?? null;
                  this.value = nextVal;
                  this.selectedIds = nextIds;
                  this.dispatchEvent(new CustomEvent<readonly string[]>('selectedIdsChange', { detail: nextIds, bubbles: true, composed: true }));
                  this.emitValueChange(nextVal);
                  if (shouldClose) this.setOpen(false, true);
                }
              }}
            ></emr-tree-view>
          </div>`
        : nothing}
    </div>`;

    if (this.labelHidden) return control;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${control}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.warning
          ? html`<span id=${msgId} class="emr-warning" role="status">${this.warning}</span>`
          : this.hint
            ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
            : nothing}
    </div>`;
  }
}

type LitCropDragMode = 'move' | 'pan' | 'nw' | 'ne' | 'sw' | 'se';

function normalizeLitCombinedRotation(base90: number, straighten: number): number {
  const raw = base90 + straighten;
  if (raw === 180) return 180;
  let norm = ((raw % 360) + 360) % 360;
  if (norm > 180) norm -= 360;
  return Math.round(norm * 10) / 10;
}

function applyLitCropDrag(
  mode: LitCropDragMode,
  startRect: EmrImageCropRect,
  dx: number,
  dy: number,
  aspectRatio: number | null,
): EmrImageCropRect {
  if (mode === 'move') {
    return clampCropRect(
      {
        x: startRect.x + dx,
        y: startRect.y + dy,
        width: startRect.width,
        height: startRect.height,
      },
      aspectRatio,
    );
  }
  const minSize = 0.1;
  let candidate: EmrImageCropRect = startRect;
  if (mode === 'se') {
    candidate = {
      x: startRect.x,
      y: startRect.y,
      width: Math.max(minSize, startRect.width + dx),
      height: Math.max(minSize, startRect.height + dy),
    };
  } else if (mode === 'nw') {
    const nextW = Math.max(minSize, startRect.width - dx);
    const nextH = Math.max(minSize, startRect.height - dy);
    candidate = {
      x: startRect.x + (startRect.width - nextW),
      y: startRect.y + (startRect.height - nextH),
      width: nextW,
      height: nextH,
    };
  } else if (mode === 'ne') {
    const nextW = Math.max(minSize, startRect.width + dx);
    const nextH = Math.max(minSize, startRect.height - dy);
    candidate = {
      x: startRect.x,
      y: startRect.y + (startRect.height - nextH),
      width: nextW,
      height: nextH,
    };
  } else if (mode === 'sw') {
    const nextW = Math.max(minSize, startRect.width - dx);
    const nextH = Math.max(minSize, startRect.height + dy);
    candidate = {
      x: startRect.x + (startRect.width - nextW),
      y: startRect.y,
      width: nextW,
      height: nextH,
    };
  }
  return computeAspectLockedCropRect(startRect, candidate, aspectRatio, minSize);
}

function rasterizeLitCanvasCrop(
  imgEl: HTMLImageElement | null | undefined,
  canvasEl: HTMLCanvasElement | null | undefined,
  transform: EmrImageCropTransform,
  mimeType: string,
  fallbackSrc: string,
): string {
  if (!imgEl || !canvasEl) return fallbackSrc;
  const natW = imgEl.naturalWidth || imgEl.width || 360;
  const natH = imgEl.naturalHeight || imgEl.height || 260;
  const plan = computeCroppedCanvasPlan(natW, natH, transform);
  canvasEl.width = plan.outputWidth;
  canvasEl.height = plan.outputHeight;
  try {
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return fallbackSrc;
    ctx.clearRect(0, 0, plan.outputWidth, plan.outputHeight);
    ctx.save();
    ctx.translate(plan.offsetX, plan.offsetY);
    ctx.translate(plan.centerX, plan.centerY);
    ctx.rotate(plan.rotationRad);
    ctx.scale(plan.scaleX, plan.scaleY);
    ctx.drawImage(
      imgEl,
      -plan.drawWidth / 2,
      -plan.drawHeight / 2,
      plan.drawWidth,
      plan.drawHeight,
    );
    ctx.restore();
    return canvasEl.toDataURL(mimeType || 'image/png');
  } catch {
    return fallbackSrc;
  }
}

/** 4. EmrImageViewerElement (`emr-image-viewer`) */
export class EmrImageViewerElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-image-viewer');
  private panStart?: { pointerId: number; x: number; y: number; basePanX: number; basePanY: number };
  private fullscreenTriggerEl: HTMLElement | null = null;

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = 'Image viewer';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) src = '';
  @property({ type: String }) alt = '';
  @property({ type: String }) caption = '';
  @property({ attribute: false }) images: readonly EmrImageItem[] = [];
  @property({ type: Number }) activeIndex = 0;
  @property({ attribute: false }) viewport: EmrImageViewportState = DEFAULT_IMAGE_VIEWPORT;
  @property({ type: Boolean }) fullscreen = false;
  @property({ type: Boolean }) allowFullscreen = true;
  @property({ type: Boolean }) showThumbnails = true;
  @property({ type: Number }) height = 300;
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;

  private get resolvedItems(): readonly EmrImageItem[] {
    if (this.images.length > 0) return this.images;
    if (this.src) {
      return [{ id: 'single', src: this.src, alt: this.alt || this.label, caption: this.caption }];
    }
    return [];
  }

  private updateViewport(patch: Partial<EmrImageViewportState>): void {
    if (this.disabled) return;
    const next: EmrImageViewportState = { ...this.viewport, ...patch };
    this.viewport = next;
    this.dispatchEvent(
      new CustomEvent<EmrImageViewportState>('viewportChange', {
        detail: next,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private setActiveIndex(nextIdx: number): void {
    if (this.disabled) return;
    const items = this.resolvedItems;
    if (!items.length) return;
    const bounded = ((nextIdx % items.length) + items.length) % items.length;
    this.activeIndex = bounded;
    this.updateViewport(DEFAULT_IMAGE_VIEWPORT);
    this.dispatchEvent(
      new CustomEvent<number>('activeIndexChange', {
        detail: bounded,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private toggleFullscreen(next: boolean, triggerEl?: HTMLElement | null): void {
    if (this.disabled) return;
    if (!this.allowFullscreen && next) return;
    if (next && triggerEl) {
      this.fullscreenTriggerEl = triggerEl;
    }
    this.fullscreen = next;
    this.dispatchEvent(
      new CustomEvent<boolean>('fullscreenChange', {
        detail: next,
        bubbles: true,
        composed: true,
      }),
    );
    if (next) {
      this.updateComplete.then(() => {
        this.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="fullscreen"]')?.focus();
      });
    } else {
      this.dispatchEvent(new CustomEvent('closeRequested', { bubbles: true, composed: true }));
      const restore = this.fullscreenTriggerEl;
      this.fullscreenTriggerEl = null;
      if (restore) {
        this.updateComplete.then(() => restore.focus());
      }
    }
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const items = this.resolvedItems;
    const boundedIndex = items.length > 0 ? Math.max(0, Math.min(items.length - 1, this.activeIndex)) : 0;
    const current = items[boundedIndex];
    const transformCss = formatImageTransformCss(this.viewport);
    const rotParts = splitRotationDegrees(this.viewport.rotationDeg);
    const isInvalid = this.invalid || Boolean(this.error);
    const describedByIds = [
      this.hint ? `${id}-hint` : '',
      this.warning ? `${id}-warning` : '',
      this.error ? `${id}-error` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`<div class="emr-field">
      ${this.label && !this.labelHidden ? html`<strong class="emr-label">${this.label}</strong>` : nothing}
      <div
        id=${id}
        role=${this.fullscreen ? 'dialog' : 'region'}
        aria-modal=${this.fullscreen ? 'true' : nothing}
        aria-label=${this.label || current?.alt || 'Clinical image viewer'}
        aria-invalid=${isInvalid ? 'true' : nothing}
        aria-disabled=${this.disabled ? 'true' : nothing}
        aria-describedby=${describedByIds || nothing}
        data-readonly=${this.readOnly ? 'true' : nothing}
        tabindex="0"
        class=${`viewer-shell${this.fullscreen ? ' viewer-shell--fullscreen' : ''}${isInvalid ? ' viewer-shell--invalid' : ''}${!isInvalid && this.warning ? ' viewer-shell--warning' : ''}${this.readOnly ? ' viewer-shell--readonly' : ''}${this.disabled ? ' viewer-shell--disabled' : ''}`}
        @focusin=${() => this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }))}
        @focusout=${() => this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }))}
        @keydown=${(e: KeyboardEvent) => {
          if (this.disabled) return;
          const tag = (e.target as HTMLElement | null)?.tagName;
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
          if (e.key === 'Escape' && this.fullscreen) {
            e.preventDefault();
            this.toggleFullscreen(false);
          } else if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            this.updateViewport({ zoom: stepImageZoom(this.viewport.zoom, 0.25) });
          } else if (e.key === '-') {
            e.preventDefault();
            this.updateViewport({ zoom: stepImageZoom(this.viewport.zoom, -0.25) });
          } else if (e.key === '0') {
            e.preventDefault();
            this.updateViewport(DEFAULT_IMAGE_VIEWPORT);
          } else if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            const nextBase = rotateImage90(rotParts.base90, true);
            this.updateViewport({
              rotationDeg: normalizeLitCombinedRotation(nextBase, rotParts.straighten),
            });
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (items.length > 1) this.setActiveIndex(boundedIndex - 1);
            else this.updateViewport({ panX: this.viewport.panX - 24 });
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (items.length > 1) this.setActiveIndex(boundedIndex + 1);
            else this.updateViewport({ panX: this.viewport.panX + 24 });
          }
        }}
      >
        <div class="viewer-toolbar" style="background:var(--emr-surface-soft);padding:8px;border-radius:8px;border:1px solid var(--emr-border);">
        <div class="emr-row">
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="zoom-out"
            aria-label="Zoom out"
            ?disabled=${this.disabled}
            @click=${() => this.updateViewport({ zoom: stepImageZoom(this.viewport.zoom, -0.25) })}
          >${renderEmrSvgIcon('zoom-out', 16)}</button>
          <span class="emr-badge">${Math.round(this.viewport.zoom * 100)}%</span>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="zoom-in"
            aria-label="Zoom in"
            ?disabled=${this.disabled}
            @click=${() => this.updateViewport({ zoom: stepImageZoom(this.viewport.zoom, 0.25) })}
          >${renderEmrSvgIcon('zoom-in', 16)}</button>
          <button
            type="button"
            class="emr-btn emr-btn--ghost"
            data-action="reset"
            aria-label="Fit image"
            ?disabled=${this.disabled}
            @click=${() => this.updateViewport(DEFAULT_IMAGE_VIEWPORT)}
          >Fit</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="rotate-ccw"
            aria-label="Rotate counterclockwise 90 degrees"
            ?disabled=${this.disabled}
            @click=${() => {
              const nextBase = rotateImage90(rotParts.base90, false);
              this.updateViewport({
                rotationDeg: normalizeLitCombinedRotation(nextBase, rotParts.straighten),
              });
            }}
          >${renderEmrSvgIcon('rotate-ccw', 16)}</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="rotate-cw"
            aria-label="Rotate clockwise 90 degrees"
            ?disabled=${this.disabled}
            @click=${() => {
              const nextBase = rotateImage90(rotParts.base90, true);
              this.updateViewport({
                rotationDeg: normalizeLitCombinedRotation(nextBase, rotParts.straighten),
              });
            }}
          >${renderEmrSvgIcon('rotate-cw', 16)}</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="flip-h"
            aria-label="Flip horizontal"
            aria-pressed=${String(this.viewport.flipH)}
            ?disabled=${this.disabled}
            @click=${() => this.updateViewport({ flipH: !this.viewport.flipH })}
          >${renderEmrSvgIcon('flip-h', 16)}<span>Flip H</span></button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="flip-v"
            aria-label="Flip vertical"
            aria-pressed=${String(this.viewport.flipV)}
            ?disabled=${this.disabled}
            @click=${() => this.updateViewport({ flipV: !this.viewport.flipV })}
          >${renderEmrSvgIcon('flip-v', 16)}<span>Flip V</span></button>
        </div>
        <div class="emr-row">
          <label class="viewer-straighten">
            <span>Straighten</span>
            <input
              type="range"
              min="-45"
              max="45"
              step="1"
              aria-label="Straighten angle"
              aria-valuetext=${`${rotParts.straighten} degrees`}
              .value=${String(rotParts.straighten)}
              ?disabled=${this.disabled}
              @input=${(e: Event) => {
                const raw = Number((e.target as HTMLInputElement).value);
                const clamped = Math.max(-45, Math.min(45, Number.isFinite(raw) ? raw : 0));
                this.updateViewport({
                  rotationDeg: normalizeLitCombinedRotation(rotParts.base90, clamped),
                });
              }}
            />
            <span>${rotParts.straighten}°</span>
          </label>
          ${this.allowFullscreen
            ? html`<button
                type="button"
                class="emr-btn emr-btn--outline"
                data-action="fullscreen"
                aria-expanded=${String(this.fullscreen)}
                aria-label=${this.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                ?disabled=${this.disabled}
                @click=${(e: Event) =>
                  this.toggleFullscreen(!this.fullscreen, e.currentTarget as HTMLElement)}
              >${renderEmrSvgIcon(this.fullscreen ? 'minimize' : 'maximize', 16)}<span>${this.fullscreen ? 'Close' : 'Fullscreen'}</span></button>`
            : nothing}
        </div>
      </div>

      <div
        class="viewer-stage"
        style=${this.fullscreen ? 'flex:1 1 auto;' : `height:${this.height}px;`}
        @wheel=${(e: WheelEvent) => {
          if (this.disabled) return;
          e.preventDefault();
          this.updateViewport({
            zoom: stepImageZoom(this.viewport.zoom, e.deltaY < 0 ? 0.15 : -0.15),
          });
        }}
        @pointerdown=${(e: PointerEvent) => {
          if (this.disabled) return;
          const stage = e.currentTarget as HTMLElement;
          if (typeof stage.setPointerCapture === 'function') {
            stage.setPointerCapture(e.pointerId);
          }
          this.panStart = {
            pointerId: e.pointerId,
            x: e.clientX,
            y: e.clientY,
            basePanX: this.viewport.panX,
            basePanY: this.viewport.panY,
          };
        }}
        @pointermove=${(e: PointerEvent) => {
          if (!this.panStart || this.panStart.pointerId !== e.pointerId || this.disabled) return;
          this.updateViewport({
            panX: Math.round(this.panStart.basePanX + (e.clientX - this.panStart.x)),
            panY: Math.round(this.panStart.basePanY + (e.clientY - this.panStart.y)),
          });
        }}
        @pointerup=${(e: PointerEvent) => {
          if (this.panStart?.pointerId === e.pointerId) {
            const stage = e.currentTarget as HTMLElement;
            if (typeof stage.releasePointerCapture === 'function') {
              stage.releasePointerCapture(e.pointerId);
            }
            this.panStart = undefined;
          }
        }}
        @pointercancel=${(e: PointerEvent) => {
          if (this.panStart?.pointerId === e.pointerId) {
            this.panStart = undefined;
          }
        }}
      >
        ${current
          ? html`<img class="viewer-img" src=${current.src} alt=${current.alt} style=${`transform: ${transformCss};`} />`
          : html`<span class="emr-muted">No image</span>`}
      </div>

      ${current?.caption ? html`<p class="emr-muted">${current.caption}</p>` : nothing}

      ${items.length > 1
        ? html`<div class="viewer-toolbar">
            <button
              type="button"
              class="emr-btn emr-btn--outline"
              aria-label="Previous image"
              ?disabled=${this.disabled}
              @click=${() => this.setActiveIndex(boundedIndex - 1)}
            >${renderEmrSvgIcon('chevron-left', 16)}<span>Prev</span></button>
            <span class="emr-muted">${boundedIndex + 1} / ${items.length}</span>
            <button
              type="button"
              class="emr-btn emr-btn--outline"
              aria-label="Next image"
              ?disabled=${this.disabled}
              @click=${() => this.setActiveIndex(boundedIndex + 1)}
            ><span>Next</span>${renderEmrSvgIcon('chevron-right', 16)}</button>
          </div>`
        : nothing}

      ${this.showThumbnails && items.length > 1
        ? html`<div class="viewer-thumbs" role="list" aria-label="Image thumbnails">
            ${items.map(
              (item, idx) => html`<button
                type="button"
                role="listitem"
                class="viewer-thumb-btn"
                aria-label=${item.alt || `Image ${idx + 1}`}
                aria-current=${idx === boundedIndex ? 'true' : nothing}
                ?disabled=${this.disabled}
                @click=${() => this.setActiveIndex(idx)}
              ><img src=${item.src} alt=${item.alt || item.id} /></button>`,
            )}
          </div>`
        : nothing}

      ${this.hint ? html`<span id=${`${id}-hint`} class="emr-hint">${this.hint}</span>` : nothing}
      ${this.warning ? html`<span id=${`${id}-warning`} class="emr-warning" role="status">${this.warning}</span>` : nothing}
      ${this.error ? html`<span id=${`${id}-error`} class="emr-error" role="alert">${this.error}</span>` : nothing}
      </div>
    </div>`;
  }
}

/** 5. EmrImageCropperElement (`emr-image-cropper`) */
export class EmrImageCropperElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-image-cropper');
  private dragState?: {
    mode: LitCropDragMode;
    pointerId: number;
    startX: number;
    startY: number;
    startRect: EmrImageCropRect;
    startPanX: number;
    startPanY: number;
  };

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = 'Crop & Adjust Image';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) src = '';
  @property({ type: String }) alt = 'Image to crop';
  @property({ attribute: false }) aspectPresets: readonly EmrAspectPreset[] = DEFAULT_ASPECT_PRESETS;
  @property({ attribute: false }) transform: EmrImageCropTransform = DEFAULT_IMAGE_CROP_TRANSFORM;
  @property({ type: String }) outputMimeType = 'image/png';
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private get resolvedPresets(): readonly EmrAspectPreset[] {
    return this.aspectPresets.length > 0 ? this.aspectPresets : DEFAULT_ASPECT_PRESETS;
  }

  private emitTransform(patch: Partial<EmrImageCropTransform>): void {
    if (this.locked) return;
    const nextRatio = patch.aspectRatio !== undefined ? patch.aspectRatio : this.transform.aspectRatio;
    const merged: EmrImageCropTransform = {
      ...this.transform,
      ...patch,
      rect: clampCropRect(patch.rect ?? this.transform.rect, nextRatio),
      rotationDeg: clampStraightenAngle(patch.rotationDeg ?? this.transform.rotationDeg),
      zoom: stepImageZoom(patch.zoom ?? this.transform.zoom, 0),
    };
    this.transform = merged;
    this.dispatchEvent(
      new CustomEvent<EmrImageCropTransform>('cropChange', {
        detail: merged,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private selectAspectPreset(preset: EmrAspectPreset): void {
    const nextRect = clampCropRect(this.transform.rect, preset.ratio);
    this.emitTransform({ aspectRatio: preset.ratio, rect: nextRect });
  }

  private startDrag(mode: LitCropDragMode, event: PointerEvent): void {
    if (this.locked) return;
    if (mode !== 'pan') {
      event.stopPropagation();
      event.preventDefault();
    }
    const stage = this.shadowRoot?.querySelector<HTMLElement>('.cropper-stage');
    if (stage && typeof stage.setPointerCapture === 'function') {
      stage.setPointerCapture(event.pointerId);
    }
    this.dragState = {
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRect: this.transform.rect,
      startPanX: this.transform.panX,
      startPanY: this.transform.panY,
    };
  }

  private commitCrop(): void {
    if (this.locked || !this.src) return;
    const imgEl = this.shadowRoot?.querySelector<HTMLImageElement>('img.viewer-img');
    const canvasEl = this.shadowRoot?.querySelector<HTMLCanvasElement>('canvas.crop-canvas');
    const croppedDataUrl = rasterizeLitCanvasCrop(
      imgEl,
      canvasEl,
      this.transform,
      this.outputMimeType,
      this.src,
    );
    const result: EmrImageCropResult = {
      transform: this.transform,
      croppedDataUrl,
    };
    this.dispatchEvent(
      new CustomEvent<EmrImageCropResult>('cropCommitted', {
        detail: result,
        bubbles: true,
        composed: true,
      }),
    );
    this.emitValueChange(result);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const presets = this.resolvedPresets;
    const c = this.transform.rect;
    const rotParts = splitRotationDegrees(this.transform.rotationDeg);
    const focusedPresetIdx = Math.max(
      0,
      presets.findIndex((p) => p.ratio === this.transform.aspectRatio),
    );
    const isInvalid = this.invalid || Boolean(this.error);
    const describedByIds = [
      this.hint ? `${id}-hint` : '',
      this.warning ? `${id}-warning` : '',
      this.error ? `${id}-error` : '',
    ]
      .filter(Boolean)
      .join(' ');
    const transformCss = formatImageTransformCss({
      zoom: this.transform.zoom,
      panX: this.transform.panX,
      panY: this.transform.panY,
      rotationDeg: this.transform.rotationDeg,
      flipH: this.transform.flipH,
      flipV: this.transform.flipV,
    });

    return html`<div
      id=${id}
      class=${`viewer-shell${isInvalid ? ' viewer-shell--invalid' : ''}${!isInvalid && this.warning ? ' viewer-shell--warning' : ''}${this.readOnly ? ' viewer-shell--readonly' : ''}${this.disabled ? ' viewer-shell--disabled' : ''}`}
      role="group"
      aria-label=${this.label}
      aria-invalid=${isInvalid ? 'true' : nothing}
      aria-disabled=${this.disabled ? 'true' : nothing}
      aria-describedby=${describedByIds || nothing}
      data-readonly=${this.readOnly ? 'true' : nothing}
      @focusin=${() => this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }))}
      @focusout=${() => this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }))}
    >
      ${this.label && !this.labelHidden ? html`<strong class="emr-label">${this.label}</strong>` : nothing}
      <div class="viewer-toolbar">
        <div
          class="emr-row"
          role="radiogroup"
          aria-label="Aspect ratio presets"
          @keydown=${(e: KeyboardEvent) => {
            if (this.locked || presets.length === 0) return;
            let nextIdx = -1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              nextIdx = (focusedPresetIdx + 1) % presets.length;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              nextIdx = (focusedPresetIdx - 1 + presets.length) % presets.length;
            } else if (e.key === 'Home') {
              nextIdx = 0;
            } else if (e.key === 'End') {
              nextIdx = presets.length - 1;
            }
            if (nextIdx >= 0) {
              e.preventDefault();
              this.selectAspectPreset(presets[nextIdx]!);
              const group = e.currentTarget as HTMLElement;
              (group.children[nextIdx] as HTMLElement | undefined)?.focus();
            }
          }}
        >
          ${presets.map((preset, idx) => {
            const active = this.transform.aspectRatio === preset.ratio;
            return html`<button
              type="button"
              role="radio"
              data-aspect-id=${preset.id}
              class=${`emr-btn ${active ? 'emr-btn--primary' : 'emr-btn--outline'}`}
              aria-checked=${String(active)}
              tabindex=${idx === focusedPresetIdx ? 0 : -1}
              ?disabled=${this.locked}
              @click=${() => this.selectAspectPreset(preset)}
            >${preset.label}</button>`;
          })}
        </div>
        <div class="emr-row">
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="zoom-out"
            aria-label="Zoom out"
            ?disabled=${this.locked}
            @click=${() => this.emitTransform({ zoom: stepImageZoom(this.transform.zoom, -0.25) })}
          >${renderEmrSvgIcon('zoom-out', 16)}</button>
          <span class="emr-badge">${Math.round(this.transform.zoom * 100)}%</span>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="zoom-in"
            aria-label="Zoom in"
            ?disabled=${this.locked}
            @click=${() => this.emitTransform({ zoom: stepImageZoom(this.transform.zoom, 0.25) })}
          >${renderEmrSvgIcon('zoom-in', 16)}</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="rotate-ccw"
            aria-label="Rotate counterclockwise 90 degrees"
            ?disabled=${this.locked}
            @click=${() => {
              const nextBase = rotateImage90(rotParts.base90, false);
              this.emitTransform({
                rotationDeg: normalizeLitCombinedRotation(nextBase, rotParts.straighten),
              });
            }}
          >${renderEmrSvgIcon('rotate-ccw', 16)}</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="rotate-cw"
            aria-label="Rotate clockwise 90 degrees"
            ?disabled=${this.locked}
            @click=${() => {
              const nextBase = rotateImage90(rotParts.base90, true);
              this.emitTransform({
                rotationDeg: normalizeLitCombinedRotation(nextBase, rotParts.straighten),
              });
            }}
          >${renderEmrSvgIcon('rotate-cw', 16)}</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="flip-h"
            aria-label="Flip horizontal"
            aria-pressed=${String(this.transform.flipH)}
            ?disabled=${this.locked}
            @click=${() => this.emitTransform({ flipH: !this.transform.flipH })}
          >${renderEmrSvgIcon('flip-h', 16)}<span>Flip H</span></button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="flip-v"
            aria-label="Flip vertical"
            aria-pressed=${String(this.transform.flipV)}
            ?disabled=${this.locked}
            @click=${() => this.emitTransform({ flipV: !this.transform.flipV })}
          >${renderEmrSvgIcon('flip-v', 16)}<span>Flip V</span></button>
        </div>
      </div>

      <div
        class="cropper-stage"
        @pointerdown=${(e: PointerEvent) => this.startDrag('pan', e)}
        @pointermove=${(e: PointerEvent) => {
          if (!this.dragState || this.dragState.pointerId !== e.pointerId || this.locked) return;
          if (this.dragState.mode === 'pan') {
            this.emitTransform({
              panX: Math.round(this.dragState.startPanX + (e.clientX - this.dragState.startX)),
              panY: Math.round(this.dragState.startPanY + (e.clientY - this.dragState.startY)),
            });
            return;
          }
          const stage = e.currentTarget as HTMLElement;
          const bounds = stage.getBoundingClientRect();
          const w = bounds.width > 0 ? bounds.width : 300;
          const h = bounds.height > 0 ? bounds.height : 260;
          const dx = (e.clientX - this.dragState.startX) / w;
          const dy = (e.clientY - this.dragState.startY) / h;
          const nextRect = applyLitCropDrag(
            this.dragState.mode,
            this.dragState.startRect,
            dx,
            dy,
            this.transform.aspectRatio,
          );
          this.emitTransform({ rect: nextRect });
        }}
        @pointerup=${(e: PointerEvent) => {
          if (this.dragState?.pointerId === e.pointerId) {
            const stage = e.currentTarget as HTMLElement;
            if (typeof stage.releasePointerCapture === 'function') {
              stage.releasePointerCapture(e.pointerId);
            }
            this.dragState = undefined;
          }
        }}
        @pointercancel=${() => {
          this.dragState = undefined;
        }}
      >
        ${this.src
          ? html`<img class="viewer-img" src=${this.src} alt=${this.alt} style=${`transform: ${transformCss};`} />`
          : html`<span class="emr-muted">No image loaded for cropping</span>`}
        <div
          class="crop-box"
          role="group"
          tabindex="0"
          aria-label="Crop region. Use arrow keys to move, Shift plus arrow keys to resize."
          style=${`left:${c.x * 100}%;top:${c.y * 100}%;width:${c.width * 100}%;height:${c.height * 100}%;`}
          @pointerdown=${(e: PointerEvent) => this.startDrag('move', e)}
          @keydown=${(e: KeyboardEvent) => {
            if (this.locked) return;
            const moveStep = 0.02;
            const resizeStep = 0.05;
            let nextRect: EmrImageCropRect | null = null;
            if (e.shiftKey) {
              if (e.key === 'ArrowRight') {
                nextRect = computeAspectLockedCropRect(c, { ...c, width: c.width + resizeStep }, this.transform.aspectRatio);
              } else if (e.key === 'ArrowLeft') {
                nextRect = computeAspectLockedCropRect(c, { ...c, width: c.width - resizeStep }, this.transform.aspectRatio);
              } else if (e.key === 'ArrowDown') {
                nextRect = computeAspectLockedCropRect(c, { ...c, height: c.height + resizeStep }, this.transform.aspectRatio);
              } else if (e.key === 'ArrowUp') {
                nextRect = computeAspectLockedCropRect(c, { ...c, height: c.height - resizeStep }, this.transform.aspectRatio);
              }
            } else {
              if (e.key === 'ArrowRight') nextRect = clampCropRect({ ...c, x: c.x + moveStep }, this.transform.aspectRatio);
              else if (e.key === 'ArrowLeft') nextRect = clampCropRect({ ...c, x: c.x - moveStep }, this.transform.aspectRatio);
              else if (e.key === 'ArrowDown') nextRect = clampCropRect({ ...c, y: c.y + moveStep }, this.transform.aspectRatio);
              else if (e.key === 'ArrowUp') nextRect = clampCropRect({ ...c, y: c.y - moveStep }, this.transform.aspectRatio);
            }
            if (nextRect) {
              e.preventDefault();
              this.emitTransform({ rect: nextRect });
            }
          }}
        >
          <div class="crop-grid" aria-hidden="true"></div>
          <span class="crop-readout" aria-hidden="true">${Math.round(c.width * 100)}% × ${Math.round(c.height * 100)}%</span>
          <button type="button" class="crop-handle crop-handle--nw" aria-label="Resize crop region top-left" ?disabled=${this.locked} @pointerdown=${(e: PointerEvent) => this.startDrag('nw', e)}></button>
          <button type="button" class="crop-handle crop-handle--ne" aria-label="Resize crop region top-right" ?disabled=${this.locked} @pointerdown=${(e: PointerEvent) => this.startDrag('ne', e)}></button>
          <button type="button" class="crop-handle crop-handle--sw" aria-label="Resize crop region bottom-left" ?disabled=${this.locked} @pointerdown=${(e: PointerEvent) => this.startDrag('sw', e)}></button>
          <button type="button" class="crop-handle crop-handle--se" aria-label="Resize crop region bottom-right" ?disabled=${this.locked} @pointerdown=${(e: PointerEvent) => this.startDrag('se', e)}></button>
        </div>
        <canvas class="crop-canvas" hidden aria-hidden="true"></canvas>
      </div>

      <div class="viewer-toolbar">
        <div class="emr-row">
          <label class="viewer-straighten">
            <span>Zoom</span>
            <input
              type="range"
              min="0.25"
              max="5"
              step="0.05"
              aria-label="Crop zoom"
              .value=${String(this.transform.zoom)}
              ?disabled=${this.locked}
              @input=${(e: Event) => {
                this.emitTransform({ zoom: Number((e.target as HTMLInputElement).value) });
              }}
            />
          </label>
          <label class="viewer-straighten">
            <span>Straighten</span>
            <input
              type="range"
              min="-45"
              max="45"
              step="1"
              aria-label="Crop straighten"
              aria-valuetext=${`${rotParts.straighten} degrees`}
              .value=${String(rotParts.straighten)}
              ?disabled=${this.locked}
              @input=${(e: Event) => {
                const raw = Number((e.target as HTMLInputElement).value);
                const clamped = Math.max(-45, Math.min(45, Number.isFinite(raw) ? raw : 0));
                this.emitTransform({
                  rotationDeg: normalizeLitCombinedRotation(rotParts.base90, clamped),
                });
              }}
            />
            <span>${rotParts.straighten}°</span>
          </label>
        </div>
        <div class="emr-row">
          <button
            type="button"
            class="emr-btn emr-btn--ghost"
            data-action="reset-crop"
            ?disabled=${this.locked}
            @click=${() => this.emitTransform(DEFAULT_IMAGE_CROP_TRANSFORM)}
          >Reset</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="cancel-crop"
            ?disabled=${this.disabled}
            @click=${() => this.dispatchEvent(new CustomEvent('cancelRequested', { bubbles: true, composed: true }))}
          >Cancel</button>
          <button
            type="button"
            class="emr-btn emr-btn--primary"
            data-action="apply-crop"
            ?disabled=${this.locked || !this.src}
            @click=${() => this.commitCrop()}
          >Apply crop</button>
        </div>
      </div>

      ${this.hint ? html`<span id=${`${id}-hint`} class="emr-hint">${this.hint}</span>` : nothing}
      ${this.warning ? html`<span id=${`${id}-warning`} class="emr-warning" role="status">${this.warning}</span>` : nothing}
      ${this.error ? html`<span id=${`${id}-error`} class="emr-error" role="alert">${this.error}</span>` : nothing}
      </div>
    </div>`;
  }
}

/** 6. EmrImageUploadElement (`emr-image-upload`) */
export class EmrImageUploadElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-image-upload');
  private modalTriggerEl: HTMLElement | null = null;

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) items: readonly EmrUploadedImageItem[] = [];
  @property({ type: String }) accept = 'image/*';
  @property({ type: Boolean }) multiple = true;
  @property({ type: Number }) maxFiles?: number;
  @property({ type: Number }) maxSizeBytes?: number;
  @property({ type: Boolean }) allowCamera = false;
  @property({ attribute: false }) aspectPresets: readonly EmrAspectPreset[] = DEFAULT_ASPECT_PRESETS;
  @property({ type: String }) buttonLabel = '';
  @property({ type: String }) dropHint = 'Drag and drop clinical images here, or browse to preview and crop.';
  @property({ type: String }) emptyLabel = 'No images uploaded.';
  @property({ type: String }) cropOutputMimeType = 'image/png';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) info = '';
  @property({ type: String }) error = '';
  @property({ attribute: false }) messages: readonly EmrValidationMessage[] = [];
  @property({ type: Boolean }) invalid = false;

  @state() private viewingIndex: number | null = null;
  @state() private croppingItemId: string | null = null;
  @state() private dragOver = false;
  @state() private internalError = '';

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private get isAtMaxLimit(): boolean {
    return this.maxFiles !== undefined && this.items.length >= this.maxFiles;
  }

  private emitItems(next: readonly EmrUploadedImageItem[]): void {
    this.items = next;
    this.dispatchEvent(
      new CustomEvent<readonly EmrUploadedImageItem[]>('itemsChange', {
        detail: next,
        bubbles: true,
        composed: true,
      }),
    );
    this.emitValueChange(next);
  }

  private handleNativeFiles(fileList: FileList | null | undefined): void {
    if (this.locked || this.isAtMaxLimit || !fileList || fileList.length === 0) return;
    const validFiles: File[] = [];
    const errors: string[] = [];
    for (const f of Array.from(fileList)) {
      const msg = validateUploadedImageFile(
        { name: f.name, sizeBytes: f.size, mimeType: f.type },
        { accept: this.accept, maxSizeBytes: this.maxSizeBytes },
      );
      if (msg) errors.push(msg);
      else validFiles.push(f);
    }
    this.internalError = errors[0] ?? '';
    const remaining =
      this.maxFiles !== undefined ? Math.max(0, this.maxFiles - this.items.length) : validFiles.length;
    const picked = (this.multiple ? validFiles : validFiles.slice(0, 1)).slice(0, remaining);
    if (picked.length === 0) return;

    const summaries: EmrFileSelectionItem[] = picked.map((f) => ({
      name: f.name,
      sizeBytes: f.size,
      mimeType: f.type || 'image/jpeg',
      lastModified: f.lastModified,
    }));
    this.dispatchEvent(
      new CustomEvent<readonly EmrFileSelectionItem[]>('filesSelected', {
        detail: summaries,
        bubbles: true,
        composed: true,
      }),
    );
    this.dispatchEvent(
      new CustomEvent<readonly File[]>('nativeFilesSelected', {
        detail: picked,
        bubbles: true,
        composed: true,
      }),
    );

    const created: EmrUploadedImageItem[] = picked.map((f, idx) => {
      const placeholder = `data:${f.type || 'image/png'};base64,`;
      return {
        id: `${Date.now()}-${idx}-${f.name}`,
        name: f.name,
        src: placeholder,
        previewSrc: placeholder,
        sizeBytes: f.size,
        mimeType: f.type || 'image/png',
        alt: f.name,
      };
    });
    const combined = this.multiple ? [...this.items, ...created] : created.slice(0, 1);
    const bounded = this.maxFiles !== undefined ? combined.slice(0, this.maxFiles) : combined;
    this.emitItems(bounded);

    if (typeof FileReader !== 'undefined') {
      let latest = bounded;
      picked.forEach((file, idx) => {
        const targetId = created[idx]?.id;
        if (!targetId) return;
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : null;
          if (!dataUrl) return;
          const base = this.items.some((e) => e.id === targetId) ? this.items : latest;
          latest = base.map((entry) =>
            entry.id === targetId ? { ...entry, src: dataUrl, previewSrc: dataUrl } : entry,
          );
          this.emitItems(latest);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  private removeItem(id: string): void {
    if (this.locked) return;
    this.dispatchEvent(new CustomEvent<string>('removeRequested', { detail: id, bubbles: true, composed: true }));
    this.emitItems(this.items.filter((item) => item.id !== id));
  }

  private closeModals(): void {
    this.viewingIndex = null;
    this.croppingItemId = null;
    const restore = this.modalTriggerEl;
    this.modalTriggerEl = null;
    if (restore) {
      this.updateComplete.then(() => restore.focus());
    }
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const resolvedBtnLabel = this.buttonLabel.trim() || (this.multiple ? 'Choose images' : 'Choose image');
    const croppingItem = this.croppingItemId ? this.items.find((i) => i.id === this.croppingItemId) : undefined;
    const effectiveError = this.error || this.internalError;
    const hasWarning = Boolean(this.warning) || this.messages.some((m) => m.severity === 'warning');
    const isInvalid =
      this.invalid || Boolean(effectiveError) || this.messages.some((m) => m.severity === 'error');
    const hasMessages = Boolean(
      this.hint || this.info || this.warning || effectiveError || this.messages.length > 0,
    );
    const capacityLabel =
      this.maxFiles !== undefined
        ? this.isAtMaxLimit
          ? `Maximum of ${this.maxFiles} images reached`
          : `${this.items.length} of ${this.maxFiles} uploaded`
        : '';
    const maxSizeLabel = this.maxSizeBytes ? `Max size: ${formatByteSize(this.maxSizeBytes)}` : '';
    const resolvedPresets = this.aspectPresets.length > 0 ? this.aspectPresets : DEFAULT_ASPECT_PRESETS;

    return html`<div
      class="emr-field"
      part="field"
      data-readonly=${this.readOnly ? 'true' : nothing}
      @focusin=${() => this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }))}
      @focusout=${() => this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }))}
    >
      ${this.label && !this.labelHidden
        ? html`<span class="emr-label">${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</span>`
        : nothing}

      ${!this.readOnly
        ? html`<div
            class="upload-dropzone"
            data-dragover=${this.dragOver ? 'true' : nothing}
            data-invalid=${isInvalid ? 'true' : nothing}
            data-warning=${!isInvalid && hasWarning ? 'true' : nothing}
            @dragover=${(e: DragEvent) => {
              if (this.locked || this.isAtMaxLimit) return;
              e.preventDefault();
              this.dragOver = true;
            }}
            @dragleave=${() => {
              this.dragOver = false;
            }}
            @drop=${(e: DragEvent) => {
              if (this.locked || this.isAtMaxLimit) return;
              e.preventDefault();
              this.dragOver = false;
              this.handleNativeFiles(e.dataTransfer?.files);
            }}
          >
            <input
              id=${id}
              data-role="file"
              type="file"
              class="sr-only"
              accept=${this.accept}
              ?multiple=${this.multiple}
              ?disabled=${this.locked || this.isAtMaxLimit}
              aria-invalid=${isInvalid ? 'true' : nothing}
              aria-required=${this.required ? 'true' : nothing}
              aria-describedby=${hasMessages ? msgId : nothing}
              @change=${(e: Event) => {
                const input = e.target as HTMLInputElement;
                this.handleNativeFiles(input.files);
                input.value = '';
              }}
            />
            ${this.allowCamera
              ? html`<input
                  id=${`${id}-camera`}
                  data-role="camera"
                  type="file"
                  class="sr-only"
                  accept="image/*"
                  capture="environment"
                  ?disabled=${this.locked || this.isAtMaxLimit}
                  @change=${(e: Event) => {
                    const input = e.target as HTMLInputElement;
                    this.handleNativeFiles(input.files);
                    input.value = '';
                  }}
                />`
              : nothing}
            <button
              type="button"
              class="emr-btn emr-btn--outline upload-action-btn"
              ?disabled=${this.locked || this.isAtMaxLimit}
              @click=${() => this.shadowRoot?.querySelector<HTMLInputElement>('input[data-role="file"]')?.click()}
            >
              ${renderEmrSvgIcon('upload', 16)}
              <span>${resolvedBtnLabel}</span>
            </button>
            ${this.allowCamera
              ? html`<button
                  type="button"
                  class="emr-btn emr-btn--secondary upload-action-btn"
                  data-action="camera"
                  ?disabled=${this.locked || this.isAtMaxLimit}
                  @click=${() => {
                    this.dispatchEvent(new CustomEvent<'camera'>('captureRequested', { detail: 'camera', bubbles: true, composed: true }));
                    this.shadowRoot?.querySelector<HTMLInputElement>('input[data-role="camera"]')?.click();
                  }}
                >${renderEmrSvgIcon('camera', 16)}<span>Take photo</span></button>`
              : nothing}
            ${this.dropHint ? html`<span class="emr-muted">${this.dropHint}</span>` : nothing}
            ${capacityLabel || maxSizeLabel
              ? html`<span class="emr-hint">${capacityLabel}${capacityLabel && maxSizeLabel ? ' · ' : ''}${maxSizeLabel}</span>`
              : nothing}
          </div>`
        : this.items.length === 0
          ? html`<div class="emr-muted">${this.emptyLabel}</div>`
          : nothing}

      ${this.items.length > 0
        ? html`<div class="upload-grid" role="list" aria-label="Uploaded images">
            ${this.items.map(
              (item, idx) => html`<div class=${`upload-card${this.readOnly ? ' upload-card--readonly' : ''}`} role="listitem" data-image-id=${item.id}>
                <div class="upload-thumb-wrap">
                  <img class="upload-thumb" src=${item.previewSrc ?? item.src} alt=${item.alt || item.caption || item.name} />
                  ${item.cropTransform ? html`<span class="emr-badge emr-tone-info upload-edited-badge">Edited</span>` : nothing}
                </div>
                <div class="upload-meta">
                  <strong class="upload-name">${item.name}</strong>
                  ${item.sizeBytes !== undefined ? html`<span class="emr-hint">${formatByteSize(item.sizeBytes)}</span>` : nothing}
                </div>
                <input
                  type="text"
                  class="emr-control upload-caption"
                  data-caption-id=${item.id}
                  aria-label=${`Caption for ${item.name}`}
                  placeholder="Add clinical caption…"
                  .value=${live(item.caption ?? '')}
                  ?readonly=${this.readOnly}
                  ?disabled=${this.disabled}
                  @input=${(e: Event) => {
                    if (this.locked) return;
                    const caption = (e.target as HTMLInputElement).value;
                    this.dispatchEvent(
                      new CustomEvent<{ id: string; caption: string }>('captionChange', {
                        detail: { id: item.id, caption },
                        bubbles: true,
                        composed: true,
                      }),
                    );
                    this.emitItems(this.items.map((it) => (it.id === item.id ? { ...it, caption } : it)));
                  }}
                />
                <div class="emr-row">
                  <button
                    type="button"
                    class="emr-btn emr-btn--ghost upload-action-btn"
                    data-action="view"
                    aria-label=${`View ${item.name}`}
                    ?disabled=${this.disabled}
                    @click=${(e: Event) => {
                      this.modalTriggerEl = e.currentTarget as HTMLElement;
                      this.viewingIndex = idx;
                    }}
                  >${renderEmrSvgIcon('eye', 16)}<span>View</span></button>
                  ${!this.locked
                    ? html`<button
                          type="button"
                          class="emr-btn emr-btn--outline upload-action-btn"
                          data-action="crop"
                          aria-label=${`Crop ${item.name}`}
                          @click=${(e: Event) => {
                            this.modalTriggerEl = e.currentTarget as HTMLElement;
                            this.croppingItemId = item.id;
                            this.updateComplete.then(() => {
                              const cropper = this.shadowRoot?.querySelector('emr-image-cropper');
                              cropper?.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="cancel-crop"]')?.focus();
                            });
                          }}
                        >${renderEmrSvgIcon('crop', 16)}<span>Crop / Rotate</span></button>
                        <button
                          type="button"
                          class="emr-btn emr-btn--danger upload-action-btn"
                          data-action="remove"
                          aria-label=${`Remove ${item.name}`}
                          @click=${() => this.removeItem(item.id)}
                        >${renderEmrSvgIcon('trash', 16)}<span>Remove</span></button>`
                    : nothing}
                </div>
              </div>`,
            )}
          </div>`
        : nothing}

      ${hasMessages
        ? html`<div id=${msgId}>
            ${this.hint ? html`<div class="emr-hint">${this.hint}</div>` : nothing}
            ${this.info ? html`<div class="emr-hint" role="status">${this.info}</div>` : nothing}
            ${this.warning ? html`<div class="emr-warning" role="status">${this.warning}</div>` : nothing}
            ${effectiveError ? html`<div class="emr-error" role="alert">${effectiveError}</div>` : nothing}
            ${this.messages.map(
              (m) => html`<div class=${m.severity === 'error' ? 'emr-error' : m.severity === 'warning' ? 'emr-warning' : 'emr-hint'} role=${m.severity === 'error' ? 'alert' : 'status'}>${m.message}</div>`,
            )}
          </div>`
        : nothing}

      ${this.viewingIndex !== null
        ? html`<emr-image-viewer
            fullscreen
            .showThumbnails=${this.items.length > 1}
            .images=${this.items.map((i) => ({ id: i.id, src: i.previewSrc ?? i.src, alt: i.alt || i.name, caption: i.caption }))}
            .activeIndex=${this.viewingIndex}
            @fullscreenChange=${(e: CustomEvent<boolean>) => {
              if (!e.detail) this.closeModals();
            }}
            @closeRequested=${() => {
              this.closeModals();
            }}
          ></emr-image-viewer>`
        : nothing}

      ${croppingItem
        ? html`<div
            class="upload-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label=${`Crop / Rotate ${croppingItem.name}`}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                this.closeModals();
              }
            }}
          >
            <div class="upload-modal-dialog">
              <div class="upload-modal-header">
                <strong>Crop / Rotate ${croppingItem.name}</strong>
              </div>
              <emr-image-cropper
                .src=${croppingItem.src}
                .alt=${croppingItem.alt || croppingItem.name}
                .aspectPresets=${resolvedPresets}
                .transform=${croppingItem.cropTransform ?? DEFAULT_IMAGE_CROP_TRANSFORM}
                .outputMimeType=${this.cropOutputMimeType}
                @cropCommitted=${(e: CustomEvent<EmrImageCropResult>) => {
                  e.stopPropagation();
                  const res = e.detail;
                  this.dispatchEvent(
                    new CustomEvent<{ id: string; result: EmrImageCropResult }>('imageCropped', {
                      detail: { id: croppingItem.id, result: res },
                      bubbles: true,
                      composed: true,
                    }),
                  );
                  const updated: EmrUploadedImageItem[] = this.items.map((it) =>
                    it.id === croppingItem.id
                      ? { ...it, previewSrc: res.croppedDataUrl ?? it.previewSrc ?? it.src, cropTransform: res.transform }
                      : it,
                  );
                  this.closeModals();
                  this.emitItems(updated);
                }}
                @cancelRequested=${() => {
                  this.closeModals();
                }}
              ></emr-image-cropper>
            </div>
          </div>`
        : nothing}
    </div>`;
  }
}

/** 7. EmrDateRangeInputElement (`emr-date-range-input`) */
export class EmrDateRangeInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-date-range');
  private readonly todayParts = todayLitCalendarParts();

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) mode: 'date' | 'datetime' = 'date';
  @property({ attribute: false }) value: EmrDateRangeValue | null = null;
  @property({ type: String }) min = '';
  @property({ type: String }) max = '';
  @property({ attribute: false }) presets: readonly EmrDateRangePreset[] = [];
  @property({ type: String }) placeholder = 'YYYY-MM-DD – YYYY-MM-DD';
  @property({ type: String }) startPlaceholder = '';
  @property({ type: String }) endPlaceholder = '';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: String }) variant: EmrControlVariant = 'outline';
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: Boolean }) showCalendar = true;
  @property({ type: Boolean }) open = false;
  @property({ type: Number }) weekStartsOn: 0 | 1 = 0;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: String }) startError = '';
  @property({ type: String }) endError = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: String }) ariaDescribedBy = '';

  @state() private viewYear = this.todayParts.year;
  @state() private viewMonth0 = this.todayParts.month - 1;
  @state() private startOob = false;
  @state() private endOob = false;
  private seededMonth = false;
  private groupFocused = false;

  private readonly handleDocMouseDown = (e: MouseEvent) => {
    if (!this.open) return;
    if (!e.composedPath().includes(this)) {
      this.setCalendarOpen(false);
    }
  };

  private readonly handleDocKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.open) {
      e.preventDefault();
      this.setCalendarOpen(false);
      this.shadowRoot?.querySelector<HTMLButtonElement>('[data-calendar-toggle="true"]')?.focus();
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof document !== 'undefined') {
      document.addEventListener('mousedown', this.handleDocMouseDown);
      document.addEventListener('keydown', this.handleDocKeyDown);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (typeof document !== 'undefined') {
      document.removeEventListener('mousedown', this.handleDocMouseDown);
      document.removeEventListener('keydown', this.handleDocKeyDown);
    }
  }

  override willUpdate(changed: Map<string, unknown>): void {
    if ((changed.has('value') || changed.has('min') || !this.seededMonth) && !this.open) {
      const seed = resolveInitialCalendarMonth(this.value, this.min || undefined, this.todayParts.isoDay);
      this.viewYear = seed.year;
      this.viewMonth0 = seed.month0;
      this.seededMonth = true;
    }
  }

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private get rangeValue(): EmrDateRangeValue {
    return this.value ?? { start: null, end: null };
  }

  private setCalendarOpen(next: boolean): void {
    if (this.open === next) return;
    this.open = next;
    this.dispatchEvent(new CustomEvent<boolean>('openChange', { detail: next, bubbles: true, composed: true }));
  }

  private selectDay(iso: string): void {
    if (this.locked || this.isDateOutOfBounds(iso)) return;
    const next = selectDateRangeCalendarDay(
      this.value,
      iso,
      this.mode,
      this.min || undefined,
      this.max || undefined,
    );
    this.startOob = false;
    this.endOob = false;
    this.emitValueChange(next);
  }

  private commitBound(edge: 'start' | 'end', raw: string): void {
    if (this.locked) return;
    const res = commitDateRangeEndpoint(
      this.value,
      edge,
      raw.trim() || null,
      this.mode,
      this.min || undefined,
      this.max || undefined,
    );
    this.startOob = res.startOutOfBounds;
    this.endOob = res.endOutOfBounds;
    this.emitValueChange(res.value);
  }

  private clearRange(): void {
    if (this.locked) return;
    this.startOob = false;
    this.endOob = false;
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.emitValueChange(null);
  }

  private isDateOutOfBounds(iso: string): boolean {
    const min = this.min ? this.min.slice(0, 10) : '';
    const max = this.max ? this.max.slice(0, 10) : '';
    return Boolean((min && iso < min) || (max && iso > max));
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const r = this.rangeValue;
    const hasAny = Boolean(r.start || r.end);
    const resolvedLabel = this.ariaLabel || this.label || 'Date range';
    const startPh = this.startPlaceholder || (this.mode === 'datetime' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD');
    const endPh = this.endPlaceholder || (this.mode === 'datetime' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD');
    const displayText = r.start || r.end ? `${r.start ?? '…'} – ${r.end ?? '…'}` : this.placeholder;
    const cells = buildDateRangeCalendarGrid(this.viewYear, this.viewMonth0, this.weekStartsOn);
    const weekdays = getDateRangeWeekdays(this.weekStartsOn);
    const monthTitle = formatDateRangeMonthTitle(this.viewYear, this.viewMonth0);

    const groupError = this.error || this.startError || this.endError;
    const isGroupInvalid = Boolean(this.invalid || groupError || this.startOob || this.endOob);
    const isStartInvalid = Boolean(this.invalid || this.error || this.startError || this.startOob);
    const isEndInvalid = Boolean(this.invalid || this.error || this.endError || this.endOob);
    const describedIds = [
      groupError || this.warning || this.hint ? msgId : '',
      this.ariaDescribedBy,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    const dateOnlyRange: EmrDateRangeValue | null = this.value
      ? {
          start: this.value.start ? this.value.start.slice(0, 10) : null,
          end: this.value.end ? this.value.end.slice(0, 10) : null,
        }
      : null;

    const barCls = [
      'dr-bar',
      this.size === 'sm' ? 'dr-bar--sm' : this.size === 'lg' ? 'dr-bar--lg' : '',
      this.variant === 'filled' ? 'dr-bar--filled' : this.variant === 'subtle' ? 'dr-bar--subtle' : '',
      this.readOnly ? 'dr-bar--readonly' : '',
      !isGroupInvalid && this.warning ? 'dr-bar--warning' : '',
      isGroupInvalid ? 'dr-bar--invalid' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`<div
      class="emr-field"
      part="field"
      role="group"
      aria-label=${resolvedLabel}
      @focusin=${() => {
        if (!this.groupFocused) {
          this.groupFocused = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
      }}
      @focusout=${(e: FocusEvent) => {
        const related = e.relatedTarget as Node | null;
        if (!related || !this.shadowRoot?.contains(related)) {
          this.groupFocused = false;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }
      }}
    >
      ${this.label
        ? html`<label class=${`emr-label${this.labelHidden ? ' emr-sr-only' : ''}`} for=${id}>
            ${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
          </label>`
        : nothing}

      <div class="popover-anchor">
        <div class=${barCls}>
          <input
            id=${id}
            type="text"
            class="emr-control"
            aria-label=${`${resolvedLabel} start`}
            placeholder=${startPh}
            .value=${live(r.start ?? '')}
            ?readonly=${this.readOnly}
            ?disabled=${this.disabled}
            ?required=${this.required}
            aria-required=${this.required ? 'true' : nothing}
            aria-readonly=${this.readOnly ? 'true' : nothing}
            aria-invalid=${isStartInvalid ? 'true' : nothing}
            aria-describedby=${describedIds ?? nothing}
            @change=${(e: Event) => this.commitBound('start', (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Enter' && !this.locked) {
                this.commitBound('start', (e.target as HTMLInputElement).value);
                this.dispatchEvent(new CustomEvent('submitted', { detail: this.value, bubbles: true, composed: true }));
              }
            }}
          />
          <span class="dr-sep" aria-hidden="true">${renderEmrSvgIcon('chevron-right', 14)}</span>
          <input
            type="text"
            class="emr-control"
            aria-label=${`${resolvedLabel} end`}
            placeholder=${endPh}
            .value=${live(r.end ?? '')}
            ?readonly=${this.readOnly}
            ?disabled=${this.disabled}
            ?required=${this.required}
            aria-required=${this.required ? 'true' : nothing}
            aria-readonly=${this.readOnly ? 'true' : nothing}
            aria-invalid=${isEndInvalid ? 'true' : nothing}
            aria-describedby=${describedIds ?? nothing}
            @change=${(e: Event) => this.commitBound('end', (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Enter' && !this.locked) {
                this.commitBound('end', (e.target as HTMLInputElement).value);
                this.dispatchEvent(new CustomEvent('submitted', { detail: this.value, bubbles: true, composed: true }));
              }
            }}
          />
          ${this.clearable && hasAny && !this.locked
            ? html`<button
                type="button"
                class="clear-btn dr-icon-btn"
                data-clear-btn="true"
                aria-label=${`${this.clearLabel} ${resolvedLabel}`}
                @click=${() => this.clearRange()}
              >${renderEmrSvgIcon('close', 14)}</button>`
            : nothing}
          ${this.showCalendar
            ? html`<button
                type="button"
                class="emr-btn emr-btn--outline dr-icon-btn"
                data-calendar-toggle="true"
                aria-label=${`Toggle calendar (${displayText})`}
                aria-expanded=${String(this.open && !this.locked)}
                ?disabled=${this.locked}
                @click=${() => {
                  if (!this.locked) this.setCalendarOpen(!this.open);
                }}
              >${renderEmrSvgIcon('calendar', 16)}</button>`
            : nothing}
        </div>

        ${this.presets.length > 0 && !this.readOnly
          ? html`<div class="emr-row" style="margin-top:6px;">
              ${this.presets.map(preset => {
                const active = this.value?.start === preset.range.start && this.value?.end === preset.range.end;
                const sD = preset.range.start?.slice(0, 10);
                const eD = preset.range.end?.slice(0, 10);
                const oob = Boolean((sD && this.isDateOutOfBounds(sD)) || (eD && this.isDateOutOfBounds(eD)));
                return html`<button
                  type="button"
                  class=${`emr-btn ${active ? 'emr-btn--primary' : 'emr-btn--ghost'}`}
                  data-preset-id=${preset.id}
                  ?disabled=${this.disabled || oob}
                  @click=${() => {
                    if (this.locked || oob) return;
                    this.startOob = false;
                    this.endOob = false;
                    this.emitValueChange(preset.range);
                  }}
                >${preset.label}</button>`;
              })}
            </div>`
          : nothing}

        ${this.showCalendar && this.open && !this.locked
          ? html`<div class="dropdown-panel" role="dialog" aria-label=${`${resolvedLabel} calendar`}>
              <div class="emr-header" style="margin-bottom:6px;">
                <button
                  type="button"
                  class="emr-btn emr-btn--ghost dr-icon-btn"
                  aria-label="Previous month"
                  @click=${() => {
                    const p = stepCalendarMonth(this.viewYear, this.viewMonth0, -1);
                    this.viewYear = p.year;
                    this.viewMonth0 = p.month0;
                  }}
                >${renderEmrSvgIcon('chevron-left', 16)}</button>
                <strong>${monthTitle}</strong>
                <button
                  type="button"
                  class="emr-btn emr-btn--ghost dr-icon-btn"
                  aria-label="Next month"
                  @click=${() => {
                    const n = stepCalendarMonth(this.viewYear, this.viewMonth0, 1);
                    this.viewYear = n.year;
                    this.viewMonth0 = n.month0;
                  }}
                >${renderEmrSvgIcon('chevron-right', 16)}</button>
              </div>
              <div
                class="dr-cal-grid"
                role="grid"
                aria-label=${monthTitle}
                @keydown=${(e: KeyboardEvent) => {
                  const target = e.target as HTMLElement | null;
                  const iso = target?.getAttribute('data-iso');
                  const curIdx = iso ? cells.findIndex(c => c.iso === iso) : -1;
                  if (curIdx < 0) return;
                  let nextIdx = curIdx;
                  if (e.key === 'ArrowRight') nextIdx = Math.min(cells.length - 1, curIdx + 1);
                  else if (e.key === 'ArrowLeft') nextIdx = Math.max(0, curIdx - 1);
                  else if (e.key === 'ArrowDown') nextIdx = Math.min(cells.length - 1, curIdx + 7);
                  else if (e.key === 'ArrowUp') nextIdx = Math.max(0, curIdx - 7);
                  else if (e.key === 'Home') nextIdx = Math.floor(curIdx / 7) * 7;
                  else if (e.key === 'End') nextIdx = Math.min(cells.length - 1, Math.floor(curIdx / 7) * 7 + 6);
                  else if (e.key === 'PageUp') {
                    e.preventDefault();
                    const p = stepCalendarMonth(this.viewYear, this.viewMonth0, -1);
                    this.viewYear = p.year;
                    this.viewMonth0 = p.month0;
                    return;
                  } else if (e.key === 'PageDown') {
                    e.preventDefault();
                    const n = stepCalendarMonth(this.viewYear, this.viewMonth0, 1);
                    this.viewYear = n.year;
                    this.viewMonth0 = n.month0;
                    return;
                  } else {
                    return;
                  }
                  e.preventDefault();
                  const btns = this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button.dr-day-cell');
                  btns?.[nextIdx]?.focus();
                }}
              >
                ${weekdays.map(w => html`<span class="dr-weekday" role="columnheader">${w}</span>`)}
                ${cells.map(cell => {
                  const inRange = isIsoDateInRange(cell.iso, dateOnlyRange);
                  const isEdge = isIsoRangeEdge(cell.iso, dateOnlyRange);
                  const isOutOfBounds = this.isDateOutOfBounds(cell.iso);
                  const isToday = cell.iso === this.todayParts.isoDay;
                  const cls = [
                    'emr-btn emr-btn--ghost dr-day-cell',
                    inRange ? 'cal-day--in-range' : '',
                    isEdge ? 'cal-day--edge' : '',
                    !cell.inCurrentMonth ? 'dr-day-cell--outside' : '',
                    isToday ? 'dr-day-cell--today' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return html`<button
                    type="button"
                    data-iso=${cell.iso}
                    data-outside-month=${!cell.inCurrentMonth ? 'true' : nothing}
                    class=${cls}
                    aria-current=${isToday ? 'date' : nothing}
                    aria-pressed=${String(Boolean(isEdge || inRange))}
                    ?disabled=${this.locked || isOutOfBounds}
                    @click=${() => this.selectDay(cell.iso)}
                  >${cell.day}</button>`;
                })}
              </div>
            </div>`
          : nothing}
      </div>

      ${groupError
        ? html`<span id=${msgId} class="emr-error" role="alert">${groupError}</span>`
        : this.warning
          ? html`<span id=${msgId} class="emr-warning" role="status">${this.warning}</span>`
          : this.hint
            ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
            : nothing}
    </div>`;
  }
}

/** 8. EmrComboboxElement (`emr-combobox`) */
export class EmrComboboxElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-combobox');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) options: readonly EmrOption[] = [];
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) placeholder = 'Type or select…';
  @property({ type: String }) variant: EmrControlVariant = 'outline';
  @property({ type: String }) size: EmrSearchSelectSize = 'md';
  @property({ type: String }) filterMode: EmrSearchSelectFilterMode = 'local';
  @property({ type: Boolean }) allowCustomValue = true;
  @property({ type: Boolean }) creatable?: boolean;
  @property({ type: Boolean }) highlightMatch = true;
  @property({ type: Boolean }) autoHighlight = true;
  @property({ type: Boolean }) clearable = true;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: Boolean }) loading = false;
  @property({ type: String }) loadingMessage = 'Loading suggestions…';
  @property({ type: String }) emptyMessage = 'No matching options';
  @property({ type: Boolean }) invalid = false;
  @property({ type: String }) warning = '';
  @property({ type: Boolean }) open = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  @state() private query = '';
  @state() private isActivelyTyping = false;
  @state() private activeIndex = -1;

  private readonly onDocumentClick = (e: MouseEvent): void => {
    if (!this.open) return;
    const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
    if (!path.includes(this)) {
      this.isActivelyTyping = false;
      this.setOpen(false);
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof document !== 'undefined') {
      document.addEventListener('click', this.onDocumentClick);
    }
  }

  override disconnectedCallback(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this.onDocumentClick);
    }
    super.disconnectedCallback();
  }

  override updated(changed: Map<PropertyKey, unknown>): void {
    super.updated(changed);
    if (this.open && !this.locked) {
      this.setAttribute('data-open', 'true');
    } else {
      this.removeAttribute('data-open');
    }
  }

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private get effectiveAllowCustom(): boolean {
    return this.creatable !== undefined ? this.creatable : this.allowCustomValue;
  }

  private setOpen(next: boolean, flatOptions: readonly EmrOption[] = []): void {
    if (next && this.locked) return;
    if (this.open !== next) {
      this.open = next;
      this.dispatchEvent(new CustomEvent<boolean>('openChange', { detail: next, bubbles: true, composed: true }));
    }
    if (next) {
      this.activeIndex = resolveDefaultActiveOptionIndex(
        flatOptions,
        this.value ? [this.value] : [],
        this.isActivelyTyping ? this.query : '',
        this.autoHighlight,
      );
    } else {
      this.activeIndex = -1;
    }
  }

  private pickOption(opt: EmrOption): void {
    if (this.locked || opt.disabled || opt.readOnly) return;
    this.isActivelyTyping = false;
    this.query = opt.label;
    this.setOpen(false);
    this.dispatchEvent(new CustomEvent<EmrOption>('optionSelected', { detail: opt, bubbles: true, composed: true }));
    this.emitValueChange(opt.value);
    this.dispatchEvent(new CustomEvent<string>('submitted', { detail: opt.value, bubbles: true, composed: true }));
  }

  private commitCustom(val: string): void {
    if (this.locked) return;
    const trimmed = val.trim();
    if (!trimmed) return;
    this.isActivelyTyping = false;
    this.query = trimmed;
    this.setOpen(false);
    this.dispatchEvent(new CustomEvent<string>('customValueCommitted', { detail: trimmed, bubbles: true, composed: true }));
    this.emitValueChange(trimmed);
    this.dispatchEvent(new CustomEvent<string>('submitted', { detail: trimmed, bubbles: true, composed: true }));
  }

  private clearValue(): void {
    if (this.locked) return;
    this.isActivelyTyping = false;
    this.query = '';
    this.setOpen(false);
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent<string>('queryChange', { detail: '', bubbles: true, composed: true }));
    this.emitValueChange(null);
    this.shadowRoot?.querySelector('input')?.focus();
  }

  private renderHighlighted(text: string) {
    if (!this.highlightMatch || !this.isActivelyTyping || !this.query.trim()) {
      return text;
    }
    return splitMatchHighlightSegments(text, this.query).map((seg) =>
      seg.matched ? html`<mark class="emr-match-highlight">${seg.text}</mark>` : seg.text,
    );
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const listboxId = `${id}-listbox`;
    const msgId = `${id}-message`;
    const isInvalid = this.invalid || Boolean(this.error);
    const displayValue = resolveComboboxDisplayValue({
      isActivelyTyping: this.isActivelyTyping,
      query: this.query,
      value: this.value,
      options: this.options,
    });
    const activeQuery = this.isActivelyTyping ? this.query : '';
    const trimmed = this.query.trim();
    const scored: readonly EmrScoredOption[] = rankAndFilterOptions(this.options, activeQuery, this.filterMode);
    const bestMatchValue =
      this.isActivelyTyping && trimmed.length > 0 && this.filterMode === 'local'
        ? (scored.find((r) => r.isBestMatch)?.option.value ?? null)
        : null;
    const filtered = scored.map((r) => r.option);
    const groups: readonly EmrOptionGroup[] = groupOptions(filtered);
    const flatOptions = groups.flatMap((g) => g.options);
    const flatIndexMap = new Map<string, number>();
    flatOptions.forEach((o, idx) => flatIndexMap.set(o.value, idx));
    const customCandidate = this.isActivelyTyping
      ? resolveCustomSearchCandidate(this.query, this.options, this.effectiveAllowCustom)
      : null;
    const totalNavCount = flatOptions.length + (customCandidate ? 1 : 0);
    const activeDescendantId =
      this.open && !this.locked && this.activeIndex >= 0 && this.activeIndex < totalNavCount
        ? `${id}-opt-${this.activeIndex}`
        : nothing;

    const inputClasses = [
      'emr-control',
      'combo-input',
      this.size === 'sm' ? 'combo-input--sm' : '',
      this.variant === 'filled' ? 'combo-input--filled' : '',
      this.variant === 'subtle' ? 'combo-input--subtle' : '',
      isInvalid ? 'combo-input--invalid' : '',
      !isInvalid && this.warning ? 'combo-input--warning' : '',
      this.readOnly ? 'combo-input--readonly' : '',
      this.loading ? 'combo-input--loading' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const control = html`<div class="popover-anchor">
      <div class="combo-bar">
        <div class="combo-input-wrap">
          <input
            id=${id}
            type="text"
            role="combobox"
            class=${inputClasses}
            autocomplete="off"
            aria-autocomplete="list"
            aria-label=${!this.label ? (this.ariaLabel || this.placeholder || 'Combobox') : nothing}
            aria-expanded=${String(this.open && !this.locked)}
            aria-controls=${this.open && !this.locked ? listboxId : nothing}
            aria-activedescendant=${activeDescendantId}
            aria-busy=${this.loading ? 'true' : nothing}
            aria-invalid=${isInvalid ? 'true' : nothing}
            aria-describedby=${!this.labelHidden && (this.error || this.warning || this.hint) ? msgId : nothing}
            placeholder=${this.placeholder}
            .value=${live(displayValue)}
            ?readonly=${this.readOnly}
            ?disabled=${this.disabled}
            ?required=${this.required}
            @focus=${() => {
              if (!this.locked) {
                this.query = resolveComboboxDisplayValue({
                  isActivelyTyping: false,
                  query: '',
                  value: this.value,
                  options: this.options,
                });
                this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
                this.setOpen(true, flatOptions);
              }
            }}
            @blur=${() => {
              this.isActivelyTyping = false;
              this.setOpen(false);
              this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
            }}
            @input=${(e: Event) => {
              if (this.locked) {
                (e.target as HTMLInputElement).value = displayValue;
                return;
              }
              const nextQ = (e.target as HTMLInputElement).value;
              this.isActivelyTyping = true;
              this.query = nextQ;
              this.dispatchEvent(new CustomEvent<string>('queryChange', { detail: nextQ, bubbles: true, composed: true }));
              const nextScored = rankAndFilterOptions(this.options, nextQ, this.filterMode);
              const nextFlat = groupOptions(nextScored.map((r) => r.option)).flatMap((g) => g.options);
              this.setOpen(true, nextFlat);
              if (this.effectiveAllowCustom) {
                this.emitValueChange(nextQ.length > 0 ? nextQ : null);
              }
            }}
            @keydown=${(e: KeyboardEvent) => {
              if (this.locked) return;
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
                e.preventDefault();
                if (!this.open) {
                  this.setOpen(true, flatOptions);
                  return;
                }
                const next = findNextEnabledSearchOptionIndex(flatOptions, this.activeIndex, e.key);
                if (next !== null) {
                  this.activeIndex = next;
                } else if (customCandidate && e.key === 'ArrowDown') {
                  this.activeIndex = flatOptions.length;
                }
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (this.open && this.activeIndex >= 0 && this.activeIndex < flatOptions.length) {
                  const opt = flatOptions[this.activeIndex];
                  if (opt && !opt.disabled && !opt.readOnly) {
                    this.pickOption(opt);
                  }
                  return;
                }
                if (this.open && customCandidate && this.activeIndex === flatOptions.length) {
                  this.commitCustom(customCandidate);
                  return;
                }
                if (this.effectiveAllowCustom && trimmed) {
                  this.commitCustom(trimmed);
                  return;
                }
                const firstEnabled = flatOptions.find((o) => !o.disabled && !o.readOnly);
                if (firstEnabled) {
                  this.pickOption(firstEnabled);
                }
              } else if (e.key === 'Escape' && this.open) {
                e.preventDefault();
                this.isActivelyTyping = false;
                this.setOpen(false);
              }
            }}
          />
          ${this.loading
            ? html`<span class="combo-spinner-wrap" aria-hidden="true">
                <svg class="combo-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </span>`
            : nothing}
        </div>
        ${this.clearable && (this.value !== null && this.value !== '' || displayValue) && !this.locked
          ? html`<button
              type="button"
              class=${`clear-btn${this.variant === 'subtle' ? ' combo-btn--subtle' : ''}`}
              data-clear-btn="true"
              aria-label=${`${this.clearLabel} ${this.ariaLabel || this.label || 'value'}`}
              @click=${() => this.clearValue()}
            >${renderEmrSvgIcon('close', 14)}</button>`
          : nothing}
        <button
          type="button"
          class=${`clear-btn${this.variant === 'subtle' ? ' combo-btn--subtle' : ''}`}
          data-toggle-btn="true"
          ?disabled=${this.locked}
          aria-label=${`${this.open && !this.locked ? 'Close' : 'Open'} ${this.ariaLabel || this.label || 'suggestions'}`}
          aria-expanded=${String(this.open && !this.locked)}
          @click=${() => {
            if (this.locked) return;
            if (!this.open) {
              this.query = resolveComboboxDisplayValue({
                isActivelyTyping: false,
                query: '',
                value: this.value,
                options: this.options,
              });
              this.setOpen(true, flatOptions);
            } else {
              this.isActivelyTyping = false;
              this.setOpen(false);
            }
            this.shadowRoot?.querySelector('input')?.focus();
          }}
        >${renderEmrSvgIcon(this.open && !this.locked ? 'chevron-up' : 'chevron-down', 14)}</button>
      </div>
      ${this.open && !this.locked
        ? html`<div id=${listboxId} role="listbox" class="dropdown-panel combo-panel" aria-label=${this.ariaLabel || this.label || 'Options'} aria-busy=${this.loading ? 'true' : nothing}>
            ${this.loading
              ? html`<div class="combo-status" role="status">
                  <svg class="combo-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <span>${this.loadingMessage}</span>
                </div>`
              : groups.length === 0 && !customCandidate
                ? html`<div class="combo-status">
                    ${this.effectiveAllowCustom && trimmed
                      ? `Using custom value "${trimmed}"`
                      : this.emptyMessage}
                  </div>`
                : html`
                    ${groups.map(grp => html`
                      ${grp.label ? html`<div class="combo-group-header" role="presentation">${grp.label}</div>` : nothing}
                      ${grp.options.map(opt => {
                        const optIdx = flatIndexMap.get(opt.value) ?? -1;
                        const isSelected = this.value === opt.value;
                        const isActive = this.activeIndex === optIdx;
                        const isBest = bestMatchValue === opt.value;
                        const badgeObj: EmrBadge | null = opt.badge
                          ? typeof opt.badge === 'string'
                            ? { label: opt.badge, tone: 'neutral' }
                            : opt.badge
                          : opt.tone
                            ? { label: opt.tone, tone: opt.tone }
                            : null;
                        return html`<button
                          type="button"
                          role="option"
                          id=${`${id}-opt-${optIdx}`}
                          class=${`menu-item combo-option${isSelected ? ' combo-option--selected' : ''}${isActive ? ' combo-option--active' : ''}${opt.readOnly ? ' combo-option--readonly' : ''}`}
                          aria-selected=${String(isSelected)}
                          aria-readonly=${opt.readOnly ? 'true' : nothing}
                          ?disabled=${opt.disabled}
                          @mousedown=${(ev: Event) => ev.preventDefault()}
                          @click=${() => {
                            if (!opt.disabled && !opt.readOnly) this.pickOption(opt);
                          }}
                        >
                          <span class="combo-option-check" aria-hidden="true">
                            ${isSelected ? renderEmrSvgIcon('check', 14) : nothing}
                          </span>
                          <span class="combo-option-body">
                            <span class="combo-option-top">
                              <span>${this.renderHighlighted(opt.label)}</span>
                              ${opt.code ? html`<span class="combo-code">${this.renderHighlighted(opt.code)}</span>` : nothing}
                              ${isBest ? html`<span class="combo-best-match">Best match</span>` : nothing}
                            </span>
                            ${opt.description ? html`<span class="row-desc">${this.renderHighlighted(opt.description)}</span>` : nothing}
                          </span>
                          <span class="combo-option-meta">
                            ${badgeObj ? html`<span class=${`combo-badge combo-badge--${badgeObj.tone || 'neutral'}`}>${badgeObj.label}</span>` : nothing}
                            ${opt.readOnly ? html`<span aria-label="Read-only option">${renderEmrSvgIcon('lock', 13)}</span>` : nothing}
                          </span>
                        </button>`;
                      })}
                    `)}
                    ${customCandidate
                      ? html`<button
                          type="button"
                          role="option"
                          id=${`${id}-opt-${flatOptions.length}`}
                          data-custom-option="true"
                          class=${`menu-item combo-option${this.activeIndex === flatOptions.length ? ' combo-option--active' : ''}`}
                          aria-selected="false"
                          @mousedown=${(ev: Event) => ev.preventDefault()}
                          @click=${() => this.commitCustom(customCandidate)}
                        >
                          <span class="combo-option-check" aria-hidden="true"></span>
                          <span class="combo-option-body">Use "${customCandidate}"</span>
                        </button>`
                      : nothing}
                  `}
          </div>`
        : nothing}
    </div>`;

    if (this.labelHidden) return control;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${control}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.warning
          ? html`<span id=${msgId} class="emr-warning combo-warning">${this.warning}</span>`
          : this.hint
            ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
            : nothing}
    </div>`;
  }
}

/** 9. EmrTagInputElement (`emr-tag-input`) */
export class EmrTagInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-tag-input');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) value: readonly string[] = [];
  @property({ attribute: false }) tags: readonly string[] | undefined = undefined;
  @property({ attribute: false }) suggestions: readonly string[] = [];
  @property({ type: String }) placeholder = 'Add tag…';
  @property({ attribute: false }) separators: readonly string[] | undefined = undefined;
  @property({ attribute: false }) delimiters: readonly string[] = [',', ';'];
  @property({ type: Boolean }) allowDuplicates = false;
  @property({ type: Number }) maxTags?: number;
  @property({ type: Number }) maxTagLength?: number;
  @property({ attribute: false }) lockedTags: readonly string[] = [];
  @property({ type: String }) variant: EmrTagInputVariant = 'outline';
  @property({ type: String }) size: EmrTagInputSize = 'md';
  @property({ type: String }) chipTone: EmrTone = 'neutral';
  @property({ type: Boolean }) filterSuggestions = true;
  @property({ type: Boolean }) highlightMatch = true;
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: String }) warning = '';
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  @state() private draft = '';
  @state() private isFocused = false;
  @state() private dropdownDismissed = false;
  @state() private activeSuggestionIndex = -1;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private get resolvedTags(): readonly string[] {
    return resolveEmrTagsValue(this.tags, this.value);
  }

  private get resolvedSeparators(): readonly string[] {
    return this.separators ?? this.delimiters;
  }

  private get isMaxReached(): boolean {
    return this.maxTags !== undefined && this.resolvedTags.length >= this.maxTags;
  }

  private get rankedSuggestions() {
    return rankTagSuggestions(this.suggestions, this.resolvedTags, this.draft, {
      allowDuplicates: this.allowDuplicates,
      filterSuggestions: this.filterSuggestions,
    });
  }

  private get isDropdownOpen(): boolean {
    return (
      this.isFocused &&
      !this.dropdownDismissed &&
      !this.locked &&
      !this.isMaxReached &&
      this.rankedSuggestions.length > 0
    );
  }

  private syncOpenAttribute(open: boolean): void {
    if (open) {
      this.setAttribute('data-open', 'true');
    } else {
      this.removeAttribute('data-open');
    }
  }

  private emitTags(next: readonly string[]): void {
    this.dispatchEvent(new CustomEvent<readonly string[]>('tagsChange', { detail: next, bubbles: true, composed: true }));
    this.emitValueChange(next);
  }

  private commitDraft(raw: string): void {
    if (this.locked) return;
    const res = commitTagInputValues(this.resolvedTags, raw, {
      separators: this.resolvedSeparators,
      allowDuplicates: this.allowDuplicates,
      maxTags: this.maxTags,
      maxTagLength: this.maxTagLength,
    });
    this.draft = '';
    this.activeSuggestionIndex = -1;
    if (res.added.length > 0) {
      for (const t of res.added) {
        this.dispatchEvent(new CustomEvent<string>('tagAdded', { detail: t, bubbles: true, composed: true }));
      }
      this.emitTags(res.next);
    }
  }

  private removeTagAt(idx: number): void {
    if (this.locked) return;
    const res = removeTagInputAtIndex(this.resolvedTags, idx, this.lockedTags);
    if (res.removed !== null) {
      this.dispatchEvent(new CustomEvent<string>('tagRemoved', { detail: res.removed, bubbles: true, composed: true }));
      this.emitTags(res.next);
    }
  }

  private clearAll(): void {
    if (this.locked) return;
    this.draft = '';
    this.activeSuggestionIndex = -1;
    const res = clearUnlockedTags(this.resolvedTags, this.lockedTags);
    if (res.removed.length > 0) {
      this.emitTags(res.next);
    }
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
  }

  private selectSuggestion(val: string): void {
    this.commitDraft(val);
    this.shadowRoot?.querySelector<HTMLInputElement>('input.tag-bare-input')?.focus();
  }

  private renderHighlighted(text: string) {
    if (!this.highlightMatch) return text;
    return splitMatchHighlightSegments(text, this.draft).map((seg) =>
      seg.matched ? html`<mark class="emr-match-highlight">${seg.text}</mark>` : seg.text,
    );
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const listboxId = `${id}-listbox`;
    const tags = this.resolvedTags;
    const isInvalid = this.invalid || Boolean(this.error);
    const suggestions = this.rankedSuggestions;
    const open = this.isDropdownOpen;
    this.syncOpenAttribute(open);

    const activeOptId =
      open && this.activeSuggestionIndex >= 0 && this.activeSuggestionIndex < suggestions.length
        ? `${id}-opt-${this.activeSuggestionIndex}`
        : nothing;

    const shellClass = [
      'tag-shell',
      this.size === 'sm' ? 'tag-shell--sm' : '',
      this.variant === 'filled' ? 'tag-shell--filled' : '',
      this.variant === 'subtle' ? 'tag-shell--subtle' : '',
      this.readOnly ? 'tag-shell--readonly' : '',
      this.disabled ? 'tag-shell--disabled' : '',
      isInvalid ? 'tag-shell--invalid' : '',
      !isInvalid && this.warning ? 'tag-shell--warning' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const hasClearableTags =
      this.clearable && !this.locked && tags.some((tag) => !isTagLocked(tag, this.lockedTags));

    const shell = html`<div class="tag-wrap">
      <div class=${shellClass} role="list" aria-label=${this.ariaLabel || this.label || 'Tags'}>
        ${tags.map((tag, idx) => {
          const tagLocked = isTagLocked(tag, this.lockedTags);
          const chipClass = [
            'tag-chip',
            this.chipTone !== 'neutral' ? `tag-chip--${this.chipTone}` : '',
            tagLocked ? 'tag-chip--locked' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return html`<span class=${chipClass} role="listitem">
            ${tagLocked
              ? html`<span class="tag-chip-lock" aria-label="Locked tag">${renderEmrSvgIcon('lock', 12)}</span>`
              : nothing}
            <span class="tag-chip-label">${tag}</span>
            ${!this.locked && !tagLocked
              ? html`<button
                  type="button"
                  class="tag-chip-remove"
                  data-remove-tag=${tag}
                  aria-label=${`Remove ${tag}`}
                  @click=${() => this.removeTagAt(idx)}
                  @keydown=${(e: KeyboardEvent) => {
                    const btns = Array.from(
                      this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button.tag-chip-remove') ?? [],
                    );
                    const btnIdx = btns.indexOf(e.currentTarget as HTMLButtonElement);
                    if (e.key === 'ArrowLeft' && btnIdx > 0) {
                      e.preventDefault();
                      btns[btnIdx - 1]?.focus();
                    } else if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      if (btnIdx >= 0 && btnIdx < btns.length - 1) {
                        btns[btnIdx + 1]?.focus();
                      } else {
                        this.shadowRoot?.querySelector<HTMLInputElement>('input.tag-bare-input')?.focus();
                      }
                    }
                  }}
                >${renderEmrSvgIcon('close', 12)}</button>`
              : nothing}
          </span>`;
        })}
        <input
          id=${id}
          type="text"
          role="combobox"
          autocomplete="off"
          class="tag-bare-input"
          placeholder=${this.isMaxReached ? '' : this.placeholder}
          .value=${live(this.draft)}
          ?readonly=${this.readOnly || this.isMaxReached}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          ?disabled=${this.disabled}
          maxlength=${this.maxTagLength ?? nothing}
          aria-label=${this.labelHidden || !this.label ? this.ariaLabel || this.label || 'Add tag' : nothing}
          aria-required=${this.required ? 'true' : nothing}
          aria-invalid=${isInvalid ? 'true' : nothing}
          aria-describedby=${!this.labelHidden && (this.error || this.warning || this.hint) ? msgId : nothing}
          aria-expanded=${String(open)}
          aria-controls=${open ? listboxId : nothing}
          aria-activedescendant=${activeOptId}
          @focus=${() => {
            this.isFocused = true;
            this.dropdownDismissed = false;
            this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
          }}
          @blur=${() => {
            this.isFocused = false;
            this.activeSuggestionIndex = -1;
            if (!this.locked && this.draft.trim()) {
              this.commitDraft(this.draft);
            }
            this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
          }}
          @paste=${(e: ClipboardEvent) => {
            if (this.locked) return;
            const pasted = e.clipboardData?.getData('text') ?? '';
            if (pasted && this.resolvedSeparators.some((s) => pasted.includes(s))) {
              e.preventDefault();
              this.commitDraft(pasted);
            }
          }}
          @input=${(e: Event) => {
            if (this.locked) {
              (e.target as HTMLInputElement).value = '';
              return;
            }
            this.dropdownDismissed = false;
            this.activeSuggestionIndex = -1;
            const raw = (e.target as HTMLInputElement).value;
            if (this.resolvedSeparators.some((d) => raw.includes(d))) {
              this.commitDraft(raw);
              (e.target as HTMLInputElement).value = '';
            } else {
              const clamped =
                this.maxTagLength !== undefined && this.maxTagLength >= 0
                  ? raw.slice(0, this.maxTagLength)
                  : raw;
              if (clamped !== raw) {
                (e.target as HTMLInputElement).value = clamped;
              }
              this.draft = clamped;
            }
          }}
          @keydown=${(e: KeyboardEvent) => {
            if (this.locked) return;
            if (e.key === 'ArrowDown' && suggestions.length > 0 && !this.isMaxReached) {
              e.preventDefault();
              this.dropdownDismissed = false;
              this.activeSuggestionIndex =
                this.activeSuggestionIndex < suggestions.length - 1 ? this.activeSuggestionIndex + 1 : 0;
              return;
            }
            if (e.key === 'ArrowUp' && suggestions.length > 0 && !this.isMaxReached) {
              e.preventDefault();
              this.dropdownDismissed = false;
              this.activeSuggestionIndex =
                this.activeSuggestionIndex > 0 ? this.activeSuggestionIndex - 1 : suggestions.length - 1;
              return;
            }
            if (e.key === 'Escape' && open) {
              e.preventDefault();
              this.dropdownDismissed = true;
              this.activeSuggestionIndex = -1;
              return;
            }
            if (e.key === 'Enter' || this.resolvedSeparators.includes(e.key)) {
              if (open && this.activeSuggestionIndex >= 0 && this.activeSuggestionIndex < suggestions.length) {
                e.preventDefault();
                this.selectSuggestion(suggestions[this.activeSuggestionIndex]!.value);
                return;
              }
              if (this.draft.trim()) {
                e.preventDefault();
                this.commitDraft(this.draft);
              }
            } else if (e.key === 'Backspace' && !this.draft && tags.length > 0) {
              e.preventDefault();
              const res = popLastUnlockedTag(tags, this.lockedTags);
              if (res.removed !== null) {
                this.dispatchEvent(new CustomEvent<string>('tagRemoved', { detail: res.removed, bubbles: true, composed: true }));
                this.emitTags(res.next);
              }
            } else if (e.key === 'ArrowLeft' && !this.draft) {
              const btns = Array.from(
                this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button.tag-chip-remove') ?? [],
              );
              if (btns.length > 0) {
                e.preventDefault();
                btns[btns.length - 1]?.focus();
              }
            }
          }}
        />
        ${hasClearableTags
          ? html`<button
              type="button"
              class="clear-btn"
              data-clear-btn="true"
              aria-label=${`${this.clearLabel} ${this.label || 'tags'}`}
              @click=${() => this.clearAll()}
            >${renderEmrSvgIcon('close', 14)}</button>`
          : nothing}
      </div>
      ${open
        ? html`<div id=${listboxId} role="listbox" class="dropdown-panel combo-panel" aria-label="Tag suggestions">
            ${suggestions.map((sug, i) => {
              const isActive = this.activeSuggestionIndex === i;
              return html`<button
                type="button"
                role="option"
                id=${`${id}-opt-${i}`}
                class=${`menu-item combo-option${isActive ? ' combo-option--active' : ''}`}
                aria-selected=${String(isActive)}
                @mousedown=${(ev: Event) => ev.preventDefault()}
                @click=${() => this.selectSuggestion(sug.value)}
              >
                <span class="combo-option-body">
                  <span class="combo-option-top">
                    <span>${this.renderHighlighted(sug.value)}</span>
                    ${sug.isBestMatch ? html`<span class="combo-best-match">Best match</span>` : nothing}
                  </span>
                </span>
              </button>`;
            })}
          </div>`
        : nothing}
    </div>`;

    if (this.labelHidden) return shell;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${shell}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.warning
          ? html`<span id=${msgId} class="emr-hint" role="status">${this.warning}</span>`
          : this.hint
            ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
            : nothing}
    </div>`;
  }
}

/** 10. EmrSliderElement (`emr-slider`) */
export class EmrSliderElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-slider');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: Number }) value: number | null = null;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) step = 1;
  @property({ type: Number }) precision?: number;
  @property({ type: String }) unit = '';
  @property({ attribute: false }) marks: readonly EmrSliderMark[] = [];
  @property({ type: Boolean }) showValue = true;
  @property({ type: Boolean }) showSteppers = false;
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: String }) tone: EmrTone | 'neutral' = 'neutral';
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: String }) warning = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: String }) ariaDescribedBy = '';

  private draggingPointerId: number | null = null;
  private lastPointerVal: number | null = null;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private get numericValue(): number {
    return this.value !== null && Number.isFinite(this.value)
      ? clampSliderValue(this.value, this.min, this.max, this.step)
      : this.min;
  }

  private emitCommitted(val: number | null): void {
    this.dispatchEvent(new CustomEvent<number | null>('committed', { detail: val, bubbles: true, composed: true }));
  }

  private valueFromPointer(e: PointerEvent, track: HTMLElement): number {
    const rect = track.getBoundingClientRect();
    const frac = rect.width > 0 ? Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) : 0;
    return clampSliderValue(this.min + frac * (this.max - this.min), this.min, this.max, this.step);
  }

  private clearSlider(): void {
    if (this.locked) return;
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.emitValueChange(null);
    this.emitCommitted(null);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const labelId = `${id}-label`;
    const msgId = `${id}-message`;
    const isInvalid = Boolean(this.invalid || this.error);
    const resolvedLabel = this.ariaLabel || this.label || 'Slider';
    const numeric = this.numericValue;
    const fillPct = this.value === null ? 0 : sliderValuePercent(numeric, this.min, this.max);
    const prec = this.precision ?? countSliderStepDecimals(this.step);
    const formatted = formatSliderValue(this.value, this.unit, prec);
    const describedIds = [
      this.error || this.warning || this.hint ? msgId : '',
      this.ariaDescribedBy,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    const wrapCls = [
      'slider-wrap',
      this.size === 'sm' ? 'slider-wrap--sm' : this.size === 'lg' ? 'slider-wrap--lg' : '',
      isInvalid ? 'slider-wrap--invalid' : this.warning ? 'slider-wrap--warning' : '',
      this.readOnly ? 'slider-wrap--readonly' : '',
      this.disabled ? 'slider-wrap--disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<span id=${labelId} class=${`emr-label${this.labelHidden ? ' emr-sr-only' : ''}`}>
            ${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
          </span>`
        : nothing}
      <div class=${wrapCls} data-tone=${this.tone}>
        <div class="slider-row">
          ${this.showSteppers
            ? html`<button
                type="button"
                class="emr-btn emr-btn--outline dr-icon-btn"
                ?disabled=${this.locked || numeric <= this.min}
                aria-label=${`Decrease ${resolvedLabel}`}
                @click=${() => {
                  const next = clampSliderValue((this.value ?? this.min) - this.step, this.min, this.max, this.step);
                  this.emitValueChange(next);
                  this.emitCommitted(next);
                }}
              >${renderEmrSvgIcon('minus', 14)}</button>`
            : nothing}
          <div
            class="slider-track"
            aria-readonly=${this.readOnly ? 'true' : nothing}
            aria-disabled=${this.disabled ? 'true' : nothing}
            @pointerdown=${(e: PointerEvent) => {
              if (this.locked) return;
              const track = e.currentTarget as HTMLElement;
              this.draggingPointerId = e.pointerId;
              if (typeof track.setPointerCapture === 'function') track.setPointerCapture(e.pointerId);
              track.querySelector<HTMLElement>('.slider-thumb')?.focus();
              const next = this.valueFromPointer(e, track);
              this.lastPointerVal = next;
              this.emitValueChange(next);
            }}
            @pointermove=${(e: PointerEvent) => {
              if (this.draggingPointerId !== e.pointerId || this.locked) return;
              const next = this.valueFromPointer(e, e.currentTarget as HTMLElement);
              if (next !== this.lastPointerVal) {
                this.lastPointerVal = next;
                this.emitValueChange(next);
              }
            }}
            @pointerup=${(e: PointerEvent) => {
              if (this.draggingPointerId !== e.pointerId) return;
              this.draggingPointerId = null;
              this.emitCommitted(this.lastPointerVal ?? this.value);
              this.lastPointerVal = null;
            }}
            @pointercancel=${(e: PointerEvent) => {
              if (this.draggingPointerId !== e.pointerId) return;
              this.draggingPointerId = null;
              this.emitCommitted(this.lastPointerVal ?? this.value);
              this.lastPointerVal = null;
            }}
          >
            <div class="slider-rail">
              <div class="slider-fill" style=${`left:0%;width:${fillPct}%`}></div>
              <div
                id=${id}
                role="slider"
                class="slider-thumb"
                tabindex=${this.disabled ? nothing : '0'}
                style=${`--emr-pos:${fillPct}%`}
                aria-label=${this.ariaLabel || (!this.label || this.labelHidden ? resolvedLabel : nothing)}
                aria-labelledby=${!this.ariaLabel && this.label && !this.labelHidden ? labelId : nothing}
                aria-valuemin=${String(this.min)}
                aria-valuemax=${String(this.max)}
                aria-valuenow=${String(this.value ?? this.min)}
                aria-valuetext=${this.value === null ? 'Not set' : formatted}
                aria-required=${this.required ? 'true' : nothing}
                aria-readonly=${this.readOnly ? 'true' : nothing}
                aria-disabled=${this.disabled ? 'true' : nothing}
                aria-invalid=${isInvalid ? 'true' : nothing}
                aria-describedby=${describedIds ?? nothing}
                @focus=${() => this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }))}
                @blur=${() => this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }))}
                @keydown=${(e: KeyboardEvent) => {
                  if (this.locked) return;
                  const next = resolveSliderKeyStepValue(e.key, this.value, this.min, this.max, this.step);
                  if (next === null) return;
                  e.preventDefault();
                  this.emitValueChange(next);
                  this.emitCommitted(next);
                }}
              ></div>
            </div>
          </div>
          ${this.showSteppers
            ? html`<button
                type="button"
                class="emr-btn emr-btn--outline dr-icon-btn"
                ?disabled=${this.locked || numeric >= this.max}
                aria-label=${`Increase ${resolvedLabel}`}
                @click=${() => {
                  const next = clampSliderValue((this.value ?? this.min) + this.step, this.min, this.max, this.step);
                  this.emitValueChange(next);
                  this.emitCommitted(next);
                }}
              >${renderEmrSvgIcon('plus', 14)}</button>`
            : nothing}
          ${this.showValue ? html`<span class="emr-badge slider-value-badge" aria-live="polite">${formatted}</span>` : nothing}
          ${this.clearable && this.value !== null && !this.locked
            ? html`<button
                type="button"
                class="clear-btn dr-icon-btn"
                data-clear-btn="true"
                aria-label=${`${this.clearLabel} ${resolvedLabel}`}
                @click=${() => this.clearSlider()}
              >${renderEmrSvgIcon('close', 14)}</button>`
            : nothing}
        </div>
        ${this.marks.length > 0
          ? html`<div class="slider-marks">
              ${this.marks.map(m => {
                const pct = sliderValuePercent(m.value, this.min, this.max);
                const active = this.value !== null && Math.abs(numeric - m.value) < 1e-6;
                const cls = `slider-mark${pct <= 2 ? ' slider-mark--start' : pct >= 98 ? ' slider-mark--end' : ''}${active ? ' slider-mark--active' : ''}`;
                return html`<button
                  type="button"
                  class=${cls}
                  style=${`--emr-pos:${pct}%`}
                  ?disabled=${this.locked}
                  aria-label=${`Set ${resolvedLabel} to ${m.label ?? m.value}`}
                  @click=${() => {
                    if (this.locked) return;
                    const next = clampSliderValue(m.value, this.min, this.max, this.step);
                    this.emitValueChange(next);
                    this.emitCommitted(next);
                  }}
                >${m.label ?? m.value}</button>`;
              })}
            </div>`
          : nothing}
      </div>
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.warning
          ? html`<span id=${msgId} class="emr-warning" role="status">${this.warning}</span>`
          : this.hint
            ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
            : nothing}
    </div>`;
  }
}

/** 11. EmrRangeSliderElement (`emr-range-slider`) */
export class EmrRangeSliderElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-range-slider');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) value: readonly [number, number] | null = [0, 100];
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) step = 1;
  @property({ type: Number }) minDistance = 0;
  @property({ type: Number }) precision?: number;
  @property({ type: String }) unit = '';
  @property({ attribute: false }) marks: readonly EmrSliderMark[] = [];
  @property({ type: Boolean }) showValue = true;
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: String }) tone: EmrTone | 'neutral' = 'neutral';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: String }) lowError = '';
  @property({ type: String }) highError = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: String }) ariaDescribedBy = '';

  @state() private activeThumb: 'low' | 'high' = 'low';
  private draggingPointerId: number | null = null;
  private draggingThumb: 'low' | 'high' | null = null;
  private lastPointerPair: readonly [number, number] | null = null;
  private groupFocused = false;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private get pair(): readonly [number, number] {
    if (!this.value) return [this.min, this.max];
    return clampRangeSliderPair(
      this.value[0],
      this.value[1],
      this.min,
      this.max,
      this.step,
      this.minDistance,
    );
  }

  private emitCommitted(val: readonly [number, number] | null): void {
    this.dispatchEvent(
      new CustomEvent<readonly [number, number] | null>('committed', { detail: val, bubbles: true, composed: true }),
    );
  }

  private pairFromFraction(frac: number, which: 'low' | 'high'): readonly [number, number] {
    const raw = this.min + frac * (this.max - this.min);
    const [curLow, curHigh] = this.pair;
    return clampRangeSliderPair(
      which === 'low' ? raw : curLow,
      which === 'high' ? raw : curHigh,
      this.min,
      this.max,
      this.step,
      this.minDistance,
      which,
    );
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const [low, high] = this.pair;
    const lowPct = sliderValuePercent(low, this.min, this.max);
    const highPct = sliderValuePercent(high, this.min, this.max);
    const lowAriaMax = clampSliderValue(high - Math.max(0, this.minDistance), this.min, this.max, this.step);
    const highAriaMin = clampSliderValue(low + Math.max(0, this.minDistance), this.min, this.max, this.step);
    const prec = this.precision ?? countSliderStepDecimals(this.step);
    const readout =
      this.value === null
        ? '—'
        : `${formatSliderValue(low, '', prec)} – ${formatSliderValue(high, this.unit, prec)}`;

    const resolvedLabel = this.ariaLabel || this.label || 'Range slider';
    const groupError = this.error || this.lowError || this.highError;
    const isGroupInvalid = Boolean(this.invalid || groupError);
    const isLowInvalid = Boolean(this.invalid || this.error || this.lowError);
    const isHighInvalid = Boolean(this.invalid || this.error || this.highError);
    const describedIds = [
      groupError || this.warning || this.hint ? msgId : '',
      this.ariaDescribedBy,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    const wrapCls = [
      'slider-wrap',
      this.size === 'sm' ? 'slider-wrap--sm' : this.size === 'lg' ? 'slider-wrap--lg' : '',
      isGroupInvalid ? 'slider-wrap--invalid' : this.warning ? 'slider-wrap--warning' : '',
      this.readOnly ? 'slider-wrap--readonly' : '',
      this.disabled ? 'slider-wrap--disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`<div
      class="emr-field"
      part="field"
      role="group"
      aria-label=${resolvedLabel}
      aria-required=${this.required ? 'true' : nothing}
      @focusin=${() => {
        if (!this.groupFocused) {
          this.groupFocused = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
      }}
      @focusout=${(e: FocusEvent) => {
        const related = e.relatedTarget as Node | null;
        if (!related || !this.shadowRoot?.contains(related)) {
          this.groupFocused = false;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }
      }}
    >
      ${this.label
        ? html`<span class=${`emr-label${this.labelHidden ? ' emr-sr-only' : ''}`}>
            ${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
          </span>`
        : nothing}
      <div class=${wrapCls} data-tone=${this.tone}>
        <div class="slider-row">
          <div
            class="slider-track"
            aria-readonly=${this.readOnly ? 'true' : nothing}
            aria-disabled=${this.disabled ? 'true' : nothing}
            @pointerdown=${(e: PointerEvent) => {
              if (this.locked) return;
              const track = e.currentTarget as HTMLElement;
              const rect = track.getBoundingClientRect();
              const frac = rect.width > 0 ? Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) : 0;
              const thumb = resolveClosestRangeThumb(frac, lowPct, highPct);
              this.draggingPointerId = e.pointerId;
              this.draggingThumb = thumb;
              this.activeThumb = thumb;
              if (typeof track.setPointerCapture === 'function') track.setPointerCapture(e.pointerId);
              track.querySelector<HTMLElement>(`[data-thumb="${thumb}"]`)?.focus();
              const next = this.pairFromFraction(frac, thumb);
              this.lastPointerPair = next;
              this.emitValueChange(next);
            }}
            @pointermove=${(e: PointerEvent) => {
              if (this.draggingPointerId !== e.pointerId || !this.draggingThumb || this.locked) return;
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const frac = rect.width > 0 ? Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) : 0;
              const next = this.pairFromFraction(frac, this.draggingThumb);
              this.lastPointerPair = next;
              this.emitValueChange(next);
            }}
            @pointerup=${(e: PointerEvent) => {
              if (this.draggingPointerId !== e.pointerId) return;
              this.draggingPointerId = null;
              this.draggingThumb = null;
              this.emitCommitted(this.lastPointerPair ?? this.pair);
              this.lastPointerPair = null;
            }}
            @pointercancel=${(e: PointerEvent) => {
              if (this.draggingPointerId !== e.pointerId) return;
              this.draggingPointerId = null;
              this.draggingThumb = null;
              this.emitCommitted(this.lastPointerPair ?? this.pair);
              this.lastPointerPair = null;
            }}
          >
            <div class="slider-rail">
              <div
                class="slider-fill"
                style=${`left:${lowPct}%;width:${Math.max(0, highPct - lowPct)}%`}
              ></div>
              <div
                id=${`${id}-low`}
                role="slider"
                data-thumb="low"
                class=${`slider-thumb${this.activeThumb === 'low' ? ' slider-thumb--active' : ''}`}
                tabindex=${this.disabled ? nothing : '0'}
                style=${`--emr-pos:${lowPct}%`}
                aria-label=${`${resolvedLabel} minimum`}
                aria-valuemin=${String(this.min)}
                aria-valuemax=${String(lowAriaMax)}
                aria-valuenow=${String(low)}
                aria-valuetext=${this.value === null ? 'Not set' : formatSliderValue(low, this.unit, prec)}
                aria-required=${this.required ? 'true' : nothing}
                aria-readonly=${this.readOnly ? 'true' : nothing}
                aria-disabled=${this.disabled ? 'true' : nothing}
                aria-invalid=${isLowInvalid ? 'true' : nothing}
                aria-describedby=${describedIds ?? nothing}
                @pointerdown=${(e: PointerEvent) => {
                  if (this.locked) return;
                  e.stopPropagation();
                  this.draggingPointerId = e.pointerId;
                  this.draggingThumb = 'low';
                  this.activeThumb = 'low';
                  const track = (e.currentTarget as HTMLElement).closest('.slider-track') as HTMLElement | null;
                  if (track && typeof track.setPointerCapture === 'function') track.setPointerCapture(e.pointerId);
                  (e.currentTarget as HTMLElement).focus();
                }}
                @focus=${() => {
                  this.activeThumb = 'low';
                }}
                @keydown=${(e: KeyboardEvent) => {
                  if (this.locked) return;
                  const next = resolveRangeThumbKeyValue('low', e.key, this.pair, this.min, this.max, this.step, this.minDistance);
                  if (!next) return;
                  e.preventDefault();
                  this.emitValueChange(next);
                  this.emitCommitted(next);
                }}
              ></div>
              <div
                id=${`${id}-high`}
                role="slider"
                data-thumb="high"
                class=${`slider-thumb${this.activeThumb === 'high' ? ' slider-thumb--active' : ''}`}
                tabindex=${this.disabled ? nothing : '0'}
                style=${`--emr-pos:${highPct}%`}
                aria-label=${`${resolvedLabel} maximum`}
                aria-valuemin=${String(highAriaMin)}
                aria-valuemax=${String(this.max)}
                aria-valuenow=${String(high)}
                aria-valuetext=${this.value === null ? 'Not set' : formatSliderValue(high, this.unit, prec)}
                aria-required=${this.required ? 'true' : nothing}
                aria-readonly=${this.readOnly ? 'true' : nothing}
                aria-disabled=${this.disabled ? 'true' : nothing}
                aria-invalid=${isHighInvalid ? 'true' : nothing}
                aria-describedby=${describedIds ?? nothing}
                @pointerdown=${(e: PointerEvent) => {
                  if (this.locked) return;
                  e.stopPropagation();
                  this.draggingPointerId = e.pointerId;
                  this.draggingThumb = 'high';
                  this.activeThumb = 'high';
                  const track = (e.currentTarget as HTMLElement).closest('.slider-track') as HTMLElement | null;
                  if (track && typeof track.setPointerCapture === 'function') track.setPointerCapture(e.pointerId);
                  (e.currentTarget as HTMLElement).focus();
                }}
                @focus=${() => {
                  this.activeThumb = 'high';
                }}
                @keydown=${(e: KeyboardEvent) => {
                  if (this.locked) return;
                  const next = resolveRangeThumbKeyValue('high', e.key, this.pair, this.min, this.max, this.step, this.minDistance);
                  if (!next) return;
                  e.preventDefault();
                  this.emitValueChange(next);
                  this.emitCommitted(next);
                }}
              ></div>
            </div>
          </div>
          ${this.showValue ? html`<span class="emr-badge slider-value-badge" aria-live="polite">${readout}</span>` : nothing}
          ${this.clearable && this.value !== null && !this.locked
            ? html`<button
                type="button"
                class="clear-btn dr-icon-btn"
                data-clear-btn="true"
                aria-label=${`${this.clearLabel} ${resolvedLabel}`}
                @click=${() => {
                  if (this.locked) return;
                  this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
                  this.emitValueChange(null);
                  this.emitCommitted(null);
                }}
              >${renderEmrSvgIcon('close', 14)}</button>`
            : nothing}
        </div>
        ${this.marks.length > 0
          ? html`<div class="slider-marks">
              ${this.marks.map(m => {
                const pct = sliderValuePercent(m.value, this.min, this.max);
                const active = this.value !== null && (Math.abs(low - m.value) < 1e-6 || Math.abs(high - m.value) < 1e-6);
                const cls = `slider-mark${pct <= 2 ? ' slider-mark--start' : pct >= 98 ? ' slider-mark--end' : ''}${active ? ' slider-mark--active' : ''}`;
                return html`<button
                  type="button"
                  class=${cls}
                  style=${`--emr-pos:${pct}%`}
                  ?disabled=${this.locked}
                  aria-label=${`Jump nearest thumb of ${resolvedLabel} to ${m.label ?? m.value}`}
                  @click=${() => {
                    if (this.locked) return;
                    const thumb = resolveClosestRangeThumb(pct / 100, lowPct, highPct);
                    const next = clampRangeSliderPair(
                      thumb === 'low' ? m.value : low,
                      thumb === 'high' ? m.value : high,
                      this.min,
                      this.max,
                      this.step,
                      this.minDistance,
                      thumb,
                    );
                    this.activeThumb = thumb;
                    this.emitValueChange(next);
                    this.emitCommitted(next);
                  }}
                >${m.label ?? m.value}</button>`;
              })}
            </div>`
          : nothing}
      </div>
      ${groupError
        ? html`<span id=${msgId} class="emr-error" role="alert">${groupError}</span>`
        : this.warning
          ? html`<span id=${msgId} class="emr-warning" role="status">${this.warning}</span>`
          : this.hint
            ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
            : nothing}
    </div>`;
  }
}

/** 12. EmrMaskedInputElement (`emr-masked-input`) */
export class EmrMaskedInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-masked-input');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) mask = '';
  @property({ attribute: false }) definitions?: Readonly<Record<string, string>>;
  @property({ type: Boolean }) uppercase = false;
  @property({ type: String }) placeholder = '';
  @property({ type: Boolean }) unmask = false;
  @property({ type: Boolean }) showMaskHint = false;
  @property({ type: String }) override inputMode = '';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: String }) variant: EmrControlVariant = 'outline';
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: String }) warning = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: String }) ariaDescribedBy = '';

  /** @deprecated Use `unmask` */
  @property({ type: Boolean })
  get emitUnmasked(): boolean {
    return this.unmask;
  }
  set emitUnmasked(v: boolean) {
    this.unmask = Boolean(v);
  }

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const maskOpts = { uppercase: this.uppercase, definitions: this.definitions };
    const maskResult = applyInputMask(this.value ?? '', this.mask, maskOpts);
    const formatted = maskResult.masked;
    const isInvalid = Boolean(this.invalid || this.error);
    const resolvedLabel = this.ariaLabel || this.label || this.mask || 'Masked input';
    const resolvedInputMode = this.inputMode || inferMaskInputMode(this.mask, this.definitions);
    const describedIds = [
      this.error || this.warning || this.hint ? msgId : '',
      this.ariaDescribedBy,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    const affixCls = [
      'masked-affix',
      this.size === 'lg' ? 'masked-affix--lg' : '',
      this.variant === 'filled' ? 'masked-affix--filled' : this.variant === 'subtle' ? 'masked-affix--subtle' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class=${`emr-label${this.labelHidden ? ' emr-sr-only' : ''}`} for=${id}>
            ${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
          </label>`
        : nothing}
      <div
        class=${affixCls}
        data-invalid=${isInvalid ? 'true' : nothing}
        data-warning=${!isInvalid && this.warning ? 'true' : nothing}
        data-readonly=${this.readOnly ? 'true' : nothing}
      >
        <input
          id=${id}
          type="text"
          autocomplete="off"
          inputmode=${resolvedInputMode}
          class="masked-input-bare"
          placeholder=${this.placeholder || this.mask}
          .value=${live(formatted)}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-label=${this.ariaLabel || (this.labelHidden || !this.label ? resolvedLabel : nothing)}
          aria-required=${this.required ? 'true' : nothing}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          aria-invalid=${isInvalid ? 'true' : nothing}
          aria-describedby=${describedIds ?? nothing}
          @focus=${() => this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }))}
          @blur=${(e: Event) => {
            (e.target as HTMLInputElement).value = applyInputMask(this.value ?? '', this.mask, maskOpts).masked;
            this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
          }}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Enter' && !this.locked) {
              const emitted = this.unmask ? maskResult.unmasked : maskResult.masked;
              this.dispatchEvent(
                new CustomEvent<string | null>('submitted', {
                  detail: emitted === '' ? null : emitted,
                  bubbles: true,
                  composed: true,
                }),
              );
            }
          }}
          @input=${(e: Event) => {
            const input = e.target as HTMLInputElement;
            if (this.locked) {
              input.value = formatted;
              return;
            }
            const rawCaret = input.selectionStart ?? input.value.length;
            const edited = editMaskedInputWithCaret(formatted, input.value, rawCaret, this.mask, maskOpts);
            if (input.value !== edited.result.masked) {
              input.value = edited.result.masked;
            }
            if (typeof input.setSelectionRange === 'function') {
              input.setSelectionRange(edited.caret, edited.caret);
            }
            const emitted = this.unmask ? edited.result.unmasked : edited.result.masked;
            const finalVal = emitted === '' ? null : emitted;
            this.emitValueChange(finalVal);
            if (edited.result.complete && emitted.length > 0) {
              this.dispatchEvent(new CustomEvent<string>('completed', { detail: emitted, bubbles: true, composed: true }));
              this.dispatchEvent(new CustomEvent<EmrMaskResult>('maskComplete', { detail: edited.result, bubbles: true, composed: true }));
            }
          }}
        />
        ${this.showMaskHint
          ? html`<span class=${`masked-hint-badge${maskResult.complete ? ' masked-hint-badge--complete' : ''}`} aria-hidden="true">${this.mask}</span>`
          : nothing}
        ${this.clearable && formatted.length > 0 && !this.locked
          ? html`<button
              type="button"
              class="clear-btn dr-icon-btn"
              data-clear-btn="true"
              aria-label=${`${this.clearLabel} ${resolvedLabel}`}
              @click=${() => {
                this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
                this.emitValueChange(null);
              }}
            >${renderEmrSvgIcon('close', 14)}</button>`
          : nothing}
      </div>
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.warning
          ? html`<span id=${msgId} class="emr-warning" role="status">${this.warning}</span>`
          : this.hint
            ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
            : nothing}
    </div>`;
  }
}

/** 13. EmrOtpInputElement (`emr-otp-input`) */
export class EmrOtpInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-otp-input');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value = '';
  @property({ type: Number }) length = 6;
  @property({ type: Boolean }) numericOnly = true;
  @property({ type: Boolean }) secret = false;
  @property({ type: Boolean }) uppercase = false;
  @property({ attribute: false }) separatorAfter?: number | readonly number[];
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: String }) variant: EmrControlVariant = 'outline';
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: String }) warning = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: String }) ariaDescribedBy = '';

  private groupFocused = false;

  /** @deprecated Use `secret` */
  @property({ type: Boolean })
  get masked(): boolean {
    return this.secret;
  }
  set masked(v: boolean) {
    this.secret = Boolean(v);
  }

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private focusSlot(idx: number): void {
    const inputs = Array.from(this.shadowRoot?.querySelectorAll<HTMLInputElement>('input.otp-slot') ?? []);
    const target = inputs[Math.max(0, Math.min(idx, inputs.length - 1))];
    target?.focus();
  }

  private hasSeparatorAfter(idx: number, safeLen: number): boolean {
    if (this.separatorAfter === undefined) return false;
    const oneBased = idx + 1;
    if (oneBased >= safeLen) return false;
    return Array.isArray(this.separatorAfter)
      ? this.separatorAfter.includes(oneBased)
      : this.separatorAfter === oneBased;
  }

  private handleEdit(slotIndex: number, rawText: string, moveFocus = true): void {
    if (this.locked) return;
    const safeLen = Math.max(1, Math.min(12, Math.floor(this.length)));
    const res = applyOtpSlotEdit(this.value, slotIndex, rawText, safeLen, this.numericOnly, {
      uppercase: this.uppercase,
    });
    this.emitValueChange(res.value);
    if (res.completed) {
      this.dispatchEvent(new CustomEvent<string>('completed', { detail: res.value, bubbles: true, composed: true }));
    }
    if (moveFocus) {
      void this.updateComplete.then(() => this.focusSlot(res.nextFocusIndex));
    }
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const safeLen = Math.max(1, Math.min(12, Math.floor(this.length)));
    const slots = normalizeOtpSlots(this.value, safeLen);
    const isInvalid = Boolean(this.invalid || this.error);
    const resolvedLabel = this.ariaLabel || this.label || 'Verification code';
    const describedIds = [
      this.error || this.warning || this.hint ? msgId : '',
      this.ariaDescribedBy,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    const slotCls = [
      'otp-slot',
      this.size === 'sm' ? 'otp-slot--sm' : this.size === 'lg' ? 'otp-slot--lg' : '',
      this.variant === 'filled' ? 'otp-slot--filled' : this.variant === 'subtle' ? 'otp-slot--subtle' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<span class=${`emr-label${this.labelHidden ? ' emr-sr-only' : ''}`}>
            ${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
          </span>`
        : nothing}
      <div
        id=${id}
        class="otp-row"
        role="group"
        aria-label=${resolvedLabel}
        aria-required=${this.required ? 'true' : nothing}
        aria-invalid=${isInvalid ? 'true' : nothing}
        @focusin=${() => {
          if (!this.groupFocused) {
            this.groupFocused = true;
            this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
          }
        }}
        @focusout=${(e: FocusEvent) => {
          const related = e.relatedTarget as Node | null;
          if (!related || !this.shadowRoot?.contains(related)) {
            this.groupFocused = false;
            this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
          }
        }}
      >
        ${slots.map(
          (char, idx) => html`<input
              type=${this.secret ? 'password' : 'text'}
              inputmode=${this.numericOnly ? 'numeric' : 'text'}
              autocomplete="one-time-code"
              maxlength=${String(safeLen)}
              class=${slotCls}
              data-slot-index=${String(idx)}
              aria-label=${`${resolvedLabel} digit ${idx + 1} of ${safeLen}`}
              aria-required=${this.required ? 'true' : nothing}
              aria-readonly=${this.readOnly ? 'true' : nothing}
              aria-invalid=${isInvalid ? 'true' : nothing}
              data-warning=${!isInvalid && this.warning ? 'true' : nothing}
              aria-describedby=${describedIds ?? nothing}
              .value=${live(char)}
              ?readonly=${this.readOnly}
              ?disabled=${this.disabled}
              @input=${(e: Event) => {
                const input = e.target as HTMLInputElement;
                if (this.locked) {
                  input.value = char;
                  return;
                }
                const delta = extractOtpTypedInput(char, input.value);
                this.handleEdit(idx, delta, delta.length > 0);
              }}
              @paste=${(e: ClipboardEvent) => {
                if (this.locked) return;
                const text = e.clipboardData?.getData('text') ?? '';
                if (text) {
                  e.preventDefault();
                  this.handleEdit(idx, text, true);
                }
              }}
              @keydown=${(e: KeyboardEvent) => {
                if (this.disabled) return;
                if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  this.focusSlot(idx - 1);
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  this.focusSlot(idx + 1);
                } else if (e.key === 'Home') {
                  e.preventDefault();
                  this.focusSlot(0);
                } else if (e.key === 'End') {
                  e.preventDefault();
                  this.focusSlot(safeLen - 1);
                } else if (e.key === 'Enter' && !this.readOnly) {
                  this.dispatchEvent(new CustomEvent<string>('submitted', { detail: this.value ?? '', bubbles: true, composed: true }));
                } else if ((e.key === 'Backspace' || e.key === 'Delete') && !this.locked) {
                  const res = resolveOtpClearSlot(slots, idx, e.key);
                  if (res) {
                    e.preventDefault();
                    this.handleEdit(res.targetIndex, '', false);
                    void this.updateComplete.then(() => this.focusSlot(res.nextFocusIndex));
                  }
                }
              }}
            />
            ${this.hasSeparatorAfter(idx, safeLen) ? html`<span class="otp-sep" aria-hidden="true">–</span>` : nothing}`,
        )}
        ${this.clearable && slots.some(s => s.length > 0) && !this.locked
          ? html`<button
              type="button"
              class="clear-btn dr-icon-btn"
              data-clear-btn="true"
              aria-label=${`${this.clearLabel} ${resolvedLabel}`}
              @click=${() => {
                if (this.locked) return;
                this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
                this.emitValueChange('');
                void this.updateComplete.then(() => this.focusSlot(0));
              }}
            >${renderEmrSvgIcon('close', 14)}</button>`
          : nothing}
      </div>
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.warning
          ? html`<span id=${msgId} class="emr-warning" role="status">${this.warning}</span>`
          : this.hint
            ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
            : nothing}
    </div>`;
  }
}

/** 14. EmrMenuElement (`emr-menu`) */
export class EmrMenuElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-menu');
  private defaultApplied = false;
  private isFocusedWithin = false;

  @property({ type: String }) controlId = '';
  @property({ type: String }) label?: string;
  @property({ type: String }) triggerLabel?: string;
  @property({ type: String }) override ariaLabel: string | null = null;
  @property({ type: String }) triggerIcon = '';
  @property({ type: String }) variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  @property({ type: String }) triggerVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  @property({ type: String }) size: 'sm' | 'md' = 'md';
  @property({ attribute: false }) items: readonly EmrMenuItem[] = [];
  @property({ type: Boolean }) open = false;
  @property({ type: Boolean }) defaultOpen = false;
  @property({ type: String }) align: 'start' | 'end' = 'start';
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;

  private readonly onDocPointerDown = (ev: Event) => {
    if (!this.open) return;
    const path = typeof ev.composedPath === 'function' ? ev.composedPath() : [];
    if (!path.includes(this)) {
      this.setOpen(false);
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', this.onDocPointerDown, true);
    }
  }

  override disconnectedCallback(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', this.onDocPointerDown, true);
    }
    super.disconnectedCallback();
  }

  protected override willUpdate(): void {
    if (!this.defaultApplied) {
      this.defaultApplied = true;
      if (this.defaultOpen && !this.open) {
        this.open = true;
      }
    }
  }

  private get canOpen(): boolean {
    return canOpenEmrMenu({
      disabled: this.disabled,
      readOnly: this.readOnly,
      itemsCount: this.items.length,
    });
  }

  private setOpen(next: boolean): void {
    if (next && !this.canOpen) return;
    const prev = this.open;
    this.open = next;
    if (prev !== next) {
      this.dispatchEvent(new CustomEvent<boolean>('openChange', { detail: next, bubbles: true, composed: true }));
    }
  }

  private focusItemByIndex(idx: number): void {
    if (idx < 0) return;
    const btn = this.shadowRoot?.querySelector<HTMLButtonElement>(`button[data-item-index="${idx}"]`);
    btn?.focus();
  }

  private focusTrigger(): void {
    this.shadowRoot?.querySelector<HTMLButtonElement>('[data-menu-trigger="true"]')?.focus();
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const menuId = `${id}-menu`;
    const resolvedLabel = this.label ?? this.triggerLabel ?? 'Actions';
    const resolvedVariant = this.variant ?? this.triggerVariant ?? 'outline';
    const triggerIconName = asLitIcon(this.triggerIcon);
    const isOpen = this.open && this.canOpen;

    return html`<div
      class="menu-root"
      @focusin=${() => {
        if (!this.isFocusedWithin) {
          this.isFocusedWithin = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
      }}
      @focusout=${(e: FocusEvent) => {
        const next = e.relatedTarget as Node | null;
        if (next && (this.contains(next) || this.shadowRoot?.contains(next))) return;
        if (this.isFocusedWithin) {
          this.isFocusedWithin = false;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }
      }}
    >
      <button
        id=${id}
        type="button"
        data-menu-trigger="true"
        class=${`emr-btn emr-btn--${resolvedVariant}${this.size === 'sm' ? ' emr-btn--sm' : ''}`}
        aria-label=${this.ariaLabel || (!resolvedLabel ? 'Actions' : nothing)}
        aria-haspopup="menu"
        aria-expanded=${String(isOpen)}
        aria-controls=${isOpen ? menuId : nothing}
        aria-readonly=${this.readOnly ? 'true' : nothing}
        ?disabled=${this.disabled}
        @click=${() => {
          if (this.canOpen) this.setOpen(!isOpen);
        }}
        @keydown=${(e: KeyboardEvent) => {
          if (!this.canOpen) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.setOpen(true);
            const targetIdx = moveEmrMenuFocusIndex(this.items, -1, 'Home');
            void this.updateComplete.then(() => this.focusItemByIndex(targetIdx));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.setOpen(true);
            const targetIdx = moveEmrMenuFocusIndex(this.items, -1, 'End');
            void this.updateComplete.then(() => this.focusItemByIndex(targetIdx));
          } else if (e.key === 'Escape' && isOpen) {
            e.preventDefault();
            this.setOpen(false);
          }
        }}
      >
        ${triggerIconName ? renderEmrSvgIcon(triggerIconName, 16) : nothing}
        ${resolvedLabel ? html`<span>${resolvedLabel}</span>` : nothing}
        <span class=${`menu-chevron${isOpen ? ' menu-chevron--open' : ''}`} aria-hidden="true">
          ${renderEmrSvgIcon('chevron-down', 14)}
        </span>
      </button>

      ${isOpen
        ? html`<div
            id=${menuId}
            role="menu"
            class=${`menu-list${this.align === 'end' ? ' menu-list--end' : ''}`}
            aria-label=${this.ariaLabel || resolvedLabel || 'Menu'}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                this.setOpen(false);
                this.focusTrigger();
              } else if (e.key === 'Tab') {
                this.setOpen(false);
              }
            }}
          >
            ${this.items.map((item, idx) => {
              const itemIcon = asLitIcon(item.icon);
              return html`
                ${item.dividerBefore ? html`<div class="menu-divider" role="separator"></div>` : nothing}
                <button
                  type="button"
                  role="menuitem"
                  data-item-id=${item.id}
                  data-item-index=${String(idx)}
                  class=${`menu-item${item.tone === 'danger' ? ' menu-item--danger' : ''}`}
                  ?disabled=${item.disabled}
                  aria-disabled=${item.disabled ? 'true' : nothing}
                  @keydown=${(e: KeyboardEvent) => {
                    if (
                      e.key === 'ArrowDown' ||
                      e.key === 'ArrowUp' ||
                      e.key === 'Home' ||
                      e.key === 'End'
                    ) {
                      const nextIdx = moveEmrMenuFocusIndex(this.items, idx, e.key);
                      if (nextIdx >= 0) {
                        e.preventDefault();
                        this.focusItemByIndex(nextIdx);
                      }
                      return;
                    }
                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                      const matchIdx = findEmrMenuTypeaheadIndex(this.items, e.key, idx);
                      if (matchIdx >= 0) {
                        e.preventDefault();
                        this.focusItemByIndex(matchIdx);
                      }
                    }
                  }}
                  @click=${() => {
                    if (!canSelectEmrMenuItem(item, this.disabled, this.readOnly)) return;
                    this.setOpen(false);
                    this.dispatchEvent(new CustomEvent<EmrMenuItem>('itemSelected', { detail: item, bubbles: true, composed: true }));
                    this.emitValueChange(item.id);
                    this.focusTrigger();
                  }}
                >
                  <span class="menu-item-lead">
                    ${itemIcon ? html`<span class="menu-item-icon" aria-hidden="true">${renderEmrSvgIcon(itemIcon, 15)}</span>` : nothing}
                    <span class="row-copy">
                      <span>${item.label}</span>
                      ${item.description ? html`<span class="row-desc">${item.description}</span>` : nothing}
                    </span>
                  </span>
                  ${item.shortcut ? html`<kbd class="emr-muted">${item.shortcut}</kbd>` : nothing}
                </button>
              `;
            })}
          </div>`
        : nothing}
    </div>`;
  }
}

/** 15. EmrSplitButtonElement (`emr-split-button`) */
export class EmrSplitButtonElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-split-button');
  private defaultApplied = false;
  private isFocusedWithin = false;

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = 'Action';
  @property({ type: String }) menuLabel = '';
  @property({ type: String }) variant: 'primary' | 'secondary' | 'outline' | 'danger' = 'primary';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: String }) align: 'start' | 'end' = 'end';
  @property({ attribute: false }) items: readonly EmrMenuItem[] = [];
  @property({ type: Boolean }) open = false;
  @property({ type: Boolean }) defaultOpen = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) loading = false;

  private readonly onDocPointerDown = (ev: Event) => {
    if (!this.open) return;
    const path = typeof ev.composedPath === 'function' ? ev.composedPath() : [];
    if (!path.includes(this)) {
      this.setOpen(false);
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', this.onDocPointerDown, true);
    }
  }

  override disconnectedCallback(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', this.onDocPointerDown, true);
    }
    super.disconnectedCallback();
  }

  protected override willUpdate(): void {
    if (!this.defaultApplied) {
      this.defaultApplied = true;
      if (this.defaultOpen && !this.open) {
        this.open = true;
      }
    }
  }

  private get canMenu(): boolean {
    return canOpenEmrSplitMenu({
      disabled: this.disabled,
      readOnly: this.readOnly,
      loading: this.loading,
      itemsCount: this.items.length,
    });
  }

  private setOpen(next: boolean): void {
    if (next && !this.canMenu) return;
    const prev = this.open;
    this.open = next;
    if (prev !== next) {
      this.dispatchEvent(new CustomEvent<boolean>('openChange', { detail: next, bubbles: true, composed: true }));
    }
  }

  private focusItemByIndex(idx: number): void {
    if (idx < 0) return;
    this.shadowRoot?.querySelector<HTMLButtonElement>(`button[data-item-index="${idx}"]`)?.focus();
  }

  private focusToggle(): void {
    this.shadowRoot?.querySelector<HTMLButtonElement>('[data-split-trigger="true"]')?.focus();
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const menuId = `${id}-menu`;
    const locked = this.disabled || this.loading;
    const sizeCls = this.size === 'sm' ? ' emr-btn--sm' : this.size === 'lg' ? ' emr-btn--lg' : '';
    const isOpen = this.open && this.canMenu;

    return html`<div
      class="menu-root"
      @focusin=${() => {
        if (!this.isFocusedWithin) {
          this.isFocusedWithin = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
      }}
      @focusout=${(e: FocusEvent) => {
        const next = e.relatedTarget as Node | null;
        if (next && (this.contains(next) || this.shadowRoot?.contains(next))) return;
        if (this.isFocusedWithin) {
          this.isFocusedWithin = false;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }
      }}
    >
      <div class="split-group" role="group" aria-label=${this.label}>
        <button
          id=${id}
          type="button"
          data-split-primary="true"
          class=${`emr-btn emr-btn--${this.variant}${sizeCls} split-primary`}
          ?disabled=${locked}
          aria-busy=${this.loading ? 'true' : nothing}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          @click=${() => {
            if (!canTriggerEmrSplitPrimary({ disabled: this.disabled, readOnly: this.readOnly, loading: this.loading })) return;
            this.setOpen(false);
            this.dispatchEvent(new CustomEvent('primaryClicked', { bubbles: true, composed: true }));
            this.dispatchEvent(new CustomEvent('clicked', { bubbles: true, composed: true }));
          }}
        >
          ${this.loading
            ? html`<svg class="split-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>`
            : nothing}
          <span>${this.label}</span>
        </button>
        <button
          type="button"
          data-split-trigger="true"
          class=${`emr-btn emr-btn--${this.variant}${sizeCls} split-trigger`}
          aria-label=${this.menuLabel || `${this.label} options`}
          aria-haspopup="menu"
          aria-expanded=${String(isOpen)}
          aria-controls=${isOpen ? menuId : nothing}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          ?disabled=${locked}
          @click=${() => {
            if (this.canMenu) this.setOpen(!isOpen);
          }}
          @keydown=${(e: KeyboardEvent) => {
            if (!this.canMenu) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              this.setOpen(true);
              const targetIdx = moveEmrMenuFocusIndex(this.items, -1, 'Home');
              void this.updateComplete.then(() => this.focusItemByIndex(targetIdx));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              this.setOpen(true);
              const targetIdx = moveEmrMenuFocusIndex(this.items, -1, 'End');
              void this.updateComplete.then(() => this.focusItemByIndex(targetIdx));
            } else if (e.key === 'Escape' && isOpen) {
              e.preventDefault();
              this.setOpen(false);
            }
          }}
        >
          <span class=${`menu-chevron${isOpen ? ' menu-chevron--open' : ''}`} aria-hidden="true">
            ${renderEmrSvgIcon('chevron-down', 14)}
          </span>
        </button>
      </div>

      ${isOpen
        ? html`<div
            id=${menuId}
            role="menu"
            class=${`menu-list${this.align === 'end' ? ' menu-list--end' : ''}`}
            aria-label=${this.menuLabel || `${this.label} options`}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                this.setOpen(false);
                this.focusToggle();
              } else if (e.key === 'Tab') {
                this.setOpen(false);
              }
            }}
          >
            ${this.items.map((item, idx) => {
              const itemIcon = asLitIcon(item.icon);
              return html`
                ${item.dividerBefore ? html`<div class="menu-divider" role="separator"></div>` : nothing}
                <button
                  type="button"
                  role="menuitem"
                  data-item-id=${item.id}
                  data-item-index=${String(idx)}
                  class=${`menu-item${item.tone === 'danger' ? ' menu-item--danger' : ''}`}
                  ?disabled=${item.disabled}
                  aria-disabled=${item.disabled ? 'true' : nothing}
                  @keydown=${(e: KeyboardEvent) => {
                    if (
                      e.key === 'ArrowDown' ||
                      e.key === 'ArrowUp' ||
                      e.key === 'Home' ||
                      e.key === 'End'
                    ) {
                      const nextIdx = moveEmrMenuFocusIndex(this.items, idx, e.key);
                      if (nextIdx >= 0) {
                        e.preventDefault();
                        this.focusItemByIndex(nextIdx);
                      }
                      return;
                    }
                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                      const matchIdx = findEmrMenuTypeaheadIndex(this.items, e.key, idx);
                      if (matchIdx >= 0) {
                        e.preventDefault();
                        this.focusItemByIndex(matchIdx);
                      }
                    }
                  }}
                  @click=${() => {
                    if (this.loading || !canSelectEmrMenuItem(item, this.disabled, this.readOnly)) return;
                    this.setOpen(false);
                    this.dispatchEvent(new CustomEvent<EmrMenuItem>('itemSelected', { detail: item, bubbles: true, composed: true }));
                    this.emitValueChange(item.id);
                    this.focusToggle();
                  }}
                >
                  <span class="menu-item-lead">
                    ${itemIcon ? html`<span class="menu-item-icon" aria-hidden="true">${renderEmrSvgIcon(itemIcon, 15)}</span>` : nothing}
                    <span class="row-copy">
                      <span>${item.label}</span>
                      ${item.description ? html`<span class="row-desc">${item.description}</span>` : nothing}
                    </span>
                  </span>
                  ${item.shortcut ? html`<kbd class="emr-muted">${item.shortcut}</kbd>` : nothing}
                </button>
              `;
            })}
          </div>`
        : nothing}
    </div>`;
  }
}

/** 16. EmrAccordionElement (`emr-accordion`) */
export class EmrAccordionElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-accordion');
  private defaultApplied = false;
  private isFocusedWithin = false;

  @property({ type: String }) controlId = '';
  @property({ attribute: false }) items: readonly EmrAccordionItem[] = [];
  @property({ attribute: false }) expandedIds: readonly string[] = [];
  @property({ attribute: false }) defaultExpandedIds: readonly string[] = [];
  @property({ type: Boolean }) multiple = false;
  @property({ type: String }) variant: 'outlined' | 'flush' | 'card' = 'outlined';
  @property({ type: String }) size: 'sm' | 'md' = 'md';
  @property({ type: Number }) headingLevel: 2 | 3 | 4 | 5 | 6 = 3;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;

  protected override willUpdate(): void {
    if (!this.defaultApplied) {
      this.defaultApplied = true;
      if (this.defaultExpandedIds.length > 0 && this.expandedIds.length === 0) {
        this.expandedIds = [...this.defaultExpandedIds];
      }
    }
  }

  private renderBadge(badge?: EmrBadge) {
    if (!badge) return nothing;
    const tone = normalizeEmrBadgeTone(badge.tone);
    const variant = normalizeEmrBadgeVariant(badge.variant);
    const size = normalizeEmrBadgeSize(badge.size);
    const shape = normalizeEmrBadgeShape(badge.shape);
    const countInfo = formatEmrBadgeCount(badge.count, badge.maxCount ?? 99, Boolean(badge.showZero));
    if (!countInfo.visible && !badge.label && !badge.dot) return nothing;
    const isDotOnly = Boolean(badge.dot) && countInfo.text === null && !badge.label;
    const cls =
      `emr-badge emr-badge--${tone} emr-badge--${variant}` +
      (size === 'sm' ? ' emr-badge--sm' : '') +
      (shape === 'rounded' ? ' emr-badge--rounded' : '') +
      (isDotOnly ? ' emr-badge--dot-only' : '');
    return html`<span
      class=${cls}
      role=${isDotOnly ? 'img' : nothing}
      aria-label=${isDotOnly ? (badge.assistiveText || 'Status indicator') : nothing}
    >
      ${badge.dot && !isDotOnly ? html`<span class="emr-badge__dot" aria-hidden="true"></span>` : nothing}
      ${countInfo.text !== null
        ? html`<span class="emr-badge__count">${countInfo.text}</span>`
        : badge.label
          ? html`<span>${badge.label}</span>`
          : nothing}
      ${!isDotOnly && badge.assistiveText ? html`<span class="sr-only"> ${badge.assistiveText}</span>` : nothing}
    </span>`;
  }

  private toggleItem(item: EmrAccordionItem): void {
    if (!canToggleAccordionItem(item, this.disabled, this.readOnly)) return;
    const resolved = resolveAccordionExpandedIds(this.items, this.expandedIds, this.multiple);
    const next = toggleAccordionId(resolved, item.id, this.multiple);
    const expanded = next.includes(item.id);
    this.expandedIds = next;
    this.dispatchEvent(new CustomEvent<{ readonly id: string; readonly expanded: boolean }>('itemToggled', {
      detail: { id: item.id, expanded },
      bubbles: true,
      composed: true,
    }));
    this.dispatchEvent(new CustomEvent<readonly string[]>('expandedIdsChange', { detail: next, bubbles: true, composed: true }));
    this.emitValueChange(next);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const activeIds = resolveAccordionExpandedIds(this.items, this.expandedIds, this.multiple);
    const listClass = `accordion-list accordion-list--${this.variant}${this.size === 'sm' ? ' accordion-list--sm' : ''}`;

    return html`<div
      id=${id}
      class=${listClass}
      @focusin=${() => {
        if (!this.isFocusedWithin) {
          this.isFocusedWithin = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
      }}
      @focusout=${(e: FocusEvent) => {
        const next = e.relatedTarget as Node | null;
        if (next && (this.contains(next) || this.shadowRoot?.contains(next))) return;
        if (this.isFocusedWithin) {
          this.isFocusedWithin = false;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }
      }}
    >
      ${this.items.map((item, idx) => {
        const expanded = activeIds.includes(item.id);
        const btnId = `${id}-hdr-${item.id}`;
        const panelId = `${id}-pnl-${item.id}`;
        const itemIcon = asLitIcon(item.icon);
        return html`<div class="accordion-item" data-accordion-id=${item.id}>
          <div class="accordion-heading" role="heading" aria-level=${String(this.headingLevel)}>
            <button
              id=${btnId}
              type="button"
              data-header-index=${String(idx)}
              class="accordion-header-btn"
              aria-expanded=${String(expanded)}
              aria-controls=${panelId}
              aria-readonly=${this.readOnly ? 'true' : nothing}
              ?disabled=${this.disabled || !!item.disabled}
              @click=${() => this.toggleItem(item)}
              @keydown=${(e: KeyboardEvent) => {
                if (
                  e.key !== 'ArrowDown' &&
                  e.key !== 'ArrowUp' &&
                  e.key !== 'Home' &&
                  e.key !== 'End'
                ) {
                  return;
                }
                if (this.disabled) return;
                const nextIdx = moveAccordionFocusIndex(this.items, idx, e.key);
                if (nextIdx >= 0) {
                  e.preventDefault();
                  this.shadowRoot?.querySelector<HTMLButtonElement>(`button[data-header-index="${nextIdx}"]`)?.focus();
                }
              }}
            >
              <span class="accordion-title-lead">
                ${itemIcon ? renderEmrSvgIcon(itemIcon, 16) : nothing}
                <span class="row-copy">
                  <span>${item.title}</span>
                  ${item.subtitle ? html`<span class="row-desc">${item.subtitle}</span>` : nothing}
                </span>
              </span>
              <span class="emr-row">
                ${this.renderBadge(item.badge)}
                <span class=${`accordion-chevron${expanded ? ' accordion-chevron--open' : ''}`} aria-hidden="true">
                  ${renderEmrSvgIcon('chevron-down', 16)}
                </span>
              </span>
            </button>
          </div>
          <div
            id=${panelId}
            role="region"
            aria-labelledby=${btnId}
            class="accordion-panel"
            ?hidden=${!expanded}
          >
            ${item.content ? html`<div>${item.content}</div>` : nothing}
            <slot name=${item.id}></slot>
          </div>
        </div>`;
      })}
    </div>`;
  }
}

/** 17. EmrBreadcrumbsElement (`emr-breadcrumbs`) */
export class EmrBreadcrumbsElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-breadcrumbs');

  @property({ type: String }) controlId = '';
  @property({ type: String }) override ariaLabel = 'Breadcrumb';
  @property({ attribute: false }) items: readonly EmrBreadcrumbItem[] = [];
  @property({ type: Number }) maxItems?: number;
  @property({ type: String }) separator = '/';
  @property({ type: String }) size: 'sm' | 'md' = 'md';

  @state() private expandedAll = false;

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('items') || changed.has('maxItems')) {
      this.expandedAll = false;
    }
  }

  private renderSeparator() {
    if (this.separator === 'chevron') {
      return html`<span class="emr-muted" aria-hidden="true">${renderEmrSvgIcon('chevron-right', 14)}</span>`;
    }
    return html`<span class="emr-muted" aria-hidden="true">${this.separator}</span>`;
  }

  private emitCrumb(item: EmrBreadcrumbItem, isLast: boolean) {
    if (!canSelectEmrBreadcrumb(item, isLast)) return;
    this.dispatchEvent(new CustomEvent<EmrBreadcrumbItem>('itemSelected', { detail: item, bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent<EmrBreadcrumbItem>('itemClicked', { detail: item, bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent<EmrBreadcrumbItem>('navigated', { detail: item, bubbles: true, composed: true }));
  }

  private renderCrumb(item: EmrBreadcrumbItem, isLast: boolean) {
    const iconName = asLitIcon(item.icon);
    if (isLast) {
      return html`<span class="breadcrumb-current" aria-current="page">
        ${iconName ? renderEmrSvgIcon(iconName, 14) : nothing}
        <span class="breadcrumb-label">${item.label}</span>
      </span>`;
    }
    if (item.href && !item.disabled) {
      return html`<a
        class="breadcrumb-btn"
        data-breadcrumb-id=${item.id}
        href=${item.href}
        @click=${(e: MouseEvent) => {
          if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            e.preventDefault();
          }
          this.emitCrumb(item, isLast);
        }}
      >
        ${iconName ? renderEmrSvgIcon(iconName, 14) : nothing}
        <span class="breadcrumb-label">${item.label}</span>
      </a>`;
    }
    return html`<button
      type="button"
      class="breadcrumb-btn"
      data-breadcrumb-id=${item.id}
      ?disabled=${item.disabled}
      aria-disabled=${item.disabled ? 'true' : nothing}
      @click=${() => this.emitCrumb(item, isLast)}
    >
      ${iconName ? renderEmrSvgIcon(iconName, 14) : nothing}
      <span class="breadcrumb-label">${item.label}</span>
    </button>`;
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const collapsed = collapseBreadcrumbs(this.items, this.expandedAll ? undefined : this.maxItems);
    const hasHidden = collapsed.hidden.length > 0;

    return html`<nav id=${id} aria-label=${this.ariaLabel || 'Breadcrumb'}>
      <ol class=${`breadcrumb-list${this.size === 'sm' ? ' breadcrumb-list--sm' : ''}`}>
        ${collapsed.leading.map(
          (item, idx) => html`<li class="breadcrumb-item">
            ${this.renderCrumb(item, !hasHidden && collapsed.trailing.length === 0 && idx === collapsed.leading.length - 1)}
            ${hasHidden || collapsed.trailing.length > 0 || idx < collapsed.leading.length - 1
              ? this.renderSeparator()
              : nothing}
          </li>`,
        )}
        ${hasHidden
          ? html`<li class="breadcrumb-item">
              <button
                type="button"
                class="breadcrumb-btn"
                data-expand-breadcrumbs="true"
                aria-label=${`Show ${collapsed.hidden.length} hidden levels`}
                @click=${() => {
                  const hidden = collapsed.hidden;
                  const firstHidden = hidden.find(c => !c.disabled);
                  this.expandedAll = true;
                  this.dispatchEvent(new CustomEvent<readonly EmrBreadcrumbItem[]>('overflowExpanded', {
                    detail: hidden,
                    bubbles: true,
                    composed: true,
                  }));
                  if (firstHidden) {
                    void this.updateComplete.then(() => {
                      this.shadowRoot
                        ?.querySelector<HTMLElement>(`[data-breadcrumb-id="${firstHidden.id}"]`)
                        ?.focus();
                    });
                  }
                }}
              >${renderEmrSvgIcon('more-horizontal', 16)}</button>
              ${this.renderSeparator()}
            </li>`
          : nothing}
        ${collapsed.trailing.map(
          (item, idx) => html`<li class="breadcrumb-item">
            ${this.renderCrumb(item, idx === collapsed.trailing.length - 1)}
            ${idx < collapsed.trailing.length - 1
              ? this.renderSeparator()
              : nothing}
          </li>`,
        )}
      </ol>
    </nav>`;
  }
}

/** 18. EmrColorPickerElement (`emr-color-picker`) */
export class EmrColorPickerElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-color-picker');
  private isFocusedWithin = false;

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = 'Color';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = null;
  @property({ attribute: false }) swatches: readonly EmrColorSwatch[] = DEFAULT_CLINICAL_COLOR_SWATCHES;
  @property({ type: Boolean }) allowCustomHex = true;
  @property({ type: Boolean }) clearable = true;
  @property({ type: String }) size: 'sm' | 'md' = 'md';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';

  @state() private hexDraft = '';
  @state() private draftInvalid = false;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('value') || changed.has('readOnly') || changed.has('disabled')) {
      const normalized = normalizeHexColor(this.value) ?? this.value ?? '';
      if (this.locked || !this.draftInvalid || changed.has('value')) {
        this.hexDraft = normalized;
        this.draftInvalid = false;
      }
    }
  }

  private selectSwatch(hex: string): void {
    if (this.locked) return;
    const normalized = normalizeHexColor(hex) ?? hex;
    this.hexDraft = normalized;
    this.draftInvalid = false;
    this.emitValueChange(normalized);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const labelId = `${id}-label`;
    const errId = `${id}-error`;
    const warnId = `${id}-warning`;
    const hintId = `${id}-hint`;
    const activeHex = normalizeHexColor(this.value);
    const isInvalid = Boolean(this.invalid || this.error);
    const showWarning = Boolean(this.warning && !isInvalid);
    const describedByParts: string[] = [];
    if (this.error) describedByParts.push(errId);
    if (showWarning) describedByParts.push(warnId);
    if (this.hint) describedByParts.push(hintId);
    const describedBy = describedByParts.length ? describedByParts.join(' ') : nothing;
    const tabStopIdx = resolveColorSwatchTabStopIndex(this.swatches, this.value, this.disabled);
    const showClear = canClearEmrColorPicker({
      clearable: this.clearable,
      value: this.value,
      disabled: this.disabled,
      readOnly: this.readOnly,
    });

    return html`<div
      class="emr-field"
      part="field"
      @focusin=${() => {
        if (!this.isFocusedWithin) {
          this.isFocusedWithin = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
      }}
      @focusout=${(e: FocusEvent) => {
        const next = e.relatedTarget as Node | null;
        if (next && (this.contains(next) || this.shadowRoot?.contains(next))) return;
        if (this.isFocusedWithin) {
          this.isFocusedWithin = false;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }
      }}
    >
      ${this.label
        ? html`<span id=${labelId} class=${`emr-label${this.labelHidden ? ' sr-only' : ''}`}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</span>`
        : nothing}

      <div
        id=${id}
        role="radiogroup"
        class="swatch-grid"
        aria-label=${this.labelHidden || !this.label ? (this.label || 'Color') : nothing}
        aria-labelledby=${!this.labelHidden && this.label ? labelId : nothing}
        aria-required=${this.required ? 'true' : nothing}
        aria-readonly=${this.readOnly ? 'true' : nothing}
        aria-invalid=${isInvalid ? 'true' : nothing}
        aria-describedby=${describedBy}
      >
        ${this.swatches.map((swatch, idx) => {
          const swatchNorm = normalizeHexColor(swatch.value);
          const selected = Boolean(activeHex && swatchNorm && activeHex === swatchNorm);
          const checkTone = getContrastCheckTone(swatch.value);
          return html`<button
            type="button"
            role="radio"
            class=${`swatch-btn${selected ? ` swatch-check--${checkTone}` : ''}`}
            data-swatch-value=${swatch.value}
            data-swatch-index=${String(idx)}
            style=${`--swatch-color: ${swatch.value};`}
            tabindex=${this.disabled ? -1 : idx === tabStopIdx ? 0 : -1}
            aria-label=${`${swatch.label} (${swatch.value})`}
            aria-checked=${String(selected)}
            aria-readonly=${this.readOnly ? 'true' : nothing}
            ?disabled=${this.disabled}
            @click=${() => this.selectSwatch(swatch.value)}
            @keydown=${(e: KeyboardEvent) => {
              if (
                e.key !== 'ArrowLeft' &&
                e.key !== 'ArrowRight' &&
                e.key !== 'ArrowUp' &&
                e.key !== 'ArrowDown' &&
                e.key !== 'Home' &&
                e.key !== 'End'
              ) {
                return;
              }
              const nextIdx = moveColorSwatchFocusIndex(this.swatches, idx, e.key, this.disabled);
              if (nextIdx < 0) return;
              e.preventDefault();
              this.shadowRoot?.querySelector<HTMLButtonElement>(`button[data-swatch-index="${nextIdx}"]`)?.focus();
              const nextSwatch = this.swatches[nextIdx];
              if (nextSwatch && !this.locked) {
                this.selectSwatch(nextSwatch.value);
              }
            }}
          >${selected ? renderEmrSvgIcon('check', 16) : nothing}</button>`;
        })}
      </div>

      ${this.allowCustomHex || showClear
        ? html`<div class="hex-row">
            ${this.allowCustomHex
              ? html`<span
                    class="swatch-preview-dot"
                    style=${activeHex ? `background: ${activeHex};` : ''}
                    aria-hidden="true"
                  ></span>
                  <input
                    type="text"
                    class=${`emr-control hex-input${this.size === 'sm' ? ' emr-control--sm' : ''}`}
                    placeholder="#RRGGBB"
                    maxlength="7"
                    aria-label=${`${this.label || 'Color'} hex code`}
                    aria-invalid=${isInvalid || this.draftInvalid ? 'true' : nothing}
                    aria-describedby=${describedBy}
                    .value=${live(this.hexDraft)}
                    ?readonly=${this.readOnly}
                    ?disabled=${this.disabled}
                    @input=${(e: Event) => {
                      const input = e.target as HTMLInputElement;
                      if (this.locked) {
                        input.value = this.hexDraft;
                        return;
                      }
                      const raw = input.value;
                      this.hexDraft = raw;
                      if (!raw.trim()) {
                        this.draftInvalid = false;
                        if (this.clearable) {
                          this.emitValueChange(null);
                          this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
                        }
                        return;
                      }
                      const normalized = normalizeHexColor(raw);
                      if (normalized) {
                        this.draftInvalid = false;
                        this.emitValueChange(normalized);
                      } else {
                        this.draftInvalid = true;
                      }
                    }}
                    @blur=${() => {
                      this.hexDraft = activeHex ?? this.value ?? '';
                      this.draftInvalid = false;
                    }}
                  />`
              : nothing}
            ${showClear
              ? html`<button
                  type="button"
                  class="clear-btn"
                  data-clear-btn="true"
                  data-emr-print="hide"
                  aria-label=${`Clear ${this.label || 'color'}`}
                  @click=${() => {
                    if (this.locked) return;
                    this.hexDraft = '';
                    this.draftInvalid = false;
                    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
                    this.emitValueChange(null);
                  }}
                >${renderEmrSvgIcon('close', 14)}<span>Clear</span></button>`
              : nothing}
          </div>`
        : nothing}

      ${this.error ? html`<span id=${errId} class="emr-error" role="alert">${this.error}</span>` : nothing}
      ${showWarning ? html`<span id=${warnId} class="emr-warning" role="status">${this.warning}</span>` : nothing}
      ${this.hint ? html`<span id=${hintId} class="emr-hint">${this.hint}</span>` : nothing}
    </div>`;
  }
}

/** 19. EmrCopyButtonElement (`emr-copy-button`) */
export class EmrCopyButtonElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-copy-button');
  private copyTimer?: ReturnType<typeof setTimeout>;

  @property({ type: String }) controlId = '';
  @property({ type: String }) value = '';
  @property({ type: String }) label = 'Copy';
  @property({ type: String }) copiedLabel = 'Copied';
  @property({ type: Boolean }) iconOnly = false;
  @property({ type: String }) override ariaLabel: string | null = null;
  @property({ type: String }) variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'outline';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'sm';
  @property({ type: Number }) feedbackDurationMs = 2000;
  @property({ type: Boolean }) disabled = false;

  @state() private copied = false;

  private clearTimer(): void {
    if (this.copyTimer) {
      clearTimeout(this.copyTimer);
      this.copyTimer = undefined;
    }
  }

  override disconnectedCallback(): void {
    this.clearTimer();
    super.disconnectedCallback();
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('value')) {
      this.clearTimer();
      this.copied = false;
    }
  }

  private handleCopy(): void {
    if (!canCopyEmrValue(this.value, this.disabled)) return;
    try {
      void navigator?.clipboard?.writeText?.(this.value);
    } catch {
      // Clipboard API unavailable in non-secure / test environments
    }
    this.copied = true;
    this.dispatchEvent(new CustomEvent<string>('copied', { detail: this.value, bubbles: true, composed: true }));
    this.clearTimer();
    const duration = resolveCopyFeedbackDurationMs(this.feedbackDurationMs);
    if (duration > 0) {
      this.copyTimer = setTimeout(() => {
        this.copyTimer = undefined;
        this.copied = false;
      }, duration);
    }
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const text = formatCopyButtonLabel(this.copied, this.label, this.copiedLabel);
    const canCopy = canCopyEmrValue(this.value, this.disabled);
    const sizeCls = this.size === 'sm' ? ' emr-btn--sm' : this.size === 'lg' ? ' emr-btn--lg' : '';

    return html`<span class="emr-row">
      <button
        id=${id}
        type="button"
        class=${`emr-btn copy-btn emr-btn--${this.variant}${sizeCls}${this.copied ? ' copy-btn--copied' : ''}${this.iconOnly ? ' copy-btn--icon-only' : ''}`}
        aria-label=${this.ariaLabel || text}
        data-copied=${String(this.copied)}
        ?disabled=${!canCopy}
        @click=${() => this.handleCopy()}
        @focus=${() => this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }))}
        @blur=${() => this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }))}
      >
        ${renderEmrSvgIcon(this.copied ? 'check' : 'copy', 14)}
        ${!this.iconOnly ? html`<span>${text}</span>` : nothing}
      </button>
      <span class="sr-only" role="status" aria-live="polite">${this.copied ? this.copiedLabel : ''}</span>
    </span>`;
  }
}

export function registerL1Wave2Elements(): void {
  defineEmrElement('emr-toggle-group', EmrToggleGroupElement);
  defineEmrElement('emr-tree-view', EmrTreeViewElement);
  defineEmrElement('emr-tree-select', EmrTreeSelectElement);
  defineEmrElement('emr-image-viewer', EmrImageViewerElement);
  defineEmrElement('emr-image-cropper', EmrImageCropperElement);
  defineEmrElement('emr-image-upload', EmrImageUploadElement);
  defineEmrElement('emr-date-range-input', EmrDateRangeInputElement);
  defineEmrElement('emr-combobox', EmrComboboxElement);
  defineEmrElement('emr-tag-input', EmrTagInputElement);
  defineEmrElement('emr-slider', EmrSliderElement);
  defineEmrElement('emr-range-slider', EmrRangeSliderElement);
  defineEmrElement('emr-masked-input', EmrMaskedInputElement);
  defineEmrElement('emr-otp-input', EmrOtpInputElement);
  defineEmrElement('emr-menu', EmrMenuElement);
  defineEmrElement('emr-split-button', EmrSplitButtonElement);
  defineEmrElement('emr-accordion', EmrAccordionElement);
  defineEmrElement('emr-breadcrumbs', EmrBreadcrumbsElement);
  defineEmrElement('emr-color-picker', EmrColorPickerElement);
  defineEmrElement('emr-copy-button', EmrCopyButtonElement);
}
