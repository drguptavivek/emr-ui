# Component Audit Report: `emr-datetime-input`

- **Verdict**: `PASS`
- **Date**: 2026-11-18
- **Layer**: L1 (`primitives/`)
- **Audited Targets**:
  - Controller: `packages/emr-controller/src/l1-primitives.models.ts` (`EmrDateTimeDisplayFormat`, `EmrDateTimePrecision`, `EmrDateTimeHourCycle`, `EmrDateTimeWireFormat`, `EmrDateTimeSize`, `sanitizeDateDisplayText`, `formatIsoDateDisplay`, `parseDateDisplayText`, `splitDateTimeParts`, `joinDateTimeParts`, `isDateTimeOutOfBounds`)
  - Angular: `packages/emr-ui/src/lib/primitives/emr-inputs.component.ts` (`EmrDateTimeInputComponent`), `emr-inputs.logic.ts`, `emr.css`
  - React / Expo: `packages/emr-react/src/l1-inputs.tsx` (`EmrDateTimeInput`), `packages/emr-react/src/inputs-core.tsx` (`EmrDateTimeText`), `packages/emr-react/src/l1-inputs.logic.ts`
  - Lit Web Component: `packages/emr-elements/src/l1-primitives.ts` (`EmrDateTimeInputElement`), `packages/emr-elements/src/index.ts`
  - Previews & Docs: `examples/angular-preview/preview-app.component.ts`, `packages/emr-react/harness/gallery/parity/entries-l1-l2.tsx`, `packages/emr-react/harness/gallery/components-docs.tsx`, `docs/catalog/L1-primitives.md`

## Automated Verification
- `pnpm build:controller` — PASS
- `pnpm lit:public` — PASS
- `node scripts/build-component-api.mjs` — PASS (208 components)
- `pnpm registry:build` — PASS (210 items)
- `pnpm check:react` (`tsc --noEmit` Web + Expo Native) — PASS
- `pnpm build:ui` (`ng build emr-ui`) — PASS
- `pnpm vitest run packages/emr-elements/src/l1-primitives.spec.ts packages/emr-react/harness/gallery/parity/parity-workbench.spec.ts` — PASS (26/26 tests)

## Live Browser Verification (`http://localhost:3300/#emr-datetime-input`)
- **Initial Render & Console Errors**: PASS — React Web, Lit `<emr-datetime-input>`, and Angular `<emr-datetime-input>` rendered with 1:1 parity (`Tonometry timestamp`, paired Date `14-10-2026` + monochrome calendar button, Time `15:00` + monochrome clock button, monochrome Clear `×` button, `UTC: 2026-10-14T09:30:00Z`). Zero console/page errors.
- **`displayFormat`, `hourCycle`, `timePrecision`**: PASS — Cycling `displayFormat` (`dd-mm-yyyy` → `dd/mm/yyyy` → `yyyy-mm-dd` → `mm/dd/yyyy`), `hourCycle` (`24` → `12` displaying `03:00 PM`), and `timePrecision` (`minute` → `second` displaying `15:00:00`) updated React, Lit, and Angular cleanly in lockstep.
- **Interaction, Clear & Disabled**: PASS — Editing Date (`15-10-2026`) synced `2026-10-15T09:30:00Z` across all 3 cards and Active Props; Clear (`×`) reset all 3 cards to `null` and hid Clear; `disabled=true` muted and locked all 3 cards.
- **Dark Theme & `390px` Responsive Width**: PASS — Crisp contrast in Dark theme and clean wrapping of paired Date + Time + Clear at `390px` width across React, Lit, and Angular with zero horizontal overflow.
