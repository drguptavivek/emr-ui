# Audit Report: `emr-paired-field`

- **Date:** 2026-11-19
- **Layer:** L2 (`fields`)
- **Verdict:** PASS (`neon-supervisor` Sign-Off #100)
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented identically across Angular, React, Lit (`model`, `definition`, `controlId`, `headingId`, `labelHidden`, `layout`, `showMetadata`, `readOnly`, `size`, `clearable`; outputs `intent` (`firstChangeRequested`, `secondChangeRequested`, `clearRequested`, `statusChangeRequested`), `focused`, `blurred`).
- [x] Per-side `firstMode`/`secondMode` (`'text' | 'decimal' | 'integer' | 'select'`, defaulting `'text'` or `definition.contract.valueType`), shared `options` + per-side `firstOptions`/`secondOptions`, `showSteppers` (`false` default), per-side `min`/`max`/`step`/`precision`/`maxLength`/`required`/`readOnly`, and `EmrValidationMessage.path` (`['first']` vs `['second']`) per-side `aria-invalid` / `data-warning` verified.
- [x] Six-state `ClinicalAssessmentStatus` delegated to `EmrFieldFrame` (`labelNamesControl={false}`), `readOnly` DOM gating/rollback (zero `disabled` above L2), and out-of-range valid numeric emission verified across `9` Vitest suites (`79/79` tests), `pnpm check:react`, `pnpm check:ssr`, `pnpm build:ui`, `pnpm build:react`, and `pnpm lit:public`.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-paired-field` (`:4200` Angular iframe) with `0` console/page errors and `0px` horizontal overflow (`body` width `390px`).
- [x] Input heights `44px` (`md`) and `48px` (`lg`), `44x44px` Clear button (`data-emr-print="hide"`), side-by-side `Systolic / Diastolic mmHg` row on `390x844`, hover/focus/read-only dashed borders, and Light/Dark contrast verified.
- [x] Monochrome SVG `close` icon on Clear button; zero raw color emojis.

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-paired-field` 1:1 preview cards + bidirectional Active Props sync (`value`, `readOnly`, `required`, `size`, `layout`, `status`) verified across React, Lit, and Angular.
- [x] Properties (`10`), Events (`3`), 4-framework Usage snippets, `docs/catalog/L2-fields.md`, `component-api-manifest.ts`, and `registry` (`210` items) verified.

## 4. Findings / Follow-ups
- None (`emr-paired-field` is `PASS`).
