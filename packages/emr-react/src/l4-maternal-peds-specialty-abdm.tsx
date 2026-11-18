'use client';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableStateCallbackType,
  type TextStyle,
} from 'react-native';
import type { ClinicalAssessmentStatus, EmrBadge, EmrTone } from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { EmrBadgeView } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import {
  AUDIOGRAM_CONDUCTION_VIEWS,
  CHEMO_DOSE_PERCENTAGES,
  GROWTH_CHART_METRICS,
  IMMUNIZATION_FILTERS,
  ODONTOGRAM_TOOTH_STATUSES,
  PARTOGRAM_ALERT_STATUSES,
  PARTOGRAM_MEMBRANE_STATUSES,
  REFERRAL_FILTERS,
  REFERRAL_LIFECYCLE_STATUSES,
  WAVEFORM_PAPER_SPEEDS,
  calculateEncounterChargeTotals,
  classifyGrowthZScore,
  computeDmftIndex,
  evaluatePartogramProgression,
  filterImmunizationDoses,
  filterReferrals,
  summarizeImmunizationCoverage,
  type AbdmConsentArtefactItem,
  type AudiogramEarRecord,
  type ChargeLineItem,
  type ChemoCycleItem,
  type EmrAbdmHealthLockerPanelIntent,
  type EmrAbdmHealthLockerPanelViewModel,
  type EmrAudiogramIntent,
  type EmrAudiogramViewModel,
  type EmrChemoRegimenRoadmapIntent,
  type EmrChemoRegimenRoadmapViewModel,
  type EmrEncounterChargeSheetIntent,
  type EmrEncounterChargeSheetViewModel,
  type EmrGrowthChartIntent,
  type EmrGrowthChartViewModel,
  type EmrImmunizationLedgerIntent,
  type EmrImmunizationLedgerViewModel,
  type EmrOdontogramIntent,
  type EmrOdontogramViewModel,
  type EmrPartogramIntent,
  type EmrPartogramViewModel,
  type EmrReferralTrackerIntent,
  type EmrReferralTrackerViewModel,
  type EmrWaveformStripViewerIntent,
  type EmrWaveformStripViewerViewModel,
  type GrowthMeasurementPoint,
  type ImmunizationDoseEntry,
  type OdontogramToothRecord,
  type PartogramCheckpoint,
  type ReferralItemRecord,
} from './l4-maternal-peds-specialty-abdm.logic';

export type {
  AbdmConsentArtefactItem,
  AudiogramEarRecord,
  ChargeLineItem,
  ChemoCycleItem,
  EmrAbdmHealthLockerPanelIntent,
  EmrAbdmHealthLockerPanelViewModel,
  EmrAudiogramIntent,
  EmrAudiogramViewModel,
  EmrChemoRegimenRoadmapIntent,
  EmrChemoRegimenRoadmapViewModel,
  EmrEncounterChargeSheetIntent,
  EmrEncounterChargeSheetViewModel,
  EmrGrowthChartIntent,
  EmrGrowthChartViewModel,
  EmrImmunizationLedgerIntent,
  EmrImmunizationLedgerViewModel,
  EmrOdontogramIntent,
  EmrOdontogramViewModel,
  EmrPartogramIntent,
  EmrPartogramViewModel,
  EmrReferralTrackerIntent,
  EmrReferralTrackerViewModel,
  EmrWaveformStripViewerIntent,
  EmrWaveformStripViewerViewModel,
  GrowthMeasurementPoint,
  ImmunizationDoseEntry,
  OdontogramToothRecord,
  PartogramCheckpoint,
  ReferralItemRecord,
};

type PressState = PressableStateCallbackType & { focused?: boolean };

// ===========================================================================
// 1. EmrPartogram
// ===========================================================================

export interface EmrPartogramProps {
  model: EmrPartogramViewModel;
  headingId?: string;
  onIntent?: (intent: EmrPartogramIntent) => void;
}

export function EmrPartogram({
  model,
  headingId = 'emr-partogram-heading',
  onIntent,
}: EmrPartogramProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;
  const prog = evaluatePartogramProgression(model.observations);

  const emit = (intent: EmrPartogramIntent) => {
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
            WHO LABOUR CARE GUIDE PARTOGRAM
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'WHO Labour Care Guide Partogram'}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{model.subtitle}</Text>
          ) : null}
        </View>
        <View style={styles.row}>
          <EmrBadgeView badge={{ label: model.gravidaParaLabel, tone: 'info' }} />
          <EmrBadgeView
            badge={{
              label: model.alertStatus,
              tone:
                model.alertStatus === 'action-line'
                  ? 'danger'
                  : model.alertStatus === 'alert-line'
                    ? 'warning'
                    : 'success',
            }}
          />
        </View>
      </View>

      {prog.fhrAbnormal || model.alertStatus !== 'normal' ? (
        <View
          role="alert"
          style={[
            styles.alertBanner,
            {
              borderColor: prog.fhrAbnormal || model.alertStatus === 'action-line' ? t.danger : t.warning,
              backgroundColor:
                prog.fhrAbnormal || model.alertStatus === 'action-line' ? t.dangerSoft : t.warningSoft,
            },
          ]}
        >
          <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
            Labour Alert: Dilation {prog.latestDilationCm} cm · FHR {prog.latestFhrBpm} bpm (
            {prog.fhrAbnormal ? 'FHR Abnormal' : model.alertStatus})
          </Text>
        </View>
      ) : null}

      <View style={styles.kvGrid}>
        <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <Text style={[font, { color: t.textMuted, fontSize: t.text2xs }]}>Latest Dilation</Text>
          <Text style={[bold, { color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }]}>
            {prog.latestDilationCm} cm
          </Text>
        </View>
        <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <Text style={[font, { color: t.textMuted, fontSize: t.text2xs }]}>Latest FHR</Text>
          <Text style={[bold, { color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }]}>
            {prog.latestFhrBpm} bpm
          </Text>
        </View>
        <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <Text style={[font, { color: t.textMuted, fontSize: t.text2xs }]}>Membranes</Text>
          <Text style={[bold, { color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }]}>
            {model.membraneStatus}
          </Text>
        </View>
      </View>

      <View style={styles.rowBetween}>
        <View role="group" aria-label="Membrane status" style={styles.row}>
          {PARTOGRAM_MEMBRANE_STATUSES.map((status) => {
            const active = model.membraneStatus === status;
            return (
              <Pressable
                key={status}
                role="button"
                aria-pressed={active}
                disabled={readOnly}
                onPress={() => emit({ type: 'membraneStatusChanged', status })}
                style={(s: PressState) => [
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                  focusRing(t, s.focused),
                ]}
              >
                <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                  {status}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View role="group" aria-label="Alert line status" style={styles.row}>
          {PARTOGRAM_ALERT_STATUSES.map((alertStatus) => {
            const active = model.alertStatus === alertStatus;
            return (
              <Pressable
                key={alertStatus}
                role="button"
                aria-pressed={active}
                disabled={readOnly}
                onPress={() => emit({ type: 'alertStatusChanged', alertStatus })}
                style={(s: PressState) => [
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                  focusRing(t, s.focused),
                ]}
              >
                <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                  {alertStatus}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View role="list" aria-label="Partogram checkpoints" style={styles.listGap}>
        {model.observations.map((obs) => {
          const selected = model.selectedHour === obs.hour;
          return (
            <Pressable
              key={obs.hour}
              role="listitem"
              disabled={readOnly}
              onPress={() => emit({ type: 'checkpointSelected', hour: obs.hour })}
              style={(s: PressState) => [
                styles.rowCard,
                {
                  borderColor: selected ? t.primary : t.border,
                  backgroundColor: selected ? t.primarySoft : t.surfaceRaised,
                },
                focusRing(t, s.focused),
              ]}
            >
              <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                Hr {obs.hour} ({obs.timeLabel}) · Cervix {obs.cervicalDilationCm} cm · Station{' '}
                {obs.descentStation >= 0 ? `+${obs.descentStation}` : obs.descentStation}
              </Text>
              <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
                FHR {obs.fhrBpm} bpm · Contractions {obs.contractionsPer10Min}/10m
                {obs.oxytocinUnitsPerL !== undefined ? ` · Oxytocin ${obs.oxytocinUnitsPerL} U/L` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ===========================================================================
// 2. EmrGrowthChart
// ===========================================================================

export interface EmrGrowthChartProps {
  model: EmrGrowthChartViewModel;
  headingId?: string;
  onIntent?: (intent: EmrGrowthChartIntent) => void;
}

export function EmrGrowthChart({
  model,
  headingId = 'emr-growth-chart-heading',
  onIntent,
}: EmrGrowthChartProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;

  const emit = (intent: EmrGrowthChartIntent) => {
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
            PEDIATRIC ANTHROPOMETRY · {model.standardLabel}
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'WHO / IAP Centile & Z-Score Growth Chart'}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{model.subtitle}</Text>
          ) : null}
        </View>
        <View style={styles.row}>
          <EmrBadgeView badge={{ label: model.standardLabel, tone: 'info' }} />
          {model.midParentalHeightCm !== undefined ? (
            <EmrBadgeView badge={{ label: `Target MPH: ${model.midParentalHeightCm} cm`, tone: 'neutral' }} />
          ) : null}
        </View>
      </View>

      <View role="group" aria-label="Growth chart metrics" style={styles.row}>
        {GROWTH_CHART_METRICS.map((mOpt) => {
          const active = model.activeMetric === mOpt.id;
          return (
            <Pressable
              key={mOpt.id}
              role="button"
              aria-pressed={active}
              disabled={readOnly}
              onPress={() => emit({ type: 'metricChanged', metric: mOpt.id })}
              style={(s: PressState) => [
                styles.chip,
                {
                  borderColor: active ? t.primary : t.border,
                  backgroundColor: active ? t.primarySoft : t.surface,
                },
                focusRing(t, s.focused),
              ]}
            >
              <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                {mOpt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View role="list" aria-label="Growth measurement points" style={styles.listGap}>
        {model.points.map((pt) => {
          const selected = model.selectedPointId === pt.id;
          const zClass = classifyGrowthZScore(pt.zScore);
          return (
            <Pressable
              key={pt.id}
              role="listitem"
              disabled={readOnly}
              onPress={() => emit({ type: 'pointSelected', pointId: pt.id })}
              style={(s: PressState) => [
                styles.rowCard,
                {
                  borderColor: selected ? t.primary : t.border,
                  backgroundColor: selected ? t.primarySoft : t.surfaceRaised,
                },
                focusRing(t, s.focused),
              ]}
            >
              <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                {pt.ageLabel} ({pt.ageMonths}m): {pt.value} {pt.unit} · {pt.centile}th centile (Z ={' '}
                {pt.zScore.toFixed(2)} SD)
              </Text>
              <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
                Classification: {pt.flag ?? zClass} ({zClass})
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ===========================================================================
// 3. EmrImmunizationLedger
// ===========================================================================

export interface EmrImmunizationLedgerProps {
  model: EmrImmunizationLedgerViewModel;
  headingId?: string;
  onIntent?: (intent: EmrImmunizationLedgerIntent) => void;
}

export function EmrImmunizationLedger({
  model,
  headingId = 'emr-immunization-ledger-heading',
  onIntent,
}: EmrImmunizationLedgerProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;
  const cov = summarizeImmunizationCoverage(model.doses);
  const visibleDoses = filterImmunizationDoses(model);

  const emit = (intent: EmrImmunizationLedgerIntent) => {
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
            IMMUNIZATION LEDGER · {model.scheduleStandard}
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'Longitudinal Vaccine Schedule & Cold-Chain Ledger'}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{model.subtitle}</Text>
          ) : null}
        </View>
        <View style={styles.row}>
          <EmrBadgeView badge={{ label: `Administered: ${cov.administeredCount}`, tone: 'success' }} />
          <EmrBadgeView badge={{ label: `Due: ${cov.dueCount}`, tone: 'info' }} />
          <EmrBadgeView
            badge={{
              label: `Overdue: ${cov.overdueCount}`,
              tone: cov.overdueCount > 0 ? 'danger' : 'neutral',
            }}
          />
        </View>
      </View>

      <View role="group" aria-label="Immunization filter" style={styles.row}>
        {IMMUNIZATION_FILTERS.map((flt) => {
          const active = (model.activeFilter ?? 'all') === flt.id;
          return (
            <Pressable
              key={flt.id}
              role="button"
              aria-pressed={active}
              disabled={readOnly}
              onPress={() => emit({ type: 'filterChanged', filter: flt.id })}
              style={(s: PressState) => [
                styles.chip,
                {
                  borderColor: active ? t.primary : t.border,
                  backgroundColor: active ? t.primarySoft : t.surface,
                },
                focusRing(t, s.focused),
              ]}
            >
              <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                {flt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View role="list" aria-label="Vaccine doses" style={styles.listGap}>
        {visibleDoses.map((dose) => {
          const selected = model.selectedDoseId === dose.id;
          return (
            <View
              key={dose.id}
              role="listitem"
              style={[
                styles.rowCard,
                {
                  borderColor: selected ? t.primary : t.border,
                  backgroundColor: selected ? t.primarySoft : t.surfaceRaised,
                },
              ]}
            >
              <View style={styles.rowBetween}>
                <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                  [{dose.ageGroupLabel}] {dose.vaccineName} ({dose.doseNumberLabel}) — {dose.status}
                </Text>
                <View style={styles.row}>
                  <Pressable
                    role="button"
                    disabled={readOnly}
                    onPress={() => emit({ type: 'doseSelected', doseId: dose.id })}
                    style={(s: PressState) => [
                      styles.chip,
                      { borderColor: t.border, backgroundColor: t.surface },
                      focusRing(t, s.focused),
                    ]}
                  >
                    <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>Inspect</Text>
                  </Pressable>
                  {dose.status === 'due' || dose.status === 'overdue' ? (
                    <Pressable
                      role="button"
                      disabled={readOnly}
                      onPress={() =>
                        emit({
                          type: 'administerDoseRequested',
                          doseId: dose.id,
                          vaccineName: dose.vaccineName,
                        })
                      }
                      style={(s: PressState) => [
                        styles.chip,
                        { borderColor: t.primary, backgroundColor: t.primarySoft },
                        focusRing(t, s.focused),
                      ]}
                    >
                      <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
                        Administer {dose.vaccineName}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
              <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
                Lot: {dose.batchLotNumber ?? 'Pending'} · Site: {dose.siteAndRoute ?? 'IM'}
                {dose.aefiReported ? ' · AEFI Reported' : ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ===========================================================================
// 4. EmrWaveformStripViewer
// ===========================================================================

export interface EmrWaveformStripViewerProps {
  model: EmrWaveformStripViewerViewModel;
  headingId?: string;
  onIntent?: (intent: EmrWaveformStripViewerIntent) => void;
}

export function EmrWaveformStripViewer({
  model,
  headingId = 'emr-waveform-strip-viewer-heading',
  onIntent,
}: EmrWaveformStripViewerProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;
  const activeLead = model.leads.find((l) => l.id === model.activeLeadId) ?? model.leads[0];

  const emit = (intent: EmrWaveformStripViewerIntent) => {
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
            {model.modality} · {model.paperSpeed} · {model.gain}
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? `${model.modality} Diagnostic Rhythm Strip`}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{model.subtitle}</Text>
          ) : null}
        </View>
        <View style={styles.row}>
          {model.criticalAlert ? (
            <EmrBadgeView badge={{ label: 'CRITICAL RHYTHM ALERT', tone: 'danger' }} />
          ) : null}
          <EmrBadgeView
            badge={{
              label: model.signed ? '✓ Signed Interpretation' : 'Unsigned Interpretation',
              tone: model.signed ? 'success' : 'warning',
            }}
          />
        </View>
      </View>

      <View style={styles.kvGrid}>
        <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <Text style={[font, { color: t.textMuted, fontSize: t.text2xs }]}>HR</Text>
          <Text style={[bold, { color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }]}>
            {model.intervals.hrBpm} bpm
          </Text>
        </View>
        {model.intervals.prMs !== undefined ? (
          <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
            <Text style={[font, { color: t.textMuted, fontSize: t.text2xs }]}>PR</Text>
            <Text style={[bold, { color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }]}>
              {model.intervals.prMs} ms
            </Text>
          </View>
        ) : null}
        {model.intervals.qrsMs !== undefined ? (
          <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
            <Text style={[font, { color: t.textMuted, fontSize: t.text2xs }]}>QRS</Text>
            <Text style={[bold, { color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }]}>
              {model.intervals.qrsMs} ms
            </Text>
          </View>
        ) : null}
        {model.intervals.qtcMs !== undefined ? (
          <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
            <Text style={[font, { color: t.textMuted, fontSize: t.text2xs }]}>QTc</Text>
            <Text style={[bold, { color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }]}>
              {model.intervals.qtcMs} ms
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.rowBetween}>
        <View role="group" aria-label="Waveform leads" style={styles.row}>
          {model.leads.map((lead) => {
            const active = model.activeLeadId === lead.id;
            return (
              <Pressable
                key={lead.id}
                role="button"
                aria-pressed={active}
                disabled={readOnly}
                onPress={() => emit({ type: 'leadSelected', leadId: lead.id })}
                style={(s: PressState) => [
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                  focusRing(t, s.focused),
                ]}
              >
                <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                  {lead.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View role="group" aria-label="Paper speed" style={styles.row}>
          {WAVEFORM_PAPER_SPEEDS.map((spd) => {
            const active = model.paperSpeed === spd;
            return (
              <Pressable
                key={spd}
                role="button"
                aria-pressed={active}
                disabled={readOnly}
                onPress={() => emit({ type: 'paperSpeedChanged', paperSpeed: spd })}
                style={(s: PressState) => [
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                  focusRing(t, s.focused),
                ]}
              >
                <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                  {spd}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {activeLead ? (
        <View style={[styles.rowCard, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
            {activeLead.label} ({activeLead.samplePoints.length} samples)
          </Text>
          <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
            {activeLead.samplePoints.map((n) => n.toFixed(2)).join(' · ')}
          </Text>
        </View>
      ) : null}

      <View style={styles.rowBetween}>
        <Text style={[font, { color: t.text, fontSize: t.textSm }]}>
          Interpretation: {model.interpretation}
        </Text>
        {!model.signed ? (
          <Pressable
            role="button"
            disabled={readOnly}
            onPress={() => emit({ type: 'signInterpretationRequested' })}
            style={(s: PressState) => [
              styles.chip,
              { borderColor: t.primary, backgroundColor: t.primarySoft },
              focusRing(t, s.focused),
            ]}
          >
            <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
              Sign Interpretation
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ===========================================================================
// 5. EmrOdontogram
// ===========================================================================

export interface EmrOdontogramProps {
  model: EmrOdontogramViewModel;
  headingId?: string;
  onIntent?: (intent: EmrOdontogramIntent) => void;
}

export function EmrOdontogram({
  model,
  headingId = 'emr-odontogram-heading',
  onIntent,
}: EmrOdontogramProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;
  const dmft = computeDmftIndex(model.teeth);
  const selectedTooth =
    model.teeth.find((tooth) => tooth.toothNumber === model.selectedToothNumber) ?? model.teeth[0];

  const emit = (intent: EmrOdontogramIntent) => {
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
            DENTAL ARCH ODONTOGRAM · {model.dentitionMode}
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'FDI Dental Arch & Periodontal Chart'}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{model.subtitle}</Text>
          ) : null}
        </View>
        <View style={styles.row}>
          <EmrBadgeView
            badge={{
              label: `DMFT: ${dmft.dmftTotal} (D=${dmft.decayed} M=${dmft.missing} F=${dmft.filled})`,
              tone: 'info',
            }}
          />
          {(['permanent-fdi', 'deciduous-fdi'] as const).map((mode) => {
            const active = model.dentitionMode === mode;
            return (
              <Pressable
                key={mode}
                role="button"
                aria-pressed={active}
                disabled={readOnly}
                onPress={() => emit({ type: 'dentitionModeChanged', dentitionMode: mode })}
                style={(s: PressState) => [
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                  focusRing(t, s.focused),
                ]}
              >
                <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                  {mode}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View role="group" aria-label="Dental arch teeth" style={styles.row}>
        {model.teeth.map((tooth) => {
          const active = model.selectedToothNumber === tooth.toothNumber;
          return (
            <Pressable
              key={tooth.toothNumber}
              role="button"
              aria-pressed={active}
              disabled={readOnly}
              onPress={() => emit({ type: 'toothSelected', toothNumber: tooth.toothNumber })}
              style={(s: PressState) => [
                styles.chip,
                {
                  borderColor: active ? t.primary : t.border,
                  backgroundColor: active ? t.primarySoft : t.surfaceRaised,
                },
                focusRing(t, s.focused),
              ]}
            >
              <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
                #{tooth.toothNumber} ({tooth.arch}) · {tooth.status}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selectedTooth ? (
        <View style={[styles.rowCard, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
            Tooth #{selectedTooth.toothNumber} ({selectedTooth.arch}) — {selectedTooth.status}
          </Text>
          <View role="group" aria-label="Assign tooth status" style={styles.row}>
            {ODONTOGRAM_TOOTH_STATUSES.map((st) => {
              const active = selectedTooth.status === st;
              return (
                <Pressable
                  key={st}
                  role="button"
                  aria-pressed={active}
                  disabled={readOnly}
                  onPress={() =>
                    emit({
                      type: 'toothStatusChanged',
                      toothNumber: selectedTooth.toothNumber,
                      status: st,
                    })
                  }
                  style={(s: PressState) => [
                    styles.chip,
                    {
                      borderColor: active ? t.primary : t.border,
                      backgroundColor: active ? t.primarySoft : t.surface,
                    },
                    focusRing(t, s.focused),
                  ]}
                >
                  <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                    {st}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ===========================================================================
// 6. EmrAudiogram
// ===========================================================================

export interface EmrAudiogramProps {
  model: EmrAudiogramViewModel;
  headingId?: string;
  onIntent?: (intent: EmrAudiogramIntent) => void;
}

export function EmrAudiogram({
  model,
  headingId = 'emr-audiogram-heading',
  onIntent,
}: EmrAudiogramProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;
  const ears: readonly AudiogramEarRecord[] = [model.rightEar, model.leftEar];

  const emit = (intent: EmrAudiogramIntent) => {
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
            PURE-TONE AUDIOMETRY & TYMPANOMETRY
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'Bilateral Pure-Tone Audiogram (250–8000 Hz)'}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{model.subtitle}</Text>
          ) : null}
        </View>
        <View role="group" aria-label="Conduction view" style={styles.row}>
          {AUDIOGRAM_CONDUCTION_VIEWS.map((view) => {
            const active = (model.activeConductionView ?? 'both') === view;
            return (
              <Pressable
                key={view}
                role="button"
                aria-pressed={active}
                disabled={readOnly}
                onPress={() => emit({ type: 'conductionViewChanged', view })}
                style={(s: PressState) => [
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                  focusRing(t, s.focused),
                ]}
              >
                <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                  {view}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.dualGrid}>
        {ears.map((earRec) => (
          <View
            key={earRec.ear}
            role="group"
            aria-label={`${earRec.ear} ear audiogram`}
            style={[styles.subPanel, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
          >
            <View style={styles.rowBetween}>
              <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                {earRec.ear} Ear · PTA {earRec.ptaDbHl} dB HL · {earRec.degreeClassification}
              </Text>
              <EmrBadgeView badge={{ label: `Tymp ${earRec.tympanogramType}`, tone: 'info' }} />
            </View>
            <View style={styles.row}>
              {earRec.thresholds.map((th) => (
                <Pressable
                  key={th.frequencyHz}
                  role="button"
                  disabled={readOnly}
                  onPress={() =>
                    emit({
                      type: 'thresholdSelected',
                      ear: earRec.ear,
                      frequencyHz: th.frequencyHz,
                    })
                  }
                  style={(s: PressState) => [
                    styles.chip,
                    { borderColor: t.border, backgroundColor: t.surface },
                    focusRing(t, s.focused),
                  ]}
                >
                  <Text style={[font, { color: t.text, fontSize: t.textXs }]}>
                    {th.frequencyHz}Hz: {th.airDbHl}dB
                    {th.boneDbHl !== undefined ? ` / BC ${th.boneDbHl}dB` : ''}
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
// 7. EmrChemoRegimenRoadmap
// ===========================================================================

export interface EmrChemoRegimenRoadmapProps {
  model: EmrChemoRegimenRoadmapViewModel;
  headingId?: string;
  onIntent?: (intent: EmrChemoRegimenRoadmapIntent) => void;
}

export function EmrChemoRegimenRoadmap({
  model,
  headingId = 'emr-chemo-regimen-roadmap-heading',
  onIntent,
}: EmrChemoRegimenRoadmapProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;

  const emit = (intent: EmrChemoRegimenRoadmapIntent) => {
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
            ONCOLOGY PROTOCOL · {model.protocolName}
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? `${model.protocolName} Systemic Chemotherapy Roadmap`}
          </Text>
          <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{model.diagnosisLabel}</Text>
        </View>
        <View style={styles.row}>
          <EmrBadgeView
            badge={{ label: `BSA ${model.bsaM2.toFixed(2)} m² · ECOG ${model.ecogStatus}`, tone: 'info' }}
          />
          <EmrBadgeView
            badge={{
              label: model.labClearancePassed ? '✓ Pre-Chemo Labs Cleared' : 'Hold: Labs Below Gate',
              tone: model.labClearancePassed ? 'success' : 'danger',
            }}
          />
        </View>
      </View>

      <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
        ANC: {model.ancCountLabel} · Platelets: {model.plateletCountLabel}
      </Text>

      <View role="list" aria-label="Chemotherapy cycles" style={styles.listGap}>
        {model.cycles.map((cyc) => {
          const selected = model.selectedCycleNumber === cyc.cycleNumber;
          return (
            <View
              key={cyc.cycleNumber}
              role="listitem"
              style={[
                styles.rowCard,
                {
                  borderColor: selected ? t.primary : t.border,
                  backgroundColor: selected ? t.primarySoft : t.surfaceRaised,
                },
              ]}
            >
              <View style={styles.rowBetween}>
                <Pressable
                  role="button"
                  disabled={readOnly}
                  onPress={() => emit({ type: 'cycleSelected', cycleNumber: cyc.cycleNumber })}
                  style={(s: PressState) => [focusRing(t, s.focused)]}
                >
                  <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                    Cycle {cyc.cycleNumber} ({cyc.plannedDate}) · {cyc.status} · Dose {cyc.dosePct}%
                  </Text>
                </Pressable>
                <View style={styles.row}>
                  {CHEMO_DOSE_PERCENTAGES.map((pct) => (
                    <Pressable
                      key={pct}
                      role="button"
                      aria-pressed={cyc.dosePct === pct}
                      disabled={readOnly}
                      onPress={() =>
                        emit({
                          type: 'cycleDoseAdjusted',
                          cycleNumber: cyc.cycleNumber,
                          dosePct: pct,
                        })
                      }
                      style={(s: PressState) => [
                        styles.chip,
                        {
                          borderColor: cyc.dosePct === pct ? t.primary : t.border,
                          backgroundColor: cyc.dosePct === pct ? t.primarySoft : t.surface,
                        },
                        focusRing(t, s.focused),
                      ]}
                    >
                      <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>{pct}%</Text>
                    </Pressable>
                  ))}
                  {!model.labClearancePassed ? (
                    <Pressable
                      role="button"
                      disabled={readOnly}
                      onPress={() =>
                        emit({
                          type: 'clearanceOverrideRequested',
                          cycleNumber: cyc.cycleNumber,
                        })
                      }
                      style={(s: PressState) => [
                        styles.chip,
                        { borderColor: t.warning, backgroundColor: t.warningSoft },
                        focusRing(t, s.focused),
                      ]}
                    >
                      <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
                        Override Gate C{cyc.cycleNumber}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
              <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
                {cyc.agentsSummary}
                {cyc.toxicityGradeNote ? ` · ${cyc.toxicityGradeNote}` : ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ===========================================================================
// 8. EmrReferralTracker
// ===========================================================================

export interface EmrReferralTrackerProps {
  model: EmrReferralTrackerViewModel;
  headingId?: string;
  onIntent?: (intent: EmrReferralTrackerIntent) => void;
}

export function EmrReferralTracker({
  model,
  headingId = 'emr-referral-tracker-heading',
  onIntent,
}: EmrReferralTrackerProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;
  const visibleReferrals = filterReferrals(model);

  const emit = (intent: EmrReferralTrackerIntent) => {
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
            CLOSED-LOOP CONSULT & REFERRAL TRACKER
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'Specialty Consultation & Inter-Facility Referral Tracker'}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{model.subtitle}</Text>
          ) : null}
        </View>
        <View role="group" aria-label="Referral filter" style={styles.row}>
          {REFERRAL_FILTERS.map((flt) => {
            const active = (model.activeFilter ?? 'all') === flt;
            return (
              <Pressable
                key={flt}
                role="button"
                aria-pressed={active}
                disabled={readOnly}
                onPress={() => emit({ type: 'filterChanged', filter: flt })}
                style={(s: PressState) => [
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                  focusRing(t, s.focused),
                ]}
              >
                <Text style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}>
                  {flt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View role="list" aria-label="Specialty referrals" style={styles.listGap}>
        {visibleReferrals.map((ref) => {
          const selected = model.selectedReferralId === ref.id;
          return (
            <View
              key={ref.id}
              role="listitem"
              style={[
                styles.rowCard,
                {
                  borderColor: selected ? t.primary : t.border,
                  backgroundColor: selected ? t.primarySoft : t.surfaceRaised,
                },
              ]}
            >
              <View style={styles.rowBetween}>
                <Pressable
                  role="button"
                  disabled={readOnly}
                  onPress={() => emit({ type: 'referralSelected', referralId: ref.id })}
                  style={(s: PressState) => [focusRing(t, s.focused)]}
                >
                  <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                    {ref.targetSpecialty} ({ref.urgency}) — {ref.status}
                  </Text>
                </Pressable>
                <View style={styles.row}>
                  {REFERRAL_LIFECYCLE_STATUSES.map((st) => (
                    <Pressable
                      key={st}
                      role="button"
                      aria-pressed={ref.status === st}
                      disabled={readOnly}
                      onPress={() =>
                        emit({ type: 'referralStatusUpdated', referralId: ref.id, status: st })
                      }
                      style={(s: PressState) => [
                        styles.chip,
                        {
                          borderColor: ref.status === st ? t.primary : t.border,
                          backgroundColor: ref.status === st ? t.primarySoft : t.surface,
                        },
                        focusRing(t, s.focused),
                      ]}
                    >
                      <Text style={[font, bold, { color: t.text, fontSize: t.text2xs }]}>{st}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
                Q: {ref.clinicalQuestion}
                {ref.consultantReplySummary ? ` · Reply: ${ref.consultantReplySummary}` : ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ===========================================================================
// 9. EmrEncounterChargeSheet
// ===========================================================================

export interface EmrEncounterChargeSheetProps {
  model: EmrEncounterChargeSheetViewModel;
  headingId?: string;
  onIntent?: (intent: EmrEncounterChargeSheetIntent) => void;
}

export function EmrEncounterChargeSheet({
  model,
  headingId = 'emr-encounter-charge-sheet-heading',
  onIntent,
}: EmrEncounterChargeSheetProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;
  const totals = calculateEncounterChargeTotals(model.lineItems);
  const curr = model.currencySymbol ?? '₹';

  const emit = (intent: EmrEncounterChargeSheetIntent) => {
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
            ENCOUNTER TARIFF & PRE-AUTH · {model.payerScheme}
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'Encounter Coding, Tariff & Pre-Authorization Sheet'}
          </Text>
          <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>
            Primary Dx: {model.primaryDiagnosisCode}
          </Text>
        </View>
        <View style={styles.row}>
          <EmrBadgeView
            badge={{
              label: model.preAuthStatus,
              tone:
                model.preAuthStatus === 'preauth-approved'
                  ? 'success'
                  : model.preAuthStatus === 'preauth-pending'
                    ? 'warning'
                    : 'info',
            }}
          />
          <Pressable
            role="button"
            disabled={readOnly}
            onPress={() => emit({ type: 'submitClaimRequested' })}
            style={(s: PressState) => [
              styles.chip,
              { borderColor: t.primary, backgroundColor: t.primarySoft },
              focusRing(t, s.focused),
            ]}
          >
            <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
              Submit Claim / Pre-Auth
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.kvGrid}>
        <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <Text style={[font, { color: t.textMuted, fontSize: t.text2xs }]}>Gross Total</Text>
          <Text style={[bold, { color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }]}>
            {curr}{totals.grossTotal.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <Text style={[font, { color: t.textMuted, fontSize: t.text2xs }]}>Payer Covered</Text>
          <Text style={[bold, { color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }]}>
            {curr}{totals.payerCoveredTotal.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <Text style={[font, { color: t.textMuted, fontSize: t.text2xs }]}>Patient Payable</Text>
          <Text style={[bold, { color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }]}>
            {curr}{totals.patientPayableTotal.toFixed(2)}
          </Text>
        </View>
      </View>

      <View role="list" aria-label="Encounter charge line items" style={styles.listGap}>
        {model.lineItems.map((item) => (
          <View
            key={item.id}
            role="listitem"
            style={[styles.rowCard, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
          >
            <View style={styles.rowBetween}>
              <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                [{item.code}] {item.description} ({item.category}) · {curr}{item.unitPrice.toFixed(2)}
              </Text>
              <View style={styles.row}>
                <ThemedInput
                  value={String(item.quantity)}
                  editable={!readOnly}
                  aria-label={`Quantity ${item.code}`}
                  onChangeText={(val) => {
                    const parsed = Number(val);
                    if (Number.isFinite(parsed) && parsed >= 0) {
                      emit({ type: 'lineQuantityChanged', itemId: item.id, quantity: parsed });
                    }
                  }}
                />
                <Pressable
                  role="button"
                  aria-pressed={item.coveredByPayer}
                  disabled={readOnly}
                  onPress={() =>
                    emit({
                      type: 'coverageToggled',
                      itemId: item.id,
                      coveredByPayer: !item.coveredByPayer,
                    })
                  }
                  style={(s: PressState) => [
                    styles.chip,
                    {
                      borderColor: item.coveredByPayer ? t.primary : t.border,
                      backgroundColor: item.coveredByPayer ? t.primarySoft : t.surface,
                    },
                    focusRing(t, s.focused),
                  ]}
                >
                  <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
                    {item.coveredByPayer ? 'Payer Covered' : 'Self-Pay'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ===========================================================================
// 10. EmrAbdmHealthLockerPanel
// ===========================================================================

export interface EmrAbdmHealthLockerPanelProps {
  model: EmrAbdmHealthLockerPanelViewModel;
  headingId?: string;
  onIntent?: (intent: EmrAbdmHealthLockerPanelIntent) => void;
}

export function EmrAbdmHealthLockerPanel({
  model,
  headingId = 'emr-abdm-health-locker-panel-heading',
  onIntent,
}: EmrAbdmHealthLockerPanelProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;

  const emit = (intent: EmrAbdmHealthLockerPanelIntent) => {
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
            AYUSHMAN BHARAT DIGITAL MISSION (ABDM) · HIU / HIP
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'ABHA Identity, Scan & Share & FHIR Consent Artefacts'}
          </Text>
          <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>
            ABHA: {model.abhaNumber} · {model.abhaAddress} · Linked Contexts: {model.linkedCareContextsCount}
          </Text>
        </View>
        <View style={styles.row}>
          <EmrBadgeView
            badge={{
              label: model.kycVerified ? '✓ ABHA KYC Verified' : 'ABHA KYC Pending',
              tone: model.kycVerified ? 'success' : 'warning',
            }}
          />
          {model.scanAndShareToken ? (
            <EmrBadgeView badge={{ label: `Token: ${model.scanAndShareToken}`, tone: 'info' }} />
          ) : null}
        </View>
      </View>

      <View style={styles.row}>
        <Pressable
          role="button"
          disabled={readOnly}
          onPress={() => emit({ type: 'requestNewConsent' })}
          style={(s: PressState) => [
            styles.chip,
            { borderColor: t.primary, backgroundColor: t.primarySoft },
            focusRing(t, s.focused),
          ]}
        >
          <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
            + Request HIU Consent
          </Text>
        </Pressable>
        <Pressable
          role="button"
          disabled={readOnly}
          onPress={() => emit({ type: 'linkCareContextRequested' })}
          style={(s: PressState) => [
            styles.chip,
            { borderColor: t.border, backgroundColor: t.surface },
            focusRing(t, s.focused),
          ]}
        >
          <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
            Link HIP Care Context
          </Text>
        </Pressable>
      </View>

      <View role="list" aria-label="ABDM consent artefacts" style={styles.listGap}>
        {model.consents.map((con) => {
          const selected = model.selectedConsentId === con.id;
          return (
            <View
              key={con.id}
              role="listitem"
              style={[
                styles.rowCard,
                {
                  borderColor: selected ? t.primary : t.border,
                  backgroundColor: selected ? t.primarySoft : t.surfaceRaised,
                },
              ]}
            >
              <View style={styles.rowBetween}>
                <Pressable
                  role="button"
                  disabled={readOnly}
                  onPress={() => emit({ type: 'consentSelected', consentId: con.id })}
                  style={(s: PressState) => [focusRing(t, s.focused)]}
                >
                  <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                    {con.requesterHiuName} ({con.status}) — {con.purpose}
                  </Text>
                </Pressable>
                <View style={styles.row}>
                  {con.status === 'REQUESTED' ? (
                    <Pressable
                      role="button"
                      disabled={readOnly}
                      onPress={() =>
                        emit({
                          type: 'consentActionRequested',
                          consentId: con.id,
                          action: 'approve',
                        })
                      }
                      style={(s: PressState) => [
                        styles.chip,
                        { borderColor: t.primary, backgroundColor: t.primarySoft },
                        focusRing(t, s.focused),
                      ]}
                    >
                      <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
                        Approve
                      </Text>
                    </Pressable>
                  ) : null}
                  {con.status === 'GRANTED' ? (
                    <Pressable
                      role="button"
                      disabled={readOnly}
                      onPress={() =>
                        emit({
                          type: 'consentActionRequested',
                          consentId: con.id,
                          action: 'revoke',
                        })
                      }
                      style={(s: PressState) => [
                        styles.chip,
                        { borderColor: t.danger, backgroundColor: t.dangerSoft },
                        focusRing(t, s.focused),
                      ]}
                    >
                      <Text style={[font, bold, { color: t.danger, fontSize: t.textXs }]}>
                        Revoke
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
              <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
                FHIR HI Types: {con.hiTypes.join(', ')} · Valid Until: {con.validUntilLabel}
              </Text>
            </View>
          );
        })}
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
  subPanel: {
    flex: 1,
    minWidth: 260,
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
  chip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  listGap: {
    gap: 6,
  },
  rowCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
});
