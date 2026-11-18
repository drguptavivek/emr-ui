import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type {
  EmrGonioscopyChartIntent,
  EmrGonioscopyChartViewModel,
  EmrHessScreenChartIntent,
  EmrHessScreenChartViewModel,
  EmrVisualFieldSummaryIntent,
  EmrVisualFieldSummaryViewModel,
} from '../../../../emr-controller/src/l4-ophthalmology-glaucoma-motility.models';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/domain/emr-ophthalmology-glaucoma-motility.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadOphthalmologyGlaucomaMotilityModule() {
  const withoutDecorators = componentSource.replace(
    /@Component\(\{[\s\S]*?\}\)\s*(?=export class Emr)/g,
    '',
  );
  const transpiled = ts.transpileModule(withoutDecorators, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const makeSignal = <T>(initial: T) => {
    let val = initial;
    const sig = () => val;
    sig.set = (next: T) => {
      val = next;
    };
    return sig;
  };

  const mockRequire = (id: string) => {
    if (id === '@angular/core') {
      return {
        ChangeDetectionStrategy: { OnPush: 0 },
        Component: () => (cls: unknown) => cls,
        input: Object.assign(
          <T>(init?: T) => makeSignal<T | undefined>(init),
          { required: <T>() => makeSignal<T | undefined>(undefined) },
        ),
        output: <T>() => {
          const listeners: ((v: T) => void)[] = [];
          return {
            emit: (v: T) => listeners.forEach((l) => l(v)),
            subscribe: (l: (v: T) => void) => listeners.push(l),
          };
        },
      };
    }
    return {};
  };

  const exportsObj: Record<string, unknown> = {};
  const moduleObj = { exports: exportsObj };
  const runner = new Function('exports', 'require', 'module', transpiled);
  runner(exportsObj, mockRequire, moduleObj);
  return moduleObj.exports as {
    EmrGonioscopyChartComponent: new () => Record<string, any>;
    EmrVisualFieldSummaryComponent: new () => Record<string, any>;
    EmrHessScreenChartComponent: new () => Record<string, any>;
    summarizeGonioscopyOccludability: (eye: any) => any;
    evaluateVisualFieldReliability: (fl: string, fp: number, fn: number) => string;
    computeHessFieldAreaRatio: (points: any[]) => any;
  };
}

const mod = loadOphthalmologyGlaucomaMotilityModule();

describe('L4 Ophthalmology Glaucoma & Motility Suite (Angular)', () => {
  it('enforces design-token-only styling, zero browser globals, and standalone imports: []', () => {
    expect(componentSource).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/);
    expect(componentSource).not.toMatch(/\b(?:window|document|navigator|localStorage|sessionStorage)\b/);
    expect(componentSource).toContain("selector: 'emr-gonioscopy-chart'");
    expect(componentSource).toContain("selector: 'emr-visual-field-summary'");
    expect(componentSource).toContain("selector: 'emr-hess-screen-chart'");
  });

  describe('EmrGonioscopyChartComponent', () => {
    const gonioModel: EmrGonioscopyChartViewModel = {
      id: 'gonio-ui',
      title: 'Bilateral 4-Mirror Gonioscopy',
      viewMode: 'both',
      selectedEye: 'OD',
      selectedQuadrant: 'superior',
      od: {
        eye: 'OD',
        gradingSystem: 'shaffer',
        lensUsed: 'Posner 4-Mirror',
        pasClockHours: [12, 1],
        quadrants: {
          superior: { quadrant: 'superior', staticGrade: '0', dynamicGrade: '1', deepestStructure: 'SL', pigmentation: 3, pasPresent: true },
          nasal: { quadrant: 'nasal', staticGrade: 'slit', dynamicGrade: '2', deepestStructure: 'ATM', pigmentation: 2 },
          inferior: { quadrant: 'inferior', staticGrade: '2', dynamicGrade: '3', deepestStructure: 'SS', pigmentation: 3 },
          temporal: { quadrant: 'temporal', staticGrade: '1', dynamicGrade: '3', deepestStructure: 'PTM', pigmentation: 2 },
        },
      },
      os: {
        eye: 'OS',
        gradingSystem: 'shaffer',
        quadrants: {
          superior: { quadrant: 'superior', staticGrade: '2', dynamicGrade: '3' },
          nasal: { quadrant: 'nasal', staticGrade: '3', dynamicGrade: '3' },
          inferior: { quadrant: 'inferior', staticGrade: '3', dynamicGrade: '4' },
          temporal: { quadrant: 'temporal', staticGrade: '3', dynamicGrade: '4' },
        },
      },
    };

    it('orients OD/OS quadrants anatomically, computes occludability, and emits all gonioscopy intents', () => {
      const instance = new mod.EmrGonioscopyChartComponent();
      const emitted: EmrGonioscopyChartIntent[] = [];
      instance.intent.subscribe((i: EmrGonioscopyChartIntent) => emitted.push(i));
      instance.model.set(gonioModel);

      expect(instance.anatomicalLeftQuadrant(gonioModel.od)).toBe('temporal');
      expect(instance.anatomicalRightQuadrant(gonioModel.od)).toBe('nasal');
      expect(instance.anatomicalLeftQuadrant(gonioModel.os)).toBe('nasal');
      expect(instance.anatomicalRightQuadrant(gonioModel.os)).toBe('temporal');

      expect(instance.occludability(gonioModel.od)).toEqual({
        closedQuadrantCount: 3,
        pasClockHourCount: 2,
        isOccludable: true,
      });
      expect(instance.occludability(gonioModel.os).isOccludable).toBe(false);

      instance.selectQuadrant('OD', 'nasal');
      expect(emitted.at(-1)).toEqual({ type: 'quadrantSelected', eye: 'OD', quadrant: 'nasal' });

      instance.setQuadrantGrade('OD', 'superior', 'static', '1');
      expect(emitted.at(-1)).toEqual({
        type: 'quadrantGradeChanged',
        eye: 'OD',
        quadrant: 'superior',
        mode: 'static',
        grade: '1',
      });

      instance.setQuadrantPigmentation('OD', 'superior', 4);
      expect(emitted.at(-1)).toEqual({
        type: 'quadrantPigmentationChanged',
        eye: 'OD',
        quadrant: 'superior',
        pigmentation: 4,
      });

      instance.togglePasClockHour('OD', 2);
      expect(emitted.at(-1)).toEqual({
        type: 'pasClockHourToggled',
        eye: 'OD',
        clockHour: 2,
      });

      instance.setViewMode('dynamic');
      expect(emitted.at(-1)).toEqual({
        type: 'viewModeChanged',
        viewMode: 'dynamic',
      });

      instance.copyEye('OD', 'OS');
      expect(emitted.at(-1)).toEqual({
        type: 'copyEyeRequested',
        fromEye: 'OD',
        toEye: 'OS',
      });

      instance.setEyeAssessmentStatus('OS', 'unable-to-assess');
      expect(emitted.at(-1)).toEqual({
        type: 'eyeAssessmentStatusChanged',
        eye: 'OS',
        status: 'unable-to-assess',
      });
    });
  });

  describe('EmrVisualFieldSummaryComponent', () => {
    const vfModel: EmrVisualFieldSummaryViewModel = {
      id: 'vf-ui',
      activeMapType: 'pattern-deviation',
      od: {
        eye: 'OD',
        strategy: '24-2 SITA-Standard',
        testDate: '2026-11-12',
        fixationLosses: '1/14',
        falsePositivesPct: 3,
        falseNegativesPct: 4,
        vfiPct: 78,
        mdDb: -7.12,
        psdDb: 8.4,
        ght: 'Outside Normal Limits',
        defectPatternLabel: 'Superior Arcuate Scotoma',
        points: [
          {
            id: 'od-sup-1',
            xDeg: -9,
            yDeg: 15,
            totalDeviationDb: -22,
            patternDeviationDb: -20,
            probability: 'p<0.5%',
          },
        ],
      },
      os: {
        eye: 'OS',
        strategy: '24-2 SITA-Standard',
        testDate: '2026-11-12',
        fixationLosses: '0/15',
        falsePositivesPct: 16,
        falseNegativesPct: 5,
        vfiPct: 98,
        mdDb: -0.6,
        psdDb: 1.5,
        ght: 'Within Normal Limits',
        points: [],
      },
    };

    it('evaluates perimetry reliability, switches deviation maps, and emits visual field intents', () => {
      const instance = new mod.EmrVisualFieldSummaryComponent();
      const emitted: EmrVisualFieldSummaryIntent[] = [];
      instance.intent.subscribe((i: EmrVisualFieldSummaryIntent) => emitted.push(i));
      instance.model.set(vfModel);

      expect(instance.reliability(vfModel.od)).toBe('reliable');
      expect(instance.reliability(vfModel.os)).toBe('unreliable');
      expect(instance.ghtTone('Outside Normal Limits')).toBe('danger');
      expect(instance.pointDeviationValue(vfModel.od.points[0]!)).toBe(-20);

      instance.setMapType('total-deviation');
      expect(emitted.at(-1)).toEqual({ type: 'mapTypeChanged', mapType: 'total-deviation' });

      instance.selectPoint('OD', 'od-sup-1');
      expect(emitted.at(-1)).toEqual({ type: 'pointSelected', eye: 'OD', pointId: 'od-sup-1' });

      instance.setDefectPattern('OD', 'Nasal Step');
      expect(emitted.at(-1)).toEqual({
        type: 'defectPatternChanged',
        eye: 'OD',
        patternLabel: 'Nasal Step',
      });

      instance.setEyeAssessmentStatus('OS', 'not-assessed');
      expect(emitted.at(-1)).toEqual({
        type: 'eyeAssessmentStatusChanged',
        eye: 'OS',
        status: 'not-assessed',
      });
    });
  });

  describe('EmrHessScreenChartComponent', () => {
    const hessModel: EmrHessScreenChartViewModel = {
      id: 'hess-ui',
      activeDistanceMode: 'distance-6m',
      selectedGazeId: 'SW',
      leftChartOsFixing: {
        fixingEye: 'OS',
        plottedEye: 'OD',
        primaryRestrictionMuscle: 'Right Superior Oblique (RSO)',
        innerFieldPoints: [
          { gazeId: 'NW', expectedXDeg: -15, expectedYDeg: 15, plottedXDeg: -14, plottedYDeg: 16 },
          { gazeId: 'NE', expectedXDeg: 15, expectedYDeg: 15, plottedXDeg: 14, plottedYDeg: 18 },
          { gazeId: 'SE', expectedXDeg: 15, expectedYDeg: -15, plottedXDeg: 12, plottedYDeg: -12 },
          { gazeId: 'SW', expectedXDeg: -15, expectedYDeg: -15, plottedXDeg: -10, plottedYDeg: -6 },
        ],
        outerFieldPoints: [],
      },
      rightChartOdFixing: {
        fixingEye: 'OD',
        plottedEye: 'OS',
        primaryOveractionMuscle: 'Left Inferior Rectus (LIR)',
        innerFieldPoints: [],
        outerFieldPoints: [],
      },
      pbctDistanceCells: {
        NW: { gazeId: 'NW', horizontalDelta: 'Ortho', verticalDelta: 'RHT 6Δ' },
        N: { gazeId: 'N', horizontalDelta: 'Ortho', verticalDelta: 'RHT 8Δ' },
        NE: { gazeId: 'NE', horizontalDelta: 'Ortho', verticalDelta: 'RHT 4Δ' },
        W: { gazeId: 'W', horizontalDelta: 'Ortho', verticalDelta: 'RHT 18Δ' },
        C: { gazeId: 'C', horizontalDelta: 'Ortho', verticalDelta: 'RHT 12Δ' },
        E: { gazeId: 'E', horizontalDelta: 'Ortho', verticalDelta: 'RHT 4Δ' },
        SW: { gazeId: 'SW', horizontalDelta: '2Δ ET', verticalDelta: 'RHT 24Δ' },
        S: { gazeId: 'S', horizontalDelta: 'Ortho', verticalDelta: 'RHT 14Δ' },
        SE: { gazeId: 'SE', horizontalDelta: 'Ortho', verticalDelta: 'RHT 6Δ' },
      },
      headTiltCells: {
        rightTiltDelta: 'RHT 22Δ (Positive Bielschowsky)',
        leftTiltDelta: 'RHT 4Δ',
      },
    };

    it('computes field area ratios, builds SVG polygon points, and emits Hess / PBCT intents', () => {
      const instance = new mod.EmrHessScreenChartComponent();
      const emitted: EmrHessScreenChartIntent[] = [];
      instance.intent.subscribe((i: EmrHessScreenChartIntent) => emitted.push(i));
      instance.model.set(hessModel);

      const ratio = instance.fieldAreaSummary(hessModel.leftChartOsFixing.innerFieldPoints);
      expect(ratio).toEqual({
        plottedSpanX: 28,
        plottedSpanY: 30,
        expectedSpanX: 30,
        expectedSpanY: 30,
      });
      expect(instance.polygonPointsAttr(hessModel.leftChartOsFixing.innerFieldPoints)).toContain(',');

      instance.selectPoint('left-os-fixing', 'inner', 'SW');
      expect(emitted.at(-1)).toEqual({
        type: 'pointSelected',
        chart: 'left-os-fixing',
        field: 'inner',
        gazeId: 'SW',
      });

      instance.nudgePoint('left-os-fixing', 'inner', 'SW', 0, -2);
      expect(emitted.at(-1)).toEqual({
        type: 'pointNudged',
        chart: 'left-os-fixing',
        field: 'inner',
        gazeId: 'SW',
        dxDeg: 0,
        dyDeg: -2,
      });

      instance.editPbctCell('SW', '2Δ ET', 'RHT 24Δ');
      expect(emitted.at(-1)).toEqual({
        type: 'pbctCellEdited',
        distanceMode: 'distance-6m',
        gazeId: 'SW',
        horizontalDelta: '2Δ ET',
        verticalDelta: 'RHT 24Δ',
      });

      instance.setDistanceMode('near-33cm');
      expect(emitted.at(-1)).toEqual({
        type: 'distanceModeChanged',
        distanceMode: 'near-33cm',
      });
    });
  });
});
