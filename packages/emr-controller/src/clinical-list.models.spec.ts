import { describe, expect, it } from 'vitest';
import {
  canAddClinicalListItem,
  canEditClinicalListItem,
  canRemoveClinicalListItem,
  isClinicalListItemSelectable,
  normalizeClinicalListHeadingLevel,
  normalizeClinicalListVariant,
  resolveClinicalListHeadingId,
  type ClinicalListIntent,
  type ClinicalListItem,
  type ClinicalListViewModel,
  type EmrClinicalListModel,
} from './index.js';

describe('clinical-list models and helpers', () => {
  it('normalizes variants and heading levels with safe defaults', () => {
    expect(normalizeClinicalListVariant(undefined)).toBe('outlined');
    expect(normalizeClinicalListVariant('outlined')).toBe('outlined');
    expect(normalizeClinicalListVariant('elevated')).toBe('elevated');
    expect(normalizeClinicalListVariant('filled')).toBe('filled');
    expect(normalizeClinicalListVariant('subtle')).toBe('subtle');
    expect(normalizeClinicalListVariant('invalid')).toBe('outlined');

    expect(normalizeClinicalListHeadingLevel(undefined)).toBe(2);
    expect(normalizeClinicalListHeadingLevel(3)).toBe(3);
    expect(normalizeClinicalListHeadingLevel(6)).toBe(6);
    expect(normalizeClinicalListHeadingLevel(1)).toBe(2);
    expect(normalizeClinicalListHeadingLevel(7)).toBe(2);
  });

  it('resolves deterministic heading ids with trimming and custom fallback', () => {
    expect(resolveClinicalListHeadingId(undefined)).toBe('emr-clinical-list-title');
    expect(resolveClinicalListHeadingId('   ')).toBe('emr-clinical-list-title');
    expect(resolveClinicalListHeadingId('  custom-list-heading  ')).toBe('custom-list-heading');
    expect(resolveClinicalListHeadingId('', 'emr-medication-list-title')).toBe('emr-medication-list-title');
  });

  it('enforces add, edit, remove, and selectability capability gates', () => {
    const editableItem: ClinicalListItem = { id: '1', title: 'Metformin' };
    const readOnlyItem: ClinicalListItem = { id: '2', title: 'Aspirin', readOnly: true };
    const lockedActionsItem: ClinicalListItem = {
      id: '3',
      title: 'Penicillin',
      canEdit: false,
      canRemove: false,
      selectable: false,
    };

    const activeModel: ClinicalListViewModel = { items: [editableItem, readOnlyItem] };
    expect(canAddClinicalListItem(activeModel)).toBe(true);
    expect(canAddClinicalListItem({ ...activeModel, allowAdd: false })).toBe(false);
    expect(canAddClinicalListItem({ ...activeModel, readOnly: true })).toBe(false);

    expect(canEditClinicalListItem(activeModel, editableItem)).toBe(true);
    expect(canRemoveClinicalListItem(activeModel, editableItem)).toBe(true);
    expect(canEditClinicalListItem(activeModel, readOnlyItem)).toBe(false);
    expect(canRemoveClinicalListItem(activeModel, readOnlyItem)).toBe(false);
    expect(canEditClinicalListItem(activeModel, lockedActionsItem)).toBe(false);
    expect(canRemoveClinicalListItem(activeModel, lockedActionsItem)).toBe(false);
    expect(canEditClinicalListItem({ ...activeModel, readOnly: true }, editableItem)).toBe(false);
    expect(canRemoveClinicalListItem({ ...activeModel, readOnly: true }, editableItem)).toBe(false);

    expect(isClinicalListItemSelectable(editableItem)).toBe(true);
    expect(isClinicalListItemSelectable(lockedActionsItem)).toBe(false);
    expect(isClinicalListItemSelectable(undefined)).toBe(false);
  });

  it('aliases EmrClinicalListModel to ClinicalListViewModel and includes retryRequested intent', () => {
    const model: EmrClinicalListModel = {
      title: 'Allergies',
      items: [{ id: 'a1', title: 'Penicillin', meta: 'Verified 2025', tone: 'danger' }],
      selectedId: 'a1',
      variant: 'elevated',
      loading: false,
      error: undefined,
    };
    const retry: ClinicalListIntent = { type: 'retryRequested' };
    expect(model.items[0]?.meta).toBe('Verified 2025');
    expect(retry.type).toBe('retryRequested');
  });
});
