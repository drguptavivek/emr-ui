# Audit Report — `emr-coded-input`

**Verdict:** `PASS`  
**Layer:** L2 Field (`EmrCodedInputComponent` / `EmrCodedInput` / `EmrCodedInputElement`)  
**Audited At:** `:3300/#emr-coded-input` (React, Lit, Angular iframe `:4200`)

---

## 1. Automated Checks

- `pnpm lit:public` — exited `0` (`public/lit/emr-elements.bundle.js` rebuilt)
- `node scripts/build-component-api.mjs` & `pnpm registry:build` — exited `0`
- `pnpm check:react` — exited `0` (`tsc -p tsconfig.json --noEmit` & `tsc -p tsconfig.native.json --noEmit`)
- `pnpm build:ui` — exited `0`
- `pnpm vitest run packages/emr-elements/src/l2-fields.spec.ts packages/emr-react/harness/gallery/parity/parity-workbench.spec.ts` — 17/17 tests passed (verifies `ArrowDown`/`Enter` combobox selection, `aria-activedescendant`, `aria-invalid`, monochrome SVG close icon, and `readOnly` `"Not supplied"` without `disabled`)

## 2. Live Browser Verification (`http://localhost:3300/#emr-coded-input`)

- **Console & Network**: 0 console errors, 50/50 network requests `200 OK`.
- **1:1 Parity & Monochrome Icons (`1280x800`)**: React, Lit, and Angular render `Encounter diagnoses *`, 2 selected concept chips (`Primary open-angle glaucoma` / `SNOMED CT 77075001` and `Primary open-angle glaucoma, bilateral` / `ICD-10 H40.11`) with `>= 44px` monochrome SVG close buttons, search combobox (`Search by name or code`), persistent hint (`Search SNOMED CT or ICD-10 concepts`), and assessment status selector (`Status not set` + 6 options).
- **Interactions & Cross-Framework Sync**:
  - Removing `ICD-10 H40.11` in React synchronized across React, Lit, and Angular.
  - Searching `"cat"` and selecting `Cataract (193570009)` in Lit added the `Cataract` chip in sync across all three renderers.
  - Selecting `Recorded` and clicking `Clear status` (`44px` button) in Angular synchronized `status` across all three renderers.
- **Themes & Mobile (`390x844`)**: Light and Dark themes rendered crisp contrast across all three renderers; `390x844` mobile layout rendered cleanly (`bodyWidth: 390`, zero horizontal overflow, zero card clipping).
