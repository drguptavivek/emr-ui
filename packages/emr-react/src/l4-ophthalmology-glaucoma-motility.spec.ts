import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('react-native', () => import('react-native-web'));

import {
  EmrGonioscopyChart,
  EmrHessScreenChart,
  EmrVisualFieldSummary,
} from './l4-ophthalmology-glaucoma-motility';
import {
  anatomicalLeftQuadrant,
  anatomicalRightQuadrant,
  computeHessFieldAreaRatio,
  evaluateVisualFieldReliability,
  formatGonioscopyQuadrantSummary,
  resolveGhtTone,
  resolveProbabilityGlyph,
  resolveVisualFieldReliabilityTone,
  summarizeGonioscopyOccludability,
  type EmrGonioscopyChartViewModel,
  type EmrHessScreenChartViewModel,
  type EmrVisualFieldSummaryViewModel,
} from './l4-ophthalmology-glaucoma-motility.logic';

describe('React L4 Ophthalmology Glaucoma & Motility Suite', () => {
  it('enforces React architecture boundaries: use client directive and zero runtime controller imports in .tsx', () => {
    const tsxText = readFileSync(
      join(process.cwd(), 'packages/emr-react/src/l4-ophthalmology-glaucoma-motility.tsx'),
      'utf8',
    );
    expect(tsxText.trimStart().startsWith("'use client';")).toBe(true);
    const runtimeControllerImport =
      /(?:^|\n)\s*(?:import|export)\s+(?!type\b)[^;]*?from\s+['"]@drguptavivek\/emr-controller['"]/;
    expect(tsxText).not.toMatch(runtimeControllerImport);
    const localContractDecl =
      /(?:^|\n)\s*export\s+(?:interface|type)\s+\w*(?:ViewModel|Model|Intent)\b/;
    expect(tsxText).not.toMatch(localContractDecl);
  });

  it('1. EmrGonioscopyChart renders bilateral 4-quadrant X-cross, occludability badge, and PAS clock hours', () => {
    const model: EmrGonioscopyChartViewModel = {
      id: 'gonio-react',
      title: 'Bilateral 4-Quadrant Gonioscopy',
      viewMode: 'both',
      selectedEye: 'OD',
      selectedQuadrant: 'superior',
      od: {
        eye: 'OD',
        gradingSystem: 'shaffer',
        lensUsed: 'Sussman 4-Mirror',
        vanHerickGrade: '1',
        pasClockHours: [11, 12, 1],
        spaethNotationSummary: 'A15s 3+ PT',
        quadrants: {
          superior: { quadrant: 'superior', staticGrade: '0', dynamicGrade: '1', deepestStructure: 'SL', pigmentation: 3 },
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
          nasal: { quadrant: 'nasal', staticGrade: '3', dynamicGrade: '4' },
          inferior: { quadrant: 'inferior', staticGrade: '3', dynamicGrade: '4' },
          temporal: { quadrant: 'temporal', staticGrade: '3', dynamicGrade: '4' },
        },
      },
    };

    expect(anatomicalLeftQuadrant('OD')).toBe('temporal');
    expect(anatomicalRightQuadrant('OD')).toBe('nasal');
    expect(anatomicalLeftQuadrant('OS')).toBe('nasal');
    expect(anatomicalRightQuadrant('OS')).toBe('temporal');
    expect(summarizeGonioscopyOccludability(model.od)).toEqual({
      closedQuadrantCount: 3,
      pasClockHourCount: 3,
      isOccludable: true,
    });
    expect(formatGonioscopyQuadrantSummary(model.od.quadrants.superior, 'both')).toBe('0→1 (SL)');

    const html = renderToStaticMarkup(
      createElement(EmrGonioscopyChart, {
        model,
        onIntent: () => {},
      }),
    );
    expect(html).toContain('Bilateral 4-Quadrant Gonioscopy');
    expect(html).toContain('Sussman 4-Mirror');
    expect(html).toContain('Occludable (3/4 closed)');
    expect(html).toContain('PAS 3 clk hr');
    expect(html).toContain('A15s 3+ PT');
  });

  it('2. EmrVisualFieldSummary renders reliability strip, global indices (VFI, MD, PSD, GHT), and stipple points', () => {
    const model: EmrVisualFieldSummaryViewModel = {
      id: 'vf-react',
      title: 'Humphrey 24-2 Perimetry Summary',
      activeMapType: 'pattern-deviation',
      od: {
        eye: 'OD',
        strategy: '24-2 SITA-Standard',
        testDate: '12 Nov 2026',
        fixationLosses: '1/15',
        falsePositivesPct: 2,
        falseNegativesPct: 4,
        vfiPct: 79,
        mdDb: -7.45,
        psdDb: 8.92,
        ght: 'Outside Normal Limits',
        defectPatternLabel: 'Superior Arcuate Scotoma',
        progressionSummary: 'Likely progression (-1.4 dB/yr)',
        points: [
          {
            id: 'od-sup-1',
            xDeg: -9,
            yDeg: 15,
            totalDeviationDb: -24,
            patternDeviationDb: -22,
            probability: 'p<0.5%',
          },
        ],
      },
      os: {
        eye: 'OS',
        strategy: '24-2 SITA-Standard',
        testDate: '12 Nov 2026',
        fixationLosses: '0/14',
        falsePositivesPct: 1,
        falseNegativesPct: 2,
        vfiPct: 99,
        mdDb: -0.4,
        psdDb: 1.4,
        ght: 'Within Normal Limits',
        points: [],
      },
    };

    expect(evaluateVisualFieldReliability('1/15', 2, 4)).toBe('reliable');
    expect(resolveVisualFieldReliabilityTone('reliable')).toBe('success');
    expect(resolveGhtTone('Outside Normal Limits')).toBe('danger');
    expect(resolveProbabilityGlyph('p<0.5%')).toBe('▓');

    const html = renderToStaticMarkup(
      createElement(EmrVisualFieldSummary, {
        model,
        onIntent: () => {},
      }),
    );
    expect(html).toContain('Humphrey 24-2 Perimetry Summary');
    expect(html).toContain('Outside Normal Limits');
    expect(html).toContain('79%');
    expect(html).toContain('-7.45 dB');
    expect(html).toContain('Superior Arcuate Scotoma');
  });

  it('3. EmrHessScreenChart renders Left/Right charts, muscle badges, 3x3 PBCT matrix, and Bielschowsky head tilt', () => {
    const model: EmrHessScreenChartViewModel = {
      id: 'hess-react',
      title: 'Hess Tangent Screen & 9-Gaze PBCT',
      diagnosisSummary: 'Right CN IV Palsy',
      activeDistanceMode: 'distance-6m',
      leftChartOsFixing: {
        fixingEye: 'OS',
        plottedEye: 'OD',
        primaryRestrictionMuscle: 'Right Superior Oblique (RSO)',
        innerFieldPoints: [
          { gazeId: 'NW', expectedXDeg: -15, expectedYDeg: 15, plottedXDeg: -14, plottedYDeg: 18 },
          { gazeId: 'SE', expectedXDeg: 15, expectedYDeg: -15, plottedXDeg: 13, plottedYDeg: -12 },
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
        NW: { gazeId: 'NW', horizontalDelta: 'Ortho', verticalDelta: 'RHT 14Δ' },
        N: { gazeId: 'N', horizontalDelta: 'Ortho', verticalDelta: 'RHT 8Δ' },
        NE: { gazeId: 'NE', horizontalDelta: 'Ortho', verticalDelta: 'RHT 4Δ' },
        W: { gazeId: 'W', horizontalDelta: 'Ortho', verticalDelta: 'RHT 18Δ' },
        C: { gazeId: 'C', horizontalDelta: 'Ortho', verticalDelta: 'RHT 12Δ' },
        E: { gazeId: 'E', horizontalDelta: 'Ortho', verticalDelta: 'RHT 4Δ' },
        SW: { gazeId: 'SW', horizontalDelta: '2Δ ET', verticalDelta: 'RHT 24Δ' },
        S: { gazeId: 'S', horizontalDelta: '2Δ ET', verticalDelta: 'RHT 14Δ' },
        SE: { gazeId: 'SE', horizontalDelta: 'Ortho', verticalDelta: 'RHT 6Δ' },
      },
      headTiltCells: {
        rightTiltDelta: 'RHT 22Δ',
        leftTiltDelta: 'RHT 4Δ',
      },
    };

    expect(computeHessFieldAreaRatio(model.leftChartOsFixing.innerFieldPoints)).toEqual({
      plottedSpanX: 27,
      plottedSpanY: 30,
      expectedSpanX: 30,
      expectedSpanY: 30,
    });

    const html = renderToStaticMarkup(
      createElement(EmrHessScreenChart, {
        model,
        onIntent: () => {},
      }),
    );
    expect(html).toContain('Hess Tangent Screen &amp; 9-Gaze PBCT');
    expect(html).toContain('Right Superior Oblique (RSO)');
    expect(html).toContain('Left Inferior Rectus (LIR)');
    expect(html).toContain('RHT 24Δ');
    expect(html).toContain('RHT 22Δ');
  });
});
