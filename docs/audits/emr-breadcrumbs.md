# Audit Report: `emr-breadcrumbs`

- **Date:** 2026-11-19
- **Layer:** L1 (`primitives`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` `check:react`)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented across Angular, React, and Lit (`controlId`, `ariaLabel`, `items` with optional `href`/`icon`/`disabled`, `maxItems`, `separator` string or `'chevron'` SVG, `size`; outputs `itemSelected`, `overflowExpanded`).
- [x] Fixed React current breadcrumb from disabled `<Pressable>` to non-interactive `<Text aria-current="page">` (`tag: "DIV"` / Lit `"SPAN"`, `role: null`), replaced raw Unicode `…` ellipsis with monochrome `more-horizontal` SVG trigger that restores focus to first revealed breadcrumb and resets expansion when `items`/`maxItems` change.
- [x] Verified `pnpm test` (`117/117` files, `1701/1701` tests), `check:react`, `check:ssr`, and `check:stories`.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-breadcrumbs` and `http://localhost:4200/?selector=emr-breadcrumbs&theme=dark` with `0` console/page errors, `0` failed requests, and `0px` horizontal overflow (`mobileDiff: 0`, standalone `diff: 0`).

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-breadcrumbs` preview cards, Active Props & `components-docs.tsx` cycles, `examples/angular-preview/preview-app.component.ts` wiring, `entries-l1-l2-wave2.tsx` (`LitElementHost` events wired), `docs/catalog/L1-primitives.md`, `catalog.manifest.ts`, `component-api-manifest.ts` (`208`), and `registry` (`210`) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-breadcrumbs` is `PASS`).
