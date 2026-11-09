import type { Meta, StoryObj } from '@storybook/angular';
import type { EmrDataTableModel } from '@drguptavivek/emr-controller';
import { EmrDataTableComponent } from '../structures/emr-data-table.component';

const TABLE_FIXTURE: EmrDataTableModel = {
  caption: 'Surgical referral registry',
  columns: [
    { id: 'mrn', label: 'MRN', sortable: true },
    { id: 'patient', label: 'Patient', sortable: true },
    { id: 'centre', label: 'Vision centre', sortable: true },
    { id: 'status', label: 'Referral status' },
    { id: 'days', label: 'Days open', align: 'end', sortable: true }
  ],
  rows: [
    {
      id: 'r1',
      cells: {
        mrn: 'MRN-204109',
        patient: 'Meera Nair · 64 / F',
        centre: 'Rampur VC',
        status: { text: 'Cataract surgery', badge: { label: 'Overdue', tone: 'warning' } },
        days: '19'
      }
    },
    {
      id: 'r2',
      cells: {
        mrn: 'MRN-204118',
        patient: 'Ramesh Verma · 58 / M',
        centre: 'Sitapur VC',
        status: { text: 'Glaucoma workup', badge: { label: 'Booked', tone: 'info' } },
        days: '4'
      }
    },
    {
      id: 'r3',
      cells: {
        mrn: 'MRN-204125',
        patient: 'Kavita Devi · 71 / F',
        centre: 'Rampur VC',
        status: { text: 'Retina evaluation', badge: { label: 'Arrived', tone: 'success' } },
        days: '1'
      }
    }
  ],
  selectedIds: ['r1'],
  sort: { columnId: 'days', direction: 'desc' },
  filters: [{ id: 'f1', label: 'Centre', valueLabel: 'Rampur VC, Sitapur VC' }],
  savedFilters: [
    { id: 'sf1', label: 'Overdue > 14 days' },
    { id: 'sf2', label: 'Cataract referrals' }
  ],
  bulkActions: [
    { id: 'assign', label: 'Assign outreach worker' },
    { id: 'export-selected', label: 'Export selected' }
  ],
  density: 'comfortable',
  page: 1,
  pageCount: 4,
  pageSize: 10,
  pageSizeOptions: [10, 25, 50],
  summaryLabel: 'Showing 1–3 of 38 referrals',
  status: 'ready'
};

const meta: Meta<EmrDataTableComponent> = {
  title: 'EMR / Structures / Data Table',
  component: EmrDataTableComponent
};

export default meta;
type Story = StoryObj<EmrDataTableComponent>;

export const Populated: Story = {
  args: { model: TABLE_FIXTURE }
};

export const CompactDensity: Story = {
  args: { model: { ...TABLE_FIXTURE, density: 'compact' } }
};

export const Empty: Story = {
  args: { model: { ...TABLE_FIXTURE, rows: [], selectedIds: [], summaryLabel: 'Showing 0 of 0' } }
};

export const Loading: Story = {
  args: { model: { ...TABLE_FIXTURE, status: 'loading' } }
};

export const ErrorState: Story = {
  args: { model: { ...TABLE_FIXTURE, status: 'error', error: 'Connection timed out while loading referral registry.' } }
};
