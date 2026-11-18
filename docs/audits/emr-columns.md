# Audit Report — `emr-columns`

**Verdict:** `PASS`  
**Layer:** L1 Primitive (`EmrColumnsComponent` / `EmrColumns` / `EmrColumnsElement`)  
**Audited At:** `:3300/#emr-columns` (React, Lit, Angular iframe `:4200`)

---

## 1. Automated Checks

- `pnpm build:controller` — exited `0`
- `pnpm build:ui` — exited `0`
- `pnpm lit:public` — exited `0` (`public/lit/emr-elements.bundle.js` rebuilt)
- `pnpm check:react` — exited `0` (`tsc -p tsconfig.json --noEmit` & `tsc -p tsconfig.native.json --noEmit`)
- `pnpm vitest run packages/emr-elements/src/l1-primitives.spec.ts packages/emr-react/harness/gallery/parity/parity-workbench.spec.ts` — 26/26 tests passed

## 2. Live Browser Verification (`http://localhost:3300/#emr-columns`)

- **Console & Network**: 0 console errors (resolved `ResizeObserver loop completed with undelivered notifications` by scheduling container width and `.preview-stage` height measurements via `requestAnimationFrame`), 50/50 requests `200 OK`.
- **1:1 Parity & Equal-Height Grid (`1280x800`, `count=3`, `align="stretch"`, `gap=12`, `collapseBelow=380`)**:
  - React (`EmrColumns`, CSS Grid on Web + `display: grid` cell stretch), Lit (`EmrColumnsElement`, CSS Grid), and Angular (`EmrColumnsComponent`, CSS Grid) all render `OD IOP`, `OS IOP`, and `Pachymetry` side-by-side in 3 equal-height columns (`132x109px` each in React, `132x118.59px` each in Lit, `930x220px` iframe in Angular).
- **Active Props Cycling**:
  - `count`: `3 -> 2 -> 1 -> 3` updates column tracks across React, Lit, and Angular; Angular iframe auto-resizes cleanly (`220px` -> `242px` -> `349px` -> `220px`) with zero clipping.
  - `align`: `stretch -> start -> center -> end -> stretch` cycles cleanly across all three renderers.
  - `gap`: `12 -> 24 -> 8 -> 12` visibly updates spacing across all three renderers.
- **Themes**: Light and Dark themes render crisp contrast and borders across React, Lit, and Angular with zero clipping.
- **Mobile (`390x844`)**: All three renderers collapse cleanly to a single column below `collapseBelow=380`, and Angular renders all 3 stacked cards cleanly (`308x349px`) without clipping.

## 3. Shared Controller Helpers Added

- `packages/emr-controller/src/l1-primitives.models.ts`: `EmrColumnsAlign`, `EmrColumnsTrackWidth`, `normalizeEmrColumnsCount`, `normalizeEmrColumnsAlign`, `normalizeEmrColumnsGap`, `normalizeEmrColumnsCollapseBelow`, `resolveEmrColumnsCssTemplate`.
