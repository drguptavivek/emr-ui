import { describe, expect, it } from 'vitest';
import {
  COMMAND_PALETTE_CATEGORIES,
  SPLIT_WORKSPACE_PRESET_SIZES,
  TIME_GRID_RESOLUTIONS,
  clampTimeGridScrollOffset,
  filterCommandPaletteItems,
  filterMasterDetailItems,
  groupCommandPaletteItems,
  resolveSplitWorkspacePresetSizes,
  stepCommandPaletteIndex,
  stepSplitWorkspacePaneSizes,
  toggleMasterDetailCheckedId,
  type EmrCommandItem,
  type EmrMasterDetailItem,
} from './l3-workstation.models.js';

const SAMPLE_COMMANDS: readonly EmrCommandItem[] = [
  {
    id: 'cmd-oct',
    label: 'Order Macular OCT (OD/OS)',
    subtitle: 'Ophthalmic Imaging · Spectral-Domain',
    category: 'orders',
    groupLabel: 'Frequent Orders',
    shortcut: '⌘O',
    pinned: true,
  },
  {
    id: 'cmd-iop-phrase',
    label: '.iop-normal — Insert bilateral normal GAT IOP',
    subtitle: 'SmartPhrase · Anterior Segment',
    category: 'smartphrases',
    shortcut: '.iop',
    recent: true,
  },
  {
    id: 'cmd-disabled',
    label: 'Restricted Narcotic Protocol',
    category: 'orders',
    disabled: true,
  },
  {
    id: 'cmd-nav-mar',
    label: 'Jump to Inpatient eMAR',
    category: 'navigation',
    shortcut: 'G M',
  },
];

const SAMPLE_INBOX: readonly EmrMasterDetailItem[] = [
  {
    id: 'msg-1',
    title: 'Critical Lab: Serum Potassium 6.2 mmol/L',
    subtitle: 'Ramesh Nair · UHID-2026-8812',
    timestampLabel: '10m ago',
    unread: true,
    filterId: 'critical',
    detailBody: 'Repeat sample hemolysis excluded; urgent ECG advised.',
  },
  {
    id: 'msg-2',
    title: 'Co-Sign Operative Note: Phaco + PCIOL OD',
    subtitle: 'Dr. Sen · Theatre 2',
    timestampLabel: '42m ago',
    unread: false,
    filterId: 'cosign',
  },
];

describe('l3-workstation.models pure functions', () => {
  it('resolves split workspace preset sizes and steps divider percentages within bounds', () => {
    expect(SPLIT_WORKSPACE_PRESET_SIZES['3-pane']).toEqual([25, 50, 25]);
    expect(resolveSplitWorkspacePresetSizes('2-pane-40-60', 2)).toEqual([40, 60]);
    expect(resolveSplitWorkspacePresetSizes('3-pane', 3)).toEqual([25, 50, 25]);
    expect(resolveSplitWorkspacePresetSizes('focus-primary', 3)).toEqual([70, 15, 15]);

    const stepped = stepSplitWorkspacePaneSizes([25, 50, 25], 0, 5);
    expect(stepped).toEqual([30, 45, 25]);

    // Clamps to minPct = 15%
    const clampedLow = stepSplitWorkspacePaneSizes([18, 57, 25], 0, -10, 15);
    expect(clampedLow).toEqual([15, 60, 25]);

    // Out-of-range divider index returns copy unchanged
    expect(stepSplitWorkspacePaneSizes([50, 50], 4, 5)).toEqual([50, 50]);
  });

  it('filters, groups, and steps command palette items while skipping disabled entries', () => {
    expect(COMMAND_PALETTE_CATEGORIES.map((c) => c.id)).toEqual([
      'all',
      'orders',
      'navigation',
      'smartphrases',
      'calculators',
      'actions',
    ]);

    const ordersOnly = filterCommandPaletteItems(SAMPLE_COMMANDS, 'orders', '');
    expect(ordersOnly.map((i) => i.id)).toEqual(['cmd-oct', 'cmd-disabled']);

    const queried = filterCommandPaletteItems(SAMPLE_COMMANDS, 'all', '.iop');
    expect(queried.map((i) => i.id)).toEqual(['cmd-iop-phrase']);

    const groups = groupCommandPaletteItems(SAMPLE_COMMANDS);
    expect(groups.map((g) => g.label)).toEqual(['Frequent Orders', 'Recent', 'ORDERS', 'NAVIGATION']);
    expect(groups[3]?.items[0]?.flatIndex).toBe(3);

    // Stepping from index 1 (+1) skips index 2 (disabled) and lands on index 3
    expect(stepCommandPaletteIndex(SAMPLE_COMMANDS, 1, 1)).toBe(3);
    // Stepping from index 3 (+1) wraps around to index 0
    expect(stepCommandPaletteIndex(SAMPLE_COMMANDS, 3, 1)).toBe(0);
    // Stepping backwards from 0 wraps to 3
    expect(stepCommandPaletteIndex(SAMPLE_COMMANDS, 0, -1)).toBe(3);
  });

  it('filters master-detail items by filter pill and search query, and toggles batch selection', () => {
    expect(filterMasterDetailItems(SAMPLE_INBOX, 'all', '')).toHaveLength(2);
    expect(filterMasterDetailItems(SAMPLE_INBOX, 'critical', '').map((i) => i.id)).toEqual(['msg-1']);
    expect(filterMasterDetailItems(SAMPLE_INBOX, 'all', 'phaco').map((i) => i.id)).toEqual(['msg-2']);

    const checked1 = toggleMasterDetailCheckedId(['msg-1'], 'msg-2');
    expect(checked1).toEqual(['msg-1', 'msg-2']);
    const checked2 = toggleMasterDetailCheckedId(checked1, 'msg-1');
    expect(checked2).toEqual(['msg-2']);
  });

  it('clamps synchronized time-grid scroll offset within visible column bounds', () => {
    expect(TIME_GRID_RESOLUTIONS.map((r) => r.id)).toEqual(['15m', '1h', '4h', '24h']);
    expect(clampTimeGridScrollOffset(-3, 12, 6)).toBe(0);
    expect(clampTimeGridScrollOffset(4, 12, 6)).toBe(4);
    expect(clampTimeGridScrollOffset(10, 12, 6)).toBe(6);
    expect(clampTimeGridScrollOffset(2, 4, 6)).toBe(0);
  });
});
