# Audit Report: `emr-menu`

- **Date:** 2026-11-19
- **Layer:** L1 (`primitives`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` `check:react`)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented across Angular, React, and Lit (`controlId`, `label`, `ariaLabel`, `triggerIcon`, `items`, `variant`, `size`, `align`, `open`, `defaultOpen`, `readOnly`, `disabled`; outputs `itemSelected` emitting `EmrMenuItem`, `openChange`, `focused`, `blurred`).
- [x] Added controller navigation/gating helpers (`canOpenEmrMenu`, `canSelectEmrMenuItem`, `getEnabledMenuIndices`, `moveEmrMenuFocusIndex`, `findEmrMenuTypeaheadIndex`), fixed Lit disabled-item focus indexing bug, added monochrome `more-vertical` / `more-horizontal` / `chevron-down` SVGs, floating overlay + outside-click + `Arrow`/`Home`/`End`/`Escape`/typeahead keyboard nav, and decoupled `readOnly` from `disabled`.
- [x] Verified `pnpm test` (`117/117` files, `1701/1701` tests), `check:react`, `check:ssr`, and `check:stories`.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-menu` and `http://localhost:4200/?selector=emr-menu&theme=dark` with `0` console/page errors, `0` failed requests, `44px` trigger target height, and `0px` horizontal overflow (`mobileDiff: 0`, standalone `diff: 0`).
- [x] Verified opening menu (`3` `menuitem` entries) and `Escape` close (`menuAfterEsc: 0`).

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-menu` preview cards, Active Props & `components-docs.tsx` cycles, `examples/angular-preview/preview-app.component.ts` wiring, `entries-l1-l2-wave2.tsx`, `docs/catalog/L1-primitives.md`, `catalog.manifest.ts`, `component-api-manifest.ts` (`208`), and `registry` (`210`) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-menu` is `PASS`).
