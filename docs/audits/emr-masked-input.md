# Audit Report: `emr-masked-input`

- **Date:** 2026-11-19
- **Layer:** L1 (`primitives`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` `check:react`)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented across Angular, React, and Lit (`controlId`, `label`, `ariaLabel`, `labelHidden`, `mask`, `definitions`, `uppercase`, `value`, `unmask` with Lit `emitUnmasked` alias, `placeholder`, `showMaskHint`, `inputMode` inferred via `inferMaskInputMode`, `size`, `variant`, `clearable`, `clearLabel`, `required`, `readOnly`, `disabled`, `invalid`, `warning`, `hint`, `error`, `ariaDescribedBy`; outputs `valueChange`, `completed` with `(emitted, result)`, `cleared`, `focused`, `blurred`, `submitted`).
- [x] Implemented backslash escaping (`\9`, `\A`, `\*`, `\\`), caret preservation & Backspace-across-literal helper (`editMaskedInputWithCaret`, `resolveMaskedCaretPosition`), inline `.emr-input-affix` clear icon, `tabular-nums`/monospace styling, and `EmrTypedField` `[invalid]` + `null` empty-emission alignment.
- [x] Verified `pnpm test` (`117/117` files, `1695/1695` tests), `check:react`, `check:ssr`, and `check:stories`.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-masked-input` and `http://localhost:4200/?selector=emr-masked-input&theme=dark` with `0` console/page errors, `0` failed requests, `44px` input height (`mkInputH: 44`), and `0px` horizontal overflow (`mobileDiff: 0`, standalone `diff: 0`).
- [x] Verified typing `"91123456789012"` formatting & synchronizing `"91-1234-5678-9012"` across React, Lit (`mkLitVal`), and Angular (`mkNgVal`).

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-masked-input` preview cards, Active Props & `components-docs.tsx` cycles, `examples/angular-preview/preview-app.component.ts` wiring, `entries-l1-l2-wave2.tsx`, Storybook, `docs/catalog/L1-primitives.md`, `component-api-manifest.ts` (`208`), and `registry` (`210`) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-masked-input` is `PASS`).
