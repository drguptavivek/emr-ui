# Audit Report — `emr-combobox`

- **Component:** `emr-combobox` (L1 Primitive — Editable Free-Solo Combobox with Autocomplete & Best-Match Highlight)
- **Date:** 2026-11-18
- **Verdict:** **PASS**

## Verification Summary

| Check | Result | Notes |
| --- | --- | --- |
| Automated Tests (`vitest`) | PASS | `16/16` passed in `packages/emr-controller/src/l1-primitives.models.spec.ts` and `10/10` passed in `packages/emr-react/src/l1-l2-wave2.spec.ts`; `EmrComboboxElement` test passed in `packages/emr-elements/src/l1-l2-wave2.spec.ts` |
| Typechecks & Builds | PASS | `pnpm build:controller`, `pnpm lit:public`, `pnpm build:ui`, `pnpm check:react` (Web + Expo Native), `pnpm exec ng build emr-angular-preview --configuration=development`, `pnpm registry:build`, `node scripts/build-component-api.mjs` all exited 0 |
| Search, Best-Match Highlight & Custom Value (`:3300` + `:4200`) | PASS | Verified `"Best match"` cue on top ranked option, `<mark>` / bold highlight spans across `label`/`code`/`description`, `highlightMatch` toggle, `filterMode` (`local` / `remote` / `none`), `allowCustomValue=true` free-text commit on `Enter`, and `ArrowDown`/`ArrowUp`/`Home`/`End`/`Enter`/`Escape` keyboard nav keeping focus inside `<input role="combobox" aria-activedescendant>` across React and Lit |
| Active Props & Validation Chrome | PASS | Verified `variant` (`outline` / `filled` / `subtle` with transparent subtle Clear/Chevron buttons), `size` (`md` / `sm`), `clearable`, `loading` (`aria-busy="true"` + spinner), `required` (`aria-required`), `readOnly` (dashed border + lock), `disabled`, `invalid`, `warning` (amber border + amber status text), `error` (red border + alert), `labelHidden`, and monochrome SVG icons (zero raw emojis or Unicode glyphs) |
| Theme & Responsive (`390x844`) | PASS | Light & Dark contrast verified; single-row `flex-wrap: nowrap` bar and `>= 44x44px` hit targets across React, Lit, and Angular at `390x844` with `0` horizontal overflow and `0` console/page/network errors |
