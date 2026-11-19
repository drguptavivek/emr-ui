# Audit Report: `emr-annotation-toolbar`

- **Date:** 2026-11-19
- **Layer:** L3 (`structures`)
- **Verdict:** PASS (`neon-supervisor` Gemini 4 Neon (High) Final Sign-Off)
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo Native typecheck via `tsconfig.native.json`)

## 1. Props, Events & Validation Parity
- [x] Unified cross-renderer API: `model: AnnotationToolbarViewModel`, `headingId`, `idPrefix`, `labels: Partial<EmrAnnotationToolbarLabels>`; outputs `intent: AnnotationToolbarIntent`, `focused`, `blurred`. Zero `disabled` prop exposed above L2.
- [x] Migrated Angular `EmrAnnotationToolbarComponent` to signal `input()`/`output()`, extracted runtime helpers to `emr-annotation-toolbar.logic.ts` (type-only controller imports), removed module-global `nextPenId`, added handler guards (`canSelectToolbarTool`, `canOpenToolbarPen`, `canTriggerToolbarIntent`), and migrated `[disabled]` to `[attr.aria-disabled]` + handler guards. (In React Native Web, internal `<Pressable role="button">` retains `disabled={disabled}` so RNW `createDOMProps` preserves `aria-disabled="true"` alongside `EmrButton`, while the public L3 API has zero `disabled` prop and full handler guards.)
- [x] Replaced all raw emojis and ambiguous Unicode glyphs across Angular, React, and Lit with monochrome SVG icons (`arrows-out`, `backspace`, `hand`, `cursor`, `redo`, and all 13 `shape-*` retinal/surgical icons; `NATIVE_FALLBACK` + `RESOLVED_MONO_FONT` for Expo Native).
- [x] Enforced `44x44px` hit targets (`>=44px` even in compact density), `Inter Variable` typography, roving `tabindex` keyboard navigation (`Arrow*`/`Home`/`End`), `aria-controls`/`aria-expanded` on Pen popover with `Escape`/outside-click/`focusout` dismissal, and `.emr-print`/`@media print` hiding.
- [x] `pnpm check` (`134/134` files, `1775/1775` tests), `check:react`, `lit:public`, `build-component-api.mjs`, `registry:build`, and `emr-angular-preview` passed.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] Verified live across `http://localhost:3300/#emr-annotation-toolbar` and `http://localhost:4200/?selector=emr-annotation-toolbar` (`1280x900` desktop & `390x844` mobile, Light & Dark themes) with `0px` host AND internal Shadow DOM overflow (`420/420`, `292/292`, `1280/1280`, `390/390`), `0` hit targets `<44px`, `3px` `:focus-visible` outline + `ArrowRight` roving focus, and `0` console/page/network errors.
- [x] Verified Pen popover open/`Escape`/outside-click close, Pen colour selection (`Pen: Red -> Blue, Medium 3px`), Active Props toggles (`canUndo`, `canRedo`, `canSave`, `zoomLocked`, `readOnly`), and bidirectional state sync across React, Lit, and Angular iframe.

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-annotation-toolbar` 1:1 preview cards, Active Props sync, `Properties`/`Events`/`Usage` docs, `docs/catalog/L3-structures.md`, `catalog.manifest.ts`, `component-api-manifest.ts`, `registry/`, and `examples/angular-preview/preview-app.component.ts` verified.

## 4. Findings / Follow-ups
- Added `hovered` face tint on React `toolbarBtn` during Stage 3 polish. None remaining (`emr-annotation-toolbar` is `PASS`).
