# Audit Report: `emr-otp-input`

- **Date:** 2026-11-19
- **Layer:** L1 (`primitives`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` `check:react`)

## 1. Props, Events & Validation Parity
- [x] Canonical OTP slot contract implemented across Angular, React, and Lit with sparse-slot space encoding (`normalizeOtpSlots`, `applyOtpSlotEdit`, `extractOtpTypedInput`, `resolveOtpClearSlot`), `autocomplete="one-time-code"` multi-character SMS autofill (removing `maxlength="1"`), `separatorAfter`, `secret`/`masked`, `uppercase`, `size`, `variant`, `clearable`, keyboard `Arrow`/`Home`/`End`/`Backspace`/`Delete`/`Enter`, and full validation/accessibility chrome (`role="alert"` / `"status"`, `labelHidden` message retention).
- [x] Verified `pnpm test` (`117/117` files, `1695/1695` tests), `check:react`, `check:ssr`, and `check:stories`.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-otp-input` and `http://localhost:4200/?selector=emr-otp-input&theme=dark` with `0` console/page errors, `0` failed requests, `48px` slot height (`otpMinSlotH: 48`), and `0px` horizontal overflow (`mobileDiff: 0`, standalone `diff: 0`).
- [x] Verified `"482916"` entry distributing cleanly across all 6 slots and synchronizing 1:1 across React, Lit (`otpLitVals: "482916"`), and Angular (`otpNgVals: "482916"`).

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-otp-input` preview cards, Active Props & `components-docs.tsx` cycles, `examples/angular-preview/preview-app.component.ts` wiring, `entries-l1-l2-wave2.tsx`, Storybook, `docs/catalog/L1-primitives.md`, `component-api-manifest.ts` (`208`), and `registry` (`210`) updated and verified.

## 4. Findings / Follow-ups
- None (`emr-otp-input` is `PASS`).
