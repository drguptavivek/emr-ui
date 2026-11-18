import type { ClinicalMatrixSchema, ClinicalOption, ClinicalRow } from '../../models.js';
import type { ClinicalProScoringBand } from './models.js';
import { STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS } from './models.js';

export const DAS28_BINARY_JOINT_OPTIONS: readonly ClinicalOption[] = [
  { value: '0', label: '0 — Absent (Not tender / Not swollen)' },
  { value: '1', label: '1 — Present (Tender / Swollen)' },
];

const PAIRED_JOINT_COLUMNS = [
  'right_tender',
  'right_swollen',
  'left_tender',
  'left_swollen',
] as const;

function pairedJointRow(id: string, label: string, helpText: string): ClinicalRow {
  return {
    id,
    label,
    type: 'select',
    applicableColumnIds: PAIRED_JOINT_COLUMNS,
    options: DAS28_BINARY_JOINT_OPTIONS,
    assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
    helpText,
  };
}

export const DAS28_JOINT_MATRIX_SCHEMA: ClinicalMatrixSchema = {
  id: 'rheum-das28-joint-matrix',
  label: 'Rheumatology — 28-Joint DAS28 Examination & Acute-Phase Matrix',
  columnGroups: [
    {
      id: 'right_joint_assessment',
      label: 'Right Side (14 Joints)',
      columnIds: ['right_tender', 'right_swollen'],
    },
    {
      id: 'left_joint_assessment',
      label: 'Left Side (14 Joints)',
      columnIds: ['left_tender', 'left_swollen'],
    },
    {
      id: 'das28_inputs',
      label: 'DAS28 Calculation Inputs',
      columnIds: ['das28_parameter'],
    },
  ],
  columns: [
    { id: 'right_tender', label: 'Right Tender (0/1)', shortLabel: 'R Tender' },
    { id: 'right_swollen', label: 'Right Swollen (0/1)', shortLabel: 'R Swollen' },
    { id: 'left_tender', label: 'Left Tender (0/1)', shortLabel: 'L Tender' },
    { id: 'left_swollen', label: 'Left Swollen (0/1)', shortLabel: 'L Swollen' },
    { id: 'das28_parameter', label: 'DAS28 Parameter / Value', shortLabel: 'Value' },
  ],
  rows: [
    // 14 paired joints = 28 joints total
    pairedJointRow('joint_shoulder', 'Shoulder (Glenohumeral)', 'Palpate anterior joint line and assess passive/active motion tenderness and effusion'),
    pairedJointRow('joint_elbow', 'Elbow (Humeroulnar / Radiocapitellar)', 'Inspect and palpate para-olecranon grooves for synovitis and tenderness'),
    pairedJointRow('joint_wrist', 'Wrist (Radiocarpal / Ulnocarpal)', 'Bimanual palpation over dorsal wrist joint line'),
    pairedJointRow('joint_mcp_1', 'MCP 1 (Thumb Metacarpophalangeal)', 'First metacarpophalangeal joint'),
    pairedJointRow('joint_mcp_2', 'MCP 2 (Index Metacarpophalangeal)', 'Second metacarpophalangeal joint'),
    pairedJointRow('joint_mcp_3', 'MCP 3 (Middle Metacarpophalangeal)', 'Third metacarpophalangeal joint'),
    pairedJointRow('joint_mcp_4', 'MCP 4 (Ring Metacarpophalangeal)', 'Fourth metacarpophalangeal joint'),
    pairedJointRow('joint_mcp_5', 'MCP 5 (Little Metacarpophalangeal)', 'Fifth metacarpophalangeal joint'),
    pairedJointRow('joint_pip_1', 'Thumb IP / PIP 1 (Interphalangeal)', 'Thumb interphalangeal joint (counted in the 28-joint set)'),
    pairedJointRow('joint_pip_2', 'PIP 2 (Index Proximal Interphalangeal)', 'Second proximal interphalangeal joint'),
    pairedJointRow('joint_pip_3', 'PIP 3 (Middle Proximal Interphalangeal)', 'Third proximal interphalangeal joint'),
    pairedJointRow('joint_pip_4', 'PIP 4 (Ring Proximal Interphalangeal)', 'Fourth proximal interphalangeal joint'),
    pairedJointRow('joint_pip_5', 'PIP 5 (Little Proximal Interphalangeal)', 'Fifth proximal interphalangeal joint'),
    pairedJointRow('joint_knee', 'Knee (Tibiofemoral / Suprapatellar Pouch)', 'Assess suprapatellar pouch bulge/ballottement and joint line tenderness'),

    // DAS28 Acute-Phase & Patient Global VAS Inputs
    {
      id: 'das28_tjc28_total',
      label: 'Total Tender Joint Count (TJC28, 0–28)',
      type: 'integer',
      applicableColumnIds: ['das28_parameter'],
      unit: 'joints',
      assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
      helpText: 'Sum of right and left tender joints across the 28-joint set (0–28)',
    },
    {
      id: 'das28_sjc28_total',
      label: 'Total Swollen Joint Count (SJC28, 0–28)',
      type: 'integer',
      applicableColumnIds: ['das28_parameter'],
      unit: 'joints',
      assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
      helpText: 'Sum of right and left swollen joints across the 28-joint set (0–28)',
    },
    {
      id: 'das28_esr_mm_hr',
      label: 'Erythrocyte Sedimentation Rate (ESR)',
      type: 'decimal',
      applicableColumnIds: ['das28_parameter'],
      unit: 'mm/hr',
      precision: 0,
      assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
      helpText: 'Westergren ESR (mm/hr) for DAS28-ESR = 0.56*sqrt(TJC28) + 0.28*sqrt(SJC28) + 0.70*ln(ESR) + 0.014*GH',
    },
    {
      id: 'das28_crp_mg_l',
      label: 'C-Reactive Protein (CRP)',
      type: 'decimal',
      applicableColumnIds: ['das28_parameter'],
      unit: 'mg/L',
      precision: 1,
      assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
      helpText: 'Serum CRP (mg/L) for DAS28-CRP = 0.56*sqrt(TJC28) + 0.28*sqrt(SJC28) + 0.36*ln(CRP+1) + 0.014*GH + 0.96',
    },
    {
      id: 'das28_patient_global_vas_mm',
      label: 'Patient Global Assessment of Disease Activity (VAS 0–100 mm)',
      type: 'integer',
      applicableColumnIds: ['das28_parameter'],
      unit: 'mm',
      assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
      helpText: 'Patient Global Health (GH) visual analogue scale from 0 mm (best imaginable) to 100 mm (worst imaginable)',
    },
  ],
};

export const DAS28_DISEASE_ACTIVITY_BANDS: readonly ClinicalProScoringBand[] = [
  {
    id: 'remission',
    min: 0,
    max: 2.59,
    label: 'Clinical Remission (DAS28 < 2.6)',
    tone: 'success',
    clinicalAction: 'Maintain current DMARD regimen; consider cautious tapering if sustained remission.',
  },
  {
    id: 'low-activity',
    min: 2.6,
    max: 3.2,
    label: 'Low Disease Activity (2.6 <= DAS28 <= 3.2)',
    tone: 'info',
    clinicalAction: 'Monitor closely; optimize conventional synthetic DMARD therapy per EULAR treat-to-target.',
  },
  {
    id: 'moderate-activity',
    min: 3.21,
    max: 5.1,
    label: 'Moderate Disease Activity (3.2 < DAS28 <= 5.1)',
    tone: 'warning',
    clinicalAction: 'Escalate DMARD therapy or add targeted biologic/JAKi if inadequate response.',
  },
  {
    id: 'high-activity',
    min: 5.11,
    max: 10,
    label: 'High Disease Activity (DAS28 > 5.1)',
    tone: 'danger',
    clinicalAction: 'Active uncontrolled synovitis; urgent DMARD/biologic escalation and bridging therapy.',
  },
];

export const RHEUMATOLOGY_MATRIX_SCHEMAS: readonly ClinicalMatrixSchema[] = [
  DAS28_JOINT_MATRIX_SCHEMA,
];
