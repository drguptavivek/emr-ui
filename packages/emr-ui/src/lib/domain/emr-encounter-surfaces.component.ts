import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type {
  EncounterSummaryPrintIntent,
  EncounterSummaryPrintViewModel,
  InpatientMarIntent,
  InpatientMarViewModel,
  PacsViewerIntent,
  PacsViewerViewModel,
  SpecialtyExamMatrixIntent,
  SpecialtyExamMatrixViewModel,
} from '@drguptavivek/emr-controller';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';
import { EmrButtonComponent } from '../primitives/emr-button.component';

/**
 * L4. Multi-viewport PACS & DICOMweb diagnostic compare viewer (`emr-pacs-viewer`).
 */
@Component({
  selector: 'emr-pacs-viewer',
  standalone: true,
  imports: [EmrBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="emr-pacs" [attr.aria-labelledby]="headingId() ?? 'emr-pacs-title'">
      <header class="emr-pacs__header">
        <h3 class="emr-pacs__title" [id]="headingId() ?? 'emr-pacs-title'">
          {{ model().title ?? 'Multi-Viewport PACS & Diagnostic Imaging Viewer' }}
        </h3>
        <div class="emr-pacs__controls" role="group" aria-label="Viewport layout modes">
          <button
            type="button"
            class="emr-pacs__chip"
            [attr.aria-pressed]="model().layoutMode === '1-up'"
            (click)="intent.emit({ type: 'layoutModeChanged', layoutMode: '1-up' })"
          >1-Up Single</button>
          <button
            type="button"
            class="emr-pacs__chip"
            [attr.aria-pressed]="model().layoutMode === '2-up-od-os'"
            (click)="intent.emit({ type: 'layoutModeChanged', layoutMode: '2-up-od-os' })"
          >2-Up OD vs OS</button>
          <button
            type="button"
            class="emr-pacs__chip"
            [attr.aria-pressed]="model().layoutMode === '2-up-compare'"
            (click)="intent.emit({ type: 'layoutModeChanged', layoutMode: '2-up-compare' })"
          >2-Up Active vs Prior</button>
        </div>
      </header>

      <div class="emr-pacs__body">
        <div class="emr-pacs__studies">
          @for (st of model().studies; track st.id) {
            <button
              type="button"
              class="emr-pacs__chip"
              [attr.aria-pressed]="st.id === model().activeStudyId"
              (click)="intent.emit({ type: 'studySelected', studyId: st.id })"
            >
              [{{ st.modality }}] {{ st.bodyPart }} ({{ st.accessionNumber }})
            </button>
          }
        </div>

        @for (st of model().studies; track st.id) {
          @if (st.id === model().activeStudyId) {
            <div class="emr-pacs__viewport">
              <div class="emr-pacs__hud">
                <span>[{{ st.modality }}] {{ st.title }}</span>
                <span>Slice {{ st.currentSlice }}/{{ st.sliceCount }} · {{ st.windowPreset }} · {{ st.zoomPercent }}%</span>
              </div>
              <p class="emr-pacs__caliper">{{ st.caliperMeasurementLabel }}</p>
              <p class="emr-pacs__impression">{{ st.radiologistImpression }}</p>
              <div class="emr-pacs__controls">
                <button type="button" class="emr-pacs__chip" (click)="intent.emit({ type: 'sliceStepped', studyId: st.id, delta: -1 })">− Slice</button>
                <button type="button" class="emr-pacs__chip" (click)="intent.emit({ type: 'sliceStepped', studyId: st.id, delta: 1 })">+ Slice</button>
                <button type="button" class="emr-pacs__chip" (click)="intent.emit({ type: 'invertToggled', studyId: st.id })">Invert LUT</button>
                <button type="button" class="emr-pacs__chip" (click)="intent.emit({ type: 'impressionPulledToNote', studyId: st.id, text: st.radiologistImpression })">Pull Impression</button>
              </div>
            </div>
          }
        }
        @if (model().pinnedKeyImages?.length) {
          <div class="emr-pacs__pins">
            @for (pin of model().pinnedKeyImages!; track pin.id) {
              <emr-badge tone="warning">{{ pin.label }}</emr-badge>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-pacs { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; }
    .emr-pacs__header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); }
    .emr-pacs__title { margin: 0; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-pacs__body { padding: 12px; display: grid; gap: 10px; }
    .emr-pacs__studies, .emr-pacs__controls, .emr-pacs__pins { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .emr-pacs__chip { padding: 4px 10px; min-height: var(--emr-compact-height); border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font-size: var(--emr-text-xs); cursor: pointer; }
    .emr-pacs__chip[aria-pressed="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary-contrast); }
    .emr-pacs__viewport { padding: 12px; border-radius: 8px; border: 1px solid var(--emr-border); background: var(--emr-surface-raised); display: grid; gap: 6px; }
    .emr-pacs__hud { display: flex; justify-content: space-between; font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); }
    .emr-pacs__caliper { margin: 0; font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); color: var(--emr-warning); font-weight: var(--emr-weight-bold); }
    .emr-pacs__impression { margin: 0; font-size: var(--emr-text-sm); }
  `],
})
export class EmrPacsViewerComponent {
  readonly model = input.required<PacsViewerViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<PacsViewerIntent>();
}

/**
 * L4. Multi-specialty clinical examination & dosing calculator matrix (`emr-specialty-exam-matrix`).
 */
@Component({
  selector: 'emr-specialty-exam-matrix',
  standalone: true,
  imports: [EmrBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="emr-spec-exam" [attr.aria-labelledby]="headingId() ?? 'emr-spec-exam-title'">
      <header class="emr-spec-exam__header">
        <h3 class="emr-spec-exam__title" [id]="headingId() ?? 'emr-spec-exam-title'">
          {{ model().title ?? 'Multi-Specialty Structured Examination & Dosing Matrix' }}
        </h3>
        <div class="emr-spec-exam__tabs" role="tablist">
          <button type="button" class="emr-spec-exam__chip" [attr.aria-pressed]="model().activeSpecialty === 'ophthalmology'" (click)="intent.emit({ type: 'specialtyChanged', specialty: 'ophthalmology' })">Ophthalmology</button>
          <button type="button" class="emr-spec-exam__chip" [attr.aria-pressed]="model().activeSpecialty === 'pediatrics'" (click)="intent.emit({ type: 'specialtyChanged', specialty: 'pediatrics' })">Pediatrics</button>
          <button type="button" class="emr-spec-exam__chip" [attr.aria-pressed]="model().activeSpecialty === 'dermatology'" (click)="intent.emit({ type: 'specialtyChanged', specialty: 'dermatology' })">Dermatology</button>
          <button type="button" class="emr-spec-exam__chip" [attr.aria-pressed]="model().activeSpecialty === 'oncology'" (click)="intent.emit({ type: 'specialtyChanged', specialty: 'oncology' })">Oncology</button>
        </div>
      </header>

      <div class="emr-spec-exam__body">
        @if (model().activeSpecialty === 'ophthalmology') {
          <div class="emr-spec-exam__actions">
            <button type="button" class="emr-spec-exam__chip" (click)="intent.emit({ type: 'ophthalmicApplyWnlAll' })">All WNL (OU)</button>
            <button type="button" class="emr-spec-exam__chip" (click)="intent.emit({ type: 'ophthalmicCopyOdToOs' })">Copy OD to OS</button>
          </div>
          <table class="emr-spec-exam__table">
            <thead>
              <tr>
                <th scope="col">Structure</th>
                <th scope="col">Right Eye (OD)</th>
                <th scope="col">Left Eye (OS)</th>
              </tr>
            </thead>
            <tbody>
              @for (row of model().ophthalmicRows; track row.id) {
                <tr>
                  <td><strong>{{ row.structureLabel }}</strong></td>
                  <td>{{ row.odValue }}</td>
                  <td>{{ row.osValue }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else if (model().activeSpecialty === 'pediatrics') {
          <p class="emr-spec-exam__summary">
            Weight: {{ model().pediatrics.weightKg }} kg · {{ model().pediatrics.targetDrugLabel }} = {{ model().pediatrics.calculatedMgPerDose }} mg ({{ model().pediatrics.calculatedMlPerDose }} mL)
          </p>
        } @else if (model().activeSpecialty === 'dermatology') {
          <p class="emr-spec-exam__summary">
            Affected BSA: {{ model().dermatology.totalBsaPercent }}% · Dose: {{ model().dermatology.totalFtuPerApp }} FTU ({{ model().dermatology.totalGramsFor14DaysBd }} g / 14d BD)
          </p>
        } @else {
          <div class="emr-spec-exam__actions">
            <span>{{ model().oncology.regimenName }} · Cycle {{ model().oncology.cycleNumber }} · BSA {{ model().oncology.bsaM2 }} m²</span>
            <emr-badge [tone]="model().oncology.safetyGatePassed ? 'success' : 'danger'">
              {{ model().oncology.safetyGatePassed ? 'Gate Passed' : 'Hold Chemo' }}
            </emr-badge>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-spec-exam { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; }
    .emr-spec-exam__header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); }
    .emr-spec-exam__title { margin: 0; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-spec-exam__tabs, .emr-spec-exam__actions { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .emr-spec-exam__body { padding: 12px; display: grid; gap: 8px; }
    .emr-spec-exam__chip { padding: 4px 10px; min-height: var(--emr-compact-height); border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font-size: var(--emr-text-xs); cursor: pointer; }
    .emr-spec-exam__table { width: 100%; border-collapse: collapse; font-size: var(--emr-text-xs); }
    .emr-spec-exam__table th, .emr-spec-exam__table td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--emr-border); }
    .emr-spec-exam__summary { margin: 0; font-family: var(--emr-font-mono); font-size: var(--emr-text-sm); }
  `],
})
export class EmrSpecialtyExamMatrixComponent {
  readonly model = input.required<SpecialtyExamMatrixViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<SpecialtyExamMatrixIntent>();
}

/**
 * L4. Inpatient Electronic Medication Administration Record (`emr-inpatient-mar`).
 */
@Component({
  selector: 'emr-inpatient-mar',
  standalone: true,
  imports: [EmrBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="emr-mar" [attr.aria-labelledby]="headingId() ?? 'emr-mar-title'">
      <header class="emr-mar__header">
        <div>
          <h3 class="emr-mar__title" [id]="headingId() ?? 'emr-mar-title'">
            {{ model().title ?? 'Inpatient Electronic Medication Administration Record (eMAR)' }}
          </h3>
          <p class="emr-mar__sub">{{ model().wardBedLabel }} · {{ model().shiftLabel }} · Nurse: {{ model().nurseLabel }}</p>
        </div>
        <emr-badge tone="info">BCMA Ready</emr-badge>
      </header>

      <div class="emr-mar__scroll">
        <table class="emr-mar__table">
          <thead>
            <tr>
              <th scope="col">Ordered Medication (API Form &amp; Route)</th>
              @for (col of model().timeColumns; track col.id) {
                <th scope="col">{{ col.timeLabel }} ({{ col.slotLabel }})</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (ord of model().orders; track ord.id) {
              <tr>
                <td>
                  <strong>{{ ord.drugName }} {{ ord.strength }}</strong>
                  <div class="emr-mar__meta">API Form: {{ ord.formLabel }} · {{ ord.doseLabel }} · {{ ord.frequencyCode }} · {{ ord.routeLabel }}</div>
                </td>
                @for (col of model().timeColumns; track col.id) {
                  <td>
                    <button
                      type="button"
                      class="emr-mar__slot-btn"
                      [disabled]="!!model().readOnly"
                      (click)="intent.emit({ type: 'slotStatusCycled', orderId: ord.id, slotId: col.id })"
                    >
                      {{ slotStatusLabel(ord.id, col.id) }}
                    </button>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-mar { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; }
    .emr-mar__header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); }
    .emr-mar__title { margin: 0; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-mar__sub { margin: 2px 0 0; font-size: var(--emr-text-xs); color: var(--emr-text-muted); font-family: var(--emr-font-mono); }
    .emr-mar__scroll { overflow-x: auto; }
    .emr-mar__table { width: 100%; border-collapse: collapse; font-size: var(--emr-text-xs); }
    .emr-mar__table th, .emr-mar__table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--emr-border); }
    .emr-mar__meta { font-family: var(--emr-font-mono); font-size: var(--emr-text-2xs); color: var(--emr-text-muted); }
    .emr-mar__slot-btn { padding: 4px 8px; min-height: var(--emr-compact-height); border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface-soft); color: var(--emr-text); font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); cursor: pointer; }
  `],
})
export class EmrInpatientMarComponent {
  readonly model = input.required<InpatientMarViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<InpatientMarIntent>();

  slotStatusLabel(orderId: string, slotId: string): string {
    const ord = this.model().orders.find((o) => o.id === orderId);
    const adm = ord?.administrations.find((a) => a.slotId === slotId);
    return adm?.status ? adm.status.toUpperCase() : '—';
  }
}

/**
 * L4. Print-ready OPD Prescription & IPD Discharge Summary surface (`emr-encounter-summary-print`).
 */
@Component({
  selector: 'emr-encounter-summary-print',
  standalone: true,
  imports: [EmrButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="emr-print-doc" [attr.aria-labelledby]="headingId() ?? 'emr-print-doc-title'">
      <header class="emr-print-doc__toolbar">
        <div class="emr-print-doc__modes">
          <button
            type="button"
            class="emr-print-doc__chip"
            [attr.aria-pressed]="model().documentMode === 'opd-rx'"
            (click)="intent.emit({ type: 'documentModeChanged', mode: 'opd-rx' })"
          >OPD Prescription</button>
          <button
            type="button"
            class="emr-print-doc__chip"
            [attr.aria-pressed]="model().documentMode === 'ipd-discharge'"
            (click)="intent.emit({ type: 'documentModeChanged', mode: 'ipd-discharge' })"
          >IPD Discharge Summary</button>
        </div>
        <emr-button (clicked)="intent.emit({ type: 'printTriggered' })">Print (.emr-print)</emr-button>
      </header>

      <div class="emr-print-doc__sheet">
        <h3 class="emr-print-doc__title" [id]="headingId() ?? 'emr-print-doc-title'">
          {{ model().facilityName }} — {{ model().facilityDepartment }}
        </h3>
        <p class="emr-print-doc__meta">
          Patient: {{ model().patientName }} ({{ model().patientAgeSex }}) · Encounter: {{ model().encounterId }} · {{ model().encounterDateLabel }}
        </p>

        <table class="emr-print-doc__table">
          <thead>
            <tr>
              <th scope="col">Drug &amp; API Form</th>
              <th scope="col">Dose</th>
              <th scope="col">Frequency</th>
              <th scope="col">Route/Site</th>
              <th scope="col">Duration &amp; Dispense</th>
              <th scope="col">Instructions</th>
            </tr>
          </thead>
          <tbody>
            @for (rx of model().prescriptions; track rx.id) {
              <tr>
                <td><strong>{{ rx.drugName }} {{ rx.strength }}</strong> ({{ rx.formLabel }})</td>
                <td>{{ rx.doseQtyUnit }}</td>
                <td>{{ rx.frequencyPattern }}</td>
                <td>{{ rx.routeSite }}</td>
                <td>{{ rx.durationLabel }} {{ rx.dispenseTotalLabel ?? '' }}</td>
                <td>{{ rx.instructions }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-print-doc { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; }
    .emr-print-doc__toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); }
    .emr-print-doc__modes { display: flex; gap: 6px; }
    .emr-print-doc__chip { padding: 4px 10px; min-height: var(--emr-compact-height); border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font-size: var(--emr-text-xs); cursor: pointer; }
    .emr-print-doc__sheet { padding: 14px; display: grid; gap: 10px; }
    .emr-print-doc__title { margin: 0; font-size: var(--emr-text-lg); font-weight: var(--emr-weight-bold); }
    .emr-print-doc__meta { margin: 0; font-size: var(--emr-text-xs); color: var(--emr-text-muted); font-family: var(--emr-font-mono); }
    .emr-print-doc__table { width: 100%; border-collapse: collapse; font-size: var(--emr-text-xs); }
    .emr-print-doc__table th, .emr-print-doc__table td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--emr-border); }
  `],
})
export class EmrEncounterSummaryPrintComponent {
  readonly model = input.required<EncounterSummaryPrintViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<EncounterSummaryPrintIntent>();
}
