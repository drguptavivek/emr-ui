import type {
  AbdmConsentArtefactItem,
  AudiogramEarRecord,
  AudiogramFrequencyHz,
  AudiogramThresholdPoint,
  ChargeLineItem,
  ChemoCycleItem,
  ClinicalAssessmentStatus,
  EmrAbdmHealthLockerPanelIntent,
  EmrAbdmHealthLockerPanelViewModel,
  EmrAudiogramIntent,
  EmrAudiogramViewModel,
  EmrBadge,
  EmrChemoRegimenRoadmapIntent,
  EmrChemoRegimenRoadmapViewModel,
  EmrEncounterChargeSheetIntent,
  EmrEncounterChargeSheetViewModel,
  EmrGrowthChartIntent,
  EmrGrowthChartViewModel,
  EmrImmunizationLedgerIntent,
  EmrImmunizationLedgerViewModel,
  EmrOdontogramIntent,
  EmrOdontogramViewModel,
  EmrPartogramIntent,
  EmrPartogramViewModel,
  EmrReferralTrackerIntent,
  EmrReferralTrackerViewModel,
  EmrTone,
  EmrWaveformStripViewerIntent,
  EmrWaveformStripViewerViewModel,
  GrowthMeasurementPoint,
  ImmunizationAgeCohort,
  ImmunizationDoseEntry,
  OdontogramToothRecord,
  PartogramCheckpoint,
  ReferralItemRecord,
  WaveformLeadItem,
} from '@drguptavivek/emr-controller';

export type {
  AbdmConsentArtefactItem,
  AudiogramEarRecord,
  AudiogramFrequencyHz,
  AudiogramThresholdPoint,
  ChargeLineItem,
  ChemoCycleItem,
  ClinicalAssessmentStatus,
  EmrAbdmHealthLockerPanelIntent,
  EmrAbdmHealthLockerPanelViewModel,
  EmrAudiogramIntent,
  EmrAudiogramViewModel,
  EmrBadge,
  EmrChemoRegimenRoadmapIntent,
  EmrChemoRegimenRoadmapViewModel,
  EmrEncounterChargeSheetIntent,
  EmrEncounterChargeSheetViewModel,
  EmrGrowthChartIntent,
  EmrGrowthChartViewModel,
  EmrImmunizationLedgerIntent,
  EmrImmunizationLedgerViewModel,
  EmrOdontogramIntent,
  EmrOdontogramViewModel,
  EmrPartogramIntent,
  EmrPartogramViewModel,
  EmrReferralTrackerIntent,
  EmrReferralTrackerViewModel,
  EmrTone,
  EmrWaveformStripViewerIntent,
  EmrWaveformStripViewerViewModel,
  GrowthMeasurementPoint,
  ImmunizationAgeCohort,
  ImmunizationDoseEntry,
  OdontogramToothRecord,
  PartogramCheckpoint,
  ReferralItemRecord,
  WaveformLeadItem,
};

// ===========================================================================
// 1. EmrPartogram
// ===========================================================================

export const PARTOGRAM_MEMBRANE_STATUSES: readonly EmrPartogramViewModel['membraneStatus'][] = [
  'Intact',
  'Clear Liquor',
  'Meconium Stained',
  'Blood Stained',
];

export const PARTOGRAM_ALERT_STATUSES: readonly EmrPartogramViewModel['alertStatus'][] = [
  'normal',
  'alert-line',
  'action-line',
];

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
// 2. EmrGrowthChart
// ===========================================================================

export const GROWTH_CHART_METRICS: readonly {
  readonly id: EmrGrowthChartViewModel['activeMetric'];
  readonly label: string;
}[] = [
  { id: 'weight-for-age', label: 'Weight-for-Age' },
  { id: 'height-for-age', label: 'Height/Length-for-Age' },
  { id: 'head-circumference', label: 'Head Circumference' },
  { id: 'bmi-for-age', label: 'BMI-for-Age' },
];

export function classifyGrowthZScore(
  zScore: number,
): 'normal' | 'moderate-wasting' | 'severe-stunting-or-wasting' | 'overweight' {
  if (zScore < -3) return 'severe-stunting-or-wasting';
  if (zScore < -2) return 'moderate-wasting';
  if (zScore > 2) return 'overweight';
  return 'normal';
}

// ===========================================================================
// 3. EmrImmunizationLedger
// ===========================================================================

export const IMMUNIZATION_FILTERS: readonly {
  readonly id: 'all' | 'due-overdue' | 'administered';
  readonly label: string;
}[] = [
  { id: 'all', label: 'All Doses' },
  { id: 'due-overdue', label: 'Due / Overdue' },
  { id: 'administered', label: 'Administered' },
];

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

export function filterImmunizationDoses(
  vm: EmrImmunizationLedgerViewModel,
): readonly ImmunizationDoseEntry[] {
  const filter = vm.activeFilter ?? 'all';
  if (filter === 'administered') {
    return vm.doses.filter((d) => d.status === 'administered');
  }
  if (filter === 'due-overdue') {
    return vm.doses.filter((d) => d.status === 'due' || d.status === 'overdue');
  }
  return vm.doses;
}

// ===========================================================================
// 4. EmrWaveformStripViewer
// ===========================================================================

export const WAVEFORM_PAPER_SPEEDS: readonly EmrWaveformStripViewerViewModel['paperSpeed'][] = [
  '25 mm/s',
  '50 mm/s',
];

// ===========================================================================
// 5. EmrOdontogram
// ===========================================================================

export const ODONTOGRAM_TOOTH_STATUSES: readonly OdontogramToothRecord['status'][] = [
  'sound',
  'caries',
  'restored-filling',
  'crown',
  'missing',
  'endodontic-rct',
  'implant',
];

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
// 6. EmrAudiogram
// ===========================================================================

export const AUDIOGRAM_CONDUCTION_VIEWS: readonly ('both' | 'air' | 'bone')[] = [
  'both',
  'air',
  'bone',
];

// ===========================================================================
// 7. EmrChemoRegimenRoadmap
// ===========================================================================

export const CHEMO_DOSE_PERCENTAGES: readonly number[] = [100, 80, 75, 50];

// ===========================================================================
// 8. EmrReferralTracker
// ===========================================================================

export const REFERRAL_FILTERS: readonly ('all' | 'open' | 'completed-report-filed')[] = [
  'all',
  'open',
  'completed-report-filed',
];

export const REFERRAL_LIFECYCLE_STATUSES: readonly ReferralItemRecord['status'][] = [
  'draft',
  'sent',
  'accepted',
  'scheduled',
  'completed-report-filed',
];

export function filterReferrals(
  vm: EmrReferralTrackerViewModel,
): readonly ReferralItemRecord[] {
  const flt = vm.activeFilter ?? 'all';
  if (flt === 'completed-report-filed') {
    return vm.referrals.filter((r) => r.status === 'completed-report-filed');
  }
  if (flt === 'open') {
    return vm.referrals.filter((r) => r.status !== 'completed-report-filed');
  }
  return vm.referrals;
}

// ===========================================================================
// 9. EmrEncounterChargeSheet
// ===========================================================================

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
