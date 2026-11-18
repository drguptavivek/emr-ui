# AGENTS.md

EMR component library with a framework-neutral controller and three renderer packages:
- `@drguptavivek/emr-controller` — immutable models, ports, headless controllers, condition engine (`condition.*`, `form-logic.ts`, `engine-version.ts`). `emr-react` may import at runtime; `emr-ui` imports types only.
- `@drguptavivek/emr-ui` — standalone Angular 22 presentation components (`L1`–`L6`) + `L0` tokens (`emr.css`).
- `@drguptavivek/emr-react` — React Native (Expo SDK 58 / RN 0.88 / React 19.3) & Web (`react-native-web`). Tokens generated via `pnpm --filter @drguptavivek/emr-react tokens`. Harnesses: `harness/next` (`:3300`), `harness/expo`.
- `@drguptavivek/emr-elements` — Lit v3 Web Components with shared models and bubbling, composed `intent` events.

## Component Design & Parity Workflow

Follow [docs/COMPONENT_DESIGN_WORKFLOW.md](./docs/COMPONENT_DESIGN_WORKFLOW.md) using the 3-stage subagents in `.agents/agents/` (mirrored at `.agent/agents/`):
1. **`component-specifier`** (Opus / Soul Medium / Argon) — inspects all renderers + controller, benchmarks against **shadcn/ui, Radix, Ionic, MUI, Ant Design, Flutter**, and outputs the Component Specification & Gap Report.
2. **`component-implementer`** (Sonnet / Luna High / Hydrogen High) — implements the spec across `emr-controller`, `emr-ui`, `emr-react` (Web & Expo), `emr-elements` (Lit), `examples/angular-preview/`, `packages/emr-react/harness/gallery/parity/`, Storybook, `catalog.manifest.ts`, `docs/catalog/L<n>-*.md`, and tests.
3. **`component-verifier`** (Opus Low / Soul Low / Argon Low) — runs tests and live browser checks (`:3300` + `:4200`, Light/Dark, `390px`, hover/focus, validation/error/read-only) and writes `docs/audits/<selector>.md`. **A component is complete only when its audit verdict is `PASS`.**

Core component rules:
- Choose the lowest layer that fits (prefer L5 recipes over new components). Never ship title-and-slot shells or no-op handlers.
- Match props, events, validation/error handling, `44px` minimum targets, `Inter Variable` (`--emr-text-md` / `14px`), hover/focus/disabled/read-only states, and Light/Dark themes across Angular, React, Expo, and Lit.
- Multi-part / paired controls (e.g. `EmrPairedInput`) must support per-side types, `min`/`max`, `required`/`optional`, and per-side error / `aria-invalid` states across all renderers.
- Keep framework preview cards 1:1 (render only the component inside each card; place shared prop toggles in the **Active Props** bar).
- Regenerate `pnpm registry:build` and `node scripts/build-component-api.mjs`, rebuild `pnpm lit:public` on Lit changes, and run `pnpm check` before finishing.

## The One Rule & Layers

Components render an immutable view model and emit typed intents. **They own nothing else.** Controllers/hosts own HTTP, routing, storage, clinical validation, terminology, and scoring. Angular components use type-only controller imports and avoid browser globals and `@Inject()` (`architecture.spec.ts`).

| | Dir | Holds |
|---|---|---|
| L0 | `foundations/` | `emr.css` — all tokens, both themes |
| L1 | `primitives/` | inputs, feedback, layout. **No clinical meaning.** |
| L2 | `fields/` | binds a field definition to a primitive |
| L3 | `structures/` | schema-driven containers: form, matrix, list, section |
| L4 | `domain/` | clinical surfaces: banner, checklists, documents, orders |
| L5 | `recipes/` | **data only, zero Angular** — exported schemas |
| L6 | `authoring/` | produces L2–L5 definitions |

Import your own layer or lower, never upward (`catalog.spec.ts`). New components require both `catalog.manifest.ts` and `docs/catalog/L<n>-*.md` entries.

## API Shape & Field Contract

```ts
// L3 / L4 / L6 controlled surface: model + headingId + intent
// L3 schema-driven: definition + model
// L1 / L2 mechanical control: controlId + value + readOnly + valueChange
```

Names are fixed: `model`, `definition`, `controlId`, `headingId`, `idPrefix`, `readOnly`. `disabled` is **forbidden above L2**. Use Angular signal `input()`/`output()`, React `onIntent`, and Lit bubbling composed `intent` events (`docs/api-conventions.md`).
Field contract (`docs/field-contract.md`): `EmrFieldContract`, `EmrFieldPresentation`, `EmrFieldState`, addressed via `EmrNodePath` (`['medications', 2, 'dose']`). Controller evaluates rules; UI only renders messages.

## Tokens, Icons, Print & Clinical Invariants

- Tokens live in `foundations/emr.css` and Storybook Foundations pages (`tokens.spec.ts`). Regenerate React tokens (`pnpm --filter @drguptavivek/emr-react tokens`) and sync `emr-elements` `foundations.ts` (`font-feature-settings`, radii, focus rings). Never hardcode font sizes (`--emr-text-2xs`…`2xl`).
- Use monochrome SVG icons or plain text — **never raw color emojis** (e.g. `📅`).
- Alerts use sharp `2px` corners, a `1px` right border, a `2px` bottom underline, and translucent glassmorphism (never a thick left colored band).
- Print is a context (`.emr-print`), never a component input; never clip overflow or leave sections collapsed in print (`docs/print.md`).
- Keep `recorded`, `not-assessed`, `unable-to-assess`, `not-applicable`, `declined`, and `unknown` distinct. Badge labels/tones are controller-supplied. **Synthetic data only.**
- Accessibility is a hard gate: WCAG 2.2 AA, zero axe violations in both themes, visible focus, keyboard operable, `44px` targets, never colour-alone status.

## Commands & Gotchas

```bash
pnpm check                            # full tests, builds, SSR, React web+native, Lit, stories
pnpm check:react                      # typecheck React Web + Expo Native
pnpm test                             # vitest
pnpm site                             # primary Component Docs UI (:3300)
pnpm preview:angular                  # standalone Angular preview (:4200)
pnpm lit:public                       # rebuild public/lit/emr-elements.bundle.js
node scripts/build-component-api.mjs  # regenerate component-api-manifest.ts
pnpm storybook                        # secondary Angular Storybook (:6006)
pnpm test:visual                      # playwright (darwin baselines)
```

- `storybook-static/` is stale — derive story IDs from `stories/*.stories.ts`.
- Controller is ESM: relative imports need `.js`. Spec files are excluded from `tsc`.
- `emr-ui` imports only **types** from `emr-controller` (`check:ssr` fails on runtime imports); UI runtime helpers live in `*.logic.ts`.
- `react-native-web` strips CSS `color-mix(...)` in `View` `backgroundColor` — use an `rgba(...)` helper in `emr-react`.
- Serialized state must use enumerable own properties. New form blocks/operators require bumping `EMR_ENGINE_VERSION` (`engine-version.ts`).
