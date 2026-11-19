import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type {
  EhrTemplateViewModel,
  EmrGeneratedFieldDefinition,
  FieldGeneratorIntent,
  FieldGeneratorViewModel,
  FieldLibraryPickerViewModel,
  TerminologyConcept,
  TerminologySearchViewModel,
  TerminologySource,
  ValidationRuleEditorViewModel,
} from '@drguptavivek/emr-controller';
import * as logic from './emr-authoring.logic';

const authoringDir = join(process.cwd(), 'packages/emr-ui/src/lib/authoring');
const batch1Files = [
  'emr-terminology-search.component.ts',
  'emr-validation-rule-editor.component.ts',
  'emr-field-library-picker.component.ts',
  'emr-template-preview.component.ts',
  'emr-template-composer.component.ts',
  'emr-field-generator.component.ts',
];

function loadAuthoringComponent(fileName: string) {
  const source = readFileSync(join(authoringDir, fileName), 'utf8');
  const withoutDecorators = source.replace(/@Component\(\{[\s\S]*?\}\)\s*(?=export class Emr)/g, '');
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
        ElementRef: class {},
        inject: () => ({ nativeElement: { contains: () => false } }),
        computed: <T>(fn: () => T) => fn,
        input: Object.assign(
          <T>(init?: T) => makeSignal<T | undefined>(init),
          { required: <T>() => makeSignal<T | undefined>(undefined) },
        ),
        output: <T>() => {
          const listeners: ((v: T) => void)[] = [];
          return {
            emit: (v: T) => listeners.forEach(l => l(v)),
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
    if (id === './emr-authoring.logic') {
      return logic;
    }
    return {};
  };

  const exportsObj: Record<string, unknown> = {};
  const moduleObj = { exports: exportsObj };
  const runner = new Function('exports', 'require', 'module', transpiled);
  runner(exportsObj, mockRequire, moduleObj);
  return { source, exports: moduleObj.exports as Record<string, new () => Record<string, any>> };
}

const sources: readonly TerminologySource[] = [
  { id: 'loinc', kind: 'loinc', label: 'LOINC', available: true },
  { id: 'ucum', kind: 'ucum', label: 'UCUM', available: true },
  { id: 'offline', kind: 'custom', label: 'Offline', available: false },
];

const concept: TerminologyConcept = {
  sourceId: 'loinc',
  system: 'http://loinc.org',
  code: '56844-4',
  display: 'Intraocular pressure of Eye',
  active: true,
};

const sampleField: EmrGeneratedFieldDefinition = {
  schemaVersion: '1.0',
  id: 'iop-gat',
  revision: 1,
  label: 'Applanation IOP',
  description: 'Goldmann applanation tonometry',
  type: 'quantity',
  unit: 'mmHg',
  unitSystem: 'UCUM',
  unitCode: 'mm[Hg]',
  required: true,
  repeats: false,
  validationRules: [{ id: 'r1', kind: 'minimum', value: 0, message: 'Must be non-negative.' }],
  terminologyBindings: [{ id: 'b1', role: 'question-meaning', concept, strength: 'preferred' }],
};

describe('Angular L6 Authoring Batch 1 components', () => {
  it('obeys strict SSR, signal API, token, container-query, print, and zero-[disabled] guardrails', () => {
    const runtimeImport = /(?:^|\n)\s*import\s+(?!type\b)[^;]*?from\s+['"]@drguptavivek\/emr-controller/;
    const colourLiteral = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/;
    for (const file of batch1Files) {
      const source = readFileSync(join(authoringDir, file), 'utf8');
      expect(source, file).not.toMatch(runtimeImport);
      expect(source, file).not.toMatch(/@Input\s*\(|@Output\s*\(/);
      expect(source, file).not.toMatch(/\bdisabled\s*=\s*input/);
      expect(source, file).not.toMatch(/\[disabled\]=/);
      expect(source, file).toContain('readonly model = input.required<');
      expect(source, file).toContain('readonly headingId = input<string>');
      expect(source, file).toContain('readonly idPrefix = input<string>');
      expect(source, file).toContain('readonly labels = input<');
      expect(source, file).toContain('readonly intent = output<');
      expect(source, file).toContain('readonly focused = output<void>()');
      expect(source, file).toContain('readonly blurred = output<void>()');
      expect(source, file).toContain('container-type:inline-size');
      expect(source, file).toContain('@container (max-width: 720px)');
      expect(source, file).toContain('data-emr-print');
      expect(source, file).toContain('NgIcon');
      for (const line of source.split('\n')) {
        expect(line, `${file}: colour literal`).not.toMatch(colourLiteral);
      }
    }
  });

  it('validates tightened rule criteria in emr-authoring.logic', () => {
    expect(logic.canAddValidationRule('minimum', 'abc', '')).toBe(false);
    expect(logic.canAddValidationRule('minimum', '12.5', '')).toBe(true);
    expect(logic.canAddValidationRule('min-length', '-1', '')).toBe(false);
    expect(logic.canAddValidationRule('min-length', '1.5', '')).toBe(false);
    expect(logic.canAddValidationRule('min-length', '3', '')).toBe(true);
    expect(logic.canAddValidationRule('precision', '2', '')).toBe(true);
    expect(logic.canAddValidationRule('pattern', '[invalid', '')).toBe(false);
    expect(logic.canAddValidationRule('pattern', '^[A-Z]+$', '')).toBe(true);
    expect(logic.canAddValidationRule('earliest-date', '2026-02-31', '')).toBe(false);
    expect(logic.canAddValidationRule('earliest-date', '2026-02-28', '')).toBe(true);
    expect(logic.canAddValidationRule('custom', 'check-iop', '')).toBe(false);
    expect(logic.canAddValidationRule('custom', 'check-iop', 'Out of range')).toBe(true);
  });

  it('EmrFieldGeneratorComponent supports time/datetime options, inline errors, and readOnly guards', () => {
    const { source, exports: mod } = loadAuthoringComponent('emr-field-generator.component.ts');
    expect(source).toContain('AUTHORING_FIELD_TYPE_OPTIONS');
    expect(logic.AUTHORING_FIELD_TYPE_OPTIONS.map(o => o.value)).toEqual(
      expect.arrayContaining(['time', 'datetime']),
    );
    expect(source).toContain('[readonly]="locked"');

    const comp = new mod.EmrFieldGeneratorComponent();
    const vm: FieldGeneratorViewModel = {
      draft: sampleField,
      sources,
      terminologySearches: {},
      validationErrors: { 'field-id': 'Field ID required' },
      saving: false,
      dirty: true,
    };
    comp.model.set(vm);
    comp.idPrefix.set('p1');
    expect(comp.id('field-id')).toBe('p1-emr-field-generator-heading-field-id');
    expect(comp.fieldError('field-id', 'id')).toBe('Field ID required');

    const emitted: FieldGeneratorIntent[] = [];
    comp.intent.subscribe((i: FieldGeneratorIntent) => emitted.push(i));
    comp.optionValue = 'od';
    comp.optionLabel = 'Right eye';
    comp.addOption();
    expect(comp.optionValue).toBe('');
    expect(comp.optionLabel).toBe('');
    expect(emitted[0]).toEqual({ type: 'draftPatched', changes: { options: [{ value: 'od', label: 'Right eye' }] } });

    comp.model.set({ ...vm, readOnly: true });
    comp.saveRequested();
    expect(emitted).toHaveLength(1);
  });

  it('EmrTerminologySearchComponent binds via canonical model and guards readOnly', () => {
    const { exports: mod } = loadAuthoringComponent('emr-terminology-search.component.ts');
    const comp = new mod.EmrTerminologySearchComponent();
    const vm: TerminologySearchViewModel = {
      role: 'question-meaning',
      sources,
      search: {
        sourceId: 'loinc',
        role: 'question-meaning',
        query: 'iop',
        options: [concept],
        page: 1,
        pageSize: 10,
        total: 1,
        loading: false,
      },
      bindings: [],
      readOnly: false,
    };
    comp.model.set(vm);
    const emitted: unknown[] = [];
    comp.intent.subscribe((i: unknown) => emitted.push(i));
    comp.selectConcept(concept);
    expect(emitted).toEqual([
      {
        type: 'terminologyConceptSelected',
        role: 'question-meaning',
        concept,
        strength: 'preferred',
        mappingRelationship: undefined,
      },
    ]);

    comp.model.set({ ...vm, readOnly: true });
    comp.searchRequested();
    expect(emitted).toHaveLength(1);
  });

  it('EmrValidationRuleEditorComponent resets value and message on add and rejects invalid drafts', () => {
    const { exports: mod } = loadAuthoringComponent('emr-validation-rule-editor.component.ts');
    const comp = new mod.EmrValidationRuleEditorComponent();
    const vm: ValidationRuleEditorViewModel = { rules: [], readOnly: false };
    comp.model.set(vm);
    const emitted: unknown[] = [];
    comp.intent.subscribe((i: unknown) => emitted.push(i));

    comp.kind = 'min-length';
    comp.value = '-5';
    expect(comp.canAdd()).toBe(false);
    comp.addRule();
    expect(emitted).toHaveLength(0);

    comp.value = '4';
    comp.message = 'At least 4 chars';
    expect(comp.canAdd()).toBe(true);
    comp.addRule();
    expect(emitted).toEqual([
      {
        type: 'validationRuleAdded',
        rule: { id: '', kind: 'min-length', value: 4, message: 'At least 4 chars' },
      },
    ]);
    expect(comp.value).toBe('');
    expect(comp.message).toBe('');
  });

  it('EmrFieldLibraryPickerComponent emits fieldLibraryQueryChanged and fieldAdded via canonical model', () => {
    const { exports: mod } = loadAuthoringComponent('emr-field-library-picker.component.ts');
    const comp = new mod.EmrFieldLibraryPickerComponent();
    const vm: FieldLibraryPickerViewModel = {
      fields: [sampleField],
      query: '',
      selectedSectionId: 'sec-1',
      readOnly: false,
    };
    comp.model.set(vm);
    const emitted: unknown[] = [];
    comp.intent.subscribe((i: unknown) => emitted.push(i));
    comp.add(sampleField);
    expect(emitted).toEqual([
      { type: 'fieldAdded', sectionId: 'sec-1', field: sampleField, placementId: '' },
    ]);
  });

  it('EmrTemplateComposerComponent emits placementSelected and forwards selection in readOnly', () => {
    const { exports: mod } = loadAuthoringComponent('emr-template-composer.component.ts');
    const comp = new mod.EmrTemplateComposerComponent();
    const vm: EhrTemplateViewModel = {
      template: {
        schemaVersion: '1.0',
        id: 't1',
        revision: 1,
        title: 'Glaucoma',
        locale: 'en-IN',
        status: 'draft',
        sections: [
          {
            id: 'sec-1',
            label: 'Tonometry',
            fields: [{ id: 'pl-1', sourceFieldId: 'iop-gat', sourceFieldRevision: 1, field: sampleField }],
          },
        ],
      },
      fieldLibrary: [sampleField],
      fieldLibraryQuery: '',
      selectedSectionId: 'sec-1',
      preview: { schema: { id: 't1-form', label: 'Glaucoma', sections: [] }, fields: {}, repeatableGroups: {}, readOnly: true },
      loading: false,
      saving: false,
      dirty: false,
      readOnly: true,
    };
    comp.model.set(vm);
    const emitted: unknown[] = [];
    comp.intent.subscribe((i: unknown) => emitted.push(i));
    comp.emit({ type: 'placementSelected', sectionId: 'sec-1', placementId: 'pl-1' });
    comp.saveRequested();
    expect(emitted).toEqual([{ type: 'placementSelected', sectionId: 'sec-1', placementId: 'pl-1' }]);
  });

  it('EmrTemplatePreviewComponent forces readOnly: true on embedded clinical form', () => {
    const { exports: mod } = loadAuthoringComponent('emr-template-preview.component.ts');
    const comp = new mod.EmrTemplatePreviewComponent();
    comp.model.set({
      template: {
        schemaVersion: '1.0',
        id: 't1',
        revision: 1,
        title: 'Preview',
        locale: 'en-IN',
        status: 'draft',
        sections: [],
      },
      fieldLibrary: [],
      fieldLibraryQuery: '',
      preview: {
        schema: { id: 't1-form', label: 'Preview', sections: [] },
        fields: {},
        repeatableGroups: {},
        readOnly: false,
      },
      importIssues: [{ severity: 'warning', code: 'lossy', message: 'Metadata omitted' }],
      loading: false,
      saving: false,
      dirty: false,
      readOnly: false,
    });
    expect(comp.previewModel().readOnly).toBe(true);
    expect(comp.canAcceptImport()).toBe(true);
  });
});
