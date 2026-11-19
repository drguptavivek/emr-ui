import type {
  ClinicalFieldDefinition,
  ClinicalFieldType,
  ClinicalOption,
  EhrTemplateStatus,
  EmrGeneratedFieldDefinition,
  FieldValidationRule,
  TemplateArtifactFormat,
  TemplateArtifactIssue,
  TerminologyBinding,
  TerminologyBindingRole,
} from '@drguptavivek/emr-controller';

export const AUTHORING_TERMINOLOGY_ROLES: readonly TerminologyBindingRole[] = [
  'question-meaning',
  'answer-value-set',
  'unit',
  'classification-mapping',
];

export const AUTHORING_VALIDATION_RULE_KINDS: readonly FieldValidationRule['kind'][] = [
  'min-length',
  'max-length',
  'minimum',
  'maximum',
  'precision',
  'pattern',
  'earliest-date',
  'latest-date',
  'allowed-values',
  'custom',
];

export const AUTHORING_ARTIFACT_FORMATS: readonly TemplateArtifactFormat[] = [
  'internal-json',
  'fhir-r4-questionnaire',
  'fhir-r4-bundle',
  'fhir-r4b-questionnaire',
  'fhir-r5-questionnaire',
];

export const AUTHORING_FIELD_TYPE_OPTIONS: readonly { readonly value: ClinicalFieldType; readonly label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'multiline', label: 'Long text' },
  { value: 'integer', label: 'Integer' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'datetime', label: 'Date & time' },
  { value: 'select', label: 'Single choice' },
  { value: 'multiselect', label: 'Multiple choice' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'custom', label: 'Custom renderer' },
];

export const AUTHORING_SPAN_OPTIONS: readonly (3 | 4 | 6 | 8 | 9 | 12)[] = [3, 4, 6, 8, 9, 12];

export const AUTHORING_TEMPLATE_STATUS_OPTIONS: readonly { readonly value: EhrTemplateStatus; readonly label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'retired', label: 'Retired' },
];

export const TERMINOLOGY_SEARCH_DEFAULTS = {
  eyebrow: 'Terminology binding',
  searching: 'Searching…',
  sourceLabel: 'Source',
  chooseTerminology: 'Choose terminology',
  searchLabel: 'Search',
  searchButton: 'Search',
  searchUcumPlaceholder: 'Search UCUM units',
  retry: 'Retry',
  noConceptsFound: 'No concepts found for this search.',
  inactive: 'Inactive',
  previous: 'Previous',
  next: 'Next',
  selectedConcept: 'Selected concept',
  bindingStrength: 'Binding strength',
  relationship: 'Relationship',
  remove: 'Remove',
  roleLabels: {
    'question-meaning': 'Clinical meaning',
    'answer-value-set': 'Answer value set',
    unit: 'Unit / UCUM',
    'classification-mapping': 'Classification mapping',
  } as Readonly<Record<TerminologyBindingRole, string>>,
  strengthOptions: [
    { value: 'required', label: 'Required' },
    { value: 'extensible', label: 'Extensible' },
    { value: 'preferred', label: 'Preferred' },
    { value: 'example', label: 'Example' },
  ] as readonly ClinicalOption[],
  relationshipOptions: [
    { value: 'equivalent', label: 'Equivalent' },
    { value: 'wider', label: 'Wider' },
    { value: 'narrower', label: 'Narrower' },
    { value: 'related-to', label: 'Related' },
  ] as readonly ClinicalOption[],
} as const;

export type EmrTerminologySearchLabels = typeof TERMINOLOGY_SEARCH_DEFAULTS;

export const VALIDATION_EDITOR_DEFAULTS = {
  eyebrow: 'Validation',
  heading: 'Rules for this field',
  ruleTypeLabel: 'Rule type',
  validatorIdLabel: 'Validator ID',
  validatorIdPlaceholder: 'e.g. systolic-range',
  regexLabel: 'Regular expression',
  regexPlaceholder: 'e.g. ^[A-Z0-9-]+$',
  dateLabel: 'Date',
  datePlaceholder: 'YYYY-MM-DD',
  allowedValuesLabel: 'Values',
  allowedValuesPlaceholder: 'Separate values with commas',
  valueLabel: 'Value',
  messageLabel: 'Message',
  messageOptional: 'optional',
  messagePlaceholder: 'Explain how to resolve the issue',
  customNote: 'The controller resolves this validator ID. The UI does not execute clinical validation.',
  addRule: 'Add validation rule',
  currentRulesGroup: 'Current validation rules',
  remove: 'Remove',
  defaultPatternMessage: 'Value does not match the required pattern.',
  ruleLabels: {
    'min-length': 'Minimum length',
    'max-length': 'Maximum length',
    minimum: 'Minimum value',
    maximum: 'Maximum value',
    precision: 'Decimal precision',
    pattern: 'Pattern',
    'earliest-date': 'Earliest date',
    'latest-date': 'Latest date',
    'allowed-values': 'Allowed values',
    custom: 'Custom validator',
  } as Readonly<Record<FieldValidationRule['kind'], string>>,
} as const;

export type EmrValidationRuleEditorLabels = typeof VALIDATION_EDITOR_DEFAULTS;

export const FIELD_GENERATOR_DEFAULTS = {
  eyebrow: 'Reusable field authoring',
  heading: 'Create an EMR field',
  subtitle:
    'Define the presentation contract once, then reuse it in clinical forms and templates. APIs, terminology interpretation, FHIR mapping and persistence remain controller responsibilities.',
  unsavedChanges: 'Unsaved changes',
  ready: 'Ready',
  saving: 'Saving…',
  saveField: 'Save field',
  identityEyebrow: 'Identity and display',
  identityHeading: 'Field definition',
  fieldIdLabel: 'Stable field ID',
  labelLabel: 'Label',
  descriptionLabel: 'Description',
  instructionsLabel: 'Entry instructions',
  placeholderLabel: 'Placeholder',
  behaviourEyebrow: 'Behaviour',
  behaviourHeading: 'Type, cardinality and layout',
  valueTypeLabel: 'Value type',
  gridSpanLabel: 'Grid span',
  textRowsLabel: 'Text rows',
  precisionLabel: 'Decimal precision',
  requiredFlag: 'Required',
  repeatableFlag: 'Repeatable',
  readOnlyFlag: 'Display only',
  measurementEyebrow: 'Measurement',
  measurementHeading: 'Unit and precision',
  displayUnitLabel: 'Display unit',
  displayUnitPlaceholder: 'e.g. kg',
  unitSystemLabel: 'Unit system',
  unitSystemPlaceholder: 'e.g. UCUM',
  unitCodeLabel: 'Unit code',
  unitCodePlaceholder: 'e.g. kg',
  optionsEyebrow: 'Options',
  optionsHeading: 'Choice values',
  optionValueLabel: 'Option value',
  optionLabelLabel: 'Option label',
  addOption: 'Add option',
  remove: 'Remove',
  terminologyEyebrow: 'Terminology',
  terminologyHeading: 'Bind external standards',
  terminologyDescription:
    'Search configured services for LOINC, SNOMED CT, ICD-10, ICD-11 or UCUM concepts. The selected code is stored as a binding on this field.',
  previewEyebrow: 'Live preview',
  previewHeading: 'How it appears in a form',
  untitledField: 'Untitled field',
  fhirReadyTitle: 'FHIR-ready definition',
  fhirReadyNote: 'FHIR Questionnaire / Bundle mapping is resolved by the template controller.',
  statusEyebrow: 'Definition status',
  noErrors: 'No controller-reported errors.',
} as const;

export type EmrFieldGeneratorLabels = typeof FIELD_GENERATOR_DEFAULTS;

export const FIELD_LIBRARY_DEFAULTS = {
  eyebrow: 'Field library',
  heading: 'Add reusable fields',
  description: 'Search the controller-supplied field catalogue, then add a field to the selected section.',
  searchLabel: 'Search fields',
  searchPlaceholder: 'Search by label, type or terminology',
  selectSectionNote: 'Select a template section before adding a field.',
  availableFieldsList: 'Available reusable fields',
  requiredTag: 'Required',
  repeatableTag: 'Repeatable',
  add: 'Add',
  noMatchingFields: 'No reusable fields match this search.',
} as const;

export type EmrFieldLibraryPickerLabels = typeof FIELD_LIBRARY_DEFAULTS;

export const TEMPLATE_PREVIEW_DEFAULTS = {
  eyebrow: 'Reusable form',
  untitledTemplate: 'Untitled template',
  defaultDescription: 'A live, value-empty preview of the current template.',
  interopEyebrow: 'Interoperability',
  interopHeading: 'Import or export template artifacts',
  interopDescription: 'Serialization and FHIR mapping are delegated to the configured artifact controller.',
  working: 'Working…',
  formatLabel: 'Format',
  exportButton: 'Export',
  serializedLabel: 'Serialized preview or import payload',
  serializedPlaceholder: 'Paste a JSON or FHIR artifact to import',
  importButton: 'Import',
  acceptImportButton: 'Accept import',
  reviewIssuesHeading: 'Review import issues',
  formatLabels: {
    'internal-json': 'Internal JSON',
    'fhir-r4-questionnaire': 'FHIR R4 Questionnaire',
    'fhir-r4-bundle': 'FHIR R4 Bundle',
    'fhir-r4b-questionnaire': 'FHIR R4B Questionnaire',
    'fhir-r5-questionnaire': 'FHIR R5 Questionnaire',
  } as Readonly<Record<TemplateArtifactFormat, string>>,
} as const;

export type EmrTemplatePreviewLabels = typeof TEMPLATE_PREVIEW_DEFAULTS;

export const TEMPLATE_COMPOSER_DEFAULTS = {
  eyebrow: 'Template authoring',
  untitledTemplate: 'Untitled EHR template',
  subtitle:
    'Compose reusable clinical forms from controller-defined fields. Terminology, validation, persistence and artifact mapping remain outside the UI.',
  unsavedChanges: 'Unsaved changes',
  saving: 'Saving…',
  saveTemplate: 'Save template',
  metadataEyebrow: 'Template metadata',
  metadataHeading: 'Identity and lifecycle',
  titleLabel: 'Title',
  descriptionLabel: 'Description',
  localeLabel: 'Locale',
  statusLabel: 'Status',
  structureEyebrow: 'Structure',
  sectionsHeading: 'Sections',
  newSectionPlaceholder: 'New section label',
  addSection: 'Add',
  sectionsNavLabel: 'Template sections',
  moveUp: 'Up',
  moveDown: 'Down',
  noSections: 'No sections yet. Add one to begin composing.',
  selectedSectionEyebrow: 'Selected section',
  removeSection: 'Remove section',
  sectionLabelLabel: 'Label',
  sectionDescriptionLabel: 'Description',
  placementsListLabel: 'Fields in selected section',
  terminologyBound: 'Terminology bound',
  remove: 'Remove',
  noFieldsInSection: 'No fields in this section. Choose a reusable field from the library.',
  selectSectionPrompt: 'Select a section to edit it and add reusable fields.',
} as const;

export type EmrTemplateComposerLabels = typeof TEMPLATE_COMPOSER_DEFAULTS;

export function resolveAuthoringId(prefix: string, suffix: string): string {
  const clean = prefix.trim();
  return clean ? `${clean}-${suffix}` : suffix;
}

export function isValidIsoDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function canAddValidationRule(
  kind: FieldValidationRule['kind'],
  value: string,
  message: string,
): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (kind === 'custom') return message.trim().length > 0;
  if (kind === 'minimum' || kind === 'maximum') {
    return Number.isFinite(Number(trimmed));
  }
  if (kind === 'min-length' || kind === 'max-length' || kind === 'precision') {
    const n = Number(trimmed);
    return Number.isInteger(n) && n >= 0;
  }
  if (kind === 'pattern') {
    try {
      new RegExp(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  if (kind === 'earliest-date' || kind === 'latest-date') {
    return isValidIsoDateInput(trimmed);
  }
  if (kind === 'allowed-values') {
    return trimmed.split(',').some(item => item.trim().length > 0);
  }
  return true;
}

export function buildValidationRule(
  kind: FieldValidationRule['kind'],
  value: string,
  message: string,
  defaultPatternMessage = VALIDATION_EDITOR_DEFAULTS.defaultPatternMessage,
): FieldValidationRule {
  const trimmedValue = value.trim();
  const trimmedMessage = message.trim();
  const base = { id: '', ...(trimmedMessage ? { message: trimmedMessage } : {}) };
  if (kind === 'pattern') {
    return {
      id: '',
      kind: 'pattern',
      value: trimmedValue,
      message: trimmedMessage || defaultPatternMessage,
    };
  }
  if (kind === 'custom') {
    return {
      id: '',
      kind: 'custom',
      customValidatorId: trimmedValue,
      message: trimmedMessage,
    };
  }
  if (kind === 'allowed-values') {
    return {
      ...base,
      kind: 'allowed-values',
      values: trimmedValue.split(',').map(item => item.trim()).filter(Boolean),
    };
  }
  if (kind === 'earliest-date' || kind === 'latest-date') {
    return {
      ...base,
      kind,
      value: trimmedValue,
    };
  }
  return {
    ...base,
    kind,
    value: Number(trimmedValue),
  };
}

export function summarizeValidationRule(rule: FieldValidationRule): string {
  if ('values' in rule) return rule.values.join(', ');
  if ('customValidatorId' in rule) return rule.customValidatorId;
  return String(rule.value);
}

export function filterBindingsByRole(
  bindings: readonly TerminologyBinding[],
  role: TerminologyBindingRole,
): TerminologyBinding[] {
  return bindings.filter(binding => binding.role === role);
}

export function summarizeFieldTerminology(field: EmrGeneratedFieldDefinition): string {
  return field.terminologyBindings.map(binding => binding.concept?.code ?? binding.role).join(' · ');
}

export function toPreviewFieldDefinition(
  draft: EmrGeneratedFieldDefinition,
  untitledLabel = FIELD_GENERATOR_DEFAULTS.untitledField,
): ClinicalFieldDefinition {
  return {
    id: draft.id || 'generated-field',
    label: draft.label || untitledLabel,
    type: draft.type,
    required: draft.required,
    placeholder: draft.placeholder,
    hint: draft.instructions ?? draft.description,
    unit: draft.unit,
    precision: draft.precision,
    rows: draft.rows,
    options: draft.options,
    span: draft.span,
  };
}

export function canAcceptTemplateImport(importIssues?: readonly TemplateArtifactIssue[]): boolean {
  return !!importIssues?.length && !importIssues.some(issue => issue.severity === 'error');
}

export function formatArtifactLabel(
  format: TemplateArtifactFormat,
  labels: Readonly<Record<TemplateArtifactFormat, string>> = TEMPLATE_PREVIEW_DEFAULTS.formatLabels,
): string {
  return labels[format] ?? format;
}
