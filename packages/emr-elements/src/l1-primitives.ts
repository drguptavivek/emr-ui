import { html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import {
  filterOptionsLocally,
  groupOptions,
  localDateTimeToUtcIso,
  toLocalDateTimeInputValue,
  type EmrBadge,
  type EmrOption,
  type EmrOptionGroup,
  type EmrStage,
  type EmrStatTileModel,
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
  .select-trigger {
    width: 100%;
    min-height: var(--emr-control-height);
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
    box-sizing: border-box;
  }
  .select-trigger--open {
    border-color: var(--emr-primary);
  }
  .select-trigger--invalid {
    border-color: var(--emr-danger);
  }
  .select-trigger--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
  }
  .select-trigger:disabled {
    background: var(--emr-surface-soft);
    opacity: 0.6;
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
  .select-option {
    width: 100%;
    min-height: var(--emr-control-height);
    padding: 0 12px;
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
  .select-option:hover:not(:disabled) {
    background: var(--emr-surface-soft);
  }
  .select-option[aria-selected="true"] {
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
    font-weight: var(--emr-weight-bold);
  }
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
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    text-align: left;
    box-sizing: border-box;
  }
  .option-tile--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
  }
  .option-tile:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .option-tile[aria-checked="true"],
  .option-tile[aria-checked="mixed"],
  .option-tile[aria-pressed="true"],
  .option-tile[aria-selected="true"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
  }
  .option-tile[data-tone="info"][aria-checked="true"],
  .option-tile[data-tone="info"][aria-pressed="true"] {
    border-color: var(--emr-info);
    background: var(--emr-info-soft);
    color: var(--emr-info);
  }
  .option-tile[data-tone="success"][aria-checked="true"],
  .option-tile[data-tone="success"][aria-pressed="true"] {
    border-color: var(--emr-success);
    background: var(--emr-success-soft);
    color: var(--emr-success);
  }
  .option-tile[data-tone="warning"][aria-checked="true"],
  .option-tile[data-tone="warning"][aria-pressed="true"] {
    border-color: var(--emr-warning);
    background: var(--emr-warning-soft);
    color: var(--emr-warning);
  }
  .option-tile[data-tone="danger"][aria-checked="true"],
  .option-tile[data-tone="danger"][aria-pressed="true"] {
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
    width: 16px;
    height: 16px;
    border-radius: 999px;
  }
  .option-tile[aria-checked="true"] .indicator,
  .option-tile[aria-checked="mixed"] .indicator,
  .option-tile[aria-pressed="true"] .indicator {
    border-color: var(--emr-primary);
    background: var(--emr-primary);
    color: var(--emr-on-primary);
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
  .option-tile[aria-checked="true"] .switch-track {
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
  .option-tile[aria-checked="true"] .switch-thumb {
    transform: translateX(18px);
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
  }
  .option-tile-desc {
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
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
  .tabs-bar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--emr-border);
    padding-bottom: 6px;
  }
  .tabs-bar .option-tile {
    width: auto;
  }
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
    border-left: 1px solid var(--emr-border);
    background: transparent;
    color: var(--emr-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .chip-remove-btn:hover:not(:disabled) {
    background: var(--emr-danger-soft);
    color: var(--emr-danger);
  }
  .chip-remove-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .separator-plain {
    width: 100%;
    height: 1px;
    background: var(--emr-border);
    margin: 8px 0;
  }
  .separator-labelled {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
  }
  .separator-line {
    flex: 1;
    height: 1px;
    background: var(--emr-border);
  }
  .separator-vertical {
    display: inline-block;
    width: 1px;
    min-height: 24px;
    align-self: stretch;
    background: var(--emr-border);
    margin: 0 8px;
  }
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
  .vas-slider {
    position: relative;
    height: 52px;
    min-height: 44px;
    padding: 0;
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    border: 1px solid var(--emr-border);
    cursor: pointer;
    touch-action: none;
    user-select: none;
  }
  .vas-slider--vertical {
    width: 64px;
    height: 240px;
  }
  .vas-slider--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
  }
  .vas-slider--disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
    align-items: start;
  }
  @media (max-width: 768px) {
    .columns-grid {
      grid-template-columns: minmax(0, 1fr) !important;
    }
  }

  .fvr-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--emr-border);
    align-items: start;
  }
  .fvr-row--heading {
    font-weight: var(--emr-weight-bold);
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    text-transform: uppercase;
  }
  @media (max-width: 768px) {
    .fvr-row {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .status-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    min-width: 0;
  }
  .status-cell-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    border-radius: var(--emr-radius);
  }
  .status-cell-body--interactive {
    min-height: 44px;
    min-width: 44px;
    padding: 6px 8px;
    cursor: pointer;
    justify-content: center;
  }
  .status-cell-body--interactive:hover {
    background: var(--emr-surface-soft);
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
    gap: 8px;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .stage-list--vertical {
    flex-direction: column;
  }
  .stage-btn {
    width: 100%;
    min-height: 44px;
    min-width: 44px;
    padding: 8px 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    text-align: left;
  }
  .stage-btn--active {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
    font-weight: var(--emr-weight-semibold);
  }
  .stage-btn--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
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

  .search-select-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .search-select-bar {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .search-select-panel {
    display: grid;
    gap: 4px;
    padding: 6px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    max-height: 260px;
    overflow-y: auto;
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
  @property({ type: Boolean }) block = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) loading = false;
  @property({ type: String }) type: 'button' | 'submit' | 'reset' = 'button';

  override render() {
    const cls = [
      'emr-btn',
      this.variant !== 'primary' ? `emr-btn--${this.variant}` : '',
      this.size !== 'md' ? `emr-btn--${this.size}` : '',
      this.block ? 'emr-btn--block' : '',
    ].filter(Boolean).join(' ');

    return html`<button
      type=${this.type}
      part="button"
      class=${cls}
      ?disabled=${this.disabled || this.loading}
      aria-busy=${this.loading ? 'true' : 'false'}
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
    const input = html`<input
      id=${id}
      part="control"
      class="emr-control"
      type="text"
      .value=${this.locked ? live(this.value ?? '') : this.value ?? ''}
      placeholder=${this.placeholder}
      ?readonly=${this.readOnly}
      ?disabled=${this.disabled}
      ?required=${this.required}
      aria-label=${this.labelHidden && this.label ? this.label : nothing}
      aria-invalid=${this.error ? 'true' : nothing}
      aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
      @blur=${(e: Event) => {
        (e.target as HTMLInputElement).value = this.value ?? '';
        this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
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

    if (this.labelHidden) return input;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${input}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
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
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) min = '';
  @property({ type: String }) max = '';
  @property({ type: String }) precision: LitDatePrecision = 'day';
  @property({ type: String }) displayFormat: LitDateDisplayFormat = 'yyyy-mm-dd';
  @property({ type: String }) placeholder = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
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
    const wrapCls = [
      'date-wrap',
      this.calOpen ? 'date-wrap--open' : '',
      this.error ? 'date-wrap--invalid' : '',
      this.readOnly ? 'date-wrap--readonly' : '',
    ].filter(Boolean).join(' ');

    const anchor = html`<div class="date-anchor">
      <div class=${wrapCls} style=${`width: ${widthPx}px;`} part="control">
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
          aria-label=${this.labelHidden && this.label ? this.label : nothing}
          aria-invalid=${this.error ? 'true' : nothing}
          aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
          @blur=${(e: Event) => {
            this.draft = undefined;
            (e.target as HTMLInputElement).value = formatLitDate(this.value, this.displayFormat, this.precision);
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

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) precision: 'minute' | 'second' = 'minute';
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
    const wrapCls = [
      'date-wrap',
      this.error ? 'date-wrap--invalid' : '',
      this.readOnly ? 'date-wrap--readonly' : '',
    ].filter(Boolean).join(' ');

    const control = html`<div class=${wrapCls} style="width: 174px;" part="control">
      <input
        id=${id}
        class="stepper-input"
        type="time"
        step=${this.precision === 'second' ? '1' : '60'}
        .value=${this.locked ? live(this.value ?? '') : this.value ?? ''}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        ?required=${this.required}
        aria-label=${this.labelHidden && this.label ? this.label : nothing}
        aria-invalid=${this.error ? 'true' : nothing}
        aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
        @blur=${(e: Event) => {
          (e.target as HTMLInputElement).value = this.value ?? '';
        }}
        @input=${(e: Event) => {
          const v = (e.target as HTMLInputElement).value || null;
          if (this.locked) {
            (e.target as HTMLInputElement).value = this.value ?? '';
            return;
          }
          this.emitValueChange(v);
        }}
      />
      <span class="date-icon-box" aria-hidden="true">${renderEmrSvgIcon('clock', 16)}</span>
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

export class EmrDateTimeInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-datetime-input');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) precision: 'minute' | 'second' = 'minute';
  @property({ type: String }) wireFormat: 'utc' | 'local' = 'utc';
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
    const localDisplayed = toLocalDateTimeInputValue(this.value, this.precision);

    const input = html`<input
      id=${id}
      class="emr-control"
      style="max-width: 280px;"
      type="datetime-local"
      step=${this.precision === 'second' ? '1' : '60'}
      .value=${this.locked ? live(localDisplayed) : localDisplayed}
      ?readonly=${this.readOnly}
      ?disabled=${this.disabled}
      ?required=${this.required}
      aria-label=${this.labelHidden && this.label ? this.label : nothing}
      aria-invalid=${this.error ? 'true' : nothing}
      aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
      @blur=${(e: Event) => {
        (e.target as HTMLInputElement).value = toLocalDateTimeInputValue(this.value, this.precision);
      }}
      @input=${(e: Event) => {
        const raw = (e.target as HTMLInputElement).value;
        if (this.locked) {
          (e.target as HTMLInputElement).value = toLocalDateTimeInputValue(this.value, this.precision);
          return;
        }
        if (!raw) {
          this.emitValueChange(null);
          return;
        }
        this.emitValueChange(this.wireFormat === 'local' ? raw : localDateTimeToUtcIso(raw));
      }}
    />`;

    if (this.labelHidden) return input;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${input}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
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
  @property({ type: String }) placeholder = 'Select…';
  @property({ type: String }) value: string | null = null;
  @property({ attribute: false }) options: readonly EmrOption[] = [];
  @property({ type: Boolean }) allowClear = false;
  @property({ type: Boolean }) clearable = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  @state() private open = false;
  @state() private menuStyle = '';

  private get canEdit(): boolean {
    return !this.readOnly && !this.disabled;
  }

  private get isClearable(): boolean {
    return this.clearable || this.allowClear;
  }

  private onOutsidePointerDown = (event: Event): void => {
    if (!this.open) return;
    if (!event.composedPath().includes(this)) {
      this.closeMenu();
    }
  };

  private onGlobalKeyDown = (event: KeyboardEvent): void => {
    if (this.open && event.key === 'Escape') {
      event.stopPropagation();
      this.closeMenu();
      this.shadowRoot?.querySelector<HTMLButtonElement>('.select-trigger')?.focus();
    }
  };

  private onViewportMove = (): void => {
    if (!this.open) return;
    this.syncMenuPosition();
  };

  override disconnectedCallback(): void {
    this.detachMenuListeners();
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
    const trigger = this.shadowRoot?.querySelector<HTMLElement>('.select-trigger');
    const rowCount = this.options.length + (this.isClearable ? 1 : 0);
    const estHeight = Math.min(280, Math.max(56, rowCount * 44 + 8));
    this.menuStyle = computeFixedPopoverStyle(trigger, 200, estHeight, true);
  }

  private openMenu(): void {
    if (!this.canEdit) return;
    this.open = true;
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

  private closeMenu(): void {
    if (!this.open) return;
    this.open = false;
    this.detachMenuListeners();
  }

  private toggleMenu(): void {
    if (!this.canEdit) return;
    if (this.open) this.closeMenu();
    else this.openMenu();
  }

  private pickOption(next: string | null): void {
    if (!this.canEdit) return;
    this.closeMenu();
    if (next === null) {
      this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    }
    this.emitValueChange(next);
    this.shadowRoot?.querySelector<HTMLButtonElement>('.select-trigger')?.focus();
  }

  private clearSelection(): void {
    if (!this.canEdit) return;
    this.closeMenu();
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.emitValueChange(null);
  }

  private onMenuKeyDown = (event: KeyboardEvent): void => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const menu = event.currentTarget as HTMLElement;
    const enabled = Array.from(menu.querySelectorAll<HTMLButtonElement>('button.select-option:not(:disabled)'));
    if (!enabled.length) return;
    event.preventDefault();
    const idx = enabled.findIndex(b => b === this.shadowRoot?.activeElement || b === event.target);
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? enabled.length - 1
        : idx < 0
          ? 0
          : (idx + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
    enabled[next]?.focus();
  };

  private renderOptionButton(opt: EmrOption) {
    const sel = this.value === opt.value;
    return html`<button
      type="button"
      role="option"
      class="select-option"
      aria-selected=${sel}
      ?disabled=${opt.disabled}
      @click=${() => {
        if (opt.disabled) return;
        this.pickOption(String(opt.value));
      }}
    >
      <span class="select-tick" aria-hidden="true">${sel ? renderEmrSvgIcon('check', 14) : nothing}</span>
      <span class="option-tile-copy">
        <span>${opt.label}</span>
        ${opt.description ? html`<span class="option-tile-desc">${opt.description}</span>` : nothing}
      </span>
    </button>`;
  }

  override render() {
    if (!this.canEdit && this.open) this.closeMenu();
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const current = this.options.find(opt => opt.value === this.value);
    const displayLabel = current?.label ?? this.placeholder;
    const groups: readonly EmrOptionGroup[] = groupOptions(this.options);
    const hasNamedGroups = groups.some(g => g.label !== '');
    const showClearBtn = this.isClearable && this.value !== null && this.value !== '' && this.canEdit;
    const triggerCls = [
      'select-trigger',
      this.open ? 'select-trigger--open' : '',
      this.invalid || this.error ? 'select-trigger--invalid' : '',
      this.readOnly ? 'select-trigger--readonly' : '',
    ].filter(Boolean).join(' ');

    const selectControl = html`<div class="select-root">
      <div class="select-bar">
        <button
          id=${id}
          type="button"
          part="control"
          class=${triggerCls}
          role="combobox"
          aria-expanded=${this.open}
          aria-haspopup="listbox"
          aria-label=${this.label ? `${this.label}, ${displayLabel}` : displayLabel}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          aria-invalid=${this.invalid || this.error ? 'true' : nothing}
          aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
          ?disabled=${this.disabled}
          @click=${() => this.toggleMenu()}
          @keydown=${(e: KeyboardEvent) => {
            if (!this.canEdit) return;
            if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !this.open) {
              e.preventDefault();
              this.openMenu();
            }
          }}
        >
          <span class=${`select-trigger-text${current ? '' : ' select-trigger-text--placeholder'}`}>${displayLabel}</span>
          <span class="select-chevron" aria-hidden="true">${renderEmrSvgIcon(this.open ? 'chevron-up' : 'chevron-down', 16)}</span>
        </button>
        ${showClearBtn
          ? html`<button
              type="button"
              class="clear-inline-btn"
              data-clear-btn="true"
              aria-label=${`Clear ${this.label || 'selection'}`}
              @click=${() => this.clearSelection()}
            >${renderEmrSvgIcon('close', 14)}</button>`
          : nothing}
      </div>

      ${hasNamedGroups
        ? html`<div class="sr-only" aria-hidden="true">
            ${groups.map(grp =>
              grp.label
                ? html`<optgroup label=${grp.label}>
                    ${grp.options.map(o => html`<option value=${o.value}>${o.label}</option>`)}
                  </optgroup>`
                : nothing,
            )}
          </div>`
        : nothing}

      ${this.open && this.canEdit
        ? html`<div class="select-menu" popover="manual" part="listbox" role="listbox" aria-label=${this.label || 'Options'} style=${this.menuStyle} @keydown=${this.onMenuKeyDown}>
            ${this.isClearable
              ? html`<button
                  type="button"
                  role="option"
                  data-clear="true"
                  class="select-option select-option--placeholder"
                  aria-selected=${this.value == null}
                  @click=${() => this.pickOption(null)}
                >
                  <span class="select-tick" aria-hidden="true">${this.value == null ? renderEmrSvgIcon('check', 14) : nothing}</span>
                  <span>${this.placeholder}</span>
                </button>`
              : nothing}
            ${hasNamedGroups
              ? groups.map(grp =>
                  grp.label
                    ? html`<optgroup class="select-optgroup" role="group" label=${grp.label} aria-label=${grp.label}>
                        <div class="select-group-header" role="presentation">${grp.label}</div>
                        ${grp.options.map(opt => this.renderOptionButton(opt))}
                      </optgroup>`
                    : grp.options.map(opt => this.renderOptionButton(opt)),
                )
              : this.options.map(opt => this.renderOptionButton(opt))}
          </div>`
        : nothing}
    </div>`;

    if (this.labelHidden) return selectControl;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${selectControl}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
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
  @property({ type: Number }) min?: number;
  @property({ type: Number }) max?: number;
  @property({ type: Number }) step = 1;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const locked = this.readOnly || this.disabled;

    const row = html`<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;max-width:360px;">
      <emr-number-input
        .controlId=${id}
        .label=${this.label || 'Amount'}
        .labelHidden=${true}
        .value=${this.value}
        .min=${this.min}
        .max=${this.max}
        .step=${this.step}
        .disabled=${this.disabled}
        .readOnly=${this.readOnly}
        @valueChange=${(e: CustomEvent<number | null>) => {
          e.stopPropagation();
          if (!locked) this.emitValueChange(e.detail);
        }}
      ></emr-number-input>
      <div style="min-width:108px;">
        <emr-select
          .controlId=${`${id}-unit`}
          .label=${this.label ? `${this.label} unit` : 'Unit'}
          .labelHidden=${true}
          .options=${this.units}
          .value=${this.unit}
          .disabled=${this.disabled}
          .readOnly=${this.readOnly}
          @valueChange=${(e: CustomEvent<string | null>) => {
            e.stopPropagation();
            if (!locked) {
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
    </div>`;

    if (this.labelHidden) return row;

    return html`<div class="emr-field">
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

    const pairRow = html`<div style="display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;">
      ${this.firstLabel ? html`<strong class="emr-muted">${this.firstLabel}</strong>` : nothing}
      <input
        id=${`${id}-first`}
        class="emr-control"
        style="width:132px;"
        placeholder=${this.firstPlaceholder}
        aria-label=${this.firstLabel ? `${this.label ? `${this.label}, ` : ''}${this.firstLabel}` : this.label || 'First value'}
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
      <span class="emr-muted" aria-hidden="true">${this.separator}</span>
      ${this.secondLabel ? html`<strong class="emr-muted">${this.secondLabel}</strong>` : nothing}
      <input
        id=${`${id}-second`}
        class="emr-control"
        style="width:132px;"
        placeholder=${this.secondPlaceholder}
        aria-label=${this.secondLabel ? `${this.label ? `${this.label}, ` : ''}${this.secondLabel}` : this.label || 'Second value'}
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
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
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
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) labelPlacement: 'end' | 'start' | 'space-between' = 'end';
  @property({ type: Boolean }) checked = false;
  @property({ type: Boolean }) mixed = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  get value(): boolean {
    return this.checked;
  }
  set value(next: boolean | null) {
    this.checked = next === true;
  }

  protected emitCheckedToggle(): void {
    const next = this.mixed ? true : !this.checked;
    this.dispatchEvent(
      new CustomEvent<boolean>('checkedChange', {
        detail: next,
        bubbles: true,
        composed: true,
      }),
    );
    this.emitValueChange(next);
  }

  protected renderBooleanMessage() {
    if (this.labelHidden) return nothing;
    if (this.error) return html`<span class="emr-error" role="alert">⚠ ${this.error}</span>`;
    if (this.warning) return html`<span class="emr-warning" role="status">! ${this.warning}</span>`;
    if (this.hint) return html`<span class="emr-hint">${this.hint}</span>`;
    return nothing;
  }

  protected resolvePlacementClass(): string {
    if (this.labelPlacement === 'start') return ' option-tile--placement-start';
    if (this.labelPlacement === 'space-between') return ' option-tile--placement-between';
    return '';
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const cls = `option-tile${this.readOnly ? ' option-tile--readonly' : ''}${this.resolvePlacementClass()}`;
    const ariaChecked = this.mixed ? 'mixed' : String(this.checked);
    const button = html`<button
      id=${id}
      type="button"
      part="control"
      role="checkbox"
      data-label-placement=${this.labelPlacement}
      class=${cls}
      aria-label=${this.labelHidden && this.label ? this.label : nothing}
      aria-checked=${ariaChecked}
      aria-readonly=${this.readOnly ? 'true' : nothing}
      aria-invalid=${this.error ? 'true' : nothing}
      ?disabled=${this.disabled}
      @click=${() => {
        if (this.readOnly || this.disabled) return;
        this.emitCheckedToggle();
      }}
    >
      <span class="indicator" aria-hidden="true">
        ${this.mixed ? '–' : this.checked ? renderEmrSvgIcon('check', 12) : nothing}
      </span>
      ${this.labelHidden
        ? html`<slot></slot>`
        : html`<span>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}<slot></slot></span>`}
    </button>`;

    if (this.labelHidden) return button;

    return html`<div class="emr-field" part="field">
      ${button}
      ${this.renderBooleanMessage()}
    </div>`;
  }
}

export class EmrToggleElement extends EmrCheckboxElement {
  @property({ type: String }) onLabel = '';
  @property({ type: String }) offLabel = '';

  override render() {
    const id = this.controlId || this.fallbackId;
    const cls = `option-tile${this.readOnly ? ' option-tile--readonly' : ''}${this.resolvePlacementClass()}`;
    const stateLabel = this.checked ? this.onLabel : this.offLabel;
    const button = html`<button
      id=${id}
      type="button"
      part="control"
      role="switch"
      data-label-placement=${this.labelPlacement}
      class=${cls}
      aria-label=${this.labelHidden && this.label ? this.label : nothing}
      aria-checked=${String(this.checked)}
      aria-readonly=${this.readOnly ? 'true' : nothing}
      aria-invalid=${this.error ? 'true' : nothing}
      ?disabled=${this.disabled}
      @click=${() => {
        if (this.readOnly || this.disabled) return;
        this.emitCheckedToggle();
      }}
    >
      <span class="switch-track" part="track" aria-hidden="true">
        <span class="switch-thumb" part="thumb"></span>
      </span>
      ${stateLabel ? html`<span class="toggle-state-label">${stateLabel}</span>` : nothing}
      ${this.labelHidden
        ? html`<slot></slot>`
        : html`<span>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}<slot></slot></span>`}
    </button>`;

    if (this.labelHidden) return button;

    return html`<div class="emr-field" part="field">
      ${button}
      ${this.renderBooleanMessage()}
    </div>`;
  }
}

export class EmrRadioGroupElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-radio-group');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = null;
  @property({ attribute: false }) options: readonly EmrOption[] = [];
  @property({ type: String }) orientation: 'vertical' | 'horizontal' | 'grid' = 'vertical';
  @property({ type: Number }) columns = 2;
  @property({ type: String }) variant: 'standard' | 'card' | 'pill' = 'standard';
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: Boolean }) allowDeselect = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  private clearSelection(): void {
    if (this.readOnly || this.disabled) return;
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.emitValueChange(null);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const gridStyle =
      this.orientation === 'vertical'
        ? '--cols: 1;'
        : this.orientation === 'grid'
          ? `--cols: ${Math.max(1, this.columns)};`
          : '';
    const showClear = this.clearable && this.value !== null && this.value !== '' && !this.readOnly && !this.disabled;
    const clearBtn = showClear
      ? html`<button
          type="button"
          class="clear-inline-btn"
          data-clear-btn="true"
          aria-label=${`${this.clearLabel} ${this.label || 'selection'}`}
          @click=${() => this.clearSelection()}
        >${this.clearLabel}</button>`
      : nothing;

    const grid = html`<div
      id=${id}
      role="radiogroup"
      aria-label=${this.label || 'Options'}
      aria-readonly=${this.readOnly ? 'true' : nothing}
      aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
      class="option-grid"
      data-orientation=${this.orientation}
      data-variant=${this.variant}
      style=${gridStyle}
      @keydown=${(e: KeyboardEvent) => {
        const nextVal = keyboardOption(e, this.options);
        if (nextVal !== undefined && !this.readOnly && !this.disabled) {
          this.emitValueChange(nextVal);
        }
      }}
    >
      ${this.options.map(opt => {
        const sel = this.value === opt.value;
        const variantCls =
          this.variant === 'card'
            ? ' option-tile--card'
            : this.variant === 'pill'
              ? ' option-tile--pill'
              : '';
        const cls = `option-tile${this.readOnly ? ' option-tile--readonly' : ''}${variantCls}`;
        return html`<button
          type="button"
          role="radio"
          class=${cls}
          aria-checked=${String(sel)}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          ?disabled=${this.disabled || !!opt.disabled}
          @click=${() => {
            if (this.readOnly || this.disabled || opt.disabled) return;
            if (sel && this.allowDeselect) {
              this.clearSelection();
              return;
            }
            this.emitValueChange(String(opt.value));
          }}
        >
          <span class="indicator indicator--radio" aria-hidden="true">${sel ? renderEmrSvgIcon('check', 11) : nothing}</span>
          <span class="option-tile-copy">
            <span>${opt.label}</span>
            ${opt.description ? html`<span class="option-tile-desc">${opt.description}</span>` : nothing}
          </span>
        </button>`;
      })}
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
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.hint
          ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
          : nothing}
    </div>`;
  }
}

export class EmrBadgeElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) tone: EmrTone = 'neutral';
  @property({ type: String }) label = '';
  @property({ attribute: false }) badge?: EmrBadge;

  override render() {
    const tone = this.badge?.tone ?? this.tone;
    const text = this.badge?.label ?? this.label;
    return html`<span part="badge" class="emr-badge emr-badge--${tone}">
      ${text}${this.badge?.assistiveText ? html`<span class="sr-only"> ${this.badge.assistiveText}</span>` : nothing}<slot></slot>
    </span>`;
  }
}

export class EmrChipElement extends EmrBadgeElement {
  @property({ type: Boolean }) removable = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) removeLabel = '';

  override render() {
    const tone = this.badge?.tone ?? this.tone;
    const text = this.badge?.label ?? this.label;
    const cls = `emr-chip emr-badge--${tone}${this.removable ? ' chip-removable' : ''}`;
    return html`<span part="chip" class=${cls}>
      <span>${text}<slot></slot></span>
      ${this.removable
        ? html`<button
            type="button"
            class="chip-remove-btn"
            aria-label=${this.removeLabel || `Remove ${text || 'chip'}`}
            ?disabled=${this.disabled}
            @click=${(e: Event) => {
              e.stopPropagation();
              if (!this.disabled) {
                this.dispatchEvent(new CustomEvent('removeRequested', { bubbles: true, composed: true }));
              }
            }}
          >${renderEmrSvgIcon('close', 14)}</button>`
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
    return html`<div
      role=${this.tone === 'danger' ? 'alert' : 'status'}
      class="emr-card emr-badge--${this.tone}"
      style="border-radius:var(--emr-radius);padding:12px;"
    >
      ${this.title ? html`<strong style="display:block;">${this.title}</strong>` : nothing}
      ${this.message ? html`<div>${this.message}</div>` : nothing}
      <div><slot></slot></div>
    </div>`;
  }
}

export class EmrStateMessageElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) override title = '';
  @property({ type: String }) kind: 'empty' | 'loading' | 'error' | 'info' = 'empty';
  @property({ type: String }) message = '';

  @property({ type: String })
  get state(): 'empty' | 'loading' | 'error' | 'info' {
    return this.kind;
  }
  set state(next: 'empty' | 'loading' | 'error' | 'info') {
    this.kind = next;
  }

  @property({ type: String })
  get description(): string {
    return this.message;
  }
  set description(next: string) {
    this.message = next;
  }

  override render() {
    return html`<div class="emr-card" style="text-align:center;" role=${this.kind === 'error' ? 'alert' : 'status'}>
      <p class="emr-title">${this.title || this.kind}</p>
      ${this.message ? html`<p class="emr-muted">${this.message}</p>` : nothing}
      <slot></slot>
    </div>`;
  }
}

export class EmrSearchSelectElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-search-select');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) placeholder = 'Search…';
  @property({ type: String }) query = '';
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) filterMode: 'remote' | 'local' = 'remote';
  @property({ type: Boolean }) clearable = false;
  @property({ type: Boolean }) allowCustomValue = false;
  @property({ attribute: false }) options: readonly EmrOption[] = [];
  @property({ attribute: false }) selected: readonly EmrOption[] = [];
  @property({ type: Boolean }) multiple = false;
  @property({ type: Boolean }) open = false;
  @property({ type: Boolean }) loading = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) required = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: String }) emptyMessage = 'No matches';
  @property({ type: Boolean }) readOnly = false;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private get visibleOptions(): readonly EmrOption[] {
    if (this.filterMode === 'local') {
      return filterOptionsLocally(this.options, this.query);
    }
    return this.options;
  }

  private onOutsidePointerDown = (event: Event): void => {
    if (!this.open || this.locked) return;
    if (!event.composedPath().includes(this)) {
      if (this.filterMode === 'local') {
        this.open = false;
      }
      this.request('closeRequested');
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', this.onOutsidePointerDown, true);
    }
  }

  override disconnectedCallback(): void {
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

  private commitCustomQuery(rawQuery: string): void {
    if (this.locked || !this.allowCustomValue) return;
    const trimmed = rawQuery.trim();
    if (!trimmed) return;
    this.dispatchEvent(new CustomEvent<string>('customValueCommitted', { detail: trimmed, bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent<string>('optionSelected', { detail: trimmed, bubbles: true, composed: true }));
    this.emitValueChange(trimmed);
  }

  private clearAll(): void {
    if (this.locked) return;
    if (this.filterMode === 'local') {
      this.query = '';
    }
    this.dispatchEvent(new CustomEvent<string>('queryChange', { detail: '', bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent<string>('queryChanged', { detail: '', bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.emitValueChange(null);
  }

  private focusOptionAt(index: number): void {
    const enabled = Array.from(
      this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button[role="option"]:not(:disabled)') ?? [],
    );
    if (!enabled.length) return;
    const bounded = Math.max(0, Math.min(index, enabled.length - 1));
    enabled[bounded]?.focus();
  }

  private renderSearchOption(option: EmrOption, idx: number, totalCount: number) {
    const isSel = this.value === option.value || this.selected.some(item => item.value === option.value);
    return html`<button
      type="button"
      role="option"
      class="option-tile"
      aria-selected=${String(isSel)}
      ?disabled=${this.locked || !!option.disabled}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.focusOptionAt(idx + 1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.focusOptionAt(idx - 1);
        } else if (e.key === 'Home') {
          e.preventDefault();
          this.focusOptionAt(0);
        } else if (e.key === 'End') {
          e.preventDefault();
          this.focusOptionAt(totalCount - 1);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          if (this.filterMode === 'local') {
            this.open = false;
          }
          this.request('closeRequested');
          this.shadowRoot?.querySelector<HTMLInputElement>('input[role="combobox"]')?.focus();
        }
      }}
      @click=${() => {
        if (!this.locked && this.options.some(item => item.value === option.value && !item.disabled)) {
          this.dispatchEvent(
            new CustomEvent<string>('optionSelected', {
              detail: option.value,
              bubbles: true,
              composed: true,
            }),
          );
          this.emitValueChange(option.value);
          if (this.filterMode === 'local' && !this.multiple) {
            this.open = false;
          }
        }
      }}
    >
      <span>${option.label}</span>
      ${option.description ? html`<span class="emr-muted">${option.description}</span>` : nothing}
    </button>`;
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const listboxId = `${id}-listbox`;
    const msgId = `${id}-message`;
    const visible = this.visibleOptions;
    const groups = groupOptions(visible);
    const hasNamedGroups = groups.some(g => g.label !== '');
    const hasValueOrQuery = Boolean(this.value) || this.selected.length > 0 || Boolean(this.query);
    const showClearBtn = this.clearable && hasValueOrQuery && !this.locked;
    const trimmedQuery = this.query.trim();
    const canCommitCustom =
      this.allowCustomValue &&
      trimmedQuery.length > 0 &&
      !visible.some(opt => opt.label.toLowerCase() === trimmedQuery.toLowerCase() || opt.value === trimmedQuery);

    let runningIdx = 0;

    return html`<div class="emr-field">
      ${!this.labelHidden && this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${this.selected.length
        ? html`<div class="search-select-chips" role="list" aria-label="Selected options">
            ${this.selected.map(
              option => html`<span role="listitem" class="emr-chip chip-removable">
                <span>${option.label}</span>
                ${this.locked
                  ? nothing
                  : html`<button
                      type="button"
                      class="chip-remove-btn"
                      aria-label=${`Remove ${option.label}`}
                      @click=${() => this.request('removeRequested', option.value)}
                    >${renderEmrSvgIcon('close', 14)}</button>`}
              </span>`,
            )}
          </div>`
        : nothing}
      <div class="search-select-bar select-bar">
        <input
          id=${id}
          class="emr-control"
          type="search"
          role="combobox"
          autocomplete="off"
          aria-autocomplete="list"
          aria-expanded=${String(this.open && !this.readOnly)}
          aria-controls=${this.open && !this.readOnly ? listboxId : nothing}
          aria-label=${this.labelHidden ? this.label || 'Search' : nothing}
          aria-invalid=${this.error ? 'true' : nothing}
          aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
          .value=${this.locked ? live(this.query) : this.query}
          placeholder=${this.placeholder}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          ?required=${this.required}
          @focus=${() => {
            if (!this.open) {
              if (this.filterMode === 'local' && !this.locked) {
                this.open = true;
              }
              this.request('openRequested');
            }
          }}
          @keydown=${(event: KeyboardEvent) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (this.allowCustomValue && this.query.trim()) {
                this.commitCustomQuery(this.query);
              }
              this.request('searchRequested');
            } else if (event.key === 'Escape' && this.open) {
              event.preventDefault();
              if (this.filterMode === 'local') {
                this.open = false;
              }
              this.request('closeRequested');
            } else if (event.key === 'ArrowDown' && this.open) {
              event.preventDefault();
              this.focusOptionAt(0);
            }
          }}
          @blur=${(e: Event) => {
            (e.target as HTMLInputElement).value = this.query;
          }}
          @input=${(e: Event) => {
            if (this.locked) {
              (e.target as HTMLInputElement).value = this.query;
              return;
            }
            const nextQuery = (e.target as HTMLInputElement).value;
            if (this.filterMode === 'local') {
              this.query = nextQuery;
              this.open = true;
            }
            this.dispatchEvent(new CustomEvent<string>('queryChange', { detail: nextQuery, bubbles: true, composed: true }));
            this.dispatchEvent(new CustomEvent<string>('queryChanged', { detail: nextQuery, bubbles: true, composed: true }));
          }}
        />
        ${showClearBtn
          ? html`<button
              type="button"
              class="clear-inline-btn"
              data-clear-btn="true"
              aria-label=${`Clear ${this.label || 'search'}`}
              @click=${() => this.clearAll()}
            >${renderEmrSvgIcon('close', 14)}</button>`
          : nothing}
      </div>
      ${!this.labelHidden && this.error
        ? html`<p id=${msgId} class="emr-error" role="alert">${this.error}</p>`
        : !this.labelHidden && this.hint
          ? html`<p id=${msgId} class="emr-hint">${this.hint}</p>`
          : nothing}
      ${this.open && !this.readOnly
        ? html`<div
            id=${listboxId}
            class="search-select-panel"
            role="listbox"
            aria-label=${this.label || 'Search results'}
            aria-multiselectable=${this.multiple ? 'true' : nothing}
          >
            ${this.loading ? html`<p class="emr-muted" role="status">Searching…</p>` : nothing}
            ${!this.loading && !this.error && !visible.length && !canCommitCustom
              ? html`<p class="emr-muted" role="status">${this.emptyMessage}</p>`
              : nothing}
            ${hasNamedGroups
              ? groups.map(grp =>
                  grp.label
                    ? html`<optgroup class="select-optgroup" role="group" label=${grp.label} aria-label=${grp.label}>
                        <div class="select-group-header" role="presentation">${grp.label}</div>
                        ${grp.options.map(opt => this.renderSearchOption(opt, runningIdx++, visible.length))}
                      </optgroup>`
                    : grp.options.map(opt => this.renderSearchOption(opt, runningIdx++, visible.length)),
                )
              : visible.map((option, idx) => this.renderSearchOption(option, idx, visible.length))}
            ${canCommitCustom
              ? html`<button
                  type="button"
                  role="option"
                  data-custom-option="true"
                  class="option-tile"
                  aria-selected="false"
                  ?disabled=${this.locked}
                  @click=${() => this.commitCustomQuery(this.query)}
                >
                  <span>Use "${trimmedQuery}"</span>
                </button>`
              : nothing}
          </div>`
        : nothing}
    </div>`;
  }
}

export class EmrTabsElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ attribute: false }) tabs: readonly EmrOption[] = [];
  @property({ type: String }) active: string | null = null;
  @property({ type: String }) override ariaLabel: string | null = 'Tabs';
  @property({ type: Boolean }) readOnly = false;

  @property({ type: String })
  get activeTab(): string | null {
    return this.active;
  }
  set activeTab(next: string | null) {
    this.active = next;
  }

  private emitTab(value: string): void {
    this.dispatchEvent(new CustomEvent<string>('tabChange', { detail: value, bubbles: true, composed: true }));
    this.emitValueChange(value);
  }

  override render() {
    return html`<div
      role="tablist"
      aria-label=${this.ariaLabel}
      aria-readonly=${this.readOnly ? 'true' : nothing}
      class="tabs-bar"
      @keydown=${(e: KeyboardEvent) => {
        const value = keyboardOption(e, this.tabs);
        if (value !== undefined && !this.readOnly) {
          this.emitTab(value);
        }
      }}
    >
      ${this.tabs.map((tab, idx) => {
        const isActive = this.active === tab.value;
        const isTabStop = isActive || (this.active == null && idx === 0);
        const cls = `option-tile${this.readOnly ? ' option-tile--readonly' : ''}`;
        return html`<button
          type="button"
          role="tab"
          class=${cls}
          tabindex=${isTabStop ? '0' : '-1'}
          aria-selected=${String(isActive)}
          aria-disabled=${this.readOnly ? 'true' : nothing}
          ?disabled=${!!tab.disabled}
          @click=${() => {
            if (this.readOnly || tab.disabled) return;
            this.emitTab(String(tab.value));
          }}
        >${tab.label}</button>`;
      })}
    </div>`;
  }
}

export class EmrSeparatorElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) label = '';
  @property({ type: String }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  override render() {
    if (this.orientation === 'vertical') {
      return html`<div role="separator" aria-orientation="vertical" class="separator-vertical"></div>`;
    }
    if (!this.label.trim()) {
      return html`<div role="separator" aria-orientation="horizontal" class="separator-plain"></div>`;
    }
    return html`<div role="separator" aria-orientation="horizontal" class="separator-labelled">
      <div class="separator-line"></div>
      <span class="emr-muted">${this.label}</span>
      <div class="separator-line"></div>
    </div>`;
  }
}

export class EmrLikertElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-likert');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 10;
  @property({ type: Number }) value: number | null = null;
  @property({ attribute: false }) anchors?: EmrScaleAnchorsProp;
  @property({ attribute: false }) optionTones?: Readonly<Record<number, EmrTone>>;
  @property({ type: String }) tone?: EmrTone;
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readOnly = false;

  private clearSelection(): void {
    if (this.readOnly || this.disabled) return;
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.emitValueChange(null);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const pts: number[] = [];
    for (let i = this.min; i <= this.max; i++) pts.push(i);
    const resolvedAnchors = resolveScaleAnchors(this.anchors, this.min, this.max);
    const hasAnchors = !!(resolvedAnchors.minLabel || resolvedAnchors.midLabel || resolvedAnchors.maxLabel);
    const showClear = this.clearable && this.value !== null && !this.readOnly && !this.disabled;
    const clearBtn = showClear
      ? html`<button
          type="button"
          class="clear-inline-btn"
          data-clear-btn="true"
          aria-label=${`${this.clearLabel} ${this.label || 'rating'}`}
          @click=${() => this.clearSelection()}
        >${this.clearLabel}</button>`
      : nothing;

    const pipOptions: EmrOption[] = pts.map(n => ({ value: String(n), label: String(n) }));

    const track = html`<div class="emr-field">
      <div
        id=${id}
        role="radiogroup"
        aria-label=${this.label || 'Rating scale'}
        aria-readonly=${this.readOnly ? 'true' : nothing}
        aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
        class="likert-row"
        @keydown=${(e: KeyboardEvent) => {
          const next = keyboardOption(e, pipOptions);
          if (next !== undefined && !this.readOnly && !this.disabled) {
            this.emitValueChange(Number(next));
          }
        }}
      >
        ${pts.map(n => {
          const selected = this.value === n;
          const pipTone = this.optionTones?.[n] ?? (selected ? this.tone : undefined);
          const cls = `option-tile likert-pip${this.readOnly ? ' option-tile--readonly' : ''}`;
          return html`<button
            type="button"
            role="radio"
            class=${cls}
            data-tone=${pipTone ?? nothing}
            aria-checked=${String(selected)}
            aria-pressed=${String(selected)}
            aria-readonly=${this.readOnly ? 'true' : nothing}
            ?disabled=${this.disabled}
            @click=${() => {
              if (!this.readOnly && !this.disabled) this.emitValueChange(n);
            }}
          >${n}</button>`;
        })}
      </div>
      ${hasAnchors && !this.disabled
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
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.hint
          ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
          : nothing}
    </div>`;
  }
}

const VAS_MAX_TICKS = 400;

export class EmrVasElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackId = nextL1Id('emr-vas');
  private dragging = false;

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) step = 1;
  @property({ type: Number }) majorInterval = 10;
  @property({ type: Number }) minorInterval = 5;
  @property({ type: String }) orientation: 'horizontal' | 'vertical' = 'horizontal';
  @property({ attribute: false }) anchors?: EmrScaleAnchorsProp;
  @property({ type: String }) tone: EmrTone = 'neutral';
  @property({ type: String }) valueText = '';
  @property({ type: Number }) value: number | null = null;
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  private get canInteract(): boolean {
    return !this.readOnly && !this.disabled;
  }

  private clearSelection(): void {
    if (!this.canInteract) return;
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.emitValueChange(null);
  }

  private toPercent(val: number): number {
    const span = this.max - this.min;
    if (!(span > 0)) return 0;
    return Math.min(100, Math.max(0, ((val - this.min) / span) * 100));
  }

  private snapValue(raw: number): number {
    const lo = Math.min(this.min, this.max);
    const hi = Math.max(this.min, this.max);
    const bounded = Math.min(hi, Math.max(lo, raw));
    if (!(this.step > 0)) return Number(bounded.toFixed(4));
    return Number((this.min + Math.round((bounded - this.min) / this.step) * this.step).toFixed(4));
  }

  private emitSnapped(raw: number): void {
    if (!this.canInteract) return;
    const snapped = this.snapValue(raw);
    if (snapped === this.value) return;
    this.emitValueChange(snapped);
  }

  private emitFromPointer(event: PointerEvent, target: HTMLElement): void {
    const rect = target.getBoundingClientRect();
    const ratio =
      this.orientation === 'vertical'
        ? rect.height > 0
          ? (rect.bottom - event.clientY) / rect.height
          : 0
        : rect.width > 0
          ? (event.clientX - rect.left) / rect.width
          : 0;
    this.emitSnapped(this.min + ratio * (this.max - this.min));
  }

  private buildTicks(): { value: number; pct: number; major: boolean; label: string | null }[] {
    const span = this.max - this.min;
    if (!(span > 0)) return [];
    const major = this.majorInterval > 0 ? this.majorInterval : span;
    const minor = this.minorInterval > 0 ? this.minorInterval : major;
    const smallest = Math.min(major, minor);
    const stride = span / smallest > VAS_MAX_TICKS ? span / VAS_MAX_TICKS : smallest;
    const list: { value: number; pct: number; major: boolean; label: string | null }[] = [];
    for (let v = this.min; v <= this.max + stride / 1000; v += stride) {
      const rounded = Number(v.toFixed(6));
      const offset = Math.abs(rounded - this.min);
      const rem = offset % major;
      const isMajor = rem < major / 1000 || Math.abs(rem - major) < major / 1000;
      list.push({
        value: rounded,
        pct: this.toPercent(rounded),
        major: isMajor,
        label: isMajor ? (Number.isInteger(rounded) ? String(rounded) : String(Number(rounded.toFixed(2)))) : null,
      });
    }
    return list;
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this.canInteract) return;
    const stepSize = this.step > 0 ? this.step : 1;
    const page = this.majorInterval > 0 ? this.majorInterval : stepSize * 10;
    const current = this.value ?? this.min;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = current + stepSize;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = current - stepSize;
        break;
      case 'PageUp':
        next = current + page;
        break;
      case 'PageDown':
        next = current - page;
        break;
      case 'Home':
        next = this.min;
        break;
      case 'End':
        next = this.max;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.emitSnapped(next);
  };

  override render() {
    const id = this.controlId || this.fallbackId;
    const labelId = `${id}-label`;
    const msgId = `${id}-message`;
    const pct = this.value === null || this.value === undefined ? null : this.toPercent(this.value);
    const ticks = this.buildTicks();
    const resolvedAnchors = resolveScaleAnchors(this.anchors, this.min, this.max);
    const hasAnchors = !!(resolvedAnchors.minLabel || resolvedAnchors.midLabel || resolvedAnchors.maxLabel);
    const showClear = this.clearable && this.value !== null && this.canInteract;
    const clearBtn = showClear
      ? html`<button
          type="button"
          class="clear-inline-btn"
          data-clear-btn="true"
          aria-label=${`${this.clearLabel} ${this.label || 'scale'}`}
          @click=${() => this.clearSelection()}
        >${this.clearLabel}</button>`
      : nothing;

    const sliderCls = [
      'vas-slider',
      this.orientation === 'vertical' ? 'vas-slider--vertical' : '',
      this.readOnly ? 'vas-slider--readonly' : '',
      this.disabled ? 'vas-slider--disabled' : '',
      this.error ? 'vas-slider--invalid' : '',
    ].filter(Boolean).join(' ');

    const rulerFrame = html`<div class=${`vas-frame${this.orientation === 'vertical' ? ' vas-frame--vertical' : ''}`}>
      <div
        id=${id}
        part="slider"
        role="slider"
        class=${sliderCls}
        tabindex=${this.disabled ? -1 : 0}
        aria-orientation=${this.orientation}
        aria-labelledby=${!this.labelHidden && this.label ? labelId : nothing}
        aria-label=${this.labelHidden || !this.label ? this.label || 'Visual analogue scale' : nothing}
        aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
        aria-valuemin=${String(this.min)}
        aria-valuemax=${String(this.max)}
        aria-valuenow=${this.value ?? nothing}
        aria-valuetext=${this.valueText || nothing}
        aria-readonly=${this.readOnly ? 'true' : nothing}
        aria-disabled=${this.disabled ? 'true' : nothing}
        aria-invalid=${this.error ? 'true' : nothing}
        @keydown=${this.onKeyDown}
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
          this.dragging = false;
          const target = e.currentTarget as HTMLElement;
          if (target.hasPointerCapture?.(e.pointerId)) {
            target.releasePointerCapture(e.pointerId);
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
              style=${`--vas-pct: ${tick.pct};`}
              aria-hidden="true"
            ></span>
            ${tick.label !== null
              ? html`<span class="vas-tick-label" style=${`--vas-pct: ${tick.pct};`} aria-hidden="true">${tick.label}</span>`
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
          <span class=${`emr-badge emr-badge--${this.value === null ? 'neutral' : this.tone}`}>
            ${this.value === null ? 'Unmarked' : `${this.value} / ${this.max}`}
          </span>
          ${clearBtn}
        </div>
      </div>
      ${rulerFrame}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.hint
          ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
          : nothing}
    </div>`;
  }
}

export class EmrCardElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];

  private readonly fallbackHeadingId = nextL1Id('emr-card-heading');

  @property({ type: String }) label = '';
  @property({ type: Boolean }) padded = true;
  @property({ type: String }) headingId = '';
  @property({ type: String }) cardTitle = '';
  @property({ type: String }) override title = '';

  override render() {
    const heading = this.label || this.cardTitle || this.title;
    const hId = this.headingId || this.fallbackHeadingId;
    const cls = `emr-card${this.padded ? '' : ' emr-card--flush'}`;
    return html`<section class=${cls} part="card" aria-labelledby=${heading ? hId : nothing}>
      ${heading ? html`<h3 id=${hId} class="emr-title">${heading}</h3>` : nothing}
      <slot></slot>
    </section>`;
  }
}

export class EmrColumnsElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: Number }) count = 2;
  @property({ attribute: false }) widths?: readonly string[];
  @property({ type: String }) gap = '16px';

  @property({ type: Number })
  get columns(): number {
    return this.count;
  }
  set columns(next: number) {
    this.count = next;
  }

  override render() {
    const c = Math.max(1, Math.min(6, this.count || 2));
    const template =
      this.widths && this.widths.length > 0 ? this.widths.join(' ') : `repeat(${c}, minmax(0, 1fr))`;
    const gapVal = this.gap || '16px';
    return html`<div
      class="columns-grid"
      style=${`--emr-col-template: ${template}; --emr-col-gap: ${gapVal};`}
    ><slot></slot></div>`;
  }
}

export class EmrFieldValueRowElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) field = '';
  @property({ type: String }) value = '';
  @property({ type: String }) remarks = '';
  @property({ type: String }) notes = '';
  @property({ type: Boolean }) heading = false;
  @property({ type: String }) placeholder = '—';

  override render() {
    const cls = `fvr-row${this.heading ? ' fvr-row--heading' : ''}`;
    return html`<div class=${cls} role="row">
      <strong role="cell">${this.field}</strong>
      <span role="cell">${this.heading ? this.value : this.value || this.placeholder}</span>
      <span role="cell" class="emr-muted">${this.remarks}</span>
      <span role="cell" class="emr-muted">${this.notes}</span>
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
  @property({ attribute: false }) action?: { readonly label: string; readonly icon?: string };
  @property({ type: String }) secondaryNote = '';
  @property({ type: Boolean }) compact = false;
  @property({ type: Boolean }) interactive = false;
  @property({ type: Boolean }) selectable = false;
  @property({ type: Boolean }) readOnly = false;

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
    const a = this.attribution;
    if (!a) return '';
    if (typeof a === 'string') return a;
    return [a.nameLabel ?? a.author, a.roleLabel, a.timeLabel ?? a.timestamp].filter(Boolean).join(' · ');
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const isInteractive = (this.interactive || this.selectable) && !this.readOnly;
    const resolvedAction = this.actionLabel || this.action?.label || '';
    const attrText = this.resolvedAttribution;
    const hiddenText = [this.valueLabel, attrText, this.secondaryNote].filter(Boolean).join('. ');

    return html`<div class="status-cell">
      <div
        id=${id}
        class=${`status-cell-body${isInteractive ? ' status-cell-body--interactive' : ''}`}
        role=${isInteractive ? 'button' : nothing}
        tabindex=${isInteractive ? '0' : nothing}
        @click=${() => {
          if (isInteractive) {
            this.dispatchEvent(new CustomEvent('selected', { bubbles: true, composed: true }));
          }
        }}
        @keydown=${(e: KeyboardEvent) => {
          if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            this.dispatchEvent(new CustomEvent('selected', { bubbles: true, composed: true }));
          }
        }}
      >
        <div class="status-cell-main">
          ${this.status ? html`<emr-badge .badge=${this.status}></emr-badge>` : nothing}
          ${!this.compact && this.valueLabel ? html`<strong>${this.valueLabel}</strong>` : nothing}
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
      ${resolvedAction && !this.readOnly && !this.compact
        ? html`<button
            type="button"
            class="emr-btn emr-btn--outline emr-btn--sm status-cell-action"
            @click=${() => {
              if (!this.readOnly) {
                this.dispatchEvent(new CustomEvent('actionClicked', { bubbles: true, composed: true }));
              }
            }}
          >${resolvedAction}</button>`
        : nothing}
    </div>`;
  }
}

export class EmrStageStepperElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ attribute: false }) stages: readonly EmrStage[] = [];
  @property({ type: String }) activeId = '';
  @property({ type: String }) override ariaLabel: string | null = 'Stages';
  @property({ type: String }) orientation: 'horizontal' | 'vertical' = 'horizontal';
  @property({ type: Boolean }) readOnly = false;

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
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const buttons = Array.from(this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button.stage-btn') ?? []);
    if (!buttons.length) return;
    const cur = buttons.findIndex(b => b === event.target);
    if (cur < 0) return;
    event.preventDefault();
    const last = buttons.length - 1;
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : Math.min(last, Math.max(0, cur + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1)));
    buttons[next]?.focus();
  };

  override render() {
    const listCls = `stage-list${this.orientation === 'vertical' ? ' stage-list--vertical' : ''}`;
    const hasActive = this.stages.some(s => s.id === this.activeId);

    return html`<nav aria-label=${this.ariaLabel || 'Stages'}>
      <ol class=${listCls} @keydown=${this.onKeyDown}>
        ${this.stages.map((s, idx) => {
          const isActive = s.id === this.activeId;
          const isTabStop = isActive || (!hasActive && idx === 0);
          const btnCls = [
            'stage-btn',
            isActive ? 'stage-btn--active' : '',
            this.readOnly ? 'stage-btn--readonly' : '',
          ].filter(Boolean).join(' ');
          return html`<li>
            <button
              type="button"
              class=${btnCls}
              tabindex=${isTabStop ? '0' : '-1'}
              aria-current=${isActive ? 'step' : nothing}
              aria-pressed=${String(isActive)}
              aria-readonly=${this.readOnly ? 'true' : nothing}
              @click=${() => {
                if (!this.readOnly) this.emitStage(s.id);
              }}
            >
              <span class="stage-num" aria-hidden="true">${idx + 1}</span>
              <span>
                <strong>${s.label}</strong>
                ${s.description ? html`<span class="emr-muted" style="display:block;">${s.description}</span>` : nothing}
              </span>
              ${s.status ? html`<emr-badge .badge=${s.status}></emr-badge>` : nothing}
            </button>
          </li>`;
        })}
      </ol>
    </nav>`;
  }
}

export class EmrStatTileElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ attribute: false }) model?: EmrStatTileModel;
  @property({ type: Boolean }) interactive = true;
  @property({ type: Boolean }) readOnly = false;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const content = html`<span class="emr-muted">${m.label}</span>
      <strong style="font-size:var(--emr-text-2xl);">${m.value}</strong>
      ${m.sub ? html`<span>${m.sub}</span>` : nothing}
      ${m.status ? html`<emr-badge .badge=${m.status}></emr-badge>` : nothing}`;
    return this.interactive && !this.readOnly
      ? html`<button type="button" class="emr-card" aria-label=${m.accessibilityLabel ?? `${m.label} ${m.value}`} @click=${() => this.emitIntent({ type: 'statSelected', key: m.key })}>${content}</button>`
      : html`<div class="emr-card">${content}</div>`;
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
