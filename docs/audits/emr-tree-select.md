# Audit Report: `emr-tree-select`

- **Date:** 2026-11-19
- **Layer:** L1 (`primitives`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` `check:react`)

## 1. Props, Events & Validation Parity
- [x] Eliminated nested-interactive violation in React (`selectChips` sibling before `<Pressable role="combobox">`, `tsNested: 0` inside `[role="combobox"]`) and unified floating popover (`>= 520px`) / responsive Modal sheet (`< 520px` & native), outside-click + `Escape` dismissal restoring focus to combobox trigger, `removeTreeSelectionChip` cascade reconciliation, and `node.readOnly` chip protection across Angular, React, and Lit.
- [x] Unified defaults (`searchable=true`, `clearable=false`, `showExpandControls=false`), canonical props (`variant`, `size`, `displayMode`, `separator`, `closeOnSelect`, `maxTagCount`, `maxSelections`, `loading`, `invalid`, `warning`, `error`), and events (`valueChange`, `valuesChange`, `openChange`, `expandedIdsChange`, `cleared`, `focused`, `blurred`), plus `EmrTypedFieldComponent` `[invalid]`/`[warning]` forwarding.
- [x] Full `pnpm test` (`117/117` files, `1690/1690` tests), `check:react`, `check:ssr`, and `check:stories` verified cleanly.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes (`rgb(15, 23, 42)` Dark `.emr-select-shell`) and `390x844` mobile layout verified on `http://localhost:3300/#emr-tree-select` and `http://localhost:4200/?selector=emr-tree-select&theme=dark` with `0` console/page errors, `0` failed requests, `44px` combobox height, and `0px` horizontal overflow (`scrollWidth === innerWidth`).
- [x] Verified opening panel (`treeCount: 1`), `Escape` close restoring focus to `[role="combobox"]` (`treeCount: 0`), and path selection syncing `"Anterior segment / Cornea"` 1:1 across React, Lit, and Angular.

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-tree-select` preview cards, Active Props & `components-docs.tsx` cycles, `examples/angular-preview/preview-app.component.ts` wiring, `entries-l1-l2-wave2.tsx`, `docs/catalog/L1-primitives.md`, `catalog.manifest.ts`, `component-api-manifest.ts` (`208`), and `registry` (`210`) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-tree-select` is `PASS`).
