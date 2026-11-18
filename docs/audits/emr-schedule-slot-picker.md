# Audit Report: `<emr-schedule-slot-picker>` (`#30`)

**Verdict:** `PASS`  
**Layer:** L2 (`fields`)  
**Audited:** 2026-11-18  
**Viewports & Themes:** Desktop (`1280x900` Light & Dark), Mobile (`390x844` Light)  
**Targets:** React (`EmrScheduleSlotPicker`), Lit (`<emr-schedule-slot-picker>`), Angular (`EmrScheduleSlotPickerComponent` at `:4200`)

---

## 1. Summary of Changes

1. **Controller (`packages/emr-controller/src/schedule-slot.models.ts`)**:
   - Exported pure helpers `toggleSlot`, `setSlotAmount`, `applySlotPreset`, `isPresetActive`, and `formatSlotReadout` from the controller so `emr-react` and `emr-elements` share one canonical implementation (preserving type-only controller import in `emr-ui`).
2. **Contract & A11y (`emr-ui`, `emr-react`, `emr-elements`, `docs/catalog/L2-fields.md`)**:
   - Removed illegal `disabled` prop/attribute across all three renderers and docs (`AGENTS.md`: zero `disabled` above L2).
   - Added `aria-invalid="true"` (when `error` is set), `aria-required="true"` (when `required` is set), and simultaneous `hint` (`{id}-hint`) + `error` (`{id}-error`, `role="alert"`, `"Error: "` prefix) wired via `aria-describedby`.
   - Enforced `44px` minimum interactive target size on preset buttons and slot toggles across all renderers.
   - Standardized read-only unticked readout to `'Not selected'` across Angular, React, and Lit.
   - Replaced raw glyphs with monochrome SVG `check` icons in preset buttons and checkboxes.
3. **Layout, Dark Theme & Parity Fixes**:
   - **React (`packages/emr-react/src/l2-fields.tsx`)**: Converted `slotCard` / `slotInlineRow` to vertical stack (`overflow: 'hidden'`) with `8px` grid gap, eliminating card overflow at `1280px` and `390px`.
   - **Angular (`packages/emr-ui/src/lib/fields/emr-schedule-slot-picker.component.ts`, `examples/angular-preview/preview-app.component.ts`)**: Wired standalone Angular preview fixture (`Once daily (OD)`, `Twice daily (BD)`, `Three times daily (TDS)`, `Four times daily (QID)`) and gave `.ssp__preset` explicit token backgrounds/colors for crisp Dark theme contrast.
   - **Docs Harness (`packages/emr-react/harness/gallery/components-docs.tsx`, `entries-l1-l2.tsx`)**: Added `readOnly` Active Props toggle, fixed `flex` sizing on narrow viewports so Lit never collapses/overlaps Angular at `390px`, and added `overflowWrap: 'anywhere'` / `wordBreak: 'break-all'` so long JSON Active Props wrap cleanly within `390px`.

---

## 2. Verification Results

- **Unit & Parity Tests (`vitest`)**: `28/28` passed (`packages/emr-react/src/l2-fields.logic.spec.ts` 10/10, `packages/emr-elements/src/l2-fields.spec.ts` 14/14, `packages/emr-react/harness/gallery/parity/parity-workbench.spec.ts` 4/4).
- **Typecheck & Builds**: `pnpm build:controller`, `pnpm lit:public`, `pnpm check:react`, `pnpm build:ui` all exited `0`.
- **Live Browser (`http://localhost:3300/#emr-schedule-slot-picker` + `:4200`)**:
  - **1:1 Parity**: Header, 4 preset buttons (`44px`), 4 slot cards (`Morning 08:00`, `Afternoon 14:00`, `Evening 18:00`, `Night 22:00`), `1 drops` ticked / `0 drops` unticked, and hint match across React, Lit, and Angular.
  - **Interactive Sync**: Preset clicks (`TDS`), slot unticking (`Afternoon`), numeric amount editing (`2`), and `readOnly` Active Props toggle (`Not selected`, no preset buttons) synced identically across all 3 frameworks.
  - **Themes & Mobile**: Light & Dark (`1280x900`) and Mobile (`390x844`) verified with crisp contrast, clean wrapping, `0` horizontal overflow (`html`/`body` width `390px`), and `0` console errors.
