# Audit Report: `emr-macro-text-field`

- **Date:** 2026-11-19
- **Layer:** L2 (`fields`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` build)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented across Angular, React, and Lit (`model`, `definition`, `controlId`, `headingId`, `labelHidden`, `layout`, `showMetadata`, `readOnly`, `rows`, `maxLength`, `clearable`, `autoResize`; outputs `intent` (`valueChangeRequested`, `macroQueryRequested`, `macroSelected`, `macroDismissRequested`, `clearRequested`, `dictationToggleRequested`, `statusChangeRequested`), `focused`, `blurred`).
- [x] `EmrFieldFrame` delegation (`labelNamesControl={true}`, six-state `ClinicalAssessmentStatus`), SmartPhrases trigger detection (`.` / `/`), macro expansion at cursor (`expandMacroTriggerAtCursor`), validation severity resolution (`hasMacroValidationState`), Clear button, Dictation toggle (`Start dictation` / `Stop dictation`), character counter, and `readOnly` gating verified.
- [x] `emr-controller`, `emr-ui`, `emr-react`, `emr-elements`, `emr-angular-preview`, `lit:public`, and `registry:build` (`210` items / `208` API docs components) built cleanly.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-macro-text-field` and `http://localhost:4200/?selector=emr-macro-text-field&theme=light` with `0` console/page errors, `0` failed network requests, and `0px` horizontal overflow at `390x844` (`scrollWidth: 390 === innerWidth: 390`).
- [x] Fixed Dark theme button transition contrast flash on `.emr-button` / `.emr-button--outline` in `emr.css` (`background-color` + removing `background` transition delay -> Angular Dark button `bg: rgb(15, 23, 42)`, `color: rgb(197, 213, 223)`, `44px` height).
- [x] Converted SmartPhrases panel from `position: absolute` to in-flow layout across Angular (`.mtf-popup`), Lit (`.macro-popover`), and React Web (`macroDropdownWeb`), eliminating counter/status occlusion (`+9px` React, `+8px` Lit, `+6px` Angular clearance above character counter) and mobile card overflow.
- [x] Verified `.clearcornea` click expansion sync across React & Lit (`"Lids and lashes normal. Cornea clear, anterior chamber deep and quiet, iris normal pattern."`), Active Props `dictating` sync to Lit (`Stop dictation`), and `>= 44px` interactive target heights.

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-macro-text-field` Usage, Properties, Events sections, 1:1 preview cards, and Active Props sync verified across React, Lit, and Angular.

## 4. Findings / Follow-ups
- None (`emr-macro-text-field` is `PASS`).
