'use client';

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  DoseForm,
  PrescribingFormularyItem,
  PrescribingRow,
  PrescribingTableIntent,
  PrescribingTableViewModel,
} from '@drguptavivek/emr-controller';
import { SvgIcon } from './icons';
import { ThemedInput } from './inputs-core';
import { EmrBadgeView, EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';

type PressState = PressableStateCallbackType & { focused?: boolean };

const DEFAULT_FORMS: readonly { value: DoseForm; label: string }[] = [
  { value: 'tablet', label: 'Tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'drop', label: 'Drops' },
  { value: 'liquid', label: 'Liquid / Syrup' },
  { value: 'ointment', label: 'Oint / Cream' },
  { value: 'inhaler', label: 'Inhaler / Spray' },
  { value: 'injection', label: 'Inj / Inf' },
];

interface FormClinicalProfile {
  readonly units: readonly string[];
  readonly step: number;
  readonly routes: readonly { value: string; label: string }[];
  readonly sitesByRoute: Readonly<Record<string, readonly { value: string; label: string }[]>>;
  readonly timingByRoute: Readonly<Record<string, readonly string[]>>;
  readonly defaultTiming: readonly string[];
}

const EYE_SITES = [
  { value: 'OU', label: 'OU (Both)' },
  { value: 'OD', label: 'OD (Right)' },
  { value: 'OS', label: 'OS (Left)' },
] as const;

const EAR_SITES = [
  { value: 'AU', label: 'AU (Both Ears)' },
  { value: 'AD', label: 'AD (Right Ear)' },
  { value: 'AS', label: 'AS (Left Ear)' },
] as const;

const NASAL_SITES = [
  { value: 'Both Nostrils', label: 'Both Nostrils' },
  { value: 'R Nostril', label: 'R Nostril' },
  { value: 'L Nostril', label: 'L Nostril' },
] as const;

const DERM_SITES = [
  { value: 'Lesions', label: 'Lesions' },
  { value: 'Face', label: 'Face' },
  { value: 'Scalp', label: 'Scalp' },
  { value: 'Trunk', label: 'Trunk' },
  { value: 'Limbs', label: 'Limbs' },
] as const;

const INJ_SITES = [
  { value: 'Abdomen', label: 'Abdomen' },
  { value: 'Thigh', label: 'Thigh' },
  { value: 'Deltoid', label: 'Deltoid' },
] as const;

function getFormClinicalProfile(form: DoseForm): FormClinicalProfile {
  switch (form) {
    case 'tablet':
      return {
        units: ['', 'tab', 'mg'],
        step: 0.5,
        routes: [
          { value: 'oral', label: 'Oral' },
          { value: 'sl', label: 'Sublingual (SL)' },
          { value: 'ng', label: 'NG / Ryle Tube' },
        ],
        sitesByRoute: {},
        timingByRoute: {},
        defaultTiming: ['After food', 'Before food', 'Empty stomach', 'At bedtime'],
      };
    case 'capsule':
      return {
        units: ['', 'cap', 'mg'],
        step: 1,
        routes: [
          { value: 'oral', label: 'Oral' },
          { value: 'ng', label: 'NG Tube' },
        ],
        sitesByRoute: {},
        timingByRoute: {},
        defaultTiming: ['After food', 'Before food', 'Empty stomach', 'At bedtime'],
      };
    case 'drop':
      return {
        units: ['drop', 'mL', ''],
        step: 1,
        routes: [
          { value: 'eye', label: 'Ophthalmic (Eye)' },
          { value: 'ear', label: 'Otic (Ear · ENT)' },
          { value: 'nasal', label: 'Nasal (ENT)' },
          { value: 'oral', label: 'Oral Drops (Peds)' },
        ],
        sitesByRoute: {
          eye: EYE_SITES,
          ear: EAR_SITES,
          nasal: NASAL_SITES,
        },
        timingByRoute: {
          eye: ['5 min gap', 'Shake well', 'Punctal occlusion', 'At bedtime'],
          ear: ['Tilt head 2 min', 'Keep ear dry', 'Warm bottle'],
          nasal: ['Clear nose first', 'After steam', 'Head tilted back'],
          oral: ['Use dropper', 'With milk/feed', 'After feed'],
        },
        defaultTiming: ['5 min gap', 'Shake well', 'At bedtime'],
      };
    case 'liquid':
      return {
        units: ['mL', 'tsp', 'mg/kg', 'mg', ''],
        step: 2.5,
        routes: [
          { value: 'oral', label: 'Oral (Peds/Med)' },
          { value: 'gargle', label: 'Gargle (ENT)' },
          { value: 'ng', label: 'NG / PEG Tube' },
        ],
        sitesByRoute: {},
        timingByRoute: {
          gargle: ['Dilute 1:1 warm water', 'Swish 30s — do not swallow', 'After meals'],
        },
        defaultTiming: ['Use oral syringe', 'Shake well', 'After food', 'At bedtime'],
      };
    case 'ointment':
    case 'cream':
    case 'gel':
      return {
        units: ['FTU', 'app', 'ribbon', 'g', ''],
        step: 0.5,
        routes: [
          { value: 'topical', label: 'Topical (Derm)' },
          { value: 'eye', label: 'Ophthalmic (Eye)' },
          { value: 'nasal', label: 'Anterior Nares' },
        ],
        sitesByRoute: {
          topical: DERM_SITES,
          eye: EYE_SITES,
          nasal: NASAL_SITES,
        },
        timingByRoute: {
          eye: ['Instil ointment last', 'At bedtime', '5 min gap'],
          topical: ['Thin layer only', 'On damp skin', 'Sunscreen AM', 'Wash off 5m'],
        },
        defaultTiming: ['Thin layer only', 'On damp skin', 'At bedtime'],
      };
    case 'spray':
    case 'inhaler':
      return {
        units: ['puff', 'spray', 'respule', 'mL', ''],
        step: 1,
        routes: [
          { value: 'inhalation', label: 'Inhalation' },
          { value: 'neb', label: 'Nebuliser' },
          { value: 'nasal', label: 'Intranasal (ENT)' },
        ],
        sitesByRoute: {
          nasal: NASAL_SITES,
        },
        timingByRoute: {
          inhalation: ['Rinse mouth after', 'Use spacer', 'Before exercise'],
          neb: ['Dilute in 3 mL NS', 'Via mask/mouthpiece'],
          nasal: ['Prime spray', 'Aim away from septum'],
        },
        defaultTiming: ['Rinse mouth after', 'Use spacer', 'Anytime'],
      };
    case 'injection':
      return {
        units: ['mg', 'mL', 'IU', 'mg/m²', 'mg/kg', 'g'],
        step: 1,
        routes: [
          { value: 'iv-inf', label: 'IV Infusion' },
          { value: 'iv-bolus', label: 'IV Bolus' },
          { value: 'sc', label: 'Subcut (SC)' },
          { value: 'im', label: 'IM' },
          { value: 'ivt', label: 'Intravitreal' },
          { value: 'it', label: 'Intrathecal' },
        ],
        sitesByRoute: {
          sc: INJ_SITES,
          im: INJ_SITES,
          ivt: EYE_SITES,
        },
        timingByRoute: {
          'iv-inf': ['Infuse over 30m', 'Infuse over 20m (Mannitol)', 'Pre-medicate 30m prior', 'Monitor vitals'],
          sc: ['Rotate site', 'Before meal (Insulin)', 'At bedtime'],
          ivt: ['Sterile prep + Povidone', 'Check IOP post-inj'],
        },
        defaultTiming: ['Infuse over 30m', 'Monitor vitals', 'Rotate site'],
      };
    default:
      return {
        units: ['', 'sachet', 'supp', 'patch', 'mg', 'mL'],
        step: 1,
        routes: [
          { value: 'oral', label: 'Oral' },
          { value: 'pr', label: 'Per Rectum (PR)' },
          { value: 'transdermal', label: 'Transdermal' },
        ],
        sitesByRoute: {},
        timingByRoute: {},
        defaultTiming: ['After food', 'Dissolve in water', 'Rotate patch site'],
      };
  }
}

const DEFAULT_ROUTES: readonly { value: string; label: string }[] = [
  { value: 'oral', label: 'Oral' },
  { value: 'eye', label: 'Ophthalmic (Eye)' },
  { value: 'topical', label: 'Topical' },
  { value: 'iv', label: 'IV / IM' },
  { value: 'nasal', label: 'Nasal' },
];

const DEFAULT_SITES: readonly { value: string; label: string }[] = [
  { value: 'OU', label: 'OU (Both)' },
  { value: 'OD', label: 'OD (Right)' },
  { value: 'OS', label: 'OS (Left)' },
];

const DEFAULT_DURATION_UNITS = ['days', 'weeks', 'months'] as const;

const DEFAULT_DOSE_UNITS = ['', 'drop', 'tab', 'mL', 'puff', 'cap', 'app', 'mg'] as const;

const DEFAULT_FOOD = [
  'After food',
  'Before food',
  'With food',
  'At bedtime',
  '5 min gap',
  'Anytime',
] as const;

function formatDoseAmount(n: number | null | undefined): string {
  if (n === null || n === undefined || n <= 0) return '0';
  if (n === 0.25) return '¼';
  if (n === 0.5) return '½';
  if (n === 0.75) return '¾';
  return String(n);
}

/**
 * L4. High-speed multi-row Clinical Prescribing Table (`EmrPrescribingTable`).
 * Supports per-row `+` (insert/duplicate below), `−` (remove), `↑` (move up), `↓` (move down),
 * inline Morning/Afternoon/Evening/Night dose steppers (`−` / `+`), quick frequency presets (`OD`/`BD`/`TDS`/`QID`),
 * duration stepper (`−` / `+`), eye site pills (`OD`/`OS`/`OU`), and an expandable multi-step taper schedule
 * with its own `+` / `−` / `↑` / `↓` controls.
 */
export function EmrPrescribingTable({
  model: m,
  onIntent,
}: {
  model: PrescribingTableViewModel;
  onIntent: (intent: PrescribingTableIntent) => void;
}) {
  const t = useEmrTheme();
  const ff = fontFamily(t);
  const locked = !!(m.readOnly || (m.status?.tone === 'success' && !m.canSign));
  const [activeDrugRowId, setActiveDrugRowId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'sig' | 'patient'>('grid');
  const [quickSigText, setQuickSigText] = useState('');
  const [splitExpandedRows, setSplitExpandedRows] = useState<Record<string, boolean>>({});
  const [customFormOpenRows, setCustomFormOpenRows] = useState<Record<string, boolean>>({});

  const forms = m.formOptions ?? DEFAULT_FORMS;
  const doseUnits = m.doseUnits ?? DEFAULT_DOSE_UNITS;
  const routes = m.routeOptions ?? DEFAULT_ROUTES;
  const sites = m.siteOptions ?? DEFAULT_SITES;
  const durationUnits = m.durationUnits ?? DEFAULT_DURATION_UNITS;
  const foodOptions = m.foodOptions ?? DEFAULT_FOOD;

  const iconBtn = (
    key: string,
    icon: Parameters<typeof SvgIcon>[0]['name'],
    label: string,
    onPress: () => void,
    disabled = false,
    danger = false,
  ) => (
    <Pressable
      key={key}
      role="button"
      aria-label={label}
      disabled={disabled}
      onPress={onPress}
      style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
        styles.iconBtn,
        {
          borderColor: danger ? t.danger : t.border,
          backgroundColor: hovered && !disabled ? (danger ? t.dangerSoft : t.primaryHover) : t.surface,
          opacity: disabled ? 0.38 : 1,
        },
        focusRing(t, focused),
      ]}
    >
      <SvgIcon name={icon} size={14} color={danger ? t.danger : t.text} />
    </Pressable>
  );

  const renderSlotStepper = (row: PrescribingRow, def: { id: string; label: string; shortLabel?: string; timeHint?: string }) => {
    const slot = row.slots.find((s) => s.id === def.id);
    const amount = slot?.amount ?? 0;
    const active = amount > 0;
    const stepDelta = row.form === 'tablet' ? 0.5 : 1;

    return (
      <View
        key={def.id}
        style={[
          styles.slotBox,
          {
            borderColor: active ? t.primary : t.border,
            backgroundColor: active ? t.primarySoft : t.surfaceSoft,
          },
        ]}
      >
        <View style={styles.slotHeader}>
          <Text
            numberOfLines={1}
            style={{
              color: active ? t.primaryContrast : t.textMuted,
              fontFamily: ff,
              fontSize: t.text2xs,
              fontWeight: fontWeight(t.weightMedium),
            }}
          >
            {def.shortLabel ?? def.label}
          </Text>
          {def.timeHint ? (
            <Text numberOfLines={1} style={{ color: t.textMuted, fontFamily: ff, fontSize: 10 }}>
              {def.timeHint}
            </Text>
          ) : null}
        </View>

        <View style={[styles.miniStepper, { borderColor: active ? t.primaryBorder : t.border, backgroundColor: t.surface }]}>
          {!locked ? (
            <Pressable
              role="button"
              aria-label={`Decrease ${def.label} dose for ${row.drugName || 'medicine'}`}
              disabled={amount <= 0}
              onPress={() => onIntent({ type: 'slotStepped', rowId: row.id, slotId: def.id, delta: -stepDelta })}
              style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
                styles.miniStepBtn,
                {
                  borderRightWidth: 1,
                  borderColor: t.border,
                  backgroundColor: hovered && amount > 0 ? t.primaryHover : t.surfaceSoft,
                  opacity: amount <= 0 ? 0.35 : 1,
                },
                focusRing(t, focused),
              ]}
            >
              <SvgIcon name="minus" size={12} color={t.text} />
            </Pressable>
          ) : null}

          <Pressable
            role="button"
            disabled={locked}
            aria-label={`${def.label} amount ${formatDoseAmount(amount)} ${row.unitLabel}`}
            onPress={() =>
              onIntent({
                type: 'slotAmountChanged',
                rowId: row.id,
                slotId: def.id,
                amount: amount > 0 ? 0 : 1,
              })
            }
            style={styles.miniStepValue}
          >
            <Text
              style={{
                color: active ? t.text : t.textMuted,
                fontFamily: t.fontMono,
                fontSize: t.textSm,
                fontWeight: fontWeight(t.weightBold),
              }}
            >
              {formatDoseAmount(amount)}
            </Text>
          </Pressable>

          {!locked ? (
            <Pressable
              role="button"
              aria-label={`Increase ${def.label} dose for ${row.drugName || 'medicine'}`}
              onPress={() => onIntent({ type: 'slotStepped', rowId: row.id, slotId: def.id, delta: amount === 0 ? 1 : stepDelta })}
              style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
                styles.miniStepBtn,
                {
                  borderLeftWidth: 1,
                  borderColor: t.border,
                  backgroundColor: hovered ? t.primaryHover : t.surfaceSoft,
                },
                focusRing(t, focused),
              ]}
            >
              <SvgIcon name="plus" size={12} color={t.text} />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
      {/* Top Prescription Header + Quick Favourites */}
      <View style={[styles.topBar, { borderBottomColor: t.border, backgroundColor: t.surfaceSoft }]}>
        <View style={styles.titleRow}>
          <View style={[styles.rxBadge, { backgroundColor: t.primary, borderColor: t.primaryBorder }]}>
            <Text style={{ color: '#ffffff', fontFamily: t.fontMono, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
              Rx
            </Text>
          </View>
          <View style={{ gap: 2 }}>
            <Text role="heading" aria-level={3} style={{ color: t.text, fontFamily: ff, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold) }}>
              {m.title ?? 'Medication Prescribing Table'}
            </Text>
            <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>
              Use − / + to step doses & duration, and ↑ / ↓ / + / − to reorder, duplicate, or remove rows.
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {m.favourites?.length && !locked ? (
            <View style={styles.favRow}>
              <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium) }}>
                Quick sets:
              </Text>
              {m.favourites.map((fav) => (
                <Pressable
                  key={fav.id}
                  role="button"
                  onPress={() => onIntent({ type: 'favouriteApplied', favouriteId: fav.id })}
                  style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
                    styles.favPill,
                    {
                      borderColor: t.primaryBorder,
                      backgroundColor: hovered ? t.primaryHover : t.surface,
                    },
                    focusRing(t, focused),
                  ]}
                >
                  <SvgIcon name="plus" size={12} color={t.primary} />
                  <Text style={{ color: t.primaryContrast, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium) }}>
                    {fav.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {m.status ? <EmrBadgeView badge={m.status} /> : null}
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {(
              [
                { id: 'grid', label: 'Dense Grid (Cerner)' },
                { id: 'sig', label: 'Sig Summary (Epic)' },
                { id: 'patient', label: 'Patient Matrix' },
              ] as const
            ).map((vm) => {
              const active = viewMode === vm.id;
              return (
                <Pressable
                  key={vm.id}
                  role="button"
                  aria-pressed={active}
                  onPress={() => setViewMode(vm.id)}
                  style={({ focused }: PressState) => [
                    styles.favPill,
                    {
                      borderColor: active ? t.primary : t.border,
                      backgroundColor: active ? t.primarySoft : t.surface,
                    },
                    focusRing(t, focused),
                  ]}
                >
                  <Text
                    style={{
                      color: active ? t.primaryContrast : t.text,
                      fontFamily: ff,
                      fontSize: t.textXs,
                      fontWeight: fontWeight(active ? t.weightBold : t.weightMedium),
                    }}
                  >
                    {vm.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Epic-style Quick-Sig / SmartSig Command Bar */}
      {!locked ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderColor: t.border,
            backgroundColor: t.surface,
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <SvgIcon name="pen" size={14} color={t.primary} />
            <Text style={{ color: t.primaryContrast, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
              SmartSig Quick-Order:
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 240, maxWidth: 420 }}>
            <ThemedInput
              value={quickSigText}
              onChangeText={(txt: string) => setQuickSigText(txt)}
              placeholder='Type shorthand e.g. "moxi 1qid ou 7d" or "pred 1qid ou taper"...'
              aria-label="SmartSig shorthand command"
              onSubmitEditing={() => {
                if (!quickSigText.trim()) return;
                onIntent({ type: 'quickSigSubmitted', command: quickSigText.trim() });
                setQuickSigText('');
              }}
              style={{ minHeight: 34, height: 34, paddingVertical: 4, fontSize: t.textXs, fontFamily: t.fontMono }}
            />
          </View>
          <EmrButton
            small
            variant="ghost"
            label="+ Parse & Add Row"
            disabled={!quickSigText.trim()}
            onPress={() => {
              if (!quickSigText.trim()) return;
              onIntent({ type: 'quickSigSubmitted', command: quickSigText.trim() });
              setQuickSigText('');
            }}
          />
          {m.quickSigExamples?.length ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.text2xs }}>1-click:</Text>
              {m.quickSigExamples.map((ex) => (
                <Pressable
                  key={ex.command}
                  role="button"
                  onPress={() => onIntent({ type: 'quickSigSubmitted', command: ex.command })}
                  style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
                    styles.favPill,
                    {
                      borderColor: t.primaryBorder,
                      backgroundColor: hovered ? t.primaryHover : t.surfaceSoft,
                    },
                    focusRing(t, focused),
                  ]}
                >
                  <Text style={{ color: t.primaryContrast, fontFamily: t.fontMono, fontSize: t.text2xs, fontWeight: fontWeight(t.weightMedium) }}>
                    {ex.command}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Clinical Safety & Allergy Reconciliation Strip */}
      {m.safetyAlerts?.length ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderColor: t.border,
            backgroundColor: t.surfaceSoft,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
          }}
        >
          {m.safetyAlerts.map((alert) => {
            const tc = toneColors(t, alert.tone);
            const iconName = alert.tone === 'danger' ? 'danger' : alert.tone === 'warning' ? 'warning' : alert.tone === 'success' ? 'check' : 'info';
            return (
              <View
                key={alert.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: tc.color,
                  backgroundColor: tc.backgroundColor,
                }}
              >
                <SvgIcon name={iconName} size={13} color={tc.color} />
                <Text style={{ color: tc.color, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                  {alert.badgeLabel}:
                </Text>
                <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs }}>
                  {alert.message}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {viewMode === 'sig' ? (
        <View style={{ padding: 16, gap: 10 }}>
          {m.rows.map((row, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === m.rows.length - 1;
            const pattern = row.slots.map((s) => formatDoseAmount(s.amount)).join(' – ');
            return (
              <View
                key={row.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: idx % 2 === 1 ? t.surfaceSoft : t.surface,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
                  <View style={[styles.rowNumBadge, { backgroundColor: t.primarySoft, borderColor: t.primaryBorder }]}>
                    <Text style={{ color: t.primaryContrast, fontFamily: t.fontMono, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
                      {idx + 1}
                    </Text>
                  </View>
                  <View style={{ gap: 2, flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
                        {row.drugName || 'Unnamed medication'} {row.strength}
                      </Text>
                      <EmrBadgeView badge={{ label: `${row.formLabel} · ${row.route.toUpperCase()}${row.site ? ` (${row.site})` : ''}`, tone: 'neutral' }} />
                      {row.frequencyCode ? <EmrBadgeView badge={{ label: row.frequencyCode, tone: 'info' }} /> : null}
                      <Text style={{ color: t.primaryContrast, fontFamily: t.fontMono, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
                        [{pattern}]
                      </Text>
                      <EmrBadgeView
                        badge={{
                          label:
                            row.durationUnit === 'cont' || row.durationUnit === 'stat'
                              ? row.durationUnit.toUpperCase()
                              : `${row.durationCount ?? 0} ${row.durationUnit}`,
                          tone: 'success',
                        }}
                      />
                    </View>
                    <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>
                      Sig: {row.unitLabel} ({pattern}) · {row.foodRelation}
                      {row.instructions ? ` · ${row.instructions}` : ''}
                      {row.taperSteps?.length
                        ? ` · Taper: ${row.taperSteps.map((st) => `${st.periodLabel}: ${st.frequencyLabel}`).join(' → ')}`
                        : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderBtnGroup}>
                  {!locked ? (
                    <>
                      {iconBtn(`${row.id}-sig-up`, 'chevron-up', `Move row ${idx + 1} up`, () => onIntent({ type: 'rowMoveRequested', rowId: row.id, direction: 'up' }), isFirst)}
                      {iconBtn(`${row.id}-sig-down`, 'chevron-down', `Move row ${idx + 1} down`, () => onIntent({ type: 'rowMoveRequested', rowId: row.id, direction: 'down' }), isLast)}
                      {iconBtn(`${row.id}-sig-add`, 'plus', `Insert below row ${idx + 1}`, () => onIntent({ type: 'rowAddRequested', afterRowId: row.id }))}
                      {iconBtn(`${row.id}-sig-del`, 'minus', `Remove row ${idx + 1}`, () => onIntent({ type: 'rowRemoveRequested', rowId: row.id }), m.rows.length <= 1, true)}
                    </>
                  ) : null}
                  <EmrButton small variant="ghost" label="Edit in Grid" onPress={() => setViewMode('grid')} />
                </View>
              </View>
            );
          })}
        </View>
      ) : viewMode === 'patient' ? (
        <View style={{ padding: 16, gap: 12 }}>
          <View
            style={{
              padding: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: t.primaryBorder,
              backgroundColor: t.primarySoft,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <SvgIcon name="info" size={15} color={t.primaryContrast} />
            <Text style={{ color: t.primaryContrast, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium) }}>
              Patient Daily Schedule Matrix · Leave at least 5 minutes between different eye drops. Instil eye ointments last.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {m.slotDefinitions.map((slotDef) => {
              const activeMeds = m.rows
                .map((r) => ({ row: r, slot: r.slots.find((s) => s.id === slotDef.id) }))
                .filter((x) => (x.slot?.amount ?? 0) > 0);
              return (
                <View
                  key={slotDef.id}
                  style={{
                    flex: 1,
                    minWidth: 210,
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: t.border,
                    backgroundColor: t.surfaceSoft,
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
                      {slotDef.label}
                    </Text>
                    <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: t.textXs }}>
                      {slotDef.timeHint ?? ''}
                    </Text>
                  </View>
                  {activeMeds.length === 0 ? (
                    <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>No doses scheduled</Text>
                  ) : (
                    activeMeds.map(({ row, slot }) => (
                      <View
                        key={row.id}
                        style={{
                          padding: 8,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: t.border,
                          backgroundColor: t.surface,
                          gap: 2,
                        }}
                      >
                        <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                          {row.drugName} {row.strength}
                        </Text>
                        <Text style={{ color: t.primaryContrast, fontFamily: t.fontMono, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                          {formatDoseAmount(slot?.amount ?? 0)} {row.unitLabel} {row.site ? `· ${row.site}` : ''} ({row.foodRelation})
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ) : (
      /* Scrollable Table Surface */
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: '100%' }}>
        <View style={{ flex: 1, minWidth: 1120 }}>
          {/* Column Headers: Drug Name & Strength | Dose (Qty & Unit) | Frequency (OD/BD/TDS/HS/SOS & M-A-E-N) | Route & Site | Duration | Spcl Instructions | Add / Remove / Up / Down */}
          <View style={[styles.tableHead, { borderBottomColor: t.border, backgroundColor: t.surfaceRaised }]}>
            <Text style={[styles.th, { flex: 1.3, minWidth: 215, color: t.textMuted, fontFamily: ff, fontSize: t.textXs }]}>
              DRUG NAME & STRENGTH
            </Text>
            <Text style={[styles.th, { width: 172, color: t.textMuted, fontFamily: ff, fontSize: t.textXs }]}>
              DOSE (QTY & UNIT)
            </Text>
            <Text style={[styles.th, { flex: 1.6, minWidth: 268, color: t.textMuted, fontFamily: ff, fontSize: t.textXs }]}>
              FREQUENCY (OD/BD/TDS/HS/SOS · M–A–E–N)
            </Text>
            <Text style={[styles.th, { width: 146, color: t.textMuted, fontFamily: ff, fontSize: t.textXs }]}>
              ROUTE & SITE
            </Text>
            <Text style={[styles.th, { width: 160, color: t.textMuted, fontFamily: ff, fontSize: t.textXs }]}>
              DURATION (− / +)
            </Text>
            <Text style={[styles.th, { flex: 1.2, minWidth: 192, color: t.textMuted, fontFamily: ff, fontSize: t.textXs }]}>
              SPCL INSTRUCTIONS
            </Text>
            <Text style={[styles.th, { width: 152, color: t.textMuted, fontFamily: ff, fontSize: t.textXs }]}>
              + / − / ↑ / ↓ · STEP
            </Text>
          </View>

          {/* Prescription Rows */}
          {m.rows.map((row, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === m.rows.length - 1;
            const profile = getFormClinicalProfile(row.form);
            const rowUnits = row.allowedUnits ?? m.doseUnits ?? profile.units;
            const rowRoutes = row.allowedRoutes ?? m.routeOptions ?? profile.routes;
            const rowSites = m.siteOptions ?? profile.sitesByRoute[row.route] ?? [];
            const rowTimings = m.foodOptions ?? profile.timingByRoute[row.route] ?? profile.defaultTiming;
            const activeSlotAmounts = row.slots.map((s) => s.amount ?? 0).filter((a) => a > 0);
            const hasAsymmetricSlots =
              activeSlotAmounts.length > 1 && new Set(activeSlotAmounts).size > 1;
            const isAsNeeded = row.frequencyCode?.toUpperCase() === 'SOS';
            const isSplitOpen = !isAsNeeded && (!!splitExpandedRows[row.id] || hasAsymmetricSlots);
            const isCustomFormOpen =
              !!customFormOpenRows[row.id] || (!row.formularyCode && row.drugName.trim() === '');
            const needle = row.drugName.trim().toLowerCase();
            const search = m.formularySearch?.rowId === row.id && m.formularySearch.query === row.drugName
              ? m.formularySearch
              : undefined;
            const matchingFormulary: readonly PrescribingFormularyItem[] =
              activeDrugRowId === row.id && m.formularySearch
                ? search && !search.loading && !search.error ? search.items : []
                : activeDrugRowId === row.id && m.formulary
                ? m.formulary.filter(
                    (f) =>
                      !needle ||
                      f.drugName.toLowerCase().includes(needle) ||
                      f.code.toLowerCase().includes(needle) ||
                      f.formLabel.toLowerCase().includes(needle) ||
                      (f.specialtyTag && f.specialtyTag.toLowerCase().includes(needle)),
                  )
                : [];

            return (
              <View
                key={row.id}
                style={[
                  styles.rowBlock,
                  {
                    borderBottomColor: t.border,
                    backgroundColor: row.stepPhase
                      ? t.surfaceRaised
                      : idx % 2 === 1
                        ? t.surfaceSoft
                        : t.surface,
                    borderLeftWidth: row.stepPhase ? 3 : 0,
                    borderLeftColor:
                      row.stepPhase === 'step-down'
                        ? t.warning
                        : row.stepPhase === 'step-up'
                          ? t.info
                          : 'transparent',
                  },
                ]}
              >
                <View style={styles.rowMain}>
                  {/* Column 1: Drug Name & Strength + Formulary Dose Form Metadata */}
                  <View style={[styles.cellDrug, { flex: 1.3, minWidth: 215 }]}>
                    {(row.stepPhase || row.specialtyTag) ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {row.stepPhase ? (
                          <View
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              borderWidth: 1,
                              borderColor: row.stepPhase === 'step-down' ? t.warning : t.info,
                              backgroundColor: row.stepPhase === 'step-down' ? t.warningSoft : t.infoSoft,
                            }}
                          >
                            <Text
                              style={{
                                color: row.stepPhase === 'step-down' ? t.warning : t.info,
                                fontFamily: t.fontMono,
                                fontSize: 10,
                                fontWeight: fontWeight(t.weightBold),
                              }}
                            >
                              {row.stepLabel ?? (row.stepPhase === 'step-down' ? '↘ STEP-DOWN PHASE' : '↗ STEP-UP PHASE')}
                            </Text>
                          </View>
                        ) : null}
                        {row.specialtyTag ? (
                          <View
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 1,
                              borderRadius: 4,
                              backgroundColor: t.primarySoft,
                            }}
                          >
                            <Text style={{ color: t.primaryContrast, fontFamily: ff, fontSize: 10, fontWeight: fontWeight(t.weightMedium) }}>
                              {row.specialtyTag}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                    <View style={styles.drugTopRow}>
                      <View style={[styles.rowNumBadge, { backgroundColor: t.primarySoft, borderColor: t.primaryBorder }]}>
                        <Text style={{ color: t.primaryContrast, fontFamily: t.fontMono, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
                          {idx + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 105 }}>
                        <ThemedInput
                          value={row.drugName}
                          editable={!locked}
                          placeholder="Search formulary…"
                          accessibilityLabel={`Row ${idx + 1} medicine name`}
                          onFocus={() => {
                            if (locked) return;
                            setActiveDrugRowId(row.id);
                            onIntent({ type: 'formularySearchRequested', rowId: row.id, query: row.drugName });
                          }}
                          onKeyPress={(event) => { if (event.nativeEvent.key === 'Escape') setActiveDrugRowId(null); }}
                          onChangeText={(text) => {
                            if (locked) return;
                            setActiveDrugRowId(row.id);
                            onIntent({ type: 'drugNameChanged', rowId: row.id, drugName: text });
                            onIntent({ type: 'formularySearchRequested', rowId: row.id, query: text });
                          }}
                          style={{ minHeight: 36, height: 36, paddingVertical: 4, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium) }}
                        />
                      </View>
                      <View style={{ width: 76 }}>
                        <ThemedInput
                          value={row.strength}
                          editable={!locked}
                          placeholder="Strength"
                          accessibilityLabel={`Row ${idx + 1} strength`}
                          onChangeText={(text) => onIntent({ type: 'strengthChanged', rowId: row.id, strength: text })}
                          style={{ minHeight: 36, height: 36, paddingVertical: 4, fontSize: t.textXs, fontFamily: t.fontMono }}
                        />
                      </View>
                    </View>

                    {/* Formulary suggestions from the supplied model */}
                    {activeDrugRowId === row.id && !locked && (matchingFormulary.length > 0 || search) ? (
                      <View style={[styles.formularyList, { borderColor: t.primaryBorder, backgroundColor: t.surface }]}>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderBottomWidth: 1, borderColor: t.border, backgroundColor: t.surfaceSoft }}>
                          <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
                            {m.formularyLabel ?? 'Formulary results'}
                          </Text>
                        </View>
                        {search?.loading || search?.error || (search && matchingFormulary.length === 0) ? (
                          <Text role={search.error ? 'alert' : 'status'} style={{ color: t.textMuted, fontFamily: ff, padding: 8 }}>
                            {search.loading ? 'Searching formulary…' : search.error ? 'Formulary search failed.' : 'No formulary results.'}
                          </Text>
                        ) : null}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                          {search?.error ? (
                            <Pressable role="button" onPress={() => onIntent({ type: 'formularySearchRequested', rowId: row.id, query: search.query })}
                              style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}>
                              <Text style={{ color: t.text }}>Retry formulary search</Text>
                            </Pressable>
                          ) : null}
                          <Pressable role="button" onPress={() => setActiveDrugRowId(null)}
                            style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}>
                            <Text style={{ color: t.text }}>Close formulary results</Text>
                          </Pressable>
                        </View>
                        {matchingFormulary.slice(0, 7).map((item) => (
                          <Pressable
                            key={item.code}
                            role="button"
                            onPress={() => {
                              onIntent({ type: 'formularySelected', rowId: row.id, item });
                              setActiveDrugRowId(null);
                              setCustomFormOpenRows((prev) => ({ ...prev, [row.id]: false }));
                            }}
                            style={({ hovered }: PressState & { hovered?: boolean }) => [
                              styles.formularyOption,
                              { backgroundColor: hovered ? t.primarySoft : 'transparent', flexDirection: 'column', alignItems: 'flex-start', gap: 2 },
                            ]}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 6 }}>
                              <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                                {item.drugName} <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontWeight: fontWeight(t.weightMedium) }}>{item.strength}</Text>
                              </Text>
                              <Text style={{ color: t.primary, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
                                [{item.formLabel}]
                              </Text>
                            </View>
                            <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 10 }}>
                              Code: {item.code} · Route: {item.route.toUpperCase()} · Unit: {item.unitLabel || 'unitless'}{item.stockStatus ? ` · ${item.stockStatus}` : ''}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}

                    {/* Dose form metadata with an override for custom or unlisted drugs */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            borderWidth: 1,
                            borderColor: t.primaryBorder,
                            backgroundColor: t.surfaceSoft,
                          }}
                        >
                          <Text style={{ color: t.primaryContrast, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
                            Form: {row.formLabel || row.form}
                          </Text>
                        </View>
                        {row.formularyCode ? (
                          <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 10 }}>
                            {row.formularyCode}
                          </Text>
                        ) : null}
                        {row.stockStatus ? (
                          <Text style={{ color: t.success, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightMedium) }}>
                            · {row.stockStatus}
                          </Text>
                        ) : null}
                      </View>
                      {!locked ? (
                        <Pressable
                          role="button"
                          aria-label={`Override dosage form for ${row.drugName || 'unlisted drug'}`}
                          aria-pressed={isCustomFormOpen}
                          onPress={() =>
                            setCustomFormOpenRows((prev) => ({ ...prev, [row.id]: !isCustomFormOpen }))
                          }
                          style={({ focused }: PressState) => [
                            { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
                            focusRing(t, focused),
                          ]}
                        >
                          <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 10, textDecorationLine: 'underline' }}>
                            {isCustomFormOpen ? 'Hide form override' : 'Custom form ▾'}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>

                    {/* Manual Dosage Form Selector Pills — only expanded for custom/unlisted drugs or when explicitly overridden */}
                    {isCustomFormOpen ? (
                      <View style={styles.pillRow}>
                        {forms.map((f) => {
                          const sel = row.form === f.value;
                          return (
                            <Pressable
                              key={f.value}
                              role="button"
                              disabled={locked}
                              aria-pressed={sel}
                              onPress={() => {
                                onIntent({ type: 'formChanged', rowId: row.id, form: f.value });
                                setCustomFormOpenRows((prev) => ({ ...prev, [row.id]: false }));
                              }}
                              style={({ focused }: PressState) => [
                                styles.microPill,
                                {
                                  borderColor: sel ? t.primary : t.border,
                                  backgroundColor: sel ? t.primarySoft : t.surface,
                                },
                                focusRing(t, focused),
                              ]}
                            >
                              <Text style={{ color: sel ? t.primaryContrast : t.textMuted, fontFamily: ff, fontSize: 10, fontWeight: fontWeight(t.weightMedium) }}>
                                {f.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>

                  {/* Column 2: Dose Quantity & Form-Specific Unit */}
                  <View style={[styles.cellDuration, { width: 172 }]}>
                    {(() => {
                      const doseVal = row.doseAmount;
                      const doseStep = row.doseStep ?? (row.unitLabel === 'mL' ? 2.5 : profile.step);
                      return (
                        <View style={[styles.durationStepper, { borderColor: t.border, backgroundColor: t.surface }]}>
                          {!locked ? (
                            <Pressable
                              role="button"
                              aria-label={`Decrease dose quantity for ${row.drugName || 'medicine'}`}
                              disabled={(doseVal == null || doseVal <= doseStep)}
                              onPress={() => {
                                if (!locked && doseVal != null && doseVal > doseStep) {
                                  onIntent({ type: 'doseStepped', rowId: row.id, delta: -doseStep });
                                }
                              }}
                              style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
                                styles.durStepBtn,
                                {
                                  borderRightWidth: 1,
                                  borderColor: t.border,
                                  backgroundColor: hovered ? t.primaryHover : t.surfaceSoft,
                                  opacity: (doseVal == null || doseVal <= doseStep) ? 0.35 : 1,
                                },
                                focusRing(t, focused),
                              ]}
                            >
                              <SvgIcon name="minus" size={14} color={t.text} />
                            </Pressable>
                          ) : null}

                          <View style={styles.durValueBox}>
                            <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
                              {doseVal == null ? '—' : `${formatDoseAmount(doseVal)}${row.unitLabel ? ` ${row.unitLabel}` : ''}`}
                            </Text>
                          </View>

                          {!locked ? (
                            <Pressable
                              role="button"
                              aria-label={`Increase dose quantity for ${row.drugName || 'medicine'}`}
                              onPress={() => onIntent({ type: 'doseStepped', rowId: row.id, delta: doseStep })}
                              style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
                                styles.durStepBtn,
                                {
                                  borderLeftWidth: 1,
                                  borderColor: t.border,
                                  backgroundColor: hovered ? t.primaryHover : t.surfaceSoft,
                                },
                                focusRing(t, focused),
                              ]}
                            >
                              <SvgIcon name="plus" size={14} color={t.text} />
                            </Pressable>
                          ) : null}
                        </View>
                      );
                    })()}

                    <View style={styles.pillRow}>
                      {rowUnits.map((u) => {
                        const sel = (row.unitLabel ?? '') === u;
                        const label = u === '' ? '—' : u;
                        return (
                          <Pressable
                            key={u || 'unitless'}
                            role="button"
                            disabled={locked}
                            aria-label={u === '' ? 'Dose unit: unitless' : `Dose unit: ${u}`}
                            aria-pressed={sel}
                            onPress={() => onIntent({ type: 'doseUnitChanged', rowId: row.id, unitLabel: u })}
                            style={({ focused }: PressState) => [
                              styles.microPill,
                              {
                                borderColor: sel ? t.primary : t.border,
                                backgroundColor: sel ? t.primarySoft : t.surface,
                              },
                              focusRing(t, focused),
                            ]}
                          >
                            <Text style={{ color: sel ? t.primaryContrast : t.textMuted, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(sel ? t.weightBold : t.weightMedium) }}>
                              {label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {row.dosingBasisLabel ? (
                      <Text style={{ color: t.info, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightMedium) }}>
                        {row.dosingBasisLabel}
                      </Text>
                    ) : null}
                  </View>

                  {/* Column 3: Frequency (OD / BD / TDS / QID / HS / SOS + Progressive M–A–E–N Disclosure) */}
                  <View style={[styles.cellSchedule, { flex: 1.6, minWidth: 268 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <View style={styles.pillRow}>
                        {(m.presets ?? [
                          { id: 'od', label: 'OD', slotIds: ['m'] },
                          { id: 'bd', label: 'BD', slotIds: ['m', 'n'] },
                          { id: 'tds', label: 'TDS', slotIds: ['m', 'a', 'n'] },
                          { id: 'qid', label: 'QID', slotIds: ['m', 'a', 'e', 'n'] },
                          { id: 'hs', label: 'HS', slotIds: ['n'] },
                          { id: 'sos', label: 'SOS', slotIds: [] },
                        ]).map((p) => {
                          const active = row.frequencyCode?.toLowerCase() === p.id.toLowerCase();
                          return (
                            <Pressable
                              key={p.id}
                              role="button"
                              disabled={locked}
                              aria-pressed={active}
                              onPress={() => onIntent({ type: 'presetApplied', rowId: row.id, presetId: p.id })}
                              style={({ focused }: PressState) => [
                                styles.presetChip,
                                {
                                  borderColor: active ? t.primary : t.border,
                                  backgroundColor: active ? t.primarySoft : t.surface,
                                },
                                focusRing(t, focused),
                              ]}
                            >
                              <Text style={{ color: active ? t.primaryContrast : t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                                {p.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      {isAsNeeded ? null : <Pressable
                        role="button"
                        aria-label="Toggle split M-A-E-N slot steppers"
                        aria-pressed={isSplitOpen}
                        onPress={() =>
                          setSplitExpandedRows((prev) => ({ ...prev, [row.id]: !prev[row.id] }))
                        }
                        style={({ focused }: PressState) => [
                          styles.microPill,
                          {
                            borderColor: isSplitOpen ? t.primary : t.border,
                            backgroundColor: isSplitOpen ? t.primarySoft : t.surfaceSoft,
                          },
                          focusRing(t, focused),
                        ]}
                      >
                        <Text style={{ color: isSplitOpen ? t.primaryContrast : t.textMuted, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
                          ⇄ Split
                        </Text>
                      </Pressable>}
                    </View>

                    {/* Compact Clickable M – A – E – N Bar (always visible; clicking any slot cycles 0 -> Dose -> ½ -> 2x) */}
                    {isAsNeeded ? null : <View style={{ flexDirection: 'row', gap: 4 }}>
                      {m.slotDefinitions.map((def) => {
                        const slotAmt = row.slots.find((s) => s.id === def.id)?.amount ?? 0;
                        const active = slotAmt > 0;
                        const baseDose = row.doseAmount ?? null;
                        const shortTag = (def.shortLabel ?? def.label).slice(0, 4);
                        return (
                          <Pressable
                            key={def.id}
                            role="button"
                            disabled={locked || (!active && baseDose == null)}
                            aria-label={`${def.label} slot: ${formatDoseAmount(slotAmt)}`}
                            aria-pressed={active}
                            onPress={() => {
                              const nextAmt =
                                slotAmt <= 0
                                  ? baseDose
                                  : slotAmt === baseDose && row.form === 'tablet'
                                    ? 0.5
                                    : 0;
                              onIntent({ type: 'slotAmountChanged', rowId: row.id, slotId: def.id, amount: nextAmt });
                            }}
                            style={({ focused }: PressState) => [
                              {
                                flex: 1,
                                paddingVertical: 4,
                                paddingHorizontal: 4,
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: active ? t.primary : t.border,
                                backgroundColor: active ? t.primarySoft : t.surface,
                                alignItems: 'center',
                              },
                              focusRing(t, focused),
                            ]}
                          >
                            <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 9 }}>
                              {shortTag}
                            </Text>
                            <Text
                              style={{
                                color: active ? t.primaryContrast : t.textMuted,
                                fontFamily: t.fontMono,
                                fontSize: t.textXs,
                                fontWeight: fontWeight(active ? t.weightBold : t.weightMedium),
                              }}
                            >
                              {formatDoseAmount(slotAmt)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>}

                    {/* Progressive Disclosure: Full − / + Steppers when ⇄ Split is open */}
                    {isSplitOpen ? (
                      <View style={styles.slotsRow}>
                        {m.slotDefinitions.map((def) => renderSlotStepper(row, def))}
                      </View>
                    ) : null}
                  </View>

                  {/* Column 4: Context-Aware Route & Anatomical Site */}
                  <View style={[styles.cellSchedule, { width: 146 }]}>
                    <View style={styles.pillRow}>
                      {rowRoutes.map((r) => {
                        const sel = row.route === r.value;
                        return (
                          <Pressable
                            key={r.value}
                            role="button"
                            disabled={locked}
                            aria-pressed={sel}
                            onPress={() => onIntent({ type: 'routeChanged', rowId: row.id, route: r.value })}
                            style={({ focused }: PressState) => [
                              styles.microPill,
                              {
                                borderColor: sel ? t.info : t.border,
                                backgroundColor: sel ? t.infoSoft : t.surface,
                              },
                              focusRing(t, focused),
                            ]}
                          >
                            <Text style={{ color: sel ? t.text : t.textMuted, fontFamily: ff, fontSize: 10, fontWeight: fontWeight(t.weightMedium) }}>
                              {r.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {rowSites.length > 0 ? (
                      <View style={styles.pillRow}>
                        {rowSites.map((s) => {
                          const sel = row.site === s.value;
                          return (
                            <Pressable
                              key={s.value}
                              role="button"
                              disabled={locked}
                              aria-pressed={sel}
                              onPress={() => onIntent({ type: 'siteChanged', rowId: row.id, site: s.value })}
                              style={({ focused }: PressState) => [
                                styles.microPill,
                                {
                                  borderColor: sel ? t.primary : t.border,
                                  backgroundColor: sel ? t.primary : t.surface,
                                },
                                focusRing(t, focused),
                              ]}
                            >
                              <Text style={{ color: sel ? '#ffffff' : t.text, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
                                {s.value}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>

                  {/* Column 5: Duration Stepper (− [ N ] + days/weeks/months) + Tablet/Capsule Dispense Count */}
                  <View style={[styles.cellDuration, { width: 160 }]}>
                    <View style={[styles.durationStepper, { borderColor: t.border, backgroundColor: t.surface }]}>
                      {!locked ? (
                        <Pressable
                          role="button"
                          aria-label={`Decrease duration for ${row.drugName || 'medicine'}`}
                          disabled={(row.durationCount ?? 0) <= 1}
                          onPress={() => onIntent({ type: 'durationStepped', rowId: row.id, delta: -1 })}
                          style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
                            styles.durStepBtn,
                            {
                              borderRightWidth: 1,
                              borderColor: t.border,
                              backgroundColor: hovered ? t.primaryHover : t.surfaceSoft,
                              opacity: (row.durationCount ?? 0) <= 1 ? 0.35 : 1,
                            },
                            focusRing(t, focused),
                          ]}
                        >
                          <SvgIcon name="minus" size={14} color={t.text} />
                        </Pressable>
                      ) : null}

                      <View style={styles.durValueBox}>
                        <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
                          {row.durationCount ?? '—'}
                        </Text>
                      </View>

                      {!locked ? (
                        <Pressable
                          role="button"
                          aria-label={`Increase duration for ${row.drugName || 'medicine'}`}
                          onPress={() => onIntent({ type: 'durationStepped', rowId: row.id, delta: 1 })}
                          style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
                            styles.durStepBtn,
                            {
                              borderLeftWidth: 1,
                              borderColor: t.border,
                              backgroundColor: hovered ? t.primaryHover : t.surfaceSoft,
                            },
                            focusRing(t, focused),
                          ]}
                        >
                          <SvgIcon name="plus" size={14} color={t.text} />
                        </Pressable>
                      ) : null}
                    </View>

                    <View style={styles.pillRow}>
                      {durationUnits.map((u) => {
                        const sel = row.durationUnit === u;
                        return (
                          <Pressable
                            key={u}
                            role="button"
                            disabled={locked}
                            aria-pressed={sel}
                            onPress={() => onIntent({ type: 'durationChanged', rowId: row.id, count: row.durationCount, unit: u })}
                            style={({ focused }: PressState) => [
                              styles.microPill,
                              {
                                flex: 1,
                                justifyContent: 'center',
                                borderColor: sel ? t.primary : t.border,
                                backgroundColor: sel ? t.primarySoft : t.surface,
                              },
                              focusRing(t, focused),
                            ]}
                          >
                            <Text style={{ color: sel ? t.primaryContrast : t.textMuted, fontFamily: ff, fontSize: 11, fontWeight: fontWeight(t.weightMedium) }}>
                              {u}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {row.dispenseQuantity ? (
                      <View
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                          backgroundColor: t.successSoft,
                          borderWidth: 1,
                          borderColor: t.success,
                          alignSelf: 'flex-start',
                        }}
                      >
                        <Text style={{ color: t.success, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
                          = {row.dispenseQuantity.count} {row.dispenseQuantity.unit}{row.dispenseQuantity.count === 1 ? '' : 's'}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Column 6: Special Instructions & Route-Aware Timing + Taper */}
                  <View style={[styles.cellTiming, { flex: 1.2, minWidth: 192 }]}>
                    <View style={styles.pillRow}>
                      {rowTimings.slice(0, 4).map((food) => {
                        const sel = row.foodRelation === food;
                        return (
                          <Pressable
                            key={food}
                            role="button"
                            disabled={locked}
                            aria-pressed={sel}
                            onPress={() => onIntent({ type: 'foodRelationChanged', rowId: row.id, foodRelation: food })}
                            style={({ focused }: PressState) => [
                              styles.microPill,
                              {
                                borderColor: sel ? t.primary : t.border,
                                backgroundColor: sel ? t.primarySoft : t.surface,
                              },
                              focusRing(t, focused),
                            ]}
                          >
                            <Text style={{ color: sel ? t.primaryContrast : t.textMuted, fontFamily: ff, fontSize: 10, fontWeight: fontWeight(t.weightMedium) }}>
                              {food}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <View style={styles.timingBottomRow}>
                      <View style={{ flex: 1 }}>
                        <ThemedInput
                          value={row.instructions}
                          editable={!locked}
                          placeholder="Spcl instructions…"
                          accessibilityLabel={`Row ${idx + 1} instructions`}
                          onChangeText={(text) => onIntent({ type: 'instructionsChanged', rowId: row.id, instructions: text })}
                          style={{ minHeight: 34, height: 34, paddingVertical: 4, fontSize: t.textXs }}
                        />
                      </View>
                      <Pressable
                        role="button"
                        aria-pressed={!!row.taperExpanded}
                        onPress={() => onIntent({ type: 'taperToggleRequested', rowId: row.id })}
                        style={({ focused }: PressState) => [
                          styles.taperBtn,
                          {
                            borderColor: row.taperExpanded || row.taperSteps?.length ? t.primary : t.border,
                            backgroundColor: row.taperExpanded || row.taperSteps?.length ? t.primarySoft : t.surface,
                          },
                          focusRing(t, focused),
                        ]}
                      >
                        <Text style={{ color: row.taperExpanded || row.taperSteps?.length ? t.primaryContrast : t.textMuted, fontFamily: ff, fontSize: 11, fontWeight: fontWeight(t.weightMedium) }}>
                          {row.taperSteps?.length ? `Taper (${row.taperSteps.length})` : 'Taper'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Column 7: Add / Remove / Up / Down (+ / − / ↑ / ↓) + Step-Down / Step-Up Titration Rows */}
                  <View style={[styles.cellOrder, { width: 152, justifyContent: 'center', gap: 6 }]}>
                    {!locked ? (
                      <>
                        <View style={styles.orderBtnGroup}>
                          {iconBtn(`${row.id}-add`, 'plus', `Insert medicine below row ${idx + 1}`, () => onIntent({ type: 'rowAddRequested', afterRowId: row.id }))}
                          {iconBtn(`${row.id}-del`, 'minus', `Remove row ${idx + 1}`, () => onIntent({ type: 'rowRemoveRequested', rowId: row.id }), m.rows.length <= 1, true)}
                          {iconBtn(`${row.id}-up`, 'chevron-up', `Move row ${idx + 1} up`, () => onIntent({ type: 'rowMoveRequested', rowId: row.id, direction: 'up' }), isFirst)}
                          {iconBtn(`${row.id}-down`, 'chevron-down', `Move row ${idx + 1} down`, () => onIntent({ type: 'rowMoveRequested', rowId: row.id, direction: 'down' }), isLast)}
                        </View>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          <Pressable
                            role="button"
                            aria-label={`Add Step-Down titration row below row ${idx + 1}`}
                            onPress={() => onIntent({ type: 'rowStepTitrationRequested', rowId: row.id, direction: 'down' })}
                            style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
                              styles.microPill,
                              {
                                flex: 1,
                                justifyContent: 'center',
                                borderColor: t.warning,
                                backgroundColor: hovered ? t.warningSoft : t.surface,
                              },
                              focusRing(t, focused),
                            ]}
                          >
                            <Text style={{ color: t.warning, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
                              ↘ Step-Dn
                            </Text>
                          </Pressable>
                          <Pressable
                            role="button"
                            aria-label={`Add Step-Up titration row below row ${idx + 1}`}
                            onPress={() => onIntent({ type: 'rowStepTitrationRequested', rowId: row.id, direction: 'up' })}
                            style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
                              styles.microPill,
                              {
                                flex: 1,
                                justifyContent: 'center',
                                borderColor: t.info,
                                backgroundColor: hovered ? t.infoSoft : t.surface,
                              },
                              focusRing(t, focused),
                            ]}
                          >
                            <Text style={{ color: t.info, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
                              ↗ Step-Up
                            </Text>
                          </Pressable>
                        </View>
                      </>
                    ) : (
                      <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>Locked</Text>
                    )}
                  </View>
                </View>

                {/* Row Validation Error */}
                {row.error ? (
                  <View style={[styles.rowError, { backgroundColor: t.dangerSoft, borderColor: t.danger }]}>
                    <SvgIcon name="danger" size={14} color={t.danger} />
                    <Text style={{ color: t.danger, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium) }}>
                      {row.error}
                    </Text>
                  </View>
                ) : null}

                {/* Expandable Taper Schedule Sub-Table with + / - / ↑ / ↓ per step */}
                {row.taperExpanded ? (
                  <View style={[styles.taperPanel, { borderColor: t.primaryBorder, backgroundColor: t.surfaceRaised }]}>
                    <View style={styles.taperHeader}>
                      <Text style={{ color: t.primaryContrast, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                        REDUCING / TAPER SCHEDULE FOR {(row.drugName || 'MEDICINE').toUpperCase()}
                      </Text>
                      {!locked ? (
                        <Pressable
                          role="button"
                          onPress={() => onIntent({ type: 'taperStepAddRequested', rowId: row.id })}
                          style={({ focused }: PressState) => [
                            styles.favPill,
                            { borderColor: t.primaryBorder, backgroundColor: t.surface },
                            focusRing(t, focused),
                          ]}
                        >
                          <SvgIcon name="plus" size={12} color={t.primary} />
                          <Text style={{ color: t.primaryContrast, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium) }}>
                            Add taper step
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>

                    {(row.taperSteps ?? []).map((step, sIdx) => {
                      const sFirst = sIdx === 0;
                      const sLast = sIdx === (row.taperSteps?.length ?? 1) - 1;
                      return (
                        <View key={step.id} style={styles.taperStepRow}>
                          <Text style={{ width: 24, color: t.textMuted, fontFamily: t.fontMono, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                            {idx + 1}.{sIdx + 1}
                          </Text>
                          <View style={{ width: 140 }}>
                            <ThemedInput
                              value={step.periodLabel}
                              editable={!locked}
                              placeholder="Week 1 / Days 1–7"
                              accessibilityLabel={`Taper step ${sIdx + 1} period`}
                              onChangeText={(text) =>
                                onIntent({ type: 'taperStepChanged', rowId: row.id, stepId: step.id, periodLabel: text })
                              }
                              style={{ minHeight: 34, height: 34, paddingVertical: 4, fontSize: t.textXs }}
                            />
                          </View>
                          <View style={{ flex: 1, minWidth: 180 }}>
                            <ThemedInput
                              value={step.frequencyLabel}
                              editable={!locked}
                              placeholder="e.g. 1 drop 4 times daily (QID)"
                              accessibilityLabel={`Taper step ${sIdx + 1} frequency`}
                              onChangeText={(text) =>
                                onIntent({ type: 'taperStepChanged', rowId: row.id, stepId: step.id, frequencyLabel: text })
                              }
                              style={{ minHeight: 34, height: 34, paddingVertical: 4, fontSize: t.textXs }}
                            />
                          </View>
                          {!locked ? (
                            <View style={styles.orderBtnGroup}>
                              {iconBtn(`${step.id}-up`, 'chevron-up', `Move taper step ${sIdx + 1} up`, () => onIntent({ type: 'taperStepMoveRequested', rowId: row.id, stepId: step.id, direction: 'up' }), sFirst)}
                              {iconBtn(`${step.id}-down`, 'chevron-down', `Move taper step ${sIdx + 1} down`, () => onIntent({ type: 'taperStepMoveRequested', rowId: row.id, stepId: step.id, direction: 'down' }), sLast)}
                              {iconBtn(`${step.id}-add`, 'plus', `Insert taper step after ${sIdx + 1}`, () => onIntent({ type: 'taperStepAddRequested', rowId: row.id, afterStepId: step.id }))}
                              {iconBtn(`${step.id}-del`, 'minus', `Remove taper step ${sIdx + 1}`, () => onIntent({ type: 'taperStepRemoveRequested', rowId: row.id, stepId: step.id }), false, true)}
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
      )}

      {/* Table Footer: Add Row + Sign-off */}
      <View style={[styles.footerBar, { borderTopColor: t.border, backgroundColor: t.surfaceSoft }]}>
        <View style={styles.footerLeft}>
          {!locked ? (
            <EmrButton
              variant="ghost"
              label="+ Add medicine row"
              onPress={() => onIntent({ type: 'rowAddRequested' })}
            />
          ) : null}
          {m.prescriberLabel ? (
            <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textSm }}>
              Prescriber: <Text style={{ color: t.text, fontWeight: fontWeight(t.weightBold) }}>{m.prescriberLabel}</Text>
              {m.signedAtLabel ? ` · Signed ${m.signedAtLabel}` : ''}
            </Text>
          ) : null}
        </View>

        <View style={styles.footerRight}>
          {m.error ? (
            <Text role="alert" style={{ color: t.danger, fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium) }}>
              {m.error}
            </Text>
          ) : null}
          {!m.readOnly && m.canSign ? (
            <EmrButton label="Sign prescription" onPress={() => onIntent({ type: 'signRequested' })} />
          ) : null}
          {!m.readOnly && m.canAmend ? (
            <EmrButton variant="outline" label="Amend prescription" onPress={() => onIntent({ type: 'amendRequested' })} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rxBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  favPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    minHeight: 30,
    borderRadius: 6,
    borderWidth: 1,
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  th: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  rowBlock: {
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cellOrder: {
    flexDirection: 'column',
    gap: 6,
  },
  rowNumBadge: {
    alignSelf: 'flex-start',
    minWidth: 28,
    height: 26,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDrug: {
    gap: 6,
  },
  drugTopRow: {
    flexDirection: 'row',
    gap: 6,
  },
  formularyList: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 4,
    gap: 2,
  },
  formularyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  microPill: {
    paddingHorizontal: 7,
    minHeight: 24,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSchedule: {
    gap: 6,
  },
  presetSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 8,
    minHeight: 24,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternPill: {
    paddingHorizontal: 8,
    minHeight: 24,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  slotBox: {
    flex: 1,
    minWidth: 68,
    borderWidth: 1,
    borderRadius: 7,
    padding: 5,
    gap: 4,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    borderWidth: 1,
    borderRadius: 5,
    overflow: 'hidden',
  },
  miniStepBtn: {
    width: 22,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStepValue: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDuration: {
    gap: 6,
  },
  durationStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderWidth: 1,
    borderRadius: 7,
    overflow: 'hidden',
  },
  durStepBtn: {
    width: 34,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durValueBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellTiming: {
    gap: 6,
  },
  timingBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taperBtn: {
    paddingHorizontal: 8,
    height: 34,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  taperPanel: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  taperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taperStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
});
