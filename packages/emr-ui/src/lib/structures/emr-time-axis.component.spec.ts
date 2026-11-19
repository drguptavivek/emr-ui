import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type { TimeAxisViewModel } from '@drguptavivek/emr-controller';
import * as timeAxisLogic from './emr-time-axis.logic';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/structures/emr-time-axis.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadTimeAxisClass() {
  const withoutDecorator = componentSource.replace(
    /@Component\(\{[\s\S]*?\}\)\s*(?=export class EmrTimeAxisComponent)/,
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
  const focusCalls: number[] = [];

  const mockRequire = (id: string) => {
    if (id === '@angular/common') {
      return { NgTemplateOutlet: class {} };
    }
    if (id === '@angular/core') {
      return {
        ChangeDetectionStrategy: { OnPush: 0 },
        ElementRef: class {},
        Component: () => (cls: unknown) => cls,
        computed: <T>(fn: () => T) => fn,
        inject: () => ({ nativeElement: { contains: () => containsResult } }),
        signal: <T>(init: T) => makeSignal(init),
        viewChildren: () => () => [
          { nativeElement: { focus: () => focusCalls.push(0) } },
          { nativeElement: { focus: () => focusCalls.push(1) } },
          { nativeElement: { focus: () => focusCalls.push(2) } },
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
    if (id === './emr-time-axis.logic') {
      return timeAxisLogic;
    }
    throw new Error(`Unexpected require: ${id}`);
  };

  const module = { exports: {} as { EmrTimeAxisComponent?: new () => Record<string, unknown> } };
  const fn = new Function('require', 'module', 'exports', transpiled);
  fn(mockRequire, module, module.exports);
  return {
    EmrTimeAxisComponent: module.exports.EmrTimeAxisComponent!,
    setHostContains,
    focusCalls,
  };
}

describe('EmrTimeAxisComponent (Angular)', () => {
  const baseModel: TimeAxisViewModel = {
    id: 'icu-axis',
    title: 'ICU chart, hourly',
    ticks: [
      { id: 't08', label: '08:00', sublabel: 'Day 1' },
      { id: 't09', label: '09:00', sublabel: 'Day 1', current: true },
      { id: 't10', label: '10:00', sublabel: 'Day 1' },
    ],
    selectedTickId: 't08',
    steps: [
      { id: '60', label: 'Hourly' },
      { id: '30', label: '30 min' },
    ],
    selectedStepId: '60',
    canShiftEarlier: true,
    canShiftLater: false,
  };

  it('uses signal inputs/outputs, deterministic idPrefix, NgIcon chevrons, zero disabled attrs, and .emr-print rules', () => {
    expect(componentSource).not.toMatch(/@Input\b|@Output\b|nextTimeAxisId/);
    expect(componentSource).not.toMatch(/\[disabled\]/);
    expect(componentSource).not.toMatch(/‹|›/);
    expect(componentSource).toContain('heroChevronLeft');
    expect(componentSource).toContain('heroChevronRight');
    expect(componentSource).toContain(':host-context(.emr-print)');
    expect(componentSource).toContain('@media print');
    expect(componentSource).toContain('data-emr-print="hide"');
    expect(componentSource).toContain('data-emr-print="expand"');
    expect(componentSource).toContain('tabular-nums');
    expect(componentSource).toContain('min-height:44px');
  });

  it('resolves deterministic ids, custom labels, roving tab stop, and guards pan/step/slot intents', () => {
    const { EmrTimeAxisComponent, setHostContains, focusCalls } = loadTimeAxisClass();
    const axis = new EmrTimeAxisComponent() as unknown as {
      model: { set: (v: TimeAxisViewModel) => void };
      idPrefix: { set: (v: string) => void };
      headingId: { set: (v: string | undefined) => void };
      labels: { set: (v: Record<string, unknown>) => void };
      intent: { subscribe: (fn: (ev: unknown) => void) => void };
      focused: { subscribe: (fn: () => void) => void };
      blurred: { subscribe: (fn: () => void) => void };
      resolvedAxisId: () => string;
      titleId: () => string;
      stepSelectId: () => string;
      tickDomId: (id: string) => string;
      tabStopId: () => string | undefined;
      select: (tick: { id: string; label: string }) => void;
      shiftEarlier: () => void;
      shiftLater: () => void;
      stepChanged: (ev: Event) => void;
      onKey: (ev: KeyboardEvent) => void;
      onHostFocusIn: () => void;
      onHostFocusOut: (ev: FocusEvent) => void;
    };

    const emitted: unknown[] = [];
    let focusEvents = 0;
    let blurEvents = 0;
    axis.intent.subscribe((ev) => emitted.push(ev));
    axis.focused.subscribe(() => {
      focusEvents += 1;
    });
    axis.blurred.subscribe(() => {
      blurEvents += 1;
    });

    axis.model.set(baseModel);
    axis.idPrefix.set('ward-a-');
    expect(axis.resolvedAxisId()).toBe('ward-a-emr-time-axis-icu-axis');
    expect(axis.titleId()).toBe('ward-a-emr-time-axis-icu-axis-heading');
    expect(axis.stepSelectId()).toBe('ward-a-emr-time-axis-icu-axis-step');
    expect(axis.tickDomId('t09')).toBe('ward-a-emr-time-axis-icu-axis-tick-t09');
    expect(axis.tabStopId()).toBe('t08');

    axis.headingId.set('custom-axis-heading');
    expect(axis.titleId()).toBe('custom-axis-heading');

    // Valid & gated emissions
    axis.shiftEarlier();
    axis.shiftLater(); // blocked because canShiftLater is false
    const selectTarget = { value: '30' } as unknown as HTMLSelectElement;
    axis.stepChanged({ target: selectTarget } as unknown as Event);
    expect(selectTarget.value).toBe('60'); // controlled reset

    const invalidSelectTarget = { value: 'missing' } as unknown as HTMLSelectElement;
    axis.stepChanged({ target: invalidSelectTarget } as unknown as Event);

    // Keyboard roving: ArrowRight moves to t09, ArrowDown ignored, Enter selects t09
    let prevented = 0;
    axis.onKey({ key: 'ArrowDown', preventDefault: () => { prevented += 1; } } as unknown as KeyboardEvent);
    expect(prevented).toBe(0);
    axis.onKey({ key: 'ArrowRight', preventDefault: () => { prevented += 1; } } as unknown as KeyboardEvent);
    expect(prevented).toBe(1);
    expect(focusCalls).toEqual([1]);
    expect(axis.tabStopId()).toBe('t09');
    axis.onKey({ key: 'Enter', preventDefault: () => { prevented += 1; } } as unknown as KeyboardEvent);
    expect(prevented).toBe(2);

    expect(emitted).toEqual([
      { type: 'shiftEarlierRequested' },
      { type: 'stepChangeRequested', stepId: '30' },
      { type: 'tickSelected', tickId: 't09' },
    ]);

    // readOnly blocks all mutating intents
    axis.model.set({ ...baseModel, readOnly: true, canShiftLater: true });
    axis.shiftEarlier();
    axis.shiftLater();
    axis.select(baseModel.ticks[0]!);
    axis.stepChanged({ target: { value: '30' } } as unknown as Event);
    expect(emitted).toHaveLength(3);

    // Host focus/blur deduplication
    axis.onHostFocusIn();
    axis.onHostFocusIn();
    expect(focusEvents).toBe(1);
    setHostContains(true);
    axis.onHostFocusOut({ relatedTarget: {} } as unknown as FocusEvent);
    expect(blurEvents).toBe(0);
    setHostContains(false);
    axis.onHostFocusOut({ relatedTarget: null } as unknown as FocusEvent);
    expect(blurEvents).toBe(1);
  });
});
