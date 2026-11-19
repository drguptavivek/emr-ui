# Audit Report: `emr-range-field`

- **Date:** 2026-11-19
- **Layer:** L2 (`fields`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented identically across Angular, React, Lit (`model`, `definition`, `controlId`, `headingId`, `labelHidden`, `layout`, `showMetadata`, `readOnly`, `size`, `clearable`, `showSteppers`, `displayFormat`, `timePrecision`, `hourCycle`, `wireFormat`; outputs `intent` (`lowChangeRequested`, `highChangeRequested`, `rangeChangeRequested`, `clearRequested`, `statusChangeRequested`), `cleared`, `focused`, `blurred`, `submitted`).
- [x] All 4 range kinds (`number`, `date`, `time`, `datetime`), `Low`/`High` vs `From`/`To` sub-labels, removed cross-bound clamping, inverted-range `validateRangeField` (`Low must not exceed High.` -> `role="alert"` + `aria-invalid="true"`), per-side `EmrValidationMessage.path` routing, and six-state `ClinicalAssessmentStatus` via `EmrFieldFrame` verified.
- [x] `readOnly` DOM gating/rollback (zero `disabled` above L2), `9` Vitest suites (`89/89` tests) + `4` catalog/parity/token suites (`230/230` tests), `check:react`, `check:ssr`, `build:ui`, `build:react`, `lit:public`, and `check:stories` verified.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout (`number` & `datetime`) verified on `http://localhost:3300/#emr-range-field` (`:4200` Angular iframe) with `0` console/page errors, `0` failed requests, and `0px` horizontal overflow (`body` width `390px`).
- [x] Control heights `44px` (`md`) and `48px` (`lg`), `44x44px` monochrome SVG Clear button (`data-emr-print="hide"`), `kind` cycling (`number`/`date`/`time`/`datetime`), `readOnly`, `required`, `size`, `layout`, `status` sync, and Light/Dark contrast verified.
- [x] Monochrome SVG icons (`close`, `calendar`, `clock`, `minus`, `plus`); zero raw color emojis.

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-range-field` 1:1 preview cards + bidirectional Active Props sync verified across React, Lit, and Angular.
- [x] Properties (`15`), Events (`5`), 4-framework Usage snippets, `docs/catalog/L2-fields.md`, `component-api-manifest.ts`, and `registry` (`210` items) verified.

## 4. Findings / Follow-ups
- None (`emr-range-field` is `PASS`).
