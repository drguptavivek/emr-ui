import type {
  ClinicalFieldState,
  ClinicalFieldValue,
  ClinicalFormSection,
  ClinicalMatrixBlockDefinition,
  ClinicalMatrixBlockRow,
} from '@drguptavivek/emr-controller';

function normalizePrefix(idPrefix?: string): string {
  return idPrefix ? idPrefix.trim().replace(/-+$/, '') : '';
}

/** Matches `@drguptavivek/emr-controller`'s `isEmptyValue` without runtime import in `emr-ui`. */
export function isClinicalFormEmptyValue(value: ClinicalFieldValue | undefined): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  return (
    typeof value === 'object' &&
    'value' in value &&
    'unit' in value &&
    (value as { value: unknown }).value === null
  );
}

/** A hidden field is skipped only while empty: a hidden field that still holds a value is clinical data and stays visible. */
export function isClinicalFormFieldShown(state?: ClinicalFieldState): boolean {
  return !state?.hidden || !isClinicalFormEmptyValue(state.value);
}

/** A section is drawn while any block would show; repeatables always count (they carry Add). */
export function isClinicalFormSectionShown(
  section: ClinicalFormSection,
  fields: Readonly<Record<string, ClinicalFieldState | undefined>>,
): boolean {
  return section.blocks.some((block) => {
    if (block.kind === 'repeatable') return true;
    if (block.kind === 'matrix') {
      return block.rows.some((row) =>
        Object.values(row.cells).some((cell) => isClinicalFormFieldShown(fields[cell.id])),
      );
    }
    return isClinicalFormFieldShown(fields[block.id]);
  });
}

export function resolveClinicalFormDomId(value: string, idPrefix = ''): string {
  const prefix = normalizePrefix(idPrefix);
  return prefix ? `${prefix}-${value}` : value;
}

export function resolveClinicalFormControlId(
  schemaId: string,
  fieldId: string,
  idPrefix = '',
  itemId?: string,
): string {
  const base = `${schemaId}-${itemId ? `${itemId}-` : ''}${fieldId}`;
  return resolveClinicalFormDomId(base, idPrefix);
}

export function visibleMatrixRows(
  block: ClinicalMatrixBlockDefinition,
  fields: Readonly<Record<string, ClinicalFieldState | undefined>>,
): readonly ClinicalMatrixBlockRow[] {
  return block.rows.filter((row) =>
    Object.values(row.cells).some((cell) => isClinicalFormFieldShown(fields[cell.id])),
  );
}

export function isMatrixRowRequired(
  row: ClinicalMatrixBlockRow,
  fields: Readonly<Record<string, ClinicalFieldState | undefined>>,
): boolean {
  return Object.values(row.cells).some((cell) => fields[cell.id]?.required ?? cell.required ?? false);
}
