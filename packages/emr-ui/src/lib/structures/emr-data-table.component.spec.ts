import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type { EmrDataTableModel } from '@drguptavivek/emr-controller';
import * as dataTableLogic from './emr-data-table.logic';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/structures/emr-data-table.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadDataTableClass() {
  const withoutDecorator = componentSource.replace(
    /@Component\(\{[\s\S]*?\}\)\s*(?=export class EmrDataTableComponent)/,
    '',
  );
  const transpiled = ts.transpileModule(withoutDecorator, {
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
    sig.update = (fn: (prev: T) => T) => {
      val = fn(val);
    };
    return sig;
  };

  let hostContains = false;
  let wrapContains = false;
  const focusCalls: string[] = [];

  const mockRequire = (id: string) => {
    if (id === '@angular/core') {
      return {
        ChangeDetectionStrategy: { OnPush: 0 },
        ElementRef: class {},
        Component: () => (cls: unknown) => cls,
        computed: <T>(fn: () => T) => fn,
        inject: () => ({ nativeElement: { contains: () => hostContains } }),
        signal: <T>(init: T) => makeSignal(init),
        viewChild: (name: string) => () =>
          name === 'menuWrapEl'
            ? { nativeElement: { contains: () => wrapContains } }
            : name === 'menuTriggerEl'
              ? { nativeElement: { focus: () => focusCalls.push('trigger') } }
              : undefined,
        viewChildren: (name: string) => () =>
          name === 'menuItemEl'
            ? [
                { nativeElement: { focus: () => focusCalls.push('menu-0') } },
                { nativeElement: { focus: () => focusCalls.push('menu-1') } },
              ]
            : [
                { nativeElement: { focus: () => focusCalls.push('row-0') } },
                { nativeElement: { focus: () => focusCalls.push('row-1') } },
              ],
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
    if (id === '@ng-icons/core') {
      return { NgIcon: class {}, provideIcons: () => [] };
    }
    if (id === '@ng-icons/heroicons/outline') {
      return new Proxy({}, { get: () => 'icon' });
    }
    if (id === '../primitives/emr-feedback.component') {
      return { EmrBadgeComponent: class {} };
    }
    if (id === './emr-data-table.logic') {
      return dataTableLogic;
    }
    throw new Error(`Unexpected require: ${id}`);
  };

  const module = { exports: {} as { EmrDataTableComponent?: new () => Record<string, unknown> } };
  const fn = new Function('require', 'module', 'exports', transpiled);
  fn(mockRequire, module, module.exports);
  return {
    EmrDataTableComponent: module.exports.EmrDataTableComponent!,
    setHostContains: (v: boolean) => {
      hostContains = v;
    },
    setWrapContains: (v: boolean) => {
      wrapContains = v;
    },
    focusCalls,
  };
}

describe('EmrDataTableComponent (Angular)', () => {
  const baseModel: EmrDataTableModel = {
    caption: 'Referral registry',
    columns: [
      { id: 'patient', label: 'Patient', sortable: true, width: 180 },
      { id: 'status', label: 'Status', width: '25%' },
    ],
    rows: [
      { id: 'r1', cells: { patient: 'Meera Nair', status: { text: 'Cataract', badge: { label: 'Overdue', tone: 'warning' } } } },
      { id: 'r2', cells: { patient: 'Rohan Iyer', status: { text: 'Glaucoma', badge: { label: 'Booked', tone: 'info' } } } },
    ],
    selectedIds: ['r1'],
    sort: { columnId: 'patient', direction: 'asc' },
    filters: [{ id: 'f1', label: 'Status', valueLabel: 'Overdue' }],
    savedFilters: [{ id: 'sf1', label: 'Overdue > 14 days' }],
    bulkActions: [{ id: 'assign', label: 'Assign' }],
    density: 'comfortable',
    page: 1,
    pageCount: 3,
    pageSize: 10,
    pageSizeOptions: [5, 10, 25],
    summaryLabel: 'Showing 1-2 of 24',
    status: 'ready',
  };

  it('enforces signal API, monochrome NgIcons, <emr-badge>, 44px targets, zero [disabled] or Unicode symbols, and print/container CSS', () => {
    expect(componentSource).not.toMatch(/@Input\b|@Output\b|\bdisabled\s*=\s*input\b/);
    expect(componentSource).not.toMatch(/\[disabled\]/);
    expect(componentSource).not.toMatch(/×|▲|▼|↕/);
    expect(componentSource).toContain('heroXMark');
    expect(componentSource).toContain('heroChevronUp');
    expect(componentSource).toContain('heroChevronDown');
    expect(componentSource).toContain('heroChevronUpDown');
    expect(componentSource).toContain('<emr-badge');
    expect(componentSource).toContain('container-type: inline-size');
    expect(componentSource).toContain('@container (max-width: 560px)');
    expect(componentSource).toContain(':host-context(.emr-print)');
    expect(componentSource).toContain('@media print');
    expect(componentSource).toContain('data-emr-print="hide"');
    expect(componentSource).toContain('skeletonRows = [0, 1, 2, 3, 4]');
    expect(componentSource).toContain('min-width: 44px');
    expect(componentSource).toContain('var(--emr-control-height)');
  });

  it('resolves deterministic ids, column widths, tri-state select-all, and readOnly guards', () => {
    const { EmrDataTableComponent, setHostContains, setWrapContains, focusCalls } = loadDataTableClass();
    const table = new EmrDataTableComponent() as unknown as {
      model: { set: (v: EmrDataTableModel) => void };
      idPrefix: { set: (v: string) => void };
      headingId: { set: (v: string | undefined) => void };
      labels: { set: (v: Record<string, string>) => void };
      intent: { subscribe: (fn: (ev: unknown) => void) => void };
      focused: { subscribe: (fn: () => void) => void };
      blurred: { subscribe: (fn: () => void) => void };
      resolvedTableId: () => string;
      resolvedHeadingId: () => string;
      allState: () => string;
      colWidth: (w?: number | string) => string | null;
      menuOpen: () => boolean;
      toggleMenu: () => void;
      onDocumentPointerDown: (e: Event) => void;
      onMenuTriggerKeydown: (e: KeyboardEvent) => void;
      onMenuItemKeydown: (e: KeyboardEvent, i: number) => void;
      onSort: (colId: string) => void;
      onToggleAll: (e: Event) => void;
      onToggleRow: (e: Event, id: string) => void;
      onRemoveFilter: (id: string) => void;
      onAddFilter: () => void;
      onSaveFilterRequest: () => void;
      onSavedFilterSelect: (id: string) => void;
      onBulkAction: (id: string) => void;
      onPageStep: (d: -1 | 1) => void;
      onPageSizeChange: (e: Event) => void;
      onRowKey: (e: KeyboardEvent, idx: number, id: string) => void;
      onHostFocusIn: () => void;
      onHostFocusOut: (e: FocusEvent) => void;
    };

    const intents: unknown[] = [];
    let focusCount = 0;
    let blurCount = 0;
    table.intent.subscribe((ev) => intents.push(ev));
    table.focused.subscribe(() => {
      focusCount += 1;
    });
    table.blurred.subscribe(() => {
      blurCount += 1;
    });

    table.model.set(baseModel);
    table.idPrefix.set('ward-a');
    expect(table.resolvedTableId()).toBe('ward-a-emr-data-table');
    expect(table.resolvedHeadingId()).toBe('ward-a-emr-data-table-caption');
    table.headingId.set('custom-cap');
    expect(table.resolvedHeadingId()).toBe('custom-cap');
    expect(table.allState()).toBe('some');
    expect(table.colWidth(180)).toBe('180px');
    expect(table.colWidth('25%')).toBe('25%');

    // Interactive intents
    table.onSort('patient');
    table.onToggleRow({ target: { checked: true } } as unknown as Event, 'r2');
    table.onToggleAll({ target: { checked: true } } as unknown as Event);
    table.onPageStep(1);
    table.onPageSizeChange({ target: { value: '25' } } as unknown as Event);
    expect(intents).toEqual([
      { type: 'sortChanged', columnId: 'patient', direction: 'desc' },
      { type: 'selectionChanged', selectedIds: ['r1', 'r2'] },
      { type: 'selectionChanged', selectedIds: ['r1', 'r2'] },
      { type: 'pageChanged', page: 2 },
      { type: 'pageSizeChanged', pageSize: 25 },
    ]);

    // Saved filters menu outside-click & keyboard navigation
    table.toggleMenu();
    expect(table.menuOpen()).toBe(true);
    setWrapContains(true);
    table.onDocumentPointerDown({ target: {} } as Event);
    expect(table.menuOpen()).toBe(true);
    setWrapContains(false);
    table.onDocumentPointerDown({ target: {} } as Event);
    expect(table.menuOpen()).toBe(false);

    table.onMenuTriggerKeydown({ key: 'ArrowDown', preventDefault: () => {} } as KeyboardEvent);
    expect(table.menuOpen()).toBe(true);
    table.onMenuItemKeydown({ key: 'ArrowDown', preventDefault: () => {} } as KeyboardEvent, 0);
    expect(focusCalls).toContain('menu-1');

    // Roving row key navigation
    const rowTarget = {};
    table.onRowKey({ key: 'ArrowDown', target: rowTarget, currentTarget: rowTarget, preventDefault: () => {} } as unknown as KeyboardEvent, 0, 'r1');
    expect(focusCalls).toContain('row-1');

    // Read-only gates mutation while keeping sort/pagination/savedFilterSelected active
    intents.length = 0;
    table.model.set({ ...baseModel, readOnly: true });
    const rowInput = { checked: true };
    table.onToggleRow({ target: rowInput } as unknown as Event, 'r2');
    expect(rowInput.checked).toBe(false);
    table.onToggleAll({ target: { checked: true } } as unknown as Event);
    table.onRemoveFilter('f1');
    table.onAddFilter();
    table.onSaveFilterRequest();
    table.onBulkAction('assign');
    table.onRowKey({ key: ' ', target: rowTarget, currentTarget: rowTarget, preventDefault: () => {} } as unknown as KeyboardEvent, 0, 'r1');
    expect(intents).toEqual([]);

    table.onSort('patient');
    table.onPageStep(1);
    table.onSavedFilterSelect('sf1');
    expect(intents).toEqual([
      { type: 'sortChanged', columnId: 'patient', direction: 'desc' },
      { type: 'pageChanged', page: 2 },
      { type: 'savedFilterSelected', id: 'sf1' },
    ]);

    // Focus/blur lifecycle
    table.onHostFocusIn();
    setHostContains(true);
    table.onHostFocusOut({ relatedTarget: {} } as FocusEvent);
    expect(focusCount).toBe(1);
    expect(blurCount).toBe(0);
    setHostContains(false);
    table.onHostFocusOut({ relatedTarget: {} } as FocusEvent);
    expect(blurCount).toBe(1);
  });
});
