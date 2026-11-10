'use client';

import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  AttestationIntent, AttestationViewModel, CaptureStatusBarIntent, CaptureStatusBarViewModel,
  EmrTone, PatientAlert, PatientBannerIntent, PatientBannerViewModel, PatientVitalSparkline,
} from '@drguptavivek/emr-controller';
import { SvgIcon } from './icons';
import { EmrChip } from './l1-display';
import { EmrBadgeView, EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';

export * from './l4-shell-sheet';

type PressState = PressableStateCallbackType & { focused?: boolean };

/** English fallbacks for built-in strings. Every key is overridable via the component's `labels` prop. */
const BANNER_DEFAULTS = {
  currentPatient: 'Current patient',
  patientStatus: 'Patient status',
  safetyAlerts: 'Safety alerts',
  weight: 'Weight',
  showDetails: 'Show patient details',
  hideDetails: 'Hide patient details',
  currentEncounter: 'Current encounter',
  admitted: 'Admitted',
  admittingClinician: 'Admitting clinician',
  chronicDiseases: 'Chronic diseases',
  additionalAlerts: 'Additional alerts',
  alertsNotSupplied: 'Additional alert status not supplied.',
};

const STATUS_DEFAULTS = {
  recordStatus: 'Record status',
  saving: 'Saving…',
  failed: 'Not saved',
  conflict: 'Not saved: conflict',
  dirty: 'Unsaved changes',
  saved: 'Saved',
  clean: 'No changes',
  lastSaved: 'Last saved',
  timeNotSupplied: 'time not supplied',
  author: 'Author',
  notSupplied: 'Not supplied',
  recordedBy: 'Recorded by',
  amendedBy: 'Amended by',
  readOnly: 'Read-only',
  signature: 'Signature',
  signed: 'Signed',
  signatories: 'Signatories',
  sign: 'Sign',
  amend: 'Amend',
  discard: 'Discard changes',
  save: 'Save',
  retrySave: 'Retry save',
  saveFailed: 'Save failed.',
  conflictTitle: 'Someone else changed this record.',
  fieldsInConflict: 'Fields in conflict',
  keepMine: 'Keep my version',
  keepTheirs: 'Keep their version',
  merge: 'Merge',
  showDifferences: 'Show differences',
  lastSync: 'Last sync',
  /** Revision numbers are printed as supplied, never compared. */
  conflictSentence: (remoteRevision: number, localRevision: number, remoteAuthor?: string) =>
    `Their version is revision ${remoteRevision}${remoteAuthor ? ` by ${remoteAuthor}` : ''}; yours was based on revision ${localRevision}.`,
};

const ATTEST_DEFAULTS = { signatures: 'Signatures', signatories: 'Signatories', signed: 'Signed', notSupplied: 'Not supplied', sign: 'Sign', amend: 'Amend', notCompleted: 'Not completed.' };

/** Glyph paired with text so state is never colour alone. */
const GLYPH: Record<EmrTone, string> = { neutral: '', info: 'ℹ', success: '✓', warning: '⚠', danger: '✕' };

function useText() {
  const t = useEmrTheme();
  const base = { color: t.text, fontFamily: fontFamily(t) };
  return {
    t,
    body: { ...base, fontSize: t.textMd },
    muted: { ...base, fontSize: t.textMd, color: t.textMuted },
    bold: { ...base, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) },
    key: { ...base, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), color: t.textMuted, textTransform: 'uppercase' as const },
  };
}

function Alerts({ items }: { items: readonly PatientAlert[] }) {
  return <View style={styles.wrap}>{items.map((a) => <EmrChip key={a.id} tone={a.tone}>{a.label}</EmrChip>)}</View>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const x = useText();
  return <View style={styles.group}><Text style={x.key}>{title}</Text>{children}</View>;
}

function MiniSparkline({ points, color }: { points: readonly number[]; color: string }) {
  if (!points.length) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(1, max - min);
  return (
    <View aria-hidden style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 18 }}>
      {points.map((pt, idx) => {
        const h = Math.max(4, Math.round(((pt - min) / range) * 14) + 4);
        return (
          <View
            key={idx}
            style={{
              width: 3,
              height: h,
              borderRadius: 1.5,
              backgroundColor: color,
              opacity: idx === points.length - 1 ? 1 : 0.45 + (idx / points.length) * 0.4,
            }}
          />
        );
      })}
    </View>
  );
}

/**
 * L4. Patient banner & Epic Storyboard surface. All wording and tone come from the model (including
 * allergy prefix, overflow, inline vitals micro-sparklines, and provenance drilldown); nothing is derived.
 */
export function EmrPatientBanner({ model: m, compact, labels, onIntent }: {
  model: PatientBannerViewModel;
  compact?: boolean;
  labels?: Partial<typeof BANNER_DEFAULTS>;
  onIntent: (intent: PatientBannerIntent) => void;
}) {
  const x = useText();
  const { t } = x;
  const l = { ...BANNER_DEFAULTS, ...labels };
  const id = m.identifiers[0]?.value ?? m.patientId;
  const toggle = () => onIntent({ type: 'expandedChangeRequested', expanded: !m.expanded });
  const alerts = [...m.allergies, ...m.alerts];
  const critical = [m.criticality, m.vip, m.codeStatus, m.isolation, m.allergyStatus].filter((b): b is NonNullable<typeof b> => !!b);
  const isCompact = compact || m.layoutMode === 'compact';
  const isStoryboard = !compact && m.layoutMode === 'storyboard';

  const inspectedAlert: PatientAlert | undefined = m.activeInspectId
    ? [...m.allergies, ...m.alerts, ...m.chronicDiseases].find((a) => a.id === m.activeInspectId)
    : undefined;
  const inspectedVital: PatientVitalSparkline | undefined = m.activeInspectId
    ? m.vitals?.find((v) => v.id === m.activeInspectId)
    : undefined;

  const toggleButton = (
    <Pressable
      role="button"
      aria-expanded={m.expanded}
      aria-label={m.expanded ? l.hideDetails : l.showDetails}
      onPress={toggle}
      style={({ focused }: PressState) => [styles.toggle, focusRing(t, focused), { minWidth: t.controlHeight, minHeight: t.controlHeight }]}
    >
      <SvgIcon name={m.expanded ? 'chevron-up' : 'chevron-down'} size={16} color={t.text} />
    </Pressable>
  );

  const renderVitalsStrip = () => {
    if (!m.vitals?.length) return null;
    return (
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          paddingTop: 8,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: t.border,
        }}
      >
        {m.vitals.map((v) => {
          const tc = toneColors(t, v.tone ?? 'info');
          const active = m.activeInspectId === v.id;
          return (
            <Pressable
              key={v.id}
              role="button"
              aria-pressed={active}
              onPress={() => onIntent({ type: 'alertInspectRequested', alertId: active ? null : v.id })}
              style={({ focused }: PressState) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: active ? t.primary : t.border,
                  backgroundColor: active ? t.primarySoft : t.surfaceSoft,
                },
                focusRing(t, focused),
              ]}
            >
              <View style={{ gap: 1 }}>
                <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                  {v.label}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: t.fontMono }}>
                    {v.valueLabel}
                  </Text>
                  {v.unit ? <Text style={{ color: t.textMuted, fontSize: t.text2xs }}>{v.unit}</Text> : null}
                  {v.deltaLabel ? (
                    <Text style={{ color: tc.color, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold), fontFamily: t.fontMono }}>
                      {v.deltaLabel}
                    </Text>
                  ) : null}
                </View>
              </View>
              {v.trendPoints?.length ? <MiniSparkline points={v.trendPoints} color={tc.color} /> : null}
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderProvenanceInspector = () => {
    if (!inspectedAlert && !inspectedVital) return null;
    const title = inspectedAlert ? inspectedAlert.label : `${inspectedVital?.label}: ${inspectedVital?.valueLabel} ${inspectedVital?.unit ?? ''}`;
    const tone = inspectedAlert ? inspectedAlert.tone : inspectedVital?.tone ?? 'info';
    const tc = toneColors(t, tone);
    return (
      <View
        role="region"
        aria-label={`Clinical provenance for ${title}`}
        style={{
          marginTop: 4,
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: tc.color,
          backgroundColor: tc.backgroundColor,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <View style={{ gap: 4, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <EmrBadgeView badge={{ label: 'Clinical Provenance & Safety Record', tone }} />
            <Text style={[x.bold, { color: t.text }]}>{title}</Text>
          </View>
          {inspectedAlert?.reactionLabel ? (
            <Text style={x.body}>Reaction / Manifestation: <Text style={x.bold}>{inspectedAlert.reactionLabel}</Text></Text>
          ) : null}
          {inspectedAlert?.detail ? <Text style={x.body}>{inspectedAlert.detail}</Text> : null}
          <Text style={[x.muted, { fontSize: t.textXs }]}>
            {inspectedAlert?.provenanceLabel ?? inspectedVital?.provenanceLabel ?? 'Verified in hospital EHR'}
            {inspectedAlert?.recordedAtLabel ? ` · Recorded ${inspectedAlert.recordedAtLabel}` : ''}
          </Text>
        </View>
        <EmrButton
          small
          variant="ghost"
          label="Close"
          onPress={() => onIntent({ type: 'alertInspectRequested', alertId: null })}
        />
      </View>
    );
  };

  return (
    <View
      role="region"
      aria-label={`${l.currentPatient}: ${m.displayName}`}
      style={[
        styles.banner,
        {
          borderColor: t.border,
          backgroundColor: t.surface,
          maxWidth: isStoryboard ? 360 : undefined,
        },
      ]}
    >
      {isCompact ? (
        <View style={styles.compactRow}>
          {/* Content wraps on narrow phones; the expand button stays pinned at the end. */}
          <View style={[styles.wrap, styles.compactContent]}>
            <Text numberOfLines={1} role="heading" style={[x.bold, styles.shrink]}>{m.displayName}</Text>
            <Text numberOfLines={1} style={[x.muted, styles.shrink]}>{m.ageLabel} · {m.sexLabel} · {id}</Text>
            {critical.slice(0, 3).map((b) => <EmrBadgeView key={b.label} badge={b} />)}
          </View>
          {toggleButton}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <View style={[styles.primary, isStoryboard ? { flexDirection: 'column', alignItems: 'stretch' } : null]}>
            <View style={styles.identity}>
              <Text role="heading" style={[x.bold, { fontSize: t.textLg }]}>{m.displayName}</Text>
              <Text style={x.muted}>{id} · {m.ageLabel} · {m.sexLabel}{m.weightLabel ? ` · ${l.weight} ${m.weightLabel}` : ''}</Text>
              {m.bedLabel || m.wardLabel || m.lengthOfStayLabel ? (
                <View style={styles.wrap}>
                  {m.bedLabel ? <Text style={x.bold}>{m.bedLabel}</Text> : null}
                  {m.wardLabel ? <Text style={x.body}>{m.wardLabel}</Text> : null}
                  {m.lengthOfStayLabel ? <Text style={x.body}>{m.lengthOfStayLabel}</Text> : null}
                </View>
              ) : null}
            </View>
            <View aria-label={l.patientStatus} style={styles.wrap}>
              {m.criticality ? <EmrBadgeView badge={m.criticality} /> : null}
              {m.vip ? <EmrBadgeView badge={m.vip} /> : null}
              <EmrBadgeView badge={{ label: m.careSettingLabel, tone: 'info' }} />
            </View>
            <View aria-label={l.safetyAlerts} style={styles.wrap}>
              {m.codeStatus ? <EmrBadgeView badge={m.codeStatus} /> : null}
              {m.isolation ? <EmrBadgeView badge={m.isolation} /> : null}
              {m.allergyStatus ? <EmrBadgeView badge={m.allergyStatus} /> : null}
              {m.allergies.slice(0, 2).map((a) => (
                <Pressable
                  key={a.id}
                  role="button"
                  onPress={() => onIntent({ type: 'alertInspectRequested', alertId: m.activeInspectId === a.id ? null : a.id })}
                >
                  <EmrBadgeView badge={{ label: m.allergyChipPrefix ? `${m.allergyChipPrefix} ${a.label}` : a.label, tone: a.tone }} />
                </Pressable>
              ))}
              {m.allergies.length > 2 && m.allergyOverflow ? <EmrBadgeView badge={m.allergyOverflow} /> : null}
            </View>
            {toggleButton}
          </View>
          {renderVitalsStrip()}
          {renderProvenanceInspector()}
        </View>
      )}
      {m.expanded ? (
        <View style={[styles.secondary, { borderTopColor: t.border }]}>
          <Group title={l.currentEncounter}>
            <Text style={x.bold}>{m.careSettingLabel} · {m.locationLabel}</Text>
            {m.encounterLabel ? <Text style={x.body}>{m.encounterLabel}</Text> : null}
            {m.admittedOnLabel ? <Text style={x.muted}>{l.admitted}: {m.admittedOnLabel}</Text> : null}
            {m.admittingClinicianLabel ? <Text style={x.muted}>{l.admittingClinician}: {m.admittingClinicianLabel}</Text> : null}
            {m.identifiers.map((i) => <Text key={i.label} style={x.muted}>{i.label}: {i.value}</Text>)}
          </Group>
          <Group title={l.chronicDiseases}>
            <View style={styles.wrap}>
              {m.chronicDiseaseStatus ? <EmrBadgeView badge={m.chronicDiseaseStatus} /> : null}
              {m.chronicDiseases.map((a) => <EmrChip key={a.id} tone={a.tone}>{a.label}</EmrChip>)}
            </View>
          </Group>
          <Group title={l.additionalAlerts}>
            {alerts.length ? <Alerts items={alerts} /> : <Text style={x.muted}>{l.alertsNotSupplied}</Text>}
          </Group>
        </View>
      ) : null}
    </View>
  );
}

type StateKind = 'saving' | 'failed' | 'conflict' | 'dirty' | 'saved' | 'clean';
const STATE_TONE: Record<StateKind, EmrTone> = { saving: 'info', failed: 'danger', conflict: 'danger', dirty: 'warning', saved: 'success', clean: 'neutral' };

/** Precedence is display-only: what to say first, not a verdict about the record. */
function stateKind(s: CaptureStatusBarViewModel['session']): StateKind {
  if (s.saving) return 'saving';
  if (s.error) return 'failed';
  if (s.conflict) return 'conflict';
  if (s.dirty) return 'dirty';
  return s.savedAt ? 'saved' : 'clean';
}

/** L4. Record-lifecycle strip: save state, author, signature, conflict, plus optional offline-sync state. */
export function EmrCaptureStatusBar({ model: m, labels, onIntent }: {
  model: CaptureStatusBarViewModel;
  labels?: Partial<typeof STATUS_DEFAULTS>;
  onIntent: (intent: CaptureStatusBarIntent) => void;
}) {
  const x = useText();
  const { t } = x;
  const l = { ...STATUS_DEFAULTS, ...labels };
  const s = m.session;
  const kind = stateKind(s);
  const c = toneColors(t, STATE_TONE[kind]);
  const sig = m.signature;
  const canAct = !m.readOnly && !s.saving && !s.conflict && (s.dirty || !!s.error);
  const emit = (i: CaptureStatusBarIntent) => () => onIntent(i);
  const resolve = (resolution: 'keepLocal' | 'keepRemote' | 'merge') => emit({ type: 'conflictResolutionRequested', resolution });

  return (
    <View role="region" aria-label={l.recordStatus} style={[styles.banner, styles.bar, { borderColor: t.border, backgroundColor: t.surface }]}>
      <View style={styles.wrap}>
        <View role="status" aria-busy={s.saving} style={styles.inline}>
          <Text aria-hidden style={{ color: c.color, fontSize: t.textMd }}>{kind === 'saving' ? '…' : kind === 'saved' ? '✓' : kind === 'clean' ? '' : kind === 'dirty' ? '✎' : '⚠'}</Text>
          <Text style={{ ...x.bold, color: kind === 'clean' || kind === 'saving' ? t.text : c.color }}>{l[kind]}</Text>
          {s.savedAt ? <Text style={x.muted}>· {kind === 'saved' ? '' : `${l.lastSaved} `}{m.savedAtLabel || l.timeNotSupplied}</Text> : null}
        </View>
        {m.connection ? <EmrBadgeView badge={m.connection} /> : null}
        {m.outbox ? <EmrBadgeView badge={m.outbox} /> : null}
        {m.lastSync ? <Text style={x.muted}>{l.lastSync}: {m.lastSync}</Text> : null}
      </View>

      <Text style={x.body}>
        <Text style={x.key}>{l.author} </Text>
        {m.attributionLabel
          ? m.attributionLabel
          : m.attribution
            ? `${l.recordedBy} ${m.attribution.recordedBy}${m.attribution.role ? ` (${m.attribution.role})` : ''}${m.attribution.amendedBy ? ` · ${l.amendedBy} ${m.attribution.amendedBy}` : ''}`
            : l.notSupplied}
      </Text>

      {m.readOnly ? <EmrBadgeView badge={{ label: `[Locked] ${l.readOnly}`, tone: 'neutral' }} /> : null}

      {sig ? (
        <View style={styles.wrap}>
          <Text style={x.key}>{l.signature}</Text>
          <EmrBadgeView badge={sig.status} />
          {!m.readOnly && sig.canSign ? <EmrButton small variant="outline" label={l.sign} onPress={emit({ type: 'signRequested' })} /> : null}
          {!m.readOnly && sig.canAmend ? <EmrButton small variant="outline" label={l.amend} onPress={emit({ type: 'amendRequested' })} /> : null}
        </View>
      ) : null}

      {canAct ? (
        <View style={styles.wrap}>
          <EmrButton small variant="outline" label={l.discard} onPress={emit({ type: 'discardRequested' })} />
          <EmrButton small label={s.error ? l.retrySave : l.save} onPress={emit({ type: 'saveRequested' })} />
        </View>
      ) : null}

      {s.error ? (
        <View role="alert" style={[styles.alert, { borderColor: t.danger, backgroundColor: t.dangerSoft }]}>
          <Text style={x.body}><Text style={x.bold}>{GLYPH.danger} {l.saveFailed}</Text> {s.error}</Text>
        </View>
      ) : null}

      {s.conflict ? (
        <View role="alert" style={[styles.alert, { borderColor: t.warning, backgroundColor: t.warningSoft }]}>
          <Text style={x.body}><Text style={x.bold}>{GLYPH.warning} {l.conflictTitle}</Text> {l.conflictSentence(s.conflict.remoteRevision, s.conflict.localRevision, s.conflict.remoteAuthor)}</Text>
          {m.conflictLabels?.length ? (
            <View aria-label={l.fieldsInConflict}>{m.conflictLabels.map((label, i) => <Text key={i} style={x.body}>• {label}</Text>)}</View>
          ) : null}
          <View style={styles.wrap}>
            {!m.readOnly ? (
              <>
                <EmrButton small label={l.keepMine} onPress={resolve('keepLocal')} />
                <EmrButton small variant="outline" label={l.keepTheirs} onPress={resolve('keepRemote')} />
                <EmrButton small variant="outline" label={l.merge} onPress={resolve('merge')} />
              </>
            ) : null}
            <EmrButton small variant="ghost" label={l.showDifferences} onPress={emit({ type: 'conflictDetailRequested' })} />
          </View>
        </View>
      ) : null}

      {sig?.signatories.length ? (
        <View aria-label={l.signatories} style={[styles.signers, { borderTopColor: t.border }]}>
          {sig.signatories.map((p) => (
            <View key={p.id} style={styles.wrap}>
              <Text style={[x.bold, styles.shrink]}>{p.displayName}</Text>
              <Text style={x.muted}>{p.roleLabel}</Text>
              <EmrBadgeView badge={p.status} />
              <Text style={x.muted}>{l.signed}: {p.signedAtLabel || l.notSupplied}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** L2. Sign / witness / co-sign block. The controller decides who may sign; this renders and emits. */
export function EmrAttestation({ model: m, labels, onIntent }: {
  model: AttestationViewModel;
  labels?: Partial<typeof ATTEST_DEFAULTS>;
  onIntent: (intent: AttestationIntent) => void;
}) {
  const x = useText();
  const { t } = x;
  const l = { ...ATTEST_DEFAULTS, ...labels };
  return (
    <View role="region" aria-label={m.title || l.signatures} style={styles.group}>
      {m.title ? <Text role="heading" style={x.key}>{m.title}</Text> : null}
      {m.statement ? <Text style={x.body}>{m.statement}</Text> : null}
      {m.signatories.length ? (
        <View aria-label={l.signatories} style={styles.group}>
          {m.signatories.map((s) => (
            <View key={s.id} style={styles.wrap}>
              <Pressable
                role="button"
                onPress={() => onIntent({ type: 'signatorySelected', signatoryId: s.id })}
                style={({ focused }: PressState) => [focusRing(t, focused), { minHeight: t.controlHeight, justifyContent: 'center' }]}
              >
                <Text style={x.bold}>{s.displayName}</Text>
              </Pressable>
              <Text style={x.muted}>{s.roleLabel}</Text>
              <EmrBadgeView badge={s.status} />
              <Text style={x.muted}>{l.signed}: {s.signedAtLabel || l.notSupplied}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {m.error ? (
        <View role="alert" style={[styles.alert, { borderColor: t.danger, backgroundColor: t.dangerSoft }]}>
          <Text style={x.body}><Text style={x.bold}>{l.notCompleted}</Text> {m.error}</Text>
        </View>
      ) : null}
      {!m.readOnly && (m.canSign || m.canAmend) ? (
        <View style={styles.wrap}>
          {m.canSign ? <EmrButton small label={m.signLabel || l.sign} onPress={() => onIntent({ type: 'signRequested' })} /> : null}
          {m.canAmend ? <EmrButton small variant="outline" label={m.amendLabel || l.amend} onPress={() => onIntent({ type: 'amendRequested' })} /> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderWidth: 1, borderRadius: 8 },
  bar: { padding: 12, gap: 8 },
  primary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8, padding: 12 },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12 },
  identity: { flexGrow: 1, flexBasis: 200, minWidth: 0, gap: 2 },
  shrink: { flexShrink: 1, minWidth: 0 },
  // maxWidth: a wrapping row nested in another row must not grow past its container.
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, maxWidth: '100%' },
  compactContent: { flex: 1, minWidth: 0, paddingVertical: 8 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggle: { alignItems: 'center', justifyContent: 'center' },
  secondary: { borderTopWidth: 1, padding: 12, gap: 12 },
  group: { gap: 4 },
  alert: { borderWidth: 1, borderRadius: 8, padding: 8, gap: 8 },
  signers: { borderTopWidth: 1, paddingTop: 8, gap: 4 },
});
