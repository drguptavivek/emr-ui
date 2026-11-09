'use client';

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import { niceScale } from './charts.logic';
import { EmrCard } from './l1-display';
import { EmrButton, EmrRow } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import type { EmrBarChartProps, EmrChartLabels, EmrFunnelChartProps } from './charts.types';

export type * from './charts.types';

type PressState = PressableStateCallbackType & { focused?: boolean };

const DEFAULTS: EmrChartLabels = {
  showTable: 'Show as table',
  hideTable: 'Hide table',
  noData: 'No data',
  categoryColumn: 'Category',
  stepColumn: 'Step',
  valueColumn: 'Value',
  conversionColumn: 'Conversion',
  legend: 'Legend',
  nativeUnavailable: '',
};

/**
 * React Native implementation of EmrBarChart using proportional View bars, legend, and toggleable table view.
 */
export function EmrBarChart({ model, onIntent, labels }: EmrBarChartProps) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const [showTable, setShowTable] = useState(false);
  const { categories, series } = model;
  const colors = [t.primary, t.warning, t.success, t.info, t.danger];
  const dataMax = Math.max(
    0,
    model.maxValue ?? 0,
    ...series.flatMap((s) => Object.values(s.values).filter((v): v is number => typeof v === 'number')),
  );
  const scale = niceScale(dataMax);
  const ff = fontFamily(t);

  const valueText = (si: number, cid: string) => {
    const v = series[si].values[cid];
    return typeof v !== 'number' ? l.noData : series[si].valueLabels?.[cid] ?? String(v);
  };

  return (
    <EmrCard label={model.title}>
      <View style={styles.root}>
        {model.description ? (
          <Text style={{ fontFamily: ff, fontSize: t.textSm, color: t.textMuted }}>{model.description}</Text>
        ) : null}

        <View style={styles.group}>
          {categories.map((c) => (
            <View key={c.id} style={styles.catBlock}>
              <Text style={{ fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), color: t.text }}>
                {c.label}
              </Text>
              {series.map((s, si) => {
                const v = s.values[c.id];
                const pct = typeof v === 'number' && scale.max > 0 ? Math.min(100, Math.max(2, (v / scale.max) * 100)) : 0;
                const text = valueText(si, c.id);
                const color = colors[si % colors.length];
                const barRow = (
                  <View style={styles.barRow}>
                    {series.length > 1 ? (
                      <Text style={{ fontFamily: ff, fontSize: t.textXs, color: t.textMuted, minWidth: 72 }}>{s.label}</Text>
                    ) : null}
                    <View style={[styles.barTrack, { backgroundColor: t.surfaceSoft, borderColor: t.border }]}>
                      {typeof v === 'number' ? (
                        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
                      ) : null}
                    </View>
                    <Text style={{ fontFamily: ff, fontSize: t.textSm, color: typeof v === 'number' ? t.text : t.textMuted, minWidth: 48 }}>
                      {text}
                    </Text>
                  </View>
                );

                if (!onIntent || typeof v !== 'number') {
                  return <View key={s.id}>{barRow}</View>;
                }
                return (
                  <Pressable
                    key={s.id}
                    role="button"
                    aria-label={`${c.label}, ${s.label}: ${text}`}
                    onPress={() => onIntent({ type: 'categorySelected', categoryId: c.id, seriesId: s.id })}
                    style={({ focused }: PressState) => [styles.pressRow, focusRing(t, focused)]}
                  >
                    {barRow}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <EmrRow>
          {series.map((s, si) => (
            <View key={s.id} style={styles.legendItem}>
              <View style={{ width: 12, height: 12, backgroundColor: colors[si % colors.length], borderRadius: 2 }} />
              <Text style={{ fontFamily: ff, fontSize: t.textSm, color: t.text }}>{s.label}</Text>
            </View>
          ))}
        </EmrRow>

        <View style={styles.actions}>
          <EmrButton
            variant="outline"
            small
            label={showTable ? l.hideTable : l.showTable}
            onPress={() => setShowTable((prev) => !prev)}
          />
        </View>

        {showTable ? (
          <View style={[styles.tableBox, { borderColor: t.border }]}>
            {categories.map((c) => (
              <View key={c.id} style={[styles.tableRow, { borderColor: t.border }]}>
                <Text style={{ fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), color: t.text }}>
                  {c.label}
                </Text>
                {series.map((s, si) => (
                  <Text key={s.id} style={{ fontFamily: ff, fontSize: t.textSm, color: t.textMuted }}>
                    {s.label}: {valueText(si, c.id)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </EmrCard>
  );
}

/**
 * React Native implementation of EmrFunnelChart using centered proportional stage bars and toggleable table view.
 */
export function EmrFunnelChart({ model, onIntent, labels }: EmrFunnelChartProps) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const [showTable, setShowTable] = useState(false);
  const { steps } = model;
  const maxVal = Math.max(1, ...steps.map((s) => s.value));
  const ff = fontFamily(t);

  return (
    <EmrCard label={model.title}>
      <View style={styles.root}>
        {model.description ? (
          <Text style={{ fontFamily: ff, fontSize: t.textSm, color: t.textMuted }}>{model.description}</Text>
        ) : null}

        <View style={styles.group}>
          {steps.map((s) => {
            const pct = Math.min(100, Math.max(6, (s.value / maxVal) * 100));
            const spoken = [s.label, s.valueLabel, s.conversionLabel].filter(Boolean).join(', ');
            const content = (
              <View style={styles.catBlock}>
                <View style={styles.funnelHeader}>
                  <Text style={{ fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), color: t.text }}>
                    {s.label}
                  </Text>
                  <Text style={{ fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), color: t.text }}>
                    {s.valueLabel}
                    {s.conversionLabel ? (
                      <Text style={{ fontWeight: fontWeight(t.weightRegular), color: t.textMuted }}> · {s.conversionLabel}</Text>
                    ) : null}
                  </Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: t.surfaceSoft, borderColor: t.border, alignItems: 'center' }]}>
                  <View style={{ width: `${pct}%`, height: '100%', backgroundColor: t.primary, borderRadius: 4 }} />
                </View>
              </View>
            );

            if (!onIntent) {
              return <View key={s.id}>{content}</View>;
            }
            return (
              <Pressable
                key={s.id}
                role="button"
                aria-label={spoken}
                onPress={() => onIntent({ type: 'stepSelected', stepId: s.id })}
                style={({ focused }: PressState) => [styles.pressRow, focusRing(t, focused)]}
              >
                {content}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <EmrButton
            variant="outline"
            small
            label={showTable ? l.hideTable : l.showTable}
            onPress={() => setShowTable((prev) => !prev)}
          />
        </View>

        {showTable ? (
          <View style={[styles.tableBox, { borderColor: t.border }]}>
            {steps.map((s) => (
              <View key={s.id} style={[styles.tableRow, { borderColor: t.border }]}>
                <Text style={{ fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), color: t.text }}>
                  {s.label}
                </Text>
                <Text style={{ fontFamily: ff, fontSize: t.textSm, color: t.text }}>
                  {s.valueLabel} {s.conversionLabel ? `(${s.conversionLabel})` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </EmrCard>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  group: { gap: 10 },
  catBlock: { gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 28 },
  barTrack: { flex: 1, height: 18, borderRadius: 4, borderWidth: 1, overflow: 'hidden', justifyContent: 'center' },
  pressRow: { minHeight: 44, justifyContent: 'center', borderRadius: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  funnelHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  actions: { flexDirection: 'row' },
  tableBox: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  tableRow: { padding: 8, borderBottomWidth: 1, gap: 2 },
});
