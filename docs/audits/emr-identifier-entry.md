# Audit Report: `<emr-identifier-entry>` (`#31`)

**Verdict:** `PASS`  
**Layer:** L2 (`fields`)  
**Audited:** 2026-11-18  
**Viewports & Themes:** Desktop (`1280x900` Light & Dark), Mobile (`390x844` Light)  
**Targets:** React (`EmrIdentifierEntry` + `EmrBarcodeScanField`), Lit (`<emr-identifier-entry>`), Angular (`EmrIdentifierEntryComponent` at `:4200`)

---

## 1. Summary of Changes

1. **Controller (`packages/emr-controller/src/identity.models.ts`)**:
   - Extended `IdentifierEntryView` with `required?: boolean`, `placeholder?: string`, `clearable?: boolean`, `maxLength?: number`, `messages?: readonly EmrValidationMessage[]`, and exported `IdentifierEntryTypeOption`, `DEFAULT_IDENTIFIER_ENTRY_LABELS`, and `EmrIdentifierEntryLabels`.
   - Extended `IdentifierEntryIntent` with `cleared`, `submitted`, `focused`, and `blurred` alongside `valueChanged`, `scanRequested`, and `typeSelected`.
2. **Angular (`packages/emr-ui/src/lib/fields/emr-identifier-entry.component.ts`, `emr-link-cards.component.ts`)**:
   - Added `readOnly` input (`effectiveReadOnly = readOnly || model.readOnly`), `required`, `placeholder`, `maxLength`, `clearable`, `messages`, `aria-required`, `aria-invalid`, `aria-readonly`, `focused`/`blurred`/`submitted`/`cleared` intents.
   - Replaced HTML `<input type="radio" [disabled]>` with accessible `button[role="radio"]` pill chips (roving `tabindex`, Arrow/Home/End navigation, visible circular radio dot, no `disabled` attribute).
   - Added monochrome `scanner` SVG on `.ie__scan` (with explicit Light/Dark token contrast), `44x44` Clear (`close` SVG) button, and monochrome `check` SVG for `normalisedValue`.
   - Updated `EmrLinkCardsComponent` to handle `submitted` intent cleanly.
3. **React (`packages/emr-react/src/l2-fields.tsx`, `icons.tsx`, `primitives.tsx`, `l4-identity.tsx`, `l4-cards.tsx`)**:
   - Added `'scanner'` SVG icon to `icons.tsx` and optional `tabIndex` to `EmrOptionChip`.
   - Updated `EmrIdentifierEntry` with top-level `readOnly`, wrapping `role="radiogroup"` pill chips (roving `tabIndex` + Arrow/Home/End navigation on Web), `clearable` `44x44` button, `scanner` SVG Scan button, `check` SVG `normalisedValue` readout, and full `IdentifierEntryIntent` emission.
   - Updated `EmrBarcodeScanField` and `EmrLinkCards` consumers to forward new props and handle new intents.
4. **Lit (`packages/emr-elements/src/l2-fields.ts`, `foundations.ts`, `l4-privacy-identity.ts`)**:
   - Removed illegal `?disabled` attribute from `<input>`, composed `<emr-field-frame>`, added `readOnly`/`labels`/`required`/`placeholder`/`maxLength`/`clearable`/roving `tabindex`/circular radio dots/`scanner` SVG/`check` SVG + `.emr-sr-only` in `foundations.ts`, and `.emr-control` `:hover`/`[readonly]`/`[aria-invalid]`/`[data-warning]` styles.
5. **Preview, Parity & Docs (`examples/angular-preview/preview-app.component.ts`, `entries-l1-l2.tsx`, `docs/catalog/L2-fields.md`, `l2-fields.spec.ts`)**:
   - Added standalone Angular preview fixture, switched React parity entry to canonical `<EmrIdentifierEntry>`, fixed Lit `intent` handler bug (so keystrokes no longer increment `scans`), added `readOnly`/`required`/`clearable` Active Props toggles, and updated `L2-fields.md` + tests.

---

## 2. Verification Results

- **Unit & Parity Tests (`vitest`)**: `28/28` passed (`packages/emr-react/src/l2-fields.logic.spec.ts` 10/10, `packages/emr-elements/src/l2-fields.spec.ts` 14/14, `packages/emr-react/harness/gallery/parity/parity-workbench.spec.ts` 4/4).
- **Typecheck & Builds**: `pnpm build:controller`, `pnpm lit:public`, `pnpm check:react`, `pnpm build:ui` all exited `0`.
- **Live Browser (`http://localhost:3300/#emr-identifier-entry` + `:4200`)**:
  - **1:1 Parity**: Radiogroup pill chips with circular indicators (`44px`), text input + `44x44` Clear (`×`) + `Scan` with monochrome scanner SVG (`44px`), green `normalisedValue` with monochrome check SVG (`Recognised as` sr-only), and `Scanner triggers: 0` match across React, Lit, and Angular.
  - **Interactive Sync**: `UHID` radio click, `Scan` button (`Scanner triggers: 1`), Clear (`×`) + typing `UHID-9012`, `readOnly` toggle (`Scan`/`Clear` hidden, no `disabled` attribute on `<input>` or radios), and `required` toggle (`*` indicator) synced identically across all 3 frameworks.
  - **Themes & Mobile**: Light & Dark (`1280x900`) and Mobile (`390x844`) verified with crisp contrast, clean wrapping, `0` horizontal overflow (`390px`), and `0` console errors.
