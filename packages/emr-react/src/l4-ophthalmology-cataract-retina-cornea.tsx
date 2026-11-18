'use client';

import { Pressable, ScrollView, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
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
import { ThemedInput } from './inputs-core';
import { EmrBadgeView, EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import {
  ASSESSMENT_STATUS_CHOICES,
  ECTASIA_RISK_OPTIONS,
  POSTERIOR_CAPSULE_STATUSES,
  PUSH_UP_TEST_CHOICES,
  TOPOGRAPHY_MAP_OPTIONS,
  classifyEctasiaScreening,
  computeIntravitrealCstDelta,
  evaluateBiometryInterOcularDelta,
  formatIntravitrealFluidFlags,
  resolveIntravitrealVisibleCourses,
} from './l4-ophthalmology-cataract-retina-cornea.logic';

export type {
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
};

type PressState = PressableStateCallbackType & { focused?: boolean };

// ===========================================================================
// 1. EmrIolBiometryPlanner
// ===========================================================================

export interface EmrIolBiometryPlannerProps {
  model: EmrIolBiometryPlannerViewModel;
  headingId?: string;
  onIntent?: (intent: EmrIolBiometryPlannerIntent) => void;
}

export function EmrIolBiometryPlanner({
  model,
  headingId = 'emr-iol-biometry-planner-heading',
  onIntent,
}: EmrIolBiometryPlannerProps) {
  const t = useEmrTheme();
  const font = fontFamily(t);
  const readOnly = !!model.readOnly;
  const delta = evaluateBiometryInterOcularDelta(model.od.axialLengthMm, model.os.axialLengthMm);
  const eyes: readonly IolBiometryEyePlan[] = [model.od, model.os];

  const emit = (intent: EmrIolBiometryPlannerIntent) => {
    if (!readOnly) onIntent?.(intent);
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View style={styles.titleBlock}>
          <Text style={[styles.tag, { backgroundColor: t.primarySoft, color: t.primary, fontFamily: t.fontMono }]}>
            OPTICAL BIOMETRY & TORIC IOL PLANNER
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {model.title ?? 'Optical Biometry & Toric IOL Power Calculation'}
          </Text>
          {model.subtitle ? (
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>{model.subtitle}</Text>
          ) : null}
        </View>
        <EmrBadgeView
          badge={{
            label: `Inter-Ocular ΔAL: ${(model.interOcularAlDiffMm ?? delta.diffMm).toFixed(2)} mm`,
            tone: model.interOcularWarning || delta.warning ? 'warning' : 'info',
          }}
        />
      </View>

      {model.interOcularWarning || delta.warning ? (
        <View role="alert" style={[styles.alertBanner, { borderColor: t.warning, backgroundColor: t.warningSoft }]}>
          <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: font }}>
            {model.interOcularWarning ?? delta.warning}
          </Text>
        </View>
      ) : null}

      <View style={styles.dualGrid}>
        {eyes.map((eye) => (
          <View
            key={eye.eye}
            role="group"
            aria-label={`Biometry plan ${eye.eye}`}
            style={[styles.eyePanel, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
          >
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <View style={[styles.sideBadge, { backgroundColor: t.primary }]}>
                  <Text style={{ color: t.surface, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                    {eye.eye}
                  </Text>
                </View>
                <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                  {eye.lensModelLabel} (A = {eye.aConstant})
                </Text>
              </View>
              {eye.badge ? <EmrBadgeView badge={eye.badge} /> : null}
            </View>

            <View style={styles.kvGrid}>
              <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surface }]}>
                <Text style={{ color: t.textMuted, fontSize: t.text2xs }}>AL</Text>
                <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }}>
                  {eye.axialLengthMm.toFixed(2)} mm
                </Text>
              </View>
              <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surface }]}>
                <Text style={{ color: t.textMuted, fontSize: t.text2xs }}>ACD</Text>
                <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }}>
                  {eye.acdMm.toFixed(2)} mm
                </Text>
              </View>
              <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surface }]}>
                <Text style={{ color: t.textMuted, fontSize: t.text2xs }}>K1 / K2</Text>
                <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }}>
                  {eye.k1Diopters.toFixed(2)}D@{eye.k1AxisDeg}° / {eye.k2Diopters.toFixed(2)}D@{eye.k2AxisDeg}°
                </Text>
              </View>
              <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surface }]}>
                <Text style={{ color: t.textMuted, fontSize: t.text2xs }}>Corneal ΔK</Text>
                <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }}>{eye.cornealDeltaKD}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.fieldFlex}>
                <Text style={{ color: t.textMuted, fontSize: t.textXs }}>Target Rx ({eye.eye})</Text>
                <ThemedInput
                  value={eye.targetRefractionD}
                  editable={!readOnly}
                  aria-label={`Target refraction ${eye.eye}`}
                  onChangeText={(val) => emit({ type: 'targetRefractionChanged', eye: eye.eye, targetRefractionD: val })}
                />
              </View>
              <View style={styles.fieldFlex}>
                <Text style={{ color: t.textMuted, fontSize: t.textXs }}>Incision Meridian (°)</Text>
                <ThemedInput
                  value={String(eye.incisionMeridianDeg ?? 110)}
                  editable={!readOnly}
                  aria-label={`Incision meridian ${eye.eye}`}
                  onChangeText={(val) => {
                    const parsed = Number(val);
                    if (Number.isFinite(parsed)) {
                      emit({ type: 'incisionMeridianChanged', eye: eye.eye, meridianDeg: parsed });
                    }
                  }}
                />
              </View>
            </View>

            <View role="group" aria-label={`IOL formulas ${eye.eye}`} style={styles.row}>
              {eye.availableFormulas.map((formula) => {
                const active = eye.activeFormula === formula;
                return (
                  <Pressable
                    key={formula}
                    role="button"
                    aria-pressed={active}
                    disabled={readOnly}
                    onPress={() => emit({ type: 'formulaSelected', eye: eye.eye, formula })}
                    style={(s: PressState) => [
                      styles.chip,
                      {
                        borderColor: active ? t.primary : t.border,
                        backgroundColor: active ? t.primarySoft : t.surface,
                      },
                      focusRing(t, s.focused),
                    ]}
                  >
                    <Text style={{ color: active ? t.primary : t.text, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                      {formula}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View role="list" aria-label={`Candidate IOL powers ${eye.eye}`} style={styles.listGap}>
              {eye.candidates.map((row) => (
                <Pressable
                  key={row.id}
                  role="listitem"
                  disabled={readOnly}
                  onPress={() =>
                    emit({
                      type: 'candidateSelected',
                      eye: eye.eye,
                      candidateId: row.id,
                      powerDiopters: row.powerDiopters,
                    })
                  }
                  style={(s: PressState) => [
                    styles.candidateRow,
                    {
                      borderColor: row.isSelected ? t.primary : t.border,
                      backgroundColor: row.isSelected ? t.primarySoft : t.surface,
                    },
                    focusRing(t, s.focused),
                  ]}
                >
                  <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: t.fontMono }}>
                    {row.powerDiopters} → {row.predictedRefractionD}
                  </Text>
                  <Text style={{ color: t.textMuted, fontSize: t.textXs }}>
                    {row.toricCylinderModel ?? 'Spherical'}
                    {row.recommendedAxisDeg !== undefined ? ` · Axis ${row.recommendedAxisDeg}°` : ''}
                    {row.isEmmetropiaTarget ? ' · EMMETROPIA TARGET' : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ===========================================================================
// 2. EmrIntravitrealCourseTracker
// ===========================================================================

export interface EmrIntravitrealCourseTrackerProps {
  model: EmrIntravitrealCourseTrackerViewModel;
  headingId?: string;
  onIntent?: (intent: EmrIntravitrealCourseTrackerIntent) => void;
}

export function EmrIntravitrealCourseTracker({
  model,
  headingId = 'emr-intravitreal-course-tracker-heading',
  onIntent,
}: EmrIntravitrealCourseTrackerProps) {
  const t = useEmrTheme();
  const font = fontFamily(t);
  const readOnly = !!model.readOnly;
  const courses = resolveIntravitrealVisibleCourses(model);

  const emit = (intent: EmrIntravitrealCourseTrackerIntent) => {
    if (!readOnly) onIntent?.(intent);
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View style={styles.titleBlock}>
          <Text style={[styles.tag, { backgroundColor: t.primarySoft, color: t.primary, fontFamily: t.fontMono }]}>
            INTRAVITREAL THERAPY & OCT CST TRACKER
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {model.title ?? 'Intravitreal Anti-VEGF / Steroid Longitudinal Course'}
          </Text>
        </View>
        <View role="group" aria-label="Active eye filter" style={styles.row}>
          {(['OD', 'OS', 'OU'] as const).map((eyeOpt) => {
            const active = model.activeEye === eyeOpt;
            return (
              <Pressable
                key={eyeOpt}
                role="button"
                aria-pressed={active}
                disabled={readOnly}
                onPress={() => emit({ type: 'activeEyeChanged', eye: eyeOpt })}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                ]}
              >
                <Text style={{ color: active ? t.primary : t.text, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                  {eyeOpt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {courses.map((course) => {
        const delta = computeIntravitrealCstDelta(course.baselineCstUm, course.latestCstUm);
        return (
          <View
            key={course.eye}
            role="group"
            aria-label={`Intravitreal course ${course.eye}`}
            style={[styles.eyePanel, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
          >
            <View style={styles.rowBetween}>
              <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                {course.eye} · {course.indication} · {course.currentAgent}
              </Text>
              {course.badge ? <EmrBadgeView badge={course.badge} /> : null}
            </View>

            <View style={styles.kvGrid}>
              <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surface }]}>
                <Text style={{ color: t.textMuted, fontSize: t.text2xs }}>Injections</Text>
                <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }}>
                  #{course.totalInjectionsCount} (q{course.currentIntervalWeeks}w)
                </Text>
              </View>
              <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surface }]}>
                <Text style={{ color: t.textMuted, fontSize: t.text2xs }}>CST Baseline → Latest</Text>
                <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }}>
                  {course.baselineCstUm} → {course.latestCstUm} µm ({delta.deltaUm} µm / {delta.pctChange}%)
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <EmrButton
                small
                variant="outline"
                label={`Shorten q${Math.max(4, course.currentIntervalWeeks - 2)}w`}
                disabled={readOnly}
                onPress={() =>
                  emit({
                    type: 'intervalAdjusted',
                    eye: course.eye,
                    nextIntervalWeeks: Math.max(4, course.currentIntervalWeeks - 2),
                    decision: 'inject-shorten',
                  })
                }
              />
              <EmrButton
                small
                variant="outline"
                label={`Extend q${course.currentIntervalWeeks + 2}w`}
                disabled={readOnly}
                onPress={() =>
                  emit({
                    type: 'intervalAdjusted',
                    eye: course.eye,
                    nextIntervalWeeks: course.currentIntervalWeeks + 2,
                    decision: 'inject-extend',
                  })
                }
              />
              <EmrButton
                small
                variant="primary"
                label={`+ Record Injection (${course.currentAgent})`}
                disabled={readOnly}
                onPress={() =>
                  emit({
                    type: 'recordInjectionRequested',
                    eye: course.eye,
                    agent: course.currentAgent,
                  })
                }
              />
            </View>

            <ScrollView horizontal role="list" aria-label={`Visits ${course.eye}`}>
              <View style={styles.row}>
                {course.visits.map((v) => {
                  const selected = model.selectedVisitId === v.id;
                  return (
                    <Pressable
                      key={v.id}
                      role="listitem"
                      onPress={() => onIntent?.({ type: 'visitSelected', eye: course.eye, visitId: v.id })}
                      style={[
                        styles.visitCard,
                        {
                          borderColor: selected ? t.primary : t.border,
                          backgroundColor: selected ? t.primarySoft : t.surface,
                        },
                      ]}
                    >
                      <Text style={{ color: t.text, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                        #{v.visitNumber} · {v.date}
                      </Text>
                      <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }}>
                        CST {v.cstUm} µm · BCVA {v.bcvaLabel}
                      </Text>
                      <Text style={{ color: t.textMuted, fontSize: t.text2xs }}>
                        {formatIntravitrealFluidFlags(v)} · {v.decision}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        );
      })}
    </View>
  );
}

// ===========================================================================
// 3. EmrCornealTopographySummary
// ===========================================================================

export interface EmrCornealTopographySummaryProps {
  model: EmrCornealTopographySummaryViewModel;
  headingId?: string;
  onIntent?: (intent: EmrCornealTopographySummaryIntent) => void;
}

export function EmrCornealTopographySummary({
  model,
  headingId = 'emr-corneal-topography-summary-heading',
  onIntent,
}: EmrCornealTopographySummaryProps) {
  const t = useEmrTheme();
  const font = fontFamily(t);
  const readOnly = !!model.readOnly;
  const eyes: readonly TopographyEyeSummary[] = [model.od, model.os];

  const emit = (intent: EmrCornealTopographySummaryIntent) => {
    if (!readOnly) onIntent?.(intent);
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View style={styles.titleBlock}>
          <Text style={[styles.tag, { backgroundColor: t.primarySoft, color: t.primary, fontFamily: t.fontMono }]}>
            SCHEIMPFLUG / PLACIDO CORNEAL TOMOGRAPHY
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {model.title ?? 'Corneal Topography & Belin/Ambrósio Ectasia Summary'}
          </Text>
        </View>
        <View role="group" aria-label="Topography map layers" style={styles.row}>
          {TOPOGRAPHY_MAP_OPTIONS.map((opt) => {
            const active = model.activeMap === opt.id;
            return (
              <Pressable
                key={opt.id}
                role="button"
                aria-pressed={active}
                disabled={readOnly}
                onPress={() => emit({ type: 'activeMapChanged', mapType: opt.id })}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                ]}
              >
                <Text style={{ color: active ? t.primary : t.text, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.dualGrid}>
        {eyes.map((eye) => {
          const screened = classifyEctasiaScreening(eye.kMaxD, eye.thinnestPachymetryUm, eye.badDIndex);
          return (
            <View
              key={eye.eye}
              role="group"
              aria-label={`Corneal topography ${eye.eye}`}
              style={[styles.eyePanel, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
            >
              <View style={styles.rowBetween}>
                <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                  {eye.eye} · {eye.deviceLabel} (QS: {eye.qualityScore})
                </Text>
                <EmrBadgeView
                  badge={{
                    label: `${eye.ectasiaRisk} (Screened: ${screened})`,
                    tone:
                      eye.ectasiaRisk === 'ectasia-suspect'
                        ? 'danger'
                        : eye.ectasiaRisk === 'borderline'
                          ? 'warning'
                          : 'success',
                  }}
                />
              </View>

              <View style={styles.kvGrid}>
                <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surface }]}>
                  <Text style={{ color: t.textMuted, fontSize: t.text2xs }}>Kmax / ΔK</Text>
                  <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }}>
                    {eye.kMaxD.toFixed(2)} D / {eye.astigmatismD.toFixed(2)} D
                  </Text>
                </View>
                <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surface }]}>
                  <Text style={{ color: t.textMuted, fontSize: t.text2xs }}>Central / Thinnest</Text>
                  <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }}>
                    {eye.centralPachymetryUm} / {eye.thinnestPachymetryUm} µm
                  </Text>
                </View>
                {eye.badDIndex !== undefined ? (
                  <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surface }]}>
                    <Text style={{ color: t.textMuted, fontSize: t.text2xs }}>BAD-D</Text>
                    <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }}>
                      {eye.badDIndex.toFixed(2)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View role="group" aria-label={`Ectasia risk ${eye.eye}`} style={styles.row}>
                {ECTASIA_RISK_OPTIONS.map((riskOpt) => {
                  const active = eye.ectasiaRisk === riskOpt.id;
                  return (
                    <Pressable
                      key={riskOpt.id}
                      role="button"
                      aria-pressed={active}
                      disabled={readOnly}
                      onPress={() => emit({ type: 'ectasiaRiskChanged', eye: eye.eye, risk: riskOpt.id })}
                      style={[
                        styles.chip,
                        {
                          borderColor: active ? t.primary : t.border,
                          backgroundColor: active ? t.primarySoft : t.surface,
                        },
                      ]}
                    >
                      <Text style={{ color: active ? t.primary : t.text, fontSize: t.textXs }}>{riskOpt.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View role="group" aria-label={`Assessment status ${eye.eye}`} style={styles.row}>
                {ASSESSMENT_STATUS_CHOICES.slice(0, 3).map((st) => {
                  const active = (eye.assessmentStatus ?? 'recorded') === st.value;
                  return (
                    <Pressable
                      key={st.value}
                      role="button"
                      aria-pressed={active}
                      disabled={readOnly}
                      onPress={() => emit({ type: 'eyeAssessmentStatusChanged', eye: eye.eye, status: st.value })}
                      style={[
                        styles.chip,
                        {
                          borderColor: active ? t.primary : t.border,
                          backgroundColor: active ? t.primarySoft : t.surface,
                        },
                      ]}
                    >
                      <Text style={{ color: active ? t.primary : t.text, fontSize: t.text2xs }}>{st.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ===========================================================================
// 4. EmrOphthalmicOperativeRecord
// ===========================================================================

export interface EmrOphthalmicOperativeRecordProps {
  model: EmrOphthalmicOperativeRecordViewModel;
  headingId?: string;
  onIntent?: (intent: EmrOphthalmicOperativeRecordIntent) => void;
}

export function EmrOphthalmicOperativeRecord({
  model,
  headingId = 'emr-ophthalmic-operative-record-heading',
  onIntent,
}: EmrOphthalmicOperativeRecordProps) {
  const t = useEmrTheme();
  const font = fontFamily(t);
  const readOnly = !!model.readOnly;

  const emit = (intent: EmrOphthalmicOperativeRecordIntent) => {
    if (!readOnly) onIntent?.(intent);
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View style={styles.titleBlock}>
          <Text style={[styles.tag, { backgroundColor: t.primarySoft, color: t.primary, fontFamily: t.fontMono }]}>
            OPHTHALMIC SURGICAL OPERATIVE RECORD · {model.operatedEye}
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {model.title ?? model.procedureName}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
            Surgeon: {model.surgeonName} · Anesthesia: {model.anesthesiaType}
          </Text>
        </View>
        <EmrButton
          small
          variant={model.timeoutVerified ? 'primary' : 'outline'}
          label={model.timeoutVerified ? '✓ WHO Timeout Verified' : 'Verify WHO Timeout'}
          disabled={readOnly}
          onPress={() => emit({ type: 'timeoutToggled', verified: !model.timeoutVerified })}
        />
      </View>

      <View style={styles.dualGrid}>
        <View
          role="group"
          aria-label="Intraoperative Steps & Phaco Metrics"
          style={[styles.eyePanel, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
        >
          <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
            Incision: {model.mainIncisionWidthMm} mm @ {model.mainIncisionMeridianDeg}° · Capsulorhexis: {model.capsulorhexisStatus}
          </Text>
          {model.phacoMetrics ? (
            <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: t.fontMono }}>
              CDE {model.phacoMetrics.cdeSeconds}s · U/S {model.phacoMetrics.usTimeSeconds}s · BSS {model.phacoMetrics.bssVolumeMl}mL · OVD: {model.phacoMetrics.ovdUsed}
            </Text>
          ) : null}

          <View role="group" aria-label="Posterior capsule status" style={styles.row}>
            {POSTERIOR_CAPSULE_STATUSES.map((statusOpt) => {
              const active = model.posteriorCapsuleStatus === statusOpt;
              return (
                <Pressable
                  key={statusOpt}
                  role="button"
                  aria-pressed={active}
                  disabled={readOnly}
                  onPress={() => emit({ type: 'posteriorCapsuleStatusChanged', status: statusOpt })}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? t.primary : t.border,
                      backgroundColor: active ? t.primarySoft : t.surface,
                    },
                  ]}
                >
                  <Text style={{ color: active ? t.primary : t.text, fontSize: t.textXs }}>{statusOpt}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View
          role="group"
          aria-label="IOL Implant & Sign-off"
          style={[styles.eyePanel, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
        >
          <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
            IOL: {model.iolImplant.modelName} ({model.iolImplant.powerDiopters}) · {model.iolImplant.placement}
          </Text>
          <ThemedInput
            value={model.iolImplant.serialNumber}
            editable={!readOnly}
            aria-label="IOL Serial Number"
            onChangeText={(serialNumber) => emit({ type: 'iolSerialChanged', serialNumber })}
          />
          <Text style={{ color: t.textMuted, fontSize: t.textXs }}>
            Prophylaxis: {model.prophylaxis.intracameralAntibiotic} · Post-Op: {model.postOpRegimenSummary}
          </Text>
          <View style={styles.row}>
            <EmrButton
              small
              variant="primary"
              label="Sign Operative Note"
              disabled={readOnly}
              onPress={() => emit({ type: 'signOperativeNoteRequested' })}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

// ===========================================================================
// 5. EmrContactLensPrescription
// ===========================================================================

export interface EmrContactLensPrescriptionProps {
  model: EmrContactLensPrescriptionViewModel;
  headingId?: string;
  onIntent?: (intent: EmrContactLensPrescriptionIntent) => void;
}

export function EmrContactLensPrescription({
  model,
  headingId = 'emr-contact-lens-prescription-heading',
  onIntent,
}: EmrContactLensPrescriptionProps) {
  const t = useEmrTheme();
  const font = fontFamily(t);
  const readOnly = !!model.readOnly;
  const eyes: readonly ContactLensEyeFit[] = [model.od, model.os];

  const emit = (intent: EmrContactLensPrescriptionIntent) => {
    if (!readOnly) onIntent?.(intent);
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View style={styles.titleBlock}>
          <Text style={[styles.tag, { backgroundColor: t.primarySoft, color: t.primary, fontFamily: t.fontMono }]}>
            CONTACT LENS FITTING & FINAL RX
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {model.title ?? 'Contact Lens Evaluation & Final Prescription'}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>
            Issued: {model.issueDate} · Expires: {model.expiryDate} · {model.replacementSchedule} ({model.wearingScheduleHoursPerDay}h/day)
          </Text>
        </View>
        <View style={styles.row}>
          <EmrButton
            small
            variant="outline"
            label="Copy OD → OS"
            disabled={readOnly}
            onPress={() => emit({ type: 'copyEyeRequested', fromEye: 'OD', toEye: 'OS' })}
          />
          <EmrButton
            small
            variant={model.trialFinalized ? 'primary' : 'outline'}
            label={model.trialFinalized ? '✓ Trial Finalized' : 'Finalize Trial Rx'}
            disabled={readOnly}
            onPress={() => emit({ type: 'trialFinalizedToggled', finalized: !model.trialFinalized })}
          />
        </View>
      </View>

      <View style={styles.dualGrid}>
        {eyes.map((eyeFit) => (
          <View
            key={eyeFit.eye}
            role="group"
            aria-label={`Contact lens fit ${eyeFit.eye}`}
            style={[styles.eyePanel, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
          >
            <View style={styles.rowBetween}>
              <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                {eyeFit.eye} · {eyeFit.brandAndMaterial}
              </Text>
              <EmrBadgeView badge={{ label: eyeFit.modality, tone: 'info' }} />
            </View>

            <View style={styles.row}>
              <View style={styles.fieldFlex}>
                <Text style={{ color: t.textMuted, fontSize: t.text2xs }}>BC (mm)</Text>
                <ThemedInput
                  value={eyeFit.baseCurveMm}
                  editable={!readOnly}
                  aria-label={`Base curve ${eyeFit.eye}`}
                  onChangeText={(value) => emit({ type: 'eyeParameterChanged', eye: eyeFit.eye, field: 'baseCurveMm', value })}
                />
              </View>
              <View style={styles.fieldFlex}>
                <Text style={{ color: t.textMuted, fontSize: t.text2xs }}>DIA (mm)</Text>
                <ThemedInput
                  value={eyeFit.diameterMm}
                  editable={!readOnly}
                  aria-label={`Diameter ${eyeFit.eye}`}
                  onChangeText={(value) => emit({ type: 'eyeParameterChanged', eye: eyeFit.eye, field: 'diameterMm', value })}
                />
              </View>
              <View style={styles.fieldFlex}>
                <Text style={{ color: t.textMuted, fontSize: t.text2xs }}>Sphere (D)</Text>
                <ThemedInput
                  value={eyeFit.sphereD}
                  editable={!readOnly}
                  aria-label={`Sphere ${eyeFit.eye}`}
                  onChangeText={(value) => emit({ type: 'eyeParameterChanged', eye: eyeFit.eye, field: 'sphereD', value })}
                />
              </View>
            </View>

            <Text style={{ color: t.textMuted, fontSize: t.textXs }}>
              Centration: {eyeFit.centration} · Movement: {eyeFit.movementMm} · VA: {eyeFit.visualAcuityAchieved}
            </Text>

            <View role="group" aria-label={`Push-up test ${eyeFit.eye}`} style={styles.row}>
              {PUSH_UP_TEST_CHOICES.map((pushOpt) => {
                const active = eyeFit.pushUpTest === pushOpt;
                return (
                  <Pressable
                    key={pushOpt}
                    role="button"
                    aria-pressed={active}
                    disabled={readOnly}
                    onPress={() => emit({ type: 'fitAssessmentChanged', eye: eyeFit.eye, pushUpTest: pushOpt })}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? t.primary : t.border,
                        backgroundColor: active ? t.primarySoft : t.surface,
                      },
                    ]}
                  >
                    <Text style={{ color: active ? t.primary : t.text, fontSize: t.textXs }}>{pushOpt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
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
  titleBlock: {
    flex: 1,
    minWidth: 200,
    gap: 4,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '700',
  },
  alertBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  dualGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eyePanel: {
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  sideBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  kvGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kvBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 110,
  },
  fieldFlex: {
    flex: 1,
    minWidth: 120,
    gap: 4,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  listGap: {
    gap: 6,
  },
  candidateRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    gap: 2,
  },
  visitCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minWidth: 160,
    gap: 4,
  },
});
