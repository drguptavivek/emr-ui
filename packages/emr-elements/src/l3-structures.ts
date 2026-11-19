import { html, css, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import {
  FAVOURITES_GROUP_ID,
  canAddClinicalListItem,
  canAddRepeatableItem,
  canChangeDataTablePage,
  canChangeDataTablePageSize,
  canChangeTimeAxisStep,
  canEditClinicalListItem,
  canMoveAnnotationLayer,
  canMutateDataTableFilters,
  canMutateDataTableSavedFilter,
  canMutateMatrixCell,
  canMutateMatrixRemark,
  canOpenToolbarPen,
  canPanTimeAxis,
  canRemoveAnnotationLayer,
  canRemoveClinicalListItem,
  canRemoveRepeatableItem,
  canSelectDataTableRows,
  canSelectImageTemplate,
  canSelectTimeAxisSlot,
  canSortDataTableColumn,
  canToggleAnnotationLayerLock,
  canToggleAnnotationLayerVisibility,
  canToggleTemplateFavourite,
  canTriggerDataTableBulkAction,
  canTriggerToolbarIntent,
  formatMatrixCellValue,
  groupMatrixColumns,
  isClinicalListItemSelectable,
  isEmptyValue,
  isFieldShown,
  isMatrixCellApplicable,
  isSectionShown,
  nextDataTableRowIndex,
  nextDataTableSortDirection,
  normalizeClinicalListHeadingLevel,
  normalizeClinicalListVariant,
  normalizeSectionCardHeadingLevel,
  normalizeSectionCardPadding,
  normalizeSectionCardTone,
  normalizeSectionCardVariant,
  resolveAnnotationListId,
  resolveAnnotationToolbarPanelId,
  resolveClinicalFormControlId,
  resolveClinicalFormDomId,
  resolveClinicalListHeadingId,
  resolveDataTableColumnWidth,
  resolveDataTableHeadingId,
  resolveDataTableId,
  resolveImageTemplatePickerHeadingId,
  resolveImageTemplatePickerId,
  resolveImageTemplateSearchId,
  resolveImageTemplateSectionId,
  resolveMatrixDecimalStep,
  resolveMatrixHeadingId,
  resolveMatrixQuantityUnit,
  resolveRepeatableControlId,
  resolveRepeatableHeadingId,
  resolveSectionCardContentId,
  resolveSectionCardHeadingId,
  resolveSectionCardToggleLabel,
  resolveTimeAxisHeadingId,
  resolveTimeAxisId,
  resolveTimeAxisNextIndex,
  resolveTimeAxisTabStopId,
  resolveTimeAxisTickId,
  selectAllDataTableState,
  toggleAllDataTableSelection,
  toggleDataTableRowSelection,
  type AnnotationLayerRecord,
  type AnnotationListIntent,
  type AnnotationListItem,
  type AnnotationListViewModel,
  type AnnotationToolbarIntent,
  type AnnotationToolbarViewModel,
  type ClinicalAssessmentStatus,
  type ClinicalCellState,
  type ClinicalColumn,
  type ClinicalFieldDefinition,
  type ClinicalFieldState,
  type ClinicalFieldValue,
  type ClinicalFormIntent,
  type ClinicalFormViewModel,
  type ClinicalListIntent,
  type ClinicalListItem,
  type ClinicalListViewModel,
  type ClinicalMatrixBlockDefinition,
  type ClinicalMatrixIntent,
  type ClinicalMatrixSchema,
  type ClinicalMatrixValues,
  type ClinicalRow,
  type EmrAnnotationListLabels,
  type EmrAnnotationToolbarLabels,
  type EmrBadge,
  type EmrClinicalListHeadingLevel,
  type EmrClinicalListLabels,
  type EmrDataTableIntent,
  type EmrDataTableLabels,
  type EmrDataTableModel,
  type EmrImageTemplatePickerLabels,
  type EmrSectionCardHeadingLevel,
  type EmrSectionCardPadding,
  type EmrSectionCardVariant,
  type EmrTimeAxisLabels,
  type EmrTone,
  type ImageTemplateOption,
  type ImageTemplatePickerIntent,
  type ImageTemplatePickerViewModel,
  type RepeatableGroupDefinition,
  type RepeatableItemState,
  type SectionCardIntent,
  type TimeAxisIntent,
  type TimeAxisViewModel,
  type ToolbarTool,
} from '@drguptavivek/emr-controller';
import { EmrLitElement, defineEmrElement, emrShadowStyles } from './foundations.js';
import { renderEmrSvgIcon, type EmrLitIconName } from './icons.js';
import { registerL2Elements } from './l2-fields.js';

const l3Styles = css`
  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid var(--emr-border, #c7d3da);
    font-size: var(--emr-text-sm, 0.8125rem);
  }
  th {
    background: var(--emr-surface-raised, #eff3f5);
    color: var(--emr-text-muted, #5c6c78);
    font-weight: var(--emr-weight-bold, 700);
  }
  [data-density="compact"] th, [data-density="compact"] td {
    padding-block: 4px;
  }
  .toolbar-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }
  .field-stack {
    display: grid;
    gap: 12px;
  }
  .section-card {
    display: block;
    padding: 0;
    gap: 0;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: 10px;
    background: var(--emr-surface, #fffefa);
    overflow: clip;
    min-width: 0;
    transition: border-color 140ms ease, box-shadow 140ms ease;
  }
  .section-card--elevated {
    box-shadow: var(--emr-shadow, 0 4px 12px rgba(15, 23, 42, 0.08));
  }
  .section-card--filled {
    background: var(--emr-surface-raised, #eff3f5);
  }
  .section-card--subtle {
    background: var(--emr-surface-soft, #f1f4f5);
  }
  .section-card[data-tone="info"] {
    border-color: color-mix(in srgb, var(--emr-info, #486f86) 45%, var(--emr-border, #c7d3da));
  }
  .section-card[data-tone="success"] {
    border-color: color-mix(in srgb, var(--emr-success, #2b7650) 45%, var(--emr-border, #c7d3da));
  }
  .section-card[data-tone="warning"] {
    border-color: color-mix(in srgb, var(--emr-warning, #8a651f) 45%, var(--emr-border, #c7d3da));
  }
  .section-card[data-tone="danger"] {
    border-color: color-mix(in srgb, var(--emr-danger, #a44949) 45%, var(--emr-border, #c7d3da));
  }
  .section-card--readonly {
    border-style: dashed;
  }
  .section-header {
    min-height: 60px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--emr-surface-accent, #e8eef2);
    border-bottom: 1px solid var(--emr-border, #c7d3da);
    box-sizing: border-box;
  }
  .section-card--collapsed .section-header {
    border-bottom-width: 0;
    border-bottom-color: transparent;
  }
  .section-header-icon {
    width: 20px;
    height: 20px;
    display: inline-grid;
    place-items: center;
    color: var(--emr-text-muted, #5c6c78);
    flex: 0 0 auto;
  }
  .section-heading {
    min-width: 0;
    flex: 1 1 180px;
  }
  .section-heading .emr-title {
    margin: 0;
    font-size: var(--emr-text-lg, 1rem);
    font-weight: var(--emr-weight-bold, 700);
    color: var(--emr-text, #263847);
    line-height: 1.35;
  }
  .section-desc {
    margin: 3px 0 0;
    font-size: var(--emr-text-sm, 0.8125rem);
    color: var(--emr-text-muted, #5c6c78);
    line-height: 1.4;
  }
  .section-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
  }
  .section-actions[hidden] {
    display: none;
  }
  .section-toggle {
    min-height: var(--emr-control-height, 44px);
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
  }
  .section-chevron {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--emr-text-muted, #5c6c78);
    transition: transform 150ms ease;
  }
  .section-chevron--expanded {
    transform: rotate(180deg);
  }
  @media (prefers-reduced-motion: reduce) {
    .section-chevron {
      transition: none;
    }
  }
  .section-content {
    padding: 16px;
  }
  .section-card--pad-none .section-content {
    padding: 0;
  }
  .section-card--pad-sm .section-content {
    padding: 10px;
  }
  .section-card--pad-lg .section-content {
    padding: 24px;
  }
  .section-content[data-collapsed],
  .section-content[hidden] {
    display: none;
  }
  .section-footer {
    padding: 10px 16px;
    border-top: 1px solid var(--emr-border, #c7d3da);
    background: var(--emr-surface-soft, #f1f4f5);
  }
  .section-footer[data-collapsed],
  .section-footer[hidden] {
    display: none;
  }
  :host-context(.emr-print) .section-content[data-collapsed],
  :host-context(.emr-print) .section-content[hidden] {
    display: block !important;
  }
  :host-context(.emr-print) .section-actions[hidden],
  :host-context(.emr-print) .section-footer[hidden],
  :host-context(.emr-print) .section-toggle {
    display: none !important;
  }
  @media print {
    .section-content[data-collapsed],
    .section-content[hidden] {
      display: block !important;
    }
    .section-actions[hidden],
    .section-footer[hidden],
    .section-toggle {
      display: none !important;
    }
  }

  .repeatable-group {
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    padding: 16px;
    background: var(--emr-surface-slate, #edf1f3);
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-width: 0;
    container-type: inline-size;
    gap: 12px;
  }
  .repeatable-group--readonly {
    border-style: dashed;
  }
  .repeatable-group--error {
    border-color: var(--emr-danger, #a44949);
  }
  .repeatable-group--warning {
    border-color: var(--emr-warning, #8a651f);
  }
  .repeatable-heading,
  .repeatable-item-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  .repeatable-heading-text {
    flex: 1 1 200px;
    min-width: 0;
  }
  .repeatable-heading .emr-title {
    margin: 0;
    font-size: var(--emr-text-lg, 1rem);
    font-weight: var(--emr-weight-bold, 700);
    color: var(--emr-text, #263847);
  }
  .repeatable-desc,
  .repeatable-empty {
    margin: 4px 0 0;
    font-size: var(--emr-text-md, 0.875rem);
    color: var(--emr-text-muted, #5c6c78);
  }
  .repeatable-empty {
    margin-top: 0;
  }
  .repeatable-btn {
    min-height: var(--emr-control-height, 44px);
    min-width: 44px;
    flex-shrink: 0;
  }
  .repeatable-limit {
    font-size: var(--emr-text-xs, 0.75rem);
    font-weight: var(--emr-weight-semibold, 600);
    color: var(--emr-text-muted, #5c6c78);
    padding-top: 6px;
  }
  .repeatable-message {
    margin: 0;
  }
  .repeatable-item {
    padding: 12px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-width: 0;
    gap: 12px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .repeatable-item--readonly {
    border-style: dashed;
  }
  .repeatable-item--error {
    border-color: var(--emr-danger, #a44949);
  }
  .repeatable-item--warning {
    border-color: var(--emr-warning, #8a651f);
  }
  .repeatable-item-title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    flex: 1 1 160px;
    min-width: 0;
    font-size: var(--emr-text-md, 0.875rem);
    font-weight: var(--emr-weight-semibold, 600);
    color: var(--emr-text, #263847);
  }
  .repeatable-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 16px;
  }
  .repeatable-field {
    min-width: 0;
  }
  @container (max-width: 720px) {
    .repeatable-grid {
      grid-template-columns: 1fr;
    }
    .repeatable-field {
      grid-column: span 1 !important;
    }
  }
  @media (max-width: 720px) {
    .repeatable-grid {
      grid-template-columns: 1fr;
    }
    .repeatable-field {
      grid-column: span 1 !important;
    }
  }
  .clinical-form {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-width: 0;
    container-type: inline-size;
    gap: 16px;
  }
  .clinical-form-description,
  .clinical-form-empty {
    margin: 0;
    font-size: var(--emr-text-md, 0.875rem);
    color: var(--emr-text-muted, #5c6c78);
  }
  .clinical-form-correction {
    display: grid;
    gap: 8px;
    justify-items: start;
  }
  .clinical-form-correction-btn {
    min-height: var(--emr-control-height, 44px);
    min-width: 44px;
  }
  .clinical-form-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 16px;
  }
  .clinical-form-field,
  .clinical-form-full {
    min-width: 0;
  }
  .clinical-form-full {
    grid-column: span 12;
  }
  .clinical-form-matrix {
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  .clinical-form-matrix .emr-title {
    margin: 0;
    font-size: var(--emr-text-lg, 1rem);
    font-weight: var(--emr-weight-bold, 700);
    color: var(--emr-text, #263847);
  }
  .clinical-form-matrix-table-wrap {
    overflow-x: auto;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
  }
  .clinical-form-matrix-cell-label {
    display: none;
  }
  @container (max-width: 720px) {
    .clinical-form-grid {
      grid-template-columns: 1fr;
    }
    .clinical-form-field,
    .clinical-form-full {
      grid-column: span 1 !important;
    }
    .clinical-form-matrix-table-wrap {
      overflow: visible;
      border: 0;
      border-radius: 0;
    }
    .clinical-form-matrix-table,
    .clinical-form-matrix-table tbody,
    .clinical-form-matrix-table tr,
    .clinical-form-matrix-table th,
    .clinical-form-matrix-table td {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
    .clinical-form-matrix-table thead {
      display: none;
    }
    .clinical-form-matrix-table tr {
      padding: 10px 0;
      border-top: 1px solid var(--emr-border, #c7d3da);
      display: grid;
      gap: 10px;
    }
    .clinical-form-matrix-table tr:first-child {
      border-top: 0;
      padding-top: 0;
    }
    .clinical-form-matrix-table th[scope="row"] {
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--emr-text, #263847);
      font-size: var(--emr-text-md, 0.875rem);
      font-weight: var(--emr-weight-bold, 700);
    }
    .clinical-form-matrix-table td {
      padding: 0;
      border: 0;
      display: grid;
      gap: 4px;
    }
    .clinical-form-matrix-table td:empty {
      display: none;
    }
    .clinical-form-matrix-cell-label {
      display: block;
      font-size: var(--emr-text-sm, 0.8125rem);
      font-weight: var(--emr-weight-medium, 550);
      color: var(--emr-text-muted, #5c6c78);
    }
  }
  @media (max-width: 720px) {
    .clinical-form-grid {
      grid-template-columns: 1fr;
    }
    .clinical-form-field,
    .clinical-form-full {
      grid-column: span 1 !important;
    }
    .clinical-form-matrix-table-wrap {
      overflow: visible;
      border: 0;
      border-radius: 0;
    }
    .clinical-form-matrix-table,
    .clinical-form-matrix-table tbody,
    .clinical-form-matrix-table tr,
    .clinical-form-matrix-table th,
    .clinical-form-matrix-table td {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
    .clinical-form-matrix-table thead {
      display: none;
    }
    .clinical-form-matrix-table tr {
      padding: 10px 0;
      border-top: 1px solid var(--emr-border, #c7d3da);
      display: grid;
      gap: 10px;
    }
    .clinical-form-matrix-table tr:first-child {
      border-top: 0;
      padding-top: 0;
    }
    .clinical-form-matrix-table th[scope="row"] {
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--emr-text, #263847);
      font-size: var(--emr-text-md, 0.875rem);
      font-weight: var(--emr-weight-bold, 700);
    }
    .clinical-form-matrix-table td {
      padding: 0;
      border: 0;
      display: grid;
      gap: 4px;
    }
    .clinical-form-matrix-table td:empty {
      display: none;
    }
    .clinical-form-matrix-cell-label {
      display: block;
      font-size: var(--emr-text-sm, 0.8125rem);
      font-weight: var(--emr-weight-medium, 550);
      color: var(--emr-text-muted, #5c6c78);
    }
  }
  :host-context(.emr-print) .clinical-form-matrix-table-wrap {
    overflow: visible !important;
  }
  :host-context(.emr-print) .clinical-form-correction,
  :host-context(.emr-print) [data-emr-print='hide'] {
    display: none !important;
  }
  @media print {
    .clinical-form-matrix-table-wrap {
      overflow: visible !important;
    }
    .clinical-form-correction,
    [data-emr-print='hide'] {
      display: none !important;
    }
  }
  .emr-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .emr-matrix {
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: 10px;
    overflow: auto;
    background: var(--emr-surface, #fffefa);
    container-type: inline-size;
    min-width: 0;
    font-variant-numeric: tabular-nums;
  }
  .emr-matrix__header {
    padding: 14px 16px;
    border-bottom: 1px solid var(--emr-border, #c7d3da);
  }
  .emr-matrix__title {
    margin: 0;
    font-size: var(--emr-text-lg, 1rem);
    font-weight: var(--emr-weight-bold, 700);
    color: var(--emr-text, #263847);
  }
  .emr-matrix__description {
    margin: 4px 0 0;
    font-size: var(--emr-text-sm, 0.8125rem);
    color: var(--emr-text-muted, #5c6c78);
  }
  .emr-matrix .table-wrap {
    border: 0;
    border-radius: 0;
    min-width: 0;
  }
  .emr-matrix table {
    width: 100%;
    min-width: 680px;
    border-collapse: separate;
    border-spacing: 0;
  }
  .emr-matrix th,
  .emr-matrix td {
    border-right: 1px solid var(--emr-border, #c7d3da);
    border-bottom: 1px solid var(--emr-border, #c7d3da);
    padding: 8px;
    vertical-align: top;
  }
  .emr-matrix tr:last-child th,
  .emr-matrix tr:last-child td {
    border-bottom: 0;
  }
  .emr-matrix th:last-child,
  .emr-matrix td:last-child {
    border-right: 0;
  }
  .emr-matrix thead th {
    background: var(--emr-surface-raised, #eff3f5);
    color: var(--emr-text-muted, #5c6c78);
    text-align: center;
    font-size: var(--emr-text-xs, 0.75rem);
  }
  .emr-matrix__row-label {
    position: sticky;
    left: 0;
    z-index: 2;
    min-width: 180px;
    background: var(--emr-surface, #fffefa);
    text-align: left;
    color: var(--emr-text, #263847);
  }
  .emr-matrix__cell {
    position: relative;
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .emr-matrix__cell--modified::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 8px;
    height: 8px;
    background: linear-gradient(225deg, var(--emr-primary, #475f70) 50%, transparent 50%);
    pointer-events: none;
  }
  .emr-matrix__na {
    min-height: 44px;
    display: grid;
    place-items: center;
    color: var(--emr-text-muted, #5c6c78);
    background: var(--emr-surface-raised, #eff3f5);
    border-radius: 6px;
    padding: 6px 10px;
  }
  .emr-matrix__meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .emr-matrix__meta {
    font-size: var(--emr-text-xs, 0.75rem);
    color: var(--emr-text-muted, #5c6c78);
    font-variant-numeric: tabular-nums;
  }
  .emr-matrix__quantity {
    display: flex;
    gap: 6px;
    align-items: center;
    min-width: 0;
  }
  .emr-matrix__unit-select {
    min-width: 84px;
  }
  .emr-matrix__clear {
    min-height: var(--emr-control-height, 44px);
    min-width: 44px;
    justify-self: start;
  }
  .emr-matrix__presets {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .emr-matrix__preset {
    min-height: var(--emr-control-height, 44px);
    min-width: 44px;
    padding: 6px 10px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: 6px;
    background: var(--emr-surface-raised, #eff3f5);
    color: var(--emr-text, #263847);
    font: inherit;
    font-size: var(--emr-text-xs, 0.75rem);
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }
  .emr-matrix__preset:hover {
    border-color: var(--emr-primary, #475f70);
  }
  .emr-matrix__message {
    display: block;
    margin-top: 2px;
    font-size: var(--emr-text-xs, 0.75rem);
    color: var(--emr-text-muted, #5c6c78);
  }
  .emr-matrix__warning {
    color: var(--emr-warning, #8a651f);
  }
  .emr-matrix__error {
    color: var(--emr-danger, #a44949);
  }
  .emr-matrix .emr-control,
  .emr-matrix .emr-select {
    min-height: var(--emr-control-height, 44px);
    width: 100%;
    min-width: 0;
    font-variant-numeric: tabular-nums;
  }
  .emr-matrix .emr-control[data-warning="true"] {
    border-color: var(--emr-warning, #b45309);
  }
  .emr-matrix select.emr-select {
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid var(--emr-border, #cbd5e1);
    border-radius: 8px;
    padding: 9px 34px 9px 12px;
    background-color: var(--emr-surface, #ffffff);
    color: var(--emr-text, #0f172a);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%2364748b' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 16px 16px;
  }
  .emr-matrix .emr-control[readonly],
  .emr-matrix .emr-control[aria-readonly="true"],
  .emr-matrix .emr-select[aria-readonly="true"] {
    background: var(--emr-surface-soft, #f1f4f5);
    border-style: dashed;
  }
  .emr-matrix textarea.emr-control {
    height: auto;
    min-height: 68px;
    padding-block: 8px;
    resize: vertical;
  }
  .emr-matrix-cards {
    display: none;
  }
  @container (max-width: 720px) {
    .emr-matrix {
      overflow: visible;
    }
    .emr-matrix .table-wrap,
    .emr-matrix table {
      display: none;
    }
    .emr-matrix-cards {
      display: grid;
      gap: 10px;
      padding: 10px;
      min-width: 0;
    }
    .emr-matrix-card {
      border: 1px solid var(--emr-border, #c7d3da);
      border-radius: 8px;
      overflow: hidden;
      min-width: 0;
    }
    .emr-matrix-card__title {
      padding: 10px 12px;
      background: var(--emr-surface-raised, #eff3f5);
      font-weight: var(--emr-weight-bold, 700);
      color: var(--emr-text, #263847);
      overflow-wrap: anywhere;
    }
    .emr-matrix-card__cell {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 6px;
      align-items: start;
      padding: 10px;
      border-top: 1px solid var(--emr-border, #c7d3da);
      min-width: 0;
    }
    .emr-matrix-card__label {
      color: var(--emr-text-muted, #5c6c78);
      font-size: var(--emr-text-sm, 0.8125rem);
      font-weight: 650;
      overflow-wrap: anywhere;
    }
  }
  @media (max-width: 720px) {
    .emr-matrix {
      overflow: visible;
    }
    .emr-matrix .table-wrap,
    .emr-matrix table {
      display: none;
    }
    .emr-matrix-cards {
      display: grid;
      gap: 10px;
      padding: 10px;
      min-width: 0;
    }
    .emr-matrix-card {
      border: 1px solid var(--emr-border, #c7d3da);
      border-radius: 8px;
      overflow: hidden;
      min-width: 0;
    }
    .emr-matrix-card__title {
      padding: 10px 12px;
      background: var(--emr-surface-raised, #eff3f5);
      font-weight: var(--emr-weight-bold, 700);
      color: var(--emr-text, #263847);
      overflow-wrap: anywhere;
    }
    .emr-matrix-card__cell {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 6px;
      align-items: start;
      padding: 10px;
      border-top: 1px solid var(--emr-border, #c7d3da);
      min-width: 0;
    }
    .emr-matrix-card__label {
      color: var(--emr-text-muted, #5c6c78);
      font-size: var(--emr-text-sm, 0.8125rem);
      font-weight: 650;
      overflow-wrap: anywhere;
    }
  }
  :host-context(.emr-print) .emr-matrix {
    overflow: visible !important;
    max-height: none !important;
    height: auto !important;
  }
  :host-context(.emr-print) .emr-matrix .table-wrap,
  :host-context(.emr-print) .emr-matrix table {
    display: revert !important;
    min-width: 0 !important;
  }
  :host-context(.emr-print) .emr-matrix-cards {
    display: none !important;
  }
  :host-context(.emr-print) .emr-matrix__row-label {
    position: static !important;
  }
  :host-context(.emr-print) .emr-matrix__na {
    min-height: 0 !important;
  }
  @media print {
    .emr-matrix {
      overflow: visible !important;
      max-height: none !important;
      height: auto !important;
    }
    .emr-matrix .table-wrap,
    .emr-matrix table {
      display: revert !important;
      min-width: 0 !important;
    }
    .emr-matrix-cards {
      display: none !important;
    }
    .emr-matrix__row-label {
      position: static !important;
    }
    .emr-matrix__na {
      min-height: 0 !important;
    }
  }

  /* Annotation Toolbar */
  .tbw {
    position: relative;
  }
  .tb {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 6px;
    padding: 0 2px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
  }
  .tb__g {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
  .tb__b {
    position: relative;
    width: 44px;
    min-width: 44px;
    min-height: 44px;
    height: max(44px, var(--emr-control-height, 44px));
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .tb__f {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 34px;
    height: 34px;
    padding: 0 4px;
    border: 1px solid transparent;
    border-radius: var(--emr-radius, 8px);
    font-size: var(--emr-text-xs, 0.75rem);
    font-weight: var(--emr-weight-bold, 700);
    font-family: var(--emr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
    font-variant-numeric: tabular-nums;
  }
  .tb__f--text {
    padding: 0;
  }
  .tb__f--swatch {
    border-radius: 50%;
  }
  .tb__f--pen {
    flex-direction: column;
    gap: 3px;
  }
  .tb__init {
    font-family: var(--emr-font-family, 'Inter Variable', Inter, system-ui, sans-serif);
    font-size: var(--emr-text-md, 0.875rem);
    font-weight: var(--emr-weight-bold, 700);
  }
  .tb__b:hover:not([aria-disabled="true"]) .tb__f {
    background: var(--emr-surface-soft, #f1f4f5);
    border-color: var(--emr-border, #c7d3da);
  }
  .tb__b:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus, #5f7f92) 70%, transparent);
    outline-offset: -3px;
    border-radius: var(--emr-radius, 8px);
  }
  .tb__b[aria-disabled="true"] {
    cursor: not-allowed;
    opacity: 0.52;
  }
  .tb__b[aria-pressed="true"] .tb__f,
  .tb__b[aria-expanded="true"] .tb__f {
    background: var(--emr-primary-soft, #e3ebef);
    border-color: var(--emr-primary, #475f70);
    color: var(--emr-primary-contrast, #344b5a);
  }
  .tb__b[aria-pressed="true"]::after,
  .tb__b[aria-expanded="true"]::after {
    content: '';
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 1px;
    height: 3px;
    border-radius: 2px;
    background: var(--emr-primary, #475f70);
  }
  .tb__dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid var(--emr-text-muted, #5c6c78);
    box-sizing: border-box;
  }
  .tb__sw {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid var(--emr-text-muted, #5c6c78);
  }
  .tb__b[aria-pressed="true"] .tb__f--swatch {
    background: transparent;
    border-color: var(--emr-primary, #475f70);
  }
  .tb__tick {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--emr-surface, #fffefa);
    color: var(--emr-text, #263847);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .tb__bar {
    display: block;
    width: 16px;
    max-height: 8px;
    min-height: 1px;
    border-radius: 2px;
    background: currentColor;
  }
  .tb__bar--wide {
    width: 18px;
    max-height: 10px;
  }
  .tb__panel {
    position: absolute;
    z-index: 10;
    top: calc(100% + 4px);
    left: 0;
    width: max-content;
    max-width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 0 8px;
    padding: 2px 4px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    box-shadow: var(--emr-shadow, 0 8px 24px rgb(15 23 42 / 0.09));
  }
  :host-context(.emr-print) .tbw {
    display: none !important;
  }
  @media print {
    .tbw {
      display: none !important;
    }
  }

  /* Annotation List */
  .al {
    list-style: none;
    margin: 0;
    padding: 0;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    overflow: hidden;
  }
  .al__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    border-bottom: 1px solid var(--emr-border, #c7d3da);
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .al__row:last-child {
    border-bottom: 0;
  }
  .al__row--on {
    background: var(--emr-primary-soft, #e3ebef);
    box-shadow: inset 4px 0 0 var(--emr-primary, #475f70);
  }
  .al__main {
    flex: 1 1 150px;
    min-width: 0;
    min-height: max(44px, var(--emr-control-height, 44px));
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 8px 2px 12px;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .al__no {
    flex: none;
    min-width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: 6px;
    background: var(--emr-surface, #fffefa);
    font-family: var(--emr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
    font-size: var(--emr-text-xs, 0.75rem);
    font-weight: var(--emr-weight-bold, 700);
    font-variant-numeric: tabular-nums;
  }
  .al__sw {
    flex: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid var(--emr-text-muted, #5c6c78);
  }
  .al__txt {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  .al__name {
    font-size: var(--emr-text-md, 0.875rem);
    font-weight: var(--emr-weight-medium, 550);
    line-height: var(--emr-leading-tight, 1.25);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .al__cls {
    font-weight: var(--emr-weight-regular, 400);
  }
  .al__desc {
    font-size: var(--emr-text-xs, 0.75rem);
    color: var(--emr-text-muted, #5c6c78);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .al__tool {
    flex: none;
    display: inline-flex;
    color: var(--emr-text-muted, #5c6c78);
  }
  .al__row--on .al__name {
    font-weight: var(--emr-weight-bold, 700);
  }
  .al__row--off .al__name {
    font-style: italic;
  }
  .al__row--off .al__sw {
    border-style: dashed;
  }
  .al__acts {
    display: flex;
    margin-left: auto;
    padding-right: 4px;
  }
  .al__b {
    width: 44px;
    min-width: 44px;
    min-height: 44px;
    height: max(44px, var(--emr-control-height, 44px));
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .al__f {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: 1px solid transparent;
    border-radius: var(--emr-radius, 8px);
  }
  .al__b:hover:not([aria-disabled="true"]) .al__f {
    background: var(--emr-surface-soft, #f1f4f5);
    border-color: var(--emr-border, #c7d3da);
  }
  .al__b--danger {
    color: var(--emr-danger, #a44949);
  }
  .al__b--danger:hover:not([aria-disabled="true"]) .al__f {
    background: var(--emr-danger-soft, #fcecec);
    border-color: var(--emr-danger, #a44949);
  }
  .al__b[aria-pressed="true"]:not(.al__b--eye) .al__f {
    background: var(--emr-primary-soft, #e3ebef);
    border-color: var(--emr-primary-border, #b2c4ce);
  }
  .al__b[aria-disabled="true"] {
    cursor: not-allowed;
    opacity: 0.52;
  }
  .al__main:focus-visible,
  .al__b:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus, #5f7f92) 70%, transparent);
    outline-offset: -3px;
    border-radius: var(--emr-radius, 8px);
  }
  .al__empty {
    margin: 0;
    padding: 16px;
    border: 1px dashed var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    color: var(--emr-text-muted, #5c6c78);
    font-size: var(--emr-text-md, 0.875rem);
  }
  :host-context(.emr-print) .al__acts {
    display: none !important;
  }
  :host-context(.emr-print) .al__name,
  :host-context(.emr-print) .al__desc {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }
  :host-context(.emr-print) .al__row--on {
    box-shadow: none;
    background: transparent;
  }
  @media print {
    .al__acts {
      display: none !important;
    }
    .al__name,
    .al__desc {
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
    }
    .al__row--on {
      box-shadow: none;
      background: transparent;
    }
  }
`;

function fieldIsShown(state?: ClinicalFieldState): boolean {
  return !state?.hidden || !isEmptyValue(state.value);
}

interface FieldActions {
  canEdit(): boolean;
  edit(value: ClinicalFieldValue): void;
  status(status: ClinicalAssessmentStatus | undefined): void;
  focus(): void;
}

function fieldCanEdit(readOnly: boolean, state?: Pick<ClinicalFieldState, 'readOnly' | 'disabled'>): boolean {
  return !readOnly && !state?.readOnly && !state?.disabled;
}

function renderField(
  definition: ClinicalFieldDefinition,
  state: ClinicalFieldState | undefined,
  controlId: string,
  readOnly: boolean,
  actions: FieldActions,
  labelHidden = false,
) {
  return html`<emr-typed-field
    .definition=${definition}
    .model=${state}
    .controlId=${controlId}
    .labelHidden=${labelHidden}
    .readOnly=${readOnly}
    @valueChange=${(event: CustomEvent<ClinicalFieldValue>) => {
      event.stopPropagation();
      if (actions.canEdit()) actions.edit(event.detail);
    }}
    @statusChange=${(event: CustomEvent<ClinicalAssessmentStatus | undefined>) => {
      event.stopPropagation();
      if (actions.canEdit()) actions.status(event.detail);
    }}
    @focused=${(event: Event) => {
      event.stopPropagation();
      actions.focus();
    }}
  ></emr-typed-field>`;
}

export class EmrSectionCardElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ type: String }) sectionId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) description = '';
  @property({ attribute: false }) status?: EmrBadge;
  @property({ type: Boolean }) collapsible = false;
  @property({ type: Boolean }) collapsed = false;
  @property({ type: String }) headingId = '';
  @property({ type: Number }) headingLevel: EmrSectionCardHeadingLevel = 2;
  @property({ type: String }) variant: EmrSectionCardVariant = 'outlined';
  @property({ type: String }) tone: EmrTone = 'neutral';
  @property({ type: String }) padding: EmrSectionCardPadding = 'md';
  @property({ type: String }) icon = '';
  @property({ type: Boolean }) readOnly = false;

  @state() private hasActionsSlot = false;
  @state() private hasFooterSlot = false;
  private isFocusedWithin = false;

  private hasAssignedContent(slot: HTMLSlotElement): boolean {
    return slot
      .assignedNodes({ flatten: true })
      .some((node) => node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim())));
  }

  private renderHeading(level: EmrSectionCardHeadingLevel, id: string, text: string) {
    switch (level) {
      case 3:
        return html`<h3 id=${id} class="emr-title">${text}</h3>`;
      case 4:
        return html`<h4 id=${id} class="emr-title">${text}</h4>`;
      case 5:
        return html`<h5 id=${id} class="emr-title">${text}</h5>`;
      case 6:
        return html`<h6 id=${id} class="emr-title">${text}</h6>`;
      default:
        return html`<h2 id=${id} class="emr-title">${text}</h2>`;
    }
  }

  override render() {
    const resolvedLabel = this.label || this.getAttribute('title') || '';
    const variant = normalizeSectionCardVariant(this.variant);
    const tone = normalizeSectionCardTone(this.tone);
    const padding = normalizeSectionCardPadding(this.padding);
    const headingLevel = normalizeSectionCardHeadingLevel(this.headingLevel);
    const resolvedHeadingId = resolveSectionCardHeadingId(this.sectionId, this.headingId);
    const contentId = resolveSectionCardContentId(this.sectionId);
    const toggleAriaLabel = resolveSectionCardToggleLabel(this.collapsed, resolvedLabel);

    const cardClasses = [
      'emr-card',
      'section-card',
      `section-card--${variant}`,
      `section-card--pad-${padding}`,
      this.readOnly ? 'section-card--readonly' : '',
      this.collapsed ? 'section-card--collapsed' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`<section
      class=${cardClasses}
      part="section"
      data-tone=${tone !== 'neutral' ? tone : nothing}
      aria-labelledby=${resolvedHeadingId}
      @focusin=${() => {
        if (!this.isFocusedWithin) {
          this.isFocusedWithin = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
      }}
      @focusout=${(event: FocusEvent) => {
        const next = event.relatedTarget as Node | null;
        if (next && (this.contains(next) || this.shadowRoot?.contains(next))) return;
        if (this.isFocusedWithin) {
          this.isFocusedWithin = false;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }
      }}
    >
      <header class="section-header">
        ${this.icon
          ? html`<span class="section-header-icon" aria-hidden="true">${renderEmrSvgIcon(this.icon as EmrLitIconName, 18)}</span>`
          : nothing}
        <div class="section-heading">
          ${this.renderHeading(headingLevel, resolvedHeadingId, resolvedLabel)}
          ${this.description ? html`<p class="emr-muted section-desc">${this.description}</p>` : nothing}
        </div>
        ${this.status ? html`<emr-badge .badge=${this.status}></emr-badge>` : nothing}
        <div class="section-actions" ?hidden=${!this.hasActionsSlot}>
          <slot name="actions" @slotchange=${(e: Event) => { this.hasActionsSlot = this.hasAssignedContent(e.target as HTMLSlotElement); }}></slot>
        </div>
        ${this.collapsible
          ? html`<button
              type="button"
              class="emr-btn emr-btn--ghost emr-btn--small section-toggle"
              aria-expanded=${!this.collapsed}
              aria-controls=${contentId}
              aria-label=${toggleAriaLabel}
              @click=${() => this.emitIntent<SectionCardIntent>({ type: 'toggleRequested', sectionId: this.sectionId })}
            >
              <span>${this.collapsed ? 'Show' : 'Hide'}</span>
              <span class=${`section-chevron${!this.collapsed ? ' section-chevron--expanded' : ''}`} aria-hidden="true">
                ${renderEmrSvgIcon('chevron-down', 16)}
              </span>
            </button>`
          : nothing}
      </header>
      <div class="section-content" id=${contentId} ?data-collapsed=${this.collapsed} ?hidden=${this.collapsed}><slot></slot></div>
      <footer class="section-footer" ?data-collapsed=${this.collapsed} ?hidden=${this.collapsed || !this.hasFooterSlot}>
        <slot name="footer" @slotchange=${(e: Event) => { this.hasFooterSlot = this.hasAssignedContent(e.target as HTMLSlotElement); }}></slot>
      </footer>
    </section>`;
  }
}

export interface EmrRepeatableFieldRenderContext {
  definition: ClinicalFieldDefinition;
  model?: ClinicalFieldState;
  controlId: string;
  readOnly: boolean;
  emit: (value: ClinicalFieldValue) => void;
}

export type EmrRepeatableCustomRenderers = Readonly<
  Record<string, (context: EmrRepeatableFieldRenderContext) => TemplateResult>
>;

export class EmrRepeatableGroupElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ attribute: false }) definition?: RepeatableGroupDefinition;
  @property({ attribute: false }) model: readonly RepeatableItemState[] = [];
  @property({ type: String }) headingId = '';
  @property({ type: String }) idPrefix = '';
  @property({ type: Boolean }) readOnly = false;
  @property({ type: String }) emptyMessage = '';
  @property({ type: String }) error = '';
  @property({ type: String }) warning = '';
  @property({ attribute: false }) customRenderers: EmrRepeatableCustomRenderers = {};

  private isFocusedWithin = false;

  override render() {
    const group = this.definition;
    const resolvedHeadingId = group
      ? resolveRepeatableHeadingId(group.id, this.idPrefix, this.headingId)
      : resolveRepeatableHeadingId('repeatable-group', this.idPrefix, this.headingId);
    const resolvedEmptyMessage = this.emptyMessage || group?.emptyMessage || 'No entries recorded.';
    const addAllowed = group ? canAddRepeatableItem(group, this.model, this.readOnly) : false;
    const maxHint =
      group && !this.readOnly && group.maxItems !== undefined && this.model.length >= group.maxItems
        ? `Maximum ${group.maxItems} entries`
        : '';

    const groupClasses = [
      'repeatable-group',
      this.readOnly ? 'repeatable-group--readonly' : '',
      this.error ? 'repeatable-group--error' : '',
      !this.error && this.warning ? 'repeatable-group--warning' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`<section
      class=${groupClasses}
      role="region"
      aria-labelledby=${resolvedHeadingId}
      @focusin=${() => {
        if (!this.isFocusedWithin) {
          this.isFocusedWithin = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
      }}
      @focusout=${(event: FocusEvent) => {
        const next = event.relatedTarget as Node | null;
        if (next && (this.contains(next) || this.shadowRoot?.contains(next))) return;
        if (this.isFocusedWithin) {
          this.isFocusedWithin = false;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }
      }}
    >
      <div class="repeatable-heading">
        <div class="repeatable-heading-text">
          <h3 id=${resolvedHeadingId} class="emr-title">${group?.label ?? ''}</h3>
          ${group?.description ? html`<p class="repeatable-desc">${group.description}</p>` : nothing}
        </div>
        ${addAllowed && group
          ? html`<button
              type="button"
              class="emr-btn emr-btn--outline emr-btn--small repeatable-btn"
              data-emr-print="hide"
              @click=${() => {
                if (canAddRepeatableItem(group, this.model, this.readOnly)) {
                  this.emitIntent<ClinicalFormIntent>({ type: 'repeatItemAddRequested', groupId: group.id });
                }
              }}
            >
              ${renderEmrSvgIcon('plus', 14)}
              <span>${group.addLabel ?? 'Add'}</span>
            </button>`
          : maxHint
            ? html`<span class="repeatable-limit" role="status">${maxHint}</span>`
            : nothing}
      </div>
      ${this.error ? html`<p class="emr-error repeatable-message" role="alert">${this.error}</p>` : nothing}
      ${this.warning ? html`<p class="emr-warning repeatable-message" role="status">${this.warning}</p>` : nothing}
      ${group
        ? repeat(this.model, (item) => item.id, (item, index) => {
            const itemLabel = item.label ?? `Entry ${index + 1}`;
            const locked = this.readOnly || !!item.readOnly;
            const removeAllowed = canRemoveRepeatableItem(group, this.model, item, this.readOnly);
            const itemClasses = [
              'repeatable-item',
              locked ? 'repeatable-item--readonly' : '',
              item.error ? 'repeatable-item--error' : '',
              !item.error && item.warning ? 'repeatable-item--warning' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return html`<article class=${itemClasses}>
              <header class="repeatable-item-header">
                <div class="repeatable-item-title">
                  <strong>${itemLabel}</strong>
                  ${item.readOnly && !this.readOnly
                    ? html`<emr-badge .badge=${{ label: 'Read-only', tone: 'neutral', size: 'sm', icon: 'lock' }}></emr-badge>`
                    : nothing}
                  ${item.badges?.map((b) => html`<emr-badge .badge=${b}></emr-badge>`)}
                </div>
                ${removeAllowed
                  ? html`<button
                      type="button"
                      class="emr-btn emr-btn--ghost emr-btn--small repeatable-btn"
                      data-emr-print="hide"
                      aria-label=${`Remove ${itemLabel}`}
                      @click=${() => {
                        const current = this.model.find((entry) => entry.id === item.id);
                        if (current && canRemoveRepeatableItem(group, this.model, current, this.readOnly)) {
                          this.emitIntent<ClinicalFormIntent>({
                            type: 'repeatItemRemoveRequested',
                            groupId: group.id,
                            itemId: item.id,
                          });
                        }
                      }}
                    >
                      ${renderEmrSvgIcon('trash', 14)}
                      <span>Remove</span>
                    </button>`
                  : nothing}
              </header>
              ${item.error ? html`<p class="emr-error repeatable-message" role="alert">${item.error}</p>` : nothing}
              ${item.warning ? html`<p class="emr-warning repeatable-message" role="status">${item.warning}</p>` : nothing}
              <div class="repeatable-grid">
                ${repeat(group.fields.filter((field) => fieldIsShown(item.fields[field.id])), (field) => field.id, (field) => {
                  const path = { groupId: group.id, itemId: item.id, fieldId: field.id };
                  const cid = resolveRepeatableControlId(group.id, item.id, field.id, this.idPrefix);
                  const customRenderer =
                    field.type === 'custom' && field.customRendererKey
                      ? this.customRenderers[field.customRendererKey]
                      : undefined;
                  const content = customRenderer
                    ? customRenderer({
                        definition: field,
                        model: item.fields[field.id],
                        controlId: cid,
                        readOnly: locked,
                        emit: (value) => {
                          const current = this.model.find((entry) => entry.id === item.id);
                          if (current && fieldCanEdit(this.readOnly || !!current.readOnly, current.fields[field.id])) {
                            this.emitIntent<ClinicalFormIntent>({ type: 'repeatItemEditRequested', ...path, value });
                          }
                        },
                      })
                    : renderField(field, item.fields[field.id], cid, locked, {
                        canEdit: () => {
                          const current = this.model.find((entry) => entry.id === item.id);
                          return !!current && fieldCanEdit(this.readOnly || !!current.readOnly, current.fields[field.id]);
                        },
                        edit: (value) => this.emitIntent<ClinicalFormIntent>({ type: 'repeatItemEditRequested', ...path, value }),
                        status: (status) => this.emitIntent<ClinicalFormIntent>({ type: 'repeatItemStatusEditRequested', ...path, status }),
                        focus: () => this.emitIntent<ClinicalFormIntent>({ type: 'fieldFocused', fieldId: `${group.id}.${item.id}.${field.id}` }),
                      });
                  return html`<div class="repeatable-field" style=${`grid-column: span ${field.span ?? 6}`}>${content}</div>`;
                })}
              </div>
            </article>`;
          })
        : nothing}
      ${group && !this.model.length ? html`<p class="repeatable-empty">${resolvedEmptyMessage}</p>` : nothing}
      <slot></slot>
    </section>`;
  }
}

export class EmrClinicalFormElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ attribute: false }) model?: ClinicalFormViewModel;
  @property({ type: String }) headingId = '';
  @property({ type: String }) idPrefix = '';
  @property({ attribute: false }) customRenderers: EmrRepeatableCustomRenderers = {};

  private isFocusedWithin = false;

  private domId(value: string): string {
    return resolveClinicalFormDomId(value, this.idPrefix);
  }

  private controlId(model: ClinicalFormViewModel, fieldId: string): string {
    return resolveClinicalFormControlId(model.schema.id, fieldId, this.idPrefix);
  }

  private field(model: ClinicalFormViewModel, definition: ClinicalFieldDefinition, labelHidden = false) {
    const fieldId = definition.id;
    const cid = this.controlId(model, fieldId);
    const customRenderer =
      definition.type === 'custom' && definition.customRendererKey
        ? this.customRenderers[definition.customRendererKey]
        : undefined;
    if (customRenderer) {
      return customRenderer({
        definition,
        model: model.fields[fieldId],
        controlId: cid,
        readOnly: !!model.readOnly,
        emit: (value) => {
          if (this.model && fieldCanEdit(!!this.model.readOnly, this.model.fields[fieldId])) {
            this.emitIntent<ClinicalFormIntent>({ type: 'fieldEditRequested', fieldId, value });
          }
        },
      });
    }
    return renderField(
      definition,
      model.fields[fieldId],
      cid,
      !!model.readOnly,
      {
        canEdit: () => !!this.model && fieldCanEdit(!!this.model.readOnly, this.model.fields[fieldId]),
        edit: (value) => this.emitIntent<ClinicalFormIntent>({ type: 'fieldEditRequested', fieldId, value }),
        status: (status) => this.emitIntent<ClinicalFormIntent>({ type: 'fieldStatusEditRequested', fieldId, status }),
        focus: () => this.emitIntent<ClinicalFormIntent>({ type: 'fieldFocused', fieldId }),
      },
      labelHidden,
    );
  }

  private matrix(model: ClinicalFormViewModel, block: ClinicalMatrixBlockDefinition) {
    const rows = block.rows.filter((row) => Object.values(row.cells).some((field) => fieldIsShown(model.fields[field.id])));
    if (!rows.length) return nothing;
    return html`<div class="clinical-form-full clinical-form-matrix">
      <h3 class="emr-title">${block.label}</h3>
      ${block.description ? html`<p class="clinical-form-description">${block.description}</p>` : nothing}
      <div class="clinical-form-matrix-table-wrap">
        <table class="clinical-form-matrix-table" aria-label=${block.label}>
          <thead>
            <tr>
              <th scope="col">Clinical field</th>
              ${block.columns.map((col) => html`<th scope="col">${col.label}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${repeat(rows, (row) => row.id, (row) => {
              const required = Object.values(row.cells).some((cell) => model.fields[cell.id]?.required ?? cell.required ?? false);
              return html`<tr>
                <th scope="row">${row.label}${required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</th>
                ${block.columns.map((col) => {
                  const field = row.cells[col.id];
                  const shown = Boolean(field && fieldIsShown(model.fields[field.id]));
                  return html`<td>${shown && field
                    ? html`<span class="clinical-form-matrix-cell-label" aria-hidden="true">${col.label}</span>${this.field(model, field, true)}`
                    : nothing}</td>`;
                })}
              </tr>`;
            })}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const resolvedHeadingId = this.headingId.trim();
    const sections = m.schema.sections.filter((section) => isSectionShown(section, m.fields));
    const repeatablePrefix = this.domId(m.schema.id);
    return html`<form
      class="clinical-form"
      novalidate
      aria-labelledby=${resolvedHeadingId || nothing}
      aria-label=${resolvedHeadingId ? nothing : m.schema.label}
      @submit=${(e: Event) => e.preventDefault()}
      @focusin=${() => {
        if (!this.isFocusedWithin) {
          this.isFocusedWithin = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
      }}
      @focusout=${(event: FocusEvent) => {
        const next = event.relatedTarget as Node | null;
        if (next && (this.contains(next) || this.shadowRoot?.contains(next))) return;
        if (this.isFocusedWithin) {
          this.isFocusedWithin = false;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }
      }}
    >
      ${m.schema.description ? html`<p class="clinical-form-description">${m.schema.description}</p>` : nothing}
      ${m.correction ? html`<div class="clinical-form-correction" data-emr-print="hide">
        ${m.correction.description ? html`<p class="clinical-form-description">${m.correction.description}</p>` : nothing}
        <button type="button" class="emr-btn emr-btn--outline clinical-form-correction-btn"
          @click=${() => this.emitIntent<ClinicalFormIntent>({ type: 'correctionRequested' })}>${m.correction.label}</button>
      </div>` : nothing}
      ${sections.length === 0 && m.emptyMessage
        ? html`<p class="clinical-form-empty" role="status">${m.emptyMessage}</p>`
        : nothing}
      ${repeat(sections, (section) => section.id, (section) => html`<emr-section-card
        .sectionId=${this.domId(`${m.schema.id}-${section.id}`)}
        .label=${section.label}
        .description=${section.description ?? ''}
        .status=${m.sectionStatuses?.[section.id]}
        .collapsible=${!!section.collapsible}
        .collapsed=${!!m.collapsedSectionIds?.includes(section.id)}
        @intent=${(event: CustomEvent<SectionCardIntent>) => {
          if (event.target !== event.currentTarget) return;
          event.stopPropagation();
          this.emitIntent<ClinicalFormIntent>({ type: 'sectionToggleRequested', sectionId: section.id });
        }}
      >
        <div class="clinical-form-grid">
          ${repeat(section.blocks, (block) => block.id, (block) => {
            if (block.kind === 'matrix') return this.matrix(m, block);
            if (block.kind === 'repeatable') return html`<div class="clinical-form-full"><emr-repeatable-group
              .definition=${block}
              .model=${m.repeatableGroups[block.id] ?? []}
              .readOnly=${!!m.readOnly}
              .idPrefix=${repeatablePrefix}
              .customRenderers=${this.customRenderers}
              @intent=${(event: CustomEvent<ClinicalFormIntent>) => {
                event.stopPropagation();
                if (this.model && (!this.model.readOnly || event.detail.type === 'fieldFocused')) {
                  this.emitIntent(event.detail);
                }
              }}
            ></emr-repeatable-group></div>`;
            return fieldIsShown(m.fields[block.id])
              ? html`<div class="clinical-form-field" style=${`grid-column: span ${block.span ?? 6}`}>${this.field(m, block)}</div>`
              : nothing;
          })}
        </div>
      </emr-section-card>`)}
    </form>`;
  }
}

const clinicalListStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    min-width: 0;
  }
  .emr-panel {
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: 10px;
    background: var(--emr-surface, #fffefa);
    overflow: clip;
    min-width: 0;
  }
  .emr-panel--elevated {
    box-shadow: var(--emr-shadow, 0 10px 28px rgba(15, 23, 42, 0.18));
  }
  .emr-panel--filled {
    background: var(--emr-surface-raised, #ffffff);
  }
  .emr-panel--subtle {
    background: var(--emr-surface-soft, #f1f4f5);
  }
  .emr-panel--readonly {
    border-style: dashed;
  }
  .emr-panel__header {
    padding: 13px 14px;
    border-bottom: 1px solid var(--emr-border, #c7d3da);
    background: var(--emr-surface-accent, #e8eef2);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .emr-panel__title {
    flex: 1;
    margin: 0;
    font-size: var(--emr-text-lg, 1rem);
    font-weight: var(--emr-weight-bold, 700);
    color: var(--emr-text, #263847);
    line-height: 1.35;
  }
  .emr-panel__body {
    padding: 12px;
  }
  .list-header-icon {
    width: 20px;
    height: 20px;
    display: inline-grid;
    place-items: center;
    color: var(--emr-text-muted, #5c6c78);
    flex: 0 0 auto;
  }
  .list-heading {
    flex: 1 1 180px;
    min-width: 0;
  }
  .list-description {
    margin: 2px 0 0;
    color: var(--emr-text-muted, #5c6c78);
    font-size: var(--emr-text-sm, 0.8125rem);
    line-height: 1.4;
  }
  .list-add {
    flex-shrink: 0;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  .list-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: 8px;
    background: var(--emr-surface, #fffefa);
    padding: 8px 10px;
    min-width: 0;
    transition: border-color 140ms ease;
  }
  .list-item[data-tone="info"] {
    border-color: color-mix(in srgb, var(--emr-info, #486f86) 45%, var(--emr-border, #c7d3da));
    background: color-mix(in srgb, var(--emr-info-soft, #e8f0f4) 35%, var(--emr-surface, #fffefa));
  }
  .list-item[data-tone="success"] {
    border-color: color-mix(in srgb, var(--emr-success, #2b7650) 45%, var(--emr-border, #c7d3da));
    background: color-mix(in srgb, var(--emr-success-soft, #e8f5ec) 35%, var(--emr-surface, #fffefa));
  }
  .list-item[data-tone="warning"] {
    border-color: color-mix(in srgb, var(--emr-warning, #8a651f) 45%, var(--emr-border, #c7d3da));
    background: color-mix(in srgb, var(--emr-warning-soft, #fbf4de) 35%, var(--emr-surface, #fffefa));
  }
  .list-item[data-tone="danger"] {
    border-color: color-mix(in srgb, var(--emr-danger, #a44949) 45%, var(--emr-border, #c7d3da));
    background: color-mix(in srgb, var(--emr-danger-soft, #fcecec) 35%, var(--emr-surface, #fffefa));
  }
  .list-item--selected {
    border-color: var(--emr-primary, #475f70);
    background: var(--emr-primary-soft, #e3ebef);
  }
  .list-item--readonly {
    border-style: dashed;
  }
  .list-select {
    width: 100%;
    min-height: var(--emr-control-height, 44px);
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 3px;
    border: 0;
    border-radius: 6px;
    padding: 6px 8px;
    background: transparent;
    color: inherit;
    text-align: left;
    font: inherit;
    cursor: pointer;
    transition: background-color 120ms ease;
  }
  .list-select:hover {
    background: var(--emr-surface-raised, #ffffff);
  }
  .list-select:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus, #5f7f92) 70%, transparent);
    outline-offset: 2px;
  }
  .list-select--static {
    cursor: default;
  }
  .list-select--static:hover {
    background: transparent;
  }
  .list-title {
    font-size: var(--emr-text-md, 0.875rem);
    font-weight: var(--emr-weight-bold, 700);
    color: var(--emr-text, #263847);
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .list-subtitle,
  .list-detail {
    color: var(--emr-text-muted, #5c6c78);
    font-size: var(--emr-text-sm, 0.8125rem);
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .list-meta {
    color: var(--emr-text-muted, #5c6c78);
    font-size: var(--emr-text-xs, 0.75rem);
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .list-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    flex-shrink: 0;
  }
  @container (max-width: 480px) {
    .list-item {
      grid-template-columns: minmax(0, 1fr);
      align-items: stretch;
    }
    .list-actions {
      justify-content: flex-end;
    }
  }
  @media (max-width: 480px) {
    .list-item {
      grid-template-columns: minmax(0, 1fr);
      align-items: stretch;
    }
    .list-actions {
      justify-content: flex-end;
    }
  }
  :host-context(.emr-print) .emr-panel,
  :host-context(.emr-print) .list-item {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  :host-context(.emr-print) .emr-panel {
    box-shadow: none !important;
    background: #fff !important;
  }
  :host-context(.emr-print) [data-emr-print="hide"] {
    display: none !important;
  }
  @media print {
    .emr-panel,
    .list-item {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .emr-panel {
      box-shadow: none !important;
      background: #fff !important;
    }
    [data-emr-print="hide"] {
      display: none !important;
    }
  }
`;

const VALID_CLINICAL_LIST_TONES = new Set<EmrTone>(['neutral', 'info', 'success', 'warning', 'danger']);

function normalizeClinicalListTone(tone?: unknown): EmrTone {
  return typeof tone === 'string' && VALID_CLINICAL_LIST_TONES.has(tone as EmrTone)
    ? (tone as EmrTone)
    : 'neutral';
}

function resolveClinicalListLabels(labels?: Partial<EmrClinicalListLabels>) {
  return {
    title: labels?.title ?? 'Clinical information',
    add: labels?.add ?? 'Add',
    edit: labels?.edit ?? 'Edit',
    remove: labels?.remove ?? 'Remove',
    retry: labels?.retry ?? 'Retry',
    loading: labels?.loading ?? 'Loading…',
    emptyMessage: labels?.emptyMessage ?? 'Status not supplied.',
    errorTitle: labels?.errorTitle ?? 'Unable to load entries',
  };
}

export class EmrClinicalListElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles, clinicalListStyles];
  protected defaultTitle = 'Clinical information';
  protected defaultHeadingId = 'emr-clinical-list-title';

  @property({ attribute: false }) model?: ClinicalListViewModel;
  @property({ type: String }) headingId = '';
  @property({ type: Number }) headingLevel: EmrClinicalListHeadingLevel = 2;
  @property({ attribute: false }) labels: Partial<EmrClinicalListLabels> = {};

  private isFocusedWithin = false;

  private renderHeading(level: EmrClinicalListHeadingLevel, id: string, text: string) {
    switch (level) {
      case 3:
        return html`<h3 id=${id} class="emr-panel__title">${text}</h3>`;
      case 4:
        return html`<h4 id=${id} class="emr-panel__title">${text}</h4>`;
      case 5:
        return html`<h5 id=${id} class="emr-panel__title">${text}</h5>`;
      case 6:
        return html`<h6 id=${id} class="emr-panel__title">${text}</h6>`;
      default:
        return html`<h2 id=${id} class="emr-panel__title">${text}</h2>`;
    }
  }

  private onAdd(): void {
    if (canAddClinicalListItem(this.model)) {
      this.emitIntent<ClinicalListIntent>({ type: 'addRequested' });
    }
  }

  private onRetry(): void {
    this.emitIntent<ClinicalListIntent>({ type: 'retryRequested' });
  }

  private onSelect(item: ClinicalListItem): void {
    if (isClinicalListItemSelectable(item)) {
      this.emitIntent<ClinicalListIntent>({ type: 'selected', id: item.id });
    }
  }

  private onEdit(item: ClinicalListItem): void {
    if (canEditClinicalListItem(this.model, item)) {
      this.emitIntent<ClinicalListIntent>({ type: 'editRequested', id: item.id });
    }
  }

  private onRemove(item: ClinicalListItem): void {
    if (canRemoveClinicalListItem(this.model, item)) {
      this.emitIntent<ClinicalListIntent>({ type: 'removeRequested', id: item.id });
    }
  }

  override render() {
    const m: ClinicalListViewModel = this.model ?? { items: [] };
    const resolvedLabels = resolveClinicalListLabels(this.labels);
    const variant = normalizeClinicalListVariant(m.variant);
    const headingLevel = normalizeClinicalListHeadingLevel(this.headingLevel);
    const resolvedHeadingId = resolveClinicalListHeadingId(this.headingId, this.defaultHeadingId);
    const resolvedTitle = m.title ?? this.labels?.title ?? this.defaultTitle;
    const resolvedAddLabel = m.addLabel ?? resolvedLabels.add;
    const resolvedLoadingLabel = m.loadingLabel ?? resolvedLabels.loading;
    const resolvedEmptyMessage = m.emptyMessage ?? resolvedLabels.emptyMessage;
    const allowAdd = canAddClinicalListItem(m);

    const panelClasses = [
      'emr-panel',
      variant !== 'outlined' ? `emr-panel--${variant}` : '',
      m.readOnly ? 'emr-panel--readonly' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`<section
      class=${panelClasses}
      aria-labelledby=${resolvedHeadingId}
      aria-busy=${m.loading ? 'true' : nothing}
      @focusin=${() => {
        if (!this.isFocusedWithin) {
          this.isFocusedWithin = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
      }}
      @focusout=${(event: FocusEvent) => {
        const next = event.relatedTarget as Node | null;
        if (next && (this.contains(next) || this.shadowRoot?.contains(next))) return;
        if (this.isFocusedWithin) {
          this.isFocusedWithin = false;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }
      }}
    >
      <header class="emr-panel__header list-header">
        <span class="list-header-icon" aria-hidden="true">${renderEmrSvgIcon('list', 18)}</span>
        <div class="list-heading">
          ${this.renderHeading(headingLevel, resolvedHeadingId, resolvedTitle)}
          ${m.description ? html`<p class="list-description">${m.description}</p>` : nothing}
        </div>
        ${m.status ? html`<emr-badge .badge=${m.status}></emr-badge>` : nothing}
        ${allowAdd
          ? html`<button
              type="button"
              class="emr-btn emr-btn--small emr-btn--outline list-add"
              data-emr-print="hide"
              @click=${() => this.onAdd()}
            >
              ${renderEmrSvgIcon('plus', 14)}
              <span>${resolvedAddLabel}</span>
            </button>`
          : nothing}
      </header>
      <div class="emr-panel__body">
        ${m.error
          ? html`<emr-state-message
              kind="error"
              size="sm"
              .title=${resolvedLabels.errorTitle}
              .message=${m.error}
              .actionLabel=${resolvedLabels.retry}
              @actionTriggered=${(event: Event) => {
                event.stopPropagation();
                this.onRetry();
              }}
            ></emr-state-message>`
          : m.loading
            ? html`<emr-state-message kind="loading" size="sm" .title=${resolvedLoadingLabel}></emr-state-message>`
            : m.items.length === 0
              ? html`<emr-state-message
                  kind="empty"
                  size="sm"
                  .title=${m.emptyTitle || resolvedEmptyMessage}
                  .message=${m.emptyTitle ? resolvedEmptyMessage : ''}
                ></emr-state-message>`
              : html`<ul class="list">
                  ${m.items.map((item) => {
                    const selected = m.selectedId === item.id;
                    const selectable = isClinicalListItemSelectable(item);
                    const canEdit = canEditClinicalListItem(m, item);
                    const canRemove = canRemoveClinicalListItem(m, item);
                    const tone = normalizeClinicalListTone(item.tone);
                    const itemClasses = [
                      'list-item',
                      selected ? 'list-item--selected' : '',
                      m.readOnly || item.readOnly ? 'list-item--readonly' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    const bodyMarkup = html`
                      <span class="list-title">${item.title}</span>
                      ${item.subtitle ? html`<span class="list-subtitle">${item.subtitle}</span>` : nothing}
                      ${item.detail ? html`<span class="list-detail">${item.detail}</span>` : nothing}
                      ${item.meta ? html`<span class="list-meta">${item.meta}</span>` : nothing}
                      ${item.badges?.length
                        ? html`<span class="toolbar-row"
                            >${item.badges.map((badge) => html`<emr-badge .badge=${badge}></emr-badge>`)}</span
                          >`
                        : nothing}
                    `;
                    return html`<li class=${itemClasses} data-tone=${tone !== 'neutral' ? tone : nothing}>
                      ${selectable
                        ? html`<button
                            type="button"
                            class="list-select"
                            aria-current=${selected ? 'true' : nothing}
                            @click=${() => this.onSelect(item)}
                          >
                            ${bodyMarkup}
                          </button>`
                        : html`<div class="list-select list-select--static" aria-current=${selected ? 'true' : nothing}>
                            ${bodyMarkup}
                          </div>`}
                      ${canEdit || canRemove
                        ? html`<div class="list-actions" data-emr-print="hide">
                            ${canEdit
                              ? html`<button
                                  type="button"
                                  class="emr-btn emr-btn--small emr-btn--ghost"
                                  aria-label=${`${resolvedLabels.edit} ${item.title}`}
                                  @click=${() => this.onEdit(item)}
                                >
                                  ${renderEmrSvgIcon('pen', 14)}
                                  <span>${resolvedLabels.edit}</span>
                                </button>`
                              : nothing}
                            ${canRemove
                              ? html`<button
                                  type="button"
                                  class="emr-btn emr-btn--small emr-btn--ghost"
                                  aria-label=${`${resolvedLabels.remove} ${item.title}`}
                                  @click=${() => this.onRemove(item)}
                                >
                                  ${renderEmrSvgIcon('trash', 14)}
                                  <span>${resolvedLabels.remove}</span>
                                </button>`
                              : nothing}
                          </div>`
                        : nothing}
                    </li>`;
                  })}
                </ul>`}
      </div>
    </section>`;
  }
}

function resolveMatrixDomId(idPrefix: string, ...parts: readonly string[]): string {
  const trimmedPrefix = idPrefix.trim();
  const prefix = trimmedPrefix
    ? trimmedPrefix.endsWith('-')
      ? trimmedPrefix.slice(0, -1)
      : trimmedPrefix
    : '';
  return [prefix, ...parts].filter(Boolean).join('-');
}

function parseMatrixPresetValue(
  row: Pick<ClinicalRow, 'type' | 'unit'>,
  preset: string,
  cell?: Pick<ClinicalCellState, 'value'>,
): ClinicalCellState['value'] {
  if (row.type === 'quantity') {
    const parsed = Number(preset);
    return {
      value: Number.isFinite(parsed) && preset.trim() !== '' ? parsed : null,
      unit: resolveMatrixQuantityUnit(row, cell),
    };
  }
  if (row.type === 'integer' || row.type === 'decimal') {
    const parsed = Number(preset);
    return Number.isFinite(parsed) && preset.trim() !== '' ? parsed : null;
  }
  if (row.type === 'boolean') {
    if (preset === 'true') return true;
    if (preset === 'false') return false;
    return null;
  }
  return preset;
}

export class EmrClinicalMatrixElement extends EmrLitElement {
  static override styles = [
    emrShadowStyles,
    l3Styles,
    css`
      :host {
        container-type: inline-size;
        min-width: 0;
      }
    `,
  ];
  @property({ attribute: false }) definition?: ClinicalMatrixSchema;
  @property({ attribute: false }) model: ClinicalMatrixValues = {};
  @property({ attribute: false }) customRenderers: EmrCustomRenderers = {};
  @property({ type: Boolean }) readOnly = false;
  @property({ type: String }) idPrefix = '';
  @property({ type: String }) headingId = '';

  private isFocusedWithin = false;

  private cellHasClearableValue(cell?: ClinicalCellState): boolean {
    if (!cell) return false;
    if (typeof cell.value === 'object' && cell.value !== null && 'unit' in cell.value) {
      return cell.value.value !== null;
    }
    return cell.value !== null && cell.value !== undefined && cell.value !== '';
  }

  private renderCellControl(
    row: ClinicalRow,
    column: ClinicalColumn,
    cell: ClinicalCellState | undefined,
    controlId: string,
    cellLocked: boolean,
    describedBy: string | undefined,
  ) {
    const address = { rowId: row.id, columnId: column.id };
    const label = `${row.label}, ${column.label}`;
    const emitValue = (value: ClinicalCellState['value']) => {
      if (canMutateMatrixCell(this.readOnly, this.model[row.id]?.cells[column.id])) {
        this.emitIntent<ClinicalMatrixIntent>({ type: 'cellEditRequested', ...address, value });
      }
    };
    const emitFocus = () => this.emitIntent<ClinicalMatrixIntent>({ type: 'cellFocused', ...address });

    if (cellLocked) {
      const formatted = formatMatrixCellValue(cell?.value);
      return row.type === 'multiline'
        ? html`<textarea
            class="emr-control"
            id=${controlId}
            rows="2"
            readonly
            aria-readonly="true"
            .value=${live(formatted)}
            aria-label=${label}
            aria-invalid=${cell?.error ? 'true' : nothing}
            aria-describedby=${describedBy || nothing}
            @focus=${emitFocus}
          ></textarea>`
        : html`<input
            class="emr-control"
            id=${controlId}
            type="text"
            readonly
            aria-readonly="true"
            .value=${live(formatted)}
            aria-label=${label}
            aria-invalid=${cell?.error ? 'true' : nothing}
            aria-describedby=${describedBy || nothing}
            @focus=${emitFocus}
          >`;
    }

    if (row.type === 'boolean') {
      const boolStr = typeof cell?.value === 'boolean' ? String(cell.value) : null;
      return html`<emr-select
        .controlId=${controlId}
        .label=${label}
        .labelHidden=${true}
        .options=${[
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ]}
        .value=${boolStr}
        .allowClear=${row.clearable ?? true}
        .invalid=${!!cell?.error}
        .ariaDescribedBy=${describedBy ?? ''}
        @valueChange=${(event: CustomEvent<string | null>) => {
          event.stopPropagation();
          emitValue(event.detail === null || event.detail === '' ? null : event.detail === 'true');
        }}
        @focusin=${emitFocus}
      ></emr-select>`;
    }

    if (row.type === 'date') {
      const strVal = typeof cell?.value === 'string' ? cell.value : null;
      return html`<emr-date-input
        .controlId=${controlId}
        .label=${label}
        .labelHidden=${true}
        .value=${strVal}
        .min=${row.minDate ?? ''}
        .max=${row.maxDate ?? ''}
        .clearable=${!!row.clearable}
        .error=${cell?.error ?? ''}
        @valueChange=${(event: CustomEvent<string | null>) => {
          event.stopPropagation();
          emitValue(event.detail ?? null);
        }}
        @focusin=${emitFocus}
      ></emr-date-input>`;
    }

    if (row.type === 'text' && row.maxLength !== undefined) {
      const strVal = typeof cell?.value === 'string' ? cell.value : typeof cell?.value === 'number' ? String(cell.value) : '';
      return html`<emr-text-input
        .controlId=${controlId}
        .label=${label}
        .labelHidden=${true}
        .value=${strVal}
        .maxLength=${row.maxLength}
        .placeholder=${row.placeholder ?? ''}
        .clearable=${!!row.clearable}
        .error=${cell?.error ?? ''}
        @valueChange=${(event: CustomEvent<string>) => {
          event.stopPropagation();
          emitValue(event.detail);
        }}
        @focusin=${emitFocus}
      ></emr-text-input>`;
    }

    const step = resolveMatrixDecimalStep(row);
    const field: ClinicalFieldDefinition = {
      id: controlId,
      label,
      type: row.type,
      widget: row.type === 'select' ? 'select' : undefined,
      unit: row.unit,
      precision: row.precision,
      min: row.min,
      max: row.max,
      step,
      required: row.required,
      placeholder: row.placeholder,
      maxLength: row.maxLength,
      options: row.options,
      customRendererKey: row.customRendererKey,
    };
    const state: ClinicalFieldState | undefined = cell
      ? {
          ...cell,
          readOnly: false,
          disabled: false,
          assessmentStatus: undefined,
        }
      : undefined;

    return renderField(
      field,
      state,
      controlId,
      false,
      {
        canEdit: () => canMutateMatrixCell(this.readOnly, this.model[row.id]?.cells[column.id]),
        edit: (value) => {
          if (!Array.isArray(value) && (value === null || typeof value !== 'object' || ('value' in value && 'unit' in value))) {
            emitValue(value as ClinicalCellState['value']);
          }
        },
        status: () => {},
        focus: emitFocus,
      },
      true,
    );
  }

  private cell(row: ClinicalRow, column: ClinicalColumn, surface: 'table' | 'cards') {
    if (!isMatrixCellApplicable(row, column.id)) {
      return html`<div class="emr-matrix__na"><span aria-hidden="true">—</span><span class="emr-sr-only">Not applicable</span></div>`;
    }
    const def = this.definition!;
    const cell = this.model[row.id]?.cells[column.id];
    const cellLocked = !canMutateMatrixCell(this.readOnly, cell);
    const address = { rowId: row.id, columnId: column.id };
    const controlId = resolveMatrixDomId(this.idPrefix, def.id, surface, row.id, column.id);

    if (row.type === 'custom') {
      const renderCustom = row.customRendererKey ? this.customRenderers[row.customRendererKey] : undefined;
      if (!renderCustom) {
        return html`<div class="emr-matrix__na" role="status">Custom renderer unavailable</div>`;
      }
      const context: EmrClinicalCellRenderContext = {
        row,
        column,
        cell,
        readOnly: cellLocked,
        emit: (action, payload) => {
          if (canMutateMatrixCell(this.readOnly, this.model[row.id]?.cells[column.id])) {
            this.emitIntent<ClinicalMatrixIntent>({ type: 'customCellIntent', ...address, action, payload });
          }
        },
      };
      return html`<div class=${`emr-matrix__cell${cell?.modified ? ' emr-matrix__cell--modified' : ''}`}>
        ${cell?.modified ? html`<span class="emr-sr-only">Modified</span>` : nothing}
        <emr-clinical-cell-renderer .columnId=${column.id} .cellModel=${context} .renderer=${renderCustom}></emr-clinical-cell-renderer>
        ${cell?.warning ? html`<span class="emr-matrix__message emr-matrix__warning" role="status">Warning: ${cell.warning}</span>` : nothing}
        ${cell?.error ? html`<span class="emr-matrix__message emr-matrix__error" role="alert">${cell.error}</span>` : nothing}
      </div>`;
    }

    const currentUnit = resolveMatrixQuantityUnit(row, cell);
    const currentNum =
      typeof cell?.value === 'object' && cell.value !== null && 'unit' in cell.value
        ? cell.value.value
        : null;
    const handlesOwnMessages =
      !cellLocked &&
      row.type !== 'boolean' &&
      row.type !== 'date' &&
      !(row.type === 'text' && row.maxLength !== undefined);
    const warningId = !handlesOwnMessages && cell?.warning ? `${controlId}-warning` : '';
    const errorId =
      !handlesOwnMessages && cell?.error && row.type !== 'date' && !(row.type === 'text' && row.maxLength !== undefined)
        ? `${controlId}-error`
        : '';
    const describedBy = [warningId, errorId].filter(Boolean).join(' ') || undefined;

    return html`<div class=${`emr-matrix__cell${cell?.modified ? ' emr-matrix__cell--modified' : ''}`}>
      ${cell?.modified ? html`<span class="emr-sr-only">Modified</span>` : nothing}
      ${this.renderCellControl(row, column, cell, controlId, cellLocked, describedBy)}
      ${row.type === 'quantity' && !cellLocked && row.unitOptions?.length
        ? html`<select
            class="emr-select emr-matrix__unit-select"
            aria-label=${`${row.label} unit, ${column.label}`}
            .value=${live(currentUnit)}
            @change=${(event: Event) => {
              const sel = event.target as HTMLSelectElement;
              const nextUnit = sel.value;
              sel.value = currentUnit;
              if (canMutateMatrixCell(this.readOnly, this.model[row.id]?.cells[column.id])) {
                this.emitIntent<ClinicalMatrixIntent>({
                  type: 'cellEditRequested',
                  ...address,
                  value: { value: currentNum, unit: nextUnit },
                });
              }
            }}
          >
            ${row.unitOptions.map(
              (opt) => html`<option value=${opt.value} ?selected=${opt.value === currentUnit}>${opt.label}</option>`,
            )}
          </select>`
        : nothing}
      ${row.clearable && !cellLocked && row.type !== 'boolean' && row.type !== 'date' && !(row.type === 'text' && row.maxLength !== undefined) && this.cellHasClearableValue(cell)
        ? html`<button
            type="button"
            class="emr-btn emr-btn--ghost emr-matrix__clear"
            data-emr-print="hide"
            aria-label=${`Clear ${row.label}, ${column.label}`}
            @click=${() => {
              if (canMutateMatrixCell(this.readOnly, this.model[row.id]?.cells[column.id])) {
                this.emitIntent<ClinicalMatrixIntent>({
                  type: 'cellEditRequested',
                  ...address,
                  value: row.type === 'quantity' ? { value: null, unit: currentUnit } : null,
                });
              }
            }}
          >
            ${renderEmrSvgIcon('close', 14)}
            <span>Clear</span>
          </button>`
        : nothing}
      ${!cellLocked && cell?.quickPresets?.length
        ? html`<div class="emr-matrix__presets" data-emr-print="hide">
            ${cell.quickPresets.map(
              (preset) => html`<button
                type="button"
                class="emr-matrix__preset"
                aria-label=${`Set ${row.label}, ${column.label} to ${preset}`}
                @click=${() => {
                  const latest = this.model[row.id]?.cells[column.id];
                  if (canMutateMatrixCell(this.readOnly, latest)) {
                    this.emitIntent<ClinicalMatrixIntent>({
                      type: 'cellEditRequested',
                      ...address,
                      value: parseMatrixPresetValue(row, preset, latest),
                    });
                  }
                }}
              >${preset}</button>`,
            )}
          </div>`
        : nothing}
      ${cell?.flagBadge || cell?.assessmentStatus || cell?.previousValueLabel || cell?.deltaLabel
        ? html`<div class="emr-matrix__meta-row">
            ${cell?.flagBadge ? html`<emr-badge .badge=${cell.flagBadge} size="sm"></emr-badge>` : nothing}
            ${cell?.assessmentStatus ? html`<emr-badge .badge=${cell.assessmentStatus} size="sm"></emr-badge>` : nothing}
            ${cell?.previousValueLabel ? html`<span class="emr-matrix__meta">${cell.previousValueLabel}</span>` : nothing}
            ${cell?.deltaLabel ? html`<span class="emr-matrix__meta">${cell.deltaLabel}</span>` : nothing}
          </div>`
        : nothing}
      ${!cellLocked && row.assessmentStatusOptions?.length
        ? html`<select
            class="emr-select"
            aria-label=${`Assessment status for ${row.label}, ${column.label}`}
            .value=${live(cell?.assessmentStatus?.value ?? '')}
            @change=${(event: Event) => {
              const sel = event.target as HTMLSelectElement;
              const next = (sel.value || null) as ClinicalAssessmentStatus | null;
              sel.value = cell?.assessmentStatus?.value ?? '';
              if (canMutateMatrixCell(this.readOnly, this.model[row.id]?.cells[column.id])) {
                this.emitIntent<ClinicalMatrixIntent>({
                  type: 'cellAssessmentStatusEditRequested',
                  ...address,
                  status: next,
                });
              }
            }}
          >
            <option value="" ?selected=${!cell?.assessmentStatus?.value}>Status not set</option>
            ${row.assessmentStatusOptions.map(
              (option) => html`<option value=${option.value} ?selected=${option.value === cell?.assessmentStatus?.value}>${option.label}</option>`,
            )}
          </select>`
        : nothing}
      ${!handlesOwnMessages && cell?.warning
        ? html`<span id=${warningId} class="emr-matrix__message emr-matrix__warning" role="status">Warning: ${cell.warning}</span>`
        : nothing}
      ${!handlesOwnMessages && cell?.error && row.type !== 'date' && !(row.type === 'text' && row.maxLength !== undefined)
        ? html`<span id=${errorId} class="emr-matrix__message emr-matrix__error" role="alert">${cell.error}</span>`
        : nothing}
    </div>`;
  }

  private renderRemark(row: ClinicalRow, surface: 'table' | 'cards', showAriaLabel: boolean) {
    const def = this.definition!;
    const state = this.model[row.id];
    const remarkLocked = !canMutateMatrixRemark(this.readOnly, state);
    const inputId = resolveMatrixDomId(this.idPrefix, def.id, surface, row.id, 'remark');
    const errorId = resolveMatrixDomId(this.idPrefix, def.id, surface, row.id, 'remark-error');
    return html`<div class="emr-matrix__cell">
      <input
        class="emr-control"
        id=${inputId}
        type="text"
        aria-label=${showAriaLabel ? `Remarks for ${row.label}` : nothing}
        .value=${live(state?.remark ?? '')}
        ?readonly=${remarkLocked}
        aria-readonly=${remarkLocked ? 'true' : nothing}
        aria-invalid=${state?.remarkError ? 'true' : nothing}
        aria-describedby=${state?.remarkError ? errorId : nothing}
        @blur=${(event: Event) => {
          (event.target as HTMLInputElement).value = this.model[row.id]?.remark ?? '';
        }}
        @input=${(event: Event) => {
          const target = event.target as HTMLInputElement;
          const current = this.model[row.id];
          if (!canMutateMatrixRemark(this.readOnly, current)) {
            target.value = current?.remark ?? '';
            return;
          }
          this.emitIntent<ClinicalMatrixIntent>({
            type: 'remarkEditRequested',
            rowId: row.id,
            remark: target.value,
          });
        }}
      >
      ${state?.remarkError
        ? html`<span id=${errorId} class="emr-matrix__message emr-matrix__error" role="alert">${state.remarkError}</span>`
        : nothing}
    </div>`;
  }

  override render() {
    const def = this.definition;
    if (!def) return nothing;
    const resolvedHeadingId = resolveMatrixHeadingId(def.id, this.headingId, this.idPrefix);
    const showRemarks = def.showRemarks !== false;
    const groupSlots = groupMatrixColumns(def.columns, def.columnGroups);
    const groupedColumns = groupSlots.flatMap((slot) => (slot.kind === 'group' ? slot.columns : []));

    return html`<section
      class="emr-matrix"
      aria-labelledby=${resolvedHeadingId}
      @focusin=${() => {
        if (!this.isFocusedWithin) {
          this.isFocusedWithin = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
      }}
      @focusout=${(event: FocusEvent) => {
        const next = event.relatedTarget as Node | null;
        if (next && (this.contains(next) || this.shadowRoot?.contains(next))) return;
        if (this.isFocusedWithin) {
          this.isFocusedWithin = false;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }
      }}
    >
      <header class="emr-matrix__header">
        <h2 class="emr-matrix__title" id=${resolvedHeadingId}>${def.label}</h2>
        ${def.description ? html`<p class="emr-matrix__description">${def.description}</p>` : nothing}
      </header>
      <div class="table-wrap">
        <table>
          <thead>
            ${def.columnGroups?.length
              ? html`<tr>
                  <th rowspan="2" scope="col">Clinical field</th>
                  ${groupSlots.map((slot) =>
                    slot.kind === 'group'
                      ? html`<th scope="colgroup" colspan=${slot.colSpan}>${slot.label}</th>`
                      : html`<th rowspan="2" scope="col">${slot.columns[0].label}</th>`,
                  )}
                  ${showRemarks ? html`<th rowspan="2" scope="col">Remarks</th>` : nothing}
                </tr>
                ${groupedColumns.length
                  ? html`<tr>${groupedColumns.map((col) => html`<th scope="col">${col.label}</th>`)}</tr>`
                  : nothing}`
              : html`<tr>
                  <th scope="col">Clinical field</th>
                  ${def.columns.map((col) => html`<th scope="col">${col.label}</th>`)}
                  ${showRemarks ? html`<th scope="col">Remarks</th>` : nothing}
                </tr>`}
          </thead>
          <tbody>
            ${repeat(def.rows, (row) => row.id, (row) => html`<tr>
              <th class="emr-matrix__row-label" scope="row">
                ${row.label}${row.required ? html`<span class="emr-matrix__error" aria-hidden="true"> *</span>` : nothing}
                ${row.unit ? html` <span class="emr-muted">(${row.unit})</span>` : nothing}
                ${row.helpText ? html`<span class="emr-matrix__message">${row.helpText}</span>` : nothing}
              </th>
              ${def.columns.map((column) => html`<td>${this.cell(row, column, 'table')}</td>`)}
              ${showRemarks ? html`<td>${this.renderRemark(row, 'table', true)}</td>` : nothing}
            </tr>`)}
          </tbody>
        </table>
      </div>
      <div class="emr-matrix-cards">
        ${repeat(def.rows, (row) => row.id, (row) => html`<article class="emr-matrix-card">
          <div class="emr-matrix-card__title">
            ${row.label}${row.required ? html`<span class="emr-matrix__error" aria-hidden="true"> *</span>` : nothing}
            ${row.unit ? html` <span class="emr-muted">(${row.unit})</span>` : nothing}
            ${row.helpText ? html`<span class="emr-matrix__message">${row.helpText}</span>` : nothing}
          </div>
          ${def.columns.map(
            (column) => html`<div class="emr-matrix-card__cell">
              <span class="emr-matrix-card__label">${column.label}</span>
              ${this.cell(row, column, 'cards')}
            </div>`,
          )}
          ${showRemarks
            ? html`<div class="emr-matrix-card__cell">
                <label class="emr-matrix-card__label" for=${resolveMatrixDomId(this.idPrefix, def.id, 'cards', row.id, 'remark')}>Remarks</label>
                ${this.renderRemark(row, 'cards', false)}
              </div>`
            : nothing}
        </article>`)}
      </div>
    </section>`;
  }
}

export interface EmrClinicalCellRenderContext {
  row: ClinicalRow;
  column: ClinicalColumn;
  cell?: ClinicalCellState;
  readOnly: boolean;
  emit(action: string, payload?: unknown): void;
}

export type EmrCustomRendererResult = TemplateResult | HTMLElement | string | typeof nothing;

export type EmrCustomRenderers = Readonly<Record<string, (context: EmrClinicalCellRenderContext) => EmrCustomRendererResult>>;

const TOOLBAR_NAV_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
const LIST_NAV_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

const TOOLBAR_SVG_MAP: Readonly<Record<string, EmrLitIconName>> = {
  'shape-line': 'shape-line',
  'shape-arrow': 'shape-arrow',
  'shape-curve': 'shape-curve',
  'shape-rect': 'shape-rect',
  'shape-ellipse': 'shape-ellipse',
  'shape-polygon': 'shape-polygon',
  'shape-freehand': 'shape-freehand',
  'shape-text': 'shape-text',
  'shape-eraser': 'shape-eraser',
  'shape-callout': 'shape-callout',
  'shape-suture': 'shape-suture',
  'shape-hatch': 'shape-hatch',
  'shape-lattice': 'shape-lattice',
  heroCursorArrowRays: 'cursor',
  heroArrowsPointingOut: 'arrows-out',
  heroHandRaised: 'hand',
  heroBackspace: 'backspace',
  heroPencil: 'pen',
  heroPencilSquare: 'pen',
  heroMinus: 'shape-line',
  heroArrowLongRight: 'shape-arrow',
  heroArrowTrendingUp: 'shape-curve',
  heroSquare2Stack: 'copy',
  heroStop: 'shape-rect',
  heroCircleStack: 'shape-ellipse',
  heroBars3BottomLeft: 'shape-text',
};

const LIST_TOOL_ICON: Readonly<Record<AnnotationLayerRecord['tool'], EmrLitIconName>> = {
  text: 'shape-text',
  line: 'shape-line',
  arrow: 'shape-arrow',
  callout: 'shape-callout',
  curve: 'shape-curve',
  circle: 'shape-ellipse',
  polygon: 'shape-polygon',
  freeform: 'shape-freehand',
};

const LIST_TOOL_NAME: Readonly<Record<AnnotationLayerRecord['tool'], string>> = {
  text: 'Text',
  line: 'Line',
  arrow: 'Arrow',
  callout: 'Callout',
  curve: 'Curve',
  circle: 'Circle',
  polygon: 'Polygon',
  freeform: 'Freehand',
};

export class EmrAnnotationToolbarElement extends EmrLitElement {
  static override styles = [
    emrShadowStyles,
    l3Styles,
    css`
      :host-context(.emr-print) {
        display: none !important;
      }
      @media print {
        :host {
          display: none !important;
        }
      }
    `,
  ];

  @property({ attribute: false }) model?: AnnotationToolbarViewModel;
  @property({ type: String }) headingId = '';
  @property({ type: String }) idPrefix = '';
  @property({ attribute: false }) labels?: EmrAnnotationToolbarLabels;

  @state() private open = false;
  @state() private focusedKey: string | null = null;
  private isFocusedWithin = false;

  private readonly onOutsidePointerDown = (event: Event): void => {
    if (!this.open) return;
    if (!event.composedPath().includes(this)) {
      this.open = false;
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

  override updated(): void {
    const m = this.model;
    if (!m || m.readOnly || (m.colours.length === 0 && m.widths.length === 0)) {
      if (this.open) this.open = false;
    }
  }

  private resolvedLabels() {
    return {
      toolbarAria: this.labels?.toolbarAria ?? 'Annotation tools',
      toolsGroup: this.labels?.toolsGroup ?? 'Tools',
      penGroup: this.labels?.penGroup ?? 'Pen',
      penPrefix: this.labels?.penPrefix ?? 'Pen',
      penFallback: this.labels?.penFallback ?? 'Pen colour and width',
      penPanelAria: this.labels?.penPanelAria ?? 'Pen colour and width',
      colourGroup: this.labels?.colourGroup ?? 'Colour',
      widthGroup: this.labels?.widthGroup ?? 'Line width',
      historyGroup: this.labels?.historyGroup ?? 'History',
      undo: this.labels?.undo ?? 'Undo',
      redo: this.labels?.redo ?? 'Redo',
      zoomGroup: this.labels?.zoomGroup ?? 'Zoom',
      zoomOut: this.labels?.zoomOut ?? 'Zoom out',
      zoomIn: this.labels?.zoomIn ?? 'Zoom in',
      zoomFit: this.labels?.zoomFit ?? 'Fit to view',
      zoomReset: this.labels?.zoomReset ?? 'Reset zoom',
      zoomResetAria:
        this.labels?.zoomResetAria ?? ((zoomLabel: string) => `Reset zoom, currently ${zoomLabel}`),
      saveGroup: this.labels?.saveGroup ?? 'Save',
      save: this.labels?.save ?? 'Save annotations',
    };
  }

  private enabledKeys(m: AnnotationToolbarViewModel): string[] {
    const off = !!m.readOnly;
    const hasPen = m.colours.length > 0 || m.widths.length > 0;
    return [
      ...m.tools.filter((t) => !off && !t.disabled).map((t) => `t:${t.id}`),
      ...(!off && hasPen ? ['pen'] : []),
      ...(!off && m.canUndo ? ['undo'] : []),
      ...(!off && m.canRedo ? ['redo'] : []),
      ...(m.zoomLocked ? [] : ['zoomOut', 'zoomReset', 'zoomIn', 'zoomFit']),
      ...(!off && m.canSave ? ['save'] : []),
    ];
  }

  private activeStop(m: AnnotationToolbarViewModel): string | undefined {
    const keys = this.enabledKeys(m);
    if (this.focusedKey && keys.includes(this.focusedKey)) return this.focusedKey;
    const sel = m.selectedToolId ? `t:${m.selectedToolId}` : '';
    return keys.includes(sel) ? sel : keys[0];
  }

  private closePen(refocus: boolean): void {
    if (!this.open) return;
    this.open = false;
    if (refocus) {
      this.shadowRoot?.querySelector<HTMLButtonElement>('[data-key="pen"]')?.focus();
    }
  }

  private emitGuarded(intent: AnnotationToolbarIntent): void {
    const m = this.model;
    if (!m || !canTriggerToolbarIntent(m, intent)) return;
    this.emitIntent(intent);
  }

  private pickPenOption(intent: AnnotationToolbarIntent): void {
    const m = this.model;
    if (!m || !canTriggerToolbarIntent(m, intent)) return;
    this.emitIntent(intent);
    this.closePen(true);
  }

  private toolTitle(t: ToolbarTool): string {
    return t.shortcutLabel ? `${t.label} (${t.shortcutLabel})` : t.label;
  }

  private onToolbarKey(e: KeyboardEvent): void {
    if (!TOOLBAR_NAV_KEYS.includes(e.key)) return;
    const els = [...(this.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tb .tb__b') ?? [])].filter(
      (b) => b.getAttribute('aria-disabled') !== 'true',
    );
    const i = els.indexOf(e.target as HTMLButtonElement);
    if (i < 0 || els.length === 0) return;
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? els.length - 1 : (i + step + els.length) % els.length;
    e.preventDefault();
    const key = els[next].dataset['key'];
    if (key) this.focusedKey = key;
    els[next].focus();
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const l = this.resolvedLabels();
    const locked = !!m.readOnly;
    const hasPen = m.colours.length > 0 || m.widths.length > 0;
    const isPenOpen = this.open && canOpenToolbarPen(m);
    const panelId = resolveAnnotationToolbarPanelId(this.idPrefix, this.headingId);
    const colour = m.colours.find((c) => c.id === m.selectedColourId);
    const width = m.widths.find((w) => w.id === m.selectedWidthId);
    const penParts = [colour?.label, width?.label].filter((p): p is string => Boolean(p));
    const penSummary = penParts.length ? `${l.penPrefix}: ${penParts.join(', ')}` : l.penFallback;
    const stop = this.activeStop(m);
    const tab = (key: string) => (key === stop ? 0 : -1);

    return html`<div
      class="tbw"
      data-emr-print="hide"
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === 'Escape' && this.open) {
          e.preventDefault();
          this.closePen(true);
        }
      }}
      @focusin=${() => {
        if (!this.isFocusedWithin) {
          this.isFocusedWithin = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
      }}
      @focusout=${(e: FocusEvent) => {
        const next = e.relatedTarget as Node | null;
        if (next && (this.contains(next) || this.shadowRoot?.contains(next))) return;
        if (this.open) this.open = false;
        if (this.isFocusedWithin) {
          this.isFocusedWithin = false;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }
      }}
    >
      <div
        class="tb"
        role="toolbar"
        aria-orientation="horizontal"
        aria-label=${this.headingId ? nothing : l.toolbarAria}
        aria-labelledby=${this.headingId || nothing}
        @keydown=${this.onToolbarKey}
        @focusin=${(e: FocusEvent) => {
          const key = (e.target as HTMLElement | null)?.dataset?.['key'];
          if (key && this.enabledKeys(m).includes(key)) this.focusedKey = key;
        }}
      >
        ${m.tools.length
          ? html`<div class="tb__g" role="group" aria-label=${l.toolsGroup}>
              ${m.tools.map((t) => {
                const toolDisabled = locked || !!t.disabled;
                const selected = t.id === m.selectedToolId;
                const iconName = TOOLBAR_SVG_MAP[t.icon];
                return html`<button
                  type="button"
                  class="tb__b"
                  data-key=${`t:${t.id}`}
                  tabindex=${tab(`t:${t.id}`)}
                  aria-label=${t.label}
                  title=${this.toolTitle(t)}
                  aria-pressed=${selected ? 'true' : 'false'}
                  aria-disabled=${toolDisabled ? 'true' : nothing}
                  @click=${() => this.emitGuarded({ type: 'toolSelected', toolId: t.id })}
                >
                  <span class="tb__f">
                    ${iconName
                      ? renderEmrSvgIcon(iconName, 20)
                      : html`<span class="tb__init" aria-hidden="true">${t.label.slice(0, 1)}</span>`}
                  </span>
                </button>`;
              })}
            </div>`
          : nothing}
        ${hasPen
          ? html`<div class="tb__g" role="group" aria-label=${l.penGroup}>
              <button
                type="button"
                class="tb__b tb__b--pen"
                data-key="pen"
                tabindex=${tab('pen')}
                aria-label=${penSummary}
                title=${penSummary}
                aria-expanded=${isPenOpen ? 'true' : 'false'}
                aria-controls=${panelId}
                aria-disabled=${locked ? 'true' : nothing}
                @click=${() => {
                  if (canOpenToolbarPen(m)) this.open = !this.open;
                }}
              >
                <span class="tb__f tb__f--pen">
                  <span class="tb__dot" aria-hidden="true" style=${colour ? `background:${colour.hex}` : ''}></span>
                  <span class="tb__bar" aria-hidden="true" style=${width ? `height:${width.px}px` : ''}></span>
                </span>
              </button>
            </div>`
          : nothing}
        <div class="tb__g" role="group" aria-label=${l.historyGroup}>
          <button
            type="button"
            class="tb__b"
            data-key="undo"
            tabindex=${tab('undo')}
            aria-label=${l.undo}
            title=${l.undo}
            aria-disabled=${locked || !m.canUndo ? 'true' : nothing}
            @click=${() => this.emitGuarded({ type: 'undoRequested' })}
          >
            <span class="tb__f">${renderEmrSvgIcon('undo', 18)}</span>
          </button>
          <button
            type="button"
            class="tb__b"
            data-key="redo"
            tabindex=${tab('redo')}
            aria-label=${l.redo}
            title=${l.redo}
            aria-disabled=${locked || !m.canRedo ? 'true' : nothing}
            @click=${() => this.emitGuarded({ type: 'redoRequested' })}
          >
            <span class="tb__f">${renderEmrSvgIcon('redo', 18)}</span>
          </button>
        </div>
        <div class="tb__g" role="group" aria-label=${l.zoomGroup}>
          <button
            type="button"
            class="tb__b"
            data-key="zoomOut"
            tabindex=${tab('zoomOut')}
            aria-label=${l.zoomOut}
            title=${l.zoomOut}
            aria-disabled=${m.zoomLocked ? 'true' : nothing}
            @click=${() => this.emitGuarded({ type: 'zoomOutRequested' })}
          >
            <span class="tb__f">${renderEmrSvgIcon('zoom-out', 18)}</span>
          </button>
          <button
            type="button"
            class="tb__b"
            data-key="zoomReset"
            tabindex=${tab('zoomReset')}
            aria-label=${l.zoomResetAria(m.zoomLabel)}
            title=${l.zoomReset}
            aria-disabled=${m.zoomLocked ? 'true' : nothing}
            @click=${() => this.emitGuarded({ type: 'zoomResetRequested' })}
          >
            <span class="tb__f tb__f--text">${m.zoomLabel}</span>
          </button>
          <button
            type="button"
            class="tb__b"
            data-key="zoomIn"
            tabindex=${tab('zoomIn')}
            aria-label=${l.zoomIn}
            title=${l.zoomIn}
            aria-disabled=${m.zoomLocked ? 'true' : nothing}
            @click=${() => this.emitGuarded({ type: 'zoomInRequested' })}
          >
            <span class="tb__f">${renderEmrSvgIcon('zoom-in', 18)}</span>
          </button>
          <button
            type="button"
            class="tb__b"
            data-key="zoomFit"
            tabindex=${tab('zoomFit')}
            aria-label=${l.zoomFit}
            title=${l.zoomFit}
            aria-disabled=${m.zoomLocked ? 'true' : nothing}
            @click=${() => this.emitGuarded({ type: 'zoomFitRequested' })}
          >
            <span class="tb__f">${renderEmrSvgIcon('maximize', 18)}</span>
          </button>
        </div>
        <div class="tb__g" role="group" aria-label=${l.saveGroup}>
          <button
            type="button"
            class="tb__b"
            data-key="save"
            tabindex=${tab('save')}
            aria-label=${m.saveLabel ?? l.save}
            title=${m.saveLabel ?? l.save}
            aria-disabled=${locked || !m.canSave ? 'true' : nothing}
            @click=${() => this.emitGuarded({ type: 'saveRequested' })}
          >
            <span class="tb__f">${renderEmrSvgIcon('download', 18)}</span>
          </button>
        </div>
      </div>
      ${isPenOpen
        ? html`<div class="tb__panel" role="group" aria-label=${l.penPanelAria} tabindex="-1" id=${panelId}>
            ${m.colours.length
              ? html`<div class="tb__g" role="group" aria-label=${l.colourGroup}>
                  ${m.colours.map((c) => {
                    const selected = c.id === m.selectedColourId;
                    return html`<button
                      type="button"
                      class="tb__b"
                      title=${c.label}
                      aria-label=${c.label}
                      aria-pressed=${selected ? 'true' : 'false'}
                      @click=${() => this.pickPenOption({ type: 'colourSelected', colourId: c.id })}
                    >
                      <span class="tb__f tb__f--swatch">
                        <span class="tb__sw" style=${`background:${c.hex}`}>
                          ${selected ? html`<span class="tb__tick">${renderEmrSvgIcon('check', 11)}</span>` : nothing}
                        </span>
                      </span>
                    </button>`;
                  })}
                </div>`
              : nothing}
            ${m.widths.length
              ? html`<div class="tb__g" role="group" aria-label=${l.widthGroup}>
                  ${m.widths.map((w) => {
                    const selected = w.id === m.selectedWidthId;
                    return html`<button
                      type="button"
                      class="tb__b"
                      title=${w.label}
                      aria-label=${w.label}
                      aria-pressed=${selected ? 'true' : 'false'}
                      @click=${() => this.pickPenOption({ type: 'widthSelected', widthId: w.id })}
                    >
                      <span class="tb__f">
                        <span class="tb__bar tb__bar--wide" aria-hidden="true" style=${`height:${w.px}px`}></span>
                      </span>
                    </button>`;
                  })}
                </div>`
              : nothing}
          </div>`
        : nothing}
    </div>`;
  }
}

export class EmrAnnotationListElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];

  @property({ attribute: false }) model?: AnnotationListViewModel;
  @property({ type: String }) headingId = '';
  @property({ type: String }) idPrefix = '';
  @property({ attribute: false }) labels?: EmrAnnotationListLabels;

  @state() private activeId: string | null = null;
  private isFocusedWithin = false;

  private resolvedLabels() {
    return {
      listAria: this.labels?.listAria ?? 'Annotations',
      locked: this.labels?.locked ?? 'Locked',
      hidden: this.labels?.hidden ?? 'Hidden',
      drawingPrefix: this.labels?.drawingPrefix ?? 'Drawing',
      showTitle: this.labels?.showTitle ?? 'Show drawing',
      hideTitle: this.labels?.hideTitle ?? 'Hide drawing',
      lockTitle: this.labels?.lockTitle ?? 'Lock drawing',
      unlockTitle: this.labels?.unlockTitle ?? 'Unlock drawing',
      moveUpTitle: this.labels?.moveUpTitle ?? 'Move up',
      moveDownTitle: this.labels?.moveDownTitle ?? 'Move down',
      deleteTitle: this.labels?.deleteTitle ?? 'Delete drawing',
      showDrawing:
        this.labels?.showDrawing ?? ((num: number, name: string) => `Show drawing ${num}, ${name}`),
      lockDrawing:
        this.labels?.lockDrawing ?? ((num: number, name: string) => `Lock drawing ${num}, ${name}`),
      moveUpDrawing:
        this.labels?.moveUpDrawing ?? ((num: number, name: string) => `Move drawing ${num} up, ${name}`),
      moveDownDrawing:
        this.labels?.moveDownDrawing ??
        ((num: number, name: string) => `Move drawing ${num} down, ${name}`),
      deleteDrawing:
        this.labels?.deleteDrawing ?? ((num: number, name: string) => `Delete drawing ${num}, ${name}`),
    };
  }

  private primary(it: AnnotationListItem): string {
    return it.classLabel || it.layer.label;
  }

  private secondary(it: AnnotationListItem): string {
    return it.classLabel && it.layer.label && it.layer.label !== it.classLabel ? it.layer.label : '';
  }

  private fullSummary(it: AnnotationListItem): string {
    return [this.primary(it), this.secondary(it), it.description].filter(Boolean).join(' · ');
  }

  private activeStop(m: AnnotationListViewModel): string | undefined {
    const ids = m.items.map((item) => item.layer.id);
    if (m.selectedLayerId && ids.includes(m.selectedLayerId)) {
      return this.activeId && ids.includes(this.activeId) ? this.activeId : m.selectedLayerId;
    }
    if (this.activeId && ids.includes(this.activeId)) return this.activeId;
    return ids[0];
  }

  private rowDomId(layerId: string): string {
    const prefix = this.idPrefix.trim().replace(/-+$/, '');
    return prefix ? `${prefix}-al-row-${layerId}` : `emr-al-row-${layerId}`;
  }

  private selectLayer(layerId: string): void {
    if (this.model?.items.some((item) => item.layer.id === layerId)) {
      this.emitIntent<AnnotationListIntent>({ type: 'layerSelected', layerId });
    }
  }

  private toggleVisibility(layerId: string): void {
    if (this.model && canToggleAnnotationLayerVisibility(this.model, layerId)) {
      this.emitIntent<AnnotationListIntent>({ type: 'layerVisibilityToggleRequested', layerId });
    }
  }

  private toggleLock(layerId: string): void {
    if (this.model && canToggleAnnotationLayerLock(this.model, layerId)) {
      this.emitIntent<AnnotationListIntent>({ type: 'layerLockToggleRequested', layerId });
    }
  }

  private moveLayer(layerId: string, direction: 'up' | 'down'): void {
    if (this.model && canMoveAnnotationLayer(this.model, layerId, direction)) {
      this.emitIntent<AnnotationListIntent>({ type: 'layerMoveRequested', layerId, direction });
    }
  }

  private removeLayer(layerId: string): void {
    if (this.model && canRemoveAnnotationLayer(this.model, layerId)) {
      this.emitIntent<AnnotationListIntent>({ type: 'layerRemoveRequested', layerId });
    }
  }

  private onListKey(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null;
    if (!target || !LIST_NAV_KEYS.includes(e.key) || !target.classList.contains('al__main')) return;
    const els = [...(this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button.al__main') ?? [])];
    const i = els.indexOf(target as HTMLButtonElement);
    if (i < 0 || els.length === 0) return;
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? els.length - 1
          : Math.min(els.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)));
    e.preventDefault();
    const id = els[next].dataset['id'];
    if (id) this.activeId = id;
    els[next].focus();
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const l = this.resolvedLabels();
    const listId = resolveAnnotationListId(this.idPrefix, this.headingId);
    const stop = this.activeStop(m);
    const tab = (id: string) => (id === stop ? 0 : -1);

    return html`<div
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
      ${m.items.length
        ? html`<ol
            class="al"
            id=${listId}
            aria-label=${this.headingId ? nothing : l.listAria}
            aria-labelledby=${this.headingId || nothing}
            @keydown=${this.onListKey}
            @focusin=${(e: FocusEvent) => {
              const id = (e.target as HTMLElement | null)?.closest('li')?.dataset?.['id'];
              if (id) this.activeId = id;
            }}
          >
            ${repeat(
              m.items,
              (it) => it.layer.id,
              (it, index) => {
                const selected = it.layer.id === m.selectedLayerId;
                const first = index === 0;
                const last = index === m.items.length - 1;
                const primary = this.primary(it);
                const secondary = this.secondary(it);
                const summary = this.fullSummary(it);
                const toolName = LIST_TOOL_NAME[it.layer.tool];
                const toolIcon = LIST_TOOL_ICON[it.layer.tool];

                return html`<li
                  class=${`al__row${selected ? ' al__row--on' : ''}${!it.layer.visible ? ' al__row--off' : ''}`}
                  id=${this.rowDomId(it.layer.id)}
                  aria-current=${selected ? 'true' : nothing}
                  data-id=${it.layer.id}
                >
                  <button
                    type="button"
                    class="al__main"
                    data-id=${it.layer.id}
                    tabindex=${tab(it.layer.id)}
                    title=${summary}
                    @click=${() => this.selectLayer(it.layer.id)}
                  >
                    <span class="al__no" aria-hidden="true">${it.number}</span>
                    <span class="al__sw" aria-hidden="true" style=${`background:${it.layer.color}`}></span>
                    <span class="al__txt">
                      <span class="al__name">
                        ${primary}${secondary ? html`<span class="al__cls"> · ${secondary}</span>` : nothing}
                      </span>
                      ${it.description ? html`<span class="al__desc">${it.description}</span>` : nothing}
                    </span>
                    <span class="al__tool" role="img" aria-label=${toolName} title=${toolName}>
                      ${renderEmrSvgIcon(toolIcon, 20)}
                    </span>
                    ${it.locked
                      ? html`<span class="al__tool" role="img" aria-label=${l.locked} title=${l.locked}>
                          ${renderEmrSvgIcon('lock', 16)}
                        </span>`
                      : nothing}
                    ${m.readOnly && !it.layer.visible
                      ? html`<span class="al__tool" role="img" aria-label=${l.hidden} title=${l.hidden}>
                          ${renderEmrSvgIcon('eye-off', 16)}
                        </span>`
                      : nothing}
                    <span class="emr-sr-only">
                      ${l.drawingPrefix} ${it.number}${it.locked ? `, ${l.locked}` : ''}${!it.layer.visible ? `, ${l.hidden}` : ''}
                    </span>
                  </button>
                  ${m.readOnly
                    ? nothing
                    : html`<span class="al__acts" data-emr-print="hide">
                        <button
                          type="button"
                          class="al__b al__b--eye"
                          tabindex=${tab(it.layer.id)}
                          aria-pressed=${it.layer.visible ? 'true' : 'false'}
                          aria-label=${l.showDrawing(it.number, primary)}
                          title=${it.layer.visible ? l.hideTitle : l.showTitle}
                          @click=${() => this.toggleVisibility(it.layer.id)}
                        >
                          <span class="al__f">${renderEmrSvgIcon(it.layer.visible ? 'eye' : 'eye-off', 18)}</span>
                        </button>
                        ${m.canLock
                          ? html`<button
                              type="button"
                              class="al__b"
                              tabindex=${tab(it.layer.id)}
                              aria-pressed=${it.locked ? 'true' : 'false'}
                              aria-label=${l.lockDrawing(it.number, primary)}
                              title=${it.locked ? l.unlockTitle : l.lockTitle}
                              @click=${() => this.toggleLock(it.layer.id)}
                            >
                              <span class="al__f">${renderEmrSvgIcon(it.locked ? 'lock' : 'unlock', 18)}</span>
                            </button>`
                          : nothing}
                        ${selected
                          ? html`<button
                                type="button"
                                class="al__b"
                                tabindex=${tab(it.layer.id)}
                                aria-disabled=${first || it.locked ? 'true' : nothing}
                                aria-label=${l.moveUpDrawing(it.number, primary)}
                                title=${l.moveUpTitle}
                                @click=${() => this.moveLayer(it.layer.id, 'up')}
                              >
                                <span class="al__f">${renderEmrSvgIcon('chevron-up', 18)}</span>
                              </button>
                              <button
                                type="button"
                                class="al__b"
                                tabindex=${tab(it.layer.id)}
                                aria-disabled=${last || it.locked ? 'true' : nothing}
                                aria-label=${l.moveDownDrawing(it.number, primary)}
                                title=${l.moveDownTitle}
                                @click=${() => this.moveLayer(it.layer.id, 'down')}
                              >
                                <span class="al__f">${renderEmrSvgIcon('chevron-down', 18)}</span>
                              </button>`
                          : nothing}
                        <button
                          type="button"
                          class="al__b al__b--danger"
                          tabindex=${tab(it.layer.id)}
                          aria-disabled=${it.locked ? 'true' : nothing}
                          aria-label=${l.deleteDrawing(it.number, primary)}
                          title=${l.deleteTitle}
                          @click=${() => this.removeLayer(it.layer.id)}
                        >
                          <span class="al__f">${renderEmrSvgIcon('trash', 18)}</span>
                        </button>
                      </span>`}
                </li>`;
              },
            )}
          </ol>`
        : html`<p class="al__empty" role="status">${m.emptyMessage}</p>`}
    </div>`;
  }
}

let nextLitPickerId = 0;

const imageTemplatePickerStyles = css`
  :host {
    display: block;
    color: var(--emr-text, #263847);
    font-family: var(--emr-font-family, 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif);
    min-width: 0;
  }
  .tp {
    container-type: inline-size;
    display: grid;
    gap: 12px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius-lg, 12px);
    background: var(--emr-surface, #fffefa);
    padding: 16px;
    min-width: 0;
  }
  .tp__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  .tp__title {
    min-width: 0;
  }
  .tp__name {
    margin: 0;
    font-size: var(--emr-text-xl, 1.25rem);
    font-weight: var(--emr-weight-bold, 700);
    line-height: var(--emr-leading-tight, 1.25);
    color: var(--emr-text, #263847);
    overflow-wrap: anywhere;
  }
  .tp__total {
    margin: 2px 0 0;
    font-size: var(--emr-text-sm, 0.8125rem);
    color: var(--emr-text-muted, #5c6c78);
  }
  .tp__close {
    width: 44px;
    min-width: 44px;
    min-height: 44px;
    height: max(44px, var(--emr-control-height, 44px));
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: transparent;
    color: var(--emr-text, #263847);
    cursor: pointer;
    flex: none;
  }
  .tp__close:hover {
    background: var(--emr-surface-raised, #eff3f5);
  }
  .tp__search {
    position: relative;
  }
  .tp__glass {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--emr-text-muted, #5c6c78);
    pointer-events: none;
    display: inline-flex;
  }
  .tp__input {
    width: 100%;
    box-sizing: border-box;
    min-height: max(44px, var(--emr-control-height, 44px));
    padding: 9px 12px 9px 38px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    color: var(--emr-text, #263847);
    font: inherit;
    font-size: var(--emr-text-md, 0.875rem);
  }
  .tp__input--clearable {
    padding-right: 46px;
  }
  .tp__input:hover {
    border-color: var(--emr-focus, #5f7f92);
  }
  .tp__input::placeholder {
    color: var(--emr-text-muted, #5c6c78);
  }
  .tp__input::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
  }
  .tp__clear {
    position: absolute;
    right: 2px;
    top: 50%;
    transform: translateY(-50%);
    display: grid;
    place-items: center;
    width: 44px;
    min-width: 44px;
    height: 44px;
    min-height: 44px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--emr-text-muted, #5c6c78);
    cursor: pointer;
  }
  .tp__clear:hover {
    color: var(--emr-text, #263847);
    background: var(--emr-surface-soft, #f1f4f5);
  }
  .tp__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 3px;
    margin: -3px;
    max-height: calc(3 * max(44px, var(--emr-control-height, 44px)) + 18px);
    overflow-y: auto;
  }
  .tp__chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: max(44px, var(--emr-control-height, 44px));
    min-width: 44px;
    padding: 0 12px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: 999px;
    background: var(--emr-surface, #fffefa);
    color: var(--emr-text, #263847);
    font: inherit;
    font-size: var(--emr-text-sm, 0.8125rem);
    font-weight: var(--emr-weight-medium, 500);
    cursor: pointer;
    white-space: nowrap;
  }
  .tp__chip:hover {
    background: var(--emr-surface-raised, #eff3f5);
  }
  .tp__chip[aria-pressed="true"] {
    background: var(--emr-primary-soft, #e3ebef);
    border-color: var(--emr-primary, #475f70);
    box-shadow: inset 0 0 0 1px var(--emr-primary, #475f70);
    color: var(--emr-primary-contrast, #344b5a);
    font-weight: var(--emr-weight-bold, 700);
  }
  .tp__chip-star,
  .tp__sub-star {
    color: var(--emr-warning, #8a651f);
    display: inline-flex;
  }
  .tp__n {
    color: var(--emr-text-muted, #5c6c78);
    font-weight: var(--emr-weight-regular, 400);
  }
  .tp__chip[aria-pressed="true"] .tp__n {
    color: inherit;
  }
  .tp__sec {
    display: grid;
    gap: 8px;
  }
  .tp__sub {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--emr-text-sm, 0.8125rem);
    font-weight: var(--emr-weight-bold, 700);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--emr-text-muted, #5c6c78);
  }
  .tp__hint {
    margin: 0;
    font-size: var(--emr-text-sm, 0.8125rem);
    color: var(--emr-text-muted, #5c6c78);
  }
  .tp__grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(auto-fill, minmax(min(120px, 100%), 1fr));
  }
  .tp__item {
    position: relative;
    min-width: 0;
    display: grid;
  }
  .tp__tile {
    display: grid;
    grid-template-rows: auto auto 1fr;
    align-content: start;
    gap: 4px;
    width: 100%;
    min-height: max(44px, var(--emr-control-height, 44px));
    padding: 6px;
    text-align: left;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    color: var(--emr-text, #263847);
    font: inherit;
    cursor: pointer;
  }
  .tp__tile:hover {
    background: var(--emr-surface-raised, #eff3f5);
  }
  .tp__tile[aria-disabled="true"] {
    cursor: default;
  }
  .tp__tile[aria-disabled="true"]:hover {
    background: var(--emr-surface, #fffefa);
  }
  .tp__item--sel .tp__tile {
    border-color: var(--emr-primary, #475f70);
    box-shadow: 0 0 0 1px var(--emr-primary, #475f70);
    background: var(--emr-primary-soft, #e3ebef);
  }
  .tp__frame {
    display: block;
    aspect-ratio: 1 / 1;
    background: var(--emr-surface-soft, #f1f4f5);
    border-radius: var(--emr-radius-sm, 6px);
    overflow: hidden;
  }
  .tp__frame img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .tp__label {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    font-size: var(--emr-text-sm, 0.8125rem);
    font-weight: var(--emr-weight-medium, 500);
    line-height: var(--emr-leading-tight, 1.25);
    overflow-wrap: anywhere;
  }
  .tp__badges {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    align-items: flex-start;
    gap: 4px;
  }
  .tp__badge {
    padding: 2px 6px;
    border-radius: 999px;
    background: var(--emr-neutral-soft, #eef2f4);
    color: var(--emr-text, #263847);
    font-size: var(--emr-text-2xs, 0.6875rem);
    font-weight: var(--emr-weight-bold, 700);
    line-height: 1;
  }
  .tp__check {
    position: absolute;
    top: 10px;
    left: 10px;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--emr-primary-soft, #e3ebef);
    color: var(--emr-primary-contrast, #344b5a);
    border: 2px solid var(--emr-primary, #475f70);
    pointer-events: none;
  }
  .tp__star {
    position: absolute;
    top: 2px;
    right: 2px;
    display: grid;
    place-items: center;
    width: 44px;
    min-width: 44px;
    height: 44px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--emr-text, #263847);
    cursor: pointer;
  }
  .tp__star-bg {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--emr-surface, #fffefa);
    border: 1px solid var(--emr-border, #c7d3da);
  }
  .tp__star:hover .tp__star-bg {
    background: var(--emr-surface-raised, #eff3f5);
  }
  .tp__star[aria-pressed="true"] .tp__star-bg {
    color: var(--emr-warning, #8a651f);
    border-color: var(--emr-warning, #8a651f);
    background: var(--emr-warning-soft, #fdf4df);
  }
  .tp__tile:focus-visible,
  .tp__star:focus-visible,
  .tp__chip:focus-visible,
  .tp__close:focus-visible,
  .tp__clear:focus-visible,
  .tp__empty-btn:focus-visible,
  .tp__input:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus, #5f7f92) 70%, transparent);
    outline-offset: 2px;
  }
  .tp__empty {
    display: grid;
    place-items: center;
    gap: 8px;
    min-height: 120px;
    padding: 24px;
    text-align: center;
    color: var(--emr-text-muted, #5c6c78);
  }
  .tp__empty-msg {
    margin: 0;
    font-size: var(--emr-text-md, 0.875rem);
  }
  .tp__empty-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  .tp__empty-btn {
    min-height: max(44px, var(--emr-control-height, 44px));
    min-width: 44px;
    padding: 0 12px;
    border: 1px solid var(--emr-primary-border, #b2c4ce);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    color: var(--emr-primary, #475f70);
    font: inherit;
    font-size: var(--emr-text-sm, 0.8125rem);
    font-weight: var(--emr-weight-bold, 700);
    cursor: pointer;
  }
  .tp__empty-btn:hover {
    background: var(--emr-primary-soft, #e3ebef);
  }
  @container (max-width: 480px) {
    .tp {
      padding: 12px;
    }
    .tp__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @container (max-width: 280px) {
    .tp__grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  :host-context(.emr-print) {
    display: none !important;
  }
  :host-context(.emr-print) .tp {
    display: none !important;
  }
  @media print {
    :host,
    .tp {
      display: none !important;
    }
    .tp__chips {
      max-height: none;
      overflow: visible;
    }
  }
`;

export class EmrImageTemplatePickerElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles, imageTemplatePickerStyles];

  @property({ attribute: false }) model?: ImageTemplatePickerViewModel;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: String }) headingId = '';
  @property({ type: String }) idPrefix = '';
  @property({ attribute: false }) labels?: EmrImageTemplatePickerLabels;

  @state() private activeId: string | null = null;
  private isFocusedWithin = false;
  private refocusStarId?: string;
  private readonly uid = `emr-lit-tpl-${++nextLitPickerId}`;

  private resolvedLabels() {
    return {
      close: this.labels?.close ?? 'Close',
      searchPlaceholder: this.labels?.searchPlaceholder ?? 'Search by name, side or view',
      searchAria: this.labels?.searchAria ?? ((title: string) => `Search ${title}`),
      clearSearch: this.labels?.clearSearch ?? 'Clear search',
      filterAria: this.labels?.filterAria ?? ((title: string) => `Filter ${title}`),
      favourites: this.labels?.favourites ?? 'Favourites',
      all: this.labels?.all ?? 'All',
      allTemplates: this.labels?.allTemplates ?? 'All templates',
      starHint: this.labels?.starHint ?? 'Star a template to pin it here.',
      showAll: this.labels?.showAll ?? 'Show all',
      resetFilters: this.labels?.resetFilters ?? 'Reset filters',
      addFavourite: this.labels?.addFavourite ?? ((label: string) => `Add ${label} to favourites`),
      removeFavourite:
        this.labels?.removeFavourite ?? ((label: string) => `Remove ${label} from favourites`),
    };
  }

  private effectiveReadOnly(m: ImageTemplatePickerViewModel): boolean {
    return Boolean(this.readOnly || m.readOnly);
  }

  private partitioned(m: ImageTemplatePickerViewModel) {
    const byId = new Map(m.options.map((o) => [o.id, o]));
    const favs = (m.favouriteIds ?? []).flatMap((id) => {
      const o = byId.get(id);
      return o ? [o] : [];
    });
    const favSet = new Set(favs.map((o) => o.id));
    const rest = m.options.filter((o) => !favSet.has(o.id));
    return { favs, rest, flat: [...favs, ...rest] };
  }

  private tabStopId(
    flat: readonly ImageTemplateOption[],
    selectedId?: string,
  ): string | undefined {
    const has = (id?: string | null) => (id && flat.some((o) => o.id === id) ? id : undefined);
    return has(this.activeId) ?? has(selectedId) ?? flat[0]?.id;
  }

  private columns(from: HTMLElement): number {
    const tiles = [...(from.closest('ul')?.querySelectorAll<HTMLElement>('.tp__item') ?? [])];
    const top = tiles[0]?.offsetTop;
    const count = tiles.filter((t) => t.offsetTop === top).length;
    return Math.max(1, count || 1);
  }

  private onTileKey(
    event: KeyboardEvent,
    id: string,
    flat: readonly ImageTemplateOption[],
    favCount: number,
  ): void {
    const i = flat.findIndex((o) => o.id === id);
    if (i < 0) return;
    const cols = this.columns(event.currentTarget as HTMLElement);
    let nextIdx: number | null = null;
    switch (event.key) {
      case 'ArrowRight':
        nextIdx = Math.min(i + 1, flat.length - 1);
        break;
      case 'ArrowLeft':
        nextIdx = Math.max(i - 1, 0);
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = flat.length - 1;
        break;
      case 'ArrowDown':
        if (i < favCount) {
          nextIdx =
            i + cols < favCount
              ? i + cols
              : favCount < flat.length
                ? favCount + Math.min(i % cols, flat.length - favCount - 1)
                : i;
        } else {
          nextIdx = i + cols < flat.length ? i + cols : i;
        }
        break;
      case 'ArrowUp':
        if (i >= favCount && i - cols < favCount) {
          nextIdx = favCount
            ? Math.min(
                Math.floor((favCount - 1) / cols) * cols + ((i - favCount) % cols),
                favCount - 1,
              )
            : i;
        } else {
          nextIdx = i - cols >= 0 ? i - cols : i;
        }
        break;
      default:
        return;
    }
    if (nextIdx === null) return;
    event.preventDefault();
    const nextOption = flat[nextIdx];
    if (!nextOption) return;
    this.activeId = nextOption.id;
    const target = [...(this.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tp__tile') ?? [])].find(
      (b) => b.dataset['id'] === nextOption.id,
    );
    target?.focus();
  }

  override updated(): void {
    if (!this.refocusStarId) return;
    const id = this.refocusStarId;
    this.refocusStarId = undefined;
    const starBtn = [...(this.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tp__star') ?? [])].find(
      (b) => b.dataset['star'] === id,
    );
    starBtn?.focus();
  }

  private renderTiles(
    list: readonly ImageTemplateOption[],
    m: ImageTemplatePickerViewModel,
    stopId: string | undefined,
    flat: readonly ImageTemplateOption[],
    favCount: number,
  ): TemplateResult {
    const l = this.resolvedLabels();
    const ro = this.effectiveReadOnly(m);
    const canEditFavs = !ro && Boolean(m.canEditFavourites);
    return html`${repeat(
      list,
      (o) => o.id,
      (o) => {
        const selected = o.id === m.selectedId;
        const isFav = Boolean(m.favouriteIds?.includes(o.id));
        const tileLabel = o.badges?.length ? `${o.label}, ${o.badges.join(', ')}` : o.label;
        return html`<li class=${`tp__item${selected ? ' tp__item--sel' : ''}`}>
          <button
            type="button"
            class="tp__tile"
            data-id=${o.id}
            tabindex=${o.id === stopId ? 0 : -1}
            aria-pressed=${selected ? 'true' : 'false'}
            aria-disabled=${ro ? 'true' : nothing}
            aria-label=${tileLabel}
            @click=${() => {
              if (canSelectImageTemplate(ro, o)) {
                this.emitIntent<ImageTemplatePickerIntent>({ type: 'templateSelected', templateId: o.id });
              }
            }}
            @keydown=${(e: KeyboardEvent) => this.onTileKey(e, o.id, flat, favCount)}
          >
            <span class="tp__frame">
              <img src=${o.imageUrl} alt=${o.altText ?? o.label} loading="lazy" decoding="async" />
            </span>
            <span class="tp__label" title=${o.label}>${o.label}</span>
            ${o.badges?.length
              ? html`<span class="tp__badges">
                  ${o.badges.map((b) => html`<span class="tp__badge">${b}</span>`)}
                </span>`
              : nothing}
          </button>
          ${selected
            ? html`<span class="tp__check" aria-hidden="true">${renderEmrSvgIcon('check', 13)}</span>`
            : nothing}
          ${canEditFavs
            ? html`<button
                type="button"
                class="tp__star"
                data-star=${o.id}
                tabindex=${o.id === stopId ? 0 : -1}
                aria-pressed=${isFav ? 'true' : 'false'}
                aria-label=${isFav ? l.removeFavourite(o.label) : l.addFavourite(o.label)}
                @click=${() => {
                  if (canToggleTemplateFavourite(m, o, this.readOnly)) {
                    this.refocusStarId = o.id;
                    this.emitIntent<ImageTemplatePickerIntent>({
                      type: 'favouriteToggleRequested',
                      templateId: o.id,
                      favourite: !isFav,
                    });
                  }
                }}
              >
                <span class="tp__star-bg">
                  ${renderEmrSvgIcon(isFav ? 'star-filled' : 'star', 16)}
                </span>
              </button>`
            : nothing}
        </li>`;
      },
    )}`;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const l = this.resolvedLabels();
    const ro = this.effectiveReadOnly(m);
    const pickerId = resolveImageTemplatePickerId(this.idPrefix, this.headingId, this.uid);
    const titleId = resolveImageTemplatePickerHeadingId(
      this.idPrefix,
      this.headingId,
      `${this.uid}-heading`,
    );
    const searchId = resolveImageTemplateSearchId(this.idPrefix, this.headingId, this.uid);
    const favSectionId = resolveImageTemplateSectionId('fav', this.idPrefix, this.headingId, this.uid);
    const allSectionId = resolveImageTemplateSectionId('all', this.idPrefix, this.headingId, this.uid);
    const { favs, rest, flat } = this.partitioned(m);
    const stopId = this.tabStopId(flat, m.selectedId);
    const canEditFavs = !ro && Boolean(m.canEditFavourites);
    const showFavChip = Boolean(m.favouriteIds?.length) || canEditFavs;
    const showHint = canEditFavs && !m.favouriteIds?.length;

    return html`<section
      class="tp"
      data-emr-print="hide"
      id=${pickerId}
      aria-labelledby=${titleId}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key !== 'Escape') return;
        e.preventDefault();
        if (m.query) {
          this.emitIntent<ImageTemplatePickerIntent>({ type: 'queryChangeRequested', query: '' });
        } else {
          this.emitIntent<ImageTemplatePickerIntent>({ type: 'closeRequested' });
        }
      }}
      @focusin=${(e: FocusEvent) => {
        if (!this.isFocusedWithin) {
          this.isFocusedWithin = true;
          this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
        }
        const el = e.target as HTMLElement | null;
        if (el?.dataset?.['id']) this.activeId = el.dataset['id'];
        else if (el?.dataset?.['star']) this.activeId = el.dataset['star'];
        if (this.refocusStarId && el?.dataset?.['star'] !== this.refocusStarId) {
          this.refocusStarId = undefined;
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
      <header class="tp__head">
        <div class="tp__title">
          <h3 class="tp__name" id=${titleId}>${m.title}</h3>
          ${m.totalLabel ? html`<p class="tp__total" role="status">${m.totalLabel}</p>` : nothing}
        </div>
        <button
          type="button"
          class="tp__close"
          aria-label=${l.close}
          title=${l.close}
          @click=${() => this.emitIntent<ImageTemplatePickerIntent>({ type: 'closeRequested' })}
        >
          ${renderEmrSvgIcon('close', 18)}
        </button>
      </header>

      <div class="tp__search">
        <label class="emr-sr-only" for=${searchId}>${l.searchAria(m.title)}</label>
        <span class="tp__glass" aria-hidden="true">${renderEmrSvgIcon('search', 18)}</span>
        <input
          class=${`tp__input${m.query ? ' tp__input--clearable' : ''}`}
          type="search"
          autocomplete="off"
          id=${searchId}
          placeholder=${l.searchPlaceholder}
          .value=${live(m.query)}
          @input=${(event: Event) => {
            this.emitIntent<ImageTemplatePickerIntent>({
              type: 'queryChangeRequested',
              query: (event.target as HTMLInputElement).value,
            });
          }}
        />
        ${m.query
          ? html`<button
              type="button"
              class="tp__clear"
              aria-label=${l.clearSearch}
              title=${l.clearSearch}
              @click=${() =>
                this.emitIntent<ImageTemplatePickerIntent>({ type: 'queryChangeRequested', query: '' })}
            >
              ${renderEmrSvgIcon('close', 16)}
            </button>`
          : nothing}
      </div>

      <div class="tp__chips" role="group" aria-label=${l.filterAria(m.title)}>
        ${showFavChip
          ? html`<button
              type="button"
              class="tp__chip"
              aria-pressed=${m.selectedGroupId === FAVOURITES_GROUP_ID ? 'true' : 'false'}
              @click=${() =>
                this.emitIntent<ImageTemplatePickerIntent>({
                  type: 'groupSelected',
                  groupId: FAVOURITES_GROUP_ID,
                })}
            >
              <span class="tp__chip-star" aria-hidden="true">${renderEmrSvgIcon('star-filled', 14)}</span>
              <span>${l.favourites}</span>
              <span class="tp__n">${m.favouriteIds?.length ?? 0}</span>
            </button>`
          : nothing}
        <button
          type="button"
          class="tp__chip"
          aria-pressed=${!m.selectedGroupId ? 'true' : 'false'}
          @click=${() => this.emitIntent<ImageTemplatePickerIntent>({ type: 'groupSelected', groupId: null })}
        >
          ${l.all}
        </button>
        ${m.groups.map(
          (g) => html`<button
            type="button"
            class="tp__chip"
            aria-pressed=${m.selectedGroupId === g.id ? 'true' : 'false'}
            @click=${() =>
              this.emitIntent<ImageTemplatePickerIntent>({ type: 'groupSelected', groupId: g.id })}
          >
            <span>${g.label}</span>
            ${g.count !== undefined ? html`<span class="tp__n">${g.count}</span>` : nothing}
          </button>`,
        )}
      </div>

      ${flat.length
        ? html`
            ${favs.length
              ? html`<div class="tp__sec" role="group" aria-labelledby=${favSectionId}>
                  <h4 class="tp__sub" id=${favSectionId}>
                    <span class="tp__sub-star" aria-hidden="true">${renderEmrSvgIcon('star-filled', 14)}</span>
                    <span>${l.favourites}</span>
                    <span class="tp__n">${favs.length}</span>
                  </h4>
                  <ul class="tp__grid" role="list">
                    ${this.renderTiles(favs, m, stopId, flat, favs.length)}
                  </ul>
                </div>`
              : showHint
                ? html`<p class="tp__hint">${l.starHint}</p>`
                : nothing}
            ${rest.length
              ? html`<div
                  class="tp__sec"
                  role=${favs.length ? 'group' : nothing}
                  aria-labelledby=${favs.length ? allSectionId : nothing}
                >
                  ${favs.length
                    ? html`<h4 class="tp__sub" id=${allSectionId}>
                        <span>${l.allTemplates}</span>
                        <span class="tp__n">${rest.length}</span>
                      </h4>`
                    : nothing}
                  <ul class="tp__grid" role="list">
                    ${this.renderTiles(rest, m, stopId, flat, favs.length)}
                  </ul>
                </div>`
              : nothing}
          `
        : html`<div class="tp__empty" role="status">
            <p class="tp__empty-msg">${m.emptyMessage}</p>
            <div class="tp__empty-actions">
              ${m.query
                ? html`<button
                    type="button"
                    class="tp__empty-btn"
                    @click=${() =>
                      this.emitIntent<ImageTemplatePickerIntent>({
                        type: 'queryChangeRequested',
                        query: '',
                      })}
                  >
                    ${l.clearSearch}
                  </button>`
                : nothing}
              ${m.selectedGroupId
                ? html`<button
                    type="button"
                    class="tp__empty-btn"
                    @click=${() =>
                      this.emitIntent<ImageTemplatePickerIntent>({
                        type: 'groupSelected',
                        groupId: null,
                      })}
                  >
                    ${l.showAll}
                  </button>`
                : nothing}
              ${m.query && m.selectedGroupId
                ? html`<button
                    type="button"
                    class="tp__empty-btn"
                    @click=${() => {
                      this.emitIntent<ImageTemplatePickerIntent>({
                        type: 'queryChangeRequested',
                        query: '',
                      });
                      this.emitIntent<ImageTemplatePickerIntent>({
                        type: 'groupSelected',
                        groupId: null,
                      });
                    }}
                  >
                    ${l.resetFilters}
                  </button>`
                : nothing}
            </div>
          </div>`}
    </section>`;
  }
}

export class EmrTimeAxisElement extends EmrLitElement {
  static override styles = [
    emrShadowStyles,
    l3Styles,
    css`
      :host {
        display: block;
        min-width: 0;
        max-width: 100%;
        color: var(--emr-text, #263847);
        font-family: var(--emr-font-family);
        font-variant-numeric: tabular-nums;
        container-type: inline-size;
      }
      .ta {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 8px;
        min-width: 0;
      }
      .ta__head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px 12px;
        min-width: 0;
      }
      .ta__title {
        margin: 0;
        font-size: var(--emr-text-lg, 1rem);
        line-height: var(--emr-leading-tight, 1.25);
        min-width: 0;
      }
      .ta__controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .ta__step {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 44px;
      }
      .ta__select {
        width: auto;
        min-width: 96px;
        min-height: 44px;
        font-variant-numeric: tabular-nums;
      }
      .ta__steplabel {
        color: var(--emr-text-muted, #5c6c78);
        font-size: var(--emr-text-sm, 0.8125rem);
      }
      .ta__btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-height: 44px;
        height: auto;
        min-width: 44px;
        transition: border-color 150ms ease, transform 100ms ease;
      }
      .ta__btn[aria-disabled="true"] {
        opacity: 0.52;
        cursor: not-allowed;
      }
      .ta__btn[aria-disabled="true"]:hover {
        background: var(--emr-surface, #fffefa);
      }
      .ta__btn[aria-disabled="true"]:active {
        transform: none;
      }
      .ta__empty {
        margin: 0;
        color: var(--emr-text-muted, #5c6c78);
        font-style: italic;
        font-size: var(--emr-text-sm, 0.8125rem);
      }
      .ta__scroll {
        overflow-x: auto;
        max-width: 100%;
        min-width: 0;
        border: 1px solid var(--emr-border, #c7d3da);
        border-radius: 8px;
        background: var(--emr-surface-raised, #eff3f5);
        overscroll-behavior-x: contain;
        -webkit-overflow-scrolling: touch;
      }
      .ta__scroll:focus-visible {
        outline: 3px solid var(--emr-focus, #5f7f92);
        outline-offset: 2px;
      }
      .ta__strip {
        display: flex;
        width: max-content;
        margin: 0;
        padding: 0 0 0 var(--emr-time-axis-lead, 0px);
        list-style: none;
      }
      .ta__tick {
        box-sizing: border-box;
        flex: 0 0 var(--emr-time-axis-col, 5.5rem);
        width: var(--emr-time-axis-col, 5.5rem);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        min-height: 44px;
        padding: 6px;
        border-right: 1px solid var(--emr-border, #c7d3da);
        text-align: center;
        font-size: var(--emr-text-xs, 0.75rem);
        line-height: var(--emr-leading-tight, 1.25);
        font-variant-numeric: tabular-nums;
      }
      .ta__strip > .ta__tick:first-child {
        border-left: 1px solid var(--emr-border, #c7d3da);
      }
      .ta__tick--option {
        cursor: pointer;
      }
      .ta__tick--option:hover {
        background: var(--emr-primary-soft, #e3ebef);
      }
      .ta__tick--option:focus-visible {
        outline: 3px solid var(--emr-focus, #5f7f92);
        outline-offset: -3px;
      }
      .ta__tick--current {
        box-shadow: inset 3px 0 0 var(--emr-primary, #475f70);
        background: var(--emr-primary-soft, #e3ebef);
      }
      .ta__tick--selected {
        box-shadow: inset 0 0 0 2px var(--emr-primary, #475f70);
        background: var(--emr-primary-soft, #e3ebef);
      }
      .ta__tick--current.ta__tick--selected {
        box-shadow: inset 5px 0 0 var(--emr-primary, #475f70), inset 0 0 0 2px var(--emr-primary, #475f70);
      }
      .ta__label {
        font-weight: var(--emr-weight-bold, 700);
        overflow-wrap: anywhere;
      }
      .ta__sub {
        color: var(--emr-text-muted, #5c6c78);
        overflow-wrap: anywhere;
      }
      .ta__tick--current .ta__sub,
      .ta__tick--selected .ta__sub {
        color: var(--emr-text, #263847);
      }
      .ta__now {
        font-size: var(--emr-text-2xs, 0.6875rem);
        font-weight: var(--emr-weight-bold, 700);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--emr-primary, #475f70);
      }
      @container (max-width: 480px) {
        .ta__head {
          flex-direction: column;
          align-items: stretch;
        }
        .ta__controls {
          justify-content: flex-start;
        }
      }
      :host-context(.emr-print) [data-emr-print="hide"],
      :host-context(.emr-print) .ta__controls .emr-btn {
        display: none !important;
      }
      :host-context(.emr-print) .ta,
      :host-context(.emr-print) .ta__tick {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      :host-context(.emr-print) .ta__scroll {
        overflow: visible !important;
        max-width: none !important;
      }
      @media print {
        [data-emr-print="hide"],
        .ta__controls .emr-btn {
          display: none !important;
        }
        .ta,
        .ta__tick {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .ta__scroll {
          overflow: visible !important;
          max-width: none !important;
        }
      }
    `,
  ];

  @property({ attribute: false }) model?: TimeAxisViewModel;
  @property({ type: String }) headingId = '';
  @property({ type: String }) idPrefix = '';
  @property({ attribute: false }) labels?: EmrTimeAxisLabels;

  @state() private focusedId: string | null = null;
  private isFocusedWithin = false;

  private resolvedLabels() {
    return {
      title: this.labels?.title ?? 'Time axis',
      empty: this.labels?.empty ?? 'No times supplied.',
      step: this.labels?.step ?? 'Step',
      stepValue: this.labels?.stepValue ?? ((label: string) => `Step: ${label}`),
      earlier: this.labels?.earlier ?? 'Earlier',
      later: this.labels?.later ?? 'Later',
      current: this.labels?.current ?? 'Current',
      selected: this.labels?.selected ?? 'selected',
    };
  }

  private onStripKeyDown(event: KeyboardEvent): void {
    const m = this.model;
    if (!m || m.readOnly) return;
    const stop = resolveTimeAxisTabStopId(m.ticks, this.focusedId, m.selectedTickId);
    const currentIndex = m.ticks.findIndex((t) => t.id === stop);
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const target = m.ticks[currentIndex];
      if (target && canSelectTimeAxisSlot(m, target.id)) {
        this.emitIntent<TimeAxisIntent>({ type: 'tickSelected', tickId: target.id });
      }
      return;
    }
    const next = resolveTimeAxisNextIndex(event.key, currentIndex, m.ticks.length);
    if (next === null || !m.ticks[next]) return;
    event.preventDefault();
    this.focusedId = m.ticks[next].id;
    const tickEls = [...(this.shadowRoot?.querySelectorAll<HTMLElement>('.ta__tick--option') ?? [])];
    tickEls[next]?.focus();
  }

  private renderTickBody(
    tick: TimeAxisViewModel['ticks'][number],
    currentText: string,
    selectedText: string,
    announceSelectedInText: boolean,
  ): TemplateResult {
    return html`
      <span class="ta__label">${tick.label}</span>
      ${tick.sublabel ? html`<span class="ta__sub">${tick.sublabel}</span>` : nothing}
      ${tick.current ? html`<span class="ta__now">${currentText}</span>` : nothing}
      ${announceSelectedInText ? html`<span class="emr-sr-only">, ${selectedText}</span>` : nothing}
    `;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const l = this.resolvedLabels();
    const axisId = resolveTimeAxisId(m.id, this.idPrefix);
    const titleId = resolveTimeAxisHeadingId(m.id, this.idPrefix, this.headingId);
    const stepSelectId = `${axisId}-step`;
    const tabStop = resolveTimeAxisTabStopId(m.ticks, this.focusedId, m.selectedTickId);
    const canPanEarlier = canPanTimeAxis(m, 'earlier');
    const canPanLater = canPanTimeAxis(m, 'later');

    return html`<section
      class="ta"
      id=${axisId}
      aria-labelledby=${titleId}
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
      <header class="ta__head">
        <h3 class="ta__title ${m.title ? '' : 'emr-sr-only'}" id=${titleId}>${m.title || l.title}</h3>
        <div class="ta__controls">
          ${!m.readOnly && m.steps?.length
            ? html`<label class="ta__step" data-emr-print="hide" for=${stepSelectId}>
                <span class="ta__steplabel">${l.step}</span>
                <select
                  class="emr-control ta__select"
                  id=${stepSelectId}
                  .value=${live(m.selectedStepId ?? '')}
                  @change=${(event: Event) => {
                    const target = event.target as HTMLSelectElement;
                    const stepId = target.value;
                    target.value = this.model?.selectedStepId ?? '';
                    if (this.model && canChangeTimeAxisStep(this.model, stepId)) {
                      this.emitIntent<TimeAxisIntent>({ type: 'stepChangeRequested', stepId });
                    }
                  }}
                >
                  ${m.steps.map(
                    (step) => html`<option value=${step.id} ?selected=${m.selectedStepId === step.id}>${step.label}</option>`,
                  )}
                </select>
              </label>`
            : m.stepLabel
              ? html`<span class="ta__steplabel">${l.stepValue(m.stepLabel)}</span>`
              : nothing}
          ${m.readOnly
            ? nothing
            : html`
                <button
                  type="button"
                  class="emr-btn emr-btn--outline emr-btn--small ta__btn"
                  data-emr-print="hide"
                  aria-label=${l.earlier}
                  aria-disabled=${canPanEarlier ? nothing : 'true'}
                  @click=${() => {
                    if (this.model && canPanTimeAxis(this.model, 'earlier')) {
                      this.emitIntent<TimeAxisIntent>({ type: 'shiftEarlierRequested' });
                    }
                  }}
                >
                  ${renderEmrSvgIcon('chevron-left', 16)}
                  <span>${l.earlier}</span>
                </button>
                <button
                  type="button"
                  class="emr-btn emr-btn--outline emr-btn--small ta__btn"
                  data-emr-print="hide"
                  aria-label=${l.later}
                  aria-disabled=${canPanLater ? nothing : 'true'}
                  @click=${() => {
                    if (this.model && canPanTimeAxis(this.model, 'later')) {
                      this.emitIntent<TimeAxisIntent>({ type: 'shiftLaterRequested' });
                    }
                  }}
                >
                  <span>${l.later}</span>
                  ${renderEmrSvgIcon('chevron-right', 16)}
                </button>
              `}
        </div>
      </header>

      ${!m.ticks.length
        ? html`<p class="ta__empty">${l.empty}</p>`
        : m.readOnly
          ? html`<div class="ta__scroll" data-emr-print="expand" role="region" tabindex="0" aria-labelledby=${titleId}>
              <ol class="ta__strip">
                ${m.ticks.map((tick) => {
                  const sel = tick.id === m.selectedTickId;
                  return html`<li
                    class="ta__tick ${tick.current ? 'ta__tick--current' : ''} ${sel ? 'ta__tick--selected' : ''}"
                    id=${resolveTimeAxisTickId(m.id, tick.id, this.idPrefix)}
                    aria-current=${tick.current ? 'time' : nothing}
                  >
                    ${this.renderTickBody(tick, l.current, l.selected, sel)}
                  </li>`;
                })}
              </ol>
            </div>`
          : html`<div class="ta__scroll" data-emr-print="expand">
              <div
                class="ta__strip"
                role="listbox"
                aria-orientation="horizontal"
                aria-labelledby=${titleId}
                @keydown=${this.onStripKeyDown}
              >
                ${m.ticks.map((tick) => {
                  const sel = tick.id === m.selectedTickId;
                  return html`<div
                    class="ta__tick ta__tick--option ${tick.current ? 'ta__tick--current' : ''} ${sel ? 'ta__tick--selected' : ''}"
                    role="option"
                    id=${resolveTimeAxisTickId(m.id, tick.id, this.idPrefix)}
                    aria-selected=${sel ? 'true' : 'false'}
                    aria-current=${tick.current ? 'time' : nothing}
                    tabindex=${tick.id === tabStop ? 0 : -1}
                    @focus=${() => {
                      this.focusedId = tick.id;
                    }}
                    @click=${() => {
                      if (this.model && canSelectTimeAxisSlot(this.model, tick.id)) {
                        this.emitIntent<TimeAxisIntent>({ type: 'tickSelected', tickId: tick.id });
                      }
                    }}
                  >
                    ${this.renderTickBody(tick, l.current, l.selected, false)}
                  </div>`;
                })}
              </div>
            </div>`}
    </section>`;
  }
}

export class EmrDataTableElement extends EmrLitElement {
  static override styles = [
    emrShadowStyles,
    l3Styles,
    css`
      :host {
        display: block;
        color: var(--emr-text, #263847);
        min-width: 0;
        max-width: 100%;
        container-type: inline-size;
        font-variant-numeric: tabular-nums;
      }
      .dt {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
        font-size: var(--emr-text-md, 0.875rem);
        min-width: 0;
        max-width: 100%;
      }
      .dt__toolbar,
      .dt__bulk,
      .dt__density,
      .dt__nav {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        min-width: 0;
      }
      .dt__filters {
        display: contents;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .dt__filter-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: 1px solid var(--emr-primary-border, #b2c4ce);
        background: var(--emr-primary-soft, #e3ebef);
        border-radius: 999px;
        padding-left: 12px;
        min-height: var(--emr-control-height, 44px);
        font-size: var(--emr-text-sm, 0.8125rem);
      }
      .dt__chip-remove {
        min-width: 44px;
        min-height: var(--emr-control-height, 44px);
        display: inline-grid;
        place-items: center;
        border: 0;
        background: transparent;
        color: var(--emr-text, #263847);
        cursor: pointer;
        border-radius: 999px;
        font: inherit;
      }
      .dt__chip-remove[aria-disabled='true'],
      .dt__sort-btn[aria-disabled='true'],
      .dt__menu-item[aria-disabled='true'],
      .dt button[aria-disabled='true'] {
        opacity: 0.52;
        cursor: not-allowed;
      }
      .dt__chip-remove:focus-visible,
      .dt__sort-btn:focus-visible,
      .dt__row:focus-visible,
      .dt__checkbox:focus-visible,
      .dt__menu-item:focus-visible {
        outline: 3px solid var(--emr-focus, #5f7f92);
        outline-offset: 2px;
      }
      .dt__menu-wrap {
        position: relative;
      }
      .dt__menu {
        position: absolute;
        z-index: 5;
        top: 100%;
        left: 0;
        min-width: 220px;
        margin: 4px 0 0;
        padding: 4px;
        list-style: none;
        background: var(--emr-surface, #fffefa);
        border: 1px solid var(--emr-border, #c7d3da);
        border-radius: 8px;
        box-shadow: var(--emr-shadow, 0 8px 24px rgb(15 23 42 / 0.09));
      }
      .dt__menu-item {
        display: flex;
        align-items: center;
        width: 100%;
        text-align: left;
        min-height: var(--emr-control-height, 44px);
        padding: 0 12px;
        border: 0;
        background: transparent;
        color: var(--emr-text, #263847);
        font: inherit;
        font-size: var(--emr-text-sm, 0.8125rem);
        cursor: pointer;
        border-radius: 6px;
      }
      .dt__menu-item:hover:not([aria-disabled='true']) {
        background: var(--emr-surface-raised, #eff3f5);
      }
      .dt__spacer {
        flex: 1;
      }
      .dt__muted {
        color: var(--emr-text-muted, #5c6c78);
        font-size: var(--emr-text-sm, 0.8125rem);
      }
      .dt__scroll {
        overflow-x: auto;
        max-width: 100%;
        min-width: 0;
        border: 1px solid var(--emr-border, #c7d3da);
        border-radius: 8px;
        background: var(--emr-surface, #fffefa);
      }
      .dt__table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }
      .dt__th {
        position: sticky;
        top: 0;
        z-index: 1;
        background: var(--emr-surface-raised, #eff3f5);
        border-bottom: 2px solid var(--emr-border, #c7d3da);
        padding: 4px 12px;
        font-size: var(--emr-text-sm, 0.8125rem);
        font-weight: var(--emr-weight-bold, 700);
        text-align: left;
        white-space: nowrap;
        color: var(--emr-text, #263847);
      }
      .dt__th--check,
      .dt__td--check {
        width: 52px;
        padding-inline: 4px;
      }
      .dt__td {
        padding: 8px 12px;
        min-height: var(--emr-control-height, 44px);
        border-bottom: 1px solid var(--emr-border, #c7d3da);
        font-size: var(--emr-text-md, 0.875rem);
        text-align: left;
        vertical-align: middle;
      }
      .dt--compact .dt__th {
        padding: 2px 10px;
      }
      .dt--compact .dt__td {
        padding: 4px 10px;
        font-size: var(--emr-text-sm, 0.8125rem);
      }
      .dt__cell--end {
        text-align: right;
      }
      .dt__cell--center {
        text-align: center;
      }
      .dt__cell-wrap {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .dt__sort-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font: inherit;
        font-weight: var(--emr-weight-bold, 700);
        color: var(--emr-text, #263847);
        min-height: var(--emr-control-height, 44px);
        min-width: 44px;
        padding: 0 6px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        cursor: pointer;
      }
      .dt__sort-btn:hover:not([aria-disabled='true']) {
        background: var(--emr-surface-soft, #f1f4f5);
      }
      .dt__row {
        cursor: pointer;
      }
      .dt__row:hover:not(.dt__row--skeleton) {
        background: var(--emr-surface-soft, #f1f4f5);
      }
      .dt__row--selected {
        background: var(--emr-primary-soft, #e3ebef);
      }
      .dt__row--skeleton {
        cursor: default;
      }
      .dt__check-hit {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 44px;
        min-height: var(--emr-control-height, 44px);
        cursor: pointer;
      }
      .dt__check-hit[data-disabled='true'] {
        cursor: not-allowed;
        opacity: 0.55;
      }
      .dt__checkbox {
        width: 20px;
        height: 20px;
        margin: 0;
        cursor: inherit;
        accent-color: var(--emr-primary, #475f70);
      }
      .dt__skeleton {
        display: block;
        height: 14px;
        width: 72%;
        border-radius: 4px;
        background: var(--emr-neutral-soft, #e8eef1);
      }
      .dt__skeleton--check {
        width: 20px;
        height: 20px;
        margin-inline: auto;
      }
      .dt__state {
        padding: 24px;
        text-align: center;
        display: grid;
        gap: 8px;
        justify-items: center;
      }
      .dt__page-size {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        font-size: var(--emr-text-sm, 0.8125rem);
      }
      .dt__select {
        width: auto;
        min-width: 72px;
        min-height: var(--emr-control-height, 44px);
      }
      .dt__page-status {
        font-size: var(--emr-text-sm, 0.8125rem);
      }
      .dt .emr-btn {
        min-height: var(--emr-control-height, 44px);
        min-width: 44px;
      }
      .dt button[aria-pressed='true'] {
        background: var(--emr-primary-soft, #e3ebef);
        border-color: var(--emr-primary-border, #b2c4ce);
        font-weight: var(--emr-weight-bold, 700);
      }
      @container (max-width: 560px) {
        .dt__spacer {
          display: none;
        }
        .dt__toolbar,
        .dt__nav {
          gap: 6px;
        }
      }
      @container (max-width: 400px) {
        .dt__toolbar {
          position: relative;
        }
        .dt__menu-wrap {
          position: static;
        }
        .dt__menu {
          left: 0;
          right: auto;
          top: calc(100% + 4px);
          min-width: 0;
          width: min(220px, 100%);
          max-width: 100%;
          margin-top: 0;
        }
      }
      :host-context(.emr-print) [data-emr-print='hide'],
      :host-context(.emr-print) .dt__th--check,
      :host-context(.emr-print) .dt__td--check {
        display: none !important;
      }
      :host-context(.emr-print) .dt__scroll {
        overflow: visible !important;
        max-height: none !important;
      }
      :host-context(.emr-print) .dt__row {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      :host-context(.emr-print) thead {
        display: table-header-group;
      }
      @media print {
        [data-emr-print='hide'],
        .dt__th--check,
        .dt__td--check {
          display: none !important;
        }
        .dt__scroll {
          overflow: visible !important;
          max-height: none !important;
        }
        .dt__row {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        thead {
          display: table-header-group;
        }
      }
    `,
  ];

  @property({ attribute: false }) model?: EmrDataTableModel;
  @property({ type: String }) headingId = '';
  @property({ type: String }) idPrefix = '';
  @property({ attribute: false }) labels?: Partial<EmrDataTableLabels>;

  @state() private menuOpen = false;
  @state() private activeIndex = 0;

  private isFocusedWithin = false;
  private pendingMenuFocusIndex: number | null = null;

  private readonly handleDocumentPointerDown = (event: Event): void => {
    if (!this.menuOpen) return;
    if (!event.composedPath().includes(this)) {
      this.menuOpen = false;
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', this.handleDocumentPointerDown);
    }
  }

  override disconnectedCallback(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
    }
    super.disconnectedCallback();
  }

  override updated(): void {
    if (this.menuOpen && this.pendingMenuFocusIndex !== null) {
      const idx = this.pendingMenuFocusIndex;
      this.pendingMenuFocusIndex = null;
      const items = [...(this.shadowRoot?.querySelectorAll<HTMLButtonElement>('.dt__menu-item') ?? [])];
      items[idx]?.focus();
    }
  }

  private resolvedLabels(): Required<EmrDataTableLabels> {
    return {
      selectAll: this.labels?.selectAll ?? 'Select all rows on this page',
      selectRow: this.labels?.selectRow ?? 'Select row',
      filters: this.labels?.filters ?? 'Active filters',
      removeFilter: this.labels?.removeFilter ?? 'Remove filter',
      addFilter: this.labels?.addFilter ?? 'Add filter',
      savedFilters: this.labels?.savedFilters ?? 'Saved filters',
      saveFilter: this.labels?.saveFilter ?? 'Save current filter',
      exportCsv: this.labels?.exportCsv ?? 'Export CSV',
      density: this.labels?.density ?? 'Row density',
      comfortable: this.labels?.comfortable ?? 'Comfortable',
      compact: this.labels?.compact ?? 'Compact',
      bulkActions: this.labels?.bulkActions ?? 'Bulk actions',
      selectedCount: this.labels?.selectedCount ?? '{count} selected',
      sortedAscending: this.labels?.sortedAscending ?? 'sorted ascending',
      sortedDescending: this.labels?.sortedDescending ?? 'sorted descending',
      sortBy: this.labels?.sortBy ?? 'Sort by',
      previous: this.labels?.previous ?? 'Previous',
      next: this.labels?.next ?? 'Next',
      rowsPerPage: this.labels?.rowsPerPage ?? 'Rows per page',
      pageOf: this.labels?.pageOf ?? 'Page {page} of {pageCount}',
      loading: this.labels?.loading ?? 'Loading rows',
      emptyTitle: this.labels?.emptyTitle ?? 'No rows to show',
      emptyMessage: this.labels?.emptyMessage ?? 'Try removing a filter.',
      errorTitle: this.labels?.errorTitle ?? 'Could not load rows',
      retry: this.labels?.retry ?? 'Retry',
      nativeUnavailable: this.labels?.nativeUnavailable ?? 'This table is available on the web app.',
    };
  }

  private changeSort(columnId: string): void {
    const m = this.model;
    if (!m || !canSortDataTableColumn(m, columnId)) return;
    const direction = nextDataTableSortDirection(m.sort, columnId);
    this.emitIntent<EmrDataTableIntent>({ type: 'sortChanged', columnId, direction });
  }

  private toggleRow(rowId: string): void {
    const m = this.model;
    if (!m || !canSelectDataTableRows(m)) return;
    if (!m.rows.some((row) => row.id === rowId)) return;
    const next = toggleDataTableRowSelection(m.selectedIds, rowId);
    this.emitIntent<EmrDataTableIntent>({ type: 'selectionChanged', selectedIds: next });
  }

  private toggleAll(): void {
    const m = this.model;
    if (!m || !canSelectDataTableRows(m)) return;
    const pageIds = m.rows.map((r) => r.id);
    const next = toggleAllDataTableSelection(pageIds, m.selectedIds);
    this.emitIntent<EmrDataTableIntent>({ type: 'selectionChanged', selectedIds: next });
  }

  private changePage(delta: -1 | 1): void {
    const m = this.model;
    if (!m) return;
    const page = m.page + delta;
    if (canChangeDataTablePage(m, page)) {
      this.emitIntent<EmrDataTableIntent>({ type: 'pageChanged', page });
    }
  }

  private onMenuTriggerKeydown(event: KeyboardEvent, itemCount: number): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const targetIdx = event.key === 'ArrowUp' ? Math.max(0, itemCount - 1) : 0;
      if (this.menuOpen) {
        const items = [...(this.shadowRoot?.querySelectorAll<HTMLButtonElement>('.dt__menu-item') ?? [])];
        items[targetIdx]?.focus();
      } else {
        this.pendingMenuFocusIndex = targetIdx;
        this.menuOpen = true;
      }
    } else if (event.key === 'Escape' && this.menuOpen) {
      event.preventDefault();
      event.stopPropagation();
      this.menuOpen = false;
    }
  }

  private onMenuItemKeydown(event: KeyboardEvent, index: number, count: number): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.menuOpen = false;
      this.shadowRoot?.querySelector<HTMLButtonElement>('.dt__menu-trigger')?.focus();
      return;
    }
    if (event.key === 'Tab') {
      this.menuOpen = false;
      return;
    }
    let nextIdx: number | null = null;
    if (event.key === 'ArrowDown') nextIdx = (index + 1) % count;
    else if (event.key === 'ArrowUp') nextIdx = (index - 1 + count) % count;
    else if (event.key === 'Home') nextIdx = 0;
    else if (event.key === 'End') nextIdx = count - 1;
    if (nextIdx === null) return;
    event.preventDefault();
    const items = [...(this.shadowRoot?.querySelectorAll<HTMLButtonElement>('.dt__menu-item') ?? [])];
    items[nextIdx]?.focus();
  }

  private onRowKeydown(event: KeyboardEvent, index: number, rowId: string): void {
    if (event.target !== event.currentTarget) return;
    const m = this.model;
    if (!m) return;
    if (event.key === ' ') {
      event.preventDefault();
      this.toggleRow(rowId);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.emitIntent<EmrDataTableIntent>({ type: 'rowActivated', id: rowId });
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = nextDataTableRowIndex(index, m.rows.length, event.key);
    this.activeIndex = next;
    const rows = [...(this.shadowRoot?.querySelectorAll<HTMLTableRowElement>('tbody tr.dt__row') ?? [])];
    rows[next]?.focus();
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const l = this.resolvedLabels();
    const tableId = resolveDataTableId(this.idPrefix);
    const captionId = resolveDataTableHeadingId(this.idPrefix, this.headingId, tableId);
    const menuId = `${tableId}-saved-menu`;
    const isLoading = m.status === 'loading';
    const isError = m.status === 'error';
    const compact = m.density === 'compact';
    const canSelectRows = canSelectDataTableRows(m);
    const canEditFilters = canMutateDataTableFilters(m);
    const canSaveFilters = canMutateDataTableSavedFilter(m);
    const canBulkAction = canTriggerDataTableBulkAction(m);
    const canPrev = canChangeDataTablePage(m, m.page - 1);
    const canNext = canChangeDataTablePage(m, m.page + 1);
    const pageIds = m.rows.map((r) => r.id);
    const allState = selectAllDataTableState(pageIds, m.selectedIds);
    const activeRow = m.rows.length > 0 ? Math.min(Math.max(this.activeIndex, 0), m.rows.length - 1) : 0;
    const menuCount = m.savedFilters.length + 1;
    const pageOfText = l.pageOf
      .replace('{page}', String(m.page))
      .replace('{pageCount}', String(m.pageCount));

    return html`<div
      class="dt ${compact ? 'dt--compact' : ''}"
      id=${tableId}
      data-density=${m.density}
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
          this.menuOpen = false;
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }
      }}
    >
      <div class="dt__toolbar" data-emr-print="hide">
        <ul class="dt__filters" aria-label=${l.filters}>
          ${m.filters.map(
            (filter) => html`<li class="dt__filter-chip">
              <span><strong>${filter.label}:</strong> ${filter.valueLabel}</span>
              <button
                type="button"
                class="dt__chip-remove"
                aria-label=${`${l.removeFilter}: ${filter.label} ${filter.valueLabel}`}
                aria-disabled=${!canEditFilters ? 'true' : nothing}
                @click=${() => {
                  if (this.model && canMutateDataTableFilters(this.model)) {
                    this.emitIntent<EmrDataTableIntent>({ type: 'filterRemoved', id: filter.id });
                  }
                }}
              >
                ${renderEmrSvgIcon('close', 14)}
              </button>
            </li>`,
          )}
        </ul>
        <button
          type="button"
          class="emr-btn emr-btn--outline emr-btn--small"
          aria-disabled=${!canEditFilters ? 'true' : nothing}
          @click=${() => {
            if (this.model && canMutateDataTableFilters(this.model)) {
              this.emitIntent<EmrDataTableIntent>({ type: 'filterAddRequested' });
            }
          }}
        >${l.addFilter}</button>
        <div
          class="dt__menu-wrap"
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.menuOpen) {
              e.stopPropagation();
              this.menuOpen = false;
              this.shadowRoot?.querySelector<HTMLButtonElement>('.dt__menu-trigger')?.focus();
            }
          }}
        >
          <button
            type="button"
            class="emr-btn emr-btn--outline emr-btn--small dt__menu-trigger"
            aria-haspopup="menu"
            aria-expanded=${this.menuOpen ? 'true' : 'false'}
            aria-controls=${menuId}
            @click=${() => {
              this.menuOpen = !this.menuOpen;
            }}
            @keydown=${(e: KeyboardEvent) => this.onMenuTriggerKeydown(e, menuCount)}
          >${l.savedFilters}</button>
          ${this.menuOpen
            ? html`<ul role="menu" id=${menuId} class="dt__menu" aria-label=${l.savedFilters}>
                ${m.savedFilters.map(
                  (sf, idx) => html`<li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      class="dt__menu-item"
                      @click=${() => {
                        this.menuOpen = false;
                        this.emitIntent<EmrDataTableIntent>({ type: 'savedFilterSelected', id: sf.id });
                      }}
                      @keydown=${(e: KeyboardEvent) => this.onMenuItemKeydown(e, idx, menuCount)}
                    >${sf.label}</button>
                  </li>`,
                )}
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    class="dt__menu-item"
                    aria-disabled=${!canSaveFilters ? 'true' : nothing}
                    @click=${() => {
                      if (!this.model || !canMutateDataTableSavedFilter(this.model)) return;
                      this.menuOpen = false;
                      this.emitIntent<EmrDataTableIntent>({ type: 'saveFilterRequested' });
                    }}
                    @keydown=${(e: KeyboardEvent) => this.onMenuItemKeydown(e, m.savedFilters.length, menuCount)}
                  >${l.saveFilter}</button>
                </li>
              </ul>`
            : nothing}
        </div>
      </div>

      <div class="dt__toolbar" data-emr-print="hide">
        <div role="group" class="dt__bulk" aria-label=${l.bulkActions}>
          ${m.bulkActions.map(
            (action) => html`<button
              type="button"
              class="emr-btn emr-btn--outline emr-btn--small"
              aria-disabled=${!canBulkAction ? 'true' : nothing}
              @click=${() => {
                if (this.model && canTriggerDataTableBulkAction(this.model)) {
                  this.emitIntent<EmrDataTableIntent>({ type: 'bulkActionRequested', id: action.id });
                }
              }}
            >${action.label}</button>`,
          )}
          ${m.selectedIds.length
            ? html`<span role="status" class="dt__muted">${l.selectedCount.replace('{count}', String(m.selectedIds.length))}</span>`
            : nothing}
        </div>
        <div class="dt__spacer"></div>
        <button
          type="button"
          class="emr-btn emr-btn--outline emr-btn--small"
          @click=${() => this.emitIntent<EmrDataTableIntent>({ type: 'exportRequested', format: 'csv' })}
        >${l.exportCsv}</button>
        <div role="group" class="dt__density" aria-label=${l.density}>
          <button
            type="button"
            class="emr-btn emr-btn--outline emr-btn--small"
            aria-pressed=${!compact ? 'true' : 'false'}
            @click=${() => this.emitIntent<EmrDataTableIntent>({ type: 'densityChanged', density: 'comfortable' })}
          >${l.comfortable}</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline emr-btn--small"
            aria-pressed=${compact ? 'true' : 'false'}
            @click=${() => this.emitIntent<EmrDataTableIntent>({ type: 'densityChanged', density: 'compact' })}
          >${l.compact}</button>
        </div>
      </div>

      <div class="dt__scroll" aria-busy=${isLoading ? 'true' : 'false'}>
        <table class="dt__table" aria-labelledby=${captionId}>
          <caption class="emr-sr-only" id=${captionId}>${m.caption}</caption>
          <thead>
            <tr>
              <th scope="col" class="dt__th dt__th--check">
                <label class="dt__check-hit" data-disabled=${!canSelectRows ? 'true' : nothing}>
                  <input
                    type="checkbox"
                    class="dt__checkbox"
                    aria-label=${l.selectAll}
                    aria-disabled=${!canSelectRows ? 'true' : nothing}
                    .checked=${live(allState === 'all')}
                    .indeterminate=${live(allState === 'some')}
                    aria-checked=${allState === 'some' ? 'mixed' : allState === 'all' ? 'true' : 'false'}
                    @click=${(event: MouseEvent) => {
                      event.stopPropagation();
                      if (!canSelectRows) event.preventDefault();
                    }}
                    @change=${(event: Event) => {
                      const target = event.target as HTMLInputElement;
                      if (!this.model || !canSelectDataTableRows(this.model)) {
                        target.checked = allState === 'all';
                        return;
                      }
                      this.toggleAll();
                    }}
                  />
                </label>
              </th>
              ${m.columns.map((col) => {
                const dir = m.sort?.columnId === col.id ? m.sort.direction : undefined;
                const colWidth = resolveDataTableColumnWidth(col.width);
                const sortInert = isLoading || isError;
                const iconName: EmrLitIconName =
                  dir === 'asc' ? 'chevron-up' : dir === 'desc' ? 'chevron-down' : 'chevrons-up-down';
                return html`<th
                  scope="col"
                  class="dt__th ${col.align === 'end' ? 'dt__cell--end' : col.align === 'center' ? 'dt__cell--center' : ''}"
                  style=${colWidth ? `width: ${colWidth}` : nothing}
                  aria-sort=${col.sortable ? (dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none') : nothing}
                >
                  ${col.sortable
                    ? html`<button
                        type="button"
                        class="dt__sort-btn"
                        aria-disabled=${sortInert ? 'true' : nothing}
                        @click=${() => this.changeSort(col.id)}
                      >
                        <span class="emr-sr-only">${l.sortBy} </span>
                        <span>${col.label}</span>
                        ${renderEmrSvgIcon(iconName, 15)}
                        ${dir
                          ? html`<span class="emr-sr-only">, ${dir === 'asc' ? l.sortedAscending : l.sortedDescending}</span>`
                          : nothing}
                      </button>`
                    : col.label}
                </th>`;
              })}
            </tr>
          </thead>
          <tbody>
            ${isLoading
              ? [0, 1, 2, 3, 4].map(
                  () => html`<tr class="dt__row dt__row--skeleton" aria-hidden="true">
                    <td class="dt__td dt__td--check">
                      <span class="dt__skeleton dt__skeleton--check"></span>
                    </td>
                    ${m.columns.map(
                      () => html`<td class="dt__td"><span class="dt__skeleton"></span></td>`,
                    )}
                  </tr>`,
                )
              : isError
                ? nothing
                : repeat(
                    m.rows,
                    (row) => row.id,
                    (row, index) => {
                      const selected = m.selectedIds.includes(row.id);
                      return html`<tr
                        class="dt__row ${selected ? 'dt__row--selected' : ''}"
                        tabindex=${index === activeRow ? 0 : -1}
                        @focus=${() => {
                          this.activeIndex = index;
                        }}
                        @keydown=${(e: KeyboardEvent) => this.onRowKeydown(e, index, row.id)}
                        @click=${(e: MouseEvent) => {
                          const target = e.target as HTMLElement | null;
                          if (target?.closest('input,button,label')) return;
                          this.emitIntent<EmrDataTableIntent>({ type: 'rowActivated', id: row.id });
                        }}
                      >
                        <td class="dt__td dt__td--check">
                          <label class="dt__check-hit" data-disabled=${!canSelectRows ? 'true' : nothing}>
                            <input
                              type="checkbox"
                              class="dt__checkbox"
                              aria-label=${`${l.selectRow} ${index + 1}`}
                              aria-disabled=${!canSelectRows ? 'true' : nothing}
                              .checked=${live(selected)}
                              @click=${(event: MouseEvent) => {
                                event.stopPropagation();
                                if (!canSelectRows) event.preventDefault();
                              }}
                              @change=${(event: Event) => {
                                const target = event.target as HTMLInputElement;
                                if (!this.model || !canSelectDataTableRows(this.model)) {
                                  target.checked = selected;
                                  return;
                                }
                                target.checked = this.model.selectedIds.includes(row.id);
                                this.toggleRow(row.id);
                              }}
                            />
                          </label>
                        </td>
                        ${m.columns.map((col) => {
                          const cell = row.cells[col.id];
                          const alignClass =
                            col.align === 'end'
                              ? 'dt__cell--end'
                              : col.align === 'center'
                                ? 'dt__cell--center'
                                : '';
                          if (cell === undefined) return html`<td class="dt__td ${alignClass}"></td>`;
                          if (typeof cell === 'string') return html`<td class="dt__td ${alignClass}">${cell}</td>`;
                          return html`<td class="dt__td ${alignClass}">
                            <span class="dt__cell-wrap">
                              ${cell.text ? html`<span>${cell.text}</span>` : nothing}
                              ${cell.badge ? html`<emr-badge .badge=${cell.badge}></emr-badge>` : nothing}
                            </span>
                          </td>`;
                        })}
                      </tr>`;
                    },
                  )}
          </tbody>
        </table>
        ${isLoading
          ? html`<div role="status" class="emr-sr-only">${l.loading}</div>`
          : isError
            ? html`<div role="alert" class="dt__state">
                <strong>${l.errorTitle}</strong>
                ${m.error ? html`<span class="dt__muted">${m.error}</span>` : nothing}
                <button
                  type="button"
                  class="emr-btn emr-btn--outline emr-btn--small"
                  @click=${() => this.emitIntent<EmrDataTableIntent>({ type: 'retryRequested' })}
                >${l.retry}</button>
              </div>`
            : m.rows.length === 0
              ? html`<div role="status" class="dt__state">
                  <strong>${l.emptyTitle}</strong>
                  <span class="dt__muted">${l.emptyMessage}</span>
                </div>`
              : nothing}
      </div>

      <nav class="dt__nav" data-emr-print="hide" aria-label=${m.caption}>
        <span class="dt__muted" role="status">${m.summaryLabel}</span>
        <div class="dt__spacer"></div>
        ${m.pageSizeOptions.length
          ? html`<label class="dt__page-size" for=${`${tableId}-ps`}>
              <span>${l.rowsPerPage}</span>
              <select
                class="emr-control dt__select"
                id=${`${tableId}-ps`}
                .value=${live(String(m.pageSize))}
                aria-disabled=${isLoading || isError ? 'true' : nothing}
                @change=${(event: Event) => {
                  const target = event.target as HTMLSelectElement;
                  const pageSize = Number(target.value);
                  target.value = String(this.model?.pageSize ?? '');
                  if (this.model && canChangeDataTablePageSize(this.model, pageSize)) {
                    this.emitIntent<EmrDataTableIntent>({ type: 'pageSizeChanged', pageSize });
                  }
                }}
              >
                ${m.pageSizeOptions.map(
                  (size) => html`<option value=${size} ?selected=${size === m.pageSize}>${size}</option>`,
                )}
              </select>
            </label>`
          : nothing}
        <button
          type="button"
          class="emr-btn emr-btn--outline emr-btn--small"
          aria-disabled=${!canPrev ? 'true' : nothing}
          @click=${() => this.changePage(-1)}
        >${l.previous}</button>
        <span class="dt__page-status" role="status" aria-live="polite">${pageOfText}</span>
        <button
          type="button"
          class="emr-btn emr-btn--outline emr-btn--small"
          aria-disabled=${!canNext ? 'true' : nothing}
          @click=${() => this.changePage(1)}
        >${l.next}</button>
      </nav>
    </div>`;
  }
}

export class EmrClinicalCellRendererElement extends EmrLitElement {
  static override styles = [
    emrShadowStyles,
    l3Styles,
    css`
      :host {
        display: block;
        min-width: 0;
      }
      button,
      a,
      .emr-btn {
        min-height: var(--emr-control-height, 44px);
        min-width: 44px;
      }
    `,
  ];
  @property({ type: String }) columnId = '';
  @property({ attribute: false }) cellModel?: EmrClinicalCellRenderContext;
  @property({ attribute: false }) renderer?: (context: EmrClinicalCellRenderContext) => EmrCustomRendererResult;

  override render() {
    if (!this.renderer || !this.cellModel) return html`<slot></slot>`;
    const ctx: EmrClinicalCellRenderContext = {
      ...this.cellModel,
      readOnly: this.cellModel.readOnly || !!this.cellModel.cell?.readOnly || !!this.cellModel.cell?.disabled,
      emit: (action, payload) => {
        const current = this.cellModel;
        if (current && !current.readOnly && !current.cell?.readOnly && !current.cell?.disabled) {
          current.emit(action, payload);
        }
      },
    };
    return this.renderer(ctx);
  }
}

import { registerL3WorkstationElements } from './l3-workstation.js';
export * from './l3-workstation.js';

export function registerL3Elements(): void {
  registerL2Elements();
  defineEmrElement('emr-section-card', EmrSectionCardElement);
  defineEmrElement('emr-repeatable-group', EmrRepeatableGroupElement);
  defineEmrElement('emr-clinical-form', EmrClinicalFormElement);
  defineEmrElement('emr-clinical-list', EmrClinicalListElement);
  defineEmrElement('emr-clinical-matrix', EmrClinicalMatrixElement);
  defineEmrElement('emr-annotation-toolbar', EmrAnnotationToolbarElement);
  defineEmrElement('emr-annotation-list', EmrAnnotationListElement);
  defineEmrElement('emr-image-template-picker', EmrImageTemplatePickerElement);
  defineEmrElement('emr-time-axis', EmrTimeAxisElement);
  defineEmrElement('emr-data-table', EmrDataTableElement);
  defineEmrElement('emr-clinical-cell-renderer', EmrClinicalCellRendererElement);
  registerL3WorkstationElements();
}
