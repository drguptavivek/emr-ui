import { describe, expect, it } from 'vitest';
import {
  CONTACT_LENS_MODALITIES,
  IOL_FORMULA_IDS,
  TOPOGRAPHY_MAP_TYPES,
  classifyEctasiaScreening,
  computeIntravitrealCstDelta,
  evaluateBiometryInterOcularDelta,
  type EmrContactLensPrescriptionViewModel,
  type EmrCornealTopographySummaryViewModel,
  type EmrIntravitrealCourseTrackerViewModel,
  type EmrIolBiometryPlannerViewModel,
  type EmrOphthalmicOperativeRecordViewModel,
} from './l4-ophthalmology-cataract-retina-cornea.models.js';

describe('L4 Ophthalmology Cataract, Retina & Cornea models & pure helpers', () => {
  describe('evaluateBiometryInterOcularDelta', () => {
    it('returns diffMm without warning when inter-ocular axial length difference is < 0.30 mm', () => {
      const res = evaluateBiometryInterOcularDelta(23.62, 23.45);
      expect(res.diffMm).toBe(0.17);
      expect(res.warning).toBeUndefined();
    });

    it('flags inter-ocular axial length difference >= 0.30 mm for repeat optical biometry verification', () => {
      const exact = evaluateBiometryInterOcularDelta(24.1, 23.8);
      expect(exact.diffMm).toBe(0.3);
      expect(exact.warning).toContain('0.30 mm');

      const large = evaluateBiometryInterOcularDelta(25.12, 23.64);
      expect(large.diffMm).toBe(1.48);
      expect(large.warning).toContain('1.48 mm');
      expect(IOL_FORMULA_IDS).toEqual([
        'Barrett Universal II',
        'Kane',
        'Haigis',
        'SRK/T',
        'Holladay 2',
        'Evo 2.0',
      ]);
    });
  });

  describe('computeIntravitrealCstDelta', () => {
    it('calculates central subfield thickness reduction in microns and percentage', () => {
      const res = computeIntravitrealCstDelta(480, 288);
      expect(res).toEqual({
        deltaUm: -192,
        pctChange: -40,
      });

      const increase = computeIntravitrealCstDelta(300, 345);
      expect(increase).toEqual({
        deltaUm: 45,
        pctChange: 15,
      });

      expect(computeIntravitrealCstDelta(0, 250)).toEqual({
        deltaUm: 250,
        pctChange: 0,
      });
    });
  });

  describe('classifyEctasiaScreening', () => {
    it('classifies normal, borderline, and ectasia-suspect tomography profiles', () => {
      expect(classifyEctasiaScreening(44.8, 538, 0.9)).toBe('normal');
      expect(classifyEctasiaScreening(47.4, 520, 1.1)).toBe('borderline');
      expect(classifyEctasiaScreening(45.2, 482, 1.2)).toBe('borderline');
      expect(classifyEctasiaScreening(45.2, 515, 1.8)).toBe('borderline');
      expect(classifyEctasiaScreening(49.6, 510, 1.4)).toBe('ectasia-suspect');
      expect(classifyEctasiaScreening(46.0, 458, 1.2)).toBe('ectasia-suspect');
      expect(classifyEctasiaScreening(46.0, 505, 3.1)).toBe('ectasia-suspect');
      expect(TOPOGRAPHY_MAP_TYPES).toEqual([
        'axial-curvature',
        'pachymetry',
        'anterior-elevation',
        'posterior-elevation',
      ]);
    });
  });

  describe('ViewModel contracts for all 5 Cataract, Retina & Cornea components', () => {
    it('constructs valid ViewModels for Biometry, Intravitreal Course, Topography, Operative Record, and Contact Lens Rx', () => {
      const biometryVm: EmrIolBiometryPlannerViewModel = {
        id: 'bio-1',
        title: 'Optical Biometry & Toric IOL Planner',
        interOcularAlDiffMm: 0.34,
        interOcularWarning: 'AL difference >= 0.30 mm',
        od: {
          eye: 'OD',
          deviceLabel: 'IOLMaster 700',
          axialLengthMm: 23.84,
          acdMm: 3.18,
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
              id: 'cand-21',
              powerDiopters: '+21.0 D',
              predictedRefractionD: '-0.06 D',
              isEmmetropiaTarget: true,
              isSelected: true,
              toricCylinderModel: 'T4 (2.25 D IOL)',
              residualAstigmatismD: '0.14 D @ 90°',
              recommendedAxisDeg: 90,
            },
          ],
        },
        os: {
          eye: 'OS',
          deviceLabel: 'IOLMaster 700',
          axialLengthMm: 23.5,
          acdMm: 3.12,
          k1Diopters: 43.5,
          k1AxisDeg: 175,
          k2Diopters: 44.0,
          k2AxisDeg: 85,
          cornealDeltaKD: '+0.50 D @ 85°',
          targetRefractionD: '0.00 D',
          activeFormula: 'Kane',
          availableFormulas: IOL_FORMULA_IDS,
          lensModelLabel: 'Clareon Monofocal SY60WF',
          aConstant: '119.1',
          candidates: [],
        },
      };

      const intravitrealVm: EmrIntravitrealCourseTrackerViewModel = {
        id: 'ivt-1',
        activeEye: 'OD',
        od: {
          eye: 'OD',
          indication: 'Neovascular AMD (nAMD)',
          currentRegimen: 'treat-and-extend',
          currentAgent: 'Faricimab 6 mg / 0.05 mL',
          totalInjectionsCount: 5,
          currentIntervalWeeks: 8,
          baselineCstUm: 462,
          latestCstUm: 274,
          visits: [
            {
              id: 'v-1',
              visitNumber: 1,
              date: '2026-06-01',
              eye: 'OD',
              cstUm: 462,
              bcvaLabel: '6/24',
              fluidFlags: { irf: true, srf: true, ped: true },
              decision: 'inject-maintain',
            },
          ],
        },
      };

      const topoVm: EmrCornealTopographySummaryViewModel = {
        id: 'topo-1',
        activeMap: 'axial-curvature',
        od: {
          eye: 'OD',
          deviceLabel: 'Pentacam HR',
          qualityScore: 'OK',
          k1FlatD: 45.2,
          k1AxisDeg: 170,
          k2SteepD: 49.4,
          k2AxisDeg: 80,
          kMaxD: 53.8,
          astigmatismD: 4.2,
          centralPachymetryUm: 472,
          thinnestPachymetryUm: 448,
          badDIndex: 4.82,
          ectasiaRisk: 'ectasia-suspect',
        },
        os: {
          eye: 'OS',
          deviceLabel: 'Pentacam HR',
          qualityScore: 'OK',
          k1FlatD: 43.8,
          k1AxisDeg: 10,
          k2SteepD: 44.6,
          k2AxisDeg: 100,
          kMaxD: 45.1,
          astigmatismD: 0.8,
          centralPachymetryUm: 524,
          thinnestPachymetryUm: 518,
          badDIndex: 1.05,
          ectasiaRisk: 'normal',
        },
      };

      const opVm: EmrOphthalmicOperativeRecordViewModel = {
        id: 'op-1',
        procedureName: 'Phacoemulsification with Toric PCIOL Implantation',
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
          powerDiopters: '+21.0 D',
          serialNumber: 'SN-2026-99412',
          placement: 'In-the-Bag',
          toricAlignedAxisDeg: 90,
        },
        prophylaxis: {
          intracameralAntibiotic: 'Moxifloxacin 0.5 mg / 0.1 mL',
          subconjunctivalSteroid: true,
        },
        postOpRegimenSummary: 'Prednisolone 1% QID tapering over 4 weeks + Moxifloxacin 0.5% QID x 1 week.',
      };

      const clVm: EmrContactLensPrescriptionViewModel = {
        id: 'cl-1',
        issueDate: '2026-11-12',
        expiryDate: '2027-11-12',
        replacementSchedule: 'Annual Conventional',
        wearingScheduleHoursPerDay: 12,
        careRegimenSolution: 'Hydrogen Peroxide 3% + Preservative-Free Saline Fill',
        trialFinalized: true,
        od: {
          eye: 'OD',
          modality: 'Scleral Vaulting',
          brandAndMaterial: 'Zenlens Boston XO2 (Dk 141)',
          baseCurveMm: '7.50',
          diameterMm: '16.0',
          sphereD: '-4.25',
          sagittalDepthUm: 4500,
          centration: 'Optimal',
          movementMm: '0.0 mm (Scleral Vault)',
          pushUpTest: 'Smooth / Adequate',
          apicalClearanceUm: 210,
          visualAcuityAchieved: '6/6',
        },
        os: {
          eye: 'OS',
          modality: 'Soft Toric',
          brandAndMaterial: 'Biofinity Toric (Comfilcon A)',
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

      expect(biometryVm.od.activeFormula).toBe('Barrett Universal II');
      expect(intravitrealVm.od.currentRegimen).toBe('treat-and-extend');
      expect(topoVm.od.ectasiaRisk).toBe('ectasia-suspect');
      expect(opVm.posteriorCapsuleStatus).toBe('Intact');
      expect(clVm.od.modality).toBe('Scleral Vaulting');
      expect(CONTACT_LENS_MODALITIES).toContain('Scleral Vaulting');
    });
  });
});
