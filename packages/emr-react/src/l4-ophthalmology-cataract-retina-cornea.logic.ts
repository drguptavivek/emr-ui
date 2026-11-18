import type {
  ClinicalAssessmentStatus,
  ContactLensEyeFit,
  ContactLensModality,
  EmrCornealTopographySummaryViewModel,
  EmrIntravitrealCourseTrackerViewModel,
  EmrOphthalmicOperativeRecordViewModel,
  IntravitrealEyeCourse,
  IntravitrealVisitPoint,
  IolFormulaId,
  TopographyEyeSummary,
  TopographyMapType,
} from '@drguptavivek/emr-controller';

export const IOL_FORMULA_IDS: readonly IolFormulaId[] = [
  'Barrett Universal II',
  'Kane',
  'Haigis',
  'SRK/T',
  'Holladay 2',
  'Evo 2.0',
];

export const TOPOGRAPHY_MAP_OPTIONS: readonly {
  readonly id: TopographyMapType;
  readonly label: string;
}[] = [
  { id: 'axial-curvature', label: 'Axial Curvature' },
  { id: 'pachymetry', label: 'Pachymetry' },
  { id: 'anterior-elevation', label: 'Anterior Elevation' },
  { id: 'posterior-elevation', label: 'Posterior Elevation' },
];

export const ECTASIA_RISK_OPTIONS: readonly {
  readonly id: TopographyEyeSummary['ectasiaRisk'];
  readonly label: string;
}[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'borderline', label: 'Borderline' },
  { id: 'ectasia-suspect', label: 'Ectasia Suspect' },
];

export const POSTERIOR_CAPSULE_STATUSES: readonly EmrOphthalmicOperativeRecordViewModel['posteriorCapsuleStatus'][] =
  ['Intact', 'PCR without Vitreous Loss', 'PCR with Anterior Vitrectomy'];

export const PUSH_UP_TEST_CHOICES: readonly ContactLensEyeFit['pushUpTest'][] = [
  'Smooth / Adequate',
  'Tight /Steep',
  'Loose / Flat',
];

export const CONTACT_LENS_MODALITIES: readonly ContactLensModality[] = [
  'Soft Spherical',
  'Soft Toric',
  'Soft Multifocal',
  'RGP Corneal',
  'Scleral Vaulting',
  'Hybrid',
];

export const ASSESSMENT_STATUS_CHOICES: readonly {
  readonly value: ClinicalAssessmentStatus;
  readonly label: string;
}[] = [
  { value: 'recorded', label: 'Recorded' },
  { value: 'not-assessed', label: 'Not assessed' },
  { value: 'unable-to-assess', label: 'Unable to assess' },
  { value: 'not-applicable', label: 'Not applicable' },
  { value: 'declined', label: 'Declined' },
  { value: 'unknown', label: 'Unknown' },
];

export function evaluateBiometryInterOcularDelta(
  odAlMm: number,
  osAlMm: number,
): { diffMm: number; warning?: string } {
  const diffMm = Math.round(Math.abs(odAlMm - osAlMm) * 100) / 100;
  if (diffMm >= 0.3) {
    return {
      diffMm,
      warning: `Inter-ocular axial length difference is ${diffMm.toFixed(2)} mm (>= 0.30 mm) — repeat optical biometry verification recommended.`,
    };
  }
  return { diffMm };
}

export function computeIntravitrealCstDelta(
  baselineCstUm: number,
  latestCstUm: number,
): { deltaUm: number; pctChange: number } {
  const deltaUm = Math.round((latestCstUm - baselineCstUm) * 100) / 100;
  const pctChange =
    baselineCstUm > 0
      ? Math.round(((latestCstUm - baselineCstUm) / baselineCstUm) * 1000) / 10
      : 0;
  return { deltaUm, pctChange };
}

export function classifyEctasiaScreening(
  kMaxD: number,
  thinnestUm: number,
  badD?: number,
): 'normal' | 'borderline' | 'ectasia-suspect' {
  if (kMaxD >= 48.0 || thinnestUm < 470 || (badD !== undefined && badD >= 2.6)) {
    return 'ectasia-suspect';
  }
  if (kMaxD >= 47.2 || thinnestUm < 490 || (badD !== undefined && badD >= 1.6)) {
    return 'borderline';
  }
  return 'normal';
}

export function resolveIntravitrealVisibleCourses(
  vm: EmrIntravitrealCourseTrackerViewModel,
): readonly IntravitrealEyeCourse[] {
  if (vm.activeEye === 'OD') return [vm.od];
  if (vm.activeEye === 'OS') return vm.os ? [vm.os] : [vm.od];
  return vm.os ? [vm.od, vm.os] : [vm.od];
}

export function formatIntravitrealFluidFlags(visit: IntravitrealVisitPoint): string {
  const flags: string[] = [];
  if (visit.fluidFlags.irf) flags.push('IRF+');
  if (visit.fluidFlags.srf) flags.push('SRF+');
  if (visit.fluidFlags.ped) flags.push('PED+');
  if (visit.fluidFlags.hemorrhage) flags.push('Heme+');
  return flags.length > 0 ? flags.join(' · ') : 'Dry Macula';
}

export function summarizeTopographyBilateralRisk(
  vm: EmrCornealTopographySummaryViewModel,
): {
  odScreened: TopographyEyeSummary['ectasiaRisk'];
  osScreened: TopographyEyeSummary['ectasiaRisk'];
} {
  return {
    odScreened: classifyEctasiaScreening(
      vm.od.kMaxD,
      vm.od.thinnestPachymetryUm,
      vm.od.badDIndex,
    ),
    osScreened: classifyEctasiaScreening(
      vm.os.kMaxD,
      vm.os.thinnestPachymetryUm,
      vm.os.badDIndex,
    ),
  };
}
