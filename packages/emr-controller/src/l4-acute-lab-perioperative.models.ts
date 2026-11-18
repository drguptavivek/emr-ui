import type { EmrBadge } from './models.js';

// ===========================================================================
// 1. EmrEdTrackBoard — Emergency Department real-time bay census & patient flow
// ===========================================================================

export type EdEsiAcuityLevel = 1 | 2 | 3 | 4 | 5;

export type EdDispositionState =
  | 'triaged'
  | 'in-assessment'
  | 'boarding-admit'
  | 'ready-discharge';

export const ED_ESI_LEVELS: readonly EdEsiAcuityLevel[] = [1, 2, 3, 4, 5];

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

/**
 * Summarizes ED real-time census metrics: total patients, high-acuity ESI 1-2 count,
 * inpatient boarding count, and 4-hour (>= 240 min) length-of-stay breach count.
 */
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

// ===========================================================================
// 2. EmrTriageAssessmentCard — Emergency ESI/MTS triage & red-flag screening
// ===========================================================================

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

// ===========================================================================
// 3. EmrResuscitationEventLog — ACLS / Code Blue / Trauma real-time recorder
// ===========================================================================

export type ResuscitationQuickAction =
  | 'cpr-cycle'
  | 'shock-delivered'
  | 'epinephrine-1mg'
  | 'amiodarone-300mg'
  | 'rosc-achieved';

export const RESUSCITATION_QUICK_ACTIONS: readonly ResuscitationQuickAction[] = [
  'cpr-cycle',
  'shock-delivered',
  'epinephrine-1mg',
  'amiodarone-300mg',
  'rosc-achieved',
];

export const RESUSCITATION_RHYTHMS: readonly EmrResuscitationEventLogViewModel['currentRhythm'][] =
  ['VF/pVT', 'PEA', 'Asystole', 'ROSC'];

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

// ===========================================================================
// 4. EmrSpecimenCollectionBar — Phlebotomy & specimen barcode verification
// ===========================================================================

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

// ===========================================================================
// 5. EmrLabCumulativeGrid — Longitudinal clinical laboratory flowsheet matrix
// ===========================================================================

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

/**
 * Counts the total number of critical laboratory values (`'critical-low'` or `'critical-high'`)
 * across all analyte rows in a cumulative lab grid.
 */
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

// ===========================================================================
// 6. EmrMicrobiologyAntibiogram — Culture & Sensitivity (C&S) MIC matrix
// ===========================================================================

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

// ===========================================================================
// 7. EmrAnaesthesiaRecord — Intra-operative anaesthesia & physiological record
// ===========================================================================

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

// ===========================================================================
// 8. EmrFluidBalanceChart — 24-hour intake & output (I/O) fluid balance chart
// ===========================================================================

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

/**
 * Computes cumulative 24-hour intake, output, and net fluid balance in mL.
 */
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

// ===========================================================================
// 9. EmrSurgicalImplantLog — Perioperative prosthesis/implant UDI & count log
// ===========================================================================

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
