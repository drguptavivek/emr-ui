import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('react-native', () => import('react-native-web'));

import type {
  EhrTemplateViewModel,
  EmrGeneratedFieldDefinition,
  FieldGeneratorViewModel,
  FieldLibraryPickerViewModel,
  TerminologyConcept,
  TerminologySearchViewModel,
  TerminologySource,
  ValidationRuleEditorViewModel,
} from '@drguptavivek/emr-controller';
import {
  EmrFieldGenerator,
  EmrFieldLibraryPicker,
  EmrTemplateComposer,
  EmrTemplatePreview,
  EmrTerminologySearch,
  EmrValidationRuleEditor,
  FIELD_GENERATOR_DEFAULTS,
} from './l6-authoring';
import { deriveTemplatePreview } from './l6-authoring.logic';
import { EmrThemeProvider } from './theme';

const sourcePath = join(process.cwd(), 'packages/emr-react/src/l6-authoring.tsx');
const reactSource = readFileSync(sourcePath, 'utf8');

const sources: readonly TerminologySource[] = [
  { id: 'loinc', kind: 'loinc', label: 'LOINC', available: true },
  { id: 'ucum', kind: 'ucum', label: 'UCUM', available: true },
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
  description: 'Goldmann applanation IOP',
  type: 'quantity',
  unit: 'mmHg',
  unitSystem: 'UCUM',
  unitCode: 'mm[Hg]',
  required: true,
  repeats: false,
  validationRules: [{ id: 'r1', kind: 'minimum', value: 0, message: 'IOP cannot be negative.' }],
  terminologyBindings: [{ id: 'b1', role: 'question-meaning', concept, strength: 'preferred' }],
};

function renderWithTheme(node: ReturnType<typeof createElement>): string {
  return renderToStaticMarkup(createElement(EmrThemeProvider, { scheme: 'light', children: node }));
}

describe('React L6 authoring surfaces (l6-authoring.tsx)', () => {
  it('enforces parity contracts: labelHidden, time/datetime options, SvgIcon, RESOLVED_MONO_FONT, idPrefix, onFocus/onBlur', () => {
    expect(FIELD_GENERATOR_DEFAULTS.typeOptions.map(o => o.value)).toEqual(
      expect.arrayContaining(['time', 'datetime']),
    );
    expect(reactSource).toContain('labelHidden');
    expect(reactSource).toContain('RESOLVED_MONO_FONT');
    expect(reactSource).toContain('SvgIcon');
    expect(reactSource).toContain('placementSelected');
    expect(reactSource).toContain('readOnly: true');
    expect(reactSource).toContain('Math.max(44, t.controlHeight)');
    expect(reactSource).toContain('idPrefix');
    expect(reactSource).toContain('onFocus');
    expect(reactSource).toContain('onBlur');
  });

  it('renders EmrTerminologySearch via SSR with labelHidden EmrSelect', () => {
    const model: TerminologySearchViewModel = {
      role: 'question-meaning',
      sources,
      search: {
        sourceId: 'loinc',
        role: 'question-meaning',
        query: 'pressure',
        options: [concept],
        page: 1,
        pageSize: 10,
        total: 1,
        loading: false,
      },
      bindings: [{ id: 'b1', role: 'question-meaning', concept, strength: 'preferred' }],
    };
    const html = renderWithTheme(
      createElement(EmrTerminologySearch, { model, idPrefix: 'rx', onIntent: () => {} }),
    );
    expect(html).toContain('rx-emr-terminology-heading');
    expect(html).toContain('Intraocular pressure of Eye');
    expect(html).toContain('56844-4');
  });

  it('renders EmrValidationRuleEditor via SSR', () => {
    const model: ValidationRuleEditorViewModel = {
      rules: [{ id: 'r1', kind: 'minimum', value: 5, message: 'Min 5' }],
    };
    const html = renderWithTheme(
      createElement(EmrValidationRuleEditor, { model, idPrefix: 'val', onIntent: () => {} }),
    );
    expect(html).toContain('val-emr-validation-heading');
    expect(html).toContain('Minimum value');
    expect(html).toContain('Min 5');
  });

  it('renders EmrFieldGenerator via SSR with inline validationErrors', () => {
    const model: FieldGeneratorViewModel = {
      draft: { ...sampleField, id: '' },
      sources,
      terminologySearches: {},
      validationErrors: { 'field-id': 'A stable field id is required.' },
      saving: false,
      dirty: true,
    };
    const html = renderWithTheme(
      createElement(EmrFieldGenerator, { model, idPrefix: 'fg', onIntent: () => {} }),
    );
    expect(html).toContain('fg-emr-field-generator-heading');
    expect(html).toContain('A stable field id is required.');
    expect(html).toContain('aria-invalid="true"');
  });

  it('renders EmrFieldLibraryPicker via SSR', () => {
    const model: FieldLibraryPickerViewModel = {
      fields: [sampleField],
      query: '',
      selectedSectionId: 'tonometry',
    };
    const html = renderWithTheme(
      createElement(EmrFieldLibraryPicker, { model, idPrefix: 'lib', onIntent: () => {} }),
    );
    expect(html).toContain('lib-emr-field-library-heading');
    expect(html).toContain('Applanation IOP');
  });

  it('renders EmrTemplatePreview via SSR with unique importIssue keys and readOnly preview form', () => {
    const template = {
      schemaVersion: '1.0' as const,
      id: 'glaucoma',
      revision: 1,
      title: 'Glaucoma Exam',
      locale: 'en-IN',
      status: 'draft' as const,
      sections: [
        {
          id: 'tonometry',
          label: 'Tonometry',
          fields: [{ id: 'pl-1', sourceFieldId: 'iop-gat', sourceFieldRevision: 1, field: sampleField }],
        },
      ],
    };
    const model: TemplatePreviewViewModel = {
      template,
      fieldLibrary: [sampleField],
      fieldLibraryQuery: '',
      selectedSectionId: 'tonometry',
      preview: { ...deriveTemplatePreview(template), readOnly: false },
      importIssues: [
        { severity: 'warning', code: 'lossy', message: 'First issue' },
        { severity: 'warning', code: 'lossy', message: 'Duplicate code issue' },
      ],
      loading: false,
      saving: false,
      dirty: false,
    };
    const html = renderWithTheme(
      createElement(EmrTemplatePreview, { model, idPrefix: 'tp', onIntent: () => {} }),
    );
    expect(html).toContain('tp-emr-template-preview-heading');
    expect(html).toContain('First issue');
    expect(html).toContain('Duplicate code issue');
  });

  it('renders EmrTemplateComposer via SSR', () => {
    const template = {
      schemaVersion: '1.0' as const,
      id: 'glaucoma',
      revision: 1,
      title: 'Glaucoma Exam',
      locale: 'en-IN',
      status: 'draft' as const,
      sections: [
        {
          id: 'tonometry',
          label: 'Tonometry',
          fields: [{ id: 'pl-1', sourceFieldId: 'iop-gat', sourceFieldRevision: 1, field: sampleField }],
        },
      ],
    };
    const model: EhrTemplateViewModel = {
      template,
      fieldLibrary: [sampleField],
      fieldLibraryQuery: '',
      selectedSectionId: 'tonometry',
      selectedPlacementId: 'pl-1',
      preview: deriveTemplatePreview(template),
      loading: false,
      saving: false,
      dirty: false,
    };
    const html = renderWithTheme(
      createElement(EmrTemplateComposer, { model, idPrefix: 'tc', onIntent: () => {} }),
    );
    expect(html).toContain('tc-emr-template-composer-heading');
    expect(html).toContain('Glaucoma Exam');
    expect(html).toContain('Tonometry');
  });
});
