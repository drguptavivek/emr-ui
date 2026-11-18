import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type {
  EmrContactLensPrescriptionIntent,
  EmrContactLensPrescriptionViewModel,
  EmrCornealTopographySummaryIntent,
  EmrCornealTopographySummaryViewModel,
  EmrIntravitrealCourseTrackerIntent,
  EmrIntravitrealCourseTrackerViewModel,
  EmrIolBiometryPlannerIntent,
  EmrIolBiometryPlannerViewModel,
  EmrOphthalmicOperativeRecordIntent,
  EmrOphthalmicOperativeRecordViewModel,
} from '../../../../emr-controller/src/l4-ophthalmology-cataract-retina-cornea.models';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/domain/emr-ophthalmology-cataract-retina-cornea.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadOphthalmologyCataractRetinaCorneaModule() {
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
    EmrIolBiometryPlannerComponent: new () => Record<string, any>;
    EmrIntravitrealCourseTrackerComponent: new () => Record<string, any>;
    EmrCornealTopographySummaryComponent: new () => Record<string, any>;
    EmrOphthalmicOperativeRecordComponent: new () => Record<string, any>;
    EmrContactLensPrescriptionComponent: new () => Record<string, any>;
    evaluateBiometryInterOcularDelta: (od: number, os: number) => { diffMm: number; warning?: string };
    computeIntravitrealCstDelta: (b: number, l: number) => { deltaUm: number; pctChange: number };
    classifyEctasiaScreening: (kMax: number, thin: number, badD?: number) => string;
  };
}

const mod = loadOphthalmologyCataractRetinaCorneaModule();

describe('L4 Ophthalmology Cataract, Retina & Cornea Suite (Angular)', () => {
  it('enforces design-token-only styling, zero browser globals, and zero runtime controller imports', () => {
    expect(componentSource).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/);
    expect(componentSource).not.toMatch(/\b(?:window|document|navigator|localStorage|sessionStorage|fetch)\b/);
    expect(componentSource).toContain('import type {');
    expect(componentSource).toContain("from '@drguptavivek/emr-controller';");
  });

  describe('EmrIolBiometryPlannerComponent', () => {
    const bioModel: EmrIolBiometryPlannerViewModel = {
      id: 'bio-1',
      title: 'Optical Biometry & Toric IOL Planner',
      od: {
        eye: 'OD',
        deviceLabel: 'IOLMaster 700',
        axialLengthMm: 24.25,
        acdMm: 3.24,
        k1Diopters: 43.0,
        k1AxisDeg: 180,
        k2Diopters: 45.25,
        k2AxisDeg: 90,
        cornealDeltaKD: '+2.25 D @ 90°',
        targetRefractionD: '0.00 D',
        activeFormula: 'Barrett Universal II',
        availableFormulas: ['Barrett Universal II', 'Kane', 'Evo 2.0'],
        lensModelLabel: 'AcrySof IQ Toric SN6AT4',
        aConstant: '119.2',
        candidates: [
          {
            id: 'c1',
            powerDiopters: '+20.5 D',
            predictedRefractionD: '-0.04 D',
            isEmmetropiaTarget: true,
            isSelected: true,
          },
          {
            id: 'c2',
            powerDiopters: '+21.0 D',
            predictedRefractionD: '-0.39 D',
          },
        ],
      },
      os: {
        eye: 'OS',
        deviceLabel: 'IOLMaster 700',
        axialLengthMm: 23.65,
        acdMm: 3.12,
        k1Diopters: 43.5,
        k1AxisDeg: 175,
        k2Diopters: 44.0,
        k2AxisDeg: 85,
        cornealDeltaKD: '+0.50 D @ 85°',
        targetRefractionD: '0.00 D',
        activeFormula: 'Kane',
        availableFormulas: ['Barrett Universal II', 'Kane'],
        lensModelLabel: 'Clareon Monofocal',
        aConstant: '119.1',
        candidates: [],
      },
    };

    it('computes inter-ocular AL delta and emits formulaSelected, candidateSelected, targetRefractionChanged, and incisionMeridianChanged', () => {
      const instance = new mod.EmrIolBiometryPlannerComponent();
      const emitted: EmrIolBiometryPlannerIntent[] = [];
      instance.intent.subscribe((i: EmrIolBiometryPlannerIntent) => emitted.push(i));
      instance.model.set(bioModel);

      expect(instance.eyes()).toHaveLength(2);
      expect(instance.interOcularDelta().diffMm).toBe(0.6);
      expect(instance.interOcularDelta().warning).toContain('0.60 mm');

      instance.selectFormula('OD', 'Kane');
      expect(emitted.at(-1)).toEqual({ type: 'formulaSelected', eye: 'OD', formula: 'Kane' });

      instance.selectCandidate('OD', bioModel.od.candidates[1]!);
      expect(emitted.at(-1)).toEqual({
        type: 'candidateSelected',
        eye: 'OD',
        candidateId: 'c2',
        powerDiopters: '+21.0 D',
      });

      instance.setTargetRefraction('OD', '-0.25 D');
      expect(emitted.at(-1)).toEqual({
        type: 'targetRefractionChanged',
        eye: 'OD',
        targetRefractionD: '-0.25 D',
      });

      instance.setIncisionMeridian('OD', 115);
      expect(emitted.at(-1)).toEqual({
        type: 'incisionMeridianChanged',
        eye: 'OD',
        meridianDeg: 115,
      });
    });
  });

  describe('EmrIntravitrealCourseTrackerComponent', () => {
    const ivtModel: EmrIntravitrealCourseTrackerViewModel = {
      id: 'ivt-1',
      activeEye: 'OU',
      od: {
        eye: 'OD',
        indication: 'Diabetic Macular Edema',
        currentRegimen: 'treat-and-extend',
        currentAgent: 'Aflibercept 2 mg',
        totalInjectionsCount: 6,
        currentIntervalWeeks: 8,
        baselineCstUm: 480,
        latestCstUm: 288,
        visits: [
          {
            id: 'v1',
            visitNumber: 1,
            date: '2026-08-01',
            eye: 'OD',
            cstUm: 480,
            bcvaLabel: '6/24',
            fluidFlags: { irf: true, srf: true, ped: false },
            decision: 'inject-maintain',
          },
        ],
      },
      os: {
        eye: 'OS',
        indication: 'Diabetic Macular Edema',
        currentRegimen: 'prn',
        currentAgent: 'Aflibercept 2 mg',
        totalInjectionsCount: 3,
        currentIntervalWeeks: 12,
        baselineCstUm: 350,
        latestCstUm: 265,
        visits: [],
      },
    };

    it('computes CST delta, formats fluid flags, and emits activeEyeChanged, visitSelected, intervalAdjusted, and recordInjectionRequested', () => {
      const instance = new mod.EmrIntravitrealCourseTrackerComponent();
      const emitted: EmrIntravitrealCourseTrackerIntent[] = [];
      instance.intent.subscribe((i: EmrIntravitrealCourseTrackerIntent) => emitted.push(i));
      instance.model.set(ivtModel);

      expect(instance.visibleCourses()).toHaveLength(2);
      expect(instance.cstDeltaFor(ivtModel.od)).toEqual({ deltaUm: -192, pctChange: -40 });
      expect(instance.formatFluidFlags(ivtModel.od.visits[0]!)).toBe('IRF+ · SRF+');

      instance.selectActiveEye('OD');
      expect(emitted.at(-1)).toEqual({ type: 'activeEyeChanged', eye: 'OD' });

      instance.selectVisit('OD', 'v1');
      expect(emitted.at(-1)).toEqual({ type: 'visitSelected', eye: 'OD', visitId: 'v1' });

      instance.adjustInterval(ivtModel.od, 2, 'inject-extend');
      expect(emitted.at(-1)).toEqual({
        type: 'intervalAdjusted',
        eye: 'OD',
        nextIntervalWeeks: 10,
        decision: 'inject-extend',
      });

      instance.recordInjection(ivtModel.od);
      expect(emitted.at(-1)).toEqual({
        type: 'recordInjectionRequested',
        eye: 'OD',
        agent: 'Aflibercept 2 mg',
      });
    });
  });

  describe('EmrCornealTopographySummaryComponent', () => {
    const topoModel: EmrCornealTopographySummaryViewModel = {
      id: 'topo-1',
      activeMap: 'axial-curvature',
      od: {
        eye: 'OD',
        deviceLabel: 'Pentacam HR',
        qualityScore: 'OK',
        k1FlatD: 45.4,
        k1AxisDeg: 175,
        k2SteepD: 49.8,
        k2AxisDeg: 85,
        kMaxD: 54.2,
        astigmatismD: 4.4,
        centralPachymetryUm: 468,
        thinnestPachymetryUm: 442,
        badDIndex: 5.1,
        ectasiaRisk: 'ectasia-suspect',
      },
      os: {
        eye: 'OS',
        deviceLabel: 'Pentacam HR',
        qualityScore: 'OK',
        k1FlatD: 43.2,
        k1AxisDeg: 5,
        k2SteepD: 44.1,
        k2AxisDeg: 95,
        kMaxD: 44.8,
        astigmatismD: 0.9,
        centralPachymetryUm: 528,
        thinnestPachymetryUm: 520,
        badDIndex: 0.9,
        ectasiaRisk: 'normal',
      },
    };

    it('screens ectasia risk and emits activeMapChanged, ectasiaRiskChanged, and eyeAssessmentStatusChanged', () => {
      const instance = new mod.EmrCornealTopographySummaryComponent();
      const emitted: EmrCornealTopographySummaryIntent[] = [];
      instance.intent.subscribe((i: EmrCornealTopographySummaryIntent) => emitted.push(i));
      instance.model.set(topoModel);

      expect(instance.screenedRisk(topoModel.od)).toBe('ectasia-suspect');
      expect(instance.screenedRisk(topoModel.os)).toBe('normal');

      instance.selectMap('pachymetry');
      expect(emitted.at(-1)).toEqual({ type: 'activeMapChanged', mapType: 'pachymetry' });

      instance.setEctasiaRisk('OS', 'borderline');
      expect(emitted.at(-1)).toEqual({ type: 'ectasiaRiskChanged', eye: 'OS', risk: 'borderline' });

      instance.setAssessmentStatus('OS', 'unable-to-assess');
      expect(emitted.at(-1)).toEqual({
        type: 'eyeAssessmentStatusChanged',
        eye: 'OS',
        status: 'unable-to-assess',
      });
    });
  });

  describe('EmrOphthalmicOperativeRecordComponent', () => {
    const opModel: EmrOphthalmicOperativeRecordViewModel = {
      id: 'op-1',
      procedureName: 'Phacoemulsification + Toric IOL Implantation',
      operatedEye: 'OD',
      timeoutVerified: true,
      surgeonName: 'Dr. Vivek Gupta',
      anesthesiaType: 'Topical',
      mainIncisionMeridianDeg: 110,
      mainIncisionWidthMm: 2.2,
      capsulorhexisStatus: 'Continuous Curvilinear (Intact)',
      posteriorCapsuleStatus: 'Intact',
      iolImplant: {
        modelName: 'AcrySof IQ Toric SN6AT4',
        powerDiopters: '+20.5 D',
        serialNumber: 'SN-2026-0091',
        placement: 'In-the-Bag',
      },
      prophylaxis: {
        intracameralAntibiotic: 'Moxifloxacin 0.5 mg',
      },
      postOpRegimenSummary: 'Prednisolone 1% QID taper',
    };

    it('emits timeoutToggled, posteriorCapsuleStatusChanged, iolSerialChanged, and signOperativeNoteRequested', () => {
      const instance = new mod.EmrOphthalmicOperativeRecordComponent();
      const emitted: EmrOphthalmicOperativeRecordIntent[] = [];
      instance.intent.subscribe((i: EmrOphthalmicOperativeRecordIntent) => emitted.push(i));
      instance.model.set(opModel);

      instance.toggleTimeout();
      expect(emitted.at(-1)).toEqual({ type: 'timeoutToggled', verified: false });

      instance.setPosteriorCapsuleStatus('PCR without Vitreous Loss');
      expect(emitted.at(-1)).toEqual({
        type: 'posteriorCapsuleStatusChanged',
        status: 'PCR without Vitreous Loss',
      });

      instance.setIolSerial('SN-2026-9999');
      expect(emitted.at(-1)).toEqual({
        type: 'iolSerialChanged',
        serialNumber: 'SN-2026-9999',
      });

      instance.requestSignOperativeNote();
      expect(emitted.at(-1)).toEqual({ type: 'signOperativeNoteRequested' });
    });
  });

  describe('EmrContactLensPrescriptionComponent', () => {
    const clModel: EmrContactLensPrescriptionViewModel = {
      id: 'cl-1',
      issueDate: '2026-11-12',
      expiryDate: '2027-11-12',
      replacementSchedule: 'Monthly',
      wearingScheduleHoursPerDay: 12,
      careRegimenSolution: 'Multipurpose Disinfecting Solution',
      trialFinalized: false,
      od: {
        eye: 'OD',
        modality: 'Scleral Vaulting',
        brandAndMaterial: 'Zenlens Boston XO2',
        baseCurveMm: '7.50',
        diameterMm: '16.0',
        sphereD: '-4.50',
        centration: 'Optimal',
        movementMm: '0.0 mm',
        pushUpTest: 'Smooth / Adequate',
        visualAcuityAchieved: '6/6',
      },
      os: {
        eye: 'OS',
        modality: 'Soft Toric',
        brandAndMaterial: 'Biofinity Toric',
        baseCurveMm: '8.7',
        diameterMm: '14.5',
        sphereD: '-2.25',
        cylinderD: '-1.25',
        axisDeg: 180,
        centration: 'Optimal',
        movementMm: '0.3 mm',
        pushUpTest: 'Smooth / Adequate',
        visualAcuityAchieved: '6/6',
      },
    };

    it('emits eyeParameterChanged, fitAssessmentChanged, trialFinalizedToggled, and copyEyeRequested', () => {
      const instance = new mod.EmrContactLensPrescriptionComponent();
      const emitted: EmrContactLensPrescriptionIntent[] = [];
      instance.intent.subscribe((i: EmrContactLensPrescriptionIntent) => emitted.push(i));
      instance.model.set(clModel);

      instance.setEyeParameter('OD', 'sphereD', '-4.75');
      expect(emitted.at(-1)).toEqual({
        type: 'eyeParameterChanged',
        eye: 'OD',
        field: 'sphereD',
        value: '-4.75',
      });

      instance.setPushUpTest('OS', 'Tight /Steep');
      expect(emitted.at(-1)).toEqual({
        type: 'fitAssessmentChanged',
        eye: 'OS',
        pushUpTest: 'Tight /Steep',
      });

      instance.toggleTrialFinalized();
      expect(emitted.at(-1)).toEqual({ type: 'trialFinalizedToggled', finalized: true });

      instance.copyEye('OD', 'OS');
      expect(emitted.at(-1)).toEqual({ type: 'copyEyeRequested', fromEye: 'OD', toEye: 'OS' });
    });
  });
});
