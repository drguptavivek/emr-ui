# EMR Component Design, Parity & Verification Workflow

This document defines the mandatory workflow for designing, implementing, auditing, and documenting every component in `@drguptavivek/emr-controller`, `@drguptavivek/emr-ui` (Angular), `@drguptavivek/emr-react` (React Web & Expo / React Native), and `@drguptavivek/emr-elements` (Lit Web Components).

## 1. Non-Negotiable Quality & Parity Bar

Every public catalog component (`emr-*`) must be **fully interchangeable** across **Angular**, **React Web**, **Expo / React Native**, and **Lit Web Components**:

1. **Identical Props, Events & Contracts**
   - Shared controller view models and discriminated intent unions live in `@drguptavivek/emr-controller`.
   - Every renderer exposes the same canonical props, variations, and events (no renderer-only features or missing props).
   - Multi-part / paired controls (e.g. `EmrPairedInput`) must support per-side input types, `min`/`max`, `required`/`optional`, and per-side `error` / `aria-invalid` states consistently across all renderers.
2. **Data Validation, Error Handling & Gating**
   - Controllers own domain/clinical validation; UI components enforce mechanical constraints (`min`/`max`, `precision`, `maxLength`, `inputmode`, `required`) and render `error`, `warning`, and `hint` consistently (`aria-invalid`, `role="alert"`, `aria-describedby`).
   - Mutation is gated at both the control and intent handler when `readOnly` or `disabled` (restoring the accepted value if rejected or locked).
   - Keep the six clinical assessment statuses distinct (`recorded`, `not-assessed`, `unable-to-assess`, `not-applicable`, `declined`, `unknown`).
3. **Visual, Icon & Theme Consistency**
   - All renderers consume the shared **L0 tokens** (`packages/emr-ui/src/lib/foundations/emr.css` Light/Dark + custom theme overrides): `Inter Variable`, `--emr-text-2xs`…`2xl` (`14px` / `--emr-text-md` default control size), `44px` minimum interactive target heights (`48px` large), shared radii, and consistent spacing/widths.
   - Hover, focus-visible, active/pressed, disabled, and read-only states must be present and visually consistent across Angular, React, and Lit.
   - Use **monochrome SVG icons** or plain text in controls and hints — **never raw color emojis** (e.g. `📅`).
   - Alerts use sharp `2px` corners, a `1px` right vertical border, a `2px` bottom underline, and translucent glassmorphism (never a thick left colored band).
4. **Website & Registry Completeness**
   - Wired into the primary **Component Docs UI** (`http://localhost:3300/`), **standalone Angular preview** (`examples/angular-preview/preview-app.component.ts` on `:4200`), **parity gallery** (`packages/emr-react/harness/gallery/parity/`), **API manifest** (`component-api-manifest.ts`), **registry** (`registry/`), `catalog.manifest.ts`, `docs/catalog/L<n>-*.md`, and **Storybook** (secondary).
   - Framework preview cards must stay **1:1**: render **only the component itself** inside each card; place shared prop toggles in the **Active Props** bar (synced across React, Lit, and Angular).

---

## 2. Three-Stage Subagent Pipeline

Every component is processed **1 by 1** through three sequential stages defined in `.agents/agents/` (mirrored at `.agent/agents/`):

| Stage | Subagent | Recommended Model Tier | Primary Output |
|---|---|---|---|
| **1. Spec & Gap Analysis** | `component-specifier` | **Opus** / **Soul Medium** / **Argon** | Component Specification & Cross-Framework Gap Report |
| **2. Implementation** | `component-implementer` | **Sonnet** / **Luna High** / **Hydrogen High** | Complete Angular, React/Expo, Lit, Tests & Preview implementations |
| **3. Verification & Sign-Off** | `component-verifier` | **Opus Low** / **Soul Low** / **Argon Low** | Live Browser/Test Audit Report (`docs/audits/<selector>.md`) + `PASS`/`FAIL` |

### Stage 1 — `component-specifier`
1. Inspect existing code for `<selector>` across `emr-controller`, `emr-ui`, `emr-react`, and `emr-elements`.
2. Benchmark props, events, validation/error handling, icons, outlines, hover/focus/disabled/read-only states, and responsive widths against **shadcn/ui, Radix, Ionic, MUI (free), Ant Design, and Flutter**.
3. Produce the **Component Specification & Gap Report**:
   - Clinical/UI role & all supported variations
   - Canonical **Props, Events, and Validation/Error** table
   - Visual & interaction spec (typography, heights, widths, icons, outlines, hover/focus, Light/Dark, `390px` mobile)
   - Exact per-framework gap list (`emr-controller`, `emr-ui`, `emr-react`, `emr-elements`, `angular-preview`, `parity`).

### Stage 2 — `component-implementer`
1. Execute the approved Stage 1 Spec across all packages (`emr-controller`, `emr-ui`, `emr-react` Web & Expo, `emr-elements`).
2. Wire/update:
   - `examples/angular-preview/preview-app.component.ts` (including bidirectional `postMessage` state sync)
   - `packages/emr-react/harness/gallery/parity/` (1:1 React & Lit cards)
   - `packages/emr-ui/catalog.manifest.ts`, `docs/catalog/L<n>-*.md`, and Storybook story
   - Focused unit & parity tests.
3. Regenerate derived artifacts:
   - `node scripts/build-component-api.mjs`
   - `pnpm registry:build`
   - `pnpm lit:public`
   - Targeted `vitest` + `pnpm check:react`.

### Stage 3 — `component-verifier`
1. Verify all unit/parity tests and typechecks pass (`vitest`, `check:react`, `build:ui`, `lit:public`).
2. Inspect the live component on `http://localhost:3300/#<selector>` (with `http://localhost:4200/` running) across **React, Lit, and Angular**:
   - Pixel measurements (heights `>=44px`, widths, padding, radii, `Inter Variable` font size & weight)
   - Hover, focus, active/selected, disabled, and read-only states
   - Light & Dark theme contrast and `390px` mobile layout
   - Validation, error/warning/hint rendering, and `Active Props` sync across all 3 frameworks
   - Website docs completeness (**Properties**, **Events**, **Usage** snippets, description).
3. Write the **Audit Report** at `docs/audits/<selector>.md` with a clear **`PASS`** or **`FAIL`** verdict. If **`FAIL`**, list exact regressions and return to Stage 2 before moving to the next component.

---

## 3. Audit Report Template (`docs/audits/<selector>.md`)

```markdown
# Audit Report: `<selector>`

- **Date:** YYYY-MM-DD
- **Layer:** L<n>
- **Verdict:** PASS | FAIL
- **Verified Renderers:** Angular · React Web · Lit Web Component · (Expo typecheck)

## 1. Props, Events & Validation Parity
- [ ] All canonical props & events implemented identically across Angular, React, Lit
- [ ] Validation, `required`, `min`/`max`, `error`/`warning`/`hint`, and `readOnly`/`disabled` gating verified

## 2. Visual & Interactive Parity (Light & Dark, Desktop & 390px)
- [ ] Font (`Inter Variable`), sizes, weights, and `>=44px` target heights match
- [ ] Hover, focus-visible, active/selected, and error states match
- [ ] Monochrome SVG icons / no raw color emojis

## 3. Website & Registry Docs
- [ ] `http://localhost:3300/#<selector>` 1:1 preview cards + Active Props sync verified
- [ ] Properties & Events tables (`component-api-manifest.ts`) and Usage snippets verified

## 4. Findings / Follow-ups
- None (or exact list of items to fix)
```
