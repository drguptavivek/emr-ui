// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
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
    sections: [{ id: 'observations', label: 'Observations', fields: [{ id: 'placement-1', sourceFieldId: field.id, sourceFieldRevision: 1, field }] }],
  };
  return {
    template,
    fieldLibrary: [field],
    fieldLibraryQuery: '',
    selectedSectionId: 'observations',
    selectedPlacementId: 'placement-1',
    preview: { fields: { [field.id]: { value: 120 } } } as EhrTemplateViewModel['preview'],
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
      terminologyBindings: [{ id: 'binding-1', role: 'question-meaning', concept: { sourceId: 'loinc', system: 'urn:loinc', code: 'bp', display: 'Blood pressure' } }],
    },
    sources: [{ id: 'loinc', kind: 'loinc', label: 'LOINC', available: true }],
    terminologySearches: {
      'question-meaning': { sourceId: 'loinc', role: 'question-meaning', query: 'blood pressure', options: [{ sourceId: 'loinc', system: 'urn:loinc', code: 'bp', display: 'Blood pressure' }], page: 1, pageSize: 10, total: 1, loading: false },
    },
    validationErrors: {},
    saving: false,
    dirty: false,
  };
}

describe('Lit L6 authoring surfaces', () => {
  it('registers all six authoring tags', () => {
    registerL6AuthoringSurfaces();
    for (const tag of ['emr-field-generator', 'emr-terminology-search', 'emr-validation-rule-editor', 'emr-field-library-picker', 'emr-template-composer', 'emr-template-preview']) {
      expect(customElements.get(tag)).toBeDefined();
    }
  });

  it('renders the field draft and emits save intent', async () => {
    registerL6AuthoringSurfaces();
    const element = document.createElement('emr-field-generator') as EmrFieldGeneratorElement;
    element.model = fieldGeneratorModel();
    const intents: unknown[] = [];
    element.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      expect(element.shadowRoot!.textContent).toContain('Blood pressure');
      const ruleEditor = element.shadowRoot!.querySelector('emr-validation-rule-editor') as EmrValidationRuleEditorElement;
      await ruleEditor.updateComplete;
      expect(ruleEditor.shadowRoot!.textContent).toContain('Minimum value');
      const child = element.shadowRoot!.querySelector('emr-terminology-search') as EmrTerminologySearchElement;
      await child.updateComplete;
      expect((child.shadowRoot!.querySelector('input[type="search"]') as HTMLInputElement).value).toBe('blood pressure');
      [...child.shadowRoot!.querySelectorAll('button')].find(button => button.textContent?.includes('Blood pressure'))!.click();
      expect(intents).toEqual([{
        type: 'terminologyConceptSelected', role: 'question-meaning',
        concept: { sourceId: 'loinc', system: 'urn:loinc', code: 'bp', display: 'Blood pressure' },
        strength: 'preferred', mappingRelationship: undefined,
      }]);
      const saveButton = [...element.shadowRoot!.querySelectorAll('button')].find(button => button.textContent?.includes('Save field'))!;
      saveButton.click();
      element.model = { ...element.model!, readOnly: true };
      saveButton.click();
      expect(intents.slice(1)).toEqual([{ type: 'saveRequested' }]);
    } finally { element.remove(); }
  });

  it('renders terminology results and emits the typed search intent', async () => {
    registerL6AuthoringSurfaces();
    const element = document.createElement('emr-terminology-search') as EmrTerminologySearchElement;
    element.model = {
      role: 'question-meaning',
      sources: [{ id: 'loinc', kind: 'loinc', label: 'LOINC', available: true }],
      search: { sourceId: 'loinc', role: 'question-meaning', query: 'blood pressure', options: [{ sourceId: 'loinc', system: 'urn:loinc', code: 'bp', display: 'Blood pressure' }], page: 1, pageSize: 10, total: 1, loading: false },
      bindings: [],
    } satisfies TerminologySearchViewModel;
    const intents: unknown[] = [];
    element.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      expect(element.shadowRoot!.textContent).toContain('Blood pressure');
      const searchButton = [...element.shadowRoot!.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Search')!;
      searchButton.click();
      expect(intents).toEqual([{ type: 'terminologySearchRequested', role: 'question-meaning' }]);
    } finally { element.remove(); }
  });

  it('renders validation rules and emits a built rule intent', async () => {
    registerL6AuthoringSurfaces();
    const element = document.createElement('emr-validation-rule-editor') as EmrValidationRuleEditorElement;
    element.model = { rules: [{ id: 'min-1', kind: 'minimum', value: 5 }] } satisfies ValidationRuleEditorViewModel;
    const intents: unknown[] = [];
    element.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      expect(element.shadowRoot!.textContent).toContain('5');
      const input = element.shadowRoot!.querySelector('input')!;
      input.value = '18';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await element.updateComplete;
      [...element.shadowRoot!.querySelectorAll('button')].find(button => button.textContent?.includes('Add validation rule'))!.click();
      expect(intents).toEqual([{ type: 'validationRuleAdded', rule: { id: '', message: undefined, kind: 'minimum', value: 18 } }]);
    } finally { element.remove(); }
  });

  it('renders a field library entry and emits fieldAdded for the selected section', async () => {
    registerL6AuthoringSurfaces();
    const element = document.createElement('emr-field-library-picker') as EmrFieldLibraryPickerElement;
    element.model = { fields: [field], query: '', selectedSectionId: 'observations' } satisfies FieldLibraryPickerViewModel;
    const intents: unknown[] = [];
    element.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      expect(element.shadowRoot!.textContent).toContain('Systolic pressure');
      [...element.shadowRoot!.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Add')!.click();
      expect(intents).toEqual([{ type: 'fieldAdded', sectionId: 'observations', field, placementId: '' }]);
    } finally { element.remove(); }
  });

  it('renders template structure and emits section creation intent', async () => {
    registerL6AuthoringSurfaces();
    const element = document.createElement('emr-template-composer') as EmrTemplateComposerElement;
    element.model = templateModel();
    const intents: unknown[] = [];
    element.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      expect(element.shadowRoot!.textContent).toContain('Observations');
      const input = element.shadowRoot!.querySelector('input[aria-label="New section label"]')!;
      input.value = 'History';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await element.updateComplete;
      [...element.shadowRoot!.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Add section')!.click();
      expect(intents).toEqual([{ type: 'sectionAdded', section: { id: '', label: 'History', fields: [] } }]);
    } finally { element.remove(); }
  });

  it('renders template preview and emits artifact export for the selected format', async () => {
    registerL6AuthoringSurfaces();
    const element = document.createElement('emr-template-preview') as EmrTemplatePreviewElement;
    element.model = templateModel();
    const intents: unknown[] = [];
    element.addEventListener('intent', event => intents.push((event as CustomEvent).detail));
    document.body.append(element);
    try {
      await element.updateComplete;
      expect(element.shadowRoot!.textContent).toContain('Blood pressure');
      expect(element.shadowRoot!.textContent).toContain('Preview value: 120');
      [...element.shadowRoot!.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Export')!.click();
      const acceptButton = [...element.shadowRoot!.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Accept import')!;
      expect(acceptButton).toBeDefined();
      acceptButton.click();
      element.model = { ...element.model!, readOnly: true };
      acceptButton.click();
      expect(intents).toEqual([
        { type: 'artifactExportRequested', format: 'fhir-r4-questionnaire' satisfies TemplateArtifactFormat },
        { type: 'importAccepted' },
      ]);
    } finally { element.remove(); }
  });
});
