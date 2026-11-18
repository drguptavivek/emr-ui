import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrInpatientMarComponent } from '../domain/emr-encounter-surfaces.component';
import { inpatientMarFixture } from './encounter-surfaces.stories';

const meta: Meta<EmrInpatientMarComponent> = {
  title: 'EMR / Inpatient / Inpatient eMAR',
  component: EmrInpatientMarComponent,
  decorators: [moduleMetadata({ imports: [EmrInpatientMarComponent] })],
};
export default meta;
type Story = StoryObj<EmrInpatientMarComponent>;

export const ActiveShift: Story = {
  render: () => ({
    props: { model: inpatientMarFixture },
    template: `<div class="emr-story-surface"><emr-inpatient-mar [model]="model" /></div>`,
  }),
};

export const DualSignVerified: Story = {
  render: () => ({
    props: {
      model: {
        ...inpatientMarFixture,
        orders: inpatientMarFixture.orders.map((o) => (o.highAlert ? { ...o, dualSignVerified: true } : o)),
      },
    },
    template: `<div class="emr-story-surface"><emr-inpatient-mar [model]="model" /></div>`,
  }),
};

export const ReadOnly: Story = {
  render: () => ({
    props: { model: { ...inpatientMarFixture, readOnly: true } },
    template: `<div class="emr-story-surface"><emr-inpatient-mar [model]="model" /></div>`,
  }),
};
