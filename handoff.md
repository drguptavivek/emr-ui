# EMR — Current Handoff

Updated: 19 November 2026. Code baseline: branch `main` at `a984d0c` plus committed L3 structures parity (15/15 `PASS`), full 63-component L1 visual & UX sweep (`PASS`), `emr-tabs` horizontal narrow-screen scroll chevrons, `emr-paired-input`/`emr-paired-field` `'select'` dropdowns, and Stage 2 L6 Authoring Batch 1 implementations.

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

### Recent session changes (19 November 2026 — Part 2)

- **L3 Structures Full Parity & Sign-Off (`15/15` Components `PASS` in `docs/audits/`)**:
  - Completed Stage 1–3 parity across `emr-controller`, `emr-ui`, `emr-react` (Web & Expo Native), `emr-elements` (Lit), `examples/angular-preview/`, stories, and `docs/audits/emr-*.md` for `emr-section-card`, `emr-repeatable-group`, `emr-clinical-form`, `emr-clinical-list`, `emr-allergy-list`, `emr-medication-list`, `emr-chronic-disease-list`, `emr-personal-history-list`, `emr-clinical-matrix`, `emr-clinical-cell-renderer`, `emr-annotation-toolbar`, `emr-annotation-list`, `emr-image-template-picker`, `emr-time-axis`, `emr-data-table`, `emr-split-workspace`, `emr-command-palette`, `emr-master-detail`, and `emr-synchronized-time-grid`.
- **Full L1 Visual & UX Sweep (`63/63 PASS`, `docs/audits/emr-l1-sweep.md`) + `emr-paired-field` `'select'` Mode**:
  - Wired all 15 previously unwired L1 Angular preview fixtures in `examples/angular-preview/preview-app.component.ts` (`63/63` wired) and fixed `emr-image.component.ts` `NG5002` template mismatch.
  - Added horizontal scrollable `emr-tabs` (`44x44px` monochrome chevron scroll buttons, `data-emr-print="hide"`, `:focus-visible`/React `focusRing`, `minWidth: '100%'` track) across React, Lit, and Angular (`0px` overflow at `390x844`).
  - Added `'select'` paired dropdown side mode (`options`/`firstOptions`/`secondOptions`) on `EmrPairedInput` (L1) and `EmrPairedField` (L2) across controller, React, Lit, Angular, Active Props, and catalog docs.
  - Fixed Angular `EmrDateTimeInputComponent` Calendar & Time popovers (`Today`, `Now`, `Clear`, `Done`, `Escape`), `EmrTooltipComponent` top-edge auto-flip below, `EmrIconButtonComponent` & `EmrSearchInputComponent` monochrome SVGs, `.emr-input-affix__field` flex-shrink (`emr-quantity-input` `0px` overflow + custom SVG chevron on `.emr-quantity__unit`), `EmrPaginationComponent` wrapped page buttons, `EmrLikert` custom text `options`, `EmrVas` `precision`, and `EmrClinicalMatrix` Light/Dark parity.
- **L6 Authoring Batch 1 (Stage 2 Complete, Stage 3 Pending)**:
  - Implemented Stage 2 parity updates for `emr-field-generator`, `emr-terminology-search`, `emr-validation-rule-editor`, `emr-field-library-picker`, `emr-template-composer`, and `emr-template-preview` (pending Stage 3 live Playwright + Neon sign-off).

## Required boundaries

- Immutable `model` (or `definition` + `model` for schema-driven L3); one typed `intent` output/callback/event for controlled surfaces. L1/L2 controls use `value`/`valueChange`. `disabled` is forbidden above L2.
- Controllers own networking, routing, persistence, validation, terminology, scoring, and clinical interpretation. UI owns only transient focus, gestures, and viewport behaviour.
- Keep `recorded`, `not-assessed`, `unable-to-assess`, `not-applicable`, `declined`, and `unknown` distinct. Synthetic data only.
- Design tokens live in `foundations/emr.css` (`emr-theme-light` and `emr-theme-dark`); no hardcoded font sizes or colour literals in components. Print is a presentation context (`.emr-print`), never a component input.
- Follow `AGENTS.md`, `docs/api-conventions.md`, and `docs/field-contract.md`.

## Verification state

- **`pnpm check` (`19 Nov 2026`)**: **PASSED (exit code `0`)** — `build:controller`, `registry:build` (`210` items), `vitest run` (**`143/143` test files, `1826/1826` tests, `0` failed**), `check:node-controller`, `build:ui`, `check:ssr`, `check:react` (Web & Expo Native), `build:react`, `build:elements`, and `check:stories` all passed cleanly.
- **`build-component-api.mjs` & `ng build emr-angular-preview`**: Generated `component-api-manifest.ts` (`209` components) and rebuilt `packages/emr-react/harness/next/public/angular`.
- **Live previews**: `:3300` (`pnpm site` + `public/lit/emr-elements.bundle.js`) and `:4200` (`ng serve emr-angular-preview`) verified across L1 (`63/63 PASS`), L2 (`20/20`), and all L3 (`15/15`) structures.

## Pending tasks

1. **Continue 3-stage component parity & verification (`L6` authoring -> `L4` domain)**:
   - **Next Step A — L6 Authoring Batch 1 (Stage 3 + Neon Sign-Off)**: Run Stage 3 live Playwright (`:3300` & `:4200`, Light/Dark, `390px`) + WCAG/print + Neon Final Sign-Off for `emr-field-generator`, `emr-terminology-search`, `emr-validation-rule-editor`, `emr-field-library-picker`, `emr-template-composer`, `emr-template-preview` -> write `docs/audits/<selector>.md` (`PASS`).
   - **Next Step B — L6 Authoring Batch 2 (Stage 1 -> Stage 2 -> Stage 3)**: Complete `emr-logic-rule-builder`, `emr-score-builder`, and `emr-fhir-questionnaire-mapper` across `emr-controller`, `emr-ui` (`.logic.ts`, `idPrefix`, `[readOnly]`, recursive subgroup, `optionPoints`, `44px` targets, `2px` sharp alerts, `--emr-font-mono`, unclipped print), `emr-react`, `emr-elements`, parity gallery, and `docs/audits/<selector>.md` (`PASS`).
   - **Next Step C — L4 Domain Parity**: Proceed through `entries-l4-clinical.tsx` and `entries-l4-workflows.tsx` (Stage 1 -> Stage 2 -> Stage 3 -> `docs/audits/<selector>.md`).
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
