# Audit Report — `emr-search-select`

- **Component:** `emr-search-select` (L1 Primitive — Single & Multiple Search-Select with Best-Match Highlight)
- **Date:** 2026-11-18
- **Verdict:** **PASS**

## Verification Summary

| Check | Result | Notes |
| --- | --- | --- |
| Automated Tests (`vitest`) | PASS | `64/64` tests passed across `packages/emr-controller/src/l1-primitives.models.spec.ts` (15/15), `packages/emr-elements/src/l1-primitives.spec.ts` (25/25), `packages/emr-react/src/l1-l2-bulletproof.spec.ts` (14/14), and `packages/emr-react/src/l1-l2-wave2.spec.ts` (10/10); plus `emr-ui` `catalog.spec.ts` (215/215) |
| Typechecks & Builds | PASS | `pnpm build:controller`, `pnpm lit:public`, `pnpm build:ui`, `pnpm check:react` (Web + Expo Native), `pnpm exec ng build emr-angular-preview --configuration=development`, `pnpm registry:build`, `node scripts/build-component-api.mjs` all exited 0 |
| Search, Best-Match Highlight & `filterMode` (`:3300` + `:4200`) | PASS | Verified deterministic best-match ranking + `"Best match"` cue on top match, `<mark>` / highlighted spans across `label`, `code`, and `description`, `filterMode` (`local` / `remote` / `none`), `creatable=true` (`Create "..."` row + `createRequested`), and keyboard `ArrowDown`/`ArrowUp`/`Home`/`End`/`Enter`/`Escape` keeping focus inside `<input role="combobox" aria-activedescendant>` |
| Single & Multiple Modes + Option Locking | PASS | Verified single & `multiple=true` removable chips (`44x44px` hit targets across React, Lit, and Angular), `maxTagCount=2` (`+2` overflow pill), `maxSelections=4` (`aria-disabled="true"` on unselected options), and per-option `readOnly` lock SVG vs `disabled` |
| Variants, States & Responsive (`390x844`) | PASS | Verified `variant` (`outline` / `filled` / `subtle` without outer border on Lit), `size` (`md` / `sm`), `loading` (`aria-busy="true"` + spinner), `required`, `readOnly` (dashed border + `aria-readonly="true"`), `disabled`, `invalid`, `warning`, `labelHidden`, dropdown `z-index` layering without occlusion, Light & Dark contrast, `0` horizontal overflow at `390x844`, and `0` console/page/network errors |
