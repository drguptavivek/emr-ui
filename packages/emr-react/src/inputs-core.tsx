'use client';

import { createElement, useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type KeyboardTypeOptions,
  type PressableStateCallbackType,
} from 'react-native';
import type { ClinicalFieldValue } from '@drguptavivek/emr-controller';
import { SvgIcon } from './icons';
import { useEmrLabels } from './labels';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import {
  buildCalendarMonthGrid,
  buildYearPage,
  CALENDAR_MONTH_NAMES,
  CALENDAR_MONTH_SHORT,
  CALENDAR_WEEKDAYS,
  formatDate,
  formatTime,
  isIsoDateOutOfBounds,
  joinDateTime,
  numberTextOf,
  parseDateText,
  parseIsoParts,
  parseNumberDraft,
  parseTimeText,
  resolveControlledDateTimeParts,
  resolveControlledNumberDraft,
  resolveControlledTemporalDraft,
  sameInstant,
  sanitizeDateText,
  sanitizeNumberText,
  sanitizeTimeText,
  splitDateTime,
  stepCalendarMonth,
  todayCalendarParts,
  type DateDisplayFormat,
  type DatePrecision,
  type TextParse,
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
      onFocus={e => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={e => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={[
        styles.input,
        {
          minHeight: props.multiline ? Math.max(88, lines * t.textMd * t.leadingNormal + 18) : t.controlHeight,
          borderColor: focused ? t.focus : invalid ? t.danger : t.border,
          borderWidth: 1,
          backgroundColor:
            props.editable === false && !props.readOnly
              ? t.surfaceRaised
              : props.readOnly
                ? t.surfaceSoft
                : t.surface,
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

/** L1 number input: compact width with − and + >=44px stepper buttons, sanitises as typed, emits number | null. */
export function NumberInput({
  value,
  integer,
  unit,
  min,
  max,
  step,
  onNumber,
  ...props
}: Omit<ThemedInputProps, 'value'> & {
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
  const canEdit = props.editable !== false && !props.readOnly;
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(external);

  // Sync draft when controller updates value or when input transitions to non-editable / blurred.
  useEffect(() => {
    if (!canEdit || !focused) {
      setDraft(external);
      return;
    }
    setDraft(current => {
      const parsed = parseNumberDraft(current);
      if (!parsed.complete) return current;
      const extParsed = parseNumberDraft(external);
      if (extParsed.complete && parsed.value === extParsed.value) return current;
      return external;
    });
  }, [external, canEdit, focused]);

  const displayed = resolveControlledNumberDraft({
    draft,
    value,
    focused,
    editable: canEdit,
  });

  const keyboardType: KeyboardTypeOptions = integer ? 'number-pad' : 'decimal-pad';
  const parsedCurrent = parseNumberDraft(displayed);
  const currentNum = parsedCurrent.complete ? parsedCurrent.value : null;
  const effectiveStep = step ?? (integer ? 1 : 0.5);
  const targetSize = Math.max(44, t.controlHeight);

  const canDec = canEdit && (min === undefined || currentNum === null || currentNum - effectiveStep >= min - 1e-9);
  const canInc = canEdit && (max === undefined || currentNum === null || currentNum + effectiveStep <= max + 1e-9);

  const nudge = (dir: -1 | 1) => {
    if (!canEdit) return;
    const base = currentNum ?? (dir > 0 ? (min ?? 0) - effectiveStep : (max ?? 0) + effectiveStep);
    let next = Number((base + dir * effectiveStep).toFixed(6));
    if (integer) next = Math.round(next);
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    setFocused(false);
    onNumber(next);
  };

  return (
    <View style={[styles.numberRow, { maxWidth: unit ? 284 : 224 }]}>
      <View
        style={[
          styles.stepperGroup,
          {
            minHeight: targetSize,
            borderColor: props.invalid ? t.danger : t.border,
            backgroundColor:
              props.editable === false && !props.readOnly
                ? t.surfaceRaised
                : props.readOnly
                  ? t.surfaceSoft
                  : t.surface,
          },
        ]}
      >
        <Pressable
          role="button"
          aria-label="Decrease value"
          aria-disabled={!canDec}
          disabled={!canDec}
          onPress={() => nudge(-1)}
          style={({ pressed, focused: btnFocused }: PressState) => [
            styles.stepBtn,
            focusRing(t, btnFocused),
            {
              minWidth: targetSize,
              minHeight: targetSize,
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
          value={displayed}
          keyboardType={keyboardType}
          inputMode={integer ? 'numeric' : 'decimal'}
          style={styles.stepperInput}
          onFocus={e => {
            setFocused(true);
            setDraft(external);
            props.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            setDraft(external);
            props.onBlur?.(e);
          }}
          onChangeText={text => {
            if (!canEdit) return;
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
          style={({ pressed, focused: btnFocused }: PressState) => [
            styles.stepBtn,
            focusRing(t, btnFocused),
            {
              minWidth: targetSize,
              minHeight: targetSize,
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
        <Text
          aria-hidden
          style={{
            color: t.textMuted,
            fontSize: t.textSm,
            fontWeight: fontWeight(t.weightMedium),
            fontFamily: fontFamily(t),
          }}
        >
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

type CalendarSubView = 'days' | 'months' | 'years';

function initialSubView(precision: DatePrecision): CalendarSubView {
  return precision === 'year' ? 'years' : precision === 'month' ? 'months' : 'days';
}

/**
 * Pure L1 EMR Calendar Popover / Sheet.
 * Token-themed, WCAG 2.2 AA 44px-target calendar with valid ARIA grid -> row -> gridcell hierarchy
 * and ISO min/max bounds enforcement across React Web and Expo / React Native.
 */
function EmrCalendarPopover({
  open,
  value,
  precision,
  min,
  max,
  anchor,
  onSelect,
  onClear,
  onClose,
}: {
  open: boolean;
  value: string | null;
  precision: DatePrecision;
  min?: string;
  max?: string;
  anchor: { x: number; y: number; width: number; height: number } | null;
  onSelect: (iso: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const { width: winW, height: winH } = useWindowDimensions();
  const today = todayCalendarParts();
  const parsed = parseIsoParts(value);
  const [viewYear, setViewYear] = useState(() => parsed?.year ?? today.year);
  const [viewMonth, setViewMonth] = useState(() => parsed?.month ?? today.month);
  const [subView, setSubView] = useState<CalendarSubView>(() => initialSubView(precision));

  useEffect(() => {
    if (!open) return;
    const p = parseIsoParts(value);
    const td = todayCalendarParts();
    setViewYear(p?.year ?? td.year);
    setViewMonth(p?.month ?? td.month);
    setSubView(initialSubView(precision));
  }, [open, value, precision]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const g = globalThis as {
      addEventListener?: (type: string, fn: (e: { key?: string }) => void) => void;
      removeEventListener?: (type: string, fn: (e: { key?: string }) => void) => void;
    };
    const onKey = (e: { key?: string }) => {
      if (e.key === 'Escape') onClose();
    };
    g.addEventListener?.('keydown', onKey);
    return () => g.removeEventListener?.('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const calWidth = 336;
  const estHeight = subView === 'days' ? 408 : 304;
  const useAnchored = Boolean(anchor && winW >= 520);
  const flipUp = Boolean(anchor && anchor.y + anchor.height + estHeight + 12 > winH && anchor.y > estHeight);
  const anchoredLeft = anchor ? Math.max(12, Math.min(anchor.x, winW - calWidth - 12)) : 0;
  const anchoredTop = anchor
    ? flipUp
      ? Math.max(12, anchor.y - estHeight - 6)
      : anchor.y + anchor.height + 6
    : 0;

  const stepHeader = (dir: -1 | 1) => {
    if (subView === 'days') {
      const next = stepCalendarMonth(viewYear, viewMonth, dir);
      setViewYear(next.year);
      setViewMonth(next.month);
    } else if (subView === 'months') {
      setViewYear(y => Math.max(1, y + dir));
    } else {
      setViewYear(y => Math.max(1, y + dir * 12));
    }
  };

  const yearPage = buildYearPage(viewYear);
  const headerTitle =
    subView === 'days'
      ? `${CALENDAR_MONTH_NAMES[viewMonth - 1]} ${viewYear}`
      : subView === 'months'
        ? `${viewYear}`
        : `${yearPage.startYear} – ${yearPage.endYear}`;

  const prevLabel =
    subView === 'days' ? 'Previous month' : subView === 'months' ? 'Previous year' : 'Previous 12 years';
  const nextLabel =
    subView === 'days' ? 'Next month' : subView === 'months' ? 'Next year' : 'Next 12 years';

  const dayCells =
    subView === 'days' ? buildCalendarMonthGrid(viewYear, viewMonth, value, today.isoDay, min, max) : [];
  const rows: (typeof dayCells)[] = [];
  for (let r = 0; r < dayCells.length; r += 7) {
    rows.push(dayCells.slice(r, r + 7));
  }

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const pad4 = (n: number) => String(n).padStart(4, '0');
  const todayTargetIso =
    precision === 'year' ? today.isoYear : precision === 'month' ? today.isoMonth : today.isoDay;
  const todayDisabled = isIsoDateOutOfBounds(todayTargetIso, min, max, precision);

  return (
    <Modal visible={open} transparent statusBarTranslucent navigationBarTranslucent animationType="fade" onRequestClose={onClose}>
      <Pressable
        aria-label={labels.close}
        style={useAnchored ? styles.calAnchoredBackdrop : styles.calModalBackdrop}
        onPress={onClose}
      >
        <Pressable
          role="dialog"
          aria-label="Choose date"
          style={[
            styles.calCard,
            useAnchored
              ? {
                  position: 'absolute',
                  left: anchoredLeft,
                  top: anchoredTop,
                  width: calWidth,
                }
              : { width: Math.min(calWidth, winW - 24) },
            {
              backgroundColor: t.surface,
              borderColor: t.border,
            },
          ]}
        >
          {/* Header Navigation */}
          <View style={[styles.calHeader, { borderColor: t.border }]}>
            <Pressable
              role="button"
              aria-label={prevLabel}
              onPress={() => stepHeader(-1)}
              style={({ pressed, focused }: PressState) => [
                styles.calNavBtn,
                focusRing(t, focused),
                { backgroundColor: pressed ? t.surfaceRaised : t.surfaceSoft, borderColor: t.border },
              ]}
            >
              <SvgIcon name="chevron-left" size={16} color={t.text} />
            </Pressable>

            <Pressable
              role="button"
              aria-label={
                subView === 'days'
                  ? `Select month or year, currently ${headerTitle}`
                  : subView === 'months'
                    ? `Select year, currently ${headerTitle}`
                    : headerTitle
              }
              disabled={subView === 'years' && precision === 'year'}
              onPress={() => {
                if (subView === 'days') setSubView('months');
                else if (subView === 'months') setSubView('years');
                else if (precision === 'month') setSubView('months');
                else if (precision === 'day') setSubView('days');
              }}
              style={({ pressed, focused }: PressState) => [
                styles.calTitleBtn,
                focusRing(t, focused),
                { backgroundColor: pressed ? t.surfaceSoft : 'transparent' },
              ]}
            >
              <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                {headerTitle}
              </Text>
              {!(subView === 'years' && precision === 'year') ? (
                <SvgIcon name={subView === 'years' ? 'chevron-up' : 'chevron-down'} size={14} color={t.textMuted} />
              ) : null}
            </Pressable>

            <Pressable
              role="button"
              aria-label={nextLabel}
              onPress={() => stepHeader(1)}
              style={({ pressed, focused }: PressState) => [
                styles.calNavBtn,
                focusRing(t, focused),
                { backgroundColor: pressed ? t.surfaceRaised : t.surfaceSoft, borderColor: t.border },
              ]}
            >
              <SvgIcon name="chevron-right" size={16} color={t.text} />
            </Pressable>
          </View>

          {/* Body: Days / Months / Years */}
          {subView === 'days' ? (
            <View role="grid" aria-label={headerTitle} style={styles.calBody}>
              <View role="row" style={styles.calWeekRow}>
                {CALENDAR_WEEKDAYS.map(wd => (
                  <View key={wd} role="columnheader" style={styles.calDaySlot}>
                    <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                      {wd}
                    </Text>
                  </View>
                ))}
              </View>
              {rows.map((week, wIdx) => (
                <View key={wIdx} role="row" style={styles.calWeekRow}>
                  {week.map(cell => (
                    <View
                      key={cell.iso}
                      {...(Platform.OS === 'web' ? ({ role: 'gridcell' } as object) : null)}
                      style={styles.calGridCell}
                    >
                      <Pressable
                        role="button"
                        aria-label={cell.ariaLabel}
                        aria-pressed={cell.isSelected}
                        aria-disabled={cell.isDisabled}
                        disabled={cell.isDisabled}
                        onPress={() => {
                          if (!cell.isDisabled) onSelect(cell.iso);
                        }}
                        style={({ pressed, focused }: PressState) => [
                          styles.calDayCell,
                          focusRing(t, focused),
                          {
                            backgroundColor: cell.isSelected
                              ? t.primary
                              : pressed && !cell.isDisabled
                                ? t.primarySoft
                                : 'transparent',
                            borderColor: cell.isSelected
                              ? t.primary
                              : cell.isToday
                                ? t.primary
                                : 'transparent',
                            borderWidth: cell.isToday || cell.isSelected ? 1.5 : 0,
                            opacity: cell.isDisabled ? 0.28 : cell.inMonth || cell.isSelected ? 1 : 0.45,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: cell.isSelected ? t.surface : cell.isToday ? t.primaryContrast : t.text,
                            fontSize: t.textSm,
                            fontWeight: fontWeight(cell.isSelected || cell.isToday ? t.weightBold : t.weightMedium),
                            fontFamily: fontFamily(t),
                          }}
                        >
                          {cell.day}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : subView === 'months' ? (
            <View style={styles.calTileGrid}>
              {CALENDAR_MONTH_SHORT.map((mName, idx) => {
                const mNum = idx + 1;
                const ymIso = `${pad4(viewYear)}-${pad2(mNum)}`;
                const isSelected =
                  precision === 'month' ? value === ymIso : parsed?.year === viewYear && parsed?.month === mNum;
                const isCurrent = today.year === viewYear && today.month === mNum;
                const tileDisabled = isIsoDateOutOfBounds(ymIso, min, max, 'month');
                return (
                  <Pressable
                    key={mName}
                    role="button"
                    aria-label={`${CALENDAR_MONTH_NAMES[idx]} ${viewYear}`}
                    aria-pressed={isSelected}
                    aria-disabled={tileDisabled}
                    disabled={tileDisabled}
                    onPress={() => {
                      if (tileDisabled) return;
                      if (precision === 'month') {
                        onSelect(ymIso);
                      } else {
                        setViewMonth(mNum);
                        setSubView('days');
                      }
                    }}
                    style={({ pressed, focused }: PressState) => [
                      styles.calTileBtn,
                      focusRing(t, focused),
                      {
                        backgroundColor: isSelected ? t.primary : pressed ? t.primarySoft : t.surfaceSoft,
                        borderColor: isSelected || isCurrent ? t.primary : t.border,
                        opacity: tileDisabled ? 0.35 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isSelected ? t.surface : t.text,
                        fontSize: t.textSm,
                        fontWeight: fontWeight(isSelected || isCurrent ? t.weightBold : t.weightMedium),
                        fontFamily: fontFamily(t),
                      }}
                    >
                      {mName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.calTileGrid}>
              {yearPage.years.map(yr => {
                const yIso = pad4(yr);
                const isSelected = precision === 'year' ? value === yIso : parsed?.year === yr;
                const isCurrent = today.year === yr;
                const tileDisabled = isIsoDateOutOfBounds(yIso, min, max, 'year');
                return (
                  <Pressable
                    key={yr}
                    role="button"
                    aria-label={String(yr)}
                    aria-pressed={isSelected}
                    aria-disabled={tileDisabled}
                    disabled={tileDisabled}
                    onPress={() => {
                      if (tileDisabled) return;
                      if (precision === 'year') {
                        onSelect(yIso);
                      } else {
                        setViewYear(yr);
                        setSubView('months');
                      }
                    }}
                    style={({ pressed, focused }: PressState) => [
                      styles.calTileBtn,
                      focusRing(t, focused),
                      {
                        backgroundColor: isSelected ? t.primary : pressed ? t.primarySoft : t.surfaceSoft,
                        borderColor: isSelected || isCurrent ? t.primary : t.border,
                        opacity: tileDisabled ? 0.35 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isSelected ? t.surface : t.text,
                        fontSize: t.textSm,
                        fontWeight: fontWeight(isSelected || isCurrent ? t.weightBold : t.weightMedium),
                        fontFamily: fontFamily(t),
                      }}
                    >
                      {yr}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Footer: Today + Clear */}
          <View style={[styles.calFooter, { borderColor: t.border }]}>
            <Pressable
              role="button"
              aria-label={
                precision === 'year' ? 'Select current year' : precision === 'month' ? 'Select current month' : 'Select today'
              }
              aria-disabled={todayDisabled}
              disabled={todayDisabled}
              onPress={() => {
                if (!todayDisabled) onSelect(todayTargetIso);
              }}
              style={({ pressed, focused }: PressState) => [
                styles.calFooterBtn,
                focusRing(t, focused),
                {
                  backgroundColor: pressed ? t.primaryHover : t.primarySoft,
                  borderColor: t.primaryBorder,
                  opacity: todayDisabled ? 0.45 : 1,
                },
              ]}
            >
              <Text style={{ color: t.primaryContrast, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                {precision === 'year' ? 'This year' : precision === 'month' ? 'This month' : 'Today'}
              </Text>
            </Pressable>

            <Pressable
              role="button"
              aria-label="Clear date"
              onPress={onClear}
              style={({ pressed, focused }: PressState) => [
                styles.calFooterBtn,
                focusRing(t, focused),
                { backgroundColor: pressed ? t.surfaceRaised : 'transparent', borderColor: t.border },
              ]}
            >
              <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
                Clear
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => i);

function extractTimeParts(value: string | null): { hour: number; minute: number; second: number } {
  const m = value ? /^(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value) : null;
  if (m) {
    return {
      hour: Math.min(23, Math.max(0, Number(m[1]))),
      minute: Math.min(59, Math.max(0, Number(m[2]))),
      second: Math.min(59, Math.max(0, Number(m[3] ?? '0'))),
    };
  }
  const now = new Date();
  return { hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds() };
}

/**
 * Cross-platform L1 Time Picker Sheet for Expo / React Native (`Platform.OS !== 'web'`).
 * Provides >=44px hour/minute(/second) selection buttons plus Now, Clear, and Done.
 */
function EmrTimePickerModal({
  open,
  value,
  withSeconds,
  onConfirm,
  onClear,
  onClose,
}: {
  open: boolean;
  value: string | null;
  withSeconds: boolean;
  onConfirm: (formatted: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const { width: winW } = useWindowDimensions();
  const initial = extractTimeParts(value);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [second, setSecond] = useState(initial.second);

  useEffect(() => {
    if (!open) return;
    const p = extractTimeParts(value);
    setHour(p.hour);
    setMinute(p.minute);
    setSecond(p.second);
  }, [open, value]);

  if (!open) return null;

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const preview = withSeconds ? `${pad2(hour)}:${pad2(minute)}:${pad2(second)}` : `${pad2(hour)}:${pad2(minute)}`;

  const renderColumn = (
    colLabel: string,
    items: readonly number[],
    selected: number,
    onPick: (v: number) => void,
  ) => (
    <View style={[styles.timeCol, { borderColor: t.border }]}>
      <Text
        style={{
          color: t.textMuted,
          fontSize: t.textXs,
          fontWeight: fontWeight(t.weightBold),
          fontFamily: fontFamily(t),
          textAlign: 'center',
          paddingVertical: 6,
        }}
      >
        {colLabel}
      </Text>
      <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator>
        <View style={styles.timeColInner}>
          {items.map(num => {
            const active = num === selected;
            const text = pad2(num);
            return (
              <Pressable
                key={num}
                role="button"
                aria-label={`${colLabel} ${text}`}
                aria-pressed={active}
                onPress={() => onPick(num)}
                style={({ pressed, focused }: PressState) => [
                  styles.timeCell,
                  focusRing(t, focused),
                  {
                    backgroundColor: active ? t.primary : pressed ? t.primarySoft : 'transparent',
                    borderColor: active ? t.primary : 'transparent',
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? t.surface : t.text,
                    fontSize: t.textMd,
                    fontWeight: fontWeight(active ? t.weightBold : t.weightMedium),
                    fontFamily: t.fontMono,
                  }}
                >
                  {text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={open} transparent statusBarTranslucent navigationBarTranslucent animationType="fade" onRequestClose={onClose}>
      <Pressable aria-label={labels.close} style={styles.calModalBackdrop} onPress={onClose}>
        <Pressable
          role="dialog"
          aria-label="Choose time"
          style={[
            styles.calCard,
            {
              width: Math.min(withSeconds ? 356 : 296, winW - 24),
              backgroundColor: t.surface,
              borderColor: t.border,
            },
          ]}
        >
          <View style={[styles.calHeader, { borderColor: t.border }]}>
            <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
              Choose time
            </Text>
            <Text style={{ color: t.primary, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: t.fontMono }}>
              {preview}
            </Text>
          </View>

          <View style={styles.timeColumnsRow}>
            {renderColumn('Hour', HOURS_24, hour, setHour)}
            {renderColumn('Min', MINUTES_60, minute, setMinute)}
            {withSeconds ? renderColumn('Sec', MINUTES_60, second, setSecond) : null}
          </View>

          <View style={[styles.calFooter, { borderColor: t.border }]}>
            <Pressable
              role="button"
              aria-label="Select current time"
              onPress={() => {
                const now = new Date();
                const next = withSeconds
                  ? `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
                  : `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
                onConfirm(next);
              }}
              style={({ pressed, focused }: PressState) => [
                styles.calFooterBtn,
                focusRing(t, focused),
                { backgroundColor: pressed ? t.surfaceRaised : t.surfaceSoft, borderColor: t.border },
              ]}
            >
              <Text style={{ color: t.text, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                Now
              </Text>
            </Pressable>

            <Pressable
              role="button"
              aria-label="Clear time"
              onPress={onClear}
              style={({ pressed, focused }: PressState) => [
                styles.calFooterBtn,
                focusRing(t, focused),
                { backgroundColor: pressed ? t.surfaceRaised : 'transparent', borderColor: t.border },
              ]}
            >
              <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
                Clear
              </Text>
            </Pressable>

            <Pressable
              role="button"
              aria-label="Done choosing time"
              onPress={() => onConfirm(preview)}
              style={({ pressed, focused }: PressState) => [
                styles.calFooterBtn,
                focusRing(t, focused),
                { backgroundColor: pressed ? t.primaryHover : t.primarySoft, borderColor: t.primaryBorder },
              ]}
            >
              <Text style={{ color: t.primaryContrast, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                Done
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Typed text bound to an ISO / HH:mm(:ss) value. Emits only on empty or a real in-bounds date/time; an incomplete
 * draft stays on screen while editable and is flagged invalid once the field loses focus.
 * Date modes open the EMR Calendar Popover; Time modes open native `<input type="time">` on web and `EmrTimePickerModal` on Expo / RN.
 */
export function EmrTypedText({
  value,
  mode,
  min,
  max,
  invalid,
  onValueChange,
  ...props
}: Omit<ThemedInputProps, 'value'> & {
  value: string | null;
  mode: TextMode;
  min?: string;
  max?: string;
  onValueChange: (value: string | null) => void;
}) {
  const t = useEmrTheme();
  const canEdit = props.editable !== false && !props.readOnly;
  const isTime = isTimeMode(mode);
  const isYearOnly = mode === 'yyyy';
  const isMonthOnly = mode === 'yyyy-mm' || mode === 'mm-yyyy';
  const datePrecision: DatePrecision = isYearOnly ? 'year' : isMonthOnly ? 'month' : 'day';

  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatText(value, mode));
  const [left, setLeft] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [calAnchor, setCalAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const groupWrapRef = useRef<ComponentRef<typeof View>>(null);
  const nativeTimePickerRef = useRef<{ showPicker?: () => void; click?: () => void; focus?: () => void } | null>(null);

  useEffect(() => {
    if (!canEdit) {
      setDraft(formatText(value, mode));
      setLeft(false);
      setCalOpen(false);
      setTimeOpen(false);
      return;
    }
    if (!focused) {
      setDraft(current => {
        const parsed = parseText(current, mode);
        return parsed.status === 'draft' ? current : formatText(value, mode);
      });
      return;
    }
    setDraft(current => {
      const parsed = parseText(current, mode);
      return parsed.status === 'draft' || valueOf(parsed) === value ? current : formatText(value, mode);
    });
  }, [value, mode, canEdit, focused]);

  const displayed = resolveControlledTemporalDraft({
    draft,
    value,
    mode,
    focused,
    editable: canEdit,
    min,
    max,
  });

  const parsedDraft = parseText(displayed, mode);
  const outOfBounds =
    !isTime && parsedDraft.status === 'valid' && isIsoDateOutOfBounds(parsedDraft.value, min, max, datePrecision);
  const isInvalid = invalid || (canEdit && left && (parsedDraft.status === 'draft' || outOfBounds));
  const targetSize = Math.max(44, t.controlHeight);
  const maxWidth = isYearOnly ? 148 : isMonthOnly ? 184 : isTime ? (mode === 'time-seconds' ? 196 : 168) : 232;
  const pickerOpen = calOpen || timeOpen;

  const openPicker = () => {
    if (!canEdit) return;
    if (!isTime) {
      if (groupWrapRef.current && typeof groupWrapRef.current.measureInWindow === 'function') {
        groupWrapRef.current.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) setCalAnchor({ x, y, width, height });
          else setCalAnchor(null);
          setCalOpen(true);
        });
      } else {
        setCalAnchor(null);
        setCalOpen(true);
      }
      return;
    }
    if (Platform.OS === 'web') {
      if (nativeTimePickerRef.current) {
        if (typeof nativeTimePickerRef.current.showPicker === 'function') {
          try {
            nativeTimePickerRef.current.showPicker();
            return;
          } catch {
            // Fall through to click/focus
          }
        }
        nativeTimePickerRef.current.click?.();
        nativeTimePickerRef.current.focus?.();
      }
      return;
    }
    setTimeOpen(true);
  };

  return (
    <View
      ref={groupWrapRef}
      collapsable={false}
      style={[
        styles.temporalGroup,
        {
          maxWidth,
          minHeight: targetSize,
          borderColor: pickerOpen ? t.primary : isInvalid ? t.danger : t.border,
          backgroundColor:
            props.editable === false && !props.readOnly
              ? t.surfaceRaised
              : props.readOnly
                ? t.surfaceSoft
                : t.surface,
        },
      ]}
    >
      <ThemedInput
        {...props}
        value={displayed}
        keyboardType="numbers-and-punctuation"
        inputMode="numeric"
        invalid={isInvalid}
        style={styles.temporalInput}
        onFocus={e => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          setLeft(true);
          setDraft(d => {
            const p = parseText(d, mode);
            if (p.status === 'draft') return d;
            return formatText(value, mode);
          });
          props.onBlur?.(e);
        }}
        onChangeText={text => {
          if (!canEdit) return;
          const clean = isTime ? sanitizeTimeText(text, mode === 'time-seconds') : sanitizeDateText(text, mode);
          setDraft(clean);
          setLeft(false);
          const parsed = parseText(clean, mode);
          if (parsed.status === 'empty') {
            onValueChange(null);
          } else if (parsed.status === 'valid') {
            if (!isTime && isIsoDateOutOfBounds(parsed.value, min, max, datePrecision)) {
              setLeft(true);
              return;
            }
            onValueChange(parsed.value);
          }
        }}
      />
      <Pressable
        role="button"
        aria-label={isTime ? 'Choose time' : 'Choose date'}
        aria-expanded={Platform.OS !== 'web' || !isTime ? pickerOpen : undefined}
        aria-haspopup={Platform.OS !== 'web' || !isTime ? 'dialog' : undefined}
        aria-disabled={!canEdit}
        disabled={!canEdit}
        onPress={openPicker}
        style={({ pressed, focused: btnFocused }: PressState) => [
          styles.temporalBtn,
          focusRing(t, btnFocused),
          {
            minWidth: targetSize,
            minHeight: targetSize,
            borderLeftWidth: 1,
            borderColor: t.border,
            backgroundColor: pickerOpen ? t.primarySoft : pressed ? t.surfaceRaised : t.surfaceSoft,
            opacity: canEdit ? 1 : 0.5,
          },
        ]}
      >
        <SvgIcon name={isTime ? 'clock' : 'calendar'} size={16} color={pickerOpen ? t.primary : t.textMuted} />
        {isTime && Platform.OS === 'web' && canEdit
          ? createElement('input' as unknown as React.ComponentType<Record<string, unknown>>, {
              ref: (el: unknown) => {
                nativeTimePickerRef.current = el as {
                  showPicker?: () => void;
                  click?: () => void;
                  focus?: () => void;
                } | null;
              },
              type: 'time',
              step: mode === 'time-seconds' ? 1 : undefined,
              value: value ?? '',
              tabIndex: -1,
              'aria-hidden': 'true',
              onChange: (e: { target?: { value?: string } }) => {
                const raw = e?.target?.value ?? '';
                if (!raw) {
                  setFocused(false);
                  setLeft(false);
                  onValueChange(null);
                  return;
                }
                const normalized = mode === 'time-seconds' ? formatTime(raw, true) : raw;
                setFocused(false);
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
      {!isTime ? (
        <EmrCalendarPopover
          open={calOpen}
          value={value}
          precision={datePrecision}
          min={min}
          max={max}
          anchor={calAnchor}
          onClose={() => setCalOpen(false)}
          onSelect={iso => {
            setCalOpen(false);
            if (isIsoDateOutOfBounds(iso, min, max, datePrecision)) return;
            setFocused(false);
            setLeft(false);
            if (iso !== value) onValueChange(iso);
          }}
          onClear={() => {
            setCalOpen(false);
            setFocused(false);
            setLeft(false);
            if (value !== null) onValueChange(null);
          }}
        />
      ) : Platform.OS !== 'web' ? (
        <EmrTimePickerModal
          open={timeOpen}
          value={value}
          withSeconds={mode === 'time-seconds'}
          onClose={() => setTimeOpen(false)}
          onConfirm={formatted => {
            setTimeOpen(false);
            setFocused(false);
            setLeft(false);
            if (formatted !== value) onValueChange(formatted);
          }}
          onClear={() => {
            setTimeOpen(false);
            setFocused(false);
            setLeft(false);
            if (value !== null) onValueChange(null);
          }}
        />
      ) : null}
    </View>
  );
}

/**
 * Local date + local time pair for a UTC instant (ISO-8601 with Z). Emits only when both halves are
 * valid (or both cleared), otherwise holds half-typed pair while editable; Display order comes from `format`.
 */
export function EmrDateTimeText({
  value,
  format,
  timePrecision = 'minute',
  label,
  dateLabel,
  timeLabel,
  invalid,
  readOnly,
  editable,
  onFocus,
  onValueChange,
}: {
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
  const canEdit = editable !== false && !readOnly;
  const [focusCount, setFocusCount] = useState(0);
  const focused = focusCount > 0;
  const [parts, setParts] = useState(() => splitDateTime(value, withSeconds));

  useEffect(() => {
    if (!canEdit) {
      setParts(splitDateTime(value, withSeconds));
      return;
    }
    setParts(current => {
      const halfTyped = (current.date !== null) !== (current.time !== null);
      if (halfTyped) return current;
      if (focused && sameInstant(joinDateTime(current.date, current.time), value)) return current;
      return splitDateTime(value, withSeconds);
    });
  }, [value, withSeconds, canEdit, focused]);

  const displayedParts = resolveControlledDateTimeParts({
    parts,
    value,
    withSeconds,
    focused,
    editable: canEdit,
  });

  const change = (next: typeof parts) => {
    if (!canEdit) return;
    setParts(next);
    const bothEmpty = next.date === null && next.time === null;
    const bothPresent = next.date !== null && next.time !== null;
    if (bothEmpty) {
      if (value !== null) onValueChange(null);
      return;
    }
    if (bothPresent) {
      const joined = joinDateTime(next.date, next.time);
      if (!sameInstant(joined, value)) onValueChange(joined);
    }
  };

  const handleHalfFocus = () => {
    setFocusCount(c => c + 1);
    onFocus?.();
  };
  const handleHalfBlur = () => {
    setFocusCount(c => Math.max(0, c - 1));
  };

  const common = { invalid, readOnly, editable, onFocus: handleHalfFocus, onBlur: handleHalfBlur };
  const timeMode: TextMode = withSeconds ? 'time-seconds' : 'time';
  const timePlaceholder = withSeconds ? 'hh:mm:ss' : 'hh:mm';
  return (
    <View role="group" aria-label={label} style={styles.pair}>
      <EmrTypedText
        key={format}
        {...common}
        aria-label={`${label}, ${dateLabel}`}
        placeholder={format}
        mode={format}
        value={displayedParts.date}
        onValueChange={date => change({ ...displayedParts, date })}
      />
      <EmrTypedText
        key={timeMode}
        {...common}
        aria-label={`${label}, ${timeLabel}`}
        placeholder={timePlaceholder}
        mode={timeMode}
        value={displayedParts.time}
        onValueChange={time => change({ ...displayedParts, time })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  input: { width: '100%', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' },
  stepperGroup: {
    flex: 1,
    minWidth: 148,
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
  calAnchoredBackdrop: { flex: 1 },
  calModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(15,23,42,0.38)',
  },
  calCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 6,
  },
  calNavBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calTitleBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  calBody: { paddingHorizontal: 8, paddingVertical: 6, gap: 2 },
  calWeekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calDaySlot: { width: 44, height: 28, alignItems: 'center', justifyContent: 'center' },
  calGridCell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  calDayCell: { minWidth: 44, minHeight: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  calTileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 8,
    justifyContent: 'space-between',
  },
  calTileBtn: {
    width: '31%',
    minWidth: 44,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  calFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  calFooterBtn: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeColumnsRow: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  timeCol: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  timeScroll: {
    maxHeight: 220,
  },
  timeColInner: {
    padding: 4,
    gap: 2,
  },
  timeCell: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
