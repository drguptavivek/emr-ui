// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  EhrTemplateViewModel,
  EmrGeneratedFieldDefinition,
  FieldGeneratorViewModel,
  FieldLibraryPickerViewModel,
  TemplateArtifactFormat,
  TerminologySearchViewModel,
  ValidationRuleEditorViewModel,
} from '@drguptavivek/emr-controller';
import {
  EmrFieldGeneratorElement,
  EmrFieldLibraryPickerElement,
  EmrTemplateComposerElement,
  EmrTemplatePreviewElement,
  EmrTerminologySearchElement,
  EmrValidationRuleEditorElement,
  registerL6AuthoringSurfaces,
} from './l6-authoring-surfaces.js';

const field: EmrGeneratedFieldDefinition = {
  schemaVersion: '1.0',
  id: 'blood-pressure',
  revision: 1,
  label: 'Blood pressure',
  description: 'Systolic pressure',
  type: 'integer',
  required: true,
  repeats: false,
  validationRules: [],
  terminologyBindings: [],
};

function templateModel(): EhrTemplateViewModel {
  const template = {
    schemaVersion: '1.0' as const,
    id: 'template-1',
    revision: 1,
    title: 'Encounter form',
    locale: 'en',
    status: 'draft' as const,
    sections: [
      {
        id: 'observations',
        label: 'Observations',
        fields: [{ id: 'placement-1', sourceFieldId: field.id, sourceFieldRevision: 1, field }],
      },
    ],
  };
  return {
    template,
    fieldLibrary: [field],
    fieldLibraryQuery: '',
    selectedSectionId: 'observations',
    selectedPlacementId: 'placement-1',
    preview: {
      schema: {
        id: 'template-1-form',
        label: 'Encounter form',
        sections: [
          {
            id: 'observations',
            label: 'Observations',
            blocks: [{ id: 'placement-1', label: 'Blood pressure', type: 'integer', required: true }],
          },
        ],
      },
      fields: { 'placement-1': { value: 120 } },
      repeatableGroups: {},
      readOnly: false,
    },
    importIssues: [{ severity: 'warning', code: 'lossy', message: 'Metadata omitted' }],
    loading: false,
    saving: false,
    dirty: false,
    canAcceptImport: true,
  };
}

function fieldGeneratorModel(): FieldGeneratorViewModel {
  return {
    draft: {
      ...field,
      validationRules: [{ id: 'min-1', kind: 'minimum', value: 5 }],
      terminologyBindings: [
        {
          id: 'binding-1',
          role: 'question-meaning',
          concept: { sourceId: 'loinc', system: 'urn:loinc', code: 'bp', display: 'Blood pressure' },
        },
      ],
    },
    sources: [{ id: 'loinc', kind: 'loinc', label: 'LOINC', available: true }],
    terminologySearches: {
      'question-meaning': {
        sourceId: 'loinc',
        role: 'question-meaning',
        query: 'blood pressure',
        options: [{ sourceId: 'loinc', system: 'urn:loinc', code: 'bp', display: 'Blood pressure' }],
        page: 1,
        pageSize: 10,
        total: 1,
        loading: false,
      },
    },
    validationErrors: {},
    saving: false,
    dirty: false,
  };
}

describe('Lit L6 authoring surfaces', () => {
  it('registers all six authoring tags and enforces zero ?disabled above L2 + container queries', () => {
    registerL6AuthoringSurfaces();
    for (const tag of [
      'emr-field-generator',
      'emr-terminology-search',
      'emr-validation-rule-editor',
      'emr-field-library-picker',
      'emr-template-composer',
      'emr-template-preview',
    ]) {
      expect(customElements.get(tag)).toBeDefined();
    }
    const source = readFileSync(
      join(process.cwd(), 'packages/emr-elements/src/l6-authoring-surfaces.ts'),
      'utf8',
    );
    expect(source).not.toContain('?disabled=');
    expect(source).toContain('container-type: inline-size');
    expect(source).toContain('@container (max-width: 720px)');
    expect(source).toContain('data-emr-print="hide"');
  });

  it('renders live emr-typed-field preview, time/datetime options, inline errors, and emits save intent', async () => {
    registerL6AuthoringSurfaces();
    const element = document.createElement('emr-field-generator') as EmrFieldGeneratorElement;
    element.idPrefix = 'fg';
    element.model = {
      ...fieldGeneratorModel(),
      validationErrors: { 'field-id': 'Stable ID is required' },
    };
    const intents: unknown[] = [];
    element.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      const typedPreview = element.shadowRoot!.querySelector('emr-typed-field') as HTMLElement & {
        readOnly: boolean;
        updateComplete: Promise<boolean>;
      };
      expect(typedPreview).not.toBeNull();
      expect(typedPreview.readOnly).toBe(true);
      const optionValues = [...element.shadowRoot!.querySelectorAll('select option')].map(o =>
        o.getAttribute('value'),
      );
      expect(optionValues).toEqual(expect.arrayContaining(['time', 'datetime']));
      const idInput = element.shadowRoot!.querySelector('#fg-emr-field-generator-heading-field-id')!;
      expect(idInput.getAttribute('aria-invalid')).toBe('true');

      const ruleEditor = element.shadowRoot!.querySelector('emr-validation-rule-editor') as EmrValidationRuleEditorElement;
      await ruleEditor.updateComplete;
      expect(ruleEditor.shadowRoot!.textContent).toContain('Minimum value');
      const child = element.shadowRoot!.querySelector('emr-terminology-search') as EmrTerminologySearchElement;
      await child.updateComplete;
      expect((child.shadowRoot!.querySelector('input[type="search"]') as HTMLInputElement).value).toBe('blood pressure');
      [...child.shadowRoot!.querySelectorAll('button')].find(button => button.textContent?.includes('Blood pressure'))!.click();
      expect(intents).toEqual([
        {
          type: 'terminologyConceptSelected',
          role: 'question-meaning',
          concept: { sourceId: 'loinc', system: 'urn:loinc', code: 'bp', display: 'Blood pressure' },
          strength: 'preferred',
          mappingRelationship: undefined,
        },
      ]);
      const saveButton = [...element.shadowRoot!.querySelectorAll('button')].find(button =>
        button.textContent?.includes('Save field'),
      )!;
      saveButton.click();
      element.model = { ...element.model!, readOnly: true };
      await element.updateComplete;
      expect(saveButton.getAttribute('aria-disabled')).toBe('true');
      saveButton.click();
      expect(intents.slice(1)).toEqual([{ type: 'saveRequested' }]);
    } finally {
      element.remove();
    }
  });

  it('renders terminology results and emits the typed search intent', async () => {
    registerL6AuthoringSurfaces();
    const element = document.createElement('emr-terminology-search') as EmrTerminologySearchElement;
    element.model = {
      role: 'question-meaning',
      sources: [{ id: 'loinc', kind: 'loinc', label: 'LOINC', available: true }],
      search: {
        sourceId: 'loinc',
        role: 'question-meaning',
        query: 'blood pressure',
        options: [{ sourceId: 'loinc', system: 'urn:loinc', code: 'bp', display: 'Blood pressure' }],
        page: 1,
        pageSize: 10,
        total: 1,
        loading: false,
      },
      bindings: [],
    } satisfies TerminologySearchViewModel;
    const intents: unknown[] = [];
    element.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      expect(element.shadowRoot!.textContent).toContain('Blood pressure');
      const searchButton = [...element.shadowRoot!.querySelectorAll('button')].find(
        button => button.textContent?.trim() === 'Search',
      )!;
      searchButton.click();
      expect(intents).toEqual([{ type: 'terminologySearchRequested', role: 'question-meaning' }]);
    } finally {
      element.remove();
    }
  });

  it('renders validation rules, rejects invalid drafts, and resets inputs after add', async () => {
    registerL6AuthoringSurfaces();
    const element = document.createElement('emr-validation-rule-editor') as EmrValidationRuleEditorElement;
    element.model = { rules: [{ id: 'min-1', kind: 'minimum', value: 5 }] } satisfies ValidationRuleEditorViewModel;
    const intents: unknown[] = [];
    element.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      expect(element.shadowRoot!.textContent).toContain('5');
      const [valInput, msgInput] = [...element.shadowRoot!.querySelectorAll('input')];
      valInput.value = '18';
      valInput.dispatchEvent(new Event('input', { bubbles: true }));
      msgInput.value = 'Min 18';
      msgInput.dispatchEvent(new Event('input', { bubbles: true }));
      await element.updateComplete;
      [...element.shadowRoot!.querySelectorAll('button')]
        .find(button => button.textContent?.includes('Add validation rule'))!
        .click();
      await element.updateComplete;
      expect(intents).toEqual([
        { type: 'validationRuleAdded', rule: { id: '', message: 'Min 18', kind: 'minimum', value: 18 } },
      ]);
      expect(valInput.value).toBe('');
      expect(msgInput.value).toBe('');
    } finally {
      element.remove();
    }
  });

  it('renders a field library entry and emits fieldAdded for the selected section', async () => {
    registerL6AuthoringSurfaces();
    const element = document.createElement('emr-field-library-picker') as EmrFieldLibraryPickerElement;
    element.model = {
      fields: [field],
      query: '',
      selectedSectionId: 'observations',
    } satisfies FieldLibraryPickerViewModel;
    const intents: unknown[] = [];
    element.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      expect(element.shadowRoot!.textContent).toContain('Systolic pressure');
      [...element.shadowRoot!.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Add')!.click();
      expect(intents).toEqual([{ type: 'fieldAdded', sectionId: 'observations', field, placementId: '' }]);
    } finally {
      element.remove();
    }
  });

  it('composes picker and preview inside template composer and emits sectionAdded + placementSelected', async () => {
    registerL6AuthoringSurfaces();
    const element = document.createElement('emr-template-composer') as EmrTemplateComposerElement;
    element.model = templateModel();
    const intents: unknown[] = [];
    element.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      expect(element.shadowRoot!.querySelector('emr-field-library-picker')).not.toBeNull();
      expect(element.shadowRoot!.querySelector('emr-template-preview')).not.toBeNull();
      expect(element.shadowRoot!.textContent).toContain('Observations');

      const placementBtn = [...element.shadowRoot!.querySelectorAll('button.authoring-item__select')].find(btn =>
        btn.textContent?.includes('Blood pressure'),
      ) as HTMLButtonElement;
      placementBtn.click();

      const input = element.shadowRoot!.querySelector('input[aria-label="New section label"]') as HTMLInputElement;
      input.value = 'History';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await element.updateComplete;
      [...element.shadowRoot!.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Add')!.click();
      expect(intents).toEqual([
        { type: 'placementSelected', sectionId: 'observations', placementId: 'placement-1' },
        { type: 'sectionAdded', section: { id: '', label: 'History', fields: [] } },
      ]);
    } finally {
      element.remove();
    }
  });

  it('renders template preview via readOnly emr-clinical-form and alert importIssues', async () => {
    registerL6AuthoringSurfaces();
    const element = document.createElement('emr-template-preview') as EmrTemplatePreviewElement;
    element.model = templateModel();
    const intents: unknown[] = [];
    element.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      const formEl = element.shadowRoot!.querySelector('emr-clinical-form') as HTMLElement & {
        model: { readOnly?: boolean };
      };
      expect(formEl).not.toBeNull();
      expect(formEl.model.readOnly).toBe(true);
      const issuesBox = element.shadowRoot!.querySelector('.authoring-issues')!;
      expect(issuesBox.getAttribute('role')).toBe('alert');
      [...element.shadowRoot!.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Export')!.click();
      const acceptButton = [...element.shadowRoot!.querySelectorAll('button')].find(
        button => button.textContent?.trim() === 'Accept import',
      )!;
      expect(acceptButton).toBeDefined();
      acceptButton.click();
      element.model = { ...element.model!, readOnly: true };
      await element.updateComplete;
      acceptButton.click();
      expect(intents).toEqual([
        { type: 'artifactExportRequested', format: 'fhir-r4-questionnaire' satisfies TemplateArtifactFormat },
        { type: 'importAccepted' },
      ]);
    } finally {
      element.remove();
    }
  });
});
