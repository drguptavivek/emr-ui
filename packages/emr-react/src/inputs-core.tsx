'use client';

import { createElement, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions, type PressableStateCallbackType } from 'react-native';
import type { ClinicalFieldValue } from '@drguptavivek/emr-controller';
import { SvgIcon } from './icons';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import { numberTextOf, parseNumberDraft, sanitizeNumberText } from './typed-field.logic';
import {
  formatDate, formatTime, joinDateTime, parseDateText, parseTimeText, sameInstant, sanitizeDateText, sanitizeTimeText, splitDateTime,
  type DateDisplayFormat, type TextParse,
} from './l1-inputs.logic';

type PressState = PressableStateCallbackType & { focused?: boolean };

export type ThemedInputProps = React.ComponentProps<typeof TextInput> & { invalid?: boolean };

/** L1 text input: token styling, single crisp focus ring, invalid border. Read-only stays focusable. */
export function ThemedInput({ invalid, ...props }: ThemedInputProps) {
  const t = useEmrTheme();
  const [focused, setFocused] = useState(false);
  const lines = props.numberOfLines ?? 1;
  return (
    <TextInput
      {...props}
      {...(invalid ? ({ 'aria-invalid': true } as object) : null)}
      placeholderTextColor={t.textMuted}
      textAlignVertical={props.multiline ? 'top' : 'center'}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={[
        styles.input,
        {
          minHeight: props.multiline ? Math.max(88, lines * t.textMd * t.leadingNormal + 18) : t.controlHeight,
          borderColor: focused ? t.focus : invalid ? t.danger : t.border,
          borderWidth: 1,
          backgroundColor: props.editable === false && !props.readOnly ? t.surfaceRaised : props.readOnly ? t.surfaceSoft : t.surface,
          color: t.text,
          fontSize: t.textMd,
          fontFamily: fontFamily(t),
        },
        focusRing(t, focused),
        props.style,
      ]}
    />
  );
}

/** L1 number input: compact width with − and + stepper buttons before and after, sanitises as typed, emits number | null. */
export function NumberInput({ value, integer, unit, min, max, step, onNumber, ...props }: Omit<ThemedInputProps, 'value'> & {
  value: ClinicalFieldValue | undefined;
  integer: boolean;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  onNumber: (value: number | null) => void;
}) {
  const t = useEmrTheme();
  const external = numberTextOf(value);
  const [draft, setDraft] = useState(external);
  // A new value from the controller replaces whatever draft is on screen.
  useEffect(() => setDraft(current => (parseNumberDraft(current).complete && current !== external ? external : current)), [external]);

  const keyboardType: KeyboardTypeOptions = integer ? 'number-pad' : 'decimal-pad';
  const canEdit = props.editable !== false && !props.readOnly;
  const parsedCurrent = parseNumberDraft(draft);
  const currentNum = parsedCurrent.complete ? parsedCurrent.value : null;
  const effectiveStep = step ?? (integer ? 1 : 0.5);

  const canDec = canEdit && (min === undefined || currentNum === null || currentNum - effectiveStep >= min - 1e-9);
  const canInc = canEdit && (max === undefined || currentNum === null || currentNum + effectiveStep <= max + 1e-9);

  const nudge = (dir: -1 | 1) => {
    if (!canEdit) return;
    const base = currentNum ?? (dir > 0 ? (min ?? 0) - effectiveStep : (max ?? 0) + effectiveStep);
    let next = Number((base + dir * effectiveStep).toFixed(4));
    if (integer) next = Math.round(next);
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    setDraft(String(next));
    onNumber(next);
  };

  return (
    <View style={[styles.numberRow, { maxWidth: unit ? 260 : 200 }]}>
      <View
        style={[
          styles.stepperGroup,
          {
            minHeight: t.controlHeight,
            borderColor: props.invalid ? t.danger : t.border,
            backgroundColor: props.editable === false && !props.readOnly ? t.surfaceRaised : props.readOnly ? t.surfaceSoft : t.surface,
          },
        ]}
      >
        <Pressable
          role="button"
          aria-label="Decrease value"
          aria-disabled={!canDec}
          disabled={!canDec}
          onPress={() => nudge(-1)}
          style={({ pressed, focused }: PressState) => [
            styles.stepBtn,
            focusRing(t, focused),
            {
              width: t.controlHeight - 8,
              minHeight: t.controlHeight - 2,
              borderRightWidth: 1,
              borderColor: t.border,
              backgroundColor: pressed ? t.surfaceRaised : t.surfaceSoft,
              opacity: canDec ? 1 : 0.4,
            },
          ]}
        >
          <SvgIcon name="minus" size={14} color={t.text} />
        </Pressable>

        <ThemedInput
          {...props}
          aria-valuemin={min}
          aria-valuemax={max}
          value={draft}
          keyboardType={keyboardType}
          inputMode={integer ? 'numeric' : 'decimal'}
          style={styles.stepperInput}
          onChangeText={text => {
            const clean = sanitizeNumberText(text, integer);
            setDraft(clean);
            const parsed = parseNumberDraft(clean);
            if (parsed.complete) onNumber(parsed.value);
          }}
        />

        <Pressable
          role="button"
          aria-label="Increase value"
          aria-disabled={!canInc}
          disabled={!canInc}
          onPress={() => nudge(1)}
          style={({ pressed, focused }: PressState) => [
            styles.stepBtn,
            focusRing(t, focused),
            {
              width: t.controlHeight - 8,
              minHeight: t.controlHeight - 2,
              borderLeftWidth: 1,
              borderColor: t.border,
              backgroundColor: pressed ? t.surfaceRaised : t.surfaceSoft,
              opacity: canInc ? 1 : 0.4,
            },
          ]}
        >
          <SvgIcon name="plus" size={14} color={t.text} />
        </Pressable>
      </View>
      {unit ? (
        <Text aria-hidden style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
          {unit}
        </Text>
      ) : null}
    </View>
  );
}

/** Never skip a field silently: an unrenderable field is visible clinical data that's missing. */
export function Unsupported({ text }: { text: string }) {
  const t = useEmrTheme();
  return (
    <View role="status" style={[styles.unsupported, { borderColor: t.border }]}>
      <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{text}</Text>
    </View>
  );
}

// ---- day-first date / time text ------------------------------------------------------------

export type EmrTypedTextMode = DateDisplayFormat | 'time' | 'time-seconds';
type TextMode = EmrTypedTextMode;

const isTimeMode = (mode: TextMode): mode is 'time' | 'time-seconds' => mode === 'time' || mode === 'time-seconds';
const parseText = (text: string, mode: TextMode): TextParse =>
  isTimeMode(mode) ? parseTimeText(text, mode === 'time-seconds') : parseDateText(text, mode);
const formatText = (value: string | null, mode: TextMode) =>
  isTimeMode(mode) ? formatTime(value, mode === 'time-seconds') : formatDate(value, mode);
const valueOf = (parsed: TextParse) => (parsed.status === 'valid' ? parsed.value : null);

/**
 * Typed text bound to an ISO / HH:mm(:ss) value. Emits only on empty or a real date/time; an incomplete
 * draft stays on screen (like NumberInput) and is flagged invalid once the field loses focus.
 * Includes a compact calendar/clock picker trigger so users can either type or pick from a calendar/clock.
 */
export function EmrTypedText({ value, mode, invalid, onValueChange, ...props }: Omit<ThemedInputProps, 'value'> & {
  value: string | null;
  mode: TextMode;
  onValueChange: (value: string | null) => void;
}) {
  const t = useEmrTheme();
  const [draft, setDraft] = useState(() => formatText(value, mode));
  const [left, setLeft] = useState(false);
  const nativePickerRef = useRef<{ showPicker?: () => void; click?: () => void; focus?: () => void } | null>(null);

  // A new value from the controller replaces the draft, unless the draft is still being typed.
  useEffect(() => setDraft(current => {
    const parsed = parseText(current, mode);
    return parsed.status === 'draft' || valueOf(parsed) === value ? current : formatText(value, mode);
  }), [value, mode]);

  const isInvalid = invalid || (left && parseText(draft, mode).status === 'draft');
  const canEdit = props.editable !== false && !props.readOnly;
  const isTime = isTimeMode(mode);
  const isYearOnly = mode === 'yyyy';
  const isMonthOnly = mode === 'yyyy-mm' || mode === 'mm-yyyy';
  const maxWidth = isYearOnly ? 120 : isMonthOnly ? 168 : isTime ? (mode === 'time-seconds' ? 184 : 156) : 220;

  const openPicker = () => {
    if (!canEdit || isYearOnly) return;
    if (Platform.OS === 'web' && nativePickerRef.current) {
      if (typeof nativePickerRef.current.showPicker === 'function') {
        try {
          nativePickerRef.current.showPicker();
          return;
        } catch {
          // Fall through to click/focus
        }
      }
      nativePickerRef.current.click?.();
      nativePickerRef.current.focus?.();
    }
  };

  return (
    <View
      style={[
        styles.temporalGroup,
        {
          maxWidth,
          minHeight: t.controlHeight,
          borderColor: isInvalid ? t.danger : t.border,
          backgroundColor: props.editable === false && !props.readOnly ? t.surfaceRaised : props.readOnly ? t.surfaceSoft : t.surface,
        },
      ]}
    >
      <ThemedInput
        {...props}
        value={draft}
        keyboardType="numbers-and-punctuation"
        inputMode="numeric"
        invalid={isInvalid}
        style={styles.temporalInput}
        // Leaving the field tidies a valid entry into display form (keypad 05032026 → 05-03-2026).
        onBlur={e => {
          setLeft(true);
          setDraft(d => {
            const p = parseText(d, mode);
            return p.status === 'valid' ? formatText(p.value, mode) : d;
          });
          props.onBlur?.(e);
        }}
        onChangeText={text => {
          const clean = isTime ? sanitizeTimeText(text, mode === 'time-seconds') : sanitizeDateText(text, mode);
          setDraft(clean);
          setLeft(false);
          const parsed = parseText(clean, mode);
          if (parsed.status !== 'draft') onValueChange(valueOf(parsed));
        }}
      />
      {!isYearOnly ? (
        <Pressable
          role="button"
          aria-label={isTime ? 'Choose time' : 'Choose date'}
          aria-disabled={!canEdit}
          disabled={!canEdit}
          onPress={openPicker}
          style={({ pressed, focused }: PressState) => [
            styles.temporalBtn,
            focusRing(t, focused),
            {
              width: t.controlHeight - 8,
              minHeight: t.controlHeight - 2,
              borderLeftWidth: 1,
              borderColor: t.border,
              backgroundColor: pressed ? t.surfaceRaised : t.surfaceSoft,
              opacity: canEdit ? 1 : 0.5,
            },
          ]}
        >
          <SvgIcon name={isTime ? 'clock' : 'calendar'} size={16} color={t.textMuted} />
          {Platform.OS === 'web' && canEdit
            ? createElement('input' as unknown as React.ComponentType<Record<string, unknown>>, {
                ref: (el: unknown) => {
                  nativePickerRef.current = el as { showPicker?: () => void; click?: () => void; focus?: () => void } | null;
                },
                type: isTime ? 'time' : isMonthOnly ? 'month' : 'date',
                step: mode === 'time-seconds' ? 1 : undefined,
                value: value ?? '',
                tabIndex: -1,
                'aria-hidden': 'true',
                onChange: (e: { target?: { value?: string } }) => {
                  const raw = e?.target?.value ?? '';
                  if (!raw) {
                    setDraft('');
                    onValueChange(null);
                    return;
                  }
                  const normalized = mode === 'time-seconds' ? formatTime(raw, true) : raw;
                  setDraft(formatText(normalized, mode));
                  setLeft(false);
                  onValueChange(normalized);
                },
                style: {
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  border: 0,
                  padding: 0,
                  margin: 0,
                },
              })
            : null}
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Local date + local time pair for a UTC instant (ISO-8601 with Z). Emits only when both halves are
 * valid, otherwise null; a half-typed pair stays on screen. Display order comes from `format`.
 */
export function EmrDateTimeText({ value, format, timePrecision = 'minute', label, dateLabel, timeLabel, invalid, readOnly, editable, onFocus, onValueChange }: {
  value: string | null;
  format: DateDisplayFormat;
  timePrecision?: 'minute' | 'second';
  label: string;
  dateLabel: string;
  timeLabel: string;
  invalid?: boolean;
  readOnly?: boolean;
  editable?: boolean;
  onFocus?: () => void;
  onValueChange: (value: string | null) => void;
}) {
  const withSeconds = timePrecision === 'second';
  const [parts, setParts] = useState(() => splitDateTime(value, withSeconds));
  useEffect(
    () => setParts(current => (sameInstant(joinDateTime(current.date, current.time), value) ? current : splitDateTime(value, withSeconds))),
    [value, withSeconds],
  );
  const change = (next: typeof parts) => {
    setParts(next);
    const joined = joinDateTime(next.date, next.time);
    if (!sameInstant(joined, joinDateTime(parts.date, parts.time))) onValueChange(joined);
  };
  const common = { invalid, readOnly, editable, onFocus };
  const timeMode: TextMode = withSeconds ? 'time-seconds' : 'time';
  const timePlaceholder = withSeconds ? 'hh:mm:ss' : 'hh:mm';
  return (
    <View role="group" aria-label={label} style={styles.pair}>
      <EmrTypedText key={format} {...common} aria-label={`${label}, ${dateLabel}`} placeholder={format} mode={format} value={parts.date}
        onValueChange={date => change({ ...parts, date })} />
      <EmrTypedText key={timeMode} {...common} aria-label={`${label}, ${timeLabel}`} placeholder={timePlaceholder} mode={timeMode} value={parts.time}
        onValueChange={time => change({ ...parts, time })} />
    </View>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  input: { width: '100%', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' },
  stepperGroup: {
    flex: 1,
    minWidth: 136,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepBtn: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepperInput: { flex: 1, minWidth: 52, borderWidth: 0, borderRadius: 0, textAlign: 'center', paddingHorizontal: 6 },
  temporalGroup: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  temporalInput: { flex: 1, minWidth: 96, borderWidth: 0, borderRadius: 0, paddingHorizontal: 10 },
  temporalBtn: { position: 'relative', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  flex: { flex: 1, minWidth: 0 },
  unsupported: { padding: 10, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8 },
});
