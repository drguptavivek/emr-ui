import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type {
  EmrCommandPaletteIntent,
  EmrCommandPaletteViewModel,
  EmrMasterDetailIntent,
  EmrMasterDetailViewModel,
  EmrSplitWorkspaceIntent,
  EmrSplitWorkspaceViewModel,
  EmrSynchronizedTimeGridIntent,
  EmrSynchronizedTimeGridViewModel,
} from '@drguptavivek/emr-controller';
import {
  EmrCommandPaletteComponent,
  EmrMasterDetailComponent,
  EmrSplitWorkspaceComponent,
  EmrSynchronizedTimeGridComponent,
} from '../structures/emr-workstation-containers.component';

export const splitWorkspaceFixture: EmrSplitWorkspaceViewModel = {
  id: 'ws-encounter-retina',
  title: 'Vitreoretinal Encounter Split Workstation',
  preset: '3-pane',
  paneSizes: [25, 50, 25],
  mobileActivePaneId: 'pane-note',
  panes: [
    {
      id: 'pane-chart',
      slot: 'pane-primary',
      title: 'Chart Review & Prior Visits',
      subtitle: 'Last seen 4 weeks ago',
      badge: { label: '3 Prior OCTs', tone: 'info' },
      summaryItems: [
        'BCVA OD 6/18 (LogMAR +0.48) · OS 6/6 (LogMAR 0.00)',
        'Baseline CST OD 510 µm -> 412 µm post-Ranibizumab #2',
        'HbA1c 7.4% · BP 132/82 mmHg',
      ],
    },
    {
      id: 'pane-note',
      slot: 'pane-secondary',
      title: 'Active Encounter Note & Orders',
      subtitle: 'SOAP + Intravitreal Procedure Order',
      badge: { label: 'Draft in Progress', tone: 'warning' },
      summaryItems: [
        'Assessment: Centre-involving DME OD responding to anti-VEGF therapy.',
        'Plan: Intravitreal Ranibizumab 0.5 mg / 0.05 mL OD today; review in 4 weeks.',
      ],
    },
    {
      id: 'pane-cds',
      slot: 'pane-tertiary',
      title: 'PACS Key Images & Clinical Decision Support',
      subtitle: 'DICOMweb + Care Gaps',
      badge: { label: '1 Care Alert', tone: 'success' },
      summaryItems: [
        'OCT Slice 64 pinned: subfoveal fluid reduced by 98 µm.',
        'Pre-procedure topical povidone-iodine 5% checklist verified.',
      ],
    },
  ],
};

export const commandPaletteFixture: EmrCommandPaletteViewModel = {
  id: 'cmd-launcher',
  title: 'Clinical Workstation Command Palette (⌘K)',
  open: true,
  query: '',
  activeCategory: 'all',
  activeIndex: 0,
  items: [
    {
      id: 'cmd-oct',
      label: 'Order Spectral-Domain OCT Macula (OU)',
      subtitle: 'Diagnostics · Ophthalmic Imaging',
      category: 'orders',
      groupLabel: 'Pinned Quick Orders',
      shortcut: '⌘O',
      pinned: true,
      badge: { label: 'STAT Eligible', tone: 'info' },
    },
    {
      id: 'cmd-sle',
      label: '.sle-pseudophakia — Insert normal pseudophakic anterior segment exam',
      subtitle: 'SmartPhrase · Ophthalmology',
      category: 'smartphrases',
      shortcut: '.sle',
      recent: true,
    },
    {
      id: 'cmd-iop-calc',
      label: 'Pachymetry-Adjusted IOP & Glaucoma Risk Calculator',
      subtitle: 'Clinical Calculator · CCT Correction',
      category: 'calculators',
      shortcut: '⌘I',
    },
    {
      id: 'cmd-nav-mar',
      label: 'Jump to Inpatient eMAR & Flowsheet',
      subtitle: 'Navigation · Inpatient Care',
      category: 'navigation',
      shortcut: 'G M',
    },
    {
      id: 'cmd-sign',
      label: 'Sign & Finalize Encounter Note + e-Prescriptions',
      subtitle: 'Encounter Action · Attestation',
      category: 'actions',
      shortcut: '⌘↵',
      badge: { label: 'Ready', tone: 'success' },
    },
  ],
};

export const masterDetailFixture: EmrMasterDetailViewModel = {
  id: 'md-inbox',
  title: 'Physician Results, Critical Alerts & Co-Sign Work Queue',
  subtitle: 'Vitreoretinal & Glaucoma Unit II · 3 items pending',
  searchQuery: '',
  activeFilterId: 'all',
  selectedId: 'inb-1',
  checkedIds: ['inb-1'],
  mobileDetailOpen: false,
  filters: [
    { id: 'all', label: 'All Items', count: 3 },
    { id: 'critical', label: 'Critical Alerts', count: 1 },
    { id: 'cosign', label: 'Co-Sign Queue', count: 1 },
    { id: 'imaging', label: 'Imaging Reports', count: 1 },
  ],
  batchActions: [
    { id: 'batch-ack', label: 'Acknowledge Selected', primary: true },
    { id: 'batch-forward', label: 'Forward to Fellow' },
  ],
  items: [
    {
      id: 'inb-1',
      title: 'Critical Post-Op IOP Spike: 38 mmHg OD',
      subtitle: 'Ramesh Nair (64M · UHID-2026-8812) · Post-PPV Day 1',
      timestampLabel: '6m ago',
      unread: true,
      filterId: 'critical',
      priorityBadge: { label: 'CRITICAL', tone: 'danger' },
      statusBadge: { label: 'Action Required', tone: 'warning' },
      summaryFields: [
        { label: 'Patient', value: 'Ramesh Nair (64y / Male)' },
        { label: 'Procedure', value: '25G Pars Plana Vitrectomy + SF6 Gas OD' },
        { label: 'Recorded IOP', value: 'OD 38 mmHg · OS 14 mmHg (GAT)' },
        { label: 'Location', value: 'Ophthalmic Ward 4 · Bed 12' },
      ],
      detailBody:
        'Patient reports mild right brow ache 18 hours post-PPV with 20% SF6 tamponade. Anterior chamber deep, gas fill 85%. Recommend stat oral Acetazolamide 250 mg + topical Timolol/Dorzolamide fixed combination OD.',
      actions: [
        { id: 'order-lowering', label: 'Order IOP-Lowering Protocol', primary: true },
        { id: 'ack-alert', label: 'Mark Reviewed' },
      ],
    },
    {
      id: 'inb-2',
      title: 'Co-Sign Resident Operative Note: Phaco + Toric PCIOL OS',
      subtitle: 'Ananya Sharma (58F · UHID-2026-44109) · Dr. Sen',
      timestampLabel: '35m ago',
      unread: true,
      filterId: 'cosign',
      statusBadge: { label: 'Awaiting Co-Sign', tone: 'info' },
      summaryFields: [
        { label: 'Surgeon', value: 'Dr. Sen (Senior Resident)' },
        { label: 'Attending', value: 'Prof. Vivek Gupta' },
        { label: 'IOL Implanted', value: '+21.5 D Toric T4 aligned at 175°' },
      ],
      detailBody: 'Uneventful sutureless temporal clear corneal phacoemulsification with in-the-bag toric PCIOL.',
      actions: [
        { id: 'cosign-sign', label: 'Co-Sign & Attest Note', primary: true },
        { id: 'request-amend', label: 'Request Amendment' },
      ],
    },
    {
      id: 'inb-3',
      title: 'OCT Angiography & B-Scan Macula Final Report',
      subtitle: 'Meera Krishnan (71F · UHID-2026-31004)',
      timestampLabel: '2h ago',
      unread: false,
      filterId: 'imaging',
      statusBadge: { label: 'Final Verified', tone: 'success' },
      detailBody: 'Quiescent type 1 macular neovascular membrane; no intraretinal or subretinal fluid.',
      actions: [{ id: 'pull-to-note', label: 'Pull Impression to Encounter Note', primary: true }],
    },
  ],
};

export const synchronizedTimeGridFixture: EmrSynchronizedTimeGridViewModel = {
  id: 'stg-icu-ophth',
  title: 'Synchronized Longitudinal Time Grid (Vitals, IOP Trend, eMAR & Events)',
  subtitle: 'Ophthalmic High-Dependency & Medical Ward · Synchronized TimeAxis Columns',
  resolution: '1h',
  availableResolutions: ['15m', '1h', '4h', '24h'],
  scrollOffset: 0,
  visibleColumnCount: 5,
  selectedColumnId: 'c10',
  columns: [
    { id: 'c08', timestamp: '2026-11-12T08:00:00Z', label: '08:00', shiftBadge: 'Morning', encounterBadge: 'Day 2' },
    { id: 'c09', timestamp: '2026-11-12T09:00:00Z', label: '09:00', shiftBadge: 'Morning', encounterBadge: 'Day 2' },
    { id: 'c10', timestamp: '2026-11-12T10:00:00Z', label: '10:00', shiftBadge: 'Morning', encounterBadge: 'Day 2', isCurrentTime: true },
    { id: 'c11', timestamp: '2026-11-12T11:00:00Z', label: '11:00', shiftBadge: 'Morning', encounterBadge: 'Day 2' },
    { id: 'c12', timestamp: '2026-11-12T12:00:00Z', label: '12:00', shiftBadge: 'Afternoon', encounterBadge: 'Day 2' },
    { id: 'c13', timestamp: '2026-11-12T13:00:00Z', label: '13:00', shiftBadge: 'Afternoon', encounterBadge: 'Day 2' },
  ],
  tracks: [
    {
      id: 'trk-vitals',
      title: 'Observation Flowsheet (IOP & Systemic Vitals)',
      kind: 'vitals',
      rows: [
        {
          id: 'r-iop-od',
          label: 'IOP Right Eye (OD)',
          unitLabel: 'mmHg',
          referenceRangeLabel: '10–21 mmHg',
          cells: {
            c08: { columnId: 'c08', valueLabel: '34', abnormalTone: 'danger', secondaryLabel: 'GAT' },
            c09: { columnId: 'c09', valueLabel: '26', abnormalTone: 'warning', secondaryLabel: '↓ -8' },
            c10: { columnId: 'c10', valueLabel: '18', secondaryLabel: 'Normalized' },
            c11: { columnId: 'c11', valueLabel: '17' },
          },
        },
        {
          id: 'r-bp',
          label: 'Blood Pressure (NIBP)',
          unitLabel: 'mmHg',
          referenceRangeLabel: '< 140/90',
          cells: {
            c08: { columnId: 'c08', valueLabel: '146/88', abnormalTone: 'warning' },
            c09: { columnId: 'c09', valueLabel: '134/82' },
            c10: { columnId: 'c10', valueLabel: '128/78' },
            c11: { columnId: 'c11', valueLabel: '126/76' },
          },
        },
      ],
    },
    {
      id: 'trk-trend',
      title: 'Sparkline & Range Trend Track',
      kind: 'trend',
      rows: [
        {
          id: 'r-cst-trend',
          label: 'Mean Ocular Perfusion Pressure',
          unitLabel: 'mmHg',
          referenceRangeLabel: '45–60 mmHg',
          cells: {
            c08: { columnId: 'c08', valueLabel: '42', secondaryLabel: 'Low MOPP', abnormalTone: 'warning' },
            c09: { columnId: 'c09', valueLabel: '49', secondaryLabel: 'In target' },
            c10: { columnId: 'c10', valueLabel: '54', secondaryLabel: 'Optimal' },
            c11: { columnId: 'c11', valueLabel: '55', secondaryLabel: 'Optimal' },
          },
        },
      ],
    },
    {
      id: 'trk-mar',
      title: 'Medication Administrations (eMAR)',
      kind: 'medications',
      rows: [
        {
          id: 'r-acetazolamide',
          label: 'Acetazolamide 250 mg Oral',
          unitLabel: 'STAT + QID',
          cells: {
            c08: { columnId: 'c08', valueLabel: '✓ Given', secondaryLabel: '250 mg PO · BCMA' },
            c12: { columnId: 'c12', valueLabel: '◷ Due', secondaryLabel: '250 mg PO' },
          },
        },
        {
          id: 'r-timolol',
          label: 'Timolol 0.5% Eye Drops (OD)',
          unitLabel: 'BD',
          cells: {
            c08: { columnId: 'c08', valueLabel: '✓ Given', secondaryLabel: '1 gtt OD' },
          },
        },
      ],
    },
    {
      id: 'trk-events',
      title: 'Procedures, Labs & Nursing Events',
      kind: 'events',
      rows: [
        {
          id: 'r-proc',
          label: 'Bedside Interventions & Diagnostics',
          cells: {
            c08: { columnId: 'c08', valueLabel: 'Slit-Lamp Exam', secondaryLabel: 'Corneal oedema +1' },
            c10: { columnId: 'c10', valueLabel: 'Repeat Tonometry', secondaryLabel: 'Target achieved' },
          },
        },
      ],
    },
  ],
};

const meta: Meta<EmrSplitWorkspaceComponent> = {
  title: 'EMR / Structures / Workstation Containers',
  component: EmrSplitWorkspaceComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EmrSplitWorkspaceComponent,
        EmrCommandPaletteComponent,
        EmrMasterDetailComponent,
        EmrSynchronizedTimeGridComponent,
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<EmrSplitWorkspaceComponent>;

export const SplitWorkspace: Story = {
  render: () => ({
    props: {
      model: splitWorkspaceFixture,
      onIntent(this: { model: EmrSplitWorkspaceViewModel }, e: EmrSplitWorkspaceIntent) {
        if (e.type === 'presetChanged') {
          this.model = { ...this.model, preset: e.preset, paneSizes: e.paneSizes };
        } else if (e.type === 'paneResized') {
          this.model = { ...this.model, paneSizes: e.paneSizes };
        } else if (e.type === 'paneCollapsedToggled') {
          this.model = {
            ...this.model,
            panes: this.model.panes.map((p) =>
              p.id === e.paneId ? { ...p, collapsed: e.collapsed } : p,
            ),
          };
        } else if (e.type === 'mobilePaneSelected') {
          this.model = { ...this.model, mobileActivePaneId: e.paneId };
        }
      },
    },
    template: `
      <div class="emr-story-surface">
        <emr-split-workspace [model]="model" (intent)="onIntent($event)" />
      </div>
    `,
  }),
};

export const CommandPalette: Story = {
  render: () => ({
    props: {
      model: commandPaletteFixture,
      onIntent(this: { model: EmrCommandPaletteViewModel }, e: EmrCommandPaletteIntent) {
        if (e.type === 'queryChanged') {
          this.model = { ...this.model, query: e.query, activeIndex: 0 };
        } else if (e.type === 'categoryChanged') {
          this.model = { ...this.model, activeCategory: e.category, activeIndex: 0 };
        } else if (e.type === 'itemHighlighted') {
          this.model = { ...this.model, activeIndex: e.index };
        } else if (e.type === 'dismissed') {
          this.model = { ...this.model, open: false };
        }
      },
    },
    template: `
      <div class="emr-story-surface">
        <emr-command-palette [model]="model" (intent)="onIntent($event)" />
      </div>
    `,
  }),
};

export const MasterDetailInbox: Story = {
  render: () => ({
    props: {
      model: masterDetailFixture,
      onIntent(this: { model: EmrMasterDetailViewModel }, e: EmrMasterDetailIntent) {
        if (e.type === 'searchChanged') {
          this.model = { ...this.model, searchQuery: e.query };
        } else if (e.type === 'filterChanged') {
          this.model = { ...this.model, activeFilterId: e.filterId };
        } else if (e.type === 'itemSelected') {
          this.model = { ...this.model, selectedId: e.itemId, mobileDetailOpen: true };
        } else if (e.type === 'detailClosed') {
          this.model = { ...this.model, mobileDetailOpen: false };
        } else if (e.type === 'batchSelectionToggled') {
          this.model = { ...this.model, checkedIds: e.checkedIds };
        }
      },
    },
    template: `
      <div class="emr-story-surface">
        <emr-master-detail [model]="model" (intent)="onIntent($event)" />
      </div>
    `,
  }),
};

export const SynchronizedTimeGrid: Story = {
  render: () => ({
    props: {
      model: synchronizedTimeGridFixture,
      onIntent(this: { model: EmrSynchronizedTimeGridViewModel }, e: EmrSynchronizedTimeGridIntent) {
        if (e.type === 'resolutionChanged') {
          this.model = { ...this.model, resolution: e.resolution };
        } else if (e.type === 'scrollOffsetChanged') {
          this.model = { ...this.model, scrollOffset: e.offset };
        } else if (e.type === 'columnSelected') {
          this.model = { ...this.model, selectedColumnId: e.columnId };
        } else if (e.type === 'trackToggled') {
          this.model = {
            ...this.model,
            tracks: this.model.tracks.map((t) =>
              t.id === e.trackId ? { ...t, collapsed: e.collapsed } : t,
            ),
          };
        } else if (e.type === 'cellSelected') {
          this.model = {
            ...this.model,
            selectedCell: { trackId: e.trackId, rowId: e.rowId, columnId: e.columnId },
          };
        }
      },
    },
    template: `
      <div class="emr-story-surface">
        <emr-synchronized-time-grid [model]="model" (intent)="onIntent($event)" />
      </div>
    `,
  }),
};
