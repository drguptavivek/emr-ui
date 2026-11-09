import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import type { EmrStatTileModel } from '@drguptavivek/emr-controller';
import { EmrColumnsComponent } from '../primitives/emr-card-layout.component';
import { EmrStatTileComponent } from '../primitives/emr-stat-tile.component';

const DEVICE_STATS: readonly EmrStatTileModel[] = [
  { key: 'seen', label: 'Patients seen', value: '18', sub: 'since 09:00' },
  { key: 'referred', label: 'Referred', value: '4', status: { label: '2 not synced', tone: 'warning' } },
  { key: 'spectacles', label: 'Spectacles booked', value: '6' },
  { key: 'drafts', label: 'Drafts', value: '1', status: { label: 'Needs review', tone: 'info' } }
];

const meta: Meta<EmrStatTileComponent> = {
  title: 'EMR / Primitives / Stat Tile',
  component: EmrStatTileComponent,
  decorators: [
    moduleMetadata({
      imports: [EmrStatTileComponent, EmrColumnsComponent]
    })
  ]
};

export default meta;
type Story = StoryObj<EmrStatTileComponent>;

export const FourKpiRow: Story = {
  render: () => ({
    props: { tiles: DEVICE_STATS, selectedKey: 'none' },
    template: `
      <div style="display: grid; gap: 12px;">
        <emr-columns [count]="4">
          @for (tile of tiles; track tile.key) {
            <emr-stat-tile [model]="tile" (intent)="selectedKey = $event.key" />
          }
        </emr-columns>
        <p style="margin: 0; font-size: var(--emr-text-sm); color: var(--emr-text-muted);">
          Selected tile: {{ selectedKey }}
        </p>
      </div>
    `
  })
};

export const WithStatusBadges: Story = {
  args: {
    model: {
      key: 'referred',
      label: 'Referred to tertiary centre',
      value: '12',
      sub: 'Today across 3 vision centres',
      status: { label: '2 overdue', tone: 'warning' }
    }
  }
};

export const StaticReadOnly: Story = {
  args: {
    interactive: false,
    model: {
      key: 'static',
      label: 'Total registered patients',
      value: '1,420',
      sub: 'Read-only summary count'
    }
  }
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => ({
    props: { tiles: DEVICE_STATS },
    template: `
      <div style="max-width: 340px; display: grid; gap: 8px;">
        @for (tile of tiles; track tile.key) {
          <emr-stat-tile [model]="tile" />
        }
      </div>
    `
  })
};
