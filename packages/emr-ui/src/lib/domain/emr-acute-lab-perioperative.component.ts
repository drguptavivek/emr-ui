import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ClinicalAssessmentStatus, EmrBadge, EmrTone } from '@drguptavivek/emr-controller';

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

const SHARED_ACUTE_STYLES = `
  :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
  .emr-acute-card { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; display: grid; gap: 14px; padding: 16px; }
  .emr-acute-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 10px; border-bottom: 1px solid var(--emr-border); padding-bottom: 12px; }
  .emr-acute-title-wrap { display: grid; gap: 4px; }
  .emr-acute-tag { display: inline-block; width: fit-content; padding: 2px 8px; border-radius: 6px; background: var(--emr-primary-soft); color: var(--emr-primary); font-family: var(--emr-font-mono); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); letter-spacing: 0.05em; }
  .emr-acute-title { margin: 0; font-size: var(--emr-text-lg); font-weight: var(--emr-weight-bold); }
  .emr-acute-sub { margin: 0; font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
  .emr-acute-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .emr-acute-panel { border: 1px solid var(--emr-border); border-radius: 10px; background: var(--emr-surface-raised); padding: 12px; display: grid; gap: 10px; min-width: 0; }
  .emr-acute-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
  .emr-acute-badge { padding: 2px 8px; border-radius: 999px; border: 1px solid var(--emr-border); background: var(--emr-surface-soft); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); font-family: var(--emr-font-mono); }
  .emr-acute-badge[data-tone="warning"] { background: var(--emr-warning-soft); color: var(--emr-warning); border-color: var(--emr-warning); }
  .emr-acute-badge[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); border-color: var(--emr-danger); }
  .emr-acute-badge[data-tone="success"] { background: var(--emr-success-soft); color: var(--emr-success); border-color: var(--emr-success); }
  .emr-acute-badge[data-tone="info"] { background: var(--emr-info-soft); color: var(--emr-info); border-color: var(--emr-info); }
  .emr-acute-kv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(115px, 1fr)); gap: 8px; margin: 0; }
  .emr-acute-kv { padding: 6px 8px; border-radius: 8px; border: 1px solid var(--emr-border); background: var(--emr-surface); }
  .emr-acute-kv dt { font-size: var(--emr-text-2xs); color: var(--emr-text-muted); text-transform: uppercase; font-weight: var(--emr-weight-bold); }
  .emr-acute-kv dd { margin: 2px 0 0; font-family: var(--emr-font-mono); font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); }
  .emr-acute-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .emr-acute-chip { min-height: var(--emr-compact-height); padding: 4px 10px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); cursor: pointer; }
  .emr-acute-chip[aria-pressed="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary); }
  .emr-acute-chip:disabled { opacity: 0.6; cursor: not-allowed; }
  .emr-acute-table-wrap { overflow-x: auto; border: 1px solid var(--emr-border); border-radius: 8px; background: var(--emr-surface); }
  .emr-acute-table { width: 100%; border-collapse: collapse; font-size: var(--emr-text-xs); }
  .emr-acute-table th, .emr-acute-table td { padding: 6px 8px; border-bottom: 1px solid var(--emr-border); text-align: left; }
  .emr-acute-table thead th { background: var(--emr-surface-soft); color: var(--emr-text-muted); font-weight: var(--emr-weight-bold); text-transform: uppercase; font-size: var(--emr-text-2xs); }
  .emr-acute-table tr[data-selected="true"] { background: var(--emr-primary-soft); }
  .emr-acute-alert { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--emr-danger); background: var(--emr-danger-soft); color: var(--emr-text); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-medium); }
  @media (max-width: 760px) { .emr-acute-grid-2 { grid-template-columns: minmax(0, 1fr); } }
`;

// ===========================================================================
// 1. EmrEdTrackBoardComponent (`emr-ed-track-board`)
// ===========================================================================

@Component({
  selector: 'emr-ed-track-board',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let summary = censusSummary();
    <section
      class="emr-acute-card"
      role="region"
      [attr.aria-labelledby]="headingId() || m.id + '-title'"
    >
      <header class="emr-acute-head">
        <div class="emr-acute-title-wrap">
          <span class="emr-acute-tag">EMERGENCY DEPARTMENT TRACK BOARD</span>
          <h3 class="emr-acute-title" [id]="headingId() || m.id + '-title'">
            {{ m.title || 'ED Real-Time Bay Census & Patient Flow' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-acute-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-acute-chips">
          <span class="emr-acute-badge" data-tone="info">
            Census: {{ summary.totalPatients }}
          </span>
          <span class="emr-acute-badge" [attr.data-tone]="summary.criticalEsi12Count > 0 ? 'danger' : 'success'">
            ESI 1–2: {{ summary.criticalEsi12Count }}
          </span>
          <span class="emr-acute-badge" [attr.data-tone]="summary.boardingCount > 0 ? 'warning' : 'info'">
            Boarding: {{ summary.boardingCount }}
          </span>
          <span class="emr-acute-badge" [attr.data-tone]="summary.fourHourBreachCount > 0 ? 'danger' : 'success'">
            &ge;4h LOS: {{ summary.fourHourBreachCount }}
          </span>
        </div>
      </header>

      <div class="emr-acute-chips" role="group" aria-label="ESI Acuity Filter">
        @for (flt of acuityFilters; track flt) {
          <button
            type="button"
            class="emr-acute-chip"
            [disabled]="!!m.readOnly"
            [attr.aria-pressed]="(m.activeAcuityFilter || 'all') === flt"
            (click)="selectAcuityFilter(flt)"
          >
            {{ flt === 'all' ? 'All Acuities' : 'ESI ' + flt }}
          </button>
        }
      </div>

      <div class="emr-acute-table-wrap">
        <table class="emr-acute-table" aria-label="ED Patient Track Board">
          <thead>
            <tr>
              <th scope="col">Bay</th>
              <th scope="col">Patient</th>
              <th scope="col">ESI</th>
              <th scope="col">Chief Complaint</th>
              <th scope="col">LOS</th>
              <th scope="col">Pending</th>
              <th scope="col">Disposition</th>
            </tr>
          </thead>
          <tbody>
            @for (pt of visiblePatients(); track pt.id) {
              <tr
                [attr.data-selected]="m.selectedPatientId === pt.id"
                (click)="selectPatient(pt.id)"
              >
                <td><strong>{{ pt.bayLabel }}</strong></td>
                <td>{{ pt.patientName }} ({{ pt.ageSexLabel }})</td>
                <td>
                  <span
                    class="emr-acute-badge"
                    [attr.data-tone]="pt.esiLevel <= 2 ? 'danger' : pt.esiLevel === 3 ? 'warning' : 'info'"
                  >
                    ESI {{ pt.esiLevel }}
                  </span>
                </td>
                <td>{{ pt.chiefComplaint }}</td>
                <td>{{ pt.losMinutes }}m</td>
                <td>Labs: {{ pt.pendingLabsCount }} · Img: {{ pt.pendingImagingCount }}</td>
                <td>
                  <div class="emr-acute-chips">
                    @for (disp of dispositionStates; track disp) {
                      <button
                        type="button"
                        class="emr-acute-chip"
                        [disabled]="!!m.readOnly"
                        [attr.aria-pressed]="pt.disposition === disp"
                        (click)="$event.stopPropagation(); setDisposition(pt.id, disp)"
                      >
                        {{ disp }}
                      </button>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [SHARED_ACUTE_STYLES],
})
export class EmrEdTrackBoardComponent {
  readonly model = input.required<EmrEdTrackBoardViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrEdTrackBoardIntent>();

  readonly acuityFilters = ED_ACUITY_FILTERS;
  readonly dispositionStates = ED_DISPOSITION_STATES;

  censusSummary() {
    return summarizeEdTrackCensus(this.model().patients);
  }

  visiblePatients(): readonly EdTrackPatientRow[] {
    const m = this.model();
    const filter = m.activeAcuityFilter ?? 'all';
    if (filter === 'all') return m.patients;
    return m.patients.filter((pt) => pt.esiLevel === filter);
  }

  selectAcuityFilter(filter: 'all' | 1 | 2 | 3 | 4 | 5): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'acuityFilterChanged', filter });
  }

  selectPatient(patientId: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'patientSelected', patientId });
  }

  setDisposition(patientId: string, disposition: EdTrackPatientRow['disposition']): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'dispositionChanged', patientId, disposition });
  }
}

// ===========================================================================
// 2. EmrTriageAssessmentCardComponent (`emr-triage-assessment-card`)
// ===========================================================================

@Component({
  selector: 'emr-triage-assessment-card',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-acute-card"
      role="region"
      [attr.aria-labelledby]="headingId() || m.id + '-title'"
    >
      <header class="emr-acute-head">
        <div class="emr-acute-title-wrap">
          <span class="emr-acute-tag">EMERGENCY TRIAGE ASSESSMENT</span>
          <h3 class="emr-acute-title" [id]="headingId() || m.id + '-title'">
            {{ m.title || 'ESI / MTS Primary Survey & Triage Assessment' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-acute-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-acute-chips">
          <span class="emr-acute-badge" data-tone="info">{{ m.arrivalMode }}</span>
          <span
            class="emr-acute-badge"
            [attr.data-tone]="m.esiLevel <= 2 ? 'danger' : m.esiLevel === 3 ? 'warning' : 'success'"
          >
            ESI Level {{ m.esiLevel }}
          </span>
          <span class="emr-acute-badge" [attr.data-tone]="m.finalized ? 'success' : 'warning'">
            {{ m.finalized ? '✓ Triage Finalized' : 'Draft Triage' }}
          </span>
        </div>
      </header>

      <div class="emr-acute-panel">
        <strong>Chief Complaint: {{ m.chiefComplaint }}</strong>
        @if (m.redFlags.length > 0) {
          <div class="emr-acute-alert" role="alert">
            Red Flags: {{ m.redFlags.join(' · ') }}
          </div>
        }
        <dl class="emr-acute-kv-grid">
          @for (v of m.vitalsSummary; track v.label) {
            <div class="emr-acute-kv">
              <dt>{{ v.label }}</dt>
              <dd>{{ v.value }} {{ v.abnormal ? '(!)' : '' }}</dd>
            </div>
          }
          <div class="emr-acute-kv">
            <dt>Pain Score</dt>
            <dd>{{ m.painScore }} / 10</dd>
          </div>
        </dl>
      </div>

      <div class="emr-acute-row">
        <div class="emr-acute-chips" role="group" aria-label="ESI Acuity Selector">
          @for (lvl of esiLevels; track lvl) {
            <button
              type="button"
              class="emr-acute-chip"
              [disabled]="!!m.readOnly"
              [attr.aria-pressed]="m.esiLevel === lvl"
              (click)="selectEsiLevel(lvl)"
            >
              ESI {{ lvl }}
            </button>
          }
        </div>

        <div class="emr-acute-chips">
          <button
            type="button"
            class="emr-acute-chip"
            [disabled]="!!m.readOnly"
            [attr.aria-pressed]="m.isolationRequired"
            (click)="toggleIsolation()"
          >
            {{ m.isolationRequired ? '⚠ Isolation Required' : 'Standard Precautions' }}
          </button>
          <button
            type="button"
            class="emr-acute-chip"
            [disabled]="!!m.readOnly || m.finalized"
            (click)="finalizeTriage()"
          >
            Finalize Triage
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [SHARED_ACUTE_STYLES],
})
export class EmrTriageAssessmentCardComponent {
  readonly model = input.required<EmrTriageAssessmentCardViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrTriageAssessmentCardIntent>();

  readonly esiLevels = ED_ESI_LEVELS;

  selectEsiLevel(esiLevel: 1 | 2 | 3 | 4 | 5): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'esiLevelSelected', esiLevel });
  }

  setPainScore(painScore: number): void {
    if (this.model().readOnly) return;
    const bounded = Math.max(0, Math.min(10, Math.round(painScore)));
    this.intent.emit({ type: 'painScoreChanged', painScore: bounded });
  }

  toggleIsolation(): void {
    const m = this.model();
    if (m.readOnly) return;
    this.intent.emit({ type: 'isolationToggled', isolationRequired: !m.isolationRequired });
  }

  finalizeTriage(): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'triageFinalized' });
  }
}

// ===========================================================================
// 3. EmrResuscitationEventLogComponent (`emr-resuscitation-event-log`)
// ===========================================================================

@Component({
  selector: 'emr-resuscitation-event-log',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-acute-card"
      role="region"
      [attr.aria-labelledby]="headingId() || m.id + '-title'"
    >
      <header class="emr-acute-head">
        <div class="emr-acute-title-wrap">
          <span class="emr-acute-tag">ACLS / CODE BLUE RESUSCITATION LOG</span>
          <h3 class="emr-acute-title" [id]="headingId() || m.id + '-title'">
            {{ m.title || 'Real-Time Resuscitation Event Recorder' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-acute-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-acute-chips">
          <span
            class="emr-acute-badge"
            [attr.data-tone]="m.codeStatus === 'active' ? 'danger' : m.codeStatus === 'rosc' ? 'success' : 'info'"
          >
            Status: {{ m.codeStatus.toUpperCase() }}
          </span>
          <span class="emr-acute-badge" data-tone="warning">
            Elapsed: {{ formatElapsed(m.elapsedSeconds) }}
          </span>
        </div>
      </header>

      <dl class="emr-acute-kv-grid">
        <div class="emr-acute-kv">
          <dt>Current Rhythm</dt>
          <dd>{{ m.currentRhythm }}</dd>
        </div>
        <div class="emr-acute-kv">
          <dt>CPR Cycles</dt>
          <dd>{{ m.cprCycles }}</dd>
        </div>
        <div class="emr-acute-kv">
          <dt>Defib Shocks</dt>
          <dd>{{ m.shockCount }}</dd>
        </div>
        <div class="emr-acute-kv">
          <dt>Epinephrine Doses</dt>
          <dd>{{ m.epinephrineDoses }}</dd>
        </div>
      </dl>

      <div class="emr-acute-row">
        <div class="emr-acute-chips" role="group" aria-label="Rhythm Strip Selector">
          @for (rhythm of rhythms; track rhythm) {
            <button
              type="button"
              class="emr-acute-chip"
              [disabled]="!!m.readOnly"
              [attr.aria-pressed]="m.currentRhythm === rhythm"
              (click)="selectRhythm(rhythm)"
            >
              {{ rhythm }}
            </button>
          }
        </div>

        <div class="emr-acute-chips" role="group" aria-label="Code Status Selector">
          @for (st of statuses; track st) {
            <button
              type="button"
              class="emr-acute-chip"
              [disabled]="!!m.readOnly"
              [attr.aria-pressed]="m.codeStatus === st"
              (click)="setCodeStatus(st)"
            >
              {{ st.toUpperCase() }}
            </button>
          }
        </div>
      </div>

      <div class="emr-acute-chips" role="group" aria-label="One-Tap ACLS Actions">
        @for (act of quickActions; track act.id) {
          <button
            type="button"
            class="emr-acute-chip"
            [disabled]="!!m.readOnly"
            (click)="logQuickAction(act.id)"
          >
            {{ act.label }}
          </button>
        }
      </div>

      <div class="emr-acute-table-wrap">
        <table class="emr-acute-table" aria-label="Resuscitation Timestamped Log">
          <thead>
            <tr>
              <th scope="col">Timestamp</th>
              <th scope="col">Category</th>
              <th scope="col">Intervention</th>
              <th scope="col">Clinician</th>
            </tr>
          </thead>
          <tbody>
            @for (ev of m.events; track ev.id) {
              <tr>
                <td><strong>{{ ev.timestampLabel }}</strong></td>
                <td>{{ ev.category }}</td>
                <td>{{ ev.description }}</td>
                <td>{{ ev.clinician || 'Code Team' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [SHARED_ACUTE_STYLES],
})
export class EmrResuscitationEventLogComponent {
  readonly model = input.required<EmrResuscitationEventLogViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrResuscitationEventLogIntent>();

  readonly rhythms = RESUSCITATION_RHYTHMS;
  readonly statuses = RESUSCITATION_STATUSES;
  readonly quickActions = RESUSCITATION_QUICK_ACTIONS;

  formatElapsed(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  logQuickAction(action: ResuscitationQuickAction): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'quickActionLogged', action });
  }

  selectRhythm(rhythm: EmrResuscitationEventLogViewModel['currentRhythm']): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'rhythmChanged', rhythm });
  }

  setCodeStatus(status: EmrResuscitationEventLogViewModel['codeStatus']): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'codeStatusChanged', status });
  }
}

// ===========================================================================
// 4. EmrSpecimenCollectionBarComponent (`emr-specimen-collection-bar`)
// ===========================================================================

@Component({
  selector: 'emr-specimen-collection-bar',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-acute-card"
      role="region"
      [attr.aria-labelledby]="headingId() || m.id + '-title'"
    >
      <header class="emr-acute-head">
        <div class="emr-acute-title-wrap">
          <span class="emr-acute-tag">PHLEBOTOMY & SPECIMEN BARCODE VERIFICATION</span>
          <h3 class="emr-acute-title" [id]="headingId() || m.id + '-title'">
            {{ m.title || 'Specimen Collection & Wristband Verification' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-acute-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-acute-chips">
          <span class="emr-acute-badge" data-tone="info">
            Accession: {{ m.orderAccession }}
          </span>
          <button
            type="button"
            class="emr-acute-chip"
            [disabled]="!!m.readOnly"
            [attr.aria-pressed]="m.patientVerified"
            (click)="togglePatientVerification()"
          >
            {{ m.patientVerified ? '✓ 2-ID Wristband Verified' : 'Verify Patient ID' }}
          </button>
        </div>
      </header>

      <div class="emr-acute-table-wrap">
        <table class="emr-acute-table" aria-label="Specimen Containers">
          <thead>
            <tr>
              <th scope="col">Barcode</th>
              <th scope="col">Tube / Container</th>
              <th scope="col">Tests</th>
              <th scope="col">Volume</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (ct of m.containers; track ct.id) {
              <tr>
                <td><strong>{{ ct.barcode }}</strong></td>
                <td>{{ ct.tubeType }} {{ ct.stat ? '(STAT)' : '' }}</td>
                <td>{{ ct.testsSummary }}</td>
                <td>{{ ct.volumeMl }} mL</td>
                <td>
                  <span
                    class="emr-acute-badge"
                    [attr.data-tone]="ct.status === 'rejected-hemolyzed' ? 'danger' : ct.status === 'pending' ? 'warning' : 'success'"
                  >
                    {{ ct.status }}
                  </span>
                </td>
                <td>
                  <div class="emr-acute-chips">
                    <button
                      type="button"
                      class="emr-acute-chip"
                      [disabled]="!!m.readOnly"
                      (click)="scanContainer(ct.id, ct.barcode)"
                    >
                      Scan Collect
                    </button>
                    <button
                      type="button"
                      class="emr-acute-chip"
                      [disabled]="!!m.readOnly"
                      (click)="rejectContainer(ct.id, 'Hemolyzed / Clotted')"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [SHARED_ACUTE_STYLES],
})
export class EmrSpecimenCollectionBarComponent {
  readonly model = input.required<EmrSpecimenCollectionBarViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrSpecimenCollectionBarIntent>();

  togglePatientVerification(): void {
    const m = this.model();
    if (m.readOnly) return;
    this.intent.emit({ type: 'patientVerificationToggled', verified: !m.patientVerified });
  }

  scanContainer(containerId: string, barcode: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'containerScanned', containerId, barcode });
  }

  rejectContainer(containerId: string, reason: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'containerRejected', containerId, reason });
  }
}

// ===========================================================================
// 5. EmrLabCumulativeGridComponent (`emr-lab-cumulative-grid`)
// ===========================================================================

@Component({
  selector: 'emr-lab-cumulative-grid',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let critCount = criticalCellCount();
    <section
      class="emr-acute-card"
      role="region"
      [attr.aria-labelledby]="headingId() || m.id + '-title'"
    >
      <header class="emr-acute-head">
        <div class="emr-acute-title-wrap">
          <span class="emr-acute-tag">LONGITUDINAL LABORATORY FLOWSHEET</span>
          <h3 class="emr-acute-title" [id]="headingId() || m.id + '-title'">
            {{ m.title || m.panelName }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-acute-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-acute-chips">
          <span class="emr-acute-badge" [attr.data-tone]="critCount > 0 ? 'danger' : 'success'">
            Critical Values: {{ critCount }}
          </span>
          <button
            type="button"
            class="emr-acute-chip"
            [disabled]="!!m.readOnly"
            [attr.aria-pressed]="!!m.showAbnormalOnly"
            (click)="toggleAbnormalFilter()"
          >
            {{ m.showAbnormalOnly ? 'Showing Abnormal Only' : 'Show Abnormal Only' }}
          </button>
        </div>
      </header>

      <div class="emr-acute-table-wrap">
        <table class="emr-acute-table" aria-label="Cumulative Laboratory Flowsheet">
          <thead>
            <tr>
              <th scope="col">Analyte</th>
              <th scope="col">Reference Range</th>
              @for (col of m.columns; track col.id) {
                <th scope="col">{{ col.dateLabel }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of visibleRows(); track row.id) {
              <tr>
                <td><strong>{{ row.analyteName }}</strong> ({{ row.unit }})</td>
                <td>{{ row.referenceRange }}</td>
                @for (col of m.columns; track col.id) {
                  @let cell = row.values[col.id];
                  <td>
                    @if (cell) {
                      <div class="emr-acute-chips">
                        <button
                          type="button"
                          class="emr-acute-chip"
                          [disabled]="!!m.readOnly"
                          [attr.aria-pressed]="m.selectedCell?.analyteId === row.id && m.selectedCell.columnId === col.id"
                          (click)="selectCell(row.id, col.id)"
                        >
                          {{ cell.value }} ({{ cell.flag }})
                        </button>
                        @if (cell.flag === 'critical-low' || cell.flag === 'critical-high') {
                          <button
                            type="button"
                            class="emr-acute-chip"
                            [disabled]="!!m.readOnly"
                            (click)="acknowledgeCritical(row.id, col.id)"
                          >
                            Ack Critical
                          </button>
                        }
                      </div>
                    } @else {
                      <span>—</span>
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [SHARED_ACUTE_STYLES],
})
export class EmrLabCumulativeGridComponent {
  readonly model = input.required<EmrLabCumulativeGridViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrLabCumulativeGridIntent>();

  criticalCellCount(): number {
    return countLabCriticalCells(this.model().rows);
  }

  visibleRows(): readonly LabCumulativeAnalyteRow[] {
    const m = this.model();
    if (!m.showAbnormalOnly) return m.rows;
    return m.rows.filter((row) =>
      Object.values(row.values).some((cell) => cell.flag !== 'normal'),
    );
  }

  toggleAbnormalFilter(): void {
    const m = this.model();
    if (m.readOnly) return;
    this.intent.emit({ type: 'abnormalFilterToggled', showAbnormalOnly: !m.showAbnormalOnly });
  }

  selectCell(analyteId: string, columnId: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'cellSelected', analyteId, columnId });
  }

  acknowledgeCritical(analyteId: string, columnId: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'criticalAcknowledgeRequested', analyteId, columnId });
  }
}

// ===========================================================================
// 6. EmrMicrobiologyAntibiogramComponent (`emr-microbiology-antibiogram`)
// ===========================================================================

@Component({
  selector: 'emr-microbiology-antibiogram',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-acute-card"
      role="region"
      [attr.aria-labelledby]="headingId() || m.id + '-title'"
    >
      <header class="emr-acute-head">
        <div class="emr-acute-title-wrap">
          <span class="emr-acute-tag">CULTURE & SENSITIVITY ANTIBIOGRAM</span>
          <h3 class="emr-acute-title" [id]="headingId() || m.id + '-title'">
            {{ m.title || 'Microbiology Susceptibility Matrix' }}
          </h3>
          <p class="emr-acute-sub">
            {{ m.specimenSource }} · Collected {{ m.collectionDate }}
            {{ m.gramStainSummary ? ' · ' + m.gramStainSummary : '' }}
          </p>
        </div>
        <div class="emr-acute-chips">
          @for (iso of m.isolates; track iso.id) {
            <span
              class="emr-acute-badge"
              [attr.data-tone]="iso.resistanceMechanism ? 'danger' : 'info'"
            >
              {{ iso.organismName }} {{ iso.resistanceMechanism ? '(' + iso.resistanceMechanism + ')' : '' }}
            </span>
          }
        </div>
      </header>

      <div class="emr-acute-table-wrap">
        <table class="emr-acute-table" aria-label="Antibiogram Susceptibility Matrix">
          <thead>
            <tr>
              <th scope="col">Antimicrobial</th>
              <th scope="col">Class</th>
              @for (iso of m.isolates; track iso.id) {
                <th scope="col">{{ iso.organismName }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of m.rows; track row.antibioticId) {
              <tr
                [attr.data-selected]="m.selectedAntibioticId === row.antibioticId"
                (click)="selectAntibiotic(row.antibioticId)"
              >
                <td>
                  <strong>{{ row.antibioticName }}</strong>
                  @if (row.stewardshipPreferred) {
                    <span class="emr-acute-badge" data-tone="success">Stewardship Preferred</span>
                  }
                </td>
                <td>{{ row.classLabel || '—' }}</td>
                @for (iso of m.isolates; track iso.id) {
                  @let res = row.resultsByIsolate[iso.id];
                  <td>
                    @if (res) {
                      <div class="emr-acute-chips">
                        <span
                          class="emr-acute-badge"
                          [attr.data-tone]="res.interpretation === 'S' ? 'success' : res.interpretation === 'I' ? 'warning' : 'danger'"
                        >
                          {{ res.interpretation }} {{ res.micLabel ? '(' + res.micLabel + ')' : '' }}
                        </span>
                        @if (res.interpretation === 'S') {
                          <button
                            type="button"
                            class="emr-acute-chip"
                            [disabled]="!!m.readOnly"
                            (click)="$event.stopPropagation(); requestStewardshipOrder(row.antibioticId, iso.id)"
                          >
                            Order Targeted Rx
                          </button>
                        }
                      </div>
                    } @else {
                      <span>—</span>
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [SHARED_ACUTE_STYLES],
})
export class EmrMicrobiologyAntibiogramComponent {
  readonly model = input.required<EmrMicrobiologyAntibiogramViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrMicrobiologyAntibiogramIntent>();

  selectAntibiotic(antibioticId: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'antibioticSelected', antibioticId });
  }

  requestStewardshipOrder(antibioticId: string, isolateId: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'stewardshipOrderRequested', antibioticId, isolateId });
  }
}

// ===========================================================================
// 7. EmrAnaesthesiaRecordComponent (`emr-anaesthesia-record`)
// ===========================================================================

@Component({
  selector: 'emr-anaesthesia-record',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-acute-card"
      role="region"
      [attr.aria-labelledby]="headingId() || m.id + '-title'"
    >
      <header class="emr-acute-head">
        <div class="emr-acute-title-wrap">
          <span class="emr-acute-tag">INTRA-OPERATIVE ANAESTHESIA RECORD</span>
          <h3 class="emr-acute-title" [id]="headingId() || m.id + '-title'">
            {{ m.title || 'Perioperative Anaesthesia & Physiological Record' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-acute-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-acute-chips">
          <span class="emr-acute-badge" data-tone="info">ASA {{ m.asaClass }}</span>
          <span class="emr-acute-badge" data-tone="info">Mallampati {{ m.mallampatiClass }}</span>
          <span class="emr-acute-badge" data-tone="success">{{ m.airwayDevice }}</span>
        </div>
      </header>

      <div class="emr-acute-row">
        <div class="emr-acute-chips" role="group" aria-label="Anaesthesia Phase">
          @for (ph of phases; track ph) {
            <button
              type="button"
              class="emr-acute-chip"
              [disabled]="!!m.readOnly"
              [attr.aria-pressed]="m.activePhase === ph"
              (click)="selectPhase(ph)"
            >
              {{ ph }}
            </button>
          }
        </div>

        <div class="emr-acute-chips">
          <button
            type="button"
            class="emr-acute-chip"
            [disabled]="!!m.readOnly"
            (click)="addCheckpoint('Now')"
          >
            + Vitals Checkpoint
          </button>
          <button
            type="button"
            class="emr-acute-chip"
            [disabled]="!!m.readOnly"
            (click)="logMedication('Fentanyl', '50 mcg IV')"
          >
            + Log Bolus
          </button>
        </div>
      </div>

      <div class="emr-acute-table-wrap">
        <table class="emr-acute-table" aria-label="Haemodynamic & Ventilation Checkpoints">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">HR (bpm)</th>
              <th scope="col">BP (mmHg)</th>
              <th scope="col">SpO2 (%)</th>
              <th scope="col">EtCO2 (mmHg)</th>
              <th scope="col">MAC (%)</th>
            </tr>
          </thead>
          <tbody>
            @for (cp of m.checkpoints; track cp.id) {
              <tr>
                <td><strong>{{ cp.timeLabel }}</strong></td>
                <td>{{ cp.hrBpm }}</td>
                <td>{{ cp.bpLabel }}</td>
                <td>{{ cp.spo2Pct }}%</td>
                <td>{{ cp.etco2MmHg }}</td>
                <td>{{ cp.macPct !== undefined ? cp.macPct : '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [SHARED_ACUTE_STYLES],
})
export class EmrAnaesthesiaRecordComponent {
  readonly model = input.required<EmrAnaesthesiaRecordViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrAnaesthesiaRecordIntent>();

  readonly phases = ANAESTHESIA_PHASES;

  selectPhase(phase: EmrAnaesthesiaRecordViewModel['activePhase']): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'phaseChanged', phase });
  }

  addCheckpoint(timeLabel: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'checkpointAdded', timeLabel });
  }

  logMedication(drugName: string, doseLabel: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'medicationLogged', drugName, doseLabel });
  }
}

// ===========================================================================
// 8. EmrFluidBalanceChartComponent (`emr-fluid-balance-chart`)
// ===========================================================================

@Component({
  selector: 'emr-fluid-balance-chart',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let summary = balanceSummary();
    <section
      class="emr-acute-card"
      role="region"
      [attr.aria-labelledby]="headingId() || m.id + '-title'"
    >
      <header class="emr-acute-head">
        <div class="emr-acute-title-wrap">
          <span class="emr-acute-tag">24-HOUR FLUID INTAKE & OUTPUT CHART</span>
          <h3 class="emr-acute-title" [id]="headingId() || m.id + '-title'">
            {{ m.title || 'Fluid Balance & Urine Output Flowsheet' }}
          </h3>
          <p class="emr-acute-sub">{{ m.periodLabel }}</p>
        </div>
        <div class="emr-acute-chips">
          <span class="emr-acute-badge" data-tone="info">
            Intake: {{ summary.totalIntakeMl }} mL
          </span>
          <span class="emr-acute-badge" data-tone="warning">
            Output: {{ summary.totalOutputMl }} mL
          </span>
          <span class="emr-acute-badge" [attr.data-tone]="summary.netBalanceMl >= 0 ? 'info' : 'success'">
            Net: {{ summary.netBalanceMl >= 0 ? '+' : '' }}{{ summary.netBalanceMl }} mL
          </span>
        </div>
      </header>

      <div class="emr-acute-grid-2">
        <div class="emr-acute-panel">
          <div class="emr-acute-row">
            <strong>Intake Streams ({{ summary.totalIntakeMl }} mL)</strong>
            <button
              type="button"
              class="emr-acute-chip"
              [disabled]="!!m.readOnly"
              (click)="addEntry('intake', 'IV Crystalloid', 250)"
            >
              + 250 mL IV
            </button>
          </div>
          @for (item of m.intakes; track item.id) {
            <div class="emr-acute-row">
              <span>{{ item.category }} ({{ item.routeOrSite }}): <strong>{{ item.volumeMl }} mL</strong></span>
              <button
                type="button"
                class="emr-acute-chip"
                [disabled]="!!m.readOnly"
                (click)="removeEntry(item.id)"
              >
                Remove
              </button>
            </div>
          }
        </div>

        <div class="emr-acute-panel">
          <div class="emr-acute-row">
            <strong>Output Streams ({{ summary.totalOutputMl }} mL)</strong>
            <button
              type="button"
              class="emr-acute-chip"
              [disabled]="!!m.readOnly"
              (click)="addEntry('output', 'Urine Output', 200)"
            >
              + 200 mL Urine
            </button>
          </div>
          @for (item of m.outputs; track item.id) {
            <div class="emr-acute-row">
              <span>{{ item.category }} ({{ item.routeOrSite }}): <strong>{{ item.volumeMl }} mL</strong></span>
              <button
                type="button"
                class="emr-acute-chip"
                [disabled]="!!m.readOnly"
                (click)="removeEntry(item.id)"
              >
                Remove
              </button>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [SHARED_ACUTE_STYLES],
})
export class EmrFluidBalanceChartComponent {
  readonly model = input.required<EmrFluidBalanceChartViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrFluidBalanceChartIntent>();

  balanceSummary() {
    const m = this.model();
    return computeFluidBalanceSummary(m.intakes, m.outputs);
  }

  addEntry(direction: 'intake' | 'output', category: string, volumeMl: number): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'entryAdded', direction, category, volumeMl });
  }

  removeEntry(entryId: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'entryRemoved', entryId });
  }
}

// ===========================================================================
// 9. EmrSurgicalImplantLogComponent (`emr-surgical-implant-log`)
// ===========================================================================

@Component({
  selector: 'emr-surgical-implant-log',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-acute-card"
      role="region"
      [attr.aria-labelledby]="headingId() || m.id + '-title'"
    >
      <header class="emr-acute-head">
        <div class="emr-acute-title-wrap">
          <span class="emr-acute-tag">PERIOPERATIVE IMPLANT & UDI TRACEABILITY</span>
          <h3 class="emr-acute-title" [id]="headingId() || m.id + '-title'">
            {{ m.title || m.procedureName }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-acute-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-acute-chips">
          <button
            type="button"
            class="emr-acute-chip"
            [disabled]="!!m.readOnly"
            [attr.aria-pressed]="m.countsReconciled"
            (click)="toggleCountsReconciled()"
          >
            {{ m.countsReconciled ? '✓ Surgical Counts Reconciled' : '⚠ Reconcile Surgical Counts' }}
          </button>
        </div>
      </header>

      <div class="emr-acute-table-wrap">
        <table class="emr-acute-table" aria-label="Surgical Implant Traceability Log">
          <thead>
            <tr>
              <th scope="col">Device & Manufacturer</th>
              <th scope="col">Lot / Serial</th>
              <th scope="col">UDI & Expiry</th>
              <th scope="col">Anatomical Site</th>
              <th scope="col">Sterile Check</th>
            </tr>
          </thead>
          <tbody>
            @for (imp of m.implants; track imp.id) {
              <tr
                [attr.data-selected]="m.selectedImplantId === imp.id"
                (click)="selectImplant(imp.id)"
              >
                <td><strong>{{ imp.deviceName }}</strong> · {{ imp.manufacturer }}</td>
                <td>Lot {{ imp.lotNumber }} / SN {{ imp.serialNumber }}</td>
                <td>{{ imp.udiCode }} (Exp {{ imp.expiryDate }})</td>
                <td>{{ imp.anatomicalSite }}</td>
                <td>
                  <button
                    type="button"
                    class="emr-acute-chip"
                    [disabled]="!!m.readOnly"
                    [attr.aria-pressed]="imp.sterileVerified"
                    (click)="$event.stopPropagation(); toggleSterileVerified(imp.id, !imp.sterileVerified)"
                  >
                    {{ imp.sterileVerified ? '✓ Sterile Verified' : 'Verify Sterility' }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [SHARED_ACUTE_STYLES],
})
export class EmrSurgicalImplantLogComponent {
  readonly model = input.required<EmrSurgicalImplantLogViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrSurgicalImplantLogIntent>();

  selectImplant(implantId: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'implantSelected', implantId });
  }

  toggleSterileVerified(implantId: string, sterileVerified: boolean): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'sterileVerifiedToggled', implantId, sterileVerified });
  }

  toggleCountsReconciled(): void {
    const m = this.model();
    if (m.readOnly) return;
    this.intent.emit({ type: 'countsReconciledToggled', countsReconciled: !m.countsReconciled });
  }
}
