import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { PrescribingRow, PrescribingTableViewModel } from '@drguptavivek/emr-controller';
import { EmrPrescribingTableComponent } from '../domain/emr-prescribing-table.component';

const meta: Meta<EmrPrescribingTableComponent> = {
  title: 'EMR / Medications / Prescribing table',
  component: EmrPrescribingTableComponent,
  decorators: [moduleMetadata({ imports: [EmrPrescribingTableComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Multi-row clinical prescribing table supporting Dense Grid (Cerner), Sig Summary (Epic), and Patient Matrix views, SmartSig quick-order bar, DDI & Allergy safety alerts, ophthalmic OD/OS/OU site pills, auto-calculated dispense quantities, and expandable taper schedules.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<EmrPrescribingTableComponent>;

const slotDefinitions = [
  { id: 'm', label: 'Morning', shortLabel: 'Morn', timeHint: '08:00' },
  { id: 'a', label: 'Afternoon', shortLabel: 'Noon', timeHint: '13:00' },
  { id: 'e', label: 'Evening', shortLabel: 'Eve', timeHint: '18:00' },
  { id: 'n', label: 'Night', shortLabel: 'Night', timeHint: '22:00' },
] as const;

const baseRows: PrescribingRow[] = [
  {
    id: 'rx-1',
    drugName: 'Moxifloxacin',
    strength: '0.5% w/v',
    form: 'drop',
    formLabel: 'Ophthalmic Drops',
    route: 'eye',
    site: 'OD',
    doseAmount: 1,
    unitLabel: 'drop',
    frequencyCode: 'QID',
    patternLabel: '1 - 1 - 1 - 1',
    slots: [
      { id: 'm', label: 'Morning', amount: 1 },
      { id: 'a', label: 'Afternoon', amount: 1 },
      { id: 'e', label: 'Evening', amount: 1 },
      { id: 'n', label: 'Night', amount: 1 },
    ],
    durationCount: 7,
    durationUnit: 'days',
    foodRelation: '5 min gap',
    instructions: 'Instil into right eye every 4 hours while awake',
  },
  {
    id: 'rx-2',
    drugName: 'Amoxicillin + Clavulanate',
    strength: '625 mg',
    form: 'tablet',
    formLabel: 'Tablet',
    route: 'oral',
    doseAmount: 1,
    unitLabel: 'tab',
    frequencyCode: 'BD',
    patternLabel: '1 - 0 - 0 - 1',
    slots: [
      { id: 'm', label: 'Morning', amount: 1 },
      { id: 'a', label: 'Afternoon', amount: 0 },
      { id: 'e', label: 'Evening', amount: 0 },
      { id: 'n', label: 'Night', amount: 1 },
    ],
    durationCount: 5,
    durationUnit: 'days',
    foodRelation: 'After food',
    instructions: 'Complete full course',
  },
];

const denseGridModel: PrescribingTableViewModel = {
  title: 'Outpatient & Post-Operative Prescribing Composer',
  rows: baseRows,
  slotDefinitions,
  quickSigExamples: [
    { command: 'moxi 1qid od 7d', label: 'Moxifloxacin QID OD 7d' },
    { command: 'pred 1qid od taper', label: 'Prednisolone 4wk Taper' },
    { command: 'carboxy 1qid ou 30d', label: 'CMC 0.5% QID OU 30d' },
  ],
  safetyAlerts: [
    {
      id: 'alert-steroid',
      tone: 'warning',
      badgeLabel: 'Steroid IOP Advisory',
      message: 'Monitor intraocular pressure if topical corticosteroid therapy extends beyond 14 days.',
    },
  ],
  canSign: true,
};

const ophthalmicTaperModel: PrescribingTableViewModel = {
  ...denseGridModel,
  title: 'Post-Phacoemulsification Ophthalmic Taper Schedule',
  rows: [
    {
      id: 'rx-taper-1',
      drugName: 'Prednisolone Acetate',
      strength: '1% w/v',
      form: 'drop',
      formLabel: 'Ophthalmic Suspension',
      route: 'eye',
      site: 'OD',
      doseAmount: 1,
      unitLabel: 'drop',
      frequencyCode: 'QID',
      patternLabel: '1 - 1 - 1 - 1',
      slots: [
        { id: 'm', label: 'Morning', amount: 1 },
        { id: 'a', label: 'Afternoon', amount: 1 },
        { id: 'e', label: 'Evening', amount: 1 },
        { id: 'n', label: 'Night', amount: 1 },
      ],
      durationCount: 4,
      durationUnit: 'weeks',
      foodRelation: '5 min gap',
      instructions: 'Shake well before use; follow 4-week reducing schedule',
      taperExpanded: true,
      taperSteps: [
        { id: 'ts-1', periodLabel: 'Week 1 (Days 1–7)', frequencyLabel: '1 drop 4 times daily (QID)' },
        { id: 'ts-2', periodLabel: 'Week 2 (Days 8–14)', frequencyLabel: '1 drop 3 times daily (TDS)' },
        { id: 'ts-3', periodLabel: 'Week 3 (Days 15–21)', frequencyLabel: '1 drop twice daily (BD)' },
        { id: 'ts-4', periodLabel: 'Week 4 (Days 22–28)', frequencyLabel: '1 drop once daily (OD) then stop' },
      ],
    },
    ...baseRows.slice(0, 1),
  ],
};

export const DenseGrid: Story = {
  render: () => ({
    props: { model: denseGridModel },
    template: `<div class="emr-story-surface"><emr-prescribing-table [model]="model" /></div>`,
  }),
};

export const OphthalmicTaper: Story = {
  render: () => ({
    props: { model: ophthalmicTaperModel },
    template: `<div class="emr-story-surface"><emr-prescribing-table [model]="model" /></div>`,
  }),
};

export const ReadOnly: Story = {
  render: () => ({
    props: { model: { ...ophthalmicTaperModel, readOnly: true, signedByLabel: 'Dr S. Iyer (Ophthalmology) · 10:42' } },
    template: `<div class="emr-story-surface"><emr-prescribing-table [model]="model" /></div>`,
  }),
};
