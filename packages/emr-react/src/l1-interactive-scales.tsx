'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  EmrLikertOption,
  EmrLikertSize,
  EmrTone,
  EmrVasAnchorsProp,
  EmrVasOrientation,
  EmrVasPrecision,
  EmrVasSize,
} from '@drguptavivek/emr-controller';
import {
  EMR_VAS_TRACK_INSET_PX,
  buildLikertPoints,
  canMutateLikert,
  canMutateVas,
  formatVasValue,
  resolveLikertAnchors,
  resolveLikertTabStopIndex,
  resolveNextLikertValue,
  resolveVasAnchors,
  resolveVasKeyValue,
  resolveVasStep,
  resolveVasTicks,
  vasPercent,
  vasValueFromOffset,
} from './l1-controller.logic';
import { SvgIcon } from './icons';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';
import { interactiveLabelDefaults, webProps, type InteractiveLabels, type WebKeyEvent } from './l1-interactive-shared';

type PressState = PressableStateCallbackType & { focused?: boolean };

export interface EmrScaleAnchor {
  /** Value this label is anchored to (typically min or max). */
  value: number;
  label: string;
  /** Read by screen readers in place of the visible label. */
  assistiveLabel?: string;
}

interface ScaleFrameProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  labels: InteractiveLabels;
}

function Legend({ label, required }: { label: string; required?: boolean; labels: InteractiveLabels }) {
  const t = useEmrTheme();
  return (
    <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
      {label}{required ? <Text style={{ color: t.danger }}> *</Text> : null}
    </Text>
  );
}

function Messages({ error, warning, hint, disabled }: { error?: string; warning?: string; hint?: string; disabled?: boolean }) {
  const t = useEmrTheme();
  const msg = error || (!disabled ? (warning || hint) : undefined);
  if (!msg) return null;
  const color = error ? t.danger : warning ? t.warning : t.textMuted;
  return (
    <Text role={error ? 'alert' : undefined} aria-live="polite"
      style={{ color, fontSize: t.textSm, fontFamily: fontFamily(t) }}>{msg}</Text>
  );
}

/**
 * L1 Likert / numeric scale: radiogroup of pips. The selected pip's colour comes from the
 * controller-supplied `tone`; selection is also shown by a heavier border and bold text.
 */
export function EmrLikert({
  controlId,
  name,
  label = '',
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  labelHidden,
  hint,
  warning,
  error,
  invalid,
  min = 0,
  max = 10,
  step = 1,
  size = 'md',
  fullWidth,
  value,
  anchors = [],
  options,
  showOptionLabels = false,
  disabled = false,
  readOnly = false,
  required = false,
  clearable = false,
  clearLabel = 'Clear',
  tone,
  optionTones,
  onValueChange,
  onCleared,
  onFocus,
  onBlur,
  labels,
}: {
  controlId?: string;
  name?: string;
  label?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  labelHidden?: boolean;
  hint?: string;
  warning?: string;
  error?: string;
  invalid?: boolean;
  min?: number;
  max?: number;
  step?: number;
  size?: EmrLikertSize;
  fullWidth?: boolean;
  value: number | null | undefined;
  anchors?: readonly EmrScaleAnchor[];
  options?: readonly EmrLikertOption[];
  showOptionLabels?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  tone?: EmrTone;
  optionTones?: Readonly<Record<number, EmrTone>>;
  onValueChange: { bivarianceHack(value: number | null): void }['bivarianceHack'];
  onCleared?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  labels?: Partial<InteractiveLabels>;
}) {
  const t = useEmrTheme();
  const l = { ...interactiveLabelDefaults, ...labels };
  const generated = useId();
  const id = controlId ?? generated;
  const pipRefs = useRef<Array<{ focus?: () => void } | null>>([]);
  const points = useMemo(
    () => buildLikertPoints({ min, max, step, value: value ?? null, anchors, options, showOptionLabels, tone, optionTones }),
    [min, max, step, value, anchors, options, showOptionLabels, tone, optionTones],
  );
  const anchorsSummary = useMemo(() => resolveLikertAnchors(points, anchors), [points, anchors]);
  const stopIdx = resolveLikertTabStopIndex(points, value ?? null, disabled);
  const interactive = canMutateLikert(disabled, readOnly);
  const canClear = Boolean(clearable && value != null && interactive);
  const isInvalid = Boolean(error || invalid);
  const isWarning = !isInvalid && Boolean(warning);
  const minTarget = size === 'lg' ? 48 : Math.max(44, t.controlHeight);
  const pipFontSize = size === 'sm' ? t.textMd : t.textLg;

  const nudgeStep = (delta: number) => {
    if (!interactive) return;
    const next = resolveNextLikertValue(points, value ?? null, delta > 0 ? 'ArrowRight' : 'ArrowLeft');
    if (next !== null && next !== value) onValueChange(next);
  };

  const onKeyDown = (e: WebKeyEvent) => {
    const next = resolveNextLikertValue(points, value ?? null, e.key);
    if (next === null) return;
    e.preventDefault();
    const nextIdx = points.findIndex((p) => p.value === next);
    if (nextIdx >= 0) pipRefs.current[nextIdx]?.focus?.();
    if (interactive && next !== value) onValueChange(next);
  };

  const describedIds = labelHidden
    ? ariaDescribedBy
    : [hint ? `${id}-hint` : '', warning ? `${id}-warning` : '', error ? `${id}-error` : '', ariaDescribedBy ?? '']
        .filter(Boolean)
        .join(' ') || undefined;

  return (
    <View
      nativeID={id}
      role="radiogroup"
      aria-label={ariaLabel || (ariaLabelledBy ? undefined : label) || undefined}
      aria-labelledby={ariaLabel ? undefined : ariaLabelledBy}
      aria-required={required || undefined}
      aria-readonly={readOnly || undefined}
      aria-disabled={disabled || undefined}
      aria-invalid={isInvalid || undefined}
      aria-describedby={describedIds}
      style={[styles.frame, fullWidth && { width: '100%' }]}
    >
      {!labelHidden || canClear ? (
        <View style={styles.headerRow}>
          {!labelHidden ? (
            <Legend label={label} required={required} labels={l} />
          ) : (
            <View />
          )}
          {canClear ? (
            <Pressable
              role="button"
              aria-label={`${clearLabel} ${label || 'selection'}`}
              onPress={() => {
                if (!interactive) return;
                onValueChange(null);
                onCleared?.();
              }}
              style={({ pressed, focused }: PressState) => [
                styles.clearBtn,
                focusRing(t, focused),
                {
                  minHeight: Math.max(44, t.controlHeight),
                  minWidth: 44,
                  flexDirection: 'row',
                  gap: 6,
                  borderColor: t.border,
                  backgroundColor: pressed ? t.surfaceRaised : t.surfaceSoft,
                },
              ]}
            >
              <SvgIcon name="close" size={14} color={t.textMuted} />
              <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                {clearLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.track, fullWidth && { width: '100%' }]}>
        {points.map((point, idx) => {
          const selected = point.selected;
          const colors = selected && point.tone ? toneColors(t, point.tone) : null;
          return (
            <Pressable
              key={point.value}
              ref={(el) => {
                pipRefs.current[idx] = el;
              }}
              role="radio"
              aria-checked={selected}
              aria-label={point.assistiveLabel}
              aria-disabled={disabled || undefined}
              aria-readonly={readOnly || undefined}
              disabled={disabled}
              onFocus={onFocus}
              onBlur={onBlur}
              onPress={interactive ? () => onValueChange(point.value) : undefined}
              accessibilityActions={[{ name: 'increment', label: l.increment }, { name: 'decrement', label: l.decrement }]}
              onAccessibilityAction={e => { if (e.nativeEvent.actionName === 'increment') nudgeStep(1); else if (e.nativeEvent.actionName === 'decrement') nudgeStep(-1); }}
              {...webProps({
                tabIndex: idx === stopIdx ? 0 : -1,
                'data-name': name || undefined,
                onKeyDown,
              })}
              style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
                styles.pip,
                focusRing(t, focused),
                {
                  minHeight: minTarget,
                  minWidth: minTarget,
                  flex: fullWidth ? 1 : undefined,
                  paddingHorizontal: point.description || point.label.length > 3 ? 12 : size === 'sm' ? 8 : size === 'lg' ? 12 : 10,
                  paddingVertical: point.description ? 6 : 0,
                  gap: 2,
                  borderColor: isInvalid
                    ? t.danger
                    : isWarning
                      ? t.warning
                      : selected
                        ? colors?.color ?? t.primary
                        : hovered && interactive
                          ? t.primaryBorder
                          : t.border,
                  borderWidth: selected ? 2 : 1.5,
                  borderStyle: readOnly ? 'dashed' : 'solid',
                  backgroundColor: selected
                    ? colors?.backgroundColor ?? t.primarySoft
                    : readOnly
                      ? t.surfaceSoft
                      : hovered && interactive
                        ? t.surfaceRaised
                        : t.surface,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              <Text
                aria-hidden
                style={[
                  {
                    color: selected ? colors?.color ?? t.primaryContrast : t.text,
                    fontSize: point.description || point.label.length > 3 ? t.textSm : pipFontSize,
                    fontFamily: fontFamily(t),
                    fontWeight: fontWeight(selected || !point.description ? t.weightBold : t.weightMedium),
                  },
                  Platform.OS === 'web' ? ({ fontVariantNumeric: 'tabular-nums' } as unknown as object) : null,
                ]}
              >
                {point.label}
              </Text>
              {point.description ? (
                <Text
                  aria-hidden
                  style={{
                    color: t.textMuted,
                    fontSize: t.textXs,
                    fontFamily: fontFamily(t),
                    textAlign: 'center',
                  }}
                >
                  {point.description}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {anchorsSummary.start || anchorsSummary.mid || anchorsSummary.end ? (
        <View aria-hidden style={styles.anchors}>
          <Text style={[styles.anchor, { color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }]}>{anchorsSummary.start?.label}</Text>
          {anchorsSummary.mid ? (
            <Text style={[styles.anchor, { color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }]}>{anchorsSummary.mid.label}</Text>
          ) : null}
          <Text style={[styles.anchor, styles.anchorEnd, { color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }]}>{anchorsSummary.end?.label}</Text>
        </View>
      ) : null}
      {!labelHidden && (hint || warning || error) ? (
        <View style={{ gap: 2 }}>
          {hint ? (
            <Text nativeID={`${id}-hint`} style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
              {hint}
            </Text>
          ) : null}
          {warning ? (
            <Text nativeID={`${id}-warning`} role="status" style={{ color: t.warning, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
              {warning}
            </Text>
          ) : null}
          {error ? (
            <Text nativeID={`${id}-error`} role="alert" style={{ color: t.danger, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
              {error}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const TRACK_THICKNESS = 6;
const THUMB = 30;
const VERTICAL_LENGTH = 240;

/**
 * L1 visual analogue scale: a continuous/decimal ruler marked by tap/drag (responder props, no dependencies) or,
 * on web, mouse/touch/keyboard. Native uses accessibility increment/decrement actions. It derives no
 * severity: anchors, tone and `valueText` come from the controller.
 */
export function EmrVas({
  controlId,
  label,
  ariaLabel,
  labelHidden,
  hint,
  warning,
  error,
  invalid,
  min = 0,
  max = 100,
  value,
  step: stepProp,
  precision = 'integer',
  majorInterval = 10,
  minorInterval,
  orientation = 'horizontal',
  size = 'md',
  anchors = [],
  showValue = true,
  unmarkedLabel = 'Unmarked',
  readOnly,
  disabled,
  required,
  clearable,
  clearLabel = 'Clear',
  tone,
  valueText,
  onValueChange,
  onCommitted,
  onCleared,
  onFocus,
  onBlur,
  ariaLabelledBy,
  ariaDescribedBy,
  labels,
}: Omit<ScaleFrameProps, 'labels'> & {
  controlId?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  labelHidden?: boolean;
  warning?: string;
  invalid?: boolean;
  min?: number;
  max?: number;
  value: number | null | undefined;
  /** Snap granularity; defaults to 1 (integer) or 0.1/0.5 (decimal). Pass 0 for raw continuous. */
  step?: number;
  precision?: EmrVasPrecision;
  majorInterval?: number;
  minorInterval?: number;
  orientation?: EmrVasOrientation;
  size?: EmrVasSize;
  anchors?: EmrVasAnchorsProp;
  showValue?: boolean;
  unmarkedLabel?: string;
  readOnly?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  tone?: EmrTone;
  /** Spoken value, e.g. "72 out of 100". */
  valueText?: string;
  onValueChange: (value: number | null) => void;
  onCommitted?: (value: number | null) => void;
  onCleared?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  labels?: Partial<InteractiveLabels>;
}) {
  const t = useEmrTheme();
  const autoId = useId();
  const resolvedId = controlId ?? autoId;
  const l = { ...interactiveLabelDefaults, ...labels };
  const vertical = orientation === 'vertical';
  const interactive = canMutateVas(Boolean(disabled), Boolean(readOnly));
  const isInvalid = Boolean(invalid || error);
  const canClear = Boolean(clearable && value != null && interactive);
  const span = Math.abs(max - min);
  const step = resolveVasStep(min, max, stepProp, precision);
  const effectiveMinor = minorInterval ?? (precision === 'integer' && span <= 20 ? 1 : span <= 20 ? 0.5 : 2);
  const [length, setLength] = useState(0);
  const [focused, setFocused] = useState(false);
  const trackRef = useRef<{ getBoundingClientRect?: () => { left: number; top: number; width: number; height: number } } | null>(null);
  const start = useRef(0);
  // PanResponder is built once; it reads the latest props through this ref.
  const live = useRef({ min, max, step, vertical, length, interactive, value, onValueChange, onCommitted });
  live.current = { min, max, step, vertical, length, interactive, value, onValueChange, onCommitted };

  const resolveWebOffset = (nativeEvent: { clientX?: number; pageX?: number; clientY?: number; pageY?: number }, fallback: number): number => {
    const node = trackRef.current;
    if (node && typeof node.getBoundingClientRect === 'function') {
      const rect = node.getBoundingClientRect();
      const clientX = typeof nativeEvent.clientX === 'number' ? nativeEvent.clientX : typeof nativeEvent.pageX === 'number' ? nativeEvent.pageX : undefined;
      const clientY = typeof nativeEvent.clientY === 'number' ? nativeEvent.clientY : typeof nativeEvent.pageY === 'number' ? nativeEvent.pageY : undefined;
      if (!live.current.vertical && clientX !== undefined && rect.width > 0) {
        live.current.length = rect.width;
        return clientX - rect.left;
      }
      if (live.current.vertical && clientY !== undefined && rect.height > 0) {
        live.current.length = rect.height;
        return clientY - rect.top;
      }
    }
    return fallback;
  };

  const emit = (offset: number) => {
    const c = live.current;
    const next = vasValueFromOffset(offset, c.length, c.min, c.max, c.step, c.vertical, EMR_VAS_TRACK_INSET_PX);
    if (next !== c.value) c.onValueChange(next);
    return next;
  };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => live.current.interactive,
    onMoveShouldSetPanResponder: () => live.current.interactive,
    // A scroll parent must not steal a drag that is already marking the scale.
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: e => {
      const ne = e.nativeEvent as unknown as { clientX?: number; pageX?: number; clientY?: number; pageY?: number };
      const fallback = live.current.vertical ? e.nativeEvent.locationY : e.nativeEvent.locationX;
      start.current = resolveWebOffset(ne, fallback);
      emit(start.current);
    },
    onPanResponderMove: (e, g) => {
      const ne = e.nativeEvent as unknown as { clientX?: number; pageX?: number; clientY?: number; pageY?: number };
      const fallback = start.current + (live.current.vertical ? g.dy : g.dx);
      emit(resolveWebOffset(ne, fallback));
    },
    onPanResponderRelease: () => {
      live.current.onCommitted?.(live.current.value ?? null);
    },
    onPanResponderTerminate: () => {
      live.current.onCommitted?.(live.current.value ?? null);
    },
  })).current;
  const ticks = useMemo(() => resolveVasTicks(min, max, majorInterval, effectiveMinor), [min, max, majorInterval, effectiveMinor]);
  const percent = value == null ? null : vasPercent(value, min, max);
  const accent = tone ? toneColors(t, tone).color : t.primary;
  const resolvedAnchors = useMemo(() => resolveVasAnchors(anchors, min, max), [anchors, min, max]);
  const change = (key: string) => {
    const next = resolveVasKeyValue(key, value ?? null, { min, max, step, majorInterval });
    if (next !== null) {
      if (next !== value) onValueChange(next);
      onCommitted?.(next);
    }
    return next !== null;
  };
  const pos = (p: number) => (vertical ? { bottom: `${p}%` as const } : { left: `${p}%` as const });
  const trackHeight = size === 'sm' ? 48 : size === 'lg' ? 68 : 56;
  const verticalLength = size === 'sm' ? 200 : size === 'lg' ? 280 : VERTICAL_LENGTH;
  const verticalWidth = size === 'sm' ? 64 : size === 'lg' ? 84 : 72;
  const formattedValue = formatVasValue(value, step, unmarkedLabel);
  const trackBorder = isInvalid ? t.danger : warning ? t.warning : t.border;
  const hasAnchors = Boolean(resolvedAnchors.minLabel || resolvedAnchors.midLabel || resolvedAnchors.maxLabel);
  return (
    <View style={styles.frame} nativeID={resolvedId}>
      <View style={styles.headerRow}>
        {labelHidden ? <View /> : <Legend label={label} required={required} labels={l} />}
        <View style={styles.headerRight}>
          {showValue ? (
            <View style={[styles.valueBadge, { borderColor: t.border, backgroundColor: t.surfaceSoft, borderRadius: 999 }]}>
              <Text style={{ color: value == null ? t.textMuted : accent, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                {formattedValue}
              </Text>
            </View>
          ) : null}
          {canClear ? (
            <Pressable
              role="button"
              aria-label={`Clear ${ariaLabel || label}`}
              onPress={() => {
                onValueChange(null);
                onCommitted?.(null);
                onCleared?.();
              }}
              style={({ pressed, focused: btnFocused }: PressState) => [
                styles.clearBtn,
                focusRing(t, btnFocused),
                {
                  minHeight: Math.max(44, t.controlHeight),
                  minWidth: 44,
                  borderColor: t.border,
                  backgroundColor: pressed ? t.surfaceRaised : t.surfaceSoft,
                },
              ]}
            >
              <SvgIcon name="close" size={12} color={t.textMuted} />
              <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                {clearLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={[styles.vasFrame, vertical && styles.vasFrameVertical]}>
        <View
          ref={el => { trackRef.current = el as unknown as { getBoundingClientRect?: () => { left: number; top: number; width: number; height: number } } | null; }}
          nativeID={resolvedId}
          role="slider"
          aria-label={ariaLabel || (ariaLabelledBy ? undefined : label)}
          aria-labelledby={ariaLabel ? undefined : ariaLabelledBy}
          aria-describedby={ariaDescribedBy || (!labelHidden && (error || warning || hint) ? `${resolvedId}-message` : undefined)}
          aria-required={required || undefined}
          aria-orientation={orientation}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value ?? undefined}
          aria-valuetext={valueText}
          aria-readonly={readOnly}
          aria-disabled={disabled}
          aria-invalid={isInvalid ? true : undefined}
          accessible
          accessibilityRole="adjustable"
          accessibilityValue={{ min, max, now: value ?? undefined, text: valueText }}
          accessibilityActions={[{ name: 'increment', label: l.increment }, { name: 'decrement', label: l.decrement }]}
          onAccessibilityAction={e => { if (interactive) change(e.nativeEvent.actionName); }}
          onLayout={e => setLength(vertical ? e.nativeEvent.layout.height : e.nativeEvent.layout.width)}
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          {...webProps({
            tabIndex: disabled ? undefined : 0,
            onKeyDown: (e: WebKeyEvent) => { if (interactive && change(e.key)) e.preventDefault(); },
          })}
          {...pan.panHandlers}
          style={[
            vertical ? { width: verticalWidth, height: verticalLength } : { height: trackHeight, width: '100%' },
            {
              borderWidth: 1,
              borderColor: trackBorder,
              borderRadius: 8,
              backgroundColor: t.surface,
              opacity: disabled ? 0.5 : 1,
            },
            focusRing(t, focused),
          ]}
        >
          <View
            pointerEvents="none"
            style={vertical
              ? { position: 'absolute', top: EMR_VAS_TRACK_INSET_PX, bottom: EMR_VAS_TRACK_INSET_PX, left: 0, right: 0 }
              : { position: 'absolute', left: EMR_VAS_TRACK_INSET_PX, right: EMR_VAS_TRACK_INSET_PX, top: 0, bottom: 0 }}
          >
            <View style={[vertical ? styles.ruleV : styles.ruleH, { backgroundColor: t.border }]} />
            {ticks.map(tick => (
              <View key={tick.value} style={[styles.tickBox, pos(tick.percent), vertical ? styles.tickBoxV : styles.tickBoxH]}>
                <View style={{ backgroundColor: tick.major ? t.text : t.textMuted, opacity: tick.major ? 1 : 0.65, ...(vertical ? { height: tick.major ? 2 : 1, width: tick.major ? 18 : 9 } : { width: tick.major ? 2 : 1, height: tick.major ? 18 : 9 }) }} />
                {tick.label !== null ? <Text style={[styles.tickLabel, { color: t.textMuted, fontSize: t.text2xs, fontFamily: fontFamily(t) }]}>{tick.label}</Text> : null}
              </View>
            ))}
            {percent !== null ? (
              <View style={[styles.thumb, pos(percent), vertical ? styles.thumbV : styles.thumbH, { backgroundColor: accent, borderColor: t.surface }]}>
                <Text style={{ color: t.surface, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{formattedValue}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {hasAnchors ? (
          <View aria-hidden style={vertical ? [styles.anchorsV, { height: verticalLength }] : styles.anchors}>
            <Text style={[styles.anchor, { color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }]}>{vertical ? resolvedAnchors.maxLabel : resolvedAnchors.minLabel}</Text>
            {resolvedAnchors.midLabel ? (
              <Text style={[styles.anchor, !vertical && styles.anchorMid, { color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }]}>{resolvedAnchors.midLabel}</Text>
            ) : null}
            <Text style={[styles.anchor, !vertical && styles.anchorEnd, { color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }]}>{vertical ? resolvedAnchors.minLabel : resolvedAnchors.maxLabel}</Text>
          </View>
        ) : null}
      </View>
      <Messages error={error} warning={warning} hint={hint} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { gap: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valueBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, minHeight: 22, alignItems: 'center', justifyContent: 'center' },
  clearBtn: { flexDirection: 'row', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  track: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pip: { borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  anchors: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  anchorsV: { justifyContent: 'space-between', height: VERTICAL_LENGTH, flexShrink: 1, paddingVertical: EMR_VAS_TRACK_INSET_PX },
  anchor: { flexShrink: 1 },
  anchorMid: { textAlign: 'center' },
  anchorEnd: { textAlign: 'right' },
  vasFrame: { gap: 6 },
  vasFrameVertical: { flexDirection: 'row', gap: 12 },
  ruleH: { position: 'absolute', left: 0, right: 0, top: '50%', height: 2, marginTop: -1, borderRadius: 2 },
  ruleV: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, marginLeft: -1, borderRadius: 2 },
  tickBox: { position: 'absolute', alignItems: 'center' },
  tickBoxH: { top: '50%', marginTop: -9, width: 40, marginLeft: -20 },
  tickBoxV: { left: '50%', marginLeft: -9, flexDirection: 'row', alignItems: 'center', gap: 4, height: 20, marginBottom: -10 },
  tickLabel: { textAlign: 'center' },
  thumb: { position: 'absolute', width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  thumbH: { top: '50%', marginTop: -THUMB / 2, marginLeft: -THUMB / 2 },
  thumbV: { left: '50%', marginLeft: -THUMB / 2, marginBottom: -THUMB / 2 },
});
