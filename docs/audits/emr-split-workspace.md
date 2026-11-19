# Audit Report: `emr-split-workspace`

- **Date:** 2026-11-19
- **Layer:** L3 (`structures`)
- **Verdict:** PASS (`neon-supervisor` Gemini 4 Neon (High) Final Sign-Off)
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo Native via `tsconfig.native.json`)

## 1. Props, Events & Validation Parity
- [x] Unified cross-renderer API: `model: EmrSplitWorkspaceViewModel`, `headingId`, `idPrefix`, `labels: Partial<EmrSplitWorkspaceLabels>`; outputs `intent: EmrSplitWorkspaceIntent`, `focused`, `blurred`. Zero `disabled` prop above L2.
- [x] Updated controller `stepSplitWorkspacePaneSizes`, `resolveSplitWorkspaceDividerBounds`, and `visibleSplitWorkspacePanes` to enforce per-pane `minWidthPct`; extracted Angular SSR-safe `emr-workstation-containers.logic.ts` (type-only controller imports); migrated to Angular signal `input()`/`output()`; registered `emr-split-workspace` in Lit `HTMLElementTagNameMap`.
- [x] Moved `Shrink` and `Grow` buttons out from inside `role="separator"` so `.divider` wraps sibling `[Shrink]`, focusable `role="separator"` grip (`>=44x44` + `ArrowLeft`/`ArrowRight`/`Home`/`End` + `:focus-visible`), and `[Grow]` across Angular, React, and Lit (zero nested interactive controls).
- [x] Monochrome SVGs (`heroChevronLeft`/`heroEllipsisVertical`/`heroChevronRight`, `chevron-left`/`more-vertical`/`chevron-right`), `--emr-text-2xs`..`md`, `>=44px` hit targets, `@container (max-width: 720px)` mobile tab mode, and `.emr-print`/`@media print` pane expansion + control hiding.
- [x] `pnpm lit:public && pnpm check` (`141/141` files, `1806/1806` tests) and `emr-angular-preview` passed.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] Verified live across `http://localhost:3300/#emr-split-workspace` and `http://localhost:4200/?selector=emr-split-workspace` (`1280x900` & `390x844`, Light & Dark) with `0px` host AND internal overflow (`scrollW === clientW === 290` on React `390x844` after header `maxWidth`/`flexShrink` fix), `>=44px` hit targets, `0` raw glyphs, `Inter Variable` typography, and `0` console/page/network errors.
- [x] Verified live preset sync (`50 / 50`), pane collapse/expand, mobile `role="tab"` selection sync across React/Lit/Angular, and `:4200` keyboard `[role="separator"]` `ArrowRight` (`["25", "50"] -> ["30", "45"]`, `nestedBtns: 0`).

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-split-workspace` 1:1 preview cards (`shell: true`), Active Props sync, `Properties`/`Events`/`Usage` docs, `docs/catalog/L3-structures.md`, `catalog.manifest.ts`, `component-api-manifest.ts`, `registry/`, and `examples/angular-preview/preview-app.component.ts` verified.

## 4. Findings / Follow-ups
- None remaining (`emr-split-workspace` is `PASS`).
