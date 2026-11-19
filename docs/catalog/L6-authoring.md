# L6 — Authoring

L6 is the meta-layer: unlike L1–L5, which *consume* controller-supplied clinical data, L6 components *produce* the definitions L2–L5 later consume — a reusable field's identity/type/validation/terminology bindings (`EmrGeneratedFieldDefinition`), and an ordered template of such fields (`EhrTemplateDefinition`). This inversion is why the layer rule ("import your own layer or lower, never upward") lets L6 components reach all the way down to L2 (`EmrFieldGenerator` imports `EmrTypedField` to live-preview a draft field) and to L3 (`EmrTemplatePreview` imports `EmrClinicalForm` to preview a whole template) — an authoring surface legitimately needs to render, read-only, exactly what its output will look like once it becomes real clinical UI. Every L6 component still obeys the controlled-component boundary: no HTTP calls, no persistence, no terminology-server queries, no FHIR construction, no clinical validation execution — those all live behind ports (`TerminologySearchPort`, `FieldDefinitionRepositoryPort`, `TemplateArtifactPort`, `EhrTemplateRepositoryPort`) that a consuming controller implements.

Source: `packages/emr-ui/src/lib/authoring/emr-field-generator.component.ts`, `emr-terminology-search.component.ts`, `emr-validation-rule-editor.component.ts`; `packages/emr-ui/src/lib/authoring/emr-field-library-picker.component.ts`, `emr-template-composer.component.ts`, `emr-template-preview.component.ts`.

---

### EmrFieldGenerator
**Layer** L6 · **Selector** `emr-field-generator` · **Status** stable · **Story** `emr-authoring-field-generator--blank`

**Need** — building a clinical form field-by-field in code (id, label, type, span, unit, validation rules, terminology bindings) is slow and error-prone; a form-based authoring surface that produces a single reusable, versioned field definition — with a live preview of how it will render — lets non-engineers define fields once and reuse them across templates.

**Purpose** — edits an `EmrGeneratedFieldDefinition` draft (identity/display, type/cardinality/layout, quantity unit fields when `type === 'quantity'`, option list when `type === 'select'|'multiselect'`), embeds `EmrValidationRuleEditor` for declarative rules and one `EmrTerminologySearch` per terminology role, and renders a read-only `EmrTypedField` live preview of the current draft. It emits `FieldGeneratorIntent` only. It does NOT save the field, does NOT resolve or call a terminology server itself (it only relays search/select intents), does NOT execute the validation rules it lets a user declare, and does NOT construct FHIR — `savedFieldId`, `validationErrors`, and terminology search results are all controller-supplied.

**API**
```ts
// field-generator.models.ts — quoted verbatim
export type FieldValidationRule =
  | { id: string; kind: 'min-length'; value: number; message?: string }
  | { id: string; kind: 'max-length'; value: number; message?: string }
  | { id: string; kind: 'minimum'; value: number; message?: string }
  | { id: string; kind: 'maximum'; value: number; message?: string }
  | { id: string; kind: 'precision'; value: number; message?: string }
  | { id: string; kind: 'pattern'; value: string; message: string }
  | { id: string; kind: 'earliest-date'; value: string; message?: string }
  | { id: string; kind: 'latest-date'; value: string; message?: string }
  | { id: string; kind: 'allowed-values'; values: readonly string[]; message?: string }
  | { id: string; kind: 'custom'; customValidatorId: string; message: string };

export interface EmrGeneratedFieldDefinition {
  schemaVersion: '1.0';
  id: string;
  revision: number;
  label: string;
  description?: string;
  instructions?: string;
  type: ClinicalFieldType;
  required: boolean;
  repeats: boolean;
  readOnly?: boolean;
  defaultValue?: ClinicalFieldValue;
  placeholder?: string;
  span?: 3 | 4 | 6 | 8 | 9 | 12;
  rows?: number;
  precision?: number;
  unit?: string;
  unitSystem?: string;
  unitCode?: string;
  options?: readonly { value: string; label: string; disabled?: boolean }[];
  validationRules: readonly FieldValidationRule[];
  terminologyBindings: readonly TerminologyBinding[];
  tags?: readonly string[];
}

export interface FieldGeneratorViewModel {
  draft: EmrGeneratedFieldDefinition;
  sources: readonly TerminologySource[];
  terminologySearches: Readonly<Partial<Record<TerminologyBindingRole, TerminologySearchState>>>;
  validationErrors: Readonly<Record<string, string>>;
  saving: boolean;
  readOnly?: boolean;
  dirty?: boolean;
  error?: string;
  savedFieldId?: string;
}

export type FieldGeneratorIntent =
  | { type: 'draftPatched'; changes: Partial<EmrGeneratedFieldDefinition> }
  | { type: 'validationRuleAdded'; rule: FieldValidationRule }
  | { type: 'validationRuleRemoved'; ruleId: string }
  | { type: 'terminologySearchOpened'; role: TerminologyBindingRole; sourceId: string }
  | { type: 'terminologyQueryChanged'; role: TerminologyBindingRole; query: string }
  | { type: 'terminologySearchRequested'; role: TerminologyBindingRole }
  | { type: 'terminologyPageChanged'; role: TerminologyBindingRole; page: number }
  | { type: 'terminologyRetryRequested'; role: TerminologyBindingRole }
  | { type: 'terminologyConceptSelected'; role: TerminologyBindingRole; concept: TerminologyConcept; strength?: TerminologyBindingStrength; mappingRelationship?: TerminologyMappingRelationship }
  | { type: 'terminologyBindingRemoved'; bindingId: string }
  | { type: 'saveRequested' }
  | { type: 'resetRequested'; draft: EmrGeneratedFieldDefinition };

@Component({ selector: 'emr-field-generator', standalone: true })
export class EmrFieldGeneratorComponent {
  readonly model = input.required<FieldGeneratorViewModel>();
  readonly readOnly = input<boolean>(false); // OR'd with model().readOnly
  readonly headingId = input<string>('emr-field-generator-heading');
  readonly idPrefix = input<string>('emr-field-generator');
  readonly labels = input<Partial<EmrFieldGeneratorLabels>>({});
  readonly intent = output<FieldGeneratorIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `FieldGeneratorViewModel` (required) | — | Draft field (including `'time'` and `'datetime'` field types) + terminology sources/search state + validation errors + save state |
| `readOnly` | `boolean` | `false` | Effective value is `readOnly() \|\| Boolean(model().readOnly)` |
| `headingId` | `string` | `'emr-field-generator-heading'` | Accessible heading element id |
| `idPrefix` | `string` | `'emr-field-generator'` | Prefixed onto generated control ids and child widgets (`resolveAuthoringId(idPrefix(), headingId())`) |
| `labels` | `Partial<EmrFieldGeneratorLabels>` | `{}` | Optional copy overrides merged with `FIELD_GENERATOR_LABEL_DEFAULTS` |
| `intent` | `output<FieldGeneratorIntent>` | — | Emits draft, terminology, validation rule, save, and reset intents |
| `focused` / `blurred` | `output<void>` | — | Emitted on focusin / focusout within the surface |

**Example**
```html
<emr-field-generator [model]="fieldDraftViewModel" (intent)="onFieldGeneratorIntent($event)" />
```

**Composition** — renders `EmrTypedFieldComponent` (L2, read-only live preview of `previewField()`), `EmrTerminologySearchComponent` (L6, one instance per `TerminologyBindingRole`: `question-meaning`, `answer-value-set`, `unit`, `classification-mapping`), and `EmrValidationRuleEditorComponent` (L6, one instance for `draft.validationRules`). This is the deepest cross-layer reach in the catalogue: L6 → L2 for the preview, plus two L6 → L6 edges.

**Depends on** — `EmrTypedFieldComponent` (L2), `EmrTerminologySearchComponent` (L6), `EmrValidationRuleEditorComponent` (L6). Verified: `emr-field-generator -> emr-typed-field(L2), emr-terminology-search(L6), emr-validation-rule-editor(L6)`.
**Used by** — none in the verified intra-UI import graph (top-level authoring entry point).

---

### EmrTerminologySearch
**Layer** L6 · **Selector** `emr-terminology-search` · **Status** stable · **Story** `emr-authoring-field-generator--terminology-search-standalone`

**Need** — binding a field to LOINC/SNOMED CT/ICD-10/ICD-11/UCUM concepts requires searching a controller-chosen source, paging results, showing loading/error/empty states, and letting the user set binding strength (and, for classification mappings, a mapping relationship) — one reusable search-and-bind widget instead of one per terminology role.

**Purpose** — renders a source picker, a search box + button, paged results, and the currently attached `bindings` for one `TerminologyBindingRole`. Selecting a result or changing strength/relationship emits `terminologyConceptSelected`; it never calls a terminology API itself (`TerminologySearchPort` lives in the controller) and never interprets a concept's meaning.

**API**
```ts
// terminology.models.ts / field-generator.models.ts
export type TerminologyKind = 'loinc' | 'snomed-ct' | 'icd-10' | 'icd-11' | 'ucum' | 'custom';
export type TerminologyBindingRole = 'question-meaning' | 'answer-value-set' | 'unit' | 'classification-mapping';
export type TerminologyBindingStrength = 'required' | 'extensible' | 'preferred' | 'example';
export type TerminologyMappingRelationship = 'equivalent' | 'wider' | 'narrower' | 'related-to';

export interface TerminologySearchViewModel {
  role: TerminologyBindingRole;
  sources: readonly TerminologySource[];
  search?: TerminologySearchState;
  bindings: readonly TerminologyBinding[];
  readOnly?: boolean;
}

@Component({ selector: 'emr-terminology-search', standalone: true })
export class EmrTerminologySearchComponent {
  readonly model = input.required<TerminologySearchViewModel>();
  readonly readOnly = input<boolean>(false);
  readonly headingId = input<string>('emr-terminology-heading');
  readonly idPrefix = input<string>('emr-terminology');
  readonly labels = input<Partial<EmrTerminologySearchLabels>>({});
  readonly intent = output<TerminologySearchIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `TerminologySearchViewModel` (required) | — | Canonical model holding `role`, `sources`, `search`, `bindings`, and optional `readOnly` |
| `readOnly` | `boolean` | `false` | Effective value is `readOnly() \|\| Boolean(model().readOnly)` |
| `headingId` | `string` | `'emr-terminology-heading'` | Accessible heading element id |
| `idPrefix` | `string` | `'emr-terminology'` | Prefixes generated control ids |
| `labels` | `Partial<EmrTerminologySearchLabels>` | `{}` | Optional copy overrides merged with `TERMINOLOGY_SEARCH_LABEL_DEFAULTS` |
| `intent` | `output<TerminologySearchIntent>` | — | Typed standalone `TerminologySearchIntent` (subset compatible with `FieldGeneratorIntent`) |
| `focused` / `blurred` | `output<void>` | — | Emitted on focusin / focusout within the surface |

**Example**
```html
<emr-terminology-search [model]="{ role: 'question-meaning', sources: loincAndSnomedSources, search: model.terminologySearches['question-meaning'], bindings: questionMeaningBindings }"
  (intent)="onTerminologyIntent($event)" />
```

**Composition** — renders no other catalogued component; pure template + native controls (`NgIcon` monochrome SVG icons).

**Depends on** — none.
**Used by** — `EmrFieldGenerator` (L6, verified: `emr-field-generator -> emr-terminology-search`).

---

### EmrValidationRuleEditor
**Layer** L6 · **Selector** `emr-validation-rule-editor` · **Status** stable · **Story** `emr-authoring-field-generator--validation-rule-editor-standalone`

**Need** — a field's declarative validation (min/max length, numeric bounds, precision, regex pattern, date bounds, allowed values, or a named custom validator) needs one small, reusable add/remove editor rather than ten separate ad-hoc inputs wherever validation rules are authored.

**Purpose** — lets the user pick a `FieldValidationRule['kind']`, fill in the kind-appropriate value control (number, date, regex text, comma-separated list, or a custom-validator id + required message), and add or remove rules from the list (resetting rule draft value/message cleanly upon add). It emits `ValidationRuleEditorIntent` (`validationRuleAdded` / `validationRuleRemoved`) only, and explicitly does not execute any rule — the in-template note for `kind: 'custom'` states: "The controller resolves this validator ID. The UI does not execute clinical validation."

**API**
```ts
// field-generator.models.ts
export type FieldValidationRule =
  | { id: string; kind: 'min-length'; value: number; message?: string }
  | { id: string; kind: 'max-length'; value: number; message?: string }
  | { id: string; kind: 'minimum'; value: number; message?: string }
  | { id: string; kind: 'maximum'; value: number; message?: string }
  | { id: string; kind: 'precision'; value: number; message?: string }
  | { id: string; kind: 'pattern'; value: string; message: string }
  | { id: string; kind: 'earliest-date'; value: string; message?: string }
  | { id: string; kind: 'latest-date'; value: string; message?: string }
  | { id: string; kind: 'allowed-values'; values: readonly string[]; message?: string }
  | { id: string; kind: 'custom'; customValidatorId: string; message: string };

export interface ValidationRuleEditorViewModel {
  rules: readonly FieldValidationRule[];
  readOnly?: boolean;
}

@Component({ selector: 'emr-validation-rule-editor', standalone: true })
export class EmrValidationRuleEditorComponent {
  readonly model = input.required<ValidationRuleEditorViewModel>();
  readonly readOnly = input<boolean>(false);
  readonly headingId = input<string>('emr-validation-heading');
  readonly idPrefix = input<string>('emr-validation');
  readonly labels = input<Partial<EmrValidationRuleEditorLabels>>({});
  readonly intent = output<ValidationRuleEditorIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `ValidationRuleEditorViewModel` (required) | — | Canonical model holding `rules` and optional `readOnly` |
| `readOnly` | `boolean` | `false` | Effective value is `readOnly() \|\| Boolean(model().readOnly)` |
| `headingId` | `string` | `'emr-validation-heading'` | Accessible heading element id |
| `idPrefix` | `string` | `'emr-validation'` | Prefixes generated control ids |
| `labels` | `Partial<EmrValidationRuleEditorLabels>` | `{}` | Optional copy overrides merged with `VALIDATION_RULE_EDITOR_LABEL_DEFAULTS` |
| `intent` | `output<ValidationRuleEditorIntent>` | — | Typed standalone `ValidationRuleEditorIntent` (`validationRuleAdded` / `validationRuleRemoved`) |
| `focused` / `blurred` | `output<void>` | — | Emitted on focusin / focusout within the surface |

**Example**
```html
<emr-validation-rule-editor [model]="{ rules: draft.validationRules }" idPrefix="field-a-validation"
  (intent)="onRuleIntent($event)" />
```

**Composition** — renders no other catalogued component; pure template + native controls.

**Depends on** — none.
**Used by** — `EmrFieldGenerator` (L6, verified: `emr-field-generator -> emr-validation-rule-editor`).

---

### EmrFieldLibraryPicker
**Layer** L6 · **Selector** `emr-field-library-picker` · **Status** stable · **Story** `emr-templates-composer--field-library-picker-standalone`

**Need** — composing an EHR template means repeatedly finding an already-authored, revision-pinned field (produced by `EmrFieldGenerator`) and dropping it into the currently selected template section — a searchable catalogue browser is the natural UI for that, distinct from authoring a new field.

**Purpose** — renders a search box over `model.fields` (the controller-filtered field library) and a scrollable list of `EmrGeneratedFieldDefinition` summaries (label, type, required/repeatable flags, description, terminology-binding summary); clicking "Add" on an item emits `fieldAdded` for `model.selectedSectionId`. It does NOT filter the list itself (the `query` input and `fieldLibraryQueryChanged` output round-trip through the controller), does NOT choose a section, and does NOT mint a placement id — `placementId: ''` is emitted and the controller assigns the real id.

**API**
```ts
// ehr-template.models.ts
export interface FieldLibraryPickerViewModel {
  fields: readonly EmrGeneratedFieldDefinition[];
  query: string;
  selectedSectionId?: string;
  readOnly?: boolean;
}

@Component({ selector: 'emr-field-library-picker', standalone: true })
export class EmrFieldLibraryPickerComponent {
  readonly model = input.required<FieldLibraryPickerViewModel>();
  readonly readOnly = input<boolean>(false);
  readonly headingId = input<string>('emr-field-library-heading');
  readonly idPrefix = input<string>('emr-field-library');
  readonly labels = input<Partial<EmrFieldLibraryPickerLabels>>({});
  readonly intent = output<FieldLibraryPickerIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `FieldLibraryPickerViewModel` (required) | — | Canonical model holding `fields`, `query`, optional `selectedSectionId`, and optional `readOnly` |
| `readOnly` | `boolean` | `false` | Effective value is `readOnly() \|\| Boolean(model().readOnly)` |
| `headingId` | `string` | `'emr-field-library-heading'` | Accessible heading element id |
| `idPrefix` | `string` | `'emr-field-library'` | Prefixes generated control ids |
| `labels` | `Partial<EmrFieldLibraryPickerLabels>` | `{}` | Optional copy overrides merged with `FIELD_LIBRARY_PICKER_LABEL_DEFAULTS` |
| `intent` | `output<FieldLibraryPickerIntent>` | — | Typed standalone `FieldLibraryPickerIntent` (`fieldLibraryQueryChanged` / `fieldAdded`) |
| `focused` / `blurred` | `output<void>` | — | Emitted on focusin / focusout within the surface |

**Example**
```html
<emr-field-library-picker [model]="{ fields: model.fieldLibrary, query: model.fieldLibraryQuery, selectedSectionId: model.selectedSectionId }"
  (intent)="onTemplateIntent($event)" />
```

**Composition** — renders no other catalogued component; pure template + native controls (`NgIcon` monochrome SVG icons).

**Depends on** — none.
**Used by** — `EmrTemplateComposer` (L6, verified: `emr-template-composer -> emr-field-library-picker`).

---

### EmrTemplateComposer
**Layer** L6 · **Selector** `emr-template-composer` · **Status** stable · **Story** `emr-templates-composer--multi-section-general-examination`

**Need** — assembling a reusable EHR template (e.g. "General physical examination") means naming/ordering sections and, within each section, adding/ordering/removing field placements pulled from the field library — with a live preview and FHIR/JSON export/import alongside, all without the UI owning persistence or FHIR mapping.

**Purpose** — edits `EhrTemplateDefinition` metadata (title/description/locale/status), manages the section list (add/select/reorder/remove) and, for the selected section, selects (`placementSelected`), reorders (`fieldMoved`), or removes (`fieldRemoved`) field placements; hosts `EmrFieldLibraryPicker` and `EmrTemplatePreview` (`readOnly: true`). It emits `EhrTemplateIntent` only; it never persists the template, never serializes/deserializes FHIR itself, and treats an import as inert until the controller returns `importIssues` and the user explicitly emits `importAccepted`.

**API**
```ts
// ehr-template.models.ts — excerpt
export type EhrTemplateStatus = 'draft' | 'active' | 'retired';
export type TemplateArtifactFormat =
  | 'internal-json' | 'fhir-r4-questionnaire' | 'fhir-r4-bundle' | 'fhir-r4b-questionnaire' | 'fhir-r5-questionnaire';

export type EhrTemplateIntent =
  | { type: 'templatePatched'; changes: Pick<Partial<EhrTemplateDefinition>, 'title' | 'description' | 'locale' | 'status'> }
  | { type: 'fieldLibraryQueryChanged'; query: string }
  | { type: 'sectionSelected'; sectionId: string }
  | { type: 'placementSelected'; sectionId: string; placementId: string }
  | { type: 'sectionAdded'; section: EhrTemplateSection }
  | { type: 'sectionPatched'; sectionId: string; changes: Pick<Partial<EhrTemplateSection>, 'label' | 'description'> }
  | { type: 'sectionMoved'; sectionId: string; direction: 'up' | 'down' }
  | { type: 'sectionRemoved'; sectionId: string }
  | { type: 'fieldAdded'; sectionId: string; field: EmrGeneratedFieldDefinition; placementId: string }
  | { type: 'fieldMoved'; sectionId: string; placementId: string; direction: 'up' | 'down' }
  | { type: 'fieldRemoved'; sectionId: string; placementId: string }
  | { type: 'artifactExportRequested'; format: TemplateArtifactFormat }
  | { type: 'artifactImportRequested'; format: TemplateArtifactFormat; serialized: string }
  | { type: 'importAccepted' }
  | { type: 'saveRequested' };

@Component({ selector: 'emr-template-composer', standalone: true })
export class EmrTemplateComposerComponent {
  readonly model = input.required<EhrTemplateViewModel>();
  readonly readOnly = input<boolean>(false);
  readonly headingId = input<string>('emr-template-composer-heading');
  readonly idPrefix = input<string>('emr-template-composer');
  readonly labels = input<Partial<EmrTemplateComposerLabels>>({});
  readonly intent = output<EhrTemplateIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `EhrTemplateViewModel` (required) | — | Template + field library + section/placement selection + live preview + artifact/import state |
| `readOnly` | `boolean` | `false` | Effective value is `readOnly() \|\| Boolean(model().readOnly)`; `sectionSelected` and `placementSelected` intents pass through when read-only |
| `headingId` | `string` | `'emr-template-composer-heading'` | Accessible heading element id |
| `idPrefix` | `string` | `'emr-template-composer'` | Prefixes generated control ids, including child picker and preview |
| `labels` | `Partial<EmrTemplateComposerLabels>` | `{}` | Optional copy overrides merged with `TEMPLATE_COMPOSER_LABEL_DEFAULTS` |
| `intent` | `output<EhrTemplateIntent>` | — | Typed `EhrTemplateIntent` stream shared with child components |
| `focused` / `blurred` | `output<void>` | — | Emitted on focusin / focusout within the surface |

**Example**
```html
<emr-template-composer [model]="templateViewModel" (intent)="onTemplateIntent($event)" />
```

**Composition** — renders `EmrFieldLibraryPickerComponent` (L6) in its sidebar and `EmrTemplatePreviewComponent` (L6) in its main column; both receive `(intent)="emit($event)"`, sharing `EhrTemplateIntent`.

**Depends on** — `EmrFieldLibraryPickerComponent` (L6), `EmrTemplatePreviewComponent` (L6). Verified: `emr-template-composer -> emr-field-library-picker(L6), emr-template-preview(L6)`.
**Used by** — none in the verified intra-UI import graph (top-level authoring entry point).

---

### EmrTemplatePreview
**Layer** L6 · **Selector** `emr-template-preview` · **Status** stable · **Story** `emr-templates-composer--preview`

**Need** — while composing a template, authors need to see it rendered exactly as a real clinical form would (an actual read-only `EmrClinicalForm` with controller-derived defaults), plus a way to trigger and review controller-produced FHIR/JSON export and paste-in import — kept as a distinct concern from section/field editing so `EmrTemplatePreview` can also render standalone.

**Purpose** — renders `model.preview` (`readOnly: true` enforced by `deriveTemplatePreview()` and renderer props) through `EmrClinicalForm`; separately renders a format picker, an Export button, a serialized-payload textarea usable for both showing export output and pasting import input, an Import button, and — once `model.importIssues` contain no error-severity issue — an explicit "Accept import" button. It never performs the FHIR conversion itself; `artifactExportRequested`/`artifactImportRequested` are dispatched to the controller-supplied `TemplateArtifactPort`, and `model.importIssues` are rendered with `role="alert"`.

**API**
```ts
// ehr-template.models.ts
export interface TemplatePreviewViewModel {
  template: EhrTemplateDefinition;
  preview: ClinicalFormViewModel;
  artifact?: TemplateArtifactResult;
  importIssues?: readonly TemplateArtifactIssue[];
  canAcceptImport?: boolean;
  readOnly?: boolean;
  error?: string;
}

@Component({ selector: 'emr-template-preview', standalone: true })
export class EmrTemplatePreviewComponent {
  readonly model = input.required<TemplatePreviewViewModel>();
  readonly readOnly = input<boolean>(false);
  readonly headingId = input<string>('emr-template-preview-heading');
  readonly idPrefix = input<string>('emr-template-preview');
  readonly labels = input<Partial<EmrTemplatePreviewLabels>>({});
  readonly intent = output<TemplatePreviewIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `TemplatePreviewViewModel` (required) | — | Same structural slice as `EhrTemplateViewModel`; holds `template`, `preview`, `artifact`, `importIssues`, `readOnly`, `error` |
| `readOnly` | `boolean` | `false` | Effective value is `readOnly() \|\| Boolean(model().readOnly)` for import/export controls; clinical form preview is always read-only |
| `headingId` | `string` | `'emr-template-preview-heading'` | Accessible heading element id |
| `idPrefix` | `string` | `'emr-template-preview'` | Prefixes generated artifact control ids and child `emr-clinical-form` `idPrefix` |
| `labels` | `Partial<EmrTemplatePreviewLabels>` | `{}` | Optional copy overrides merged with `TEMPLATE_PREVIEW_LABEL_DEFAULTS` |
| `intent` | `output<TemplatePreviewIntent>` | — | Typed `TemplatePreviewIntent` (`artifactExportRequested` / `artifactImportRequested` / `importAccepted`) |
| `focused` / `blurred` | `output<void>` | — | Emitted on focusin / focusout within the surface |

**Example**
```html
<emr-template-preview [model]="templateViewModel" (intent)="onTemplateIntent($event)" />
```

**Composition** — renders `EmrClinicalFormComponent` (L3) against `{ ...model.preview, readOnly: true }`, with `idPrefix` forwarded so control ids stay unique from any sibling `emr-clinical-form` on the page.

**Depends on** — `EmrClinicalFormComponent` (L3). Verified: `emr-template-preview -> emr-clinical-form(L3)`.
**Used by** — `EmrTemplateComposer` (L6, verified: `emr-template-composer -> emr-template-preview`).

---

### EmrLogicRuleBuilder
**Layer** L6 · **Selector** `emr-logic-rule-builder` · **Status** stable · **Story** `emr-authoring-visual-builders--logic-rule-builder-true`

**Need** — Clinical form authors need a visual way to construct branching logic (`enableWhen`, `requiredWhen`, clinical decision support alerts) without hand-editing nested boolean expressions, while testing how three-valued clinical states (`not-assessed`, `unknown`) propagate through the rule.

**Purpose** — Renders a recursive condition group/predicate tree editor (`all` / `any` / `not` combinators and `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `contains`, `exists`, `empty` operators), target action editor, serialized expression preview, and a 3-valued logic (`true` / `false` / `indeterminate`) test sandbox driven by `EmrLogicRuleBuilderViewModel`. Emits `EmrLogicRuleBuilderIntent`.

**Depends on** — none (L0 tokens only).
**Used by** — none in the verified intra-UI import graph.

---

### EmrScoreBuilder
**Layer** L6 · **Selector** `emr-score-builder` · **Status** stable · **Story** `emr-authoring-visual-builders--score-builder-weighted-osdi`

**Need** — Patient-reported outcome instruments (PHQ-9, GAD-7, OSDI, AUDIT-C) and acute clinical scores (NEWS2, qSOFA, Wells) need a declarative authoring surface for item option weights, calculation formulas, missing-data policies, and severity interpretation bands.

**Purpose** — Renders an authoring workspace driven by `EmrScoreBuilderViewModel` for configuring scoring mode (`sum`, `weighted-sum`, `threshold-count`), minimum answered items, missing-item handling (`require-all`, `prorate-answered`, `treat-missing-as-zero`), weighted item option mappings, severity bands, and a live test calculator preview. Emits `EmrScoreBuilderIntent`.

**Depends on** — none (L0 tokens only).
**Used by** — none in the verified intra-UI import graph.

---

### EmrFhirQuestionnaireMapper
**Layer** L6 · **Selector** `emr-fhir-questionnaire-mapper` · **Status** stable · **Story** `emr-authoring-visual-builders--fhir-questionnaire-mapper-r4`

**Need** — Interoperable health systems must map internal `ClinicalFormSchema` definitions to HL7 FHIR R4 (`4.0.1`) and R5 (`5.0.0`) `Questionnaire` resources with SDC extensions, terminology value sets, and round-trip fidelity checks.

**Purpose** — Renders a side-by-side schema-to-FHIR `linkId` tree, FHIR version switcher (`4.0.1` / `5.0.0`), item type and LOINC/SNOMED/UCUM binding inspector, round-trip validation diagnostics list, and JSON artifact preview driven by `EmrFhirQuestionnaireMapperViewModel`. Emits `EmrFhirQuestionnaireMapperIntent`.

**Depends on** — none (L0 tokens only).
**Used by** — none in the verified intra-UI import graph.

