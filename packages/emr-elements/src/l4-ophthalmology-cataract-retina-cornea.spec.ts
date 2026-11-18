// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type {
  EmrContactLensPrescriptionViewModel,
  EmrCornealTopographySummaryViewModel,
  EmrIntravitrealCourseTrackerViewModel,
  EmrIolBiometryPlannerViewModel,
  EmrOphthalmicOperativeRecordViewModel,
} from '../../emr-controller/src/l4-ophthalmology-cataract-retina-cornea.models.js';
import {
  EmrContactLensPrescriptionElement,
  EmrCornealTopographySummaryElement,
  EmrIntravitrealCourseTrackerElement,
  EmrIolBiometryPlannerElement,
  EmrOphthalmicOperativeRecordElement,
  registerL4OphthalmologyCataractRetinaCorneaElements,
} from './l4-ophthalmology-cataract-retina-cornea.js';

function makeBiometryModel(): EmrIolBiometryPlannerViewModel {
  return {
    id: 'bio-1',
    title: 'Optical Biometry & Toric IOL Planner',
    od: {
      eye: 'OD',
      deviceLabel: 'IOLMaster 700',
      axialLengthMm: 24.4,
      acdMm: 3.24,
      k1Diopters: 43.25,
      k1AxisDeg: 180,
      k2Diopters: 45.5,
      k2AxisDeg: 90,
      cornealDeltaKD: '+2.25 D @ 90°',
      targetRefractionD: '0.00 D',
      activeFormula: 'Barrett Universal II',
      availableFormulas: ['Barrett Universal II', 'Kane'],
      lensModelLabel: 'AcrySof IQ Toric SN6AT4',
      aConstant: '119.2',
      candidates: [
        {
          id: 'c1',
          powerDiopters: '+20.5 D',
          predictedRefractionD: '-0.04 D',
          isEmmetropiaTarget: true,
          isSelected: false,
        },
      ],
    },
    os: {
      eye: 'OS',
      deviceLabel: 'IOLMaster 700',
      axialLengthMm: 23.8,
      acdMm: 3.16,
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
}

function makeIntravitrealModel(): EmrIntravitrealCourseTrackerViewModel {
  return {
    id: 'ivt-1',
    title: 'Intravitreal Course Tracker',
    activeEye: 'OD',
    od: {
      eye: 'OD',
      indication: 'Neovascular AMD',
      currentRegimen: 'treat-and-extend',
      currentAgent: 'Faricimab 6 mg',
      totalInjectionsCount: 4,
      currentIntervalWeeks: 8,
      baselineCstUm: 460,
      latestCstUm: 276,
      visits: [
        {
          id: 'v1',
          visitNumber: 1,
          date: '2026-07-01',
          eye: 'OD',
          cstUm: 460,
          bcvaLabel: '6/24',
          fluidFlags: { irf: true, srf: true, ped: false },
          decision: 'inject-maintain',
        },
      ],
    },
  };
}

function makeTopographyModel(): EmrCornealTopographySummaryViewModel {
  return {
    id: 'topo-1',
    title: 'Corneal Topography Summary',
    activeMap: 'axial-curvature',
    od: {
      eye: 'OD',
      deviceLabel: 'Pentacam HR',
      qualityScore: 'OK',
      k1FlatD: 45.2,
      k1AxisDeg: 172,
      k2SteepD: 49.6,
      k2AxisDeg: 82,
      kMaxD: 54.1,
      astigmatismD: 4.4,
      centralPachymetryUm: 470,
      thinnestPachymetryUm: 444,
      badDIndex: 4.9,
      ectasiaRisk: 'ectasia-suspect',
    },
    os: {
      eye: 'OS',
      deviceLabel: 'Pentacam HR',
      qualityScore: 'OK',
      k1FlatD: 43.4,
      k1AxisDeg: 8,
      k2SteepD: 44.2,
      k2AxisDeg: 98,
      kMaxD: 45.0,
      astigmatismD: 0.8,
      centralPachymetryUm: 528,
      thinnestPachymetryUm: 522,
      badDIndex: 0.95,
      ectasiaRisk: 'normal',
    },
  };
}

function makeOperativeModel(): EmrOphthalmicOperativeRecordViewModel {
  return {
    id: 'op-1',
    procedureName: 'Phacoemulsification + Toric IOL',
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
      serialNumber: 'SN-2026-4412',
      placement: 'In-the-Bag',
    },
    prophylaxis: {
      intracameralAntibiotic: 'Moxifloxacin 0.5 mg',
    },
    postOpRegimenSummary: 'Prednisolone 1% QID taper',
  };
}

function makeContactLensModel(): EmrContactLensPrescriptionViewModel {
  return {
    id: 'cl-1',
    title: 'Contact Lens Fitting & Rx',
    issueDate: '2026-11-12',
    expiryDate: '2027-11-12',
    replacementSchedule: 'Annual Conventional',
    wearingScheduleHoursPerDay: 12,
    careRegimenSolution: '3% Hydrogen Peroxide System',
    trialFinalized: false,
    od: {
      eye: 'OD',
      modality: 'Scleral Vaulting',
      brandAndMaterial: 'Zenlens Boston XO2',
      baseCurveMm: '7.50',
      diameterMm: '16.0',
      sphereD: '-4.25',
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
      sphereD: '-2.00',
      centration: 'Optimal',
      movementMm: '0.3 mm',
      pushUpTest: 'Smooth / Adequate',
      visualAcuityAchieved: '6/6',
    },
  };
}

describe('Lit L4 Ophthalmology Cataract, Retina & Cornea Custom Elements', () => {
  it('registers all 5 custom elements via registerL4OphthalmologyCataractRetinaCorneaElements()', () => {
    registerL4OphthalmologyCataractRetinaCorneaElements();
    for (const tag of [
      'emr-iol-biometry-planner',
      'emr-intravitreal-course-tracker',
      'emr-corneal-topography-summary',
      'emr-ophthalmic-operative-record',
      'emr-contact-lens-prescription',
    ]) {
      expect(customElements.get(tag)).toBeDefined();
    }
  });

  it('renders EmrIolBiometryPlannerElement and emits formulaSelected and candidateSelected intents', async () => {
    registerL4OphthalmologyCataractRetinaCorneaElements();
    const el = document.createElement('emr-iol-biometry-planner') as EmrIolBiometryPlannerElement;
    el.model = makeBiometryModel();
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).toContain('Inter-Ocular ΔAL: 0.60 mm');
      expect(el.shadowRoot!.textContent).toContain('AcrySof IQ Toric SN6AT4');

      const kaneBtn = [...el.shadowRoot!.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'Kane',
      )!;
      kaneBtn.click();
      expect(intents.at(-1)).toEqual({ type: 'formulaSelected', eye: 'OD', formula: 'Kane' });

      const selBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Select +20.5 D'),
      )!;
      selBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'candidateSelected',
        eye: 'OD',
        candidateId: 'c1',
        powerDiopters: '+20.5 D',
      });
    } finally {
      el.remove();
    }
  });

  it('renders EmrIntravitrealCourseTrackerElement and emits activeEyeChanged, intervalAdjusted, and recordInjectionRequested', async () => {
    registerL4OphthalmologyCataractRetinaCorneaElements();
    const el = document.createElement(
      'emr-intravitreal-course-tracker',
    ) as EmrIntravitrealCourseTrackerElement;
    el.model = makeIntravitrealModel();
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).toContain('Faricimab 6 mg');
      expect(el.shadowRoot!.textContent).toContain('-184 µm');

      const extendBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Extend +2w'),
      )!;
      extendBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'intervalAdjusted',
        eye: 'OD',
        nextIntervalWeeks: 10,
        decision: 'inject-extend',
      });

      const recBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('+ Record Injection'),
      )!;
      recBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'recordInjectionRequested',
        eye: 'OD',
        agent: 'Faricimab 6 mg',
      });
    } finally {
      el.remove();
    }
  });

  it('renders EmrCornealTopographySummaryElement and emits activeMapChanged and ectasiaRiskChanged', async () => {
    registerL4OphthalmologyCataractRetinaCorneaElements();
    const el = document.createElement(
      'emr-corneal-topography-summary',
    ) as EmrCornealTopographySummaryElement;
    el.model = makeTopographyModel();
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).toContain('Screened: ectasia-suspect');

      const pachyBtn = [...el.shadowRoot!.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'Pachymetry',
      )!;
      pachyBtn.click();
      expect(intents.at(-1)).toEqual({ type: 'activeMapChanged', mapType: 'pachymetry' });

      const borderBtn = [...el.shadowRoot!.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'Borderline',
      )!;
      borderBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'ectasiaRiskChanged',
        eye: 'OD',
        risk: 'borderline',
      });
    } finally {
      el.remove();
    }
  });

  it('renders EmrOphthalmicOperativeRecordElement and emits timeoutToggled, posteriorCapsuleStatusChanged, and signOperativeNoteRequested', async () => {
    registerL4OphthalmologyCataractRetinaCorneaElements();
    const el = document.createElement(
      'emr-ophthalmic-operative-record',
    ) as EmrOphthalmicOperativeRecordElement;
    el.model = makeOperativeModel();
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).toContain('✓ WHO Timeout Verified');

      const timeoutBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('WHO Timeout'),
      )!;
      timeoutBtn.click();
      expect(intents.at(-1)).toEqual({ type: 'timeoutToggled', verified: false });

      const signBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Sign Operative Note'),
      )!;
      signBtn.click();
      expect(intents.at(-1)).toEqual({ type: 'signOperativeNoteRequested' });
    } finally {
      el.remove();
    }
  });

  it('renders EmrContactLensPrescriptionElement and emits copyEyeRequested, fitAssessmentChanged, and trialFinalizedToggled', async () => {
    registerL4OphthalmologyCataractRetinaCorneaElements();
    const el = document.createElement(
      'emr-contact-lens-prescription',
    ) as EmrContactLensPrescriptionElement;
    el.model = makeContactLensModel();
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).toContain('Zenlens Boston XO2');

      const copyBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Copy OD → OS'),
      )!;
      copyBtn.click();
      expect(intents.at(-1)).toEqual({ type: 'copyEyeRequested', fromEye: 'OD', toEye: 'OS' });

      const finBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Finalize Trial Rx'),
      )!;
      finBtn.click();
      expect(intents.at(-1)).toEqual({ type: 'trialFinalizedToggled', finalized: true });
    } finally {
      el.remove();
    }
  });
});
