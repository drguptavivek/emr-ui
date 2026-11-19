# L1 — Primitives

L1 is the layer of mechanical, presentation-only building blocks: inputs, choice controls, feedback surfaces, tabs, a separator, a Likert scale, and three layout helpers. None of these components know anything about clinical meaning — they bind a value, options, and validation *display* state, and emit change/intent events. A component at this layer may depend only on L0 (CSS tokens/classes) and framework/controller primitive types (`EmrOption`, `EmrTone`) from `@drguptavivek/emr-controller`. It must never import anything from L2 or above, and per the verified import graph it never imports another L1 sibling either — the 25 components below are independent leaves.

Source files: `packages/emr-ui/src/lib/primitives/*.component.ts` (including `emr-card-layout.component.ts`).

## Shared base: `EmrFieldBase`

Six of the input components (`EmrTextInput`, `EmrNumberInput`, `EmrDateInput`, `EmrSelect`, `EmrQuantityInput`, `EmrPairedInput`) extend a shared, **non-exported** abstract base defined in `emr-inputs.component.ts`:

```ts
@Directive()
abstract class EmrFieldBase {
  @Input() inputId = 'emr-field';
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() readOnly = false;

  describedBy(): string | null; // joins `${inputId}-hint` / `${inputId}-error` for aria-describedby
}
```

Because it is not exported, consumers cannot reference `EmrFieldBase` by type — it only documents the common surface. Each subclass entry below is documented as `extends EmrFieldBase` and lists only its own additional inputs/outputs. `EmrTimeInput` and `EmrDateTimeInput` do not extend it; they use signal inputs on a separate non-exported base.

---

### EmrButton
**Layer** L1 · **Selector** `emr-button` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Every workflow needs a consistent, accessible clickable affordance (save, cancel, delete, preview) with a busy/loading state that doesn't require re-deriving `disabled`/`aria-busy` wiring in every consumer.

**Purpose** — Renders a styled `<button>` with variant/size/loading/disabled visual states and emits a raw click event. It does not perform navigation, submit forms itself beyond the native `type` attribute, call any API, or know what the click "means" — that is entirely the caller's responsibility via the `clicked` output.

**API**
```ts
export type EmrButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type EmrButtonSize = 'small' | 'medium';

// Decorator-based (@Input/@Output), not signal input()/output()
interface EmrButtonProps {
  variant: EmrButtonVariant; // default 'primary'
  size: EmrButtonSize;       // default 'medium'
  type: 'button' | 'submit' | 'reset'; // default 'button'
  disabled: boolean; // default false
  loading: boolean;  // default false
  block: boolean;    // default false
}
// @Output() clicked: EventEmitter<MouseEvent>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| variant | `EmrButtonVariant` | `'primary'` | maps to `.emr-button--secondary/--outline/--ghost/--danger` |
| size | `EmrButtonSize` | `'medium'` | `'small'` maps to `.emr-button--small` |
| type | `'button' \| 'submit' \| 'reset'` | `'button'` | forwarded to native `type` attribute |
| disabled | `boolean` | `false` | also true while `loading` |
| loading | `boolean` | `false` | shows `•••` glyph, sets `aria-busy` |
| block | `boolean` | `false` | maps to `.emr-button--block` (full width) |
| clicked (output) | `EventEmitter<MouseEvent>` | — | emitted on native click |

**Example**
```html
<emr-button variant="danger" [disabled]="isSaving" (clicked)="onDelete()">Delete</emr-button>
```

**Depends on** — L0 tokens only (`.emr-button`, `.emr-button--*`)
**Used by** — not consumed internally

---

### EmrTextInput
**Layer** L1 · **Selector** `emr-text-input` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Free-text fields (patient name, remarks, MRN entry) need a labelled, described, error-capable text control that behaves identically everywhere in the catalogue.

**Purpose** — Renders a labelled `<input>` bound to a plain string, wiring `aria-invalid`/`aria-describedby` from `error`/`hint`. It performs no input masking, no format validation, and no debouncing — it emits every keystroke as-is via `valueChange`.

**API**
```ts
// extends (non-exported) EmrFieldBase: inputId, label, hint, error, placeholder, required, disabled, readOnly
interface EmrTextInputProps extends EmrFieldProps {
  value: string; // default ''
}
// @Output() valueChange: EventEmitter<string>
// @Output() blurred: EventEmitter<void>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| value | `string` | `''` | controlled — component does not mutate it internally |
| valueChange (output) | `EventEmitter<string>` | — | emitted on every native `input` event |
| blurred (output) | `EventEmitter<void>` | — | emitted on native `blur` |
| *(inherited)* inputId/label/hint/error/placeholder/required/disabled/readOnly | see `EmrFieldBase` | | |

**Example**
```html
<emr-text-input inputId="demo-name" label="Patient name" [value]="name" required
  (valueChange)="name = $event" />
```

**Depends on** — L0 tokens only (`.emr-field`, `.emr-control`)
**Used by** — `EmrFavouritesPanel` (L4), `EmrOrderDetails` (L4)

---

### EmrNumberInput
**Layer** L1 · **Selector** `emr-number-input` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Numeric clinical readings (IOP, refractive power, counts) need integer vs. decimal input mode, min/max/step guidance, and a nullable value so "not yet entered" is distinguishable from zero.

**Purpose** — Renders a `type="number"` control with `inputmode`/`step` derived from `mode`. It performs no clinical range validation (min/max are advisory HTML attributes only, not enforced business rules) and no unit conversion.

**API**
```ts
interface EmrNumberInputProps extends EmrFieldProps {
  mode: 'integer' | 'decimal'; // default 'decimal'
  value: number | null;        // default null
  min?: number;
  max?: number;
  step: number; // default 0.01
}
// @Output() valueChange: EventEmitter<number | null>
// @Output() blurred: EventEmitter<void>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| mode | `'integer' \| 'decimal'` | `'decimal'` | integer forces `step=1` and `inputmode="numeric"` |
| value | `number \| null` | `null` | empty native value emits `null`, not `0` or `NaN` |
| min / max | `number \| undefined` | `undefined` | forwarded as HTML `min`/`max` only |
| step | `number` | `0.01` | ignored when `mode === 'integer'` |
| valueChange (output) | `EventEmitter<number \| null>` | — | |
| blurred (output) | `EventEmitter<void>` | — | |

**Example**
```html
<emr-number-input inputId="demo-iop" label="Intraocular pressure" [value]="18" mode="decimal" [step]="0.1" hint="mmHg" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrDateInput
**Layer** L1 · **Selector** `emr-date-input` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Encounter, order, and history dates need a native date picker consistent with the rest of the form chrome.

**Purpose** — Renders a `type="date"` control bound to an ISO date string. It performs no calendar validation, no timezone handling, and no formatting beyond what the browser's native date input provides.

**API**
```ts
interface EmrDateInputProps extends EmrFieldProps {
  value: string; // default ''
  min: string;   // default ''
  max: string;   // default ''
}
// @Output() valueChange: EventEmitter<string>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| value | `string` | `''` | ISO `yyyy-mm-dd` expected by native input |
| min / max | `string` | `''` | forwarded as HTML `min`/`max` attributes |
| valueChange (output) | `EventEmitter<string>` | — | |

Note: unlike its sibling inputs, `EmrDateInput` does not emit a `blurred` output.

**Example**
```html
<emr-date-input inputId="demo-date" label="Encounter date" [value]="date" (valueChange)="date = $event" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrTimeInput
**Layer** L1 · **Selector** `emr-time-input` · **Status** stable · **Story** `emr-fields-time-and-datetime--time-populated`

**Need** — Clinical events are often timed within a known day — drops instilled, IOP measured, symptom onset — and need a native time picker consistent with the rest of the form chrome.

**Purpose** — Renders a `type="time"` control bound to a 24-hour `HH:mm` string, or `null` when empty. It performs no parsing, no range validation and no timezone handling; the browser's native control and the controller own those. Uses signal `input()`/`output()` and does not extend `EmrFieldBase`.

**API**
```ts
controlId = input<string>();
label = input('');
ariaLabel = input<string>();
labelHidden = input(false);
hint = input('');
warning = input('');
error = input('');
invalid = input(false);
required = input(false);
disabled = input(false);
readOnly = input(false);
value = input<string | null>(null);          // canonical 'HH:mm' or 'HH:mm:ss'
precision = input<'minute' | 'second'>('minute');
hourCycle = input<'24' | '12'>('24');        // display format; wire value stays 24h
min = input<string>();
max = input<string>();
step = input<number>();                      // seconds (default 60 or 1 for 'second')
size = input<'sm' | 'md' | 'lg'>('md');
clearable = input(false);
// outputs: valueChange, cleared, focused, blurred, submitted
```

**Example**
```html
<emr-time-input controlId="iop-time" label="IOP measured at" [step]="300" [(value)]="iopTime" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally (`EmrTypedField` renders its own native `type="time"` for `type: 'time'`)

---

### EmrDateTimeInput
**Layer** L1 · **Selector** `emr-datetime-input` · **Status** stable · **Story** `emr-fields-time-and-datetime--date-time-populated`

**Need** — Admission, procedure start and last-oral-intake times need both a date and a time captured as one value, without the clinician switching between two controls.

**Purpose** — Renders a `type="datetime-local"` control bound to a zone-less `YYYY-MM-DDTHH:mm` string, or `null` when empty. It attaches no timezone and does no ordering or range checks; interpreting local time is the controller's job. Uses signal `input()`/`output()` and does not extend `EmrFieldBase`.

**API**
```ts
controlId = input<string>();
label = input('');
ariaLabel = input<string>();
labelHidden = input(false);
hint = input('');
warning = input('');
error = input('');
invalid = input(false);
required = input(false);
disabled = input(false);
readOnly = input(false);
value = input<string | null>(null);            // UTC ISO-8601 or local YYYY-MM-DDTHH:mm(:ss)
displayFormat = input<'dd-mm-yyyy' | 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'mm/dd/yyyy'>('dd-mm-yyyy');
timePrecision = input<'minute' | 'second'>('minute');
hourCycle = input<'24' | '12'>('24');
wireFormat = input<'utc' | 'local'>('utc');
min = input<string>();
max = input<string>();
size = input<'sm' | 'md' | 'lg'>('md');
clearable = input(false);
dateLabel = input('Date');
timeLabel = input('Time');
// outputs: valueChange, cleared, focused, blurred, submitted
```

**Example**
```html
<emr-datetime-input controlId="seen-at" label="Seen by clinician" [(value)]="seenAt" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally (`EmrTypedField` renders its own native `type="datetime-local"` for `type: 'datetime'`)

---

### EmrStatusCell
**Layer** L1 · **Selector** `emr-status-cell` · **Status** stable · **Story** `emr-primitives-status-cell--all-tones`

**Need** — Inpatient surfaces (MAR cells, task rows, bed tiles, checklist items) need one consistent cell showing a caller-supplied state with an optional action and attribution.

**Purpose** — Renders a badge from `status`, optional value, attribution line, secondary note and at most one action button. It derives no tone, label or meaning; it does not decide what the action does.

**API**
```ts
// signal input()/output()
status: EmrBadge (required); valueLabel?: string;
attribution?: string | { nameLabel?: string; roleLabel?: string; timeLabel?: string; author?: string; timestamp?: string };
action?: { label: string; icon?: EmrIconName; ariaLabel?: string };
secondaryNote?: string; readOnly = false; disabled = false; compact = false;
selectable = false; interactive = false; isSelected = false; // React/Lit: selected
size: 'sm' | 'md' = 'md'; ariaLabel?: string; controlId?: string;
actionClicked: output<void>(); selected: output<void>(); intent: output<'action' | 'selected'>();
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| status | `EmrBadge` | required | full badge styling (`tone`, `variant`, `shape`, `size`, `dot`); `assistiveText` rendered sr-only |
| valueLabel | `string` | — | shown beside the badge |
| attribution | `string \| object` | — | joined `name · role · time` |
| action | `{label, icon?, ariaLabel?}` | — | renders one sibling button with monochrome SVG icon; hidden when `readOnly`, `disabled`, or `compact` |
| secondaryNote | `string` | — | muted line |
| readOnly / disabled | `boolean` | `false` | hides the action and blocks `selected`/`intent` emission (`disabled` sets `aria-disabled="true"` and dims opacity) |
| compact | `boolean` | `false` | badge only; full content preserved in `aria-label` / sr-only |
| selectable / interactive | `boolean` | `false` | body becomes `role="button"`, `tabindex="0"`, `aria-pressed`, Enter/Space emit `selected` & `intent` |
| isSelected (`selected`) | `boolean` | `false` | selected border/surface highlight and `aria-pressed="true"` |
| size | `'sm' \| 'md'` | `'md'` | compact/standard text density (`>=44px` interactive targets maintained) |
| controlId / ariaLabel | `string` | — | id / accessible name on the cell body |
| intent (output) | `'action' \| 'selected'` | — | canonical unified event across Angular, React, and Lit |

**Example**
```html
<emr-status-cell [status]="badge" valueLabel="500 mg" [attribution]="who" [action]="{ label: 'Record' }" (actionClicked)="onRecord()" />
```

**Depends on** — L0 tokens only (`.emr-badge`, `.emr-tone-*`, `.emr-button`, `.emr-sr-only`)
**Used by** — not consumed internally

---

### EmrStageStepper
**Layer** L1 · **Selector** `emr-stage-stepper` · **Status** stable · **Story** `emr-primitives-stage-stepper--three-stages`

**Need** — Multi-phase records (admission-to-discharge journey, OT patient flow, staged checklists) need the same accessible numbered stage navigation without each re-implementing `aria-current`, status badges and keyboard movement.

**Purpose** — Renders a `<nav>` containing an `<ol>` of numbered stages, each a focusable `<button>` (even when `readOnly`, with `aria-readonly="true"`) with label, optional description, optional completed checkmark icon, and optional caller-supplied status badge. It does not decide which stage is active, complete or reachable; it only emits the selected stage id / `intent`.

**API**
```ts
export interface EmrStage { id: string; label: string; status?: EmrBadge; description?: string; disabled?: boolean }
// signal input()/output()
stages: readonly EmrStage[]            // required
activeId?: string
completedIds: readonly string[] = []
ariaLabel = 'Stages'
orientation: 'horizontal' | 'vertical' = 'horizontal'
size: 'sm' | 'md' = 'md'
clickable = true
linear = false
readOnly = false
disabled = false
controlId?: string
idPrefix?: string
// outputs: stageSelected: string; intent: { type: 'stageSelected'; stageId: string }
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| stages | `readonly EmrStage[]` | required | status is an `EmrBadge`; label, tone, and per-stage `disabled` come from caller |
| activeId | `string` | — | gets `aria-current="step"` and active underline styling |
| completedIds | `readonly string[]` | `[]` | renders monochrome SVG check icon in the step circle |
| ariaLabel | `string` | `'Stages'` | accessible name of the `<nav>` |
| orientation | `'horizontal' \| 'vertical'` | `'horizontal'` | horizontal wraps; stacks cleanly at 640px and below |
| size | `'sm' \| 'md'` | `'md'` | compact or standard density (`>= 44px` target maintained) |
| clickable / linear | `boolean` | `true` / `false` | `clickable=false` makes display-only steps; `linear=true` restricts selection to completed/active/next enabled stage |
| readOnly / disabled | `boolean` | `false` | `readOnly` keeps buttons focusable with `aria-readonly="true"` and suppresses selection; `disabled` dims and removes from tab order |
| controlId / idPrefix | `string` | auto | host id / prefix for stage element ids |
| stageSelected / intent | `string` / `EmrStageStepperIntent` | — | emitted on click / Enter / Space when selectable |

Keyboard: roving tabindex (one tab stop: last focused enabled stage, else active enabled, else first enabled); Arrow keys move focus skipping disabled stages, Home/End jump to first/last enabled; Enter/Space select. Status is always text, never colour alone.

**Example**
```html
<emr-stage-stepper ariaLabel="Admission journey" [stages]="stages" [activeId]="activeId" (stageSelected)="onStage($event)" />
```

**Depends on** — L0 tokens; `EmrBadge` type from `@drguptavivek/emr-controller`
**Used by** — `EmrStagedChecklistComponent`

---

### EmrSelect
**Layer** L1 · **Selector** `emr-select` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Controlled enumerations (status, urgency, order category, multi-tag clinical attributes) need an accessible custom combobox + listbox bound to a caller-owned `EmrOption[]` list, supporting both single-select and multi-select with chips, grouped options, badges, descriptions, and nullable/clearable states.

**Purpose** — Renders a custom `button[role="combobox"]` + `role="listbox"` (with sibling chips and inline clear button) from `EmrOption[]`. It does not fetch or filter its own option list, and does not interpret option semantics beyond `value`/`label`/`description`/`badge`/`tone`/`group`/`readOnly`/`disabled`.

**API**
```ts
interface EmrSelectProps extends EmrFieldProps {
  value: string | readonly string[] | null;
  options: readonly EmrOption[]; // default []
  multiple?: boolean; // default false
  size?: 'md' | 'sm'; // default 'md'
  variant?: 'outline' | 'filled' | 'subtle'; // default 'outline'
  clearable?: boolean; // default false
  closeOnSelect?: boolean; // default !multiple
  maxSelections?: number;
  maxTagCount?: number;
  loading?: boolean;
  emptyMessage?: string;
}
// @Output() valueChange: EventEmitter<string | readonly string[] | null>
// @Output() cleared: EventEmitter<void>
// @Output() openChange: EventEmitter<boolean>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| value | `string \| readonly string[] \| null` | `null` | single code or array of codes when `multiple` |
| options | `readonly EmrOption[]` | `[]` | supports `description`, `group`, `badge`, `tone`, `readOnly`, `disabled` |
| multiple | `boolean` | `false` | renders removable chips + `+N` overflow badge |
| size | `'md' \| 'sm'` | `'md'` | `44px` minimum hit target preserved |
| variant | `'outline' \| 'filled' \| 'subtle'` | `'outline'` | visual surface variant |
| clearable | `boolean` | `false` | inline clear button preserves `readOnly` selections |
| valueChange (output) | `EventEmitter<EmrSelectValue>` | — | emits updated value or `null` / `[]` |
| cleared (output) | `EventEmitter<void>` | — | emitted on inline clear |
| openChange (output) | `EventEmitter<boolean>` | — | emitted when listbox opens or closes |

**Example**
```html
<emr-select controlId="demo-status" label="Encounter status" [value]="status" [options]="statusOptions"
  [clearable]="true" (valueChange)="status = $event" />
```

**Depends on** — L0 tokens only
**Used by** — `EmrOrderDetails` (L4)

---

### EmrQuantityInput
**Layer** L1 · **Selector** `emr-quantity-input` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Measured quantities (weight, dose, volume) need a value paired with a unit selector, laid out as one field with two coordinated controls, rather than two separately-labelled fields.

**Purpose** — Renders a numeric value input beside a unit `<select>`, both described by the same hint/error region. It performs no unit conversion or clinical range checking — `units` is purely a caller-supplied `EmrOption[]` list.

**API**
```ts
interface EmrQuantityInputProps extends EmrFieldProps {
  value: number | null; // default null
  unit: string | null;  // default null
  units: readonly EmrOption[]; // default [] (supports group, description, disabled)
  mode?: 'decimal' | 'integer'; // default 'decimal'
  precision?: number;
  min?: number;
  max?: number;
  step?: number;
  showSteppers?: boolean; // default true
  size?: 'sm' | 'md' | 'lg'; // default 'md'
  clearable?: boolean; // default false
  unitReadOnly?: boolean; // default false
  warning?: string;
  valueError?: string;
  unitError?: string;
}
// Outputs: valueChange, unitChange, cleared, focused, blurred, submitted
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| value | `number \| null` | `null` | empty numeric input emits `null` |
| unit | `string \| null` | `null` | empty unit selection emits `null`, not `''` |
| units | `readonly EmrOption[]` | `[]` | supports `group`, `description`, `disabled` |
| mode | `'decimal' \| 'integer'` | `'decimal'` | sets `inputmode`, normalizes comma/space drafts |
| precision | `number \| undefined` | `undefined` | decimal rounding & default step (`10 ** -precision`) |
| showSteppers | `boolean` | `true` | `>=44px` `-` / `+` monochrome SVG buttons |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | `'lg'` uses `48px` touch targets |
| clearable | `boolean` | `false` | clears value + editable unit and emits `cleared` |
| unitReadOnly | `boolean` | `false` | locks unit while keeping numeric value editable |
| valueError / unitError / warning | `string` | `''` | per-side `aria-invalid` + `role="alert"` / `role="status"` |
| valueChange / unitChange / cleared / focused / blurred / submitted | outputs | — | |

**Example**
```html
<emr-quantity-input controlId="demo-iop" label="Applanation IOP" [value]="iop" unit="mmHg" [units]="unitOptions"
  [min]="0" [max]="80" [step]="0.5" (valueChange)="iop = $event" (unitChange)="unit = $event" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrPairedInput
**Layer** L1 · **Selector** `emr-paired-input` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Bilateral clinical values (right/left eye visual acuity, systolic/diastolic BP) are conventionally recorded as a labelled pair with a separator glyph between them, not as two independent fields.

**Purpose** — Renders two text inputs with caller-supplied prefix labels and a separator glyph between them. It does not validate that the two values are related or consistent, and does not know which side is "right" vs "left" beyond the label strings it is given.

**API**
```ts
interface EmrPairedInputProps extends EmrFieldProps {
  firstLabel: string;  // default 'First'
  secondLabel: string; // default 'Second'
  firstValue: string;  // default ''
  secondValue: string; // default ''
  separator: string;   // default '/'
  inputType?: 'text' | 'integer' | 'decimal' | 'select';
  firstInputType?: 'text' | 'integer' | 'decimal' | 'select';
  secondInputType?: 'text' | 'integer' | 'decimal' | 'select';
  options?: readonly EmrOption<string>[];
  firstOptions?: readonly EmrOption<string>[];
  secondOptions?: readonly EmrOption<string>[];
}
// @Output() firstValueChange: EventEmitter<string>
// @Output() secondValueChange: EventEmitter<string>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| firstLabel / secondLabel | `string` | `'First'` / `'Second'` | rendered as prefix glyphs and folded into each input's `aria-label` |
| firstValue / secondValue | `string` | `''` | |
| separator | `string` | `'/'` | rendered between the two inputs, `aria-hidden` |
| inputType / firstInputType / secondInputType | `'text' \| 'integer' \| 'decimal' \| 'select'` | `'text'` | per-side text/numeric or `<emr-select>` dropdown mode |
| options / firstOptions / secondOptions | `readonly EmrOption<string>[]` | `[]` | shared or per-side dropdown items when side mode is `'select'` |
| firstValueChange / secondValueChange (outputs) | `EventEmitter<string>` | — | |

Note: unlike the other five `EmrFieldBase` subclasses, `EmrPairedInput` does not use `inputId`/`placeholder`/`required` from the base in its template beyond deriving `${inputId}-first`/`${inputId}-second` ids, and it renders `hint`/`error` without wiring `aria-describedby`.

**Example**
```html
<emr-paired-input inputId="demo-pair" label="Visual acuity" firstLabel="OD" secondLabel="OS"
  [firstValue]="od" [secondValue]="os" separator="/" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrCheckbox
**Layer** L1 · **Selector** `emr-checkbox` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Boolean flags (fasting required, consent obtained) need a labelled checkbox with a controlled boolean value.

**Purpose** — Renders a controlled checkbox with tile (`variant="tile"`) or compact inline (`variant="inline"`) layout, tri-state (`mixed`) support, optional `description` sub-copy, `labelPlacement`, and simultaneous `hint`/`warning`/`error` messaging.

**API**
```ts
interface EmrCheckboxProps {
  controlId?: string;
  label?: string;
  description?: string;
  labelHidden?: boolean;
  ariaLabel?: string;
  variant?: 'tile' | 'inline'; // default 'tile'
  size?: 'md' | 'sm'; // default 'md'
  labelPlacement?: 'end' | 'start' | 'space-between'; // default 'end'
  value?: boolean | null;
  checked?: boolean;
  mixed?: boolean; // default false (aria-checked="mixed")
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  hint?: string;
  warning?: string;
  error?: string;
}
// Outputs: valueChange, checkedChange, focused, blurred
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| label | `string` | `''` | wraps cleanly across lines |
| description | `string` | `''` | optional muted sub-copy below label |
| variant / size | `'tile' \| 'inline'` / `'md' \| 'sm'` | `'tile'` / `'md'` | `>=44px` hit target on all variants |
| value / checked | `boolean \| null` | `false` | `value` takes precedence over `checked` |
| mixed | `boolean` | `false` | sets `aria-checked="mixed"`; clicking emits `true` |
| labelPlacement | `'end' \| 'start' \| 'space-between'` | `'end'` | |
| valueChange / checkedChange | `boolean` | — | |
| focused / blurred | `void` | — | |
| checked | `boolean` | `false` | |
| disabled | `boolean` | `false` | |
| checkedChange (output) | `EventEmitter<boolean>` | — | |

**Example**
```html
<emr-checkbox label="Fasting required" [checked]="fasting" (checkedChange)="fasting = $event" />
```

**Depends on** — L0 tokens only
**Used by** — `EmrOrderDetails` (L4)

---

### EmrToggle
**Layer** L1 · **Selector** `emr-toggle` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — On/off preferences (show only active orders) read more clearly as a switch than a checkbox in list-toolbar contexts.

**Purpose** — Renders a `role="switch"` control with tile (`variant="tile"`) or compact inline (`variant="inline"`) layout, `md`/`sm` sizing, `onLabel`/`offLabel` state labels, `description`, `labelPlacement`, `loading` (spinner in thumb + `aria-busy`), `invalid`, and simultaneous `hint`/`warning`/`error` messaging.

**API**
```ts
interface EmrToggleProps {
  controlId?: string;
  label?: string;
  description?: string;
  labelHidden?: boolean;
  ariaLabel?: string;
  variant?: 'tile' | 'inline'; // default 'tile'
  size?: 'md' | 'sm'; // default 'md'
  labelPlacement?: 'end' | 'start' | 'space-between'; // default 'end'
  onLabel?: string;
  offLabel?: string;
  value?: boolean | null;
  checked?: boolean;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  loading?: boolean;
  invalid?: boolean;
  hint?: string;
  warning?: string;
  error?: string;
}
// Outputs: checkedChange, valueChange, focused, blurred
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| label / description | `string` | `''` | wraps cleanly across lines; hidden with messages when `labelHidden` |
| variant / size | `'tile' \| 'inline'` / `'md' \| 'sm'` | `'tile'` / `'md'` | `42×24` (`md`) / `38×22` (`sm`) track; `>=44px` hit target |
| onLabel / offLabel | `string` | `''` | rendered adjacent to the track |
| value / checked | `boolean \| null` | `false` | `value` takes precedence over `checked` |
| loading / invalid | `boolean` | `false` | `loading` gates mutation + shows thumb spinner; `invalid` forces danger styling |
| checkedChange / valueChange | `boolean` | — | |
| focused / blurred | `void` | — | |

**Example**
```html
<emr-toggle label="One-eyed precaution active" [checked]="precaution" (checkedChange)="precaution = $event" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrRadioGroup
**Layer** L1 · **Selector** `emr-radio-group` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Mutually-exclusive single-choice sets (urgency: routine/urgent/STAT) need a native `<fieldset>`/radio group with correct grouping semantics.

**Purpose** — Renders a `<fieldset>` with a `<legend>` and one radio per `EmrOption`. It does not support option-level custom rendering beyond `label`.

**API**
```ts
interface EmrRadioGroupProps {
  controlId?: string;
  name?: string;
  label: string;
  ariaLabel?: string;
  labelHidden?: boolean;
  value: string | null; // default null
  options: readonly EmrOption[]; // supports description, disabled, readOnly, badge, tone, group
  orientation?: 'vertical' | 'horizontal' | 'grid'; // default 'vertical'
  columns?: number; // default 2 (when orientation='grid')
  variant?: 'tile' | 'inline' | 'card' | 'pill' | 'segmented'; // default 'tile'
  size?: 'md' | 'sm'; // default 'md'
  labelPlacement?: 'end' | 'start' | 'space-between'; // default 'end'
  clearable?: boolean; // default false
  clearLabel?: string; // default 'Clear'
  allowDeselect?: boolean; // default false
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  hint?: string;
  warning?: string;
  error?: string;
}
// Outputs: valueChange, cleared, focused, blurred
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| value | `string \| null` | `null` | `null` when unselected or cleared |
| options | `readonly EmrOption[]` | `[]` | supports `description`, `disabled`, `readOnly`, `badge`, `tone`, `group` |
| orientation / columns | `'vertical' \| 'horizontal' \| 'grid'` / `number` | `'vertical'` / `2` | grid collapses to 1 col on mobile |
| variant / size | `'tile' \| 'inline' \| 'card' \| 'pill' \| 'segmented'` / `'md' \| 'sm'` | `'tile'` / `'md'` | `>=44px` hit target on all options |
| clearable / allowDeselect | `boolean` | `false` | optional reset to `null` |
| valueChange / cleared / focused / blurred | outputs | — | |

**Example**
```html
<emr-radio-group controlId="triage" label="Referral triage priority" [value]="priority" [options]="priorityOptions"
  (valueChange)="priority = $event" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrBadge
**Layer** L1 · **Selector** `emr-badge` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Compact status labels (Completed, Review, Allergy) need a consistent tone-coded pill that always pairs colour with text.

**Purpose** — Renders projected content inside a tone-coded pill span. Carries no interactivity and interprets nothing about what tone "means" clinically — tone is a purely presentational input chosen by the caller.

**API**
```ts
import { EmrBadge, EmrTone } from '@drguptavivek/emr-controller';
interface EmrBadgeProps {
  badge?: EmrBadge;
  tone?: EmrTone;        // 'neutral' | 'info' | 'success' | 'warning' | 'danger'; default 'neutral'
  label?: string;
  variant?: 'soft' | 'solid' | 'outline'; // default 'soft'
  size?: 'sm' | 'md';    // default 'md' (20px / 24px)
  shape?: 'pill' | 'rounded'; // default 'pill'
  icon?: string;         // optional leading monochrome SVG icon
  dot?: boolean;         // leading tonal status dot (or dot-only when empty)
  count?: number;        // numeric counter formatted with maxCount / showZero
  maxCount?: number;     // default 99
  showZero?: boolean;    // default false
  assistiveText?: string;
  controlId?: string;
}
// content via label, count, or <ng-content />, no outputs
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| tone | `EmrTone` | `'neutral'` | maps to `.emr-tone-*` |

**Example**
```html
<emr-badge tone="danger">Allergy</emr-badge>
```

**Depends on** — L0 tokens only
**Used by** — `EmrSectionCard` (L3)

---

### EmrChip
**Layer** L1 · **Selector** `emr-chip` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Same need as `EmrBadge` but for denser, list-style tags (e.g. condition chips in a chip row) rather than single status pills.

**Purpose** — Structurally identical to `EmrBadge` (tone-coded pill around projected content); the only difference is the `.emr-chip` class (`font-weight: 600` vs. badge's `700`) and its typical use inside `.emr-chip-row`.

**API**
```ts
interface EmrChipProps {
  controlId?: string;
  label?: string;
  ariaLabel?: string;
  tone: EmrTone;                           // default 'neutral'
  variant: 'soft' | 'solid' | 'outline';   // default 'soft'
  size: 'sm' | 'md';                       // default 'md'
  leadingIcon?: string;
  avatar?: string;
  selectable: boolean;                     // default false
  selected: boolean;                       // default false
  removable: boolean;                      // default false
  removeLabel?: string;
  disabled: boolean;                       // default false
  readOnly: boolean;                       // default false
}
// outputs: selectedChange (boolean), removeRequested (void)
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| tone | `EmrTone` | `'neutral'` | maps to `.emr-tone-*` |

**Example**
```html
<emr-chip tone="info">Diabetes</emr-chip>
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrAlert
**Layer** L1 · **Selector** `emr-alert` · **Status** stable · **Story** `foundations-primitives--feedback-states`

**Need** — Inline banner-style notices (informational, review-required, safety) need a consistent title + body layout with `role="status"` announcement.

**Purpose** — Renders a tone-coded, left-accented banner with a title and projected body content. It does not auto-dismiss, queue, or stack itself — placement and lifecycle are entirely caller-managed.

**API**
```ts
interface EmrAlertProps {
  tone: EmrTone; // default 'info'
  title: string; // default ''
}
// content via <ng-content /> (alert body), no outputs
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| tone | `EmrTone` | `'info'` | |
| title | `string` | `''` | rendered bold above the projected body |

Note: template always sets `role="status"` regardless of tone — even `tone="danger"` alerts use `role="status"`, not `role="alert"`.

**Example**
```html
<emr-alert tone="danger" title="Safety alert">Penicillin allergy is recorded.</emr-alert>
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrStateMessage
**Layer** L1 · **Selector** `emr-state-message` · **Status** stable · **Story** `foundations-primitives--feedback-states`

**Need** — Empty/loading/error placeholder states recur across every list, table, and matrix in the catalogue and need one consistent, centred presentation with correct ARIA role per kind.

**Purpose** — Renders a centred title + optional message + projected extra content, with `role="alert"` for `kind="error"` and `role="status"` otherwise. It carries no retry/loading-spinner behaviour of its own.

**API**
```ts
interface EmrStateMessageProps {
  controlId?: string;
  kind: 'empty' | 'loading' | 'error'; // default 'empty'
  title: string;                       // falls back to EMR_STATE_MESSAGE_DEFAULTS
  message: string;                     // default ''
  size: 'sm' | 'md';                   // default 'md'
  compact: boolean;                    // default false
  icon?: string;                       // monochrome SVG icon override, or 'none'
  actionLabel: string;                 // default ''
  actionDisabled: boolean;             // default false
}
// output: actionTriggered (void), optional projected content
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| kind | `'empty' \| 'loading' \| 'error'` | `'empty'` | drives `role` only ("error" → `role="alert"`); no other visual difference by kind in this component's own CSS |
| title | `string` | `''` | |
| message | `string` | `''` | rendered only if non-empty |

**Example**
```html
<emr-state-message kind="error" title="Unable to load" message="Retry when the service is available." />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrSearchSelect
**Layer** L1 · **Selector** `emr-search-select` · **Status** stable · **Story** `foundations-primitives--search-single` (also covered by `foundations-primitives--search-multi-select`)

**Need** — Terminology/medication/test lookups need an accessible search-then-select combobox with single- and multi-select modes, keyboard listbox navigation, and a chip row for existing multi-select selections — without the component itself performing any search.

**Purpose** — Renders a search input + button + optional results listbox, entirely from caller-supplied `options`/`selected`/`open`/`loading` state; emits intents (`queryChanged`, `searchRequested`, `openRequested`, `closeRequested`, `optionSelected`, `removeRequested`) for the controller to fulfil. It performs zero actual searching, debouncing, or HTTP calls — every keystroke and click only emits an intent.

**API**
```ts
// Signal inputs/outputs (input()/output())
interface EmrSearchSelectProps {
  controlId?: string;
  label: string;                            // default 'Search'
  ariaLabel?: string;
  labelHidden: boolean;                     // default false
  placeholder: string;                      // default 'Type to search'
  variant: 'outline' | 'filled' | 'subtle'; // default 'outline'
  size: 'md' | 'sm' | 'lg';                 // default 'md' ('lg' fallback)
  multiple: boolean;                        // default false
  value?: string | readonly string[] | null;
  selected: readonly EmrOption[];           // default []
  options: readonly EmrOption[];            // default []
  maxSelections?: number;
  maxTagCount?: number;
  closeOnSelect?: boolean;                  // defaults to !multiple
  clearable: boolean;                       // default false
  clearLabel: string;                       // default 'Clear'
  query: string;                            // default '' (alias: searchQuery)
  filterMode: 'remote' | 'local' | 'none';  // default 'remote'
  highlightMatch: boolean;                  // default true
  autoHighlight: boolean;                   // default true
  debounceMs: number;                       // default 200
  minQueryLength: number;                   // default 0
  open?: boolean;                           // controlled when provided; uncontrolled otherwise
  creatable: boolean;                       // default false (aliases: allowCreate, allowCustomValue)
  createLabel: string;                      // default 'Create "{query}"'
  loading: boolean;                         // default false
  loadingMessage: string;                   // default 'Searching…'
  emptyMessage: string;                     // default 'No matching options'
  required: boolean;                        // default false
  readOnly: boolean;                        // default false
  disabled: boolean;                        // default false
  invalid: boolean;                         // default false
  hint: string;                             // default ''
  warning: string;                          // default ''
  error: string;                            // default ''
}
// outputs: valueChange, queryChange, queryChanged, searchRequested, openChange,
// openRequested, closeRequested, optionSelected, removeRequested, selectionRemoved,
// createRequested, customValueCommitted, cleared, focused, blurred, submitted
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| inputId | `string` | `'emr-search'` | |
| label | `string` | `'Search'` | |
| labelHidden | `boolean` | `false` | keeps the label for assistive tech but hides it visually, for use inside a frame that already shows a label (e.g. `EmrCodedInput`) |
| placeholder | `string` | `'Type to search'` | |
| query | `string` | `''` | |
| options | `readonly EmrOption[]` | `[]` | rendered inside the listbox panel when `open` |
| selected | `readonly EmrOption[]` | `[]` | rendered as removable chips when `multiple && selected.length` |
| multiple | `boolean` | `false` | shows chip row and sets `aria-multiselectable` |
| open | `boolean` | `false` | controls listbox panel visibility |
| loading | `boolean` | `false` | swaps search button label to "Searching…" |
| disabled | `boolean` | `false` | |
| error | `string` | `''` | rendered with `role="alert"` |
| emptyMessage | `string` | `'No matching options'` | shown when `!loading && options.length === 0` |

Keyboard support: ArrowDown/ArrowUp move option focus, Home/End jump to first/last, Escape emits `closeRequested`.

**Example**
```html
<emr-search-select inputId="med-search" label="Medication" [options]="options" [selected]="selected" [open]="isOpen"
  (queryChanged)="onQuery($event)" (searchRequested)="onSearch()" (optionSelected)="onSelect($event)" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrTabs
**Layer** L1 · **Selector** `emr-tabs` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Sectioned views (patient overview/orders/history, favourites categories) need a WAI-ARIA-compliant tablist with roving-tabindex keyboard navigation, not just styled buttons.

**Purpose** — Renders a `role="tablist"` of buttons from `EmrOption[]`, manages `tabindex`/`aria-selected`, and implements ArrowLeft/ArrowRight/Home/End navigation among enabled tabs. It does not render or manage any associated tab panel content — the caller owns what's shown for the `active` value.

**API**
```ts
interface EmrTabsProps {
  controlId?: string;
  ariaLabel?: string; // default 'Sections'
  ariaLabelledBy?: string;
  tabs: readonly EmrTabOption[]; // default [] (supports icon, badge, badgeTone, panelId, disabled)
  value?: string;
  active?: string; // deprecated alias for value
  variant?: 'underline' | 'pill' | 'soft'; // default 'underline'
  size?: 'sm' | 'md' | 'lg'; // default 'md' (all sizes >=44px)
  orientation?: 'horizontal' | 'vertical'; // default 'horizontal'
  fitted?: boolean; // default false
  activationMode?: 'automatic' | 'manual'; // default 'automatic'
  loop?: boolean; // default true
  iconPosition?: 'start' | 'end'; // default 'start'
  readOnly?: boolean;
  disabled?: boolean;
}
// Outputs: valueChange, tabChange, focused, blurred (tabChanged deprecated)
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| ariaLabel | `string` | `'Sections'` | sets `aria-label` on the tablist |
| tabs | `readonly EmrTabOption[]` | `[]` | per-tab `disabled`, `icon`, `badge`, `panelId` |
| value / active | `string` | `''` | matched against each tab's `value` for `aria-selected`/`tabindex` |
| variant / size | `'underline' \| 'pill' \| 'soft'` / `'sm' \| 'md' \| 'lg'` | `'underline'` / `'md'` | |
| valueChange / tabChange | `string` | — | emitted on click or keyboard activation |
| focused / blurred | `void` | — | |

**Example**
```html
<emr-tabs ariaLabel="Encounter sections" [value]="section" [tabs]="tabOptions" (valueChange)="section = $event" />
```

**Depends on** — L0 tokens only
**Used by** — `EmrFavouritesPanel` (L4)

---

### EmrSeparator
**Layer** L1 · **Selector** `emr-separator` · **Status** stable · **Story** `foundations-layout-primitives--separators`

**Need** — Sections need a consistent visual divider — plain rule, labelled rule, or vertical inline divider — instead of ad hoc borders scattered through consumer markup.

**Purpose** — Renders a `role="separator"` divider: a plain horizontal rule, a centred-label rule (`label` set), or a vertical rule (`orientation="vertical"`). Purely decorative structure; no state or interaction.

**API**
```ts
export type EmrSeparatorOrientation = 'horizontal' | 'vertical';
export type EmrSeparatorLabelAlign = 'start' | 'center' | 'end';
export type EmrSeparatorVariant = 'solid' | 'dashed' | 'subtle';
interface EmrSeparatorProps {
  controlId?: string;
  orientation: EmrSeparatorOrientation; // default 'horizontal'
  label?: string;                       // horizontal only
  labelAlign: EmrSeparatorLabelAlign;   // default 'center'
  variant: EmrSeparatorVariant;         // default 'solid'
  decorative: boolean;                  // default false
}
// no outputs
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| orientation | `'horizontal' \| 'vertical'` | `'horizontal'` | ignored when `label` is set (labelled variant is always horizontal) |
| label | `string \| undefined` | `undefined` | when present, renders the labelled two-line variant instead of the plain rule |

**Example**
```html
<emr-separator label="Clinical history" />
<emr-separator orientation="vertical" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrLikert
**Layer** L1 · **Selector** `emr-likert` · **Status** stable · **Story** `foundations-likert-scale--pain-score` (also `--unselected`, `--all-zones`, `--custom-range`, `--with-error`, `--read-only`, `--disabled`)

**Need** — Numeric rating scales (pain score 0–10, satisfaction 1–5) are a recurring clinical-assessment input shape that needs correct radiogroup semantics, per-point ARIA labelling, and an optional anchor-label row, without hardcoding the pain-severity meaning into every consumer.

**Purpose** — Renders a `<fieldset>`/`<legend>` numeric rating scale as a row of radio "pips" between `min` and `max`, with optional min/max anchor labels. The selected pip is coloured only by the controller-supplied `tone` input (`EmrTone`); the primitive never derives a severity from the number, so a 5/5 muscle-strength score and a 10/10 pain score are toned by the controllers that know what they mean.

**API**
```ts
export interface EmrLikertAnchor {
  value: number;
  label: string;
  assistiveLabel?: string;
}

// Signal-based inputs
interface EmrLikertProps {
  controlId?: string;
  name?: string;
  label?: string;
  ariaLabel?: string;
  labelHidden?: boolean;
  hint?: string;
  warning?: string;
  error?: string;
  invalid?: boolean;
  min?: number; // default 0
  max?: number; // default 10
  step?: number; // default 1
  size?: 'sm' | 'md' | 'lg'; // default 'md'
  fullWidth?: boolean; // default false
  value: number | null; // default null
  anchors?: readonly EmrLikertAnchor[];
  clearable?: boolean; // default false
  clearLabel?: string; // default 'Clear'
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  tone?: EmrTone;
  optionTones?: Readonly<Record<number, EmrTone>>;
}
// Outputs: valueChange, cleared, focused, blurred
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| name | `string` | `''` | native radio grouping name; empty → unique per-instance id, so two likerts never share a group |
| label | `string` | `''` | rendered as `<legend>` |
| min / max | `number` | `0` / `10` | defines the generated point range (inclusive) |
| value | `number \| null` | `null` | |
| anchors | `readonly EmrLikertAnchor[]` | `[]` | only anchors matching exactly `min` or `max` are rendered |
| disabled | `boolean` | `false` | suppresses anchor row entirely when true |
| readOnly | `boolean` | `false` | blocks selection via `aria-readonly` + click prevention; inputs stay focusable and announceable (not `disabled`) |
| tone | `EmrTone \| undefined` | `undefined` | colours the selected pip (`data-tone`); undefined → neutral outline only |
| required | `boolean` | `false` | shows `*` plus an `.emr-sr-only` "Required" announcement |
| valueChange (output) | `EventEmitter<number>` | — | only emitted when neither `disabled` nor `readOnly` |

Implements `OnChanges` to regenerate the point array and resolved min/max anchors whenever inputs change.

**Example**
```html
<emr-likert name="pain" label="Pain score (0–10)" [min]="0" [max]="10" [value]="painScore"
  [anchors]="[{ value: 0, label: 'No pain' }, { value: 10, label: 'Worst pain' }]"
  (valueChange)="painScore = $event" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrVas
**Layer** L1 · **Selector** `emr-vas` · **Status** stable · **Story** `foundations-vas-scale--pain-vas` (also `--health-thermometer`, `--unmarked`, `--read-only-vas`, `--interactive`, `--with-error`, `--disabled-vas`)

**Need** — A visual analogue scale is a different instrument from a Likert scale: the respondent marks a point anywhere along a continuous line rather than choosing one of N discrete pips. Both the horizontal 0–10 form and the vertical 0–100 EQ-5D-5L health thermometer are recurring instruments, and both need a ruler — major markers every *X*, minor markers every *Y* — that a finger can land on anywhere.

**Purpose** — Renders a continuous track with arithmetic tick positions, a recorded mark and thumb, and optional end anchors. Pointer input is captured (`setPointerCapture`), so a stroke that leaves the track keeps tracking and cannot resume on re-entry; keyboard input follows the ARIA slider pattern. `orientation="vertical"` reads bottom-up: `min` at the bottom, `max` at the top. The component derives no clinical meaning — it does not know whether a high number is good or bad, does not compute severity, and never labels an unset scale; `anchors`, `tone` and `valueText` are controller-supplied, and an unmarked scale simply omits `aria-valuenow`.

**API**
```ts
export interface EmrVasAnchor {
  value: number;          // typically min or max
  label: string;
  assistiveLabel?: string;
}

// Signal inputs/outputs (input()/output())
interface EmrVasProps {
  controlId?: string;
  label: string;          // default ''
  ariaLabel?: string;
  labelHidden: boolean;   // default false
  hint?: string;
  warning?: string;
  error?: string;
  invalid: boolean;       // default false
  min: number;            // default 0
  max: number;            // default 100
  value: number | null;   // default null
  step?: number;          // default resolves to 0.1 when span <= 20, else 1; 0 records continuous
  majorInterval: number;  // default 10 — labelled markers
  minorInterval: number;  // default 2  — unlabelled markers
  orientation: 'horizontal' | 'vertical';  // default 'horizontal'
  size: 'sm' | 'md' | 'lg';                // default 'md'
  anchors: readonly EmrVasAnchor[] | { minLabel?: string; midLabel?: string; maxLabel?: string };
  showValue: boolean;     // default true
  unmarkedLabel: string;  // default 'Unmarked'
  clearable: boolean;     // default false
  clearLabel: string;     // default 'Clear'
  readOnly: boolean;      // default false
  disabled: boolean;      // default false
  required: boolean;      // default false
  tone?: EmrTone;         // controller-supplied colour for the recorded mark
  valueText?: string;     // controller-supplied aria-valuetext
}
// outputs: valueChange, committed, cleared, focused, blurred
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| controlId | `string` | `'emr-vas'` | ids the slider and derives the label/hint/error ids |
| min / max | `number` | `0` / `100` | scale bounds; vertical renders `min` at the bottom |
| value | `number \| null` | `null` | `null` omits `aria-valuenow` rather than inventing a value |
| step | `number` | `1` | snap granularity; `0` keeps the raw position (4 dp) |
| majorInterval | `number` | `10` | labelled tick spacing; also the PageUp/PageDown increment |
| minorInterval | `number` | `2` | unlabelled tick spacing; tick count is capped at 400 |
| orientation | `'horizontal' \| 'vertical'` | `'horizontal'` | sets `aria-orientation` and the axis geometry |
| tone | `EmrTone \| undefined` | `undefined` | colours the recorded mark; the primitive derives no severity |
| valueText | `string \| undefined` | `undefined` | `aria-valuetext`, e.g. `'72 out of 100'` |
| readOnly | `boolean` | `false` | stays focusable and announceable; input is ignored |
| disabled | `boolean` | `false` | removes it from the tab order |
| valueChange (output) | `number \| null` | — | only emitted when neither `disabled` nor `readOnly`, and only on an actual change |

**Keyboard** — `ArrowRight`/`ArrowUp` +`step`, `ArrowLeft`/`ArrowDown` −`step`, `PageUp`/`PageDown` ±`majorInterval`, `Home` → `min`, `End` → `max`.

**Example**
```html
<emr-vas
  controlId="vas-health"
  label="Your health today"
  orientation="vertical"
  [min]="0" [max]="100" [step]="1"
  [majorInterval]="10" [minorInterval]="5"
  [value]="healthToday"
  valueText="72 out of 100"
  [anchors]="healthAnchors"
  (valueChange)="healthToday = $event" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrCard
**Layer** L1 · **Selector** `emr-card` · **Status** stable · **Story** `foundations-layout-primitives--single-card`

**Need** — Every clinical panel needs a consistent bordered surface with an optional heading, without re-declaring the same card chrome CSS in every consumer.

**Purpose** — A single-surface wrapper (optional title bar + padded body) around projected content. It owns no data and no collapse/expand state — purely a layout shell.

**API**
```ts
interface EmrCardProps {
  controlId?: string;
  label?: string;                              // optional card title (aliases: title, cardTitle)
  subtitle?: string;                           // optional muted header line
  headingId?: string;
  ariaLabel?: string;
  variant: 'outlined' | 'elevated' | 'filled' | 'subtle'; // default 'outlined'
  padding: 'none' | 'sm' | 'md' | 'lg';       // default 'md'
  padded: boolean;                             // default true (false forces padding='none')
  tone: EmrTone;                               // default 'neutral'
  interactive: boolean;                        // default false
  selected: boolean;                           // default false
  disabled: boolean;                           // default false
  readOnly: boolean;                           // default false
}
// output: activated (void), slots: default body, [emrCardHeader] / header, [emrCardFooter] / footer
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| label | `string \| undefined` | `undefined` | omit for a headerless card |
| padded | `boolean` | `true` | `false` applies `.emr-card--flush` (zero body padding) |

**Example**
```html
<emr-card label="Vitals">
  <p>Projected content.</p>
</emr-card>
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrColumns
**Layer** L1 · **Selector** `emr-columns` · **Status** stable · **Story** `foundations-layout-primitives--two-column`

**Need** — Side-by-side clinical panels (right eye / left eye, assessment / plan / follow-up) need equal-height CSS-grid columns that collapse to one column on narrow screens, without hand-writing grid-template-columns per screen.

**Purpose** — A thin wrapper that sets `grid-template-columns` (and `gap`) on its host from either an explicit `widths` array or a `count`. It performs no responsive logic itself beyond the shared `.emr-columns` media-query rule in `emr.css`, which forces a single column under 768px.

**API**
```ts
export type EmrColumnsAlign = 'stretch' | 'start' | 'center' | 'end';
interface EmrColumnsProps {
  controlId?: string;
  count: number;                            // default 2 (clamped 1..6; alias: columns)
  widths?: readonly (number | string)[];    // explicit track sizes, overrides count
  gap: number | string;                     // default 16 / '16px'
  align: EmrColumnsAlign;                   // default 'stretch'
  collapseBelow: number;                    // default 640 (0 disables stacking)
}
// content via <ng-content />, no outputs
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| count | `number` | `2` | ignored when `widths` is provided and non-empty |
| widths | `readonly string[] \| undefined` | `undefined` | joined with spaces as `grid-template-columns` |
| gap | `string` | `'16px'` | any valid CSS `gap` value |

**Example**
```html
<emr-columns [widths]="['2fr','1fr','1fr']">
  <emr-card label="Assessment">…</emr-card>
  <emr-card label="Plan">…</emr-card>
  <emr-card label="Follow-up">…</emr-card>
</emr-columns>
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrFieldValueRow
**Layer** L1 · **Selector** `emr-field-value-row` · **Status** stable · **Story** `foundations-layout-primitives--field-value-remarks-notes`

**Need** — Tabular clinical findings (field / value / remarks / notes) recur across assessments and need one aligned four-column row primitive that also degrades gracefully to a stacked, labelled layout on narrow screens.

**Purpose** — Renders one `role="row"` with four semantic cells (`role="columnheader"` on heading rows; `role="rowheader"` for `field` and `role="cell"` for `value`, `remarks`, `notes` on data rows). It performs no computation, formatting, or clinical value interpretation — `value`/`remarks`/`notes` and `tone` are caller-supplied.

**API**
```ts
interface EmrFieldValueRowProps {
  controlId?: string;
  field: string;                         // default ''
  value: string | number | null;         // default '' (empty/null/undefined falls back to placeholder when !heading)
  remarks?: string | null;               // default ''
  notes?: string | null;                 // default ''
  heading?: boolean;                     // default false
  placeholder?: string;                  // default '—'
  tone?: EmrTone;                        // default 'neutral'
  size?: 'sm' | 'md' | 'lg';             // default 'md'
  truncate?: boolean;                    // default false
  interactive?: boolean;                 // default false
  readOnly?: boolean;                    // default false
  ariaLabel?: string;
}
// outputs: activated / intent ({ type: 'rowActivated', id?: string }) when interactive && !readOnly
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| field | `string` | `''` | rendered in the styled "field" cell (`.emr-fvr__field`, `rowheader` on data rows) |
| value | `string \| number \| null` | `''` | numeric `0` renders `'0'`; empty/whitespace/null falls back to `placeholder` when `!heading` |
| remarks / notes | `string \| null` | `''` | secondary/tertiary metadata columns |
| heading | `boolean` | `false` | renders the styled column-title row (`columnheader`) and suppresses `placeholder` fallback |
| placeholder | `string` | `'—'` | shown in muted text in place of an empty `value` on non-heading rows |
| tone | `EmrTone` | `'neutral'` | caller-supplied semantic tint on non-placeholder `value` text (`info \| success \| warning \| danger \| neutral`) |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | row density (`36px` / `44px` / `48px` minimum cell height) |
| truncate | `boolean` | `false` | single-line ellipsis truncation instead of wrapping |
| interactive / readOnly | `boolean` | `false` | enables click/Enter/Space `activated` & `intent` emission (`readOnly` suppresses emission with `aria-readonly="true"`) |

On narrow screens (`max-width: 767px`) each cell renders its `data-label` (Field/Value/Remarks/Notes) as an inline prefix via `::before`, and the dedicated heading row is hidden.

**Example**
```html
<div role="table" aria-label="Clinical findings">
  <emr-field-value-row heading field="Field" value="Value" remarks="Remarks" notes="Notes" />
  <emr-field-value-row field="Intraocular pressure" value="18 mmHg" remarks="Within range" notes="Rechecked at 11:20" />
</div>
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally


---

### EmrStatTile
**Layer** L1 · **Selector** `emr-stat-tile` · **Status** stable · **Story** `emr-primitives-stat-tile--four-kpi-row`

**Need** — Dashboards, desk headers, and privacy centres need a compact count/KPI card that opens the backing list when tapped without the UI ever counting, rounding, or picking a severity tone.

**Purpose** — Renders an `EmrStatTileModel` (`key`, `label`, `value`, optional `trend`, `sub`, and `status` badge). When `interactive` is true and not `readOnly`/`disabled`/`loading`, it renders a `<button type="button">` emitting `{ type: 'statSelected', key }`; otherwise it renders a static `<div role="group">`.

**API**
```ts
export class EmrStatTileComponent {
  readonly model = input.required<EmrStatTileModel>();
  readonly tone = input<EmrTone | undefined>(undefined);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly interactive = input(true);
  readonly selected = input(false);
  readonly loading = input(false);
  readonly readOnly = input(false);
  readonly disabled = input(false);
  readonly controlId = input<string>();
  readonly ariaLabel = input<string>();
  readonly intent = output<EmrStatTileIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `EmrStatTileModel` (required) | — | key, label, value, trend, sub, status, tone, accessibilityLabel |
| `tone` | `EmrTone` | `model.tone ?? 'neutral'` | surface border accent (`neutral \| info \| success \| warning \| danger`) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | tile density (`72px` / `88px` / `104px` min-height) |
| `interactive` | `boolean` | `true` | renders as `<button>` when true and enabled (`aria-pressed` synced to `selected`) |
| `selected` | `boolean` | `false` | primary highlight border/surface and `aria-pressed` |
| `loading` | `boolean` | `false` | renders skeleton placeholders with `aria-busy="true"` |
| `readOnly` / `disabled` | `boolean` | `false` | `readOnly` renders dashed border static group; `disabled` dims and blocks interaction |
| `controlId` / `ariaLabel` | `string \| undefined` | `undefined` | optional DOM id and accessible name override |
| `intent` (output) | `OutputEmitterRef<EmrStatTileIntent>` | — | `{ type: 'statSelected', key }` |

**Example**
```html
<emr-stat-tile [model]="tile" (intent)="onTileSelected($event)" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrToast
**Layer** L1 · **Selector** `emr-toast` · **Status** stable · **Story** `emr-shell-and-auth--toast-default`, `foundations-building-blocks--feedback-and-overlays`

**Need** — Transient clinical confirmations and warning notifications need a controlled toast banner with no internal timer, an optional action button, and a dismiss button usable at any layer.

**Purpose** — Renders `EmrToastModel` (`tone`, `message`, optional `actionLabel`, `dismissLabel`) with `role="alert"` on `danger`/`warning` tones and `role="status"` otherwise, emitting `EmrToastIntent` (`actionRequested`, `dismissRequested`). Promoted from L4 to L1 with a backwards-compatible re-export from `domain/emr-mobile-and-web-shell.component.ts`.

**Depends on** — L0 tokens only
**Used by** — shell overlays and notifications

---

### EmrTextarea
**Layer** L1 · **Selector** `emr-textarea` · **Status** stable · **Story** `foundations-building-blocks--text-and-inputs`

**Need** — Clinical narratives, examination remarks, and free-text instructions require a multi-line `<textarea>` primitive with row sizing, character counter, and shared `EmrFieldBase` label/hint/error/readOnly semantics.

**Purpose** — Renders a controlled `<textarea>` with `rows`, optional `maxLength` character counter, `controlId`, `label`, `hint`, `error`, `required`, `disabled`, and `readOnly`, emitting `valueChange` (`string`) and `blurred`.

**Depends on** — L0 tokens only
**Used by** — `EmrMacroTextField` (L2)

---

### EmrIconButton
**Layer** L1 · **Selector** `emr-icon-button` · **Status** stable · **Story** `foundations-building-blocks--actions-and-navigation`

**Need** — Dense clinical toolbars, row actions, and overlay headers need a 44×44px accessible icon-only button that enforces an explicit `label` (`aria-label`).

**Purpose** — Renders a square accessible `<button>` with `icon`, required `label`, `variant`, `size`, `pressed` (`aria-pressed`), `disabled`, and `loading`, emitting `clicked`.

**Depends on** — L0 tokens only
**Used by** — toolbars, overlays, and action rows

---

### EmrSegmentedControl
**Layer** L1 · **Selector** `emr-segmented-control` · **Status** stable · **Story** `foundations-building-blocks--choice-and-selection`

**Need** — High-speed 2–5 option clinical toggles (OD/OS/OU, Inpatient/Outpatient/ED, Snellen/LogMAR) need a compact segmented control with full parity, rich option metadata, validation, and keyboard navigation.

**Purpose** — Renders a segmented `radiogroup` over `EmrSegmentedOption[]` (`value`, `label`, optional `description`, `icon`, `badge`, `tone`, `disabled`, `readOnly`, `ariaLabel`). Supports `size` (`md` | `sm`), `variant` (`default` | `outline` | `soft`), `shape` (`default` | `pill`), `orientation` (`horizontal` | `vertical`), `fullWidth`, `clearable` (`clearLabel`), `allowDeselect`, `required`, `invalid`, `warning`, `error`, `hint`, `labelHidden`, `readOnly`, and `disabled`. Supports `ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`/`Home`/`End` roving focus (keeping `readOnly` options arrow-navigable without mutation) and `Space`/`Enter` selection/deselection, emitting `valueChange`, `cleared`, `focused`, and `blurred`.

**Depends on** — L0 tokens only
**Used by** — `EmrLateralityField` (L2), `EmrVisualAcuityField` (L2), `EmrTypedField` (L2)

---

### EmrSearchInput
**Layer** L1 · **Selector** `emr-search-input` · **Status** stable · **Story** `foundations-building-blocks--text-and-inputs`

**Need** — Table filters, patient roster search bars, and order-set filters need a standalone search box with clear and submit affordances without a dropdown listbox.

**Purpose** — Renders `type="search"` with an inline clear button and loading indicator, emitting `valueChange`, `cleared`, and `submitted` (on Enter).

**Depends on** — L0 tokens only
**Used by** — filter bars and search headers

---

### EmrPasswordInput
**Layer** L1 · **Selector** `emr-password-input` · **Status** stable · **Story** `foundations-building-blocks--text-and-inputs`

**Need** — Controlled-substance witness re-authentication, break-glass PIN/password prompts, and sign-in screens need a password input with controlled or local reveal toggle.

**Purpose** — Renders `type="password"` / `type="text"` with an accessible Show/Hide button, `autoComplete`, `readOnly`, `disabled`, emitting `valueChange`, `revealedChange`, and `blurred`.

**Depends on** — L0 tokens only
**Used by** — sign-in and witness re-authentication flows

---

### EmrNumericStepper
**Layer** L1 · **Selector** `emr-numeric-stepper` · **Status** stable · **Story** `foundations-building-blocks--text-and-inputs`

**Need** — Touch-friendly clinical counters (refill counts, tablet quantities, diopter steps, parity counts) need explicit `−` / `+` increment buttons around a numeric input.

**Purpose** — Renders a numeric input flanked by 44×44px decrement/increment buttons respecting `min`, `max`, `step`, `unitLabel`, `readOnly`, and `disabled`, emitting `valueChange` (`number | null`) and `blurred`.

**Depends on** — L0 tokens only
**Used by** — prescribing, refraction, and bedside numeric entry

---

### EmrCheckboxGroup
**Layer** L1 · **Selector** `emr-checkbox-group` · **Status** stable · **Story** `foundations-building-blocks--choice-and-selection`

**Need** — Multi-select checklists (review-of-systems symptoms, surgical prep checks, patient education topics) need a `<fieldset>`/`<legend>` checkbox group rather than a `<select multiple>` list.

**Purpose** — Renders a `<fieldset role="group">` of checkboxes from `EmrOption[]` (with optional `group`, `readOnly`, `disabled`, `badge`, `tone`, and `description`) and `value: readonly string[]`, supporting `variant` (`tile` | `inline` | `card` | `chip`), `orientation` (`vertical` | `horizontal` | `grid`), `size` (`md` | `sm`), `labelPlacement`, `showSelectAll`, `exclusiveValues`, `minSelections`, `maxSelections`, `showSelectionCount`, `clearable`, `hint`, `warning`, `error`, `invalid`, `required`, `readOnly`, and `disabled`, emitting `valueChange`, `cleared`, `focused`, and `blurred`.

**Depends on** — L0 tokens only
**Used by** — `EmrTypedField` (L2 `multiselect` widget)

---

### EmrPagination
**Layer** L1 · **Selector** `emr-pagination` · **Status** stable · **Story** `foundations-building-blocks--actions-and-navigation`

**Need** — Patient rosters, audit trails, work queues, and lab tables need consistent page navigation and page-size controls without each L4 table re-implementing pagination chrome.

**Purpose** — Renders a `<nav aria-label="Pagination">` with range summary, Previous/Next buttons, page buttons, and optional `pageSizeOptions` selector, emitting `pageChange` and `pageSizeChange`.

**Depends on** — L0 tokens only
**Used by** — paginated tables and worklists

---

### EmrDialog
**Layer** L1 · **Selector** `emr-dialog` · **Status** stable · **Story** `foundations-building-blocks--feedback-and-overlays`

**Need** — Safety confirmations, override prompts, witness sign-offs, and focused forms need a controlled modal dialog with focus trapping, Escape/backdrop dismissal, and unclipped print behaviour.

**Purpose** — When `open` is true, renders an accessible `role="dialog"` `aria-modal="true"` surface with header, body, and optional footer slot, trapping keyboard focus and emitting `closeRequested` (`'escape' | 'backdrop' | 'close-button'`).

**Depends on** — L0 tokens only
**Used by** — modal confirmations and sign-off flows

---

### EmrPopover
**Layer** L1 · **Selector** `emr-popover` · **Status** stable · **Story** `foundations-building-blocks--feedback-and-overlays`

**Need** — Flowsheet cell details, reference ranges, and inline quick actions need a controlled anchored disclosure panel with Escape dismissal.

**Purpose** — Renders a trigger wrapper and positioned popover surface when `open` is true, wiring `aria-expanded` and emitting `openChange` (`boolean`).

**Depends on** — L0 tokens only
**Used by** — inline clinical disclosures and quick-edit cells

---

### EmrTooltip
**Layer** L1 · **Selector** `emr-tooltip` · **Status** stable · **Story** `foundations-building-blocks--feedback-and-overlays`

**Need** — Abbreviated clinical headers, icon buttons, and compact status indicators need supplementary hover/focus text linked via `aria-describedby`.

**Purpose** — Wraps projected trigger content with a `role="tooltip"` bubble shown on focus/hover (or controlled `open`) without obscuring clinical safety information.

**Depends on** — L0 tokens only
**Used by** — compact headers and icon actions

---

### EmrProgressBar
**Layer** L1 · **Selector** `emr-progress-bar` · **Status** stable · **Story** `foundations-building-blocks--status-and-media`

**Need** — Upload progress, sync queues, and staged checklist completion bars need an accessible `role="progressbar"` supporting both determinate and indeterminate states.

**Purpose** — Renders a token-styled track and fill bar with `value` (`number | null` — `null` for indeterminate), `max`, `label`, `valueLabel`, and `tone`.

**Depends on** — L0 tokens only
**Used by** — sync, upload, and workflow progress indicators

---

### EmrSpinner
**Layer** L1 · **Selector** `emr-spinner` · **Status** stable · **Story** `foundations-building-blocks--status-and-media`

**Need** — Async terminology searches, button busy states, and panel refreshes need a lightweight CSS/SVG activity spinner with screen-reader status text.

**Purpose** — Renders a `role="status"` animated spinner (`size: 'small' | 'medium' | 'large'`, `label`) respecting `prefers-reduced-motion`.

**Depends on** — L0 tokens only
**Used by** — loading states across inputs and panels

---

### EmrSkeleton
**Layer** L1 · **Selector** `emr-skeleton` · **Status** stable · **Story** `foundations-building-blocks--status-and-media`

**Need** — Patient banners, lab tables, and summary cards need layout-preserving shimmer placeholders while records load.

**Purpose** — Renders `aria-hidden="true"` placeholder blocks (`variant: 'text' | 'rect' | 'circle'`, `lines`, `width`, `height`) styled strictly with L0 surface tokens.

**Depends on** — L0 tokens only
**Used by** — progressive loading placeholders

---

### EmrAvatar
**Layer** L1 · **Selector** `emr-avatar` · **Status** stable · **Story** `foundations-building-blocks--status-and-media`

**Need** — Care-team attributions, clinician headers, and patient cards need an avatar showing a photo when available or caller-supplied initials/tone fallback.

**Purpose** — Renders a circular avatar (`name`, `initials`, optional `imageUrl`, `size`, `tone`) falling back cleanly to initials if the image is absent or fails to load.

**Depends on** — L0 tokens only
**Used by** — clinician attribution and identity headers

---

### EmrFileTrigger
**Layer** L1 · **Selector** `emr-file-trigger` · **Status** stable · **Story** `foundations-building-blocks--status-and-media`

**Need** — Referral letters, external lab PDFs, OCT scans, and wound photos need a keyboard-accessible file picker / dropzone primitive that never performs uploads itself.

**Purpose** — Renders a button/dropzone backed by `<input type="file">`, accepting `accept`, `multiple`, `disabled`, and `readOnly`, and emitting `filesSelected` (`readonly EmrFileSelectionItem[]` metadata).

**Depends on** — L0 tokens only
**Used by** — `EmrAttachmentField` (L2)

---

### EmrToggleGroup
**Layer** L1 · **Selector** `emr-toggle-group` · **Status** stable · **Story** `foundations-wave2-primitives--choice-and-tree`

**Need** — Settings panels, consent preferences, communication channels, and device sync controls group multiple `role="switch"` toggles with optional single/multi mode, master `Enable all`, exclusive options, selection caps, and per-option read-only locks.

**Purpose** — Renders a `role="group"` container of accessible `role="switch"` controls across Angular, React Web/Expo, and Lit. Supports `variant: 'tile' | 'inline' | 'card'` (normalizing `'standard'` -> `'tile'`), `size: 'md' | 'sm'`, `orientation: 'vertical' | 'horizontal' | 'grid'` (1-col collapse at `<=480px`), `labelPlacement` (default `'space-between'`), `multiple`/`allowEmpty`, `showSelectAll` (`role="checkbox"` tri-state master toggle), `exclusiveValues`, `minSelections`/`maxSelections`, `showSelectionCount`, `clearable` (preserving locked `readOnly` options), `showStateLabels`/`onLabel`/`offLabel`, grouped sections, monochrome SVG icons/badges/tones, validation (`invalid`/`warning`/`error` with `role="status"`/`role="alert"`), and coalesced `focused`/`blurred` outputs.

**Keyboard** — `Tab` moves across switches; `Space` and `Enter` toggle focused switch (preventing scroll and rolling back when `readOnly`).

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` choice/toggle-group helpers

---

### EmrTreeView
**Layer** L1 · **Selector** `emr-tree-view` · **Status** stable · **Story** `foundations-wave2-primitives--choice-and-tree`

**Need** — Anatomical hierarchies, ICD/SNOMED chapter trees, hospital ward/bed hierarchies, and structured protocol templates require an expandable parent–child tree with WAI-ARIA keyboard traversal, keyword filtering, and cascading multi-select checkboxes.

**Purpose** — Renders recursive `EmrTreeNode[]` (`readOnly`, `disabled`, `badge`, `tone`, `icon`, `keywords`) with WAI-ARIA `role="tree"` / `role="treeitem"` roving `tabindex`, `checkStrategy: 'cascade' | 'all' | 'leaf'` with custom monochrome SVG tri-state checkboxes, `maxSelections`, auto-expanding search with substring `<mark>` highlighting and `44x44px` clear button, `Expand all`/`Collapse all`/`Clear` toolbar (`data-emr-print="hide"`), scrollable container (`data-emr-print="expand"`), `size: 'md' | 'sm'`, and validation (`invalid`/`warning`/`error`).

**Keyboard** — `ArrowDown`/`ArrowUp`/`Home`/`End` skip disabled rows cleanly and move DOM focus; `ArrowRight` expands or moves to first child; `ArrowLeft` collapses or moves to parent; `Enter`/`Space` activates or toggles; printable characters jump by typeahead.

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` tree models

---

### EmrTreeSelect
**Layer** L1 · **Selector** `emr-tree-select` · **Status** stable · **Story** `foundations-wave2-primitives--choice-and-tree`

**Need** — Compact form fields and `EmrTypedField` (`tree-select`) schemas need hierarchical parent–child selection inside a clearable `role="combobox"` trigger with sibling multi-select chips and responsive popover/sheet presentation.

**Purpose** — Renders a `.emr-select-shell` with sibling `.emr-select-chips` (`maxTagCount`, locked `readOnly` chip protection, `removeTreeSelectionChip` cascade reconciliation) before `<button role="combobox" aria-haspopup="tree">` and an inline `Clear` button (`isEmrTreeClearable`). Supports `variant: 'outline' | 'filled' | 'subtle'`, `size: 'md' | 'sm'`, `displayMode: 'path' | 'leaf'`, `separator`, `closeOnSelect`, `maxSelections`, `loading`, `searchable` (`true` default), `showExpandControls`, floating desktop popover / `<520px` mobile `Modal` sheet in React, and full validation (`invalid`/`warning`/`error`).

**Keyboard** — `Enter`/`Space`/`ArrowDown`/`ArrowUp` opens panel and focuses filter/tree; `Escape` or outside click closes panel and restores focus to the combobox trigger.

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` tree models

---

### EmrImageViewer
**Layer** L1 · **Selector** `emr-image-viewer` · **Status** stable · **Story** `foundations-wave2-primitives--image-suite`

**Need** — Clinical photos, anterior-segment/fundus captures, wound images, and scanned referrals need pan, zoom, 90° rotation, fine straightening, horizontal/vertical flip, and fullscreen lightbox inspection without coupling to L4 folder models.

**Purpose** — Renders an inline and fullscreen-expandable (`role="dialog" aria-modal="true"` with Escape dismiss and focus move/restore) image inspector supporting single or multi-image galleries (`images`, `activeIndex`, `showThumbnails` miniature previews), pointer/native `PanResponder` drag-to-pan, wheel/button zoom (`0.25x`–`5x`), `-90°`/`+90°` rotation, synchronized straighten slider (`-45°..+45°`), flip H/V, `height`, keyboard shortcuts (`+`/`-`/`0`/`r`/`ArrowLeft`/`ArrowRight`), `readOnly` inspection parity (interactive pan/zoom/rotate while marked `data-readonly`), `disabled` mute, and persistent validation chrome (`hint`, `warning`, `error`, `invalid`, `labelHidden`).

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` viewport helpers

---

### EmrImageCropper
**Layer** L1 · **Selector** `emr-image-cropper` · **Status** stable · **Story** `foundations-wave2-primitives--image-suite`

**Need** — Patient ID photos, external slit-lamp/wound photos, and camera document captures require interactive cropping, aspect-ratio locking, rotation, straightening, zoom, and pan prior to committing to the record.

**Purpose** — Renders an interactive crop stage with `role="radiogroup"` aspect-ratio presets (`Free`, `1:1`, `4:3`, `16:9`, `3:4`), dimmed outer scrim with rule-of-thirds overlay, draggable and 4-corner resizable normalized crop box (`44x44px` hit handles + keyboard `Arrow`/`Shift+Arrow` nudging), stage pan, rotate/straighten/flip/zoom controls, `outputMimeType`, and Apply/Reset/Cancel actions emitting `EmrImageCropResult` (`transform` + real `<canvas>`-rasterized `croppedDataUrl` on Web/Angular/Lit).

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` crop helpers

---

### EmrImageUpload
**Layer** L1 · **Selector** `emr-image-upload` · **Status** stable · **Story** `foundations-wave2-primitives--image-suite`

**Need** — Clinical photo entry requires an integrated upload + camera capture + thumbnail preview grid where clinicians can inspect full-screen (pan/zoom/rotate) and crop/straighten each image in place.

**Purpose** — Combines file selection, drag-and-drop, and opt-in `allowCamera` (`false` default) capture with `accept` and `maxSizeBytes` validation (`role="alert"` inline feedback), `maxFiles` capacity indicator, race-free `FileReader` data URL loading, responsive thumbnail preview cards with `"Edited"` badge, byte-size label, editable captions (`captionChange`), `cropOutputMimeType`, fullscreen lightbox modal, interactive modal cropper, and `readOnly` inspection lock (`View` remains active while edits/dropzone are locked).

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` image models

---

### EmrDateRangeInput
**Layer** L1 · **Selector** `emr-date-range-input` · **Status** stable · **Story** `foundations-wave2-primitives--temporal-and-text`

**Need** — Encounter filters, lab/vitals date spans, audit log queries, and leave/admission windows need a coordinated start–end range picker with quick presets rather than two unlinked date inputs.

**Purpose** — Renders coordinated start/end date or datetime inputs (`datetime` preserves `HH:mm` times across calendar clicks), a `weekStartsOn`-configurable interactive 2D-keyboard-navigable range calendar with monochrome SVG icons, quick preset chips, `min`/`max` per-side validation (`startError`/`endError`, `warning`, `role="alert"` errors), `size`/`variant` parity, `Escape`/outside-click close, chronological normalization, and a Clear action.

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` date-range helpers

---

### EmrCombobox
**Layer** L1 · **Selector** `emr-combobox` · **Status** stable · **Story** `foundations-wave2-primitives--temporal-and-text`

**Need** — Chief complaints, referring clinicians, external facilities, and custom sig phrases need typeahead suggestions from a known list while allowing free-text entry when unlisted.

**Purpose** — Renders a WAI-ARIA `role="combobox"` text input with `aria-activedescendant` keyboard navigation, ranked/local/remote/none option filtering, `<mark class="emr-match-highlight">` match highlighting, "Best match" cue, grouped option headers, `code`/`badge`/`tone`/`readOnly` metadata, `outline`/`filled`/`subtle` variants, `md`/`sm` sizes, loading/empty/warning/invalid states, free-solo custom value support, and monochrome SVG clear/chevron actions.

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` option helpers

---

### EmrTagInput
**Layer** L1 · **Selector** `emr-tag-input` · **Status** stable · **Story** `foundations-wave2-primitives--temporal-and-text`

**Need** — Aliases, batch/lot numbers, specimen labels, keywords, and recipient lists need inline multi-chip free-text entry.

**Purpose** — Renders removable tag chips alongside an inline text input supporting unified `value`/`tags` binding, Enter/delimiter/paste CSV tokenization, `ArrowLeft`/`ArrowRight`/`Backspace` chip navigation, `lockedTags` protection with monochrome lock icon, `maxTags`/`maxTagLength`, `variant` (`outline`/`filled`/`subtle`), `size` (`md`/`sm`), `chipTone`, ranked & highlighted ARIA suggestion listbox (`Best match` + `<mark>`), `44x44px` hit targets, and Clear all.

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` tag helpers

---

### EmrSlider
**Layer** L1 · **Selector** `emr-slider` · **Status** stable · **Story** `foundations-wave2-primitives--formatted-and-sliders`

**Need** — Image zoom, opacity, PACS window/level, brush thickness, and numeric thresholds need a general-purpose continuous or stepped single-thumb slider distinct from clinical `EmrVas`.

**Purpose** — Renders an accessible pointer/touch-draggable (`PanResponder` on Expo Native) `role="slider"` track with `min`, `max`, `step`, `precision`, `unit`, `size`, `tone`, optional `showSteppers`, proportional clickable `marks`, live `valueChange` + release `committed` events, `warning`/`invalid` states, `clearable`, and focus-preserving `readOnly` support.

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` slider helpers

---

### EmrRangeSlider
**Layer** L1 · **Selector** `emr-range-slider` · **Status** stable · **Story** `foundations-wave2-primitives--formatted-and-sliders`

**Need** — Age-band filters, target physiological ranges, and numeric cohort filters require a dual-thumb `[low, high]` slider whose handles never cross.

**Purpose** — Renders a unified single dual-thumb track (`role="slider"` low & high thumbs with cross-bounded `aria-valuemin`/`aria-valuemax`, `44x44px` hit areas, overlapping thumb z-index promotion, and `PanResponder` drag on Expo Native) clamped via `clampRangeSliderPair` with `minDistance`, `step`, `precision`, `unit`, `size`, `tone`, proportional clickable `marks`, `clearable`, and `committed` support.

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` slider helpers

---

### EmrMaskedInput
**Layer** L1 · **Selector** `emr-masked-input` · **Status** stable · **Story** `foundations-wave2-primitives--formatted-and-sliders`

**Need** — National health IDs (e.g. `99-9999-9999-9999`), policy numbers, and structured serial codes require deterministic pattern formatting as the user types.

**Purpose** — Applies a caller-supplied pattern mask (`9` digit, `A` letter, `*` alphanumeric, `\` escaped literals, custom `definitions`, and `uppercase`) via `applyInputMask` and `editMaskedInputWithCaret`, preserving caret position & Backspace-across-literal UX, inferring `inputMode`, supporting `size`/`variant`, `showMaskHint`, `unmask`, inline clear button, and `completed` emission.

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` mask helpers

---

### EmrOtpInput
**Layer** L1 · **Selector** `emr-otp-input` · **Status** stable · **Story** `foundations-wave2-primitives--formatted-and-sliders`

**Need** — Patient consent verification codes, ABDM/2FA OTPs, and witness PIN confirmations require segmented character slots with paste and auto-advance UX.

**Purpose** — Renders `length` (`>= 44px`) character slots supporting sparse slot preservation, OS SMS `autocomplete="one-time-code"` multi-char autofill, numeric or alphanumeric `uppercase` mode, `secret` masking, `separatorAfter` grouping, `size`/`variant`, `Arrow`/`Home`/`End`/`Backspace`/`Delete` navigation, paste, `clearable`, and `completed`/`submitted` emission.

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` OTP helpers

---

### EmrMenu
**Layer** L1 · **Selector** `emr-menu` · **Status** stable · **Story** `foundations-wave2-primitives--navigation-and-actions`

**Need** — Row overflow (`⋯`) actions, print/export menus, and secondary workflow commands need a keyboard-navigable WAI-ARIA `role="menu"` primitive.

**Purpose** — Renders a trigger button (`label`, `triggerIcon`, `variant`, `size`, `align`, `defaultOpen`, `readOnly`) and floating `role="menu"` list supporting `role="menuitem"` buttons with monochrome SVG icons, descriptions, dividers, keyboard shortcuts, danger tone, typeahead, Arrow/Home/End roving focus, outside pointerdown dismissal, and Escape focus return.

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` menu helpers

---

### EmrSplitButton
**Layer** L1 · **Selector** `emr-split-button` · **Status** stable · **Story** `foundations-wave2-primitives--navigation-and-actions`

**Need** — Clinical commit actions (`Sign Encounter` + `▾` *Sign & Lock / Request Co-sign / Save Draft*) need a primary action paired with an adjacent secondary action menu.

**Purpose** — Combines a primary action button (`clicked`, `primary`/`secondary`/`outline`/`danger`, `size`, `loading`, `readOnly`) with an attached `>= 44px` menu toggle opening a keyboard-accessible `role="menu"` (`itemSelected` with `EmrMenuItem`, icons, descriptions, shortcuts, dividers).

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` menu/split-button helpers

---

### EmrAccordion
**Layer** L1 · **Selector** `emr-accordion` · **Status** stable · **Story** `foundations-wave2-primitives--navigation-and-actions`

**Need** — Long clinical instructions, prior history summaries, and device settings need single- or multi-expand disclosure panels that automatically expand all content when printed.

**Purpose** — Renders heading-wrapped disclosure headers (`role="heading"`, `aria-level`, `variant` `outlined`/`flush`/`card`, `size`, `defaultExpandedIds`, `readOnly`, structured badges, monochrome icons, ArrowUp/Down/Home/End navigation) and `[hidden]` region panels that `.emr-print` automatically reveals on paper.

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` accordion helpers

---

### EmrBreadcrumbs
**Layer** L1 · **Selector** `emr-breadcrumbs` · **Status** stable · **Story** `foundations-wave2-primitives--navigation-and-actions`

**Need** — Deep document folders, hierarchical order catalogs, and admin configuration screens need path orientation and ancestor jump links.

**Purpose** — Renders `<nav aria-label>` with `aria-current="page"` on the active item, optional `href` anchor links, `chevron` SVG or string separators, `size`, and an accessible monochrome `more-horizontal` overflow button (`overflowExpanded`) that restores focus to the first revealed level and resets on `items`/`maxItems` changes.

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` breadcrumb helpers

---

### EmrColorPicker
**Layer** L1 · **Selector** `emr-color-picker` · **Status** stable · **Story** `foundations-wave2-primitives--navigation-and-actions`

**Need** — Clinical diagram annotations, calendar resource labels, and chart series configuration require an accessible named-swatch color selector rather than an unlabelled native color input alone.

**Purpose** — Renders a `role="radiogroup"` of `44x44px` named clinical color swatches (`DEFAULT_CLINICAL_COLOR_SWATCHES`, roving `tabIndex`, arrow navigation, contrast-aware SVG checkmarks), live preview dot, custom hex normalization with blur/readOnly rollback, Clear button, and `warning`/`error` validation.

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` swatch & color helpers

---

### EmrCopyButton
**Layer** L1 · **Selector** `emr-copy-button` · **Status** stable · **Story** `foundations-wave2-primitives--navigation-and-actions`

**Need** — MRNs, national health IDs, accession numbers, and SNOMED/ICD codes frequently need one-click clipboard copy with screen-reader confirmation.

**Purpose** — Copies `value` to the clipboard (with SSR-safe fallback, empty-value guard, `outline` default variant, `sm`/`md`/`lg` sizes, `iconOnly`, timed `feedbackDurationMs` reset, immediate reset on `value` change), announces `copiedLabel` via `role="status" aria-live="polite"`, and emits `copied`.

**Depends on** — L0 tokens and `@drguptavivek/emr-controller` copy helpers

