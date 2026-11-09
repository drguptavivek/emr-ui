import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import type { ClinicalFieldDefinition, ClinicalFieldState } from '@drguptavivek/emr-controller';
import { EmrFieldFrameComponent } from '../fields/emr-field-frame.component';
import { EmrTypedFieldComponent } from '../fields/emr-typed-field.component';

const meta: Meta<EmrTypedFieldComponent> = {
  title: 'EMR / Fields / Frame and Typed Field',
  component: EmrTypedFieldComponent,
  decorators: [
    moduleMetadata({
      imports: [EmrFieldFrameComponent, EmrTypedFieldComponent]
    })
  ]
};

export default meta;
type Story = StoryObj<EmrTypedFieldComponent>;

export const FieldFrameStates: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 16px; max-width: 560px;">
        <emr-field-frame label="Chief complaint" controlId="frame-hint" [required]="true" hint="Patient's own words, recorded briefly.">
          <input class="emr-control" id="frame-hint" value="Gradual painless blurring of distance vision" aria-describedby="frame-hint-message" />
        </emr-field-frame>
        <emr-field-frame label="Intraocular pressure" controlId="frame-warning" warning="Above 21 mmHg — confirm with applanation tonometry.">
          <input class="emr-control" id="frame-warning" type="number" value="24" aria-describedby="frame-warning-message" />
        </emr-field-frame>
        <emr-field-frame label="Allergy details" controlId="frame-error" [required]="true" error="Required when drug allergy is recorded.">
          <input class="emr-control" id="frame-error" value="" aria-invalid="true" aria-describedby="frame-error-message" />
        </emr-field-frame>
      </div>
    `
  })
};

const SAMPLE_FIELDS: readonly { definition: ClinicalFieldDefinition; state: ClinicalFieldState }[] = [
  {
    definition: { id: 'chief', label: 'Chief complaint', type: 'text', required: true, hint: 'Free text summary' },
    state: { value: 'Reduced near vision for 6 months', assessmentStatus: 'recorded' }
  },
  {
    definition: { id: 'iop', label: 'Intraocular pressure', type: 'quantity', unit: 'mmHg' },
    state: { value: { value: 16, unit: 'mmHg' }, assessmentStatus: 'recorded' }
  },
  {
    definition: {
      id: 'fundus',
      label: 'Dilated fundus exam',
      type: 'select',
      options: [
        { value: 'normal', label: 'Within normal limits' },
        { value: 'dr', label: 'Diabetic retinopathy changes' }
      ],
      assessmentStatusOptions: [
        { value: 'recorded', label: 'Recorded' },
        { value: 'not-assessed', label: 'Not assessed' },
        { value: 'unable-to-assess', label: 'Unable to assess (dense cataract)' },
        { value: 'declined', label: 'Declined mydriasis' }
      ]
    },
    state: { value: null, assessmentStatus: 'unable-to-assess' }
  }
];

export const TypedFieldShowcase: Story = {
  render: () => ({
    props: { fields: SAMPLE_FIELDS },
    template: `
      <div style="display: grid; gap: 16px; max-width: 560px;">
        @for (item of fields; track item.definition.id) {
          <emr-typed-field
            [controlId]="'typed-' + item.definition.id"
            [definition]="item.definition"
            [model]="item.state"
          />
        }
      </div>
    `
  })
};
