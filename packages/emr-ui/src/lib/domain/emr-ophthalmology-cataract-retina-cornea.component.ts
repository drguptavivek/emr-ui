import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type {
  ClinicalAssessmentStatus,
  ContactLensEyeFit,
  ContactLensModality,
  EmrContactLensPrescriptionIntent,
  EmrContactLensPrescriptionViewModel,
  EmrCornealTopographySummaryIntent,
  EmrCornealTopographySummaryViewModel,
  EmrIntravitrealCourseTrackerIntent,
  EmrIntravitrealCourseTrackerViewModel,
  EmrIolBiometryPlannerIntent,
  EmrIolBiometryPlannerViewModel,
  EmrOphthalmicOperativeRecordIntent,
  EmrOphthalmicOperativeRecordViewModel,
  IntravitrealEyeCourse,
  IntravitrealVisitPoint,
  IolBiometryEyePlan,
  IolCandidateRow,
  IolFormulaId,
  TopographyEyeSummary,
  TopographyMapType,
} from '@drguptavivek/emr-controller';

// ---------------------------------------------------------------------------
// Pure helper functions (kept local so Angular SSR bundles have zero runtime
// imports from @drguptavivek/emr-controller)
// ---------------------------------------------------------------------------

export const IOL_FORMULA_OPTIONS: readonly IolFormulaId[] = [
  'Barrett Universal II',
  'Kane',
  'Haigis',
  'SRK/T',
  'Holladay 2',
  'Evo 2.0',
];

export const TOPOGRAPHY_MAP_OPTIONS: readonly {
  readonly id: TopographyMapType;
  readonly label: string;
}[] = [
  { id: 'axial-curvature', label: 'Axial / Sagittal Curvature' },
  { id: 'pachymetry', label: 'Corneal Pachymetry' },
  { id: 'anterior-elevation', label: 'Anterior Elevation' },
  { id: 'posterior-elevation', label: 'Posterior Elevation' },
];

export const ECTASIA_RISK_OPTIONS: readonly {
  readonly id: TopographyEyeSummary['ectasiaRisk'];
  readonly label: string;
}[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'borderline', label: 'Borderline' },
  { id: 'ectasia-suspect', label: 'Ectasia Suspect' },
];

export const POSTERIOR_CAPSULE_OPTIONS: readonly EmrOphthalmicOperativeRecordViewModel['posteriorCapsuleStatus'][] =
  ['Intact', 'PCR without Vitreous Loss', 'PCR with Anterior Vitrectomy'];

export const PUSH_UP_TEST_OPTIONS: readonly ContactLensEyeFit['pushUpTest'][] = [
  'Smooth / Adequate',
  'Tight /Steep',
  'Loose / Flat',
];

export const CONTACT_LENS_MODALITY_OPTIONS: readonly ContactLensModality[] = [
  'Soft Spherical',
  'Soft Toric',
  'Soft Multifocal',
  'RGP Corneal',
  'Scleral Vaulting',
  'Hybrid',
];

export const ASSESSMENT_STATUS_OPTIONS: readonly {
  readonly value: ClinicalAssessmentStatus;
  readonly label: string;
}[] = [
  { value: 'recorded', label: 'Recorded' },
  { value: 'not-assessed', label: 'Not assessed' },
  { value: 'unable-to-assess', label: 'Unable to assess' },
  { value: 'not-applicable', label: 'Not applicable' },
  { value: 'declined', label: 'Declined' },
  { value: 'unknown', label: 'Unknown' },
];

export function evaluateBiometryInterOcularDelta(
  odAlMm: number,
  osAlMm: number,
): { diffMm: number; warning?: string } {
  const diffMm = Math.round(Math.abs(odAlMm - osAlMm) * 100) / 100;
  if (diffMm >= 0.3) {
    return {
      diffMm,
      warning: `Inter-ocular axial length difference is ${diffMm.toFixed(2)} mm (>= 0.30 mm) — repeat optical biometry verification recommended.`,
    };
  }
  return { diffMm };
}

export function computeIntravitrealCstDelta(
  baselineCstUm: number,
  latestCstUm: number,
): { deltaUm: number; pctChange: number } {
  const deltaUm = Math.round((latestCstUm - baselineCstUm) * 100) / 100;
  const pctChange =
    baselineCstUm > 0
      ? Math.round(((latestCstUm - baselineCstUm) / baselineCstUm) * 1000) / 10
      : 0;
  return { deltaUm, pctChange };
}

export function classifyEctasiaScreening(
  kMaxD: number,
  thinnestUm: number,
  badD?: number,
): 'normal' | 'borderline' | 'ectasia-suspect' {
  if (kMaxD >= 48.0 || thinnestUm < 470 || (badD !== undefined && badD >= 2.6)) {
    return 'ectasia-suspect';
  }
  if (kMaxD >= 47.2 || thinnestUm < 490 || (badD !== undefined && badD >= 1.6)) {
    return 'borderline';
  }
  return 'normal';
}

const SHARED_OPHTH_STYLES = `
  :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
  .emr-oph-card { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; display: grid; gap: 14px; padding: 16px; }
  .emr-oph-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 10px; border-bottom: 1px solid var(--emr-border); padding-bottom: 12px; }
  .emr-oph-title-wrap { display: grid; gap: 4px; }
  .emr-oph-tag { display: inline-block; width: fit-content; padding: 2px 8px; border-radius: 6px; background: var(--emr-primary-soft); color: var(--emr-primary); font-family: var(--emr-font-mono); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); letter-spacing: 0.05em; }
  .emr-oph-title { margin: 0; font-size: var(--emr-text-lg); font-weight: var(--emr-weight-bold); }
  .emr-oph-sub { margin: 0; font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
  .emr-oph-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .emr-oph-eye { border: 1px solid var(--emr-border); border-radius: 10px; background: var(--emr-surface-raised); padding: 12px; display: grid; gap: 10px; min-width: 0; }
  .emr-oph-eye-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
  .emr-oph-eye-pill { display: inline-flex; align-items: center; gap: 6px; font-weight: var(--emr-weight-bold); font-size: var(--emr-text-sm); }
  .emr-oph-side { padding: 2px 8px; border-radius: 6px; background: var(--emr-primary); color: var(--emr-surface); font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); }
  .emr-oph-badge { padding: 2px 8px; border-radius: 999px; border: 1px solid var(--emr-border); background: var(--emr-surface-soft); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
  .emr-oph-badge[data-tone="warning"] { background: var(--emr-warning-soft); color: var(--emr-warning); border-color: var(--emr-warning); }
  .emr-oph-badge[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); border-color: var(--emr-danger); }
  .emr-oph-badge[data-tone="success"] { background: var(--emr-success-soft); color: var(--emr-success); border-color: var(--emr-success); }
  .emr-oph-badge[data-tone="info"] { background: var(--emr-info-soft); color: var(--emr-info); border-color: var(--emr-info); }
  .emr-oph-kv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; margin: 0; }
  .emr-oph-kv { padding: 6px 8px; border-radius: 8px; border: 1px solid var(--emr-border); background: var(--emr-surface); }
  .emr-oph-kv dt { font-size: var(--emr-text-2xs); color: var(--emr-text-muted); text-transform: uppercase; font-weight: var(--emr-weight-bold); }
  .emr-oph-kv dd { margin: 2px 0 0; font-family: var(--emr-font-mono); font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); }
  .emr-oph-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .emr-oph-chip { min-height: var(--emr-compact-height); padding: 4px 10px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); cursor: pointer; }
  .emr-oph-chip[aria-pressed="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary); }
  .emr-oph-chip:disabled { opacity: 0.6; cursor: not-allowed; }
  .emr-oph-table-wrap { overflow-x: auto; border: 1px solid var(--emr-border); border-radius: 8px; background: var(--emr-surface); }
  .emr-oph-table { width: 100%; border-collapse: collapse; font-size: var(--emr-text-xs); }
  .emr-oph-table th, .emr-oph-table td { padding: 6px 8px; border-bottom: 1px solid var(--emr-border); text-align: left; }
  .emr-oph-table thead th { background: var(--emr-surface-soft); color: var(--emr-text-muted); font-weight: var(--emr-weight-bold); text-transform: uppercase; font-size: var(--emr-text-2xs); }
  .emr-oph-table tr[data-selected="true"] { background: var(--emr-primary-soft); }
  .emr-oph-alert { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--emr-warning); background: var(--emr-warning-soft); color: var(--emr-text); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-medium); }
  .emr-oph-input { min-height: var(--emr-compact-height); padding: 4px 8px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); }
  .emr-oph-field-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .emr-oph-label { display: flex; flex-direction: column; gap: 3px; font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); color: var(--emr-text-muted); }
  @media (max-width: 760px) { .emr-oph-grid-2 { grid-template-columns: minmax(0, 1fr); } }
  :host-context(.emr-print) .emr-oph-chip { border-color: var(--emr-border); }
`;

// ===========================================================================
// 1. EmrIolBiometryPlannerComponent (`emr-iol-biometry-planner`)
// ===========================================================================

@Component({
  selector: 'emr-iol-biometry-planner',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let delta = interOcularDelta();
    <section
      class="emr-oph-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'Optical Biometry & Toric IOL Planner')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-oph-head">
        <div class="emr-oph-title-wrap">
          <span class="emr-oph-tag">OPTICAL BIOMETRY &amp; TORIC IOL PLANNER</span>
          <h3 class="emr-oph-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? 'Optical Biometry & Toric IOL Power Calculation' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-oph-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-oph-chips">
          <span class="emr-oph-badge" [attr.data-tone]="delta.warning || m.interOcularWarning ? 'warning' : 'info'">
            Inter-Ocular ΔAL: {{ (m.interOcularAlDiffMm ?? delta.diffMm).toFixed(2) }} mm
          </span>
        </div>
      </header>

      @if (m.interOcularWarning || delta.warning) {
        <div class="emr-oph-alert" role="alert">
          {{ m.interOcularWarning ?? delta.warning }}
        </div>
      }

      <div class="emr-oph-grid-2">
        @for (eye of eyes(); track eye.eye) {
          <article class="emr-oph-eye" [attr.aria-label]="'Biometry plan ' + eye.eye">
            <header class="emr-oph-eye-head">
              <div class="emr-oph-eye-pill">
                <span class="emr-oph-side">{{ eye.eye }}</span>
                <span>{{ eye.lensModelLabel }} (A = {{ eye.aConstant }})</span>
              </div>
              <div class="emr-oph-chips">
                @if (eye.deviceLabel) {
                  <span class="emr-oph-badge">{{ eye.deviceLabel }}</span>
                }
                @if (eye.badge) {
                  <span class="emr-oph-badge" [attr.data-tone]="eye.badge.tone">{{ eye.badge.label }}</span>
                }
              </div>
            </header>

            <dl class="emr-oph-kv-grid">
              <div class="emr-oph-kv"><dt>Axial Length</dt><dd>{{ eye.axialLengthMm.toFixed(2) }} mm</dd></div>
              <div class="emr-oph-kv"><dt>ACD</dt><dd>{{ eye.acdMm.toFixed(2) }} mm</dd></div>
              @if (eye.lensThicknessMm !== undefined) {
                <div class="emr-oph-kv"><dt>Lens Thickness</dt><dd>{{ eye.lensThicknessMm.toFixed(2) }} mm</dd></div>
              }
              @if (eye.wtwMm !== undefined) {
                <div class="emr-oph-kv"><dt>WTW</dt><dd>{{ eye.wtwMm.toFixed(2) }} mm</dd></div>
              }
              @if (eye.cctUm !== undefined) {
                <div class="emr-oph-kv"><dt>CCT</dt><dd>{{ eye.cctUm }} µm</dd></div>
              }
              <div class="emr-oph-kv"><dt>K1 (Flat)</dt><dd>{{ eye.k1Diopters.toFixed(2) }} D @ {{ eye.k1AxisDeg }}°</dd></div>
              <div class="emr-oph-kv"><dt>K2 (Steep)</dt><dd>{{ eye.k2Diopters.toFixed(2) }} D @ {{ eye.k2AxisDeg }}°</dd></div>
              <div class="emr-oph-kv"><dt>Corneal ΔK</dt><dd>{{ eye.cornealDeltaKD }}</dd></div>
              @if (eye.siaDiopters !== undefined) {
                <div class="emr-oph-kv"><dt>Surgeon SIA</dt><dd>{{ eye.siaDiopters.toFixed(2) }} D</dd></div>
              }
            </dl>

            <div class="emr-oph-field-row">
              <label class="emr-oph-label">
                Target Rx ({{ eye.eye }})
                <input
                  type="text"
                  class="emr-oph-input"
                  [attr.aria-label]="'Target refraction ' + eye.eye"
                  [value]="eye.targetRefractionD"
                  [disabled]="!!m.readOnly"
                  (change)="onTargetRefractionInput(eye.eye, $event)"
                />
              </label>
              <label class="emr-oph-label">
                Incision Meridian (°)
                <input
                  type="number"
                  class="emr-oph-input"
                  [attr.aria-label]="'Incision meridian ' + eye.eye"
                  [value]="eye.incisionMeridianDeg ?? 110"
                  [disabled]="!!m.readOnly"
                  (change)="onIncisionMeridianInput(eye.eye, $event)"
                />
              </label>
            </div>

            <div class="emr-oph-chips" role="group" [attr.aria-label]="'IOL formula ' + eye.eye">
              @for (formula of eye.availableFormulas; track formula) {
                <button
                  type="button"
                  class="emr-oph-chip"
                  [attr.aria-pressed]="eye.activeFormula === formula"
                  [disabled]="!!m.readOnly"
                  (click)="selectFormula(eye.eye, formula)"
                >{{ formula }}</button>
              }
            </div>

            <div class="emr-oph-table-wrap">
              <table class="emr-oph-table" [attr.aria-label]="'Candidate IOL powers ' + eye.eye">
                <thead>
                  <tr>
                    <th scope="col">IOL Power</th>
                    <th scope="col">Predicted Rx</th>
                    <th scope="col">Toric Model</th>
                    <th scope="col">Residual Astig</th>
                    <th scope="col">Axis</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of eye.candidates; track row.id) {
                    <tr [attr.data-selected]="row.isSelected ? 'true' : null">
                      <td>
                        <strong>{{ row.powerDiopters }}</strong>
                        @if (row.isEmmetropiaTarget) {
                          <span class="emr-oph-badge" data-tone="success">EMMETROPIA</span>
                        }
                      </td>
                      <td>{{ row.predictedRefractionD }}</td>
                      <td>{{ row.toricCylinderModel ?? 'Spherical' }}</td>
                      <td>{{ row.residualAstigmatismD ?? '—' }}</td>
                      <td>{{ row.recommendedAxisDeg !== undefined ? row.recommendedAxisDeg + '°' : '—' }}</td>
                      <td>
                        <button
                          type="button"
                          class="emr-oph-chip"
                          [attr.aria-pressed]="!!row.isSelected"
                          [disabled]="!!m.readOnly"
                          (click)="selectCandidate(eye.eye, row)"
                        >{{ row.isSelected ? 'Selected' : 'Select' }}</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            @if (eye.warnings?.length) {
              <ul class="emr-oph-sub">
                @for (w of eye.warnings!; track w) {
                  <li>{{ w }}</li>
                }
              </ul>
            }
          </article>
        }
      </div>
    </section>
  `,
  styles: [SHARED_OPHTH_STYLES],
})
export class EmrIolBiometryPlannerComponent {
  readonly model = input.required<EmrIolBiometryPlannerViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrIolBiometryPlannerIntent>();

  eyes(): readonly IolBiometryEyePlan[] {
    const m = this.model();
    return [m.od, m.os];
  }

  interOcularDelta(): { diffMm: number; warning?: string } {
    const m = this.model();
    return evaluateBiometryInterOcularDelta(m.od.axialLengthMm, m.os.axialLengthMm);
  }

  selectFormula(eye: 'OD' | 'OS', formula: IolFormulaId): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'formulaSelected', eye, formula });
  }

  selectCandidate(eye: 'OD' | 'OS', row: IolCandidateRow): void {
    if (this.model().readOnly) return;
    this.intent.emit({
      type: 'candidateSelected',
      eye,
      candidateId: row.id,
      powerDiopters: row.powerDiopters,
    });
  }

  onTargetRefractionInput(eye: 'OD' | 'OS', event: Event): void {
    const val = (event.target as HTMLInputElement | null)?.value ?? '';
    this.setTargetRefraction(eye, val);
  }

  setTargetRefraction(eye: 'OD' | 'OS', targetRefractionD: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'targetRefractionChanged', eye, targetRefractionD });
  }

  onIncisionMeridianInput(eye: 'OD' | 'OS', event: Event): void {
    const raw = Number((event.target as HTMLInputElement | null)?.value ?? 0);
    if (Number.isFinite(raw)) {
      this.setIncisionMeridian(eye, raw);
    }
  }

  setIncisionMeridian(eye: 'OD' | 'OS', meridianDeg: number): void {
    if (this.model().readOnly) return;
    const clamped = Math.max(0, Math.min(180, Math.round(meridianDeg)));
    this.intent.emit({ type: 'incisionMeridianChanged', eye, meridianDeg: clamped });
  }
}

// ===========================================================================
// 2. EmrIntravitrealCourseTrackerComponent (`emr-intravitreal-course-tracker`)
// ===========================================================================

@Component({
  selector: 'emr-intravitreal-course-tracker',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-oph-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'Intravitreal Anti-VEGF & Steroid Course Tracker')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-oph-head">
        <div class="emr-oph-title-wrap">
          <span class="emr-oph-tag">INTRAVITREAL THERAPY &amp; OCT CST TRACKER</span>
          <h3 class="emr-oph-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? 'Intravitreal Anti-VEGF / Steroid Longitudinal Course' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-oph-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-oph-chips" role="group" aria-label="Active eye filter">
          @for (eyeOpt of eyeTabs; track eyeOpt) {
            <button
              type="button"
              class="emr-oph-chip"
              [attr.aria-pressed]="m.activeEye === eyeOpt"
              [disabled]="!!m.readOnly"
              (click)="selectActiveEye(eyeOpt)"
            >{{ eyeOpt }}</button>
          }
        </div>
      </header>

      @for (course of visibleCourses(); track course.eye) {
        @let delta = cstDeltaFor(course);
        <article class="emr-oph-eye" [attr.aria-label]="'Intravitreal course ' + course.eye">
          <header class="emr-oph-eye-head">
            <div class="emr-oph-eye-pill">
              <span class="emr-oph-side">{{ course.eye }}</span>
              <span>{{ course.indication }} · {{ course.currentAgent }}</span>
            </div>
            <div class="emr-oph-chips">
              <span class="emr-oph-badge" data-tone="info">Regimen: {{ course.currentRegimen }}</span>
              @if (course.badge) {
                <span class="emr-oph-badge" [attr.data-tone]="course.badge.tone">{{ course.badge.label }}</span>
              }
            </div>
          </header>

          <dl class="emr-oph-kv-grid">
            <div class="emr-oph-kv"><dt>Total Injections</dt><dd>#{{ course.totalInjectionsCount }}</dd></div>
            <div class="emr-oph-kv"><dt>Current Interval</dt><dd>q{{ course.currentIntervalWeeks }}w</dd></div>
            <div class="emr-oph-kv"><dt>Baseline CST</dt><dd>{{ course.baselineCstUm }} µm</dd></div>
            <div class="emr-oph-kv"><dt>Latest CST</dt><dd>{{ course.latestCstUm }} µm</dd></div>
            <div class="emr-oph-kv">
              <dt>CST Δ vs Baseline</dt>
              <dd>{{ delta.deltaUm > 0 ? '+' : '' }}{{ delta.deltaUm }} µm ({{ delta.pctChange }}%)</dd>
            </div>
            @if (course.nextPlannedDate) {
              <div class="emr-oph-kv"><dt>Next Planned</dt><dd>{{ course.nextPlannedDate }}</dd></div>
            }
          </dl>

          <div class="emr-oph-chips" role="group" [attr.aria-label]="'Treat and extend controls ' + course.eye">
            <button
              type="button"
              class="emr-oph-chip"
              [disabled]="!!m.readOnly"
              (click)="adjustInterval(course, -2, 'inject-shorten')"
            >Shorten −2w (q{{ Math.max(4, course.currentIntervalWeeks - 2) }}w)</button>
            <button
              type="button"
              class="emr-oph-chip"
              [disabled]="!!m.readOnly"
              (click)="adjustInterval(course, 0, 'inject-maintain')"
            >Maintain (q{{ course.currentIntervalWeeks }}w)</button>
            <button
              type="button"
              class="emr-oph-chip"
              [disabled]="!!m.readOnly"
              (click)="adjustInterval(course, 2, 'inject-extend')"
            >Extend +2w (q{{ course.currentIntervalWeeks + 2 }}w)</button>
            <button
              type="button"
              class="emr-oph-chip"
              [disabled]="!!m.readOnly"
              (click)="recordInjection(course)"
            >+ Record Injection ({{ course.currentAgent }})</button>
          </div>

          <div class="emr-oph-table-wrap">
            <table class="emr-oph-table" [attr.aria-label]="'Injection visits ' + course.eye">
              <thead>
                <tr>
                  <th scope="col">Visit</th>
                  <th scope="col">Date</th>
                  <th scope="col">CST (µm)</th>
                  <th scope="col">BCVA</th>
                  <th scope="col">Fluid Flags</th>
                  <th scope="col">Agent / Lot</th>
                  <th scope="col">Decision</th>
                </tr>
              </thead>
              <tbody>
                @for (v of course.visits; track v.id) {
                  <tr [attr.data-selected]="m.selectedVisitId === v.id ? 'true' : null">
                    <td>
                      <button
                        type="button"
                        class="emr-oph-chip"
                        [attr.aria-pressed]="m.selectedVisitId === v.id"
                        (click)="selectVisit(course.eye, v.id)"
                      >#{{ v.visitNumber }}</button>
                    </td>
                    <td>{{ v.date }}</td>
                    <td><strong>{{ v.cstUm }} µm</strong></td>
                    <td>{{ v.bcvaLabel }}</td>
                    <td>
                      {{ formatFluidFlags(v) }}
                    </td>
                    <td>{{ v.agentAdministered ?? '—' }}{{ v.lotNumber ? ' (' + v.lotNumber + ')' : '' }}</td>
                    <td><span class="emr-oph-badge">{{ v.decision }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </article>
      }
    </section>
  `,
  styles: [SHARED_OPHTH_STYLES],
})
export class EmrIntravitrealCourseTrackerComponent {
  readonly model = input.required<EmrIntravitrealCourseTrackerViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrIntravitrealCourseTrackerIntent>();

  protected readonly Math = Math;
  readonly eyeTabs: readonly ('OD' | 'OS' | 'OU')[] = ['OD', 'OS', 'OU'];

  visibleCourses(): readonly IntravitrealEyeCourse[] {
    const m = this.model();
    if (m.activeEye === 'OD') return [m.od];
    if (m.activeEye === 'OS') return m.os ? [m.os] : [m.od];
    return m.os ? [m.od, m.os] : [m.od];
  }

  cstDeltaFor(course: IntravitrealEyeCourse): { deltaUm: number; pctChange: number } {
    return computeIntravitrealCstDelta(course.baselineCstUm, course.latestCstUm);
  }

  formatFluidFlags(visit: IntravitrealVisitPoint): string {
    const active: string[] = [];
    if (visit.fluidFlags.irf) active.push('IRF+');
    if (visit.fluidFlags.srf) active.push('SRF+');
    if (visit.fluidFlags.ped) active.push('PED+');
    if (visit.fluidFlags.hemorrhage) active.push('Heme+');
    return active.length > 0 ? active.join(' · ') : 'Dry Macula';
  }

  selectActiveEye(eye: 'OD' | 'OS' | 'OU'): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'activeEyeChanged', eye });
  }

  selectVisit(eye: 'OD' | 'OS', visitId: string): void {
    this.intent.emit({ type: 'visitSelected', eye, visitId });
  }

  adjustInterval(
    course: IntravitrealEyeCourse,
    deltaWeeks: number,
    decision: IntravitrealVisitPoint['decision'],
  ): void {
    if (this.model().readOnly) return;
    const nextIntervalWeeks = Math.max(4, course.currentIntervalWeeks + deltaWeeks);
    this.intent.emit({
      type: 'intervalAdjusted',
      eye: course.eye,
      nextIntervalWeeks,
      decision,
    });
  }

  recordInjection(course: IntravitrealEyeCourse): void {
    if (this.model().readOnly) return;
    this.intent.emit({
      type: 'recordInjectionRequested',
      eye: course.eye,
      agent: course.currentAgent,
    });
  }
}

// ===========================================================================
// 3. EmrCornealTopographySummaryComponent (`emr-corneal-topography-summary`)
// ===========================================================================

@Component({
  selector: 'emr-corneal-topography-summary',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-oph-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'Corneal Topography & Ectasia Summary')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-oph-head">
        <div class="emr-oph-title-wrap">
          <span class="emr-oph-tag">SCHEIMPFLUG / PLACIDO CORNEAL TOMOGRAPHY</span>
          <h3 class="emr-oph-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? 'Corneal Topography, Pachymetry & Belin/Ambrósio Ectasia Summary' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-oph-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-oph-chips" role="group" aria-label="Topography map layers">
          @for (mapOpt of mapOptions; track mapOpt.id) {
            <button
              type="button"
              class="emr-oph-chip"
              [attr.aria-pressed]="m.activeMap === mapOpt.id"
              [disabled]="!!m.readOnly"
              (click)="selectMap(mapOpt.id)"
            >{{ mapOpt.label }}</button>
          }
        </div>
      </header>

      <div class="emr-oph-grid-2">
        @for (eye of eyes(); track eye.eye) {
          @let screened = screenedRisk(eye);
          <article class="emr-oph-eye" [attr.aria-label]="'Corneal topography ' + eye.eye">
            <header class="emr-oph-eye-head">
              <div class="emr-oph-eye-pill">
                <span class="emr-oph-side">{{ eye.eye }}</span>
                <span>{{ eye.deviceLabel }} (QS: {{ eye.qualityScore }})</span>
              </div>
              <div class="emr-oph-chips">
                <span
                  class="emr-oph-badge"
                  [attr.data-tone]="eye.ectasiaRisk === 'ectasia-suspect' ? 'danger' : eye.ectasiaRisk === 'borderline' ? 'warning' : 'success'"
                >
                  Risk: {{ eye.ectasiaRisk }} (Screened: {{ screened }})
                </span>
                @if (eye.badge) {
                  <span class="emr-oph-badge" [attr.data-tone]="eye.badge.tone">{{ eye.badge.label }}</span>
                }
              </div>
            </header>

            <dl class="emr-oph-kv-grid">
              <div class="emr-oph-kv"><dt>K1 (Flat)</dt><dd>{{ eye.k1FlatD.toFixed(2) }} D @ {{ eye.k1AxisDeg }}°</dd></div>
              <div class="emr-oph-kv"><dt>K2 (Steep)</dt><dd>{{ eye.k2SteepD.toFixed(2) }} D @ {{ eye.k2AxisDeg }}°</dd></div>
              <div class="emr-oph-kv"><dt>Kmax (Steepest)</dt><dd>{{ eye.kMaxD.toFixed(2) }} D</dd></div>
              <div class="emr-oph-kv"><dt>Topo Cylinder</dt><dd>{{ eye.astigmatismD.toFixed(2) }} D</dd></div>
              <div class="emr-oph-kv"><dt>Central CCT</dt><dd>{{ eye.centralPachymetryUm }} µm</dd></div>
              <div class="emr-oph-kv"><dt>Thinnest Local</dt><dd>{{ eye.thinnestPachymetryUm }} µm</dd></div>
              @if (eye.badDIndex !== undefined) {
                <div class="emr-oph-kv"><dt>BAD-D Index</dt><dd>{{ eye.badDIndex.toFixed(2) }}</dd></div>
              }
              @if (eye.posteriorElevationApexUm !== undefined) {
                <div class="emr-oph-kv"><dt>Post. Elev Apex</dt><dd>+{{ eye.posteriorElevationApexUm }} µm</dd></div>
              }
            </dl>

            <div class="emr-oph-field-row">
              <div class="emr-oph-chips" role="group" [attr.aria-label]="'Ectasia risk classification ' + eye.eye">
                @for (riskOpt of riskOptions; track riskOpt.id) {
                  <button
                    type="button"
                    class="emr-oph-chip"
                    [attr.aria-pressed]="eye.ectasiaRisk === riskOpt.id"
                    [disabled]="!!m.readOnly"
                    (click)="setEctasiaRisk(eye.eye, riskOpt.id)"
                  >{{ riskOpt.label }}</button>
                }
              </div>

              <label class="emr-oph-label">
                Assessment Status ({{ eye.eye }})
                <select
                  class="emr-oph-input"
                  [attr.aria-label]="'Assessment status ' + eye.eye"
                  [value]="eye.assessmentStatus ?? 'recorded'"
                  [disabled]="!!m.readOnly"
                  (change)="onAssessmentStatusChange(eye.eye, $event)"
                >
                  @for (opt of statusOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </label>
            </div>

            @if (eye.summaryFindings?.length) {
              <ul class="emr-oph-sub">
                @for (f of eye.summaryFindings!; track f) {
                  <li>{{ f }}</li>
                }
              </ul>
            }
          </article>
        }
      </div>
    </section>
  `,
  styles: [SHARED_OPHTH_STYLES],
})
export class EmrCornealTopographySummaryComponent {
  readonly model = input.required<EmrCornealTopographySummaryViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrCornealTopographySummaryIntent>();

  readonly mapOptions = TOPOGRAPHY_MAP_OPTIONS;
  readonly riskOptions = ECTASIA_RISK_OPTIONS;
  readonly statusOptions = ASSESSMENT_STATUS_OPTIONS;

  eyes(): readonly TopographyEyeSummary[] {
    const m = this.model();
    return [m.od, m.os];
  }

  screenedRisk(eye: TopographyEyeSummary): TopographyEyeSummary['ectasiaRisk'] {
    return classifyEctasiaScreening(eye.kMaxD, eye.thinnestPachymetryUm, eye.badDIndex);
  }

  selectMap(mapType: TopographyMapType): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'activeMapChanged', mapType });
  }

  setEctasiaRisk(eye: 'OD' | 'OS', risk: TopographyEyeSummary['ectasiaRisk']): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'ectasiaRiskChanged', eye, risk });
  }

  onAssessmentStatusChange(eye: 'OD' | 'OS', event: Event): void {
    const raw = (event.target as HTMLSelectElement | null)?.value as ClinicalAssessmentStatus | undefined;
    this.setAssessmentStatus(eye, raw);
  }

  setAssessmentStatus(eye: 'OD' | 'OS', status: ClinicalAssessmentStatus | undefined): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'eyeAssessmentStatusChanged', eye, status });
  }
}

// ===========================================================================
// 4. EmrOphthalmicOperativeRecordComponent (`emr-ophthalmic-operative-record`)
// ===========================================================================

@Component({
  selector: 'emr-ophthalmic-operative-record',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-oph-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'Ophthalmic Operative Record')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-oph-head">
        <div class="emr-oph-title-wrap">
          <span class="emr-oph-tag">OPHTHALMIC SURGICAL OPERATIVE RECORD</span>
          <h3 class="emr-oph-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? m.procedureName }}
          </h3>
          <p class="emr-oph-sub">
            Surgeon: {{ m.surgeonName }}{{ m.assistantName ? ' · Assistant: ' + m.assistantName : '' }}
          </p>
        </div>
        <div class="emr-oph-chips">
          <span class="emr-oph-side">Operated Eye: {{ m.operatedEye }}</span>
          <button
            type="button"
            class="emr-oph-chip"
            [attr.aria-pressed]="m.timeoutVerified"
            [disabled]="!!m.readOnly"
            (click)="toggleTimeout()"
          >{{ m.timeoutVerified ? '✓ WHO Surgical Timeout Verified' : 'Verify WHO Surgical Timeout' }}</button>
        </div>
      </header>

      <div class="emr-oph-grid-2">
        <article class="emr-oph-eye" aria-label="Intraoperative Steps & Fluidics">
          <header class="emr-oph-eye-head">
            <strong>Anesthesia, Incision &amp; Phacoemulsification Metrics</strong>
          </header>
          <dl class="emr-oph-kv-grid">
            <div class="emr-oph-kv"><dt>Anesthesia</dt><dd>{{ m.anesthesiaType }}</dd></div>
            @if (m.akinesiaGrade) {
              <div class="emr-oph-kv"><dt>Akinesia</dt><dd>{{ m.akinesiaGrade }}</dd></div>
            }
            <div class="emr-oph-kv"><dt>Main Incision</dt><dd>{{ m.mainIncisionWidthMm }} mm @ {{ m.mainIncisionMeridianDeg }}°</dd></div>
            <div class="emr-oph-kv"><dt>Capsulorhexis</dt><dd>{{ m.capsulorhexisStatus }}</dd></div>
            @if (m.phacoMetrics) {
              <div class="emr-oph-kv"><dt>CDE</dt><dd>{{ m.phacoMetrics.cdeSeconds }} s</dd></div>
              <div class="emr-oph-kv"><dt>U/S Time</dt><dd>{{ m.phacoMetrics.usTimeSeconds }} s</dd></div>
              <div class="emr-oph-kv"><dt>BSS Volume</dt><dd>{{ m.phacoMetrics.bssVolumeMl }} mL</dd></div>
              <div class="emr-oph-kv"><dt>OVD Used</dt><dd>{{ m.phacoMetrics.ovdUsed }}</dd></div>
            }
          </dl>

          <div class="emr-oph-label">
            Posterior Capsule Integrity
            <div class="emr-oph-chips" role="group" aria-label="Posterior capsule status">
              @for (statusOpt of capsuleOptions; track statusOpt) {
                <button
                  type="button"
                  class="emr-oph-chip"
                  [attr.aria-pressed]="m.posteriorCapsuleStatus === statusOpt"
                  [disabled]="!!m.readOnly"
                  (click)="setPosteriorCapsuleStatus(statusOpt)"
                >{{ statusOpt }}</button>
              }
            </div>
          </div>
        </article>

        <article class="emr-oph-eye" aria-label="IOL Implant & Endophthalmitis Prophylaxis">
          <header class="emr-oph-eye-head">
            <strong>IOL Implant Registry &amp; Prophylaxis</strong>
            <span class="emr-oph-badge" data-tone="success">{{ m.iolImplant.placement }}</span>
          </header>
          <dl class="emr-oph-kv-grid">
            <div class="emr-oph-kv"><dt>IOL Model</dt><dd>{{ m.iolImplant.modelName }}</dd></div>
            <div class="emr-oph-kv"><dt>Dioptric Power</dt><dd>{{ m.iolImplant.powerDiopters }}</dd></div>
            @if (m.iolImplant.toricAlignedAxisDeg !== undefined) {
              <div class="emr-oph-kv"><dt>Aligned Axis</dt><dd>{{ m.iolImplant.toricAlignedAxisDeg }}°</dd></div>
            }
            @if (m.iolImplant.udiCode) {
              <div class="emr-oph-kv"><dt>UDI Barcode</dt><dd>{{ m.iolImplant.udiCode }}</dd></div>
            }
            <div class="emr-oph-kv"><dt>Intracameral Abx</dt><dd>{{ m.prophylaxis.intracameralAntibiotic }}</dd></div>
          </dl>

          <div class="emr-oph-field-row">
            <label class="emr-oph-label">
              IOL Serial Number
              <input
                type="text"
                class="emr-oph-input"
                aria-label="IOL Serial Number"
                [value]="m.iolImplant.serialNumber"
                [disabled]="!!m.readOnly"
                (change)="onIolSerialInput($event)"
              />
            </label>
          </div>

          <p class="emr-oph-sub"><strong>Post-Op Regimen:</strong> {{ m.postOpRegimenSummary }}</p>
          @if (m.complicationsNote) {
            <div class="emr-oph-alert">{{ m.complicationsNote }}</div>
          }

          <div class="emr-oph-field-row">
            @if (m.signedBy) {
              <span class="emr-oph-badge" data-tone="success">
                Signed by {{ m.signedBy }}{{ m.signedAt ? ' · ' + m.signedAt : '' }}
              </span>
            }
            <button
              type="button"
              class="emr-oph-chip"
              [disabled]="!!m.readOnly"
              (click)="requestSignOperativeNote()"
            >Sign Operative Note</button>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [SHARED_OPHTH_STYLES],
})
export class EmrOphthalmicOperativeRecordComponent {
  readonly model = input.required<EmrOphthalmicOperativeRecordViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrOphthalmicOperativeRecordIntent>();

  readonly capsuleOptions = POSTERIOR_CAPSULE_OPTIONS;

  toggleTimeout(): void {
    const m = this.model();
    if (m.readOnly) return;
    this.intent.emit({ type: 'timeoutToggled', verified: !m.timeoutVerified });
  }

  setPosteriorCapsuleStatus(
    status: EmrOphthalmicOperativeRecordViewModel['posteriorCapsuleStatus'],
  ): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'posteriorCapsuleStatusChanged', status });
  }

  onIolSerialInput(event: Event): void {
    const val = (event.target as HTMLInputElement | null)?.value ?? '';
    this.setIolSerial(val);
  }

  setIolSerial(serialNumber: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'iolSerialChanged', serialNumber });
  }

  requestSignOperativeNote(): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'signOperativeNoteRequested' });
  }
}

// ===========================================================================
// 5. EmrContactLensPrescriptionComponent (`emr-contact-lens-prescription`)
// ===========================================================================

@Component({
  selector: 'emr-contact-lens-prescription',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-oph-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'Contact Lens Fitting & Prescription')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-oph-head">
        <div class="emr-oph-title-wrap">
          <span class="emr-oph-tag">CONTACT LENS FITTING &amp; FINAL RX</span>
          <h3 class="emr-oph-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? 'Contact Lens Evaluation & Final Prescription' }}
          </h3>
          <p class="emr-oph-sub">
            Issued: {{ m.issueDate }} · Expires: {{ m.expiryDate }} · {{ m.replacementSchedule }} ({{ m.wearingScheduleHoursPerDay }}h/day) · Care: {{ m.careRegimenSolution }}
          </p>
        </div>
        <div class="emr-oph-chips">
          <button
            type="button"
            class="emr-oph-chip"
            [disabled]="!!m.readOnly"
            (click)="copyEye('OD', 'OS')"
          >Copy OD → OS</button>
          <button
            type="button"
            class="emr-oph-chip"
            [disabled]="!!m.readOnly"
            (click)="copyEye('OS', 'OD')"
          >Copy OS → OD</button>
          <button
            type="button"
            class="emr-oph-chip"
            [attr.aria-pressed]="m.trialFinalized"
            [disabled]="!!m.readOnly"
            (click)="toggleTrialFinalized()"
          >{{ m.trialFinalized ? '✓ Trial Finalized' : 'Finalize Trial Rx' }}</button>
        </div>
      </header>

      <div class="emr-oph-grid-2">
        @for (eyeFit of eyes(); track eyeFit.eye) {
          <article class="emr-oph-eye" [attr.aria-label]="'Contact lens fit ' + eyeFit.eye">
            <header class="emr-oph-eye-head">
              <div class="emr-oph-eye-pill">
                <span class="emr-oph-side">{{ eyeFit.eye }}</span>
                <span>{{ eyeFit.brandAndMaterial }}</span>
              </div>
              <span class="emr-oph-badge" data-tone="info">{{ eyeFit.modality }}</span>
            </header>

            <div class="emr-oph-field-row">
              <label class="emr-oph-label">
                BC (mm)
                <input
                  type="text"
                  class="emr-oph-input"
                  [attr.aria-label]="'Base curve ' + eyeFit.eye"
                  [value]="eyeFit.baseCurveMm"
                  [disabled]="!!m.readOnly"
                  (change)="onEyeParamInput(eyeFit.eye, 'baseCurveMm', $event)"
                />
              </label>
              <label class="emr-oph-label">
                DIA (mm)
                <input
                  type="text"
                  class="emr-oph-input"
                  [attr.aria-label]="'Diameter ' + eyeFit.eye"
                  [value]="eyeFit.diameterMm"
                  [disabled]="!!m.readOnly"
                  (change)="onEyeParamInput(eyeFit.eye, 'diameterMm', $event)"
                />
              </label>
              <label class="emr-oph-label">
                Sphere (D)
                <input
                  type="text"
                  class="emr-oph-input"
                  [attr.aria-label]="'Sphere ' + eyeFit.eye"
                  [value]="eyeFit.sphereD"
                  [disabled]="!!m.readOnly"
                  (change)="onEyeParamInput(eyeFit.eye, 'sphereD', $event)"
                />
              </label>
              <label class="emr-oph-label">
                Cylinder (D)
                <input
                  type="text"
                  class="emr-oph-input"
                  [attr.aria-label]="'Cylinder ' + eyeFit.eye"
                  [value]="eyeFit.cylinderD ?? ''"
                  [disabled]="!!m.readOnly"
                  (change)="onEyeParamInput(eyeFit.eye, 'cylinderD', $event)"
                />
              </label>
              <label class="emr-oph-label">
                Axis (°)
                <input
                  type="text"
                  class="emr-oph-input"
                  [attr.aria-label]="'Axis ' + eyeFit.eye"
                  [value]="eyeFit.axisDeg !== undefined ? '' + eyeFit.axisDeg : ''"
                  [disabled]="!!m.readOnly"
                  (change)="onEyeParamInput(eyeFit.eye, 'axisDeg', $event)"
                />
              </label>
            </div>

            <dl class="emr-oph-kv-grid">
              <div class="emr-oph-kv"><dt>Centration</dt><dd>{{ eyeFit.centration }}</dd></div>
              <div class="emr-oph-kv"><dt>Movement</dt><dd>{{ eyeFit.movementMm }}</dd></div>
              <div class="emr-oph-kv"><dt>VA Achieved</dt><dd>{{ eyeFit.visualAcuityAchieved }}</dd></div>
              @if (eyeFit.sagittalDepthUm !== undefined) {
                <div class="emr-oph-kv"><dt>Sagittal Depth</dt><dd>{{ eyeFit.sagittalDepthUm }} µm</dd></div>
              }
              @if (eyeFit.apicalClearanceUm !== undefined) {
                <div class="emr-oph-kv"><dt>Apical Clearance</dt><dd>{{ eyeFit.apicalClearanceUm }} µm</dd></div>
              }
              @if (eyeFit.overRefraction) {
                <div class="emr-oph-kv"><dt>Over-Refraction</dt><dd>{{ eyeFit.overRefraction }}</dd></div>
              }
            </dl>

            <div class="emr-oph-label">
              Push-Up Fit Assessment ({{ eyeFit.eye }})
              <div class="emr-oph-chips" role="group" [attr.aria-label]="'Push-up test ' + eyeFit.eye">
                @for (pushOpt of pushUpOptions; track pushOpt) {
                  <button
                    type="button"
                    class="emr-oph-chip"
                    [attr.aria-pressed]="eyeFit.pushUpTest === pushOpt"
                    [disabled]="!!m.readOnly"
                    (click)="setPushUpTest(eyeFit.eye, pushOpt)"
                  >{{ pushOpt }}</button>
                }
              </div>
            </div>
          </article>
        }
      </div>
    </section>
  `,
  styles: [SHARED_OPHTH_STYLES],
})
export class EmrContactLensPrescriptionComponent {
  readonly model = input.required<EmrContactLensPrescriptionViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrContactLensPrescriptionIntent>();

  readonly pushUpOptions = PUSH_UP_TEST_OPTIONS;

  eyes(): readonly ContactLensEyeFit[] {
    const m = this.model();
    return [m.od, m.os];
  }

  onEyeParamInput(
    eye: 'OD' | 'OS',
    field: 'baseCurveMm' | 'diameterMm' | 'sphereD' | 'cylinderD' | 'axisDeg',
    event: Event,
  ): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.setEyeParameter(eye, field, value);
  }

  setEyeParameter(
    eye: 'OD' | 'OS',
    field: 'baseCurveMm' | 'diameterMm' | 'sphereD' | 'cylinderD' | 'axisDeg',
    value: string,
  ): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'eyeParameterChanged', eye, field, value });
  }

  setPushUpTest(eye: 'OD' | 'OS', pushUpTest: ContactLensEyeFit['pushUpTest']): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'fitAssessmentChanged', eye, pushUpTest });
  }

  toggleTrialFinalized(): void {
    const m = this.model();
    if (m.readOnly) return;
    this.intent.emit({ type: 'trialFinalizedToggled', finalized: !m.trialFinalized });
  }

  copyEye(fromEye: 'OD' | 'OS', toEye: 'OD' | 'OS'): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'copyEyeRequested', fromEye, toEye });
  }
}
