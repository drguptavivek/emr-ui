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
import { EmrBadgeView } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import {
  ANAESTHESIA_PHASES,
  ED_ACUITY_FILTERS,
  ED_DISPOSITION_STATES,
  ED_ESI_LEVELS,
  RESUSCITATION_QUICK_ACTION_OPTIONS,
  RESUSCITATION_RHYTHMS,
  RESUSCITATION_STATUSES,
  computeFluidBalanceSummary,
  countLabCriticalCells,
  filterEdTrackPatients,
  filterLabCumulativeRows,
  formatResuscitationElapsed,
  summarizeEdTrackCensus,
  type AnaesthesiaCheckpoint,
  type AnaesthesiaMedicationEntry,
  type AntibiogramIsolate,
  type AntibiogramSusceptibilityRow,
  type EdDispositionState,
  type EdEsiAcuityLevel,
  type EdTrackPatientRow,
  type EmrAnaesthesiaRecordIntent,
  type EmrAnaesthesiaRecordViewModel,
  type EmrEdTrackBoardIntent,
  type EmrEdTrackBoardViewModel,
  type EmrFluidBalanceChartIntent,
  type EmrFluidBalanceChartViewModel,
  type EmrLabCumulativeGridIntent,
  type EmrLabCumulativeGridViewModel,
  type EmrMicrobiologyAntibiogramIntent,
  type EmrMicrobiologyAntibiogramViewModel,
  type EmrResuscitationEventLogIntent,
  type EmrResuscitationEventLogViewModel,
  type EmrSpecimenCollectionBarIntent,
  type EmrSpecimenCollectionBarViewModel,
  type EmrSurgicalImplantLogIntent,
  type EmrSurgicalImplantLogViewModel,
  type EmrTriageAssessmentCardIntent,
  type EmrTriageAssessmentCardViewModel,
  type FluidBalanceStreamEntry,
  type LabAbnormalityFlag,
  type LabCumulativeAnalyteRow,
  type ResuscitationLogEntry,
  type ResuscitationQuickAction,
  type SpecimenContainerItem,
  type SurgicalImplantEntry,
  type TriageVitalSummaryItem,
} from './l4-acute-lab-perioperative.logic';

export type {
  AnaesthesiaCheckpoint,
  AnaesthesiaMedicationEntry,
  AntibiogramIsolate,
  AntibiogramSusceptibilityRow,
  EdDispositionState,
  EdEsiAcuityLevel,
  EdTrackPatientRow,
  EmrAnaesthesiaRecordIntent,
  EmrAnaesthesiaRecordViewModel,
  EmrEdTrackBoardIntent,
  EmrEdTrackBoardViewModel,
  EmrFluidBalanceChartIntent,
  EmrFluidBalanceChartViewModel,
  EmrLabCumulativeGridIntent,
  EmrLabCumulativeGridViewModel,
  EmrMicrobiologyAntibiogramIntent,
  EmrMicrobiologyAntibiogramViewModel,
  EmrResuscitationEventLogIntent,
  EmrResuscitationEventLogViewModel,
  EmrSpecimenCollectionBarIntent,
  EmrSpecimenCollectionBarViewModel,
  EmrSurgicalImplantLogIntent,
  EmrSurgicalImplantLogViewModel,
  EmrTriageAssessmentCardIntent,
  EmrTriageAssessmentCardViewModel,
  FluidBalanceStreamEntry,
  LabAbnormalityFlag,
  LabCumulativeAnalyteRow,
  ResuscitationLogEntry,
  ResuscitationQuickAction,
  SpecimenContainerItem,
  SurgicalImplantEntry,
  TriageVitalSummaryItem,
};

type PressState = PressableStateCallbackType & { focused?: boolean };

// ===========================================================================
// 1. EmrEdTrackBoard
// ===========================================================================

export interface EmrEdTrackBoardProps {
  model: EmrEdTrackBoardViewModel;
  headingId?: string;
  onIntent?: (intent: EmrEdTrackBoardIntent) => void;
}

export function EmrEdTrackBoard({
  model,
  headingId = 'emr-ed-track-board-heading',
  onIntent,
}: EmrEdTrackBoardProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;
  const census = summarizeEdTrackCensus(model.patients);
  const visible = filterEdTrackPatients(model);

  const emit = (intent: EmrEdTrackBoardIntent) => {
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
          <Text
            style={[
              styles.tag,
              { backgroundColor: t.primarySoft, color: t.primary, fontFamily: t.fontMono },
            ]}
          >
            EMERGENCY DEPARTMENT TRACK BOARD
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'ED Real-Time Bay Census & Patient Flow'}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{model.subtitle}</Text>
          ) : null}
        </View>
        <View style={styles.chipRow}>
          <EmrBadgeView badge={{ label: `Census: ${census.totalPatients}`, tone: 'info' }} />
          <EmrBadgeView
            badge={{
              label: `ESI 1-2: ${census.criticalEsi12Count}`,
              tone: census.criticalEsi12Count > 0 ? 'danger' : 'success',
            }}
          />
          <EmrBadgeView
            badge={{
              label: `Boarding: ${census.boardingCount}`,
              tone: census.boardingCount > 0 ? 'warning' : 'info',
            }}
          />
          <EmrBadgeView
            badge={{
              label: `>=4h LOS: ${census.fourHourBreachCount}`,
              tone: census.fourHourBreachCount > 0 ? 'danger' : 'success',
            }}
          />
        </View>
      </View>

      <View role="group" aria-label="ESI Acuity Filter" style={styles.chipRow}>
        {ED_ACUITY_FILTERS.map((flt) => {
          const active = (model.activeAcuityFilter ?? 'all') === flt;
          return (
            <Pressable
              key={String(flt)}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: readOnly }}
              disabled={readOnly}
              onPress={() => emit({ type: 'acuityFilterChanged', filter: flt })}
              style={(s: PressState) => [
                styles.chip,
                {
                  borderColor: active ? t.primary : t.border,
                  backgroundColor: active ? t.primarySoft : t.surface,
                },
                focusRing(t, s.focused),
              ]}
            >
              <Text
                style={[
                  font,
                  bold,
                  { color: active ? t.primary : t.text, fontSize: t.textXs },
                ]}
              >
                {flt === 'all' ? 'All Acuities' : `ESI ${flt}`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View role="list" style={styles.listStack}>
        {visible.map((pt) => {
          const selected = model.selectedPatientId === pt.id;
          return (
            <View
              key={pt.id}
              role="listitem"
              style={[
                styles.panel,
                {
                  borderColor: selected ? t.primary : t.border,
                  backgroundColor: selected ? t.primarySoft : t.surfaceRaised,
                },
              ]}
            >
              <View style={styles.rowBetween}>
                <Pressable
                  accessibilityRole="button"
                  disabled={readOnly}
                  onPress={() => emit({ type: 'patientSelected', patientId: pt.id })}
                  style={(s: PressState) => [styles.chipRow, focusRing(t, s.focused)]}
                >
                  <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                    {pt.bayLabel} · {pt.patientName} ({pt.ageSexLabel})
                  </Text>
                  <EmrBadgeView
                    badge={{
                      label: `ESI ${pt.esiLevel}`,
                      tone: pt.esiLevel <= 2 ? 'danger' : pt.esiLevel === 3 ? 'warning' : 'info',
                    }}
                  />
                </Pressable>
                <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
                  LOS {pt.losMinutes}m · Labs: {pt.pendingLabsCount} · Img: {pt.pendingImagingCount}
                </Text>
              </View>
              <Text style={[font, { color: t.text, fontSize: t.textXs }]}>{pt.chiefComplaint}</Text>
              <View style={styles.chipRow}>
                {ED_DISPOSITION_STATES.map((disp) => {
                  const activeDisp = pt.disposition === disp;
                  return (
                    <Pressable
                      key={disp}
                      accessibilityRole="button"
                      accessibilityState={{ selected: activeDisp, disabled: readOnly }}
                      disabled={readOnly}
                      onPress={() =>
                        emit({ type: 'dispositionChanged', patientId: pt.id, disposition: disp })
                      }
                      style={(s: PressState) => [
                        styles.chip,
                        {
                          borderColor: activeDisp ? t.primary : t.border,
                          backgroundColor: activeDisp ? t.primarySoft : t.surface,
                        },
                        focusRing(t, s.focused),
                      ]}
                    >
                      <Text
                        style={[
                          font,
                          bold,
                          { color: activeDisp ? t.primary : t.text, fontSize: t.textXs },
                        ]}
                      >
                        {disp}
                      </Text>
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
// 2. EmrTriageAssessmentCard
// ===========================================================================

export interface EmrTriageAssessmentCardProps {
  model: EmrTriageAssessmentCardViewModel;
  headingId?: string;
  onIntent?: (intent: EmrTriageAssessmentCardIntent) => void;
}

export function EmrTriageAssessmentCard({
  model,
  headingId = 'emr-triage-assessment-card-heading',
  onIntent,
}: EmrTriageAssessmentCardProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;

  const emit = (intent: EmrTriageAssessmentCardIntent) => {
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
          <Text
            style={[
              styles.tag,
              { backgroundColor: t.primarySoft, color: t.primary, fontFamily: t.fontMono },
            ]}
          >
            EMERGENCY TRIAGE ASSESSMENT
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'ESI / MTS Primary Survey & Triage Assessment'}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{model.subtitle}</Text>
          ) : null}
        </View>
        <View style={styles.chipRow}>
          <EmrBadgeView badge={{ label: model.arrivalMode, tone: 'info' }} />
          <EmrBadgeView
            badge={{
              label: `ESI Level ${model.esiLevel}`,
              tone: model.esiLevel <= 2 ? 'danger' : model.esiLevel === 3 ? 'warning' : 'success',
            }}
          />
          <EmrBadgeView
            badge={{
              label: model.finalized ? '✓ Triage Finalized' : 'Draft Triage',
              tone: model.finalized ? 'success' : 'warning',
            }}
          />
        </View>
      </View>

      <View style={[styles.panel, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
        <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
          Chief Complaint: {model.chiefComplaint}
        </Text>
        {model.redFlags.length > 0 ? (
          <View
            role="alert"
            style={[styles.alert, { borderColor: t.danger, backgroundColor: t.dangerSoft }]}
          >
            <Text style={[font, bold, { color: t.danger, fontSize: t.textXs }]}>
              Red Flags: {model.redFlags.join(' · ')}
            </Text>
          </View>
        ) : null}
        <View style={styles.chipRow}>
          {model.vitalsSummary.map((v) => (
            <View
              key={v.label}
              style={[
                styles.kvBox,
                {
                  borderColor: v.abnormal ? t.danger : t.border,
                  backgroundColor: t.surface,
                },
              ]}
            >
              <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>{v.label}</Text>
              <Text
                style={[
                  font,
                  bold,
                  { color: v.abnormal ? t.danger : t.text, fontSize: t.textSm },
                ]}
              >
                {v.value}
              </Text>
            </View>
          ))}
          <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surface }]}>
            <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>Pain Score</Text>
            <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
              {model.painScore} / 10
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rowBetween}>
        <View role="group" aria-label="ESI Acuity Selector" style={styles.chipRow}>
          {ED_ESI_LEVELS.map((lvl) => {
            const active = model.esiLevel === lvl;
            return (
              <Pressable
                key={lvl}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: readOnly }}
                disabled={readOnly}
                onPress={() => emit({ type: 'esiLevelSelected', esiLevel: lvl })}
                style={(s: PressState) => [
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                  focusRing(t, s.focused),
                ]}
              >
                <Text
                  style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}
                >
                  ESI {lvl}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.chipRow}>
          <Pressable
            accessibilityRole="button"
            disabled={readOnly}
            onPress={() =>
              emit({ type: 'isolationToggled', isolationRequired: !model.isolationRequired })
            }
            style={(s: PressState) => [
              styles.chip,
              {
                borderColor: model.isolationRequired ? t.warning : t.border,
                backgroundColor: model.isolationRequired ? t.warningSoft : t.surface,
              },
              focusRing(t, s.focused),
            ]}
          >
            <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
              {model.isolationRequired ? '⚠ Isolation Required' : 'Standard Precautions'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={readOnly || model.finalized}
            onPress={() => emit({ type: 'triageFinalized' })}
            style={(s: PressState) => [
              styles.chip,
              { borderColor: t.primary, backgroundColor: t.primarySoft },
              focusRing(t, s.focused),
            ]}
          >
            <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
              Finalize Triage
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ===========================================================================
// 3. EmrResuscitationEventLog
// ===========================================================================

export interface EmrResuscitationEventLogProps {
  model: EmrResuscitationEventLogViewModel;
  headingId?: string;
  onIntent?: (intent: EmrResuscitationEventLogIntent) => void;
}

export function EmrResuscitationEventLog({
  model,
  headingId = 'emr-resuscitation-event-log-heading',
  onIntent,
}: EmrResuscitationEventLogProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;

  const emit = (intent: EmrResuscitationEventLogIntent) => {
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
          <Text
            style={[
              styles.tag,
              { backgroundColor: t.primarySoft, color: t.primary, fontFamily: t.fontMono },
            ]}
          >
            ACLS / CODE BLUE RESUSCITATION LOG
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'Real-Time Resuscitation Event Recorder'}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{model.subtitle}</Text>
          ) : null}
        </View>
        <View style={styles.chipRow}>
          <EmrBadgeView
            badge={{
              label: `Status: ${model.codeStatus.toUpperCase()}`,
              tone:
                model.codeStatus === 'active'
                  ? 'danger'
                  : model.codeStatus === 'rosc'
                    ? 'success'
                    : 'info',
            }}
          />
          <EmrBadgeView
            badge={{
              label: `Elapsed: ${formatResuscitationElapsed(model.elapsedSeconds)}`,
              tone: 'warning',
            }}
          />
        </View>
      </View>

      <View style={styles.chipRow}>
        <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>Current Rhythm</Text>
          <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
            {model.currentRhythm}
          </Text>
        </View>
        <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>CPR Cycles</Text>
          <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>{model.cprCycles}</Text>
        </View>
        <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>Defib Shocks</Text>
          <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
            {model.shockCount}
          </Text>
        </View>
        <View style={[styles.kvBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>Epinephrine Doses</Text>
          <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
            {model.epinephrineDoses}
          </Text>
        </View>
      </View>

      <View style={styles.rowBetween}>
        <View role="group" aria-label="Rhythm Strip Selector" style={styles.chipRow}>
          {RESUSCITATION_RHYTHMS.map((rhy) => {
            const active = model.currentRhythm === rhy;
            return (
              <Pressable
                key={rhy}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: readOnly }}
                disabled={readOnly}
                onPress={() => emit({ type: 'rhythmChanged', rhythm: rhy })}
                style={(s: PressState) => [
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                  focusRing(t, s.focused),
                ]}
              >
                <Text
                  style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}
                >
                  {rhy}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View role="group" aria-label="Code Status Selector" style={styles.chipRow}>
          {RESUSCITATION_STATUSES.map((st) => {
            const active = model.codeStatus === st;
            return (
              <Pressable
                key={st}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: readOnly }}
                disabled={readOnly}
                onPress={() => emit({ type: 'codeStatusChanged', status: st })}
                style={(s: PressState) => [
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                  focusRing(t, s.focused),
                ]}
              >
                <Text
                  style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}
                >
                  {st.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View role="group" aria-label="One-Tap ACLS Actions" style={styles.chipRow}>
        {RESUSCITATION_QUICK_ACTION_OPTIONS.map((act) => (
          <Pressable
            key={act.id}
            accessibilityRole="button"
            disabled={readOnly}
            onPress={() => emit({ type: 'quickActionLogged', action: act.id })}
            style={(s: PressState) => [
              styles.chip,
              { borderColor: t.border, backgroundColor: t.surfaceRaised },
              focusRing(t, s.focused),
            ]}
          >
            <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>{act.label}</Text>
          </Pressable>
        ))}
      </View>

      <View role="list" style={styles.listStack}>
        {model.events.map((ev) => (
          <View
            key={ev.id}
            role="listitem"
            style={[styles.panel, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
          >
            <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
              [{ev.timestampLabel}] ({ev.category}) {ev.description} — {ev.clinician ?? 'Code Team'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ===========================================================================
// 4. EmrSpecimenCollectionBar
// ===========================================================================

export interface EmrSpecimenCollectionBarProps {
  model: EmrSpecimenCollectionBarViewModel;
  headingId?: string;
  onIntent?: (intent: EmrSpecimenCollectionBarIntent) => void;
}

export function EmrSpecimenCollectionBar({
  model,
  headingId = 'emr-specimen-collection-bar-heading',
  onIntent,
}: EmrSpecimenCollectionBarProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;

  const emit = (intent: EmrSpecimenCollectionBarIntent) => {
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
          <Text
            style={[
              styles.tag,
              { backgroundColor: t.primarySoft, color: t.primary, fontFamily: t.fontMono },
            ]}
          >
            PHLEBOTOMY & SPECIMEN BARCODE VERIFICATION
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'Specimen Collection & Wristband Verification'}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{model.subtitle}</Text>
          ) : null}
        </View>
        <View style={styles.chipRow}>
          <EmrBadgeView badge={{ label: `Accession: ${model.orderAccession}`, tone: 'info' }} />
          <Pressable
            accessibilityRole="button"
            disabled={readOnly}
            onPress={() =>
              emit({ type: 'patientVerificationToggled', verified: !model.patientVerified })
            }
            style={(s: PressState) => [
              styles.chip,
              {
                borderColor: model.patientVerified ? t.success : t.warning,
                backgroundColor: model.patientVerified ? t.successSoft : t.warningSoft,
              },
              focusRing(t, s.focused),
            ]}
          >
            <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
              {model.patientVerified ? '✓ 2-ID Wristband Verified' : 'Verify Patient ID'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View role="list" style={styles.listStack}>
        {model.containers.map((ct) => (
          <View
            key={ct.id}
            role="listitem"
            style={[styles.panel, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
          >
            <View style={styles.rowBetween}>
              <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                {ct.barcode} · {ct.tubeType} {ct.stat ? '(STAT)' : ''} · {ct.volumeMl} mL
              </Text>
              <EmrBadgeView
                badge={{
                  label: ct.status,
                  tone:
                    ct.status === 'rejected-hemolyzed'
                      ? 'danger'
                      : ct.status === 'pending'
                        ? 'warning'
                        : 'success',
                }}
              />
            </View>
            <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
              {ct.testsSummary}
            </Text>
            <View style={styles.chipRow}>
              <Pressable
                accessibilityRole="button"
                disabled={readOnly}
                onPress={() =>
                  emit({ type: 'containerScanned', containerId: ct.id, barcode: ct.barcode })
                }
                style={(s: PressState) => [
                  styles.chip,
                  { borderColor: t.primary, backgroundColor: t.primarySoft },
                  focusRing(t, s.focused),
                ]}
              >
                <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
                  Scan Collect
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={readOnly}
                onPress={() =>
                  emit({
                    type: 'containerRejected',
                    containerId: ct.id,
                    reason: 'Hemolyzed / Clotted',
                  })
                }
                style={(s: PressState) => [
                  styles.chip,
                  { borderColor: t.danger, backgroundColor: t.dangerSoft },
                  focusRing(t, s.focused),
                ]}
              >
                <Text style={[font, bold, { color: t.danger, fontSize: t.textXs }]}>Reject</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ===========================================================================
// 5. EmrLabCumulativeGrid
// ===========================================================================

export interface EmrLabCumulativeGridProps {
  model: EmrLabCumulativeGridViewModel;
  headingId?: string;
  onIntent?: (intent: EmrLabCumulativeGridIntent) => void;
}

export function EmrLabCumulativeGrid({
  model,
  headingId = 'emr-lab-cumulative-grid-heading',
  onIntent,
}: EmrLabCumulativeGridProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;
  const critCount = countLabCriticalCells(model.rows);
  const visibleRows = filterLabCumulativeRows(model);

  const emit = (intent: EmrLabCumulativeGridIntent) => {
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
          <Text
            style={[
              styles.tag,
              { backgroundColor: t.primarySoft, color: t.primary, fontFamily: t.fontMono },
            ]}
          >
            LONGITUDINAL LABORATORY FLOWSHEET
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? model.panelName}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{model.subtitle}</Text>
          ) : null}
        </View>
        <View style={styles.chipRow}>
          <EmrBadgeView
            badge={{
              label: `Critical Values: ${critCount}`,
              tone: critCount > 0 ? 'danger' : 'success',
            }}
          />
          <Pressable
            accessibilityRole="button"
            disabled={readOnly}
            onPress={() =>
              emit({ type: 'abnormalFilterToggled', showAbnormalOnly: !model.showAbnormalOnly })
            }
            style={(s: PressState) => [
              styles.chip,
              {
                borderColor: model.showAbnormalOnly ? t.primary : t.border,
                backgroundColor: model.showAbnormalOnly ? t.primarySoft : t.surface,
              },
              focusRing(t, s.focused),
            ]}
          >
            <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
              {model.showAbnormalOnly ? 'Showing Abnormal Only' : 'Show Abnormal Only'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View role="list" style={styles.listStack}>
        {visibleRows.map((row) => (
          <View
            key={row.id}
            role="listitem"
            style={[styles.panel, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
          >
            <View style={styles.rowBetween}>
              <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                {row.analyteName} ({row.unit})
              </Text>
              <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
                Ref: {row.referenceRange}
              </Text>
            </View>
            <View style={styles.chipRow}>
              {model.columns.map((col) => {
                const cell = row.values[col.id];
                if (!cell) return null;
                const isCrit = cell.flag === 'critical-low' || cell.flag === 'critical-high';
                return (
                  <View key={col.id} style={styles.chipRow}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={readOnly}
                      onPress={() =>
                        emit({ type: 'cellSelected', analyteId: row.id, columnId: col.id })
                      }
                      style={(s: PressState) => [
                        styles.chip,
                        {
                          borderColor: isCrit ? t.danger : t.border,
                          backgroundColor: isCrit ? t.dangerSoft : t.surface,
                        },
                        focusRing(t, s.focused),
                      ]}
                    >
                      <Text
                        style={[
                          font,
                          bold,
                          { color: isCrit ? t.danger : t.text, fontSize: t.textXs },
                        ]}
                      >
                        {col.dateLabel}: {cell.value} ({cell.flag})
                      </Text>
                    </Pressable>
                    {isCrit ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={readOnly}
                        onPress={() =>
                          emit({
                            type: 'criticalAcknowledgeRequested',
                            analyteId: row.id,
                            columnId: col.id,
                          })
                        }
                        style={(s: PressState) => [
                          styles.chip,
                          { borderColor: t.danger, backgroundColor: t.surface },
                          focusRing(t, s.focused),
                        ]}
                      >
                        <Text style={[font, bold, { color: t.danger, fontSize: t.textXs }]}>
                          Ack Critical
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ===========================================================================
// 6. EmrMicrobiologyAntibiogram
// ===========================================================================

export interface EmrMicrobiologyAntibiogramProps {
  model: EmrMicrobiologyAntibiogramViewModel;
  headingId?: string;
  onIntent?: (intent: EmrMicrobiologyAntibiogramIntent) => void;
}

export function EmrMicrobiologyAntibiogram({
  model,
  headingId = 'emr-microbiology-antibiogram-heading',
  onIntent,
}: EmrMicrobiologyAntibiogramProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;

  const emit = (intent: EmrMicrobiologyAntibiogramIntent) => {
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
          <Text
            style={[
              styles.tag,
              { backgroundColor: t.primarySoft, color: t.primary, fontFamily: t.fontMono },
            ]}
          >
            CULTURE & SENSITIVITY ANTIBIOGRAM
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'Microbiology Susceptibility Matrix'}
          </Text>
          <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>
            {model.specimenSource} · {model.collectionDate}
            {model.gramStainSummary ? ` · ${model.gramStainSummary}` : ''}
          </Text>
        </View>
        <View style={styles.chipRow}>
          {model.isolates.map((iso) => (
            <EmrBadgeView
              key={iso.id}
              badge={{
                label: `${iso.organismName}${iso.resistanceMechanism ? ` (${iso.resistanceMechanism})` : ''}`,
                tone: iso.resistanceMechanism ? 'danger' : 'info',
              }}
            />
          ))}
        </View>
      </View>

      <View role="list" style={styles.listStack}>
        {model.rows.map((row) => {
          const selected = model.selectedAntibioticId === row.antibioticId;
          return (
            <View
              key={row.antibioticId}
              role="listitem"
              style={[
                styles.panel,
                {
                  borderColor: selected ? t.primary : t.border,
                  backgroundColor: selected ? t.primarySoft : t.surfaceRaised,
                },
              ]}
            >
              <View style={styles.rowBetween}>
                <Pressable
                  accessibilityRole="button"
                  disabled={readOnly}
                  onPress={() =>
                    emit({ type: 'antibioticSelected', antibioticId: row.antibioticId })
                  }
                  style={(s: PressState) => [styles.chipRow, focusRing(t, s.focused)]}
                >
                  <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                    {row.antibioticName} {row.classLabel ? `(${row.classLabel})` : ''}
                  </Text>
                  {row.stewardshipPreferred ? (
                    <EmrBadgeView badge={{ label: 'Stewardship Preferred', tone: 'success' }} />
                  ) : null}
                </Pressable>
              </View>
              <View style={styles.chipRow}>
                {model.isolates.map((iso) => {
                  const res = row.resultsByIsolate[iso.id];
                  if (!res) return null;
                  return (
                    <View key={iso.id} style={styles.chipRow}>
                      <EmrBadgeView
                        badge={{
                          label: `${iso.organismName}: ${res.interpretation}${res.micLabel ? ` (${res.micLabel})` : ''}`,
                          tone:
                            res.interpretation === 'S'
                              ? 'success'
                              : res.interpretation === 'I'
                                ? 'warning'
                                : 'danger',
                        }}
                      />
                      {res.interpretation === 'S' ? (
                        <Pressable
                          accessibilityRole="button"
                          disabled={readOnly}
                          onPress={() =>
                            emit({
                              type: 'stewardshipOrderRequested',
                              antibioticId: row.antibioticId,
                              isolateId: iso.id,
                            })
                          }
                          style={(s: PressState) => [
                            styles.chip,
                            { borderColor: t.primary, backgroundColor: t.surface },
                            focusRing(t, s.focused),
                          ]}
                        >
                          <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
                            Order Targeted Rx
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
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
// 7. EmrAnaesthesiaRecord
// ===========================================================================

export interface EmrAnaesthesiaRecordProps {
  model: EmrAnaesthesiaRecordViewModel;
  headingId?: string;
  onIntent?: (intent: EmrAnaesthesiaRecordIntent) => void;
}

export function EmrAnaesthesiaRecord({
  model,
  headingId = 'emr-anaesthesia-record-heading',
  onIntent,
}: EmrAnaesthesiaRecordProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;

  const emit = (intent: EmrAnaesthesiaRecordIntent) => {
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
          <Text
            style={[
              styles.tag,
              { backgroundColor: t.primarySoft, color: t.primary, fontFamily: t.fontMono },
            ]}
          >
            INTRA-OPERATIVE ANAESTHESIA RECORD
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'Perioperative Anaesthesia & Physiological Record'}
          </Text>
          <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>
            {model.technique} · {model.airwayDevice}
          </Text>
        </View>
        <View style={styles.chipRow}>
          <EmrBadgeView badge={{ label: `ASA ${model.asaClass}`, tone: 'info' }} />
          <EmrBadgeView badge={{ label: `Mallampati ${model.mallampatiClass}`, tone: 'info' }} />
        </View>
      </View>

      <View style={styles.rowBetween}>
        <View role="group" aria-label="Anaesthesia Phase" style={styles.chipRow}>
          {ANAESTHESIA_PHASES.map((ph) => {
            const active = model.activePhase === ph;
            return (
              <Pressable
                key={ph}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: readOnly }}
                disabled={readOnly}
                onPress={() => emit({ type: 'phaseChanged', phase: ph })}
                style={(s: PressState) => [
                  styles.chip,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                  focusRing(t, s.focused),
                ]}
              >
                <Text
                  style={[font, bold, { color: active ? t.primary : t.text, fontSize: t.textXs }]}
                >
                  {ph}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.chipRow}>
          <Pressable
            accessibilityRole="button"
            disabled={readOnly}
            onPress={() => emit({ type: 'checkpointAdded', timeLabel: 'Now' })}
            style={(s: PressState) => [
              styles.chip,
              { borderColor: t.border, backgroundColor: t.surfaceRaised },
              focusRing(t, s.focused),
            ]}
          >
            <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
              + Vitals Checkpoint
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={readOnly}
            onPress={() =>
              emit({ type: 'medicationLogged', drugName: 'Fentanyl', doseLabel: '50 mcg IV' })
            }
            style={(s: PressState) => [
              styles.chip,
              { borderColor: t.border, backgroundColor: t.surfaceRaised },
              focusRing(t, s.focused),
            ]}
          >
            <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>+ Log Bolus</Text>
          </Pressable>
        </View>
      </View>

      <View role="list" style={styles.listStack}>
        {model.checkpoints.map((cp) => (
          <View
            key={cp.id}
            role="listitem"
            style={[styles.panel, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
          >
            <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
              [{cp.timeLabel}] HR {cp.hrBpm} bpm · BP {cp.bpLabel} mmHg · SpO2 {cp.spo2Pct}% · EtCO2{' '}
              {cp.etco2MmHg} mmHg{cp.macPct !== undefined ? ` · MAC ${cp.macPct}%` : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ===========================================================================
// 8. EmrFluidBalanceChart
// ===========================================================================

export interface EmrFluidBalanceChartProps {
  model: EmrFluidBalanceChartViewModel;
  headingId?: string;
  onIntent?: (intent: EmrFluidBalanceChartIntent) => void;
}

export function EmrFluidBalanceChart({
  model,
  headingId = 'emr-fluid-balance-chart-heading',
  onIntent,
}: EmrFluidBalanceChartProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;
  const summary = computeFluidBalanceSummary(model.intakes, model.outputs);

  const emit = (intent: EmrFluidBalanceChartIntent) => {
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
          <Text
            style={[
              styles.tag,
              { backgroundColor: t.primarySoft, color: t.primary, fontFamily: t.fontMono },
            ]}
          >
            24-HOUR FLUID INTAKE & OUTPUT CHART
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'Fluid Balance & Urine Output Flowsheet'}
          </Text>
          <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{model.periodLabel}</Text>
        </View>
        <View style={styles.chipRow}>
          <EmrBadgeView badge={{ label: `Intake: ${summary.totalIntakeMl} mL`, tone: 'info' }} />
          <EmrBadgeView
            badge={{ label: `Output: ${summary.totalOutputMl} mL`, tone: 'warning' }}
          />
          <EmrBadgeView
            badge={{
              label: `Net: ${summary.netBalanceMl >= 0 ? '+' : ''}${summary.netBalanceMl} mL`,
              tone: summary.netBalanceMl >= 0 ? 'info' : 'success',
            }}
          />
        </View>
      </View>

      <View style={styles.listStack}>
        <View style={[styles.panel, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <View style={styles.rowBetween}>
            <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
              Intake Streams ({summary.totalIntakeMl} mL)
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={readOnly}
              onPress={() =>
                emit({
                  type: 'entryAdded',
                  direction: 'intake',
                  category: 'IV Crystalloid',
                  volumeMl: 250,
                })
              }
              style={(s: PressState) => [
                styles.chip,
                { borderColor: t.primary, backgroundColor: t.primarySoft },
                focusRing(t, s.focused),
              ]}
            >
              <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
                + 250 mL IV
              </Text>
            </Pressable>
          </View>
          {model.intakes.map((item) => (
            <View key={item.id} style={styles.rowBetween}>
              <Text style={[font, { color: t.text, fontSize: t.textXs }]}>
                {item.category} ({item.routeOrSite}): {item.volumeMl} mL
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={readOnly}
                onPress={() => emit({ type: 'entryRemoved', entryId: item.id })}
                style={(s: PressState) => [
                  styles.chip,
                  { borderColor: t.border, backgroundColor: t.surface },
                  focusRing(t, s.focused),
                ]}
              >
                <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={[styles.panel, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <View style={styles.rowBetween}>
            <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
              Output Streams ({summary.totalOutputMl} mL)
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={readOnly}
              onPress={() =>
                emit({
                  type: 'entryAdded',
                  direction: 'output',
                  category: 'Urine Output',
                  volumeMl: 200,
                })
              }
              style={(s: PressState) => [
                styles.chip,
                { borderColor: t.primary, backgroundColor: t.primarySoft },
                focusRing(t, s.focused),
              ]}
            >
              <Text style={[font, bold, { color: t.primary, fontSize: t.textXs }]}>
                + 200 mL Urine
              </Text>
            </Pressable>
          </View>
          {model.outputs.map((item) => (
            <View key={item.id} style={styles.rowBetween}>
              <Text style={[font, { color: t.text, fontSize: t.textXs }]}>
                {item.category} ({item.routeOrSite}): {item.volumeMl} mL
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={readOnly}
                onPress={() => emit({ type: 'entryRemoved', entryId: item.id })}
                style={(s: PressState) => [
                  styles.chip,
                  { borderColor: t.border, backgroundColor: t.surface },
                  focusRing(t, s.focused),
                ]}
              >
                <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ===========================================================================
// 9. EmrSurgicalImplantLog
// ===========================================================================

export interface EmrSurgicalImplantLogProps {
  model: EmrSurgicalImplantLogViewModel;
  headingId?: string;
  onIntent?: (intent: EmrSurgicalImplantLogIntent) => void;
}

export function EmrSurgicalImplantLog({
  model,
  headingId = 'emr-surgical-implant-log-heading',
  onIntent,
}: EmrSurgicalImplantLogProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;

  const emit = (intent: EmrSurgicalImplantLogIntent) => {
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
          <Text
            style={[
              styles.tag,
              { backgroundColor: t.primarySoft, color: t.primary, fontFamily: t.fontMono },
            ]}
          >
            PERIOPERATIVE IMPLANT & UDI TRACEABILITY
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? model.procedureName}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{model.subtitle}</Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={readOnly}
          onPress={() =>
            emit({ type: 'countsReconciledToggled', countsReconciled: !model.countsReconciled })
          }
          style={(s: PressState) => [
            styles.chip,
            {
              borderColor: model.countsReconciled ? t.success : t.warning,
              backgroundColor: model.countsReconciled ? t.successSoft : t.warningSoft,
            },
            focusRing(t, s.focused),
          ]}
        >
          <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
            {model.countsReconciled
              ? '✓ Surgical Counts Reconciled'
              : '⚠ Reconcile Surgical Counts'}
          </Text>
        </Pressable>
      </View>

      <View role="list" style={styles.listStack}>
        {model.implants.map((imp) => {
          const selected = model.selectedImplantId === imp.id;
          return (
            <View
              key={imp.id}
              role="listitem"
              style={[
                styles.panel,
                {
                  borderColor: selected ? t.primary : t.border,
                  backgroundColor: selected ? t.primarySoft : t.surfaceRaised,
                },
              ]}
            >
              <View style={styles.rowBetween}>
                <Pressable
                  accessibilityRole="button"
                  disabled={readOnly}
                  onPress={() => emit({ type: 'implantSelected', implantId: imp.id })}
                  style={(s: PressState) => [styles.chipRow, focusRing(t, s.focused)]}
                >
                  <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
                    {imp.deviceName} · {imp.manufacturer}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={readOnly}
                  onPress={() =>
                    emit({
                      type: 'sterileVerifiedToggled',
                      implantId: imp.id,
                      sterileVerified: !imp.sterileVerified,
                    })
                  }
                  style={(s: PressState) => [
                    styles.chip,
                    {
                      borderColor: imp.sterileVerified ? t.success : t.warning,
                      backgroundColor: imp.sterileVerified ? t.successSoft : t.warningSoft,
                    },
                    focusRing(t, s.focused),
                  ]}
                >
                  <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
                    {imp.sterileVerified ? '✓ Sterile Verified' : 'Verify Sterility'}
                  </Text>
                </Pressable>
              </View>
              <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
                Site: {imp.anatomicalSite} · Lot {imp.lotNumber} · SN {imp.serialNumber} · UDI{' '}
                {imp.udiCode} · Exp {imp.expiryDate}
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
    borderBottomWidth: 1,
    paddingBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  titleBlock: {
    gap: 4,
    flexShrink: 1,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  listStack: {
    gap: 10,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  kvBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 96,
  },
  alert: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
