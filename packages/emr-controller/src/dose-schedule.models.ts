import type { EmrBadge, EmrTone } from './models.js';

/**
 * Dosage forms the component can draw an icon for. Purely presentational: the form picks a glyph and
 * decides whether quarter-fractions are written as ¼ ½ ¾ (countable forms) or as plain decimals
 * (measured forms such as mL or units).
 */
export type DoseForm =
  | 'tablet' | 'capsule' | 'drop' | 'liquid' | 'ointment' | 'cream' | 'gel'
  | 'spray' | 'inhaler' | 'injection' | 'patch' | 'sachet' | 'suppository' | 'other';

/** A controller-supplied word with an optional abbreviation. The component never shows `code` without `label`. */
export interface DoseLabelled {
  /** Abbreviation such as 'BD', 'OD', 'AS'. Shown in parentheses after the words, never alone. */
  code?: string;
  label: string;
}

export interface DoseUnit {
  /** 'tablet', 'drop', 'mL', 'puff' — used when amount is 1 or less. */
  one: string;
  /** 'tablets', 'drops', 'mL', 'puffs' — used when amount is more than 1. */
  other: string;
}

export interface DoseSlot {
  id: string;
  /** 'Morning', 'Afternoon', 'Evening', 'Night' */
  label: string;
  timeHint?: string;
  /** Numeric amount in `model.unit`. `null` = not taken in this slot (unless `amountLabel` says how much). */
  amount: number | null;
  /** Descriptive amount, e.g. 'thin layer' or '1 cm ribbon'. Replaces the numeric text when present. */
  amountLabel?: string;
  /** Secondary household equivalent, e.g. '1 teaspoon'. Shown only when the controller supplies it. */
  householdLabel?: string;
}

export interface DoseTaperStep {
  id: string;
  /** 'Week 1', 'Days 1 to 3' */
  periodLabel: string;
  /** '6 times daily' */
  frequencyLabel: string;
  slots?: readonly DoseSlot[];
}

export interface DoseScheduleViewModel {
  medication: { label: string; strength?: string; formLabel: string; form: DoseForm };
  /** Unit words for numeric amounts. Omit when every amount uses `amountLabel`. */
  unit?: DoseUnit;
  frequency: DoseLabelled;
  slots: readonly DoseSlot[];
  /** Where it goes: 'Right eye' (OD), 'Both ears' (AU), 'Affected area', 'Both nostrils'. */
  site?: DoseLabelled;
  route?: string;
  foodRelation?: string;
  duration?: string;
  startLabel?: string;
  instructions?: readonly string[];
  /** As-needed dosing, e.g. { label: 'Only when needed for pain', maxLabel: 'No more than 4 times in 24 hours' }. */
  prn?: { label: string; maxLabel?: string };
  separationNote?: string;
  taper?: readonly DoseTaperStep[];
  status?: EmrBadge;
  readOnly?: boolean;
  canEdit?: boolean;
  canShowInstructions?: boolean;
}

export type DoseScheduleIntent =
  | { type: 'editRequested' }
  | { type: 'instructionsRequested' };

export interface PrescribingFormularyItem {
  /** Backend Drug Catalog / RxNorm / SNOMED-CT identifier (e.g. 'RXN-860975'). */
  code: string;
  /** Generic or brand drug name from the backend API. */
  drugName: string;
  /** Concentration or strength from the backend API (e.g. '0.5% w/v', '500 mg', '200/6 mcg'). */
  strength: string;
  /** Structured dosage form from the backend API — drives all downstream column UI behavior. */
  form: DoseForm;
  /** Human-readable dosage form label from the backend API (e.g. 'Ophthalmic Drops', 'Oral Tablet (Scored)', 'Paediatric Suspension'). */
  formLabel: string;
  /** Default route code from the backend API (e.g. 'eye', 'oral', 'topical', 'inhalation', 'iv-inf', 'ear', 'nasal'). */
  route: string;
  /** Optional allowed routes for this drug from the backend API. */
  allowedRoutes?: readonly { value: string; label: string }[];
  /** Default anatomical site from the backend API (e.g. 'OU', 'OD', 'AU', 'Lesions'). */
  site?: string;
  /** Default per-administration dose quantity from the backend API. */
  doseAmount?: number;
  /** Default dose unit from the backend API (e.g. 'drop', 'tab', 'cap', 'mL', 'FTU', 'puff', 'mg'). */
  unitLabel: string;
  /** Optional allowed dose units for this drug from the backend API. */
  allowedUnits?: readonly string[];
  /** Optional dose stepper increment from the backend API (e.g. 0.5 for scored tablets, 2.5 for mL syrup, 1 for drops/caps/puffs). */
  doseStep?: number;
  /** Optional specialty or clinical context badge from the backend API. */
  specialtyTag?: string;
  /** Optional weight/BSA dosing basis note from the backend API (e.g. '15 mg/kg/dose' or '100 mg/m²'). */
  dosingBasisLabel?: string;
  /** Pharmacy stock / formulary status from the backend API (e.g. 'In Stock', 'Low Stock', 'Non-Formulary'). */
  stockStatus?: string;
  defaultPresetId?: string;
  defaultDurationCount?: number;
  defaultDurationUnit?: string;
  defaultFoodRelation?: string;
  defaultInstructions?: string;
}

export interface PrescribingRow {
  id: string;
  /** Backend Drug Catalog / RxNorm / SNOMED-CT identifier when resolved from the backend formulary API. */
  formularyCode?: string;
  drugName: string;
  strength: string;
  /** Dosage form resolved from the backend API (or fallback for custom/unlisted drugs) — drives Columns 2–6. */
  form: DoseForm;
  formLabel: string;
  route: string;
  /** Optional backend-supplied allowed routes for this drug's dose form. */
  allowedRoutes?: readonly { value: string; label: string }[];
  site?: string;
  /** Optional specialty or clinical context badge, e.g. 'Ophthalmology', 'Pediatrics (12 kg)', 'Oncology (BSA 1.7m²)'. */
  specialtyTag?: string;
  /** Optional weight/BSA dosing basis note, e.g. '15 mg/kg/dose' or '100 mg/m²'. */
  dosingBasisLabel?: string;
  /** Optional pharmacy stock status from the backend API (e.g. 'In Stock', 'Low Stock'). */
  stockStatus?: string;
  /** Optional parent row ID when this row is a sequential Step-Down or Step-Up titration row. */
  parentRowId?: string;
  /** Whether this row is a 'step-down' (taper) or 'step-up' (escalation/titration) continuation row. */
  stepPhase?: 'step-down' | 'step-up';
  /** Human-readable phase badge, e.g. '↳ Step-Down (Week 2)' or '↳ Step-Up (Days 4–7)'. */
  stepLabel?: string;
  /** Per-administration dose quantity (e.g. 1, 0.5, 2, 5). */
  doseAmount?: number | null;
  /** Optional backend-supplied dose stepper increment (e.g. 0.5, 1, 2.5). */
  doseStep?: number;
  slots: readonly DoseSlot[];
  /** Dose unit (e.g. '' for unitless, 'drop', 'tab', 'mL', 'puff', 'cap', 'FTU', 'IU', 'mg/m²', 'mg'). */
  unitLabel: string;
  /** Optional backend-supplied allowed dose units for this drug's dose form. */
  allowedUnits?: readonly string[];
  /** Controller-supplied frequency badge, e.g. 'BD', 'TDS', 'OD', 'QID', 'HS', 'SOS', 'TAPER'. */
  frequencyCode?: string;
  /** Controller-supplied dose notation, e.g. '1 - 0 - 1 - 0'. */
  patternLabel?: string;
  durationCount: number | null;
  durationUnit: string;
  foodRelation: string;
  instructions: string;
  taperExpanded?: boolean;
  taperSteps?: readonly DoseTaperStep[];
  error?: string;
}

export interface PrescribingFavouriteSet {
  id: string;
  label: string;
}

export interface PrescribingSafetyAlert {
  id: string;
  tone: EmrTone;
  badgeLabel: string;
  message: string;
  rowId?: string;
}

export interface PrescribingQuickSigExample {
  command: string;
  label: string;
}

export interface PrescribingTableViewModel {
  title?: string;
  rows: readonly PrescribingRow[];
  formulary?: readonly PrescribingFormularyItem[];
  favourites?: readonly PrescribingFavouriteSet[];
  quickSigExamples?: readonly PrescribingQuickSigExample[];
  safetyAlerts?: readonly PrescribingSafetyAlert[];
  slotDefinitions: readonly { id: string; label: string; shortLabel?: string; timeHint?: string }[];
  presets?: readonly { id: string; label: string; slotIds: readonly string[] }[];
  formOptions?: readonly { value: DoseForm; label: string }[];
  doseUnits?: readonly string[];
  routeOptions?: readonly { value: string; label: string }[];
  siteOptions?: readonly { value: string; label: string }[];
  durationUnits?: readonly string[];
  foodOptions?: readonly string[];
  status?: EmrBadge;
  prescriberLabel?: string;
  signedAtLabel?: string;
  canSign?: boolean;
  canAmend?: boolean;
  readOnly?: boolean;
  error?: string;
}

export type PrescribingTableIntent =
  | { type: 'rowAddRequested'; afterRowId?: string }
  | { type: 'rowRemoveRequested'; rowId: string }
  | { type: 'rowMoveRequested'; rowId: string; direction: 'up' | 'down' }
  | { type: 'rowDuplicateRequested'; rowId: string }
  | { type: 'rowStepTitrationRequested'; rowId: string; direction: 'down' | 'up' }
  | { type: 'quickSigSubmitted'; command: string }
  | { type: 'formularySearchRequested'; rowId: string; query: string }
  | { type: 'formularySelected'; rowId: string; item: PrescribingFormularyItem }
  | { type: 'drugNameChanged'; rowId: string; drugName: string }
  | { type: 'strengthChanged'; rowId: string; strength: string }
  | { type: 'formChanged'; rowId: string; form: DoseForm }
  | { type: 'routeChanged'; rowId: string; route: string }
  | { type: 'siteChanged'; rowId: string; site: string }
  | { type: 'doseStepped'; rowId: string; delta: number }
  | { type: 'doseAmountChanged'; rowId: string; amount: number | null }
  | { type: 'doseUnitChanged'; rowId: string; unitLabel: string }
  | { type: 'slotStepped'; rowId: string; slotId: string; delta: number }
  | { type: 'slotAmountChanged'; rowId: string; slotId: string; amount: number | null }
  | { type: 'presetApplied'; rowId: string; presetId: string }
  | { type: 'durationStepped'; rowId: string; delta: number }
  | { type: 'durationChanged'; rowId: string; count: number | null; unit?: string }
  | { type: 'foodRelationChanged'; rowId: string; foodRelation: string }
  | { type: 'instructionsChanged'; rowId: string; instructions: string }
  | { type: 'taperToggleRequested'; rowId: string }
  | { type: 'taperStepAddRequested'; rowId: string; afterStepId?: string }
  | { type: 'taperStepRemoveRequested'; rowId: string; stepId: string }
  | { type: 'taperStepMoveRequested'; rowId: string; stepId: string; direction: 'up' | 'down' }
  | { type: 'taperStepChanged'; rowId: string; stepId: string; periodLabel?: string; frequencyLabel?: string }
  | { type: 'favouriteApplied'; favouriteId: string }
  | { type: 'signRequested' }
  | { type: 'amendRequested' };

