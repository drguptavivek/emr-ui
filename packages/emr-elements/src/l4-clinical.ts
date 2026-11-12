import { html, svg, nothing, css } from 'lit';
import type {
  StagedChecklistViewModel,
  StagedChecklistIntent,
  PacChecklistViewModel,
  PacChecklistIntent,
  FamilyPedigreeViewModel,
  FamilyPedigreeIntent,
  DiagnosticResultSummaryViewModel,
  DiagnosticResultSummaryIntent,
  OcularMotilityChartViewModel,
  OcularMotilityChartIntent,
  GazePosition,
  MeridianCrossViewModel,
  MeridianCrossIntent,
  OctFindingRecordViewModel,
  OctFindingRecordIntent,
  MedicationReconciliationViewModel,
  MedicationReconciliationIntent,
  ReconMedication,
  SpectaclePrescriptionViewModel,
  SpectaclePrescriptionIntent,
  VaChartType,
  EmrClinicalAnnotationCanvasState,
  EmrClinicalAnnotationCanvasIntent,
  AnnotationPoint,
  AnnotationLayerRecord,
  AnnotationTool,
} from '@drguptavivek/emr-controller';
import { defineEmrElement } from './foundations.js';
import { EmrModelElement } from './controlled-rendering.js';

export class EmrStagedChecklistElement extends EmrModelElement<
  StagedChecklistViewModel,
  StagedChecklistIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    const phase = m.schema.phases.find((p) => p.id === m.activePhaseId);
    return this.panel(
      m.schema.label,
      html` <p>${m.schema.description ?? ''}</p>
        <nav aria-label="Checklist phases">
          ${m.schema.phases.map((p) =>
            this.action(`${p.label}${m.phaseStatuses?.[p.id] ? ` — ${m.phaseStatuses[p.id].label}` : ''}`, {
              type: 'phaseSelected',
              phaseId: p.id,
            }),
          )}
        </nav>
        ${phase
          ? html`<h4>${phase.label}</h4>
              <p>${phase.description ?? ''}</p>
              ${m.signoffs?.[phase.id]
                ? html`<p>
                    Signed by ${m.signoffs[phase.id].displayName}, ${m.signoffs[phase.id].roleLabel} ·
                    ${m.signoffs[phase.id].signedAtLabel}
                  </p>`
                : nothing}
              ${phase.items.map((item) => {
                const state = m.items[item.id] ?? { value: null };
                const locked = !!(m.readOnly || state.readOnly || state.disabled);
                const send = (value: string | boolean | null) => {
                  if (!locked) this.send({ type: 'itemResponseRequested', itemId: item.id, value });
                };
                return html`<div>
                  ${item.type === 'checkbox'
                    ? html`<label
                        ><input
                          type="checkbox"
                          .checked=${state.value === true}
                          ?disabled=${locked}
                          @change=${(e: Event) => send((e.target as HTMLInputElement).checked)}
                        />
                        ${item.label}</label
                      >`
                    : item.type === 'yes-no' || item.type === 'yes-no-na'
                      ? html`<fieldset>
                          <legend>${item.label}</legend>
                          ${(item.type === 'yes-no' ? ['yes', 'no'] : ['yes', 'no', 'na']).map(
                            (value) =>
                              html`<label
                                ><input
                                  type="radio"
                                  name=${`${m.instanceId}-${item.id}`}
                                  .checked=${state.value === value}
                                  ?disabled=${locked}
                                  @change=${() => send(value)}
                                />
                                ${value === 'na' ? 'Not applicable' : value === 'yes' ? 'Yes' : 'No'}</label
                              >`,
                          )}
                        </fieldset>`
                      : item.type === 'select'
                        ? html`<label
                            >${item.label}<select
                              .value=${String(state.value ?? '')}
                              ?disabled=${locked}
                              @change=${(e: Event) => send((e.target as HTMLSelectElement).value || null)}
                            >
                              <option value="">Select an option</option>
                              ${item.options?.map(
                                (o) =>
                                  html`<option
                                    value=${o.value}
                                    ?selected=${o.value === state.value}
                                    ?disabled=${!!o.disabled}
                                  >
                                    ${o.label}
                                  </option>`,
                              )}
                            </select></label
                          >`
                        : html`<label
                            >${item.label}<input
                              .value=${String(state.value ?? '')}
                              ?disabled=${locked}
                              @input=${(e: Event) => send((e.target as HTMLInputElement).value)}
                          /></label>`}
                  ${item.description ? html`<p>${item.description}</p>` : nothing}${state.error
                    ? html`<p role="alert">${state.error}</p>`
                    : nothing}
                  ${item.requiresNoteWhen?.includes(String(state.value))
                    ? html`<label
                        >Note<textarea
                          .value=${state.note ?? ''}
                          ?disabled=${locked}
                          @input=${(e: Event) => {
                            if (!locked)
                              this.send({
                                type: 'itemNoteRequested',
                                itemId: item.id,
                                note: (e.target as HTMLTextAreaElement).value,
                              });
                          }}
                        ></textarea>
                      </label>`
                    : nothing}
                </div>`;
              })}
              ${this.action(
                'Mark phase complete',
                { type: 'phaseCompletionRequested', phaseId: phase.id },
                () => !this.model?.readOnly,
              )}
              ${this.action(
                'Sign off phase',
                { type: 'phaseSignoffRequested', phaseId: phase.id },
                () => !this.model?.readOnly,
              )} `
          : nothing}${m.error ? html`<p role="alert">${m.error}</p>` : nothing}`,
    );
  }
}

export class EmrPacChecklistElement extends EmrModelElement<PacChecklistViewModel, PacChecklistIntent> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    const form = {
      ...m.form,
      readOnly: !!m.readOnly || !!m.form.readOnly,
      schema: { ...m.form.schema, id: `emr-pac-${m.instanceId}-${m.form.schema.id}` },
    };
    return this.panel(
      m.title,
      html`<p>${m.description ?? ''}</p>
        ${m.overallStatus ? html`<emr-badge .badge=${m.overallStatus}></emr-badge>` : nothing}
        <dl>
          ${m.context.map(
            (item) =>
              html`<dt>${item.label}</dt>
                <dd>${item.value}</dd>`,
          )}
        </dl>
        ${m.errors?.map((error) => html`<p role="alert">${error.severity ?? 'error'}: ${error.message}</p>`)}
        <emr-clinical-form
          .model=${form}
          @intent=${(e: CustomEvent) => {
            e.stopPropagation();
            if (!this.model?.readOnly) this.send({ type: 'formIntent', intent: e.detail });
          }}
        ></emr-clinical-form>
        <div class="emr-actions">
          ${m.actions.map((a) =>
            this.action(
              a.label,
              { type: 'actionRequested', actionId: a.id },
              () => !this.model?.readOnly && !a.disabled && !a.loading,
            ),
          )}
        </div>`,
    );
  }
}

export class EmrFamilyPedigreeElement extends EmrModelElement<FamilyPedigreeViewModel, FamilyPedigreeIntent> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      m.label,
      html`${!m.readOnly ? this.action('Add person', { type: 'personAddRequested' }) : nothing}
      ${m.people.length
        ? [...m.people]
            .sort((a, b) => a.generation - b.generation || a.order - b.order)
            .map(
              (p) =>
                html`<article>
                  ${this.action(p.displayName, { type: 'personSelected', personId: p.id })}
                  <p>
                    ${p.relationshipLabel} · ${p.age ?? 'Age not recorded'} ·
                    ${p.sexLabel ?? p.sex ?? 'Sex not recorded'} ·
                    ${p.lifeStatusLabel ??
                    p.lifeStatus ??
                    (p.deceased === undefined ? 'Not recorded' : p.deceased ? 'Deceased' : 'Alive')}
                    · ${p.phenotype ?? 'Status unknown'}
                  </p>
                  <p>${p.summary ?? ''}</p>
                  ${p.conditions?.map((b) => html`<emr-badge .badge=${b}></emr-badge>`)}
                  ${!m.readOnly && !p.readOnly
                    ? html`${this.action('Edit person', {
                        type: 'personEditRequested',
                        personId: p.id,
                      })}${this.action('Remove person', {
                        type: 'personRemoveRequested',
                        personId: p.id,
                      })}${this.action('Add relative', {
                        type: 'personAddRequested',
                        relatedPersonId: p.id,
                      })}${this.action('Add relationship', {
                        type: 'relationshipAddRequested',
                        personId: p.id,
                      })}`
                    : nothing}
                </article>`,
            )
        : html`<p>${m.emptyMessage ?? 'No family history recorded.'}</p>`}
      ${m.relationships.map(
        (r) =>
          html`<p>
            ${m.people.find((p) => p.id === r.fromPersonId)?.displayName ?? 'Unknown person'} —
            ${r.relationshipLabel} —
            ${m.people.find((p) => p.id === r.toPersonId)?.displayName ?? 'Unknown person'}
            ${!m.readOnly
              ? this.action('Edit relationship', { type: 'relationshipEditRequested', relationshipId: r.id })
              : nothing}
          </p>`,
      )}`,
    );
  }
}

export class EmrDiagnosticResultSummaryElement extends EmrModelElement<
  DiagnosticResultSummaryViewModel,
  DiagnosticResultSummaryIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      m.title,
      html`<p>${m.subtitle ?? ''}</p>
        ${m.status ? html`<emr-badge .badge=${m.status}></emr-badge>` : nothing}
        ${m.loading
          ? html`<p role="status">Loading result</p>`
          : m.error
            ? html`<p role="alert">${m.error}</p>
                ${this.action('Try again', { type: 'retryRequested', resultId: m.id })}`
            : html` <dl>
                  ${m.metadata.map(
                    (v) =>
                      html`<dt>${v.label}</dt>
                        <dd>${v.value}</dd>`,
                  )}
                </dl>
                ${m.metrics.map(
                  (v) =>
                    html`<p>
                      <strong>${v.label}: ${v.valueLabel}</strong> ${v.referenceLabel ?? ''}
                      ${v.status ? html`<emr-badge .badge=${v.status}></emr-badge>` : nothing}
                      ${v.helpText ?? ''}
                    </p>`,
                )}
                <p>${m.interpretation ?? ''}</p>
                <p>${m.trendSummary ?? ''}</p>
                ${this.action('Select result', { type: 'resultSelected', resultId: m.id })}
                ${m.attachments?.map((a) =>
                  this.action(
                    a.label,
                    { type: 'attachmentRequested', resultId: m.id, attachmentId: a.id },
                    () => !a.disabled,
                  ),
                )}`}`,
    );
  }
}

export class EmrOcularMotilityChartElement extends EmrModelElement<
  OcularMotilityChartViewModel,
  OcularMotilityChartIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    const positions: GazePosition[] = [
      'up-right',
      'up',
      'up-left',
      'right',
      'primary',
      'left',
      'down-right',
      'down',
      'down-left',
    ];
    return this.panel(
      m.title,
      html`<p>${m.summaryText}</p>
        ${(m.layout === 'binocular' ? m.eyes.slice(0, 1) : m.eyes).map(
          (eye) =>
            html`<h4>${eye.label} (${eye.shortLabel})</h4>
              <table class="emr-table">
                <tbody>
                  ${[0, 1, 2].map(
                    (row) =>
                      html`<tr>
                        ${positions.slice(row * 3, row * 3 + 3).map((position) => {
                          const cell = eye.cells[position];
                          return html`<td>
                            <strong>${m.positionLabels[position]}</strong>
                            <p>
                              ${cell
                                ? cell.status === 'recorded'
                                  ? (cell.valueLabel ?? 'Not supplied')
                                  : cell.status
                                : 'Not supplied'}
                            </p>
                            ${cell?.badge ? html`<emr-badge .badge=${cell.badge}></emr-badge>` : nothing}
                            <p>${cell?.note ?? ''}</p>
                            ${!m.readOnly
                              ? html`${this.action('Select', {
                                  type: 'cellSelected',
                                  eyeId: eye.eyeId,
                                  position,
                                })}${this.action('Edit', {
                                  type: 'cellEditRequested',
                                  eyeId: eye.eyeId,
                                  position,
                                })}`
                              : nothing}
                          </td>`;
                        })}
                      </tr>`,
                  )}
                </tbody>
              </table>`,
        )}`,
    );
  }
}

export class EmrMeridianCrossElement extends EmrModelElement<MeridianCrossViewModel, MeridianCrossIntent> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      m.title,
      html`<p>${m.summaryText}</p>
        ${m.eyes.map(
          (eye) =>
            html`<article>
              <h4>${eye.label} (${eye.shortLabel})</h4>
              <p>${eye.status}</p>
              ${eye.flag ? html`<emr-badge .badge=${eye.flag}></emr-badge>` : nothing}
              ${eye.status === 'recorded' && eye.meridians
                ? html`<svg
                      viewBox="0 0 200 200"
                      width="200"
                      height="200"
                      role="img"
                      aria-label=${eye.meridians.map((line) => line.assistiveLabel).join('; ')}
                    >
                      ${eye.meridians.map((line) => {
                        const angle = (line.axisDeg * Math.PI) / 180;
                        const dx = Math.cos(angle) * 70;
                        const dy = -Math.sin(angle) * 70;
                        return svg`<line x1=${100 - dx} y1=${100 - dy} x2=${100 + dx} y2=${100 + dy} stroke="currentColor"></line><text x=${100 + dx} y=${100 + dy} fill="currentColor">${line.powerLabel}</text>`;
                      })}</svg
                    >${eye.meridians.map((line) => html`<p>${line.assistiveLabel}: ${line.powerLabel}</p>`)}`
                : eye.status === 'recorded'
                  ? html`<p>Not supplied</p>`
                  : nothing}${eye.captionLines?.map((line) => html`<p>${line}</p>`)}
              ${!m.readOnly
                ? html`${this.action('Select eye', { type: 'eyeSelected', eyeId: eye.eyeId })}${this.action(
                    'Edit eye',
                    { type: 'editRequested', eyeId: eye.eyeId },
                  )}`
                : nothing}
            </article>`,
        )}`,
    );
  }
}

export class EmrOctFindingRecordElement extends EmrModelElement<
  OctFindingRecordViewModel,
  OctFindingRecordIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      m.title,
      html`${m.loading
        ? html`<p role="status">Loading OCT record</p>`
        : m.error
          ? html`<p role="alert">${m.error}</p>
              ${this.action('Try again', { type: 'retryRequested' })}`
          : html` ${m.messages.map((v) => html`<p>${v.severity}: ${v.message}</p>`)}${m.eyes.map(
              (eye) =>
                html`<article>
                  <h4>${eye.label} (${eye.shortLabel})</h4>
                  <p>${eye.status}</p>
                  ${eye.status === 'recorded'
                    ? html` <dl>
                          ${eye.metadata.map(
                            (v) =>
                              html`<dt>${v.label}</dt>
                                <dd>${v.value}</dd>`,
                          )}
                        </dl>
                        ${eye.frames.map(
                          (f) =>
                            html`<div>
                              ${f.thumbnailUrl &&
                              /^(https?:|blob:|data:image\/(?:png|jpeg|gif|webp);base64,)/i.test(
                                f.thumbnailUrl,
                              )
                                ? html`<img src=${f.thumbnailUrl} alt=${f.altText} />`
                                : nothing}${this.action(f.label, {
                                type: 'frameSelected',
                                eyeId: eye.eyeId,
                                frameId: f.frameId,
                              })}${this.action('Open frame', {
                                type: 'frameOpenRequested',
                                eyeId: eye.eyeId,
                                frameId: f.frameId,
                              })}
                            </div>`,
                        )}
                        ${eye.metrics.map(
                          (v) => html`<p>${v.label}: ${v.valueLabel} ${v.referenceLabel ?? ''}</p>`,
                        )}
                        ${eye.findings.map(
                          (f) =>
                            html`<p>
                              ${this.action(f.label, {
                                type: 'findingSelected',
                                eyeId: eye.eyeId,
                                path: f.path,
                              })}
                              ${f.status} ${f.locationLabel ?? ''} ${f.note ?? ''}
                              ${f.badge ? html`<emr-badge .badge=${f.badge}></emr-badge>` : nothing}
                              ${!m.readOnly && !f.readOnly
                                ? html`${this.action('Edit finding', {
                                    type: 'findingEditRequested',
                                    eyeId: eye.eyeId,
                                    path: f.path,
                                  })}${this.action('Remove finding', {
                                    type: 'findingRemoveRequested',
                                    eyeId: eye.eyeId,
                                    path: f.path,
                                  })}`
                                : nothing}
                            </p>`,
                        )}
                        <p>${eye.interpretation ?? ''}</p>
                        ${!m.readOnly
                          ? this.action('Add finding', { type: 'findingAddRequested', eyeId: eye.eyeId })
                          : nothing}`
                    : nothing}
                </article>`,
            )}`}`,
    );
  }
}

export class EmrMedicationReconciliationElement extends EmrModelElement<
  MedicationReconciliationViewModel,
  MedicationReconciliationIntent
> {
  private medicine(med: ReconMedication | undefined, label: string) {
    if (!med) return html`<span>Not on ${label}</span>`;
    return html`${this.action(med.nameLabel, { type: 'medicationDetailRequested', medicationId: med.id })}
      <p>${med.doseSummary || 'Not supplied'}</p>
      <p>${med.lastTakenLabel ? `Last taken: ${med.lastTakenLabel}` : ''}</p>
      ${med.badges?.map((b) => html`<emr-badge .badge=${b}></emr-badge>`)}`;
  }
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      m.title,
      html`${m.summary?.map((b) => html`<emr-badge .badge=${b}></emr-badge>`)}
      ${m.loading
        ? html`<p role="status">Loading medicines</p>`
        : m.error
          ? html`<p role="alert">${m.error}</p>
              ${this.action('Try again', { type: 'retryRequested' })}`
          : html` ${!m.readOnly
              ? html`${this.action(`Add medicine to ${m.leftLabel}`, {
                  type: 'addMedicationRequested',
                  side: 'left',
                })}${this.action(`Add medicine to ${m.rightLabel}`, {
                  type: 'addMedicationRequested',
                  side: 'right',
                })}`
              : nothing}
            ${m.rows.length
              ? html`<div class="emr-scroll">
                  <table class="emr-table">
                    <thead>
                      <tr>
                        <th>${m.leftLabel}</th>
                        <th>${m.rightLabel}</th>
                        <th>Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${m.rows.map(
                        (row) =>
                          html`<tr>
                            <td>${this.medicine(row.left, m.leftLabel)}</td>
                            <td>${this.medicine(row.right, m.rightLabel)}</td>
                            <td>
                              ${this.action('Select row', { type: 'rowSelected', rowId: row.id })}<label
                                >Decision for
                                ${row.left?.nameLabel ?? row.right?.nameLabel ?? 'medicine'}<select
                                  ?disabled=${!!m.readOnly || !!row.readOnly}
                                  @change=${(e: Event) => {
                                    const value = (e.target as HTMLSelectElement).value;
                                    if (!this.model?.readOnly && !row.readOnly && value)
                                      this.send({
                                        type: 'decisionChangeRequested',
                                        path: row.path,
                                        decision: value,
                                      });
                                  }}
                                >
                                  <option value="">Not decided</option>
                                  ${row.decisionOptions.map(
                                    (o) =>
                                      html`<option
                                        value=${o.value}
                                        ?selected=${o.value === row.decision}
                                        ?disabled=${!!o.disabled}
                                      >
                                        ${o.label}
                                      </option>`,
                                  )}
                                </select></label
                              >
                              ${row.reasonRequired
                                ? html`<label
                                    >Reason<textarea
                                      .value=${row.reason ?? ''}
                                      ?readonly=${!!m.readOnly || !!row.readOnly}
                                      @input=${(e: Event) => {
                                        if (!this.model?.readOnly && !row.readOnly)
                                          this.send({
                                            type: 'reasonChangeRequested',
                                            path: row.path,
                                            reason: (e.target as HTMLTextAreaElement).value,
                                          });
                                      }}
                                    ></textarea>
                                  </label>`
                                : nothing}${row.messages?.map(
                                (v) => html`<p>${v.severity}: ${v.message}</p>`,
                              )}
                            </td>
                          </tr>`,
                      )}
                    </tbody>
                  </table>
                </div>`
              : html`<p>${m.emptyMessage}</p>`}
            ${!m.readOnly
              ? this.action(
                  'Complete reconciliation',
                  { type: 'completeRequested' },
                  () => !!this.model?.canComplete && !this.model?.readOnly,
                )
              : nothing}`}`,
    );
  }
}

export function registerL4ClinicalElements(): void {
  defineEmrElement('emr-staged-checklist', EmrStagedChecklistElement);
  defineEmrElement('emr-pac-checklist', EmrPacChecklistElement);
  defineEmrElement('emr-family-pedigree', EmrFamilyPedigreeElement);
  defineEmrElement('emr-diagnostic-result-summary', EmrDiagnosticResultSummaryElement);
  defineEmrElement('emr-ocular-motility-chart', EmrOcularMotilityChartElement);
  defineEmrElement('emr-meridian-cross', EmrMeridianCrossElement);
  defineEmrElement('emr-oct-finding-record', EmrOctFindingRecordElement);
  defineEmrElement('emr-medication-reconciliation', EmrMedicationReconciliationElement);
  defineEmrElement('emr-spectacle-prescription', EmrSpectaclePrescriptionElement);
  defineEmrElement('emr-clinical-annotation-canvas', EmrClinicalAnnotationCanvasElement);
}

export class EmrSpectaclePrescriptionElement extends EmrModelElement<
  SpectaclePrescriptionViewModel,
  SpectaclePrescriptionIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    const charts: VaChartType[] = ['snellen-6m', 'snellen-20ft', 'logmar', 'etdrs', 'decimal'];
    return this.panel(
      m.label,
      html`<p>${m.description ?? ''}</p>
        ${Object.values(m.errors ?? {})
          .filter(Boolean)
          .map((error) => html`<p role="alert">${error}</p>`)}
        <label
          >Visual acuity chart
          <select
            ?disabled=${!!m.readOnly}
            @change=${(e: Event) => {
              const value = (e.target as HTMLSelectElement).value as VaChartType;
              if (!this.model?.readOnly && charts.includes(value))
                this.send({ type: 'vaChartTypeChanged', chartType: value });
            }}
          >
            ${charts.map(
              (chart) => html`<option value=${chart} ?selected=${m.vaChartType === chart}>${chart}</option>`,
            )}
          </select></label
        >
        <div class="emr-scroll">
          <table class="emr-table">
            <thead>
              <tr>
                <th>Eye</th>
                ${m.fields.map((f) => html`<th>${f.label}${f.unit ? ` (${f.unit})` : ''}</th>`)}
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${m.eyes.map(
                (eye) =>
                  html`<tr>
                    <th>
                      ${eye.label}
                      ${eye.shortLabel ?? ''}${m.logMarEquivalents?.[eye.id] !== undefined
                        ? html`<p>LogMAR: ${m.logMarEquivalents[eye.id]}</p>`
                        : nothing}
                    </th>
                    ${m.fields.map((field) => {
                      const locked = !!(m.readOnly || field.readOnly || field.disabled);
                      const value = m.values[eye.id]?.[field.id] ?? '';
                      const edit = (e: Event) => {
                        if (!this.model?.readOnly && !field.readOnly && !field.disabled)
                          this.send({
                            type: 'cellEditRequested',
                            eyeId: eye.id,
                            fieldId: field.id,
                            value: (e.target as HTMLInputElement).value,
                          });
                      };
                      const focus = () =>
                        this.send({ type: 'cellFocused', eyeId: eye.id, fieldId: field.id });
                      return html`<td>
                        <label
                          ><span>${field.label} — ${eye.label}</span>${field.type === 'select'
                            ? html`<select ?disabled=${locked} @focus=${focus} @change=${edit}>
                                <option value="">Select</option>
                                ${field.options?.map(
                                  (o) =>
                                    html`<option
                                      value=${o.value}
                                      ?selected=${o.value === value}
                                      ?disabled=${!!o.disabled}
                                    >
                                      ${o.label}
                                    </option>`,
                                )}
                              </select>`
                            : html`<input
                                .value=${value}
                                placeholder=${field.placeholder ?? ''}
                                inputmode=${field.type === 'integer'
                                  ? 'numeric'
                                  : field.type === 'decimal'
                                    ? 'decimal'
                                    : 'text'}
                                ?readonly=${locked}
                                @focus=${focus}
                                @input=${edit}
                              />`}</label
                        >${m.errors?.[`${eye.id}.${field.id}`]
                          ? html`<p role="alert">${m.errors[`${eye.id}.${field.id}`]}</p>`
                          : nothing}${m.warnings?.[`${eye.id}.${field.id}`]
                          ? html`<p>${m.warnings[`${eye.id}.${field.id}`]}</p>`
                          : nothing}${!locked && (field.type === 'decimal' || field.id === 'axis')
                          ? html`${this.action('Decrease', {
                              type: 'cellStepped',
                              eyeId: eye.id,
                              fieldId: field.id,
                              delta: field.id === 'axis' ? -5 : -0.25,
                            })}${this.action('Increase', {
                              type: 'cellStepped',
                              eyeId: eye.id,
                              fieldId: field.id,
                              delta: field.id === 'axis' ? 5 : 0.25,
                            })}`
                          : nothing}
                      </td>`;
                    })}
                    <td>
                      <label
                        >Notes for ${eye.label}<textarea
                          .value=${m.notes?.[eye.id] ?? ''}
                          ?readonly=${!!m.readOnly}
                          @input=${(e: Event) => {
                            if (!this.model?.readOnly)
                              this.send({
                                type: 'notesEditRequested',
                                eyeId: eye.id,
                                value: (e.target as HTMLTextAreaElement).value,
                              });
                          }}
                        ></textarea>
                      </label>
                    </td>
                  </tr>`,
              )}
            </tbody>
          </table>
        </div>
        ${!m.readOnly
          ? m.eyes.flatMap((from) =>
              m.eyes
                .filter((to) => to.id !== from.id)
                .map((to) =>
                  this.action(`Copy ${from.label} to ${to.label}`, {
                    type: 'copyEyeRequested',
                    fromEyeId: from.id,
                    toEyeId: to.id,
                  }),
                ),
            )
          : nothing}
        ${m.iopReadings
          ? Object.entries(m.iopReadings).map(
              ([eye, reading]) =>
                html`<p>
                  ${eye}: ${reading.valueLabel} · ${reading.methodLabel} ${reading.timeLabel ?? ''}
                  ${reading.deltaLabel ?? ''} ${reading.pachymetryLabel ?? ''}
                  ${reading.flag ? html`<emr-badge .badge=${reading.flag}></emr-badge>` : nothing}
                </p>`,
            )
          : nothing}
        ${m.slitLampRows?.length
          ? html`<h4>Slit lamp and fundus examination</h4>
              ${!m.readOnly
                ? html`${this.action('Normal both eyes', {
                    type: 'slitLampMacroNormalRequested',
                    scope: 'ou',
                  })}${this.action('Normal right eye', {
                    type: 'slitLampMacroNormalRequested',
                    scope: 'od',
                  })}${this.action('Normal left eye', { type: 'slitLampMacroNormalRequested', scope: 'os' })}`
                : nothing}
              <table class="emr-table">
                <thead>
                  <tr>
                    <th>Finding</th>
                    <th>Right eye</th>
                    <th>Left eye</th>
                  </tr>
                </thead>
                <tbody>
                  ${m.slitLampRows.map(
                    (row) =>
                      html`<tr>
                        <th>${row.label}</th>
                        ${(['od', 'os'] as const).map(
                          (eye) =>
                            html`<td>
                              <label
                                >${row.label} ${eye}<input
                                  .value=${eye === 'od' ? row.odValue : row.osValue}
                                  ?readonly=${!!m.readOnly}
                                  @input=${(e: Event) => {
                                    if (!this.model?.readOnly)
                                      this.send({
                                        type: 'slitLampChanged',
                                        rowId: row.id,
                                        eyeId: eye,
                                        value: (e.target as HTMLInputElement).value,
                                      });
                                  }} /></label
                              >${!m.readOnly
                                ? html`${this.action('Normal', {
                                    type: 'slitLampMacroNormalRequested',
                                    scope: eye,
                                    rowId: row.id,
                                  })}${this.action('Copy to other eye', {
                                    type: 'slitLampCopyEyeRequested',
                                    fromEyeId: eye,
                                    toEyeId: eye === 'od' ? 'os' : 'od',
                                    rowId: row.id,
                                  })}${row.quickFindings.map(
                                    (value) =>
                                      html`<button
                                        type="button"
                                        @click=${() => {
                                          if (!this.model?.readOnly)
                                            this.send({
                                              type: 'slitLampChanged',
                                              rowId: row.id,
                                              eyeId: eye,
                                              value,
                                            });
                                        }}
                                      >
                                        ${value}
                                      </button>`,
                                  )}`
                                : nothing}
                            </td>`,
                        )}
                      </tr>`,
                  )}
                </tbody>
              </table>`
          : nothing}`,
    );
  }
}

/** Draws a supplied annotation snapshot and proposes changes without changing the host model. */
export class EmrClinicalAnnotationCanvasElement extends EmrModelElement<
  EmrClinicalAnnotationCanvasState,
  EmrClinicalAnnotationCanvasIntent
> {
  static override styles = [
    ...EmrModelElement.styles,
    css`
      svg {
        display: block;
        width: 100%;
        max-height: 70vh;
        touch-action: none;
      }
    `,
  ];
  private draft:
    | {
        tool: AnnotationTool;
        points: AnnotationPoint[];
        instanceId: string;
        imageId: string;
        imageUrl: string;
        width: number;
        height: number;
        pointerId: number | null;
      }
    | undefined;
  private nextId = 0;
  private cursor: AnnotationPoint = { x: 0.5, y: 0.5 };
  override requestUpdate(
    ...args: Parameters<
      EmrModelElement<EmrClinicalAnnotationCanvasState, EmrClinicalAnnotationCanvasIntent>['requestUpdate']
    >
  ) {
    if (this.draft && !this.validDraft()) this.draft = undefined;
    super.requestUpdate(...args);
  }
  private validDraft(pointerId?: number | null): boolean {
    const m = this.model;
    const draft = this.draft;
    const image = m?.imageTemplates.find((template) => template.id === m.selectedImageId);
    return !!(
      m &&
      draft &&
      !m.readOnly &&
      m.instanceId === draft.instanceId &&
      image &&
      image.id === draft.imageId &&
      image.imageUrl === draft.imageUrl &&
      image.width === draft.width &&
      image.height === draft.height &&
      (m.selectedTool ?? 'line') === draft.tool &&
      (pointerId === undefined || pointerId === draft.pointerId)
    );
  }
  private startDraft(tool: AnnotationTool, point: AnnotationPoint, pointerId: number | null) {
    const m = this.model;
    const image = m?.imageTemplates.find((template) => template.id === m.selectedImageId);
    if (!m || m.readOnly || !image) return;
    this.draft = {
      tool,
      points: [point],
      instanceId: m.instanceId,
      imageId: image.id,
      imageUrl: image.imageUrl,
      width: image.width,
      height: image.height,
      pointerId,
    };
    this.requestUpdate();
  }
  private change(patch: Partial<EmrClinicalAnnotationCanvasState>, reason: string) {
    if (this.model && !this.model.readOnly)
      this.send({ type: 'stateChanged', state: { ...this.model, ...patch }, reason });
  }
  private point(event: PointerEvent): AnnotationPoint | undefined {
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    if (!rect.width || !rect.height) return undefined;
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  }
  private add(tool: AnnotationTool, points: AnnotationPoint[]) {
    const m = this.model;
    if (!m || m.readOnly || !points.length) return;
    let id: string;
    do {
      id = `annot-${++this.nextId}`;
    } while (m.layers.some((layer) => layer.id === id));
    const common = {
      id,
      label: m.availableLabels.find((l) => l.id === m.selectedLabelId)?.label ?? 'Annotation',
      color: m.brushColor,
      strokeWidth: m.brushWidth ?? 2,
      visible: true,
      classIds: m.selectedLabelId ? [m.selectedLabelId] : [],
      strokeStyle: m.brushStrokeStyle,
      fillPattern: m.brushFillPattern,
    };
    let layer: AnnotationLayerRecord;
    if (tool === 'text') {
      const text = m.textContent?.trim() || 'Text';
      layer = { ...common, tool, text, label: text, point: points[0], fontSize: 24 };
    } else if (tool === 'circle') {
      if (points.length < 2) return;
      layer = {
        ...common,
        tool,
        center: points[0],
        radiusX: Math.abs(points[1].x - points[0].x),
        radiusY: Math.abs(points[1].y - points[0].y),
      };
    } else if (tool === 'line' || tool === 'arrow' || tool === 'callout') {
      if (points.length < 2) return;
      const pair: [AnnotationPoint, AnnotationPoint] = [points[0], points[1]];
      layer =
        tool === 'callout'
          ? { ...common, tool, points: pair, text: m.textContent?.trim() || 'Text', fontSize: 24 }
          : { ...common, tool, points: pair };
    } else {
      if (points.length < (tool === 'polygon' ? 3 : 2)) return;
      layer = { ...common, tool, points };
    }
    this.change({ layers: [...m.layers, layer], selectedLayerId: id }, `${tool}-added`);
  }
  private down(
    event: PointerEvent,
    rendered: { instanceId: string; imageId: string; imageUrl: string; width: number; height: number },
  ) {
    const m = this.model;
    const current = m?.imageTemplates.find((template) => template.id === m.selectedImageId);
    if (
      !m ||
      m.readOnly ||
      event.button !== 0 ||
      m.selectedTool === 'pan' ||
      m.instanceId !== rendered.instanceId ||
      !current ||
      current.id !== rendered.imageId ||
      current.imageUrl !== rendered.imageUrl ||
      current.width !== rendered.width ||
      current.height !== rendered.height
    )
      return;
    const point = this.point(event);
    if (!point) return;
    const tool = m.selectedTool ?? 'line';
    if (this.validDraft() && this.draft?.pointerId !== event.pointerId) return;
    if (tool === 'text') {
      this.add(tool, [point]);
      return;
    }
    if (tool === 'polygon' && this.validDraft(event.pointerId) && this.draft) {
      this.draft.points.push(point);
      this.requestUpdate();
      return;
    }
    this.startDraft(tool, point, event.pointerId);
    (event.currentTarget as SVGElement).setPointerCapture?.(event.pointerId);
  }
  private move(event: PointerEvent) {
    if (!this.validDraft(event.pointerId) || !this.draft || this.draft.tool === 'polygon') return;
    const point = this.point(event);
    if (!point) return;
    if (this.draft.tool === 'freeform' || this.draft.tool === 'curve') this.draft.points.push(point);
    else this.draft.points = [this.draft.points[0], point];
    this.requestUpdate();
  }
  private up(event: PointerEvent) {
    if (!this.validDraft(event.pointerId) || !this.draft || this.draft.tool === 'polygon') return;
    const point = this.point(event);
    if (point) this.move(event);
    const draft = this.draft;
    this.draft = undefined;
    this.add(draft.tool, draft.points);
  }
  private key(
    event: KeyboardEvent,
    rendered: { instanceId: string; imageId: string; imageUrl: string; width: number; height: number },
  ) {
    const m = this.model;
    const current = m?.imageTemplates.find((template) => template.id === m.selectedImageId);
    if (
      !m ||
      m.readOnly ||
      m.instanceId !== rendered.instanceId ||
      !current ||
      current.id !== rendered.imageId ||
      current.imageUrl !== rendered.imageUrl ||
      current.width !== rendered.width ||
      current.height !== rendered.height
    )
      return;
    const step = event.shiftKey ? 0.1 : 0.01;
    const offset: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (offset[event.key]) {
      event.preventDefault();
      const [dx, dy] = offset[event.key];
      this.cursor = {
        x: Math.max(0, Math.min(1, this.cursor.x + dx)),
        y: Math.max(0, Math.min(1, this.cursor.y + dy)),
      };
      if (
        this.validDraft(null) &&
        this.draft &&
        (this.draft.tool === 'curve' || this.draft.tool === 'freeform')
      )
        this.draft.points.push(this.cursor);
      this.requestUpdate();
      return;
    }
    if (event.key === 'Escape') {
      this.draft = undefined;
      this.requestUpdate();
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    const tool = m.selectedTool ?? 'line';
    if (tool === 'pan') return;
    if (tool === 'text') {
      this.add(tool, [this.cursor]);
      return;
    }
    if (!this.validDraft(null) || !this.draft) {
      this.startDraft(tool, this.cursor, null);
      return;
    }
    if (tool === 'polygon') {
      this.draft.points.push(this.cursor);
      this.requestUpdate();
      return;
    }
    const points =
      tool === 'curve' || tool === 'freeform'
        ? [...this.draft.points, this.cursor]
        : [this.draft.points[0], this.cursor];
    this.draft = undefined;
    this.requestUpdate();
    this.add(tool, points);
  }
  override render() {
    const m = this.model;
    if (!m) return nothing;
    const image = m.imageTemplates.find((i) => i.id === m.selectedImageId);
    const safeUrl =
      image && /^(https?:|blob:|data:image\/(?:png|jpeg|gif|webp);base64,)/i.test(image.imageUrl)
        ? image.imageUrl
        : '';
    const tools: (AnnotationTool | 'pan')[] = [
      'pan',
      'text',
      'line',
      'arrow',
      'callout',
      'curve',
      'circle',
      'polygon',
      'freeform',
    ];
    return this.panel(
      m.title,
      html`<p>${m.description ?? ''}</p>
        <label
          >Background<select
            ?disabled=${!!m.readOnly}
            @change=${(e: Event) => {
              const value = (e.target as HTMLSelectElement).value;
              this.change({ selectedImageId: value }, `background-changed:${value}`);
            }}
          >
            <option value="">Select background</option>
            ${m.imageTemplates.map(
              (i) => html`<option value=${i.id} ?selected=${i.id === m.selectedImageId}>${i.label}</option>`,
            )}
          </select></label
        >
        ${!m.readOnly
          ? html`<label
                >${m.photoUploadHint || 'Add photo'}<input
                  type="file"
                  aria-label="Add photo"
                  accept=${m.photoAccept || 'image/*'}
                  @change=${(event: Event) => {
                    const input = event.target as HTMLInputElement;
                    const files = Array.from(input.files ?? []);
                    input.value = '';
                    if (this.model && !this.model.readOnly)
                      this.dispatchEvent(
                        new CustomEvent('nativeFilesSelected', {
                          detail: files,
                          bubbles: true,
                          composed: true,
                        }),
                      );
                  }} /></label
              ><label
                >Tool<select
                  @change=${(e: Event) => {
                    const tool = (e.target as HTMLSelectElement).value as AnnotationTool | 'pan';
                    if (tools.includes(tool)) {
                      this.draft = undefined;
                      this.change(
                        {
                          selectedTool: tool,
                          selectedSymbolId: undefined,
                          brushStrokeStyle: undefined,
                          brushFillPattern: undefined,
                        },
                        `tool-changed:${tool}`,
                      );
                    }
                  }}
                >
                  ${tools.map(
                    (tool) =>
                      html`<option value=${tool} ?selected=${tool === (m.selectedTool ?? 'line')}>
                        ${tool}
                      </option>`,
                  )}
                </select></label
              >
              <label
                >Class<select
                  @change=${(e: Event) => {
                    const value = (e.target as HTMLSelectElement).value;
                    this.change({ selectedLabelId: value || undefined }, `selected-label:${value}`);
                  }}
                >
                  <option value="">None</option>
                  ${m.availableLabels.map(
                    (l) =>
                      html`<option value=${l.id} ?selected=${l.id === m.selectedLabelId}>${l.label}</option>`,
                  )}
                </select></label
              >
              ${m.symbolPresets?.length
                ? html`<label
                    >Symbol<select
                      @change=${(e: Event) => {
                        const preset = m.symbolPresets?.find(
                          (p) => p.id === (e.target as HTMLSelectElement).value,
                        );
                        this.change(
                          {
                            selectedSymbolId: preset?.id,
                            brushStrokeStyle: preset?.strokeStyle,
                            brushFillPattern: preset?.fillPattern,
                            ...(preset
                              ? {
                                  selectedTool: preset.tool,
                                  brushColor: preset.colour ?? m.brushColor,
                                  brushWidth: preset.width ?? m.brushWidth,
                                  selectedLabelId:
                                    preset.classId && m.availableLabels.some((l) => l.id === preset.classId)
                                      ? preset.classId
                                      : m.selectedLabelId,
                                }
                              : {}),
                          },
                          'symbol-selected',
                        );
                      }}
                    >
                      <option value="">None</option>
                      ${m.symbolPresets.map(
                        (p) =>
                          html`<option value=${p.id} ?selected=${p.id === m.selectedSymbolId}>
                            ${p.label}
                          </option>`,
                      )}
                    </select></label
                  >`
                : nothing}
              <label
                >Text<input
                  .value=${m.textContent ?? ''}
                  @input=${(e: Event) =>
                    this.change(
                      { textContent: (e.target as HTMLInputElement).value },
                      'text-content-changed',
                    )}
              /></label>
              ${m.colourOptions?.length
                ? html`<label
                    >Colour<select
                      @change=${(e: Event) => {
                        const value = (e.target as HTMLSelectElement).value;
                        if (m.colourOptions?.some((c) => c.hex === value))
                          this.change({ brushColor: value }, `brush-color:${value}`);
                      }}
                    >
                      ${m.colourOptions.map(
                        (c) =>
                          html`<option value=${c.hex} ?selected=${c.hex === m.brushColor}>
                            ${c.label}
                          </option>`,
                      )}
                    </select></label
                  >`
                : nothing}
              ${m.widthOptions?.length
                ? html`<label
                    >Width<select
                      @change=${(e: Event) => {
                        const value = Number((e.target as HTMLSelectElement).value);
                        if (m.widthOptions?.some((w) => w.px === value))
                          this.change({ brushWidth: value }, `brush-width:${value}`);
                      }}
                    >
                      ${m.widthOptions.map(
                        (w) =>
                          html`<option value=${w.px} ?selected=${w.px === m.brushWidth}>${w.label}</option>`,
                      )}
                    </select></label
                  >`
                : nothing}
              <button
                type="button"
                ?disabled=${this.draft?.tool !== 'polygon' || this.draft.points.length < 3}
                @click=${() => {
                  if (this.validDraft() && this.draft?.tool === 'polygon') {
                    const points = this.draft.points;
                    this.draft = undefined;
                    this.requestUpdate();
                    this.add('polygon', points);
                  }
                }}
              >
                Finish polygon
              </button>
              ${(['undoRequested', 'redoRequested', 'saveRequested'] as const).map((type) =>
                this.action(
                  type === 'undoRequested' ? 'Undo' : type === 'redoRequested' ? 'Redo' : 'Save',
                  {
                    type,
                    state: m,
                    reason: type === 'undoRequested' ? 'undo' : type === 'redoRequested' ? 'redo' : 'save',
                  },
                  () => !this.model?.readOnly,
                ),
              )}`
          : nothing}
        ${image && safeUrl
          ? html`<svg
              viewBox=${`0 0 ${image.width} ${image.height}`}
              role="img"
              tabindex=${m.readOnly ? -1 : 0}
              aria-label=${`${image.altText ?? image.label}. Use arrow keys to move, Enter to place points, Escape to cancel.`}
              @keydown=${(event: KeyboardEvent) =>
                this.key(event, {
                  instanceId: m.instanceId,
                  imageId: image.id,
                  imageUrl: image.imageUrl,
                  width: image.width,
                  height: image.height,
                })}
              @pointerdown=${(event: PointerEvent) =>
                this.down(event, {
                  instanceId: m.instanceId,
                  imageId: image.id,
                  imageUrl: image.imageUrl,
                  width: image.width,
                  height: image.height,
                })}
              @pointermove=${this.move}
              @pointerup=${this.up}
              @pointercancel=${(event: PointerEvent) => {
                if (this.validDraft(event.pointerId)) {
                  this.draft = undefined;
                  this.requestUpdate();
                }
              }}
            >
              <image href=${safeUrl} width=${image.width} height=${image.height}></image>
              <defs>
                ${m.layers.map(
                  (layer, index) =>
                    svg`<pattern id=${`mark-pattern-${index}`} patternUnits="userSpaceOnUse" width="8" height="8"><path d=${layer.fillPattern === 'lattice' ? 'M0 0H8 M0 0V8' : layer.fillPattern === 'crosshatch' ? 'M0 8L8 0 M0 0L8 8' : 'M0 8L8 0'} stroke=${/^#[\da-f]{3,8}$/i.test(layer.color) ? layer.color : 'currentColor'} fill="none"></path></pattern>`,
                )}
              </defs>
              ${m.layers
                .filter((l) => l.visible)
                .map((layer) => {
                  const color = /^#[\da-f]{3,8}$/i.test(layer.color) ? layer.color : 'currentColor';
                  const fill =
                    layer.fillPattern && layer.fillPattern !== 'none'
                      ? `url(#mark-pattern-${m.layers.indexOf(layer)})`
                      : 'none';
                  const x = (p: AnnotationPoint) => p.x * image.width;
                  const y = (p: AnnotationPoint) => p.y * image.height;
                  if (layer.tool === 'text')
                    return svg`<text x=${x(layer.point)} y=${y(layer.point)} fill=${color} font-size=${layer.fontSize}>${layer.text}</text>`;
                  if (layer.tool === 'circle')
                    return svg`<ellipse cx=${x(layer.center)} cy=${y(layer.center)} rx=${layer.radiusX * image.width} ry=${layer.radiusY * image.height} fill=${fill} stroke=${color} stroke-width=${layer.strokeWidth}></ellipse>`;
                  const points = layer.points.map((p) => `${x(p)},${y(p)}`).join(' ');
                  const decoration =
                    layer.strokeStyle === 'sutured' || layer.strokeStyle === 'stapled'
                      ? layer.points
                          .slice(1)
                          .flatMap((end, index) => {
                            const start = layer.points[index];
                            const dx = x(end) - x(start),
                              dy = y(end) - y(start),
                              distance = Math.hypot(dx, dy);
                            if (!distance) return [];
                            const count = Math.min(100, Math.floor(distance / 18));
                            return Array.from({ length: count }, (_, n) => {
                              const fraction = (n + 1) / (count + 1);
                              const cx = x(start) + dx * fraction,
                                cy = y(start) + dy * fraction;
                              const nx = (-dy / distance) * 4,
                                ny = (dx / distance) * 4;
                              return layer.strokeStyle === 'sutured'
                                ? `M${cx - nx} ${cy - ny}L${cx + nx} ${cy + ny}`
                                : `M${cx - nx - (dx / distance) * 3} ${cy - ny - (dy / distance) * 3}L${cx - nx} ${cy - ny}L${cx + nx} ${cy + ny}L${cx + nx - (dx / distance) * 3} ${cy + ny - (dy / distance) * 3}`;
                            });
                          })
                          .join(' ')
                      : '';
                  const arrow =
                    layer.tool === 'arrow' || layer.tool === 'callout'
                      ? (() => {
                          const a = layer.points[0],
                            b = layer.points[1];
                          const angle = Math.atan2(y(b) - y(a), x(b) - x(a));
                          const length = Math.max(8, layer.strokeWidth * 4);
                          return `${x(b)},${y(b)} ${x(b) - length * Math.cos(angle - 0.45)},${y(b) - length * Math.sin(angle - 0.45)} ${x(b) - length * Math.cos(angle + 0.45)},${y(b) - length * Math.sin(angle + 0.45)}`;
                        })()
                      : '';
                  return svg`<polyline points=${layer.tool === 'polygon' && layer.points.length ? `${points} ${x(layer.points[0])},${y(layer.points[0])}` : points} fill=${layer.tool === 'polygon' || layer.tool === 'freeform' ? fill : 'none'} stroke=${color} stroke-width=${layer.strokeWidth} stroke-dasharray=${layer.strokeStyle === 'dashed' ? '10 7' : 'none'}></polyline>${decoration ? svg`<path d=${decoration} fill="none" stroke=${color} stroke-width=${layer.strokeWidth}></path>` : nothing}${arrow ? svg`<polygon points=${arrow} fill=${color}></polygon>` : nothing}${layer.tool === 'callout' ? svg`<text x=${x(layer.points[0])} y=${y(layer.points[0])} fill=${color} font-size=${layer.fontSize}>${layer.text}</text>` : nothing}`;
                })}${!m.readOnly
                ? svg`<circle cx=${this.cursor.x * image.width} cy=${this.cursor.y * image.height} r="3" fill="none" stroke="currentColor"></circle>`
                : nothing}${this.draft?.points.length
                ? svg`<polyline points=${this.draft.points.map((p) => `${p.x * image.width},${p.y * image.height}`).join(' ')} fill="none" stroke="currentColor" stroke-width="2"></polyline>`
                : nothing}
            </svg>`
          : html`<p>${image ? 'Image unavailable' : 'Select an image'}</p>`}
        <h4>Marks</h4>
        ${m.layers.map(
          (layer) =>
            html`<p>
              ${layer.label} (${layer.tool}) ${layer.visible ? 'Visible' : 'Hidden'}
              ${!m.readOnly
                ? html`<button
                      type="button"
                      @click=${() => this.change({ selectedLayerId: layer.id }, `layer-selected:${layer.id}`)}
                    >
                      Select</button
                    ><button
                      type="button"
                      @click=${() =>
                        this.change(
                          {
                            layers: m.layers.map((l) =>
                              l.id === layer.id ? { ...l, visible: !l.visible } : l,
                            ),
                          },
                          `layer-visibility:${layer.id}:${!layer.visible}`,
                        )}
                    >
                      Toggle visibility</button
                    >${[-1, 1].map(
                      (direction) =>
                        html`<button
                          type="button"
                          ?disabled=${m.layers.indexOf(layer) + direction < 0 ||
                          m.layers.indexOf(layer) + direction >= m.layers.length}
                          @click=${() => {
                            const index = m.layers.findIndex((l) => l.id === layer.id);
                            const target = index + direction;
                            if (index < 0 || target < 0 || target >= m.layers.length) return;
                            const layers = [...m.layers];
                            [layers[index], layers[target]] = [layers[target], layers[index]];
                            this.change({ layers }, `layer-reordered:${layer.id}`);
                          }}
                        >
                          ${direction < 0 ? 'Move up' : 'Move down'}
                        </button>`,
                    )}<button
                      type="button"
                      @click=${() =>
                        this.change(
                          {
                            layers: m.layers.filter((l) => l.id !== layer.id),
                            selectedLayerId: m.selectedLayerId === layer.id ? undefined : m.selectedLayerId,
                          },
                          `layer-removed:${layer.id}`,
                        )}
                    >
                      Remove
                    </button>`
                : nothing}
            </p>`,
        )}`,
    );
  }
}
