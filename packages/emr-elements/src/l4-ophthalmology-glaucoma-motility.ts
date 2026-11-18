import { css, html, nothing, svg } from 'lit';
import type {
  ClinicalAssessmentStatus,
  EmrGonioscopyChartIntent,
  EmrGonioscopyChartViewModel,
  EmrHessScreenChartIntent,
  EmrHessScreenChartViewModel,
  EmrTone,
  EmrVisualFieldSummaryIntent,
  EmrVisualFieldSummaryViewModel,
  GhtClassification,
  GonioscopyEyeRecord,
  GonioscopyQuadrantFinding,
  GonioscopyQuadrantId,
  HessEyeRecord,
  HessGazeId,
  HessPlotPoint,
  PbctNineGazeCell,
  ShafferGrade,
  VisualFieldDefectProbability,
  VisualFieldEyeRecord,
  VisualFieldSectorPoint,
} from '@drguptavivek/emr-controller';
import { EmrModelElement } from './controlled-rendering.js';
import { defineEmrElement, emrShadowStyles } from './foundations.js';

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

export const GONIOSCOPY_QUADRANT_IDS: readonly GonioscopyQuadrantId[] = [
  'superior',
  'nasal',
  'inferior',
  'temporal',
];

export const SHAFFER_GRADES: readonly ShafferGrade[] = ['0', 'slit', '1', '2', '3', '4'];

export const GONIOSCOPY_PIGMENTATION_GRADES: readonly (0 | 1 | 2 | 3 | 4)[] = [0, 1, 2, 3, 4];

export const GONIOSCOPY_CLOCK_HOURS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const VISUAL_FIELD_DEFECT_PATTERNS: readonly string[] = [
  'Superior Arcuate Scotoma',
  'Inferior Arcuate Scotoma',
  'Nasal Step',
  'Paracentral Scotoma',
  'Generalized Reduction',
  'Within Normal Limits',
];

export const HESS_NINE_GAZE_ROWS: readonly (readonly HessGazeId[])[] = [
  ['NW', 'N', 'NE'],
  ['W', 'C', 'E'],
  ['SW', 'S', 'SE'],
];

const HESS_PERIMETER_ORDER: readonly HessGazeId[] = ['NW', 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W'];

const ASSESSMENT_STATUSES: readonly {
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

export function summarizeGonioscopyOccludability(eye: GonioscopyEyeRecord): {
  closedQuadrantCount: number;
  pasClockHourCount: number;
  isOccludable: boolean;
} {
  let closedQuadrantCount = 0;
  for (const qId of GONIOSCOPY_QUADRANT_IDS) {
    const finding = eye.quadrants[qId];
    if (
      finding &&
      (finding.staticGrade === '0' || finding.staticGrade === 'slit' || finding.staticGrade === '1')
    ) {
      closedQuadrantCount += 1;
    }
  }
  const pasClockHourCount = eye.pasClockHours ? eye.pasClockHours.length : 0;
  return {
    closedQuadrantCount,
    pasClockHourCount,
    isOccludable: closedQuadrantCount >= 2,
  };
}

export function evaluateVisualFieldReliability(
  flRatio: string,
  fpPct: number,
  fnPct: number,
): 'reliable' | 'caution' | 'unreliable' {
  let flFraction = 0;
  const parts = flRatio.split('/').map((part) => Number(part.trim()));
  if (
    parts.length === 2 &&
    Number.isFinite(parts[0]) &&
    Number.isFinite(parts[1]) &&
    parts[1]! > 0
  ) {
    flFraction = parts[0]! / parts[1]!;
  }
  if (fpPct >= 15 || fnPct >= 20 || flFraction > 0.2) {
    return 'unreliable';
  }
  if (fpPct >= 10 || fnPct >= 15 || flFraction >= 0.15) {
    return 'caution';
  }
  return 'reliable';
}

export function computeHessFieldAreaRatio(points: readonly HessPlotPoint[]): {
  plottedSpanX: number;
  plottedSpanY: number;
  expectedSpanX: number;
  expectedSpanY: number;
} {
  if (points.length === 0) {
    return { plottedSpanX: 0, plottedSpanY: 0, expectedSpanX: 0, expectedSpanY: 0 };
  }
  const plottedXs = points.map((p) => p.plottedXDeg);
  const plottedYs = points.map((p) => p.plottedYDeg);
  const expectedXs = points.map((p) => p.expectedXDeg);
  const expectedYs = points.map((p) => p.expectedYDeg);
  return {
    plottedSpanX: Math.max(...plottedXs) - Math.min(...plottedXs),
    plottedSpanY: Math.max(...plottedYs) - Math.min(...plottedYs),
    expectedSpanX: Math.max(...expectedXs) - Math.min(...expectedXs),
    expectedSpanY: Math.max(...expectedYs) - Math.min(...expectedYs),
  };
}

const ophthalGlaucomaStyles = css`
  .oph-card {
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius, 12px);
    background: var(--emr-surface);
    color: var(--emr-text);
    padding: 16px;
    display: grid;
    gap: 14px;
  }
  .oph-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    border-bottom: 1px solid var(--emr-border);
    padding-bottom: 12px;
  }
  .oph-eyebrow {
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    color: var(--emr-primary);
    letter-spacing: 0.05em;
  }
  .oph-title {
    margin: 2px 0 0;
    font-size: var(--emr-text-lg);
    font-weight: var(--emr-weight-bold);
  }
  .oph-subtitle {
    margin: 4px 0 0;
    font-size: var(--emr-text-sm);
    color: var(--emr-text-muted);
  }
  .oph-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 14px;
  }
  .oph-subcard {
    border: 1px solid var(--emr-border);
    border-radius: 10px;
    background: var(--emr-surface-soft);
    padding: 12px;
    display: grid;
    gap: 10px;
  }
  .oph-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .oph-row-between {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .oph-chip {
    padding: 4px 10px;
    border: 1px solid var(--emr-border);
    border-radius: 6px;
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    cursor: pointer;
  }
  .oph-chip[aria-pressed="true"],
  .oph-chip[aria-selected="true"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }
  .oph-badge {
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid var(--emr-border);
    background: var(--emr-surface);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
  }
  .oph-badge[data-tone="danger"] { border-color: var(--emr-danger); color: var(--emr-danger); }
  .oph-badge[data-tone="warning"] { border-color: var(--emr-warning); color: var(--emr-warning); }
  .oph-badge[data-tone="success"] { border-color: var(--emr-success); color: var(--emr-success); }
  .oph-badge[data-tone="info"] { border-color: var(--emr-info); color: var(--emr-info); }
  .oph-svg {
    width: 100%;
    max-width: 210px;
    height: auto;
    display: block;
  }
  .oph-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
    gap: 8px;
    padding: 8px;
    border: 1px solid var(--emr-border);
    border-radius: 8px;
    background: var(--emr-surface);
  }
  .oph-pbct-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .oph-pbct-cell {
    padding: 8px;
    border: 1px solid var(--emr-border);
    border-radius: 8px;
    background: var(--emr-surface);
    display: grid;
    gap: 4px;
  }
`;

// ===========================================================================
// 1. <emr-gonioscopy-chart> (`EmrGonioscopyChartElement`)
// ===========================================================================

export class EmrGonioscopyChartElement extends EmrModelElement<
  EmrGonioscopyChartViewModel,
  EmrGonioscopyChartIntent
> {
  static override styles = [emrShadowStyles, ophthalGlaucomaStyles];

  private emitIfEditable(intent: EmrGonioscopyChartIntent): void {
    if (!this.model?.readOnly) {
      this.send(intent);
    }
  }

  private renderEye(eyeRec: GonioscopyEyeRecord, m: EmrGonioscopyChartViewModel) {
    const occ = summarizeGonioscopyOccludability(eyeRec);
    const viewMode = m.viewMode ?? 'both';
    const activeQuad: GonioscopyQuadrantId =
      m.selectedEye === eyeRec.eye && m.selectedQuadrant
        ? m.selectedQuadrant
        : (m.selectedQuadrant ?? 'superior');
    const activeFind: GonioscopyQuadrantFinding = eyeRec.quadrants[activeQuad];
    const leftQuad: GonioscopyQuadrantId = eyeRec.eye === 'OD' ? 'temporal' : 'nasal';
    const rightQuad: GonioscopyQuadrantId = eyeRec.eye === 'OD' ? 'nasal' : 'temporal';
    const isRecorded = !eyeRec.assessmentStatus || eyeRec.assessmentStatus === 'recorded';

    const formatQuad = (f: GonioscopyQuadrantFinding) => {
      if (viewMode === 'static') return `Gr ${f.staticGrade}`;
      if (viewMode === 'dynamic') return `Gr ${f.dynamicGrade ?? f.staticGrade}`;
      const dyn = f.dynamicGrade ? `→${f.dynamicGrade}` : '';
      return `${f.staticGrade}${dyn}`;
    };

    return html`
      <article class="oph-subcard" aria-label=${`${eyeRec.eye} Gonioscopy`}>
        <header class="oph-row-between">
          <div class="oph-row">
            <strong class="oph-badge" data-tone="info">${eyeRec.eye}</strong>
            <span class="oph-badge">${eyeRec.gradingSystem.toUpperCase()}</span>
            ${eyeRec.lensUsed ? html`<span class="oph-badge">${eyeRec.lensUsed}</span>` : nothing}
          </div>
          <div class="oph-row">
            <span class="oph-badge" data-tone=${occ.isOccludable ? 'danger' : 'success'}>
              ${occ.isOccludable
                ? `Occludable (${occ.closedQuadrantCount}/4 closed)`
                : `Open (${occ.closedQuadrantCount}/4 narrow)`}
            </span>
            ${occ.pasClockHourCount > 0
              ? html`<span class="oph-badge" data-tone="warning">PAS ${occ.pasClockHourCount} clk hr</span>`
              : nothing}
          </div>
        </header>

        <div class="oph-row" role="group" aria-label=${`${eyeRec.eye} assessment status`}>
          ${ASSESSMENT_STATUSES.map(
            (st) => html`
              <button
                type="button"
                class="oph-chip"
                aria-pressed=${(eyeRec.assessmentStatus ?? 'recorded') === st.value ? 'true' : 'false'}
                ?disabled=${!!m.readOnly}
                @click=${() =>
                  this.emitIfEditable({
                    type: 'eyeAssessmentStatusChanged',
                    eye: eyeRec.eye,
                    status: st.value,
                  })}
              >
                ${st.label}
              </button>
            `,
          )}
        </div>

        ${!isRecorded
          ? html`<p role="status">${eyeRec.eye} Angle Assessment: ${eyeRec.assessmentStatus}</p>`
          : html`
              <svg class="oph-svg" viewBox="0 0 200 200" role="img" aria-label=${`${eyeRec.eye} 4-quadrant angle diagram`}>
                ${svg`
                  <circle cx="100" cy="100" r="82" fill="var(--emr-surface)" stroke="var(--emr-border)" stroke-width="2" />
                  <circle cx="100" cy="100" r="54" fill="none" stroke="var(--emr-border)" stroke-dasharray="4 3" />
                  <line x1="42" y1="42" x2="158" y2="158" stroke="var(--emr-border)" stroke-width="1.5" />
                  <line x1="158" y1="42" x2="42" y2="158" stroke="var(--emr-border)" stroke-width="1.5" />
                  <text x="100" y="34" text-anchor="middle" fill="var(--emr-text)" font-size="11">SUP ${formatQuad(eyeRec.quadrants.superior)}</text>
                  <text x="100" y="174" text-anchor="middle" fill="var(--emr-text)" font-size="11">INF ${formatQuad(eyeRec.quadrants.inferior)}</text>
                  <text x="38" y="104" text-anchor="middle" fill="var(--emr-text)" font-size="10">${leftQuad.toUpperCase()} ${formatQuad(eyeRec.quadrants[leftQuad])}</text>
                  <text x="162" y="104" text-anchor="middle" fill="var(--emr-text)" font-size="10">${rightQuad.toUpperCase()} ${formatQuad(eyeRec.quadrants[rightQuad])}</text>
                `}
              </svg>

              <div class="oph-row" role="tablist" aria-label=${`${eyeRec.eye} quadrants`}>
                ${GONIOSCOPY_QUADRANT_IDS.map(
                  (qId) => html`
                    <button
                      type="button"
                      role="tab"
                      class="oph-chip"
                      aria-selected=${activeQuad === qId ? 'true' : 'false'}
                      @click=${() => this.emitIfEditable({ type: 'quadrantSelected', eye: eyeRec.eye, quadrant: qId })}
                    >
                      ${qId.toUpperCase()} (${formatQuad(eyeRec.quadrants[qId])})
                    </button>
                  `,
                )}
              </div>

              ${viewMode === 'static' || viewMode === 'both'
                ? html`
                    <div class="oph-row" role="group" aria-label=${`${eyeRec.eye} ${activeQuad} static grade`}>
                      <small>Static (${activeQuad}):</small>
                      ${SHAFFER_GRADES.map(
                        (gr) => html`
                          <button
                            type="button"
                            class="oph-chip"
                            aria-pressed=${activeFind.staticGrade === gr ? 'true' : 'false'}
                            ?disabled=${!!m.readOnly}
                            @click=${() =>
                              this.emitIfEditable({
                                type: 'quadrantGradeChanged',
                                eye: eyeRec.eye,
                                quadrant: activeQuad,
                                mode: 'static',
                                grade: gr,
                              })}
                          >
                            ${gr === 'slit' ? 'Slit' : `Gr ${gr}`}
                          </button>
                        `,
                      )}
                    </div>
                  `
                : nothing}

              ${viewMode === 'dynamic' || viewMode === 'both'
                ? html`
                    <div class="oph-row" role="group" aria-label=${`${eyeRec.eye} ${activeQuad} dynamic grade`}>
                      <small>Dynamic (${activeQuad}):</small>
                      ${SHAFFER_GRADES.map(
                        (gr) => html`
                          <button
                            type="button"
                            class="oph-chip"
                            aria-pressed=${activeFind.dynamicGrade === gr ? 'true' : 'false'}
                            ?disabled=${!!m.readOnly}
                            @click=${() =>
                              this.emitIfEditable({
                                type: 'quadrantGradeChanged',
                                eye: eyeRec.eye,
                                quadrant: activeQuad,
                                mode: 'dynamic',
                                grade: gr,
                              })}
                          >
                            ${gr === 'slit' ? 'Slit' : `Gr ${gr}`}
                          </button>
                        `,
                      )}
                    </div>
                  `
                : nothing}

              <div class="oph-row" role="group" aria-label=${`${eyeRec.eye} ${activeQuad} pigmentation`}>
                <small>Pigmentation:</small>
                ${GONIOSCOPY_PIGMENTATION_GRADES.map(
                  (p) => html`
                    <button
                      type="button"
                      class="oph-chip"
                      aria-pressed=${activeFind.pigmentation === p ? 'true' : 'false'}
                      ?disabled=${!!m.readOnly}
                      @click=${() =>
                        this.emitIfEditable({
                          type: 'quadrantPigmentationChanged',
                          eye: eyeRec.eye,
                          quadrant: activeQuad,
                          pigmentation: p,
                        })}
                    >
                      ${p}+
                    </button>
                  `,
                )}
              </div>

              <div class="oph-row" role="group" aria-label=${`${eyeRec.eye} PAS clock hours`}>
                <small>PAS Clock Hours:</small>
                ${GONIOSCOPY_CLOCK_HOURS.map((hr) => {
                  const hasPas = (eyeRec.pasClockHours ?? []).includes(hr);
                  return html`
                    <button
                      type="button"
                      class="oph-chip"
                      aria-pressed=${hasPas ? 'true' : 'false'}
                      ?disabled=${!!m.readOnly}
                      @click=${() =>
                        this.emitIfEditable({
                          type: 'pasClockHourToggled',
                          eye: eyeRec.eye,
                          clockHour: hr,
                        })}
                    >
                      ${hr}h
                    </button>
                  `;
                })}
              </div>
            `}
      </article>
    `;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const viewMode = m.viewMode ?? 'both';

    return html`
      <section class="oph-card" aria-labelledby=${this.headingId || `${m.id}-title`}>
        <header class="oph-header">
          <div>
            <span class="oph-eyebrow">ANTERIOR CHAMBER ANGLE · GONIOSCOPY</span>
            <h3 class="oph-title" id=${this.headingId || `${m.id}-title`}>
              ${m.title ?? 'Bilateral 4-Quadrant Gonioscopy & Angle Evaluation'}
            </h3>
            ${m.subtitle ? html`<p class="oph-subtitle">${m.subtitle}</p>` : nothing}
          </div>

          <div class="oph-row" role="group" aria-label="View mode and bilateral copy controls">
            ${(['static', 'dynamic', 'both'] as const).map(
              (vm) => html`
                <button
                  type="button"
                  class="oph-chip"
                  aria-pressed=${viewMode === vm ? 'true' : 'false'}
                  ?disabled=${!!m.readOnly}
                  @click=${() => this.emitIfEditable({ type: 'viewModeChanged', viewMode: vm })}
                >
                  ${vm === 'both' ? 'Static + Dynamic' : vm === 'dynamic' ? 'Dynamic' : 'Static'}
                </button>
              `,
            )}
            ${!m.readOnly
              ? html`
                  <button
                    type="button"
                    class="oph-chip"
                    @click=${() =>
                      this.emitIfEditable({ type: 'copyEyeRequested', fromEye: 'OD', toEye: 'OS' })}
                  >
                    Copy OD → OS
                  </button>
                  <button
                    type="button"
                    class="oph-chip"
                    @click=${() =>
                      this.emitIfEditable({ type: 'copyEyeRequested', fromEye: 'OS', toEye: 'OD' })}
                  >
                    Copy OS → OD
                  </button>
                `
              : nothing}
          </div>
        </header>

        <div class="oph-grid">
          ${this.renderEye(m.od, m)}
          ${this.renderEye(m.os, m)}
        </div>
      </section>
    `;
  }
}

// ===========================================================================
// 2. <emr-visual-field-summary> (`EmrVisualFieldSummaryElement`)
// ===========================================================================

export class EmrVisualFieldSummaryElement extends EmrModelElement<
  EmrVisualFieldSummaryViewModel,
  EmrVisualFieldSummaryIntent
> {
  static override styles = [emrShadowStyles, ophthalGlaucomaStyles];

  private emitIfEditable(intent: EmrVisualFieldSummaryIntent): void {
    if (!this.model?.readOnly) {
      this.send(intent);
    }
  }

  private renderEye(eyeRec: VisualFieldEyeRecord, m: EmrVisualFieldSummaryViewModel) {
    const activeMap = m.activeMapType ?? 'pattern-deviation';
    const rel =
      eyeRec.reliabilityFlag ??
      evaluateVisualFieldReliability(
        eyeRec.fixationLosses,
        eyeRec.falsePositivesPct,
        eyeRec.falseNegativesPct,
      );
    const relTone: EmrTone =
      rel === 'unreliable' ? 'danger' : rel === 'caution' ? 'warning' : 'success';
    const ghtTone: EmrTone =
      eyeRec.ght === 'Outside Normal Limits'
        ? 'danger'
        : eyeRec.ght === 'Borderline' || eyeRec.ght === 'Generalized Reduction of Sensitivity'
          ? 'warning'
          : 'success';
    const isRecorded = !eyeRec.assessmentStatus || eyeRec.assessmentStatus === 'recorded';

    const glyph = (p: VisualFieldDefectProbability) => {
      if (p === 'p<5%') return '·';
      if (p === 'p<2%') return '∷';
      if (p === 'p<1%') return '▒';
      if (p === 'p<0.5%') return '▓';
      if (p === 'absolute') return '■';
      return '•';
    };

    return html`
      <article class="oph-subcard" aria-label=${`${eyeRec.eye} Visual Field`}>
        <header class="oph-row-between">
          <div class="oph-row">
            <strong class="oph-badge" data-tone="info">${eyeRec.eye}</strong>
            <span class="oph-badge">${eyeRec.strategy}</span>
            <span class="oph-badge">${eyeRec.testDate}</span>
          </div>
          <div class="oph-row">
            <span class="oph-badge" data-tone=${relTone}>${rel.toUpperCase()}</span>
            ${eyeRec.badge
              ? html`<span class="oph-badge" data-tone=${eyeRec.badge.tone}>${eyeRec.badge.label}</span>`
              : nothing}
          </div>
        </header>

        <div class="oph-row" role="group" aria-label=${`${eyeRec.eye} assessment status`}>
          ${ASSESSMENT_STATUSES.map(
            (st) => html`
              <button
                type="button"
                class="oph-chip"
                aria-pressed=${(eyeRec.assessmentStatus ?? 'recorded') === st.value ? 'true' : 'false'}
                ?disabled=${!!m.readOnly}
                @click=${() =>
                  this.emitIfEditable({
                    type: 'eyeAssessmentStatusChanged',
                    eye: eyeRec.eye,
                    status: st.value,
                  })}
              >
                ${st.label}
              </button>
            `,
          )}
        </div>

        ${!isRecorded
          ? html`<p role="status">${eyeRec.eye} Perimetry: ${eyeRec.assessmentStatus}</p>`
          : html`
              <div class="oph-strip" role="group" aria-label=${`${eyeRec.eye} reliability and global indices`}>
                <div><small>FL</small><div><strong>${eyeRec.fixationLosses}</strong></div></div>
                <div><small>FP</small><div><strong>${eyeRec.falsePositivesPct}%</strong></div></div>
                <div><small>FN</small><div><strong>${eyeRec.falseNegativesPct}%</strong></div></div>
                <div><small>VFI</small><div><strong>${eyeRec.vfiPct !== undefined ? `${eyeRec.vfiPct}%` : '—'}</strong></div></div>
                <div><small>MD</small><div><strong>${eyeRec.mdDb.toFixed(2)} dB</strong></div></div>
                <div><small>PSD</small><div><strong>${eyeRec.psdDb.toFixed(2)} dB</strong></div></div>
                <div><small>GHT</small><div><span class="oph-badge" data-tone=${ghtTone}>${eyeRec.ght}</span></div></div>
              </div>

              <div class="oph-row" role="group" aria-label=${`${eyeRec.eye} sector points`}>
                ${eyeRec.points.map((pt: VisualFieldSectorPoint) => {
                  const val =
                    activeMap === 'pattern-deviation' ? pt.patternDeviationDb : pt.totalDeviationDb;
                  const selected =
                    m.selectedPointId === pt.id && (!m.selectedEye || m.selectedEye === eyeRec.eye);
                  return html`
                    <button
                      type="button"
                      class="oph-chip"
                      aria-pressed=${selected ? 'true' : 'false'}
                      @click=${() =>
                        this.emitIfEditable({ type: 'pointSelected', eye: eyeRec.eye, pointId: pt.id })}
                    >
                      ${glyph(pt.probability)} ${pt.id} (${val} dB · ${pt.probability})
                    </button>
                  `;
                })}
              </div>

              <div class="oph-row" role="group" aria-label=${`${eyeRec.eye} defect pattern`}>
                <small>Pattern (${eyeRec.defectPatternLabel ?? 'Unclassified'}):</small>
                ${VISUAL_FIELD_DEFECT_PATTERNS.map(
                  (pat) => html`
                    <button
                      type="button"
                      class="oph-chip"
                      aria-pressed=${eyeRec.defectPatternLabel === pat ? 'true' : 'false'}
                      ?disabled=${!!m.readOnly}
                      @click=${() =>
                        this.emitIfEditable({
                          type: 'defectPatternChanged',
                          eye: eyeRec.eye,
                          patternLabel: pat,
                        })}
                    >
                      ${pat}
                    </button>
                  `,
                )}
              </div>
            `}
      </article>
    `;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const activeMap = m.activeMapType ?? 'pattern-deviation';

    return html`
      <section class="oph-card" aria-labelledby=${this.headingId || `${m.id}-title`}>
        <header class="oph-header">
          <div>
            <span class="oph-eyebrow">AUTOMATED PERIMETRY · VISUAL FIELD SUMMARY</span>
            <h3 class="oph-title" id=${this.headingId || `${m.id}-title`}>
              ${m.title ?? 'Bilateral Humphrey / Octopus Visual Field Summary'}
            </h3>
            ${m.subtitle ? html`<p class="oph-subtitle">${m.subtitle}</p>` : nothing}
          </div>

          <div class="oph-row" role="group" aria-label="Deviation map type">
            <button
              type="button"
              class="oph-chip"
              aria-pressed=${activeMap === 'pattern-deviation' ? 'true' : 'false'}
              ?disabled=${!!m.readOnly}
              @click=${() =>
                this.emitIfEditable({ type: 'mapTypeChanged', mapType: 'pattern-deviation' })}
            >
              Pattern Deviation Map
            </button>
            <button
              type="button"
              class="oph-chip"
              aria-pressed=${activeMap === 'total-deviation' ? 'true' : 'false'}
              ?disabled=${!!m.readOnly}
              @click=${() =>
                this.emitIfEditable({ type: 'mapTypeChanged', mapType: 'total-deviation' })}
            >
              Total Deviation Map
            </button>
          </div>
        </header>

        <div class="oph-grid">
          ${this.renderEye(m.od, m)}
          ${this.renderEye(m.os, m)}
        </div>
      </section>
    `;
  }
}

// ===========================================================================
// 3. <emr-hess-screen-chart> (`EmrHessScreenChartElement`)
// ===========================================================================

export class EmrHessScreenChartElement extends EmrModelElement<
  EmrHessScreenChartViewModel,
  EmrHessScreenChartIntent
> {
  static override styles = [emrShadowStyles, ophthalGlaucomaStyles];

  private emitIfEditable(intent: EmrHessScreenChartIntent): void {
    if (!this.model?.readOnly) {
      this.send(intent);
    }
  }

  private renderChart(
    chartKey: 'left-os-fixing' | 'right-od-fixing',
    label: string,
    record: HessEyeRecord,
    m: EmrHessScreenChartViewModel,
  ) {
    const innerSpan = computeHessFieldAreaRatio(record.innerFieldPoints);
    const activeGaze: HessGazeId = m.selectedGazeId ?? 'C';
    const byGaze = new Map(record.innerFieldPoints.map((p) => [p.gazeId, p]));
    const ordered = HESS_PERIMETER_ORDER.map((g) => byGaze.get(g)).filter(
      (p): p is HessPlotPoint => !!p,
    );
    const polyList = ordered.length >= 3 ? ordered : record.innerFieldPoints;
    const polyAttr = polyList
      .map((p) => `${Math.round(100 + (p.plottedXDeg / 30) * 75)},${Math.round(100 - (p.plottedYDeg / 30) * 75)}`)
      .join(' ');

    return html`
      <article class="oph-subcard" aria-label=${label}>
        <header class="oph-row-between">
          <strong>${label}</strong>
          <div class="oph-row">
            ${record.primaryRestrictionMuscle
              ? html`<span class="oph-badge" data-tone="danger">Underaction: ${record.primaryRestrictionMuscle}</span>`
              : nothing}
            ${record.primaryOveractionMuscle
              ? html`<span class="oph-badge" data-tone="warning">Overaction: ${record.primaryOveractionMuscle}</span>`
              : nothing}
          </div>
        </header>

        <small>
          Inner (15°) Span: ${innerSpan.plottedSpanX}°×${innerSpan.plottedSpanY}° (Ref ${innerSpan.expectedSpanX}°×${innerSpan.expectedSpanY}°)
        </small>

        <svg class="oph-svg" viewBox="0 0 200 200" role="img" aria-label=${`${label} tangent grid`}>
          ${svg`
            <rect x="25" y="25" width="150" height="150" fill="var(--emr-surface)" stroke="var(--emr-border)" stroke-dasharray="4 3" />
            <rect x="62.5" y="62.5" width="75" height="75" fill="none" stroke="var(--emr-border)" stroke-dasharray="3 3" />
            ${polyAttr ? svg`<polygon points=${polyAttr} fill="var(--emr-primary-soft)" stroke="var(--emr-primary)" stroke-width="2" />` : nothing}
          `}
        </svg>

        <div class="oph-row" role="group" aria-label=${`${label} points`}>
          ${record.innerFieldPoints.map(
            (pt) => html`
              <button
                type="button"
                class="oph-chip"
                aria-pressed=${m.selectedChart === chartKey && activeGaze === pt.gazeId ? 'true' : 'false'}
                @click=${() =>
                  this.emitIfEditable({
                    type: 'pointSelected',
                    chart: chartKey,
                    field: 'inner',
                    gazeId: pt.gazeId,
                  })}
              >
                ${pt.gazeId} (${pt.plottedXDeg}°, ${pt.plottedYDeg}°)
              </button>
            `,
          )}
        </div>

        ${!m.readOnly
          ? html`
              <div class="oph-row" role="group" aria-label=${`${label} nudge controls`}>
                <button
                  type="button"
                  class="oph-chip"
                  @click=${() =>
                    this.emitIfEditable({
                      type: 'pointNudged',
                      chart: chartKey,
                      field: 'inner',
                      gazeId: activeGaze,
                      dxDeg: -2,
                      dyDeg: 0,
                    })}
                >
                  ← -2° X
                </button>
                <button
                  type="button"
                  class="oph-chip"
                  @click=${() =>
                    this.emitIfEditable({
                      type: 'pointNudged',
                      chart: chartKey,
                      field: 'inner',
                      gazeId: activeGaze,
                      dxDeg: 2,
                      dyDeg: 0,
                    })}
                >
                  +2° X →
                </button>
                <button
                  type="button"
                  class="oph-chip"
                  @click=${() =>
                    this.emitIfEditable({
                      type: 'pointNudged',
                      chart: chartKey,
                      field: 'inner',
                      gazeId: activeGaze,
                      dxDeg: 0,
                      dyDeg: 2,
                    })}
                >
                  ↑ +2° Y
                </button>
                <button
                  type="button"
                  class="oph-chip"
                  @click=${() =>
                    this.emitIfEditable({
                      type: 'pointNudged',
                      chart: chartKey,
                      field: 'inner',
                      gazeId: activeGaze,
                      dxDeg: 0,
                      dyDeg: -2,
                    })}
                >
                  ↓ -2° Y
                </button>
              </div>
            `
          : nothing}
      </article>
    `;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const distanceMode = m.activeDistanceMode ?? 'distance-6m';
    const pbctCells: Readonly<Record<HessGazeId, PbctNineGazeCell>> =
      distanceMode === 'near-33cm' && m.pbctNearCells ? m.pbctNearCells : m.pbctDistanceCells;

    return html`
      <section class="oph-card" aria-labelledby=${this.headingId || `${m.id}-title`}>
        <header class="oph-header">
          <div>
            <span class="oph-eyebrow">STRABISMUS & DIPLOPIA · HESS TANGENT SCREEN & 9-GAZE PBCT</span>
            <h3 class="oph-title" id=${this.headingId || `${m.id}-title`}>
              ${m.title ?? 'Hess Screen / Lees Tangent Chart & 9-Gaze Prism Bar Cover Test'}
            </h3>
            ${m.subtitle ? html`<p class="oph-subtitle">${m.subtitle}</p>` : nothing}
            ${m.diagnosisSummary ? html`<p class="oph-subtitle">${m.diagnosisSummary}</p>` : nothing}
          </div>

          <div class="oph-row" role="group" aria-label="PBCT fixation distance mode">
            <button
              type="button"
              class="oph-chip"
              aria-pressed=${distanceMode === 'distance-6m' ? 'true' : 'false'}
              ?disabled=${!!m.readOnly}
              @click=${() =>
                this.emitIfEditable({ type: 'distanceModeChanged', distanceMode: 'distance-6m' })}
            >
              Distance (6m)
            </button>
            <button
              type="button"
              class="oph-chip"
              aria-pressed=${distanceMode === 'near-33cm' ? 'true' : 'false'}
              ?disabled=${!!m.readOnly}
              @click=${() =>
                this.emitIfEditable({ type: 'distanceModeChanged', distanceMode: 'near-33cm' })}
            >
              Near (33cm)
            </button>
          </div>
        </header>

        <div class="oph-grid">
          ${this.renderChart(
            'left-os-fixing',
            `Left Chart (${m.leftChartOsFixing.fixingEye} Fixing · ${m.leftChartOsFixing.plottedEye} Plotted)`,
            m.leftChartOsFixing,
            m,
          )}
          ${this.renderChart(
            'right-od-fixing',
            `Right Chart (${m.rightChartOdFixing.fixingEye} Fixing · ${m.rightChartOdFixing.plottedEye} Plotted)`,
            m.rightChartOdFixing,
            m,
          )}
        </div>

        <section class="oph-subcard" aria-label="9-Gaze Prism Bar Cover Test Matrix">
          <header class="oph-row-between">
            <strong>9-Gaze PBCT (${distanceMode === 'distance-6m' ? 'Distance 6m' : 'Near 33cm'})</strong>
            ${m.headTiltCells
              ? html`
                  <div class="oph-row">
                    <span class="oph-badge">Right Tilt: ${m.headTiltCells.rightTiltDelta}</span>
                    <span class="oph-badge">Left Tilt: ${m.headTiltCells.leftTiltDelta}</span>
                  </div>
                `
              : nothing}
          </header>

          <div class="oph-pbct-grid">
            ${HESS_NINE_GAZE_ROWS.flat().map((gazeId) => {
              const cell = pbctCells[gazeId];
              return html`
                <div class="oph-pbct-cell">
                  <div class="oph-row-between">
                    <strong>${gazeId}</strong>
                    ${cell?.badge
                      ? html`<span class="oph-badge" data-tone=${cell.badge.tone}>${cell.badge.label}</span>`
                      : nothing}
                  </div>
                  <div>H: ${cell?.horizontalDelta ?? 'Ortho'} · V: ${cell?.verticalDelta ?? '0Δ'}</div>
                  ${!m.readOnly
                    ? html`
                        <button
                          type="button"
                          class="oph-chip"
                          @click=${() =>
                            this.emitIfEditable({
                              type: 'pbctCellEdited',
                              distanceMode,
                              gazeId,
                              horizontalDelta: cell?.horizontalDelta ?? 'Ortho',
                              verticalDelta: cell?.verticalDelta ?? '0Δ',
                            })}
                        >
                          Edit ${gazeId}
                        </button>
                      `
                    : nothing}
                </div>
              `;
            })}
          </div>
        </section>
      </section>
    `;
  }
}

export function registerL4OphthalmologyGlaucomaMotilityElements(): void {
  defineEmrElement('emr-gonioscopy-chart', EmrGonioscopyChartElement);
  defineEmrElement('emr-visual-field-summary', EmrVisualFieldSummaryElement);
  defineEmrElement('emr-hess-screen-chart', EmrHessScreenChartElement);
}
