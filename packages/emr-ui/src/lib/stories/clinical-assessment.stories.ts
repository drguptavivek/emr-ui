import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrClinicalCellRendererDirective, EmrClinicalMatrixComponent } from '../structures/emr-clinical-matrix.component';
import { EmrTimelineComponent } from '../domain/emr-timeline.component';
import { neurologySchema, neurologyValues, ophthalmologySchema, ophthalmologyValues, timelineEvents, timelineKinds } from './fixtures';

const meta: Meta = {
  title: 'EMR / Clinical assessment',
  decorators: [moduleMetadata({ imports: [EmrClinicalMatrixComponent, EmrClinicalCellRendererDirective, EmrTimelineComponent] })],
  parameters: { docs: { description: { component: 'Schema-driven clinical presentation. Specialty schemas and controller-produced values are interchangeable.' } } }
};
export default meta;
type Story = StoryObj;

const customCellSchema = {
  id: 'custom-cell-matrix',
  label: 'Custom Cell Renderer Matrix (OD / OS Stamp)',
  columns: [
    { id: 'od', label: 'Right Eye (OD)' },
    { id: 'os', label: 'Left Eye (OS)' },
  ],
  rows: [
    { id: 'gonioscopy', label: 'Gonioscopy stamp', type: 'custom', customRendererKey: 'angleStamp' },
  ],
};

const customCellValues = {
  gonioscopy: {
    remark: '4-mirror Posner goniolens',
    cells: { od: { value: 1 }, os: { value: 0 } },
  },
};

export const OphthalmologyODOS: Story = { render: () => ({ template: `<emr-clinical-matrix [definition]="schema" [model]="values" />`, props: { schema: ophthalmologySchema, values: ophthalmologyValues } }) };
export const OphthalmologyEmpty: Story = { render: () => ({ template: `<emr-clinical-matrix [definition]="schema" />`, props: { schema: ophthalmologySchema } }) };
export const OphthalmologyReadOnly: Story = { render: () => ({ template: `<emr-clinical-matrix [definition]="schema" [model]="values" [readOnly]="true" />`, props: { schema: ophthalmologySchema, values: ophthalmologyValues } }) };
export const NeurologyFourLimb: Story = { render: () => ({ template: `<emr-clinical-matrix [definition]="schema" [model]="values" />`, props: { schema: neurologySchema, values: neurologyValues } }) };
export const CustomCellRenderer: Story = {
  render: () => ({
    template: `
      <emr-clinical-matrix [definition]="schema" [model]="values">
        <ng-template emrClinicalCellRenderer="angleStamp" let-ctx>
          <button
            type="button"
            class="emr-button emr-button--outline emr-button--small"
            [attr.aria-readonly]="ctx.readOnly ? 'true' : null"
            (click)="ctx.emit('stamp', { columnId: ctx.column.id })"
          >
            Stamp Shaffer IV · {{ ctx.column.id.toUpperCase() }} ({{ ctx.cell?.value ?? 0 }})
          </button>
        </ng-template>
      </emr-clinical-matrix>
    `,
    props: { schema: customCellSchema, values: customCellValues },
  }),
};

export const EncounterTimelineVertical: Story = { render: () => ({ template: `<emr-timeline orientation="vertical" [events]="events" [kinds]="kinds" selectedId="t1" />`, props: { events: timelineEvents, kinds: timelineKinds } }) };
export const EncounterTimelineHorizontal: Story = { render: () => ({ template: `<emr-timeline orientation="horizontal" [events]="events" [kinds]="kinds" selectedId="t2" />`, props: { events: timelineEvents, kinds: timelineKinds } }) };
export const EncounterTimelineEmpty: Story = { render: () => ({ template: `<emr-timeline orientation="vertical" [events]="[]" [kinds]="kinds" />`, props: { kinds: timelineKinds } }) };
