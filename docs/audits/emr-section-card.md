# Audit Report: `emr-section-card`

- **Date:** 2026-11-19
- **Layer:** L3 (`structures`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` `check:react`)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented across Angular, React, and Lit: `sectionId`, `label`, `description`, `status` (full `EmrBadge` forwarding), `collapsible`, `collapsed`, `headingId`, `headingLevel` (`2`–`6`), `variant` (`outlined | elevated | filled | subtle`), `tone` (`neutral | info | success | warning | danger`), `padding` (`none | sm | md | lg`), `icon` (monochrome SVG only), `readOnly` (dashed border, never blocks expand/collapse), plus actions & footer slots; zero `disabled` prop above L2.
- [x] Canonical events implemented across all three renderers: `intent` (`{ type: 'toggleRequested', sectionId }`), `focused`, and `blurred` (retiring legacy Angular `toggleRequested` and React `onToggle`; updating `EmrClinicalFormComponent`, `EmrClinicalForm`, and `section-and-repeatable.stories.ts`).
- [x] Print safety (`.emr-print` & `@media print`): collapsed content remains mounted in the DOM via `[hidden]` / `.emr-section-card__content` (including React Web) and expands in print while hiding toggle buttons (`:host-context(.emr-print)` and `@media print` in Lit).
- [x] `pnpm build:controller`, `pnpm build:ui`, `pnpm check:ssr`, `pnpm check:react`, `pnpm check:stories`, `pnpm lit:public`, `node scripts/build-component-api.mjs`, `pnpm registry:build`, and targeted `vitest` (`11/11` files, `281/281` tests) passed.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] Verified live on `http://localhost:3300/#emr-section-card` and `http://localhost:4200/?selector=emr-section-card` with `0` console errors, `0` page errors, and `0` failed requests.
- [x] Typography, sizing & surfaces match across React, Lit Shadow DOM, and Angular iframe: `Inter Variable`, `H2` region heading (`16px` / `700`), `10px` card border-radius, `8px` toggle button border-radius, `44px` minimum toggle hit target on both desktop (`1280x900`) and mobile (`390x844`).
- [x] Light & Dark theme parity verified (`rgb(255, 254, 250)` Light -> `rgb(15, 23, 42)` Dark card surface; `rgb(232, 238, 242)` Light -> `rgb(38, 57, 70)` Dark header; removed `background-color` transition lag on `.emr-section-card` in `emr.css`).
- [x] Verified `390x844` mobile layout in both Light and Dark themes with `0px` horizontal overflow across host document and Angular preview iframe.
- [x] Verified `Show`/`Hide` collapse sync across React -> Lit -> Angular (`aria-expanded="false"`, `[hidden]` DOM retention), keyboard `Space` activation on Lit Shadow DOM expanding all three, and `readOnly` dashed border parity (`borderStyle: "dashed"`) while keeping collapse interactive.

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-section-card` 1:1 preview cards (`<EmrFieldValueRow>` / `<emr-field-value-row>`), **Active Props** sync, and **Properties**, **Events**, and **Usage** documentation sections verified.
- [x] Updated `docs/catalog/L3-structures.md`, `component-api-manifest.ts`, `registry/`, and `examples/angular-preview/preview-app.component.ts`.

## 4. Findings / Follow-ups
- Fixed `.emr-section-card` `background-color` CSS transition lag in `packages/emr-ui/src/lib/foundations/emr.css` during Stage 3 Dark-theme testing (`rgb(255, 254, 250)` -> `rgb(15, 23, 42)` now updates immediately).
- None remaining (`emr-section-card` is `PASS`).
