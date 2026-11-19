import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChildren,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  ClinicalAssessmentStatus,
  ClinicalCellState,
  ClinicalColumn,
  ClinicalMatrixIntent,
  ClinicalMatrixSchema,
  ClinicalMatrixValues,
  ClinicalRow,
} from '@drguptavivek/emr-controller';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';
import {
  canMutateMatrixCell,
  canMutateMatrixRemark,
  formatMatrixCellValue,
  groupMatrixColumns,
  isMatrixCellApplicable,
  isMatrixQuantity,
  parseMatrixPresetValue,
  resolveMatrixDecimalStep,
  resolveMatrixDomId,
  resolveMatrixHeadingId,
  resolveMatrixQuantityUnit,
} from './emr-clinical-matrix.logic';

export interface ClinicalCellRendererContext {
  row: ClinicalRow;
  column: ClinicalColumn;
  cell?: ClinicalCellState;
  readOnly: boolean;
  emit: (action: string, payload?: unknown) => void;
}

@Directive({ selector: 'ng-template[emrClinicalCellRenderer]', standalone: true })
export class EmrClinicalCellRendererDirective {
  readonly key = input<string>('', { alias: 'emrClinicalCellRenderer' });
  constructor(readonly template: TemplateRef<{ $implicit: ClinicalCellRendererContext }>) {}
}

@Component({
  selector: 'emr-clinical-matrix',
  standalone: true,
  imports: [NgTemplateOutlet, EmrBadgeComponent],
  host: {
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    <section class="emr-matrix" [attr.aria-labelledby]="resolvedHeadingId()">
      <header class="emr-matrix__header">
        <h2 class="emr-matrix__title" [id]="resolvedHeadingId()">{{ definition().label }}</h2>
        @if (definition().description) {
          <p class="emr-matrix__description">{{ definition().description }}</p>
        }
      </header>
      <ng-template #cellTemplate let-row="row" let-column="column" let-surface="surface">
        @if (!isApplicable(row, column.id)) {
          <div class="emr-matrix__na"><span aria-hidden="true">—</span><span class="emr-sr-only">Not applicable</span></div>
        } @else {
          @let cell = cellFor(row.id, column.id);
          @let locked = isCellLocked(cell);
          @let controlId = cellControlId(row.id, column.id, surface);
          @let describedBy = cellDescribedBy(row.id, column.id, cell, surface);
          <div class="emr-matrix__cell" [class.emr-matrix__cell--modified]="!!cell?.modified">
            @if (cell?.modified) {
              <span class="emr-sr-only">Modified</span>
            }
            @if (row.type === 'custom') {
              @if (rendererFor(row.customRendererKey); as renderer) {
                <ng-container *ngTemplateOutlet="renderer; context: customContext(row, column, cell)" />
              } @else {
                <div class="emr-matrix__na" role="status">Custom renderer unavailable</div>
              }
            } @else if (locked) {
              @if (row.type === 'multiline') {
                <textarea
                  class="emr-control emr-control--readonly"
                  rows="2"
                  readonly
                  aria-readonly="true"
                  [attr.id]="controlId"
                  [value]="formatValue(cell?.value)"
                  [attr.aria-label]="row.label + ', ' + column.label"
                  [attr.aria-invalid]="!!cell?.error || null"
                  [attr.aria-describedby]="describedBy"
                  (focus)="focus(row.id, column.id)"
                ></textarea>
              } @else {
                <input
                  class="emr-control emr-control--readonly"
                  type="text"
                  readonly
                  aria-readonly="true"
                  [attr.id]="controlId"
                  [value]="formatValue(cell?.value)"
                  [attr.aria-label]="row.label + ', ' + column.label"
                  [attr.aria-invalid]="!!cell?.error || null"
                  [attr.aria-describedby]="describedBy"
                  (focus)="focus(row.id, column.id)"
                />
              }
            } @else {
              @switch (row.type) {
                @case ('select') {
                  <select
                    class="emr-select"
                    [attr.id]="controlId"
                    [value]="primitiveValue(cell)"
                    [required]="!!row.required"
                    [attr.aria-required]="row.required ? 'true' : null"
                    [attr.aria-label]="row.label + ', ' + column.label"
                    [attr.aria-invalid]="!!cell?.error || null"
                    [attr.aria-describedby]="describedBy"
                    (focus)="focus(row.id, column.id)"
                    (change)="selectChanged(row, column, $event)"
                  >
                    <option value="" [selected]="primitiveValue(cell) === ''">{{ row.placeholder || 'Select' }}</option>
                    @for (option of row.options ?? []; track option.value) {
                      <option [value]="option.value" [selected]="option.value === primitiveValue(cell)" [disabled]="!!option.disabled">{{ option.label }}</option>
                    }
                  </select>
                }
                @case ('boolean') {
                  <select
                    class="emr-select"
                    [attr.id]="controlId"
                    [value]="booleanValue(cell)"
                    [required]="!!row.required"
                    [attr.aria-required]="row.required ? 'true' : null"
                    [attr.aria-label]="row.label + ', ' + column.label"
                    [attr.aria-invalid]="!!cell?.error || null"
                    [attr.aria-describedby]="describedBy"
                    (focus)="focus(row.id, column.id)"
                    (change)="booleanChanged(row, column, $event)"
                  >
                    <option value="" [selected]="booleanValue(cell) === ''">Not recorded</option>
                    <option value="true" [selected]="booleanValue(cell) === 'true'">Yes</option>
                    <option value="false" [selected]="booleanValue(cell) === 'false'">No</option>
                  </select>
                }
                @case ('integer') {
                  <input
                    class="emr-control"
                    type="number"
                    inputmode="numeric"
                    [attr.id]="controlId"
                    [attr.min]="row.min ?? null"
                    [attr.max]="row.max ?? null"
                    [attr.step]="decimalStep(row)"
                    [attr.placeholder]="row.placeholder ?? null"
                    [required]="!!row.required"
                    [attr.aria-required]="row.required ? 'true' : null"
                    [value]="primitiveValue(cell)"
                    [attr.aria-label]="row.label + ', ' + column.label"
                    [attr.aria-invalid]="!!cell?.error || null"
                    [attr.data-warning]="!cell?.error && !!cell?.warning ? 'true' : null"
                    [attr.aria-describedby]="describedBy"
                    (focus)="focus(row.id, column.id)"
                    (input)="numberChanged(row, column, $event)"
                  />
                }
                @case ('decimal') {
                  <input
                    class="emr-control"
                    type="number"
                    inputmode="decimal"
                    [attr.id]="controlId"
                    [attr.min]="row.min ?? null"
                    [attr.max]="row.max ?? null"
                    [attr.step]="decimalStep(row)"
                    [attr.placeholder]="row.placeholder ?? null"
                    [required]="!!row.required"
                    [attr.aria-required]="row.required ? 'true' : null"
                    [value]="primitiveValue(cell)"
                    [attr.aria-label]="row.label + ', ' + column.label"
                    [attr.aria-invalid]="!!cell?.error || null"
                    [attr.data-warning]="!cell?.error && !!cell?.warning ? 'true' : null"
                    [attr.aria-describedby]="describedBy"
                    (focus)="focus(row.id, column.id)"
                    (input)="numberChanged(row, column, $event)"
                  />
                }
                @case ('date') {
                  <input
                    class="emr-control"
                    type="date"
                    [attr.id]="controlId"
                    [attr.min]="row.minDate ?? null"
                    [attr.max]="row.maxDate ?? null"
                    [attr.placeholder]="row.placeholder ?? null"
                    [required]="!!row.required"
                    [attr.aria-required]="row.required ? 'true' : null"
                    [value]="primitiveValue(cell)"
                    [attr.aria-label]="row.label + ', ' + column.label"
                    [attr.aria-invalid]="!!cell?.error || null"
                    [attr.aria-describedby]="describedBy"
                    (focus)="focus(row.id, column.id)"
                    (input)="textChanged(row, column, $event)"
                  />
                }
                @case ('quantity') {
                  <div class="emr-quantity">
                    <input
                      class="emr-control"
                      type="number"
                      inputmode="decimal"
                      [attr.id]="controlId"
                      [attr.min]="row.min ?? null"
                      [attr.max]="row.max ?? null"
                      [attr.step]="decimalStep(row)"
                      [attr.placeholder]="row.placeholder ?? null"
                      [required]="!!row.required"
                      [attr.aria-required]="row.required ? 'true' : null"
                      [value]="quantityValue(cell)"
                      [attr.aria-label]="row.label + ' value, ' + column.label"
                      [attr.aria-invalid]="!!cell?.error || null"
                      [attr.data-warning]="!cell?.error && !!cell?.warning ? 'true' : null"
                      [attr.aria-describedby]="describedBy"
                      (focus)="focus(row.id, column.id)"
                      (input)="quantityChanged(row, column, $event)"
                    />
                    @if (row.unitOptions?.length) {
                      <select
                        class="emr-select emr-matrix__unit-select"
                        [value]="quantityUnit(row, cell)"
                        [attr.aria-label]="row.label + ' unit, ' + column.label"
                        (change)="quantityUnitChanged(row, column, $event)"
                      >
                        @for (unitOpt of row.unitOptions; track unitOpt.value) {
                          <option [value]="unitOpt.value" [selected]="unitOpt.value === quantityUnit(row, cell)">{{ unitOpt.label }}</option>
                        }
                      </select>
                    } @else {
                      <div class="emr-control emr-matrix__unit-label" [attr.aria-label]="row.label + ' unit'">{{ quantityUnit(row, cell) }}</div>
                    }
                  </div>
                }
                @case ('multiline') {
                  <textarea
                    class="emr-control"
                    rows="2"
                    [attr.id]="controlId"
                    [attr.maxlength]="row.maxLength ?? null"
                    [attr.placeholder]="row.placeholder ?? null"
                    [required]="!!row.required"
                    [attr.aria-required]="row.required ? 'true' : null"
                    [value]="primitiveValue(cell)"
                    [attr.aria-label]="row.label + ', ' + column.label"
                    [attr.aria-invalid]="!!cell?.error || null"
                    [attr.aria-describedby]="describedBy"
                    (focus)="focus(row.id, column.id)"
                    (input)="textChanged(row, column, $event)"
                  ></textarea>
                }
                @default {
                  <input
                    class="emr-control"
                    type="text"
                    [attr.id]="controlId"
                    [attr.maxlength]="row.maxLength ?? null"
                    [attr.placeholder]="row.placeholder ?? null"
                    [required]="!!row.required"
                    [attr.aria-required]="row.required ? 'true' : null"
                    [value]="primitiveValue(cell)"
                    [attr.aria-label]="row.label + ', ' + column.label"
                    [attr.aria-invalid]="!!cell?.error || null"
                    [attr.aria-describedby]="describedBy"
                    (focus)="focus(row.id, column.id)"
                    (input)="textChanged(row, column, $event)"
                  />
                }
              }
              @if (row.clearable && hasClearableValue(cell)) {
                <button
                  type="button"
                  class="emr-button emr-button--ghost emr-matrix__clear"
                  data-emr-print="hide"
                  [attr.aria-label]="'Clear ' + row.label + ', ' + column.label"
                  (click)="clearCell(row, column)"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
                    <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
                  </svg>
                  <span>Clear</span>
                </button>
              }
              @if (cell?.quickPresets?.length) {
                <div class="emr-matrix__presets" data-emr-print="hide">
                  @for (preset of cell!.quickPresets!; track preset) {
                    <button
                      type="button"
                      class="emr-matrix__preset"
                      [attr.aria-label]="'Set ' + row.label + ', ' + column.label + ' to ' + preset"
                      (click)="applyPreset(row, column, preset)"
                    >
                      {{ preset }}
                    </button>
                  }
                </div>
              }
            }

            @if (cell?.flagBadge || cell?.assessmentStatus || cell?.previousValueLabel || cell?.deltaLabel) {
              <div class="emr-matrix__meta-row">
                @if (cell?.flagBadge; as flag) {
                  <emr-badge [badge]="flag" size="sm" />
                }
                @if (cell?.assessmentStatus; as status) {
                  <emr-badge [badge]="status" size="sm" />
                }
                @if (cell?.previousValueLabel) {
                  <span class="emr-matrix__meta">{{ cell?.previousValueLabel }}</span>
                }
                @if (cell?.deltaLabel) {
                  <span class="emr-matrix__meta">{{ cell?.deltaLabel }}</span>
                }
              </div>
            }

            @if (!locked && row.assessmentStatusOptions?.length) {
              <select
                class="emr-select"
                [value]="cell?.assessmentStatus?.value ?? ''"
                [attr.aria-label]="'Assessment status for ' + row.label + ', ' + column.label"
                (change)="assessmentStatusChanged(row, column, $event)"
              >
                <option value="" [selected]="!cell?.assessmentStatus?.value">Status not set</option>
                @for (option of row.assessmentStatusOptions; track option.value) {
                  <option [value]="option.value" [selected]="option.value === cell?.assessmentStatus?.value">{{ option.label }}</option>
                }
              </select>
            }

            @if (cell?.warning) {
              <span
                class="emr-matrix__message emr-matrix__warning"
                role="status"
                [attr.id]="cellWarningId(row.id, column.id, surface)"
              >
                Warning: {{ cell?.warning }}
              </span>
            }
            @if (cell?.error) {
              <span
                class="emr-matrix__message emr-matrix__error"
                role="alert"
                [attr.id]="cellErrorId(row.id, column.id, surface)"
              >
                {{ cell?.error }}
              </span>
            }
          </div>
        }
      </ng-template>

      <table>
        <thead>
          @if (definition().columnGroups?.length) {
            <tr>
              <th rowspan="2" scope="col">Clinical field</th>
              @for (slot of columnGroupSlots(); track $index) {
                @if (slot.kind === 'group') {
                  <th scope="colgroup" [attr.colspan]="slot.colSpan">{{ slot.label }}</th>
                } @else {
                  <th rowspan="2" scope="col">{{ slot.columns[0].label }}</th>
                }
              }
              @if (showRemarks()) {
                <th rowspan="2" scope="col">Remarks</th>
              }
            </tr>
            @if (groupedColumns().length) {
              <tr>
                @for (column of groupedColumns(); track column.id) {
                  <th scope="col">{{ column.label }}</th>
                }
              </tr>
            }
          } @else {
            <tr>
              <th scope="col">Clinical field</th>
              @for (column of definition().columns; track column.id) {
                <th scope="col">{{ column.label }}</th>
              }
              @if (showRemarks()) {
                <th scope="col">Remarks</th>
              }
            </tr>
          }
        </thead>
        <tbody>
          @for (row of definition().rows; track row.id) {
            <tr>
              <th class="emr-matrix__row-label" scope="row">
                {{ row.label }}@if (row.required) {<span class="emr-field__required" aria-hidden="true"> *</span>}@if (row.unit) {&#32;<span class="emr-field__hint">({{ row.unit }})</span>}@if (row.helpText) { <span class="emr-matrix__message">{{ row.helpText }}</span> }
              </th>
              @for (column of definition().columns; track column.id) {
                <td><ng-container *ngTemplateOutlet="cellTemplate; context: { row, column, surface: 'table' }" /></td>
              }
              @if (showRemarks()) {
                <td>
                  <input
                    class="emr-control"
                    [class.emr-control--readonly]="isRemarkLocked(row.id)"
                    type="text"
                    [attr.id]="remarkInputId(row.id, 'table')"
                    [value]="remarkFor(row.id)"
                    [readOnly]="isRemarkLocked(row.id)"
                    [attr.aria-readonly]="isRemarkLocked(row.id) ? 'true' : null"
                    [attr.aria-label]="'Remarks for ' + row.label"
                    [attr.aria-invalid]="!!remarkError(row.id) || null"
                    [attr.aria-describedby]="remarkError(row.id) ? remarkErrorId(row.id, 'table') : null"
                    (input)="remarkChanged(row.id, $event)"
                  />
                  @if (remarkError(row.id)) {
                    <span
                      class="emr-matrix__message emr-matrix__error"
                      role="alert"
                      [attr.id]="remarkErrorId(row.id, 'table')"
                    >
                      {{ remarkError(row.id) }}
                    </span>
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>

      <div class="emr-matrix-cards">
        @for (row of definition().rows; track row.id) {
          <article class="emr-matrix-card">
            <div class="emr-matrix-card__title">
              {{ row.label }}@if (row.required) {<span class="emr-field__required" aria-hidden="true"> *</span>}
              @if (row.unit) { <span class="emr-field__hint">({{ row.unit }})</span> }
              @if (row.helpText) { <span class="emr-matrix__message">{{ row.helpText }}</span> }
            </div>
            @for (column of definition().columns; track column.id) {
              <div class="emr-matrix-card__cell">
                <span class="emr-matrix-card__label">{{ column.label }}</span>
                <ng-container *ngTemplateOutlet="cellTemplate; context: { row, column, surface: 'cards' }" />
              </div>
            }
            @if (showRemarks()) {
              <div class="emr-matrix-card__cell">
                <label class="emr-matrix-card__label" [for]="remarkInputId(row.id, 'cards')">Remarks</label>
                <div class="emr-matrix__cell">
                  <input
                    class="emr-control"
                    [class.emr-control--readonly]="isRemarkLocked(row.id)"
                    [id]="remarkInputId(row.id, 'cards')"
                    type="text"
                    [value]="remarkFor(row.id)"
                    [readOnly]="isRemarkLocked(row.id)"
                    [attr.aria-readonly]="isRemarkLocked(row.id) ? 'true' : null"
                    [attr.aria-invalid]="!!remarkError(row.id) || null"
                    [attr.aria-describedby]="remarkError(row.id) ? remarkErrorId(row.id, 'cards') : null"
                    (input)="remarkChanged(row.id, $event)"
                  />
                  @if (remarkError(row.id)) {
                    <span
                      class="emr-matrix__message emr-matrix__error"
                      role="alert"
                      [attr.id]="remarkErrorId(row.id, 'cards')"
                    >
                      {{ remarkError(row.id) }}
                    </span>
                  }
                </div>
              </div>
            }
          </article>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrClinicalMatrixComponent {
  readonly definition = input.required<ClinicalMatrixSchema>();
  readonly model = input<ClinicalMatrixValues>({});
  readonly readOnly = input<boolean>(false);
  readonly headingId = input<string | undefined>(undefined);
  readonly idPrefix = input<string>('');

  readonly intent = output<ClinicalMatrixIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly renderers = contentChildren(EmrClinicalCellRendererDirective);
  private readonly hostRef = inject(ElementRef<HTMLElement>, { optional: true });
  private focusedWithin = false;

  readonly resolvedHeadingId = computed(() =>
    resolveMatrixHeadingId(this.definition().id, this.headingId(), this.idPrefix()),
  );
  readonly showRemarks = computed(() => this.definition().showRemarks !== false);
  readonly columnGroupSlots = computed(() =>
    groupMatrixColumns(this.definition().columns, this.definition().columnGroups),
  );
  readonly groupedColumns = computed(() =>
    this.columnGroupSlots().flatMap((slot) => (slot.kind === 'group' ? slot.columns : [])),
  );

  onFocusIn(): void {
    if (!this.focusedWithin) {
      this.focusedWithin = true;
      this.focused.emit();
    }
  }

  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.hostRef?.nativeElement.contains(next)) {
      return;
    }
    if (this.focusedWithin) {
      this.focusedWithin = false;
      this.blurred.emit();
    }
  }

  /** Applicability respects `row.applicableColumnIds`; omitted means every column applies. */
  isApplicable(row: ClinicalRow, columnId: string): boolean {
    return isMatrixCellApplicable(row, columnId);
  }

  cellFor(rowId: string, columnId: string): ClinicalCellState | undefined {
    return this.model()[rowId]?.cells[columnId];
  }

  isCellLocked(cell?: ClinicalCellState): boolean {
    return !canMutateMatrixCell(this.readOnly(), cell);
  }

  isRemarkLocked(rowId: string): boolean {
    return !canMutateMatrixRemark(this.readOnly(), this.model()[rowId]);
  }

  remarkFor(rowId: string): string {
    return this.model()[rowId]?.remark ?? '';
  }

  remarkError(rowId: string): string {
    return this.model()[rowId]?.remarkError ?? '';
  }

  primitiveValue(cell?: ClinicalCellState): string | number {
    return typeof cell?.value === 'string' || typeof cell?.value === 'number' ? cell.value : '';
  }

  booleanValue(cell?: ClinicalCellState): string {
    return typeof cell?.value === 'boolean' ? String(cell.value) : '';
  }

  quantityValue(cell?: ClinicalCellState): string | number {
    return isMatrixQuantity(cell?.value) ? cell.value.value ?? '' : '';
  }

  quantityUnit(row: ClinicalRow, cell?: ClinicalCellState): string {
    return resolveMatrixQuantityUnit(row, cell);
  }

  decimalStep(row: ClinicalRow): number {
    return resolveMatrixDecimalStep(row);
  }

  formatValue(value: ClinicalCellState['value'] | undefined): string {
    return formatMatrixCellValue(value);
  }

  hasClearableValue(cell?: ClinicalCellState): boolean {
    if (!cell) return false;
    if (isMatrixQuantity(cell.value)) return cell.value.value !== null;
    return cell.value !== null && cell.value !== undefined && cell.value !== '';
  }

  cellControlId(rowId: string, columnId: string, surface: 'table' | 'cards'): string {
    return resolveMatrixDomId(this.idPrefix(), this.definition().id, surface, rowId, columnId);
  }

  cellWarningId(rowId: string, columnId: string, surface: 'table' | 'cards'): string {
    return resolveMatrixDomId(this.idPrefix(), this.definition().id, surface, rowId, columnId, 'warning');
  }

  cellErrorId(rowId: string, columnId: string, surface: 'table' | 'cards'): string {
    return resolveMatrixDomId(this.idPrefix(), this.definition().id, surface, rowId, columnId, 'error');
  }

  cellDescribedBy(
    rowId: string,
    columnId: string,
    cell: ClinicalCellState | undefined,
    surface: 'table' | 'cards',
  ): string | null {
    const ids: string[] = [];
    if (cell?.warning) ids.push(this.cellWarningId(rowId, columnId, surface));
    if (cell?.error) ids.push(this.cellErrorId(rowId, columnId, surface));
    return ids.length ? ids.join(' ') : null;
  }

  remarkInputId(rowId: string, surface: 'table' | 'cards'): string {
    return resolveMatrixDomId(this.idPrefix(), this.definition().id, surface, rowId, 'remark');
  }

  remarkErrorId(rowId: string, surface: 'table' | 'cards'): string {
    return resolveMatrixDomId(this.idPrefix(), this.definition().id, surface, rowId, 'remark-error');
  }

  rendererFor(key?: string): TemplateRef<{ $implicit: ClinicalCellRendererContext }> | null {
    if (!key) return null;
    return this.renderers().find((item) => item.key() === key)?.template ?? null;
  }

  customContext(
    row: ClinicalRow,
    column: ClinicalColumn,
    cell?: ClinicalCellState,
  ): { $implicit: ClinicalCellRendererContext } {
    const locked = this.isCellLocked(cell);
    return {
      $implicit: {
        row,
        column,
        cell,
        readOnly: locked,
        emit: (action, payload) => {
          if (!this.isCellLocked(this.cellFor(row.id, column.id))) {
            this.intent.emit({
              type: 'customCellIntent',
              rowId: row.id,
              columnId: column.id,
              action,
              payload,
            });
          }
        },
      },
    };
  }

  focus(rowId: string, columnId: string): void {
    this.intent.emit({ type: 'cellFocused', rowId, columnId });
  }

  textChanged(row: ClinicalRow, column: ClinicalColumn, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (this.isCellLocked(this.cellFor(row.id, column.id))) {
      target.value = String(this.primitiveValue(this.cellFor(row.id, column.id)));
      return;
    }
    this.emitCell(row, column, target.value);
  }

  numberChanged(row: ClinicalRow, column: ClinicalColumn, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.isCellLocked(this.cellFor(row.id, column.id))) {
      target.value = String(this.primitiveValue(this.cellFor(row.id, column.id)));
      return;
    }
    const raw = target.value;
    this.emitCell(row, column, raw === '' ? null : Number(raw));
  }

  booleanChanged(row: ClinicalRow, column: ClinicalColumn, event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (this.isCellLocked(this.cellFor(row.id, column.id))) {
      target.value = this.booleanValue(this.cellFor(row.id, column.id));
      return;
    }
    const raw = target.value;
    this.emitCell(row, column, raw === '' ? null : raw === 'true');
  }

  selectChanged(row: ClinicalRow, column: ClinicalColumn, event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (this.isCellLocked(this.cellFor(row.id, column.id))) {
      target.value = String(this.primitiveValue(this.cellFor(row.id, column.id)));
      return;
    }
    this.emitCell(row, column, target.value || null);
  }

  quantityChanged(row: ClinicalRow, column: ClinicalColumn, event: Event): void {
    const target = event.target as HTMLInputElement;
    const currentCell = this.cellFor(row.id, column.id);
    if (this.isCellLocked(currentCell)) {
      target.value = String(this.quantityValue(currentCell));
      return;
    }
    const raw = target.value;
    this.emitCell(row, column, {
      value: raw === '' ? null : Number(raw),
      unit: this.quantityUnit(row, currentCell),
    });
  }

  quantityUnitChanged(row: ClinicalRow, column: ClinicalColumn, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const currentCell = this.cellFor(row.id, column.id);
    if (this.isCellLocked(currentCell)) {
      target.value = this.quantityUnit(row, currentCell);
      return;
    }
    const numVal = isMatrixQuantity(currentCell?.value) ? currentCell.value.value : null;
    this.emitCell(row, column, {
      value: numVal,
      unit: target.value,
    });
  }

  clearCell(row: ClinicalRow, column: ClinicalColumn): void {
    const currentCell = this.cellFor(row.id, column.id);
    if (this.isCellLocked(currentCell)) return;
    if (row.type === 'quantity') {
      this.emitCell(row, column, { value: null, unit: this.quantityUnit(row, currentCell) });
      return;
    }
    this.emitCell(row, column, null);
  }

  applyPreset(row: ClinicalRow, column: ClinicalColumn, preset: string): void {
    const currentCell = this.cellFor(row.id, column.id);
    if (this.isCellLocked(currentCell)) return;
    this.emitCell(row, column, parseMatrixPresetValue(row, preset, currentCell));
  }

  assessmentStatusChanged(row: ClinicalRow, column: ClinicalColumn, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const currentCell = this.cellFor(row.id, column.id);
    if (this.isCellLocked(currentCell)) {
      target.value = currentCell?.assessmentStatus?.value ?? '';
      return;
    }
    this.intent.emit({
      type: 'cellAssessmentStatusEditRequested',
      rowId: row.id,
      columnId: column.id,
      status: (target.value || null) as ClinicalAssessmentStatus | null,
    });
  }

  remarkChanged(rowId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.isRemarkLocked(rowId)) {
      target.value = this.remarkFor(rowId);
      return;
    }
    this.intent.emit({ type: 'remarkEditRequested', rowId, remark: target.value });
  }

  private emitCell(row: ClinicalRow, column: ClinicalColumn, value: ClinicalCellState['value']): void {
    if (this.isCellLocked(this.cellFor(row.id, column.id))) return;
    this.intent.emit({ type: 'cellEditRequested', rowId: row.id, columnId: column.id, value });
  }
}
