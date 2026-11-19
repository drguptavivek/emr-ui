import { StateController } from './contracts.js';
import { isEmptyValue } from './form-logic.js';
import type {
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFieldValue,
  ClinicalFormIntent,
  ClinicalFormSection,
  ClinicalFormViewModel,
  RepeatableGroupDefinition,
  RepeatableItemState,
} from './clinical-form.models.js';

function normalizePrefix(idPrefix?: string): string {
  return idPrefix ? idPrefix.trim().replace(/-+$/, '') : '';
}

/** A hidden field is skipped only while empty: a hidden field with a value stays visible. */
export function isFieldShown(state?: { hidden?: boolean; value: ClinicalFieldValue }): boolean {
  return !state?.hidden || !isEmptyValue(state.value);
}

/** A section is drawn while any block in it would show; repeatables always count (they carry Add). */
export function isSectionShown(
  section: Pick<ClinicalFormSection, 'blocks'>,
  fields: Readonly<Record<string, ClinicalFieldState | undefined>>,
): boolean {
  return section.blocks.some(block => {
    if (block.kind === 'repeatable') return true;
    if (block.kind === 'matrix') {
      return block.rows.some(row => Object.values(row.cells).some(cell => isFieldShown(fields[cell.id])));
    }
    return isFieldShown(fields[block.id]);
  });
}

/** Resolves a deterministic DOM id for a clinical form section or element. */
export function resolveClinicalFormDomId(value: string, idPrefix?: string): string {
  const prefix = normalizePrefix(idPrefix);
  return prefix ? `${prefix}-${value}` : value;
}

/** Resolves a deterministic control id for a field inside a clinical form. */
export function resolveClinicalFormControlId(
  schemaId: string,
  fieldId: string,
  idPrefix?: string,
  itemId?: string,
): string {
  const base = `${schemaId}-${itemId ? `${itemId}-` : ''}${fieldId}`;
  return resolveClinicalFormDomId(base, idPrefix);
}

/** Resolves the deterministic heading id for a repeatable group region. */
export function resolveRepeatableHeadingId(
  groupId: string,
  idPrefix?: string,
  headingId?: string,
): string {
  if (headingId && headingId.trim()) return headingId.trim();
  const prefix = normalizePrefix(idPrefix);
  return prefix ? `${prefix}-${groupId}-heading` : `${groupId}-heading`;
}

/** Resolves the deterministic control id for a field inside a repeatable item. */
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

/** Returns true when a repeatable group can accept another item. */
export function canAddRepeatableItem(
  definition: Pick<RepeatableGroupDefinition, 'maxItems'>,
  items: readonly RepeatableItemState[],
  readOnly = false,
): boolean {
  if (readOnly) return false;
  if (definition.maxItems !== undefined && items.length >= definition.maxItems) return false;
  return true;
}

/** Returns true when a specific item in a repeatable group can be removed. */
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

/** Pure state adapter for the schema-driven clinical form presentation. */
export class ClinicalFormController extends StateController<ClinicalFormViewModel, ClinicalFormIntent> {
  private sequence = 0;

  constructor(initial: ClinicalFormViewModel) {
    super({
      ...initial,
      fields: { ...initial.fields },
      repeatableGroups: Object.fromEntries(Object.entries(initial.repeatableGroups).map(([key, value]) => [key, [...value]])),
      collapsedSectionIds: [...(initial.collapsedSectionIds ?? [])],
    });
  }

  dispatch(intent: ClinicalFormIntent): void {
    if (this.isDestroyed()) return;
    switch (intent.type) {
      case 'fieldEditRequested':
        this.editField(intent.fieldId, intent.value);
        return;
      case 'fieldStatusEditRequested':
        this.editFieldStatus(intent.fieldId, intent.status);
        return;
      case 'fieldFocused':
        return;
      case 'repeatItemAddRequested':
        this.addItem(intent.groupId);
        return;
      case 'repeatItemEditRequested':
        this.editItem(intent.groupId, intent.itemId, intent.fieldId, intent.value);
        return;
      case 'repeatItemStatusEditRequested':
        this.editItemStatus(intent.groupId, intent.itemId, intent.fieldId, intent.status);
        return;
      case 'repeatItemRemoveRequested':
        this.removeItem(intent.groupId, intent.itemId);
        return;
      case 'sectionToggleRequested':
        this.toggleSection(intent.sectionId);
        return;
      case 'correctionRequested':
        return; // the app files the correction request; the form state does not change
    }
  }

  private fieldDefinition(fieldId: string): ClinicalFieldDefinition | undefined {
    for (const section of this.getSnapshot().schema.sections) {
      for (const block of section.blocks) {
        if (block.kind === 'repeatable') continue;
        if (block.kind === 'matrix') {
          for (const row of block.rows) {
            const cell = Object.values(row.cells).find(candidate => candidate.id === fieldId);
            if (cell) return cell;
          }
          continue;
        }
        if (block.id === fieldId) return block;
      }
    }
    return undefined;
  }

  private groupDefinition(groupId: string): RepeatableGroupDefinition | undefined {
    for (const section of this.getSnapshot().schema.sections) {
      const block = section.blocks.find(candidate => candidate.kind === 'repeatable' && candidate.id === groupId);
      if (block?.kind === 'repeatable') return block;
    }
    return undefined;
  }

  private editField(fieldId: string, value: ClinicalFieldState['value']): void {
    if (!this.fieldDefinition(fieldId)) return;
    this.setState(state => {
      const current = state.fields[fieldId];
      if (state.readOnly || current?.readOnly || current?.disabled) return state;
      const next: ClinicalFieldState = current ? { ...current, value } : { value };
      return { ...state, fields: { ...state.fields, [fieldId]: next } };
    });
  }

  private editFieldStatus(fieldId: string, status: ClinicalFieldState['assessmentStatus']): void {
    if (!this.fieldDefinition(fieldId)) return;
    this.setState(state => {
      const current = state.fields[fieldId];
      if (state.readOnly || current?.readOnly || current?.disabled) return state;
      const next: ClinicalFieldState = current
        ? { ...current, assessmentStatus: status }
        : { value: null, assessmentStatus: status };
      return { ...state, fields: { ...state.fields, [fieldId]: next } };
    });
  }

  private addItem(groupId: string): void {
    const definition = this.groupDefinition(groupId);
    if (!definition) return;
    this.setState(state => {
      if (state.readOnly) return state;
      const existing = state.repeatableGroups[groupId] ?? [];
      if (definition.maxItems !== undefined && existing.length >= definition.maxItems) return state;
      // Rehydrated models may already hold ids from a prior session; never reuse one —
      // a duplicate id makes editItem/removeItem hit every matching row.
      const taken = new Set(existing.map(item => item.id));
      let id = `${groupId}-${++this.sequence}`;
      while (taken.has(id)) id = `${groupId}-${++this.sequence}`;
      const fields: Readonly<Record<string, ClinicalFieldState>> = Object.fromEntries(
        definition.fields.map(field => [field.id, { value: null }])
      );
      const item: RepeatableItemState = { id, fields };
      return {
        ...state,
        repeatableGroups: { ...state.repeatableGroups, [groupId]: [...existing, item] },
      };
    });
  }

  private editItem(groupId: string, itemId: string, fieldId: string, value: ClinicalFieldState['value']): void {
    const definition = this.groupDefinition(groupId);
    if (!definition || !definition.fields.some(field => field.id === fieldId)) return;
    this.setState(state => {
      if (state.readOnly) return state;
      const item = state.repeatableGroups[groupId]?.find(candidate => candidate.id === itemId);
      if (!item || item.readOnly) return state;
      const current = item.fields[fieldId];
      if (current?.readOnly || current?.disabled) return state;
      const nextField: ClinicalFieldState = current ? { ...current, value } : { value };
      const items = state.repeatableGroups[groupId].map(candidate => candidate.id === itemId
        ? { ...candidate, fields: { ...candidate.fields, [fieldId]: nextField } }
        : candidate);
      return { ...state, repeatableGroups: { ...state.repeatableGroups, [groupId]: items } };
    });
  }

  private editItemStatus(groupId: string, itemId: string, fieldId: string, status: ClinicalFieldState['assessmentStatus']): void {
    const definition = this.groupDefinition(groupId);
    if (!definition || !definition.fields.some(field => field.id === fieldId)) return;
    this.setState(state => {
      if (state.readOnly) return state;
      const item = state.repeatableGroups[groupId]?.find(candidate => candidate.id === itemId);
      if (!item || item.readOnly) return state;
      const current = item.fields[fieldId];
      if (current?.readOnly || current?.disabled) return state;
      const nextField: ClinicalFieldState = current
        ? { ...current, assessmentStatus: status }
        : { value: null, assessmentStatus: status };
      const items = state.repeatableGroups[groupId].map(candidate => candidate.id === itemId
        ? { ...candidate, fields: { ...candidate.fields, [fieldId]: nextField } }
        : candidate);
      return { ...state, repeatableGroups: { ...state.repeatableGroups, [groupId]: items } };
    });
  }

  private removeItem(groupId: string, itemId: string): void {
    const definition = this.groupDefinition(groupId);
    if (!definition) return;
    this.setState(state => {
      if (state.readOnly) return state;
      const items = state.repeatableGroups[groupId] ?? [];
      const item = items.find(candidate => candidate.id === itemId);
      if (!item || item.readOnly || items.length <= (definition.minItems ?? 0)) return state;
      return {
        ...state,
        repeatableGroups: { ...state.repeatableGroups, [groupId]: items.filter(candidate => candidate.id !== itemId) },
      };
    });
  }

  private toggleSection(sectionId: string): void {
    if (!this.getSnapshot().schema.sections.some(section => section.id === sectionId && section.collapsible)) return;
    this.setState(state => {
      const collapsed = new Set(state.collapsedSectionIds ?? []);
      if (collapsed.has(sectionId)) collapsed.delete(sectionId); else collapsed.add(sectionId);
      return { ...state, collapsedSectionIds: [...collapsed] };
    });
  }
}
