# Audit Report: `emr-duration-input`

- **Date:** 2026-11-19
- **Layer:** L2 (`fields`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented identically across Angular, React, Lit (`model`, `definition`, `controlId`, `headingId`, `labelHidden`, `layout`, `showMetadata`, `readOnly`, `size`, `clearable`, `showSteppers`, `mode`, `precision`, `placeholder`, `unitPlaceholder`, `hint`, `warning`, `error`; outputs `intent` (`amountChangeRequested`, `unitChangeRequested`, `statusChangeRequested`, `clearRequested`), `focused`, `blurred`, `cleared`, `submitted`).
- [x] `resolveDurationFieldConfig` (`min: 0` default, non-negative `allowNegative` guard blocking `'-'`), `extractDurationPartValidation` (`['amount']`/`['value']` vs `['unit']` path routing), `unitPlaceholder` when `value === null`, and `EmrSelect` dropdown parity across React, Lit, and Angular verified.
- [x] Six-state `ClinicalAssessmentStatus` delegated to `EmrFieldFrame` (`labelNamesControl={false}`), `readOnly` gating/rollback (zero `disabled` above L2), and `11/11` Vitest suites (`325/325` tests) + `check:react`, `check:ssr`, `build:ui`, `build:react`, `lit:public`, and `check:stories` verified.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-duration-input` (`:4200` Angular iframe) with `0` console/page errors, `0` failed requests, and `0px` horizontal overflow (`body` width `390px`).
- [x] Stepper & Clear button heights `44px` (`md`) and `48px` (`lg`), `44x44px` monochrome SVG Clear button (`data-emr-print="hide"`), negative sign `-` blocking, `+` stepping (`4 -> 5`), unit sync (`weeks -> days`), `clearRequested`, `readOnly` dashed borders + blocking, and Light/Dark contrast verified.
- [x] Monochrome SVG icons (`minus`, `plus`, `close`, `chevron-down`); zero raw color emojis.

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-duration-input` 1:1 preview cards + bidirectional Active Props sync (`value`, `readOnly`, `required`, `size`, `layout`, `status`) verified across React, Lit, and Angular.
- [x] Properties (`18`), Events (`5`), 4-framework Usage snippets, `docs/catalog/L2-fields.md`, `component-api-manifest.ts` (`208` components), and `registry` (`210` items) verified.

## 4. Findings / Follow-ups
- None (`emr-duration-input` is `PASS`).
