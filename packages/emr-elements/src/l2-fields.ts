import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import type {
  AttestationIntent,
  AttestationViewModel,
  ClinicalFieldDefinition,
  ClinicalFieldState,
  CodedInputIntent,
  CodedInputViewModel,
  DoseSlot,
  IdentifierEntryIntent,
  IdentifierEntryView,
  ScheduleSlotDefinition,
  ScheduleSlotPreset,
} from '@drguptavivek/emr-controller';
import { EmrLitElement, defineEmrElement, emrShadowStyles } from './foundations.js';
import { renderEmrSvgIcon } from './icons.js';

const l2Styles = css`
  .slot-line {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: stretch;
  }
  .slot-tile {
    flex: 1 1 130px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 6px;
  }
  .slot-tile--on {
    border-color: var(--emr-primary, #475f70);
    background: var(--emr-primary-soft, #e3ebef);
  }
`;

export class EmrFieldFrameElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2Styles];
  @property({ type: String }) label = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) required = false;

  override render() {
    return html`<div class="emr-field" part="frame">
      ${this.label
        ? html`<label class="emr-label">${this.label}${this.required ? html`<span style="color:var(--emr-danger,#a44949);"> *</span>` : nothing}</label>`
        : nothing}
      <slot></slot>
      ${this.error ? html`<span class="emr-error">${this.error}</span>` : this.hint ? html`<span class="emr-hint">${this.hint}</span>` : nothing}
    </div>`;
  }
}

export class EmrTypedFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2Styles];
  @property({ attribute: false }) definition?: ClinicalFieldDefinition;
  @property({ attribute: false }) model?: ClinicalFieldState;
  @property({ type: Boolean }) readOnly = false;

  override render() {
    const def = this.definition;
    if (!def) return nothing;
    const val = this.model?.value ?? null;
    return html`<emr-field-frame .label=${def.label} .hint=${def.hint ?? ''} .error=${this.model?.error ?? ''} ?required=${!!def.required}>
      ${def.type === 'integer' || def.type === 'decimal'
        ? html`<emr-number-input .value=${typeof val === 'number' ? val : null} .readOnly=${this.readOnly} @valueChange=${(e: CustomEvent) => this.emitValueChange(e.detail)}></emr-number-input>`
        : def.type === 'date'
          ? html`<emr-date-input .value=${typeof val === 'string' ? val : null} .readOnly=${this.readOnly} @valueChange=${(e: CustomEvent) => this.emitValueChange(e.detail)}></emr-date-input>`
          : def.type === 'boolean'
            ? html`<emr-checkbox .label=${def.label} .checked=${!!val} .readOnly=${this.readOnly} @valueChange=${(e: CustomEvent) => this.emitValueChange(e.detail)}></emr-checkbox>`
            : html`<emr-text-input .value=${typeof val === 'string' ? val : ''} .readOnly=${this.readOnly} @valueChange=${(e: CustomEvent) => this.emitValueChange(e.detail)}></emr-text-input>`}
    </emr-field-frame>`;
  }
}

export class EmrCodedInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2Styles];
  @property({ attribute: false }) model?: CodedInputViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`<div class="emr-field">
      <span class="emr-label">${m.definition.presentation.label}</span>
      <input
        class="emr-control"
        type="search"
        .value=${m.query}
        placeholder=${m.definition.presentation.hint ?? 'Search terminology…'}
        ?readonly=${!!m.readOnly}
        @input=${(e: Event) => this.emitIntent<CodedInputIntent>({ type: 'queryChangeRequested', query: (e.target as HTMLInputElement).value })}
      />
      ${m.options.length
        ? html`<div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${m.options.map(
              (c) => html`<button type="button" class="emr-btn emr-btn--secondary" @click=${() => this.emitIntent<CodedInputIntent>({ type: 'conceptSelected', concept: c })}>
                ${c.display} (${c.code})
              </button>`,
            )}
          </div>`
        : nothing}
    </div>`;
  }
}

export class EmrAttestationElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2Styles];
  @property({ attribute: false }) model?: AttestationViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`<section class="emr-card">
      <div class="emr-header">
        <h4 class="emr-title">${m.title ?? 'Attestation'}</h4>
      </div>
      ${m.statement ? html`<p class="emr-muted">${m.statement}</p>` : nothing}
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        ${m.signatories.map(
          (s) => html`<span class="emr-badge emr-badge--${s.status.tone}">${s.displayName} · ${s.status.label}</span>`,
        )}
        ${!m.readOnly && m.canSign
          ? html`<button type="button" class="emr-btn" @click=${() => this.emitIntent<AttestationIntent>({ type: 'signRequested' })}>${m.signLabel ?? 'Sign'}</button>`
          : nothing}
        ${!m.readOnly && m.canAmend
          ? html`<button type="button" class="emr-btn emr-btn--outline" @click=${() => this.emitIntent<AttestationIntent>({ type: 'amendRequested' })}>${m.amendLabel ?? 'Amend'}</button>`
          : nothing}
      </div>
    </section>`;
  }
}

export class EmrScheduleSlotPickerElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2Styles];
  @property({ type: String }) label = 'When to take';
  @property({ attribute: false }) slots: readonly ScheduleSlotDefinition[] = [];
  @property({ attribute: false }) presets: readonly ScheduleSlotPreset[] = [];
  @property({ attribute: false }) value: readonly DoseSlot[] | null = null;
  @property({ type: String }) unitLabel = 'tablets';
  @property({ type: Boolean }) readOnly = false;

  override render() {
    const byId = new Map((this.value ?? []).map((s) => [s.id, s]));
    const notation = this.slots.map((d) => byId.get(d.id)?.amount ?? 0).join(' - ');
    return html`<div class="emr-field">
      <div class="emr-header">
        <span class="emr-label">${this.label} <span class="emr-badge">${notation}</span></span>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${this.presets.map(
            (p) => html`<button
              type="button"
              class="emr-btn emr-btn--secondary"
              style="min-height:30px;height:30px;padding:0 10px;"
              ?disabled=${this.readOnly}
              @click=${() => {
                const next = this.slots
                  .filter((s) => p.slotIds.includes(s.id))
                  .map((s) => ({ id: s.id, label: s.label, timeHint: s.timeHint, amount: 1 }));
                this.value = next;
                this.emitValueChange(next);
              }}
            >${p.label}</button>`,
          )}
        </div>
      </div>
      <div class="slot-line">
        ${this.slots.map((def) => {
          const cur = byId.get(def.id);
          const on = !!cur;
          return html`<div class="slot-tile ${on ? 'slot-tile--on' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>${def.label}</strong>
              ${def.timeHint ? html`<span class="emr-muted">${def.timeHint}</span>` : nothing}
            </div>
            <button
              type="button"
              class="emr-btn emr-btn--secondary"
              style="min-height:32px;height:32px;"
              ?disabled=${this.readOnly}
              @click=${() => {
                const list = [...(this.value ?? [])];
                const next = on
                  ? list.filter((s) => s.id !== def.id)
                  : [...list, { id: def.id, label: def.label, timeHint: def.timeHint, amount: 1 }];
                this.value = next;
                this.emitValueChange(next);
              }}
            >
              ${on ? html`${renderEmrSvgIcon('check', 14)} ${cur?.amount ?? 1} ${this.unitLabel}` : `0 ${this.unitLabel}`}
            </button>
          </div>`;
        })}
      </div>
    </div>`;
  }
}

export class EmrIdentifierEntryElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2Styles];
  @property({ attribute: false }) model?: IdentifierEntryView;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`<div class="emr-field">
      <span class="emr-label">${m.label}</span>
      <div style="display:flex;gap:8px;">
        <input
          class="emr-control"
          .value=${m.value}
          ?readonly=${!!m.readOnly}
          @input=${(e: Event) => this.emitValueChange((e.target as HTMLInputElement).value)}
        />
        ${!m.readOnly
          ? html`<button type="button" class="emr-btn emr-btn--secondary" @click=${() => this.emitIntent<IdentifierEntryIntent>({ type: 'scanRequested' })}>Scan</button>`
          : nothing}
      </div>
    </div>`;
  }
}

export function registerL2Elements(): void {
  defineEmrElement('emr-field-frame', EmrFieldFrameElement);
  defineEmrElement('emr-typed-field', EmrTypedFieldElement);
  defineEmrElement('emr-coded-input', EmrCodedInputElement);
  defineEmrElement('emr-attestation', EmrAttestationElement);
  defineEmrElement('emr-schedule-slot-picker', EmrScheduleSlotPickerElement);
  defineEmrElement('emr-identifier-entry', EmrIdentifierEntryElement);
}
