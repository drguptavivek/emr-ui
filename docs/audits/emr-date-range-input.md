# Audit Report: `emr-date-range-input`

- **Date:** 2026-11-19
- **Layer:** L1 (`primitives`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` `check:react`)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented across Angular, React, and Lit (`controlId`, `label`, `ariaLabel`, `labelHidden`, `mode` `'date' | 'datetime'`, `value`, `min`, `max`, `presets`, `startPlaceholder`, `endPlaceholder`, `size`, `variant`, `clearable`, `clearLabel`, `showCalendar`, `open`, `weekStartsOn`, `required`, `readOnly`, `disabled`, `invalid`, `startError`, `endError`, `warning`, `hint`, `error`, `ariaDescribedBy`; outputs `valueChange`, `cleared`, `openChange`, `focused`, `blurred`, `submitted`).
- [x] Replaced `.emr-quantity` (`360px` cap) & hardcoded seed dates with `.emr-date-range__bar` and controller helpers (`buildDateRangeCalendarGrid`, `resolveInitialCalendarMonth`, `commitDateRangeEndpoint`, `selectDateRangeCalendarDay` preserving `HH:mm` in `datetime` mode), fixed React mid-keystroke swap bug, fixed Lit `clearRange()` emitting `null`, unified `weekStartsOn=0`, added `role="alert"`/`role="status"`, and replaced text glyphs with monochrome SVGs.
- [x] Verified `pnpm test` (`117/117` files, `1695/1695` tests), `check:react`, `check:ssr`, and `check:stories`.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-date-range-input` and `http://localhost:4200/?selector=emr-date-range-input&theme=dark` with `0` console/page errors, `0` failed requests, and `0px` horizontal overflow (`mobileDiff: 0`, standalone `diff: 0`).
- [x] Verified preset selection synchronizing `["2026-03-08", "2026-03-15"]` across React, Lit (`drLitVal`), and Angular (`drNgVal`).

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-date-range-input` preview cards, Active Props & `components-docs.tsx` cycles, `examples/angular-preview/preview-app.component.ts` wiring, `entries-l1-l2-wave2.tsx`, Storybook, `docs/catalog/L1-primitives.md`, `component-api-manifest.ts` (`208`), and `registry` (`210`) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-date-range-input` is `PASS`).
