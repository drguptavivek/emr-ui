import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type {
  EmrGonioscopyChartIntent,
  EmrGonioscopyChartViewModel,
  EmrHessScreenChartIntent,
  EmrHessScreenChartViewModel,
  EmrVisualFieldSummaryIntent,
  EmrVisualFieldSummaryViewModel,
} from '@drguptavivek/emr-controller';
import {
  EmrGonioscopyChartComponent,
  EmrHessScreenChartComponent,
  EmrVisualFieldSummaryComponent,
} from '../domain/emr-ophthalmology-glaucoma-motility.component';

export const gonioscopyAngleClosureSuspectFixture: EmrGonioscopyChartViewModel = {
  id: 'gonio-pacs-01',
  title: 'Bilateral 4-Quadrant Gonioscopy & Angle Evaluation',
  subtitle: 'Sussman 4-Mirror Indentation Gonioscopy · Primary Angle Closure Suspect (PACS) OD > OS',
  selectedEye: 'OD',
  selectedQuadrant: 'superior',
  viewMode: 'both',
  od: {
    eye: 'OD',
    assessmentStatus: 'recorded',
    gradingSystem: 'shaffer',
    lensUsed: 'Sussman 4-Mirror',
    vanHerickGrade: '1',
    pasClockHours: [11, 12, 1],
    spaethNotationSummary: 'A15s 3+ PT (PAS 11–1 o’clock)',
    overallBadge: { label: 'Occludable · PACS / PAC', tone: 'danger' },
    notes: 'Appositional closure in 3 quadrants opening to PTM on indentation; broad PAS superiorly.',
    quadrants: {
      superior: {
        quadrant: 'superior',
        staticGrade: '0',
        dynamicGrade: '1',
        deepestStructure: 'SL',
        pigmentation: 3,
        irisConfiguration: 'convex',
        pasPresent: true,
        note: 'PAS 11–1 o’clock',
      },
      nasal: {
        quadrant: 'nasal',
        staticGrade: 'slit',
        dynamicGrade: '2',
        deepestStructure: 'ATM',
        pigmentation: 2,
        irisConfiguration: 'convex',
      },
      inferior: {
        quadrant: 'inferior',
        staticGrade: '2',
        dynamicGrade: '3',
        deepestStructure: 'SS',
        pigmentation: 3,
        irisConfiguration: 'flat',
        sampaolesiLine: true,
      },
      temporal: {
        quadrant: 'temporal',
        staticGrade: '1',
        dynamicGrade: '3',
        deepestStructure: 'PTM',
        pigmentation: 2,
        irisConfiguration: 'convex',
      },
    },
  },
  os: {
    eye: 'OS',
    assessmentStatus: 'recorded',
    gradingSystem: 'shaffer',
    lensUsed: 'Sussman 4-Mirror',
    vanHerickGrade: '2',
    pasClockHours: [],
    spaethNotationSummary: 'B25r 2+ PT',
    overallBadge: { label: 'Narrow Superiorly', tone: 'warning' },
    notes: 'No synechial closure; opens to Scleral Spur in all 4 quadrants on dynamic indentation.',
    quadrants: {
      superior: {
        quadrant: 'superior',
        staticGrade: '1',
        dynamicGrade: '3',
        deepestStructure: 'ATM',
        pigmentation: 2,
        irisConfiguration: 'convex',
      },
      nasal: {
        quadrant: 'nasal',
        staticGrade: '2',
        dynamicGrade: '3',
        deepestStructure: 'PTM',
        pigmentation: 2,
        irisConfiguration: 'flat',
      },
      inferior: {
        quadrant: 'inferior',
        staticGrade: '3',
        dynamicGrade: '4',
        deepestStructure: 'SS',
        pigmentation: 2,
        irisConfiguration: 'flat',
      },
      temporal: {
        quadrant: 'temporal',
        staticGrade: '2',
        dynamicGrade: '3',
        deepestStructure: 'PTM',
        pigmentation: 1,
        irisConfiguration: 'flat',
      },
    },
  },
};

export const visualFieldArcuateScotomaFixture: EmrVisualFieldSummaryViewModel = {
  id: 'vf-arcuate-01',
  title: 'Bilateral Automated Perimetry Summary (24-2 SITA-Standard)',
  subtitle: 'Humphrey Field Analyzer 3 · Glaucoma Hemifield & Pattern Deviation Assessment',
  activeMapType: 'pattern-deviation',
  selectedEye: 'OD',
  selectedPointId: 'od-sup-arc-1',
  od: {
    eye: 'OD',
    assessmentStatus: 'recorded',
    strategy: '24-2 SITA-Standard',
    testDate: '12 Nov 2026',
    pupilDiameterMm: 4.2,
    fixationLosses: '1/15',
    falsePositivesPct: 2,
    falseNegativesPct: 4,
    reliabilityFlag: 'reliable',
    vfiPct: 79,
    mdDb: -7.45,
    mdProbability: 'p < 0.5%',
    psdDb: 8.92,
    psdProbability: 'p < 0.5%',
    ght: 'Outside Normal Limits',
    defectPatternLabel: 'Superior Arcuate Scotoma',
    progressionSummary: 'Likely progression (-1.4 dB/yr) along inferior neuroretinal rim notch',
    badge: { label: 'Moderate POAG Defect', tone: 'danger' },
    points: [
      { id: 'od-sup-arc-1', xDeg: -9, yDeg: 15, totalDeviationDb: -24, patternDeviationDb: -22, probability: 'p<0.5%' },
      { id: 'od-sup-arc-2', xDeg: -3, yDeg: 15, totalDeviationDb: -28, patternDeviationDb: -26, probability: 'absolute' },
      { id: 'od-sup-arc-3', xDeg: 3, yDeg: 15, totalDeviationDb: -19, patternDeviationDb: -17, probability: 'p<0.5%' },
      { id: 'od-nas-step', xDeg: -21, yDeg: 3, totalDeviationDb: -14, patternDeviationDb: -12, probability: 'p<1%' },
      { id: 'od-inf-norm', xDeg: -9, yDeg: -15, totalDeviationDb: -1, patternDeviationDb: 0, probability: 'normal' },
      { id: 'od-temp-norm', xDeg: 15, yDeg: -9, totalDeviationDb: -2, patternDeviationDb: -1, probability: 'normal' },
    ],
  },
  os: {
    eye: 'OS',
    assessmentStatus: 'recorded',
    strategy: '24-2 SITA-Standard',
    testDate: '12 Nov 2026',
    pupilDiameterMm: 4.4,
    fixationLosses: '0/14',
    falsePositivesPct: 1,
    falseNegativesPct: 2,
    reliabilityFlag: 'reliable',
    vfiPct: 98,
    mdDb: -0.62,
    psdDb: 1.54,
    ght: 'Within Normal Limits',
    defectPatternLabel: 'Within Normal Limits',
    progressionSummary: 'Stable VFI 98–99% over 4 consecutive baseline exams',
    badge: { label: 'Full Field', tone: 'success' },
    points: [
      { id: 'os-sup-1', xDeg: -9, yDeg: 15, totalDeviationDb: -1, patternDeviationDb: 0, probability: 'normal' },
      { id: 'os-sup-2', xDeg: 9, yDeg: 15, totalDeviationDb: -4, patternDeviationDb: -3, probability: 'p<5%' },
      { id: 'os-inf-1', xDeg: -9, yDeg: -15, totalDeviationDb: 0, patternDeviationDb: 0, probability: 'normal' },
      { id: 'os-inf-2', xDeg: 9, yDeg: -15, totalDeviationDb: -1, patternDeviationDb: 0, probability: 'normal' },
    ],
  },
};

export const hessScreenFourthNervePalsyFixture: EmrHessScreenChartViewModel = {
  id: 'hess-cn4-01',
  title: 'Hess / Lees Tangent Screen & 9-Gaze Prism Bar Cover Test (PBCT)',
  subtitle: 'Right Fourth Cranial Nerve (CN IV / Trochlear) Palsy · Parks-Bielschowsky 3-Step Positive',
  diagnosisSummary:
    'Right hypertropia (RHT 12Δ in primary gaze) worsening on left gaze (RHT 18Δ), down-and-left gaze (RHT 24Δ), and right head tilt (RHT 22Δ).',
  activeDistanceMode: 'distance-6m',
  selectedChart: 'left-os-fixing',
  selectedGazeId: 'SW',
  leftChartOsFixing: {
    fixingEye: 'OS',
    plottedEye: 'OD',
    assessmentStatus: 'recorded',
    primaryRestrictionMuscle: 'Right Superior Oblique (RSO -3)',
    primaryOveractionMuscle: 'Right Inferior Oblique (RIO +2)',
    innerFieldPoints: [
      { gazeId: 'NW', expectedXDeg: -15, expectedYDeg: 15, plottedXDeg: -14, plottedYDeg: 20, torsionDeg: 6 },
      { gazeId: 'N', expectedXDeg: 0, expectedYDeg: 15, plottedXDeg: 0, plottedYDeg: 18, torsionDeg: 5 },
      { gazeId: 'NE', expectedXDeg: 15, expectedYDeg: 15, plottedXDeg: 14, plottedYDeg: 16, torsionDeg: 4 },
      { gazeId: 'E', expectedXDeg: 15, expectedYDeg: 0, plottedXDeg: 14, plottedYDeg: 2, torsionDeg: 4 },
      { gazeId: 'SE', expectedXDeg: 15, expectedYDeg: -15, plottedXDeg: 13, plottedYDeg: -12, torsionDeg: 5 },
      { gazeId: 'S', expectedXDeg: 0, expectedYDeg: -15, plottedXDeg: -1, plottedYDeg: -9, torsionDeg: 7 },
      { gazeId: 'SW', expectedXDeg: -15, expectedYDeg: -15, plottedXDeg: -10, plottedYDeg: -6, torsionDeg: 9 },
      { gazeId: 'W', expectedXDeg: -15, expectedYDeg: 0, plottedXDeg: -13, plottedYDeg: 7, torsionDeg: 7 },
    ],
    outerFieldPoints: [
      { gazeId: 'NW', expectedXDeg: -30, expectedYDeg: 30, plottedXDeg: -28, plottedYDeg: 30 },
      { gazeId: 'N', expectedXDeg: 0, expectedYDeg: 30, plottedXDeg: 0, plottedYDeg: 30 },
      { gazeId: 'NE', expectedXDeg: 30, expectedYDeg: 30, plottedXDeg: 28, plottedYDeg: 29 },
      { gazeId: 'E', expectedXDeg: 30, expectedYDeg: 0, plottedXDeg: 28, plottedYDeg: 3 },
      { gazeId: 'SE', expectedXDeg: 30, expectedYDeg: -30, plottedXDeg: 26, plottedYDeg: -24 },
      { gazeId: 'S', expectedXDeg: 0, expectedYDeg: -30, plottedXDeg: -2, plottedYDeg: -19 },
      { gazeId: 'SW', expectedXDeg: -30, expectedYDeg: -30, plottedXDeg: -21, plottedYDeg: -14 },
      { gazeId: 'W', expectedXDeg: -30, expectedYDeg: 0, plottedXDeg: -26, plottedYDeg: 10 },
    ],
  },
  rightChartOdFixing: {
    fixingEye: 'OD',
    plottedEye: 'OS',
    assessmentStatus: 'recorded',
    primaryRestrictionMuscle: 'None',
    primaryOveractionMuscle: 'Left Inferior Rectus (LIR +3 Secondary Overaction)',
    innerFieldPoints: [
      { gazeId: 'NW', expectedXDeg: -15, expectedYDeg: 15, plottedXDeg: -15, plottedYDeg: 13 },
      { gazeId: 'N', expectedXDeg: 0, expectedYDeg: 15, plottedXDeg: 0, plottedYDeg: 12 },
      { gazeId: 'NE', expectedXDeg: 15, expectedYDeg: 15, plottedXDeg: 16, plottedYDeg: 10 },
      { gazeId: 'E', expectedXDeg: 15, expectedYDeg: 0, plottedXDeg: 18, plottedYDeg: -7 },
      { gazeId: 'SE', expectedXDeg: 15, expectedYDeg: -15, plottedXDeg: 20, plottedYDeg: -23 },
      { gazeId: 'S', expectedXDeg: 0, expectedYDeg: -15, plottedXDeg: 2, plottedYDeg: -21 },
      { gazeId: 'SW', expectedXDeg: -15, expectedYDeg: -15, plottedXDeg: -14, plottedYDeg: -17 },
      { gazeId: 'W', expectedXDeg: -15, expectedYDeg: 0, plottedXDeg: -15, plottedYDeg: -3 },
    ],
    outerFieldPoints: [
      { gazeId: 'NW', expectedXDeg: -30, expectedYDeg: 30, plottedXDeg: -29, plottedYDeg: 27 },
      { gazeId: 'N', expectedXDeg: 0, expectedYDeg: 30, plottedXDeg: 0, plottedYDeg: 25 },
      { gazeId: 'NE', expectedXDeg: 30, expectedYDeg: 30, plottedXDeg: 30, plottedYDeg: 22 },
      { gazeId: 'E', expectedXDeg: 30, expectedYDeg: 0, plottedXDeg: 30, plottedYDeg: -11 },
      { gazeId: 'SE', expectedXDeg: 30, expectedYDeg: -30, plottedXDeg: 30, plottedYDeg: -30 },
      { gazeId: 'S', expectedXDeg: 0, expectedYDeg: -30, plottedXDeg: 3, plottedYDeg: -30 },
      { gazeId: 'SW', expectedXDeg: -30, expectedYDeg: -30, plottedXDeg: -28, plottedYDeg: -30 },
      { gazeId: 'W', expectedXDeg: -30, expectedYDeg: 0, plottedXDeg: -29, plottedYDeg: -5 },
    ],
  },
  pbctDistanceCells: {
    NW: { gazeId: 'NW', horizontalDelta: 'Ortho', verticalDelta: 'RHT 14Δ', torsionLabel: '7° Excyclo' },
    N: { gazeId: 'N', horizontalDelta: 'Ortho', verticalDelta: 'RHT 8Δ', torsionLabel: '5° Excyclo' },
    NE: { gazeId: 'NE', horizontalDelta: 'Ortho', verticalDelta: 'RHT 4Δ', torsionLabel: '4° Excyclo' },
    W: {
      gazeId: 'W',
      horizontalDelta: 'Ortho',
      verticalDelta: 'RHT 18Δ',
      torsionLabel: '7° Excyclo',
      badge: { label: 'Levo Increase', tone: 'warning' },
    },
    C: {
      gazeId: 'C',
      horizontalDelta: 'Ortho',
      verticalDelta: 'RHT 12Δ',
      torsionLabel: '6° Excyclo',
      badge: { label: 'Primary Gaze', tone: 'info' },
    },
    E: { gazeId: 'E', horizontalDelta: 'Ortho', verticalDelta: 'RHT 4Δ', torsionLabel: '4° Excyclo' },
    SW: {
      gazeId: 'SW',
      horizontalDelta: '2Δ ET',
      verticalDelta: 'RHT 24Δ',
      torsionLabel: '9° Excyclo',
      badge: { label: 'Max RSO Field', tone: 'danger' },
    },
    S: { gazeId: 'S', horizontalDelta: '2Δ ET', verticalDelta: 'RHT 14Δ', torsionLabel: '7° Excyclo' },
    SE: { gazeId: 'SE', horizontalDelta: 'Ortho', verticalDelta: 'RHT 6Δ', torsionLabel: '5° Excyclo' },
  },
  pbctNearCells: {
    NW: { gazeId: 'NW', horizontalDelta: 'Ortho', verticalDelta: 'RHT 16Δ' },
    N: { gazeId: 'N', horizontalDelta: 'Ortho', verticalDelta: 'RHT 10Δ' },
    NE: { gazeId: 'NE', horizontalDelta: 'Ortho', verticalDelta: 'RHT 4Δ' },
    W: { gazeId: 'W', horizontalDelta: '2Δ ET', verticalDelta: 'RHT 20Δ' },
    C: { gazeId: 'C', horizontalDelta: '2Δ ET', verticalDelta: 'RHT 14Δ' },
    E: { gazeId: 'E', horizontalDelta: 'Ortho', verticalDelta: 'RHT 6Δ' },
    SW: { gazeId: 'SW', horizontalDelta: '4Δ ET', verticalDelta: 'RHT 26Δ' },
    S: { gazeId: 'S', horizontalDelta: '2Δ ET', verticalDelta: 'RHT 16Δ' },
    SE: { gazeId: 'SE', horizontalDelta: 'Ortho', verticalDelta: 'RHT 8Δ' },
  },
  headTiltCells: {
    rightTiltDelta: 'RHT 22Δ (Positive Bielschowsky)',
    leftTiltDelta: 'RHT 4Δ',
  },
};

const meta: Meta<EmrGonioscopyChartComponent> = {
  title: 'EMR / Ophthalmology / Glaucoma & Motility',
  component: EmrGonioscopyChartComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EmrGonioscopyChartComponent,
        EmrVisualFieldSummaryComponent,
        EmrHessScreenChartComponent,
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<EmrGonioscopyChartComponent>;

export const GonioscopyAngleClosureSuspect: Story = {
  render: () => ({
    props: {
      model: gonioscopyAngleClosureSuspectFixture,
      onIntent(this: { model: EmrGonioscopyChartViewModel }, e: EmrGonioscopyChartIntent) {
        if (e.type === 'quadrantSelected') {
          this.model = { ...this.model, selectedEye: e.eye, selectedQuadrant: e.quadrant };
        } else if (e.type === 'viewModeChanged') {
          this.model = { ...this.model, viewMode: e.viewMode };
        } else if (e.type === 'quadrantGradeChanged') {
          const targetEye = e.eye === 'OD' ? this.model.od : this.model.os;
          const prevQuad = targetEye.quadrants[e.quadrant];
          const nextQuad =
            e.mode === 'static'
              ? { ...prevQuad, staticGrade: e.grade }
              : { ...prevQuad, dynamicGrade: e.grade };
          const nextEye = {
            ...targetEye,
            quadrants: { ...targetEye.quadrants, [e.quadrant]: nextQuad },
          };
          this.model = e.eye === 'OD' ? { ...this.model, od: nextEye } : { ...this.model, os: nextEye };
        } else if (e.type === 'pasClockHourToggled') {
          const targetEye = e.eye === 'OD' ? this.model.od : this.model.os;
          const current = targetEye.pasClockHours ?? [];
          const nextHours = current.includes(e.clockHour)
            ? current.filter((h) => h !== e.clockHour)
            : [...current, e.clockHour];
          const nextEye = { ...targetEye, pasClockHours: nextHours };
          this.model = e.eye === 'OD' ? { ...this.model, od: nextEye } : { ...this.model, os: nextEye };
        }
      },
    },
    template: `
      <div class="emr-story-surface">
        <emr-gonioscopy-chart [model]="model" (intent)="onIntent($event)" />
      </div>
    `,
  }),
};

export const VisualFieldArcuateScotoma: Story = {
  render: () => ({
    props: {
      model: visualFieldArcuateScotomaFixture,
      onIntent(this: { model: EmrVisualFieldSummaryViewModel }, e: EmrVisualFieldSummaryIntent) {
        if (e.type === 'mapTypeChanged') {
          this.model = { ...this.model, activeMapType: e.mapType };
        } else if (e.type === 'pointSelected') {
          this.model = { ...this.model, selectedEye: e.eye, selectedPointId: e.pointId };
        } else if (e.type === 'defectPatternChanged') {
          const targetEye = e.eye === 'OD' ? this.model.od : this.model.os;
          const nextEye = { ...targetEye, defectPatternLabel: e.patternLabel };
          this.model = e.eye === 'OD' ? { ...this.model, od: nextEye } : { ...this.model, os: nextEye };
        }
      },
    },
    template: `
      <div class="emr-story-surface">
        <emr-visual-field-summary [model]="model" (intent)="onIntent($event)" />
      </div>
    `,
  }),
};

export const HessScreenFourthNervePalsy: Story = {
  render: () => ({
    props: {
      model: hessScreenFourthNervePalsyFixture,
      onIntent(this: { model: EmrHessScreenChartViewModel }, e: EmrHessScreenChartIntent) {
        if (e.type === 'distanceModeChanged') {
          this.model = { ...this.model, activeDistanceMode: e.distanceMode };
        } else if (e.type === 'pointSelected') {
          this.model = { ...this.model, selectedChart: e.chart, selectedGazeId: e.gazeId };
        }
      },
    },
    template: `
      <div class="emr-story-surface">
        <emr-hess-screen-chart [model]="model" (intent)="onIntent($event)" />
      </div>
    `,
  }),
};
