import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type { ClinicalListItem, ClinicalListViewModel } from '@drguptavivek/emr-controller';
import * as clinicalListLogic from './emr-clinical-list.logic';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/structures/emr-clinical-list.component.ts',
);
const domainListsPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/domain/emr-clinical-lists.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');
const domainListsSource = readFileSync(domainListsPath, 'utf8');
const emrCss = readFileSync(
  join(process.cwd(), 'packages/emr-ui/src/lib/foundations/emr.css'),
  'utf8',
);
const emrPrintCss = readFileSync(
  join(process.cwd(), 'packages/emr-ui/src/lib/foundations/emr-print.css'),
  'utf8',
);

function loadClinicalListClass() {
  const withoutDecorator = componentSource.replace(
    /@Component\(\{[\s\S]*?\}\)\s*(?=export class EmrClinicalListComponent)/,
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
        ViewEncapsulation: { None: 2 },
        ElementRef: class {},
        Component: () => (cls: unknown) => cls,
        computed: <T>(fn: () => T) => fn,
        inject: () => ({ nativeElement: { contains: () => containsResult } }),
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
    if (id === '../primitives/emr-feedback.component') {
      return { EmrBadgeComponent: class {}, EmrStateMessageComponent: class {} };
    }
    if (id === './emr-clinical-list.logic') {
      return clinicalListLogic;
    }
    throw new Error(`Unexpected require: ${id}`);
  };

  const module = { exports: {} as { EmrClinicalListComponent?: new () => Record<string, unknown> } };
  const fn = new Function('require', 'module', 'exports', transpiled);
  fn(mockRequire, module, module.exports);
  return { EmrClinicalListComponent: module.exports.EmrClinicalListComponent!, setHostContains };
}

describe('EmrClinicalListComponent & L4 wrappers (Angular)', () => {
  it('resolves variants, heading levels, heading ids, labels, and item capabilities', () => {
    const { EmrClinicalListComponent } = loadClinicalListClass();
    const list = new EmrClinicalListComponent() as unknown as {
      model: { set: (v: ClinicalListViewModel) => void };
      headingId: { set: (v: string | undefined) => void };
      headingLevel: { set: (v: number) => void };
      labels: { set: (v: Record<string, string>) => void };
      resolvedVariant: () => string;
      resolvedHeadingLevel: () => number;
      resolvedHeadingId: () => string;
      resolvedTitle: () => string;
      resolvedAddLabel: () => string;
      resolvedEmptyMessage: () => string;
      allowAdd: () => boolean;
      isItemSelectable: (item: ClinicalListItem) => boolean;
      canEditItem: (item: ClinicalListItem) => boolean;
      canRemoveItem: (item: ClinicalListItem) => boolean;
      itemTone: (item: ClinicalListItem) => string | null;
    };

    const editable: ClinicalListItem = { id: 'm1', title: 'Metformin', tone: 'info' };
    const locked: ClinicalListItem = { id: 'm2', title: 'Aspirin', readOnly: true, selectable: false };

    list.model.set({
      items: [editable, locked],
      variant: 'elevated',
      addLabel: 'Add medication',
      emptyMessage: 'No active medications.',
    });
    list.headingLevel.set(3);
    list.headingId.set('meds-heading');

    expect(list.resolvedVariant()).toBe('elevated');
    expect(list.resolvedHeadingLevel()).toBe(3);
    expect(list.resolvedHeadingId()).toBe('meds-heading');
    expect(list.resolvedTitle()).toBe('Clinical information');
    expect(list.resolvedAddLabel()).toBe('Add medication');
    expect(list.resolvedEmptyMessage()).toBe('No active medications.');
    expect(list.allowAdd()).toBe(true);
    expect(list.isItemSelectable(editable)).toBe(true);
    expect(list.isItemSelectable(locked)).toBe(false);
    expect(list.canEditItem(editable)).toBe(true);
    expect(list.canRemoveItem(editable)).toBe(true);
    expect(list.canEditItem(locked)).toBe(false);
    expect(list.canRemoveItem(locked)).toBe(false);
    expect(list.itemTone(editable)).toBe('info');
    expect(list.itemTone(locked)).toBeNull();
  });

  it('gates add, edit, remove intents when readOnly or capability flags disallow them, while preserving retry and selection', () => {
    const { EmrClinicalListComponent } = loadClinicalListClass();
    const list = new EmrClinicalListComponent() as unknown as {
      model: { set: (v: ClinicalListViewModel) => void };
      intent: { subscribe: (fn: (v: unknown) => void) => void };
      onAdd: () => void;
      onRetry: () => void;
      onSelect: (item: ClinicalListItem) => void;
      onEdit: (item: ClinicalListItem) => void;
      onRemove: (item: ClinicalListItem) => void;
    };

    const emitted: unknown[] = [];
    list.intent.subscribe((ev) => emitted.push(ev));

    const item: ClinicalListItem = { id: 'a1', title: 'Penicillin' };
    const nonSelectable: ClinicalListItem = { id: 'a2', title: 'Latex', selectable: false };
    list.model.set({ items: [item, nonSelectable], readOnly: true });

    list.onAdd();
    list.onEdit(item);
    list.onRemove(item);
    list.onSelect(nonSelectable);
    expect(emitted).toEqual([]);

    list.onSelect(item);
    list.onRetry();
    expect(emitted).toEqual([
      { type: 'selected', id: 'a1' },
      { type: 'retryRequested' },
    ]);
  });

  it('emits focused on entry and blurred only when focus leaves the host', () => {
    const { EmrClinicalListComponent, setHostContains } = loadClinicalListClass();
    const list = new EmrClinicalListComponent() as unknown as {
      focused: { subscribe: (fn: () => void) => void };
      blurred: { subscribe: (fn: () => void) => void };
      onFocusIn: () => void;
      onFocusOut: (e: { relatedTarget: unknown }) => void;
    };

    let focusCount = 0;
    let blurCount = 0;
    list.focused.subscribe(() => {
      focusCount += 1;
    });
    list.blurred.subscribe(() => {
      blurCount += 1;
    });

    list.onFocusIn();
    list.onFocusIn();
    expect(focusCount).toBe(1);

    setHostContains(true);
    list.onFocusOut({ relatedTarget: {} });
    expect(blurCount).toBe(0);

    setHostContains(false);
    list.onFocusOut({ relatedTarget: {} });
    expect(blurCount).toBe(1);
  });

  it('maintains semantic markup, L4 wrapper split, monochrome SVGs, print rules, and CSS classes', () => {
    expect(componentSource).not.toContain('@ng-icons/core');
    expect(componentSource).not.toContain('ClinicalListAction');
    expect(componentSource).not.toMatch(/\[disabled\]/);
    expect(componentSource).toContain('<emr-badge [badge]="badge" />');
    expect(componentSource).toContain('<emr-state-message');
    expect(componentSource).toContain('data-emr-print="hide"');
    expect(componentSource).toContain('[attr.aria-current]="selected ? \'true\' : null"');

    for (const selector of [
      'emr-medication-list',
      'emr-allergy-list',
      'emr-chronic-disease-list',
      'emr-personal-history-list',
    ]) {
      expect(domainListsSource).toContain(`selector: '${selector}'`);
    }
    expect(domainListsSource).toContain('input.required<ClinicalListViewModel>()');
    expect(domainListsSource).toContain('output<ClinicalListIntent>()');

    for (const cls of [
      '.emr-panel--elevated',
      '.emr-panel--filled',
      '.emr-panel--subtle',
      '.emr-panel--readonly',
      '.emr-list__select',
      '.emr-list__meta',
      '.emr-list__item--selected',
      '.emr-list__item--readonly',
      '@container (max-width: 480px)',
    ]) {
      expect(emrCss).toContain(cls);
    }
    expect(emrPrintCss).toContain('.emr-list__item');
  });
});
