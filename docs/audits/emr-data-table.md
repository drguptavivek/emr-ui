# Audit Report: `emr-data-table`

- **Date:** 2026-11-19
- **Layer:** L3 (`structures`)
- **Verdict:** PASS (`neon-supervisor` Gemini 4 Neon (High) Final Sign-Off)
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo Native via `tsconfig.native.json` + `data-table.tsx`)

## 1. Props, Events & Validation Parity
- [x] Unified cross-renderer API: `model: EmrDataTableModel`, `headingId`, `idPrefix`, `labels: Partial<EmrDataTableLabels>`; outputs `intent: EmrDataTableIntent`, `focused`, `blurred`. Added `readOnly?: boolean`, capability guards, ID/width resolvers, tri-state Select-All helpers, and roving row/sort helpers in `surface-contracts.models.ts`. Zero `disabled` input/prop above L2.
- [x] Angular `EmrDataTableComponent`: migrated to signals with SSR-safe `emr-data-table.logic.ts` (type-only controller imports), `c.width` application, `<emr-badge>` cell badges, monochrome `NgIcon` icons (`heroXMark`, `heroChevronUp`, `heroChevronDown`, `heroChevronUpDown`), `>=44px` hit targets including `.emr-dt__check-hit`, 5-row skeleton (`aria-busy="true"`), Saved Filters `role="menu"` outside-click/keyboard nav, `container-type: inline-size` + `@container` responsive layout, and `.emr-print`/`@media print`.
- [x] React Web (`data-table.web.tsx`) & Expo Native (`data-table.tsx`): monochrome `<SvgIcon>` (`chevrons-up-down`), `<EmrBadgeView>`, Saved Filters `role="menu"` (`boxShadow: t.shadow`), tri-state Select-All (`mixed`), Comfortable/Compact density, `<EmrSelect>` Rows per page, `RESOLVED_MONO_FONT` + `tabular-nums`, `>=44px` hit boxes (`Math.max(44, t.controlHeight)`), and `.emr-print` (`data-emr-print="hide"` including `Retry` + checkbox column hiding + unclipped table rows).
- [x] Lit (`EmrDataTableElement` in `l3-structures.ts`, registered in `HTMLElementTagNameMap`): full parity with tri-state Select-All, Saved Filters `role="menu"`, density toggle, Rows per page, 5-row skeleton, empty/error states, pagination `role="status"` live region, `model.readOnly` gating, bounded internal scroll, and `.emr-print`.
- [x] `pnpm lit:public && pnpm check` (`141/141` files, `1803/1803` tests), `check:react` (web + native), `build-component-api.mjs`, `registry:build`, and `emr-angular-preview` passed.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] Verified live across `http://localhost:3300/#emr-data-table` and `http://localhost:4200/?selector=emr-data-table` (`1280x900` desktop & `390x844` mobile, Light & Dark themes) with `0px` host AND internal Shadow DOM overflow (`420/420`, `292/292`, `1280/1280`, `390/390`), internal `overflow-x: auto` table containment (`528px`/`511px` tables inside `418px`/`290px` containers), `>=44px` hit targets (`44x44` checkbox wrappers), zero raw `×`/`▲`/`▼`/`↕`, `Inter Variable` + `tabular-nums`, and `0` console/page/network errors.
- [x] Fixed Saved Filters `boxShadow` in React Web and anchored opened `role="menu"` popovers flush-left inside `292px` cards at `@container (max-width: 400px)` (`position: relative` toolbar + `position: static` menu wrap -> `x: 49..269` inside `49..341` on `:3300` React/Lit, `x: 12..232` inside `12..378` on `:4200` Angular).
- [x] Verified bidirectional sync across React, Lit, and Angular iframe for Saved Filters `role="menu"` + `ArrowDown`/`Escape`/outside-click, Sort (`aria-sort`), Filter chips, Density (`Compact`), Page size + Next/Prev, `loading` skeleton, `error`/Retry, `readOnly`, tri-state Select-All (`aria-checked="mixed"`), and `ArrowDown` row keyboard focus (`:focus-visible`).

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-data-table` 1:1 preview cards, clean Active Props (`density`, `pageSize`, `page`, `pendingOnly`, `loading`, `error`, `readOnly`, `selectedRowCount`), fixed `catalog.manifest.ts` story IDs matching `data-table.stories.ts`, expanded `docs/catalog/L3-structures.md`, `component-api-manifest.ts`, `registry/`, and `examples/angular-preview/preview-app.component.ts` verified.

## 4. Findings / Follow-ups
- None remaining (`emr-data-table` is `PASS`).
