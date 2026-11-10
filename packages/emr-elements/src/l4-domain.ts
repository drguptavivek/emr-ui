import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import type {
  DoseScheduleIntent,
  DoseScheduleViewModel,
  PatientBannerIntent,
  PatientBannerViewModel,
  PrescribingRow,
  PrescribingTableIntent,
  PrescribingTableViewModel,
  ScoreResultCardIntent,
  ScoreResultCardViewModel,
} from '@drguptavivek/emr-controller';
import { EmrLitElement, defineEmrElement, emrShadowStyles } from './foundations.js';
import { renderEmrSvgIcon } from './icons.js';
import { EmrClinicalListElement } from './l3-structures.js';

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

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const primaryId = m.identifiers[0]?.value ?? m.patientId;
    return html`<section class="emr-card" part="banner">
      <div class="emr-header">
        <div>
          <h2 class="emr-title">${m.displayName}</h2>
          <p class="emr-muted">${primaryId} · ${m.ageLabel} · ${m.sexLabel} · ${m.careSettingLabel} (${m.locationLabel})</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          ${m.criticality ? html`<emr-badge .badge=${m.criticality}></emr-badge>` : nothing}
          ${m.allergyStatus ? html`<emr-badge .badge=${m.allergyStatus}></emr-badge>` : nothing}
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
    </section>`;
  }
}

export class EmrDoseScheduleElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l4Styles];
  @property({ attribute: false }) model?: DoseScheduleViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const pattern = m.slots.map((s) => s.amount ?? 0).join(' - ');
    return html`<section class="emr-card" part="dose-schedule">
      <div class="emr-header">
        <div>
          <span class="emr-muted">${m.medication.formLabel}</span>
          <h3 class="emr-title">${m.medication.label} ${m.medication.strength ?? ''}</h3>
        </div>
        ${m.status ? html`<emr-badge .badge=${m.status}></emr-badge>` : nothing}
      </div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <strong>${m.frequency.label}</strong>
        ${m.slots.length ? html`<span class="emr-badge">${pattern}</span>` : nothing}
        ${m.duration ? html`<span class="emr-muted">Duration: ${m.duration}</span>` : nothing}
      </div>
      ${!m.readOnly && m.canEdit
        ? html`<div><button type="button" class="emr-btn emr-btn--secondary" @click=${() => this.emitIntent<DoseScheduleIntent>({ type: 'editRequested' })}>Edit schedule</button></div>`
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
    return html`<section class="emr-card">
      <div class="emr-header">
        <h3 class="emr-title">${m.instrumentLabel}</h3>
        ${m.result
          ? html`<span class="emr-badge emr-badge--${m.result.bandTone ?? 'neutral'}">${m.result.total} · ${m.result.bandLabel ?? ''}</span>`
          : nothing}
      </div>
      ${m.result?.interpretation ? html`<p class="emr-muted">${m.result.interpretation}</p>` : nothing}
      ${m.canRecompute
        ? html`<div><button type="button" class="emr-btn emr-btn--secondary" @click=${() => this.emitIntent<ScoreResultCardIntent>({ type: 'recomputeRequested', instrumentId: m.id })}>Recompute</button></div>`
        : nothing}
    </section>`;
  }
}

export class EmrPrescribingTableElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l4Styles];
  @property({ attribute: false }) model?: PrescribingTableViewModel;

  private formatAmt(row: PrescribingRow, slotId: string): string {
    const n = row.slots.find((s) => s.id === slotId)?.amount ?? 0;
    if (n <= 0) return '0';
    if (n === 0.5) return '½';
    return String(n);
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
        ${m.status ? html`<emr-badge .badge=${m.status}></emr-badge>` : nothing}
      </header>
      <div style="overflow-x:auto;">
        <table class="rx-grid">
          <thead>
            <tr>
              <th>Drug Name &amp; Strength</th>
              <th>Dose (M – A – E – N)</th>
              <th>Frequency</th>
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
              const step = row.form === 'tablet' ? 0.5 : 1;
              return html`<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <strong>#${idx + 1}</strong>
                    <input class="emr-control" style="height:34px;min-height:34px;" .value=${row.drugName} ?readonly=${locked} placeholder="Medicine…"
                      @input=${(e: Event) => this.emitIntent<PrescribingTableIntent>({ type: 'drugNameChanged', rowId: row.id, drugName: (e.target as HTMLInputElement).value })} />
                    <input class="emr-control" style="width:84px;height:34px;min-height:34px;" .value=${row.strength} ?readonly=${locked} placeholder="500 mg"
                      @input=${(e: Event) => this.emitIntent<PrescribingTableIntent>({ type: 'strengthChanged', rowId: row.id, strength: (e.target as HTMLInputElement).value })} />
                  </div>
                </td>
                <td>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${m.slotDefinitions.map(
                      (def) => html`<div style="display:grid;gap:2px;">
                        <span class="emr-muted" style="font-size:11px;">${def.shortLabel ?? def.label}</span>
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
                </td>
                <td>
                  <span style="font-family:var(--emr-font-mono);font-size:12px;font-weight:700;">${row.frequencyCode} ${row.patternLabel ? `(${row.patternLabel})` : ''}</span>
                </td>
                <td>
                  <span style="font-size:12px;">${row.route}${row.site ? ` · ${row.site.toUpperCase()}` : ''}</span>
                </td>
                <td>
                  <div class="rx-mini-stepper">
                    ${!locked
                      ? html`<button type="button" class="rx-mini-btn" @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'durationStepped', rowId: row.id, delta: -1 })}>${renderEmrSvgIcon('minus', 12)}</button>`
                      : nothing}
                    <span class="rx-mini-val">${row.durationCount ?? '—'} ${row.durationUnit}</span>
                    ${!locked
                      ? html`<button type="button" class="rx-mini-btn" @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'durationStepped', rowId: row.id, delta: 1 })}>${renderEmrSvgIcon('plus', 12)}</button>`
                      : nothing}
                  </div>
                </td>
                <td>
                  <input class="emr-control" style="height:34px;min-height:34px;" .value=${row.instructions} ?readonly=${locked} placeholder="Spcl instructions…"
                    @input=${(e: Event) => this.emitIntent<PrescribingTableIntent>({ type: 'instructionsChanged', rowId: row.id, instructions: (e.target as HTMLInputElement).value })} />
                </td>
                <td>
                  ${!locked
                    ? html`<div style="display:flex;gap:4px;">
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
                      </div>`
                    : nothing}
                </td>
              </tr>`;
            })}
          </tbody>
        </table>
      </div>
      <footer class="emr-header" style="padding:12px 16px;background:var(--emr-surface-soft,#f1f4f5);">
        ${!locked
          ? html`<button type="button" class="emr-btn emr-btn--secondary" @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'rowAddRequested' })}>+ Add medicine row</button>`
          : nothing}
        ${!m.readOnly && m.canSign
          ? html`<button type="button" class="emr-btn" @click=${() => this.emitIntent<PrescribingTableIntent>({ type: 'signRequested' })}>Sign prescription</button>`
          : nothing}
      </footer>
    </section>`;
  }
}

/**
 * Controlled generic L4 surface element base for all remaining domain surfaces.
 * Accepts immutable `model` and `headingId` properties and dispatches typed `intent` CustomEvents.
 */
export class EmrControlledDomainElement<TModel = Record<string, unknown>, TIntent = unknown> extends EmrLitElement {
  static override styles = [emrShadowStyles, l4Styles];
  @property({ attribute: false }) model?: TModel;
  @property({ type: String }) headingId = '';
  protected surfaceTitle = 'Clinical Surface';

  override render() {
    const m = (this.model ?? {}) as Record<string, unknown>;
    const title = (typeof m['title'] === 'string' && m['title']) || (typeof m['displayName'] === 'string' && m['displayName']) || this.surfaceTitle;
    return html`<section class="emr-card" part="surface" aria-labelledby=${this.headingId || nothing}>
      <header class="emr-header">
        <h3 class="emr-title" id=${this.headingId || nothing}>${title}</h3>
      </header>
      <slot></slot>
    </section>`;
  }
}

export class EmrPatientListElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Patient List'; }
export class EmrTimelineElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Encounter Timeline'; }
export class EmrAppShellElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Application Shell'; }
export class EmrLeftNavElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Primary Navigation'; }
export class EmrRightFlyoutElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Right Flyout Panel'; }
export class EmrStagedChecklistElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Staged Safety Checklist'; }
export class EmrPacChecklistElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Pre-Anaesthesia Checklist'; }
export class EmrFamilyPedigreeElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Family Pedigree'; }
export class EmrDocumentUploadQueueElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Document Upload Queue'; }
export class EmrPatientDocumentsElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Patient Documents'; }
export class EmrDocumentViewerElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Document Viewer'; }
export class EmrHierarchyOrderPickerElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Hierarchy Order Picker'; }
export class EmrOrderDetailsElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Order Details'; }
export class EmrFavouritesPanelElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Favourites Panel'; }
export class EmrClinicalAnnotationCanvasElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Clinical Annotation Canvas'; }
export class EmrDiagnosticResultSummaryElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Diagnostic Result Summary'; }
export class EmrSpectaclePrescriptionElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Spectacle Prescription'; }
export class EmrOctFindingRecordElement extends EmrControlledDomainElement { protected override surfaceTitle = 'OCT Finding Record'; }
export class EmrMeridianCrossElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Meridian Cross'; }
export class EmrOcularMotilityChartElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Ocular Motility Chart'; }
export class EmrObservationFlowsheetElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Observation Flowsheet'; }
export class EmrObservationTrendElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Observation Trend'; }
export class EmrClinicalTranscriptElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Clinical Transcript'; }
export class EmrEvidenceSuggestionListElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Evidence Suggestion List'; }
export class EmrCaptureStatusBarElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Capture Status Bar'; }
export class EmrMedicationReconciliationElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Medication Reconciliation'; }
export class EmrWorkQueueElement extends EmrControlledDomainElement { protected override surfaceTitle = 'OPD Work Queue'; }
export class EmrConsentCaptureElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Consent Capture'; }
export class EmrConsentReviewElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Consent Review'; }
export class EmrConsentReceiptElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Consent Receipt'; }
export class EmrConsentStatusBadgeElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Consent Status Badge'; }
export class EmrSharingGrantsElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Data Sharing Grants'; }
export class EmrAccessLogElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Access Log'; }
export class EmrRightsRequestsElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Rights Requests'; }
export class EmrPrivacyCentreElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Privacy Centre'; }
export class EmrPatientIdentityCardElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Patient Identity Card'; }
export class EmrIdentifierCheckPromptElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Identifier Check Prompt'; }
export class EmrLinkCardsElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Link Cards'; }
export class EmrContactAttemptFormElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Contact Attempt Form'; }
export class EmrContactAttemptSummaryElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Contact Attempt Summary'; }
export class EmrMergeCompareElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Merge Compare'; }
export class EmrDraftRecordListElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Draft Record List'; }
export class EmrArrivalLinkerElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Arrival Linker'; }
export class EmrSpectacleDeliveryElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Spectacle Delivery'; }
export class EmrBookedNotDeliveredListElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Booked Not Delivered List'; }
export class EmrCataractEpisodeCardElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Cataract Episode Card'; }
export class EmrPatientHistoryTimelineElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Patient History Timeline'; }
export class EmrRecordDiffElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Record Diff'; }
export class EmrUploadQueueElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Upload Queue'; }
export class EmrBarChartElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Bar Chart'; }
export class EmrFunnelChartElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Funnel Chart'; }
export class EmrPinPadElement extends EmrControlledDomainElement { protected override surfaceTitle = 'PIN Pad'; }
export class EmrLoginFormElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Login Form'; }
export class EmrBottomTabBarElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Bottom Tab Bar'; }
export class EmrSyncPillElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Sync Status Pill'; }
export class EmrToastElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Toast Notification'; }
export class EmrSheetElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Modal Sheet'; }
export class EmrTopBarSearchElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Top Bar Search'; }
export class EmrTopBarElement extends EmrControlledDomainElement { protected override surfaceTitle = 'Application Top Bar'; }

export function registerL4Elements(): void {
  defineEmrElement('emr-medication-list', EmrMedicationListElement);
  defineEmrElement('emr-allergy-list', EmrAllergyListElement);
  defineEmrElement('emr-chronic-disease-list', EmrChronicDiseaseListElement);
  defineEmrElement('emr-personal-history-list', EmrPersonalHistoryListElement);
  defineEmrElement('emr-patient-banner', EmrPatientBannerElement);
  defineEmrElement('emr-patient-list', EmrPatientListElement);
  defineEmrElement('emr-timeline', EmrTimelineElement);
  defineEmrElement('emr-app-shell', EmrAppShellElement);
  defineEmrElement('emr-left-nav', EmrLeftNavElement);
  defineEmrElement('emr-right-flyout', EmrRightFlyoutElement);
  defineEmrElement('emr-staged-checklist', EmrStagedChecklistElement);
  defineEmrElement('emr-pac-checklist', EmrPacChecklistElement);
  defineEmrElement('emr-family-pedigree', EmrFamilyPedigreeElement);
  defineEmrElement('emr-document-upload-queue', EmrDocumentUploadQueueElement);
  defineEmrElement('emr-patient-documents', EmrPatientDocumentsElement);
  defineEmrElement('emr-document-viewer', EmrDocumentViewerElement);
  defineEmrElement('emr-hierarchy-order-picker', EmrHierarchyOrderPickerElement);
  defineEmrElement('emr-order-details', EmrOrderDetailsElement);
  defineEmrElement('emr-favourites-panel', EmrFavouritesPanelElement);
  defineEmrElement('emr-clinical-annotation-canvas', EmrClinicalAnnotationCanvasElement);
  defineEmrElement('emr-diagnostic-result-summary', EmrDiagnosticResultSummaryElement);
  defineEmrElement('emr-spectacle-prescription', EmrSpectaclePrescriptionElement);
  defineEmrElement('emr-dose-schedule', EmrDoseScheduleElement);
  defineEmrElement('emr-prescribing-table', EmrPrescribingTableElement);
  defineEmrElement('emr-oct-finding-record', EmrOctFindingRecordElement);
  defineEmrElement('emr-meridian-cross', EmrMeridianCrossElement);
  defineEmrElement('emr-ocular-motility-chart', EmrOcularMotilityChartElement);
  defineEmrElement('emr-observation-flowsheet', EmrObservationFlowsheetElement);
  defineEmrElement('emr-observation-trend', EmrObservationTrendElement);
  defineEmrElement('emr-clinical-transcript', EmrClinicalTranscriptElement);
  defineEmrElement('emr-evidence-suggestion-list', EmrEvidenceSuggestionListElement);
  defineEmrElement('emr-capture-status-bar', EmrCaptureStatusBarElement);
  defineEmrElement('emr-score-result-card', EmrScoreResultCardElement);
  defineEmrElement('emr-medication-reconciliation', EmrMedicationReconciliationElement);
  defineEmrElement('emr-work-queue', EmrWorkQueueElement);
  defineEmrElement('emr-consent-capture', EmrConsentCaptureElement);
  defineEmrElement('emr-consent-review', EmrConsentReviewElement);
  defineEmrElement('emr-consent-receipt', EmrConsentReceiptElement);
  defineEmrElement('emr-consent-status-badge', EmrConsentStatusBadgeElement);
  defineEmrElement('emr-sharing-grants', EmrSharingGrantsElement);
  defineEmrElement('emr-access-log', EmrAccessLogElement);
  defineEmrElement('emr-rights-requests', EmrRightsRequestsElement);
  defineEmrElement('emr-privacy-centre', EmrPrivacyCentreElement);
  defineEmrElement('emr-patient-identity-card', EmrPatientIdentityCardElement);
  defineEmrElement('emr-identifier-check-prompt', EmrIdentifierCheckPromptElement);
  defineEmrElement('emr-link-cards', EmrLinkCardsElement);
  defineEmrElement('emr-contact-attempt-form', EmrContactAttemptFormElement);
  defineEmrElement('emr-contact-attempt-summary', EmrContactAttemptSummaryElement);
  defineEmrElement('emr-merge-compare', EmrMergeCompareElement);
  defineEmrElement('emr-draft-record-list', EmrDraftRecordListElement);
  defineEmrElement('emr-arrival-linker', EmrArrivalLinkerElement);
  defineEmrElement('emr-spectacle-delivery', EmrSpectacleDeliveryElement);
  defineEmrElement('emr-booked-not-delivered-list', EmrBookedNotDeliveredListElement);
  defineEmrElement('emr-cataract-episode-card', EmrCataractEpisodeCardElement);
  defineEmrElement('emr-patient-history-timeline', EmrPatientHistoryTimelineElement);
  defineEmrElement('emr-record-diff', EmrRecordDiffElement);
  defineEmrElement('emr-upload-queue', EmrUploadQueueElement);
  defineEmrElement('emr-bar-chart', EmrBarChartElement);
  defineEmrElement('emr-funnel-chart', EmrFunnelChartElement);
  defineEmrElement('emr-pin-pad', EmrPinPadElement);
  defineEmrElement('emr-login-form', EmrLoginFormElement);
  defineEmrElement('emr-bottom-tab-bar', EmrBottomTabBarElement);
  defineEmrElement('emr-sync-pill', EmrSyncPillElement);
  defineEmrElement('emr-toast', EmrToastElement);
  defineEmrElement('emr-sheet', EmrSheetElement);
  defineEmrElement('emr-top-bar-search', EmrTopBarSearchElement);
  defineEmrElement('emr-top-bar', EmrTopBarElement);
}
