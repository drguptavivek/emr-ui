# Audit Report: `emr-image-field`

- **Date:** 2026-11-19
- **Layer:** L2 (`fields`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` `check:react`)

## 1. Props, Events & Validation Parity
- [x] Full L2 contract implemented across Angular, React, and Lit (`model`, `definition`, `controlId`, `headingId`, `labelHidden`, `layout`, `showMetadata`, `readOnly`, with forbidden `disabled` prop completely removed above L2 including from `EmrImageField` and `typed-field` `'image-upload'`), emitting `intent` (`filesSelected`, `itemsChangeRequested`, `imageCropped`, `captionChangeRequested`, `itemRemoveRequested`, `captureRequested`, `statusChangeRequested`), `nativeFilesSelected`, `focused`, `blurred`.
- [x] Delegated frame, validation messages, and six-state `ClinicalAssessmentStatus` strip to `EmrFieldFrame` (`labelNamesControl={false}`, `-upload` inner uploader ID), fixed `EmrImageFieldElement` `aspectPresets` empty-array override bug, and delegated `EmrTypedField` (`widget === 'image-upload'`) directly to `EmrImageField` across Angular, React, and Lit.
- [x] Verified `pnpm test` (`117/117` files, `1693/1693` tests), `pnpm vitest run packages/emr-react/src/l1-l2-wave2.spec.ts` (`12/12`), `check:react`, `check:ssr`, and `check:stories`.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-image-field` and `http://localhost:4200/?selector=emr-image-field&theme=dark` with `0` console/page errors, `0` failed requests, and `0px` horizontal overflow (`scrollWidth: 390, offenderCount: 0`).
- [x] Verified six-state clinical assessment status strip (`ifStatusRadios: 6`) and clicking `"Declined"` syncing 1:1 across React, Lit (`"Declined"`), and Angular (`"Declined"`).

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-image-field` preview cards, Active Props & `components-docs.tsx` cycles, `examples/angular-preview/preview-app.component.ts` wiring, `entries-l1-l2-wave2.tsx` (six-state status + crop commit sync), `catalog.manifest.ts`, `docs/catalog/L2-fields.md`, `component-api-manifest.ts` (`208`), and `registry` (`210`) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-image-field` is `PASS`).
