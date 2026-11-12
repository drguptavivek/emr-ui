// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import type { ClinicalNoteWorkspaceViewModel } from '@drguptavivek/emr-controller';
import {
  EmrClinicalNoteWorkspaceElement,
  registerL4ClinicalNoteElements,
} from './l4-clinical-note.js';

const mounted: EmrClinicalNoteWorkspaceElement[] = [];

const model: ClinicalNoteWorkspaceViewModel = {
  title: 'Operative note',
  context: 'OT · Theatre 2 · Case 48',
  status: 'Signed · v1',
  metadata: ['Authored by Dr Sen, Resident', 'Signed by Dr Rao, Surgeon · 11:45'],
  current: {
    id: 'note-v1',
    title: 'Original signed note',
    metadata: ['Version 1', 'Clinical event 11:30'],
    sections: [{ id: 'procedure', label: 'Procedure', value: 'Procedure completed.' }],
  },
  addenda: [],
  actions: [{ id: 'compare', label: 'Compare with v1' }],
  queue: { title: 'Co-sign queue', emptyLabel: 'No notes awaiting review', entries: [] },
  history: {
    title: 'Note history',
    entries: [{ id: 'event-v1', title: 'Original note signed · v1', metadata: ['Dr Rao · Surgeon · 11:45'], actions: [{ id: 'show-v1', label: 'View v1' }] }],
    comparison: {
      title: 'Changed sections',
      previousLabel: 'v1',
      currentLabel: 'v2',
      rows: [{ id: 'procedure', label: 'Procedure', previous: 'Procedure completed.', current: 'Procedure completed without complication.' }],
    },
  },
};

async function mount(props: Partial<EmrClinicalNoteWorkspaceElement> = {}) {
  registerL4ClinicalNoteElements();
  const element = Object.assign(document.createElement('emr-clinical-note-workspace') as EmrClinicalNoteWorkspaceElement, { model, ...props });
  mounted.push(element);
  document.body.append(element);
  await element.updateComplete;
  const intents: unknown[] = [];
  element.addEventListener('intent', (event) => intents.push((event as CustomEvent).detail));
  return { element, intents };
}

function click(element: EmrClinicalNoteWorkspaceElement, label: string) {
  const button = [...element.shadowRoot!.querySelectorAll('button')].find((item) => item.textContent?.trim() === label);
  if (!button) throw new Error(`Missing button: ${label}`);
  button.click();
}

afterEach(() => {
  for (const element of mounted.splice(0)) element.remove();
});

it('renders note attribution, immutable history and supplied comparison values', async () => {
  const { element } = await mount();
  expect(element.shadowRoot!.textContent).toContain('Signed by Dr Rao, Surgeon');
  expect(element.shadowRoot!.textContent).toContain('Original note signed · v1');
  expect(element.shadowRoot!.textContent).toContain('Procedure completed without complication.');
});

it('emits a composed intent and drops stale action and field events', async () => {
  const { element, intents } = await mount({
    model: {
      ...model,
      form: {
        title: 'Amendment draft',
        fields: [{ id: 'reason', label: 'Reason', value: 'Specimen label corrected', multiline: true }],
        actions: [{ id: 'sign-amendment', label: 'Sign amendment' }],
      },
    },
  });
  click(element, 'Sign amendment');
  const reason = element.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
  expect(reason.value).toBe('Specimen label corrected');
  reason.value = 'Specimen label corrected against register';
  reason.dispatchEvent(new Event('input', { bubbles: true }));
  expect(intents).toEqual([
    { type: 'actionRequested', actionId: 'sign-amendment' },
    { type: 'fieldChanged', fieldId: 'reason', value: 'Specimen label corrected against register' },
  ]);

  element.model = { ...element.model!, actions: [], form: undefined, queue: { title: 'Co-sign queue', emptyLabel: 'None', entries: [] }, history: undefined };
  await element.updateComplete;
  reason.value = 'stale';
  reason.dispatchEvent(new Event('input', { bubbles: true }));
  expect(intents).toHaveLength(2);
  expect(element.shadowRoot!.querySelector('textarea')).toBeNull();
});

it('rechecks an action against the latest model when clicked', async () => {
  const { element, intents } = await mount();
  const button = [...element.shadowRoot!.querySelectorAll('button')].find((item) => item.textContent?.trim() === 'Compare with v1')!;
  element.model = { ...element.model!, actions: [] };
  button.click();
  expect(intents).toEqual([]);
});

it('renders host-supplied digital verification and restores a declined field edit', async () => {
  const { element } = await mount({
    model: {
      ...model,
      signatures: [{
        signerId: 'test-signer',
        name: 'Dr Rao',
        role: 'Surgeon',
        signedAtLabel: '11:45',
        purpose: 'sign',
        method: 'digital',
        verification: { status: 'verified', label: 'Digital signature verified', verifiedAtLabel: '11:46', evidenceId: 'test-evidence' },
      }],
      form: { title: 'Amendment draft', fields: [{ id: 'reason', label: 'Reason', value: 'Accepted reason' }], actions: [] },
    },
  });
  expect(element.shadowRoot!.textContent).toContain('Digital signature verified · 11:46');
  const input = element.shadowRoot!.querySelector('input')!;
  input.value = 'Declined edit';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await element.updateComplete;
  expect(input.value).toBe('Accepted reason');
});
