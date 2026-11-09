import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import type { RepeatableGroupDefinition, RepeatableItemState } from '@drguptavivek/emr-controller';
import { EmrRepeatableGroupComponent } from '../structures/emr-repeatable-group.component';
import { EmrSectionCardComponent } from '../structures/emr-section-card.component';

const meta: Meta<EmrSectionCardComponent> = {
  title: 'EMR / Structures / Section Card and Repeatable Group',
  component: EmrSectionCardComponent,
  decorators: [
    moduleMetadata({
      imports: [EmrSectionCardComponent, EmrRepeatableGroupComponent]
    })
  ]
};

export default meta;
type Story = StoryObj<EmrSectionCardComponent>;

export const SectionCardCollapsible: Story = {
  render: () => ({
    props: {
      collapsed: false,
      status: { label: '2 recorded', tone: 'info' as const }
    },
    template: `
      <emr-section-card
        sectionId="anterior-segment"
        label="Anterior segment findings"
        description="Slit-lamp biomicroscopy observations by eye."
        [status]="status"
        [collapsible]="true"
        [collapsed]="collapsed"
        (toggleRequested)="collapsed = !collapsed"
      >
        <p style="margin: 0;">Cornea clear, anterior chamber deep and quiet in both eyes.</p>
      </emr-section-card>
    `
  })
};

const SURGERY_GROUP: RepeatableGroupDefinition = {
  id: 'past-ocular-surgeries',
  kind: 'repeatable',
  label: 'Past ocular surgeries',
  description: 'Record each prior ophthalmic procedure separately.',
  addLabel: 'Add procedure',
  fields: [
    { id: 'procedure', label: 'Procedure', type: 'text', required: true },
    {
      id: 'eye',
      label: 'Eye',
      type: 'select',
      options: [
        { value: 'OD', label: 'Right eye (OD)' },
        { value: 'OS', label: 'Left eye (OS)' },
        { value: 'OU', label: 'Both eyes (OU)' }
      ]
    },
    { id: 'year', label: 'Year', type: 'integer' }
  ]
};

const SURGERY_ITEMS: readonly RepeatableItemState[] = [
  {
    id: 'item-1',
    label: 'Procedure 1',
    fields: {
      procedure: { value: 'Phacoemulsification with PCIOL' },
      eye: { value: 'OD' },
      year: { value: 2023 }
    }
  }
];

export const RepeatableGroupPopulated: Story = {
  render: () => ({
    props: { definition: SURGERY_GROUP, items: SURGERY_ITEMS },
    template: `<emr-repeatable-group [definition]="definition" [model]="items" />`
  })
};

export const RepeatableGroupEmpty: Story = {
  render: () => ({
    props: { definition: SURGERY_GROUP, items: [] },
    template: `<emr-repeatable-group [definition]="definition" [model]="items" />`
  })
};
