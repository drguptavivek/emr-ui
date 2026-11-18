import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('react-native', () => import('react-native-web'));

import type {
  FhirQuestionnaireMapperViewModel,
  LogicRuleBuilderViewModel,
  ScoreBuilderViewModel,
} from '../../emr-controller/src/l6-builders.models';
import {
  EmrFhirQuestionnaireMapper,
  EmrLogicRuleBuilder,
  EmrScoreBuilder,
} from './l6-builders';
import {
  CURRENT_LOGIC_ENGINE_VERSION,
  buildLoincOrCustomCoding,
  createBlankGroupNode,
  createBlankPredicateNode,
  createBlankScoreBand,
  createBlankScoreItem,
  formatScalarInput,
  parseScalarInput,
  resolveLogicBuilderArtifact,
  resolveLogicBuilderSandbox,
  resolveScoreBuilderPreview,
  resolveSelectedFhirMappingRow,
} from './l6-builders.logic';

const logicModel: LogicRuleBuilderViewModel = {
  ruleId: 'glaucoma-iop-rule',
  label: 'Glaucoma IOP Alert Rule',
  description: 'Alerts when IOP >= 22 mmHg',
  engineVersion: CURRENT_LOGIC_ENGINE_VERSION,
  root: {
    kind: 'group',
    id: 'g-root',
    combinator: 'all',
    children: [
      {
        kind: 'predicate',
        id: 'p-1',
        fieldId: 'iop_od',
        operator: 'gte',
        value: 22,
      },
    ],
  },
  target: {
    effect: 'alert',
    targetFieldId: 'iop_od',
    alertMessage: 'Elevated IOP detected',
    alertTone: 'warning',
  },
  availableFields: [
    { id: 'iop_od', label: 'IOP OD', valueType: 'quantity' },
    { id: 'fhx', label: 'Family History', valueType: 'boolean' },
  ],
  testValues: {
    iop_od: 25,
  },
};

const scoreModel: ScoreBuilderViewModel = {
  definition: {
    schemaVersion: '1.0',
    engineVersion: CURRENT_LOGIC_ENGINE_VERSION,
    instrumentId: 'osdi-short',
    title: 'OSDI Dry Eye Calculator',
    versionStamp: '2026.1',
    missingItemPolicy: 'prorate',
    items: [
      {
        id: 'i-1',
        fieldId: 'light_sens',
        label: 'Sensitivity to light',
        weight: 1,
        required: true,
        optionPoints: { none: 0, some: 2, all: 4 },
      },
      {
        id: 'i-2',
        fieldId: 'gritty',
        label: 'Gritty sensation',
        weight: 1.5,
        required: true,
        optionPoints: { none: 0, some: 2, all: 4 },
      },
    ],
    bands: [
      {
        id: 'b-normal',
        minScore: 0,
        maxScore: 3,
        label: 'Normal ocular surface',
        tone: 'success',
        clinicalGuidance: 'Routine lubrication.',
      },
      {
        id: 'b-severe',
        minScore: 3.01,
        maxScore: 20,
        label: 'Moderate-to-severe dry eye',
        tone: 'warning',
        clinicalGuidance: 'Start preservative-free tears QID.',
      },
    ],
  },
  sampleAnswers: {
    light_sens: 'some',
    gritty: 'all',
  },
};

const fhirMapperModel: FhirQuestionnaireMapperViewModel = {
  fhirVersion: 'R4',
  schema: {
    id: 'eye-vitals',
    label: 'Ocular Vitals Schema',
    sections: [],
  },
  questionnaire: {
    resourceType: 'Questionnaire',
    id: 'eye-vitals',
    status: 'active',
    fhirVersion: '4.0.1',
    item: [
      {
        linkId: 'iop-od',
        type: 'quantity',
        text: 'IOP OD',
        required: true,
      },
    ],
  },
  rows: [
    {
      linkId: 'iop-od',
      label: 'IOP OD',
      emrValueType: 'quantity',
      fhirItemType: 'quantity',
      required: true,
      repeats: false,
      terminologyCodes: [{ system: 'http://loinc.org', code: '79893-4', display: 'IOP OD' }],
      ucumUnit: { system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
      enableWhenCount: 0,
      hasInitialValue: true,
      warnings: [],
    },
  ],
  diagnostics: [
    {
      severity: 'info',
      code: 'validation-sdc-extension',
      linkId: 'iop-od',
      message: 'Range validation uses SDC extension.',
    },
  ],
  selectedLinkId: 'iop-od',
};

describe('React L6 Visual Authoring Builders (l6-builders.tsx & l6-builders.logic.ts)', () => {
  it('enforces React architecture boundaries: use client directive and type-only controller imports in l6-builders.tsx', () => {
    const tsxText = readFileSync(
      join(process.cwd(), 'packages/emr-react/src/l6-builders.tsx'),
      'utf8',
    );
    expect(tsxText.trimStart().startsWith("'use client';")).toBe(true);
    const runtimeControllerImport =
      /(?:^|\n)\s*(?:import|export)\s+(?!type\b)[^;]*?from\s+['"]@drguptavivek\/emr-controller/;
    expect(tsxText).not.toMatch(runtimeControllerImport);
    const localContractDecl = /(?:^|\n)\s*export\s+(?:interface|type)\s+\w*(?:ViewModel|Model|Intent)\b/;
    expect(tsxText).not.toMatch(localContractDecl);
  });

  it('1. EmrLogicRuleBuilder renders ConditionNode tree, engine version stamp, and live sandbox outcome', () => {
    expect(parseScalarInput('22')).toBe(22);
    expect(parseScalarInput('true')).toBe(true);
    expect(parseScalarInput('false')).toBe(false);
    expect(parseScalarInput('')).toBeNull();
    expect(formatScalarInput(['a', 'b'])).toBe('a, b');

    const sandbox = resolveLogicBuilderSandbox(logicModel);
    expect(sandbox.outcome).toBe('true');

    const artifact = resolveLogicBuilderArtifact(logicModel);
    expect(artifact.engineVersion).toBe(CURRENT_LOGIC_ENGINE_VERSION);

    const blankPred = createBlankPredicateNode('p-new', 'iop_od');
    expect(blankPred.fieldId).toBe('iop_od');
    expect(createBlankGroupNode('g-new', 'any').combinator).toBe('any');

    const html = renderToStaticMarkup(
      createElement(EmrLogicRuleBuilder, {
        model: logicModel,
        onIntent: () => {},
      }),
    );
    expect(html).toContain('Glaucoma IOP Alert Rule');
    expect(html).toContain(`CURRENT_LOGIC_ENGINE_VERSION = v${CURRENT_LOGIC_ENGINE_VERSION}`);
    expect(html).toContain('TRUE');
    expect(html).toContain('Rule evaluates to TRUE');
  });

  it('2. EmrScoreBuilder computes weighted EmrScoreResult preview and renders items, bands, and missing-item policy', () => {
    const preview = resolveScoreBuilderPreview(scoreModel);
    // light_sens: 2 * 1 = 2, gritty: 4 * 1.5 = 6 => total = 8
    expect(preview.total).toBe(8);
    expect(preview.bandLabel).toBe('Moderate-to-severe dry eye');
    expect(preview.bandTone).toBe('warning');

    expect(createBlankScoreItem(3).fieldId).toBe('item_3');
    expect(createBlankScoreBand(2, 0, 5, 'info').tone).toBe('info');

    const html = renderToStaticMarkup(
      createElement(EmrScoreBuilder, {
        model: scoreModel,
        onIntent: () => {},
      }),
    );
    expect(html).toContain('OSDI Dry Eye Calculator');
    expect(html).toContain('Policy: prorate');
    expect(html).toContain('Moderate-to-severe dry eye');
    expect(html).toContain('Start preservative-free tears QID.');
  });

  it('3. EmrFhirQuestionnaireMapper renders side-by-side mapping table, R4/R5 toggle, diagnostics, and FHIR JSON preview', () => {
    expect(resolveSelectedFhirMappingRow(fhirMapperModel)?.linkId).toBe('iop-od');
    expect(buildLoincOrCustomCoding('79893-4', 'IOP OD')).toEqual({
      system: 'http://loinc.org',
      code: '79893-4',
      display: 'IOP OD',
    });

    const html = renderToStaticMarkup(
      createElement(EmrFhirQuestionnaireMapper, {
        model: fhirMapperModel,
        onIntent: () => {},
      }),
    );
    expect(html).toContain('Ocular Vitals Schema');
    expect(html).toContain('FHIR R4 (4.0.1)');
    expect(html).toContain('FHIR R5 (5.0.0)');
    expect(html).toContain('79893-4');
    expect(html).toContain('UCUM: mm[Hg]');
    expect(html).toContain('Range validation uses SDC extension.');
  });
});
