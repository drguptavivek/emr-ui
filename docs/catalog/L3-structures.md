# L3 — Structures

L3 is the schema-driven container layer: it turns a controller-supplied schema (`ClinicalFormSchema`, `ClinicalMatrixSchema`, a plain `ClinicalListItem[]`) plus its matching state view model into a rendered, interactive surface, and emits typed intents rather than mutating anything. L3 components render L2 fields and L1 primitives; they never talk to each other except where explicitly noted below, and none of them perform HTTP calls, persistence, clinical validation, or completion/normality/safety inference. Clinical states (`not-assessed` / `unable-to-assess` / `not-applicable` / `declined` / `unknown`) are passed through verbatim from `ClinicalAssessmentStatus` — never collapsed to booleans or empty strings.

Source: `packages/emr-ui/src/lib/structures/emr-section-card.component.ts`, `emr-repeatable-group.component.ts`, `emr-clinical-form.component.ts`, `emr-clinical-list.component.ts`, `emr-clinical-matrix.component.ts`.

---

### EmrSectionCard
**Layer** L3 · **Selector** `emr-section-card` · **Status** stable · **Story** `emr-structures-section-card-and-repeatable-group--section-card-collapsible`

**Need** — every schema section (in a clinical form, a template preview, a domain form) needs the same collapsible-header treatment: heading, optional description, a controller-supplied status badge, optional header actions/footer, and an optional show/hide toggle — without each caller re-implementing `aria-expanded`/`aria-controls` wiring.

**Purpose** — renders a `<section>` with a semantic heading (`h2`–`h6`), optional monochrome SVG icon, optional description, a full `EmrBadge`-driven status chip, optional `[emrSectionActions]` / `[emrSectionFooter]` slots, and (when `collapsible()` is true) a toggle button that emits `intent` (`{ type: 'toggleRequested', sectionId }`); content stays mounted in `[hidden]` when `collapsed()` is true so `.emr-print` / `@media print` restores it on paper. It does NOT decide which sections exist, does NOT track collapsed state itself (state is a controller-supplied input, echoed back only as an intent request), and does NOT interpret the status badge's tone/label — those are opaque controller-supplied values. `readOnly` styles the card border as dashed without disabling the collapse/expand toggle.

**API**
```ts
import type {
  EmrBadge,
  EmrSectionCardHeadingLevel,
  EmrSectionCardPadding,
  EmrSectionCardVariant,
  EmrTone,
  SectionCardIntent,
} from '@drguptavivek/emr-controller';

@Component({ selector: 'emr-section-card', standalone: true })
export class EmrSectionCardComponent {
  readonly sectionId = input.required<string>();
  readonly label = input.required<string>();
  readonly description = input<string>();
  readonly status = input<EmrBadge>();
  readonly collapsible = input(false);
  readonly collapsed = input(false);
  readonly headingId = input<string>();
  readonly headingLevel = input<EmrSectionCardHeadingLevel>(2);
  readonly variant = input<EmrSectionCardVariant>('outlined');
  readonly tone = input<EmrTone>('neutral');
  readonly padding = input<EmrSectionCardPadding>('md');
  readonly icon = input<string>();
  readonly readOnly = input(false);
  readonly intent = output<SectionCardIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `sectionId` | `string` (required) | — | Used to derive `headingId`/`contentId` for `aria-labelledby`/`aria-controls` and emitted in `SectionCardIntent` |
| `label` | `string` (required) | — | Section heading text |
| `description` | `string?` | — | Optional subheading paragraph |
| `status` | `EmrBadge?` | — | Forwarded in full to `<emr-badge [badge]>` |
| `collapsible` | `boolean` | `false` | Shows the Show/Hide toggle button with chevron |
| `collapsed` | `boolean` | `false` | Controller-owned; the component only requests a toggle, never flips this itself |
| `headingId` | `string?` | `emr-section-<sectionId>-heading` | Optional override for heading element `id` and `aria-labelledby` |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6` | `2` | Semantic heading level (`h2`–`h6`) |
| `variant` | `'outlined' \| 'elevated' \| 'filled' \| 'subtle'` | `'outlined'` | Surface treatment |
| `tone` | `EmrTone` | `'neutral'` | Toned border accent (`[data-tone]`) |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Body padding |
| `icon` | `string?` | — | Optional monochrome SVG header icon name |
| `readOnly` | `boolean` | `false` | Dashed border styling; never disables the toggle button |

**Example**
```html
<emr-section-card sectionId="hpi" label="History of present illness" [collapsible]="true"
  [collapsed]="isCollapsed" [status]="{ label: 'Complete', tone: 'success' }"
  variant="outlined" tone="neutral" padding="md" [headingLevel]="2"
  (intent)="onSectionIntent($event)">
  <!-- projected fields -->
</emr-section-card>
```

**Composition** — renders `EmrBadgeComponent` (L1) for the status chip; renders no other component. It is the smallest structural building block above L2.

**Depends on** — `EmrBadgeComponent` (L1, verified: `emr-section-card -> emr-feedback(Badge)`).
**Used by** — `EmrClinicalForm` (L3, same layer).

---

### EmrRepeatableGroup
**Layer** L3 · **Selector** `emr-repeatable-group` · **Status** stable · **Story** `emr-structures-section-card-and-repeatable-group--repeatable-group-populated`

**Need** — repeating clinical entries (medications taken, prior surgeries, family conditions) need a controller-driven add/remove list of field-sets sharing one field schema, rendered and keyed by a stable item id — without the controller re-deriving per-item control ids or DOM structure.

**Purpose** — renders a heading + "Add" button for a `RepeatableGroupDefinition`, then one `<article>` per `RepeatableItemState` containing visible `EmrTypedField` controls per `definition.fields` entry (respecting `field.span`), per-item badges and lock indicator, group/item warnings and errors, plus a per-item "Remove" button. Following the L3 zero-`disabled` rule, Add and Remove buttons are omitted (never `disabled`) when `readOnly`, `item.readOnly`, `minItems`, or `maxItems` forbids mutation (with a `Maximum N entries` status hint at `maxItems` when editable). It emits `repeatItemAddRequested` / `repeatItemRemoveRequested` / `repeatItemEditRequested` / `repeatItemStatusEditRequested` / `fieldFocused` (plus host `focused` / `blurred`) — it never adds, removes, or edits an item itself; the controller supplies the next `model` array.

**API**
```ts
import type {
  ClinicalFieldDefinition, ClinicalFieldState, ClinicalFieldValue,
  RepeatableGroupDefinition, RepeatableItemState, ClinicalFormIntent,
} from '@drguptavivek/emr-controller';

export interface RepeatableGroupDefinition {
  kind: 'repeatable';
  id: string;
  label: string;
  description?: string;
  addLabel?: string;
  emptyMessage?: string;
  minItems?: number;
  maxItems?: number;
  fields: readonly ClinicalFieldDefinition[];
}

export interface RepeatableItemState {
  id: string;
  label?: string;
  fields: Readonly<Record<string, ClinicalFieldState>>;
  readOnly?: boolean;
  badges?: readonly EmrBadge[];
  warning?: string;
  error?: string;
}

@Component({ selector: 'emr-repeatable-group', standalone: true })
export class EmrRepeatableGroupComponent {
  readonly definition = input.required<RepeatableGroupDefinition>();
  readonly model = input<readonly RepeatableItemState[]>([]);
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly emptyMessage = input<string>();
  readonly error = input<string>();
  readonly warning = input<string>();
  readonly customTemplates = input<Readonly<Record<string, TemplateRef<EmrCustomFieldContext>>>>({});
  readonly intent = output<ClinicalFormIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `definition` | `RepeatableGroupDefinition` (required) | — | Field schema shared by every item (`minItems`, `maxItems`, `emptyMessage`) |
| `model` | `readonly RepeatableItemState[]` | `[]` | One rendered `<article>` per item; `@empty` shows `emptyMessage` |
| `headingId` | `string` | `resolveRepeatableHeadingId(...)` | Custom `id` for the `<h3>` heading referenced by `aria-labelledby` |
| `idPrefix` | `string` | `''` | Prefix (normalized with `-`) prepended to heading and field control ids |
| `readOnly` | `boolean` | `false` | Omits Add/Remove buttons, renders dashed read-only styling, and passes `readOnly` to every `emr-typed-field` |
| `emptyMessage` | `string` | `definition.emptyMessage ?? 'No entries recorded.'` | Override empty-state copy when `model` is empty |
| `error` | `string` | — | Group-level validation error rendered with `role="alert"` |
| `warning` | `string` | — | Group-level clinical warning rendered with `role="status"` |
| `customTemplates` | `Record<string, TemplateRef<EmrCustomFieldContext>>` | `{}` | Forwarded to each `emr-typed-field` for `type: 'custom'` fields |

**Example**
```html
<emr-repeatable-group [definition]="pastSurgeriesGroup" [model]="pastSurgeryItems"
  idPrefix="opd" (intent)="onFormIntent($event)" />
```

**Composition** — renders one `EmrTypedFieldComponent` (L2) per visible field per item and `EmrBadgeComponent` (L1) for item badges; owns no lower-layer container of its own.

**Depends on** — `EmrTypedFieldComponent` (L2, verified: `emr-repeatable-group -> emr-typed-field`), `EmrBadgeComponent` (L1).
**Used by** — `EmrClinicalForm` (L3, same layer, verified: `emr-clinical-form -> emr-repeatable-group`).

---

### EmrClinicalForm
**Layer** L3 · **Selector** `emr-clinical-form` · **Status** stable · **Story** `emr-clinical-forms-history--history`

**Need** — most clinical documentation (history, system examinations, PAC checklist forms, EHR template previews) is a set of labelled sections, each containing simple fields and/or repeatable field-sets, defined once as data and rendered/edited generically rather than as bespoke Angular classes per specialty form.

**Visibility** — `ClinicalFieldState.hidden` / `required` are resolved by the controller's logic engine. A hidden field is skipped only while empty; a hidden field holding a value stays visible (`isFieldShown` in emr-react). A section is skipped when no block in it would show (repeatable groups always count, since they carry Add) — stage-gated forms hide whole later stages this way (`isSectionShown`).

**Purpose** — renders `model.schema.sections` as `EmrSectionCard`s, and within each section renders `section.blocks` — a plain `ClinicalFieldDefinition` (via `EmrTypedField`), a `RepeatableGroupDefinition` block (delegated to `EmrRepeatableGroup`), or a `ClinicalMatrixBlockDefinition` (a rows × columns grid of ordinary fields, e.g. OD/OS, whose cells emit plain `fieldEditRequested`) — on a 12-column grid keyed by each block's `span`. When every section is hidden, renders `model.emptyMessage` (`role="status"`). It emits the full `ClinicalFormIntent` union (plus host `focused` / `blurred`) and never calls HTTP, persists, clinically validates, or infers completion/normality/safety; section collapse state, section status badges, and every field's `assessmentStatus` are controller-supplied and echoed back untouched.

**API**
```ts
// clinical-form.models.ts — quoted verbatim
export interface RepeatableGroupDefinition {
  kind: 'repeatable';
  id: string;
  label: string;
  description?: string;
  addLabel?: string;
  emptyMessage?: string;
  minItems?: number;
  maxItems?: number;
  fields: readonly ClinicalFieldDefinition[];
}

/** Layout only: rows × columns (e.g. IOP / CDR × OD / OS); each cell is an ordinary field stored in `fields` under its own id. */
export interface ClinicalMatrixBlockDefinition {
  kind: 'matrix';
  id: string;
  label: string;
  description?: string;
  columns: readonly { id: string; label: string }[];
  rows: readonly ClinicalMatrixBlockRow[];
}

export interface ClinicalMatrixBlockRow {
  id: string;
  label: string;
  cells: Readonly<Record<string, ClinicalFieldDefinition>>; // keyed by column id; missing = not applicable
}

export type ClinicalFormBlock = ClinicalFieldDefinition | RepeatableGroupDefinition | ClinicalMatrixBlockDefinition;

export interface ClinicalFormSection {
  id: string;
  label: string;
  description?: string;
  collapsible?: boolean;
  blocks: readonly ClinicalFormBlock[];
}

export interface ClinicalFormSchema {
  id: string;
  label: string;
  description?: string;
  sections: readonly ClinicalFormSection[];
}

export interface ClinicalFormViewModel {
  schema: ClinicalFormSchema;
  fields: Readonly<Record<string, ClinicalFieldState>>;
  repeatableGroups: Readonly<Record<string, readonly RepeatableItemState[]>>;
  collapsedSectionIds?: readonly string[];
  sectionStatuses?: Readonly<Record<string, EmrBadge>>;
  readOnly?: boolean;
  emptyMessage?: string;
  correction?: { label: string; description?: string };
}

export type ClinicalFormIntent =
  | { type: 'fieldEditRequested'; fieldId: string; value: ClinicalFieldValue }
  | { type: 'fieldStatusEditRequested'; fieldId: string; status: ClinicalAssessmentStatus | undefined }
  | { type: 'fieldFocused'; fieldId: string }
  | { type: 'repeatItemAddRequested'; groupId: string }
  | { type: 'repeatItemEditRequested'; groupId: string; itemId: string; fieldId: string; value: ClinicalFieldValue }
  | { type: 'repeatItemStatusEditRequested'; groupId: string; itemId: string; fieldId: string; status: ClinicalAssessmentStatus | undefined }
  | { type: 'repeatItemRemoveRequested'; groupId: string; itemId: string }
  | { type: 'sectionToggleRequested'; sectionId: string }
  | { type: 'correctionRequested' };

@Component({ selector: 'emr-clinical-form', standalone: true })
export class EmrClinicalFormComponent {
  readonly model = input.required<ClinicalFormViewModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly customTemplates = input<Readonly<Record<string, TemplateRef<EmrCustomFieldContext>>>>({});
  readonly intent = output<ClinicalFormIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `ClinicalFormViewModel` (required) | — | Schema + field state + repeatable-item state + collapse/status/readOnly/emptyMessage/correction |
| `headingId` | `string` | — | Optional external heading id wired to `<form aria-labelledby>`; falls back to `aria-label` |
| `idPrefix` | `string` | `''` | Prefixed onto every generated DOM control and section id (normalized with `-`); needed when two `emr-clinical-form` instances render on one page |
| `customTemplates` | `Record<string, TemplateRef<EmrCustomFieldContext>>` | `{}` | Forwarded to every `emr-typed-field` and `emr-repeatable-group` for `type: 'custom'` fields |

**Example**
```html
<emr-clinical-form [model]="historyViewModel" idPrefix="history" headingId="history-heading" (intent)="onIntent($event)" />
```

**Composition** — renders `EmrSectionCardComponent` (L3, same layer) per visible `schema.sections` entry, delegates `kind: 'repeatable'` blocks to `EmrRepeatableGroupComponent` (L3, same layer), and renders plain/matrix cells via `EmrTypedFieldComponent` (L2).

**Depends on** — `EmrSectionCardComponent` (L3, same layer), `EmrRepeatableGroupComponent` (L3, same layer), `EmrTypedFieldComponent` (L2). Verified: `emr-clinical-form -> emr-section-card(L3), emr-repeatable-group(L3), emr-typed-field(L2)`.
**Used by** — `EmrPacChecklist` (L4, verified: `emr-pac-checklist -> emr-clinical-form`), `EmrTemplatePreview` (L6, verified: `emr-template-preview -> emr-clinical-form`).

---

### EmrClinicalList
**Layer** L3 · **Selector** `emr-clinical-list` · **Status** stable · **Story** `emr-patient-and-navigation--clinical-lists`

**Need** — medications, allergies, chronic diseases, and significant personal history are all "a titled list of records with add/select/edit/remove actions and badges" — one generic list renderer plus thin, differently-labelled domain wrappers avoids four near-identical component classes.

**Purpose** — renders a controller-supplied `ClinicalListViewModel` (`title`, `description`, `status`, `variant`, `items`, `selectedId`, `allowAdd`, `addLabel`, `emptyTitle`, `emptyMessage`, `loading`, `loadingLabel`, `error`, `readOnly`) as a semantic `<section>` + `<ul>`/`<li>` list with full-row selection, Edit/Remove actions, loading/error (`retryRequested`)/empty states, and print-safe expansion. It emits `ClinicalListIntent` (`intent`), `focused`, and `blurred` only; it does NOT fetch, sort, filter, or page the list, and an empty list carries no implied clinical meaning — the empty-state wording (`emptyMessage`) is controller-supplied precisely because "no allergies recorded" and "allergy status not yet assessed" are different clinical facts.

**API**
```ts
import type {
  ClinicalListIntent,
  ClinicalListViewModel,
  EmrClinicalListHeadingLevel,
  EmrClinicalListLabels,
} from '@drguptavivek/emr-controller';

@Component({ selector: 'emr-clinical-list', standalone: true })
export class EmrClinicalListComponent {
  readonly model = input.required<ClinicalListViewModel>();
  readonly headingId = input<string>();
  readonly headingLevel = input<EmrClinicalListHeadingLevel>(2);
  readonly labels = input<Partial<EmrClinicalListLabels>>({});

  readonly intent = output<ClinicalListIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `ClinicalListViewModel` | required | Immutable list view model (`items`, `title`, `description`, `selectedId`, `status`, `allowAdd`, `addLabel`, `emptyTitle`, `emptyMessage`, `loading`, `loadingLabel`, `error`, `readOnly`, `variant`) |
| `headingId` | `string` | `'emr-clinical-list-title'` | Drives `aria-labelledby` on `<section>` and heading `id` |
| `headingLevel` | `EmrClinicalListHeadingLevel` (`2 \| 3 \| 4 \| 5 \| 6`) | `2` | Semantic heading level (`<h2>`–`<h6>`) |
| `labels` | `Partial<EmrClinicalListLabels>` | `{}` | Overrides UI chrome strings (`title`, `add`, `edit`, `remove`, `retry`, `loading`, `emptyMessage`, `errorTitle`, `readOnlyItem`) |
| `intent` | `ClinicalListIntent` (output) | — | Emits `addRequested`, `selected`, `editRequested`, `removeRequested`, or `retryRequested` |
| `focused` | `void` (output) | — | Emits when focus enters the list container |
| `blurred` | `void` (output) | — | Emits when focus leaves the list container |

**Example**
```html
<emr-clinical-list
  [model]="problemsModel"
  headingId="problems-heading"
  [headingLevel]="3"
  [labels]="{ add: 'Add problem' }"
  (intent)="onListIntent($event)"
/>
```

**Composition** — renders `EmrBadgeComponent` (L1) and `EmrStateMessageComponent` (L1).
**Depends on** — `EmrBadgeComponent`, `EmrStateMessageComponent` (L1).
**Used by** — `EmrMedicationList`, `EmrAllergyList`, `EmrChronicDiseaseList`, `EmrPersonalHistoryList` (L4, `packages/emr-ui/src/lib/domain/emr-clinical-lists.component.ts`).

---

### EmrClinicalMatrix
**Layer** L3 · **Selector** `emr-clinical-matrix` · **Status** stable · **Story** `emr-clinical-assessment--ophthalmology-o-d-o-s`

**Need** — specialty assessment grids (ophthalmology OD/OS, four-limb neurology) share the same shape — a fixed row list crossed with a fixed column list, one cell type per row, some cells not applicable to some columns, an optional free-text remark per row — and should be driven by one specialty-neutral component and a data schema rather than a bespoke grid per specialty.

**Purpose** — renders `definition` as a semantic `<table>` (wide containers, with sticky row labels and contiguous grouped column headers via `groupMatrixColumns()` when `columnGroups` is present) and as a stacked-card list (`emr-matrix-cards`, containers `<720px` via `@container (max-width: 720px)` / `@media (max-width: 720px)`) from the *same* cell logic, so both presentations stay in sync. Non-applicable cells (`row.applicableColumnIds` excludes the column) render as a `—` with an `emr-sr-only "Not applicable"` label instead of an editable control. Locked (`readOnly`, `cell.readOnly`, or `cell.disabled`) controls remain focusable (`readonly` / `aria-readonly="true"`, never native `[disabled]`) and non-mutating. It does NOT add/reorder rows or columns, does NOT infer a cell's applicability beyond the schema's explicit `applicableColumnIds`, and does NOT interpret `ClinicalAssessmentStatus` values — they are rendered as opaque controller-supplied badges/options.

**API**
```ts
// models.ts — the full ClinicalMatrixSchema family
export interface ClinicalColumn {
  id: string;
  label: string;
  shortLabel?: string;
}

export interface ClinicalColumnGroup {
  id: string;
  label: string;
  columnIds: readonly string[];
}

export type ClinicalCellType =
  | 'text' | 'multiline' | 'integer' | 'decimal' | 'select' | 'boolean' | 'date' | 'quantity' | 'custom';

export interface ClinicalRow {
  id: string;
  label: string;
  type: ClinicalCellType;
  applicableColumnIds?: readonly string[];
  unit?: string;
  unitOptions?: readonly ClinicalOption[];
  precision?: number;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  required?: boolean;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  clearable?: boolean;
  options?: readonly ClinicalOption[];
  assessmentStatusOptions?: readonly ClinicalAssessmentPresentation[];
  customRendererKey?: string;
  helpText?: string;
}

export interface ClinicalMatrixSchema {
  id: string;
  label: string;
  description?: string;
  showRemarks?: boolean;
  columnGroups?: readonly ClinicalColumnGroup[];
  columns: readonly ClinicalColumn[];
  rows: readonly ClinicalRow[];
}

export type ClinicalCellValue = string | number | boolean | null;
export interface ClinicalQuantityValue { value: number | null; unit: string; }

export interface ClinicalCellState {
  value: ClinicalCellValue | ClinicalQuantityValue;
  assessmentStatus?: ClinicalAssessmentPresentation;
  readOnly?: boolean;
  disabled?: boolean;
  warning?: string;
  error?: string;
  modified?: boolean;
  previousValueLabel?: string;
  deltaLabel?: string;
  flagBadge?: EmrBadge;
  quickPresets?: readonly string[];
}

export interface ClinicalMatrixRowValue {
  cells: Readonly<Record<string, ClinicalCellState>>;
  remark: string;
  remarkError?: string;
  remarkReadOnly?: boolean;
  remarkDisabled?: boolean;
}

export type ClinicalMatrixValues = Readonly<Record<string, ClinicalMatrixRowValue>>;

export type ClinicalMatrixIntent =
  | { type: 'cellEditRequested'; rowId: string; columnId: string; value: ClinicalCellValue | ClinicalQuantityValue }
  | { type: 'remarkEditRequested'; rowId: string; remark: string }
  | { type: 'cellAssessmentStatusEditRequested'; rowId: string; columnId: string; status: ClinicalAssessmentStatus | null }
  | { type: 'cellFocused'; rowId: string; columnId: string }
  | { type: 'customCellIntent'; rowId: string; columnId: string; action: string; payload?: unknown }
  | { type: 'columnCopyRequested'; fromColumnId: string; toColumnId: string }
  | { type: 'macroNormalRequested'; columnId?: string };

@Component({ selector: 'emr-clinical-matrix', standalone: true })
export class EmrClinicalMatrixComponent {
  readonly definition = input.required<ClinicalMatrixSchema>();
  readonly model = input<ClinicalMatrixValues>({});
  readonly readOnly = input<boolean>(false);
  readonly headingId = input<string | undefined>(undefined);
  readonly idPrefix = input<string>('');
  readonly intent = output<ClinicalMatrixIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `definition` | `ClinicalMatrixSchema` (required) | — | Rows/columns/column-groups/description/showRemarks; one `type` per row applies to every applicable column |
| `model` | `ClinicalMatrixValues` | `{}` | Cell state + remark state, keyed by `rowId` |
| `readOnly` | `boolean` | `false` | Forces every cell/remark to focusable read-only rendering without mutating intents |
| `headingId` | `string` | — | Optional external heading id wired to `<section aria-labelledby>`; defaults to `${idPrefix}-${definition.id}-title` |
| `idPrefix` | `string` | `''` | Prefix for generated heading, control, warning, error, and remark DOM IDs |
| `intent` | `ClinicalMatrixIntent` (output) | — | Emits cell edits, remark edits, status edits, cell focus, and `customCellIntent` |
| `focused` | `void` (output) | — | Emits when focus enters the matrix container |
| `blurred` | `void` (output) | — | Emits when focus leaves the matrix container |

**`ClinicalCellType` vs `ClinicalFieldType` drift** — the matrix's per-row type union (`ClinicalCellType`, 9 members: `text | multiline | integer | decimal | select | boolean | date | quantity | custom`) intentionally omits `multiselect`, `time`, and `datetime` from `ClinicalFieldType` (`clinical-form.models.ts`) because `ClinicalCellValue` is scalar-or-quantity. Any specialty grid that needs multi-choice or composite cell capture uses `type: 'custom'` and a caller-supplied cell renderer.

**Example**
```html
<emr-clinical-matrix [definition]="ophthalmologySchema" [model]="ophthalmologyValues"
  idPrefix="opd" (intent)="onMatrixIntent($event)" />
```

**Composition** — renders `EmrBadgeComponent` (L1) for `flagBadge` and `assessmentStatus` pills, and delegates `type: 'custom'` cells via `EmrClinicalCellRendererDirective` (Angular), `EmrClinicalCellRenderer` / `customRenderers` (React), or `<emr-clinical-cell-renderer>` (Lit).

**Depends on** — `EmrBadgeComponent` (L1).
**Used by** — none in the verified intra-UI import graph (consumed directly by ophthalmology/neurology recipe stories, not by another catalogued component).

---

### EmrClinicalCellRenderer
**Layer** L3 (directive / custom cell renderer) · **Selector** `ng-template[emrClinicalCellRenderer]` (Angular) / `EmrClinicalCellRenderer` (React) / `<emr-clinical-cell-renderer>` (Lit) · **Status** stable · **Story** `emr-clinical-assessment--custom-cell-renderer`

**Need** — `EmrClinicalMatrix`'s built-in cell types (`text`/`multiline`/`integer`/`decimal`/`select`/`boolean`/`date`/`quantity`) cannot cover every specialty's cell (e.g. a pupil-reaction picker, a gonioscopy angle stamp, a perimetry thumbnail). Rows declaring `type: 'custom'` need a keyed extension seam that preserves matrix `readOnly` gating and emits `customCellIntent`.

**Purpose** — in Angular, a structural-style attribute directive placed on an `ng-template` tagging it with a `key` (`emrClinicalCellRenderer`) so `EmrClinicalMatrixComponent.rendererFor(row.customRendererKey)` selects it with `ClinicalCellRendererContext` (`row`, `column`, `cell`, `readOnly`, gated `emit`). In React, `EmrClinicalCellRenderer` (plus `EmrMatrixCellRenderers` map) renders custom cells with `readOnly` gating and fallback status. In Lit, `<emr-clinical-cell-renderer>` hosts custom DOM/Lit templates with `>=44px` interactive targets and `readOnly` gating.

**API**
```ts
export interface ClinicalCellRendererContext {
  row: ClinicalRow;
  column: ClinicalColumn;
  cell?: ClinicalCellState;
  readOnly: boolean;
  emit: (action: string, payload?: unknown) => void;
}

@Directive({ selector: 'ng-template[emrClinicalCellRenderer]', standalone: true })
export class EmrClinicalCellRendererDirective {
  readonly key = input<string>('', { alias: 'emrClinicalCellRenderer' });
  constructor(readonly template: TemplateRef<{ $implicit: ClinicalCellRendererContext }>) {}
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `emrClinicalCellRenderer` (aliased to `key`) | `string` | `''` | Must match the row's `customRendererKey` for the matrix to select this template |

**Example**
```html
<emr-clinical-matrix [definition]="perimetrySchema" [model]="perimetryValues">
  <ng-template emrClinicalCellRenderer="pupil-reaction" let-ctx>
    <button type="button" [attr.aria-readonly]="ctx.readOnly ? 'true' : null" (click)="ctx.emit('open-picker')">
      {{ ctx.cell?.value ?? 'Set' }}
    </button>
  </ng-template>
</emr-clinical-matrix>
```

**Composition** — not applicable (directive / cell renderer host).

**Depends on** — none.
**Used by** — `EmrClinicalMatrix` (L3, same file; content-projected in Angular, `EmrClinicalCellRenderer` in React, `<emr-clinical-cell-renderer>` in Lit).

---

### EmrTimeAxis
**Layer** L3 · **Selector** `emr-time-axis` · **Status** stable · **Story** `emr-observations-time-axis--hourly`

**Need** — Inpatient charts (MAR, ICU hourly chart, anaesthesia record, fluid balance) read across time. Clinicians need one shared time scale with an unmistakable "now", that they can step earlier or later and switch between hourly and 15 minute views, and that lines up with the grid or trend beneath it.

**Purpose** — A generic horizontal tick strip with no clinical meaning. Renders a header (title, step as text or a step chooser, monochrome SVG chevron Earlier and Later buttons) and a horizontally scrollable row of fixed-width ticks. Each tick shows its label and optional sublabel; the current tick carries the word "Current" and `aria-current="time"` as well as a left bar and tint; the selected tick has a 2px inset border and `aria-selected` (combining with a wider 5px left accent when both current and selected). Tick width is `var(--emr-time-axis-col, 5.5rem)` (the flowsheet's column width) and the strip starts after `var(--emr-time-axis-lead, 0px)`, so a consumer can stack a flowsheet or trend underneath and align them. The controller supplies every label, the window of ticks and whether shifting is possible; the component never computes a time. Keyboard: the strip is a horizontal `listbox` with one tab stop (roving tabindex: last focused, else selected, else current, else first); `ArrowLeft`/`ArrowRight`/`Home`/`End` move focus only; `Enter`, `Space` or click emits `tickSelected` (gated by `canSelectTimeAxisSlot`). Earlier/Later use `aria-disabled="true"` plus handler guards (`canPanTimeAxis`), never native `disabled`. When `readOnly`, ticks render as a plain ordered list in a focusable scroll region with no buttons or step chooser. Print (`.emr-print` / `@media print`) hides pan/step controls via `data-emr-print="hide"` and expands the strip (`overflow: visible`, `break-inside: avoid`).

**API**
```ts
export interface TimeAxisTick { id: string; label: string; sublabel?: string; current?: boolean }
export interface TimeAxisStep { id: string; label: string }
export interface TimeAxisViewModel {
  id: string; title?: string; ticks: readonly TimeAxisTick[]; selectedTickId?: string;
  stepLabel?: string; steps?: readonly TimeAxisStep[]; selectedStepId?: string;
  canShiftEarlier?: boolean; canShiftLater?: boolean; readOnly?: boolean;
}
export type TimeAxisIntent =
  | { readonly type: 'tickSelected'; readonly tickId: string }
  | { readonly type: 'shiftEarlierRequested' }
  | { readonly type: 'shiftLaterRequested' }
  | { readonly type: 'stepChangeRequested'; readonly stepId: string };
export interface EmrTimeAxisLabels {
  readonly title?: string; readonly empty?: string; readonly step?: string;
  readonly stepValue?: (label: string) => string; readonly earlier?: string;
  readonly later?: string; readonly current?: string; readonly selected?: string;
}

export class EmrTimeAxisComponent {
  readonly model = input.required<TimeAxisViewModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly labels = input<EmrTimeAxisLabels>();
  readonly intent = output<TimeAxisIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `TimeAxisViewModel` (required) | — | ticks, labels, current tick, step and shift availability are controller-supplied |
| `headingId` | `string` | generated | id of the title heading (visually hidden "Time axis" when `title` is absent), used for `aria-labelledby` |
| `idPrefix` | `string` | `''` | optional prefix for deterministic axis, heading, step-select, and tick DOM ids |
| `labels` | `EmrTimeAxisLabels` | English defaults | optional localized string overrides for title, empty state, step, pan buttons, current, selected |
| `intent` (output) | `TimeAxisIntent` | — | `tickSelected`, `shiftEarlierRequested`, `shiftLaterRequested`, `stepChangeRequested` |
| `focused` / `blurred` (outputs) | `void` | — | emitted once as focus enters or leaves the time-axis container |
| `--emr-time-axis-col` (CSS) | length | `5.5rem` | width of each tick; match the column width of the grid below |
| `--emr-time-axis-lead` (CSS) | length | `0px` | gutter before the first tick; match the row-header column of the grid below |

**Example**
```html
<div style="--emr-time-axis-lead: 8.5rem">
  <emr-time-axis [model]="axisModel" (intent)="onAxisIntent($event)" />
  <emr-observation-flowsheet [model]="flowsheetModel" (intent)="onFlowsheetIntent($event)" />
</div>
```

**Known gaps**
- Alignment is nominal: it holds while no flowsheet cell's content is wider than the column and the flowsheet's row-header column is at its 8.5rem minimum (6.5rem under 480px). The flowsheet table also stretches its columns when they do not fill the container.
- The axis and the flowsheet scroll independently; to keep them together the host wraps both in one scroller (`width:max-content` inside `overflow-x:auto`, as in `emr-observations-flowsheet--with-time-axis`), which disables the flowsheet's sticky row headers.
- Arrow keys stop at the first and last tick; they do not request a shift. Selection does not follow focus.

**Depends on** — none (uses the shared `emr-button`, `emr-select` and `emr-sr-only` classes).

**Used by** — none yet (stacked above `EmrObservationFlowsheet` in `emr-observations-flowsheet--with-time-axis`).

---

### EmrAnnotationToolbar
**Layer** L3 · **Selector** `emr-annotation-toolbar` · **Status** stable · **Story** `emr-annotation-toolbar--all-tools`

**Need** — Any annotation surface needs the same small set of controls (tools, colour, line width, undo/redo, zoom, save) without each canvas rebuilding them or spending a screen row per control.

**Purpose** — One dense, wrapping row of icon-only buttons with monochrome SVGs across Angular, React Web, Expo Native, and Lit. Each has a 44px hit area around a 34px face, a `title` tooltip and an `aria-label`; the active tool, colour and width carry `aria-pressed` and a shape cue (filled face plus underline, check on the swatch), never colour alone. Tools come from a generic `tools[]` list (id, label, icon name, optional shortcut hint); an icon name outside the fixed registered set shows the label's first letter. The toolbar is a single Tab stop with arrow-key roving (Home/End supported) and `role="group"` per cluster; the Pen popover closes on option pick, `Escape` (refocusing the Pen trigger), focus-out, or outside `pointerdown`. Never exposes a `disabled` input/prop (`aria-disabled="true"` + handler-level guards keep buttons keyboard-focusable without invalid emissions). Holds no geometry, history, zoom or colour state; `readOnly` blocks everything except zoom; `zoomLocked` blocks zoom; hidden in print (`.emr-print` / `@media print` / `data-emr-print="hide"`).

**API**
```ts
export interface ToolbarTool { readonly id: string; readonly label: string; readonly icon: string; readonly disabled?: boolean; readonly shortcutLabel?: string }
export interface ToolbarColour { readonly id: string; readonly label: string; readonly hex: string }
export interface ToolbarWidth { readonly id: string; readonly label: string; readonly px: number }
export interface AnnotationToolbarViewModel {
  readonly tools: readonly ToolbarTool[]; readonly selectedToolId?: string;
  readonly colours: readonly ToolbarColour[]; readonly selectedColourId?: string;
  readonly widths: readonly ToolbarWidth[]; readonly selectedWidthId?: string;
  readonly canUndo: boolean; readonly canRedo: boolean; readonly zoomLabel: string;
  readonly canSave: boolean; readonly saveLabel?: string; readonly readOnly?: boolean;
  readonly zoomLocked?: boolean;
}
export type AnnotationToolbarIntent =
  | { type: 'toolSelected'; toolId: string } | { type: 'colourSelected'; colourId: string } | { type: 'widthSelected'; widthId: string }
  | { type: 'undoRequested' } | { type: 'redoRequested' } | { type: 'zoomInRequested' } | { type: 'zoomOutRequested' }
  | { type: 'zoomFitRequested' } | { type: 'zoomResetRequested' } | { type: 'saveRequested' };

@Component({ selector: 'emr-annotation-toolbar', standalone: true })
export class EmrAnnotationToolbarComponent {
  readonly model = input.required<AnnotationToolbarViewModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly labels = input<EmrAnnotationToolbarLabels>();
  readonly intent = output<AnnotationToolbarIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `AnnotationToolbarViewModel` (required) | — | tools, colours, widths, enabled flags and zoom text, all supplied |
| `model.zoomLocked` | `boolean` | `false` | marks the four zoom buttons `aria-disabled="true"` and removes them from the roving focus order (set by a canvas while pan/zoom is locked) |
| `headingId` | `string` | none | id of a visible label; otherwise the toolbar is named "Annotation tools" |
| `idPrefix` | `string` | `''` | deterministic prefix for Pen popover `id` / `aria-controls` |
| `labels` | `EmrAnnotationToolbarLabels` | English defaults | i18n overrides for toolbar, group, and button labels |
| `intent` (output) | `AnnotationToolbarIntent` | — | one intent per button, guarded against `readOnly`, `zoomLocked`, `disabled` tools, and `!canUndo`/`!canRedo`/`!canSave` |
| `focused` / `blurred` | `void` | — | emitted on host focus-within enter/exit |

**Example**
```html
<emr-annotation-toolbar [model]="toolbarModel" idPrefix="opd" (intent)="onToolbarIntent($event)" />
```

**Known gaps**
- Registered icons: `heroCursorArrowRays`, `heroArrowsPointingOut`, `heroHandRaised`, `heroBackspace`, `heroPencil`, `heroPencilSquare`, `heroMinus`, `heroArrowLongRight`, `heroArrowTrendingUp`, `heroSquare2Stack`, `heroStop`, `heroCircleStack`, `heroBars3BottomLeft`, plus all 13 `shape-*` primitives. Anything else falls back to the label initial.
- Colour swatches are rendered from supplied `hex` data; light swatches rely on the swatch ring for contrast.
- Hidden in print.

**Depends on** — `NgIcon` (heroicons outline) in Angular; `SvgIcon` in React/Expo; `renderEmrSvgIcon` in Lit.

**Used by** — `EmrClinicalAnnotationCanvas` (L4).

---

### EmrAnnotationList
**Layer** L3 · **Selector** `emr-annotation-list` · **Status** stable · **Story** `emr-annotation-list--populated`

**Need** — A drawing with many marks needs a compact way to see, select and manage each one by number, without opening a large layer panel.

**Purpose** — A tight numbered `<ol>` of annotation layers (`AnnotationLayerRecord`). Each row is one 44px line across Angular, React Web, Expo Native, and Lit: number badge, `14px` colour swatch, the annotation (its class plus the mark's own label or typed text, truncating with a tooltip), a monochrome `shape-*` tool icon (never the tool name as words), then monochrome icon-only eye and delete buttons; reorder up/down shows only on the selected row, and lock only when `canLock` is set. The selected row follows `selectedLayerId` and carries `aria-current="true"`, a side bar and bold text; hidden rows are italic with a dashed swatch and an eye-off icon. Visibility and lock buttons use `aria-pressed`. Never exposes a `disabled` input/prop (`aria-disabled="true"` + handler guards prevent locked-layer move/delete, out-of-bounds moves, and `readOnly` mutations). Rows are arrow-key navigable and only the active row's buttons are in the Tab order, so 50 rows are not 300 tab stops. In `readOnly` mode (and in `.emr-print` / `@media print`) every row action is hidden, labels unwrap in full, rows avoid page breaks, and selecting stays available.

**API**
```ts
export interface AnnotationListItem { readonly layer: AnnotationLayerRecord; readonly number: number; readonly classLabel?: string; readonly locked?: boolean; readonly description?: string }
export interface AnnotationListViewModel { readonly items: readonly AnnotationListItem[]; readonly selectedLayerId?: string; readonly emptyMessage: string; readonly readOnly?: boolean; readonly canLock?: boolean }
export type AnnotationListIntent =
  | { type: 'layerSelected'; layerId: string } | { type: 'layerVisibilityToggleRequested'; layerId: string }
  | { type: 'layerLockToggleRequested'; layerId: string } | { type: 'layerMoveRequested'; layerId: string; direction: 'up' | 'down' }
  | { type: 'layerRemoveRequested'; layerId: string } | { type: 'layerRenameRequested'; layerId: string; label: string };

@Component({ selector: 'emr-annotation-list', standalone: true })
export class EmrAnnotationListComponent {
  readonly model = input.required<AnnotationListViewModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly labels = input<EmrAnnotationListLabels>();
  readonly intent = output<AnnotationListIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `AnnotationListViewModel` (required) | — | items, selection, empty text, read-only flag |
| `model.canLock` | `boolean` | `false` | shows the lock button; hidden by default because lock means nothing until marks can be moved |
| `headingId` | `string` | none | id of a visible label; otherwise the list is named "Annotations" |
| `idPrefix` | `string` | `''` | deterministic prefix for list and row DOM IDs |
| `labels` | `EmrAnnotationListLabels` | English defaults | i18n overrides for list, status, and row-action labels |
| `intent` (output) | `AnnotationListIntent` | — | select, visibility, lock, move, remove (locked layers guard against move/delete) |
| `focused` / `blurred` | `void` | — | emitted on host focus-within enter/exit |

**Example**
```html
<emr-annotation-list [model]="listModel" idPrefix="opd" (intent)="onListIntent($event)" />
```

**Known gaps**
- `layerRenameRequested` is in the intent contract but the list has no rename control yet.
- Delete emits immediately for unlocked layers; the controller owns any confirmation.
- Long labels truncate with ellipsis on screen (full text in the tooltip) and unwrap in full in print.
- Row actions are hidden in print.
- The list does not scroll itself; constrain its container for long lists.

**Depends on** — `NgIcon` (heroicons outline) in Angular; `SvgIcon` in React/Expo; `renderEmrSvgIcon` in Lit.

**Used by** — `EmrClinicalAnnotationCanvas` (L4).

---

### EmrImageTemplatePicker
**Layer** L3 · **Selector** `emr-image-template-picker` · **Status** stable · **Story** `emr-annotation-template-gallery--anatomy-gallery`

**Need** — Choosing one of 105 anatomy outlines (or an uploaded photo) from a long dropdown is slow and error-prone: names alone do not show what the picture is, and left/right variants look alike in a list. A clinician needs to see the thumbnails, find them by name, side or view, and keep the few they use daily at the top.

**Purpose** — A generic gallery picker with no clinical meaning. Renders a header (title, result count, close button), a search box with a clear-search button, a wrapping row of group chips (Favourites, All, then each group with its count) and a responsive grid of square thumbnail tiles. Thumbnails use `object-fit: contain` on a neutral surface so varied aspect ratios are never cropped. Each tile shows its label (two lines, ellipsis, full text in a tooltip) and badge chips (for example side and view). The selected tile has a monochrome SVG check icon, a thicker border and `aria-pressed`. Favourites render in a pinned section at the top in the controller-supplied order and are not repeated in the main section; each tile has a separate monochrome star toggle (not nested in the tile button) when `canEditFavourites` is set. The controller owns the catalogue, the filtering (use the pure `filterImageTemplates` helper), the favourites, their persistence and the selection; the component only renders and emits intents. Keyboard: arrow keys, Home and End move between tiles (roving tab stop; the active tile's star is the next tab stop), Enter or Space selects, Escape clears active search or asks to close when empty. Empty-state recovery offers Clear search, Show all, and Reset filters. All interactive hit targets meet the `44px` minimum. Hidden in print (`data-emr-print="hide"`, `:host-context(.emr-print)`, `@media print`).

**API**
```ts
export interface ImageTemplateOption { id: string; label: string; imageUrl: string; width: number; height: number; altText?: string; groupId?: string; badges?: readonly string[] }
export interface ImageTemplateGroup { id: string; label: string; count?: number }
export const FAVOURITES_GROUP_ID = 'favourites';
export interface ImageTemplatePickerViewModel {
  title: string; options: readonly ImageTemplateOption[]; groups: readonly ImageTemplateGroup[];
  selectedGroupId?: string; query: string; selectedId?: string; totalLabel?: string; emptyMessage: string;
  readOnly?: boolean; favouriteIds?: readonly string[]; canEditFavourites?: boolean;
}
export type ImageTemplatePickerIntent =
  | { type: 'queryChangeRequested'; query: string }
  | { type: 'groupSelected'; groupId: string | null }
  | { type: 'templateSelected'; templateId: string }
  | { type: 'favouriteToggleRequested'; templateId: string; favourite: boolean }
  | { type: 'closeRequested' };
export interface EmrImageTemplatePickerLabels { /* close, searchPlaceholder, searchAria, clearSearch, filterAria, favourites, all, allTemplates, starHint, showAll, resetFilters, addFavourite, removeFavourite */ }
export function filterImageTemplates(options, query, groupId?, groups?, favouriteIds?): readonly ImageTemplateOption[];
export function canSelectImageTemplate(readOnly, option): boolean;
export function canToggleTemplateFavourite(model, option, readOnlyOverride?): boolean;

export class EmrImageTemplatePickerComponent {
  readonly model = input.required<ImageTemplatePickerViewModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly readOnly = input<boolean>(false);
  readonly labels = input<EmrImageTemplatePickerLabels>();
  readonly intent = output<ImageTemplatePickerIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `ImageTemplatePickerViewModel` (required) | — | options are already filtered; labels, counts and favourites are controller-supplied |
| `headingId` | `string` | generated | id of the title heading, used for `aria-labelledby` |
| `idPrefix` | `string` | `''` | deterministic prefix for picker, heading, search, and section DOM IDs |
| `readOnly` | `boolean` | `false` | OR'd with `model.readOnly`; locks selection/starring (`aria-disabled="true"` on tiles) while keeping search & filter chips operable |
| `labels` | `EmrImageTemplatePickerLabels` | English defaults | i18n/override strings and aria-label formatters |
| `intent` (output) | `EventEmitter<ImageTemplatePickerIntent>` / `onIntent` / `intent` | — | `queryChangeRequested`, `groupSelected` (`null` = All, `'favourites'` = favourites), `templateSelected`, `favouriteToggleRequested`, `closeRequested` |
| `focused` / `blurred` | `void` (`onFocus` / `onBlur` in React) | — | focus-within boundary events |

**Example**
```html
<emr-image-template-picker [model]="pickerModel" idPrefix="opd" (intent)="onPickerIntent($event)" />
```
```ts
const options = filterImageTemplates(all, query, groupId, groups, favouriteIds);
```

**Known gaps**
- Filtering is not done by the component: the host must pass already-filtered `options` (`filterImageTemplates` is the shared helper). The `'favourites'` group shows favourites in `favouriteIds` order.
- Group chips are `>=44px` tall and wrap; the row scrolls vertically inside its own region after three rows rather than growing without limit.
- No virtualisation: very large catalogues render every tile (thumbnails are lazy-loaded).
- Vertical arrow keys between the Favourites and main sections map by column position, which is approximate when the favourites row is short.
- Hidden in print; it never prints the selected item (the host prints the chosen image elsewhere).
- Favourite starring is hidden when `readOnly`; browsing, searching and filtering still work.

**Depends on** — `NgIcon` (heroicons outline/solid) in Angular; `SvgIcon` in React/Expo; `renderEmrSvgIcon` in Lit.

**Used by** — none yet (intended as the background chooser for the clinical annotation canvas).


---

### EmrDataTable
**Layer** L3 · **Selector** `emr-data-table` · **Status** stable · **Story** `emr-structures-data-table--populated`

**Need** — Operational and clinical tables (screening rosters, referral queues, delivery lists, audit tables, batch exports) need a controlled, accessible data table with column sorting, active filter chips, saved filters, bulk actions, density switching, row selection, and pagination without duplicating sorting/pagination state in the UI.

**Purpose** — Renders a controlled `<table>` driven by `EmrDataTableModel` (sortable column headers with `aria-sort`, active filter chips, saved-filter menu, bulk action bar, comfortable/compact density toggle, multi-row tri-state selection checkboxes, `<emr-badge>` cell badges, pagination bar with rows-per-page selector, `readOnly` gating, and 5-row skeleton loading/error/empty states) and emits `EmrDataTableIntent` (`sortChanged`, `filterRemoved`, `filterAddRequested`, `savedFilterSelected`, `saveFilterRequested`, `exportRequested`, `densityChanged`, `selectionChanged`, `rowActivated`, `bulkActionRequested`, `pageChanged`, `pageSizeChanged`, `retryRequested`). Never sorts, filters, or slices rows locally.

**API**
```ts
export class EmrDataTableComponent {
  readonly model = input.required<EmrDataTableModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>();
  readonly labels = input<Partial<EmrDataTableLabels>>({});
  readonly intent = output<EmrDataTableIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}
```

**Attributes & Behaviour**
- `model` drives columns (`width`, `align`, `sortable`), rows (`selectedIds`, `<emr-badge>` cell badges), `sort`, active `filters`, `savedFilters`, `density` (`comfortable` | `compact`), `page` / `pageSize` / `total`, `loading` (5-row skeleton + `aria-busy="true"`), `error` (`role="alert"` + `Retry`), and `readOnly`.
- Selection: tri-state Select-All (`aria-checked="mixed"`) and roving-tabindex rows (`ArrowUp`/`ArrowDown`/`Home`/`End`, `Space` to select, `Enter` to activate). `readOnly` gates row selection, filter edits, saving filters, and bulk actions while keeping sorting, paging, density, and saved-filter switching operable.
- Print: toolbars, checkboxes, and pagination hide in `.emr-print` / `@media print`; scroll containers expand without row mid-splits.

**Example**
```html
<emr-data-table
  [model]="referralsTable()"
  [headingId]="'referrals-heading'"
  [idPrefix]="'opd'"
  (intent)="onTableIntent($event)"
/>
```

**Depends on** — `EmrBadge`.
**Used by** — none in the verified component graph.

---

### EmrSplitWorkspace
**Layer** L3 · **Selector** `emr-split-workspace` · **Status** stable · **Story** `emr-structures-workstation-containers--split-workspace`

**Need** — Desktop EMR workstations require side-by-side comparison and charting (e.g., clinical notes beside prior labs/imaging or PACS), while narrow containers (`<= 720px`) and print mode need a clean tabbed fallback or stacked layout without losing pane context.

**Purpose** — Renders a 2- or 3-pane resizable workstation layout driven by `EmrSplitWorkspaceViewModel` (`model`, `headingId`, `idPrefix`, `labels`; outputs `intent`, `focused`, `blurred`) with layout presets (`2-pane-50-50`, `2-pane-40-60`, `3-pane`, `focus-primary`), accessible `role="separator"` splitters supporting `ArrowLeft`/`ArrowRight`/`Home`/`End` ratio adjustments bounded by each pane's `minWidthPct`, pane collapse controls, `@container (max-width: 720px)` mobile pane tabs, and unclipped `.emr-print` output. Emits `EmrSplitWorkspaceIntent` (`presetChanged`, `paneResized`, `paneCollapsedToggled`, `mobilePaneSelected`).

**Depends on** — none (L0 tokens only).
**Used by** — none in the verified component graph.

---

### EmrCommandPalette
**Layer** L3 · **Selector** `emr-command-palette` · **Status** stable · **Story** `emr-structures-workstation-containers--command-palette`

**Need** — High-velocity clinicians need keyboard-first (`Cmd/Ctrl+K`) navigation across rapid order entry, navigation, SmartPhrases, clinical calculators, and actions without hunting through deep menus.

**Purpose** — Renders a `modal` or `inline` WAI-ARIA `role="combobox"` (`aria-activedescendant`, `aria-controls`, `aria-expanded`) + grouped `role="listbox"` driven by `EmrCommandPaletteViewModel` (`model`, `headingId`, `idPrefix`, `labels`; outputs `intent`, `focused`, `blurred`) with category tabs (`all`, `orders`, `navigation`, `smartphrases`, `calculators`, `actions`), Pinned/Recent/group sections, keyboard shortcut chips, outside-click dismissal, and `ArrowUp`/`ArrowDown`/`Enter`/`Escape` navigation. Emits `EmrCommandPaletteIntent` (`queryChanged`, `categoryChanged`, `itemHighlighted`, `commandExecuted`, `dismissed`).

**Depends on** — none (L0 tokens only).
**Used by** — none in the verified component graph.

---

### EmrMasterDetail
**Layer** L3 · **Selector** `emr-master-detail` · **Status** stable · **Story** `emr-structures-workstation-containers--master-detail-inbox`

**Need** — Clinical inboxes (critical alert triage, operative note co-sign queues, diagnostic verification) require a synchronized master list with severity badges and bulk actions paired with a detail inspection pane.

**Purpose** — Renders a master-detail split surface driven by `EmrMasterDetailViewModel` (`model`, `headingId`, `idPrefix`, `labels`; outputs `intent`, `focused`, `blurred`) with filter chips, search input, accessible non-nested `ul[role="list"]` rows separating batch checkboxes from item select buttons, batch action toolbar, summary fields and item actions, `@container (max-width: 720px)` `mobileDetailOpen` Back-to-list navigation, and `.emr-print` detail flow. Emits `EmrMasterDetailIntent` (`searchChanged`, `filterChanged`, `itemSelected`, `detailClosed`, `batchSelectionToggled`, `actionTriggered`).

**Depends on** — none (L0 tokens only).
**Used by** — none in the verified component graph.

---

### EmrSynchronizedTimeGrid
**Layer** L3 · **Selector** `emr-synchronized-time-grid` · **Status** stable · **Story** `emr-structures-workstation-containers--synchronized-time-grid`

**Need** — Correlating acute clinical changes across vital signs, OCT/trend trajectories, medication administrations, and events requires a shared horizontal time axis so clinicians can inspect exact temporal alignment.

**Purpose** — Renders a bounded scrollable grid with a sticky `124px` lead column and `108px` time columns, resolution selector (`15m`, `1h`, `4h`, `24h`), gated `Earlier`/`Later` stepping via `canStepTimeGridScroll`, collapsible tracks (`vitals`, `trend`, `medications`, `events`) with `track.badge`, `cell.badge`, `sparklineNorm`, `note`, all 5 `abnormalTone` styles (`neutral`, `info`, `success`, `warning`, `danger`), and unclipped `.emr-print` output driven by `EmrSynchronizedTimeGridViewModel` (`model`, `headingId`, `idPrefix`, `labels`; outputs `intent`, `focused`, `blurred`). Emits `EmrSynchronizedTimeGridIntent` (`resolutionChanged`, `scrollOffsetChanged`, `columnSelected`, `trackToggled`, `cellSelected`).

**Depends on** — none (L0 tokens only).
**Used by** — none in the verified component graph.

