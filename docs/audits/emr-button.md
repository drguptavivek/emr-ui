# Audit Report: `emr-button`

- **Date:** 2026-11-18
- **Layer:** L1
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck)

## 1. Props, Events & Validation Parity
- [x] All canonical props & events implemented identically across Angular, React, Lit (`variant`, `size`, `shape`, `disabled`, `loading`, `block`, `pressed`, `type`, `clicked`/`onPress`/`click`)
- [x] `disabled` and `loading` (`aria-busy="true"`) gating verified across all 3 renderers

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] Font (`Inter Variable`), sizes (`14px` md, `13px` sm, `16px` lg), weights (`700`), and `>=44px` target heights (`44px` md, `48px` lg) match
- [x] Hover, focus-visible, active, disabled, and `block=true` full-width (`540px–548px`) states match across React, Lit, and Angular
- [x] Monochrome SVG / no raw color emojis

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-button` 1:1 preview cards + Active Props sync verified (extra "Cycle variant" button removed from Angular card)
- [x] Properties & Events tables (`component-api-manifest.ts`) and Usage snippets verified

## 4. Findings / Follow-ups
- None
