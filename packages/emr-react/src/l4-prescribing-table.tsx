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
  { value: 'drop', label: 'Eye drops' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'ointment', label: 'Ointment' },
  { value: 'liquid', label: 'Syrup / Liquid' },
  { value: 'spray', label: 'Spray' },
  { value: 'injection', label: 'Injection' },
];

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

  const forms = m.formOptions ?? DEFAULT_FORMS;
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
        </View>
      </View>

      {/* Scrollable Table Surface */}
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: '100%' }}>
        <View style={{ flex: 1, minWidth: 980 }}>
          {/* Column Headers */}
          <View style={[styles.tableHead, { borderBottomColor: t.border, backgroundColor: t.surfaceRaised }]}>
            <Text style={[styles.th, { width: 132, color: t.textMuted, fontFamily: ff, fontSize: t.textXs }]}>
              # · ROW ORDER
            </Text>
            <Text style={[styles.th, { flex: 1.5, minWidth: 230, color: t.textMuted, fontFamily: ff, fontSize: t.textXs }]}>
              MEDICINE · STRENGTH · FORM & ROUTE
            </Text>
            <Text style={[styles.th, { flex: 1.8, minWidth: 310, color: t.textMuted, fontFamily: ff, fontSize: t.textXs }]}>
              SCHEDULE (M – A – E – N) & PRESETS
            </Text>
            <Text style={[styles.th, { width: 176, color: t.textMuted, fontFamily: ff, fontSize: t.textXs }]}>
              DURATION (− / +)
            </Text>
            <Text style={[styles.th, { flex: 1.2, minWidth: 200, color: t.textMuted, fontFamily: ff, fontSize: t.textXs }]}>
              TIMING · INSTRUCTIONS & TAPER
            </Text>
          </View>

          {/* Prescription Rows */}
          {m.rows.map((row, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === m.rows.length - 1;
            const needle = row.drugName.trim().toLowerCase();
            const matchingFormulary: readonly PrescribingFormularyItem[] =
              activeDrugRowId === row.id && m.formulary
                ? m.formulary.filter(
                    (f) =>
                      !needle ||
                      f.drugName.toLowerCase().includes(needle) ||
                      f.formLabel.toLowerCase().includes(needle),
                  )
                : [];

            return (
              <View
                key={row.id}
                style={[
                  styles.rowBlock,
                  {
                    borderBottomColor: t.border,
                    backgroundColor: idx % 2 === 1 ? t.surfaceSoft : t.surface,
                  },
                ]}
              >
                <View style={styles.rowMain}>
                  {/* Cell 1: Row Index + Move Up / Move Down / Add Below / Remove */}
                  <View style={[styles.cellOrder, { width: 132 }]}>
                    <View style={[styles.rowNumBadge, { backgroundColor: t.primarySoft, borderColor: t.primaryBorder }]}>
                      <Text style={{ color: t.primaryContrast, fontFamily: t.fontMono, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
                        {idx + 1}
                      </Text>
                    </View>
                    {!locked ? (
                      <View style={styles.orderBtnGroup}>
                        {iconBtn(`${row.id}-up`, 'chevron-up', `Move row ${idx + 1} up`, () => onIntent({ type: 'rowMoveRequested', rowId: row.id, direction: 'up' }), isFirst)}
                        {iconBtn(`${row.id}-down`, 'chevron-down', `Move row ${idx + 1} down`, () => onIntent({ type: 'rowMoveRequested', rowId: row.id, direction: 'down' }), isLast)}
                        {iconBtn(`${row.id}-add`, 'plus', `Insert medicine below row ${idx + 1}`, () => onIntent({ type: 'rowAddRequested', afterRowId: row.id }))}
                        {iconBtn(`${row.id}-del`, 'minus', `Remove row ${idx + 1}`, () => onIntent({ type: 'rowRemoveRequested', rowId: row.id }), m.rows.length <= 1, true)}
                      </View>
                    ) : null}
                  </View>

                  {/* Cell 2: Medicine Name, Strength, Form, Route, Site */}
                  <View style={[styles.cellDrug, { flex: 1.5, minWidth: 230 }]}>
                    <View style={styles.drugTopRow}>
                      <View style={{ flex: 1, minWidth: 130 }}>
                        <ThemedInput
                          value={row.drugName}
                          editable={!locked}
                          placeholder="Search or type medicine…"
                          accessibilityLabel={`Row ${idx + 1} medicine name`}
                          onFocus={() => setActiveDrugRowId(row.id)}
                          onBlur={() => setTimeout(() => setActiveDrugRowId((cur) => (cur === row.id ? null : cur)), 160)}
                          onChangeText={(text) => onIntent({ type: 'drugNameChanged', rowId: row.id, drugName: text })}
                          style={{ minHeight: 36, height: 36, paddingVertical: 4, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium) }}
                        />
                      </View>
                      <View style={{ width: 84 }}>
                        <ThemedInput
                          value={row.strength}
                          editable={!locked}
                          placeholder="500 mg"
                          accessibilityLabel={`Row ${idx + 1} strength`}
                          onChangeText={(text) => onIntent({ type: 'strengthChanged', rowId: row.id, strength: text })}
                          style={{ minHeight: 36, height: 36, paddingVertical: 4, fontSize: t.textXs, fontFamily: t.fontMono }}
                        />
                      </View>
                    </View>

                    {/* Formulary Quick Suggestions */}
                    {matchingFormulary.length > 0 && !locked ? (
                      <View style={[styles.formularyList, { borderColor: t.primaryBorder, backgroundColor: t.surface }]}>
                        {matchingFormulary.slice(0, 5).map((item) => (
                          <Pressable
                            key={item.code}
                            role="button"
                            onPress={() => {
                              onIntent({ type: 'formularySelected', rowId: row.id, item });
                              setActiveDrugRowId(null);
                            }}
                            style={({ hovered }: PressState & { hovered?: boolean }) => [
                              styles.formularyOption,
                              { backgroundColor: hovered ? t.primarySoft : 'transparent' },
                            ]}
                          >
                            <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium) }}>
                              {item.drugName} <Text style={{ color: t.textMuted, fontFamily: t.fontMono }}>{item.strength}</Text>
                            </Text>
                            <Text style={{ color: t.primary, fontFamily: ff, fontSize: t.text2xs }}>
                              {item.formLabel}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}

                    {/* Form & Route / Eye Site Selector Pills */}
                    <View style={styles.pillRow}>
                      {forms.slice(0, 5).map((f) => {
                        const sel = row.form === f.value;
                        return (
                          <Pressable
                            key={f.value}
                            role="button"
                            disabled={locked}
                            aria-pressed={sel}
                            onPress={() => onIntent({ type: 'formChanged', rowId: row.id, form: f.value })}
                            style={({ focused }: PressState) => [
                              styles.microPill,
                              {
                                borderColor: sel ? t.primary : t.border,
                                backgroundColor: sel ? t.primarySoft : t.surface,
                              },
                              focusRing(t, focused),
                            ]}
                          >
                            <Text style={{ color: sel ? t.primaryContrast : t.textMuted, fontFamily: ff, fontSize: 11, fontWeight: fontWeight(t.weightMedium) }}>
                              {f.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <View style={styles.pillRow}>
                      {routes.slice(0, 3).map((r) => {
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
                            <Text style={{ color: sel ? t.text : t.textMuted, fontFamily: ff, fontSize: 11, fontWeight: fontWeight(t.weightMedium) }}>
                              {r.label}
                            </Text>
                          </Pressable>
                        );
                      })}

                      {row.route === 'eye' || row.form === 'drop' || row.form === 'ointment'
                        ? sites.map((s) => {
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
                                <Text style={{ color: sel ? '#ffffff' : t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                                  {s.value}
                                </Text>
                              </Pressable>
                            );
                          })
                        : null}
                    </View>
                  </View>

                  {/* Cell 3: Schedule Steppers (M - A - E - N) + Quick Frequency Presets */}
                  <View style={[styles.cellSchedule, { flex: 1.8, minWidth: 310 }]}>
                    <View style={styles.presetSummaryRow}>
                      <View style={styles.pillRow}>
                        {(m.presets ?? [
                          { id: 'od', label: 'OD', slotIds: ['m'] },
                          { id: 'bd', label: 'BD', slotIds: ['m', 'n'] },
                          { id: 'tds', label: 'TDS', slotIds: ['m', 'a', 'n'] },
                          { id: 'qid', label: 'QID', slotIds: ['m', 'a', 'e', 'n'] },
                          { id: 'hs', label: 'HS', slotIds: ['n'] },
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

                      {row.patternLabel ? (
                        <View style={[styles.patternPill, { borderColor: t.primaryBorder, backgroundColor: t.surfaceSoft }]}>
                          <Text style={{ color: t.primaryContrast, fontFamily: t.fontMono, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                            {row.patternLabel}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.slotsRow}>
                      {m.slotDefinitions.map((def) => renderSlotStepper(row, def))}
                    </View>
                  </View>

                  {/* Cell 4: Duration Stepper (− [ N ] + days/weeks/months) */}
                  <View style={[styles.cellDuration, { width: 176 }]}>
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
                  </View>

                  {/* Cell 5: Food / Timing + Remarks + Taper Schedule Button */}
                  <View style={[styles.cellTiming, { flex: 1.2, minWidth: 200 }]}>
                    <View style={styles.pillRow}>
                      {foodOptions.slice(0, 4).map((food) => {
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
                            <Text style={{ color: sel ? t.primaryContrast : t.textMuted, fontFamily: ff, fontSize: 11, fontWeight: fontWeight(t.weightMedium) }}>
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
                          placeholder="Instructions / remarks…"
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
