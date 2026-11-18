import { describe, expect, it } from 'vitest';
import type { ClinicalFormSchema } from './clinical-form.models.js';
import { EMR_ENGINE_VERSION } from './engine-version.js';
import type { EmrFieldDefinition } from './field-contract.models.js';
import {
  CURRENT_LOGIC_ENGINE_VERSION,
  FHIR_UNIT_EXTENSION_URL,
  buildVersionedLogicArtifact,
  collectConditionNodeFields,
  compileConditionNode,
  evaluateLogicRuleSandbox,
  evaluateScoreDefinition,
  fromFhirQuestionnaire,
  toFhirQuestionnaire,
  type ConditionGroupNode,
  type ScoreDefinitionSchema,
} from './l6-builders.models.js';

describe('L6 Visual Authoring Builders — Controller Models & Pure Evaluators', () => {
  describe('1. EmrLogicRuleBuilder helpers', () => {
    const sampleRuleRoot: ConditionGroupNode = {
      kind: 'group',
      id: 'g-root',
      combinator: 'all',
      children: [
        {
          kind: 'predicate',
          id: 'p-iop',
          fieldId: 'iop_od',
          operator: 'gte',
          value: 22,
        },
        {
          kind: 'group',
          id: 'g-sub',
          combinator: 'any',
          children: [
            {
              kind: 'predicate',
              id: 'p-hx',
              fieldId: 'family_hx_glaucoma',
              operator: 'eq',
              value: true,
            },
            {
              kind: 'predicate',
              id: 'p-drops',
              fieldId: 'current_drops',
              operator: 'in',
              value: ['timolol', 'latanoprost'],
            },
          ],
        },
      ],
    };

    it('stamps VersionedLogicArtifact with CURRENT_LOGIC_ENGINE_VERSION and compiles ConditionNode to EmrCondition', () => {
      expect(CURRENT_LOGIC_ENGINE_VERSION).toBe(EMR_ENGINE_VERSION);
      const artifact = buildVersionedLogicArtifact({
        ruleId: 'glaucoma-suspect-alert',
        label: 'Glaucoma suspect high IOP rule',
        description: 'Triggers alert when IOP >= 22 with family history or drop therapy',
        root: sampleRuleRoot,
        target: {
          effect: 'alert',
          targetFieldId: 'iop_od',
          alertMessage: 'Elevated IOP with glaucoma risk factor',
          alertTone: 'warning',
        },
      });

      expect(artifact.schemaVersion).toBe('1.0');
      expect(artifact.engineVersion).toBe(CURRENT_LOGIC_ENGINE_VERSION);
      expect(artifact.compiledCondition).toEqual({
        all: [
          { op: '>=', left: { path: 'iop_od' }, right: { value: 22 } },
          {
            any: [
              { op: '=', left: { path: 'family_hx_glaucoma' }, right: { value: true } },
              {
                any: [
                  { op: '=', left: { path: 'current_drops' }, right: { value: 'timolol' } },
                  { op: '=', left: { path: 'current_drops' }, right: { value: 'latanoprost' } },
                ],
              },
            ],
          },
        ],
      });
      expect([...collectConditionNodeFields(sampleRuleRoot)]).toEqual([
        'iop_od',
        'family_hx_glaucoma',
        'current_drops',
      ]);
    });

    it('evaluates live sandbox to true, false, or indeterminate against sample field values', () => {
      const evalIndeterminate = evaluateLogicRuleSandbox(sampleRuleRoot, {
        iop_od: 24,
      });
      expect(evalIndeterminate.outcome).toBe('indeterminate');
      expect(evalIndeterminate.missingFields).toEqual(['family_hx_glaucoma', 'current_drops']);

      const evalTrue = evaluateLogicRuleSandbox(sampleRuleRoot, {
        iop_od: 24,
        family_hx_glaucoma: true,
      });
      expect(evalTrue.outcome).toBe('true');

      const evalFalse = evaluateLogicRuleSandbox(sampleRuleRoot, {
        iop_od: 16,
      });
      expect(evalFalse.outcome).toBe('false');
    });

    it('compiles not, exists, empty, and contains operators accurately', () => {
      const notGroup: ConditionGroupNode = {
        kind: 'group',
        id: 'g-not',
        combinator: 'not',
        children: [
          {
            kind: 'predicate',
            id: 'p-contains',
            fieldId: 'symptoms',
            operator: 'contains',
            value: 'halos',
          },
        ],
      };
      expect(compileConditionNode(notGroup)).toEqual({
        not: {
          fn: 'includesValue',
          args: [{ path: 'symptoms' }, { value: 'halos' }],
        },
      });
      expect(evaluateLogicRuleSandbox(notGroup, { symptoms: 'blurred vision' }).outcome).toBe('true');
      expect(evaluateLogicRuleSandbox(notGroup, { symptoms: 'halos blurred' }).outcome).toBe('false');

      const existsPred = {
        kind: 'predicate' as const,
        id: 'p-exists',
        fieldId: 'allergy_note',
        operator: 'exists' as const,
        value: null,
      };
      expect(evaluateLogicRuleSandbox(existsPred, {}).outcome).toBe('false');
      expect(evaluateLogicRuleSandbox(existsPred, { allergy_note: 'Penicillin' }).outcome).toBe('true');

      const emptyPred = {
        kind: 'predicate' as const,
        id: 'p-empty',
        fieldId: 'allergy_note',
        operator: 'empty' as const,
        value: null,
      };
      expect(evaluateLogicRuleSandbox(emptyPred, {}).outcome).toBe('true');
      expect(evaluateLogicRuleSandbox(emptyPred, { allergy_note: 'Penicillin' }).outcome).toBe('false');
    });
  });

  describe('2. EmrScoreBuilder pure evaluator (evaluateScoreDefinition)', () => {
    const phq2Schema: ScoreDefinitionSchema = {
      schemaVersion: '1.0',
      engineVersion: CURRENT_LOGIC_ENGINE_VERSION,
      instrumentId: 'phq-2-weighted',
      title: 'PHQ-2 Depression Screener',
      versionStamp: '2026.1',
      missingItemPolicy: 'require-all',
      items: [
        {
          id: 'item-1',
          fieldId: 'anhedonia',
          label: 'Little interest or pleasure in doing things',
          weight: 1,
          required: true,
          optionPoints: {
            none: 0,
            several: 1,
            more_than_half: 2,
            nearly_every_day: 3,
          },
        },
        {
          id: 'item-2',
          fieldId: 'depressed_mood',
          label: 'Feeling down, depressed, or hopeless',
          weight: 1.5,
          required: true,
          optionPoints: {
            none: 0,
            several: 1,
            more_than_half: 2,
            nearly_every_day: 3,
          },
        },
      ],
      bands: [
        {
          id: 'band-normal',
          minScore: 0,
          maxScore: 2.99,
          label: 'Negative screen',
          tone: 'success',
          clinicalGuidance: 'Routine follow-up.',
        },
        {
          id: 'band-elevated',
          minScore: 3,
          maxScore: 10,
          label: 'Positive screen — administer PHQ-9',
          tone: 'warning',
          clinicalGuidance: 'Proceed to full diagnostic assessment.',
        },
      ],
    };

    it('computes weighted totals, bandLabel, bandTone, and clinicalGuidance when all items are answered', () => {
      const result = evaluateScoreDefinition(phq2Schema, {
        anhedonia: 'more_than_half', // 2 * 1 = 2
        depressed_mood: 'several', // 1 * 1.5 = 1.5
      });

      expect(result.total).toBe(3.5);
      expect(result.bandLabel).toBe('Positive screen — administer PHQ-9');
      expect(result.bandTone).toBe('warning');
      expect(result.interpretation).toBe('Proceed to full diagnostic assessment.');
      expect(result.completenessLabel).toBe('2/2 items complete');
      expect(result.missingItems).toEqual([]);
      expect(result.components).toEqual([
        { id: 'item-1', label: 'Little interest or pleasure in doing things', value: 2 },
        { id: 'item-2', label: 'Feeling down, depressed, or hopeless', value: 1.5 },
      ]);
    });

    it('respects require-all, prorate, and treat-as-zero missing-item policies', () => {
      const partialAnswers = { anhedonia: 'nearly_every_day' }; // 3 * 1 = 3, depressed_mood missing

      const requireAllRes = evaluateScoreDefinition(phq2Schema, partialAnswers);
      expect(requireAllRes.bandLabel).toBe('Incomplete — required items missing');
      expect(requireAllRes.missingItems).toEqual(['depressed_mood']);

      const prorateRes = evaluateScoreDefinition(
        { ...phq2Schema, missingItemPolicy: 'prorate' },
        partialAnswers,
      );
      // answeredSum = 3, answeredWeight = 1, totalWeight = 2.5 => prorated = 3 * 2.5 / 1 = 7.5
      expect(prorateRes.total).toBe(7.5);
      expect(prorateRes.bandLabel).toBe('Positive screen — administer PHQ-9');

      const zeroRes = evaluateScoreDefinition(
        { ...phq2Schema, missingItemPolicy: 'treat-as-zero' },
        partialAnswers,
      );
      expect(zeroRes.total).toBe(3);
      expect(zeroRes.components).toHaveLength(2);
      expect(zeroRes.components?.[1]?.value).toBe(0);
    });
  });

  describe('3. EmrFhirQuestionnaireMapper bi-directional conversion (toFhirQuestionnaire & fromFhirQuestionnaire)', () => {
    const schema: ClinicalFormSchema = {
      id: 'ophthalmic-intake',
      label: 'Ophthalmic Intake Assessment',
      description: 'Baseline vitals and ocular symptoms',
      sections: [
        {
          id: 'vitals-sec',
          label: 'Ocular Vitals',
          blocks: [
            {
              kind: 'field',
              id: 'iop-od',
              label: 'Intraocular Pressure OD',
              type: 'quantity',
              required: true,
              unit: 'mm[Hg]',
            },
            {
              kind: 'field',
              id: 'glaucoma-dx',
              label: 'Primary Diagnosis',
              type: 'select',
              required: false,
              options: [
                { value: 'poag', label: 'Primary open-angle glaucoma' },
                { value: 'pacg', label: 'Primary angle-closure glaucoma' },
              ],
            },
          ],
        },
      ],
    };

    const richFields: readonly EmrFieldDefinition[] = [
      {
        schemaVersion: '1.0',
        contract: {
          linkId: 'iop-od',
          valueType: 'quantity',
          cardinality: { min: 1, max: 1 },
          terminology: [
            {
              id: 'loinc-iop',
              role: 'question-meaning',
              concept: {
                sourceId: 'loinc',
                system: 'http://loinc.org',
                code: '79893-4',
                display: 'Intraocular pressure of Right eye',
              },
            },
          ],
          validation: [{ id: 'v-min', kind: 'minimum', value: 0 }],
          unit: { system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
          defaultValue: { value: 16, unit: 'mm[Hg]' },
        },
        presentation: {
          label: 'Intraocular Pressure OD',
          unitDisplay: 'mmHg',
        },
      },
      {
        schemaVersion: '1.0',
        contract: {
          linkId: 'glaucoma-dx',
          valueType: 'select',
          cardinality: { min: 0, max: 1 },
          terminology: [
            {
              id: 'vs-glaucoma',
              role: 'answer-value-set',
              valueSetCanonical: 'http://hl7.org/fhir/ValueSet/glaucoma-types',
            },
          ],
          validation: [],
          enableWhen: [
            {
              question: { segments: [{ linkId: 'iop-od' }] },
              operator: '>=',
              answer: 21,
            },
          ],
          enableBehavior: 'all',
        },
        presentation: {
          label: 'Primary Diagnosis',
          options: [
            { value: 'poag', label: 'Primary open-angle glaucoma' },
            { value: 'pacg', label: 'Primary angle-closure glaucoma' },
          ],
        },
      },
    ];

    it('exports R4 and R5 FHIR Questionnaires with terminology codes, UCUM unit extensions, enableWhen, initial, and diagnostics', () => {
      const r4Export = toFhirQuestionnaire(schema, 'R4', richFields);
      expect(r4Export.questionnaire.fhirVersion).toBe('4.0.1');
      expect(r4Export.rows).toHaveLength(2);

      const iopRow = r4Export.rows[0]!;
      expect(iopRow.fhirItemType).toBe('quantity');
      expect(iopRow.terminologyCodes[0]?.code).toBe('79893-4');
      expect(iopRow.ucumUnit?.code).toBe('mm[Hg]');
      expect(iopRow.hasInitialValue).toBe(true);

      const dxRowR4 = r4Export.rows[1]!;
      expect(dxRowR4.fhirItemType).toBe('choice');
      expect(dxRowR4.enableWhenCount).toBe(1);

      const groupItem = r4Export.questionnaire.item[0]!;
      const iopItem = groupItem.item![0]!;
      expect(iopItem.extension?.[0]?.url).toBe(FHIR_UNIT_EXTENSION_URL);
      expect(iopItem.extension?.[0]?.valueCoding?.code).toBe('mm[Hg]');

      const r5Export = toFhirQuestionnaire(schema, 'R5', richFields);
      expect(r5Export.questionnaire.fhirVersion).toBe('5.0.0');
      expect(r5Export.rows[1]?.fhirItemType).toBe('coding');
      expect(r5Export.questionnaire.item[0]?.item?.[1]?.answerConstraint).toBe('optionsOnly');
    });

    it('round-trips FHIR Questionnaire back into ClinicalFormSchema and EmrFieldDefinitions via fromFhirQuestionnaire', () => {
      const r5Export = toFhirQuestionnaire(schema, 'R5', richFields);
      const imported = fromFhirQuestionnaire(r5Export.questionnaire);

      expect(imported.detectedFhirVersion).toBe('R5');
      expect(imported.schema.id).toBe('ophthalmic-intake');
      expect(imported.schema.sections).toHaveLength(1);
      expect(imported.fields).toHaveLength(2);

      const iopDef = imported.fields[0]!;
      expect(iopDef.contract.linkId).toBe('iop-od');
      expect(iopDef.contract.valueType).toBe('quantity');
      expect(iopDef.contract.unit).toEqual({
        system: 'http://unitsofmeasure.org',
        code: 'mm[Hg]',
      });
      expect(iopDef.contract.terminology.some(b => b.concept?.code === '79893-4')).toBe(true);

      const dxDef = imported.fields[1]!;
      expect(dxDef.contract.linkId).toBe('glaucoma-dx');
      expect(dxDef.contract.valueType).toBe('select');
      expect(dxDef.contract.enableWhen?.[0]?.operator).toBe('>=');
      expect(dxDef.contract.enableWhen?.[0]?.answer).toBe(21);
      expect(dxDef.presentation.options).toHaveLength(2);
    });
  });
});
