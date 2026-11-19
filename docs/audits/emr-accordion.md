# Audit Report: `emr-accordion`

- **Date:** 2026-11-19
- **Layer:** L1 (`primitives`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` `check:react`)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented across Angular, React, and Lit (`controlId`, `items` with optional `icon`, `expandedIds`, `defaultExpandedIds`, `multiple`, `variant`, `size`, `headingLevel`, `readOnly`, `disabled`, React `renderContent`; outputs `expandedIdsChange`, `itemToggled`, `focused`, `blurred`).
- [x] Fixed Lit `"[object Object]"` `EmrBadge` rendering bug (`litNoObjectObject: true`), kept collapsed Web panels mounted in DOM with `hidden` for `.emr-print` / `@media print` reveal across Angular, React Web, and Lit (`accPanelRegionsInDom: 4`), added `role="heading" aria-level` wrapping triggers, monochrome `chevron-down` SVGs, and `ArrowDown`/`ArrowUp`/`Home`/`End` header navigation.
- [x] Verified `pnpm test` (`117/117` files, `1701/1701` tests), `check:react`, `check:ssr`, and `check:stories`.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-accordion` and `http://localhost:4200/?selector=emr-accordion&theme=dark` with `0` console/page errors, `0` failed requests, `60px` trigger height (`>= 44px`), and `0px` horizontal overflow (`mobileDiff: 0`, standalone `diff: 0`).

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-accordion` preview cards, Active Props & `components-docs.tsx` cycles, `examples/angular-preview/preview-app.component.ts` wiring, `entries-l1-l2-wave2.tsx`, `docs/catalog/L1-primitives.md`, `catalog.manifest.ts`, `component-api-manifest.ts` (`208`), and `registry` (`210`) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-accordion` is `PASS`).
