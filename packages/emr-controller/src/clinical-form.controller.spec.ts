import { describe, expect, it } from 'vitest';
import {
  ClinicalFormController,
  canAddRepeatableItem,
  canRemoveRepeatableItem,
  isFieldShown,
  isSectionShown,
  resolveClinicalFormControlId,
  resolveClinicalFormDomId,
  resolveRepeatableControlId,
  resolveRepeatableHeadingId,
} from './clinical-form.controller';
import type { ClinicalFormViewModel, RepeatableItemState } from './clinical-form.models';

const model: ClinicalFormViewModel = {
  schema: { id: 'history', label: 'History', sections: [{ id: 'main', label: 'Main', collapsible: true, blocks: [{ id: 'hpi', label: 'HPI', type: 'multiline' }, { kind: 'repeatable', id: 'conditions', label: 'Conditions', fields: [{ id: 'name', label: 'Name', type: 'text' }] }] }] },
  fields: { hpi: { value: 'Initial' } },
  repeatableGroups: { conditions: [] },
};

describe('ClinicalFormController', () => {
  it('edits fields and repeatable items without mutating the supplied model', () => {
    const original = model.fields.hpi;
    const controller = new ClinicalFormController(model);
    controller.dispatch({ type: 'fieldEditRequested', fieldId: 'hpi', value: 'Updated' });
    controller.dispatch({ type: 'repeatItemAddRequested', groupId: 'conditions' });
    const item = controller.getSnapshot().repeatableGroups.conditions[0];
    controller.dispatch({ type: 'repeatItemEditRequested', groupId: 'conditions', itemId: item.id, fieldId: 'name', value: 'Diabetes' });
    expect(model.fields.hpi).toBe(original);
    expect(model.fields.hpi.value).toBe('Initial');
    expect(controller.getSnapshot().fields.hpi.value).toBe('Updated');
    expect(controller.getSnapshot().repeatableGroups.conditions[0].fields.name.value).toBe('Diabetes');
  });

  it('never reuses a repeat-item id already present in a rehydrated model', () => {
    const rehydrated: ClinicalFormViewModel = {
      ...model,
      repeatableGroups: { conditions: [{ id: 'conditions-1', fields: { name: { value: 'Asthma' } } }, { id: 'conditions-2', fields: { name: { value: 'Gout' } } }] },
    };
    const controller = new ClinicalFormController(rehydrated);
    controller.dispatch({ type: 'repeatItemAddRequested', groupId: 'conditions' });
    const ids = controller.getSnapshot().repeatableGroups.conditions.map(item => item.id);
    expect(new Set(ids).size).toBe(3);
    const added = ids[2];
    controller.dispatch({ type: 'repeatItemEditRequested', groupId: 'conditions', itemId: added, fieldId: 'name', value: 'New' });
    expect(controller.getSnapshot().repeatableGroups.conditions[0].fields.name.value).toBe('Asthma');
    controller.dispatch({ type: 'repeatItemRemoveRequested', groupId: 'conditions', itemId: added });
    expect(controller.getSnapshot().repeatableGroups.conditions.map(item => item.id)).toEqual(['conditions-1', 'conditions-2']);
  });

  it('toggles only collapsible sections and removes items immutably', () => {
    const controller = new ClinicalFormController(model);
    controller.dispatch({ type: 'sectionToggleRequested', sectionId: 'main' });
    expect(controller.getSnapshot().collapsedSectionIds).toEqual(['main']);
    controller.dispatch({ type: 'sectionToggleRequested', sectionId: 'hpi' });
    expect(controller.getSnapshot().collapsedSectionIds).toEqual(['main']);
    controller.dispatch({ type: 'repeatItemAddRequested', groupId: 'conditions' });
    const itemId = controller.getSnapshot().repeatableGroups.conditions[0].id;
    controller.dispatch({ type: 'repeatItemRemoveRequested', groupId: 'conditions', itemId });
    expect(controller.getSnapshot().repeatableGroups.conditions).toEqual([]);
  });

  it('does not edit a disabled or read-only state', () => {
    const disabled: ClinicalFormViewModel = { ...model, fields: { hpi: { value: 'fixed', disabled: true } } };
    const controller = new ClinicalFormController(disabled);
    controller.dispatch({ type: 'fieldEditRequested', fieldId: 'hpi', value: 'changed' });
    expect(controller.getSnapshot().fields.hpi.value).toBe('fixed');
  });

  it('keeps assessment status separate from the recorded value', () => {
    const controller = new ClinicalFormController(model);
    controller.dispatch({ type: 'fieldStatusEditRequested', fieldId: 'hpi', status: 'unable-to-assess' });
    expect(controller.getSnapshot().fields.hpi).toMatchObject({ value: 'Initial', assessmentStatus: 'unable-to-assess' });
    controller.dispatch({ type: 'fieldStatusEditRequested', fieldId: 'hpi', status: undefined });
    expect(controller.getSnapshot().fields.hpi.assessmentStatus).toBeUndefined();
  });

  it('edits matrix cells as ordinary fields keyed by the cell field id', () => {
    const controller = new ClinicalFormController({
      schema: { id: 'gl', label: 'Glaucoma', sections: [{ id: 's', label: 'Eyes', blocks: [
        { kind: 'matrix', id: 'eyes', label: 'Per eye', columns: [{ id: 'OD', label: 'OD' }, { id: 'OS', label: 'OS' }], rows: [
          { id: 'iop', label: 'IOP', cells: { OD: { id: 'IOP_RE', label: 'IOP right eye', type: 'integer' }, OS: { id: 'IOP_LE', label: 'IOP left eye', type: 'integer' } } },
        ] },
      ] }] },
      fields: { IOP_RE: { value: null }, IOP_LE: { value: 14 } },
      repeatableGroups: {},
    });
    controller.dispatch({ type: 'fieldEditRequested', fieldId: 'IOP_RE', value: 18 });
    controller.dispatch({ type: 'fieldEditRequested', fieldId: 'eyes', value: 99 }); // the block id is not a field
    expect(controller.getSnapshot().fields).toEqual({ IOP_RE: { value: 18 }, IOP_LE: { value: 14 } });
  });

  it('enforces maxItems, minItems, and item.readOnly on repeatable group mutations', () => {
    const controller = new ClinicalFormController({
      schema: {
        id: 'meds',
        label: 'Medications',
        sections: [{
          id: 'main',
          label: 'Main',
          blocks: [{
            kind: 'repeatable',
            id: 'drops',
            label: 'Drops',
            minItems: 1,
            maxItems: 2,
            fields: [{ id: 'drug', label: 'Drug', type: 'text' }],
          }],
        }],
      },
      fields: {},
      repeatableGroups: {
        drops: [{ id: 'locked-1', readOnly: true, fields: { drug: { value: 'Timolol' } } }],
      },
    });

    // Cannot remove the locked item or drop below minItems (1)
    controller.dispatch({ type: 'repeatItemRemoveRequested', groupId: 'drops', itemId: 'locked-1' });
    expect(controller.getSnapshot().repeatableGroups.drops).toHaveLength(1);

    // Can add up to maxItems (2)
    controller.dispatch({ type: 'repeatItemAddRequested', groupId: 'drops' });
    expect(controller.getSnapshot().repeatableGroups.drops).toHaveLength(2);

    // Cannot exceed maxItems (2)
    controller.dispatch({ type: 'repeatItemAddRequested', groupId: 'drops' });
    expect(controller.getSnapshot().repeatableGroups.drops).toHaveLength(2);

    // Can remove unlocked second item down to minItems (1)
    const secondId = controller.getSnapshot().repeatableGroups.drops[1].id;
    controller.dispatch({ type: 'repeatItemRemoveRequested', groupId: 'drops', itemId: secondId });
    expect(controller.getSnapshot().repeatableGroups.drops).toHaveLength(1);
    expect(controller.getSnapshot().repeatableGroups.drops[0].id).toBe('locked-1');
  });

  it('blocks removal below minItems even when the item is editable', () => {
    const controller = new ClinicalFormController({
      schema: {
        id: 'rx',
        label: 'Rx',
        sections: [{
          id: 'main',
          label: 'Main',
          blocks: [{
            kind: 'repeatable',
            id: 'items',
            label: 'Items',
            minItems: 1,
            fields: [{ id: 'name', label: 'Name', type: 'text' }],
          }],
        }],
      },
      fields: {},
      repeatableGroups: { items: [{ id: 'item-1', fields: { name: { value: 'Atropine' } } }] },
    });

    controller.dispatch({ type: 'repeatItemRemoveRequested', groupId: 'items', itemId: 'item-1' });
    expect(controller.getSnapshot().repeatableGroups.items).toHaveLength(1);
  });

  it('resolves deterministic repeatable ids and pure add/remove capability predicates', () => {
    expect(resolveRepeatableHeadingId('drops')).toBe('drops-heading');
    expect(resolveRepeatableHeadingId('drops', 'opd')).toBe('opd-drops-heading');
    expect(resolveRepeatableHeadingId('drops', 'opd-')).toBe('opd-drops-heading');
    expect(resolveRepeatableHeadingId('drops', 'opd', 'custom-heading')).toBe('custom-heading');

    expect(resolveRepeatableControlId('drops', 'i1', 'drug')).toBe('drops-i1-drug');
    expect(resolveRepeatableControlId('drops', 'i1', 'drug', 'opd')).toBe('opd-drops-i1-drug');
    expect(resolveRepeatableControlId('drops', 'i1', 'drug', 'opd-')).toBe('opd-drops-i1-drug');

    const items: RepeatableItemState[] = [
      { id: '1', fields: {} },
      { id: '2', readOnly: true, fields: {} },
    ];
    expect(canAddRepeatableItem({ maxItems: 2 }, items, false)).toBe(false);
    expect(canAddRepeatableItem({ maxItems: 3 }, items, false)).toBe(true);
    expect(canAddRepeatableItem({ maxItems: 3 }, items, true)).toBe(false);

    expect(canRemoveRepeatableItem({ minItems: 1 }, items, items[0], false)).toBe(true);
    expect(canRemoveRepeatableItem({ minItems: 2 }, items, items[0], false)).toBe(false);
    expect(canRemoveRepeatableItem({ minItems: 1 }, items, items[1], false)).toBe(false);
    expect(canRemoveRepeatableItem({ minItems: 1 }, items, items[0], true)).toBe(false);
  });

  it('initializes unseeded schema fields and repeatable item fields safely unless locked', () => {
    const partialModel: ClinicalFormViewModel = {
      schema: {
        id: 'partial',
        label: 'Partial',
        sections: [{
          id: 'main',
          label: 'Main',
          blocks: [
            { id: 'chief', label: 'Chief complaint', type: 'text' },
            { kind: 'repeatable', id: 'meds', label: 'Meds', fields: [{ id: 'drug', label: 'Drug', type: 'text' }] },
          ],
        }],
      },
      fields: {},
      repeatableGroups: {
        meds: [
          { id: 'm1', fields: {} },
          { id: 'm2', readOnly: true, fields: {} },
        ],
      },
    };
    const controller = new ClinicalFormController(partialModel);

    controller.dispatch({ type: 'fieldEditRequested', fieldId: 'chief', value: 'Blurred vision' });
    controller.dispatch({ type: 'fieldStatusEditRequested', fieldId: 'chief', status: 'unable-to-assess' });
    controller.dispatch({ type: 'repeatItemEditRequested', groupId: 'meds', itemId: 'm1', fieldId: 'drug', value: 'Timolol' });
    controller.dispatch({ type: 'repeatItemStatusEditRequested', groupId: 'meds', itemId: 'm1', fieldId: 'drug', status: 'declined' });
    // Locked item m2 must remain untouched
    controller.dispatch({ type: 'repeatItemEditRequested', groupId: 'meds', itemId: 'm2', fieldId: 'drug', value: 'Blocked' });
    controller.dispatch({ type: 'fieldFocused', fieldId: 'meds.m1.drug' });

    const snap = controller.getSnapshot();
    expect(snap.fields.chief).toEqual({ value: 'Blurred vision', assessmentStatus: 'unable-to-assess' });
    expect(snap.repeatableGroups.meds[0].fields.drug).toEqual({ value: 'Timolol', assessmentStatus: 'declined' });
    expect(snap.repeatableGroups.meds[1].fields.drug).toBeUndefined();

    // Form-level readOnly still blocks editing unseeded fields
    const readOnlyController = new ClinicalFormController({ ...partialModel, readOnly: true });
    readOnlyController.dispatch({ type: 'fieldEditRequested', fieldId: 'chief', value: 'Blocked' });
    readOnlyController.dispatch({ type: 'repeatItemEditRequested', groupId: 'meds', itemId: 'm1', fieldId: 'drug', value: 'Blocked' });
    expect(readOnlyController.getSnapshot().fields.chief).toBeUndefined();
    expect(readOnlyController.getSnapshot().repeatableGroups.meds[0].fields.drug).toBeUndefined();
  });

  it('evaluates clinical form visibility helpers (including quantity emptiness) and deterministic ids', () => {
    expect(isFieldShown(undefined)).toBe(true);
    expect(isFieldShown({ value: null, hidden: true })).toBe(false);
    expect(isFieldShown({ value: { value: null, unit: 'mmHg' }, hidden: true })).toBe(false);
    expect(isFieldShown({ value: { value: 0, unit: 'mmHg' }, hidden: true })).toBe(true);
    expect(isFieldShown({ value: false, hidden: true })).toBe(true);

    expect(
      isSectionShown(
        {
          blocks: [
            { id: 'a', label: 'A', type: 'text' },
            { kind: 'matrix', id: 'm', label: 'M', columns: [{ id: 'od', label: 'OD' }], rows: [{ id: 'r', label: 'R', cells: { od: { id: 'c1', label: 'C1', type: 'quantity', unit: 'mmHg' } } }] },
          ],
        },
        { a: { value: null, hidden: true }, c1: { value: { value: null, unit: 'mmHg' }, hidden: true } },
      ),
    ).toBe(false);
    expect(
      isSectionShown(
        {
          blocks: [
            { kind: 'matrix', id: 'm', label: 'M', columns: [{ id: 'od', label: 'OD' }], rows: [{ id: 'r', label: 'R', cells: { od: { id: 'c1', label: 'C1', type: 'quantity', unit: 'mmHg' } } }] },
          ],
        },
        { c1: { value: { value: 16, unit: 'mmHg' }, hidden: true } },
      ),
    ).toBe(true);

    expect(resolveClinicalFormDomId('history-main')).toBe('history-main');
    expect(resolveClinicalFormDomId('history-main', 'opd')).toBe('opd-history-main');
    expect(resolveClinicalFormDomId('history-main', 'opd-')).toBe('opd-history-main');
    expect(resolveClinicalFormControlId('history', 'hpi')).toBe('history-hpi');
    expect(resolveClinicalFormControlId('history', 'hpi', 'opd-')).toBe('opd-history-hpi');
    expect(resolveClinicalFormControlId('history', 'drug', 'opd', 'm1')).toBe('opd-history-m1-drug');
  });
});
