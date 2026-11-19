# Audit Report: `emr-paired-input`

- **Date:** 2026-11-19
- **Layer:** L1
- **Verdict:** PASS (`neon-supervisor` Sign-Off #100)
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck)

## 1. Props, Events & Validation Parity
- [x] Canonical props & events (`firstLabel`/`secondLabel`, `firstValue`/`secondValue`, `inputType`/`firstInputType`/`secondInputType` `'text' | 'integer' | 'decimal' | 'select'`, `options`/`firstOptions`/`secondOptions`, `min`/`max`, `firstRequired`/`secondRequired`, `firstError`/`secondError`, `firstPlaceholder`/`secondPlaceholder`, `firstValueChange`, `secondValueChange`, `blurred`) implemented across Angular, React, Lit
- [x] Per-side `aria-invalid`, `role="alert"`, and `readOnly`/`disabled` gating verified

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] Font (`Inter Variable`), sizes (`14px`), `44px` target heights, and `132px` desktop input widths match
- [x] At `390px` mobile viewport, React, Lit, and Angular all keep `OD / OS` inputs side-by-side on one row (`~105px–109px` width) with zero wrapping or overflow
- [x] Light & Dark theme contrast verified

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-paired-input` 1:1 preview cards + bidirectional `od`/`os` Active Props sync + Reset verified across React, Lit, and Angular
- [x] Properties & Events tables (`component-api-manifest.ts`) and Usage snippets verified

## 4. Findings / Follow-ups
- None
