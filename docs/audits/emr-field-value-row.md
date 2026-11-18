# Audit Report — `emr-field-value-row`

**Verdict:** `PASS`  
**Layer:** L1 Primitive (`EmrFieldValueRowComponent` / `EmrFieldValueRow` / `EmrFieldValueRowElement`)  
**Audited At:** `:3300/#emr-field-value-row` (React, Lit, Angular iframe `:4200`)

---

## 1. Automated Checks

- `pnpm build:controller` — exited `0`
- `pnpm build:ui` — exited `0`
- `pnpm lit:public` — exited `0` (`public/lit/emr-elements.bundle.js` rebuilt)
- `node scripts/build-component-api.mjs` & `pnpm registry:build` — exited `0`
- `pnpm check:react` — exited `0` (`tsc -p tsconfig.json --noEmit` & `tsc -p tsconfig.native.json --noEmit`)
- `pnpm vitest run packages/emr-controller/src/l1-primitives.models.spec.ts packages/emr-elements/src/l1-primitives.spec.ts packages/emr-react/harness/gallery/parity/parity-workbench.spec.ts` — 34/34 tests passed

## 2. Live Browser Verification (`http://localhost:3300/#emr-field-value-row`)

- **Console & Network**: 0 console errors, 50/50 network requests `200 OK`.
- **1:1 Parity (`1280x800`)**: React, Lit, and Angular render 3 rows (`Parameter / Measurement / Method / Notes` heading row, `IOP (OD)` with `15 mmHg` / `GAT (Goldmann applanation)` / `09:40`, and `IOP (OS)` with muted `—` placeholder / `Pending` / `Scheduled`).
- **Active Props Controls**:
  - `size`: `md -> lg -> sm -> md` updated cell height & density across React (`38/48/52`), Lit (`38/46/50`), and Angular (`38/46/50`).
  - `tone`: `info -> success -> warning -> danger -> neutral -> info` tinted non-placeholder `value` text while keeping `IOP (OS)` placeholder `—` muted.
  - `truncate`: `false -> true -> false` toggled single-line ellipsis truncation cleanly (`89px -> 45px` in React, `82.89px -> 46px` in Lit).
  - `interactive`: `false -> true` enabled clickable rows and incremented `activations` in sync across React (`1`), Lit (`2`), and Angular (`3`).
- **Themes & Mobile (`390x844`)**: Light and Dark themes rendered crisp borders and contrast. At `390x844`, all three renderers stacked cells into 1 column with `Field:`, `Value:`, `Remarks:`, `Notes:` prefixes and hid the heading row cleanly with zero horizontal overflow or clipping.

## 3. Shared Controller Helpers Added

- `packages/emr-controller/src/l1-primitives.models.ts`: `EmrFieldValueRowSize`, `EmrFieldValueRowIntent`, `normalizeEmrFieldValueRowSize`, `normalizeEmrFieldValueRowTone`, `canActivateEmrFieldValueRow`, `resolveEmrFieldValueRowValue`.
