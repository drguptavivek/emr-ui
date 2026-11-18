import { describe, expect, it } from 'vitest';
import {
  GONIOSCOPY_CLOCK_HOURS,
  GONIOSCOPY_PIGMENTATION_GRADES,
  GONIOSCOPY_QUADRANT_IDS,
  HESS_NINE_GAZE_GRID,
  SHAFFER_GRADES,
  computeHessFieldAreaRatio,
  evaluateVisualFieldReliability,
  summarizeGonioscopyOccludability,
  type EmrGonioscopyChartViewModel,
  type EmrHessScreenChartViewModel,
  type EmrVisualFieldSummaryViewModel,
  type GonioscopyEyeRecord,
} from './l4-ophthalmology-glaucoma-motility.models.js';

describe('L4 Ophthalmology Glaucoma & Motility models & pure helpers', () => {
  describe('summarizeGonioscopyOccludability', () => {
    it('flags an eye as occludable when >= 2 quadrants have Shaffer grade 0, slit, or 1 and counts PAS clock hours', () => {
      const occludableEye: GonioscopyEyeRecord = {
        eye: 'OD',
        gradingSystem: 'shaffer',
        lensUsed: 'Sussman 4-Mirror',
        pasClockHours: [11, 12, 1],
        quadrants: {
          superior: {
            quadrant: 'superior',
            staticGrade: '0',
            dynamicGrade: '1',
            deepestStructure: 'SL',
            pigmentation: 3,
            irisConfiguration: 'convex',
            pasPresent: true,
          },
          nasal: {
            quadrant: 'nasal',
            staticGrade: 'slit',
            dynamicGrade: '2',
            deepestStructure: 'ATM',
            pigmentation: 2,
          },
          inferior: {
            quadrant: 'inferior',
            staticGrade: '2',
            dynamicGrade: '3',
            deepestStructure: 'SS',
            pigmentation: 3,
            sampaolesiLine: true,
          },
          temporal: {
            quadrant: 'temporal',
            staticGrade: '1',
            dynamicGrade: '3',
            deepestStructure: 'PTM',
            pigmentation: 2,
          },
        },
      };

      const summary = summarizeGonioscopyOccludability(occludableEye);
      expect(summary).toEqual({
        closedQuadrantCount: 3,
        pasClockHourCount: 3,
        isOccludable: true,
      });
    });

    it('returns isOccludable: false when fewer than 2 quadrants are narrow/closed', () => {
      const openEye: GonioscopyEyeRecord = {
        eye: 'OS',
        gradingSystem: 'spaeth',
        quadrants: {
          superior: { quadrant: 'superior', staticGrade: '1', dynamicGrade: '3' },
          nasal: { quadrant: 'nasal', staticGrade: '3', dynamicGrade: '4' },
          inferior: { quadrant: 'inferior', staticGrade: '4', dynamicGrade: '4' },
          temporal: { quadrant: 'temporal', staticGrade: '3', dynamicGrade: '4' },
        },
      };

      expect(summarizeGonioscopyOccludability(openEye)).toEqual({
        closedQuadrantCount: 1,
        pasClockHourCount: 0,
        isOccludable: false,
      });
      expect(GONIOSCOPY_QUADRANT_IDS).toEqual(['superior', 'nasal', 'inferior', 'temporal']);
      expect(SHAFFER_GRADES).toEqual(['0', 'slit', '1', '2', '3', '4']);
      expect(GONIOSCOPY_PIGMENTATION_GRADES).toEqual([0, 1, 2, 3, 4]);
      expect(GONIOSCOPY_CLOCK_HOURS).toHaveLength(12);
    });
  });

  describe('evaluateVisualFieldReliability', () => {
    it('classifies reliable, caution, and unreliable perimetry indices accurately', () => {
      expect(evaluateVisualFieldReliability('1/14', 3, 4)).toBe('reliable');
      expect(evaluateVisualFieldReliability('1/14', 11, 5)).toBe('caution');
      expect(evaluateVisualFieldReliability('1/14', 4, 16)).toBe('caution');
      expect(evaluateVisualFieldReliability('2/12', 4, 5)).toBe('caution');
      expect(evaluateVisualFieldReliability('1/14', 15, 5)).toBe('unreliable');
      expect(evaluateVisualFieldReliability('1/14', 5, 22)).toBe('unreliable');
      expect(evaluateVisualFieldReliability('4/14', 2, 2)).toBe('unreliable');
    });
  });

  describe('computeHessFieldAreaRatio', () => {
    it('computes horizontal and vertical coordinate spans for plotted vs expected polygons', () => {
      expect(computeHessFieldAreaRatio([])).toEqual({
        plottedSpanX: 0,
        plottedSpanY: 0,
        expectedSpanX: 0,
        expectedSpanY: 0,
      });

      const innerField = [
        { gazeId: 'NW' as const, expectedXDeg: -15, expectedYDeg: 15, plottedXDeg: -12, plottedYDeg: 14 },
        { gazeId: 'NE' as const, expectedXDeg: 15, expectedYDeg: 15, plottedXDeg: 14, plottedYDeg: 16 },
        { gazeId: 'SE' as const, expectedXDeg: 15, expectedYDeg: -15, plottedXDeg: 10, plottedYDeg: -8 },
        { gazeId: 'SW' as const, expectedXDeg: -15, expectedYDeg: -15, plottedXDeg: -14, plottedYDeg: -12 },
      ];

      expect(computeHessFieldAreaRatio(innerField)).toEqual({
        plottedSpanX: 28,
        plottedSpanY: 28,
        expectedSpanX: 30,
        expectedSpanY: 30,
      });
      expect(HESS_NINE_GAZE_GRID).toHaveLength(3);
    });
  });

  describe('ViewModel contract shapes', () => {
    it('constructs valid Gonioscopy, Visual Field, and Hess Screen view models', () => {
      const gonioVm: EmrGonioscopyChartViewModel = {
        id: 'gonio-1',
        title: 'Gonioscopy & Angle Evaluation',
        viewMode: 'both',
        od: {
          eye: 'OD',
          gradingSystem: 'shaffer',
          quadrants: {
            superior: { quadrant: 'superior', staticGrade: '0', dynamicGrade: '2' },
            nasal: { quadrant: 'nasal', staticGrade: '1', dynamicGrade: '2' },
            inferior: { quadrant: 'inferior', staticGrade: '2', dynamicGrade: '3' },
            temporal: { quadrant: 'temporal', staticGrade: '1', dynamicGrade: '3' },
          },
        },
        os: {
          eye: 'OS',
          gradingSystem: 'shaffer',
          quadrants: {
            superior: { quadrant: 'superior', staticGrade: '1', dynamicGrade: '3' },
            nasal: { quadrant: 'nasal', staticGrade: '2', dynamicGrade: '3' },
            inferior: { quadrant: 'inferior', staticGrade: '2', dynamicGrade: '3' },
            temporal: { quadrant: 'temporal', staticGrade: '2', dynamicGrade: '3' },
          },
        },
      };

      const vfVm: EmrVisualFieldSummaryViewModel = {
        id: 'vf-1',
        activeMapType: 'pattern-deviation',
        od: {
          eye: 'OD',
          strategy: '24-2 SITA-Standard',
          testDate: '2026-11-12',
          fixationLosses: '1/15',
          falsePositivesPct: 2,
          falseNegativesPct: 4,
          vfiPct: 82,
          mdDb: -6.42,
          psdDb: 7.85,
          ght: 'Outside Normal Limits',
          points: [
            {
              id: 'p1',
              xDeg: -9,
              yDeg: 15,
              totalDeviationDb: -18,
              patternDeviationDb: -16,
              probability: 'p<0.5%',
            },
          ],
        },
        os: {
          eye: 'OS',
          strategy: '24-2 SITA-Standard',
          testDate: '2026-11-12',
          fixationLosses: '0/14',
          falsePositivesPct: 1,
          falseNegativesPct: 2,
          vfiPct: 99,
          mdDb: -0.35,
          psdDb: 1.42,
          ght: 'Within Normal Limits',
          points: [],
        },
      };

      const hessVm: EmrHessScreenChartViewModel = {
        id: 'hess-1',
        activeDistanceMode: 'distance-6m',
        leftChartOsFixing: {
          fixingEye: 'OS',
          plottedEye: 'OD',
          innerFieldPoints: [],
          outerFieldPoints: [],
        },
        rightChartOdFixing: {
          fixingEye: 'OD',
          plottedEye: 'OS',
          innerFieldPoints: [],
          outerFieldPoints: [],
        },
        pbctDistanceCells: {
          NW: { gazeId: 'NW', verticalDelta: 'RHT 6Δ' },
          N: { gazeId: 'N', verticalDelta: 'RHT 8Δ' },
          NE: { gazeId: 'NE', verticalDelta: 'RHT 4Δ' },
          W: { gazeId: 'W', verticalDelta: 'RHT 18Δ' },
          C: { gazeId: 'C', verticalDelta: 'RHT 12Δ' },
          E: { gazeId: 'E', verticalDelta: 'RHT 4Δ' },
          SW: { gazeId: 'SW', verticalDelta: 'RHT 24Δ' },
          S: { gazeId: 'S', verticalDelta: 'RHT 14Δ' },
          SE: { gazeId: 'SE', verticalDelta: 'RHT 6Δ' },
        },
      };

      expect(gonioVm.id).toBe('gonio-1');
      expect(vfVm.od.ght).toBe('Outside Normal Limits');
      expect(hessVm.pbctDistanceCells.SW.verticalDelta).toBe('RHT 24Δ');
    });
  });
});
