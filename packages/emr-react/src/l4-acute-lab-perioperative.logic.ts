import type {
  AnaesthesiaCheckpoint,
  AnaesthesiaMedicationEntry,
  AntibiogramIsolate,
  AntibiogramSusceptibilityRow,
  ClinicalAssessmentStatus,
  EdDispositionState,
  EdEsiAcuityLevel,
  EdTrackPatientRow,
  EmrAnaesthesiaRecordIntent,
  EmrAnaesthesiaRecordViewModel,
  EmrBadge,
  EmrEdTrackBoardIntent,
  EmrEdTrackBoardViewModel,
  EmrFluidBalanceChartIntent,
  EmrFluidBalanceChartViewModel,
  EmrLabCumulativeGridIntent,
  EmrLabCumulativeGridViewModel,
  EmrMicrobiologyAntibiogramIntent,
  EmrMicrobiologyAntibiogramViewModel,
  EmrResuscitationEventLogIntent,
  EmrResuscitationEventLogViewModel,
  EmrSpecimenCollectionBarIntent,
  EmrSpecimenCollectionBarViewModel,
  EmrSurgicalImplantLogIntent,
  EmrSurgicalImplantLogViewModel,
  EmrTone,
  EmrTriageAssessmentCardIntent,
  EmrTriageAssessmentCardViewModel,
  FluidBalanceStreamEntry,
  LabAbnormalityFlag,
  LabCumulativeAnalyteRow,
  ResuscitationLogEntry,
  ResuscitationQuickAction,
  SpecimenContainerItem,
  SurgicalImplantEntry,
  TriageVitalSummaryItem,
} from '@drguptavivek/emr-controller';

export type {
  AnaesthesiaCheckpoint,
  AnaesthesiaMedicationEntry,
  AntibiogramIsolate,
  AntibiogramSusceptibilityRow,
  ClinicalAssessmentStatus,
  EdDispositionState,
  EdEsiAcuityLevel,
  EdTrackPatientRow,
  EmrAnaesthesiaRecordIntent,
  EmrAnaesthesiaRecordViewModel,
  EmrBadge,
  EmrEdTrackBoardIntent,
  EmrEdTrackBoardViewModel,
  EmrFluidBalanceChartIntent,
  EmrFluidBalanceChartViewModel,
  EmrLabCumulativeGridIntent,
  EmrLabCumulativeGridViewModel,
  EmrMicrobiologyAntibiogramIntent,
  EmrMicrobiologyAntibiogramViewModel,
  EmrResuscitationEventLogIntent,
  EmrResuscitationEventLogViewModel,
  EmrSpecimenCollectionBarIntent,
  EmrSpecimenCollectionBarViewModel,
  EmrSurgicalImplantLogIntent,
  EmrSurgicalImplantLogViewModel,
  EmrTone,
  EmrTriageAssessmentCardIntent,
  EmrTriageAssessmentCardViewModel,
  FluidBalanceStreamEntry,
  LabAbnormalityFlag,
  LabCumulativeAnalyteRow,
  ResuscitationLogEntry,
  ResuscitationQuickAction,
  SpecimenContainerItem,
  SurgicalImplantEntry,
  TriageVitalSummaryItem,
};

// ===========================================================================
// 1. EmrEdTrackBoard — Emergency Department real-time bay census & patient flow
// ===========================================================================

export const ED_ESI_LEVELS: readonly EdEsiAcuityLevel[] = [1, 2, 3, 4, 5];

export const ED_ACUITY_FILTERS: readonly ('all' | EdEsiAcuityLevel)[] = ['all', 1, 2, 3, 4, 5];

export const ED_DISPOSITION_STATES: readonly EdDispositionState[] = [
  'triaged',
  'in-assessment',
  'boarding-admit',
  'ready-discharge',
];

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

export function filterEdTrackPatients(
  vm: EmrEdTrackBoardViewModel,
): readonly EdTrackPatientRow[] {
  const filter = vm.activeAcuityFilter ?? 'all';
  if (filter === 'all') return vm.patients;
  return vm.patients.filter((pt) => pt.esiLevel === filter);
}

// ===========================================================================
// 3. EmrResuscitationEventLog — ACLS / Code Blue / Trauma real-time recorder
// ===========================================================================

export const RESUSCITATION_QUICK_ACTION_OPTIONS: readonly {
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

export function formatResuscitationElapsed(elapsedSeconds: number): string {
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ===========================================================================
// 5. EmrLabCumulativeGrid — Longitudinal clinical laboratory flowsheet matrix
// ===========================================================================

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

export function filterLabCumulativeRows(
  vm: EmrLabCumulativeGridViewModel,
): readonly LabCumulativeAnalyteRow[] {
  if (!vm.showAbnormalOnly) return vm.rows;
  return vm.rows.filter((row) =>
    Object.values(row.values).some((cell) => cell.flag !== 'normal'),
  );
}

// ===========================================================================
// 7. EmrAnaesthesiaRecord — Intra-operative anaesthesia & physiological record
// ===========================================================================

export const ANAESTHESIA_PHASES: readonly EmrAnaesthesiaRecordViewModel['activePhase'][] = [
  'induction',
  'maintenance',
  'emergence',
  'pacu-handover',
];

// ===========================================================================
// 8. EmrFluidBalanceChart — 24-hour intake & output (I/O) fluid balance chart
// ===========================================================================

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
