import { html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import {
  addTagValues,
  applyInputMask,
  applyOtpSlotEdit,
  clampCropRect,
  clampRangeSliderPair,
  clampSliderValue,
  clampStraightenAngle,
  clearUnlockedTags,
  collapseBreadcrumbs,
  collectAllExpandableTreeIds,
  commitTagInputValues,
  computeSelectAllState,
  DEFAULT_ASPECT_PRESETS,
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  DEFAULT_IMAGE_CROP_TRANSFORM,
  DEFAULT_IMAGE_VIEWPORT,
  filterOptionsLocally,
  findNextEnabledSearchOptionIndex,
  flattenVisibleTreeNodes,
  formatImageTransformCss,
  formatTreeSelectionLabel,
  groupOptions,
  isIsoDateInRange,
  isIsoRangeEdge,
  isTagLocked,
  normalizeDateRangeSelection,
  normalizeOtpSlots,
  popLastUnlockedTag,
  rankAndFilterOptions,
  rankTagSuggestions,
  removeTagInputAtIndex,
  resolveComboboxDisplayValue,
  resolveCustomSearchCandidate,
  resolveDefaultActiveOptionIndex,
  resolveEmrTagsValue,
  rotateImage90,
  splitMatchHighlightSegments,
  splitTagTokens,
  stepImageZoom,
  toggleAccordionId,
  toggleCheckboxGroupValue,
  toggleSelectAllValues,
  toggleTreeNodeCheck,
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
  type EmrTone,
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
} from '@drguptavivek/emr-controller';
import {
  buildLitCalendarMonthGrid,
  LIT_CALENDAR_MONTH_NAMES,
  LIT_CALENDAR_WEEKDAYS,
  stepLitCalendarMonth,
  todayLitCalendarParts,
} from './calendar.logic.js';
import { EmrLitElement, defineEmrElement, emrShadowStyles } from './foundations.js';
import { renderEmrSvgIcon, type EmrLitIconName } from './icons.js';

let l1Wave2IdSeq = 0;
const nextL1Wave2Id = (prefix: string): string => `${prefix}-${++l1Wave2IdSeq}`;

const HEX_COLOR_RE = new RegExp('^\\x23[0-9a-fA-F]{6}$');

const l1Wave2Styles = css`
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
    grid-template-columns: repeat(var(--cols, 2), minmax(160px, 1fr));
    gap: 8px;
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
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    text-align: left;
  }
  .toggle-row-btn--card {
    padding: 10px 14px;
  }
  .toggle-row-btn--start {
    flex-direction: row-reverse;
    justify-content: flex-end;
  }
  .toggle-row-btn--between {
    flex-direction: row-reverse;
    justify-content: space-between;
  }
  .toggle-row-btn[aria-checked="true"],
  .toggle-row-btn[aria-checked="mixed"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
  }
  .toggle-row-btn--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
  }
  .toggle-row-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .switch-track {
    width: 40px;
    height: 22px;
    border-radius: 999px;
    padding: 2px;
    background: var(--emr-border);
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    box-sizing: border-box;
    transition: background-color 140ms ease;
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
  .toggle-row-btn[aria-checked="true"] .switch-thumb {
    transform: translateX(18px);
  }
  .row-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .row-desc {
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
  }

  .tree-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }
  .tree-list {
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    padding: 4px;
    max-height: 320px;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
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
    font-size: var(--emr-text-sm);
    text-align: left;
    cursor: pointer;
    box-sizing: border-box;
    width: 100%;
  }
  .tree-row:hover:not(:disabled) {
    background: var(--emr-surface-soft);
  }
  .tree-row[aria-selected="true"],
  .tree-row[aria-checked="true"] {
    background: var(--emr-primary-soft);
    border-color: var(--emr-primary-border);
    color: var(--emr-primary-contrast);
  }
  .tree-row:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .tree-twisty {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--emr-text-muted);
    flex-shrink: 0;
  }
  .tree-check {
    width: 18px;
    height: 18px;
    accent-color: var(--emr-primary);
    pointer-events: none;
    flex-shrink: 0;
  }

  .popover-anchor {
    position: relative;
    width: 100%;
  }
  .trigger-bar {
    display: flex;
    align-items: stretch;
    gap: 6px;
    width: 100%;
  }
  .trigger-btn {
    flex: 1;
    min-height: var(--emr-control-height);
    min-width: 44px;
    padding: 0 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
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
  .trigger-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
  .dropdown-panel {
    margin-top: 4px;
    padding: 8px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    box-shadow: var(--emr-shadow);
    z-index: 9999;
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
    font-size: var(--emr-text-2xs, 11px);
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
    font-size: var(--emr-text-2xs, 11px);
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
    max-height: 360px;
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
    padding: 2px;
    border: 2px solid var(--emr-border);
    border-radius: var(--emr-radius-sm);
    background: var(--emr-surface);
    cursor: pointer;
  }
  .viewer-thumb-btn[aria-current="true"] {
    border-color: var(--emr-primary);
  }

  .cropper-stage {
    position: relative;
    min-height: 240px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .crop-box {
    position: absolute;
    border: 2px dashed var(--emr-primary);
    background: var(--emr-primary-soft);
    opacity: 0.65;
    cursor: move;
    box-sizing: border-box;
  }
  .crop-handle {
    position: absolute;
    right: -6px;
    bottom: -6px;
    width: 16px;
    height: 16px;
    border-radius: 999px;
    background: var(--emr-primary);
    cursor: nwse-resize;
  }

  .upload-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px;
  }
  .upload-card {
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .upload-thumb {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: var(--emr-radius-sm);
    background: var(--emr-surface-soft);
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

  .slider-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .slider-native {
    width: 100%;
    min-height: 44px;
    accent-color: var(--emr-primary);
    cursor: pointer;
  }
  .slider-marks {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    font-size: var(--emr-text-xs);
    color: var(--emr-text-muted);
  }
  .range-pair-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    align-items: center;
  }

  .otp-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .otp-slot {
    width: 44px;
    min-width: 44px;
    height: 44px;
    min-height: 44px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    text-align: center;
    font: inherit;
    font-size: var(--emr-text-lg);
    font-weight: var(--emr-weight-bold);
    font-variant-numeric: tabular-nums;
  }

  .menu-root {
    position: relative;
    display: inline-block;
  }
  .menu-list {
    margin-top: 4px;
    min-width: 180px;
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
  .menu-item {
    min-height: 44px;
    padding: 0 12px;
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
  .menu-item:hover:not(:disabled) {
    background: var(--emr-surface-soft);
  }
  .menu-item--danger {
    color: var(--emr-danger);
  }
  .menu-item:disabled {
    opacity: 0.5;
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
  }
  .split-primary {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  .split-trigger {
    min-width: 44px;
    padding: 0 10px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: 1px solid var(--emr-border);
  }

  .accordion-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .accordion-item {
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    overflow: hidden;
  }
  .accordion-header-btn {
    width: 100%;
    min-height: 44px;
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
  .accordion-panel {
    padding: 12px 14px;
    border-top: 1px solid var(--emr-border);
    font-size: var(--emr-text-sm);
  }

  .breadcrumb-list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .breadcrumb-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .breadcrumb-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0 8px;
    border: 0;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-primary);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .breadcrumb-current {
    min-height: 44px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    color: var(--emr-text);
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-bold);
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
    color: var(--emr-on-primary);
  }
  .swatch-btn[aria-checked="true"] {
    border-color: var(--emr-text);
    outline: 2px solid var(--emr-focus);
    outline-offset: 2px;
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

/** 1. EmrToggleGroupElement (`emr-toggle-group`) */
export class EmrToggleGroupElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-toggle-group');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) options: readonly EmrOption[] = [];
  @property({ attribute: false }) value: readonly string[] = [];
  @property({ type: String }) orientation: 'vertical' | 'horizontal' | 'grid' = 'vertical';
  @property({ type: Number }) columns = 2;
  @property({ type: String }) variant: 'standard' | 'card' = 'standard';
  @property({ type: String }) labelPlacement: 'end' | 'start' | 'space-between' = 'space-between';
  @property({ type: Boolean }) showSelectAll = false;
  @property({ type: String }) selectAllLabel = 'Enable all';
  @property({ attribute: false }) exclusiveValues: readonly string[] = [];
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  private toggleOption(optValue: string): void {
    if (this.readOnly || this.disabled) return;
    const current = Array.isArray(this.value) ? this.value : [];
    const next = toggleCheckboxGroupValue(current, optValue, this.options, this.exclusiveValues);
    this.emitValueChange(next);
  }

  private toggleAll(): void {
    if (this.readOnly || this.disabled) return;
    const current = Array.isArray(this.value) ? this.value : [];
    const next = toggleSelectAllValues(current, this.options, this.exclusiveValues);
    this.emitValueChange(next);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const listCls = [
      'toggle-group-list',
      this.orientation === 'horizontal' ? 'toggle-group-list--horizontal' : '',
      this.orientation === 'grid' ? 'toggle-group-list--grid' : '',
    ].filter(Boolean).join(' ');
    const listStyle = this.orientation === 'grid' ? `--cols: ${Math.max(1, this.columns)};` : '';
    const placementCls =
      this.labelPlacement === 'start'
        ? ' toggle-row-btn--start'
        : this.labelPlacement === 'space-between'
          ? ' toggle-row-btn--between'
          : '';
    const cardCls = this.variant === 'card' ? ' toggle-row-btn--card' : '';
    const selectedSet = new Set(this.value ?? []);
    const selectAllState = this.showSelectAll
      ? computeSelectAllState(this.value ?? [], this.options, this.exclusiveValues)
      : 'none';

    const group = html`<div
      id=${id}
      role="group"
      class=${listCls}
      data-orientation=${this.orientation}
      data-variant=${this.variant}
      style=${listStyle}
      aria-label=${this.label || 'Toggle options'}
      aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
    >
      ${this.showSelectAll
        ? html`<button
            type="button"
            role="switch"
            data-select-all="true"
            class=${`toggle-row-btn${this.readOnly ? ' toggle-row-btn--readonly' : ''}${placementCls}${cardCls}`}
            aria-checked=${String(selectAllState === 'all')}
            aria-readonly=${this.readOnly ? 'true' : nothing}
            ?disabled=${this.disabled}
            @click=${() => this.toggleAll()}
          >
            <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
            <span>${this.selectAllLabel}</span>
          </button>`
        : nothing}
      ${this.options.map(opt => {
        const checked = selectedSet.has(opt.value);
        return html`<button
          type="button"
          role="switch"
          class=${`toggle-row-btn${this.readOnly ? ' toggle-row-btn--readonly' : ''}${placementCls}${cardCls}`}
          aria-checked=${String(checked)}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          ?disabled=${this.disabled || !!opt.disabled}
          @click=${() => {
            if (opt.disabled) return;
            this.toggleOption(opt.value);
          }}
        >
          <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
          <span class="row-copy">
            <span>${opt.label}</span>
            ${opt.description ? html`<span class="row-desc">${opt.description}</span>` : nothing}
          </span>
        </button>`;
      })}
    </div>`;

    if (this.labelHidden) return group;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<span class="emr-label">${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</span>`
        : nothing}
      ${group}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
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

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) nodes: readonly EmrTreeNode[] = [];
  @property({ attribute: false }) selectedIds: readonly string[] = [];
  @property({ attribute: false }) expandedIds: readonly string[] = [];
  @property({ type: Boolean }) multiple = false;
  @property({ type: String }) checkStrategy: EmrTreeCheckStrategy = 'cascade';
  @property({ type: Boolean }) searchable = false;
  @property({ type: String }) searchQuery = '';
  @property({ type: String }) searchPlaceholder = 'Filter tree…';
  @property({ type: Boolean }) showExpandControls = false;
  @property({ type: String }) emptyMessage = 'No matching items';
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  get value(): readonly string[] | string | null {
    return this.multiple ? this.selectedIds : (this.selectedIds[0] ?? null);
  }
  set value(next: readonly string[] | string | null) {
    if (Array.isArray(next)) {
      this.selectedIds = next;
    } else if (typeof next === 'string' && next) {
      this.selectedIds = [next];
    } else {
      this.selectedIds = [];
    }
  }

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private emitSelection(nextIds: readonly string[]): void {
    this.dispatchEvent(new CustomEvent<readonly string[]>('selectedIdsChange', { detail: nextIds, bubbles: true, composed: true }));
    this.emitValueChange(this.multiple ? nextIds : (nextIds[0] ?? null));
  }

  private emitExpanded(nextExpanded: readonly string[]): void {
    this.expandedIds = nextExpanded;
    this.dispatchEvent(new CustomEvent<readonly string[]>('expandedIdsChange', { detail: nextExpanded, bubbles: true, composed: true }));
  }

  private toggleExpand(id: string): void {
    if (this.disabled) return;
    const set = new Set(this.expandedIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.emitExpanded(Array.from(set));
  }

  private activateRow(row: EmrFlatTreeRow): void {
    if (this.locked || row.node.disabled) return;
    this.dispatchEvent(new CustomEvent<EmrTreeNode>('nodeActivated', { detail: row.node, bubbles: true, composed: true }));
    if (this.multiple) {
      const next = toggleTreeNodeCheck(this.nodes, this.selectedIds, row.node.id, this.checkStrategy);
      this.emitSelection(next);
    } else {
      if (row.node.selectable === false && row.hasChildren) {
        this.toggleExpand(row.node.id);
        return;
      }
      this.emitSelection([row.node.id]);
    }
  }

  private focusTreeItemAt(index: number): void {
    const items = Array.from(this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button[role="treeitem"]:not(:disabled)') ?? []);
    if (!items.length) return;
    const bounded = Math.max(0, Math.min(index, items.length - 1));
    items[bounded]?.focus();
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const rows = flattenVisibleTreeNodes(this.nodes, this.expandedIds, {
      searchQuery: this.searchQuery,
      selectedIds: this.selectedIds,
      checkStrategy: this.checkStrategy,
    });

    const body = html`<div class="emr-field">
      ${this.searchable || this.showExpandControls
        ? html`<div class="tree-toolbar">
            ${this.searchable
              ? html`<input
                  type="search"
                  class="emr-control"
                  placeholder=${this.searchPlaceholder}
                  aria-label=${this.searchPlaceholder}
                  .value=${this.searchQuery}
                  ?disabled=${this.disabled}
                  @input=${(e: Event) => {
                    const q = (e.target as HTMLInputElement).value;
                    this.searchQuery = q;
                    this.dispatchEvent(new CustomEvent<string>('searchQueryChange', { detail: q, bubbles: true, composed: true }));
                  }}
                />`
              : nothing}
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
          </div>`
        : nothing}
      <div
        id=${id}
        role="tree"
        class="tree-list"
        aria-label=${this.label || 'Tree view'}
        aria-multiselectable=${this.multiple ? 'true' : nothing}
        aria-readonly=${this.readOnly ? 'true' : nothing}
        aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
      >
        ${rows.length === 0 ? html`<p class="emr-muted" role="status">${this.emptyMessage}</p>` : nothing}
        ${rows.map((row, idx) => {
          const isSelected = this.multiple ? row.checkState === 'checked' : this.selectedIds.includes(row.node.id);
          return html`<button
            type="button"
            role="treeitem"
            class="tree-row"
            data-node-id=${row.node.id}
            style=${`--tree-depth: ${row.depth};`}
            aria-level=${String(row.depth + 1)}
            aria-expanded=${row.hasChildren ? String(row.expanded) : nothing}
            aria-selected=${String(isSelected)}
            aria-checked=${this.multiple ? (row.checkState === 'mixed' ? 'mixed' : String(row.checkState === 'checked')) : nothing}
            ?disabled=${this.disabled || !!row.node.disabled}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.focusTreeItemAt(idx + 1);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.focusTreeItemAt(idx - 1);
              } else if (e.key === 'Home') {
                e.preventDefault();
                this.focusTreeItemAt(0);
              } else if (e.key === 'End') {
                e.preventDefault();
                this.focusTreeItemAt(rows.length - 1);
              } else if (e.key === 'ArrowRight' && row.hasChildren) {
                e.preventDefault();
                if (!row.expanded) this.toggleExpand(row.node.id);
                else this.focusTreeItemAt(idx + 1);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (row.hasChildren && row.expanded) {
                  this.toggleExpand(row.node.id);
                } else if (row.parentId) {
                  const pIdx = rows.findIndex(r => r.node.id === row.parentId);
                  if (pIdx >= 0) this.focusTreeItemAt(pIdx);
                }
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
            ${this.multiple
              ? html`<input
                  type="checkbox"
                  class="tree-check"
                  tabindex="-1"
                  aria-hidden="true"
                  .checked=${live(row.checkState === 'checked')}
                  .indeterminate=${live(row.checkState === 'mixed')}
                  ?disabled=${this.disabled || !!row.node.disabled}
                />`
              : nothing}
            <span class="row-copy">
              <span>${row.node.label}</span>
              ${row.node.description ? html`<span class="row-desc">${row.node.description}</span>` : nothing}
            </span>
            ${row.node.code ? html`<span class="emr-badge">${row.node.code}</span>` : nothing}
          </button>`;
        })}
      </div>
    </div>`;

    if (this.labelHidden) return body;

    return html`<div class="emr-field" part="field">
      ${this.label ? html`<span class="emr-label">${this.label}</span>` : nothing}
      ${body}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
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

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) placeholder = 'Select…';
  @property({ attribute: false }) nodes: readonly EmrTreeNode[] = [];
  @property({ type: String }) value: string | null = null;
  @property({ attribute: false }) selectedIds: readonly string[] = [];
  @property({ attribute: false }) expandedIds: readonly string[] = [];
  @property({ type: Boolean }) multiple = false;
  @property({ type: String }) checkStrategy: EmrTreeCheckStrategy = 'cascade';
  @property({ type: String }) displayMode: 'path' | 'leaf' = 'path';
  @property({ type: Boolean }) searchable = true;
  @property({ type: Boolean }) clearable = false;
  @property({ type: Boolean }) open = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private get effectiveIds(): readonly string[] {
    if (this.multiple) return this.selectedIds;
    if (this.value) return [this.value];
    return this.selectedIds;
  }

  private setOpen(next: boolean): void {
    if (this.locked && next) return;
    this.open = next;
    this.dispatchEvent(new CustomEvent<boolean>('openChange', { detail: next, bubbles: true, composed: true }));
  }

  private clearAll(): void {
    if (this.locked) return;
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent<readonly string[]>('selectedIdsChange', { detail: [], bubbles: true, composed: true }));
    this.emitValueChange(this.multiple ? [] : null);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const ids = this.effectiveIds;
    const summaryText =
      ids.length === 0
        ? this.placeholder
        : ids.map(nodeId => formatTreeSelectionLabel(this.nodes, nodeId, this.displayMode)).filter(Boolean).join(', ');
    const showClear = this.clearable && ids.length > 0 && !this.locked;

    const control = html`<div class="popover-anchor">
      <div class="trigger-bar">
        <button
          id=${id}
          type="button"
          role="combobox"
          class="trigger-btn"
          aria-expanded=${String(this.open && !this.locked)}
          aria-haspopup="tree"
          aria-readonly=${this.readOnly ? 'true' : nothing}
          aria-invalid=${this.error ? 'true' : nothing}
          aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
          ?disabled=${this.disabled}
          @click=${() => this.setOpen(!this.open)}
        >
          <span>${summaryText}</span>
          <span aria-hidden="true">${renderEmrSvgIcon(this.open ? 'chevron-up' : 'chevron-down', 16)}</span>
        </button>
        ${showClear
          ? html`<button
              type="button"
              class="clear-btn"
              data-clear-btn="true"
              aria-label=${`Clear ${this.label || 'selection'}`}
              @click=${() => this.clearAll()}
            >${renderEmrSvgIcon('close', 14)}</button>`
          : nothing}
      </div>
      ${this.open && !this.locked
        ? html`<div class="dropdown-panel">
            <emr-tree-view
              labelHidden
              .label=${this.label || 'Options'}
              .nodes=${this.nodes}
              .selectedIds=${ids}
              .expandedIds=${this.expandedIds.length ? this.expandedIds : collectAllExpandableTreeIds(this.nodes)}
              .multiple=${this.multiple}
              .checkStrategy=${this.checkStrategy}
              .searchable=${this.searchable}
              @selectedIdsChange=${(e: CustomEvent<readonly string[]>) => {
                e.stopPropagation();
                const nextIds = e.detail;
                this.dispatchEvent(new CustomEvent<readonly string[]>('selectedIdsChange', { detail: nextIds, bubbles: true, composed: true }));
                if (this.multiple) {
                  this.emitValueChange(nextIds);
                } else {
                  this.emitValueChange(nextIds[0] ?? null);
                  this.setOpen(false);
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
        : this.hint
          ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
          : nothing}
    </div>`;
  }
}

/** 4. EmrImageViewerElement (`emr-image-viewer`) */
export class EmrImageViewerElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-image-viewer');
  private panStart?: { x: number; y: number; basePanX: number; basePanY: number };

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = 'Image viewer';
  @property({ type: String }) src = '';
  @property({ type: String }) alt = '';
  @property({ type: String }) caption = '';
  @property({ attribute: false }) images: readonly EmrImageItem[] = [];
  @property({ type: Number }) activeIndex = 0;
  @property({ attribute: false }) viewport: EmrImageViewportState = DEFAULT_IMAGE_VIEWPORT;
  @property({ type: Boolean }) fullscreen = false;
  @property({ type: Boolean }) allowFullscreen = true;
  @property({ type: Boolean }) showThumbnails = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;

  private get resolvedItems(): readonly EmrImageItem[] {
    if (this.images.length > 0) return this.images;
    if (this.src) return [{ id: 'single', src: this.src, alt: this.alt || this.label, caption: this.caption }];
    return [];
  }

  private updateViewport(patch: Partial<EmrImageViewportState>): void {
    if (this.disabled) return;
    const next: EmrImageViewportState = { ...this.viewport, ...patch };
    this.viewport = next;
    this.dispatchEvent(new CustomEvent<EmrImageViewportState>('viewportChange', { detail: next, bubbles: true, composed: true }));
  }

  private setActiveIndex(nextIdx: number): void {
    const items = this.resolvedItems;
    if (!items.length) return;
    const bounded = ((nextIdx % items.length) + items.length) % items.length;
    this.activeIndex = bounded;
    this.dispatchEvent(new CustomEvent<number>('activeIndexChange', { detail: bounded, bubbles: true, composed: true }));
  }

  private toggleFullscreen(next: boolean): void {
    if (!this.allowFullscreen && next) return;
    this.fullscreen = next;
    this.dispatchEvent(new CustomEvent<boolean>('fullscreenChange', { detail: next, bubbles: true, composed: true }));
    if (!next) {
      this.dispatchEvent(new CustomEvent('closeRequested', { bubbles: true, composed: true }));
    }
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const items = this.resolvedItems;
    const current = items[Math.min(this.activeIndex, Math.max(0, items.length - 1))];
    const transformCss = formatImageTransformCss(this.viewport);

    return html`<div
      id=${id}
      role=${this.fullscreen ? 'dialog' : 'region'}
      aria-modal=${this.fullscreen ? 'true' : nothing}
      aria-label=${this.label}
      tabindex="0"
      class=${`viewer-shell${this.fullscreen ? ' viewer-shell--fullscreen' : ''}`}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === 'Escape' && this.fullscreen) {
          e.preventDefault();
          this.toggleFullscreen(false);
        }
      }}
    >
      <div class="viewer-toolbar">
        <div class="emr-row">
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="zoom-out"
            aria-label="Zoom out"
            ?disabled=${this.disabled}
            @click=${() => this.updateViewport({ zoom: stepImageZoom(this.viewport.zoom, -0.25) })}
          >−</button>
          <span class="emr-badge">${Math.round(this.viewport.zoom * 100)}%</span>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="zoom-in"
            aria-label="Zoom in"
            ?disabled=${this.disabled}
            @click=${() => this.updateViewport({ zoom: stepImageZoom(this.viewport.zoom, 0.25) })}
          >+</button>
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
            aria-label="Rotate counterclockwise"
            ?disabled=${this.disabled}
            @click=${() => this.updateViewport({ rotationDeg: rotateImage90(this.viewport.rotationDeg, false) })}
          >↺ 90°</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="rotate-cw"
            aria-label="Rotate clockwise"
            ?disabled=${this.disabled}
            @click=${() => this.updateViewport({ rotationDeg: rotateImage90(this.viewport.rotationDeg, true) })}
          >↻ 90°</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="flip-h"
            aria-label="Flip horizontal"
            aria-pressed=${String(this.viewport.flipH)}
            ?disabled=${this.disabled}
            @click=${() => this.updateViewport({ flipH: !this.viewport.flipH })}
          >Flip H</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="flip-v"
            aria-label="Flip vertical"
            aria-pressed=${String(this.viewport.flipV)}
            ?disabled=${this.disabled}
            @click=${() => this.updateViewport({ flipV: !this.viewport.flipV })}
          >Flip V</button>
        </div>
        <div class="emr-row">
          <label class="emr-muted">
            Straighten
            <input
              type="range"
              min="-45"
              max="45"
              step="1"
              aria-label="Straighten angle"
              .value=${String(this.viewport.rotationDeg)}
              ?disabled=${this.disabled}
              @input=${(e: Event) => {
                const raw = Number((e.target as HTMLInputElement).value);
                this.updateViewport({ rotationDeg: clampStraightenAngle(raw) });
              }}
            />
          </label>
          ${this.allowFullscreen
            ? html`<button
                type="button"
                class="emr-btn emr-btn--outline"
                data-action="fullscreen"
                aria-label=${this.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                @click=${() => this.toggleFullscreen(!this.fullscreen)}
              >${this.fullscreen ? 'Close' : 'Fullscreen'}</button>`
            : nothing}
        </div>
      </div>

      <div
        class="viewer-stage"
        @pointerdown=${(e: PointerEvent) => {
          if (this.disabled) return;
          this.panStart = { x: e.clientX, y: e.clientY, basePanX: this.viewport.panX, basePanY: this.viewport.panY };
        }}
        @pointermove=${(e: PointerEvent) => {
          if (!this.panStart || this.disabled) return;
          this.updateViewport({
            panX: this.panStart.basePanX + (e.clientX - this.panStart.x),
            panY: this.panStart.basePanY + (e.clientY - this.panStart.y),
          });
        }}
        @pointerup=${() => {
          this.panStart = undefined;
        }}
      >
        ${current
          ? html`<img class="viewer-img" src=${current.src} alt=${current.alt} style=${`transform: ${transformCss};`} />`
          : html`<span class="emr-muted">No image</span>`}
      </div>

      ${current?.caption ? html`<p class="emr-muted">${current.caption}</p>` : nothing}

      ${items.length > 1
        ? html`<div class="viewer-toolbar">
            <button type="button" class="emr-btn emr-btn--outline" aria-label="Previous image" @click=${() => this.setActiveIndex(this.activeIndex - 1)}>Prev</button>
            <span class="emr-muted">${this.activeIndex + 1} / ${items.length}</span>
            <button type="button" class="emr-btn emr-btn--outline" aria-label="Next image" @click=${() => this.setActiveIndex(this.activeIndex + 1)}>Next</button>
          </div>`
        : nothing}

      ${this.showThumbnails && items.length > 1
        ? html`<div class="viewer-thumbs" role="list" aria-label="Image thumbnails">
            ${items.map(
              (item, idx) => html`<button
                type="button"
                class="viewer-thumb-btn"
                aria-label=${item.alt || `Image ${idx + 1}`}
                aria-current=${idx === this.activeIndex ? 'true' : nothing}
                @click=${() => this.setActiveIndex(idx)}
              >${idx + 1}</button>`,
            )}
          </div>`
        : nothing}
    </div>`;
  }
}

/** 5. EmrImageCropperElement (`emr-image-cropper`) */
export class EmrImageCropperElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-image-cropper');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = 'Crop & Adjust Image';
  @property({ type: String }) src = '';
  @property({ type: String }) alt = 'Image to crop';
  @property({ attribute: false }) aspectPresets: readonly EmrAspectPreset[] = DEFAULT_ASPECT_PRESETS;
  @property({ attribute: false }) transform: EmrImageCropTransform = DEFAULT_IMAGE_CROP_TRANSFORM;
  @property({ type: String }) outputMimeType = 'image/png';
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private emitTransform(patch: Partial<EmrImageCropTransform>): void {
    if (this.locked) return;
    const nextRatio = patch.aspectRatio !== undefined ? patch.aspectRatio : this.transform.aspectRatio;
    const merged: EmrImageCropTransform = {
      ...this.transform,
      ...patch,
      rect: clampCropRect(patch.rect ?? this.transform.rect, nextRatio),
      rotationDeg: clampStraightenAngle(patch.rotationDeg ?? this.transform.rotationDeg),
    };
    this.transform = merged;
    this.dispatchEvent(new CustomEvent<EmrImageCropTransform>('cropChange', { detail: merged, bubbles: true, composed: true }));
  }

  private selectAspectPreset(preset: EmrAspectPreset): void {
    const ratio = preset.ratio;
    const baseRect = ratio
      ? clampCropRect({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 / ratio }, ratio)
      : { x: 0.05, y: 0.05, width: 0.9, height: 0.9 };
    this.emitTransform({ aspectRatio: ratio, rect: baseRect });
  }

  private commitCrop(): void {
    if (this.locked) return;
    const result: EmrImageCropResult = {
      transform: this.transform,
      croppedDataUrl: this.src || `data:${this.outputMimeType};base64,`,
    };
    this.dispatchEvent(new CustomEvent<EmrImageCropResult>('cropCommitted', { detail: result, bubbles: true, composed: true }));
    this.emitValueChange(result);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const c = this.transform.rect;
    const transformCss = formatImageTransformCss({
      zoom: this.transform.zoom,
      panX: this.transform.panX,
      panY: this.transform.panY,
      rotationDeg: this.transform.rotationDeg,
      flipH: this.transform.flipH,
      flipV: this.transform.flipV,
    });

    return html`<div id=${id} class="viewer-shell" role="group" aria-label=${this.label}>
      <div class="viewer-toolbar">
        <div class="emr-row" role="radiogroup" aria-label="Aspect ratio presets">
          ${this.aspectPresets.map(preset => {
            const active = this.transform.aspectRatio === preset.ratio;
            return html`<button
              type="button"
              role="radio"
              data-aspect-id=${preset.id}
              class=${`emr-btn ${active ? 'emr-btn--primary' : 'emr-btn--outline'}`}
              aria-checked=${String(active)}
              ?disabled=${this.locked}
              @click=${() => this.selectAspectPreset(preset)}
            >${preset.label}</button>`;
          })}
        </div>
        <div class="emr-row">
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="rotate-ccw"
            aria-label="Rotate counterclockwise"
            ?disabled=${this.locked}
            @click=${() => this.emitTransform({ rotationDeg: rotateImage90(this.transform.rotationDeg, false) })}
          >↺ 90°</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="rotate-cw"
            aria-label="Rotate clockwise"
            ?disabled=${this.locked}
            @click=${() => this.emitTransform({ rotationDeg: rotateImage90(this.transform.rotationDeg, true) })}
          >↻ 90°</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="flip-h"
            aria-label="Flip horizontal"
            ?disabled=${this.locked}
            @click=${() => this.emitTransform({ flipH: !this.transform.flipH })}
          >Flip H</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="flip-v"
            aria-label="Flip vertical"
            ?disabled=${this.locked}
            @click=${() => this.emitTransform({ flipV: !this.transform.flipV })}
          >Flip V</button>
        </div>
      </div>

      <div class="cropper-stage">
        ${this.src ? html`<img class="viewer-img" src=${this.src} alt=${this.alt} style=${`transform: ${transformCss};`} />` : nothing}
        <div
          class="crop-box"
          role="region"
          aria-label="Crop region"
          style=${`left:${c.x * 100}%;top:${c.y * 100}%;width:${c.width * 100}%;height:${c.height * 100}%;`}
        >
          <span class="crop-handle" aria-hidden="true"></span>
        </div>
      </div>

      <div class="viewer-toolbar">
        <div class="emr-row">
          <label class="emr-muted">
            Zoom
            <input
              type="range"
              min="1"
              max="4"
              step="0.1"
              aria-label="Crop zoom"
              .value=${String(this.transform.zoom)}
              ?disabled=${this.locked}
              @input=${(e: Event) => {
                this.emitTransform({ zoom: Number((e.target as HTMLInputElement).value) });
              }}
            />
          </label>
          <label class="emr-muted">
            Straighten
            <input
              type="range"
              min="-45"
              max="45"
              step="1"
              aria-label="Crop straighten"
              .value=${String(this.transform.rotationDeg)}
              ?disabled=${this.locked}
              @input=${(e: Event) => {
                this.emitTransform({ rotationDeg: Number((e.target as HTMLInputElement).value) });
              }}
            />
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
            @click=${() => this.dispatchEvent(new CustomEvent('cancelRequested', { bubbles: true, composed: true }))}
          >Cancel</button>
          <button
            type="button"
            class="emr-btn emr-btn--primary"
            data-action="apply-crop"
            ?disabled=${this.locked}
            @click=${() => this.commitCrop()}
          >Apply crop</button>
        </div>
      </div>
    </div>`;
  }
}

/** 6. EmrImageUploadElement (`emr-image-upload`) */
export class EmrImageUploadElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-image-upload');

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
  @property({ type: String }) buttonLabel = 'Choose images';
  @property({ type: String }) dropHint = 'or drag and drop clinical images here';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  @state() private viewingIndex: number | null = null;
  @state() private croppingItemId: string | null = null;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private emitItems(next: readonly EmrUploadedImageItem[]): void {
    this.dispatchEvent(new CustomEvent<readonly EmrUploadedImageItem[]>('itemsChange', { detail: next, bubbles: true, composed: true }));
    this.emitValueChange(next);
  }

  private handleNativeFiles(fileList: FileList | null): void {
    if (this.locked || !fileList || fileList.length === 0) return;
    const rawFiles = Array.from(fileList);
    const summaries: EmrFileSelectionItem[] = rawFiles.map(f => ({
      name: f.name,
      sizeBytes: f.size,
      mimeType: f.type,
      lastModified: f.lastModified,
    }));
    this.dispatchEvent(new CustomEvent<readonly EmrFileSelectionItem[]>('filesSelected', { detail: summaries, bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent<readonly File[]>('nativeFilesSelected', { detail: rawFiles, bubbles: true, composed: true }));
    const created: EmrUploadedImageItem[] = rawFiles.map((f, idx) => {
      const url = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(f) : `data:image/png;base64,`;
      return {
        id: `${Date.now()}-${idx}-${f.name}`,
        name: f.name,
        src: url,
        previewSrc: url,
        sizeBytes: f.size,
        mimeType: f.type || 'image/png',
      };
    });
    const combined = this.multiple ? [...this.items, ...created] : created.slice(0, 1);
    const bounded = this.maxFiles !== undefined ? combined.slice(0, this.maxFiles) : combined;
    this.emitItems(bounded);
  }

  private removeItem(id: string): void {
    if (this.locked) return;
    this.dispatchEvent(new CustomEvent<string>('removeRequested', { detail: id, bubbles: true, composed: true }));
    this.emitItems(this.items.filter(item => item.id !== id));
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const croppingItem = this.croppingItemId ? this.items.find(i => i.id === this.croppingItemId) : undefined;

    const body = html`<div class="emr-field">
      <div class="upload-dropzone">
        <input
          id=${id}
          type="file"
          class="sr-only"
          accept=${this.accept}
          ?multiple=${this.multiple}
          ?disabled=${this.locked}
          @change=${(e: Event) => {
            const input = e.target as HTMLInputElement;
            this.handleNativeFiles(input.files);
            input.value = '';
          }}
        />
        <button
          type="button"
          class="emr-btn emr-btn--outline"
          ?disabled=${this.locked}
          @click=${() => this.shadowRoot?.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
        >
          ${renderEmrSvgIcon('upload', 16)}
          <span>${this.buttonLabel}</span>
        </button>
        ${this.allowCamera
          ? html`<button
              type="button"
              class="emr-btn emr-btn--secondary"
              data-action="camera"
              ?disabled=${this.locked}
              @click=${() => this.dispatchEvent(new CustomEvent<'camera'>('captureRequested', { detail: 'camera', bubbles: true, composed: true }))}
            >Capture photo</button>`
          : nothing}
        ${this.dropHint ? html`<span class="emr-muted">${this.dropHint}</span>` : nothing}
      </div>

      ${this.items.length > 0
        ? html`<div class="upload-grid" role="list" aria-label="Uploaded images">
            ${this.items.map(
              (item, idx) => html`<div class="upload-card" role="listitem" data-image-id=${item.id}>
                <img class="upload-thumb" src=${item.previewSrc ?? item.src} alt=${item.alt || item.caption || item.name} />
                <strong>${item.name}</strong>
                <input
                  type="text"
                  class="emr-control"
                  data-caption-id=${item.id}
                  aria-label=${`Caption for ${item.name}`}
                  placeholder="Caption…"
                  .value=${live(item.caption ?? '')}
                  ?readonly=${this.readOnly}
                  ?disabled=${this.disabled}
                  @change=${(e: Event) => {
                    if (this.locked) return;
                    const caption = (e.target as HTMLInputElement).value;
                    this.dispatchEvent(
                      new CustomEvent<{ id: string; caption: string }>('captionChange', {
                        detail: { id: item.id, caption },
                        bubbles: true,
                        composed: true,
                      }),
                    );
                    this.emitItems(this.items.map(it => (it.id === item.id ? { ...it, caption } : it)));
                  }}
                />
                <div class="emr-row">
                  <button
                    type="button"
                    class="emr-btn emr-btn--ghost"
                    data-action="view"
                    aria-label=${`View ${item.name}`}
                    @click=${() => {
                      this.viewingIndex = idx;
                    }}
                  >View</button>
                  ${!this.locked
                    ? html`<button
                          type="button"
                          class="emr-btn emr-btn--outline"
                          data-action="crop"
                          aria-label=${`Crop ${item.name}`}
                          @click=${() => {
                            this.croppingItemId = item.id;
                          }}
                        >Crop / Rotate</button>
                        <button
                          type="button"
                          class="emr-btn emr-btn--danger"
                          data-action="remove"
                          aria-label=${`Remove ${item.name}`}
                          @click=${() => this.removeItem(item.id)}
                        >Remove</button>`
                    : nothing}
                </div>
              </div>`,
            )}
          </div>`
        : nothing}

      ${this.viewingIndex !== null
        ? html`<emr-image-viewer
            fullscreen
            .images=${this.items.map(i => ({ id: i.id, src: i.previewSrc ?? i.src, alt: i.alt || i.name, caption: i.caption }))}
            .activeIndex=${this.viewingIndex}
            @fullscreenChange=${(e: CustomEvent<boolean>) => {
              if (!e.detail) this.viewingIndex = null;
            }}
            @closeRequested=${() => {
              this.viewingIndex = null;
            }}
          ></emr-image-viewer>`
        : nothing}

      ${croppingItem
        ? html`<emr-image-cropper
            .src=${croppingItem.src}
            .alt=${croppingItem.alt || croppingItem.name}
            .aspectPresets=${this.aspectPresets}
            .transform=${croppingItem.cropTransform ?? DEFAULT_IMAGE_CROP_TRANSFORM}
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
              const updated: EmrUploadedImageItem[] = this.items.map(it =>
                it.id === croppingItem.id
                  ? { ...it, previewSrc: res.croppedDataUrl ?? it.previewSrc ?? it.src, cropTransform: res.transform }
                  : it,
              );
              this.croppingItemId = null;
              this.emitItems(updated);
            }}
            @cancelRequested=${() => {
              this.croppingItemId = null;
            }}
          ></emr-image-cropper>`
        : nothing}
    </div>`;

    if (this.labelHidden) return body;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<span class="emr-label">${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</span>`
        : nothing}
      ${body}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.hint
          ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
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
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) value: EmrDateRangeValue | null = null;
  @property({ type: String }) min = '';
  @property({ type: String }) max = '';
  @property({ attribute: false }) presets: readonly EmrDateRangePreset[] = [];
  @property({ type: String }) placeholder = 'YYYY-MM-DD – YYYY-MM-DD';
  @property({ type: Boolean }) clearable = true;
  @property({ type: Boolean }) open = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  @state() private viewYear = this.todayParts.year;
  @state() private viewMonth = this.todayParts.month;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private get rangeValue(): EmrDateRangeValue {
    return this.value ?? { start: null, end: null };
  }

  private selectDay(iso: string): void {
    if (this.locked) return;
    const next = normalizeDateRangeSelection(this.rangeValue, iso);
    this.emitValueChange(next);
  }

  private clearRange(): void {
    if (this.locked) return;
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.emitValueChange({ start: null, end: null });
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const r = this.rangeValue;
    const hasAny = Boolean(r.start || r.end);
    const displayText = r.start || r.end ? `${r.start ?? '…'} – ${r.end ?? '…'}` : this.placeholder;
    const cells = buildLitCalendarMonthGrid(this.viewYear, this.viewMonth, r.start, this.todayParts.isoDay);

    const control = html`<div class="popover-anchor">
      <div class="trigger-bar">
        <input
          id=${id}
          type="text"
          class="emr-control"
          aria-label=${this.label ? `${this.label} start date` : 'Start date'}
          placeholder="YYYY-MM-DD"
          .value=${live(r.start ?? '')}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          @change=${(e: Event) => {
            if (this.locked) return;
            const start = (e.target as HTMLInputElement).value.trim() || null;
            this.emitValueChange({ start, end: r.end });
          }}
        />
        <span class="emr-muted" aria-hidden="true">–</span>
        <input
          type="text"
          class="emr-control"
          aria-label=${this.label ? `${this.label} end date` : 'End date'}
          placeholder="YYYY-MM-DD"
          .value=${live(r.end ?? '')}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          @change=${(e: Event) => {
            if (this.locked) return;
            const end = (e.target as HTMLInputElement).value.trim() || null;
            this.emitValueChange({ start: r.start, end });
          }}
        />
        <button
          type="button"
          class="emr-btn emr-btn--outline"
          data-calendar-toggle="true"
          aria-label=${`Toggle calendar (${displayText})`}
          aria-expanded=${String(this.open && !this.locked)}
          ?disabled=${this.disabled}
          @click=${() => {
            if (!this.locked) this.open = !this.open;
          }}
        >${renderEmrSvgIcon('calendar', 16)}</button>
        ${this.clearable && hasAny && !this.locked
          ? html`<button
              type="button"
              class="clear-btn"
              data-clear-btn="true"
              aria-label=${`Clear ${this.label || 'date range'}`}
              @click=${() => this.clearRange()}
            >${renderEmrSvgIcon('close', 14)}</button>`
          : nothing}
      </div>

      ${this.open && !this.locked
        ? html`<div class="dropdown-panel" role="dialog" aria-label=${`${this.label || 'Date range'} calendar`}>
            ${this.presets.length > 0
              ? html`<div class="emr-row" style="margin-bottom:8px;">
                  ${this.presets.map(
                    preset => html`<button
                      type="button"
                      class="emr-btn emr-btn--ghost"
                      data-preset-id=${preset.id}
                      @click=${() => {
                        this.emitValueChange(preset.range);
                        this.open = false;
                      }}
                    >${preset.label}</button>`,
                  )}
                </div>`
              : nothing}
            <div class="emr-header" style="margin-bottom:6px;">
              <button
                type="button"
                class="emr-btn emr-btn--ghost"
                aria-label="Previous month"
                @click=${() => {
                  const p = stepLitCalendarMonth(this.viewYear, this.viewMonth, -1);
                  this.viewYear = p.year;
                  this.viewMonth = p.month;
                }}
              >${renderEmrSvgIcon('chevron-left', 16)}</button>
              <strong>${LIT_CALENDAR_MONTH_NAMES[this.viewMonth - 1]} ${this.viewYear}</strong>
              <button
                type="button"
                class="emr-btn emr-btn--ghost"
                aria-label="Next month"
                @click=${() => {
                  const n = stepLitCalendarMonth(this.viewYear, this.viewMonth, 1);
                  this.viewYear = n.year;
                  this.viewMonth = n.month;
                }}
              >${renderEmrSvgIcon('chevron-right', 16)}</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">
              ${LIT_CALENDAR_WEEKDAYS.map(w => html`<span class="emr-muted" style="text-align:center;">${w}</span>`)}
              ${cells.map(cell => {
                const inRange = isIsoDateInRange(cell.iso, r);
                const isEdge = isIsoRangeEdge(cell.iso, r);
                const isOutOfBounds = (Boolean(this.min) && cell.iso < this.min) || (Boolean(this.max) && cell.iso > this.max);
                const cls = `emr-btn emr-btn--ghost${inRange ? ' cal-day--in-range' : ''}${isEdge ? ' cal-day--edge' : ''}`;
                return html`<button
                  type="button"
                  data-iso=${cell.iso}
                  class=${cls}
                  aria-pressed=${String(Boolean(isEdge))}
                  ?disabled=${isOutOfBounds}
                  @click=${() => this.selectDay(cell.iso)}
                >${cell.day}</button>`;
              })}
            </div>
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
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: Number }) value: number | null = null;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) step = 1;
  @property({ type: String }) unit = '';
  @property({ attribute: false }) marks: readonly EmrSliderMark[] = [];
  @property({ type: Boolean }) showValue = true;
  @property({ type: Boolean }) clearable = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private clearSlider(): void {
    if (this.locked) return;
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.emitValueChange(null);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const numeric = this.value ?? this.min;

    const control = html`<div class="slider-wrap">
      <div class="trigger-bar">
        <input
          id=${id}
          type="range"
          role="slider"
          class="slider-native"
          min=${String(this.min)}
          max=${String(this.max)}
          step=${String(this.step)}
          .value=${live(String(numeric))}
          aria-label=${this.labelHidden ? this.label || 'Slider' : nothing}
          aria-valuemin=${String(this.min)}
          aria-valuemax=${String(this.max)}
          aria-valuenow=${String(numeric)}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          ?disabled=${this.disabled}
          @input=${(e: Event) => {
            if (this.locked) {
              (e.target as HTMLInputElement).value = String(numeric);
              return;
            }
            const raw = Number((e.target as HTMLInputElement).value);
            const next = clampSliderValue(raw, this.min, this.max, this.step);
            this.emitValueChange(next);
          }}
        />
        ${this.showValue
          ? html`<span class="emr-badge">${this.value === null ? '—' : `${this.value}${this.unit ? ` ${this.unit}` : ''}`}</span>`
          : nothing}
        ${this.clearable && this.value !== null && !this.locked
          ? html`<button
              type="button"
              class="clear-btn"
              data-clear-btn="true"
              aria-label=${`Clear ${this.label || 'slider'}`}
              @click=${() => this.clearSlider()}
            >${renderEmrSvgIcon('close', 14)}</button>`
          : nothing}
      </div>
      ${this.marks.length > 0
        ? html`<div class="slider-marks" aria-hidden="true">
            ${this.marks.map(m => html`<span>${m.label ?? m.value}</span>`)}
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
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) value: readonly [number, number] = [0, 100];
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) step = 1;
  @property({ type: Number }) minDistance = 0;
  @property({ type: String }) unit = '';
  @property({ attribute: false }) marks: readonly EmrSliderMark[] = [];
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private updateThumb(which: 'low' | 'high', rawVal: number): void {
    if (this.locked) return;
    const [curLow, curHigh] = this.value ?? [this.min, this.max];
    const nextPair =
      which === 'low'
        ? clampRangeSliderPair(rawVal, curHigh, this.min, this.max, this.step, this.minDistance, 'low')
        : clampRangeSliderPair(curLow, rawVal, this.min, this.max, this.step, this.minDistance, 'high');
    this.emitValueChange(nextPair);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const [low, high] = this.value ?? [this.min, this.max];

    const control = html`<div class="slider-wrap" role="group" aria-label=${this.label || 'Range slider'}>
      <div class="range-pair-row">
        <input
          id=${`${id}-low`}
          type="range"
          role="slider"
          data-thumb="low"
          class="slider-native"
          min=${String(this.min)}
          max=${String(this.max)}
          step=${String(this.step)}
          .value=${live(String(low))}
          aria-label=${`${this.label || 'Range'} minimum`}
          aria-valuemin=${String(this.min)}
          aria-valuemax=${String(high)}
          aria-valuenow=${String(low)}
          ?disabled=${this.disabled}
          @input=${(e: Event) => {
            if (this.locked) {
              (e.target as HTMLInputElement).value = String(low);
              return;
            }
            this.updateThumb('low', Number((e.target as HTMLInputElement).value));
          }}
        />
        <input
          id=${`${id}-high`}
          type="range"
          role="slider"
          data-thumb="high"
          class="slider-native"
          min=${String(this.min)}
          max=${String(this.max)}
          step=${String(this.step)}
          .value=${live(String(high))}
          aria-label=${`${this.label || 'Range'} maximum`}
          aria-valuemin=${String(low)}
          aria-valuemax=${String(this.max)}
          aria-valuenow=${String(high)}
          ?disabled=${this.disabled}
          @input=${(e: Event) => {
            if (this.locked) {
              (e.target as HTMLInputElement).value = String(high);
              return;
            }
            this.updateThumb('high', Number((e.target as HTMLInputElement).value));
          }}
        />
      </div>
      <span class="emr-badge">${low}${this.unit ? ` ${this.unit}` : ''} – ${high}${this.unit ? ` ${this.unit}` : ''}</span>
      ${this.marks.length > 0
        ? html`<div class="slider-marks" aria-hidden="true">
            ${this.marks.map(m => html`<span>${m.label ?? m.value}</span>`)}
          </div>`
        : nothing}
    </div>`;

    if (this.labelHidden) return control;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<span class="emr-label">${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</span>`
        : nothing}
      ${control}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
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
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) mask = '';
  @property({ type: String }) placeholder = '';
  @property({ type: Boolean }) emitUnmasked = false;
  @property({ type: Boolean }) clearable = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const maskResult = applyInputMask(this.value ?? '', this.mask);
    const formatted = maskResult.masked;

    const bar = html`<div class="trigger-bar">
      <input
        id=${id}
        type="text"
        class="emr-control"
        placeholder=${this.placeholder || this.mask}
        .value=${live(formatted)}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        ?required=${this.required}
        aria-label=${this.labelHidden && this.label ? this.label : nothing}
        aria-invalid=${this.error ? 'true' : nothing}
        aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
        @blur=${(e: Event) => {
          (e.target as HTMLInputElement).value = applyInputMask(this.value ?? '', this.mask).masked;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }}
        @input=${(e: Event) => {
          const input = e.target as HTMLInputElement;
          if (this.locked) {
            input.value = formatted;
            return;
          }
          const res = applyInputMask(input.value, this.mask);
          input.value = res.masked;
          const emitted = this.emitUnmasked ? res.unmasked : res.masked;
          this.emitValueChange(emitted === '' ? null : emitted);
          if (res.complete) {
            this.dispatchEvent(new CustomEvent<EmrMaskResult>('maskComplete', { detail: res, bubbles: true, composed: true }));
          }
        }}
      />
      ${this.clearable && formatted.length > 0 && !this.locked
        ? html`<button
            type="button"
            class="clear-btn"
            data-clear-btn="true"
            aria-label=${`Clear ${this.label || 'input'}`}
            @click=${() => {
              this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
              this.emitValueChange(null);
            }}
          >${renderEmrSvgIcon('close', 14)}</button>`
        : nothing}
    </div>`;

    if (this.labelHidden) return bar;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${bar}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
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
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value = '';
  @property({ type: Number }) length = 6;
  @property({ type: Boolean }) numericOnly = true;
  @property({ type: Boolean }) masked = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private focusSlot(idx: number): void {
    const inputs = Array.from(this.shadowRoot?.querySelectorAll<HTMLInputElement>('input.otp-slot') ?? []);
    const target = inputs[Math.max(0, Math.min(idx, inputs.length - 1))];
    target?.focus();
  }

  private handleEdit(slotIndex: number, rawText: string): void {
    if (this.locked) return;
    const res = applyOtpSlotEdit(this.value, slotIndex, rawText, this.length, this.numericOnly);
    this.emitValueChange(res.value);
    if (res.completed) {
      this.dispatchEvent(new CustomEvent<string>('completed', { detail: res.value, bubbles: true, composed: true }));
    }
    void this.updateComplete.then(() => this.focusSlot(res.nextFocusIndex));
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const slots = normalizeOtpSlots(this.value, this.length);

    const row = html`<div id=${id} class="otp-row" role="group" aria-label=${this.label || 'Verification code'}>
      ${slots.map(
        (char, idx) => html`<input
          type=${this.masked ? 'password' : 'text'}
          inputmode=${this.numericOnly ? 'numeric' : 'text'}
          maxlength="1"
          class="otp-slot"
          data-slot-index=${String(idx)}
          aria-label=${`${this.label || 'Digit'} ${idx + 1} of ${this.length}`}
          .value=${live(char)}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          @input=${(e: Event) => {
            const input = e.target as HTMLInputElement;
            if (this.locked) {
              input.value = char;
              return;
            }
            this.handleEdit(idx, input.value);
          }}
          @paste=${(e: ClipboardEvent) => {
            if (this.locked) return;
            const text = e.clipboardData?.getData('text') ?? '';
            if (text) {
              e.preventDefault();
              this.handleEdit(idx, text);
            }
          }}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              this.focusSlot(idx - 1);
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              this.focusSlot(idx + 1);
            } else if (e.key === 'Backspace' && !char && idx > 0 && !this.locked) {
              e.preventDefault();
              this.handleEdit(idx - 1, '');
              this.focusSlot(idx - 1);
            }
          }}
        />`,
      )}
    </div>`;

    if (this.labelHidden) return row;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<span class="emr-label">${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</span>`
        : nothing}
      ${row}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
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

  @property({ type: String }) controlId = '';
  @property({ type: String }) triggerLabel = 'Actions';
  @property({ type: String }) triggerIcon = '';
  @property({ type: String }) triggerVariant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' = 'outline';
  @property({ attribute: false }) items: readonly EmrMenuItem[] = [];
  @property({ type: Boolean }) open = false;
  @property({ type: String }) align: 'start' | 'end' = 'start';
  @property({ type: Boolean }) disabled = false;

  private setOpen(next: boolean): void {
    if (this.disabled && next) return;
    this.open = next;
    this.dispatchEvent(new CustomEvent<boolean>('openChange', { detail: next, bubbles: true, composed: true }));
  }

  private focusItemAt(idx: number): void {
    const enabled = Array.from(this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not(:disabled)') ?? []);
    if (!enabled.length) return;
    const bounded = Math.max(0, Math.min(idx, enabled.length - 1));
    enabled[bounded]?.focus();
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const menuId = `${id}-menu`;

    return html`<div class="menu-root">
      <button
        id=${id}
        type="button"
        class=${`emr-btn emr-btn--${this.triggerVariant}`}
        aria-haspopup="menu"
        aria-expanded=${String(this.open && !this.disabled)}
        aria-controls=${this.open ? menuId : nothing}
        ?disabled=${this.disabled}
        @click=${() => this.setOpen(!this.open)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'ArrowDown' && !this.open) {
            e.preventDefault();
            this.setOpen(true);
            void this.updateComplete.then(() => this.focusItemAt(0));
          } else if (e.key === 'Escape' && this.open) {
            e.preventDefault();
            this.setOpen(false);
          }
        }}
      >
        ${this.triggerIcon ? renderEmrSvgIcon(this.triggerIcon as EmrLitIconName, 16) : nothing}
        <span>${this.triggerLabel}</span>
        ${renderEmrSvgIcon(this.open ? 'chevron-up' : 'chevron-down', 14)}
      </button>

      ${this.open && !this.disabled
        ? html`<div
            id=${menuId}
            role="menu"
            class="menu-list"
            aria-label=${this.triggerLabel}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                this.setOpen(false);
              }
            }}
          >
            ${this.items.map(
              (item, idx) => html`
                ${item.dividerBefore ? html`<div class="menu-divider" role="separator"></div>` : nothing}
                <button
                  type="button"
                  role="menuitem"
                  data-item-id=${item.id}
                  class=${`menu-item${item.tone === 'danger' ? ' menu-item--danger' : ''}`}
                  ?disabled=${item.disabled}
                  @keydown=${(e: KeyboardEvent) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      this.focusItemAt(idx + 1);
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      this.focusItemAt(idx - 1);
                    } else if (e.key === 'Home') {
                      e.preventDefault();
                      this.focusItemAt(0);
                    } else if (e.key === 'End') {
                      e.preventDefault();
                      this.focusItemAt(this.items.length - 1);
                    }
                  }}
                  @click=${() => {
                    if (item.disabled) return;
                    this.setOpen(false);
                    this.dispatchEvent(new CustomEvent<string>('itemSelected', { detail: item.id, bubbles: true, composed: true }));
                    this.emitValueChange(item.id);
                  }}
                >
                  <span class="row-copy">
                    <span>${item.label}</span>
                    ${item.description ? html`<span class="row-desc">${item.description}</span>` : nothing}
                  </span>
                  ${item.shortcut ? html`<kbd class="emr-muted">${item.shortcut}</kbd>` : nothing}
                </button>
              `,
            )}
          </div>`
        : nothing}
    </div>`;
  }
}

/** 15. EmrSplitButtonElement (`emr-split-button`) */
export class EmrSplitButtonElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-split-button');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = 'Action';
  @property({ type: String }) variant: 'primary' | 'secondary' | 'outline' | 'danger' = 'primary';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ attribute: false }) items: readonly EmrMenuItem[] = [];
  @property({ type: Boolean }) open = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) loading = false;

  private setOpen(next: boolean): void {
    if ((this.disabled || this.loading) && next) return;
    this.open = next;
    this.dispatchEvent(new CustomEvent<boolean>('openChange', { detail: next, bubbles: true, composed: true }));
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const menuId = `${id}-menu`;
    const locked = this.disabled || this.loading;

    return html`<div class="menu-root">
      <div class="split-group" role="group" aria-label=${this.label}>
        <button
          id=${id}
          type="button"
          data-split-primary="true"
          class=${`emr-btn emr-btn--${this.variant} split-primary`}
          ?disabled=${locked}
          @click=${() => {
            if (locked) return;
            this.dispatchEvent(new CustomEvent('primaryClicked', { bubbles: true, composed: true }));
            this.dispatchEvent(new CustomEvent('clicked', { bubbles: true, composed: true }));
          }}
        >${this.label}</button>
        <button
          type="button"
          data-split-trigger="true"
          class=${`emr-btn emr-btn--${this.variant} split-trigger`}
          aria-label=${`More actions for ${this.label}`}
          aria-haspopup="menu"
          aria-expanded=${String(this.open && !locked)}
          aria-controls=${this.open ? menuId : nothing}
          ?disabled=${locked}
          @click=${() => this.setOpen(!this.open)}
        >${renderEmrSvgIcon(this.open ? 'chevron-up' : 'chevron-down', 14)}</button>
      </div>

      ${this.open && !locked
        ? html`<div id=${menuId} role="menu" class="menu-list" aria-label=${`${this.label} options`}>
            ${this.items.map(
              item => html`
                ${item.dividerBefore ? html`<div class="menu-divider" role="separator"></div>` : nothing}
                <button
                  type="button"
                  role="menuitem"
                  data-item-id=${item.id}
                  class=${`menu-item${item.tone === 'danger' ? ' menu-item--danger' : ''}`}
                  ?disabled=${item.disabled}
                  @click=${() => {
                    if (item.disabled) return;
                    this.setOpen(false);
                    this.dispatchEvent(new CustomEvent<string>('itemSelected', { detail: item.id, bubbles: true, composed: true }));
                    this.emitValueChange(item.id);
                  }}
                >
                  <span>${item.label}</span>
                  ${item.shortcut ? html`<kbd class="emr-muted">${item.shortcut}</kbd>` : nothing}
                </button>
              `,
            )}
          </div>`
        : nothing}
    </div>`;
  }
}

/** 16. EmrAccordionElement (`emr-accordion`) */
export class EmrAccordionElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Wave2Styles];

  private readonly fallbackId = nextL1Wave2Id('emr-accordion');

  @property({ type: String }) controlId = '';
  @property({ attribute: false }) items: readonly EmrAccordionItem[] = [];
  @property({ attribute: false }) expandedIds: readonly string[] = [];
  @property({ type: Boolean }) multiple = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;

  private toggleItem(itemId: string): void {
    if (this.readOnly || this.disabled) return;
    const next = toggleAccordionId(this.expandedIds, itemId, this.multiple);
    this.expandedIds = next;
    this.dispatchEvent(new CustomEvent<readonly string[]>('expandedIdsChange', { detail: next, bubbles: true, composed: true }));
    this.emitValueChange(next);
  }

  override render() {
    const id = this.controlId || this.fallbackId;

    return html`<div id=${id} class="accordion-list">
      ${this.items.map(item => {
        const expanded = this.expandedIds.includes(item.id);
        const btnId = `${id}-hdr-${item.id}`;
        const panelId = `${id}-pnl-${item.id}`;
        return html`<div class="accordion-item" data-accordion-id=${item.id}>
          <button
            id=${btnId}
            type="button"
            class="accordion-header-btn"
            aria-expanded=${String(expanded)}
            aria-controls=${panelId}
            ?disabled=${this.disabled || !!item.disabled}
            @click=${() => {
              if (!item.disabled) this.toggleItem(item.id);
            }}
          >
            <span class="row-copy">
              <span>${item.title}</span>
              ${item.subtitle ? html`<span class="row-desc">${item.subtitle}</span>` : nothing}
            </span>
            <span class="emr-row">
              ${item.badge ? html`<span class="emr-badge">${item.badge}</span>` : nothing}
              ${renderEmrSvgIcon(expanded ? 'chevron-up' : 'chevron-down', 16)}
            </span>
          </button>
          ${expanded
            ? html`<div id=${panelId} role="region" aria-labelledby=${btnId} class="accordion-panel">
                ${item.content ? html`<div>${item.content}</div>` : nothing}
                <slot name=${item.id}></slot>
              </div>`
            : nothing}
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

  @state() private expandedAll = false;

  private renderCrumb(item: EmrBreadcrumbItem, isLast: boolean) {
    if (isLast) {
      return html`<span class="breadcrumb-current" aria-current="page">${item.label}</span>`;
    }
    return html`<button
      type="button"
      class="breadcrumb-btn"
      data-breadcrumb-id=${item.id}
      ?disabled=${item.disabled}
      @click=${() => {
        if (item.disabled) return;
        this.dispatchEvent(new CustomEvent<EmrBreadcrumbItem>('itemClicked', { detail: item, bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent<EmrBreadcrumbItem>('navigated', { detail: item, bubbles: true, composed: true }));
      }}
    >${item.label}</button>`;
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const collapsed = collapseBreadcrumbs(this.items, this.expandedAll ? undefined : this.maxItems);
    const hasHidden = collapsed.hidden.length > 0;

    return html`<nav id=${id} aria-label=${this.ariaLabel || 'Breadcrumb'}>
      <ol class="breadcrumb-list">
        ${collapsed.leading.map(
          (item, idx) => html`<li class="breadcrumb-item">
            ${this.renderCrumb(item, !hasHidden && collapsed.trailing.length === 0 && idx === collapsed.leading.length - 1)}
            ${hasHidden || collapsed.trailing.length > 0 || idx < collapsed.leading.length - 1
              ? html`<span class="emr-muted" aria-hidden="true">${this.separator}</span>`
              : nothing}
          </li>`,
        )}
        ${hasHidden
          ? html`<li class="breadcrumb-item">
              <button
                type="button"
                class="breadcrumb-btn"
                data-expand-breadcrumbs="true"
                aria-label="Show hidden breadcrumbs"
                @click=${() => {
                  this.expandedAll = true;
                }}
              >…</button>
              <span class="emr-muted" aria-hidden="true">${this.separator}</span>
            </li>`
          : nothing}
        ${collapsed.trailing.map(
          (item, idx) => html`<li class="breadcrumb-item">
            ${this.renderCrumb(item, idx === collapsed.trailing.length - 1)}
            ${idx < collapsed.trailing.length - 1
              ? html`<span class="emr-muted" aria-hidden="true">${this.separator}</span>`
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

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = null;
  @property({ attribute: false }) swatches: readonly EmrColorSwatch[] = DEFAULT_CLINICAL_COLOR_SWATCHES;
  @property({ type: Boolean }) allowCustomHex = true;
  @property({ type: Boolean }) clearable = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;

    const picker = html`<div class="emr-field">
      <div
        id=${id}
        role="radiogroup"
        class="swatch-grid"
        aria-label=${this.label || 'Color swatches'}
        aria-readonly=${this.readOnly ? 'true' : nothing}
      >
        ${this.swatches.map(swatch => {
          const selected = (this.value ?? '').toLowerCase() === swatch.value.toLowerCase();
          return html`<button
            type="button"
            role="radio"
            class="swatch-btn"
            data-swatch-value=${swatch.value}
            style=${`--swatch-color: ${swatch.value};`}
            aria-label=${swatch.label}
            aria-checked=${String(selected)}
            ?disabled=${this.disabled}
            @click=${() => {
              if (!this.locked) this.emitValueChange(swatch.value);
            }}
          >${selected ? renderEmrSvgIcon('check', 14) : nothing}</button>`;
        })}
      </div>
      ${this.allowCustomHex || this.clearable
        ? html`<div class="trigger-bar">
            ${this.allowCustomHex
              ? html`<input
                  type="text"
                  class="emr-control"
                  aria-label=${`${this.label || 'Color'} hex code`}
                  .value=${live(this.value ?? '')}
                  ?readonly=${this.readOnly}
                  ?disabled=${this.disabled}
                  @change=${(e: Event) => {
                    const input = e.target as HTMLInputElement;
                    if (this.locked) {
                      input.value = this.value ?? '';
                      return;
                    }
                    const candidate = input.value.trim();
                    if (HEX_COLOR_RE.test(candidate)) {
                      this.emitValueChange(candidate);
                    } else {
                      input.value = this.value ?? '';
                    }
                  }}
                />`
              : nothing}
            ${this.clearable && this.value && !this.locked
              ? html`<button
                  type="button"
                  class="clear-btn"
                  data-clear-btn="true"
                  aria-label=${`Clear ${this.label || 'color'}`}
                  @click=${() => {
                    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
                    this.emitValueChange(null);
                  }}
                >${renderEmrSvgIcon('close', 14)}</button>`
              : nothing}
          </div>`
        : nothing}
    </div>`;

    if (this.labelHidden) return picker;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<span class="emr-label">${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</span>`
        : nothing}
      ${picker}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.hint
          ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
          : nothing}
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
  @property({ type: String }) variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'ghost';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'sm';
  @property({ type: Number }) feedbackDurationMs = 2000;
  @property({ type: Boolean }) disabled = false;

  @state() private copied = false;

  override disconnectedCallback(): void {
    if (this.copyTimer) clearTimeout(this.copyTimer);
    super.disconnectedCallback();
  }

  private handleCopy(): void {
    if (this.disabled) return;
    try {
      void navigator?.clipboard?.writeText?.(this.value);
    } catch {
      // Clipboard API unavailable in non-secure / test environments
    }
    this.copied = true;
    this.dispatchEvent(new CustomEvent<string>('copied', { detail: this.value, bubbles: true, composed: true }));
    if (this.copyTimer) clearTimeout(this.copyTimer);
    if (this.feedbackDurationMs > 0) {
      this.copyTimer = setTimeout(() => {
        this.copied = false;
      }, this.feedbackDurationMs);
    }
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const text = this.copied ? this.copiedLabel : this.label;

    return html`<button
      id=${id}
      type="button"
      class=${`emr-btn emr-btn--${this.variant} emr-btn--${this.size}`}
      aria-label=${text}
      data-copied=${String(this.copied)}
      ?disabled=${this.disabled}
      @click=${() => this.handleCopy()}
    >
      ${renderEmrSvgIcon(this.copied ? 'check' : 'copy', 14)}
      <span>${text}</span>
    </button>`;
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
