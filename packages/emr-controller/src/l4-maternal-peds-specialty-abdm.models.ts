import type { ClinicalAssessmentStatus, EmrBadge, EmrTone } from './models.js';

export type { ClinicalAssessmentStatus, EmrBadge, EmrTone };

// ===========================================================================
// 1. EmrPartogram — WHO Labour Care Guide partogram
// ===========================================================================

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

/**
 * Evaluates WHO Labour Care Guide partogram progression from hourly checkpoints,
 * flagging fetal heart rate abnormality (< 110 bpm or > 160 bpm).
 */
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

// ===========================================================================
// 2. EmrGrowthChart — Pediatric WHO / IAP anthropometric centile & Z-score chart
// ===========================================================================

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

/**
 * Classifies pediatric anthropometric Z-score per WHO / IAP thresholds.
 */
export function classifyGrowthZScore(
  zScore: number,
): 'normal' | 'moderate-wasting' | 'severe-stunting-or-wasting' | 'overweight' {
  if (zScore < -3) return 'severe-stunting-or-wasting';
  if (zScore < -2) return 'moderate-wasting';
  if (zScore > 2) return 'overweight';
  return 'normal';
}

// ===========================================================================
// 3. EmrImmunizationLedger — National UIP / IAP / WHO vaccine schedule ledger
// ===========================================================================

export type ImmunizationAgeCohort =
  | 'Birth'
  | '6 Weeks'
  | '10 Weeks'
  | '14 Weeks'
  | '9 Months'
  | '16-24 Months'
  | 'Adult/Booster';

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

/**
 * Summarizes administered, due, and overdue vaccine counts across the ledger.
 */
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

// ===========================================================================
// 4. EmrWaveformStripViewer — 12-lead ECG / Fetal CTG / Telemetry strip viewer
// ===========================================================================

export interface WaveformLeadItem {
  id: string;
  label: string;
  samplePoints: readonly number[];
  rhythmNote?: string;
}

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

// ===========================================================================
// 5. EmrOdontogram — FDI / Universal dental arch chart & DMFT index
// ===========================================================================

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

/**
 * Computes the WHO DMFT (Decayed, Missing, Filled Teeth) epidemiological index.
 */
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

// ===========================================================================
// 6. EmrAudiogram — Bilateral pure-tone audiometry & Jerger tympanometry
// ===========================================================================

export type AudiogramFrequencyHz = 250 | 500 | 1000 | 2000 | 4000 | 8000;

export interface AudiogramThresholdPoint {
  frequencyHz: AudiogramFrequencyHz;
  airDbHl: number;
  boneDbHl?: number;
  masked?: boolean;
}

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

// ===========================================================================
// 7. EmrChemoRegimenRoadmap — Systemic oncology protocol & cycle clearance
// ===========================================================================

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

// ===========================================================================
// 8. EmrReferralTracker — Closed-loop specialty consult & inter-facility referral
// ===========================================================================

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

// ===========================================================================
// 9. EmrEncounterChargeSheet — Tariff, ICD-10/CPT coding & PM-JAY pre-auth
// ===========================================================================

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

/**
 * Calculates gross, payer-covered, and patient-payable encounter charge totals.
 */
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

// ===========================================================================
// 10. EmrAbdmHealthLockerPanel — ABDM ABHA, Scan & Share, HIU/HIP consents
// ===========================================================================

export type AbdmFhirHiType =
  | 'OPConsultation'
  | 'Prescription'
  | 'DiagnosticReport'
  | 'DischargeSummary'
  | 'ImmunizationRecord';

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
