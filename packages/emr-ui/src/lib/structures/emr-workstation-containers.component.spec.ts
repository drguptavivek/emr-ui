import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type {
  EmrCommandPaletteIntent,
  EmrCommandPaletteViewModel,
  EmrMasterDetailIntent,
  EmrMasterDetailViewModel,
  EmrSplitWorkspaceIntent,
  EmrSplitWorkspaceViewModel,
  EmrSynchronizedTimeGridIntent,
  EmrSynchronizedTimeGridViewModel,
} from '../../../../../emr-controller/src/l3-workstation.models';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/structures/emr-workstation-containers.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadWorkstationModule() {
  const withoutDecorators = componentSource.replace(
    /@Component\(\{[\s\S]*?\}\)\s*(?=export class Emr)/g,
    '',
  );
  const transpiled = ts.transpileModule(withoutDecorators, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const makeSignal = <T>(initial: T) => {
    let val = initial;
    const sig = () => val;
    sig.set = (next: T) => {
      val = next;
    };
    return sig;
  };

  const mockRequire = (id: string) => {
    if (id === '@angular/core') {
      return {
        ChangeDetectionStrategy: { OnPush: 0 },
        Component: () => (cls: unknown) => cls,
        input: Object.assign(
          <T>(init?: T) => makeSignal<T | undefined>(init),
          { required: <T>() => makeSignal<T | undefined>(undefined) },
        ),
        output: <T>() => {
          const listeners: ((v: T) => void)[] = [];
          return {
            emit: (v: T) => listeners.forEach((l) => l(v)),
            subscribe: (l: (v: T) => void) => listeners.push(l),
          };
        },
      };
    }
    return {};
  };

  const exportsObj: Record<string, unknown> = {};
  const moduleObj = { exports: exportsObj };
  const runner = new Function('exports', 'require', 'module', transpiled);
  runner(exportsObj, mockRequire, moduleObj);
  return moduleObj.exports as {
    EmrSplitWorkspaceComponent: new () => Record<string, any>;
    EmrCommandPaletteComponent: new () => Record<string, any>;
    EmrMasterDetailComponent: new () => Record<string, any>;
    EmrSynchronizedTimeGridComponent: new () => Record<string, any>;
  };
}

const mod = loadWorkstationModule();

describe('L3 Workstation Containers (Angular)', () => {
  it('enforces design-token-only styling and zero runtime emr-controller imports', () => {
    expect(componentSource).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/);
    expect(componentSource).not.toMatch(/ViewEncapsulation\.None/);
    expect(componentSource).toContain("import type {");
    expect(componentSource).toContain("from '@drguptavivek/emr-controller';");
    expect(componentSource).toContain(":host-context(.emr-print)");
  });

  describe('EmrSplitWorkspaceComponent', () => {
    const splitModel: EmrSplitWorkspaceViewModel = {
      id: 'ws-1',
      title: 'Retina Encounter Workstation',
      preset: '3-pane',
      paneSizes: [25, 50, 25],
      mobileActivePaneId: 'pane-chart',
      panes: [
        { id: 'pane-chart', slot: 'pane-primary', title: 'Chart Review', summaryItems: ['OCT OD CST 412 µm'] },
        { id: 'pane-note', slot: 'pane-secondary', title: 'Clinical Note & Orders' },
        { id: 'pane-pacs', slot: 'pane-tertiary', title: 'PACS & CDS', collapsible: true, collapsed: false },
      ],
    };

    it('switches layout presets, steps divider via keyboard/buttons, toggles collapse, and selects mobile tabs', () => {
      const instance = new mod.EmrSplitWorkspaceComponent();
      const emitted: EmrSplitWorkspaceIntent[] = [];
      instance.intent.subscribe((i: EmrSplitWorkspaceIntent) => emitted.push(i));
      instance.model.set(splitModel);

      expect(instance.visiblePanes()).toHaveLength(3);
      expect(instance.paneWidthPct(0, splitModel.panes[0]!)).toBe(25);

      instance.selectPreset('2-pane-40-60');
      expect(emitted.at(-1)).toEqual({
        type: 'presetChanged',
        preset: '2-pane-40-60',
        paneSizes: [40, 60],
      });

      instance.onDividerKeydown(0, { key: 'ArrowRight', preventDefault: () => {} });
      expect(emitted.at(-1)).toEqual({
        type: 'paneResized',
        dividerIndex: 0,
        deltaPct: 5,
        paneSizes: [30, 45, 25],
      });

      instance.togglePaneCollapse(splitModel.panes[2]!);
      expect(emitted.at(-1)).toEqual({
        type: 'paneCollapsedToggled',
        paneId: 'pane-pacs',
        collapsed: true,
      });

      instance.selectMobilePane('pane-note');
      expect(emitted.at(-1)).toEqual({
        type: 'mobilePaneSelected',
        paneId: 'pane-note',
      });
    });
  });

  describe('EmrCommandPaletteComponent', () => {
    const cmdModel: EmrCommandPaletteViewModel = {
      id: 'cmd-1',
      open: true,
      query: '',
      activeCategory: 'all',
      activeIndex: 0,
      items: [
        { id: 'c1', label: 'Order OCT Macula', category: 'orders', shortcut: '⌘O', pinned: true },
        { id: 'c2', label: '.sle-normal', category: 'smartphrases', shortcut: '.sle', recent: true },
        { id: 'c3', label: 'Open eMAR', category: 'navigation', shortcut: 'G M' },
      ],
    };

    it('emits queryChanged, categoryChanged, arrow-key itemHighlighted, Enter commandExecuted, and Escape dismissed', () => {
      const instance = new mod.EmrCommandPaletteComponent();
      const emitted: EmrCommandPaletteIntent[] = [];
      instance.intent.subscribe((i: EmrCommandPaletteIntent) => emitted.push(i));
      instance.model.set(cmdModel);

      expect(instance.filteredItems()).toHaveLength(3);
      expect(instance.groupedItems().length).toBeGreaterThan(0);

      instance.onQueryInput({ target: { value: 'oct' } });
      expect(emitted.at(-1)).toEqual({ type: 'queryChanged', query: 'oct' });

      instance.selectCategory('smartphrases');
      expect(emitted.at(-1)).toEqual({ type: 'categoryChanged', category: 'smartphrases' });

      instance.onKeydown({ key: 'ArrowDown', preventDefault: () => {} });
      expect(emitted.at(-1)).toEqual({ type: 'itemHighlighted', index: 1, itemId: 'c2' });

      instance.onKeydown({ key: 'Enter', preventDefault: () => {} });
      expect(emitted.at(-1)).toEqual({
        type: 'commandExecuted',
        itemId: 'c1',
        item: cmdModel.items[0],
      });

      instance.onKeydown({ key: 'Escape', preventDefault: () => {} });
      expect(emitted.at(-1)).toEqual({ type: 'dismissed' });
    });
  });

  describe('EmrMasterDetailComponent', () => {
    const mdModel: EmrMasterDetailViewModel = {
      id: 'md-1',
      title: 'Clinical Results & Co-Sign Inbox',
      searchQuery: '',
      activeFilterId: 'all',
      selectedId: 'item-1',
      checkedIds: ['item-1'],
      filters: [
        { id: 'all', label: 'All', count: 2 },
        { id: 'critical', label: 'Critical', count: 1 },
      ],
      items: [
        {
          id: 'item-1',
          title: 'Critical IOP 38 mmHg OD',
          subtitle: 'Ananya Sharma · Glaucoma Clinic',
          timestampLabel: '5m ago',
          unread: true,
          filterId: 'critical',
          actions: [{ id: 'ack', label: 'Acknowledge Alert', primary: true }],
        },
        {
          id: 'item-2',
          title: 'Discharge Summary Co-Sign',
          subtitle: 'Ward 4 · Bed 18',
          timestampLabel: '1h ago',
          filterId: 'cosign',
        },
      ],
    };

    it('emits searchChanged, filterChanged, itemSelected, detailClosed, batchSelectionToggled, and actionTriggered', () => {
      const instance = new mod.EmrMasterDetailComponent();
      const emitted: EmrMasterDetailIntent[] = [];
      instance.intent.subscribe((i: EmrMasterDetailIntent) => emitted.push(i));
      instance.model.set(mdModel);

      expect(instance.selectedItem()?.id).toBe('item-1');
      expect(instance.filteredItems()).toHaveLength(2);

      instance.onSearchInput({ target: { value: 'iop' } });
      expect(emitted.at(-1)).toEqual({ type: 'searchChanged', query: 'iop' });

      instance.selectFilter('critical');
      expect(emitted.at(-1)).toEqual({ type: 'filterChanged', filterId: 'critical' });

      instance.selectItem('item-2');
      expect(emitted.at(-1)).toEqual({ type: 'itemSelected', itemId: 'item-2' });

      instance.closeDetail();
      expect(emitted.at(-1)).toEqual({ type: 'detailClosed' });

      instance.toggleBatchItem('item-2');
      expect(emitted.at(-1)).toEqual({
        type: 'batchSelectionToggled',
        itemId: 'item-2',
        checkedIds: ['item-1', 'item-2'],
      });

      instance.triggerAction('ack', ['item-1']);
      expect(emitted.at(-1)).toEqual({
        type: 'actionTriggered',
        actionId: 'ack',
        itemIds: ['item-1'],
      });
    });
  });

  describe('EmrSynchronizedTimeGridComponent', () => {
    const gridModel: EmrSynchronizedTimeGridViewModel = {
      id: 'stg-1',
      title: 'Synchronized ICU / Perioperative Longitudinal Grid',
      resolution: '1h',
      scrollOffset: 0,
      visibleColumnCount: 3,
      columns: [
        { id: 't08', timestamp: '2026-11-12T08:00:00Z', label: '08:00', shiftBadge: 'Day' },
        { id: 't09', timestamp: '2026-11-12T09:00:00Z', label: '09:00', shiftBadge: 'Day' },
        { id: 't10', timestamp: '2026-11-12T10:00:00Z', label: '10:00', shiftBadge: 'Day', isCurrentTime: true },
        { id: 't11', timestamp: '2026-11-12T11:00:00Z', label: '11:00', shiftBadge: 'Day' },
      ],
      tracks: [
        {
          id: 'trk-vitals',
          title: 'Vitals & IOP Flowsheet',
          kind: 'vitals',
          rows: [
            {
              id: 'row-iop',
              label: 'IOP (OD / OS)',
              unitLabel: 'mmHg',
              cells: {
                t08: { columnId: 't08', valueLabel: '16 / 15' },
                t10: { columnId: 't10', valueLabel: '24 / 15', abnormalTone: 'warning' },
              },
            },
          ],
        },
      ],
    };

    it('emits resolutionChanged, scrollOffsetChanged, columnSelected, trackToggled, and cellSelected', () => {
      const instance = new mod.EmrSynchronizedTimeGridComponent();
      const emitted: EmrSynchronizedTimeGridIntent[] = [];
      instance.intent.subscribe((i: EmrSynchronizedTimeGridIntent) => emitted.push(i));
      instance.model.set(gridModel);

      expect(instance.visibleColumns().map((c: any) => c.id)).toEqual(['t08', 't09', 't10']);

      instance.selectResolution('15m');
      expect(emitted.at(-1)).toEqual({ type: 'resolutionChanged', resolution: '15m' });

      instance.stepScroll(1);
      expect(emitted.at(-1)).toEqual({ type: 'scrollOffsetChanged', offset: 1 });

      instance.selectColumn('t10');
      expect(emitted.at(-1)).toEqual({ type: 'columnSelected', columnId: 't10' });

      instance.toggleTrack(gridModel.tracks[0]!);
      expect(emitted.at(-1)).toEqual({ type: 'trackToggled', trackId: 'trk-vitals', collapsed: true });

      const cell = gridModel.tracks[0]!.rows[0]!.cells['t10'];
      instance.selectCell('trk-vitals', 'row-iop', 't10', cell);
      expect(emitted.at(-1)).toEqual({
        type: 'cellSelected',
        trackId: 'trk-vitals',
        rowId: 'row-iop',
        columnId: 't10',
        cell,
      });
    });
  });
});
