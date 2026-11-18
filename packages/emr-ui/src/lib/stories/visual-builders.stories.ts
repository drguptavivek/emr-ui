import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type {
  FhirQuestionnaireMapperViewModel,
  LogicRuleBuilderViewModel,
  ScoreBuilderViewModel,
} from '@drguptavivek/emr-controller';
import {
  EmrFhirQuestionnaireMapperComponent,
  EmrLogicRuleBuilderComponent,
  EmrScoreBuilderComponent,
} from '../authoring/emr-visual-builders.component';

const logicModel: LogicRuleBuilderViewModel = {
  ruleId: 'glaucoma-iop-alert',
  label: 'Glaucoma Elevated IOP & Risk Rule',
  description:
    'Triggers a clinical warning when Intraocular Pressure (OD) >= 22 mmHg AND either positive family history or active topical hypotensive drops.',
  engineVersion: 3,
  root: {
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
        id: 'g-risk',
        combinator: 'any',
        children: [
          {
            kind: 'predicate',
            id: 'p-fhx',
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
  },
  target: {
    effect: 'alert',
    targetFieldId: 'iop_od',
    alertMessage: 'Elevated IOP >= 22 mmHg with glaucoma risk factor — order OCT RNFL & Humphrey VF 24-2.',
    alertTone: 'warning',
  },
  availableFields: [
    { id: 'iop_od', label: 'Intraocular Pressure OD (mmHg)', valueType: 'quantity' },
    { id: 'family_hx_glaucoma', label: 'First-degree Family Hx of Glaucoma', valueType: 'boolean' },
    { id: 'current_drops', label: 'Current Antiglaucoma Drops', valueType: 'multiselect' },
    { id: 'vf_ordered', label: 'Visual Field 24-2 Ordered', valueType: 'boolean' },
  ],
  testValues: {
    iop_od: 25,
    family_hx_glaucoma: true,
    current_drops: 'latanoprost',
  },
};

const scoreModel: ScoreBuilderViewModel = {
  definition: {
    schemaVersion: '1.0',
    engineVersion: 3,
    instrumentId: 'osdi-6-short',
    title: 'Ocular Surface Disease Index (OSDI-6 Short Form)',
    description: 'Weighted patient-reported outcome (PRO) calculator for dry eye disease severity.',
    versionStamp: '2026.2',
    missingItemPolicy: 'prorate',
    items: [
      {
        id: 'item-photophobia',
        fieldId: 'osdi_light',
        label: 'Eyes that are sensitive to light',
        weight: 1,
        required: true,
        optionPoints: { none: 0, some: 1, half: 2, most: 3, all: 4 },
      },
      {
        id: 'item-gritty',
        fieldId: 'osdi_gritty',
        label: 'Eyes that feel gritty',
        weight: 1,
        required: true,
        optionPoints: { none: 0, some: 1, half: 2, most: 3, all: 4 },
      },
      {
        id: 'item-reading',
        fieldId: 'osdi_reading',
        label: 'Blurred vision while reading or driving at night',
        weight: 1.5,
        required: false,
        optionPoints: { none: 0, some: 1, half: 2, most: 3, all: 4 },
      },
    ],
    bands: [
      {
        id: 'band-normal',
        minScore: 0,
        maxScore: 3.99,
        label: 'Normal ocular surface',
        tone: 'success',
        clinicalGuidance: 'Reassure and continue routine environmental hygiene.',
      },
      {
        id: 'band-moderate',
        minScore: 4,
        maxScore: 8.99,
        label: 'Moderate dry eye disease',
        tone: 'warning',
        clinicalGuidance: 'Initiate preservative-free carboxymethylcellulose tears QID.',
      },
      {
        id: 'band-severe',
        minScore: 9,
        maxScore: 20,
        label: 'Severe dry eye disease',
        tone: 'danger',
        clinicalGuidance: 'Consider topical cyclosporine 0.05% BD and punctal plug evaluation.',
      },
    ],
  },
  sampleAnswers: {
    osdi_light: 'most',
    osdi_gritty: 'half',
    osdi_reading: 'some',
  },
};

const fhirMapperModel: FhirQuestionnaireMapperViewModel = {
  fhirVersion: 'R4',
  schema: {
    id: 'glaucoma-intake-form',
    label: 'Glaucoma Baseline Intake Questionnaire',
    description: 'Bi-directional FHIR R4 / R5 Questionnaire mapping studio.',
    sections: [
      {
        id: 'sec-tonometry',
        label: 'Tonometry & Pachymetry',
        blocks: [
          {
            kind: 'field',
            id: 'iop-od',
            label: 'Goldmann Applanation IOP (OD)',
            type: 'quantity',
            required: true,
            unit: 'mm[Hg]',
          },
          {
            kind: 'field',
            id: 'gonioscopy-grade',
            label: 'Shaffer Gonioscopy Grade',
            type: 'select',
            required: true,
          },
        ],
      },
    ],
  },
  questionnaire: {
    resourceType: 'Questionnaire',
    id: 'glaucoma-intake-form',
    url: 'urn:emr:questionnaire:glaucoma-intake-form',
    version: '1.0.0',
    title: 'Glaucoma Baseline Intake Questionnaire',
    status: 'active',
    fhirVersion: '4.0.1',
    item: [
      {
        linkId: 'sec-tonometry',
        type: 'group',
        text: 'Tonometry & Pachymetry',
        item: [
          {
            linkId: 'iop-od',
            type: 'quantity',
            text: 'Goldmann Applanation IOP (OD)',
            required: true,
            code: [{ system: 'http://loinc.org', code: '79893-4', display: 'Intraocular pressure of Right eye' }],
            extension: [
              {
                url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit',
                valueCoding: { system: 'http://unitsofmeasure.org', code: 'mm[Hg]', display: 'mmHg' },
              },
            ],
          },
          {
            linkId: 'gonioscopy-grade',
            type: 'choice',
            text: 'Shaffer Gonioscopy Grade',
            required: true,
          },
        ],
      },
    ],
  },
  rows: [
    {
      linkId: 'iop-od',
      sectionId: 'sec-tonometry',
      label: 'Goldmann Applanation IOP (OD)',
      emrValueType: 'quantity',
      fhirItemType: 'quantity',
      required: true,
      repeats: false,
      terminologyCodes: [{ system: 'http://loinc.org', code: '79893-4', display: 'Intraocular pressure of Right eye' }],
      ucumUnit: { system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
      enableWhenCount: 0,
      hasInitialValue: true,
      warnings: [],
    },
    {
      linkId: 'gonioscopy-grade',
      sectionId: 'sec-tonometry',
      label: 'Shaffer Gonioscopy Grade',
      emrValueType: 'select',
      fhirItemType: 'choice',
      required: true,
      repeats: false,
      terminologyCodes: [{ system: 'http://snomed.info/sct', code: '410455004', display: 'Gonioscopy finding' }],
      enableWhenCount: 1,
      hasInitialValue: false,
      warnings: [],
    },
  ],
  diagnostics: [
    {
      severity: 'info',
      code: 'validation-sdc-extension',
      linkId: 'iop-od',
      message: 'Numeric range [0..80 mmHg] requires FHIR SDC minValue/maxValue extensions.',
    },
  ],
  selectedLinkId: 'iop-od',
};

const meta: Meta = {
  title: 'EMR / Authoring / Visual Builders',
  decorators: [
    moduleMetadata({
      imports: [
        EmrLogicRuleBuilderComponent,
        EmrScoreBuilderComponent,
        EmrFhirQuestionnaireMapperComponent,
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'L6 Visual Authoring Builders: EmrLogicRuleBuilder (ConditionNode tree + sandbox), EmrScoreBuilder (weighted PRO & calculator studio), and EmrFhirQuestionnaireMapper (bi-directional FHIR R4/R5 Questionnaire studio).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const LogicRuleBuilderTrue: Story = {
  render: () => ({
    template: `<emr-logic-rule-builder [model]="model" (intent)="onIntent($event)" />`,
    props: {
      model: logicModel,
      onIntent: (intent: unknown) => console.info('logic-rule-builder intent', intent),
    },
  }),
};

export const LogicRuleBuilderIndeterminate: Story = {
  render: () => ({
    template: `<emr-logic-rule-builder [model]="model" (intent)="onIntent($event)" />`,
    props: {
      model: {
        ...logicModel,
        testValues: { iop_od: 25 },
      },
      onIntent: (intent: unknown) => console.info('logic-rule-builder intent', intent),
    },
  }),
};

export const ScoreBuilderWeightedOsdi: Story = {
  render: () => ({
    template: `<emr-score-builder [model]="model" (intent)="onIntent($event)" />`,
    props: {
      model: scoreModel,
      onIntent: (intent: unknown) => console.info('score-builder intent', intent),
    },
  }),
};

export const FhirQuestionnaireMapperR4: Story = {
  render: () => ({
    template: `<emr-fhir-questionnaire-mapper [model]="model" (intent)="onIntent($event)" />`,
    props: {
      model: fhirMapperModel,
      onIntent: (intent: unknown) => console.info('fhir-questionnaire-mapper intent', intent),
    },
  }),
};

export const FhirQuestionnaireMapperR5: Story = {
  render: () => ({
    template: `<emr-fhir-questionnaire-mapper [model]="model" (intent)="onIntent($event)" />`,
    props: {
      model: {
        ...fhirMapperModel,
        fhirVersion: 'R5' as const,
        questionnaire: {
          ...fhirMapperModel.questionnaire,
          fhirVersion: '5.0.0' as const,
        },
        rows: fhirMapperModel.rows.map(r =>
          r.fhirItemType === 'choice' ? { ...r, fhirItemType: 'coding' as const } : r,
        ),
      },
      onIntent: (intent: unknown) => console.info('fhir-questionnaire-mapper intent', intent),
    },
  }),
};
