# EMR — Current Handoff

Updated: 19 November 2026. Code baseline: branch `main` at `16d309d` plus uncommitted working-tree additions (all L1 primitives `#1`–`#25` + all Wave 2 L1/L2 primitives/fields and all L2 clinical building blocks `#26`–`#44` audited `PASS` across `emr-controller`, `emr-ui`, `emr-react`, `emr-elements`, `examples/angular-preview/`, and `docs/audits/*.md`).

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

### Recent session changes (19 November 2026)

- **L2 Clinical Building Blocks (`#35`–`#44`) & `emr-segmented-control` `PASS`**:
  - Completed Stage 1–3 parity & verification (`docs/audits/*.md` `PASS`) for `emr-paired-field`, `emr-duration-input`, `emr-range-field`, `emr-signature-capture-field` (plus `EmrTypedFieldComponent.dependsOn` in `catalog.manifest.ts`), `emr-phone-input`, `emr-address-field`, `emr-macro-text-field`, `emr-laterality-field`, `emr-visual-acuity-field`, and `emr-refraction-field`.
  - Fixed React Web `EmrSegmentedControl` pointer click (`onPress` on Web in `l1-new-inputs.tsx`), Angular `.emr-segmented` / `.emr-select-shell` / `.emr-button` Dark theme `background-color` transition lag (`emr.css`), React `EmrSelect` `44px` trigger height (`primitives.tsx`), and converted `EmrMacroTextField` SmartPhrases to in-flow layout across React, Lit, and Angular.
- **Wave 2 Primitives & Image Field (`18` entries in `entries-l1-l2-wave2.tsx`) `PASS`**:
  - **Batch A (`emr-toggle-group`, `emr-tree-view`, `emr-tree-select`)**: Unified React `EmrToggleGroup` to `role="switch"` group, fixed tri-state `role="checkbox"` `showSelectAll`, fixed Angular `[role="treeitem"]` `aria-checked` (`true`/`false`/`mixed`), eliminated nested interactive elements in React `EmrTreeSelect` + added mobile `Modal` sheet, fixed Lit disabled-row index drift & floating panel dismissal.
  - **Batch B (`emr-image-viewer`, `emr-image-cropper`, `emr-image-upload`, `emr-image-field`)**: Added monochrome SVGs, Expo Native `PanResponder` drag pan & `<Image>` transforms, `<canvas>` crop rasterization (template `#cropCanvas` in Angular), `44x44px` crop corner hit targets + outer scrim, `validateUploadedImageFile` + `FileReader.readAsDataURL`, modal Lightbox/Crop dialogs with focus restoration, removed forbidden `disabled` prop from L2 `EmrImageField` & `typed-field` `'image-upload'`, and fixed React `EmrImageViewer` `390px` toolbar wrap.
  - **Batch C (`emr-date-range-input`, `emr-slider`, `emr-range-slider`, `emr-masked-input`, `emr-otp-input`)**: Unified `emr-range-slider` onto a single dual-thumb `role="slider"` track (`PanResponder` on Expo Native) with cross-bounded `aria-*` and `clampRangeSliderPair` boundary `minDistance`, proportional clickable `marks`, `buildDateRangeCalendarGrid` & `HH:mm` `datetime` preservation, backslash mask escaping & caret preservation, and SMS `one-time-code` OTP autofill without `maxlength="1"`.
  - **Batch D (`emr-menu`, `emr-split-button`, `emr-accordion`, `emr-breadcrumbs`, `emr-color-picker`, `emr-copy-button`)**: Fixed Lit `EmrAccordionElement` `[object Object]` badge bug and kept `[hidden]` accordion panels mounted for `.emr-print` expansion, fixed Dark-mode `EmrSplitButton` foreground contrast & Lit `EmrMenuElement` disabled-item focus index, replaced non-semantic current breadcrumb `<Pressable>` with `aria-current="page"`, unified `44x44px` `EmrColorPicker` radio swatches with `aria-checked="true" | "false"`, and added timer cleanup & `EmrCopyButton` live feedback across all renderers.
- **Resolved all 8 pre-existing / regex-drift `pnpm check` test failures across 7 files** (`emr-elements` architecture color/font literals, `emr-react` `*.logic.ts` controller barrel split, `emr-stat-tile` `ViewEncapsulation.None` removal, and `controlled-components`/`l1-l2-primitives-fields`/`l1-l2-wave2` spec regexes).

## Required boundaries

- Immutable `model` (or `definition` + `model` for schema-driven L3); one typed `intent` output/callback/event for controlled surfaces. L1/L2 controls use `value`/`valueChange`. `disabled` is forbidden above L2.
- Controllers own networking, routing, persistence, validation, terminology, scoring, and clinical interpretation. UI owns only transient focus, gestures, and viewport behaviour.
- Keep `recorded`, `not-assessed`, `unable-to-assess`, `not-applicable`, `declined`, and `unknown` distinct. Synthetic data only.
- Design tokens live in `foundations/emr.css` (`emr-theme-light` and `emr-theme-dark`); no hardcoded font sizes or colour literals in components. Print is a presentation context (`.emr-print`), never a component input.
- Follow `AGENTS.md`, `docs/api-conventions.md`, and `docs/field-contract.md`.

## Verification state

- **`pnpm check` (`19 Nov 2026`)**: **PASSED (exit code `0`)** — `build:controller`, `registry:build` (`210` items), `vitest run` (**`117/117` test files, `1701/1701` tests, `0` failed**), `check:node-controller`, `build:ui`, `check:ssr`, `check:react` (Web & Expo Native), `build:react`, `build:elements`, and `check:stories` all passed cleanly.
- **`build-component-api.mjs`**: Generated `component-api-manifest.ts` (`208` components).
- **Live previews**: `:3300` (`pnpm site` + `public/lit/emr-elements.bundle.js` + `public/angular` via `emr-angular-preview`) and `:4200` (`ng serve emr-angular-preview`) verified across `68` `PASS` audit reports (`docs/audits/emr-*.md`) covering L1 (`#1`–`#25` + Wave 2) and L2 (`#26`–`#44` + `emr-image-field`).

## Pending tasks

1. **Continue 3-stage component parity & verification (`L3` structures -> `L4` domain -> `L6` authoring)**:
   - **Audited `PASS` so far (`68` components in `docs/audits/`)**: All L1 primitives (core `#1`–`#25` + choice/selection + all Wave 2 L1 entries) and all L2 clinical fields (`#26 emr-field-frame` through `#44 emr-refraction-field` + `emr-image-field`).
   - **Next components**: Remaining L3 structures (`emr-section-card`, `emr-repeatable-group`, `emr-clinical-form`, `emr-clinical-list`, `emr-clinical-matrix`, workstation shells) -> L4 domain -> L6 authoring.
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
