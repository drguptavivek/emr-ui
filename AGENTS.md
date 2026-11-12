# AGENTS.md

EMR component library with a framework-neutral controller package and three renderer packages.

- `@drguptavivek/emr-ui` — standalone Angular presentation components
- `@drguptavivek/emr-react` — React Native components (Expo, and web via react-native-web). Same
  view models and intents as emr-ui; tokens generated from `emr.css` (`pnpm --filter
  @drguptavivek/emr-react tokens`). Next.js harness: `harness/next` (launch config `emr-react-next`).
  Expo harness (SDK 58, RN 0.88, React 19.3): `pnpm build:controller`, then `pnpm --filter
  @drguptavivek/emr-react harness:expo --android` opens it in Expo Go on a booted emulator.
  Both harnesses render `harness/harness-form.tsx`; screens own keyboard avoidance (edge-to-edge).
- `@drguptavivek/emr-elements` — Lit Web Components with the same view models and typed intents.
- `@drguptavivek/emr-controller` — framework-neutral models, ports, headless controllers
  (and the form condition engine: `condition.*`, `form-logic.ts`, `engine-version.ts`). emr-react may import it at
  runtime; emr-ui (Angular) still imports types only.

## When asked to generate a component

1. **Choose the lowest layer that fits.** Find the closest catalog entry and inspect its shared contract,
   renderer implementations and story. Prefer an L5 recipe using the existing form or matrix when
   the work is primarily a new set of fields. Add a reusable component when the interaction or layout
   warrants it. Preserve existing consumer bindings unless the task calls for a migration.
2. **Specify the full workflow before coding.** List the fields, controls, actions and states the user needs.
   An entry view must expose actual editable controls for every applicable field, including fields with
   blank values. Check laterality and repeated rows. A bilateral fundus exam, for example, needs distinct
   OD and OS entry for each supplied structure. Display accepted values in review and read-only states.
3. **Put decisions in the controller.** Define or extend the shared immutable model and discriminated intent
   union in `emr-controller`. The controller or host owns clinical calculations, validation, permissions,
   terminology, data loading and persistence. The renderer displays supplied values, units, messages,
   evidence and action availability. On controlled surfaces, emit one intent per action with the precise
   field, row and eye where applicable. Gate mutation at the control and intent handler. Restore the
   accepted model value when a draft is rejected or the view locks. Cancel owned async work on teardown
   and ignore late intents and responses. Preserve unknown and unassessed states,
   omit unresolved derived values, and display verification only when supplied evidence supports it.
4. **Complete each advertised renderer.** Public catalog components normally ship in Angular, React Web,
   Expo / React Native and Lit. Match behavior across targets, including keyboard use, labels, focus, narrow
   layouts and read-only states. Export the component through each package entry point and wire Lit through
   its layer registrar and `registerAllEmrElements()`. Verify package and registry installs resolve the actual
   renderer and its source dependencies. Treat title-and-slot shells, unrelated fallback components and
   no-op action handlers as incomplete. Keep synthetic fixtures in stories, showcases and tests.
5. **Make the component discoverable.** Add its real selector, source file, layer, dependencies and story ID
   to `packages/emr-ui/catalog.manifest.ts`, and document it under `docs/catalog/L<n>-*.md`. Use the existing
   specialty and workflow categories. Cross-list a component where it serves more than one area, including
   the parent specialty for a subspecialty. Put reusable controls under shared foundations and forms.
   Add a Storybook story and update the relevant showcase. Wire the demo host to apply accepted edits
   and label fixture-backed workflows. Regenerate with `pnpm registry:build` and run
   `pnpm site:build --base-path=/emr-ui` when the showcase changes.
6. **Verify the normal consumer path.** Exercise the component with an empty and populated model, enter or
   change a value, check the exact intent, and confirm that a host update renders back in the UI. Exercise
   read-only and unavailable states when applicable. Cover a specific regression with a focused test and
   check interactive or layout changes in the browser or appropriate native harness. Check light and dark
   themes and print where supported. Run targeted checks during implementation and `pnpm check` once at
   the end. Report which renderers and interactions were actually verified.

## The one rule

Components render an immutable view model and emit typed intents. **They own nothing else.**

Keep HTTP, routing, storage, services, repositories, clinical validation, terminology lookup,
scoring and inference about completion, normality, fitness or safety in the controller or host.
UI mechanics such as focus, overlay placement, animation, scrolling and zoom can live in renderers.

Angular components use type-only controller imports and avoid browser globals and `@Inject()`.
`architecture.spec.ts` enforces the Angular source boundaries.

## Layers — import your own layer or lower, never upward

| | Dir | Holds |
|---|---|---|
| L0 | `foundations/` | `emr.css` — all tokens, both themes |
| L1 | `primitives/` | inputs, feedback, layout. **No clinical meaning.** |
| L2 | `fields/` | binds a field definition to a primitive |
| L3 | `structures/` | schema-driven containers: form, matrix, list, section |
| L4 | `domain/` | clinical surfaces: banner, checklists, documents, orders |
| L5 | `recipes/` | **data only, zero Angular** — exported schemas |
| L6 | `authoring/` | produces L2–L5 definitions |

`catalog.spec.ts` enforces the direction. Adding a component means adding an entry to
`packages/emr-ui/catalog.manifest.ts` **and** a `### Name` section in `docs/catalog/L<n>-*.md`,
or the suite fails.

## API shape — non-negotiable

```ts
// L3 / L4 / L6 — a controlled surface
readonly model = input.required<TViewModel>();
readonly headingId = input<string>();
readonly intent = output<TIntent>();

// L3 — schema-driven: definition is the shape, model is the data
readonly definition = input.required<TDefinition>();
readonly model = input<TValues>();

// L1 / L2 — a mechanical control
readonly controlId = input<string>();
readonly value = input<T | null>(null);
readonly readOnly = input(false);
readonly valueChange = output<T | null>();
```

Names are fixed: `model`, `definition`, `controlId`, `headingId`, `idPrefix`, `readOnly`.
`disabled` is **forbidden above L2**. New interaction = new intent union member, not a new
output. Full rules: `docs/api-conventions.md`.

Use Angular signal `input()` and `output()` for new components. React uses the typed
`onIntent` callback and Lit uses one bubbling, composed `intent` event. Retain the
documented `native*` escape hatches for non-serializable browser handles.

## Field contract — meaning ≠ display ≠ state

```ts
EmrFieldContract      // linkId, valueType, cardinality, terminology, validation, enableWhen, unit
EmrFieldPresentation  // label, hint, span, widget, unitDisplay
EmrFieldState         // value, enabled (resolved), messages
```

Address every node with `EmrNodePath` (`['medications', 2, 'dose']`) — strings are linkIds,
numbers are repeat indices. Covers sections, repeats and matrix cells alike.

Validation rules live on the contract; **the controller evaluates, the UI only renders
messages** — including `required`. Full design: `docs/field-contract.md`.

## Tokens, type, and print

All 45 tokens live in `foundations/emr.css` and are documented on two Storybook pages
(`Foundations / Colors`, `Foundations / Typography`). `tokens.spec.ts` fails the build if a
token is undocumented, phantom, or drifts from the CSS — so add the token AND the page entry.

Never hardcode a font size. Use the scale: `--emr-text-2xs` … `--emr-text-2xl`. Exactly one
literal remains (a 48px SVG annotation label) and it is deliberate.

Print is a presentation CONTEXT, not a component input — `.emr-print`, like `emr-theme-dark`.
Never add a `print` or `density` input to a component. Print must never leave collapsed
sections collapsed or overflow clipped; both silently omit clinical data. See `docs/print.md`.

## Clinical invariants

- These are six distinct values, never collapsed to `''`/`false`/`null`:
  `recorded` · `not-assessed` · `unable-to-assess` · `not-applicable` · `declined` · `unknown`
- Badge labels and tones are controller-supplied. Never derive severity from a number.
- `national-health-id` is generic — ABHA in India, NHS number in England. The component
  never names a scheme; the controller supplies the label.
- **Synthetic data only.** Never a real patient identifier in source, stories, or tests.

## Commands

```bash
pnpm check          # full tests, package builds, Angular hydration, registry and story typecheck
pnpm test           # vitest
pnpm storybook      # catalogue at :6006
pnpm test:visual    # playwright; baselines are darwin-only
```

Accessibility is a hard gate: WCAG 2.2 AA, zero axe violations in **both** themes, visible
focus, keyboard operable, 44px targets, never colour-alone status. Both `emr-theme-light`
and `emr-theme-dark` token sets stay in sync in `emr.css`.

## Gotchas

- `storybook-static/` is a **stale committed build** — never read it as truth. Derive story
  ids from `stories/*.stories.ts`.
- Controller is ESM: relative imports need the `.js` extension.
- Spec files are excluded from `tsc`, so tests are not typechecked.
- UI components import only **types** from `@drguptavivek/emr-controller`. `check:ssr` loads the built
  FESM with the controller unresolvable, so a runtime import there fails with `ERR_MODULE_NOT_FOUND`.
  Pure helpers a component needs at runtime live in a UI-side `*.logic.ts` file.
- Anything serialized must be an enumerable own property. A symbol-keyed or non-enumerable
  field survives an in-memory round trip and vanishes through `JSON.stringify`.
- Adding a form block kind, field type or condition operator: bump `EMR_ENGINE_VERSION` and teach
  `requiredEngineFor` about it (emr-controller `engine-version.ts`). Server-supplied definitions are
  stamped with that level; devices below it keep the last compatible definition.
