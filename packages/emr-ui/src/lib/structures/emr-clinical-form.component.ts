import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFieldValue,
  ClinicalFormIntent,
  ClinicalFormSection,
  ClinicalFormViewModel,
  ClinicalMatrixBlockDefinition,
  ClinicalMatrixBlockRow,
  RepeatableItemState,
} from '@drguptavivek/emr-controller';
import { EmrCustomFieldContext, EmrTypedFieldComponent } from '../fields/emr-typed-field.component';
import {
  isClinicalFormFieldShown,
  isClinicalFormSectionShown,
  isMatrixRowRequired,
  resolveClinicalFormControlId,
  resolveClinicalFormDomId,
  visibleMatrixRows,
} from './emr-clinical-form.logic';
import { EmrRepeatableGroupComponent } from './emr-repeatable-group.component';
import { EmrSectionCardComponent } from './emr-section-card.component';

@Component({
  selector: 'emr-clinical-form',
  standalone: true,
  imports: [EmrSectionCardComponent, EmrRepeatableGroupComponent, EmrTypedFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    <form
      class="emr-clinical-form"
      [class.emr-clinical-form--readonly]="!!model().readOnly"
      novalidate
      (submit)="$event.preventDefault()"
      [attr.aria-labelledby]="resolvedHeadingId()"
      [attr.aria-label]="resolvedHeadingId() ? null : model().schema.label"
    >
      @if (model().schema.description) {
        <p class="emr-clinical-form__description">{{ model().schema.description }}</p>
      }
      @if (model().correction; as c) {
        <div class="emr-clinical-form__correction" data-emr-print="hide">
          @if (c.description) {
            <p class="emr-clinical-form__description">{{ c.description }}</p>
          }
          <button
            class="emr-button emr-button--outline emr-clinical-form__correction-btn"
            type="button"
            (click)="emit({ type: 'correctionRequested' })"
          >
            {{ c.label }}
          </button>
        </div>
      }
      @for (section of visibleSections(); track section.id) {
        <emr-section-card
          [sectionId]="domId(model().schema.id + '-' + section.id)"
          [label]="section.label"
          [description]="section.description"
          [collapsible]="section.collapsible ?? false"
          [collapsed]="isCollapsed(section.id)"
          [status]="model().sectionStatuses?.[section.id]"
          (intent)="emit({ type: 'sectionToggleRequested', sectionId: section.id })"
        >
          <div class="emr-clinical-form__grid">
            @for (block of section.blocks; track block.id) {
              @if (block.kind === 'repeatable') {
                <div class="emr-clinical-form__repeatable-wrap" [style.grid-column]="'span 12'">
                  <emr-repeatable-group
                    [definition]="block"
                    [model]="itemsFor(block.id)"
                    [idPrefix]="repeatablePrefix()"
                    [readOnly]="!!model().readOnly"
                    [customTemplates]="customTemplates()"
                    (intent)="onRepeatableIntent($event)"
                  />
                </div>
              } @else if (block.kind === 'matrix') {
                @if (matrixRows(block).length) {
                  <div class="emr-clinical-form__matrix" [style.grid-column]="'span 12'">
                    <h3>{{ block.label }}</h3>
                    @if (block.description) {
                      <p>{{ block.description }}</p>
                    }
                    <div
                      class="emr-clinical-form__matrix-table"
                      role="table"
                      [attr.aria-label]="block.label"
                      [style.--emr-matrix-cols]="block.columns.length"
                    >
                      <div class="emr-clinical-form__matrix-row emr-clinical-form__matrix-row--header" role="row">
                        <span aria-hidden="true"></span>
                        @for (column of block.columns; track column.id) {
                          <span role="columnheader">{{ column.label }}</span>
                        }
                      </div>
                      @for (row of matrixRows(block); track row.id) {
                        <div class="emr-clinical-form__matrix-row" role="row">
                          <span role="rowheader">
                            {{ row.label }}@if (rowRequired(row)) {<span class="emr-field__required" aria-hidden="true"> *</span>}
                          </span>
                          @for (column of block.columns; track column.id) {
                            <div role="cell">
                              @if (row.cells[column.id]; as cell) {
                                @if (shown(model().fields[cell.id])) {
                                  <span class="emr-clinical-form__matrix-cell-label" aria-hidden="true">{{ column.label }}</span>
                                  <emr-typed-field
                                    [definition]="cell"
                                    [model]="model().fields[cell.id]"
                                    [controlId]="controlId(cell)"
                                    [labelHidden]="true"
                                    [readOnly]="model().readOnly ?? false"
                                    [customTemplates]="customTemplates()"
                                    (focused)="focus(cell.id)"
                                    (valueChange)="valueChanged(cell, $event)"
                                    (statusChange)="statusChanged(cell, $event)"
                                  />
                                }
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              } @else if (shown(model().fields[block.id])) {
                <div class="emr-clinical-form__field" [style.grid-column]="'span ' + (block.span ?? 6)">
                  <emr-typed-field
                    [definition]="block"
                    [model]="model().fields[block.id]"
                    [controlId]="controlId(block)"
                    [readOnly]="model().readOnly ?? false"
                    [customTemplates]="customTemplates()"
                    (focused)="focus(block.id)"
                    (valueChange)="valueChanged(block, $event)"
                    (statusChange)="statusChanged(block, $event)"
                  />
                </div>
              }
            }
          </div>
        </emr-section-card>
      } @empty {
        @if (model().emptyMessage; as emptyMsg) {
          <p class="emr-clinical-form__empty" role="status">{{ emptyMsg }}</p>
        }
      }
    </form>
  `,
})
export class EmrClinicalFormComponent {
  readonly model = input.required<ClinicalFormViewModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly customTemplates = input<Readonly<Record<string, TemplateRef<EmrCustomFieldContext>>>>({});

  readonly intent = output<ClinicalFormIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private isFocusWithin = false;

  protected readonly resolvedHeadingId = computed(() => this.headingId()?.trim() || null);
  protected readonly visibleSections = computed(() =>
    this.model().schema.sections.filter((section) => this.sectionShown(section)),
  );
  protected readonly repeatablePrefix = computed(() =>
    resolveClinicalFormDomId(this.model().schema.id, this.idPrefix()),
  );

  /** A hidden field is skipped only while empty: a hidden field that still holds a value is clinical data and stays visible. */
  shown(state?: ClinicalFieldState): boolean {
    return isClinicalFormFieldShown(state);
  }

  /** A section is drawn while any block would show; repeatables always count (they carry Add). Twin of emr-react isSectionShown. */
  sectionShown(section: ClinicalFormSection): boolean {
    return isClinicalFormSectionShown(section, this.model().fields);
  }

  /** A row is drawn while any of its cells is shown. */
  matrixRows(block: ClinicalMatrixBlockDefinition): readonly ClinicalMatrixBlockRow[] {
    return visibleMatrixRows(block, this.model().fields);
  }

  rowRequired(row: ClinicalMatrixBlockRow): boolean {
    return isMatrixRowRequired(row, this.model().fields);
  }

  isCollapsed(sectionId: string): boolean {
    return this.model().collapsedSectionIds?.includes(sectionId) ?? false;
  }

  itemsFor(groupId: string): readonly RepeatableItemState[] {
    return this.model().repeatableGroups[groupId] ?? [];
  }

  domId(value: string): string {
    return resolveClinicalFormDomId(value, this.idPrefix());
  }

  controlId(field: ClinicalFieldDefinition, itemId?: string): string {
    return resolveClinicalFormControlId(this.model().schema.id, field.id, this.idPrefix(), itemId);
  }

  repeatableGroupIdPrefix(): string {
    return this.repeatablePrefix();
  }

  onRepeatableIntent(ev: ClinicalFormIntent): void {
    if (this.model().readOnly && ev.type !== 'fieldFocused') return;
    this.emit(ev);
  }

  focus(fieldId: string): void {
    this.emit({ type: 'fieldFocused', fieldId });
  }

  valueChanged(field: ClinicalFieldDefinition, value: ClinicalFieldValue): void {
    const state = this.model().fields[field.id];
    if (this.model().readOnly || state?.readOnly || state?.disabled) return;
    this.emit({ type: 'fieldEditRequested', fieldId: field.id, value });
  }

  statusChanged(field: ClinicalFieldDefinition, status: ClinicalFieldState['assessmentStatus']): void {
    const state = this.model().fields[field.id];
    if (this.model().readOnly || state?.readOnly || state?.disabled) return;
    this.emit({ type: 'fieldStatusEditRequested', fieldId: field.id, status });
  }

  emit(intent: ClinicalFormIntent): void {
    this.intent.emit(intent);
  }

  protected onFocusIn(): void {
    if (!this.isFocusWithin) {
      this.isFocusWithin = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && this.hostRef.nativeElement.contains(nextTarget)) return;
    if (this.isFocusWithin) {
      this.isFocusWithin = false;
      this.blurred.emit();
    }
  }
}
