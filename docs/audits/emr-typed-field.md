# Audit Report — `emr-typed-field`

**Verdict:** `PASS`  
**Layer:** L2 Field (`EmrTypedFieldComponent` / `EmrTypedField` / `EmrTypedFieldElement`)  
**Audited At:** `:3300/#emr-typed-field` (React, Lit, Angular iframe `:4200`)

---

## 1. Automated Checks

- `pnpm lit:public` — exited `0` (`public/lit/emr-elements.bundle.js` rebuilt)
- `node scripts/build-component-api.mjs` & `pnpm registry:build` — exited `0`
- `pnpm check:react` — exited `0` (`tsc -p tsconfig.json --noEmit` & `tsc -p tsconfig.native.json --noEmit`)
- `pnpm build:ui` — exited `0`
- `pnpm vitest run packages/emr-elements/src/l2-fields.spec.ts packages/emr-react/harness/gallery/parity/parity-workbench.spec.ts` — 16/16 tests passed

## 2. Live Browser Verification (`http://localhost:3300/#emr-typed-field`)

- **Console & Network**: 0 console errors, 50/50 network requests `200 OK`.
- **1:1 Parity (`1280x800`)**: React, Lit, and Angular render `Intraocular pressure (OD) *` + `mmHg` unit badge, quantity input `19` + `mmHg`, all 6 `ClinicalAssessmentStatus` options (`Recorded`, `Not assessed`, `Unable to assess`, `Not applicable`, `Declined`, `Unknown`) + `Clear`, persistent hint (`Goldmann applanation tonometry`), and warning (`Compare with baseline target (≤ 16 mmHg)`) via `EmrFieldFrame`, with zero duplicate `"Invalid"` text and zero raw emojis.
- **Interactions & Active Props Sync**:
  - Numeric edits (`19 -> 22 -> 25 -> 24 -> 22`) and `assessmentStatus` chip clicks (`Not assessed` -> `Unable to assess` -> `Recorded`) synchronized across React, Lit, Angular, and Active Props.
  - `showMetadata`: `true -> false -> true` hid/restored the header `mmHg` unit badge and assessment status strip cleanly across all three renderers.
  - `layout`: `vertical -> horizontal -> inline -> vertical` rendered cleanly across React, Lit, and Angular without card overflow.
  - `readOnly`: `false -> true -> false` made inputs read-only and hid interactive status chips and `Clear` while retaining the `Recorded` badge.
- **Themes & Mobile (`390x844`)**: Light and Dark themes rendered crisp contrast across all three renderers; `390x844` mobile layout rendered React, Lit, and Angular cleanly inside their cards (positive spacing, zero vertical overlap, zero `body` horizontal overflow).
