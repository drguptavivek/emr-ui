# Audit Report: `emr-color-picker`

- **Date:** 2026-11-19
- **Layer:** L1 (`primitives`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` `check:react`)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented across Angular, React, and Lit (`controlId`, `label`, `labelHidden`, `value`, `swatches`, `allowCustomHex = true`, `clearable = true`, `size`, `required`, `readOnly`, `disabled`, `invalid`, `hint`, `warning`, `error`; outputs `valueChange`, `cleared`, `focused`, `blurred`).
- [x] Consolidated `normalizeHexColor`, `isHexColorValid`, `getContrastCheckTone`, `resolveColorSwatchTabStopIndex`, `moveColorSwatchFocusIndex`, and `canClearEmrColorPicker` in controller, refactored React swatches into `44x44px` `role="radio"` visual tiles (`aria-checked="true" | "false"`), added blur/lock invalid draft rollback, distinct Lit checked vs focus-visible ring, live hex preview dot, and `role="alert"` / `role="status"` messages.
- [x] Verified `pnpm test` (`117/117` files, `1701/1701` tests), post-fix `pnpm build:react` & `pnpm check:react`, `check:ssr`, and `check:stories`.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-color-picker` and `http://localhost:4200/?selector=emr-color-picker&theme=dark` with `0` console/page errors, `0` failed requests, `44x44px` swatch hit targets (`cpFirstSize: { w: 44, h: 44 }`), and `0px` horizontal overflow (`mobileDiff: 0`, standalone `diff: 0`).
- [x] Verified swatch selection synchronizing `aria-checked="true"` 1:1 across React (`reactIdx1: "true"`), Lit (`litIdx1: "true"`), and Angular (`ngIdx1: "true"`).

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-color-picker` preview cards, Active Props & `components-docs.tsx` cycles, `examples/angular-preview/preview-app.component.ts` wiring, `entries-l1-l2-wave2.tsx`, `docs/catalog/L1-primitives.md`, `catalog.manifest.ts`, `component-api-manifest.ts` (`208`), and `registry` (`210`) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-color-picker` is `PASS`).
