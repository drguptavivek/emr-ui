# Session prompt — OpenRosa-inspired logic engine for emr-controller

Copy everything below the line into the next session.

---

## Context

Repo: `/Users/vivekgupta/workspace/EMR` (pnpm monorepo: `packages/emr-controller`,
`packages/emr-ui`). Companion apps: `vcms` (SvelteKit, vision-centre management) and
`DigitVA/mobile/digitva-collect` (Expo 57, RN 0.86, Hermes). Read these two proposal
docs first — they are the agreed design, already decided, do not relitigate:

- `docs/openrosa-logic-engine-proposal.md` — concepts borrowed from ODK/OpenRosa
  (semantics only), exclusions (no ODK libraries, no XPath syntax, **no XLSForm
  import — forms are authored directly in our language**), condition language,
  patterns, acceptance matrix.
- `docs/value-coercion.md` — the coercion contract across engine / TS runtime /
  SQLite / API JSON.
- `docs/field-contract.md` — the contract/presentation/state doctrine this builds on.

## How the controller works today (verified, not inferred)

- `emr-controller/src/clinical-form.controller.ts` (153 lines):
  `ClinicalFormController extends StateController<ClinicalFormViewModel,
  ClinicalFormIntent>` — a **pure reducer**. Intents: `fieldEditRequested`,
  `fieldStatusEditRequested`, `fieldFocused`, `repeatItemAddRequested`,
  `repeatItemRemoveRequested`, `editItem`/`editItemStatus`,
  `sectionToggleRequested`. It only mutates view-model state. It does **no**
  enableWhen resolution, **no** validation, **no** calculations.
- Schema shape (`clinical-form.models.ts`): `ClinicalFormSchema` → sections →
  blocks (`ClinicalFieldDefinition | RepeatableGroupDefinition`); per-field runtime
  is `ClinicalFieldState { value, assessmentStatus?, readOnly?, disabled?,
  warning?, error? }`. `ClinicalFieldType` is a strict subset of `EmrValueType`.
- The newer contract layer (`field-contract.models.ts`): `EmrFieldDefinition =
  { contract: EmrFieldContract, presentation: EmrFieldPresentation }`.
  `EmrFieldContract` already has `linkId`, `valueType`, `cardinality {min,max}`
  (required + repeats), `terminology[]`, `validation[]` (`FieldValidationRule`
  union: min/max-length, minimum, maximum, precision, pattern, earliest/latest-date,
  allowed-values, custom), `enableWhen[]` (`{ question: EmrNodePath, operator,
  answer }`), `enableBehavior`, `unit` (UCUM), `defaultValue`, `readOnly`, `tags`.
- `EmrFieldState.enabled` is documented as "RESOLVED enableWhen — controller
  computes" but **no code computes it yet**; nothing consumes `EmrFieldState`
  outside models/specs. The evaluator slot is empty — greenfield, not refactor.
- `node-path.ts`: `EmrNodePath = readonly (string | number)[]` (repeat rows are
  numeric segments), `serializePath`/`parsePath` exact inverses with escaping;
  `messagesAt`/`hasErrorAt` match exact paths only.
- `validation.models.ts`: `EmrValidationMessage { path, severity, ruleId?, source?
  }`; `EmrValidationPort.validate(definition, value, path, signal?)` — async,
  controller-owned; the UI never evaluates rules ("not even required").
- `field-contract.adapters.ts`: lossless `ClinicalFieldDefinition ↔
  EmrFieldDefinition ↔ EmrGeneratedFieldDefinition` adapters with round-trip specs.
- `field-generator.models.ts` / `field-generator.controller.ts`: authoring
  controller (`draftPatched`, `validationRuleAdded/Removed`, terminology intents,
  `FieldDefinitionRepositoryPort.save`).
- `emr-ui` renders from state and is logic-blind by design (structures:
  `emr-clinical-form`, `emr-repeatable-group`, `emr-clinical-matrix`,
  `emr-section-card`; fields: `emr-typed-field`, `emr-coded-input`).
- Cross-app reuse: packages are plain TS; `digitva-collect` proves RN/Hermes
  consumption works for this style.

## What is proposed (already decided)

Build a pure-TS logic engine at `emr-controller/src/logic/` applying ODK-inspired
form-logic semantics through our own structures:

- `condition.ts` — `EmrCondition`: frozen JSON tree (`all`, `any`, `not`,
  `{ path, op, value }`, function-call nodes) + TS builder helpers. No lexer, no
  parser, no string DSL — the tree is the language.
- `calculation.ts` — `EmrCalculation` kinds: `'serial'` (running numbers, e.g.
  `{ kind: 'serial', group, width, pad }`), `'join'`, `'field'`, arithmetic tree.
- `instance.ts` — instance = `Map<serializePath(path), ClinicalFieldValue>`;
  path-context resolution (absolute, and relative to the repeat item being
  evaluated); `null` → `''` at engine entry.
- `functions.ts` — whitelist: `includesValue, selectedAt, countSelected, labelOf,
  matchesPattern, join, formatDate, not, toBoolean, toNumber, toString, toInt,
  round, coalesce, length, contains, startsWith, endsWith, today, now, padStart,
  count, positionIn, valueAt`.
- `evaluator.ts` + `logic-port.ts` — `EmrLogicPort { evalRelevant, evalConstraint,
  evalCalculation }`.
- Contract extensions (additive): `relevant?: EmrCondition`,
  `constraint?: { condition, message? }`, `requiredCondition?: EmrCondition`,
  `calculation?: EmrCalculation`, `readOnlyCondition?: EmrCondition`.
  Existing `enableWhen`/`enableBehavior` stay as sugar over simple conditions.
- Cross-repeat validation-rule kinds: `unique-across-repeats` (single field or
  tuple; blanks never collide; first occurrence clean, later duplicates errored at
  their own item path) and `single-choice-across-repeats`
  (`{ field, equals, min?, max? }` — e.g. only one index case among contacts;
  `min` violations error the group path).
- `resolveLogic(schema, instance, port)` runs in the controller after every edit
  intent → fills `EmrFieldState.enabled / value / messages`
  (`source: 'mechanical'`). Single pass in document order (path-depth order);
  calculations may feed downstream relevancies; no cycle detection.
- Semantics pinned by `value-coercion.md`: empty string → `NaN` in numeric
  context; blank satisfies `!=`; multiselects are space-delimited strings;
  `selectedAt` 0-indexed; `labelOf` display-only, falls back to the value; `count`
  on non-repeat → 0; `positionIn` outside repeat → 0; `valueAt` out-of-range →
  `''`; serials renumber on add/remove (document-order recalculation); persistence
  normalizes blank/`NaN` → `NULL`.
- Load-time validation: unknown condition function, calculation kind, or rule
  field reference fails contract load with a named error.
- Acceptance = the test matrix in the proposal (condition language, per-function
  spec tables, coercion goldens, bind semantics, label lookup, repeat addressing,
  uniqueness, single-choice, running numbers, resolution pass, load-time
  validation). Tests are hand-written from the semantics — **never scraped from
  XLSForm files**.

## Hard constraints

- No ODK/XPath libraries (`@getodk/xpath` uses WASM — Hermes cannot run it; Hermes
  has no WebAssembly). No enketo-core, no `@getodk/xforms-engine`.
- No XLSForm import pipeline at all; existing XLSForms are reference material only.
- Engine must be vitest-only TS: no React, no DOM — identical behavior in Hermes,
  Node, browser.
- Single evaluator: the UI renders `EmrFieldState`; it never derives logic verdicts.

## Task order

1. `condition.ts` + `functions.ts` + `evaluator.ts` with per-function spec tests
   and coercion goldens (`coerce.ts` rules per `value-coercion.md` §2).
2. `instance.ts` (path contexts incl. repeat-relative resolution) + repeat
   functions.
3. `logic-port.ts` + `resolveLogic` wired into `ClinicalFormController`'s edit
   intents; extend `EmrFieldContract` additively.
4. Cross-repeat rule kinds in the validation-rule union + resolution.
5. `serial` calculation kind + `toPersistent` coverage.
6. Run the full existing suite (`field-contract.spec.ts`, `node-path.spec.ts`,
   controller specs) — nothing existing may break; the reducer is pure, so
   `resolveLogic` must stay a pure function too.
