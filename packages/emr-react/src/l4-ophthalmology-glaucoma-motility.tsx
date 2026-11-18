'use client';

import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType, type TextStyle } from 'react-native';
import type { ClinicalAssessmentStatus } from '@drguptavivek/emr-controller';
import {
  CLINICAL_ASSESSMENT_STATUS_OPTIONS,
  GONIOSCOPY_CLOCK_HOURS,
  GONIOSCOPY_PIGMENTATION_GRADES,
  GONIOSCOPY_QUADRANT_IDS,
  HESS_NINE_GAZE_ROWS,
  SHAFFER_GRADES,
  VISUAL_FIELD_DEFECT_PATTERNS,
  anatomicalLeftQuadrant,
  anatomicalRightQuadrant,
  computeHessFieldAreaRatio,
  evaluateVisualFieldReliability,
  formatGonioscopyQuadrantSummary,
  resolveGhtTone,
  resolveProbabilityGlyph,
  resolveVisualFieldReliabilityTone,
  summarizeGonioscopyOccludability,
  type EmrGonioscopyChartIntent,
  type EmrGonioscopyChartViewModel,
  type EmrHessScreenChartIntent,
  type EmrHessScreenChartViewModel,
  type EmrVisualFieldSummaryIntent,
  type EmrVisualFieldSummaryViewModel,
  type GonioscopyEyeRecord,
  type GonioscopyQuadrantId,
  type HessEyeRecord,
  type HessGazeId,
  type ShafferGrade,
  type VisualFieldEyeRecord,
} from './l4-ophthalmology-glaucoma-motility.logic';
import { EmrBadgeView } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

export type {
  EmrGonioscopyChartIntent,
  EmrGonioscopyChartViewModel,
  EmrHessScreenChartIntent,
  EmrHessScreenChartViewModel,
  EmrVisualFieldSummaryIntent,
  EmrVisualFieldSummaryViewModel,
};

type PressState = PressableStateCallbackType & { focused?: boolean };

// ===========================================================================
// 1. EmrGonioscopyChart — Bilateral 4-quadrant gonioscopy & PAS angle diagram
// ===========================================================================

export function EmrGonioscopyChart({
  model: m,
  onIntent,
  headingId,
}: {
  model: EmrGonioscopyChartViewModel;
  onIntent: (intent: EmrGonioscopyChartIntent) => void;
  headingId?: string;
}) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!m.readOnly;
  const viewMode = m.viewMode ?? 'both';
  const emit = (intent: EmrGonioscopyChartIntent) => {
    if (!readOnly) onIntent(intent);
  };

  const renderEyeCard = (eyeRec: GonioscopyEyeRecord) => {
    const occ = summarizeGonioscopyOccludability(eyeRec);
    const activeQuad: GonioscopyQuadrantId =
      m.selectedEye === eyeRec.eye && m.selectedQuadrant
        ? m.selectedQuadrant
        : (m.selectedQuadrant ?? 'superior');
    const activeFinding = eyeRec.quadrants[activeQuad];
    const leftQuad = anatomicalLeftQuadrant(eyeRec.eye);
    const rightQuad = anatomicalRightQuadrant(eyeRec.eye);
    const isRecorded = !eyeRec.assessmentStatus || eyeRec.assessmentStatus === 'recorded';

    return (
      <View
        key={eyeRec.eye}
        role="region"
        aria-label={`${eyeRec.eye} Gonioscopy`}
        style={[styles.subCard, { borderColor: t.border, backgroundColor: t.surfaceSoft }]}
      >
        <View style={styles.rowBetween}>
          <View style={styles.rowWrap}>
            <View style={[styles.eyePill, { backgroundColor: t.primarySoft, borderColor: t.primaryBorder }]}>
              <Text style={[font, bold, { color: t.primary, fontSize: t.textSm }]}>
                {eyeRec.eye}
              </Text>
            </View>
            <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
              {eyeRec.gradingSystem.toUpperCase()}
            </Text>
            {eyeRec.lensUsed ? (
              <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
                · {eyeRec.lensUsed}
              </Text>
            ) : null}
            {eyeRec.vanHerickGrade ? (
              <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
                · Van Herick Gr {eyeRec.vanHerickGrade}
              </Text>
            ) : null}
          </View>

          <View style={styles.rowWrap}>
            <EmrBadgeView
              badge={{
                label: occ.isOccludable
                  ? `Occludable (${occ.closedQuadrantCount}/4 closed)`
                  : `Open (${occ.closedQuadrantCount}/4 narrow)`,
                tone: occ.isOccludable ? 'danger' : 'success',
              }}
            />
            {occ.pasClockHourCount > 0 ? (
              <EmrBadgeView badge={{ label: `PAS ${occ.pasClockHourCount} clk hr`, tone: 'warning' }} />
            ) : null}
            {eyeRec.overallBadge ? <EmrBadgeView badge={eyeRec.overallBadge} /> : null}
          </View>
        </View>

        <View role="group" aria-label={`${eyeRec.eye} assessment status`} style={styles.rowWrap}>
          {CLINICAL_ASSESSMENT_STATUS_OPTIONS.map((opt) => {
            const active = (eyeRec.assessmentStatus ?? 'recorded') === opt.value;
            return (
              <Pressable
                key={opt.value}
                role="button"
                aria-pressed={active}
                disabled={readOnly}
                onPress={() => emit({ type: 'eyeAssessmentStatusChanged', eye: eyeRec.eye, status: opt.value })}
                style={(s: PressState) => [
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                  focusRing(t, s.focused),
                ]}
              >
                <Text style={[font, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!isRecorded ? (
          <View style={[styles.fallbackBox, { borderColor: t.border, backgroundColor: t.surface }]}>
            <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
              {eyeRec.eye} Angle Assessment: {eyeRec.assessmentStatus}
            </Text>
          </View>
        ) : (
          <>
            {/* Anatomical 4-Quadrant X-Cross Ring Layout */}
            <View
              role="group"
              aria-label={`${eyeRec.eye} 4-quadrant gonioscopy diagram`}
              style={[styles.crossContainer, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              {/* Superior (Top) */}
              <View style={styles.crossRowCenter}>
                <Pressable
                  role="button"
                  aria-pressed={activeQuad === 'superior'}
                  onPress={() => emit({ type: 'quadrantSelected', eye: eyeRec.eye, quadrant: 'superior' })}
                  style={[
                    styles.quadBox,
                    {
                      borderColor: activeQuad === 'superior' ? t.primary : t.border,
                      backgroundColor: activeQuad === 'superior' ? t.primarySoft : t.surfaceSoft,
                    },
                  ]}
                >
                  <Text style={[font, bold, { color: t.textMuted, fontSize: t.textXs }]}>
                    SUPERIOR
                  </Text>
                  <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                    {formatGonioscopyQuadrantSummary(eyeRec.quadrants.superior, viewMode)}
                  </Text>
                </Pressable>
              </View>

              {/* Middle Row: Left (OD Temporal / OS Nasal) · Eye Center · Right (OD Nasal / OS Temporal) */}
              <View style={styles.crossMiddleRow}>
                <Pressable
                  role="button"
                  aria-pressed={activeQuad === leftQuad}
                  onPress={() => emit({ type: 'quadrantSelected', eye: eyeRec.eye, quadrant: leftQuad })}
                  style={[
                    styles.quadBox,
                    {
                      borderColor: activeQuad === leftQuad ? t.primary : t.border,
                      backgroundColor: activeQuad === leftQuad ? t.primarySoft : t.surfaceSoft,
                    },
                  ]}
                >
                  <Text style={[font, bold, { color: t.textMuted, fontSize: t.textXs }]}>
                    {leftQuad.toUpperCase()}
                  </Text>
                  <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                    {formatGonioscopyQuadrantSummary(eyeRec.quadrants[leftQuad], viewMode)}
                  </Text>
                </Pressable>

                <View style={[styles.crossCenterCircle, { borderColor: t.primary, backgroundColor: t.primarySoft }]}>
                  <Text style={[font, bold, { color: t.primary, fontSize: t.textSm }]}>
                    {eyeRec.eye}
                  </Text>
                </View>

                <Pressable
                  role="button"
                  aria-pressed={activeQuad === rightQuad}
                  onPress={() => emit({ type: 'quadrantSelected', eye: eyeRec.eye, quadrant: rightQuad })}
                  style={[
                    styles.quadBox,
                    {
                      borderColor: activeQuad === rightQuad ? t.primary : t.border,
                      backgroundColor: activeQuad === rightQuad ? t.primarySoft : t.surfaceSoft,
                    },
                  ]}
                >
                  <Text style={[font, bold, { color: t.textMuted, fontSize: t.textXs }]}>
                    {rightQuad.toUpperCase()}
                  </Text>
                  <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                    {formatGonioscopyQuadrantSummary(eyeRec.quadrants[rightQuad], viewMode)}
                  </Text>
                </Pressable>
              </View>

              {/* Inferior (Bottom) */}
              <View style={styles.crossRowCenter}>
                <Pressable
                  role="button"
                  aria-pressed={activeQuad === 'inferior'}
                  onPress={() => emit({ type: 'quadrantSelected', eye: eyeRec.eye, quadrant: 'inferior' })}
                  style={[
                    styles.quadBox,
                    {
                      borderColor: activeQuad === 'inferior' ? t.primary : t.border,
                      backgroundColor: activeQuad === 'inferior' ? t.primarySoft : t.surfaceSoft,
                    },
                  ]}
                >
                  <Text style={[font, bold, { color: t.textMuted, fontSize: t.textXs }]}>
                    INFERIOR
                  </Text>
                  <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                    {formatGonioscopyQuadrantSummary(eyeRec.quadrants.inferior, viewMode)}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Active Quadrant Grade & Pigmentation Controls */}
            <View style={styles.stackSm}>
              {(viewMode === 'static' || viewMode === 'both') && (
                <View role="group" aria-label={`${eyeRec.eye} ${activeQuad} static grade`} style={styles.rowWrap}>
                  <Text style={[font, bold, { color: t.textMuted, fontSize: t.textXs }]}>
                    Static ({activeQuad}):
                  </Text>
                  {SHAFFER_GRADES.map((gr: ShafferGrade) => {
                    const active = activeFinding.staticGrade === gr;
                    return (
                      <Pressable
                        key={gr}
                        role="button"
                        aria-pressed={active}
                        disabled={readOnly}
                        onPress={() =>
                          emit({
                            type: 'quadrantGradeChanged',
                            eye: eyeRec.eye,
                            quadrant: activeQuad,
                            mode: 'static',
                            grade: gr,
                          })
                        }
                        style={[
                          styles.chip,
                          {
                            borderColor: active ? t.primary : t.border,
                            backgroundColor: active ? t.primarySoft : t.surface,
                          },
                        ]}
                      >
                        <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                          {gr === 'slit' ? 'Slit' : `Gr ${gr}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {(viewMode === 'dynamic' || viewMode === 'both') && (
                <View role="group" aria-label={`${eyeRec.eye} ${activeQuad} dynamic grade`} style={styles.rowWrap}>
                  <Text style={[font, bold, { color: t.textMuted, fontSize: t.textXs }]}>
                    Dynamic ({activeQuad}):
                  </Text>
                  {SHAFFER_GRADES.map((gr: ShafferGrade) => {
                    const active = activeFinding.dynamicGrade === gr;
                    return (
                      <Pressable
                        key={gr}
                        role="button"
                        aria-pressed={active}
                        disabled={readOnly}
                        onPress={() =>
                          emit({
                            type: 'quadrantGradeChanged',
                            eye: eyeRec.eye,
                            quadrant: activeQuad,
                            mode: 'dynamic',
                            grade: gr,
                          })
                        }
                        style={[
                          styles.chip,
                          {
                            borderColor: active ? t.primary : t.border,
                            backgroundColor: active ? t.primarySoft : t.surface,
                          },
                        ]}
                      >
                        <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                          {gr === 'slit' ? 'Slit' : `Gr ${gr}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <View role="group" aria-label={`${eyeRec.eye} ${activeQuad} pigmentation`} style={styles.rowWrap}>
                <Text style={[font, bold, { color: t.textMuted, fontSize: t.textXs }]}>
                  TM Pigmentation:
                </Text>
                {GONIOSCOPY_PIGMENTATION_GRADES.map((p) => {
                  const active = activeFinding.pigmentation === p;
                  return (
                    <Pressable
                      key={p}
                      role="button"
                      aria-pressed={active}
                      disabled={readOnly}
                      onPress={() =>
                        emit({
                          type: 'quadrantPigmentationChanged',
                          eye: eyeRec.eye,
                          quadrant: activeQuad,
                          pigmentation: p,
                        })
                      }
                      style={[
                        styles.chip,
                        {
                          borderColor: active ? t.primary : t.border,
                          backgroundColor: active ? t.primarySoft : t.surface,
                        },
                      ]}
                    >
                      <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                        {p}+
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* PAS Clock-Hour Toggle Strip */}
              <View role="group" aria-label={`${eyeRec.eye} PAS clock hours`} style={styles.rowWrap}>
                <Text style={[font, bold, { color: t.textMuted, fontSize: t.textXs }]}>
                  PAS Clock Hours:
                </Text>
                {GONIOSCOPY_CLOCK_HOURS.map((hr) => {
                  const hasPas = (eyeRec.pasClockHours ?? []).includes(hr);
                  return (
                    <Pressable
                      key={hr}
                      role="button"
                      aria-pressed={hasPas}
                      disabled={readOnly}
                      onPress={() => emit({ type: 'pasClockHourToggled', eye: eyeRec.eye, clockHour: hr })}
                      style={[
                        styles.chip,
                        {
                          borderColor: hasPas ? t.warning : t.border,
                          backgroundColor: hasPas ? t.warningSoft : t.surface,
                        },
                      ]}
                    >
                      <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
                        {hr}h
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {eyeRec.spaethNotationSummary ? (
                <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
                  Spaeth: {eyeRec.spaethNotationSummary}
                </Text>
              ) : null}
              {eyeRec.notes ? (
                <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>{eyeRec.notes}</Text>
              ) : null}
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId ?? `${m.id}-title`}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View style={styles.stackXs}>
          <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
            ANTERIOR CHAMBER ANGLE · GONIOSCOPY
          </Text>
          <Text
            nativeID={headingId ?? `${m.id}-title`}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {m.title ?? 'Bilateral 4-Quadrant Gonioscopy & Angle Evaluation'}
          </Text>
          {m.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{m.subtitle}</Text>
          ) : null}
        </View>

        <View role="group" aria-label="View mode and bilateral copy controls" style={styles.rowWrap}>
          {(['static', 'dynamic', 'both'] as const).map((vm) => {
            const active = viewMode === vm;
            return (
              <Pressable
                key={vm}
                role="button"
                aria-pressed={active}
                disabled={readOnly}
                onPress={() => emit({ type: 'viewModeChanged', viewMode: vm })}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                ]}
              >
                <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                  {vm === 'both' ? 'Static + Dynamic' : vm === 'dynamic' ? 'Dynamic' : 'Static'}
                </Text>
              </Pressable>
            );
          })}
          {!readOnly ? (
            <>
              <Pressable
                role="button"
                onPress={() => emit({ type: 'copyEyeRequested', fromEye: 'OD', toEye: 'OS' })}
                style={[styles.chip, { borderColor: t.border, backgroundColor: t.surface }]}
              >
                <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
                  Copy OD → OS
                </Text>
              </Pressable>
              <Pressable
                role="button"
                onPress={() => emit({ type: 'copyEyeRequested', fromEye: 'OS', toEye: 'OD' })}
                style={[styles.chip, { borderColor: t.border, backgroundColor: t.surface }]}
              >
                <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
                  Copy OS → OD
                </Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.bilateralGrid}>
        {renderEyeCard(m.od)}
        {renderEyeCard(m.os)}
      </View>
    </View>
  );
}

// ===========================================================================
// 2. EmrVisualFieldSummary — Perimetry reliability, global indices & plot
// ===========================================================================

export function EmrVisualFieldSummary({
  model: m,
  onIntent,
  headingId,
}: {
  model: EmrVisualFieldSummaryViewModel;
  onIntent: (intent: EmrVisualFieldSummaryIntent) => void;
  headingId?: string;
}) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!m.readOnly;
  const activeMapType = m.activeMapType ?? 'pattern-deviation';
  const emit = (intent: EmrVisualFieldSummaryIntent) => {
    if (!readOnly) onIntent(intent);
  };

  const renderEyeCard = (eyeRec: VisualFieldEyeRecord) => {
    const rel =
      eyeRec.reliabilityFlag ??
      evaluateVisualFieldReliability(
        eyeRec.fixationLosses,
        eyeRec.falsePositivesPct,
        eyeRec.falseNegativesPct,
      );
    const relTone = resolveVisualFieldReliabilityTone(rel);
    const ghtTone = resolveGhtTone(eyeRec.ght);
    const isRecorded = !eyeRec.assessmentStatus || eyeRec.assessmentStatus === 'recorded';

    return (
      <View
        key={eyeRec.eye}
        role="region"
        aria-label={`${eyeRec.eye} Visual Field`}
        style={[styles.subCard, { borderColor: t.border, backgroundColor: t.surfaceSoft }]}
      >
        <View style={styles.rowBetween}>
          <View style={styles.rowWrap}>
            <View style={[styles.eyePill, { backgroundColor: t.primarySoft, borderColor: t.primaryBorder }]}>
              <Text style={[font, bold, { color: t.primary, fontSize: t.textSm }]}>
                {eyeRec.eye}
              </Text>
            </View>
            <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
              {eyeRec.strategy}
            </Text>
            <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
              · {eyeRec.testDate}
            </Text>
          </View>
          <View style={styles.rowWrap}>
            <EmrBadgeView badge={{ label: rel.toUpperCase(), tone: relTone }} />
            {eyeRec.badge ? <EmrBadgeView badge={eyeRec.badge} /> : null}
          </View>
        </View>

        {!isRecorded ? (
          <View style={[styles.fallbackBox, { borderColor: t.border, backgroundColor: t.surface }]}>
            <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
              {eyeRec.eye} Perimetry: {eyeRec.assessmentStatus}
            </Text>
          </View>
        ) : (
          <>
            {/* Reliability Strip */}
            <View
              role="group"
              aria-label={`${eyeRec.eye} reliability indices`}
              style={[styles.metricsStrip, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <View style={styles.metricCell}>
                <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>FL</Text>
                <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                  {eyeRec.fixationLosses}
                </Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>FP</Text>
                <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                  {eyeRec.falsePositivesPct}%
                </Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>FN</Text>
                <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                  {eyeRec.falseNegativesPct}%
                </Text>
              </View>
            </View>

            {/* Global Indices Grid */}
            <View
              role="group"
              aria-label={`${eyeRec.eye} global indices`}
              style={[styles.metricsStrip, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <View style={styles.metricCell}>
                <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>VFI</Text>
                <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                  {eyeRec.vfiPct !== undefined ? `${eyeRec.vfiPct}%` : '—'}
                </Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>MD</Text>
                <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                  {eyeRec.mdDb.toFixed(2)} dB
                </Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>PSD</Text>
                <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                  {eyeRec.psdDb.toFixed(2)} dB
                </Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>GHT</Text>
                <EmrBadgeView badge={{ label: eyeRec.ght, tone: ghtTone }} />
              </View>
            </View>

            {/* Sector Points Map & Stipple Indicators */}
            <View role="list" aria-label={`${eyeRec.eye} visual field sector points`} style={styles.rowWrap}>
              {eyeRec.points.map((pt) => {
                const selected = m.selectedPointId === pt.id && (!m.selectedEye || m.selectedEye === eyeRec.eye);
                const dbVal =
                  activeMapType === 'pattern-deviation' ? pt.patternDeviationDb : pt.totalDeviationDb;
                return (
                  <Pressable
                    key={pt.id}
                    role="button"
                    aria-pressed={selected}
                    onPress={() => emit({ type: 'pointSelected', eye: eyeRec.eye, pointId: pt.id })}
                    style={[
                      styles.chip,
                      {
                        borderColor: selected ? t.primary : t.border,
                        backgroundColor: selected ? t.primarySoft : t.surface,
                      },
                    ]}
                  >
                    <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
                      {resolveProbabilityGlyph(pt.probability)} {pt.id} ({ pt.xDeg }°, { pt.yDeg }°): {dbVal} dB [{pt.probability}]
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Defect Pattern Selector */}
            <View role="group" aria-label={`${eyeRec.eye} defect pattern`} style={styles.rowWrap}>
              <Text style={[font, bold, { color: t.textMuted, fontSize: t.textXs }]}>
                Pattern ({eyeRec.defectPatternLabel ?? 'Unclassified'}):
              </Text>
              {VISUAL_FIELD_DEFECT_PATTERNS.map((pat) => {
                const active = eyeRec.defectPatternLabel === pat;
                return (
                  <Pressable
                    key={pat}
                    role="button"
                    aria-pressed={active}
                    disabled={readOnly}
                    onPress={() => emit({ type: 'defectPatternChanged', eye: eyeRec.eye, patternLabel: pat })}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? t.primary : t.border,
                        backgroundColor: active ? t.primarySoft : t.surface,
                      },
                    ]}
                  >
                    <Text style={[font, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                      {pat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {eyeRec.progressionSummary ? (
              <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
                GPA / Trend: {eyeRec.progressionSummary}
              </Text>
            ) : null}
          </>
        )}
      </View>
    );
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId ?? `${m.id}-title`}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View style={styles.stackXs}>
          <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
            AUTOMATED PERIMETRY · VISUAL FIELD SUMMARY
          </Text>
          <Text
            nativeID={headingId ?? `${m.id}-title`}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {m.title ?? 'Bilateral Humphrey / Octopus Visual Field Summary'}
          </Text>
          {m.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{m.subtitle}</Text>
          ) : null}
        </View>

        <View role="group" aria-label="Deviation map type" style={styles.rowWrap}>
          {(['pattern-deviation', 'total-deviation'] as const).map((mt) => {
            const active = activeMapType === mt;
            return (
              <Pressable
                key={mt}
                role="button"
                aria-pressed={active}
                disabled={readOnly}
                onPress={() => emit({ type: 'mapTypeChanged', mapType: mt })}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                ]}
              >
                <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                  {mt === 'pattern-deviation' ? 'Pattern Deviation Map' : 'Total Deviation Map'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.bilateralGrid}>
        {renderEyeCard(m.od)}
        {renderEyeCard(m.os)}
      </View>
    </View>
  );
}

// ===========================================================================
// 3. EmrHessScreenChart — Diplopia tangent screen & 9-gaze PBCT prism matrix
// ===========================================================================

export function EmrHessScreenChart({
  model: m,
  onIntent,
  headingId,
}: {
  model: EmrHessScreenChartViewModel;
  onIntent: (intent: EmrHessScreenChartIntent) => void;
  headingId?: string;
}) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!m.readOnly;
  const activeDistanceMode = m.activeDistanceMode ?? 'distance-6m';
  const activeGaze: HessGazeId = m.selectedGazeId ?? 'C';
  const emit = (intent: EmrHessScreenChartIntent) => {
    if (!readOnly) onIntent(intent);
  };

  const activePbctCells =
    activeDistanceMode === 'near-33cm' && m.pbctNearCells ? m.pbctNearCells : m.pbctDistanceCells;

  const renderChartCard = (
    chartKey: 'left-os-fixing' | 'right-od-fixing',
    label: string,
    record: HessEyeRecord,
  ) => {
    const innerSpan = computeHessFieldAreaRatio(record.innerFieldPoints);
    const outerSpan = computeHessFieldAreaRatio(record.outerFieldPoints);

    return (
      <View
        key={chartKey}
        role="region"
        aria-label={label}
        style={[styles.subCard, { borderColor: t.border, backgroundColor: t.surfaceSoft }]}
      >
        <View style={styles.rowBetween}>
          <View style={styles.rowWrap}>
            <View style={[styles.eyePill, { backgroundColor: t.primarySoft, borderColor: t.primaryBorder }]}>
              <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
                {record.plottedEye} Plotted ({record.fixingEye} Fixing)
              </Text>
            </View>
            <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>{label}</Text>
          </View>

          <View style={styles.rowWrap}>
            {record.primaryRestrictionMuscle ? (
              <EmrBadgeView
                badge={{ label: `Underaction: ${record.primaryRestrictionMuscle}`, tone: 'danger' }}
              />
            ) : null}
            {record.primaryOveractionMuscle ? (
              <EmrBadgeView
                badge={{ label: `Overaction: ${record.primaryOveractionMuscle}`, tone: 'warning' }}
              />
            ) : null}
          </View>
        </View>

        <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
          Inner (15°) Span: {innerSpan.plottedSpanX}°×{innerSpan.plottedSpanY}° (Ref {innerSpan.expectedSpanX}°×{innerSpan.expectedSpanY}°) · Outer (30°) Span: {outerSpan.plottedSpanX}°×{outerSpan.plottedSpanY}°
        </Text>

        <View role="list" aria-label={`${label} inner field points`} style={styles.rowWrap}>
          {record.innerFieldPoints.map((pt) => {
            const selected = m.selectedChart === chartKey && activeGaze === pt.gazeId;
            return (
              <Pressable
                key={pt.gazeId}
                role="button"
                aria-pressed={selected}
                onPress={() => emit({ type: 'pointSelected', chart: chartKey, field: 'inner', gazeId: pt.gazeId })}
                style={[
                  styles.chip,
                  {
                    borderColor: selected ? t.primary : t.border,
                    backgroundColor: selected ? t.primarySoft : t.surface,
                  },
                ]}
              >
                <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
                  {pt.gazeId}: ({pt.plottedXDeg}°, {pt.plottedYDeg}°)
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!readOnly ? (
          <View role="group" aria-label={`${label} nudge controls`} style={styles.rowWrap}>
            <Pressable
              role="button"
              onPress={() =>
                emit({ type: 'pointNudged', chart: chartKey, field: 'inner', gazeId: activeGaze, dxDeg: -2, dyDeg: 0 })
              }
              style={[styles.chip, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>← -2° X</Text>
            </Pressable>
            <Pressable
              role="button"
              onPress={() =>
                emit({ type: 'pointNudged', chart: chartKey, field: 'inner', gazeId: activeGaze, dxDeg: 2, dyDeg: 0 })
              }
              style={[styles.chip, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>+2° X →</Text>
            </Pressable>
            <Pressable
              role="button"
              onPress={() =>
                emit({ type: 'pointNudged', chart: chartKey, field: 'inner', gazeId: activeGaze, dxDeg: 0, dyDeg: 2 })
              }
              style={[styles.chip, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>↑ +2° Y</Text>
            </Pressable>
            <Pressable
              role="button"
              onPress={() =>
                emit({ type: 'pointNudged', chart: chartKey, field: 'inner', gazeId: activeGaze, dxDeg: 0, dyDeg: -2 })
              }
              style={[styles.chip, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>↓ -2° Y</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId ?? `${m.id}-title`}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View style={styles.stackXs}>
          <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
            STRABISMUS & DIPLOPIA · HESS TANGENT SCREEN & 9-GAZE PBCT
          </Text>
          <Text
            nativeID={headingId ?? `${m.id}-title`}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {m.title ?? 'Hess Screen / Lees Tangent Chart & 9-Gaze Prism Bar Cover Test'}
          </Text>
          {m.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{m.subtitle}</Text>
          ) : null}
          {m.diagnosisSummary ? (
            <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
              Summary: {m.diagnosisSummary}
            </Text>
          ) : null}
        </View>

        <View role="group" aria-label="PBCT fixation distance mode" style={styles.rowWrap}>
          {(['distance-6m', 'near-33cm'] as const).map((dm) => {
            const active = activeDistanceMode === dm;
            return (
              <Pressable
                key={dm}
                role="button"
                aria-pressed={active}
                disabled={readOnly}
                onPress={() => emit({ type: 'distanceModeChanged', distanceMode: dm })}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                ]}
              >
                <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                  {dm === 'distance-6m' ? 'Distance (6m)' : 'Near (33cm)'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.bilateralGrid}>
        {renderChartCard(
          'left-os-fixing',
          `Left Chart (${m.leftChartOsFixing.fixingEye} Fixing · ${m.leftChartOsFixing.plottedEye} Plotted)`,
          m.leftChartOsFixing,
        )}
        {renderChartCard(
          'right-od-fixing',
          `Right Chart (${m.rightChartOdFixing.fixingEye} Fixing · ${m.rightChartOdFixing.plottedEye} Plotted)`,
          m.rightChartOdFixing,
        )}
      </View>

      {/* 3x3 PBCT Matrix & Bielschowsky Head-Tilt Readout */}
      <View
        role="region"
        aria-label="9-Gaze Prism Bar Cover Test Matrix"
        style={[styles.subCard, { borderColor: t.border, backgroundColor: t.surfaceSoft }]}
      >
        <View style={styles.rowBetween}>
          <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
            9-Gaze Prism Bar Cover Test (PBCT) — {activeDistanceMode === 'distance-6m' ? 'Distance (6m)' : 'Near (33cm)'}
          </Text>
          {m.headTiltCells ? (
            <View style={styles.rowWrap}>
              <Text style={[font, { color: t.text, fontSize: t.textXs }]}>
                Right Head Tilt: {m.headTiltCells.rightTiltDelta}
              </Text>
              <Text style={[font, { color: t.text, fontSize: t.textXs }]}>
                · Left Head Tilt: {m.headTiltCells.leftTiltDelta}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.stackSm}>
          {HESS_NINE_GAZE_ROWS.map((row, rIdx) => (
            <View key={rIdx} style={styles.pbctRow}>
              {row.map((gazeId) => {
                const cell = activePbctCells[gazeId];
                return (
                  <View
                    key={gazeId}
                    style={[styles.pbctCell, { borderColor: t.border, backgroundColor: t.surface }]}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={[font, bold, { color: t.textMuted, fontSize: t.textXs }]}>
                        {gazeId}
                      </Text>
                      {cell?.badge ? <EmrBadgeView badge={cell.badge} /> : null}
                    </View>
                    <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
                      H: {cell?.horizontalDelta ?? 'Ortho'} · V: {cell?.verticalDelta ?? '0Δ'}
                    </Text>
                    {cell?.torsionLabel ? (
                      <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
                        Torsion: {cell.torsionLabel}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  bilateralGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  subCard: {
    flex: 1,
    minWidth: 280,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  stackXs: {
    gap: 2,
  },
  stackSm: {
    gap: 8,
  },
  eyePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  fallbackBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  crossContainer: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  crossRowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  crossMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  quadBox: {
    minWidth: 92,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  crossCenterCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  metricCell: {
    gap: 2,
  },
  pbctRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pbctCell: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
});
