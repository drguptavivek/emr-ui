# Audit Report: `emr-time-axis`

- **Date:** 2026-11-19
- **Layer:** L3 (`structures`)
- **Verdict:** PASS (`neon-supervisor` Gemini 4 Neon (High) Final Sign-Off)
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo Native typecheck via `tsconfig.native.json`)

## 1. Props, Events & Validation Parity
- [x] Unified cross-renderer API: `model: TimeAxisViewModel`, `headingId`, `idPrefix`, `labels: Partial<EmrTimeAxisLabels>`; outputs `intent: TimeAxisIntent`, `focused`, `blurred`. Zero `disabled` input/prop above L2.
- [x] Added controller capability guards (`canSelectTimeAxisSlot`, `canChangeTimeAxisStep`, `canPanTimeAxis`, `canTriggerTimeAxisIntent`) and deterministic ID/keyboard helpers (`resolveTimeAxisNextIndex` restricting keyboard navigation to `ArrowLeft`/`ArrowRight`/`Home`/`End`) in `time-axis.models.ts`, plus Angular SSR-safe `emr-time-axis.logic.ts` (type-only controller imports).
- [x] Replaced raw Unicode chevrons (`‹` / `›`) with monochrome SVGs (`heroChevronLeft`/`Right`, `chevron-left`/`right`), upgraded React Step chooser to `<EmrSelect>` (`tabularNums`, `>=44px`), wired `aria-current="time"` + non-overlapping `current`/`selected` borders, and ensured `RESOLVED_MONO_FONT` + `tabular-nums` (`Menlo`/`monospace` on Expo Native).
- [x] Verified `role="listbox"` / `role="option"` single-stop roving `tabindex` in interactive mode, keyboard-focusable `<ol>` / `role="list"` scroll region in `readOnly` mode, `>=44px` hit targets, and `.emr-print` / `@media print` (`data-emr-print="hide"` on Step/Earlier/Later controls, `data-emr-print="expand"` + `overflow: visible` + `break-inside: avoid` on the strip).
- [x] `pnpm check` (`138/138` files, `1793/1793` tests), `check:react`, `lit:public`, `build-component-api.mjs`, `registry:build`, and `emr-angular-preview` passed.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] Verified live across `http://localhost:3300/#emr-time-axis` and `http://localhost:4200/?selector=emr-time-axis` (`1280x900` desktop & `390x844` mobile, Light & Dark themes) with `0px` host AND internal Shadow DOM overflow (`420/420`, `292/292`, `1280/1280`, `390/390`), bounded horizontal scroll containment (`440px` strip inside `418px`/`290px` containers), `>=44px` hit targets (`88x60px` ticks), `:focus-visible` `3px` outline on `ArrowRight`/`Home`/`End`, `Inter Variable` + `tabular-nums`, and `0` console/page errors.
- [x] Verified Stage 3 mobile header fix (`minWidth: 0, maxWidth: '100%'` on React `axisStack`/`axisWrap`/`axisStep`/`axisHead`) live on `390x844` (`scrollW === clientW === 292`, `[Earlier | Later]` wraps cleanly below `Step`), plus bidirectional sync for tick selection, `Later`/`Earlier` panning, `Step` changes, and `readOnly`.

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-time-axis` 1:1 preview cards, Active Props sync (`stepId`, `selectedTickId`, `offset` with `windowStartLabel` sync, `readOnly`), `Properties`/`Events`/`Usage` docs, `docs/catalog/L3-structures.md`, `catalog.manifest.ts`, `component-api-manifest.ts`, `registry/`, and `examples/angular-preview/preview-app.component.ts` verified.

## 4. Findings / Follow-ups
- Fixed React mobile `390x844` `axisWrap` header overflow (`332 -> 292`) and aligned `Earlier`/`Later` label weight (`fontWeight(t.weightBold)`). None remaining (`emr-time-axis` is `PASS`).
