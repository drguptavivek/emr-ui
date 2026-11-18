# Component Audit Report: `emr-time-input`

- **Verdict**: `PASS`
- **Date**: 2026-11-18
- **Layer**: L1 (`primitives/`)
- **Audited Targets**:
  - Controller: `packages/emr-controller/src/l1-primitives.models.ts` (`EmrTimePrecision`, `EmrTimeHourCycle`, `EmrTimeSize`, `sanitizeTimeText`, `parseTimeText`, `formatTimeDisplay`, `isTimeOutOfBounds`, `resolveTimePlaceholder`)
  - Angular: `packages/emr-ui/src/lib/primitives/emr-inputs.component.ts` (`EmrTimeInputComponent`), `emr-inputs.logic.ts`, `emr.css`
  - React / Expo: `packages/emr-react/src/l1-inputs.tsx` (`EmrTimeInput`), `packages/emr-react/src/inputs-core.tsx` (`EmrTypedText`)
  - Lit Web Component: `packages/emr-elements/src/l1-primitives.ts` (`EmrTimeInputElement`), `packages/emr-elements/src/index.ts`
  - Previews & Docs: `examples/angular-preview/preview-app.component.ts`, `packages/emr-react/harness/gallery/parity/entries-l1-l2.tsx`, `packages/emr-react/harness/gallery/components-docs.tsx`, `docs/catalog/L1-primitives.md`

## Automated Verification
- `pnpm build:controller` — PASS
- `pnpm lit:public` — PASS
- `node scripts/build-component-api.mjs` — PASS (208 components)
- `pnpm registry:build` — PASS (210 items)
- `pnpm check:react` (`tsc --noEmit` Web + Expo Native) — PASS
- `pnpm build:ui` (`ng build emr-ui`) — PASS
- `pnpm vitest run packages/emr-elements/src/l1-primitives.spec.ts packages/emr-react/harness/gallery/parity/parity-workbench.spec.ts` — PASS (26/26 tests)

## Live Browser Verification (`http://localhost:3300/#emr-time-input`)
- **Initial Render & Console Errors**: PASS — React Web, Lit `<emr-time-input>`, and Angular `<emr-time-input>` rendered with 1:1 parity (`Dilation instillation time`, value `"09:30"`, hint `"24-hour hh:mm"`, monochrome SVG Clear and Clock buttons, no duplicate browser clock icon). Zero console/page errors.
- **12h vs 24h & Seconds Precision**: PASS — Typing `"14:45"` synced across all 3 cards and Active Props; toggling `hourCycle="12"` displayed `"02:45 PM"` across all 3 while keeping canonical 24h wire value `"14:45"`; toggling `precision="second"` displayed `"02:45:00 PM"` / `"14:45:00"` cleanly across all 3.
- **Validation, Clear & Disabled**: PASS — Clear (`×`) reset all 3 cards to `null` (`hh:mm` placeholder); invalid `"25:99"` flagged `aria-invalid="true"` + red border without emitting corrupted values; `disabled=true` applied disabled state and hid Clear across all 3 cards.
- **Dark Theme & `390px` Preview**: PASS — Crisp contrast in Dark mode and clean layout at `390px` preview width with zero overflow or clipping.
