'use client';

import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import {
  canActivateEmrStatTile,
  normalizeEmrStatTileSize,
  normalizeEmrStatTileTone,
  resolveEmrStatTileAriaLabel,
  type EmrStatTileIntent,
  type EmrStatTileModel,
  type EmrStatTileSize,
  type EmrTone,
} from '@drguptavivek/emr-controller';
import { SvgIcon } from './icons';
import { EmrBadgeView } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

export type { EmrStatTileIntent, EmrStatTileModel, EmrStatTileSize };

type PressState = PressableStateCallbackType & { focused?: boolean; hovered?: boolean };

/** L1. Tappable when interactive and enabled (opens the list behind the count); plain group otherwise. */
export function EmrStatTile({
  controlId,
  model,
  tone: toneProp,
  size: sizeProp = 'md',
  interactive: interactiveProp,
  selected = false,
  loading = false,
  readOnly = false,
  disabled = false,
  ariaLabel,
  onIntent,
}: {
  controlId?: string;
  model: EmrStatTileModel;
  tone?: EmrTone;
  size?: EmrStatTileSize;
  interactive?: boolean;
  selected?: boolean;
  loading?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onIntent?: (intent: EmrStatTileIntent) => void;
}) {
  const t = useEmrTheme();
  const size = normalizeEmrStatTileSize(sizeProp);
  const tone = normalizeEmrStatTileTone(toneProp, model.tone);
  const interactive = interactiveProp ?? Boolean(onIntent);
  const canAct = canActivateEmrStatTile(interactive, disabled, readOnly, loading);
  const minHeight = size === 'sm' ? 72 : size === 'lg' ? 104 : t.controlHeight * 2;
  const padding = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;

  const toneBorder =
    selected
      ? t.primary
      : tone === 'info'
        ? t.info
        : tone === 'success'
          ? t.success
          : tone === 'warning'
            ? t.warning
            : tone === 'danger'
              ? t.danger
              : t.border;

  const trendColor = (trTone?: EmrTone) =>
    trTone === 'info'
      ? t.info
      : trTone === 'success'
        ? t.success
        : trTone === 'warning'
          ? t.warning
          : trTone === 'danger'
            ? t.danger
            : t.textMuted;

  const body = loading ? (
    <>
      <View style={[styles.skeleton, { width: '55%', height: 12, backgroundColor: t.surfaceSoft }]} />
      <View style={[styles.skeleton, { width: '35%', height: 26, marginVertical: 2, backgroundColor: t.surfaceSoft }]} />
      <View style={[styles.skeleton, { width: '70%', height: 11, backgroundColor: t.surfaceSoft }]} />
    </>
  ) : (
    <>
      <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
        {model.label}
      </Text>
      <Text
        style={{
          color: t.text,
          fontSize: size === 'sm' ? t.textXl : t.text2xl,
          fontWeight: fontWeight(t.weightBold),
          fontFamily: fontFamily(t),
          fontVariant: ['tabular-nums'],
        }}
      >
        {model.value}
      </Text>
      {model.trend ? (
        <View style={styles.trendRow}>
          {model.trend.direction === 'up' || model.trend.direction === 'down' || model.trend.direction === 'flat' ? (
            <SvgIcon
              name={model.trend.direction === 'up' ? 'chevron-up' : model.trend.direction === 'down' ? 'chevron-down' : 'minus'}
              size={14}
              color={trendColor(model.trend.tone)}
            />
          ) : null}
          <Text style={{ color: trendColor(model.trend.tone), fontSize: t.textXs, fontWeight: fontWeight(600), fontFamily: fontFamily(t) }}>
            {model.trend.label}
          </Text>
        </View>
      ) : null}
      {model.sub ? <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>{model.sub}</Text> : null}
      {model.status ? <EmrBadgeView badge={model.status} /> : null}
    </>
  );

  const label = resolveEmrStatTileAriaLabel(model, ariaLabel);
  const base = [
    styles.tile,
    {
      borderColor: toneBorder,
      borderStyle: (readOnly ? 'dashed' : 'solid') as 'dashed' | 'solid',
      backgroundColor: selected ? t.primarySoft : t.surface,
      minHeight,
      padding,
      opacity: disabled ? 0.55 : 1,
    },
  ];

  if (!canAct) {
    return (
      <View
        nativeID={controlId}
        role="group"
        aria-label={label}
        aria-busy={loading || undefined}
        aria-readonly={interactive && readOnly ? true : undefined}
        aria-disabled={disabled || undefined}
        style={base}
      >
        {body}
      </View>
    );
  }

  return (
    <Pressable
      nativeID={controlId}
      role="button"
      aria-label={label}
      aria-pressed={selected}
      onPress={() => onIntent?.({ type: 'statSelected', key: model.key })}
      style={({ pressed, hovered, focused }: PressState) => [
        ...base,
        pressed || hovered ? { backgroundColor: t.surfaceRaised } : null,
        focusRing(t, focused),
      ]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flexGrow: 1, borderWidth: 1, borderRadius: 12, padding: 16, gap: 4, justifyContent: 'center', minWidth: 0 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  skeleton: { borderRadius: 6 },
});
