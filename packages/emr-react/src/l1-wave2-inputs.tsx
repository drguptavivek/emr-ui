'use client';

import type {
  EmrDateRangePreset,
  EmrDateRangeValue,
  EmrOption,
} from '@drguptavivek/emr-controller';
import { createElement, useId, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SvgIcon } from './icons';
import { FieldChrome, type FieldValidationLine } from './l1-field-chrome';
import {
  addTagValues,
  filterOptionsLocally,
  groupOptions,
  isIsoDateInRange,
  isIsoRangeEdge,
  normalizeDateRangeSelection,
  splitTagTokens,
} from './l1-wave2.logic';
import { EmrButton } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

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
  readonly options: readonly EmrOption[];
  readonly allowCustomValue?: boolean;
  readonly placeholder?: string;
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

export function EmrCombobox({
  value = null,
  onValueChange,
  options,
  allowCustomValue = true,
  placeholder = 'Type or select…',
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
}: EmrComboboxProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-combobox-${reactId}`;

  const matchedOption = options.find((o) => o.value === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string>(
    matchedOption ? matchedOption.label : (value ?? '')
  );

  const interactive = !disabled && !readOnly;
  const displayQuery = open
    ? query
    : matchedOption
      ? matchedOption.label
      : (value ?? '');

  const filtered = filterOptionsLocally(options, open ? query : '');
  const groups = groupOptions(filtered);

  const handleTextChange = (text: string) => {
    if (!interactive) return;
    setQuery(text);
    if (!open) setOpen(true);
    if (allowCustomValue) {
      onValueChange?.(text.length > 0 ? text : null);
    }
  };

  const handleSelectOption = (opt: EmrOption) => {
    if (!interactive || opt.disabled) return;
    setQuery(opt.label);
    setOpen(false);
    onValueChange?.(opt.value);
  };

  const handleClear = () => {
    if (!interactive) return;
    setQuery('');
    setOpen(false);
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
      <View style={styles.comboContainer}>
        <View
          style={[
            styles.comboInputRow,
            {
              minHeight: Math.max(44, t.controlHeight),
              backgroundColor: readOnly ? t.surfaceSoft : t.surface,
              borderColor: error ? t.danger : open ? t.focus : t.border,
              borderRadius: 8,
              opacity: disabled ? 0.55 : 1,
            },
          ]}
        >
          <TextInput
            value={displayQuery}
            editable={interactive}
            placeholder={placeholder}
            placeholderTextColor={t.textMuted}
            accessibilityLabel={label ?? placeholder}
            onFocus={() => {
              if (interactive) {
                setQuery(matchedOption ? matchedOption.label : (value ?? ''));
              }
            }}
            onChangeText={handleTextChange}
            style={[
              styles.comboInput,
              {
                fontSize: t.textSm,
                color: t.text,
                fontFamily: fontFamily(t),
              },
            ]}
          />

          {clearable && Boolean(value || displayQuery) && interactive ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Clear ${label ?? 'combobox'}`}
              onPress={handleClear}
              style={styles.iconHit}
            >
              <SvgIcon name="close" size={15} color={t.textMuted} />
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={open ? 'Close options' : 'Open options'}
            disabled={!interactive}
            onPress={() => {
              if (interactive) {
                setQuery(matchedOption ? matchedOption.label : (value ?? ''));
                setOpen((prev) => !prev);
              }
            }}
            style={styles.iconHit}
          >
            <SvgIcon
              name={open ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={t.textMuted}
            />
          </Pressable>
        </View>

        {open && interactive ? (
          <ScrollView
            style={[
              styles.comboList,
              {
                backgroundColor: t.surface,
                borderColor: t.border,
                borderRadius: 8,
              },
            ]}
          >
            {groups.length === 0 ? (
              <View style={styles.emptyOptionRow}>
                <Text
                  style={{
                    fontSize: t.textXs,
                    color: t.textMuted,
                    fontFamily: fontFamily(t),
                  }}
                >
                  {allowCustomValue && query.trim()
                    ? `Using custom value "${query.trim()}"`
                    : 'No matching options'}
                </Text>
              </View>
            ) : (
              groups.map((grp, gIdx) => (
                <View key={grp.label ?? `ungrouped-${gIdx}`}>
                  {grp.label ? (
                    <Text
                      style={[
                        styles.groupHeader,
                        {
                          fontSize: t.text2xs,
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
                    const isSelected = opt.value === value;
                    return (
                      <Pressable
                        key={opt.value}
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: isSelected,
                          disabled: Boolean(opt.disabled),
                        }}
                        disabled={opt.disabled}
                        onPress={() => handleSelectOption(opt)}
                        style={[
                          styles.optionItem,
                          {
                            backgroundColor: isSelected
                              ? t.primarySoft
                              : 'transparent',
                            opacity: opt.disabled ? 0.45 : 1,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: t.textSm,
                              fontWeight: fontWeight(
                                isSelected ? t.weightBold : t.weightMedium
                              ),
                              color: isSelected ? t.primaryContrast : t.text,
                              fontFamily: fontFamily(t),
                            }}
                          >
                            {opt.label}
                          </Text>
                          {opt.description ? (
                            <Text
                              style={{
                                fontSize: t.textXs,
                                color: t.textMuted,
                                fontFamily: fontFamily(t),
                              }}
                            >
                              {opt.description}
                            </Text>
                          ) : null}
                        </View>
                        {isSelected ? (
                          <SvgIcon name="check" size={15} color={t.primary} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>
        ) : null}
      </View>
    </FieldChrome>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. EmrTagInput
// ─────────────────────────────────────────────────────────────

export interface EmrTagInputProps {
  readonly values?: readonly string[];
  readonly onValuesChange?: (values: readonly string[]) => void;
  readonly suggestions?: readonly string[];
  readonly delimiters?: readonly string[];
  readonly allowDuplicates?: boolean;
  readonly maxTags?: number;
  readonly placeholder?: string;
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

export function EmrTagInput({
  values = [],
  onValuesChange,
  suggestions = [],
  delimiters = [',', ';'],
  allowDuplicates = false,
  maxTags,
  placeholder = 'Add tag and press Enter…',
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
}: EmrTagInputProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-tag-input-${reactId}`;

  const [draft, setDraft] = useState('');
  const interactive = !disabled && !readOnly;
  const atLimit = maxTags !== undefined && values.length >= maxTags;

  const commitDraftTokens = (raw: string) => {
    if (!interactive) return;
    const tokens = splitTagTokens(raw, delimiters);
    if (tokens.length === 0) return;
    const next = addTagValues(values, tokens, { allowDuplicates, maxTags });
    setDraft('');
    if (next.length !== values.length) {
      onValuesChange?.(next);
    }
  };

  const handleDraftChange = (text: string) => {
    if (!interactive) return;
    const hasDelimiter = delimiters.some((d) => text.includes(d));
    if (hasDelimiter) {
      commitDraftTokens(text);
      return;
    }
    setDraft(text);
  };

  const handleRemoveIndex = (idx: number) => {
    if (!interactive) return;
    onValuesChange?.(values.filter((_, i) => i !== idx));
  };

  const handleClearAll = () => {
    if (!interactive) return;
    setDraft('');
    onValuesChange?.([]);
    onCleared?.();
  };

  const availableSuggestions = suggestions.filter(
    (s) =>
      (allowDuplicates ||
        !values.some((v) => v.toLowerCase() === s.toLowerCase())) &&
      (!draft.trim() || s.toLowerCase().includes(draft.trim().toLowerCase()))
  );

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
      <View style={styles.tagContainer}>
        <View
          style={[
            styles.tagBox,
            {
              minHeight: Math.max(44, t.controlHeight),
              backgroundColor: readOnly ? t.surfaceSoft : t.surface,
              borderColor: error ? t.danger : t.border,
              borderRadius: 8,
              opacity: disabled ? 0.55 : 1,
            },
          ]}
        >
          {values.map((tag, idx) => (
            <View
              key={`${tag}-${idx}`}
              style={[
                styles.tagChip,
                {
                  backgroundColor: t.primarySoft,
                  borderColor: t.primary,
                  borderRadius: 6,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: t.textXs,
                  fontWeight: fontWeight(t.weightMedium),
                  color: t.primaryContrast,
                  fontFamily: fontFamily(t),
                }}
              >
                {tag}
              </Text>
              {interactive ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove tag ${tag}`}
                  onPress={() => handleRemoveIndex(idx)}
                  style={styles.tagRemoveBtn}
                >
                  <SvgIcon name="close" size={12} color={t.primaryContrast} />
                </Pressable>
              ) : null}
            </View>
          ))}

          {!atLimit ? (
            <TextInput
              value={draft}
              editable={interactive}
              placeholder={values.length === 0 ? placeholder : 'Add…'}
              placeholderTextColor={t.textMuted}
              accessibilityLabel={label ?? placeholder}
              onChangeText={handleDraftChange}
              onSubmitEditing={() => commitDraftTokens(draft)}
              onKeyPress={(e) => {
                const key = (e.nativeEvent as { key?: string }).key;
                if (key === 'Enter') {
                  commitDraftTokens(draft);
                } else if (key === 'Backspace' && draft.length === 0 && values.length > 0) {
                  handleRemoveIndex(values.length - 1);
                }
              }}
              style={[
                styles.tagDraftInput,
                {
                  fontSize: t.textSm,
                  color: t.text,
                  fontFamily: fontFamily(t),
                },
              ]}
            />
          ) : null}

          {clearable && values.length > 0 && interactive ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Clear all ${label ?? 'tags'}`}
              onPress={handleClearAll}
              style={styles.iconHit}
            >
              <SvgIcon name="close" size={15} color={t.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {interactive && !atLimit && availableSuggestions.length > 0 ? (
          <View style={styles.suggestionsRow}>
            {availableSuggestions.slice(0, 8).map((sug) => (
              <EmrButton
                key={sug}
                label={`+ ${sug}`}
                variant="ghost"
                onPress={() => commitDraftTokens(sug)}
              />
            ))}
          </View>
        ) : null}

        {Platform.OS === 'web'
          ? createElement('input', {
              type: 'hidden',
              name: id,
              value: values.join(','),
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
  tagContainer: {
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
    padding: 4,
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
