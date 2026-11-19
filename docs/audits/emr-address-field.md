# Audit Report: `emr-address-field`

- **Date:** 2026-11-19
- **Layer:** L2 (`fields`)
- **Verdict:** PASS
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck via `emr-react` build)

## 1. Props, Events & Validation Parity
- [x] Canonical props & outputs implemented across Angular, React, and Lit (`model`, `definition`, `controlId`, `headingId`, `labelHidden`, `layout`, `showMetadata`, `readOnly`, `size`, `clearable`; outputs `intent` (`useChangeRequested`, `partChangeRequested`, `clearRequested`, `statusChangeRequested`), `focused`, `blurred`, `submitted`).
- [x] `EmrFieldFrame` delegation (`labelNamesControl={false}`, six-state `ClinicalAssessmentStatus`), `use` `EmrSegmentedControl` (`Home` / `Work` / `Temp` / `Billing`), explicit `showDistrict` visibility precedence (`showDistrict !== undefined ? Boolean(showDistrict) : Boolean(value.district)`), per-part `EmrValidationMessage.path` routing, Clear action, and `readOnly` gating verified.
- [x] Vitest suites (`packages/emr-elements/src/l1-l2-wave2.spec.ts`, `packages/emr-elements/src/l2-fields.spec.ts`, `packages/emr-ui/src/lib/fields/`, `packages/emr-react/src/l2-fields.logic.spec.ts`, `packages/emr-react/src/l1-l2-bulletproof.spec.ts`, and `packages/emr-ui/src/lib/catalog.spec.ts` `215/215`) verified.

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [x] `1280x900` Light & Dark themes and `390x844` mobile layout verified on `http://localhost:3300/#emr-address-field` (`http://localhost:4200/?selector=emr-address-field&theme=light` standalone `emr-address-field` verified with `ngElCount: 1`) with `0` console/page errors and `0px` horizontal overflow at `390x844`.
- [x] Verified desktop 2-column grid alignment in React (`city` & `district` row `842px`, `state` & `postal` row `914px`/`913px`, `country` row `985px`), `44px` input heights across all visible address inputs, `showDistrict` toggle hiding District across React, Lit, and Angular, `Work` segmented click & sync across React and Lit, and `Clear Residential address` emptying values across React and Lit.
- [x] Fixed React `EmrSegmentedControl` `onPress` Web pointer handling (`l1-new-inputs.tsx`), Angular `.emr-segmented` / `.emr-segmented__item` Dark mode `background-color` / `transition` lag (`emr.css` -> `rgb(30, 41, 59)` track and `rgb(15, 23, 42)` selected segment), `showDistrict = false` override when `value.district` is populated, and React desktop container threshold (`containerWidth < 360`).

## 3. Website & Registry Docs
- [x] `http://localhost:3300/#emr-address-field` 1:1 preview cards + Active Props sync verified across React, Lit, and Angular (`210` registry items & `208` API manifest components rebuilt).

## 4. Findings / Follow-ups
- None (`emr-address-field` is `PASS`).
