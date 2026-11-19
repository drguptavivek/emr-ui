# Audit Report: `emr-chronic-disease-list`

- **Date:** 2026-11-19
- **Layer:** L4 (`domain`, delegates to L3 `emr-clinical-list`)
- **Verdict:** PASS (`neon-supervisor` Gemini 4 Neon (High) Final Sign-Off)
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo Native typecheck via `tsconfig.native.json`)

## 1. Props, Events & Validation Parity
- [x] Migrated `EmrChronicDiseaseList` across Angular (`domain/emr-clinical-lists.component.ts`), React, and Lit (`l4-domain.ts`) to canonical `model: ClinicalListViewModel`, `headingId` (default `'emr-chronic-list-title'`), `headingLevel`, `labels` (default title `'Chronic diseases'`), `intent` (`ClinicalListIntent`), `focused`, and `blurred`. Zero `disabled` above L2.
- [x] Inherits full `emr-clinical-list` `readOnly` / per-item gating, `aria-busy`, `role="alert"`/`"status"`, monochrome SVGs, and `.emr-print` hiding.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] Spot-checked live on `http://localhost:3300/#emr-chronic-disease-list` and `http://localhost:4200/?selector=emr-chronic-disease-list` (`1280x900` Light & `390x844` Dark): `0px` host & internal Lit/React/Angular overflow (`420/420`, `292/292`, `1280/1280`, `390/390`), `>=44px` hit targets, and `0` console/page/network errors.

## 3. Website & Registry Docs
- [x] Wired into `examples/angular-preview/preview-app.component.ts`, `entries-l4-clinical.tsx`, `catalog.manifest.ts`, `docs/catalog/L4-domain.md`, `component-api-manifest.ts`, and `registry/`.

## 4. Findings / Follow-ups
- None (`emr-chronic-disease-list` is `PASS`).
