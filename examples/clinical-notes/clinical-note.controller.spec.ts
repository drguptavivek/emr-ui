import { describe, expect, it } from 'vitest';
import { createClinicalNoteDemo } from './clinical-note.fixture';
import type { ClinicalNoteWorkspaceController } from './clinical-note.controller';

function findAction(controller: ClinicalNoteWorkspaceController, kind: string) {
  const model = controller.getSnapshot();
  return [
    ...model.actions,
    ...(model.form?.actions ?? []),
    ...model.queue.entries.flatMap(entry => entry.actions),
    ...(model.history?.entries.flatMap(entry => entry.actions) ?? []),
  ].find(action => action.id.endsWith(`|${kind}`));
}
function intent(controller: ClinicalNoteWorkspaceController, kind: string) {
  const actionId = findAction(controller, kind)?.id;
  if (!actionId) throw new Error(`Missing available action ${kind}`);
  controller.dispatch({ type: 'actionRequested', actionId });
}
function field(controller: ClinicalNoteWorkspaceController, label: string, value: string) {
  const fieldId = controller.getSnapshot().form?.fields.find(item => item.label === label)?.id;
  if (!fieldId) throw new Error(`Missing editable field ${label}`);
  controller.dispatch({ type: 'fieldChanged', fieldId, value });
}

describe('shared clinical note examples', () => {
  it('binds a signature to the current preview and gives each OPD addendum its own history entry', () => {
    const controller = createClinicalNoteDemo('opd', () => '11 Nov 2026 · 16:20');
    intent(controller, 'review-note');
    const staleSign = findAction(controller, 'sign-note')!.id;
    intent(controller, 'edit-note');
    field(controller, 'Plan', 'Discuss at follow-up.');
    intent(controller, 'review-note');
    controller.dispatch({ type: 'actionRequested', actionId: staleSign });
    expect(controller.getSnapshot().current).toBeUndefined();
    intent(controller, 'sign-note');
    const original = controller.getSnapshot().current!.sections;

    for (const update of ['Patient called to report improvement.', 'Follow-up appointment confirmed.']) {
      intent(controller, 'addendum');
      field(controller, 'Telephone call time', '11 Nov 2026 · 15:30');
      field(controller, 'Telephone update', update);
      intent(controller, 'review-addendum');
      intent(controller, 'sign-addendum');
    }

    expect(controller.getSnapshot().current!.sections).toEqual(original);
    expect(controller.getSnapshot().addenda[0]?.metadata).toContain('Clinical event: 11 Nov 2026 · 15:30');
    expect(controller.getSnapshot().addenda[0]?.signatures?.[0]?.signedAtLabel).toBe('11 Nov 2026 · 16:20');
    expect(controller.getSnapshot().history?.entries[0]?.title).toBe('Telephone addendum signed');
    intent(controller, 'view:addendum-1');
    expect(controller.getSnapshot().history?.snapshot?.sections[0]?.value).toBe('Patient called to report improvement.');
  });

  it('lets the assigned consultant review, return and co-sign the exact IPD revision', () => {
    const controller = createClinicalNoteDemo('ipd');
    expect(controller.getSnapshot().queue.entries).toHaveLength(0);
    expect(controller.getSnapshot().status).toBe('Signed · v1 · Awaiting co-signature');
    controller.selectActor('reviewer');
    expect(controller.getSnapshot().queue.entries).toHaveLength(1);
    intent(controller, 'review-cosign');
    expect(controller.getSnapshot().review?.sections[0]?.value).toContain('Rested comfortably.');
    const staleCoSign = findAction(controller, 'cosign-note')!.id;
    intent(controller, 'return-note');
    expect(findAction(controller, 'confirm-return')).toBeUndefined();
    field(controller, 'Reason for return', 'Please clarify the fluid balance.');
    intent(controller, 'confirm-return');
    expect(controller.getSnapshot().queue.entries).toHaveLength(0);
    controller.selectActor('author');
    field(controller, 'Plan', 'Continue treatment and document the fluid balance.');
    intent(controller, 'review-note');
    intent(controller, 'sign-note');
    expect(controller.getSnapshot().status).toBe('Amended · v2 · Awaiting co-signature');
    controller.selectActor('reviewer');
    intent(controller, 'review-cosign');
    controller.dispatch({ type: 'actionRequested', actionId: staleCoSign });
    expect(controller.getSnapshot().status).toBe('Amended · v2 · Awaiting co-signature');
    intent(controller, 'cosign-note');
    expect(controller.getSnapshot().status).toBe('Amended · v2');
    expect(controller.getSnapshot().signatures?.[1]).toMatchObject({ purpose: 'co-sign', name: 'Dr Meera Iyer' });
  });

  it('retains the current signed OT note through amendment review and compares only changed sections', () => {
    const controller = createClinicalNoteDemo('ot');
    intent(controller, 'start-amendment');
    expect(controller.getSnapshot().status).toBe('Signed · v1 · Amendment draft');
    expect(findAction(controller, 'review-amendment')).toBeUndefined();
    field(controller, 'Specimen', 'Specimen label verified against the theatre register.');
    field(controller, 'Reason for amendment', 'Corrected pathology accession.');
    intent(controller, 'review-amendment');
    expect(controller.getSnapshot().current?.sections.find(section => section.id === 'specimen')?.value).toBe('Gallbladder sent to pathology.');
    intent(controller, 'sign-amendment');
    expect(controller.getSnapshot().status).toBe('Amended · v2');
    intent(controller, 'compare:1:2');
    expect(controller.getSnapshot().history?.comparison?.rows).toEqual([{
      id: 'specimen', label: 'Specimen', previous: 'Gallbladder sent to pathology.',
      current: 'Specimen label verified against the theatre register.',
    }]);
    expect(controller.getSnapshot().history?.entries[0]?.reason).toBe('Corrected pathology accession.');
  });

  it('rejects actions and field changes issued for another note', () => {
    const opd = createClinicalNoteDemo('opd');
    intent(opd, 'review-note');
    intent(opd, 'sign-note');
    const ot = createClinicalNoteDemo('ot');
    intent(ot, 'history');
    intent(ot, 'close-history');
    const wrongAction = findAction(opd, 'enter-error')!.id;
    ot.dispatch({ type: 'actionRequested', actionId: wrongAction });
    expect(ot.getSnapshot().form).toBeUndefined();
    const otherOt = createClinicalNoteDemo('ot');
    intent(otherOt, 'history');
    intent(otherOt, 'close-history');
    const wrongInstance = findAction(otherOt, 'start-amendment')!.id;
    ot.dispatch({ type: 'actionRequested', actionId: wrongInstance });
    expect(ot.getSnapshot().form).toBeUndefined();
    const firstDraft = createClinicalNoteDemo('opd');
    const secondDraft = createClinicalNoteDemo('opd');
    const plan = firstDraft.getSnapshot().form!.fields.find(field => field.label === 'Plan')!;
    secondDraft.dispatch({ type: 'fieldChanged', fieldId: plan.id, value: 'Wrong note edit' });
    expect(secondDraft.getSnapshot().form!.fields.some(field => field.value === 'Wrong note edit')).toBe(false);
  });

  it('hides entered-in-error content from routine view and blocks stale author actions for readers', () => {
    const controller = createClinicalNoteDemo('ot');
    const stale = findAction(controller, 'enter-error')!.id;
    controller.selectActor('clinician');
    controller.dispatch({ type: 'actionRequested', actionId: stale });
    expect(controller.getSnapshot().form).toBeUndefined();
    controller.selectActor('reviewer');
    expect(findAction(controller, 'enter-error')).toBeUndefined();
    controller.selectActor('author');
    intent(controller, 'enter-error');
    expect(findAction(controller, 'confirm-enter-error')).toBeUndefined();
    field(controller, 'Reason', 'Duplicate note created in error.');
    intent(controller, 'confirm-enter-error');
    expect(controller.getSnapshot().status).toBe('Entered in error');
    expect(controller.getSnapshot().current).toBeUndefined();
    expect(controller.getSnapshot().history?.entries[0]?.reason).toBe('Duplicate note created in error.');
    intent(controller, 'view:signed-1');
    expect(controller.getSnapshot().history?.snapshot?.title).toContain('v1');
    controller.selectActor('clinician');
    expect(findAction(controller, 'history')).toBeUndefined();
    expect(controller.getSnapshot().history).toBeUndefined();
  });
});
