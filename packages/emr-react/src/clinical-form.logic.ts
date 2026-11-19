/** Re-exports pure L3 section-card and clinical-form controller helpers so .tsx component files keep type-only controller imports. */
import type {
  ClinicalFieldState,
  ClinicalMatrixBlockDefinition,
  ClinicalMatrixBlockRow,
} from '@drguptavivek/emr-controller';
import { isFieldShown } from '@drguptavivek/emr-controller';

export {
  isFieldShown,
  isSectionShown,
  normalizeSectionCardHeadingLevel,
  normalizeSectionCardPadding,
  normalizeSectionCardTone,
  normalizeSectionCardVariant,
  resolveClinicalFormControlId,
  resolveClinicalFormDomId,
  resolveSectionCardContentId,
  resolveSectionCardHeadingId,
  resolveSectionCardToggleLabel,
} from '@drguptavivek/emr-controller';

/** Same breakpoint as the Angular form's media query, measured on the form's own width or window fallback. */
export const CLINICAL_FORM_STACK_BELOW = 720;

export function isClinicalFormStacked(width: number, windowWidth = 0): boolean {
  const effectiveWidth = width > 0 ? width : windowWidth;
  return effectiveWidth > 0 && effectiveWidth < CLINICAL_FORM_STACK_BELOW;
}

export function clinicalFormFieldSpanPercent(span: number | undefined, stacked: boolean): `${number}%` {
  if (stacked) return '100%';
  const cols = Math.min(12, Math.max(1, span ?? 6));
  return `${(cols / 12) * 100}%` as `${number}%`;
}

export function visibleClinicalMatrixRows(
  block: ClinicalMatrixBlockDefinition,
  fields: Readonly<Record<string, ClinicalFieldState | undefined>>,
): readonly ClinicalMatrixBlockRow[] {
  return block.rows.filter(row => Object.values(row.cells).some(cell => isFieldShown(fields[cell.id])));
}

export function isClinicalMatrixRowRequired(
  row: ClinicalMatrixBlockRow,
  fields: Readonly<Record<string, ClinicalFieldState | undefined>>,
): boolean {
  return Object.values(row.cells).some(cell => fields[cell.id]?.required ?? cell.required);
}
