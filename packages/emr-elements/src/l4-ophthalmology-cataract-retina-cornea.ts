import { css, html, nothing } from 'lit';
import type {
  ClinicalAssessmentStatus,
  ContactLensEyeFit,
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
import { EmrModelElement } from './controlled-rendering.js';
import { defineEmrElement, emrShadowStyles } from './foundations.js';

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

const TOPOGRAPHY_MAPS: readonly { readonly id: TopographyMapType; readonly label: string }[] = [
  { id: 'axial-curvature', label: 'Axial Curvature' },
  { id: 'pachymetry', label: 'Pachymetry' },
  { id: 'anterior-elevation', label: 'Anterior Elevation' },
  { id: 'posterior-elevation', label: 'Posterior Elevation' },
];

const ECTASIA_RISKS: readonly {
  readonly id: TopographyEyeSummary['ectasiaRisk'];
  readonly label: string;
}[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'borderline', label: 'Borderline' },
  { id: 'ectasia-suspect', label: 'Ectasia Suspect' },
];

const POSTERIOR_CAPSULE_OPTIONS: readonly EmrOphthalmicOperativeRecordViewModel['posteriorCapsuleStatus'][] =
  ['Intact', 'PCR without Vitreous Loss', 'PCR with Anterior Vitrectomy'];

const PUSH_UP_OPTIONS: readonly ContactLensEyeFit['pushUpTest'][] = [
  'Smooth / Adequate',
  'Tight /Steep',
  'Loose / Flat',
];

const STATUS_OPTIONS: readonly { readonly value: ClinicalAssessmentStatus; readonly label: string }[] =
  [
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

const ophthStyles = css`
  .oph-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 12px;
  }
  .oph-card {
    border: 1px solid var(--emr-border);
    border-radius: 10px;
    background: var(--emr-surface-raised, var(--emr-surface));
    padding: 12px;
    display: grid;
    gap: 10px;
  }
  .oph-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .oph-chip {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid var(--emr-border);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    cursor: pointer;
  }
  .oph-chip[aria-pressed='true'] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }
  .oph-alert {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--emr-warning);
    background: var(--emr-warning-soft);
    font-size: var(--emr-text-xs);
  }
`;

// ===========================================================================
// 1. EmrIolBiometryPlannerElement (`emr-iol-biometry-planner`)
// ===========================================================================

export class EmrIolBiometryPlannerElement extends EmrModelElement<
  EmrIolBiometryPlannerViewModel,
  EmrIolBiometryPlannerIntent
> {
  static override styles = [emrShadowStyles, ophthStyles];

  private renderEye(eye: IolBiometryEyePlan, readOnly: boolean) {
    return html`
      <article class="oph-card" aria-label=${`Biometry plan ${eye.eye}`}>
        <header class="oph-row">
          <strong>${eye.eye} · ${eye.lensModelLabel} (A = ${eye.aConstant})</strong>
          ${eye.deviceLabel ? html`<span class="emr-badge">${eye.deviceLabel}</span>` : nothing}
          ${eye.badge ? html`<span class="emr-badge">${eye.badge.label}</span>` : nothing}
        </header>

        <p>
          AL: ${eye.axialLengthMm.toFixed(2)} mm · ACD: ${eye.acdMm.toFixed(2)} mm · K1:
          ${eye.k1Diopters.toFixed(2)} D @ ${eye.k1AxisDeg}° · K2: ${eye.k2Diopters.toFixed(2)} D @
          ${eye.k2AxisDeg}° · ΔK: ${eye.cornealDeltaKD}
        </p>

        <div class="oph-row">
          <label>
            Target Rx (${eye.eye})
            <input
              type="text"
              aria-label=${`Target refraction ${eye.eye}`}
              .value=${eye.targetRefractionD}
              ?disabled=${readOnly}
              @change=${(e: Event) => {
                if (!readOnly) {
                  this.send({
                    type: 'targetRefractionChanged',
                    eye: eye.eye,
                    targetRefractionD: (e.target as HTMLInputElement).value,
                  });
                }
              }}
            />
          </label>
          <label>
            Incision Meridian (${eye.eye})
            <input
              type="number"
              aria-label=${`Incision meridian ${eye.eye}`}
              .value=${String(eye.incisionMeridianDeg ?? 110)}
              ?disabled=${readOnly}
              @change=${(e: Event) => {
                if (!readOnly) {
                  const val = Number((e.target as HTMLInputElement).value);
                  if (Number.isFinite(val)) {
                    this.send({
                      type: 'incisionMeridianChanged',
                      eye: eye.eye,
                      meridianDeg: val,
                    });
                  }
                }
              }}
            />
          </label>
        </div>

        <div class="oph-row" role="group" aria-label=${`Formulas ${eye.eye}`}>
          ${eye.availableFormulas.map(
            (formula: IolFormulaId) => html`
              <button
                type="button"
                class="oph-chip"
                aria-pressed=${eye.activeFormula === formula ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'formulaSelected', eye: eye.eye, formula });
                  }
                }}
              >
                ${formula}
              </button>
            `,
          )}
        </div>

        <table class="emr-table">
          <thead>
            <tr>
              <th>IOL Power</th>
              <th>Predicted Rx</th>
              <th>Toric</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${eye.candidates.map(
              (row: IolCandidateRow) => html`
                <tr>
                  <td>
                    <strong>${row.powerDiopters}</strong>
                    ${row.isEmmetropiaTarget ? html` <span>(EMMETROPIA)</span>` : nothing}
                  </td>
                  <td>${row.predictedRefractionD}</td>
                  <td>
                    ${row.toricCylinderModel ?? 'Spherical'}
                    ${row.recommendedAxisDeg !== undefined ? ` @ ${row.recommendedAxisDeg}°` : ''}
                  </td>
                  <td>
                    <button
                      type="button"
                      class="oph-chip"
                      aria-pressed=${row.isSelected ? 'true' : 'false'}
                      ?disabled=${readOnly}
                      @click=${() => {
                        if (!readOnly) {
                          this.send({
                            type: 'candidateSelected',
                            eye: eye.eye,
                            candidateId: row.id,
                            powerDiopters: row.powerDiopters,
                          });
                        }
                      }}
                    >
                      ${row.isSelected ? 'Selected' : `Select ${row.powerDiopters}`}
                    </button>
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </article>
    `;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const delta = evaluateBiometryInterOcularDelta(m.od.axialLengthMm, m.os.axialLengthMm);
    const warningText = m.interOcularWarning ?? delta.warning;

    return this.panel(
      m.title ?? 'Optical Biometry & Toric IOL Planner',
      html`
        <p>Inter-Ocular ΔAL: ${(m.interOcularAlDiffMm ?? delta.diffMm).toFixed(2)} mm</p>
        ${warningText ? html`<div class="oph-alert" role="alert">${warningText}</div>` : nothing}
        <div class="oph-grid">
          ${this.renderEye(m.od, readOnly)} ${this.renderEye(m.os, readOnly)}
        </div>
      `,
    );
  }
}

// ===========================================================================
// 2. EmrIntravitrealCourseTrackerElement (`emr-intravitreal-course-tracker`)
// ===========================================================================

export class EmrIntravitrealCourseTrackerElement extends EmrModelElement<
  EmrIntravitrealCourseTrackerViewModel,
  EmrIntravitrealCourseTrackerIntent
> {
  static override styles = [emrShadowStyles, ophthStyles];

  private formatFlags(v: IntravitrealVisitPoint): string {
    const flags: string[] = [];
    if (v.fluidFlags.irf) flags.push('IRF+');
    if (v.fluidFlags.srf) flags.push('SRF+');
    if (v.fluidFlags.ped) flags.push('PED+');
    if (v.fluidFlags.hemorrhage) flags.push('Heme+');
    return flags.length ? flags.join(' · ') : 'Dry Macula';
  }

  private renderCourse(course: IntravitrealEyeCourse, m: EmrIntravitrealCourseTrackerViewModel) {
    const readOnly = !!m.readOnly;
    const delta = computeIntravitrealCstDelta(course.baselineCstUm, course.latestCstUm);
    return html`
      <article class="oph-card" aria-label=${`Intravitreal course ${course.eye}`}>
        <header class="oph-row">
          <strong>${course.eye} · ${course.indication} · ${course.currentAgent}</strong>
          <span class="emr-badge">${course.currentRegimen}</span>
        </header>
        <p>
          Injections: #${course.totalInjectionsCount} · Interval: q${course.currentIntervalWeeks}w ·
          CST: ${course.baselineCstUm} → ${course.latestCstUm} µm (${delta.deltaUm} µm /
          ${delta.pctChange}%)
        </p>
        <div class="oph-row">
          <button
            type="button"
            class="oph-chip"
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) {
                this.send({
                  type: 'intervalAdjusted',
                  eye: course.eye,
                  nextIntervalWeeks: Math.max(4, course.currentIntervalWeeks - 2),
                  decision: 'inject-shorten',
                });
              }
            }}
          >
            Shorten −2w
          </button>
          <button
            type="button"
            class="oph-chip"
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) {
                this.send({
                  type: 'intervalAdjusted',
                  eye: course.eye,
                  nextIntervalWeeks: course.currentIntervalWeeks + 2,
                  decision: 'inject-extend',
                });
              }
            }}
          >
            Extend +2w
          </button>
          <button
            type="button"
            class="oph-chip"
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) {
                this.send({
                  type: 'recordInjectionRequested',
                  eye: course.eye,
                  agent: course.currentAgent,
                });
              }
            }}
          >
            + Record Injection
          </button>
        </div>

        <table class="emr-table">
          <thead>
            <tr>
              <th>Visit</th>
              <th>Date</th>
              <th>CST</th>
              <th>BCVA</th>
              <th>Fluid</th>
              <th>Decision</th>
            </tr>
          </thead>
          <tbody>
            ${course.visits.map(
              (v) => html`
                <tr>
                  <td>
                    <button
                      type="button"
                      class="oph-chip"
                      aria-pressed=${m.selectedVisitId === v.id ? 'true' : 'false'}
                      @click=${() =>
                        this.send({ type: 'visitSelected', eye: course.eye, visitId: v.id })}
                    >
                      #${v.visitNumber}
                    </button>
                  </td>
                  <td>${v.date}</td>
                  <td>${v.cstUm} µm</td>
                  <td>${v.bcvaLabel}</td>
                  <td>${this.formatFlags(v)}</td>
                  <td>${v.decision}</td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </article>
    `;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const courses: readonly IntravitrealEyeCourse[] =
      m.activeEye === 'OD'
        ? [m.od]
        : m.activeEye === 'OS'
          ? m.os
            ? [m.os]
            : [m.od]
          : m.os
            ? [m.od, m.os]
            : [m.od];

    return this.panel(
      m.title ?? 'Intravitreal Anti-VEGF & Steroid Course Tracker',
      html`
        <div class="oph-row" role="group" aria-label="Active eye filter">
          ${(['OD', 'OS', 'OU'] as const).map(
            (eyeOpt) => html`
              <button
                type="button"
                class="oph-chip"
                aria-pressed=${m.activeEye === eyeOpt ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) this.send({ type: 'activeEyeChanged', eye: eyeOpt });
                }}
              >
                ${eyeOpt}
              </button>
            `,
          )}
        </div>
        <div class="oph-grid">${courses.map((c) => this.renderCourse(c, m))}</div>
      `,
    );
  }
}

// ===========================================================================
// 3. EmrCornealTopographySummaryElement (`emr-corneal-topography-summary`)
// ===========================================================================

export class EmrCornealTopographySummaryElement extends EmrModelElement<
  EmrCornealTopographySummaryViewModel,
  EmrCornealTopographySummaryIntent
> {
  static override styles = [emrShadowStyles, ophthStyles];

  private renderEye(eye: TopographyEyeSummary, readOnly: boolean) {
    const screened = classifyEctasiaScreening(eye.kMaxD, eye.thinnestPachymetryUm, eye.badDIndex);
    return html`
      <article class="oph-card" aria-label=${`Corneal topography ${eye.eye}`}>
        <header class="oph-row">
          <strong>${eye.eye} · ${eye.deviceLabel} (QS: ${eye.qualityScore})</strong>
          <span class="emr-badge">Risk: ${eye.ectasiaRisk} (Screened: ${screened})</span>
        </header>
        <p>
          K1: ${eye.k1FlatD.toFixed(2)} D @ ${eye.k1AxisDeg}° · K2: ${eye.k2SteepD.toFixed(2)} D @
          ${eye.k2AxisDeg}° · Kmax: ${eye.kMaxD.toFixed(2)} D · Central/Thinnest:
          ${eye.centralPachymetryUm}/${eye.thinnestPachymetryUm} µm
          ${eye.badDIndex !== undefined ? ` · BAD-D: ${eye.badDIndex.toFixed(2)}` : ''}
        </p>
        <div class="oph-row" role="group" aria-label=${`Ectasia risk ${eye.eye}`}>
          ${ECTASIA_RISKS.map(
            (r) => html`
              <button
                type="button"
                class="oph-chip"
                aria-pressed=${eye.ectasiaRisk === r.id ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'ectasiaRiskChanged', eye: eye.eye, risk: r.id });
                  }
                }}
              >
                ${r.label}
              </button>
            `,
          )}
        </div>
        <label>
          Assessment Status (${eye.eye})
          <select
            aria-label=${`Assessment status ${eye.eye}`}
            .value=${eye.assessmentStatus ?? 'recorded'}
            ?disabled=${readOnly}
            @change=${(e: Event) => {
              if (!readOnly) {
                this.send({
                  type: 'eyeAssessmentStatusChanged',
                  eye: eye.eye,
                  status: (e.target as HTMLSelectElement).value as ClinicalAssessmentStatus,
                });
              }
            }}
          >
            ${STATUS_OPTIONS.map(
              (opt) =>
                html`<option
                  value=${opt.value}
                  ?selected=${(eye.assessmentStatus ?? 'recorded') === opt.value}
                >
                  ${opt.label}
                </option>`,
            )}
          </select>
        </label>
      </article>
    `;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    return this.panel(
      m.title ?? 'Corneal Topography & Belin/Ambrósio Ectasia Summary',
      html`
        <div class="oph-row" role="group" aria-label="Topography maps">
          ${TOPOGRAPHY_MAPS.map(
            (mp) => html`
              <button
                type="button"
                class="oph-chip"
                aria-pressed=${m.activeMap === mp.id ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) this.send({ type: 'activeMapChanged', mapType: mp.id });
                }}
              >
                ${mp.label}
              </button>
            `,
          )}
        </div>
        <div class="oph-grid">
          ${this.renderEye(m.od, readOnly)} ${this.renderEye(m.os, readOnly)}
        </div>
      `,
    );
  }
}

// ===========================================================================
// 4. EmrOphthalmicOperativeRecordElement (`emr-ophthalmic-operative-record`)
// ===========================================================================

export class EmrOphthalmicOperativeRecordElement extends EmrModelElement<
  EmrOphthalmicOperativeRecordViewModel,
  EmrOphthalmicOperativeRecordIntent
> {
  static override styles = [emrShadowStyles, ophthStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;

    return this.panel(
      m.title ?? m.procedureName,
      html`
        <div class="oph-row">
          <span class="emr-badge">Operated Eye: ${m.operatedEye}</span>
          <span>Surgeon: ${m.surgeonName} · Anesthesia: ${m.anesthesiaType}</span>
          <button
            type="button"
            class="oph-chip"
            aria-pressed=${m.timeoutVerified ? 'true' : 'false'}
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) {
                this.send({ type: 'timeoutToggled', verified: !m.timeoutVerified });
              }
            }}
          >
            ${m.timeoutVerified ? '✓ WHO Timeout Verified' : 'Verify WHO Timeout'}
          </button>
        </div>

        <p>
          Incision: ${m.mainIncisionWidthMm} mm @ ${m.mainIncisionMeridianDeg}° · Capsulorhexis:
          ${m.capsulorhexisStatus}
          ${m.phacoMetrics
            ? ` · CDE: ${m.phacoMetrics.cdeSeconds}s · BSS: ${m.phacoMetrics.bssVolumeMl} mL`
            : ''}
        </p>

        <div class="oph-row" role="group" aria-label="Posterior capsule status">
          ${POSTERIOR_CAPSULE_OPTIONS.map(
            (st) => html`
              <button
                type="button"
                class="oph-chip"
                aria-pressed=${m.posteriorCapsuleStatus === st ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'posteriorCapsuleStatusChanged', status: st });
                  }
                }}
              >
                ${st}
              </button>
            `,
          )}
        </div>

        <div class="oph-row">
          <strong>IOL: ${m.iolImplant.modelName} (${m.iolImplant.powerDiopters})</strong>
          <label>
            IOL Serial Number
            <input
              type="text"
              aria-label="IOL Serial Number"
              .value=${m.iolImplant.serialNumber}
              ?disabled=${readOnly}
              @change=${(e: Event) => {
                if (!readOnly) {
                  this.send({
                    type: 'iolSerialChanged',
                    serialNumber: (e.target as HTMLInputElement).value,
                  });
                }
              }}
            />
          </label>
          <button
            type="button"
            class="oph-chip"
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) this.send({ type: 'signOperativeNoteRequested' });
            }}
          >
            Sign Operative Note
          </button>
        </div>
      `,
    );
  }
}

// ===========================================================================
// 5. EmrContactLensPrescriptionElement (`emr-contact-lens-prescription`)
// ===========================================================================

export class EmrContactLensPrescriptionElement extends EmrModelElement<
  EmrContactLensPrescriptionViewModel,
  EmrContactLensPrescriptionIntent
> {
  static override styles = [emrShadowStyles, ophthStyles];

  private renderEye(eyeFit: ContactLensEyeFit, readOnly: boolean) {
    return html`
      <article class="oph-card" aria-label=${`Contact lens fit ${eyeFit.eye}`}>
        <header class="oph-row">
          <strong>${eyeFit.eye} · ${eyeFit.brandAndMaterial}</strong>
          <span class="emr-badge">${eyeFit.modality}</span>
        </header>
        <div class="oph-row">
          <label>
            BC (${eyeFit.eye})
            <input
              type="text"
              aria-label=${`Base curve ${eyeFit.eye}`}
              .value=${eyeFit.baseCurveMm}
              ?disabled=${readOnly}
              @change=${(e: Event) => {
                if (!readOnly) {
                  this.send({
                    type: 'eyeParameterChanged',
                    eye: eyeFit.eye,
                    field: 'baseCurveMm',
                    value: (e.target as HTMLInputElement).value,
                  });
                }
              }}
            />
          </label>
          <label>
            Sphere (${eyeFit.eye})
            <input
              type="text"
              aria-label=${`Sphere ${eyeFit.eye}`}
              .value=${eyeFit.sphereD}
              ?disabled=${readOnly}
              @change=${(e: Event) => {
                if (!readOnly) {
                  this.send({
                    type: 'eyeParameterChanged',
                    eye: eyeFit.eye,
                    field: 'sphereD',
                    value: (e.target as HTMLInputElement).value,
                  });
                }
              }}
            />
          </label>
        </div>
        <p>
          Centration: ${eyeFit.centration} · Movement: ${eyeFit.movementMm} · VA:
          ${eyeFit.visualAcuityAchieved}
        </p>
        <div class="oph-row" role="group" aria-label=${`Push-up test ${eyeFit.eye}`}>
          ${PUSH_UP_OPTIONS.map(
            (pushOpt) => html`
              <button
                type="button"
                class="oph-chip"
                aria-pressed=${eyeFit.pushUpTest === pushOpt ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({
                      type: 'fitAssessmentChanged',
                      eye: eyeFit.eye,
                      pushUpTest: pushOpt,
                    });
                  }
                }}
              >
                ${pushOpt}
              </button>
            `,
          )}
        </div>
      </article>
    `;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;

    return this.panel(
      m.title ?? 'Contact Lens Evaluation & Final Prescription',
      html`
        <div class="oph-row">
          <span>
            Issued: ${m.issueDate} · Expires: ${m.expiryDate} · ${m.replacementSchedule}
          </span>
          <button
            type="button"
            class="oph-chip"
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) {
                this.send({ type: 'copyEyeRequested', fromEye: 'OD', toEye: 'OS' });
              }
            }}
          >
            Copy OD → OS
          </button>
          <button
            type="button"
            class="oph-chip"
            aria-pressed=${m.trialFinalized ? 'true' : 'false'}
            ?disabled=${readOnly}
            @click=${() => {
              if (!readOnly) {
                this.send({ type: 'trialFinalizedToggled', finalized: !m.trialFinalized });
              }
            }}
          >
            ${m.trialFinalized ? '✓ Trial Finalized' : 'Finalize Trial Rx'}
          </button>
        </div>
        <div class="oph-grid">
          ${this.renderEye(m.od, readOnly)} ${this.renderEye(m.os, readOnly)}
        </div>
      `,
    );
  }
}

export function registerL4OphthalmologyCataractRetinaCorneaElements(): void {
  defineEmrElement('emr-iol-biometry-planner', EmrIolBiometryPlannerElement);
  defineEmrElement('emr-intravitreal-course-tracker', EmrIntravitrealCourseTrackerElement);
  defineEmrElement('emr-corneal-topography-summary', EmrCornealTopographySummaryElement);
  defineEmrElement('emr-ophthalmic-operative-record', EmrOphthalmicOperativeRecordElement);
  defineEmrElement('emr-contact-lens-prescription', EmrContactLensPrescriptionElement);
}
