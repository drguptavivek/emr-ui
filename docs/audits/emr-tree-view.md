# Audit Report: `emr-tree-view`

- **Date:** 2026-11-19
- **Layer:** L1 (`primitives`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` `check:react`)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented across Angular, React, and Lit (`controlId`, `label`, `labelHidden`, `ariaLabel`, `nodes`, `value`, `values`, `selectedIds` Lit alias, `multiple`, `checkStrategy`, `maxSelections`, `expandedIds`, `defaultExpandedIds`, `searchable`, `searchQuery`, `searchPlaceholder`, `highlightMatch`, `showExpandControls`, `clearable`, `clearLabel`, `size`, `maxHeight`, `emptyMessage`, `required`, `readOnly`, `disabled`, `invalid`, `warning`, `error`, `hint`; outputs `valueChange`, `valuesChange`, `expandedIdsChange`, `searchQueryChange`, `nodeSelected`, `cleared`, `focused`, `blurred`).
- [x] Monochrome SVGs (`chevron`, `check`, `minus`, `search`, `close`, `lock`) replacing Unicode/raw checkboxes across renderers; `node.readOnly` locking & `maxSelections` + canonical pre-order return in `toggleTreeNodeCheck`; disabled-row focus index fix (`findNextTreeRowIndex` / `data-node-id`), roving `tabIndex`, and printable typeahead; print-expand (`data-emr-print="expand"`) / toolbar-hide (`data-emr-print="hide"`).
- [x] Fixed Angular `[role="treeitem"]` `aria-checked` attribute mapping (`checked`/`mixed`/`false` -> strict WAI-ARIA `'true' | 'mixed' | 'false'`), verified by `packages/emr-ui/src/lib/primitives/l1-l2-wave2.spec.ts` (`10/10` pass).

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes (`rgb(15, 23, 42)` Dark tree container) and `390x844` mobile layout verified on `http://localhost:3300/#emr-tree-view` and `http://localhost:4200/?selector=emr-tree-view&theme=dark` with `0` console/page errors, `0` failed requests, `44px` minimum row height, and `0px` horizontal overflow at `390x844`.
- [x] Verified live tri-state branch (`mixed`), `Locked` (`node.readOnly`) click protection (`"true"` preserved), and unlocked node (`Crystalline lens / IOL`) check sync `"true"` across React, Lit, and Angular.

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-tree-view` preview cards, Active Props & `components-docs.tsx` cycles, `examples/angular-preview/preview-app.component.ts` wiring, `entries-l1-l2-wave2.tsx`, `docs/catalog/L1-primitives.md`, `catalog.manifest.ts`, `component-api-manifest.ts` (`208`), and `registry` (`210`) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-tree-view` is `PASS`).
