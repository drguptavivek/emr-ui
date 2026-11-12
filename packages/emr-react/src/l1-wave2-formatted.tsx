'use client';

import type {
  EmrMaskResult,
  EmrOtpEditResult,
  EmrSliderMark,
} from '@drguptavivek/emr-controller';
import { createElement, useId, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SvgIcon } from './icons';
import { FieldChrome, type FieldValidationLine } from './l1-field-chrome';
import {
  applyInputMask,
  applyOtpSlotEdit,
  clampRangeSliderPair,
  clampSliderValue,
  normalizeOtpSlots,
} from './l1-wave2.logic';
import { EmrButton } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

export type { EmrMaskResult, EmrOtpEditResult, EmrSliderMark };

// ─────────────────────────────────────────────────────────────
// 1. EmrSlider
// ─────────────────────────────────────────────────────────────

export interface EmrSliderProps {
  readonly value?: number | null;
  readonly onValueChange?: (value: number | null) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly unit?: string;
  readonly marks?: readonly EmrSliderMark[];
  readonly showValueInput?: boolean;
  readonly clearable?: boolean;
  readonly onCleared?: () => void;
  readonly label?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly warning?: string;
  readonly info?: string;
  readonly messages?: readonly FieldValidationLine[];
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly controlId?: string;
}

export function EmrSlider({
  value = null,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  marks = [],
  showValueInput = true,
  clearable = false,
  onCleared,
  label,
  hint,
  error,
  warning,
  info,
  messages,
  required,
  disabled = false,
  readOnly = false,
  controlId,
}: EmrSliderProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-slider-${reactId}`;

  const interactive = !disabled && !readOnly;
  const numericVal = value !== null && Number.isFinite(value) ? clampSliderValue(value, min, max, step) : min;
  const span = Math.max(1e-6, max - min);
  const fillPct = Math.max(0, Math.min(100, ((numericVal - min) / span) * 100));

  const commitValue = (nextRaw: number) => {
    if (!interactive) return;
    const clamped = clampSliderValue(nextRaw, min, max, step);
    onValueChange?.(clamped);
  };

  const handleClear = () => {
    if (!interactive) return;
    onValueChange?.(null);
    onCleared?.();
  };

  return (
    <FieldChrome
      controlId={id}
      label={label}
      hint={hint}
      error={error}
      warning={warning}
      info={info}
      messages={messages}
      required={required}
    >
      <View style={[styles.sliderWrap, { opacity: disabled ? 0.55 : 1 }]}>
        <View style={styles.sliderMainRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${label ?? 'value'}`}
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

          <View style={styles.trackArea}>
            {Platform.OS === 'web' ? (
              createElement('input', {
                id,
                type: 'range',
                min,
                max,
                step,
                value: numericVal,
                disabled: !interactive,
                'aria-label': label ?? 'Slider',
                'aria-valuemin': min,
                'aria-valuemax': max,
                'aria-valuenow': numericVal,
                onChange: (e: { target?: { value?: string } }) => {
                  const parsed = Number(e.target?.value);
                  if (Number.isFinite(parsed)) {
                    commitValue(parsed);
                  }
                },
                style: {
                  width: '100%',
                  height: 36,
                  cursor: interactive ? 'pointer' : 'default',
                  accentColor: t.primary,
                },
              })
            ) : (
              <View
                style={[
                  styles.nativeTrack,
                  {
                    backgroundColor: t.surfaceSoft,
                    borderColor: t.border,
                    borderRadius: 6,
                  },
                ]}
              >
                <View
                  style={{
                    width: `${fillPct}%`,
                    height: '100%',
                    backgroundColor: t.primary,
                    borderRadius: 6,
                  }}
                />
              </View>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Increase ${label ?? 'value'}`}
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

          {showValueInput ? (
            <View
              style={[
                styles.valueBadge,
                {
                  backgroundColor: t.surfaceSoft,
                  borderColor: t.border,
                  borderRadius: 6,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: t.textSm,
                  fontWeight: fontWeight(t.weightBold),
                  color: value === null ? t.textMuted : t.text,
                  fontFamily: fontFamily(t),
                }}
              >
                {value === null ? '—' : `${numericVal}${unit ? ` ${unit}` : ''}`}
              </Text>
            </View>
          ) : null}

          {clearable && value !== null && interactive ? (
            <EmrButton label="Clear" variant="ghost" onPress={handleClear} />
          ) : null}
        </View>

        {marks.length > 0 ? (
          <View style={styles.marksRow}>
            {marks.map((mark) => {
              const active = value !== null && Math.abs(numericVal - mark.value) < 1e-6;
              return (
                <Pressable
                  key={mark.value}
                  accessibilityRole="button"
                  accessibilityLabel={`Set ${mark.label ?? mark.value}`}
                  disabled={!interactive}
                  onPress={() => commitValue(mark.value)}
                  style={styles.markHit}
                >
                  <Text
                    style={{
                      fontSize: t.textXs,
                      fontWeight: fontWeight(active ? t.weightBold : t.weightRegular),
                      color: active ? t.primary : t.textMuted,
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {mark.label ?? `${mark.value}${unit ? ` ${unit}` : ''}`}
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
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly minDistance?: number;
  readonly unit?: string;
  readonly marks?: readonly EmrSliderMark[];
  readonly clearable?: boolean;
  readonly onCleared?: () => void;
  readonly label?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly warning?: string;
  readonly info?: string;
  readonly messages?: readonly FieldValidationLine[];
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly controlId?: string;
}

export function EmrRangeSlider({
  value = null,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  minDistance = 0,
  unit,
  marks = [],
  clearable = false,
  onCleared,
  label,
  hint,
  error,
  warning,
  info,
  messages,
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

  const commitThumb = (nextLow: number, nextHigh: number, moved: 'low' | 'high') => {
    if (!interactive) return;
    const clamped = clampRangeSliderPair(
      nextLow,
      nextHigh,
      min,
      max,
      step,
      minDistance,
      moved
    );
    onValueChange?.(clamped);
  };

  const handleClear = () => {
    if (!interactive) return;
    onValueChange?.(null);
    onCleared?.();
  };

  return (
    <FieldChrome
      controlId={id}
      label={label}
      hint={hint}
      error={error}
      warning={warning}
      info={info}
      messages={messages}
      required={required}
    >
      <View style={[styles.sliderWrap, { opacity: disabled ? 0.55 : 1 }]}>
        <View style={styles.rangeEndpointsRow}>
          <View style={styles.thumbControlGroup}>
            <Text
              style={{
                fontSize: t.textXs,
                color: t.textMuted,
                fontFamily: fontFamily(t),
              }}
            >
              Min
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease lower bound"
              disabled={!interactive}
              onPress={() => commitThumb(low - step, high, 'low')}
              style={[
                styles.stepBtn,
                { borderColor: t.border, backgroundColor: t.surface, borderRadius: 6 },
              ]}
            >
              <SvgIcon name="minus" size={14} color={t.text} />
            </Pressable>
            <Text
              style={{
                fontSize: t.textSm,
                fontWeight: fontWeight(t.weightBold),
                color: t.text,
                fontFamily: fontFamily(t),
                minWidth: 48,
                textAlign: 'center',
              }}
            >
              {`${low}${unit ? ` ${unit}` : ''}`}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase lower bound"
              disabled={!interactive}
              onPress={() => commitThumb(low + step, high, 'low')}
              style={[
                styles.stepBtn,
                { borderColor: t.border, backgroundColor: t.surface, borderRadius: 6 },
              ]}
            >
              <SvgIcon name="plus" size={14} color={t.text} />
            </Pressable>
          </View>

          <Text
            style={{
              fontSize: t.textSm,
              color: t.textMuted,
              fontFamily: fontFamily(t),
            }}
          >
            –
          </Text>

          <View style={styles.thumbControlGroup}>
            <Text
              style={{
                fontSize: t.textXs,
                color: t.textMuted,
                fontFamily: fontFamily(t),
              }}
            >
              Max
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease upper bound"
              disabled={!interactive}
              onPress={() => commitThumb(low, high - step, 'high')}
              style={[
                styles.stepBtn,
                { borderColor: t.border, backgroundColor: t.surface, borderRadius: 6 },
              ]}
            >
              <SvgIcon name="minus" size={14} color={t.text} />
            </Pressable>
            <Text
              style={{
                fontSize: t.textSm,
                fontWeight: fontWeight(t.weightBold),
                color: t.text,
                fontFamily: fontFamily(t),
                minWidth: 48,
                textAlign: 'center',
              }}
            >
              {`${high}${unit ? ` ${unit}` : ''}`}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase upper bound"
              disabled={!interactive}
              onPress={() => commitThumb(low, high + step, 'high')}
              style={[
                styles.stepBtn,
                { borderColor: t.border, backgroundColor: t.surface, borderRadius: 6 },
              ]}
            >
              <SvgIcon name="plus" size={14} color={t.text} />
            </Pressable>
          </View>

          {clearable && value !== null && interactive ? (
            <EmrButton label="Clear" variant="ghost" onPress={handleClear} />
          ) : null}
        </View>

        {Platform.OS === 'web' ? (
          <View style={styles.dualWebRangeRow}>
            {createElement('input', {
              type: 'range',
              min,
              max,
              step,
              value: low,
              disabled: !interactive,
              'aria-label': `${label ?? 'Range'} minimum`,
              onChange: (e: { target?: { value?: string } }) => {
                const parsed = Number(e.target?.value);
                if (Number.isFinite(parsed)) commitThumb(parsed, high, 'low');
              },
              style: { flex: 1, height: 32, accentColor: t.primary },
            })}
            {createElement('input', {
              type: 'range',
              min,
              max,
              step,
              value: high,
              disabled: !interactive,
              'aria-label': `${label ?? 'Range'} maximum`,
              onChange: (e: { target?: { value?: string } }) => {
                const parsed = Number(e.target?.value);
                if (Number.isFinite(parsed)) commitThumb(low, parsed, 'high');
              },
              style: { flex: 1, height: 32, accentColor: t.primary },
            })}
          </View>
        ) : null}

        {marks.length > 0 ? (
          <View style={styles.marksRow}>
            {marks.map((mark) => (
              <Text
                key={mark.value}
                style={{
                  fontSize: t.textXs,
                  color: t.textMuted,
                  fontFamily: fontFamily(t),
                }}
              >
                {mark.label ?? `${mark.value}${unit ? ` ${unit}` : ''}`}
              </Text>
            ))}
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
  readonly unmask?: boolean;
  readonly placeholder?: string;
  readonly clearable?: boolean;
  readonly onCleared?: () => void;
  readonly onCompleted?: (result: EmrMaskResult) => void;
  readonly label?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly warning?: string;
  readonly info?: string;
  readonly messages?: readonly FieldValidationLine[];
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly controlId?: string;
}

export function EmrMaskedInput({
  value = null,
  onValueChange,
  mask,
  unmask = false,
  placeholder,
  clearable = true,
  onCleared,
  onCompleted,
  label,
  hint,
  error,
  warning,
  info,
  messages,
  required,
  disabled = false,
  readOnly = false,
  controlId,
}: EmrMaskedInputProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-masked-${reactId}`;

  const interactive = !disabled && !readOnly;
  const formatted = applyInputMask(value ?? '', mask);
  const monoFont = Platform.OS === 'web' ? t.fontMono : undefined;

  const handleTextChange = (raw: string) => {
    if (!interactive) return;
    const res = applyInputMask(raw, mask);
    const emitted = unmask ? res.unmasked : res.masked;
    onValueChange?.(emitted.length > 0 ? emitted : null);
    if (res.complete) {
      onCompleted?.(res);
    }
  };

  const handleClear = () => {
    if (!interactive) return;
    onValueChange?.(null);
    onCleared?.();
  };

  return (
    <FieldChrome
      controlId={id}
      label={label}
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
            minHeight: Math.max(44, t.controlHeight),
            backgroundColor: readOnly ? t.surfaceSoft : t.surface,
            borderColor: error ? t.danger : t.border,
            borderRadius: 8,
            opacity: disabled ? 0.55 : 1,
          },
        ]}
      >
        <TextInput
          value={formatted.masked}
          editable={interactive}
          placeholder={placeholder ?? mask}
          placeholderTextColor={t.textMuted}
          accessibilityLabel={label ?? mask}
          onChangeText={handleTextChange}
          style={[
            styles.maskedInput,
            {
              fontSize: t.textSm,
              color: t.text,
              fontFamily: monoFont,
            },
          ]}
        />

        <Text
          style={{
            fontSize: t.text2xs,
            color: formatted.complete ? t.success : t.textMuted,
            fontFamily: monoFont,
            paddingHorizontal: 6,
          }}
        >
          {mask}
        </Text>

        {clearable && formatted.masked.length > 0 && interactive ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label ?? 'masked input'}`}
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
  readonly clearable?: boolean;
  readonly onCleared?: () => void;
  readonly onCompleted?: (value: string) => void;
  readonly label?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly warning?: string;
  readonly info?: string;
  readonly messages?: readonly FieldValidationLine[];
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
  clearable = true,
  onCleared,
  onCompleted,
  label,
  hint,
  error,
  warning,
  info,
  messages,
  required,
  disabled = false,
  readOnly = false,
  controlId,
}: EmrOtpInputProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-otp-${reactId}`;

  const safeLen = Math.max(1, Math.floor(length));
  const slots = normalizeOtpSlots(value, safeLen);
  const slotRefs = useRef<Array<{ focus?: () => void } | null>>([]);
  const [focusedSlot, setFocusedSlot] = useState<number | null>(null);

  const interactive = !disabled && !readOnly;
  const monoFont = Platform.OS === 'web' ? t.fontMono : undefined;

  const focusSlot = (idx: number) => {
    const bounded = Math.max(0, Math.min(safeLen - 1, idx));
    setFocusedSlot(bounded);
    slotRefs.current[bounded]?.focus?.();
  };

  const handleSlotEdit = (slotIdx: number, typed: string) => {
    if (!interactive) return;
    const res = applyOtpSlotEdit(value, slotIdx, typed, safeLen, numericOnly);
    onValueChange?.(res.value);
    focusSlot(res.nextFocusIndex);
    if (res.completed) {
      onCompleted?.(res.value);
    }
  };

  const handleBackspace = (slotIdx: number) => {
    if (!interactive) return;
    if (slots[slotIdx]) {
      handleSlotEdit(slotIdx, '');
    } else if (slotIdx > 0) {
      const res = applyOtpSlotEdit(value, slotIdx - 1, '', safeLen, numericOnly);
      onValueChange?.(res.value);
      focusSlot(slotIdx - 1);
    }
  };

  const handleClear = () => {
    if (!interactive) return;
    onValueChange?.('');
    onCleared?.();
    focusSlot(0);
  };

  return (
    <FieldChrome
      controlId={id}
      label={label}
      hint={hint}
      error={error}
      warning={warning}
      info={info}
      messages={messages}
      required={required}
    >
      <View style={styles.otpRow}>
        {slots.map((ch, idx) => {
          const isFocused = focusedSlot === idx;
          return (
            <TextInput
              key={`${id}-slot-${idx}`}
              ref={(el) => {
                slotRefs.current[idx] = el;
              }}
              value={ch}
              editable={interactive}
              secureTextEntry={secret}
              keyboardType={numericOnly ? 'number-pad' : 'default'}
              maxLength={safeLen}
              accessibilityLabel={`${label ?? 'Verification code'} digit ${idx + 1} of ${safeLen}`}
              onFocus={() => setFocusedSlot(idx)}
              onBlur={() => {
                if (focusedSlot === idx) setFocusedSlot(null);
              }}
              onChangeText={(typed) => handleSlotEdit(idx, typed)}
              onKeyPress={(e) => {
                const key = (e.nativeEvent as { key?: string }).key;
                if (key === 'Backspace') {
                  handleBackspace(idx);
                } else if (key === 'ArrowLeft' && idx > 0) {
                  focusSlot(idx - 1);
                } else if (key === 'ArrowRight' && idx < safeLen - 1) {
                  focusSlot(idx + 1);
                }
              }}
              style={[
                styles.otpSlot,
                {
                  minWidth: 44,
                  minHeight: 48,
                  fontSize: t.textLg,
                  fontWeight: fontWeight(t.weightBold),
                  color: t.text,
                  backgroundColor: readOnly ? t.surfaceSoft : t.surface,
                  borderColor: error
                    ? t.danger
                    : isFocused
                      ? t.focus
                      : ch
                        ? t.primary
                        : t.border,
                  borderRadius: 8,
                  fontFamily: monoFont,
                  opacity: disabled ? 0.55 : 1,
                },
              ]}
            />
          );
        })}

        {clearable && Boolean(value && value.length > 0) && interactive ? (
          <EmrButton label="Clear" variant="ghost" onPress={handleClear} />
        ) : null}
      </View>
    </FieldChrome>
  );
}

const styles = StyleSheet.create({
  sliderWrap: {
    gap: 8,
  },
  sliderMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    minWidth: 44,
    minHeight: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackArea: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  nativeTrack: {
    height: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  valueBadge: {
    minWidth: 64,
    minHeight: 44,
    paddingHorizontal: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  markHit: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  rangeEndpointsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  thumbControlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dualWebRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  maskedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 4,
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
  otpSlot: {
    borderWidth: 1.5,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
