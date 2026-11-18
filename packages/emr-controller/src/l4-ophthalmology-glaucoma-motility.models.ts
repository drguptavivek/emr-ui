import type { ClinicalAssessmentStatus, EmrBadge } from './models.js';

// ===========================================================================
// 1. EmrGonioscopyChart — Bilateral 4-quadrant gonioscopy & PAS angle diagram
// ===========================================================================

export type GonioscopyQuadrantId = 'superior' | 'nasal' | 'inferior' | 'temporal';

export type GonioscopyGradingSystem = 'shaffer' | 'spaeth' | 'scheie';

export type ShafferGrade = '0' | '1' | '2' | '3' | '4' | 'slit';

export type GonioscopyStructure = 'SL' | 'ATM' | 'PTM' | 'SS' | 'CBB' | 'none';

export interface GonioscopyQuadrantFinding {
  quadrant: GonioscopyQuadrantId;
  staticGrade: ShafferGrade;
  dynamicGrade?: ShafferGrade;
  deepestStructure?: GonioscopyStructure;
  pigmentation?: 0 | 1 | 2 | 3 | 4;
  irisConfiguration?: 'flat' | 'convex' | 'concave' | 'plateau';
  pasPresent?: boolean;
  neovascularization?: boolean;
  sampaolesiLine?: boolean;
  note?: string;
}

export interface GonioscopyEyeRecord {
  eye: 'OD' | 'OS';
  assessmentStatus?: ClinicalAssessmentStatus;
  gradingSystem: GonioscopyGradingSystem;
  lensUsed?: string;
  quadrants: Readonly<Record<GonioscopyQuadrantId, GonioscopyQuadrantFinding>>;
  pasClockHours?: readonly number[];
  spaethNotationSummary?: string;
  vanHerickGrade?: '1' | '2' | '3' | '4';
  overallBadge?: EmrBadge;
  notes?: string;
}

export interface EmrGonioscopyChartViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  od: GonioscopyEyeRecord;
  os: GonioscopyEyeRecord;
  selectedEye?: 'OD' | 'OS';
  selectedQuadrant?: GonioscopyQuadrantId;
  viewMode?: 'static' | 'dynamic' | 'both';
  readOnly?: boolean;
}

export type EmrGonioscopyChartIntent =
  | { type: 'quadrantSelected'; eye: 'OD' | 'OS'; quadrant: GonioscopyQuadrantId }
  | {
      type: 'quadrantGradeChanged';
      eye: 'OD' | 'OS';
      quadrant: GonioscopyQuadrantId;
      mode: 'static' | 'dynamic';
      grade: ShafferGrade;
    }
  | {
      type: 'quadrantPigmentationChanged';
      eye: 'OD' | 'OS';
      quadrant: GonioscopyQuadrantId;
      pigmentation: 0 | 1 | 2 | 3 | 4;
    }
  | { type: 'pasClockHourToggled'; eye: 'OD' | 'OS'; clockHour: number }
  | { type: 'viewModeChanged'; viewMode: 'static' | 'dynamic' | 'both' }
  | { type: 'copyEyeRequested'; fromEye: 'OD' | 'OS'; toEye: 'OD' | 'OS' }
  | {
      type: 'eyeAssessmentStatusChanged';
      eye: 'OD' | 'OS';
      status: ClinicalAssessmentStatus | undefined;
    };

export const GONIOSCOPY_QUADRANT_IDS: readonly GonioscopyQuadrantId[] = [
  'superior',
  'nasal',
  'inferior',
  'temporal',
];

export const SHAFFER_GRADES: readonly ShafferGrade[] = ['0', 'slit', '1', '2', '3', '4'];

export const GONIOSCOPY_PIGMENTATION_GRADES: readonly (0 | 1 | 2 | 3 | 4)[] = [0, 1, 2, 3, 4];

export const GONIOSCOPY_CLOCK_HOURS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Summarizes angle occludability for an eye:
 * - `closedQuadrantCount`: number of quadrants where `staticGrade` is `'0'`, `'slit'`, or `'1'`
 * - `pasClockHourCount`: number of clock hours with peripheral anterior synechiae (PAS)
 * - `isOccludable`: `closedQuadrantCount >= 2` (or >= 180 degrees appositional closure)
 */
export function summarizeGonioscopyOccludability(eye: GonioscopyEyeRecord): {
  closedQuadrantCount: number;
  pasClockHourCount: number;
  isOccludable: boolean;
} {
  let closedQuadrantCount = 0;
  for (const qId of GONIOSCOPY_QUADRANT_IDS) {
    const finding = eye.quadrants[qId];
    if (
      finding &&
      (finding.staticGrade === '0' || finding.staticGrade === 'slit' || finding.staticGrade === '1')
    ) {
      closedQuadrantCount += 1;
    }
  }
  const pasClockHourCount = eye.pasClockHours ? eye.pasClockHours.length : 0;
  return {
    closedQuadrantCount,
    pasClockHourCount,
    isOccludable: closedQuadrantCount >= 2,
  };
}

// ===========================================================================
// 2. EmrVisualFieldSummary — Perimetry reliability, global indices & plot
// ===========================================================================

export type VisualFieldStrategy =
  | '24-2 SITA-Standard'
  | '24-2 SITA-Fast'
  | '10-2 SITA-Standard'
  | '30-2 SITA-Standard'
  | 'Octopus G-Program';

export type GhtClassification =
  | 'Within Normal Limits'
  | 'Outside Normal Limits'
  | 'Borderline'
  | 'Generalized Reduction of Sensitivity'
  | 'Abnormally High Sensitivity';

export type VisualFieldDefectProbability =
  | 'normal'
  | 'p<5%'
  | 'p<2%'
  | 'p<1%'
  | 'p<0.5%'
  | 'absolute';

export interface VisualFieldSectorPoint {
  id: string;
  xDeg: number;
  yDeg: number;
  totalDeviationDb: number;
  patternDeviationDb: number;
  probability: VisualFieldDefectProbability;
}

export interface VisualFieldEyeRecord {
  eye: 'OD' | 'OS';
  assessmentStatus?: ClinicalAssessmentStatus;
  strategy: VisualFieldStrategy;
  testDate: string;
  pupilDiameterMm?: number;
  fixationLosses: string;
  falsePositivesPct: number;
  falseNegativesPct: number;
  reliabilityFlag?: 'reliable' | 'caution' | 'unreliable';
  vfiPct?: number;
  mdDb: number;
  mdProbability?: string;
  psdDb: number;
  psdProbability?: string;
  ght: GhtClassification;
  defectPatternLabel?: string;
  progressionSummary?: string;
  points: readonly VisualFieldSectorPoint[];
  badge?: EmrBadge;
}

export interface EmrVisualFieldSummaryViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  od: VisualFieldEyeRecord;
  os: VisualFieldEyeRecord;
  activeMapType?: 'pattern-deviation' | 'total-deviation';
  selectedPointId?: string;
  selectedEye?: 'OD' | 'OS';
  readOnly?: boolean;
}

export type EmrVisualFieldSummaryIntent =
  | { type: 'mapTypeChanged'; mapType: 'pattern-deviation' | 'total-deviation' }
  | { type: 'pointSelected'; eye: 'OD' | 'OS'; pointId: string }
  | { type: 'defectPatternChanged'; eye: 'OD' | 'OS'; patternLabel: string }
  | {
      type: 'eyeAssessmentStatusChanged';
      eye: 'OD' | 'OS';
      status: ClinicalAssessmentStatus | undefined;
    };

/**
 * Evaluates Humphrey/Octopus perimetry reliability indices:
 * - `'unreliable'` when `fpPct >= 15` or `fnPct >= 20` or fixation loss ratio > 0.20
 * - `'caution'` when `fpPct >= 10` or `fnPct >= 15` or fixation loss ratio >= 0.15
 * - `'reliable'` otherwise
 */
export function evaluateVisualFieldReliability(
  flRatio: string,
  fpPct: number,
  fnPct: number,
): 'reliable' | 'caution' | 'unreliable' {
  let flFraction = 0;
  const parts = flRatio.split('/').map((part) => Number(part.trim()));
  if (
    parts.length === 2 &&
    Number.isFinite(parts[0]) &&
    Number.isFinite(parts[1]) &&
    parts[1]! > 0
  ) {
    flFraction = parts[0]! / parts[1]!;
  }
  if (fpPct >= 15 || fnPct >= 20 || flFraction > 0.2) {
    return 'unreliable';
  }
  if (fpPct >= 10 || fnPct >= 15 || flFraction >= 0.15) {
    return 'caution';
  }
  return 'reliable';
}

// ===========================================================================
// 3. EmrHessScreenChart — Diplopia tangent screen & 9-gaze PBCT prism matrix
// ===========================================================================

export type HessGazeId = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'C';

export interface HessPlotPoint {
  gazeId: HessGazeId;
  expectedXDeg: number;
  expectedYDeg: number;
  plottedXDeg: number;
  plottedYDeg: number;
  torsionDeg?: number;
}

export interface PbctNineGazeCell {
  gazeId: HessGazeId;
  horizontalDelta?: string;
  verticalDelta?: string;
  torsionLabel?: string;
  badge?: EmrBadge;
}

export interface HessEyeRecord {
  fixingEye: 'OD' | 'OS';
  plottedEye: 'OD' | 'OS';
  assessmentStatus?: ClinicalAssessmentStatus;
  innerFieldPoints: readonly HessPlotPoint[];
  outerFieldPoints: readonly HessPlotPoint[];
  primaryRestrictionMuscle?: string;
  primaryOveractionMuscle?: string;
}

export interface EmrHessScreenChartViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  leftChartOsFixing: HessEyeRecord;
  rightChartOdFixing: HessEyeRecord;
  pbctDistanceCells: Readonly<Record<HessGazeId, PbctNineGazeCell>>;
  pbctNearCells?: Readonly<Record<HessGazeId, PbctNineGazeCell>>;
  headTiltCells?: { rightTiltDelta: string; leftTiltDelta: string };
  activeDistanceMode?: 'distance-6m' | 'near-33cm';
  selectedGazeId?: HessGazeId;
  selectedChart?: 'left-os-fixing' | 'right-od-fixing';
  diagnosisSummary?: string;
  readOnly?: boolean;
}

export type EmrHessScreenChartIntent =
  | {
      type: 'pointSelected';
      chart: 'left-os-fixing' | 'right-od-fixing';
      field: 'inner' | 'outer';
      gazeId: HessGazeId;
    }
  | {
      type: 'pointNudged';
      chart: 'left-os-fixing' | 'right-od-fixing';
      field: 'inner' | 'outer';
      gazeId: HessGazeId;
      dxDeg: number;
      dyDeg: number;
    }
  | {
      type: 'pbctCellEdited';
      distanceMode: 'distance-6m' | 'near-33cm';
      gazeId: HessGazeId;
      horizontalDelta: string;
      verticalDelta: string;
    }
  | { type: 'distanceModeChanged'; distanceMode: 'distance-6m' | 'near-33cm' };

export const HESS_NINE_GAZE_GRID: readonly (readonly HessGazeId[])[] = [
  ['NW', 'N', 'NE'],
  ['W', 'C', 'E'],
  ['SW', 'S', 'SE'],
];

/**
 * Computes the horizontal and vertical coordinate spans (in degrees) of a plotted
 * Hess field polygon versus the expected reference square.
 */
export function computeHessFieldAreaRatio(points: readonly HessPlotPoint[]): {
  plottedSpanX: number;
  plottedSpanY: number;
  expectedSpanX: number;
  expectedSpanY: number;
} {
  if (points.length === 0) {
    return { plottedSpanX: 0, plottedSpanY: 0, expectedSpanX: 0, expectedSpanY: 0 };
  }
  const plottedXs = points.map((p) => p.plottedXDeg);
  const plottedYs = points.map((p) => p.plottedYDeg);
  const expectedXs = points.map((p) => p.expectedXDeg);
  const expectedYs = points.map((p) => p.expectedYDeg);
  return {
    plottedSpanX: Math.max(...plottedXs) - Math.min(...plottedXs),
    plottedSpanY: Math.max(...plottedYs) - Math.min(...plottedYs),
    expectedSpanX: Math.max(...expectedXs) - Math.min(...expectedXs),
    expectedSpanY: Math.max(...expectedYs) - Math.min(...expectedYs),
  };
}
