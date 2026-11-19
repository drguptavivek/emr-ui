import { describe, expect, it } from 'vitest';
import {
  COMMAND_PALETTE_CATEGORIES,
  SPLIT_WORKSPACE_PRESET_SIZES,
  TIME_GRID_RESOLUTIONS,
  canExecuteCommandItem,
  canMutateMasterDetail,
  canMutateSplitWorkspace,
  canStepTimeGridScroll,
  clampTimeGridScrollOffset,
  filterCommandPaletteItems,
  filterMasterDetailItems,
  groupCommandPaletteItems,
  resolveCommandPaletteHeadingId,
  resolveCommandPaletteId,
  resolveCommandPaletteListboxId,
  resolveCommandPaletteOptionId,
  resolveCommandPalettePresentation,
  resolveMasterDetailHeadingId,
  resolveMasterDetailId,
  resolveSplitWorkspaceDividerBounds,
  resolveSplitWorkspaceHeadingId,
  resolveSplitWorkspaceId,
  resolveSplitWorkspacePresetSizes,
  resolveSynchronizedTimeGridHeadingId,
  resolveSynchronizedTimeGridId,
  resolveTimeGridVisibleColumns,
  stepCommandPaletteIndex,
  stepSplitWorkspacePaneSizes,
  toggleMasterDetailCheckedId,
  visibleSplitWorkspacePanes,
  type EmrCommandItem,
  type EmrMasterDetailItem,
  type EmrSplitWorkspacePane,
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

    // Honors per-pane minWidthPct and Home/End extremes
    const panesWithMin: readonly EmrSplitWorkspacePane[] = [
      { id: 'p1', slot: 'pane-primary', title: 'Primary', minWidthPct: 30 },
      { id: 'p2', slot: 'pane-secondary', title: 'Secondary', minWidthPct: 25 },
      { id: 'p3', slot: 'pane-tertiary', title: 'Tertiary' },
    ];
    expect(visibleSplitWorkspacePanes(panesWithMin, '2-pane-50-50')).toHaveLength(2);
    expect(visibleSplitWorkspacePanes(panesWithMin, '3-pane')).toHaveLength(3);
    expect(resolveSplitWorkspaceDividerBounds([40, 35, 25], 0, panesWithMin)).toEqual({
      min: 30,
      max: 50,
      now: 40,
    });
    expect(stepSplitWorkspacePaneSizes([40, 35, 25], 0, -20, panesWithMin)).toEqual([30, 45, 25]);
    expect(stepSplitWorkspacePaneSizes([40, 35, 25], 0, 100, panesWithMin)).toEqual([50, 25, 25]);
    expect(stepSplitWorkspacePaneSizes([40, 35, 25], 0, -100, panesWithMin)).toEqual([30, 45, 25]);

    expect(resolveSplitWorkspaceId('ws1', 'opd-')).toBe('opd-emr-split-ws-ws1');
    expect(resolveSplitWorkspaceHeadingId('ws1', 'opd')).toBe('opd-emr-split-ws-ws1-heading');
    expect(resolveSplitWorkspaceHeadingId('ws1', 'opd', 'custom-h')).toBe('custom-h');
    expect(canMutateSplitWorkspace({ readOnly: false })).toBe(true);
    expect(canMutateSplitWorkspace({ readOnly: true })).toBe(false);
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
    // Stepping backwards from -1 wraps to 3
    expect(stepCommandPaletteIndex(SAMPLE_COMMANDS, -1, -1)).toBe(3);

    expect(resolveCommandPalettePresentation({})).toBe('modal');
    expect(resolveCommandPalettePresentation({ presentation: 'inline' })).toBe('inline');
    expect(resolveCommandPaletteId('cmd', 'r')).toBe('r-emr-cmd-cmd');
    expect(resolveCommandPaletteHeadingId('cmd', 'r')).toBe('r-emr-cmd-cmd-heading');
    expect(resolveCommandPaletteListboxId('cmd', 'r')).toBe('r-emr-cmd-cmd-listbox');
    expect(resolveCommandPaletteOptionId('cmd', 'c1', 'r')).toBe('r-emr-cmd-cmd-opt-c1');
    expect(canExecuteCommandItem({ readOnly: false }, SAMPLE_COMMANDS[0])).toBe(true);
    expect(canExecuteCommandItem({ readOnly: true }, SAMPLE_COMMANDS[0])).toBe(false);
    expect(canExecuteCommandItem({ readOnly: false }, SAMPLE_COMMANDS[2])).toBe(false);
  });

  it('filters master-detail items by filter pill and search query, and toggles batch selection', () => {
    expect(filterMasterDetailItems(SAMPLE_INBOX, 'all', '')).toHaveLength(2);
    expect(filterMasterDetailItems(SAMPLE_INBOX, 'critical', '').map((i) => i.id)).toEqual(['msg-1']);
    expect(filterMasterDetailItems(SAMPLE_INBOX, 'all', 'phaco').map((i) => i.id)).toEqual(['msg-2']);

    const checked1 = toggleMasterDetailCheckedId(['msg-1'], 'msg-2');
    expect(checked1).toEqual(['msg-1', 'msg-2']);
    const checked2 = toggleMasterDetailCheckedId(checked1, 'msg-1');
    expect(checked2).toEqual(['msg-2']);

    expect(resolveMasterDetailId('inbox', 'opd')).toBe('opd-emr-md-inbox');
    expect(resolveMasterDetailHeadingId('inbox', 'opd')).toBe('opd-emr-md-inbox-heading');
    expect(canMutateMasterDetail({ readOnly: false })).toBe(true);
    expect(canMutateMasterDetail({ readOnly: true })).toBe(false);
  });

  it('clamps synchronized time-grid scroll offset within visible column bounds and gates Earlier/Later', () => {
    expect(TIME_GRID_RESOLUTIONS.map((r) => r.id)).toEqual(['15m', '1h', '4h', '24h']);
    expect(clampTimeGridScrollOffset(-3, 12, 6)).toBe(0);
    expect(clampTimeGridScrollOffset(4, 12, 6)).toBe(4);
    expect(clampTimeGridScrollOffset(10, 12, 6)).toBe(6);
    expect(clampTimeGridScrollOffset(2, 4, 6)).toBe(0);

    // Earlier / Later boundary gating via canStepTimeGridScroll
    expect(canStepTimeGridScroll(0, 6, 5, -1)).toBe(false);
    expect(canStepTimeGridScroll(0, 6, 5, 1)).toBe(true);
    expect(canStepTimeGridScroll(1, 6, 5, -1)).toBe(true);
    expect(canStepTimeGridScroll(1, 6, 5, 1)).toBe(false);
    expect(canStepTimeGridScroll(0, 4, 4, 1)).toBe(false);
    expect(canStepTimeGridScroll(0, 4, undefined, 1)).toBe(false);

    const cols = [
      { id: 'c1', timestamp: '2026-11-12T08:00:00Z', label: '08:00' },
      { id: 'c2', timestamp: '2026-11-12T09:00:00Z', label: '09:00' },
      { id: 'c3', timestamp: '2026-11-12T10:00:00Z', label: '10:00' },
    ];
    expect(resolveTimeGridVisibleColumns(cols, 5, 2).map((c) => c.id)).toEqual(['c2', 'c3']);
    expect(resolveSynchronizedTimeGridId('stg1', 'a')).toBe('a-emr-stg-stg1');
    expect(resolveSynchronizedTimeGridHeadingId('stg1', 'a')).toBe('a-emr-stg-stg1-heading');
  });
});
