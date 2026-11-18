# Component Audit Report: `emr-vas`

- **Verdict**: `PASS`
- **Date**: 2026-11-18
- **Layer**: L1 (`primitives/`)
- **Audited Targets**:
  - Controller: `packages/emr-controller/src/l1-primitives.models.ts` (`resolveVasStep`, `vasPercent`, `snapVasValue`, `vasValueFromOffset`, `resolveVasAnchors`, `formatVasValue`, `resolveVasTicks`, `resolveVasKeyValue`, `canMutateVas`, `EMR_VAS_TRACK_INSET_PX`)
  - Angular: `packages/emr-ui/src/lib/primitives/emr-vas.component.ts` (`EmrVasComponent`, `emr-vas.logic.ts`, `emr.css`)
  - React / Expo: `packages/emr-react/src/l1-interactive-scales.tsx` (`EmrVas`)
  - Lit Web Component: `packages/emr-elements/src/l1-primitives.ts` (`EmrVasElement`), `packages/emr-elements/src/index.ts`
  - Previews & Docs: `examples/angular-preview/preview-app.component.ts`, `packages/emr-react/harness/gallery/parity/entries-l1-l2.tsx`, `packages/emr-react/harness/gallery/components-docs.tsx`, `docs/catalog/L1-primitives.md`

## Automated Verification
- `pnpm build:controller` — PASS
- `pnpm lit:public` — PASS
- `node scripts/build-component-api.mjs` — PASS (208 components)
- `pnpm registry:build` — PASS (210 items)
- `pnpm check:react` (`tsc --noEmit` Web + Expo Native) — PASS
- `pnpm build:ui` (`ng build emr-ui`) — PASS
- `pnpm vitest run packages/emr-elements/src/l1-primitives.spec.ts packages/emr-react/src/l1-interactive.logic.spec.ts packages/emr-elements/src/l1-l2-bulletproof.spec.ts packages/emr-react/harness/gallery/parity/parity-workbench.spec.ts` — PASS (34/34 tests in matching suites)

## Live Browser Verification (`http://localhost:3300/#emr-vas`)
- **Initial Render & Console Errors**: PASS — React Web, Lit `<emr-vas>`, and Angular `<emr-vas>` rendered with 1:1 parity (`Post-operative pain VAS (0.0–10.0)`, value badge `3.5`, bordered ruler track with ticks `0`, `5`, `10`, anchors `No pain` / `Worst imaginable`, monochrome SVG `Clear` button). Zero console/page errors.
- **Interaction & Sync**: PASS — Keyboard `ArrowRight` and ruler click updated value (`3.5` -> `5.5` -> `6` / `6.0`, and `7.5` from unmarked) and synced across React, Lit, Angular, and Active Props; clicking `Clear` reset all 3 cards to `Unmarked` (`null`).
- **Accessibility**: PASS — Fixed Lit `[role="slider"]` accessible name (`aria-label="Post-operative pain VAS (0.0–10.0)"`) verified in Shadow DOM accessibility tree after reload.
- **Active Props (`orientation`, `disabled`)**: PASS — Fixed Angular preview iframe auto-resizing via `ResizeObserver` (`emr-preview-height` postMessage) so `orientation="vertical"` expands the Angular iframe cleanly (`350px` height) with zero clipping of tick `0` or `No pain`; `disabled=true` dims tracks and hides `Clear` across all 3 frameworks.
- **Dark Mode & `390px` Mobile Viewport**: PASS — Crisp contrast in Dark mode and zero horizontal overflow (`390px` body width) on mobile.
