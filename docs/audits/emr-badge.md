# Audit Report: `emr-badge`

- **Date:** 2026-11-18
- **Layer:** L1
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck)

## 1. Props, Events & Validation Parity
- [x] All canonical props implemented identically across Angular, React, Lit (`badge`, `tone`, `label`, `variant`: `soft | solid | outline`, `size`: `md | sm`, `shape`: `pill | rounded`, `icon`, `dot`, `count`, `maxCount`, `showZero`, `assistiveText`, `controlId`)
- [x] Non-interactive L1 display primitive (no outputs, no `disabled`/`readOnly`); `assistiveText` appended via visually hidden `sr-only` without overwriting visible label
- [x] `count`/`maxCount`/`showZero` formatting (`99+`) and `NaN`/negative edge guards verified

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] Font (`Inter Variable`), sizes (`12px` md / `11px` sm), `24px` (`md`) / `20px` (`sm`) heights, `999px` (`pill`) / `6px` (`rounded`) radii, and zero border on `soft` variant match across React, Lit, and Angular
- [x] `variant="solid"` Dark Mode contrast (`#0f172a` ink on pastel tone fills) and `variant="outline"` transparent background (`.emr-badge.emr-badge--outline` specificity fix) match across all 3 renderers
- [x] `dot` (`7px` md / `6px` sm) and monochrome SVG `icon` support / zero raw color emojis
- [x] `390px` mobile layout fits cleanly with zero card overflow

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-badge` 1:1 preview cards (extra tone buttons removed) + Active Props sync (`tone`, `variant`, `size`, `shape`, `dot`) verified
- [x] Properties (13), Usage snippets (4 frameworks), and `docs/catalog/L1-primitives.md` verified

## 4. Findings / Follow-ups
- None
