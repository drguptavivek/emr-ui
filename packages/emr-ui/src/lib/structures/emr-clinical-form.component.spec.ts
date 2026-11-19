import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import type {
  ClinicalFieldDefinition,
  ClinicalFormIntent,
  ClinicalFormViewModel,
} from '@drguptavivek/emr-controller';
import * as clinicalFormLogic from './emr-clinical-form.logic';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/structures/emr-clinical-form.component.ts',
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

function loadClinicalFormClass() {
  const withoutDecorator = componentSource.replace(
    /@Component\(\{[\s\S]*?\}\)\s*(?=export class EmrClinicalFormComponent)/,
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
    if (id === '../fields/emr-typed-field.component') {
      return { EmrTypedFieldComponent: class {} };
    }
    if (id === './emr-repeatable-group.component') {
      return { EmrRepeatableGroupComponent: class {} };
    }
    if (id === './emr-section-card.component') {
      return { EmrSectionCardComponent: class {} };
    }
    if (id === './emr-clinical-form.logic') {
      return clinicalFormLogic;
    }
    throw new Error(`Unexpected require: ${id}`);
  };

  const module = { exports: {} as { EmrClinicalFormComponent?: new () => Record<string, unknown> } };
  const fn = new Function('require', 'module', 'exports', transpiled);
  fn(mockRequire, module, module.exports);
  return { EmrClinicalFormComponent: module.exports.EmrClinicalFormComponent!, setHostContains };
}

type FormInstance = {
  model: { set: (v: ClinicalFormViewModel) => void };
  headingId: { set: (v: string | undefined) => void };
  idPrefix: { set: (v: string) => void };
  intent: { subscribe: (fn: (v: ClinicalFormIntent) => void) => void };
  focused: { subscribe: (fn: () => void) => void };
  blurred: { subscribe: (fn: () => void) => void };
  resolvedHeadingId: () => string | null;
  visibleSections: () => ClinicalFormViewModel['schema']['sections'];
  repeatablePrefix: () => string;
  shown: (state?: ClinicalFormViewModel['fields'][string]) => boolean;
  matrixRows: (block: Extract<ClinicalFormViewModel['schema']['sections'][number]['blocks'][number], { kind: 'matrix' }>) => readonly unknown[];
  rowRequired: (row: Extract<ClinicalFormViewModel['schema']['sections'][number]['blocks'][number], { kind: 'matrix' }>['rows'][number]) => boolean;
  domId: (value: string) => string;
  controlId: (field: ClinicalFieldDefinition, itemId?: string) => string;
  onRepeatableIntent: (ev: ClinicalFormIntent) => void;
  valueChanged: (field: ClinicalFieldDefinition, value: unknown) => void;
  statusChanged: (field: ClinicalFieldDefinition, status: unknown) => void;
  onFocusIn: () => void;
  onFocusOut: (e: { relatedTarget: unknown }) => void;
};

const BASE_MODEL: ClinicalFormViewModel = {
  schema: {
    id: 'opd-triage',
    label: 'Ophthalmic Triage',
    description: 'Initial clinical assessment',
    sections: [
      {
        id: 'vitals',
        label: 'Vitals & IOP',
        collapsible: true,
        blocks: [
          { id: 'complaint', label: 'Chief complaint', type: 'text', span: 6, required: true },
          { id: 'iop', label: 'IOP', type: 'quantity', unit: 'mmHg', span: 6 },
          {
            kind: 'matrix',
            id: 'per-eye',
            label: 'Per eye',
            description: 'Measured with Goldmann applanation',
            columns: [
              { id: 'OD', label: 'Right (OD)' },
              { id: 'OS', label: 'Left (OS)' },
              { id: 'OU', label: 'Both (OU)' },
            ],
            rows: [
              {
                id: 'cdr',
                label: 'CD ratio',
                cells: {
                  OD: { id: 'CDR_RE', label: 'CD OD', type: 'decimal', required: true },
                  OS: { id: 'CDR_LE', label: 'CD OS', type: 'decimal' },
                  OU: { id: 'CDR_OU', label: 'CD OU', type: 'decimal' },
                },
              },
            ],
          },
          {
            kind: 'repeatable',
            id: 'drops',
            label: 'Topical drops',
            fields: [{ id: 'drug', label: 'Medication', type: 'text' }],
          },
        ],
      },
    ],
  },
  fields: {
    complaint: { value: 'Blurred vision' },
    iop: { value: { value: null, unit: 'mmHg' }, hidden: true },
    CDR_RE: { value: 0.5 },
    CDR_LE: { value: { value: null, unit: 'mmHg' }, hidden: true },
    CDR_OU: { value: 0.5, readOnly: true },
  },
  repeatableGroups: { drops: [] },
  emptyMessage: 'No sections available.',
};

describe('EmrClinicalFormComponent (Angular)', () => {
  it('resolves signal headingId, normalized idPrefix, and repeatablePrefix', () => {
    const { EmrClinicalFormComponent } = loadClinicalFormClass();
    const cmp = new EmrClinicalFormComponent() as unknown as FormInstance;
    cmp.model.set(BASE_MODEL);

    expect(cmp.resolvedHeadingId()).toBeNull();
    expect(cmp.domId('opd-triage-vitals')).toBe('opd-triage-vitals');
    expect(cmp.controlId({ id: 'complaint', label: 'Chief complaint', type: 'text' })).toBe('opd-triage-complaint');
    expect(cmp.repeatablePrefix()).toBe('opd-triage');

    cmp.idPrefix.set('clinic-');
    expect(cmp.domId('opd-triage-vitals')).toBe('clinic-opd-triage-vitals');
    expect(cmp.controlId({ id: 'complaint', label: 'Chief complaint', type: 'text' })).toBe('clinic-opd-triage-complaint');
    expect(cmp.repeatablePrefix()).toBe('clinic-opd-triage');

    cmp.headingId.set('triage-heading');
    expect(cmp.resolvedHeadingId()).toBe('triage-heading');
  });

  it('treats hidden null quantity as empty while keeping zero/non-empty hidden values visible', () => {
    const { EmrClinicalFormComponent } = loadClinicalFormClass();
    const cmp = new EmrClinicalFormComponent() as unknown as FormInstance;
    cmp.model.set(BASE_MODEL);

    expect(cmp.shown({ value: { value: null, unit: 'mmHg' }, hidden: true })).toBe(false);
    expect(cmp.shown({ value: { value: 0, unit: 'mmHg' }, hidden: true })).toBe(true);
    expect(cmp.shown({ value: false, hidden: true })).toBe(true);

    // When all sections are hidden, visibleSections is empty so emptyMessage renders
    cmp.model.set({
      schema: {
        id: 'empty',
        label: 'Empty',
        sections: [
          {
            id: 's1',
            label: 'S1',
            blocks: [{ id: 'q', label: 'Q', type: 'quantity', unit: 'mmHg' }],
          },
        ],
      },
      fields: { q: { value: { value: null, unit: 'mmHg' }, hidden: true } },
      repeatableGroups: {},
      emptyMessage: 'No visible clinical sections.',
    });
    expect(cmp.visibleSections()).toHaveLength(0);
  });

  it('gates field edits and repeatable mutations when readOnly or field is locked, while allowing focus', () => {
    const { EmrClinicalFormComponent } = loadClinicalFormClass();
    const cmp = new EmrClinicalFormComponent() as unknown as FormInstance;
    const emitted: ClinicalFormIntent[] = [];
    cmp.intent.subscribe((ev) => emitted.push(ev));

    cmp.model.set(BASE_MODEL);
    const complaintDef: ClinicalFieldDefinition = { id: 'complaint', label: 'Chief complaint', type: 'text' };
    const lockedCellDef: ClinicalFieldDefinition = { id: 'CDR_OU', label: 'CD OU', type: 'decimal' };

    cmp.valueChanged(complaintDef, 'Updated');
    cmp.statusChanged(complaintDef, 'declined');
    cmp.valueChanged(lockedCellDef, 0.7); // field.readOnly = true -> blocked
    cmp.onRepeatableIntent({ type: 'repeatItemAddRequested', groupId: 'drops' });
    expect(emitted).toEqual([
      { type: 'fieldEditRequested', fieldId: 'complaint', value: 'Updated' },
      { type: 'fieldStatusEditRequested', fieldId: 'complaint', status: 'declined' },
      { type: 'repeatItemAddRequested', groupId: 'drops' },
    ]);

    cmp.model.set({ ...BASE_MODEL, readOnly: true });
    cmp.valueChanged(complaintDef, 'Blocked');
    cmp.statusChanged(complaintDef, 'unknown');
    cmp.onRepeatableIntent({ type: 'repeatItemAddRequested', groupId: 'drops' });
    cmp.onRepeatableIntent({ type: 'fieldFocused', fieldId: 'drops.d1.drug' });
    expect(emitted).toHaveLength(4);
    expect(emitted[3]).toEqual({ type: 'fieldFocused', fieldId: 'drops.d1.drug' });
  });

  it('evaluates matrix row visibility and required indicator and manages host focus/blur', () => {
    const { EmrClinicalFormComponent, setHostContains } = loadClinicalFormClass();
    const cmp = new EmrClinicalFormComponent() as unknown as FormInstance;
    cmp.model.set(BASE_MODEL);

    const matrixBlock = BASE_MODEL.schema.sections[0].blocks[2] as Extract<
      ClinicalFormViewModel['schema']['sections'][number]['blocks'][number],
      { kind: 'matrix' }
    >;
    expect(cmp.matrixRows(matrixBlock)).toHaveLength(1);
    expect(cmp.rowRequired(matrixBlock.rows[0])).toBe(true);

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

  it('delegates repeatable blocks to <emr-repeatable-group>, enforces zero-[disabled], and upholds print/mobile CSS', () => {
    expect(componentSource).not.toContain('[disabled]');
    expect(componentSource).not.toContain('@Input');
    expect(componentSource).not.toContain('@Output');
    expect(componentSource).toContain('<emr-repeatable-group');
    expect(componentSource).not.toContain('emr-clinical-form__repeat-item');
    expect(componentSource).toContain('[attr.aria-labelledby]="resolvedHeadingId()"');
    expect(componentSource).toContain('[attr.aria-label]="resolvedHeadingId() ? null : model().schema.label"');
    expect(componentSource).toContain('data-emr-print="hide"');
    expect(componentSource).toContain('role="status"');

    for (const cls of [
      '.emr-clinical-form',
      '.emr-clinical-form__description',
      '.emr-clinical-form__correction',
      '.emr-clinical-form__correction-btn',
      '.emr-clinical-form__grid',
      '.emr-clinical-form__matrix',
      '.emr-clinical-form__matrix-row',
      '.emr-clinical-form__matrix-cell-label',
      '.emr-clinical-form__empty',
    ]) {
      expect(emrCss).toContain(cls);
    }

    expect(emrCss).toContain('min-height: var(--emr-control-height, 44px)');
    expect(emrPrintCss).toContain(".emr-print .emr-clinical-form__correction[data-emr-print='hide']");
    expect(emrPrintCss).toContain(".emr-clinical-form__correction[data-emr-print='hide']");
  });
});
