# EMR Component System

A multi-framework clinical component workspace for building controlled, accessible electronic medical record interfaces across **Angular**, **React Web**, and **Expo / React Native**. It strictly separates presentational UI components from framework-neutral controllers so applications retain full ownership of API calls, clinical rules, persistence, navigation, and workflow state.

## Live Catalog & Registry (GitHub Pages)

- **Interactive Showcase, Shadcn Registry Explorer & OPD Form Demo:** https://drguptavivek.github.io/emr-ui/
- **Angular Storybook Catalog (`@drguptavivek/emr-ui`):** https://drguptavivek.github.io/emr-ui/storybook/
- **Shadcn Registry Index JSON:** https://drguptavivek.github.io/emr-ui/registry/index.json

Use the **Specialty / workflow** filter in the Registry Explorer or the [Lit component directory](https://drguptavivek.github.io/emr-ui/lit/#lit-directory). Components can appear in multiple clinical areas. The registry also keeps layer and renderer filters available.

## Packages

- `@drguptavivek/emr-controller` — framework-neutral immutable view models, typed intents, repository ports, headless controllers, and the form condition engine.
- `@drguptavivek/emr-ui` — standalone Angular 22 presentation components (`L1`–`L6`) and `L0` CSS design tokens (`emr.css`, `emr-print.css`).
- `@drguptavivek/emr-react` — React Web (`react-native-web`) and Expo / React Native components (`L1`–`L6`) with 1:1 view-model, intent, and token parity with `@drguptavivek/emr-ui`.
- `@drguptavivek/emr-elements` — Lit Web Components that render the shared controller models and emit bubbling, composed `intent` events.
- Storybook & Harnesses — synthetic clinical examples for component discovery, responsive states, light/dark themes, print context, Next.js (`packages/emr-react/harness/next`), and Expo (`packages/emr-react/harness/expo`).

The complete agreed scope and implementation sequence is in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

## Installation

You can consume EMR components either as **versioned npm packages** or via the **`shadcn`-style per-component CLI & registry** (`registry/index.json`) to vendor individual components and their exact L0–L6 dependency closure into your project.

### Mode A: Install as npm packages

**Angular applications:**

```bash
pnpm add @drguptavivek/emr-controller @drguptavivek/emr-ui
```

```ts
import { EmrPatientBannerComponent, EmrClinicalFormComponent } from '@drguptavivek/emr-ui';
```

**React Web (Next.js / Vite) & Expo (React Native) applications:**

```bash
pnpm add @drguptavivek/emr-controller @drguptavivek/emr-react
```

```tsx
import { EmrThemeProvider, EmrPatientBanner, EmrClinicalForm } from '@drguptavivek/emr-react';
```

Subpath exports are also available per layer/module (e.g., `@drguptavivek/emr-react/tokens`, `@drguptavivek/emr-react/primitives`, `@drguptavivek/emr-react/clinical-form`, `@drguptavivek/emr-react/data-table`, `@drguptavivek/emr-ui/styles/emr.css`).

### Mode B: `shadcn`-style per-component CLI (`emr`)

Vendor individual component source files (plus their transitive `dependsOn` closure and `L0` tokens) directly into your repository:

```bash
# List registry items across L0–L6 (or filter by layer)
pnpm emr list
pnpm emr list --layer 1

# Inspect a component's metadata, dependencies, and target files
pnpm emr info emr-patient-banner

# Initialize emr.json and install L0 design tokens
pnpm emr init --framework angular   # or: react | expo

# Add any component (automatically resolves and installs L0–L6 dependencies)
pnpm emr add emr-patient-banner --framework angular
pnpm emr add emr-clinical-form --framework react
pnpm emr add emr-data-table --framework expo
pnpm emr add emr-clinical-form --framework lit

# Or install directly from the hosted GitHub Pages registry via the official shadcn CLI:
npx shadcn@latest add https://drguptavivek.github.io/emr-ui/registry/items/emr-patient-banner.json
```

The Lit package entry point registers its elements when loaded in a browser. For vendored source, use the registry item's Lit setup snippet to import and call the relevant registration function. Registration includes the lower layers used by that module.

Regenerate the static JSON registry (`registry/index.json` and `registry/items/<slug>.json`) after modifying catalog entries:

```bash
pnpm registry:build
```

## Local development

```bash
pnpm install
pnpm check
pnpm storybook
```

Build all packages (`emr-controller`, `emr-ui`, `emr-react`), the component registry, and the static Storybook catalogue:

```bash
pnpm build
```

Run the optional cross-browser visual/accessibility suite after installing the Playwright browser engines:

```bash
pnpm exec playwright install chromium firefox webkit
pnpm test:visual
```

The suite covers Chromium, Firefox, and WebKit at 360px, 768px, and 1280px, including light/dark axe checks, keyboard interactions, responsive overflow, and checked-in Chromium visual baselines. `pnpm check` also verifies a native Node ESM import and an Angular SSR/hydration render.

## Controlled component boundary

Workflow components accept immutable state and emit typed intent events. They do not call HTTP services, route, persist data, query terminology servers, interpret clinical values, or silently maintain domain selections.

Controllers implement the common contract:

```ts
interface EmrController<State, Intent> {
  getSnapshot(): Readonly<State>;
  subscribe(listener: (state: Readonly<State>) => void): () => void;
  dispatch(intent: Intent): void;
  destroy(): void;
}
```

Components may manage transient presentation behaviour such as focus movement, overlay placement, animation, and scrolling.

### Controller integration example

The same synthetic fundus matrix runs through `ClinicalMatrixController` in three hosts. Enter an optic-disc finding and check the accepted value for that eye below the matrix.

- **React Web.** The gallery example uses `useControllerState()` and forwards `onIntent` to the controller. [React host](packages/emr-react/harness/gallery/l3-structures.tsx)
- **Angular.** The hydration host subscribes into an Angular signal and releases the subscription and its controller on destruction. `pnpm check` exercises the edit after hydration. [Angular host](tests/ssr-host.mjs) · [Hydration check](tests/ssr-smoke.mjs)
- **Lit.** The workstation host sets `.definition` and `.model`, forwards the matrix's own `intent` events, and releases the binding on teardown. [Lit host](examples/clinical-matrix/lit-host.mjs)

Run the Pages export and its Chromium check from the repository root. In the React gallery and Lit workstation, look for **Controller integration example**.

```bash
pnpm site:build --base-path=/emr-ui
node tests/controller-matrix-pages.mjs
```

The host owns the controller lifetime. Destroy host-owned controllers that hold external resources, such as subscriptions or in-flight requests, when the host finishes with them. Views release their own subscriptions. The React example uses an in-memory matrix controller and the hook releases its subscription on unmount.

### Search as you type and synthetic workflows

Pass `{ debounceMs: 200, minChars: 1 }` as the third argument to `AsyncSearchController`, or the fifth to `HierarchyOrderController`, to enable repository search on `queryChanged`. Without the option, use `searchRequested`. The controllers cancel superseded work and expose results, loading and errors. A repository can search its own catalogue or use `filterHierarchy()` for a preloaded tree. For a dropdown, `hierarchySearchOptions()` returns selectable matches with ancestor breadcrumbs.

The showcase includes a searchable hierarchical dropdown, a laboratory order tree and a fixture-backed formulary. The synthetic glaucoma follow-up uses two encounters with order-linked results, bilateral entry and revisioned drafts. Sign a note and publish the synthetic OCT correction to see the updated result require its own acknowledgement. Enter an amendment reason to open a new draft and compare its signed revision with the preserved original. The example stores its records in the browser tab session. A consuming app supplies authenticated repositories and clinical data.

After building the Pages export, run `node tests/clinical-workflows-pages.mjs` to verify search, read-only controls and the synthetic encounter round trip in Chromium.

### Clinical notes across care settings

Open **Observations & clinical notes → Clinical note workspace** in the React showcase or **Clinical note workspace** in the Lit showcase. The React Pages export also has a standalone `/clinical-notes/` route with **Print signed note**. The interactive examples cover an OPD consultation with a telephone addendum, a ward progress note awaiting consultant co-signature, and an OT operative note corrected through an amendment. Use **History** to open signed versions and compare changed sections.

The Angular, React/Expo and Lit renderers share the same model and intents. The showcase keeps synthetic notes in memory and simulates signing. A production host supplies authenticated identity, authorisation, durable record storage, and verified digital signature evidence where applicable.

After `pnpm site:build --base-path=/emr-ui --with-storybook`, run `node tests/clinical-notes-pages.mjs` to exercise the exported examples in Chromium.

## Modular catalogue

Every public UI unit is a standalone Angular component with a narrowly typed state/input API and intent output. Shared field frames, section cards, tokens, and schemas provide alignment without merging workflows into a monolith.

- Clinical documentation: clinical form, repeatable group, clinical list, and clinical matrix.
- Safety and history: staged checklist, controlled PAC assessment checklist, and family pedigree. PAC completion, fitness, clearance and clinical validation remain controller responsibilities.
- Diagnostics: result summary plus ophthalmology matrix recipes for external eye, anterior segment, retina, visual acuity, IOP, refraction, and perimetry; spectacle prescription uses a dedicated horizontal OD/OS component with controller-defined field columns.
- Documents: upload queue, folder-aware patient document library, and full-screen image/PDF-raster carousel with zoom, pan, and rotation; file transfer, authorization, and PDF rasterization remain outside the UI.
- Patient workflow: banner, patient list, encounter timeline, shell, navigation, and flyout.
- Orders: hierarchical laboratory/radiology picker, order details, and favourites panel.
- Authoring: controlled field generator with validation rules and distinct LOINC, SNOMED CT, ICD-10, ICD-11, and UCUM binding roles.
- Templates: searchable field library, ordered section/field composer, live form preview, and controller-backed import/export.

Named examinations in Storybook are recipes composed from these modules. Applications may select one recipe, replace its schema, or compose the primitives into a different workflow without importing unrelated components.

## Field and template authoring

`EmrFieldGenerator` defines a reusable field's identity, display, value type, cardinality, layout, units, and declarative validation rules. Its terminology search components only render controller-supplied sources and results and emit typed search/selection intents. Deployment adapters choose the terminology endpoints, credentials, SNOMED edition, ICD release and jurisdiction, and LOINC/UCUM versions.

Terminology bindings remain deliberately separate: a field can carry clinical meaning, an answer value set, a UCUM unit, and classification mappings without conflating those concepts. Controllers handle cancellation, stale responses, validation, persistence, and any API-specific normalization.

`EmrTemplateComposer` places immutable field-revision snapshots into ordered sections. Its native JSON definition is the framework-neutral source of truth. FHIR `Questionnaire` is the primary form representation; `Bundle` is available as controller-provided exchange packaging. The UI does not create FHIR resources itself, and a consuming application supplies the exact FHIR version and implementation-guide adapter.

The patient-list identity block deliberately presents MRN as the dominant first line, patient name separately, and a conditional ABHA identifier with an identification icon. See the durable visual comparison record in [design-qa.md](./design-qa.md).

## Styling

Import the design tokens and component styles once in the consuming Angular application:

```css
@import '@drguptavivek/emr-ui/styles/emr.css';
```

Apply `emr-theme-light` or `emr-theme-dark` to an application ancestor. `EmrAppShell` can do this directly through its controlled `theme` input.

## Data safety

All repository fixtures and Storybook examples use synthetic data. Do not add real patient identifiers or clinical records to stories, screenshots, tests, or source control.
