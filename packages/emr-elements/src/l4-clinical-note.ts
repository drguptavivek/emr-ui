import { css, html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import type {
  ClinicalNoteAction,
  ClinicalNoteSection,
  ClinicalNoteSignatureView,
  ClinicalNoteWorkspaceIntent,
  ClinicalNoteWorkspaceViewModel,
} from '@drguptavivek/emr-controller';
import { defineEmrElement } from './foundations.js';
import { EmrModelElement } from './controlled-rendering.js';

export class EmrClinicalNoteWorkspaceElement extends EmrModelElement<
  ClinicalNoteWorkspaceViewModel,
  ClinicalNoteWorkspaceIntent
> {
  static override styles = [
    ...EmrModelElement.styles,
    css`
      .workspace { display: grid; gap: 20px; color: var(--emr-text); }
      .header { display: grid; gap: 6px; padding-bottom: 14px; border-bottom: 1px solid var(--emr-border); }
      .header h2, h4, p { margin: 0; }
      .context, .metadata, .muted { color: var(--emr-text-muted); }
      .metadata { display: flex; flex-wrap: wrap; gap: 4px 14px; }
      .columns { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(15rem, 1fr); gap: 20px; align-items: start; }
      .stack { display: grid; gap: 12px; min-width: 0; }
      .section-list, .history-list, .queue-list { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
      .note-section { white-space: pre-wrap; overflow-wrap: anywhere; }
      .note-section h4 { margin-bottom: 4px; }
      .note-card { border: 1px solid var(--emr-border); border-radius: var(--emr-radius-md); padding: 12px; }
      .history-item { border-inline-start: 2px solid var(--emr-border); padding-inline-start: 12px; }
      .reason { color: var(--emr-text-muted); }
      .edit-form { display: grid; gap: 12px; }
      .field { display: grid; gap: 5px; }
      .field textarea { min-height: 5rem; resize: vertical; }
      .compare { display: grid; gap: 8px; }
      .compare-row { display: grid; grid-template-columns: minmax(8rem, .7fr) minmax(0, 1fr) minmax(0, 1fr); gap: 8px; }
      .compare-row > * { min-width: 0; overflow-wrap: anywhere; }
      .comparison-value { white-space: pre-wrap; }
      .comparison-value small { display: block; color: var(--emr-text-muted); }
      button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid var(--emr-focus); outline-offset: 2px; }
      @media (max-width: 640px) {
        .columns { grid-template-columns: minmax(0, 1fr); }
        .compare-row { grid-template-columns: minmax(0, 1fr); gap: 4px; }
      }
      @media print {
        :host { color: var(--emr-text); }
        .workspace, .columns { display: block; }
        .header, .current-note, .addenda { margin-bottom: 14px; }
        .note-card { border: 0; padding: 0; }
        .nonprint { display: none !important; }
        .current-note, .addenda { break-inside: avoid; }
      }
      :host-context(.emr-print) { color: var(--emr-text); }
      :host-context(.emr-print) .workspace, :host-context(.emr-print) .columns { display: block; }
      :host-context(.emr-print) .header, :host-context(.emr-print) .current-note, :host-context(.emr-print) .addenda { margin-bottom: 14px; }
      :host-context(.emr-print) .note-card { border: 0; padding: 0; }
      :host-context(.emr-print) .nonprint { display: none !important; }
      :host-context(.emr-print) .current-note, :host-context(.emr-print) .addenda { break-inside: avoid; }
    `,
  ];

  private hasAction(actionId: string): ClinicalNoteAction | undefined {
    const model = this.model;
    if (!model) return undefined;
    const actions = [
      ...model.actions,
      ...(model.form?.actions ?? []),
      ...model.queue.entries.flatMap((entry) => entry.actions),
      ...(model.history?.entries.flatMap((entry) => entry.actions) ?? []),
    ];
    return actions.find((action) => action.id === actionId);
  }

  private renderAction(action: ClinicalNoteAction) {
    return html`<button type="button" class="emr-btn ${action.primary ? '' : 'emr-btn--secondary'}"
      @click=${() => { if (this.hasAction(action.id)) this.send({ type: 'actionRequested', actionId: action.id }); }}>
      ${action.label}
    </button>`;
  }

  private renderSignatures(signatures?: readonly ClinicalNoteSignatureView[]) {
    return signatures?.map(signature => html`<div class="metadata">
      <span>${signature.purpose === 'co-sign' ? 'Co-signed by' : 'Signed by'} ${signature.name} · ${signature.role} · ${signature.signedAtLabel}</span>
      ${signature.verification ? html`<span>${signature.verification.label}${signature.verification.status === 'verified'
        ? ` · ${signature.verification.verifiedAtLabel}` : ''}</span>` : nothing}
    </div>`) ?? nothing;
  }

  private fieldChanged(fieldId: string, target: HTMLInputElement | HTMLTextAreaElement): void {
    if (!this.model?.form?.fields.some(field => field.id === fieldId)) return;
    this.send({ type: 'fieldChanged', fieldId, value: target.value });
    // A host may reject an edit without replacing its model.
    this.requestUpdate();
  }

  private renderSections(sections: readonly ClinicalNoteSection[]) {
    return html`<div class="section-list">
      ${sections.map((section) => html`<section class="note-section">
        <h4>${section.label}</h4><div>${section.value || 'Not supplied'}</div>
      </section>`)}
    </div>`;
  }

  override render() {
    const model = this.model;
    if (!model) return nothing;

    const snapshot = model.history?.snapshot;
    const comparison = model.history?.comparison;
    return html`
      <section class="workspace" aria-label=${this.headingId ? nothing : model.title} aria-labelledby=${this.headingId || nothing}>
        <header class="header">
          <div class="context">${model.context}</div>
          <h2 id=${this.headingId || nothing}>${model.title}</h2>
          <div role="status"><strong>${model.status}</strong></div>
          <div class="metadata">${model.metadata.map((item) => html`<span>${item}</span>`)}</div>
          ${this.renderSignatures(model.signatures)}
          ${model.message ? html`<p class="nonprint" role="status">${model.message}</p>` : nothing}
          ${model.error ? html`<p class="emr-error nonprint" role="alert">${model.error}</p>` : nothing}
          <div class="emr-actions nonprint">${model.actions.map((action) => this.renderAction(action))}</div>
        </header>

        <div class="columns">
          <div class="stack">
            ${model.current ? html`<article class="current-note note-card">
              <h3>${model.current.title}</h3>
              <div class="metadata">${model.current.metadata.map((item) => html`<span>${item}</span>`)}</div>
              ${this.renderSignatures(model.current.signatures)}
              ${this.renderSections(model.current.sections)}
            </article>` : nothing}

            ${model.addenda.length ? html`<section class="addenda stack" aria-label="Signed addenda">
              <h3>Signed addenda</h3>
              ${model.addenda.map((addendum) => html`<article class="note-card">
                <h4>${addendum.title}</h4>
                <div class="metadata">${addendum.metadata.map((item) => html`<span>${item}</span>`)}</div>
                ${this.renderSignatures(addendum.signatures)}
                ${this.renderSections(addendum.sections)}
              </article>`)}
            </section>` : nothing}

            ${model.form ? html`<section class="edit-form nonprint" aria-label=${model.form.title}>
              <h3>${model.form.title}</h3>
              ${model.form.fields.map((field) => html`<label class="field">
                <span>${field.label}</span>
                ${field.multiline
                  ? html`<textarea .value=${live(field.value)}
                      @input=${(event: Event) => this.fieldChanged(field.id, event.currentTarget as HTMLTextAreaElement)}></textarea>`
                  : html`<input .value=${live(field.value)}
                      @input=${(event: Event) => this.fieldChanged(field.id, event.currentTarget as HTMLInputElement)}>`}
              </label>`)}
              <div class="emr-actions">${model.form.actions.map((action) => this.renderAction(action))}</div>
            </section>` : nothing}

            ${model.review ? html`<section class="note-card nonprint" aria-label="Review note">
              <h3>${model.review.title}</h3>
              <div class="metadata">${model.review.metadata.map((item) => html`<span>${item}</span>`)}</div>
              ${this.renderSignatures(model.review.signatures)}
              ${this.renderSections(model.review.sections)}
            </section>` : nothing}

            ${snapshot ? html`<section class="note-card nonprint" aria-label="Selected signed version">
              <h3>${snapshot.title}</h3>
              <div class="metadata">${snapshot.metadata.map((item) => html`<span>${item}</span>`)}</div>
              ${this.renderSignatures(snapshot.signatures)}
              ${this.renderSections(snapshot.sections)}
            </section>` : nothing}

            ${comparison ? html`<section class="note-card nonprint compare" aria-label="Note version comparison">
              <h3>${comparison.title}</h3>
              ${comparison.rows.map((row) => html`<div class="compare-row">
                <strong>${row.label}</strong>
                <span class="comparison-value"><small>${comparison.previousLabel}</small>${row.previous ?? 'Section absent'}</span>
                <span class="comparison-value"><small>${comparison.currentLabel}</small>${row.current ?? 'Section absent'}</span>
              </div>`)}
              ${comparison.rows.length === 0 ? html`<p class="muted">No sections changed.</p>` : nothing}
            </section>` : nothing}
          </div>

          <aside class="stack nonprint">
            <section aria-labelledby="review-queue-title">
              <h3 id="review-queue-title">${model.queue.title}</h3>
              ${model.queue.entries.length ? html`<ul class="queue-list">
                ${model.queue.entries.map((entry) => html`<li class="note-card">
                  <strong>${entry.title}</strong>
                  <div class="metadata">${entry.metadata.map((item) => html`<span>${item}</span>`)}</div>
                  ${entry.reason ? html`<p class="reason">${entry.reason}</p>` : nothing}
                  <div class="emr-actions">${entry.actions.map((action) => this.renderAction(action))}</div>
                </li>`)}
              </ul>` : html`<p class="muted">${model.queue.emptyLabel}</p>`}
            </section>
            ${model.history ? html`<section aria-labelledby="note-history-title">
              <h3 id="note-history-title">${model.history.title}</h3>
              <ol class="history-list">
                ${model.history.entries.map((entry) => html`<li class="history-item">
                  <strong>${entry.title}</strong>
                  <div class="metadata">${entry.metadata.map((item) => html`<span>${item}</span>`)}</div>
                  ${entry.reason ? html`<p class="reason">${entry.reason}</p>` : nothing}
                  <div class="emr-actions">${entry.actions.map((action) => this.renderAction(action))}</div>
                </li>`)}
              </ol>
            </section>` : nothing}
          </aside>
        </div>
      </section>
    `;
  }
}

export function registerL4ClinicalNoteElements(): void {
  defineEmrElement('emr-clinical-note-workspace', EmrClinicalNoteWorkspaceElement);
}
