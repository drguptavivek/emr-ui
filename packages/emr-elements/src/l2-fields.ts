import { html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import {
  DEFAULT_IDENTIFIER_ENTRY_LABELS,
  applySlotPreset,
  formatSlotReadout,
  fromClinicalFieldDefinition,
  isPresetActive,
  mergeFieldFrameMessages,
  normalizeFieldFrameLayout,
  setSlotAmount,
  toggleSlot,
  type AttachmentFieldIntent,
  type AttestationIntent,
  type AttestationViewModel,
  type ClinicalAssessmentStatus,
  type ClinicalAssessmentStatusOption,
  type ClinicalFieldDefinition,
  type ClinicalFieldState,
  type ClinicalFieldValue,
  type ClinicalOption,
  type CodedInputIntent,
  type CodedInputViewModel,
  type DoseSlot,
  type EmrAttachmentRef,
  type EmrCodedValue,
  type EmrFieldDefinition,
  type EmrFieldState,
  type EmrIdentifierEntryLabels,
  type EmrOption,
  type EmrPartialDate,
  type EmrSegmentedOption,
  type EmrSignatureStroke,
  type EmrTone,
  type EmrTreeNode,
  type EmrUploadedImageItem,
  type EmrValidationMessage,
  type EmrValueType,
  type EmrWidgetHint,
  type FieldFrameLayout,
  type IdentifierEntryIntent,
  type IdentifierEntryView,
  type PartialDateFieldIntent,
  type ScaleFieldIntent,
  type ScheduleAmountMode,
  type ScheduleSlotDefinition,
  type ScheduleSlotPreset,
  type ScheduleSlotSeed,
  type SignatureCaptureIntent,
} from '@drguptavivek/emr-controller';
import { EmrLitElement, defineEmrElement, emrShadowStyles } from './foundations.js';
import { registerL1Elements } from './l1-primitives.js';
import { renderEmrSvgIcon } from './icons.js';
import { registerL2ExtraElements } from './l2-fields-extra.js';

export * from './l2-fields-extra.js';

export type EmrTypedFieldDefinition =
  | ClinicalFieldDefinition
  | (EmrFieldDefinition & { readonly id?: string });

export type EmrTypedFieldModel =
  | ClinicalFieldState
  | (EmrFieldState & {
      readonly readOnly?: boolean;
      readonly disabled?: boolean;
      readonly required?: boolean;
      readonly warning?: string;
      readonly error?: string;
      readonly assessmentStatus?: ClinicalAssessmentStatus;
    });

let l2IdSequence = 0;
const nextL2Id = (prefix: string): string => `${prefix}-${++l2IdSequence}`;

const l2Styles = css`
  .frame-messages {
    display: grid;
    gap: 3px;
  }
  .slot-line {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: stretch;
  }
  .slot-tile {
    flex: 1 1 210px;
    min-width: 180px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
  }
  .slot-tile--on {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
  }
  .slot-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .slot-toggle-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0 10px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius-sm);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    text-align: left;
  }
  .slot-toggle-btn[aria-checked="true"],
  .slot-toggle-btn[aria-pressed="true"] {
    border-color: var(--emr-primary);
    background: var(--emr-surface);
    color: var(--emr-primary-contrast);
  }
  .slot-toggle-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .slot-amount-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .slot-unticked-pill {
    min-height: 38px;
    padding: 0 12px;
    border: 1px dashed var(--emr-border);
    border-radius: var(--emr-radius-sm);
    background: var(--emr-surface-soft);
    color: var(--emr-text-muted);
    font-size: var(--emr-text-sm);
    display: inline-flex;
    align-items: center;
  }
  .field-options {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .preset-btn {
    min-height: 44px;
    min-width: 44px;
  }
    flex-wrap: wrap;
    align-items: center;
  }
  .field-stack {
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  .coded-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .coded-chip {
    display: inline-flex;
    align-items: stretch;
    min-height: 44px;
    max-width: 100%;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
  }
  .coded-chip-body {
    display: grid;
    align-content: center;
    gap: 1px;
    padding: 5px 10px;
    min-width: 0;
  }
  .coded-chip-display {
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-bold);
    color: var(--emr-text);
  }
  .coded-chip-meta {
    font-size: var(--emr-text-xs);
    color: var(--emr-text-muted);
  }
  .coded-chip-remove {
    min-width: 44px;
    min-height: 44px;
    border: 0;
    border-left: 1px solid var(--emr-border);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-lg);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .frame-header {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .frame-unit {
    font-size: var(--emr-text-2xs);
    font-weight: 600;
    color: var(--emr-text-muted);
    padding: 1px 6px;
    border-radius: 999px;
    background: var(--emr-surface-soft);
    border: 1px solid var(--emr-border);
  }
  .frame-status-strip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
  }
  .frame-status-chip {
    min-height: 44px;
    min-width: 44px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid var(--emr-border);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: 600;
    cursor: pointer;
  }
  .frame-status-chip--selected {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft, var(--emr-surface-accent));
    color: var(--emr-primary);
  }
  .emr-field--horizontal {
    display: grid;
    grid-template-columns: minmax(110px, 160px) minmax(0, 1fr);
    column-gap: 16px;
    align-items: start;
  }
  .emr-field--horizontal .frame-control-col {
    display: grid;
    gap: 6px;
    min-width: 0;
  }
  .field-stack > * {
    min-width: 0;
    max-width: 100%;
  }
  @media (max-width: 480px) {
    .emr-field--horizontal {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 6px;
    }
  }
  .coded-chip-remove:hover {
    background: var(--emr-danger-soft);
    color: var(--emr-danger);
  }
  .status-select {
    width: auto;
    min-width: 160px;
    max-width: 100%;
  }
  .signatory-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .signatory-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
  }
  .signatory-name {
    font-size: var(--emr-text-md);
    font-weight: var(--emr-weight-bold);
    color: var(--emr-text);
  }
  .type-radio-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0 14px;
    border: 1px solid var(--emr-border);
    border-radius: 999px;
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .type-radio-btn[aria-checked="true"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
    font-weight: var(--emr-weight-semibold);
  }
  .type-radio-btn[aria-readonly="true"] {
    border-style: dashed;
    background: var(--emr-surface-soft);
    cursor: default;
  }
  .ident-radio-dot {
    width: 16px;
    height: 16px;
    border-radius: 999px;
    border: 1.5px solid currentColor;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }
  .ident-radio-dot-inner {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: currentColor;
  }
  .ident-row {
    display: flex;
    align-items: stretch;
    gap: 8px;
    flex-wrap: wrap;
  }
  .ident-input-wrap {
    position: relative;
    flex: 1 1 200px;
    min-width: 0;
    display: flex;
    align-items: center;
  }
  .ident-input {
    width: 100%;
    min-width: 0;
  }
  .ident-input--clearable {
    padding-right: 44px;
  }
  .ident-clear-btn {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 0;
    border-radius: 8px;
    color: var(--emr-text-muted);
    cursor: pointer;
  }
  .ident-clear-btn:hover {
    color: var(--emr-text);
  }
  .ident-normalised {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    font-size: var(--emr-text-sm);
    color: var(--emr-success);
    overflow-wrap: anywhere;
  }
`;

interface NormalizedFieldDef {
  readonly id: string;
  readonly label: string;
  readonly valueType: EmrValueType;
  readonly widget?: EmrWidgetHint;
  readonly placeholder: string;
  readonly hint: string;
  readonly required: boolean;
  readonly repeats: boolean;
  readonly readOnly: boolean;
  readonly defaultValue: ClinicalFieldValue;
  readonly unit: string;
  readonly precision?: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly rows: number;
  readonly anchors?: {
    readonly minLabel?: string;
    readonly midLabel?: string;
    readonly maxLabel?: string;
  };
  readonly optionTones?: Readonly<Record<number, EmrTone>>;
  readonly options: readonly ClinicalOption[];
  readonly treeNodes: readonly EmrTreeNode[];
  readonly mask: string;
  readonly assessmentStatusOptions: readonly ClinicalAssessmentStatusOption[];
  readonly contractDef: EmrFieldDefinition;
}

interface NormalizedFieldModel {
  readonly value: ClinicalFieldValue;
  readonly status?: ClinicalAssessmentStatus;
  readonly readOnly: boolean;
  readonly disabled: boolean;
  readonly requiredOverride?: boolean;
  readonly error: string;
  readonly warning: string;
  readonly info: string;
  readonly messages: readonly EmrValidationMessage[];
}

function isContractFieldDef(def: EmrTypedFieldDefinition): def is EmrFieldDefinition & { readonly id?: string } {
  return 'contract' in def && 'presentation' in def;
}

function isContractFieldState(model: EmrTypedFieldModel | undefined): model is EmrFieldState & {
  readonly readOnly?: boolean;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly warning?: string;
  readonly error?: string;
  readonly assessmentStatus?: ClinicalAssessmentStatus;
} {
  return Boolean(model && 'messages' in model && 'enabled' in model);
}

function normalizeFieldDef(def: EmrTypedFieldDefinition): NormalizedFieldDef {
  if (isContractFieldDef(def)) {
    const { contract, presentation } = def;
    return {
      id: def.id ?? contract.linkId,
      label: presentation.label,
      valueType: contract.valueType,
      widget: presentation.widget,
      placeholder: presentation.placeholder ?? '',
      hint: presentation.hint ?? presentation.instructions ?? '',
      required: contract.cardinality.min >= 1,
      repeats: contract.cardinality.max === null || contract.cardinality.max > 1,
      readOnly: Boolean(contract.readOnly),
      defaultValue: contract.defaultValue ?? null,
      unit: presentation.unitDisplay ?? contract.unit?.code ?? '',
      precision: presentation.precision,
      min: presentation.min,
      max: presentation.max,
      step: presentation.step,
      rows: presentation.rows ?? 3,
      anchors: presentation.anchors,
      optionTones: presentation.optionTones,
      options: presentation.options ?? [],
      treeNodes: presentation.treeNodes ?? [],
      mask: presentation.mask ?? '',
      assessmentStatusOptions: presentation.assessmentStatusOptions ?? [],
      contractDef: def,
    };
  }
  return {
    id: def.id,
    label: def.label,
    valueType: def.type,
    widget: def.widget,
    placeholder: def.placeholder ?? '',
    hint: def.hint ?? '',
    required: Boolean(def.required),
    repeats: def.type === 'multiselect',
    readOnly: false,
    defaultValue: null,
    unit: def.unit ?? '',
    precision: def.precision,
    min: def.min,
    max: def.max,
    step: def.step,
    rows: def.rows ?? 3,
    options: def.options ?? [],
    treeNodes: [],
    mask: '',
    assessmentStatusOptions: def.assessmentStatusOptions ?? [],
    contractDef: fromClinicalFieldDefinition(def),
  };
}

function normalizeFieldModel(model: EmrTypedFieldModel | undefined, defaultValue: ClinicalFieldValue): NormalizedFieldModel {
  if (!model) {
    return {
      value: defaultValue,
      readOnly: false,
      disabled: false,
      error: '',
      warning: '',
      info: '',
      messages: [],
    };
  }
  if (isContractFieldState(model)) {
    return {
      value: model.value,
      status: model.status ?? model.assessmentStatus,
      readOnly: Boolean(model.readOnly),
      disabled: Boolean(model.disabled) || !model.enabled,
      requiredOverride: model.required,
      error: model.error ?? '',
      warning: model.warning ?? '',
      info: '',
      messages: model.messages,
    };
  }
  return {
    value: model.value,
    status: model.assessmentStatus,
    readOnly: Boolean(model.readOnly),
    disabled: Boolean(model.disabled),
    requiredOverride: model.required,
    error: model.error ?? '',
    warning: model.warning ?? '',
    info: '',
    messages: [],
  };
}

function isPartialDateValue(value: ClinicalFieldValue): value is EmrPartialDate {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'value' in value &&
      'precision' in value &&
      typeof (value as EmrPartialDate).value === 'string',
  );
}

function isCodedValueObject(value: unknown): value is EmrCodedValue {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'code' in value &&
      'system' in value &&
      'display' in value,
  );
}

export class EmrFieldFrameElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2Styles];

  private readonly fallbackId = nextL2Id('emr-field-frame');

  @property({ type: String }) controlId = '';
  @property({ attribute: false }) definition?: ClinicalFieldDefinition;
  @property({ attribute: false }) model?: ClinicalFieldState;
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: Boolean }) labelNamesControl = false;
  @property({ type: String }) unit = '';
  @property({ type: String }) note = '';
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: String }) layout: FieldFrameLayout = 'vertical';
  @property({ type: String }) assessmentStatus?: ClinicalAssessmentStatus;
  @property({ attribute: false }) assessmentStatusOptions: readonly ClinicalAssessmentStatusOption[] = [];
  @property({ type: String }) hint = '';
  @property({ type: String }) info = '';
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';
  @property({ attribute: false }) messages: readonly EmrValidationMessage[] = [];
  @property({ type: Boolean }) required = false;

  override render() {
    const id = this.controlId || this.fallbackId;
    const labelId = `${id}-label`;
    const resolvedLabel = this.label || this.definition?.label || '';
    const resolvedRequired = this.required || Boolean(this.definition?.required);
    const resolvedReadOnly = this.readOnly;
    const resolvedHint = this.hint || this.definition?.hint || '';
    const resolvedUnit = this.showMetadata ? (this.unit || this.definition?.unit || '') : '';
    const resolvedStatus = this.assessmentStatus ?? this.model?.assessmentStatus;
    const resolvedOptions =
      this.assessmentStatusOptions.length > 0
        ? this.assessmentStatusOptions
        : (this.definition?.assessmentStatusOptions ?? []);
    const merged = mergeFieldFrameMessages(
      this.error || this.model?.error,
      this.warning || this.model?.warning,
      this.info,
      this.messages,
    );
    const layout = normalizeFieldFrameLayout(this.layout);
    const isHorizontal = layout === 'horizontal' || layout === 'inline';

    const describedIds: string[] = [];
    if (resolvedHint) describedIds.push(`${id}-hint`);
    if (this.note) describedIds.push(`${id}-note`);
    merged.forEach((_, idx) => describedIds.push(`${id}-msg-${idx}`));
    const describedBy = describedIds.join(' ');
    const showStrip =
      this.showMetadata && (Boolean(resolvedStatus) || (!resolvedReadOnly && resolvedOptions.length > 0));
    const matched = resolvedOptions.find((o) => o.value === resolvedStatus);
    const badgeLabel = matched?.label ?? (resolvedStatus ? String(resolvedStatus).replaceAll('-', ' ') : '');

    return html`<div
      class=${`emr-field${isHorizontal ? ' emr-field--horizontal' : ''}`}
      part="frame"
      role="group"
      data-readonly=${resolvedReadOnly ? 'true' : nothing}
      aria-labelledby=${!this.labelHidden && resolvedLabel ? labelId : nothing}
      aria-label=${this.labelHidden && resolvedLabel ? resolvedLabel : nothing}
      aria-describedby=${describedBy || nothing}
      aria-required=${!this.labelNamesControl ? String(resolvedRequired) : nothing}
    >
      ${!this.labelHidden && resolvedLabel
        ? html`<div class="frame-header">
            <label class="emr-label" id=${labelId} for=${this.labelNamesControl ? id : nothing}>
              ${resolvedLabel}${resolvedRequired ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
            </label>
            ${resolvedUnit ? html`<span class="frame-unit">${resolvedUnit}</span>` : nothing}
          </div>`
        : nothing}
      <div class="frame-control-col">
        <slot></slot>
        ${showStrip
          ? html`<div class="frame-status-strip">
              ${resolvedStatus
                ? html`<emr-badge .badge=${{ label: badgeLabel, tone: matched?.tone ?? 'neutral' }}></emr-badge>`
                : nothing}
              ${resolvedStatus && !resolvedReadOnly
                ? html`<button
                    type="button"
                    class="frame-status-chip"
                    @click=${() => this.emitIntent({ type: 'statusChangeRequested', status: undefined })}
                  >Clear</button>`
                : nothing}
              ${!resolvedReadOnly && resolvedOptions.length > 0
                ? resolvedOptions.map(
                    (opt) => html`<button
                      type="button"
                      role="radio"
                      aria-checked=${resolvedStatus === opt.value ? 'true' : 'false'}
                      class=${`frame-status-chip${resolvedStatus === opt.value ? ' frame-status-chip--selected' : ''}`}
                      @click=${() =>
                        this.emitIntent({
                          type: 'statusChangeRequested',
                          status: resolvedStatus === opt.value ? undefined : opt.value,
                        })}
                    >${opt.label}</button>`,
                  )
                : nothing}
            </div>`
          : nothing}
        ${describedIds.length > 0
          ? html`<div class="frame-messages">
              ${resolvedHint ? html`<span id=${`${id}-hint`} class="emr-hint">${resolvedHint}</span>` : nothing}
              ${this.note ? html`<span id=${`${id}-note`} class="emr-hint">${this.note}</span>` : nothing}
              ${merged.map((msg, idx) => {
                const cls = msg.severity === 'error' ? 'emr-error' : msg.severity === 'warning' ? 'emr-warning' : 'emr-info';
                const role = msg.severity === 'error' ? 'alert' : 'status';
                return html`<span id=${`${id}-msg-${idx}`} class=${cls} role=${role}>${msg.message}</span>`;
              })}
            </div>`
          : nothing}
      </div>
    </div>`;
  }
}

const BOOLEAN_CHOICE_OPTIONS: readonly EmrOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

export class EmrTypedFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2Styles];

  private readonly fallbackId = nextL2Id('emr-typed-field');

  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: String }) layout: FieldFrameLayout = 'vertical';
  @property({ attribute: false }) definition?: EmrTypedFieldDefinition;
  @property({ attribute: false }) model?: EmrTypedFieldModel;
  @property({ type: Boolean }) readOnly = false;

  @state() private searchQuery = '';
  @state() private searchOpen = false;

  private computeLocked(def: NormalizedFieldDef, state: NormalizedFieldModel): boolean {
    return this.readOnly || def.readOnly || state.readOnly || state.disabled;
  }

  private computeDisabled(state: NormalizedFieldModel): boolean {
    return state.disabled;
  }

  private change(def: NormalizedFieldDef, state: NormalizedFieldModel, value: ClinicalFieldValue): void {
    if (!this.computeLocked(def, state)) {
      this.emitValueChange(value);
    }
  }

  private onFocus = (): void => {
    this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
  };

  private onBlur = (): void => {
    this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
  };

  private selectChoiceOption(
    def: NormalizedFieldDef,
    state: NormalizedFieldModel,
    optionValue: string,
    single: boolean,
  ): void {
    if (this.computeLocked(def, state)) return;
    if (single) {
      if (def.valueType === 'coded') {
        const matched = def.options.find(o => o.value === optionValue);
        const system = def.contractDef.contract.terminology[0]?.concept?.system ?? 'urn:emr:local';
        this.change(
          def,
          state,
          matched ? { system, code: matched.value, display: matched.label } : null,
        );
      } else {
        this.change(def, state, optionValue);
      }
      return;
    }
    if (def.valueType === 'coded') {
      const current = Array.isArray(state.value)
        ? (state.value.filter(isCodedValueObject) as readonly EmrCodedValue[])
        : [];
      const exists = current.some(c => c.code === optionValue);
      if (exists) {
        this.change(def, state, current.filter(c => c.code !== optionValue));
      } else {
        const matched = def.options.find(o => o.value === optionValue);
        if (matched) {
          const system = def.contractDef.contract.terminology[0]?.concept?.system ?? 'urn:emr:local';
          this.change(def, state, [...current, { system, code: matched.value, display: matched.label }]);
        }
      }
      return;
    }
    const selected = Array.isArray(state.value)
      ? (state.value.filter((item): item is string => typeof item === 'string') as readonly string[])
      : [];
    this.change(
      def,
      state,
      selected.includes(optionValue)
        ? selected.filter(item => item !== optionValue)
        : [...selected, optionValue],
    );
  }

  private changeStatus(def: NormalizedFieldDef, state: NormalizedFieldModel, status: ClinicalAssessmentStatus | undefined): void {
    if (!this.computeLocked(def, state)) {
      this.dispatchEvent(new CustomEvent('statusChange', { detail: status, bubbles: true, composed: true }));
    }
  }

  private renderControl(def: NormalizedFieldDef, state: NormalizedFieldModel, id: string) {
    const locked = this.computeLocked(def, state);
    const modelDisabled = this.computeDisabled(state);
    const value = state.value;
    const label = def.label;
    const hasErr = Boolean(state.error || state.messages.some(m => m.severity === 'error'));
    const errFlag = hasErr ? state.error || 'Invalid' : '';
    const numericStep =
      def.step ??
      (def.valueType === 'integer'
        ? 1
        : Number((10 ** -(def.precision ?? 2)).toPrecision(12)));

    const forwardScalar = (event: CustomEvent<ClinicalFieldValue>) => {
      event.stopPropagation();
      this.change(def, state, event.detail);
    };

    if (def.valueType === 'custom') {
      return html`<slot name="custom"></slot>`;
    }

    if (def.widget === 'tree-select') {
      const strVal = typeof value === 'string' ? value : null;
      const arrIds = Array.isArray(value)
        ? (value.filter((x): x is string => typeof x === 'string') as readonly string[])
        : strVal
          ? [strVal]
          : [];
      return html`<emr-tree-select
        .controlId=${id}
        .label=${label}
        .labelHidden=${true}
        .placeholder=${def.placeholder || 'Select…'}
        .nodes=${def.treeNodes}
        .multiple=${def.repeats}
        .value=${strVal}
        .selectedIds=${arrIds}
        .error=${errFlag}
        .readOnly=${locked}
        .disabled=${modelDisabled}
        @valueChange=${forwardScalar}
        @focusin=${this.onFocus}
      ></emr-tree-select>`;
    }

    if (def.widget === 'combobox') {
      const strVal = typeof value === 'string' ? value : null;
      return html`<emr-combobox
        .controlId=${id}
        .label=${label}
        .labelHidden=${true}
        .options=${def.options}
        .value=${strVal}
        .placeholder=${def.placeholder || 'Select or type…'}
        .error=${errFlag}
        .readOnly=${locked}
        .disabled=${modelDisabled}
        @valueChange=${forwardScalar}
        @focusin=${this.onFocus}
      ></emr-combobox>`;
    }

    if (def.widget === 'tag-input') {
      const tags = Array.isArray(value)
        ? (value.filter((x): x is string => typeof x === 'string') as readonly string[])
        : typeof value === 'string' && value
          ? [value]
          : [];
      return html`<emr-tag-input
        .controlId=${id}
        .label=${label}
        .labelHidden=${true}
        .value=${tags}
        .suggestions=${def.options.map(o => o.label)}
        .placeholder=${def.placeholder || 'Add tag…'}
        .error=${errFlag}
        .readOnly=${locked}
        .disabled=${modelDisabled}
        @valueChange=${forwardScalar}
        @focusin=${this.onFocus}
      ></emr-tag-input>`;
    }

    if (def.widget === 'image-upload') {
      const imgItems = Array.isArray(value) ? (value as unknown as readonly EmrUploadedImageItem[]) : [];
      return html`<emr-image-upload
        .controlId=${id}
        .label=${label}
        .labelHidden=${true}
        .items=${imgItems}
        .multiple=${def.repeats}
        .error=${errFlag}
        .readOnly=${locked}
        .disabled=${modelDisabled}
        @valueChange=${(e: CustomEvent<readonly EmrUploadedImageItem[]>) => {
          e.stopPropagation();
          this.change(def, state, e.detail as unknown as ClinicalFieldValue);
        }}
        @focusin=${this.onFocus}
      ></emr-image-upload>`;
    }

    if (def.widget === 'slider') {
      const numVal = typeof value === 'number' ? value : null;
      return html`<emr-slider
        .controlId=${id}
        .label=${label}
        .labelHidden=${true}
        .value=${numVal}
        .min=${def.min ?? 0}
        .max=${def.max ?? 100}
        .step=${numericStep}
        .unit=${def.unit}
        .error=${errFlag}
        .readOnly=${locked}
        .disabled=${modelDisabled}
        @valueChange=${forwardScalar}
        @focusin=${this.onFocus}
      ></emr-slider>`;
    }

    if (def.widget === 'masked') {
      const strVal = typeof value === 'string' ? value : null;
      return html`<emr-masked-input
        .controlId=${id}
        .label=${label}
        .labelHidden=${true}
        .value=${strVal}
        .mask=${def.mask}
        .placeholder=${def.placeholder}
        .error=${errFlag}
        .readOnly=${locked}
        .disabled=${modelDisabled}
        @valueChange=${forwardScalar}
        @focusin=${this.onFocus}
      ></emr-masked-input>`;
    }

    if (def.widget === 'otp') {
      const strVal = typeof value === 'string' ? value : '';
      return html`<emr-otp-input
        .controlId=${id}
        .label=${label}
        .labelHidden=${true}
        .value=${strVal}
        .length=${def.max ?? 6}
        .error=${errFlag}
        .readOnly=${locked}
        .disabled=${modelDisabled}
        @valueChange=${forwardScalar}
        @focusin=${this.onFocus}
      ></emr-otp-input>`;
    }

    if (def.valueType === 'annotation' && def.widget !== 'signature') {
      return html`<slot name="custom"></slot>`;
    }

    if (def.widget === 'signature') {
      const strokes = Array.isArray(value) ? (value as readonly EmrSignatureStroke[]) : [];
      return html`<emr-signature-capture-field
        .controlId=${id}
        .labelHidden=${true}
        .model=${{
          label,
          strokes,
          readOnly: locked,
        }}
        @intent=${(e: CustomEvent<SignatureCaptureIntent>) => {
          e.stopPropagation();
          if (locked) return;
          if (e.detail.type === 'strokeAdded') {
            this.change(def, state, [...strokes, e.detail.stroke]);
          } else if (e.detail.type === 'clearRequested') {
            this.change(def, state, []);
          }
        }}
        @focusin=${this.onFocus}
      ></emr-signature-capture-field>`;
    }

    if (def.valueType === 'multiline' || (def.valueType === 'text' && def.widget === 'textarea')) {
      const v = typeof value === 'string' ? value : null;
      return html`<emr-textarea
        .controlId=${id}
        .label=${label}
        .labelHidden=${true}
        .rows=${def.rows}
        .value=${locked ? live(v) : v}
        .placeholder=${def.placeholder}
        .error=${errFlag}
        .readOnly=${locked}
        .disabled=${modelDisabled}
        @valueChange=${forwardScalar}
        @focusin=${this.onFocus}
      ></emr-textarea>`;
    }

    if (def.valueType === 'partial-date') {
      const pd = isPartialDateValue(value) ? value : null;
      return html`<emr-partial-date-field
        .controlId=${id}
        .labelHidden=${this.labelHidden}
        .layout=${this.layout}
        .showMetadata=${this.showMetadata}
        .readOnly=${locked}
        .model=${{
          label: def.label,
          value: pd,
          min: undefined,
          max: undefined,
          status: state.status,
          statusOptions: def.assessmentStatusOptions,
          hint: def.hint,
          messages: state.messages,
          required: state.requiredOverride ?? def.required,
          readOnly: locked,
        }}
        @intent=${(e: CustomEvent<PartialDateFieldIntent>) => {
          e.stopPropagation();
          if (locked) return;
          if (e.detail.type === 'valueChangeRequested') {
            this.change(def, state, e.detail.value);
          } else if (e.detail.type === 'statusChangeRequested') {
            this.changeStatus(def, state, e.detail.status);
          }
        }}
        @focusin=${this.onFocus}
      ></emr-partial-date-field>`;
    }

    if (def.valueType === 'scale') {
      const numVal = typeof value === 'number' ? value : null;
      return html`<emr-scale-field
        .controlId=${id}
        .labelHidden=${this.labelHidden}
        .layout=${this.layout}
        .showMetadata=${this.showMetadata}
        .readOnly=${locked}
        .model=${{
          label: def.label,
          variant: def.widget === 'vas' ? 'vas' : 'likert',
          min: def.min ?? 0,
          max: def.max ?? (def.widget === 'vas' ? 100 : 10),
          step: def.step,
          anchors: def.anchors,
          optionTones: def.optionTones,
          status: state.status,
          statusOptions: def.assessmentStatusOptions,
          hint: def.hint,
          messages: state.messages,
          required: state.requiredOverride ?? def.required,
          value: numVal,
          readOnly: locked,
          unit: def.unit,
        }}
        @intent=${(e: CustomEvent<ScaleFieldIntent>) => {
          e.stopPropagation();
          if (locked) return;
          if (e.detail.type === 'valueChangeRequested') {
            this.change(def, state, e.detail.value);
          } else if (e.detail.type === 'statusChangeRequested') {
            this.changeStatus(def, state, e.detail.status);
          }
        }}
        @focusin=${this.onFocus}
      ></emr-scale-field>`;
    }

    if (def.valueType === 'attachment') {
      const items = Array.isArray(value) ? (value as readonly EmrAttachmentRef[]) : [];
      return html`<emr-attachment-field
        .controlId=${id}
        .labelHidden=${this.labelHidden}
        .layout=${this.layout}
        .showMetadata=${this.showMetadata}
        .readOnly=${locked}
        .model=${{
          label: def.label,
          items,
          status: state.status,
          statusOptions: def.assessmentStatusOptions,
          hint: def.hint,
          messages: state.messages,
          required: state.requiredOverride ?? def.required,
          readOnly: locked,
        }}
        @intent=${(e: CustomEvent<AttachmentFieldIntent>) => {
          e.stopPropagation();
          if (locked) return;
          const detail = e.detail;
          if (detail.type === 'filesSelected') {
            const added: EmrAttachmentRef[] = detail.files.map((f, idx) => ({
              id: `${id}-att-${items.length + idx + 1}`,
              title: f.name,
              contentType: f.mimeType || 'application/octet-stream',
              sizeBytes: f.sizeBytes,
            }));
            this.change(def, state, [...items, ...added]);
          } else if (detail.type === 'itemRemoveRequested') {
            this.change(def, state, items.filter(item => item.id !== detail.id));
          } else if (detail.type === 'statusChangeRequested') {
            this.changeStatus(def, state, detail.status);
          }
        }}
        @focusin=${this.onFocus}
      ></emr-attachment-field>`;
    }

    if (def.valueType === 'integer' || def.valueType === 'decimal') {
      const numVal = typeof value === 'number' ? value : null;
      if (def.widget === 'stepper') {
        return html`<emr-numeric-stepper
          .controlId=${id}
          .label=${label}
          .labelHidden=${true}
          .value=${numVal}
          .min=${def.min}
          .max=${def.max}
          .step=${numericStep}
          .precision=${def.valueType === 'integer' ? 0 : def.precision}
          .unit=${def.unit}
          .error=${errFlag}
          .readOnly=${locked}
          .disabled=${modelDisabled}
          @valueChange=${forwardScalar}
          @focusin=${this.onFocus}
        ></emr-numeric-stepper>`;
      }
      if (def.widget === 'vas') {
        return html`<emr-vas
          .controlId=${id}
          .label=${label}
          .labelHidden=${true}
          .value=${numVal}
          .min=${def.min ?? 0}
          .max=${def.max ?? 100}
          .step=${numericStep}
          .anchors=${def.anchors}
          .error=${errFlag}
          .readOnly=${locked}
          .disabled=${modelDisabled}
          @valueChange=${forwardScalar}
          @focusin=${this.onFocus}
        ></emr-vas>`;
      }
      if (def.widget === 'likert') {
        return html`<emr-likert
          .controlId=${id}
          .label=${label}
          .labelHidden=${true}
          .value=${numVal}
          .min=${def.min ?? 0}
          .max=${def.max ?? 10}
          .anchors=${def.anchors}
          .optionTones=${def.optionTones}
          .error=${errFlag}
          .readOnly=${locked}
          .disabled=${modelDisabled}
          @valueChange=${forwardScalar}
          @focusin=${this.onFocus}
        ></emr-likert>`;
      }
      return html`<emr-number-input
        .controlId=${id}
        .label=${label}
        .labelHidden=${true}
        .mode=${def.valueType === 'integer' ? 'integer' : 'decimal'}
        .value=${locked ? live(numVal) : numVal}
        .min=${def.min}
        .max=${def.max}
        .step=${numericStep}
        .unit=${def.unit}
        .error=${errFlag}
        .readOnly=${locked}
        .disabled=${modelDisabled}
        @valueChange=${forwardScalar}
        @focusin=${this.onFocus}
      ></emr-number-input>`;
    }

    if (def.valueType === 'date' || def.valueType === 'time' || def.valueType === 'datetime') {
      const strVal = typeof value === 'string' ? value : null;
      if (def.valueType === 'date') {
        return html`<emr-date-input
          .controlId=${id}
          .label=${label}
          .labelHidden=${true}
          .value=${locked ? live(strVal) : strVal}
          .error=${errFlag}
          .readOnly=${locked}
          .disabled=${modelDisabled}
          @valueChange=${forwardScalar}
          @focusin=${this.onFocus}
        ></emr-date-input>`;
      }
      if (def.valueType === 'datetime') {
        return html`<emr-datetime-input
          .controlId=${id}
          .label=${label}
          .labelHidden=${true}
          .value=${locked ? live(strVal) : strVal}
          .error=${errFlag}
          .readOnly=${locked}
          .disabled=${modelDisabled}
          @valueChange=${forwardScalar}
          @focusin=${this.onFocus}
        ></emr-datetime-input>`;
      }
      return html`<emr-time-input
        .controlId=${id}
        .label=${label}
        .labelHidden=${true}
        .value=${locked ? live(strVal) : strVal}
        .error=${errFlag}
        .readOnly=${locked}
        .disabled=${modelDisabled}
        @valueChange=${forwardScalar}
        @focusin=${this.onFocus}
      ></emr-time-input>`;
    }

    if (def.valueType === 'boolean') {
      if (def.widget === 'toggle') {
        return html`<emr-toggle
          .controlId=${id}
          .label=${label}
          .labelHidden=${true}
          .checked=${value === true}
          .error=${errFlag}
          .readOnly=${locked}
          .disabled=${modelDisabled}
          @valueChange=${forwardScalar}
          @focusin=${this.onFocus}
        ></emr-toggle>`;
      }
      if (def.widget === 'segmented') {
        const segOpts: readonly EmrSegmentedOption[] = BOOLEAN_CHOICE_OPTIONS.map(o => ({
          value: o.value,
          label: o.label,
        }));
        return html`<emr-segmented-control
          .controlId=${id}
          .label=${label}
          .labelHidden=${true}
          .options=${segOpts}
          .value=${typeof value === 'boolean' ? String(value) : null}
          .error=${errFlag}
          .readOnly=${locked}
          .disabled=${modelDisabled}
          @valueChange=${(e: CustomEvent<string>) => {
            e.stopPropagation();
            this.change(def, state, e.detail === 'true');
          }}
          @focusin=${this.onFocus}
        ></emr-segmented-control>`;
      }
      if (def.widget === 'radio') {
        return html`<emr-radio-group
          .controlId=${id}
          .label=${label}
          .labelHidden=${true}
          .options=${BOOLEAN_CHOICE_OPTIONS}
          .value=${typeof value === 'boolean' ? String(value) : null}
          .error=${errFlag}
          .readOnly=${locked}
          .disabled=${modelDisabled}
          @valueChange=${(e: CustomEvent<string>) => {
            e.stopPropagation();
            this.change(def, state, e.detail === 'true');
          }}
          @focusin=${this.onFocus}
        ></emr-radio-group>`;
      }
      return html`<emr-checkbox
        .controlId=${id}
        .label=${label}
        .labelHidden=${true}
        .checked=${value === true}
        .error=${errFlag}
        .readOnly=${locked}
        .disabled=${modelDisabled}
        @valueChange=${forwardScalar}
        @focusin=${this.onFocus}
      ></emr-checkbox>`;
    }

    if (def.valueType === 'coded') {
      const codedSingle = isCodedValueObject(value) ? value : null;
      const codedMany = Array.isArray(value)
        ? (value.filter(isCodedValueObject) as readonly EmrCodedValue[])
        : codedSingle
          ? [codedSingle]
          : [];
      const selectedCode = codedSingle?.code ?? (typeof value === 'string' ? value : null);
      const selectedCodes = codedMany.length > 0
        ? codedMany.map(c => c.code)
        : Array.isArray(value)
          ? (value.filter((x): x is string => typeof x === 'string') as readonly string[])
          : [];

      if (def.options.length > 0 && def.widget !== 'search' && def.widget !== 'search-select') {
        if (def.widget === 'radio' && !def.repeats) {
          return html`<emr-radio-group
            .controlId=${id}
            .label=${label}
            .labelHidden=${true}
            .options=${def.options}
            .value=${selectedCode}
            .error=${errFlag}
            .readOnly=${locked}
            .disabled=${modelDisabled}
            @valueChange=${(e: CustomEvent<string>) => {
              e.stopPropagation();
              this.selectChoiceOption(def, state, e.detail, true);
            }}
            @focusin=${this.onFocus}
          ></emr-radio-group>`;
        }
        if (def.widget === 'segmented' && !def.repeats) {
          const segOpts: readonly EmrSegmentedOption[] = def.options.map(o => ({
            value: o.value,
            label: o.label,
            disabled: o.disabled,
          }));
          return html`<emr-segmented-control
            .controlId=${id}
            .label=${label}
            .labelHidden=${true}
            .options=${segOpts}
            .value=${selectedCode}
            .error=${errFlag}
            .readOnly=${locked}
            .disabled=${modelDisabled}
            @valueChange=${(e: CustomEvent<string>) => {
              e.stopPropagation();
              this.selectChoiceOption(def, state, e.detail, true);
            }}
            @focusin=${this.onFocus}
          ></emr-segmented-control>`;
        }
        if (def.widget === 'select' && !def.repeats) {
          return html`<emr-select
            .controlId=${id}
            .label=${label}
            .labelHidden=${true}
            .options=${def.options}
            .value=${selectedCode}
            .allowClear=${true}
            .invalid=${hasErr}
            .readOnly=${locked}
            .disabled=${modelDisabled}
            @valueChange=${(e: CustomEvent<string | null>) => {
              e.stopPropagation();
              if (!e.detail) {
                this.change(def, state, null);
              } else {
                this.selectChoiceOption(def, state, e.detail, true);
              }
            }}
            @focusin=${this.onFocus}
          ></emr-select>`;
        }
        if (def.widget === 'checkbox' && def.repeats) {
          return html`<emr-checkbox-group
            .controlId=${id}
            .label=${label}
            .labelHidden=${true}
            .options=${def.options}
            .value=${selectedCodes}
            .error=${errFlag}
            .readOnly=${locked}
            .disabled=${modelDisabled}
            @valueChange=${(e: CustomEvent<readonly string[]>) => {
              e.stopPropagation();
              const system = def.contractDef.contract.terminology[0]?.concept?.system ?? 'urn:emr:local';
              const mapped: EmrCodedValue[] = e.detail.flatMap(code => {
                const opt = def.options.find(o => o.value === code);
                return opt ? [{ system, code: opt.value, display: opt.label }] : [];
              });
              this.change(def, state, mapped);
            }}
            @focusin=${this.onFocus}
          ></emr-checkbox-group>`;
        }
        return html`<div
          class="field-options"
          role=${def.repeats ? 'group' : 'radiogroup'}
          aria-label=${label}
          @focusin=${this.onFocus}
        >
          ${def.options.map(option => {
            const pressed = def.repeats
              ? selectedCodes.includes(option.value)
              : selectedCode === option.value;
            return html`<button
              type="button"
              class="emr-btn emr-btn--secondary"
              aria-pressed=${String(pressed)}
              ?disabled=${locked || !!option.disabled}
              @click=${() => this.selectChoiceOption(def, state, option.value, !def.repeats)}
            >${option.label}</button>`;
          })}
        </div>`;
      }

      const system = def.contractDef.contract.terminology[0]?.concept?.system ?? 'urn:emr:local';
      const filteredConcepts: EmrCodedValue[] = def.options
        .filter(o => !this.searchQuery || o.label.toLowerCase().includes(this.searchQuery.toLowerCase()) || o.value.toLowerCase().includes(this.searchQuery.toLowerCase()))
        .map(o => ({ system, code: o.value, display: o.label }));

      return html`<emr-coded-input
        .controlId=${id}
        .labelHidden=${true}
        .model=${{
          definition: def.contractDef,
          value: def.repeats ? codedMany : codedSingle,
          query: this.searchQuery,
          options: filteredConcepts,
          open: this.searchOpen,
          loading: false,
          messages: [],
          readOnly: locked,
          emptyMessage: 'No matches',
        }}
        @intent=${(e: CustomEvent<CodedInputIntent>) => {
          e.stopPropagation();
          if (locked) return;
          const detail = e.detail;
          switch (detail.type) {
            case 'openRequested':
              this.searchOpen = true;
              break;
            case 'closeRequested':
              this.searchOpen = false;
              break;
            case 'queryChangeRequested':
              this.searchQuery = detail.query;
              this.searchOpen = true;
              break;
            case 'conceptSelected': {
              const selectedConcept = detail.concept;
              this.searchOpen = false;
              this.searchQuery = '';
              if (def.repeats) {
                const exists = codedMany.some(c => c.code === selectedConcept.code && c.system === selectedConcept.system);
                if (!exists) this.change(def, state, [...codedMany, selectedConcept]);
              } else {
                this.change(def, state, selectedConcept);
              }
              break;
            }
            case 'conceptRemoveRequested': {
              const { code: rmCode, system: rmSystem } = detail;
              if (def.repeats) {
                this.change(
                  def,
                  state,
                  codedMany.filter(c => !(c.code === rmCode && c.system === rmSystem)),
                );
              } else {
                this.change(def, state, null);
              }
              break;
            }
            default:
              break;
          }
        }}
        @focusin=${this.onFocus}
      ></emr-coded-input>`;
    }

    if (def.valueType === 'select' || def.valueType === 'multiselect') {
      const single = def.valueType === 'select';
      const strVal = typeof value === 'string' ? value : null;
      const arrVal = Array.isArray(value)
        ? (value.filter((x): x is string => typeof x === 'string') as readonly string[])
        : [];

      if (single && def.widget === 'radio') {
        return html`<emr-radio-group
          .controlId=${id}
          .label=${label}
          .labelHidden=${true}
          .options=${def.options}
          .value=${strVal}
          .error=${errFlag}
          .readOnly=${locked}
          .disabled=${modelDisabled}
          @valueChange=${forwardScalar}
          @focusin=${this.onFocus}
        ></emr-radio-group>`;
      }
      if (single && def.widget === 'segmented') {
        const segOpts: readonly EmrSegmentedOption[] = def.options.map(o => ({
          value: o.value,
          label: o.label,
          disabled: o.disabled,
        }));
        return html`<emr-segmented-control
          .controlId=${id}
          .label=${label}
          .labelHidden=${true}
          .options=${segOpts}
          .value=${strVal}
          .error=${errFlag}
          .readOnly=${locked}
          .disabled=${modelDisabled}
          @valueChange=${forwardScalar}
          @focusin=${this.onFocus}
        ></emr-segmented-control>`;
      }
      if (def.widget === 'search' || def.widget === 'search-select') {
        const filtered = def.options.filter(
          o => !this.searchQuery || o.label.toLowerCase().includes(this.searchQuery.toLowerCase()),
        );
        const selectedOpts: readonly EmrOption[] = single
          ? def.options.filter(o => o.value === strVal)
          : def.options.filter(o => arrVal.includes(o.value));
        return html`<emr-search-select
          .controlId=${id}
          .label=${label}
          .labelHidden=${true}
          .placeholder=${def.placeholder || 'Search…'}
          .query=${this.searchQuery}
          .options=${filtered}
          .selected=${selectedOpts}
          .multiple=${!single}
          .open=${this.searchOpen}
          .error=${errFlag}
          .readOnly=${locked}
          .disabled=${modelDisabled}
          @openRequested=${() => {
            if (!locked) this.searchOpen = true;
          }}
          @closeRequested=${() => {
            this.searchOpen = false;
          }}
          @queryChange=${(e: CustomEvent<string>) => {
            e.stopPropagation();
            if (!locked) {
              this.searchQuery = e.detail;
              this.searchOpen = true;
            }
          }}
          @optionSelected=${(e: CustomEvent<string>) => {
            e.stopPropagation();
            this.searchOpen = false;
            this.searchQuery = '';
            this.selectChoiceOption(def, state, e.detail, single);
          }}
          @selectionRemoved=${(e: CustomEvent<string>) => {
            e.stopPropagation();
            if (single) {
              this.change(def, state, null);
            } else {
              this.change(def, state, arrVal.filter(v => v !== e.detail));
            }
          }}
          @valueChange=${(e: Event) => e.stopPropagation()}
          @focusin=${this.onFocus}
        ></emr-search-select>`;
      }
      if (!single && def.widget === 'checkbox') {
        return html`<emr-checkbox-group
          .controlId=${id}
          .label=${label}
          .labelHidden=${true}
          .options=${def.options}
          .value=${arrVal}
          .error=${errFlag}
          .readOnly=${locked}
          .disabled=${modelDisabled}
          @valueChange=${(e: CustomEvent<readonly string[]>) => {
            e.stopPropagation();
            this.change(def, state, e.detail);
          }}
          @focusin=${this.onFocus}
        ></emr-checkbox-group>`;
      }
      if (single && (def.widget === 'select' || def.options.length > 6)) {
        return html`<emr-select
          .controlId=${id}
          .label=${label}
          .labelHidden=${true}
          .options=${def.options}
          .value=${strVal}
          .allowClear=${true}
          .invalid=${hasErr}
          .readOnly=${locked}
          .disabled=${modelDisabled}
          @valueChange=${forwardScalar}
          @focusin=${this.onFocus}
        ></emr-select>`;
      }
      return html`<div
        class="field-options"
        role=${single ? 'radiogroup' : 'group'}
        aria-label=${label}
        @focusin=${this.onFocus}
      >
        ${def.options.map(option => {
          const pressed = single ? value === option.value : arrVal.includes(option.value);
          return html`<button
            type="button"
            class="emr-btn emr-btn--secondary"
            aria-pressed=${String(pressed)}
            ?disabled=${locked || !!option.disabled}
            @click=${() => this.selectChoiceOption(def, state, option.value, single)}
          >${option.label}</button>`;
        })}
      </div>`;
    }

    if (def.valueType === 'quantity') {
      const q =
        value && typeof value === 'object' && !Array.isArray(value) && 'value' in value && 'unit' in value
          ? (value as { value: number | null; unit: string })
          : null;
      const unitStr = q?.unit ?? def.unit;
      return html`<div class="field-stack">
        <emr-number-input
          .controlId=${id}
          .label=${label}
          .labelHidden=${true}
          .value=${locked ? live(q?.value ?? null) : q?.value ?? null}
          .min=${def.min}
          .max=${def.max}
          .step=${numericStep}
          .unit=${unitStr}
          .error=${errFlag}
          .readOnly=${locked}
          .disabled=${modelDisabled}
          @valueChange=${(e: CustomEvent<number | null>) => {
            e.stopPropagation();
            this.change(def, state, { value: e.detail, unit: unitStr });
          }}
          @focusin=${this.onFocus}
        ></emr-number-input>
      </div>`;
    }

    if (def.widget === 'search') {
      const strVal = typeof value === 'string' ? value : null;
      return html`<emr-search-input
        .controlId=${id}
        .label=${label}
        .labelHidden=${true}
        .value=${locked ? live(strVal) : strVal}
        .placeholder=${def.placeholder || 'Search…'}
        .error=${errFlag}
        .readOnly=${locked}
        .disabled=${modelDisabled}
        @valueChange=${forwardScalar}
        @focusin=${this.onFocus}
      ></emr-search-input>`;
    }

    const strVal = typeof value === 'string' ? value : '';
    return html`<emr-text-input
      .controlId=${id}
      .label=${label}
      .labelHidden=${true}
      .value=${locked ? live(strVal) : strVal}
      .placeholder=${def.placeholder}
      .error=${errFlag}
      .readOnly=${locked}
      .disabled=${modelDisabled}
      @valueChange=${forwardScalar}
      @focusin=${this.onFocus}
    ></emr-text-input>`;
  }

  override render() {
    if (!this.definition) return nothing;
    const def = normalizeFieldDef(this.definition);
    const state = normalizeFieldModel(this.model, def.defaultValue);
    const id = this.controlId || def.id || this.fallbackId;
    const locked = this.computeLocked(def, state);
    const required = state.requiredOverride ?? def.required;

    if (def.valueType === 'scale' || def.valueType === 'partial-date' || def.valueType === 'attachment') {
      return this.renderControl(def, state, id);
    }

    return html`<emr-field-frame
      .controlId=${id}
      .label=${def.label}
      .labelHidden=${this.labelHidden}
      .showMetadata=${this.showMetadata}
      .layout=${this.layout}
      .readOnly=${locked}
      .unit=${def.unit ?? ''}
      .assessmentStatus=${state.status}
      .assessmentStatusOptions=${def.assessmentStatusOptions}
      .hint=${def.hint}
      .info=${state.info}
      .warning=${state.warning}
      .error=${state.error}
      .messages=${state.messages}
      ?required=${required}
      @focusout=${this.onBlur}
      @intent=${(e: CustomEvent<{ type?: string; status?: ClinicalAssessmentStatus }>) => {
        if (e.detail?.type === 'statusChangeRequested') {
          this.changeStatus(def, state, e.detail.status);
        }
      }}
    >
      <div class="field-stack">
        ${this.renderControl(def, state, id)}
      </div>
    </emr-field-frame>`;
  }
}

export class EmrCodedInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2Styles];

  private readonly fallbackId = nextL2Id('emr-coded-input');

  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ attribute: false }) model?: CodedInputViewModel;

  @state() private activeIndex = -1;

  private get locked(): boolean {
    return this.readOnly || !!this.model?.readOnly || !!this.model?.definition?.contract?.readOnly;
  }

  private intent(intent: CodedInputIntent): void {
    if (!this.locked) this.emitIntent<CodedInputIntent>(intent);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    const m = this.model;
    if (!m || this.locked) return;
    if (event.key === 'Escape') {
      this.activeIndex = -1;
      this.intent({ type: 'closeRequested' });
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!m.open) {
        this.activeIndex = m.options.length > 0 ? 0 : -1;
        this.intent({ type: 'openRequested' });
        return;
      }
      if (m.options.length === 0) return;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      this.activeIndex =
        this.activeIndex < 0
          ? event.key === 'ArrowDown'
            ? 0
            : m.options.length - 1
          : (this.activeIndex + delta + m.options.length) % m.options.length;
      return;
    }
    if (event.key === 'Home' && m.open && m.options.length > 0) {
      event.preventDefault();
      this.activeIndex = 0;
      return;
    }
    if (event.key === 'End' && m.open && m.options.length > 0) {
      event.preventDefault();
      this.activeIndex = m.options.length - 1;
      return;
    }
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (m.open && this.activeIndex >= 0 && m.options[this.activeIndex]) {
      const picked = m.options[this.activeIndex]!;
      this.activeIndex = -1;
      this.intent({ type: 'conceptSelected', concept: picked });
      return;
    }
    const definition = m.definition;
    const valueSetCanonical = definition?.contract?.terminology?.find(
      b => b.role === 'answer-value-set',
    )?.valueSetCanonical;
    this.intent({
      type: 'searchRequested',
      query: m.query ?? '',
      ...(valueSetCanonical !== undefined ? { valueSetCanonical } : {}),
    });
  };

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || m.definition?.contract?.linkId || this.fallbackId;
    const label = m.definition?.presentation?.label ?? m.definition?.contract?.linkId ?? 'Coded value';
    const hint = m.definition?.presentation?.hint ?? '';
    const placeholder = m.definition?.presentation?.placeholder ?? 'Search by name or code';
    const required = (m.definition?.contract?.cardinality?.min ?? 0) >= 1;
    const concepts = Array.isArray(m.value) ? m.value : m.value ? [m.value] : [];
    const messages = m.messages ?? [];
    const hasError = messages.some(msg => msg.severity === 'error');
    const statusOptions = m.definition?.presentation?.assessmentStatusOptions ?? [];
    const statusOption = statusOptions.find(option => option.value === m.status);
    const showListbox = m.open && (m.options.length > 0 || m.loading) && !this.locked;
    const describedBy = hint || messages.length > 0 ? `${id}-message` : '';
    const activeOptId = showListbox && this.activeIndex >= 0 && m.options[this.activeIndex] ? `${id}-option-${this.activeIndex}` : '';

    return html`<div
      class="emr-field"
      role="group"
      aria-labelledby=${this.headingId || nothing}
      aria-label=${this.headingId ? nothing : label}
      aria-describedby=${describedBy || nothing}
    >
      ${!this.labelHidden
        ? html`<label class="emr-label" for=${`${id}-search`}>
            ${label}${required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
          </label>`
        : nothing}
      ${concepts.length > 0
        ? html`<ul class="coded-chips" aria-label=${`${label} selected`}>
            ${concepts.map(c => {
              const sysLabel = m.systemLabels?.[c.system] ?? c.system;
              return html`<li class="coded-chip">
                <span class="coded-chip-body">
                  <span class="coded-chip-display">${c.display}</span>
                  <span class="coded-chip-meta">${sysLabel} ${c.code}</span>
                </span>
                ${!this.locked
                  ? html`<button
                      type="button"
                      class="coded-chip-remove"
                      aria-label=${`Remove ${c.display}`}
                      @click=${() =>
                        this.intent({
                          type: 'conceptRemoveRequested',
                          code: c.code,
                          system: c.system,
                        })}
                    >${renderEmrSvgIcon('close', 16)}</button>`
                  : nothing}
              </li>`;
            })}
          </ul>`
        : this.locked && !m.status
          ? html`<p class="emr-hint">Not supplied</p>`
          : nothing}
      <input
        id=${`${id}-search`}
        class="emr-control"
        type="search"
        role="combobox"
        aria-expanded=${String(showListbox)}
        aria-controls=${`${id}-listbox`}
        aria-autocomplete="list"
        aria-activedescendant=${activeOptId || nothing}
        aria-invalid=${hasError ? 'true' : nothing}
        aria-describedby=${describedBy || nothing}
        ?readonly=${this.locked}
        aria-readonly=${this.locked ? 'true' : nothing}
        .value=${this.locked ? live(m.query) : m.query}
        placeholder=${placeholder}
        aria-label=${label}
        @focus=${() => this.intent({ type: 'openRequested' })}
        @blur=${(e: Event) => {
          (e.target as HTMLInputElement).value = this.model?.query ?? '';
        }}
        @input=${(e: Event) => {
          if (this.locked) {
            (e.target as HTMLInputElement).value = m.query;
            return;
          }
          this.activeIndex = -1;
          this.intent({ type: 'queryChangeRequested', query: (e.target as HTMLInputElement).value });
        }}
        @keydown=${this.onKeyDown}
      />
      ${!this.labelHidden && hint ? html`<span class="emr-hint">${hint}</span>` : nothing}
      ${m.loading ? html`<span class="emr-hint" role="status">Searching…</span>` : nothing}
      ${showListbox && m.options.length > 0
        ? html`<div id=${`${id}-listbox`} class="field-options" role="listbox" aria-label=${`${label} options`}>
            ${m.options.map(
              (c, i) => html`<button
                id=${`${id}-option-${i}`}
                type="button"
                role="option"
                aria-selected=${String(i === this.activeIndex)}
                class="emr-btn emr-btn--secondary"
                @mousedown=${(e: Event) => e.preventDefault()}
                @click=${() => {
                  this.activeIndex = -1;
                  this.intent({ type: 'conceptSelected', concept: c });
                }}
              >${c.display} (${c.code})</button>`,
            )}
          </div>`
        : nothing}
      ${m.open && !m.loading && !m.options.length && !this.locked
        ? html`<span class="emr-hint" role="status">${m.emptyMessage}</span>`
        : nothing}
      ${m.status || (statusOptions.length > 0 && !this.locked)
        ? html`<div class="field-options">
            ${m.status
              ? html`<span class=${`emr-badge emr-badge--${statusOption?.tone ?? 'neutral'}`} role="status">
                  ${statusOption?.label ?? m.status}
                </span>`
              : nothing}
            ${statusOptions.length > 0 && !this.locked
              ? html`<select
                  class="emr-control status-select"
                  aria-label=${`${label} assessment status`}
                  .value=${live(m.status ?? '')}
                  @change=${(e: Event) => {
                    const sel = e.target as HTMLSelectElement;
                    const raw = sel.value;
                    sel.value = m.status ?? '';
                    this.intent({
                      type: 'statusChangeRequested',
                      status: raw ? (raw as ClinicalAssessmentStatus) : undefined,
                    });
                  }}
                  @blur=${(e: Event) => {
                    (e.target as HTMLSelectElement).value = this.model?.status ?? '';
                  }}
                >
                  <option value="" ?selected=${!m.status}>Status not set</option>
                  ${statusOptions.map(
                    option => html`<option value=${option.value} ?selected=${m.status === option.value}>
                      ${option.label}
                    </option>`,
                  )}
                </select>`
              : nothing}
            ${m.status && !this.locked
              ? html`<button
                  type="button"
                  class="emr-btn emr-btn--ghost emr-btn--sm"
                  aria-label=${`Clear status: ${label}`}
                  @click=${() => this.intent({ type: 'statusChangeRequested', status: undefined })}
                >Clear status</button>`
              : nothing}
          </div>`
        : nothing}
      ${messages.length > 0
        ? html`<div id=${`${id}-message`} class="frame-messages">
            ${messages.map(message => {
              const cls =
                message.severity === 'error'
                  ? 'emr-error'
                  : message.severity === 'warning'
                    ? 'emr-warning'
                    : 'emr-info';
              const prefix =
                message.severity === 'error' ? 'Error: ' : message.severity === 'warning' ? 'Warning: ' : 'Note: ';
              return html`<span class=${cls} role=${message.severity === 'error' ? 'alert' : 'status'}>
                ${prefix}${message.message}
              </span>`;
            })}
          </div>`
        : nothing}
    </div>`;
  }
}

export class EmrAttestationElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2Styles];

  private readonly fallbackId = nextL2Id('emr-attestation');

  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) readOnly = false;
  @property({ attribute: false }) model?: AttestationViewModel;

  private get effectiveReadOnly(): boolean {
    return this.readOnly || Boolean(this.model?.readOnly);
  }

  private requestSign = (): void => {
    if (this.model && !this.effectiveReadOnly && this.model.canSign) {
      this.emitIntent<AttestationIntent>({ type: 'signRequested' });
    }
  };

  private requestAmend = (): void => {
    if (this.model && !this.effectiveReadOnly && this.model.canAmend) {
      this.emitIntent<AttestationIntent>({ type: 'amendRequested' });
    }
  };

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const titleId = this.headingId || `${id}-title`;
    const locked = this.effectiveReadOnly;
    const isUnsigned = m.signatories.length === 0 || m.signatories.every(s => !s.signedAtLabel);

    return html`<section class="emr-field" id=${id} role="region" aria-labelledby=${titleId}>
      ${m.title
        ? html`<h4 id=${titleId} style="margin:0;font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);letter-spacing:0.06em;text-transform:uppercase;color:var(--emr-text-muted);">${m.title}</h4>`
        : html`<h4 id=${titleId} class="sr-only">Signatures</h4>`}
      ${m.statement ? html`<p style="margin:0;font-size:var(--emr-text-md);color:var(--emr-text);overflow-wrap:anywhere;">${m.statement}</p>` : nothing}
      ${m.signatories.length > 0
        ? html`<ul class="signatory-list" aria-label="Signatories">
            ${m.signatories.map(
              s => html`<li class="signatory-row">
                ${locked
                  ? html`<span class="signatory-name" style="font-weight:var(--emr-weight-bold);color:var(--emr-text);">${s.displayName}</span>`
                  : html`<button
                      type="button"
                      class="signatory-name"
                      style="min-height:44px;min-width:44px;padding:0;border:0;background:none;color:var(--emr-text);font:inherit;font-weight:var(--emr-weight-bold);text-align:start;cursor:pointer;"
                      @click=${() => this.emitIntent<AttestationIntent>({ type: 'signatorySelected', signatoryId: s.id })}
                    >${s.displayName}</button>`}
                <span class="emr-muted">${s.roleLabel}</span>
                <span class=${`emr-badge emr-badge--${s.status.tone}`}>
                  ${s.status.label}${s.status.assistiveText ? html`<span class="sr-only"> ${s.status.assistiveText}</span>` : nothing}
                </span>
                <span class="emr-muted">Signed: ${s.signedAtLabel || 'Not supplied'}</span>
              </li>`,
            )}
          </ul>`
        : nothing}
      ${m.error
        ? html`<span id=${`${id}-error`} class="emr-error" role="alert"><strong>Not completed.</strong> ${m.error}</span>`
        : locked && isUnsigned
          ? html`<span class="emr-hint">Not completed.</span>`
          : nothing}
      ${!locked && (m.canSign || m.canAmend)
        ? html`<div class="field-options">
            ${m.canSign
              ? html`<button type="button" class="emr-btn" style="min-height:44px;min-width:44px;" @click=${this.requestSign}>${m.signLabel ?? 'Sign'}</button>`
              : nothing}
            ${m.canAmend
              ? html`<button type="button" class="emr-btn emr-btn--outline" style="min-height:44px;min-width:44px;" @click=${this.requestAmend}>
                  ${m.amendLabel ?? 'Amend'}
                </button>`
              : nothing}
          </div>`
        : nothing}
    </section>`;
  }
}

export class EmrScheduleSlotPickerElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2Styles];

  private readonly fallbackId = nextL2Id('emr-schedule-slot-picker');

  @property({ type: String }) label = 'When to take';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) required = false;
  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) readOnly = false;
  @property({ attribute: false }) slots: readonly ScheduleSlotDefinition[] = [];
  @property({ attribute: false }) presets: readonly ScheduleSlotPreset[] = [];
  @property({ attribute: false }) value: readonly DoseSlot[] | null = null;
  @property({ type: String }) unitLabel = '';
  @property({ type: String }) amountMode: ScheduleAmountMode = 'numeric';
  @property({ type: Number }) defaultAmount = 1;
  @property({ type: String }) defaultAmountLabel = '';

  @property({ type: String })
  get amountKind(): 'number' | 'label' {
    return this.amountMode === 'label' ? 'label' : 'number';
  }
  set amountKind(next: 'number' | 'label' | 'numeric') {
    this.amountMode = next === 'label' ? 'label' : 'numeric';
  }

  private get seed(): ScheduleSlotSeed {
    return this.amountMode === 'numeric'
      ? { amount: this.defaultAmount }
      : { amount: null, amountLabel: this.defaultAmountLabel };
  }

  private emit(next: readonly DoseSlot[]): void {
    if (!this.readOnly) this.emitValueChange(next);
  }

  private toggle(definition: ScheduleSlotDefinition, checked: boolean): void {
    this.emit(toggleSlot(this.value, this.slots, definition.id, checked, this.seed));
  }

  private updateSlotAmount(slotId: string, patch: ScheduleSlotSeed): void {
    this.emit(setSlotAmount(this.value, this.slots, slotId, patch));
  }

  private applyPreset(preset: ScheduleSlotPreset): void {
    this.emit(applySlotPreset(this.value, this.slots, preset, this.seed));
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const byId = new Map((this.value ?? []).map(slot => [slot.id, slot]));
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy = [this.hint ? hintId : null, this.error ? errorId : null].filter(Boolean).join(' ');

    return html`<div
      id=${id}
      class="emr-field"
      role="group"
      aria-label=${this.label}
      aria-invalid=${this.error ? 'true' : nothing}
      aria-required=${this.required ? 'true' : nothing}
      aria-describedby=${describedBy || nothing}
    >
      <div class="emr-header">
        <span class="emr-label">
          ${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
        </span>
        ${this.presets.length > 0 && !this.readOnly
          ? html`<div class="field-options" role="group" aria-label=${`${this.label} presets`}>
              ${this.presets.map(preset => {
                const active = isPresetActive(this.value, preset);
                return html`<button
                  type="button"
                  class="emr-btn emr-btn--secondary emr-btn--sm preset-btn"
                  aria-pressed=${String(active)}
                  @click=${() => this.applyPreset(preset)}
                >${active ? renderEmrSvgIcon('check', 14) : nothing}<span>${preset.label}</span></button>`;
              })}
            </div>`
          : nothing}
      </div>
      <div class="slot-line" role="list">
        ${this.slots.map(definition => {
          const current = byId.get(definition.id);
          const selected = !!current;
          const amountLabel = this.unitLabel
            ? `${definition.label} amount in ${this.unitLabel}`
            : `${definition.label} amount`;

          if (this.readOnly) {
            return html`<div role="listitem" class=${`slot-tile${selected ? ' slot-tile--on' : ''}`}>
              <div class="slot-header">
                <strong>${definition.label}</strong>
                ${definition.timeHint ? html`<span class="emr-muted">${definition.timeHint}</span>` : nothing}
              </div>
              <span class=${selected ? 'emr-label' : 'emr-muted'}>
                ${current ? formatSlotReadout(current, this.unitLabel || undefined) : 'Not selected'}
              </span>
            </div>`;
          }

          return html`<div role="listitem" class=${`slot-tile${selected ? ' slot-tile--on' : ''}`}>
            <div class="slot-header">
              <button
                id=${`${id}-${definition.id}`}
                type="button"
                role="checkbox"
                class="slot-toggle-btn"
                aria-checked=${String(selected)}
                aria-label=${definition.timeHint ? `${definition.label} (${definition.timeHint})` : definition.label}
                @click=${() => this.toggle(definition, !selected)}
              >
                ${selected ? renderEmrSvgIcon('check', 14) : nothing}
                <span>${definition.label}</span>
              </button>
              ${definition.timeHint ? html`<span class="emr-muted">${definition.timeHint}</span>` : nothing}
            </div>
            <div class="slot-amount-wrap">
              ${current
                ? this.amountMode === 'numeric'
                  ? html`<emr-number-input
                      .controlId=${`${id}-${definition.id}-amount`}
                      .label=${amountLabel}
                      .labelHidden=${true}
                      .min=${0}
                      .step=${0.5}
                      .value=${current.amount}
                      .unit=${this.unitLabel}
                      .readOnly=${this.readOnly}
                      @valueChange=${(e: CustomEvent<number | null>) => {
                        e.stopPropagation();
                        this.updateSlotAmount(definition.id, { amount: e.detail });
                      }}
                    ></emr-number-input>`
                  : html`<emr-text-input
                      .controlId=${`${id}-${definition.id}-amount`}
                      .label=${amountLabel}
                      .labelHidden=${true}
                      .value=${current.amountLabel ?? ''}
                      .readOnly=${this.readOnly}
                      @valueChange=${(e: CustomEvent<string | null>) => {
                        e.stopPropagation();
                        this.updateSlotAmount(definition.id, {
                          amount: null,
                          amountLabel: e.detail ?? '',
                        });
                      }}
                    ></emr-text-input>`
                : html`<span class="slot-unticked-pill">
                    0${this.unitLabel ? ` ${this.unitLabel}` : ''}
                  </span>`}
            </div>
          </div>`;
        })}
      </div>
      ${this.hint || this.error
        ? html`<div class="frame-messages" aria-live="polite">
            ${this.hint ? html`<span id=${hintId} class="emr-hint">${this.hint}</span>` : nothing}
            ${this.error ? html`<span id=${errorId} class="emr-error" role="alert">Error: ${this.error}</span>` : nothing}
          </div>`
        : nothing}
    </div>`;
  }
}

export class EmrIdentifierEntryElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2Styles];

  private readonly fallbackId = nextL2Id('emr-identifier-entry');

  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) readOnly = false;
  @property({ attribute: false }) labels?: Partial<EmrIdentifierEntryLabels>;
  @property({ attribute: false }) model?: IdentifierEntryView;

  private get locked(): boolean {
    return this.readOnly || Boolean(this.model?.readOnly);
  }

  private onRadioKeyDown = (event: KeyboardEvent): void => {
    const opts = this.model?.typeOptions ?? [];
    if (!opts.length) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const container = event.currentTarget as HTMLElement;
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button[role="radio"]'));
    const cur = buttons.indexOf(event.target as HTMLButtonElement);
    if (cur < 0) return;
    event.preventDefault();
    const nextIdx =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? opts.length - 1
          : (cur + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
    buttons[nextIdx]?.focus();
    const chosen = opts[nextIdx];
    if (chosen && !this.locked) {
      this.emitIntent<IdentifierEntryIntent>({ type: 'typeSelected', id: chosen.id });
    }
  };

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const locked = this.locked;
    const l = { ...DEFAULT_IDENTIFIER_ENTRY_LABELS, ...this.labels };
    const id = this.controlId || this.id || this.fallbackId;
    const descriptionId = `${id}-message`;
    const hasError = Boolean(m.error || m.messages?.some(msg => msg.severity === 'error'));
    const hasWarning = Boolean(m.warning || m.messages?.some(msg => msg.severity === 'warning'));
    const hasMessage = Boolean(m.error || m.warning || m.hint || m.messages?.length);
    const hasSelectedType = Boolean(m.selectedType && m.typeOptions?.some(o => o.id === m.selectedType));

    return html`<emr-field-frame
      .controlId=${id}
      .label=${m.label}
      .labelNamesControl=${true}
      .required=${!!m.required}
      .readOnly=${locked}
      .hint=${m.hint ?? ''}
      .warning=${m.warning ?? ''}
      .error=${m.error ?? ''}
      .messages=${m.messages ?? []}
    >
      ${m.typeOptions && m.typeOptions.length > 0
        ? html`<div
            class="field-options"
            role="radiogroup"
            aria-label=${`${m.label}: ${l.identifierType}`}
            aria-readonly=${locked ? 'true' : nothing}
            @keydown=${this.onRadioKeyDown}
          >
            ${m.typeOptions.map((option, idx) => {
              const selected = m.selectedType === option.id;
              const tabStop = selected || (!hasSelectedType && idx === 0);
              return html`<button
                type="button"
                role="radio"
                class="type-radio-btn"
                aria-checked=${String(selected)}
                aria-readonly=${locked ? 'true' : nothing}
                tabindex=${tabStop ? '0' : '-1'}
                @click=${() => {
                  if (!this.locked) {
                    this.emitIntent<IdentifierEntryIntent>({ type: 'typeSelected', id: option.id });
                  }
                }}
              >
                <span class="ident-radio-dot" aria-hidden="true">
                  ${selected ? html`<span class="ident-radio-dot-inner"></span>` : nothing}
                </span>
                <span>${option.label}</span>
              </button>`;
            })}
          </div>`
        : nothing}
      <div class="ident-row">
        <div class="ident-input-wrap">
          <input
            id=${id}
            class=${`emr-control ident-input${m.clearable && m.value && !locked ? ' ident-input--clearable' : ''}`}
            type="text"
            autocapitalize="characters"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
            .value=${live(m.value)}
            .placeholder=${m.placeholder ?? ''}
            maxlength=${m.maxLength ?? nothing}
            ?readonly=${locked}
            aria-readonly=${locked ? 'true' : nothing}
            aria-required=${m.required ? 'true' : nothing}
            aria-label=${m.label}
            aria-invalid=${hasError ? 'true' : nothing}
            aria-describedby=${hasMessage ? descriptionId : nothing}
            data-warning=${!hasError && hasWarning ? 'true' : nothing}
            @input=${(event: Event) => {
              if (this.locked) {
                (event.target as HTMLInputElement).value = this.model?.value ?? '';
                return;
              }
              this.emitIntent<IdentifierEntryIntent>({
                type: 'valueChanged',
                raw: (event.target as HTMLInputElement).value,
              });
            }}
            @focus=${() => this.emitIntent<IdentifierEntryIntent>({ type: 'focused' })}
            @blur=${(event: Event) => {
              (event.target as HTMLInputElement).value = this.model?.value ?? '';
              this.emitIntent<IdentifierEntryIntent>({ type: 'blurred' });
            }}
            @keydown=${(event: KeyboardEvent) => {
              if (!this.locked && event.key === 'Enter') {
                event.preventDefault();
                this.emitIntent<IdentifierEntryIntent>({
                  type: 'submitted',
                  raw: this.model?.value ?? '',
                });
              }
            }}
          />
          ${m.clearable && m.value && !locked
            ? html`<button
                type="button"
                class="ident-clear-btn"
                aria-label=${l.clear}
                @click=${(event: Event) => {
                  const row = (event.currentTarget as HTMLElement).closest('.ident-input-wrap');
                  const input = row?.querySelector('input');
                  this.emitIntent<IdentifierEntryIntent>({ type: 'valueChanged', raw: '' });
                  this.emitIntent<IdentifierEntryIntent>({ type: 'cleared' });
                  input?.focus();
                }}
              >${renderEmrSvgIcon('close', 16)}</button>`
            : nothing}
        </div>
        ${!locked
          ? html`<button
              type="button"
              class="emr-btn emr-btn--outline"
              aria-label=${`${l.scan}: ${m.label}`}
              @click=${() => {
                if (!this.locked) {
                  this.emitIntent<IdentifierEntryIntent>({ type: 'scanRequested' });
                }
              }}
            >${renderEmrSvgIcon('scanner', 16)}<span>${l.scan}</span></button>`
          : nothing}
      </div>
      ${m.normalisedValue
        ? html`<div class="ident-normalised" aria-live="polite">
            ${renderEmrSvgIcon('check', 14)}
            <span class="emr-sr-only">${l.normalised} </span>
            <span>${m.normalisedValue}</span>
          </div>`
        : nothing}
    </emr-field-frame>`;
  }
}

export function registerL2Elements(): void {
  registerL1Elements();
  defineEmrElement('emr-field-frame', EmrFieldFrameElement);
  defineEmrElement('emr-typed-field', EmrTypedFieldElement);
  defineEmrElement('emr-coded-input', EmrCodedInputElement);
  defineEmrElement('emr-attestation', EmrAttestationElement);
  defineEmrElement('emr-schedule-slot-picker', EmrScheduleSlotPickerElement);
  defineEmrElement('emr-identifier-entry', EmrIdentifierEntryElement);
  registerL2ExtraElements();
}
