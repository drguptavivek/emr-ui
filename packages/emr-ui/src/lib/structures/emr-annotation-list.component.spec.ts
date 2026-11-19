import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type { AnnotationListIntent, AnnotationListViewModel } from '@drguptavivek/emr-controller';
import * as listLogic from './emr-annotation-list.logic';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/structures/emr-annotation-list.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadListClass() {
  const withoutDecorator = componentSource.replace(
    /@Component\(\{[\s\S]*?\}\)\s*(?=export class EmrAnnotationListComponent)/,
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

  let containsResult = false;
  const setHostContains = (value: boolean) => {
    containsResult = value;
  };

  const mockRequire = (id: string) => {
    if (id === '@angular/core') {
      return {
        ChangeDetectionStrategy: { OnPush: 0 },
        ElementRef: class {},
        Component: () => (cls: unknown) => cls,
        computed: <T>(fn: () => T) => fn,
        inject: () => ({ nativeElement: { contains: () => containsResult } }),
        signal: <T>(init: T) => makeSignal(init),
        viewChildren: () => () => [],
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
    if (id === './emr-annotation-list.logic') {
      return listLogic;
    }
    throw new Error(`Unexpected require: ${id}`);
  };

  const module = { exports: {} as { EmrAnnotationListComponent?: new () => Record<string, unknown> } };
  const fn = new Function('require', 'module', 'exports', transpiled);
  fn(mockRequire, module, module.exports);
  return { EmrAnnotationListComponent: module.exports.EmrAnnotationListComponent!, setHostContains };
}

describe('EmrAnnotationListComponent (Angular)', () => {
  const baseModel: AnnotationListViewModel = {
    items: [
      {
        layer: {
          id: 'l1',
          label: 'RNFL defect',
          color: '#d92d20',
          strokeWidth: 3,
          visible: true,
          tool: 'circle',
          center: { x: 0.4, y: 0.5 },
          radiusX: 0.1,
          radiusY: 0.1,
        },
        number: 1,
        classLabel: 'Lesion',
        locked: true,
      },
      {
        layer: {
          id: 'l2',
          label: 'Haemorrhage',
          color: '#1d4ed8',
          strokeWidth: 3,
          visible: false,
          tool: 'line',
          points: [
            { x: 0.2, y: 0.2 },
            { x: 0.3, y: 0.3 },
          ],
        },
        number: 2,
      },
    ],
    selectedLayerId: 'l2',
    emptyMessage: 'No layers yet.',
    canLock: true,
  };

  it('uses signal inputs/outputs, idPrefix, zero disabled attributes, and .emr-print legend rules', () => {
    expect(componentSource).not.toMatch(/@Input\b|@Output\b/);
    expect(componentSource).not.toMatch(/\[disabled\]/);
    expect(componentSource).toContain(':host-context(.emr-print)');
    expect(componentSource).toContain('@media print');
    expect(componentSource).toContain('data-emr-print="hide"');
    expect(componentSource).toContain('break-inside:avoid');

    const { EmrAnnotationListComponent } = loadListClass();
    const list = new EmrAnnotationListComponent() as unknown as {
      model: { set: (v: AnnotationListViewModel) => void };
      idPrefix: { set: (v: string) => void };
      listId: () => string;
      rowId: (id: string) => string;
      activeStop: () => string | undefined;
    };

    list.model.set(baseModel);
    list.idPrefix.set('retina-');
    expect(list.listId()).toBe('retina-emr-annotation-list');
    expect(list.rowId('l1')).toBe('retina-al-row-l1');
    expect(list.activeStop()).toBe('l2');
  });

  it('enforces handler guards for locked layers, bounds, canLock, readOnly, and emits focused/blurred', () => {
    const { EmrAnnotationListComponent, setHostContains } = loadListClass();
    const list = new EmrAnnotationListComponent() as unknown as {
      model: { set: (v: AnnotationListViewModel) => void };
      intent: { subscribe: (fn: (i: AnnotationListIntent) => void) => void };
      focused: { subscribe: (fn: () => void) => void };
      blurred: { subscribe: (fn: () => void) => void };
      selectLayer: (id: string) => void;
      toggleVisibility: (id: string) => void;
      toggleLock: (id: string) => void;
      moveLayer: (id: string, dir: 'up' | 'down') => void;
      removeLayer: (id: string) => void;
      onHostFocusIn: () => void;
      onHostFocusOut: (e: { relatedTarget: unknown }) => void;
    };

    const intents: AnnotationListIntent[] = [];
    let focusCount = 0;
    let blurCount = 0;
    list.intent.subscribe((i) => intents.push(i));
    list.focused.subscribe(() => { focusCount += 1; });
    list.blurred.subscribe(() => { blurCount += 1; });

    list.model.set(baseModel);
    list.moveLayer('l1', 'down'); // blocked: l1 is locked
    list.removeLayer('l1'); // blocked: l1 is locked
    list.moveLayer('l2', 'down'); // blocked: l2 is last
    list.moveLayer('l2', 'up'); // allowed
    list.toggleVisibility('l1'); // allowed
    list.toggleLock('l1'); // allowed
    list.removeLayer('l2'); // allowed
    expect(intents).toEqual([
      { type: 'layerMoveRequested', layerId: 'l2', direction: 'up' },
      { type: 'layerVisibilityToggleRequested', layerId: 'l1' },
      { type: 'layerLockToggleRequested', layerId: 'l1' },
      { type: 'layerRemoveRequested', layerId: 'l2' },
    ]);

    // canLock false blocks lock toggle
    list.model.set({ ...baseModel, canLock: false });
    list.toggleLock('l1');
    expect(intents).toHaveLength(4);

    // readOnly blocks all mutations, keeps selection active
    list.model.set({ ...baseModel, readOnly: true });
    list.selectLayer('l1');
    list.toggleVisibility('l1');
    list.moveLayer('l2', 'up');
    list.removeLayer('l2');
    expect(intents).toHaveLength(5);
    expect(intents[4]).toEqual({ type: 'layerSelected', layerId: 'l1' });

    // Focus/blur boundary
    list.onHostFocusIn();
    expect(focusCount).toBe(1);
    setHostContains(true);
    list.onHostFocusOut({ relatedTarget: {} });
    expect(blurCount).toBe(0);
    setHostContains(false);
    list.onHostFocusOut({ relatedTarget: null });
    expect(blurCount).toBe(1);
  });
});
