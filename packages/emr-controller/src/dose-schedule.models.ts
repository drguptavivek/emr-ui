import type { EmrBadge } from './models.js';

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
  code: string;
  drugName: string;
  strength: string;
  form: DoseForm;
  formLabel: string;
  route: string;
  site?: string;
  unitLabel: string;
  defaultPresetId?: string;
  defaultDurationCount?: number;
  defaultDurationUnit?: string;
  defaultFoodRelation?: string;
  defaultInstructions?: string;
}

export interface PrescribingRow {
  id: string;
  drugName: string;
  strength: string;
  form: DoseForm;
  formLabel: string;
  route: string;
  site?: string;
  slots: readonly DoseSlot[];
  unitLabel: string;
  /** Controller-supplied frequency badge, e.g. 'BD', 'TDS', 'OD', 'QID', 'TAPER'. */
  frequencyCode?: string;
  /** Controller-supplied dose notation, e.g. '1 - 0 - 1'. */
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

export interface PrescribingTableViewModel {
  title?: string;
  rows: readonly PrescribingRow[];
  formulary?: readonly PrescribingFormularyItem[];
  favourites?: readonly PrescribingFavouriteSet[];
  slotDefinitions: readonly { id: string; label: string; shortLabel?: string; timeHint?: string }[];
  presets?: readonly { id: string; label: string; slotIds: readonly string[] }[];
  formOptions?: readonly { value: DoseForm; label: string }[];
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
  | { type: 'formularySelected'; rowId: string; item: PrescribingFormularyItem }
  | { type: 'drugNameChanged'; rowId: string; drugName: string }
  | { type: 'strengthChanged'; rowId: string; strength: string }
  | { type: 'formChanged'; rowId: string; form: DoseForm }
  | { type: 'routeChanged'; rowId: string; route: string }
  | { type: 'siteChanged'; rowId: string; site: string }
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

