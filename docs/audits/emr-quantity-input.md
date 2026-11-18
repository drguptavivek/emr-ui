# Audit Report: `emr-quantity-input`

- **Date:** 2026-11-18
- **Layer:** L1
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck)

## 1. Props, Events & Validation Parity
- [x] All canonical props & events implemented identically across Angular, React, Lit (`value`, `unit`, `units` `EmrOption[]` with `group`/`disabled`, `mode`, `precision`, `min`, `max`, `step`, `showSteppers`, `size`, `clearable`, `clearLabel`, `unitLabel`, `unitPlaceholder`, `valueRequired`, `unitRequired`, `unitReadOnly`, `hint`, `warning`, `error`, `valueError`, `unitError`, `valueChange`, `unitChange`, `cleared`, `focused`, `blurred`, `submitted`)
- [x] Shared controller helpers (`resolveQuantityStep`, `sanitizeQuantityText`, `parseQuantityDraft`, `stepQuantityValue`) handle spaces, comma decimals (`18,5` -> `18.5`), and IEEE-754 drift
- [x] Per-side `aria-invalid`, `role="alert"`, `role="status"` warning, and `readOnly`/`disabled` (`aria-disabled="true"`) gating verified

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] Font (`Inter Variable`), sizes (`14px`), `>=44px` target heights (`48px` on `size="lg"`), and `tabular-nums` match across React, Lit, and Angular
- [x] Hover, focus-visible, `readOnly` dashed border + inert steppers, Light & Dark theme contrast, and `390px` mobile responsive wrapping verified
- [x] Monochrome SVG `-`, `+`, and `×` icons / zero raw color emojis

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-quantity-input` 1:1 preview cards + Active Props sync (`showSteppers`, `clearable`, `size`, `disabled`, `value`, `unit`) verified
- [x] Properties (27), Events (6), Usage snippets, and `docs/catalog/L1-primitives.md` verified

## 4. Findings / Follow-ups
- None
