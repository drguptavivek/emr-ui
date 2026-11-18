import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('react-native', () => import('react-native-web'));

import type {
  EmrContactLensPrescriptionViewModel,
  EmrCornealTopographySummaryViewModel,
  EmrIntravitrealCourseTrackerViewModel,
  EmrIolBiometryPlannerViewModel,
  EmrOphthalmicOperativeRecordViewModel,
} from '../../emr-controller/src/l4-ophthalmology-cataract-retina-cornea.models';
import {
  EmrContactLensPrescription,
  EmrCornealTopographySummary,
  EmrIntravitrealCourseTracker,
  EmrIolBiometryPlanner,
  EmrOphthalmicOperativeRecord,
} from './l4-ophthalmology-cataract-retina-cornea';
import {
  IOL_FORMULA_IDS,
  classifyEctasiaScreening,
  computeIntravitrealCstDelta,
  evaluateBiometryInterOcularDelta,
  formatIntravitrealFluidFlags,
  resolveIntravitrealVisibleCourses,
  summarizeTopographyBilateralRisk,
} from './l4-ophthalmology-cataract-retina-cornea.logic';

const bioModel: EmrIolBiometryPlannerViewModel = {
  id: 'bio-1',
  title: 'Optical Biometry & Toric IOL Planner',
  od: {
    eye: 'OD',
    deviceLabel: 'IOLMaster 700',
    axialLengthMm: 24.3,
    acdMm: 3.24,
    k1Diopters: 43.25,
    k1AxisDeg: 180,
    k2Diopters: 45.5,
    k2AxisDeg: 90,
    cornealDeltaKD: '+2.25 D @ 90°',
    targetRefractionD: '0.00 D',
    activeFormula: 'Barrett Universal II',
    availableFormulas: IOL_FORMULA_IDS,
    lensModelLabel: 'AcrySof IQ Toric SN6AT4',
    aConstant: '119.2',
    candidates: [
      {
        id: 'c1',
        powerDiopters: '+20.5 D',
        predictedRefractionD: '-0.05 D',
        isEmmetropiaTarget: true,
        isSelected: true,
        toricCylinderModel: 'SN6AT4',
        recommendedAxisDeg: 90,
      },
    ],
  },
  os: {
    eye: 'OS',
    deviceLabel: 'IOLMaster 700',
    axialLengthMm: 23.85,
    acdMm: 3.16,
    k1Diopters: 43.5,
    k1AxisDeg: 175,
    k2Diopters: 44.0,
    k2AxisDeg: 85,
    cornealDeltaKD: '+0.50 D @ 85°',
    targetRefractionD: '0.00 D',
    activeFormula: 'Kane',
    availableFormulas: IOL_FORMULA_IDS,
    lensModelLabel: 'Clareon Monofocal',
    aConstant: '119.1',
    candidates: [],
  },
};

const ivtModel: EmrIntravitrealCourseTrackerViewModel = {
  id: 'ivt-1',
  title: 'Intravitreal Course Tracker',
  activeEye: 'OD',
  selectedVisitId: 'v1',
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

const topoModel: EmrCornealTopographySummaryViewModel = {
  id: 'topo-1',
  title: 'Pentacam Corneal Tomography Summary',
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

const opModel: EmrOphthalmicOperativeRecordViewModel = {
  id: 'op-1',
  procedureName: 'Clear Corneal Phacoemulsification + Toric IOL',
  operatedEye: 'OD',
  timeoutVerified: true,
  surgeonName: 'Dr. Vivek Gupta',
  anesthesiaType: 'Topical',
  mainIncisionMeridianDeg: 110,
  mainIncisionWidthMm: 2.2,
  capsulorhexisStatus: 'Continuous Curvilinear (Intact)',
  phacoMetrics: {
    cdeSeconds: 5.2,
    usTimeSeconds: 22,
    bssVolumeMl: 140,
    ovdUsed: 'Viscoat + ProVisc',
  },
  posteriorCapsuleStatus: 'Intact',
  iolImplant: {
    modelName: 'AcrySof IQ Toric SN6AT4',
    powerDiopters: '+20.5 D',
    serialNumber: 'SN-2026-4412',
    placement: 'In-the-Bag',
    toricAlignedAxisDeg: 90,
  },
  prophylaxis: {
    intracameralAntibiotic: 'Moxifloxacin 0.5 mg',
  },
  postOpRegimenSummary: 'Prednisolone 1% QID taper',
};

const clModel: EmrContactLensPrescriptionViewModel = {
  id: 'cl-1',
  title: 'Specialty Scleral & Toric Contact Lens Rx',
  issueDate: '2026-11-12',
  expiryDate: '2027-11-12',
  replacementSchedule: 'Annual Conventional',
  wearingScheduleHoursPerDay: 12,
  careRegimenSolution: '3% Hydrogen Peroxide System',
  trialFinalized: true,
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
    cylinderD: '-1.25',
    axisDeg: 180,
    centration: 'Optimal',
    movementMm: '0.3 mm',
    pushUpTest: 'Smooth / Adequate',
    visualAcuityAchieved: '6/6',
  },
};

describe('React / React Native L4 Ophthalmology Cataract, Retina & Cornea Suite', () => {
  it('enforces use client and type-only @drguptavivek/emr-controller imports in .tsx', () => {
    const tsxPath = join(
      process.cwd(),
      'packages/emr-react/src/l4-ophthalmology-cataract-retina-cornea.tsx',
    );
    const tsxText = readFileSync(tsxPath, 'utf8');
    expect(tsxText.trimStart().startsWith("'use client';")).toBe(true);
    expect(tsxText).not.toMatch(
      /(?:^|\n)\s*(?:import|export)\s+(?!type\b)[^;]*?from\s+['"]@drguptavivek\/emr-controller['"]/,
    );
    expect(tsxText).not.toContain('role="listbox"');
  });

  it('evaluates pure logic helpers accurately', () => {
    expect(evaluateBiometryInterOcularDelta(24.3, 23.85)).toEqual({
      diffMm: 0.45,
      warning: expect.stringContaining('0.45 mm'),
    });
    expect(computeIntravitrealCstDelta(460, 276)).toEqual({
      deltaUm: -184,
      pctChange: -40,
    });
    expect(classifyEctasiaScreening(54.1, 444, 4.9)).toBe('ectasia-suspect');
    expect(resolveIntravitrealVisibleCourses(ivtModel)).toHaveLength(1);
    expect(formatIntravitrealFluidFlags(ivtModel.od.visits[0]!)).toBe('IRF+ · SRF+');
    expect(summarizeTopographyBilateralRisk(topoModel)).toEqual({
      odScreened: 'ectasia-suspect',
      osScreened: 'normal',
    });
  });

  it('renders EmrIolBiometryPlanner with inter-ocular ΔAL alert, formulas, and toric candidates', () => {
    const html = renderToStaticMarkup(createElement(EmrIolBiometryPlanner, { model: bioModel }));
    expect(html).toContain('Optical Biometry &amp; Toric IOL Planner');
    expect(html).toContain('Inter-Ocular ΔAL: 0.45 mm');
    expect(html).toContain('AcrySof IQ Toric SN6AT4');
    expect(html).toContain('+20.5 D');
    expect(html).toContain('EMMETROPIA TARGET');
  });

  it('renders EmrIntravitrealCourseTracker with CST reduction metrics, fluid flags, and T&E controls', () => {
    const html = renderToStaticMarkup(
      createElement(EmrIntravitrealCourseTracker, { model: ivtModel }),
    );
    expect(html).toContain('Intravitreal Course Tracker');
    expect(html).toContain('Faricimab 6 mg');
    expect(html).toContain('460 → 276 µm');
    expect(html).toContain('IRF+ · SRF+');
  });

  it('renders EmrCornealTopographySummary with Kmax, pachymetry, and ectasia screening status', () => {
    const html = renderToStaticMarkup(
      createElement(EmrCornealTopographySummary, { model: topoModel }),
    );
    expect(html).toContain('Pentacam Corneal Tomography Summary');
    expect(html).toContain('54.10 D');
    expect(html).toContain('ectasia-suspect (Screened: ectasia-suspect)');
  });

  it('renders EmrOphthalmicOperativeRecord with WHO timeout, phaco fluidics, and IOL serial traceability', () => {
    const html = renderToStaticMarkup(
      createElement(EmrOphthalmicOperativeRecord, { model: opModel }),
    );
    expect(html).toContain('Clear Corneal Phacoemulsification + Toric IOL');
    expect(html).toContain('✓ WHO Timeout Verified');
    expect(html).toContain('CDE 5.2s');
    expect(html).toContain('AcrySof IQ Toric SN6AT4');
  });

  it('renders EmrContactLensPrescription with Scleral Vaulting & Soft Toric fitting parameters', () => {
    const html = renderToStaticMarkup(
      createElement(EmrContactLensPrescription, { model: clModel }),
    );
    expect(html).toContain('Specialty Scleral &amp; Toric Contact Lens Rx');
    expect(html).toContain('Zenlens Boston XO2');
    expect(html).toContain('Scleral Vaulting');
    expect(html).toContain('✓ Trial Finalized');
  });
});
