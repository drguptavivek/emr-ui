import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import type {
  DoseScheduleIntent,
  DoseScheduleViewModel,
  EncounterSummaryPrintIntent,
  EncounterSummaryPrintViewModel,
  InpatientMarIntent,
  InpatientMarViewModel,
  PacsViewerIntent,
  PacsViewerViewModel,
  PatientBannerIntent,
  PatientBannerViewModel,
  PrescribingFormularyItem,
  PrescribingRow,
  PrescribingTableIntent,
  PrescribingTableViewModel,
  ScoreResultCardIntent,
  ScoreResultCardViewModel,
  SpecialtyExamMatrixIntent,
  SpecialtyExamMatrixViewModel,
} from '@drguptavivek/emr-controller';
import { EmrLitElement, defineEmrElement, emrShadowStyles } from './foundations.js';
import { renderEmrSvgIcon } from './icons.js';
import { EmrClinicalListElement, registerL3Elements } from './l3-structures.js';

import { registerL4ClinicalElements } from './l4-clinical.js';
import { registerL4OperationsElements } from './l4-operations.js';
import { registerL4PrivacyIdentityElements } from './l4-privacy-identity.js';
import { registerL4MobileChartsElements } from './l4-mobile-charts.js';
import { registerL4ClinicalNoteElements } from './l4-clinical-note.js';
import { registerL4ObservationElements } from './l4-observations.js';

export * from './l4-clinical.js';
export * from './l4-operations.js';
export * from './l4-privacy-identity.js';
export * from './l4-mobile-charts.js';
export * from './l4-observations.js';
export * from './l4-clinical-note.js';

const l4Styles = css`
  .rx-grid {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
  }
  .rx-grid th {
    padding: 8px 10px;
    text-align: left;
    font-size: var(--emr-text-xs, 0.75rem);
    color: var(--emr-text-muted, #5c6c78);
    background: var(--emr-surface-raised, #eff3f5);
    border-bottom: 1px solid var(--emr-border, #c7d3da);
  }
  .rx-grid td {
    padding: 10px;
    border-bottom: 1px solid var(--emr-border, #c7d3da);
    vertical-align: top;
  }
  .rx-icon-btn {
    width: 28px;
    height: 28px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: 6px;
    background: var(--emr-surface, #fffefa);
    color: var(--emr-text, #263847);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .rx-icon-btn--danger {
    border-color: var(--emr-danger, #a44949);
    color: var(--emr-danger, #a44949);
  }
  .rx-mini-stepper {
    display: inline-flex;
    align-items: center;
    height: 30px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: 6px;
    background: var(--emr-surface, #fffefa);
    overflow: hidden;
  }
  .rx-mini-btn {
    width: 24px;
    height: 100%;
    border: 0;
    background: var(--emr-surface-soft, #f1f4f5);
    color: var(--emr-text, #263847);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .rx-mini-val {
    min-width: 32px;
    padding: 0 6px;
    text-align: center;
    font-family: var(--emr-font-mono, monospace);
    font-size: var(--emr-text-xs, 0.75rem);
    font-weight: var(--emr-weight-bold, 700);
  }
`;

export class EmrMedicationListElement extends EmrClinicalListElement {
  override title = 'Medications';
}
export class EmrAllergyListElement extends EmrClinicalListElement {
  override title = 'Allergies';
}
export class EmrChronicDiseaseListElement extends EmrClinicalListElement {
  override title = 'Chronic diseases';
}
export class EmrPersonalHistoryListElement extends EmrClinicalListElement {
  override title = 'Significant personal history';
}

export class EmrPatientBannerElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l4Styles];
  @property({ attribute: false }) model?: PatientBannerViewModel;
  @property({ type: Boolean }) compact = false;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const isCompact = this.compact || m.layoutMode === 'compact';
    const isStoryboard = !this.compact && m.layoutMode === 'storyboard';
    const primaryId = m.identifiers[0]?.value ?? m.patientId;
    const extraIds = m.identifiers.slice(1);
    const inspectedAlert = m.activeInspectId
      ? [...m.allergies, ...m.alerts, ...m.chronicDiseases].find((item) => item.id === m.activeInspectId)
      : undefined;
    const inspectedVital = m.activeInspectId
      ? m.vitals?.find((item) => item.id === m.activeInspectId)
      : undefined;

    return html`<section
      class="emr-card"
      part="banner"
      data-layout-mode=${isCompact ? 'compact' : isStoryboard ? 'storyboard' : 'horizontal'}
    >
      <div class="emr-header">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <h2 class="emr-title">${m.displayName}</h2>
            ${m.vip ? html`<emr-badge .badge=${m.vip}></emr-badge>` : nothing}
            ${m.codeStatus ? html`<emr-badge .badge=${m.codeStatus}></emr-badge>` : nothing}
            ${m.isolation ? html`<emr-badge .badge=${m.isolation}></emr-badge>` : nothing}
            ${m.criticality ? html`<emr-badge .badge=${m.criticality}></emr-badge>` : nothing}
          </div>
          <p class="emr-muted">
            ${primaryId} · ${m.ageLabel} · ${m.sexLabel}
            ${m.weightLabel ? html` · <strong>Wt: ${m.weightLabel}</strong>` : nothing}
            · ${m.careSettingLabel} (${m.locationLabel})
            ${m.wardLabel ? html` · ${m.wardLabel}` : nothing}
            ${m.bedLabel ? html` · Bed ${m.bedLabel}` : nothing}
            ${m.lengthOfStayLabel ? html` · LOS ${m.lengthOfStayLabel}` : nothing}
          </p>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          ${m.allergyStatus ? html`<emr-badge .badge=${m.allergyStatus}></emr-badge>` : nothing}
          ${m.chronicDiseaseStatus ? html`<emr-badge .badge=${m.chronicDiseaseStatus}></emr-badge>` : nothing}
          ${(['compact', 'banner', 'storyboard'] as const).map(
            (mode) => html`<button
              type="button"
              class="emr-btn emr-btn--ghost"
              style="min-height:28px;padding:0 8px;font-size:var(--emr-text-xs,0.75rem);"
              aria-pressed=${(m.layoutMode ?? (this.compact ? 'compact' : 'banner')) === mode}
              @click=${() => this.emitIntent<PatientBannerIntent>({ type: 'layoutModeChangeRequested', layoutMode: mode })}
            >
              ${mode === 'compact' ? 'Compact' : mode === 'storyboard' ? 'Storyboard' : 'Standard'}
            </button>`,
          )}
          <button
            type="button"
            class="emr-btn emr-btn--secondary"
            aria-expanded=${m.expanded}
            @click=${() => this.emitIntent<PatientBannerIntent>({ type: 'expandedChangeRequested', expanded: !m.expanded })}
          >
            ${m.expanded ? 'Hide details' : 'Show details'}
          </button>
        </div>
      </div>

      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;" part="allergies-strip">
        ${m.allergyChipPrefix ? html`<span class="emr-label">${m.allergyChipPrefix}:</span>` : nothing}
        ${m.allergies.map(
          (a) => html`<button
            type="button"
            class="emr-btn emr-btn--secondary"
            style="min-height:26px;padding:2px 8px;font-size:var(--emr-text-xs,0.75rem);"
            aria-pressed=${m.activeInspectId === a.id}
            @click=${() =>
              this.emitIntent<PatientBannerIntent>({
                type: 'alertInspectRequested',
                alertId: m.activeInspectId === a.id ? null : a.id,
              })}
          >
            ⚠ ${a.label}${a.reactionLabel ? ` (${a.reactionLabel})` : ''}
          </button>`,
        )}
        ${m.allergyOverflow ? html`<emr-badge .badge=${m.allergyOverflow}></emr-badge>` : nothing}
        ${!isCompact
          ? m.chronicDiseases.map(
              (c) => html`<button
                type="button"
                class="emr-btn emr-btn--ghost"
                style="min-height:26px;padding:2px 8px;font-size:var(--emr-text-xs,0.75rem);"
                aria-pressed=${m.activeInspectId === c.id}
                @click=${() =>
                  this.emitIntent<PatientBannerIntent>({
                    type: 'alertInspectRequested',
                    alertId: m.activeInspectId === c.id ? null : c.id,
                  })}
              >
                Dx: ${c.label}
              </button>`,
            )
          : nothing}
        ${m.alerts.map(
          (al) => html`<button
            type="button"
            class="emr-btn emr-btn--ghost"
            style="min-height:26px;padding:2px 8px;font-size:var(--emr-text-xs,0.75rem);"
            aria-pressed=${m.activeInspectId === al.id}
            @click=${() =>
              this.emitIntent<PatientBannerIntent>({
                type: 'alertInspectRequested',
                alertId: m.activeInspectId === al.id ? null : al.id,
              })}
          >
            ${al.label}
          </button>`,
        )}
      </div>

      ${!isCompact && m.vitals && m.vitals.length > 0
        ? html`<div
            part="vitals-strip"
            role="group"
            aria-label="Recent vitals and clinical observations"
            style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;"
          >
            ${m.vitals.map((v) => {
              const pts = v.trendPoints ?? [];
              const min = pts.length ? Math.min(...pts) : 0;
              const max = pts.length ? Math.max(...pts) : 1;
              const span = max - min || 1;
              const polyPoints = pts
                .map((p, idx) => {
                  const x = pts.length === 1 ? 18 : Math.round((idx / (pts.length - 1)) * 36);
                  const y = Math.round(14 - ((p - min) / span) * 12);
                  return `${x},${y}`;
                })
                .join(' ');
              return html`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="min-height:30px;padding:2px 10px;display:inline-flex;align-items:center;gap:6px;font-size:var(--emr-text-xs,0.75rem);"
                aria-pressed=${m.activeInspectId === v.id}
                @click=${() =>
                  this.emitIntent<PatientBannerIntent>({
                    type: 'alertInspectRequested',
                    alertId: m.activeInspectId === v.id ? null : v.id,
                  })}
              >
                <span class="emr-muted">${v.label}:</span>
                <strong style="font-family:var(--emr-font-mono,monospace);">${v.valueLabel}</strong>
                ${v.unit ? html`<span class="emr-muted">${v.unit}</span>` : nothing}
                ${v.deltaLabel ? html`<span class="emr-badge emr-badge--${v.tone ?? 'neutral'}">${v.deltaLabel}</span>` : nothing}
                ${pts.length > 0
                  ? html`<svg
                      class="emr-vital-sparkline"
                      width="38"
                      height="16"
                      viewBox="0 0 38 16"
                      aria-hidden="true"
                      style="overflow:visible;"
                    >
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        points=${polyPoints}
                      ></polyline>
                    </svg>`
                  : nothing}
              </button>`;
            })}
          </div>`
        : nothing}

      ${inspectedAlert || inspectedVital
        ? html`<div
            class="emr-card"
            part="provenance-inspector"
            role="region"
            aria-label=${`Clinical provenance for ${(inspectedAlert ?? inspectedVital)!.label}`}
            style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;background:var(--emr-surface-soft,#f1f4f5);"
          >
            ${inspectedAlert
              ? html`<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:var(--emr-text-xs,0.75rem);">
                  <strong>${inspectedAlert.label}</strong>
                  ${inspectedAlert.reactionLabel ? html`<span>Reaction: ${inspectedAlert.reactionLabel}</span>` : nothing}
                  ${inspectedAlert.detail ? html`<span>${inspectedAlert.detail}</span>` : nothing}
                  <span class="emr-muted">
                    Provenance: ${inspectedAlert.provenanceLabel ?? 'Verified in hospital EHR'}
                    ${inspectedAlert.recordedAtLabel ? ` (${inspectedAlert.recordedAtLabel})` : ''}
                  </span>
                </div>`
              : inspectedVital
                ? html`<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:var(--emr-text-xs,0.75rem);">
                    <strong>${inspectedVital.label}: ${inspectedVital.valueLabel} ${inspectedVital.unit ?? ''}</strong>
                    ${inspectedVital.deltaLabel ? html`<span>Trend: ${inspectedVital.deltaLabel}</span>` : nothing}
                    <span class="emr-muted">
                      Provenance: ${inspectedVital.provenanceLabel ?? 'Verified clinical observation'}
                    </span>
                  </div>`
                : nothing}
            <button
              type="button"
              class="emr-btn emr-btn--ghost"
              style="min-height:26px;padding:0 8px;"
              @click=${() => this.emitIntent<PatientBannerIntent>({ type: 'alertInspectRequested', alertId: null })}
            >
              Close
            </button>
          </div>`
        : nothing}

      ${m.expanded
        ? html`<div class="emr-card" part="details">
            <dl>
              ${m.identifiers.map((id) => html`<dt>${id.label}</dt><dd>${id.value}</dd>`)}
              ${m.vitals?.map((vital) => html`<dt>${vital.label}</dt><dd>${vital.valueLabel} ${vital.unit}</dd>`)}
              ${m.encounterLabel ? html`<dt>Encounter</dt><dd>${m.encounterLabel}</dd>` : nothing}
              ${m.admittedOnLabel ? html`<dt>Admitted</dt><dd>${m.admittedOnLabel}</dd>` : nothing}
              ${m.admittingClinicianLabel ? html`<dt>Clinician</dt><dd>${m.admittingClinicianLabel}</dd>` : nothing}
            </dl>
            ${extraIds.length > 0
              ? html`<div class="emr-muted" style="font-size:var(--emr-text-xs,0.75rem);">
                  ${extraIds.map((id) => `${id.label}: ${id.value}`).join(' · ')}
                </div>`
              : nothing}
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${[...m.allergies, ...m.chronicDiseases, ...m.alerts].map((badge) => html`<emr-badge .badge=${badge}></emr-badge>`)}
            </div>
          </div>`
        : nothing}
    </section>`;
  }
}

export class EmrDoseScheduleElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l4Styles];
  @property({ attribute: false }) model?: DoseScheduleViewModel;

  private formatSlotDose(slot: DoseScheduleViewModel['slots'][number], unit?: DoseScheduleViewModel['unit']): string {
    if (slot.amountLabel) return slot.amountLabel;
    if (slot.amount === null || slot.amount <= 0) return '—';
    const u = unit ? (slot.amount <= 1 ? unit.one : unit.other) : '';
    return u ? `${slot.amount} ${u}` : String(slot.amount);
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const pattern = m.slots.map((s) => s.amountLabel ?? (s.amount ?? 0)).join(' - ');
    return html`<section class="emr-card" part="dose-schedule">
      <div class="emr-header">
        <div>
          <span class="emr-muted">
            ${m.medication.formLabel}${m.medication.code ? ` · ${m.medication.code}` : ''}
          </span>
          <h3 class="emr-title">${m.medication.label} ${m.medication.strength ?? ''}</h3>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          ${m.status ? html`<emr-badge .badge=${m.status}></emr-badge>` : nothing}
          ${!m.readOnly && m.canShowInstructions
            ? html`<button
                type="button"
                class="emr-btn emr-btn--ghost"
                @click=${() => this.emitIntent<DoseScheduleIntent>({ type: 'instructionsRequested' })}
              >
                Instructions
              </button>`
            : nothing}
          ${!m.readOnly && m.canEdit
            ? html`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                @click=${() => this.emitIntent<DoseScheduleIntent>({ type: 'editRequested' })}
              >
                Edit schedule
              </button>`
            : nothing}
        </div>
      </div>

      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <strong>
          ${m.frequency.label}${m.frequency.code ? ` (${m.frequency.code})` : ''}
        </strong>
        ${m.slots.length ? html`<span class="emr-badge">${pattern}</span>` : nothing}
        ${m.route ? html`<span class="emr-badge emr-badge--neutral">Route: ${m.route}</span>` : nothing}
        ${m.site
          ? html`<span class="emr-badge emr-badge--info">
              Site: ${m.site.label}${m.site.code ? ` (${m.site.code})` : ''}
            </span>`
          : nothing}
        ${m.foodRelation ? html`<span class="emr-badge emr-badge--neutral">${m.foodRelation}</span>` : nothing}
        ${m.duration ? html`<span class="emr-muted">Duration: ${m.duration}</span>` : nothing}
        ${m.startLabel ? html`<span class="emr-muted">Start: ${m.startLabel}</span>` : nothing}
        ${m.maxDailyDose ? html`<span class="emr-badge emr-badge--warning">Max daily: ${m.maxDailyDose}</span>` : nothing}
      </div>

      ${m.slots.length > 0
        ? html`<div
            part="slots"
            style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;"
          >
            ${m.slots.map(
              (slot) => html`<div
                class="emr-card"
                style="padding:8px 10px;gap:2px;background:var(--emr-surface-soft,#f1f4f5);"
              >
                <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;">
                  <strong style="font-size:var(--emr-text-xs,0.75rem);">${slot.label}</strong>
                  ${slot.timeHint ? html`<span class="emr-muted" style="font-size:11px;">${slot.timeHint}</span>` : nothing}
                </div>
                <div style="font-family:var(--emr-font-mono,monospace);font-weight:700;">
                  ${this.formatSlotDose(slot, m.unit)}
                </div>
                ${slot.householdLabel ? html`<span class="emr-muted" style="font-size:11px;">(${slot.householdLabel})</span>` : nothing}
              </div>`,
            )}
          </div>`
        : nothing}

      ${m.prn
        ? html`<div class="emr-muted" part="prn">
            <strong>PRN:</strong> ${m.prn.label}${m.prn.maxLabel ? ` · ${m.prn.maxLabel}` : ''}
          </div>`
        : nothing}

      ${m.taper && m.taper.length > 0
        ? html`<div part="taper" style="display:grid;gap:4px;">
            <span class="emr-label">Tapering / Step Regimen</span>
            <ol style="margin:0;padding-left:18px;display:grid;gap:4px;">
              ${m.taper.map(
                (step) => html`<li>
                  <strong>${step.periodLabel}:</strong> ${step.frequencyLabel}
                  ${step.slots && step.slots.length > 0
                    ? html`<span class="emr-muted">
                        (${step.slots.map((s) => `${s.label}: ${this.formatSlotDose(s, m.unit)}`).join(', ')})
                      </span>`
                    : nothing}
                </li>`,
              )}
            </ol>
          </div>`
        : nothing}

      ${m.separationNote ? html`<p class="emr-muted" part="separation-note">${m.separationNote}</p>` : nothing}
      ${m.clinicianNote ? html`<p class="emr-muted" part="clinician-note"><strong>Clinician note:</strong> ${m.clinicianNote}</p>` : nothing}
      ${m.patientNote ? html`<p class="emr-muted" part="patient-note"><strong>Patient note:</strong> ${m.patientNote}</p>` : nothing}

      ${m.instructions && m.instructions.length > 0
        ? html`<ul part="instructions" style="margin:0;padding-left:18px;">
            ${m.instructions.map((inst) => html`<li>${inst}</li>`)}
          </ul>`
        : nothing}
    </section>`;
  }
}

export class EmrScoreResultCardElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l4Styles];
  @property({ attribute: false }) model?: ScoreResultCardViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const subscales = m.subscales ?? m.result?.subscales ?? [];
    const missingItems = m.missingItems ?? m.result?.missingItems ?? [];
    const completenessLabel = m.completenessLabel ?? m.result?.completenessLabel;
    const computedAtLabel = m.computedAtLabel ?? m.result?.computedAtLabel ?? m.result?.computedAt;
    const provenance = m.provenance ?? m.result?.provenance;

    return html`<section class="emr-card" part="score-result-card">
      <div class="emr-header">
        <div>
          <h3 class="emr-title">${m.instrumentLabel}</h3>
          ${computedAtLabel || provenance
            ? html`<p class="emr-muted" style="font-size:var(--emr-text-xs,0.75rem);">
                ${computedAtLabel ? html`<span>Computed: ${computedAtLabel}</span>` : nothing}
                ${computedAtLabel && provenance ? ' · ' : ''}
                ${provenance ? html`<span>Provenance: ${provenance}</span>` : nothing}
              </p>`
            : nothing}
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          ${m.stale
            ? html`<span class="emr-badge emr-badge--warning">${m.staleLabel ?? 'Stale score'}</span>`
            : nothing}
          ${m.status && m.status !== 'recorded'
            ? html`<span class="emr-badge emr-badge--neutral">${m.status}</span>`
            : m.result
              ? html`<span class="emr-badge emr-badge--${m.result.bandTone ?? 'neutral'}">
                  ${m.result.total} · ${m.result.bandLabel ?? ''}
                </span>`
              : html`<span class="emr-muted">Not supplied</span>`}
        </div>
      </div>

      ${m.loading ? html`<p role="status" class="emr-muted">Calculating score…</p>` : nothing}
      ${m.error ? html`<p role="alert" style="color:var(--emr-danger,#b42318);">${m.error}</p>` : nothing}
      ${m.result?.interpretation ? html`<p class="emr-muted">${m.result.interpretation}</p>` : nothing}

      ${!m.compact && m.result?.components && m.result.components.length > 0
        ? html`<div part="components" style="display:flex;gap:6px;flex-wrap:wrap;">
            ${m.result.components.map(
              (comp) => html`<button
                type="button"
                class="emr-btn emr-btn--ghost"
                style="min-height:28px;padding:2px 8px;font-size:var(--emr-text-xs,0.75rem);"
                @click=${() =>
                  this.emitIntent<ScoreResultCardIntent>({
                    type: 'componentSelected',
                    componentId: comp.id,
                  })}
              >
                ${comp.label}: <strong>${comp.value}</strong>
              </button>`,
            )}
          </div>`
        : nothing}

      ${!m.compact && subscales.length > 0
        ? html`<div part="subscales" style="display:grid;gap:4px;">
            <span class="emr-label">Subscales</span>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${subscales.map(
                (sub) => html`<span class="emr-badge emr-badge--neutral">
                  ${sub.label}: ${sub.value}${sub.max !== undefined ? `/${sub.max}` : ''}${sub.bandLabel ? ` (${sub.bandLabel})` : ''}
                </span>`,
              )}
            </div>
          </div>`
        : nothing}

      ${completenessLabel || missingItems.length > 0
        ? html`<div part="completeness" class="emr-muted" style="font-size:var(--emr-text-xs,0.75rem);">
            ${completenessLabel ? html`<div>${completenessLabel}</div>` : nothing}
            ${missingItems.length > 0
              ? html`<div>Missing items: ${missingItems.join(', ')}</div>`
              : nothing}
          </div>`
        : nothing}

      ${m.canRecompute || m.canViewDetail
        ? html`<div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${m.canRecompute
              ? html`<button
                  type="button"
                  class="emr-btn emr-btn--secondary"
                  @click=${() => this.emitIntent<ScoreResultCardIntent>({ type: 'recomputeRequested', instrumentId: m.id })}
                >
                  Recompute
                </button>`
              : nothing}
            ${m.canViewDetail
              ? html`<button
                  type="button"
                  class="emr-btn emr-btn--ghost"
                  @click=${() => this.emitIntent<ScoreResultCardIntent>({ type: 'detailRequested', instrumentId: m.id })}
                >
                  View details
                </button>`
              : nothing}
          </div>`
        : nothing}
    </section>`;
  }
}

export class EmrPrescribingTableElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l4Styles];
  @property({ attribute: false }) model?: PrescribingTableViewModel;
  @property({ type: String }) viewMode: 'grid' | 'sig' | 'patient' = 'grid';
  private quickSigText = '';
  private activeDrugRowId: string | null = null;

  private formatAmt(row: PrescribingRow, slotId: string): string {
    const n = row.slots.find((s) => s.id === slotId)?.amount ?? 0;
    if (n <= 0) return '0';
    if (n === 0.5) return '½';
    return String(n);
  }

  private stepDose(rowId: string, direction: -1 | 1): void {
    const model = this.model;
    const row = model?.rows.find(item => item.id === rowId);
    if (!row || model?.readOnly) return;
    const step = row.doseStep ?? (row.form === 'tablet' ? 0.5 : 1);
    if (!Number.isFinite(step) || step <= 0 || (direction < 0 && (row.doseAmount ?? 0) <= step)) return;
    this.emitIntent<PrescribingTableIntent>({ type: 'doseStepped', rowId, delta: direction * step });
  }

  private selectFormulary(rowId: string, item: PrescribingFormularyItem): void {
    const model = this.model;
    if (!model || model.readOnly) return;
    const search = model.formularySearch;
    if (search) {
      if (
        search.rowId !== rowId ||
        search.loading ||
        search.error ||
        !model.rows.some((row) => row.id === rowId && row.drugName === search.query) ||
        !search.items.includes(item)
      ) {
        return;
      }
    } else if (!model.formulary?.includes(item)) {
      return;
    }
    this.activeDrugRowId = null;
    this.emitIntent<PrescribingTableIntent>({ type: 'formularySelected', rowId, item });
  }

  private submitQuickSig(): void {
    if (!this.model || this.model.readOnly) return;
    const cmd = this.quickSigText.trim();
    if (!cmd) return;
    this.emitIntent<PrescribingTableIntent>({ type: 'quickSigSubmitted', command: cmd });
    this.quickSigText = '';
    this.requestUpdate();
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const locked = !!m.readOnly;
    return html`<section class="emr-card" part="prescribing-table" style="padding:0;overflow:hidden;">
      <header class="emr-header" style="padding:12px 16px;border-bottom:1px solid var(--emr-border,#c7d3da);background:var(--emr-surface-soft,#f1f4f5);">
        <div>
          <h3 class="emr-title">${m.title ?? 'Medication Prescribing Table'}</h3>
          <p class="emr-muted">Use − / + to step doses & duration, and ↑ / ↓ / + / − to reorder or remove rows.</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <div role="group" aria-label="Prescription view mode" style="display:flex;gap:4px;">
            ${(['grid', 'sig', 'patient'] as const).map(
              (mode) => html`<button
                type="button"
                class="emr-btn emr-btn--small ${this.viewMode === mode ? 'emr-btn--primary' : 'emr-btn--ghost'}"
                aria-pressed=${this.viewMode === mode}
                @click=${() => {
                  this.viewMode = mode;
                  this.requestUpdate();
                }}
              >
                ${mode === 'grid' ? '7-Col Grid' : mode === 'sig' ? 'Clinical SIG' : 'Patient Card'}
              </button>`,
            )}
          </div>
          ${!locked && m.favourites && m.favourites.length > 0
            ? html`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                ${m.favourites.map(
                  (fav) => html`<button
                    type="button"
                    class="emr-btn emr-btn--small emr-btn--secondary"
                    @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'favouriteApplied', favouriteId: fav.id })}
                  >
                    + ${fav.label}
                  </button>`,
                )}
              </div>`
            : nothing}
          ${m.status ? html`<emr-badge .badge=${m.status}></emr-badge>` : nothing}
        </div>
      </header>

      ${!locked
        ? html`<div
            part="smart-sig-bar"
            style="padding:8px 16px;border-bottom:1px solid var(--emr-border,#c7d3da);display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:var(--emr-surface,#fffefa);"
          >
            <span class="emr-badge emr-badge--info">⚡ SmartSig</span>
            <input
              type="text"
              class="emr-control"
              style="flex:1;min-width:200px;height:32px;min-height:32px;"
              aria-label="SmartSig command"
              placeholder="Type shorthand SIG (e.g. paracetamol 500mg tab 1 tds 5d after food)…"
              .value=${live(this.quickSigText)}
              @input=${(e: Event) => {
                this.quickSigText = (e.target as HTMLInputElement).value;
              }}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  this.submitQuickSig();
                }
              }}
            />
            <button
              type="button"
              class="emr-btn emr-btn--small emr-btn--secondary"
              @click=${() => this.submitQuickSig()}
            >
              + Parse &amp; Add Row
            </button>
            ${m.quickSigExamples && m.quickSigExamples.length > 0
              ? html`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                  ${m.quickSigExamples.map(
                    (ex) => html`<button
                      type="button"
                      class="emr-btn emr-btn--small emr-btn--ghost"
                      @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'quickSigSubmitted', command: ex.command })}
                    >
                      ${ex.label}
                    </button>`,
                  )}
                </div>`
              : nothing}
          </div>`
        : nothing}

      ${m.safetyAlerts && m.safetyAlerts.length > 0
        ? html`<div
            part="safety-alerts"
            role="region"
            aria-label="Medication safety alerts"
            style="padding:8px 16px;border-bottom:1px solid var(--emr-border,#c7d3da);display:grid;gap:4px;"
          >
            ${m.safetyAlerts.map(
              (alert) => html`<div style="display:flex;gap:8px;align-items:center;font-size:var(--emr-text-xs,0.75rem);">
                <span class="emr-badge emr-badge--${alert.tone}">${alert.badgeLabel}</span>
                <span>${alert.message}</span>
              </div>`,
            )}
          </div>`
        : nothing}

      ${this.viewMode === 'sig' || this.viewMode === 'patient'
        ? html`<div
            part="sig-summary"
            style="padding:10px 16px;border-bottom:1px solid var(--emr-border,#c7d3da);display:grid;gap:6px;background:var(--emr-surface-soft,#f1f4f5);"
          >
            ${m.rows.map(
              (row, i) => html`<div style="font-size:var(--emr-text-xs,0.75rem);display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <strong>#${i + 1} ${row.drugName || 'Unnamed medicine'} ${row.strength}</strong>
                <span class="emr-muted">(${row.formLabel || row.form})</span>
                <span>— ${row.doseAmount ?? '—'} ${row.unitLabel} · ${row.frequencyCode ?? ''} ${row.patternLabel ? `(${row.patternLabel})` : ''}</span>
                <span>· ${row.route}${row.site ? ` (${row.site})` : ''}</span>
                <span>· ${row.durationCount ?? '—'} ${row.durationUnit}</span>
                ${row.dispenseQuantity
                  ? html`<span class="emr-badge emr-badge--info">
                      = ${row.dispenseQuantity.count} ${row.dispenseQuantity.unit}${row.dispenseQuantity.count === 1 ? '' : 's'}
                    </span>`
                  : nothing}
                ${row.foodRelation ? html`<span class="emr-muted">· ${row.foodRelation}</span>` : nothing}
                ${row.instructions ? html`<span class="emr-muted">· "${row.instructions}"</span>` : nothing}
              </div>`,
            )}
          </div>`
        : nothing}

      <div style="overflow-x:auto;">
        <table class="rx-grid">
          <thead>
            <tr>
              <th>Drug Name &amp; Strength</th>
              <th>Dose (Qty &amp; Unit)</th>
              <th>Frequency (OD/BD/TDS/HS/SOS · M–A–E–N)</th>
              <th>Route &amp; Site</th>
              <th>Duration (− / +)</th>
              <th>Spcl Instructions</th>
              <th>+ / − / ↑ / ↓</th>
            </tr>
          </thead>
          <tbody>
            ${m.rows.map((row, idx) => {
              const first = idx === 0;
              const last = idx === m.rows.length - 1;
              const step = row.doseStep ?? (row.form === 'tablet' ? 0.5 : 1);
              const doseVal = row.doseAmount;
              const search = !locked && m.formularySearch?.rowId === row.id && m.formularySearch.query === row.drugName
                ? m.formularySearch : undefined;
              const staticMatches =
                !locked && !search && m.formulary && m.formulary.length > 0 && this.activeDrugRowId === row.id
                  ? m.formulary.filter((f) => {
                      const q = row.drugName.trim().toLowerCase();
                      return (
                        !q ||
                        f.drugName.toLowerCase().includes(q) ||
                        f.code.toLowerCase().includes(q) ||
                        (f.specialtyTag ?? '').toLowerCase().includes(q)
                      );
                    })
                  : [];
              const unitChoices = row.allowedUnits?.length ? row.allowedUnits : m.doseUnits ?? [];
              const routeChoices = row.allowedRoutes?.length ? row.allowedRoutes : m.routeOptions ?? [];
              return html`<tr>
                <td>
                  <div style="display:grid;gap:4px;">
                    ${row.stepLabel
                      ? html`<span class="emr-badge emr-badge--info" style="justify-self:start;">${row.stepLabel}</span>`
                      : nothing}
                    <div style="display:flex;align-items:center;gap:6px;">
                      <strong>#${idx + 1}</strong>
                      <input class="emr-control" style="height:34px;min-height:34px;" .value=${row.drugName} ?readonly=${locked} aria-label=${`Row ${idx + 1} medicine name`} placeholder="Medicine name or formulary search"
                        @focus=${() => {
                          if (!locked) {
                            this.activeDrugRowId = row.id;
                            this.requestUpdate();
                          }
                        }}
                        @input=${(e: Event) => {
                          if (!this.model || this.model.readOnly || !this.model.rows.some(current => current.id === row.id)) return;
                          this.activeDrugRowId = row.id;
                          const val = (e.target as HTMLInputElement).value;
                          this.emitIntent<PrescribingTableIntent>({ type: 'drugNameChanged', rowId: row.id, drugName: val });
                          this.emitIntent<PrescribingTableIntent>({ type: 'formularySearchRequested', rowId: row.id, query: val });
                        }} />
                      <input class="emr-control" style="width:84px;height:34px;min-height:34px;" .value=${row.strength} ?readonly=${locked} placeholder="500 mg"
                        @input=${(e: Event) => this.emitIntent<PrescribingTableIntent>({ type: 'strengthChanged', rowId: row.id, strength: (e.target as HTMLInputElement).value })} />
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:11px;font-family:var(--emr-font-mono);">
                      <span class="emr-badge emr-badge--neutral">Form: ${row.formLabel || row.form}</span>
                      ${row.formularyCode ? html`<span class="emr-muted">${row.formularyCode}</span>` : nothing}
                      ${row.stockStatus ? html`<span class="emr-muted">· ${row.stockStatus}</span>` : nothing}
                      ${row.specialtyTag ? html`<span class="emr-badge emr-badge--info">${row.specialtyTag}</span>` : nothing}
                      ${row.dosingBasisLabel ? html`<span class="emr-muted">(${row.dosingBasisLabel})</span>` : nothing}
                    </div>
                    ${row.error
                      ? html`<div role="alert" style="font-size:11px;color:var(--emr-danger,#b42318);">${row.error}</div>`
                      : nothing}
                    ${search ? html`<div aria-label="Formulary results">
                      <div class="emr-muted">${m.formularyLabel ?? 'Formulary results'}</div>
                      ${search.loading ? html`<div role="status">Searching formulary…</div>`
                        : search.error ? html`<div role="alert">Formulary search failed.</div>
                          <button type="button" class="emr-btn" @click=${() => {
                            const current = this.model;
                            if (!current || current.readOnly || current.formularySearch !== search) return;
                            this.emitIntent<PrescribingTableIntent>({ type: 'formularySearchRequested', rowId: row.id, query: search.query });
                          }}>Retry formulary search</button>`
                        : search.items.length ? html`<div style="display:grid;gap:4px;">
                            ${search.items.map(item => html`<button type="button" class="emr-btn" @click=${() => this.selectFormulary(row.id, item)}>
                              ${item.drugName} · ${item.strength} · ${item.formLabel} · ${item.code}
                            </button>`)}
                          </div>`
                        : html`<div role="status">No formulary results.</div>`}
                    </div>` : staticMatches.length > 0 ? html`<div aria-label="Formulary results" style="display:grid;gap:4px;">
                      <div class="emr-muted">${m.formularyLabel ?? 'Formulary catalog'}</div>
                      ${staticMatches.map((item) => html`<button type="button" class="emr-btn" @click=${() => this.selectFormulary(row.id, item)}>
                        ${item.drugName} · ${item.strength} · ${item.formLabel} · ${item.code}
                      </button>`)}
                    </div>` : nothing}
                  </div>
                </td>
                <td>
                  <div style="display:grid;gap:4px;">
                    <div class="rx-mini-stepper">
                      ${!locked
                        ? html`<button type="button" class="rx-mini-btn" aria-label=${`Decrease dose for row ${idx + 1}`} ?disabled=${(doseVal ?? 0) <= step} @click=${() => this.stepDose(row.id, -1)}>${renderEmrSvgIcon('minus', 12)}</button>`
                        : nothing}
                      <span class="rx-mini-val">${doseVal == null ? '—' : `${doseVal}${row.unitLabel ? ` ${row.unitLabel}` : ''}`}</span>
                      ${!locked
                        ? html`<button type="button" class="rx-mini-btn" aria-label=${`Increase dose for row ${idx + 1}`} @click=${() => this.stepDose(row.id, 1)}>${renderEmrSvgIcon('plus', 12)}</button>`
                        : nothing}
                    </div>
                    ${!locked && unitChoices.length > 0
                      ? html`<div style="display:flex;gap:3px;flex-wrap:wrap;">
                          ${unitChoices.map(
                            (u) => html`<button
                              type="button"
                              class="emr-btn emr-btn--small ${row.unitLabel === u ? 'emr-btn--primary' : 'emr-btn--ghost'}"
                              style="min-height:22px;padding:0 6px;font-size:10px;"
                              @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'doseUnitChanged', rowId: row.id, unitLabel: u })}
                            >${u}</button>`,
                          )}
                        </div>`
                      : nothing}
                  </div>
                </td>
                <td>
                  <div style="display:grid;gap:4px;">
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <span style="font-family:var(--emr-font-mono);font-size:12px;font-weight:700;">${row.frequencyCode ?? ''} ${row.patternLabel ? `(${row.patternLabel})` : ''}</span>
                      ${!locked && m.presets && m.presets.length > 0
                        ? html`<div style="display:flex;gap:3px;flex-wrap:wrap;">
                            ${m.presets.map(
                              (preset) => html`<button
                                type="button"
                                class="emr-btn emr-btn--small ${row.frequencyCode === preset.label ? 'emr-btn--primary' : 'emr-btn--ghost'}"
                                style="min-height:22px;padding:0 6px;font-size:10px;"
                                @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'presetApplied', rowId: row.id, presetId: preset.id })}
                              >${preset.label}</button>`,
                            )}
                          </div>`
                        : nothing}
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                      ${m.slotDefinitions.map(
                        (def) => html`<div style="display:grid;gap:2px;">
                          <span class="emr-muted" style="font-size:11px;" title=${def.timeHint ?? def.label}>${def.shortLabel ?? def.label}</span>
                          <div class="rx-mini-stepper">
                            ${!locked
                              ? html`<button type="button" class="rx-mini-btn" @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'slotStepped', rowId: row.id, slotId: def.id, delta: -step })}>${renderEmrSvgIcon('minus', 12)}</button>`
                              : nothing}
                            <span class="rx-mini-val">${this.formatAmt(row, def.id)}</span>
                            ${!locked
                              ? html`<button type="button" class="rx-mini-btn" @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'slotStepped', rowId: row.id, slotId: def.id, delta: step })}>${renderEmrSvgIcon('plus', 12)}</button>`
                              : nothing}
                          </div>
                        </div>`,
                      )}
                    </div>
                    ${!locked
                      ? html`<div>
                          <button
                            type="button"
                            class="emr-btn emr-btn--small ${row.taperExpanded ? 'emr-btn--primary' : 'emr-btn--ghost'}"
                            style="min-height:22px;padding:0 6px;font-size:10px;"
                            aria-expanded=${Boolean(row.taperExpanded)}
                            @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'taperToggleRequested', rowId: row.id })}
                          >
                            ${row.taperExpanded ? '▾ Hide Taper Steps' : '▸ Taper Schedule'}
                          </button>
                        </div>`
                      : nothing}
                  </div>
                </td>
                <td>
                  <div style="display:grid;gap:4px;">
                    <span style="font-size:12px;">${row.route}${row.site ? ` · ${row.site.toUpperCase()}` : ''}</span>
                    ${!locked && routeChoices.length > 0
                      ? html`<div style="display:flex;gap:3px;flex-wrap:wrap;">
                          ${routeChoices.map(
                            (rt) => html`<button
                              type="button"
                              class="emr-btn emr-btn--small ${row.route === rt.value || row.route === rt.label ? 'emr-btn--primary' : 'emr-btn--ghost'}"
                              style="min-height:22px;padding:0 6px;font-size:10px;"
                              @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'routeChanged', rowId: row.id, route: rt.value })}
                            >${rt.label}</button>`,
                          )}
                        </div>`
                      : nothing}
                    ${!locked && m.siteOptions && m.siteOptions.length > 0
                      ? html`<div style="display:flex;gap:3px;flex-wrap:wrap;">
                          ${m.siteOptions.map(
                            (st) => html`<button
                              type="button"
                              class="emr-btn emr-btn--small ${row.site === st.value ? 'emr-btn--primary' : 'emr-btn--ghost'}"
                              style="min-height:22px;padding:0 6px;font-size:10px;"
                              @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'siteChanged', rowId: row.id, site: st.value })}
                            >${st.label}</button>`,
                          )}
                        </div>`
                      : nothing}
                  </div>
                </td>
                <td>
                  <div style="display:grid;gap:4px;">
                    <div class="rx-mini-stepper">
                      ${!locked
                        ? html`<button type="button" class="rx-mini-btn" @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'durationStepped', rowId: row.id, delta: -1 })}>${renderEmrSvgIcon('minus', 12)}</button>`
                        : nothing}
                      <span class="rx-mini-val">${row.durationCount ?? '—'} ${row.durationUnit}</span>
                      ${!locked
                        ? html`<button type="button" class="rx-mini-btn" @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'durationStepped', rowId: row.id, delta: 1 })}>${renderEmrSvgIcon('plus', 12)}</button>`
                        : nothing}
                    </div>
                    ${!locked && m.durationUnits && m.durationUnits.length > 0
                      ? html`<div style="display:flex;gap:3px;flex-wrap:wrap;">
                          ${m.durationUnits.map(
                            (du) => html`<button
                              type="button"
                              class="emr-btn emr-btn--small ${row.durationUnit === du ? 'emr-btn--primary' : 'emr-btn--ghost'}"
                              style="min-height:22px;padding:0 6px;font-size:10px;"
                              @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'durationChanged', rowId: row.id, count: row.durationCount, unit: du })}
                            >${du}</button>`,
                          )}
                        </div>`
                      : nothing}
                    ${row.dispenseQuantity
                      ? html`<span class="emr-badge emr-badge--info" style="justify-self:start;">
                          = ${row.dispenseQuantity.count} ${row.dispenseQuantity.unit}${row.dispenseQuantity.count === 1 ? '' : 's'}
                        </span>`
                      : nothing}
                  </div>
                </td>
                <td>
                  <div style="display:grid;gap:4px;">
                    ${!locked && m.foodOptions && m.foodOptions.length > 0
                      ? html`<div style="display:flex;gap:3px;flex-wrap:wrap;">
                          ${m.foodOptions.map(
                            (fo) => html`<button
                              type="button"
                              class="emr-btn emr-btn--small ${row.foodRelation === fo ? 'emr-btn--primary' : 'emr-btn--ghost'}"
                              style="min-height:22px;padding:0 6px;font-size:10px;"
                              @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'foodRelationChanged', rowId: row.id, foodRelation: fo })}
                            >${fo}</button>`,
                          )}
                        </div>`
                      : row.foodRelation
                        ? html`<span class="emr-muted" style="font-size:11px;">${row.foodRelation}</span>`
                        : nothing}
                    <input class="emr-control" style="height:34px;min-height:34px;" .value=${row.instructions} ?readonly=${locked} placeholder="Spcl instructions…"
                      @input=${(e: Event) => this.emitIntent<PrescribingTableIntent>({ type: 'instructionsChanged', rowId: row.id, instructions: (e.target as HTMLInputElement).value })} />
                  </div>
                </td>
                <td>
                  ${!locked
                    ? html`<div style="display:grid;gap:4px;">
                        <div style="display:flex;gap:4px;">
                          <button type="button" class="rx-icon-btn" aria-label="Insert row below"
                            @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'rowAddRequested', afterRowId: row.id })}>
                            ${renderEmrSvgIcon('plus', 13)}
                          </button>
                          <button type="button" class="rx-icon-btn rx-icon-btn--danger" ?disabled=${m.rows.length <= 1} aria-label="Remove row"
                            @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'rowRemoveRequested', rowId: row.id })}>
                            ${renderEmrSvgIcon('minus', 13)}
                          </button>
                          <button type="button" class="rx-icon-btn" ?disabled=${first} aria-label="Move row up"
                            @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'rowMoveRequested', rowId: row.id, direction: 'up' })}>
                            ${renderEmrSvgIcon('chevron-up', 13)}
                          </button>
                          <button type="button" class="rx-icon-btn" ?disabled=${last} aria-label="Move row down"
                            @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'rowMoveRequested', rowId: row.id, direction: 'down' })}>
                            ${renderEmrSvgIcon('chevron-down', 13)}
                          </button>
                        </div>
                        <div style="display:flex;gap:4px;">
                          <button type="button" class="rx-icon-btn" style="width:auto;padding:0 6px;font-size:10px;font-weight:700;" aria-label="Add Step-Down row"
                            @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'rowStepTitrationRequested', rowId: row.id, direction: 'down' })}>
                            ↘ Step-Dn
                          </button>
                          <button type="button" class="rx-icon-btn" style="width:auto;padding:0 6px;font-size:10px;font-weight:700;" aria-label="Add Step-Up row"
                            @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'rowStepTitrationRequested', rowId: row.id, direction: 'up' })}>
                            ↗ Step-Up
                          </button>
                        </div>
                      </div>`
                    : nothing}
                </td>
              </tr>
              ${row.taperExpanded
                ? html`<tr part="taper-row">
                    <td colspan="7" style="background:var(--emr-surface-soft,#f1f4f5);padding:10px 16px;">
                      <div style="display:grid;gap:8px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                          <strong style="font-size:var(--emr-text-xs,0.75rem);">Tapering Schedule for #${idx + 1} ${row.drugName}</strong>
                          ${!locked
                            ? html`<button
                                type="button"
                                class="emr-btn emr-btn--small emr-btn--secondary"
                                @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'taperStepAddRequested', rowId: row.id })}
                              >
                                + Add taper step
                              </button>`
                            : nothing}
                        </div>
                        ${(row.taperSteps ?? []).map((tStep, sIdx) => {
                          const stepsLen = (row.taperSteps ?? []).length;
                          return html`<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                            <span class="emr-badge emr-badge--neutral">Step ${sIdx + 1}</span>
                            <input
                              type="text"
                              class="emr-control"
                              style="width:140px;height:30px;min-height:30px;"
                              aria-label=${`Taper step ${sIdx + 1} period`}
                              .value=${tStep.periodLabel}
                              ?readonly=${locked}
                              placeholder="Days 1–7"
                              @input=${(e: Event) =>
                                this.emitIntent<PrescribingTableIntent>({
                                  type: 'taperStepChanged',
                                  rowId: row.id,
                                  stepId: tStep.id,
                                  periodLabel: (e.target as HTMLInputElement).value,
                                })}
                            />
                            <input
                              type="text"
                              class="emr-control"
                              style="width:200px;height:30px;min-height:30px;"
                              aria-label=${`Taper step ${sIdx + 1} frequency`}
                              .value=${tStep.frequencyLabel}
                              ?readonly=${locked}
                              placeholder="1 drop QID (1-1-1-1)"
                              @input=${(e: Event) =>
                                this.emitIntent<PrescribingTableIntent>({
                                  type: 'taperStepChanged',
                                  rowId: row.id,
                                  stepId: tStep.id,
                                  frequencyLabel: (e.target as HTMLInputElement).value,
                                })}
                            />
                            ${!locked
                              ? html`<div style="display:flex;gap:4px;">
                                  <button
                                    type="button"
                                    class="rx-icon-btn"
                                    aria-label=${`Add taper step after step ${sIdx + 1}`}
                                    @click=${() =>
                                      this.emitIntent<PrescribingTableIntent>({
                                        type: 'taperStepAddRequested',
                                        rowId: row.id,
                                        afterStepId: tStep.id,
                                      })}
                                  >
                                    ${renderEmrSvgIcon('plus', 12)}
                                  </button>
                                  <button
                                    type="button"
                                    class="rx-icon-btn rx-icon-btn--danger"
                                    ?disabled=${stepsLen <= 1}
                                    aria-label=${`Remove taper step ${sIdx + 1}`}
                                    @click=${() =>
                                      this.emitIntent<PrescribingTableIntent>({
                                        type: 'taperStepRemoveRequested',
                                        rowId: row.id,
                                        stepId: tStep.id,
                                      })}
                                  >
                                    ${renderEmrSvgIcon('minus', 12)}
                                  </button>
                                  <button
                                    type="button"
                                    class="rx-icon-btn"
                                    ?disabled=${sIdx === 0}
                                    aria-label=${`Move taper step ${sIdx + 1} up`}
                                    @click=${() =>
                                      this.emitIntent<PrescribingTableIntent>({
                                        type: 'taperStepMoveRequested',
                                        rowId: row.id,
                                        stepId: tStep.id,
                                        direction: 'up',
                                      })}
                                  >
                                    ${renderEmrSvgIcon('chevron-up', 12)}
                                  </button>
                                  <button
                                    type="button"
                                    class="rx-icon-btn"
                                    ?disabled=${sIdx === stepsLen - 1}
                                    aria-label=${`Move taper step ${sIdx + 1} down`}
                                    @click=${() =>
                                      this.emitIntent<PrescribingTableIntent>({
                                        type: 'taperStepMoveRequested',
                                        rowId: row.id,
                                        stepId: tStep.id,
                                        direction: 'down',
                                      })}
                                  >
                                    ${renderEmrSvgIcon('chevron-down', 12)}
                                  </button>
                                </div>`
                              : nothing}
                          </div>`;
                        })}
                      </div>
                    </td>
                  </tr>`
                : nothing}`;
            })}
          </tbody>
        </table>
      </div>
      <footer class="emr-header" style="padding:12px 16px;background:var(--emr-surface-soft,#f1f4f5);">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          ${!locked
            ? html`<button type="button" class="emr-btn emr-btn--secondary" @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'rowAddRequested' })}>+ Add medicine row</button>`
            : nothing}
          ${m.prescriberLabel ? html`<span class="emr-muted">Prescriber: ${m.prescriberLabel}</span>` : nothing}
          ${m.signedAtLabel ? html`<span class="emr-muted">Signed: ${m.signedAtLabel}</span>` : nothing}
          ${m.error ? html`<span role="alert" style="color:var(--emr-danger,#b42318);">${m.error}</span>` : nothing}
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          ${m.canAmend
            ? html`<button type="button" class="emr-btn emr-btn--secondary" @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'amendRequested' })}>Amend prescription</button>`
            : nothing}
          ${!m.readOnly && m.canSign
            ? html`<button type="button" class="emr-btn" @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'signRequested' })}>Sign prescription</button>`
            : nothing}
        </div>
      </footer>
    </section>`;
  }
}

export class EmrPacsViewerElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l4Styles];
  @property({ type: Object }) model?: PacsViewerViewModel;

  private request(intent: PacsViewerIntent): void {
    const model = this.model;
    if (!model || model.readOnly) return;
    if (intent.type === 'impressionPulledToNote') {
      const active = model.studies.find((study) => study.id === model.activeStudyId);
      if (active?.id !== intent.studyId || active.radiologistImpression !== intent.text) return;
    }
    this.emitIntent(intent);
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const active = m.studies.find((study) => study.id === m.activeStudyId);
    const comparison = m.layoutMode !== '1-up'
      ? m.studies.find((study) => study.id === m.compareStudyId && study.id !== active?.id)
      : undefined;
    return html`
      <section class="emr-card" style="padding:14px;display:grid;gap:10px;">
        <header style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="emr-badge emr-badge--info">DICOMweb PACS</span>
            <strong>${m.title ?? 'Multi-Viewport PACS & DICOMweb Compare Viewer'}</strong>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${(['1-up', '2-up-od-os', '2-up-compare'] as const).map(
              (mode) => html`<button type="button" class="emr-btn emr-btn--small ${m.layoutMode === mode ? 'emr-btn--primary' : ''}"
                ?disabled=${m.readOnly} @click=${() => this.request({ type: 'layoutModeChanged', layoutMode: mode })}>
                ${mode === '1-up' ? '▣ 1-Up Single' : mode === '2-up-od-os' ? '◫ 2-Up OD vs OS' : '⇄ 2-Up Active vs Prior'}
              </button>`,
            )}
            <button
              type="button"
              class="emr-btn emr-btn--small ${m.syncScroll ? 'emr-btn--primary' : ''}"
              ?disabled=${m.readOnly}
              aria-pressed=${Boolean(m.syncScroll)}
              @click=${() => this.request({ type: 'syncScrollToggled' })}
            >
              ⛓ Sync Scroll: ${m.syncScroll ? 'ON' : 'OFF'}
            </button>
          </div>
        </header>

        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${m.studies.map(
            (st) => html`<button type="button" class="emr-btn emr-btn--small ${st.id === active?.id ? 'emr-btn--primary' : ''}"
              ?disabled=${m.readOnly} @click=${() => this.request({ type: 'studySelected', studyId: st.id })}>
              [${st.modality}] ${st.bodyPart} (${st.accessionNumber})
            </button>`,
          )}
        </div>

        ${active
          ? html`
              <div style="padding:12px;border-radius:8px;background:#09111a;color:#e2e8f0;font-family:var(--emr-font-mono);display:grid;gap:8px;">
                <div style="display:flex;justify-content:space-between;flex-wrap:wrap;font-size:12px;color:#38bdf8;">
                  <strong>[${active.modality}] ${active.title} (${m.layoutMode.toUpperCase()})</strong>
                  <span>Slice ${active.currentSlice}/${active.sliceCount} · W/L: ${active.windowPreset} · Zoom: ${active.zoomPercent}%</span>
                </div>
                ${active.renderedFrameUrl
                  ? html`<img src=${active.renderedFrameUrl} alt=${active.title + ', slice ' + active.currentSlice} style="display:block;width:100%;object-fit:contain;">`
                  : html`<p>Study image unavailable</p>`}
                ${active.caliperMeasurementLabel
                  ? html`<div style="color:#f59e0b;font-size:12px;font-weight:700;">Caliper: ${active.caliperMeasurementLabel}</div>`
                  : nothing}
                ${active.keyFindings && active.keyFindings.length > 0
                  ? html`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                      ${active.keyFindings.map((kf) => html`<span class="emr-badge emr-badge--info">${kf}</span>`)}
                    </div>`
                  : nothing}
                <div style="font-size:12px;font-family:var(--emr-font-family);color:#cbd5e1;">${active.radiologistImpression}</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
                  <button type="button" class="emr-btn emr-btn--small" ?disabled=${m.readOnly} @click=${() => this.request({ type: 'sliceStepped', studyId: active.id, delta: -1 })}>− Slice</button>
                  <button type="button" class="emr-btn emr-btn--small" ?disabled=${m.readOnly} @click=${() => this.request({ type: 'sliceStepped', studyId: active.id, delta: 1 })}>+ Slice</button>
                  ${(['Retina/OCT', 'High-Contrast', 'Brain/Orbit', 'Bone'] as const).map(
                    (preset) => html`<button
                      type="button"
                      class="emr-btn emr-btn--small ${active.windowPreset === preset ? 'emr-btn--primary' : ''}"
                      ?disabled=${m.readOnly}
                      @click=${() => this.request({ type: 'windowPresetChanged', studyId: active.id, preset })}
                    >
                      W/L: ${preset}
                    </button>`,
                  )}
                  <button
                    type="button"
                    class="emr-btn emr-btn--small"
                    ?disabled=${m.readOnly}
                    @click=${() =>
                      this.request({
                        type: 'zoomChanged',
                        studyId: active.id,
                        zoomPercent: active.zoomPercent >= 200 ? 100 : active.zoomPercent + 50,
                      })}
                  >
                    🔍 Zoom ${active.zoomPercent}%
                  </button>
                  <button type="button" class="emr-btn emr-btn--small" ?disabled=${m.readOnly} @click=${() => this.request({ type: 'invertToggled', studyId: active.id })}>Invert LUT</button>
                  <button
                    type="button"
                    class="emr-btn emr-btn--small"
                    ?disabled=${m.readOnly}
                    @click=${() =>
                      this.request({
                        type: 'keyImagePinned',
                        studyId: active.id,
                        slice: active.currentSlice,
                        label: `${active.modality} Slice #${active.currentSlice} (${active.caliperMeasurementLabel || active.bodyPart})`,
                      })}
                  >
                    ☆ Pin Key Image
                  </button>
                  <button type="button" class="emr-btn emr-btn--small emr-btn--primary" ?disabled=${m.readOnly} @click=${() => this.request({ type: 'impressionPulledToNote', studyId: active.id, text: active.radiologistImpression })}>↳ Pull Impression to Note</button>
                </div>
              </div>
            `
          : nothing}
        ${m.pinnedKeyImages && m.pinnedKeyImages.length > 0
          ? html`<div part="pinned-key-images" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
              <span class="emr-label">Pinned Key Images:</span>
              ${m.pinnedKeyImages.map((img) => html`<span class="emr-badge emr-badge--info">★ ${img}</span>`)}
            </div>`
          : nothing}
        ${m.layoutMode !== '1-up' && active
          ? html`<div aria-label="Comparison study" style="padding:12px;border-radius:8px;background:var(--emr-surface-soft);">
              ${comparison ? html`<strong>[${comparison.modality}] ${comparison.title} (${comparison.dateLabel})</strong>
                <p>Slice ${comparison.currentSlice}/${comparison.sliceCount} · ${comparison.windowPreset} · ${comparison.zoomPercent}%</p>
                ${comparison.renderedFrameUrl
                  ? html`<img src=${comparison.renderedFrameUrl} alt=${comparison.title + ', slice ' + comparison.currentSlice} style="display:block;width:100%;object-fit:contain;">`
                  : html`<p>Comparison image unavailable</p>`}
                ${comparison.caliperMeasurementLabel ? html`<p>Caliper: ${comparison.caliperMeasurementLabel}</p>` : nothing}`
              : html`<p>Comparison study unavailable</p>`}
            </div>`
          : nothing}
      </section>
    `;
  }
}

export class EmrSpecialtyExamMatrixElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l4Styles];
  @property({ type: Object }) model?: SpecialtyExamMatrixViewModel;

  private editFinding(rowId: string, eye: 'od' | 'os', value: string): void {
    const model = this.model;
    if (model?.activeSpecialty !== 'ophthalmology' || model.readOnly) return;
    if (!model.ophthalmicRows.some((row) => row.id === rowId)) return;
    this.emitIntent<SpecialtyExamMatrixIntent>({ type: 'ophthalmicCellChanged', rowId, eye, value });
  }

  private stepWeight(delta: number): void {
    const model = this.model;
    if (!model || model.readOnly || model.activeSpecialty !== 'pediatrics') return;
    const weightKg = model.pediatrics.weightKg + delta;
    if (Number.isFinite(weightKg) && weightKg > 0) this.emitIntent<SpecialtyExamMatrixIntent>({ type: 'pediatricWeightChanged', weightKg });
  }

  private toggleRegion(regionId: string): void {
    const model = this.model;
    if (!model || model.readOnly || model.activeSpecialty !== 'dermatology' || !model.dermatology.regions.some((region) => region.id === regionId)) return;
    this.emitIntent<SpecialtyExamMatrixIntent>({ type: 'dermRegionToggled', regionId });
  }

  private setDoseLevel(percent: 100 | 80 | 75 | 50): void {
    const model = this.model;
    if (!model || model.readOnly || model.activeSpecialty !== 'oncology' || ![100, 80, 75, 50].includes(percent)) return;
    this.emitIntent<SpecialtyExamMatrixIntent>({ type: 'oncologyDoseReductionChanged', percent });
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`
      <section class="emr-card" style="padding:14px;display:grid;gap:10px;">
        <header style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="emr-badge emr-badge--info">SPECIALTY EXAM</span>
            <strong>${m.title ?? 'Multi-Specialty Examination & Dosing Matrix'}</strong>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${(['ophthalmology', 'pediatrics', 'dermatology', 'oncology'] as const).map(
              (sp) => html`<button type="button" class="emr-btn emr-btn--small ${m.activeSpecialty === sp ? 'emr-btn--primary' : ''}"
                @click=${() => this.emitIntent<SpecialtyExamMatrixIntent>({ type: 'specialtyChanged', specialty: sp })}>
                ${sp.toUpperCase()}
              </button>`,
            )}
          </div>
        </header>

        ${m.activeSpecialty === 'ophthalmology'
          ? html`
              <div style="display:flex;gap:6px;">
                <button type="button" class="emr-btn emr-btn--small" ?disabled=${m.readOnly} @click=${() => {
                  if (this.model?.activeSpecialty === 'ophthalmology' && !this.model.readOnly) {
                    this.emitIntent<SpecialtyExamMatrixIntent>({ type: 'ophthalmicApplyWnlAll' });
                  }
                }}>✓ All WNL (OU)</button>
                <button type="button" class="emr-btn emr-btn--small" ?disabled=${m.readOnly} @click=${() => {
                  if (this.model?.activeSpecialty === 'ophthalmology' && !this.model.readOnly) {
                    this.emitIntent<SpecialtyExamMatrixIntent>({ type: 'ophthalmicCopyOdToOs' });
                  }
                }}>⇄ Copy OD → OS</button>
              </div>
              <div style="overflow-x:auto;">
                <table class="rx-grid" style="min-width:520px;">
                  <caption>Slit lamp, tonometry and fundus findings</caption>
                  <thead><tr><th scope="col">Ocular structure</th><th scope="col">Right eye (OD)</th><th scope="col">Left eye (OS)</th></tr></thead>
                  <tbody>
                    ${repeat(m.ophthalmicRows, (row) => row.id, (row) => html`<tr>
                      <th scope="row">
                        <strong>${row.structureLabel}</strong>
                        <div class="emr-muted">${row.segment}</div>
                      </th>
                      ${(['od', 'os'] as const).map((eye) => {
                        const value = eye === 'od' ? row.odValue : row.osValue;
                        const label = eye === 'od' ? 'Right eye (OD)' : 'Left eye (OS)';
                        return html`<td><input
                          type="text"
                          class="emr-control"
                          aria-label=${row.structureLabel + ', ' + label}
                          .value=${m.readOnly ? live(value) : value}
                          ?readonly=${m.readOnly}
                          @input=${(event: Event) => this.editFinding(row.id, eye, (event.currentTarget as HTMLInputElement).value)}
                          @blur=${(event: Event) => {
                            const current = this.model?.ophthalmicRows.find((item) => item.id === row.id);
                            if (current) (event.currentTarget as HTMLInputElement).value = eye === 'od' ? current.odValue : current.osValue;
                          }}
                        />${row.quickChips.map((chip) => html`<button type="button" class="emr-btn emr-btn--small" ?disabled=${m.readOnly} @click=${() => {
                          const current = this.model?.ophthalmicRows.find((item) => item.id === row.id);
                          if (current?.quickChips.includes(chip)) this.editFinding(row.id, eye, chip);
                        }}>${chip}</button>`)}</td>`;
                      })}
                    </tr>`)}
                  </tbody>
                </table>
              </div>
            `
          : m.activeSpecialty === 'pediatrics'
            ? html`<div style="display:grid;gap:8px;">
                <div>Weight: ${m.pediatrics.weightKg} kg (${m.pediatrics.weightCentileLabel}) · Height: ${m.pediatrics.heightCm} cm (${m.pediatrics.heightCentileLabel})${m.pediatrics.bsaM2 ? html` · BSA: ${m.pediatrics.bsaM2} m²` : nothing}</div>
                <div>${([-1, 1] as const).map((delta) => html`<button type="button" class="emr-btn emr-btn--small" ?disabled=${m.readOnly || !Number.isFinite(m.pediatrics.weightKg + delta) || m.pediatrics.weightKg + delta <= 0} @click=${() => this.stepWeight(delta)}>${delta < 0 ? '−' : '+'} 1 kg</button>`)}</div>
                <div>${m.pediatrics.targetDrugLabel} (${m.pediatrics.concentrationMgPer5Ml} mg / 5 mL) · ${m.pediatrics.mgPerKgPerDose} mg/kg/dose · ${m.pediatrics.calculatedMgPerDose} mg (${m.pediatrics.calculatedMlPerDose} mL) · ${m.pediatrics.maxDailyMgLabel}</div>
              </div>`
            : m.activeSpecialty === 'dermatology'
              ? html`<div style="display:grid;gap:8px;">
                  <div>Morphology: ${m.dermatology.morphologyLabel}</div>
                  <div>${m.dermatology.regions.map((region) => html`<button type="button" class="emr-btn emr-btn--small" ?disabled=${m.readOnly} aria-pressed=${region.active} @click=${() => this.toggleRegion(region.id)}>${region.regionLabel} (${region.bsaPercent}% BSA · ${region.ftuPerDose} FTU)</button>`)}</div>
                  <div>Affected BSA: ${m.dermatology.totalBsaPercent}% · Single application: ${m.dermatology.totalFtuPerApp} FTU ${m.dermatology.totalGramsPerApp != null ? html`(${m.dermatology.totalGramsPerApp} g)` : nothing} · 14d BD: ${m.dermatology.totalGramsFor14DaysBd} g</div>
                </div>`
              : html`<div style="display:grid;gap:8px;">
                  <div><strong>${m.oncology.regimenName}</strong> · Cycle ${m.oncology.cycleNumber} (${m.oncology.cycleDayLabel}) · BSA: ${m.oncology.bsaM2} m² · ECOG: ${m.oncology.ecogScore} · ANC: ${m.oncology.ancCountLabel} · Platelets: ${m.oncology.plateletCountLabel}</div>
                  ${m.oncology.safetyGateBadge ? html`<span class="emr-badge emr-badge--${m.oncology.safetyGateBadge.tone}">${m.oncology.safetyGateBadge.label}</span>` : nothing}
                  <div>Dose level: ${([100, 80, 75, 50] as const).map((percent) => html`<button type="button" class="emr-btn emr-btn--small" ?disabled=${m.readOnly} aria-pressed=${m.oncology.doseReductionPercent === percent} @click=${() => this.setDoseLevel(percent)}>${percent}%</button>`)}</div>
                  ${m.oncology.agents.map((agent) => html`<div>${agent.drugName} · ${agent.standardMgPerM2} mg/m² · ${agent.routeLabel} · ${agent.calculatedDoseMg} mg</div>`)}
                </div>`}
      </section>
    `;
  }
}

export class EmrInpatientMarElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l4Styles];
  @property({ type: Object }) model?: InpatientMarViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`
      <section class="emr-card" style="padding:14px;display:grid;gap:10px;">
        <header style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <strong>${m.title ?? 'Inpatient eMAR & Nursing Kardex'}</strong>
            <div class="emr-muted" style="font-size:var(--emr-text-xs);font-family:var(--emr-font-mono);">${m.wardBedLabel} · ${m.shiftLabel} · Nurse: ${m.nurseLabel}</div>
          </div>
        </header>
        <div style="overflow-x:auto;">
          <table class="rx-grid" style="min-width:740px;">
            <thead>
              <tr>
                <th>Ordered Medication (Form &amp; Route)</th>
                ${m.timeColumns.map((c) => html`<th>${c.timeLabel} (${c.slotLabel})</th>`)}
              </tr>
            </thead>
            <tbody>
              ${m.orders.map(
                (ord) => html`<tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      ${ord.stepLabel ? html`<span class="emr-badge emr-badge--info">${ord.stepLabel}</span>` : nothing}
                      <strong>${ord.drugName} ${ord.strength}</strong>
                      ${ord.highAlert
                        ? html`<span class="emr-badge emr-badge--danger">HIGH-ALERT · DUAL SIGN</span>`
                        : nothing}
                    </div>
                    <div class="emr-muted" style="font-size:var(--emr-text-2xs);font-family:var(--emr-font-mono);">
                      Form: ${ord.formLabel} · ${ord.doseLabel} · ${ord.frequencyCode} · ${ord.routeLabel}
                    </div>
                    ${ord.highAlert
                      ? html`<div style="margin-top:4px;">
                          <button
                            type="button"
                            class="emr-btn emr-btn--small ${ord.dualSignVerified ? 'emr-btn--secondary' : ''}"
                            ?disabled=${m.readOnly}
                            aria-pressed=${Boolean(ord.dualSignVerified)}
                            @click=${() => {
                              if (this.model?.readOnly) return;
                              this.emitIntent<InpatientMarIntent>({ type: 'dualSignVerified', orderId: ord.id });
                            }}
                          >
                            ${ord.dualSignVerified ? '✓ 2-RN Co-Signed' : '! Require 2nd RN Co-Sign'}
                          </button>
                        </div>`
                      : nothing}
                  </td>
                  ${m.timeColumns.map((col) => {
                    const adm = ord.administrations.find((a) => a.slotId === col.id);
                    const st = adm?.status ?? 'not-due';
                    return html`<td>
                      <button type="button" class="emr-btn emr-btn--small ${st === 'given' ? 'emr-btn--primary' : ''}"
                        ?disabled=${m.readOnly || st === 'not-due'}
                        @click=${() => {
                          if (this.model?.readOnly || st === 'not-due') return;
                          this.emitIntent<InpatientMarIntent>({ type: 'slotStatusCycled', orderId: ord.id, slotId: col.id });
                        }}>
                        ${st.toUpperCase()}
                      </button>
                      ${st === 'given' && adm?.bcmaScanned
                        ? html`<span class="emr-badge emr-badge--success">BCMA Barcode Verified</span>`
                        : nothing}
                      ${adm?.administeredAtLabel
                        ? html`<div class="emr-muted" style="font-size:10px;font-family:var(--emr-font-mono);">${adm.administeredAtLabel}</div>`
                        : nothing}
                      ${adm?.holdReason
                        ? html`<div style="font-size:10px;color:var(--emr-warning,#b54708);">Hold: ${adm.holdReason}</div>`
                        : nothing}
                    </td>`;
                  })}
                </tr>`,
              )}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }
}

export class EmrEncounterSummaryPrintElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l4Styles, css`
    @media print { .print-toolbar { display: none; } .rx-grid { min-width: 0; } }
    :host-context(.emr-print) .print-toolbar { display: none; }
    :host-context(.emr-print) .rx-grid { min-width: 0; }
  `];
  @property({ type: Object }) model?: EncounterSummaryPrintViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`
      <article class="emr-card" style="padding:16px;display:grid;gap:12px;">
        <nav class="print-toolbar" aria-label="Document actions">
          <button type="button" class="emr-btn" aria-pressed=${m.documentMode === 'opd-rx'} @click=${() => this.emitIntent<EncounterSummaryPrintIntent>({ type: 'documentModeChanged', mode: 'opd-rx' })}>OPD prescription</button>
          <button type="button" class="emr-btn" aria-pressed=${m.documentMode === 'ipd-discharge'} @click=${() => this.emitIntent<EncounterSummaryPrintIntent>({ type: 'documentModeChanged', mode: 'ipd-discharge' })}>IPD discharge summary</button>
          <button type="button" class="emr-btn" @click=${() => this.emitIntent<EncounterSummaryPrintIntent>({ type: 'printTriggered' })}>Print</button>
        </nav>
        <header><h3>${m.facilityName} — ${m.facilityDepartment}</h3><p>${m.documentMode === 'opd-rx' ? 'OPD prescription' : 'IPD discharge summary'}</p></header>
        <p>Patient: ${m.patientName} (${m.patientAgeSex}) · Encounter: ${m.encounterId} · ${m.encounterDateLabel} · ${m.careSettingLabel}</p>
        <p>${m.patientIdentifiers.map(i => html`<span>${i.label}: ${i.value} </span>`)}</p>
        <section><h4>Allergies</h4><p>${m.allergiesSummary.join(', ')}</p></section>
        <section><h4>Chronic conditions</h4><p>${m.chronicConditionsSummary.join(', ')}</p></section>
        <section><h4>Vitals</h4>${m.vitalsSummary.map(v => html`<p>${v.label}: ${v.value}</p>`)}</section>
        <section><h4>Diagnoses</h4>${m.diagnoses.map(d => html`<p>${d.label} · ${d.code} · ${d.status} ${d.laterality ?? ''} ${d.onsetLabel ?? ''}</p>`)}</section>
        <section><h4>History</h4>${m.historySummary.map(h => html`<p>${h.code}: ${h.value}</p>`)}</section>
        <section><h4>Examination</h4>${m.examinationSummary.map(e => html`<p>${e.code}: ${e.value}</p>`)}</section>
        <section><h4>Imaging findings</h4>${m.pacsKeyFindingsSummary.map(f => html`<p>${f}</p>`)}</section>
        <section><h4>Prescriptions</h4><table class="rx-grid"><thead><tr><th scope="col">Drug &amp; form</th><th scope="col">Dose</th><th scope="col">Frequency</th><th scope="col">Route/site</th><th scope="col">Duration &amp; dispense</th><th scope="col">Instructions</th></tr></thead><tbody>
          ${m.prescriptions.map(rx => html`<tr><td>${rx.drugName} ${rx.strength} ${rx.formLabel} ${rx.formularyCode ?? ''} ${rx.stepLabel ?? ''}</td><td>${rx.doseQtyUnit}</td><td>${rx.frequencyPattern}</td><td>${rx.routeSite}</td><td>${rx.durationLabel} ${rx.dispenseTotalLabel ?? ''}</td><td>${rx.instructions}</td></tr>`)}
        </tbody></table></section>
        <section><h4>Investigations</h4>${m.investigations.map(i => html`<p>${i.name} · ${i.code} · ${i.category} · ${i.priority} · ${i.status} · ${i.indication}</p>`)}</section>
        <section><h4>Treatment advice</h4>${m.treatmentAdvises.map(a => html`<p>${a}</p>`)}</section>
        <section><h4>Cross-consultations</h4>${m.crossConsultations.map(c => html`<p>${c.targetSpecialty} · ${c.targetConsultant} · ${c.careSetting} · ${c.urgency} · ${c.status} · ${c.locationOrClinic}<br>Reason: ${c.reasonForConsult}<br>Question: ${c.clinicalQuestion}<br>${c.consultantReply ?? ''}</p>`)}</section>
        <section><h4>Follow-up</h4><p>${m.followUpDateLabel}</p></section>
        <footer>${m.prescriberName} · ${m.prescriberRegNo} ${m.signedAtLabel ?? ''}</footer>
      </article>`;
  }
}

export * from './l4-ophthalmology-glaucoma-motility.js';
export * from './l4-ophthalmology-cataract-retina-cornea.js';
export * from './l4-hospital-operations.js';
export * from './l4-acute-lab-perioperative.js';
export * from './l4-maternal-peds-specialty-abdm.js';
import { registerL4OphthalmologyGlaucomaMotilityElements } from './l4-ophthalmology-glaucoma-motility.js';
import { registerL4OphthalmologyCataractRetinaCorneaElements } from './l4-ophthalmology-cataract-retina-cornea.js';
import { registerL4HospitalOperationsElements } from './l4-hospital-operations.js';
import { registerL4AcuteLabPerioperativeElements } from './l4-acute-lab-perioperative.js';
import { registerL4MaternalPedsSpecialtyAbdmElements } from './l4-maternal-peds-specialty-abdm.js';

export function registerL4Elements(): void {
  registerL3Elements();
  registerL4ClinicalElements();
  registerL4OperationsElements();
  registerL4PrivacyIdentityElements();
  registerL4MobileChartsElements();
  registerL4ObservationElements();
  registerL4ClinicalNoteElements();
  registerL4OphthalmologyGlaucomaMotilityElements();
  registerL4OphthalmologyCataractRetinaCorneaElements();
  registerL4HospitalOperationsElements();
  registerL4AcuteLabPerioperativeElements();
  registerL4MaternalPedsSpecialtyAbdmElements();
  defineEmrElement('emr-medication-list', EmrMedicationListElement);
  defineEmrElement('emr-allergy-list', EmrAllergyListElement);
  defineEmrElement('emr-chronic-disease-list', EmrChronicDiseaseListElement);
  defineEmrElement('emr-personal-history-list', EmrPersonalHistoryListElement);
  defineEmrElement('emr-patient-banner', EmrPatientBannerElement);
  defineEmrElement('emr-dose-schedule', EmrDoseScheduleElement);
  defineEmrElement('emr-prescribing-table', EmrPrescribingTableElement);
  defineEmrElement('emr-score-result-card', EmrScoreResultCardElement);
  defineEmrElement('emr-pacs-viewer', EmrPacsViewerElement);
  defineEmrElement('emr-specialty-exam-matrix', EmrSpecialtyExamMatrixElement);
  defineEmrElement('emr-inpatient-mar', EmrInpatientMarElement);
  defineEmrElement('emr-encounter-summary-print', EmrEncounterSummaryPrintElement);
}
