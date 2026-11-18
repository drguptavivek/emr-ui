'use client';

import type {
  EmrBadge,
  EmrControlVariant,
  EmrDateRangePreset,
  EmrDateRangeValue,
  EmrOption,
  EmrScoredOption,
  EmrSearchSelectFilterMode,
  EmrSearchSelectSize,
  EmrTagInputSize,
  EmrTagInputVariant,
  EmrTone,
} from '@drguptavivek/emr-controller';
import { createElement, useEffect, useId, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SvgIcon } from './icons';
import { FieldChrome, type FieldValidationLine } from './l1-field-chrome';
import { textInputKeys, type WebKeyEvent } from './l1-interactive-shared';
import {
  addTagValues,
  clearUnlockedTags,
  commitTagInputValues,
  filterOptionsLocally,
  findNextEnabledSearchOptionIndex,
  groupOptions,
  isIsoDateInRange,
  isIsoRangeEdge,
  isTagLocked,
  normalizeDateRangeSelection,
  popLastUnlockedTag,
  rankAndFilterOptions,
  rankTagSuggestions,
  removeTagInputAtIndex,
  resolveComboboxDisplayValue,
  resolveCustomSearchCandidate,
  resolveDefaultActiveOptionIndex,
  resolveEmrTagsValue,
  splitMatchHighlightSegments,
  splitTagTokens,
} from './l1-wave2.logic';
import { EmrButton } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

function withAlpha(color: string, alpha: number): string {
  const hex = color.trim().replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

export type { EmrDateRangePreset, EmrDateRangeValue };

// ─────────────────────────────────────────────────────────────
// 1. EmrDateRangeInput
// ─────────────────────────────────────────────────────────────

export interface EmrDateRangeInputProps {
  readonly value?: EmrDateRangeValue | null;
  readonly onValueChange?: (value: EmrDateRangeValue | null) => void;
  readonly mode?: 'date' | 'datetime';
  readonly presets?: readonly EmrDateRangePreset[];
  readonly min?: string;
  readonly max?: string;
  readonly startPlaceholder?: string;
  readonly endPlaceholder?: string;
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

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

function buildCalendarMonthGrid(year: number, monthZeroIndexed: number): readonly (string | null)[] {
  const firstDay = new Date(Date.UTC(year, monthZeroIndexed, 1));
  const startDow = firstDay.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthZeroIndexed + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startDow; i += 1) cells.push(null);
  const mm = String(monthZeroIndexed + 1).padStart(2, '0');
  for (let d = 1; d <= daysInMonth; d += 1) {
    const dd = String(d).padStart(2, '0');
    cells.push(`${year}-${mm}-${dd}`);
  }
  return cells;
}

export function EmrDateRangeInput({
  value = null,
  onValueChange,
  mode = 'date',
  presets = [],
  min,
  max,
  startPlaceholder,
  endPlaceholder,
  clearable = true,
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
}: EmrDateRangeInputProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-date-range-${reactId}`;

  const [calendarOpen, setCalendarOpen] = useState(false);

  const initialYearMonth = (() => {
    const seed = value?.start ?? '2026-04-15';
    const match = /^(\d{4})-(\d{2})/.exec(seed);
    if (match) {
      return { year: Number(match[1]), month: Number(match[2]) - 1 };
    }
    return { year: 2026, month: 3 };
  })();

  const [viewYear, setViewYear] = useState(initialYearMonth.year);
  const [viewMonth, setViewMonth] = useState(initialYearMonth.month);

  const interactive = !disabled && !readOnly;
  const startVal = value?.start ?? '';
  const endVal = value?.end ?? '';
  const hasValue = Boolean(startVal || endVal);

  const defaultStartPh = mode === 'datetime' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD';
  const defaultEndPh = mode === 'datetime' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD';

  const commitRange = (next: EmrDateRangeValue | null) => {
    if (!interactive) return;
    if (!next || (!next.start && !next.end)) {
      onValueChange?.(null);
      return;
    }
    if (next.start && next.end && next.end < next.start) {
      onValueChange?.({ start: next.end, end: next.start });
      return;
    }
    onValueChange?.(next);
  };

  const handleDayClick = (isoDate: string) => {
    if (!interactive) return;
    if (min && isoDate < min) return;
    if (max && isoDate > max) return;
    const next = normalizeDateRangeSelection(value, isoDate);
    onValueChange?.(next);
  };

  const handleClear = () => {
    if (!interactive) return;
    onValueChange?.(null);
    onCleared?.();
  };

  const stepMonth = (delta: number) => {
    let nextM = viewMonth + delta;
    let nextY = viewYear;
    if (nextM < 0) {
      nextM = 11;
      nextY -= 1;
    } else if (nextM > 11) {
      nextM = 0;
      nextY += 1;
    }
    setViewMonth(nextM);
    setViewYear(nextY);
  };

  const cells = buildCalendarMonthGrid(viewYear, viewMonth);
  const monthLabel = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

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
      <View style={styles.rangeContainer}>
        <View
          style={[
            styles.rangeInputsRow,
            {
              minHeight: Math.max(44, t.controlHeight),
              backgroundColor: readOnly ? t.surfaceSoft : t.surface,
              borderColor: error ? t.danger : calendarOpen ? t.focus : t.border,
              borderRadius: 8,
              opacity: disabled ? 0.55 : 1,
            },
          ]}
        >
          <TextInput
            value={startVal}
            editable={interactive}
            placeholder={startPlaceholder ?? defaultStartPh}
            placeholderTextColor={t.textMuted}
            accessibilityLabel={`${label ?? 'Date range'} start`}
            onChangeText={(text) =>
              commitRange({
                start: text.trim() || null,
                end: value?.end ?? null,
              })
            }
            style={[
              styles.dateEndpointInput,
              {
                fontSize: t.textSm,
                color: t.text,
                fontFamily: fontFamily(t),
              },
            ]}
          />

          <Text
            style={{
              fontSize: t.textSm,
              color: t.textMuted,
              fontFamily: fontFamily(t),
            }}
          >
            →
          </Text>

          <TextInput
            value={endVal}
            editable={interactive}
            placeholder={endPlaceholder ?? defaultEndPh}
            placeholderTextColor={t.textMuted}
            accessibilityLabel={`${label ?? 'Date range'} end`}
            onChangeText={(text) =>
              commitRange({
                start: value?.start ?? null,
                end: text.trim() || null,
              })
            }
            style={[
              styles.dateEndpointInput,
              {
                fontSize: t.textSm,
                color: t.text,
                fontFamily: fontFamily(t),
              },
            ]}
          />

          {clearable && hasValue && interactive ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Clear ${label ?? 'date range'}`}
              onPress={handleClear}
              style={styles.iconHit}
            >
              <SvgIcon name="close" size={15} color={t.textMuted} />
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              calendarOpen ? 'Close range calendar' : 'Open range calendar'
            }
            disabled={!interactive}
            onPress={() => {
              if (interactive) setCalendarOpen((prev) => !prev);
            }}
            style={styles.iconHit}
          >
            <SvgIcon name="calendar" size={16} color={t.textMuted} />
          </Pressable>
        </View>

        {presets.length > 0 ? (
          <View style={styles.presetsRow}>
            {presets.map((preset) => {
              const active =
                value?.start === preset.range.start &&
                value?.end === preset.range.end;
              return (
                <EmrButton
                  key={preset.id}
                  label={preset.label}
                  variant={active ? 'primary' : 'ghost'}
                  disabled={!interactive}
                  onPress={() => commitRange(preset.range)}
                />
              );
            })}
          </View>
        ) : null}

        {calendarOpen && interactive ? (
          <View
            style={[
              styles.calendarPopover,
              {
                backgroundColor: t.surface,
                borderColor: t.border,
                borderRadius: 8,
              },
            ]}
          >
            <View style={styles.calendarHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                onPress={() => stepMonth(-1)}
                style={styles.iconHit}
              >
                <SvgIcon name="chevron-left" size={16} color={t.text} />
              </Pressable>
              <Text
                style={{
                  fontSize: t.textSm,
                  fontWeight: fontWeight(t.weightBold),
                  color: t.text,
                  fontFamily: fontFamily(t),
                }}
              >
                {monthLabel}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next month"
                onPress={() => stepMonth(1)}
                style={styles.iconHit}
              >
                <SvgIcon name="chevron-right" size={16} color={t.text} />
              </Pressable>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((dow) => (
                <Text
                  key={dow}
                  style={{
                    width: 44,
                    textAlign: 'center',
                    fontSize: t.text2xs,
                    fontWeight: fontWeight(t.weightBold),
                    color: t.textMuted,
                    fontFamily: fontFamily(t),
                  }}
                >
                  {dow}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {cells.map((iso, idx) => {
                if (!iso) {
                  return <View key={`blank-${idx}`} style={styles.dayCellSpacer} />;
                }
                const dayNum = Number(iso.slice(-2));
                const edge = isIsoRangeEdge(iso, value);
                const inRange = isIsoDateInRange(iso, value);
                const outOfBounds =
                  Boolean(min && iso < min) || Boolean(max && iso > max);

                return (
                  <Pressable
                    key={iso}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${iso}`}
                    accessibilityState={{
                      selected: Boolean(edge || inRange),
                      disabled: outOfBounds,
                    }}
                    disabled={outOfBounds}
                    onPress={() => handleDayClick(iso)}
                    style={[
                      styles.dayCell,
                      {
                        backgroundColor: edge
                          ? t.primary
                          : inRange
                            ? t.primarySoft
                            : 'transparent',
                        borderRadius: 6,
                        opacity: outOfBounds ? 0.35 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: t.textXs,
                        fontWeight: fontWeight(
                          edge ? t.weightBold : t.weightMedium
                        ),
                        color: edge
                          ? '#ffffff'
                          : inRange
                            ? t.primaryContrast
                            : t.text,
                        fontFamily: fontFamily(t),
                      }}
                    >
                      {String(dayNum)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>
    </FieldChrome>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. EmrCombobox
// ─────────────────────────────────────────────────────────────

export interface EmrComboboxProps {
  readonly value?: string | null;
  readonly onValueChange?: (value: string | null) => void;
  readonly onOptionSelected?: (option: EmrOption) => void;
  readonly onCustomValueCommitted?: (value: string) => void;
  readonly onSubmitted?: (value: string) => void;
  readonly onQueryChange?: (query: string) => void;
  readonly onOpenChange?: (open: boolean) => void;
  readonly options: readonly EmrOption[];
  readonly allowCustomValue?: boolean;
  readonly creatable?: boolean;
  readonly placeholder?: string;
  readonly clearable?: boolean;
  readonly clearLabel?: string;
  readonly onCleared?: () => void;
  readonly onFocused?: () => void;
  readonly onBlurred?: () => void;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
  readonly label?: string;
  readonly labelHidden?: boolean;
  readonly ariaLabel?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly warning?: string;
  readonly info?: string;
  readonly messages?: readonly FieldValidationLine[];
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly invalid?: boolean;
  readonly variant?: EmrControlVariant;
  readonly size?: EmrSearchSelectSize;
  readonly filterMode?: EmrSearchSelectFilterMode;
  readonly highlightMatch?: boolean;
  readonly autoHighlight?: boolean;
  readonly loading?: boolean;
  readonly loadingMessage?: string;
  readonly emptyMessage?: string;
  readonly open?: boolean;
  readonly controlId?: string;
}

function comboboxToneColor(tone: EmrTone | undefined, t: ReturnType<typeof useEmrTheme>) {
  switch (tone) {
    case 'info':
      return { bg: t.infoSoft, fg: t.info, border: t.info };
    case 'success':
      return { bg: t.successSoft, fg: t.success, border: t.success };
    case 'warning':
      return { bg: t.warningSoft, fg: t.warning, border: t.warning };
    case 'danger':
      return { bg: t.dangerSoft, fg: t.danger, border: t.danger };
    default:
      return { bg: t.surfaceSoft, fg: t.textMuted, border: t.border };
  }
}

export function EmrCombobox({
  value = null,
  onValueChange,
  onOptionSelected,
  onCustomValueCommitted,
  onSubmitted,
  onQueryChange,
  onOpenChange,
  options,
  allowCustomValue = true,
  creatable,
  placeholder = 'Type or select…',
  clearable = true,
  clearLabel = 'Clear',
  onCleared,
  onFocused,
  onBlurred,
  onFocus,
  onBlur,
  label,
  labelHidden = false,
  ariaLabel,
  hint,
  error,
  warning,
  info,
  messages,
  required,
  disabled = false,
  readOnly = false,
  invalid = false,
  variant = 'outline',
  size = 'md',
  filterMode = 'local',
  highlightMatch = true,
  autoHighlight = true,
  loading = false,
  loadingMessage = 'Loading suggestions…',
  emptyMessage = 'No matching options',
  open: controlledOpen,
  controlId,
}: EmrComboboxProps) {
  const t = useEmrTheme();
  const isWeb = Platform.OS === 'web';
  const { width: winWidth } = useWindowDimensions();
  const useSheetModal = !isWeb || (winWidth > 0 && winWidth < 520);
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-combobox-${reactId}`;
  const listboxId = `${id}-listbox`;

  const [localOpen, setLocalOpen] = useState(false);
  const [isActivelyTyping, setIsActivelyTyping] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const containerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputRef = useRef<any>(null);

  const effectiveAllowCustom = creatable ?? allowCustomValue;
  const interactive = !disabled && !readOnly;
  const isOpen = interactive && (controlledOpen !== undefined ? controlledOpen : localOpen);
  const isInvalid = invalid || Boolean(error);

  const displayedText = resolveComboboxDisplayValue({
    isActivelyTyping,
    query,
    value,
    options,
  });

  const activeQuery = isActivelyTyping ? query : '';
  const trimmedQuery = query.trim();

  const scoredResults: readonly EmrScoredOption[] = rankAndFilterOptions(
    options,
    activeQuery,
    filterMode,
  );
  const bestMatchValue =
    isActivelyTyping && trimmedQuery.length > 0 && filterMode === 'local'
      ? (scoredResults.find((r) => r.isBestMatch)?.option.value ?? null)
      : null;

  const filtered = scoredResults.map((r) => r.option);
  const groups = groupOptions(filtered);
  const flatOptions = groups.flatMap((g) => g.options);
  const flatIndexMap = new Map<string, number>();
  flatOptions.forEach((opt, idx) => flatIndexMap.set(opt.value, idx));

  const customCandidate = isActivelyTyping
    ? resolveCustomSearchCandidate(query, options, effectiveAllowCustom)
    : null;

  const totalNavigableCount = flatOptions.length + (customCandidate ? 1 : 0);
  const activeDescendantId =
    isOpen && activeIndex >= 0 && activeIndex < totalNavigableCount
      ? `${id}-opt-${activeIndex}`
      : undefined;

  const setPanelOpen = (next: boolean, nextQuery?: string) => {
    if (!interactive && next) return;
    if (controlledOpen === undefined) {
      setLocalOpen(next);
    }
    onOpenChange?.(next);
    if (next) {
      const q = nextQuery !== undefined ? nextQuery : activeQuery;
      setActiveIndex(
        resolveDefaultActiveOptionIndex(
          flatOptions,
          value ? [value] : [],
          q,
          autoHighlight,
        ),
      );
    } else {
      setActiveIndex(-1);
    }
  };

  useEffect(() => {
    if (!isWeb || !isOpen || useSheetModal || typeof document === 'undefined') return;
    const handleDocMouseDown = (event: MouseEvent) => {
      const node = containerRef.current as unknown as { contains?: (target: EventTarget | null) => boolean } | null;
      if (node && typeof node.contains === 'function' && !node.contains(event.target)) {
        setIsActivelyTyping(false);
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocMouseDown);
    return () => document.removeEventListener('mousedown', handleDocMouseDown);
  });

  const handleTextChange = (text: string) => {
    if (!interactive) return;
    setIsActivelyTyping(true);
    setQuery(text);
    onQueryChange?.(text);
    setPanelOpen(true, text);
    if (effectiveAllowCustom) {
      onValueChange?.(text.length > 0 ? text : null);
    }
  };

  const handleSelectOption = (opt: EmrOption) => {
    if (!interactive || opt.disabled || opt.readOnly) return;
    setIsActivelyTyping(false);
    setQuery(opt.label);
    setPanelOpen(false);
    onOptionSelected?.(opt);
    onValueChange?.(opt.value);
    onSubmitted?.(opt.value);
  };

  const handleCommitCustom = (raw: string) => {
    if (!interactive) return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    setIsActivelyTyping(false);
    setQuery(trimmed);
    setPanelOpen(false);
    onCustomValueCommitted?.(trimmed);
    onValueChange?.(trimmed);
    onSubmitted?.(trimmed);
  };

  const handleClear = () => {
    if (!interactive) return;
    setIsActivelyTyping(false);
    setQuery('');
    setPanelOpen(false);
    onValueChange?.(null);
    onQueryChange?.('');
    onCleared?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: WebKeyEvent) => {
    if (!interactive) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      if (!isOpen) {
        setPanelOpen(true);
        return;
      }
      const next = findNextEnabledSearchOptionIndex(flatOptions, activeIndex, e.key);
      if (next !== null) {
        setActiveIndex(next);
      } else if (customCandidate && e.key === 'ArrowDown') {
        setActiveIndex(flatOptions.length);
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && activeIndex >= 0 && activeIndex < flatOptions.length) {
        const opt = flatOptions[activeIndex];
        if (opt && !opt.disabled && !opt.readOnly) {
          handleSelectOption(opt);
        }
        return;
      }
      if (isOpen && customCandidate && activeIndex === flatOptions.length) {
        handleCommitCustom(customCandidate);
        return;
      }
      if (effectiveAllowCustom && trimmedQuery) {
        handleCommitCustom(trimmedQuery);
        return;
      }
      const firstEnabled = flatOptions.find((o) => !o.disabled && !o.readOnly);
      if (firstEnabled) {
        handleSelectOption(firstEnabled);
      }
      return;
    }
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsActivelyTyping(false);
      setPanelOpen(false);
    }
  };

  const renderHighlightedText = (
    text: string,
    baseStyle: Record<string, unknown>,
  ) => {
    if (!highlightMatch || !isActivelyTyping || !trimmedQuery) {
      return <Text style={baseStyle}>{text}</Text>;
    }
    const segs = splitMatchHighlightSegments(text, query);
    return (
      <Text style={baseStyle}>
        {segs.map((seg, idx) =>
          seg.matched ? (
            <Text
              key={idx}
              style={{
                backgroundColor: t.primarySoft,
                color: t.primary,
                fontWeight: fontWeight(t.weightBold),
              }}
            >
              {seg.text}
            </Text>
          ) : (
            seg.text
          ),
        )}
      </Text>
    );
  };

  const renderOptionList = () => (
    <ScrollView
      style={useSheetModal ? styles.comboSheetScroll : styles.comboListScroll}
      keyboardShouldPersistTaps="handled"
      {...(isWeb ? ({ role: 'listbox', id: listboxId, 'aria-label': ariaLabel ?? label ?? 'Suggestions' } as Record<string, unknown>) : {})}
    >
      {loading ? (
        <View style={styles.comboStatusRow} {...(isWeb ? { role: 'status', 'aria-busy': true } : {})}>
          <ActivityIndicator size="small" color={t.primary} />
          <Text style={{ fontSize: t.textMd, color: t.textMuted, fontFamily: fontFamily(t) }}>
            {loadingMessage}
          </Text>
        </View>
      ) : groups.length === 0 && !customCandidate ? (
        <View style={styles.emptyOptionRow}>
          <Text style={{ fontSize: t.textMd, color: t.textMuted, fontFamily: fontFamily(t) }}>
            {effectiveAllowCustom && trimmedQuery
              ? `Using custom value "${trimmedQuery}"`
              : emptyMessage}
          </Text>
        </View>
      ) : (
        <>
          {groups.map((grp, gIdx) => (
            <View
              key={grp.label ?? `ungrouped-${gIdx}`}
              {...(isWeb && grp.label ? { role: 'group', 'aria-label': grp.label } : {})}
            >
              {grp.label ? (
                <Text
                  style={[
                    styles.groupHeader,
                    {
                      fontSize: t.textXs,
                      fontWeight: fontWeight(t.weightBold),
                      color: t.textMuted,
                      backgroundColor: t.surfaceSoft,
                      fontFamily: fontFamily(t),
                    },
                  ]}
                >
                  {grp.label}
                </Text>
              ) : null}
              {grp.options.map((opt) => {
                const flatIdx = flatIndexMap.get(opt.value) ?? -1;
                const isSelected = opt.value === value;
                const isActive = flatIdx === activeIndex;
                const isBest = bestMatchValue === opt.value;
                const badgeObj: EmrBadge | null = opt.badge
                  ? typeof opt.badge === 'string'
                    ? { label: opt.badge, tone: 'neutral' }
                    : opt.badge
                  : opt.tone
                    ? { label: opt.tone, tone: opt.tone }
                    : null;
                const badgeColors = badgeObj ? comboboxToneColor(badgeObj.tone, t) : null;

                return (
                  <Pressable
                    key={opt.value}
                    disabled={opt.disabled}
                    onPress={() => handleSelectOption(opt)}
                    {...(isWeb
                      ? {
                          id: `${id}-opt-${flatIdx}`,
                          role: 'option',
                          'aria-selected': isSelected,
                          'aria-disabled': opt.disabled || undefined,
                          'aria-readonly': opt.readOnly || undefined,
                          onMouseDown: (ev: { preventDefault?: () => void }) => ev.preventDefault?.(),
                        }
                      : {
                          accessibilityRole: 'button',
                          accessibilityState: {
                            selected: isSelected,
                            disabled: Boolean(opt.disabled),
                          },
                        })}
                    style={[
                      styles.optionItem,
                      {
                        backgroundColor: isSelected
                          ? t.primarySoft
                          : isActive
                            ? t.surfaceRaised
                            : 'transparent',
                        borderColor: isActive ? t.focus : 'transparent',
                        borderWidth: isActive ? 1 : 0,
                        borderRadius: 6,
                        opacity: opt.disabled ? 0.5 : 1,
                      },
                    ]}
                  >
                    <View style={styles.comboOptionCheck}>
                      {isSelected ? <SvgIcon name="check" size={15} color={t.primary} /> : null}
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <View style={styles.comboOptionTop}>
                        {renderHighlightedText(opt.label, {
                          fontSize: t.textMd,
                          fontWeight: fontWeight(isSelected ? t.weightBold : t.weightMedium),
                          color: isSelected ? t.primaryContrast : t.text,
                          fontFamily: fontFamily(t),
                        })}
                        {opt.code ? (
                          <View
                            style={[
                              styles.comboCodeTag,
                              { backgroundColor: t.surfaceSoft, borderColor: t.border },
                            ]}
                          >
                            {renderHighlightedText(opt.code, {
                              fontSize: t.textXs,
                              color: t.textMuted,
                              fontFamily: fontFamily(t),
                            })}
                          </View>
                        ) : null}
                        {isBest ? (
                          <View style={[styles.comboBestMatch, { backgroundColor: t.primarySoft }]}>
                            <Text
                              style={{
                                fontSize: t.text2xs,
                                fontWeight: fontWeight(t.weightBold),
                                color: t.primary,
                                fontFamily: fontFamily(t),
                              }}
                            >
                              Best match
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {opt.description
                        ? renderHighlightedText(opt.description, {
                            fontSize: t.textXs,
                            color: t.textMuted,
                            fontFamily: fontFamily(t),
                          })
                        : null}
                    </View>
                    <View style={styles.comboOptionMeta}>
                      {badgeObj && badgeColors ? (
                        <View
                          style={[
                            styles.comboBadge,
                            { backgroundColor: badgeColors.bg, borderColor: badgeColors.border },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: t.text2xs,
                              fontWeight: fontWeight(t.weightMedium),
                              color: badgeColors.fg,
                              fontFamily: fontFamily(t),
                            }}
                          >
                            {badgeObj.label}
                          </Text>
                        </View>
                      ) : null}
                      {opt.readOnly ? <SvgIcon name="lock" size={13} color={t.textMuted} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
          {customCandidate ? (
            <Pressable
              onPress={() => handleCommitCustom(customCandidate)}
              {...(isWeb
                ? {
                    id: `${id}-opt-${flatOptions.length}`,
                    role: 'option',
                    'aria-selected': false,
                    onMouseDown: (ev: { preventDefault?: () => void }) => ev.preventDefault?.(),
                  }
                : { accessibilityRole: 'button' })}
              style={[
                styles.optionItem,
                {
                  backgroundColor:
                    activeIndex === flatOptions.length ? t.surfaceRaised : 'transparent',
                  borderColor: activeIndex === flatOptions.length ? t.focus : 'transparent',
                  borderWidth: activeIndex === flatOptions.length ? 1 : 0,
                  borderRadius: 6,
                },
              ]}
            >
              <View style={styles.comboOptionCheck} />
              <Text
                style={{
                  flex: 1,
                  fontSize: t.textMd,
                  color: t.primary,
                  fontWeight: fontWeight(t.weightMedium),
                  fontFamily: fontFamily(t),
                }}
              >
                Use "{customCandidate}"
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
    </ScrollView>
  );

  const rowBg =
    disabled || readOnly
      ? t.surfaceSoft
      : variant === 'filled'
        ? t.surfaceSoft
        : variant === 'subtle'
          ? 'transparent'
          : t.surface;
  const rowBorder = isInvalid
    ? t.danger
    : warning
      ? t.warning
      : isOpen
        ? t.focus
        : variant === 'outline'
          ? t.border
          : 'transparent';

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
        ref={containerRef}
        style={[
          styles.comboContainer,
          isOpen && isWeb && !useSheetModal ? styles.comboContainerOpenWeb : undefined,
        ]}
      >
        <View
          style={[
            styles.comboInputRow,
            {
              minHeight: Math.max(44, t.controlHeight),
              backgroundColor: rowBg,
              borderColor: rowBorder,
              borderStyle: readOnly ? 'dashed' : 'solid',
              borderRadius: 8,
              opacity: disabled ? 0.6 : 1,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            nativeID={id}
            value={displayedText}
            editable={interactive}
            placeholder={placeholder}
            placeholderTextColor={t.textMuted}
            accessibilityLabel={ariaLabel ?? label ?? placeholder}
            {...(isWeb
              ? ({
                  role: 'combobox',
                  'aria-autocomplete': 'list',
                  'aria-expanded': isOpen,
                  'aria-controls': isOpen ? listboxId : undefined,
                  'aria-activedescendant': activeDescendantId,
                  'aria-invalid': isInvalid || undefined,
                  'aria-busy': loading || undefined,
                  'aria-disabled': disabled ? true : undefined,
                  'aria-required': required ? true : undefined,
                  'aria-readonly': readOnly ? true : undefined,
                  ...(disabled ? { disabled: true } : {}),
                } as Record<string, unknown>)
              : {})}
            {...(textInputKeys(handleKeyDown) as object)}
            onSubmitEditing={() => {
              if (!interactive) return;
              if (effectiveAllowCustom && trimmedQuery) {
                handleCommitCustom(trimmedQuery);
              }
            }}
            onFocus={() => {
              if (!interactive) return;
              const current = resolveComboboxDisplayValue({
                isActivelyTyping: false,
                query: '',
                value,
                options,
              });
              setQuery(current);
              onFocused?.();
              onFocus?.();
              if (!useSheetModal) {
                setPanelOpen(true, current);
              }
            }}
            onBlur={() => {
              if (!useSheetModal) {
                setIsActivelyTyping(false);
              }
              onBlurred?.();
              onBlur?.();
            }}
            onChangeText={handleTextChange}
            style={[
              styles.comboInput,
              {
                fontSize: size === 'sm' ? t.textSm : t.textMd,
                color: t.text,
                fontFamily: fontFamily(t),
              },
            ]}
          />

          {loading ? (
            <View style={styles.comboSpinnerWrap}>
              <ActivityIndicator size="small" color={t.textMuted} />
            </View>
          ) : null}

          {clearable && Boolean(value || displayedText) && interactive ? (
            <Pressable
              {...(isWeb ? { role: 'button' } : { accessibilityRole: 'button' })}
              accessibilityLabel={`${clearLabel} ${ariaLabel ?? label ?? 'combobox'}`}
              onPress={handleClear}
              style={styles.iconHit}
            >
              <SvgIcon name="close" size={15} color={t.textMuted} />
            </Pressable>
          ) : null}

          <Pressable
            {...(isWeb ? { role: 'button' } : { accessibilityRole: 'button' })}
            accessibilityLabel={isOpen ? 'Close options' : 'Open options'}
            disabled={!interactive}
            onPress={() => {
              if (!interactive) return;
              if (!isOpen) {
                const current = resolveComboboxDisplayValue({
                  isActivelyTyping: false,
                  query: '',
                  value,
                  options,
                });
                setQuery(current);
                setPanelOpen(true, current);
              } else {
                setIsActivelyTyping(false);
                setPanelOpen(false);
              }
            }}
            style={styles.iconHit}
          >
            <SvgIcon
              name={isOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={t.textMuted}
            />
          </Pressable>
        </View>

        {isOpen && interactive && !useSheetModal ? (
          <View
            style={[
              styles.comboList,
              styles.comboListDesktopWeb,
              {
                backgroundColor: t.surface,
                borderColor: t.border,
                borderRadius: 8,
              },
            ]}
          >
            {renderOptionList()}
          </View>
        ) : null}

        {isOpen && interactive && useSheetModal ? (
          <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={() => {
              setIsActivelyTyping(false);
              setPanelOpen(false);
            }}
          >
            <View style={styles.comboSheetBackdrop}>
              <View
                style={[
                  styles.comboSheetCard,
                  { backgroundColor: t.surface, borderColor: t.border },
                ]}
              >
                <View style={styles.comboSheetHeader}>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: t.textMd,
                      fontWeight: fontWeight(t.weightBold),
                      color: t.text,
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {label ?? 'Select or type'}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close options"
                    onPress={() => {
                      setIsActivelyTyping(false);
                      setPanelOpen(false);
                    }}
                    style={styles.iconHit}
                  >
                    <SvgIcon name="close" size={18} color={t.text} />
                  </Pressable>
                </View>
                <TextInput
                  value={displayedText}
                  onChangeText={handleTextChange}
                  placeholder={placeholder}
                  placeholderTextColor={t.textMuted}
                  autoFocus
                  style={[
                    styles.comboSheetSearchInput,
                    {
                      borderColor: t.border,
                      backgroundColor: t.surfaceSoft,
                      color: t.text,
                      fontSize: t.textMd,
                      fontFamily: fontFamily(t),
                    },
                  ]}
                />
                <View style={[styles.comboSheetListWrap, { borderColor: t.border }]}>
                  {renderOptionList()}
                </View>
              </View>
            </View>
          </Modal>
        ) : null}
      </View>
    </FieldChrome>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. EmrTagInput
// ─────────────────────────────────────────────────────────────

export interface EmrTagInputProps {
  readonly value?: readonly string[];
  readonly tags?: readonly string[];
  readonly values?: readonly string[];
  readonly onValueChange?: (value: readonly string[]) => void;
  readonly onTagsChange?: (tags: readonly string[]) => void;
  readonly onValuesChange?: (values: readonly string[]) => void;
  readonly onTagAdded?: (tag: string) => void;
  readonly onTagRemoved?: (tag: string) => void;
  readonly suggestions?: readonly string[];
  readonly separators?: readonly string[];
  readonly delimiters?: readonly string[];
  readonly allowDuplicates?: boolean;
  readonly maxTags?: number;
  readonly maxTagLength?: number;
  readonly lockedTags?: readonly string[];
  readonly variant?: EmrTagInputVariant;
  readonly size?: EmrTagInputSize;
  readonly chipTone?: EmrTone;
  readonly filterSuggestions?: boolean;
  readonly highlightMatch?: boolean;
  readonly placeholder?: string;
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
  readonly warning?: string;
  readonly info?: string;
  readonly messages?: readonly FieldValidationLine[];
  readonly invalid?: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly controlId?: string;
}

export function EmrTagInput({
  value,
  tags,
  values,
  onValueChange,
  onTagsChange,
  onValuesChange,
  onTagAdded,
  onTagRemoved,
  suggestions = [],
  separators,
  delimiters = [',', ';'],
  allowDuplicates = false,
  maxTags,
  maxTagLength,
  lockedTags = [],
  variant = 'outline',
  size = 'md',
  chipTone = 'neutral',
  filterSuggestions = true,
  highlightMatch = true,
  placeholder = 'Add tag and press Enter…',
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
  warning,
  info,
  messages,
  invalid = false,
  required,
  disabled = false,
  readOnly = false,
  controlId,
}: EmrTagInputProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-tag-input-${reactId}`;
  const isWeb = Platform.OS === 'web';
  const { width: winWidth } = useWindowDimensions();
  const useSheetModal = !isWeb || (winWidth > 0 && winWidth < 520);

  const [draft, setDraft] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownDismissed, setDropdownDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<any>(null);
  const chipRemoveRefs = useRef<(View | null)[]>([]);

  const resolvedTags = resolveEmrTagsValue(tags, value, values);
  const resolvedSeparators = separators ?? delimiters;
  const interactive = !disabled && !readOnly;
  const atLimit = maxTags !== undefined && resolvedTags.length >= maxTags;
  const isInvalid = invalid || Boolean(error);

  const rankedSuggestions = rankTagSuggestions(suggestions, resolvedTags, draft, {
    allowDuplicates,
    filterSuggestions,
  });
  const isDropdownOpen =
    isFocused && !dropdownDismissed && interactive && !atLimit && rankedSuggestions.length > 0;

  const hasClearableTags =
    clearable &&
    interactive &&
    resolvedTags.some((tag) => !isTagLocked(tag, lockedTags));

  const emitTags = (next: readonly string[]) => {
    onValueChange?.(next);
    onTagsChange?.(next);
    onValuesChange?.(next);
  };

  const commitRaw = (raw: string) => {
    if (!interactive) return;
    const res = commitTagInputValues(resolvedTags, raw, {
      separators: resolvedSeparators,
      allowDuplicates,
      maxTags,
      maxTagLength,
    });
    setDraft('');
    setActiveIndex(-1);
    if (res.added.length > 0) {
      for (const added of res.added) {
        onTagAdded?.(added);
      }
      emitTags(res.next);
    }
  };

  const handleDraftChange = (text: string) => {
    if (!interactive) return;
    setDropdownDismissed(false);
    setActiveIndex(-1);
    const hasDelimiter = resolvedSeparators.some((d) => text.includes(d));
    if (hasDelimiter) {
      commitRaw(text);
      return;
    }
    const clamped = maxTagLength !== undefined && maxTagLength >= 0 ? text.slice(0, maxTagLength) : text;
    setDraft(clamped);
  };

  const handleRemoveIndex = (idx: number) => {
    if (!interactive) return;
    const res = removeTagInputAtIndex(resolvedTags, idx, lockedTags);
    if (res.removed !== null) {
      onTagRemoved?.(res.removed);
      emitTags(res.next);
    }
  };

  const handleClearAll = () => {
    if (!interactive) return;
    setDraft('');
    setActiveIndex(-1);
    const res = clearUnlockedTags(resolvedTags, lockedTags);
    if (res.removed.length > 0) {
      emitTags(res.next);
    }
    onCleared?.();
  };

  const selectSuggestion = (val: string) => {
    commitRaw(val);
    if (useSheetModal) {
      setDropdownDismissed(true);
    } else {
      inputRef.current?.focus();
    }
  };

  const toneColors: Record<EmrTone, { bg: string; border: string; fg: string }> = {
    neutral: {
      bg: t.surfaceSoft,
      border: t.border,
      fg: t.text,
    },
    info: {
      bg: withAlpha(t.primary, 0.14),
      border: withAlpha(t.primary, 0.45),
      fg: t.primary,
    },
    success: {
      bg: withAlpha(t.success, 0.14),
      border: withAlpha(t.success, 0.45),
      fg: t.success,
    },
    warning: {
      bg: withAlpha(t.warning, 0.14),
      border: withAlpha(t.warning, 0.45),
      fg: t.warning,
    },
    danger: {
      bg: withAlpha(t.danger, 0.14),
      border: withAlpha(t.danger, 0.45),
      fg: t.danger,
    },
  };
  const chipColors = toneColors[chipTone] ?? toneColors.neutral;

  const boxBg =
    variant === 'filled'
      ? t.surfaceSoft
      : variant === 'subtle'
        ? 'transparent'
        : readOnly
          ? t.surfaceSoft
          : t.surface;
  const boxBorderColor = isInvalid
    ? t.danger
    : warning
      ? t.warning
      : isFocused
        ? t.primary
        : variant === 'filled'
          ? 'transparent'
          : t.border;

  const renderSuggestionList = () => (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={useSheetModal ? styles.comboSheetScroll : styles.comboListScroll}
    >
      {rankedSuggestions.map((sug, idx) => {
        const isActive = idx === activeIndex;
        const segments = highlightMatch
          ? splitMatchHighlightSegments(sug.value, draft)
          : [{ text: sug.value, matched: false }];
        return (
          <Pressable
            key={sug.value}
            accessibilityRole={isWeb ? undefined : 'button'}
            accessibilityLabel={sug.value}
            onPress={() => selectSuggestion(sug.value)}
            {...(isWeb
              ? ({
                  role: 'option',
                  id: `${id}-opt-${idx}`,
                  'aria-selected': isActive,
                } as Record<string, unknown>)
              : {})}
            style={[
              styles.optionItem,
              {
                backgroundColor: isActive ? withAlpha(t.primary, 0.14) : 'transparent',
                minHeight: 44,
              },
            ]}
          >
            <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: t.textMd, color: t.text, fontFamily: fontFamily(t) }}>
                {segments.map((seg, sIdx) =>
                  seg.matched ? (
                    <Text
                      key={sIdx}
                      style={{
                        backgroundColor: withAlpha(t.primary, 0.2),
                        color: t.primary,
                        fontWeight: fontWeight(t.weightBold),
                      }}
                    >
                      {seg.text}
                    </Text>
                  ) : (
                    <Text key={sIdx}>{seg.text}</Text>
                  ),
                )}
              </Text>
              {sug.isBestMatch ? (
                <View
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 999,
                    backgroundColor: withAlpha(t.primary, 0.14),
                  }}
                >
                  <Text
                    style={{
                      fontSize: t.textXs,
                      fontWeight: fontWeight(t.weightMedium),
                      color: t.primary,
                      fontFamily: fontFamily(t),
                    }}
                  >
                    Best match
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <FieldChrome
      controlId={id}
      label={labelHidden ? undefined : label}
      hint={labelHidden ? undefined : hint}
      error={labelHidden ? undefined : error}
      warning={labelHidden ? undefined : warning}
      info={labelHidden ? undefined : info}
      messages={labelHidden ? undefined : messages}
      required={required}
    >
      <View
        style={[
          styles.tagContainer,
          isDropdownOpen && isWeb && !useSheetModal ? styles.comboContainerOpenWeb : undefined,
        ]}
      >
        <View
          style={[
            styles.tagBox,
            {
              minHeight: size === 'sm' ? 36 : Math.max(44, t.controlHeight),
              paddingVertical: size === 'sm' ? 2 : 4,
              backgroundColor: boxBg,
              borderColor: boxBorderColor,
              borderWidth: variant === 'subtle' ? 0 : 1,
              borderBottomWidth: 1,
              borderStyle: readOnly ? 'dashed' : 'solid',
              borderRadius: variant === 'subtle' ? 0 : 8,
              opacity: disabled ? 0.55 : 1,
            },
          ]}
        >
          {resolvedTags.map((tag, idx) => {
            const locked = isTagLocked(tag, lockedTags);
            return (
              <View
                key={`${tag}-${idx}`}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: chipColors.bg,
                    borderColor: chipColors.border,
                    borderStyle: locked ? 'dashed' : 'solid',
                    borderRadius: 6,
                  },
                ]}
              >
                {locked ? <SvgIcon name="lock" size={12} color={chipColors.fg} /> : null}
                <Text
                  style={{
                    fontSize: t.textXs,
                    fontWeight: fontWeight(t.weightMedium),
                    color: chipColors.fg,
                    fontFamily: fontFamily(t),
                  }}
                >
                  {tag}
                </Text>
                {interactive && !locked ? (
                  <Pressable
                    ref={(el) => {
                      chipRemoveRefs.current[idx] = el as unknown as View | null;
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${tag}`}
                    onPress={() => handleRemoveIndex(idx)}
                    style={styles.tagRemoveBtn}
                    {...(isWeb
                      ? ({
                          onKeyDown: (e: WebKeyEvent) => {
                            if (e.key === 'ArrowLeft') {
                              e.preventDefault();
                              for (let p = idx - 1; p >= 0; p -= 1) {
                                const prevEl = chipRemoveRefs.current[p] as unknown as { focus?: () => void } | null;
                                if (prevEl?.focus) {
                                  prevEl.focus();
                                  break;
                                }
                              }
                            } else if (e.key === 'ArrowRight') {
                              e.preventDefault();
                              let moved = false;
                              for (let n = idx + 1; n < resolvedTags.length; n += 1) {
                                const nextEl = chipRemoveRefs.current[n] as unknown as { focus?: () => void } | null;
                                if (nextEl?.focus) {
                                  nextEl.focus();
                                  moved = true;
                                  break;
                                }
                              }
                              if (!moved) {
                                inputRef.current?.focus();
                              }
                            }
                          },
                        } as Record<string, unknown>)
                      : {})}
                  >
                    <SvgIcon name="close" size={12} color={chipColors.fg} />
                  </Pressable>
                ) : null}
              </View>
            );
          })}

            <TextInput
              ref={inputRef}
              value={draft}
              editable={interactive && !atLimit}
              aria-readonly={readOnly ? true : undefined}
              aria-disabled={disabled ? true : undefined}
              aria-required={required ? true : undefined}
              aria-invalid={isInvalid ? true : undefined}
              {...(isWeb && disabled ? ({ disabled: true } as object) : {})}
              {...(isWeb && readOnly ? ({ 'aria-readonly': 'true' } as object) : {})}
              {...(isWeb && suggestions.length > 0
                ? ({
                    role: 'combobox',
                    'aria-expanded': isDropdownOpen,
                    'aria-controls': isDropdownOpen ? `${id}-listbox` : undefined,
                    'aria-activedescendant':
                      isDropdownOpen && activeIndex >= 0 && activeIndex < rankedSuggestions.length
                        ? `${id}-opt-${activeIndex}`
                        : undefined,
                  } as Record<string, unknown>)
                : {})}
              maxLength={maxTagLength}
              placeholder={atLimit ? '' : resolvedTags.length === 0 ? placeholder : 'Add…'}
              placeholderTextColor={t.textMuted}
              accessibilityLabel={ariaLabel ?? label ?? placeholder}
              onFocus={() => {
                setIsFocused(true);
                setDropdownDismissed(false);
                onFocused?.();
              }}
              onBlur={() => {
                setIsFocused(false);
                setActiveIndex(-1);
                if (draft.trim()) {
                  commitRaw(draft);
                }
                onBlurred?.();
              }}
              onChangeText={handleDraftChange}
              onSubmitEditing={() => {
                if (isDropdownOpen && activeIndex >= 0 && activeIndex < rankedSuggestions.length) {
                  selectSuggestion(rankedSuggestions[activeIndex]!.value);
                } else {
                  commitRaw(draft);
                }
              }}
              onKeyPress={(e) => {
                const key = (e.nativeEvent as { key?: string }).key;
                if (key === 'ArrowDown' && rankedSuggestions.length > 0 && !atLimit) {
                  e.preventDefault?.();
                  setDropdownDismissed(false);
                  setActiveIndex((prev) => (prev < rankedSuggestions.length - 1 ? prev + 1 : 0));
                } else if (key === 'ArrowUp' && rankedSuggestions.length > 0 && !atLimit) {
                  e.preventDefault?.();
                  setDropdownDismissed(false);
                  setActiveIndex((prev) => (prev > 0 ? prev - 1 : rankedSuggestions.length - 1));
                } else if (key === 'Escape' && isDropdownOpen) {
                  e.preventDefault?.();
                  setDropdownDismissed(true);
                  setActiveIndex(-1);
                } else if (key === 'Enter') {
                  if (isDropdownOpen && activeIndex >= 0 && activeIndex < rankedSuggestions.length) {
                    e.preventDefault?.();
                    selectSuggestion(rankedSuggestions[activeIndex]!.value);
                  } else if (draft.trim() && !atLimit) {
                    e.preventDefault?.();
                    commitRaw(draft);
                  }
                } else if (key === 'Backspace' && draft.length === 0 && resolvedTags.length > 0 && interactive) {
                  const res = popLastUnlockedTag(resolvedTags, lockedTags);
                  if (res.removed !== null) {
                    onTagRemoved?.(res.removed);
                    emitTags(res.next);
                  }
                } else if (key === 'ArrowLeft' && isWeb && draft.length === 0) {
                  for (let p = resolvedTags.length - 1; p >= 0; p -= 1) {
                    const target = chipRemoveRefs.current[p] as unknown as { focus?: () => void } | null;
                    if (target?.focus) {
                      e.preventDefault?.();
                      target.focus();
                      break;
                    }
                  }
                }
              }}
              style={[
                styles.tagDraftInput,
                {
                  fontSize: size === 'sm' ? t.textSm : t.textMd,
                  color: t.text,
                  fontFamily: fontFamily(t),
                },
              ]}
            />

          {hasClearableTags ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${clearLabel} ${label ?? 'tags'}`}
              onPress={handleClearAll}
              style={styles.iconHit}
            >
              <SvgIcon name="close" size={15} color={t.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {isDropdownOpen && !useSheetModal ? (
          <View
            {...(isWeb
              ? ({
                  role: 'listbox',
                  id: `${id}-listbox`,
                  'aria-label': 'Tag suggestions',
                } as Record<string, unknown>)
              : {})}
            style={[
              styles.comboList,
              styles.comboListDesktopWeb,
              {
                backgroundColor: t.surface,
                borderColor: t.border,
                borderRadius: 8,
              },
            ]}
          >
            {renderSuggestionList()}
          </View>
        ) : null}

        {isDropdownOpen && useSheetModal ? (
          <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={() => {
              setDropdownDismissed(true);
              setIsFocused(false);
            }}
          >
            <View style={styles.comboSheetBackdrop}>
              <View
                style={[
                  styles.comboSheetCard,
                  { backgroundColor: t.surface, borderColor: t.border },
                ]}
              >
                <View style={styles.comboSheetHeader}>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: t.textMd,
                      fontWeight: fontWeight(t.weightBold),
                      color: t.text,
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {label ?? 'Tag suggestions'}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close suggestions"
                    onPress={() => {
                      setDropdownDismissed(true);
                      setIsFocused(false);
                    }}
                    style={styles.iconHit}
                  >
                    <SvgIcon name="close" size={18} color={t.text} />
                  </Pressable>
                </View>
                <TextInput
                  value={draft}
                  onChangeText={handleDraftChange}
                  placeholder={placeholder}
                  placeholderTextColor={t.textMuted}
                  autoFocus
                  style={[
                    styles.comboSheetSearchInput,
                    {
                      borderColor: t.border,
                      backgroundColor: t.surfaceSoft,
                      color: t.text,
                      fontSize: t.textMd,
                      fontFamily: fontFamily(t),
                    },
                  ]}
                />
                <View style={[styles.comboSheetListWrap, { borderColor: t.border }]}>
                  {renderSuggestionList()}
                </View>
              </View>
            </View>
          </Modal>
        ) : null}

        {Platform.OS === 'web'
          ? createElement('input', {
              type: 'hidden',
              name: id,
              value: resolvedTags.join(','),
            })
          : null}
      </View>
    </FieldChrome>
  );
}

const styles = StyleSheet.create({
  rangeContainer: {
    gap: 8,
  },
  rangeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 4,
    gap: 6,
  },
  dateEndpointInput: {
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
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  calendarPopover: {
    borderWidth: 1,
    padding: 10,
    gap: 8,
    maxWidth: 340,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSpacer: {
    width: 44,
    height: 44,
  },
  comboContainer: {
    gap: 4,
  },
  comboInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 4,
  },
  comboInput: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 6,
  },
  comboList: {
    maxHeight: 240,
    borderWidth: 1,
  },
  groupHeader: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  optionItem: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  emptyOptionRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  comboContainerOpenWeb: {
    position: 'relative',
    zIndex: 100,
  },
  comboListDesktopWeb: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  comboListScroll: {
    maxHeight: 268,
  },
  comboStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  comboOptionCheck: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comboOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  comboCodeTag: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  comboBestMatch: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  comboOptionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comboBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  comboSpinnerWrap: {
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comboSheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    padding: 12,
  },
  comboSheetCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    maxHeight: '85%',
  },
  comboSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  comboSheetSearchInput: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  comboSheetListWrap: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  comboSheetScroll: {
    maxHeight: 320,
  },
  tagContainer: {
    position: 'relative',
    gap: 6,
  },
  tagBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  tagRemoveBtn: {
    minWidth: 44,
    minHeight: 44,
    marginVertical: -10,
    marginRight: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagDraftInput: {
    flex: 1,
    minWidth: 120,
    minHeight: 36,
    paddingVertical: 4,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
});
