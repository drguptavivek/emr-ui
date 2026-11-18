import type { ClinicalMatrixSchema, ClinicalRow } from '../../models.js';
import { STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS } from './models.js';

const LUND_BROWDER_REGION_COLUMNS = [
  'age_adjusted_max_pct',
  'superficial_dermal_pct',
  'deep_dermal_pct',
  'full_thickness_pct',
  'region_total_tbsa_pct',
] as const;

function lundBrowderRegionRow(
  id: string,
  label: string,
  helpText: string,
): ClinicalRow {
  return {
    id,
    label,
    type: 'decimal',
    applicableColumnIds: LUND_BROWDER_REGION_COLUMNS,
    unit: '%',
    precision: 1,
    assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
    helpText,
  };
}

export const BURN_LUND_BROWDER_MATRIX_SCHEMA: ClinicalMatrixSchema = {
  id: 'burn-lund-browder-matrix',
  label: 'Burn — Lund-Browder Age-Adjusted TBSA% & Parkland Resuscitation Matrix',
  columnGroups: [
    {
      id: 'burn_depth_tbsa',
      label: 'Lund-Browder Regional Burn Depth Breakdown (% TBSA, Exclude Simple Erythema)',
      columnIds: [
        'age_adjusted_max_pct',
        'superficial_dermal_pct',
        'deep_dermal_pct',
        'full_thickness_pct',
        'region_total_tbsa_pct',
      ],
    },
    {
      id: 'resuscitation_summary',
      label: 'Total TBSA% & Parkland Fluid Resuscitation',
      columnIds: ['parkland_parameter'],
    },
  ],
  columns: [
    {
      id: 'age_adjusted_max_pct',
      label: 'Age-Adjusted Region Max %',
      shortLabel: 'Max %',
    },
    {
      id: 'superficial_dermal_pct',
      label: 'Superficial Dermal %',
      shortLabel: 'Sup Dermal %',
    },
    {
      id: 'deep_dermal_pct',
      label: 'Deep Dermal %',
      shortLabel: 'Deep Dermal %',
    },
    {
      id: 'full_thickness_pct',
      label: 'Full Thickness %',
      shortLabel: 'Full Thick %',
    },
    {
      id: 'region_total_tbsa_pct',
      label: 'Region Total Burn %',
      shortLabel: 'Region %',
    },
    {
      id: 'parkland_parameter',
      label: 'Parkland Resuscitation Value',
      shortLabel: 'Value',
    },
  ],
  rows: [
    // 12 Anatomical Regions per Lund-Browder Chart
    lundBrowderRegionRow(
      'lb_head',
      'Head (Anterior + Posterior Craniofacial)',
      'Age-adjusted BSA% reference (Region A): <1 yr = 19%, 1 yr = 17%, 5 yr = 13%, 10 yr = 11%, 15 yr = 9%, Adult = 7%',
    ),
    lundBrowderRegionRow(
      'lb_neck',
      'Neck (Anterior + Posterior Cervical)',
      'Age-adjusted BSA% reference: 2% across all age groups (1% anterior, 1% posterior)',
    ),
    lundBrowderRegionRow(
      'lb_anterior_trunk',
      'Anterior Trunk (Chest & Abdomen)',
      'Age-adjusted BSA% reference: 13% across all age groups',
    ),
    lundBrowderRegionRow(
      'lb_posterior_trunk',
      'Posterior Trunk (Upper & Lower Back, excluding Buttocks)',
      'Age-adjusted BSA% reference: 13% across all age groups',
    ),
    lundBrowderRegionRow(
      'lb_buttocks',
      'Buttocks (Bilateral Left + Right Gluteal)',
      'Age-adjusted BSA% reference: 5% total across all age groups (2.5% left buttock, 2.5% right buttock)',
    ),
    lundBrowderRegionRow(
      'lb_genitalia',
      'Genitalia & Perineum',
      'Age-adjusted BSA% reference: 1% across all age groups',
    ),
    lundBrowderRegionRow(
      'lb_upper_arms',
      'Upper Arms (Bilateral Left + Right Arm)',
      'Age-adjusted BSA% reference: 8% total across all age groups (4% right upper arm, 4% left upper arm)',
    ),
    lundBrowderRegionRow(
      'lb_forearms',
      'Forearms (Bilateral Left + Right Forearm)',
      'Age-adjusted BSA% reference: 6% total across all age groups (3% right forearm, 3% left forearm)',
    ),
    lundBrowderRegionRow(
      'lb_hands',
      'Hands (Bilateral Palmar + Dorsal Surfaces)',
      'Age-adjusted BSA% reference: 5% total across all age groups (2.5% right hand, 2.5% left hand)',
    ),
    lundBrowderRegionRow(
      'lb_thighs',
      'Thighs (Bilateral Left + Right Thigh)',
      'Age-adjusted BSA% reference (Both thighs, 2x Region B): <1 yr = 11%, 1 yr = 13%, 5 yr = 16%, 10 yr = 17%, 15 yr = 18%, Adult = 19%',
    ),
    lundBrowderRegionRow(
      'lb_legs',
      'Legs (Bilateral Left + Right Lower Leg)',
      'Age-adjusted BSA% reference (Both lower legs, 2x Region C): <1 yr = 10%, 1 yr = 10%, 5 yr = 11%, 10 yr = 12%, 15 yr = 13%, Adult = 14%',
    ),
    lundBrowderRegionRow(
      'lb_feet',
      'Feet (Bilateral Dorsal + Plantar Surfaces)',
      'Age-adjusted BSA% reference: 7% total across all age groups (3.5% right foot, 3.5% left foot)',
    ),

    // Total TBSA% & Parkland Formula Rows
    {
      id: 'burn_total_tbsa_pct',
      label: 'Total Burn Surface Area (% TBSA — Partial + Full Thickness, Excluding Erythema)',
      type: 'decimal',
      applicableColumnIds: ['parkland_parameter'],
      unit: '%',
      precision: 1,
      assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
      helpText: 'Sum of superficial dermal, deep dermal, and full thickness % across all 12 anatomical regions (Formal IV resuscitation at >=15% adult, >=10% paediatric)',
    },
    {
      id: 'burn_patient_weight_kg',
      label: 'Patient Dosing Weight for Resuscitation',
      type: 'decimal',
      applicableColumnIds: ['parkland_parameter'],
      unit: 'kg',
      precision: 1,
      assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
      helpText: 'Measured or estimated body weight in kg for Parkland formula calculation',
    },
    {
      id: 'burn_parkland_24h_crystalloid_ml',
      label: 'Parkland 24-Hour Total Crystalloid Volume (4 mL x kg x %TBSA)',
      type: 'integer',
      applicableColumnIds: ['parkland_parameter'],
      unit: 'mL',
      assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
      helpText: 'Warm Hartmanns / Ringers Lactate total 24-hour volume calculated from time of burn injury (3–4 mL x weight kg x %TBSA)',
    },
    {
      id: 'burn_parkland_first_8h_ml',
      label: 'First 8 Hours Volume from Time of Burn (50% of 24-Hour Total)',
      type: 'integer',
      applicableColumnIds: ['parkland_parameter'],
      unit: 'mL',
      assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
      helpText: 'Deliver 50% of total Parkland volume over the first 8 hours from time of injury (subtract pre-hospital IV fluids already infused)',
    },
    {
      id: 'burn_parkland_next_16h_ml',
      label: 'Subsequent 16 Hours Volume (Remaining 50% of 24-Hour Total)',
      type: 'integer',
      applicableColumnIds: ['parkland_parameter'],
      unit: 'mL',
      assessmentStatusOptions: STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS,
      helpText: 'Deliver remaining 50% over the next 16 hours; titrate rate to urine output target (0.5–1.0 mL/kg/hr in adults, 1.0–1.5 mL/kg/hr in children <30 kg)',
    },
  ],
};

export const BURN_MATRIX_SCHEMAS: readonly ClinicalMatrixSchema[] = [
  BURN_LUND_BROWDER_MATRIX_SCHEMA,
];
