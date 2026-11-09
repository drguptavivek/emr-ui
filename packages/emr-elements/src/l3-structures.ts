import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import type {
  AnnotationListIntent,
  AnnotationListViewModel,
  AnnotationToolbarIntent,
  AnnotationToolbarViewModel,
  ClinicalFormIntent,
  ClinicalFormSchema,
  ClinicalFormViewModel,
  ClinicalListItem,
  ClinicalMatrixBlockDefinition,
  EmrBadge,
  EmrDataTableIntent,
  EmrDataTableModel,
  ImageTemplatePickerIntent,
  ImageTemplatePickerViewModel,
  TimeAxisIntent,
  TimeAxisViewModel,
} from '@drguptavivek/emr-controller';
import { EmrLitElement, defineEmrElement, emrShadowStyles } from './foundations.js';
import { renderEmrSvgIcon } from './icons.js';

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
  .toolbar-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }
`;

export class EmrSectionCardElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ type: String }) override title = '';
  @property({ type: String }) description = '';
  @property({ attribute: false }) status?: EmrBadge;
  @property({ type: Boolean }) collapsed = false;

  override render() {
    return html`<section class="emr-card" part="section">
      <header class="emr-header">
        <div>
          <h3 class="emr-title">${this.title}</h3>
          ${this.description ? html`<p class="emr-muted">${this.description}</p>` : nothing}
        </div>
        ${this.status ? html`<emr-badge .badge=${this.status}></emr-badge>` : nothing}
      </header>
      ${!this.collapsed ? html`<div><slot></slot></div>` : nothing}
    </section>`;
  }
}

export class EmrRepeatableGroupElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ type: String }) override title = '';
  @property({ attribute: false }) items: readonly unknown[] = [];
  @property({ type: Boolean }) readOnly = false;

  override render() {
    return html`<section class="emr-card">
      <header class="emr-header">
        <h4 class="emr-title">${this.title}</h4>
        ${!this.readOnly
          ? html`<button type="button" class="emr-btn emr-btn--secondary" @click=${() => this.emitIntent({ type: 'entryAdded' })}>+ Add entry</button>`
          : nothing}
      </header>
      <slot></slot>
    </section>`;
  }
}

export class EmrClinicalFormElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ attribute: false }) definition?: ClinicalFormSchema;
  @property({ attribute: false }) model?: ClinicalFormViewModel;

  override render() {
    const def = this.definition;
    const m = this.model;
    if (!def && !m) return nothing;
    return html`<form class="emr-card" @submit=${(e: Event) => e.preventDefault()}>
      ${def
        ? html`<header class="emr-header"><h2 class="emr-title">${def.label}</h2></header>
            ${def.sections.map(
              (sec) => html`<emr-section-card .title=${sec.label} .description=${sec.description ?? ''}>
                <div style="display:grid;gap:12px;">
                  ${sec.blocks.map((blk) =>
                    blk.kind !== 'matrix' && blk.kind !== 'repeatable'
                      ? html`<emr-typed-field
                          .definition=${blk}
                          .model=${m?.fields[blk.id]}
                          .readOnly=${!!m?.readOnly}
                          @valueChange=${(e: CustomEvent) =>
                            this.emitIntent<ClinicalFormIntent>({ type: 'fieldEditRequested', fieldId: blk.id, value: e.detail })}
                        ></emr-typed-field>`
                      : nothing,
                  )}
                </div>
              </emr-section-card>`,
            )}`
        : nothing}
    </form>`;
  }
}

export class EmrClinicalListElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ type: String }) override title = 'Clinical list';
  @property({ attribute: false }) items: readonly ClinicalListItem[] = [];
  @property({ type: Boolean }) readOnly = false;

  override render() {
    return html`<section class="emr-card">
      <header class="emr-header">
        <h3 class="emr-title">${this.title}</h3>
        ${!this.readOnly
          ? html`<button type="button" class="emr-btn emr-btn--secondary" @click=${() => this.emitIntent({ type: 'addRequested' })}>+ Add</button>`
          : nothing}
      </header>
      <ul style="list-style:none;padding:0;margin:0;display:grid;gap:8px;">
        ${this.items.map(
          (it) => html`<li style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border:1px solid var(--emr-border,#c7d3da);border-radius:var(--emr-radius,8px);">
            <div>
              <strong>${it.title}</strong>
              ${it.subtitle ? html`<div class="emr-muted">${it.subtitle}</div>` : nothing}
            </div>
            ${it.badges?.[0] ? html`<emr-badge .badge=${it.badges[0]}></emr-badge>` : nothing}
          </li>`,
        )}
      </ul>
    </section>`;
  }
}

export class EmrClinicalMatrixElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ attribute: false }) definition?: ClinicalMatrixBlockDefinition;
  @property({ attribute: false }) model?: Record<string, Record<string, { value?: unknown }>>;

  override render() {
    const def = this.definition;
    if (!def) return nothing;
    return html`<section class="emr-card">
      <h3 class="emr-title">${def.label}</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Finding</th>
              ${def.columns.map((c: { id: string; label: string }) => html`<th>${c.label}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${def.rows.map(
              (r: { id: string; label: string }) => html`<tr>
                <th>${r.label}</th>
                ${def.columns.map((c: { id: string; label: string }) => {
                  const cell = this.model?.[r.id]?.[c.id];
                  return html`<td>${cell?.value ?? '—'}</td>`;
                })}
              </tr>`,
            )}
          </tbody>
        </table>
      </div>
    </section>`;
  }
}

export const EmrCustomRenderers = {};

export class EmrAnnotationToolbarElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ attribute: false }) model?: AnnotationToolbarViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`<div class="emr-card">
      <div class="toolbar-row" role="toolbar">
        ${m.tools.map(
          (tool) => html`<button
            type="button"
            class="emr-btn emr-btn--secondary"
            aria-pressed=${m.selectedToolId === tool.id}
            ?disabled=${!!m.readOnly}
            @click=${() => this.emitIntent<AnnotationToolbarIntent>({ type: 'toolSelected', toolId: tool.id })}
          >${tool.label}</button>`,
        )}
      </div>
    </div>`;
  }
}

export class EmrAnnotationListElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ attribute: false }) model?: AnnotationListViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`<section class="emr-card">
      <h4 class="emr-title">Annotations</h4>
      <ol style="margin:0;padding-left:20px;display:grid;gap:6px;">
        ${m.items.map(
          (it) => html`<li style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <span>${it.layer.label}</span>
            <div class="toolbar-row">
              <button type="button" class="emr-btn emr-btn--secondary" style="min-height:30px;height:30px;padding:0 8px;"
                @click=${() => this.emitIntent<AnnotationListIntent>({ type: 'layerVisibilityToggleRequested', layerId: it.layer.id })}>
                ${renderEmrSvgIcon(it.layer.visible === false ? 'eye-off' : 'eye', 14)}
              </button>
              <button type="button" class="emr-btn emr-btn--secondary" style="min-height:30px;height:30px;padding:0 8px;"
                @click=${() => this.emitIntent<AnnotationListIntent>({ type: 'layerLockToggleRequested', layerId: it.layer.id })}>
                ${renderEmrSvgIcon(it.locked ? 'lock' : 'unlock', 14)}
              </button>
            </div>
          </li>`,
        )}
      </ol>
    </section>`;
  }
}

export class EmrImageTemplatePickerElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ attribute: false }) model?: ImageTemplatePickerViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`<section class="emr-card">
      <div class="toolbar-row">
        ${m.options.map(
          (it) => html`<button
            type="button"
            class="emr-btn emr-btn--secondary"
            aria-pressed=${m.selectedId === it.id}
            @click=${() => this.emitIntent<ImageTemplatePickerIntent>({ type: 'templateSelected', templateId: it.id })}
          >${it.label}</button>`,
        )}
      </div>
    </section>`;
  }
}

export class EmrTimeAxisElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ attribute: false }) model?: TimeAxisViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`<div class="emr-card">
      <div class="toolbar-row">
        ${m.ticks.map(
          (tick) => html`<button
            type="button"
            class="emr-btn emr-btn--secondary"
            aria-pressed=${m.selectedTickId === tick.id}
            @click=${() => this.emitIntent<TimeAxisIntent>({ type: 'tickSelected', tickId: tick.id })}
          >${tick.label}</button>`,
        )}
      </div>
    </div>`;
  }
}

export class EmrDataTableElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ attribute: false }) model?: EmrDataTableModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`<section class="emr-card">
      ${m.caption ? html`<h3 class="emr-title">${m.caption}</h3>` : nothing}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              ${m.columns.map(
                (col) => html`<th @click=${() => col.sortable && this.emitIntent<EmrDataTableIntent>({ type: 'sortChanged', columnId: col.id, direction: 'asc' })}>
                  ${col.label}
                </th>`,
              )}
            </tr>
          </thead>
          <tbody>
            ${m.rows.map(
              (row) => html`<tr @click=${() => this.emitIntent<EmrDataTableIntent>({ type: 'rowActivated', id: row.id })}>
                ${m.columns.map((col) => {
                  const c = row.cells[col.id];
                  const txt = typeof c === 'string' || typeof c === 'number' ? String(c) : c?.text ?? '—';
                  return html`<td>${txt}</td>`;
                })}
              </tr>`,
            )}
          </tbody>
        </table>
      </div>
    </section>`;
  }
}

export class EmrClinicalCellRendererElement extends EmrLitElement {
  @property({ type: String }) columnId = '';
  @property({ type: Object }) cellModel?: unknown;

  override render() {
    return html`<slot></slot>`;
  }
}

export function registerL3Elements(): void {
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
}
