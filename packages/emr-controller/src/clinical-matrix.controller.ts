import { StateController } from './contracts.js';
import {
  ClinicalCellState,
  ClinicalColumn,
  ClinicalColumnGroup,
  ClinicalMatrixIntent,
  ClinicalMatrixRowValue,
  ClinicalMatrixSchema,
  ClinicalMatrixValues,
  ClinicalQuantityValue,
  ClinicalRow
} from './models.js';

export type ClinicalMatrixColumnGroupSlot =
  | {
      readonly kind: 'group';
      readonly id: string;
      readonly label: string;
      readonly columns: readonly ClinicalColumn[];
      readonly colSpan: number;
    }
  | {
      readonly kind: 'ungrouped';
      readonly columns: readonly [ClinicalColumn];
      readonly colSpan: 1;
    };

/**
 * Groups `columns` into contiguous runs matching `columnGroups` so multi-row headers
 * align 1:1 even when some columns are ungrouped or a group is split.
 */
export function groupMatrixColumns(
  columns: readonly ClinicalColumn[],
  columnGroups?: readonly ClinicalColumnGroup[]
): readonly ClinicalMatrixColumnGroupSlot[] {
  if (!columnGroups?.length) {
    return columns.map(column => ({
      kind: 'ungrouped' as const,
      columns: [column] as const,
      colSpan: 1 as const
    }));
  }
  const groupByColId = new Map<string, ClinicalColumnGroup>();
  for (const group of columnGroups) {
    for (const columnId of group.columnIds) {
      if (!groupByColId.has(columnId)) {
        groupByColId.set(columnId, group);
      }
    }
  }
  const slots: ClinicalMatrixColumnGroupSlot[] = [];
  for (const column of columns) {
    const group = groupByColId.get(column.id);
    if (!group) {
      slots.push({ kind: 'ungrouped', columns: [column], colSpan: 1 });
      continue;
    }
    const prev = slots[slots.length - 1];
    if (prev && prev.kind === 'group' && prev.id === group.id) {
      slots[slots.length - 1] = {
        ...prev,
        columns: [...prev.columns, column],
        colSpan: prev.colSpan + 1
      };
    } else {
      slots.push({
        kind: 'group',
        id: group.id,
        label: group.label,
        columns: [column],
        colSpan: 1
      });
    }
  }
  return slots;
}

export function isMatrixCellApplicable(
  row: Pick<ClinicalRow, 'applicableColumnIds'>,
  columnId: string
): boolean {
  return !row.applicableColumnIds || row.applicableColumnIds.includes(columnId);
}

function isMatrixQuantityValue(
  value: ClinicalCellState['value'] | undefined
): value is ClinicalQuantityValue {
  return typeof value === 'object' && value !== null && 'unit' in value;
}

export function formatMatrixCellValue(
  value: ClinicalCellState['value'] | undefined,
  labels: { readonly yes?: string; readonly no?: string; readonly notRecorded?: string } = {}
): string {
  const yes = labels.yes ?? 'Yes';
  const no = labels.no ?? 'No';
  const notRecorded = labels.notRecorded ?? 'Not recorded';
  if (isMatrixQuantityValue(value)) {
    return `${value.value ?? notRecorded} ${value.unit}`.trim();
  }
  if (typeof value === 'boolean') return value ? yes : no;
  return value === null || value === undefined || value === '' ? notRecorded : String(value);
}

export function resolveMatrixHeadingId(
  schemaId: string,
  headingId?: string | null,
  idPrefix = ''
): string {
  if (headingId && headingId.trim()) return headingId.trim();
  const trimmedPrefix = idPrefix.trim();
  const normalizedPrefix = trimmedPrefix
    ? trimmedPrefix.endsWith('-')
      ? trimmedPrefix
      : `${trimmedPrefix}-`
    : '';
  return `${normalizedPrefix}${schemaId}-title`;
}

export function resolveMatrixDecimalStep(
  row: Pick<ClinicalRow, 'type' | 'step' | 'precision'>
): number {
  if (typeof row.step === 'number' && Number.isFinite(row.step) && row.step > 0) {
    return row.step;
  }
  if (row.type === 'integer') return 1;
  const precision = row.precision ?? 2;
  return Number((10 ** -precision).toPrecision(12));
}

export function resolveMatrixQuantityUnit(
  row: Pick<ClinicalRow, 'unit'>,
  cell?: Pick<ClinicalCellState, 'value'>
): string {
  return isMatrixQuantityValue(cell?.value) ? cell.value.unit : row.unit ?? '';
}

export function canMutateMatrixCell(
  matrixReadOnly: boolean,
  cell?: Pick<ClinicalCellState, 'readOnly' | 'disabled'>
): boolean {
  return !matrixReadOnly && !cell?.readOnly && !cell?.disabled;
}

export function canMutateMatrixRemark(
  matrixReadOnly: boolean,
  row?: Pick<ClinicalMatrixRowValue, 'remarkReadOnly' | 'remarkDisabled'>
): boolean {
  return !matrixReadOnly && !row?.remarkReadOnly && !row?.remarkDisabled;
}

type ClinicalMatrixExternalIntent = Extract<
  ClinicalMatrixIntent,
  { type: 'cellFocused' | 'customCellIntent' | 'columnCopyRequested' | 'macroNormalRequested' }
>;

export interface ClinicalMatrixControllerState {
  schema: ClinicalMatrixSchema;
  values: ClinicalMatrixValues;
  lastExternalIntent?: ClinicalMatrixExternalIntent;
}

export type ClinicalCellValidator = (
  state: Readonly<ClinicalMatrixControllerState>,
  rowId: string,
  columnId: string
) => string | undefined;

export type ClinicalRemarkValidator = (
  state: Readonly<ClinicalMatrixControllerState>,
  rowId: string
) => string | undefined;

export class ClinicalMatrixController extends StateController<
  ClinicalMatrixControllerState,
  ClinicalMatrixIntent
> {
  constructor(
    schema: ClinicalMatrixSchema,
    values: ClinicalMatrixValues,
    private readonly validateCell?: ClinicalCellValidator,
    private readonly validateRemark?: ClinicalRemarkValidator
  ) {
    super({ schema, values });
  }

  dispatch(intent: ClinicalMatrixIntent): void {
    if (this.isDestroyed()) return;
    switch (intent.type) {
    case 'cellEditRequested': {
      this.setState(state => {
        const schemaRow = state.schema.rows.find(row => row.id === intent.rowId);
        const schemaColumn = state.schema.columns.find(column => column.id === intent.columnId);
        if (!schemaRow || !schemaColumn) return state;
        if (!isMatrixCellApplicable(schemaRow, intent.columnId)) {
          return state;
        }
        const row = state.values[intent.rowId];
        if (!row) return state;
        const previous = row.cells[intent.columnId];
        if (!previous || !canMutateMatrixCell(false, previous)) return state;
        const nextCell: ClinicalCellState = { ...previous, value: intent.value };
        const intermediate: ClinicalMatrixControllerState = {
          ...state,
          values: {
            ...state.values,
            [intent.rowId]: {
              ...row,
              cells: { ...row.cells, [intent.columnId]: nextCell }
            }
          }
        };
        const error = this.validateCell?.(
          intermediate,
          intent.rowId,
          intent.columnId
        );
        return {
          ...intermediate,
          values: {
            ...intermediate.values,
            [intent.rowId]: {
              ...intermediate.values[intent.rowId],
              cells: {
                ...intermediate.values[intent.rowId]?.cells,
                [intent.columnId]: { ...nextCell, error }
              }
            }
          }
        } as ClinicalMatrixControllerState;
      });
      break;
    }
    case 'cellAssessmentStatusEditRequested': {
      this.setState(state => {
        const row = state.values[intent.rowId];
        const previous = row?.cells[intent.columnId];
        const presentation = state.schema.rows
          .find(candidate => candidate.id === intent.rowId)
          ?.assessmentStatusOptions?.find(option => option.value === intent.status);
        if (!row || !previous || !canMutateMatrixCell(false, previous)) return state;
        if (intent.status !== null && !presentation) return state;
        const { assessmentStatus: _cleared, ...withoutStatus } = previous;
        const nextCell: ClinicalCellState = presentation
          ? { ...previous, assessmentStatus: presentation }
          : withoutStatus;
        const intermediate: ClinicalMatrixControllerState = {
          ...state,
          values: {
            ...state.values,
            [intent.rowId]: {
              ...row,
              cells: {
                ...row.cells,
                [intent.columnId]: nextCell
              }
            }
          }
        };
        const error = this.validateCell?.(
          intermediate,
          intent.rowId,
          intent.columnId
        );
        return {
          ...intermediate,
          values: {
            ...intermediate.values,
            [intent.rowId]: {
              ...intermediate.values[intent.rowId],
              cells: {
                ...intermediate.values[intent.rowId]?.cells,
                [intent.columnId]: { ...nextCell, error }
              }
            }
          }
        } as ClinicalMatrixControllerState;
      });
      break;
    }
    case 'remarkEditRequested': {
      this.setState(state => {
        const row = state.values[intent.rowId];
        if (!row || !canMutateMatrixRemark(false, row)) return state;
        const intermediate: ClinicalMatrixControllerState = {
          ...state,
          values: {
            ...state.values,
            [intent.rowId]: { ...row, remark: intent.remark }
          }
        };
        const remarkError = this.validateRemark?.(intermediate, intent.rowId);
        return {
          ...intermediate,
          values: {
            ...intermediate.values,
            [intent.rowId]: {
              ...intermediate.values[intent.rowId],
              remarkError
            }
          }
        } as ClinicalMatrixControllerState;
      });
      break;
    }
    case 'columnCopyRequested': {
      this.setState(state => {
        const nextValues: Record<string, ClinicalMatrixRowValue> = { ...state.values };
        const copiedRowIds: string[] = [];
        for (const schemaRow of state.schema.rows) {
          if (!isMatrixCellApplicable(schemaRow, intent.toColumnId)) continue;
          const row = nextValues[schemaRow.id];
          if (!row) continue;
          const src = row.cells[intent.fromColumnId];
          const dst = row.cells[intent.toColumnId];
          if (!src || !dst || !canMutateMatrixCell(false, dst)) continue;
          nextValues[schemaRow.id] = {
            ...row,
            cells: {
              ...row.cells,
              [intent.toColumnId]: { ...dst, value: src.value, modified: true }
            }
          };
          copiedRowIds.push(schemaRow.id);
        }
        const intermediate: ClinicalMatrixControllerState = {
          ...state,
          values: nextValues,
          lastExternalIntent: intent
        };
        if (!this.validateCell || copiedRowIds.length === 0) {
          return intermediate;
        }
        const validatedValues: Record<string, ClinicalMatrixRowValue> = { ...nextValues };
        for (const rowId of copiedRowIds) {
          const row = validatedValues[rowId];
          const cell = row?.cells[intent.toColumnId];
          if (!row || !cell) continue;
          const error = this.validateCell(intermediate, rowId, intent.toColumnId);
          validatedValues[rowId] = {
            ...row,
            cells: {
              ...row.cells,
              [intent.toColumnId]: { ...cell, error }
            }
          };
        }
        return { ...intermediate, values: validatedValues };
      });
      break;
    }
    case 'cellFocused':
    case 'customCellIntent':
    case 'macroNormalRequested':
      this.setState(state => ({ ...state, lastExternalIntent: intent }));
      break;
    default:
      this.assertNever(intent);
    }
  }

  private assertNever(intent: never): never {
    throw new Error(`Unsupported clinical matrix intent: ${JSON.stringify(intent)}`);
  }
}
