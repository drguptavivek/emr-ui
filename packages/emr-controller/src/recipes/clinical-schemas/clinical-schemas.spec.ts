import { describe, expect, it } from 'vitest';
import { ClinicalFormController } from '../../clinical-form.controller.js';
import { ClinicalMatrixController } from '../../clinical-matrix.controller.js';
import { resolveLogic } from '../../form-logic.js';
import { HierarchyOrderController, type OrderCatalogueRepository } from '../../order.controller.js';
import * as clinicalSchemasModule from './index.js';
import {
  ADULT_ADMISSION_FORM_SCHEMA,
  BURN_LUND_BROWDER_MATRIX_SCHEMA,
  CLINICAL_FORM_SCHEMA_PACKS,
  CLINICAL_MATRIX_SCHEMA_PACKS,
  CLINICAL_ORDER_SET_PACKS,
  CLINICAL_ORDER_SET_RECIPES,
  CLINICAL_PRO_SCHEMA_PACKS,
  CLINICAL_PRO_SCHEMAS,
  CLINICAL_PRO_SCORING_RECIPES,
  createInitialClinicalFormViewModel,
  createInitialClinicalMatrixValues,
  DAS28_JOINT_MATRIX_SCHEMA,
  DERMATOME_SENSORY_MATRIX_SCHEMA,
  GAD7_PRO_FORM_SCHEMA,
  GAD7_SCORING_RECIPE,
  GENERAL_ROS_FORM_LOGIC,
  GENERAL_ROS_FORM_SCHEMA,
  materializeOrderSetSelectedOrders,
  MRC_LIMB_POWER_MATRIX_SCHEMA,
  OSDI_PRO_FORM_SCHEMA,
  OSDI_SCORING_RECIPE,
  PAEDIATRIC_ADMISSION_FORM_SCHEMA,
  PHQ9_PRO_FORM_SCHEMA,
  PHQ9_SCORING_RECIPE,
  POST_CATARACT_ORDER_SET_RECIPE,
  SEPSIS_SIX_ORDER_SET_RECIPE,
  toOrderSetGroupPreview,
  toOrderSetHierarchyNode,
  VF14_PRO_FORM_SCHEMA,
  VF14_SCORING_RECIPE,
} from './index.js';

describe('L5 Clinical Schema Content Packs (emr-ejj.2)', () => {
  it('ensures every schema, scoring recipe, and order set is 100% JSON-serializable', () => {
    const allPayloads = [
      ...CLINICAL_FORM_SCHEMA_PACKS,
      ...CLINICAL_MATRIX_SCHEMA_PACKS,
      ...CLINICAL_PRO_SCHEMA_PACKS,
      ...CLINICAL_PRO_SCORING_RECIPES,
      ...CLINICAL_ORDER_SET_PACKS,
      GENERAL_ROS_FORM_LOGIC,
    ];

    for (const payload of allPayloads) {
      const roundTripped = JSON.parse(JSON.stringify(payload));
      expect(roundTripped).toEqual(payload);
    }
  });

  it('has zero runtime UI framework imports across all clinical-schemas files', async () => {
    // @ts-expect-error node built-in module in test runner
    const fs = (await import('node:fs')) as {
      readdirSync(path: string): string[];
      readFileSync(path: string, encoding: string): string;
    };
    // @ts-expect-error node built-in module in test runner
    const url = (await import('node:url')) as {
      fileURLToPath(u: string): string;
    };
    const currentFile = url.fileURLToPath(import.meta.url);
    const currentDir = currentFile.slice(0, currentFile.lastIndexOf('/'));
    const files = fs
      .readdirSync(currentDir)
      .filter((file: string) => file.endsWith('.ts') && !file.endsWith('.spec.ts'));
    expect(files.length).toBeGreaterThanOrEqual(8);

    const forbiddenPatterns = [
      /@angular\//,
      /from ['"]react['"]/,
      /from ['"]react-dom['"]/,
      /from ['"]lit['"]/,
      /from ['"]vue['"]/,
    ];

    for (const file of files) {
      const content = fs.readFileSync(`${currentDir}/${file}`, 'utf8');
      for (const pattern of forbiddenPatterns) {
        expect(content, `${file} must not match ${pattern}`).not.toMatch(pattern);
      }
    }

    for (const [exportName, exportedVal] of Object.entries(clinicalSchemasModule)) {
      if (typeof exportedVal === 'function') continue;
      expect(JSON.stringify(exportedVal), `${exportName} must be serializable`).toBeDefined();
    }
  });

  describe('General Review of Systems (12-System ROS)', () => {
    it('defines all 12 clinical systems with positive/negative/unable-to-assess items and red-flag follow-ups', () => {
      expect(GENERAL_ROS_FORM_SCHEMA.sections).toHaveLength(12);
      const sectionIds = GENERAL_ROS_FORM_SCHEMA.sections.map(s => s.id);
      expect(sectionIds).toEqual([
        'ros-constitutional',
        'ros-ophthalmic',
        'ros-ent',
        'ros-cardiovascular',
        'ros-respiratory',
        'ros-gastrointestinal',
        'ros-genitourinary',
        'ros-musculoskeletal',
        'ros-dermatological',
        'ros-neurological',
        'ros-psychiatric',
        'ros-endocrine-haematological',
      ]);

      const vm = createInitialClinicalFormViewModel(GENERAL_ROS_FORM_SCHEMA);
      const controller = new ClinicalFormController(vm);

      controller.dispatch({
        type: 'fieldEditRequested',
        fieldId: 'ros_cv_chest_pain',
        value: 'positive',
      });
      controller.dispatch({
        type: 'fieldStatusEditRequested',
        fieldId: 'ros_neuro_tremor_memory',
        status: 'unable-to-assess',
      });
      controller.dispatch({
        type: 'sectionToggleRequested',
        sectionId: 'ros-cardiovascular',
      });

      const snapshot = controller.getSnapshot();
      expect(snapshot.fields['ros_cv_chest_pain']?.value).toBe('positive');
      expect(snapshot.fields['ros_neuro_tremor_memory']?.assessmentStatus).toBe('unable-to-assess');
      expect(snapshot.collapsedSectionIds).toContain('ros-cardiovascular');
    });

    it('resolves conditional red-flag follow-up blocks via GENERAL_ROS_FORM_LOGIC', () => {
      const allNegativeResolved = resolveLogic(GENERAL_ROS_FORM_LOGIC, {
        ros_cv_chest_pain: 'negative',
        ros_cv_syncope: 'negative',
      });
      expect(allNegativeResolved.fields['ros_cv_red_flag_notes']?.hidden).toBe(true);
      expect(allNegativeResolved.fields['ros_cv_red_flag_notes']?.required).toBe(false);
      expect(allNegativeResolved.canSubmit).toBe(true);

      const positiveRedFlagWithoutNotes = resolveLogic(
        GENERAL_ROS_FORM_LOGIC,
        {
          ros_cv_chest_pain: 'positive',
          ros_cv_syncope: 'negative',
        },
        { showRequiredErrors: true },
      );
      expect(positiveRedFlagWithoutNotes.fields['ros_cv_red_flag_notes']?.hidden).toBeUndefined();
      expect(positiveRedFlagWithoutNotes.fields['ros_cv_red_flag_notes']?.required).toBe(true);
      expect(positiveRedFlagWithoutNotes.canSubmit).toBe(false);
      expect(positiveRedFlagWithoutNotes.blockingErrors['ros_cv_red_flag_notes']).toBeDefined();

      const positiveRedFlagWithNotes = resolveLogic(GENERAL_ROS_FORM_LOGIC, {
        ros_cv_chest_pain: 'positive',
        ros_cv_red_flag_notes: 'Central crushing chest pain radiating to left arm; ECG ordered STAT.',
      });
      expect(positiveRedFlagWithNotes.canSubmit).toBe(true);
    });
  });

  describe('Adult & Paediatric Inpatient Admission Schemas', () => {
    it('supports Adult Admission workflow including repeatable allergies/meds and VTE/falls/pressure screening', () => {
      const controller = new ClinicalFormController(
        createInitialClinicalFormViewModel(ADULT_ADMISSION_FORM_SCHEMA),
      );

      controller.dispatch({
        type: 'fieldEditRequested',
        fieldId: 'adult_chief_complaint',
        value: 'Acute dyspnoea and pleuritic chest pain',
      });
      controller.dispatch({
        type: 'fieldEditRequested',
        fieldId: 'adult_vte_risk_category',
        value: 'high-no-bleed-risk',
      });
      controller.dispatch({
        type: 'fieldEditRequested',
        fieldId: 'adult_falls_risk_level',
        value: 'moderate',
      });
      controller.dispatch({
        type: 'fieldEditRequested',
        fieldId: 'adult_pressure_ulcer_risk',
        value: 'at-risk',
      });

      controller.dispatch({
        type: 'repeatItemAddRequested',
        groupId: 'adult_reconciled_allergies',
      });
      const addedAllergyId =
        controller.getSnapshot().repeatableGroups['adult_reconciled_allergies']?.[0]?.id;
      expect(addedAllergyId).toBeDefined();

      controller.dispatch({
        type: 'repeatItemEditRequested',
        groupId: 'adult_reconciled_allergies',
        itemId: addedAllergyId!,
        fieldId: 'allergen_substance',
        value: 'Penicillin',
      });

      const snapshot = controller.getSnapshot();
      expect(snapshot.fields['adult_vte_risk_category']?.value).toBe('high-no-bleed-risk');
      expect(
        snapshot.repeatableGroups['adult_reconciled_allergies']?.[0]?.fields['allergen_substance']
          ?.value,
      ).toBe('Penicillin');
    });

    it('supports Paediatric Admission workflow including birth, immunization, feeding, and weight safety checks', () => {
      const controller = new ClinicalFormController(
        createInitialClinicalFormViewModel(PAEDIATRIC_ADMISSION_FORM_SCHEMA),
      );

      controller.dispatch({
        type: 'fieldEditRequested',
        fieldId: 'paeds_gestational_age_weeks',
        value: 38,
      });
      controller.dispatch({
        type: 'fieldEditRequested',
        fieldId: 'paeds_immunization_status',
        value: 'up-to-date',
      });
      controller.dispatch({
        type: 'fieldEditRequested',
        fieldId: 'paeds_feeding_regimen',
        value: 'exclusive-breastfeeding',
      });
      controller.dispatch({
        type: 'fieldEditRequested',
        fieldId: 'paeds_dosing_weight_kg',
        value: 8.4,
      });
      controller.dispatch({
        type: 'fieldEditRequested',
        fieldId: 'paeds_weight_safety_double_check',
        value: true,
      });

      const snapshot = controller.getSnapshot();
      expect(snapshot.fields['paeds_dosing_weight_kg']?.value).toBe(8.4);
      expect(snapshot.fields['paeds_weight_safety_double_check']?.value).toBe(true);
    });
  });

  describe('Neurology, Rheumatology & Burn Matrix Schemas', () => {
    it('supports MRC 4-Limb Power & Reflexes matrix with paired Right/Left grading and column copy', () => {
      const rowIds = MRC_LIMB_POWER_MATRIX_SCHEMA.rows.map(r => r.id);
      expect(rowIds).toContain('ul_c5_shoulder_abduction');
      expect(rowIds).toContain('ul_t1_finger_abduction');
      expect(rowIds).toContain('ll_l2_hip_flexion');
      expect(rowIds).toContain('ll_s1_ankle_plantarflexion');
      expect(rowIds).toContain('reflex_knee_l3_l4');
      expect(rowIds).toContain('plantar_response');

      const controller = new ClinicalMatrixController(
        MRC_LIMB_POWER_MATRIX_SCHEMA,
        createInitialClinicalMatrixValues(MRC_LIMB_POWER_MATRIX_SCHEMA),
      );

      controller.dispatch({
        type: 'cellEditRequested',
        rowId: 'ul_c5_shoulder_abduction',
        columnId: 'right',
        value: '5',
      });
      controller.dispatch({
        type: 'columnCopyRequested',
        fromColumnId: 'right',
        toColumnId: 'left',
      });
      controller.dispatch({
        type: 'cellEditRequested',
        rowId: 'plantar_response',
        columnId: 'left',
        value: 'extensor',
      });

      const snapshot = controller.getSnapshot();
      expect(snapshot.values['ul_c5_shoulder_abduction']?.cells['left']?.value).toBe('5');
      expect(snapshot.values['plantar_response']?.cells['left']?.value).toBe('extensor');
    });

    it('supports C2–S4 Dermatome Sensory matrix across Light Touch and Pinprick columns', () => {
      expect(DERMATOME_SENSORY_MATRIX_SCHEMA.rows.length).toBeGreaterThanOrEqual(22);
      const controller = new ClinicalMatrixController(
        DERMATOME_SENSORY_MATRIX_SCHEMA,
        createInitialClinicalMatrixValues(DERMATOME_SENSORY_MATRIX_SCHEMA),
      );

      controller.dispatch({
        type: 'cellEditRequested',
        rowId: 'derm_c6',
        columnId: 'right_light_touch',
        value: '2',
      });
      controller.dispatch({
        type: 'cellEditRequested',
        rowId: 'derm_l5',
        columnId: 'left_pinprick',
        value: '1',
      });

      const snapshot = controller.getSnapshot();
      expect(snapshot.values['derm_c6']?.cells['right_light_touch']?.value).toBe('2');
      expect(snapshot.values['derm_l5']?.cells['left_pinprick']?.value).toBe('1');
    });

    it('supports Rheumatology 28-Joint DAS28 matrix (14 paired joints + TJC28/SJC28/ESR/CRP/Global VAS)', () => {
      const controller = new ClinicalMatrixController(
        DAS28_JOINT_MATRIX_SCHEMA,
        createInitialClinicalMatrixValues(DAS28_JOINT_MATRIX_SCHEMA),
      );

      controller.dispatch({
        type: 'cellEditRequested',
        rowId: 'joint_wrist',
        columnId: 'right_tender',
        value: '1',
      });
      controller.dispatch({
        type: 'cellEditRequested',
        rowId: 'joint_wrist',
        columnId: 'right_swollen',
        value: '1',
      });
      controller.dispatch({
        type: 'cellEditRequested',
        rowId: 'das28_esr_mm_hr',
        columnId: 'das28_parameter',
        value: 42,
      });
      controller.dispatch({
        type: 'cellEditRequested',
        rowId: 'das28_patient_global_vas_mm',
        columnId: 'das28_parameter',
        value: 65,
      });

      // Non-applicable column edit on a parameter row is ignored by ClinicalMatrixController
      controller.dispatch({
        type: 'cellEditRequested',
        rowId: 'das28_esr_mm_hr',
        columnId: 'right_tender',
        value: '1',
      });

      const snapshot = controller.getSnapshot();
      expect(snapshot.values['joint_wrist']?.cells['right_tender']?.value).toBe('1');
      expect(snapshot.values['das28_esr_mm_hr']?.cells['das28_parameter']?.value).toBe(42);
      expect(snapshot.values['das28_esr_mm_hr']?.cells['right_tender']).toBeUndefined();
    });

    it('supports Burn Lund-Browder TBSA% and Parkland fluid resuscitation matrix across all 12 regions', () => {
      const regionRowIds = BURN_LUND_BROWDER_MATRIX_SCHEMA.rows.slice(0, 12).map(r => r.id);
      expect(regionRowIds).toEqual([
        'lb_head',
        'lb_neck',
        'lb_anterior_trunk',
        'lb_posterior_trunk',
        'lb_buttocks',
        'lb_genitalia',
        'lb_upper_arms',
        'lb_forearms',
        'lb_hands',
        'lb_thighs',
        'lb_legs',
        'lb_feet',
      ]);

      const controller = new ClinicalMatrixController(
        BURN_LUND_BROWDER_MATRIX_SCHEMA,
        createInitialClinicalMatrixValues(BURN_LUND_BROWDER_MATRIX_SCHEMA),
      );

      controller.dispatch({
        type: 'cellEditRequested',
        rowId: 'lb_anterior_trunk',
        columnId: 'superficial_dermal_pct',
        value: 9.0,
      });
      controller.dispatch({
        type: 'cellEditRequested',
        rowId: 'lb_anterior_trunk',
        columnId: 'deep_dermal_pct',
        value: 4.0,
      });
      controller.dispatch({
        type: 'cellEditRequested',
        rowId: 'burn_total_tbsa_pct',
        columnId: 'parkland_parameter',
        value: 20.0,
      });
      controller.dispatch({
        type: 'cellEditRequested',
        rowId: 'burn_parkland_24h_crystalloid_ml',
        columnId: 'parkland_parameter',
        value: 5600,
      });

      const snapshot = controller.getSnapshot();
      expect(snapshot.values['lb_anterior_trunk']?.cells['superficial_dermal_pct']?.value).toBe(9.0);
      expect(snapshot.values['burn_parkland_24h_crystalloid_ml']?.cells['parkland_parameter']?.value).toBe(5600);
    });
  });

  describe('Validated PRO Questionnaires (PHQ-9, GAD-7, OSDI, VF-14)', () => {
    it('validates item counts, scoring band coverage, and ClinicalFormController compatibility for all 4 PROs', () => {
      expect(CLINICAL_PRO_SCHEMAS).toHaveLength(4);
      expect(PHQ9_SCORING_RECIPE.itemIds).toHaveLength(9);
      expect(PHQ9_SCORING_RECIPE.maxScore).toBe(27);
      expect(GAD7_SCORING_RECIPE.itemIds).toHaveLength(7);
      expect(GAD7_SCORING_RECIPE.maxScore).toBe(21);
      expect(OSDI_SCORING_RECIPE.itemIds).toHaveLength(12);
      expect(OSDI_SCORING_RECIPE.maxScore).toBe(100);
      expect(VF14_SCORING_RECIPE.itemIds).toHaveLength(14);
      expect(VF14_SCORING_RECIPE.maxScore).toBe(100);

      for (const schema of [
        PHQ9_PRO_FORM_SCHEMA,
        GAD7_PRO_FORM_SCHEMA,
        OSDI_PRO_FORM_SCHEMA,
        VF14_PRO_FORM_SCHEMA,
      ]) {
        const controller = new ClinicalFormController(createInitialClinicalFormViewModel(schema));
        const firstFieldId = Object.keys(controller.getSnapshot().fields)[0]!;
        controller.dispatch({
          type: 'fieldEditRequested',
          fieldId: firstFieldId,
          value: '2',
        });
        expect(controller.getSnapshot().fields[firstFieldId]?.value).toBe('2');
      }
    });
  });

  describe('Clinical Order Sets (Post-Cataract Phaco/IOL & Sepsis Six)', () => {
    it('materializes Post-Cataract Phaco/IOL order set with 4-week steroid taper and Day-1/Week-1/Week-4 follow-up', () => {
      expect(CLINICAL_ORDER_SET_RECIPES).toHaveLength(2);
      const selected = materializeOrderSetSelectedOrders(POST_CATARACT_ORDER_SET_RECIPE);
      expect(selected.length).toBeGreaterThanOrEqual(7);

      const predTaperItem = POST_CATARACT_ORDER_SET_RECIPE.sections
        .flatMap(s => s.items)
        .find(i => i.id === 'cat-order-prednisolone-taper');
      expect(predTaperItem?.taperSchedule).toHaveLength(4);

      const followUpSection = POST_CATARACT_ORDER_SET_RECIPE.sections.find(
        s => s.id === 'post-cataract-follow-up-schedule',
      );
      expect(followUpSection?.items.map(i => i.code)).toEqual([
        'FU-CAT-D1',
        'FU-CAT-W1',
        'FU-CAT-W4',
      ]);
    });

    it('integrates Sepsis Six bundle with HierarchyOrderController group preview and confirmation', async () => {
      const rootNode = toOrderSetHierarchyNode(SEPSIS_SIX_ORDER_SET_RECIPE);
      const preview = toOrderSetGroupPreview(SEPSIS_SIX_ORDER_SET_RECIPE);
      expect(preview.items).toHaveLength(7);

      const repo: OrderCatalogueRepository = {
        roots: async () => [rootNode],
        children: async () => rootNode.children ?? [],
        previewGroup: async () => preview,
        resolveItem: async nodeId => ({
          id: `order-${nodeId}`,
          catalogueId: nodeId,
          label: nodeId,
          kind: 'laboratory',
        }),
      };

      const controller = new HierarchyOrderController('Sepsis Six Order Set', repo, undefined, 'laboratory');
      controller.dispatch({
        type: 'groupPreviewRequested',
        nodeId: SEPSIS_SIX_ORDER_SET_RECIPE.id,
      });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(controller.getSnapshot().preview?.groupId).toBe(SEPSIS_SIX_ORDER_SET_RECIPE.id);
      controller.dispatch({
        type: 'groupAddConfirmed',
        groupId: SEPSIS_SIX_ORDER_SET_RECIPE.id,
      });

      expect(controller.getSnapshot().selected).toHaveLength(7);
      controller.destroy();
    });
  });
});
