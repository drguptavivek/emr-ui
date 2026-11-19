// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type {
  EmrCommandPaletteViewModel,
  EmrMasterDetailViewModel,
  EmrSplitWorkspaceViewModel,
  EmrSynchronizedTimeGridViewModel,
} from '../../emr-controller/src/l3-workstation.models.js';
import {
  EmrCommandPaletteElement,
  EmrMasterDetailElement,
  EmrSplitWorkspaceElement,
  EmrSynchronizedTimeGridElement,
  registerL3WorkstationElements,
} from './l3-workstation.js';

const litSource = readFileSync(join(process.cwd(), 'packages/emr-elements/src/l3-workstation.ts'), 'utf8');
const mounted: HTMLElement[] = [];

async function mount<T extends HTMLElement & { updateComplete: Promise<boolean> }>(
  tag: string,
  props: Partial<T>,
) {
  registerL3WorkstationElements();
  const element = Object.assign(document.createElement(tag) as T, props);
  mounted.push(element);
  document.body.append(element);
  await element.updateComplete;
  const intents: unknown[] = [];
  element.addEventListener('intent', (event) => intents.push((event as CustomEvent).detail));
  return { element, intents };
}

afterEach(() => {
  for (const el of mounted.splice(0)) el.remove();
});

describe('Lit L3 Workstation Elements', () => {
  it('uses monochrome SVG icons, >=44px targets, @container rules, zero native ?disabled, and zero raw glyphs', () => {
    expect(litSource).not.toMatch(/[✕★●‹›⋮▸▾←✓◷]/);
    expect(litSource).not.toContain('?disabled=');
    expect(litSource).toContain('min-height: 44px');
    expect(litSource).toContain('@container (max-width: 720px)');
    expect(litSource).toContain('renderEmrSvgIcon');
  });

  it('registers all 4 workstation elements and emits presetChanged, paneResized (with minWidthPct + Home/End), paneCollapsedToggled, and mobilePaneSelected on <emr-split-workspace>', async () => {
    const model: EmrSplitWorkspaceViewModel = {
      id: 'ws-lit',
      title: 'Retina Split Workstation',
      preset: '3-pane',
      paneSizes: [25, 50, 25],
      panes: [
        { id: 'p1', slot: 'pane-primary', title: 'Chart Review', minWidthPct: 20, summaryItems: ['OCT OD 412 µm'] },
        { id: 'p2', slot: 'pane-secondary', title: 'Clinical Note', minWidthPct: 30 },
        { id: 'p3', slot: 'pane-tertiary', title: 'PACS & CDS', collapsible: true, collapsed: false },
      ],
    };

    const { element, intents } = await mount<EmrSplitWorkspaceElement>('emr-split-workspace', { model });
    expect(element.shadowRoot!.textContent).toContain('Retina Split Workstation');
    expect(element.shadowRoot!.textContent).toContain('OCT OD 412 µm');

    const buttons = [...element.shadowRoot!.querySelectorAll('button')];
    buttons.find((b) => b.textContent?.trim() === '40 / 60')!.click();
    expect(intents.at(-1)).toEqual({
      type: 'presetChanged',
      preset: '2-pane-40-60',
      paneSizes: [40, 60],
    });

    const divider = element.shadowRoot!.querySelector('[role="separator"]') as HTMLElement;
    expect(divider.querySelectorAll('button')).toHaveLength(0);
    expect(divider.getAttribute('aria-valuemin')).toBe('20');
    expect(divider.getAttribute('aria-valuemax')).toBe('45');
    divider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(intents.at(-1)).toEqual({
      type: 'paneResized',
      dividerIndex: 0,
      deltaPct: 5,
      paneSizes: [30, 45, 25],
    });

    divider.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(intents.at(-1)).toEqual({
      type: 'paneResized',
      dividerIndex: 0,
      deltaPct: -100,
      paneSizes: [20, 55, 25],
    });

    divider.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(intents.at(-1)).toEqual({
      type: 'paneResized',
      dividerIndex: 0,
      deltaPct: 100,
      paneSizes: [45, 30, 25],
    });

    buttons.find((b) => b.textContent?.trim() === 'Collapse')!.click();
    expect(intents.at(-1)).toEqual({
      type: 'paneCollapsedToggled',
      paneId: 'p1',
      collapsed: true,
    });

    const mobileTabs = [...element.shadowRoot!.querySelectorAll('[role="tab"]')];
    (mobileTabs[1] as HTMLButtonElement).click();
    expect(intents.at(-1)).toEqual({
      type: 'mobilePaneSelected',
      paneId: 'p2',
    });
  });

  it('emits queryChanged, categoryChanged, itemHighlighted, commandExecuted, and dismissed on <emr-command-palette> with combobox ARIA + inline/modal presentation', async () => {
    const model: EmrCommandPaletteViewModel = {
      id: 'cmd-lit',
      title: 'Clinical Command Palette',
      open: true,
      query: '',
      activeCategory: 'all',
      activeIndex: 0,
      items: [
        { id: 'c1', label: 'Order Macular OCT', category: 'orders', shortcut: '⌘O', pinned: true },
        { id: 'c2', label: '.sle-normal', category: 'smartphrases', shortcut: '.sle' },
      ],
    };

    const { element, intents } = await mount<EmrCommandPaletteElement>('emr-command-palette', { model });
    expect(element.shadowRoot!.textContent).toContain('Order Macular OCT');

    const input = element.shadowRoot!.querySelector('input[type="search"]') as HTMLInputElement;
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe('emr-cmd-cmd-lit-opt-c1');

    input.value = 'oct';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(intents.at(-1)).toEqual({ type: 'queryChanged', query: 'oct' });

    const tabs = [...element.shadowRoot!.querySelectorAll('[role="tab"]')];
    (tabs.find((t) => t.textContent?.trim() === 'SmartPhrases') as HTMLButtonElement).click();
    expect(intents.at(-1)).toEqual({ type: 'categoryChanged', category: 'smartphrases' });

    const dialog = element.shadowRoot!.querySelector('[role="dialog"]') as HTMLElement;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(intents.at(-1)).toEqual({ type: 'itemHighlighted', index: 1, itemId: 'c2' });

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(intents.at(-1)).toEqual({
      type: 'commandExecuted',
      itemId: 'c1',
      item: model.items[0],
    });

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(intents.at(-1)).toEqual({ type: 'dismissed' });

    element.model = { ...model, presentation: 'inline' };
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector('[role="dialog"]')).toBeNull();
    expect(element.shadowRoot!.querySelector('[role="region"]')).not.toBeNull();
  });

  it('emits searchChanged, filterChanged, itemSelected, detailClosed, batchSelectionToggled, and actionTriggered on <emr-master-detail> without nested interactive options', async () => {
    const model: EmrMasterDetailViewModel = {
      id: 'md-lit',
      title: 'Clinical Inbox',
      searchQuery: '',
      activeFilterId: 'all',
      selectedId: 'm1',
      checkedIds: ['m1'],
      filters: [
        { id: 'all', label: 'All', count: 2 },
        { id: 'critical', label: 'Critical', count: 1 },
      ],
      items: [
        {
          id: 'm1',
          title: 'Critical IOP 38 mmHg OD',
          unread: true,
          filterId: 'critical',
          detailBody: 'Stat Acetazolamide advised.',
          actions: [{ id: 'ack', label: 'Acknowledge', primary: true }],
        },
        {
          id: 'm2',
          title: 'Co-Sign Operative Note',
          filterId: 'cosign',
        },
      ],
    };

    const { element, intents } = await mount<EmrMasterDetailElement>('emr-master-detail', { model });
    expect(element.shadowRoot!.textContent).toContain('Critical IOP 38 mmHg OD');
    expect(element.shadowRoot!.textContent).toContain('Stat Acetazolamide advised.');
    expect(element.shadowRoot!.querySelector('[role="option"]')).toBeNull();

    const search = element.shadowRoot!.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'iop';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(intents.at(-1)).toEqual({ type: 'searchChanged', query: 'iop' });

    const filterBtn = [...element.shadowRoot!.querySelectorAll('[role="tab"]')].find((b) =>
      b.textContent?.includes('Critical'),
    ) as HTMLButtonElement;
    filterBtn.click();
    expect(intents.at(-1)).toEqual({ type: 'filterChanged', filterId: 'critical' });

    const itemButtons = [...element.shadowRoot!.querySelectorAll('button.md-item-btn')] as HTMLButtonElement[];
    itemButtons[1]!.click();
    expect(intents.at(-1)).toEqual({ type: 'itemSelected', itemId: 'm2' });

    const checkboxes = [...element.shadowRoot!.querySelectorAll('input[type="checkbox"]')] as HTMLInputElement[];
    checkboxes[1]!.dispatchEvent(new Event('change', { bubbles: true }));
    expect(intents.at(-1)).toEqual({
      type: 'batchSelectionToggled',
      itemId: 'm2',
      checkedIds: ['m1', 'm2'],
    });

    const buttons = [...element.shadowRoot!.querySelectorAll('button')];
    buttons.find((b) => b.textContent?.includes('Back to list'))!.click();
    expect(intents.at(-1)).toEqual({ type: 'detailClosed' });

    buttons.find((b) => b.textContent?.trim() === 'Acknowledge')!.click();
    expect(intents.at(-1)).toEqual({
      type: 'actionTriggered',
      actionId: 'ack',
      itemIds: ['m1'],
    });
  });

  it('emits resolutionChanged, scrollOffsetChanged, columnSelected, trackToggled, and cellSelected on <emr-synchronized-time-grid> and gates Later at max offset', async () => {
    const model: EmrSynchronizedTimeGridViewModel = {
      id: 'stg-lit',
      title: 'Synchronized ICU Time Grid',
      resolution: '1h',
      scrollOffset: 0,
      visibleColumnCount: 2,
      columns: [
        { id: 'c08', timestamp: '2026-11-12T08:00:00Z', label: '08:00', shiftBadge: 'Morning' },
        { id: 'c09', timestamp: '2026-11-12T09:00:00Z', label: '09:00', isCurrentTime: true },
        { id: 'c10', timestamp: '2026-11-12T10:00:00Z', label: '10:00' },
      ],
      tracks: [
        {
          id: 'trk-vitals',
          title: 'Vitals Flowsheet',
          kind: 'vitals',
          badge: { label: 'Live', tone: 'info' },
          rows: [
            {
              id: 'r-iop',
              label: 'IOP OD',
              unitLabel: 'mmHg',
              cells: {
                c08: {
                  columnId: 'c08',
                  valueLabel: '24',
                  secondaryLabel: 'GAT',
                  abnormalTone: 'warning',
                  badge: { label: 'High', tone: 'warning' },
                  sparklineNorm: 0.8,
                  note: 'Verify CCT',
                },
              },
            },
          ],
        },
      ],
    };

    const { element, intents } = await mount<EmrSynchronizedTimeGridElement>(
      'emr-synchronized-time-grid',
      { model },
    );
    expect(element.shadowRoot!.textContent).toContain('Synchronized ICU Time Grid');
    expect(element.shadowRoot!.textContent).toContain('Live');
    expect(element.shadowRoot!.textContent).toContain('High');
    expect(element.shadowRoot!.textContent).toContain('Verify CCT');
    expect(element.shadowRoot!.querySelectorAll('[role="row"]')).toHaveLength(0);
    expect(element.shadowRoot!.querySelectorAll('[role="rowheader"]')).toHaveLength(0);

    const buttons = [...element.shadowRoot!.querySelectorAll('button')];
    const earlierBtn = buttons.find((b) => b.getAttribute('aria-label') === 'Scroll earlier')!;
    const laterBtn = buttons.find((b) => b.getAttribute('aria-label') === 'Scroll later')!;
    expect(earlierBtn.getAttribute('aria-disabled')).toBe('true');
    expect(laterBtn.getAttribute('aria-disabled')).toBeNull();

    buttons.find((b) => b.textContent?.trim() === '15m')!.click();
    expect(intents.at(-1)).toEqual({ type: 'resolutionChanged', resolution: '15m' });

    laterBtn.click();
    expect(intents.at(-1)).toEqual({ type: 'scrollOffsetChanged', offset: 1 });

    // At max offset (3 cols - 2 visible = 1), Later becomes aria-disabled="true" and guarded
    element.model = { ...model, scrollOffset: 1 };
    await element.updateComplete;
    const laterAtMax = element.shadowRoot!.querySelector('[aria-label="Scroll later"]') as HTMLButtonElement;
    expect(laterAtMax.getAttribute('aria-disabled')).toBe('true');
    const prevLen = intents.length;
    laterAtMax.click();
    expect(intents).toHaveLength(prevLen);

    element.model = model;
    await element.updateComplete;
    const resetButtons = [...element.shadowRoot!.querySelectorAll('button')];
    resetButtons.find((b) => b.textContent?.includes('08:00'))!.click();
    expect(intents.at(-1)).toEqual({ type: 'columnSelected', columnId: 'c08' });

    resetButtons.find((b) => b.textContent?.includes('Vitals Flowsheet'))!.click();
    expect(intents.at(-1)).toEqual({ type: 'trackToggled', trackId: 'trk-vitals', collapsed: true });

    resetButtons.find((b) => b.textContent?.includes('GAT'))!.click();
    expect(intents.at(-1)).toEqual({
      type: 'cellSelected',
      trackId: 'trk-vitals',
      rowId: 'r-iop',
      columnId: 'c08',
      cell: model.tracks[0]!.rows[0]!.cells['c08'],
    });
  });
});
