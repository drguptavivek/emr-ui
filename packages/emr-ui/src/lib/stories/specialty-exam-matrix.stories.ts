import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrSpecialtyExamMatrixComponent } from '../domain/emr-encounter-surfaces.component';
import { specialtyExamMatrixFixture } from './encounter-surfaces.stories';

const meta: Meta<EmrSpecialtyExamMatrixComponent> = {
  title: 'EMR / Clinical assessment / Specialty exam matrix',
  component: EmrSpecialtyExamMatrixComponent,
  decorators: [moduleMetadata({ imports: [EmrSpecialtyExamMatrixComponent] })],
};
export default meta;
type Story = StoryObj<EmrSpecialtyExamMatrixComponent>;

export const Ophthalmology: Story = {
  render: () => ({
    props: { model: specialtyExamMatrixFixture },
    template: `<div class="emr-story-surface"><emr-specialty-exam-matrix [model]="model" /></div>`,
  }),
};

export const Pediatrics: Story = {
  render: () => ({
    props: { model: { ...specialtyExamMatrixFixture, activeSpecialty: 'pediatrics' as const } },
    template: `<div class="emr-story-surface"><emr-specialty-exam-matrix [model]="model" /></div>`,
  }),
};

export const Dermatology: Story = {
  render: () => ({
    props: { model: { ...specialtyExamMatrixFixture, activeSpecialty: 'dermatology' as const } },
    template: `<div class="emr-story-surface"><emr-specialty-exam-matrix [model]="model" /></div>`,
  }),
};

export const Oncology: Story = {
  render: () => ({
    props: { model: { ...specialtyExamMatrixFixture, activeSpecialty: 'oncology' as const } },
    template: `<div class="emr-story-surface"><emr-specialty-exam-matrix [model]="model" /></div>`,
  }),
};
