# Audit Report: `emr-image-cropper`

- **Date:** 2026-11-19
- **Layer:** L1 (`primitives`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo Native `PanResponder` + `<Image>` transforms via `check:react`)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented across Angular, React, and Lit (`controlId`, `label`, `labelHidden`, `src`, `alt`, `aspectPresets`, `transform`, `outputMimeType`, `hint`, `warning`, `error`, `invalid`, `readOnly`, `disabled`; outputs `cropChange`, `cropCommitted`, `cancelRequested`, `focused`, `blurred`).
- [x] Implemented outer scrim framing, `44x44px` corner resize handle hit boxes (`14px` visible circle), box interior drag + aspect-ratio locking (`computeAspectLockedCropRect`), keyboard Arrow / `Shift+Arrow` ROI adjustment, stage pan, `role="radiogroup"` aspect presets with Arrow key nav, and real `<canvas>` cropped `dataUrl` rasterization (`computeCroppedCanvasPlan`; template `<canvas #cropCanvas>` + `viewChild` in Angular with zero browser globals).
- [x] Verified `pnpm test` (`117/117` files, `1693/1693` tests), `check:react`, `check:ssr`, and `check:stories`.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-image-cropper` and `http://localhost:4200/?selector=emr-image-cropper&theme=dark` with `0` console/page errors, `0` failed requests, `44px` crop handle hit target height, and `0px` horizontal overflow (`scrollWidth: 390, offenderCount: 0`).
- [x] Verified `1:1 Square` aspect radiogroup click synchronization between React (`role="radiogroup" [role="radio"]`: `10` radios) and Lit (`"1:1 Square"`).

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-image-cropper` preview cards, Active Props & `components-docs.tsx` cycles, `examples/angular-preview/preview-app.component.ts` wiring, `entries-l1-l2-wave2.tsx`, Storybook `ImageSuite`, `docs/catalog/L1-primitives.md`, `component-api-manifest.ts` (`208`), and `registry` (`210`) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-image-cropper` is `PASS`).
