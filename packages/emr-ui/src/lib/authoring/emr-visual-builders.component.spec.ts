import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type {
  FhirQuestionnaireMapperIntent,
  FhirQuestionnaireMapperViewModel,
  LogicRuleBuilderIntent,
  LogicRuleBuilderViewModel,
  ScoreBuilderIntent,
  ScoreBuilderViewModel,
} from '../../../../emr-controller/src/l6-builders.models';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/authoring/emr-visual-builders.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadVisualBuildersModule() {
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

  const mockRequire = (id: string) => {
    if (id === '@angular/core') {
      return {
        ChangeDetectionStrategy: { OnPush: 0 },
        Component: () => (cls: unknown) => cls,
        Input: () => () => {},
        Output: () => () => {},
        EventEmitter: class<T> {
          private listeners: ((v: T) => void)[] = [];
          emit(v: T) {
            this.listeners.forEach(l => l(v));
          }
          subscribe(l: (v: T) => void) {
            this.listeners.push(l);
          }
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
    EmrLogicRuleBuilderComponent: new () => Record<string, any>;
    EmrScoreBuilderComponent: new () => Record<string, any>;
    EmrFhirQuestionnaireMapperComponent: new () => Record<string, any>;
    LOGIC_BUILDER_ENGINE_VERSION: number;
  };
}

const mod = loadVisualBuildersModule();

function makeLogicModel(overrides: Partial<LogicRuleBuilderViewModel> = {}): LogicRuleBuilderViewModel {
  return {
    ruleId: 'glaucoma-alert',
    label: 'High IOP Alert Rule',
    description: 'Trigger alert when IOP >= 22 mmHg',
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
      alertMessage: 'Elevated IOP detected',
      alertTone: 'warning',
    },
    availableFields: [
      { id: 'iop_od', label: 'IOP Right Eye (OD)', valueType: 'quantity' },
      { id: 'family_hx', label: 'Family Hx Glaucoma', valueType: 'boolean' },
    ],
    testValues: { iop_od: 24 },
    ...overrides,
  };
}

function makeScoreModel(overrides: Partial<ScoreBuilderViewModel> = {}): ScoreBuilderViewModel {
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
          optionPoints: { none: 0, several: 1, half: 2, daily: 3 },
        },
        {
          id: 'i-2',
          fieldId: 'q2',
          label: 'Depressed mood',
          weight: 1,
          required: true,
          optionPoints: { none: 0, several: 1, half: 2, daily: 3 },
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
    sampleAnswers: { q1: 'half', q2: 'several' },
    ...overrides,
  };
}

function makeFhirMapperModel(
  overrides: Partial<FhirQuestionnaireMapperViewModel> = {},
): FhirQuestionnaireMapperViewModel {
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
    ...overrides,
  };
}

describe('Angular L6 Visual Authoring Builders (emr-visual-builders.component.ts)', () => {
  it('obeys strict SSR & styling guardrails: zero runtime controller imports and zero colour literals', () => {
    const runtimeImport = /(?:^|\n)\s*import\s+(?!type\b)[^;]*?from\s+['"]@drguptavivek\/emr-controller/;
    expect(componentSource).not.toMatch(runtimeImport);
    const colourLiteral = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/;
    expect(componentSource).not.toMatch(colourLiteral);
    expect(componentSource).toContain("selector: 'emr-logic-rule-builder'");
    expect(componentSource).toContain("selector: 'emr-score-builder'");
    expect(componentSource).toContain("selector: 'emr-fhir-questionnaire-mapper'");
  });

  describe('1. EmrLogicRuleBuilderComponent', () => {
    it('evaluates live sandbox to true/false/indeterminate and emits predicate, group, combinator, target, and artifact intents', () => {
      const comp = new mod.EmrLogicRuleBuilderComponent();
      comp.model = makeLogicModel();
      const emitted: LogicRuleBuilderIntent[] = [];
      comp.intent.subscribe((i: LogicRuleBuilderIntent) => emitted.push(i));

      expect(comp.liveEvaluation().outcome).toBe('true');

      comp.model = makeLogicModel({ testValues: { iop_od: 14 } });
      expect(comp.liveEvaluation().outcome).toBe('false');

      comp.model = makeLogicModel({ testValues: {} });
      expect(comp.liveEvaluation().outcome).toBe('indeterminate');

      comp.changeCombinator('g-root', 'any');
      expect(emitted.at(-1)).toEqual({
        type: 'combinatorChanged',
        groupId: 'g-root',
        combinator: 'any',
      });

      comp.addPredicate('g-root');
      expect(emitted.at(-1)?.type).toBe('predicateAdded');

      comp.addGroup('g-root');
      expect(emitted.at(-1)?.type).toBe('groupAdded');

      comp.updatePredicateOperator('p-1', 'gt');
      expect(emitted.at(-1)).toEqual({
        type: 'predicateUpdated',
        predicateId: 'p-1',
        changes: { operator: 'gt' },
      });

      comp.changeTargetEffect('requiredWhen');
      expect(emitted.at(-1)).toEqual({
        type: 'targetChanged',
        target: {
          ...comp.model.target,
          effect: 'requiredWhen',
        },
      });

      comp.updateTestValue('iop_od', '26');
      expect(emitted.at(-1)).toEqual({
        type: 'testValueChanged',
        fieldId: 'iop_od',
        value: 26,
      });

      comp.saveArtifact();
      const saved = emitted.at(-1) as Extract<LogicRuleBuilderIntent, { type: 'artifactSaved' }>;
      expect(saved.type).toBe('artifactSaved');
      expect(saved.artifact.engineVersion).toBe(3);
      expect(saved.artifact.compiledCondition).toEqual({
        all: [{ op: '>=', left: { path: 'iop_od' }, right: { value: 22 } }],
      });
    });
  });

  describe('2. EmrScoreBuilderComponent', () => {
    it('computes live EmrScoreResult preview and emits item, band, policy, sampleAnswer, and save intents', () => {
      const comp = new mod.EmrScoreBuilderComponent();
      comp.model = makeScoreModel();
      const emitted: ScoreBuilderIntent[] = [];
      comp.intent.subscribe((i: ScoreBuilderIntent) => emitted.push(i));

      const preview = comp.liveScoreResult();
      expect(preview.total).toBe(3);
      expect(preview.bandLabel).toBe('Positive screen');
      expect(preview.bandTone).toBe('warning');
      expect(preview.interpretation).toBe('Administer full PHQ-9.');

      comp.changeMissingPolicy('prorate');
      expect(emitted.at(-1)).toEqual({ type: 'missingPolicyChanged', policy: 'prorate' });

      comp.addItem();
      expect(emitted.at(-1)?.type).toBe('scoreItemAdded');

      comp.addBand();
      expect(emitted.at(-1)?.type).toBe('scoreBandAdded');

      comp.changeSampleAnswer('q1', 'daily');
      expect(emitted.at(-1)).toEqual({
        type: 'sampleAnswerChanged',
        fieldId: 'q1',
        value: 'daily',
      });

      comp.saveDefinition();
      expect(emitted.at(-1)?.type).toBe('scoreDefinitionSaved');
    });
  });

  describe('3. EmrFhirQuestionnaireMapperComponent', () => {
    it('toggles R4/R5 FHIR version, updates field mappings, binds terminology codes, and emits export/import intents', () => {
      const comp = new mod.EmrFhirQuestionnaireMapperComponent();
      comp.model = makeFhirMapperModel();
      const emitted: FhirQuestionnaireMapperIntent[] = [];
      comp.intent.subscribe((i: FhirQuestionnaireMapperIntent) => emitted.push(i));

      expect(comp.selectedRow()?.linkId).toBe('iop-od');
      expect(comp.questionnaireJson()).toContain('"resourceType": "Questionnaire"');

      comp.toggleFhirVersion('R5');
      expect(emitted.at(-1)).toEqual({ type: 'fhirVersionToggled', fhirVersion: 'R5' });

      comp.updateRowFhirType('iop-od', 'decimal');
      expect(emitted.at(-1)).toEqual({
        type: 'fieldMappingUpdated',
        linkId: 'iop-od',
        changes: { fhirItemType: 'decimal' },
      });

      comp.newCodingCode = '56844-4';
      comp.newCodingDisplay = 'Intraocular pressure';
      comp.bindTerminologyCode('iop-od');
      expect(emitted.at(-1)).toEqual({
        type: 'fieldMappingUpdated',
        linkId: 'iop-od',
        changes: {
          terminologyCode: {
            system: 'http://loinc.org',
            code: '56844-4',
            display: 'Intraocular pressure',
          },
        },
      });

      comp.importJsonDraft = '{"resourceType":"Questionnaire","id":"q-1","status":"draft","item":[]}';
      comp.importQuestionnaire();
      expect(emitted.at(-1)).toEqual({
        type: 'questionnaireImportRequested',
        rawJson: '{"resourceType":"Questionnaire","id":"q-1","status":"draft","item":[]}',
      });
    });
  });
});
