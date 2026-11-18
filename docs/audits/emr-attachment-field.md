# Audit Report: `<emr-attachment-field>` (`#34`)

**Verdict:** `PASS`  
**Layer:** L2 (`fields`)  
**Audited:** 2026-11-18  
**Viewports & Themes:** Desktop (`1280x900` Light & Dark), Mobile (`390x844` Light)  
**Targets:** React (`EmrAttachmentField`), Lit (`<emr-attachment-field>`), Angular (`EmrAttachmentFieldComponent` at `:4200`)

---

## 1. Summary of Changes

1. **Controller (`packages/emr-controller/src/l2-fields.models.ts`)**:
   - Extended `AttachmentFieldViewModel` with `definition`, `layout`, and `showMetadata`.
   - Exported shared `formatByteSize` utility so `emr-react` and `emr-elements` reuse one canonical implementation.
2. **L1 File Trigger (`emr-ui`, `emr-react`)**:
   - **Angular (`packages/emr-ui/src/lib/primitives/emr-specialized-inputs.component.ts`)**: Added monochrome `upload` SVG icon inside `<button class="emr-button emr-button--outline">`.
   - **React (`packages/emr-react/src/l1-new-inputs.tsx`)**: Updated default `buttonLabel` to `multiple ? 'Choose files' : 'Choose file'` for 1:1 parity with Angular and Lit.
3. **Angular (`packages/emr-ui/src/lib/fields/emr-contract-fields.component.ts`)**:
   - Added `definition`, `headingId`, `labelHidden`, `layout`, `showMetadata`, `readOnly`, `focused`, `blurred`.
   - Moved attachment list above upload/capture controls, delegated six-state `ClinicalAssessmentStatus` to `<emr-field-frame>`, fixed duplicate IDs (`${id}-trigger`), kept `EmrFileTrigger` visible when at `maxItems` capacity with `[disabled]="!canAddMore()"` and `"N of M attached"` `dropHint`, added monochrome `paperclip`/`trash`/`camera`/`scanner` SVGs (`>= 44px` targets), added `data-emr-print="hide"` on upload/capture/remove controls, and gated mutating intents while keeping `itemSelected` active in `readOnly`.
4. **React (`packages/emr-react/src/l2-contract-fields.tsx`, `l2-fields.logic.ts`)**:
   - Added `definition`, `headingId`, `labelHidden`, `layout`, `showMetadata`, `readOnly`, `onFocus`, `onBlur`.
   - Delegated status strip to `<EmrFieldFrame>`, fixed `error` forwarding bug (`error={invalid ? primaryError : undefined}`), stacked `Camera`/`Scanner` below `<EmrFileTrigger>` (eliminating `390x844` overlap), added monochrome `scanner`/`trash` SVGs (`44px`), standardized empty read-only text to `"No attachments recorded."`, and gated mutating intents while keeping `itemSelected` active in `readOnly`.
5. **Lit (`packages/emr-elements/src/l2-fields-extra.ts`, `index.ts`, `l2-fields.ts`)**:
   - Exported `EmrAttachmentFieldElement` in `index.ts`, delegated status strip to `<emr-field-frame>`, added `nativeFilesSelected` forwarding, `.controlId=${id}-trigger`, `.error`, `.emr-btn--outline` (`44px`), and fixed `EmrTypedFieldElement` double `<emr-field-frame>` wrapping for `'attachment'`.
6. **Preview, Parity & Docs (`examples/angular-preview/preview-app.component.ts`, `entries-l1-l2-building-blocks.tsx`, `docs/catalog/L2-fields.md`, `l2-fields.spec.ts`)**:
   - Wired standalone Angular preview fixture, updated `entries-l1-l2-building-blocks.tsx` with `maxItems: 3`, `filesSelected`, `itemRemoveRequested`, `statusChangeRequested`, updated `L2-fields.md`, and added unit tests.

---

## 2. Verification Results

- **Unit & Parity Tests (`vitest`)**: `31/31` passed (`l2-fields.logic.spec.ts` 10/10, `l2-fields.spec.ts` 17/17, `parity-workbench.spec.ts` 4/4).
- **Typecheck & Builds**: `pnpm build:controller`, `pnpm lit:public`, `pnpm check:react`, `pnpm build:ui` all exited `0`.
- **Live Browser (`http://localhost:3300/#emr-attachment-field` + `:4200`)**:
  - **1:1 Parity**: Attachment list above trigger (`District-hospital-referral.pdf`, `Verified` badge, `Remove` with `trash` SVG), `Choose files` with monochrome `upload` SVG, `Camera` & `Scanner` below (`>= 44px`), and `readOnly` keeping `Open` active match across React, Lit, and Angular.
  - **Interactive Sync**: `Remove`, `Reset`, `readOnly` toggle, `required` `*` indicator, and `itemSelected` while `readOnly` verified.
  - **Themes & Mobile**: Light & Dark (`1280x900`) and Mobile (`390x844`, zero overlap, `0` horizontal overflow) verified with `0` console errors.
