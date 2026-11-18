# Audit Report — `emr-segmented-control`

- **Component:** `emr-segmented-control` (L1 Primitive — Single-Select Segmented Control)
- **Date:** 2026-11-18
- **Verdict:** **PASS**

## Verification Summary

| Check | Result | Notes |
| --- | --- | --- |
| Automated Tests (`vitest`) | PASS | `24/24` tests passed across `packages/emr-controller/src/l1-primitives.models.spec.ts` (18/18) and `packages/emr-elements/src/l1-primitives-extra.spec.ts` (6/6); plus `emr-print.spec.ts`, `catalog.spec.ts`, and `l1-l2-bulletproof.spec.ts` (`265/265` across 5 files) |
| Typechecks & Builds | PASS | `pnpm build:controller`, `pnpm lit:public`, `pnpm build:ui`, `pnpm check:react` (Web + Expo Native), `pnpm exec ng build emr-angular-preview --configuration=development`, `pnpm registry:build`, `node scripts/build-component-api.mjs` all exited 0 |
| Live Parity (`:3300` React + Lit & `:4200` Angular) | PASS | Verified `variant` (`default`/`outline`/`soft`), `shape` (`default`/`pill`), `size` (`md`/`sm`), `orientation` (`horizontal`/`vertical`), `fullWidth`, `allowDeselect`, `clearable` (with monochrome `close` SVG), `required` (`aria-required="true"` + red ` *`), `readOnly` (dashed track + focusable), `disabled`, `invalid`, `warning` (`role="status"`), `error` (`role="alert"`), and `labelHidden` |
| Rich Options & Keyboard (`role="radiogroup"`) | PASS | Verified monochrome SVG icons, descriptions, `EmrBadge` formatting (`Primary`, `2`, `Locked`), semantic `tone` accents, per-option `readOnly` & `disabled`, roving `tabIndex`, `ArrowLeft`/`ArrowRight`/`Home`/`End`/`Enter`/`Space` with `0px` page scroll, and `readOnly` arrow traversal without mutating `value` |
| Theme & Responsive (`390x844`) | PASS | Light & Dark contrast verified; `>= 44x44px` hit targets across `md` & `sm`; `0` horizontal overflow at `390x844` (`scrollWidth === 390`), and `0` console/page/network errors |
