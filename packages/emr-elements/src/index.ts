export * from './foundations.js';
export * from './icons.js';
export * from './l1-primitives.js';
import type { EmrBadgeElement, EmrCardElement, EmrCheckboxElement, EmrChipElement, EmrColumnsElement, EmrDateTimeInputElement, EmrLikertElement, EmrSearchSelectElement, EmrSeparatorElement, EmrStageStepperElement, EmrStatTileElement, EmrStateMessageElement, EmrTabsElement, EmrTimeInputElement, EmrToggleElement, EmrVasElement } from './l1-primitives.js';
export * from './l1-primitives-extra.js';
export * from './l1-primitives-wave2.js';
export * from './l2-fields.js';
export * from './l2-fields-extra.js';
export * from './l3-structures.js';
export * from './l4-domain.js';
export * from './l6-authoring.js';
export {
  ABDOMEN_RECIPES,
  ANAESTHESIA_RECIPES,
  ANTERIOR_SEGMENT_RECIPES,
  BACK_RECIPES,
  BONY_JOINTS_RECIPES,
  BURNS_RECIPES,
  CARDIOTHORACIC_RECIPES,
  CORNEA_RECIPES,
  DENTAL_ORAL_RECIPES,
  ENDOCRINE_NECK_RECIPES,
  ENT_HEAD_NECK_RECIPES,
  ENT_RECIPES,
  EYE_EXTERNAL_RECIPES,
  FACE_RECIPES,
  FEET_RECIPES,
  GENITAL_PERINEAL_RECIPES,
  GI_TRACT_RECIPES,
  GLOBE_ORBIT_RECIPES,
  GYNAECOLOGY_RECIPES,
  HANDS_RECIPES,
  HEAD_SCALP_RECIPES,
  LENS_RECIPES,
  LOWER_LIMBS_RECIPES,
  NECK_RECIPES,
  NEONATAL_RECIPES,
  NEURO_SPINE_RECIPES,
  NEUROLOGICAL_RECIPES,
  OBSTETRIC_RECIPES,
  OCT_RECIPES,
  OCULAR_MOTILITY_RECIPES,
  OPTIC_DISC_RECIPES,
  ORGANS_RECIPES,
  PAEDIATRIC_SURGERY_RECIPES,
  PAEDIATRIC_RECIPES,
  PELVIS_RECIPES,
  RETINA_RECIPES,
  SKELETON_RECIPES,
  SKULL_BRAIN_RECIPES,
  THORAX_RECIPES,
  UPPER_LIMBS_RECIPES,
  VASCULAR_RECIPES,
  WHOLE_BODY_RECIPES,
  WOUND_PROCEDURE_RECIPES,
  ANATOMY_RECIPES,
  GENERAL_FINDINGS_SYMBOLS,
  RETINA_SYMBOLS,
  SURGERY_SYMBOLS,
  ANNOTATION_SYMBOL_SETS,
  type OrderSetItemRecipe,
  type OrderSetSectionRecipe,
  type OrderSetRecipe,
  type ClinicalProScoringBand,
  type ClinicalProScoringRecipe,
  GENERAL_ROS_FORM_SCHEMA,
  GENERAL_ROS_FORM_LOGIC,
  ADULT_ADMISSION_FORM_SCHEMA,
  PAEDIATRIC_ADMISSION_FORM_SCHEMA,
  MRC_LIMB_POWER_MATRIX_SCHEMA,
  DERMATOME_SENSORY_MATRIX_SCHEMA,
  DAS28_JOINT_MATRIX_SCHEMA,
  DAS28_DISEASE_ACTIVITY_BANDS,
  BURN_LUND_BROWDER_MATRIX_SCHEMA,
  PHQ9_PRO_FORM_SCHEMA,
  GAD7_PRO_FORM_SCHEMA,
  OSDI_PRO_FORM_SCHEMA,
  VF14_PRO_FORM_SCHEMA,
  CLINICAL_PRO_SCHEMAS,
  CLINICAL_PRO_SCORING_RECIPES,
  POST_CATARACT_ORDER_SET_RECIPE,
  SEPSIS_SIX_ORDER_SET_RECIPE,
  CLINICAL_ORDER_SET_RECIPES,
  CLINICAL_FORM_SCHEMA_PACKS,
  CLINICAL_MATRIX_SCHEMA_PACKS,
  CLINICAL_PRO_SCHEMA_PACKS,
  CLINICAL_ORDER_SET_PACKS,
  createInitialClinicalFormViewModel,
  createInitialClinicalMatrixValues,
  materializeOrderSetSelectedOrders,
  toOrderSetHierarchyNode,
  toOrderSetGroupPreview,
} from '@drguptavivek/emr-controller';

import type {
  EmrAccordionElement,
  EmrBreadcrumbsElement,
  EmrColorPickerElement,
  EmrComboboxElement,
  EmrCopyButtonElement,
  EmrDateRangeInputElement,
  EmrImageCropperElement,
  EmrImageUploadElement,
  EmrImageViewerElement,
  EmrMaskedInputElement,
  EmrMenuElement,
  EmrOtpInputElement,
  EmrRangeSliderElement,
  EmrSliderElement,
  EmrSplitButtonElement,
  EmrTagInputElement,
  EmrToggleGroupElement,
  EmrTreeSelectElement,
  EmrTreeViewElement,
} from './l1-primitives-wave2.js';
import type {
  EmrAttachmentFieldElement,
  EmrImageFieldElement,
  EmrPartialDateFieldElement,
  EmrScaleFieldElement,
} from './l2-fields-extra.js';
import type {
  EmrCommandPaletteElement,
  EmrMasterDetailElement,
  EmrSplitWorkspaceElement,
  EmrSynchronizedTimeGridElement,
} from './l3-workstation.js';
import type {
  EmrFhirQuestionnaireMapperElement,
  EmrLogicRuleBuilderElement,
  EmrScoreBuilderElement,
} from './l6-builders.js';
import type {
  EmrGonioscopyChartElement,
  EmrHessScreenChartElement,
  EmrVisualFieldSummaryElement,
} from './l4-ophthalmology-glaucoma-motility.js';
import type {
  EmrContactLensPrescriptionElement,
  EmrCornealTopographySummaryElement,
  EmrIntravitrealCourseTrackerElement,
  EmrIolBiometryPlannerElement,
  EmrOphthalmicOperativeRecordElement,
} from './l4-ophthalmology-cataract-retina-cornea.js';
import type {
  EmrAppointmentCalendarElement,
  EmrSbarHandoverElement,
  EmrWaitlistQueueElement,
  EmrWardBedBoardElement,
} from './l4-hospital-operations.js';
import type {
  EmrAnaesthesiaRecordElement,
  EmrEdTrackBoardElement,
  EmrFluidBalanceChartElement,
  EmrLabCumulativeGridElement,
  EmrMicrobiologyAntibiogramElement,
  EmrResuscitationEventLogElement,
  EmrSpecimenCollectionBarElement,
  EmrSurgicalImplantLogElement,
  EmrTriageAssessmentCardElement,
} from './l4-acute-lab-perioperative.js';
import type {
  EmrAbdmHealthLockerPanelElement,
  EmrAudiogramElement,
  EmrChemoRegimenRoadmapElement,
  EmrEncounterChargeSheetElement,
  EmrGrowthChartElement,
  EmrImmunizationLedgerElement,
  EmrOdontogramElement,
  EmrPartogramElement,
  EmrReferralTrackerElement,
  EmrWaveformStripViewerElement,
} from './l4-maternal-peds-specialty-abdm.js';
import { registerL6Elements } from './l6-authoring.js';

declare global {
  interface HTMLElementTagNameMap {
    'emr-badge': EmrBadgeElement;
    'emr-card': EmrCardElement;
    'emr-checkbox': EmrCheckboxElement;
    'emr-chip': EmrChipElement;
    'emr-columns': EmrColumnsElement;
    'emr-likert': EmrLikertElement;
    'emr-search-select': EmrSearchSelectElement;
    'emr-separator': EmrSeparatorElement;
    'emr-stage-stepper': EmrStageStepperElement;
    'emr-stat-tile': EmrStatTileElement;
    'emr-state-message': EmrStateMessageElement;
    'emr-tabs': EmrTabsElement;
    'emr-time-input': EmrTimeInputElement;
    'emr-toggle': EmrToggleElement;
    'emr-vas': EmrVasElement;
    'emr-toggle-group': EmrToggleGroupElement;
    'emr-tree-view': EmrTreeViewElement;
    'emr-tree-select': EmrTreeSelectElement;
    'emr-image-viewer': EmrImageViewerElement;
    'emr-image-cropper': EmrImageCropperElement;
    'emr-image-upload': EmrImageUploadElement;
    'emr-date-range-input': EmrDateRangeInputElement;
    'emr-datetime-input': EmrDateTimeInputElement;
    'emr-combobox': EmrComboboxElement;
    'emr-tag-input': EmrTagInputElement;
    'emr-slider': EmrSliderElement;
    'emr-range-slider': EmrRangeSliderElement;
    'emr-masked-input': EmrMaskedInputElement;
    'emr-otp-input': EmrOtpInputElement;
    'emr-menu': EmrMenuElement;
    'emr-split-button': EmrSplitButtonElement;
    'emr-accordion': EmrAccordionElement;
    'emr-breadcrumbs': EmrBreadcrumbsElement;
    'emr-color-picker': EmrColorPickerElement;
    'emr-copy-button': EmrCopyButtonElement;
    'emr-attachment-field': EmrAttachmentFieldElement;
    'emr-image-field': EmrImageFieldElement;
    'emr-partial-date-field': EmrPartialDateFieldElement;
    'emr-scale-field': EmrScaleFieldElement;
    'emr-split-workspace': EmrSplitWorkspaceElement;
    'emr-command-palette': EmrCommandPaletteElement;
    'emr-master-detail': EmrMasterDetailElement;
    'emr-synchronized-time-grid': EmrSynchronizedTimeGridElement;
    'emr-logic-rule-builder': EmrLogicRuleBuilderElement;
    'emr-score-builder': EmrScoreBuilderElement;
    'emr-fhir-questionnaire-mapper': EmrFhirQuestionnaireMapperElement;
    'emr-gonioscopy-chart': EmrGonioscopyChartElement;
    'emr-visual-field-summary': EmrVisualFieldSummaryElement;
    'emr-hess-screen-chart': EmrHessScreenChartElement;
    'emr-iol-biometry-planner': EmrIolBiometryPlannerElement;
    'emr-intravitreal-course-tracker': EmrIntravitrealCourseTrackerElement;
    'emr-corneal-topography-summary': EmrCornealTopographySummaryElement;
    'emr-ophthalmic-operative-record': EmrOphthalmicOperativeRecordElement;
    'emr-contact-lens-prescription': EmrContactLensPrescriptionElement;
    'emr-appointment-calendar': EmrAppointmentCalendarElement;
    'emr-waitlist-queue': EmrWaitlistQueueElement;
    'emr-ward-bed-board': EmrWardBedBoardElement;
    'emr-sbar-handover': EmrSbarHandoverElement;
    'emr-ed-track-board': EmrEdTrackBoardElement;
    'emr-triage-assessment-card': EmrTriageAssessmentCardElement;
    'emr-resuscitation-event-log': EmrResuscitationEventLogElement;
    'emr-specimen-collection-bar': EmrSpecimenCollectionBarElement;
    'emr-lab-cumulative-grid': EmrLabCumulativeGridElement;
    'emr-microbiology-antibiogram': EmrMicrobiologyAntibiogramElement;
    'emr-anaesthesia-record': EmrAnaesthesiaRecordElement;
    'emr-fluid-balance-chart': EmrFluidBalanceChartElement;
    'emr-surgical-implant-log': EmrSurgicalImplantLogElement;
    'emr-partogram': EmrPartogramElement;
    'emr-growth-chart': EmrGrowthChartElement;
    'emr-immunization-ledger': EmrImmunizationLedgerElement;
    'emr-waveform-strip-viewer': EmrWaveformStripViewerElement;
    'emr-odontogram': EmrOdontogramElement;
    'emr-audiogram': EmrAudiogramElement;
    'emr-chemo-regimen-roadmap': EmrChemoRegimenRoadmapElement;
    'emr-referral-tracker': EmrReferralTrackerElement;
    'emr-encounter-charge-sheet': EmrEncounterChargeSheetElement;
    'emr-abdm-health-locker-panel': EmrAbdmHealthLockerPanelElement;
  }
}

export function registerAllEmrElements(): void {
  registerL6Elements();
}

if (typeof customElements !== 'undefined') {
  registerAllEmrElements();
}
