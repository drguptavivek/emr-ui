import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import type {
  EhrTemplateIntent,
  EhrTemplateViewModel,
  ClinicalFieldValue,
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
import { defineEmrElement, emrShadowStyles } from './foundations.js';
import { EmrModelElement } from './controlled-rendering.js';

const authoringStyles = css`
  .authoring-card { display:grid; gap:12px; border:1px solid var(--emr-border); border-radius:var(--emr-radius-lg,12px); background:var(--emr-surface); padding:16px; }
  .authoring-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:10px; }
  .authoring-row { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }
  .authoring-list { display:grid; gap:8px; }
  .authoring-item { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; padding:10px; border:1px solid var(--emr-border); border-radius:var(--emr-radius,8px); background:var(--emr-surface-raised,var(--emr-surface)); }
  .authoring-item__copy { display:grid; gap:3px; min-width:0; }
  .authoring-muted { color:var(--emr-text-muted); font-size:var(--emr-text-sm); }
  .authoring-error { color:var(--emr-danger); }
  .authoring-issues { display:grid; gap:6px; padding:12px; border-radius:var(--emr-radius,8px); background:var(--emr-warning-soft); }
  textarea.emr-control { height:auto; min-height:70px; padding:10px 12px; resize:vertical; }
  pre { max-height:260px; overflow:auto; white-space:pre-wrap; overflow-wrap:anywhere; }
`;

const roleLabels: Record<TerminologyBindingRole, string> = {
  'question-meaning': 'Clinical meaning',
  'answer-value-set': 'Answer value set',
  unit: 'Unit / UCUM',
  'classification-mapping': 'Classification mapping',
};

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

export class EmrFieldGeneratorElement extends EmrModelElement<FieldGeneratorViewModel, FieldGeneratorIntent> {
  static override styles = [emrShadowStyles, authoringStyles];
  @state() private optionValue = '';
  @state() private optionLabel = '';

  private get locked(): boolean { return !!this.model?.readOnly; }
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
  private removeOption(value: string): void {
    if (this.locked || !this.model) return;
    this.patchDraft({ options: (this.model.draft.options ?? []).filter(option => option.value !== value) });
  }
  private bindings(role: TerminologyBindingRole): readonly TerminologyBinding[] {
    return (this.model?.draft.terminologyBindings ?? []).filter(binding => binding.role === role);
  }
  private forwardChildIntent(event: CustomEvent<FieldGeneratorIntent>): void {
    event.stopPropagation();
    this.sendIfEditable(event.detail);
  }
  private renderDraftControl(draft: EmrGeneratedFieldDefinition): TemplateResult {
    const value = draft.defaultValue;
    if (draft.type === 'select') {
      return html`<select class="emr-control" .value=${typeof value === 'string' ? value : ''} disabled>
        <option value="">Choose an option</option>${(draft.options ?? []).map(option => html`<option value=${option.value}>${option.label}</option>`)}
      </select>`;
    }
    if (draft.type === 'multiselect') {
      const selected = Array.isArray(value) ? value : [];
      return html`<div class="authoring-row" role="group" aria-label=${draft.label}>
        ${(draft.options ?? []).map(option => html`<button class="emr-btn emr-btn--secondary" type="button" aria-pressed=${String(selected.includes(option.value))} disabled>${option.label}</button>`)}
      </div>`;
    }
    if (draft.type === 'boolean') return html`<label><input type="checkbox" disabled .checked=${value === true}> ${draft.label}</label>`;
    if (draft.type === 'multiline') return html`<textarea class="emr-control" rows=${draft.rows ?? 3} .value=${typeof value === 'string' ? value : ''} disabled></textarea>`;
    if (draft.type === 'quantity') {
      const quantity = value && typeof value === 'object' && 'value' in value ? value.value : '';
      return html`<div class="authoring-row"><input class="emr-control" type="number" .value=${quantity === null ? '' : String(quantity)} disabled>${draft.unit ? html`<span>${draft.unit}</span>` : nothing}</div>`;
    }
    const type = draft.type === 'integer' || draft.type === 'decimal' ? 'number' : draft.type === 'date' ? 'date' : draft.type === 'time' ? 'time' : draft.type === 'datetime' ? 'datetime-local' : 'text';
    const textValue = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
    return html`<input class="emr-control" type=${type} .value=${textValue} placeholder=${draft.placeholder ?? ''} disabled>`;
  }

  protected override render() {
    const model = this.model;
    if (!model) return nothing;
    const draft = model.draft;
    return this.panel('Field Generator', html`
      <header class="authoring-row">
        <span class="emr-badge">${model.dirty ? 'Unsaved changes' : 'Ready'}</span>
        ${this.action(model.saving ? 'Saving…' : 'Save field', { type: 'saveRequested' }, () => !this.locked && !model.saving)}
      </header>
      ${model.error ? html`<p class="authoring-error" role="alert">${model.error}</p>` : nothing}
      <section class="authoring-card" aria-label="Field definition">
        <h4 class="emr-title">Identity and display</h4>
        <div class="authoring-grid">
          <label class="emr-field">Stable field ID<input class="emr-control" .value=${draft.id} ?disabled=${this.locked} @input=${(event: Event) => this.patchText('id', event)}></label>
          <label class="emr-field">Label<input class="emr-control" .value=${draft.label} ?disabled=${this.locked} @input=${(event: Event) => this.patchText('label', event)}></label>
          <label class="emr-field">Description<textarea class="emr-control" .value=${draft.description ?? ''} ?disabled=${this.locked} @input=${(event: Event) => this.patchText('description', event)}></textarea></label>
          <label class="emr-field">Entry instructions<textarea class="emr-control" .value=${draft.instructions ?? ''} ?disabled=${this.locked} @input=${(event: Event) => this.patchText('instructions', event)}></textarea></label>
          <label class="emr-field">Placeholder<input class="emr-control" .value=${draft.placeholder ?? ''} ?disabled=${this.locked} @input=${(event: Event) => this.patchText('placeholder', event)}></label>
        </div>
      </section>
      <section class="authoring-card" aria-label="Field behavior">
        <h4 class="emr-title">Type, cardinality and layout</h4>
        <div class="authoring-grid">
          <label class="emr-field">Value type<select class="emr-control" .value=${draft.type} ?disabled=${this.locked} @change=${(event: Event) => this.patchDraft({ type: this.text(event) as EmrGeneratedFieldDefinition['type'] })}>
            ${(['text','multiline','integer','decimal','date','time','datetime','select','multiselect','boolean','quantity','custom'] as const).map(type => html`<option value=${type}>${type}</option>`)}
          </select></label>
          <label class="emr-field">Grid span<select class="emr-control" .value=${String(draft.span ?? 12)} ?disabled=${this.locked} @change=${(event: Event) => this.patchNumber('span', event)}>
            ${[3,4,6,8,9,12].map(span => html`<option value=${span}>${span} / 12</option>`)}
          </select></label>
          <label class="emr-field">Text rows<input class="emr-control" type="number" min="1" max="12" .value=${draft.rows === undefined ? '' : String(draft.rows)} ?disabled=${this.locked} @input=${(event: Event) => this.patchNumber('rows', event)}></label>
          <label class="emr-field">Precision<input class="emr-control" type="number" min="0" max="8" .value=${draft.precision === undefined ? '' : String(draft.precision)} ?disabled=${this.locked} @input=${(event: Event) => this.patchNumber('precision', event)}></label>
        </div>
        <div class="authoring-row">
          <label><input type="checkbox" .checked=${draft.required} ?disabled=${this.locked} @change=${(event: Event) => this.patchDraft({ required: (event.target as HTMLInputElement).checked })}> Required</label>
          <label><input type="checkbox" .checked=${draft.repeats} ?disabled=${this.locked} @change=${(event: Event) => this.patchDraft({ repeats: (event.target as HTMLInputElement).checked })}> Repeatable</label>
          <label><input type="checkbox" .checked=${!!draft.readOnly} ?disabled=${this.locked} @change=${(event: Event) => this.patchDraft({ readOnly: (event.target as HTMLInputElement).checked })}> Display only</label>
        </div>
      </section>
      ${draft.type === 'quantity' ? html`<section class="authoring-card" aria-label="Quantity units">
        <h4 class="emr-title">Unit definition</h4><div class="authoring-grid">
          <label class="emr-field">Display unit<input class="emr-control" .value=${draft.unit ?? ''} ?disabled=${this.locked} @input=${(event: Event) => this.patchText('unit', event)}></label>
          <label class="emr-field">Unit system<input class="emr-control" .value=${draft.unitSystem ?? ''} ?disabled=${this.locked} @input=${(event: Event) => this.patchText('unitSystem', event)}></label>
          <label class="emr-field">Unit code<input class="emr-control" .value=${draft.unitCode ?? ''} ?disabled=${this.locked} @input=${(event: Event) => this.patchText('unitCode', event)}></label>
        </div>
      </section>` : nothing}
      ${draft.type === 'select' || draft.type === 'multiselect' ? html`<section class="authoring-card" aria-label="Choice options">
        <h4 class="emr-title">Choice values <span class="emr-badge">${draft.options?.length ?? 0}</span></h4>
        <div class="authoring-grid">
          <label class="emr-field">Option value<input class="emr-control" .value=${this.optionValue} ?disabled=${this.locked} @input=${(event: Event) => this.setOptionDraft('optionValue', event)}></label>
          <label class="emr-field">Option label<input class="emr-control" .value=${this.optionLabel} ?disabled=${this.locked} @input=${(event: Event) => this.setOptionDraft('optionLabel', event)}></label>
        </div>
        <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${this.locked || !this.optionValue.trim() || !this.optionLabel.trim()} @click=${this.addOption}>Add option</button>
        <div class="authoring-list">${(draft.options ?? []).map(option => html`<div class="authoring-item"><span>${option.label} <small class="authoring-muted">${option.value}</small></span>${this.action('Remove', { type: 'draftPatched', changes: { options: draft.options?.filter(item => item.value !== option.value) } }, () => !this.locked)}</div>`)}</div>
      </section>` : nothing}
      <emr-validation-rule-editor .model=${{ rules: draft.validationRules, readOnly: this.locked }} @intent=${this.forwardChildIntent}></emr-validation-rule-editor>
      <section class="authoring-card" aria-label="Terminology bindings">
        <h4 class="emr-title">Terminology bindings</h4>
        ${terminologyRoles.map(role => {
          const search = model.terminologySearches[role];
          return html`<emr-terminology-search .model=${{ role, sources: model.sources, search, bindings: this.bindings(role), readOnly: this.locked }} @intent=${this.forwardChildIntent}></emr-terminology-search>`;
        })}
      </section>
      <section class="authoring-card" aria-label="Field preview">
        <h4 class="emr-title">Live field preview</h4><strong>${draft.label || 'Untitled field'}</strong>
        <span class="authoring-muted">${draft.type}${draft.required ? ' · Required' : ''}${draft.repeats ? ' · Repeatable' : ''}</span>
        ${this.renderDraftControl(draft)}
      </section>
      ${Object.entries(model.validationErrors).length ? html`<section class="authoring-card" aria-label="Controller validation" role="alert"><h4 class="emr-title">Controller validation</h4><ul>${Object.entries(model.validationErrors).map(([path, message]) => html`<li><strong>${path}</strong>: ${message}</li>`)}</ul></section>` : nothing}
      ${model.savedFieldId ? html`<p role="status">Saved field ${model.savedFieldId}</p>` : nothing}
    `);
  }
}

export class EmrTerminologySearchElement extends EmrModelElement<TerminologySearchViewModel, TerminologySearchIntent> {
  static override styles = [emrShadowStyles, authoringStyles];
  private get locked(): boolean { return !!this.model?.readOnly; }
  private sendIfEditable(intent: TerminologySearchIntent): void { if (!this.locked) this.send(intent); }
  private searchChanged(event: Event): void {
    if (!this.model) return;
    this.sendIfEditable({ type: 'terminologyQueryChanged', role: this.model.role, query: (event.target as HTMLInputElement).value });
  }
  private sourceChanged(event: Event): void {
    if (!this.model) return;
    const sourceId = (event.target as HTMLSelectElement).value;
    if (sourceId) this.sendIfEditable({ type: 'terminologySearchOpened', role: this.model.role, sourceId });
  }
  private searchRequested(): void { if (this.model) this.sendIfEditable({ type: 'terminologySearchRequested', role: this.model.role }); }
  private retry(): void { if (this.model) this.sendIfEditable({ type: 'terminologyRetryRequested', role: this.model.role }); }
  private pageChanged(page: number): void { if (this.model) this.sendIfEditable({ type: 'terminologyPageChanged', role: this.model.role, page }); }
  private selectConcept(concept: TerminologyConcept): void {
    if (!this.model) return;
    this.sendIfEditable({ type: 'terminologyConceptSelected', role: this.model.role, concept, strength: 'preferred', mappingRelationship: this.model.role === 'classification-mapping' ? 'related-to' : undefined });
  }
  private updateBinding(binding: TerminologyBinding, event: Event, propertyName: 'strength' | 'mappingRelationship'): void {
    if (!this.model || !binding.concept || this.locked) return;
    const value = (event.target as HTMLSelectElement).value;
    const changes = propertyName === 'strength'
      ? { strength: value as TerminologyBindingStrength }
      : { mappingRelationship: value as TerminologyMappingRelationship };
    this.send({ type: 'terminologyConceptSelected', role: this.model.role, concept: binding.concept, strength: changes.strength ?? binding.strength, mappingRelationship: changes.mappingRelationship ?? binding.mappingRelationship });
  }
  private removeBinding(binding: TerminologyBinding): void { this.sendIfEditable({ type: 'terminologyBindingRemoved', bindingId: binding.id }); }

  protected override render() {
    const model = this.model;
    if (!model) return nothing;
    const search = model.search;
    const role = roleLabels[model.role];
    return this.panel('Terminology Search', html`
      <header class="authoring-row"><h4 class="emr-title">${role}</h4>${search?.loading ? html`<span role="status">Searching…</span>` : nothing}</header>
      <div class="authoring-grid">
        <label class="emr-field">Source<select class="emr-control" .value=${search?.sourceId ?? ''} ?disabled=${this.locked} @change=${this.sourceChanged}>
          <option value="">Choose terminology</option>${model.sources.map(source => html`<option value=${source.id} ?selected=${source.id === search?.sourceId} ?disabled=${!source.available}>${source.label}${source.versionLabel ? ` · ${source.versionLabel}` : ''}</option>`)}
        </select></label>
        <label class="emr-field">Search<input class="emr-control" type="search" .value=${search?.query ?? ''} ?disabled=${this.locked || !search?.sourceId} @input=${this.searchChanged} @keydown=${(event: KeyboardEvent) => { if (event.key === 'Enter') this.searchRequested(); }}></label>
      </div>
      ${search?.sourceId ? this.action('Search', { type: 'terminologySearchRequested', role: model.role }, () => !this.locked && !search.loading) : nothing}
      ${search?.error ? html`<p class="authoring-error" role="alert">${search.error} ${this.action('Retry', { type: 'terminologyRetryRequested', role: model.role }, () => !this.locked)}</p>` : nothing}
      ${search && !search.loading && search.query && !search.options.length && !search.error ? html`<p class="authoring-muted" role="status">No concepts found for this search.</p>` : nothing}
      <div class="authoring-list" role="listbox" aria-label=${`${role} search results`}>
        ${(search?.options ?? []).map(concept => html`<button type="button" class="authoring-item" role="option" aria-selected="false" ?disabled=${this.locked || concept.active === false} @click=${() => this.selectConcept(concept)}>
          <span class="authoring-item__copy"><strong>${concept.display}</strong><span>${concept.code} · ${concept.system}${concept.version ? ` · ${concept.version}` : ''}${concept.active === false ? ' · Inactive' : ''}</span></span>
        </button>`)}
      </div>
      ${search && search.total > search.pageSize ? html`<div class="authoring-row"><span class="authoring-muted">Page ${search.page} · ${search.total} results</span>${this.action('Previous', { type: 'terminologyPageChanged', role: model.role, page: search.page - 1 }, () => !this.locked && search.page > 1)}${this.action('Next', { type: 'terminologyPageChanged', role: model.role, page: search.page + 1 }, () => !this.locked && search.page * search.pageSize < search.total)}</div>` : nothing}
      <h4 class="emr-title">Selected bindings</h4>
      ${(model.bindings ?? []).map(binding => html`<div class="authoring-card">
        <div class="authoring-item__copy"><strong>${binding.concept?.display ?? binding.valueSetCanonical ?? binding.id}</strong><span>${binding.concept?.code ?? ''}${binding.concept ? ` · ${binding.concept.system}` : ''}</span></div>
        ${binding.concept ? html`<div class="authoring-grid">
          <label class="emr-field">Binding strength<select class="emr-control" .value=${binding.strength ?? 'preferred'} ?disabled=${this.locked} @change=${(event: Event) => this.updateBinding(binding, event, 'strength')}>
            ${(['required','extensible','preferred','example'] as const).map(strength => html`<option value=${strength}>${strength}</option>`)}
          </select></label>
          ${model.role === 'classification-mapping' ? html`<label class="emr-field">Relationship<select class="emr-control" .value=${binding.mappingRelationship ?? 'related-to'} ?disabled=${this.locked} @change=${(event: Event) => this.updateBinding(binding, event, 'mappingRelationship')}>
            ${(['equivalent','wider','narrower','related-to'] as const).map(relationship => html`<option value=${relationship}>${relationship}</option>`)}
          </select></label>` : nothing}
        </div>` : nothing}
        ${this.action('Remove binding', { type: 'terminologyBindingRemoved', bindingId: binding.id }, () => !this.locked)}
      </div>`)}
    `);
  }
}

export class EmrValidationRuleEditorElement extends EmrModelElement<ValidationRuleEditorViewModel, ValidationRuleEditorIntent> {
  static override styles = [emrShadowStyles, authoringStyles];
  @state() private kind: FieldValidationRule['kind'] = 'minimum';
  @state() private value = '';
  @state() private message = '';

  private get locked(): boolean { return !!this.model?.readOnly; }
  private valueKind(kind: FieldValidationRule['kind'], value: string, message: string): FieldValidationRule | undefined {
    const base = { id: '', message: message.trim() || undefined };
    if (kind === 'pattern') return { ...base, kind, value, message: message.trim() || 'Value does not match the required pattern.' };
    if (kind === 'custom') return message.trim() ? { ...base, kind, customValidatorId: value, message: message.trim() } : undefined;
    if (kind === 'allowed-values') return { ...base, kind, values: value.split(',').map(item => item.trim()).filter(Boolean) };
    if (kind === 'earliest-date' || kind === 'latest-date') return { ...base, kind, value };
    const numberValue = Number(value);
    return value.trim() && Number.isFinite(numberValue) ? { ...base, kind, value: numberValue } : undefined;
  }
  private addRule(): void {
    if (this.locked) return;
    const rule = this.valueKind(this.kind, this.value, this.message);
    if (!rule) return;
    this.send({ type: 'validationRuleAdded', rule });
    this.value = '';
    this.message = '';
  }
  private get canAddRule(): boolean {
    return !this.locked && !!this.value.trim() && (this.kind !== 'custom' || !!this.message.trim());
  }
  private removeRule(ruleId: string): void { if (!this.locked) this.send({ type: 'validationRuleRemoved', ruleId }); }
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
    const valueLabel = this.kind === 'pattern' ? 'Regular expression' : this.kind === 'custom' ? 'Validator ID' : this.kind === 'allowed-values' ? 'Comma-separated values' : this.kind.endsWith('-date') ? 'Date' : 'Value';
    return this.panel('Validation Rule Editor', html`
      <div class="authoring-grid">
        <label class="emr-field">Rule type<select class="emr-control" .value=${this.kind} ?disabled=${this.locked} @change=${(event: Event) => { if (!this.locked) { this.kind = (event.target as HTMLSelectElement).value as FieldValidationRule['kind']; this.value = ''; } }}>
          ${ruleKinds.map(kind => html`<option value=${kind}>${ruleLabels[kind]}</option>`)}
        </select></label>
        <label class="emr-field">${valueLabel}<input class="emr-control" .value=${this.value} ?disabled=${this.locked} @input=${this.setDraftValue}></label>
        <label class="emr-field">Message<input class="emr-control" .value=${this.message} ?disabled=${this.locked} @input=${this.setDraftMessage}></label>
      </div>
      ${this.kind === 'custom' ? html`<p class="authoring-muted">The controller resolves this validator ID. The UI does not execute clinical validation.</p>` : nothing}
      <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${!this.canAddRule} @click=${this.addRule}>Add validation rule</button>
      <div class="authoring-list" aria-label="Current validation rules">
        ${model.rules.map(rule => html`<div class="authoring-item"><div class="authoring-item__copy"><strong>${ruleLabels[rule.kind]}</strong><span>${this.summary(rule)}</span>${rule.message ? html`<small>${rule.message}</small>` : nothing}</div>${this.action('Remove', { type: 'validationRuleRemoved', ruleId: rule.id }, () => !this.locked)}</div>`)}
      </div>
    `);
  }
}

export class EmrFieldLibraryPickerElement extends EmrModelElement<FieldLibraryPickerViewModel, FieldLibraryPickerIntent> {
  static override styles = [emrShadowStyles, authoringStyles];
  private get locked(): boolean { return !!this.model?.readOnly; }
  private queryChanged(event: Event): void {
    if (!this.locked) this.send({ type: 'fieldLibraryQueryChanged', query: (event.target as HTMLInputElement).value });
  }
  private add(field: EmrGeneratedFieldDefinition): void {
    const model = this.model;
    if (!model || this.locked || !model.selectedSectionId) return;
    this.send({ type: 'fieldAdded', sectionId: model.selectedSectionId, field, placementId: '' });
  }
  private terminologySummary(field: EmrGeneratedFieldDefinition): string {
    return field.terminologyBindings.map(binding => binding.concept?.code ?? binding.role).join(' · ');
  }

  protected override render() {
    const model = this.model;
    if (!model) return nothing;
    return this.panel('Field Library', html`
      <p class="authoring-muted">Search the controller-supplied field catalogue and add an available field to the selected section.</p>
      <label class="emr-field">Search fields<input class="emr-control" type="search" .value=${model.query} ?disabled=${this.locked} @input=${this.queryChanged}></label>
      ${!model.selectedSectionId ? html`<p class="authoring-muted" role="status">Select a template section before adding a field.</p>` : nothing}
      <p class="authoring-muted" role="status">${model.fields.length} available</p>
      <div class="authoring-list" role="list" aria-label="Available reusable fields">
        ${model.fields.map(field => html`<article class="authoring-item" role="listitem">
          <div class="authoring-item__copy"><strong>${field.label}</strong><span>${field.type}${field.required ? ' · Required' : ''}${field.repeats ? ' · Repeatable' : ''}</span>
            ${field.description ? html`<small>${field.description}</small>` : nothing}
            ${field.terminologyBindings.length ? html`<small>${this.terminologySummary(field)}</small>` : nothing}
          </div>
          ${this.action('Add', { type: 'fieldAdded', sectionId: model.selectedSectionId ?? '', field, placementId: '' }, () => !this.locked && !!model.selectedSectionId)}
        </article>`)}
        ${model.fields.length ? nothing : html`<p class="authoring-muted" role="status">No reusable fields match this search.</p>`}
      </div>
    `);
  }
}

export class EmrTemplateComposerElement extends EmrModelElement<TemplateComposerViewModel, TemplateComposerIntent> {
  static override styles = [emrShadowStyles, authoringStyles];
  @state() private newSectionLabel = '';
  private get locked(): boolean { return !!this.model?.readOnly; }
  private sendTemplate(intent: EhrTemplateIntent): void {
    if (!this.locked || intent.type === 'sectionSelected') this.send(intent as TemplateComposerIntent);
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
    return this.panel('Template Composer', html`
      <header class="authoring-row">
        <span class="emr-badge">${model.dirty ? 'Unsaved changes' : model.template.status}</span>
        ${this.action(model.saving ? 'Saving…' : 'Save template', { type: 'saveRequested' }, () => !this.locked && !model.saving)}
      </header>
      ${model.error ? html`<p class="authoring-error" role="alert">${model.error}</p>` : nothing}
      ${model.loading ? html`<p role="status">Loading template data…</p>` : nothing}
      <section class="authoring-card" aria-label="Template metadata"><h4 class="emr-title">Template details</h4><div class="authoring-grid">
        <label class="emr-field">Title<input class="emr-control" .value=${model.template.title} ?disabled=${this.locked} @input=${(event: Event) => this.patchTemplate({ title: (event.target as HTMLInputElement).value })}></label>
        <label class="emr-field">Locale<input class="emr-control" .value=${model.template.locale} ?disabled=${this.locked} @input=${(event: Event) => this.patchTemplate({ locale: (event.target as HTMLInputElement).value })}></label>
        <label class="emr-field">Status<select class="emr-control" .value=${model.template.status} ?disabled=${this.locked} @change=${(event: Event) => this.patchTemplate({ status: (event.target as HTMLSelectElement).value as 'draft' | 'active' | 'retired' })}>
          ${(['draft','active','retired'] as const).map(status => html`<option value=${status}>${status}</option>`)}
        </select></label>
        <label class="emr-field">Description<textarea class="emr-control" .value=${model.template.description ?? ''} ?disabled=${this.locked} @input=${(event: Event) => this.patchTemplate({ description: (event.target as HTMLTextAreaElement).value })}></textarea></label>
      </div></section>
      <section class="authoring-card" aria-label="Template sections"><h4 class="emr-title">Sections (${model.template.sections.length})</h4>
        <div class="authoring-row"><input class="emr-control" aria-label="New section label" .value=${this.newSectionLabel} ?disabled=${this.locked} @input=${this.setNewSectionLabel}><button type="button" class="emr-btn emr-btn--secondary" ?disabled=${this.locked || !this.newSectionLabel.trim()} @click=${this.addSection}>Add section</button></div>
        <div class="authoring-list">${model.template.sections.map((item, index) => html`<div class="authoring-item"><div class="authoring-item__copy"><strong>${item.label}</strong><span>${item.fields.length} field(s)</span></div>
          ${this.action(item.id === model.selectedSectionId ? 'Selected' : 'Select', { type: 'sectionSelected', sectionId: item.id })}
          ${this.action('Move up', { type: 'sectionMoved', sectionId: item.id, direction: 'up' }, () => !this.locked && index > 0)}
          ${this.action('Move down', { type: 'sectionMoved', sectionId: item.id, direction: 'down' }, () => !this.locked && index < model.template.sections.length - 1)}
        </div>`)}</div>
      </section>
      ${section ? html`<section class="authoring-card" aria-label="Selected section editor"><h4 class="emr-title">${section.label}</h4>
        <div class="authoring-grid"><label class="emr-field">Section label<input class="emr-control" .value=${section.label} ?disabled=${this.locked} @input=${(event: Event) => this.patchSection(section.id, { label: (event.target as HTMLInputElement).value })}></label>
          <label class="emr-field">Description<textarea class="emr-control" .value=${section.description ?? ''} ?disabled=${this.locked} @input=${(event: Event) => this.patchSection(section.id, { description: (event.target as HTMLTextAreaElement).value })}></textarea></label>
        </div>
        ${this.action('Remove section', { type: 'sectionRemoved', sectionId: section.id }, () => !this.locked)}
        <div class="authoring-list">${section.fields.map((placement, index) => html`<div class="authoring-item"><div class="authoring-item__copy"><strong>${placement.field.label}</strong><span>${placement.field.type} · ${placement.field.id}</span></div>
          ${this.action('Move up', { type: 'fieldMoved', sectionId: section.id, placementId: placement.id, direction: 'up' }, () => !this.locked && index > 0)}
          ${this.action('Move down', { type: 'fieldMoved', sectionId: section.id, placementId: placement.id, direction: 'down' }, () => !this.locked && index < section.fields.length - 1)}
          ${this.action('Remove', { type: 'fieldRemoved', sectionId: section.id, placementId: placement.id }, () => !this.locked)}
        </div>`)}</div>
      </section>` : html`<p class="authoring-muted" role="status">Select a section to edit it and add reusable fields.</p>`}
      <section class="authoring-card" aria-label="Available fields"><h4 class="emr-title">Field library (${model.fieldLibrary.length})</h4>
        <label class="emr-field">Search<input class="emr-control" type="search" .value=${model.fieldLibraryQuery} ?disabled=${this.locked} @input=${(event: Event) => this.sendTemplate({ type: 'fieldLibraryQueryChanged', query: (event.target as HTMLInputElement).value })}></label>
        ${model.fieldLibrary.map(field => html`<div class="authoring-item"><div class="authoring-item__copy"><strong>${field.label}</strong><span>${field.type}${field.required ? ' · Required' : ''}</span></div>
          ${this.action('Add to section', { type: 'fieldAdded', sectionId: model.selectedSectionId ?? '', field, placementId: '' }, () => !this.locked && !!model.selectedSectionId)}
        </div>`)}
      </section>
      ${model.concurrencyToken ? html`<p class="authoring-muted">Concurrency token available.</p>` : nothing}
    `);
  }
}

export class EmrTemplatePreviewElement extends EmrModelElement<TemplatePreviewViewModel, TemplatePreviewIntent> {
  static override styles = [emrShadowStyles, authoringStyles];
  @state() private format: TemplateArtifactFormat = 'fhir-r4-questionnaire';
  @state() private serializedDraft = '';
  private get locked(): boolean { return !!this.model?.readOnly; }
  private sendIfEditable(intent: EhrTemplateIntent): void { if (!this.locked) this.send(intent as TemplatePreviewIntent); }
  private exportArtifact(): void {
    if (!this.locked && this.model && !this.model.loading) this.send({ type: 'artifactExportRequested', format: this.format });
  }
  private importArtifact(): void {
    if (!this.locked && this.model && !this.model.loading && this.serializedDraft.trim()) {
      this.send({ type: 'artifactImportRequested', format: this.format, serialized: this.serializedDraft });
    }
  }
  private formatChanged(event: Event): void {
    if (!this.locked && !this.model?.loading) this.format = (event.target as HTMLSelectElement).value as TemplateArtifactFormat;
  }
  private displayValue(value: ClinicalFieldValue | undefined): string {
    if (value === undefined || value === null) return 'No value';
    if (Array.isArray(value)) return value.join(', ');
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
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
    return this.panel('Template Preview', html`
      <header class="authoring-row"><div><h4 class="emr-title">${template.title || 'Untitled template'}</h4><p class="authoring-muted">${template.description || 'A live preview of the current template structure.'}</p></div><span class="emr-badge">${template.status}</span></header>
      <section class="authoring-card" aria-label="Rendered template preview">
        ${template.sections.map(section => html`<section class="authoring-card"><h4 class="emr-title">${section.label}</h4>${section.description ? html`<p class="authoring-muted">${section.description}</p>` : nothing}
          ${section.fields.map(placement => {
            const fieldState = model.preview?.fields?.[placement.field.id];
            const previewValue = fieldState ? fieldState.value : placement.field.defaultValue;
            return html`<div class="authoring-item"><div class="authoring-item__copy"><strong>${placement.field.label}${placement.field.required ? ' *' : ''}</strong><span>${placement.field.type}${placement.field.repeats ? ' · Repeatable' : ''}</span>
            ${placement.field.description ? html`<small>${placement.field.description}</small>` : nothing}
            ${placement.field.options?.length ? html`<span>${placement.field.options.map(option => option.label).join(' · ')}</span>` : nothing}
            ${placement.field.unit ? html`<span>${placement.field.unit}</span>` : nothing}
            <span>Preview value: ${this.displayValue(previewValue)}</span>
            ${fieldState?.assessmentStatus ? html`<span class="emr-badge">${fieldState.assessmentStatus}</span>` : nothing}
            ${fieldState?.error ? html`<span class="authoring-error">${fieldState.error}</span>` : nothing}
            ${fieldState?.warning ? html`<span class="authoring-muted">${fieldState.warning}</span>` : nothing}
          </div></div>`;
          })}
        </section>`)}
        ${template.sections.length ? nothing : html`<p class="authoring-muted">No sections have been added.</p>`}
      </section>
      <section class="authoring-card" aria-label="Artifact import and export"><h4 class="emr-title">Import or export artifacts</h4>
        <p class="authoring-muted">Serialization and FHIR mapping are handled by the configured artifact controller.</p>
        ${model.loading ? html`<p role="status">Artifact operation in progress…</p>` : nothing}
        <label class="emr-field">Format<select class="emr-control" .value=${this.format} ?disabled=${this.locked || model.loading} @change=${this.formatChanged}>${artifactFormats.map(format => html`<option value=${format}>${artifactLabels[format]}</option>`)}</select></label>
        <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${this.locked || model.loading} @click=${this.exportArtifact}>Export</button>
        <label class="emr-field">Serialized import payload<textarea class="emr-control" .value=${this.serializedDraft} ?readonly=${this.locked || model.loading} @input=${this.setSerializedDraft}></textarea></label>
        <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${this.locked || model.loading || !this.serializedDraft.trim()} @click=${this.importArtifact}>Import</button>
        ${model.artifact ? html`<div class="authoring-card" role="status"><strong>${artifactLabels[model.artifact.format]}${model.artifact.fhirVersion ? ` · FHIR ${model.artifact.fhirVersion}` : ''}</strong><span>${model.artifact.serialized.length} characters · ${model.artifact.issues.length} issue(s)</span><pre>${model.artifact.serialized}</pre></div>` : nothing}
        ${model.importIssues?.length ? html`<div class="authoring-issues" role="status"><strong>Controller-reported import issues</strong><ul>${model.importIssues.map(issue => html`<li><b>${issue.severity}</b> · ${issue.message}${issue.path ? ` · ${issue.path}` : ''}</li>`)}</ul></div>` : nothing}
        ${model.canAcceptImport ? html`<button type="button" class="emr-btn emr-btn--outline" ?disabled=${this.locked || model.loading} @click=${this.acceptImport}>Accept import</button>` : nothing}
        ${model.error ? html`<p class="authoring-error" role="alert">${model.error}</p>` : nothing}
      </section>
    `);
  }
}

export function registerL6AuthoringSurfaces(): void {
  defineEmrElement('emr-field-generator', EmrFieldGeneratorElement);
  defineEmrElement('emr-terminology-search', EmrTerminologySearchElement);
  defineEmrElement('emr-validation-rule-editor', EmrValidationRuleEditorElement);
  defineEmrElement('emr-field-library-picker', EmrFieldLibraryPickerElement);
  defineEmrElement('emr-template-composer', EmrTemplateComposerElement);
  defineEmrElement('emr-template-preview', EmrTemplatePreviewElement);
}
