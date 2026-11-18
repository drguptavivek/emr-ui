# EMR — Current Handoff

Updated: 18 November 2026. Code baseline: branch `main` at `f6f1246` plus uncommitted working-tree additions (L1 `#1`–`#25` and L2 `#26`–`#34` audited `PASS` across `emr-controller`, `emr-ui`, `emr-react`, `emr-elements`, `examples/angular-preview/`, and `docs/audits/*.md`).

This file describes current state, outstanding work and how to resume. Replace outdated state rather than appending session history. Historical changes belong in `CHANGELOG.md`; exact commits belong in Git. Source and executable checks take precedence if documentation disagrees.

## Current project

Multi-framework, unreleased EMR component library and `shadcn`-style registry across **Angular**, **React Web / Expo (React Native)**, and **Lit Web Components**. Workspace: `/Users/vivekgupta/workspace/EMR`.

- `packages/emr-controller/src` (`@drguptavivek/emr-controller`): framework-neutral immutable view models, discriminated intent unions, promise/`AbortSignal` ports, headless controllers, OpenRosa/XPath condition engine (`EMR_ENGINE_VERSION`), L5 anatomy recipes & SVG assets (`packages/emr-controller/assets/anatomy`), annotation symbol recipes, and L5 clinical schema packs (`recipes/clinical-schemas/`). Relative ESM imports use `.js`.
- `packages/emr-ui/src/lib` (`@drguptavivek/emr-ui`): standalone Angular 22 presentation components (`L1`–`L6`), `L0` CSS design tokens (`emr.css`, `emr-print.css`), and secondary Storybook 10 catalogue (`:6006`). Type-only imports from `@drguptavivek/emr-controller`.
- `examples/angular-preview/` (`emr-angular-preview`): standalone component-wise Angular preview app (`pnpm preview:angular` on `:4200`), embedded via iframe inside the primary Component Docs UI with bidirectional `postMessage` state & theme sync.
- `packages/emr-react/src` (`@drguptavivek/emr-react`): React Web (`react-native-web`) and Expo / React Native (`SDK 58`, `RN 0.88`, `React 19.3`) components (`L1`–`L6`) with 1:1 view-model, intent, and token parity. Harnesses: Next.js 16 (`harness/next`, `:3300`) and Expo (`harness/expo`).
- `packages/emr-elements/src` (`@drguptavivek/emr-elements`): Lit v3 Web Components (`L0`–`L6`) rendering shared controller models and emitting bubbling, composed `intent` events, wired through layer registrars and `registerAllEmrElements()`.
- `registry/` & `bin/emr.mjs`: `shadcn`-style per-component registry (**210 items**: L0: 1, L1: 63, L2: 20, L3: 15, L4: 102, L6: 9) supporting `angular`, `react`, `expo`, and `lit`.
- Primary Showcase (`http://localhost:3300/` and `/gallery/`): Ionic-style `ComponentsDocsPage` (`packages/emr-react/harness/gallery/components-docs.tsx`) with fixed left component menu, live **React**, **Lit**, and **Angular** previews side-by-side, clickable **Active Props** bar, and auto-generated **Properties & Events** API tables (`scripts/build-component-api.mjs` → `component-api-manifest.ts`). Theme Studio & Registry Explorer live at `/theme-studio/`.

### Recent session changes (17 November 2026)

- **Component Docs UI & Angular Preview**: Built `ComponentsDocsPage` (`app/page.tsx`, `app/gallery/page.tsx`, `app/components/page.tsx`), `app/theme-studio/page.tsx`, `examples/angular-preview/`, and `scripts/build-component-api.mjs` (extracts inputs/outputs including inherited `EmrSignalFieldBase` props for 208 components).
- **`AGENTS.md` updated**: Codified cross-framework visual/prop/state parity rules, 1:1 preview card rules (no extra prop buttons inside one renderer's card), glassmorphic alert rule, monochrome icon rule, and primary (`:3300` / `:4200`) vs. secondary (`:6006`) commands.
- **L1 parity & validation fixes**:
  - **`emr-button`**: Loaded `Inter Variable` in Next.js (`layout.tsx`) and `emr-angular-preview` (`angular.json`), aligned `14px` (`700` weight) / `13px` small / `16px` (`48px`) large, added `size="large"` to Angular, fixed `.emr-button--ghost` transparent border, added React `EmrButton` hover state, aligned all 5 variants (`primary`, `secondary`, `outline`, `ghost`, `danger`) + hover tokens, and synced `variant`/`size`/`disabled`/`loading`/`block` via the Active Props bar.
  - **`emr-text-input`**: Added web hover border feedback (`t.focus`) to `ThemedInput`.
  - **`emr-number-input`**: Added React stepper `hovered` feedback; updated Angular `EmrNumberInputComponent` (`showSteppers`) to compact `224px` centered input, hidden native spinbuttons, and external `unit` matching React & Lit.
  - **`emr-date-input`**: Added React calendar button `hovered` feedback, removed raw `📅` emoji from hints, and constrained Angular `input[type="date"]` to `230px`.
  - **`emr-select`**: Adjusted React trigger height (`44px` outer) + hover feedback, and removed Lit-only `allowClear` mismatch in parity entry.
  - **`emr-alert`**: Unified across Angular, React, and Lit with `2px` sharp corners, `1px` right vertical border, `2px` bottom underline, translucent glassmorphism (`rgba` in React, `color-mix` in Lit/Angular), and tone glyphs.
  - **`emr-paired-input`**: Added per-side `inputType` (`text | integer | decimal`), `min`/`max`, `firstRequired`/`secondRequired`, `firstError`/`secondError` (`aria-invalid` + `role="alert"`), and `firstPlaceholder`/`secondPlaceholder` across Angular, React, and Lit.
  - **Choice & Selection Primitives (`emr-checkbox`, `emr-checkbox-group`, `emr-radio-group`, `emr-select`, `emr-search-select`, `emr-combobox`, `emr-toggle`, `emr-segmented-control`, `emr-tag-input`)**: All 9 audited `PASS` across Angular, React Web/Expo Native, and Lit (`docs/audits/emr-*.md`), including `variant`, `size` (`>= 44px` hit targets), `shape`, `labelPlacement`, `orientation` (`vertical|horizontal|grid` with `<= 480px` 1-col collapse), `readOnly` vs `disabled` locking, `lockedTags`, `allowDeselect`, `loading`, multi-select (`chips`, `maxTagCount` `+N`/summary, `maxSelections`), `filterMode: 'local' | 'remote' | 'none'`, deterministic best-match ranking & `<mark>`/highlighted spans, `creatable`/`allowCustomValue`, and WAI-ARIA keyboard/focus management.

## Required boundaries

- Immutable `model` (or `definition` + `model` for schema-driven L3); one typed `intent` output/callback/event for controlled surfaces. L1/L2 controls use `value`/`valueChange`. `disabled` is forbidden above L2.
- Controllers own networking, routing, persistence, validation, terminology, scoring, and clinical interpretation. UI owns only transient focus, gestures, and viewport behaviour.
- Keep `recorded`, `not-assessed`, `unable-to-assess`, `not-applicable`, `declined`, and `unknown` distinct. Synthetic data only.
- Design tokens live in `foundations/emr.css` (`emr-theme-light` and `emr-theme-dark`); no hardcoded font sizes or colour literals in components. Print is a presentation context (`.emr-print`), never a component input.
- Follow `AGENTS.md`, `docs/api-conventions.md`, and `docs/field-contract.md`.

## Verification state

- **`pnpm check` (`18 Nov 2026`)**: `build:controller`, `registry:build` (210 items), `build:elements`, `lit:public`, `build-component-api.mjs` (208 components), `check:react` (Web & Native), and `build:ui` all exited `0`.
- **`vitest run`**: `1613/1621` passed across `114` files in `pnpm check` (`107` files passed, `7` failed with `8` pre-existing/regex-drift failures). All targeted specs for `emr-checkbox`, `emr-checkbox-group`, `emr-radio-group`, `emr-select`, `emr-search-select`, `emr-combobox`, `emr-toggle`, `emr-segmented-control`, `emr-tag-input`, and L2 `#26`–`#34` pass.
- **8 pre-existing / regex-drift `pnpm check` test failures across 7 files**:
  - `packages/emr-elements/src/architecture.spec.ts` (pixel font-sizes in `l1-primitives.ts`)
  - `packages/emr-react/src/architecture.spec.ts` (`inputs-core.tsx` non-type controller imports)
  - `packages/emr-ui/src/lib/architecture.spec.ts` (`emr-stat-tile.component.ts` `ViewEncapsulation.None`)
  - `packages/emr-ui/src/lib/controlled-components.spec.ts` (`emr-search-select`)
  - `packages/emr-ui/src/lib/l1-l2-primitives-fields.spec.ts` (`emr-inputs.component.ts` regex)
  - `packages/emr-ui/src/lib/primitives/l1-l2-wave2.spec.ts` (`EmrRadioGroupComponent` `orientation` type regex)
  - `packages/emr-ui/src/lib/foundations/emr-print.spec.ts` (`emr-print.css` selector drift)
- Live dev servers running cleanly in background: `pnpm site` on `:3300`, `pnpm preview:angular` on `:4200`.

## Pending tasks

1. **Continue 3-stage component parity & verification (Remaining L1 primitives -> `L2` building blocks -> `L3`–`L6`)**:
   - **Audited `PASS` so far**: Choice & selection L1 primitives (`emr-checkbox`, `emr-checkbox-group`, `emr-radio-group`, `emr-select`, `emr-search-select`, `emr-combobox`, `emr-toggle`, `emr-segmented-control`, `emr-tag-input`), core L1 (`#1`–`#25`), and L2 fields `#26 emr-field-frame` through `#34 emr-attachment-field` (all have `PASS` reports in `docs/audits/<selector>.md`).
   - **Next components**: Remaining L1 primitives (`emr-badge`, `emr-tabs`, `emr-likert`, `emr-vas`), then L2 `#35 emr-paired-field` onward in `packages/emr-react/harness/gallery/parity/entries-l1-l2-building-blocks.tsx`.
   - Resolve the 7 pre-existing L1/foundations test failures listed under Verification state before release.
2. **Run full `pnpm check` & commit working-tree changes.** Stage and commit the 38 new components, L5 clinical schema packs, anatomy asset relocation, updated domain components, `ComponentsDocsPage`, `examples/angular-preview/`, `registry/`, and docs.
3. **Browser, visual, Storybook, site & native verification:**
   - Run `pnpm test:visual` (Playwright + axe across light/dark themes) and add representative story IDs for the new L3/L4/L6 components.
   - Run `pnpm build:storybook` and `pnpm site:build --base-path=/emr-ui` (include `build:angular-preview` output).
   - Verify Expo native harness (`pnpm --filter @drguptavivek/emr-react harness:expo --android`).
4. **Angular `@Input()`/`@Output()` → signal `input()`/`output()` migration:** ~42 component files in `packages/emr-ui/src/lib/` still use `@Input()`/`@Output()`; update `controlled-components.spec.ts` in the same change.
5. **`EmrClinicalList` (+ 4 L4 wrappers) migration:** Migrate from `@Input()`/`@Output()` (`action`) to `model` + `intent` and a richer `ClinicalListItem`.
6. **Annotation canvas migration & drawing plan Phases 3–5:** Replace `stateChanged` in `EmrClinicalAnnotationCanvasComponent` with discrete intents, controlled undo/redo, per-background layers, geometry edits, linked findings, and serial comparison.
7. **Clinical review of L5 anatomy outlines & annotation symbols:** Recipes under `packages/emr-controller/src/recipes/` remain `reviewStatus: 'unreviewed'` (confirm AI-traced heart cutaway generator terms before release).
8. **Contract & parity polish:** `spectacle-prescription.models.ts` (`EmrValidationMessage[]` + pre-selected `<select>` story), `emr-staged-checklist.component.ts` (`requiresNoteWhen` + labels), controller-driven localisation for fixed English status strings, `CaptureStatusBarViewModel` sync parity in Angular, and `pnpm release:dry-run`.

## Resume

```bash
git status --short
git log -5 --oneline
pnpm check
pnpm site                          # Primary Component Docs UI (:3300)
pnpm preview:angular               # Standalone Angular preview (:4200)
pnpm lit:public                    # Rebuild Lit public bundle after emr-elements edits
node scripts/build-component-api.mjs
pnpm storybook                     # Secondary Angular catalogue (:6006)
pnpm test:visual                   # Playwright; visual baselines are darwin-only
```

Preserve concurrent work. Use this handoff for current state, `CHANGELOG.md` for change summaries, and `git log`/`git show` for exact history.
