import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type { ClinicalMatrixIntent, ClinicalMatrixSchema, ClinicalMatrixValues } from '@drguptavivek/emr-controller';
import * as matrixLogic from './emr-clinical-matrix.logic';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/structures/emr-clinical-matrix.component.ts',
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

function loadClinicalMatrixClasses() {
  const withoutDecorators = componentSource
    .replace(/@Directive\(\{[\s\S]*?\}\)\s*(?=export class EmrClinicalCellRendererDirective)/, '')
    .replace(/@Component\(\{[\s\S]*?\}\)\s*(?=export class EmrClinicalMatrixComponent)/, '');

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

  let containsResult = false;
  const setHostContains = (value: boolean) => {
    containsResult = value;
  };

  let directiveInstances: unknown[] = [];
  const setDirectives = (list: unknown[]) => {
    directiveInstances = list;
  };

  const mockRequire = (id: string) => {
    if (id === '@angular/common') {
      return { NgTemplateOutlet: class {} };
    }
    if (id === '@angular/core') {
      return {
        ChangeDetectionStrategy: { OnPush: 0 },
        ViewEncapsulation: { None: 2 },
        ElementRef: class {},
        TemplateRef: class {},
        Component: () => (cls: unknown) => cls,
        Directive: () => (cls: unknown) => cls,
        computed: <T>(fn: () => T) => fn,
        contentChildren: () => () => directiveInstances,
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
      return { EmrBadgeComponent: class {} };
    }
    if (id === './emr-clinical-matrix.logic') {
      return matrixLogic;
    }
    throw new Error(`Unexpected require: ${id}`);
  };

  const module = {
    exports: {} as {
      EmrClinicalMatrixComponent?: new () => Record<string, unknown>;
      EmrClinicalCellRendererDirective?: new (t: unknown) => Record<string, unknown>;
    },
  };
  const fn = new Function('require', 'module', 'exports', transpiled);
  fn(mockRequire, module, module.exports);
  return {
    EmrClinicalMatrixComponent: module.exports.EmrClinicalMatrixComponent!,
    EmrClinicalCellRendererDirective: module.exports.EmrClinicalCellRendererDirective!,
    setHostContains,
    setDirectives,
  };
}

describe('EmrClinicalMatrixComponent & EmrClinicalCellRendererDirective (Angular)', () => {
  it('computes contiguous column groups, heading ids, steps, units, and readOnly/mutation gates', () => {
    const slots = matrixLogic.groupMatrixColumns(
      [
        { id: 'od', label: 'OD' },
        { id: 'os', label: 'OS' },
        { id: 'ou', label: 'OU' },
      ],
      [{ id: 'eyes', label: 'Laterality', columnIds: ['od', 'os'] }],
    );
    expect(slots).toHaveLength(2);
    expect(slots[0]).toMatchObject({ kind: 'group', id: 'eyes', colSpan: 2 });
    expect(slots[1]).toMatchObject({ kind: 'ungrouped', colSpan: 1 });

    expect(matrixLogic.resolveMatrixHeadingId('iop', undefined, 'clinic')).toBe('clinic-iop-title');
    expect(matrixLogic.resolveMatrixHeadingId('iop', 'external-heading', 'clinic')).toBe('external-heading');
    expect(matrixLogic.resolveMatrixDecimalStep({ type: 'decimal', precision: 2 })).toBe(0.01);
    expect(matrixLogic.resolveMatrixDecimalStep({ type: 'decimal', step: 0.25 })).toBe(0.25);
    expect(matrixLogic.isMatrixCellApplicable({ applicableColumnIds: ['od'] }, 'os')).toBe(false);
    expect(matrixLogic.canMutateMatrixCell(false, { disabled: true })).toBe(false);
  });

  it('wires signal inputs, focusin/focusout, gated custom renderer emit, and non-mutating lock rollback', () => {
    const {
      EmrClinicalMatrixComponent,
      EmrClinicalCellRendererDirective,
      setHostContains,
      setDirectives,
    } = loadClinicalMatrixClasses();

    const directive = new EmrClinicalCellRendererDirective('tmpl-angle') as unknown as {
      key: { set: (v: string) => void };
      template: unknown;
    };
    directive.key.set('angleStamp');
    setDirectives([directive]);

    const matrix = new EmrClinicalMatrixComponent() as unknown as {
      definition: { set: (v: ClinicalMatrixSchema) => void };
      model: { set: (v: ClinicalMatrixValues) => void };
      readOnly: { set: (v: boolean) => void };
      headingId: { set: (v: string | undefined) => void };
      idPrefix: { set: (v: string) => void };
      intent: { subscribe: (fn: (v: ClinicalMatrixIntent) => void) => void };
      focused: { subscribe: (fn: () => void) => void };
      blurred: { subscribe: (fn: () => void) => void };
      resolvedHeadingId: () => string;
      showRemarks: () => boolean;
      rendererFor: (key?: string) => unknown;
      customContext: (row: ClinicalMatrixSchema['rows'][number], col: ClinicalMatrixSchema['columns'][number], cell?: ClinicalMatrixValues[string]['cells'][string]) => {
        $implicit: { readOnly: boolean; emit: (action: string, payload?: unknown) => void };
      };
      onFocusIn: () => void;
      onFocusOut: (e: { relatedTarget: unknown }) => void;
      remarkChanged: (rowId: string, e: { target: { value: string } }) => void;
      textChanged: (row: ClinicalMatrixSchema['rows'][number], col: ClinicalMatrixSchema['columns'][number], e: { target: { value: string } }) => void;
    };

    const schema: ClinicalMatrixSchema = {
      id: 'gonio',
      label: 'Gonioscopy',
      description: '4-mirror Posner lens',
      showRemarks: false,
      columns: [
        { id: 'od', label: 'OD' },
        { id: 'os', label: 'OS' },
      ],
      rows: [
        { id: 'angle', label: 'Angle', type: 'custom', customRendererKey: 'angleStamp' },
        { id: 'note', label: 'Note', type: 'text' },
      ],
    };

    const values: ClinicalMatrixValues = {
      angle: { remark: '', cells: { od: { value: 1 }, os: { value: 0, readOnly: true } } },
      note: { remark: 'Initial', remarkDisabled: true, cells: { od: { value: 'Clear', disabled: true } } },
    };

    matrix.definition.set(schema);
    matrix.model.set(values);
    matrix.idPrefix.set('opd');

    expect(matrix.resolvedHeadingId()).toBe('opd-gonio-title');
    expect(matrix.showRemarks()).toBe(false);
    expect(matrix.rendererFor('angleStamp')).toBe('tmpl-angle');

    const intents: ClinicalMatrixIntent[] = [];
    matrix.intent.subscribe((v) => intents.push(v));

    // Custom context gates emit when cell or matrix is locked
    const odCtx = matrix.customContext(schema.rows[0], schema.columns[0], values.angle.cells.od).$implicit;
    const osCtx = matrix.customContext(schema.rows[0], schema.columns[1], values.angle.cells.os).$implicit;
    expect(odCtx.readOnly).toBe(false);
    expect(osCtx.readOnly).toBe(true);
    odCtx.emit('stamp', { next: 2 });
    osCtx.emit('stamp', { next: 1 });
    expect(intents).toEqual([
      { type: 'customCellIntent', rowId: 'angle', columnId: 'od', action: 'stamp', payload: { next: 2 } },
    ]);

    // Locked text cell & disabled remark restore values and emit nothing
    const noteTarget = { value: 'Mutated' };
    matrix.textChanged(schema.rows[1], schema.columns[0], { target: noteTarget });
    expect(noteTarget.value).toBe('Clear');
    const remarkTarget = { value: 'Mutated remark' };
    matrix.remarkChanged('note', { target: remarkTarget });
    expect(remarkTarget.value).toBe('Initial');
    expect(intents).toHaveLength(1);

    // Focus/blur boundary
    let focusCount = 0;
    let blurCount = 0;
    matrix.focused.subscribe(() => { focusCount += 1; });
    matrix.blurred.subscribe(() => { blurCount += 1; });
    matrix.onFocusIn();
    setHostContains(true);
    matrix.onFocusOut({ relatedTarget: {} });
    expect(focusCount).toBe(1);
    expect(blurCount).toBe(0);
    setHostContains(false);
    matrix.onFocusOut({ relatedTarget: null });
    expect(blurCount).toBe(1);
  });

  it('uses zero native [disabled] on L3 controls and matches container-query + print CSS contracts', () => {
    expect(componentSource).not.toMatch(/\[disabled\]="cell\?\.disabled"/);
    expect(componentSource).not.toMatch(/\[disabled\]="isRemarkDisabled/);
    expect(componentSource).toMatch(/scope="colgroup"/);
    expect(componentSource).toMatch(/role="alert"/);
    expect(emrCss).toMatch(/container-type:\s*inline-size/);
    expect(emrCss).toMatch(/@container\s*\(max-width:\s*720px\)/);
    expect(emrCss).toMatch(/@media\s*\(max-width:\s*720px\)/);
    expect(emrPrintCss).toMatch(/\.emr-matrix__row-label\s*\{\s*position:\s*static !important;\s*\}/);
    expect(emrPrintCss).toMatch(/\.emr-matrix__na\s*\{\s*min-height:\s*0 !important;\s*\}/);
  });
});
