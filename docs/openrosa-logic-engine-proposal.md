---
title: Borrowing OpenRosa form-logic concepts into emr-controller
status: proposal
owner: engineering
last_reviewed: 2026-10-18
related: field-contract.md, value-coercion.md
---

# Proposal: a pure-TS OpenRosa logic engine inside `emr-controller`

Goal: apply ODK-inspired form-logic checks (skip logic, constraints, calculations,
cross-repeat rules, lookups) in our own forms — web (vcms) and Expo
(`digitva-collect`) — without shipping ODK's engines (`@getodk/xforms-engine`,
enketo-core, `@getodk/xpath`) and without adopting XPath syntax. We borrow
**concepts and semantics only**; every check is expressed in our own FHIR-aligned,
serializable TS structures: `EmrCondition` trees, validation-rule kinds, and
calculation kinds.

## Why not the ODK libraries

| Library | Blocker |
|---|---|
| `enketo-core` | jQuery/XSLT-era, DOM-bound, legacy architecture |
| `@getodk/xforms-engine` | DOM/parser assumptions; its value is the Vue UI + XForm XML parsing — we author forms directly in our own language instead |
| `@getodk/xpath` | tree-sitter **WASM** parser; Hermes (RN's JS engine) has no WebAssembly, so it cannot run in native context — only in a WebView |

## Concepts borrowed from ODK/OpenRosa

1. **The bind model.** Logic lives on per-field bindings — skip logic (`relevant`),
   value constraints with a user-facing message, required-ness (static or computed),
   calculations, and computed read-only. These become additive fields on
   `EmrFieldContract`.
2. **Single-evaluator rule.** ODK evaluates every binding with one XPath engine; our
   docs already mandate "Rules live on the contract. Evaluation lives in the controller."
   The rebuilt engine is the one evaluator; the UI never infers a verdict.
3. **Instance-tree addressing.** ODK's core idea: every check references the instance
   tree relative to the node being evaluated — self, a sibling, a parent's other
   child, a specific repeat row. `EmrNodePath` (`['medications', 2, 'dose']`) already
   carries this; condition paths are node paths, with repeat rows addressed by index.
4. **Single-pass evaluation in document order.** ODK resolves calculations feeding
   relevancies in form order, no cycle detection. We replicate: resolve per keystroke,
   topologically by path depth — boring and correct.
5. **Value-coercion semantics.** Empty string → `NaN` in numeric context;
   string/number/boolean/date coercions per ODK; multiselect values are
   space-delimited strings with 0-indexed positional access (`selectedAt`); labels
   are looked up, never stored (concept 6).
6. **Label lookup for stored values.** Fetching the display label of a saved code —
   and of the nth item of a multiselect — via `labelOf(value, fieldPath)`, resolved
   against `presentation.options`; display-only, never stored to data.
7. **Repeat-context addressing and aggregation.** ODK evaluates each repeat item's
   bindings with that item as context. We borrow the four capabilities as condition
   functions over `EmrNodePath` indices: sibling access within the current row
   (paths resolve relative to the evaluating node), current row index
   (`positionIn(group)`), item count of a group (`count(group)`), and a specific
   row's value (`valueAt(group, index, field)`). Iteration is index arithmetic over
   the instance map, not tree traversal.
8. **Cross-repeat constraint rules (beyond ODK).** ODK has no native uniqueness or
   per-group choice cardinality. We add two first-class validation-rule kinds,
   evaluated by `resolveLogic` per repeat group: `unique-across-repeats` (single
   field or tuple) and `single-choice-across-repeats` (e.g. only one contact in a
   list may be the index case).
9. **A serializable condition language, not expression strings.** Logic checks are
   `EmrCondition` values — a small frozen JSON tree of typed nodes (`all`, `any`,
   `not`, `{ path, op, value }` comparisons, function calls) authored through TS
   builder helpers, extending the existing FHIR `enableWhen` idea. No parser, no
   string DSL: what ODK does with XPath text, we do with a typed tree that the TS
   compiler, JSON schema, and our evaluator all understand.
10. **Validation at authoring/load time.** ODK fails forms with unknown constructs at
   load. There is no import step to catch things earlier — forms are authored
   directly in our language — so contract load validates: condition node kinds,
   function names against the built-in set, calculation kinds, and rule field
   references. A bad check fails loudly at load, never as a field crash at capture.
11. **FHIR bridge, already ours.** Structured `enableWhen` (FHIR Questionnaire-style)
   stays for simple cases; `EmrCondition` covers compound logic. Both resolve through
   the same `EmrLogicPort`, matching FHIR R5's `enableWhen` + `enableWhenExpression`
   split.

## What we are NOT borrowing

- XForm XML as a runtime artifact (our contract JSON is the runtime artifact).
- XLSForm/XLSX as an authoring or import pipeline. There is no importer: forms are
  **rebuilt directly in our language** (EMR Builder / FieldGenerator emitting
  contracts). Existing XLSForms are reference material for scoping only.
- ODK Central/server interop as a goal — no round-trips, no OpenRosa submission API.
  The existing XLSForm corpus is reference material for scoping, nothing more.
- XPath as a language surface beyond the subset our forms use — we implement the
  grammar ourselves, no XPath engine.
- Secondary instances (`instance()`), `itext` localization bundles, XPath axes and
  predicates (`[..]`), `current()` — repeat needs are met by concept 7's four
  functions over `EmrNodePath` indices.
- ODK's submission/encryption/audit machinery — vcms/DigitVA already own sync.

## Evidence: what the rebuilt forms need (scope only, not tests)

The existing XLSForms (`vcms/XLSforms/PEC_XMLs/*.xml`, `Assessment_of_Barriers.xml`,
`Low_Vision_Services.xml`, ~190 expressions) are being **rebuilt in our language**;
this corpus only sizes the capability set the rebuilt forms must express — it is
never executed as fixtures (names in the table are ODK's; our equivalents are in the
function list below):

| Feature | Count | | Feature | Count |
|---|---|---|---|---|
| `required="true()"` | 88 | | `selected-at()` | 70 |
| comparisons `= != > >= < <=` | throughout | | `jr:choice-name()` | 70 |
| `and` / `or` | ~40 | | `selected()` | 18 |
| `if()` | 5 | | `regex()` | 4 |
| `format-date()` | 3 | | `concat()` | 2 |
| absolute paths `/data/…` | throughout | | `instance()` in expressions | 0 |

Built-in condition functions v1 (TS names; ODK equivalents in parentheses where the
corpus used them): `includesValue` (selected), `selectedAt`, `countSelected`,
`labelOf` (jr:choice-name), `matchesPattern` (regex), `join` (concat), `formatDate`,
`not`, `toBoolean`, `toNumber`, `toString`, `toInt`, `round`, `coalesce`, `length`,
`contains`, `startsWith`, `endsWith`, `today`, `now`, `padStart`, plus repeat
functions `count`, `positionIn`, `valueAt`. A whitelist, extended only with tests.
(Repeat functions serve EMR Builder use-cases; the register corpus itself doesn't
use them.)

## Lookup, iteration, and aggregation patterns

The recurring authoring needs, each one borrowed pattern mapped onto our runtime:

| Need | ODK inspiration | Ours | Example |
|---|---|---|---|
| Label of a saved value | choice-name lookup | `labelOf(value, fieldPath)` → `presentation.options` label | stored `'1'` → `'Right eye'` |
| Label of nth selected item | same lookup + positional access | `labelOf(selectedAt(f, n), f)`; 0-indexed | first-selected symptom's name |
| Logic on a previous/sibling field | relative node addressing | condition paths resolve against the evaluating node's `EmrNodePath` | vision constraint inside `RefractionDetails` |
| Logic on a specific repeat row | cross-row value fetch | `valueAt(groupPath, index, fieldPath)` → instance-map lookup | compare row 2 against row 1 |
| Current row index | position | `positionIn(groupPath)` → 0-based index from the path context | "row 1 requires…" |
| Count children of a group | count | `count(groupPath)` → number of repeat items in the instance map | `count('meds') > 1` |
| Looping over fields | per-item bind evaluation | `resolveLogic` evaluates each repeat item's conditions with that item's path as context — the loop is the resolution pass itself, not a language feature | per-medication dosage constraint |
| Running serial in a repeat | position arithmetic in a calculation | first-class calculation `{ kind: 'serial', group, width, pad }` → `'001', '002', …`; renumbering is automatic because calculations re-run in document order on every add/remove | contact numbering, voucher serials |
| Only one row may hold a choice | — (no ODK native) | `single-choice-across-repeats` rule `{ field, equals, min?, max? }` | index case vs contacts |

**Running numbers.** A first-class calculation kind, not hand-composed arithmetic:

```ts
{ kind: 'serial', group: 'contacts', width: 3, pad: '0' }   // → '001', '002', …
```

`padStart` semantics for the free-form arithmetic alternative: pads with `pad`
(default `'0'`) to `width`, never truncates wider values (`padStart('1234', 3, '0')`
→ `'1234'`). The serial is a real persisted value (per the calculate semantics), so
exports carry it, and removing row 1 renumbers the rest — no stored sequence to
corrupt.

**Single-choice across repeats.** Contract rule, same family as uniqueness:

```ts
{ id: 'one-index-case', kind: 'single-choice-across-repeats',
  field: 'listRole', equals: 'index',
  min: 1,   // optional: 0 = at most one (default); 1 = exactly one required
  max: 1,   // optional: default 1
  message?: string }
```

Pinned semantics: matching uses the same comparison rules as uniqueness (coded by
`code`, string equal, blank never matches); rows beyond the first `max` matches get
the error at their own item path; `min: 1` with zero matches raises one error
addressed to the **group** path (`['contacts']`), not any row; blank/absent field
values never count as matches; re-evaluates on add/edit/remove like uniqueness.

Semantics pinned for tests: `count` on a non-repeat → 0; `positionIn` outside a
repeat context → 0; `valueAt` out-of-range → `''` (empty, NaN-coercing); labels are
display-only and never written to the instance or DB.

**Uniqueness across repeats.** Contract rule, not condition:

```ts
{ id: 'dup-entry', kind: 'unique-across-repeats',
  fields: ['patientName', 'visitDate'],   // tuple; length 1 = single field
  message?: string }
```

Pinned semantics: comparison is on persistent values (`''`/`null` never collide — a
tuple with any blank member is skipped, so it cannot block a later complete row);
numbers compare numerically, coded values by `code`, dates by ISO string; the
**first** occurrence stays clean, every later duplicate row gets an error message
addressed to that item's tuple path (`['meds', 2]`), so the UI highlights the
offending rows, not the group; rules re-evaluate on every edit/add/remove (removing
the first occurrence makes the next oldest the clean one).

## Architecture

```
emr-controller/src/logic/
  condition.ts    EmrCondition node types + TS builder helpers (all, any, not, cmp, call)
  calculation.ts  EmrCalculation kinds: 'serial', 'join', 'field', arithmetic tree
  instance.ts     Map<serializePath(path), ClinicalFieldValue>; path-context resolution
  functions.ts    built-in condition functions — the whitelist
  evaluator.ts    condition/calculation tree × instance → ClinicalFieldValue | boolean
  logic-port.ts   EmrLogicPort implementation over the above
```

New contract fields (additive):

```ts
interface EmrFieldContract {
  // existing enableWhen / enableBehavior stay (sugar over simple conditions)
  relevant?: EmrCondition;          // skip logic
  constraint?: { condition: EmrCondition; message?: string };  // truthy = valid
  requiredCondition?: EmrCondition;
  calculation?: EmrCalculation;     // controller writes value; field renders read-only
  readOnlyCondition?: EmrCondition;
}

interface EmrLogicPort {
  evalRelevant(condition: EmrCondition, instance: EmrInstance, path: EmrNodePath): boolean;
  evalConstraint(condition: EmrCondition, instance: EmrInstance, path: EmrNodePath): boolean;
  evalCalculation(calc: EmrCalculation, instance: EmrInstance, path: EmrNodePath): ClinicalFieldValue;
}
```

Controller runs `resolveLogic(schema, instance, port)` after every edit intent →
`EmrFieldState.enabled / value / messages` (`source: 'mechanical'`). Conditions are
plain JSON trees: validate at contract load, evaluate per keystroke (a walk over
≤30 nodes). Nothing to parse — the tree is the language.

## Where it lands in the existing migration plan

Slot into `field-contract.md` migration steps 3–4: build `resolveLogic` **before**
`EmrTypedField` migrates, so `enabled`/`messages` are never rendered from a second
source. Authoring (EMR Builder, `FieldGenerator`) emits contracts with
`EmrCondition`/calculation trees directly — the existing XLSForms are re-expressed
in this language by hand, form by form; there is no importer to maintain or trust.

## Acceptance

Tests are specified **per borrowed functionality**, hand-written from the semantics we
claim to adopt — one test group per concept, not scraped from XLSForm files:

- **Condition language** — each node kind gets positive + negative tests: `all`/
  `any`/`not` nesting; comparison ops incl. coercion dispatch; path resolution
  (absolute, and relative to a repeat item's context); unknown node kinds rejected
  at contract load.
- **Built-in functions** — one spec table per function: arity (incl. variadic
  `join`), return type, and behavior (`includesValue('1 3', '3')` → true,
  `selectedAt` 0-indexed, out-of-range → `''`; `labelOf` falls back to the value
  when no option matches).
- **Coercion table** — golden tests pinning `'' → NaN`, numeric string comparison,
  boolean semantics, date formatting via `formatDate`.
- **Bind semantics** — `relevant` → `state.enabled`; `constraint` failure →
  `messages` with `source: 'mechanical'` and the rule's message; `calculation` →
  value write + read-only rendering; `requiredCondition` vs static
  `cardinality.min`.
- **Label lookup** — `labelOf` returns the option label for a stored code, composes
  with `selectedAt` for the nth selection, falls back to the value when no option
  matches, and never mutates the instance.
- **Repeat addressing & aggregation** — per-item evaluation context (sibling paths
  resolve within the row); `count`, `positionIn`, `valueAt` per the pinned
  semantics in the patterns table; nested groups resolve to the nearest repeat
  ancestor.
- **Uniqueness across repeats** — single-field and tuple rules; blank-containing
  tuples skipped; first occurrence clean, later duplicates errored at their own item
  path; numeric/coded/date comparison forms; add/edit/remove re-evaluation including
  the first-occurrence-shift case; `fields` referencing an unknown field rejected at
  contract load.
- **Single-choice across repeats** — `max` violations errored at later matching rows;
  `min: 1` with no match errors the group path; blanks never match; typed and coded
  value comparisons; re-evaluation on add/edit/remove.
- **Running numbers** — `serial` width/pad semantics (`padStart` pads, never
  truncates); serial renumbers after middle-row removal and after first-row removal;
  serial is a persisted calculation, present in `toPersistent` output.
- **Resolution pass** — document-order single pass; a calculation feeding a downstream
  `relevant` resolves with the calculated value; disabled fields suppress constraint
  messages; repeat instances address correctly (`['meds', 1, 'dose']`).
- **Load-time validation** — unknown condition function, calculation kind, or rule
  field reference fails contract load with a named error; the evaluator rejects
  unknown names as defense in depth.
- vitest-only engine: no React, no DOM — identical behavior in Hermes, Node, browser.

## Accepted tradeoff

We own coercion edge cases instead of inheriting ODK's. Mitigation: the golden
coercion + function spec tables above, and deviations documented in one place
(`functions.ts` header).
