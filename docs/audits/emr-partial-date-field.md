# Audit Report: `<emr-partial-date-field>` (`#33`)

**Verdict:** `PASS`  
**Layer:** L2 (`fields`)  
**Audited:** 2026-11-18  
**Viewports & Themes:** Desktop (`1280x900` Light & Dark), Mobile (`390x844` Light)  
**Targets:** React (`EmrPartialDateField`), Lit (`<emr-partial-date-field>`), Angular (`EmrPartialDateFieldComponent` at `:4200`)

---

## 1. Summary of Changes

1. **Controller (`packages/emr-controller/src/l2-fields.models.ts`)**:
   - Extended `PartialDateFieldViewModel` with `definition`, `displayFormat`, `defaultPrecision`, `clearable`, and `size`.
   - Exported `DEFAULT_PARTIAL_DATE_PRECISION_OPTIONS` (`Year`, `Year & month`, `Full date`) and `adaptPartialDateForPrecision` — truncating finer -> coarser (`2025-11-14` -> `2025-11` -> `2025`) and returning `null` when going coarser -> finer so unrecorded `-01` / `-01-01` segments are never fabricated.
2. **Angular (`packages/emr-ui/src/lib/fields/emr-contract-fields.component.ts`)**:
   - Aligned precision labels (`Year`, `Year & month`, `Full date`), added `definition`, `headingId`, `labelHidden`, `layout`, `showMetadata`, `readOnly`, `clearable`, `size`, `focused`, `blurred`, `draftPrecision` signal, and `adaptPartialDateLocal` (no `-01` fabrication).
   - Delegated six-state `ClinicalAssessmentStatus` to `<emr-field-frame>`, fixed duplicate IDs (`${id}-control`), and added a `44px` Clear button with monochrome `close` SVG.
3. **React (`packages/emr-react/src/l2-contract-fields.tsx`, `l2-fields.logic.ts`, `l1-new-inputs.tsx`)**:
   - Fixed `adaptPartialDatePrecision` to reuse `adaptPartialDateForPrecision` from `emr-controller` (eliminating `-01` fabrication).
   - Aligned precision order/labels (`Year`, `Year & month`, `Full date`), added `definition`, `headingId`, `labelHidden`, `layout`, `showMetadata`, `readOnly`, `defaultPrecision`, `displayFormat`, `clearable`, `size`, `onFocus`, `onBlur`.
   - Delegated status strip to `<EmrFieldFrame>`, added `44px` `× Clear` button beside `<EmrTypedText>`, synced `draftPrecision` with `model.defaultPrecision`, and removed `flexBasis: 0` on `segmentBtn` so `"Year & month"` never truncates at `390px`.
4. **Lit (`packages/emr-elements/src/l2-fields-extra.ts`, `index.ts`, `l2-fields.ts`)**:
   - Exported `EmrPartialDateFieldElement` in `index.ts`, aligned labels (`Year`, `Year & month`, `Full date`), switched to vertical stack + `<emr-field-frame>` delegation, added `draftPrecision` + `adaptPartialDateForPrecision`, `${id}-control` ID, `displayFormat: 'dd-mm-yyyy'` default, `44px` `× Clear` button, and fixed `EmrTypedFieldElement` double `<emr-field-frame>` wrapping for `'partial-date'`.
5. **Preview, Parity & Docs (`examples/angular-preview/preview-app.component.ts`, `entries-l1-l2-building-blocks.tsx`, `docs/catalog/L2-fields.md`, `l2-fields.spec.ts`)**:
   - Wired standalone Angular preview fixture, synced `defaultPrecision` across React/Lit/Angular on `precisionChangeRequested`, updated `L2-fields.md`, and added unit tests.

---

## 2. Verification Results

- **Unit & Parity Tests (`vitest`)**: `30/30` passed (`l2-fields.logic.spec.ts` 10/10, `l2-fields.spec.ts` 16/16, `parity-workbench.spec.ts` 4/4).
- **Typecheck & Builds**: `pnpm build:controller`, `pnpm lit:public`, `pnpm check:react`, `pnpm build:ui` all exited `0`.
- **Live Browser (`http://localhost:3300/#emr-partial-date-field` + `:4200`)**:
  - **1:1 Parity**: Label, segmented precision (`Year`, `Year & month`, `Full date`, `44px`), date input (`44px`), `× Clear` (`44px`), and hint match across React, Lit, and Angular.
  - **Interactive Sync**: `Year` truncation (`2025`), `Full date` clearing (`null`, no `2025-01-01` fabrication) with `defaultPrecision` sync across React/Lit/Angular, `readOnly` locking without `disabled`, and `required` `*` indicator verified.
  - **Themes & Mobile**: Light & Dark (`1280x900`) and Mobile (`390x844`, full `"Year & month"` label, `0` horizontal overflow) verified with `0` console errors.
