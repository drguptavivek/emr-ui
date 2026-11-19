# Audit Report: `emr-split-button`

- **Date:** 2026-11-19
- **Layer:** L1 (`primitives`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` `check:react`)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented across Angular, React, and Lit (`controlId`, `label`, `menuLabel`, `items`, `variant` `'primary' | 'secondary' | 'outline' | 'danger'`, `size` `'sm' | 'md' | 'lg'`, `align`, `open`, `defaultOpen`, `loading`, `readOnly`, `disabled`; outputs `clicked`, `itemSelected` emitting `EmrMenuItem`, `openChange`, `focused`, `blurred`).
- [x] Fixed React Dark-mode `#ffffff` foreground contrast bug via `resolveButtonPalette`, added `loading` spinner & `readOnly` gating (`canTriggerEmrSplitPrimary`, `canOpenEmrSplitMenu`), monochrome SVGs, `:focus-visible` z-index promotion, and full keyboard menu traversal.
- [x] Verified `pnpm test` (`117/117` files, `1701/1701` tests), `check:react`, `check:ssr`, and `check:stories`.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes (`sbReact`: `"Sign encounter"`, `bg: rgb(51, 71, 85)`, `color: rgb(255, 255, 255)`, `h: 44`; Angular Dark `bg: rgb(51, 71, 85)`, `color: rgb(232, 239, 243)`, `h: 44`) and `390x844` mobile layout verified on `http://localhost:3300/#emr-split-button` and `http://localhost:4200/?selector=emr-split-button&theme=dark` with `0` console/page errors, `0` failed requests, and `0px` horizontal overflow (`mobileDiff: 0`, standalone `diff: 0`).

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-split-button` preview cards, Active Props & `components-docs.tsx` cycles, `examples/angular-preview/preview-app.component.ts` wiring, `entries-l1-l2-wave2.tsx`, `docs/catalog/L1-primitives.md`, `catalog.manifest.ts`, `component-api-manifest.ts` (`208`), and `registry` (`210`) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-split-button` is `PASS`).
