# Changelog

Current state and pending work live in `handoff.md`. Exact changes and authorship live in Git.

## 19 November 2026 — Full L1/Wave 2 & L2 Clinical Field Parity + Clean `pnpm check`

- **L2 Clinical Building Blocks (`#35`–`#44` Audited `PASS`)**:
  - Completed Stage 1–3 cross-renderer parity (`emr-controller`, `emr-ui`, `emr-react` Web/Expo Native, `emr-elements` Lit, `examples/angular-preview/`, parity harness, catalog docs, and `docs/audits/emr-*.md`) for `emr-paired-field`, `emr-duration-input`, `emr-range-field`, `emr-signature-capture-field`, `emr-phone-input`, `emr-address-field`, `emr-macro-text-field`, `emr-laterality-field`, `emr-visual-acuity-field`, and `emr-refraction-field`.
  - Fixed React Web `EmrSegmentedControl` `onPress` pointer handling (`l1-new-inputs.tsx`), Angular `.emr-select-shell` / `.emr-segmented` / `.emr-button` Dark theme `background-color` transition lag (`emr.css`), React `EmrSelect` `44px` trigger height (`primitives.tsx`), and converted `EmrMacroTextField` SmartPhrases panel to in-flow layout across React, Lit, and Angular.
- **Wave 2 L1 & L2 Primitives (`18` Entries Audited `PASS`)**:
  - **Choice & Tree (`emr-toggle-group`, `emr-tree-view`, `emr-tree-select`)**: Refactored React `EmrToggleGroup` to `role="switch"` group, fixed tri-state `showSelectAll` (`role="checkbox"`), fixed Angular `[role="treeitem"]` `aria-checked` (`true`/`false`/`mixed`), fixed nested-interactive in React `EmrTreeSelect` + mobile `<Modal>` sheet, and fixed Lit disabled-row index & floating dismissal.
  - **Image Suite (`emr-image-viewer`, `emr-image-cropper`, `emr-image-upload`, `emr-image-field`)**: Added monochrome SVGs, Expo Native `PanResponder` pan & `<Image>` transforms, `<canvas>` crop rasterization (template `#cropCanvas` in Angular), `44x44px` crop handles + outer scrim, file size/MIME rejection alerts + `FileReader.readAsDataURL`, modal Lightbox/Crop dialogs with focus restoration, removed forbidden `disabled` prop above L2 on `EmrImageField` & `EmrTypedField`, and wrapped React `EmrImageViewer` toolbar cleanly at `390px`.
  - **Date, Slider & Pattern Inputs (`emr-date-range-input`, `emr-slider`, `emr-range-slider`, `emr-masked-input`, `emr-otp-input`)**: Unified `emr-range-slider` onto a single dual-thumb `role="slider"` track with cross-bounded ARIA bounds and `clampRangeSliderPair` boundary `minDistance`, proportional clickable `marks`, Expo Native `PanResponder` scrubbing, `HH:mm`-preserving `datetime` range grids, backslash mask escaping & caret preservation, and SMS `one-time-code` autofill without `maxlength="1"`.
  - **Navigation, Menus & Utilities (`emr-menu`, `emr-split-button`, `emr-accordion`, `emr-breadcrumbs`, `emr-color-picker`, `emr-copy-button`)**: Fixed Lit `EmrAccordionElement` `[object Object]` badge interpolation + `.emr-print` `[hidden]` panel reveal, fixed `EmrSplitButton` Dark-mode foreground contrast + Lit `EmrMenuElement` disabled-item focus index, replaced React disabled `<Pressable>` breadcrumb with semantic `aria-current="page"`, unified `44x44px` contrast-aware `EmrColorPicker` radio swatches with `aria-checked`, and added `EmrCopyButton` timer cleanup & feedback announcement.
- **Architecture & Test Suite Cleanup**: Resolved all 8 pre-existing / regex-drift `pnpm check` test failures across `emr-elements`, `emr-react` (`*.logic.ts` controller barrel split), `emr-ui` (`emr-stat-tile` encapsulation, `controlled-components`, `l1-l2-primitives-fields`, `l1-l2-wave2`, `emr-print`), and `EmrTypedFieldComponent.dependsOn` (`catalog.spec.ts`). Full `pnpm check` passes **117/117** Vitest files (**1701/1701** tests).

## 18 November 2026 — L1 Choice & Selection Primitives Parity (Angular, React/Expo, Lit)

- **Audited `PASS` across Angular, React Web/Expo Native, Lit, and `:3300` / `:4200` (`docs/audits/emr-*.md`)**:
  - `emr-checkbox` & `emr-toggle`: Unified `value` precedence over `checked`, `variant` (`tile`/`inline`), `size` (`md`/`sm`), `labelPlacement` (`end`/`start`/`space-between`), `mixed` state, `loading` (`aria-busy` + thumb spinner), `onLabel`/`offLabel`, `Hint -> Warning -> Error` ordering, border-box `42x24` / `38x22` switch track geometry, symmetric `.emr-print` / `@media print` rules, and `Space`/`Enter` toggles.
  - `emr-checkbox-group`, `emr-radio-group`, & `emr-segmented-control`: `tile`/`inline`/`card`/`pill`/`chip`/`segmented`/`soft`/`outline` variants, `orientation` (`vertical`/`horizontal`/`grid` with `<= 480px` 1-col collapse), `allowDeselect`, `clearable` (preserving locked items), tri-state `Select all` with monochrome SVG `minus`/`check`, `minSelections`/`maxSelections`, `exclusiveValues`, grouped headings, option `badge`/`tone`/`icon`/`description`/`readOnly` vs `disabled`, and roving `tabIndex` keyboard navigation.
  - `emr-select`, `emr-search-select`, `emr-combobox`, & `emr-tag-input`: Single and multi-select (`multiple`, removable chips with `44x44px` targets, `maxTagCount` `+N` & `0` summary, `maxSelections`/`maxTags`), deterministic tiered `rankAndFilterOptions` best-match ranking + `"Best match"` cue + `<mark>`/highlighted spans, `filterMode: 'local' | 'remote' | 'none'`, `creatable`/`allowCustomValue`, `lockedTags`, CSV paste splitting, `variant: 'outline' | 'filled' | 'subtle'`, `loading` (`aria-busy` + spinner), WAI-ARIA `role="combobox"`/`aria-activedescendant` keyboard focus retention, and mobile `<Modal>` sheets.
- **Shared `@drguptavivek/emr-controller` Additions**: Extended `EmrOption` (`readOnly`, `badge`, `tone`, `code`, `keywords`), `EmrSegmentedOption`, `rankAndFilterOptions`, `splitMatchHighlightSegments`, `resolveComboboxDisplayValue`, and pure normalization/selection/validation/keyboard helpers for all choice & selection controls, mirrored cleanly into `emr-ui` `*.logic.ts` (type-only imports preserved for SSR).
- **L2 Field Audits (`PASS`)**: Completed Stage 1–3 verification and wrote `docs/audits/*.md` (`PASS`) for `#26 emr-field-frame` through `#34 emr-attachment-field`.

## 18 October 2026 — VCMS D14–D16 (React Native; Angular deferred)

- Contracts in emr-controller: `IdentifierEntryView`, `IdentifierCheckViewModel`, `LinkCardsViewModel` (identity.models); `MergeCompareViewModel` (2–4 sources, breaking: replaces left/right), `ContactAttemptViewModel.consequence`, `DraftRecordListViewModel` (workflow.models); `ClinicalFormViewModel.correction` + `correctionRequested`.
- emr-react: `EmrLinkCards` (typed or scanned entry, Enter adds the card, same-person / not-same, primary card), N-way `EmrMergeCompare`, `EmrDraftRecordList` (move / discard with confirm), contact-attempt consequence alert, form "request correction" action; `EmrBarcodeScanField` gains `onSubmit`.
- Angular twins were started and then deferred at the user's request; the uncommitted work is parked in `.claude/angular-parked/`.

## 18 October 2026 — consent and privacy self-service (Angular + React Native)

- **Shared contracts in emr-controller**: `identity.models` (PatientIdentityViewModel, with `alerts`), `consent.models` (capture, review, receipt, status, `PendingConfirmation`), `privacy.models` (sharing grants, access log, rights requests, privacy centre). Both renderers use these.
- **Angular (emr-ui, L4, status proposed)**: `emr-consent-capture`, `emr-consent-review`, `emr-consent-receipt` (print-safe), `emr-consent-status-badge`, `emr-sharing-grants`, `emr-access-log`, `emr-rights-requests`, `emr-privacy-centre`; stories `EMR / Consent` and `EMR / Privacy / Centre`; catalog and L4 docs entries.
- **React Native (emr-react)**: the same four privacy components (`EmrSharingGrants`, `EmrAccessLog`, `EmrRightsRequests`, `EmrPrivacyCentre`); the consent components now use the shared types (old `Emr*` names kept as aliases); `EmrPatientIdentityCard` renders `alerts` with an action.
- Fix: `EmrSheet` mounts its modal only after the first client render — react-native-web's Modal cannot be server-rendered and broke Next.js hydration when a page loaded with a sheet open.

## 18 October 2026 — emr-react and form matrix blocks

- **New package `@drguptavivek/emr-react`**: React Native components (Expo, and web through react-native-web) rendering the same view models and intents as emr-ui. Tokens are generated from `emr.css`; theming is a provider with token overrides; built-in strings come from a labels provider. Verified on web in a Next.js 16 harness; native verification is pending.
- **Form matrix blocks.** `ClinicalFormBlock` gains `kind: 'matrix'`: a rows × columns grid (e.g. IOP / CDR × OD / OS) whose cells are ordinary fields stored under their own ids, so intents stay `fieldEditRequested`. Rendered by both the Angular and React forms. Story: `EMR / Clinical forms / History / Per Eye Matrix`.
- **Engine-resolved visibility.** `ClinicalFieldState` gains `hidden` and `required`. Both forms skip a hidden field only while it is empty; a hidden field holding a value stays visible.
- `pnpm check` now also typechecks emr-react and the Angular stories.
- **emr-react L1 primitives (24)**: inputs (text, number, day-first date with ISO value and 8-digit keypad entry, time, date-time, quantity, OD/OS pair, checkbox, toggle, radio group), display (chip, alert, state message, separator, card, columns, field-value row, status cell) and interactive (tabs, search-select, Likert, VAS, stage stepper, time axis). Web gallery at `/gallery` in the Next harness.
- **Consent review, receipt and contact attempts (VCMS D10, D11)**: `EmrConsentReview` (per-purpose status, decided/method/given-by, withdraw via a confirm `EmrSheet` whose wording the app supplies, grant, contact channels and preferred number; essential purposes never withdrawable); `EmrConsentReceipt` (web: semantic DOM with a print stylesheet that never clips; native: plain view); `EmrContactAttemptForm` (number with a Call action the app dials, channel, reached, outcome, next action date, note) and `EmrContactAttemptSummary` (one-line history with "Log attempt").
- **DPDP consent (VCMS D10)**: `EmrConsentCapture` — scrollable versioned notice with language switch, purposes grouped in user-defined categories (`whole`: one decision for the category; `per_purpose`: one each), essential purposes shown as "Required for care" with no toggle, given-by self/parent/guardian with guardian fields, method tap / signature / thumbprint (captured by the app) / verbal with `EmrAttestation`; all wording and rules (guardian requirement, `canSubmit`) from the app. `EmrConsentStatusBadge` for the banner.
- **Condition engine in emr-controller (engine level 3)**, upstreamed from vcms-app: `EmrCondition`/`EmrExpr` models, `evalCondition`/`evalExpr` (XPath comparison coercion; arithmetic that is not finite — division by zero, empty operands — is empty, never Infinity), and `resolveLogic(logic, values, ctx)` (calculations in order, non-relevant fields hidden and cleared to a fixed point, constraints on non-empty values, required after a submit attempt, stage gating). `EMR_LOGIC_LEVELS` gives every operator a level; `requiredEngineFor(schema, logic)` returns Infinity for unknown operators and `validateLogic` reports them at load. `isEmptyValue` is the one emptiness rule, shared with emr-react's `isFieldShown`.
- **emr-react wave 5**: `EmrTopBar` search results float as a grouped listbox overlay (coloured badges with text, arrow keys, Escape returns focus); `EmrMergeCompare`; `EmrRecordDiff` (EmrNodePath breadcrumbs, before/after); `EmrUploadQueue` (web-only picker + supplied progress); `EmrBarChart` / `EmrFunnelChart` (web-only SVG, pattern + colour series, always-present table alternative). Fixed: keyboard handlers on TextInputs (react-native-web ignores onKeyDown there) now go through `textInputKeys` — this also restores arrow keys in `EmrSearchSelect`.
- **emr-react wave 4 (shells)**: mobile — `EmrPinPad` (count-driven mask, never sees digits), `EmrLoginForm` (password only in a local draft), `EmrBottomTabBar` (raised Scan), `EmrSyncPill`, `EmrToast` (no timers); web — `EmrAppShell`, `EmrLeftNav` (tree with roving focus), `EmrTopBar` (grouped global search); `EmrDataTable` (web-only semantic table in `data-table.web.tsx`, native fallback notice). Gallery shows the VCMS home screens as compositions.
- **emr-react wave 3 (VCMS)**: `EmrBarcodeScanField` (validator-agnostic; app supplies normalised value, error, warning; scan is an intent), `EmrPatientIdentityCard` (identifiers[], full/compact), `EmrIdentifierCheckPrompt` (blocked / warnings / ok; controller-supplied `canConfirm`, `canAddAsAdditional`, `canReplaceExisting`), `EmrPatientHistoryTimeline` (pinned summary + visits), `EmrCataractEpisodeCard` (controller-supplied `canCompleteSurgery`, `canAddFollowup`), `EmrArrivalLinker` (controlled UHID step), `EmrSpectacleDelivery`, `EmrBookedNotDeliveredList`.
- Both form renderers skip a section when no block in it would show (`isSectionShown`).
- `EmrButton` small keeps the full target height on every platform (hitSlop does not apply on web).
- **emr-react wave 2**: L3 clinical list (+ medication, allergy, chronic disease, personal history), standalone clinical matrix (table when wide, row cards when narrow; read-only cells stay focusable); L4 patient banner (+ compact phone header), capture status bar with optional sync state (`connection`, `outbox`, `lastSync` on `CaptureStatusBarViewModel`; React renders them, Angular does not yet), attestation, `EmrSheet` (bottom sheet / side panel, confirm dialog), patient list, work queue, timeline; `EmrStatTile` for counts and KPIs.
- **`EMR_ENGINE_VERSION` / `requiredEngineFor(schema)`** in emr-controller: the feature level server-supplied definitions are stamped with.

## 10 October 2026 — anatomy outline redraws

- **19 anatomy outlines redrawn** (neonate, Mallampati, knee AP and lateral pairs, stomach, brain pair, thyroid, tracheobronchial tree, shoulder pair, pelvis and hips, great vessels, colon, hand pair, ETT airway) in a Renaissance-anatomist style: stroke widths 6 and 3 only, honest proportions and contacts, short labels, open space to annotate. Recipe descriptions updated to match.
- **Two new heart recipes** (`heart-anterior-cutaway`, `heart-anterior-cutaway-chordae`): a vector trace of a supplied AI-generated illustration, unlabelled, smoothed and recoloured to the outline palette. Provenance records that origin; confirm the generator's output terms before release.
- **Retired** `heart-four-chamber-section` (replaced by the cutaway recipes).

## 10 October 2026 — inpatient banner and drug order composer

- **Medication administration record recipe** (`EMR / Medications / Administration record`) composes `EmrTimeAxis`, `EmrStatusCell` and `EmrAttestation` with the story as controller (outcome badges, witness and co-sign policy, attestation model). Eight stories. No new component was needed.

- **Banner allergy wording is controller-supplied.** `PatientBannerViewModel` gains `allergyChipPrefix` and `allergyOverflow` (a badge). The UI no longer adds "Allergy:" or derives the "+N allergies" danger tone.

- **`EmrPatientBanner`** now takes optional inpatient context: bed, ward, length of stay, admitted on, admitting clinician, weight, and code-status and isolation badges. Each value is a controller-supplied label or badge and renders only when present, so outpatient output is unchanged. New stories are `InpatientWard` and `InpatientIcuIsolation`.
- The banner moved to signal `input()`/`output()` with one `intent` output. The `expandedChangeRequested` output is now an intent member. The architecture test now accepts signal outputs.
- **Drug order composer recipe** (`EMR / Medications / Order composer`) composes existing components only, with the story acting as the controller. It has seven stories: Blank, TabletBd, EyeDropTaper, PrnAnalgesia, ReadOnly, WithValidationMessages and Mobile. No new component was needed.

## 10 October 2026 — `10732c3`, `d89b4ef` — annotation foundation and fixes to existing components

- The annotation canvas now uses the controller's types; its duplicate UI type system is deleted.
- `AnnotationDocument` schema v2 adds a required `background` (image id and intrinsic size). Deserialization now validates layers; v1 is rejected.
- Fixed letterboxed-image misregistration: the canvas takes the image's aspect ratio and the overlay uses image-pixel units. A Playwright registration test covers it.
- Removed teal and every UI-owned colour; `brushColor` is controller-supplied.
- Moved the placeholder anatomy outlines from the component into story fixtures. The component now shows an empty state.
- File reading moved out of the component; the Dermatology story host plays the controller's part.
- Updated the L4 catalogue entry, the drawing plan (status, gap list, one-SVG-per-view rule, optical/retinoscopy cross) and the handoff.

## 10 October 2026 — `6064652` and the following commit — L5 anatomy outlines and 15 new components

Built by parallel subagents from one architecture review, then integrated and checked centrally.

- **L5 recipes.** Added the `AnatomyTemplateRecipe` contract and `anatomyTemplateToImage` (controller), plus 105 standalone outline SVGs in 24 sets: whole body, head/scalp, face, neck, thorax, back, pelvis, genital/perineal, upper and lower limbs, hands, feet, ENT, dental/oral, neurological, vascular, wound/procedure, abdomen and six ophthalmic sets.
  - `recipes.spec.ts` enforces the drawing standard: size, palette, no scripts or external references, one recipe per SVG, documented groups.
  - The SVGs ship at `dist/emr-ui/assets/anatomy`. Storybook has a gallery and a draw-on-outline story.
  - Every outline is `unreviewed`.
- **New components:**
  - `EmrDoseSchedule`: every dosage form, words before codes, and an OD frequency/site guard.
  - `EmrClinicalTranscript` + `EmrEvidenceSuggestionList` + `NoteCaptureController`: evidence-linked dictation/typed note capture.
  - `EmrMeridianCross`: optical and retinoscopy cross with axis labels.
  - `EmrOcularMotilityChart`.
  - `EmrOctFindingRecord`.
  - `EmrAnnotationToolbar` (compact, shape glyphs, one pen button) and `EmrAnnotationList`.
  - `EmrObservationFlowsheet` and `EmrObservationTrend`.
  - `EmrCodedInput` (L2).
  - `EmrScoreResultCard`.
  - `EmrCaptureStatusBar`.
  - `EmrMedicationReconciliation`.
  - `EmrWorkQueue`.
- **Fixes to existing components:**
  - The typed field and clinical matrix no longer present "status not set" as "recorded"; the matrix intent takes `null` to clear.
  - `EmrSelect` now shows a pre-selected value: options bind `[selected]`, because `[value]` was applied before @for options existed. Other selects are tracked in the handoff.
  - `EmrSearchSelect` gains `labelHidden`.
  - The staged checklist's disabled items use muted text instead of opacity, which failed contrast.
  - 51 hex colour fallbacks were removed from five components.
- **New architecture rules:** no colour literals in components; no `::ng-deep` and no unencapsulated local styles (four older components grandfathered).

## 9 October 2026 — `8baf858`

- Added VAS primitive, stories, catalogue/public exports, documentation and visual baselines.
- Updated Likert presentation/baselines, design and print styles, and print checks.
- Fixed controller ID collisions, stale search responses and malformed node-path parsing, with regression tests.
- Updated pedigree vital-status modelling/rendering, annotation canvas, typed fields, inputs and section cards.
- Added the drawing/annotation implementation plan; implementation remains planned.
- Committed 112 files, including source, docs, snapshots, `.claude/launch.json` and two machine-local trace files (`.trace-mcp/guard-mode`, `.trace-mcp/install-date`). The trace files were included inadvertently; their tracking is corrected below.
- `pnpm check` passed: 232 tests, controller/UI builds, Node import and SSR smoke check. Playwright visual tests were not rerun.

## Earlier work — history migrated from the former handoff

These are historical summaries, not fresh verification or claims that every workflow is complete. Consult Git for exact dates and changes.

- Established private Angular/controller workspace, Storybook, themes and controlled-architecture checks.
- Added primitives, clinical forms/matrices/lists, patient context/navigation, timeline, checklists and pedigree.
- Added orders/favourites, documents/upload/viewer, ophthalmic prescription/diagnostics, field generation and template authoring.
- Added separator and configurable card/column/field-value layouts.
- Added annotation canvas tools, independent layer management, undo/redo and save intents; versioned serialization and repository contracts.
- Added dermatology, paired-retina, surgery-planning and read-only photo stories with class labels. Former notes reported controller/UI/Storybook builds for that work; these do not establish current validation.
- Reorganised components into layers and added field-contract documentation (`a95d1ec`).

## 9 October 2026 — `b7a2ecf` (documentation maintenance)

- Converted `handoff.md` into a current-state document with explicit validation limits and pending work.
- Moved historical progress summaries into this changelog.
- Corrected the handoff to distinguish the planned recipes layer from existing folders and to identify teal defaults in the annotation component as well as stories.
- Removed machine-local `.trace-mcp/guard-mode` and `.trace-mcp/install-date` from Git tracking and ignored `.trace-mcp/`; retained the local files and shared `.claude/launch.json`.
