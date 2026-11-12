import { html, css, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import type {
  AnnotationListIntent,
  AnnotationListViewModel,
  AnnotationToolbarIntent,
  AnnotationToolbarViewModel,
  ClinicalAssessmentStatus,
  ClinicalCellState,
  ClinicalColumn,
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFieldValue,
  ClinicalFormIntent,
  ClinicalFormViewModel,
  ClinicalListIntent,
  ClinicalListItem,
  ClinicalMatrixBlockDefinition,
  ClinicalMatrixIntent,
  ClinicalMatrixSchema,
  ClinicalMatrixValues,
  ClinicalRow,
  EmrBadge,
  EmrDataTableIntent,
  EmrDataTableModel,
  ImageTemplatePickerIntent,
  ImageTemplatePickerViewModel,
  RepeatableGroupDefinition,
  RepeatableItemState,
  SectionCardIntent,
  TimeAxisIntent,
  TimeAxisViewModel,
} from '@drguptavivek/emr-controller';
import { EmrLitElement, defineEmrElement, emrShadowStyles } from './foundations.js';
import { renderEmrSvgIcon } from './icons.js';
import { registerL2Elements } from './l2-fields.js';

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
  [data-density="compact"] th, [data-density="compact"] td {
    padding-block: 4px;
  }
  .toolbar-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }
  .field-stack {
    display: grid;
    gap: 12px;
  }
  .section-content[data-collapsed] {
    display: none;
  }
  @media print {
    .section-content[data-collapsed] { display: block; }
    .section-toggle { display: none; }
  }
`;

function fieldIsShown(state?: ClinicalFieldState): boolean {
  if (!state?.hidden) return true;
  const value = state.value;
  return value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
}

interface FieldActions {
  canEdit(): boolean;
  edit(value: ClinicalFieldValue): void;
  status(status: ClinicalAssessmentStatus | undefined): void;
  focus(): void;
}

function fieldCanEdit(readOnly: boolean, state?: Pick<ClinicalFieldState, 'readOnly' | 'disabled'>): boolean {
  return !readOnly && !state?.readOnly && !state?.disabled;
}

function renderField(
  definition: ClinicalFieldDefinition,
  state: ClinicalFieldState | undefined,
  controlId: string,
  readOnly: boolean,
  actions: FieldActions,
) {
  return html`<emr-typed-field
    .definition=${definition}
    .model=${state}
    .controlId=${controlId}
    .readOnly=${readOnly}
    @valueChange=${(event: CustomEvent<ClinicalFieldValue>) => {
      event.stopPropagation();
      if (actions.canEdit()) actions.edit(event.detail);
    }}
    @statusChange=${(event: CustomEvent<ClinicalAssessmentStatus | undefined>) => {
      event.stopPropagation();
      if (actions.canEdit()) actions.status(event.detail);
    }}
    @focused=${(event: Event) => {
      event.stopPropagation();
      actions.focus();
    }}
  ></emr-typed-field>`;
}

export class EmrSectionCardElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ type: String }) override title = '';
  @property({ type: String }) description = '';
  @property({ attribute: false }) status?: EmrBadge;
  @property({ type: String }) sectionId = '';
  @property({ type: Boolean }) collapsible = false;
  @property({ type: Boolean }) collapsed = false;

  override render() {
    return html`<section class="emr-card" part="section">
      <header class="emr-header">
        <div>
          <h3 class="emr-title">${this.collapsible
            ? html`<span>${this.title}</span>
                <button type="button" class="emr-btn emr-btn--small section-toggle"
                  aria-expanded=${!this.collapsed}
                  aria-label=${`${this.collapsed ? 'Expand' : 'Collapse'} ${this.title}`}
                  @click=${() => this.emitIntent<SectionCardIntent>({ type: 'toggleRequested', sectionId: this.sectionId })}>
                  ${this.collapsed ? 'Expand' : 'Collapse'}
                </button>`
            : this.title}</h3>
          ${this.description ? html`<p class="emr-muted">${this.description}</p>` : nothing}
        </div>
        ${this.status ? html`<emr-badge .badge=${this.status}></emr-badge>` : nothing}
      </header>
      <div class="section-content" ?data-collapsed=${this.collapsed}><slot></slot></div>
    </section>`;
  }
}

export class EmrRepeatableGroupElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ type: String }) override title = '';
  @property({ attribute: false }) definition?: RepeatableGroupDefinition;
  @property({ attribute: false }) items: readonly RepeatableItemState[] = [];
  @property({ type: String }) idPrefix = '';
  @property({ type: Boolean }) readOnly = false;

  override render() {
    const group = this.definition;
    return html`<section class="emr-card">
      <header class="emr-header">
        <h4 class="emr-title">${group?.label ?? this.title}</h4>
        ${group && !this.readOnly
          ? html`<button type="button" class="emr-btn emr-btn--secondary" @click=${() => {
              if (!this.readOnly) this.emitIntent<ClinicalFormIntent>({ type: 'repeatItemAddRequested', groupId: group.id });
            }}>${group.addLabel ?? 'Add entry'}</button>`
          : nothing}
      </header>
      ${group?.description ? html`<p class="emr-muted">${group.description}</p>` : nothing}
      ${group
        ? repeat(this.items, (item) => item.id, (item, index) => {
            const locked = this.readOnly || !!item.readOnly;
            return html`<article class="emr-card field-stack">
              <header class="emr-header">
                <strong>${item.label ?? `Entry ${index + 1}`}</strong>
                ${locked ? nothing : html`<button type="button" class="emr-btn emr-btn--ghost"
                  @click=${() => {
                    const current = this.items.find((entry) => entry.id === item.id);
                    if (!this.readOnly && current && !current.readOnly) {
                      this.emitIntent<ClinicalFormIntent>({ type: 'repeatItemRemoveRequested', groupId: group.id, itemId: item.id });
                    }
                  }}>Remove</button>`}
              </header>
              ${repeat(group.fields.filter((field) => fieldIsShown(item.fields[field.id])), (field) => field.id, (field) => {
                const path = { groupId: group.id, itemId: item.id, fieldId: field.id };
                return renderField(field, item.fields[field.id], `${this.idPrefix}${group.id}-${item.id}-${field.id}`, locked, {
                  canEdit: () => {
                    const current = this.items.find((entry) => entry.id === item.id);
                    return !!current && fieldCanEdit(this.readOnly || !!current.readOnly, current.fields[field.id]);
                  },
                  edit: (value) => this.emitIntent<ClinicalFormIntent>({ type: 'repeatItemEditRequested', ...path, value }),
                  status: (status) => this.emitIntent<ClinicalFormIntent>({ type: 'repeatItemStatusEditRequested', ...path, status }),
                  focus: () => this.emitIntent<ClinicalFormIntent>({ type: 'fieldFocused', fieldId: `${group.id}.${item.id}.${field.id}` }),
                });
              })}
            </article>`;
          })
        : nothing}
      ${group && !this.items.length ? html`<p class="emr-muted">No entries recorded.</p>` : nothing}
      <slot></slot>
    </section>`;
  }
}

export class EmrClinicalFormElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ attribute: false }) model?: ClinicalFormViewModel;
  @property({ type: String }) idPrefix = '';

  private field(model: ClinicalFormViewModel, definition: ClinicalFieldDefinition) {
    const fieldId = definition.id;
    return renderField(definition, model.fields[fieldId], `${this.idPrefix}${model.schema.id}-${fieldId}`, !!model.readOnly, {
      canEdit: () => !!this.model && fieldCanEdit(!!this.model.readOnly, this.model.fields[fieldId]),
      edit: (value) => this.emitIntent<ClinicalFormIntent>({ type: 'fieldEditRequested', fieldId, value }),
      status: (status) => this.emitIntent<ClinicalFormIntent>({ type: 'fieldStatusEditRequested', fieldId, status }),
      focus: () => this.emitIntent<ClinicalFormIntent>({ type: 'fieldFocused', fieldId }),
    });
  }

  private matrix(model: ClinicalFormViewModel, block: ClinicalMatrixBlockDefinition) {
    const rows = block.rows.filter((row) => Object.values(row.cells).some((field) => fieldIsShown(model.fields[field.id])));
    if (!rows.length) return nothing;
    return html`<div class="table-wrap">
      <table>
        <caption>${block.label}</caption>
        <thead><tr><th scope="col">Finding</th>${block.columns.map((col) => html`<th scope="col">${col.label}</th>`)}</tr></thead>
        <tbody>${repeat(rows, (row) => row.id, (row) => html`<tr>
          <th scope="row">${row.label}</th>
          ${block.columns.map((col) => {
            const field = row.cells[col.id];
            return html`<td>${field && fieldIsShown(model.fields[field.id]) ? this.field(model, field) : nothing}</td>`;
          })}
        </tr>`)}</tbody>
      </table>
    </div>`;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const sections = m.schema.sections.filter((section) => section.blocks.some((block) => {
      if (block.kind === 'repeatable') return true;
      if (block.kind === 'matrix') {
        return block.rows.some((row) => Object.values(row.cells).some((field) => fieldIsShown(m.fields[field.id])));
      }
      return fieldIsShown(m.fields[block.id]);
    }));
    return html`<form class="emr-card field-stack" novalidate aria-label=${m.schema.label} @submit=${(e: Event) => e.preventDefault()}>
      ${m.schema.description ? html`<p>${m.schema.description}</p>` : nothing}
      ${m.correction ? html`<div>
        ${m.correction.description ? html`<p>${m.correction.description}</p>` : nothing}
        <button type="button" class="emr-btn emr-btn--outline"
          @click=${() => this.emitIntent<ClinicalFormIntent>({ type: 'correctionRequested' })}>${m.correction.label}</button>
      </div>` : nothing}
      ${repeat(sections, (section) => section.id, (section) => html`<emr-section-card
        .sectionId=${section.id}
        .title=${section.label}
        .description=${section.description ?? ''}
        .status=${m.sectionStatuses?.[section.id]}
        .collapsible=${!!section.collapsible}
        .collapsed=${!!m.collapsedSectionIds?.includes(section.id)}
        @intent=${(event: CustomEvent<SectionCardIntent>) => {
          if (event.target !== event.currentTarget) return;
          event.stopPropagation();
          this.emitIntent<ClinicalFormIntent>({ type: 'sectionToggleRequested', sectionId: event.detail.sectionId });
        }}
      >
        <div class="field-stack">
          ${repeat(section.blocks, (block) => block.id, (block) => {
            if (block.kind === 'matrix') return this.matrix(m, block);
            if (block.kind === 'repeatable') return html`<emr-repeatable-group
              .definition=${block}
              .items=${m.repeatableGroups[block.id] ?? []}
              .readOnly=${!!m.readOnly}
              .idPrefix=${`${this.idPrefix}${m.schema.id}-`}
              @intent=${(event: CustomEvent<ClinicalFormIntent>) => {
                event.stopPropagation();
                if (this.model && (!this.model.readOnly || event.detail.type === 'fieldFocused')) {
                  this.emitIntent(event.detail);
                }
              }}
            ></emr-repeatable-group>`;
            return fieldIsShown(m.fields[block.id]) ? this.field(m, block) : nothing;
          })}
        </div>
      </emr-section-card>`)}
    </form>`;
  }
}

export class EmrClinicalListElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ type: String }) override title = 'Clinical list';
  @property({ attribute: false }) items: readonly ClinicalListItem[] = [];
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) allowAdd = true;
  @property({ type: String }) emptyMessage = 'No entries recorded.';

  private itemIntent(type: 'selected' | 'editRequested' | 'removeRequested', id: string): void {
    const item = this.items.find((candidate) => candidate.id === id);
    if (item && (type === 'selected' || (!this.readOnly && !item.readOnly))) {
      this.emitIntent<ClinicalListIntent>({ type, id });
    }
  }

  override render() {
    return html`<section class="emr-card">
      <header class="emr-header">
        <h3 class="emr-title">${this.title}</h3>
        ${this.allowAdd && !this.readOnly
          ? html`<button type="button" class="emr-btn emr-btn--secondary" @click=${() => {
              if (this.allowAdd && !this.readOnly) this.emitIntent<ClinicalListIntent>({ type: 'addRequested' });
            }}>+ Add</button>`
          : nothing}
      </header>
      ${!this.items.length ? html`<p class="emr-muted">${this.emptyMessage}</p>` : nothing}
      <ul style="list-style:none;padding:0;margin:0;display:grid;gap:8px;">
        ${this.items.map(
          (it) => html`<li style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border:1px solid var(--emr-border,#c7d3da);border-radius:var(--emr-radius,8px);">
            <div>
              <button type="button" class="emr-btn emr-btn--ghost" @click=${() => this.itemIntent('selected', it.id)}>${it.title}</button>
              ${it.subtitle ? html`<div class="emr-muted">${it.subtitle}</div>` : nothing}
              ${it.detail ? html`<div>${it.detail}</div>` : nothing}
              <div class="toolbar-row">${it.badges?.map((badge) => html`<emr-badge .badge=${badge}></emr-badge>`)}</div>
            </div>
            ${!this.readOnly && !it.readOnly ? html`<div class="toolbar-row">
              <button type="button" class="emr-btn emr-btn--ghost" aria-label=${`Edit ${it.title}`}
                @click=${() => this.itemIntent('editRequested', it.id)}>Edit</button>
              <button type="button" class="emr-btn emr-btn--ghost" aria-label=${`Remove ${it.title}`}
                @click=${() => this.itemIntent('removeRequested', it.id)}>Remove</button>
            </div>` : nothing}
          </li>`,
        )}
      </ul>
    </section>`;
  }
}

export class EmrClinicalMatrixElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ attribute: false }) definition?: ClinicalMatrixSchema;
  @property({ attribute: false }) model: ClinicalMatrixValues = {};
  @property({ attribute: false }) customRenderers: EmrCustomRenderers = {};
  @property({ type: Boolean }) readOnly = false;

  private cell(row: ClinicalRow, column: ClinicalColumn) {
    if (row.applicableColumnIds && !row.applicableColumnIds.includes(column.id)) return nothing;
    const cell = this.model[row.id]?.cells[column.id];
    const readOnly = this.readOnly || !!cell?.readOnly;
    const address = { rowId: row.id, columnId: column.id };
    const renderCustom = row.customRendererKey ? this.customRenderers[row.customRendererKey] : undefined;
    if (row.type === 'custom' && renderCustom) {
      const context: EmrClinicalCellRenderContext = { row, column, cell, readOnly, emit: (action, payload) => {
        const current = this.model[row.id]?.cells[column.id];
        if (!this.readOnly && !current?.readOnly && !current?.disabled) {
          this.emitIntent<ClinicalMatrixIntent>({ type: 'customCellIntent', ...address, action, payload });
        }
      } };
      return html`<emr-clinical-cell-renderer .columnId=${column.id} .cellModel=${context}
        .renderer=${renderCustom}></emr-clinical-cell-renderer>`;
    }
    const field: ClinicalFieldDefinition = {
      id: `${row.id}-${column.id}`,
      label: `${row.label}, ${column.label}`,
      type: row.type,
      unit: row.unit,
      precision: row.precision,
      options: row.options,
      hint: row.helpText,
      assessmentStatusOptions: row.assessmentStatusOptions,
      customRendererKey: row.customRendererKey,
    };
    const state: ClinicalFieldState | undefined = cell && {
      ...cell,
      assessmentStatus: row.assessmentStatusOptions?.length ? cell.assessmentStatus?.value : undefined,
    };
    return html`${renderField(field, state, field.id, readOnly, {
      canEdit: () => fieldCanEdit(this.readOnly, this.model[row.id]?.cells[column.id]),
      edit: (value) => {
        if (!Array.isArray(value) && (value === null || typeof value !== 'object' || ('value' in value && 'unit' in value))) {
          this.emitIntent<ClinicalMatrixIntent>({ type: 'cellEditRequested', ...address, value: value as ClinicalCellState['value'] });
        }
      },
      status: (status) => this.emitIntent<ClinicalMatrixIntent>({ type: 'cellAssessmentStatusEditRequested', ...address, status: status ?? null }),
      focus: () => this.emitIntent<ClinicalMatrixIntent>({ type: 'cellFocused', ...address }),
    })}
    ${cell?.assessmentStatus && !row.assessmentStatusOptions?.length ? html`<emr-badge .badge=${cell.assessmentStatus}></emr-badge>` : nothing}
    ${cell?.flagBadge ? html`<emr-badge .badge=${cell.flagBadge}></emr-badge>` : nothing}
    ${cell?.previousValueLabel ? html`<small>${cell.previousValueLabel}</small>` : nothing}
    ${cell?.deltaLabel ? html`<small>${cell.deltaLabel}</small>` : nothing}`;
  }

  override render() {
    const def = this.definition;
    if (!def) return nothing;
    return html`<section class="emr-card">
      <h3 class="emr-title">${def.label}</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Finding</th>
              ${def.columns.map((col) => html`<th scope="col">${col.label}</th>`)}
              <th scope="col">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${repeat(def.rows, (row) => row.id, (row) => {
              const state = this.model[row.id];
              return html`<tr>
                <th scope="row">${row.label}</th>
                ${def.columns.map((column) => html`<td>${this.cell(row, column)}</td>`)}
                <td>
                  <input class="emr-control" aria-label=${`Remarks for ${row.label}`}
                    .value=${live(state?.remark ?? '')}
                    ?readonly=${this.readOnly || !!state?.remarkReadOnly}
                    ?disabled=${!!state?.remarkDisabled}
                    aria-invalid=${!!state?.remarkError}
                    @blur=${(event: Event) => {
                      (event.target as HTMLInputElement).value = this.model[row.id]?.remark ?? '';
                    }}
                    @input=${(event: Event) => {
                      const current = this.model[row.id];
                      if (!this.readOnly && !current?.remarkReadOnly && !current?.remarkDisabled) {
                        this.emitIntent<ClinicalMatrixIntent>({ type: 'remarkEditRequested', rowId: row.id, remark: (event.target as HTMLInputElement).value });
                      }
                    }}>
                  ${state?.remarkError ? html`<p class="emr-error">${state.remarkError}</p>` : nothing}
                </td>
              </tr>`;
            })}
          </tbody>
        </table>
      </div>
    </section>`;
  }
}

export interface EmrClinicalCellRenderContext {
  row: ClinicalRow;
  column: ClinicalColumn;
  cell?: ClinicalCellState;
  readOnly: boolean;
  emit(action: string, payload?: unknown): void;
}

export type EmrCustomRenderers = Readonly<Record<string, (context: EmrClinicalCellRenderContext) => TemplateResult>>;

export class EmrAnnotationToolbarElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ attribute: false }) model?: AnnotationToolbarViewModel;

  private button(label: string, intent: AnnotationToolbarIntent, enabled: () => boolean) {
    return html`<button type="button" class="emr-btn emr-btn--secondary" ?disabled=${!enabled()}
      @click=${() => { if (enabled()) this.emitIntent(intent); }}>${label}</button>`;
  }

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
            ?disabled=${!!m.readOnly || !!tool.disabled}
            @click=${() => {
              const current = this.model;
              if (current && !current.readOnly && current.tools.some((item) => item.id === tool.id && !item.disabled)) {
                this.emitIntent<AnnotationToolbarIntent>({ type: 'toolSelected', toolId: tool.id });
              }
            }}
          >${tool.label}</button>`,
        )}
        ${m.colours.map((colour) => this.button(colour.label, { type: 'colourSelected', colourId: colour.id },
          () => !!this.model && !this.model.readOnly && this.model.colours.some((item) => item.id === colour.id)))}
        ${m.widths.map((width) => this.button(width.label, { type: 'widthSelected', widthId: width.id },
          () => !!this.model && !this.model.readOnly && this.model.widths.some((item) => item.id === width.id)))}
        ${this.button('Undo', { type: 'undoRequested' }, () => !!this.model?.canUndo && !this.model.readOnly)}
        ${this.button('Redo', { type: 'redoRequested' }, () => !!this.model?.canRedo && !this.model.readOnly)}
        ${this.button(m.saveLabel ?? 'Save', { type: 'saveRequested' }, () => !!this.model?.canSave && !this.model.readOnly)}
        ${this.button('Zoom out', { type: 'zoomOutRequested' }, () => !!this.model && !this.model.zoomLocked)}
        ${this.button(m.zoomLabel, { type: 'zoomResetRequested' }, () => !!this.model && !this.model.zoomLocked)}
        ${this.button('Zoom in', { type: 'zoomInRequested' }, () => !!this.model && !this.model.zoomLocked)}
        ${this.button('Fit', { type: 'zoomFitRequested' }, () => !!this.model && !this.model.zoomLocked)}
      </div>
    </div>`;
  }
}

export class EmrAnnotationListElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ attribute: false }) model?: AnnotationListViewModel;

  private edit(intent: Exclude<AnnotationListIntent, { type: 'layerSelected' }>): void {
    const m = this.model;
    const index = m?.items.findIndex((item) => item.layer.id === intent.layerId) ?? -1;
    if (!m || m.readOnly || index < 0) return;
    if (intent.type === 'layerLockToggleRequested' && !m.canLock) return;
    if (intent.type === 'layerMoveRequested' && !m.items[index + (intent.direction === 'up' ? -1 : 1)]) return;
    this.emitIntent(intent);
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`<section class="emr-card">
      <h4 class="emr-title">Annotations</h4>
      ${!m.items.length ? html`<p class="emr-muted">${m.emptyMessage}</p>` : nothing}
      <ol style="margin:0;padding-left:20px;display:grid;gap:6px;">
        ${m.items.map(
          (it, index) => html`<li style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <div>
              <button type="button" class="emr-btn emr-btn--ghost" aria-pressed=${it.layer.id === m.selectedLayerId}
                @click=${() => this.emitIntent<AnnotationListIntent>({ type: 'layerSelected', layerId: it.layer.id })}>
                ${it.number}. ${it.layer.label}
              </button>
              ${it.classLabel ? html`<span>${it.classLabel}</span>` : nothing}
              ${it.description ? html`<p class="emr-muted">${it.description}</p>` : nothing}
              ${it.layer.visible === false ? html`<span class="emr-muted">Hidden</span>` : nothing}
            </div>
            ${m.readOnly ? nothing : html`<div class="toolbar-row">
              <button type="button" class="emr-btn emr-btn--secondary" aria-label=${`Toggle visibility of ${it.layer.label}`}
                @click=${() => this.edit({ type: 'layerVisibilityToggleRequested', layerId: it.layer.id })}>
                ${renderEmrSvgIcon(it.layer.visible === false ? 'eye-off' : 'eye', 14)}
              </button>
              ${m.canLock ? html`<button type="button" class="emr-btn emr-btn--secondary" aria-label=${`Toggle lock for ${it.layer.label}`}
                @click=${() => this.edit({ type: 'layerLockToggleRequested', layerId: it.layer.id })}>
                ${renderEmrSvgIcon(it.locked ? 'lock' : 'unlock', 14)}
              </button>` : nothing}
              <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${index === 0}
                @click=${() => this.edit({ type: 'layerMoveRequested', layerId: it.layer.id, direction: 'up' })}>Move up</button>
              <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${index === m.items.length - 1}
                @click=${() => this.edit({ type: 'layerMoveRequested', layerId: it.layer.id, direction: 'down' })}>Move down</button>
              <button type="button" class="emr-btn emr-btn--ghost" aria-label=${`Remove ${it.layer.label}`}
                @click=${() => this.edit({ type: 'layerRemoveRequested', layerId: it.layer.id })}>Remove</button>
            </div>`}
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
    const favourites = m.favouriteIds ?? [];
    const optionsById = new Map(m.options.map((option) => [option.id, option]));
    const featured = favourites.flatMap((id) => {
      const option = optionsById.get(id);
      return option ? [option] : [];
    });
    const options = [...featured, ...m.options.filter((option) => !favourites.includes(option.id))];
    return html`<section class="emr-card">
      <header class="emr-header">
        <h4 class="emr-title">${m.title}</h4>
        <button type="button" class="emr-btn emr-btn--ghost"
          @click=${() => this.emitIntent<ImageTemplatePickerIntent>({ type: 'closeRequested' })}>Close</button>
      </header>
      <input class="emr-control" type="search" aria-label="Search templates" .value=${live(m.query)}
        ?readonly=${!!m.readOnly}
        @input=${(event: Event) => {
          if (this.model && !this.model.readOnly) {
            this.emitIntent<ImageTemplatePickerIntent>({ type: 'queryChangeRequested', query: (event.target as HTMLInputElement).value });
          }
        }}>
      <div class="toolbar-row">
        ${[{ id: null, label: 'All' }, { id: 'favourites', label: 'Favourites' }, ...m.groups.filter((group) => group.id !== 'favourites')].map((group) =>
          html`<button type="button" class="emr-btn emr-btn--secondary"
            aria-pressed=${(m.selectedGroupId ?? null) === group.id}
            ?disabled=${!!m.readOnly}
            @click=${() => {
              if (this.model && !this.model.readOnly) this.emitIntent<ImageTemplatePickerIntent>({ type: 'groupSelected', groupId: group.id });
            }}>${group.label}</button>`)}
      </div>
      ${m.totalLabel ? html`<p class="emr-muted">${m.totalLabel}</p>` : nothing}
      ${!options.length ? html`<p class="emr-muted">${m.emptyMessage}</p>` : nothing}
      <div class="toolbar-row">
        ${repeat(options, (option) => option.id, (option) => html`<div class="emr-card">
          <button type="button" class="emr-btn emr-btn--secondary" aria-pressed=${m.selectedId === option.id}
            ?disabled=${!!m.readOnly}
            @click=${() => {
              if (this.model && !this.model.readOnly) this.emitIntent<ImageTemplatePickerIntent>({ type: 'templateSelected', templateId: option.id });
            }}>
            <img src=${option.imageUrl} alt=${option.altText ?? ''} loading="lazy" style="width:48px;height:48px;object-fit:contain;">
            ${option.label}
          </button>
          ${option.badges?.map((badge) => html`<span class="emr-badge">${badge}</span>`)}
          ${!m.readOnly && m.canEditFavourites ? html`<button type="button" class="emr-btn emr-btn--ghost"
            aria-pressed=${favourites.includes(option.id)} aria-label=${`Favourite ${option.label}`}
            @click=${() => {
              const current = this.model;
              if (current?.canEditFavourites && !current.readOnly) this.emitIntent<ImageTemplatePickerIntent>({
                type: 'favouriteToggleRequested', templateId: option.id, favourite: !current.favouriteIds?.includes(option.id),
              });
            }}>Favourite</button>` : nothing}
        </div>`)}
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
      ${m.title ? html`<h4 class="emr-title">${m.title}</h4>` : nothing}
      <div class="toolbar-row">
        ${m.readOnly ? nothing : html`
          <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${!m.canShiftEarlier}
            @click=${() => {
              if (this.model?.canShiftEarlier && !this.model.readOnly) this.emitIntent<TimeAxisIntent>({ type: 'shiftEarlierRequested' });
            }}>Earlier</button>
          <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${!m.canShiftLater}
            @click=${() => {
              if (this.model?.canShiftLater && !this.model.readOnly) this.emitIntent<TimeAxisIntent>({ type: 'shiftLaterRequested' });
            }}>Later</button>
        `}
        ${!m.readOnly && m.steps?.length ? html`
          <select class="emr-control" aria-label="Time interval" .value=${live(m.selectedStepId ?? '')}
            @change=${(event: Event) => {
              const target = event.target as HTMLSelectElement;
              const stepId = target.value;
              target.value = this.model?.selectedStepId ?? '';
              if (!this.model?.readOnly && this.model?.steps?.some((step) => step.id === stepId)) {
                this.emitIntent<TimeAxisIntent>({ type: 'stepChangeRequested', stepId });
              }
            }}>
            ${m.steps.map((step) => html`<option value=${step.id} ?selected=${m.selectedStepId === step.id}>${step.label}</option>`)}
          </select>` : m.stepLabel ?? nothing}
      </div>
      <div class="toolbar-row">
        ${m.ticks.map(
          (tick) => m.readOnly ? html`<span aria-current=${tick.current ? 'time' : 'false'}>${tick.label} ${tick.sublabel}</span>` : html`<button
            type="button"
            class="emr-btn emr-btn--secondary"
            aria-pressed=${m.selectedTickId === tick.id}
            aria-current=${tick.current ? 'time' : 'false'}
            @click=${() => {
              if (this.model && !this.model.readOnly) this.emitIntent<TimeAxisIntent>({ type: 'tickSelected', tickId: tick.id });
            }}
          >${tick.label} ${tick.sublabel}</button>`,
        )}
      </div>
    </div>`;
  }
}

export class EmrDataTableElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l3Styles];
  @property({ attribute: false }) model?: EmrDataTableModel;

  private changeSort(columnId: string): void {
    const m = this.model;
    if (!m?.columns.some((column) => column.id === columnId && column.sortable)) return;
    const direction = m.sort?.columnId === columnId && m.sort.direction === 'asc' ? 'desc' : 'asc';
    this.emitIntent<EmrDataTableIntent>({ type: 'sortChanged', columnId, direction });
  }

  private selectRow(rowId: string, checked: boolean): void {
    const m = this.model;
    if (!m?.rows.some((row) => row.id === rowId)) return;
    const ids = new Set(m.selectedIds);
    if (checked) ids.add(rowId);
    else ids.delete(rowId);
    this.emitIntent<EmrDataTableIntent>({ type: 'selectionChanged', selectedIds: [...ids] });
  }

  private changePage(delta: number): void {
    const m = this.model;
    if (!m) return;
    const page = m.page + delta;
    if (page >= 1 && page <= m.pageCount) this.emitIntent<EmrDataTableIntent>({ type: 'pageChanged', page });
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`<section class="emr-card" data-density=${m.density}>
      ${m.caption ? html`<h3 class="emr-title">${m.caption}</h3>` : nothing}
      ${m.status === 'loading' ? html`<p role="status">Loading…</p>`
        : m.status === 'error' ? html`<p role="alert">${m.error ?? 'Unable to load rows.'}</p>
            <button type="button" class="emr-btn emr-btn--secondary"
              @click=${() => this.emitIntent<EmrDataTableIntent>({ type: 'retryRequested' })}>Retry</button>`
        : html`
        <div class="toolbar-row">
          ${m.filters.map((filter) => html`<button type="button" class="emr-btn emr-btn--secondary"
            aria-label=${`Remove filter ${filter.label}`}
            @click=${() => this.emitIntent<EmrDataTableIntent>({ type: 'filterRemoved', id: filter.id })}>
            ${filter.label}: ${filter.valueLabel} ×
          </button>`)}
          <button type="button" class="emr-btn emr-btn--secondary"
            @click=${() => this.emitIntent<EmrDataTableIntent>({ type: 'filterAddRequested' })}>Add filter</button>
          ${m.savedFilters.map((filter) => html`<button type="button" class="emr-btn emr-btn--secondary"
            @click=${() => this.emitIntent<EmrDataTableIntent>({ type: 'savedFilterSelected', id: filter.id })}>${filter.label}</button>`)}
          <button type="button" class="emr-btn emr-btn--secondary"
            @click=${() => this.emitIntent<EmrDataTableIntent>({ type: 'saveFilterRequested' })}>Save filter</button>
          <button type="button" class="emr-btn emr-btn--secondary"
            @click=${() => this.emitIntent<EmrDataTableIntent>({ type: 'exportRequested', format: 'csv' })}>Export CSV</button>
          <button type="button" class="emr-btn emr-btn--secondary" aria-pressed=${m.density === 'compact'}
            @click=${() => this.emitIntent<EmrDataTableIntent>({
              type: 'densityChanged', density: this.model?.density === 'compact' ? 'comfortable' : 'compact',
            })}>Compact</button>
          ${m.bulkActions.map((action) => html`<button type="button" class="emr-btn emr-btn--secondary"
            ?disabled=${!m.selectedIds.length}
            @click=${() => {
              if (this.model?.selectedIds.length) this.emitIntent<EmrDataTableIntent>({ type: 'bulkActionRequested', id: action.id });
            }}>${action.label}</button>`)}
        </div>
        <div class="table-wrap">
        <table aria-label=${m.caption}>
          <thead>
            <tr>
              <th scope="col">Select</th>
              ${m.columns.map(
                (col) => html`<th scope="col" aria-sort=${m.sort?.columnId === col.id ? (m.sort.direction === 'asc' ? 'ascending' : 'descending') : nothing}>
                  ${col.sortable ? html`<button type="button" class="emr-btn emr-btn--ghost"
                    @click=${() => this.changeSort(col.id)}>${col.label}</button>` : col.label}
                </th>`,
              )}
            </tr>
          </thead>
          <tbody>${repeat(m.rows, (row) => row.id, (row, index) => html`<tr>
                <td><input type="checkbox" aria-label=${`Select row ${index + 1}`}
                  .checked=${live(m.selectedIds.includes(row.id))}
                  @change=${(event: Event) => {
                    const target = event.target as HTMLInputElement;
                    const checked = target.checked;
                    target.checked = this.model?.selectedIds.includes(row.id) ?? false;
                    this.selectRow(row.id, checked);
                  }}></td>
                ${m.columns.map((col, columnIndex) => {
                  const c = row.cells[col.id];
                  const txt = typeof c === 'string' ? c : c?.text ?? '';
                  const badge = typeof c === 'object' ? c.badge : undefined;
                  return html`<td>${columnIndex === 0
                    ? html`<button type="button" class="emr-btn emr-btn--ghost"
                        @click=${() => this.emitIntent<EmrDataTableIntent>({ type: 'rowActivated', id: row.id })}>${txt || `Open row ${index + 1}`}</button>`
                    : txt}
                    ${badge ? html`<emr-badge .badge=${badge}></emr-badge>` : nothing}
                  </td>`;
                })}
              </tr>`)}</tbody>
        </table>
        </div>
        <div class="toolbar-row">
          <span role="status">${m.summaryLabel}</span>
          <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${m.page <= 1} @click=${() => this.changePage(-1)}>Previous</button>
          <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${m.page >= m.pageCount} @click=${() => this.changePage(1)}>Next</button>
          ${m.pageSizeOptions.length ? html`<select class="emr-control" aria-label="Rows per page"
            @change=${(event: Event) => {
              const target = event.target as HTMLSelectElement;
              const pageSize = Number(target.value);
              target.value = String(this.model?.pageSize ?? '');
              if (this.model?.pageSizeOptions.includes(pageSize)) this.emitIntent<EmrDataTableIntent>({ type: 'pageSizeChanged', pageSize });
            }}>
            ${m.pageSizeOptions.map((size) => html`<option value=${size} ?selected=${size === m.pageSize}>${size}</option>`)}
          </select>` : nothing}
        </div>`}
    </section>`;
  }
}

export class EmrClinicalCellRendererElement extends EmrLitElement {
  @property({ type: String }) columnId = '';
  @property({ attribute: false }) cellModel?: EmrClinicalCellRenderContext;
  @property({ attribute: false }) renderer?: (context: EmrClinicalCellRenderContext) => TemplateResult;

  override render() {
    return this.renderer && this.cellModel ? this.renderer(this.cellModel) : html`<slot></slot>`;
  }
}

export function registerL3Elements(): void {
  registerL2Elements();
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
