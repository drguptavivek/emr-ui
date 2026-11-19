import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import type {
  ClinicalFieldDefinition,
  ClinicalFieldType,
  EhrTemplateIntent,
  EhrTemplateStatus,
  EmrGeneratedFieldDefinition,
  FieldGeneratorIntent,
  FieldGeneratorViewModel,
  FieldLibraryPickerIntent,
  FieldLibraryPickerViewModel,
  FieldValidationRule,
  TemplateArtifactFormat,
  TemplateComposerIntent,
  TemplateComposerViewModel,
  TemplatePreviewIntent,
  TemplatePreviewViewModel,
  TerminologyBinding,
  TerminologyBindingRole,
  TerminologyBindingStrength,
  TerminologyConcept,
  TerminologyMappingRelationship,
  TerminologySearchIntent,
  TerminologySearchViewModel,
  ValidationRuleEditorIntent,
  ValidationRuleEditorViewModel,
} from '@drguptavivek/emr-controller';
import { EmrLitElement, defineEmrElement, emrShadowStyles } from './foundations.js';
import { renderEmrSvgIcon, type EmrLitIconName } from './icons.js';
import { registerL2Elements } from './l2-fields.js';
import { registerL3Elements } from './l3-structures.js';

const authoringStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    max-width: 100%;
    color: var(--emr-text);
    font-family: var(--emr-font-family);
  }
  .authoring-surface { display: grid; gap: 16px; min-width: 0; max-width: 100%; }
  .authoring-card {
    display: grid;
    gap: 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius-lg, 12px);
    background: var(--emr-surface);
    padding: 18px;
    min-width: 0;
    max-width: 100%;
  }
  .authoring-preview-surface {
    padding: 18px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius-lg, 12px);
    background: var(--emr-surface-raised, var(--emr-surface));
    min-width: 0;
    max-width: 100%;
  }
  .authoring-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 16px;
    min-width: 0;
  }
  .authoring-header__copy { display: grid; gap: 4px; min-width: 0; flex: 1 1 220px; }
  .authoring-header__actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .authoring-eyebrow {
    margin: 0;
    color: var(--emr-text-muted);
    font-size: var(--emr-text-2xs);
    font-weight: var(--emr-weight-bold, 700);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .authoring-h1 { margin: 0; font-size: var(--emr-text-2xl); font-weight: var(--emr-weight-bold, 700); color: var(--emr-text); }
  .authoring-h2 { margin: 0; font-size: var(--emr-text-xl); font-weight: var(--emr-weight-bold, 700); color: var(--emr-text); }
  .authoring-h3 { margin: 0; font-size: var(--emr-text-lg); font-weight: var(--emr-weight-bold, 700); color: var(--emr-text); }
  .authoring-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(260px, 0.9fr);
    gap: 16px;
    align-items: start;
    min-width: 0;
  }
  .authoring-composer-layout {
    display: grid;
    grid-template-columns: minmax(250px, 320px) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
    min-width: 0;
  }
  .authoring-stack { display: grid; gap: 14px; min-width: 0; }
  .authoring-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 10px 12px;
    min-width: 0;
  }
  .authoring-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; }
  .authoring-row .emr-control { min-width: 140px; flex: 1 1 160px; }
  .authoring-list { display: grid; gap: 8px; min-width: 0; }
  .authoring-scroll { max-height: 280px; overflow: auto; }
  .authoring-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 12px;
    min-height: var(--emr-control-height, 44px);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface-raised, var(--emr-surface));
    color: var(--emr-text);
    text-align: left;
    min-width: 0;
    max-width: 100%;
  }
  button.authoring-item { width: 100%; cursor: pointer; font: inherit; }
  button.authoring-item:hover:not([aria-disabled="true"]),
  button.authoring-item:focus-visible { border-color: var(--emr-primary); }
  .authoring-item--selected { border-color: var(--emr-primary); }
  .authoring-item__select {
    display: grid;
    gap: 2px;
    min-width: 120px;
    min-height: var(--emr-control-height, 44px);
    padding: 6px 8px;
    flex: 1 1 160px;
    border: 0;
    background: transparent;
    color: var(--emr-text);
    text-align: left;
    cursor: pointer;
    font: inherit;
  }
  .authoring-item__copy { display: grid; gap: 3px; min-width: 0; flex: 1 1 160px; overflow-wrap: anywhere; }
  .authoring-item__meta { color: var(--emr-text-muted); font-size: var(--emr-text-xs); overflow-wrap:anywhere; }
  .authoring-muted { margin: 0; color: var(--emr-text-muted); font-size: var(--emr-text-sm); overflow-wrap: anywhere; }
  .authoring-error { margin: 0; color: var(--emr-danger); font-size: var(--emr-text-xs); overflow-wrap: anywhere; }
  .authoring-note {
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface-raised, var(--emr-surface-soft));
    color: var(--emr-text-muted);
    font-size: var(--emr-text-sm);
  }
  .authoring-note--error { background: var(--emr-danger-soft); color: var(--emr-danger); }
  .authoring-note--success { background: var(--emr-success-soft); color: var(--emr-success); }
  .authoring-issues {
    display: grid;
    gap: 6px;
    padding: 12px;
    border: 1px solid var(--emr-warning);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-warning-soft);
    color: var(--emr-warning);
    min-width: 0;
  }
  .authoring-issues ul { margin: 0; padding-left: 18px; font-size: var(--emr-text-sm); }
  .authoring-check {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: var(--emr-control-height, 44px);
    min-width: 44px;
    color: var(--emr-text-muted);
    font-size: var(--emr-text-md);
    cursor: pointer;
  }
  .authoring-check input[type="checkbox"] { width: 20px; height: 20px; margin: 0; accent-color: var(--emr-primary); }
  .authoring-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: var(--emr-control-height, 44px);
    padding: 2px 6px 2px 12px;
    border: 1px solid var(--emr-border);
    border-radius: 999px;
    background: var(--emr-surface-raised, var(--emr-surface));
    font-size: var(--emr-text-sm);
    max-width: 100%;
  }
  .emr-btn[aria-disabled="true"],
  .emr-control[aria-disabled="true"],
  .authoring-item[aria-disabled="true"],
  input[type="checkbox"][aria-disabled="true"] {
    opacity: 0.55;
    cursor: not-allowed;
  }
  textarea.emr-control { height: auto; min-height: 70px; padding: 10px 12px; resize: vertical; }
  pre {
    max-height: 240px;
    margin: 4px 0 0;
    overflow: auto;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-family: var(--emr-font-mono);
    font-size: var(--emr-text-xs);
  }
  @container (max-width: 720px) {
    .authoring-card, .authoring-preview-surface { padding: 14px; }
    .authoring-layout, .authoring-composer-layout, .authoring-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 720px) {
    .authoring-card, .authoring-preview-surface { padding: 14px; }
    .authoring-layout, .authoring-composer-layout, .authoring-grid { grid-template-columns: 1fr; }
  }
  :host-context(.emr-print) [data-emr-print="hide"] { display: none !important; }
  :host-context(.emr-print) .authoring-scroll,
  :host-context(.emr-print) pre { max-height: none !important; overflow: visible !important; }
  @media print {
    [data-emr-print="hide"] { display: none !important; }
    .authoring-scroll, pre { max-height: none !important; overflow: visible !important; }
  }
`;

const roleLabels: Record<TerminologyBindingRole, string> = {
  'question-meaning': 'Clinical meaning',
  'answer-value-set': 'Answer value set',
  unit: 'Unit / UCUM',
  'classification-mapping': 'Classification mapping',
};

const fieldTypeOptions: readonly { readonly value: ClinicalFieldType; readonly label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'multiline', label: 'Long text' },
  { value: 'integer', label: 'Integer' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'datetime', label: 'Date & time' },
  { value: 'select', label: 'Single choice' },
  { value: 'multiselect', label: 'Multiple choice' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'custom', label: 'Custom renderer' },
];

const statusOptions: readonly { readonly value: EhrTemplateStatus; readonly label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'retired', label: 'Retired' },
];

const strengthOptions: readonly { readonly value: TerminologyBindingStrength; readonly label: string }[] = [
  { value: 'required', label: 'Required' },
  { value: 'extensible', label: 'Extensible' },
  { value: 'preferred', label: 'Preferred' },
  { value: 'example', label: 'Example' },
];

const relationshipOptions: readonly { readonly value: TerminologyMappingRelationship; readonly label: string }[] = [
  { value: 'equivalent', label: 'Equivalent' },
  { value: 'wider', label: 'Wider' },
  { value: 'narrower', label: 'Narrower' },
  { value: 'related-to', label: 'Related' },
];

const ruleLabels: Record<FieldValidationRule['kind'], string> = {
  'min-length': 'Minimum length',
  'max-length': 'Maximum length',
  minimum: 'Minimum value',
  maximum: 'Maximum value',
  precision: 'Decimal precision',
  pattern: 'Pattern',
  'earliest-date': 'Earliest date',
  'latest-date': 'Latest date',
  'allowed-values': 'Allowed values',
  custom: 'Custom validator',
};
const ruleKinds = Object.keys(ruleLabels) as FieldValidationRule['kind'][];
const terminologyRoles = Object.keys(roleLabels) as TerminologyBindingRole[];
const artifactFormats: readonly TemplateArtifactFormat[] = [
  'internal-json', 'fhir-r4-questionnaire', 'fhir-r4-bundle', 'fhir-r4b-questionnaire', 'fhir-r5-questionnaire',
];
const artifactLabels: Record<TemplateArtifactFormat, string> = {
  'internal-json': 'Internal JSON',
  'fhir-r4-questionnaire': 'FHIR R4 Questionnaire',
  'fhir-r4-bundle': 'FHIR R4 Bundle',
  'fhir-r4b-questionnaire': 'FHIR R4B Questionnaire',
  'fhir-r5-questionnaire': 'FHIR R5 Questionnaire',
};

function resolveId(prefix: string, headingId: string, fallback: string): string {
  const cleanPrefix = prefix.trim();
  const base = headingId.trim() || fallback;
  return cleanPrefix ? `${cleanPrefix}-${base}` : base;
}

function isValidIsoDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function canAddRuleDraft(kind: FieldValidationRule['kind'], value: string, message: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (kind === 'custom') return message.trim().length > 0;
  if (kind === 'minimum' || kind === 'maximum') return Number.isFinite(Number(trimmed));
  if (kind === 'min-length' || kind === 'max-length' || kind === 'precision') {
    const n = Number(trimmed);
    return Number.isInteger(n) && n >= 0;
  }
  if (kind === 'pattern') {
    try {
      new RegExp(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  if (kind === 'earliest-date' || kind === 'latest-date') return isValidIsoDateInput(trimmed);
  if (kind === 'allowed-values') return trimmed.split(',').some(item => item.trim().length > 0);
  return true;
}

function guardSelectMouse(event: Event, locked: boolean): void {
  if (locked) event.preventDefault();
}

function guardSelectKey(event: KeyboardEvent, locked: boolean): void {
  if (locked && [' ', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
}

function guardCheckboxClick(event: Event, locked: boolean): void {
  if (locked) event.preventDefault();
}

abstract class EmrAuthoringBase<Model, Intent> extends EmrLitElement {
  @property({ attribute: false }) model?: Model;
  @property({ type: String }) headingId = '';
  @property({ type: String }) idPrefix = '';
  private isFocusedWithin = false;

  protected send(intent: Intent): void {
    this.emitIntent(intent);
  }

  protected authoringAction(
    label: string,
    intent: Intent,
    enabled: () => boolean = () => true,
    options: { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'; icon?: EmrLitIconName; ariaLabel?: string; hideOnPrint?: boolean } = {},
  ): TemplateResult {
    const isEnabled = enabled();
    const cls = options.variant ? `emr-btn emr-btn--${options.variant}` : 'emr-btn emr-btn--secondary';
    return html`<button
      type="button"
      class=${cls}
      aria-label=${options.ariaLabel ?? nothing}
      aria-disabled=${!isEnabled ? 'true' : nothing}
      data-emr-print=${options.hideOnPrint === false ? nothing : 'hide'}
      @click=${() => {
        if (enabled()) this.send(intent);
      }}
    >${options.icon ? renderEmrSvgIcon(options.icon, 16) : nothing}<span>${label}</span></button>`;
  }

  protected handleFocusIn = (): void => {
    if (!this.isFocusedWithin) {
      this.isFocusedWithin = true;
      this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
    }
  };

  protected handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null;
    if (next && (this.contains(next) || this.shadowRoot?.contains(next))) return;
    if (this.isFocusedWithin) {
      this.isFocusedWithin = false;
      this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
    }
  };
}

export class EmrFieldGeneratorElement extends EmrAuthoringBase<FieldGeneratorViewModel, FieldGeneratorIntent> {
  static override styles = [emrShadowStyles, authoringStyles];
  @state() private optionValue = '';
  @state() private optionLabel = '';

  private get locked(): boolean { return !!this.model?.readOnly; }
  private get resolvedHeadingId(): string { return resolveId(this.idPrefix, this.headingId, 'emr-field-generator-heading'); }
  private domId(suffix: string): string { return `${this.resolvedHeadingId}-${suffix}`; }
  private fieldError(...keys: string[]): string | undefined {
    const errs = this.model?.validationErrors ?? {};
    for (const k of keys) if (errs[k]) return errs[k];
    return undefined;
  }
  private sendIfEditable(intent: FieldGeneratorIntent): void {
    if (!this.locked) this.send(intent);
  }
  private patchDraft(changes: Partial<EmrGeneratedFieldDefinition>): void {
    this.sendIfEditable({ type: 'draftPatched', changes });
  }
  private text(event: Event): string { return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value; }
  private patchText(key: 'id' | 'label' | 'description' | 'instructions' | 'placeholder' | 'unit' | 'unitSystem' | 'unitCode', event: Event): void {
    this.patchDraft({ [key]: this.text(event) });
  }
  private patchNumber(key: 'span' | 'rows' | 'precision', event: Event): void {
    const value = this.text(event);
    this.patchDraft({ [key]: value === '' ? undefined : Number(value) });
  }
  private setOptionDraft(key: 'optionValue' | 'optionLabel', event: Event): void {
    if (this.locked) return;
    this[key] = this.text(event);
  }
  private addOption(): void {
    const model = this.model;
    if (!model || this.locked || !this.optionValue.trim() || !this.optionLabel.trim()) return;
    const options = [...(model.draft.options ?? []).filter(option => option.value !== this.optionValue.trim()), {
      value: this.optionValue.trim(), label: this.optionLabel.trim(),
    }];
    this.patchDraft({ options });
    this.optionValue = '';
    this.optionLabel = '';
  }
  private bindings(role: TerminologyBindingRole): readonly TerminologyBinding[] {
    return (this.model?.draft.terminologyBindings ?? []).filter(binding => binding.role === role);
  }
  private forwardChildIntent(event: CustomEvent<FieldGeneratorIntent>): void {
    event.stopPropagation();
    this.sendIfEditable(event.detail);
  }
  private toPreviewDefinition(draft: EmrGeneratedFieldDefinition): ClinicalFieldDefinition {
    return {
      id: draft.id || 'generated-field',
      label: draft.label || 'Untitled field',
      type: draft.type,
      required: draft.required,
      placeholder: draft.placeholder,
      hint: draft.instructions ?? draft.description,
      unit: draft.unit,
      precision: draft.precision,
      rows: draft.rows,
      options: draft.options,
      span: draft.span,
    };
  }

  protected override render() {
    const model = this.model;
    if (!model) return nothing;
    const draft = model.draft;
    const idErr = this.fieldError('field-id', 'id');
    const labelErr = this.fieldError('field-label', 'label');
    const unitSystemErr = this.fieldError('unitSystem');
    const unitCodeErr = this.fieldError('unitCode');
    const optionsErr = this.fieldError('options');

    return html`<section
      class="authoring-surface"
      aria-labelledby=${this.resolvedHeadingId}
      data-emr-print="expand"
      @focusin=${this.handleFocusIn}
      @focusout=${this.handleFocusOut}
    >
      <header class="authoring-header">
        <div class="authoring-header__copy">
          <p class="authoring-eyebrow">Reusable field authoring</p>
          <h2 class="authoring-h1" id=${this.resolvedHeadingId}>Create an EMR field</h2>
          <p class="authoring-muted">Define the presentation contract once, then reuse it in clinical forms and templates. APIs, terminology interpretation, FHIR mapping and persistence remain controller responsibilities.</p>
        </div>
        <div class="authoring-header__actions">
          <span class="authoring-muted" role="status">${model.dirty ? 'Unsaved changes' : 'Ready'}</span>
          ${this.authoringAction(model.saving ? 'Saving…' : 'Save field', { type: 'saveRequested' }, () => !this.locked && !model.saving, { variant: 'primary', icon: 'check' })}
        </div>
      </header>
      ${model.error ? html`<p class="authoring-note authoring-note--error" role="alert">${model.error}</p>` : nothing}
      <div class="authoring-layout">
        <div class="authoring-stack">
          <section class="authoring-card" aria-labelledby=${this.domId('identity-heading')}>
            <p class="authoring-eyebrow">Identity and display</p>
            <h3 class="authoring-h3" id=${this.domId('identity-heading')}>Field definition</h3>
            <div class="authoring-grid">
              <label class="emr-field">
                <span class="emr-label">Stable field ID</span>
                <input class="emr-control" id=${this.domId('field-id')} .value=${draft.id} ?readonly=${this.locked}
                  aria-invalid=${idErr ? 'true' : nothing} aria-describedby=${idErr ? this.domId('field-id-err') : nothing}
                  @input=${(event: Event) => this.patchText('id', event)}>
                ${idErr ? html`<span id=${this.domId('field-id-err')} class="authoring-error" role="alert">${idErr}</span>` : nothing}
              </label>
              <label class="emr-field">
                <span class="emr-label">Label</span>
                <input class="emr-control" id=${this.domId('field-label')} .value=${draft.label} ?readonly=${this.locked}
                  aria-invalid=${labelErr ? 'true' : nothing} aria-describedby=${labelErr ? this.domId('field-label-err') : nothing}
                  @input=${(event: Event) => this.patchText('label', event)}>
                ${labelErr ? html`<span id=${this.domId('field-label-err')} class="authoring-error" role="alert">${labelErr}</span>` : nothing}
              </label>
              <label class="emr-field"><span class="emr-label">Description</span><textarea class="emr-control" .value=${draft.description ?? ''} ?readonly=${this.locked} @input=${(event: Event) => this.patchText('description', event)}></textarea></label>
              <label class="emr-field"><span class="emr-label">Entry instructions</span><textarea class="emr-control" .value=${draft.instructions ?? ''} ?readonly=${this.locked} @input=${(event: Event) => this.patchText('instructions', event)}></textarea></label>
              <label class="emr-field"><span class="emr-label">Placeholder</span><input class="emr-control" .value=${draft.placeholder ?? ''} ?readonly=${this.locked} @input=${(event: Event) => this.patchText('placeholder', event)}></label>
            </div>
          </section>
          <section class="authoring-card" aria-labelledby=${this.domId('behaviour-heading')}>
            <p class="authoring-eyebrow">Behaviour</p>
            <h3 class="authoring-h3" id=${this.domId('behaviour-heading')}>Type, cardinality and layout</h3>
            <div class="authoring-grid">
              <label class="emr-field"><span class="emr-label">Value type</span>
                <select class="emr-control" .value=${draft.type} aria-disabled=${this.locked ? 'true' : nothing}
                  @mousedown=${(e: Event) => guardSelectMouse(e, this.locked)}
                  @keydown=${(e: KeyboardEvent) => guardSelectKey(e, this.locked)}
                  @change=${(event: Event) => {
                    const sel = event.target as HTMLSelectElement;
                    if (this.locked) { sel.value = draft.type; return; }
                    this.patchDraft({ type: sel.value as ClinicalFieldType });
                  }}>
                  ${fieldTypeOptions.map(opt => html`<option value=${opt.value} ?selected=${opt.value === draft.type}>${opt.label}</option>`)}
                </select>
              </label>
              <label class="emr-field"><span class="emr-label">Grid span</span>
                <select class="emr-control" .value=${String(draft.span ?? 12)} aria-disabled=${this.locked ? 'true' : nothing}
                  @mousedown=${(e: Event) => guardSelectMouse(e, this.locked)}
                  @keydown=${(e: KeyboardEvent) => guardSelectKey(e, this.locked)}
                  @change=${(event: Event) => {
                    const sel = event.target as HTMLSelectElement;
                    if (this.locked) { sel.value = String(draft.span ?? 12); return; }
                    this.patchNumber('span', event);
                  }}>
                  ${[3, 4, 6, 8, 9, 12].map(span => html`<option value=${span} ?selected=${span === (draft.span ?? 12)}>${span} / 12</option>`)}
                </select>
              </label>
              <label class="emr-field"><span class="emr-label">Text rows</span><input class="emr-control" type="number" min="1" max="12" .value=${draft.rows === undefined ? '' : String(draft.rows)} ?readonly=${this.locked} @input=${(event: Event) => this.patchNumber('rows', event)}></label>
              <label class="emr-field"><span class="emr-label">Decimal precision</span><input class="emr-control" type="number" min="0" max="8" .value=${draft.precision === undefined ? '' : String(draft.precision)} ?readonly=${this.locked} @input=${(event: Event) => this.patchNumber('precision', event)}></label>
            </div>
            <div class="authoring-row">
              <label class="authoring-check"><input type="checkbox" .checked=${draft.required} aria-disabled=${this.locked ? 'true' : nothing} @click=${(e: Event) => guardCheckboxClick(e, this.locked)} @change=${(event: Event) => { if (!this.locked) this.patchDraft({ required: (event.target as HTMLInputElement).checked }); }}> Required</label>
              <label class="authoring-check"><input type="checkbox" .checked=${draft.repeats} aria-disabled=${this.locked ? 'true' : nothing} @click=${(e: Event) => guardCheckboxClick(e, this.locked)} @change=${(event: Event) => { if (!this.locked) this.patchDraft({ repeats: (event.target as HTMLInputElement).checked }); }}> Repeatable</label>
              <label class="authoring-check"><input type="checkbox" .checked=${!!draft.readOnly} aria-disabled=${this.locked ? 'true' : nothing} @click=${(e: Event) => guardCheckboxClick(e, this.locked)} @change=${(event: Event) => { if (!this.locked) this.patchDraft({ readOnly: (event.target as HTMLInputElement).checked }); }}> Display only</label>
            </div>
          </section>
          ${draft.type === 'quantity' ? html`<section class="authoring-card" aria-label="Unit and precision">
            <p class="authoring-eyebrow">Measurement</p>
            <h3 class="authoring-h3">Unit and precision</h3>
            <div class="authoring-grid">
              <label class="emr-field"><span class="emr-label">Display unit</span><input class="emr-control" .value=${draft.unit ?? ''} ?readonly=${this.locked} @input=${(event: Event) => this.patchText('unit', event)}></label>
              <label class="emr-field"><span class="emr-label">Unit system</span><input class="emr-control" .value=${draft.unitSystem ?? ''} ?readonly=${this.locked} aria-invalid=${unitSystemErr ? 'true' : nothing} @input=${(event: Event) => this.patchText('unitSystem', event)}>${unitSystemErr ? html`<span class="authoring-error" role="alert">${unitSystemErr}</span>` : nothing}</label>
              <label class="emr-field"><span class="emr-label">Unit code</span><input class="emr-control" .value=${draft.unitCode ?? ''} ?readonly=${this.locked} aria-invalid=${unitCodeErr ? 'true' : nothing} @input=${(event: Event) => this.patchText('unitCode', event)}>${unitCodeErr ? html`<span class="authoring-error" role="alert">${unitCodeErr}</span>` : nothing}</label>
            </div>
          </section>` : nothing}
          ${draft.type === 'select' || draft.type === 'multiselect' ? html`<section class="authoring-card" aria-label="Choice values">
            <div class="authoring-header">
              <div><p class="authoring-eyebrow">Options</p><h3 class="authoring-h3">Choice values</h3></div>
              <span class="emr-badge">${draft.options?.length ?? 0} options</span>
            </div>
            <div class="authoring-grid">
              <label class="emr-field"><span class="emr-label">Option value</span><input class="emr-control" .value=${this.optionValue} ?readonly=${this.locked} @input=${(event: Event) => this.setOptionDraft('optionValue', event)}></label>
              <label class="emr-field"><span class="emr-label">Option label</span><input class="emr-control" .value=${this.optionLabel} ?readonly=${this.locked} @input=${(event: Event) => this.setOptionDraft('optionLabel', event)}></label>
            </div>
            <button type="button" class="emr-btn emr-btn--secondary" data-emr-print="hide"
              aria-disabled=${(this.locked || !this.optionValue.trim() || !this.optionLabel.trim()) ? 'true' : nothing}
              @click=${() => this.addOption()}>${renderEmrSvgIcon('plus', 16)}<span>Add option</span></button>
            ${optionsErr ? html`<p class="authoring-error" role="alert">${optionsErr}</p>` : nothing}
            <div class="authoring-row">${(draft.options ?? []).map(option => html`<span class="authoring-pill"><span>${option.label} <small class="authoring-muted">${option.value}</small></span>${this.authoringAction('Remove', { type: 'draftPatched', changes: { options: draft.options?.filter(item => item.value !== option.value) } }, () => !this.locked, { variant: 'ghost', icon: 'trash', ariaLabel: `Remove option ${option.label}` })}</span>`)}</div>
          </section>` : nothing}
          <emr-validation-rule-editor
            .model=${{ rules: draft.validationRules, readOnly: this.locked }}
            .headingId=${this.domId('validation-heading')}
            .idPrefix=${this.domId('validation')}
            @intent=${this.forwardChildIntent}
          ></emr-validation-rule-editor>
          <section class="authoring-card" aria-label="Terminology bindings">
            <p class="authoring-eyebrow">Terminology</p>
            <h3 class="authoring-h3">Bind external standards</h3>
            <p class="authoring-muted">Search configured services for LOINC, SNOMED CT, ICD-10, ICD-11 or UCUM concepts. The selected code is stored as a binding on this field.</p>
            <div class="authoring-stack">
              ${terminologyRoles.map(role => {
                const search = model.terminologySearches[role];
                return html`<emr-terminology-search
                  .model=${{ role, sources: model.sources, search, bindings: this.bindings(role), readOnly: this.locked }}
                  .headingId=${this.domId(`terminology-${role}`)}
                  @intent=${this.forwardChildIntent}
                ></emr-terminology-search>`;
              })}
            </div>
          </section>
        </div>
        <aside class="authoring-stack">
          <section class="authoring-card" aria-label="Field preview">
            <div class="authoring-header">
              <div><p class="authoring-eyebrow">Live preview</p><h3 class="authoring-h3">How it appears in a form</h3></div>
              <span class="emr-badge">${draft.type}</span>
            </div>
            <emr-typed-field
              .definition=${this.toPreviewDefinition(draft)}
              .model=${{ value: draft.defaultValue ?? null }}
              .controlId=${this.domId('generated-field-preview')}
              .readOnly=${true}
            ></emr-typed-field>
            <div style="border-top:1px solid var(--emr-border);padding-top:10px;display:grid;gap:2px">
              <strong style="font-size:var(--emr-text-sm)">FHIR-ready definition</strong>
              <span class="authoring-muted">FHIR Questionnaire / Bundle mapping is resolved by the template controller.</span>
            </div>
          </section>
          <section class="authoring-card" aria-label="Definition status">
            <p class="authoring-eyebrow">Definition status</p>
            ${Object.entries(model.validationErrors).length
              ? html`<ul class="authoring-error" role="alert" style="margin:0;padding-left:18px">${Object.entries(model.validationErrors).map(([path, message]) => html`<li><strong>${path}</strong>: ${message}</li>`)}</ul>`
              : html`<p class="authoring-note">No controller-reported errors.</p>`}
            ${model.savedFieldId ? html`<p class="authoring-note authoring-note--success" role="status">Saved field ${model.savedFieldId}.</p>` : nothing}
          </section>
        </aside>
      </div>
    </section>`;
  }
}

export class EmrTerminologySearchElement extends EmrAuthoringBase<TerminologySearchViewModel, TerminologySearchIntent> {
  static override styles = [emrShadowStyles, authoringStyles];
  private get locked(): boolean { return !!this.model?.readOnly; }
  private get resolvedHeadingId(): string { return resolveId(this.idPrefix, this.headingId, 'emr-terminology-heading'); }
  private sendIfEditable(intent: TerminologySearchIntent): void { if (!this.locked) this.send(intent); }
  private searchChanged(event: Event): void {
    if (!this.model || this.locked || !this.model.search?.sourceId) return;
    this.sendIfEditable({ type: 'terminologyQueryChanged', role: this.model.role, query: (event.target as HTMLInputElement).value });
  }
  private sourceChanged(event: Event): void {
    if (!this.model) return;
    const select = event.target as HTMLSelectElement;
    if (this.locked) { select.value = this.model.search?.sourceId ?? ''; return; }
    const sourceId = select.value;
    const source = this.model.sources.find(s => s.id === sourceId);
    if (sourceId && source && !source.available) { select.value = this.model.search?.sourceId ?? ''; return; }
    if (sourceId) this.sendIfEditable({ type: 'terminologySearchOpened', role: this.model.role, sourceId });
  }
  private searchRequested(): void { if (this.model && !this.locked && this.model.search?.sourceId && !this.model.search?.loading) this.sendIfEditable({ type: 'terminologySearchRequested', role: this.model.role }); }
  private selectConcept(concept: TerminologyConcept): void {
    if (!this.model || this.locked || concept.active === false) return;
    this.sendIfEditable({ type: 'terminologyConceptSelected', role: this.model.role, concept, strength: 'preferred', mappingRelationship: this.model.role === 'classification-mapping' ? 'related-to' : undefined });
  }
  private updateBinding(binding: TerminologyBinding, event: Event, propertyName: 'strength' | 'mappingRelationship'): void {
    if (!this.model || !binding.concept) return;
    const select = event.target as HTMLSelectElement;
    if (this.locked) {
      select.value = propertyName === 'strength' ? (binding.strength ?? 'preferred') : (binding.mappingRelationship ?? 'related-to');
      return;
    }
    const value = select.value;
    const changes = propertyName === 'strength'
      ? { strength: value as TerminologyBindingStrength }
      : { mappingRelationship: value as TerminologyMappingRelationship };
    this.send({ type: 'terminologyConceptSelected', role: this.model.role, concept: binding.concept, strength: changes.strength ?? binding.strength, mappingRelationship: changes.mappingRelationship ?? binding.mappingRelationship });
  }

  protected override render() {
    const model = this.model;
    if (!model) return nothing;
    const search = model.search;
    const role = roleLabels[model.role] ?? model.role;
    return html`<section
      class="authoring-card"
      aria-labelledby=${this.resolvedHeadingId}
      data-emr-print="expand"
      @focusin=${this.handleFocusIn}
      @focusout=${this.handleFocusOut}
    >
      <header class="authoring-header">
        <div>
          <p class="authoring-eyebrow">Terminology binding</p>
          <h3 class="authoring-h3" id=${this.resolvedHeadingId}>${role}</h3>
        </div>
        ${search?.loading ? html`<span class="authoring-muted" role="status">Searching…</span>` : nothing}
      </header>
      <div class="authoring-grid">
        <label class="emr-field"><span class="emr-label">Source</span>
          <select class="emr-control" .value=${search?.sourceId ?? ''} aria-disabled=${this.locked ? 'true' : nothing}
            @mousedown=${(e: Event) => guardSelectMouse(e, this.locked)}
            @keydown=${(e: KeyboardEvent) => guardSelectKey(e, this.locked)}
            @change=${this.sourceChanged}>
            <option value="">Choose terminology</option>
            ${model.sources.map(source => html`<option value=${source.id} ?selected=${source.id === search?.sourceId}>${source.label}${source.versionLabel ? ` · ${source.versionLabel}` : ''}${!source.available ? ' (Unavailable)' : ''}</option>`)}
          </select>
        </label>
        <label class="emr-field"><span class="emr-label">Search</span>
          <div class="authoring-row">
            <input class="emr-control" type="search" .value=${search?.query ?? ''} ?readonly=${this.locked || !search?.sourceId}
              aria-disabled=${(this.locked || !search?.sourceId) ? 'true' : nothing}
              @input=${this.searchChanged} @keydown=${(event: KeyboardEvent) => { if (event.key === 'Enter') this.searchRequested(); }}>
            ${this.authoringAction('Search', { type: 'terminologySearchRequested', role: model.role }, () => !this.locked && !!search?.sourceId && !search.loading, { variant: 'outline', icon: 'search' })}
          </div>
        </label>
      </div>
      ${search?.error ? html`<div class="authoring-note authoring-note--error authoring-row" role="alert"><span class="authoring-item__copy">${search.error}</span>${this.authoringAction('Retry', { type: 'terminologyRetryRequested', role: model.role }, () => !this.locked, { variant: 'ghost', icon: 'refresh' })}</div>` : nothing}
      ${search && !search.loading && search.sourceId && search.query && !search.options.length && !search.error ? html`<p class="authoring-note" role="status">No concepts found for this search.</p>` : nothing}
      ${search && search.options.length ? html`<div class="authoring-list authoring-scroll" role="group" aria-label=${`${role} search results`}>
        ${search.options.map(concept => html`<button type="button" class="authoring-item"
          aria-disabled=${(this.locked || concept.active === false) ? 'true' : nothing}
          @click=${() => this.selectConcept(concept)}>
          <span class="authoring-item__copy"><strong>${concept.display}</strong><span class="authoring-item__meta">${concept.code} · ${concept.system}${concept.version ? ` · ${concept.version}` : ''}${concept.active === false ? ' · Inactive' : ''}</span></span>
        </button>`)}
      </div>` : nothing}
      ${search && search.total > search.pageSize ? html`<div class="authoring-row" data-emr-print="hide"><span class="authoring-muted" style="margin-right:auto">Page ${search.page} · ${search.total} results</span>${this.authoringAction('Previous', { type: 'terminologyPageChanged', role: model.role, page: search.page - 1 }, () => !this.locked && search.page > 1, { variant: 'ghost', icon: 'chevron-left' })}${this.authoringAction('Next', { type: 'terminologyPageChanged', role: model.role, page: search.page + 1 }, () => !this.locked && search.page * search.pageSize < search.total, { variant: 'ghost', icon: 'chevron-right' })}</div>` : nothing}
      ${(model.bindings ?? []).map(binding => html`<div class="authoring-item">
        <div class="authoring-item__copy">
          <p class="authoring-eyebrow">Selected concept</p>
          <strong>${binding.concept?.display ?? binding.valueSetCanonical ?? binding.id}</strong>
          <span class="authoring-item__meta">${binding.concept?.code ?? ''}${binding.concept ? ` · ${binding.concept.system}` : ''}${binding.valueSetCanonical ? ` · ${binding.valueSetCanonical}` : ''}</span>
        </div>
        <div class="authoring-row">
          ${binding.concept ? html`<label class="emr-field"><span class="emr-label">Binding strength</span>
            <select class="emr-control" .value=${binding.strength ?? 'preferred'} aria-disabled=${this.locked ? 'true' : nothing}
              @mousedown=${(e: Event) => guardSelectMouse(e, this.locked)}
              @keydown=${(e: KeyboardEvent) => guardSelectKey(e, this.locked)}
              @change=${(event: Event) => this.updateBinding(binding, event, 'strength')}>
              ${strengthOptions.map(opt => html`<option value=${opt.value} ?selected=${opt.value === (binding.strength ?? 'preferred')}>${opt.label}</option>`)}
            </select>
          </label>
          ${model.role === 'classification-mapping' ? html`<label class="emr-field"><span class="emr-label">Relationship</span>
            <select class="emr-control" .value=${binding.mappingRelationship ?? 'related-to'} aria-disabled=${this.locked ? 'true' : nothing}
              @mousedown=${(e: Event) => guardSelectMouse(e, this.locked)}
              @keydown=${(e: KeyboardEvent) => guardSelectKey(e, this.locked)}
              @change=${(event: Event) => this.updateBinding(binding, event, 'mappingRelationship')}>
              ${relationshipOptions.map(opt => html`<option value=${opt.value} ?selected=${opt.value === (binding.mappingRelationship ?? 'related-to')}>${opt.label}</option>`)}
            </select>
          </label>` : nothing}` : nothing}
          ${this.authoringAction('Remove', { type: 'terminologyBindingRemoved', bindingId: binding.id }, () => !this.locked, { variant: 'ghost', icon: 'trash' })}
        </div>
      </div>`)}
    </section>`;
  }
}

export class EmrValidationRuleEditorElement extends EmrAuthoringBase<ValidationRuleEditorViewModel, ValidationRuleEditorIntent> {
  static override styles = [emrShadowStyles, authoringStyles];
  @state() private kind: FieldValidationRule['kind'] = 'minimum';
  @state() private value = '';
  @state() private message = '';

  private get locked(): boolean { return !!this.model?.readOnly; }
  private get resolvedHeadingId(): string { return resolveId(this.idPrefix, this.headingId, 'emr-validation-heading'); }
  private valueKind(kind: FieldValidationRule['kind'], value: string, message: string): FieldValidationRule | undefined {
    const trimmedVal = value.trim();
    const trimmedMsg = message.trim();
    const base = { id: '', message: trimmedMsg || undefined };
    if (kind === 'pattern') return { ...base, kind, value: trimmedVal, message: trimmedMsg || 'Value does not match the required pattern.' };
    if (kind === 'custom') return trimmedMsg ? { ...base, kind, customValidatorId: trimmedVal, message: trimmedMsg } : undefined;
    if (kind === 'allowed-values') return { ...base, kind, values: trimmedVal.split(',').map(item => item.trim()).filter(Boolean) };
    if (kind === 'earliest-date' || kind === 'latest-date') return { ...base, kind, value: trimmedVal };
    return { ...base, kind, value: Number(trimmedVal) };
  }
  private addRule(): void {
    if (!this.canAddRule) return;
    const rule = this.valueKind(this.kind, this.value, this.message);
    if (!rule) return;
    this.send({ type: 'validationRuleAdded', rule });
    this.value = '';
    this.message = '';
  }
  private get canAddRule(): boolean {
    return !this.locked && canAddRuleDraft(this.kind, this.value, this.message);
  }
  private setDraftValue(event: Event): void { if (!this.locked) this.value = (event.target as HTMLInputElement).value; }
  private setDraftMessage(event: Event): void { if (!this.locked) this.message = (event.target as HTMLInputElement).value; }
  private summary(rule: FieldValidationRule): string {
    if ('values' in rule) return rule.values.join(', ');
    if ('customValidatorId' in rule) return rule.customValidatorId;
    return String(rule.value);
  }

  protected override render() {
    const model = this.model;
    if (!model) return nothing;
    const valueLabel = this.kind === 'pattern' ? 'Regular expression' : this.kind === 'custom' ? 'Validator ID' : this.kind === 'allowed-values' ? 'Values' : this.kind.endsWith('-date') ? 'Date' : 'Value';
    const inputType = this.kind === 'earliest-date' || this.kind === 'latest-date'
      ? 'date'
      : this.kind === 'pattern' || this.kind === 'custom' || this.kind === 'allowed-values'
        ? 'text'
        : 'number';
    return html`<section
      class="authoring-card"
      aria-labelledby=${this.resolvedHeadingId}
      data-emr-print="expand"
      @focusin=${this.handleFocusIn}
      @focusout=${this.handleFocusOut}
    >
      <header class="authoring-header">
        <div>
          <p class="authoring-eyebrow">Validation</p>
          <h3 class="authoring-h3" id=${this.resolvedHeadingId}>Rules for this field</h3>
        </div>
        <span class="authoring-muted">${model.rules.length} ${model.rules.length === 1 ? 'rule' : 'rules'}</span>
      </header>
      <div class="authoring-grid">
        <label class="emr-field"><span class="emr-label">Rule type</span>
          <select class="emr-control" .value=${this.kind} aria-disabled=${this.locked ? 'true' : nothing}
            @mousedown=${(e: Event) => guardSelectMouse(e, this.locked)}
            @keydown=${(e: KeyboardEvent) => guardSelectKey(e, this.locked)}
            @change=${(event: Event) => {
              const sel = event.target as HTMLSelectElement;
              if (this.locked) { sel.value = this.kind; return; }
              this.kind = sel.value as FieldValidationRule['kind'];
              this.value = '';
            }}>
            ${ruleKinds.map(kind => html`<option value=${kind} ?selected=${kind === this.kind}>${ruleLabels[kind]}</option>`)}
          </select>
        </label>
        <label class="emr-field"><span class="emr-label">${valueLabel}</span><input class="emr-control" type=${inputType} .value=${this.value} ?readonly=${this.locked} @input=${this.setDraftValue}></label>
        <label class="emr-field"><span class="emr-label">Message</span><input class="emr-control" .value=${this.message} ?readonly=${this.locked} @input=${this.setDraftMessage}></label>
      </div>
      ${this.kind === 'custom' ? html`<p class="authoring-note">The controller resolves this validator ID. The UI does not execute clinical validation.</p>` : nothing}
      <button type="button" class="emr-btn emr-btn--outline" data-emr-print="hide"
        aria-disabled=${!this.canAddRule ? 'true' : nothing}
        @click=${() => this.addRule()}>${renderEmrSvgIcon('plus', 16)}<span>Add validation rule</span></button>
      ${model.rules.length ? html`<div class="authoring-list" role="list" aria-label="Current validation rules">
        ${model.rules.map(rule => html`<div class="authoring-item" role="listitem"><div class="authoring-item__copy"><strong>${ruleLabels[rule.kind]}</strong><span class="authoring-item__meta">${this.summary(rule)}</span>${rule.message ? html`<small class="authoring-item__meta">${rule.message}</small>` : nothing}</div>${this.authoringAction('Remove', { type: 'validationRuleRemoved', ruleId: rule.id }, () => !this.locked, { variant: 'ghost', icon: 'trash' })}</div>`)}
      </div>` : nothing}
    </section>`;
  }
}

export class EmrFieldLibraryPickerElement extends EmrAuthoringBase<FieldLibraryPickerViewModel, FieldLibraryPickerIntent> {
  static override styles = [emrShadowStyles, authoringStyles];
  private get locked(): boolean { return !!this.model?.readOnly; }
  private get resolvedHeadingId(): string { return resolveId(this.idPrefix, this.headingId, 'emr-field-library-heading'); }
  private queryChanged(event: Event): void {
    if (!this.locked) this.send({ type: 'fieldLibraryQueryChanged', query: (event.target as HTMLInputElement).value });
  }
  private terminologySummary(field: EmrGeneratedFieldDefinition): string {
    return field.terminologyBindings.map(binding => binding.concept?.code ?? binding.role).join(' · ');
  }

  protected override render() {
    const model = this.model;
    if (!model) return nothing;
    return html`<section
      class="authoring-card"
      aria-labelledby=${this.resolvedHeadingId}
      data-emr-print="expand"
      @focusin=${this.handleFocusIn}
      @focusout=${this.handleFocusOut}
    >
      <header class="authoring-header">
        <div class="authoring-header__copy">
          <p class="authoring-eyebrow">Field library</p>
          <h2 class="authoring-h3" id=${this.resolvedHeadingId}>Add reusable fields</h2>
          <p class="authoring-muted">Search the controller-supplied field catalogue, then add a field to the selected section.</p>
        </div>
        <span class="authoring-muted" role="status">${model.fields.length} available</span>
      </header>
      <label class="emr-field"><span class="emr-label">Search fields</span><input class="emr-control" type="search" placeholder="Search by label, type or terminology" .value=${model.query} ?readonly=${this.locked} @input=${this.queryChanged}></label>
      ${!model.selectedSectionId ? html`<p class="authoring-note" role="status">Select a template section before adding a field.</p>` : nothing}
      <div class="authoring-list authoring-scroll" role="list" aria-label="Available reusable fields">
        ${model.fields.map(field => html`<article class="authoring-item" role="listitem">
          <div class="authoring-item__copy"><strong>${field.label}</strong><span class="authoring-item__meta">${field.type}${field.required ? ' · Required' : ''}${field.repeats ? ' · Repeatable' : ''}</span>
            ${field.description ? html`<small class="authoring-item__meta">${field.description}</small>` : nothing}
            ${field.terminologyBindings.length ? html`<small class="authoring-item__meta">${this.terminologySummary(field)}</small>` : nothing}
          </div>
          ${this.authoringAction('Add', { type: 'fieldAdded', sectionId: model.selectedSectionId ?? '', field, placementId: '' }, () => !this.locked && !!model.selectedSectionId, { variant: 'outline', icon: 'plus' })}
        </article>`)}
        ${model.fields.length ? nothing : html`<p class="authoring-note" role="status">No reusable fields match this search.</p>`}
      </div>
    </section>`;
  }
}

export class EmrTemplatePreviewElement extends EmrAuthoringBase<TemplatePreviewViewModel, TemplatePreviewIntent> {
  static override styles = [emrShadowStyles, authoringStyles];
  @state() private format: TemplateArtifactFormat = 'fhir-r4-questionnaire';
  @state() private serializedDraft = '';
  private get locked(): boolean { return !!this.model?.readOnly; }
  private get resolvedHeadingId(): string { return resolveId(this.idPrefix, this.headingId, 'emr-template-preview-heading'); }
  private exportArtifact(): void {
    if (!this.locked && this.model && !this.model.loading) this.send({ type: 'artifactExportRequested', format: this.format });
  }
  private importArtifact(): void {
    if (!this.locked && this.model && !this.model.loading && this.serializedDraft.trim()) {
      this.send({ type: 'artifactImportRequested', format: this.format, serialized: this.serializedDraft });
    }
  }
  private formatChanged(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.locked || this.model?.loading) { select.value = this.format; return; }
    this.format = select.value as TemplateArtifactFormat;
  }
  private setSerializedDraft(event: Event): void {
    if (!this.locked && !this.model?.loading) this.serializedDraft = (event.target as HTMLTextAreaElement).value;
  }
  private acceptImport(): void {
    const model = this.model;
    if (!model || this.locked || model.loading || !model.canAcceptImport) return;
    this.send({ type: 'importAccepted' });
  }

  protected override render() {
    const model = this.model;
    if (!model) return nothing;
    const template = model.template;
    const canAccept = !!model.importIssues?.length && !model.importIssues.some(issue => issue.severity === 'error');
    return html`<section
      class="authoring-surface"
      aria-labelledby=${this.resolvedHeadingId}
      data-emr-print="expand"
      @focusin=${this.handleFocusIn}
      @focusout=${this.handleFocusOut}
    >
      <header class="authoring-header">
        <div class="authoring-header__copy">
          <p class="authoring-eyebrow">Reusable form</p>
          <h2 class="authoring-h2" id=${this.resolvedHeadingId}>${template.title || 'Untitled template'}</h2>
          <p class="authoring-muted">${template.description || 'A live, value-empty preview of the current template.'}</p>
        </div>
        <span class="emr-badge">${template.status}</span>
      </header>
      <div class="authoring-preview-surface">
        <emr-clinical-form
          .model=${{ ...model.preview, readOnly: true }}
          .idPrefix=${this.resolvedHeadingId}
          @intent=${(event: Event) => event.stopPropagation()}
        ></emr-clinical-form>
      </div>
      <section class="authoring-card" aria-labelledby=${`${this.resolvedHeadingId}-artifact`}>
        <header class="authoring-header">
          <div class="authoring-header__copy">
            <p class="authoring-eyebrow">Interoperability</p>
            <h3 class="authoring-h3" id=${`${this.resolvedHeadingId}-artifact`}>Import or export template artifacts</h3>
            <p class="authoring-muted">Serialization and FHIR mapping are delegated to the configured artifact controller.</p>
          </div>
          ${model.loading ? html`<span class="authoring-muted" role="status">Working…</span>` : nothing}
        </header>
        <div class="authoring-row">
          <label class="emr-field" style="flex:1 1 200px"><span class="emr-label">Format</span>
            <select class="emr-control" .value=${this.format} aria-disabled=${(this.locked || model.loading) ? 'true' : nothing}
              @mousedown=${(e: Event) => guardSelectMouse(e, this.locked || model.loading)}
              @keydown=${(e: KeyboardEvent) => guardSelectKey(e, this.locked || model.loading)}
              @change=${this.formatChanged}>
              ${artifactFormats.map(format => html`<option value=${format} ?selected=${format === this.format}>${artifactLabels[format]}</option>`)}
            </select>
          </label>
          <button type="button" class="emr-btn emr-btn--outline" data-emr-print="hide"
            aria-disabled=${(this.locked || model.loading) ? 'true' : nothing}
            @click=${() => this.exportArtifact()}>${renderEmrSvgIcon('download', 16)}<span>Export</span></button>
        </div>
        <label class="emr-field"><span class="emr-label">Serialized preview or import payload</span>
          <textarea class="emr-control" placeholder="Paste a JSON or FHIR artifact to import" .value=${this.serializedDraft} ?readonly=${this.locked || model.loading} @input=${this.setSerializedDraft}></textarea>
        </label>
        <div class="authoring-row" data-emr-print="hide">
          <button type="button" class="emr-btn emr-btn--outline"
            aria-disabled=${(this.locked || model.loading || !this.serializedDraft.trim()) ? 'true' : nothing}
            @click=${() => this.importArtifact()}>${renderEmrSvgIcon('upload', 16)}<span>Import</span></button>
          ${canAccept ? html`<button type="button" class="emr-btn emr-btn--outline"
            aria-disabled=${(this.locked || model.loading) ? 'true' : nothing}
            @click=${() => this.acceptImport()}>${renderEmrSvgIcon('check', 16)}<span>Accept import</span></button>` : nothing}
        </div>
        ${model.artifact ? html`<div class="authoring-card" role="status"><strong>${artifactLabels[model.artifact.format]}${model.artifact.fhirVersion ? ` · FHIR ${model.artifact.fhirVersion}` : ''}</strong><span class="authoring-muted">${model.artifact.serialized.length} characters · ${model.artifact.issues.length} issue(s)</span><pre>${model.artifact.serialized}</pre></div>` : nothing}
        ${model.importIssues?.length ? html`<div class="authoring-issues" role="alert"><strong class="authoring-row">${renderEmrSvgIcon('warning', 16)}<span>Review import issues</span></strong><ul>${model.importIssues.map(issue => html`<li><b>${issue.severity}</b> · ${issue.message}${issue.path ? ` · ${issue.path}` : ''}</li>`)}</ul></div>` : nothing}
        ${model.error ? html`<p class="authoring-note authoring-note--error" role="alert">${model.error}</p>` : nothing}
      </section>
    </section>`;
  }
}

export class EmrTemplateComposerElement extends EmrAuthoringBase<TemplateComposerViewModel, TemplateComposerIntent> {
  static override styles = [emrShadowStyles, authoringStyles];
  @state() private newSectionLabel = '';
  private get locked(): boolean { return !!this.model?.readOnly; }
  private get resolvedHeadingId(): string { return resolveId(this.idPrefix, this.headingId, 'emr-template-composer-heading'); }
  private domId(suffix: string): string { return `${this.resolvedHeadingId}-${suffix}`; }
  private sendTemplate(intent: EhrTemplateIntent): void {
    if (!this.locked || intent.type === 'sectionSelected' || intent.type === 'placementSelected') {
      this.send(intent as TemplateComposerIntent);
    }
  }
  private forwardChildIntent(event: CustomEvent<EhrTemplateIntent>): void {
    event.stopPropagation();
    this.sendTemplate(event.detail);
  }
  private selectedSection() { return this.model?.template.sections.find(section => section.id === this.model?.selectedSectionId); }
  private patchTemplate(changes: { title?: string; description?: string; locale?: string; status?: 'draft' | 'active' | 'retired' }): void {
    if (!this.locked) this.send({ type: 'templatePatched', changes });
  }
  private patchSection(sectionId: string, changes: { label?: string; description?: string }): void {
    if (!this.locked) this.send({ type: 'sectionPatched', sectionId, changes });
  }
  private setNewSectionLabel(event: Event): void {
    if (!this.locked) this.newSectionLabel = (event.target as HTMLInputElement).value;
  }
  private addSection(): void {
    const label = this.newSectionLabel.trim();
    if (this.locked || !label) return;
    this.send({ type: 'sectionAdded', section: { id: '', label, fields: [] } });
    this.newSectionLabel = '';
  }

  protected override render() {
    const model = this.model;
    if (!model) return nothing;
    const section = this.selectedSection();
    return html`<section
      class="authoring-surface"
      aria-labelledby=${this.resolvedHeadingId}
      data-emr-print="expand"
      @focusin=${this.handleFocusIn}
      @focusout=${this.handleFocusOut}
    >
      <header class="authoring-header">
        <div class="authoring-header__copy">
          <p class="authoring-eyebrow">Template authoring</p>
          <h1 class="authoring-h1" id=${this.resolvedHeadingId}>${model.template.title || 'Untitled EHR template'}</h1>
          <p class="authoring-muted">Compose reusable clinical forms from controller-defined fields. Terminology, validation, persistence and artifact mapping remain outside the UI.</p>
        </div>
        <div class="authoring-header__actions">
          <span class="emr-badge">${model.dirty ? 'Unsaved changes' : model.template.status}</span>
          ${this.authoringAction(model.saving ? 'Saving…' : 'Save template', { type: 'saveRequested' }, () => !this.locked && !model.saving, { variant: 'primary', icon: 'check' })}
        </div>
      </header>
      ${model.error ? html`<p class="authoring-note authoring-note--error" role="alert">${model.error}</p>` : nothing}
      ${model.loading ? html`<p class="authoring-muted" role="status">Loading template data…</p>` : nothing}
      <section class="authoring-card" aria-labelledby=${this.domId('identity-heading')}>
        <header class="authoring-header">
          <div><p class="authoring-eyebrow">Template metadata</p><h2 class="authoring-h3" id=${this.domId('identity-heading')}>Identity and lifecycle</h2></div>
          <span class="authoring-muted">Schema ${model.template.schemaVersion} · Revision ${model.template.revision}</span>
        </header>
        <div class="authoring-grid">
          <label class="emr-field"><span class="emr-label">Title</span><input class="emr-control" .value=${model.template.title} ?readonly=${this.locked} @input=${(event: Event) => this.patchTemplate({ title: (event.target as HTMLInputElement).value })}></label>
          <label class="emr-field"><span class="emr-label">Locale</span><input class="emr-control" .value=${model.template.locale} ?readonly=${this.locked} @input=${(event: Event) => this.patchTemplate({ locale: (event.target as HTMLInputElement).value })}></label>
          <label class="emr-field"><span class="emr-label">Status</span>
            <select class="emr-control" .value=${model.template.status} aria-disabled=${this.locked ? 'true' : nothing}
              @mousedown=${(e: Event) => guardSelectMouse(e, this.locked)}
              @keydown=${(e: KeyboardEvent) => guardSelectKey(e, this.locked)}
              @change=${(event: Event) => {
                const sel = event.target as HTMLSelectElement;
                if (this.locked) { sel.value = model.template.status; return; }
                this.patchTemplate({ status: sel.value as EhrTemplateStatus });
              }}>
              ${statusOptions.map(opt => html`<option value=${opt.value} ?selected=${opt.value === model.template.status}>${opt.label}</option>`)}
            </select>
          </label>
          <label class="emr-field"><span class="emr-label">Description</span><textarea class="emr-control" .value=${model.template.description ?? ''} ?readonly=${this.locked} @input=${(event: Event) => this.patchTemplate({ description: (event.target as HTMLTextAreaElement).value })}></textarea></label>
        </div>
      </section>
      <div class="authoring-composer-layout">
        <aside class="authoring-stack">
          <section class="authoring-card" aria-labelledby=${this.domId('sections-heading')}>
            <header class="authoring-header">
              <div><p class="authoring-eyebrow">Structure</p><h2 class="authoring-h3" id=${this.domId('sections-heading')}>Sections</h2></div>
              <span class="authoring-muted">${model.template.sections.length}</span>
            </header>
            <div class="authoring-row" data-emr-print="hide">
              <input class="emr-control" aria-label="New section label" placeholder="New section label" .value=${this.newSectionLabel} ?readonly=${this.locked} @input=${this.setNewSectionLabel}>
              <button type="button" class="emr-btn emr-btn--outline" aria-disabled=${(this.locked || !this.newSectionLabel.trim()) ? 'true' : nothing} @click=${() => this.addSection()}>${renderEmrSvgIcon('plus', 16)}<span>Add</span></button>
            </div>
            <nav class="authoring-list" aria-label="Template sections">
              ${model.template.sections.map((item, index) => html`<div class=${`authoring-item ${item.id === model.selectedSectionId ? 'authoring-item--selected' : ''}`}>
                <button type="button" class="authoring-item__select" aria-current=${item.id === model.selectedSectionId ? 'true' : nothing} @click=${() => this.sendTemplate({ type: 'sectionSelected', sectionId: item.id })}>
                  <strong>${item.label}</strong>
                  <span class="authoring-item__meta">${item.fields.length} ${item.fields.length === 1 ? 'field' : 'fields'}</span>
                </button>
                <div class="authoring-row" data-emr-print="hide">
                  ${this.authoringAction('Up', { type: 'sectionMoved', sectionId: item.id, direction: 'up' }, () => !this.locked && index > 0, { variant: 'ghost', icon: 'chevron-up', ariaLabel: `Move ${item.label} up` })}
                  ${this.authoringAction('Down', { type: 'sectionMoved', sectionId: item.id, direction: 'down' }, () => !this.locked && index < model.template.sections.length - 1, { variant: 'ghost', icon: 'chevron-down', ariaLabel: `Move ${item.label} down` })}
                </div>
              </div>`)}
              ${model.template.sections.length ? nothing : html`<p class="authoring-note">No sections yet. Add one to begin composing.</p>`}
            </nav>
          </section>
          <emr-field-library-picker
            .model=${{ fields: model.fieldLibrary, query: model.fieldLibraryQuery, selectedSectionId: model.selectedSectionId, readOnly: this.locked }}
            .headingId=${this.domId('field-library-heading')}
            @intent=${this.forwardChildIntent}
          ></emr-field-library-picker>
        </aside>
        <div class="authoring-stack">
          ${section ? html`<section class="authoring-card" aria-labelledby=${this.domId('section-editor-heading')}>
            <header class="authoring-header">
              <div><p class="authoring-eyebrow">Selected section</p><h2 class="authoring-h3" id=${this.domId('section-editor-heading')}>${section.label}</h2></div>
              ${this.authoringAction('Remove section', { type: 'sectionRemoved', sectionId: section.id }, () => !this.locked, { variant: 'danger', icon: 'trash' })}
            </header>
            <div class="authoring-grid">
              <label class="emr-field"><span class="emr-label">Label</span><input class="emr-control" .value=${section.label} ?readonly=${this.locked} @input=${(event: Event) => this.patchSection(section.id, { label: (event.target as HTMLInputElement).value })}></label>
              <label class="emr-field"><span class="emr-label">Description</span><textarea class="emr-control" .value=${section.description ?? ''} ?readonly=${this.locked} @input=${(event: Event) => this.patchSection(section.id, { description: (event.target as HTMLTextAreaElement).value })}></textarea></label>
            </div>
            <div class="authoring-list" role="list" aria-label="Fields in selected section">
              ${section.fields.map((placement, index) => html`<div role="listitem" class=${`authoring-item ${placement.id === model.selectedPlacementId ? 'authoring-item--selected' : ''}`}>
                <button type="button" class="authoring-item__select" aria-current=${placement.id === model.selectedPlacementId ? 'true' : nothing}
                  @click=${() => this.sendTemplate({ type: 'placementSelected', sectionId: section.id, placementId: placement.id })}>
                  <strong>${placement.field.label}</strong>
                  <span class="authoring-item__meta">${placement.field.type} · ${placement.field.id}${placement.field.terminologyBindings.length ? ' · Terminology bound' : ''}</span>
                </button>
                <div class="authoring-row" data-emr-print="hide">
                  ${this.authoringAction('Up', { type: 'fieldMoved', sectionId: section.id, placementId: placement.id, direction: 'up' }, () => !this.locked && index > 0, { variant: 'ghost', icon: 'chevron-up', ariaLabel: `Move ${placement.field.label} up` })}
                  ${this.authoringAction('Down', { type: 'fieldMoved', sectionId: section.id, placementId: placement.id, direction: 'down' }, () => !this.locked && index < section.fields.length - 1, { variant: 'ghost', icon: 'chevron-down', ariaLabel: `Move ${placement.field.label} down` })}
                  ${this.authoringAction('Remove', { type: 'fieldRemoved', sectionId: section.id, placementId: placement.id }, () => !this.locked, { variant: 'ghost', icon: 'trash', ariaLabel: `Remove ${placement.field.label}` })}
                </div>
              </div>`)}
              ${section.fields.length ? nothing : html`<p class="authoring-note">No fields in this section. Choose a reusable field from the library.</p>`}
            </div>
          </section>` : html`<section class="authoring-card"><p class="authoring-note" role="status">Select a section to edit it and add reusable fields.</p></section>`}
          <emr-template-preview
            .model=${model}
            .headingId=${this.domId('preview-heading')}
            @intent=${this.forwardChildIntent}
          ></emr-template-preview>
        </div>
      </div>
    </section>`;
  }
}

export function registerL6AuthoringSurfaces(): void {
  registerL2Elements();
  registerL3Elements();
  defineEmrElement('emr-field-generator', EmrFieldGeneratorElement);
  defineEmrElement('emr-terminology-search', EmrTerminologySearchElement);
  defineEmrElement('emr-validation-rule-editor', EmrValidationRuleEditorElement);
  defineEmrElement('emr-field-library-picker', EmrFieldLibraryPickerElement);
  defineEmrElement('emr-template-composer', EmrTemplateComposerElement);
  defineEmrElement('emr-template-preview', EmrTemplatePreviewElement);
}
