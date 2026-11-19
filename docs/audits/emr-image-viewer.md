# Audit Report: `emr-image-viewer`

- **Date:** 2026-11-19
- **Layer:** L1 (`primitives`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo Native `PanResponder` + `check:react`)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented across Angular, React, and Lit (`controlId`, `label`, `labelHidden`, `src`, `alt`, `caption`, `images`, `activeIndex`, `viewport`, `fullscreen`, `allowFullscreen`, `showThumbnails`, `height`, `hint`, `warning`, `error`, `invalid`, `readOnly`, `disabled`; outputs `activeIndexChange`, `viewportChange`, `fullscreenChange`, `closeRequested`, `focused`, `blurred`).
- [x] Replaced raw Unicode controls with monochrome SVGs (added `minimize` to Lit icons and `minimize`/`flip-h`/`flip-v`/`rotate-ccw`/`rotate-cw`/`crop` to React icons), synchronized 90° rotation + Straighten (`splitRotationDegrees`), added wheel zoom, pointer capture + `pointercancel`, Expo Native `PanResponder` drag pan, miniature thumbnail previews, keyboard shortcuts (`+`/`-`/`0`/`r`/`ArrowLeft`/`ArrowRight`/`Escape`), and `role="dialog" aria-modal="true"` fullscreen focus restoration without browser globals in Angular (`architecture.spec.ts`).
- [x] Verified `pnpm test` (`117/117` files, `1693/1693` tests), `pnpm vitest run packages/emr-react/src/l1-l2-wave2.spec.ts` (`12/12`), `check:react`, `check:ssr`, and `check:stories`.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-image-viewer` and `http://localhost:4200/?selector=emr-image-viewer&theme=dark` with `0` console/page errors, `0` failed requests, and `0px` horizontal overflow (`scrollWidth: 390, offenderCount: 0` after adding `flexShrink: 1, maxWidth: '100%'` on React `toolbar`/`toolGroup`/`straightenWrap`).
- [x] Verified Zoom in click synchronizing `"125%"` across React, Lit, and Angular.

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-image-viewer` preview cards, Active Props & `components-docs.tsx` cycles, `examples/angular-preview/preview-app.component.ts` wiring, `entries-l1-l2-wave2.tsx`, Storybook `ImageSuite`, `docs/catalog/L1-primitives.md`, `component-api-manifest.ts` (`208`), and `registry` (`210`) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-image-viewer` is `PASS`).
