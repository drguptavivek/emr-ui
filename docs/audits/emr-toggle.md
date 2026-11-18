# Audit Report — `emr-toggle`

- **Component:** `emr-toggle` (L1 Primitive — Switch / Boolean Toggle)
- **Date:** 2026-11-18
- **Verdict:** **PASS**

## Verification Summary

| Check | Result | Notes |
| --- | --- | --- |
| Automated Tests (`vitest`) | PASS | `43/43` tests passed across `packages/emr-controller/src/l1-primitives.models.spec.ts` (17/17) and `packages/emr-elements/src/l1-primitives.spec.ts` (26/26); plus `emr-print.spec.ts`, `catalog.spec.ts`, and `l1-l2-bulletproof.spec.ts` (`284/284` across 5 files) |
| Typechecks & Builds | PASS | `pnpm build:controller`, `pnpm lit:public`, `pnpm build:ui`, `pnpm check:react` (Web + Expo Native), `pnpm exec ng build emr-angular-preview --configuration=development`, `pnpm registry:build`, `node scripts/build-component-api.mjs` all exited 0 |
| Live Parity (`:3300` React + Lit & `:4200` Angular) | PASS | Verified `checked`/`value` precedence, `variant` (`tile`/`inline`), `size` (`md`/`sm`), `labelPlacement` (`end`/`start`/`space-between`), `onLabel`/`offLabel` state labels syncing across React, Lit, and Angular, `loading` (`aria-busy="true"` + thumb spinner + mutation lock), `required`, `readOnly` (dashed border + `aria-readonly="true"` + focusable + lock), `disabled`, `invalid`, `warning` (`role="status"`), `error` (`role="alert"`, supersedes `warning`), and `labelHidden` |
| Track Geometry & Keyboard | PASS | Border-box `42x24` (`md`) and `38x22` (`sm`) track/thumb geometry with reserved `1px` border; `Space` and `Enter` toggle cleanly once per key press without page scroll across React and Lit |
| Theme, Print & Responsive (`390x844`) | PASS | Light & Dark tokens verified; `.emr-print` and `@media print` symmetric; `>= 44px` hit targets (`44px`–`46px`), `scrollWidth === 390` at `390x844` (`0` horizontal overflow), and `0` console/page/network errors |
