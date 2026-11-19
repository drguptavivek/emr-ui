import type { ClinicalCellState, ClinicalQuantityValue, ClinicalRow, EmrTone } from '@drguptavivek/emr-controller';

export {
  canAddClinicalListItem,
  canChangeTimeAxisStep,
  canEditClinicalListItem,
  canMutateMatrixCell,
  canMutateMatrixRemark,
  canPanTimeAxis,
  canRemoveClinicalListItem,
  canSelectTimeAxisSlot,
  canTriggerTimeAxisIntent,
  formatMatrixCellValue,
  groupMatrixColumns,
  isClinicalListItemSelectable,
  isMatrixCellApplicable,
  normalizeClinicalListHeadingLevel,
  normalizeClinicalListVariant,
  resolveClinicalListHeadingId,
  resolveMatrixDecimalStep,
  resolveMatrixHeadingId,
  resolveMatrixQuantityUnit,
  resolveTimeAxisHeadingId,
  resolveTimeAxisId,
  resolveTimeAxisNextIndex,
  resolveTimeAxisTabStopId,
  resolveTimeAxisTickId,
} from '@drguptavivek/emr-controller';

export function resolveTimeAxisStepSelectId(axisId: string, idPrefix = ''): string {
  const prefix = idPrefix.trim().replace(/-+$/, '');
  const cleanId = axisId.trim() || 'time-axis';
  const base = prefix ? `${prefix}-emr-time-axis-${cleanId}` : `emr-time-axis-${cleanId}`;
  return `${base}-step`;
}

const VALID_TONES = new Set<EmrTone>(['neutral', 'info', 'success', 'warning', 'danger']);

export function normalizeClinicalListTone(tone?: unknown): EmrTone {
  return typeof tone === 'string' && VALID_TONES.has(tone as EmrTone) ? (tone as EmrTone) : 'neutral';
}

/** Below this container width (px) the matrix drops its table for one card per row. */
export const MATRIX_TABLE_MIN_WIDTH = 720;

/**
 * Unmeasured (0) falls back to `windowWidth` when provided (e.g. `useWindowDimensions()`)
 * so narrow viewports stack on first paint instead of flashing a wide table.
 */
export function isMatrixStacked(width: number, windowWidth = 0): boolean {
  const effectiveWidth = width > 0 ? width : windowWidth;
  return effectiveWidth > 0 && effectiveWidth < MATRIX_TABLE_MIN_WIDTH;
}

/** A row with no `applicableColumnIds` applies to every column. */
export function isApplicable(row: ClinicalRow, columnId: string): boolean {
  return !row.applicableColumnIds || row.applicableColumnIds.includes(columnId);
}

export function isQuantity(value: ClinicalCellState['value'] | undefined): value is ClinicalQuantityValue {
  return typeof value === 'object' && value !== null && 'unit' in value;
}

/** Plain-text echo of a cell for read-only display. Missing is shown, never blanked. */
export function formatCellValue(value: ClinicalCellState['value'] | undefined, text: { yes: string; no: string; notRecorded: string }): string {
  if (isQuantity(value)) return `${value.value ?? text.notRecorded} ${value.unit}`.trim();
  if (typeof value === 'boolean') return value ? text.yes : text.no;
  return value === null || value === undefined || value === '' ? text.notRecorded : String(value);
}

/** Select/boolean/text editors address the cell value as a string; boolean maps to 'true'/'false'. */
export function cellSelectValue(value: ClinicalCellState['value'] | undefined): string | null {
  if (typeof value === 'boolean') return String(value);
  return typeof value === 'string' && value !== '' ? value : null;
}

export function cellNumberValue(value: ClinicalCellState['value'] | undefined): number | null {
  if (isQuantity(value)) return value.value;
  return typeof value === 'number' ? value : null;
}

/** The unit a quantity cell shows: the value's own unit once set, else the row's. */
export function quantityUnit(row: ClinicalRow, value: ClinicalCellState['value'] | undefined): string {
  return isQuantity(value) ? value.unit : row.unit ?? '';
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

export function parseMatrixPresetValue(
  row: Pick<ClinicalRow, 'type' | 'unit'>,
  preset: string,
  cell?: Pick<ClinicalCellState, 'value'>,
): ClinicalCellState['value'] {
  if (row.type === 'quantity') {
    const parsed = Number(preset);
    return {
      value: Number.isFinite(parsed) && preset.trim() !== '' ? parsed : null,
      unit: quantityUnit(row as ClinicalRow, cell?.value),
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
