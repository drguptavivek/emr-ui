# Audit Report: `emr-toggle-group`

- **Date:** 2026-11-19
- **Layer:** L1 (`primitives`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` `check:react`)

## 1. Props, Events & Validation Parity
- [x] Unified `role="switch"` switch-group contract across Angular (`EmrToggleGroupComponent`), React (`EmrToggleGroup`), and Lit (`EmrToggleGroupElement`), refactoring React away from pressed buttons while preserving backwards-compatible `multiple`, `values`, `allowEmpty`, `value`, `onValueChange`, `onValuesChange`, `onCleared` APIs.
- [x] Fixed `showSelectAll` tri-state WAI-ARIA compliance to render `role="checkbox"` (`aria-checked="true" | "false" | "mixed"`) with monochrome `check`/`minus` SVG across Angular, React, and Lit.
- [x] Full parity inputs (`ariaLabel`, `variant`, `size`, `orientation`, `columns`, `labelPlacement`, `showStateLabels`, `onLabel`, `offLabel`, `exclusiveValues`, `minSelections`, `maxSelections`, `showSelectionCount`, `clearable`, `clearLabel`, `required`, `readOnly`, `disabled`, `invalid`, `warning`, `error`, `hint`) and outputs (`valueChange`, `valuesChange`, `cleared`, `focused`, `blurred`) verified (`pnpm test` `117/117` files, `1690/1690` tests, `check:react`, `check:ssr`, `check:stories`).

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-toggle-group` and `http://localhost:4200/?selector=emr-toggle-group&theme=dark` with `0` console/page errors, `0` failed requests, `44px` minimum switch hit height, and `0px` horizontal overflow at `390x844`.
- [x] Verified live switch interaction (`false -> true`) syncing 1:1 across React (`5` switches per preview), Lit (`5` switches), and Angular (`5` switches), plus Dark theme card surface rendering cleanly.

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-toggle-group` preview cards, Active Props cycles (`components-docs.tsx`, `entries-l1-l2-wave2.tsx`), `examples/angular-preview/preview-app.component.ts` wiring, `docs/catalog/L1-primitives.md`, `catalog.manifest.ts`, `component-api-manifest.ts` (`208` components), and `registry` (`210` items) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-toggle-group` is `PASS`).
