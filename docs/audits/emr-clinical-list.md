# Audit Report: `emr-clinical-list`

- **Date:** 2026-11-19
- **Layer:** L3 (`structures`)
- **Verdict:** PASS (`neon-supervisor` Gemini 4 Neon (High) Final Sign-Off)
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo Native typecheck via `tsconfig.native.json`)

## 1. Props, Events & Validation Parity
- [x] Migrated all three renderers and the controller to canonical `model: ClinicalListViewModel` (`title`, `description`, `items`, `selectedId`, `status`, `allowAdd`, `addLabel`, `emptyTitle`, `emptyMessage`, `loading`, `loadingLabel`, `error`, `readOnly`, `variant`), `headingId`, `headingLevel`, `labels`; outputs `intent` (`ClinicalListIntent`: `addRequested`, `selected`, `editRequested`, `removeRequested`, `retryRequested`), `focused`, and `blurred`. Zero `disabled` prop above L2.
- [x] Angular `EmrClinicalListComponent` migrated to signal `input()`/`output()`, split L4 wrappers cleanly into `domain/emr-clinical-lists.component.ts`, and removed legacy `@Input() items` / `@Output() action`.
- [x] `model.readOnly`, `allowAdd === false`, `item.readOnly`, `canEdit === false`, and `canRemove === false` omit ineligible Add/Edit/Remove buttons and guard intent handlers, while keeping row selection (`selectable !== false`) inspectable.
- [x] Added `aria-busy="true"` during `model.loading` across Angular, React, and Lit, `role="alert"` + Retry on `model.error`, `role="status"` + verbatim `emptyMessage` on empty lists, and `data-emr-print="hide"` on action buttons (including Lit `emr-state-message` Retry).
- [x] `pnpm check`, `check:react`, `lit:public`, `build-component-api.mjs`, `registry:build`, and `emr-angular-preview` passed.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] Verified live across `http://localhost:3300/#emr-clinical-list` and `http://localhost:4200/?selector=emr-clinical-list` (8 runs: `1280x900` & `390x844`, Light & Dark) with `0px` host AND internal Lit/React/Angular overflow (`420/420`, `292/292`, `1280/1280`, `390/390`), `>=44px` hit targets, `Inter Variable` typography, and `0` console/page errors.
- [x] Verified bidirectional Select (`selectedId` + `aria-current="true"`), Add (monotonic IDs), Edit, Remove, `loading`, `error` + Retry, `readOnly` (dashed border + omitted actions), and `variant` sync across React, Lit, and Angular.
- [x] Aligned Angular `.emr-clinical-list__header` background (`var(--emr-surface-accent)`) to match React and Lit.

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-clinical-list` 1:1 preview cards, Active Props sync, `Properties`/`Events`/`Usage` docs, `docs/catalog/L3-structures.md`, `catalog.manifest.ts`, `component-api-manifest.ts`, `registry/`, and `examples/angular-preview/preview-app.component.ts` verified.

## 4. Findings / Follow-ups
- Applied Neon's final 4 polish items (`aria-busy="true"` across Angular/React/Lit, `.emr-clinical-list__header` `background: var(--emr-surface-accent)`, Lit `emr-state-message` `data-emr-print="hide"`, L4 host `display: block; min-width: 0;`, and removed `background-color` transition on Lit `.list-item`).
- None remaining (`emr-clinical-list` is `PASS`).
