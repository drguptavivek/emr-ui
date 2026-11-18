import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => import('react-native-web'));

import type {
  EmrCommandPaletteViewModel,
  EmrMasterDetailViewModel,
  EmrSplitWorkspaceViewModel,
  EmrSynchronizedTimeGridViewModel,
} from '../../emr-controller/src/l3-workstation.models';
import {
  EmrCommandPalette,
  EmrMasterDetail,
  EmrSplitWorkspace,
  EmrSynchronizedTimeGrid,
} from './l3-workstation';
import {
  clampTimeGridScrollOffset,
  filterCommandPaletteItems,
  filterMasterDetailItems,
  groupCommandPaletteItems,
  resolveSplitWorkspacePresetSizes,
  stepCommandPaletteIndex,
  stepSplitWorkspacePaneSizes,
  toggleMasterDetailCheckedId,
  visibleSplitWorkspacePanes,
} from './l3-workstation.logic';

describe('L3 Workstation Containers (React & Pure Logic)', () => {
  it('renders EmrSplitWorkspace panes, presets, and divider controls', () => {
    const model: EmrSplitWorkspaceViewModel = {
      id: 'ws-react',
      title: 'Encounter Split Workspace',
      preset: '3-pane',
      paneSizes: [25, 50, 25],
      panes: [
        { id: 'p1', slot: 'pane-primary', title: 'Chart Review', summaryItems: ['Prior OCT CST 412 µm'] },
        { id: 'p2', slot: 'pane-secondary', title: 'Clinical Note & Orders' },
        { id: 'p3', slot: 'pane-tertiary', title: 'PACS & CDS', badge: { label: '1 Alert', tone: 'warning' } },
      ],
    };

    expect(visibleSplitWorkspacePanes(model.panes, '3-pane')).toHaveLength(3);
    expect(visibleSplitWorkspacePanes(model.panes, '2-pane-50-50')).toHaveLength(2);
    expect(resolveSplitWorkspacePresetSizes('2-pane-40-60', 2)).toEqual([40, 60]);
    expect(stepSplitWorkspacePaneSizes([25, 50, 25], 0, 5)).toEqual([30, 45, 25]);

    const html = renderToStaticMarkup(
      createElement(EmrSplitWorkspace, {
        model,
        onIntent: () => {},
      }),
    );
    expect(html).toContain('Encounter Split Workspace');
    expect(html).toContain('Chart Review');
    expect(html).toContain('Prior OCT CST 412 µm');
    expect(html).toContain('Clinical Note &amp; Orders');
    expect(html).toContain('PACS &amp; CDS');
    expect(html).toContain('3-Pane');
  });

  it('renders EmrCommandPalette search, categories, shortcuts, and pinned/recent badges', () => {
    const model: EmrCommandPaletteViewModel = {
      id: 'cmd-react',
      title: 'Quick Command Launcher',
      open: true,
      query: '',
      activeCategory: 'all',
      activeIndex: 0,
      items: [
        {
          id: 'c1',
          label: 'Order Macular OCT',
          subtitle: 'Imaging · OU',
          category: 'orders',
          shortcut: '⌘O',
          pinned: true,
        },
        {
          id: 'c2',
          label: '.iop-normal',
          subtitle: 'SmartPhrase',
          category: 'smartphrases',
          shortcut: '.iop',
          recent: true,
        },
      ],
    };

    expect(filterCommandPaletteItems(model.items, 'smartphrases', '')).toHaveLength(1);
    expect(groupCommandPaletteItems(model.items)).toHaveLength(2);
    expect(stepCommandPaletteIndex(model.items, 0, 1)).toBe(1);

    const html = renderToStaticMarkup(
      createElement(EmrCommandPalette, {
        model,
        onIntent: () => {},
      }),
    );
    expect(html).toContain('Quick Command Launcher');
    expect(html).toContain('Order Macular OCT');
    expect(html).toContain('⌘O');
    expect(html).toContain('★ Pinned');
    expect(html).toContain('.iop-normal');
  });

  it('renders EmrMasterDetail master list, unread indicator, badges, and detail inspector', () => {
    const model: EmrMasterDetailViewModel = {
      id: 'md-react',
      title: 'Clinical Work Queue & Inbox',
      searchQuery: '',
      activeFilterId: 'all',
      selectedId: 'm1',
      checkedIds: ['m1'],
      filters: [
        { id: 'all', label: 'All', count: 1 },
        { id: 'critical', label: 'Critical', count: 1 },
      ],
      batchActions: [{ id: 'ack-batch', label: 'Acknowledge Selected' }],
      items: [
        {
          id: 'm1',
          title: 'Critical IOP 38 mmHg OD',
          subtitle: 'Ramesh Nair · Post-PPV Day 1',
          timestampLabel: '5m ago',
          unread: true,
          filterId: 'critical',
          priorityBadge: { label: 'CRITICAL', tone: 'danger' },
          summaryFields: [{ label: 'Recorded IOP', value: '38 mmHg OD' }],
          detailBody: 'Stat Acetazolamide 250 mg PO advised.',
          actions: [{ id: 'order-stat', label: 'Order IOP Protocol', primary: true }],
        },
      ],
    };

    expect(filterMasterDetailItems(model.items, 'critical', 'iop')).toHaveLength(1);
    expect(toggleMasterDetailCheckedId(['m1'], 'm2')).toEqual(['m1', 'm2']);

    const html = renderToStaticMarkup(
      createElement(EmrMasterDetail, {
        model,
        onIntent: () => {},
      }),
    );
    expect(html).toContain('Clinical Work Queue &amp; Inbox');
    expect(html).toContain('Critical IOP 38 mmHg OD');
    expect(html).toContain('Stat Acetazolamide 250 mg PO advised.');
    expect(html).toContain('Order IOP Protocol');
  });

  it('renders EmrSynchronizedTimeGrid shared TimeAxis header and stacked tracks', () => {
    const model: EmrSynchronizedTimeGridViewModel = {
      id: 'stg-react',
      title: 'Synchronized Longitudinal Clinical Grid',
      resolution: '1h',
      scrollOffset: 0,
      columns: [
        { id: 'c08', timestamp: '2026-11-12T08:00:00Z', label: '08:00', shiftBadge: 'Morning' },
        { id: 'c09', timestamp: '2026-11-12T09:00:00Z', label: '09:00', shiftBadge: 'Morning', isCurrentTime: true },
      ],
      tracks: [
        {
          id: 'trk-1',
          title: 'Vitals & IOP Flowsheet',
          kind: 'vitals',
          rows: [
            {
              id: 'r1',
              label: 'IOP OD',
              unitLabel: 'mmHg',
              cells: {
                c08: { columnId: 'c08', valueLabel: '22', secondaryLabel: 'GAT' },
                c09: { columnId: 'c09', valueLabel: '16', secondaryLabel: 'Target' },
              },
            },
          ],
        },
      ],
    };

    expect(clampTimeGridScrollOffset(5, 2, 6)).toBe(0);

    const html = renderToStaticMarkup(
      createElement(EmrSynchronizedTimeGrid, {
        model,
        onIntent: () => {},
      }),
    );
    expect(html).toContain('Synchronized Longitudinal Clinical Grid');
    expect(html).toContain('Time Axis (1h)');
    expect(html).toContain('Vitals &amp; IOP Flowsheet');
    expect(html).toContain('IOP OD');
    expect(html).toContain('NOW');
  });
});
