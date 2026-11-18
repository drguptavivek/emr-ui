import { css, html, nothing } from 'lit';
import type { ClinicalAssessmentStatus, EmrBadge, EmrTone } from '@drguptavivek/emr-controller';
import { EmrModelElement } from './controlled-rendering.js';
import { defineEmrElement, emrShadowStyles } from './foundations.js';

export type { ClinicalAssessmentStatus, EmrBadge, EmrTone };

// ===========================================================================
// ViewModels, Intents & Pure Helpers
// ===========================================================================

// 1. EmrPartogram
export interface PartogramCheckpoint {
  hour: number;
  timeLabel: string;
  cervicalDilationCm: number;
  descentStation: number;
  fhrBpm: number;
  contractionsPer10Min: number;
  oxytocinUnitsPerL?: number;
}

export interface EmrPartogramViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  gravidaParaLabel: string;
  membraneStatus: 'Intact' | 'Clear Liquor' | 'Meconium Stained' | 'Blood Stained';
  alertStatus: 'normal' | 'alert-line' | 'action-line';
  observations: readonly PartogramCheckpoint[];
  selectedHour?: number;
  readOnly?: boolean;
}

export type EmrPartogramIntent =
  | { type: 'checkpointSelected'; hour: number }
  | { type: 'membraneStatusChanged'; status: EmrPartogramViewModel['membraneStatus'] }
  | { type: 'alertStatusChanged'; alertStatus: EmrPartogramViewModel['alertStatus'] };

export function evaluatePartogramProgression(
  observations: readonly PartogramCheckpoint[],
): { latestDilationCm: number; latestFhrBpm: number; fhrAbnormal: boolean } {
  if (observations.length === 0) {
    return { latestDilationCm: 0, latestFhrBpm: 0, fhrAbnormal: false };
  }
  const latest = observations[observations.length - 1]!;
  return {
    latestDilationCm: latest.cervicalDilationCm,
    latestFhrBpm: latest.fhrBpm,
    fhrAbnormal: latest.fhrBpm < 110 || latest.fhrBpm > 160,
  };
}

// 2. EmrGrowthChart
export interface GrowthMeasurementPoint {
  id: string;
  ageLabel: string;
  ageMonths: number;
  value: number;
  unit: string;
  centile: number;
  zScore: number;
  flag?: 'normal' | 'stunted-wasted' | 'severe-malnutrition' | 'overweight';
}

export interface EmrGrowthChartViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  standardLabel: 'WHO 0-5y' | 'IAP 5-18y' | 'Fenton Preterm';
  activeMetric: 'weight-for-age' | 'height-for-age' | 'head-circumference' | 'bmi-for-age';
  midParentalHeightCm?: number;
  points: readonly GrowthMeasurementPoint[];
  selectedPointId?: string;
  readOnly?: boolean;
}

export type EmrGrowthChartIntent =
  | { type: 'metricChanged'; metric: EmrGrowthChartViewModel['activeMetric'] }
  | { type: 'pointSelected'; pointId: string };

export function classifyGrowthZScore(
  zScore: number,
): 'normal' | 'moderate-wasting' | 'severe-stunting-or-wasting' | 'overweight' {
  if (zScore < -3) return 'severe-stunting-or-wasting';
  if (zScore < -2) return 'moderate-wasting';
  if (zScore > 2) return 'overweight';
  return 'normal';
}

// 3. EmrImmunizationLedger
export interface ImmunizationDoseEntry {
  id: string;
  vaccineName: string;
  doseNumberLabel: string;
  ageGroupLabel: string;
  status: 'administered' | 'due' | 'overdue' | 'contraindicated';
  dateLabel?: string;
  batchLotNumber?: string;
  siteAndRoute?: string;
  aefiReported?: boolean;
}

export interface EmrImmunizationLedgerViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  scheduleStandard: string;
  activeFilter?: 'all' | 'due-overdue' | 'administered';
  doses: readonly ImmunizationDoseEntry[];
  selectedDoseId?: string;
  readOnly?: boolean;
}

export type EmrImmunizationLedgerIntent =
  | { type: 'filterChanged'; filter: 'all' | 'due-overdue' | 'administered' }
  | { type: 'doseSelected'; doseId: string }
  | { type: 'administerDoseRequested'; doseId: string; vaccineName: string };

export function summarizeImmunizationCoverage(
  doses: readonly ImmunizationDoseEntry[],
): { administeredCount: number; dueCount: number; overdueCount: number } {
  let administeredCount = 0;
  let dueCount = 0;
  let overdueCount = 0;
  for (const dose of doses) {
    if (dose.status === 'administered') administeredCount += 1;
    else if (dose.status === 'due') dueCount += 1;
    else if (dose.status === 'overdue') overdueCount += 1;
  }
  return { administeredCount, dueCount, overdueCount };
}

// 4. EmrWaveformStripViewer
export interface EmrWaveformStripViewerViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  modality: '12-Lead ECG' | 'Telemetry Strip' | 'Fetal CTG';
  paperSpeed: '25 mm/s' | '50 mm/s';
  gain: '10 mm/mV' | '20 mm/mV';
  intervals: {
    hrBpm: number;
    prMs?: number;
    qrsMs?: number;
    qtcMs?: number;
  };
  leads: readonly {
    id: string;
    label: string;
    samplePoints: readonly number[];
    rhythmNote?: string;
  }[];
  activeLeadId: string;
  interpretation: string;
  criticalAlert?: boolean;
  signed: boolean;
  readOnly?: boolean;
}

export type EmrWaveformStripViewerIntent =
  | { type: 'leadSelected'; leadId: string }
  | { type: 'paperSpeedChanged'; paperSpeed: '25 mm/s' | '50 mm/s' }
  | { type: 'signInterpretationRequested' };

// 5. EmrOdontogram
export interface OdontogramToothRecord {
  toothNumber: string;
  arch: 'upper' | 'lower';
  status:
    | 'sound'
    | 'caries'
    | 'restored-filling'
    | 'crown'
    | 'missing'
    | 'endodontic-rct'
    | 'implant';
  pocketDepthMm?: number;
  note?: string;
}

export interface EmrOdontogramViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  dentitionMode: 'permanent-fdi' | 'deciduous-fdi';
  teeth: readonly OdontogramToothRecord[];
  selectedToothNumber?: string;
  readOnly?: boolean;
}

export type EmrOdontogramIntent =
  | { type: 'toothSelected'; toothNumber: string }
  | {
      type: 'toothStatusChanged';
      toothNumber: string;
      status: OdontogramToothRecord['status'];
    }
  | { type: 'dentitionModeChanged'; dentitionMode: 'permanent-fdi' | 'deciduous-fdi' };

export function computeDmftIndex(
  teeth: readonly OdontogramToothRecord[],
): { decayed: number; missing: number; filled: number; dmftTotal: number } {
  let decayed = 0;
  let missing = 0;
  let filled = 0;
  for (const tooth of teeth) {
    if (tooth.status === 'caries') {
      decayed += 1;
    } else if (tooth.status === 'missing') {
      missing += 1;
    } else if (
      tooth.status === 'restored-filling' ||
      tooth.status === 'crown' ||
      tooth.status === 'endodontic-rct'
    ) {
      filled += 1;
    }
  }
  return {
    decayed,
    missing,
    filled,
    dmftTotal: decayed + missing + filled,
  };
}

// 6. EmrAudiogram
export interface AudiogramEarRecord {
  ear: 'Right' | 'Left';
  ptaDbHl: number;
  sdsPct?: number;
  tympanogramType: 'Type A' | 'Type As' | 'Type Ad' | 'Type B' | 'Type C';
  degreeClassification: string;
  thresholds: readonly {
    frequencyHz: 250 | 500 | 1000 | 2000 | 4000 | 8000;
    airDbHl: number;
    boneDbHl?: number;
    masked?: boolean;
  }[];
}

export interface EmrAudiogramViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  rightEar: AudiogramEarRecord;
  leftEar: AudiogramEarRecord;
  activeConductionView?: 'both' | 'air' | 'bone';
  readOnly?: boolean;
}

export type EmrAudiogramIntent =
  | { type: 'conductionViewChanged'; view: 'both' | 'air' | 'bone' }
  | {
      type: 'thresholdSelected';
      ear: 'Right' | 'Left';
      frequencyHz: 250 | 500 | 1000 | 2000 | 4000 | 8000;
    };

// 7. EmrChemoRegimenRoadmap
export interface ChemoCycleItem {
  cycleNumber: number;
  plannedDate: string;
  status: 'completed' | 'active-cycle' | 'held-toxicity' | 'planned';
  dosePct: number;
  agentsSummary: string;
  toxicityGradeNote?: string;
}

export interface EmrChemoRegimenRoadmapViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  protocolName: string;
  diagnosisLabel: string;
  bsaM2: number;
  ecogStatus: 0 | 1 | 2 | 3 | 4;
  labClearancePassed: boolean;
  ancCountLabel: string;
  plateletCountLabel: string;
  cycles: readonly ChemoCycleItem[];
  selectedCycleNumber?: number;
  readOnly?: boolean;
}

export type EmrChemoRegimenRoadmapIntent =
  | { type: 'cycleSelected'; cycleNumber: number }
  | { type: 'cycleDoseAdjusted'; cycleNumber: number; dosePct: number }
  | { type: 'clearanceOverrideRequested'; cycleNumber: number };

// 8. EmrReferralTracker
export interface ReferralItemRecord {
  id: string;
  targetSpecialty: string;
  receivingFacilityOrDoctor?: string;
  urgency: 'emergent' | 'urgent' | 'routine';
  status: 'draft' | 'sent' | 'accepted' | 'scheduled' | 'completed-report-filed';
  clinicalQuestion: string;
  consultantReplySummary?: string;
  createdAtLabel: string;
}

export interface EmrReferralTrackerViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  activeFilter?: 'all' | 'open' | 'completed-report-filed';
  referrals: readonly ReferralItemRecord[];
  selectedReferralId?: string;
  readOnly?: boolean;
}

export type EmrReferralTrackerIntent =
  | { type: 'filterChanged'; filter: 'all' | 'open' | 'completed-report-filed' }
  | { type: 'referralSelected'; referralId: string }
  | {
      type: 'referralStatusUpdated';
      referralId: string;
      status: ReferralItemRecord['status'];
    };

// 9. EmrEncounterChargeSheet
export interface ChargeLineItem {
  id: string;
  code: string;
  description: string;
  category: 'consultation' | 'procedure' | 'diagnostics' | 'consumables';
  quantity: number;
  unitPrice: number;
  coveredByPayer: boolean;
}

export interface EmrEncounterChargeSheetViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  payerScheme: string;
  preAuthStatus: 'self-pay' | 'preauth-approved' | 'preauth-pending' | 'claim-submitted';
  preAuthNumber?: string;
  currencySymbol?: string;
  primaryDiagnosisCode: string;
  lineItems: readonly ChargeLineItem[];
  readOnly?: boolean;
}

export type EmrEncounterChargeSheetIntent =
  | { type: 'lineQuantityChanged'; itemId: string; quantity: number }
  | { type: 'coverageToggled'; itemId: string; coveredByPayer: boolean }
  | { type: 'submitClaimRequested' };

export function calculateEncounterChargeTotals(
  items: readonly ChargeLineItem[],
): { grossTotal: number; payerCoveredTotal: number; patientPayableTotal: number } {
  let grossTotal = 0;
  let payerCoveredTotal = 0;
  for (const item of items) {
    const lineAmount = item.quantity * item.unitPrice;
    grossTotal += lineAmount;
    if (item.coveredByPayer) {
      payerCoveredTotal += lineAmount;
    }
  }
  const roundedGross = Math.round(grossTotal * 100) / 100;
  const roundedPayer = Math.round(payerCoveredTotal * 100) / 100;
  const patientPayableTotal = Math.round((roundedGross - roundedPayer) * 100) / 100;
  return {
    grossTotal: roundedGross,
    payerCoveredTotal: roundedPayer,
    patientPayableTotal,
  };
}

// 10. EmrAbdmHealthLockerPanel
export interface AbdmConsentArtefactItem {
  id: string;
  requesterHiuName: string;
  purpose: string;
  status: 'GRANTED' | 'REQUESTED' | 'EXPIRED' | 'REVOKED';
  hiTypes: readonly string[];
  validUntilLabel: string;
}

export interface EmrAbdmHealthLockerPanelViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  abhaNumber: string;
  abhaAddress: string;
  kycVerified: boolean;
  scanAndShareToken?: string;
  consents: readonly AbdmConsentArtefactItem[];
  linkedCareContextsCount: number;
  selectedConsentId?: string;
  readOnly?: boolean;
}

export type EmrAbdmHealthLockerPanelIntent =
  | { type: 'consentSelected'; consentId: string }
  | { type: 'consentActionRequested'; consentId: string; action: 'approve' | 'revoke' }
  | { type: 'requestNewConsent' }
  | { type: 'linkCareContextRequested' };

const mpsStyles = css`
  .mps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 12px;
  }
  .mps-card {
    border: 1px solid var(--emr-border);
    border-radius: 10px;
    background: var(--emr-surface-raised, var(--emr-surface));
    padding: 12px;
    display: grid;
    gap: 10px;
  }
  .mps-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .mps-chip {
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
  .mps-chip[aria-pressed='true'] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }
  .mps-alert {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--emr-warning);
    background: var(--emr-warning-soft);
    font-size: var(--emr-text-xs);
  }
`;

// ===========================================================================
// 1. EmrPartogramElement (`emr-partogram`)
// ===========================================================================

export class EmrPartogramElement extends EmrModelElement<
  EmrPartogramViewModel,
  EmrPartogramIntent
> {
  static override styles = [emrShadowStyles, mpsStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const prog = evaluatePartogramProgression(m.observations);

    return this.panel(
      m.title ?? 'WHO Labour Care Guide Partogram',
      html`
        <div class="mps-row">
          <span class="emr-badge">${m.gravidaParaLabel}</span>
          <span class="emr-badge">${m.alertStatus}</span>
          <span>
            Latest Dilation: ${prog.latestDilationCm} cm · Latest FHR: ${prog.latestFhrBpm} bpm
          </span>
        </div>
        <div class="mps-row" role="group" aria-label="Membrane status">
          ${(['Intact', 'Clear Liquor', 'Meconium Stained', 'Blood Stained'] as const).map(
            (status) => html`
              <button
                type="button"
                class="mps-chip"
                aria-pressed=${m.membraneStatus === status ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'membraneStatusChanged', status });
                  }
                }}
              >
                ${status}
              </button>
            `,
          )}
        </div>
        <div class="mps-row" role="group" aria-label="Alert line status">
          ${(['normal', 'alert-line', 'action-line'] as const).map(
            (alertStatus) => html`
              <button
                type="button"
                class="mps-chip"
                aria-pressed=${m.alertStatus === alertStatus ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'alertStatusChanged', alertStatus });
                  }
                }}
              >
                ${alertStatus}
              </button>
            `,
          )}
        </div>
        <table class="emr-table">
          <thead>
            <tr>
              <th>Hour</th>
              <th>Time</th>
              <th>Dilation</th>
              <th>FHR</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${m.observations.map(
              (obs) => html`
                <tr>
                  <td>Hr ${obs.hour}</td>
                  <td>${obs.timeLabel}</td>
                  <td>${obs.cervicalDilationCm} cm</td>
                  <td>${obs.fhrBpm} bpm</td>
                  <td>
                    <button
                      type="button"
                      class="mps-chip"
                      ?disabled=${readOnly}
                      @click=${() => {
                        if (!readOnly) {
                          this.send({ type: 'checkpointSelected', hour: obs.hour });
                        }
                      }}
                    >
                      Select Hr ${obs.hour}
                    </button>
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      `,
    );
  }
}

// ===========================================================================
// 2. EmrGrowthChartElement (`emr-growth-chart`)
// ===========================================================================

export class EmrGrowthChartElement extends EmrModelElement<
  EmrGrowthChartViewModel,
  EmrGrowthChartIntent
> {
  static override styles = [emrShadowStyles, mpsStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;

    return this.panel(
      m.title ?? 'WHO / IAP Centile & Z-Score Growth Chart',
      html`
        <div class="mps-row">
          <span class="emr-badge">${m.standardLabel}</span>
          ${m.midParentalHeightCm !== undefined
            ? html`<span class="emr-badge">Target MPH: ${m.midParentalHeightCm} cm</span>`
            : nothing}
        </div>
        <div class="mps-row" role="group" aria-label="Growth metric">
          ${(
            ['weight-for-age', 'height-for-age', 'head-circumference', 'bmi-for-age'] as const
          ).map(
            (metric) => html`
              <button
                type="button"
                class="mps-chip"
                aria-pressed=${m.activeMetric === metric ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'metricChanged', metric });
                  }
                }}
              >
                ${metric}
              </button>
            `,
          )}
        </div>
        <table class="emr-table">
          <thead>
            <tr>
              <th>Age</th>
              <th>Value</th>
              <th>Centile / Z-Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${m.points.map(
              (pt) => html`
                <tr>
                  <td>${pt.ageLabel} (${pt.ageMonths}m)</td>
                  <td>${pt.value} ${pt.unit}</td>
                  <td>
                    P${pt.centile} (${pt.zScore.toFixed(2)} SD · ${classifyGrowthZScore(pt.zScore)})
                  </td>
                  <td>
                    <button
                      type="button"
                      class="mps-chip"
                      ?disabled=${readOnly}
                      @click=${() => {
                        if (!readOnly) {
                          this.send({ type: 'pointSelected', pointId: pt.id });
                        }
                      }}
                    >
                      Select ${pt.ageLabel}
                    </button>
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      `,
    );
  }
}

// ===========================================================================
// 3. EmrImmunizationLedgerElement (`emr-immunization-ledger`)
// ===========================================================================

export class EmrImmunizationLedgerElement extends EmrModelElement<
  EmrImmunizationLedgerViewModel,
  EmrImmunizationLedgerIntent
> {
  static override styles = [emrShadowStyles, mpsStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const cov = summarizeImmunizationCoverage(m.doses);

    return this.panel(
      m.title ?? 'National UIP / IAP Immunization Ledger',
      html`
        <div class="mps-row">
          <span class="emr-badge">${m.scheduleStandard}</span>
          <span>Administered: ${cov.administeredCount} · Due: ${cov.dueCount} · Overdue: ${cov.overdueCount}</span>
        </div>
        <div class="mps-row" role="group" aria-label="Filter doses">
          ${(['all', 'due-overdue', 'administered'] as const).map(
            (filter) => html`
              <button
                type="button"
                class="mps-chip"
                aria-pressed=${(m.activeFilter ?? 'all') === filter ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'filterChanged', filter });
                  }
                }}
              >
                ${filter}
              </button>
            `,
          )}
        </div>
        <table class="emr-table">
          <thead>
            <tr>
              <th>Cohort</th>
              <th>Vaccine</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${m.doses.map(
              (dose) => html`
                <tr>
                  <td>${dose.ageGroupLabel}</td>
                  <td>${dose.vaccineName} (${dose.doseNumberLabel})</td>
                  <td>${dose.status}</td>
                  <td>
                    <button
                      type="button"
                      class="mps-chip"
                      ?disabled=${readOnly}
                      @click=${() => {
                        if (!readOnly) {
                          this.send({ type: 'doseSelected', doseId: dose.id });
                        }
                      }}
                    >
                      Inspect ${dose.id}
                    </button>
                    ${dose.status === 'due' || dose.status === 'overdue'
                      ? html`
                          <button
                            type="button"
                            class="mps-chip"
                            ?disabled=${readOnly}
                            @click=${() => {
                              if (!readOnly) {
                                this.send({
                                  type: 'administerDoseRequested',
                                  doseId: dose.id,
                                  vaccineName: dose.vaccineName,
                                });
                              }
                            }}
                          >
                            Administer ${dose.vaccineName}
                          </button>
                        `
                      : nothing}
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      `,
    );
  }
}

// ===========================================================================
// 4. EmrWaveformStripViewerElement (`emr-waveform-strip-viewer`)
// ===========================================================================

export class EmrWaveformStripViewerElement extends EmrModelElement<
  EmrWaveformStripViewerViewModel,
  EmrWaveformStripViewerIntent
> {
  static override styles = [emrShadowStyles, mpsStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const activeLead = m.leads.find((l) => l.id === m.activeLeadId) ?? m.leads[0];

    return this.panel(
      m.title ?? `${m.modality} Waveform Strip Viewer`,
      html`
        <div class="mps-row">
          <span class="emr-badge">${m.modality}</span>
          <span>
            HR: ${m.intervals.hrBpm} bpm · PR: ${m.intervals.prMs ?? 0} ms · QRS:
            ${m.intervals.qrsMs ?? 0} ms · QTc: ${m.intervals.qtcMs ?? 0} ms
          </span>
        </div>
        <div class="mps-row" role="group" aria-label="Leads">
          ${m.leads.map(
            (lead) => html`
              <button
                type="button"
                class="mps-chip"
                aria-pressed=${m.activeLeadId === lead.id ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'leadSelected', leadId: lead.id });
                  }
                }}
              >
                ${lead.label}
              </button>
            `,
          )}
        </div>
        <div class="mps-row" role="group" aria-label="Paper speed">
          ${(['25 mm/s', '50 mm/s'] as const).map(
            (paperSpeed) => html`
              <button
                type="button"
                class="mps-chip"
                aria-pressed=${m.paperSpeed === paperSpeed ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'paperSpeedChanged', paperSpeed });
                  }
                }}
              >
                ${paperSpeed}
              </button>
            `,
          )}
        </div>
        ${activeLead
          ? html`<p>${activeLead.label}: ${activeLead.samplePoints.join(', ')}</p>`
          : nothing}
        <div class="mps-row">
          <span>Interpretation: ${m.interpretation}</span>
          ${!m.signed
            ? html`
                <button
                  type="button"
                  class="mps-chip"
                  ?disabled=${readOnly}
                  @click=${() => {
                    if (!readOnly) {
                      this.send({ type: 'signInterpretationRequested' });
                    }
                  }}
                >
                  Sign Interpretation
                </button>
              `
            : html`<span class="emr-badge">✓ Signed</span>`}
        </div>
      `,
    );
  }
}

// ===========================================================================
// 5. EmrOdontogramElement (`emr-odontogram`)
// ===========================================================================

export class EmrOdontogramElement extends EmrModelElement<
  EmrOdontogramViewModel,
  EmrOdontogramIntent
> {
  static override styles = [emrShadowStyles, mpsStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const dmft = computeDmftIndex(m.teeth);
    const selectedTooth =
      m.teeth.find((t) => t.toothNumber === m.selectedToothNumber) ?? m.teeth[0];

    return this.panel(
      m.title ?? 'FDI Dental Arch Odontogram',
      html`
        <div class="mps-row">
          <span class="emr-badge">
            DMFT: ${dmft.dmftTotal} (D=${dmft.decayed} M=${dmft.missing} F=${dmft.filled})
          </span>
          ${(['permanent-fdi', 'deciduous-fdi'] as const).map(
            (dentitionMode) => html`
              <button
                type="button"
                class="mps-chip"
                aria-pressed=${m.dentitionMode === dentitionMode ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'dentitionModeChanged', dentitionMode });
                  }
                }}
              >
                ${dentitionMode}
              </button>
            `,
          )}
        </div>
        <div class="mps-row" role="group" aria-label="Dental arch">
          ${m.teeth.map(
            (tooth) => html`
              <button
                type="button"
                class="mps-chip"
                aria-pressed=${m.selectedToothNumber === tooth.toothNumber ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'toothSelected', toothNumber: tooth.toothNumber });
                  }
                }}
              >
                #${tooth.toothNumber} (${tooth.status})
              </button>
            `,
          )}
        </div>
        ${selectedTooth
          ? html`
              <div class="mps-row" role="group" aria-label="Tooth status">
                ${(
                  [
                    'sound',
                    'caries',
                    'restored-filling',
                    'crown',
                    'missing',
                    'endodontic-rct',
                    'implant',
                  ] as const
                ).map(
                  (status) => html`
                    <button
                      type="button"
                      class="mps-chip"
                      aria-pressed=${selectedTooth.status === status ? 'true' : 'false'}
                      ?disabled=${readOnly}
                      @click=${() => {
                        if (!readOnly) {
                          this.send({
                            type: 'toothStatusChanged',
                            toothNumber: selectedTooth.toothNumber,
                            status,
                          });
                        }
                      }}
                    >
                      ${status}
                    </button>
                  `,
                )}
              </div>
            `
          : nothing}
      `,
    );
  }
}

// ===========================================================================
// 6. EmrAudiogramElement (`emr-audiogram`)
// ===========================================================================

export class EmrAudiogramElement extends EmrModelElement<
  EmrAudiogramViewModel,
  EmrAudiogramIntent
> {
  static override styles = [emrShadowStyles, mpsStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const ears = [m.rightEar, m.leftEar];

    return this.panel(
      m.title ?? 'Bilateral Pure-Tone Audiogram',
      html`
        <div class="mps-row" role="group" aria-label="Conduction view">
          ${(['both', 'air', 'bone'] as const).map(
            (view) => html`
              <button
                type="button"
                class="mps-chip"
                aria-pressed=${(m.activeConductionView ?? 'both') === view ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'conductionViewChanged', view });
                  }
                }}
              >
                ${view}
              </button>
            `,
          )}
        </div>
        <div class="mps-grid">
          ${ears.map(
            (earRec) => html`
              <article class="mps-card" aria-label=${`${earRec.ear} ear`}>
                <strong>
                  ${earRec.ear} Ear · PTA ${earRec.ptaDbHl} dB HL · Tymp ${earRec.tympanogramType}
                </strong>
                <span>${earRec.degreeClassification}</span>
                <div class="mps-row">
                  ${earRec.thresholds.map(
                    (th) => html`
                      <button
                        type="button"
                        class="mps-chip"
                        ?disabled=${readOnly}
                        @click=${() => {
                          if (!readOnly) {
                            this.send({
                              type: 'thresholdSelected',
                              ear: earRec.ear,
                              frequencyHz: th.frequencyHz,
                            });
                          }
                        }}
                      >
                        ${th.frequencyHz}Hz: ${th.airDbHl}dB
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
// 7. EmrChemoRegimenRoadmapElement (`emr-chemo-regimen-roadmap`)
// ===========================================================================

export class EmrChemoRegimenRoadmapElement extends EmrModelElement<
  EmrChemoRegimenRoadmapViewModel,
  EmrChemoRegimenRoadmapIntent
> {
  static override styles = [emrShadowStyles, mpsStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;

    return this.panel(
      m.title ?? `${m.protocolName} Chemotherapy Roadmap`,
      html`
        <div class="mps-row">
          <span class="emr-badge">${m.protocolName}</span>
          <span>
            BSA: ${m.bsaM2.toFixed(2)} m² · ECOG: ${m.ecogStatus} · ANC: ${m.ancCountLabel} ·
            Platelets: ${m.plateletCountLabel}
          </span>
        </div>
        <table class="emr-table">
          <thead>
            <tr>
              <th>Cycle</th>
              <th>Status</th>
              <th>Dose</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${m.cycles.map(
              (cyc) => html`
                <tr>
                  <td>Cycle ${cyc.cycleNumber} (${cyc.plannedDate})</td>
                  <td>${cyc.status}</td>
                  <td>${cyc.dosePct}%</td>
                  <td>
                    <button
                      type="button"
                      class="mps-chip"
                      ?disabled=${readOnly}
                      @click=${() => {
                        if (!readOnly) {
                          this.send({ type: 'cycleSelected', cycleNumber: cyc.cycleNumber });
                        }
                      }}
                    >
                      Select C${cyc.cycleNumber}
                    </button>
                    <button
                      type="button"
                      class="mps-chip"
                      ?disabled=${readOnly}
                      @click=${() => {
                        if (!readOnly) {
                          this.send({
                            type: 'cycleDoseAdjusted',
                            cycleNumber: cyc.cycleNumber,
                            dosePct: 80,
                          });
                        }
                      }}
                    >
                      Reduce 80%
                    </button>
                    ${!m.labClearancePassed
                      ? html`
                          <button
                            type="button"
                            class="mps-chip"
                            ?disabled=${readOnly}
                            @click=${() => {
                              if (!readOnly) {
                                this.send({
                                  type: 'clearanceOverrideRequested',
                                  cycleNumber: cyc.cycleNumber,
                                });
                              }
                            }}
                          >
                            Override Gate C${cyc.cycleNumber}
                          </button>
                        `
                      : nothing}
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      `,
    );
  }
}

// ===========================================================================
// 8. EmrReferralTrackerElement (`emr-referral-tracker`)
// ===========================================================================

export class EmrReferralTrackerElement extends EmrModelElement<
  EmrReferralTrackerViewModel,
  EmrReferralTrackerIntent
> {
  static override styles = [emrShadowStyles, mpsStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;

    return this.panel(
      m.title ?? 'Closed-Loop Specialty Referral Tracker',
      html`
        <div class="mps-row" role="group" aria-label="Filter referrals">
          ${(['all', 'open', 'completed-report-filed'] as const).map(
            (filter) => html`
              <button
                type="button"
                class="mps-chip"
                aria-pressed=${(m.activeFilter ?? 'all') === filter ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'filterChanged', filter });
                  }
                }}
              >
                ${filter}
              </button>
            `,
          )}
        </div>
        <table class="emr-table">
          <thead>
            <tr>
              <th>Specialty</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${m.referrals.map(
              (ref) => html`
                <tr>
                  <td>${ref.targetSpecialty}</td>
                  <td>${ref.urgency}</td>
                  <td>${ref.status}</td>
                  <td>
                    <button
                      type="button"
                      class="mps-chip"
                      ?disabled=${readOnly}
                      @click=${() => {
                        if (!readOnly) {
                          this.send({ type: 'referralSelected', referralId: ref.id });
                        }
                      }}
                    >
                      Select ${ref.id}
                    </button>
                    <button
                      type="button"
                      class="mps-chip"
                      ?disabled=${readOnly}
                      @click=${() => {
                        if (!readOnly) {
                          this.send({
                            type: 'referralStatusUpdated',
                            referralId: ref.id,
                            status: 'completed-report-filed',
                          });
                        }
                      }}
                    >
                      Mark Completed
                    </button>
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      `,
    );
  }
}

// ===========================================================================
// 9. EmrEncounterChargeSheetElement (`emr-encounter-charge-sheet`)
// ===========================================================================

export class EmrEncounterChargeSheetElement extends EmrModelElement<
  EmrEncounterChargeSheetViewModel,
  EmrEncounterChargeSheetIntent
> {
  static override styles = [emrShadowStyles, mpsStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const totals = calculateEncounterChargeTotals(m.lineItems);
    const curr = m.currencySymbol ?? '₹';

    return this.panel(
      m.title ?? 'Encounter Coding, Tariff & Pre-Auth Charge Sheet',
      html`
        <div class="mps-row">
          <span class="emr-badge">${m.payerScheme} · ${m.preAuthStatus}</span>
          <span>
            Gross: ${curr}${totals.grossTotal.toFixed(2)} · Covered:
            ${curr}${totals.payerCoveredTotal.toFixed(2)} · Payable:
            ${curr}${totals.patientPayableTotal.toFixed(2)}
          </span>
          <button
            type="button"
            class="mps-chip"
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) {
                this.send({ type: 'submitClaimRequested' });
              }
            }}
          >
            Submit Claim
          </button>
        </div>
        <table class="emr-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Coverage</th>
            </tr>
          </thead>
          <tbody>
            ${m.lineItems.map(
              (item) => html`
                <tr>
                  <td>${item.code}</td>
                  <td>${item.description}</td>
                  <td>
                    <input
                      type="number"
                      aria-label=${`Quantity ${item.code}`}
                      .value=${String(item.quantity)}
                      ?disabled=${readOnly}
                      @change=${(e: Event) => {
                        if (!readOnly) {
                          const qty = Number((e.target as HTMLInputElement).value);
                          if (Number.isFinite(qty) && qty >= 0) {
                            this.send({
                              type: 'lineQuantityChanged',
                              itemId: item.id,
                              quantity: qty,
                            });
                          }
                        }
                      }}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      class="mps-chip"
                      aria-pressed=${item.coveredByPayer ? 'true' : 'false'}
                      ?disabled=${readOnly}
                      @click=${() => {
                        if (!readOnly) {
                          this.send({
                            type: 'coverageToggled',
                            itemId: item.id,
                            coveredByPayer: !item.coveredByPayer,
                          });
                        }
                      }}
                    >
                      ${item.coveredByPayer ? 'Payer Covered' : 'Self-Pay'}
                    </button>
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      `,
    );
  }
}

// ===========================================================================
// 10. EmrAbdmHealthLockerPanelElement (`emr-abdm-health-locker-panel`)
// ===========================================================================

export class EmrAbdmHealthLockerPanelElement extends EmrModelElement<
  EmrAbdmHealthLockerPanelViewModel,
  EmrAbdmHealthLockerPanelIntent
> {
  static override styles = [emrShadowStyles, mpsStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;

    return this.panel(
      m.title ?? 'ABDM Health Locker & Consent Panel',
      html`
        <div class="mps-row">
          <span class="emr-badge">${m.abhaNumber} · ${m.abhaAddress}</span>
          <span>Linked Care Contexts: ${m.linkedCareContextsCount}</span>
          <button
            type="button"
            class="mps-chip"
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) {
                this.send({ type: 'requestNewConsent' });
              }
            }}
          >
            + Request Consent
          </button>
          <button
            type="button"
            class="mps-chip"
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) {
                this.send({ type: 'linkCareContextRequested' });
              }
            }}
          >
            Link Care Context
          </button>
        </div>
        <table class="emr-table">
          <thead>
            <tr>
              <th>Requester HIU</th>
              <th>Status</th>
              <th>HI Types</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${m.consents.map(
              (con) => html`
                <tr>
                  <td>${con.requesterHiuName}</td>
                  <td>${con.status}</td>
                  <td>${con.hiTypes.join(', ')}</td>
                  <td>
                    <button
                      type="button"
                      class="mps-chip"
                      ?disabled=${readOnly}
                      @click=${() => {
                        if (!readOnly) {
                          this.send({ type: 'consentSelected', consentId: con.id });
                        }
                      }}
                    >
                      Select ${con.id}
                    </button>
                    ${con.status === 'REQUESTED'
                      ? html`
                          <button
                            type="button"
                            class="mps-chip"
                            ?disabled=${readOnly}
                            @click=${() => {
                              if (!readOnly) {
                                this.send({
                                  type: 'consentActionRequested',
                                  consentId: con.id,
                                  action: 'approve',
                                });
                              }
                            }}
                          >
                            Approve ${con.id}
                          </button>
                        `
                      : nothing}
                    ${con.status === 'GRANTED'
                      ? html`
                          <button
                            type="button"
                            class="mps-chip"
                            ?disabled=${readOnly}
                            @click=${() => {
                              if (!readOnly) {
                                this.send({
                                  type: 'consentActionRequested',
                                  consentId: con.id,
                                  action: 'revoke',
                                });
                              }
                            }}
                          >
                            Revoke ${con.id}
                          </button>
                        `
                      : nothing}
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      `,
    );
  }
}

export function registerL4MaternalPedsSpecialtyAbdmElements(): void {
  defineEmrElement('emr-partogram', EmrPartogramElement);
  defineEmrElement('emr-growth-chart', EmrGrowthChartElement);
  defineEmrElement('emr-immunization-ledger', EmrImmunizationLedgerElement);
  defineEmrElement('emr-waveform-strip-viewer', EmrWaveformStripViewerElement);
  defineEmrElement('emr-odontogram', EmrOdontogramElement);
  defineEmrElement('emr-audiogram', EmrAudiogramElement);
  defineEmrElement('emr-chemo-regimen-roadmap', EmrChemoRegimenRoadmapElement);
  defineEmrElement('emr-referral-tracker', EmrReferralTrackerElement);
  defineEmrElement('emr-encounter-charge-sheet', EmrEncounterChargeSheetElement);
  defineEmrElement('emr-abdm-health-locker-panel', EmrAbdmHealthLockerPanelElement);
}
