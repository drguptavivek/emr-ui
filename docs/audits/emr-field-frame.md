# Audit Report — `emr-field-frame`

**Verdict:** `PASS`  
**Layer:** L2 Field (`EmrFieldFrameComponent` / `EmrFieldFrame` / `EmrFieldFrameElement`)  
**Audited At:** `:3300/#emr-field-frame` (React, Lit, Angular iframe `:4200`)

---

## 1. Automated Checks

- `pnpm build:controller` — exited `0`
- `pnpm build:ui` — exited `0`
- `pnpm lit:public` — exited `0` (`public/lit/emr-elements.bundle.js` rebuilt)
- `node scripts/build-component-api.mjs` & `pnpm registry:build` — exited `0`
- `pnpm check:react` — exited `0` (`tsc -p tsconfig.json --noEmit` & `tsc -p tsconfig.native.json --noEmit`)
- `pnpm vitest run packages/emr-controller/src/l1-primitives.models.spec.ts packages/emr-elements/src/l2-fields.spec.ts packages/emr-react/harness/gallery/parity/parity-workbench.spec.ts` — 26/26 tests passed

## 2. Live Browser Verification (`http://localhost:3300/#emr-field-frame`)

- **Console & Network**: 0 console errors, 50/50 network requests `200 OK`.
- **1:1 Parity (`1280x800`)**: React, Lit, and Angular render `Central corneal thickness (OD) *`, unit badge `µm`, `540` text input, all 6 `ClinicalAssessmentStatus` options (`Recorded`, `Not assessed`, `Unable to assess`, `Not applicable`, `Declined`, `Unknown`), persistent hint (`Ultrasonic pachymetry mean of 3 readings`), and clinical note (`Calibrated 08:30`) with zero raw emojis or `⚠` symbols.
- **Validation & Active Props Sync**:
  - Clearing React's input rendered `Warning: Missing pachymetry reading` alongside the persistent hint & note across React and Lit; restoring `"540"` cleared it cleanly.
  - Selecting `Not assessed` / `Unable to assess` synchronized `assessmentStatus` across React, Lit, and Angular.
  - `layout`: `vertical -> horizontal -> inline -> vertical` rendered label+unit beside control at `1280x800` across React, Lit, and Angular.
  - `showMetadata`: `true -> false -> true` toggled unit badge and status strip visibility cleanly.
  - `readOnly`: `false -> true -> false` hid `Clear` and interactive status chips while keeping the active `Recorded` badge visible.
- **Themes & Mobile (`390x844`)**: Light and Dark themes rendered crisp contrast across all three renderers. At `390x844`, React, Lit, and Angular collapsed `layout="horizontal"` cleanly to vertical (`htmlWidth: 390`, `bodyWidth: 390`, zero horizontal overflow).

## 3. Shared Controller Helpers Added

- `packages/emr-controller/src/l2-fields.models.ts`: Added `FieldFrameLayout`, `FieldFrameIntent`, `normalizeFieldFrameLayout`, `mergeFieldFrameMessages`.
