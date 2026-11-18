import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ClinicalAssessmentStatus, EmrBadge, EmrTone } from '@drguptavivek/emr-controller';

export type { ClinicalAssessmentStatus, EmrBadge, EmrTone };

// ===========================================================================
// ViewModels, Intents & Pure Helpers (exported locally so Angular SSR and
// shadcn registry items have zero runtime or relative cross-package imports)
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

// ---------------------------------------------------------------------------
// Shared Constants & Styles
// ---------------------------------------------------------------------------

export const PARTOGRAM_MEMBRANE_OPTIONS: readonly EmrPartogramViewModel['membraneStatus'][] = [
  'Intact',
  'Clear Liquor',
  'Meconium Stained',
  'Blood Stained',
];

export const PARTOGRAM_ALERT_OPTIONS: readonly EmrPartogramViewModel['alertStatus'][] = [
  'normal',
  'alert-line',
  'action-line',
];

export const GROWTH_METRIC_OPTIONS: readonly {
  readonly id: EmrGrowthChartViewModel['activeMetric'];
  readonly label: string;
}[] = [
  { id: 'weight-for-age', label: 'Weight-for-Age' },
  { id: 'height-for-age', label: 'Height/Length-for-Age' },
  { id: 'head-circumference', label: 'Head Circumference' },
  { id: 'bmi-for-age', label: 'BMI-for-Age' },
];

export const IMMUNIZATION_FILTER_OPTIONS: readonly {
  readonly id: 'all' | 'due-overdue' | 'administered';
  readonly label: string;
}[] = [
  { id: 'all', label: 'All Doses' },
  { id: 'due-overdue', label: 'Due / Overdue' },
  { id: 'administered', label: 'Administered' },
];

export const PAPER_SPEED_OPTIONS: readonly EmrWaveformStripViewerViewModel['paperSpeed'][] = [
  '25 mm/s',
  '50 mm/s',
];

export const ODONTOGRAM_STATUS_OPTIONS: readonly OdontogramToothRecord['status'][] = [
  'sound',
  'caries',
  'restored-filling',
  'crown',
  'missing',
  'endodontic-rct',
  'implant',
];

export const AUDIOGRAM_CONDUCTION_OPTIONS: readonly ('both' | 'air' | 'bone')[] = [
  'both',
  'air',
  'bone',
];

export const CHEMO_DOSE_OPTIONS: readonly number[] = [100, 80, 75, 50];

export const REFERRAL_FILTER_OPTIONS: readonly ('all' | 'open' | 'completed-report-filed')[] = [
  'all',
  'open',
  'completed-report-filed',
];

export const REFERRAL_STATUS_OPTIONS: readonly ReferralItemRecord['status'][] = [
  'draft',
  'sent',
  'accepted',
  'scheduled',
  'completed-report-filed',
];

const SHARED_MATERNAL_SPECIALTY_STYLES = `
  :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
  .emr-mps-card { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; display: grid; gap: 14px; padding: 16px; }
  .emr-mps-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 10px; border-bottom: 1px solid var(--emr-border); padding-bottom: 12px; }
  .emr-mps-title-wrap { display: grid; gap: 4px; }
  .emr-mps-tag { display: inline-block; width: fit-content; padding: 2px 8px; border-radius: 6px; background: var(--emr-primary-soft); color: var(--emr-primary); font-family: var(--emr-font-mono); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); letter-spacing: 0.05em; }
  .emr-mps-title { margin: 0; font-size: var(--emr-text-lg); font-weight: var(--emr-weight-bold); }
  .emr-mps-sub { margin: 0; font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
  .emr-mps-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .emr-mps-panel { border: 1px solid var(--emr-border); border-radius: 10px; background: var(--emr-surface-raised); padding: 12px; display: grid; gap: 10px; min-width: 0; }
  .emr-mps-row-between { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
  .emr-mps-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .emr-mps-chip { min-height: var(--emr-compact-height); padding: 4px 10px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); cursor: pointer; }
  .emr-mps-chip[aria-pressed="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary); }
  .emr-mps-chip:disabled { opacity: 0.6; cursor: not-allowed; }
  .emr-mps-badge { padding: 2px 8px; border-radius: 999px; border: 1px solid var(--emr-border); background: var(--emr-surface-soft); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
  .emr-mps-badge[data-tone="warning"] { background: var(--emr-warning-soft); color: var(--emr-warning); border-color: var(--emr-warning); }
  .emr-mps-badge[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); border-color: var(--emr-danger); }
  .emr-mps-badge[data-tone="success"] { background: var(--emr-success-soft); color: var(--emr-success); border-color: var(--emr-success); }
  .emr-mps-badge[data-tone="info"] { background: var(--emr-info-soft); color: var(--emr-info); border-color: var(--emr-info); }
  .emr-mps-kv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin: 0; }
  .emr-mps-kv { padding: 6px 8px; border-radius: 8px; border: 1px solid var(--emr-border); background: var(--emr-surface); }
  .emr-mps-kv dt { font-size: var(--emr-text-2xs); color: var(--emr-text-muted); text-transform: uppercase; font-weight: var(--emr-weight-bold); }
  .emr-mps-kv dd { margin: 2px 0 0; font-family: var(--emr-font-mono); font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); }
  .emr-mps-table-wrap { overflow-x: auto; border: 1px solid var(--emr-border); border-radius: 8px; background: var(--emr-surface); }
  .emr-mps-table { width: 100%; border-collapse: collapse; font-size: var(--emr-text-xs); }
  .emr-mps-table th, .emr-mps-table td { padding: 6px 8px; border-bottom: 1px solid var(--emr-border); text-align: left; }
  .emr-mps-table thead th { background: var(--emr-surface-soft); color: var(--emr-text-muted); font-weight: var(--emr-weight-bold); text-transform: uppercase; font-size: var(--emr-text-2xs); }
  .emr-mps-table tr[data-selected="true"] { background: var(--emr-primary-soft); }
  .emr-mps-alert { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--emr-warning); background: var(--emr-warning-soft); color: var(--emr-text); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-medium); }
  .emr-mps-alert[data-tone="danger"] { border-color: var(--emr-danger); background: var(--emr-danger-soft); color: var(--emr-danger); }
  .emr-mps-tooth-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 6px; }
  .emr-mps-tooth-btn { padding: 6px; border: 1px solid var(--emr-border); border-radius: 8px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-2xs); display: grid; gap: 2px; text-align: left; cursor: pointer; }
  .emr-mps-tooth-btn[aria-pressed="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); }
  .emr-mps-input { min-height: var(--emr-compact-height); width: 72px; padding: 4px 8px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); }
  @media (max-width: 760px) { .emr-mps-grid-2 { grid-template-columns: minmax(0, 1fr); } }
  :host-context(.emr-print) .emr-mps-chip { border-color: var(--emr-border); }
`;

// ===========================================================================
// 1. EmrPartogramComponent (`emr-partogram`)
// ===========================================================================

@Component({
  selector: 'emr-partogram',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let prog = progression();
    <section
      class="emr-mps-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'WHO Labour Care Guide Partogram')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-mps-head">
        <div class="emr-mps-title-wrap">
          <span class="emr-mps-tag">WHO LABOUR CARE GUIDE PARTOGRAM</span>
          <h3 class="emr-mps-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? 'WHO Labour Care Guide Partogram' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-mps-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-mps-chips">
          <span class="emr-mps-badge" data-tone="info">{{ m.gravidaParaLabel }}</span>
          <span
            class="emr-mps-badge"
            [attr.data-tone]="m.alertStatus === 'action-line' ? 'danger' : m.alertStatus === 'alert-line' ? 'warning' : 'success'"
          >
            {{ m.alertStatus }}
          </span>
        </div>
      </header>

      @if (prog.fhrAbnormal || m.alertStatus !== 'normal') {
        <div class="emr-mps-alert" [attr.data-tone]="prog.fhrAbnormal || m.alertStatus === 'action-line' ? 'danger' : 'warning'" role="alert">
          Labour Alert: Dilation {{ prog.latestDilationCm }} cm · FHR {{ prog.latestFhrBpm }} bpm
          ({{ prog.fhrAbnormal ? 'FHR Abnormal — Immediate Obstetric Review' : m.alertStatus }})
        </div>
      }

      <dl class="emr-mps-kv-grid">
        <div class="emr-mps-kv"><dt>Latest Dilation</dt><dd>{{ prog.latestDilationCm }} cm</dd></div>
        <div class="emr-mps-kv"><dt>Latest FHR</dt><dd>{{ prog.latestFhrBpm }} bpm</dd></div>
        <div class="emr-mps-kv"><dt>Liquor / Membranes</dt><dd>{{ m.membraneStatus }}</dd></div>
        <div class="emr-mps-kv"><dt>Checkpoints</dt><dd>{{ m.observations.length }} hrs</dd></div>
      </dl>

      <div class="emr-mps-row-between">
        <div class="emr-mps-chips" role="group" aria-label="Membrane and liquor status">
          @for (status of membraneOptions; track status) {
            <button
              type="button"
              class="emr-mps-chip"
              [attr.aria-pressed]="m.membraneStatus === status"
              [disabled]="!!m.readOnly"
              (click)="setMembraneStatus(status)"
            >
              {{ status }}
            </button>
          }
        </div>
        <div class="emr-mps-chips" role="group" aria-label="Alert line status">
          @for (alert of alertOptions; track alert) {
            <button
              type="button"
              class="emr-mps-chip"
              [attr.aria-pressed]="m.alertStatus === alert"
              [disabled]="!!m.readOnly"
              (click)="setAlertStatus(alert)"
            >
              {{ alert }}
            </button>
          }
        </div>
      </div>

      <div class="emr-mps-table-wrap">
        <table class="emr-mps-table" aria-label="Hourly partogram observations">
          <thead>
            <tr>
              <th>Hour</th>
              <th>Time</th>
              <th>Cervix (cm)</th>
              <th>Station</th>
              <th>FHR (bpm)</th>
              <th>Contractions / 10m</th>
              <th>Oxytocin (U/L)</th>
              <th>Select</th>
            </tr>
          </thead>
          <tbody>
            @for (obs of m.observations; track obs.hour) {
              <tr [attr.data-selected]="m.selectedHour === obs.hour">
                <td>Hr {{ obs.hour }}</td>
                <td>{{ obs.timeLabel }}</td>
                <td>{{ obs.cervicalDilationCm }} cm</td>
                <td>{{ obs.descentStation >= 0 ? '+' + obs.descentStation : obs.descentStation }}</td>
                <td>{{ obs.fhrBpm }} bpm</td>
                <td>{{ obs.contractionsPer10Min }}</td>
                <td>{{ obs.oxytocinUnitsPerL ?? 0 }}</td>
                <td>
                  <button
                    type="button"
                    class="emr-mps-chip"
                    [attr.aria-pressed]="m.selectedHour === obs.hour"
                    [disabled]="!!m.readOnly"
                    (click)="selectCheckpoint(obs.hour)"
                  >
                    Inspect Hr {{ obs.hour }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [SHARED_MATERNAL_SPECIALTY_STYLES],
})
export class EmrPartogramComponent {
  readonly model = input.required<EmrPartogramViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrPartogramIntent>();

  readonly membraneOptions = PARTOGRAM_MEMBRANE_OPTIONS;
  readonly alertOptions = PARTOGRAM_ALERT_OPTIONS;

  progression() {
    return evaluatePartogramProgression(this.model().observations);
  }

  selectCheckpoint(hour: number): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'checkpointSelected', hour });
  }

  setMembraneStatus(status: EmrPartogramViewModel['membraneStatus']): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'membraneStatusChanged', status });
  }

  setAlertStatus(alertStatus: EmrPartogramViewModel['alertStatus']): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'alertStatusChanged', alertStatus });
  }
}

// ===========================================================================
// 2. EmrGrowthChartComponent (`emr-growth-chart`)
// ===========================================================================

@Component({
  selector: 'emr-growth-chart',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let latest = latestPoint();
    <section
      class="emr-mps-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'Pediatric Anthropometric Growth Chart')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-mps-head">
        <div class="emr-mps-title-wrap">
          <span class="emr-mps-tag">PEDIATRIC ANTHROPOMETRY · {{ m.standardLabel }}</span>
          <h3 class="emr-mps-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? 'WHO / IAP Centile & Z-Score Growth Chart' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-mps-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-mps-chips">
          <span class="emr-mps-badge" data-tone="info">{{ m.standardLabel }}</span>
          @if (m.midParentalHeightCm !== undefined) {
            <span class="emr-mps-badge">Mid-Parental Target: {{ m.midParentalHeightCm }} cm</span>
          }
        </div>
      </header>

      @if (latest) {
        <dl class="emr-mps-kv-grid">
          <div class="emr-mps-kv"><dt>Latest Age</dt><dd>{{ latest.ageLabel }} ({{ latest.ageMonths }}m)</dd></div>
          <div class="emr-mps-kv"><dt>Measurement</dt><dd>{{ latest.value }} {{ latest.unit }}</dd></div>
          <div class="emr-mps-kv"><dt>Centile / Z-Score</dt><dd>P{{ latest.centile }} ({{ latest.zScore }} SD)</dd></div>
          <div class="emr-mps-kv"><dt>WHO Classification</dt><dd>{{ zScoreClassFor(latest) }}</dd></div>
        </dl>
      }

      <div class="emr-mps-chips" role="group" aria-label="Growth chart anthropometric metric">
        @for (metricOpt of metricOptions; track metricOpt.id) {
          <button
            type="button"
            class="emr-mps-chip"
            [attr.aria-pressed]="m.activeMetric === metricOpt.id"
            [disabled]="!!m.readOnly"
            (click)="selectMetric(metricOpt.id)"
          >
            {{ metricOpt.label }}
          </button>
        }
      </div>

      <div class="emr-mps-table-wrap">
        <table class="emr-mps-table" aria-label="Longitudinal growth points">
          <thead>
            <tr>
              <th>Age</th>
              <th>Value</th>
              <th>Centile</th>
              <th>Z-Score</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            @for (pt of m.points; track pt.id) {
              <tr [attr.data-selected]="m.selectedPointId === pt.id">
                <td>{{ pt.ageLabel }} ({{ pt.ageMonths }}m)</td>
                <td>{{ pt.value }} {{ pt.unit }}</td>
                <td>{{ pt.centile }}th</td>
                <td>{{ pt.zScore >= 0 ? '+' + pt.zScore.toFixed(2) : pt.zScore.toFixed(2) }} SD</td>
                <td>{{ pt.flag ?? zScoreClassFor(pt) }}</td>
                <td>
                  <button
                    type="button"
                    class="emr-mps-chip"
                    [attr.aria-pressed]="m.selectedPointId === pt.id"
                    [disabled]="!!m.readOnly"
                    (click)="selectPoint(pt.id)"
                  >
                    Select {{ pt.ageLabel }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [SHARED_MATERNAL_SPECIALTY_STYLES],
})
export class EmrGrowthChartComponent {
  readonly model = input.required<EmrGrowthChartViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrGrowthChartIntent>();

  readonly metricOptions = GROWTH_METRIC_OPTIONS;

  latestPoint(): GrowthMeasurementPoint | undefined {
    const pts = this.model().points;
    return pts.length > 0 ? pts[pts.length - 1] : undefined;
  }

  zScoreClassFor(pt: GrowthMeasurementPoint): string {
    return classifyGrowthZScore(pt.zScore);
  }

  selectMetric(metric: EmrGrowthChartViewModel['activeMetric']): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'metricChanged', metric });
  }

  selectPoint(pointId: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'pointSelected', pointId });
  }
}

// ===========================================================================
// 3. EmrImmunizationLedgerComponent (`emr-immunization-ledger`)
// ===========================================================================

@Component({
  selector: 'emr-immunization-ledger',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let cov = coverage();
    <section
      class="emr-mps-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'National UIP / IAP Immunization Ledger')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-mps-head">
        <div class="emr-mps-title-wrap">
          <span class="emr-mps-tag">IMMUNIZATION LEDGER · {{ m.scheduleStandard }}</span>
          <h3 class="emr-mps-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? 'Longitudinal Vaccine Schedule & Cold-Chain Ledger' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-mps-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-mps-chips">
          <span class="emr-mps-badge" data-tone="success">Administered: {{ cov.administeredCount }}</span>
          <span class="emr-mps-badge" data-tone="info">Due: {{ cov.dueCount }}</span>
          <span class="emr-mps-badge" [attr.data-tone]="cov.overdueCount > 0 ? 'danger' : 'info'">
            Overdue: {{ cov.overdueCount }}
          </span>
        </div>
      </header>

      <div class="emr-mps-chips" role="group" aria-label="Vaccine status filter">
        @for (flt of filterOptions; track flt.id) {
          <button
            type="button"
            class="emr-mps-chip"
            [attr.aria-pressed]="(m.activeFilter ?? 'all') === flt.id"
            [disabled]="!!m.readOnly"
            (click)="setFilter(flt.id)"
          >
            {{ flt.label }}
          </button>
        }
      </div>

      <div class="emr-mps-table-wrap">
        <table class="emr-mps-table" aria-label="Immunization doses">
          <thead>
            <tr>
              <th>Cohort</th>
              <th>Vaccine</th>
              <th>Dose</th>
              <th>Status</th>
              <th>Batch / Site</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (dose of filteredDoses(); track dose.id) {
              <tr [attr.data-selected]="m.selectedDoseId === dose.id">
                <td>{{ dose.ageGroupLabel }}</td>
                <td>
                  <strong>{{ dose.vaccineName }}</strong>
                  @if (dose.aefiReported) {
                    <span class="emr-mps-badge" data-tone="danger">AEFI Flag</span>
                  }
                </td>
                <td>{{ dose.doseNumberLabel }}</td>
                <td>
                  <span
                    class="emr-mps-badge"
                    [attr.data-tone]="dose.status === 'administered' ? 'success' : dose.status === 'overdue' ? 'danger' : 'warning'"
                  >
                    {{ dose.status }}
                  </span>
                </td>
                <td>{{ dose.batchLotNumber ?? 'Pending Lot' }} · {{ dose.siteAndRoute ?? 'IM' }}</td>
                <td>
                  <div class="emr-mps-chips">
                    <button
                      type="button"
                      class="emr-mps-chip"
                      [attr.aria-pressed]="m.selectedDoseId === dose.id"
                      [disabled]="!!m.readOnly"
                      (click)="selectDose(dose.id)"
                    >
                      Inspect
                    </button>
                    @if (dose.status === 'due' || dose.status === 'overdue') {
                      <button
                        type="button"
                        class="emr-mps-chip"
                        [disabled]="!!m.readOnly"
                        (click)="requestAdminister(dose)"
                      >
                        Administer {{ dose.vaccineName }}
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
  styles: [SHARED_MATERNAL_SPECIALTY_STYLES],
})
export class EmrImmunizationLedgerComponent {
  readonly model = input.required<EmrImmunizationLedgerViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrImmunizationLedgerIntent>();

  readonly filterOptions = IMMUNIZATION_FILTER_OPTIONS;

  coverage() {
    return summarizeImmunizationCoverage(this.model().doses);
  }

  filteredDoses(): readonly ImmunizationDoseEntry[] {
    const m = this.model();
    const filter = m.activeFilter ?? 'all';
    if (filter === 'administered') {
      return m.doses.filter((d) => d.status === 'administered');
    }
    if (filter === 'due-overdue') {
      return m.doses.filter((d) => d.status === 'due' || d.status === 'overdue');
    }
    return m.doses;
  }

  setFilter(filter: 'all' | 'due-overdue' | 'administered'): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'filterChanged', filter });
  }

  selectDose(doseId: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'doseSelected', doseId });
  }

  requestAdminister(dose: ImmunizationDoseEntry): void {
    if (this.model().readOnly) return;
    this.intent.emit({
      type: 'administerDoseRequested',
      doseId: dose.id,
      vaccineName: dose.vaccineName,
    });
  }
}

// ===========================================================================
// 4. EmrWaveformStripViewerComponent (`emr-waveform-strip-viewer`)
// ===========================================================================

@Component({
  selector: 'emr-waveform-strip-viewer',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let lead = activeLead();
    <section
      class="emr-mps-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? m.modality + ' Waveform Strip Viewer')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-mps-head">
        <div class="emr-mps-title-wrap">
          <span class="emr-mps-tag">{{ m.modality }} · {{ m.paperSpeed }} · {{ m.gain }}</span>
          <h3 class="emr-mps-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? m.modality + ' Diagnostic Rhythm Strip' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-mps-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-mps-chips">
          @if (m.criticalAlert) {
            <span class="emr-mps-badge" data-tone="danger">CRITICAL RHYTHM ALERT</span>
          }
          <span class="emr-mps-badge" [attr.data-tone]="m.signed ? 'success' : 'warning'">
            {{ m.signed ? '✓ Signed Interpretation' : 'Unsigned Interpretation' }}
          </span>
        </div>
      </header>

      <dl class="emr-mps-kv-grid">
        <div class="emr-mps-kv"><dt>Heart Rate</dt><dd>{{ m.intervals.hrBpm }} bpm</dd></div>
        @if (m.intervals.prMs !== undefined) {
          <div class="emr-mps-kv"><dt>PR Interval</dt><dd>{{ m.intervals.prMs }} ms</dd></div>
        }
        @if (m.intervals.qrsMs !== undefined) {
          <div class="emr-mps-kv"><dt>QRS Duration</dt><dd>{{ m.intervals.qrsMs }} ms</dd></div>
        }
        @if (m.intervals.qtcMs !== undefined) {
          <div class="emr-mps-kv"><dt>QTc (Bazett)</dt><dd>{{ m.intervals.qtcMs }} ms</dd></div>
        }
      </dl>

      <div class="emr-mps-row-between">
        <div class="emr-mps-chips" role="group" aria-label="Waveform leads">
          @for (item of m.leads; track item.id) {
            <button
              type="button"
              class="emr-mps-chip"
              [attr.aria-pressed]="m.activeLeadId === item.id"
              [disabled]="!!m.readOnly"
              (click)="selectLead(item.id)"
            >
              {{ item.label }}
            </button>
          }
        </div>
        <div class="emr-mps-chips" role="group" aria-label="Paper speed">
          @for (spd of paperSpeedOptions; track spd) {
            <button
              type="button"
              class="emr-mps-chip"
              [attr.aria-pressed]="m.paperSpeed === spd"
              [disabled]="!!m.readOnly"
              (click)="setPaperSpeed(spd)"
            >
              {{ spd }}
            </button>
          }
        </div>
      </div>

      @if (lead) {
        <article class="emr-mps-panel" [attr.aria-label]="'Active lead ' + lead.label">
          <div class="emr-mps-row-between">
            <strong>{{ lead.label }} ({{ lead.samplePoints.length }} samples)</strong>
            @if (lead.rhythmNote) {
              <span class="emr-mps-badge" data-tone="info">{{ lead.rhythmNote }}</span>
            }
          </div>
          <p class="emr-mps-sub">
            Sample trace (mV): {{ formatSamples(lead.samplePoints) }}
          </p>
        </article>
      }

      <div class="emr-mps-row-between">
        <p class="emr-mps-sub"><strong>Interpretation:</strong> {{ m.interpretation }}</p>
        @if (!m.signed) {
          <button
            type="button"
            class="emr-mps-chip"
            [disabled]="!!m.readOnly"
            (click)="signInterpretation()"
          >
            Sign Interpretation
          </button>
        }
      </div>
    </section>
  `,
  styles: [SHARED_MATERNAL_SPECIALTY_STYLES],
})
export class EmrWaveformStripViewerComponent {
  readonly model = input.required<EmrWaveformStripViewerViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrWaveformStripViewerIntent>();

  readonly paperSpeedOptions = PAPER_SPEED_OPTIONS;

  activeLead() {
    const m = this.model();
    return m.leads.find((l) => l.id === m.activeLeadId) ?? m.leads[0];
  }

  formatSamples(points: readonly number[]): string {
    return points.map((n) => n.toFixed(2)).join(' · ');
  }

  selectLead(leadId: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'leadSelected', leadId });
  }

  setPaperSpeed(paperSpeed: '25 mm/s' | '50 mm/s'): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'paperSpeedChanged', paperSpeed });
  }

  signInterpretation(): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'signInterpretationRequested' });
  }
}

// ===========================================================================
// 5. EmrOdontogramComponent (`emr-odontogram`)
// ===========================================================================

@Component({
  selector: 'emr-odontogram',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let dmft = dmftIndex();
    @let selectedTooth = activeTooth();
    <section
      class="emr-mps-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'FDI Dental Arch Odontogram')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-mps-head">
        <div class="emr-mps-title-wrap">
          <span class="emr-mps-tag">DENTAL ARCH ODONTOGRAM · {{ m.dentitionMode }}</span>
          <h3 class="emr-mps-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? 'FDI Dental Arch & Periodontal Chart' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-mps-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-mps-chips">
          <span class="emr-mps-badge" data-tone="info">
            DMFT: {{ dmft.dmftTotal }} (D={{ dmft.decayed }} · M={{ dmft.missing }} · F={{ dmft.filled }})
          </span>
          <button
            type="button"
            class="emr-mps-chip"
            [attr.aria-pressed]="m.dentitionMode === 'permanent-fdi'"
            [disabled]="!!m.readOnly"
            (click)="setDentitionMode('permanent-fdi')"
          >
            Permanent FDI
          </button>
          <button
            type="button"
            class="emr-mps-chip"
            [attr.aria-pressed]="m.dentitionMode === 'deciduous-fdi'"
            [disabled]="!!m.readOnly"
            (click)="setDentitionMode('deciduous-fdi')"
          >
            Deciduous FDI
          </button>
        </div>
      </header>

      <div class="emr-mps-tooth-grid" role="group" aria-label="Dental arch teeth">
        @for (tooth of m.teeth; track tooth.toothNumber) {
          <button
            type="button"
            class="emr-mps-tooth-btn"
            [attr.aria-pressed]="m.selectedToothNumber === tooth.toothNumber"
            [disabled]="!!m.readOnly"
            (click)="selectTooth(tooth.toothNumber)"
          >
            <strong>#{{ tooth.toothNumber }} ({{ tooth.arch }})</strong>
            <span>{{ tooth.status }}</span>
            @if (tooth.pocketDepthMm !== undefined) {
              <span>PD {{ tooth.pocketDepthMm }} mm</span>
            }
          </button>
        }
      </div>

      @if (selectedTooth) {
        <article class="emr-mps-panel" [attr.aria-label]="'Selected tooth ' + selectedTooth.toothNumber">
          <div class="emr-mps-row-between">
            <strong>Tooth #{{ selectedTooth.toothNumber }} ({{ selectedTooth.arch }} arch) — {{ selectedTooth.status }}</strong>
            @if (selectedTooth.note) {
              <span class="emr-mps-sub">{{ selectedTooth.note }}</span>
            }
          </div>
          <div class="emr-mps-chips" role="group" aria-label="Assign tooth status">
            @for (st of statusOptions; track st) {
              <button
                type="button"
                class="emr-mps-chip"
                [attr.aria-pressed]="selectedTooth.status === st"
                [disabled]="!!m.readOnly"
                (click)="setToothStatus(selectedTooth.toothNumber, st)"
              >
                {{ st }}
              </button>
            }
          </div>
        </article>
      }
    </section>
  `,
  styles: [SHARED_MATERNAL_SPECIALTY_STYLES],
})
export class EmrOdontogramComponent {
  readonly model = input.required<EmrOdontogramViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrOdontogramIntent>();

  readonly statusOptions = ODONTOGRAM_STATUS_OPTIONS;

  dmftIndex() {
    return computeDmftIndex(this.model().teeth);
  }

  activeTooth(): OdontogramToothRecord | undefined {
    const m = this.model();
    return m.teeth.find((t) => t.toothNumber === m.selectedToothNumber) ?? m.teeth[0];
  }

  selectTooth(toothNumber: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'toothSelected', toothNumber });
  }

  setToothStatus(toothNumber: string, status: OdontogramToothRecord['status']): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'toothStatusChanged', toothNumber, status });
  }

  setDentitionMode(dentitionMode: 'permanent-fdi' | 'deciduous-fdi'): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'dentitionModeChanged', dentitionMode });
  }
}

// ===========================================================================
// 6. EmrAudiogramComponent (`emr-audiogram`)
// ===========================================================================

@Component({
  selector: 'emr-audiogram',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-mps-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'Bilateral Pure-Tone Audiogram')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-mps-head">
        <div class="emr-mps-title-wrap">
          <span class="emr-mps-tag">PURE-TONE AUDIOMETRY &amp; TYMPANOMETRY</span>
          <h3 class="emr-mps-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? 'Bilateral Pure-Tone Audiogram (250–8000 Hz)' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-mps-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-mps-chips" role="group" aria-label="Conduction view">
          @for (view of conductionOptions; track view) {
            <button
              type="button"
              class="emr-mps-chip"
              [attr.aria-pressed]="(m.activeConductionView ?? 'both') === view"
              [disabled]="!!m.readOnly"
              (click)="setConductionView(view)"
            >
              {{ view }}
            </button>
          }
        </div>
      </header>

      <div class="emr-mps-grid-2">
        @for (earRec of ears(); track earRec.ear) {
          <article class="emr-mps-panel" [attr.aria-label]="earRec.ear + ' ear audiogram'">
            <div class="emr-mps-row-between">
              <strong>{{ earRec.ear }} Ear ({{ earRec.ear === 'Right' ? 'O' : 'X' }}) · {{ earRec.degreeClassification }}</strong>
              <span class="emr-mps-badge" data-tone="info">Tymp {{ earRec.tympanogramType }}</span>
            </div>
            <dl class="emr-mps-kv-grid">
              <div class="emr-mps-kv"><dt>PTA (500-2k Hz)</dt><dd>{{ earRec.ptaDbHl }} dB HL</dd></div>
              @if (earRec.sdsPct !== undefined) {
                <div class="emr-mps-kv"><dt>Speech SDS</dt><dd>{{ earRec.sdsPct }}%</dd></div>
              }
            </dl>
            <div class="emr-mps-chips" role="group" [attr.aria-label]="earRec.ear + ' ear frequency thresholds'">
              @for (th of earRec.thresholds; track th.frequencyHz) {
                <button
                  type="button"
                  class="emr-mps-chip"
                  [disabled]="!!m.readOnly"
                  (click)="selectThreshold(earRec.ear, th.frequencyHz)"
                >
                  {{ th.frequencyHz }}Hz: AC {{ th.airDbHl }}dB
                  @if (th.boneDbHl !== undefined) {
                    / BC {{ th.boneDbHl }}dB
                  }
                </button>
              }
            </div>
          </article>
        }
      </div>
    </section>
  `,
  styles: [SHARED_MATERNAL_SPECIALTY_STYLES],
})
export class EmrAudiogramComponent {
  readonly model = input.required<EmrAudiogramViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrAudiogramIntent>();

  readonly conductionOptions = AUDIOGRAM_CONDUCTION_OPTIONS;

  ears(): readonly AudiogramEarRecord[] {
    const m = this.model();
    return [m.rightEar, m.leftEar];
  }

  setConductionView(view: 'both' | 'air' | 'bone'): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'conductionViewChanged', view });
  }

  selectThreshold(
    ear: 'Right' | 'Left',
    frequencyHz: 250 | 500 | 1000 | 2000 | 4000 | 8000,
  ): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'thresholdSelected', ear, frequencyHz });
  }
}

// ===========================================================================
// 7. EmrChemoRegimenRoadmapComponent (`emr-chemo-regimen-roadmap`)
// ===========================================================================

@Component({
  selector: 'emr-chemo-regimen-roadmap',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-mps-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'Chemotherapy Regimen Roadmap')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-mps-head">
        <div class="emr-mps-title-wrap">
          <span class="emr-mps-tag">ONCOLOGY PROTOCOL · {{ m.protocolName }}</span>
          <h3 class="emr-mps-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? m.protocolName + ' Systemic Chemotherapy Roadmap' }}
          </h3>
          <p class="emr-mps-sub">{{ m.diagnosisLabel }}</p>
        </div>
        <div class="emr-mps-chips">
          <span class="emr-mps-badge" data-tone="info">BSA {{ m.bsaM2.toFixed(2) }} m² · ECOG {{ m.ecogStatus }}</span>
          <span class="emr-mps-badge" [attr.data-tone]="m.labClearancePassed ? 'success' : 'danger'">
            {{ m.labClearancePassed ? '✓ Pre-Chemo Labs Cleared' : 'Hold: Pre-Chemo Labs Below Gate' }}
          </span>
        </div>
      </header>

      <dl class="emr-mps-kv-grid">
        <div class="emr-mps-kv"><dt>ANC Count</dt><dd>{{ m.ancCountLabel }}</dd></div>
        <div class="emr-mps-kv"><dt>Platelets</dt><dd>{{ m.plateletCountLabel }}</dd></div>
        <div class="emr-mps-kv"><dt>BSA</dt><dd>{{ m.bsaM2.toFixed(2) }} m²</dd></div>
        <div class="emr-mps-kv"><dt>Total Cycles</dt><dd>{{ m.cycles.length }}</dd></div>
      </dl>

      <div class="emr-mps-table-wrap">
        <table class="emr-mps-table" aria-label="Chemotherapy protocol cycles">
          <thead>
            <tr>
              <th>Cycle</th>
              <th>Planned Date</th>
              <th>Status</th>
              <th>Dose %</th>
              <th>Agents</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (cyc of m.cycles; track cyc.cycleNumber) {
              <tr [attr.data-selected]="m.selectedCycleNumber === cyc.cycleNumber">
                <td>Cycle {{ cyc.cycleNumber }}</td>
                <td>{{ cyc.plannedDate }}</td>
                <td>{{ cyc.status }}</td>
                <td>{{ cyc.dosePct }}%</td>
                <td>
                  {{ cyc.agentsSummary }}
                  @if (cyc.toxicityGradeNote) {
                    <div class="emr-mps-sub">{{ cyc.toxicityGradeNote }}</div>
                  }
                </td>
                <td>
                  <div class="emr-mps-chips">
                    <button
                      type="button"
                      class="emr-mps-chip"
                      [attr.aria-pressed]="m.selectedCycleNumber === cyc.cycleNumber"
                      [disabled]="!!m.readOnly"
                      (click)="selectCycle(cyc.cycleNumber)"
                    >
                      Select C{{ cyc.cycleNumber }}
                    </button>
                    @for (pct of doseOptions; track pct) {
                      <button
                        type="button"
                        class="emr-mps-chip"
                        [attr.aria-pressed]="cyc.dosePct === pct"
                        [disabled]="!!m.readOnly"
                        (click)="adjustDose(cyc.cycleNumber, pct)"
                      >
                        {{ pct }}%
                      </button>
                    }
                    @if (!m.labClearancePassed) {
                      <button
                        type="button"
                        class="emr-mps-chip"
                        [disabled]="!!m.readOnly"
                        (click)="requestClearanceOverride(cyc.cycleNumber)"
                      >
                        Override Clearance C{{ cyc.cycleNumber }}
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
  styles: [SHARED_MATERNAL_SPECIALTY_STYLES],
})
export class EmrChemoRegimenRoadmapComponent {
  readonly model = input.required<EmrChemoRegimenRoadmapViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrChemoRegimenRoadmapIntent>();

  readonly doseOptions = CHEMO_DOSE_OPTIONS;

  selectCycle(cycleNumber: number): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'cycleSelected', cycleNumber });
  }

  adjustDose(cycleNumber: number, dosePct: number): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'cycleDoseAdjusted', cycleNumber, dosePct });
  }

  requestClearanceOverride(cycleNumber: number): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'clearanceOverrideRequested', cycleNumber });
  }
}

// ===========================================================================
// 8. EmrReferralTrackerComponent (`emr-referral-tracker`)
// ===========================================================================

@Component({
  selector: 'emr-referral-tracker',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-mps-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'Closed-Loop Specialty Referral Tracker')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-mps-head">
        <div class="emr-mps-title-wrap">
          <span class="emr-mps-tag">CLOSED-LOOP CONSULT &amp; REFERRAL TRACKER</span>
          <h3 class="emr-mps-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? 'Specialty Consultation & Inter-Facility Referral Tracker' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-mps-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-mps-chips" role="group" aria-label="Referral filter">
          @for (flt of filterOptions; track flt) {
            <button
              type="button"
              class="emr-mps-chip"
              [attr.aria-pressed]="(m.activeFilter ?? 'all') === flt"
              [disabled]="!!m.readOnly"
              (click)="setFilter(flt)"
            >
              {{ flt }}
            </button>
          }
        </div>
      </header>

      <div class="emr-mps-table-wrap">
        <table class="emr-mps-table" aria-label="Specialty referrals">
          <thead>
            <tr>
              <th>Specialty / Recipient</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Clinical Question / Reply</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (ref of filteredReferrals(); track ref.id) {
              <tr [attr.data-selected]="m.selectedReferralId === ref.id">
                <td>
                  <strong>{{ ref.targetSpecialty }}</strong>
                  @if (ref.receivingFacilityOrDoctor) {
                    <div class="emr-mps-sub">{{ ref.receivingFacilityOrDoctor }}</div>
                  }
                </td>
                <td>
                  <span
                    class="emr-mps-badge"
                    [attr.data-tone]="ref.urgency === 'emergent' ? 'danger' : ref.urgency === 'urgent' ? 'warning' : 'info'"
                  >
                    {{ ref.urgency }}
                  </span>
                </td>
                <td>{{ ref.status }}</td>
                <td>
                  <div>{{ ref.clinicalQuestion }}</div>
                  @if (ref.consultantReplySummary) {
                    <div class="emr-mps-sub">Reply: {{ ref.consultantReplySummary }}</div>
                  }
                </td>
                <td>
                  <div class="emr-mps-chips">
                    <button
                      type="button"
                      class="emr-mps-chip"
                      [attr.aria-pressed]="m.selectedReferralId === ref.id"
                      [disabled]="!!m.readOnly"
                      (click)="selectReferral(ref.id)"
                    >
                      Select
                    </button>
                    @for (st of statusOptions; track st) {
                      <button
                        type="button"
                        class="emr-mps-chip"
                        [attr.aria-pressed]="ref.status === st"
                        [disabled]="!!m.readOnly"
                        (click)="updateReferralStatus(ref.id, st)"
                      >
                        {{ st }}
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
  styles: [SHARED_MATERNAL_SPECIALTY_STYLES],
})
export class EmrReferralTrackerComponent {
  readonly model = input.required<EmrReferralTrackerViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrReferralTrackerIntent>();

  readonly filterOptions = REFERRAL_FILTER_OPTIONS;
  readonly statusOptions = REFERRAL_STATUS_OPTIONS;

  filteredReferrals(): readonly ReferralItemRecord[] {
    const m = this.model();
    const flt = m.activeFilter ?? 'all';
    if (flt === 'completed-report-filed') {
      return m.referrals.filter((r) => r.status === 'completed-report-filed');
    }
    if (flt === 'open') {
      return m.referrals.filter((r) => r.status !== 'completed-report-filed');
    }
    return m.referrals;
  }

  setFilter(filter: 'all' | 'open' | 'completed-report-filed'): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'filterChanged', filter });
  }

  selectReferral(referralId: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'referralSelected', referralId });
  }

  updateReferralStatus(referralId: string, status: ReferralItemRecord['status']): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'referralStatusUpdated', referralId, status });
  }
}

// ===========================================================================
// 9. EmrEncounterChargeSheetComponent (`emr-encounter-charge-sheet`)
// ===========================================================================

@Component({
  selector: 'emr-encounter-charge-sheet',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let tot = totals();
    @let curr = m.currencySymbol ?? '₹';
    <section
      class="emr-mps-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'Encounter Charge & Pre-Auth Sheet')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-mps-head">
        <div class="emr-mps-title-wrap">
          <span class="emr-mps-tag">ENCOUNTER TARIFF &amp; PRE-AUTH · {{ m.payerScheme }}</span>
          <h3 class="emr-mps-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? 'Encounter Coding, Tariff & Pre-Authorization Sheet' }}
          </h3>
          <p class="emr-mps-sub">Primary Dx: {{ m.primaryDiagnosisCode }}</p>
        </div>
        <div class="emr-mps-chips">
          <span
            class="emr-mps-badge"
            [attr.data-tone]="m.preAuthStatus === 'preauth-approved' ? 'success' : m.preAuthStatus === 'preauth-pending' ? 'warning' : 'info'"
          >
            {{ m.preAuthStatus }}
          </span>
          @if (m.preAuthNumber) {
            <span class="emr-mps-badge">Pre-Auth #{{ m.preAuthNumber }}</span>
          }
          <button
            type="button"
            class="emr-mps-chip"
            [disabled]="!!m.readOnly"
            (click)="submitClaim()"
          >
            Submit Claim / Pre-Auth
          </button>
        </div>
      </header>

      <dl class="emr-mps-kv-grid">
        <div class="emr-mps-kv"><dt>Gross Total</dt><dd>{{ curr }}{{ tot.grossTotal.toFixed(2) }}</dd></div>
        <div class="emr-mps-kv"><dt>Payer Covered</dt><dd>{{ curr }}{{ tot.payerCoveredTotal.toFixed(2) }}</dd></div>
        <div class="emr-mps-kv"><dt>Patient Payable</dt><dd>{{ curr }}{{ tot.patientPayableTotal.toFixed(2) }}</dd></div>
      </dl>

      <div class="emr-mps-table-wrap">
        <table class="emr-mps-table" aria-label="Encounter charge line items">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Coverage</th>
            </tr>
          </thead>
          <tbody>
            @for (item of m.lineItems; track item.id) {
              <tr>
                <td>{{ item.code }}</td>
                <td>{{ item.description }}</td>
                <td>{{ item.category }}</td>
                <td>
                  <input
                    type="number"
                    class="emr-mps-input"
                    [attr.aria-label]="'Quantity ' + item.code"
                    [value]="item.quantity"
                    [disabled]="!!m.readOnly"
                    (change)="setLineQuantity(item.id, $any($event.target).value)"
                  />
                </td>
                <td>{{ curr }}{{ item.unitPrice.toFixed(2) }}</td>
                <td>
                  <button
                    type="button"
                    class="emr-mps-chip"
                    [attr.aria-pressed]="item.coveredByPayer"
                    [disabled]="!!m.readOnly"
                    (click)="toggleCoverage(item.id, !item.coveredByPayer)"
                  >
                    {{ item.coveredByPayer ? 'Payer Covered' : 'Self-Pay' }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [SHARED_MATERNAL_SPECIALTY_STYLES],
})
export class EmrEncounterChargeSheetComponent {
  readonly model = input.required<EmrEncounterChargeSheetViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrEncounterChargeSheetIntent>();

  totals() {
    return calculateEncounterChargeTotals(this.model().lineItems);
  }

  setLineQuantity(itemId: string, rawQty: string | number): void {
    if (this.model().readOnly) return;
    const quantity = Number(rawQty);
    if (Number.isFinite(quantity) && quantity >= 0) {
      this.intent.emit({ type: 'lineQuantityChanged', itemId, quantity });
    }
  }

  toggleCoverage(itemId: string, coveredByPayer: boolean): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'coverageToggled', itemId, coveredByPayer });
  }

  submitClaim(): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'submitClaimRequested' });
  }
}

// ===========================================================================
// 10. EmrAbdmHealthLockerPanelComponent (`emr-abdm-health-locker-panel`)
// ===========================================================================

@Component({
  selector: 'emr-abdm-health-locker-panel',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-mps-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'ABDM Health Locker & Consent Panel')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-mps-head">
        <div class="emr-mps-title-wrap">
          <span class="emr-mps-tag">AYUSHMAN BHARAT DIGITAL MISSION (ABDM) · HIU / HIP</span>
          <h3 class="emr-mps-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? 'ABHA Identity, Scan & Share & FHIR Consent Artefacts' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-mps-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-mps-chips">
          <span class="emr-mps-badge" [attr.data-tone]="m.kycVerified ? 'success' : 'warning'">
            {{ m.kycVerified ? '✓ ABHA KYC Verified' : 'ABHA KYC Pending' }}
          </span>
          @if (m.scanAndShareToken) {
            <span class="emr-mps-badge" data-tone="info">Scan &amp; Share Token: {{ m.scanAndShareToken }}</span>
          }
        </div>
      </header>

      <dl class="emr-mps-kv-grid">
        <div class="emr-mps-kv"><dt>ABHA Number</dt><dd>{{ m.abhaNumber }}</dd></div>
        <div class="emr-mps-kv"><dt>ABHA Address</dt><dd>{{ m.abhaAddress }}</dd></div>
        <div class="emr-mps-kv"><dt>Linked Care Contexts</dt><dd>{{ m.linkedCareContextsCount }}</dd></div>
        <div class="emr-mps-kv"><dt>Consent Artefacts</dt><dd>{{ m.consents.length }}</dd></div>
      </dl>

      <div class="emr-mps-chips">
        <button
          type="button"
          class="emr-mps-chip"
          [disabled]="!!m.readOnly"
          (click)="requestNewConsent()"
        >
          + Request HIU Consent
        </button>
        <button
          type="button"
          class="emr-mps-chip"
          [disabled]="!!m.readOnly"
          (click)="linkCareContext()"
        >
          Link HIP Care Context
        </button>
      </div>

      <div class="emr-mps-table-wrap">
        <table class="emr-mps-table" aria-label="ABDM consent artefacts">
          <thead>
            <tr>
              <th>Requester HIU</th>
              <th>Purpose</th>
              <th>Status</th>
              <th>FHIR HI Types</th>
              <th>Valid Until</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (con of m.consents; track con.id) {
              <tr [attr.data-selected]="m.selectedConsentId === con.id">
                <td><strong>{{ con.requesterHiuName }}</strong></td>
                <td>{{ con.purpose }}</td>
                <td>
                  <span
                    class="emr-mps-badge"
                    [attr.data-tone]="con.status === 'GRANTED' ? 'success' : con.status === 'REQUESTED' ? 'warning' : 'danger'"
                  >
                    {{ con.status }}
                  </span>
                </td>
                <td>{{ con.hiTypes.join(', ') }}</td>
                <td>{{ con.validUntilLabel }}</td>
                <td>
                  <div class="emr-mps-chips">
                    <button
                      type="button"
                      class="emr-mps-chip"
                      [attr.aria-pressed]="m.selectedConsentId === con.id"
                      [disabled]="!!m.readOnly"
                      (click)="selectConsent(con.id)"
                    >
                      Inspect
                    </button>
                    @if (con.status === 'REQUESTED') {
                      <button
                        type="button"
                        class="emr-mps-chip"
                        [disabled]="!!m.readOnly"
                        (click)="triggerConsentAction(con.id, 'approve')"
                      >
                        Approve
                      </button>
                    }
                    @if (con.status === 'GRANTED') {
                      <button
                        type="button"
                        class="emr-mps-chip"
                        [disabled]="!!m.readOnly"
                        (click)="triggerConsentAction(con.id, 'revoke')"
                      >
                        Revoke
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
  styles: [SHARED_MATERNAL_SPECIALTY_STYLES],
})
export class EmrAbdmHealthLockerPanelComponent {
  readonly model = input.required<EmrAbdmHealthLockerPanelViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrAbdmHealthLockerPanelIntent>();

  selectConsent(consentId: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'consentSelected', consentId });
  }

  triggerConsentAction(consentId: string, action: 'approve' | 'revoke'): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'consentActionRequested', consentId, action });
  }

  requestNewConsent(): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'requestNewConsent' });
  }

  linkCareContext(): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'linkCareContextRequested' });
  }
}
