import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import {
  calculateFixedScheduleDispenseQuantity,
  type DoseForm,
  type PrescribingDispenseQuantity,
  type PrescribingFormularyItem,
  type PrescribingRow,
  type PrescribingSafetyAlert,
  type PrescribingTableIntent,
  type PrescribingTableViewModel,
} from '@drguptavivek/emr-controller';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';
import { EmrButtonComponent } from '../primitives/emr-button.component';

export type PrescribingTableViewMode = 'grid' | 'sig' | 'patient';

export interface FormClinicalProfile {
  readonly units: readonly string[];
  readonly step: number;
  readonly routes: readonly { value: string; label: string }[];
  readonly sitesByRoute: Readonly<Record<string, readonly { value: string; label: string }[]>>;
  readonly timingByRoute: Readonly<Record<string, readonly string[]>>;
  readonly defaultTiming: readonly string[];
}

export const DEFAULT_PRESCRIBING_FORMS: readonly { value: DoseForm; label: string }[] = [
  { value: 'tablet', label: 'Tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'drop', label: 'Drops' },
  { value: 'liquid', label: 'Liquid / Syrup' },
  { value: 'ointment', label: 'Oint / Cream' },
  { value: 'inhaler', label: 'Inhaler / Spray' },
  { value: 'injection', label: 'Inj / Inf' },
];

export const EYE_SITES = [
  { value: 'OU', label: 'OU (Both)' },
  { value: 'OD', label: 'OD (Right)' },
  { value: 'OS', label: 'OS (Left)' },
] as const;

export const EAR_SITES = [
  { value: 'AU', label: 'AU (Both Ears)' },
  { value: 'AD', label: 'AD (Right Ear)' },
  { value: 'AS', label: 'AS (Left Ear)' },
] as const;

export const NASAL_SITES = [
  { value: 'Both Nostrils', label: 'Both Nostrils' },
  { value: 'R Nostril', label: 'R Nostril' },
  { value: 'L Nostril', label: 'L Nostril' },
] as const;

export const DERM_SITES = [
  { value: 'Lesions', label: 'Lesions' },
  { value: 'Face', label: 'Face' },
  { value: 'Scalp', label: 'Scalp' },
  { value: 'Trunk', label: 'Trunk' },
  { value: 'Limbs', label: 'Limbs' },
] as const;

export const INJ_SITES = [
  { value: 'Abdomen', label: 'Abdomen' },
  { value: 'Thigh', label: 'Thigh' },
  { value: 'Deltoid', label: 'Deltoid' },
] as const;

export const DEFAULT_PRESCRIBING_DURATION_UNITS = ['days', 'weeks', 'months'] as const;

export const DEFAULT_PRESCRIBING_PRESETS: readonly { id: string; label: string; slotIds: readonly string[] }[] = [
  { id: 'od', label: 'OD', slotIds: ['m'] },
  { id: 'bd', label: 'BD', slotIds: ['m', 'n'] },
  { id: 'tds', label: 'TDS', slotIds: ['m', 'a', 'n'] },
  { id: 'qid', label: 'QID', slotIds: ['m', 'a', 'e', 'n'] },
  { id: 'hs', label: 'HS', slotIds: ['n'] },
  { id: 'sos', label: 'SOS', slotIds: [] },
];

export function getFormClinicalProfile(form: DoseForm): FormClinicalProfile {
  switch (form) {
    case 'tablet':
      return {
        units: ['', 'tab', 'mg'],
        step: 0.5,
        routes: [
          { value: 'oral', label: 'Oral' },
          { value: 'sl', label: 'Sublingual (SL)' },
          { value: 'ng', label: 'NG / Ryle Tube' },
        ],
        sitesByRoute: {},
        timingByRoute: {},
        defaultTiming: ['After food', 'Before food', 'Empty stomach', 'At bedtime'],
      };
    case 'capsule':
      return {
        units: ['', 'cap', 'mg'],
        step: 1,
        routes: [
          { value: 'oral', label: 'Oral' },
          { value: 'ng', label: 'NG Tube' },
        ],
        sitesByRoute: {},
        timingByRoute: {},
        defaultTiming: ['After food', 'Before food', 'Empty stomach', 'At bedtime'],
      };
    case 'drop':
      return {
        units: ['drop', 'mL', ''],
        step: 1,
        routes: [
          { value: 'eye', label: 'Ophthalmic (Eye)' },
          { value: 'ear', label: 'Otic (Ear · ENT)' },
          { value: 'nasal', label: 'Nasal (ENT)' },
          { value: 'oral', label: 'Oral Drops (Peds)' },
        ],
        sitesByRoute: {
          eye: EYE_SITES,
          ear: EAR_SITES,
          nasal: NASAL_SITES,
        },
        timingByRoute: {
          eye: ['5 min gap', 'Shake well', 'Punctal occlusion', 'At bedtime'],
          ear: ['Tilt head 2 min', 'Keep ear dry', 'Warm bottle'],
          nasal: ['Clear nose first', 'After steam', 'Head tilted back'],
          oral: ['Use dropper', 'With milk/feed', 'After feed'],
        },
        defaultTiming: ['5 min gap', 'Shake well', 'At bedtime'],
      };
    case 'liquid':
      return {
        units: ['mL', 'tsp', 'mg/kg', 'mg', ''],
        step: 2.5,
        routes: [
          { value: 'oral', label: 'Oral (Peds/Med)' },
          { value: 'gargle', label: 'Gargle (ENT)' },
          { value: 'ng', label: 'NG / PEG Tube' },
        ],
        sitesByRoute: {},
        timingByRoute: {
          gargle: ['Dilute 1:1 warm water', 'Swish 30s — do not swallow', 'After meals'],
        },
        defaultTiming: ['Use oral syringe', 'Shake well', 'After food', 'At bedtime'],
      };
    case 'ointment':
    case 'cream':
    case 'gel':
      return {
        units: ['FTU', 'app', 'ribbon', 'g', ''],
        step: 0.5,
        routes: [
          { value: 'topical', label: 'Topical (Derm)' },
          { value: 'eye', label: 'Ophthalmic (Eye)' },
          { value: 'nasal', label: 'Anterior Nares' },
        ],
        sitesByRoute: {
          topical: DERM_SITES,
          eye: EYE_SITES,
          nasal: NASAL_SITES,
        },
        timingByRoute: {
          eye: ['Instil ointment last', 'At bedtime', '5 min gap'],
          topical: ['Thin layer only', 'On damp skin', 'Sunscreen AM', 'Wash off 5m'],
        },
        defaultTiming: ['Thin layer only', 'On damp skin', 'At bedtime'],
      };
    case 'spray':
    case 'inhaler':
      return {
        units: ['puff', 'spray', 'respule', 'mL', ''],
        step: 1,
        routes: [
          { value: 'inhalation', label: 'Inhalation' },
          { value: 'neb', label: 'Nebuliser' },
          { value: 'nasal', label: 'Intranasal (ENT)' },
        ],
        sitesByRoute: {
          nasal: NASAL_SITES,
        },
        timingByRoute: {
          inhalation: ['Rinse mouth after', 'Use spacer', 'Before exercise'],
          neb: ['Dilute in 3 mL NS', 'Via mask/mouthpiece'],
          nasal: ['Prime spray', 'Aim away from septum'],
        },
        defaultTiming: ['Rinse mouth after', 'Use spacer', 'Anytime'],
      };
    case 'injection':
      return {
        units: ['mg', 'mL', 'IU', 'mg/m²', 'mg/kg', 'g'],
        step: 1,
        routes: [
          { value: 'iv-inf', label: 'IV Infusion' },
          { value: 'iv-bolus', label: 'IV Bolus' },
          { value: 'sc', label: 'Subcut (SC)' },
          { value: 'im', label: 'IM' },
          { value: 'ivt', label: 'Intravitreal' },
          { value: 'it', label: 'Intrathecal' },
        ],
        sitesByRoute: {
          sc: INJ_SITES,
          im: INJ_SITES,
          ivt: EYE_SITES,
        },
        timingByRoute: {
          'iv-inf': ['Infuse over 30m', 'Infuse over 20m (Mannitol)', 'Pre-medicate 30m prior', 'Monitor vitals'],
          sc: ['Rotate site', 'Before meal (Insulin)', 'At bedtime'],
          ivt: ['Sterile prep + Povidone', 'Check IOP post-inj'],
        },
        defaultTiming: ['Infuse over 30m', 'Monitor vitals', 'Rotate site'],
      };
    default:
      return {
        units: ['', 'sachet', 'supp', 'patch', 'mg', 'mL'],
        step: 1,
        routes: [
          { value: 'oral', label: 'Oral' },
          { value: 'pr', label: 'Per Rectum (PR)' },
          { value: 'transdermal', label: 'Transdermal' },
        ],
        sitesByRoute: {},
        timingByRoute: {},
        defaultTiming: ['After food', 'Dissolve in water', 'Rotate patch site'],
      };
  }
}

export function formatPrescribingDoseAmount(n: number | null | undefined): string {
  if (n === null || n === undefined || n <= 0) return '0';
  if (n === 0.25) return '¼';
  if (n === 0.5) return '½';
  if (n === 0.75) return '¾';
  return String(n);
}

/**
 * Resolves the dispense quantity for a prescribing row, using either the controller-supplied
 * `row.dispenseQuantity` or auto-calculating fixed tablet/capsule schedules via
 * `calculateFixedScheduleDispenseQuantity` (excluding parent rows that have sequential step-titration children).
 */
export function resolveRowDispenseQuantity(
  row: PrescribingRow,
  allRows?: readonly PrescribingRow[],
): PrescribingDispenseQuantity | undefined {
  if (row.dispenseQuantity) return row.dispenseQuantity;
  if (allRows?.some((candidate) => candidate.parentRowId === row.id)) return undefined;
  return calculateFixedScheduleDispenseQuantity(row);
}

export const calculateDispenseQuantity = calculateFixedScheduleDispenseQuantity;

/**
 * L4. Multi-row clinical prescribing table (`emr-prescribing-table`).
 * Renders a controlled prescription grid with per-row move up (`↑`), move down (`↓`),
 * insert below (`+`), remove (`−`), inline slot dose steppers (`−` / `+`), quick frequency
 * presets, duration stepper (`−` / `+`), eye site pills (`OD` / `OS` / `OU`), SmartSig quick-entry,
 * DDI & allergy safety alerts with acknowledge/override support, view modes (`grid` / `sig` / `patient`),
 * auto-calculated dispense count, and an expandable multi-step taper schedule.
 */
@Component({
  selector: 'emr-prescribing-table',
  standalone: true,
  imports: [EmrBadgeComponent, EmrButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="rx-table"
      [attr.aria-label]="headingId() ? null : (model().title ?? 'Medication Prescribing Table')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="rx-table__header">
        <div class="rx-table__title-group">
          <span class="rx-table__badge" aria-hidden="true">Rx</span>
          <div>
            <h3 class="rx-table__title" [attr.id]="headingId() ?? null">
              {{ model().title ?? 'Medication Prescribing Table' }}
            </h3>
            <p class="rx-table__subtitle">
              Use − / + to step doses &amp; duration, and ↑ / ↓ / + / − to reorder, duplicate, or remove rows.
            </p>
          </div>
        </div>

        <div class="rx-table__actions">
          @if (model().favourites?.length && !isLocked()) {
            <div class="rx-table__favs" role="group" aria-label="Favourite order sets">
              <span class="rx-table__meta-label">Quick sets:</span>
              @for (fav of model().favourites!; track fav.id) {
                <button
                  type="button"
                  class="emr-button emr-button--outline emr-button--small"
                  (click)="intent.emit({ type: 'favouriteApplied', favouriteId: fav.id })"
                >
                  + {{ fav.label }}
                </button>
              }
            </div>
          }
          @if (model().status; as st) {
            <emr-badge [tone]="st.tone">{{ st.label }}</emr-badge>
          }
          <div class="rx-table__view-modes" role="group" aria-label="Prescription view modes">
            @for (vm of viewModes; track vm.id) {
              <button
                type="button"
                class="rx-table__pill"
                [attr.aria-pressed]="viewMode() === vm.id"
                (click)="setViewMode(vm.id)"
              >{{ vm.label }}</button>
            }
          </div>
        </div>
      </header>

      <!-- Epic-style Quick-Sig / SmartSig Command Bar -->
      @if (!isLocked()) {
        <div class="rx-table__smartsig" role="region" aria-label="SmartSig quick order">
          <span class="rx-table__smartsig-label">SmartSig Quick-Order:</span>
          <input
            type="text"
            class="emr-control rx-table__smartsig-input"
            [value]="quickSigText()"
            placeholder="Type shorthand e.g. &quot;moxi 1qid ou 7d&quot; or &quot;pred 1qid ou taper&quot;..."
            aria-label="SmartSig shorthand command"
            (input)="onQuickSigInput($event)"
            (keydown.enter)="submitQuickSig()"
          />
          <button
            type="button"
            class="rx-table__pill"
            [disabled]="!quickSigText().trim()"
            (click)="submitQuickSig()"
          >+ Parse &amp; Add Row</button>
          @if (model().quickSigExamples?.length) {
            <div class="rx-table__smartsig-chips" role="group" aria-label="SmartSig 1-click examples">
              <span class="rx-table__meta-label">1-click:</span>
              @for (ex of model().quickSigExamples!; track ex.command) {
                <button
                  type="button"
                  class="rx-table__pill rx-table__pill--mono"
                  [attr.aria-label]="'Apply SmartSig ' + ex.command"
                  (click)="applyQuickSigExample(ex.command)"
                >{{ ex.command }}</button>
              }
            </div>
          }
        </div>
      }

      <!-- Clinical Safety, DDI & Allergy Reconciliation Strip -->
      @if (model().safetyAlerts?.length) {
        <div class="rx-table__alerts" role="region" aria-label="Clinical safety and drug interaction alerts">
          @for (alert of model().safetyAlerts!; track alert.id) {
            <div
              class="rx-table__alert"
              [class.rx-table__alert--danger]="alert.tone === 'danger'"
              [class.rx-table__alert--warning]="alert.tone === 'warning'"
              [class.rx-table__alert--success]="alert.tone === 'success'"
              [class.rx-table__alert--info]="alert.tone === 'info'"
              [class.rx-table__alert--acknowledged]="isAlertAcknowledged(alert.id)"
              [attr.role]="alert.tone === 'danger' || alert.tone === 'warning' ? 'alert' : 'status'"
            >
              <strong class="rx-table__alert-badge">{{ alert.badgeLabel }}:</strong>
              <span class="rx-table__alert-msg">{{ alert.message }}</span>
              @if (!isLocked() && (alert.tone === 'danger' || alert.tone === 'warning')) {
                <button
                  type="button"
                  class="rx-table__pill rx-table__alert-ack"
                  [attr.aria-pressed]="isAlertAcknowledged(alert.id)"
                  [attr.aria-label]="(isAlertAcknowledged(alert.id) ? 'Acknowledged ' : 'Acknowledge ') + alert.badgeLabel"
                  (click)="toggleAlertAcknowledge(alert.id)"
                >{{ isAlertAcknowledged(alert.id) ? '✓ Acknowledged' : 'Acknowledge / Override' }}</button>
              }
            </div>
          }
        </div>
      }

      @if (viewMode() === 'sig') {
        <div class="rx-table__sig-list" role="region" aria-label="Sig summary view">
          @for (row of model().rows; track row.id; let idx = $index; let first = $first; let last = $last) {
            <div class="rx-table__sig-card">
              <div class="rx-table__sig-main">
                <span class="rx-table__num">{{ idx + 1 }}</span>
                <div class="rx-table__sig-body">
                  <div class="rx-table__sig-head">
                    <strong>{{ row.drugName || 'Unnamed medication' }} {{ row.strength }}</strong>
                    <emr-badge tone="neutral">{{ row.formLabel || row.form }} · {{ row.route.toUpperCase() }}{{ row.site ? ' (' + row.site + ')' : '' }}</emr-badge>
                    @if (row.frequencyCode) {
                      <emr-badge tone="info">{{ row.frequencyCode }}</emr-badge>
                    }
                    <span class="rx-table__pattern">[{{ formatRowSlotPattern(row) }}]</span>
                    <emr-badge tone="success">{{ formatRowDuration(row) }}</emr-badge>
                    @if (dispenseForRow(row); as dispense) {
                      <span class="rx-table__dispense">= {{ dispense.count }} {{ dispense.unit }}{{ dispense.count === 1 ? '' : 's' }}</span>
                    }
                  </div>
                  <p class="rx-table__sig-line">
                    Sig: {{ row.unitLabel }} ({{ formatRowSlotPattern(row) }}) · {{ row.foodRelation }}{{ row.instructions ? ' · ' + row.instructions : '' }}{{ formatRowTaperSummary(row) }}
                  </p>
                </div>
              </div>
              <div class="rx-table__btn-row">
                @if (!isLocked()) {
                  <button
                    type="button"
                    class="rx-table__icon-btn"
                    [disabled]="first"
                    [attr.aria-label]="'Move row ' + (idx + 1) + ' up'"
                    (click)="intent.emit({ type: 'rowMoveRequested', rowId: row.id, direction: 'up' })"
                  >↑</button>
                  <button
                    type="button"
                    class="rx-table__icon-btn"
                    [disabled]="last"
                    [attr.aria-label]="'Move row ' + (idx + 1) + ' down'"
                    (click)="intent.emit({ type: 'rowMoveRequested', rowId: row.id, direction: 'down' })"
                  >↓</button>
                  <button
                    type="button"
                    class="rx-table__icon-btn"
                    [attr.aria-label]="'Insert below row ' + (idx + 1)"
                    (click)="intent.emit({ type: 'rowAddRequested', afterRowId: row.id })"
                  >+</button>
                  <button
                    type="button"
                    class="rx-table__icon-btn rx-table__icon-btn--danger"
                    [disabled]="model().rows.length <= 1"
                    [attr.aria-label]="'Remove row ' + (idx + 1)"
                    (click)="intent.emit({ type: 'rowRemoveRequested', rowId: row.id })"
                  >−</button>
                }
                <button type="button" class="rx-table__pill" (click)="setViewMode('grid')">Edit in Grid</button>
              </div>
            </div>
          }
        </div>
      } @else if (viewMode() === 'patient') {
        <div class="rx-table__patient-matrix" role="region" aria-label="Patient daily schedule matrix">
          <div class="rx-table__patient-banner">
            Patient Daily Schedule Matrix · Leave at least 5 minutes between different eye drops. Instil eye ointments last.
          </div>
          <div class="rx-table__patient-columns">
            @for (slotDef of model().slotDefinitions; track slotDef.id) {
              <div class="rx-table__patient-col">
                <div class="rx-table__patient-col-head">
                  <strong>{{ slotDef.label }}</strong>
                  @if (slotDef.timeHint) {
                    <span class="rx-table__meta-label">{{ slotDef.timeHint }}</span>
                  }
                </div>
                @if (scheduledRowsForSlot(slotDef.id).length === 0) {
                  <p class="rx-table__patient-empty">No doses scheduled</p>
                } @else {
                  @for (entry of scheduledRowsForSlot(slotDef.id); track entry.row.id) {
                    <div class="rx-table__patient-item">
                      <strong>{{ entry.row.drugName }} {{ entry.row.strength }}</strong>
                      <span class="rx-table__patient-dose">
                        {{ formatDoseAmount(entry.amount) }} {{ entry.row.unitLabel }} {{ entry.row.site ? '· ' + entry.row.site : '' }} ({{ entry.row.foodRelation }})
                      </span>
                    </div>
                  }
                }
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="rx-table__scroll">
          <table class="rx-table__grid">
            <thead>
              <tr>
                <th scope="col">Drug Name &amp; Strength</th>
                <th scope="col">Dose (Qty &amp; Unit)</th>
                <th scope="col">Frequency (OD/BD/TDS/HS/SOS · M–A–E–N)</th>
                <th scope="col">Route &amp; Site</th>
                <th scope="col">Duration (− / +)</th>
                <th scope="col">Spcl Instructions</th>
                <th scope="col">+ / − / ↑ / ↓</th>
              </tr>
            </thead>
            <tbody>
              @for (row of model().rows; track row.id; let idx = $index; let first = $first; let last = $last) {
                <tr
                  class="rx-table__row"
                  [class.rx-table__row--step-down]="row.stepPhase === 'step-down'"
                  [class.rx-table__row--step-up]="row.stepPhase === 'step-up'"
                >
                  <td class="rx-table__cell-drug">
                    @if (row.stepPhase || row.specialtyTag) {
                      <div class="rx-table__presets" style="margin-bottom: 4px;">
                        @if (row.stepPhase) {
                          <span class="rx-table__phase-badge" [class.rx-table__phase-badge--up]="row.stepPhase === 'step-up'">
                            {{ row.stepLabel ?? (row.stepPhase === 'step-down' ? '↘ STEP-DOWN PHASE' : '↗ STEP-UP PHASE') }}
                          </span>
                        }
                        @if (row.specialtyTag) {
                          <span class="rx-table__pattern">{{ row.specialtyTag }}</span>
                        }
                      </div>
                    }
                    <div class="rx-table__drug-inputs">
                      <span class="rx-table__num">{{ idx + 1 }}</span>
                      <input
                        type="text"
                        class="emr-control"
                        [value]="row.drugName"
                        [readOnly]="isLocked()"
                        placeholder="Medicine name or formulary search"
                        [attr.aria-label]="'Row ' + (idx + 1) + ' medicine name'"
                        (focus)="onDrugFocus(row.id, row.drugName)"
                        (input)="onDrugInput(row.id, $event)"
                      />
                      @if (searchFor(row.id, row.drugName); as search) {
                        <div class="rx-table__formulary" [attr.aria-busy]="search.loading" aria-label="Formulary results">
                          @if (search.loading) {
                            <span role="status">Searching formulary…</span>
                          } @else if (search.error) {
                            <span role="alert">{{ search.error }}</span>
                            @if (!isLocked()) {
                              <button type="button" class="rx-table__pill" (click)="retryFormulary(row.id, search.query)">Retry search</button>
                            }
                          } @else if (search.items.length) {
                            <div role="group" [attr.aria-label]="'Formulary results for row ' + (idx + 1)">
                              @for (item of search.items; track item.code) {
                                <button type="button" class="rx-table__formulary-result" [disabled]="isLocked()" (click)="selectFormulary(row.id, item)">
                                  {{ item.drugName }} {{ item.strength }} · {{ item.formLabel }} · {{ item.code }}
                                </button>
                              }
                            </div>
                          } @else if (search.query.trim()) {
                            <span role="status">No formulary results.</span>
                          }
                        </div>
                      } @else if (localFormularyMatches(row.id, row.drugName); as localItems) {
                        @if (localItems.length) {
                          <div class="rx-table__formulary" role="group" [attr.aria-label]="'Formulary results for row ' + (idx + 1)">
                            @for (item of localItems; track item.code) {
                              <button type="button" class="rx-table__formulary-result" [disabled]="isLocked()" (click)="selectLocalFormulary(row.id, item)">
                                {{ item.drugName }} {{ item.strength }} · {{ item.formLabel }} · {{ item.code }}
                              </button>
                            }
                          </div>
                        }
                      }
                      <input
                        type="text"
                        class="emr-control rx-table__strength"
                        [value]="row.strength"
                        [readOnly]="isLocked()"
                        placeholder="500 mg"
                        [attr.aria-label]="'Row ' + (idx + 1) + ' strength'"
                        (input)="onStrengthInput(row.id, $event)"
                      />
                    </div>
                    <div class="rx-table__presets" style="margin-top: 4px; margin-bottom: 0;">
                      <span class="rx-table__pattern">Form: {{ row.formLabel || row.form }}</span>
                      @if (row.formularyCode) {
                        <span class="rx-table__slot-label" style="margin-bottom: 0;">{{ row.formularyCode }}</span>
                      }
                      @if (row.stockStatus) {
                        <span class="rx-table__slot-label" style="margin-bottom: 0;">· {{ row.stockStatus }}</span>
                      }
                      @if (!isLocked()) {
                        <button
                          type="button"
                          class="rx-table__link-btn"
                          [attr.aria-label]="'Override dosage form for ' + (row.drugName || 'unlisted drug')"
                          [attr.aria-pressed]="isCustomFormOpen(row)"
                          (click)="toggleCustomForm(row.id, isCustomFormOpen(row))"
                        >{{ isCustomFormOpen(row) ? 'Hide form override' : 'Custom form ▾' }}</button>
                      }
                    </div>
                    @if (isCustomFormOpen(row)) {
                      <div class="rx-table__presets" style="margin-top: 4px; margin-bottom: 0;">
                        @for (f of formOptions(); track f.value) {
                          <button
                            type="button"
                            class="rx-table__pill"
                            [disabled]="isLocked()"
                            [attr.aria-pressed]="row.form === f.value"
                            (click)="selectForm(row.id, f.value)"
                          >{{ f.label }}</button>
                        }
                      </div>
                    }
                  </td>

                  <td class="rx-table__cell-dose">
                    <div class="rx-table__stepper">
                      @if (!isLocked()) {
                        <button
                          type="button"
                          class="rx-table__step-btn"
                          [attr.aria-label]="'Decrease dose for row ' + (idx + 1)"
                          [disabled]="(row.doseAmount ?? 0) <= doseStepForRow(row)"
                          (click)="stepDose(row.id, -1)"
                        >−</button>
                      }
                      <span class="rx-table__step-val">{{ row.doseAmount == null ? '—' : formatDoseAmount(row.doseAmount) }}{{ row.unitLabel ? ' ' + row.unitLabel : '' }}</span>
                      @if (!isLocked()) {
                        <button
                          type="button"
                          class="rx-table__step-btn"
                          [attr.aria-label]="'Increase dose for row ' + (idx + 1)"
                          (click)="stepDose(row.id, 1)"
                        >+</button>
                      }
                    </div>
                    <div class="rx-table__presets" style="margin-top: 4px; margin-bottom: 0;">
                      @for (u of unitsForRow(row); track u) {
                        <button
                          type="button"
                          class="rx-table__pill rx-table__pill--mono"
                          [disabled]="isLocked()"
                          [attr.aria-label]="u === '' ? 'Dose unit: unitless' : 'Dose unit: ' + u"
                          [attr.aria-pressed]="row.unitLabel === u"
                          (click)="changeDoseUnit(row.id, u)"
                        >{{ u === '' ? '—' : u }}</button>
                      }
                    </div>
                    @if (row.dosingBasisLabel) {
                      <span class="rx-table__slot-label" style="margin-top: 4px; margin-bottom: 0;">{{ row.dosingBasisLabel }}</span>
                    }
                  </td>

                  <td class="rx-table__cell-frequency">
                    @if (!isLocked()) {
                      <div class="rx-table__presets">
                        @for (preset of presetsForTable(); track preset.id) {
                          <button
                            type="button"
                            class="rx-table__pill"
                            [attr.aria-pressed]="row.frequencyCode?.toLowerCase() === preset.id.toLowerCase()"
                            (click)="intent.emit({ type: 'presetApplied', rowId: row.id, presetId: preset.id })"
                          >{{ preset.label }}</button>
                        }
                        @if (row.patternLabel) {
                          <span class="rx-table__pattern">{{ row.patternLabel }}</span>
                        }
                      </div>
                    } @else if (row.patternLabel || row.frequencyCode) {
                      <div class="rx-table__presets">
                        @if (row.frequencyCode) {
                          <span class="rx-table__pattern">{{ row.frequencyCode }}</span>
                        }
                        @if (row.patternLabel) {
                          <span class="rx-table__pattern">{{ row.patternLabel }}</span>
                        }
                      </div>
                    }
                    <div class="rx-table__slots">
                      @for (def of model().slotDefinitions; track def.id) {
                        <div class="rx-table__slot">
                          <span class="rx-table__slot-label">{{ def.shortLabel ?? def.label }}</span>
                          <div class="rx-table__stepper">
                            @if (!isLocked()) {
                              <button
                                type="button"
                                class="rx-table__step-btn"
                                [attr.aria-label]="'Decrease ' + def.label + ' dose'"
                                (click)="intent.emit({ type: 'slotStepped', rowId: row.id, slotId: def.id, delta: stepFor(row.form) * -1 })"
                              >−</button>
                            }
                            <button
                              type="button"
                              class="rx-table__step-val rx-table__step-val--btn"
                              [disabled]="isLocked()"
                              [attr.aria-label]="def.label + ' slot: ' + slotAmount(row, def.id)"
                              (click)="cycleSlotAmount(row, def.id)"
                            >{{ slotAmount(row, def.id) }}</button>
                            @if (!isLocked()) {
                              <button
                                type="button"
                                class="rx-table__step-btn"
                                [attr.aria-label]="'Increase ' + def.label + ' dose'"
                                (click)="intent.emit({ type: 'slotStepped', rowId: row.id, slotId: def.id, delta: stepFor(row.form) })"
                              >+</button>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </td>

                  <td class="rx-table__cell-route">
                    <span class="rx-table__pattern">{{ row.route }}</span>
                    <div class="rx-table__presets" style="margin-top: 4px;">
                      @for (r of routesForRow(row); track r.value) {
                        <button
                          type="button"
                          class="rx-table__pill"
                          [disabled]="isLocked()"
                          [attr.aria-pressed]="row.route === r.value"
                          (click)="changeRoute(row.id, r.value)"
                        >{{ r.label }}</button>
                      }
                    </div>
                    @if (sitesForRow(row); as rowSites) {
                      @if (rowSites.length) {
                        <div class="rx-table__presets" role="group" [attr.aria-label]="'Anatomical site for row ' + (idx + 1)" style="margin-top: 4px; margin-bottom: 0;">
                          @for (s of rowSites; track s.value) {
                            <button
                              type="button"
                              class="rx-table__pill rx-table__pill--mono"
                              [disabled]="isLocked()"
                              [attr.aria-label]="'Site ' + s.label + ' for row ' + (idx + 1)"
                              [attr.aria-pressed]="row.site === s.value"
                              (click)="changeSite(row.id, s.value)"
                            >{{ s.value }}</button>
                          }
                        </div>
                      }
                    }
                  </td>

                  <td class="rx-table__cell-duration">
                    <div class="rx-table__stepper">
                      @if (!isLocked()) {
                        <button
                          type="button"
                          class="rx-table__step-btn"
                          [attr.aria-label]="'Decrease duration for row ' + (idx + 1)"
                          [disabled]="(row.durationCount ?? 0) <= 1"
                          (click)="intent.emit({ type: 'durationStepped', rowId: row.id, delta: -1 })"
                        >−</button>
                      }
                      <span class="rx-table__step-val">{{ row.durationCount ?? '—' }} {{ row.durationUnit }}</span>
                      @if (!isLocked()) {
                        <button
                          type="button"
                          class="rx-table__step-btn"
                          [attr.aria-label]="'Increase duration for row ' + (idx + 1)"
                          (click)="intent.emit({ type: 'durationStepped', rowId: row.id, delta: 1 })"
                        >+</button>
                      }
                    </div>
                    <div class="rx-table__presets" style="margin-top: 4px; margin-bottom: 0;">
                      @for (u of durationUnits(); track u) {
                        <button
                          type="button"
                          class="rx-table__pill"
                          [disabled]="isLocked()"
                          [attr.aria-pressed]="row.durationUnit === u"
                          (click)="changeDurationUnit(row, u)"
                        >{{ u }}</button>
                      }
                    </div>
                    @if (dispenseForRow(row); as dispense) {
                      <span class="rx-table__pattern rx-table__dispense" style="display:inline-block;margin-top:4px;">= {{ dispense.count }} {{ dispense.unit }}{{ dispense.count === 1 ? '' : 's' }}</span>
                    }
                  </td>

                  <td class="rx-table__cell-timing">
                    <div class="rx-table__presets">
                      @for (food of timingsForRow(row); track food) {
                        <button
                          type="button"
                          class="rx-table__pill"
                          [disabled]="isLocked()"
                          [attr.aria-pressed]="row.foodRelation === food"
                          (click)="changeFoodRelation(row.id, food)"
                        >{{ food }}</button>
                      }
                    </div>
                    <div class="rx-table__timing-row">
                      <input
                        type="text"
                        class="emr-control"
                        [value]="row.instructions"
                        [readOnly]="isLocked()"
                        placeholder="Spcl instructions…"
                        [attr.aria-label]="'Row ' + (idx + 1) + ' instructions'"
                        (input)="onInstructionsInput(row.id, $event)"
                      />
                      <button
                        type="button"
                        class="rx-table__pill"
                        [attr.aria-pressed]="!!row.taperExpanded"
                        (click)="intent.emit({ type: 'taperToggleRequested', rowId: row.id })"
                      >{{ row.taperSteps?.length ? 'Taper (' + row.taperSteps!.length + ')' : 'Taper' }}</button>
                    </div>
                    @if (row.error) {
                      <p class="rx-table__row-error" role="alert">{{ row.error }}</p>
                    }
                  </td>

                  <td class="rx-table__cell-order">
                    @if (!isLocked()) {
                      <div class="rx-table__btn-row">
                        <button
                          type="button"
                          class="rx-table__icon-btn"
                          [attr.aria-label]="'Insert medicine below row ' + (idx + 1)"
                          (click)="intent.emit({ type: 'rowAddRequested', afterRowId: row.id })"
                        >+</button>
                        <button
                          type="button"
                          class="rx-table__icon-btn rx-table__icon-btn--danger"
                          [disabled]="model().rows.length <= 1"
                          [attr.aria-label]="'Remove row ' + (idx + 1)"
                          (click)="intent.emit({ type: 'rowRemoveRequested', rowId: row.id })"
                        >−</button>
                        <button
                          type="button"
                          class="rx-table__icon-btn"
                          [disabled]="first"
                          [attr.aria-label]="'Move row ' + (idx + 1) + ' up'"
                          (click)="intent.emit({ type: 'rowMoveRequested', rowId: row.id, direction: 'up' })"
                        >↑</button>
                        <button
                          type="button"
                          class="rx-table__icon-btn"
                          [disabled]="last"
                          [attr.aria-label]="'Move row ' + (idx + 1) + ' down'"
                          (click)="intent.emit({ type: 'rowMoveRequested', rowId: row.id, direction: 'down' })"
                        >↓</button>
                      </div>
                      <div class="rx-table__btn-row" style="margin-top: 4px;">
                        <button
                          type="button"
                          class="rx-table__pill"
                          [attr.aria-label]="'Add Step-Down titration row below row ' + (idx + 1)"
                          (click)="intent.emit({ type: 'rowStepTitrationRequested', rowId: row.id, direction: 'down' })"
                        >↘ Step-Dn</button>
                        <button
                          type="button"
                          class="rx-table__pill"
                          [attr.aria-label]="'Add Step-Up titration row below row ' + (idx + 1)"
                          (click)="intent.emit({ type: 'rowStepTitrationRequested', rowId: row.id, direction: 'up' })"
                        >↗ Step-Up</button>
                      </div>
                    } @else {
                      <span class="rx-table__slot-label">Locked</span>
                    }
                  </td>
                </tr>

                @if (row.taperExpanded) {
                  <tr class="rx-table__taper-row">
                    <td colspan="7">
                      <div class="rx-table__taper-panel" role="region" [attr.aria-label]="'Taper schedule for row ' + (idx + 1)">
                        <div class="rx-table__taper-header">
                          <strong class="rx-table__taper-title">
                            REDUCING / TAPER SCHEDULE FOR {{ (row.drugName || 'MEDICINE').toUpperCase() }}
                          </strong>
                          @if (!isLocked()) {
                            <button
                              type="button"
                              class="rx-table__pill"
                              [attr.aria-label]="'Add taper step for row ' + (idx + 1)"
                              (click)="intent.emit({ type: 'taperStepAddRequested', rowId: row.id })"
                            >+ Add taper step</button>
                          }
                        </div>

                        <div class="rx-table__taper-steps">
                          @for (step of row.taperSteps ?? []; track step.id; let sIdx = $index; let sFirst = $first; let sLast = $last) {
                            <div class="rx-table__taper-step">
                              <span class="rx-table__taper-num">{{ idx + 1 }}.{{ sIdx + 1 }}</span>
                              <input
                                type="text"
                                class="emr-control rx-table__taper-period"
                                [value]="step.periodLabel"
                                [readOnly]="isLocked()"
                                placeholder="Week 1 / Days 1–7"
                                [attr.aria-label]="'Taper step ' + (sIdx + 1) + ' period'"
                                (input)="onTaperStepPeriodInput(row.id, step.id, $event)"
                              />
                              <input
                                type="text"
                                class="emr-control rx-table__taper-freq"
                                [value]="step.frequencyLabel"
                                [readOnly]="isLocked()"
                                placeholder="e.g. 1 drop 4 times daily (QID)"
                                [attr.aria-label]="'Taper step ' + (sIdx + 1) + ' frequency'"
                                (input)="onTaperStepFrequencyInput(row.id, step.id, $event)"
                              />
                              @if (!isLocked()) {
                                <div class="rx-table__btn-row">
                                  <button
                                    type="button"
                                    class="rx-table__icon-btn"
                                    [disabled]="sFirst"
                                    [attr.aria-label]="'Move taper step ' + (sIdx + 1) + ' up'"
                                    (click)="intent.emit({ type: 'taperStepMoveRequested', rowId: row.id, stepId: step.id, direction: 'up' })"
                                  >↑</button>
                                  <button
                                    type="button"
                                    class="rx-table__icon-btn"
                                    [disabled]="sLast"
                                    [attr.aria-label]="'Move taper step ' + (sIdx + 1) + ' down'"
                                    (click)="intent.emit({ type: 'taperStepMoveRequested', rowId: row.id, stepId: step.id, direction: 'down' })"
                                  >↓</button>
                                  <button
                                    type="button"
                                    class="rx-table__icon-btn"
                                    [attr.aria-label]="'Insert taper step after ' + (sIdx + 1)"
                                    (click)="intent.emit({ type: 'taperStepAddRequested', rowId: row.id, afterStepId: step.id })"
                                  >+</button>
                                  <button
                                    type="button"
                                    class="rx-table__icon-btn rx-table__icon-btn--danger"
                                    [attr.aria-label]="'Remove taper step ' + (sIdx + 1)"
                                    (click)="intent.emit({ type: 'taperStepRemoveRequested', rowId: row.id, stepId: step.id })"
                                  >−</button>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }

      <footer class="rx-table__footer">
        <div class="rx-table__footer-left">
          @if (!isLocked()) {
            <emr-button variant="secondary" (clicked)="intent.emit({ type: 'rowAddRequested' })">
              + Add medicine row
            </emr-button>
          }
          @if (model().prescriberLabel; as prescriber) {
            <span class="rx-table__prescriber">
              Prescriber: <strong>{{ prescriber }}</strong>{{ model().signedAtLabel ? ' · Signed ' + model().signedAtLabel : '' }}
            </span>
          }
        </div>
        <div class="rx-table__footer-right">
          @if (model().error; as err) {
            <span class="rx-table__error" role="alert">{{ err }}</span>
          }
          @if (!model().readOnly && model().canSign) {
            <emr-button (clicked)="intent.emit({ type: 'signRequested' })">
              Sign prescription
            </emr-button>
          }
          @if (!model().readOnly && model().canAmend) {
            <emr-button variant="outline" (clicked)="intent.emit({ type: 'amendRequested' })">
              Amend prescription
            </emr-button>
          }
        </div>
      </footer>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .rx-table { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; }
    .rx-table__header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); }
    .rx-table__title-group { display: flex; align-items: center; gap: 12px; }
    .rx-table__badge { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: var(--emr-primary); color: var(--emr-surface); font-family: var(--emr-font-mono); font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .rx-table__title { margin: 0; font-size: var(--emr-text-lg); font-weight: var(--emr-weight-bold); }
    .rx-table__subtitle { margin: 2px 0 0; font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
    .rx-table__actions, .rx-table__favs, .rx-table__view-modes { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
    .rx-table__meta-label { font-size: var(--emr-text-2xs); color: var(--emr-text-muted); font-weight: var(--emr-weight-medium); }
    .rx-table__smartsig { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface); }
    .rx-table__smartsig-label { font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); color: var(--emr-primary-contrast); }
    .rx-table__smartsig-input { flex: 1; min-width: 220px; max-width: 420px; font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); }
    .rx-table__smartsig-chips { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
    .rx-table__alerts { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 8px 16px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); }
    .rx-table__alert { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--emr-border); background: var(--emr-neutral-soft); font-size: var(--emr-text-xs); }
    .rx-table__alert--danger { border-color: var(--emr-danger); background: var(--emr-danger-soft); color: var(--emr-danger); }
    .rx-table__alert--warning { border-color: var(--emr-warning); background: var(--emr-warning-soft); color: var(--emr-warning); }
    .rx-table__alert--success { border-color: var(--emr-success); background: var(--emr-success-soft); color: var(--emr-success); }
    .rx-table__alert--info { border-color: var(--emr-info); background: var(--emr-info-soft); color: var(--emr-info); }
    .rx-table__alert--acknowledged { opacity: 0.78; }
    .rx-table__alert-msg { color: var(--emr-text); }
    .rx-table__alert-ack { min-height: 28px; padding: 2px 8px; }
    .rx-table__sig-list { display: grid; gap: 10px; padding: 16px; }
    .rx-table__sig-card { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding: 12px; border: 1px solid var(--emr-border); border-radius: 8px; background: var(--emr-surface); }
    .rx-table__sig-main { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 240px; }
    .rx-table__sig-body { display: grid; gap: 4px; flex: 1; }
    .rx-table__sig-head { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
    .rx-table__sig-line { margin: 0; font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
    .rx-table__patient-matrix { display: grid; gap: 12px; padding: 16px; }
    .rx-table__patient-banner { padding: 10px 12px; border-radius: 8px; border: 1px solid var(--emr-primary-border); background: var(--emr-primary-soft); color: var(--emr-primary-contrast); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-medium); }
    .rx-table__patient-columns { display: flex; flex-wrap: wrap; gap: 12px; }
    .rx-table__patient-col { flex: 1; min-width: 200px; padding: 12px; border-radius: 8px; border: 1px solid var(--emr-border); background: var(--emr-surface-soft); display: grid; gap: 8px; align-content: start; }
    .rx-table__patient-col-head { display: flex; justify-content: space-between; align-items: center; font-size: var(--emr-text-sm); }
    .rx-table__patient-empty { margin: 0; font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
    .rx-table__patient-item { padding: 8px; border-radius: 6px; border: 1px solid var(--emr-border); background: var(--emr-surface); display: grid; gap: 2px; font-size: var(--emr-text-xs); }
    .rx-table__patient-dose { font-family: var(--emr-font-mono); color: var(--emr-primary-contrast); font-weight: var(--emr-weight-bold); }
    .rx-table__scroll { overflow-x: auto; }
    .rx-table__grid { width: 100%; border-collapse: collapse; min-width: 920px; }
    .rx-table__grid th { text-align: left; padding: 8px 12px; font-size: var(--emr-text-xs); color: var(--emr-text-muted); background: var(--emr-surface-raised); border-bottom: 1px solid var(--emr-border); }
    .rx-table__row td { padding: 10px 12px; border-bottom: 1px solid var(--emr-border); vertical-align: top; }
    .rx-table__row--step-down td:first-child { border-inline-start: 3px solid var(--emr-warning); }
    .rx-table__row--step-up td:first-child { border-inline-start: 3px solid var(--emr-info); }
    .rx-table__phase-badge { padding: 2px 6px; border-radius: 4px; border: 1px solid var(--emr-warning); background: var(--emr-warning-soft); color: var(--emr-warning); font-family: var(--emr-font-mono); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
    .rx-table__phase-badge--up { border-color: var(--emr-info); background: var(--emr-info-soft); color: var(--emr-info); }
    .rx-table__num { display: inline-flex; align-items: center; justify-content: center; min-width: 26px; height: 24px; border-radius: 6px; background: var(--emr-primary-soft); color: var(--emr-primary-contrast); font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); margin-bottom: 6px; }
    .rx-table__btn-row { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
    .rx-table__icon-btn { min-width: var(--emr-control-height); min-height: var(--emr-control-height); border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); cursor: pointer; font-size: var(--emr-text-xs); }
    .rx-table__icon-btn--danger { border-color: var(--emr-danger); color: var(--emr-danger); }
    .rx-table__drug-inputs { display: flex; gap: 6px; flex-wrap: wrap; }
    .rx-table__formulary { display: grid; gap: 4px; margin-top: 4px; width: 100%; }
    .rx-table__formulary-result { display: block; width: 100%; min-height: var(--emr-control-height); padding: 6px 8px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); text-align: left; cursor: pointer; }
    .rx-table__strength { width: 88px; font-family: var(--emr-font-mono); }
    .rx-table__presets { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-bottom: 6px; }
    .rx-table__pill { padding: 4px 10px; min-height: var(--emr-control-height); border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font-size: var(--emr-text-xs); cursor: pointer; }
    .rx-table__pill--mono { font-family: var(--emr-font-mono); }
    .rx-table__pill[aria-pressed="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary-contrast); font-weight: var(--emr-weight-bold); }
    .rx-table__link-btn { border: 0; background: transparent; color: var(--emr-text-muted); font-size: var(--emr-text-2xs); text-decoration: underline; cursor: pointer; padding: 2px 4px; }
    .rx-table__pattern { padding: 2px 8px; border: 1px solid var(--emr-primary-border); border-radius: 6px; background: var(--emr-surface-soft); font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); }
    .rx-table__dispense { padding: 2px 8px; border: 1px solid var(--emr-success); border-radius: 6px; background: var(--emr-success-soft); color: var(--emr-success); font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); }
    .rx-table__slots { display: flex; gap: 6px; }
    .rx-table__slot { flex: 1; border: 1px solid var(--emr-border); border-radius: 6px; padding: 4px; background: var(--emr-surface-soft); }
    .rx-table__slot-label { display: block; font-size: var(--emr-text-2xs); color: var(--emr-text-muted); margin-bottom: 4px; }
    .rx-table__stepper { display: flex; align-items: center; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); overflow: hidden; min-height: var(--emr-control-height); }
    .rx-table__step-btn { min-width: var(--emr-control-height); min-height: var(--emr-control-height); border: 0; background: var(--emr-surface-soft); color: var(--emr-text); cursor: pointer; font-size: var(--emr-text-sm); }
    .rx-table__step-val { flex: 1; text-align: center; font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); padding: 0 4px; }
    .rx-table__step-val--btn { border: 0; background: transparent; color: var(--emr-text); cursor: pointer; min-height: var(--emr-control-height); }
    .rx-table__timing-row { display: flex; gap: 6px; align-items: center; }
    .rx-table__row-error { margin: 6px 0 0; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--emr-danger); background: var(--emr-danger-soft); color: var(--emr-danger); font-size: var(--emr-text-xs); }
    .rx-table__taper-row td { padding: 8px 16px 12px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); }
    .rx-table__taper-panel { border: 1px solid var(--emr-primary-border); border-radius: 8px; background: var(--emr-surface-raised); padding: 10px 12px; display: grid; gap: 8px; }
    .rx-table__taper-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .rx-table__taper-title { font-size: var(--emr-text-xs); color: var(--emr-primary-contrast); }
    .rx-table__taper-steps { display: grid; gap: 6px; }
    .rx-table__taper-step { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
    .rx-table__taper-num { min-width: 28px; font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); color: var(--emr-text-muted); }
    .rx-table__taper-period { width: 160px; font-size: var(--emr-text-xs); }
    .rx-table__taper-freq { flex: 1; min-width: 200px; font-size: var(--emr-text-xs); }
    .rx-table__footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding: 12px 16px; background: var(--emr-surface-soft); }
    .rx-table__footer-left, .rx-table__footer-right { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
    .rx-table__prescriber { font-size: var(--emr-text-sm); color: var(--emr-text-muted); }
    .rx-table__prescriber strong { color: var(--emr-text); }
    .rx-table__error { font-size: var(--emr-text-sm); color: var(--emr-danger); font-weight: var(--emr-weight-medium); }
  `],
})
export class EmrPrescribingTableComponent {
  readonly model = input.required<PrescribingTableViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<PrescribingTableIntent>();

  readonly viewModes: readonly { id: PrescribingTableViewMode; label: string }[] = [
    { id: 'grid', label: 'Dense Grid (Cerner)' },
    { id: 'sig', label: 'Sig Summary (Epic)' },
    { id: 'patient', label: 'Patient Matrix' },
  ];

  readonly viewMode = signal<PrescribingTableViewMode>('grid');
  readonly quickSigText = signal<string>('');
  readonly activeDrugRowId = signal<string | null>(null);
  readonly customFormOpenRows = signal<Readonly<Record<string, boolean>>>({});
  readonly acknowledgedAlertIds = signal<Readonly<Record<string, boolean>>>({});

  isLocked(): boolean {
    const m = this.model();
    return !!(m.readOnly || (m.status?.tone === 'success' && !m.canSign));
  }

  setViewMode(mode: PrescribingTableViewMode): void {
    this.viewMode.set(mode);
  }

  onQuickSigInput(event: Event): void {
    this.quickSigText.set((event.target as HTMLInputElement).value);
  }

  submitQuickSig(): void {
    if (this.isLocked()) return;
    const command = this.quickSigText().trim();
    if (!command) return;
    this.intent.emit({ type: 'quickSigSubmitted', command });
    this.quickSigText.set('');
  }

  applyQuickSigExample(command: string): void {
    if (this.isLocked()) return;
    const trimmed = command.trim();
    if (!trimmed) return;
    this.intent.emit({ type: 'quickSigSubmitted', command: trimmed });
  }

  isAlertAcknowledged(alertId: string): boolean {
    return !!this.acknowledgedAlertIds()[alertId];
  }

  toggleAlertAcknowledge(alertId: string): void {
    if (this.isLocked()) return;
    this.acknowledgedAlertIds.update((prev) => ({ ...prev, [alertId]: !prev[alertId] }));
  }

  searchFor(rowId: string, query: string) {
    const search = this.model().formularySearch;
    return search?.rowId === rowId && search.query === query ? search : undefined;
  }

  localFormularyMatches(rowId: string, query: string): readonly PrescribingFormularyItem[] {
    const m = this.model();
    if (this.isLocked() || m.formularySearch || this.activeDrugRowId() !== rowId || !m.formulary?.length) {
      return [];
    }
    const needle = query.trim().toLowerCase();
    return m.formulary.filter(
      (f) =>
        !needle ||
        f.drugName.toLowerCase().includes(needle) ||
        f.code.toLowerCase().includes(needle) ||
        f.formLabel.toLowerCase().includes(needle) ||
        (f.specialtyTag && f.specialtyTag.toLowerCase().includes(needle)),
    ).slice(0, 7);
  }

  stepFor(form: DoseForm): number {
    return getFormClinicalProfile(form).step;
  }

  doseStepForRow(row: PrescribingRow): number {
    return row.doseStep ?? (row.unitLabel === 'mL' ? 2.5 : getFormClinicalProfile(row.form).step);
  }

  formatDoseAmount(n: number | null | undefined): string {
    return formatPrescribingDoseAmount(n);
  }

  slotAmount(row: PrescribingRow, slotId: string): string {
    const n = row.slots.find((s) => s.id === slotId)?.amount ?? 0;
    return formatPrescribingDoseAmount(n);
  }

  formatRowSlotPattern(row: PrescribingRow): string {
    return row.slots.map((s) => formatPrescribingDoseAmount(s.amount)).join(' – ');
  }

  formatRowDuration(row: PrescribingRow): string {
    if (row.durationUnit === 'cont' || row.durationUnit === 'stat') {
      return row.durationUnit.toUpperCase();
    }
    return `${row.durationCount ?? 0} ${row.durationUnit}`;
  }

  formatRowTaperSummary(row: PrescribingRow): string {
    if (!row.taperSteps?.length) return '';
    return ` · Taper: ${row.taperSteps.map((st) => `${st.periodLabel}: ${st.frequencyLabel}`).join(' → ')}`;
  }

  scheduledRowsForSlot(slotId: string): readonly { row: PrescribingRow; amount: number }[] {
    return this.model()
      .rows.map((row) => ({ row, amount: row.slots.find((s) => s.id === slotId)?.amount ?? 0 }))
      .filter((entry) => entry.amount > 0);
  }

  dispenseForRow(row: PrescribingRow): PrescribingDispenseQuantity | undefined {
    return resolveRowDispenseQuantity(row, this.model().rows);
  }

  formOptions(): readonly { value: DoseForm; label: string }[] {
    return this.model().formOptions ?? DEFAULT_PRESCRIBING_FORMS;
  }

  presetsForTable(): readonly { id: string; label: string; slotIds: readonly string[] }[] {
    return this.model().presets ?? DEFAULT_PRESCRIBING_PRESETS;
  }

  unitsForRow(row: PrescribingRow): readonly string[] {
    return row.allowedUnits ?? this.model().doseUnits ?? getFormClinicalProfile(row.form).units;
  }

  routesForRow(row: PrescribingRow): readonly { value: string; label: string }[] {
    return row.allowedRoutes ?? this.model().routeOptions ?? getFormClinicalProfile(row.form).routes;
  }

  sitesForRow(row: PrescribingRow): readonly { value: string; label: string }[] {
    return this.model().siteOptions ?? getFormClinicalProfile(row.form).sitesByRoute[row.route] ?? [];
  }

  durationUnits(): readonly string[] {
    return this.model().durationUnits ?? DEFAULT_PRESCRIBING_DURATION_UNITS;
  }

  timingsForRow(row: PrescribingRow): readonly string[] {
    const profile = getFormClinicalProfile(row.form);
    const list = this.model().foodOptions ?? profile.timingByRoute[row.route] ?? profile.defaultTiming;
    return list.slice(0, 4);
  }

  isCustomFormOpen(row: PrescribingRow): boolean {
    const explicit = this.customFormOpenRows()[row.id];
    if (explicit !== undefined) return explicit;
    return !row.formularyCode && row.drugName.trim() === '';
  }

  toggleCustomForm(rowId: string, currentlyOpen: boolean): void {
    if (this.isLocked()) return;
    this.customFormOpenRows.update((prev) => ({ ...prev, [rowId]: !currentlyOpen }));
  }

  selectForm(rowId: string, form: DoseForm): void {
    if (this.isLocked()) return;
    this.intent.emit({ type: 'formChanged', rowId, form });
    this.customFormOpenRows.update((prev) => ({ ...prev, [rowId]: false }));
  }

  changeDoseUnit(rowId: string, unitLabel: string): void {
    if (this.isLocked()) return;
    this.intent.emit({ type: 'doseUnitChanged', rowId, unitLabel });
  }

  changeRoute(rowId: string, route: string): void {
    if (this.isLocked()) return;
    this.intent.emit({ type: 'routeChanged', rowId, route });
  }

  changeSite(rowId: string, site: string): void {
    if (this.isLocked()) return;
    this.intent.emit({ type: 'siteChanged', rowId, site });
  }

  changeDurationUnit(row: PrescribingRow, unit: string): void {
    if (this.isLocked()) return;
    this.intent.emit({ type: 'durationChanged', rowId: row.id, count: row.durationCount, unit });
  }

  changeFoodRelation(rowId: string, foodRelation: string): void {
    if (this.isLocked()) return;
    this.intent.emit({ type: 'foodRelationChanged', rowId, foodRelation });
  }

  cycleSlotAmount(row: PrescribingRow, slotId: string): void {
    if (this.isLocked()) return;
    const slotAmt = row.slots.find((s) => s.id === slotId)?.amount ?? 0;
    const baseDose = row.doseAmount ?? 1;
    const nextAmt =
      slotAmt <= 0
        ? baseDose
        : slotAmt === baseDose && row.form === 'tablet'
          ? 0.5
          : 0;
    this.intent.emit({ type: 'slotAmountChanged', rowId: row.id, slotId, amount: nextAmt });
  }

  protected stepDose(rowId: string, direction: -1 | 1): void {
    const model = this.model();
    const row = model.rows.find((item) => item.id === rowId);
    if (this.isLocked() || !row) return;
    const step = this.doseStepForRow(row);
    if (!Number.isFinite(step) || step <= 0 || (direction < 0 && (row.doseAmount ?? 0) <= step)) return;
    this.intent.emit({ type: 'doseStepped', rowId, delta: direction * step });
  }

  protected selectFormulary(rowId: string, item: PrescribingFormularyItem): void {
    const model = this.model();
    const search = model.formularySearch;
    if (
      this.isLocked() ||
      !search ||
      search.rowId !== rowId ||
      search.loading ||
      search.error ||
      !model.rows.some((row) => row.id === rowId && row.drugName === search.query) ||
      !search.items.includes(item)
    )
      return;
    this.intent.emit({ type: 'formularySelected', rowId, item });
    this.activeDrugRowId.set(null);
    this.customFormOpenRows.update((prev) => ({ ...prev, [rowId]: false }));
  }

  protected selectLocalFormulary(rowId: string, item: PrescribingFormularyItem): void {
    if (this.isLocked()) return;
    this.intent.emit({ type: 'formularySelected', rowId, item });
    this.activeDrugRowId.set(null);
    this.customFormOpenRows.update((prev) => ({ ...prev, [rowId]: false }));
  }

  protected retryFormulary(rowId: string, query: string): void {
    const model = this.model();
    if (
      this.isLocked() ||
      model.formularySearch?.rowId !== rowId ||
      model.formularySearch.query !== query ||
      !model.rows.some((row) => row.id === rowId && row.drugName === query)
    )
      return;
    this.intent.emit({ type: 'formularySearchRequested', rowId, query });
  }

  onDrugFocus(rowId: string, currentName: string): void {
    if (this.isLocked()) return;
    this.activeDrugRowId.set(rowId);
    this.intent.emit({ type: 'formularySearchRequested', rowId, query: currentName });
  }

  onDrugInput(rowId: string, event: Event): void {
    if (this.isLocked()) return;
    const val = (event.target as HTMLInputElement).value;
    this.activeDrugRowId.set(rowId);
    this.intent.emit({ type: 'drugNameChanged', rowId, drugName: val });
    this.intent.emit({ type: 'formularySearchRequested', rowId, query: val });
  }

  onStrengthInput(rowId: string, event: Event): void {
    if (this.isLocked()) return;
    this.intent.emit({ type: 'strengthChanged', rowId, strength: (event.target as HTMLInputElement).value });
  }

  onInstructionsInput(rowId: string, event: Event): void {
    if (this.isLocked()) return;
    this.intent.emit({ type: 'instructionsChanged', rowId, instructions: (event.target as HTMLInputElement).value });
  }

  onTaperStepPeriodInput(rowId: string, stepId: string, event: Event): void {
    if (this.isLocked()) return;
    this.intent.emit({
      type: 'taperStepChanged',
      rowId,
      stepId,
      periodLabel: (event.target as HTMLInputElement).value,
    });
  }

  onTaperStepFrequencyInput(rowId: string, stepId: string, event: Event): void {
    if (this.isLocked()) return;
    this.intent.emit({
      type: 'taperStepChanged',
      rowId,
      stepId,
      frequencyLabel: (event.target as HTMLInputElement).value,
    });
  }
}
