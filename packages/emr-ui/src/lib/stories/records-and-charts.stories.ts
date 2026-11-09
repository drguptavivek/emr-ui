import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type {
  EmrBarChartModel,
  EmrFunnelChartModel,
  EmrRecordDiffModel,
  EmrUploadQueueModel,
} from '@drguptavivek/emr-controller';
import {
  EmrBarChartComponent,
  EmrFunnelChartComponent,
  EmrRecordDiffComponent,
  EmrUploadQueueComponent,
} from '../domain/emr-records-and-charts.component';

const meta: Meta = {
  title: 'EMR / Analytics & Records',
  decorators: [
    moduleMetadata({
      imports: [
        EmrRecordDiffComponent,
        EmrUploadQueueComponent,
        EmrBarChartComponent,
        EmrFunnelChartComponent,
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'L4 Record Diff (`emr-record-diff`), Upload Queue (`emr-upload-queue`), Bar Chart (`emr-bar-chart`), and Funnel Chart (`emr-funnel-chart`).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const diffModel: EmrRecordDiffModel = {
  title: 'Amendment comparison (v1 → v2)',
  summaryLabel: 'Amended by Dr. S. Patel on 09 Nov 2026, 11:20',
  sections: [
    {
      id: 'refraction',
      label: 'Refraction & IOP',
      changes: [
        {
          id: 'ch-1',
          path: ['refraction', 're', 'sphere'],
          label: 'RE Sphere (D)',
          kind: 'changed',
          before: '-1.25',
          after: '-1.50',
        },
        {
          id: 'ch-2',
          path: ['medications', 0, 'dose'],
          label: 'Prednisolone 1% eye drops',
          kind: 'added',
          after: '1 drop 4 times daily RE',
        },
      ],
    },
  ],
};

export const RecordDiffDefault: Story = {
  render: () => ({
    props: { model: diffModel },
    template: `<div class="emr-story-surface"><div style="max-width: 680px"><emr-record-diff [model]="model" /></div></div>`,
  }),
};

const uploadModel: EmrUploadQueueModel = {
  label: 'Upload diagnostic scans',
  accept: '.pdf,.jpg,.png',
  acceptDescription: 'PDF, JPEG or PNG up to 20 MB each',
  multiple: true,
  canPublish: true,
  items: [
    {
      id: 'u-1',
      name: 'oct-macula-od-2026-11-09.pdf',
      sizeLabel: '1.4 MB',
      status: { label: 'Ready', tone: 'success' },
      progress: 100,
    },
    {
      id: 'u-2',
      name: 'fundus-os-2026-11-09.jpg',
      sizeLabel: '2.8 MB',
      status: { label: 'Uploading', tone: 'info' },
      progress: 65,
    },
  ],
};

export const UploadQueueDefault: Story = {
  render: () => ({
    props: { model: uploadModel },
    template: `<div class="emr-story-surface"><div style="max-width: 640px"><emr-upload-queue [model]="model" /></div></div>`,
  }),
};

const barChartModel: EmrBarChartModel = {
  title: 'Screenings by vision centre (Nov 2026)',
  description: 'Patients screened vs referred across 3 centres',
  yAxisLabel: 'Patients',
  categories: [
    { id: 'vc-a', label: 'Centre Alpha' },
    { id: 'vc-b', label: 'Centre Beta' },
    { id: 'vc-c', label: 'Centre Gamma' },
  ],
  series: [
    { id: 'screened', label: 'Screened', values: { 'vc-a': 180, 'vc-b': 142, 'vc-c': 210 } },
    { id: 'referred', label: 'Referred', values: { 'vc-a': 34, 'vc-b': 28, 'vc-c': 41 } },
  ],
};

export const BarChartDefault: Story = {
  render: () => ({
    props: { model: barChartModel },
    template: `<div class="emr-story-surface"><div style="max-width: 680px"><emr-bar-chart [model]="model" /></div></div>`,
  }),
};

const funnelChartModel: EmrFunnelChartModel = {
  title: 'Cataract surgical pathway conversion',
  description: 'Outreach camp cohort (Q4 2026)',
  steps: [
    { id: 'screened', label: 'Screened', value: 1200, valueLabel: '1,200' },
    { id: 'referred', label: 'Referred for cataract', value: 300, valueLabel: '300', conversionLabel: '25% of screened' },
    { id: 'arrived', label: 'Arrived at base hospital', value: 240, valueLabel: '240', conversionLabel: '80% of referred' },
    { id: 'operated', label: 'Operated', value: 216, valueLabel: '216', conversionLabel: '90% of arrived' },
  ],
};

export const FunnelChartDefault: Story = {
  render: () => ({
    props: { model: funnelChartModel },
    template: `<div class="emr-story-surface"><div style="max-width: 680px"><emr-funnel-chart [model]="model" /></div></div>`,
  }),
};
