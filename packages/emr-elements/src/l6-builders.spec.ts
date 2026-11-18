// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type {
  FhirQuestionnaireMapperViewModel,
  LogicRuleBuilderViewModel,
  ScoreBuilderViewModel,
} from '../../emr-controller/src/l6-builders.models.js';
import {
  EmrFhirQuestionnaireMapperElement,
  EmrLogicRuleBuilderElement,
  EmrScoreBuilderElement,
  registerL6BuilderElements,
} from './l6-builders.js';

function logicModel(): LogicRuleBuilderViewModel {
  return {
    ruleId: 'glaucoma-alert',
    label: 'High IOP Rule',
    engineVersion: 3,
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
      alertMessage: 'Elevated IOP',
      alertTone: 'warning',
    },
    availableFields: [
      { id: 'iop_od', label: 'IOP OD', valueType: 'quantity' },
      { id: 'fhx', label: 'Family History', valueType: 'boolean' },
    ],
    testValues: { iop_od: 26 },
  };
}

function scoreModel(): ScoreBuilderViewModel {
  return {
    definition: {
      schemaVersion: '1.0',
      engineVersion: 3,
      instrumentId: 'phq-2',
      title: 'PHQ-2 Depression Screener',
      versionStamp: '1.0.0',
      missingItemPolicy: 'require-all',
      items: [
        {
          id: 'i-1',
          fieldId: 'q1',
          label: 'Anhedonia',
          weight: 1,
          required: true,
          optionPoints: { none: 0, several: 1, daily: 3 },
        },
        {
          id: 'i-2',
          fieldId: 'q2',
          label: 'Depressed mood',
          weight: 1,
          required: true,
          optionPoints: { none: 0, several: 1, daily: 3 },
        },
      ],
      bands: [
        { id: 'b-low', minScore: 0, maxScore: 2, label: 'Negative screen', tone: 'success' },
        {
          id: 'b-high',
          minScore: 3,
          maxScore: 6,
          label: 'Positive screen',
          tone: 'warning',
          clinicalGuidance: 'Administer full PHQ-9.',
        },
      ],
    },
    sampleAnswers: { q1: 'daily', q2: 'several' },
  };
}

function fhirMapperModel(): FhirQuestionnaireMapperViewModel {
  return {
    fhirVersion: 'R4',
    schema: {
      id: 'eye-vitals',
      label: 'Ocular Vitals Form',
      sections: [],
    },
    questionnaire: {
      resourceType: 'Questionnaire',
      id: 'eye-vitals',
      status: 'active',
      fhirVersion: '4.0.1',
      item: [{ linkId: 'iop-od', type: 'quantity', text: 'IOP OD', required: true }],
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
}

describe('Lit L6 Visual Authoring Builders (l6-builders.ts)', () => {
  it('registers all three L6 builder custom elements via registerL6BuilderElements()', () => {
    registerL6BuilderElements();
    for (const tag of ['emr-logic-rule-builder', 'emr-score-builder', 'emr-fhir-questionnaire-mapper']) {
      expect(customElements.get(tag)).toBeDefined();
    }
  });

  it('renders EmrLogicRuleBuilderElement, evaluates sandbox, and emits combinator, predicate, testValue, and save intents', async () => {
    registerL6BuilderElements();
    const element = document.createElement('emr-logic-rule-builder') as EmrLogicRuleBuilderElement;
    element.model = logicModel();
    const intents: unknown[] = [];
    element.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      expect(element.shadowRoot!.textContent).toContain('High IOP Rule');
      expect(element.shadowRoot!.textContent).toContain('CURRENT_LOGIC_ENGINE_VERSION = v3');
      expect(element.shadowRoot!.textContent).toContain('Rule evaluates to TRUE');

      const anyBtn = [...element.shadowRoot!.querySelectorAll('button')].find(
        b => b.textContent?.trim() === 'ANY',
      )!;
      anyBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'combinatorChanged',
        groupId: 'g-root',
        combinator: 'any',
      });

      const addPredBtn = [...element.shadowRoot!.querySelectorAll('button')].find(
        b => b.textContent?.trim() === 'Add predicate',
      )!;
      addPredBtn.click();
      expect((intents.at(-1) as { type: string }).type).toBe('predicateAdded');

      const saveBtn = [...element.shadowRoot!.querySelectorAll('button')].find(
        b => b.textContent?.trim() === 'Save rule',
      )!;
      saveBtn.click();
      expect((intents.at(-1) as { type: string }).type).toBe('artifactSaved');
    } finally {
      element.remove();
    }
  });

  it('renders EmrScoreBuilderElement, computes live EmrScoreResult preview, and emits item, band, and save intents', async () => {
    registerL6BuilderElements();
    const element = document.createElement('emr-score-builder') as EmrScoreBuilderElement;
    element.model = scoreModel();
    const intents: unknown[] = [];
    element.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      expect(element.shadowRoot!.textContent).toContain('PHQ-2 Depression Screener');
      expect(element.shadowRoot!.textContent).toContain('Total: 4');
      expect(element.shadowRoot!.textContent).toContain('Positive screen');

      const addItemBtn = [...element.shadowRoot!.querySelectorAll('button')].find(
        b => b.textContent?.trim() === 'Add score item',
      )!;
      addItemBtn.click();
      expect((intents.at(-1) as { type: string }).type).toBe('scoreItemAdded');

      const addBandBtn = [...element.shadowRoot!.querySelectorAll('button')].find(
        b => b.textContent?.trim() === 'Add threshold band',
      )!;
      addBandBtn.click();
      expect((intents.at(-1) as { type: string }).type).toBe('scoreBandAdded');

      const saveBtn = [...element.shadowRoot!.querySelectorAll('button')].find(
        b => b.textContent?.trim() === 'Save score definition',
      )!;
      saveBtn.click();
      expect((intents.at(-1) as { type: string }).type).toBe('scoreDefinitionSaved');
    } finally {
      element.remove();
    }
  });

  it('renders EmrFhirQuestionnaireMapperElement and emits version toggle, terminology bind, export, and import intents', async () => {
    registerL6BuilderElements();
    const element = document.createElement(
      'emr-fhir-questionnaire-mapper',
    ) as EmrFhirQuestionnaireMapperElement;
    element.model = fhirMapperModel();
    const intents: unknown[] = [];
    element.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      expect(element.shadowRoot!.textContent).toContain('Ocular Vitals Form');
      expect(element.shadowRoot!.textContent).toContain('79893-4');
      expect(element.shadowRoot!.textContent).toContain('UCUM: mm[Hg]');

      const r5Btn = [...element.shadowRoot!.querySelectorAll('button')].find(
        b => b.textContent?.trim() === 'FHIR R5',
      )!;
      r5Btn.click();
      expect(intents.at(-1)).toEqual({ type: 'fhirVersionToggled', fhirVersion: 'R5' });

      const codeInput = element.shadowRoot!.querySelector(
        'input[aria-label="New terminology code"]',
      ) as HTMLInputElement;
      codeInput.value = '56844-4';
      codeInput.dispatchEvent(new Event('input', { bubbles: true }));
      await element.updateComplete;

      const bindBtn = [...element.shadowRoot!.querySelectorAll('button')].find(
        b => b.textContent?.trim() === 'Bind code',
      )!;
      bindBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'fieldMappingUpdated',
        linkId: 'iop-od',
        changes: {
          terminologyCode: { system: 'http://loinc.org', code: '56844-4', display: '56844-4' },
        },
      });

      const exportBtn = [...element.shadowRoot!.querySelectorAll('button')].find(
        b => b.textContent?.trim() === 'Export FHIR R4',
      )!;
      exportBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'questionnaireExportRequested',
        fhirVersion: 'R4',
      });
    } finally {
      element.remove();
    }
  });
});
