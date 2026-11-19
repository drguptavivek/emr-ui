import { html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import {
  EMR_VAS_TRACK_INSET_PX,
  buildEmrSelectTriggerSummary,
  buildLikertPoints,
  canActivateEmrCard,
  canActivateEmrStatTile,
  canActivateTab,
  canClearRadioGroupValue,
  canMutateEmrChip,
  canMutateEmrToggle,
  canMutateLikert,
  canMutateVas,
  canSelectEmrStage,
  canSelectEmrStatusCell,
  canTriggerEmrStatusCellAction,
  clearEmrSelectValue,
  filterOptionsLocally,
  findNextEnabledEmrSelectOptionIndex,
  findNextEnabledSearchOptionIndex,
  findTypeaheadEmrSelectOptionIndex,
  formatCreatableLabel,
  formatEmrBadgeCount,
  formatEmrStatusCellAttribution,
  formatIsoDateDisplay,
  formatTimeDisplay,
  formatVasValue,
  getNextStageStepperIndex,
  getNextTabIndex,
  groupOptions,
  hasSearchSelectClearableValue,
  isDateTimeOutOfBounds,
  isEmrSelectClearable,
  isEmrSelectOptionBlockedByMax,
  isRadioOptionLocked,
  isSearchOptionSelected,
  isTimeOutOfBounds,
  joinDateTimeParts,
  localDateTimeToUtcIso,
  moveRadioGroupFocusIndex,
  normalizeEmrBadgeShape,
  normalizeEmrBadgeSize,
  normalizeEmrBadgeTone,
  normalizeEmrBadgeVariant,
  normalizeEmrCardPadding,
  normalizeEmrCardTone,
  normalizeEmrCardVariant,
  normalizeEmrChipSize,
  normalizeEmrChipTone,
  normalizeEmrChipVariant,
  normalizeEmrColumnsAlign,
  normalizeEmrColumnsCollapseBelow,
  normalizeEmrSelectMultiValue,
  normalizeEmrSelectSingleValue,
  normalizeEmrToggleLabelPlacement,
  normalizeEmrToggleSize,
  normalizeEmrToggleVariant,
  normalizeEmrColumnsCount,
  normalizeEmrColumnsGap,
  normalizeEmrFieldValueRowSize,
  normalizeRadioGroupVariant,
  resolveRadioGroupTabStopValue,
  normalizeEmrFieldValueRowTone,
  normalizeEmrSeparatorLabelAlign,
  normalizeEmrSeparatorOrientation,
  normalizeEmrSeparatorVariant,
  normalizeEmrStateMessageKind,
  normalizeEmrStateMessageSize,
  normalizeEmrStageStepperOrientation,
  normalizeEmrStageStepperSize,
  normalizeEmrStatTileSize,
  normalizeEmrStatTileTone,
  normalizeEmrStatusCellSize,
  parseDateDisplayText,
  parseQuantityDraft,
  parseTimeText,
  rankAndFilterOptions,
  resolveActiveTabValue,
  resolveCustomSearchCandidate,
  resolveDefaultActiveOptionIndex,
  resolveEmrCardLabel,
  resolveEmrChipRemoveLabel,
  resolveEmrColumnsCssTemplate,
  resolveEmrFieldValueRowValue,
  resolveEmrSelectCloseOnSelect,
  resolveEmrStatTileAriaLabel,
  resolveEmrStateMessageRole,
  resolveEmrStateMessageTitle,
  resolveEmrStatusCellHiddenText,
  resolveEmrToggleAriaChecked,
  resolveEmrToggleChecked,
  resolveEmrToggleNext,
  resolveEmrToggleValidationState,
  resolveStageStepperTabStopId,
  canActivateEmrFieldValueRow,
  removeEmrSelectChip,
  resolveLikertTabStopIndex,
  resolveNextLikertValue,
  resolveQuantityStep,
  resolveSearchSelectDisplayValue,
  resolveSearchSelectValues,
  resolveTabStopIndex,
  resolveTimePlaceholder,
  resolveVasAnchors,
  resolveVasKeyValue,
  resolveVasStep,
  resolveVasTicks,
  sanitizeDateDisplayText,
  sanitizeQuantityText,
  sanitizeTimeText,
  splitDateTimeParts,
  splitMatchHighlightSegments,
  snapVasValue,
  stepQuantityValue,
  toLocalDateTimeInputValue,
  toggleEmrSelectOption,
  vasPercent,
  vasValueFromOffset,
  type EmrBadge,
  type EmrBadgeShape,
  type EmrBadgeSize,
  type EmrBadgeVariant,
  type EmrCardPadding,
  type EmrCardVariant,
  type EmrColumnsAlign,
  type EmrColumnsTrackWidth,
  type EmrControlVariant,
  type EmrDateTimeDisplayFormat,
  type EmrDateTimeHourCycle,
  type EmrDateTimePrecision,
  type EmrDateTimeSize,
  type EmrDateTimeWireFormat,
  type EmrLikertAnchor,
  type EmrMatchHighlightSegment,
  type EmrScoredOption,
  type EmrSearchSelectFilterMode,
  type EmrSearchSelectSize,
  type EmrSelectSize,
  type EmrSelectValue,
  type EmrSelectVariant,
  type EmrSeparatorLabelAlign,
  type EmrSeparatorOrientation,
  type EmrSeparatorVariant,
  type EmrStateMessageKind,
  type EmrStateMessageSize,
  type EmrTimeHourCycle,
  type EmrTimePrecision,
  type EmrTimeSize,
  type EmrVasAnchorsProp,
  type EmrVasOrientation,
  type EmrVasSize,
  type EmrLikertSize,
  type EmrOption,
  type EmrOptionGroup,
  type EmrRadioGroupLabelPlacement,
  type EmrRadioGroupOrientation,
  type EmrRadioGroupSize,
  type EmrRadioGroupVariant,
  type EmrQuantityNumericMode,
  type EmrQuantitySize,
  type EmrStage,
  type EmrStatTileModel,
  type EmrTabOption,
  type EmrTabsActivationMode,
  type EmrTabsIconPosition,
  type EmrTabsOrientation,
  type EmrTabsSize,
  type EmrTabsVariant,
  type EmrToastIntent,
  type EmrToastModel,
  type EmrTone,
} from '@drguptavivek/emr-controller';
import {
  buildLitCalendarMonthGrid,
  buildLitYearPage,
  computeFixedPopoverStyle,
  formatLitDate,
  LIT_CALENDAR_MONTH_NAMES,
  LIT_CALENDAR_MONTH_SHORT,
  LIT_CALENDAR_WEEKDAYS,
  parseLitDateText,
  parseLitIsoParts,
  resolveLitDateFormat,
  sanitizeLitDateText,
  stepLitCalendarMonth,
  todayLitCalendarParts,
  type LitDateDisplayFormat,
  type LitDatePrecision,
} from './calendar.logic.js';
import { EmrLitElement, defineEmrElement, emrShadowStyles } from './foundations.js';
import { renderEmrSvgIcon } from './icons.js';
import { registerL1ExtraElements } from './l1-primitives-extra.js';
import { registerL1Wave2Elements } from './l1-primitives-wave2.js';

export * from './l1-primitives-extra.js';
export * from './l1-primitives-wave2.js';

let l1IdSeq = 0;
const nextL1Id = (prefix: string): string => `${prefix}-${++l1IdSeq}`;

export interface EmrScaleAnchorItem {
  readonly value: number;
  readonly label: string;
  readonly assistiveLabel?: string;
}

export type EmrScaleAnchorsProp =
  | {
      readonly minLabel?: string;
      readonly midLabel?: string;
      readonly maxLabel?: string;
    }
  | readonly EmrScaleAnchorItem[];

const l1Styles = css`
  .number-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: 100%;
  }
  .stepper-wrap {
    display: inline-flex;
    align-items: center;
    width: 216px;
    max-width: 100%;
    height: var(--emr-control-height);
    min-height: 44px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    overflow: hidden;
  }
  .stepper-wrap--invalid {
    border-color: var(--emr-danger);
  }
  .stepper-wrap--readonly {
    background: var(--emr-surface-soft);
  }
  .stepper-btn {
    width: 44px;
    min-width: 44px;
    min-height: 44px;
    height: 100%;
    border: 0;
    background: var(--emr-surface-soft);
    color: var(--emr-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
  }
  .stepper-btn:hover:not(:disabled) {
    background: var(--emr-primary-hover);
  }
  .stepper-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .stepper-input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: 0;
    background: transparent;
    color: var(--emr-text);
    text-align: center;
    font: inherit;
    font-size: var(--emr-text-md);
    font-variant-numeric: tabular-nums;
  }
  .date-anchor {
    position: relative;
    display: inline-block;
    max-width: 100%;
  }
  .date-wrap {
    display: inline-flex;
    align-items: stretch;
    width: 224px;
    max-width: 100%;
    min-height: var(--emr-control-height);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    overflow: hidden;
    box-sizing: border-box;
  }
  .date-wrap--open {
    border-color: var(--emr-primary);
  }
  .date-wrap--invalid {
    border-color: var(--emr-danger);
  }
  .date-wrap--readonly {
    background: var(--emr-surface-soft);
  }
  .date-text-input {
    flex: 1;
    min-width: 96px;
    border: 0;
    padding: 0 10px;
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    font-variant-numeric: tabular-nums;
    outline: none;
  }
  .date-icon-box {
    width: 44px;
    min-width: 44px;
    border-left: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    color: var(--emr-text-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .date-icon-btn {
    width: 44px;
    min-width: 44px;
    min-height: 44px;
    border: 0;
    border-left: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    color: var(--emr-text-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
  }
  .date-icon-btn:hover:not(:disabled) {
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }
  .date-icon-btn--open {
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }
  .date-icon-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .stepper-btn:focus-visible,
  .stepper-input:focus-visible,
  .date-icon-btn:focus-visible,
  .select-trigger:focus-visible,
  .select-option:focus-visible,
  .cal-nav-btn:focus-visible,
  .cal-title-btn:focus-visible,
  .cal-day:focus-visible,
  .cal-tile-btn:focus-visible,
  .cal-footer-btn:focus-visible,
  .option-tile:focus-visible,
  .vas-slider:focus-visible,
  .chip-remove-btn:focus-visible,
  .stage-btn:focus-visible,
  .status-cell-body--interactive:focus-visible {
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }
  .cal-popover {
    z-index: 9999;
    margin: 0;
    inset: auto;
    padding: 0;
    background: var(--emr-surface);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius-lg);
    box-shadow: var(--emr-shadow);
    overflow: hidden;
    box-sizing: border-box;
    color: var(--emr-text);
  }
  .cal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--emr-border);
  }
  .cal-nav-btn {
    width: 44px;
    min-width: 44px;
    height: 44px;
    border-radius: var(--emr-radius);
    border: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    color: var(--emr-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
  }
  .cal-nav-btn:hover {
    background: var(--emr-primary-soft);
  }
  .cal-title-btn {
    flex: 1;
    min-height: 44px;
    border: 0;
    border-radius: var(--emr-radius);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    font-weight: var(--emr-weight-bold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    padding: 0 10px;
  }
  .cal-title-btn:hover:not(:disabled) {
    background: var(--emr-surface-soft);
  }
  .cal-title-btn:disabled {
    cursor: default;
  }
  .cal-body {
    padding: 6px 8px;
  }
  .cal-weekdays,
  .cal-row {
    display: grid;
    grid-template-columns: repeat(7, 44px);
    justify-content: space-between;
  }
  .cal-weekdays {
    margin-bottom: 2px;
  }
  .cal-weekday {
    width: 44px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
  }
  .cal-grid {
    display: grid;
    row-gap: 2px;
  }
  .cal-day {
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--emr-radius);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    font-variant-numeric: tabular-nums;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    box-sizing: border-box;
  }
  .cal-day:hover:not(:disabled) {
    background: var(--emr-primary-soft);
  }
  .cal-day:disabled {
    opacity: 0.32;
    cursor: not-allowed;
  }
  .cal-day--outside {
    opacity: 0.45;
  }
  .cal-day--today {
    border: 1.5px solid var(--emr-primary);
    color: var(--emr-primary-contrast);
    font-weight: var(--emr-weight-bold);
  }
  .cal-day--selected,
  .cal-day--selected:hover:not(:disabled) {
    background: var(--emr-primary);
    border: 1.5px solid var(--emr-primary);
    color: var(--emr-on-primary);
    font-weight: var(--emr-weight-bold);
    opacity: 1;
  }
  .cal-tile-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    padding: 10px;
  }
  .cal-tile-btn {
    min-height: 44px;
    border-radius: var(--emr-radius);
    border: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    cursor: pointer;
    padding: 0 6px;
  }
  .cal-tile-btn:hover:not(:disabled) {
    background: var(--emr-primary-soft);
  }
  .cal-tile-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .cal-tile-btn--current {
    border-color: var(--emr-primary);
    font-weight: var(--emr-weight-bold);
  }
  .cal-tile-btn--selected,
  .cal-tile-btn--selected:hover:not(:disabled) {
    background: var(--emr-primary);
    border-color: var(--emr-primary);
    color: var(--emr-on-primary);
    font-weight: var(--emr-weight-bold);
  }
  .cal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    border-top: 1px solid var(--emr-border);
  }
  .cal-footer-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0 14px;
    border-radius: var(--emr-radius);
    border: 1px solid var(--emr-border);
    background: transparent;
    color: var(--emr-text-muted);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
    cursor: pointer;
  }
  .cal-footer-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .cal-footer-btn--today {
    background: var(--emr-primary-soft);
    border-color: var(--emr-primary);
    color: var(--emr-primary-contrast);
    font-weight: var(--emr-weight-bold);
  }
  .cal-footer-btn:hover:not(:disabled) {
    background: var(--emr-primary-hover);
  }
  .select-root {
    position: relative;
    width: 100%;
  }
  .select-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    min-height: var(--emr-control-height);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    overflow: hidden;
    box-sizing: border-box;
  }
  .select-bar--lg {
    --emr-control-height: 48px;
  }
  .select-bar--tabular .select-trigger-text,
  .select-menu--tabular .select-option-row {
    font-variant-numeric: tabular-nums;
  }
  .select-bar--filled {
    background: var(--emr-surface-soft);
    border-color: transparent;
  }
  .select-bar--subtle {
    background: transparent;
    border-color: transparent;
  }
  .select-bar--open {
    border-color: var(--emr-primary);
  }
  .select-bar--invalid {
    border-color: var(--emr-danger);
  }
  .select-bar--warning:not(.select-bar--invalid) {
    border-color: var(--emr-warning);
  }
  .select-bar--readonly {
    background: var(--emr-surface-soft);
    border-style: dashed;
  }
  .select-bar--disabled {
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
  .select-chip[data-tone="info"] { background: color-mix(in srgb, var(--emr-info) 12%, transparent); border-color: var(--emr-info); color: var(--emr-info); }
  .select-chip[data-tone="success"] { background: color-mix(in srgb, var(--emr-success) 12%, transparent); border-color: var(--emr-success); color: var(--emr-success); }
  .select-chip[data-tone="warning"] { background: color-mix(in srgb, var(--emr-warning) 14%, transparent); border-color: var(--emr-warning); color: var(--emr-warning); }
  .select-chip[data-tone="danger"] { background: color-mix(in srgb, var(--emr-danger) 12%, transparent); border-color: var(--emr-danger); color: var(--emr-danger); }
  .select-chip[data-readonly="true"] { border-style: dashed; }
  .select-chip--overflow { color: var(--emr-text-muted); }
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
  .select-trigger {
    flex: 1 1 80px;
    min-width: 0;
    min-height: calc(var(--emr-control-height) - 2px);
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
    box-sizing: border-box;
  }
  .select-trigger--sm {
    font-size: var(--emr-text-sm);
    padding: 0 10px;
  }
  .select-trigger--readonly {
    cursor: default;
  }
  .select-trigger:disabled {
    cursor: default;
  }
  .select-trigger-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .select-trigger-text--placeholder {
    color: var(--emr-text-muted);
  }
  .select-chevron {
    color: var(--emr-text-muted);
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }
  .select-menu {
    z-index: 9999;
    margin: 0;
    inset: auto;
    max-height: 280px;
    overflow-y: auto;
    padding: 4px;
    background: var(--emr-surface);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    box-shadow: var(--emr-shadow);
    box-sizing: border-box;
  }
  .select-group { display: grid; gap: 2px; }
  .select-group + .select-group { margin-top: 4px; padding-top: 4px; border-top: 1px solid var(--emr-border); }
  .select-group-header {
    padding: 6px 10px 4px;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    color: var(--emr-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .select-option {
    width: 100%;
    min-height: var(--emr-control-height);
    padding: 6px 12px;
    border: 0;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    font-weight: var(--emr-weight-medium);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    text-align: left;
    box-sizing: border-box;
  }
  .select-option:hover:not(:disabled),
  .select-option--active:not(:disabled) {
    background: var(--emr-surface-soft);
  }
  .select-option[aria-selected="true"] {
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
    font-weight: var(--emr-weight-bold);
  }
  .select-option--readonly {
    opacity: 0.85;
    cursor: default;
    border: 1px dashed var(--emr-border);
  }
  .emr-warning {
    color: var(--emr-warning);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
  }
  .select-option-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
  }
  .select-option-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: var(--emr-text-2xs);
    font-weight: var(--emr-weight-bold);
    border: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    color: var(--emr-text-muted);
    flex-shrink: 0;
  }
  .select-option-badge[data-tone="info"] { background: color-mix(in srgb, var(--emr-info) 12%, transparent); border-color: var(--emr-info); color: var(--emr-info); }
  .select-option-badge[data-tone="success"] { background: color-mix(in srgb, var(--emr-success) 12%, transparent); border-color: var(--emr-success); color: var(--emr-success); }
  .select-option-badge[data-tone="warning"] { background: color-mix(in srgb, var(--emr-warning) 14%, transparent); border-color: var(--emr-warning); color: var(--emr-warning); }
  .select-option-badge[data-tone="danger"] { background: color-mix(in srgb, var(--emr-danger) 12%, transparent); border-color: var(--emr-danger); color: var(--emr-danger); }
  .select-state {
    min-height: var(--emr-control-height);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    color: var(--emr-text-muted);
    font-size: var(--emr-text-sm);
  }
  @keyframes select-spin { to { transform: rotate(360deg); } }
  .select-spinner { animation: select-spin 0.8s linear infinite; }
  .select-option--placeholder {
    color: var(--emr-text-muted);
  }
  .select-option:disabled {
    opacity: 0.55;
    cursor: default;
  }
  .select-tick {
    width: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--emr-primary);
    flex-shrink: 0;
  }
  .option-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, auto-fit), minmax(140px, 1fr));
    gap: 8px;
  }
  .option-grid--pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .option-grid--pills .option-tile--pill {
    width: fit-content;
  }
  @media (max-width: 560px) {
    .option-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .radio-segmented {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: stretch;
    gap: 4px;
    padding: 4px;
    border: 1px solid var(--emr-border);
    border-radius: 10px;
    background: var(--emr-surface-soft);
    max-width: 100%;
    box-sizing: border-box;
  }
  .radio-segmented[data-orientation="vertical"] {
    flex-direction: column;
    width: 100%;
  }
  .radio-segmented[data-orientation="grid"] {
    display: grid;
    grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr));
    width: 100%;
  }
  @media (max-width: 480px) {
    .radio-segmented[data-orientation="grid"] {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .radio-segmented[aria-invalid="true"] {
    border-color: var(--emr-danger);
  }
  .radio-segmented[data-warning="true"]:not([aria-invalid="true"]) {
    border-color: var(--emr-warning);
  }
  .radio-segment {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    min-width: 44px;
    padding: 6px 14px;
    border: 1px solid transparent;
    border-radius: 7px;
    background: transparent;
    color: var(--emr-text-muted);
    font: inherit;
    font-size: var(--emr-text-md);
    font-weight: var(--emr-weight-medium);
    cursor: pointer;
    flex: 1 1 auto;
    box-sizing: border-box;
    transition: background-color 140ms ease, color 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
  }
  .radio-segment.option-tile--sm {
    font-size: var(--emr-text-sm);
    padding: 4px 10px;
    gap: 6px;
  }
  .radio-segment[aria-checked="true"] {
    background: var(--emr-surface);
    color: var(--emr-text);
    font-weight: var(--emr-weight-bold);
    border-color: var(--emr-border);
    box-shadow: var(--emr-shadow);
  }
  .radio-segment[data-tone="info"][aria-checked="true"] {
    border-color: var(--emr-info);
    background: var(--emr-info-soft);
    color: var(--emr-info);
  }
  .radio-segment[data-tone="success"][aria-checked="true"] {
    border-color: var(--emr-success);
    background: var(--emr-success-soft);
    color: var(--emr-success);
  }
  .radio-segment[data-tone="warning"][aria-checked="true"] {
    border-color: var(--emr-warning);
    background: var(--emr-warning-soft);
    color: var(--emr-warning);
  }
  .radio-segment[data-tone="danger"][aria-checked="true"] {
    border-color: var(--emr-danger);
    background: var(--emr-danger-soft);
    color: var(--emr-danger);
  }
  .radio-segment[data-warning="true"]:not([aria-invalid="true"]) {
    border-color: var(--emr-warning);
  }
  .radio-segment[aria-invalid="true"] {
    border-color: var(--emr-danger);
  }
  .radio-segment:hover:not(:disabled):not(.option-tile--readonly):not([aria-checked="true"]) {
    color: var(--emr-text);
    background: color-mix(in srgb, var(--emr-surface) 55%, transparent);
  }
  .radio-segment.option-tile--readonly:not([aria-checked="true"]) {
    border-style: dashed;
    border-color: var(--emr-border);
    cursor: default;
  }
  .radio-segment:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .radio-segment:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: 2px;
  }
  .option-tile {
    width: 100%;
    min-height: var(--emr-control-height);
    min-width: 44px;
    padding: 0 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font: inherit;
    font-size: var(--emr-text-md);
    font-weight: var(--emr-weight-regular);
    line-height: 20px;
    -webkit-font-smoothing: antialiased;
    text-align: left;
    box-sizing: border-box;
  }
  .option-tile--checkbox {
    padding: 10px 12px;
    align-items: flex-start;
  }
  .option-tile--readonly:not(.option-tile--inline) {
    background: var(--emr-surface-soft);
    border-style: dashed;
    cursor: default;
  }
  .option-tile--readonly {
    cursor: default;
  }
  .option-tile:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .option-tile:not(.option-tile--inline)[aria-checked="true"],
  .option-tile:not(.option-tile--inline)[aria-checked="mixed"],
  .option-tile:not(.option-tile--inline)[aria-pressed="true"],
  .option-tile:not(.option-tile--inline)[aria-selected="true"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
  }
  .option-tile:not(.option-tile--inline)[data-tone="info"][aria-checked="true"],
  .option-tile:not(.option-tile--inline)[data-tone="info"][aria-pressed="true"] {
    border-color: var(--emr-info);
    background: var(--emr-info-soft);
    color: var(--emr-info);
  }
  .option-tile:not(.option-tile--inline)[data-tone="success"][aria-checked="true"],
  .option-tile:not(.option-tile--inline)[data-tone="success"][aria-pressed="true"] {
    border-color: var(--emr-success);
    background: var(--emr-success-soft);
    color: var(--emr-success);
  }
  .option-tile:not(.option-tile--inline)[data-tone="warning"][aria-checked="true"],
  .option-tile:not(.option-tile--inline)[data-tone="warning"][aria-pressed="true"] {
    border-color: var(--emr-warning);
    background: var(--emr-warning-soft);
    color: var(--emr-warning);
  }
  .option-tile:not(.option-tile--inline)[data-tone="danger"][aria-checked="true"],
  .option-tile:not(.option-tile--inline)[data-tone="danger"][aria-pressed="true"] {
    border-color: var(--emr-danger);
    background: var(--emr-danger-soft);
    color: var(--emr-danger);
  }
  .indicator {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    border: 1.5px solid var(--emr-border);
    border-radius: 4px;
    background: var(--emr-surface);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    font-weight: var(--emr-weight-bold);
    line-height: 1;
  }
  .indicator--radio {
    width: 20px;
    height: 20px;
    border-radius: 999px;
  }
  .option-tile--sm .indicator--radio {
    width: 16px;
    height: 16px;
  }
  .radio-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: var(--emr-primary);
    display: block;
  }
  .option-tile--sm .radio-dot {
    width: 8px;
    height: 8px;
  }
  .option-tile[aria-checked="true"] .indicator.indicator--radio {
    border-color: var(--emr-primary);
    background: var(--emr-surface);
  }
  .option-tile:not(.option-tile--inline)[data-warning="true"] {
    border-color: var(--emr-warning);
  }
  .option-tile[data-warning="true"]:not([aria-invalid="true"]):not([aria-checked="true"]):not([aria-checked="mixed"]) .indicator {
    border-color: var(--emr-warning);
  }
  .option-tile[aria-checked="true"] .indicator,
  .option-tile[aria-checked="mixed"] .indicator,
  .option-tile[aria-pressed="true"] .indicator {
    border-color: var(--emr-primary);
    background: var(--emr-primary);
    color: var(--emr-surface);
  }
  .option-tile.option-tile--inline,
  .option-tile.option-tile--inline[aria-checked="true"],
  .option-tile.option-tile--inline[aria-checked="mixed"] {
    width: fit-content;
    max-width: 100%;
    justify-self: start;
    border-color: transparent;
    background: transparent;
    color: var(--emr-text);
    padding: 10px 2px;
  }
  .option-tile.option-tile--inline.option-tile--placement-between {
    width: 100%;
  }
  .option-tile--sm {
    font-size: var(--emr-text-sm);
    padding: 8px 10px;
    gap: 8px;
  }
  .option-tile--inline.option-tile--sm {
    padding: 8px 2px;
  }
  .option-tile--sm .indicator {
    width: 16px;
    height: 16px;
  }
  .option-tile:not(.option-tile--inline)[data-warning="true"]:not([aria-invalid="true"]) {
    border-color: var(--emr-warning);
  }
  .option-tile:not(.option-tile--inline)[aria-invalid="true"] {
    border-color: var(--emr-danger);
  }
  .option-tile[aria-invalid="true"] .indicator {
    border-color: var(--emr-danger);
  }
  .option-tile[data-label-hidden="true"] {
    width: fit-content;
    min-width: var(--emr-control-height, 44px);
    min-height: var(--emr-control-height, 44px);
    justify-content: center;
    align-items: center;
  }
  .option-tile[data-loading="true"] {
    cursor: progress;
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
    transition: background-color 140ms ease, border-color 140ms ease;
  }
  .option-tile[aria-checked="true"] .switch-track {
    background: var(--emr-primary);
  }
  .switch-thumb {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--emr-surface);
    color: var(--emr-primary);
    box-shadow: var(--emr-shadow);
    transform: translateX(0);
    transition: transform 140ms ease;
  }
  .option-tile[aria-checked="true"] .switch-thumb {
    transform: translateX(18px);
  }
  .option-tile--sm .switch-track {
    width: 38px;
    height: 22px;
  }
  .option-tile--sm .switch-thumb {
    width: 16px;
    height: 16px;
  }
  .option-tile--sm[aria-checked="true"] .switch-thumb {
    transform: translateX(16px);
  }
  .switch-spinner {
    width: 12px;
    height: 12px;
    display: block;
    animation: emr-switch-spin 0.8s linear infinite;
  }
  .option-tile--sm .switch-spinner {
    width: 10px;
    height: 10px;
  }
  @keyframes emr-switch-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .option-tile[data-warning="true"]:not([aria-invalid="true"]) .switch-track {
    border-color: var(--emr-warning);
  }
  .option-tile[aria-invalid="true"] .switch-track {
    border-color: var(--emr-danger);
  }
  @media (hover: hover) {
    .option-tile:not(.option-tile--inline):hover:not(:disabled):not(.option-tile--readonly):not([data-loading="true"]):not([aria-checked="true"]):not([aria-checked="mixed"]):not([aria-pressed="true"]):not([aria-selected="true"]) {
      background: var(--emr-surface-soft);
      border-color: var(--emr-focus);
    }
    .option-tile:hover:not(:disabled):not(.option-tile--readonly):not([data-loading="true"]):not([aria-checked="true"]):not([aria-checked="mixed"]) .indicator {
      border-color: var(--emr-primary);
    }
    .option-tile:hover:not(:disabled):not(.option-tile--readonly):not([data-loading="true"]):not([aria-checked="true"]) .switch-track {
      border-color: var(--emr-primary);
    }
  }
  .option-tile:active:not(:disabled):not(.option-tile--readonly):not([data-loading="true"]) .indicator {
    transform: scale(0.95);
  }
  .option-tile:active:not(:disabled):not(.option-tile--readonly):not([data-loading="true"]) .switch-thumb {
    transform: scale(0.95);
  }
  .option-tile[aria-checked="true"]:active:not(:disabled):not(.option-tile--readonly):not([data-loading="true"]) .switch-thumb {
    transform: translateX(18px) scale(0.95);
  }
  .option-tile--sm[aria-checked="true"]:active:not(:disabled):not(.option-tile--readonly):not([data-loading="true"]) .switch-thumb {
    transform: translateX(16px) scale(0.95);
  }
  @media (prefers-reduced-motion: reduce) {
    .option-tile, .switch-track, .switch-thumb { transition: none; }
    .switch-spinner { animation: none; }
  }
  .option-tile--placement-start {
    flex-direction: row-reverse;
    justify-content: flex-end;
  }
  .option-tile--placement-between {
    flex-direction: row-reverse;
    justify-content: space-between;
  }
  .option-tile--card {
    padding: 10px 14px;
    align-items: flex-start;
  }
  .option-tile--pill {
    border-radius: 999px;
    width: auto;
  }
  .option-tile-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
    overflow-wrap: anywhere;
  }
  .option-tile--inline:not(.option-tile--placement-between) .option-tile-copy {
    flex: 0 1 auto;
  }
  .option-tile-desc {
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-regular);
  }
  .select-bar {
    display: flex;
    align-items: stretch;
    gap: 6px;
    width: 100%;
  }
  .select-group-header {
    padding: 6px 10px 4px;
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .select-optgroup {
    display: block;
    margin: 0;
    padding: 0;
    border: 0;
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
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }
  .toggle-state-label {
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-semibold);
  }
  .emr-tabs {
    display: flex;
    gap: 4px;
    overflow-x: auto;
    scrollbar-width: none;
    border-bottom: 1px solid var(--emr-border);
    padding-block: 3px;
  }
  .emr-tabs::-webkit-scrollbar {
    display: none;
  }
  .emr-tabs--vertical {
    flex-direction: column;
    border-bottom: 0;
    border-inline-start: 2px solid var(--emr-border);
    overflow-x: visible;
    gap: 2px;
  }
  .emr-tabs--pill {
    display: inline-flex;
    max-width: 100%;
    background: var(--emr-surface-soft);
    border: 1px solid var(--emr-border);
    border-radius: 10px;
    padding: 4px;
    gap: 4px;
  }
  .emr-tabs--soft {
    border-bottom: 0;
    gap: 6px;
  }
  .emr-tabs--fitted {
    width: 100%;
  }
  .emr-tabs--fitted > .emr-tab {
    flex: 1 1 0;
    justify-content: center;
  }
  .emr-tab {
    height: var(--emr-control-height);
    min-height: var(--emr-control-height);
    border: 0;
    border-bottom: 3px solid transparent;
    padding: 8px 14px;
    background: transparent;
    color: var(--emr-text-muted);
    font: inherit;
    font-size: var(--emr-text-md);
    line-height: 1;
    font-weight: var(--emr-weight-medium);
    cursor: pointer;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    transition: color 140ms ease, background-color 140ms ease, border-color 140ms ease;
  }
  .emr-tab:hover:not(:disabled):not([aria-selected="true"]) {
    color: var(--emr-text);
    background: var(--emr-surface-soft);
  }
  .emr-tab:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: -3px;
  }
  .emr-tab:disabled {
    opacity: 0.48;
    cursor: not-allowed;
  }
  .emr-tab[aria-selected="true"] {
    color: var(--emr-primary);
    border-bottom-color: var(--emr-primary);
    font-weight: var(--emr-weight-semibold);
  }
  .emr-tabs--readonly .emr-tab[aria-selected="true"] {
    border-bottom-style: dashed;
  }
  .emr-tabs--sm .emr-tab {
    font-size: var(--emr-text-sm);
    padding: 8px 12px;
  }
  .emr-tabs--lg .emr-tab {
    min-height: 48px;
    height: 48px;
    font-size: var(--emr-text-lg);
    padding: 10px 18px;
  }
  .emr-tabs--vertical .emr-tab {
    border-bottom: 0;
    border-inline-start: 3px solid transparent;
    justify-content: flex-start;
  }
  .emr-tabs--vertical .emr-tab[aria-selected="true"] {
    border-inline-start-color: var(--emr-primary);
  }
  .emr-tabs--pill .emr-tab {
    border-bottom: 0;
    border-radius: 7px;
    padding: 6px 12px;
  }
  .emr-tabs--pill .emr-tab[aria-selected="true"] {
    background: var(--emr-surface);
    color: var(--emr-primary);
    box-shadow: 0 1px 2px color-mix(in srgb, var(--emr-text) 8%, transparent);
  }
  .emr-tabs--soft .emr-tab {
    border-bottom: 0;
    border-radius: 8px;
  }
  .emr-tabs--soft .emr-tab[aria-selected="true"] {
    background: var(--emr-surface-accent);
    color: var(--emr-primary);
  }
  .emr-tab__badge {
    font-size: var(--emr-text-2xs);
    font-weight: var(--emr-weight-bold);
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--emr-neutral-soft);
    color: var(--emr-text-muted);
    font-variant-numeric: tabular-nums;
  }
  .emr-tab[aria-selected="true"] .emr-tab__badge {
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }
  .emr-chip {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    min-height: 32px;
    border-radius: 999px;
    border: 1px solid transparent;
    padding: 0 10px;
    font-size: var(--emr-text-sm);
    line-height: 1.2;
    font-weight: 600;
    white-space: nowrap;
  }
  .emr-chip--sm { min-height: 28px; padding: 0 8px; font-size: var(--emr-text-xs); }
  .emr-chip--interactive { min-height: 44px; padding: 0 4px; }
  .emr-chip__body,
  .emr-chip__trigger {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    padding: 0 8px;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: inherit;
  }
  .emr-chip--interactive .emr-chip__trigger { min-height: 44px; border-radius: 999px; cursor: pointer; }
  .emr-chip--interactive .emr-chip__trigger:focus-visible { outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent); outline-offset: -2px; }
  .emr-chip__avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: color-mix(in srgb, currentColor 18%, transparent);
    font-size: var(--emr-text-2xs);
    font-weight: 700;
    flex-shrink: 0;
  }
  .emr-chip--selected { border-color: currentColor; font-weight: 650; box-shadow: inset 0 0 0 1px currentColor; }
  .emr-chip.emr-badge--soft:not(.emr-chip--selected),
  .emr-chip.emr-badge--solid:not(.emr-chip--selected) { border-color: transparent; }
  .emr-chip--readonly { border-style: dashed; }
  .emr-chip--disabled { opacity: 0.55; cursor: not-allowed; }
  .chip-removable {
    padding-right: 0;
    min-height: 44px;
    gap: 6px;
    overflow: hidden;
  }
  .chip-remove-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 999px;
  }
  .chip-remove-btn:hover:not(:disabled) {
    background: color-mix(in srgb, currentColor 14%, transparent);
  }
  .emr-state-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    min-height: 160px;
    padding: 24px;
    text-align: center;
    box-sizing: border-box;
  }
  .emr-state-message--compact { min-height: 96px; padding: 16px; gap: 6px; }
  .emr-state-message__icon { display: inline-flex; align-items: center; justify-content: center; color: var(--emr-text-muted); }
  .emr-state-message__icon--danger { color: var(--emr-danger); }
  .emr-state-message__spinner {
    width: 24px; height: 24px; border-radius: 50%;
    border: 2.5px solid var(--emr-border); border-top-color: var(--emr-primary);
    animation: emr-state-spin 0.8s linear infinite;
  }
  .emr-state-message--compact .emr-state-message__spinner { width: 20px; height: 20px; }
  @keyframes emr-state-spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .emr-state-message__spinner { animation: none; } }
  .emr-state-message__title { color: var(--emr-text); font-size: var(--emr-text-md); font-weight: 700; line-height: 1.4; margin: 0; }
  .emr-state-message__message { color: var(--emr-text-muted); font-size: var(--emr-text-sm); line-height: 1.45; max-width: 46ch; margin: 0; }
  .emr-state-message__action {
    min-height: 44px; min-width: 44px; padding: 0 14px; border-radius: 8px;
    border: 1px solid var(--emr-border); background: var(--emr-surface);
    color: var(--emr-text); font: inherit; font-size: var(--emr-text-sm); font-weight: 600;
    cursor: pointer; margin-top: 4px;
  }
  .emr-state-message__action:hover:not(:disabled) { background: var(--emr-surface-raised); }
  .emr-state-message__action:focus-visible { outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent); outline-offset: 2px; }
  .emr-state-message__action:disabled { opacity: 0.5; cursor: not-allowed; }
  .chip-remove-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .emr-card--shell { padding: 0; display: block; border: 1px solid var(--emr-border); border-radius: 10px; background: var(--emr-surface); overflow: clip; min-width: 0; }
  .emr-card--elevated { box-shadow: var(--emr-shadow); }
  .emr-card--filled { background: var(--emr-surface-raised); }
  .emr-card--subtle { background: var(--emr-surface-soft); }
  .emr-card--tone-info { border-color: color-mix(in srgb, var(--emr-info) 45%, var(--emr-border)); }
  .emr-card--tone-success { border-color: color-mix(in srgb, var(--emr-success) 45%, var(--emr-border)); }
  .emr-card--tone-warning { border-color: color-mix(in srgb, var(--emr-warning) 45%, var(--emr-border)); }
  .emr-card--tone-danger { border-color: color-mix(in srgb, var(--emr-danger) 45%, var(--emr-border)); }
  .emr-card--interactive { cursor: pointer; min-height: 44px; }
  .emr-card--interactive:hover:not(.emr-card--disabled):not(.emr-card--readonly) { border-color: var(--emr-focus); }
  .emr-card--interactive:focus-visible { outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent); outline-offset: 2px; }
  .emr-card--selected { border-color: var(--emr-primary); box-shadow: 0 0 0 1px var(--emr-primary); }
  .emr-card--readonly { border-style: dashed; cursor: default; }
  .emr-card--disabled { opacity: 0.55; cursor: not-allowed; }
  .emr-card__header { min-height: 44px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 16px; background: var(--emr-surface-accent); border-bottom: 1px solid var(--emr-border); box-sizing: border-box; }
  .emr-card--selected .emr-card__header { background: var(--emr-primary-soft); }
  .emr-card__header-main { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .emr-card__title { font-size: var(--emr-text-md); font-weight: 700; line-height: 1.35; color: var(--emr-text); margin: 0; }
  .emr-card__subtitle { font-size: var(--emr-text-xs); color: var(--emr-text-muted); line-height: 1.35; }
  .emr-card__body { padding: 16px; }
  .emr-card--pad-sm .emr-card__body { padding: 10px; }
  .emr-card--pad-lg .emr-card__body { padding: 24px; }
  .emr-card--flush .emr-card__body { padding: 0; }
  .emr-card__footer { padding: 10px 16px; border-top: 1px solid var(--emr-border); background: var(--emr-surface-soft); }
  .separator-plain {
    width: 100%;
    height: 0;
    border-top: 1px solid var(--emr-border);
    margin: 16px 0;
  }
  .separator-labelled {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 16px 0;
    min-width: 0;
  }
  .separator-line {
    flex: 1 1 auto;
    height: 0;
    border-top: 1px solid var(--emr-border);
  }
  .separator-labelled--start .separator-line--start { flex: 0 0 16px; width: 16px; }
  .separator-labelled--end .separator-line--end { flex: 0 0 16px; width: 16px; }
  .separator-label {
    color: var(--emr-text-muted);
    font-size: var(--emr-text-sm);
    font-weight: 650;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  :host([orientation="vertical"]) {
    display: inline-flex !important;
    width: auto !important;
    align-self: stretch;
  }
  .separator-vertical {
    display: inline-block;
    width: 0;
    min-height: 16px;
    align-self: stretch;
    border-left: 1px solid var(--emr-border);
    margin: 0 12px;
  }
  .separator--dashed.separator-plain,
  .separator--dashed .separator-line { border-top-style: dashed; }
  .separator--dashed.separator-vertical { border-left-style: dashed; }
  .separator--subtle.separator-plain,
  .separator--subtle .separator-line { border-top-color: color-mix(in srgb, var(--emr-border) 55%, transparent); }
  .separator--subtle.separator-vertical { border-left-color: color-mix(in srgb, var(--emr-border) 55%, transparent); }
  .likert-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .likert-pip {
    width: auto;
    min-width: 44px;
    justify-content: center;
  }
  .scale-anchors {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: var(--emr-text-xs);
    color: var(--emr-text-muted);
  }

  /* VAS ruler */
  .vas-frame {
    display: grid;
    gap: 8px;
  }
  .vas-frame--vertical {
    grid-template-columns: auto auto;
    align-items: stretch;
    width: fit-content;
  }
  .vas-frame--vertical .scale-anchors {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 14px 0;
  }
  .vas-slider {
    position: relative;
    height: 56px;
    min-height: 44px;
    padding: 0;
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    border: 1px solid var(--emr-border);
    cursor: pointer;
    touch-action: none;
    user-select: none;
  }
  .vas-slider--sm {
    height: 48px;
  }
  .vas-slider--lg {
    height: 68px;
  }
  .vas-slider--vertical {
    width: 72px;
    height: 240px;
  }
  .vas-slider--vertical.vas-slider--sm {
    width: 64px;
    height: 200px;
  }
  .vas-slider--vertical.vas-slider--lg {
    width: 84px;
    height: 280px;
  }
  .vas-slider--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
  }
  .vas-slider--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .vas-slider--warning {
    border-color: var(--emr-warning);
  }
  .vas-slider--invalid {
    border-color: var(--emr-danger);
  }
  .vas-rule {
    position: absolute;
    left: 14px;
    right: 14px;
    top: 18px;
    height: 2px;
    background: var(--emr-border);
  }
  .vas-slider--vertical .vas-rule {
    top: 14px;
    bottom: 14px;
    left: 22px;
    right: auto;
    width: 2px;
    height: auto;
  }
  .vas-tick {
    position: absolute;
    top: 13px;
    left: calc(14px + (100% - 28px) * var(--vas-pct, 0) / 100);
    width: 1px;
    height: 8px;
    background: var(--emr-text-muted);
    transform: translateX(-50%);
  }
  .vas-tick--major {
    top: 10px;
    width: 1.5px;
    height: 14px;
    background: var(--emr-text);
  }
  .vas-slider--vertical .vas-tick {
    left: 17px;
    top: auto;
    bottom: calc(14px + (100% - 28px) * var(--vas-pct, 0) / 100);
    width: 8px;
    height: 1px;
    transform: translateY(50%);
  }
  .vas-slider--vertical .vas-tick--major {
    left: 14px;
    width: 14px;
    height: 1.5px;
  }
  .vas-tick-label {
    position: absolute;
    top: 28px;
    left: calc(14px + (100% - 28px) * var(--vas-pct, 0) / 100);
    transform: translateX(-50%);
    font-size: var(--emr-text-2xs);
    color: var(--emr-text-muted);
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }
  .vas-slider--vertical .vas-tick-label {
    top: auto;
    left: 34px;
    bottom: calc(14px + (100% - 28px) * var(--vas-pct, 0) / 100);
    transform: translateY(50%);
  }
  .vas-thumb {
    position: absolute;
    top: 19px;
    left: calc(14px + (100% - 28px) * var(--vas-pct, 0) / 100);
    width: 18px;
    height: 18px;
    border-radius: 999px;
    border: 2px solid var(--emr-surface);
    background: var(--emr-primary);
    box-shadow: var(--emr-shadow);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .vas-slider--vertical .vas-thumb {
    top: auto;
    left: 23px;
    bottom: calc(14px + (100% - 28px) * var(--vas-pct, 0) / 100);
    transform: translate(-50%, 50%);
  }
  .vas-thumb--info { background: var(--emr-info); }
  .vas-thumb--success { background: var(--emr-success); }
  .vas-thumb--warning { background: var(--emr-warning); }
  .vas-thumb--danger { background: var(--emr-danger); }

  .columns-grid {
    display: grid;
    grid-template-columns: var(--emr-col-template, repeat(2, minmax(0, 1fr)));
    gap: var(--emr-col-gap, 16px);
    align-items: var(--emr-col-align, stretch);
  }
  .columns-grid ::slotted(*) {
    min-width: 0;
  }

  .fvr-row {
    display: grid;
    grid-template-columns: minmax(120px, 1.4fr) minmax(0, 1.6fr) minmax(0, 1.4fr) minmax(0, 1.4fr);
    gap: 0;
    border: 1px solid var(--emr-border);
    font-variant-numeric: tabular-nums;
    transition: background-color 140ms ease, border-color 140ms ease;
    border-radius: 6px;
    overflow: hidden;
  }
  .fvr-cell {
    padding: 10px 12px;
    color: var(--emr-text);
    border-left: 1px solid var(--emr-border);
    display: flex;
    align-items: center;
    min-height: 44px;
    min-width: 0;
    font-size: var(--emr-text-md);
  }
  .fvr-cell:first-child {
    border-left: 0;
  }
  .fvr-field {
    font-weight: 650;
    background: var(--emr-surface-slate);
  }
  .fvr-remarks,
  .fvr-notes {
    color: var(--emr-text-muted);
  }
  .fvr-placeholder {
    color: var(--emr-text-muted);
  }
  .fvr-row--sm .fvr-cell {
    padding: 6px 10px;
    min-height: 36px;
    font-size: var(--emr-text-sm);
  }
  .fvr-row--lg .fvr-cell {
    padding: 12px 14px;
    min-height: 48px;
  }
  .fvr-row--truncate .fvr-cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    line-height: 24px;
  }
  .fvr-row--heading .fvr-cell {
    background: var(--emr-surface-accent);
    font-weight: var(--emr-weight-bold);
    color: var(--emr-text);
    font-size: var(--emr-text-2xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .fvr-row--interactive {
    cursor: pointer;
  }
  .fvr-row--interactive:hover:not(.fvr-row--readonly) {
    background: var(--emr-surface-accent);
  }
  .fvr-row--interactive:focus-visible {
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }
  .fvr-row--readonly {
    cursor: default;
    border-style: dashed;
    opacity: 0.92;
  }
  .fvr-row[data-tone="info"] .fvr-value:not(.fvr-placeholder) { color: var(--emr-info); font-weight: 600; }
  .fvr-row[data-tone="success"] .fvr-value:not(.fvr-placeholder) { color: var(--emr-success); font-weight: 600; }
  .fvr-row[data-tone="warning"] .fvr-value:not(.fvr-placeholder) { color: var(--emr-warning); font-weight: 600; }
  .fvr-row[data-tone="danger"] .fvr-value:not(.fvr-placeholder) { color: var(--emr-danger); font-weight: 600; }
  @media (max-width: 768px) {
    .fvr-row {
      grid-template-columns: minmax(0, 1fr);
    }
    .fvr-cell {
      border-left: 0;
      border-top: 1px solid var(--emr-border);
    }
    .fvr-field {
      border-top: 0;
    }
    .fvr-cell::before {
      content: attr(data-label) ": ";
      font-weight: 700;
      color: var(--emr-text-muted);
      margin-right: 6px;
    }
    .fvr-row--heading {
      display: none;
    }
  }

  .status-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    min-width: 0;
  }
  .status-cell--disabled {
    opacity: 0.55;
  }
  .status-cell-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    border: 1px solid transparent;
    border-radius: var(--emr-radius);
    transition: background-color 140ms ease, border-color 140ms ease;
  }
  .status-cell-body--interactive {
    min-height: 44px;
    min-width: 44px;
    padding: 6px 8px;
    cursor: pointer;
    justify-content: center;
  }
  .status-cell-body--interactive:hover:not(.status-cell-body--readonly):not(.status-cell-body--disabled) {
    background: var(--emr-surface-soft);
  }
  .status-cell-body--interactive:focus-visible {
    outline: 3px solid var(--emr-focus);
    outline-offset: 2px;
  }
  .status-cell-body--selected {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft, var(--emr-surface-accent));
  }
  .status-cell-body--readonly {
    cursor: default;
    border-style: dashed;
    border-color: var(--emr-border);
  }
  .status-cell-body--disabled {
    cursor: not-allowed;
  }
  .status-cell-action {
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .status-cell-value {
    font-size: var(--emr-text-sm);
    font-weight: 650;
  }
  .status-cell--sm .status-cell-value {
    font-size: var(--emr-text-xs);
  }
  .status-cell-main {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .stage-list {
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    padding: 0;
    margin: 0;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius, 8px);
    overflow: hidden;
    background: var(--emr-surface-slate);
  }
  .stage-list--readonly {
    border-style: dashed;
  }
  .stage-list--disabled {
    opacity: 0.55;
  }
  .stage-list--vertical {
    flex-direction: column;
    flex-wrap: nowrap;
  }
  .stage-item {
    flex: 1 1 auto;
    min-width: 0;
    border-inline-end: 1px solid var(--emr-border);
  }
  .stage-item:last-child {
    border-inline-end: 0;
  }
  .stage-list--vertical .stage-item {
    flex: none;
    border-inline-end: 0;
    border-bottom: 1px solid var(--emr-border);
  }
  .stage-list--vertical .stage-item:last-child {
    border-bottom: 0;
  }
  .stage-btn {
    box-sizing: border-box;
    width: 100%;
    min-height: 44px;
    min-width: 44px;
    padding: 10px 14px;
    border: 0;
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    text-align: left;
    transition: background-color 140ms ease, color 140ms ease;
  }
  .stage-list--sm .stage-btn {
    padding: 8px 10px;
    font-size: var(--emr-text-sm);
  }
  .stage-btn:hover:not(:disabled):not(.stage-btn--readonly) {
    background: var(--emr-surface-soft);
  }
  .stage-btn:focus-visible {
    outline: 3px solid var(--emr-focus);
    outline-offset: -3px;
  }
  .stage-btn--active {
    background: var(--emr-surface-accent);
    color: var(--emr-primary);
    box-shadow: inset 0 -3px var(--emr-primary);
    font-weight: var(--emr-weight-semibold);
  }
  .stage-btn--readonly {
    cursor: default;
  }
  .stage-btn--disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .stage-btn--completed .stage-num {
    background: var(--emr-success-soft);
    color: var(--emr-success);
  }
  .stage-num {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: var(--emr-neutral-soft);
    color: var(--emr-text);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  @media (max-width: 640px) {
    .stage-item {
      flex-basis: 100%;
      border-inline-end: 0;
      border-bottom: 1px solid var(--emr-border);
    }
    .stage-item:last-child {
      border-bottom: 0;
    }
  }

  .stat-tile {
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
    min-height: 88px;
    border: 1px solid var(--emr-border);
    border-radius: 12px;
    background: var(--emr-surface);
    color: var(--emr-text);
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 4px;
    text-align: left;
    font: inherit;
    transition: background-color 140ms ease, border-color 140ms ease;
  }
  .stat-tile--sm { min-height: 72px; padding: 12px; }
  .stat-tile--lg { min-height: 104px; padding: 20px; }
  .stat-tile--interactive { cursor: pointer; }
  .stat-tile--interactive:hover:not(:disabled) {
    background: var(--emr-surface-raised);
    border-color: var(--emr-primary-border);
  }
  .stat-tile--interactive:focus-visible {
    outline: 3px solid var(--emr-focus);
    outline-offset: 2px;
  }
  .stat-tile--selected {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft, var(--emr-surface-accent));
  }
  .stat-tile--readonly { border-style: dashed; }
  .stat-tile--disabled { opacity: 0.55; cursor: not-allowed; }
  .stat-tile[data-tone="info"]:not(.stat-tile--selected) { border-color: var(--emr-info); }
  .stat-tile[data-tone="success"]:not(.stat-tile--selected) { border-color: var(--emr-success); }
  .stat-tile[data-tone="warning"]:not(.stat-tile--selected) { border-color: var(--emr-warning); }
  .stat-tile[data-tone="danger"]:not(.stat-tile--selected) { border-color: var(--emr-danger); }
  .stat-tile-label {
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    color: var(--emr-text-muted);
    overflow-wrap: anywhere;
  }
  .stat-tile-value {
    font-size: var(--emr-text-2xl);
    font-weight: var(--emr-weight-bold);
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
    color: var(--emr-text);
    overflow-wrap: anywhere;
  }
  .stat-tile--sm .stat-tile-value { font-size: var(--emr-text-xl); }
  .stat-tile-trend {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--emr-text-xs);
    font-weight: 600;
    color: var(--emr-text-muted);
  }
  .stat-tile-trend[data-tone="info"] { color: var(--emr-info); }
  .stat-tile-trend[data-tone="success"] { color: var(--emr-success); }
  .stat-tile-trend[data-tone="warning"] { color: var(--emr-warning); }
  .stat-tile-trend[data-tone="danger"] { color: var(--emr-danger); }
  .stat-tile-sub {
    font-size: var(--emr-text-xs);
    color: var(--emr-text-muted);
    overflow-wrap: anywhere;
  }
  .stat-tile-skeleton {
    display: block;
    border-radius: 6px;
    background: var(--emr-surface-soft);
  }

  :host([data-open="true"]) {
    position: relative;
    z-index: 100;
  }
  .search-select-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .search-chip-overflow {
    background: var(--emr-surface-raised);
    color: var(--emr-text-muted);
    font-weight: 600;
  }
  .search-select-wrap {
    position: relative;
  }
  .search-select-bar {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }
  .search-input-wrap {
    position: relative;
    flex: 1 1 0%;
    min-width: 0;
    display: flex;
    align-items: center;
  }
  .search-leading-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--emr-text-muted);
    pointer-events: none;
    display: inline-flex;
    align-items: center;
  }
  .search-trigger-spinner {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--emr-text-muted);
    pointer-events: none;
    display: inline-flex;
    align-items: center;
  }
  .search-input-wrap .emr-control {
    flex: 1 1 0%;
    min-width: 0;
    width: 100%;
    padding-left: 36px;
  }
  .search-input-wrap .emr-control--loading {
    padding-right: 34px;
  }
  .search-input-wrap .emr-control::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
  }
  .search-select-bar--filled .search-input-wrap .emr-control,
  .search-select-bar--filled .clear-inline-btn,
  .search-select-bar--filled .search-action-btn {
    background: var(--emr-surface-soft);
    border-color: transparent;
  }
  .search-select-bar--subtle .search-input-wrap .emr-control,
  .search-select-bar--subtle .clear-inline-btn,
  .search-select-bar--subtle .search-action-btn {
    background: transparent;
    border-color: transparent;
  }
  .search-select-bar--subtle .search-input-wrap .emr-control:hover,
  .search-select-bar--subtle .search-input-wrap .emr-control:focus,
  .search-select-bar--subtle .clear-inline-btn:hover,
  .search-select-bar--subtle .search-action-btn:hover {
    background: var(--emr-surface);
    border-color: var(--emr-border);
  }
  .search-select-bar--sm .emr-control {
    font-size: var(--emr-text-sm);
  }
  .search-select-bar--lg .emr-control,
  .search-select-bar--lg .clear-inline-btn,
  .search-select-bar--lg .search-action-btn {
    min-height: 48px;
  }
  .search-action-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0 12px;
    border-radius: var(--emr-radius);
    border: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .search-action-btn:hover:not(:disabled) {
    background: var(--emr-surface-raised);
  }
  .search-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .search-select-panel {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 40;
    display: grid;
    gap: 4px;
    padding: 6px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    box-shadow: var(--emr-shadow-md, var(--emr-shadow));
    max-height: 260px;
    overflow-y: auto;
  }
  .search-option-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 44px;
    text-align: left;
  }
  .search-option-row--active {
    background: var(--emr-surface-raised);
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }
  .search-option-row--readonly {
    cursor: default;
  }
  .search-option-check {
    width: 16px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--emr-primary);
    flex-shrink: 0;
  }
  .search-option-body {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .search-option-top {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .search-option-code {
    font-family: var(--emr-font-mono, monospace);
    font-size: var(--emr-text-xs);
    color: var(--emr-text-muted);
    background: var(--emr-surface-soft);
    border: 1px solid var(--emr-border);
    border-radius: 4px;
    padding: 0 5px;
  }
  .search-best-match {
    font-size: var(--emr-text-2xs);
    font-weight: 650;
    color: var(--emr-primary);
    background: var(--emr-primary-soft, var(--emr-surface-raised));
    border-radius: 4px;
    padding: 1px 6px;
  }
  .search-option-meta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .search-option-lock {
    display: inline-flex;
    align-items: center;
    color: var(--emr-text-muted);
  }
  .emr-match-highlight {
    background: var(--emr-primary-soft, var(--emr-surface-raised));
    color: var(--emr-primary);
    font-weight: 650;
    border-radius: 2px;
    padding: 0 1px;
  }
  .search-spinner {
    animation: emr-lit-spin 0.9s linear infinite;
    flex-shrink: 0;
  }
  @keyframes emr-lit-spin {
    to { transform: rotate(360deg); }
  }
  .search-empty {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    color: var(--emr-text-muted);
    font-size: var(--emr-text-sm);
  }
  .toast-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
`;

function resolveScaleAnchors(
  anchors: EmrScaleAnchorsProp | undefined,
  min: number,
  max: number,
): { minLabel?: string; midLabel?: string; maxLabel?: string } {
  if (!anchors) return {};
  if (Array.isArray(anchors)) {
    const mid = (min + max) / 2;
    return {
      minLabel: anchors.find(a => a.value === min)?.label,
      midLabel: anchors.find(a => a.value === mid)?.label,
      maxLabel: anchors.find(a => a.value === max)?.label,
    };
  }
  const obj = anchors as { minLabel?: string; midLabel?: string; maxLabel?: string };
  return {
    minLabel: obj.minLabel,
    midLabel: obj.midLabel,
    maxLabel: obj.maxLabel,
  };
}

/** Moves focus among enabled radio or tab buttons and returns the requested value. */
function keyboardOption(event: KeyboardEvent, options: readonly EmrOption[]): string | undefined {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return undefined;
  const container = event.currentTarget as HTMLElement;
  const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
  const enabled = buttons.map((button, index) => ({ button, index })).filter(({ button }) => !button.disabled);
  const current = enabled.findIndex(({ button }) => button === event.target);
  if (current < 0 || enabled.length === 0) return undefined;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1
    : (current + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
  enabled[next]!.button.focus();
  return String(options[enabled[next]!.index]!.value);
}

export class EmrButtonElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) label = '';
  @property({ type: String }) variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' = 'primary';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: String }) shape: 'default' | 'pill' = 'default';
  @property({ type: Boolean }) pressed?: boolean;
  @property({ type: Boolean }) block = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) loading = false;
  @property({ type: String }) type: 'button' | 'submit' | 'reset' = 'button';

  override render() {
    const cls = [
      'emr-btn',
      this.variant !== 'primary' ? `emr-btn--${this.variant}` : '',
      this.size !== 'md' ? `emr-btn--${this.size}` : '',
      this.shape === 'pill' ? 'emr-btn--pill' : '',
      this.block ? 'emr-btn--block' : '',
    ].filter(Boolean).join(' ');

    return html`<button
      type=${this.type}
      part="button"
      class=${cls}
      ?disabled=${this.disabled || this.loading}
      aria-busy=${this.loading ? 'true' : 'false'}
      aria-pressed=${this.pressed !== undefined ? String(this.pressed) : nothing}
      @focus=${() => this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }))}
      @blur=${() => this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }))}
      @click=${() => {
        if (!this.disabled && !this.loading) {
          this.dispatchEvent(new CustomEvent('clicked', { bubbles: true, composed: true }));
        }
      }}
    >
      ${this.label}<slot></slot>
    </button>`;
  }
}

export class EmrTextInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-text-input');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = '';
  @property({ type: String }) type: 'text' | 'email' | 'tel' | 'url' = 'text';
  @property({ type: Number }) maxLength?: number;
  @property({ type: Boolean }) showCount = false;
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) override prefix = '';
  @property({ type: String }) suffix = '';
  @property({ type: String }) autocomplete = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) placeholder = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const coreInput = html`<input
      id=${id}
      part="control"
      class=${this.prefix || this.suffix || this.clearable ? 'stepper-input' : 'emr-control'}
      style=${this.prefix || this.suffix || this.clearable ? 'text-align:left;padding:0 12px;' : nothing}
      type=${this.type}
      .value=${this.locked ? live(this.value ?? '') : this.value ?? ''}
      placeholder=${this.placeholder}
      maxlength=${this.maxLength ?? nothing}
      autocomplete=${this.autocomplete || nothing}
      ?readonly=${this.readOnly}
      ?disabled=${this.disabled}
      ?required=${this.required}
      aria-label=${this.labelHidden && this.label ? this.label : nothing}
      aria-invalid=${this.error ? 'true' : nothing}
      aria-describedby=${!this.labelHidden && (this.error || this.warning || this.hint) ? msgId : nothing}
      @focus=${() => this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }))}
      @blur=${(e: Event) => {
        (e.target as HTMLInputElement).value = this.value ?? '';
        this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
      }}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          this.dispatchEvent(new CustomEvent('submitted', { bubbles: true, composed: true }));
        }
      }}
      @input=${(e: Event) => {
        const v = (e.target as HTMLInputElement).value;
        if (this.locked) {
          (e.target as HTMLInputElement).value = this.value ?? '';
          return;
        }
        this.emitValueChange(v || null);
      }}
    />`;

    const input =
      this.prefix || this.suffix || this.clearable
        ? html`<div class="stepper-wrap" style="width:100%;">
            ${this.prefix ? html`<span class="emr-muted" style="padding:0 10px;font-size:var(--emr-text-xs);">${this.prefix}</span>` : nothing}
            ${coreInput}
            ${this.clearable && this.value && !this.locked
              ? html`<button
                  type="button"
                  class="stepper-btn"
                  style="border-left:1px solid var(--emr-border);border-right:0;"
                  aria-label="Clear"
                  @click=${() => {
                    this.emitValueChange(null);
                    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
                  }}
                >
                  ×
                </button>`
              : nothing}
            ${this.suffix ? html`<span class="emr-muted" style="padding:0 10px;font-size:var(--emr-text-xs);">${this.suffix}</span>` : nothing}
          </div>`
        : coreInput;

    if (this.labelHidden) return input;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${input}
      ${this.showCount && this.maxLength
        ? html`<span class="emr-hint">${(this.value ?? '').length} / ${this.maxLength}</span>`
        : nothing}
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

export class EmrNumberInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-number-input');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: Number }) value: number | null = null;
  @property({ type: String }) mode: 'decimal' | 'integer' = 'decimal';
  @property({ type: Number }) min?: number;
  @property({ type: Number }) max?: number;
  @property({ type: Number }) step = 1;
  @property({ type: String }) unit = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  private draft?: { text: string; base: number | null; parsed: number | null | undefined };

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private stepBy(dir: -1 | 1): void {
    if (this.locked) return;
    this.draft = undefined;
    const base = this.value ?? 0;
    const rawStep = this.mode === 'integer' ? Math.max(1, Math.round(this.step || 1)) : (this.step || 1);
    let next = Math.round((base + dir * rawStep) * 10000) / 10000;
    if (this.mode === 'integer') next = Math.round(next);
    if (this.min !== undefined && next < this.min) next = this.min;
    if (this.max !== undefined && next > this.max) next = this.max;
    this.emitValueChange(next);
  }

  override render() {
    if (this.locked) this.draft = undefined;
    if (this.draft && this.value !== this.draft.base && this.value !== this.draft.parsed) this.draft = undefined;

    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const wrapCls = [
      'stepper-wrap',
      this.error ? 'stepper-wrap--invalid' : '',
      this.readOnly ? 'stepper-wrap--readonly' : '',
    ].filter(Boolean).join(' ');

    const row = html`<div class="number-row">
      <div class=${wrapCls} part="stepper">
        ${!this.readOnly
          ? html`<button
              type="button"
              class="stepper-btn"
              aria-label="Decrease value"
              ?disabled=${this.disabled}
              @click=${() => this.stepBy(-1)}
            >${renderEmrSvgIcon('minus', 15)}</button>`
          : nothing}
        <input
          id=${id}
          part="control"
          class="stepper-input"
          type="text"
          inputmode=${this.mode === 'integer' ? 'numeric' : 'decimal'}
          .value=${this.locked
            ? live(this.value == null ? '' : String(this.value))
            : this.draft && (this.value === this.draft.base || this.value === this.draft.parsed)
              ? this.draft.text
              : this.value == null
                ? ''
                : String(this.value)}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-label=${this.labelHidden && this.label ? this.label : nothing}
          aria-invalid=${this.error ? 'true' : nothing}
          aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
          @blur=${(e: Event) => {
            this.draft = undefined;
            (e.target as HTMLInputElement).value = this.value == null ? '' : String(this.value);
          }}
          @input=${(e: Event) => {
            if (this.locked) {
              (e.target as HTMLInputElement).value = this.value == null ? '' : String(this.value);
              return;
            }
            const rawText = (e.target as HTMLInputElement).value;
            const trimmed = rawText.trim();
            const parsed = trimmed === '' ? null : Number(trimmed);
            const isValid =
              parsed === null ||
              (Number.isFinite(parsed) && (this.mode !== 'integer' || (!trimmed.includes('.') && Number.isInteger(parsed))));
            const inRange =
              parsed === null ||
              ((this.min === undefined || parsed >= this.min) &&
                (this.max === undefined || parsed <= this.max));
            this.draft = {
              text: rawText,
              base: this.value,
              parsed: isValid && inRange ? parsed : undefined,
            };
            if (isValid && inRange) {
              this.emitValueChange(parsed);
            }
          }}
        />
        ${!this.readOnly
          ? html`<button
              type="button"
              class="stepper-btn"
              aria-label="Increase value"
              ?disabled=${this.disabled}
              @click=${() => this.stepBy(1)}
            >${renderEmrSvgIcon('plus', 15)}</button>`
          : nothing}
      </div>
      ${this.unit ? html`<span class="emr-muted" aria-hidden="true">${this.unit}</span>` : nothing}
    </div>`;

    if (this.labelHidden) return row;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
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

export class EmrDateInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-date-input');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: String }) ariaDescribedBy = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) min = '';
  @property({ type: String }) max = '';
  @property({ type: String }) precision: LitDatePrecision = 'day';
  @property({ type: String }) displayFormat: LitDateDisplayFormat = 'yyyy-mm-dd';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: Boolean }) fullWidth = false;
  @property({ type: String }) placeholder = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  @state() private calOpen = false;
  @state() private subView: 'days' | 'months' | 'years' = 'days';
  @state() private viewYear = new Date().getFullYear();
  @state() private viewMonth = new Date().getMonth() + 1;
  @state() private popoverStyle = '';

  private draft?: { text: string; base: string | null; parsed?: string | null };

  private get canEdit(): boolean {
    return !this.readOnly && !this.disabled;
  }

  private isIsoOutOfBounds(iso: string): boolean {
    if (this.min && iso < this.min.slice(0, iso.length)) return true;
    if (this.max && iso > this.max.slice(0, iso.length)) return true;
    return false;
  }

  private onOutsidePointerDown = (event: Event): void => {
    if (!this.calOpen) return;
    if (!event.composedPath().includes(this)) {
      this.closeCalendar();
    }
  };

  private onGlobalKeyDown = (event: KeyboardEvent): void => {
    if (this.calOpen && event.key === 'Escape') {
      event.stopPropagation();
      this.closeCalendar();
      this.shadowRoot?.querySelector<HTMLButtonElement>('.date-icon-btn')?.focus();
    }
  };

  private onViewportMove = (): void => {
    if (!this.calOpen) return;
    this.syncPopoverPosition();
  };

  override disconnectedCallback(): void {
    this.detachPopoverListeners();
    super.disconnectedCallback();
  }

  private attachPopoverListeners(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', this.onOutsidePointerDown, true);
      document.addEventListener('keydown', this.onGlobalKeyDown, true);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onViewportMove, true);
      window.addEventListener('resize', this.onViewportMove);
    }
  }

  private detachPopoverListeners(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', this.onOutsidePointerDown, true);
      document.removeEventListener('keydown', this.onGlobalKeyDown, true);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onViewportMove, true);
      window.removeEventListener('resize', this.onViewportMove);
    }
  }

  private syncPopoverPosition(): void {
    const anchor = this.shadowRoot?.querySelector<HTMLElement>('.date-wrap');
    const estHeight = this.subView === 'days' ? 404 : 300;
    this.popoverStyle = computeFixedPopoverStyle(anchor, 328, estHeight, false);
  }

  private openCalendar(): void {
    if (!this.canEdit) return;
    const parts = parseLitIsoParts(this.value);
    const today = todayLitCalendarParts();
    this.viewYear = parts?.year ?? today.year;
    this.viewMonth = parts?.month ?? today.month;
    this.subView = this.precision === 'year' ? 'years' : this.precision === 'month' ? 'months' : 'days';
    this.calOpen = true;
    this.syncPopoverPosition();
    this.attachPopoverListeners();
    void this.updateComplete.then(() => {
      const pop = this.shadowRoot?.querySelector<HTMLElement & { showPopover?: () => void }>('.cal-popover');
      try {
        pop?.showPopover?.();
      } catch {
        // Already open or unsupported in jsdom
      }
    });
  }

  private closeCalendar(): void {
    if (!this.calOpen) return;
    this.calOpen = false;
    this.detachPopoverListeners();
  }

  private toggleCalendar(): void {
    if (this.calOpen) this.closeCalendar();
    else this.openCalendar();
  }

  private stepHeader(dir: -1 | 1): void {
    if (this.subView === 'days') {
      const next = stepLitCalendarMonth(this.viewYear, this.viewMonth, dir);
      this.viewYear = next.year;
      this.viewMonth = next.month;
    } else if (this.subView === 'months') {
      this.viewYear = Math.max(1, this.viewYear + dir);
    } else {
      this.viewYear = Math.max(1, this.viewYear + dir * 12);
    }
  }

  private selectIso(iso: string | null): void {
    if (!this.canEdit) return;
    if (iso !== null && this.isIsoOutOfBounds(iso)) return;
    this.draft = undefined;
    this.closeCalendar();
    this.emitValueChange(iso);
  }

  private renderCalendarPopover() {
    if (!this.calOpen || !this.canEdit) return nothing;
    const today = todayLitCalendarParts();
    const parsed = parseLitIsoParts(this.value);
    const yearPage = buildLitYearPage(this.viewYear);
    const headerTitle =
      this.subView === 'days'
        ? `${LIT_CALENDAR_MONTH_NAMES[this.viewMonth - 1]} ${this.viewYear}`
        : this.subView === 'months'
          ? `${this.viewYear}`
          : `${yearPage.startYear} – ${yearPage.endYear}`;
    const prevLabel =
      this.subView === 'days' ? 'Previous month' : this.subView === 'months' ? 'Previous year' : 'Previous 12 years';
    const nextLabel =
      this.subView === 'days' ? 'Next month' : this.subView === 'months' ? 'Next year' : 'Next 12 years';
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const pad4 = (n: number) => String(n).padStart(4, '0');

    const cells =
      this.subView === 'days'
        ? buildLitCalendarMonthGrid(this.viewYear, this.viewMonth, this.value, today.isoDay)
        : [];
    const weeks: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    const todayIso = this.precision === 'year' ? today.isoYear : this.precision === 'month' ? today.isoMonth : today.isoDay;
    const todayDisabled = this.isIsoOutOfBounds(todayIso);

    return html`<div class="cal-popover" popover="manual" part="calendar" role="dialog" aria-label="Choose date" style=${this.popoverStyle}>
      <div class="cal-header">
        <button type="button" class="cal-nav-btn" aria-label=${prevLabel} @click=${() => this.stepHeader(-1)}>
          ${renderEmrSvgIcon('chevron-left', 16)}
        </button>
        <button
          type="button"
          class="cal-title-btn"
          aria-label=${this.subView === 'days'
            ? `Select month or year, currently ${headerTitle}`
            : this.subView === 'months'
              ? `Select year, currently ${headerTitle}`
              : headerTitle}
          ?disabled=${this.subView === 'years' && this.precision === 'year'}
          @click=${() => {
            if (this.subView === 'days') this.subView = 'months';
            else if (this.subView === 'months') this.subView = 'years';
            else if (this.precision === 'month') this.subView = 'months';
            else if (this.precision === 'day') this.subView = 'days';
            this.syncPopoverPosition();
          }}
        >
          <span>${headerTitle}</span>
          ${!(this.subView === 'years' && this.precision === 'year')
            ? renderEmrSvgIcon(this.subView === 'years' ? 'chevron-up' : 'chevron-down', 14)
            : nothing}
        </button>
        <button type="button" class="cal-nav-btn" aria-label=${nextLabel} @click=${() => this.stepHeader(1)}>
          ${renderEmrSvgIcon('chevron-right', 16)}
        </button>
      </div>

      ${this.subView === 'days'
        ? html`<div class="cal-body" role="grid" aria-label=${headerTitle}>
            <div class="cal-weekdays" role="row">
              ${LIT_CALENDAR_WEEKDAYS.map(wd => html`<span class="cal-weekday" role="columnheader">${wd}</span>`)}
            </div>
            <div class="cal-grid">
              ${weeks.map(
                week => html`<div class="cal-row" role="row">
                  ${week.map(cell => {
                    const outOfBounds = this.isIsoOutOfBounds(cell.iso);
                    const cls = [
                      'cal-day',
                      !cell.inMonth ? 'cal-day--outside' : '',
                      cell.isToday ? 'cal-day--today' : '',
                      cell.isSelected ? 'cal-day--selected' : '',
                    ].filter(Boolean).join(' ');
                    return html`<span role="gridcell">
                      <button
                        type="button"
                        class=${cls}
                        aria-label=${cell.ariaLabel}
                        aria-pressed=${cell.isSelected}
                        aria-current=${cell.isToday ? 'date' : nothing}
                        ?disabled=${outOfBounds}
                        @click=${() => this.selectIso(cell.iso)}
                      >${cell.day}</button>
                    </span>`;
                  })}
                </div>`,
              )}
            </div>
          </div>`
        : this.subView === 'months'
          ? html`<div class="cal-tile-grid">
              ${LIT_CALENDAR_MONTH_SHORT.map((mName, idx) => {
                const mNum = idx + 1;
                const ymIso = `${pad4(this.viewYear)}-${pad2(mNum)}`;
                const outOfBounds = this.isIsoOutOfBounds(ymIso);
                const isSelected = this.precision === 'month'
                  ? this.value === ymIso
                  : parsed?.year === this.viewYear && parsed?.month === mNum;
                const isCurrent = today.year === this.viewYear && today.month === mNum;
                const cls = [
                  'cal-tile-btn',
                  isCurrent ? 'cal-tile-btn--current' : '',
                  isSelected ? 'cal-tile-btn--selected' : '',
                ].filter(Boolean).join(' ');
                return html`<button
                  type="button"
                  class=${cls}
                  aria-label=${`${LIT_CALENDAR_MONTH_NAMES[idx]} ${this.viewYear}`}
                  aria-pressed=${isSelected}
                  ?disabled=${outOfBounds}
                  @click=${() => {
                    if (this.precision === 'month') {
                      this.selectIso(ymIso);
                    } else {
                      this.viewMonth = mNum;
                      this.subView = 'days';
                      this.syncPopoverPosition();
                    }
                  }}
                >${mName}</button>`;
              })}
            </div>`
          : html`<div class="cal-tile-grid">
              ${yearPage.years.map(yr => {
                const yIso = pad4(yr);
                const outOfBounds = this.isIsoOutOfBounds(yIso);
                const isSelected = this.precision === 'year' ? this.value === yIso : parsed?.year === yr;
                const isCurrent = today.year === yr;
                const cls = [
                  'cal-tile-btn',
                  isCurrent ? 'cal-tile-btn--current' : '',
                  isSelected ? 'cal-tile-btn--selected' : '',
                ].filter(Boolean).join(' ');
                return html`<button
                  type="button"
                  class=${cls}
                  aria-label=${String(yr)}
                  aria-pressed=${isSelected}
                  ?disabled=${outOfBounds}
                  @click=${() => {
                    if (this.precision === 'year') {
                      this.selectIso(yIso);
                    } else {
                      this.viewYear = yr;
                      this.subView = 'months';
                      this.syncPopoverPosition();
                    }
                  }}
                >${yr}</button>`;
              })}
            </div>`}

      <div class="cal-footer">
        <button
          type="button"
          class="cal-footer-btn cal-footer-btn--today"
          aria-label=${this.precision === 'year' ? 'Select current year' : this.precision === 'month' ? 'Select current month' : 'Select today'}
          ?disabled=${todayDisabled}
          @click=${() => this.selectIso(todayIso)}
        >${this.precision === 'year' ? 'This year' : this.precision === 'month' ? 'This month' : 'Today'}</button>
        <button type="button" class="cal-footer-btn" aria-label="Clear date" @click=${() => this.selectIso(null)}>Clear</button>
      </div>
    </div>`;
  }

  override render() {
    if (!this.canEdit) {
      this.draft = undefined;
      if (this.calOpen) this.closeCalendar();
    }
    if (this.draft && this.value !== this.draft.base && this.value !== this.draft.parsed) {
      this.draft = undefined;
    }
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const format = resolveLitDateFormat(this.displayFormat, this.precision);
    const formatted = formatLitDate(this.value, this.displayFormat, this.precision);
    const shown = !this.canEdit
      ? formatted
      : this.draft && (this.value === this.draft.base || this.value === this.draft.parsed)
        ? this.draft.text
        : formatted;
    const widthPx = this.precision === 'year' ? 140 : this.precision === 'month' ? 180 : 224;
    const isInvalid = Boolean(this.invalid || this.error);
    const wrapCls = [
      'date-wrap',
      this.calOpen ? 'date-wrap--open' : '',
      isInvalid ? 'date-wrap--invalid' : this.warning ? 'date-wrap--warning' : '',
      this.readOnly ? 'date-wrap--readonly' : '',
    ].filter(Boolean).join(' ');

    const anchor = html`<div class="date-anchor">
      <div class=${wrapCls} style=${`width: 100%; ${this.fullWidth ? '' : `max-width: ${widthPx}px; `}min-height: ${this.size === 'lg' ? 48 : 44}px;`} part="control">
        <input
          id=${id}
          class="date-text-input"
          type="text"
          inputmode="numeric"
          placeholder=${this.placeholder || format}
          .value=${!this.canEdit ? live(formatted) : shown}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-label=${this.ariaLabel || (this.labelHidden && this.label ? this.label : nothing)}
          aria-required=${this.required ? 'true' : nothing}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          aria-invalid=${isInvalid ? 'true' : nothing}
          aria-describedby=${this.ariaDescribedBy || (!this.labelHidden && (this.error || this.hint) ? msgId : nothing)}
          @focus=${() => {
            if (!this.disabled) {
              this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
            }
          }}
          @keydown=${(e: KeyboardEvent) => {
            if (this.canEdit && e.key === 'Enter') {
              this.dispatchEvent(new CustomEvent('submitted', { bubbles: true, composed: true }));
            }
          }}
          @blur=${(e: Event) => {
            this.draft = undefined;
            (e.target as HTMLInputElement).value = formatLitDate(this.value, this.displayFormat, this.precision);
            this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
          }}
          @input=${(e: Event) => {
            if (!this.canEdit) {
              (e.target as HTMLInputElement).value = formatted;
              return;
            }
            const raw = sanitizeLitDateText((e.target as HTMLInputElement).value, format);
            (e.target as HTMLInputElement).value = raw;
            const parsed = parseLitDateText(raw, this.displayFormat, this.precision);
            const inBounds = parsed.status !== 'valid' || !this.isIsoOutOfBounds(parsed.value);
            const emitted = parsed.status === 'valid' && inBounds ? parsed.value : parsed.status === 'empty' ? null : undefined;
            this.draft = { text: raw, base: this.value, parsed: emitted };
            if (parsed.status === 'empty') {
              this.emitValueChange(null);
            } else if (parsed.status === 'valid' && inBounds) {
              this.emitValueChange(parsed.value);
            }
          }}
        />
        <button
          type="button"
          class=${`date-icon-btn${this.calOpen ? ' date-icon-btn--open' : ''}`}
          aria-label="Choose date"
          aria-expanded=${this.calOpen}
          aria-haspopup="dialog"
          ?disabled=${!this.canEdit}
          @click=${() => this.toggleCalendar()}
        >${renderEmrSvgIcon('calendar', 16)}</button>
      </div>
      ${this.renderCalendarPopover()}
    </div>`;

    if (this.labelHidden) return anchor;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${anchor}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.hint
          ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
          : nothing}
    </div>`;
  }
}

export class EmrTimeInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-time-input');
  @state() private draftText: string | null = null;
  @state() private leftInvalid = false;

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: String }) ariaDescribedBy = '';
  @property({ type: Boolean }) fullWidth = false;
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) precision: EmrTimePrecision = 'minute';
  @property({ type: String }) hourCycle: EmrTimeHourCycle = '24';
  @property({ type: String }) min = '';
  @property({ type: String }) max = '';
  @property({ type: Number }) step?: number;
  @property({ type: String }) size: EmrTimeSize = 'md';
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) placeholder = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const isInvalid = Boolean(this.invalid || this.error || this.leftInvalid);
    const displayed = formatTimeDisplay(this.value, { precision: this.precision, hourCycle: this.hourCycle });
    const resolvedPlaceholder = resolveTimePlaceholder(this.precision, this.hourCycle, this.placeholder);
    const baseWidth = this.precision === 'second' || this.hourCycle === '12' ? 210 : 176;
    const maxWidth = this.clearable ? baseWidth + 36 : baseWidth;
    const resolvedStep = this.step ?? (this.precision === 'second' ? 1 : 60);
    const showClear = Boolean(this.clearable && this.value && !this.locked);

    const wrapCls = [
      'date-wrap',
      isInvalid ? 'date-wrap--invalid' : this.warning ? 'date-wrap--warning' : '',
      this.readOnly ? 'date-wrap--readonly' : '',
    ].filter(Boolean).join(' ');

    const control = html`<div
      class=${wrapCls}
      style=${`width: 100%; ${this.fullWidth ? '' : `max-width: ${maxWidth}px; `}min-height: ${this.size === 'lg' ? 48 : 44}px;`}
      part="control"
    >
      <input
        id=${id}
        class="stepper-input"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        .value=${this.locked ? live(displayed) : (this.draftText ?? displayed)}
        placeholder=${resolvedPlaceholder}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        ?required=${this.required}
        aria-label=${this.ariaLabel || (this.labelHidden && this.label ? this.label : nothing)}
        aria-required=${this.required ? 'true' : nothing}
        aria-readonly=${this.readOnly ? 'true' : nothing}
        aria-invalid=${isInvalid ? 'true' : nothing}
        aria-describedby=${this.ariaDescribedBy || (!this.labelHidden && (this.error || this.warning || this.hint) ? msgId : nothing)}
        @focus=${() => {
          if (this.disabled) return;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }}
        @keydown=${(e: KeyboardEvent) => {
          if (!this.locked && e.key === 'Enter') {
            this.dispatchEvent(new CustomEvent('submitted', { bubbles: true, composed: true }));
          }
        }}
        @blur=${(e: Event) => {
          const el = e.target as HTMLInputElement;
          const raw = this.draftText ?? el.value;
          const parsed = parseTimeText(raw, { precision: this.precision, hourCycle: this.hourCycle });
          const oob = parsed.kind === 'valid' && isTimeOutOfBounds(parsed.value, this.min || undefined, this.max || undefined);
          if (!this.locked && (parsed.kind === 'draft' || oob)) {
            this.leftInvalid = true;
          } else {
            this.leftInvalid = false;
            this.draftText = null;
            el.value = formatTimeDisplay(this.value, { precision: this.precision, hourCycle: this.hourCycle });
          }
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }}
        @input=${(e: Event) => {
          const el = e.target as HTMLInputElement;
          if (this.locked) {
            el.value = displayed;
            return;
          }
          const cleaned = sanitizeTimeText(el.value, { precision: this.precision, hourCycle: this.hourCycle });
          if (el.value !== cleaned) el.value = cleaned;
          this.draftText = cleaned;
          this.leftInvalid = false;
          const parsed = parseTimeText(cleaned, { precision: this.precision, hourCycle: this.hourCycle });
          if (parsed.kind === 'empty') {
            this.emitValueChange(null);
            return;
          }
          if (parsed.kind === 'valid' && !isTimeOutOfBounds(parsed.value, this.min || undefined, this.max || undefined)) {
            if (parsed.value !== this.value) {
              this.emitValueChange(parsed.value);
            }
          }
        }}
      />
      ${showClear
        ? html`<button
            type="button"
            class="date-icon-box"
            style="border:0;border-left:1px solid var(--emr-border);background:transparent;cursor:pointer;min-width:44px;min-height:44px;"
            aria-label=${`Clear ${this.ariaLabel || this.label || 'time'}`}
            @click=${() => {
              if (this.locked) return;
              this.draftText = null;
              this.leftInvalid = false;
              this.emitValueChange(null);
              this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
            }}
          >${renderEmrSvgIcon('close', 14)}</button>`
        : nothing}
      <span class="date-icon-box" style="position:relative;cursor:pointer;" aria-hidden="true">
        ${renderEmrSvgIcon('clock', 16)}
        ${!this.locked
          ? html`<input
              type="time"
              tabindex="-1"
              aria-hidden="true"
              style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;"
              .value=${this.value ?? ''}
              min=${this.min || nothing}
              max=${this.max || nothing}
              step=${String(resolvedStep)}
              @change=${(e: Event) => {
                if (this.locked) return;
                const raw = (e.target as HTMLInputElement).value;
                if (!raw) {
                  this.draftText = null;
                  this.leftInvalid = false;
                  this.emitValueChange(null);
                  return;
                }
                if (isTimeOutOfBounds(raw, this.min || undefined, this.max || undefined)) return;
                const normalized =
                  this.precision === 'second' && raw.length === 5
                    ? `${raw}:00`
                    : this.precision === 'minute'
                      ? raw.slice(0, 5)
                      : raw;
                this.draftText = null;
                this.leftInvalid = false;
                this.emitValueChange(normalized);
              }}
            />`
          : nothing}
      </span>
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

export class EmrDateTimeInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-datetime-input');
  @state() private dateDraft: string | null = null;
  @state() private timeDraft: string | null = null;
  @state() private leftInvalid = false;
  private focusInside = false;

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: String }) ariaDescribedBy = '';
  @property({ type: Boolean }) fullWidth = false;
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) displayFormat: EmrDateTimeDisplayFormat = 'dd-mm-yyyy';
  @property({ type: String }) timePrecision: EmrDateTimePrecision = 'minute';
  @property({ type: String }) precision?: EmrDateTimePrecision;
  @property({ type: String }) hourCycle: EmrDateTimeHourCycle = '24';
  @property({ type: String }) wireFormat: EmrDateTimeWireFormat = 'utc';
  @property({ type: String }) min = '';
  @property({ type: String }) max = '';
  @property({ type: String }) size: EmrDateTimeSize = 'md';
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) dateLabel = 'Date';
  @property({ type: String }) timeLabel = 'Time';
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private get effectivePrecision(): EmrDateTimePrecision {
    return this.precision ?? this.timePrecision;
  }

  private tryCommit(nextDateIso: string | null, nextTime24: string | null, dateEmpty: boolean, timeEmpty: boolean): void {
    if (dateEmpty && timeEmpty) {
      this.leftInvalid = false;
      if (this.value !== null) this.emitValueChange(null);
      return;
    }
    if (!nextDateIso || !nextTime24) return;
    const joined = joinDateTimeParts(nextDateIso, nextTime24, this.wireFormat, this.effectivePrecision);
    if (!joined) return;
    if (isDateTimeOutOfBounds(joined, this.min || undefined, this.max || undefined, this.wireFormat)) {
      this.leftInvalid = true;
      return;
    }
    this.leftInvalid = false;
    if (joined !== this.value) this.emitValueChange(joined);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const effPrecision = this.effectivePrecision;
    const localDisplayed = toLocalDateTimeInputValue(this.value, effPrecision);
    const parts = splitDateTimeParts(this.value, effPrecision);
    const displayedDate = formatIsoDateDisplay(parts.date, this.displayFormat);
    const displayedTime = formatTimeDisplay(parts.time, { precision: effPrecision, hourCycle: this.hourCycle });
    const timePlaceholder = resolveTimePlaceholder(effPrecision, this.hourCycle);
    const isInvalid = Boolean(this.invalid || this.error || this.leftInvalid);
    const minHeight = this.size === 'lg' ? 48 : 44;
    const timeMaxWidth = effPrecision === 'second' || this.hourCycle === '12' ? 200 : 168;
    const showClear = Boolean(this.clearable && this.value && !this.locked);

    const wrapCls = [
      'date-wrap',
      isInvalid ? 'date-wrap--invalid' : this.warning ? 'date-wrap--warning' : '',
      this.readOnly ? 'date-wrap--readonly' : '',
    ].filter(Boolean).join(' ');

    const control = html`<div
      id=${id}
      role="group"
      aria-label=${this.ariaLabel || this.label || 'Date and time'}
      style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;"
      @focusin=${() => {
        if (!this.focusInside && !this.disabled) {
          this.focusInside = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
      }}
      @focusout=${(e: FocusEvent) => {
        const next = e.relatedTarget as Node | null;
        const cur = e.currentTarget as HTMLElement | null;
        if (next && cur?.contains(next)) return;
        this.focusInside = false;
        this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
      }}
    >
      <input
        tabindex="-1"
        aria-hidden="true"
        type="datetime-local"
        step=${effPrecision === 'second' ? '1' : '60'}
        style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;"
        .value=${this.locked ? live(localDisplayed) : localDisplayed}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        @blur=${(e: Event) => {
          (e.target as HTMLInputElement).value = toLocalDateTimeInputValue(this.value, effPrecision);
        }}
        @input=${(e: Event) => {
          const raw = (e.target as HTMLInputElement).value;
          if (this.locked) {
            (e.target as HTMLInputElement).value = toLocalDateTimeInputValue(this.value, effPrecision);
            return;
          }
          if (!raw) {
            this.emitValueChange(null);
            return;
          }
          this.emitValueChange(this.wireFormat === 'local' ? raw : localDateTimeToUtcIso(raw));
        }}
      />
      <div class=${wrapCls} style=${`flex:1 1 156px;max-width:184px;min-height:${minHeight}px;`} part="date-control">
        <input
          id=${`${id}-date`}
          class="stepper-input"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          .value=${this.locked ? live(displayedDate) : (this.dateDraft ?? displayedDate)}
          placeholder=${this.displayFormat}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-label=${`${this.ariaLabel || this.label || 'Date and time'}, ${this.dateLabel}`}
          aria-required=${this.required ? 'true' : nothing}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          aria-invalid=${isInvalid ? 'true' : nothing}
          aria-describedby=${this.ariaDescribedBy || (!this.labelHidden && (this.error || this.warning || this.hint) ? msgId : nothing)}
          @keydown=${(e: KeyboardEvent) => {
            if (!this.locked && e.key === 'Enter') {
              this.dispatchEvent(new CustomEvent('submitted', { bubbles: true, composed: true }));
            }
          }}
          @blur=${(e: Event) => {
            const el = e.target as HTMLInputElement;
            const dp = parseDateDisplayText(this.dateDraft ?? el.value, this.displayFormat);
            const tp = parseTimeText(this.timeDraft ?? displayedTime, { precision: effPrecision, hourCycle: this.hourCycle });
            const halfTyped = (dp.kind === 'valid' && tp.kind === 'empty') || (dp.kind === 'empty' && tp.kind === 'valid');
            if (!this.locked && (dp.kind === 'draft' || halfTyped)) {
              this.leftInvalid = true;
            } else if (dp.kind === 'empty' && tp.kind === 'empty') {
              this.leftInvalid = false;
              this.dateDraft = null;
              el.value = '';
            } else if (dp.kind === 'valid') {
              this.dateDraft = null;
              el.value = formatIsoDateDisplay(dp.value, this.displayFormat);
            }
          }}
          @input=${(e: Event) => {
            const el = e.target as HTMLInputElement;
            if (this.locked) {
              el.value = displayedDate;
              return;
            }
            const clean = sanitizeDateDisplayText(el.value, this.displayFormat);
            if (el.value !== clean) el.value = clean;
            this.dateDraft = clean;
            this.leftInvalid = false;
            const dp = parseDateDisplayText(clean, this.displayFormat);
            const tp = parseTimeText(this.timeDraft ?? displayedTime, { precision: effPrecision, hourCycle: this.hourCycle });
            this.tryCommit(
              dp.kind === 'valid' ? dp.value : null,
              tp.kind === 'valid' ? tp.value : null,
              dp.kind === 'empty',
              tp.kind === 'empty',
            );
          }}
        />
        <span class="date-icon-box" style="position:relative;cursor:pointer;" aria-hidden="true">
          ${renderEmrSvgIcon('calendar', 16)}
          ${!this.locked
            ? html`<input
                type="date"
                tabindex="-1"
                aria-hidden="true"
                style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;"
                .value=${parts.date ?? ''}
                @change=${(e: Event) => {
                  if (this.locked) return;
                  const picked = (e.target as HTMLInputElement).value;
                  if (!picked) {
                    this.dateDraft = '';
                    this.tryCommit(null, null, true, true);
                    return;
                  }
                  this.dateDraft = null;
                  const tVal = parts.time ?? (effPrecision === 'second' ? '09:00:00' : '09:00');
                  this.tryCommit(picked, tVal, false, false);
                }}
              />`
            : nothing}
        </span>
      </div>

      <div class=${wrapCls} style=${`flex:1 1 140px;max-width:${timeMaxWidth}px;min-height:${minHeight}px;`} part="time-control">
        <input
          id=${`${id}-time`}
          class="stepper-input"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          .value=${this.locked ? live(displayedTime) : (this.timeDraft ?? displayedTime)}
          placeholder=${timePlaceholder}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-label=${`${this.ariaLabel || this.label || 'Date and time'}, ${this.timeLabel}`}
          aria-required=${this.required ? 'true' : nothing}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          aria-invalid=${isInvalid ? 'true' : nothing}
          aria-describedby=${this.ariaDescribedBy || (!this.labelHidden && (this.error || this.warning || this.hint) ? msgId : nothing)}
          @keydown=${(e: KeyboardEvent) => {
            if (!this.locked && e.key === 'Enter') {
              this.dispatchEvent(new CustomEvent('submitted', { bubbles: true, composed: true }));
            }
          }}
          @blur=${(e: Event) => {
            const el = e.target as HTMLInputElement;
            const tp = parseTimeText(this.timeDraft ?? el.value, { precision: effPrecision, hourCycle: this.hourCycle });
            const dp = parseDateDisplayText(this.dateDraft ?? displayedDate, this.displayFormat);
            const halfTyped = (dp.kind === 'valid' && tp.kind === 'empty') || (dp.kind === 'empty' && tp.kind === 'valid');
            if (!this.locked && (tp.kind === 'draft' || halfTyped)) {
              this.leftInvalid = true;
            } else if (dp.kind === 'empty' && tp.kind === 'empty') {
              this.leftInvalid = false;
              this.timeDraft = null;
              el.value = '';
            } else if (tp.kind === 'valid') {
              this.timeDraft = null;
              el.value = formatTimeDisplay(tp.value, { precision: effPrecision, hourCycle: this.hourCycle });
            }
          }}
          @input=${(e: Event) => {
            const el = e.target as HTMLInputElement;
            if (this.locked) {
              el.value = displayedTime;
              return;
            }
            const clean = sanitizeTimeText(el.value, { precision: effPrecision, hourCycle: this.hourCycle });
            if (el.value !== clean) el.value = clean;
            this.timeDraft = clean;
            this.leftInvalid = false;
            const tp = parseTimeText(clean, { precision: effPrecision, hourCycle: this.hourCycle });
            const dp = parseDateDisplayText(this.dateDraft ?? displayedDate, this.displayFormat);
            this.tryCommit(
              dp.kind === 'valid' ? dp.value : null,
              tp.kind === 'valid' ? tp.value : null,
              dp.kind === 'empty',
              tp.kind === 'empty',
            );
          }}
        />
        <span class="date-icon-box" style="position:relative;cursor:pointer;" aria-hidden="true">
          ${renderEmrSvgIcon('clock', 16)}
          ${!this.locked
            ? html`<input
                type="time"
                tabindex="-1"
                aria-hidden="true"
                style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;"
                .value=${parts.time ?? ''}
                step=${effPrecision === 'second' ? '1' : '60'}
                @change=${(e: Event) => {
                  if (this.locked) return;
                  const picked = (e.target as HTMLInputElement).value;
                  if (!picked) return;
                  this.timeDraft = null;
                  const norm = effPrecision === 'second' && picked.length === 5 ? `${picked}:00` : effPrecision === 'minute' ? picked.slice(0, 5) : picked;
                  if (parts.date) this.tryCommit(parts.date, norm, false, false);
                }}
              />`
            : nothing}
        </span>
      </div>

      ${showClear
        ? html`<button
            type="button"
            class="clear-inline-btn"
            style=${`min-width:44px;min-height:${minHeight}px;padding:0;`}
            aria-label=${`Clear ${this.ariaLabel || this.label || 'date and time'}`}
            @click=${() => {
              if (this.locked) return;
              this.dateDraft = null;
              this.timeDraft = null;
              this.leftInvalid = false;
              this.emitValueChange(null);
              this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
            }}
          >${renderEmrSvgIcon('close', 14)}</button>`
        : nothing}
    </div>`;

    if (this.labelHidden) return control;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class="emr-label" for=${`${id}-date`}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
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

export class EmrSelectElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-select');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) override ariaLabel = '';
  @property({ type: String }) placeholder = 'Select…';
  @property({
    attribute: 'value',
    converter: {
      fromAttribute: (v: string | null) => v,
    },
  })
  value: EmrSelectValue = null;
  @property({ attribute: false }) options: readonly EmrOption[] = [];
  @property({ type: Boolean }) multiple = false;
  @property({ type: String }) size: EmrSelectSize | 'lg' = 'md';
  @property({ type: Boolean }) tabularNums = false;
  @property({ type: String }) variant: EmrSelectVariant = 'outline';
  @property({ type: Boolean }) allowClear = false;
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ attribute: false }) closeOnSelect: boolean | undefined = undefined;
  @property({ type: Number }) maxSelections: number | undefined = undefined;
  @property({ type: Number }) maxTagCount: number | undefined = undefined;
  @property({ type: String }) emptyMessage = 'No options available';
  @property({ type: Boolean }) loading = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) hasWarning = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';
  @property({ type: String }) ariaDescribedBy = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  @state() private open = false;
  @state() private activeIndex = -1;
  @state() private menuStyle = '';

  private typeaheadBuffer = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  private get canEdit(): boolean {
    return !this.readOnly && !this.disabled;
  }

  private get isClearable(): boolean {
    return this.clearable || this.allowClear;
  }

  private get selectedValues(): readonly string[] {
    if (this.multiple) {
      return normalizeEmrSelectMultiValue(this.value);
    }
    const single = normalizeEmrSelectSingleValue(this.value);
    return single === null ? [] : [single];
  }

  private get flatOptions(): readonly EmrOption[] {
    return groupOptions(this.options).flatMap(g => g.options);
  }

  private optionDomId(id: string, val: string): string {
    return `${id}-opt-${val.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }

  private onOutsidePointerDown = (event: Event): void => {
    if (!this.open) return;
    if (!event.composedPath().includes(this)) {
      this.closeMenu(false);
    }
  };

  private onGlobalKeyDown = (event: KeyboardEvent): void => {
    if (this.open && event.key === 'Escape') {
      event.stopPropagation();
      this.closeMenu(true);
    }
  };

  private onViewportMove = (): void => {
    if (!this.open) return;
    this.syncMenuPosition();
  };

  override disconnectedCallback(): void {
    this.detachMenuListeners();
    if (this.typeaheadTimer) {
      clearTimeout(this.typeaheadTimer);
      this.typeaheadTimer = null;
    }
    super.disconnectedCallback();
  }

  private attachMenuListeners(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', this.onOutsidePointerDown, true);
      document.addEventListener('keydown', this.onGlobalKeyDown, true);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onViewportMove, true);
      window.addEventListener('resize', this.onViewportMove);
    }
  }

  private detachMenuListeners(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', this.onOutsidePointerDown, true);
      document.removeEventListener('keydown', this.onGlobalKeyDown, true);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onViewportMove, true);
      window.removeEventListener('resize', this.onViewportMove);
    }
  }

  private syncMenuPosition(): void {
    const trigger = this.shadowRoot?.querySelector<HTMLElement>('.select-bar');
    const rowCount = Math.max(1, this.options.length);
    const estHeight = Math.min(280, Math.max(56, rowCount * 44 + 8));
    this.menuStyle = computeFixedPopoverStyle(trigger, 200, estHeight, true);
  }

  private openMenu(): void {
    if (!this.canEdit || this.open) return;
    const list = this.flatOptions;
    const selectedIdx = list.findIndex(o => !o.disabled && this.selectedValues.includes(o.value));
    this.activeIndex =
      selectedIdx >= 0 ? selectedIdx : findNextEnabledEmrSelectOptionIndex(list, -1, 'ArrowDown');
    this.open = true;
    this.dispatchEvent(new CustomEvent('openChange', { detail: true, bubbles: true, composed: true }));
    this.syncMenuPosition();
    this.attachMenuListeners();
    void this.updateComplete.then(() => {
      const pop = this.shadowRoot?.querySelector<HTMLElement & { showPopover?: () => void }>('.select-menu');
      try {
        pop?.showPopover?.();
      } catch {
        // Already open or unsupported in jsdom
      }
      const selectedBtn =
        this.shadowRoot?.querySelector<HTMLButtonElement>('.select-option[aria-selected="true"]:not(:disabled)') ??
        this.shadowRoot?.querySelector<HTMLButtonElement>('.select-option:not(:disabled)');
      selectedBtn?.focus();
    });
  }

  private closeMenu(restoreFocus = false): void {
    if (!this.open) return;
    this.open = false;
    this.activeIndex = -1;
    this.detachMenuListeners();
    const pop = this.shadowRoot?.querySelector<HTMLElement & { hidePopover?: () => void }>('.select-menu');
    try {
      pop?.hidePopover?.();
    } catch {
      // Unsupported in jsdom
    }
    this.dispatchEvent(new CustomEvent('openChange', { detail: false, bubbles: true, composed: true }));
    if (restoreFocus) {
      this.shadowRoot?.querySelector<HTMLButtonElement>('.select-trigger')?.focus();
    }
  }

  private toggleMenu(): void {
    if (!this.canEdit) return;
    if (this.open) this.closeMenu(true);
    else this.openMenu();
  }

  private pickOption(option: EmrOption): void {
    if (!this.canEdit || option.disabled || option.readOnly) return;
    const shouldClose = resolveEmrSelectCloseOnSelect(this.multiple, this.closeOnSelect);
    if (this.multiple) {
      const current = this.selectedValues;
      const next = toggleEmrSelectOption({
        optionValue: option.value,
        current,
        options: this.options,
        maxSelections: this.maxSelections,
      });
      if (next !== current) {
        this.value = next;
        this.emitValueChange(next);
      }
      if (shouldClose) this.closeMenu(true);
      return;
    }
    this.value = option.value;
    if (shouldClose) this.closeMenu(true);
    this.emitValueChange(option.value);
  }

  private removeChip(optionValue: string): void {
    if (!this.canEdit || !this.multiple) return;
    const current = this.selectedValues;
    const next = removeEmrSelectChip({ optionValue, current, options: this.options });
    if (next !== current) {
      this.value = next;
      this.emitValueChange(next);
    }
  }

  private clearSelection(): void {
    if (!this.canEdit) return;
    const next = clearEmrSelectValue({
      multiple: this.multiple,
      value: this.value,
      options: this.options,
    });
    this.value = next;
    this.closeMenu(true);
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.emitValueChange(next);
  }

  private handleTypeahead(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
    const list = this.flatOptions;
    if (!list.length) return;
    this.typeaheadBuffer += event.key;
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = setTimeout(() => {
      this.typeaheadBuffer = '';
      this.typeaheadTimer = null;
    }, 500);
    const match = findTypeaheadEmrSelectOptionIndex(list, this.typeaheadBuffer, this.activeIndex);
    if (match >= 0) {
      const wasClosed = !this.open;
      if (wasClosed) this.openMenu();
      this.activeIndex = match;
      const opt = list[match];
      if (opt) {
        const id = this.controlId || this.fallbackId;
        void this.updateComplete.then(() => {
          this.shadowRoot?.getElementById(this.optionDomId(id, opt.value))?.focus();
        });
      }
    }
  }

  private onMenuKeyDown = (event: KeyboardEvent): void => {
    const list = this.flatOptions;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      if (!list.length) return;
      event.preventDefault();
      const next = findNextEnabledEmrSelectOptionIndex(list, this.activeIndex, event.key);
      if (next >= 0) {
        this.activeIndex = next;
        const id = this.controlId || this.fallbackId;
        const opt = list[next];
        if (opt) {
          this.shadowRoot?.getElementById(this.optionDomId(id, opt.value))?.focus();
        }
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeMenu(true);
      return;
    }
    this.handleTypeahead(event);
  };

  private renderOptionButton(id: string, opt: EmrOption) {
    const sel = this.selectedValues.includes(opt.value);
    const blockedByMax =
      this.multiple && isEmrSelectOptionBlockedByMax(opt.value, this.selectedValues, this.maxSelections);
    const isDisabled = Boolean(opt.disabled || blockedByMax);
    const isActive = this.activeIndex >= 0 && this.flatOptions[this.activeIndex]?.value === opt.value;
    const badgeText = opt.badge ? (typeof opt.badge === 'string' ? opt.badge : opt.badge.label) : '';
    const badgeTone: EmrTone =
      opt.badge && typeof opt.badge !== 'string' ? opt.badge.tone : (opt.tone ?? 'neutral');

    return html`<button
      id=${this.optionDomId(id, opt.value)}
      type="button"
      role="option"
      class=${`select-option${isActive ? ' select-option--active' : ''}${opt.readOnly ? ' select-option--readonly' : ''}`}
      data-tone=${opt.tone ?? nothing}
      aria-selected=${sel}
      aria-readonly=${opt.readOnly ? 'true' : nothing}
      aria-disabled=${isDisabled ? 'true' : nothing}
      ?disabled=${isDisabled}
      @click=${() => this.pickOption(opt)}
    >
      <span class="select-tick" aria-hidden="true">${sel ? renderEmrSvgIcon('check', 14) : nothing}</span>
      <span class="option-tile-copy">
        <span class="select-option-row">
          <span>${opt.label}</span>
          ${badgeText
            ? html`<span class="select-option-badge" data-tone=${badgeTone}>${badgeText}</span>`
            : nothing}
        </span>
        ${opt.description ? html`<span class="option-tile-desc">${opt.description}</span>` : nothing}
      </span>
    </button>`;
  }

  override render() {
    if (!this.canEdit && this.open) this.closeMenu(false);
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const groups: readonly EmrOptionGroup[] = groupOptions(this.options);
    const hasNamedGroups = groups.some(g => g.label !== null && g.label !== '');
    const triggerSummary = buildEmrSelectTriggerSummary({
      multiple: this.multiple,
      value: this.value,
      options: this.options,
      placeholder: this.placeholder || 'Select…',
      maxTagCount: this.maxTagCount,
    });
    const showClearBtn = isEmrSelectClearable({
      clearable: this.isClearable,
      disabled: this.disabled,
      readOnly: this.readOnly,
      multiple: this.multiple,
      value: this.value,
      options: this.options,
    });
    const isInvalid = Boolean(this.invalid || this.error);
    const isWarning = Boolean(!isInvalid && (this.hasWarning || this.warning));
    const described = [
      this.error.trim() || this.warning.trim() || this.hint.trim() ? msgId : '',
      this.ariaDescribedBy.trim(),
    ]
      .filter(Boolean)
      .join(' ');
    const barCls = [
      'select-bar',
      this.size === 'lg' ? 'select-bar--lg' : '',
      this.tabularNums ? 'select-bar--tabular' : '',
      this.variant === 'filled' ? 'select-bar--filled' : '',
      this.variant === 'subtle' ? 'select-bar--subtle' : '',
      this.open ? 'select-bar--open' : '',
      isInvalid ? 'select-bar--invalid' : '',
      isWarning ? 'select-bar--warning' : '',
      this.readOnly ? 'select-bar--readonly' : '',
      this.disabled ? 'select-bar--disabled' : '',
    ].filter(Boolean).join(' ');
    const triggerCls = [
      'select-trigger',
      this.size === 'sm' ? 'select-trigger--sm' : '',
      this.readOnly ? 'select-trigger--readonly' : '',
    ].filter(Boolean).join(' ');
    const baseLabel = this.ariaLabel.trim() || this.label.trim();
    const activeOpt =
      this.open && this.activeIndex >= 0 && this.activeIndex < this.flatOptions.length
        ? this.flatOptions[this.activeIndex]
        : undefined;

    const selectControl = html`<div class="select-root">
      <div class=${barCls}>
        ${this.multiple && (triggerSummary.visibleChips.length > 0 || triggerSummary.overflowCount > 0)
          ? html`<div class="select-chips" aria-label=${`${baseLabel || 'Selected'} items`}>
              ${triggerSummary.visibleChips.map(
                chip => html`<span
                  class="select-chip"
                  data-tone=${chip.tone ?? nothing}
                  data-readonly=${chip.readOnly ? 'true' : nothing}
                >
                  <span>${chip.label}</span>
                  ${!this.readOnly && !this.disabled && !chip.readOnly && !chip.disabled
                    ? html`<button
                        type="button"
                        class="select-chip-remove"
                        aria-label=${`Remove ${chip.label}`}
                        @click=${() => this.removeChip(chip.value)}
                      >${renderEmrSvgIcon('close', 12)}</button>`
                    : nothing}
                </span>`,
              )}
              ${triggerSummary.overflowCount > 0
                ? html`<span class="select-chip select-chip--overflow">+${triggerSummary.overflowCount}</span>`
                : nothing}
            </div>`
          : nothing}
        <button
          id=${id}
          type="button"
          part="control"
          class=${triggerCls}
          role="combobox"
          aria-expanded=${this.open}
          aria-haspopup="listbox"
          aria-busy=${this.loading ? 'true' : nothing}
          aria-activedescendant=${activeOpt ? this.optionDomId(id, activeOpt.value) : nothing}
          aria-label=${baseLabel ? `${baseLabel}, ${triggerSummary.text}` : triggerSummary.text}
          aria-required=${this.required ? 'true' : nothing}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          aria-invalid=${isInvalid ? 'true' : nothing}
          aria-describedby=${described || nothing}
          ?disabled=${this.disabled}
          @click=${() => this.toggleMenu()}
          @focus=${() => this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }))}
          @blur=${(e: FocusEvent) =>
            this.dispatchEvent(
              new CustomEvent('blurred', {
                detail: { relatedTarget: e.relatedTarget },
                bubbles: true,
                composed: true,
              }),
            )}
          @keydown=${(e: KeyboardEvent) => {
            if (!this.canEdit) return;
            if ((e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') && !this.open) {
              e.preventDefault();
              this.openMenu();
              if (e.key === 'End') {
                this.activeIndex = findNextEnabledEmrSelectOptionIndex(this.flatOptions, -1, 'End');
              }
              return;
            }
            this.handleTypeahead(e);
          }}
        >
          ${!this.multiple || (triggerSummary.visibleChips.length === 0 && triggerSummary.overflowCount === 0)
            ? html`<span class=${`select-trigger-text${triggerSummary.hasSelection ? '' : ' select-trigger-text--placeholder'}`}>${triggerSummary.text}</span>`
            : html`<span class="select-trigger-text"></span>`}
          <span class="select-chevron" aria-hidden="true">
            ${this.loading
              ? html`<svg class="select-spinner" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity="0.25" stroke-width="2"></circle>
                  <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                </svg>`
              : renderEmrSvgIcon(this.open ? 'chevron-up' : 'chevron-down', 16)}
          </span>
        </button>
        ${showClearBtn
          ? html`<button
              type="button"
              class="clear-inline-btn"
              data-clear-btn="true"
              data-emr-print="hide"
              aria-label=${`${this.clearLabel} ${baseLabel || 'selection'}`}
              @click=${() => this.clearSelection()}
            >${renderEmrSvgIcon('close', 14)}</button>`
          : nothing}
      </div>

      ${this.open && this.canEdit
        ? html`<div
            class=${`select-menu${this.tabularNums ? ' select-menu--tabular' : ''}`}
            popover="manual"
            part="listbox"
            role="listbox"
            aria-label=${baseLabel || 'Options'}
            aria-multiselectable=${this.multiple ? 'true' : nothing}
            style=${this.menuStyle}
            @keydown=${this.onMenuKeyDown}
          >
            ${this.loading
              ? html`<div class="select-state" role="status">
                  <svg class="select-spinner" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity="0.25" stroke-width="2"></circle>
                    <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                  </svg>
                  <span>Loading…</span>
                </div>`
              : this.options.length === 0
                ? html`<div class="select-state">${this.emptyMessage}</div>`
                : hasNamedGroups
                  ? groups.map((grp, gIdx) =>
                      grp.label
                        ? html`<div class="select-group" role="group" aria-labelledby=${`${id}-grp-${gIdx}`}>
                            <div class="select-group-header" id=${`${id}-grp-${gIdx}`}>${grp.label}</div>
                            ${grp.options.map(opt => this.renderOptionButton(id, opt))}
                          </div>`
                        : grp.options.map(opt => this.renderOptionButton(id, opt)),
                    )
                  : this.options.map(opt => this.renderOptionButton(id, opt))}
          </div>`
        : nothing}
    </div>`;

    if (this.labelHidden) {
      return html`<div class="emr-field">
        ${selectControl}
        ${this.error.trim()
          ? html`<span id=${msgId} class="emr-sr-only" role="alert">${this.error}</span>`
          : this.warning.trim()
            ? html`<span id=${msgId} class="emr-sr-only" role="status">${this.warning}</span>`
            : this.hint.trim()
              ? html`<span id=${msgId} class="emr-sr-only">${this.hint}</span>`
              : nothing}
      </div>`;
    }

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${selectControl}
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

export class EmrQuantityInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-quantity-input');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: Number }) value: number | null = null;
  @property({ type: String }) unit: string | null = null;
  @property({ attribute: false }) units: readonly EmrOption[] = [];
  @property({ type: String }) mode: EmrQuantityNumericMode = 'decimal';
  @property({ type: Number }) precision?: number;
  @property({ type: Number }) min?: number;
  @property({ type: Number }) max?: number;
  @property({ type: Number }) step?: number;
  @property({ type: Boolean }) showSteppers = true;
  @property({ type: String }) size: EmrQuantitySize = 'md';
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: String }) placeholder = '';
  @property({ type: String }) unitLabel = 'Unit';
  @property({ type: String }) unitPlaceholder = 'Unit';
  @property({ type: Boolean }) valueRequired?: boolean;
  @property({ type: Boolean }) unitRequired?: boolean;
  @property({ type: Boolean }) unitReadOnly = false;
  @property({ type: Boolean }) allowNegative?: boolean;
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) valueWarning = '';
  @property({ type: String }) unitWarning = '';
  @property({ type: String }) error = '';
  @property({ type: String }) valueError = '';
  @property({ type: String }) unitError = '';
  @property({ type: String }) ariaDescribedBy = '';
  @property({ type: Boolean }) clearEmitsChanges = true;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  @state() private numFocused = false;
  @state() private numDraft = '';
  private groupFocused = false;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private get effectiveAllowNegative(): boolean {
    if (this.allowNegative !== undefined) return this.allowNegative;
    return this.min === undefined || this.min < 0;
  }

  private isInsideGroup(target: EventTarget | null | undefined): boolean {
    let cur = target as Node | null;
    while (cur) {
      if (cur === this || cur === this.shadowRoot) return true;
      cur = cur.parentNode ?? (cur instanceof ShadowRoot ? cur.host : null);
    }
    return false;
  }

  private handleControlFocus(): void {
    if (!this.groupFocused) {
      this.groupFocused = true;
      this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
    }
  }

  private handleControlBlur(related: EventTarget | null | undefined): void {
    if (this.isInsideGroup(related)) return;
    if (this.groupFocused) {
      this.groupFocused = false;
      this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
    }
  }

  private get effectiveStep(): number {
    return resolveQuantityStep({ mode: this.mode, precision: this.precision, step: this.step });
  }

  private get domValue(): string {
    return this.value === null || this.value === undefined || Number.isNaN(this.value)
      ? ''
      : String(this.value);
  }

  private stepBy(delta: -1 | 1): void {
    if (this.locked) return;
    const next = stepQuantityValue({
      current: this.value,
      delta,
      mode: this.mode,
      precision: this.precision,
      step: this.step,
      min: this.min,
      max: this.max,
    });
    this.numFocused = false;
    this.numDraft = String(next);
    this.emitValueChange(next);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const hintId = `${id}-hint`;
    const warnId = `${id}-warning`;
    const errId = `${id}-error`;
    const numericInvalid = Boolean(this.error || this.valueError);
    const unitInvalid = Boolean(this.error || this.unitError);
    const numericWarning = !numericInvalid && Boolean(this.warning || this.valueWarning);
    const unitWarningActive = !unitInvalid && Boolean(this.warning || this.unitWarning);
    const combinedError = [this.error, this.valueError, this.unitError].filter(Boolean).join(' · ');
    const combinedWarning = [this.warning, this.valueWarning, this.unitWarning].filter(Boolean).join(' · ');
    const describedBy = this.labelHidden
      ? this.ariaDescribedBy || nothing
      : [
          this.hint ? hintId : '',
          combinedWarning && !combinedError ? warnId : '',
          combinedError ? errId : '',
        ]
          .filter(Boolean)
          .join(' ') || nothing;

    const maxW = this.size === 'sm' ? '300px' : this.size === 'lg' ? '400px' : '360px';
    const targetH = this.size === 'lg' ? '48px' : '44px';
    const cur = this.value;
    const step = this.effectiveStep;
    const canDec =
      !this.locked && (this.min === undefined || cur === null || cur === undefined || cur - step >= this.min - 1e-9);
    const canInc =
      !this.locked && (this.max === undefined || cur === null || cur === undefined || cur + step <= this.max + 1e-9);
    const displayed = !this.locked && this.numFocused ? this.numDraft : this.domValue;
    const canClear =
      this.clearable && !this.locked && (this.value !== null || (this.unit !== null && !this.unitReadOnly));

    const numBorder = numericInvalid
      ? 'var(--emr-danger)'
      : numericWarning
        ? 'var(--emr-warning)'
        : 'var(--emr-border)';
    const numBg = this.disabled
      ? 'var(--emr-surface-raised)'
      : this.readOnly
        ? 'var(--emr-surface-soft)'
        : 'var(--emr-surface)';
    const numBorderStyle = this.readOnly ? 'dashed' : 'solid';

    const numericControl = this.showSteppers
      ? html`<div
          class="stepper-wrap ${this.readOnly ? 'stepper-wrap--readonly' : ''}"
          data-invalid=${numericInvalid ? 'true' : nothing}
          data-warning=${numericWarning ? 'true' : nothing}
          style="width:auto;flex:1 1 168px;min-width:148px;min-height:${targetH};border-color:${numBorder};border-style:${numBorderStyle};background:${numBg};"
        >
          <button
            type="button"
            class="stepper-btn"
            style="min-width:${targetH};min-height:${targetH};"
            aria-label=${`Decrease ${this.label || 'value'}`}
            ?disabled=${this.disabled || this.readOnly || !canDec}
            aria-disabled=${this.readOnly ? 'true' : nothing}
            @focus=${() => this.handleControlFocus()}
            @blur=${(e: FocusEvent) => this.handleControlBlur(e.relatedTarget)}
            @click=${() => this.stepBy(-1)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3.5 8h9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
            </svg>
          </button>
          <input
            id=${`${id}-value`}
            class="stepper-input"
            type="text"
            role="spinbutton"
            inputmode=${this.mode === 'integer' ? 'numeric' : 'decimal'}
            aria-valuemin=${this.min ?? nothing}
            aria-valuemax=${this.max ?? nothing}
            aria-valuenow=${this.value ?? nothing}
            .value=${this.locked ? live(this.domValue) : displayed}
            placeholder=${this.placeholder}
            ?required=${this.valueRequired ?? this.required}
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            aria-readonly=${this.readOnly ? 'true' : nothing}
            aria-label=${`${this.label || 'Quantity'} value`}
            aria-invalid=${numericInvalid ? 'true' : nothing}
            data-warning=${numericWarning ? 'true' : nothing}
            aria-describedby=${describedBy}
            @wheel=${(e: WheelEvent) => {
              (e.currentTarget as HTMLInputElement).blur();
            }}
            @focus=${() => {
              this.numFocused = true;
              this.numDraft = this.domValue;
              this.handleControlFocus();
            }}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Enter' && !this.disabled) {
                this.dispatchEvent(new CustomEvent('submitted', { bubbles: true, composed: true }));
              } else if (e.key === 'ArrowUp' && !this.locked) {
                e.preventDefault();
                this.stepBy(1);
              } else if (e.key === 'ArrowDown' && !this.locked) {
                e.preventDefault();
                this.stepBy(-1);
              }
            }}
            @input=${(e: Event) => {
              const input = e.target as HTMLInputElement;
              if (this.locked) {
                input.value = this.domValue;
                return;
              }
              const allowNeg = this.effectiveAllowNegative;
              const clean = sanitizeQuantityText(input.value, this.mode, { allowNegative: allowNeg });
              if (input.value !== clean) input.value = clean;
              this.numDraft = clean;
              const parsed = parseQuantityDraft(clean, this.mode, { allowNegative: allowNeg });
              if (parsed === 'incomplete') return;
              this.emitValueChange(parsed);
            }}
            @blur=${(e: FocusEvent) => {
              this.numFocused = false;
              this.numDraft = this.domValue;
              (e.target as HTMLInputElement).value = this.domValue;
              this.handleControlBlur(e.relatedTarget);
            }}
          />
          <button
            type="button"
            class="stepper-btn"
            style="min-width:${targetH};min-height:${targetH};"
            aria-label=${`Increase ${this.label || 'value'}`}
            ?disabled=${this.disabled || this.readOnly || !canInc}
            aria-disabled=${this.readOnly ? 'true' : nothing}
            @focus=${() => this.handleControlFocus()}
            @blur=${(e: FocusEvent) => this.handleControlBlur(e.relatedTarget)}
            @click=${() => this.stepBy(1)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
            </svg>
          </button>
        </div>`
      : html`<input
          id=${`${id}-value`}
          class="emr-control"
          style="flex:1 1 168px;min-width:148px;min-height:${targetH};height:${targetH};border-color:${numBorder};border-style:${numBorderStyle};background:${numBg};"
          type="text"
          role="spinbutton"
          inputmode=${this.mode === 'integer' ? 'numeric' : 'decimal'}
          aria-valuemin=${this.min ?? nothing}
          aria-valuemax=${this.max ?? nothing}
          aria-valuenow=${this.value ?? nothing}
          .value=${this.locked ? live(this.domValue) : displayed}
          placeholder=${this.placeholder}
          ?required=${this.valueRequired ?? this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          aria-label=${`${this.label || 'Quantity'} value`}
          aria-invalid=${numericInvalid ? 'true' : nothing}
          data-warning=${numericWarning ? 'true' : nothing}
          aria-describedby=${describedBy}
          @wheel=${(e: WheelEvent) => {
            (e.currentTarget as HTMLInputElement).blur();
          }}
          @focus=${() => {
            this.numFocused = true;
            this.numDraft = this.domValue;
            this.handleControlFocus();
          }}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Enter' && !this.disabled) {
              this.dispatchEvent(new CustomEvent('submitted', { bubbles: true, composed: true }));
            }
          }}
          @input=${(e: Event) => {
            const input = e.target as HTMLInputElement;
            if (this.locked) {
              input.value = this.domValue;
              return;
            }
            const allowNeg = this.effectiveAllowNegative;
            const clean = sanitizeQuantityText(input.value, this.mode, { allowNegative: allowNeg });
            if (input.value !== clean) input.value = clean;
            this.numDraft = clean;
            const parsed = parseQuantityDraft(clean, this.mode, { allowNegative: allowNeg });
            if (parsed === 'incomplete') return;
            this.emitValueChange(parsed);
          }}
          @blur=${(e: FocusEvent) => {
            this.numFocused = false;
            this.numDraft = this.domValue;
            (e.target as HTMLInputElement).value = this.domValue;
            this.handleControlBlur(e.relatedTarget);
          }}
        />`;

    const row = html`<div style="display:flex;gap:8px;align-items:stretch;flex-wrap:wrap;width:100%;max-width:${maxW};">
      ${numericControl}
      <div style="flex:0 1 116px;min-width:88px;">
        <emr-select
          .controlId=${`${id}-unit`}
          .label=${this.label ? `${this.label} ${this.unitLabel || 'Unit'}` : this.unitLabel || 'Unit'}
          .labelHidden=${true}
          .placeholder=${this.unitPlaceholder || 'Unit'}
          .options=${this.units}
          .value=${this.unit}
          .size=${this.size === 'sm' ? 'sm' : 'md'}
          .required=${this.unitRequired ?? this.required}
          .error=${unitInvalid ? ' ' : ''}
          .warning=${unitWarningActive ? ' ' : ''}
          .disabled=${this.disabled}
          .readOnly=${this.readOnly || this.unitReadOnly}
          @focused=${(e: Event) => {
            e.stopPropagation();
            this.handleControlFocus();
          }}
          @blurred=${(e: CustomEvent<{ relatedTarget?: EventTarget | null }>) => {
            e.stopPropagation();
            this.handleControlBlur(e.detail?.relatedTarget);
          }}
          @valueChange=${(e: CustomEvent<string | null>) => {
            e.stopPropagation();
            if (!this.locked && !this.unitReadOnly) {
              this.dispatchEvent(
                new CustomEvent<string | null>('unitChange', {
                  detail: e.detail == null ? null : String(e.detail),
                  bubbles: true,
                  composed: true,
                }),
              );
            }
          }}
        ></emr-select>
      </div>
      ${canClear
        ? html`<button
            type="button"
            class="emr-btn clear-inline-btn"
            data-emr-print="hide"
            style="min-width:${targetH};min-height:${targetH};height:${targetH};padding:0;background:var(--emr-surface);border-color:var(--emr-border);color:var(--emr-text-muted);flex:0 0 auto;"
            aria-label=${`${this.clearLabel || 'Clear'} ${this.label || 'quantity'}`}
            @focus=${() => this.handleControlFocus()}
            @blur=${(e: FocusEvent) => this.handleControlBlur(e.relatedTarget)}
            @click=${() => {
              if (this.locked) return;
              this.numFocused = false;
              this.numDraft = '';
              if (this.clearEmitsChanges) {
                this.emitValueChange(null);
                if (!this.unitReadOnly && this.unit !== null) {
                  this.dispatchEvent(
                    new CustomEvent<string | null>('unitChange', { detail: null, bubbles: true, composed: true }),
                  );
                }
              }
              this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
            </svg>
          </button>`
        : nothing}
    </div>`;

    if (this.labelHidden) return row;

    return html`<div class="emr-field">
      ${this.label
        ? html`<label class="emr-label" for=${`${id}-value`}>${this.label}${this.required || this.valueRequired || this.unitRequired ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${row}
      ${this.hint ? html`<span id=${hintId} class="emr-hint">${this.hint}</span>` : nothing}
      ${combinedWarning && !combinedError
        ? html`<span id=${warnId} style="color:var(--emr-warning);font-size:var(--emr-text-xs);font-weight:600;" role="status">${combinedWarning}</span>`
        : nothing}
      ${combinedError ? html`<span id=${errId} class="emr-error" role="alert">${combinedError}</span>` : nothing}
    </div>`;
  }
}

export class EmrPairedInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-paired-input');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) firstLabel = '';
  @property({ type: String }) secondLabel = '';
  @property({ type: String }) firstValue: string | null = '';
  @property({ type: String }) secondValue: string | null = '';
  @property({ type: String }) firstPlaceholder = '';
  @property({ type: String }) secondPlaceholder = '';
  @property({ type: String }) inputType: 'text' | 'integer' | 'decimal' = 'text';
  @property({ type: String }) firstInputType?: 'text' | 'integer' | 'decimal';
  @property({ type: String }) secondInputType?: 'text' | 'integer' | 'decimal';
  @property({ type: Number }) min?: number;
  @property({ type: Number }) max?: number;
  @property({ type: Number }) firstMin?: number;
  @property({ type: Number }) firstMax?: number;
  @property({ type: Number }) secondMin?: number;
  @property({ type: Number }) secondMax?: number;
  @property({ type: Boolean }) firstRequired?: boolean;
  @property({ type: Boolean }) secondRequired?: boolean;
  @property({ type: String }) firstError = '';
  @property({ type: String }) secondError = '';
  @property({ type: String }) separator = '/';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const firstMode = this.firstInputType ?? this.inputType;
    const secondMode = this.secondInputType ?? this.inputType;
    const firstInvalid = Boolean(this.firstError || this.error);
    const secondInvalid = Boolean(this.secondError || this.error);
    const resolvedError = [this.error, this.firstError, this.secondError].filter(Boolean).join(' · ');

    const pairRow = html`<div style="display:flex;align-items:center;gap:8px;flex-wrap:nowrap;width:100%;">
      ${this.firstLabel ? html`<strong class="emr-muted" style="flex-shrink:0;">${this.firstLabel}</strong>` : nothing}
      <input
        id=${`${id}-first`}
        class="emr-control"
        style="flex:1 1 0;min-width:0;max-width:132px;"
        inputmode=${firstMode === 'integer' ? 'numeric' : firstMode === 'decimal' ? 'decimal' : nothing}
        placeholder=${this.firstPlaceholder}
        aria-label=${this.firstLabel ? `${this.label ? `${this.label}, ` : ''}${this.firstLabel}` : this.label || 'First value'}
        aria-invalid=${firstInvalid ? 'true' : nothing}
        ?required=${this.firstRequired ?? this.required}
        .value=${this.locked ? live(this.firstValue ?? '') : this.firstValue ?? ''}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        @blur=${(e: Event) => {
          (e.target as HTMLInputElement).value = this.firstValue ?? '';
        }}
        @input=${(e: Event) => {
          if (this.locked) {
            (e.target as HTMLInputElement).value = this.firstValue ?? '';
            return;
          }
          this.dispatchEvent(
            new CustomEvent('firstValueChange', {
              detail: (e.target as HTMLInputElement).value || null,
              bubbles: true,
              composed: true,
            }),
          );
        }}
      />
      <span class="emr-muted" aria-hidden="true" style="flex-shrink:0;">${this.separator}</span>
      ${this.secondLabel ? html`<strong class="emr-muted" style="flex-shrink:0;">${this.secondLabel}</strong>` : nothing}
      <input
        id=${`${id}-second`}
        class="emr-control"
        style="flex:1 1 0;min-width:0;max-width:132px;"
        inputmode=${secondMode === 'integer' ? 'numeric' : secondMode === 'decimal' ? 'decimal' : nothing}
        placeholder=${this.secondPlaceholder}
        aria-label=${this.secondLabel ? `${this.label ? `${this.label}, ` : ''}${this.secondLabel}` : this.label || 'Second value'}
        aria-invalid=${secondInvalid ? 'true' : nothing}
        ?required=${this.secondRequired ?? this.required}
        .value=${this.locked ? live(this.secondValue ?? '') : this.secondValue ?? ''}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        @blur=${(e: Event) => {
          (e.target as HTMLInputElement).value = this.secondValue ?? '';
        }}
        @input=${(e: Event) => {
          if (this.locked) {
            (e.target as HTMLInputElement).value = this.secondValue ?? '';
            return;
          }
          this.dispatchEvent(
            new CustomEvent('secondValueChange', {
              detail: (e.target as HTMLInputElement).value || null,
              bubbles: true,
              composed: true,
            }),
          );
        }}
      />
    </div>`;

    if (this.labelHidden) return pairRow;

    return html`<div class="emr-field">
      ${this.label
        ? html`<span class="emr-label">${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</span>`
        : nothing}
      ${pairRow}
      ${resolvedError
        ? html`<span id=${msgId} class="emr-error" role="alert">${resolvedError}</span>`
        : this.hint
          ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
          : nothing}
    </div>`;
  }
}

export class EmrCheckboxElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  protected readonly fallbackId = nextL1Id('emr-checkbox');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) description = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) labelPlacement: 'end' | 'start' | 'space-between' = 'end';
  @property({ type: String }) variant: 'tile' | 'inline' = 'tile';
  @property({ type: String }) size: 'md' | 'sm' = 'md';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: Boolean }) checked = false;
  @property() value: boolean | null | undefined = undefined;
  @property({ type: Boolean }) mixed = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) hasWarning = false;
  @property({ type: String }) ariaDescribedBy = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  protected get resolvedChecked(): boolean {
    return this.value !== undefined ? Boolean(this.value) : Boolean(this.checked);
  }

  protected emitCheckedToggle(): void {
    const next = this.mixed ? true : !this.resolvedChecked;
    this.dispatchEvent(
      new CustomEvent<boolean>('checkedChange', {
        detail: next,
        bubbles: true,
        composed: true,
      }),
    );
    this.emitValueChange(next);
  }

  protected resolveDescribedBy(id: string): string | typeof nothing {
    const ids: string[] = [];
    if (this.ariaDescribedBy) ids.push(this.ariaDescribedBy);
    if (this.hint) ids.push(`${id}-hint`);
    if (this.warning) ids.push(`${id}-warning`);
    if (this.error) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : nothing;
  }

  protected renderBooleanMessage(id = this.controlId || this.fallbackId) {
    if (!this.hint && !this.warning && !this.error) return nothing;
    return html`
      ${this.hint ? html`<span id=${`${id}-hint`} class="emr-hint">${this.hint}</span>` : nothing}
      ${this.warning
        ? html`<span id=${`${id}-warning`} class="emr-warning" role="status">${this.warning}</span>`
        : nothing}
      ${this.error
        ? html`<span id=${`${id}-error`} class="emr-error" role="alert">${this.error}</span>`
        : nothing}
    `;
  }

  protected resolvePlacementClass(): string {
    if (this.labelPlacement === 'start') return ' option-tile--placement-start';
    if (this.labelPlacement === 'space-between') return ' option-tile--placement-between';
    return '';
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const isChecked = this.resolvedChecked;
    const cls = `option-tile option-tile--checkbox${this.variant === 'inline' ? ' option-tile--inline' : ''}${this.size === 'sm' ? ' option-tile--sm' : ''}${this.readOnly ? ' option-tile--readonly' : ''}${this.resolvePlacementClass()}`;
    const ariaChecked = this.mixed ? 'mixed' : String(isChecked);
    const iconSize = this.size === 'sm' ? 11 : 12;
    const isInvalid = Boolean(this.invalid || this.error);
    const isWarning = !isInvalid && Boolean(this.hasWarning || this.warning);
    const button = html`<button
      id=${id}
      type="button"
      part="control"
      role="checkbox"
      data-label-placement=${this.labelPlacement}
      data-warning=${isWarning ? 'true' : nothing}
      class=${cls}
      style=${this.labelHidden ? 'align-items:center;justify-content:center;' : 'align-items:flex-start;'}
      aria-label=${this.ariaLabel || (this.labelHidden && this.label ? this.label : nothing)}
      aria-checked=${ariaChecked}
      aria-required=${this.required ? 'true' : nothing}
      aria-readonly=${this.readOnly ? 'true' : nothing}
      aria-invalid=${isInvalid ? 'true' : nothing}
      aria-describedby=${this.resolveDescribedBy(id)}
      ?disabled=${this.disabled}
      @focus=${() => {
        this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
      }}
      @blur=${() => {
        this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
      }}
      @click=${() => {
        if (this.readOnly || this.disabled) return;
        this.emitCheckedToggle();
      }}
    >
      <span class="indicator" style=${this.labelHidden ? 'margin-top:0;' : 'margin-top:2px;'} aria-hidden="true">
        ${this.mixed ? renderEmrSvgIcon('minus', iconSize) : isChecked ? renderEmrSvgIcon('check', iconSize) : nothing}
      </span>
      ${this.labelHidden
        ? nothing
        : html`<span class="option-tile-copy">
            <span>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}<slot></slot></span>
            ${this.description ? html`<span class="option-tile-desc">${this.description}</span>` : nothing}
          </span>`}
    </button>`;

    if (this.labelHidden && !this.hint && !this.warning && !this.error) return button;

    return html`<div class="emr-field" part="field">
      ${button}
      ${this.renderBooleanMessage(id)}
    </div>`;
  }
}

export class EmrToggleElement extends EmrCheckboxElement {
  @property({ type: String }) onLabel = '';
  @property({ type: String }) offLabel = '';
  @property({ type: Boolean }) loading = false;

  protected override get resolvedChecked(): boolean {
    return resolveEmrToggleChecked(this.value, this.checked);
  }

  protected override emitCheckedToggle(): void {
    const next = resolveEmrToggleNext(this.resolvedChecked);
    this.dispatchEvent(
      new CustomEvent<boolean>('checkedChange', {
        detail: next,
        bubbles: true,
        composed: true,
      }),
    );
    this.emitValueChange(next);
  }

  private handleSwitchKeyDown(event: KeyboardEvent): void {
    if (!canMutateEmrToggle(this.readOnly, this.disabled, this.loading)) {
      if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter') {
        event.preventDefault();
      }
    }
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const isChecked = this.resolvedChecked;
    const variant = normalizeEmrToggleVariant(this.variant);
    const size = normalizeEmrToggleSize(this.size);
    const placement = normalizeEmrToggleLabelPlacement(this.labelPlacement);
    const validation = resolveEmrToggleValidationState({
      error: this.error,
      warning: this.warning,
      invalid: this.invalid,
    });
    const placementCls =
      placement === 'start'
        ? ' option-tile--placement-start'
        : placement === 'space-between'
          ? ' option-tile--placement-between'
          : '';
    const cls = `option-tile${variant === 'inline' ? ' option-tile--inline' : ''}${size === 'sm' ? ' option-tile--sm' : ''}${this.readOnly ? ' option-tile--readonly' : ''}${placementCls}`;
    const stateLabel = isChecked ? this.onLabel : this.offLabel;
    const stateNode = !this.labelHidden && stateLabel
      ? html`<span class="toggle-state-label" style="font-size:var(--emr-text-xs);font-weight:700;color:${isChecked ? 'var(--emr-primary)' : 'var(--emr-text-muted)'};">${stateLabel}</span>`
      : nothing;
    const trackNode = html`<span class="switch-track" part="track" aria-hidden="true">
      <span class="switch-thumb" part="thumb">
        ${this.loading
          ? html`<svg class="switch-spinner" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-opacity="0.25" stroke-width="2" />
              <path d="M13.5 8a5.5 5.5 0 0 0-5.5-5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>`
          : nothing}
      </span>
    </span>`;
    const cluster = html`<span style="display:inline-flex;align-items:center;gap:8px;flex-shrink:0;" aria-hidden="true">
      ${placement === 'end' ? html`${trackNode}${stateNode}` : html`${stateNode}${trackNode}`}
    </span>`;
    const button = html`<button
      id=${id}
      type="button"
      part="control"
      role="switch"
      data-label-placement=${placement}
      data-warning=${validation.hasWarning ? 'true' : nothing}
      data-invalid=${validation.isInvalid ? 'true' : nothing}
      data-loading=${this.loading ? 'true' : nothing}
      data-label-hidden=${this.labelHidden ? 'true' : nothing}
      class=${cls}
      aria-label=${this.ariaLabel || (this.labelHidden && this.label ? this.label : nothing)}
      aria-checked=${resolveEmrToggleAriaChecked(isChecked)}
      aria-required=${this.required ? 'true' : nothing}
      aria-readonly=${this.readOnly ? 'true' : nothing}
      aria-busy=${this.loading ? 'true' : nothing}
      aria-invalid=${validation.isInvalid ? 'true' : nothing}
      aria-describedby=${this.labelHidden ? nothing : this.resolveDescribedBy(id)}
      ?disabled=${this.disabled}
      @focus=${() => {
        this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
      }}
      @blur=${() => {
        this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
      }}
      @keydown=${this.handleSwitchKeyDown}
      @click=${() => {
        if (!canMutateEmrToggle(this.readOnly, this.disabled, this.loading)) return;
        this.emitCheckedToggle();
      }}
    >
      ${cluster}
      ${this.labelHidden
        ? nothing
        : html`<span class="option-tile-copy">
            <span>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}<slot></slot></span>
            ${this.description ? html`<span class="option-tile-desc">${this.description}</span>` : nothing}
          </span>`}
    </button>`;

    if (this.labelHidden) return button;

    return html`<div class="emr-field" part="field">
      ${button}
      ${this.renderBooleanMessage(id)}
    </div>`;
  }
}

export class EmrRadioGroupElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-radio-group');

  @property({ type: String }) controlId = '';
  @property({ type: String }) name = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = null;
  @property({ attribute: false }) options: readonly EmrOption[] = [];
  @property({ type: String }) orientation: EmrRadioGroupOrientation = 'vertical';
  @property({ type: Number }) columns = 2;
  @property({ type: String }) variant: EmrRadioGroupVariant | 'standard' = 'tile';
  @property({ type: String }) size: EmrRadioGroupSize = 'md';
  @property({ type: String }) labelPlacement: EmrRadioGroupLabelPlacement = 'end';
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: Boolean }) allowDeselect = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  private hasFocus = false;

  private clearSelection(): void {
    if (this.readOnly || this.disabled) return;
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.emitValueChange(null);
  }

  private renderOptionBadge(opt: EmrOption) {
    const b = opt.badge;
    if (!b) return nothing;
    const text = typeof b === 'string' ? b : b.label ?? (b.count !== undefined ? String(b.count) : null);
    if (!text) return nothing;
    const tone = (typeof b === 'object' && b.tone) || opt.tone || 'neutral';
    const variant = (typeof b === 'object' && b.variant) || 'soft';
    return html`<span class=${`emr-badge emr-badge--${tone} emr-badge--${variant} emr-badge--sm`}>${text}</span>`;
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const hintId = `${id}-hint`;
    const warnId = `${id}-warning`;
    const errId = `${id}-error`;
    const isInvalid = Boolean(this.error || this.invalid);
    const isWarning = !isInvalid && Boolean(this.warning);
    const normalizedVariant = normalizeRadioGroupVariant(this.variant);
    const isSegmented = normalizedVariant === 'segmented';
    const describedBy = this.labelHidden
      ? nothing
      : [this.hint ? hintId : '', this.warning ? warnId : '', this.error ? errId : '']
          .filter(Boolean)
          .join(' ') || nothing;

    const isPillHorizontal = normalizedVariant === 'pill' && this.orientation === 'horizontal';
    const gridStyle =
      isPillHorizontal
        ? ''
        : this.orientation === 'vertical'
          ? '--cols: 1;'
          : this.orientation === 'grid'
            ? `--cols: ${Math.max(1, this.columns)};`
            : '';
    const showClear = canClearRadioGroupValue(
      this.value,
      this.options,
      this.clearable,
      this.readOnly,
      this.disabled,
    );
    const clearBtn = showClear
      ? html`<button
          type="button"
          class="clear-inline-btn"
          style="min-height:44px;min-width:44px;display:inline-flex;align-items:center;gap:6px;"
          data-clear-btn="true"
          aria-label=${`${this.clearLabel} ${this.label || 'selection'}`}
          @click=${() => this.clearSelection()}
        >${renderEmrSvgIcon('close', 14)}<span>${this.clearLabel}</span></button>`
      : nothing;

    const activeTabTarget = resolveRadioGroupTabStopValue(this.options, this.value, this.disabled);
    const groups = groupOptions(this.options);
    const containerClass = isSegmented
      ? 'radio-segmented'
      : isPillHorizontal
        ? 'option-grid--pills'
        : 'option-grid';

    const grid = html`<div
      id=${id}
      role="radiogroup"
      aria-label=${this.ariaLabel || this.label || 'Options'}
      aria-orientation=${this.orientation === 'horizontal' ? 'horizontal' : 'vertical'}
      aria-required=${this.required ? 'true' : nothing}
      aria-disabled=${this.disabled ? 'true' : nothing}
      aria-readonly=${this.readOnly ? 'true' : nothing}
      aria-invalid=${isInvalid ? 'true' : nothing}
      aria-describedby=${describedBy}
      class=${containerClass}
      data-orientation=${this.orientation}
      data-variant=${normalizedVariant}
      data-warning=${isWarning ? 'true' : nothing}
      style=${gridStyle}
      @focusin=${() => {
        if (!this.hasFocus) {
          this.hasFocus = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
      }}
      @focusout=${(e: FocusEvent) => {
        const cur = e.currentTarget as HTMLElement | null;
        const rel = e.relatedTarget as Node | null;
        if (!cur || !rel || !cur.contains(rel)) {
          this.hasFocus = false;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }
      }}
      @keydown=${(e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        const val = target?.getAttribute('data-value');
        const curOpt = val ? this.options.find((o) => o.value === val) : undefined;
        if (
          e.key === 'ArrowDown' ||
          e.key === 'ArrowRight' ||
          e.key === 'ArrowUp' ||
          e.key === 'ArrowLeft'
        ) {
          e.preventDefault();
          const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
          const curIdx = val ? this.options.findIndex((o) => o.value === val) : -1;
          const nextIdx = moveRadioGroupFocusIndex(this.options, curIdx, dir, this.disabled);
          if (nextIdx >= 0) {
            const nextOpt = this.options[nextIdx]!;
            const nextBtn = Array.from(
              this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button[role="radio"]') ?? [],
            ).find((b) => b.getAttribute('data-value') === nextOpt.value);
            nextBtn?.focus();
            if (!this.readOnly && !this.disabled && !isRadioOptionLocked(nextOpt) && this.value !== nextOpt.value) {
              this.emitValueChange(nextOpt.value);
            }
          }
          return;
        }
        if ((e.key === ' ' || e.key === 'Enter') && curOpt) {
          if (this.readOnly || this.disabled || isRadioOptionLocked(curOpt)) {
            e.preventDefault();
            return;
          }
          if (e.key === ' ' && this.allowDeselect && this.value === curOpt.value) {
            e.preventDefault();
            this.clearSelection();
            return;
          }
          if (this.value !== curOpt.value) {
            e.preventDefault();
            this.emitValueChange(curOpt.value);
          }
        }
      }}
    >
      ${groups.map((grp) => html`
        ${grp.label ? html`<div class="emr-muted" style="grid-column:1/-1;font-size:var(--emr-text-xs);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-top:4px;">${grp.label}</div>` : nothing}
        ${grp.options.map((opt) => {
          const sel = this.value === opt.value;
          const optDisabled = Boolean(this.disabled || opt.disabled);
          const optReadOnly = Boolean(this.readOnly || opt.readOnly);
          const sizeCls = this.size === 'sm' ? ' option-tile--sm' : '';
          const placementCls =
            this.labelPlacement === 'start'
              ? ' option-tile--placement-start'
              : this.labelPlacement === 'space-between'
                ? ' option-tile--placement-between'
                : '';
          const variantCls = isSegmented
            ? ''
            : normalizedVariant === 'inline'
              ? ' option-tile--inline'
              : normalizedVariant === 'card'
                ? ' option-tile--card'
                : normalizedVariant === 'pill'
                  ? ' option-tile--pill'
                  : '';
          const baseCls = isSegmented ? 'radio-segment' : 'option-tile';
          const cls = `${baseCls}${optReadOnly ? ' option-tile--readonly' : ''}${variantCls}${sizeCls}${placementCls}`;
          const tabIdx = optDisabled ? -1 : opt.value === activeTabTarget ? 0 : -1;
          return html`<button
            type="button"
            role="radio"
            data-value=${opt.value}
            data-tone=${opt.tone || nothing}
            tabindex=${tabIdx}
            class=${cls}
            aria-checked=${String(sel)}
            aria-readonly=${optReadOnly ? 'true' : nothing}
            aria-invalid=${isInvalid ? 'true' : nothing}
            data-warning=${isWarning ? 'true' : nothing}
            ?disabled=${optDisabled}
            @click=${() => {
              if (optReadOnly || optDisabled) return;
              if (sel && this.allowDeselect) {
                this.clearSelection();
                return;
              }
              if (!sel) {
                this.emitValueChange(String(opt.value));
              }
            }}
          >
            ${isSegmented
              ? nothing
              : html`<span class="indicator indicator--radio" aria-hidden="true">${sel ? html`<span class="radio-dot"></span>` : nothing}</span>`}
            <span class="option-tile-copy">
              <span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span>${opt.label}</span>
                ${this.renderOptionBadge(opt)}
              </span>
              ${opt.description ? html`<span class="option-tile-desc">${opt.description}</span>` : nothing}
            </span>
          </button>`;
        })}
      `)}
    </div>`;

    if (this.labelHidden) {
      return showClear ? html`<div class="emr-field">${grid}${clearBtn}</div>` : grid;
    }

    return html`<div class="emr-field">
      ${this.label || showClear
        ? html`<div class="emr-header">
            ${this.label
              ? html`<span class="emr-label">${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</span>`
              : html`<span></span>`}
            ${clearBtn}
          </div>`
        : nothing}
      ${grid}
      ${this.hint ? html`<span id=${hintId} class="emr-hint">${this.hint}</span>` : nothing}
      ${this.warning ? html`<span id=${warnId} class="emr-warning" role="status">${this.warning}</span>` : nothing}
      ${this.error ? html`<span id=${errId} class="emr-error" role="alert">${this.error}</span>` : nothing}
    </div>`;
  }
}

export class EmrBadgeElement extends EmrLitElement {
  static override styles = [
    emrShadowStyles,
    l1Styles,
    css`:host { display: inline-flex; vertical-align: middle; max-width: 100%; }`,
  ];
  @property({ type: String }) tone: EmrTone = 'neutral';
  @property({ type: String }) label = '';
  @property({ attribute: false }) badge?: EmrBadge;
  @property({ type: String }) variant: EmrBadgeVariant = 'soft';
  @property({ type: String }) size: EmrBadgeSize = 'md';
  @property({ type: String }) shape: EmrBadgeShape = 'pill';
  @property({ type: String }) icon = '';
  @property({ type: Boolean }) dot = false;
  @property({ type: Number }) count?: number;
  @property({ type: Number }) maxCount = 99;
  @property({ type: Boolean }) showZero = false;
  @property({ type: String }) assistiveText = '';
  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) tabularNums = false;

  override render() {
    const tone = normalizeEmrBadgeTone(this.badge?.tone ?? this.tone);
    const variant = normalizeEmrBadgeVariant(this.badge?.variant ?? this.variant);
    const size = normalizeEmrBadgeSize(this.badge?.size ?? this.size);
    const shape = normalizeEmrBadgeShape(this.badge?.shape ?? this.shape);
    const text = this.badge?.label ?? this.label;
    const rawIcon = this.badge?.icon ?? this.icon;
    const icon = rawIcon && rawIcon !== 'none' ? rawIcon : '';
    const dot = Boolean(this.badge?.dot ?? this.dot);
    const assistiveText = this.badge?.assistiveText ?? this.assistiveText;
    const countInfo = formatEmrBadgeCount(
      this.badge?.count ?? this.count,
      this.badge?.maxCount ?? this.maxCount,
      this.badge?.showZero ?? this.showZero,
    );
    if (!countInfo.visible && !text && !dot) return nothing;
    const dotOnly = dot && countInfo.text === null && !text && this.childNodes.length === 0;
    const cls = `emr-badge emr-badge--${tone} emr-badge--${variant}${size === 'sm' ? ' emr-badge--sm' : ''}${shape === 'rounded' ? ' emr-badge--rounded' : ''}${dotOnly ? ' emr-badge--dot-only' : ''}`;
    return html`<span
      id=${this.controlId || nothing}
      part="badge"
      class=${cls}
      style=${this.tabularNums ? 'font-variant-numeric: tabular-nums' : nothing}
      role=${dotOnly ? 'img' : nothing}
      aria-label=${dotOnly ? assistiveText || 'Status indicator' : nothing}
    >
      ${dot && !dotOnly ? html`<span class="emr-badge__dot" aria-hidden="true"></span>` : nothing}
      ${icon ? renderEmrSvgIcon(icon as Parameters<typeof renderEmrSvgIcon>[0], size === 'sm' ? 11 : 13) : nothing}
      ${countInfo.text !== null
        ? html`<span class="emr-badge__count">${countInfo.text}</span>`
        : text
          ? text
          : dotOnly
            ? nothing
            : html`<slot></slot>`}
      ${!dotOnly && assistiveText ? html`<span class="sr-only"> ${assistiveText}</span>` : nothing}
    </span>`;
  }
}

export class EmrChipElement extends EmrBadgeElement {
  @property({ type: String }) override ariaLabel = '';
  @property({ type: String }) leadingIcon = '';
  @property({ type: String }) avatar = '';
  @property({ type: Boolean }) selectable = false;
  @property({ type: Boolean }) selected = false;
  @property({ type: Boolean }) removable = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: String }) removeLabel = '';

  override render() {
    const tone = normalizeEmrChipTone(this.badge?.tone ?? this.tone);
    const variant = normalizeEmrChipVariant(this.badge?.variant ?? this.variant);
    const size = normalizeEmrChipSize(this.badge?.size ?? this.size);
    const text = this.badge?.label ?? this.label;
    const interactive = this.selectable || this.removable;
    const iconName = (this.leadingIcon || this.icon) && (this.leadingIcon || this.icon) !== 'none'
      ? (this.leadingIcon || this.icon)
      : this.selectable && this.selected
        ? 'check'
        : '';
    const resolvedRemoveLabel = resolveEmrChipRemoveLabel(this.removeLabel, text);
    const canMutate = canMutateEmrChip(this.disabled, this.readOnly);

    const cls = [
      'emr-chip',
      `emr-badge--${tone}`,
      `emr-badge--${variant}`,
      size === 'sm' ? 'emr-chip--sm' : '',
      interactive ? 'emr-chip--interactive' : '',
      this.selectable && this.selected ? 'emr-chip--selected' : '',
      this.readOnly ? 'emr-chip--readonly' : '',
      this.disabled ? 'emr-chip--disabled' : '',
      this.removable ? 'chip-removable' : '',
    ].filter(Boolean).join(' ');

    const inner = html`
      ${this.avatar ? html`<span class="emr-chip__avatar" aria-hidden="true">${this.avatar}</span>` : nothing}
      ${iconName ? html`<span aria-hidden="true" style="display:inline-flex;align-items:center;">${renderEmrSvgIcon(iconName as Parameters<typeof renderEmrSvgIcon>[0], 13)}</span>` : nothing}
      <span>${text}<slot></slot></span>
    `;

    return html`<span part="chip" id=${this.controlId || nothing} class=${cls}>
      ${this.selectable
        ? html`<button
            type="button"
            class="emr-chip__trigger"
            ?disabled=${this.disabled}
            aria-pressed=${String(this.selected)}
            aria-readonly=${this.readOnly ? 'true' : nothing}
            aria-disabled=${this.disabled ? 'true' : nothing}
            aria-label=${this.ariaLabel || nothing}
            @click=${() => {
              if (!canMutate) return;
              this.dispatchEvent(new CustomEvent<boolean>('selectedChange', { detail: !this.selected, bubbles: true, composed: true }));
            }}
          >${inner}</button>`
        : html`<span class="emr-chip__body">${inner}</span>`}
      ${this.removable
        ? html`<button
            type="button"
            class="chip-remove-btn"
            style="min-width:44px;min-height:44px;"
            aria-label=${resolvedRemoveLabel}
            aria-readonly=${this.readOnly ? 'true' : nothing}
            ?disabled=${this.disabled}
            @click=${(e: Event) => {
              e.stopPropagation();
              if (!canMutate) return;
              this.dispatchEvent(new CustomEvent('removeRequested', { bubbles: true, composed: true }));
            }}
          >${renderEmrSvgIcon('close', 12)}</button>`
        : nothing}
    </span>`;
  }
}

export class EmrAlertElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) tone: EmrTone = 'info';
  @property({ type: String }) override title = '';
  @property({ type: String }) message = '';

  override render() {
    const glyph =
      this.tone === 'info'
        ? 'ℹ'
        : this.tone === 'success'
          ? '✓'
          : this.tone === 'warning'
            ? '⚠'
            : this.tone === 'danger'
              ? '!'
              : '';
    const softVar =
      this.tone === 'neutral' ? '--emr-neutral-soft' : `--emr-${this.tone}-soft`;
    return html`<div
      role=${this.tone === 'danger' ? 'alert' : 'status'}
      class="emr-alert emr-badge--${this.tone}"
      style="display:flex;align-items:${this.title ? 'flex-start' : 'center'};gap:10px;background:color-mix(in srgb, var(${softVar}, var(--emr-surface-soft)) 78%, transparent);backdrop-filter:blur(10px) saturate(140%);-webkit-backdrop-filter:blur(10px) saturate(140%);border:0;border-right:1px solid currentColor;border-bottom:2px solid currentColor;border-radius:2px;padding:12px;"
    >
      ${glyph ? html`<span aria-hidden="true" style="font-size:var(--emr-text-md);font-weight:700;line-height:1.3;">${glyph}</span>` : nothing}
      <div style="flex:1;min-width:0;">
        ${this.title ? html`<div style="font-size:var(--emr-text-md);font-weight:700;">${this.title}</div>` : nothing}
        ${this.message ? html`<div style="color:var(--emr-text-muted);font-size:var(--emr-text-md);">${this.message}</div>` : nothing}
        <div style="color:var(--emr-text-muted);font-size:var(--emr-text-md);"><slot></slot></div>
      </div>
    </div>`;
  }
}

export class EmrStateMessageElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) controlId = '';
  @property({ type: String }) override title = '';
  @property({ type: String }) kind: EmrStateMessageKind = 'empty';
  @property({ type: String }) message = '';
  @property({ type: String }) size: EmrStateMessageSize = 'md';
  @property({ type: Boolean }) compact = false;
  @property({ type: String }) icon = '';
  @property({ type: String }) actionLabel = '';
  @property({ type: Boolean }) actionDisabled = false;

  @property({ type: String })
  get state(): EmrStateMessageKind {
    return this.kind;
  }
  set state(next: string) {
    this.kind = normalizeEmrStateMessageKind(next);
  }

  @property({ type: String })
  get description(): string {
    return this.message;
  }
  set description(next: string) {
    this.message = next;
  }

  override render() {
    const resolvedKind = normalizeEmrStateMessageKind(this.kind);
    const resolvedSize = normalizeEmrStateMessageSize(this.size, this.compact);
    const resolvedTitle = resolveEmrStateMessageTitle(resolvedKind, this.title);
    const role = resolveEmrStateMessageRole(resolvedKind);
    const iconName = this.icon === 'none'
      ? ''
      : this.icon
        ? this.icon
        : resolvedKind === 'loading'
          ? 'loading'
          : resolvedKind === 'error'
            ? 'danger'
            : 'info';
    const iconSize = resolvedSize === 'sm' ? 20 : 24;

    return html`<div
      id=${this.controlId || nothing}
      class=${`emr-state-message${resolvedSize === 'sm' ? ' emr-state-message--compact' : ''}`}
      role=${role}
    >
      ${iconName === 'loading'
        ? html`<span class="emr-state-message__spinner" aria-hidden="true"></span>`
        : iconName
          ? html`<span class=${`emr-state-message__icon${resolvedKind === 'error' ? ' emr-state-message__icon--danger' : ''}`} aria-hidden="true">${renderEmrSvgIcon(iconName as Parameters<typeof renderEmrSvgIcon>[0], iconSize)}</span>`
          : nothing}
      <strong class="emr-state-message__title">${resolvedTitle}</strong>
      ${this.message ? html`<p class="emr-state-message__message">${this.message}</p>` : nothing}
      ${this.actionLabel
        ? html`<button
            type="button"
            class="emr-state-message__action"
            ?disabled=${this.actionDisabled}
            @click=${() => {
              if (!this.actionDisabled) {
                this.dispatchEvent(new CustomEvent('actionTriggered', { bubbles: true, composed: true }));
              }
            }}
          >${this.actionLabel}</button>`
        : nothing}
      <slot></slot>
    </div>`;
  }
}

export class EmrSearchSelectElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-search-select');
  @state() private isActivelyTyping = false;
  @state() private localOpen = false;
  @state() private activeIndex = -1;
  private _controlledOpen: boolean | undefined = undefined;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: String }) ariaDescribedBy = '';
  @property({ type: Boolean }) fullWidth = false;
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) placeholder = 'Type to search';
  @property({ type: String }) variant: EmrControlVariant = 'outline';
  @property({ type: String }) size: EmrSearchSelectSize | 'lg' = 'md';

  @property({ type: Boolean }) multiple = false;
  @property({ attribute: false }) value: string | readonly string[] | null = null;
  @property({ attribute: false }) selected: readonly EmrOption[] = [];
  @property({ attribute: false }) options: readonly EmrOption[] = [];
  @property({ type: Number }) maxSelections?: number;
  @property({ type: Number }) maxTagCount?: number;
  @property({ attribute: false }) closeOnSelect?: boolean;
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';

  @property({ type: String }) query = '';
  @property({ type: String }) searchQuery?: string;
  @property({ type: String }) filterMode: EmrSearchSelectFilterMode = 'remote';
  @property({ type: Boolean }) highlightMatch = true;
  @property({ type: Boolean }) autoHighlight = true;
  @property({ type: Number }) debounceMs = 200;
  @property({ type: Number }) minQueryLength = 0;
  @property({ attribute: false })
  get open(): boolean {
    return this._controlledOpen !== undefined ? this._controlledOpen : this.localOpen;
  }
  set open(value: boolean | undefined) {
    const old = this.open;
    this._controlledOpen = value === undefined ? undefined : Boolean(value);
    this.requestUpdate('open', old);
  }

  @property({ type: Boolean }) creatable = false;
  @property({ type: Boolean }) allowCreate = false;
  @property({ type: Boolean }) allowCustomValue = false;
  @property({ type: String }) createLabel = 'Create "{query}"';

  @property({ type: Boolean }) loading = false;
  @property({ type: String }) loadingMessage = 'Searching…';
  @property({ type: String }) emptyMessage = 'No matching options';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private get isCreatable(): boolean {
    return Boolean(this.creatable || this.allowCreate || this.allowCustomValue);
  }

  private get resolvedCloseOnSelect(): boolean {
    return this.closeOnSelect ?? !this.multiple;
  }

  private get activeQuery(): string {
    return this.searchQuery !== undefined ? this.searchQuery : this.query;
  }

  private get isPanelOpen(): boolean {
    if (this.locked) return false;
    return this._controlledOpen !== undefined ? this._controlledOpen : this.localOpen;
  }

  private get rankedOptions(): readonly EmrScoredOption[] {
    return rankAndFilterOptions(this.options, this.activeQuery, this.filterMode);
  }

  private get visibleOptions(): readonly EmrOption[] {
    return this.rankedOptions.map(entry => entry.option);
  }

  private get selectedValues(): readonly string[] {
    return resolveSearchSelectValues(this.multiple, this.value, this.selected);
  }

  private get selectedChips(): readonly EmrOption[] {
    const vals = this.selectedValues;
    if (!vals.length) return this.selected;
    const byVal = new Map<string, EmrOption>();
    for (const o of this.selected) byVal.set(o.value, o);
    for (const o of this.options) if (!byVal.has(o.value)) byVal.set(o.value, o);
    return vals.map(v => byVal.get(v) ?? { value: v, label: v });
  }

  private setPanelOpen(next: boolean): void {
    if (this._controlledOpen === undefined) {
      this.localOpen = next;
    }
    if (next) {
      const flat = groupOptions(this.visibleOptions).flatMap(g => g.options);
      this.activeIndex = resolveDefaultActiveOptionIndex(
        flat,
        this.selectedValues,
        this.activeQuery,
        this.autoHighlight,
      );
    } else {
      this.activeIndex = -1;
    }
    this.dispatchEvent(new CustomEvent<boolean>('openChange', { detail: next, bubbles: true, composed: true }));
    this.request(next ? 'openRequested' : 'closeRequested');
  }

  private onOutsidePointerDown = (event: Event): void => {
    if (!this.isPanelOpen || this.locked) return;
    if (!event.composedPath().includes(this)) {
      this.isActivelyTyping = false;
      this.setPanelOpen(false);
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', this.onOutsidePointerDown, true);
    }
  }

  override disconnectedCallback(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', this.onOutsidePointerDown, true);
    }
    super.disconnectedCallback();
  }

  private request(type: 'openRequested' | 'closeRequested' | 'searchRequested' | 'removeRequested', detail?: string): void {
    if (this.locked || (type === 'searchRequested' && this.loading)) return;
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
    if (type === 'removeRequested' && detail !== undefined) {
      this.dispatchEvent(new CustomEvent<string>('selectionRemoved', { detail, bubbles: true, composed: true }));
    }
  }

  private emitMultiOrSingleValue(next: string | readonly string[] | null): void {
    this.dispatchEvent(
      new CustomEvent<string | readonly string[] | null>('valueChange', {
        detail: next,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private commitCustomQuery(rawQuery: string): void {
    if (this.locked || !this.isCreatable) return;
    const candidate = resolveCustomSearchCandidate(rawQuery, this.options, true, this.minQueryLength);
    if (!candidate) return;
    this.isActivelyTyping = false;
    if (this.filterMode !== 'remote') {
      this.query = '';
    }
    this.dispatchEvent(new CustomEvent<string>('createRequested', { detail: candidate, bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent<string>('customValueCommitted', { detail: candidate, bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent<string>('optionSelected', { detail: candidate, bubbles: true, composed: true }));
    if (this.multiple) {
      const next = this.selectedValues.includes(candidate) ? this.selectedValues : [...this.selectedValues, candidate];
      this.emitMultiOrSingleValue(next);
    } else {
      this.emitMultiOrSingleValue(candidate);
    }
    if (this.resolvedCloseOnSelect) {
      this.setPanelOpen(false);
    }
  }

  private clearAll(): void {
    if (this.locked) return;
    this.isActivelyTyping = false;
    if (this.filterMode !== 'remote') {
      this.query = '';
    }
    this.dispatchEvent(new CustomEvent<string>('queryChange', { detail: '', bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent<string>('queryChanged', { detail: '', bubbles: true, composed: true }));
    if (this.multiple) {
      const preserved = this.selectedChips.filter(item => item.readOnly).map(item => item.value);
      this.emitMultiOrSingleValue(preserved.length ? preserved : []);
    } else {
      const currentOpt = this.selectedChips[0];
      if (!currentOpt?.readOnly) {
        this.emitMultiOrSingleValue(null);
      }
    }
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.setPanelOpen(false);
  }

  private selectSearchOption(option: EmrOption): void {
    if (this.locked || option.disabled || option.readOnly) return;
    this.isActivelyTyping = false;
    if (this.filterMode !== 'remote') {
      this.query = '';
    }
    if (this.multiple) {
      const current = this.selectedValues;
      const exists = current.includes(option.value);
      if (!exists && typeof this.maxSelections === 'number' && this.maxSelections >= 1 && current.length >= this.maxSelections) {
        return;
      }
      const next = exists ? current.filter(v => v !== option.value) : [...current, option.value];
      if (exists) {
        this.request('removeRequested', option.value);
      } else {
        this.dispatchEvent(new CustomEvent<string>('optionSelected', { detail: option.value, bubbles: true, composed: true }));
      }
      this.emitMultiOrSingleValue(next);
    } else {
      this.dispatchEvent(new CustomEvent<string>('optionSelected', { detail: option.value, bubbles: true, composed: true }));
      this.emitMultiOrSingleValue(option.value);
    }
    if (this.resolvedCloseOnSelect) {
      this.setPanelOpen(false);
    }
  }

  private renderHighlightedText(raw: string) {
    if (!this.highlightMatch) return raw;
    const segments: readonly EmrMatchHighlightSegment[] = splitMatchHighlightSegments(raw, this.activeQuery);
    return segments.map(seg =>
      seg.matched ? html`<mark class="emr-match-highlight">${seg.text}</mark>` : seg.text,
    );
  }

  private renderSearchOption(option: EmrOption, idx: number, baseId: string, bestMatchVal: string | null) {
    const isSel = isSearchOptionSelected(option.value, this.value, this.selectedChips);
    const isActive = this.activeIndex === idx;
    const isBest = bestMatchVal === option.value;
    const isMaxBlocked =
      this.multiple &&
      !isSel &&
      typeof this.maxSelections === 'number' &&
      this.maxSelections >= 1 &&
      this.selectedValues.length >= this.maxSelections;
    const badgeLabel = option.badge ? (typeof option.badge === 'string' ? option.badge : option.badge.label) : null;
    const badgeTone = option.badge && typeof option.badge !== 'string' && option.badge.tone
      ? option.badge.tone
      : option.tone ?? 'neutral';

    return html`<button
      id=${`${baseId}-opt-${idx}`}
      type="button"
      tabindex="-1"
      role="option"
      class=${`option-tile search-option-row${isActive ? ' search-option-row--active' : ''}${option.readOnly ? ' search-option-row--readonly' : ''}`}
      aria-selected=${String(isSel)}
      aria-readonly=${option.readOnly ? 'true' : nothing}
      aria-disabled=${option.disabled || option.readOnly || isMaxBlocked ? 'true' : nothing}
      ?disabled=${this.locked || !!option.disabled || isMaxBlocked}
      @mousedown=${(e: MouseEvent) => e.preventDefault()}
      @mouseenter=${() => {
        this.activeIndex = idx;
      }}
      @click=${() => this.selectSearchOption(option)}
    >
      <span class="search-option-check" aria-hidden="true">${isSel ? renderEmrSvgIcon('check', 14) : nothing}</span>
      <span class="search-option-body">
        <span class="search-option-top">
          <span>${this.renderHighlightedText(option.label)}</span>
          ${option.code ? html`<span class="search-option-code">${this.renderHighlightedText(option.code)}</span>` : nothing}
          ${isBest ? html`<span class="search-best-match">Best match</span>` : nothing}
        </span>
        ${option.description
          ? html`<span class="emr-muted">${this.renderHighlightedText(option.description)}</span>`
          : nothing}
      </span>
      <span class="search-option-meta">
        ${badgeLabel ? html`<span class=${`emr-badge emr-tone-${badgeTone}`}>${badgeLabel}</span>` : nothing}
        ${option.readOnly
          ? html`<span class="search-option-lock" aria-label="Read-only option">${renderEmrSvgIcon('lock', 14)}</span>`
          : nothing}
      </span>
    </button>`;
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const listboxId = `${id}-listbox`;
    const msgId = `${id}-message`;
    const isInvalid = Boolean(this.invalid || this.error);
    const ranked = this.rankedOptions;
    const visible = ranked.map(e => e.option);
    const bestMatchVal = this.activeQuery.trim()
      ? (ranked.find(e => e.isBestMatch)?.option.value ?? null)
      : null;
    const groups = groupOptions(visible);
    const flatVisible = groups.flatMap(g => g.options);
    const hasNamedGroups = groups.some(g => g.label !== null);
    const showClearBtn = hasSearchSelectClearableValue({
      clearable: this.clearable,
      disabled: this.disabled,
      readOnly: this.readOnly,
      value: this.value,
      selected: this.selectedChips,
      query: this.activeQuery,
    });
    const customCandidate = resolveCustomSearchCandidate(
      this.activeQuery,
      this.options,
      this.isCreatable,
      this.minQueryLength,
    );
    const totalCount = flatVisible.length + (customCandidate ? 1 : 0);
    const isPanelOpen = this.isPanelOpen;
    this.toggleAttribute('data-open', isPanelOpen);
    const activeDescendant =
      isPanelOpen && this.activeIndex >= 0 && this.activeIndex < totalCount
        ? `${id}-opt-${this.activeIndex}`
        : nothing;
    const displayedValue = resolveSearchSelectDisplayValue({
      filterMode: this.filterMode,
      isActivelyTyping: this.isActivelyTyping,
      query: this.activeQuery,
      value: this.value,
      selected: this.selectedChips,
      options: this.options,
      multiple: this.multiple,
    });
    const controlClasses = [
      'emr-control',
      this.variant === 'filled' ? 'emr-control--filled' : this.variant === 'subtle' ? 'emr-control--subtle' : '',
      this.loading ? 'emr-control--loading' : '',
      isInvalid ? 'emr-control--invalid' : this.warning ? 'emr-control--warning' : '',
    ].filter(Boolean).join(' ');

    const chips = this.selectedChips;
    const maxTags = this.maxTagCount;
    const visibleChips = typeof maxTags === 'number' && maxTags >= 0 && chips.length > maxTags ? chips.slice(0, maxTags) : chips;
    const overflowCount = typeof maxTags === 'number' && maxTags >= 0 && chips.length > maxTags ? chips.length - maxTags : 0;

    let runningIdx = 0;

    return html`<div class="emr-field">
      ${!this.labelHidden && this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${this.multiple && chips.length
        ? html`<div class="search-select-chips" role="list" aria-label="Selected options">
            ${visibleChips.map(
              option => html`<span role="listitem" class="emr-chip chip-removable">
                <span>${option.label}</span>
                ${this.readOnly || option.readOnly
                  ? nothing
                  : html`<button
                      type="button"
                      class="chip-remove-btn"
                      aria-label=${`Remove ${option.label}`}
                      ?disabled=${this.disabled}
                      @click=${() => {
                        this.request('removeRequested', option.value);
                        const next = this.selectedValues.filter(v => v !== option.value);
                        this.emitMultiOrSingleValue(next);
                      }}
                    >${renderEmrSvgIcon('close', 12)}</button>`}
              </span>`,
            )}
            ${overflowCount > 0
              ? html`<span class="emr-chip search-chip-overflow" aria-label=${`${overflowCount} more selected`}>+${overflowCount}</span>`
              : nothing}
          </div>`
        : nothing}
      <div class="search-select-wrap">
        <div class=${`search-select-bar${this.variant === 'filled' ? ' search-select-bar--filled' : this.variant === 'subtle' ? ' search-select-bar--subtle' : ''}${this.size === 'sm' ? ' search-select-bar--sm' : ''}${this.size === 'lg' ? ' search-select-bar--lg' : ''}`}>
          <div class="search-input-wrap">
            <span class="search-leading-icon" aria-hidden="true">${renderEmrSvgIcon('search', 15)}</span>
            <input
              id=${id}
              class=${controlClasses}
              type="search"
              role="combobox"
              autocomplete="off"
              aria-autocomplete="list"
              aria-expanded=${String(isPanelOpen)}
              aria-controls=${listboxId}
              aria-activedescendant=${activeDescendant}
              aria-label=${this.ariaLabel || (this.labelHidden ? this.label || 'Search' : nothing)}
              aria-required=${this.required ? 'true' : nothing}
              aria-readonly=${this.readOnly ? 'true' : nothing}
              aria-disabled=${this.disabled ? 'true' : nothing}
              aria-busy=${this.loading ? 'true' : nothing}
              aria-invalid=${isInvalid ? 'true' : nothing}
              aria-describedby=${!this.labelHidden && (this.error || this.warning || this.hint) ? msgId : nothing}
              .value=${live(displayedValue)}
              placeholder=${this.placeholder}
              ?readonly=${this.readOnly}
              ?disabled=${this.disabled}
              ?required=${this.required}
              @focus=${() => {
                if (this.locked) return;
                this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
                if (!isPanelOpen) {
                  this.setPanelOpen(true);
                }
              }}
              @keydown=${(event: KeyboardEvent) => {
                if (this.locked) return;
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
                  event.preventDefault();
                  if (!isPanelOpen) {
                    this.setPanelOpen(true);
                    return;
                  }
                  const nextIdx = findNextEnabledSearchOptionIndex(flatVisible, this.activeIndex, event.key);
                  if (nextIdx !== null) {
                    this.activeIndex = nextIdx;
                    const optEl = this.shadowRoot?.getElementById(`${id}-opt-${nextIdx}`);
                    optEl?.scrollIntoView({ block: 'nearest' });
                  }
                } else if (event.key === 'Escape' && isPanelOpen) {
                  event.preventDefault();
                  this.isActivelyTyping = false;
                  this.setPanelOpen(false);
                } else if (event.key === 'Enter') {
                  event.preventDefault();
                  if (isPanelOpen && this.activeIndex >= 0 && this.activeIndex < flatVisible.length) {
                    this.selectSearchOption(flatVisible[this.activeIndex]!);
                    this.dispatchEvent(new CustomEvent('submitted', { bubbles: true, composed: true }));
                    return;
                  }
                  if (customCandidate && (this.activeIndex === flatVisible.length || flatVisible.length === 0)) {
                    this.commitCustomQuery(this.activeQuery);
                    this.dispatchEvent(new CustomEvent('submitted', { bubbles: true, composed: true }));
                    return;
                  }
                  if (this.filterMode === 'local') {
                    const firstEnabled = flatVisible.find(o => !o.disabled);
                    if (firstEnabled) {
                      this.selectSearchOption(firstEnabled);
                    }
                    this.dispatchEvent(new CustomEvent('submitted', { bubbles: true, composed: true }));
                    return;
                  }
                  this.request('searchRequested');
                  this.dispatchEvent(new CustomEvent('submitted', { bubbles: true, composed: true }));
                }
              }}
              @blur=${(e: Event) => {
                this.isActivelyTyping = false;
                if (this.filterMode === 'remote') {
                  (e.target as HTMLInputElement).value = displayedValue;
                }
                this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
              }}
              @input=${(e: Event) => {
                if (this.locked) {
                  (e.target as HTMLInputElement).value = displayedValue;
                  return;
                }
                this.isActivelyTyping = true;
                const nextQuery = (e.target as HTMLInputElement).value;
                if (this.filterMode !== 'remote') {
                  this.query = nextQuery;
                }
                if (!isPanelOpen) {
                  this.setPanelOpen(true);
                } else {
                  const nextFlat = groupOptions(
                    rankAndFilterOptions(this.options, nextQuery, this.filterMode).map(r => r.option),
                  ).flatMap(g => g.options);
                  this.activeIndex = resolveDefaultActiveOptionIndex(
                    nextFlat,
                    this.selectedValues,
                    nextQuery,
                    this.autoHighlight,
                  );
                }
                this.dispatchEvent(new CustomEvent<string>('queryChange', { detail: nextQuery, bubbles: true, composed: true }));
                this.dispatchEvent(new CustomEvent<string>('queryChanged', { detail: nextQuery, bubbles: true, composed: true }));
                if (this.filterMode === 'remote') {
                  if (this.debounceTimer !== null) clearTimeout(this.debounceTimer);
                  if (nextQuery.trim().length >= Math.max(0, this.minQueryLength)) {
                    this.debounceTimer = setTimeout(() => {
                      this.debounceTimer = null;
                      this.request('searchRequested');
                    }, Math.max(0, this.debounceMs));
                  }
                }
              }}
            />
            ${this.loading
              ? html`<span class="search-trigger-spinner" aria-hidden="true">
                  <svg class="search-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </span>`
              : nothing}
          </div>
          ${showClearBtn
            ? html`<button
                type="button"
                class="clear-inline-btn"
                data-clear-btn="true"
                aria-label=${`${this.clearLabel} ${this.ariaLabel || this.label || 'search'}`}
                @click=${() => this.clearAll()}
              >${renderEmrSvgIcon('close', 14)}</button>`
            : nothing}
          ${this.filterMode === 'remote'
            ? html`<button
                type="button"
                class="search-action-btn"
                ?disabled=${this.locked || this.loading}
                @click=${() => {
                  if (!isPanelOpen) this.setPanelOpen(true);
                  this.request('searchRequested');
                }}
              >${this.loading ? this.loadingMessage : 'Search'}</button>`
            : html`<button
                type="button"
                class="search-action-btn"
                aria-label=${`Toggle ${this.ariaLabel || this.label || 'options'}`}
                aria-expanded=${String(isPanelOpen)}
                ?disabled=${this.locked}
                @click=${() => {
                  if (this.locked) return;
                  this.setPanelOpen(!isPanelOpen);
                }}
              >${renderEmrSvgIcon(isPanelOpen ? 'chevron-up' : 'chevron-down', 16)}</button>`}
        </div>
        ${isPanelOpen
          ? html`<div
              id=${listboxId}
              class="search-select-panel"
              role="listbox"
              aria-busy=${this.loading ? 'true' : nothing}
              aria-label=${this.ariaLabel || this.label || 'Search results'}
              aria-multiselectable=${this.multiple ? 'true' : nothing}
            >
              ${this.loading && !flatVisible.length ? html`<div class="search-empty" role="status">${this.loadingMessage}</div>` : nothing}
              ${!this.loading && !flatVisible.length && !customCandidate
                ? html`<div class="search-empty" role="status">${this.emptyMessage}</div>`
                : nothing}
              ${hasNamedGroups
                ? groups.map(grp =>
                    grp.label
                      ? html`<div class="select-group" role="group" aria-label=${grp.label}>
                          <div class="select-group-header" role="presentation">${grp.label}</div>
                          ${grp.options.map(opt => this.renderSearchOption(opt, runningIdx++, id, bestMatchVal))}
                        </div>`
                      : grp.options.map(opt => this.renderSearchOption(opt, runningIdx++, id, bestMatchVal)),
                  )
                : flatVisible.map((option, idx) => this.renderSearchOption(option, idx, id, bestMatchVal))}
              ${customCandidate
                ? html`<button
                    id=${`${id}-opt-${flatVisible.length}`}
                    type="button"
                    tabindex="-1"
                    role="option"
                    data-custom-option="true"
                    class=${`option-tile search-option-row${this.activeIndex === flatVisible.length ? ' search-option-row--active' : ''}`}
                    aria-selected="false"
                    ?disabled=${this.locked}
                    @mousedown=${(e: MouseEvent) => e.preventDefault()}
                    @mouseenter=${() => {
                      this.activeIndex = flatVisible.length;
                    }}
                    @click=${() => this.commitCustomQuery(this.activeQuery)}
                  >
                    <span class="search-option-check" aria-hidden="true">${renderEmrSvgIcon('plus', 14)}</span>
                    <span class="search-option-body">${formatCreatableLabel(this.createLabel, customCandidate)}</span>
                  </button>`
                : nothing}
            </div>`
          : nothing}
      </div>
      ${!this.labelHidden && this.error
        ? html`<p id=${msgId} class="emr-error" role="alert">${this.error}</p>`
        : !this.labelHidden && this.warning
          ? html`<p id=${msgId} class="emr-warning" role="status">${this.warning}</p>`
          : !this.labelHidden && this.hint
            ? html`<p id=${msgId} class="emr-hint">${this.hint}</p>`
            : nothing}
    </div>`;
  }
}

export class EmrTabsElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-tabs');
  private hasFocus = false;

  @property({ type: String, attribute: 'control-id' }) controlId = '';
  @property({ attribute: false }) tabs: readonly EmrTabOption[] = [];
  @property({ type: String }) value?: string;
  @property({ type: String }) active: string | null = null;
  @property({ type: String, reflect: true }) variant: EmrTabsVariant = 'underline';
  @property({ type: String, reflect: true }) size: EmrTabsSize = 'md';
  @property({ type: String, reflect: true }) orientation: EmrTabsOrientation = 'horizontal';
  @property({ type: Boolean, reflect: true }) fitted = false;
  @property({ type: String, attribute: 'activation-mode' }) activationMode: EmrTabsActivationMode = 'automatic';
  @property({ type: Boolean }) loop = true;
  @property({ type: String, attribute: 'icon-position' }) iconPosition: EmrTabsIconPosition = 'start';
  @property({ type: String, attribute: 'aria-label' }) override ariaLabel: string | null = 'Sections';
  @property({ type: String, attribute: 'aria-labelledby' }) ariaLabelledBy?: string;
  @property({ type: Boolean, reflect: true }) readOnly = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  @property({ type: String })
  get activeTab(): string | null {
    return this.active;
  }
  set activeTab(next: string | null) {
    this.active = next;
  }

  private emitTab(value: string, currentActive: string): void {
    if (value === currentActive) return;
    this.dispatchEvent(new CustomEvent<string>('tabChange', { detail: value, bubbles: true, composed: true }));
    this.emitValueChange(value);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const resolvedActive = resolveActiveTabValue(this.tabs, this.value, this.active);
    const stopIdx = resolveTabStopIndex(this.tabs, resolvedActive, this.disabled);
    const cls = [
      'emr-tabs',
      this.variant === 'pill' ? 'emr-tabs--pill' : this.variant === 'soft' ? 'emr-tabs--soft' : '',
      this.size === 'sm' ? 'emr-tabs--sm' : this.size === 'lg' ? 'emr-tabs--lg' : '',
      this.orientation === 'vertical' ? 'emr-tabs--vertical' : '',
      this.fitted && this.orientation === 'horizontal' ? 'emr-tabs--fitted' : '',
      this.readOnly ? 'emr-tabs--readonly' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`<div
      id=${id}
      role="tablist"
      aria-orientation=${this.orientation}
      aria-label=${this.ariaLabelledBy ? nothing : this.ariaLabel || 'Sections'}
      aria-labelledby=${this.ariaLabelledBy || nothing}
      aria-readonly=${this.readOnly ? 'true' : nothing}
      aria-disabled=${this.disabled ? 'true' : nothing}
      class=${cls}
      @focusin=${() => {
        if (!this.hasFocus) {
          this.hasFocus = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
      }}
      @focusout=${(e: FocusEvent) => {
        const cur = e.currentTarget as HTMLElement | null;
        const rel = e.relatedTarget as Node | null;
        if (!cur || !rel || !cur.contains(rel)) {
          this.hasFocus = false;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }
      }}
      @keydown=${(e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        const idxAttr = target?.getAttribute('data-index');
        const currentIndex = idxAttr != null ? Number(idxAttr) : stopIdx;
        if (e.key === 'Enter' || e.key === ' ') {
          const tab = this.tabs[currentIndex];
          if (canActivateTab(tab, this.disabled, this.readOnly)) {
            e.preventDefault();
            this.emitTab(String(tab!.value), resolvedActive);
          }
          return;
        }
        const nextIdx = getNextTabIndex(this.tabs, currentIndex, e.key, {
          orientation: this.orientation,
          loop: this.loop,
        });
        if (nextIdx === null) return;
        e.preventDefault();
        const btns = this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
        const nextBtn = btns?.[nextIdx];
        nextBtn?.focus();
        nextBtn?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
        if (this.activationMode === 'automatic') {
          const nextTab = this.tabs[nextIdx];
          if (canActivateTab(nextTab, this.disabled, this.readOnly)) {
            this.emitTab(String(nextTab!.value), resolvedActive);
          }
        }
      }}
    >
      ${this.tabs.map((tab, idx) => {
        const isActive = resolvedActive === tab.value;
        const isTabDisabled = this.disabled || !!tab.disabled;
        const isTabStop = idx === stopIdx;
        const iconSize = this.size === 'sm' ? 14 : this.size === 'lg' ? 18 : 16;
        const iconNode = tab.icon
          ? renderEmrSvgIcon(tab.icon as Parameters<typeof renderEmrSvgIcon>[0], iconSize)
          : nothing;
        return html`<button
          id=${`${id}-tab-${idx}`}
          data-index=${idx}
          type="button"
          role="tab"
          class="emr-tab"
          tabindex=${isTabStop ? '0' : '-1'}
          aria-selected=${String(isActive)}
          aria-controls=${tab.panelId || nothing}
          aria-disabled=${isTabDisabled || (this.readOnly && !isActive) ? 'true' : nothing}
          ?disabled=${isTabDisabled}
          @click=${() => {
            if (!canActivateTab(tab, this.disabled, this.readOnly)) return;
            this.emitTab(String(tab.value), resolvedActive);
          }}
        >
          ${this.iconPosition === 'start' ? iconNode : nothing}
          <span>${tab.label}</span>
          ${this.iconPosition === 'end' ? iconNode : nothing}
          ${tab.badge !== undefined && tab.badge !== null && tab.badge !== ''
            ? html`<span class="emr-tab__badge">${tab.badge}</span>`
            : nothing}
        </button>`;
      })}
    </div>`;
  }
}

export class EmrSeparatorElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String, reflect: true }) orientation: EmrSeparatorOrientation = 'horizontal';
  @property({ type: String }) labelAlign: EmrSeparatorLabelAlign = 'center';
  @property({ type: String }) variant: EmrSeparatorVariant = 'solid';
  @property({ type: Boolean }) decorative = false;

  override render() {
    const orientation = normalizeEmrSeparatorOrientation(this.orientation);
    const labelAlign = normalizeEmrSeparatorLabelAlign(this.labelAlign);
    const variant = normalizeEmrSeparatorVariant(this.variant);
    const modCls = variant === 'dashed' ? ' separator--dashed' : variant === 'subtle' ? ' separator--subtle' : '';
    const roleAttr = this.decorative ? 'none' : 'separator';
    const hiddenAttr = this.decorative ? 'true' : nothing;

    if (orientation === 'vertical') {
      return html`<div
        id=${this.controlId || nothing}
        role=${roleAttr}
        aria-orientation=${this.decorative ? nothing : 'vertical'}
        aria-hidden=${hiddenAttr}
        class=${`separator-vertical${modCls}`}
      ></div>`;
    }
    if (!this.label.trim()) {
      return html`<div
        id=${this.controlId || nothing}
        role=${roleAttr}
        aria-orientation=${this.decorative ? nothing : 'horizontal'}
        aria-hidden=${hiddenAttr}
        class=${`separator-plain${modCls}`}
      ><slot></slot></div>`;
    }
    const alignCls = labelAlign === 'start' ? ' separator-labelled--start' : labelAlign === 'end' ? ' separator-labelled--end' : '';
    return html`<div
      id=${this.controlId || nothing}
      role=${roleAttr}
      aria-orientation=${this.decorative ? nothing : 'horizontal'}
      aria-label=${this.decorative ? nothing : this.label}
      aria-hidden=${hiddenAttr}
      class=${`separator-labelled${alignCls}${modCls}`}
    >
      <div class="separator-line separator-line--start" aria-hidden="true"></div>
      <span class="separator-label">${this.label}</span>
      <div class="separator-line separator-line--end" aria-hidden="true"></div>
    </div>`;
  }
}

export class EmrLikertElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-likert');
  private hasFocus = false;

  @property({ type: String }) controlId = '';
  @property({ type: String }) name = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 10;
  @property({ type: Number }) step = 1;
  @property({ type: String }) size: EmrLikertSize = 'md';
  @property({ type: Boolean }) fullWidth = false;
  @property({ type: Number }) value: number | null = null;
  @property({ attribute: false }) anchors?: EmrScaleAnchorsProp;
  @property({ attribute: false }) optionTones?: Readonly<Record<number, EmrTone>>;
  @property({ type: String }) tone?: EmrTone;
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  private clearSelection(): void {
    if (!canMutateLikert(this.disabled, this.readOnly)) return;
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.emitValueChange(null);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const hintId = `${id}-hint`;
    const warnId = `${id}-warning`;
    const errId = `${id}-error`;
    const resolvedAnchors = resolveScaleAnchors(this.anchors, this.min, this.max);
    const anchorArray: EmrLikertAnchor[] = Array.isArray(this.anchors)
      ? this.anchors
      : [
          ...(resolvedAnchors.minLabel ? [{ value: this.min, label: resolvedAnchors.minLabel }] : []),
          ...(resolvedAnchors.midLabel ? [{ value: Math.round((this.min + this.max) / 2), label: resolvedAnchors.midLabel }] : []),
          ...(resolvedAnchors.maxLabel ? [{ value: this.max, label: resolvedAnchors.maxLabel }] : []),
        ];
    const pts = buildLikertPoints({
      min: this.min,
      max: this.max,
      step: this.step,
      value: this.value,
      anchors: anchorArray,
      tone: this.tone,
      optionTones: this.optionTones,
    });
    const stopIdx = resolveLikertTabStopIndex(pts, this.value, this.disabled);
    const hasAnchors = !!(resolvedAnchors.minLabel || resolvedAnchors.midLabel || resolvedAnchors.maxLabel);
    const interactive = canMutateLikert(this.disabled, this.readOnly);
    const showClear = this.clearable && this.value !== null && interactive;
    const isInvalid = Boolean(this.error || this.invalid);
    const isWarning = !isInvalid && Boolean(this.warning);
    const describedBy = this.labelHidden
      ? nothing
      : [this.hint ? hintId : '', this.warning ? warnId : '', this.error ? errId : '']
          .filter(Boolean)
          .join(' ') || nothing;

    const clearBtn = showClear
      ? html`<button
          type="button"
          class="clear-inline-btn"
          style="min-height:44px;min-width:44px;display:inline-flex;align-items:center;gap:6px;"
          data-clear-btn="true"
          aria-label=${`${this.clearLabel} ${this.label || 'rating'}`}
          @click=${() => this.clearSelection()}
        >${renderEmrSvgIcon('close', 14)}<span>${this.clearLabel}</span></button>`
      : nothing;

    const pipMinH = this.size === 'lg' ? '48px' : '44px';
    const pipFont = this.size === 'sm' ? 'var(--emr-text-md)' : 'var(--emr-text-lg)';

    const track = html`<div class="emr-field">
      <div
        id=${id}
        role="radiogroup"
        aria-label=${this.ariaLabel || this.label || 'Rating scale'}
        aria-required=${this.required ? 'true' : nothing}
        aria-readonly=${this.readOnly ? 'true' : nothing}
        aria-disabled=${this.disabled ? 'true' : nothing}
        aria-invalid=${isInvalid ? 'true' : nothing}
        aria-describedby=${describedBy}
        class="likert-row"
        style=${this.fullWidth ? 'width:100%;' : ''}
        @focusin=${() => {
          if (!this.hasFocus) {
            this.hasFocus = true;
            this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
          }
        }}
        @focusout=${(e: FocusEvent) => {
          const cur = e.currentTarget as HTMLElement | null;
          const rel = e.relatedTarget as Node | null;
          if (!cur || !rel || !cur.contains(rel)) {
            this.hasFocus = false;
            this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
          }
        }}
        @keydown=${(e: KeyboardEvent) => {
          const next = resolveNextLikertValue(pts, this.value, e.key);
          if (next === null) return;
          e.preventDefault();
          const idx = pts.findIndex((p) => p.value === next);
          const btns = this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
          if (idx >= 0) btns?.[idx]?.focus();
          if (interactive && next !== this.value) {
            this.emitValueChange(next);
          }
        }}
      >
        ${pts.map((pt, idx) => {
          const cls = `option-tile likert-pip${this.readOnly ? ' option-tile--readonly' : ''}`;
          const borderCol = isInvalid
            ? 'var(--emr-danger)'
            : isWarning
              ? 'var(--emr-warning)'
              : '';
          return html`<button
            type="button"
            role="radio"
            class=${cls}
            style="min-width:${pipMinH};min-height:${pipMinH};font-size:${pipFont};font-variant-numeric:tabular-nums;${this.fullWidth ? 'flex:1 1 0;' : ''}${borderCol ? `border-color:${borderCol};` : ''}"
            tabindex=${idx === stopIdx ? '0' : '-1'}
            data-tone=${pt.selected ? (pt.tone ?? nothing) : nothing}
            aria-label=${pt.assistiveLabel}
            aria-checked=${String(pt.selected)}
            aria-readonly=${this.readOnly ? 'true' : nothing}
            ?disabled=${this.disabled}
            @click=${() => {
              if (interactive) this.emitValueChange(pt.value);
            }}
          >${pt.label}</button>`;
        })}
      </div>
      ${hasAnchors
        ? html`<div class="scale-anchors" aria-hidden="true">
            <span>${resolvedAnchors.minLabel ?? ''}</span>
            ${resolvedAnchors.midLabel ? html`<span>${resolvedAnchors.midLabel}</span>` : nothing}
            <span>${resolvedAnchors.maxLabel ?? ''}</span>
          </div>`
        : nothing}
      ${this.labelHidden ? clearBtn : nothing}
    </div>`;

    if (this.labelHidden) return track;

    return html`<div class="emr-field">
      ${this.label || showClear
        ? html`<div class="emr-header">
            ${this.label
              ? html`<span class="emr-label">${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</span>`
              : html`<span></span>`}
            ${clearBtn}
          </div>`
        : nothing}
      ${track}
      ${this.hint ? html`<span id=${hintId} class="emr-hint">${this.hint}</span>` : nothing}
      ${this.warning ? html`<span id=${warnId} class="emr-warning" role="status">${this.warning}</span>` : nothing}
      ${this.error ? html`<span id=${errId} class="emr-error" role="alert">${this.error}</span>` : nothing}
    </div>`;
  }
}

export class EmrVasElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-vas');
  private dragging = false;

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: String }) ariaDescribedBy = '';
  @property({ type: Boolean }) fullWidth = false;
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) step?: number;
  @property({ type: Number }) majorInterval = 10;
  @property({ type: Number }) minorInterval?: number;
  @property({ type: String }) orientation: EmrVasOrientation = 'horizontal';
  @property({ type: String }) size: EmrVasSize = 'md';
  @property({ attribute: false }) anchors?: EmrVasAnchorsProp;
  @property({ type: String }) tone: EmrTone = 'neutral';
  @property({ type: String }) valueText = '';
  @property({ type: Number }) value: number | null = null;
  @property({ type: Boolean }) showValue = true;
  @property({ type: String }) unmarkedLabel = 'Unmarked';
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: String }) warning = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  private get resolvedStep(): number {
    return resolveVasStep(this.min, this.max, this.step);
  }

  private get canInteract(): boolean {
    return canMutateVas(this.disabled, this.readOnly);
  }

  private clearSelection(): void {
    if (!this.canInteract) return;
    this.emitValueChange(null);
    this.dispatchEvent(new CustomEvent('committed', { detail: { value: null }, bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
  }

  private emitSnapped(raw: number, commit = false): void {
    if (!this.canInteract) return;
    const snapped = snapVasValue(raw, this.min, this.max, this.resolvedStep);
    if (snapped !== this.value) {
      this.emitValueChange(snapped);
    }
    if (commit) {
      this.dispatchEvent(new CustomEvent('committed', { detail: { value: snapped }, bubbles: true, composed: true }));
    }
  }

  private emitFromPointer(event: PointerEvent, target: HTMLElement): void {
    const rect = target.getBoundingClientRect();
    const isVert = this.orientation === 'vertical';
    const offset = isVert ? event.clientY - rect.top : event.clientX - rect.left;
    const length = isVert ? rect.height : rect.width;
    const next = vasValueFromOffset(
      offset,
      length,
      this.min,
      this.max,
      this.resolvedStep,
      isVert,
      EMR_VAS_TRACK_INSET_PX,
    );
    this.emitSnapped(next);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this.canInteract) return;
    const next = resolveVasKeyValue(event.key, this.value, {
      min: this.min,
      max: this.max,
      step: this.resolvedStep,
      majorInterval: this.majorInterval,
    });
    if (next === null) return;
    event.preventDefault();
    this.emitSnapped(next, true);
  };

  override render() {
    const id = this.controlId || this.fallbackId;
    const labelId = `${id}-label`;
    const msgId = `${id}-message`;
    const isInvalid = Boolean(this.invalid || this.error);
    const pct = this.value === null || this.value === undefined ? null : vasPercent(this.value, this.min, this.max);
    const span = Math.abs(this.max - this.min);
    const effectiveMinor = this.minorInterval ?? (span <= 20 ? 0.5 : 2);
    const ticks = resolveVasTicks(this.min, this.max, this.majorInterval, effectiveMinor);
    const resolvedAnchors = resolveVasAnchors(this.anchors, this.min, this.max);
    const hasAnchors = !!(resolvedAnchors.minLabel || resolvedAnchors.midLabel || resolvedAnchors.maxLabel);
    const showClear = this.clearable && this.value !== null && this.canInteract;
    const clearBtn = showClear
      ? html`<button
          type="button"
          class="clear-inline-btn"
          data-clear-btn="true"
          style="display:inline-flex;align-items:center;gap:4px;"
          aria-label=${`${this.clearLabel} ${this.ariaLabel || this.label || 'scale'}`}
          @click=${() => this.clearSelection()}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
          <span>${this.clearLabel}</span>
        </button>`
      : nothing;

    const sliderCls = [
      'vas-slider',
      this.size === 'sm' ? 'vas-slider--sm' : this.size === 'lg' ? 'vas-slider--lg' : '',
      this.orientation === 'vertical' ? 'vas-slider--vertical' : '',
      this.readOnly ? 'vas-slider--readonly' : '',
      this.disabled ? 'vas-slider--disabled' : '',
      isInvalid ? 'vas-slider--invalid' : this.warning ? 'vas-slider--warning' : '',
    ].filter(Boolean).join(' ');

    const rulerFrame = html`<div class=${`vas-frame${this.orientation === 'vertical' ? ' vas-frame--vertical' : ''}`}>
      <div
        id=${id}
        part="slider"
        role="slider"
        class=${sliderCls}
        tabindex=${this.disabled ? -1 : 0}
        aria-orientation=${this.orientation}
        aria-labelledby=${nothing}
        aria-label=${this.ariaLabel || this.label || 'Visual analogue scale'}
        aria-description=${this.labelHidden ? (this.error || this.warning || this.hint || nothing) : nothing}
        aria-describedby=${!this.labelHidden && (this.error || this.warning || this.hint) ? msgId : nothing}
        aria-required=${this.required ? 'true' : nothing}
        aria-valuemin=${String(this.min)}
        aria-valuemax=${String(this.max)}
        aria-valuenow=${this.value ?? nothing}
        aria-valuetext=${this.valueText || nothing}
        aria-readonly=${this.readOnly ? 'true' : nothing}
        aria-disabled=${this.disabled ? 'true' : nothing}
        aria-invalid=${isInvalid ? 'true' : nothing}
        @keydown=${this.onKeyDown}
        @focus=${() => this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }))}
        @blur=${() => this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }))}
        @pointerdown=${(e: PointerEvent) => {
          if (!this.canInteract) return;
          const target = e.currentTarget as HTMLElement;
          this.dragging = true;
          target.setPointerCapture?.(e.pointerId);
          target.focus();
          e.preventDefault();
          this.emitFromPointer(e, target);
        }}
        @pointermove=${(e: PointerEvent) => {
          if (!this.canInteract || !this.dragging) return;
          const target = e.currentTarget as HTMLElement;
          e.preventDefault();
          this.emitFromPointer(e, target);
        }}
        @pointerup=${(e: PointerEvent) => {
          const wasDragging = this.dragging;
          this.dragging = false;
          const target = e.currentTarget as HTMLElement;
          if (target.hasPointerCapture?.(e.pointerId)) {
            target.releasePointerCapture(e.pointerId);
          }
          if (wasDragging && this.canInteract) {
            this.dispatchEvent(new CustomEvent('committed', { detail: { value: this.value }, bubbles: true, composed: true }));
          }
        }}
        @pointercancel=${(e: PointerEvent) => {
          this.dragging = false;
          const target = e.currentTarget as HTMLElement;
          if (target.hasPointerCapture?.(e.pointerId)) {
            target.releasePointerCapture(e.pointerId);
          }
        }}
      >
        <span class="vas-rule" aria-hidden="true"></span>
        ${ticks.map(
          tick => html`
            <span
              class=${`vas-tick${tick.major ? ' vas-tick--major' : ''}`}
              style=${`--vas-pct: ${tick.percent};`}
              aria-hidden="true"
            ></span>
            ${tick.label !== null
              ? html`<span class="vas-tick-label" style=${`--vas-pct: ${tick.percent};`} aria-hidden="true">${tick.label}</span>`
              : nothing}
          `,
        )}
        ${pct !== null
          ? html`<span
              part="thumb"
              class=${`vas-thumb vas-thumb--${this.tone}`}
              style=${`--vas-pct: ${pct};`}
              aria-hidden="true"
            ></span>`
          : nothing}
      </div>
      ${hasAnchors
        ? html`<div class="scale-anchors" aria-hidden="true">
            <span>${this.orientation === 'vertical' ? resolvedAnchors.maxLabel ?? '' : resolvedAnchors.minLabel ?? ''}</span>
            ${resolvedAnchors.midLabel ? html`<span>${resolvedAnchors.midLabel}</span>` : nothing}
            <span>${this.orientation === 'vertical' ? resolvedAnchors.minLabel ?? '' : resolvedAnchors.maxLabel ?? ''}</span>
          </div>`
        : nothing}
      ${this.labelHidden ? clearBtn : nothing}
    </div>`;

    if (this.labelHidden) return rulerFrame;

    return html`<div class="emr-field">
      <div class="emr-header">
        ${this.label
          ? html`<span id=${labelId} class="emr-label">${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</span>`
          : html`<span></span>`}
        <div class="emr-row">
          ${this.showValue
            ? html`<span class=${`emr-badge emr-badge--${this.value === null ? 'neutral' : this.tone}`}>
                ${formatVasValue(this.value, this.resolvedStep, this.unmarkedLabel)}
              </span>`
            : nothing}
          ${clearBtn}
        </div>
      </div>
      ${rulerFrame}
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

export class EmrCardElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackHeadingId = nextL1Id('emr-card-heading');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) cardTitle = '';
  @property({ type: String }) override title = '';
  @property({ type: String }) subtitle = '';
  @property({ type: String }) headingId = '';
  @property({ type: String }) override ariaLabel = '';
  @property({ type: String }) variant: EmrCardVariant = 'outlined';
  @property({ type: String }) padding: EmrCardPadding = 'md';
  @property({ type: Boolean }) padded = true;
  @property({ type: String }) tone: EmrTone = 'neutral';
  @property({ type: Boolean }) interactive = false;
  @property({ type: Boolean }) selected = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) hasFooterSlot = false;

  private activateCard(): void {
    if (!canActivateEmrCard(this.interactive, this.disabled, this.readOnly)) return;
    this.dispatchEvent(new CustomEvent('activated', { bubbles: true, composed: true }));
    this.emitIntent({ type: 'cardActivated', id: this.controlId || this.fallbackHeadingId });
  }

  override render() {
    const heading = resolveEmrCardLabel(this.label, this.title, this.cardTitle);
    const hId = this.headingId || this.fallbackHeadingId;
    const variant = normalizeEmrCardVariant(this.variant);
    const pad = normalizeEmrCardPadding(this.padding, this.padded);
    const tone = normalizeEmrCardTone(this.tone);

    const cls = [
      'emr-card emr-card--shell',
      variant !== 'outlined' ? `emr-card--${variant}` : '',
      pad === 'none' ? 'emr-card--flush' : pad !== 'md' ? `emr-card--pad-${pad}` : '',
      tone !== 'neutral' ? `emr-card--tone-${tone}` : '',
      this.interactive ? 'emr-card--interactive' : '',
      this.interactive && this.selected ? 'emr-card--selected' : '',
      this.readOnly ? 'emr-card--readonly' : '',
      this.disabled ? 'emr-card--disabled' : '',
    ].filter(Boolean).join(' ');

    return html`<section
      id=${this.controlId || nothing}
      class=${cls}
      part="card"
      role=${this.interactive ? 'button' : nothing}
      tabindex=${this.interactive && !this.disabled ? '0' : nothing}
      aria-label=${this.ariaLabel || nothing}
      aria-labelledby=${!this.ariaLabel && heading ? hId : nothing}
      aria-pressed=${this.interactive ? String(this.selected) : nothing}
      aria-disabled=${this.disabled ? 'true' : nothing}
      aria-readonly=${this.interactive && this.readOnly ? 'true' : nothing}
      @click=${() => this.activateCard()}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (!canActivateEmrCard(this.interactive, this.disabled, this.readOnly)) return;
          e.preventDefault();
          this.activateCard();
        }
      }}
    >
      ${heading || this.subtitle
        ? html`<div class="emr-card__header">
            <div class="emr-card__header-main">
              ${heading ? html`<h3 id=${hId} class="emr-card__title">${heading}</h3>` : nothing}
              ${this.subtitle ? html`<div class="emr-card__subtitle">${this.subtitle}</div>` : nothing}
            </div>
            <slot name="header"></slot>
          </div>`
        : nothing}
      <div class="emr-card__body"><slot></slot></div>
      ${this.hasFooterSlot ? html`<div class="emr-card__footer"><slot name="footer"></slot></div>` : nothing}
    </section>`;
  }
}

export class EmrColumnsElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) controlId = '';
  @property({ type: Number }) count = 2;
  @property({ attribute: false }) widths?: readonly EmrColumnsTrackWidth[];
  @property({ attribute: false }) gap: number | string = '16px';
  @property({ type: String }) align: EmrColumnsAlign = 'stretch';
  @property({ type: Number }) collapseBelow = 640;

  @state() private containerWidth: number | null = null;
  private resizeObserver?: ResizeObserver;
  private rafId = 0;

  @property({ type: Number })
  get columns(): number {
    return this.count;
  }
  set columns(next: number) {
    this.count = next;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width;
        if (typeof w === 'number' && w > 0) {
          if (this.rafId) cancelAnimationFrame(this.rafId);
          this.rafId = requestAnimationFrame(() => {
            this.rafId = 0;
            this.containerWidth = w;
          });
        }
      });
      this.resizeObserver.observe(this);
    }
  }

  override disconnectedCallback(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    super.disconnectedCallback();
  }

  override render() {
    const threshold = normalizeEmrColumnsCollapseBelow(this.collapseBelow);
    const stacked = threshold > 0 && this.containerWidth !== null && this.containerWidth < threshold;
    const c = normalizeEmrColumnsCount(this.count);
    const template = stacked ? 'minmax(0, 1fr)' : resolveEmrColumnsCssTemplate(c, this.widths);
    const gapVal = normalizeEmrColumnsGap(this.gap).css;
    const alignVal = normalizeEmrColumnsAlign(this.align);
    return html`<div
      id=${this.controlId || nothing}
      class="columns-grid"
      style=${`--emr-col-template: ${template}; --emr-col-gap: ${gapVal}; --emr-col-align: ${alignVal};`}
    ><slot></slot></div>`;
  }
}

export class EmrFieldValueRowElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) controlId = '';
  @property({ type: String }) field = '';
  @property({ attribute: false }) value: string | number | null | undefined = '';
  @property({ type: String }) remarks: string | null | undefined = '';
  @property({ type: String }) notes: string | null | undefined = '';
  @property({ type: Boolean }) heading = false;
  @property({ type: String }) placeholder = '—';
  @property({ type: String }) tone: EmrTone = 'neutral';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: Boolean }) truncate = false;
  @property({ type: Boolean }) interactive = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: String }) override ariaLabel = '';

  private onActivate(): void {
    if (!canActivateEmrFieldValueRow(this.interactive, this.readOnly)) return;
    this.dispatchEvent(new CustomEvent('activated', { bubbles: true, composed: true }));
    this.emitIntent({ type: 'rowActivated', id: this.controlId || undefined });
  }

  private onKeyActivate(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (!canActivateEmrFieldValueRow(this.interactive, this.readOnly)) return;
    event.preventDefault();
    this.onActivate();
  }

  override render() {
    const resolvedSize = normalizeEmrFieldValueRowSize(this.size);
    const resolvedTone = normalizeEmrFieldValueRowTone(this.tone);
    const resolvedVal = resolveEmrFieldValueRowValue(this.value, this.heading, this.placeholder || '—');
    const cls = [
      'fvr-row',
      this.heading ? 'fvr-row--heading' : '',
      resolvedSize === 'sm' ? 'fvr-row--sm' : resolvedSize === 'lg' ? 'fvr-row--lg' : '',
      this.truncate ? 'fvr-row--truncate' : '',
      this.interactive ? 'fvr-row--interactive' : '',
      this.interactive && this.readOnly ? 'fvr-row--readonly' : '',
    ]
      .filter(Boolean)
      .join(' ');
    const cellRole = this.heading ? 'columnheader' : 'cell';
    const fieldRole = this.heading ? 'columnheader' : 'rowheader';
    return html`<div
      id=${this.controlId || nothing}
      class=${cls}
      role="row"
      data-tone=${resolvedTone}
      tabindex=${this.interactive ? '0' : nothing}
      aria-label=${this.ariaLabel || nothing}
      aria-readonly=${this.interactive && this.readOnly ? 'true' : nothing}
      @click=${this.onActivate}
      @keydown=${this.onKeyActivate}
    >
      <div class="fvr-cell fvr-field" role=${fieldRole} data-label="Field">${this.field}</div>
      <div class=${`fvr-cell fvr-value${resolvedVal.isPlaceholder ? ' fvr-placeholder' : ''}`} role=${cellRole} data-label="Value">${resolvedVal.text}</div>
      <div class="fvr-cell fvr-remarks" role=${cellRole} data-label="Remarks">${this.remarks ?? ''}</div>
      <div class="fvr-cell fvr-notes" role=${cellRole} data-label="Notes">${this.notes ?? ''}</div>
    </div>`;
  }
}

export type EmrStatusCellAttributionProp =
  | string
  | {
      readonly author?: string;
      readonly timestamp?: string;
      readonly nameLabel?: string;
      readonly roleLabel?: string;
      readonly timeLabel?: string;
    };

export class EmrStatusCellElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-status-cell');

  @property({ type: String }) controlId = '';
  @property({ attribute: false }) status: EmrBadge | null = null;
  @property({ type: String }) valueLabel = '';
  @property({ attribute: false }) attribution: EmrStatusCellAttributionProp = '';
  @property({ type: String }) actionLabel = '';
  @property({ attribute: false }) action?: { readonly label: string; readonly icon?: string; readonly ariaLabel?: string };
  @property({ type: String }) secondaryNote = '';
  @property({ type: Boolean }) compact = false;
  @property({ type: Boolean }) interactive = false;
  @property({ type: Boolean }) selectable = false;
  @property({ type: Boolean }) selected = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) size: 'sm' | 'md' = 'md';
  @property({ type: String }) override ariaLabel = '';

  @property({ attribute: false })
  get badge(): EmrBadge | undefined {
    return this.status ?? undefined;
  }
  set badge(next: EmrBadge | undefined) {
    this.status = next ?? null;
  }

  @property({ type: String })
  get value(): string {
    return this.valueLabel;
  }
  set value(next: string) {
    this.valueLabel = next;
  }

  private get resolvedAttribution(): string {
    return formatEmrStatusCellAttribution(this.attribution);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const isSelectable = this.interactive || this.selectable;
    const canSelect = canSelectEmrStatusCell(isSelectable, this.readOnly, this.disabled);
    const resolvedAction = this.action?.label || this.actionLabel || '';
    const canAct = canTriggerEmrStatusCellAction(Boolean(resolvedAction), this.compact, this.readOnly, this.disabled);
    const attrText = this.resolvedAttribution;
    const hiddenText = resolveEmrStatusCellHiddenText(this.compact, this.valueLabel, attrText, this.secondaryNote);
    const resolvedAriaLabel =
      this.ariaLabel.trim() ||
      (hiddenText ? [this.status?.label, this.status?.assistiveText, hiddenText].filter(Boolean).join('. ') : '');
    const resolvedSize = normalizeEmrStatusCellSize(this.size);

    const emitSelect = () => {
      if (!canSelect) return;
      this.dispatchEvent(new CustomEvent('selected', { bubbles: true, composed: true }));
      this.emitIntent('selected');
    };

    const bodyCls = [
      'status-cell-body',
      isSelectable ? 'status-cell-body--interactive' : '',
      this.selected ? 'status-cell-body--selected' : '',
      isSelectable && this.readOnly ? 'status-cell-body--readonly' : '',
      this.disabled ? 'status-cell-body--disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`<div class=${`status-cell${resolvedSize === 'sm' ? ' status-cell--sm' : ''}${this.disabled ? ' status-cell--disabled' : ''}`}>
      <div
        id=${id}
        class=${bodyCls}
        role=${isSelectable ? 'button' : nothing}
        tabindex=${isSelectable && !this.disabled ? '0' : isSelectable ? '-1' : nothing}
        aria-label=${resolvedAriaLabel || nothing}
        aria-pressed=${isSelectable ? (this.selected ? 'true' : 'false') : nothing}
        aria-readonly=${isSelectable && this.readOnly ? 'true' : nothing}
        aria-disabled=${this.disabled ? 'true' : nothing}
        @click=${emitSelect}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            emitSelect();
          }
        }}
      >
        <div class="status-cell-main">
          ${this.status ? html`<emr-badge .badge=${this.status}></emr-badge>` : nothing}
          ${!this.compact && this.valueLabel ? html`<strong class="status-cell-value">${this.valueLabel}</strong>` : nothing}
        </div>
        ${!this.compact
          ? html`
              ${attrText ? html`<span class="emr-muted">${attrText}</span>` : nothing}
              ${this.secondaryNote ? html`<span class="emr-muted">${this.secondaryNote}</span>` : nothing}
            `
          : hiddenText
            ? html`<span class="sr-only">${hiddenText}</span>`
            : nothing}
      </div>
      ${canAct
        ? html`<button
            type="button"
            class="emr-btn emr-btn--outline emr-btn--sm status-cell-action"
            aria-label=${this.action?.ariaLabel || nothing}
            @click=${() => {
              if (!canAct) return;
              this.dispatchEvent(new CustomEvent('actionClicked', { bubbles: true, composed: true }));
              this.emitIntent('action');
            }}
          >${this.action?.icon ? renderEmrSvgIcon(this.action.icon as never, 14) : nothing}${resolvedAction}</button>`
        : nothing}
    </div>`;
  }
}

export class EmrStageStepperElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) controlId = '';
  @property({ attribute: false }) stages: readonly EmrStage[] = [];
  @property({ type: String }) activeId = '';
  @property({ attribute: false }) completedIds: readonly string[] = [];
  @property({ type: String }) override ariaLabel: string | null = 'Stages';
  @property({ type: String }) orientation: 'horizontal' | 'vertical' = 'horizontal';
  @property({ type: String }) size: 'sm' | 'md' = 'md';
  @property({ type: Boolean }) clickable = true;
  @property({ type: Boolean }) linear = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;

  @state() private focusedId = '';

  @property({ attribute: false })
  get steps(): readonly EmrStage[] {
    return this.stages;
  }
  set steps(next: readonly EmrStage[]) {
    this.stages = next;
  }

  @property({ type: String })
  get activeStepId(): string {
    return this.activeId;
  }
  set activeStepId(next: string) {
    this.activeId = next;
  }

  private emitStage(stageId: string): void {
    this.dispatchEvent(new CustomEvent<string>('stageSelected', { detail: stageId, bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent<string>('stepSelected', { detail: stageId, bubbles: true, composed: true }));
    this.emitIntent({ type: 'stageSelected', stageId });
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const buttons = Array.from(this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button.stage-btn') ?? []);
    if (!buttons.length) return;
    const cur = buttons.findIndex(b => b === event.target);
    if (cur < 0) return;
    const next = getNextStageStepperIndex(this.stages, cur, event.key, this.disabled);
    if (next === null) return;
    event.preventDefault();
    buttons[next]?.focus();
  };

  override render() {
    const orientation = normalizeEmrStageStepperOrientation(this.orientation);
    const size = normalizeEmrStageStepperSize(this.size);
    const listCls = [
      'stage-list',
      orientation === 'vertical' ? 'stage-list--vertical' : '',
      size === 'sm' ? 'stage-list--sm' : '',
      this.readOnly ? 'stage-list--readonly' : '',
      this.disabled ? 'stage-list--disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');
    const tabStopId = resolveStageStepperTabStopId(this.stages, this.focusedId || null, this.activeId || null, this.disabled);

    return html`<nav id=${this.controlId || nothing} aria-label=${this.ariaLabel || 'Stages'} data-orientation=${orientation}>
      <ol class=${listCls} @keydown=${this.onKeyDown}>
        ${this.stages.map((s, idx) => {
          const isActive = s.id === this.activeId;
          const isCompleted = this.completedIds.includes(s.id);
          const stageDisabled = this.disabled || Boolean(s.disabled);
          const isTabStop = s.id === tabStopId;
          const canSelect = canSelectEmrStage(s, {
            readOnly: this.readOnly,
            disabled: this.disabled,
            clickable: this.clickable,
            linear: this.linear,
            activeId: this.activeId,
            stages: this.stages,
            completedIds: this.completedIds,
          });
          const btnCls = [
            'stage-btn',
            isActive ? 'stage-btn--active' : '',
            isCompleted ? 'stage-btn--completed' : '',
            this.readOnly ? 'stage-btn--readonly' : '',
            stageDisabled ? 'stage-btn--disabled' : '',
          ].filter(Boolean).join(' ');
          return html`<li class="stage-item">
            <button
              type="button"
              class=${btnCls}
              ?disabled=${stageDisabled}
              tabindex=${isTabStop ? '0' : '-1'}
              aria-current=${isActive ? 'step' : nothing}
              aria-readonly=${this.readOnly ? 'true' : nothing}
              aria-disabled=${stageDisabled ? 'true' : nothing}
              @focus=${() => {
                this.focusedId = s.id;
              }}
              @click=${() => {
                if (canSelect) this.emitStage(s.id);
              }}
            >
              <span class="stage-num" aria-hidden="true">
                ${isCompleted ? renderEmrSvgIcon('check', 14) : idx + 1}
              </span>
              <span style="min-width:0;">
                <strong>${s.label}</strong>
                ${s.description ? html`<span class="emr-muted" style="display:block;">${s.description}</span>` : nothing}
              </span>
              ${s.status ? html`<emr-badge style="margin-inline-start:auto;" .badge=${s.status}></emr-badge>` : nothing}
            </button>
          </li>`;
        })}
      </ol>
    </nav>`;
  }
}

export class EmrStatTileElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) controlId = '';
  @property({ attribute: false }) model?: EmrStatTileModel;
  @property({ type: String }) tone: EmrTone | '' = '';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: Boolean }) interactive = true;
  @property({ type: Boolean }) selected = false;
  @property({ type: Boolean }) loading = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) override ariaLabel = '';

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const size = normalizeEmrStatTileSize(this.size);
    const tone = normalizeEmrStatTileTone(this.tone || null, m.tone);
    const canAct = canActivateEmrStatTile(this.interactive, this.disabled, this.readOnly, this.loading);
    const label = resolveEmrStatTileAriaLabel(m, this.ariaLabel);
    const cls = [
      'stat-tile',
      canAct ? 'stat-tile--interactive' : '',
      size === 'sm' ? 'stat-tile--sm' : size === 'lg' ? 'stat-tile--lg' : '',
      this.selected ? 'stat-tile--selected' : '',
      this.readOnly ? 'stat-tile--readonly' : '',
      this.disabled ? 'stat-tile--disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const trendIcon =
      m.trend?.direction === 'up'
        ? renderEmrSvgIcon('chevron-up', 14)
        : m.trend?.direction === 'down'
          ? renderEmrSvgIcon('chevron-down', 14)
          : m.trend?.direction === 'flat'
            ? renderEmrSvgIcon('minus', 14)
            : nothing;

    const content = this.loading
      ? html`<span class="stat-tile-skeleton" style="width:55%;height:12px;" aria-hidden="true"></span>
          <span class="stat-tile-skeleton" style="width:35%;height:26px;margin:2px 0;" aria-hidden="true"></span>
          <span class="stat-tile-skeleton" style="width:70%;height:11px;" aria-hidden="true"></span>`
      : html`<span class="stat-tile-label">${m.label}</span>
          <strong class="stat-tile-value">${m.value}</strong>
          ${m.trend
            ? html`<span class="stat-tile-trend" data-tone=${m.trend.tone ?? 'neutral'}>${trendIcon}${m.trend.label}</span>`
            : nothing}
          ${m.sub ? html`<span class="stat-tile-sub">${m.sub}</span>` : nothing}
          ${m.status ? html`<emr-badge .badge=${m.status}></emr-badge>` : nothing}`;

    return canAct
      ? html`<button
          type="button"
          id=${this.controlId || nothing}
          class=${cls}
          data-tone=${tone}
          aria-label=${label}
          aria-pressed=${this.selected ? 'true' : 'false'}
          ?disabled=${this.disabled}
          @click=${() => this.emitIntent({ type: 'statSelected', key: m.key })}
        >${content}</button>`
      : html`<div
          id=${this.controlId || nothing}
          class=${cls}
          data-tone=${tone}
          role="group"
          aria-label=${label}
          aria-busy=${this.loading ? 'true' : nothing}
          aria-readonly=${this.interactive && this.readOnly ? 'true' : nothing}
          aria-disabled=${this.disabled ? 'true' : nothing}
        >${content}</div>`;
  }
}

export class EmrToastElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  @property({ attribute: false }) model?: EmrToastModel;
  @property({ type: String }) toastId = '';
  @property({ type: String }) message = '';
  @property({ type: String }) tone: EmrTone = 'info';
  @property({ type: String }) actionLabel = '';
  @property({ type: String }) dismissLabel = 'Dismiss';

  override render() {
    const m = this.model;
    const resolvedId = m?.id ?? this.toastId;
    const resolvedMessage = m?.message ?? this.message;
    const resolvedTone = m?.tone ?? this.tone;
    const resolvedAction = m?.actionLabel ?? this.actionLabel;
    if (!m && !resolvedMessage) return nothing;

    return html`<div class="emr-card toast-row" part="toast">
      <span
        class=${`emr-badge emr-badge--${resolvedTone}`}
        role=${resolvedTone === 'warning' || resolvedTone === 'danger' ? 'alert' : 'status'}
      >
        ${resolvedMessage}
      </span>
      ${resolvedAction
        ? html`<button
            type="button"
            class="emr-btn emr-btn--secondary"
            @click=${() => {
              if (this.model && (this.model.id !== resolvedId || !this.model.actionLabel)) return;
              this.emitIntent<EmrToastIntent>({ type: 'actionPressed', id: resolvedId });
              this.dispatchEvent(new CustomEvent('actionClicked', { bubbles: true, composed: true }));
            }}
          >${resolvedAction}</button>`
        : nothing}
      <button
        type="button"
        class="emr-btn emr-btn--ghost"
        @click=${() => {
          if (this.model && this.model.id !== resolvedId) return;
          this.emitIntent<EmrToastIntent>({ type: 'dismissed', id: resolvedId });
          this.dispatchEvent(new CustomEvent('dismissRequested', { bubbles: true, composed: true }));
        }}
      >${this.dismissLabel}</button>
    </div>`;
  }
}

export function registerL1Elements(): void {
  defineEmrElement('emr-button', EmrButtonElement);
  defineEmrElement('emr-text-input', EmrTextInputElement);
  defineEmrElement('emr-number-input', EmrNumberInputElement);
  defineEmrElement('emr-date-input', EmrDateInputElement);
  defineEmrElement('emr-time-input', EmrTimeInputElement);
  defineEmrElement('emr-datetime-input', EmrDateTimeInputElement);
  defineEmrElement('emr-select', EmrSelectElement);
  defineEmrElement('emr-quantity-input', EmrQuantityInputElement);
  defineEmrElement('emr-paired-input', EmrPairedInputElement);
  defineEmrElement('emr-checkbox', EmrCheckboxElement);
  defineEmrElement('emr-toggle', EmrToggleElement);
  defineEmrElement('emr-radio-group', EmrRadioGroupElement);
  defineEmrElement('emr-badge', EmrBadgeElement);
  defineEmrElement('emr-chip', EmrChipElement);
  defineEmrElement('emr-alert', EmrAlertElement);
  defineEmrElement('emr-state-message', EmrStateMessageElement);
  defineEmrElement('emr-search-select', EmrSearchSelectElement);
  defineEmrElement('emr-tabs', EmrTabsElement);
  defineEmrElement('emr-separator', EmrSeparatorElement);
  defineEmrElement('emr-likert', EmrLikertElement);
  defineEmrElement('emr-vas', EmrVasElement);
  defineEmrElement('emr-card', EmrCardElement);
  defineEmrElement('emr-columns', EmrColumnsElement);
  defineEmrElement('emr-field-value-row', EmrFieldValueRowElement);
  defineEmrElement('emr-status-cell', EmrStatusCellElement);
  defineEmrElement('emr-stage-stepper', EmrStageStepperElement);
  defineEmrElement('emr-stat-tile', EmrStatTileElement);
  defineEmrElement('emr-toast', EmrToastElement);
  registerL1ExtraElements();
  registerL1Wave2Elements();
}
