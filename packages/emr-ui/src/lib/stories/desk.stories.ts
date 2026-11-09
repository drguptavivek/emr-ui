import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type {
  EmrArrivalLinkerModel,
  EmrBookedNotDeliveredModel,
  EmrSpectacleDeliveryModel,
} from '@drguptavivek/emr-controller';
import {
  EmrArrivalLinkerComponent,
  EmrBookedNotDeliveredListComponent,
  EmrSpectacleDeliveryComponent,
} from '../domain/emr-desk.component';

const meta: Meta = {
  title: 'EMR / Desk & Spectacles',
  decorators: [
    moduleMetadata({
      imports: [
        EmrArrivalLinkerComponent,
        EmrSpectacleDeliveryComponent,
        EmrBookedNotDeliveredListComponent,
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'L4 Desk & Spectacles surfaces: EmrArrivalLinker, EmrSpectacleDelivery, and EmrBookedNotDeliveredList.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const patient = {
  name: 'Test Patient A (synthetic)',
  ageLabel: '62 y',
  sexLabel: 'Male',
  identifiers: [{ system: 'pec', label: 'PEC card', display: '17-26-000123' }],
};

const arrivalModel: EmrArrivalLinkerModel = {
  patient,
  purposeOptions: [
    { id: 'cataract', label: 'Cataract evaluation' },
    { id: 'retina', label: 'Retina clinic' },
    { id: 'glaucoma', label: 'Glaucoma clinic' },
  ],
  selectedPurpose: 'cataract',
  openReferrals: [
    {
      id: 'ref-1',
      date: '02 Nov 2026',
      centreName: 'Vision Centre Alpha',
      purpose: 'Suspected mature cataract RE',
      flags: ['Priority', 'One-eyed'],
      daysSinceAdviceLabel: '7 days since advice',
      overdueBadge: { label: 'Due', tone: 'warning' },
    },
  ],
  selectedReferralIds: ['ref-1'],
  noReferral: false,
  uhid: { value: '900000123', normalisedValue: 'UHID-900000123', required: false },
  canSubmit: true,
};

export const ArrivalLinkerDefault: Story = {
  render: () => ({
    props: { model: arrivalModel },
    template: `<div class="emr-story-surface"><div style="max-width: 600px"><emr-arrival-linker [model]="model" /></div></div>`,
  }),
};

const deliveryModel: EmrSpectacleDeliveryModel = {
  patient,
  bookings: [
    {
      id: 'bk-1',
      bookedDate: '28 Oct 2026',
      type: 'Bifocal spectacles',
      rxSummary: 'RE -1.50 DS / +2.00 Add · LE -1.25 DS / +2.00 Add',
      paidBadge: { label: 'Paid', tone: 'success' },
      statusBadge: { label: 'Ready at centre', tone: 'info' },
      daysOpenLabel: '12 days open',
    },
  ],
  selectedBookingIds: ['bk-1'],
  deliveryDate: '2026-11-09',
  canSubmit: true,
};

export const SpectacleDeliveryDefault: Story = {
  render: () => ({
    props: { model: deliveryModel },
    template: `<div class="emr-story-surface"><div style="max-width: 600px"><emr-spectacle-delivery [model]="model" /></div></div>`,
  }),
};

const bndModel: EmrBookedNotDeliveredModel = {
  filters: {
    centreOptions: [
      { id: 'vc-1', label: 'Vision Centre Alpha' },
      { id: 'vc-2', label: 'Vision Centre Beta' },
    ],
    selectedCentreId: 'vc-1',
    bookedFrom: '2026-10-01',
    bookedTo: '2026-11-09',
  },
  rows: [
    {
      bookingId: 'bk-1',
      primaryIdentifier: '17-26-000123',
      patientName: 'Test Patient A',
      phone: '+00 00000 00001',
      centreName: 'Vision Centre Alpha',
      bookedDate: '28 Oct 2026',
      daysOpenLabel: '12 days open',
      type: 'Bifocal',
      paidBadge: { label: 'Paid', tone: 'success' },
      overdueBadge: { label: 'Overdue', tone: 'warning' },
    },
    {
      bookingId: 'bk-2',
      primaryIdentifier: '17-26-000124',
      patientName: 'Test Patient B',
      centreName: 'Vision Centre Alpha',
      bookedDate: '04 Nov 2026',
      daysOpenLabel: '5 days open',
      type: 'Reading',
      paidBadge: { label: 'Subsidised', tone: 'info' },
    },
  ],
  page: 1,
  pageCount: 2,
  pagingSummaryLabel: 'Page 1 of 2 (12 bookings)',
};

export const BookedNotDeliveredDefault: Story = {
  render: () => ({
    props: { model: bndModel },
    template: `<div class="emr-story-surface"><emr-booked-not-delivered-list [model]="model" /></div>`,
  }),
};
