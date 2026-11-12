'use client';

import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import type { EmrToastIntent, EmrToastModel, EmrTone } from '@drguptavivek/emr-controller';
import { EmrButton } from './primitives';
import { fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';

export type { EmrToastIntent, EmrToastModel };

const TONE_GLYPH: Record<EmrTone, string> = {
  neutral: '•',
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  danger: '✕',
};

// ---------------------------------------------------------------------------
// 13. EmrProgressBar
// ---------------------------------------------------------------------------

export function EmrProgressBar({
  label,
  value,
  max = 100,
  indeterminate,
  tone = 'info',
  valueLabel,
}: {
  label: string;
  value?: number | null;
  max?: number;
  indeterminate?: boolean;
  tone?: EmrTone;
  valueLabel?: string;
}) {
  const t = useEmrTheme();
  const safeMax = max > 0 ? max : 100;
  const clamped = value == null ? 0 : Math.min(safeMax, Math.max(0, value));
  const percent = indeterminate ? 38 : Math.round((clamped / safeMax) * 100);
  const fillColor = tone === 'neutral' ? t.primary : toneColors(t, tone).color;
  const readout = valueLabel ?? (indeterminate ? 'In progress…' : `${percent}%`);

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressHeader}>
        <Text
          style={{
            color: t.text,
            fontSize: t.textSm,
            fontWeight: fontWeight(t.weightMedium),
            fontFamily: fontFamily(t),
            flexShrink: 1,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: t.textMuted,
            fontSize: t.textXs,
            fontWeight: fontWeight(t.weightBold),
            fontFamily: fontFamily(t),
          }}
        >
          {readout}
        </Text>
      </View>
      <View
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuetext={readout}
        style={[styles.progressTrack, { backgroundColor: t.surfaceRaised, borderColor: t.border }]}
      >
        <View
          style={[
            styles.progressFill,
            indeterminate ? styles.progressIndeterminate : { width: `${percent}%` as const },
            { backgroundColor: fillColor },
          ]}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 14. EmrSpinner
// ---------------------------------------------------------------------------

export function EmrSpinner({
  label,
  size = 'md',
  tone = 'info',
}: {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: EmrTone;
}) {
  const t = useEmrTheme();
  const color = tone === 'neutral' ? t.primary : toneColors(t, tone).color;
  const nativeSize = size === 'lg' ? 'large' : 'small';

  return (
    <View
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Loading…'}
      style={styles.spinnerRow}
    >
      <ActivityIndicator size={nativeSize} color={color} />
      {label ? (
        <Text
          style={{
            color: t.textMuted,
            fontSize: size === 'sm' ? t.textXs : t.textSm,
            fontWeight: fontWeight(t.weightMedium),
            fontFamily: fontFamily(t),
          }}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 15. EmrSkeleton
// ---------------------------------------------------------------------------

export function EmrSkeleton({
  variant = 'line',
  lines = 1,
  width,
  height,
  ariaLabel = 'Loading content',
}: {
  variant?: 'line' | 'rect' | 'circle';
  lines?: number;
  width?: number | string;
  height?: number | string;
  ariaLabel?: string;
}) {
  const t = useEmrTheme();
  const bg = t.surfaceRaised;

  if (variant === 'circle') {
    const dim = typeof width === 'number' ? width : typeof height === 'number' ? height : 40;
    return (
      <View
        aria-busy={true}
        aria-label={ariaLabel}
        style={{
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: bg,
        }}
      />
    );
  }

  if (variant === 'rect') {
    return (
      <View
        aria-busy={true}
        aria-label={ariaLabel}
        style={{
          width: (width ?? '100%') as number,
          height: (height ?? 80) as number,
          borderRadius: 8,
          backgroundColor: bg,
        }}
      />
    );
  }

  const count = Math.max(1, Math.round(lines));
  return (
    <View aria-busy={true} aria-label={ariaLabel} style={styles.skeletonStack}>
      {Array.from({ length: count }, (_, idx) => {
        const isTrailingLine = count > 1 && idx === count - 1 && width === undefined;
        return (
          <View
            key={idx}
            style={{
              width: (isTrailingLine ? '72%' : width ?? '100%') as number,
              height: (height ?? 14) as number,
              borderRadius: 6,
              backgroundColor: bg,
            }}
          />
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 16. EmrAvatar
// ---------------------------------------------------------------------------

const HONORIFIC_RE = /^(?:dr|mr|mrs|ms|prof|sr|jr)\.?\s+/i;

export function deriveAvatarInitials(name: string, explicitInitials?: string): string {
  if (explicitInitials && explicitInitials.trim()) {
    return explicitInitials.trim().slice(0, 2).toUpperCase();
  }
  const cleaned = name.trim().replace(HONORIFIC_RE, '').trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

export function EmrAvatar({
  name,
  initials,
  imageUrl,
  size = 'md',
  tone = 'neutral',
}: {
  name: string;
  initials?: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  tone?: EmrTone;
}) {
  const t = useEmrTheme();
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);

  const dim = size === 'sm' ? 32 : size === 'lg' ? 52 : 40;
  const fontSize = size === 'sm' ? t.textXs : size === 'lg' ? t.textLg : t.textSm;
  const palette = toneColors(t, tone);
  const textInitials = deriveAvatarInitials(name, initials);

  if (imageUrl && !imgFailed) {
    return (
      <Image
        source={{ uri: imageUrl }}
        accessibilityLabel={name}
        onError={() => setImgFailed(true)}
        style={{
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: palette.backgroundColor,
        }}
      />
    );
  }

  return (
    <View
      role="img"
      aria-label={name}
      style={[
        styles.avatar,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: palette.backgroundColor,
          borderColor: t.border,
        },
      ]}
    >
      <Text
        style={{
          color: palette.color,
          fontSize,
          fontWeight: fontWeight(t.weightBold),
          fontFamily: fontFamily(t),
        }}
      >
        {textInitials}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Relocated L1 Toast (re-exported from l4-mobile-shell.tsx for compatibility)
// ---------------------------------------------------------------------------

/**
 * L1 toast. No timers: the app's queue dismisses. Transient, so it must never be the only carrier
 * of a blocking clinical error; those belong in an inline EmrAlert. `bottomOffset` lifts it above a tab bar.
 */
export function EmrToast({
  model,
  bottomOffset = 0,
  onIntent,
  labels,
}: {
  model: EmrToastModel | null;
  bottomOffset?: number;
  onIntent: (intent: EmrToastIntent) => void;
  labels?: { dismiss?: string };
}) {
  const t = useEmrTheme();
  const dismissLabel = labels?.dismiss ?? 'Dismiss';
  if (!model) return null;
  const c = toneColors(t, model.tone);
  const urgent = model.tone === 'danger' || model.tone === 'warning';
  return (
    <View pointerEvents="box-none" style={[styles.toastHost, { bottom: bottomOffset }]}>
      <View role={urgent ? 'alert' : 'status'} style={[styles.toast, { backgroundColor: c.backgroundColor, borderColor: c.color }]}>
        <Text style={{ flex: 1, minWidth: 0, color: c.color, fontSize: t.textMd, fontFamily: fontFamily(t) }}>
          {TONE_GLYPH[model.tone]} {model.message}
        </Text>
        {model.actionLabel ? (
          <EmrButton small variant="outline" label={model.actionLabel} onPress={() => onIntent({ type: 'actionPressed', id: model.id })} />
        ) : null}
        <EmrButton small variant="ghost" label="✕" accessibilityLabel={dismissLabel} onPress={() => onIntent({ type: 'dismissed', id: model.id })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressWrap: { gap: 6, width: '100%' },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressIndeterminate: {
    width: '38%',
    marginLeft: '24%',
  },
  spinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonStack: {
    gap: 8,
    width: '100%',
  },
  avatar: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  toastHost: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 8 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12 },
});
