# L2 — Fields

L2 binds a single `ClinicalFieldDefinition` (from the controller's schema) to a concrete L1 primitive control, and wraps it in the shared label/hint/error frame. L2 has no clinical semantics of its own — it is the mechanical adapter between "here is a field definition and its current state" and "here is a rendered, accessible control." Every schema-driven container above it (L3 `EmrClinicalForm`, `EmrRepeatableGroup`, L4 domain forms, L6 authoring previews) renders fields through this layer rather than talking to L1 primitives directly.

Source: `packages/emr-ui/src/lib/fields/emr-field-frame.component.ts`, `packages/emr-ui/src/lib/fields/emr-typed-field.component.ts`.

---

### EmrFieldFrame
**Layer** L2 · **Selector** `emr-field-frame` · **Status** stable · **Story** none — coverage gap

**Need** — every clinical field, regardless of its underlying control (text input, select, textarea, checkbox…), needs the same accessible label association, the same required-marker treatment, and the same single message slot beneath the control. Duplicating that layout and `aria-describedby` wiring in every field-type branch would drift.

**Purpose** — renders the field's `<label>` (with a visually hidden "Required" announcement when `required()` is true), optional `unit` metadata pill, a content-projection slot (`<ng-content/>`) for the actual control, optional six-state `ClinicalAssessmentStatus` strip (`intent` events), and an `aria-live="polite"` message region that keeps `hint`, `note`, and deduplicated validation messages (`error` / `warning` / `info`) persistently visible. It does NOT hold or validate a value or collapse distinct assessment statuses.

**API**
```ts
@Component({
  selector: 'emr-field-frame',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmrFieldFrameComponent {
  readonly label = input<string>('');
  readonly controlId = input<string>();
  readonly definition = input<ClinicalFieldDefinition>();
  readonly model = input<ClinicalFieldState>();
  readonly required = input(false);
  readonly labelHidden = input(false);
  readonly labelNamesControl = input(true);
  readonly unit = input<string>();
  readonly note = input<string>();
  readonly showMetadata = input(true);
  readonly readOnly = input(false);
  readonly layout = input<'vertical' | 'horizontal' | 'inline'>('vertical');
  readonly assessmentStatus = input<ClinicalAssessmentStatus>();
  readonly assessmentStatusOptions = input<readonly ClinicalAssessmentStatusOption[]>([]);
  readonly hint = input<string>();
  readonly info = input<string>();
  readonly warning = input<string>();
  readonly error = input<string>();
  readonly messages = input<readonly EmrValidationMessage[]>([]);
  readonly intent = output<FieldFrameIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `label` | `string` | `''` | Rendered `<label>` text (falls back to `definition?.label`) |
| `controlId` | `string` | auto-generated | Links `<label for>` and derives `${id}-hint`, `${id}-note`, `${id}-message` |
| `definition` / `model` | `ClinicalFieldDefinition` / `ClinicalFieldState` | `undefined` | Optional schema/state defaults overridden by explicit inputs |
| `required` | `boolean` | `false` | Shows `*` and `emr-sr-only` "Required" announcement |
| `labelHidden` / `labelNamesControl` | `boolean` | `false` / `true` | Visually hides label (`emr-sr-only`) / associates `<label for>` |
| `unit` / `note` / `showMetadata` | `string` / `boolean` | `undefined` / `true` | Unit badge, clinical note, and status strip visibility |
| `layout` | `'vertical' \| 'horizontal' \| 'inline'` | `'vertical'` | Desktop horizontal/inline layout collapsing to vertical at `<=480px` |
| `readOnly` | `boolean` | `false` | Marks read-only and hides interactive assessment-status chips |
| `assessmentStatus` / `assessmentStatusOptions` | `ClinicalAssessmentStatus` / array | `undefined` / `[]` | Six-state assessment status pill & interactive chips |
| `hint` / `info` / `warning` / `error` / `messages` | `string` / `EmrValidationMessage[]` | `undefined` / `[]` | Persistent helper text + deduplicated severity messages (`role="alert"` on error) |
| `intent` (output) | `FieldFrameIntent` | — | `{ type: 'statusChangeRequested', status }` |

**Example**
```html
<emr-field-frame [label]="'Systolic BP'" [controlId]="'bp-sys'" [required]="true" [error]="fieldState.error">
  <input class="emr-control" id="bp-sys" type="number" [attr.aria-describedby]="'bp-sys-message'" />
</emr-field-frame>
```

**Depends on** — none (no component imports; pure template + projected content).
**Used by** — `EmrTypedField` (verified: `emr-typed-field -> emr-field-frame`).

---

### EmrTypedField
**Layer** L2 · **Selector** `emr-typed-field` · **Status** stable · **Story** none — coverage gap

**Need** — a schema-driven form needs one place that turns a `ClinicalFieldDefinition` + its current `ClinicalFieldState` into the right native control (`<input type="number">`, `<select>`, `<textarea>`, a checkbox, a quantity pair…) without every container (`EmrClinicalForm`, `EmrRepeatableGroup`, `EmrFieldGenerator`'s preview) re-implementing that switch.

**Purpose** — renders one control per `EmrValueType` / `ClinicalFieldDefinition.type` (`text`, `multiline`, `integer`, `decimal`, `boolean`, `date`, `time`, `datetime`, `partial-date`, `select`, `multiselect`, `quantity`, `coded`, `scale`, `attachment`, `annotation`, `custom`), wraps it in `EmrFieldFrame`, and delegates unit, layout, metadata, and six-state `ClinicalAssessmentStatus` (`recorded` / `not-assessed` / `unable-to-assess` / `not-applicable` / `declined` / `unknown`) to `EmrFieldFrame`. Emits `valueChange`, `statusChange`, `focused`, and `blurred`. Supports `readOnly`, `labelHidden`, `showMetadata`, and `layout` (`vertical` | `horizontal` | `inline`). No `disabled` prop above L2.

**API**
```ts
// clinical-form.models.ts — real union, quoted verbatim
export type ClinicalFieldType =
  | 'text'
  | 'multiline'
  | 'integer'
  | 'decimal'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'quantity'
  | 'custom';

export interface ClinicalFieldDefinition {
  kind?: 'field';
  id: string;
  label: string;
  type: ClinicalFieldType;
  span?: 3 | 4 | 6 | 8 | 9 | 12;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  unit?: string;
  precision?: number;
  rows?: number;
  options?: readonly ClinicalOption[];
  assessmentStatusOptions?: readonly ClinicalAssessmentStatusOption[];
  customRendererKey?: string;
}

export interface ClinicalFieldState {
  value: ClinicalFieldValue;
  assessmentStatus?: ClinicalAssessmentStatus;
  readOnly?: boolean;
  disabled?: boolean;
  warning?: string;
  error?: string;
}

export type ClinicalFieldValue = string | number | boolean | readonly string[] | ClinicalQuantityValue | null;

@Component({ selector: 'emr-typed-field', standalone: true })
export class EmrTypedFieldComponent {
  @Input({ required: true }) field!: ClinicalFieldDefinition;
  @Input() state?: ClinicalFieldState;
  @Input({ required: true }) controlId!: string;
  @Input() readOnly = false;
  @Input() customTemplates: Readonly<Record<string, TemplateRef<EmrCustomFieldContext>>> = {};
  @Output() readonly valueChange = new EventEmitter<ClinicalFieldValue>();
  @Output() readonly statusChange = new EventEmitter<ClinicalAssessmentStatus | undefined>();
  @Output() readonly focused = new EventEmitter<void>();
}

export interface EmrCustomFieldContext {
  $implicit?: EmrCustomFieldContext;
  field: ClinicalFieldDefinition;
  state?: ClinicalFieldState;
  controlId: string;
}
```

**`ClinicalFieldType` case coverage** — the component's `@switch (field.type)` handles every member of the real, current union:

| case | handled | rendered as |
|---|---|---|
| `text` | yes | `@default` branch → `<input type="text">` |
| `multiline` | yes | `<textarea>` |
| `integer` | yes | `<input type="number" step="1">` |
| `decimal` | yes | `<input type="number">` with `decimalStep()` |
| `date` | yes | `<input type="date">` |
| `select` | yes | `<select>` over `field.options` |
| `multiselect` | yes | `<select multiple>` |
| `boolean` | yes | checkbox |
| `quantity` | yes | number input + unit label, emits `ClinicalQuantityValue` |
| `custom` | yes | looks up `customTemplates[field.customRendererKey]`; renders an "unregistered" status message if absent |

All 10 cases in the real `ClinicalFieldType` union are handled — there is no unhandled case today.

**Known gaps**
- **`EmrFieldGenerator` can author terminology-bound fields that `EmrTypedField` cannot render.** `EmrGeneratedFieldDefinition` (see `field-generator.models.ts`) carries `terminologyBindings: readonly TerminologyBinding[]` — LOINC/SNOMED/ICD/UCUM concept bindings a user attaches in the authoring layer. `ClinicalFieldDefinition`, the type `EmrTypedField` actually consumes, has **no field for terminology bindings at all**. `EmrFieldGeneratorComponent.previewField()` (`authoring/emr-field-generator.component.ts`) demonstrates the boundary directly — it hand-builds a `ClinicalFieldDefinition` from the draft and silently drops `terminologyBindings`, `instructions`, `unitSystem`, `unitCode`, `repeats`, and `tags` in the process. So a field can be fully coded (e.g. bound to a LOINC "question-meaning" concept and a SNOMED "answer-value-set") in the authoring layer, and `EmrTypedField` will still render it as a bare `<select>`/`<input>` with no visual or programmatic indication that a terminology binding exists. This is a genuine authoring→capture contract gap, not a missing switch case.

**Composition** — renders `EmrFieldFrameComponent` (same layer, L2) around whichever native control the `field.type` switch selects; when `field.type === 'custom'`, projects a consumer-supplied `TemplateRef` via `NgTemplateOutlet` instead of owning any custom rendering itself. It renders no other clinical component, which is why L2 has no cross-layer composition graph of its own.

**Depends on** — `EmrFieldFrameComponent` (L2, same layer).
**Used by** — `EmrRepeatableGroup` (L3), `EmrClinicalForm` (L3), `EmrFieldGenerator` (L6, for its live preview) — all verified in the import graph.

---

### EmrCodedInput
**Layer** L2 · **Selector** `emr-coded-input` · **Status** stable · **Story** `emr-fields-coded-input--single`

**Need** — A coded answer (diagnosis, observation, procedure) must be captured as a real concept (system, code, display), not free text, and the clinician must be able to see which terminology each chosen concept comes from. `docs/field-contract.md` names this component as the consumer of the `answer-value-set` terminology binding.

**Purpose** — Renders one coded field: the chosen concepts as chips, each with the display name and the code system name and code as text ("SNOMED CT 77075001", "ICD-10 H40.11", "LOINC 56844-4"), a 44px "Remove <display>" button per chip, and a search box built on `EmrSearchSelect` inside an `EmrFieldFrame`. Typing, search, open/close, choosing a result and removing a chip are emitted as intents; the search intent carries the contract's `answer-value-set` `valueSetCanonical`. Single or multiple follows `cardinality.max` through the shape of `value` (one concept, or a list). An optional assessment-status select (`presentation.assessmentStatusOptions`) emits `statusChangeRequested`, and the six no-value states keep their own badge. Validation messages are shown with a text prefix (Error / Warning / Note) and linked to the control with `aria-describedby`. The controller owns terminology lookup, paging, debouncing, edition and version, synonym matching and all validation including binding strength; the UI never calls a port and never filters or reorders `options`. A read-only field with no value shows "Not supplied".

**API**
```ts
export interface CodedInputViewModel {
  readonly definition: EmrFieldDefinition;
  readonly value: EmrCodedValue | readonly EmrCodedValue[] | null;
  readonly status?: ClinicalAssessmentStatus;
  readonly query: string; readonly options: readonly EmrCodedValue[];
  readonly open: boolean; readonly loading: boolean;
  readonly messages: readonly EmrValidationMessage[];
  readonly readOnly?: boolean; readonly emptyMessage: string;
  readonly systemLabels?: Readonly<Record<string, string>>;   // system URI -> "SNOMED CT"
}
export type CodedInputIntent =
  | { type: 'queryChangeRequested'; query: string }
  | { type: 'searchRequested'; query: string; valueSetCanonical?: string }
  | { type: 'openRequested' } | { type: 'closeRequested' }
  | { type: 'conceptSelected'; concept: EmrCodedValue }
  | { type: 'conceptRemoveRequested'; code: string; system: string }
  | { type: 'statusChangeRequested'; status: ClinicalAssessmentStatus | undefined };

export class EmrCodedInputComponent {
  readonly model = input.required<CodedInputViewModel>();
  readonly headingId = input<string>();
  readonly controlId = input<string>();
  readonly labelHidden = input(false);
  readonly readOnly = input(false);
  readonly intent = output<CodedInputIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `CodedInputViewModel` (required) | — | field definition, value, query, results, status and messages, all supplied by the controller |
| `headingId` | `string` | field label | id of an external heading; when set it names the group via `aria-labelledby` |
| `controlId` | `string` | auto-generated | DOM id for combobox input, `${id}-listbox`, and `${id}-message` |
| `labelHidden` | `boolean` | `false` | hides visual `<label>` while preserving accessible name |
| `readOnly` | `boolean` | `false` | locks chips/search/status without setting `disabled`; shows `"Not supplied"` when empty |
| `intent` (output) | `OutputEmitterRef<CodedInputIntent>` | — | the seven intents above |

**Example**
```html
<emr-coded-input [model]="diagnosisModel" (intent)="onDiagnosisIntent($event)" />
```

**Known gaps**
- API deviation: it is L2 but takes `model` and a single `intent`, because it has a multi-action surface (query, search, selection, removal, status) that does not fit a single `valueChange`.
- `systemLabels` is an addition to the spec's view model: `EmrCodedValue.system` is a URI, and the UI must not map URIs to names, so the controller supplies the names. An unmapped system is shown as its raw URI.
- The results list is the `EmrSearchSelect` panel: results are keyed by system and code, and the panel's own empty state is replaced by a status line below the input when there are no results, because an empty `role="listbox"` fails axe `aria-required-children`.
- No terminology lookup, paging, debouncing, synonym matching, edition/version handling or binding-strength validation (all controller).
- Chips show the display name given in the value; a concept version (`EmrCodedValue.version`) is not displayed.

**Depends on** — `EmrFieldFrameComponent`, `EmrSearchSelectComponent`.

**Used by** — none yet (intended for `EmrTypedField` coded fields with a `search` widget and for diagnosis and observation capture).

---

### EmrAttestation
**Layer** L2 · **Selector** `emr-attestation` · **Status** stable · **Story** `EMR / Capture / Attestation`

**Need** - signing, witnessing and co-signing recur across inpatient records (MAR witness, transfusion two-person check, swab counts, controlled drugs, consent, discharge sign-off). The status bar and staged checklist each carried a private version.

**Purpose** - renders the caller-supplied attestation statement, one row per `CaptureSignatory` (name, role, status badge, signed-at label or "Not supplied") and Sign / Amend buttons (`>=44px`) shown only when `canSign` / `canAmend` and not `readOnly`. When `readOnly` and unsigned (and no `error`), displays `"Not completed."` and keeps signatory names non-interactive. Zero `disabled` above L2; action buttons are hidden in print.

**API**
```ts
export class EmrAttestationComponent {
  readonly model = input.required<AttestationViewModel>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly readOnly = input(false);
  readonly intent = output<AttestationIntent>();
}
// AttestationIntent = signRequested(signatoryId?) | amendRequested | signatorySelected(signatoryId)
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `AttestationViewModel` (required) | - | title, statement, signatories, canSign, signLabel, canAmend, amendLabel, readOnly, error |
| `controlId` | `string` | generated | DOM id of the `<section>` region and prefix for `${id}-error` |
| `headingId` | `string` | `${controlId}-title` | id of the title heading, used for `aria-labelledby` |
| `readOnly` | `boolean` | `false` | hides Sign/Amend buttons, makes signatory names non-interactive, shows `"Not completed."` when unsigned |

**Example**
```html
<emr-attestation [model]="witnessModel" (intent)="onAttest($event)" />
```

**Depends on** - none. **Used by** - none yet (status bar and staged checklist not retrofitted).

---

### EmrScheduleSlotPicker
**Layer** L2 · **Selector** `emr-schedule-slot-picker` · **Status** stable · **Story** `emr-medications-slot-picker--four-slots-empty`

**Need** — a drug order composer must capture *when* and *how much* a medicine is taken as structured `DoseSlot[]`, the same shape `EmrDoseSchedule` renders, rather than a free-text frequency that the patient-facing card would have to parse.

**Purpose** — renders a `<fieldset>`/`<legend>` group with one checkbox per controller-supplied slot (four standard slots, hourly slots, or a single PRN slot). A ticked slot shows an amount control: a number input (`amountMode: 'numeric'`, with `unitLabel` beside it) or a text input (`amountMode: 'label'`, e.g. "thin layer"). Optional preset buttons tick a fixed set of slot ids and replace the selection; slots already ticked keep their amount, new ones start at `defaultAmount` / `defaultAmountLabel`. The button whose slot ids equal the current selection shows `aria-pressed="true"` and a check icon. Every change emits a new immutable `DoseSlot[]` in `slots` order through `valueChange`; unticked slots are omitted, and an emptied amount becomes `amount: null` with the slot still ticked. It does NOT derive frequency text or codes, totals, durations or tapers, does NOT validate amounts (no clinical bounds), and does NOT pluralise units — the controller does all of that from the emitted value. Value building lives in the controller as pure functions (`toggleSlot`, `setSlotAmount`, `applySlotPreset`, `isPresetActive`, `formatSlotReadout`). Read-only renders each slot as text ("1 tablets" uses the supplied `unitLabel` verbatim; "Not selected" otherwise).

**API**
```ts
// schedule-slot.models.ts
export interface ScheduleSlotDefinition { id: string; label: string; timeHint?: string }
export interface ScheduleSlotPreset { id: string; label: string; slotIds: readonly string[] }
export type ScheduleAmountMode = 'numeric' | 'label';
export type ScheduleSlotSeed = Pick<DoseSlot, 'amount' | 'amountLabel'>;
export const toggleSlot: (value, slots, slotId, checked, seed) => DoseSlot[];
export const setSlotAmount: (value, slots, slotId, amounts: ScheduleSlotSeed) => DoseSlot[];
export const applySlotPreset: (value, slots, preset, seed) => DoseSlot[];

export class EmrScheduleSlotPickerComponent {
  readonly controlId = input<string>();
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly required = input(false);
  readonly readOnly = input(false);
  readonly value = input<readonly DoseSlot[] | null>(null);
  readonly slots = input.required<readonly ScheduleSlotDefinition[]>();
  readonly unitLabel = input<string>();
  readonly amountMode = input<ScheduleAmountMode>('numeric');
  readonly presets = input<readonly ScheduleSlotPreset[]>([]);
  readonly defaultAmount = input(1);
  readonly defaultAmountLabel = input('');
  readonly valueChange = output<readonly DoseSlot[]>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `controlId` | `string` | generated | id of the fieldset; checkboxes are `{controlId}-{slot.id}`, amounts `{controlId}-{slot.id}-amount`, hint `{controlId}-hint`, error `{controlId}-error` |
| `label` | `string` (required) | — | legend text |
| `hint` / `error` | `string` | — | rendered below the grid (`{controlId}-hint` and `role="alert"` `{controlId}-error` with `"Error:"` prefix); both can show simultaneously |
| `required` | `boolean` | `false` | `*`, `aria-required="true"`, and screen-reader "Required"; the controller decides whether an empty value is an error |
| `readOnly` | `boolean` | `false` | renders text, no controls, no presets |
| `value` | `readonly DoseSlot[] \| null` | `null` | ticked slots; ids not in `slots` are ignored |
| `slots` | `readonly ScheduleSlotDefinition[]` (required) | — | available slots, in display and emission order |
| `unitLabel` | `string` | — | shown after numeric amounts and in the amount's accessible name |
| `amountMode` | `'numeric' \| 'label'` | `'numeric'` | edits `amount` or `amountLabel` |
| `presets` | `readonly ScheduleSlotPreset[]` | `[]` | buttons above the grid |
| `defaultAmount` | `number` | `1` | starting amount for a newly ticked slot (numeric) |
| `defaultAmountLabel` | `string` | `''` | starting text for a newly ticked slot (label) |
| `valueChange` (output) | `readonly DoseSlot[]` | — | `[(value)]` partner |

**Example**
```html
<emr-schedule-slot-picker controlId="rx-slots" label="When to take" [slots]="slots" [presets]="presets"
  unitLabel="tablets" [(value)]="doseSlots" />
<emr-dose-schedule [model]="scheduleModelFrom(doseSlots)" />
```

**Known gaps**
- `defaultAmountLabel` is an addition to the brief: `EmrDoseSchedule` shows a slot with `amount: null` and an empty `amountLabel` as "none", so label mode needs a starting text to read as ticked.
- `valueChange` emits `readonly DoseSlot[]` (an empty array when nothing is ticked), never `null`.
- Presets are not a `role="toolbar"` with arrow-key roving focus; they are a labelled group of tab-stop buttons.
- Numeric amounts accept any non-negative decimal; fractions are typed as decimals (0.5) and `EmrDoseSchedule` formats them.

**Depends on** — none (no component imports). Value building: `toggleSlot`, `setSlotAmount`, `applySlotPreset` from `@drguptavivek/emr-controller`.
**Used by** — none yet (intended for the drug order composer, paired with `EmrDoseSchedule` as its preview).


---

### EmrIdentifierEntry
**Layer** L2 · **Selector** `emr-identifier-entry` · **Status** stable · **Story** `emr-identity--entry-type-picker`

**Need** — Patient IDs and cards are scanned or typed, and the field must show what the app understood without owning any format rule.

**Purpose** — renders an `IdentifierEntryView` in `emr-field-frame` (simultaneous error, warning, hint, and structured `messages`): a text input (`autocapitalize="characters"`, `autocomplete="off"`, `spellcheck="false"`, `aria-invalid` on error, `aria-required` on required), an optional clear button (`clearable`), a Scan button with monochrome `scanner` SVG (hidden when `readOnly`), the app's `normalisedValue` with a monochrome `check` SVG beneath, and accessible `role="radiogroup"` chips for `typeOptions` (roving `tabindex`, arrow/Home/End keys, no HTML `disabled` attribute). It never normalises or validates. Deliberate shape: typing, scan, type selection, clear, submit, focus, and blur are folded into the single `intent` output (`valueChanged`, `scanRequested`, `typeSelected`, `cleared`, `submitted`, `focused`, `blurred`), so there is no separate `valueChange` output.

**API**
```ts
export type EmrIdentifierEntryEvent = IdentifierEntryIntent;
export class EmrIdentifierEntryComponent {
  readonly model = input.required<IdentifierEntryView>();
  readonly controlId = input<string>(/* generated */);
  readonly readOnly = input<boolean>(false);
  readonly labels = input<Partial<EmrIdentifierEntryLabels>>({});
  readonly intent = output<EmrIdentifierEntryEvent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `IdentifierEntryView` (required) | — | label, value, normalisedValue, error, warning, hint, readOnly, required, placeholder, clearable, maxLength, typeOptions, selectedType, messages |
| `controlId` | `string` | generated | id of the input |
| `readOnly` | `boolean` | `false` | effective read-only (`readOnly \|\| model.readOnly`), keeps focus without `disabled` |
| `labels` | `Partial<EmrIdentifierEntryLabels>` | English | scan, identifierType, normalised, clear |
| `intent` (output) | `EmrIdentifierEntryEvent` | — | valueChanged, scanRequested, typeSelected, cleared, submitted, focused, blurred |

**Example**
```html
<emr-identifier-entry [model]="entry" (intent)="onEntry($event)" />
```

**Depends on** — `EmrFieldFrameComponent`.

**Used by** — `EmrLinkCardsComponent`.

---

### EmrScaleField
**Layer** L2 · **Selector** `emr-scale-field` · **Status** stable · **Story** `emr-fields-clinical-building-blocks--scales-and-dates`

**Need** — Ordinal and visual-analogue clinical scales (`EmrValueType = 'scale'`, e.g., NRS pain 0–10, PHQ-9 item, EQ-5D VAS) need a schema-bound L2 field combining `EmrFieldFrame`, `EmrLikert` or `EmrVas`, validation messages, and six-state `ClinicalAssessmentStatus` capture.

**Purpose** — Renders `ScaleFieldViewModel` inside `EmrFieldFrame`, switching between `EmrLikert` and `EmrVas` per `variant` / `definition.presentation.widget`, displaying controller-supplied `tone`, `optionTones`, and `messages`, and emitting `ScaleFieldIntent` (`valueChangeRequested`, `statusChangeRequested`) plus focus lifecycle (`focused`, `blurred`).

**API**
```ts
export class EmrScaleFieldComponent {
  readonly model = input.required<ScaleFieldViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false);
  readonly layout = input<FieldFrameLayout>('vertical');
  readonly showMetadata = input(true);
  readonly readOnly = input(false);
  readonly intent = output<ScaleFieldIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `ScaleFieldViewModel` (required) | — | label, variant (`likert` \| `vas`), value, min, max, step, anchors, optionTones, tone, status, statusOptions, hint, messages, required, readOnly, unit, clearable |
| `definition` | `EmrFieldDefinition` | — | optional contract definition fallback |
| `controlId` | `string` | generated | id prefix (`{controlId}-control` for inner L1, `{controlId}-label`, `{controlId}-message`) |
| `headingId` | `string` | — | optional external heading/label id |
| `labelHidden` | `boolean` | `false` | hides visual outer label while preserving assistive text |
| `layout` | `'vertical' \| 'horizontal' \| 'inline'` | `'vertical'` | forwarded to `EmrFieldFrame` |
| `showMetadata` | `boolean` | `true` | controls unit badge & assessment status strip |
| `readOnly` | `boolean` | `false` | effective lock (`readOnly \|\| model.readOnly \|\| definition.contract.readOnly`) |
| `intent` (output) | `ScaleFieldIntent` | — | `valueChangeRequested`, `statusChangeRequested` |

**Example**
```html
<emr-scale-field [model]="painScale" (intent)="onScaleIntent($event)" />
```

**Depends on** — `EmrFieldFrameComponent`, `EmrLikertComponent`, `EmrVasComponent`.

---

### EmrPartialDateField
**Layer** L2 · **Selector** `emr-partial-date-field` · **Status** stable · **Story** `emr-fields-clinical-building-blocks--scales-and-dates`

**Need** — Historical clinical dates (symptom onset `"2019"`, childhood surgery `"2024-06"`, exact event `"2026-03-15"`) frequently have unknown day or month (`EmrValueType = 'partial-date'`).

**Purpose** — Renders a segmented precision selector (`Year` / `Year & month` / `Full date`) and date input inside `EmrFieldFrame` with optional six-state `ClinicalAssessmentStatus` capture, emitting `PartialDateFieldIntent` (`precisionChangeRequested`, `valueChangeRequested`, `statusChangeRequested`). Switching from finer to coarser precision truncates the ISO prefix (`2025-11-14` -> `2025-11` -> `2025`); switching from coarser to finer clears to `null` instead of fabricating `-01` / `-01-01`.

**API**
```ts
export class EmrPartialDateFieldComponent {
  readonly model = input.required<PartialDateFieldViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false);
  readonly layout = input<FieldFrameLayout>('vertical');
  readonly showMetadata = input(true);
  readonly readOnly = input(false);
  readonly defaultPrecision = input<EmrPartialDate['precision']>('day');
  readonly clearable = input(true);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly intent = output<PartialDateFieldIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `PartialDateFieldViewModel` (required) | — | label, value (`EmrPartialDate \| null`), min, max, displayFormat, defaultPrecision, clearable, size, status, statusOptions, hint, messages, required, readOnly |
| `definition` | `EmrFieldDefinition` | — | optional contract definition fallback |
| `controlId` | `string` | generated | id prefix (`{controlId}-precision`, `{controlId}-control`, `{controlId}-label`, `{controlId}-message`) |
| `headingId` | `string` | — | optional external heading/label id |
| `labelHidden` | `boolean` | `false` | hides visual outer label while preserving assistive text |
| `layout` | `'vertical' \| 'horizontal' \| 'inline'` | `'vertical'` | forwarded to `EmrFieldFrame` |
| `showMetadata` | `boolean` | `true` | controls assessment status strip visibility |
| `readOnly` | `boolean` | `false` | effective lock (`readOnly \|\| model.readOnly \|\| definition.contract.readOnly`) |
| `defaultPrecision` | `'year' \| 'month' \| 'day'` | `'day'` | fallback precision when `value === null` |
| `clearable` | `boolean` | `true` | shows Clear button when `value !== null && !readOnly` |
| `intent` (output) | `PartialDateFieldIntent` | — | `precisionChangeRequested`, `valueChangeRequested`, `statusChangeRequested` |

**Example**
```html
<emr-partial-date-field [model]="onsetDate" (intent)="onPartialDateIntent($event)" />
```

**Depends on** — `EmrFieldFrameComponent`, `EmrSegmentedControlComponent`, `EmrDateInputComponent`.

---

### EmrAttachmentField
**Layer** L2 · **Selector** `emr-attachment-field` · **Status** stable · **Story** `emr-fields-clinical-building-blocks--attachments-and-signatures`

**Need** — External clinical documents, consent scans, and ophthalmic imaging attachments (`EmrValueType = 'attachment'`) need an L2 field binding `EmrAttachmentRef` list state, file selection, and remove/open intents.

**Purpose** — Renders an `EmrAttachmentRef[]` list above an `EmrFileTrigger` (plus optional `Camera` and `Scanner` triggers) inside `EmrFieldFrame`, delegating six-state `ClinicalAssessmentStatus` to `EmrFieldFrame` and emitting `AttachmentFieldIntent` (`filesSelected`, `captureRequested`, `itemSelected`, `itemRemoveRequested`, `statusChangeRequested`) plus `nativeFilesSelected` on Web. Performs zero network upload or storage I/O.

**API**
```ts
export class EmrAttachmentFieldComponent {
  readonly model = input.required<AttachmentFieldViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false);
  readonly layout = input<FieldFrameLayout>();
  readonly showMetadata = input(true);
  readonly readOnly = input(false);
  readonly intent = output<AttachmentFieldIntent>();
  readonly nativeFilesSelected = output<readonly File[]>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `AttachmentFieldViewModel` (required) | — | label, items, accept, multiple, maxItems, allowCamera, status, statusOptions, hint, messages, required, readOnly, layout, showMetadata |
| `definition` | `EmrFieldDefinition` | — | optional contract definition fallback |
| `controlId` | `string` | generated | id prefix (`{controlId}-trigger` for file trigger, `{controlId}-label`, `{controlId}-message`) |
| `headingId` | `string` | — | optional external heading/label id |
| `labelHidden` | `boolean` | `false` | hides visual outer label while preserving assistive text |
| `layout` | `'vertical' \| 'horizontal' \| 'inline'` | `'vertical'` | forwarded to `EmrFieldFrame` |
| `showMetadata` | `boolean` | `true` | controls assessment status strip visibility |
| `readOnly` | `boolean` | `false` | effective lock (`readOnly \|\| model.readOnly \|\| definition.contract.readOnly`); keeps `itemSelected` active |
| `intent` (output) | `AttachmentFieldIntent` | — | `filesSelected`, `captureRequested`, `itemSelected`, `itemRemoveRequested`, `statusChangeRequested` |
| `nativeFilesSelected` (output) | `readonly File[]` | — | Web File[] escape hatch |

**Example**
```html
<emr-attachment-field [model]="attachments" (intent)="onAttachmentIntent($event)" />
```

**Depends on** — `EmrFieldFrameComponent`, `EmrFileTriggerComponent`, `EmrBadgeComponent`.

---

### EmrPairedField
**Layer** L2 · **Selector** `emr-paired-field` · **Status** stable · **Story** `emr-fields-clinical-building-blocks--paired-and-measurements`

**Need** — Paired clinical measurements (systolic/diastolic BP `128/78 mmHg`, OD/OS IOP `16/18 mmHg`, cup-to-disc ratio `0.4/0.5`, and visual acuity pairs) require a field-framed two-slot control with independent per-side modes, numeric constraints, per-side validation targeting, inline unit display, clear action, and six-state `ClinicalAssessmentStatus` capture.

**Purpose** — Renders `PairedFieldViewModel` (`firstLabel`, `secondLabel`, `mode`, `firstMode`, `secondMode`, `separator`, `unit`, `value`, `min`/`max`/`step`/`precision`/`maxLength` per side, `clearable`, `showSteppers`, `size`, `status`, `statusOptions`, `messages`) inside `EmrFieldFrame`, delegating label, hint, validation messages, and six-state assessment status strip to `EmrFieldFrame` while rendering `unit` inline after the second input and routing `EmrValidationMessage.path` (`'first'` / `'second'` / root) to per-side `aria-invalid` and warning border states. Emits `PairedFieldIntent` (`firstChangeRequested`, `secondChangeRequested`, `clearRequested`, `statusChangeRequested`) plus `focused` and `blurred` lifecycle events without silently dropping or clamping out-of-range typed numbers.

**API**
```ts
export class EmrPairedFieldComponent {
  readonly model = input.required<PairedFieldViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false);
  readonly layout = input<FieldFrameLayout>();
  readonly showMetadata = input(true);
  readonly readOnly = input(false);
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly clearable = input<boolean | undefined>();
  readonly intent = output<PairedFieldIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `PairedFieldViewModel` (required) | — | label, firstLabel, secondLabel, mode (`text` \| `decimal` \| `integer`), firstMode, secondMode, value, separator, unit, min/max/step/precision/maxLength (shared & per-side), required/firstRequired/secondRequired, readOnly/firstReadOnly/secondReadOnly, clearable, showSteppers, size, layout, showMetadata, status, statusOptions, hint, messages |
| `definition` | `EmrFieldDefinition` | — | optional contract definition fallback (label, unitDisplay, readOnly, cardinality, valueType) |
| `controlId` | `string` | generated | id prefix (`{controlId}-first`, `{controlId}-second`, `{controlId}-label`, `{controlId}-message`) |
| `headingId` | `string` | — | optional external heading/label id for group `aria-labelledby` |
| `labelHidden` | `boolean` | `false` | hides visual outer label while preserving assistive text |
| `layout` | `'vertical' \| 'horizontal' \| 'inline'` | `'vertical'` | forwarded to `EmrFieldFrame` |
| `showMetadata` | `boolean` | `true` | controls assessment status strip visibility |
| `readOnly` | `boolean` | `false` | effective lock (`readOnly \|\| model.readOnly \|\| definition.contract.readOnly`) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | `44px` minimum target (`48px` for `lg`) |
| `clearable` | `boolean` | `false` | shows 44x44 Clear button emitting `clearRequested` when populated and unlocked |
| `intent` (output) | `PairedFieldIntent` | — | `firstChangeRequested`, `secondChangeRequested`, `clearRequested`, `statusChangeRequested` |
| `focused` / `blurred` (outputs) | `void` | — | input focus/blur lifecycle |

**Example**
```html
<emr-paired-field [model]="sittingBp" (intent)="onPairedIntent($event)" />
```

**Depends on** — `EmrFieldFrameComponent`.
**Used by** — vitals and bilateral clinical capture forms.

---

### EmrDurationInput
**Layer** L2 · **Selector** `emr-duration-input` · **Status** stable · **Story** `emr-fields-clinical-building-blocks--paired-and-measurements`

**Need** — Symptom duration (`3 weeks`), prescription course length (`7 days`), follow-up interval (`6 months`), and fasting duration (`8 hours`) require structured `{ amount, unit }` capture without silently converting between calendar/time units.

**Purpose** — Renders a numeric amount input (with `-`/`+` steppers, decimal-comma normalization, and non-negative enforcement when `min >= 0`) paired with a UCUM unit selector (`unitOptions`) and optional Clear button inside `EmrFieldFrame`, delegating outer label, required mark, `hint`/`warning`/`error`/`messages`, `layout`, `showMetadata`, and six-state `ClinicalAssessmentStatus` strip to the frame while emitting `DurationFieldIntent` (`amountChangeRequested`, `unitChangeRequested`, `clearRequested`, `statusChangeRequested`).

**Signature**
```ts
export class EmrDurationInputComponent {
  readonly model = input.required<DurationFieldViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false);
  readonly layout = input<FieldFrameLayout>();
  readonly showMetadata = input(true);
  readonly readOnly = input(false);
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly clearable = input<boolean | undefined>();
  readonly showSteppers = input<boolean | undefined>();
  readonly mode = input<EmrQuantityNumericMode>();
  readonly precision = input<number>();
  readonly placeholder = input<string>();
  readonly unitPlaceholder = input<string>();
  readonly hint = input<string>();
  readonly warning = input<string>();
  readonly error = input<string>();
  readonly intent = output<DurationFieldIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
  readonly cleared = output<void>();
  readonly submitted = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `DurationFieldViewModel` (required) | — | `label`, `value` (`{ amount, unit } \| null`), `unitOptions`, `min` (defaults to `0`), `max`, `step`, `mode`, `precision`, `placeholder`, `unitPlaceholder`, `unitLabel`, `showSteppers`, `clearable`, `size`, `layout`, `showMetadata`, `labelHidden`, `status`, `statusOptions`, `hint`, `messages`, `required`, `readOnly`, `definition` |
| `definition` | `EmrFieldDefinition` | — | optional contract definition fallback (`label`, `hint`, `placeholder`, `min`, `max`, `step`, `precision`, `cardinality`, `valueType`, `readOnly`) |
| `controlId` | `string` | generated | id prefix (`{controlId}-value`, `{controlId}-unit`, `{controlId}-label`, `{controlId}-message`) |
| `headingId` | `string` | — | optional external heading/label id for group `aria-labelledby` |
| `labelHidden` | `boolean` | `false` | hides visual outer label while preserving assistive text |
| `layout` | `'vertical' \| 'horizontal' \| 'inline'` | `'vertical'` | forwarded to `EmrFieldFrame` |
| `showMetadata` | `boolean` | `true` | controls six-state `ClinicalAssessmentStatus` strip visibility |
| `readOnly` | `boolean` | `false` | effective lock (`readOnly \|\| model.readOnly \|\| definition.contract.readOnly`) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | `44px` minimum touch target (`48px` for `lg`) |
| `clearable` | `boolean` | `false` | shows `44x44` (`48x48` `lg`) monochrome Clear button emitting `clearRequested` + `cleared` when populated and unlocked |
| `showSteppers` | `boolean` | `true` | renders `-`/`+` stepper buttons (`>=44px`) around the amount input |
| `mode` / `precision` | `'decimal' \| 'integer'` / `number` | derived | `mode` defaults from `precision === 0` or `definition.contract.valueType === 'integer'` else `'decimal'` |
| `placeholder` / `unitPlaceholder` | `string` | `''` / `'Unit'` | placeholders for amount input and unselected unit dropdown (`value === null`) |
| `hint` / `warning` / `error` | `string` | — | field-level message overrides forwarded to `EmrFieldFrame` and part validation |
| `intent` (output) | `DurationFieldIntent` | — | `amountChangeRequested`, `unitChangeRequested`, `clearRequested`, `statusChangeRequested` |
| `focused` / `blurred` / `cleared` / `submitted` (outputs) | `void` | — | group-boundary focus/blur, clear confirmation, and Enter submit lifecycle |

**Per-part Validation** — `EmrValidationMessage.path` ending in `'amount'` or `'value'` marks only the amount input `aria-invalid` / `data-warning`; paths ending in `'unit'` mark only the unit selector; root/un-scoped messages mark both parts. Per-side warnings are suppressed whenever that side has an error.

**Example**
```html
<emr-duration-input [model]="steroidCourse" (intent)="onDurationIntent($event)" />
```

**Depends on** — `EmrFieldFrameComponent`, `EmrQuantityInputComponent`.
**Used by** — history, prescribing, and follow-up scheduling forms.

---

### EmrRangeField
**Layer** L2 · **Selector** `emr-range-field` · **Status** stable · **Story** `emr-fields-clinical-building-blocks--paired-and-measurements`

**Need** — Target therapeutic ranges (`SpO2 94–98 %`, PRN dose range `5–10 mg`, target IOP `10–14 mmHg`), date intervals (`2026-10-01` – `2026-10-14`), clinic time windows (`08:00` – `17:30`), and UTC/local datetime intervals require structured `{ low, high }` entry with non-clamping input so inverted or out-of-range bounds trigger controller validation.

**Purpose** — Renders `low`/`high` (or `from`/`to`) controls for `kind: 'number' | 'date' | 'time' | 'datetime'` inside `EmrFieldFrame` with header `unit` badge, optional `showSteppers` in numeric mode, `44px` (`48px` `lg`) monochrome SVG clear button (`clearRequested`), per-side error/warning states (`lowError`, `highError`, `lowWarning`, `highWarning`, or `EmrValidationMessage.path` ending in `'low'`/`'high'`), and 6-state `ClinicalAssessmentStatus` support (`statusChangeRequested`), emitting `RangeFieldIntent`.

**Depends on** — `EmrFieldFrameComponent`, `EmrDateInputComponent`, `EmrTimeInputComponent`, `EmrDateTimeInputComponent`.
**Used by** — order parameters, nursing targets, clinic scheduling windows, and reference-range authoring.

---

### EmrSignatureCaptureField
**Layer** L2 · **Selector** `emr-signature-capture-field` · **Status** stable · **Story** `emr-fields-clinical-building-blocks--attachments-and-signatures`

**Need** — Informed consent, surgical marking sign-off, witness attestation, and optical dispensing receipt require pointer-captured vector signature capture with signatory attribution and undo/clear controls.

**Purpose** — Renders a pointer-captured SVG stroke pad (and scaled vector ink segments on native) inside `EmrFieldFrame` (`420×140` default `viewBox` with uniform `xMidYMid meet` CTM inverse coordinate mapping), supporting single-point dots, dashed signature baseline, empty-state prompt overlay, keyboard undo (`Ctrl/Meta+Z`) and clear (`Delete`/`Backspace`), six-state `ClinicalAssessmentStatus`, and attribution footer (`signatoryName · signatoryRole · signedAt`), emitting `SignatureCaptureIntent` (`strokeAdded`, `undoRequested`, `clearRequested`, `statusChangeRequested`).

**Depends on** — `EmrFieldFrameComponent`.
**Used by** — `EmrTypedFieldComponent` (`signature` widget) and consent workflows.

---

### EmrPhoneInput
**Layer** L2 · **Selector** `emr-phone-input` · **Status** stable · **Story** `emr-fields-clinical-building-blocks--demographics-and-macros`

**Need** — Patient registration, emergency contacts, and referring-clinician directories need structured FHIR `ContactPoint` phone capture (country dial code, national number, optional extension, verification badge, and messaging channels) without hardcoding national numbering plans or validation rules in UI code.

**Purpose** — Renders a country code `<emr-select>` (`EmrPhoneCountryOption[]`), `type="tel"` national number input with leading monochrome `phone` icon, optional extension input (`isPhoneExtensionVisible`), Clear button (`hasPhoneClearableValue`), inline verified `EmrBadge`, controller-supplied `formattedPreview`, and 44px messaging channel checkbox pills (`EmrPhoneChannelOption[]`, `'voice' | 'sms' | 'whatsapp'`) inside `EmrFieldFrame` with per-part validation (`resolvePhonePartValidation`), size (`sm` | `md` | `lg`), layout, and six-state clinical assessment status. Emits `PhoneFieldIntent` (`countryCodeChangeRequested`, `numberChangeRequested`, `extensionChangeRequested`, `channelToggleRequested`, `clearRequested`, `statusChangeRequested`) plus `focused`, `blurred`, and `submitted`.

**Depends on** — `EmrFieldFrameComponent`, `EmrSelectComponent`, `EmrBadgeComponent`.
**Used by** — registration, emergency contact, and telehealth directory forms.

---

### EmrAddressField
**Layer** L2 · **Selector** `emr-address-field` · **Status** stable · **Story** `emr-fields-clinical-building-blocks--demographics-and-macros`

**Need** — Patient demographics, ABHA KYC, pharmacy destinations, and referral addresses require structured multi-part FHIR `Address` capture (`use`, `line1`, `line2`, `city`, `district`, `state`, `postalCode`, `country`) with regional option lists, per-part `EmrNodePath` validation, and six-state clinical assessment status without embedding jurisdictional address rules in UI code.

**Purpose** — Renders an optional address-use `EmrSegmentedControl` (`DEFAULT_ADDRESS_USE_OPTIONS` fallback when `use` is set without `useOptions`), an optional `44px` monochrome `close` Clear button (`hasAnyAddressValue`), and all seven `EmrAddressValue` subfields (`line1`, `line2`, `city`, `district`, `state`, `postalCode`, `country`) in a responsive 2-column grid (collapsing to 1 column at `<= 640px` on web / `< 520px` in React Native) inside `EmrFieldFrame`. Supports `<emr-select>` for option-backed `stateOptions` and `countryOptions`, WCAG 1.3.5 `autocomplete` tokens, `autocapitalize="characters"` and `tabular-nums` on `postalCode`, configurable `labels`, `placeholders`, `maxLengths`, and `requiredParts` (`DEFAULT_ADDRESS_REQUIRED_PARTS`), per-part `EmrNodePath` validation (`resolveAddressPartValidation`, `resolveAddressRootMessages`, `isAddressPartInvalid` — ensuring optional `line2` and `district` are never marked invalid by blanket root errors unless explicitly targeted), `layout`, `showMetadata`, `readOnly`, and six-state `ClinicalAssessmentStatus`. Emits `AddressFieldIntent` (`fieldChangeRequested`, `useChangeRequested`, `statusChangeRequested`, `cleared`) plus group-scoped `focused` and `blurred`.

**Depends on** — `EmrFieldFrameComponent`, `EmrSegmentedControlComponent`, `EmrSelectComponent`.
**Used by** — registration, billing, ABHA KYC, and referral forms.

---

### EmrMacroTextField
**Layer** L2 · **Selector** `emr-macro-text-field` · **Status** stable · **Story** `emr-fields-clinical-building-blocks--demographics-and-macros`

**Need** — High-throughput clinical documentation relies on `.` and `/` SmartPhrase triggers (e.g. `.clearcornea`, `/postopd1`) plus optional voice dictation without embedding macro dictionaries or audio capture inside the UI component.

**Purpose** — Renders a controlled `role="combobox"` narrative `<textarea>` inside `EmrFieldFrame` with an above-field print-hidden toolbar (`Type . or / for SmartPhrases`, optional `44x44px` clear button, dictation toggle), cursor-aware `extractActiveMacroTrigger` / `expandMacroTriggerAtCursor` controller helpers, keyboard-navigable (`ArrowUp`/`ArrowDown`/`Enter`/`Escape`) SmartPhrase popover with `role="status"` empty state, optional `maxLength` character counter and `autoResize`, and six-state `ClinicalAssessmentStatus`. Emits `MacroTextFieldIntent` (`valueChangeRequested`, `macroQueryRequested`, `macroSelected`, `macroDismissRequested`, `dictationToggleRequested`, `clearRequested`, `statusChangeRequested`) plus `focused` / `blurred`.

**Depends on** — `EmrFieldFrameComponent`.
**Used by** — clinical notes, examination narratives, and discharge instructions.

---

### EmrLateralityField
**Layer** L2 · **Selector** `emr-laterality-field` · **Status** stable · **Story** `emr-fields-clinical-building-blocks--ophthalmology-fields`

**Need** — Wrong-site surgery prevention and ophthalmic/orthopaedic charting require explicit laterality selection (`OD` / `OS` / `OU` or `Right` / `Left` / `Bilateral` / `Unilateral (unspecified)`) alongside Joint Commission Universal Protocol / WHO Surgical Safety Checklist site-confirmation attestation and six-state clinical assessment status rather than ad-hoc dropdowns.

**Purpose** — Renders `EmrSegmentedControl` (`role="radiogroup"` with roving `tabindex`, Arrow/Home/End/Space/Enter keyboard navigation, `44px` / `48px` `lg` touch targets, `14px` `Inter Variable` option labels, `allowDeselect={false}`, and print-hidden monochrome SVG `close` Clear button) plus an optional surgical-site confirmation `EmrCheckbox` inside `EmrFieldFrame` (`labelNamesControl={false}`, six-state `ClinicalAssessmentStatus`, `definition` fallback, `layout`, and `showMetadata`), driven by `LateralityFieldViewModel` and pure controller helpers (`normalizeLateralityDomain`, `resolveLateralityOptions`, `resolveLateralityValidation`, `OPHTHALMIC_LATERALITY_OPTIONS`, `ANATOMIC_LATERALITY_OPTIONS`, `DEFAULT_LATERALITY_CONFIRMATION_LABEL`). Emits `LateralityFieldIntent` (`lateralitySelected`, `confirmationChangeRequested`, `statusChangeRequested`) plus `cleared`, `focused`, and `blurred`.

**Depends on** — `EmrFieldFrameComponent`, `EmrSegmentedControlComponent`, `EmrCheckboxComponent`.
**Used by** — ophthalmic orders, surgical booking, procedure timeout checklists, and exam headers.

**API**
- **Inputs / Props**: `model` (`LateralityFieldViewModel`), `definition?` (`EmrFieldDefinition`), `controlId?`, `headingId?`, `labelHidden?` (`false`), `layout?` (`'vertical' | 'horizontal' | 'inline'`), `showMetadata?` (`true`), `readOnly?` (`false`), `size?` (`'sm' | 'md' | 'lg'`), `clearable?` (`!required` by default). (`disabled` is forbidden above L2.)
- **Outputs / Events**:
  - Angular: `(intent)` (`LateralityFieldIntent`), `(cleared)`, `(focused)`, `(blurred)`.
  - React / Expo: `onIntent`, `onCleared`, `onFocus`, `onBlur`.
  - Lit (`emr-laterality-field`, bubbling composed): `intent` (`CustomEvent<LateralityFieldIntent>`), `cleared`, `focused`, `blurred`.
- **Per-part validation**: `resolveLateralityValidation(messages)` routes `EmrValidationMessage.path` ending in `'confirmed' | 'confirmation' | 'confirm'` to the confirmation checkbox and all other/root paths to the radiogroup, while `EmrFieldFrame` renders a single `role="alert"` / `role="status"` footer (`aria-describedby="${id}-message"`).

```html
<emr-laterality-field
  [model]="lateralityModel"
  [readOnly]="false"
  (intent)="onLateralityIntent($event)"
/>
```

---

### EmrVisualAcuityField
**Layer** L2 · **Selector** `emr-visual-acuity-field` · **Status** stable · **Story** `emr-fields-clinical-building-blocks--ophthalmology-fields`

**Need** — Ophthalmic clinics capture monocular/binocular visual acuity thousands of times daily across notations (`Snellen 6m`, `Snellen 20ft`, `LogMAR`, `ETDRS`) plus low-vision categories (`CF`, `HM`, `LP`, `NLP`), optical correction (`Unaided`, `Habitual`, `BCVA`, `Contact Lens`), and optional pinhole acuity.

**Purpose** — Renders an `eye` (`OD`/`OS`/`OU`) semantic `info` badge (with monochrome `eye` SVG and SR expansion) alongside controller-supplied `derivedDisplay` badge, `notation` and `correction` `EmrSegmentedControl` switchers, primary `value` and conditional `pinholeValue` (`showPinhole`) `EmrSelect` pickers (`tabular-nums`, `clearable`), and six-state `ClinicalAssessmentStatus` delegated to `EmrFieldFrame` (`labelNamesControl=false`), emitting `VisualAcuityFieldIntent` (`notationChangeRequested`, `correctionChangeRequested`, `valueChangeRequested`, `pinholeChangeRequested`, `statusChangeRequested`) with zero Snellen↔LogMAR math in the UI.

**Depends on** — `EmrFieldFrameComponent`, `EmrSegmentedControlComponent`, `EmrSelectComponent`, `EmrBadgeComponent`.
**Used by** — visual acuity intake, refraction, and post-operative follow-up.

- **Props / Inputs** (aligned across Angular `EmrVisualAcuityFieldComponent`, React/Expo `EmrVisualAcuityField`, and Lit `emr-visual-acuity-field`; no `disabled` above L2):
  - `model`: `VisualAcuityFieldViewModel` (`label`, `eye?`, `notation`, `notationOptions`, `correction`, `correctionOptions`, `value`, `valueOptions`, `valuePlaceholder?`, `pinholeValue?`, `pinholeOptions?`, `pinholePlaceholder?`, `pinholeRequired?`, `showPinhole?`, `derivedDisplay?`, `derivedTone?`, `labels?`, `definition?`, `layout?`, `showMetadata?`, `size?`, `clearable?`, `status?`, `statusOptions?`, `hint?`, `messages?`, `required?`, `readOnly?`).
  - Optional top-level overrides: `definition`, `controlId`, `headingId`, `labelHidden`, `layout` (`vertical | horizontal | inline`), `showMetadata`, `readOnly`, `size` (`sm | md | lg`), `clearable`.
- **Outputs / Events**:
  - Angular: `(intent)` (`VisualAcuityFieldIntent`), `(focused)`, `(blurred)`.
  - React / Expo: `onIntent`, `onFocus`, `onBlur`.
  - Lit (`emr-visual-acuity-field`, bubbling composed): `intent` (`CustomEvent<VisualAcuityFieldIntent>`), `focused`, `blurred`.
- **Per-part validation & read-only rules**: `resolveVisualAcuityPartValidation(messages)` routes `EmrValidationMessage.path` ending in `'value' | 'acuity'`, `'pinhole' | 'pinholeValue' | 'pinhole_value'`, `'notation'`, or `'correction'` to the corresponding sub-control (and propagates un-scoped root errors onto primary `value`), while `EmrFieldFrame` renders a single `role="alert"` / `role="status"` footer (`aria-describedby="${id}-message"`). When `readOnly` is true, all segmented controls, select triggers, clear actions, and status chips are locked and emit no intents.

```html
<emr-visual-acuity-field
  [model]="visualAcuityModel"
  [readOnly]="false"
  (intent)="onVisualAcuityIntent($event)"
/>
```

---

### EmrRefractionField
**Layer** L2 · **Selector** `emr-refraction-field` · **Status** stable · **Story** `emr-fields-clinical-building-blocks--ophthalmology-fields`

**Need** — Manifest, cycloplegic, and autorefraction workflows require coordinated `Sphere (SPH)` (`0.25 D`), `Cylinder (CYL)` (`0.25 D`), `Axis` (`1–180°` integer), and optional `Near Add` (`0.25 D`) entry per eye (`OD` / `OS`) with non-clamping typed draft preservation, fixed-decimal formatting on blur, and controller-computed refraction summaries.

**Purpose** — Renders an `eye` (`OD`/`OS`) `info` badge (with monochrome `eye` SVG and SR expansion), controller-supplied `formattedSummary` `neutral` badge, optional right-aligned `clearable` button, a responsive `minmax(196px, 1fr)` grid of unified `[ − ] [ value ] [ unit ] [ + ]` `role="spinbutton"` stepper boxes, and six-state `ClinicalAssessmentStatus` delegated to `EmrFieldFrame` (`labelNamesControl=false`), emitting `RefractionFieldIntent` (`sphereChangeRequested`, `cylinderChangeRequested`, `axisChangeRequested`, `nearAddChangeRequested`, `clearRequested`, `statusChangeRequested`).

**Depends on** — `EmrFieldFrameComponent`, `EmrBadgeComponent`.
**Used by** — refraction worksheets, autorefractor imports, cataract/biometry workups, and spectacle prescribing.

- **Props / Inputs** (aligned across Angular `EmrRefractionFieldComponent`, React/Expo `EmrRefractionField`, and Lit `emr-refraction-field`; no `disabled` above L2):
  - `model`: `RefractionFieldViewModel` (`label`, `definition?`, `eye?`, `value` (`sphere`, `cylinder`, `axis`, `nearAdd?`), `sphereMin/Max/Step?`, `cylinderMin/Max/Step?`, `axisMin/Max/Step?` (default `axisMin = 1`), `nearAddMin/Max/Step?`, `showNearAdd?`, `formattedSummary?`, `status?`, `statusOptions?`, `hint?`, `messages?`, `required?`, `readOnly?`, `layout?`, `showMetadata?`, `size?`, `clearable?`).
  - Optional top-level overrides: `definition`, `controlId`, `headingId`, `labelHidden`, `layout` (`vertical | horizontal | inline`), `showMetadata`, `readOnly`, `size` (`sm | md | lg`), `clearable`.
- **Outputs / Events**:
  - Angular: `(intent)` (`RefractionFieldIntent`), `(focused)`, `(blurred)`.
  - React / Expo: `onIntent`, `onFocus`, `onBlur`.
  - Lit (`emr-refraction-field`, bubbling composed): `intent` (`CustomEvent<RefractionFieldIntent>`), `focused`, `blurred`.
- **Per-part validation, non-clamping & read-only rules**:
  - `resolveRefractionPartValidation(messages, part)` routes `EmrValidationMessage.path` mentioning `'sphere'`, `'cylinder'`, `'axis'`, or `'nearAdd'` to that part's `aria-invalid="true"` (errors) or `data-warning="true"` (warnings), while whole-field messages apply across all visible parts. `EmrFieldFrame` renders a single `role="alert"` / `role="status"` footer (`aria-describedby="${id}-message"`).
  - Typed out-of-range finite numbers are emitted unchanged so the controller can evaluate clinical bounds, while stepper `−`/`+` buttons step cleanly within `[min, max]`.
  - When `readOnly` is true, sub-inputs become native `readonly` (with DOM rollback on rogue input), stepper buttons are disabled, clear actions are hidden, and status chips are locked.

```html
<emr-refraction-field
  [model]="refractionModel"
  [clearable]="true"
  (intent)="onRefractionIntent($event)"
/>
```

---

### EmrImageField
**Layer** L2 · **Selector** `emr-image-field` · **Status** stable · **Story** `foundations-wave2-primitives--image-suite`

**Need** — Clinical photo fields (anterior-segment slit-lamp photos, external ocular/wound photos, consent scan pages, patient ID photos) need thumbnail previews, fullscreen pan/zoom/rotate inspection, interactive cropping, and six-state `ClinicalAssessmentStatus` (e.g. `declined` or `unable-to-assess`) inside standard `EmrFieldFrame` validation chrome.

**Purpose** — Binds `ImageFieldViewModel` (and optional `EmrFieldDefinition`) to `EmrImageUpload` inside `EmrFieldFrame` (`labelNamesControl=false`, `layout`, `showMetadata`, `labelHidden`, `headingId`, `readOnly` with no `disabled` prop above L2) with delegated six-state `ClinicalAssessmentStatus` selection, validation chrome, and camera trigger, emitting `ImageFieldIntent` (`filesSelected`, `itemsChangeRequested`, `imageCropped`, `captionChangeRequested`, `itemRemoveRequested`, `captureRequested`, `statusChangeRequested`).

**Depends on** — `EmrFieldFrameComponent`, `EmrImageUploadComponent`.
**Used by** — `EmrTypedFieldComponent` (`widget: 'image-upload'`) and clinical photo capture forms.

