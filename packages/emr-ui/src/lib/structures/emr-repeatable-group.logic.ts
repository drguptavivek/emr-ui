import type {
  ClinicalFieldState,
  ClinicalFieldValue,
  RepeatableGroupDefinition,
  RepeatableItemState,
} from '@drguptavivek/emr-controller';

export const REPEATABLE_GROUP_ICON_PATHS: Readonly<{
  plus: readonly string[];
  trash: readonly string[];
  lock: readonly string[];
}> = {
  plus: ['M5 12h14', 'M12 5v14'],
  trash: [
    'M3 6h18',
    'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6',
    'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2',
  ],
  lock: [
    'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
    'M7 11V7a5 5 0 0 1 10 0v4',
  ],
};

function normalizePrefix(idPrefix?: string): string {
  return idPrefix ? idPrefix.trim().replace(/-+$/, '') : '';
}

/** Matches `@drguptavivek/emr-controller`'s `isEmptyValue` without runtime import in `emr-ui`. */
export function isEmptyRepeatableValue(value: ClinicalFieldValue | undefined): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  return (
    typeof value === 'object' &&
    'value' in value &&
    'unit' in value &&
    (value as { value: unknown }).value === null
  );
}

/** A hidden field is skipped only while empty: a hidden field with a value stays visible. */
export function isRepeatableFieldShown(state?: ClinicalFieldState): boolean {
  return !state?.hidden || !isEmptyRepeatableValue(state.value);
}

export function resolveRepeatableHeadingId(
  groupId: string,
  idPrefix?: string,
  headingId?: string,
): string {
  if (headingId && headingId.trim()) return headingId.trim();
  const prefix = normalizePrefix(idPrefix);
  return prefix ? `${prefix}-${groupId}-heading` : `${groupId}-heading`;
}

export function resolveRepeatableControlId(
  groupId: string,
  itemId: string,
  fieldId: string,
  idPrefix?: string,
): string {
  const prefix = normalizePrefix(idPrefix);
  const base = `${groupId}-${itemId}-${fieldId}`;
  return prefix ? `${prefix}-${base}` : base;
}

export function canAddRepeatableItem(
  definition: Pick<RepeatableGroupDefinition, 'maxItems'>,
  items: readonly RepeatableItemState[],
  readOnly = false,
): boolean {
  if (readOnly) return false;
  if (definition.maxItems !== undefined && items.length >= definition.maxItems) return false;
  return true;
}

export function canRemoveRepeatableItem(
  definition: Pick<RepeatableGroupDefinition, 'minItems'>,
  items: readonly RepeatableItemState[],
  item: Pick<RepeatableItemState, 'readOnly'>,
  readOnly = false,
): boolean {
  if (readOnly || item.readOnly) return false;
  if (items.length <= (definition.minItems ?? 0)) return false;
  return true;
}

export function resolveRepeatableMaxItemsHint(
  definition: Pick<RepeatableGroupDefinition, 'maxItems'>,
  items: readonly RepeatableItemState[],
  readOnly = false,
): string | undefined {
  if (readOnly || definition.maxItems === undefined || items.length < definition.maxItems) {
    return undefined;
  }
  return `Maximum ${definition.maxItems} entries`;
}
