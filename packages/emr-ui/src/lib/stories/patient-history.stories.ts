import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { EmrCataractEpisode, EmrPatientHistoryModel } from '@drguptavivek/emr-controller';
import {
  EmrCataractEpisodeCardComponent,
  EmrPatientHistoryTimelineComponent,
} from '../domain/emr-patient-history.component';

const meta: Meta = {
  title: 'EMR / History / Patient History & Cataract Episode',
  decorators: [
    moduleMetadata({
      imports: [EmrCataractEpisodeCardComponent, EmrPatientHistoryTimelineComponent],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'L4 Patient History Timeline (`emr-patient-history-timeline`) and Cataract Episode Card (`emr-cataract-episode-card`).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const episodeModel: EmrCataractEpisode = {
  id: 'ep-1',
  eye: 'RE',
  status: 'operated',
  statusBadge: { label: 'Operated', tone: 'info' },
  admissionDate: '01 Nov 2026',
  sxDate: '02 Nov 2026',
  stages: {
    activeId: 'followup',
    stages: [
      { id: 'admitted', label: 'Admitted', status: { label: 'Done', tone: 'success' } },
      { id: 'operated', label: 'Surgery', status: { label: 'Done', tone: 'success' } },
      { id: 'followup', label: 'Follow-up', status: { label: 'In progress', tone: 'info' } },
    ],
  },
  followups: [
    { label: 'Day 1 post-op', due: '03 Nov 2026', done: true, statusBadge: { label: 'Completed', tone: 'success' } },
    { label: 'Day 30 post-op', due: '02 Dec 2026', done: false, statusBadge: { label: 'Due', tone: 'warning' } },
  ],
  canCompleteSurgery: false,
  canAddFollowup: true,
};

export const CataractEpisodeOperated: Story = {
  render: () => ({
    props: { model: episodeModel },
    template: `<div class="emr-story-surface"><div style="max-width: 560px"><emr-cataract-episode-card [model]="model" /></div></div>`,
  }),
};

const historyModel: EmrPatientHistoryModel = {
  patient: {
    name: 'Test Patient A (synthetic)',
    ageLabel: '64 y',
    sexLabel: 'Female',
    identifiers: [{ system: 'pec', label: 'PEC card', display: '17-26-000123' }],
  },
  summary: {
    lastSpectacleRx: {
      date: '15 Oct 2026',
      re: { sph: '-1.50', cyl: '-0.50', axis: '90°', add: '+2.25' },
      le: { sph: '-1.25', cyl: '-0.25', axis: '85°', add: '+2.25' },
      type: 'Bifocal',
      statusBadge: { label: 'Delivered', tone: 'success' },
    },
    lastGlaucomaScreen: {
      date: '15 Oct 2026',
      iopRe: '16 mmHg',
      iopLe: '18 mmHg',
      cdrRe: '0.4',
      cdrLe: '0.5',
      decision: 'Annual review',
    },
    lastDrScreen: {
      date: '15 Oct 2026',
      gradeRe: 'Mild NPDR',
      gradeLe: 'No DR',
      maculopathyRe: 'Absent',
      maculopathyLe: 'Absent',
      decision: 'Rescreen in 12 months',
    },
    openReferrals: [
      {
        id: 'ref-1',
        purpose: 'Cataract surgery RE',
        centreName: 'Tertiary Eye Centre',
        date: '20 Oct 2026',
        statusBadge: { label: 'Open', tone: 'info' },
        flags: ['Priority'],
      },
    ],
    openBookings: [],
    openEpisodes: [episodeModel],
  },
  visits: [
    {
      id: 'v-2',
      date: '02 Nov 2026',
      centreName: 'Tertiary Eye Centre',
      teamName: 'Unit B',
      pvaRe: '6/18',
      pvaLe: '6/9',
      diagnosis: 'Pseudophakia RE, Immature senile cataract LE',
      advice: 'Continue topical steroid taper RE',
    },
    {
      id: 'v-1',
      date: '15 Oct 2026',
      centreName: 'Vision Centre Alpha',
      teamName: 'Screening Team 1',
      pvaRe: '6/60',
      pvaLe: '6/9',
      diagnosis: 'Mature cataract RE',
      advice: 'Referred for cataract surgery RE',
    },
  ],
};

export const PatientHistoryPopulated: Story = {
  render: () => ({
    props: { model: historyModel },
    template: `<div class="emr-story-surface"><emr-patient-history-timeline [model]="model" /></div>`,
  }),
};

export const PatientHistoryNewPatient: Story = {
  render: () => ({
    props: {
      model: {
        ...historyModel,
        summary: { openReferrals: [], openBookings: [], openEpisodes: [] },
        visits: [],
      },
    },
    template: `<div class="emr-story-surface"><emr-patient-history-timeline [model]="model" /></div>`,
  }),
};
