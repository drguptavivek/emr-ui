# Audit Report: `emr-number-input`

- **Date:** 2026-11-18
- **Layer:** L1
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck)

## 1. Props, Events & Validation Parity
- [x] Canonical props & events (`value`, `min`, `max`, `step`, `showSteppers`, `unit`, `mode`, `readOnly`, `disabled`, `error`, `valueChange`) synced across Angular, React, Lit
- [x] Stepper increments/decrements (`-`/`+`) and `min`/`max` bounds verified

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] Font (`Inter Variable`), sizes (`14px`), and `44px` outer control/stepper heights match (`box-sizing: border-box` inner `<input>` inside `44px` wrapper)
- [x] Hover, focus-visible, Light & Dark theme contrast, and `390px` mobile layout verified with zero overflow
- [x] Monochrome SVG icons / no raw color emojis

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-number-input` 1:1 preview cards + Active Props sync verified
- [x] Properties & Events tables (`component-api-manifest.ts`) and Usage snippets verified

## 4. Findings / Follow-ups
- Minor note: React & Lit inputs use `role="textbox"` with custom steppers while Angular uses `role="spinbutton"`; both expose `44px` stepper buttons and unit label `"D"`.
