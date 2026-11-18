import type { ClinicalMatrixSchema, ClinicalOption, ClinicalRow } from '../../models.js';
import { STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS } from './models.js';

export const MRC_POWER_GRADE_OPTIONS: readonly ClinicalOption[] = [
  { value: '5', label: '5/5 — Normal power against full resistance' },
  { value: '4+', label: '4+/5 — Active movement against strong resistance' },
  { value: '4', label: '4/5 — Active movement against moderate resistance' },
  { value: '4-', label: '4-/5 — Active movement against slight resistance' },
  { value: '3', label: '3/5 — Active movement against gravity only' },
  { value: '2', label: '2/5 — Active movement with gravity eliminated' },
  { value: '1', label: '1/5 — Flicker or trace of contraction' },
  { value: '0', label: '0/5 — No contraction (Paralysis)' },
];

export const DEEP_TENDON_REFLEX_OPTIONS: readonly ClinicalOption[] = [
  { value: '0', label: '0 — Absent' },
  { value: '+/-', label: '+/- — Present only with reinforcement (Jendrassik)' },
  { value: '1+', label: '1+ — Diminished / Hyporeflexic' },
  { value: '2+', label: '2+ — Normal / Brisk' },
  { value: '3+', label: '3+ — Very brisk / Hyperreflexic' },
  { value: '4+', label: '4+ — Hyperreflexic with sustained clonus' },
];

export const PLANTAR_RESPONSE_OPTIONS: readonly ClinicalOption[] = [
  { value: 'flexor', label: 'Flexor (Down-going — Normal)' },
  { value: 'extensor', label: 'Extensor (Up-going — Babinski Positive)' },
  { value: 'equivocal', label: 'Equivocal / Withdrawal' },
  { value: 'mute', label: 'Mute (No response)' },
];

function mrcRow(id: string, label: string, helpText: string): ClinicalRow {
  return {
    id,
    label,
    type: 'select',
    options: MRC_POWER_GRADE_OPTIONS,
    assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
    helpText,
  };
}

function reflexRow(id: string, label: string, helpText: string): ClinicalRow {
  return {
    id,
    label,
    type: 'select',
    options: DEEP_TENDON_REFLEX_OPTIONS,
    assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
    helpText,
  };
}

export const MRC_LIMB_POWER_MATRIX_SCHEMA: ClinicalMatrixSchema = {
  id: 'neuro-mrc-limb-power',
  label: 'Neurology — MRC 4-Limb Power, Deep Tendon Reflexes & Plantar Matrix',
  columnGroups: [
    {
      id: 'laterality',
      label: 'Paired Bilateral Motor & Reflex Examination',
      columnIds: ['right', 'left'],
    },
  ],
  columns: [
    { id: 'right', label: 'Right Side', shortLabel: 'Right' },
    { id: 'left', label: 'Left Side', shortLabel: 'Left' },
  ],
  rows: [
    // Upper Limb Myotomes (C5–T1)
    mrcRow('ul_c5_shoulder_abduction', 'C5 — Shoulder Abduction (Deltoid)', 'Axillary nerve (C5)'),
    mrcRow('ul_c5_c6_elbow_flexion', 'C5/C6 — Elbow Flexion (Biceps Brachii)', 'Musculocutaneous nerve (C5, C6)'),
    mrcRow('ul_c6_wrist_extension', 'C6 — Wrist Extension (ECRL / ECRB)', 'Radial nerve (C6)'),
    mrcRow('ul_c7_elbow_extension', 'C7 — Elbow Extension (Triceps Brachii)', 'Radial nerve (C7)'),
    mrcRow('ul_c7_finger_extension', 'C7 — Finger Extension (EDC)', 'Posterior interosseous nerve (C7)'),
    mrcRow('ul_c8_finger_flexion', 'C8 — Finger Flexion (FDP)', 'Median / Anterior interosseous & Ulnar nerves (C8)'),
    mrcRow('ul_t1_finger_abduction', 'T1 — Index Finger Abduction (FDI)', 'Deep branch of ulnar nerve (T1)'),

    // Lower Limb Myotomes (L2–S1)
    mrcRow('ll_l2_hip_flexion', 'L2 — Hip Flexion (Iliopsoas)', 'Lumbar plexus / Femoral nerve (L1, L2, L3)'),
    mrcRow('ll_l3_knee_extension', 'L3 — Knee Extension (Quadriceps Femoris)', 'Femoral nerve (L3, L4)'),
    mrcRow('ll_l4_ankle_dorsiflexion', 'L4 — Ankle Dorsiflexion (Tibialis Anterior)', 'Deep peroneal nerve (L4, L5)'),
    mrcRow('ll_l5_great_toe_extension', 'L5 — Great Toe Extension (Extensor Hallucis Longus)', 'Deep peroneal nerve (L5)'),
    mrcRow('ll_l5_s1_knee_flexion', 'L5/S1 — Knee Flexion (Hamstrings)', 'Sciatic nerve (L5, S1)'),
    mrcRow('ll_s1_ankle_plantarflexion', 'S1 — Ankle Plantarflexion (Gastrocnemius / Soleus)', 'Tibial nerve (S1, S2)'),

    // Deep Tendon Reflexes & Plantar Response
    reflexRow('reflex_biceps_c5_c6', 'Reflex — Biceps Jerk (C5/C6)', 'Musculocutaneous nerve root C5/C6'),
    reflexRow('reflex_supinator_c5_c6', 'Reflex — Supinator / Brachioradialis (C5/C6)', 'Radial nerve root C5/C6'),
    reflexRow('reflex_triceps_c7', 'Reflex — Triceps Jerk (C7)', 'Radial nerve root C7'),
    reflexRow('reflex_knee_l3_l4', 'Reflex — Patellar / Knee Jerk (L3/L4)', 'Femoral nerve root L3/L4'),
    reflexRow('reflex_ankle_s1', 'Reflex — Achilles / Ankle Jerk (S1)', 'Tibial nerve root S1'),
    {
      id: 'plantar_response',
      label: 'Plantar Response (Babinski Sign — L5/S1)',
      type: 'select',
      options: PLANTAR_RESPONSE_OPTIONS,
      assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
      helpText: 'Stroke lateral sole from heel to 5th metatarsal curving medially across metatarsal heads',
    },
  ],
};

export const DERMATOME_SENSORY_GRADE_OPTIONS: readonly ClinicalOption[] = [
  { value: '2', label: '2 — Normal / Intact' },
  { value: '1', label: '1 — Altered (Hypoaesthesia or Hyperaesthesia)' },
  { value: '0', label: '0 — Absent (Anaesthesia)' },
  { value: 'nt', label: 'NT — Not Testable' },
];

function dermatomeRow(id: string, label: string, helpText: string): ClinicalRow {
  return {
    id,
    label,
    type: 'select',
    options: DERMATOME_SENSORY_GRADE_OPTIONS,
    assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
    helpText,
  };
}

export const DERMATOME_SENSORY_MATRIX_SCHEMA: ClinicalMatrixSchema = {
  id: 'neuro-dermatome-sensory',
  label: 'Neurology — C2–S4 Dermatome Sensory Matrix (Light Touch & Pinprick)',
  columnGroups: [
    {
      id: 'right_sensory',
      label: 'Right Side Sensory Modalities',
      columnIds: ['right_light_touch', 'right_pinprick'],
    },
    {
      id: 'left_sensory',
      label: 'Left Side Sensory Modalities',
      columnIds: ['left_light_touch', 'left_pinprick'],
    },
  ],
  columns: [
    { id: 'right_light_touch', label: 'Right Light Touch', shortLabel: 'R LT' },
    { id: 'right_pinprick', label: 'Right Pinprick', shortLabel: 'R PP' },
    { id: 'left_light_touch', label: 'Left Light Touch', shortLabel: 'L LT' },
    { id: 'left_pinprick', label: 'Left Pinprick', shortLabel: 'L PP' },
  ],
  rows: [
    dermatomeRow('derm_c2', 'C2 — Occipital Protuberance', 'At least 1 cm lateral to external occipital protuberance'),
    dermatomeRow('derm_c3', 'C3 — Supraclavicular Fossa', 'Midclavicular line in supraclavicular fossa'),
    dermatomeRow('derm_c4', 'C4 — Acromioclavicular Joint', 'Over the acromioclavicular joint'),
    dermatomeRow('derm_c5', 'C5 — Lateral Antecubital Fossa', 'Lateral (radial) side of antecubital fossa'),
    dermatomeRow('derm_c6', 'C6 — Thumb (Dorsal Proximal Phalanx)', 'Dorsal surface of proximal phalanx of thumb'),
    dermatomeRow('derm_c7', 'C7 — Middle Finger (Dorsal Proximal Phalanx)', 'Dorsal surface of proximal phalanx of middle finger'),
    dermatomeRow('derm_c8', 'C8 — Little Finger (Dorsal Proximal Phalanx)', 'Dorsal surface of proximal phalanx of little finger'),
    dermatomeRow('derm_t1', 'T1 — Medial Antecubital Fossa', 'Medial (ulnar) side of antecubital fossa'),
    dermatomeRow('derm_t2', 'T2 — Apex of Axilla', 'Apex of axilla'),
    dermatomeRow('derm_t4', 'T4 — Fourth Intercostal Space (Nipple Line)', 'Midclavicular line at 4th intercostal space'),
    dermatomeRow('derm_t6', 'T6 — Xiphisternum (6th Intercostal Space)', 'Midclavicular line at level of xiphisternum'),
    dermatomeRow('derm_t10', 'T10 — Umbilicus (10th Intercostal Space)', 'Midclavicular line at level of umbilicus'),
    dermatomeRow('derm_t12', 'T12 — Inguinal Ligament Midpoint', 'Midpoint of inguinal ligament'),
    dermatomeRow('derm_l1', 'L1 — Infra-Inguinal Upper Anterior Thigh', 'Half the distance between T12 and L2 key points'),
    dermatomeRow('derm_l2', 'L2 — Mid-Anterior Thigh', 'On anterior medial thigh at midpoint between inguinal ligament and medial femoral condyle'),
    dermatomeRow('derm_l3', 'L3 — Medial Femoral Condyle', 'Medial femoral condyle above the knee'),
    dermatomeRow('derm_l4', 'L4 — Medial Malleolus', 'Over the medial malleolus'),
    dermatomeRow('derm_l5', 'L5 — Dorsum of Foot (3rd MTP Joint)', 'Dorsum of the foot at the third metatarsophalangeal joint'),
    dermatomeRow('derm_s1', 'S1 — Lateral Aspect of Calcaneus (Heel)', 'Lateral aspect of the heel'),
    dermatomeRow('derm_s2', 'S2 — Midline Popliteal Fossa', 'Midpoint of the popliteal fossa'),
    dermatomeRow('derm_s3', 'S3 — Ischial Tuberosity', 'Over the ischial tuberosity or infragluteal fold'),
    dermatomeRow('derm_s4', 'S4/S5 — Perianal Area (Mucocutaneous Junction)', 'Less than 1 cm lateral to mucocutaneous junction (Saddle sensation)'),
  ],
};

export const NEUROLOGY_MATRIX_SCHEMAS: readonly ClinicalMatrixSchema[] = [
  MRC_LIMB_POWER_MATRIX_SCHEMA,
  DERMATOME_SENSORY_MATRIX_SCHEMA,
];
