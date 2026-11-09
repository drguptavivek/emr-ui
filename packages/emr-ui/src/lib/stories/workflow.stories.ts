import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type {
  ClinicalFormViewModel, ContactAttemptViewModel, DraftRecordListViewModel, DraftRecordRowView, MergeCompareViewModel, MergeSourceView
} from '@drguptavivek/emr-controller';
import { EmrContactAttemptFormComponent } from '../domain/emr-contact-attempt-form.component';
import { EmrContactAttemptSummaryComponent } from '../domain/emr-contact-attempt-summary.component';
import { EmrDraftRecordListComponent } from '../domain/emr-draft-record-list.component';
import { EmrMergeCompareComponent } from '../domain/emr-merge-compare.component';
import { EmrClinicalFormComponent } from '../structures/emr-clinical-form.component';

const meta: Meta = {
  title: 'EMR / Workflow',
  decorators: [moduleMetadata({ imports: [EmrContactAttemptFormComponent, EmrContactAttemptSummaryComponent, EmrMergeCompareComponent, EmrDraftRecordListComponent, EmrClinicalFormComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Contact attempts, merging 2–4 patient records, offline drafts and a read-only record with a correction request. All wording, eligibility (canSubmit, canConfirm, canOpen, canMove, canDiscard), the differs flag and outcome consequences come from the controller. Stories use synthetic data.'
      }
    }
  }
};
export default meta;
type Story = StoryObj;

const wrap = (inner: string, width = 720) => `<div class="emr-story-surface"><div style="max-width: ${width}px">${inner}</div></div>`;

// ---- Contact attempt ----
const contact: ContactAttemptViewModel = {
  reasonLabel: 'Missed appointment follow-up',
  numberOptions: [{ id: 'n1', label: '+91 90000 00001 (self)' }, { id: 'n2', label: '+91 90000 00002 (relative)' }],
  channelOptions: [{ id: 'call', label: 'Phone call' }, { id: 'sms', label: 'SMS' }, { id: 'visit', label: 'Home visit' }],
  outcomeOptions: [{ id: 'booked', label: 'Appointment booked' }, { id: 'wrong', label: 'Wrong number' }, { id: 'nr', label: 'No answer' }],
  canSubmit: false
};
export const ContactNoSelection: Story = { render: () => ({ props: { m: contact }, template: wrap('<emr-contact-attempt-form [model]="m" />') }) };
export const ContactWrongNumberConsequence: Story = {
  render: () => ({
    props: { m: { ...contact, selectedNumber: 'n2', selectedChannel: 'call', reached: true, selectedOutcome: 'wrong', consequence: 'Reminders to this number will stop.', canSubmit: false } },
    template: wrap('<emr-contact-attempt-form [model]="m" />')
  })
};
export const ContactReadyToSubmit: Story = {
  render: () => ({
    props: { m: { ...contact, selectedNumber: 'n1', selectedChannel: 'call', reached: false, selectedOutcome: 'nr', nextActionDate: '2026-11-15', note: 'Phone rang out twice.', canSubmit: true } },
    template: wrap('<emr-contact-attempt-form [model]="m" />')
  })
};
export const ContactDateErrorAndSubmitError: Story = {
  render: () => ({
    props: { m: { ...contact, selectedNumber: 'n1', selectedOutcome: 'nr', nextActionDate: '2020-01-01', nextActionDateError: 'Choose a date in the future.', submitError: 'The attempt could not be saved. Try again.', canSubmit: true } },
    template: wrap('<emr-contact-attempt-form [model]="m" />')
  })
};

// ---- Contact summary ----
const summary = { text: 'Last call 12-10-2026 · not reachable · 3 attempts · next 15-10-2026', statusBadge: { label: 'Follow-up due', tone: 'warning' as const } };
export const ContactSummaryWithAction: Story = { render: () => ({ props: { m: summary }, template: wrap('<emr-contact-attempt-summary [model]="m" [actionable]="true" />') }) };
export const ContactSummaryReadOnly: Story = { render: () => ({ props: { m: summary }, template: wrap('<emr-contact-attempt-summary [model]="m" />') }) };

// ---- Merge ----
const src = (id: string, label: string, name: string, ageLabel: string): MergeSourceView => ({
  id, label, name, ageLabel, sexLabel: 'Female', identifiers: [{ system: 'mrn', label: 'MRN', display: `TST-${id.toUpperCase()}-001` }]
});
const sources3 = [src('a', 'Record A', 'Test Patient A', '54 y'), src('b', 'Record B', 'Test Patient A.', '54 y'), src('c', 'Record C', 'Test Patient Alpha', '55 y')];
const merge2: MergeCompareViewModel = {
  sources: sources3.slice(0, 2),
  rows: [
    { id: 'name', label: 'Name', values: { a: 'Test Patient A', b: 'Test Patient A.' }, differs: true, chosenSourceId: 'a' },
    { id: 'phone', label: 'Phone', values: { a: '+91 90000 00001', b: '+91 90000 00001' }, differs: false },
    { id: 'addr', label: 'Address', values: { a: '1 Sample Road, Test City', b: '1 Sample Rd, Test City' }, differs: true }
  ],
  survivorSourceId: 'a',
  canConfirm: false
};
const merge3: MergeCompareViewModel = {
  sources: sources3,
  rows: [
    { id: 'name', label: 'Name', values: { a: 'Test Patient A', b: 'Test Patient A.', c: 'Test Patient Alpha' }, differs: true, chosenSourceId: 'a' },
    { id: 'dob', label: 'Date of birth', values: { a: '01-01-1972', b: '01-01-1972', c: '01-01-1971' }, differs: true, chosenSourceId: 'a' },
    { id: 'phone', label: 'Phone', values: { a: '+91 90000 00001', b: '+91 90000 00001', c: '+91 90000 00001' }, differs: false }
  ],
  survivorSourceId: 'a',
  canConfirm: true
};
export const MergeTwoSources: Story = { render: () => ({ props: { m: merge2 }, template: wrap('<emr-merge-compare [model]="m" />', 960) }) };
export const MergeThreeSources: Story = { render: () => ({ props: { m: merge3 }, template: wrap('<emr-merge-compare [model]="m" />', 1100) }) };
export const MergeNarrow: Story = { render: () => ({ props: { m: merge3 }, template: wrap('<emr-merge-compare [model]="m" />', 420) }) };

// ---- Drafts ----
const draft = (over: Partial<DraftRecordRowView> & { id: string }): DraftRecordRowView => ({
  title: 'Eye examination', subtitle: 'Visual acuity and IOP', patientLabel: 'Test Patient A · TST-A-001', updatedAtLabel: '12-10-2026 10:30',
  stateBadge: { label: 'Draft', tone: 'neutral' }, canOpen: true, canMove: false, canDiscard: true, ...over
});
const drafts: DraftRecordListViewModel = {
  state: 'ready',
  rows: [
    draft({ id: 'd1' }),
    draft({ id: 'd2', title: 'Prescription', stateBadge: { label: 'Queued to send', tone: 'info' }, canMove: true }),
    draft({ id: 'd3', title: 'Referral letter', stateBadge: { label: 'Sent', tone: 'success' }, canDiscard: false }),
    draft({ id: 'd4', title: 'Biometry', stateBadge: { label: 'Conflict', tone: 'danger' }, canMove: true })
  ]
};
export const DraftsMixed: Story = { render: () => ({ props: { m: drafts }, template: wrap('<emr-draft-record-list [model]="m" />') }) };
export const DraftsDiscardFlyoutOpen: Story = {
  render: () => ({
    props: { m: { ...drafts, pendingDiscard: { id: 'd2', title: 'Discard this draft?', body: 'The Prescription draft has not been sent and will be lost.', confirmLabel: 'Discard draft', cancelLabel: 'Keep draft' } } },
    template: wrap('<emr-draft-record-list [model]="m" />')
  })
};
export const DraftsEmpty: Story = { render: () => ({ props: { m: { rows: [], state: 'empty', message: 'Records you start offline appear here.' } }, template: wrap('<emr-draft-record-list [model]="m" />') }) };
export const DraftsLoading: Story = { render: () => ({ props: { m: { rows: [], state: 'loading' } }, template: wrap('<emr-draft-record-list [model]="m" />') }) };
export const DraftsError: Story = { render: () => ({ props: { m: { rows: [], state: 'error', message: 'The device store could not be read.' } }, template: wrap('<emr-draft-record-list [model]="m" />') }) };

// ---- Read-only clinical form with correction ----
const record: ClinicalFormViewModel = {
  schema: { id: 'visit', label: 'Visit record', sections: [{ id: 'main', label: 'Presenting concern', blocks: [
    { id: 'complaint', label: 'Chief complaint', type: 'multiline', span: 12, rows: 3 }
  ] }] },
  fields: { complaint: { value: 'Blurred vision for three months' } },
  repeatableGroups: {},
  readOnly: true,
  correction: { label: 'Wrong patient? Request correction', description: 'This record was filed under Test Patient A. If it belongs to someone else, ask for it to be corrected.' }
};
export const ReadOnlyFormWithCorrection: Story = { render: () => ({ props: { m: record }, template: wrap('<emr-clinical-form [model]="m" />') }) };
