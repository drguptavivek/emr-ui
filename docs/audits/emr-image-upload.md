# Audit Report: `emr-image-upload`

- **Date:** 2026-11-19
- **Layer:** L1 (`primitives`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo Native fallback hooks via `check:react`)

## 1. Props, Events & Validation Parity
- [x] Unified `allowCamera = false` default, `FileReader.readAsDataURL` batch loading (replacing `URL.createObjectURL`), `validateUploadedImageFile` `accept`/`maxSizeBytes` inline `role="alert"` enforcement, `maxFiles` disabled cap (`"N of M uploaded"`), caption editing (`captionChange`), byte size metadata + `"Edited"` badge, `readOnly` lightbox inspection preservation, monochrome SVGs (`upload`, `camera`, `eye`, `crop`, `trash`, `close`), self-contained Angular lightbox/crop modals (no L1 sibling imports per `l1-l2-wave2.spec.ts`), and modal `role="dialog" aria-modal="true"` Crop & Lightbox overlays with focus restoration.
- [x] Verified `pnpm test` (`117/117` files, `1693/1693` tests), `check:react`, `check:ssr`, and `check:stories`.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-image-upload` and `http://localhost:4200/?selector=emr-image-upload&theme=dark` with `0` console/page errors, `0` failed requests, and `0px` horizontal overflow (`scrollWidth: 390, offenderCount: 0`).
- [x] Verified Lit `Crop / Rotate` modal opening as `role="dialog" aria-modal="true"` (`iuDialogOpenLit: true`) and dismissing cleanly with `Escape`.

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-image-upload` preview cards, Active Props & `components-docs.tsx` cycles, `examples/angular-preview/preview-app.component.ts` wiring, `entries-l1-l2-wave2.tsx`, Storybook `ImageSuite`, `docs/catalog/L1-primitives.md`, `component-api-manifest.ts` (`208`), and `registry` (`210`) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-image-upload` is `PASS`).
