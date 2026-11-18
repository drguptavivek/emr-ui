# Component Audit Report: `emr-chip`

- **Verdict**: `PASS`
- **Date**: 2026-11-18
- **Layer**: L1 (`primitives/`)
- **Audited Targets**:
  - Controller: `packages/emr-controller/src/l1-primitives.models.ts` (`EmrChipVariant`, `EmrChipSize`, `normalizeEmrChipTone`, `normalizeEmrChipVariant`, `normalizeEmrChipSize`, `canMutateEmrChip`, `resolveEmrChipRemoveLabel`)
  - Angular: `packages/emr-ui/src/lib/primitives/emr-feedback.component.ts` (`EmrChipComponent`), `emr-feedback.logic.ts`, `emr.css`
  - React / Expo: `packages/emr-react/src/l1-display.tsx` (`EmrChip`)
  - Lit Web Component: `packages/emr-elements/src/l1-primitives.ts` (`EmrChipElement`), `packages/emr-elements/src/index.ts`
  - Previews & Docs: `examples/angular-preview/preview-app.component.ts`, `packages/emr-react/harness/gallery/parity/entries-l1-l2.tsx`, `packages/emr-react/harness/gallery/components-docs.tsx`, `docs/catalog/L1-primitives.md`

## Automated Verification
- `pnpm build:controller` — PASS
- `pnpm lit:public` — PASS
- `node scripts/build-component-api.mjs` — PASS (208 components)
- `pnpm registry:build` — PASS (210 items)
- `pnpm check:react` (`tsc --noEmit` Web + Expo Native) — PASS
- `pnpm build:ui` (`ng build emr-ui`) — PASS
- `pnpm vitest run packages/emr-elements/src/l1-primitives.spec.ts packages/emr-react/harness/gallery/parity/parity-workbench.spec.ts` — PASS (26/26 tests)

## Live Browser Verification (`http://localhost:3300/#emr-chip`)
- **Initial Render & 1:1 Card Parity**: PASS — React Web, Lit `<emr-chip>`, and Angular `<emr-chip>` rendered a single `Topical Rx · info` pill (`>=44px` interactive height, monochrome SVG close button). Zero console/page errors.
- **Selectable & Removable Interaction**: PASS — Clicking the selectable body toggled `selected=true` (`aria-pressed="true"`, leading monochrome check SVG, accent border) across React, Lit, Angular, and Active Props; clicking `Remove` reset `selected=false`.
- **Active Props (`variant`, `tone`, `disabled`)**: PASS — Cycling `variant` (`soft` / `solid` / `outline`), `tone` (`info` / `success` / `warning` / `danger` / `neutral`), and `disabled` (`true` / `false`) updated all 3 frameworks 1:1.
- **Dark Theme & `390px` Width**: PASS — Strong contrast in Dark theme across `soft`, `solid`, and `outline` variants, and clean `390px` layout with zero overflow.
