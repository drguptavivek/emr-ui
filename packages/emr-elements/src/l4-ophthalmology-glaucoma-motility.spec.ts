// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type {
  EmrGonioscopyChartViewModel,
  EmrHessScreenChartViewModel,
  EmrVisualFieldSummaryViewModel,
} from '../../emr-controller/src/l4-ophthalmology-glaucoma-motility.models.js';
import {
  EmrGonioscopyChartElement,
  EmrHessScreenChartElement,
  EmrVisualFieldSummaryElement,
  registerL4OphthalmologyGlaucomaMotilityElements,
} from './l4-ophthalmology-glaucoma-motility.js';

const mounted: HTMLElement[] = [];

async function mount<T extends HTMLElement & { updateComplete: Promise<boolean> }>(
  tag: string,
  props: Partial<T>,
) {
  registerL4OphthalmologyGlaucomaMotilityElements();
  const element = Object.assign(document.createElement(tag) as T, props);
  mounted.push(element);
  document.body.append(element);
  await element.updateComplete;
  const intents: unknown[] = [];
  element.addEventListener('intent', (event) => intents.push((event as CustomEvent).detail));
  return { element, intents };
}

afterEach(() => {
  for (const el of mounted.splice(0)) el.remove();
});

describe('Lit L4 Ophthalmology Glaucoma & Motility Elements', () => {
  it('registers <emr-gonioscopy-chart> and emits quadrantSelected, quadrantGradeChanged, quadrantPigmentationChanged, pasClockHourToggled, viewModeChanged, and copyEyeRequested', async () => {
    const model: EmrGonioscopyChartViewModel = {
      id: 'gonio-lit',
      title: 'Lit Gonioscopy Angle Chart',
      viewMode: 'both',
      selectedEye: 'OD',
      selectedQuadrant: 'superior',
      od: {
        eye: 'OD',
        gradingSystem: 'shaffer',
        lensUsed: 'Posner 4-Mirror',
        pasClockHours: [12],
        quadrants: {
          superior: { quadrant: 'superior', staticGrade: '0', dynamicGrade: '1', pigmentation: 3 },
          nasal: { quadrant: 'nasal', staticGrade: 'slit', dynamicGrade: '2', pigmentation: 2 },
          inferior: { quadrant: 'inferior', staticGrade: '2', dynamicGrade: '3', pigmentation: 3 },
          temporal: { quadrant: 'temporal', staticGrade: '1', dynamicGrade: '3', pigmentation: 2 },
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

    const { element, intents } = await mount<EmrGonioscopyChartElement>('emr-gonioscopy-chart', {
      model,
    });
    expect(element.shadowRoot!.textContent).toContain('Lit Gonioscopy Angle Chart');
    expect(element.shadowRoot!.textContent).toContain('Occludable (3/4 closed)');

    const buttons = [...element.shadowRoot!.querySelectorAll('button')];
    buttons.find((b) => b.textContent?.trim() === 'Dynamic')!.click();
    expect(intents.at(-1)).toEqual({ type: 'viewModeChanged', viewMode: 'dynamic' });

    buttons.find((b) => b.textContent?.trim() === 'Copy OD → OS')!.click();
    expect(intents.at(-1)).toEqual({ type: 'copyEyeRequested', fromEye: 'OD', toEye: 'OS' });

    const tabs = [...element.shadowRoot!.querySelectorAll('[role="tab"]')] as HTMLButtonElement[];
    tabs.find((t) => t.textContent?.includes('NASAL'))!.click();
    expect(intents.at(-1)).toEqual({ type: 'quadrantSelected', eye: 'OD', quadrant: 'nasal' });

    buttons.find((b) => b.textContent?.trim() === 'Gr 4')!.click();
    expect(intents.at(-1)).toEqual({
      type: 'quadrantGradeChanged',
      eye: 'OD',
      quadrant: 'superior',
      mode: 'static',
      grade: '4',
    });

    buttons.find((b) => b.textContent?.trim() === '4+')!.click();
    expect(intents.at(-1)).toEqual({
      type: 'quadrantPigmentationChanged',
      eye: 'OD',
      quadrant: 'superior',
      pigmentation: 4,
    });

    buttons.find((b) => b.textContent?.trim() === '6h')!.click();
    expect(intents.at(-1)).toEqual({
      type: 'pasClockHourToggled',
      eye: 'OD',
      clockHour: 6,
    });
  });

  it('registers <emr-visual-field-summary> and emits mapTypeChanged, pointSelected, defectPatternChanged, and eyeAssessmentStatusChanged', async () => {
    const model: EmrVisualFieldSummaryViewModel = {
      id: 'vf-lit',
      title: 'Lit Perimetry Summary',
      activeMapType: 'pattern-deviation',
      od: {
        eye: 'OD',
        strategy: '24-2 SITA-Standard',
        testDate: '12 Nov 2026',
        fixationLosses: '1/14',
        falsePositivesPct: 2,
        falseNegativesPct: 4,
        vfiPct: 80,
        mdDb: -6.8,
        psdDb: 8.1,
        ght: 'Outside Normal Limits',
        points: [
          {
            id: 'pt-sup-1',
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
        testDate: '12 Nov 2026',
        fixationLosses: '0/15',
        falsePositivesPct: 1,
        falseNegativesPct: 2,
        vfiPct: 99,
        mdDb: -0.3,
        psdDb: 1.4,
        ght: 'Within Normal Limits',
        points: [],
      },
    };

    const { element, intents } = await mount<EmrVisualFieldSummaryElement>(
      'emr-visual-field-summary',
      { model },
    );
    expect(element.shadowRoot!.textContent).toContain('Lit Perimetry Summary');
    expect(element.shadowRoot!.textContent).toContain('Outside Normal Limits');

    const buttons = [...element.shadowRoot!.querySelectorAll('button')];
    buttons.find((b) => b.textContent?.trim() === 'Total Deviation Map')!.click();
    expect(intents.at(-1)).toEqual({ type: 'mapTypeChanged', mapType: 'total-deviation' });

    buttons.find((b) => b.textContent?.includes('pt-sup-1'))!.click();
    expect(intents.at(-1)).toEqual({ type: 'pointSelected', eye: 'OD', pointId: 'pt-sup-1' });

    buttons.find((b) => b.textContent?.trim() === 'Nasal Step')!.click();
    expect(intents.at(-1)).toEqual({
      type: 'defectPatternChanged',
      eye: 'OD',
      patternLabel: 'Nasal Step',
    });

    buttons.find((b) => b.textContent?.trim() === 'Unable to assess')!.click();
    expect(intents.at(-1)).toEqual({
      type: 'eyeAssessmentStatusChanged',
      eye: 'OD',
      status: 'unable-to-assess',
    });
  });

  it('registers <emr-hess-screen-chart> and emits pointSelected, pointNudged, pbctCellEdited, and distanceModeChanged', async () => {
    const model: EmrHessScreenChartViewModel = {
      id: 'hess-lit',
      title: 'Lit Hess Tangent Screen',
      activeDistanceMode: 'distance-6m',
      selectedGazeId: 'SW',
      leftChartOsFixing: {
        fixingEye: 'OS',
        plottedEye: 'OD',
        primaryRestrictionMuscle: 'Right Superior Oblique',
        innerFieldPoints: [
          { gazeId: 'NW', expectedXDeg: -15, expectedYDeg: 15, plottedXDeg: -14, plottedYDeg: 18 },
          { gazeId: 'SE', expectedXDeg: 15, expectedYDeg: -15, plottedXDeg: 12, plottedYDeg: -12 },
          { gazeId: 'SW', expectedXDeg: -15, expectedYDeg: -15, plottedXDeg: -10, plottedYDeg: -6 },
        ],
        outerFieldPoints: [],
      },
      rightChartOdFixing: {
        fixingEye: 'OD',
        plottedEye: 'OS',
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
    };

    const { element, intents } = await mount<EmrHessScreenChartElement>('emr-hess-screen-chart', {
      model,
    });
    expect(element.shadowRoot!.textContent).toContain('Lit Hess Tangent Screen');
    expect(element.shadowRoot!.textContent).toContain('Right Superior Oblique');

    const buttons = [...element.shadowRoot!.querySelectorAll('button')];
    buttons.find((b) => b.textContent?.trim() === 'Near (33cm)')!.click();
    expect(intents.at(-1)).toEqual({ type: 'distanceModeChanged', distanceMode: 'near-33cm' });

    buttons.find((b) => b.textContent?.includes('SW (-10°, -6°)'))!.click();
    expect(intents.at(-1)).toEqual({
      type: 'pointSelected',
      chart: 'left-os-fixing',
      field: 'inner',
      gazeId: 'SW',
    });

    buttons.find((b) => b.textContent?.trim() === '↓ -2° Y')!.click();
    expect(intents.at(-1)).toEqual({
      type: 'pointNudged',
      chart: 'left-os-fixing',
      field: 'inner',
      gazeId: 'SW',
      dxDeg: 0,
      dyDeg: -2,
    });

    buttons.find((b) => b.textContent?.trim() === 'Edit SW')!.click();
    expect(intents.at(-1)).toEqual({
      type: 'pbctCellEdited',
      distanceMode: 'distance-6m',
      gazeId: 'SW',
      horizontalDelta: '2Δ ET',
      verticalDelta: 'RHT 24Δ',
    });
  });
});
