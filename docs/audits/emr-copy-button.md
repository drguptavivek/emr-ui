# Audit Report: `emr-copy-button`

- **Date:** 2026-11-19
- **Layer:** L1 (`primitives`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` `check:react`)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented across Angular, React, and Lit (`controlId`, `value`, `label`, `copiedLabel`, `iconOnly`, `ariaLabel`, `variant`, `size`, `feedbackDurationMs`, `readOnly`, `disabled`; outputs `copied`, `focused`, `blurred`).
- [x] Implemented `canCopyEmrValue`, `canTriggerCopy`, `resolveCopyFeedbackDurationMs`, and `formatCopyButtonLabel` in controller, timer cleanup + `value`-change reset, monochrome `copy` / `check` SVGs, `role="status"` live announcement, `.emr-print` hide rules, and explicit Angular `input<string>` typing.
- [x] Verified `pnpm test` (`117/117` files, `1701/1701` tests), `check:react`, `check:ssr`, and `check:stories`.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-copy-button` and `http://localhost:4200/?selector=emr-copy-button&theme=dark` with `0` console/page errors, `0` failed requests, `44px` hit height (`litH: 44`, `ngH: 44`), and `0px` horizontal overflow (`mobileDiff: 0`, standalone `diff: 0`).
- [x] Verified Copy click switching to `"Copied"` (`data-copied="true"`) across React, Lit, and Angular.

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-copy-button` preview cards, Active Props & `components-docs.tsx` cycles, `examples/angular-preview/preview-app.component.ts` wiring, `entries-l1-l2-wave2.tsx`, `docs/catalog/L1-primitives.md`, `catalog.manifest.ts`, `component-api-manifest.ts` (`208`), and `registry` (`210`) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-copy-button` is `PASS`).
