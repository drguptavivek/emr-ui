import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type { AnnotationToolbarIntent, AnnotationToolbarViewModel } from '@drguptavivek/emr-controller';
import * as toolbarLogic from './emr-annotation-toolbar.logic';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/structures/emr-annotation-toolbar.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadToolbarClass() {
  const withoutDecorator = componentSource.replace(
    /@Component\(\{[\s\S]*?\}\)\s*(?=export class EmrAnnotationToolbarComponent)/,
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
  let penFocusCalls = 0;

  const mockRequire = (id: string) => {
    if (id === '@angular/core') {
      return {
        ChangeDetectionStrategy: { OnPush: 0 },
        ElementRef: class {},
        Component: () => (cls: unknown) => cls,
        computed: <T>(fn: () => T) => fn,
        effect: (fn: () => void) => {
          void fn;
        },
        inject: () => ({ nativeElement: { contains: () => containsResult } }),
        signal: <T>(init: T) => makeSignal(init),
        viewChild: () => () => ({ nativeElement: { focus: () => { penFocusCalls += 1; } } }),
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
    if (id === './emr-annotation-toolbar.logic') {
      return toolbarLogic;
    }
    throw new Error(`Unexpected require: ${id}`);
  };

  const module = { exports: {} as { EmrAnnotationToolbarComponent?: new () => Record<string, unknown> } };
  const fn = new Function('require', 'module', 'exports', transpiled);
  fn(mockRequire, module, module.exports);
  return {
    EmrAnnotationToolbarComponent: module.exports.EmrAnnotationToolbarComponent!,
    setHostContains,
    getPenFocusCalls: () => penFocusCalls,
  };
}

describe('EmrAnnotationToolbarComponent (Angular)', () => {
  const baseModel: AnnotationToolbarViewModel = {
    tools: [
      { id: 'select', label: 'Select', icon: 'heroCursorArrowRays', shortcutLabel: 'V' },
      { id: 'line', label: 'Line', icon: 'shape-line', shortcutLabel: 'L' },
      { id: 'lockedTool', label: 'Locked', icon: 'shape-rect', disabled: true },
    ],
    selectedToolId: 'line',
    colours: [
      { id: 'red', label: 'Red', hex: '#d92d20' },
      { id: 'blue', label: 'Blue', hex: '#1d4ed8' },
    ],
    selectedColourId: 'red',
    widths: [{ id: 'w2', label: 'Medium 3px', px: 3 }],
    selectedWidthId: 'w2',
    canUndo: true,
    canRedo: false,
    zoomLabel: '100%',
    canSave: true,
    saveLabel: 'Save sketch',
  };

  it('uses signal inputs/outputs, deterministic idPrefix panelId, zero disabled attributes, and .emr-print rules', () => {
    expect(componentSource).not.toMatch(/@Input\b|@Output\b|nextPenId/);
    expect(componentSource).not.toMatch(/\[disabled\]/);
    expect(componentSource).toContain(':host-context(.emr-print)');
    expect(componentSource).toContain('@media print');
    expect(componentSource).toContain('data-emr-print="hide"');
    expect(componentSource).toContain('aria-disabled');

    const { EmrAnnotationToolbarComponent } = loadToolbarClass();
    const tb = new EmrAnnotationToolbarComponent() as unknown as {
      model: { set: (v: AnnotationToolbarViewModel) => void };
      idPrefix: { set: (v: string) => void };
      headingId: { set: (v: string | undefined) => void };
      labels: { set: (v: Record<string, unknown>) => void };
      panelId: () => string;
      penLabel: () => string;
      activeStop: () => string | undefined;
    };

    tb.model.set(baseModel);
    tb.idPrefix.set('opd-');
    expect(tb.panelId()).toBe('opd-emr-tb-pen-panel');
    tb.idPrefix.set('');
    tb.headingId.set('canvas-tools');
    expect(tb.panelId()).toBe('canvas-tools-pen-panel');
    expect(tb.penLabel()).toBe('Pen: Red, Medium 3px');
    expect(tb.activeStop()).toBe('t:line');

    tb.labels.set({ penPrefix: 'Brush' });
    expect(tb.penLabel()).toBe('Brush: Red, Medium 3px');
  });

  it('enforces handler guards for readOnly, zoomLocked, canUndo/canRedo/canSave, disabled tools, pen popover, and focus/blur', () => {
    const { EmrAnnotationToolbarComponent, setHostContains, getPenFocusCalls } = loadToolbarClass();
    const tb = new EmrAnnotationToolbarComponent() as unknown as {
      model: { set: (v: AnnotationToolbarViewModel) => void };
      intent: { subscribe: (fn: (i: AnnotationToolbarIntent) => void) => void };
      focused: { subscribe: (fn: () => void) => void };
      blurred: { subscribe: (fn: () => void) => void };
      isPenOpen: () => boolean;
      togglePen: () => void;
      pick: (i: AnnotationToolbarIntent) => void;
      closePen: (refocus: boolean) => void;
      emitIntent: (i: AnnotationToolbarIntent) => void;
      onDocumentPointerDown: (e: { target: unknown }) => void;
      onHostFocusIn: () => void;
      onHostFocusOut: (e: { relatedTarget: unknown }) => void;
    };

    const intents: AnnotationToolbarIntent[] = [];
    let focusCount = 0;
    let blurCount = 0;
    tb.intent.subscribe((i) => intents.push(i));
    tb.focused.subscribe(() => { focusCount += 1; });
    tb.blurred.subscribe(() => { blurCount += 1; });

    tb.model.set(baseModel);
    tb.emitIntent({ type: 'toolSelected', toolId: 'select' });
    tb.emitIntent({ type: 'toolSelected', toolId: 'lockedTool' }); // blocked
    tb.emitIntent({ type: 'undoRequested' });
    tb.emitIntent({ type: 'redoRequested' }); // blocked (!canRedo)
    tb.emitIntent({ type: 'saveRequested' });
    tb.emitIntent({ type: 'zoomInRequested' });
    expect(intents).toEqual([
      { type: 'toolSelected', toolId: 'select' },
      { type: 'undoRequested' },
      { type: 'saveRequested' },
      { type: 'zoomInRequested' },
    ]);

    // Pen open -> pick -> closes and refocuses trigger
    tb.togglePen();
    expect(tb.isPenOpen()).toBe(true);
    tb.pick({ type: 'colourSelected', colourId: 'blue' });
    expect(tb.isPenOpen()).toBe(false);
    expect(getPenFocusCalls()).toBe(1);
    expect(intents[intents.length - 1]).toEqual({ type: 'colourSelected', colourId: 'blue' });

    // Pen open -> outside pointerdown closes
    tb.togglePen();
    expect(tb.isPenOpen()).toBe(true);
    setHostContains(false);
    tb.onDocumentPointerDown({ target: {} });
    expect(tb.isPenOpen()).toBe(false);

    // readOnly + zoomLocked guards
    tb.model.set({ ...baseModel, readOnly: true, zoomLocked: true });
    tb.togglePen();
    expect(tb.isPenOpen()).toBe(false);
    const beforeCount = intents.length;
    tb.emitIntent({ type: 'toolSelected', toolId: 'select' });
    tb.emitIntent({ type: 'undoRequested' });
    tb.emitIntent({ type: 'saveRequested' });
    tb.emitIntent({ type: 'zoomOutRequested' });
    expect(intents).toHaveLength(beforeCount);

    // Focus/blur boundary
    tb.onHostFocusIn();
    tb.onHostFocusIn();
    expect(focusCount).toBe(1);
    setHostContains(true);
    tb.onHostFocusOut({ relatedTarget: {} });
    expect(blurCount).toBe(0);
    setHostContains(false);
    tb.onHostFocusOut({ relatedTarget: null });
    expect(blurCount).toBe(1);
  });
});
