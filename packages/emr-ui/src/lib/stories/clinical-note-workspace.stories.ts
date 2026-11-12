import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { ClinicalNoteWorkspaceViewModel } from '@drguptavivek/emr-controller';
import { EmrClinicalNoteWorkspaceComponent } from '../domain/emr-clinical-note-workspace.component';

const meta: Meta<EmrClinicalNoteWorkspaceComponent> = {
  title: 'EMR / Notes / Clinical Note Workspace',
  component: EmrClinicalNoteWorkspaceComponent,
  decorators: [moduleMetadata({ imports: [EmrClinicalNoteWorkspaceComponent] })],
  parameters: {
    docs: {
      description: {
        component: 'A controlled workspace for outpatient, inpatient and operating theatre notes. The host supplies the note, attribution, available actions, history and any section comparison. A signed snapshot stays readable alongside later addenda and amendments.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrClinicalNoteWorkspaceComponent>;

const current = {
  id: 'opd-v1',
  title: 'Signed consultation · version 1',
  metadata: ['Authored by: Dr A. Rao · Consultant', 'Signed by: Dr A. Rao · 10 Nov 2026, 09:42 IST', 'Clinical time: 10 Nov 2026, 09:30 IST'],
  sections: [
    { id: 'reason', label: 'Reason for visit', value: 'Follow-up for intermittent headache.' },
    { id: 'assessment', label: 'Assessment', value: 'Examination completed. No acute concern documented.' },
    { id: 'plan', label: 'Plan', value: 'Review symptoms at the next scheduled visit.' }
  ]
} as const;

const shared = {
  title: 'Consultation note',
  context: 'OPD · General Medicine · Encounter 10 Nov 2026',
  status: 'Signed · version 1 · Current',
  metadata: ['Patient: Synthetic example', 'Encounter: OPD-EXAMPLE-01'],
  current,
  addenda: [{
    id: 'phone-addendum',
    title: 'Telephone addendum',
    metadata: ['Entered by: Dr A. Rao · Consultant', 'Signed: 11 Nov 2026, 11:05 IST', 'Clinical time: Telephone call · 11 Nov 2026, 10:50 IST'],
    sections: [{ id: 'update', label: 'Patient update', value: 'Patient reports symptoms have settled. Continue the documented plan.' }]
  }],
  actions: [],
  queue: { title: 'Co-sign queue', emptyLabel: 'No notes await your co-signature.', entries: [] },
  history: {
    title: 'Note history',
    entries: [
      { id: 'h2', title: 'Telephone addendum signed', metadata: ['Dr A. Rao · Consultant', '11 Nov 2026, 11:05 IST', 'Version 2'], reason: 'Telephone follow-up', actions: [{ id: 'view-v2', label: 'View entry' }] },
      { id: 'h1', title: 'Original note signed · Current base', metadata: ['Dr A. Rao · Consultant', '10 Nov 2026, 09:42 IST', 'Version 1'], actions: [{ id: 'view-v1', label: 'View signed note' }] }
    ]
  }
} satisfies ClinicalNoteWorkspaceViewModel;

export const Overview: Story = { args: { model: shared } };

export const InpatientNoteAwaitingCoSignature: Story = {
  args: {
    model: {
      ...shared,
      title: 'Progress note',
      context: 'IPD · Medical ward · Encounter 10 Nov 2026',
      status: 'Awaiting co-signature · version 1',
      metadata: ['Patient: Synthetic inpatient', 'Encounter: IPD-EXAMPLE-01'],
      current: {
        id: 'ipd-v1',
        title: 'Resident progress note · Awaiting review',
        metadata: ['Authored by: Dr S. Iyer · Resident', 'Clinical time: 10 Nov 2026, 08:50 IST'],
        sections: [
          { id: 'overnight', label: 'Overnight events', value: 'No new symptoms reported on morning review.' },
          { id: 'assessment', label: 'Assessment', value: 'Ward review completed.' },
          { id: 'plan', label: 'Plan', value: 'Continue observation. Consultant co-signature pending.' }
        ]
      },
      addenda: [],
      actions: [{ id: 'cosign', label: 'Co-sign note', primary: true }, { id: 'return', label: 'Return for correction' }],
      queue: {
        title: 'Co-sign queue', emptyLabel: 'No notes await your co-signature.',
        entries: [{ id: 'ipd-1', title: 'Progress note · Synthetic inpatient', metadata: ['Dr S. Iyer · Resident', 'IPD · Medical ward', 'Awaiting your review'], actions: [{ id: 'open-ipd', label: 'Open note' }, { id: 'cosign', label: 'Co-sign' }] }]
      },
      history: undefined
    }
  }
};

export const OperatingTheatreAmendment: Story = {
  args: {
    model: {
      ...shared,
      title: 'Operative note',
      context: 'OT · General Surgery · Encounter 10 Nov 2026',
      status: 'Amended · version 2 · Current',
      metadata: ['Patient: Synthetic operative encounter', 'Encounter: OT-EXAMPLE-01'],
      current: {
        id: 'ot-v2',
        title: 'Signed operative note · version 2',
        metadata: ['Authored by: Dr A. Rao · Operating surgeon', 'Signed by: Dr A. Rao · 10 Nov 2026, 16:20 IST', 'Clinical time: 10 Nov 2026, 11:45 IST'],
        sections: [
          { id: 'procedure', label: 'Procedure', value: 'Laparoscopic cholecystectomy.' },
          { id: 'specimen', label: 'Specimen', value: 'Container label verified against theatre register.' }
        ]
      },
      addenda: [],
      history: {
        title: 'Note history',
        entries: [{ id: 'amend', title: 'Amendment signed · version 2 · Current', metadata: ['Dr A. Rao · Operating surgeon', '10 Nov 2026, 16:20 IST'], reason: 'Specimen label corrected against the theatre register.', actions: [{ id: 'view-v2', label: 'View version 2' }, { id: 'compare-v1', label: 'Compare with version 1' }] }, { id: 'base', title: 'Original operative note signed · version 1', metadata: ['Dr A. Rao · Operating surgeon', '10 Nov 2026, 12:10 IST'], actions: [{ id: 'view-v1', label: 'View original' }] }],
        comparison: { title: 'Changed sections', previousLabel: 'Version 1', currentLabel: 'Version 2', rows: [{ id: 'specimen', label: 'Specimen', previous: 'Container label not recorded.', current: 'Container label verified against theatre register.' }] }
      }
    }
  }
};
