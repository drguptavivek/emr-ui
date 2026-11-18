import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrPacsViewerComponent } from '../domain/emr-encounter-surfaces.component';
import { pacsViewerFixture } from './encounter-surfaces.stories';

const meta: Meta<EmrPacsViewerComponent> = {
  title: 'EMR / Diagnostics / PACS viewer',
  component: EmrPacsViewerComponent,
  decorators: [moduleMetadata({ imports: [EmrPacsViewerComponent] })],
};
export default meta;
type Story = StoryObj<EmrPacsViewerComponent>;

export const TwoUpOdOs: Story = {
  render: () => ({
    props: { model: pacsViewerFixture },
    template: `<div class="emr-story-surface"><emr-pacs-viewer [model]="model" /></div>`,
  }),
};

export const SingleViewportInverted: Story = {
  render: () => ({
    props: {
      model: {
        ...pacsViewerFixture,
        layoutMode: '1-up' as const,
        studies: pacsViewerFixture.studies.map((s, i) => (i === 0 ? { ...s, inverted: true } : s)),
      },
    },
    template: `<div class="emr-story-surface"><emr-pacs-viewer [model]="model" /></div>`,
  }),
};

export const ReadOnly: Story = {
  render: () => ({
    props: { model: { ...pacsViewerFixture, readOnly: true } },
    template: `<div class="emr-story-surface"><emr-pacs-viewer [model]="model" /></div>`,
  }),
};
