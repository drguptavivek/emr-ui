import { css, html, nothing } from 'lit';
import type { ClinicalAssessmentStatus, EmrBadge, EmrTone } from '@drguptavivek/emr-controller';
import { EmrModelElement } from './controlled-rendering.js';
import { defineEmrElement, emrShadowStyles } from './foundations.js';

export type { ClinicalAssessmentStatus, EmrBadge, EmrTone };

// ===========================================================================
// Shared ViewModels, Intents & Pure Helpers (Acute Care, Lab & Perioperative)
// ===========================================================================

export type EdEsiAcuityLevel = 1 | 2 | 3 | 4 | 5;

export type EdDispositionState =
  | 'triaged'
  | 'in-assessment'
  | 'boarding-admit'
  | 'ready-discharge';

export const ED_ESI_LEVELS: readonly EdEsiAcuityLevel[] = [1, 2, 3, 4, 5];

export const ED_ACUITY_FILTERS: readonly ('all' | EdEsiAcuityLevel)[] = ['all', 1, 2, 3, 4, 5];

export const ED_DISPOSITION_STATES: readonly EdDispositionState[] = [
  'triaged',
  'in-assessment',
  'boarding-admit',
  'ready-discharge',
];

export interface EdTrackPatientRow {
  id: string;
  bayLabel: string;
  patientName: string;
  ageSexLabel: string;
  esiLevel: 1 | 2 | 3 | 4 | 5;
  chiefComplaint: string;
  losMinutes: number;
  pendingLabsCount: number;
  pendingImagingCount: number;
  disposition: 'triaged' | 'in-assessment' | 'boarding-admit' | 'ready-discharge';
  providerName?: string;
  badge?: EmrBadge;
}

export interface EmrEdTrackBoardViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  activeAcuityFilter?: 'all' | 1 | 2 | 3 | 4 | 5;
  patients: readonly EdTrackPatientRow[];
  selectedPatientId?: string;
  readOnly?: boolean;
}

export type EmrEdTrackBoardIntent =
  | { type: 'acuityFilterChanged'; filter: 'all' | 1 | 2 | 3 | 4 | 5 }
  | { type: 'patientSelected'; patientId: string }
  | {
      type: 'dispositionChanged';
      patientId: string;
      disposition: EdTrackPatientRow['disposition'];
    };

export function summarizeEdTrackCensus(patients: readonly EdTrackPatientRow[]): {
  totalPatients: number;
  criticalEsi12Count: number;
  boardingCount: number;
  fourHourBreachCount: number;
} {
  let criticalEsi12Count = 0;
  let boardingCount = 0;
  let fourHourBreachCount = 0;
  for (const patient of patients) {
    if (patient.esiLevel === 1 || patient.esiLevel === 2) {
      criticalEsi12Count += 1;
    }
    if (patient.disposition === 'boarding-admit') {
      boardingCount += 1;
    }
    if (patient.losMinutes >= 240) {
      fourHourBreachCount += 1;
    }
  }
  return {
    totalPatients: patients.length,
    criticalEsi12Count,
    boardingCount,
    fourHourBreachCount,
  };
}

export interface TriageVitalSummaryItem {
  label: string;
  value: string;
  abnormal?: boolean;
}

export interface EmrTriageAssessmentCardViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  arrivalMode: 'Walk-in' | 'ALS Ambulance' | 'BLS Ambulance' | 'Police/Transfer';
  chiefComplaint: string;
  esiLevel: 1 | 2 | 3 | 4 | 5;
  painScore: number;
  redFlags: readonly string[];
  vitalsSummary: readonly { label: string; value: string; abnormal?: boolean }[];
  isolationRequired: boolean;
  triageNurse?: string;
  finalized: boolean;
  readOnly?: boolean;
}

export type EmrTriageAssessmentCardIntent =
  | { type: 'esiLevelSelected'; esiLevel: 1 | 2 | 3 | 4 | 5 }
  | { type: 'painScoreChanged'; painScore: number }
  | { type: 'isolationToggled'; isolationRequired: boolean }
  | { type: 'triageFinalized' };

export type ResuscitationQuickAction =
  | 'cpr-cycle'
  | 'shock-delivered'
  | 'epinephrine-1mg'
  | 'amiodarone-300mg'
  | 'rosc-achieved';

export const RESUSCITATION_QUICK_ACTIONS: readonly {
  readonly id: ResuscitationQuickAction;
  readonly label: string;
}[] = [
  { id: 'cpr-cycle', label: '+ CPR Cycle (2m)' },
  { id: 'shock-delivered', label: '⚡ Shock Delivered' },
  { id: 'epinephrine-1mg', label: '+ Epinephrine 1 mg' },
  { id: 'amiodarone-300mg', label: '+ Amiodarone 300 mg' },
  { id: 'rosc-achieved', label: '✓ ROSC Achieved' },
];

export const RESUSCITATION_RHYTHMS: readonly EmrResuscitationEventLogViewModel['currentRhythm'][] =
  ['VF/pVT', 'PEA', 'Asystole', 'ROSC'];

export const RESUSCITATION_STATUSES: readonly EmrResuscitationEventLogViewModel['codeStatus'][] = [
  'active',
  'rosc',
  'terminated',
];

export interface ResuscitationLogEntry {
  id: string;
  timestampLabel: string;
  category: 'rhythm' | 'shock' | 'medication' | 'airway' | 'milestone';
  description: string;
  clinician?: string;
}

export interface EmrResuscitationEventLogViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  codeStatus: 'active' | 'rosc' | 'terminated';
  elapsedSeconds: number;
  currentRhythm: 'VF/pVT' | 'PEA' | 'Asystole' | 'ROSC';
  cprCycles: number;
  shockCount: number;
  epinephrineDoses: number;
  events: readonly ResuscitationLogEntry[];
  readOnly?: boolean;
}

export type EmrResuscitationEventLogIntent =
  | {
      type: 'quickActionLogged';
      action:
        | 'cpr-cycle'
        | 'shock-delivered'
        | 'epinephrine-1mg'
        | 'amiodarone-300mg'
        | 'rosc-achieved';
    }
  | { type: 'rhythmChanged'; rhythm: EmrResuscitationEventLogViewModel['currentRhythm'] }
  | { type: 'codeStatusChanged'; status: EmrResuscitationEventLogViewModel['codeStatus'] };

export interface SpecimenContainerItem {
  id: string;
  barcode: string;
  tubeType: string;
  testsSummary: string;
  volumeMl: number;
  stat?: boolean;
  status: 'pending' | 'scanned-collected' | 'received-lab' | 'rejected-hemolyzed';
}

export interface EmrSpecimenCollectionBarViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  orderAccession: string;
  patientVerified: boolean;
  containers: readonly SpecimenContainerItem[];
  readOnly?: boolean;
}

export type EmrSpecimenCollectionBarIntent =
  | { type: 'patientVerificationToggled'; verified: boolean }
  | { type: 'containerScanned'; containerId: string; barcode: string }
  | { type: 'containerRejected'; containerId: string; reason: string };

export type LabAbnormalityFlag =
  | 'normal'
  | 'low'
  | 'high'
  | 'critical-low'
  | 'critical-high';

export interface LabCumulativeAnalyteRow {
  id: string;
  analyteName: string;
  unit: string;
  referenceRange: string;
  values: Readonly<
    Record<
      string,
      {
        value: string;
        flag: 'normal' | 'low' | 'high' | 'critical-low' | 'critical-high';
      }
    >
  >;
}

export interface EmrLabCumulativeGridViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  panelName: string;
  columns: readonly { id: string; dateLabel: string }[];
  rows: readonly LabCumulativeAnalyteRow[];
  showAbnormalOnly?: boolean;
  selectedCell?: { analyteId: string; columnId: string };
  readOnly?: boolean;
}

export type EmrLabCumulativeGridIntent =
  | { type: 'abnormalFilterToggled'; showAbnormalOnly: boolean }
  | { type: 'cellSelected'; analyteId: string; columnId: string }
  | { type: 'criticalAcknowledgeRequested'; analyteId: string; columnId: string };

export function countLabCriticalCells(rows: readonly LabCumulativeAnalyteRow[]): number {
  let count = 0;
  for (const row of rows) {
    for (const cell of Object.values(row.values)) {
      if (cell.flag === 'critical-low' || cell.flag === 'critical-high') {
        count += 1;
      }
    }
  }
  return count;
}

export interface AntibiogramIsolate {
  id: string;
  organismName: string;
  colonyCount?: string;
  resistanceMechanism?: string;
}

export interface AntibiogramSusceptibilityRow {
  antibioticId: string;
  antibioticName: string;
  classLabel?: string;
  resultsByIsolate: Readonly<
    Record<string, { interpretation: 'S' | 'I' | 'R'; micLabel?: string }>
  >;
  stewardshipPreferred?: boolean;
}

export interface EmrMicrobiologyAntibiogramViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  specimenSource: string;
  collectionDate: string;
  gramStainSummary?: string;
  isolates: readonly {
    id: string;
    organismName: string;
    colonyCount?: string;
    resistanceMechanism?: string;
  }[];
  rows: readonly AntibiogramSusceptibilityRow[];
  selectedAntibioticId?: string;
  readOnly?: boolean;
}

export type EmrMicrobiologyAntibiogramIntent =
  | { type: 'antibioticSelected'; antibioticId: string }
  | { type: 'stewardshipOrderRequested'; antibioticId: string; isolateId: string };

export const ANAESTHESIA_PHASES: readonly EmrAnaesthesiaRecordViewModel['activePhase'][] = [
  'induction',
  'maintenance',
  'emergence',
  'pacu-handover',
];

export interface AnaesthesiaCheckpoint {
  id: string;
  timeLabel: string;
  hrBpm: number;
  bpLabel: string;
  spo2Pct: number;
  etco2MmHg: number;
  macPct?: number;
}

export interface AnaesthesiaMedicationEntry {
  id: string;
  drugName: string;
  doseLabel: string;
  timeLabel: string;
}

export interface EmrAnaesthesiaRecordViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  asaClass: 'I' | 'II' | 'III' | 'IV' | 'V' | 'E';
  mallampatiClass: 1 | 2 | 3 | 4;
  technique: string;
  airwayDevice: string;
  checkpoints: readonly {
    id: string;
    timeLabel: string;
    hrBpm: number;
    bpLabel: string;
    spo2Pct: number;
    etco2MmHg: number;
    macPct?: number;
  }[];
  medications: readonly {
    id: string;
    drugName: string;
    doseLabel: string;
    timeLabel: string;
  }[];
  activePhase: 'induction' | 'maintenance' | 'emergence' | 'pacu-handover';
  readOnly?: boolean;
}

export type EmrAnaesthesiaRecordIntent =
  | { type: 'phaseChanged'; phase: EmrAnaesthesiaRecordViewModel['activePhase'] }
  | { type: 'checkpointAdded'; timeLabel: string }
  | { type: 'medicationLogged'; drugName: string; doseLabel: string };

export interface FluidBalanceStreamEntry {
  id: string;
  category: string;
  routeOrSite: string;
  volumeMl: number;
  timeLabel?: string;
}

export interface EmrFluidBalanceChartViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  periodLabel: string;
  patientWeightKg?: number;
  targetNetBalanceMl?: number;
  intakes: readonly FluidBalanceStreamEntry[];
  outputs: readonly FluidBalanceStreamEntry[];
  readOnly?: boolean;
}

export type EmrFluidBalanceChartIntent =
  | { type: 'entryAdded'; direction: 'intake' | 'output'; category: string; volumeMl: number }
  | { type: 'entryRemoved'; entryId: string };

export function computeFluidBalanceSummary(
  intakes: readonly FluidBalanceStreamEntry[],
  outputs: readonly FluidBalanceStreamEntry[],
): { totalIntakeMl: number; totalOutputMl: number; netBalanceMl: number } {
  const totalIntakeMl = intakes.reduce((sum, entry) => sum + entry.volumeMl, 0);
  const totalOutputMl = outputs.reduce((sum, entry) => sum + entry.volumeMl, 0);
  return {
    totalIntakeMl,
    totalOutputMl,
    netBalanceMl: totalIntakeMl - totalOutputMl,
  };
}

export interface SurgicalImplantEntry {
  id: string;
  deviceName: string;
  manufacturer: string;
  lotNumber: string;
  serialNumber: string;
  udiCode: string;
  expiryDate: string;
  anatomicalSite: string;
  sterileVerified: boolean;
}

export interface EmrSurgicalImplantLogViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  procedureName: string;
  countsReconciled: boolean;
  implants: readonly SurgicalImplantEntry[];
  selectedImplantId?: string;
  readOnly?: boolean;
}

export type EmrSurgicalImplantLogIntent =
  | { type: 'implantSelected'; implantId: string }
  | { type: 'sterileVerifiedToggled'; implantId: string; sterileVerified: boolean }
  | { type: 'countsReconciledToggled'; countsReconciled: boolean };

const acuteStyles = css`
  .acute-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 12px;
  }
  .acute-card {
    border: 1px solid var(--emr-border);
    border-radius: 10px;
    background: var(--emr-surface-raised, var(--emr-surface));
    padding: 12px;
    display: grid;
    gap: 10px;
  }
  .acute-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .acute-chip {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid var(--emr-border);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    cursor: pointer;
  }
  .acute-chip[aria-pressed='true'] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }
  .acute-alert {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--emr-danger);
    background: var(--emr-danger-soft);
    font-size: var(--emr-text-xs);
  }
`;

// ===========================================================================
// 1. EmrEdTrackBoardElement (`emr-ed-track-board`)
// ===========================================================================

export class EmrEdTrackBoardElement extends EmrModelElement<
  EmrEdTrackBoardViewModel,
  EmrEdTrackBoardIntent
> {
  static override styles = [emrShadowStyles, acuteStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const census = summarizeEdTrackCensus(m.patients);
    const activeFilter = m.activeAcuityFilter ?? 'all';
    const visible =
      activeFilter === 'all'
        ? m.patients
        : m.patients.filter((pt) => pt.esiLevel === activeFilter);

    return this.panel(
      m.title ?? 'ED Real-Time Bay Census & Patient Flow',
      html`
        <div class="acute-row">
          <span class="emr-badge">Census: ${census.totalPatients}</span>
          <span class="emr-badge">ESI 1-2: ${census.criticalEsi12Count}</span>
          <span class="emr-badge">Boarding: ${census.boardingCount}</span>
          <span class="emr-badge">>=4h LOS: ${census.fourHourBreachCount}</span>
        </div>

        <div class="acute-row" role="group" aria-label="ESI Acuity Filter">
          ${ED_ACUITY_FILTERS.map(
            (flt) => html`
              <button
                type="button"
                class="acute-chip"
                aria-pressed=${activeFilter === flt ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'acuityFilterChanged', filter: flt });
                  }
                }}
              >
                ${flt === 'all' ? 'All Acuities' : `ESI ${flt}`}
              </button>
            `,
          )}
        </div>

        <div class="acute-grid">
          ${visible.map(
            (pt) => html`
              <article class="acute-card" aria-label=${`Bay ${pt.bayLabel}`}>
                <div class="acute-row">
                  <button
                    type="button"
                    class="acute-chip"
                    aria-pressed=${m.selectedPatientId === pt.id ? 'true' : 'false'}
                    ?disabled=${readOnly}
                    @click=${() => {
                      if (!readOnly) {
                        this.send({ type: 'patientSelected', patientId: pt.id });
                      }
                    }}
                  >
                    ${pt.bayLabel} · ${pt.patientName} (${pt.ageSexLabel})
                  </button>
                  <span class="emr-badge">ESI ${pt.esiLevel}</span>
                  <span>LOS ${pt.losMinutes}m</span>
                </div>
                <p>${pt.chiefComplaint}</p>
                <div class="acute-row">
                  ${ED_DISPOSITION_STATES.map(
                    (disp) => html`
                      <button
                        type="button"
                        class="acute-chip"
                        aria-pressed=${pt.disposition === disp ? 'true' : 'false'}
                        ?disabled=${readOnly}
                        @click=${() => {
                          if (!readOnly) {
                            this.send({
                              type: 'dispositionChanged',
                              patientId: pt.id,
                              disposition: disp,
                            });
                          }
                        }}
                      >
                        ${disp}
                      </button>
                    `,
                  )}
                </div>
              </article>
            `,
          )}
        </div>
      `,
    );
  }
}

// ===========================================================================
// 2. EmrTriageAssessmentCardElement (`emr-triage-assessment-card`)
// ===========================================================================

export class EmrTriageAssessmentCardElement extends EmrModelElement<
  EmrTriageAssessmentCardViewModel,
  EmrTriageAssessmentCardIntent
> {
  static override styles = [emrShadowStyles, acuteStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;

    return this.panel(
      m.title ?? 'ESI / MTS Primary Survey & Triage Assessment',
      html`
        <div class="acute-row">
          <span class="emr-badge">${m.arrivalMode}</span>
          <span class="emr-badge">ESI Level ${m.esiLevel}</span>
          <span class="emr-badge">Pain: ${m.painScore}/10</span>
        </div>

        <p><strong>Chief Complaint:</strong> ${m.chiefComplaint}</p>

        ${m.redFlags.length > 0
          ? html`<div class="acute-alert" role="alert">Red Flags: ${m.redFlags.join(' · ')}</div>`
          : nothing}

        <div class="acute-row" role="group" aria-label="ESI Acuity Selector">
          ${ED_ESI_LEVELS.map(
            (lvl) => html`
              <button
                type="button"
                class="acute-chip"
                aria-pressed=${m.esiLevel === lvl ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'esiLevelSelected', esiLevel: lvl });
                  }
                }}
              >
                ESI ${lvl}
              </button>
            `,
          )}
        </div>

        <div class="acute-row">
          <button
            type="button"
            class="acute-chip"
            aria-pressed=${m.isolationRequired ? 'true' : 'false'}
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) {
                this.send({
                  type: 'isolationToggled',
                  isolationRequired: !m.isolationRequired,
                });
              }
            }}
          >
            ${m.isolationRequired ? '⚠ Isolation Required' : 'Standard Precautions'}
          </button>

          <button
            type="button"
            class="acute-chip"
            ?disabled=${readOnly || m.finalized}
            @click=${() => {
              if (!readOnly && !m.finalized) {
                this.send({ type: 'triageFinalized' });
              }
            }}
          >
            ${m.finalized ? '✓ Triage Finalized' : 'Finalize Triage'}
          </button>
        </div>
      `,
    );
  }
}

// ===========================================================================
// 3. EmrResuscitationEventLogElement (`emr-resuscitation-event-log`)
// ===========================================================================

export class EmrResuscitationEventLogElement extends EmrModelElement<
  EmrResuscitationEventLogViewModel,
  EmrResuscitationEventLogIntent
> {
  static override styles = [emrShadowStyles, acuteStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const mins = Math.floor(m.elapsedSeconds / 60);
    const secs = m.elapsedSeconds % 60;
    const elapsedLabel = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return this.panel(
      m.title ?? 'Real-Time Resuscitation Event Recorder',
      html`
        <div class="acute-row">
          <span class="emr-badge">Status: ${m.codeStatus.toUpperCase()}</span>
          <span class="emr-badge">Elapsed: ${elapsedLabel}</span>
          <span class="emr-badge">CPR Cycles: ${m.cprCycles}</span>
          <span class="emr-badge">Shocks: ${m.shockCount}</span>
          <span class="emr-badge">Epi Doses: ${m.epinephrineDoses}</span>
        </div>

        <div class="acute-row" role="group" aria-label="Rhythm Selector">
          ${RESUSCITATION_RHYTHMS.map(
            (rhy) => html`
              <button
                type="button"
                class="acute-chip"
                aria-pressed=${m.currentRhythm === rhy ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'rhythmChanged', rhythm: rhy });
                  }
                }}
              >
                ${rhy}
              </button>
            `,
          )}
        </div>

        <div class="acute-row" role="group" aria-label="One-Tap ACLS Actions">
          ${RESUSCITATION_QUICK_ACTIONS.map(
            (act) => html`
              <button
                type="button"
                class="acute-chip"
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'quickActionLogged', action: act.id });
                  }
                }}
              >
                ${act.label}
              </button>
            `,
          )}
        </div>

        <div class="acute-grid">
          ${m.events.map(
            (ev) => html`
              <article class="acute-card">
                <strong>[${ev.timestampLabel}] (${ev.category})</strong>
                <span>${ev.description}</span>
              </article>
            `,
          )}
        </div>
      `,
    );
  }
}

// ===========================================================================
// 4. EmrSpecimenCollectionBarElement (`emr-specimen-collection-bar`)
// ===========================================================================

export class EmrSpecimenCollectionBarElement extends EmrModelElement<
  EmrSpecimenCollectionBarViewModel,
  EmrSpecimenCollectionBarIntent
> {
  static override styles = [emrShadowStyles, acuteStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;

    return this.panel(
      m.title ?? 'Specimen Collection & Wristband Verification',
      html`
        <div class="acute-row">
          <span class="emr-badge">Accession: ${m.orderAccession}</span>
          <button
            type="button"
            class="acute-chip"
            aria-pressed=${m.patientVerified ? 'true' : 'false'}
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) {
                this.send({
                  type: 'patientVerificationToggled',
                  verified: !m.patientVerified,
                });
              }
            }}
          >
            ${m.patientVerified ? '✓ 2-ID Wristband Verified' : 'Verify Patient ID'}
          </button>
        </div>

        <div class="acute-grid">
          ${m.containers.map(
            (ct) => html`
              <article class="acute-card">
                <strong>${ct.barcode} · ${ct.tubeType} (${ct.volumeMl} mL)</strong>
                <span>${ct.testsSummary} · ${ct.status}</span>
                <div class="acute-row">
                  <button
                    type="button"
                    class="acute-chip"
                    ?disabled=${readOnly}
                    @click=${() => {
                      if (!readOnly) {
                        this.send({
                          type: 'containerScanned',
                          containerId: ct.id,
                          barcode: ct.barcode,
                        });
                      }
                    }}
                  >
                    Scan Collect
                  </button>
                  <button
                    type="button"
                    class="acute-chip"
                    ?disabled=${readOnly}
                    @click=${() => {
                      if (!readOnly) {
                        this.send({
                          type: 'containerRejected',
                          containerId: ct.id,
                          reason: 'Hemolyzed / Clotted',
                        });
                      }
                    }}
                  >
                    Reject
                  </button>
                </div>
              </article>
            `,
          )}
        </div>
      `,
    );
  }
}

// ===========================================================================
// 5. EmrLabCumulativeGridElement (`emr-lab-cumulative-grid`)
// ===========================================================================

export class EmrLabCumulativeGridElement extends EmrModelElement<
  EmrLabCumulativeGridViewModel,
  EmrLabCumulativeGridIntent
> {
  static override styles = [emrShadowStyles, acuteStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const critCount = countLabCriticalCells(m.rows);
    const visibleRows = m.showAbnormalOnly
      ? m.rows.filter((r) => Object.values(r.values).some((c) => c.flag !== 'normal'))
      : m.rows;

    return this.panel(
      m.title ?? m.panelName,
      html`
        <div class="acute-row">
          <span class="emr-badge">Critical Values: ${critCount}</span>
          <button
            type="button"
            class="acute-chip"
            aria-pressed=${m.showAbnormalOnly ? 'true' : 'false'}
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) {
                this.send({
                  type: 'abnormalFilterToggled',
                  showAbnormalOnly: !m.showAbnormalOnly,
                });
              }
            }}
          >
            ${m.showAbnormalOnly ? 'Showing Abnormal Only' : 'Show Abnormal Only'}
          </button>
        </div>

        <div class="acute-grid">
          ${visibleRows.map(
            (row) => html`
              <article class="acute-card">
                <strong>${row.analyteName} (${row.unit}) · Ref: ${row.referenceRange}</strong>
                <div class="acute-row">
                  ${m.columns.map((col) => {
                    const cell = row.values[col.id];
                    if (!cell) return nothing;
                    return html`
                      <button
                        type="button"
                        class="acute-chip"
                        ?disabled=${readOnly}
                        @click=${() => {
                          if (!readOnly) {
                            this.send({
                              type: 'cellSelected',
                              analyteId: row.id,
                              columnId: col.id,
                            });
                          }
                        }}
                      >
                        ${col.dateLabel}: ${cell.value} (${cell.flag})
                      </button>
                    `;
                  })}
                </div>
              </article>
            `,
          )}
        </div>
      `,
    );
  }
}

// ===========================================================================
// 6. EmrMicrobiologyAntibiogramElement (`emr-microbiology-antibiogram`)
// ===========================================================================

export class EmrMicrobiologyAntibiogramElement extends EmrModelElement<
  EmrMicrobiologyAntibiogramViewModel,
  EmrMicrobiologyAntibiogramIntent
> {
  static override styles = [emrShadowStyles, acuteStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;

    return this.panel(
      m.title ?? 'Microbiology Susceptibility Matrix',
      html`
        <div class="acute-row">
          <span class="emr-badge">${m.specimenSource}</span>
          <span class="emr-badge">${m.collectionDate}</span>
          ${m.isolates.map(
            (iso) => html`<span class="emr-badge">${iso.organismName}</span>`,
          )}
        </div>

        <div class="acute-grid">
          ${m.rows.map(
            (row) => html`
              <article class="acute-card">
                <div class="acute-row">
                  <button
                    type="button"
                    class="acute-chip"
                    aria-pressed=${m.selectedAntibioticId === row.antibioticId ? 'true' : 'false'}
                    ?disabled=${readOnly}
                    @click=${() => {
                      if (!readOnly) {
                        this.send({
                          type: 'antibioticSelected',
                          antibioticId: row.antibioticId,
                        });
                      }
                    }}
                  >
                    ${row.antibioticName}
                  </button>
                  ${row.stewardshipPreferred
                    ? html`<span class="emr-badge">Stewardship Preferred</span>`
                    : nothing}
                </div>
                <div class="acute-row">
                  ${m.isolates.map((iso) => {
                    const res = row.resultsByIsolate[iso.id];
                    if (!res) return nothing;
                    return html`
                      <button
                        type="button"
                        class="acute-chip"
                        ?disabled=${readOnly}
                        @click=${() => {
                          if (!readOnly) {
                            this.send({
                              type: 'stewardshipOrderRequested',
                              antibioticId: row.antibioticId,
                              isolateId: iso.id,
                            });
                          }
                        }}
                      >
                        ${iso.organismName}: ${res.interpretation}
                      </button>
                    `;
                  })}
                </div>
              </article>
            `,
          )}
        </div>
      `,
    );
  }
}

// ===========================================================================
// 7. EmrAnaesthesiaRecordElement (`emr-anaesthesia-record`)
// ===========================================================================

export class EmrAnaesthesiaRecordElement extends EmrModelElement<
  EmrAnaesthesiaRecordViewModel,
  EmrAnaesthesiaRecordIntent
> {
  static override styles = [emrShadowStyles, acuteStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;

    return this.panel(
      m.title ?? 'Perioperative Anaesthesia & Physiological Record',
      html`
        <div class="acute-row">
          <span class="emr-badge">ASA ${m.asaClass}</span>
          <span class="emr-badge">Mallampati ${m.mallampatiClass}</span>
          <span class="emr-badge">${m.airwayDevice}</span>
        </div>

        <div class="acute-row" role="group" aria-label="Anaesthesia Phase">
          ${ANAESTHESIA_PHASES.map(
            (ph) => html`
              <button
                type="button"
                class="acute-chip"
                aria-pressed=${m.activePhase === ph ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'phaseChanged', phase: ph });
                  }
                }}
              >
                ${ph}
              </button>
            `,
          )}
          <button
            type="button"
            class="acute-chip"
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) {
                this.send({ type: 'checkpointAdded', timeLabel: 'Now' });
              }
            }}
          >
            + Vitals Checkpoint
          </button>
        </div>
      `,
    );
  }
}

// ===========================================================================
// 8. EmrFluidBalanceChartElement (`emr-fluid-balance-chart`)
// ===========================================================================

export class EmrFluidBalanceChartElement extends EmrModelElement<
  EmrFluidBalanceChartViewModel,
  EmrFluidBalanceChartIntent
> {
  static override styles = [emrShadowStyles, acuteStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const summary = computeFluidBalanceSummary(m.intakes, m.outputs);

    return this.panel(
      m.title ?? 'Fluid Balance & Urine Output Flowsheet',
      html`
        <div class="acute-row">
          <span class="emr-badge">Intake: ${summary.totalIntakeMl} mL</span>
          <span class="emr-badge">Output: ${summary.totalOutputMl} mL</span>
          <span class="emr-badge">Net: ${summary.netBalanceMl} mL</span>
          <button
            type="button"
            class="acute-chip"
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) {
                this.send({
                  type: 'entryAdded',
                  direction: 'intake',
                  category: 'IV Crystalloid',
                  volumeMl: 250,
                });
              }
            }}
          >
            + 250 mL IV
          </button>
        </div>
      `,
    );
  }
}

// ===========================================================================
// 9. EmrSurgicalImplantLogElement (`emr-surgical-implant-log`)
// ===========================================================================

export class EmrSurgicalImplantLogElement extends EmrModelElement<
  EmrSurgicalImplantLogViewModel,
  EmrSurgicalImplantLogIntent
> {
  static override styles = [emrShadowStyles, acuteStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;

    return this.panel(
      m.title ?? m.procedureName,
      html`
        <div class="acute-row">
          <button
            type="button"
            class="acute-chip"
            aria-pressed=${m.countsReconciled ? 'true' : 'false'}
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) {
                this.send({
                  type: 'countsReconciledToggled',
                  countsReconciled: !m.countsReconciled,
                });
              }
            }}
          >
            ${m.countsReconciled ? '✓ Surgical Counts Reconciled' : '⚠ Reconcile Surgical Counts'}
          </button>
        </div>

        <div class="acute-grid">
          ${m.implants.map(
            (imp) => html`
              <article class="acute-card">
                <strong>${imp.deviceName} · ${imp.manufacturer}</strong>
                <span>Lot ${imp.lotNumber} · SN ${imp.serialNumber} · ${imp.udiCode}</span>
                <div class="acute-row">
                  <button
                    type="button"
                    class="acute-chip"
                    ?disabled=${readOnly}
                    @click=${() => {
                      if (!readOnly) {
                        this.send({ type: 'implantSelected', implantId: imp.id });
                      }
                    }}
                  >
                    Select Implant
                  </button>
                  <button
                    type="button"
                    class="acute-chip"
                    aria-pressed=${imp.sterileVerified ? 'true' : 'false'}
                    ?disabled=${readOnly}
                    @click=${() => {
                      if (!readOnly) {
                        this.send({
                          type: 'sterileVerifiedToggled',
                          implantId: imp.id,
                          sterileVerified: !imp.sterileVerified,
                        });
                      }
                    }}
                  >
                    ${imp.sterileVerified ? '✓ Sterile Verified' : 'Verify Sterility'}
                  </button>
                </div>
              </article>
            `,
          )}
        </div>
      `,
    );
  }
}

export function registerL4AcuteLabPerioperativeElements(): void {
  defineEmrElement('emr-ed-track-board', EmrEdTrackBoardElement);
  defineEmrElement('emr-triage-assessment-card', EmrTriageAssessmentCardElement);
  defineEmrElement('emr-resuscitation-event-log', EmrResuscitationEventLogElement);
  defineEmrElement('emr-specimen-collection-bar', EmrSpecimenCollectionBarElement);
  defineEmrElement('emr-lab-cumulative-grid', EmrLabCumulativeGridElement);
  defineEmrElement('emr-microbiology-antibiogram', EmrMicrobiologyAntibiogramElement);
  defineEmrElement('emr-anaesthesia-record', EmrAnaesthesiaRecordElement);
  defineEmrElement('emr-fluid-balance-chart', EmrFluidBalanceChartElement);
  defineEmrElement('emr-surgical-implant-log', EmrSurgicalImplantLogElement);
}
