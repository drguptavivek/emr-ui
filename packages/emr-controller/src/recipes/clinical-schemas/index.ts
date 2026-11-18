import type { ClinicalFormSchema } from '../../clinical-form.models.js';
import type { ClinicalMatrixSchema } from '../../models.js';
import type { OrderSetRecipe } from './models.js';
import {
  ADULT_ADMISSION_FORM_SCHEMA,
  PAEDIATRIC_ADMISSION_FORM_SCHEMA,
} from './admission.recipes.js';
import { BURN_LUND_BROWDER_MATRIX_SCHEMA } from './burn.recipes.js';
import { GENERAL_ROS_FORM_SCHEMA } from './general-ros.recipe.js';
import {
  DERMATOME_SENSORY_MATRIX_SCHEMA,
  MRC_LIMB_POWER_MATRIX_SCHEMA,
} from './neurology.recipes.js';
import {
  CLINICAL_ORDER_SET_RECIPES,
  POST_CATARACT_ORDER_SET_RECIPE,
  SEPSIS_SIX_ORDER_SET_RECIPE,
} from './order-sets.recipes.js';
import {
  CLINICAL_PRO_SCHEMAS,
  GAD7_PRO_FORM_SCHEMA,
  OSDI_PRO_FORM_SCHEMA,
  PHQ9_PRO_FORM_SCHEMA,
  VF14_PRO_FORM_SCHEMA,
} from './pro-questionnaires.recipes.js';
import { DAS28_JOINT_MATRIX_SCHEMA } from './rheumatology.recipes.js';

export * from './models.js';
export * from './general-ros.recipe.js';
export * from './admission.recipes.js';
export * from './neurology.recipes.js';
export * from './rheumatology.recipes.js';
export * from './burn.recipes.js';
export * from './pro-questionnaires.recipes.js';
export * from './order-sets.recipes.js';

/**
 * Aggregate L5 Clinical Form Schema Packs (General ROS, Adult & Paediatric Admissions,
 * and Validated PRO Questionnaires).
 */
export const CLINICAL_FORM_SCHEMA_PACKS: readonly ClinicalFormSchema[] = [
  GENERAL_ROS_FORM_SCHEMA,
  ADULT_ADMISSION_FORM_SCHEMA,
  PAEDIATRIC_ADMISSION_FORM_SCHEMA,
  PHQ9_PRO_FORM_SCHEMA,
  GAD7_PRO_FORM_SCHEMA,
  OSDI_PRO_FORM_SCHEMA,
  VF14_PRO_FORM_SCHEMA,
];

/**
 * Aggregate L5 Clinical Matrix Schema Packs (Neurology MRC 4-Limb Power & Dermatomes,
 * Rheumatology 28-Joint DAS28, and Burn Lund-Browder TBSA%).
 */
export const CLINICAL_MATRIX_SCHEMA_PACKS: readonly ClinicalMatrixSchema[] = [
  MRC_LIMB_POWER_MATRIX_SCHEMA,
  DERMATOME_SENSORY_MATRIX_SCHEMA,
  DAS28_JOINT_MATRIX_SCHEMA,
  BURN_LUND_BROWDER_MATRIX_SCHEMA,
];

/**
 * Aggregate Validated PRO Questionnaire Schema Packs (PHQ-9, GAD-7, OSDI, VF-14).
 */
export const CLINICAL_PRO_SCHEMA_PACKS: readonly ClinicalFormSchema[] =
  CLINICAL_PRO_SCHEMAS;

/**
 * Aggregate Clinical Order Set Recipe Packs (Post-Cataract Phaco/IOL & Sepsis Six).
 */
export const CLINICAL_ORDER_SET_PACKS: readonly OrderSetRecipe[] =
  CLINICAL_ORDER_SET_RECIPES;
