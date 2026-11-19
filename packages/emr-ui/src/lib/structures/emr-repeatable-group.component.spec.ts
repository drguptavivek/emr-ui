import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import type {
  ClinicalFieldDefinition,
  ClinicalFormIntent,
  RepeatableGroupDefinition,
  RepeatableItemState,
} from '@drguptavivek/emr-controller';
import * as repeatableLogic from './emr-repeatable-group.logic';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/structures/emr-repeatable-group.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');
const emrCss = readFileSync(
  join(process.cwd(), 'packages/emr-ui/src/lib/foundations/emr.css'),
  'utf8',
);
const emrPrintCss = readFileSync(
  join(process.cwd(), 'packages/emr-ui/src/lib/foundations/emr-print.css'),
  'utf8',
);

function loadRepeatableGroupClass() {
  const withoutDecorator = componentSource.replace(
    /@Component\(\{[\s\S]*?\}\)\s*(?=export class EmrRepeatableGroupComponent)/,
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
        TemplateRef: class {},
        Component: () => (cls: unknown) => cls,
        booleanAttribute: (v: unknown) => v === '' || Boolean(v),
        computed: <T>(fn: () => T) => fn,
        inject: () => ({ nativeElement: { contains: () => containsResult } }),
        input: Object.assign(
          <T>(init?: T, opts?: { transform?: (v: unknown) => T }) => {
            const sig = makeSignal<T | undefined>(init);
            const wrapped = () => sig();
            wrapped.set = (next: unknown) => sig.set(opts?.transform ? opts.transform(next) : (next as T));
            return wrapped;
          },
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
    if (id === '../fields/emr-typed-field.component') {
      return { EmrTypedFieldComponent: class {} };
    }
    if (id === '../primitives/emr-feedback.component') {
      return { EmrBadgeComponent: class {} };
    }
    if (id === './emr-repeatable-group.logic') {
      return repeatableLogic;
    }
    throw new Error(`Unexpected require: ${id}`);
  };

  const module = { exports: {} as { EmrRepeatableGroupComponent?: new () => Record<string, unknown> } };
  const fn = new Function('require', 'module', 'exports', transpiled);
  fn(mockRequire, module, module.exports);
  return { EmrRepeatableGroupComponent: module.exports.EmrRepeatableGroupComponent!, setHostContains };
}

type GroupInstance = {
  definition: { set: (v: RepeatableGroupDefinition) => void };
  model: { set: (v: readonly RepeatableItemState[]) => void };
  headingId: { set: (v: string | undefined) => void };
  idPrefix: { set: (v: string) => void };
  readOnly: { set: (v: boolean) => void };
  emptyMessage: { set: (v: string | undefined) => void };
  error: { set: (v: string | undefined) => void };
  warning: { set: (v: string | undefined) => void };
  intent: { subscribe: (fn: (v: ClinicalFormIntent) => void) => void };
  focused: { subscribe: (fn: () => void) => void };
  blurred: { subscribe: (fn: () => void) => void };
  resolvedHeadingId: () => string;
  resolvedEmptyMessage: () => string;
  canAdd: () => boolean;
  maxItemsHint: () => string | undefined;
  itemLabel: (item: RepeatableItemState, index: number) => string;
  canRemove: (item: RepeatableItemState) => boolean;
  visibleFields: (item: RepeatableItemState) => readonly ClinicalFieldDefinition[];
  controlId: (item: RepeatableItemState, field: ClinicalFieldDefinition) => string;
  requestAdd: () => void;
  requestRemove: (item: RepeatableItemState) => void;
  onFieldFocused: (item: RepeatableItemState, field: ClinicalFieldDefinition) => void;
  onValueChanged: (item: RepeatableItemState, field: ClinicalFieldDefinition, value: unknown) => void;
  onStatusChanged: (item: RepeatableItemState, field: ClinicalFieldDefinition, status: unknown) => void;
  onFocusIn: () => void;
  onFocusOut: (e: { relatedTarget: unknown }) => void;
};

const BASE_DEF: RepeatableGroupDefinition = {
  kind: 'repeatable',
  id: 'drops',
  label: 'Topical drops',
  description: 'Eye drop regimen',
  addLabel: 'Add drop',
  emptyMessage: 'No drops ordered.',
  minItems: 1,
  maxItems: 2,
  fields: [
    { id: 'drug', label: 'Medication', type: 'text', span: 6 },
    { id: 'dose', label: 'Dose', type: 'quantity', unit: 'drops', span: 4 },
    { id: 'notes', label: 'Notes', type: 'text', span: 12 },
  ],
};

describe('EmrRepeatableGroupComponent (Angular)', () => {
  it('resolves headingId, normalized idPrefix controlIds, and emptyMessage fallback', () => {
    const { EmrRepeatableGroupComponent } = loadRepeatableGroupClass();
    const cmp = new EmrRepeatableGroupComponent() as unknown as GroupInstance;

    cmp.definition.set(BASE_DEF);
    expect(cmp.resolvedHeadingId()).toBe('drops-heading');
    expect(cmp.resolvedEmptyMessage()).toBe('No drops ordered.');

    cmp.idPrefix.set('opd-');
    expect(cmp.resolvedHeadingId()).toBe('opd-drops-heading');
    expect(cmp.controlId({ id: 'i1', fields: {} }, BASE_DEF.fields[0])).toBe('opd-drops-i1-drug');

    cmp.idPrefix.set('opd');
    expect(cmp.controlId({ id: 'i1', fields: {} }, BASE_DEF.fields[0])).toBe('opd-drops-i1-drug');

    cmp.headingId.set('custom-drops-heading');
    expect(cmp.resolvedHeadingId()).toBe('custom-drops-heading');

    cmp.emptyMessage.set('Override empty text');
    expect(cmp.resolvedEmptyMessage()).toBe('Override empty text');
  });

  it('enforces minItems, maxItems, readOnly, and item.readOnly for button visibility and emit gating', () => {
    const { EmrRepeatableGroupComponent } = loadRepeatableGroupClass();
    const cmp = new EmrRepeatableGroupComponent() as unknown as GroupInstance;
    const item1: RepeatableItemState = {
      id: 'd1',
      label: 'Drop 1',
      fields: { drug: { value: 'Timolol' }, dose: { value: { value: 1, unit: 'drops' } } },
    };
    const item2: RepeatableItemState = {
      id: 'd2',
      readOnly: true,
      fields: { drug: { value: 'Latanoprost' }, dose: { value: { value: 1, unit: 'drops' } } },
    };

    const emitted: ClinicalFormIntent[] = [];
    cmp.intent.subscribe((ev) => emitted.push(ev));

    cmp.definition.set(BASE_DEF);
    cmp.model.set([item1]);
    expect(cmp.canAdd()).toBe(true);
    expect(cmp.maxItemsHint()).toBeUndefined();
    expect(cmp.canRemove(item1)).toBe(false); // at minItems = 1

    cmp.requestRemove(item1);
    expect(emitted).toEqual([]); // gated

    cmp.requestAdd();
    expect(emitted).toEqual([{ type: 'repeatItemAddRequested', groupId: 'drops' }]);

    // At maxItems = 2
    cmp.model.set([item1, item2]);
    expect(cmp.canAdd()).toBe(false);
    expect(cmp.maxItemsHint()).toBe('Maximum 2 entries');
    expect(cmp.canRemove(item1)).toBe(true);
    expect(cmp.canRemove(item2)).toBe(false); // item2.readOnly = true

    cmp.requestAdd();
    cmp.requestRemove(item2);
    expect(emitted).toHaveLength(1); // both gated

    cmp.requestRemove(item1);
    expect(emitted[1]).toEqual({ type: 'repeatItemRemoveRequested', groupId: 'drops', itemId: 'd1' });

    // Group readOnly hides hint & blocks all mutations
    cmp.readOnly.set(true);
    expect(cmp.canAdd()).toBe(false);
    expect(cmp.maxItemsHint()).toBeUndefined();
    expect(cmp.canRemove(item1)).toBe(false);
    cmp.onValueChanged(item1, BASE_DEF.fields[0], 'Changed');
    cmp.onStatusChanged(item1, BASE_DEF.fields[0], 'declined');
    expect(emitted).toHaveLength(2);
  });

  it('filters hidden fields while keeping hidden fields with non-empty values (treating null quantity as empty)', () => {
    const { EmrRepeatableGroupComponent } = loadRepeatableGroupClass();
    const cmp = new EmrRepeatableGroupComponent() as unknown as GroupInstance;
    cmp.definition.set(BASE_DEF);

    const item: RepeatableItemState = {
      id: 'd1',
      fields: {
        drug: { value: '', hidden: true },
        dose: { value: { value: null, unit: 'drops' }, hidden: true },
        notes: { value: 'Keep visible', hidden: true },
      },
    };
    expect(cmp.visibleFields(item).map((f) => f.id)).toEqual(['notes']);

    const itemWithQty: RepeatableItemState = {
      id: 'd2',
      fields: {
        drug: { value: null },
        dose: { value: { value: 2, unit: 'drops' }, hidden: true },
        notes: { value: null, hidden: true },
      },
    };
    expect(cmp.visibleFields(itemWithQty).map((f) => f.id)).toEqual(['drug', 'dose']);
  });

  it('emits fieldFocused with group.item.field path and manages host focus/blur', () => {
    const { EmrRepeatableGroupComponent, setHostContains } = loadRepeatableGroupClass();
    const cmp = new EmrRepeatableGroupComponent() as unknown as GroupInstance;
    cmp.definition.set(BASE_DEF);

    const emitted: ClinicalFormIntent[] = [];
    cmp.intent.subscribe((ev) => emitted.push(ev));
    cmp.onFieldFocused({ id: 'd1', fields: {} }, BASE_DEF.fields[1]);
    expect(emitted).toEqual([{ type: 'fieldFocused', fieldId: 'drops.d1.dose' }]);

    let focusCount = 0;
    let blurCount = 0;
    cmp.focused.subscribe(() => {
      focusCount += 1;
    });
    cmp.blurred.subscribe(() => {
      blurCount += 1;
    });

    cmp.onFocusIn();
    cmp.onFocusIn();
    expect(focusCount).toBe(1);

    setHostContains(true);
    cmp.onFocusOut({ relatedTarget: {} });
    expect(blurCount).toBe(0);

    setHostContains(false);
    cmp.onFocusOut({ relatedTarget: {} });
    expect(blurCount).toBe(1);
  });

  it('upholds L3 zero-disabled rule, accessibility, icons, span binding, and CSS/print rules', () => {
    expect(componentSource).not.toContain('[disabled]');
    expect(componentSource).toContain('role="region"');
    expect(componentSource).toContain('[attr.aria-labelledby]="resolvedHeadingId()"');
    expect(componentSource).toContain("[attr.aria-label]=\"'Remove ' + itemLabel(item, $index)\"");
    expect(componentSource).toContain("[style.grid-column]=\"'span ' + (field.span ?? 6)\"");
    expect(componentSource).toContain('role="alert"');
    expect(componentSource).toContain('role="status"');
    expect(componentSource).toContain('<emr-badge [badge]="badge" />');
    expect(componentSource).toContain('data-emr-print="hide"');

    for (const cls of [
      '.emr-repeatable-group',
      '.emr-repeatable-group--readonly',
      '.emr-repeatable-group--error',
      '.emr-repeatable-group--warning',
      '.emr-repeatable-group__add',
      '.emr-repeatable-group__remove',
      '.emr-repeatable-group__item',
      '.emr-repeatable-group__grid',
    ]) {
      expect(emrCss).toContain(cls);
    }

    expect(emrPrintCss).toContain('.emr-repeatable-group__item');
  });
});
