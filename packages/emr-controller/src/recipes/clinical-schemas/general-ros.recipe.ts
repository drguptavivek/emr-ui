import type { ClinicalFieldDefinition, ClinicalFormSchema } from '../../clinical-form.models.js';
import type { EmrFormLogic } from '../../form-logic.js';
import type { ClinicalOption } from '../../models.js';
import { STANDARD_ASSESSMENT_STATUS_OPTIONS } from './models.js';

export const ROS_FINDING_OPTIONS: readonly ClinicalOption[] = [
  { value: 'negative', label: 'Negative (Absent)' },
  { value: 'positive', label: 'Positive (Present)' },
  { value: 'unable-to-assess', label: 'Unable to assess' },
];

function rosSymptomField(
  id: string,
  label: string,
  hint?: string,
): ClinicalFieldDefinition {
  return {
    kind: 'field',
    id,
    label,
    type: 'select',
    widget: 'segmented',
    span: 6,
    ...(hint ? { hint } : {}),
    options: ROS_FINDING_OPTIONS,
    assessmentStatusOptions: STANDARD_ASSESSMENT_STATUS_OPTIONS,
  };
}

function rosRedFlagFollowUpField(
  id: string,
  label: string,
  placeholder: string,
): ClinicalFieldDefinition {
  return {
    kind: 'field',
    id,
    label,
    type: 'multiline',
    widget: 'textarea',
    span: 12,
    rows: 2,
    placeholder,
    hint: 'Conditional red-flag follow-up block: required when any red-flag symptom in this system is positive.',
    assessmentStatusOptions: STANDARD_ASSESSMENT_STATUS_OPTIONS,
  };
}

export const GENERAL_ROS_FORM_SCHEMA: ClinicalFormSchema = {
  id: 'general-ros-12-system',
  label: 'General Review of Systems (12-System Structured ROS)',
  description:
    'Comprehensive 12-system structured review of systems with positive/negative/unable-to-assess capture and red-flag conditional follow-up blocks.',
  sections: [
    {
      id: 'ros-constitutional',
      label: '1. Constitutional',
      description: 'Systemic symptoms including fever, night sweats, fatigue, and unintentional weight loss.',
      collapsible: true,
      blocks: [
        rosSymptomField('ros_const_fever', 'Fever / Rigors', 'Red flag if persistent or neutropenic'),
        rosSymptomField('ros_const_weight_loss', 'Unintentional Weight Loss (>5% in 6 months)', 'Red flag for occult malignancy or chronic infection'),
        rosSymptomField('ros_const_night_sweats', 'Drenching Night Sweats', 'Red flag for B-symptoms / tuberculosis'),
        rosSymptomField('ros_const_fatigue', 'Generalized Fatigue / Malaise'),
        rosRedFlagFollowUpField(
          'ros_const_red_flag_notes',
          'Constitutional Red-Flag Follow-Up Details',
          'Document Tmax, weight loss trajectory (kg over weeks), rigor onset, and infectious/oncological red-flag context...',
        ),
      ],
    },
    {
      id: 'ros-ophthalmic',
      label: '2. Ophthalmic',
      description: 'Visual acuity changes, ocular pain, photophobia, diplopia, and floaters/flashes.',
      collapsible: true,
      blocks: [
        rosSymptomField('ros_ophth_vision_loss', 'Acute Vision Loss / Curtain Across Vision', 'Red flag for retinal detachment, CRAO, or giant cell arteritis'),
        rosSymptomField('ros_ophth_eye_pain', 'Severe Ocular Pain / Photophobia', 'Red flag for acute angle-closure glaucoma, keratitis, or uveitis'),
        rosSymptomField('ros_ophth_diplopia', 'Binocular Diplopia'),
        rosSymptomField('ros_ophth_redness_discharge', 'Ocular Redness / Discharge / Dryness'),
        rosRedFlagFollowUpField(
          'ros_ophth_red_flag_notes',
          'Ophthalmic Red-Flag Follow-Up Details',
          'Document laterality (OD/OS/OU), onset speed, pain with extraocular movement, contact lens wear, and urgent ophthalmic referral...',
        ),
      ],
    },
    {
      id: 'ros-ent',
      label: '3. Ear, Nose & Throat (ENT)',
      description: 'Otalgia, hearing loss, epistaxis, dysphagia, odynophagia, and hoarseness.',
      collapsible: true,
      blocks: [
        rosSymptomField('ros_ent_stridor_airway', 'Stridor / Muffled Voice / Drooling', 'Red flag for impending upper airway obstruction or epiglottitis'),
        rosSymptomField('ros_ent_dysphagia', 'Progressive Dysphagia / Odynophagia', 'Red flag for pharyngeal/oesophageal obstruction'),
        rosSymptomField('ros_ent_hearing_tinnitus', 'Hearing Loss / Vertigo / Tinnitus'),
        rosSymptomField('ros_ent_epistaxis_rhinorrhoea', 'Epistaxis / Sinus Congestion / Sore Throat'),
        rosRedFlagFollowUpField(
          'ros_ent_red_flag_notes',
          'ENT Red-Flag Follow-Up Details',
          'Document airway patency, solids vs liquids dysphagia, duration of hoarseness (>3 weeks), and neck mass findings...',
        ),
      ],
    },
    {
      id: 'ros-cardiovascular',
      label: '4. Cardiovascular',
      description: 'Chest pain, palpitations, orthopnoea, paroxysmal nocturnal dyspnoea, syncope, and oedema.',
      collapsible: true,
      blocks: [
        rosSymptomField('ros_cv_chest_pain', 'Exertional or Rest Chest Pain / Pressure', 'Red flag for acute coronary syndrome or aortic dissection'),
        rosSymptomField('ros_cv_syncope', 'Exertional Syncope / Pre-Syncope', 'Red flag for arrhythmia or outflow tract obstruction'),
        rosSymptomField('ros_cv_orthopnoea_pnd', 'Orthopnoea / Paroxysmal Nocturnal Dyspnoea'),
        rosSymptomField('ros_cv_palpitations_oedema', 'Palpitations / Peripheral Ankle Oedema'),
        rosRedFlagFollowUpField(
          'ros_cv_red_flag_notes',
          'Cardiovascular Red-Flag Follow-Up Details',
          'Document radiation (jaw/left arm/back), autonomic symptoms, ECG/troponin status, and haemodynamic stability...',
        ),
      ],
    },
    {
      id: 'ros-respiratory',
      label: '5. Respiratory',
      description: 'Dyspnoea, cough, sputum production, haemoptysis, wheeze, and pleuritic chest pain.',
      collapsible: true,
      blocks: [
        rosSymptomField('ros_resp_haemoptysis', 'Haemoptysis', 'Red flag for pulmonary embolism, malignancy, or tuberculosis'),
        rosSymptomField('ros_resp_acute_dyspnoea', 'Acute or Resting Dyspnoea / Pleuritic Pain', 'Red flag for pneumothorax or pulmonary embolism'),
        rosSymptomField('ros_resp_cough_sputum', 'Productive or Chronic Cough'),
        rosSymptomField('ros_resp_wheeze', 'Exertional Wheeze / Nocturnal Cough'),
        rosRedFlagFollowUpField(
          'ros_resp_red_flag_notes',
          'Respiratory Red-Flag Follow-Up Details',
          'Document estimated blood volume, SpO2 on room air, Wells score risk factors, and respiratory rate...',
        ),
      ],
    },
    {
      id: 'ros-gastrointestinal',
      label: '6. Gastrointestinal (GI)',
      description: 'Abdominal pain, nausea/vomiting, haematemesis, melaena, haematochezia, and bowel habit change.',
      collapsible: true,
      blocks: [
        rosSymptomField('ros_gi_bleeding', 'Haematemesis / Melaena / Fresh Rectal Bleeding', 'Red flag for upper or lower GI haemorrhage'),
        rosSymptomField('ros_gi_severe_abdo_pain', 'Acute Severe Abdominal Pain / Jaundice', 'Red flag for peritonitis, ischaemia, or biliary obstruction'),
        rosSymptomField('ros_gi_nausea_vomiting', 'Nausea / Vomiting / Early Satiety'),
        rosSymptomField('ros_gi_bowel_habit', 'Diarrhoea / Constipation / Change in Calibre'),
        rosRedFlagFollowUpField(
          'ros_gi_red_flag_notes',
          'Gastrointestinal Red-Flag Follow-Up Details',
          'Document stool character, coffee-ground emesis, guarding/rigidity, and last oral intake...',
        ),
      ],
    },
    {
      id: 'ros-genitourinary',
      label: '7. Genitourinary (GU)',
      description: 'Dysuria, haematuria, urinary retention, flank pain, incontinence, and pelvic/reproductive symptoms.',
      collapsible: true,
      blocks: [
        rosSymptomField('ros_gu_haematuria_retention', 'Visible Haematuria / Acute Urinary Retention / Anuria', 'Red flag for urological malignancy, obstructive nephropathy, or cauda equina'),
        rosSymptomField('ros_gu_flank_testicular_pain', 'Severe Flank Colic / Acute Scrotal or Pelvic Pain', 'Red flag for testicular/ovarian torsion or obstructed infected kidney'),
        rosSymptomField('ros_gu_dysuria_frequency', 'Dysuria / Frequency / Urgency'),
        rosSymptomField('ros_gu_incontinence_discharge', 'Incontinence / Vaginal or Urethral Discharge'),
        rosRedFlagFollowUpField(
          'ros_gu_red_flag_notes',
          'Genitourinary Red-Flag Follow-Up Details',
          'Document bladder scan volume, clot passage, pregnancy status/LMP if applicable, and renal angle tenderness...',
        ),
      ],
    },
    {
      id: 'ros-musculoskeletal',
      label: '8. Musculoskeletal',
      description: 'Arthralgia, acute hot swollen joint, back pain, morning stiffness, and myalgia.',
      collapsible: true,
      blocks: [
        rosSymptomField('ros_msk_septic_cauda', 'Acute Hot Monoarthritis / Back Pain with Saddle Anaesthesia', 'Red flag for septic arthritis or cauda equina syndrome'),
        rosSymptomField('ros_msk_inflammatory_stiffness', 'Early Morning Stiffness (>30 min) / Polyarticular Swelling'),
        rosSymptomField('ros_msk_arthralgia_myalgia', 'Mechanical Joint Pain / Myalgia'),
        rosSymptomField('ros_msk_gait_falls', 'Gait Instability / Recurrent Mechanical Falls'),
        rosRedFlagFollowUpField(
          'ros_msk_red_flag_notes',
          'Musculoskeletal Red-Flag Follow-Up Details',
          'Document affected joint(s), range-of-motion restriction, sphincter disturbance, and neurovascular status...',
        ),
      ],
    },
    {
      id: 'ros-dermatological',
      label: '9. Dermatological',
      description: 'Rashes, purpura, mucosal involvement, pruritus, skin ulcers, and pigmented lesions.',
      collapsible: true,
      blocks: [
        rosSymptomField('ros_derm_blistering_purpura', 'Non-Blanching Purpura / Mucosal Desquamation / Rapidly Spreading Cellulitis', 'Red flag for meningococcaemia, SJS/TEN, or necrotizing fasciitis'),
        rosSymptomField('ros_derm_changing_lesion', 'Evolving Pigmented Lesion (ABCDE) / Non-Healing Ulcer'),
        rosSymptomField('ros_derm_rash_pruritus', 'Maculopapular Rash / Urticaria / Pruritus'),
        rosSymptomField('ros_derm_nail_hair', 'Alopecia / Nail Pitting / Skin Dryness'),
        rosRedFlagFollowUpField(
          'ros_derm_red_flag_notes',
          'Dermatological Red-Flag Follow-Up Details',
          'Document Nikolsky sign, mucosal sites (ocular/oral/genital), drug exposure timeline, and lesion demarcation...',
        ),
      ],
    },
    {
      id: 'ros-neurological',
      label: '10. Neurological',
      description: 'Headache, focal weakness, paraesthesia, seizures, dysarthria, and cognitive change.',
      collapsible: true,
      blocks: [
        rosSymptomField('ros_neuro_focal_deficit', 'Focal Limb Weakness / Facial Droop / Aphasia / Thunderclap Headache', 'Red flag for acute stroke, SAH, or space-occupying lesion'),
        rosSymptomField('ros_neuro_seizure_consciousness', 'New-Onset Seizure / Altered Consciousness / Meningism', 'Red flag for status epilepticus or CNS infection'),
        rosSymptomField('ros_neuro_sensory_paraesthesia', 'Numbness / Paraesthesia / Neuropathic Pain'),
        rosSymptomField('ros_neuro_tremor_memory', 'Tremor / Dizziness / Memory Impairment'),
        rosRedFlagFollowUpField(
          'ros_neuro_red_flag_notes',
          'Neurological Red-Flag Follow-Up Details',
          'Document last-known-well time, NIHSS/FAST features, neck stiffness/photophobia, and post-ictal state...',
        ),
      ],
    },
    {
      id: 'ros-psychiatric',
      label: '11. Psychiatric',
      description: 'Mood, anxiety, sleep quality, psychosis, delirium, and self-harm screening.',
      collapsible: true,
      blocks: [
        rosSymptomField('ros_psych_suicidal_ideation', 'Suicidal Ideation / Self-Harm Intent / Acute Psychosis', 'Red flag requiring immediate 1:1 safety observation and psychiatric review'),
        rosSymptomField('ros_psych_delirium_agitation', 'Acute Confusion / Delirium / Hallucinations'),
        rosSymptomField('ros_psych_low_mood_anhedonia', 'Depressed Mood / Anhedonia'),
        rosSymptomField('ros_psych_anxiety_insomnia', 'Generalized Anxiety / Panic Attacks / Insomnia'),
        rosRedFlagFollowUpField(
          'ros_psych_red_flag_notes',
          'Psychiatric Red-Flag Follow-Up Details',
          'Document intent/plan, access to means, capacity assessment, collateral history, and immediate safety level...',
        ),
      ],
    },
    {
      id: 'ros-endocrine-haematological',
      label: '12. Endocrine & Haematological',
      description: 'Polydipsia/polyuria, heat/cold intolerance, abnormal bleeding/bruising, and lymphadenopathy.',
      collapsible: true,
      blocks: [
        rosSymptomField('ros_endo_bleeding_lymph', 'Unexplained Spontaneous Bleeding / Petechiae / Firm Lymphadenopathy', 'Red flag for coagulopathy, acute leukaemia, or lymphoma'),
        rosSymptomField('ros_endo_dka_adrenal', 'Severe Polydipsia & Polyuria / Postural Hypotension & Vomiting', 'Red flag for DKA/HHS or adrenal crisis'),
        rosSymptomField('ros_endo_thyroid_temp', 'Heat or Cold Intolerance / Tremor / Neck Goitre'),
        rosSymptomField('ros_endo_easy_bruising_anaemia', 'Easy Bruising / Exertional Pallor'),
        rosRedFlagFollowUpField(
          'ros_endo_red_flag_notes',
          'Endocrine & Haematological Red-Flag Follow-Up Details',
          'Document capillary blood glucose/ketones, lymph node distribution, anticoagulant use, and endocrine history...',
        ),
      ],
    },
  ],
};

function positiveAnyCondition(fieldIds: readonly string[]) {
  return {
    any: fieldIds.map(path => ({
      op: '=' as const,
      left: { path },
      right: { value: 'positive' },
    })),
  };
}

/**
 * Companion OpenRosa/EmrFormLogic definition that makes each system's
 * red-flag follow-up note relevant and required whenever a red-flag item in
 * that system is marked `'positive'`.
 */
export const GENERAL_ROS_FORM_LOGIC: EmrFormLogic = {
  fields: {
    ros_const_fever: {},
    ros_const_weight_loss: {},
    ros_const_night_sweats: {},
    ros_const_fatigue: {},
    ros_const_red_flag_notes: {
      relevant: positiveAnyCondition(['ros_const_fever', 'ros_const_weight_loss', 'ros_const_night_sweats']),
      requiredCondition: positiveAnyCondition(['ros_const_fever', 'ros_const_weight_loss', 'ros_const_night_sweats']),
    },
    ros_ophth_vision_loss: {},
    ros_ophth_eye_pain: {},
    ros_ophth_diplopia: {},
    ros_ophth_redness_discharge: {},
    ros_ophth_red_flag_notes: {
      relevant: positiveAnyCondition(['ros_ophth_vision_loss', 'ros_ophth_eye_pain']),
      requiredCondition: positiveAnyCondition(['ros_ophth_vision_loss', 'ros_ophth_eye_pain']),
    },
    ros_ent_stridor_airway: {},
    ros_ent_dysphagia: {},
    ros_ent_hearing_tinnitus: {},
    ros_ent_epistaxis_rhinorrhoea: {},
    ros_ent_red_flag_notes: {
      relevant: positiveAnyCondition(['ros_ent_stridor_airway', 'ros_ent_dysphagia']),
      requiredCondition: positiveAnyCondition(['ros_ent_stridor_airway', 'ros_ent_dysphagia']),
    },
    ros_cv_chest_pain: {},
    ros_cv_syncope: {},
    ros_cv_orthopnoea_pnd: {},
    ros_cv_palpitations_oedema: {},
    ros_cv_red_flag_notes: {
      relevant: positiveAnyCondition(['ros_cv_chest_pain', 'ros_cv_syncope']),
      requiredCondition: positiveAnyCondition(['ros_cv_chest_pain', 'ros_cv_syncope']),
    },
    ros_resp_haemoptysis: {},
    ros_resp_acute_dyspnoea: {},
    ros_resp_cough_sputum: {},
    ros_resp_wheeze: {},
    ros_resp_red_flag_notes: {
      relevant: positiveAnyCondition(['ros_resp_haemoptysis', 'ros_resp_acute_dyspnoea']),
      requiredCondition: positiveAnyCondition(['ros_resp_haemoptysis', 'ros_resp_acute_dyspnoea']),
    },
    ros_gi_bleeding: {},
    ros_gi_severe_abdo_pain: {},
    ros_gi_nausea_vomiting: {},
    ros_gi_bowel_habit: {},
    ros_gi_red_flag_notes: {
      relevant: positiveAnyCondition(['ros_gi_bleeding', 'ros_gi_severe_abdo_pain']),
      requiredCondition: positiveAnyCondition(['ros_gi_bleeding', 'ros_gi_severe_abdo_pain']),
    },
    ros_gu_haematuria_retention: {},
    ros_gu_flank_testicular_pain: {},
    ros_gu_dysuria_frequency: {},
    ros_gu_incontinence_discharge: {},
    ros_gu_red_flag_notes: {
      relevant: positiveAnyCondition(['ros_gu_haematuria_retention', 'ros_gu_flank_testicular_pain']),
      requiredCondition: positiveAnyCondition(['ros_gu_haematuria_retention', 'ros_gu_flank_testicular_pain']),
    },
    ros_msk_septic_cauda: {},
    ros_msk_inflammatory_stiffness: {},
    ros_msk_arthralgia_myalgia: {},
    ros_msk_gait_falls: {},
    ros_msk_red_flag_notes: {
      relevant: positiveAnyCondition(['ros_msk_septic_cauda']),
      requiredCondition: positiveAnyCondition(['ros_msk_septic_cauda']),
    },
    ros_derm_blistering_purpura: {},
    ros_derm_changing_lesion: {},
    ros_derm_rash_pruritus: {},
    ros_derm_nail_hair: {},
    ros_derm_red_flag_notes: {
      relevant: positiveAnyCondition(['ros_derm_blistering_purpura', 'ros_derm_changing_lesion']),
      requiredCondition: positiveAnyCondition(['ros_derm_blistering_purpura', 'ros_derm_changing_lesion']),
    },
    ros_neuro_focal_deficit: {},
    ros_neuro_seizure_consciousness: {},
    ros_neuro_sensory_paraesthesia: {},
    ros_neuro_tremor_memory: {},
    ros_neuro_red_flag_notes: {
      relevant: positiveAnyCondition(['ros_neuro_focal_deficit', 'ros_neuro_seizure_consciousness']),
      requiredCondition: positiveAnyCondition(['ros_neuro_focal_deficit', 'ros_neuro_seizure_consciousness']),
    },
    ros_psych_suicidal_ideation: {},
    ros_psych_delirium_agitation: {},
    ros_psych_low_mood_anhedonia: {},
    ros_psych_anxiety_insomnia: {},
    ros_psych_red_flag_notes: {
      relevant: positiveAnyCondition(['ros_psych_suicidal_ideation', 'ros_psych_delirium_agitation']),
      requiredCondition: positiveAnyCondition(['ros_psych_suicidal_ideation', 'ros_psych_delirium_agitation']),
    },
    ros_endo_bleeding_lymph: {},
    ros_endo_dka_adrenal: {},
    ros_endo_thyroid_temp: {},
    ros_endo_easy_bruising_anaemia: {},
    ros_endo_red_flag_notes: {
      relevant: positiveAnyCondition(['ros_endo_bleeding_lymph', 'ros_endo_dka_adrenal']),
      requiredCondition: positiveAnyCondition(['ros_endo_bleeding_lymph', 'ros_endo_dka_adrenal']),
    },
  },
  computed: [],
};
