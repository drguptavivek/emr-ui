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
    <section class="emr-pacs" [attr.aria-label]="headingId() ? null : (model().title ?? 'Multi-Viewport PACS & Diagnostic Imaging Viewer')" [attr.aria-labelledby]="headingId() ?? null">
      <header class="emr-pacs__header">
        <h3 class="emr-pacs__title" [attr.id]="headingId() ?? null">
          {{ model().title ?? 'Multi-Viewport PACS & Diagnostic Imaging Viewer' }}
        </h3>
        <div class="emr-pacs__controls" role="group" aria-label="Viewport layout modes">
          <button
            type="button"
            class="emr-pacs__chip"
            [attr.aria-pressed]="model().layoutMode === '1-up'"
            [disabled]="!!model().readOnly"
            (click)="emitIntent({ type: 'layoutModeChanged', layoutMode: '1-up' })"
          >1-Up Single</button>
          <button
            type="button"
            class="emr-pacs__chip"
            [attr.aria-pressed]="model().layoutMode === '2-up-od-os'"
            [disabled]="!!model().readOnly"
            (click)="emitIntent({ type: 'layoutModeChanged', layoutMode: '2-up-od-os' })"
          >2-Up OD vs OS</button>
          <button
            type="button"
            class="emr-pacs__chip"
            [attr.aria-pressed]="model().layoutMode === '2-up-compare'"
            [disabled]="!!model().readOnly"
            (click)="emitIntent({ type: 'layoutModeChanged', layoutMode: '2-up-compare' })"
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
              [disabled]="!!model().readOnly"
              (click)="emitIntent({ type: 'studySelected', studyId: st.id })"
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
              @if (st.renderedFrameUrl) {
                <img class="emr-pacs__frame" [src]="st.renderedFrameUrl" [alt]="st.title + ' current image'" />
              } @else {
                <p class="emr-pacs__unavailable">Image unavailable for this study.</p>
              }
              <div class="emr-pacs__controls">
                <button type="button" class="emr-pacs__chip" [disabled]="!!model().readOnly" (click)="emitIntent({ type: 'sliceStepped', studyId: st.id, delta: -1 })">− Slice</button>
                <button type="button" class="emr-pacs__chip" [disabled]="!!model().readOnly" (click)="emitIntent({ type: 'sliceStepped', studyId: st.id, delta: 1 })">+ Slice</button>
                <button type="button" class="emr-pacs__chip" [disabled]="!!model().readOnly" (click)="emitIntent({ type: 'invertToggled', studyId: st.id })">Invert LUT</button>
                <button type="button" class="emr-pacs__chip" [disabled]="!!model().readOnly" (click)="emitIntent({ type: 'impressionPulledToNote', studyId: st.id, text: st.radiologistImpression })">Pull Impression</button>
              </div>
            </div>
          }
        }
        @if (model().layoutMode !== '1-up' && model().compareStudyId && model().compareStudyId !== model().activeStudyId) {
          @for (st of model().studies; track st.id) {
            @if (st.id === model().compareStudyId) {
              <div class="emr-pacs__viewport">
                <div class="emr-pacs__hud"><span>Compare · [{{ st.modality }}] {{ st.title }}</span><span>Slice {{ st.currentSlice }}/{{ st.sliceCount }} · {{ st.windowPreset }} · {{ st.zoomPercent }}%</span></div>
                @if (st.renderedFrameUrl) {
                  <img class="emr-pacs__frame" [src]="st.renderedFrameUrl" [alt]="st.title + ' comparison image'" />
                } @else {
                  <p class="emr-pacs__unavailable">Comparison image unavailable for this study.</p>
                }
              </div>
            }
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
    .emr-pacs__chip { padding: 4px 10px; min-height: var(--emr-control-height); border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font-size: var(--emr-text-xs); cursor: pointer; }
    .emr-pacs__chip[aria-pressed="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary-contrast); }
    .emr-pacs__viewport { padding: 12px; border-radius: 8px; border: 1px solid var(--emr-border); background: var(--emr-surface-raised); display: grid; gap: 6px; }
    .emr-pacs__hud { display: flex; justify-content: space-between; font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); }
    .emr-pacs__caliper { margin: 0; font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); color: var(--emr-warning); font-weight: var(--emr-weight-bold); }
    .emr-pacs__impression { margin: 0; font-size: var(--emr-text-sm); }
    .emr-pacs__frame { display: block; max-width: 100%; max-height: 60vh; object-fit: contain; margin: auto; }
    .emr-pacs__unavailable { margin: 12px 0; color: var(--emr-text-muted); text-align: center; }
  `],
})
export class EmrPacsViewerComponent {
  readonly model = input.required<PacsViewerViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<PacsViewerIntent>();

  protected emitIntent(value: PacsViewerIntent): void {
    if (this.model().readOnly) return;
    this.intent.emit(value);
  }
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
    <section class="emr-spec-exam" [attr.aria-label]="headingId() ? null : (model().title ?? 'Multi-Specialty Structured Examination & Dosing Matrix')" [attr.aria-labelledby]="headingId() ?? null">
      <header class="emr-spec-exam__header">
        <h3 class="emr-spec-exam__title" [attr.id]="headingId() ?? null">
          {{ model().title ?? 'Multi-Specialty Structured Examination & Dosing Matrix' }}
        </h3>
        <div class="emr-spec-exam__tabs" role="group" aria-label="Clinical specialties">
          <button type="button" class="emr-spec-exam__chip" [attr.aria-pressed]="model().activeSpecialty === 'ophthalmology'" (click)="intent.emit({ type: 'specialtyChanged', specialty: 'ophthalmology' })">Ophthalmology</button>
          <button type="button" class="emr-spec-exam__chip" [attr.aria-pressed]="model().activeSpecialty === 'pediatrics'" (click)="intent.emit({ type: 'specialtyChanged', specialty: 'pediatrics' })">Pediatrics</button>
          <button type="button" class="emr-spec-exam__chip" [attr.aria-pressed]="model().activeSpecialty === 'dermatology'" (click)="intent.emit({ type: 'specialtyChanged', specialty: 'dermatology' })">Dermatology</button>
          <button type="button" class="emr-spec-exam__chip" [attr.aria-pressed]="model().activeSpecialty === 'oncology'" (click)="intent.emit({ type: 'specialtyChanged', specialty: 'oncology' })">Oncology</button>
        </div>
      </header>

      <div class="emr-spec-exam__body">
        @if (model().activeSpecialty === 'ophthalmology') {
          <div class="emr-spec-exam__actions">
            <button type="button" class="emr-spec-exam__chip" [disabled]="!!model().readOnly" (click)="applyOphthalmicAction('ophthalmicApplyWnlAll')">All WNL (OU)</button>
            <button type="button" class="emr-spec-exam__chip" [disabled]="!!model().readOnly" (click)="applyOphthalmicAction('ophthalmicCopyOdToOs')">Copy OD to OS</button>
          </div>
          <table class="emr-spec-exam__table" aria-label="Slit lamp, tonometry and fundus findings">
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
                  <th scope="row">{{ row.structureLabel }}</th>
                  @for (eye of eyes; track eye.id) {
                    <td>
                      @if (model().readOnly) {
                        {{ row[eye.valueKey] }}
                      } @else {
                        <input class="emr-spec-exam__input" type="text"
                          [value]="row[eye.valueKey]"
                          [attr.aria-label]="row.structureLabel + ', ' + eye.label"
                          (input)="ophthalmicCellChanged(row.id, eye.id, $event)"
                          (blur)="restoreFinding(row.id, eye.valueKey, $event)" />
                      }
                      @for (chip of row.quickChips; track chip) {
                        <button type="button" class="emr-spec-exam__chip" [disabled]="!!model().readOnly" (click)="setFinding(row.id, eye.id, chip)">{{ chip }}</button>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        } @else if (model().activeSpecialty === 'pediatrics') {
          <p class="emr-spec-exam__summary">Weight: {{ model().pediatrics.weightKg }} kg ({{ model().pediatrics.weightCentileLabel }}) · Height: {{ model().pediatrics.heightCm }} cm ({{ model().pediatrics.heightCentileLabel }})@if (model().pediatrics.bsaM2) { · BSA: {{ model().pediatrics.bsaM2 }} m² }</p>
          <div class="emr-spec-exam__actions">
            <button type="button" class="emr-spec-exam__chip" [disabled]="!canStepWeight(-1)" (click)="stepWeight(-1)">− 1 kg</button>
            <button type="button" class="emr-spec-exam__chip" [disabled]="!canStepWeight(1)" (click)="stepWeight(1)">+ 1 kg</button>
          </div>
          <p class="emr-spec-exam__summary">{{ model().pediatrics.targetDrugLabel }} ({{ model().pediatrics.concentrationMgPer5Ml }} mg / 5 mL) · {{ model().pediatrics.mgPerKgPerDose }} mg/kg/dose · {{ model().pediatrics.calculatedMgPerDose }} mg ({{ model().pediatrics.calculatedMlPerDose }} mL) · {{ model().pediatrics.maxDailyMgLabel }}</p>
        } @else if (model().activeSpecialty === 'dermatology') {
          <p>Morphology: {{ model().dermatology.morphologyLabel }}</p>
          <div class="emr-spec-exam__actions">
            @for (region of model().dermatology.regions; track region.id) {
              <button type="button" class="emr-spec-exam__chip" [disabled]="!!model().readOnly" [attr.aria-pressed]="region.active" (click)="toggleRegion(region.id)">{{ region.regionLabel }} ({{ region.bsaPercent }}% BSA · {{ region.ftuPerDose }} FTU)</button>
            }
          </div>
          <p class="emr-spec-exam__summary">Affected BSA: {{ model().dermatology.totalBsaPercent }}% · Single application: {{ model().dermatology.totalFtuPerApp }} FTU @if (model().dermatology.totalGramsPerApp != null) { ({{ model().dermatology.totalGramsPerApp }} g) } · 14d BD: {{ model().dermatology.totalGramsFor14DaysBd }} g</p>
        } @else {
          <div class="emr-spec-exam__actions">
            <span>{{ model().oncology.regimenName }} · Cycle {{ model().oncology.cycleNumber }} ({{ model().oncology.cycleDayLabel }}) · BSA {{ model().oncology.bsaM2 }} m² · ECOG {{ model().oncology.ecogScore }} · ANC {{ model().oncology.ancCountLabel }} · Platelets {{ model().oncology.plateletCountLabel }}</span>
            @if (model().oncology.safetyGateBadge; as badge) { <emr-badge [tone]="badge.tone">{{ badge.label }}</emr-badge> }
          </div>
          <div class="emr-spec-exam__actions">Dose level:
            @for (percent of doseLevels; track percent) {
              <button type="button" class="emr-spec-exam__chip" [disabled]="!!model().readOnly" [attr.aria-pressed]="model().oncology.doseReductionPercent === percent" (click)="setDoseLevel(percent)">{{ percent }}%</button>
            }
          </div>
          @for (agent of model().oncology.agents; track agent.id) {
            <p class="emr-spec-exam__summary">{{ agent.drugName }} · {{ agent.standardMgPerM2 }} mg/m² · {{ agent.routeLabel }} · {{ agent.calculatedDoseMg }} mg</p>
          }
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
    .emr-spec-exam__chip { padding: 4px 10px; min-height: var(--emr-control-height); border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font-size: var(--emr-text-xs); cursor: pointer; }
    .emr-spec-exam__table { width: 100%; border-collapse: collapse; font-size: var(--emr-text-xs); }
    .emr-spec-exam__table th, .emr-spec-exam__table td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--emr-border); }
    .emr-spec-exam__input { box-sizing: border-box; width: 100%; min-height: 44px; padding: 4px 8px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font: inherit; }
    .emr-spec-exam__summary { margin: 0; font-family: var(--emr-font-mono); font-size: var(--emr-text-sm); }
  `],
})
export class EmrSpecialtyExamMatrixComponent {
  readonly model = input.required<SpecialtyExamMatrixViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<SpecialtyExamMatrixIntent>();

  protected readonly eyes = [
    { id: 'od', label: 'Right eye (OD)', valueKey: 'odValue' },
    { id: 'os', label: 'Left eye (OS)', valueKey: 'osValue' },
  ] as const;

  protected readonly doseLevels = [100, 80, 75, 50] as const;

  protected canStepWeight(delta: number): boolean {
    const model = this.model();
    const weight = model.pediatrics.weightKg + delta;
    return !model.readOnly && model.activeSpecialty === 'pediatrics' && Number.isFinite(weight) && weight > 0;
  }

  protected stepWeight(delta: number): void {
    if (this.canStepWeight(delta)) this.intent.emit({ type: 'pediatricWeightChanged', weightKg: this.model().pediatrics.weightKg + delta });
  }

  protected toggleRegion(regionId: string): void {
    const model = this.model();
    if (!model.readOnly && model.activeSpecialty === 'dermatology' && model.dermatology.regions.some((region) => region.id === regionId)) this.intent.emit({ type: 'dermRegionToggled', regionId });
  }

  protected setDoseLevel(percent: 100 | 80 | 75 | 50): void {
    const model = this.model();
    if (!model.readOnly && model.activeSpecialty === 'oncology' && this.doseLevels.some((level) => level === percent)) this.intent.emit({ type: 'oncologyDoseReductionChanged', percent });
  }

  protected setFinding(rowId: string, eye: 'od' | 'os', value: string): void {
    const model = this.model();
    if (!model.readOnly && model.activeSpecialty === 'ophthalmology' && model.ophthalmicRows.some((row) => row.id === rowId && row.quickChips.includes(value))) this.intent.emit({ type: 'ophthalmicCellChanged', rowId, eye, value });
  }

  protected restoreFinding(rowId: string, key: 'odValue' | 'osValue', event: Event): void {
    const row = this.model().ophthalmicRows.find((item) => item.id === rowId);
    if (row) (event.target as HTMLInputElement).value = row[key];
  }

  protected ophthalmicCellChanged(rowId: string, eye: 'od' | 'os', event: Event): void {
    const model = this.model();
    if (model.readOnly || model.activeSpecialty !== 'ophthalmology') return;
    if (!model.ophthalmicRows.some((row) => row.id === rowId)) return;
    this.intent.emit({ type: 'ophthalmicCellChanged', rowId, eye, value: (event.target as HTMLInputElement).value });
  }

  protected applyOphthalmicAction(type: 'ophthalmicApplyWnlAll' | 'ophthalmicCopyOdToOs'): void {
    const model = this.model();
    if (model.readOnly || model.activeSpecialty !== 'ophthalmology') return;
    this.intent.emit({ type });
  }
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
    <section class="emr-mar" [attr.aria-label]="headingId() ? null : (model().title ?? 'Inpatient Electronic Medication Administration Record (eMAR)')" [attr.aria-labelledby]="headingId() ?? null">
      <header class="emr-mar__header">
        <div>
          <h3 class="emr-mar__title" [attr.id]="headingId() ?? null">
            {{ model().title ?? 'Inpatient Electronic Medication Administration Record (eMAR)' }}
          </h3>
          <p class="emr-mar__sub">{{ model().wardBedLabel }} · {{ model().shiftLabel }} · Nurse: {{ model().nurseLabel }}</p>
        </div>
      </header>

      <div class="emr-mar__scroll">
        <table class="emr-mar__table">
          <thead>
            <tr>
              <th scope="col">Ordered Medication (Form &amp; Route)</th>
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
                  <div class="emr-mar__meta">Form: {{ ord.formLabel }} · {{ ord.doseLabel }} · {{ ord.frequencyCode }} · {{ ord.routeLabel }}</div>
                </td>
                @for (col of model().timeColumns; track col.id) {
                  <td>
                    <button
                      type="button"
                      class="emr-mar__slot-btn"
                      [disabled]="!!model().readOnly || slotStatusLabel(ord.id, col.id) === '—' || slotStatusLabel(ord.id, col.id) === 'NOT-DUE'"
                      (click)="intent.emit({ type: 'slotStatusCycled', orderId: ord.id, slotId: col.id })"
                    >
                      {{ slotStatusLabel(ord.id, col.id) }}
                    </button>
                    @if (slotBcmaScanned(ord.id, col.id)) {
                      <emr-badge tone="success">BCMA Barcode Verified</emr-badge>
                    }
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
    .emr-mar__slot-btn { padding: 4px 8px; min-height: var(--emr-control-height); border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface-soft); color: var(--emr-text); font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); cursor: pointer; }
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

  slotBcmaScanned(orderId: string, slotId: string): boolean {
    const ord = this.model().orders.find((o) => o.id === orderId);
    const adm = ord?.administrations.find((a) => a.slotId === slotId);
    return adm?.status === 'given' && !!adm.bcmaScanned;
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
    <section class="emr-print-doc" [attr.aria-label]="headingId() ? null : (model().facilityName + ' — ' + model().facilityDepartment)" [attr.aria-labelledby]="headingId() ?? null">
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
        <h3 class="emr-print-doc__title" [attr.id]="headingId() ?? null">
          {{ model().facilityName }} — {{ model().facilityDepartment }}
        </h3>
        <p class="emr-print-doc__meta">
          Patient: {{ model().patientName }} ({{ model().patientAgeSex }}) · Encounter: {{ model().encounterId }} · {{ model().encounterDateLabel }}
        </p>

        <p>{{ model().documentMode === 'opd-rx' ? 'OPD prescription' : 'IPD discharge summary' }} · {{ model().careSettingLabel }}</p>
        <p>@for (id of model().patientIdentifiers; track $index) { <span>{{ id.label }}: {{ id.value }} </span> }</p>
        <section><h4>Allergies</h4><p>{{ model().allergiesSummary.join(', ') }}</p></section>
        <section><h4>Chronic conditions</h4><p>{{ model().chronicConditionsSummary.join(', ') }}</p></section>
        <section><h4>Vitals</h4>@for (v of model().vitalsSummary; track $index) { <p>{{ v.label }}: {{ v.value }}</p> }</section>
        <section><h4>Diagnoses</h4>@for (d of model().diagnoses; track d.id) { <p>{{ d.label }} · {{ d.code }} · {{ d.status }} {{ d.laterality }} {{ d.onsetLabel }}</p> }</section>
        <section><h4>History</h4>@for (h of model().historySummary; track $index) { <p>{{ h.code }}: {{ h.value }}</p> }</section>
        <section><h4>Examination</h4>@for (e of model().examinationSummary; track $index) { <p>{{ e.code }}: {{ e.value }}</p> }</section>
        <section><h4>Imaging findings</h4>@for (f of model().pacsKeyFindingsSummary; track $index) { <p>{{ f }}</p> }</section>
        <h4>Prescriptions</h4>
        <table class="emr-print-doc__table">
          <thead>
            <tr>
              <th scope="col">Drug &amp; Form</th>
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
                <td><strong>{{ rx.drugName }} {{ rx.strength }}</strong> ({{ rx.formLabel }}) {{ rx.formularyCode }} {{ rx.stepLabel }}</td>
                <td>{{ rx.doseQtyUnit }}</td>
                <td>{{ rx.frequencyPattern }}</td>
                <td>{{ rx.routeSite }}</td>
                <td>{{ rx.durationLabel }} {{ rx.dispenseTotalLabel ?? '' }}</td>
                <td>{{ rx.instructions }}</td>
              </tr>
            }
          </tbody>
        </table>
        <section><h4>Investigations</h4>@for (i of model().investigations; track i.id) { <p>{{ i.name }} · {{ i.code }} · {{ i.category }} · {{ i.priority }} · {{ i.status }} · {{ i.indication }}</p> }</section>
        <section><h4>Treatment advice</h4>@for (a of model().treatmentAdvises; track $index) { <p>{{ a }}</p> }</section>
        <section><h4>Cross-consultations</h4>@for (c of model().crossConsultations; track c.id) { <p>{{ c.targetSpecialty }} · {{ c.targetConsultant }} · {{ c.careSetting }} · {{ c.urgency }} · {{ c.status }} · {{ c.locationOrClinic }}<br>Reason: {{ c.reasonForConsult }}<br>Question: {{ c.clinicalQuestion }}<br>{{ c.consultantReply }}</p> }</section>
        <section><h4>Follow-up</h4><p>{{ model().followUpDateLabel }}</p></section>
        <footer>{{ model().prescriberName }} · {{ model().prescriberRegNo }} {{ model().signedAtLabel }}</footer>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-print-doc { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; }
    @media print { .emr-print-doc__toolbar { display: none; } .emr-print-doc { overflow: visible; } }
    :host-context(.emr-print) .emr-print-doc__toolbar { display: none; }
    :host-context(.emr-print) .emr-print-doc { overflow: visible; }
    .emr-print-doc__toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); }
    .emr-print-doc__modes { display: flex; gap: 6px; }
    .emr-print-doc__chip { padding: 4px 10px; min-height: var(--emr-control-height); border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font-size: var(--emr-text-xs); cursor: pointer; }
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
