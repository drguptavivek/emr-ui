import { NgTemplateOutlet } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type {
  ClinicalAssessmentStatus,
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFieldValue,
  ClinicalQuantityValue,
  EmrAttachmentRef,
  EmrCodedValue,
  EmrFieldDefinition,
  EmrFieldState,
  EmrFileSelectionItem,
  EmrOption,
  EmrPartialDate,
  EmrSegmentedOption,
  EmrSignaturePoint,
  EmrSignatureStroke,
  EmrUploadedImageItem,
} from '@drguptavivek/emr-controller';
import {
  EmrCheckboxGroupComponent,
  EmrSegmentedControlComponent,
} from '../primitives/emr-action-controls.component';
import { EmrRadioGroupComponent, EmrToggleComponent } from '../primitives/emr-choice.component';
import { EmrChipComponent } from '../primitives/emr-feedback.component';
import { EmrImageUploadComponent } from '../primitives/emr-image.component';
import { EmrDateInputComponent } from '../primitives/emr-inputs.component';
import {
  emptyToNull,
  localDateTimeToUtcIso,
  toLocalDateTimeInputValue,
} from '../primitives/emr-inputs.logic';
import { EmrLikertAnchor, EmrLikertComponent } from '../primitives/emr-likert.component';
import { EmrSearchSelectComponent } from '../primitives/emr-search-select.component';
import {
  EmrFileTriggerComponent,
  EmrNumericStepperComponent,
  EmrSearchInputComponent,
} from '../primitives/emr-specialized-inputs.component';
import { EmrTextareaComponent } from '../primitives/emr-textarea.component';
import { EmrTreeSelectComponent } from '../primitives/emr-tree.component';
import { EmrVasAnchor, EmrVasComponent } from '../primitives/emr-vas.component';
import {
  EmrMaskedInputComponent,
  EmrOtpInputComponent,
  EmrSliderComponent,
} from '../primitives/emr-wave2-formatted.component';
import {
  EmrComboboxComponent,
  EmrTagInputComponent,
} from '../primitives/emr-wave2-inputs.component';
import { EmrFieldFrameComponent } from './emr-field-frame.component';
import {
  normalizeTypedFieldDefinition,
  normalizeTypedFieldState,
  resolveTypedFieldRenderer,
  typedFieldHasError,
  typedFieldHasMessage,
} from './typed-field.logic';

export interface EmrCustomFieldContext {
  $implicit?: EmrCustomFieldContext;
  definition: ClinicalFieldDefinition;
  model?: ClinicalFieldState;
  controlId: string;
}

const PARTIAL_DATE_OPTIONS: readonly EmrSegmentedOption<EmrPartialDate['precision']>[] = [
  { value: 'year', label: 'Year' },
  { value: 'month', label: 'Month' },
  { value: 'day', label: 'Day' },
];

const BOOLEAN_CHOICE_OPTIONS: readonly EmrOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

let nextTypedFieldId = 0;

/**
 * Shared renderer for schema-defined fields (`ClinicalFieldDefinition` and `EmrFieldDefinition`).
 * Dispatches across all 17 `EmrValueType`s and 21 `EmrWidgetHint`s while keeping validation and
 * clinical meaning strictly inside the controller.
 */
@Component({
  selector: 'emr-typed-field',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    EmrFieldFrameComponent,
    EmrTextareaComponent,
    EmrSearchInputComponent,
    EmrNumericStepperComponent,
    EmrToggleComponent,
    EmrRadioGroupComponent,
    EmrSegmentedControlComponent,
    EmrCheckboxGroupComponent,
    EmrChipComponent,
    EmrSearchSelectComponent,
    EmrDateInputComponent,
    EmrLikertComponent,
    EmrVasComponent,
    EmrFileTriggerComponent,
    EmrTreeSelectComponent,
    EmrComboboxComponent,
    EmrTagInputComponent,
    EmrImageUploadComponent,
    EmrSliderComponent,
    EmrMaskedInputComponent,
    EmrOtpInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let d = def();
    @let s = state();
    <emr-field-frame
      [label]="d.label"
      [labelHidden]="labelHidden()"
      [controlId]="resolvedId()"
      [required]="isRequired()"
      [hint]="d.hint"
      [info]="s.info"
      [warning]="s.warning"
      [error]="s.error"
      [messages]="s.messages"
    >
      <div (focusin)="onFocusIn()">
        @switch (renderer()) {
          @case ('textarea') {
            <emr-textarea
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [rows]="d.rows"
              [value]="stringOrNullValue()"
              [placeholder]="d.placeholder"
              [required]="isRequired()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (valueChange)="emitValue($event)"
            />
          }
          @case ('search') {
            <emr-search-input
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [value]="stringOrNullValue()"
              [placeholder]="d.placeholder || 'Search…'"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (valueChange)="emitValue($event)"
            />
          }
          @case ('stepper') {
            <emr-numeric-stepper
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [value]="numericOrNullValue()"
              [min]="d.min"
              [max]="d.max"
              [step]="numericStep()"
              [precision]="d.valueType === 'integer' ? 0 : d.precision"
              [unit]="d.unit ?? ''"
              [required]="isRequired()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (valueChange)="emitValue($event)"
            />
          }
          @case ('integer') {
            <input
              #nativeControl
              class="emr-control"
              type="number"
              inputmode="numeric"
              step="1"
              [id]="resolvedId()"
              [value]="numberDomValue()"
              [attr.min]="d.min ?? null"
              [attr.max]="d.max ?? null"
              [placeholder]="d.placeholder"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [attr.aria-invalid]="hasError() ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (wheel)="blurOnWheel($event)"
              (input)="nativeValueChanged($event)"
              (blur)="syncNativeControls()"
            />
          }
          @case ('decimal') {
            <input
              #nativeControl
              class="emr-control"
              type="number"
              inputmode="decimal"
              [attr.step]="decimalStep()"
              [id]="resolvedId()"
              [value]="numberDomValue()"
              [attr.min]="d.min ?? null"
              [attr.max]="d.max ?? null"
              [placeholder]="d.placeholder"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [attr.aria-invalid]="hasError() ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (wheel)="blurOnWheel($event)"
              (input)="nativeValueChanged($event)"
              (blur)="syncNativeControls()"
            />
          }
          @case ('date') {
            <input
              #nativeControl
              class="emr-control"
              type="date"
              [id]="resolvedId()"
              [value]="textValue()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [attr.aria-invalid]="hasError() ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (input)="nativeValueChanged($event)"
              (blur)="syncNativeControls()"
            />
          }
          @case ('time') {
            <input
              #nativeControl
              class="emr-control"
              type="time"
              [id]="resolvedId()"
              [value]="textValue()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [attr.aria-invalid]="hasError() ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (input)="nativeValueChanged($event)"
              (blur)="syncNativeControls()"
            />
          }
          @case ('datetime') {
            <input
              #nativeControl
              class="emr-control"
              type="datetime-local"
              [id]="resolvedId()"
              [value]="dateTimeDomValue()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [attr.aria-invalid]="hasError() ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (input)="nativeDateTimeChanged($event)"
              (blur)="syncNativeControls()"
            />
          }
          @case ('partial-date') {
            <div class="emr-typed-field__stack">
              <emr-segmented-control
                [controlId]="resolvedId() + '-precision'"
                [ariaLabel]="d.label + ' precision'"
                [labelHidden]="true"
                [options]="partialDateOptions"
                [value]="partialDatePrecision()"
                [disabled]="isDisabled()"
                [readOnly]="isReadOnly()"
                (valueChange)="onPartialDatePrecisionChange($event)"
              />
              <emr-date-input
                [controlId]="resolvedId()"
                [label]="d.label"
                [labelHidden]="true"
                [precision]="partialDatePrecision()"
                [value]="partialDateRawValue()"
                [required]="isRequired()"
                [disabled]="isDisabled()"
                [readOnly]="isReadOnly()"
                [error]="errorFlag()"
                (valueChange)="onPartialDateValueChange($event)"
              />
            </div>
          }
          @case ('select') {
            <select
              #nativeSelect
              class="emr-select"
              [id]="resolvedId()"
              [value]="singleSelectedCode()"
              [disabled]="isDisabled()"
              [attr.aria-readonly]="isReadOnly() || null"
              [attr.aria-invalid]="hasError() ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (change)="singleSelectChanged($event)"
              (blur)="syncNativeControls()"
            >
              <option value="" [selected]="!singleSelectedCode()">Select</option>
              @for (option of d.options; track option.value) {
                <option
                  [value]="option.value"
                  [selected]="option.value === singleSelectedCode()"
                  [disabled]="option.disabled"
                >
                  {{ option.label }}
                </option>
              }
            </select>
          }
          @case ('radio') {
            <emr-radio-group
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [options]="choiceOptions()"
              [value]="choiceSingleValue()"
              [required]="isRequired()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (valueChange)="onChoiceSingleChange($event)"
            />
          }
          @case ('segmented') {
            <emr-segmented-control
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [options]="segmentedOptions()"
              [value]="choiceSingleValue()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (valueChange)="onChoiceSingleChange($event)"
            />
          }
          @case ('search-select') {
            <emr-search-select
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [placeholder]="d.placeholder || 'Search options…'"
              [query]="localSearchQuery()"
              [options]="filteredSearchOptions()"
              [selected]="selectedEmrOptions()"
              [open]="localSearchOpen()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (queryChanged)="onLocalSearchQuery($event)"
              (openRequested)="localSearchOpen.set(true)"
              (closeRequested)="localSearchOpen.set(false)"
              (optionSelected)="onSearchOptionPicked($event)"
              (removeRequested)="onSearchOptionRemoved($event)"
            />
          }
          @case ('multiselect') {
            <select
              #nativeMultiSelect
              class="emr-select"
              multiple
              [id]="resolvedId()"
              [disabled]="isDisabled()"
              [attr.aria-readonly]="isReadOnly() || null"
              [attr.aria-invalid]="hasError() ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (change)="multiChanged($event)"
              (blur)="syncNativeControls()"
            >
              @for (option of d.options; track option.value) {
                <option
                  [value]="option.value"
                  [selected]="isMultiSelected(option.value)"
                  [disabled]="option.disabled"
                >
                  {{ option.label }}
                </option>
              }
            </select>
          }
          @case ('checkbox-group') {
            <emr-checkbox-group
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [options]="choiceOptions()"
              [value]="multiSelectedCodes()"
              [required]="isRequired()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (valueChange)="onMultiCodeChange($event)"
            />
          }
          @case ('chips') {
            <div
              class="emr-chip-row"
              role="group"
              [id]="resolvedId()"
              [attr.aria-label]="d.label"
              [attr.aria-invalid]="hasError() ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
            >
              @for (option of d.options; track option.value) {
                <button
                  type="button"
                  class="emr-button emr-button--small"
                  [class.emr-button--outline]="!isChipActive(option.value)"
                  [disabled]="isDisabled() || !!option.disabled"
                  [attr.aria-pressed]="isChipActive(option.value)"
                  [attr.aria-readonly]="isReadOnly() || null"
                  (click)="onChipToggle(option.value)"
                >
                  {{ option.label }}
                </button>
              }
            </div>
          }
          @case ('boolean-checkbox') {
            <label class="emr-checkbox">
              <input
                #nativeCheckbox
                type="checkbox"
                [id]="resolvedId()"
                [checked]="s.value === true"
                [disabled]="isDisabled()"
                [attr.aria-readonly]="isReadOnly() || null"
                [attr.aria-invalid]="hasError() ? 'true' : null"
                [attr.aria-describedby]="describedBy()"
                (click)="guardClick($event)"
                (change)="nativeBooleanChanged($event)"
                (blur)="syncNativeControls()"
              />
              <span>Yes</span>
            </label>
          }
          @case ('boolean-toggle') {
            <emr-toggle
              [controlId]="resolvedId()"
              label="Yes"
              [checked]="s.value === true"
              [required]="isRequired()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (checkedChange)="emitValue($event)"
            />
          }
          @case ('quantity') {
            <div class="emr-typed-field__quantity">
              <input
                #nativeQuantity
                class="emr-control"
                type="number"
                inputmode="decimal"
                [id]="resolvedId()"
                [value]="quantityDomValue()"
                [attr.min]="d.min ?? null"
                [attr.max]="d.max ?? null"
                [attr.step]="d.step ?? 'any'"
                [disabled]="isDisabled()"
                [readOnly]="isReadOnly()"
                [attr.aria-invalid]="hasError() ? 'true' : null"
                [attr.aria-describedby]="describedBy()"
                (wheel)="blurOnWheel($event)"
                (input)="nativeValueChanged($event)"
                (blur)="syncNativeControls()"
              />
              @if (d.unit) {
                <span class="emr-field__hint" aria-hidden="true">{{ d.unit }}</span>
              }
            </div>
          }
          @case ('coded') {
            <div class="emr-typed-field__stack">
              @if (codedChips().length > 0) {
                <div class="emr-chip-row">
                  @for (concept of codedChips(); track concept.code) {
                    <emr-chip
                      tone="info"
                      [removable]="!isReadOnly() && !isDisabled()"
                      [removeLabel]="'Remove ' + concept.display"
                      (removeRequested)="removeCodedConcept(concept)"
                    >
                      {{ concept.display }} ({{ concept.code }})
                    </emr-chip>
                  }
                </div>
              }
              <emr-search-select
                [controlId]="resolvedId()"
                [label]="d.label"
                [labelHidden]="true"
                [placeholder]="d.placeholder || 'Search coded concepts…'"
                [query]="localSearchQuery()"
                [options]="filteredSearchOptions()"
                [selected]="[]"
                [open]="localSearchOpen()"
                [disabled]="isDisabled()"
                [readOnly]="isReadOnly()"
                [error]="errorFlag()"
                (queryChanged)="onLocalSearchQuery($event)"
                (openRequested)="localSearchOpen.set(true)"
                (closeRequested)="localSearchOpen.set(false)"
                (optionSelected)="onCodedOptionSelected($event)"
              />
            </div>
          }
          @case ('likert') {
            <emr-likert
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [min]="d.min ?? 0"
              [max]="d.max ?? 10"
              [value]="numericOrNullValue()"
              [anchors]="scaleAnchors()"
              [optionTones]="d.optionTones"
              [required]="isRequired()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (valueChange)="emitValue($event)"
            />
          }
          @case ('vas') {
            <emr-vas
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [min]="d.min ?? 0"
              [max]="d.max ?? 100"
              [step]="d.step ?? 1"
              [value]="numericOrNullValue()"
              [anchors]="vasAnchors()"
              [required]="isRequired()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (valueChange)="emitValue($event)"
            />
          }
          @case ('attachment') {
            <div class="emr-typed-field__stack">
              @if (!isReadOnly() && !isDisabled()) {
                <emr-file-trigger
                  [controlId]="resolvedId()"
                  [label]="d.label"
                  [labelHidden]="true"
                  [multiple]="true"
                  [error]="errorFlag()"
                  (filesSelected)="onAttachmentFilesSelected($event)"
                />
              }
              @if (attachmentItems().length > 0) {
                <div class="emr-chip-row">
                  @for (att of attachmentItems(); track att.id) {
                    <emr-chip
                      tone="neutral"
                      [removable]="!isReadOnly() && !isDisabled()"
                      [removeLabel]="'Remove ' + att.title"
                      (removeRequested)="removeAttachment(att.id)"
                    >
                      {{ att.title }}
                    </emr-chip>
                  }
                </div>
              }
            </div>
          }
          @case ('signature') {
            <div class="emr-typed-field__stack">
              <svg
                class="emr-signature-pad emr-typed-field__sig"
                [id]="resolvedId()"
                viewBox="0 0 400 120"
                [attr.data-readonly]="isReadOnly() || isDisabled() || null"
                role="img"
                [attr.aria-label]="d.label"
                [attr.aria-invalid]="hasError() ? 'true' : null"
                [attr.aria-describedby]="describedBy()"
                (pointerdown)="onSigDown($event)"
                (pointermove)="onSigMove($event)"
                (pointerup)="onSigUp($event)"
                (pointercancel)="onSigCancel($event)"
              >
                @for (stroke of signatureStrokes(); track $index) {
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    [attr.points]="svgPoints(stroke.points)"
                  />
                }
                @if (draftSigPoints().length > 0) {
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    [attr.points]="svgPoints(draftSigPoints())"
                  />
                }
              </svg>
              @if (!isReadOnly() && !isDisabled() && signatureStrokes().length > 0) {
                <div>
                  <button
                    type="button"
                    class="emr-button emr-button--ghost emr-button--small"
                    (click)="emitValue([])"
                  >
                    Clear signature
                  </button>
                </div>
              }
            </div>
          }
          @case ('annotation') {
            @if (customTemplate(); as tpl) {
              <ng-container *ngTemplateOutlet="tpl; context: customContext()" />
            } @else {
              <emr-textarea
                [controlId]="resolvedId()"
                [label]="d.label"
                [labelHidden]="true"
                [rows]="d.rows"
                [value]="stringOrNullValue()"
                [placeholder]="d.placeholder || 'Record clinical annotation…'"
                [required]="isRequired()"
                [disabled]="isDisabled()"
                [readOnly]="isReadOnly()"
                [error]="errorFlag()"
                (valueChange)="emitValue($event)"
              />
            }
          }
          @case ('tree-select') {
            <emr-tree-select
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [placeholder]="d.placeholder || 'Select item…'"
              [nodes]="d.treeNodes"
              [multiple]="d.valueType === 'multiselect'"
              [value]="choiceSingleValue()"
              [values]="multiSelectedCodes()"
              [required]="isRequired()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (valueChange)="onChoiceSingleChange($event)"
              (valuesChange)="onMultiCodeChange($event)"
            />
          }
          @case ('combobox') {
            <emr-combobox
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [placeholder]="d.placeholder"
              [options]="choiceOptions()"
              [value]="stringOrNullValue()"
              [required]="isRequired()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (valueChange)="emitValue($event)"
            />
          }
          @case ('tag-input') {
            <emr-tag-input
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [placeholder]="d.placeholder || 'Add tag…'"
              [value]="multiSelectedCodes()"
              [suggestions]="tagSuggestions()"
              [required]="isRequired()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (valueChange)="onMultiCodeChange($event)"
            />
          }
          @case ('image-upload') {
            <emr-image-upload
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [items]="uploadedImageItems()"
              [required]="isRequired()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (filesSelected)="onAttachmentFilesSelected($event)"
              (removeRequested)="removeAttachment($event)"
            />
          }
          @case ('slider') {
            <emr-slider
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [min]="d.min ?? 0"
              [max]="d.max ?? 100"
              [step]="numericStep()"
              [unit]="d.unit ?? ''"
              [value]="numericOrNullValue()"
              [required]="isRequired()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (valueChange)="emitValue($event)"
            />
          }
          @case ('masked') {
            <emr-masked-input
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [placeholder]="d.placeholder"
              [mask]="d.mask ?? '***-***'"
              [value]="stringOrNullValue()"
              [required]="isRequired()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (valueChange)="emitValue($event)"
            />
          }
          @case ('otp') {
            <emr-otp-input
              [controlId]="resolvedId()"
              [label]="d.label"
              [labelHidden]="true"
              [length]="d.max ?? 6"
              [value]="textValue()"
              [required]="isRequired()"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [error]="errorFlag()"
              (valueChange)="emitValue($event || null)"
            />
          }
          @case ('custom') {
            @if (customTemplate(); as tpl) {
              <ng-container *ngTemplateOutlet="tpl; context: customContext()" />
            } @else {
              <div class="emr-typed-field__unsupported" role="status">
                Custom renderer “{{ d.customRendererKey ?? d.id }}” is not registered.
              </div>
            }
          }
          @default {
            <input
              #nativeControl
              class="emr-control"
              type="text"
              [id]="resolvedId()"
              [value]="textValue()"
              [placeholder]="d.placeholder"
              [disabled]="isDisabled()"
              [readOnly]="isReadOnly()"
              [attr.aria-invalid]="hasError() ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (input)="nativeValueChanged($event)"
              (blur)="syncNativeControls()"
            />
          }
        }
      </div>

      @if (d.assessmentStatusOptions.length > 0 || s.status) {
        <div class="emr-typed-field__status">
          @if (s.status) {
            <span [class]="'emr-badge ' + statusToneClass()" role="status">{{ statusLabel() }}</span>
          }
          @if (d.assessmentStatusOptions.length > 0) {
            <select
              #statusSelect
              class="emr-select emr-typed-field__status-select"
              [attr.aria-label]="d.label + ' assessment status'"
              [disabled]="isDisabled()"
              [attr.aria-readonly]="isReadOnly() || null"
              [value]="s.status ?? ''"
              (change)="statusChanged($event)"
              (blur)="syncNativeControls()"
            >
              <option value="" [selected]="!s.status">Status not set</option>
              @for (option of d.assessmentStatusOptions; track option.value) {
                <option [value]="option.value" [selected]="option.value === s.status">
                  {{ option.label }}
                </option>
              }
            </select>
          }
        </div>
      }
    </emr-field-frame>
  `,
  styles: [
    `
      .emr-typed-field__stack {
        display: grid;
        gap: 8px;
        min-width: 0;
      }
      .emr-typed-field__quantity {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .emr-typed-field__quantity .emr-control {
        min-width: 0;
        flex: 1;
      }
      .emr-typed-field__status {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 6px;
      }
      .emr-typed-field__status-select {
        min-height: 44px;
        width: auto;
        max-width: 100%;
      }
      .emr-typed-field__sig {
        height: 120px;
        color: var(--emr-text);
        cursor: crosshair;
      }
      .emr-typed-field__unsupported {
        padding: 10px;
        border: 1px dashed var(--emr-border);
        border-radius: 8px;
        color: var(--emr-text-muted);
        font-size: var(--emr-text-md);
      }
    `,
  ],
})
export class EmrTypedFieldComponent implements AfterViewChecked {
  readonly definition = input.required<ClinicalFieldDefinition | EmrFieldDefinition>();
  readonly model = input<ClinicalFieldState | EmrFieldState>();
  readonly controlId = input<string>();
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly customTemplates = input<Readonly<Record<string, TemplateRef<EmrCustomFieldContext>>>>({});

  readonly valueChange = output<ClinicalFieldValue>();
  readonly statusChange = output<ClinicalAssessmentStatus | undefined>();
  readonly focused = output<void>();

  protected readonly partialDateOptions = PARTIAL_DATE_OPTIONS;

  private readonly fallbackId = `emr-typed-field-${++nextTypedFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly def = computed(() => normalizeTypedFieldDefinition(this.definition()));
  protected readonly state = computed(() =>
    normalizeTypedFieldState(this.model(), this.def().defaultValue),
  );
  protected readonly renderer = computed(() =>
    resolveTypedFieldRenderer(this.def().valueType, this.def().widget),
  );

  readonly messageId = computed(() => `${this.resolvedId()}-message`);
  readonly hasMessage = computed(() => typedFieldHasMessage(this.def(), this.state()));
  readonly hasError = computed(() => typedFieldHasError(this.state()));
  protected readonly errorFlag = computed(() => (this.hasError() ? 'invalid' : ''));
  protected readonly describedBy = computed(() => (this.hasMessage() ? this.messageId() : null));

  readonly isRequired = computed(
    () => this.state().requiredOverride ?? this.def().required,
  );
  /** Read-only never becomes `disabled`: a disabled control leaves the tab order and is unannounceable. */
  readonly isDisabled = computed(() => this.state().disabled);
  readonly isReadOnly = computed(
    () => this.readOnly() || this.def().readOnly || this.state().readOnly,
  );

  protected readonly customTemplate = computed<TemplateRef<EmrCustomFieldContext> | undefined>(
    () => {
      const key = this.def().customRendererKey;
      return key ? this.customTemplates()[key] : undefined;
    },
  );

  protected readonly customContext = computed<EmrCustomFieldContext>(() => {
    const base: EmrCustomFieldContext = {
      definition: this.def().legacyDefinition,
      model: this.state().legacyState,
      controlId: this.resolvedId(),
    };
    return { ...base, $implicit: base };
  });

  protected readonly localSearchQuery = signal('');
  protected readonly localSearchOpen = signal(false);
  protected readonly draftPartialPrecision = signal<EmrPartialDate['precision']>('day');
  protected readonly draftSigPoints = signal<readonly EmrSignaturePoint[]>([]);
  private activeSigPointerId: number | null = null;

  private readonly nativeControlRef = viewChild<ElementRef<HTMLInputElement>>('nativeControl');
  private readonly nativeSelectRef = viewChild<ElementRef<HTMLSelectElement>>('nativeSelect');
  private readonly nativeMultiRef = viewChild<ElementRef<HTMLSelectElement>>('nativeMultiSelect');
  private readonly nativeCheckRef = viewChild<ElementRef<HTMLInputElement>>('nativeCheckbox');
  private readonly nativeQtyRef = viewChild<ElementRef<HTMLInputElement>>('nativeQuantity');
  private readonly statusSelectRef = viewChild<ElementRef<HTMLSelectElement>>('statusSelect');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncNativeControls();
    }
  }

  protected onFocusIn(): void {
    this.focused.emit();
  }

  protected textValue(): string {
    const v = this.state().value;
    return typeof v === 'string' ? v : '';
  }

  protected stringOrNullValue(): string | null {
    const v = this.state().value;
    return typeof v === 'string' && v.length > 0 ? v : null;
  }

  protected numericOrNullValue(): number | null {
    const v = this.state().value;
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  }

  protected numberDomValue(): string {
    const n = this.numericOrNullValue();
    return n === null ? '' : String(n);
  }

  protected dateTimeDomValue(): string {
    return toLocalDateTimeInputValue(this.textValue());
  }

  protected decimalStep(): number {
    return this.def().step ?? 1 / 10 ** (this.def().precision ?? 2);
  }

  protected numericStep(): number {
    if (this.def().valueType === 'integer') {
      return Math.max(1, Math.round(this.def().step ?? 1));
    }
    return this.decimalStep();
  }

  protected quantity(): ClinicalQuantityValue | undefined {
    const v = this.state().value;
    return typeof v === 'object' && v !== null && 'value' in v && 'unit' in v
      ? (v as ClinicalQuantityValue)
      : undefined;
  }

  protected quantityDomValue(): string {
    const q = this.quantity();
    if (q) return q.value === null || Number.isNaN(q.value) ? '' : String(q.value);
    return this.numberDomValue();
  }

  protected partialDateValue(): EmrPartialDate | null {
    const v = this.state().value;
    if (typeof v === 'object' && v !== null && 'precision' in v && 'value' in v) {
      return v as EmrPartialDate;
    }
    return null;
  }

  protected partialDatePrecision(): EmrPartialDate['precision'] {
    return this.partialDateValue()?.precision ?? this.draftPartialPrecision();
  }

  protected partialDateRawValue(): string | null {
    const pd = this.partialDateValue();
    if (pd) return pd.value;
    const v = this.state().value;
    return typeof v === 'string' ? emptyToNull(v) : null;
  }

  protected singleSelectedCode(): string {
    const v = this.state().value;
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && v !== null && 'code' in v) {
      return (v as EmrCodedValue).code;
    }
    return '';
  }

  protected choiceOptions(): readonly EmrOption[] {
    if (this.def().valueType === 'boolean' && this.def().options.length === 0) {
      return BOOLEAN_CHOICE_OPTIONS;
    }
    return this.def().options.map((o) => ({
      value: o.value,
      label: o.label,
      disabled: o.disabled,
    }));
  }

  protected segmentedOptions(): readonly EmrSegmentedOption[] {
    return this.choiceOptions().map((o) => ({
      value: o.value,
      label: o.label,
      disabled: o.disabled,
    }));
  }

  protected choiceSingleValue(): string | null {
    const v = this.state().value;
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    const code = this.singleSelectedCode();
    return code || null;
  }

  protected multiSelectedCodes(): readonly string[] {
    const v = this.state().value;
    if (!Array.isArray(v)) return [];
    return v.map((entry) =>
      typeof entry === 'string'
        ? entry
        : typeof entry === 'object' && entry !== null && 'code' in entry
          ? (entry as EmrCodedValue).code
          : String(entry),
    );
  }

  protected isMultiSelected(code: string): boolean {
    return this.multiSelectedCodes().includes(code);
  }

  protected isChipActive(code: string): boolean {
    if (this.def().valueType === 'select') {
      return this.singleSelectedCode() === code;
    }
    return this.isMultiSelected(code);
  }

  protected filteredSearchOptions(): readonly EmrOption[] {
    const q = this.localSearchQuery().trim().toLowerCase();
    const all = this.choiceOptions();
    if (!q) return all;
    return all.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }

  protected selectedEmrOptions(): readonly EmrOption[] {
    const code = this.singleSelectedCode();
    if (!code) return [];
    const match = this.def().options.find((o) => o.value === code);
    return [{ value: code, label: match?.label ?? code }];
  }

  protected codedChips(): readonly EmrCodedValue[] {
    const v = this.state().value;
    if (!v) return [];
    if (Array.isArray(v)) {
      return v.filter(
        (item): item is EmrCodedValue =>
          typeof item === 'object' && item !== null && 'code' in item && 'display' in item,
      );
    }
    if (typeof v === 'object' && 'code' in v && 'display' in v) {
      return [v as EmrCodedValue];
    }
    return [];
  }

  protected scaleAnchors(): readonly EmrLikertAnchor[] {
    const d = this.def();
    const min = d.min ?? 0;
    const max = d.max ?? (this.renderer() === 'vas' ? 100 : 10);
    const list: EmrLikertAnchor[] = [];
    if (d.anchors?.minLabel) list.push({ value: min, label: d.anchors.minLabel });
    if (d.anchors?.midLabel) {
      list.push({ value: Math.round((min + max) / 2), label: d.anchors.midLabel });
    }
    if (d.anchors?.maxLabel) list.push({ value: max, label: d.anchors.maxLabel });
    return list;
  }

  protected vasAnchors(): readonly EmrVasAnchor[] {
    return this.scaleAnchors();
  }

  protected attachmentItems(): readonly EmrAttachmentRef[] {
    const v = this.state().value;
    if (!Array.isArray(v)) return [];
    return v.filter(
      (item): item is EmrAttachmentRef =>
        typeof item === 'object' && item !== null && 'id' in item && 'title' in item,
    );
  }

  protected tagSuggestions(): readonly string[] {
    return this.def().options.map((o) => o.label || o.value);
  }

  protected uploadedImageItems(): readonly EmrUploadedImageItem[] {
    return this.attachmentItems().map((att) => ({
      id: att.id,
      name: att.title,
      src: att.url ?? '',
      previewSrc: att.url ?? '',
      mimeType: att.contentType ?? 'image/jpeg',
      sizeBytes: att.sizeBytes,
      alt: att.title,
    }));
  }

  protected signatureStrokes(): readonly EmrSignatureStroke[] {
    const v = this.state().value;
    if (!Array.isArray(v)) return [];
    return v.filter(
      (item): item is EmrSignatureStroke =>
        typeof item === 'object' && item !== null && 'points' in item,
    );
  }

  protected statusLabel(): string {
    const status = this.state().status;
    return (
      this.def().assessmentStatusOptions.find((o) => o.value === status)?.label ??
      status ??
      'Recorded'
    );
  }

  protected statusToneClass(): string {
    const status = this.state().status;
    const tone = this.def().assessmentStatusOptions.find((o) => o.value === status)?.tone;
    return tone ? `emr-tone-${tone}` : 'emr-tone-neutral';
  }

  protected blurOnWheel(event: WheelEvent): void {
    (event.currentTarget as HTMLInputElement).blur();
  }

  protected guardClick(event: Event): void {
    if (this.isReadOnly() || this.isDisabled()) {
      event.preventDefault();
      this.syncNativeControls();
    }
  }

  protected emitValue(value: ClinicalFieldValue): void {
    if (this.isReadOnly() || this.isDisabled()) return;
    this.valueChange.emit(value);
  }

  protected nativeBooleanChanged(event: Event): void {
    if (this.isReadOnly() || this.isDisabled()) {
      this.syncNativeControls();
      return;
    }
    const checked = (event.target as HTMLInputElement).checked;
    this.scheduleDomSync();
    this.valueChange.emit(checked);
  }

  protected nativeDateTimeChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.isReadOnly() || this.isDisabled()) {
      this.syncNativeControls();
      return;
    }
    const raw = emptyToNull(target.value);
    const utc = raw === null ? null : localDateTimeToUtcIso(raw);
    this.scheduleDomSync();
    this.valueChange.emit(utc);
  }

  protected nativeValueChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.isReadOnly() || this.isDisabled()) {
      this.syncNativeControls();
      return;
    }
    const vt = this.def().valueType;
    if (vt === 'integer' || vt === 'decimal' || vt === 'quantity') {
      if (target.validity?.badInput) return;
      const trimmed = target.value.trim();
      const numeric = trimmed === '' ? null : Number(trimmed);
      if (numeric !== null && !Number.isFinite(numeric)) {
        this.syncNativeControls();
        return;
      }
      const normalized =
        numeric !== null && vt === 'integer' ? Math.trunc(numeric) : numeric;
      this.scheduleDomSync();
      this.valueChange.emit(
        vt === 'quantity' ? { value: normalized, unit: this.def().unit ?? '' } : normalized,
      );
      return;
    }

    this.scheduleDomSync();
    this.valueChange.emit(emptyToNull(target.value));
  }

  protected singleSelectChanged(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (this.isReadOnly() || this.isDisabled()) {
      this.syncNativeControls();
      return;
    }
    const raw = emptyToNull(target.value);
    this.scheduleDomSync();
    if (this.def().valueType === 'coded') {
      if (raw === null) {
        this.valueChange.emit(null);
      } else {
        const opt = this.def().options.find((o) => o.value === raw);
        this.valueChange.emit({
          system: 'local',
          code: raw,
          display: opt?.label ?? raw,
        });
      }
      return;
    }
    this.valueChange.emit(raw);
  }

  protected onChoiceSingleChange(next: string | null): void {
    if (this.isReadOnly() || this.isDisabled()) return;
    if (this.def().valueType === 'boolean') {
      this.valueChange.emit(next === null ? null : next === 'true');
      return;
    }
    if (this.def().valueType === 'coded') {
      if (next === null) {
        this.valueChange.emit(null);
      } else {
        const opt = this.def().options.find((o) => o.value === next);
        this.valueChange.emit({
          system: 'local',
          code: next,
          display: opt?.label ?? next,
        });
      }
      return;
    }
    this.valueChange.emit(next);
  }

  protected multiChanged(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (this.isReadOnly() || this.isDisabled()) {
      this.syncNativeControls();
      return;
    }
    const codes = Array.from(target.selectedOptions).map((opt) => opt.value);
    this.scheduleDomSync();
    this.valueChange.emit(codes);
  }

  protected onMultiCodeChange(codes: readonly string[]): void {
    if (this.isReadOnly() || this.isDisabled()) return;
    if (this.def().valueType === 'coded') {
      const concepts: EmrCodedValue[] = codes.map((code) => {
        const opt = this.def().options.find((o) => o.value === code);
        return { system: 'local', code, display: opt?.label ?? code };
      });
      this.valueChange.emit(concepts);
      return;
    }
    this.valueChange.emit(codes);
  }

  protected onChipToggle(code: string): void {
    if (this.isReadOnly() || this.isDisabled()) return;
    if (this.def().valueType === 'select') {
      this.valueChange.emit(this.singleSelectedCode() === code ? null : code);
      return;
    }
    const current = new Set(this.multiSelectedCodes());
    if (current.has(code)) current.delete(code);
    else current.add(code);
    this.onMultiCodeChange([...current]);
  }

  protected onLocalSearchQuery(query: string): void {
    this.localSearchQuery.set(query);
    this.localSearchOpen.set(true);
  }

  protected onSearchOptionPicked(code: string): void {
    this.localSearchQuery.set('');
    this.localSearchOpen.set(false);
    this.onChoiceSingleChange(code);
  }

  protected onSearchOptionRemoved(_code: string): void {
    this.onChoiceSingleChange(null);
  }

  protected onCodedOptionSelected(code: string): void {
    if (this.isReadOnly() || this.isDisabled()) return;
    const opt = this.def().options.find((o) => o.value === code);
    const concept: EmrCodedValue = {
      system: 'local',
      code,
      display: opt?.label ?? code,
    };
    this.localSearchQuery.set('');
    this.localSearchOpen.set(false);
    const current = this.codedChips();
    if (Array.isArray(this.state().value)) {
      if (!current.some((c) => c.code === code)) {
        this.valueChange.emit([...current, concept]);
      }
    } else {
      this.valueChange.emit(concept);
    }
  }

  protected removeCodedConcept(concept: EmrCodedValue): void {
    if (this.isReadOnly() || this.isDisabled()) return;
    if (Array.isArray(this.state().value)) {
      this.valueChange.emit(this.codedChips().filter((c) => c.code !== concept.code));
    } else {
      this.valueChange.emit(null);
    }
  }

  protected onPartialDatePrecisionChange(next: string | null): void {
    if (this.isReadOnly() || this.isDisabled() || !next) return;
    if (next === 'year' || next === 'month' || next === 'day') {
      this.draftPartialPrecision.set(next);
      const raw = this.partialDateRawValue();
      if (raw !== null) {
        this.valueChange.emit({ value: raw, precision: next });
      }
    }
  }

  protected onPartialDateValueChange(raw: string | null): void {
    if (this.isReadOnly() || this.isDisabled()) return;
    this.valueChange.emit(
      raw === null ? null : { value: raw, precision: this.partialDatePrecision() },
    );
  }

  protected onAttachmentFilesSelected(files: readonly EmrFileSelectionItem[]): void {
    if (this.isReadOnly() || this.isDisabled()) return;
    const existing = this.attachmentItems();
    const added: EmrAttachmentRef[] = files.map((file, index) => ({
      id: `${this.resolvedId()}-att-${existing.length + index + 1}`,
      title: file.name,
      contentType: file.mimeType,
      sizeBytes: file.sizeBytes,
    }));
    this.valueChange.emit([...existing, ...added]);
  }

  protected removeAttachment(id: string): void {
    if (this.isReadOnly() || this.isDisabled()) return;
    this.valueChange.emit(this.attachmentItems().filter((item) => item.id !== id));
  }

  protected svgPoints(points: readonly EmrSignaturePoint[]): string {
    return points.map((p) => `${p.x},${p.y}`).join(' ');
  }

  protected onSigDown(event: PointerEvent): void {
    if (this.isReadOnly() || this.isDisabled()) return;
    const svg = event.currentTarget as SVGSVGElement;
    if (typeof svg.setPointerCapture === 'function') {
      svg.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    this.activeSigPointerId = event.pointerId;
    this.draftSigPoints.set([this.sigPoint(event, svg)]);
  }

  protected onSigMove(event: PointerEvent): void {
    if (this.isReadOnly() || this.isDisabled() || this.activeSigPointerId !== event.pointerId) {
      return;
    }
    const svg = event.currentTarget as SVGSVGElement;
    event.preventDefault();
    const pt = this.sigPoint(event, svg);
    this.draftSigPoints.update((prev) => [...prev, pt]);
  }

  protected onSigUp(event: PointerEvent): void {
    if (this.activeSigPointerId !== event.pointerId) return;
    const svg = event.currentTarget as SVGSVGElement;
    if (typeof svg.releasePointerCapture === 'function') {
      svg.releasePointerCapture(event.pointerId);
    }
    const pts = this.draftSigPoints();
    this.activeSigPointerId = null;
    this.draftSigPoints.set([]);
    if (!this.isReadOnly() && !this.isDisabled() && pts.length > 0) {
      this.valueChange.emit([...this.signatureStrokes(), { points: pts }]);
    }
  }

  protected onSigCancel(event: PointerEvent): void {
    if (this.activeSigPointerId !== event.pointerId) return;
    const svg = event.currentTarget as SVGSVGElement;
    if (typeof svg.releasePointerCapture === 'function') {
      svg.releasePointerCapture(event.pointerId);
    }
    this.activeSigPointerId = null;
    this.draftSigPoints.set([]);
  }

  protected statusChanged(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (this.isReadOnly() || this.isDisabled()) {
      this.syncNativeControls();
      return;
    }
    const raw = (target.value || undefined) as ClinicalAssessmentStatus | undefined;
    this.scheduleDomSync();
    this.statusChange.emit(raw);
  }

  protected syncNativeControls(): void {
    const inputEl = this.nativeControlRef()?.nativeElement;
    if (inputEl) {
      const r = this.renderer();
      const expected =
        r === 'integer' || r === 'decimal'
          ? this.numberDomValue()
          : r === 'datetime'
            ? this.dateTimeDomValue()
            : this.textValue();
      if (inputEl.value !== expected) inputEl.value = expected;
    }

    const selectEl = this.nativeSelectRef()?.nativeElement;
    if (selectEl) {
      const expected = this.singleSelectedCode();
      if (selectEl.value !== expected) selectEl.value = expected;
    }

    const multiEl = this.nativeMultiRef()?.nativeElement;
    if (multiEl) {
      for (const option of Array.from(multiEl.options)) {
        const expected = this.isMultiSelected(option.value);
        if (option.selected !== expected) option.selected = expected;
      }
    }

    const checkEl = this.nativeCheckRef()?.nativeElement;
    if (checkEl) {
      const expected = this.state().value === true;
      if (checkEl.checked !== expected) checkEl.checked = expected;
    }

    const qtyEl = this.nativeQtyRef()?.nativeElement;
    if (qtyEl) {
      const expected = this.quantityDomValue();
      if (qtyEl.value !== expected) qtyEl.value = expected;
    }

    const statusEl = this.statusSelectRef()?.nativeElement;
    if (statusEl) {
      const expected = this.state().status ?? '';
      if (statusEl.value !== expected) statusEl.value = expected;
    }
  }

  private scheduleDomSync(): void {
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncNativeControls();
      }
    });
  }

  private sigPoint(event: PointerEvent, svg: SVGSVGElement): EmrSignaturePoint {
    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width > 0 ? 400 / rect.width : 1;
    const scaleY = rect.height > 0 ? 120 / rect.height : 1;
    return {
      x: Number(((event.clientX - rect.left) * scaleX).toFixed(1)),
      y: Number(((event.clientY - rect.top) * scaleY).toFixed(1)),
    };
  }
}
