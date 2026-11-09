# EMR Component System

A multi-framework clinical component workspace for building controlled, accessible electronic medical record interfaces across **Angular**, **React Web**, and **Expo / React Native**. It strictly separates presentational UI components from framework-neutral controllers so applications retain full ownership of API calls, clinical rules, persistence, navigation, and workflow state.

## Packages

- `@drguptavivek/emr-controller` — framework-neutral immutable view models, typed intents, repository ports, headless controllers, and the form condition engine.
- `@drguptavivek/emr-ui` — standalone Angular 22 presentation components (`L1`–`L6`) and `L0` CSS design tokens (`emr.css`, `emr-print.css`).
- `@drguptavivek/emr-react` — React Web (`react-native-web`) and Expo / React Native components (`L1`–`L6`) with 1:1 view-model, intent, and token parity with `@drguptavivek/emr-ui`.
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
# List all 117 registry items across L0–L6 (or filter by layer)
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
```

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
