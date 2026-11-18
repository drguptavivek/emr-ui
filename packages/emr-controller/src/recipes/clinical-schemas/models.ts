import type {
  ClinicalAssessmentPresentation,
  ClinicalAssessmentStatus,
  ClinicalCellState,
  ClinicalMatrixRowValue,
  ClinicalMatrixSchema,
  ClinicalMatrixValues,
  EmrTone,
  GroupAddPreview,
  HierarchyNode,
  SelectedOrder,
} from '../../models.js';
import type {
  ClinicalAssessmentStatusOption,
  ClinicalFieldState,
  ClinicalFormSchema,
  ClinicalFormViewModel,
} from '../../clinical-form.models.js';

export type OrderSetItemCategory =
  | 'medication'
  | 'laboratory'
  | 'radiology'
  | 'nursing'
  | 'monitoring'
  | 'follow-up';

export interface OrderSetTaperStepRecipe {
  readonly phaseLabel: string;
  readonly durationLabel: string;
  readonly frequencyLabel: string;
  readonly doseLabel: string;
  readonly instructions?: string;
}

export interface OrderSetItemRecipe {
  readonly id: string;
  readonly catalogueId: string;
  readonly label: string;
  readonly code?: string;
  /** Maps directly to SelectedOrder['kind'] when materialized into HierarchyOrderController. */
  readonly orderKind: SelectedOrder['kind'];
  readonly category: OrderSetItemCategory;
  readonly defaultSelected: boolean;
  readonly priority?: 'stat' | 'urgent' | 'routine' | 'prn';
  readonly targetWindowLabel?: string;
  readonly details?: Readonly<Record<string, string | boolean | null>>;
  readonly taperSchedule?: readonly OrderSetTaperStepRecipe[];
  readonly clinicalRationale?: string;
}

export interface OrderSetSectionRecipe {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly items: readonly OrderSetItemRecipe[];
}

export interface OrderSetRecipe {
  readonly id: string;
  readonly label: string;
  readonly code?: string;
  readonly specialty: string;
  readonly careSetting: 'opd' | 'ipd' | 'emergency' | 'perioperative';
  readonly description: string;
  readonly sections: readonly OrderSetSectionRecipe[];
}

export interface ClinicalProScoringBand {
  readonly id: string;
  readonly min: number;
  readonly max: number;
  readonly label: string;
  readonly tone: EmrTone;
  readonly clinicalAction?: string;
}

export interface ClinicalProScoringRecipe {
  readonly instrumentId: string;
  readonly formSchemaId: string;
  readonly label: string;
  readonly shortName: string;
  readonly itemIds: readonly string[];
  readonly minScore: number;
  readonly maxScore: number;
  readonly formulaDescription: string;
  readonly bands: readonly ClinicalProScoringBand[];
}

export const STANDARD_ASSESSMENT_STATUS_OPTIONS: readonly ClinicalAssessmentStatusOption[] = [
  { value: 'recorded', label: 'Recorded', tone: 'success' },
  { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
  { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
  { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
  { value: 'declined', label: 'Declined', tone: 'warning' },
  { value: 'unknown', label: 'Unknown', tone: 'neutral' },
];

export const STANDARD_MATRIX_ASSESSMENT_STATUS_OPTIONS: readonly ClinicalAssessmentPresentation[] = [
  { value: 'recorded', label: 'Recorded', tone: 'success' },
  { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
  { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
  { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
  { value: 'declined', label: 'Declined', tone: 'warning' },
  { value: 'unknown', label: 'Unknown', tone: 'neutral' },
];

/**
 * Builds an initial `ClinicalFormViewModel` for a `ClinicalFormSchema` with all
 * fields and repeatable groups initialized so `ClinicalFormController` can immediately
 * process edit and repeatable-group intents.
 */
export function createInitialClinicalFormViewModel(
  schema: ClinicalFormSchema,
  initialFieldValues: Readonly<Record<string, ClinicalFieldState['value']>> = {},
  initialStatuses: Readonly<Record<string, ClinicalAssessmentStatus>> = {},
): ClinicalFormViewModel {
  const fields: Record<string, ClinicalFieldState> = {};
  const repeatableGroups: Record<string, readonly []> = {};

  for (const section of schema.sections) {
    for (const block of section.blocks) {
      if (block.kind === 'repeatable') {
        repeatableGroups[block.id] = [];
        continue;
      }
      if (block.kind === 'matrix') {
        for (const row of block.rows) {
          for (const cell of Object.values(row.cells)) {
            fields[cell.id] = {
              value: initialFieldValues[cell.id] ?? null,
              ...(initialStatuses[cell.id] ? { assessmentStatus: initialStatuses[cell.id] } : {}),
            };
          }
        }
        continue;
      }
      fields[block.id] = {
        value: initialFieldValues[block.id] ?? null,
        ...(initialStatuses[block.id] ? { assessmentStatus: initialStatuses[block.id] } : {}),
      };
    }
  }

  return {
    schema,
    fields,
    repeatableGroups,
    collapsedSectionIds: [],
  };
}

/**
 * Builds an initial `ClinicalMatrixValues` map for a `ClinicalMatrixSchema` so
 * `ClinicalMatrixController` can immediately edit any applicable cell or row remark.
 */
export function createInitialClinicalMatrixValues(
  schema: ClinicalMatrixSchema,
): ClinicalMatrixValues {
  const values: Record<string, ClinicalMatrixRowValue> = {};

  for (const row of schema.rows) {
    const applicableCols = row.applicableColumnIds ?? schema.columns.map(col => col.id);
    const cells: Record<string, ClinicalCellState> = {};
    for (const colId of applicableCols) {
      cells[colId] = {
        value: row.type === 'quantity' && row.unit ? { value: null, unit: row.unit } : null,
      };
    }
    values[row.id] = {
      cells,
      remark: '',
    };
  }

  return values;
}

/**
 * Materializes the default-selected (or all) items of an `OrderSetRecipe` into
 * `SelectedOrder[]` compatible with `HierarchyOrderController` and `FavouritesController`.
 */
export function materializeOrderSetSelectedOrders(
  recipe: OrderSetRecipe,
  includeOptional = false,
): readonly SelectedOrder[] {
  const orders: SelectedOrder[] = [];
  for (const section of recipe.sections) {
    for (const item of section.items) {
      if (!includeOptional && !item.defaultSelected) continue;
      orders.push({
        id: `order-${item.catalogueId}`,
        catalogueId: item.catalogueId,
        label: item.label,
        ...(item.code ? { code: item.code } : {}),
        kind: item.orderKind,
        ...(item.details ? { details: { ...item.details } } : {}),
      });
    }
  }
  return orders;
}

/**
 * Converts an `OrderSetRecipe` into a `HierarchyNode` tree and `GroupAddPreview`
 * compatible with `OrderCatalogueRepository`.
 */
export function toOrderSetHierarchyNode(recipe: OrderSetRecipe): HierarchyNode {
  return {
    id: recipe.id,
    label: recipe.label,
    ...(recipe.code ? { code: recipe.code } : {}),
    kind: 'group',
    selectable: true,
    expanded: true,
    children: recipe.sections.map(section => ({
      id: `${recipe.id}:${section.id}`,
      label: section.label,
      kind: 'group' as const,
      selectable: true,
      expanded: true,
      children: section.items.map(item => ({
        id: item.id,
        label: item.label,
        ...(item.code ? { code: item.code } : {}),
        kind: 'item' as const,
        selectable: true,
      })),
    })),
  };
}

export function toOrderSetGroupPreview(recipe: OrderSetRecipe): GroupAddPreview {
  return {
    groupId: recipe.id,
    groupLabel: recipe.label,
    items: recipe.sections.flatMap(section =>
      section.items
        .filter(item => item.defaultSelected)
        .map(item => ({
          catalogueId: item.catalogueId,
          label: item.label,
          ...(item.code ? { code: item.code } : {}),
        })),
    ),
    duplicateIds: [],
  };
}
