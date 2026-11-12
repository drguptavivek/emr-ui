import { css, html, nothing, svg, type TemplateResult } from 'lit';
import { live } from 'lit/directives/live.js';
import type {
  CaptureStatusBarIntent, CaptureStatusBarViewModel, ClinicalFieldDefinition, ClinicalFieldValue,
  EvidenceSpan, FieldSuggestion, FlowsheetCellMap, FlowsheetIntent, FlowsheetRow, FlowsheetViewModel,
  NoteCaptureIntent, NoteCaptureViewModel, ObservationTrendIntent, ObservationTrendViewModel,
  TranscriptSegment, TrendAxis,
} from '@drguptavivek/emr-controller';
import { EmrModelElement } from './controlled-rendering.js';
import { defineEmrElement } from './foundations.js';

export class EmrObservationFlowsheetElement extends EmrModelElement<FlowsheetViewModel, FlowsheetIntent> {
  private canEdit(rowId: string, columnId: string): boolean {
    const m = this.model;
    return !!m && !m.readOnly && !m.loading && !m.error && !!m.cells[rowId]?.[columnId]?.editable;
  }

  private row(model: FlowsheetViewModel, row: FlowsheetRow, cells: FlowsheetCellMap, footer = false) {
    return html`<tr>
      <th scope="row">
        ${footer || model.readOnly ? row.label : this.action(row.label, { type: 'rowSelected', rowId: row.id },
          () => !!this.model && !this.model.readOnly)}
        ${row.unitLabel ? html` <small>${row.unitLabel}</small>` : nothing}
      </th>
      <td>${row.referenceLabel}</td>
      ${model.columns.map((column) => {
        const cell = cells[row.id]?.[column.id];
        const selected = model.selectedCell?.rowId === row.id && model.selectedCell.columnId === column.id;
        const editable = !footer && this.canEdit(row.id, column.id);
        const value = cell?.valueLabel ?? cell?.status?.replaceAll('-', ' ') ?? 'Not supplied';
        return html`<td>
          ${editable ? html`<button type="button" class="emr-btn emr-btn--ghost" aria-pressed=${selected}
            aria-label=${`${row.label}, ${column.label}: ${value}`}
            @click=${() => {
              if (this.canEdit(row.id, column.id)) this.send({ type: 'cellSelected', rowId: row.id, columnId: column.id });
            }}>${value}</button>` : html`<span>${value}</span>`}
          ${selected && editable ? html`<form @submit=${(event: SubmitEvent) => {
            event.preventDefault();
            if (!this.canEdit(row.id, column.id)) return;
            const input = (event.currentTarget as HTMLFormElement).elements.namedItem('value') as HTMLInputElement;
            this.send({ type: 'cellEditRequested', rowId: row.id, columnId: column.id, valueLabel: input.value });
          }}>
            <input class="emr-control" name="value" aria-label=${`Edit ${row.label} at ${column.label}`}
              .value=${live(cell?.valueLabel ?? '')}>
            <button type="submit" class="emr-btn">Apply</button>
          </form>` : nothing}
          ${cell?.flag ? html`<emr-badge .badge=${cell.flag}></emr-badge>` : nothing}
          ${cell?.modified ? html`<small>Modified</small>` : nothing}
          ${cell?.previousValueLabel ? html`<small>Previous: ${cell.previousValueLabel}</small>` : nothing}
          ${cell?.deltaLabel ? html`<small>${cell.deltaLabel}</small>` : nothing}
          ${cell?.note ? html`<div>${cell.note}</div>` : nothing}
          ${cell?.provenanceLabel ? html`<small>${cell.provenanceLabel}</small>` : nothing}
        </td>`;
      })}
    </tr>`;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    if (m.loading) return this.panel(m.title, html`<p role="status">Loading observations…</p>`);
    if (m.error) return this.panel(m.title, html`<p class="emr-error" role="alert">${m.error}</p>
      ${this.action('Retry', { type: 'retryRequested' })}`);
    const enabled = () => !!this.model && !this.model.readOnly && !this.model.loading && !this.model.error;
    const rows: TemplateResult[] = [];
    const groups = new Map(m.groups?.map((group) => [group.id, group.label]));
    let previousGroup: string | undefined;
    for (const row of m.rows) {
      if (row.groupId !== previousGroup && row.groupId && groups.has(row.groupId)) {
        rows.push(html`<tr><th colspan=${m.columns.length + 2}>${groups.get(row.groupId)}</th></tr>`);
      }
      rows.push(this.row(m, row, m.cells));
      previousGroup = row.groupId;
    }
    return this.panel(m.title, html`
      ${m.readOnly ? nothing : this.action('Add column', { type: 'columnAddRequested' }, enabled)}
      ${!m.rows.length || !m.columns.length ? html`<p>${m.emptyMessage}</p>` : html`
        <div class="emr-scroll"><table class="emr-table">
          <thead><tr>
            <th scope="col">Observation</th><th scope="col">Reference range</th>
            ${m.columns.map((column, index) => html`<th scope="col" aria-current=${column.current ? 'time' : nothing}>
              ${m.readOnly ? column.label : this.action(column.label, { type: 'columnSelected', columnId: column.id }, enabled)}
              ${column.sublabel ? html`<small>${column.sublabel}</small>` : nothing}
              ${m.readOnly ? nothing : html`<div class="emr-actions">
                ${index ? this.action('Copy previous', { type: 'copyPreviousColumnRequested', targetColumnId: column.id }, enabled) : nothing}
                ${this.action('Normal values', { type: 'macroNormalColumnRequested', targetColumnId: column.id }, enabled)}
              </div>`}
            </th>`)}
          </tr></thead>
          <tbody>${rows}</tbody>
          ${m.footerRows?.length ? html`<tfoot>${m.footerRows.map((row) => this.row(m, row, m.footerCells ?? {}, true))}</tfoot>` : nothing}
        </table></div>
      `}
    `);
  }
}

const plotWidth = 600;
const plotHeight = 220;
const left = 60;
const top = 14;
const width = 480;
const height = 160;
const toneColor = {
  neutral: 'var(--emr-text-muted)', info: 'var(--emr-info)', success: 'var(--emr-success)',
  warning: 'var(--emr-warning)', danger: 'var(--emr-danger)',
} as const;

function scale(value: number, min: number, max: number, pixels: number): number {
  return max > min ? (value - min) / (max - min) * pixels : pixels / 2;
}

let chartSequence = 0;

export class EmrObservationTrendElement extends EmrModelElement<ObservationTrendViewModel, ObservationTrendIntent> {
  static override styles = [...EmrModelElement.styles, css`
    figure { margin: 0; }
    svg { inline-size: 100%; block-size: auto; min-inline-size: 320px; }
    svg text { fill: var(--emr-text); font: 11px var(--emr-font-family, sans-serif); }
  `];
  private readonly clipId = `emr-trend-${++chartSequence}`;

  private shift(delta: -1 | 1): void {
    const m = this.model;
    if (!m || m.readOnly || m.xMax <= m.xMin) return;
    const distance = (m.xMax - m.xMin) * delta / 2;
    this.send({ type: 'rangeChangeRequested', xMin: m.xMin + distance, xMax: m.xMax + distance });
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const x = (value: number) => left + scale(value, m.xMin, m.xMax, width);
    const y = (value: number, axis?: TrendAxis) => {
      const domain = axis === 'secondary' && m.secondaryAxis ? m.secondaryAxis : m;
      return top + height - scale(value, domain.yMin, domain.yMax, height);
    };
    const line = (points: readonly { x: number; y: number }[], axis?: TrendAxis) =>
      points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)).map((p) => `${x(p.x)},${y(p.y, axis)}`).join(' ');
    return this.panel(m.title, html`
      <p>${m.summaryText}</p>
      ${m.xGranularityLabel ? html`<p class="emr-muted">${m.xGranularityLabel}</p>` : nothing}
      ${m.readOnly ? nothing : html`<div class="emr-actions">
        ${m.granularityOptions?.map((option) => html`<button type="button" class="emr-btn emr-btn--secondary"
          aria-pressed=${!!option.selected} @click=${() => {
            if (this.model && !this.model.readOnly) this.send({ type: 'granularityChangeRequested', granularityId: option.id });
          }}>${option.label}</button>`)}
        <button type="button" class="emr-btn emr-btn--secondary" @click=${() => this.shift(-1)}>Earlier</button>
        <button type="button" class="emr-btn emr-btn--secondary" @click=${() => this.shift(1)}>Later</button>
      </div>`}
      ${!m.series.some((series) => series.points.length) ? html`<p>${m.emptyMessage}</p>` : html`
        <figure class="emr-scroll" aria-label=${m.summaryText}>
          <svg viewBox=${`0 0 ${plotWidth} ${plotHeight}`} aria-hidden="true">
            <defs>
              <clipPath id=${this.clipId}><rect x=${left} y=${top} width=${width} height=${height}></rect></clipPath>
              <pattern id=${`${this.clipId}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse">
                <path d="M0 6 L6 0" stroke="var(--emr-text-muted)" stroke-width="1"></path>
              </pattern>
            </defs>
            <g clip-path=${`url(#${this.clipId})`}>
              ${m.bands?.map((band) => {
                const domain = band.axis === 'secondary' && m.secondaryAxis ? m.secondaryAxis : m;
                const upper = y(band.yTo ?? domain.yMax, band.axis);
                const lower = y(band.yFrom ?? domain.yMin, band.axis);
                const bandHeight = Math.max(0, lower - upper);
                return svg`<rect x=${left} y=${upper} width=${width} height=${bandHeight}
                    fill=${toneColor[band.tone]} opacity="0.16"></rect>
                  ${band.pattern === 'hatched' ? svg`<rect x=${left} y=${upper} width=${width} height=${bandHeight}
                    fill=${`url(#${this.clipId}-hatch)`} opacity="0.4"></rect>` : nothing}`;
              })}
              ${m.xMinorTicks?.map((tick) => svg`<line x1=${x(tick.x)} x2=${x(tick.x)} y1=${top} y2=${top + height} stroke="var(--emr-border)"></line>`)}
              ${m.yTicks.map((tick) => svg`<line x1=${left} x2=${left + width} y1=${y(tick.y)} y2=${y(tick.y)} stroke="var(--emr-border)"></line>`)}
              ${m.referenceCurves?.map((curve) => svg`<polyline points=${line(curve.points)} fill="none" stroke="var(--emr-text-muted)" stroke-dasharray="3 3"></polyline>`)}
              ${m.series.map((series) => svg`
                <polyline points=${line(series.points, series.axis)} fill="none" stroke=${toneColor[series.tone]} stroke-width="2"
                  stroke-dasharray=${series.dashed ? '5 4' : nothing}></polyline>
                ${series.points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)).map((point) =>
                  svg`<circle cx=${x(point.x)} cy=${y(point.y, series.axis)} r=${m.selectedPointId === point.id ? 6 : 4}
                    fill=${toneColor[series.tone]} stroke=${point.flag ? toneColor[point.flag.tone] : nothing}></circle>`)}
              `)}
            </g>
            ${m.xTicks.map((tick) => svg`<text x=${x(tick.x)} y=${top + height + 17} text-anchor="middle">${tick.label}</text>`)}
            ${m.yTicks.map((tick) => svg`<text x=${left - 5} y=${y(tick.y)} text-anchor="end">${tick.label}</text>`)}
            ${m.secondaryAxis?.yTicks.map((tick) => svg`<text x=${left + width + 5} y=${y(tick.y, 'secondary')}>${tick.label}</text>`)}
          </svg>
          <figcaption>
            ${m.yLabel}${m.secondaryAxis ? ` · ${m.secondaryAxis.yLabel}` : ''}
            ${[...(m.bands ?? []), ...(m.referenceCurves ?? [])].map((guide) => html`<span> · ${guide.label}</span>`)}
          </figcaption>
        </figure>
        <details open><summary>Trend data</summary>
          <table class="emr-table">
            <thead><tr><th scope="col">Series</th><th scope="col">Time</th><th scope="col">Value</th></tr></thead>
            <tbody>${m.series.flatMap((series) => series.points.map((point) => html`<tr>
              <th scope="row">${series.label}</th><td>${point.xLabel}</td>
              <td>${m.readOnly ? point.valueLabel : html`<button type="button" class="emr-btn emr-btn--ghost"
                aria-pressed=${m.selectedPointId === point.id} @click=${() => {
                  if (this.model && !this.model.readOnly) this.send({ type: 'pointSelected', seriesId: series.id, pointId: point.id });
                }}>${point.valueLabel}</button>`}
                ${point.flag ? html`<emr-badge .badge=${point.flag}></emr-badge>` : nothing}
              </td>
            </tr>`))}</tbody>
          </table>
        </details>
      `}
    `);
  }
}

export class EmrClinicalTranscriptElement extends EmrModelElement<NoteCaptureViewModel, NoteCaptureIntent> {
  private segment(segment: TranscriptSegment, spans: readonly EvidenceSpan[], model: NoteCaptureViewModel) {
    const editable = !model.readOnly && !!segment.editable;
    return html`<li>
      ${[segment.speakerLabel, segment.timeLabel].filter(Boolean).join(' · ')}
      <p>${segment.text}</p>
      <div class="emr-actions">${spans.map((span) => html`<button type="button" class="emr-btn emr-btn--ghost"
        aria-pressed=${model.highlightedSpanIds.includes(span.id)}
        @click=${() => this.send({ type: 'spanSelected', spanId: span.id })}>${segment.text.slice(span.start, span.end)}</button>`)}</div>
      ${editable ? html`<details>
        <summary>Edit segment</summary>
        <form class="emr-stack" @submit=${(event: SubmitEvent) => {
          event.preventDefault();
          const m = this.model;
          if (!m || m.readOnly || !m.segments.find((item) => item.id === segment.id)?.editable) return;
          const input = (event.currentTarget as HTMLFormElement).elements.namedItem('segment') as HTMLTextAreaElement;
          const text = input.value.trim();
          if (text && text !== segment.text) this.send({ type: 'segmentEditRequested', segmentId: segment.id, text });
        }}>
          <textarea name="segment" class="emr-control" aria-label="Segment text" .value=${segment.text}></textarea>
          <button type="submit" class="emr-btn">Apply</button>
        </form>
      </details>` : nothing}
    </li>`;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const editable = () => !!this.model && !this.model.readOnly;
    const spansBySegment = new Map<string, EvidenceSpan[]>();
    for (const span of m.spans) {
      const items = spansBySegment.get(span.segmentId) ?? [];
      items.push(span);
      spansBySegment.set(span.segmentId, items);
    }
    return this.panel(m.title, html`
      <p role="status">${m.dictation.label}</p>
      ${m.dictation.error ? html`<p class="emr-error" role="alert">${m.dictation.error}</p>` : nothing}
      ${m.summariseError ? html`<p class="emr-error" role="alert">${m.summariseError}</p>` : nothing}
      ${m.readOnly ? nothing : html`<div class="emr-actions">
        ${this.action('Start dictation', { type: 'dictationStartRequested' }, () => editable() && !!this.model?.dictation.canStart)}
        ${this.action('Stop dictation', { type: 'dictationStopRequested' }, () => editable() && !!this.model?.dictation.canStop)}
        ${this.action(m.summarising ? 'Summarising…' : 'Summarise', { type: 'summariseRequested' },
          () => editable() && !!this.model?.canSummarise && !this.model.summarising)}
      </div>`}
      ${m.segments.length ? html`<ol>${m.segments.map((segment) => this.segment(segment, spansBySegment.get(segment.id) ?? [], m))}</ol>`
        : html`<p>No transcript recorded.</p>`}
      ${m.readOnly ? nothing : html`
        <form class="emr-stack" @submit=${(event: SubmitEvent) => {
          event.preventDefault();
          const input = (event.currentTarget as HTMLFormElement).elements.namedItem('note') as HTMLTextAreaElement;
          const text = input.value.trim();
          if (editable() && text) {
            this.send({ type: 'textAppendRequested', text });
            input.value = '';
          }
        }}>
          <textarea class="emr-control" aria-label="Append note" name="note"></textarea>
          <button type="submit" class="emr-btn">Append note</button>
        </form>
        <div class="emr-actions">
          ${m.smartPhrases?.map((phrase) => this.action(phrase.label,
            { type: 'smartPhraseTriggered', trigger: phrase.trigger, expansion: phrase.expansion }, editable))}
          ${m.smartLinks?.map((link) => this.action(link.label,
            { type: 'smartLinkInserted', token: link.token, resolvedValue: link.resolvedValue }, editable))}
        </div>
        ${m.smartLists?.map((list) => html`<fieldset><legend>${list.label}</legend>
          ${list.choices.map((choice) => html`<button type="button" class="emr-btn emr-btn--ghost" aria-pressed=${list.selected === choice}
            @click=${() => {
              if (editable()) this.send({ type: 'smartListChoiceSelected', listId: list.id, choice });
            }}>${choice}</button>`)}
        </fieldset>`)}
      `}
      ${m.chartReviewPanes?.map((pane) => html`<details>
        <summary>${pane.label}</summary><dl>${pane.items.map((item) =>
          html`<dt>${item.title}</dt><dd>${item.value}${item.meta ? html` <small>${item.meta}</small>` : nothing}</dd>`)}</dl>
      </details>`)}
    `);
  }
}

function suggestionField(suggestion: FieldSuggestion): ClinicalFieldDefinition | undefined {
  const base = { id: suggestion.id, label: suggestion.fieldLabel };
  switch (suggestion.valueType) {
    case 'text': case 'multiline': case 'integer': case 'decimal': case 'boolean':
    case 'date': case 'time': case 'datetime': case 'select': case 'multiselect':
      return { ...base, type: suggestion.valueType, options: suggestion.options };
    default: return undefined;
  }
}

export class EmrEvidenceSuggestionListElement extends EmrModelElement<NoteCaptureViewModel, NoteCaptureIntent> {
  private isPending(id: string): boolean {
    const m = this.model;
    return !!m && !m.readOnly && m.suggestions.some((suggestion) => suggestion.id === id && suggestion.status === 'pending');
  }

  private suggestion(suggestion: FieldSuggestion, m: NoteCaptureViewModel) {
    const field = suggestionField(suggestion);
    const valueLabel = suggestion.status === 'edited' ? suggestion.editedValueLabel ?? suggestion.valueLabel : suggestion.valueLabel;
    return html`<li class="emr-card emr-stack">
      <button type="button" class="emr-btn emr-btn--ghost" aria-pressed=${m.highlightedSuggestionIds.includes(suggestion.id)}
        @click=${() => this.send({ type: 'suggestionSelected', suggestionId: suggestion.id })}>${suggestion.fieldLabel}</button>
      ${suggestion.sectionLabel ? html`<small>${suggestion.sectionLabel}</small>` : nothing}
      <span>${valueLabel} · ${suggestion.status}</span>
      ${suggestion.confidence ? html`<emr-badge .badge=${suggestion.confidence}></emr-badge>` : nothing}
      ${suggestion.messages?.map((message) => html`<p role=${message.severity === 'error' ? 'alert' : 'status'}>${message.message}</p>`)}
      ${m.readOnly ? nothing : suggestion.status === 'pending' ? html`<div class="emr-actions">
        ${this.action('Accept', { type: 'suggestionAccepted', suggestionId: suggestion.id }, () => this.isPending(suggestion.id))}
        ${this.action('Reject', { type: 'suggestionRejected', suggestionId: suggestion.id }, () => this.isPending(suggestion.id))}
        ${field ? this.editForm(suggestion, field, m.id) : nothing}
      </div>` : this.action('Reopen', { type: 'suggestionReopened', suggestionId: suggestion.id },
        () => !!this.model && !this.model.readOnly && this.model.suggestions.some((item) => item.id === suggestion.id && item.status !== 'pending'))}
    </li>`;
  }

  private editForm(suggestion: FieldSuggestion, field: ClinicalFieldDefinition, noteId: string) {
    let draft: ClinicalFieldValue = suggestion.value;
    return html`<details>
      <summary>Edit suggested value</summary>
      <form class="emr-stack" @submit=${(event: SubmitEvent) => {
        event.preventDefault();
        if (this.model?.id === noteId && this.isPending(suggestion.id) && !Object.is(draft, suggestion.value)) {
          this.send({ type: 'suggestionEdited', suggestionId: suggestion.id, value: draft });
        }
      }}>
        <emr-typed-field .definition=${field} .model=${{ value: draft }}
          @valueChange=${(event: CustomEvent<ClinicalFieldValue>) => {
            event.stopPropagation();
            if (this.model?.id !== noteId || !this.isPending(suggestion.id)) return;
            draft = event.detail;
            (event.currentTarget as HTMLElement & { model: { value: ClinicalFieldValue } }).model = { value: draft };
          }}></emr-typed-field>
        <button type="submit" class="emr-btn">Apply edited value</button>
      </form>
    </details>`;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel('Evidence suggestions', html`
      ${m.readOnly ? nothing : html`<div class="emr-actions">
        ${this.action('Accept all pending', { type: 'acceptAllPendingRequested' },
          () => !!this.model && !this.model.readOnly && this.model.suggestions.some((suggestion) => suggestion.status === 'pending'))}
        ${this.action('Clear highlight', { type: 'highlightClearRequested' },
          () => !!this.model && !this.model.readOnly && (this.model.highlightedSpanIds.length > 0 || this.model.highlightedSuggestionIds.length > 0))}
      </div>`}
      ${m.suggestions.length ? html`<ul class="emr-stack">${m.suggestions.map((suggestion) => this.suggestion(suggestion, m))}</ul>`
        : html`<p>No evidence suggestions.</p>`}
    `);
  }
}

export class EmrCaptureStatusBarElement extends EmrModelElement<CaptureStatusBarViewModel, CaptureStatusBarIntent> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    const s = m.session;
    const mutable = () => !!this.model && !this.model.readOnly;
    const canSave = () => {
      const current = this.model?.session;
      return mutable() && !!current && !current.saving && !current.conflict && (current.dirty || !!current.error);
    };
    const status = s.saving ? 'Saving…' : s.error ? 'Save failed' : s.conflict ? 'Conflict' : s.dirty ? 'Unsaved changes' : s.savedAt ? 'Saved' : 'No changes';
    return this.panel('Record status', html`
      <div class="emr-actions">
        <span role="status">${status}</span>
        ${m.readOnly ? html`<span>Read only</span>` : nothing}
        ${m.savedAtLabel ? html`<span>${m.savedAtLabel}</span>` : nothing}
        ${m.connection ? html`<emr-badge .badge=${m.connection}></emr-badge>` : nothing}
        ${m.outbox ? html`<emr-badge .badge=${m.outbox}></emr-badge>` : nothing}
        ${m.lastSync ? html`<span>Last sync: ${m.lastSync}</span>` : nothing}
      </div>
      ${m.attributionLabel || m.attribution ? html`<p>${m.attributionLabel ?? m.attribution?.recordedBy}</p>` : nothing}
      ${s.error ? html`<p class="emr-error" role="alert">${s.error}</p>` : nothing}
      ${m.signature ? html`<div class="emr-stack">
        <emr-badge .badge=${m.signature.status}></emr-badge>
        ${m.signature.signatories.map((signatory) => html`<span>${signatory.displayName} · ${signatory.roleLabel} · ${signatory.signedAtLabel}
          <emr-badge .badge=${signatory.status}></emr-badge></span>`)}
        ${m.readOnly ? nothing : html`<div class="emr-actions">
          ${m.signature.canSign ? this.action('Sign', { type: 'signRequested' }, () => mutable() && !!this.model?.signature?.canSign) : nothing}
          ${m.signature.canAmend ? this.action('Amend', { type: 'amendRequested' }, () => mutable() && !!this.model?.signature?.canAmend) : nothing}
        </div>`}
      </div>` : nothing}
      ${s.conflict ? html`<div class="emr-stack" role="alert">
        <p>The record changed from revision ${s.conflict.localRevision} to ${s.conflict.remoteRevision}.</p>
        ${m.conflictLabels?.map((label) => html`<span>${label}</span>`)}
        <div class="emr-actions">
          ${this.action('Show differences', { type: 'conflictDetailRequested' })}
          ${m.readOnly ? nothing : html`
            ${this.action('Keep mine', { type: 'conflictResolutionRequested', resolution: 'keepLocal' }, () => mutable() && !!this.model?.session.conflict)}
            ${this.action('Keep theirs', { type: 'conflictResolutionRequested', resolution: 'keepRemote' }, () => mutable() && !!this.model?.session.conflict)}
            ${this.action('Merge', { type: 'conflictResolutionRequested', resolution: 'merge' }, () => mutable() && !!this.model?.session.conflict)}
          `}
        </div>
      </div>` : m.readOnly ? nothing : html`<div class="emr-actions">
        ${this.action(s.error ? 'Retry save' : 'Save', { type: 'saveRequested' }, canSave)}
        ${this.action('Discard', { type: 'discardRequested' }, canSave)}
      </div>`}
    `);
  }
}

export function registerL4ObservationElements(): void {
  defineEmrElement('emr-observation-flowsheet', EmrObservationFlowsheetElement);
  defineEmrElement('emr-observation-trend', EmrObservationTrendElement);
  defineEmrElement('emr-clinical-transcript', EmrClinicalTranscriptElement);
  defineEmrElement('emr-evidence-suggestion-list', EmrEvidenceSuggestionListElement);
  defineEmrElement('emr-capture-status-bar', EmrCaptureStatusBarElement);
}
