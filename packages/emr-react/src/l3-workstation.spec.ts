import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
  canStepTimeGridScroll,
  clampTimeGridScrollOffset,
  filterCommandPaletteItems,
  filterMasterDetailItems,
  groupCommandPaletteItems,
  isWorkstationNarrow,
  resolveCommandPalettePresentation,
  resolveSplitWorkspaceDividerBounds,
  resolveSplitWorkspacePresetSizes,
  stepCommandPaletteIndex,
  stepSplitWorkspacePaneSizes,
  toggleMasterDetailCheckedId,
  visibleSplitWorkspacePanes,
} from './l3-workstation.logic';

const reactSource = readFileSync(join(process.cwd(), 'packages/emr-react/src/l3-workstation.tsx'), 'utf8');

describe('L3 Workstation Containers (React & Pure Logic)', () => {
  it('enforces monochrome SVG icons, token font sizes, 44px hit targets, and zero disabled props', () => {
    expect(reactSource).not.toMatch(/[✕★●‹›⋮▸▾←✓◷]/);
    expect(reactSource).not.toMatch(/fontSize:\s*(?:10|11)\b/);
    expect(reactSource).not.toMatch(/\bdisabled\?: boolean/);
    expect(reactSource).toContain('RESOLVED_MONO_FONT');
    expect(reactSource).toContain('Math.max(44, t.controlHeight)');
  });

  it('renders EmrSplitWorkspace panes, presets, and divider controls with minWidthPct bounds', () => {
    const model: EmrSplitWorkspaceViewModel = {
      id: 'ws-react',
      title: 'Encounter Split Workspace',
      preset: '3-pane',
      paneSizes: [25, 50, 25],
      panes: [
        { id: 'p1', slot: 'pane-primary', title: 'Chart Review', minWidthPct: 20, summaryItems: ['Prior OCT CST 412 µm'] },
        { id: 'p2', slot: 'pane-secondary', title: 'Clinical Note & Orders', minWidthPct: 30 },
        { id: 'p3', slot: 'pane-tertiary', title: 'PACS & CDS', badge: { label: '1 Alert', tone: 'warning' } },
      ],
    };

    expect(visibleSplitWorkspacePanes(model.panes, '3-pane')).toHaveLength(3);
    expect(visibleSplitWorkspacePanes(model.panes, '2-pane-50-50')).toHaveLength(2);
    expect(resolveSplitWorkspacePresetSizes('2-pane-40-60', 2)).toEqual([40, 60]);
    expect(stepSplitWorkspacePaneSizes([25, 50, 25], 0, 5, model.panes)).toEqual([30, 45, 25]);
    expect(stepSplitWorkspacePaneSizes([25, 50, 25], 0, -20, model.panes)).toEqual([20, 55, 25]);
    expect(resolveSplitWorkspaceDividerBounds([25, 50, 25], 0, model.panes)).toEqual({ min: 20, max: 45, now: 25 });
    expect(isWorkstationNarrow(420, 1280)).toBe(true);
    expect(isWorkstationNarrow(960, 1280)).toBe(false);

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
    expect(html).toContain('aria-valuemin="20"');
    expect(html).toContain('<svg');
  });

  it('renders EmrCommandPalette combobox + listbox ARIA, inline/modal presentation, and pinned SVG badge', () => {
    const model: EmrCommandPaletteViewModel = {
      id: 'cmd-react',
      title: 'Quick Command Launcher',
      presentation: 'inline',
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
    expect(resolveCommandPalettePresentation(model)).toBe('inline');
    expect(resolveCommandPalettePresentation({ presentation: undefined })).toBe('modal');

    const html = renderToStaticMarkup(
      createElement(EmrCommandPalette, {
        model,
        onIntent: () => {},
      }),
    );
    expect(html).toContain('Quick Command Launcher');
    expect(html).toContain('Order Macular OCT');
    expect(html).toContain('⌘O');
    expect(html).toContain('Pinned');
    expect(html).toContain('.iop-normal');
    expect(html).toContain('role="combobox"');
    expect(html).toContain('role="listbox"');
    expect(html).toContain('aria-activedescendant="emr-cmd-cmd-react-opt-c1"');
    expect(html).toContain('role="region"');
    expect(html).toContain('<svg');

    const modalHtml = renderToStaticMarkup(
      createElement(EmrCommandPalette, {
        model: { ...model, presentation: 'modal' },
        onIntent: () => {},
      }),
    );
    expect(modalHtml).toContain('role="dialog"');
    expect(modalHtml).toContain('aria-modal="true"');
  });

  it('renders EmrMasterDetail without nested interactive role="option" and displays badges/detail', () => {
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
    expect(html).toContain('role="listitem"');
    expect(html).not.toContain('role="option"');
  });

  it('renders EmrSynchronizedTimeGrid badges, sparkline, note, abnormal tones, and Later boundary gating', () => {
    const model: EmrSynchronizedTimeGridViewModel = {
      id: 'stg-react',
      title: 'Synchronized Longitudinal Clinical Grid',
      resolution: '1h',
      scrollOffset: 0,
      visibleColumnCount: 2,
      columns: [
        { id: 'c08', timestamp: '2026-11-12T08:00:00Z', label: '08:00', shiftBadge: 'Morning' },
        { id: 'c09', timestamp: '2026-11-12T09:00:00Z', label: '09:00', shiftBadge: 'Morning', isCurrentTime: true },
      ],
      tracks: [
        {
          id: 'trk-1',
          title: 'Vitals & IOP Flowsheet',
          kind: 'vitals',
          badge: { label: 'Live', tone: 'info' },
          rows: [
            {
              id: 'r1',
              label: 'IOP OD',
              unitLabel: 'mmHg',
              cells: {
                c08: {
                  columnId: 'c08',
                  valueLabel: '22',
                  secondaryLabel: 'GAT',
                  abnormalTone: 'warning',
                  badge: { label: 'High', tone: 'warning' },
                  sparklineNorm: 0.72,
                  note: 'Check CCT',
                },
                c09: {
                  columnId: 'c09',
                  valueLabel: '16',
                  secondaryLabel: 'Target',
                  abnormalTone: 'success',
                },
              },
            },
          ],
        },
      ],
    };

    expect(clampTimeGridScrollOffset(5, 2, 6)).toBe(0);
    expect(canStepTimeGridScroll(0, 2, 2, 1)).toBe(false);
    expect(canStepTimeGridScroll(0, 3, 2, 1)).toBe(true);
    expect(canStepTimeGridScroll(1, 3, 2, 1)).toBe(false);

    const html = renderToStaticMarkup(
      createElement(EmrSynchronizedTimeGrid, {
        model,
        onIntent: () => {},
      }),
    );
    expect(html).toContain('Synchronized Longitudinal Clinical Grid');
    expect(html).toContain('Time Axis (1h)');
    expect(html).toContain('Vitals &amp; IOP Flowsheet');
    expect(html).toContain('Live');
    expect(html).toContain('IOP OD');
    expect(html).toContain('NOW');
    expect(html).toContain('High');
    expect(html).toContain('Check CCT');
    expect(html).toContain('72%');
    expect(html).toContain('aria-label="Scroll later"');
    expect(html).toContain('aria-disabled="true"');
  });
});
