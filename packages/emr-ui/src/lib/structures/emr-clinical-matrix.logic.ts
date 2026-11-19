import type {
  ClinicalCellState,
  ClinicalColumn,
  ClinicalColumnGroup,
  ClinicalMatrixRowValue,
  ClinicalQuantityValue,
  ClinicalRow,
} from '@drguptavivek/emr-controller';

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

export function groupMatrixColumns(
  columns: readonly ClinicalColumn[],
  columnGroups?: readonly ClinicalColumnGroup[],
): readonly ClinicalMatrixColumnGroupSlot[] {
  if (!columnGroups?.length) {
    return columns.map((column) => ({
      kind: 'ungrouped' as const,
      columns: [column] as const,
      colSpan: 1 as const,
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
        colSpan: prev.colSpan + 1,
      };
    } else {
      slots.push({
        kind: 'group',
        id: group.id,
        label: group.label,
        columns: [column],
        colSpan: 1,
      });
    }
  }
  return slots;
}

export function isMatrixCellApplicable(
  row: Pick<ClinicalRow, 'applicableColumnIds'>,
  columnId: string,
): boolean {
  return !row.applicableColumnIds || row.applicableColumnIds.includes(columnId);
}

export function isMatrixQuantity(
  value: ClinicalCellState['value'] | undefined,
): value is ClinicalQuantityValue {
  return typeof value === 'object' && value !== null && 'unit' in value;
}

export function formatMatrixCellValue(
  value: ClinicalCellState['value'] | undefined,
  labels: { readonly yes?: string; readonly no?: string; readonly notRecorded?: string } = {},
): string {
  const yes = labels.yes ?? 'Yes';
  const no = labels.no ?? 'No';
  const notRecorded = labels.notRecorded ?? 'Not recorded';
  if (isMatrixQuantity(value)) {
    return `${value.value ?? notRecorded} ${value.unit}`.trim();
  }
  if (typeof value === 'boolean') return value ? yes : no;
  return value === null || value === undefined || value === '' ? notRecorded : String(value);
}

export function resolveMatrixHeadingId(
  schemaId: string,
  headingId?: string | null,
  idPrefix = '',
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

export function resolveMatrixDomId(idPrefix: string, ...parts: readonly string[]): string {
  const trimmedPrefix = idPrefix.trim();
  const prefix = trimmedPrefix
    ? trimmedPrefix.endsWith('-')
      ? trimmedPrefix.slice(0, -1)
      : trimmedPrefix
    : '';
  return [prefix, ...parts].filter(Boolean).join('-');
}

export function resolveMatrixDecimalStep(
  row: Pick<ClinicalRow, 'type' | 'step' | 'precision'>,
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
  cell?: Pick<ClinicalCellState, 'value'>,
): string {
  return isMatrixQuantity(cell?.value) ? cell.value.unit : row.unit ?? '';
}

export function canMutateMatrixCell(
  matrixReadOnly: boolean,
  cell?: Pick<ClinicalCellState, 'readOnly' | 'disabled'>,
): boolean {
  return !matrixReadOnly && !cell?.readOnly && !cell?.disabled;
}

export function canMutateMatrixRemark(
  matrixReadOnly: boolean,
  row?: Pick<ClinicalMatrixRowValue, 'remarkReadOnly' | 'remarkDisabled'>,
): boolean {
  return !matrixReadOnly && !row?.remarkReadOnly && !row?.remarkDisabled;
}

export function parseMatrixPresetValue(
  row: Pick<ClinicalRow, 'type' | 'unit'>,
  preset: string,
  cell?: Pick<ClinicalCellState, 'value'>,
): ClinicalCellState['value'] {
  if (row.type === 'quantity') {
    const parsed = Number(preset);
    return {
      value: Number.isFinite(parsed) && preset.trim() !== '' ? parsed : null,
      unit: resolveMatrixQuantityUnit(row, cell),
    };
  }
  if (row.type === 'integer' || row.type === 'decimal') {
    const parsed = Number(preset);
    return Number.isFinite(parsed) && preset.trim() !== '' ? parsed : null;
  }
  if (row.type === 'boolean') {
    if (preset === 'true') return true;
    if (preset === 'false') return false;
    return null;
  }
  return preset;
}
