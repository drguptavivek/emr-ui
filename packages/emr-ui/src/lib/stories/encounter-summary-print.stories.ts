import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrEncounterSummaryPrintComponent } from '../domain/emr-encounter-surfaces.component';
import { encounterSummaryPrintFixture } from './encounter-surfaces.stories';

const meta: Meta<EmrEncounterSummaryPrintComponent> = {
  title: 'EMR / Encounter / Summary print',
  component: EmrEncounterSummaryPrintComponent,
  decorators: [moduleMetadata({ imports: [EmrEncounterSummaryPrintComponent] })],
};
export default meta;
type Story = StoryObj<EmrEncounterSummaryPrintComponent>;

export const OpdPrescription: Story = {
  render: () => ({
    props: { model: encounterSummaryPrintFixture },
    template: `<div class="emr-story-surface"><emr-encounter-summary-print [model]="model" /></div>`,
  }),
};

export const IpdDischargeSummary: Story = {
  render: () => ({
    props: { model: { ...encounterSummaryPrintFixture, documentMode: 'ipd-discharge' as const } },
    template: `<div class="emr-story-surface"><emr-encounter-summary-print [model]="model" /></div>`,
  }),
};
