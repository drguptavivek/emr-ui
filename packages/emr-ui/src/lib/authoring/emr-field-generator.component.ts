import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFieldValue,
  FieldGeneratorIntent,
  FieldGeneratorViewModel,
  TerminologyBindingRole,
  TerminologySearchViewModel,
  ValidationRuleEditorViewModel,
} from '@drguptavivek/emr-controller';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroCheck, heroPlus, heroTrash } from '@ng-icons/heroicons/outline';
import { EmrTypedFieldComponent } from '../fields/emr-typed-field.component';
import {
  AUTHORING_FIELD_TYPE_OPTIONS,
  AUTHORING_SPAN_OPTIONS,
  AUTHORING_TERMINOLOGY_ROLES,
  FIELD_GENERATOR_DEFAULTS,
  filterBindingsByRole,
  resolveAuthoringId,
  toPreviewFieldDefinition,
  type EmrFieldGeneratorLabels,
} from './emr-authoring.logic';
import { EmrTerminologySearchComponent } from './emr-terminology-search.component';
import { EmrValidationRuleEditorComponent } from './emr-validation-rule-editor.component';

@Component({
  selector: 'emr-field-generator',
  standalone: true,
  imports: [EmrTypedFieldComponent, EmrTerminologySearchComponent, EmrValidationRuleEditorComponent, NgIcon],
  providers: [...provideIcons({ heroCheck, heroPlus, heroTrash })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    @let m = model();
    @let d = m.draft;
    @let l = text();
    @let locked = effectiveReadOnly();
    <section
      class="emr-field-generator"
      [attr.aria-labelledby]="resolvedHeadingId()"
      [attr.data-emr-print]="'expand'"
    >
      <header class="emr-field-generator__header">
        <div>
          <p class="emr-eyebrow">{{ l.eyebrow }}</p>
          <h2 [id]="resolvedHeadingId()">{{ l.heading }}</h2>
          <p>{{ l.subtitle }}</p>
        </div>
        <div class="emr-field-generator__actions">
          <span class="emr-authoring-status" role="status">{{ m.dirty ? l.unsavedChanges : l.ready }}</span>
          <button
            class="emr-button emr-button--primary"
            type="button"
            data-emr-print="hide"
            [attr.aria-disabled]="(locked || m.saving) ? 'true' : null"
            (click)="saveRequested()"
          >
            <ng-icon name="heroCheck" size="16" aria-hidden="true" />
            <span>{{ m.saving ? l.saving : l.saveField }}</span>
          </button>
        </div>
      </header>

      @if (m.error) {
        <div class="emr-authoring-message emr-authoring-message--error" role="alert">{{ m.error }}</div>
      }

      <div class="emr-field-generator__layout">
        <div class="emr-field-generator__editor">
          <section class="emr-authoring-card" [attr.aria-labelledby]="id('identity-heading')">
            <div class="emr-authoring-card__heading">
              <div>
                <p class="emr-eyebrow">{{ l.identityEyebrow }}</p>
                <h3 [id]="id('identity-heading')">{{ l.identityHeading }}</h3>
              </div>
            </div>
            <div class="emr-authoring-grid">
              <label class="emr-field-frame__label" [for]="id('field-id')">{{ l.fieldIdLabel }}</label>
              <div class="emr-authoring-control-wrap">
                <input
                  class="emr-control"
                  [id]="id('field-id')"
                  [value]="d.id"
                  [readonly]="locked"
                  [attr.aria-invalid]="fieldError('field-id', 'id') ? 'true' : null"
                  [attr.aria-describedby]="fieldError('field-id', 'id') ? id('field-id-error') : null"
                  (input)="patch('id', textVal($event))"
                />
                @if (fieldError('field-id', 'id'); as err) {
                  <p class="emr-inline-error" [id]="id('field-id-error')" role="alert">{{ err }}</p>
                }
              </div>

              <label class="emr-field-frame__label" [for]="id('field-label')">{{ l.labelLabel }}</label>
              <div class="emr-authoring-control-wrap">
                <input
                  class="emr-control"
                  [id]="id('field-label')"
                  [value]="d.label"
                  [readonly]="locked"
                  [attr.aria-invalid]="fieldError('field-label', 'label') ? 'true' : null"
                  [attr.aria-describedby]="fieldError('field-label', 'label') ? id('field-label-error') : null"
                  (input)="patch('label', textVal($event))"
                />
                @if (fieldError('field-label', 'label'); as err) {
                  <p class="emr-inline-error" [id]="id('field-label-error')" role="alert">{{ err }}</p>
                }
              </div>

              <label class="emr-field-frame__label" [for]="id('field-description')">{{ l.descriptionLabel }}</label>
              <textarea
                class="emr-control emr-field-generator__textarea"
                [id]="id('field-description')"
                rows="2"
                [value]="d.description ?? ''"
                [readonly]="locked"
                (input)="patch('description', textVal($event))"
              ></textarea>

              <label class="emr-field-frame__label" [for]="id('field-instructions')">{{ l.instructionsLabel }}</label>
              <textarea
                class="emr-control emr-field-generator__textarea"
                [id]="id('field-instructions')"
                rows="2"
                [value]="d.instructions ?? ''"
                [readonly]="locked"
                (input)="patch('instructions', textVal($event))"
              ></textarea>

              <label class="emr-field-frame__label" [for]="id('field-placeholder')">{{ l.placeholderLabel }}</label>
              <input
                class="emr-control"
                [id]="id('field-placeholder')"
                [value]="d.placeholder ?? ''"
                [readonly]="locked"
                (input)="patch('placeholder', textVal($event))"
              />
            </div>
          </section>

          <section class="emr-authoring-card" [attr.aria-labelledby]="id('behaviour-heading')">
            <div class="emr-authoring-card__heading">
              <div>
                <p class="emr-eyebrow">{{ l.behaviourEyebrow }}</p>
                <h3 [id]="id('behaviour-heading')">{{ l.behaviourHeading }}</h3>
              </div>
            </div>
            <div class="emr-authoring-grid">
              <label class="emr-field-frame__label" [for]="id('field-type')">{{ l.valueTypeLabel }}</label>
              <select
                class="emr-select"
                [id]="id('field-type')"
                [value]="d.type"
                [attr.aria-disabled]="locked ? 'true' : null"
                (mousedown)="guardReadOnlySelect($event, locked)"
                (keydown)="guardReadOnlySelectKey($event, locked)"
                (change)="typeChanged($event)"
              >
                @for (opt of typeOptions; track opt.value) {
                  <option [value]="opt.value" [selected]="opt.value === d.type">{{ opt.label }}</option>
                }
              </select>

              <label class="emr-field-frame__label" [for]="id('field-span')">{{ l.gridSpanLabel }}</label>
              <select
                class="emr-select"
                [id]="id('field-span')"
                [value]="d.span ?? 12"
                [attr.aria-disabled]="locked ? 'true' : null"
                (mousedown)="guardReadOnlySelect($event, locked)"
                (keydown)="guardReadOnlySelectKey($event, locked)"
                (change)="spanChanged($event)"
              >
                @for (span of spanOptions; track span) {
                  <option [value]="span" [selected]="span === (d.span ?? 12)">{{ span }} / 12</option>
                }
              </select>

              <label class="emr-field-frame__label" [for]="id('field-rows')">{{ l.textRowsLabel }}</label>
              <input
                class="emr-control"
                [id]="id('field-rows')"
                type="number"
                min="1"
                max="12"
                [value]="d.rows ?? ''"
                [readonly]="locked"
                (input)="patch('rows', numberVal($event))"
              />

              <label class="emr-field-frame__label" [for]="id('field-precision')">{{ l.precisionLabel }}</label>
              <input
                class="emr-control"
                [id]="id('field-precision')"
                type="number"
                min="0"
                max="8"
                [value]="d.precision ?? ''"
                [readonly]="locked"
                (input)="patch('precision', numberVal($event))"
              />

              <div class="emr-field-generator__checks">
                <label class="emr-field-generator__check">
                  <input
                    type="checkbox"
                    [checked]="d.required"
                    [attr.aria-disabled]="locked ? 'true' : null"
                    (click)="guardReadOnlyCheckbox($event, locked)"
                    (change)="!locked && patch('required', checkedVal($event))"
                  />
                  <span>{{ l.requiredFlag }}</span>
                </label>
                <label class="emr-field-generator__check">
                  <input
                    type="checkbox"
                    [checked]="d.repeats"
                    [attr.aria-disabled]="locked ? 'true' : null"
                    (click)="guardReadOnlyCheckbox($event, locked)"
                    (change)="!locked && patch('repeats', checkedVal($event))"
                  />
                  <span>{{ l.repeatableFlag }}</span>
                </label>
                <label class="emr-field-generator__check">
                  <input
                    type="checkbox"
                    [checked]="!!d.readOnly"
                    [attr.aria-disabled]="locked ? 'true' : null"
                    (click)="guardReadOnlyCheckbox($event, locked)"
                    (change)="!locked && patch('readOnly', checkedVal($event))"
                  />
                  <span>{{ l.readOnlyFlag }}</span>
                </label>
              </div>
            </div>
          </section>

          @if (d.type === 'quantity') {
            <section class="emr-authoring-card" [attr.aria-labelledby]="id('unit-heading')">
              <div class="emr-authoring-card__heading">
                <div>
                  <p class="emr-eyebrow">{{ l.measurementEyebrow }}</p>
                  <h3 [id]="id('unit-heading')">{{ l.measurementHeading }}</h3>
                </div>
              </div>
              <div class="emr-authoring-grid">
                <label class="emr-field-frame__label" [for]="id('field-unit')">{{ l.displayUnitLabel }}</label>
                <input
                  class="emr-control"
                  [id]="id('field-unit')"
                  [value]="d.unit ?? ''"
                  [readonly]="locked"
                  [placeholder]="l.displayUnitPlaceholder"
                  (input)="patch('unit', textVal($event))"
                />

                <label class="emr-field-frame__label" [for]="id('field-unit-system')">{{ l.unitSystemLabel }}</label>
                <div class="emr-authoring-control-wrap">
                  <input
                    class="emr-control"
                    [id]="id('field-unit-system')"
                    [value]="d.unitSystem ?? ''"
                    [readonly]="locked"
                    [placeholder]="l.unitSystemPlaceholder"
                    [attr.aria-invalid]="fieldError('unitSystem') ? 'true' : null"
                    [attr.aria-describedby]="fieldError('unitSystem') ? id('unit-system-error') : null"
                    (input)="patch('unitSystem', textVal($event))"
                  />
                  @if (fieldError('unitSystem'); as err) {
                    <p class="emr-inline-error" [id]="id('unit-system-error')" role="alert">{{ err }}</p>
                  }
                </div>

                <label class="emr-field-frame__label" [for]="id('field-unit-code')">{{ l.unitCodeLabel }}</label>
                <div class="emr-authoring-control-wrap">
                  <input
                    class="emr-control"
                    [id]="id('field-unit-code')"
                    [value]="d.unitCode ?? ''"
                    [readonly]="locked"
                    [placeholder]="l.unitCodePlaceholder"
                    [attr.aria-invalid]="fieldError('unitCode') ? 'true' : null"
                    [attr.aria-describedby]="fieldError('unitCode') ? id('unit-code-error') : null"
                    (input)="patch('unitCode', textVal($event))"
                  />
                  @if (fieldError('unitCode'); as err) {
                    <p class="emr-inline-error" [id]="id('unit-code-error')" role="alert">{{ err }}</p>
                  }
                </div>
              </div>
            </section>
          }

          @if (d.type === 'select' || d.type === 'multiselect') {
            <section class="emr-authoring-card" [attr.aria-labelledby]="id('options-heading')">
              <div class="emr-authoring-card__heading">
                <div>
                  <p class="emr-eyebrow">{{ l.optionsEyebrow }}</p>
                  <h3 [id]="id('options-heading')">{{ l.optionsHeading }}</h3>
                </div>
                <span class="emr-authoring-status">{{ d.options?.length ?? 0 }} options</span>
              </div>
              <div class="emr-authoring-grid">
                <label class="emr-field-frame__label" [for]="id('option-value')">{{ l.optionValueLabel }}</label>
                <input
                  class="emr-control"
                  [id]="id('option-value')"
                  [value]="optionValue"
                  [readonly]="locked"
                  (input)="optionValueChanged($event)"
                />
                <label class="emr-field-frame__label" [for]="id('option-label')">{{ l.optionLabelLabel }}</label>
                <input
                  class="emr-control"
                  [id]="id('option-label')"
                  [value]="optionLabel"
                  [readonly]="locked"
                  (input)="optionLabelChanged($event)"
                />
              </div>
              <button
                class="emr-button emr-button--secondary emr-field-generator__add-option"
                type="button"
                data-emr-print="hide"
                [attr.aria-disabled]="(locked || !optionValue.trim() || !optionLabel.trim()) ? 'true' : null"
                (click)="addOption()"
              >
                <ng-icon name="heroPlus" size="16" aria-hidden="true" />
                <span>{{ l.addOption }}</span>
              </button>
              @if (fieldError('options'); as err) {
                <p class="emr-inline-error" role="alert">{{ err }}</p>
              }
              @if (d.options?.length) {
                <div class="emr-option-list">
                  @for (option of d.options; track option.value) {
                    <span class="emr-chip">
                      <span>{{ option.label }} <small>{{ option.value }}</small></span>
                      <button
                        class="emr-button emr-button--ghost emr-button--small"
                        type="button"
                        data-emr-print="hide"
                        [attr.aria-disabled]="locked ? 'true' : null"
                        [attr.aria-label]="'Remove option ' + option.label"
                        (click)="removeOption(option.value)"
                      >
                        <ng-icon name="heroTrash" size="14" aria-hidden="true" />
                        <span>{{ l.remove }}</span>
                      </button>
                    </span>
                  }
                </div>
              }
            </section>
          }

          <emr-validation-rule-editor
            [model]="validationEditorModel()"
            [headingId]="id('validation-heading')"
            [idPrefix]="id('validation')"
            (intent)="emit($event)"
          />

          <section class="emr-authoring-card" [attr.aria-labelledby]="id('terminology-heading')">
            <div class="emr-authoring-card__heading">
              <div>
                <p class="emr-eyebrow">{{ l.terminologyEyebrow }}</p>
                <h3 [id]="id('terminology-heading')">{{ l.terminologyHeading }}</h3>
                <p class="emr-authoring-card__description">{{ l.terminologyDescription }}</p>
              </div>
            </div>
            <div class="emr-terminology-stack">
              @for (role of terminologyRoles; track role) {
                <emr-terminology-search
                  [model]="terminologyModel(role)"
                  [headingId]="id('terminology-' + role)"
                  [idPrefix]="idPrefix()"
                  (intent)="emit($event)"
                />
              }
            </div>
          </section>
        </div>

        <aside class="emr-field-generator__preview" [attr.aria-labelledby]="id('preview-heading')">
          <div class="emr-authoring-card emr-field-preview">
            <div class="emr-authoring-card__heading">
              <div>
                <p class="emr-eyebrow">{{ l.previewEyebrow }}</p>
                <h3 [id]="id('preview-heading')">{{ l.previewHeading }}</h3>
              </div>
              <span class="emr-authoring-status">{{ d.type }}</span>
            </div>
            <emr-typed-field
              [definition]="previewField()"
              [model]="previewState()"
              [readOnly]="true"
              [controlId]="id('generated-field-preview')"
            />
            <div class="emr-field-preview__meta">
              <span>{{ l.fhirReadyTitle }}</span>
              <small>{{ l.fhirReadyNote }}</small>
            </div>
          </div>

          <div class="emr-authoring-card">
            <p class="emr-eyebrow">{{ l.statusEyebrow }}</p>
            @if (errorEntries().length) {
              <ul class="emr-error-list" role="alert">
                @for (entry of errorEntries(); track entry[0]) {
                  <li><strong>{{ entry[0] }}</strong> {{ entry[1] }}</li>
                }
              </ul>
            } @else {
              <p class="emr-authoring-message">{{ l.noErrors }}</p>
            }
            @if (m.savedFieldId) {
              <p class="emr-authoring-message emr-authoring-message--success" role="status">
                Saved field {{ m.savedFieldId }}.
              </p>
            }
          </div>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    :host{display:block;container-type:inline-size;max-width:100%}
    .emr-field-generator{color:var(--emr-text);font-family:var(--emr-font-family);min-width:0;max-width:100%}
    .emr-field-generator__header{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:20px;flex-wrap:wrap}
    .emr-field-generator h2{margin:2px 0 6px;font-size:var(--emr-text-2xl)}
    .emr-field-generator__header p:not(.emr-eyebrow){margin:0;max-width:760px;color:var(--emr-text-muted);line-height:1.5}
    .emr-field-generator__actions{display:flex;align-items:center;gap:12px;white-space:nowrap;flex-wrap:wrap}
    .emr-authoring-status{color:var(--emr-text-muted);font-size:var(--emr-text-sm)}
    .emr-field-generator__layout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(270px,.8fr);gap:18px;align-items:start}
    .emr-field-generator__editor{display:grid;gap:16px;min-width:0}
    .emr-field-generator__preview{display:grid;gap:16px;position:sticky;top:16px;min-width:0}
    .emr-authoring-card{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:18px;min-width:0}
    .emr-authoring-card__heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px;flex-wrap:wrap}
    .emr-authoring-card h3{margin:2px 0 0;font-size:var(--emr-text-lg)}
    .emr-authoring-card__description{margin:8px 0 0;color:var(--emr-text-muted);font-size:var(--emr-text-md);line-height:1.45}
    .emr-eyebrow{margin:0 0 4px;color:var(--emr-text-muted);font-size:var(--emr-text-2xs);font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    .emr-authoring-grid{display:grid;grid-template-columns:minmax(130px,170px) minmax(0,1fr);gap:10px 12px;align-items:center}
    .emr-authoring-control-wrap{display:grid;gap:4px;min-width:0}
    .emr-inline-error{margin:0;color:var(--emr-danger);font-size:var(--emr-text-xs)}
    .emr-control,.emr-select,.emr-button{min-height:var(--emr-control-height,44px)}
    .emr-button{min-width:44px;display:inline-flex;align-items:center;gap:6px}
    .emr-button[aria-disabled="true"],.emr-select[aria-disabled="true"],input[type="checkbox"][aria-disabled="true"]{cursor:not-allowed;opacity:.55}
    .emr-field-generator__textarea{resize:vertical;min-height:60px}
    .emr-field-generator__checks{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:14px;color:var(--emr-text-muted);font-size:var(--emr-text-md)}
    .emr-field-generator__check{display:inline-flex;align-items:center;gap:8px;min-height:var(--emr-control-height,44px);min-width:44px;cursor:pointer}
    .emr-field-generator__check input[type="checkbox"]{width:20px;height:20px;margin:0;accent-color:var(--emr-primary)}
    .emr-field-generator__add-option{margin-top:12px}
    .emr-terminology-stack{display:grid;gap:12px;min-width:0}
    .emr-option-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
    .emr-chip{display:inline-flex;align-items:center;gap:6px;min-height:var(--emr-control-height,44px);padding:4px 8px 4px 12px;border:1px solid var(--emr-border);border-radius:999px;background:var(--emr-surface-raised);font-size:var(--emr-text-sm)}
    .emr-chip small{color:var(--emr-text-muted)}
    .emr-field-preview{min-height:180px}
    .emr-field-preview__meta{display:grid;gap:4px;margin-top:20px;padding-top:12px;border-top:1px solid var(--emr-border);font-size:var(--emr-text-sm)}
    .emr-field-preview__meta small{color:var(--emr-text-muted);line-height:1.45}
    .emr-authoring-message{margin:12px 0 0;padding:10px 12px;border-radius:8px;background:var(--emr-surface-raised);color:var(--emr-text-muted);font-size:var(--emr-text-sm)}
    .emr-authoring-message--error{background:var(--emr-danger-soft);color:var(--emr-danger)}
    .emr-authoring-message--success{background:var(--emr-success-soft);color:var(--emr-success)}
    .emr-error-list{margin:0;padding-left:20px;color:var(--emr-danger);font-size:var(--emr-text-sm);line-height:1.7}
    @container (max-width: 720px){
      .emr-field-generator__layout{grid-template-columns:1fr}
      .emr-field-generator__preview{position:static;order:-1}
      .emr-field-generator__header{display:grid;gap:12px}
      .emr-field-generator__actions{justify-content:space-between}
      .emr-authoring-grid{grid-template-columns:1fr;gap:6px}
      .emr-field-generator__checks{display:grid;gap:4px}
      .emr-authoring-card{padding:14px}
    }
    @media (max-width: 900px){
      .emr-field-generator__layout{grid-template-columns:1fr}
      .emr-field-generator__preview{position:static;order:-1}
    }
    @media (max-width: 640px){
      .emr-field-generator__header{display:grid;gap:12px}
      .emr-field-generator__actions{justify-content:space-between}
      .emr-authoring-grid{grid-template-columns:1fr;gap:6px}
      .emr-field-generator__checks{display:grid;gap:4px}
      .emr-authoring-card{padding:14px}
    }
    :host-context(.emr-print) [data-emr-print="hide"]{display:none !important}
    @media print{[data-emr-print="hide"]{display:none !important}}
  `],
})
export class EmrFieldGeneratorComponent {
  readonly model = input.required<FieldGeneratorViewModel>();
  readonly headingId = input<string>('emr-field-generator-heading');
  readonly idPrefix = input<string>('');
  readonly labels = input<Partial<EmrFieldGeneratorLabels>>({});

  readonly intent = output<FieldGeneratorIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private isFocusWithin = false;

  readonly terminologyRoles = AUTHORING_TERMINOLOGY_ROLES;
  readonly typeOptions = AUTHORING_FIELD_TYPE_OPTIONS;
  readonly spanOptions = AUTHORING_SPAN_OPTIONS;
  optionValue = '';
  optionLabel = '';

  protected readonly text = computed(() => ({ ...FIELD_GENERATOR_DEFAULTS, ...this.labels() }));
  protected readonly effectiveReadOnly = computed(() => !!this.model().readOnly);
  protected readonly resolvedHeadingId = computed(() =>
    resolveAuthoringId(this.idPrefix(), this.headingId().trim() || 'emr-field-generator-heading'),
  );
  protected readonly validationEditorModel = computed<ValidationRuleEditorViewModel>(() => ({
    rules: this.model().draft.validationRules,
    readOnly: this.effectiveReadOnly(),
  }));
  protected readonly previewField = computed<ClinicalFieldDefinition>(() =>
    toPreviewFieldDefinition(this.model().draft, this.text().untitledField),
  );
  protected readonly previewState = computed<ClinicalFieldState>(() => ({
    value: this.previewValue(),
  }));
  protected readonly errorEntries = computed<[string, string][]>(() =>
    Object.entries(this.model().validationErrors ?? {}),
  );

  id(suffix: string): string {
    return `${this.resolvedHeadingId()}-${suffix}`;
  }

  fieldError(...keys: string[]): string | undefined {
    const errs = this.model().validationErrors ?? {};
    for (const k of keys) {
      if (errs[k]) return errs[k];
    }
    return undefined;
  }

  terminologyModel(role: TerminologyBindingRole): TerminologySearchViewModel {
    const m = this.model();
    return {
      role,
      sources: m.sources,
      search: m.terminologySearches[role],
      bindings: filterBindingsByRole(m.draft.terminologyBindings, role),
      readOnly: this.effectiveReadOnly(),
    };
  }

  emit(intent: FieldGeneratorIntent): void {
    if (!this.effectiveReadOnly()) {
      this.intent.emit(intent);
    }
  }

  saveRequested(): void {
    if (this.effectiveReadOnly() || this.model().saving) return;
    this.emit({ type: 'saveRequested' });
  }

  textVal(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
  }

  numberVal(event: Event): number | undefined {
    const value = this.textVal(event);
    return value === '' ? undefined : Number(value);
  }

  checkedVal(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  guardReadOnlySelect(event: Event, locked: boolean): void {
    if (locked) event.preventDefault();
  }

  guardReadOnlySelectKey(event: KeyboardEvent, locked: boolean): void {
    if (locked && [' ', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
    }
  }

  guardReadOnlyCheckbox(event: Event, locked: boolean): void {
    if (locked) event.preventDefault();
  }

  typeChanged(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.effectiveReadOnly()) {
      select.value = this.model().draft.type;
      return;
    }
    this.patch('type', select.value);
  }

  spanChanged(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.effectiveReadOnly()) {
      select.value = String(this.model().draft.span ?? 12);
      return;
    }
    this.patch('span', Number(select.value));
  }

  patch<K extends keyof FieldGeneratorViewModel['draft']>(key: K, value: unknown): void {
    this.emit({
      type: 'draftPatched',
      changes: { [key]: value } as Partial<FieldGeneratorViewModel['draft']>,
    });
  }

  optionValueChanged(event: Event): void {
    if (this.effectiveReadOnly()) return;
    this.optionValue = this.textVal(event);
  }

  optionLabelChanged(event: Event): void {
    if (this.effectiveReadOnly()) return;
    this.optionLabel = this.textVal(event);
  }

  addOption(): void {
    const value = this.optionValue.trim();
    const label = this.optionLabel.trim();
    if (!value || !label || this.effectiveReadOnly()) return;
    const options = [...(this.model().draft.options ?? []).filter(option => option.value !== value), { value, label }];
    this.patch('options', options);
    this.optionValue = '';
    this.optionLabel = '';
  }

  removeOption(value: string): void {
    if (this.effectiveReadOnly()) return;
    this.patch(
      'options',
      (this.model().draft.options ?? []).filter(option => option.value !== value),
    );
  }

  previewValue(): ClinicalFieldValue {
    return this.model().draft.defaultValue ?? null;
  }

  protected onFocusIn(): void {
    if (!this.isFocusWithin) {
      this.isFocusWithin = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.hostRef.nativeElement.contains(next)) return;
    if (this.isFocusWithin) {
      this.isFocusWithin = false;
      this.blurred.emit();
    }
  }
}
