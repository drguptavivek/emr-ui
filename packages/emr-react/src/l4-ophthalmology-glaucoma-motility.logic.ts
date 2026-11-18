import type {
  ClinicalAssessmentStatus,
  EmrBadge,
  EmrGonioscopyChartIntent,
  EmrGonioscopyChartViewModel,
  EmrHessScreenChartIntent,
  EmrHessScreenChartViewModel,
  EmrTone,
  EmrVisualFieldSummaryIntent,
  EmrVisualFieldSummaryViewModel,
  GhtClassification,
  GonioscopyEyeRecord,
  GonioscopyGradingSystem,
  GonioscopyQuadrantFinding,
  GonioscopyQuadrantId,
  GonioscopyStructure,
  HessEyeRecord,
  HessGazeId,
  HessPlotPoint,
  PbctNineGazeCell,
  ShafferGrade,
  VisualFieldDefectProbability,
  VisualFieldEyeRecord,
  VisualFieldSectorPoint,
  VisualFieldStrategy,
} from '@drguptavivek/emr-controller';

export const GONIOSCOPY_QUADRANT_IDS: readonly GonioscopyQuadrantId[] = [
  'superior',
  'nasal',
  'inferior',
  'temporal',
];

export const SHAFFER_GRADES: readonly ShafferGrade[] = ['0', 'slit', '1', '2', '3', '4'];

export const GONIOSCOPY_PIGMENTATION_GRADES: readonly (0 | 1 | 2 | 3 | 4)[] = [0, 1, 2, 3, 4];

export const GONIOSCOPY_CLOCK_HOURS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const VISUAL_FIELD_DEFECT_PATTERNS: readonly string[] = [
  'Superior Arcuate Scotoma',
  'Inferior Arcuate Scotoma',
  'Nasal Step',
  'Paracentral Scotoma',
  'Generalized Reduction',
  'Within Normal Limits',
];

export const HESS_NINE_GAZE_ROWS: readonly (readonly HessGazeId[])[] = [
  ['NW', 'N', 'NE'],
  ['W', 'C', 'E'],
  ['SW', 'S', 'SE'],
];

export const CLINICAL_ASSESSMENT_STATUS_OPTIONS: readonly {
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

export function anatomicalLeftQuadrant(eye: 'OD' | 'OS'): GonioscopyQuadrantId {
  return eye === 'OD' ? 'temporal' : 'nasal';
}

export function anatomicalRightQuadrant(eye: 'OD' | 'OS'): GonioscopyQuadrantId {
  return eye === 'OD' ? 'nasal' : 'temporal';
}

export function formatGonioscopyQuadrantSummary(
  finding: GonioscopyQuadrantFinding,
  viewMode: 'static' | 'dynamic' | 'both' = 'both',
): string {
  if (viewMode === 'static') return `Gr ${finding.staticGrade}`;
  if (viewMode === 'dynamic') return `Gr ${finding.dynamicGrade ?? finding.staticGrade}`;
  const dyn = finding.dynamicGrade ? `→${finding.dynamicGrade}` : '';
  const struct = finding.deepestStructure ? ` (${finding.deepestStructure})` : '';
  return `${finding.staticGrade}${dyn}${struct}`;
}

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

export function resolveVisualFieldReliabilityTone(
  flag: 'reliable' | 'caution' | 'unreliable',
): EmrTone {
  if (flag === 'unreliable') return 'danger';
  if (flag === 'caution') return 'warning';
  return 'success';
}

export function resolveGhtTone(ght: GhtClassification): EmrTone {
  if (ght === 'Outside Normal Limits') return 'danger';
  if (ght === 'Borderline' || ght === 'Generalized Reduction of Sensitivity') return 'warning';
  if (ght === 'Abnormally High Sensitivity') return 'info';
  return 'success';
}

export function resolveProbabilityGlyph(prob: VisualFieldDefectProbability): string {
  if (prob === 'p<5%') return '·';
  if (prob === 'p<2%') return '∷';
  if (prob === 'p<1%') return '▒';
  if (prob === 'p<0.5%') return '▓';
  if (prob === 'absolute') return '■';
  return '•';
}

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

export type {
  ClinicalAssessmentStatus,
  EmrBadge,
  EmrGonioscopyChartIntent,
  EmrGonioscopyChartViewModel,
  EmrHessScreenChartIntent,
  EmrHessScreenChartViewModel,
  EmrTone,
  EmrVisualFieldSummaryIntent,
  EmrVisualFieldSummaryViewModel,
  GhtClassification,
  GonioscopyEyeRecord,
  GonioscopyGradingSystem,
  GonioscopyQuadrantFinding,
  GonioscopyQuadrantId,
  GonioscopyStructure,
  HessEyeRecord,
  HessGazeId,
  HessPlotPoint,
  PbctNineGazeCell,
  ShafferGrade,
  VisualFieldDefectProbability,
  VisualFieldEyeRecord,
  VisualFieldSectorPoint,
  VisualFieldStrategy,
};
