'use client';

import type {
  EmrControlVariant,
  EmrMaskOptions,
  EmrMaskResult,
  EmrOtpEditResult,
  EmrSliderMark,
  EmrTone,
} from '@drguptavivek/emr-controller';
import { useId, useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SvgIcon } from './icons';
import { FieldChrome, type FieldValidationLine } from './l1-field-chrome';
import { type WebKeyEvent } from './l1-interactive-shared';
import {
  applyInputMask,
  applyOtpSlotEdit,
  clampRangeSliderPair,
  clampSliderValue,
  countSliderStepDecimals,
  editMaskedInputWithCaret,
  extractOtpTypedInput,
  formatSliderValue,
  inferMaskInputMode,
  normalizeOtpSlots,
  resolveClosestRangeThumb,
  resolveOtpClearSlot,
  resolveRangeThumbKeyValue,
  resolveSliderKeyStepValue,
  sliderValuePercent,
} from './l1-wave2.logic';
import { fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';

export type { EmrMaskOptions, EmrMaskResult, EmrOtpEditResult, EmrSliderMark };

const RESOLVED_MONO_FONT = (webMono: string): string | undefined =>
  Platform.OS === 'web'
    ? webMono
    : Platform.select({ ios: 'Menlo', android: 'monospace', default: webMono });

// ─────────────────────────────────────────────────────────────
// 1. EmrSlider
// ─────────────────────────────────────────────────────────────

export interface EmrSliderProps {
  readonly value?: number | null;
  readonly onValueChange?: (value: number | null) => void;
  readonly onCommitted?: (value: number | null) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly precision?: number;
  readonly unit?: string;
  readonly marks?: readonly EmrSliderMark[];
  readonly showValue?: boolean;
  /** @deprecated Use `showValue` */
  readonly showValueInput?: boolean;
  readonly showSteppers?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly tone?: EmrTone | 'neutral';
  readonly clearable?: boolean;
  readonly clearLabel?: string;
  readonly onCleared?: () => void;
  readonly onFocused?: () => void;
  readonly onBlurred?: () => void;
  readonly label?: string;
  readonly ariaLabel?: string;
  readonly labelHidden?: boolean;
  readonly hint?: string;
  readonly error?: string;
  readonly invalid?: boolean;
  readonly warning?: string;
  readonly info?: string;
  readonly messages?: readonly FieldValidationLine[];
  readonly ariaDescribedBy?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly controlId?: string;
}

export function EmrSlider({
  value = null,
  onValueChange,
  onCommitted,
  min = 0,
  max = 100,
  step = 1,
  precision,
  unit = '',
  marks = [],
  showValue,
  showValueInput = true,
  showSteppers = false,
  size = 'md',
  tone = 'neutral',
  clearable = false,
  clearLabel = 'Clear',
  onCleared,
  onFocused,
  onBlurred,
  label,
  ariaLabel,
  labelHidden = false,
  hint,
  error,
  invalid = false,
  warning,
  info,
  messages,
  ariaDescribedBy,
  required,
  disabled = false,
  readOnly = false,
  controlId,
}: EmrSliderProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-slider-${reactId}`;

  const interactive = !disabled && !readOnly;
  const resolvedShowValue = showValue ?? showValueInput;
  const isInvalid = Boolean(invalid || error);
  const numericVal =
    value !== null && Number.isFinite(value) ? clampSliderValue(value, min, max, step) : min;
  const fillPct = value === null ? 0 : sliderValuePercent(numericVal, min, max);
  const resolvedPrecision = precision ?? countSliderStepDecimals(step);
  const formattedReadout = formatSliderValue(value, unit, resolvedPrecision);
  const resolvedLabel = ariaLabel ?? label ?? 'Slider';

  const accent = isInvalid
    ? t.danger
    : warning
      ? t.warning
      : tone !== 'neutral'
        ? toneColors(t, tone).color
        : t.primary;
  const railHeight = size === 'sm' ? 4 : size === 'lg' ? 8 : 6;
  const thumbVisualSize = size === 'sm' ? 18 : size === 'lg' ? 24 : 20;

  const [trackWidth, setTrackWidth] = useState(0);
  const [thumbFocused, setThumbFocused] = useState(false);
  const trackRef = useRef<{ getBoundingClientRect?: () => { left: number; width: number } } | null>(null);
  const thumbRef = useRef<{ focus?: () => void } | null>(null);
  const startOffset = useRef(0);
  const lastCommitted = useRef<number | null>(value);

  const live = useRef({
    min,
    max,
    step,
    trackWidth,
    interactive,
    value,
    onValueChange,
    onCommitted,
  });
  live.current = {
    min,
    max,
    step,
    trackWidth,
    interactive,
    value,
    onValueChange,
    onCommitted,
  };

  const resolveOffsetX = (
    ne: { clientX?: number; pageX?: number; locationX?: number },
    fallback: number,
  ): number => {
    const node = trackRef.current;
    if (node && typeof node.getBoundingClientRect === 'function') {
      const rect = node.getBoundingClientRect();
      const clientX =
        typeof ne.clientX === 'number'
          ? ne.clientX
          : typeof ne.pageX === 'number'
            ? ne.pageX
            : undefined;
      if (clientX !== undefined && rect.width > 0) {
        live.current.trackWidth = rect.width;
        return clientX - rect.left;
      }
    }
    return fallback;
  };

  const emitFromOffset = (offsetX: number) => {
    const c = live.current;
    const width = c.trackWidth > 0 ? c.trackWidth : 1;
    const frac = Math.max(0, Math.min(1, offsetX / width));
    const next = clampSliderValue(c.min + frac * (c.max - c.min), c.min, c.max, c.step);
    lastCommitted.current = next;
    c.onValueChange?.(next);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => live.current.interactive,
      onMoveShouldSetPanResponder: () => live.current.interactive,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const ne = e.nativeEvent as unknown as {
          clientX?: number;
          pageX?: number;
          locationX?: number;
        };
        startOffset.current = resolveOffsetX(ne, ne.locationX ?? 0);
        thumbRef.current?.focus?.();
        emitFromOffset(startOffset.current);
      },
      onPanResponderMove: (e, g) => {
        const ne = e.nativeEvent as unknown as {
          clientX?: number;
          pageX?: number;
          locationX?: number;
        };
        emitFromOffset(resolveOffsetX(ne, startOffset.current + g.dx));
      },
      onPanResponderRelease: () => {
        live.current.onCommitted?.(lastCommitted.current);
      },
      onPanResponderTerminate: () => {
        live.current.onCommitted?.(lastCommitted.current);
      },
    }),
  ).current;

  const commitValue = (nextRaw: number) => {
    if (!interactive) return;
    const clamped = clampSliderValue(nextRaw, min, max, step);
    onValueChange?.(clamped);
    onCommitted?.(clamped);
  };

  const handleClear = () => {
    if (!interactive) return;
    onValueChange?.(null);
    onCommitted?.(null);
    onCleared?.();
  };

  const describedIds =
    [
      hint ? `${id}-hint` : '',
      warning ? `${id}-msg-0` : '',
      error ? `${id}-msg-0` : '',
      ariaDescribedBy ?? '',
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={error}
      warning={warning}
      info={info}
      messages={messages}
      required={required}
    >
      <View style={[styles.sliderWrap, { opacity: disabled ? 0.55 : 1 }]}>
        <View style={styles.sliderMainRow}>
          {showSteppers ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Decrease ${resolvedLabel}`}
              disabled={!interactive || numericVal <= min}
              onPress={() => commitValue(numericVal - step)}
              style={[
                styles.stepBtn,
                {
                  borderColor: t.border,
                  backgroundColor: t.surface,
                  borderRadius: 6,
                },
              ]}
            >
              <SvgIcon name="minus" size={14} color={t.text} />
            </Pressable>
          ) : null}

          <View
            ref={(el) => {
              trackRef.current = el as unknown as {
                getBoundingClientRect?: () => { left: number; width: number };
              } | null;
            }}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            style={styles.trackArea}
            {...pan.panHandlers}
          >
            <View
              style={[
                styles.customRail,
                {
                  height: railHeight,
                  backgroundColor: readOnly ? t.surfaceSoft : t.border,
                  borderWidth: readOnly ? 1 : 0,
                  borderStyle: readOnly ? 'dashed' : 'solid',
                  borderColor: t.border,
                },
              ]}
            >
              <View
                style={[
                  styles.customFill,
                  {
                    left: '0%',
                    width: `${fillPct}%`,
                    backgroundColor: accent,
                  },
                ]}
              />
            </View>

            <Pressable
              ref={(el) => {
                thumbRef.current = el as unknown as { focus?: () => void } | null;
              }}
              nativeID={id}
              disabled={disabled}
              accessibilityRole="adjustable"
              accessibilityLabel={resolvedLabel}
              accessibilityValue={{
                min,
                max,
                now: value ?? min,
                text: value === null ? 'Not set' : formattedReadout,
              }}
              accessibilityActions={[
                { name: 'increment', label: 'Increase' },
                { name: 'decrement', label: 'Decrease' },
              ]}
              onAccessibilityAction={(e) => {
                if (!interactive) return;
                if (e.nativeEvent.actionName === 'increment') commitValue(numericVal + step);
                else if (e.nativeEvent.actionName === 'decrement') commitValue(numericVal - step);
              }}
              onFocus={() => {
                setThumbFocused(true);
                onFocused?.();
              }}
              onBlur={() => {
                setThumbFocused(false);
                onBlurred?.();
              }}
              {...(Platform.OS === 'web'
                ? ({
                    role: 'slider',
                    tabIndex: disabled ? undefined : 0,
                    'aria-valuemin': min,
                    'aria-valuemax': max,
                    'aria-valuenow': value ?? min,
                    'aria-valuetext': value === null ? 'Not set' : formattedReadout,
                    'aria-required': required || undefined,
                    'aria-readonly': readOnly || undefined,
                    'aria-disabled': disabled || undefined,
                    'aria-invalid': isInvalid || undefined,
                    'aria-describedby': describedIds,
                    onKeyDown: (e: WebKeyEvent) => {
                      if (!interactive) return;
                      const next = resolveSliderKeyStepValue(e.key, value, min, max, step);
                      if (next === null) return;
                      e.preventDefault();
                      onValueChange?.(next);
                      onCommitted?.(next);
                    },
                  } as object)
                : {})}
              style={[
                styles.thumbHit,
                {
                  left: `${fillPct}%`,
                  marginLeft: -22,
                },
              ]}
            >
              <View
                style={[
                  styles.thumbKnob,
                  {
                    width: thumbVisualSize,
                    height: thumbVisualSize,
                    borderRadius: thumbVisualSize / 2,
                    borderColor: accent,
                    backgroundColor: t.surface,
                    shadowColor: t.text,
                    outlineWidth: thumbFocused && Platform.OS === 'web' ? 3 : 0,
                    outlineColor: thumbFocused && Platform.OS === 'web' ? t.focus : undefined,
                    outlineStyle: thumbFocused && Platform.OS === 'web' ? 'solid' : undefined,
                  } as object,
                ]}
              />
            </Pressable>
          </View>

          {showSteppers ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Increase ${resolvedLabel}`}
              disabled={!interactive || numericVal >= max}
              onPress={() => commitValue(numericVal + step)}
              style={[
                styles.stepBtn,
                {
                  borderColor: t.border,
                  backgroundColor: t.surface,
                  borderRadius: 6,
                },
              ]}
            >
              <SvgIcon name="plus" size={14} color={t.text} />
            </Pressable>
          ) : null}

          {resolvedShowValue ? (
            <View
              style={[
                styles.valueBadge,
                {
                  backgroundColor: t.surfaceSoft,
                  borderColor: isInvalid ? t.danger : warning ? t.warning : t.border,
                  borderRadius: 6,
                },
              ]}
            >
              <Text
                style={[
                  {
                    fontSize: t.textSm,
                    fontWeight: fontWeight(t.weightBold),
                    color: value === null ? t.textMuted : t.text,
                    fontFamily: fontFamily(t),
                  },
                  Platform.OS === 'web'
                    ? ({ fontVariantNumeric: 'tabular-nums' } as object)
                    : { fontVariant: ['tabular-nums'] },
                ]}
              >
                {formattedReadout}
              </Text>
            </View>
          ) : null}

          {clearable && value !== null && interactive ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${clearLabel} ${resolvedLabel}`}
              onPress={handleClear}
              style={[
                styles.iconBtn,
                {
                  borderColor: t.border,
                  backgroundColor: t.surface,
                  borderRadius: 6,
                },
              ]}
            >
              <SvgIcon name="close" size={14} color={t.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {marks.length > 0 ? (
          <View style={styles.marksTrackRow}>
            {marks.map((mark) => {
              const pct = sliderValuePercent(mark.value, min, max);
              const active = value !== null && Math.abs(numericVal - mark.value) < 1e-6;
              return (
                <Pressable
                  key={mark.value}
                  accessibilityRole="button"
                  accessibilityLabel={`Set ${resolvedLabel} to ${mark.label ?? mark.value}`}
                  disabled={!interactive}
                  onPress={() => commitValue(mark.value)}
                  style={[
                    styles.markPositionedHit,
                    {
                      left: `${pct}%`,
                      transform: [
                        {
                          translateX: pct <= 2 ? 0 : pct >= 98 ? -28 : -14,
                        },
                      ],
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: t.textXs,
                      fontWeight: fontWeight(active ? t.weightBold : t.weightRegular),
                      color: active ? accent : t.textMuted,
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {mark.label ?? mark.value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </FieldChrome>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. EmrRangeSlider
// ─────────────────────────────────────────────────────────────

export interface EmrRangeSliderProps {
  readonly value?: readonly [number, number] | null;
  readonly onValueChange?: (value: readonly [number, number] | null) => void;
  readonly onCommitted?: (value: readonly [number, number] | null) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly minDistance?: number;
  readonly precision?: number;
  readonly unit?: string;
  readonly marks?: readonly EmrSliderMark[];
  readonly showValue?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly tone?: EmrTone | 'neutral';
  readonly clearable?: boolean;
  readonly clearLabel?: string;
  readonly onCleared?: () => void;
  readonly onFocused?: () => void;
  readonly onBlurred?: () => void;
  readonly label?: string;
  readonly ariaLabel?: string;
  readonly labelHidden?: boolean;
  readonly hint?: string;
  readonly error?: string;
  readonly lowError?: string;
  readonly highError?: string;
  readonly invalid?: boolean;
  readonly warning?: string;
  readonly info?: string;
  readonly messages?: readonly FieldValidationLine[];
  readonly ariaDescribedBy?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly controlId?: string;
}

export function EmrRangeSlider({
  value = [0, 100],
  onValueChange,
  onCommitted,
  min = 0,
  max = 100,
  step = 1,
  minDistance = 0,
  precision,
  unit = '',
  marks = [],
  showValue = true,
  size = 'md',
  tone = 'neutral',
  clearable = false,
  clearLabel = 'Clear',
  onCleared,
  onFocused,
  onBlurred,
  label,
  ariaLabel,
  labelHidden = false,
  hint,
  error,
  lowError,
  highError,
  invalid = false,
  warning,
  info,
  messages,
  ariaDescribedBy,
  required,
  disabled = false,
  readOnly = false,
  controlId,
}: EmrRangeSliderProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-range-slider-${reactId}`;

  const interactive = !disabled && !readOnly;
  const pair: readonly [number, number] = value
    ? clampRangeSliderPair(value[0], value[1], min, max, step, minDistance)
    : [min, max];

  const [low, high] = pair;
  const lowPct = sliderValuePercent(low, min, max);
  const highPct = sliderValuePercent(high, min, max);
  const resolvedPrecision = precision ?? countSliderStepDecimals(step);
  const lowText = formatSliderValue(low, unit, resolvedPrecision);
  const highText = formatSliderValue(high, unit, resolvedPrecision);
  const readoutText =
    value === null
      ? '—'
      : `${formatSliderValue(low, '', resolvedPrecision)} – ${formatSliderValue(high, unit, resolvedPrecision)}`;

  const resolvedLabel = ariaLabel ?? label ?? 'Range slider';
  const groupError = error ?? lowError ?? highError;
  const isGroupInvalid = Boolean(invalid || groupError);
  const isLowInvalid = Boolean(invalid || error || lowError);
  const isHighInvalid = Boolean(invalid || error || highError);
  const accent = isGroupInvalid
    ? t.danger
    : warning
      ? t.warning
      : tone !== 'neutral'
        ? toneColors(t, tone).color
        : t.primary;
  const railHeight = size === 'sm' ? 4 : size === 'lg' ? 8 : 6;
  const thumbVisualSize = size === 'sm' ? 18 : size === 'lg' ? 24 : 20;

  const [trackWidth, setTrackWidth] = useState(0);
  const [activeThumb, setActiveThumb] = useState<'low' | 'high'>('low');
  const [focusedThumb, setFocusedThumb] = useState<'low' | 'high' | null>(null);
  const trackRef = useRef<{ getBoundingClientRect?: () => { left: number; width: number } } | null>(null);
  const lowRef = useRef<{ focus?: () => void } | null>(null);
  const highRef = useRef<{ focus?: () => void } | null>(null);
  const draggingThumb = useRef<'low' | 'high'>('low');
  const startOffset = useRef(0);
  const lastCommitted = useRef<readonly [number, number] | null>(value);
  const groupFocused = useRef(false);

  const live = useRef({
    min,
    max,
    step,
    minDistance,
    trackWidth,
    interactive,
    pair,
    lowPct,
    highPct,
    onValueChange,
    onCommitted,
  });
  live.current = {
    min,
    max,
    step,
    minDistance,
    trackWidth,
    interactive,
    pair,
    lowPct,
    highPct,
    onValueChange,
    onCommitted,
  };

  const resolveOffsetX = (
    ne: { clientX?: number; pageX?: number; locationX?: number },
    fallback: number,
  ): number => {
    const node = trackRef.current;
    if (node && typeof node.getBoundingClientRect === 'function') {
      const rect = node.getBoundingClientRect();
      const clientX =
        typeof ne.clientX === 'number'
          ? ne.clientX
          : typeof ne.pageX === 'number'
            ? ne.pageX
            : undefined;
      if (clientX !== undefined && rect.width > 0) {
        live.current.trackWidth = rect.width;
        return clientX - rect.left;
      }
    }
    return fallback;
  };

  const emitFromOffset = (offsetX: number, thumb: 'low' | 'high') => {
    const c = live.current;
    const width = c.trackWidth > 0 ? c.trackWidth : 1;
    const frac = Math.max(0, Math.min(1, offsetX / width));
    const raw = c.min + frac * (c.max - c.min);
    const next = clampRangeSliderPair(
      thumb === 'low' ? raw : c.pair[0],
      thumb === 'high' ? raw : c.pair[1],
      c.min,
      c.max,
      c.step,
      c.minDistance,
      thumb,
    );
    lastCommitted.current = next;
    c.onValueChange?.(next);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => live.current.interactive,
      onMoveShouldSetPanResponder: () => live.current.interactive,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const ne = e.nativeEvent as unknown as {
          clientX?: number;
          pageX?: number;
          locationX?: number;
        };
        const offsetX = resolveOffsetX(ne, ne.locationX ?? 0);
        startOffset.current = offsetX;
        const width = live.current.trackWidth > 0 ? live.current.trackWidth : 1;
        const frac = Math.max(0, Math.min(1, offsetX / width));
        const chosen = resolveClosestRangeThumb(frac, live.current.lowPct, live.current.highPct);
        draggingThumb.current = chosen;
        setActiveThumb(chosen);
        (chosen === 'low' ? lowRef.current : highRef.current)?.focus?.();
        emitFromOffset(offsetX, chosen);
      },
      onPanResponderMove: (e, g) => {
        const ne = e.nativeEvent as unknown as {
          clientX?: number;
          pageX?: number;
          locationX?: number;
        };
        emitFromOffset(resolveOffsetX(ne, startOffset.current + g.dx), draggingThumb.current);
      },
      onPanResponderRelease: () => {
        live.current.onCommitted?.(lastCommitted.current);
      },
      onPanResponderTerminate: () => {
        live.current.onCommitted?.(lastCommitted.current);
      },
    }),
  ).current;

  const commitThumb = (nextLow: number, nextHigh: number, moved: 'low' | 'high') => {
    if (!interactive) return;
    const clamped = clampRangeSliderPair(
      nextLow,
      nextHigh,
      min,
      max,
      step,
      minDistance,
      moved,
    );
    setActiveThumb(moved);
    onValueChange?.(clamped);
    onCommitted?.(clamped);
  };

  const handleClear = () => {
    if (!interactive) return;
    onValueChange?.(null);
    onCommitted?.(null);
    onCleared?.();
  };

  const lowAriaMax = clampSliderValue(high - Math.max(0, minDistance), min, max, step);
  const highAriaMin = clampSliderValue(low + Math.max(0, minDistance), min, max, step);
  const describedIds =
    [
      hint ? `${id}-hint` : '',
      warning ? `${id}-msg-0` : '',
      groupError ? `${id}-msg-0` : '',
      ariaDescribedBy ?? '',
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={groupError}
      warning={warning}
      info={info}
      messages={messages}
      required={required}
    >
      <View
        nativeID={id}
        role="group"
        aria-label={resolvedLabel}
        style={[styles.sliderWrap, { opacity: disabled ? 0.55 : 1 }]}
        {...(Platform.OS === 'web'
          ? ({
              onFocusCapture: () => {
                if (!groupFocused.current) {
                  groupFocused.current = true;
                  onFocused?.();
                }
              },
              onBlurCapture: (e: { currentTarget?: { contains?: (n: unknown) => boolean }; relatedTarget?: unknown }) => {
                const related = e.relatedTarget;
                if (!related || (e.currentTarget?.contains && !e.currentTarget.contains(related))) {
                  groupFocused.current = false;
                  onBlurred?.();
                }
              },
            } as object)
          : {})}
      >
        <View style={styles.sliderMainRow}>
          <View
            ref={(el) => {
              trackRef.current = el as unknown as {
                getBoundingClientRect?: () => { left: number; width: number };
              } | null;
            }}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            style={styles.trackArea}
            {...pan.panHandlers}
          >
            <View
              style={[
                styles.customRail,
                {
                  height: railHeight,
                  backgroundColor: readOnly ? t.surfaceSoft : t.border,
                  borderWidth: readOnly ? 1 : 0,
                  borderStyle: readOnly ? 'dashed' : 'solid',
                  borderColor: t.border,
                },
              ]}
            >
              <View
                style={[
                  styles.customFill,
                  {
                    left: `${lowPct}%`,
                    width: `${Math.max(0, highPct - lowPct)}%`,
                    backgroundColor: accent,
                  },
                ]}
              />
            </View>

            <Pressable
              ref={(el) => {
                lowRef.current = el as unknown as { focus?: () => void } | null;
              }}
              nativeID={`${id}-low`}
              disabled={disabled}
              accessibilityRole="adjustable"
              accessibilityLabel={`${resolvedLabel} minimum`}
              accessibilityValue={{
                min,
                max: lowAriaMax,
                now: low,
                text: value === null ? 'Not set' : lowText,
              }}
              accessibilityActions={[
                { name: 'increment', label: 'Increase minimum' },
                { name: 'decrement', label: 'Decrease minimum' },
              ]}
              onAccessibilityAction={(e) => {
                if (!interactive) return;
                if (e.nativeEvent.actionName === 'increment') commitThumb(low + step, high, 'low');
                else if (e.nativeEvent.actionName === 'decrement') commitThumb(low - step, high, 'low');
              }}
              onFocus={() => {
                setActiveThumb('low');
                setFocusedThumb('low');
              }}
              onBlur={() => setFocusedThumb((prev) => (prev === 'low' ? null : prev))}
              {...(Platform.OS === 'web'
                ? ({
                    role: 'slider',
                    tabIndex: disabled ? undefined : 0,
                    dataSet: { thumb: 'low' },
                    'aria-valuemin': min,
                    'aria-valuemax': lowAriaMax,
                    'aria-valuenow': low,
                    'aria-valuetext': value === null ? 'Not set' : lowText,
                    'aria-required': required || undefined,
                    'aria-readonly': readOnly || undefined,
                    'aria-disabled': disabled || undefined,
                    'aria-invalid': isLowInvalid || undefined,
                    'aria-describedby': describedIds,
                    onKeyDown: (e: WebKeyEvent) => {
                      if (!interactive) return;
                      const next = resolveRangeThumbKeyValue(
                        'low',
                        e.key,
                        pair,
                        min,
                        max,
                        step,
                        minDistance,
                      );
                      if (!next) return;
                      e.preventDefault();
                      onValueChange?.(next);
                      onCommitted?.(next);
                    },
                  } as object)
                : {})}
              style={[
                styles.thumbHit,
                {
                  left: `${lowPct}%`,
                  marginLeft: -22,
                  zIndex: activeThumb === 'low' ? 4 : 2,
                },
              ]}
            >
              <View
                style={[
                  styles.thumbKnob,
                  {
                    width: thumbVisualSize,
                    height: thumbVisualSize,
                    borderRadius: thumbVisualSize / 2,
                    borderColor: accent,
                    backgroundColor: t.surface,
                    shadowColor: t.text,
                    outlineWidth: focusedThumb === 'low' && Platform.OS === 'web' ? 3 : 0,
                    outlineColor: focusedThumb === 'low' && Platform.OS === 'web' ? t.focus : undefined,
                    outlineStyle: focusedThumb === 'low' && Platform.OS === 'web' ? 'solid' : undefined,
                  } as object,
                ]}
              />
            </Pressable>

            <Pressable
              ref={(el) => {
                highRef.current = el as unknown as { focus?: () => void } | null;
              }}
              nativeID={`${id}-high`}
              disabled={disabled}
              accessibilityRole="adjustable"
              accessibilityLabel={`${resolvedLabel} maximum`}
              accessibilityValue={{
                min: highAriaMin,
                max,
                now: high,
                text: value === null ? 'Not set' : highText,
              }}
              accessibilityActions={[
                { name: 'increment', label: 'Increase maximum' },
                { name: 'decrement', label: 'Decrease maximum' },
              ]}
              onAccessibilityAction={(e) => {
                if (!interactive) return;
                if (e.nativeEvent.actionName === 'increment') commitThumb(low, high + step, 'high');
                else if (e.nativeEvent.actionName === 'decrement') commitThumb(low, high - step, 'high');
              }}
              onFocus={() => {
                setActiveThumb('high');
                setFocusedThumb('high');
              }}
              onBlur={() => setFocusedThumb((prev) => (prev === 'high' ? null : prev))}
              {...(Platform.OS === 'web'
                ? ({
                    role: 'slider',
                    tabIndex: disabled ? undefined : 0,
                    dataSet: { thumb: 'high' },
                    'aria-valuemin': highAriaMin,
                    'aria-valuemax': max,
                    'aria-valuenow': high,
                    'aria-valuetext': value === null ? 'Not set' : highText,
                    'aria-required': required || undefined,
                    'aria-readonly': readOnly || undefined,
                    'aria-disabled': disabled || undefined,
                    'aria-invalid': isHighInvalid || undefined,
                    'aria-describedby': describedIds,
                    onKeyDown: (e: WebKeyEvent) => {
                      if (!interactive) return;
                      const next = resolveRangeThumbKeyValue(
                        'high',
                        e.key,
                        pair,
                        min,
                        max,
                        step,
                        minDistance,
                      );
                      if (!next) return;
                      e.preventDefault();
                      onValueChange?.(next);
                      onCommitted?.(next);
                    },
                  } as object)
                : {})}
              style={[
                styles.thumbHit,
                {
                  left: `${highPct}%`,
                  marginLeft: -22,
                  zIndex: activeThumb === 'high' ? 4 : 3,
                },
              ]}
            >
              <View
                style={[
                  styles.thumbKnob,
                  {
                    width: thumbVisualSize,
                    height: thumbVisualSize,
                    borderRadius: thumbVisualSize / 2,
                    borderColor: accent,
                    backgroundColor: t.surface,
                    shadowColor: t.text,
                    outlineWidth: focusedThumb === 'high' && Platform.OS === 'web' ? 3 : 0,
                    outlineColor: focusedThumb === 'high' && Platform.OS === 'web' ? t.focus : undefined,
                    outlineStyle: focusedThumb === 'high' && Platform.OS === 'web' ? 'solid' : undefined,
                  } as object,
                ]}
              />
            </Pressable>
          </View>

          {showValue ? (
            <View
              style={[
                styles.valueBadge,
                {
                  backgroundColor: t.surfaceSoft,
                  borderColor: isGroupInvalid ? t.danger : warning ? t.warning : t.border,
                  borderRadius: 6,
                },
              ]}
            >
              <Text
                style={[
                  {
                    fontSize: t.textSm,
                    fontWeight: fontWeight(t.weightBold),
                    color: value === null ? t.textMuted : t.text,
                    fontFamily: fontFamily(t),
                  },
                  Platform.OS === 'web'
                    ? ({ fontVariantNumeric: 'tabular-nums' } as object)
                    : { fontVariant: ['tabular-nums'] },
                ]}
              >
                {readoutText}
              </Text>
            </View>
          ) : null}

          {clearable && value !== null && interactive ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${clearLabel} ${resolvedLabel}`}
              onPress={handleClear}
              style={[
                styles.iconBtn,
                {
                  borderColor: t.border,
                  backgroundColor: t.surface,
                  borderRadius: 6,
                },
              ]}
            >
              <SvgIcon name="close" size={14} color={t.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {marks.length > 0 ? (
          <View style={styles.marksTrackRow}>
            {marks.map((mark) => {
              const pct = sliderValuePercent(mark.value, min, max);
              const active =
                value !== null &&
                (Math.abs(low - mark.value) < 1e-6 || Math.abs(high - mark.value) < 1e-6);
              return (
                <Pressable
                  key={mark.value}
                  accessibilityRole="button"
                  accessibilityLabel={`Jump nearest thumb of ${resolvedLabel} to ${mark.label ?? mark.value}`}
                  disabled={!interactive}
                  onPress={() => {
                    const thumb = resolveClosestRangeThumb(pct / 100, lowPct, highPct);
                    commitThumb(
                      thumb === 'low' ? mark.value : low,
                      thumb === 'high' ? mark.value : high,
                      thumb,
                    );
                  }}
                  style={[
                    styles.markPositionedHit,
                    {
                      left: `${pct}%`,
                      transform: [
                        {
                          translateX: pct <= 2 ? 0 : pct >= 98 ? -28 : -14,
                        },
                      ],
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: t.textXs,
                      fontWeight: fontWeight(active ? t.weightBold : t.weightRegular),
                      color: active ? accent : t.textMuted,
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {mark.label ?? mark.value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </FieldChrome>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. EmrMaskedInput
// ─────────────────────────────────────────────────────────────

export interface EmrMaskedInputProps {
  readonly value?: string | null;
  readonly onValueChange?: (value: string | null) => void;
  readonly mask: string;
  readonly definitions?: Readonly<Record<string, string>>;
  readonly uppercase?: boolean;
  readonly unmask?: boolean;
  readonly placeholder?: string;
  readonly showMaskHint?: boolean;
  readonly inputMode?: 'text' | 'numeric' | 'tel' | 'decimal';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly variant?: EmrControlVariant;
  readonly clearable?: boolean;
  readonly clearLabel?: string;
  readonly onCleared?: () => void;
  readonly onCompleted?: (emitted: string, result: EmrMaskResult) => void;
  readonly onFocused?: () => void;
  readonly onBlurred?: () => void;
  readonly onSubmitted?: (value: string | null) => void;
  readonly label?: string;
  readonly ariaLabel?: string;
  readonly labelHidden?: boolean;
  readonly hint?: string;
  readonly error?: string;
  readonly invalid?: boolean;
  readonly warning?: string;
  readonly info?: string;
  readonly messages?: readonly FieldValidationLine[];
  readonly ariaDescribedBy?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly controlId?: string;
}

export function EmrMaskedInput({
  value = null,
  onValueChange,
  mask,
  definitions,
  uppercase = false,
  unmask = false,
  placeholder,
  showMaskHint = false,
  inputMode,
  size = 'md',
  variant = 'outline',
  clearable = false,
  clearLabel = 'Clear',
  onCleared,
  onCompleted,
  onFocused,
  onBlurred,
  onSubmitted,
  label,
  ariaLabel,
  labelHidden = false,
  hint,
  error,
  invalid = false,
  warning,
  info,
  messages,
  ariaDescribedBy,
  required,
  disabled = false,
  readOnly = false,
  controlId,
}: EmrMaskedInputProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-masked-${reactId}`;

  const interactive = !disabled && !readOnly;
  const maskOptions: EmrMaskOptions = { uppercase, definitions };
  const formatted = applyInputMask(value ?? '', mask, maskOptions);
  const monoFont = RESOLVED_MONO_FONT(t.fontMono);
  const resolvedInputMode = inputMode ?? inferMaskInputMode(mask, definitions);
  const isInvalid = Boolean(invalid || error);
  const resolvedLabel = ariaLabel ?? label ?? mask;
  const minHeight = size === 'lg' ? 48 : Math.max(44, t.controlHeight);
  const inputRef = useRef<{
    setSelectionRange?: (start: number, end: number) => void;
    selectionStart?: number | null;
    focus?: () => void;
  } | null>(null);

  const handleTextChange = (raw: string) => {
    if (!interactive) return;
    const rawCaret = inputRef.current?.selectionStart ?? raw.length;
    const edited = editMaskedInputWithCaret(formatted.masked, raw, rawCaret, mask, maskOptions);
    const emitted = unmask ? edited.result.unmasked : edited.result.masked;
    onValueChange?.(emitted.length > 0 ? emitted : null);
    if (Platform.OS === 'web' && typeof inputRef.current?.setSelectionRange === 'function') {
      const targetCaret = edited.caret;
      queueMicrotask(() => {
        inputRef.current?.setSelectionRange?.(targetCaret, targetCaret);
      });
    }
    if (edited.result.complete && emitted.length > 0) {
      onCompleted?.(emitted, edited.result);
    }
  };

  const handleClear = () => {
    if (!interactive) return;
    onValueChange?.(null);
    onCleared?.();
    inputRef.current?.focus?.();
  };

  const describedIds =
    [
      hint ? `${id}-hint` : '',
      warning ? `${id}-msg-0` : '',
      error ? `${id}-msg-0` : '',
      ariaDescribedBy ?? '',
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={error}
      warning={warning}
      info={info}
      messages={messages}
      required={required}
    >
      <View
        style={[
          styles.maskedBox,
          {
            minHeight,
            backgroundColor: readOnly
              ? t.surfaceSoft
              : variant === 'filled'
                ? t.surfaceSoft
                : variant === 'subtle'
                  ? 'transparent'
                  : t.surface,
            borderColor: isInvalid
              ? t.danger
              : warning
                ? t.warning
                : variant === 'filled'
                  ? 'transparent'
                  : t.border,
            borderWidth: variant === 'subtle' ? 0 : 1,
            borderBottomWidth: 1,
            borderRadius: variant === 'subtle' ? 0 : 8,
            borderStyle: readOnly ? 'dashed' : 'solid',
            opacity: disabled ? 0.55 : 1,
          },
        ]}
      >
        <TextInput
          ref={(el) => {
            inputRef.current = el as unknown as {
              setSelectionRange?: (start: number, end: number) => void;
              selectionStart?: number | null;
              focus?: () => void;
            } | null;
          }}
          nativeID={id}
          value={formatted.masked}
          editable={interactive}
          placeholder={placeholder ?? mask}
          placeholderTextColor={t.textMuted}
          inputMode={resolvedInputMode}
          keyboardType={resolvedInputMode === 'numeric' ? 'number-pad' : 'default'}
          accessibilityLabel={resolvedLabel}
          onChangeText={handleTextChange}
          onFocus={onFocused}
          onBlur={onBlurred}
          onSubmitEditing={() => {
            if (!interactive) return;
            const emitted = unmask ? formatted.unmasked : formatted.masked;
            onSubmitted?.(emitted.length > 0 ? emitted : null);
          }}
          {...(Platform.OS === 'web'
            ? ({
                'aria-invalid': isInvalid || undefined,
                'aria-required': required || undefined,
                'aria-readonly': readOnly || undefined,
                'aria-describedby': describedIds,
                onKeyDown: (e: WebKeyEvent) => {
                  if (e.key === 'Enter' && interactive) {
                    const emitted = unmask ? formatted.unmasked : formatted.masked;
                    onSubmitted?.(emitted.length > 0 ? emitted : null);
                  }
                },
              } as object)
            : {})}
          style={[
            styles.maskedInput,
            {
              fontSize: t.textMd,
              color: t.text,
              fontFamily: monoFont,
            },
            Platform.OS === 'web'
              ? ({ fontVariantNumeric: 'tabular-nums' } as object)
              : { fontVariant: ['tabular-nums'] },
          ]}
        />

        {showMaskHint ? (
          <Text
            aria-hidden
            style={{
              fontSize: t.text2xs,
              color: formatted.complete ? t.success : t.textMuted,
              fontFamily: monoFont,
              paddingHorizontal: 6,
            }}
          >
            {mask}
          </Text>
        ) : null}

        {clearable && formatted.masked.length > 0 && interactive ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${clearLabel} ${resolvedLabel}`}
            onPress={handleClear}
            style={styles.iconHit}
          >
            <SvgIcon name="close" size={15} color={t.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </FieldChrome>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. EmrOtpInput
// ─────────────────────────────────────────────────────────────

export interface EmrOtpInputProps {
  readonly value?: string | null;
  readonly onValueChange?: (value: string) => void;
  readonly length?: number;
  readonly numericOnly?: boolean;
  readonly secret?: boolean;
  readonly uppercase?: boolean;
  readonly separatorAfter?: number | readonly number[];
  readonly size?: 'sm' | 'md' | 'lg';
  readonly variant?: EmrControlVariant;
  readonly clearable?: boolean;
  readonly clearLabel?: string;
  readonly onCleared?: () => void;
  readonly onCompleted?: (value: string) => void;
  readonly onFocused?: () => void;
  readonly onBlurred?: () => void;
  readonly onSubmitted?: (value: string) => void;
  readonly label?: string;
  readonly ariaLabel?: string;
  readonly labelHidden?: boolean;
  readonly hint?: string;
  readonly error?: string;
  readonly invalid?: boolean;
  readonly warning?: string;
  readonly info?: string;
  readonly messages?: readonly FieldValidationLine[];
  readonly ariaDescribedBy?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly controlId?: string;
}

export function EmrOtpInput({
  value = '',
  onValueChange,
  length = 6,
  numericOnly = true,
  secret = false,
  uppercase = false,
  separatorAfter,
  size = 'md',
  variant = 'outline',
  clearable = false,
  clearLabel = 'Clear',
  onCleared,
  onCompleted,
  onFocused,
  onBlurred,
  onSubmitted,
  label,
  ariaLabel,
  labelHidden = false,
  hint,
  error,
  invalid = false,
  warning,
  info,
  messages,
  ariaDescribedBy,
  required,
  disabled = false,
  readOnly = false,
  controlId,
}: EmrOtpInputProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-otp-${reactId}`;

  const safeLen = Math.max(1, Math.min(12, Math.floor(length)));
  const slots = normalizeOtpSlots(value, safeLen);
  const slotRefs = useRef<Array<{ focus?: () => void } | null>>([]);
  const [focusedSlot, setFocusedSlot] = useState<number | null>(null);
  const groupFocused = useRef(false);
  const clearedViaChangeRef = useRef<number | null>(null);

  const interactive = !disabled && !readOnly;
  const monoFont = RESOLVED_MONO_FONT(t.fontMono);
  const isInvalid = Boolean(invalid || error);
  const resolvedLabel = ariaLabel ?? label ?? 'Verification code';
  const slotWidth = size === 'lg' ? 48 : 44;
  const slotHeight = size === 'sm' ? 44 : size === 'lg' ? 52 : 48;

  const hasSeparatorAfter = (idx: number): boolean => {
    if (separatorAfter === undefined) return false;
    const oneBased = idx + 1;
    if (oneBased >= safeLen) return false;
    return Array.isArray(separatorAfter)
      ? separatorAfter.includes(oneBased)
      : separatorAfter === oneBased;
  };

  const focusSlot = (idx: number) => {
    const bounded = Math.max(0, Math.min(safeLen - 1, idx));
    setFocusedSlot(bounded);
    slotRefs.current[bounded]?.focus?.();
  };

  const handleSlotEdit = (slotIdx: number, rawTyped: string) => {
    if (!interactive) return;
    const prevChar = slots[slotIdx] ?? '';
    const delta = extractOtpTypedInput(prevChar, rawTyped);
    if (delta === '' && prevChar !== '') {
      clearedViaChangeRef.current = slotIdx;
    }
    const res = applyOtpSlotEdit(value, slotIdx, delta, safeLen, numericOnly, { uppercase });
    onValueChange?.(res.value);
    if (delta.length > 0) {
      focusSlot(res.nextFocusIndex);
    }
    if (res.completed) {
      onCompleted?.(res.value);
    }
  };

  const handleKeyAction = (slotIdx: number, key: string) => {
    if (key === 'Backspace' || key === 'Delete') {
      if (!interactive) return;
      if (key === 'Backspace' && clearedViaChangeRef.current === slotIdx) {
        clearedViaChangeRef.current = null;
        return;
      }
      const resAction = resolveOtpClearSlot(slots, slotIdx, key);
      if (resAction) {
        const res = applyOtpSlotEdit(value, resAction.targetIndex, '', safeLen, numericOnly, {
          uppercase,
        });
        onValueChange?.(res.value);
        focusSlot(resAction.nextFocusIndex);
      }
    } else if (key === 'ArrowLeft' && slotIdx > 0) {
      focusSlot(slotIdx - 1);
    } else if (key === 'ArrowRight' && slotIdx < safeLen - 1) {
      focusSlot(slotIdx + 1);
    } else if (key === 'Home') {
      focusSlot(0);
    } else if (key === 'End') {
      focusSlot(safeLen - 1);
    } else if (key === 'Enter' && interactive) {
      onSubmitted?.(value ?? '');
    }
  };

  const handleClear = () => {
    if (!interactive) return;
    onValueChange?.('');
    onCleared?.();
    focusSlot(0);
  };

  const describedIds =
    [
      hint ? `${id}-hint` : '',
      warning ? `${id}-msg-0` : '',
      error ? `${id}-msg-0` : '',
      ariaDescribedBy ?? '',
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={error}
      warning={warning}
      info={info}
      messages={messages}
      required={required}
    >
      <View
        nativeID={id}
        role="group"
        aria-label={resolvedLabel}
        style={styles.otpRow}
        {...(Platform.OS === 'web'
          ? ({
              onFocusCapture: () => {
                if (!groupFocused.current) {
                  groupFocused.current = true;
                  onFocused?.();
                }
              },
              onBlurCapture: (e: { currentTarget?: { contains?: (n: unknown) => boolean }; relatedTarget?: unknown }) => {
                const related = e.relatedTarget;
                if (!related || (e.currentTarget?.contains && !e.currentTarget.contains(related))) {
                  groupFocused.current = false;
                  onBlurred?.();
                }
              },
            } as object)
          : {})}
      >
        {slots.map((ch, idx) => {
          const isFocused = focusedSlot === idx;
          return (
            <View key={`${id}-slot-wrap-${idx}`} style={styles.otpSlotGroup}>
              <TextInput
                ref={(el) => {
                  slotRefs.current[idx] = el;
                }}
                nativeID={`${id}-slot-${idx}`}
                value={ch}
                editable={interactive}
                secureTextEntry={secret}
                inputMode={numericOnly ? 'numeric' : 'text'}
                keyboardType={numericOnly ? 'number-pad' : 'default'}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={safeLen}
                accessibilityLabel={`${resolvedLabel} digit ${idx + 1} of ${safeLen}`}
                onFocus={() => setFocusedSlot(idx)}
                onBlur={() => {
                  if (focusedSlot === idx) setFocusedSlot(null);
                }}
                onChangeText={(typed) => handleSlotEdit(idx, typed)}
                onKeyPress={(e) => {
                  const key = (e.nativeEvent as { key?: string }).key;
                  if (key) handleKeyAction(idx, key);
                }}
                onSubmitEditing={() => {
                  if (interactive) onSubmitted?.(value ?? '');
                }}
                {...(Platform.OS === 'web'
                  ? ({
                      autoComplete: 'one-time-code',
                      'aria-invalid': isInvalid || undefined,
                      'aria-required': required || undefined,
                      'aria-readonly': readOnly || undefined,
                      'aria-describedby': describedIds,
                    } as object)
                  : {})}
                style={[
                  styles.otpSlot,
                  {
                    minWidth: slotWidth,
                    width: slotWidth,
                    minHeight: slotHeight,
                    fontSize: size === 'sm' ? t.textMd : t.textLg,
                    fontWeight: fontWeight(t.weightBold),
                    color: t.text,
                    backgroundColor: readOnly
                      ? t.surfaceSoft
                      : variant === 'filled'
                        ? t.surfaceSoft
                        : variant === 'subtle'
                          ? 'transparent'
                          : t.surface,
                    borderColor: isInvalid
                      ? t.danger
                      : warning
                        ? t.warning
                        : isFocused
                          ? t.focus
                          : ch
                            ? t.primary
                            : variant === 'filled'
                              ? 'transparent'
                              : t.border,
                    borderWidth: variant === 'subtle' ? 0 : 1,
                    borderBottomWidth: 1,
                    borderRadius: variant === 'subtle' ? 0 : 8,
                    borderStyle: readOnly ? 'dashed' : 'solid',
                    fontFamily: monoFont,
                    opacity: disabled ? 0.55 : 1,
                  },
                  Platform.OS === 'web'
                    ? ({ fontVariantNumeric: 'tabular-nums' } as object)
                    : { fontVariant: ['tabular-nums'] },
                ]}
              />
              {hasSeparatorAfter(idx) ? (
                <Text
                  aria-hidden
                  style={{
                    color: t.textMuted,
                    fontSize: t.textMd,
                    fontWeight: fontWeight(t.weightBold),
                    paddingHorizontal: 2,
                  }}
                >
                  –
                </Text>
              ) : null}
            </View>
          );
        })}

        {clearable && slots.some((s) => s.length > 0) && interactive ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${clearLabel} ${resolvedLabel}`}
            onPress={handleClear}
            style={[
              styles.iconBtn,
              {
                borderColor: t.border,
                backgroundColor: t.surface,
                borderRadius: 6,
              },
            ]}
          >
            <SvgIcon name="close" size={14} color={t.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </FieldChrome>
  );
}

const styles = StyleSheet.create({
  sliderWrap: {
    gap: 6,
  },
  sliderMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    minWidth: 44,
    minHeight: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    minWidth: 44,
    minHeight: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackArea: {
    flex: 1,
    minWidth: 120,
    minHeight: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  customRail: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
  },
  customFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  thumbHit: {
    position: 'absolute',
    top: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbKnob: {
    borderWidth: 2.5,
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  valueBadge: {
    minWidth: 56,
    minHeight: 44,
    paddingHorizontal: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marksTrackRow: {
    position: 'relative',
    minHeight: 28,
  },
  markPositionedHit: {
    position: 'absolute',
    top: 0,
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 4,
    gap: 4,
  },
  maskedInput: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 6,
  },
  iconHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  otpSlotGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  otpSlot: {
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
