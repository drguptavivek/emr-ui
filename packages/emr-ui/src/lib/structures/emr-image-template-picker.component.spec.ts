import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type { ImageTemplatePickerIntent, ImageTemplatePickerViewModel } from '@drguptavivek/emr-controller';
import * as pickerLogic from './emr-image-template-picker.logic';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/structures/emr-image-template-picker.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadPickerClass() {
  const withoutDecorator = componentSource.replace(
    /@Component\(\{[\s\S]*?\}\)\s*(?=export class EmrImageTemplatePickerComponent)/,
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
        effect: (fn: () => void) => {
          void fn;
        },
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
    if (id === '@angular/common') {
      return { NgTemplateOutlet: class {} };
    }
    if (id === '@ng-icons/core') {
      return { NgIcon: class {}, provideIcons: () => [] };
    }
    if (id === '@ng-icons/heroicons/outline' || id === '@ng-icons/heroicons/solid') {
      return new Proxy({}, { get: () => 'icon' });
    }
    if (id === './emr-image-template-picker.logic') {
      return pickerLogic;
    }
    throw new Error(`Unexpected require: ${id}`);
  };

  const module = { exports: {} as { EmrImageTemplatePickerComponent?: new () => Record<string, unknown> } };
  const fn = new Function('require', 'module', 'exports', transpiled);
  fn(mockRequire, module, module.exports);
  return { EmrImageTemplatePickerComponent: module.exports.EmrImageTemplatePickerComponent!, setHostContains };
}

describe('EmrImageTemplatePickerComponent (Angular)', () => {
  const baseModel: ImageTemplatePickerViewModel = {
    title: 'Choose an outline',
    options: [
      { id: 'r-od', label: 'Retina OD', imageUrl: '/r-od.svg', width: 120, height: 120, groupId: 'retina', badges: ['Right'] },
      { id: 'r-os', label: 'Retina OS', imageUrl: '/r-os.svg', width: 120, height: 120, groupId: 'retina', badges: ['Left'] },
      { id: 'c-od', label: 'Cornea OD', imageUrl: '/c-od.svg', width: 120, height: 120, groupId: 'cornea', badges: ['Right'] },
    ],
    groups: [
      { id: 'retina', label: 'Retina', count: 2 },
      { id: 'cornea', label: 'Cornea', count: 1 },
    ],
    query: '',
    selectedId: 'r-od',
    totalLabel: '3 of 3 outlines',
    emptyMessage: 'No outlines match.',
    favouriteIds: ['c-od'],
    canEditFavourites: true,
  };

  it('uses signal inputs/outputs, type-only controller import, >=44px targets, print hiding, and zero raw emojis/disabled', () => {
    expect(componentSource).toMatch(/import type\s*\{[\s\S]*ImageTemplatePickerViewModel[\s\S]*\}\s*from\s*'@drguptavivek\/emr-controller'/);
    expect(componentSource).toMatch(/readonly\s+model\s*=\s*input\.required<ImageTemplatePickerViewModel>\(\)/);
    expect(componentSource).toMatch(/readonly\s+headingId\s*=\s*input<string>\(\)/);
    expect(componentSource).toMatch(/readonly\s+idPrefix\s*=\s*input<string>\(''\)/);
    expect(componentSource).toMatch(/readonly\s+readOnly\s*=\s*input<boolean>\(false\)/);
    expect(componentSource).toMatch(/readonly\s+labels\s*=\s*input<EmrImageTemplatePickerLabels>\(\)/);
    expect(componentSource).toMatch(/readonly\s+intent\s*=\s*output<ImageTemplatePickerIntent>\(\)/);
    expect(componentSource).toMatch(/readonly\s+focused\s*=\s*output<void>\(\)/);
    expect(componentSource).toMatch(/readonly\s+blurred\s*=\s*output<void>\(\)/);
    expect(componentSource).not.toMatch(/@Input|@Output|EventEmitter|disabled\s*=\s*input/);
    expect(componentSource).not.toMatch(/[★☆✕✓]/);
    expect(componentSource).toContain('data-emr-print="hide"');
    expect(componentSource).toContain(':host-context(.emr-print)');
    expect(componentSource).toContain('@media print');
    expect(componentSource).toContain('min-height:max(44px,var(--emr-control-height))');
    expect(componentSource).not.toMatch(/\[disabled\]|\[attr\.disabled\]/);
  });

  it('computes partitioned views, tab stops, ids, and enforces readOnly guards and Escape behaviour', () => {
    const { EmrImageTemplatePickerComponent, setHostContains } = loadPickerClass();
    const instance = new EmrImageTemplatePickerComponent() as Record<string, unknown> & {
      model: { set: (m: ImageTemplatePickerViewModel) => void };
      idPrefix: { set: (p: string) => void };
      headingId: { set: (h: string | undefined) => void };
      readOnly: { set: (r: boolean) => void };
      intent: { subscribe: (fn: (i: ImageTemplatePickerIntent) => void) => void };
      focused: { subscribe: (fn: () => void) => void };
      blurred: { subscribe: (fn: () => void) => void };
      pickerId: () => string;
      titleId: () => string;
      searchId: () => string;
      view: () => pickerLogic.PartitionedImageTemplates;
      tabStopId: () => string | undefined;
      canEditFavs: () => boolean;
      select: (o: ImageTemplatePickerViewModel['options'][number]) => void;
      toggleFavourite: (o: ImageTemplatePickerViewModel['options'][number]) => void;
      selectGroup: (id: string | null) => void;
      onQuery: (e: { target: { value: string } }) => void;
      clearSearch: () => void;
      resetFilters: () => void;
      onEscape: (e: { preventDefault: () => void }) => void;
      onHostFocusIn: () => void;
      onHostFocusOut: (e: { relatedTarget: unknown }) => void;
    };

    const intents: ImageTemplatePickerIntent[] = [];
    let focusCount = 0;
    let blurCount = 0;
    instance.intent.subscribe((i) => intents.push(i));
    instance.focused.subscribe(() => { focusCount += 1; });
    instance.blurred.subscribe(() => { blurCount += 1; });

    instance.model.set(baseModel);
    instance.idPrefix.set('opd');

    expect(instance.pickerId()).toBe('opd-emr-image-template-picker');
    expect(instance.titleId()).toBe('opd-emr-image-template-picker-heading');
    expect(instance.searchId()).toBe('opd-emr-image-template-picker-q');
    expect(instance.view().favs.map((o) => o.id)).toEqual(['c-od']);
    expect(instance.view().rest.map((o) => o.id)).toEqual(['r-od', 'r-os']);
    expect(instance.tabStopId()).toBe('r-od');
    expect(instance.canEditFavs()).toBe(true);

    // Selection and favourite toggle emit when interactive
    instance.select(baseModel.options[1]);
    instance.toggleFavourite(baseModel.options[0]);
    expect(intents).toEqual([
      { type: 'templateSelected', templateId: 'r-os' },
      { type: 'favouriteToggleRequested', templateId: 'r-od', favourite: true },
    ]);

    // Escape clears search when query is active; emits closeRequested when query is empty
    let prevented = 0;
    instance.onEscape({ preventDefault: () => { prevented += 1; } });
    expect(prevented).toBe(1);
    expect(intents[2]).toEqual({ type: 'closeRequested' });

    instance.model.set({ ...baseModel, query: 'retina', selectedGroupId: 'retina' });
    instance.onEscape({ preventDefault: () => { prevented += 1; } });
    expect(intents[3]).toEqual({ type: 'queryChangeRequested', query: '' });

    // Reset filters clears both query and selectedGroupId
    instance.resetFilters();
    expect(intents.slice(4)).toEqual([
      { type: 'queryChangeRequested', query: '' },
      { type: 'groupSelected', groupId: null },
    ]);

    // readOnly blocks tile selection and favourite toggle, while keeping search and filter chips operable
    const countBeforeReadOnly = intents.length;
    instance.readOnly.set(true);
    expect(instance.canEditFavs()).toBe(false);
    instance.select(baseModel.options[0]);
    instance.toggleFavourite(baseModel.options[0]);
    expect(intents).toHaveLength(countBeforeReadOnly);

    instance.selectGroup('retina');
    instance.onQuery({ target: { value: 'cornea' } });
    expect(intents.slice(countBeforeReadOnly)).toEqual([
      { type: 'groupSelected', groupId: 'retina' },
      { type: 'queryChangeRequested', query: 'cornea' },
    ]);

    // Focus/blur boundary
    setHostContains(true);
    instance.onHostFocusIn();
    instance.onHostFocusOut({ relatedTarget: {} });
    expect(focusCount).toBe(1);
    expect(blurCount).toBe(0);

    setHostContains(false);
    instance.onHostFocusOut({ relatedTarget: null });
    expect(blurCount).toBe(1);
  });

  it('exercises logic helpers for grid navigation and label resolution', () => {
    const labels = pickerLogic.resolveImageTemplatePickerLabels({ clearSearch: 'Reset query' });
    expect(labels.clearSearch).toBe('Reset query');
    expect(labels.close).toBe('Close');
    expect(pickerLogic.templateGridNextIndex('ArrowDown', 0, 5, 2, 2)).toBe(2);
    expect(pickerLogic.templateGridNextIndex('ArrowUp', 2, 5, 2, 2)).toBe(0);
    expect(pickerLogic.templateTileLabel(baseModel.options[0])).toBe('Retina OD, Right');
  });
});
