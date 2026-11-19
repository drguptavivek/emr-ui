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
import type {
  ClinicalFieldValue,
  EmrDateTimeWireFormat,
  EmrQuantitySize,
  EmrTimeHourCycle,
  EmrTimeSize,
} from '@drguptavivek/emr-controller';
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
  formatTimeDisplay,
  isDateTimeOutOfBounds,
  isIsoDateOutOfBounds,
  isTimeOutOfBounds,
  joinDateTime,
  joinDateTimeParts,
  numberTextOf,
  parseControllerTimeText,
  parseDateText,
  parseIsoParts,
  parseNumberDraft,
  parseTimeText,
  resolveControlledDateTimeParts,
  resolveControlledNumberDraft,
  resolveControlledTemporalDraft,
  resolveQuantityStep,
  resolveTimePlaceholder,
  sameInstant,
  sanitizeControllerTimeText,
  sanitizeDateText,
  sanitizeNumberText,
  sanitizeTimeText,
  splitDateTime,
  splitDateTimeParts,
  stepCalendarMonth,
  stepQuantityValue,
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
  const [hovered, setHovered] = useState(false);
  const canHover = Platform.OS === 'web' && props.editable !== false && !props.readOnly;
  const lines = props.numberOfLines ?? 1;
  return (
    <TextInput
      {...props}
      {...(invalid ? ({ 'aria-invalid': true } as object) : null)}
      {...(Platform.OS === 'web'
        ? ({
            onMouseEnter: () => setHovered(true),
            onMouseLeave: () => setHovered(false),
          } as object)
        : null)}
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
          borderColor: focused ? t.focus : invalid ? t.danger : hovered && canHover ? t.focus : t.border,
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
  allowNegative = true,
  unit,
  min,
  max,
  step,
  precision,
  showSteppers = true,
  size = 'md',
  warning,
  maxWidth,
  onNumber,
  onSubmitted,
  ...props
}: Omit<ThemedInputProps, 'value'> & {
  value: ClinicalFieldValue | undefined;
  integer: boolean;
  allowNegative?: boolean;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  showSteppers?: boolean;
  size?: EmrQuantitySize;
  warning?: boolean;
  maxWidth?: number | 'none';
  onNumber: (value: number | null) => void;
  onSubmitted?: () => void;
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
  const effectiveStep =
    step ??
    (precision !== undefined
      ? resolveQuantityStep({ mode: integer ? 'integer' : 'decimal', precision })
      : integer
        ? 1
        : 0.5);
  const targetSize = size === 'lg' ? 48 : Math.max(44, t.controlHeight);

  const canDec = canEdit && (min === undefined || currentNum === null || currentNum - effectiveStep >= min - 1e-9);
  const canInc = canEdit && (max === undefined || currentNum === null || currentNum + effectiveStep <= max + 1e-9);

  const nudge = (dir: -1 | 1) => {
    if (!canEdit) return;
    const next = stepQuantityValue({
      current: currentNum,
      delta: dir,
      mode: integer ? 'integer' : 'decimal',
      precision,
      step: effectiveStep,
      min,
      max,
    });
    setFocused(false);
    onNumber(next);
  };

  const resolvedMaxWidth = maxWidth === 'none' ? undefined : (maxWidth ?? (unit ? 284 : 224));
  const resolvedBorderColor = props.invalid ? t.danger : warning ? t.warning : t.border;
  const resolvedBg =
    props.editable === false && !props.readOnly
      ? t.surfaceRaised
      : props.readOnly
        ? t.surfaceSoft
        : t.surface;

  if (!showSteppers) {
    return (
      <View style={[styles.numberRow, resolvedMaxWidth !== undefined ? { maxWidth: resolvedMaxWidth } : { width: '100%' }]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <ThemedInput
            {...props}
            aria-disabled={props.editable === false && !props.readOnly ? true : undefined}
            value={displayed}
            keyboardType={keyboardType}
            returnKeyType={onSubmitted ? 'done' : props.returnKeyType}
            onSubmitEditing={() => {
              onSubmitted?.();
            }}
            style={[
              {
                minHeight: targetSize,
                borderColor: resolvedBorderColor,
                borderStyle: props.readOnly ? 'dashed' : 'solid',
                backgroundColor: resolvedBg,
              },
              Platform.OS === 'web' ? ({ fontVariantNumeric: 'tabular-nums' } as unknown as object) : null,
            ]}
            onFocus={(e) => {
              setFocused(true);
              setDraft(external);
              props.onFocus?.(e);
            }}
            onChangeText={(text) => {
              if (!canEdit) return;
              const clean = sanitizeNumberText(text, integer, allowNegative);
              setDraft(clean);
              const parsed = parseNumberDraft(clean);
              if (parsed.complete) {
                onNumber(parsed.value);
              }
            }}
            onBlur={(e) => {
              setFocused(false);
              setDraft(external);
              props.onBlur?.(e);
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.numberRow, resolvedMaxWidth !== undefined ? { maxWidth: resolvedMaxWidth } : { width: '100%' }]}>
      <View
        style={[
          styles.stepperGroup,
          {
            minHeight: targetSize,
            borderColor: resolvedBorderColor,
            borderStyle: props.readOnly ? 'dashed' : 'solid',
            backgroundColor: resolvedBg,
          },
        ]}
      >
        <Pressable
          role="button"
          aria-label="Decrease value"
          aria-disabled={!canDec}
          disabled={!canDec}
          onPress={() => nudge(-1)}
          style={({ pressed, hovered, focused: btnFocused }: PressState & { hovered?: boolean }) => [
            styles.stepBtn,
            focusRing(t, btnFocused),
            {
              minWidth: targetSize,
              minHeight: targetSize,
              borderRightWidth: 1,
              borderColor: t.border,
              backgroundColor: pressed ? t.surfaceRaised : hovered && canDec ? t.primaryHover : t.surfaceSoft,
              opacity: canDec ? 1 : 0.4,
            },
          ]}
        >
          <SvgIcon name="minus" size={14} color={t.text} />
        </Pressable>

        <ThemedInput
          {...props}
          aria-disabled={props.editable === false && !props.readOnly ? true : undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          value={displayed}
          keyboardType={keyboardType}
          inputMode={integer ? 'numeric' : 'decimal'}
          returnKeyType={onSubmitted ? 'done' : props.returnKeyType}
          onSubmitEditing={() => {
            onSubmitted?.();
          }}
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
            const clean = sanitizeNumberText(text, integer, allowNegative);
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
          style={({ pressed, hovered, focused: btnFocused }: PressState & { hovered?: boolean }) => [
            styles.stepBtn,
            focusRing(t, btnFocused),
            {
              minWidth: targetSize,
              minHeight: targetSize,
              borderLeftWidth: 1,
              borderColor: t.border,
              backgroundColor: pressed ? t.surfaceRaised : hovered && canInc ? t.primaryHover : t.surfaceSoft,
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

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

/**
 * Cross-platform L1 Time Picker Popover / Sheet (Web & Expo Native).
 * Provides >=44px hour/minute(/second)(/AM-PM) selection buttons plus Now, Clear, and Done.
 */
function EmrTimePickerModal({
  open,
  value,
  withSeconds,
  hourCycle = '24',
  min,
  max,
  anchor,
  onConfirm,
  onClear,
  onClose,
}: {
  open: boolean;
  value: string | null;
  withSeconds: boolean;
  hourCycle?: EmrTimeHourCycle;
  min?: string;
  max?: string;
  anchor?: { x: number; y: number; width: number; height: number } | null;
  onConfirm: (formatted: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const { width: winW, height: winH } = useWindowDimensions();
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

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const preview24 = withSeconds ? `${pad2(hour)}:${pad2(minute)}:${pad2(second)}` : `${pad2(hour)}:${pad2(minute)}`;
  const previewDisplay = formatTimeDisplay(preview24, { precision: withSeconds ? 'second' : 'minute', hourCycle });
  const nowObj = new Date();
  const now24 = withSeconds
    ? `${pad2(nowObj.getHours())}:${pad2(nowObj.getMinutes())}:${pad2(nowObj.getSeconds())}`
    : `${pad2(nowObj.getHours())}:${pad2(nowObj.getMinutes())}`;
  const nowDisabled = isTimeOutOfBounds(now24, min, max);
  const confirmDisabled = isTimeOutOfBounds(preview24, min, max);

  const is12h = hourCycle === '12';
  const currentPeriod: 'AM' | 'PM' = hour >= 12 ? 'PM' : 'AM';
  const current12Hour = hour % 12 === 0 ? 12 : hour % 12;

  const cardWidth = withSeconds || is12h ? 344 : 284;
  const estHeight = 328;
  const useAnchored = Boolean(anchor && Platform.OS === 'web' && winW >= 520);
  const flipUp = Boolean(anchor && anchor.y + anchor.height + estHeight + 12 > winH && anchor.y > estHeight);
  const anchoredLeft = anchor ? Math.max(12, Math.min(anchor.x, winW - cardWidth - 12)) : 0;
  const anchoredTop = anchor
    ? flipUp
      ? Math.max(12, anchor.y - estHeight - 6)
      : anchor.y + anchor.height + 6
    : 0;

  const renderColumn = (
    colLabel: string,
    items: readonly number[],
    selected: number,
    onPick: (v: number) => void,
    formatItem: (n: number) => string = pad2,
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
            const text = formatItem(num);
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
      <Pressable
        aria-label={labels.close}
        style={useAnchored ? styles.calAnchoredBackdrop : styles.calModalBackdrop}
        onPress={onClose}
      >
        <Pressable
          role="dialog"
          aria-label="Choose time"
          style={[
            styles.calCard,
            useAnchored
              ? {
                  position: 'absolute',
                  left: anchoredLeft,
                  top: anchoredTop,
                  width: cardWidth,
                }
              : { width: Math.min(cardWidth, winW - 24) },
            {
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
              {previewDisplay}
            </Text>
          </View>

          <View style={styles.timeColumnsRow}>
            {is12h
              ? renderColumn('Hour', HOURS_12, current12Hour, h12 => setHour((h12 % 12) + (currentPeriod === 'PM' ? 12 : 0)))
              : renderColumn('Hour', HOURS_24, hour, setHour)}
            {renderColumn('Min', MINUTES_60, minute, setMinute)}
            {withSeconds ? renderColumn('Sec', MINUTES_60, second, setSecond) : null}
            {is12h ? (
              <View style={[styles.timeCol, { flex: 0.85, borderColor: t.border }]}>
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
                  AM/PM
                </Text>
                <View style={styles.timeColInner}>
                  {(['AM', 'PM'] as const).map(mer => {
                    const active = mer === currentPeriod;
                    return (
                      <Pressable
                        key={mer}
                        role="button"
                        aria-pressed={active}
                        onPress={() => setHour((hour % 12) + (mer === 'PM' ? 12 : 0))}
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
                            fontFamily: fontFamily(t),
                          }}
                        >
                          {mer}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>

          <View style={[styles.calFooter, { borderColor: t.border }]}>
            <Pressable
              role="button"
              aria-label="Select current time"
              aria-disabled={nowDisabled}
              disabled={nowDisabled}
              onPress={() => {
                if (nowDisabled) return;
                const now = new Date();
                const next = withSeconds
                  ? `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
                  : `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
                onConfirm(next);
              }}
              style={({ pressed, focused }: PressState) => [
                styles.calFooterBtn,
                focusRing(t, focused),
                {
                  backgroundColor: pressed ? t.primaryHover : t.primarySoft,
                  borderColor: t.primaryBorder,
                  opacity: nowDisabled ? 0.45 : 1,
                },
              ]}
            >
              <Text style={{ color: t.primaryContrast, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                Now
              </Text>
            </Pressable>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
                aria-disabled={confirmDisabled}
                disabled={confirmDisabled}
                onPress={() => {
                  if (!confirmDisabled) onConfirm(preview24);
                }}
                style={({ pressed, focused }: PressState) => [
                  styles.calFooterBtn,
                  focusRing(t, focused),
                  {
                    backgroundColor: pressed ? t.primaryHover : t.primarySoft,
                    borderColor: t.primaryBorder,
                    opacity: confirmDisabled ? 0.45 : 1,
                  },
                ]}
              >
                <Text style={{ color: t.primaryContrast, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                  Done
                </Text>
              </Pressable>
            </View>
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
  step,
  hourCycle = '24',
  size = 'md',
  clearable,
  warning,
  invalid,
  onValueChange,
  onCleared,
  ...props
}: Omit<ThemedInputProps, 'value'> & {
  value: string | null;
  mode: TextMode;
  min?: string;
  max?: string;
  step?: number;
  hourCycle?: EmrTimeHourCycle;
  size?: EmrTimeSize;
  clearable?: boolean;
  warning?: boolean;
  onValueChange: (value: string | null) => void;
  onCleared?: () => void;
}) {
  const t = useEmrTheme();
  const canEdit = props.editable !== false && !props.readOnly;
  const isTime = isTimeMode(mode);
  const timePrecision = mode === 'time-seconds' ? 'second' : 'minute';
  const isYearOnly = mode === 'yyyy';
  const isMonthOnly = mode === 'yyyy-mm' || mode === 'mm-yyyy';
  const datePrecision: DatePrecision = isYearOnly ? 'year' : isMonthOnly ? 'month' : 'day';

  const formatForMode = (val: string | null): string =>
    isTime ? formatTimeDisplay(val, { precision: timePrecision, hourCycle }) : formatDate(val, mode as DateDisplayFormat);

  const parseForMode = (raw: string): TextParse => {
    if (!isTime) return parseDateText(raw, mode as DateDisplayFormat);
    const r = parseControllerTimeText(raw, { precision: timePrecision, hourCycle });
    if (r.kind === 'empty') return { status: 'empty' };
    if (r.kind === 'valid') return { status: 'valid', value: r.value };
    return { status: 'draft' };
  };

  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatForMode(value));
  const [left, setLeft] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [calAnchor, setCalAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const groupWrapRef = useRef<ComponentRef<typeof View>>(null);
  const nativeTimePickerRef = useRef<{ showPicker?: () => void; click?: () => void; focus?: () => void } | null>(null);

  useEffect(() => {
    if (!canEdit) {
      setDraft(formatForMode(value));
      setLeft(false);
      setCalOpen(false);
      setTimeOpen(false);
      return;
    }
    if (!focused) {
      setDraft(current => {
        const parsed = parseForMode(current);
        return parsed.status === 'draft' ? current : formatForMode(value);
      });
      return;
    }
    setDraft(current => {
      const parsed = parseForMode(current);
      const pv = parsed.status === 'valid' ? parsed.value : null;
      return parsed.status === 'draft' || pv === value ? current : formatForMode(value);
    });
  }, [value, mode, hourCycle, canEdit, focused]);

  const displayed = !canEdit
    ? formatForMode(value)
    : focused
      ? draft
      : (() => {
          const parsed = parseForMode(draft);
          if (parsed.status === 'draft') return draft;
          return formatForMode(value);
        })();

  const parsedDraft = parseForMode(displayed);
  const outOfBounds =
    parsedDraft.status === 'valid' &&
    (isTime ? isTimeOutOfBounds(parsedDraft.value, min, max) : isIsoDateOutOfBounds(parsedDraft.value, min, max, datePrecision));
  const isInvalid = invalid || (canEdit && left && (parsedDraft.status === 'draft' || outOfBounds));
  const targetSize = size === 'lg' ? 48 : Math.max(44, t.controlHeight);
  const baseTimeWidth = mode === 'time-seconds' || hourCycle === '12' ? 210 : 176;
  const maxWidth = isYearOnly ? 148 : isMonthOnly ? 184 : isTime ? (clearable ? baseTimeWidth + 36 : baseTimeWidth) : 232;
  const pickerOpen = calOpen || timeOpen;

  const openPicker = () => {
    if (!canEdit) return;
    if (groupWrapRef.current && typeof groupWrapRef.current.measureInWindow === 'function') {
      groupWrapRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) setCalAnchor({ x, y, width, height });
        else setCalAnchor(null);
        if (isTime) setTimeOpen(true);
        else setCalOpen(true);
      });
    } else {
      setCalAnchor(null);
      if (isTime) setTimeOpen(true);
      else setCalOpen(true);
    }
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
          borderStyle: props.readOnly ? 'dashed' : 'solid',
          borderColor: pickerOpen ? t.primary : isInvalid ? t.danger : warning ? t.warning : t.border,
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
            const p = parseForMode(d);
            if (p.status === 'draft') return d;
            return formatForMode(value);
          });
          props.onBlur?.(e);
        }}
        onChangeText={text => {
          if (!canEdit) return;
          const clean = isTime ? sanitizeControllerTimeText(text, { hourCycle }) : sanitizeDateText(text, mode as DateDisplayFormat);
          setDraft(clean);
          setLeft(false);
          const parsed = parseForMode(clean);
          if (parsed.status === 'empty') {
            onValueChange(null);
          } else if (parsed.status === 'valid') {
            const oob = isTime
              ? isTimeOutOfBounds(parsed.value, min, max)
              : isIsoDateOutOfBounds(parsed.value, min, max, datePrecision);
            if (oob) {
              setLeft(true);
              return;
            }
            onValueChange(parsed.value);
          }
        }}
      />
      {isTime && clearable && value && canEdit ? (
        <Pressable
          role="button"
          aria-label={`Clear ${props['aria-label'] || 'time'}`}
          onPress={() => {
            setDraft('');
            setLeft(false);
            onValueChange(null);
            onCleared?.();
          }}
          style={({ pressed, hovered, focused: clearFocused }: PressState & { hovered?: boolean }) => [
            styles.temporalBtn,
            focusRing(t, clearFocused),
            {
              minWidth: targetSize,
              minHeight: targetSize,
              borderLeftWidth: 1,
              borderColor: t.border,
              backgroundColor: pressed ? t.surfaceRaised : hovered ? t.primaryHover : 'transparent',
            },
          ]}
        >
          <SvgIcon name="close" size={14} color={t.textMuted} />
        </Pressable>
      ) : null}
      <Pressable
        role="button"
        aria-label={isTime ? 'Choose time' : 'Choose date'}
        aria-expanded={pickerOpen}
        aria-haspopup="dialog"
        aria-disabled={!canEdit}
        disabled={!canEdit}
        onPress={openPicker}
        style={({ pressed, hovered, focused: btnFocused }: PressState & { hovered?: boolean }) => [
          styles.temporalBtn,
          focusRing(t, btnFocused),
          {
            minWidth: targetSize,
            minHeight: targetSize,
            borderLeftWidth: 1,
            borderColor: t.border,
            backgroundColor: pickerOpen
              ? t.primarySoft
              : pressed
                ? t.surfaceRaised
                : hovered && canEdit
                  ? t.primaryHover
                  : t.surfaceSoft,
            opacity: canEdit ? 1 : 0.5,
          },
        ]}
      >
        <SvgIcon name={isTime ? 'clock' : 'calendar'} size={16} color={pickerOpen ? t.primary : t.textMuted} />
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
      ) : (
        <EmrTimePickerModal
          open={timeOpen}
          value={value}
          withSeconds={mode === 'time-seconds'}
          hourCycle={hourCycle}
          min={min}
          max={max}
          anchor={calAnchor}
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
      )}
    </View>
  );
}

/**
 * Local date + local time pair for a UTC instant (ISO-8601 with Z). Emits only when both halves are
 * valid (or both cleared), otherwise holds half-typed pair while editable; Display order comes from `format`.
 */
export function EmrDateTimeText({
  id,
  value,
  format = 'dd-mm-yyyy',
  timePrecision = 'minute',
  hourCycle = '24',
  wireFormat = 'utc',
  min,
  max,
  size = 'md',
  clearable,
  warning,
  label,
  dateLabel,
  timeLabel,
  ariaDescribedBy,
  required,
  invalid,
  readOnly,
  editable,
  onFocus,
  onBlur,
  onCleared,
  onSubmit,
  onValueChange,
}: {
  id?: string;
  value: string | null;
  format: DateDisplayFormat;
  timePrecision?: 'minute' | 'second';
  hourCycle?: EmrTimeHourCycle;
  wireFormat?: EmrDateTimeWireFormat;
  min?: string;
  max?: string;
  size?: EmrTimeSize;
  clearable?: boolean;
  warning?: boolean;
  label: string;
  dateLabel: string;
  timeLabel: string;
  ariaDescribedBy?: string;
  required?: boolean;
  invalid?: boolean;
  readOnly?: boolean;
  editable?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onCleared?: () => void;
  onSubmit?: () => void;
  onValueChange: (value: string | null) => void;
}) {
  const t = useEmrTheme();
  const canEdit = editable !== false && !readOnly;
  const [focusCount, setFocusCount] = useState(0);
  const [leftInvalid, setLeftInvalid] = useState(false);
  const focused = focusCount > 0;
  const [parts, setParts] = useState<{ date: string | null; time: string | null }>(() => ({
    ...splitDateTimeParts(value, timePrecision),
  }));

  useEffect(() => {
    if (!canEdit) {
      setParts({ ...splitDateTimeParts(value, timePrecision) });
      setLeftInvalid(false);
      return;
    }
    setParts(current => {
      const halfTyped = (current.date !== null) !== (current.time !== null);
      if (halfTyped) return current;
      const joined = joinDateTimeParts(current.date, current.time, wireFormat, timePrecision);
      if (focused && sameInstant(joined, value)) return current;
      return { ...splitDateTimeParts(value, timePrecision) };
    });
  }, [value, timePrecision, wireFormat, canEdit, focused]);

  const displayedParts = !canEdit
    ? splitDateTimeParts(value, timePrecision)
    : focused || (parts.date !== null) !== (parts.time !== null)
      ? parts
      : splitDateTimeParts(value, timePrecision);

  const change = (next: { date: string | null; time: string | null }) => {
    if (!canEdit) return;
    setParts(next);
    setLeftInvalid(false);
    const bothEmpty = next.date === null && next.time === null;
    const bothPresent = next.date !== null && next.time !== null;
    if (bothEmpty) {
      if (value !== null) onValueChange(null);
      return;
    }
    if (bothPresent) {
      const joined = joinDateTimeParts(next.date, next.time, wireFormat, timePrecision);
      if (!joined) return;
      if (isDateTimeOutOfBounds(joined, min, max, wireFormat)) {
        setLeftInvalid(true);
        return;
      }
      if (!sameInstant(joined, value)) onValueChange(joined);
    }
  };

  const handleHalfFocus = () => {
    setFocusCount(c => {
      if (c === 0) onFocus?.();
      return c + 1;
    });
  };
  const handleHalfBlur = () => {
    setFocusCount(c => {
      const next = Math.max(0, c - 1);
      if (next === 0) {
        const halfTyped = (parts.date !== null) !== (parts.time !== null);
        if (canEdit && halfTyped) setLeftInvalid(true);
        onBlur?.();
      }
      return next;
    });
  };

  const common = {
    invalid: Boolean(invalid || leftInvalid),
    warning,
    size,
    readOnly,
    editable,
    'aria-describedby': ariaDescribedBy,
    'aria-required': required || undefined,
    'aria-readonly': readOnly || undefined,
    onFocus: handleHalfFocus,
    onBlur: handleHalfBlur,
    onSubmitEditing: () => {
      if (canEdit) onSubmit?.();
    },
  };
  const timeMode: TextMode = timePrecision === 'second' ? 'time-seconds' : 'time';
  const timePlaceholder = resolveTimePlaceholder(timePrecision, hourCycle);
  const targetSize = size === 'lg' ? 48 : Math.max(44, t.controlHeight);
  return (
    <View role="group" aria-label={label} style={styles.pair}>
      <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 156, minWidth: 140, maxWidth: 184 }}>
        <EmrTypedText
          key={format}
          {...common}
          id={id ? `${id}-date` : undefined}
          aria-label={`${label}, ${dateLabel}`}
          placeholder={format}
          mode={format}
          value={displayedParts.date}
          onValueChange={date => change({ date, time: displayedParts.time })}
        />
      </View>
      <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 140, minWidth: 120, maxWidth: timeMode === 'time-seconds' || hourCycle === '12' ? 200 : 168 }}>
        <EmrTypedText
          key={`${timeMode}-${hourCycle}`}
          {...common}
          id={id ? `${id}-time` : undefined}
          aria-label={`${label}, ${timeLabel}`}
          placeholder={timePlaceholder}
          mode={timeMode}
          hourCycle={hourCycle}
          value={displayedParts.time}
          onValueChange={time => change({ date: displayedParts.date, time })}
        />
      </View>
      {clearable && value && canEdit ? (
        <Pressable
          role="button"
          aria-label={`Clear ${label}`}
          onPress={() => {
            setParts({ date: null, time: null });
            setLeftInvalid(false);
            onValueChange(null);
            onCleared?.();
          }}
          style={({ pressed, focused: clrFocus }: PressState) => [
            focusRing(t, clrFocus),
            {
              minWidth: 44,
              minHeight: targetSize,
              borderWidth: 1,
              borderRadius: 8,
              borderColor: t.border,
              backgroundColor: pressed ? t.surfaceRaised : t.surface,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <SvgIcon name="close" size={14} color={t.textMuted} />
        </Pressable>
      ) : null}
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
  temporalInput: { flex: 1, minWidth: 0, borderWidth: 0, borderRadius: 0, paddingHorizontal: 10 },
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
