# Audit Report: `emr-tabs`

- **Date:** 2026-11-18
- **Layer:** L1
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck)

## 1. Props, Events & Validation Parity
- [x] All canonical props & events implemented identically across Angular, React, Lit (`controlId`, `tabs` `EmrTabOption[]` with `icon`/`badge`/`panelId`/`disabled`, `value`, `active`, `variant`: `underline | pill | soft`, `size`: `sm | md | lg`, `orientation`: `horizontal | vertical`, `fitted`, `activationMode`: `automatic | manual`, `loop`, `iconPosition`, `readOnly`, `disabled`, `ariaLabel`, `ariaLabelledBy`, `valueChange`, `tabChange`, `focused`, `blurred`)
- [x] WAI-ARIA roving `tabindex`, `Arrow*`/`Home`/`End`/`Enter`/`Space` keyboard navigation, disabled tab skipping, and `readOnly`/`disabled` gating verified

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] Flush underline tabs (`underline` default, full-width track + `4px` gap), `pill` segmented tabs, `soft` tabs, `vertical` orientation, and `fitted` equal-width tabs match across React, Lit, and Angular
- [x] Font (`Inter Variable`), sizes (`13px` sm / `14px` md / `16px` lg), `>=44px` (`48px` lg) heights, and `tabular-nums` badge pills match across all 3 renderers
- [x] Light & Dark theme contrast and horizontal scroll behavior verified

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-tabs` 1:1 preview cards + bidirectional Active Props sync (`active`, `variant`, `size`, `orientation`, `fitted`, `disabled`) verified across React, Lit, and Angular
- [x] Properties (15), Events (5), Usage snippets (4 frameworks), and `docs/catalog/L1-primitives.md` verified

## 4. Findings / Follow-ups
- None
