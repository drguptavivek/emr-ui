# Audit Report: `emr-annotation-list`

- **Date:** 2026-11-19
- **Layer:** L3 (`structures`)
- **Verdict:** PASS (`neon-supervisor` Gemini 4 Neon (High) Final Sign-Off)
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo Native typecheck via `tsconfig.native.json`)

## 1. Props, Events & Validation Parity
- [x] Unified cross-renderer API: `model: AnnotationListViewModel`, `headingId`, `idPrefix`, `labels: Partial<EmrAnnotationListLabels>`; outputs `intent: AnnotationListIntent`, `focused`, `blurred`. Zero `disabled` prop exposed above L2.
- [x] Migrated Angular `EmrAnnotationListComponent` to signal `input()`/`output()`, extracted runtime helpers to `emr-annotation-list.logic.ts` (type-only controller imports), removed hardcoded Lit `<h4>Annotations</h4>`, and added controller guards (`canToggleAnnotationLayerVisibility`, `canToggleAnnotationLayerLock`, `canMoveAnnotationLayer`, `canRemoveAnnotationLayer`, `canTriggerAnnotationListIntent`). (In React Native Web, internal `<Pressable role="button">` retains `disabled={disabled}` so RNW `createDOMProps` preserves `aria-disabled="true"` alongside `EmrButton`, while the public L3 API has zero `disabled` prop and full handler guards.)
- [x] Replaced all raw emojis (`🔒`, `🔓`, `👁`, `🗑`) and Unicode glyphs across React, Lit, and Angular with monochrome SVG icons (`shape-*`, lock/visibility/move/trash) + `NATIVE_FALLBACK` & `RESOLVED_MONO_FONT` for Expo Native.
- [x] Verified `aria-current="true"`, `aria-pressed`, `role="status"` empty state, single-row roving `tabindex` + `ArrowUp`/`ArrowDown`/`Home`/`End` navigation, `44x44px` hit boxes (`flex-wrap: wrap`), `readOnly` legend omission, and `.emr-print` / `@media print` legend-row + unwrapped label styling (`[data-emr-print='legend-row']` & `[data-emr-print='unwrap']` synced across Angular, Lit, and React Web via `emr-print.css`).
- [x] `pnpm check` (`134/134` files, `1775/1775` tests), `check:react`, `lit:public`, `build-component-api.mjs`, `registry:build`, and `emr-angular-preview` passed.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] Verified live across `http://localhost:3300/#emr-annotation-list` and `http://localhost:4200/?selector=emr-annotation-list` (`1280x900` desktop & `390x844` mobile, Light & Dark themes) with `0px` host AND internal Shadow DOM overflow (`420/420`, `292/292`, `1280/1280`, `390/390`), `0` hit targets `<44px`, `Inter Variable` typography (`14px` layer names, `12px` descriptions), and `0` console/page/network errors.
- [x] Verified bidirectional sync across React, Lit, and Angular iframe for layer selection (`aria-current="true"`), lock toggle (`aria-pressed`), visibility toggle (`aria-pressed`), `Move drawing 1 down` row swap, Delete removal (`3 -> 2`), and `readOnly` plain-legend mode.

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-annotation-list` 1:1 preview cards, Active Props sync, `Properties`/`Events`/`Usage` docs, `docs/catalog/L3-structures.md`, `catalog.manifest.ts`, `component-api-manifest.ts`, `registry/`, and `examples/angular-preview/preview-app.component.ts` verified.

## 4. Findings / Follow-ups
- Wired unused `danger` prop + `hovered` tint on `rowActionBtn`, `flex-wrap: wrap` on `alActions`, and `[data-emr-print='legend-row']` / `[data-emr-print='unwrap']` for React Web print parity. None remaining (`emr-annotation-list` is `PASS`).
