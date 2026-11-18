import type { ClinicalAssessmentStatus, EmrBadge } from './models.js';

// ===========================================================================
// 1. EmrIolBiometryPlanner — Optical biometry, IOL formula & toric axis plan
// ===========================================================================

export type IolFormulaId =
  | 'Barrett Universal II'
  | 'Kane'
  | 'Haigis'
  | 'SRK/T'
  | 'Holladay 2'
  | 'Evo 2.0';

export const IOL_FORMULA_IDS: readonly IolFormulaId[] = [
  'Barrett Universal II',
  'Kane',
  'Haigis',
  'SRK/T',
  'Holladay 2',
  'Evo 2.0',
];

export interface IolCandidateRow {
  id: string;
  powerDiopters: string;
  predictedRefractionD: string;
  isEmmetropiaTarget?: boolean;
  isSelected?: boolean;
  toricCylinderModel?: string;
  residualAstigmatismD?: string;
  recommendedAxisDeg?: number;
}

export interface IolBiometryEyePlan {
  eye: 'OD' | 'OS';
  assessmentStatus?: ClinicalAssessmentStatus;
  deviceLabel?: string;
  axialLengthMm: number;
  acdMm: number;
  lensThicknessMm?: number;
  wtwMm?: number;
  cctUm?: number;
  k1Diopters: number;
  k1AxisDeg: number;
  k2Diopters: number;
  k2AxisDeg: number;
  cornealDeltaKD: string;
  siaDiopters?: number;
  incisionMeridianDeg?: number;
  targetRefractionD: string;
  activeFormula: IolFormulaId;
  availableFormulas: readonly IolFormulaId[];
  lensModelLabel: string;
  aConstant: string;
  candidates: readonly IolCandidateRow[];
  warnings?: readonly string[];
  badge?: EmrBadge;
}

export interface EmrIolBiometryPlannerViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  od: IolBiometryEyePlan;
  os: IolBiometryEyePlan;
  interOcularAlDiffMm?: number;
  interOcularWarning?: string;
  readOnly?: boolean;
}

export type EmrIolBiometryPlannerIntent =
  | { type: 'formulaSelected'; eye: 'OD' | 'OS'; formula: IolFormulaId }
  | { type: 'candidateSelected'; eye: 'OD' | 'OS'; candidateId: string; powerDiopters: string }
  | { type: 'targetRefractionChanged'; eye: 'OD' | 'OS'; targetRefractionD: string }
  | { type: 'incisionMeridianChanged'; eye: 'OD' | 'OS'; meridianDeg: number };

/**
 * Evaluates inter-ocular axial length (AL) asymmetry and flags `diffMm >= 0.3` mm
 * for repeat optical biometry verification.
 */
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

// ===========================================================================
// 2. EmrIntravitrealCourseTracker — Anti-VEGF / steroid CST & interval course
// ===========================================================================

export interface IntravitrealVisitPoint {
  id: string;
  visitNumber: number;
  date: string;
  eye: 'OD' | 'OS';
  cstUm: number;
  bcvaLabel: string;
  logMar?: number;
  iopMmHg?: number;
  agentAdministered?: string;
  doseLabel?: string;
  lotNumber?: string;
  intervalWeeks?: number;
  fluidFlags: {
    irf: boolean;
    srf: boolean;
    ped: boolean;
    hemorrhage?: boolean;
  };
  decision: 'inject-maintain' | 'inject-extend' | 'inject-shorten' | 'observe' | 'switch-agent';
  note?: string;
}

export interface IntravitrealEyeCourse {
  eye: 'OD' | 'OS';
  indication: string;
  currentRegimen: 'loading' | 'treat-and-extend' | 'prn' | 'fixed';
  currentAgent: string;
  totalInjectionsCount: number;
  currentIntervalWeeks: number;
  nextPlannedDate?: string;
  baselineCstUm: number;
  latestCstUm: number;
  visits: readonly IntravitrealVisitPoint[];
  badge?: EmrBadge;
}

export interface EmrIntravitrealCourseTrackerViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  activeEye: 'OD' | 'OS' | 'OU';
  od: IntravitrealEyeCourse;
  os?: IntravitrealEyeCourse;
  selectedVisitId?: string;
  readOnly?: boolean;
}

export type EmrIntravitrealCourseTrackerIntent =
  | { type: 'activeEyeChanged'; eye: 'OD' | 'OS' | 'OU' }
  | { type: 'visitSelected'; eye: 'OD' | 'OS'; visitId: string }
  | {
      type: 'intervalAdjusted';
      eye: 'OD' | 'OS';
      nextIntervalWeeks: number;
      decision: IntravitrealVisitPoint['decision'];
    }
  | { type: 'recordInjectionRequested'; eye: 'OD' | 'OS'; agent: string };

/**
 * Computes central subfield thickness (CST) change in microns and percentage vs baseline.
 */
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

// ===========================================================================
// 3. EmrCornealTopographySummary — Scheimpflug / Placido tomography & ectasia
// ===========================================================================

export type TopographyMapType =
  | 'axial-curvature'
  | 'pachymetry'
  | 'anterior-elevation'
  | 'posterior-elevation';

export const TOPOGRAPHY_MAP_TYPES: readonly TopographyMapType[] = [
  'axial-curvature',
  'pachymetry',
  'anterior-elevation',
  'posterior-elevation',
];

export interface TopographyEyeSummary {
  eye: 'OD' | 'OS';
  assessmentStatus?: ClinicalAssessmentStatus;
  deviceLabel: string;
  qualityScore: string;
  k1FlatD: number;
  k1AxisDeg: number;
  k2SteepD: number;
  k2AxisDeg: number;
  kMaxD: number;
  astigmatismD: number;
  qValueAsphericity?: number;
  centralPachymetryUm: number;
  thinnestPachymetryUm: number;
  thinnestCoordMm?: { x: number; y: number };
  anteriorElevationApexUm?: number;
  posteriorElevationApexUm?: number;
  badDIndex?: number;
  ectasiaRisk: 'normal' | 'borderline' | 'ectasia-suspect';
  summaryFindings?: readonly string[];
  badge?: EmrBadge;
}

export interface EmrCornealTopographySummaryViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  od: TopographyEyeSummary;
  os: TopographyEyeSummary;
  activeMap: TopographyMapType;
  readOnly?: boolean;
}

export type EmrCornealTopographySummaryIntent =
  | { type: 'activeMapChanged'; mapType: TopographyMapType }
  | { type: 'ectasiaRiskChanged'; eye: 'OD' | 'OS'; risk: TopographyEyeSummary['ectasiaRisk'] }
  | { type: 'eyeAssessmentStatusChanged'; eye: 'OD' | 'OS'; status: ClinicalAssessmentStatus | undefined };

/**
 * Screens corneal tomography indices (`kMaxD`, `thinnestUm`, `badD`) for keratoconus / ectasia risk.
 */
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

// ===========================================================================
// 4. EmrOphthalmicOperativeRecord — Phacoemulsification & IOL operative note
// ===========================================================================

export interface EmrOphthalmicOperativeRecordViewModel {
  id: string;
  title?: string;
  procedureName: string;
  operatedEye: 'OD' | 'OS';
  timeoutVerified: boolean;
  surgeonName: string;
  assistantName?: string;
  anesthesiaType: 'Topical' | 'Peribulbar' | 'Sub-Tenon' | 'Retrobulbar' | 'General';
  akinesiaGrade?: string;
  mainIncisionMeridianDeg: number;
  mainIncisionWidthMm: number;
  capsulorhexisStatus: 'Continuous Curvilinear (Intact)' | 'Rhexis Run-out' | 'Trypan Blue Assisted';
  phacoMetrics?: {
    cdeSeconds: number;
    usTimeSeconds: number;
    bssVolumeMl: number;
    ovdUsed: string;
  };
  posteriorCapsuleStatus: 'Intact' | 'PCR without Vitreous Loss' | 'PCR with Anterior Vitrectomy';
  iolImplant: {
    modelName: string;
    powerDiopters: string;
    serialNumber: string;
    udiCode?: string;
    placement: 'In-the-Bag' | 'Ciliary Sulcus' | 'Scleral-Fixated' | 'Aphakic';
    toricAlignedAxisDeg?: number;
  };
  prophylaxis: {
    intracameralAntibiotic: string;
    subconjunctivalSteroid?: boolean;
  };
  complicationsNote?: string;
  postOpRegimenSummary: string;
  signedBy?: string;
  signedAt?: string;
  readOnly?: boolean;
}

export type EmrOphthalmicOperativeRecordIntent =
  | { type: 'timeoutToggled'; verified: boolean }
  | {
      type: 'posteriorCapsuleStatusChanged';
      status: EmrOphthalmicOperativeRecordViewModel['posteriorCapsuleStatus'];
    }
  | { type: 'iolSerialChanged'; serialNumber: string }
  | { type: 'signOperativeNoteRequested' };

// ===========================================================================
// 5. EmrContactLensPrescription — Soft, toric, RGP & scleral contact lens Rx
// ===========================================================================

export type ContactLensModality =
  | 'Soft Spherical'
  | 'Soft Toric'
  | 'Soft Multifocal'
  | 'RGP Corneal'
  | 'Scleral Vaulting'
  | 'Hybrid';

export const CONTACT_LENS_MODALITIES: readonly ContactLensModality[] = [
  'Soft Spherical',
  'Soft Toric',
  'Soft Multifocal',
  'RGP Corneal',
  'Scleral Vaulting',
  'Hybrid',
];

export interface ContactLensEyeFit {
  eye: 'OD' | 'OS';
  assessmentStatus?: ClinicalAssessmentStatus;
  modality: ContactLensModality;
  brandAndMaterial: string;
  baseCurveMm: string;
  diameterMm: string;
  sphereD: string;
  cylinderD?: string;
  axisDeg?: number;
  addPowerD?: string;
  sagittalDepthUm?: number;
  dktValue?: number;
  centration: 'Optimal' | 'Decentered Nasal' | 'Decentered Temporal' | 'Decentered Inferior';
  movementMm: string;
  pushUpTest: 'Smooth / Adequate' | 'Tight /Steep' | 'Loose / Flat';
  apicalClearanceUm?: number;
  overRefraction?: string;
  visualAcuityAchieved: string;
}

export interface EmrContactLensPrescriptionViewModel {
  id: string;
  title?: string;
  issueDate: string;
  expiryDate: string;
  replacementSchedule: 'Daily Disposable' | 'Bi-Weekly' | 'Monthly' | 'Annual Conventional';
  wearingScheduleHoursPerDay: number;
  careRegimenSolution: string;
  od: ContactLensEyeFit;
  os: ContactLensEyeFit;
  trialFinalized: boolean;
  prescriberName?: string;
  readOnly?: boolean;
}

export type EmrContactLensPrescriptionIntent =
  | {
      type: 'eyeParameterChanged';
      eye: 'OD' | 'OS';
      field: 'baseCurveMm' | 'diameterMm' | 'sphereD' | 'cylinderD' | 'axisDeg';
      value: string;
    }
  | {
      type: 'fitAssessmentChanged';
      eye: 'OD' | 'OS';
      pushUpTest: ContactLensEyeFit['pushUpTest'];
    }
  | { type: 'trialFinalizedToggled'; finalized: boolean }
  | { type: 'copyEyeRequested'; fromEye: 'OD' | 'OS'; toEye: 'OD' | 'OS' };
