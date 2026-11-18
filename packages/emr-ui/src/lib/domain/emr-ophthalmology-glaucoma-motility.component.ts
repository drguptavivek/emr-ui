import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
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
  GonioscopyGradingSystem,
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

// ---------------------------------------------------------------------------
// Pure helper functions (kept local so Angular SSR bundles have zero runtime
// imports from @drguptavivek/emr-controller)
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

const ASSESSMENT_STATUS_LABELS: Readonly<Record<ClinicalAssessmentStatus, string>> = {
  recorded: 'Recorded',
  'not-assessed': 'Not assessed',
  'unable-to-assess': 'Unable to assess',
  'not-applicable': 'Not applicable',
  declined: 'Declined',
  unknown: 'Unknown',
};

export const CLINICAL_ASSESSMENT_STATUS_OPTIONS: readonly {
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

// ===========================================================================
// 1. EmrGonioscopyChartComponent (`emr-gonioscopy-chart`)
// ===========================================================================

@Component({
  selector: 'emr-gonioscopy-chart',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-gonio"
      [attr.aria-labelledby]="headingId() ?? m.id + '-title'"
    >
      <header class="emr-gonio__header">
        <div class="emr-gonio__title-group">
          <span class="emr-gonio__eyebrow">ANTERIOR CHAMBER ANGLE · GONIOSCOPY</span>
          <h3 class="emr-gonio__title" [id]="headingId() ?? m.id + '-title'">
            {{ m.title ?? 'Bilateral 4-Quadrant Gonioscopy & Angle Evaluation' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-gonio__subtitle">{{ m.subtitle }}</p>
          }
        </div>

        <div class="emr-gonio__toolbar" role="group" aria-label="Gonioscopy indentation view mode and bilateral actions">
          <div class="emr-gonio__seg" role="group" aria-label="View mode">
            @for (mode of viewModes; track mode.id) {
              <button
                type="button"
                class="emr-gonio__chip"
                [attr.aria-pressed]="viewMode() === mode.id"
                [disabled]="!!m.readOnly"
                (click)="setViewMode(mode.id)"
              >
                {{ mode.label }}
              </button>
            }
          </div>
          @if (!m.readOnly) {
            <div class="emr-gonio__copy-group">
              <button
                type="button"
                class="emr-gonio__chip"
                (click)="copyEye('OD', 'OS')"
              >
                Copy OD → OS
              </button>
              <button
                type="button"
                class="emr-gonio__chip"
                (click)="copyEye('OS', 'OD')"
              >
                Copy OS → OD
              </button>
            </div>
          }
        </div>
      </header>

      <div class="emr-gonio__eyes">
        @for (eyeRec of eyes(); track eyeRec.eye) {
          @let occ = occludability(eyeRec);
          @let activeQuad = activeQuadrant(eyeRec);
          @let activeFind = activeFinding(eyeRec);
          <article class="emr-gonio__eye-card" [attr.aria-label]="eyeRec.eye + ' Gonioscopy'">
            <header class="emr-gonio__eye-header">
              <div class="emr-gonio__eye-title-row">
                <span class="emr-gonio__eye-pill" [attr.data-eye]="eyeRec.eye">{{ eyeRec.eye }}</span>
                <span class="emr-gonio__system-badge">{{ gradingSystemLabel(eyeRec.gradingSystem) }}</span>
                @if (eyeRec.lensUsed) {
                  <span class="emr-gonio__meta-tag">{{ eyeRec.lensUsed }}</span>
                }
                @if (eyeRec.vanHerickGrade) {
                  <span class="emr-gonio__meta-tag">Van Herick Grade {{ eyeRec.vanHerickGrade }}</span>
                }
              </div>

              <div class="emr-gonio__eye-badges">
                <span
                  class="emr-gonio__tone-badge"
                  [attr.data-tone]="occ.isOccludable ? 'danger' : 'success'"
                >
                  {{ occ.isOccludable ? 'Occludable (' + occ.closedQuadrantCount + '/4 closed)' : 'Open (' + occ.closedQuadrantCount + '/4 narrow)' }}
                </span>
                @if (occ.pasClockHourCount > 0) {
                  <span class="emr-gonio__tone-badge" data-tone="warning">
                    PAS {{ occ.pasClockHourCount }} clk hr
                  </span>
                }
                @if (eyeRec.overallBadge; as b) {
                  <span class="emr-gonio__tone-badge" [attr.data-tone]="b.tone">
                    {{ b.label }}
                  </span>
                }
              </div>
            </header>

            <div class="emr-gonio__status-row" role="group" [attr.aria-label]="eyeRec.eye + ' assessment status'">
              <span class="emr-gonio__label">Status:</span>
              @for (stOpt of statusOptions; track stOpt.value) {
                <button
                  type="button"
                  class="emr-gonio__status-pill"
                  [attr.aria-pressed]="(eyeRec.assessmentStatus ?? 'recorded') === stOpt.value"
                  [disabled]="!!m.readOnly"
                  (click)="setEyeAssessmentStatus(eyeRec.eye, stOpt.value)"
                >
                  {{ stOpt.label }}
                </button>
              }
            </div>

            @if (!isEyeRecorded(eyeRec)) {
              <div class="emr-gonio__fallback" role="status">
                <strong>{{ eyeRec.eye }} Angle Assessment: {{ statusLabel(eyeRec.assessmentStatus) }}</strong>
                <p>Interactive 4-quadrant gonioscopy grading is bypassed while status is {{ statusLabel(eyeRec.assessmentStatus) }}.</p>
                @if (!m.readOnly) {
                  <button
                    type="button"
                    class="emr-gonio__chip"
                    (click)="setEyeAssessmentStatus(eyeRec.eye, 'recorded')"
                  >
                    Record {{ eyeRec.eye }} Gonioscopy
                  </button>
                }
              </div>
            } @else {
              <div class="emr-gonio__diagram-row">
                <div class="emr-gonio__svg-wrap">
                  <svg
                    class="emr-gonio__svg"
                    viewBox="0 0 220 220"
                    role="img"
                    [attr.aria-label]="eyeRec.eye + ' 4-quadrant gonioscopy angle ring diagram'"
                  >
                    <!-- Concentric anatomical angle rings: Schwalbe's line, TM, Scleral Spur, Ciliary Body Band -->
                    <circle cx="110" cy="110" r="92" class="emr-gonio__ring-outer" />
                    <circle cx="110" cy="110" r="76" class="emr-gonio__ring-mid" />
                    <circle cx="110" cy="110" r="60" class="emr-gonio__ring-inner" />
                    <circle cx="110" cy="110" r="36" class="emr-gonio__ring-pupil" />

                    <!-- X-Cross diagonal dividers separating Superior, Inferior, Nasal, Temporal -->
                    <line x1="45" y1="45" x2="175" y2="175" class="emr-gonio__cross-line" />
                    <line x1="175" y1="45" x2="45" y2="175" class="emr-gonio__cross-line" />

                    <!-- Superior Quadrant (Top) -->
                    <g
                      class="emr-gonio__quad-group"
                      [attr.data-selected]="activeQuad === 'superior' ? 'true' : null"
                      (click)="selectQuadrant(eyeRec.eye, 'superior')"
                    >
                      <rect x="70" y="18" width="80" height="40" rx="8" class="emr-gonio__quad-box" />
                      <text x="110" y="33" text-anchor="middle" class="emr-gonio__quad-title">SUP</text>
                      <text x="110" y="49" text-anchor="middle" class="emr-gonio__quad-val">
                        {{ quadrantSummaryLabel(eyeRec.quadrants.superior) }}
                      </text>
                    </g>

                    <!-- Inferior Quadrant (Bottom) -->
                    <g
                      class="emr-gonio__quad-group"
                      [attr.data-selected]="activeQuad === 'inferior' ? 'true' : null"
                      (click)="selectQuadrant(eyeRec.eye, 'inferior')"
                    >
                      <rect x="70" y="162" width="80" height="40" rx="8" class="emr-gonio__quad-box" />
                      <text x="110" y="177" text-anchor="middle" class="emr-gonio__quad-title">INF</text>
                      <text x="110" y="193" text-anchor="middle" class="emr-gonio__quad-val">
                        {{ quadrantSummaryLabel(eyeRec.quadrants.inferior) }}
                      </text>
                    </g>

                    <!-- Anatomical Left Quadrant (OD: Temporal, OS: Nasal) -->
                    @let leftQuad = anatomicalLeftQuadrant(eyeRec);
                    <g
                      class="emr-gonio__quad-group"
                      [attr.data-selected]="activeQuad === leftQuad ? 'true' : null"
                      (click)="selectQuadrant(eyeRec.eye, leftQuad)"
                    >
                      <rect x="8" y="90" width="68" height="40" rx="8" class="emr-gonio__quad-box" />
                      <text x="42" y="105" text-anchor="middle" class="emr-gonio__quad-title">
                        {{ leftQuad === 'temporal' ? 'TEMP' : 'NAS' }}
                      </text>
                      <text x="42" y="121" text-anchor="middle" class="emr-gonio__quad-val">
                        {{ quadrantSummaryLabel(eyeRec.quadrants[leftQuad]) }}
                      </text>
                    </g>

                    <!-- Anatomical Right Quadrant (OD: Nasal, OS: Temporal) -->
                    @let rightQuad = anatomicalRightQuadrant(eyeRec);
                    <g
                      class="emr-gonio__quad-group"
                      [attr.data-selected]="activeQuad === rightQuad ? 'true' : null"
                      (click)="selectQuadrant(eyeRec.eye, rightQuad)"
                    >
                      <rect x="144" y="90" width="68" height="40" rx="8" class="emr-gonio__quad-box" />
                      <text x="178" y="105" text-anchor="middle" class="emr-gonio__quad-title">
                        {{ rightQuad === 'temporal' ? 'TEMP' : 'NAS' }}
                      </text>
                      <text x="178" y="121" text-anchor="middle" class="emr-gonio__quad-val">
                        {{ quadrantSummaryLabel(eyeRec.quadrants[rightQuad]) }}
                      </text>
                    </g>

                    <text x="110" y="114" text-anchor="middle" class="emr-gonio__center-label">
                      {{ eyeRec.eye }}
                    </text>
                  </svg>
                </div>

                <div class="emr-gonio__inspector">
                  <div class="emr-gonio__quad-tabs" role="tablist" [attr.aria-label]="eyeRec.eye + ' quadrants'">
                    @for (qId of quadrantIds; track qId) {
                      @let qFind = eyeRec.quadrants[qId];
                      <button
                        type="button"
                        role="tab"
                        class="emr-gonio__quad-tab"
                        [attr.aria-selected]="activeQuad === qId"
                        (click)="selectQuadrant(eyeRec.eye, qId)"
                      >
                        <span class="emr-gonio__quad-tab-name">{{ qId.toUpperCase() }}</span>
                        <span class="emr-gonio__quad-tab-grade">{{ quadrantSummaryLabel(qFind) }}</span>
                      </button>
                    }
                  </div>

                  @if (activeFind) {
                    <div class="emr-gonio__controls">
                      @if (viewMode() === 'static' || viewMode() === 'both') {
                        <div class="emr-gonio__control-group" role="group" [attr.aria-label]="eyeRec.eye + ' ' + activeQuad + ' static Shaffer grade'">
                          <span class="emr-gonio__label">Static Shaffer Grade ({{ activeQuad }}):</span>
                          <div class="emr-gonio__pill-row">
                            @for (gr of shafferGrades; track gr) {
                              <button
                                type="button"
                                class="emr-gonio__grade-pill"
                                [attr.aria-pressed]="activeFind.staticGrade === gr"
                                [disabled]="!!m.readOnly"
                                (click)="setQuadrantGrade(eyeRec.eye, activeQuad, 'static', gr)"
                              >
                                {{ gr === 'slit' ? 'Slit' : 'Gr ' + gr }}
                              </button>
                            }
                          </div>
                        </div>
                      }

                      @if (viewMode() === 'dynamic' || viewMode() === 'both') {
                        <div class="emr-gonio__control-group" role="group" [attr.aria-label]="eyeRec.eye + ' ' + activeQuad + ' dynamic indentation grade'">
                          <span class="emr-gonio__label">Dynamic Indentation Grade ({{ activeQuad }}):</span>
                          <div class="emr-gonio__pill-row">
                            @for (gr of shafferGrades; track gr) {
                              <button
                                type="button"
                                class="emr-gonio__grade-pill"
                                [attr.aria-pressed]="activeFind.dynamicGrade === gr"
                                [disabled]="!!m.readOnly"
                                (click)="setQuadrantGrade(eyeRec.eye, activeQuad, 'dynamic', gr)"
                              >
                                {{ gr === 'slit' ? 'Slit' : 'Gr ' + gr }}
                              </button>
                            }
                          </div>
                        </div>
                      }

                      <div class="emr-gonio__control-group" role="group" [attr.aria-label]="eyeRec.eye + ' ' + activeQuad + ' trabecular pigmentation'">
                        <span class="emr-gonio__label">TM Pigmentation (0–4+):</span>
                        <div class="emr-gonio__pill-row">
                          @for (p of pigmentationGrades; track p) {
                            <button
                              type="button"
                              class="emr-gonio__grade-pill"
                              [attr.aria-pressed]="activeFind.pigmentation === p"
                              [disabled]="!!m.readOnly"
                              (click)="setQuadrantPigmentation(eyeRec.eye, activeQuad, p)"
                            >
                              {{ p }}+
                            </button>
                          }
                        </div>
                      </div>

                      <div class="emr-gonio__finding-flags">
                        @if (activeFind.deepestStructure) {
                          <span class="emr-gonio__meta-tag">Structure: {{ activeFind.deepestStructure }}</span>
                        }
                        @if (activeFind.irisConfiguration) {
                          <span class="emr-gonio__meta-tag">Iris: {{ activeFind.irisConfiguration }}</span>
                        }
                        @if (activeFind.pasPresent) {
                          <span class="emr-gonio__tone-badge" data-tone="warning">PAS Present</span>
                        }
                        @if (activeFind.neovascularization) {
                          <span class="emr-gonio__tone-badge" data-tone="danger">NVA Present</span>
                        }
                        @if (activeFind.sampaolesiLine) {
                          <span class="emr-gonio__tone-badge" data-tone="info">Sampaolesi Line</span>
                        }
                        @if (activeFind.note) {
                          <span class="emr-gonio__note">{{ activeFind.note }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <div class="emr-gonio__pas-bar" role="group" [attr.aria-label]="eyeRec.eye + ' PAS clock hours'">
                <span class="emr-gonio__label">PAS Clock Hours (1–12):</span>
                <div class="emr-gonio__clock-pills">
                  @for (hr of clockHours; track hr) {
                    <button
                      type="button"
                      class="emr-gonio__clock-pill"
                      [attr.aria-pressed]="hasPasClockHour(eyeRec, hr)"
                      [disabled]="!!m.readOnly"
                      (click)="togglePasClockHour(eyeRec.eye, hr)"
                    >
                      {{ hr }} o'clock
                    </button>
                  }
                </div>
              </div>

              @if (eyeRec.spaethNotationSummary || eyeRec.notes) {
                <footer class="emr-gonio__eye-footer">
                  @if (eyeRec.spaethNotationSummary) {
                    <span class="emr-gonio__spaeth">Spaeth: {{ eyeRec.spaethNotationSummary }}</span>
                  }
                  @if (eyeRec.notes) {
                    <span class="emr-gonio__note">{{ eyeRec.notes }}</span>
                  }
                </footer>
              }
            }
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); }
    .emr-gonio {
      border: 1px solid var(--emr-border);
      border-radius: 12px;
      background: var(--emr-surface);
      padding: 16px;
      display: grid;
      gap: 14px;
    }
    .emr-gonio__header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      border-bottom: 1px solid var(--emr-border);
      padding-bottom: 12px;
    }
    .emr-gonio__eyebrow {
      font-size: var(--emr-text-xs);
      font-weight: var(--emr-weight-bold);
      color: var(--emr-primary);
      letter-spacing: 0.05em;
    }
    .emr-gonio__title {
      margin: 2px 0 0;
      font-size: var(--emr-text-lg);
      font-weight: var(--emr-weight-bold);
    }
    .emr-gonio__subtitle {
      margin: 4px 0 0;
      font-size: var(--emr-text-sm);
      color: var(--emr-text-muted);
    }
    .emr-gonio__toolbar, .emr-gonio__seg, .emr-gonio__copy-group {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
    .emr-gonio__chip, .emr-gonio__grade-pill, .emr-gonio__clock-pill, .emr-gonio__status-pill {
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
    .emr-gonio__chip[aria-pressed="true"],
    .emr-gonio__grade-pill[aria-pressed="true"],
    .emr-gonio__clock-pill[aria-pressed="true"],
    .emr-gonio__status-pill[aria-pressed="true"] {
      border-color: var(--emr-primary);
      background: var(--emr-primary-soft);
      color: var(--emr-primary);
    }
    .emr-gonio__eyes {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 14px;
    }
    .emr-gonio__eye-card {
      border: 1px solid var(--emr-border);
      border-radius: 10px;
      background: var(--emr-surface-soft);
      padding: 12px;
      display: grid;
      gap: 12px;
    }
    .emr-gonio__eye-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .emr-gonio__eye-title-row, .emr-gonio__eye-badges, .emr-gonio__status-row, .emr-gonio__pill-row, .emr-gonio__clock-pills, .emr-gonio__finding-flags {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
    .emr-gonio__eye-pill {
      padding: 2px 8px;
      border-radius: 6px;
      background: var(--emr-primary-soft);
      color: var(--emr-primary);
      font-weight: var(--emr-weight-bold);
      font-size: var(--emr-text-sm);
    }
    .emr-gonio__system-badge, .emr-gonio__meta-tag {
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid var(--emr-border);
      background: var(--emr-surface);
      font-size: var(--emr-text-xs);
    }
    .emr-gonio__tone-badge {
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid var(--emr-border);
      background: var(--emr-surface);
      font-size: var(--emr-text-xs);
      font-weight: var(--emr-weight-bold);
    }
    .emr-gonio__tone-badge[data-tone="danger"] {
      border-color: var(--emr-danger);
      color: var(--emr-danger);
    }
    .emr-gonio__tone-badge[data-tone="warning"] {
      border-color: var(--emr-warning);
      color: var(--emr-warning);
    }
    .emr-gonio__tone-badge[data-tone="success"] {
      border-color: var(--emr-success);
      color: var(--emr-success);
    }
    .emr-gonio__tone-badge[data-tone="info"] {
      border-color: var(--emr-info);
      color: var(--emr-info);
    }
    .emr-gonio__diagram-row {
      display: grid;
      grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
      gap: 12px;
      align-items: start;
    }
    .emr-gonio__svg {
      width: 100%;
      max-width: 220px;
      height: auto;
      display: block;
    }
    .emr-gonio__ring-outer { fill: var(--emr-surface); stroke: var(--emr-border); stroke-width: 2; }
    .emr-gonio__ring-mid { fill: none; stroke: var(--emr-border); stroke-dasharray: 4 3; stroke-width: 1; }
    .emr-gonio__ring-inner { fill: none; stroke: var(--emr-border); stroke-width: 1; }
    .emr-gonio__ring-pupil { fill: var(--emr-surface-soft); stroke: var(--emr-primary); stroke-width: 1.5; }
    .emr-gonio__cross-line { stroke: var(--emr-border); stroke-width: 1.5; }
    .emr-gonio__quad-group { cursor: pointer; }
    .emr-gonio__quad-box { fill: var(--emr-surface); stroke: var(--emr-border); stroke-width: 1.5; }
    .emr-gonio__quad-group[data-selected="true"] .emr-gonio__quad-box {
      fill: var(--emr-primary-soft);
      stroke: var(--emr-primary);
      stroke-width: 2.5;
    }
    .emr-gonio__quad-title { fill: var(--emr-text-muted); font-size: 10px; font-weight: bold; }
    .emr-gonio__quad-val { fill: var(--emr-text); font-size: 11px; font-weight: bold; }
    .emr-gonio__center-label { fill: var(--emr-primary); font-size: 13px; font-weight: bold; }
    .emr-gonio__inspector { display: grid; gap: 10px; }
    .emr-gonio__quad-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
    .emr-gonio__quad-tab {
      padding: 6px;
      border: 1px solid var(--emr-border);
      border-radius: 6px;
      background: var(--emr-surface);
      color: var(--emr-text);
      display: grid;
      gap: 2px;
      text-align: center;
      cursor: pointer;
      font: inherit;
    }
    .emr-gonio__quad-tab[aria-selected="true"] {
      border-color: var(--emr-primary);
      background: var(--emr-primary-soft);
    }
    .emr-gonio__quad-tab-name { font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
    .emr-gonio__quad-tab-grade { font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); }
    .emr-gonio__controls { display: grid; gap: 8px; }
    .emr-gonio__control-group { display: grid; gap: 4px; }
    .emr-gonio__label { font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); color: var(--emr-text-muted); }
    .emr-gonio__pas-bar, .emr-gonio__eye-footer, .emr-gonio__fallback {
      border-top: 1px solid var(--emr-border);
      padding-top: 8px;
      display: grid;
      gap: 6px;
    }
    .emr-gonio__spaeth { font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); }
    .emr-gonio__note { font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
    :host-context(.emr-print) .emr-gonio__toolbar { display: none; }
    @media print { .emr-gonio__toolbar { display: none; } }
  `],
})
export class EmrGonioscopyChartComponent {
  readonly model = input.required<EmrGonioscopyChartViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrGonioscopyChartIntent>();

  readonly quadrantIds = GONIOSCOPY_QUADRANT_IDS;
  readonly shafferGrades = SHAFFER_GRADES;
  readonly pigmentationGrades = GONIOSCOPY_PIGMENTATION_GRADES;
  readonly clockHours = GONIOSCOPY_CLOCK_HOURS;
  readonly statusOptions = CLINICAL_ASSESSMENT_STATUS_OPTIONS;
  readonly viewModes: readonly { readonly id: 'static' | 'dynamic' | 'both'; readonly label: string }[] = [
    { id: 'static', label: 'Static Only' },
    { id: 'dynamic', label: 'Dynamic (Indentation)' },
    { id: 'both', label: 'Static + Dynamic' },
  ];

  viewMode(): 'static' | 'dynamic' | 'both' {
    return this.model().viewMode ?? 'both';
  }

  eyes(): readonly GonioscopyEyeRecord[] {
    const m = this.model();
    return [m.od, m.os];
  }

  occludability(eye: GonioscopyEyeRecord) {
    return summarizeGonioscopyOccludability(eye);
  }

  isEyeRecorded(eye: GonioscopyEyeRecord): boolean {
    return !eye.assessmentStatus || eye.assessmentStatus === 'recorded';
  }

  statusLabel(status: ClinicalAssessmentStatus | undefined): string {
    return ASSESSMENT_STATUS_LABELS[status ?? 'recorded'];
  }

  gradingSystemLabel(system: GonioscopyGradingSystem): string {
    if (system === 'spaeth') return 'Spaeth System';
    if (system === 'scheie') return 'Scheie System';
    return 'Shaffer System';
  }

  anatomicalLeftQuadrant(eye: GonioscopyEyeRecord): GonioscopyQuadrantId {
    return eye.eye === 'OD' ? 'temporal' : 'nasal';
  }

  anatomicalRightQuadrant(eye: GonioscopyEyeRecord): GonioscopyQuadrantId {
    return eye.eye === 'OD' ? 'nasal' : 'temporal';
  }

  activeQuadrant(eye: GonioscopyEyeRecord): GonioscopyQuadrantId {
    const m = this.model();
    if (m.selectedEye === eye.eye && m.selectedQuadrant) {
      return m.selectedQuadrant;
    }
    return m.selectedQuadrant ?? 'superior';
  }

  activeFinding(eye: GonioscopyEyeRecord): GonioscopyQuadrantFinding {
    return eye.quadrants[this.activeQuadrant(eye)];
  }

  quadrantSummaryLabel(finding: GonioscopyQuadrantFinding): string {
    const mode = this.viewMode();
    if (mode === 'static') return `Gr ${finding.staticGrade}`;
    if (mode === 'dynamic') return `Gr ${finding.dynamicGrade ?? finding.staticGrade}`;
    const dyn = finding.dynamicGrade ? `→${finding.dynamicGrade}` : '';
    const struct = finding.deepestStructure ? ` (${finding.deepestStructure})` : '';
    return `${finding.staticGrade}${dyn}${struct}`;
  }

  hasPasClockHour(eye: GonioscopyEyeRecord, hour: number): boolean {
    return (eye.pasClockHours ?? []).includes(hour);
  }

  selectQuadrant(eye: 'OD' | 'OS', quadrant: GonioscopyQuadrantId): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'quadrantSelected', eye, quadrant });
  }

  setQuadrantGrade(
    eye: 'OD' | 'OS',
    quadrant: GonioscopyQuadrantId,
    mode: 'static' | 'dynamic',
    grade: ShafferGrade,
  ): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'quadrantGradeChanged', eye, quadrant, mode, grade });
  }

  setQuadrantPigmentation(
    eye: 'OD' | 'OS',
    quadrant: GonioscopyQuadrantId,
    pigmentation: 0 | 1 | 2 | 3 | 4,
  ): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'quadrantPigmentationChanged', eye, quadrant, pigmentation });
  }

  togglePasClockHour(eye: 'OD' | 'OS', clockHour: number): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'pasClockHourToggled', eye, clockHour });
  }

  setViewMode(viewMode: 'static' | 'dynamic' | 'both'): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'viewModeChanged', viewMode });
  }

  copyEye(fromEye: 'OD' | 'OS', toEye: 'OD' | 'OS'): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'copyEyeRequested', fromEye, toEye });
  }

  setEyeAssessmentStatus(eye: 'OD' | 'OS', status: ClinicalAssessmentStatus | undefined): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'eyeAssessmentStatusChanged', eye, status });
  }
}

// ===========================================================================
// 2. EmrVisualFieldSummaryComponent (`emr-visual-field-summary`)
// ===========================================================================

@Component({
  selector: 'emr-visual-field-summary',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-vf"
      [attr.aria-labelledby]="headingId() ?? m.id + '-title'"
    >
      <header class="emr-vf__header">
        <div class="emr-vf__title-group">
          <span class="emr-vf__eyebrow">AUTOMATED PERIMETRY · VISUAL FIELD SUMMARY</span>
          <h3 class="emr-vf__title" [id]="headingId() ?? m.id + '-title'">
            {{ m.title ?? 'Bilateral Humphrey / Octopus Visual Field Summary' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-vf__subtitle">{{ m.subtitle }}</p>
          }
        </div>

        <div class="emr-vf__map-switcher" role="group" aria-label="Deviation map type">
          <button
            type="button"
            class="emr-vf__chip"
            [attr.aria-pressed]="activeMapType() === 'pattern-deviation'"
            [disabled]="!!m.readOnly"
            (click)="setMapType('pattern-deviation')"
          >
            Pattern Deviation Map
          </button>
          <button
            type="button"
            class="emr-vf__chip"
            [attr.aria-pressed]="activeMapType() === 'total-deviation'"
            [disabled]="!!m.readOnly"
            (click)="setMapType('total-deviation')"
          >
            Total Deviation Map
          </button>
        </div>
      </header>

      <div class="emr-vf__eyes">
        @for (eyeRec of eyes(); track eyeRec.eye) {
          @let rel = reliability(eyeRec);
          @let selPt = selectedPoint(eyeRec);
          <article class="emr-vf__eye-card" [attr.aria-label]="eyeRec.eye + ' Visual Field'">
            <header class="emr-vf__eye-header">
              <div class="emr-vf__eye-title-row">
                <span class="emr-vf__eye-pill">{{ eyeRec.eye }}</span>
                <span class="emr-vf__strategy">{{ eyeRec.strategy }}</span>
                <span class="emr-vf__date">{{ eyeRec.testDate }}</span>
                @if (eyeRec.pupilDiameterMm !== undefined) {
                  <span class="emr-vf__meta">Pupil {{ eyeRec.pupilDiameterMm }} mm</span>
                }
              </div>

              <div class="emr-vf__eye-badges">
                <span class="emr-vf__tone-badge" [attr.data-tone]="reliabilityTone(rel)">
                  {{ rel.toUpperCase() }}
                </span>
                @if (eyeRec.badge; as b) {
                  <span class="emr-vf__tone-badge" [attr.data-tone]="b.tone">
                    {{ b.label }}
                  </span>
                }
              </div>
            </header>

            <div class="emr-vf__status-row" role="group" [attr.aria-label]="eyeRec.eye + ' assessment status'">
              <span class="emr-vf__label">Status:</span>
              @for (stOpt of statusOptions; track stOpt.value) {
                <button
                  type="button"
                  class="emr-vf__status-pill"
                  [attr.aria-pressed]="(eyeRec.assessmentStatus ?? 'recorded') === stOpt.value"
                  [disabled]="!!m.readOnly"
                  (click)="setEyeAssessmentStatus(eyeRec.eye, stOpt.value)"
                >
                  {{ stOpt.label }}
                </button>
              }
            </div>

            @if (!isEyeRecorded(eyeRec)) {
              <div class="emr-vf__fallback" role="status">
                <strong>{{ eyeRec.eye }} Perimetry: {{ statusLabel(eyeRec.assessmentStatus) }}</strong>
                <p>Visual field indices and deviation plot are unavailable while status is {{ statusLabel(eyeRec.assessmentStatus) }}.</p>
              </div>
            } @else {
              <!-- Reliability Strip -->
              <div class="emr-vf__reliability-strip" role="group" [attr.aria-label]="eyeRec.eye + ' reliability indices'">
                <div class="emr-vf__rel-item">
                  <span class="emr-vf__rel-label">Fixation Losses (FL)</span>
                  <strong class="emr-vf__rel-val">{{ eyeRec.fixationLosses }}</strong>
                </div>
                <div class="emr-vf__rel-item">
                  <span class="emr-vf__rel-label">False Positives (FP)</span>
                  <strong class="emr-vf__rel-val">{{ eyeRec.falsePositivesPct }}%</strong>
                </div>
                <div class="emr-vf__rel-item">
                  <span class="emr-vf__rel-label">False Negatives (FN)</span>
                  <strong class="emr-vf__rel-val">{{ eyeRec.falseNegativesPct }}%</strong>
                </div>
              </div>

              <!-- Global Indices Grid -->
              <div class="emr-vf__indices-grid" role="group" [attr.aria-label]="eyeRec.eye + ' global indices'">
                <div class="emr-vf__index-tile">
                  <span class="emr-vf__index-label">VFI</span>
                  <strong class="emr-vf__index-val">
                    {{ eyeRec.vfiPct !== undefined ? eyeRec.vfiPct + '%' : '—' }}
                  </strong>
                </div>
                <div class="emr-vf__index-tile">
                  <span class="emr-vf__index-label">MD</span>
                  <strong class="emr-vf__index-val">{{ formatDb(eyeRec.mdDb) }} dB</strong>
                  @if (eyeRec.mdProbability) {
                    <small class="emr-vf__index-prob">{{ eyeRec.mdProbability }}</small>
                  }
                </div>
                <div class="emr-vf__index-tile">
                  <span class="emr-vf__index-label">PSD</span>
                  <strong class="emr-vf__index-val">{{ eyeRec.psdDb.toFixed(2) }} dB</strong>
                  @if (eyeRec.psdProbability) {
                    <small class="emr-vf__index-prob">{{ eyeRec.psdProbability }}</small>
                  }
                </div>
                <div class="emr-vf__index-tile">
                  <span class="emr-vf__index-label">GHT</span>
                  <span class="emr-vf__tone-badge" [attr.data-tone]="ghtTone(eyeRec.ght)">
                    {{ eyeRec.ght }}
                  </span>
                </div>
              </div>

              <!-- Circular SVG Visual Field Map & Point Inspector -->
              <div class="emr-vf__plot-row">
                <svg
                  class="emr-vf__svg"
                  viewBox="0 0 220 220"
                  role="img"
                  [attr.aria-label]="eyeRec.eye + ' ' + activeMapType() + ' visual field map'"
                >
                  <circle cx="110" cy="110" r="88" class="emr-vf__circle-outer" />
                  <circle cx="110" cy="110" r="58" class="emr-vf__circle-mid" />
                  <circle cx="110" cy="110" r="29" class="emr-vf__circle-inner" />
                  <line x1="22" y1="110" x2="198" y2="110" class="emr-vf__axis" />
                  <line x1="110" y1="22" x2="110" y2="198" class="emr-vf__axis" />

                  @for (pt of eyeRec.points; track pt.id) {
                    @let cx = pointSvgX(pt);
                    @let cy = pointSvgY(pt);
                    @let isSel = selPt?.id === pt.id;
                    <g
                      class="emr-vf__pt-group"
                      [attr.data-probability]="pt.probability"
                      [attr.data-selected]="isSel ? 'true' : null"
                      (click)="selectPoint(eyeRec.eye, pt.id)"
                    >
                      @if (pt.probability === 'normal') {
                        <circle [attr.cx]="cx" [attr.cy]="cy" r="4" class="emr-vf__pt-normal" />
                      } @else if (pt.probability === 'absolute') {
                        <rect [attr.x]="cx - 7" [attr.y]="cy - 7" width="14" height="14" class="emr-vf__pt-absolute" />
                      } @else {
                        <rect [attr.x]="cx - 7" [attr.y]="cy - 7" width="14" height="14" class="emr-vf__pt-stipple" />
                        <text [attr.x]="cx" [attr.y]="cy + 3" text-anchor="middle" class="emr-vf__pt-glyph">
                          {{ probabilityGlyph(pt.probability) }}
                        </text>
                      }
                      <text [attr.x]="cx" [attr.y]="cy + 15" text-anchor="middle" class="emr-vf__pt-db">
                        {{ pointDeviationValue(pt) }}
                      </text>
                    </g>
                  }
                </svg>

                <div class="emr-vf__inspector">
                  @if (selPt; as sp) {
                    <div class="emr-vf__point-detail">
                      <span class="emr-vf__label">Selected Point ({{ sp.id }}):</span>
                      <strong>({{ sp.xDeg }}°, {{ sp.yDeg }}°) · {{ sp.probability }}</strong>
                      <span>
                        TD: {{ formatDb(sp.totalDeviationDb) }} dB · PD: {{ formatDb(sp.patternDeviationDb) }} dB
                      </span>
                    </div>
                  }

                  <div class="emr-vf__point-buttons" role="group" [attr.aria-label]="eyeRec.eye + ' sector points'">
                    @for (pt of eyeRec.points; track pt.id) {
                      <button
                        type="button"
                        class="emr-vf__chip"
                        [attr.aria-pressed]="selPt?.id === pt.id"
                        (click)="selectPoint(eyeRec.eye, pt.id)"
                      >
                        {{ pt.id }} ({{ pointDeviationValue(pt) }} dB · {{ pt.probability }})
                      </button>
                    }
                  </div>

                  <div class="emr-vf__pattern-group" role="group" [attr.aria-label]="eyeRec.eye + ' defect pattern classification'">
                    <span class="emr-vf__label">Defect Pattern: {{ eyeRec.defectPatternLabel ?? 'Unclassified' }}</span>
                    @if (!m.readOnly) {
                      <div class="emr-vf__pattern-chips">
                        @for (pat of defectPatterns; track pat) {
                          <button
                            type="button"
                            class="emr-vf__chip"
                            [attr.aria-pressed]="eyeRec.defectPatternLabel === pat"
                            (click)="setDefectPattern(eyeRec.eye, pat)"
                          >
                            {{ pat }}
                          </button>
                        }
                      </div>
                    }
                  </div>

                  @if (eyeRec.progressionSummary) {
                    <p class="emr-vf__progression">GPA / Trend: {{ eyeRec.progressionSummary }}</p>
                  }
                </div>
              </div>
            }
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); }
    .emr-vf {
      border: 1px solid var(--emr-border);
      border-radius: 12px;
      background: var(--emr-surface);
      padding: 16px;
      display: grid;
      gap: 14px;
    }
    .emr-vf__header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      border-bottom: 1px solid var(--emr-border);
      padding-bottom: 12px;
    }
    .emr-vf__eyebrow {
      font-size: var(--emr-text-xs);
      font-weight: var(--emr-weight-bold);
      color: var(--emr-primary);
      letter-spacing: 0.05em;
    }
    .emr-vf__title { margin: 2px 0 0; font-size: var(--emr-text-lg); font-weight: var(--emr-weight-bold); }
    .emr-vf__subtitle { margin: 4px 0 0; font-size: var(--emr-text-sm); color: var(--emr-text-muted); }
    .emr-vf__map-switcher, .emr-vf__eye-title-row, .emr-vf__eye-badges, .emr-vf__status-row, .emr-vf__point-buttons, .emr-vf__pattern-chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
    .emr-vf__chip, .emr-vf__status-pill {
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
    .emr-vf__chip[aria-pressed="true"], .emr-vf__status-pill[aria-pressed="true"] {
      border-color: var(--emr-primary);
      background: var(--emr-primary-soft);
      color: var(--emr-primary);
    }
    .emr-vf__eyes {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 14px;
    }
    .emr-vf__eye-card {
      border: 1px solid var(--emr-border);
      border-radius: 10px;
      background: var(--emr-surface-soft);
      padding: 12px;
      display: grid;
      gap: 10px;
    }
    .emr-vf__eye-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .emr-vf__eye-pill {
      padding: 2px 8px;
      border-radius: 6px;
      background: var(--emr-primary-soft);
      color: var(--emr-primary);
      font-weight: var(--emr-weight-bold);
      font-size: var(--emr-text-sm);
    }
    .emr-vf__strategy, .emr-vf__date, .emr-vf__meta {
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid var(--emr-border);
      background: var(--emr-surface);
      font-size: var(--emr-text-xs);
    }
    .emr-vf__tone-badge {
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid var(--emr-border);
      background: var(--emr-surface);
      font-size: var(--emr-text-xs);
      font-weight: var(--emr-weight-bold);
    }
    .emr-vf__tone-badge[data-tone="danger"] { border-color: var(--emr-danger); color: var(--emr-danger); }
    .emr-vf__tone-badge[data-tone="warning"] { border-color: var(--emr-warning); color: var(--emr-warning); }
    .emr-vf__tone-badge[data-tone="success"] { border-color: var(--emr-success); color: var(--emr-success); }
    .emr-vf__tone-badge[data-tone="info"] { border-color: var(--emr-info); color: var(--emr-info); }
    .emr-vf__reliability-strip {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      padding: 8px;
      border: 1px solid var(--emr-border);
      border-radius: 8px;
      background: var(--emr-surface);
    }
    .emr-vf__rel-item, .emr-vf__index-tile {
      display: grid;
      gap: 2px;
    }
    .emr-vf__rel-label, .emr-vf__index-label, .emr-vf__label {
      font-size: var(--emr-text-xs);
      color: var(--emr-text-muted);
      font-weight: var(--emr-weight-bold);
    }
    .emr-vf__rel-val, .emr-vf__index-val {
      font-family: var(--emr-font-mono);
      font-size: var(--emr-text-sm);
    }
    .emr-vf__indices-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      padding: 8px;
      border: 1px solid var(--emr-border);
      border-radius: 8px;
      background: var(--emr-surface);
    }
    .emr-vf__plot-row {
      display: grid;
      grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
      gap: 12px;
      align-items: start;
    }
    .emr-vf__svg { width: 100%; max-width: 220px; height: auto; display: block; }
    .emr-vf__circle-outer { fill: var(--emr-surface); stroke: var(--emr-border); stroke-width: 2; }
    .emr-vf__circle-mid, .emr-vf__circle-inner { fill: none; stroke: var(--emr-border); stroke-dasharray: 3 3; stroke-width: 1; }
    .emr-vf__axis { stroke: var(--emr-border); stroke-width: 1; }
    .emr-vf__pt-group { cursor: pointer; }
    .emr-vf__pt-normal { fill: var(--emr-text-muted); }
    .emr-vf__pt-stipple { fill: var(--emr-surface-soft); stroke: var(--emr-warning); stroke-width: 1.5; }
    .emr-vf__pt-group[data-probability="p<1%"] .emr-vf__pt-stipple,
    .emr-vf__pt-group[data-probability="p<0.5%"] .emr-vf__pt-stipple {
      stroke: var(--emr-danger);
    }
    .emr-vf__pt-absolute { fill: var(--emr-text); stroke: var(--emr-danger); stroke-width: 1.5; }
    .emr-vf__pt-group[data-selected="true"] rect,
    .emr-vf__pt-group[data-selected="true"] circle {
      stroke: var(--emr-primary);
      stroke-width: 2.5;
    }
    .emr-vf__pt-glyph { fill: var(--emr-text); font-size: 9px; font-weight: bold; }
    .emr-vf__pt-db { fill: var(--emr-text); font-size: 8px; }
    .emr-vf__inspector, .emr-vf__point-detail, .emr-vf__pattern-group { display: grid; gap: 6px; }
    .emr-vf__progression { margin: 0; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); color: var(--emr-primary); }
  `],
})
export class EmrVisualFieldSummaryComponent {
  readonly model = input.required<EmrVisualFieldSummaryViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrVisualFieldSummaryIntent>();

  readonly statusOptions = CLINICAL_ASSESSMENT_STATUS_OPTIONS;
  readonly defectPatterns = VISUAL_FIELD_DEFECT_PATTERNS;

  activeMapType(): 'pattern-deviation' | 'total-deviation' {
    return this.model().activeMapType ?? 'pattern-deviation';
  }

  eyes(): readonly VisualFieldEyeRecord[] {
    const m = this.model();
    return [m.od, m.os];
  }

  isEyeRecorded(eye: VisualFieldEyeRecord): boolean {
    return !eye.assessmentStatus || eye.assessmentStatus === 'recorded';
  }

  statusLabel(status: ClinicalAssessmentStatus | undefined): string {
    return ASSESSMENT_STATUS_LABELS[status ?? 'recorded'];
  }

  reliability(eye: VisualFieldEyeRecord): 'reliable' | 'caution' | 'unreliable' {
    return (
      eye.reliabilityFlag ??
      evaluateVisualFieldReliability(
        eye.fixationLosses,
        eye.falsePositivesPct,
        eye.falseNegativesPct,
      )
    );
  }

  reliabilityTone(flag: 'reliable' | 'caution' | 'unreliable'): EmrTone {
    if (flag === 'unreliable') return 'danger';
    if (flag === 'caution') return 'warning';
    return 'success';
  }

  ghtTone(ght: GhtClassification): EmrTone {
    if (ght === 'Outside Normal Limits') return 'danger';
    if (ght === 'Borderline' || ght === 'Generalized Reduction of Sensitivity') return 'warning';
    if (ght === 'Abnormally High Sensitivity') return 'info';
    return 'success';
  }

  formatDb(val: number): string {
    return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
  }

  pointSvgX(pt: VisualFieldSectorPoint): number {
    return Math.round(110 + (pt.xDeg / 30) * 80);
  }

  pointSvgY(pt: VisualFieldSectorPoint): number {
    return Math.round(110 - (pt.yDeg / 30) * 80);
  }

  pointDeviationValue(pt: VisualFieldSectorPoint): number {
    return this.activeMapType() === 'pattern-deviation'
      ? pt.patternDeviationDb
      : pt.totalDeviationDb;
  }

  probabilityGlyph(prob: VisualFieldDefectProbability): string {
    if (prob === 'p<5%') return '·';
    if (prob === 'p<2%') return '∷';
    if (prob === 'p<1%') return '▒';
    if (prob === 'p<0.5%') return '▓';
    if (prob === 'absolute') return '■';
    return '•';
  }

  selectedPoint(eye: VisualFieldEyeRecord): VisualFieldSectorPoint | undefined {
    const m = this.model();
    if (m.selectedPointId && (!m.selectedEye || m.selectedEye === eye.eye)) {
      const found = eye.points.find((p) => p.id === m.selectedPointId);
      if (found) return found;
    }
    return eye.points[0];
  }

  setMapType(mapType: 'pattern-deviation' | 'total-deviation'): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'mapTypeChanged', mapType });
  }

  selectPoint(eye: 'OD' | 'OS', pointId: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'pointSelected', eye, pointId });
  }

  setDefectPattern(eye: 'OD' | 'OS', patternLabel: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'defectPatternChanged', eye, patternLabel });
  }

  setEyeAssessmentStatus(eye: 'OD' | 'OS', status: ClinicalAssessmentStatus | undefined): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'eyeAssessmentStatusChanged', eye, status });
  }
}

// ===========================================================================
// 3. EmrHessScreenChartComponent (`emr-hess-screen-chart`)
// ===========================================================================

@Component({
  selector: 'emr-hess-screen-chart',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-hess"
      [attr.aria-labelledby]="headingId() ?? m.id + '-title'"
    >
      <header class="emr-hess__header">
        <div class="emr-hess__title-group">
          <span class="emr-hess__eyebrow">STRABISMUS & DIPLOPIA · HESS TANGENT SCREEN & 9-GAZE PBCT</span>
          <h3 class="emr-hess__title" [id]="headingId() ?? m.id + '-title'">
            {{ m.title ?? 'Hess Screen / Lees Tangent Chart & 9-Gaze Prism Bar Cover Test' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-hess__subtitle">{{ m.subtitle }}</p>
          }
          @if (m.diagnosisSummary) {
            <p class="emr-hess__diagnosis">Summary: {{ m.diagnosisSummary }}</p>
          }
        </div>

        <div class="emr-hess__mode-switcher" role="group" aria-label="PBCT fixation distance mode">
          <button
            type="button"
            class="emr-hess__chip"
            [attr.aria-pressed]="activeDistanceMode() === 'distance-6m'"
            [disabled]="!!m.readOnly"
            (click)="setDistanceMode('distance-6m')"
          >
            Distance (6m)
          </button>
          <button
            type="button"
            class="emr-hess__chip"
            [attr.aria-pressed]="activeDistanceMode() === 'near-33cm'"
            [disabled]="!!m.readOnly"
            (click)="setDistanceMode('near-33cm')"
          >
            Near (33cm)
          </button>
        </div>
      </header>

      <!-- Side-by-side Left Chart (OS Fixing / OD Plotted) & Right Chart (OD Fixing / OS Plotted) -->
      <div class="emr-hess__charts">
        @for (ch of charts(); track ch.key) {
          @let innerRatio = fieldAreaSummary(ch.record.innerFieldPoints);
          @let outerRatio = fieldAreaSummary(ch.record.outerFieldPoints);
          @let activeGaze = selectedGaze();
          <article class="emr-hess__chart-card" [attr.aria-label]="ch.label">
            <header class="emr-hess__chart-header">
              <div class="emr-hess__chart-titles">
                <span class="emr-hess__eye-pill">{{ ch.record.plottedEye }} Plotted</span>
                <strong class="emr-hess__chart-name">{{ ch.label }}</strong>
              </div>
              <div class="emr-hess__muscle-badges">
                @if (ch.record.primaryRestrictionMuscle) {
                  <span class="emr-hess__tone-badge" data-tone="danger">
                    Underaction: {{ ch.record.primaryRestrictionMuscle }}
                  </span>
                }
                @if (ch.record.primaryOveractionMuscle) {
                  <span class="emr-hess__tone-badge" data-tone="warning">
                    Overaction: {{ ch.record.primaryOveractionMuscle }}
                  </span>
                }
              </div>
            </header>

            <div class="emr-hess__span-summary">
              <span>Inner (15°) Span: {{ innerRatio.plottedSpanX }}°×{{ innerRatio.plottedSpanY }}° (Ref {{ innerRatio.expectedSpanX }}°×{{ innerRatio.expectedSpanY }}°)</span>
              <span>Outer (30°) Span: {{ outerRatio.plottedSpanX }}°×{{ outerRatio.plottedSpanY }}° (Ref {{ outerRatio.expectedSpanX }}°×{{ outerRatio.expectedSpanY }}°)</span>
            </div>

            <div class="emr-hess__svg-row">
              <svg
                class="emr-hess__svg"
                viewBox="0 0 220 220"
                role="img"
                [attr.aria-label]="ch.label + ' tangent coordinate grid (-30° to +30°)'"
              >
                <!-- Coordinate tangent grid (-30, -15, 0, +15, +30) -->
                <rect x="25" y="25" width="170" height="170" class="emr-hess__grid-outer-ref" />
                <rect x="67.5" y="67.5" width="85" height="85" class="emr-hess__grid-inner-ref" />
                <line x1="25" y1="110" x2="195" y2="110" class="emr-hess__axis" />
                <line x1="110" y1="25" x2="110" y2="195" class="emr-hess__axis" />

                <!-- Plotted Outer (30°) and Inner (15°) Polygons -->
                @if (ch.record.outerFieldPoints.length > 1) {
                  <polygon
                    [attr.points]="polygonPointsAttr(ch.record.outerFieldPoints)"
                    class="emr-hess__poly-outer"
                  />
                }
                @if (ch.record.innerFieldPoints.length > 1) {
                  <polygon
                    [attr.points]="polygonPointsAttr(ch.record.innerFieldPoints)"
                    class="emr-hess__poly-inner"
                  />
                }

                <!-- Inner Field Plotted Points -->
                @for (pt of ch.record.innerFieldPoints; track pt.gazeId) {
                  <circle
                    [attr.cx]="hessSvgX(pt.plottedXDeg)"
                    [attr.cy]="hessSvgY(pt.plottedYDeg)"
                    r="4.5"
                    class="emr-hess__pt-inner"
                    (click)="selectPoint(ch.key, 'inner', pt.gazeId)"
                  />
                }

                <!-- Outer Field Plotted Points -->
                @for (pt of ch.record.outerFieldPoints; track pt.gazeId) {
                  <circle
                    [attr.cx]="hessSvgX(pt.plottedXDeg)"
                    [attr.cy]="hessSvgY(pt.plottedYDeg)"
                    r="4.5"
                    class="emr-hess__pt-outer"
                    (click)="selectPoint(ch.key, 'outer', pt.gazeId)"
                  />
                }
              </svg>

              <div class="emr-hess__nudge-panel">
                <span class="emr-hess__label">Gaze Point Selection & Nudge ({{ activeGaze }}):</span>
                <div class="emr-hess__gaze-pills">
                  @for (pt of ch.record.innerFieldPoints; track pt.gazeId) {
                    <button
                      type="button"
                      class="emr-hess__chip"
                      [attr.aria-pressed]="m.selectedChart === ch.key && activeGaze === pt.gazeId"
                      (click)="selectPoint(ch.key, 'inner', pt.gazeId)"
                    >
                      {{ pt.gazeId }} ({{ pt.plottedXDeg }}°, {{ pt.plottedYDeg }}°)
                    </button>
                  }
                </div>

                @if (!m.readOnly) {
                  <div class="emr-hess__nudge-buttons" role="group" [attr.aria-label]="ch.label + ' nudge controls'">
                    <button
                      type="button"
                      class="emr-hess__chip"
                      (click)="nudgePoint(ch.key, 'inner', activeGaze, -2, 0)"
                    >
                      ← -2° X
                    </button>
                    <button
                      type="button"
                      class="emr-hess__chip"
                      (click)="nudgePoint(ch.key, 'inner', activeGaze, 2, 0)"
                    >
                      +2° X →
                    </button>
                    <button
                      type="button"
                      class="emr-hess__chip"
                      (click)="nudgePoint(ch.key, 'inner', activeGaze, 0, 2)"
                    >
                      ↑ +2° Y
                    </button>
                    <button
                      type="button"
                      class="emr-hess__chip"
                      (click)="nudgePoint(ch.key, 'inner', activeGaze, 0, -2)"
                    >
                      ↓ -2° Y
                    </button>
                  </div>
                }
              </div>
            </div>
          </article>
        }
      </div>

      <!-- 3x3 Prism Bar Cover Test (PBCT) Diopter Matrix & Bielschowsky Head Tilt -->
      <section class="emr-hess__pbct-section" aria-label="9-Gaze Prism Bar Cover Test Matrix">
        <header class="emr-hess__pbct-header">
          <strong class="emr-hess__pbct-title">
            9-Gaze Prism Bar Cover Test (PBCT) — {{ activeDistanceMode() === 'distance-6m' ? 'Distance (6m)' : 'Near (33cm)' }}
          </strong>
          @if (m.headTiltCells; as tilt) {
            <div class="emr-hess__tilt-bar" role="group" aria-label="Bielschowsky head-tilt test">
              <span class="emr-hess__tilt-pill">Right Head Tilt: <strong>{{ tilt.rightTiltDelta }}</strong></span>
              <span class="emr-hess__tilt-pill">Left Head Tilt: <strong>{{ tilt.leftTiltDelta }}</strong></span>
            </div>
          }
        </header>

        <div class="emr-hess__pbct-grid" role="grid" aria-label="3x3 Cardinal Gaze Prism Diopters">
          @for (row of gazeRows; track $index) {
            <div class="emr-hess__pbct-row" role="row">
              @for (gazeId of row; track gazeId) {
                @let cell = pbctCell(gazeId);
                <div class="emr-hess__pbct-cell" role="gridcell">
                  <div class="emr-hess__pbct-cell-top">
                    <span class="emr-hess__pbct-gaze">{{ gazeId }}</span>
                    @if (cell?.badge; as b) {
                      <span class="emr-hess__tone-badge" [attr.data-tone]="b.tone">{{ b.label }}</span>
                    }
                  </div>
                  <div class="emr-hess__pbct-deltas">
                    <span>H: <strong>{{ cell?.horizontalDelta ?? 'Ortho' }}</strong></span>
                    <span>V: <strong>{{ cell?.verticalDelta ?? '0Δ' }}</strong></span>
                    @if (cell?.torsionLabel) {
                      <span>Torsion: {{ cell?.torsionLabel }}</span>
                    }
                  </div>
                  @if (!m.readOnly) {
                    <button
                      type="button"
                      class="emr-hess__chip"
                      (click)="editPbctCell(gazeId, cell?.horizontalDelta ?? 'Ortho', cell?.verticalDelta ?? '0Δ')"
                    >
                      Edit {{ gazeId }} PBCT
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      </section>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); }
    .emr-hess {
      border: 1px solid var(--emr-border);
      border-radius: 12px;
      background: var(--emr-surface);
      padding: 16px;
      display: grid;
      gap: 14px;
    }
    .emr-hess__header, .emr-hess__chart-header, .emr-hess__pbct-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .emr-hess__eyebrow {
      font-size: var(--emr-text-xs);
      font-weight: var(--emr-weight-bold);
      color: var(--emr-primary);
      letter-spacing: 0.05em;
    }
    .emr-hess__title { margin: 2px 0 0; font-size: var(--emr-text-lg); font-weight: var(--emr-weight-bold); }
    .emr-hess__subtitle { margin: 4px 0 0; font-size: var(--emr-text-sm); color: var(--emr-text-muted); }
    .emr-hess__diagnosis { margin: 4px 0 0; font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); color: var(--emr-primary); }
    .emr-hess__mode-switcher, .emr-hess__muscle-badges, .emr-hess__gaze-pills, .emr-hess__nudge-buttons, .emr-hess__tilt-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
    .emr-hess__chip {
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
    .emr-hess__chip[aria-pressed="true"] {
      border-color: var(--emr-primary);
      background: var(--emr-primary-soft);
      color: var(--emr-primary);
    }
    .emr-hess__charts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 14px;
    }
    .emr-hess__chart-card, .emr-hess__pbct-section {
      border: 1px solid var(--emr-border);
      border-radius: 10px;
      background: var(--emr-surface-soft);
      padding: 12px;
      display: grid;
      gap: 10px;
    }
    .emr-hess__eye-pill, .emr-hess__tilt-pill {
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid var(--emr-border);
      background: var(--emr-surface);
      font-size: var(--emr-text-xs);
    }
    .emr-hess__tone-badge {
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid var(--emr-border);
      background: var(--emr-surface);
      font-size: var(--emr-text-xs);
      font-weight: var(--emr-weight-bold);
    }
    .emr-hess__tone-badge[data-tone="danger"] { border-color: var(--emr-danger); color: var(--emr-danger); }
    .emr-hess__tone-badge[data-tone="warning"] { border-color: var(--emr-warning); color: var(--emr-warning); }
    .emr-hess__span-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      font-size: var(--emr-text-xs);
      color: var(--emr-text-muted);
    }
    .emr-hess__svg-row {
      display: grid;
      grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
      gap: 12px;
      align-items: start;
    }
    .emr-hess__svg { width: 100%; max-width: 220px; height: auto; display: block; }
    .emr-hess__grid-outer-ref, .emr-hess__grid-inner-ref {
      fill: var(--emr-surface);
      stroke: var(--emr-border);
      stroke-dasharray: 4 3;
      stroke-width: 1.5;
    }
    .emr-hess__axis { stroke: var(--emr-border); stroke-width: 1; }
    .emr-hess__poly-outer { fill: none; stroke: var(--emr-info); stroke-width: 2; }
    .emr-hess__poly-inner { fill: var(--emr-primary-soft); stroke: var(--emr-primary); stroke-width: 2; }
    .emr-hess__pt-inner { fill: var(--emr-primary); cursor: pointer; }
    .emr-hess__pt-outer { fill: var(--emr-info); cursor: pointer; }
    .emr-hess__nudge-panel { display: grid; gap: 8px; }
    .emr-hess__label { font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); color: var(--emr-text-muted); }
    .emr-hess__pbct-grid { display: grid; gap: 8px; }
    .emr-hess__pbct-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .emr-hess__pbct-cell {
      padding: 8px;
      border: 1px solid var(--emr-border);
      border-radius: 8px;
      background: var(--emr-surface);
      display: grid;
      gap: 4px;
    }
    .emr-hess__pbct-cell-top { display: flex; justify-content: space-between; align-items: center; }
    .emr-hess__pbct-gaze { font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); color: var(--emr-text-muted); }
    .emr-hess__pbct-deltas { display: flex; flex-wrap: wrap; gap: 8px; font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); }
  `],
})
export class EmrHessScreenChartComponent {
  readonly model = input.required<EmrHessScreenChartViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrHessScreenChartIntent>();

  readonly gazeRows = HESS_NINE_GAZE_ROWS;

  activeDistanceMode(): 'distance-6m' | 'near-33cm' {
    return this.model().activeDistanceMode ?? 'distance-6m';
  }

  selectedGaze(): HessGazeId {
    return this.model().selectedGazeId ?? 'C';
  }

  charts(): readonly {
    readonly key: 'left-os-fixing' | 'right-od-fixing';
    readonly label: string;
    readonly record: HessEyeRecord;
  }[] {
    const m = this.model();
    return [
      {
        key: 'left-os-fixing',
        label: `Left Chart (${m.leftChartOsFixing.fixingEye} Fixing · ${m.leftChartOsFixing.plottedEye} Plotted)`,
        record: m.leftChartOsFixing,
      },
      {
        key: 'right-od-fixing',
        label: `Right Chart (${m.rightChartOdFixing.fixingEye} Fixing · ${m.rightChartOdFixing.plottedEye} Plotted)`,
        record: m.rightChartOdFixing,
      },
    ];
  }

  fieldAreaSummary(points: readonly HessPlotPoint[]) {
    return computeHessFieldAreaRatio(points);
  }

  hessSvgX(deg: number): number {
    return Math.round(110 + (deg / 30) * 85);
  }

  hessSvgY(deg: number): number {
    return Math.round(110 - (deg / 30) * 85);
  }

  polygonPointsAttr(points: readonly HessPlotPoint[]): string {
    const byGaze = new Map(points.map((p) => [p.gazeId, p]));
    const ordered = HESS_PERIMETER_ORDER.map((g) => byGaze.get(g)).filter(
      (p): p is HessPlotPoint => !!p,
    );
    const list = ordered.length >= 3 ? ordered : points;
    return list.map((p) => `${this.hessSvgX(p.plottedXDeg)},${this.hessSvgY(p.plottedYDeg)}`).join(' ');
  }

  activePbctCells(): Readonly<Record<HessGazeId, PbctNineGazeCell>> {
    const m = this.model();
    if (this.activeDistanceMode() === 'near-33cm' && m.pbctNearCells) {
      return m.pbctNearCells;
    }
    return m.pbctDistanceCells;
  }

  pbctCell(gazeId: HessGazeId): PbctNineGazeCell | undefined {
    return this.activePbctCells()[gazeId];
  }

  selectPoint(
    chart: 'left-os-fixing' | 'right-od-fixing',
    field: 'inner' | 'outer',
    gazeId: HessGazeId,
  ): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'pointSelected', chart, field, gazeId });
  }

  nudgePoint(
    chart: 'left-os-fixing' | 'right-od-fixing',
    field: 'inner' | 'outer',
    gazeId: HessGazeId,
    dxDeg: number,
    dyDeg: number,
  ): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'pointNudged', chart, field, gazeId, dxDeg, dyDeg });
  }

  editPbctCell(gazeId: HessGazeId, horizontalDelta: string, verticalDelta: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({
      type: 'pbctCellEdited',
      distanceMode: this.activeDistanceMode(),
      gazeId,
      horizontalDelta,
      verticalDelta,
    });
  }

  setDistanceMode(distanceMode: 'distance-6m' | 'near-33cm'): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'distanceModeChanged', distanceMode });
  }
}
