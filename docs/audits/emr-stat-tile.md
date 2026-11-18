# Audit Report — `emr-stat-tile`

**Verdict:** `PASS`  
**Layer:** L1 Primitive (`EmrStatTileComponent` / `EmrStatTile` / `EmrStatTileElement`)  
**Audited At:** `:3300/#emr-stat-tile` (React, Lit, Angular iframe `:4200`)

---

## 1. Automated Checks

- `pnpm build:controller` — exited `0`
- `pnpm build:ui` — exited `0`
- `pnpm lit:public` — exited `0` (`public/lit/emr-elements.bundle.js` rebuilt)
- `node scripts/build-component-api.mjs` & `pnpm registry:build` — exited `0`
- `pnpm check:react` — exited `0` (`tsc -p tsconfig.json --noEmit` & `tsc -p tsconfig.native.json --noEmit`)
- `pnpm vitest run packages/emr-controller/src/l1-primitives.models.spec.ts packages/emr-elements/src/l1-primitives.spec.ts packages/emr-react/harness/gallery/parity/parity-workbench.spec.ts` — 37/37 tests passed

## 2. Live Browser Verification (`http://localhost:3300/#emr-stat-tile`)

- **Console & Network**: 0 console errors, 50/50 network requests `200 OK`.
- **1:1 Parity & Monochrome Trend Icon (`1280x800`)**: React, Lit, and Angular render `Patients referred today`, tabular numeric `14`, monochrome `14px` SVG `chevron-up` + `+12% vs yesterday` (`success` tone), `Click tile in either pane to increment`, and `2 awaiting sync` (`warning`) badge.
- **Interactions & Active Props Sync**:
  - Clicking tiles (`14 -> 15 -> 16 -> 17`) synchronized `clicks` across React, Lit, and Angular.
  - `tone`: `neutral -> info -> success -> warning -> danger -> neutral` updated border accents across all three renderers.
  - `size`: `md -> lg -> sm -> md` updated `min-height` (`88px` / `104px` / `72px`) and padding (`16px` / `20px` / `12px`).
  - `selected`: `false -> true -> false` toggled primary highlight border/surface and `aria-pressed="true"`.
  - `loading`: `false -> true -> false` rendered 3 skeleton bars (`aria-busy="true"`) and suppressed clicks.
  - `readOnly`: `false -> true -> false` applied dashed borders (`role="group"`) and blocked clicks.
  - `disabled`: `false -> true -> false` dimmed opacity (`0.55`) and blocked clicks.
- **Themes & Mobile (`390x844`)**: Light and Dark themes rendered crisp contrast (`#0f172a` dark tile background across React, Lit, and Angular); `390x844` mobile layout (`body` width `390px`) wrapped toolbar links and tiles cleanly with zero horizontal overflow or clipping.

## 3. Shared Controller Helpers Added

- `packages/emr-controller/src/surface-contracts.models.ts`: Added `EmrStatTileTrend`, `EmrStatTileSize`, and optional `trend?`, `tone?` on `EmrStatTileModel`.
- `packages/emr-controller/src/l1-primitives.models.ts`: `normalizeEmrStatTileSize`, `normalizeEmrStatTileTone`, `canActivateEmrStatTile`, `resolveEmrStatTileAriaLabel`.
