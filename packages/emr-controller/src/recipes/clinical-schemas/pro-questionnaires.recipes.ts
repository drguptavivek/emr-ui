import type { ClinicalFieldDefinition, ClinicalFormSchema } from '../../clinical-form.models.js';
import type { ClinicalOption } from '../../models.js';
import type { ClinicalProScoringRecipe } from './models.js';
import { STANDARD_ASSESSMENT_STATUS_OPTIONS } from './models.js';

export const PHQ9_GAD7_LIKERT_OPTIONS: readonly ClinicalOption[] = [
  { value: '0', label: '0 — Not at all' },
  { value: '1', label: '1 — Several days' },
  { value: '2', label: '2 — More than half the days' },
  { value: '3', label: '3 — Nearly every day' },
];

export const FUNCTIONAL_IMPAIRMENT_OPTIONS: readonly ClinicalOption[] = [
  { value: 'not-difficult', label: 'Not difficult at all' },
  { value: 'somewhat-difficult', label: 'Somewhat difficult' },
  { value: 'very-difficult', label: 'Very difficult' },
  { value: 'extremely-difficult', label: 'Extremely difficult' },
];

export const OSDI_SYMPTOM_LIKERT_OPTIONS: readonly ClinicalOption[] = [
  { value: '0', label: '0 — None of the time' },
  { value: '1', label: '1 — Some of the time' },
  { value: '2', label: '2 — Half of the time' },
  { value: '3', label: '3 — Most of the time' },
  { value: '4', label: '4 — All of the time' },
];

export const OSDI_FUNCTION_ENV_LIKERT_OPTIONS: readonly ClinicalOption[] = [
  ...OSDI_SYMPTOM_LIKERT_OPTIONS,
  { value: 'na', label: 'N/A — Not applicable / Did not perform' },
];

export const VF14_LIKERT_OPTIONS: readonly ClinicalOption[] = [
  { value: '4', label: '4 — No difficulty' },
  { value: '3', label: '3 — A little difficulty' },
  { value: '2', label: '2 — A moderate amount of difficulty' },
  { value: '1', label: '1 — A great deal of difficulty' },
  { value: '0', label: '0 — Unable to do the activity because of vision' },
  { value: 'na', label: 'N/A — Do not do this activity for reasons unrelated to vision' },
];

function likertField(
  id: string,
  label: string,
  options: readonly ClinicalOption[],
  hint?: string,
): ClinicalFieldDefinition {
  return {
    kind: 'field',
    id,
    label,
    type: 'select',
    widget: 'likert',
    span: 12,
    required: true,
    ...(hint ? { hint } : {}),
    options,
    assessmentStatusOptions: STANDARD_ASSESSMENT_STATUS_OPTIONS,
  };
}

export const PHQ9_PRO_FORM_SCHEMA: ClinicalFormSchema = {
  id: 'pro-phq-9',
  label: 'PHQ-9 — Patient Health Questionnaire (9-Item Depression Scale)',
  description:
    'Over the last 2 weeks, how often have you been bothered by any of the following problems? (0–27 total score).',
  sections: [
    {
      id: 'phq9-items',
      label: 'PHQ-9 Core Depression Items (0–3 Likert Scale)',
      description: 'Rate each symptom over the past 14 days from 0 (Not at all) to 3 (Nearly every day).',
      collapsible: false,
      blocks: [
        likertField('phq9_item_1', '1. Little interest or pleasure in doing things', PHQ9_GAD7_LIKERT_OPTIONS),
        likertField('phq9_item_2', '2. Feeling down, depressed, or hopeless', PHQ9_GAD7_LIKERT_OPTIONS),
        likertField(
          'phq9_item_3',
          '3. Trouble falling or staying asleep, or sleeping too much',
          PHQ9_GAD7_LIKERT_OPTIONS,
        ),
        likertField('phq9_item_4', '4. Feeling tired or having little energy', PHQ9_GAD7_LIKERT_OPTIONS),
        likertField('phq9_item_5', '5. Poor appetite or overeating', PHQ9_GAD7_LIKERT_OPTIONS),
        likertField(
          'phq9_item_6',
          '6. Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
          PHQ9_GAD7_LIKERT_OPTIONS,
        ),
        likertField(
          'phq9_item_7',
          '7. Trouble concentrating on things, such as reading the newspaper or watching television',
          PHQ9_GAD7_LIKERT_OPTIONS,
        ),
        likertField(
          'phq9_item_8',
          '8. Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
          PHQ9_GAD7_LIKERT_OPTIONS,
        ),
        likertField(
          'phq9_item_9',
          '9. Thoughts that you would be better off dead, or of hurting yourself in some way',
          PHQ9_GAD7_LIKERT_OPTIONS,
          'Critical safety item: any score >= 1 requires immediate suicide risk assessment.',
        ),
      ],
    },
    {
      id: 'phq9-functional-impact',
      label: 'Functional Difficulty Assessment',
      collapsible: true,
      blocks: [
        {
          kind: 'field',
          id: 'phq9_functional_difficulty',
          label:
            'If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?',
          type: 'select',
          widget: 'radio',
          span: 12,
          options: FUNCTIONAL_IMPAIRMENT_OPTIONS,
          assessmentStatusOptions: STANDARD_ASSESSMENT_STATUS_OPTIONS,
        },
      ],
    },
  ],
};

export const GAD7_PRO_FORM_SCHEMA: ClinicalFormSchema = {
  id: 'pro-gad-7',
  label: 'GAD-7 — Generalized Anxiety Disorder 7-Item Scale',
  description:
    'Over the last 2 weeks, how often have you been bothered by the following problems? (0–21 total score).',
  sections: [
    {
      id: 'gad7-items',
      label: 'GAD-7 Core Anxiety Items (0–3 Likert Scale)',
      description: 'Rate each symptom over the past 14 days from 0 (Not at all) to 3 (Nearly every day).',
      collapsible: false,
      blocks: [
        likertField('gad7_item_1', '1. Feeling nervous, anxious, or on edge', PHQ9_GAD7_LIKERT_OPTIONS),
        likertField('gad7_item_2', '2. Not being able to stop or control worrying', PHQ9_GAD7_LIKERT_OPTIONS),
        likertField('gad7_item_3', '3. Worrying too much about different things', PHQ9_GAD7_LIKERT_OPTIONS),
        likertField('gad7_item_4', '4. Trouble relaxing', PHQ9_GAD7_LIKERT_OPTIONS),
        likertField('gad7_item_5', '5. Being so restless that it is hard to sit still', PHQ9_GAD7_LIKERT_OPTIONS),
        likertField('gad7_item_6', '6. Becoming easily annoyed or irritable', PHQ9_GAD7_LIKERT_OPTIONS),
        likertField(
          'gad7_item_7',
          '7. Feeling afraid, as if something awful might happen',
          PHQ9_GAD7_LIKERT_OPTIONS,
        ),
      ],
    },
    {
      id: 'gad7-functional-impact',
      label: 'Functional Difficulty Assessment',
      collapsible: true,
      blocks: [
        {
          kind: 'field',
          id: 'gad7_functional_difficulty',
          label:
            'If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?',
          type: 'select',
          widget: 'radio',
          span: 12,
          options: FUNCTIONAL_IMPAIRMENT_OPTIONS,
          assessmentStatusOptions: STANDARD_ASSESSMENT_STATUS_OPTIONS,
        },
      ],
    },
  ],
};

export const OSDI_PRO_FORM_SCHEMA: ClinicalFormSchema = {
  id: 'pro-osdi-12',
  label: 'OSDI — Ocular Surface Disease Index (12-Item Dry Eye Questionnaire)',
  description:
    'Validated 12-item dry eye questionnaire assessing ocular symptoms, vision-related function, and environmental triggers over the past week (0–100 composite scale).',
  sections: [
    {
      id: 'osdi-subscale-symptoms',
      label: 'Part A: Ocular Symptoms (Have you experienced any of the following during the last week?)',
      description: 'Scored 0 (None of the time) to 4 (All of the time).',
      collapsible: false,
      blocks: [
        likertField('osdi_item_1', '1. Eyes that are sensitive to light?', OSDI_SYMPTOM_LIKERT_OPTIONS),
        likertField('osdi_item_2', '2. Eyes that feel gritty?', OSDI_SYMPTOM_LIKERT_OPTIONS),
        likertField('osdi_item_3', '3. Painful or sore eyes?', OSDI_SYMPTOM_LIKERT_OPTIONS),
        likertField('osdi_item_4', '4. Blurred vision?', OSDI_SYMPTOM_LIKERT_OPTIONS),
        likertField('osdi_item_5', '5. Poor vision?', OSDI_SYMPTOM_LIKERT_OPTIONS),
      ],
    },
    {
      id: 'osdi-subscale-function',
      label: 'Part B: Vision-Related Function (Have problems with your eyes limited you in performing any of the following during the last week?)',
      description: 'Scored 0 (None of the time) to 4 (All of the time), or N/A if activity was not performed.',
      collapsible: false,
      blocks: [
        likertField('osdi_item_6', '6. Reading?', OSDI_FUNCTION_ENV_LIKERT_OPTIONS),
        likertField('osdi_item_7', '7. Driving at night?', OSDI_FUNCTION_ENV_LIKERT_OPTIONS),
        likertField(
          'osdi_item_8',
          '8. Working with a computer or bank machine (ATM)?',
          OSDI_FUNCTION_ENV_LIKERT_OPTIONS,
        ),
        likertField('osdi_item_9', '9. Watching TV?', OSDI_FUNCTION_ENV_LIKERT_OPTIONS),
      ],
    },
    {
      id: 'osdi-subscale-environment',
      label: 'Part C: Environmental Triggers (Have your eyes felt uncomfortable in any of the following situations during the last week?)',
      description: 'Scored 0 (None of the time) to 4 (All of the time), or N/A if not exposed.',
      collapsible: false,
      blocks: [
        likertField('osdi_item_10', '10. Windy conditions?', OSDI_FUNCTION_ENV_LIKERT_OPTIONS),
        likertField(
          'osdi_item_11',
          '11. Places or areas with low humidity (very dry)?',
          OSDI_FUNCTION_ENV_LIKERT_OPTIONS,
        ),
        likertField('osdi_item_12', '12. Areas that are air conditioned?', OSDI_FUNCTION_ENV_LIKERT_OPTIONS),
      ],
    },
  ],
};

export const VF14_PRO_FORM_SCHEMA: ClinicalFormSchema = {
  id: 'pro-vf-14',
  label: 'VF-14 — Visual Function Index (14-Item Cataract & Ophthalmic Functional Questionnaire)',
  description:
    'Validated 14-item questionnaire measuring functional visual impairment across daily activities, even with spectacles (0–100 composite scale where 100 = no disability).',
  sections: [
    {
      id: 'vf14-reading-near',
      label: 'Near Vision & Fine Visual Tasks',
      description: 'How much difficulty do you have, even with glasses, doing the following activities?',
      collapsible: false,
      blocks: [
        likertField(
          'vf14_item_1',
          '1. Reading small print, such as labels on medicine bottles, a telephone book, or food labels',
          VF14_LIKERT_OPTIONS,
        ),
        likertField('vf14_item_2', '2. Reading a newspaper or a book', VF14_LIKERT_OPTIONS),
        likertField(
          'vf14_item_3',
          '3. Reading a large-print book or large-print newspaper or numbers on a telephone',
          VF14_LIKERT_OPTIONS,
        ),
        likertField(
          'vf14_item_7',
          '7. Doing fine handwork like sewing, knitting, crocheting, or carpentry',
          VF14_LIKERT_OPTIONS,
        ),
        likertField('vf14_item_8', '8. Writing checks or filling out forms', VF14_LIKERT_OPTIONS),
      ],
    },
    {
      id: 'vf14-mobility-social-recreation',
      label: 'Distance Recognition, Mobility, Domestic & Recreational Activities',
      collapsible: false,
      blocks: [
        likertField('vf14_item_4', '4. Recognizing people when they are close to you', VF14_LIKERT_OPTIONS),
        likertField('vf14_item_5', '5. Seeing steps, stairs, or curbs', VF14_LIKERT_OPTIONS),
        likertField(
          'vf14_item_6',
          '6. Reading traffic signs, street signs, or store signs',
          VF14_LIKERT_OPTIONS,
        ),
        likertField(
          'vf14_item_9',
          '9. Playing games such as bingo, dominos, card games, or mahjong',
          VF14_LIKERT_OPTIONS,
        ),
        likertField(
          'vf14_item_10',
          '10. Taking part in sports like bowling, handball, tennis, or golf',
          VF14_LIKERT_OPTIONS,
        ),
        likertField('vf14_item_11', '11. Cooking', VF14_LIKERT_OPTIONS),
        likertField('vf14_item_12', '12. Watching television', VF14_LIKERT_OPTIONS),
      ],
    },
    {
      id: 'vf14-driving',
      label: 'Daytime & Nighttime Driving',
      collapsible: false,
      blocks: [
        likertField('vf14_item_13', '13. Daytime driving', VF14_LIKERT_OPTIONS),
        likertField('vf14_item_14', '14. Nighttime driving', VF14_LIKERT_OPTIONS),
      ],
    },
  ],
};

export const PHQ9_SCORING_RECIPE: ClinicalProScoringRecipe = {
  instrumentId: 'phq-9',
  formSchemaId: PHQ9_PRO_FORM_SCHEMA.id,
  label: 'Patient Health Questionnaire-9 (PHQ-9)',
  shortName: 'PHQ-9',
  itemIds: [
    'phq9_item_1',
    'phq9_item_2',
    'phq9_item_3',
    'phq9_item_4',
    'phq9_item_5',
    'phq9_item_6',
    'phq9_item_7',
    'phq9_item_8',
    'phq9_item_9',
  ],
  minScore: 0,
  maxScore: 27,
  formulaDescription: 'Sum of items 1–9 (each scored 0 to 3); range 0–27.',
  bands: [
    {
      id: 'minimal',
      min: 0,
      max: 4,
      label: 'Minimal or no depression',
      tone: 'success',
      clinicalAction: 'Supportive care; re-screen as clinically indicated.',
    },
    {
      id: 'mild',
      min: 5,
      max: 9,
      label: 'Mild depression',
      tone: 'info',
      clinicalAction: 'Watchful waiting, psychoeducation, and repeat PHQ-9 at follow-up.',
    },
    {
      id: 'moderate',
      min: 10,
      max: 14,
      label: 'Moderate depression',
      tone: 'warning',
      clinicalAction: 'Treatment plan: structured psychotherapy (CBT) and/or pharmacotherapy.',
    },
    {
      id: 'moderately-severe',
      min: 15,
      max: 19,
      label: 'Moderately severe depression',
      tone: 'warning',
      clinicalAction: 'Active treatment with pharmacotherapy and/or psychotherapy.',
    },
    {
      id: 'severe',
      min: 20,
      max: 27,
      label: 'Severe depression',
      tone: 'danger',
      clinicalAction: 'Immediate initiation of pharmacotherapy and expedited mental health specialist referral.',
    },
  ],
};

export const GAD7_SCORING_RECIPE: ClinicalProScoringRecipe = {
  instrumentId: 'gad-7',
  formSchemaId: GAD7_PRO_FORM_SCHEMA.id,
  label: 'Generalized Anxiety Disorder-7 (GAD-7)',
  shortName: 'GAD-7',
  itemIds: [
    'gad7_item_1',
    'gad7_item_2',
    'gad7_item_3',
    'gad7_item_4',
    'gad7_item_5',
    'gad7_item_6',
    'gad7_item_7',
  ],
  minScore: 0,
  maxScore: 21,
  formulaDescription: 'Sum of items 1–7 (each scored 0 to 3); range 0–21.',
  bands: [
    {
      id: 'minimal',
      min: 0,
      max: 4,
      label: 'Minimal anxiety',
      tone: 'success',
      clinicalAction: 'No active intervention required; routine monitoring.',
    },
    {
      id: 'mild',
      min: 5,
      max: 9,
      label: 'Mild anxiety',
      tone: 'info',
      clinicalAction: 'Self-help resources, sleep/stress hygiene, and follow-up re-assessment.',
    },
    {
      id: 'moderate',
      min: 10,
      max: 14,
      label: 'Moderate anxiety',
      tone: 'warning',
      clinicalAction: 'Clinically significant anxiety; consider CBT and/or SSRI/SNRI therapy.',
    },
    {
      id: 'severe',
      min: 15,
      max: 21,
      label: 'Severe anxiety',
      tone: 'danger',
      clinicalAction: 'Active combined psychological and pharmacological intervention.',
    },
  ],
};

export const OSDI_SCORING_RECIPE: ClinicalProScoringRecipe = {
  instrumentId: 'osdi-12',
  formSchemaId: OSDI_PRO_FORM_SCHEMA.id,
  label: 'Ocular Surface Disease Index (OSDI)',
  shortName: 'OSDI',
  itemIds: [
    'osdi_item_1',
    'osdi_item_2',
    'osdi_item_3',
    'osdi_item_4',
    'osdi_item_5',
    'osdi_item_6',
    'osdi_item_7',
    'osdi_item_8',
    'osdi_item_9',
    'osdi_item_10',
    'osdi_item_11',
    'osdi_item_12',
  ],
  minScore: 0,
  maxScore: 100,
  formulaDescription: 'OSDI = (Sum of scores for all questions answered * 25) / Total number of questions answered (excluding N/A); range 0–100.',
  bands: [
    {
      id: 'normal',
      min: 0,
      max: 12,
      label: 'Normal ocular surface (0–12)',
      tone: 'success',
      clinicalAction: 'No dry eye disease; routine ocular hygiene.',
    },
    {
      id: 'mild',
      min: 13,
      max: 22,
      label: 'Mild dry eye disease (13–22)',
      tone: 'info',
      clinicalAction: 'Preservative-free ocular lubricants, blink/screen education, and lid hygiene.',
    },
    {
      id: 'moderate',
      min: 23,
      max: 32,
      label: 'Moderate dry eye disease (23–32)',
      tone: 'warning',
      clinicalAction: 'TFOS DEWS II Step 2: unpreserved tear substitutes, lipid/gel formulations, MGD therapy, or topical immunomodulator.',
    },
    {
      id: 'severe',
      min: 33,
      max: 100,
      label: 'Severe dry eye disease (33–100)',
      tone: 'danger',
      clinicalAction: 'TFOS DEWS II Step 3–4: ciclosporin/lifitegrast, punctal occlusion, autologous serum drops, or scleral lenses.',
    },
  ],
};

export const VF14_SCORING_RECIPE: ClinicalProScoringRecipe = {
  instrumentId: 'vf-14',
  formSchemaId: VF14_PRO_FORM_SCHEMA.id,
  label: 'Visual Function Index (VF-14)',
  shortName: 'VF-14',
  itemIds: [
    'vf14_item_1',
    'vf14_item_2',
    'vf14_item_3',
    'vf14_item_4',
    'vf14_item_5',
    'vf14_item_6',
    'vf14_item_7',
    'vf14_item_8',
    'vf14_item_9',
    'vf14_item_10',
    'vf14_item_11',
    'vf14_item_12',
    'vf14_item_13',
    'vf14_item_14',
  ],
  minScore: 0,
  maxScore: 100,
  formulaDescription: 'VF-14 = (Mean of all applicable answered items scored 0–4) * 25; range 0 (unable to perform any applicable activities) to 100 (no visual disability).',
  bands: [
    {
      id: 'severe-impairment',
      min: 0,
      max: 24,
      label: 'Severe visual functional impairment (0–24)',
      tone: 'danger',
      clinicalAction: 'High priority for surgical intervention (e.g. cataract extraction) and low-vision rehabilitation.',
    },
    {
      id: 'marked-impairment',
      min: 25,
      max: 49,
      label: 'Marked visual functional impairment (25–49)',
      tone: 'warning',
      clinicalAction: 'Significant daily visual disability; surgical or refractive rehabilitation indicated.',
    },
    {
      id: 'moderate-impairment',
      min: 50,
      max: 74,
      label: 'Moderate visual functional impairment (50–74)',
      tone: 'warning',
      clinicalAction: 'Correlate functional impairment with BCVA/cataract grade to guide shared surgical decision-making.',
    },
    {
      id: 'mild-impairment',
      min: 75,
      max: 89,
      label: 'Mild visual functional impairment (75–89)',
      tone: 'info',
      clinicalAction: 'Optimize refraction/lighting; consider surgery if specific high-priority tasks (e.g. night driving) are impaired.',
    },
    {
      id: 'no-impairment',
      min: 90,
      max: 100,
      label: 'Minimal or no visual functional impairment (90–100)',
      tone: 'success',
      clinicalAction: 'Good functional vision; routine ophthalmic monitoring.',
    },
  ],
};

export const CLINICAL_PRO_SCHEMAS: readonly ClinicalFormSchema[] = [
  PHQ9_PRO_FORM_SCHEMA,
  GAD7_PRO_FORM_SCHEMA,
  OSDI_PRO_FORM_SCHEMA,
  VF14_PRO_FORM_SCHEMA,
];

export const CLINICAL_PRO_SCORING_RECIPES: readonly ClinicalProScoringRecipe[] = [
  PHQ9_SCORING_RECIPE,
  GAD7_SCORING_RECIPE,
  OSDI_SCORING_RECIPE,
  VF14_SCORING_RECIPE,
];
