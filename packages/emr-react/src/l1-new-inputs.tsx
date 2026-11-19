'use client';

import { createElement, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type PressableStateCallbackType,
  type TextInputContentSizeChangeEvent,
} from 'react-native';
import type {
  EmrCheckboxGroupLabelPlacement,
  EmrCheckboxGroupOrientation,
  EmrCheckboxGroupSize,
  EmrCheckboxGroupVariant,
  EmrFileSelectionItem,
  EmrOption,
  EmrSegmentedOption,
  EmrSegmentedOrientation,
  EmrSegmentedShape,
  EmrSegmentedSize,
  EmrSegmentedVariant,
  EmrToggleGroupLabelPlacement,
  EmrToggleGroupOrientation,
  EmrToggleGroupSize,
  EmrToggleGroupVariant,
  EmrTone,
} from '@drguptavivek/emr-controller';
import { NumberInput, ThemedInput } from './inputs-core';
import { isEmrIconName, SvgIcon, type IconName } from './icons';
import { FieldChrome } from './l1-field-chrome';
import { computePrecisionStep } from './l1-inputs.logic';
import { webProps, type WebKeyEvent } from './l1-interactive-shared';
import {
  canClearEmrSegmentedControl,
  clearCheckboxGroupValue,
  clearEmrToggleGroupValues,
  computeSelectAllState,
  formatCheckboxSelectionCount,
  formatEmrSegmentedBadge,
  groupOptions,
  isCheckboxOptionBlockedByMax,
  isCheckboxOptionLocked,
  isEmrSegmentedOptionDisabled,
  moveEmrSegmentedFocusIndex,
  normalizeCheckboxGroupVariant,
  normalizeEmrSegmentedOrientation,
  normalizeEmrSegmentedShape,
  normalizeEmrSegmentedSize,
  normalizeEmrSegmentedVariant,
  normalizeEmrToggleGroupLabelPlacement,
  normalizeEmrToggleGroupOrientation,
  normalizeEmrToggleGroupSize,
  normalizeEmrToggleGroupVariant,
  resolveEmrSegmentedSelectAction,
  resolveEmrSegmentedTabStopValue,
  resolveEmrSegmentedValidationState,
  resolveEmrToggleGroupValues,
  resolveEmrToggleStateLabel,
  toggleCheckboxGroupValue,
  toggleEmrToggleGroupValue,
  toggleSelectAllValues,
} from './l1-wave2.logic';
import { useEmrLabels } from './labels';
import { EmrOptionChip, EmrRow, EmrSelect, resolveButtonPalette, type EmrButtonSize, type EmrButtonVariant } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme, type EmrTheme } from './theme';

export type { EmrFileSelectionItem, EmrSegmentedOption };

type PressState = PressableStateCallbackType & { focused?: boolean; hovered?: boolean };
type FocusRef = ({ focus(): void } | null)[];

function withAlpha(color: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function resolveToneColor(t: EmrTheme, tone?: EmrTone): string | undefined {
  switch (tone) {
    case 'info':
      return t.info;
    case 'success':
      return t.success;
    case 'warning':
      return t.warning;
    case 'danger':
      return t.danger;
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// 1. EmrTextarea
// ---------------------------------------------------------------------------

export function EmrTextarea({
  controlId,
  label,
  labelHidden,
  value,
  rows = 3,
  maxLength,
  autoResize,
  placeholder,
  hint,
  error,
  required,
  readOnly,
  disabled,
  onFocus,
  onBlur,
  onValueChange,
}: {
  controlId?: string;
  label?: string;
  labelHidden?: boolean;
  value: string | null;
  rows?: number;
  maxLength?: number;
  autoResize?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onValueChange: (v: string | null) => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const safeRows = Math.max(2, rows);
  const minHeight = Math.max(88, Math.round(safeRows * t.textMd * t.leadingNormal + 20));
  const [measuredHeight, setMeasuredHeight] = useState<number>(minHeight);
  const textValue = value ?? '';
  const hasMessage = Boolean(hint || error);

  const handleContentSize = (e: TextInputContentSizeChangeEvent) => {
    if (!autoResize) return;
    const h = Math.ceil(e.nativeEvent.contentSize.height + 16);
    if (h > 0 && Math.abs(h - measuredHeight) > 2) {
      setMeasuredHeight(Math.max(minHeight, h));
    }
  };

  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={!label || labelHidden}
      required={required}
      hint={hint}
      error={error}
    >
      <View style={styles.textareaWrap}>
        <ThemedInput
          id={id}
          aria-labelledby={label && !labelHidden ? `${id}-label` : undefined}
          aria-describedby={hasMessage ? `${id}-message` : undefined}
          aria-label={label ? (required ? `${label}, ${labels.required}` : label) : placeholder ?? 'Text'}
          multiline
          numberOfLines={safeRows}
          maxLength={maxLength}
          placeholder={placeholder}
          value={textValue}
          invalid={Boolean(error)}
          readOnly={Boolean(readOnly)}
          editable={!disabled && !readOnly}
          onFocus={() => onFocus?.()}
          onBlur={() => onBlur?.()}
          onContentSizeChange={autoResize ? handleContentSize : undefined}
          onChangeText={next => onValueChange(next === '' ? null : next)}
          style={autoResize ? { minHeight: Math.max(minHeight, measuredHeight) } : { minHeight }}
        />
        {maxLength !== undefined ? (
          <Text
            style={[
              styles.charCount,
              {
                color: textValue.length >= maxLength ? t.warning : t.textMuted,
                fontSize: t.text2xs,
                fontFamily: fontFamily(t),
              },
            ]}
          >
            {textValue.length} / {maxLength}
          </Text>
        ) : null}
      </View>
    </FieldChrome>
  );
}

// ---------------------------------------------------------------------------
// 2. EmrIconButton
// ---------------------------------------------------------------------------

export function EmrIconButton({
  controlId,
  ariaLabel,
  icon,
  children,
  variant = 'ghost',
  size = 'md',
  pressed: toggledPressed,
  loading,
  disabled,
  onPress,
}: {
  controlId?: string;
  ariaLabel: string;
  icon?: IconName | string;
  children?: ReactNode;
  variant?: EmrButtonVariant;
  size?: EmrButtonSize;
  pressed?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const t = useEmrTheme();
  const dim = Math.max(44, size === 'lg' ? 48 : t.controlHeight);
  const iconPx = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;
  const inert = Boolean(disabled || loading);

  return (
    <Pressable
      id={controlId}
      role="button"
      aria-label={ariaLabel}
      aria-pressed={toggledPressed}
      aria-busy={loading || undefined}
      aria-disabled={inert || undefined}
      disabled={disabled}
      onPress={inert ? undefined : onPress}
      style={({ pressed, focused }: PressState) => {
        const activePress = Boolean((pressed || toggledPressed) && !inert);
        const palette = resolveButtonPalette(t, variant, activePress);
        return [
          styles.iconButton,
          focusRing(t, focused),
          {
            width: dim,
            minWidth: dim,
            minHeight: dim,
            alignSelf: 'flex-start',
            backgroundColor: toggledPressed && variant === 'ghost' ? t.primarySoft : palette.backgroundColor,
            borderColor: toggledPressed ? t.primary : palette.borderColor,
            opacity: disabled ? 0.6 : 1,
          },
        ];
      }}
    >
      {({ pressed }: PressState) => {
        const activePress = Boolean((pressed || toggledPressed) && !inert);
        const palette = resolveButtonPalette(t, variant, activePress);
        const fg = toggledPressed && variant === 'ghost' ? t.primary : palette.textColor;
        if (loading) return <ActivityIndicator size="small" color={fg} />;
        if (children !== undefined && children !== null) {
          return typeof children === 'string' || typeof children === 'number' ? (
            <Text aria-hidden style={{ color: fg, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
              {children}
            </Text>
          ) : (
            <>{children}</>
          );
        }
        if (icon && isEmrIconName(icon)) {
          return <SvgIcon name={icon} size={iconPx} color={fg} />;
        }
        if (icon) {
          return (
            <Text aria-hidden style={{ color: fg, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
              {icon}
            </Text>
          );
        }
        return null;
      }}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// 3. EmrSegmentedControl & EmrToggleGroup
// ---------------------------------------------------------------------------

export function EmrSegmentedControl({
  controlId,
  label,
  labelHidden,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  options,
  value,
  size = 'md',
  variant = 'default',
  shape = 'default',
  orientation = 'horizontal',
  fullWidth,
  clearable,
  clearLabel,
  allowDeselect,
  name,
  required,
  invalid,
  hasWarning,
  warning,
  readOnly,
  disabled,
  hint,
  error,
  onValueChange,
  onCleared,
  onFocus,
  onFocused,
  onBlur,
  onBlurred,
}: {
  controlId?: string;
  label?: string;
  labelHidden?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  options: readonly EmrSegmentedOption[];
  value: string | null;
  size?: EmrSegmentedSize;
  variant?: EmrSegmentedVariant;
  shape?: EmrSegmentedShape;
  orientation?: EmrSegmentedOrientation;
  fullWidth?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  allowDeselect?: boolean;
  name?: string;
  required?: boolean;
  invalid?: boolean;
  hasWarning?: boolean;
  warning?: string;
  readOnly?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  onValueChange: (v: string | null) => void;
  onCleared?: () => void;
  onFocus?: () => void;
  onFocused?: () => void;
  onBlur?: () => void;
  onBlurred?: () => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const refs = useRef<FocusRef>([]);
  const groupRef = useRef<unknown>(null);
  const focusActiveRef = useRef(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeFocusValue, setActiveFocusValue] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onDocKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== ' ' && ev.key !== 'Spacebar') return;
      const active = document.activeElement as HTMLElement | null;
      if (focusActiveRef.current || active?.getAttribute?.('role') === 'radio') {
        ev.preventDefault();
      }
    };
    document.addEventListener('keydown', onDocKeyDown, true);
    return () => document.removeEventListener('keydown', onDocKeyDown, true);
  }, []);

  const resolvedSize = normalizeEmrSegmentedSize(size);
  const resolvedVariant = normalizeEmrSegmentedVariant(variant);
  const resolvedShape = normalizeEmrSegmentedShape(shape);
  const resolvedOrientation = normalizeEmrSegmentedOrientation(orientation);
  const validation = resolveEmrSegmentedValidationState({ error, warning, invalid, hasWarning });
  const showClear = canClearEmrSegmentedControl({ clearable, value, disabled, readOnly });
  const resolvedClearLabel = clearLabel ?? labels.clear;
  const tabStopValue = resolveEmrSegmentedTabStopValue(options, activeFocusValue ?? value, disabled);
  const hasMessage = Boolean(hint || warning || error);
  const computedDescribedBy = [ariaDescribedBy, hasMessage ? `${id}-message` : undefined].filter(Boolean).join(' ') || undefined;

  const handleChildFocus = () => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    if (!focusActiveRef.current) {
      focusActiveRef.current = true;
      onFocus?.();
      onFocused?.();
    }
  };

  const handleChildBlur = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => {
      focusActiveRef.current = false;
      onBlur?.();
      onBlurred?.();
    }, 0);
  };

  const handleSelect = (opt: EmrSegmentedOption) => {
    setActiveFocusValue(opt.value);
    const action = resolveEmrSegmentedSelectAction({
      option: opt,
      currentValue: value,
      allowDeselect,
      groupDisabled: disabled,
      groupReadOnly: readOnly,
    });
    if (action.kind === 'select') {
      onValueChange(action.value);
    } else if (action.kind === 'clear') {
      onValueChange(null);
      onCleared?.();
    }
  };

  const handleKeyDown = (
    e: {
      key?: string;
      preventDefault?: () => void;
      nativeEvent?: { preventDefault?: () => void };
      stopPropagation?: () => void;
    },
    index: number,
    opt: EmrSegmentedOption,
  ) => {
    const key = e.key ?? '';
    if (key === ' ' || key === 'Spacebar' || key === 'Enter') {
      e.preventDefault?.();
      e.nativeEvent?.preventDefault?.();
      e.stopPropagation?.();
      handleSelect(opt);
      return;
    }
    if (
      key !== 'ArrowLeft' &&
      key !== 'ArrowRight' &&
      key !== 'ArrowUp' &&
      key !== 'ArrowDown' &&
      key !== 'Home' &&
      key !== 'End'
    ) {
      return;
    }
    const target = moveEmrSegmentedFocusIndex(options, index, key, disabled);
    if (target < 0) return;
    const chosen = options[target];
    if (!chosen) return;
    e.preventDefault?.();
    e.nativeEvent?.preventDefault?.();
    e.stopPropagation?.();
    setActiveFocusValue(chosen.value);
    if (!readOnly && !disabled && !chosen.readOnly) {
      onValueChange(chosen.value);
    }
    refs.current[target]?.focus();
  };

  const trackBg =
    resolvedVariant === 'outline'
      ? 'transparent'
      : resolvedVariant === 'soft'
        ? withAlpha(t.primary, 0.08)
        : t.surfaceRaised;

  const trackBorder = validation.isInvalid
    ? t.danger
    : validation.hasWarning
      ? t.warning
      : resolvedVariant === 'soft'
        ? 'transparent'
        : t.border;

  const clearButton = showClear ? (
    <Pressable
      role="button"
      aria-label={`${resolvedClearLabel} ${ariaLabel ?? label ?? 'selection'}`}
      {...(Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : {})}
      onPress={() => {
        if (disabled || readOnly) return;
        onValueChange(null);
        onCleared?.();
      }}
      onFocus={handleChildFocus}
      onBlur={handleChildBlur}
      style={({ hovered, pressed, focused }: PressState) => [
        focusRing(t, focused),
        {
          minHeight: 44,
          minWidth: 44,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 7,
          borderWidth: 1,
          borderColor: t.border,
          backgroundColor: pressed ? t.surfaceRaised : hovered ? t.surfaceSoft : 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
      ]}
    >
      <SvgIcon name="close" size={14} color={t.textMuted} />
      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
        {resolvedClearLabel}
      </Text>
    </Pressable>
  ) : null;

  const control = (
    <View style={{ gap: 6, maxWidth: '100%', alignSelf: fullWidth || resolvedOrientation === 'vertical' ? 'stretch' : 'flex-start' }}>
      {clearButton ? (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          {clearButton}
        </View>
      ) : null}
      <View
        ref={groupRef as never}
        nativeID={id}
        role="radiogroup"
        aria-labelledby={ariaLabelledBy || (!ariaLabel && label && !labelHidden ? `${id}-label` : undefined)}
        aria-label={ariaLabel ?? (!ariaLabelledBy && (labelHidden || !label) ? (label || 'Segmented options') : undefined)}
        aria-required={required || undefined}
        aria-readonly={readOnly || undefined}
        aria-disabled={disabled || undefined}
        aria-orientation={resolvedOrientation}
        aria-invalid={validation.isInvalid ? true : undefined}
        aria-describedby={computedDescribedBy}
        {...(Platform.OS === 'web'
          ? webProps({
              ...(name ? { 'data-name': name } : {}),
              onKeyDownCapture: (e: { key?: string; preventDefault?: () => void }) => {
                if (e.key === ' ' || e.key === 'Spacebar') {
                  e.preventDefault?.();
                }
              },
            })
          : {})}
        style={[
          styles.segmentedGroup,
          resolvedOrientation === 'vertical' && styles.segmentedGroupVertical,
          resolvedShape === 'pill' && { borderRadius: 9999 },
          {
            borderColor: trackBorder,
            borderStyle: readOnly ? 'dashed' : 'solid',
            backgroundColor: trackBg,
            opacity: disabled ? 0.56 : 1,
          },
        ]}
      >
        {options.map((opt, idx) => {
          const selected = opt.value === value;
          const optDisabled = isEmrSegmentedOptionDisabled(opt, disabled);
          const optReadOnly = Boolean(readOnly || opt.readOnly);
          const toneColor = resolveToneColor(t, opt.tone);
          const badge = formatEmrSegmentedBadge(opt.badge, opt.tone);
          const badgeColor = badge ? (resolveToneColor(t, badge.tone) ?? t.textMuted) : t.textMuted;
          const activeColor = toneColor ?? t.primary;
          const isTabStop = tabStopValue === opt.value;

          return (
            <Pressable
              key={opt.value}
              ref={el => {
                refs.current[idx] = el;
              }}
              role="radio"
              aria-label={opt.ariaLabel}
              aria-checked={selected}
              aria-disabled={optDisabled || undefined}
              aria-readonly={optReadOnly || undefined}
              disabled={optDisabled}
              onFocus={handleChildFocus}
              onBlur={handleChildBlur}
              onPress={!optDisabled && !optReadOnly ? () => handleSelect(opt) : undefined}
              {...(Platform.OS === 'web'
                ? ({
                    tabIndex: isTabStop ? 0 : -1,
                    onKeyDown: (e: {
                      key?: string;
                      preventDefault?: () => void;
                      nativeEvent?: { preventDefault?: () => void };
                      stopPropagation?: () => void;
                    }) => handleKeyDown(e, idx, opt),
                  } as object)
                : {})}
              style={({ hovered, pressed, focused }: PressState) => [
                styles.segmentBtn,
                fullWidth && resolvedOrientation !== 'vertical' && styles.segmentBtnFullWidth,
                resolvedOrientation === 'vertical' && styles.segmentBtnVertical,
                resolvedShape === 'pill' && { borderRadius: 9999 },
                resolvedSize === 'sm' && { paddingHorizontal: 10, paddingVertical: 4, gap: 4 },
                resolvedSize === 'lg' && { paddingHorizontal: 14, paddingVertical: 8 },
                opt.description ? { paddingVertical: 8 } : null,
                focusRing(t, focused),
                {
                  minHeight: resolvedSize === 'lg' ? 48 : 44,
                  minWidth: resolvedSize === 'lg' ? 48 : 44,
                  backgroundColor: selected
                    ? t.surface
                    : !optDisabled && !optReadOnly && pressed
                      ? t.surfaceSoft
                      : !optDisabled && !optReadOnly && hovered
                        ? withAlpha(t.surface, 0.72)
                        : 'transparent',
                  borderColor: selected ? activeColor : 'transparent',
                  borderStyle: optReadOnly ? 'dashed' : 'solid',
                  opacity: opt.disabled && !disabled ? 0.52 : 1,
                },
              ]}
            >
              {opt.icon && isEmrIconName(opt.icon) ? (
                <SvgIcon
                  name={opt.icon as IconName}
                  size={resolvedSize === 'sm' ? 13 : 15}
                  color={selected ? activeColor : t.textMuted}
                />
              ) : null}
              <View style={opt.description ? { alignItems: 'flex-start', gap: 1 } : undefined}>
                <Text
                  style={{
                    color: selected ? activeColor : t.text,
                    fontSize: resolvedSize === 'sm' ? t.textSm : t.textMd,
                    fontWeight: fontWeight(selected ? t.weightBold : t.weightMedium),
                    fontFamily: fontFamily(t),
                  }}
                >
                  {opt.label}
                </Text>
                {opt.description ? (
                  <Text
                    style={{
                      color: t.textMuted,
                      fontSize: t.textXs,
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {opt.description}
                  </Text>
                ) : null}
              </View>
              {badge ? (
                <View
                  style={[
                    styles.segmentBadge,
                    {
                      backgroundColor:
                        badge.variant === 'solid'
                          ? badgeColor
                          : badge.variant === 'outline'
                            ? 'transparent'
                            : withAlpha(badgeColor, 0.14),
                      borderWidth: badge.variant === 'outline' ? 1 : 0,
                      borderColor: badge.variant === 'outline' ? badgeColor : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: badge.variant === 'solid' ? t.primaryContrast : badgeColor,
                      fontSize: t.text2xs,
                      fontWeight: fontWeight(t.weightBold),
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {badge.text}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  if (!label && !hasMessage) return control;
  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={!label || labelHidden}
      required={required}
      hint={labelHidden ? undefined : hint}
      warning={labelHidden ? undefined : warning}
      error={labelHidden ? undefined : error}
    >
      {control}
    </FieldChrome>
  );
}

/**
 * L1 multi-select or single-select toggle button group (`role="group"`, `aria-pressed` per button).
 */
export function EmrToggleGroup({
  controlId,
  label,
  labelHidden,
  ariaLabel,
  options,
  multiple,
  value,
  values,
  allowEmpty = true,
  variant = 'tile',
  size = 'md',
  orientation = 'vertical',
  columns = 2,
  labelPlacement = 'space-between',
  showStateLabels = false,
  onLabel = 'On',
  offLabel = 'Off',
  showSelectAll = false,
  selectAllLabel = 'Enable all',
  exclusiveValues = [],
  minSelections: _minSelections,
  maxSelections,
  showSelectionCount = false,
  clearable = false,
  clearLabel = 'Clear',
  required,
  readOnly,
  disabled,
  invalid,
  warning,
  error,
  hint,
  onValueChange,
  onValuesChange,
  onCleared,
  onFocused,
  onBlurred,
}: {
  controlId?: string;
  label?: string;
  labelHidden?: boolean;
  ariaLabel?: string;
  options: readonly EmrOption[];
  multiple?: boolean;
  value?: readonly string[] | string | null;
  values?: readonly string[];
  allowEmpty?: boolean;
  variant?: EmrToggleGroupVariant | 'standard';
  size?: EmrToggleGroupSize | 'lg';
  orientation?: EmrToggleGroupOrientation;
  columns?: number;
  labelPlacement?: EmrToggleGroupLabelPlacement;
  showStateLabels?: boolean;
  onLabel?: string;
  offLabel?: string;
  showSelectAll?: boolean;
  selectAllLabel?: string;
  exclusiveValues?: readonly string[];
  minSelections?: number;
  maxSelections?: number;
  showSelectionCount?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  warning?: string;
  error?: string;
  hint?: string;
  onValueChange?: ((v: readonly string[]) => void) | ((v: string | null) => void);
  onValuesChange?: (v: readonly string[]) => void;
  onCleared?: () => void;
  onFocused?: () => void;
  onBlurred?: () => void;
}) {
  const t = useEmrTheme();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const { width: windowWidth } = useWindowDimensions();

  const isMulti =
    multiple !== undefined
      ? multiple
      : typeof value === 'string' || (value === null && values === undefined && onValuesChange === undefined)
        ? false
        : true;

  const selectedList = resolveEmrToggleGroupValues({
    value,
    values,
    multiple: isMulti,
  });
  const selectedSet = new Set(selectedList);

  const normalizedVariant = normalizeEmrToggleGroupVariant(variant);
  const normalizedSize = normalizeEmrToggleGroupSize(size === 'lg' ? 'md' : size);
  const normalizedOrientation = normalizeEmrToggleGroupOrientation(orientation);
  const normalizedPlacement = normalizeEmrToggleGroupLabelPlacement(labelPlacement);
  const isSm = normalizedSize === 'sm';
  const isInvalid = Boolean(invalid || error);
  const hasWarning = Boolean(!isInvalid && warning);
  const hasMessage = Boolean(!labelHidden && (hint || warning || error));
  const isNarrow = windowWidth > 0 && windowWidth <= 480;
  const resolvedColumns =
    normalizedOrientation === 'grid' ? (isNarrow ? 1 : Math.max(1, columns ?? 2)) : columns;

  const optionGroups = groupOptions(options);
  const selectAllState = computeSelectAllState(selectedList, options, exclusiveValues);
  const hasClearableSelection = options.some(
    o => selectedSet.has(o.value) && !isCheckboxOptionLocked(o)
  );
  const showClear = Boolean(clearable && !readOnly && !disabled && hasClearableSelection);

  const focusActiveRef = useRef(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChildFocus = () => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    if (!focusActiveRef.current) {
      focusActiveRef.current = true;
      onFocused?.();
    }
  };

  const handleChildBlur = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => {
      focusActiveRef.current = false;
      onBlurred?.();
    }, 0);
  };

  const emitSelection = (next: readonly string[]) => {
    onValuesChange?.(next);
    (onValueChange as ((v: unknown) => void) | undefined)?.(isMulti ? next : (next[0] ?? null));
  };

  const toggleItem = (itemValue: string) => {
    const opt = options.find(o => o.value === itemValue);
    if (disabled || readOnly || (opt && isCheckboxOptionLocked(opt))) return;
    const next = toggleEmrToggleGroupValue({
      current: selectedList,
      toggledValue: itemValue,
      options,
      multiple: isMulti,
      allowEmpty,
      exclusiveValues,
      maxSelections,
    });
    if (next !== selectedList) {
      emitSelection(next);
      if (!isMulti && next.length === 0) {
        onCleared?.();
      }
    }
  };

  const handleSelectAll = () => {
    if (disabled || readOnly || !isMulti) return;
    emitSelection(
      toggleSelectAllValues(selectedList, options, {
        exclusiveValues,
        maxSelections,
      })
    );
  };

  const handleClear = () => {
    if (disabled || readOnly) return;
    const next = clearEmrToggleGroupValues(selectedList, options);
    emitSelection(next);
    onCleared?.();
  };

  const minHeight = size === 'lg' ? 48 : Math.max(44, t.controlHeight);
  const trackStyle = isSm
    ? { width: 38, height: 22, borderRadius: 11, padding: 2 }
    : { width: 42, height: 24, borderRadius: 12, padding: 2 };
  const thumbStyle = isSm
    ? { width: 16, height: 16, borderRadius: 8 }
    : { width: 18, height: 18, borderRadius: 9 };
  const thumbShadow =
    Platform.OS === 'web'
      ? ({ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)' } as Record<string, unknown>)
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.22,
          shadowRadius: 2,
          elevation: 2,
        };

  const renderSwitchRow = (opt: EmrOption) => {
    const active = selectedSet.has(opt.value);
    const blockedByMax =
      isMulti && isCheckboxOptionBlockedByMax(opt.value, selectedList, maxSelections);
    const optDisabled = Boolean(disabled || opt.disabled || blockedByMax);
    const optReadOnly = Boolean(readOnly || opt.readOnly);
    const interactive = !optDisabled && !optReadOnly;
    const toneColor = resolveToneColor(t, opt.tone);
    const badge = formatEmrSegmentedBadge(opt.badge, opt.tone);
    const stateText = resolveEmrToggleStateLabel(active, onLabel, offLabel);
    const isCard = normalizedVariant === 'card';
    const isInline = normalizedVariant === 'inline';

    const rowBg = isInline
      ? 'transparent'
      : active
        ? (toneColor ? withAlpha(toneColor, 0.1) : t.primarySoft)
        : optReadOnly
          ? t.surfaceSoft
          : t.surface;

    const rowBorder = isInline
      ? 'transparent'
      : isInvalid
        ? t.danger
        : hasWarning
          ? t.warning
          : active
            ? (toneColor ?? t.primary)
            : t.border;

    const trackNode = (
      <View style={styles.toggleCluster}>
        <View
          aria-hidden
          style={[
            styles.toggleTrack,
            trackStyle,
            {
              borderColor: isInvalid ? t.danger : hasWarning ? t.warning : 'transparent',
              backgroundColor: active ? t.primary : t.border,
              alignItems: active ? 'flex-end' : 'flex-start',
            },
          ]}
        >
          <View style={[styles.toggleThumb, thumbStyle, thumbShadow, { backgroundColor: t.surface }]} />
        </View>
        {showStateLabels ? (
          <Text
            style={{
              color: active ? t.primary : t.textMuted,
              fontSize: t.textXs,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: fontFamily(t),
            }}
          >
            {stateText}
          </Text>
        ) : null}
      </View>
    );

    const copyNode = (
      <View style={[styles.toggleCopy, isInline && normalizedPlacement !== 'space-between' && { flexGrow: 0, flexShrink: 1 }]}>
        <View style={styles.toggleTitleRow}>
          {opt.icon && isEmrIconName(opt.icon) ? (
            <SvgIcon name={opt.icon} size={15} color={active ? t.primary : t.textMuted} />
          ) : null}
          <Text
            style={{
              color: t.text,
              fontSize: isSm ? t.textSm : t.textMd,
              fontWeight: fontWeight(active ? t.weightBold : t.weightMedium),
              fontFamily: fontFamily(t),
              flexShrink: 1,
            }}
          >
            {opt.label}
          </Text>
          {opt.readOnly ? (
            <SvgIcon name="lock" size={12} color={t.textMuted} />
          ) : null}
          {badge ? (
            <View
              style={[
                styles.segmentBadge,
                {
                  backgroundColor: withAlpha(resolveToneColor(t, badge.tone) ?? t.textMuted, 0.14),
                },
              ]}
            >
              <Text
                style={{
                  color: resolveToneColor(t, badge.tone) ?? t.textMuted,
                  fontSize: t.text2xs,
                  fontWeight: fontWeight(t.weightBold),
                  fontFamily: fontFamily(t),
                }}
              >
                {badge.text}
              </Text>
            </View>
          ) : null}
        </View>
        {opt.description ? (
          <Text
            style={{
              color: t.textMuted,
              fontSize: t.textXs,
              fontFamily: fontFamily(t),
            }}
          >
            {opt.description}
          </Text>
        ) : null}
      </View>
    );

    const flexDirection =
      normalizedPlacement === 'end' ? 'row' : 'row-reverse';
    const justifyContent =
      normalizedPlacement === 'space-between' ? 'space-between' : 'flex-start';

    return (
      <Pressable
        key={opt.value}
        role="switch"
        aria-checked={active}
        aria-disabled={optDisabled || undefined}
        aria-readonly={optReadOnly || undefined}
        disabled={optDisabled}
        onFocus={handleChildFocus}
        onBlur={handleChildBlur}
        onPress={interactive ? () => toggleItem(opt.value) : undefined}
        {...webProps({
          onKeyDown: (e: WebKeyEvent) => {
            if (!interactive) return;
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              toggleItem(opt.value);
            }
          },
        })}
        style={({ hovered, pressed, focused }: PressState) => [
          styles.toggleGroupRow,
          focusRing(t, focused),
          {
            minHeight,
            minWidth: 44,
            flexDirection,
            justifyContent,
            alignItems: isCard && opt.description ? 'flex-start' : 'center',
            paddingHorizontal: isInline ? 4 : isSm ? 10 : 12,
            paddingVertical: isSm ? 8 : 10,
            borderWidth: isInline ? 0 : 1,
            borderStyle: optReadOnly && !isInline ? 'dashed' : 'solid',
            borderRadius: isCard ? 9 : 8,
            borderColor: hovered && interactive && !active && !isInline ? t.focus : rowBorder,
            backgroundColor:
              hovered && interactive && !active && !isInline
                ? t.surfaceSoft
                : pressed && interactive && !isInline
                  ? t.surfaceRaised
                  : rowBg,
            opacity: optDisabled && !disabled ? 0.5 : 1,
            width:
              normalizedOrientation === 'vertical' ||
              normalizedOrientation === 'grid' ||
              (isInline && normalizedPlacement === 'space-between')
                ? '100%'
                : undefined,
          },
        ]}
      >
        {trackNode}
        {copyNode}
      </Pressable>
    );
  };

  const groupNode = (
    <View
      id={id}
      role="group"
      aria-labelledby={!ariaLabel && label && !labelHidden ? `${id}-label` : undefined}
      aria-label={ariaLabel ?? (label || 'Toggle group')}
      aria-describedby={hasMessage ? `${id}-message` : undefined}
      aria-required={required || undefined}
      aria-readonly={readOnly || undefined}
      aria-disabled={disabled || undefined}
      aria-invalid={isInvalid ? true : undefined}
      style={[styles.checkboxGroupStack, { opacity: disabled ? 0.6 : 1 }]}
    >
      {!labelHidden && (showSelectionCount || showClear) ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          {showSelectionCount ? (
            <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
              {formatCheckboxSelectionCount(selectedList, maxSelections)}
            </Text>
          ) : (
            <View />
          )}
          {showClear ? (
            <Pressable
              role="button"
              aria-label={`${clearLabel} ${label || ariaLabel || 'selection'}`}
              onPress={handleClear}
              onFocus={handleChildFocus}
              onBlur={handleChildBlur}
              style={({ focused }: PressState) => [
                focusRing(t, focused),
                {
                  minHeight: 44,
                  minWidth: 44,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 7,
                  borderWidth: 1,
                  borderColor: t.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                },
              ]}
            >
              <SvgIcon name="close" size={14} color={t.textMuted} />
              <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
                {clearLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showSelectAll && isMulti ? (
        <Pressable
          role="checkbox"
          aria-checked={selectAllState === 'all' ? true : selectAllState === 'mixed' ? 'mixed' : false}
          aria-disabled={disabled || undefined}
          aria-readonly={readOnly || undefined}
          disabled={disabled}
          onFocus={handleChildFocus}
          onBlur={handleChildBlur}
          onPress={readOnly ? undefined : handleSelectAll}
          {...webProps({
            onKeyDown: (e: WebKeyEvent) => {
              if (readOnly || disabled) return;
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleSelectAll();
              }
            },
          })}
          style={({ focused }: PressState) => [
            styles.selectAllRow,
            focusRing(t, focused),
            {
              minHeight: Math.max(44, t.controlHeight),
              borderColor: selectAllState !== 'none' ? t.primary : t.border,
              backgroundColor: selectAllState === 'all' ? t.primarySoft : t.surfaceSoft,
              opacity: disabled ? 0.6 : 1,
            },
          ]}
        >
          <View
            aria-hidden
            style={[
              styles.selectAllBox,
              {
                width: isSm ? 16 : 18,
                height: isSm ? 16 : 18,
                borderColor: selectAllState !== 'none' ? t.primary : t.border,
                backgroundColor: selectAllState === 'all' ? t.primary : t.surface,
              },
            ]}
          >
            {selectAllState === 'all' ? (
              <SvgIcon name="check" size={isSm ? 10 : 12} color={t.surface} />
            ) : selectAllState === 'mixed' ? (
              <SvgIcon name="minus" size={isSm ? 10 : 12} color={t.primary} />
            ) : null}
          </View>
          <Text
            style={{
              color: t.text,
              fontSize: t.textSm,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: fontFamily(t),
            }}
          >
            {selectAllLabel}
          </Text>
        </Pressable>
      ) : null}

      {optionGroups.map(grp => (
        <View key={grp.label ?? '__ungrouped'} style={{ gap: 6 }}>
          {grp.label ? (
            <Text
              style={{
                color: t.textMuted,
                fontSize: t.textXs,
                fontWeight: fontWeight(t.weightBold),
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontFamily: fontFamily(t),
                marginTop: 4,
              }}
            >
              {grp.label}
            </Text>
          ) : null}
          {normalizedOrientation === 'grid' && Platform.OS === 'web' ? (
            <View
              style={
                {
                  display: 'grid',
                  gridTemplateColumns: isNarrow
                    ? 'minmax(0, 1fr)'
                    : `repeat(${Math.max(1, columns ?? 2)}, minmax(0, 1fr))`,
                  gap: 8,
                  width: '100%',
                  minWidth: 0,
                  maxWidth: '100%',
                } as Record<string, unknown>
              }
            >
              {grp.options.map(renderSwitchRow)}
            </View>
          ) : (
            <EmrRow
              single={normalizedOrientation === 'vertical' || (normalizedOrientation === 'grid' && isNarrow)}
              columns={resolvedColumns}
            >
              {grp.options.map(renderSwitchRow)}
            </EmrRow>
          )}
        </View>
      ))}
    </View>
  );

  if (!label && !hint && !warning && !error) return groupNode;
  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={!label || labelHidden}
      required={required}
      hint={labelHidden ? undefined : hint}
      warning={labelHidden ? undefined : warning}
      error={labelHidden ? undefined : error}
    >
      {groupNode}
    </FieldChrome>
  );
}

// ---------------------------------------------------------------------------
// 4. EmrSearchInput
// ---------------------------------------------------------------------------

export function EmrSearchInput({
  controlId,
  label,
  labelHidden,
  value,
  placeholder,
  loading,
  readOnly,
  disabled,
  hint,
  error,
  onValueChange,
  onSubmit,
  onClear,
}: {
  controlId?: string;
  label?: string;
  labelHidden?: boolean;
  value: string | null;
  placeholder?: string;
  loading?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  onValueChange: (v: string | null) => void;
  onSubmit?: (v: string | null) => void;
  onClear?: () => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const [focused, setFocused] = useState(false);
  const textValue = value ?? '';
  const canEdit = !disabled && !readOnly;
  const minHeight = Math.max(44, t.controlHeight);

  const bar = (
    <View
      style={[
        styles.adornedBox,
        focusRing(t, focused),
        {
          minHeight,
          borderColor: focused ? t.focus : error ? t.danger : t.border,
          backgroundColor: disabled ? t.surfaceRaised : readOnly ? t.surfaceSoft : t.surface,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View aria-hidden style={styles.leadingIcon}>
        <SvgIcon name="search" size={16} color={t.textMuted} />
      </View>
      <TextInput
        id={id}
        role="searchbox"
        aria-label={label ?? placeholder ?? 'Search'}
        aria-invalid={error ? true : undefined}
        aria-readonly={readOnly}
        value={textValue}
        placeholder={placeholder ?? 'Search…'}
        placeholderTextColor={t.textMuted}
        editable={canEdit}
        readOnly={readOnly}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChangeText={next => onValueChange(next === '' ? null : next)}
        onSubmitEditing={() => onSubmit?.(textValue === '' ? null : textValue)}
        style={[
          styles.innerInput,
          {
            minHeight,
            color: t.text,
            fontSize: t.textMd,
            fontFamily: fontFamily(t),
          },
        ]}
      />
      {loading ? (
        <View style={styles.trailingSpinner}>
          <ActivityIndicator size="small" color={t.primary} />
        </View>
      ) : null}
      {textValue.length > 0 && canEdit ? (
        <Pressable
          role="button"
          aria-label={labels.clear}
          onPress={() => {
            onValueChange(null);
            onClear?.();
          }}
          style={({ pressed, focused: btnFocused }: PressState) => [
            styles.adornBtn,
            focusRing(t, btnFocused),
            {
              minWidth: 44,
              minHeight,
              backgroundColor: pressed ? t.surfaceRaised : 'transparent',
            },
          ]}
        >
          <SvgIcon name="close" size={16} color={t.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );

  if (!label && !hint && !error) return bar;
  return (
    <FieldChrome controlId={id} label={label} labelHidden={!label || labelHidden} hint={hint} error={error}>
      {bar}
    </FieldChrome>
  );
}

// ---------------------------------------------------------------------------
// 5. EmrPasswordInput
// ---------------------------------------------------------------------------

export function EmrPasswordInput({
  controlId,
  label,
  labelHidden,
  value,
  placeholder,
  autoComplete,
  required,
  readOnly,
  disabled,
  hint,
  error,
  onBlur,
  onValueChange,
}: {
  controlId?: string;
  label?: string;
  labelHidden?: boolean;
  value: string | null;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  onBlur?: () => void;
  onValueChange: (v: string | null) => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);
  const canEdit = !disabled && !readOnly;
  const minHeight = Math.max(44, t.controlHeight);
  const resolvedLabel = label ?? 'Password';

  const box = (
    <View
      style={[
        styles.adornedBox,
        focusRing(t, focused),
        {
          minHeight,
          borderColor: focused ? t.focus : error ? t.danger : t.border,
          backgroundColor: disabled ? t.surfaceRaised : readOnly ? t.surfaceSoft : t.surface,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <TextInput
        id={id}
        aria-label={required ? `${resolvedLabel}, ${labels.required}` : resolvedLabel}
        aria-invalid={error ? true : undefined}
        aria-required={required}
        aria-readonly={readOnly}
        secureTextEntry={!revealed}
        value={value ?? ''}
        placeholder={placeholder}
        placeholderTextColor={t.textMuted}
        editable={canEdit}
        readOnly={readOnly}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        {...(autoComplete ? ({ autoComplete } as object) : null)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        onChangeText={next => onValueChange(next === '' ? null : next)}
        style={[
          styles.innerInput,
          styles.passwordPadding,
          {
            minHeight,
            color: t.text,
            fontSize: t.textMd,
            fontFamily: fontFamily(t),
          },
        ]}
      />
      <Pressable
        role="button"
        aria-label={revealed ? 'Hide password' : 'Show password'}
        aria-pressed={revealed}
        disabled={disabled}
        onPress={() => setRevealed(r => !r)}
        style={({ pressed, focused: btnFocused }: PressState) => [
          styles.revealBtn,
          focusRing(t, btnFocused),
          {
            minWidth: 56,
            minHeight,
            borderLeftColor: t.border,
            backgroundColor: pressed ? t.surfaceRaised : t.surfaceSoft,
          },
        ]}
      >
        <Text
          style={{
            color: t.primary,
            fontSize: t.textXs,
            fontWeight: fontWeight(t.weightBold),
            fontFamily: fontFamily(t),
          }}
        >
          {revealed ? 'Hide' : 'Show'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={!label || labelHidden}
      required={required}
      hint={hint}
      error={error}
    >
      {box}
    </FieldChrome>
  );
}

// ---------------------------------------------------------------------------
// 6. EmrNumericStepper
// ---------------------------------------------------------------------------

export function EmrNumericStepper({
  controlId,
  label,
  labelHidden,
  value,
  min,
  max,
  step,
  precision,
  unit,
  required,
  readOnly,
  disabled,
  hint,
  error,
  onValueChange,
}: {
  controlId?: string;
  label?: string;
  labelHidden?: boolean;
  value: number | null;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  unit?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  onValueChange: (v: number | null) => void;
}) {
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const resolvedStep = step ?? (precision !== undefined ? computePrecisionStep('decimal', precision) : 1);
  const integer = precision === 0 || (precision === undefined && Number.isInteger(resolvedStep));
  const hasMessage = Boolean(hint || error);

  const stepper = (
    <NumberInput
      id={id}
      aria-labelledby={label && !labelHidden ? `${id}-label` : undefined}
      aria-describedby={hasMessage ? `${id}-message` : undefined}
      aria-label={label ? (required ? `${label}, ${labels.required}` : label) : 'Numeric value'}
      value={value ?? undefined}
      integer={integer}
      min={min}
      max={max}
      step={resolvedStep}
      unit={unit}
      invalid={Boolean(error)}
      readOnly={Boolean(readOnly)}
      editable={!disabled && !readOnly}
      onNumber={onValueChange}
    />
  );

  if (!label && !hint && !error) return stepper;
  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={!label || labelHidden}
      required={required}
      hint={hint}
      error={error}
    >
      {stepper}
    </FieldChrome>
  );
}

// ---------------------------------------------------------------------------
// 7. EmrCheckboxGroup
// ---------------------------------------------------------------------------

export function EmrCheckboxGroup({
  controlId,
  label,
  ariaLabel,
  labelHidden,
  options,
  value,
  orientation = 'vertical',
  columns,
  variant = 'tile',
  size = 'md',
  labelPlacement = 'end',
  showSelectAll,
  selectAllLabel = 'Select all',
  exclusiveValues = [],
  minSelections: _minSelections,
  maxSelections,
  showSelectionCount,
  clearable,
  clearLabel = 'Clear',
  required,
  readOnly,
  disabled,
  invalid,
  hint,
  warning,
  error,
  onValueChange,
  onCleared,
  onFocused,
  onBlurred,
}: {
  controlId?: string;
  label?: string;
  ariaLabel?: string;
  labelHidden?: boolean;
  options: readonly EmrOption[];
  value: readonly string[];
  orientation?: EmrCheckboxGroupOrientation;
  columns?: number;
  variant?: EmrCheckboxGroupVariant | 'standard';
  size?: EmrCheckboxGroupSize;
  labelPlacement?: EmrCheckboxGroupLabelPlacement;
  showSelectAll?: boolean;
  selectAllLabel?: string;
  exclusiveValues?: readonly string[];
  minSelections?: number;
  maxSelections?: number;
  showSelectionCount?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  hint?: string;
  warning?: string;
  error?: string;
  onValueChange: (v: readonly string[]) => void;
  onCleared?: () => void;
  onFocused?: () => void;
  onBlurred?: () => void;
}) {
  const t = useEmrTheme();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const { width: windowWidth } = useWindowDimensions();
  const normalizedVariant = normalizeCheckboxGroupVariant(variant);
  const isInvalid = Boolean(invalid || error);
  const hasMessage = Boolean(!labelHidden && (hint || warning || error));
  const selectedSet = new Set(value);
  const selectAllState = computeSelectAllState(value, options, exclusiveValues);
  const isNarrow = windowWidth > 0 && windowWidth <= 480;
  const resolvedColumns =
    orientation === 'grid' ? (isNarrow ? 1 : Math.max(1, columns ?? 2)) : columns;
  const optionGroups = groupOptions(options);
  const hasClearableSelection = options.some(
    o => selectedSet.has(o.value) && !isCheckboxOptionLocked(o)
  );
  const showClear = Boolean(clearable && !readOnly && !disabled && hasClearableSelection);
  const focusActiveRef = useRef(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChildFocus = () => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    if (!focusActiveRef.current) {
      focusActiveRef.current = true;
      onFocused?.();
    }
  };

  const handleChildBlur = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => {
      focusActiveRef.current = false;
      onBlurred?.();
    }, 0);
  };

  const toggle = (itemValue: string) => {
    const opt = options.find(o => o.value === itemValue);
    if (readOnly || disabled || (opt && isCheckboxOptionLocked(opt))) return;
    onValueChange(
      toggleCheckboxGroupValue(value, itemValue, options, {
        exclusiveValues,
        maxSelections,
      })
    );
  };

  const handleSelectAll = () => {
    if (readOnly || disabled) return;
    onValueChange(
      toggleSelectAllValues(value, options, {
        exclusiveValues,
        maxSelections,
      })
    );
  };

  const handleClear = () => {
    if (readOnly || disabled) return;
    onValueChange(clearCheckboxGroupValue(value, options));
    onCleared?.();
  };

  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={!label || labelHidden}
      required={required}
      hint={labelHidden ? undefined : hint}
      warning={labelHidden ? undefined : warning}
      error={labelHidden ? undefined : error}
    >
      <View
        id={id}
        role="group"
        aria-labelledby={!ariaLabel && label && !labelHidden ? `${id}-label` : undefined}
        aria-label={ariaLabel ?? (label || 'Checkbox options')}
        aria-describedby={hasMessage ? `${id}-message` : undefined}
        aria-required={required}
        aria-readonly={readOnly}
        aria-disabled={disabled}
        aria-invalid={isInvalid ? true : undefined}
        style={styles.checkboxGroupStack}
      >
        {!labelHidden && (showSelectionCount || showClear) ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            {showSelectionCount ? (
              <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
                {formatCheckboxSelectionCount(value, maxSelections)}
              </Text>
            ) : (
              <View />
            )}
            {showClear ? (
              <Pressable
                role="button"
                aria-label={`${clearLabel} ${label || 'selection'}`}
                onPress={handleClear}
                onFocus={handleChildFocus}
                onBlur={handleChildBlur}
                style={({ focused }: PressState) => [
                  focusRing(t, focused),
                  {
                    minHeight: 44,
                    minWidth: 44,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 7,
                    borderWidth: 1,
                    borderColor: t.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  },
                ]}
              >
                <SvgIcon name="close" size={14} color={t.textMuted} />
                <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
                  {clearLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {showSelectAll ? (
          <Pressable
            role="checkbox"
            aria-checked={selectAllState === 'all' ? true : selectAllState === 'mixed' ? 'mixed' : false}
            aria-disabled={disabled}
            aria-readonly={readOnly}
            disabled={disabled}
            onFocus={handleChildFocus}
            onBlur={handleChildBlur}
            onPress={readOnly ? undefined : handleSelectAll}
            {...(Platform.OS === 'web'
              ? ({
                  onKeyDown: (e: WebKeyEvent) => {
                    if (readOnly || disabled) return;
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleSelectAll();
                    }
                  },
                } as Record<string, unknown>)
              : {})}
            style={({ focused }: PressState) => [
              styles.selectAllRow,
              focusRing(t, focused),
              {
                minHeight: Math.max(44, t.controlHeight),
                opacity: disabled ? 0.6 : 1,
              },
            ]}
          >
            <View
              aria-hidden
              style={[
                styles.selectAllBox,
                {
                  width: size === 'sm' ? 16 : 18,
                  height: size === 'sm' ? 16 : 18,
                  borderColor: selectAllState !== 'none' ? t.primary : t.border,
                  backgroundColor: selectAllState === 'all' ? t.primary : t.surface,
                },
              ]}
            >
              {selectAllState === 'all' ? (
                <SvgIcon name="check" size={size === 'sm' ? 10 : 12} color={t.surface} />
              ) : selectAllState === 'mixed' ? (
                <SvgIcon name="minus" size={size === 'sm' ? 10 : 12} color={t.primary} />
              ) : null}
            </View>
            <Text
              style={{
                color: t.text,
                fontSize: t.textSm,
                fontWeight: fontWeight(t.weightBold),
                fontFamily: fontFamily(t),
              }}
            >
              {selectAllLabel}
            </Text>
          </Pressable>
        ) : null}
        {optionGroups.map(grp => {
          const renderOption = (opt: EmrOption) => {
            const isOptDisabled = Boolean(
              disabled ||
                opt.disabled ||
                isCheckboxOptionBlockedByMax(opt.value, value, maxSelections)
            );
            const isOptReadOnly = Boolean(readOnly || opt.readOnly);
            return (
              <EmrOptionChip
                key={opt.value}
                label={opt.label}
                description={opt.description}
                badge={opt.badge}
                tone={opt.tone}
                variant={normalizedVariant}
                size={size}
                labelPlacement={labelPlacement}
                multiple
                selected={selectedSet.has(opt.value)}
                invalid={isInvalid}
                warning={!isInvalid && Boolean(warning)}
                readOnly={isOptReadOnly}
                disabled={isOptDisabled}
                onFocus={handleChildFocus}
                onBlur={handleChildBlur}
                onPress={() => toggle(opt.value)}
              />
            );
          };
          return (
            <View key={grp.label ?? '__ungrouped'} style={{ gap: 6 }}>
              {grp.label ? (
                <Text
                  style={{
                    color: t.textMuted,
                    fontSize: t.textXs,
                    fontWeight: fontWeight(t.weightBold),
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontFamily: fontFamily(t),
                    marginTop: 4,
                  }}
                >
                  {grp.label}
                </Text>
              ) : null}
              {orientation === 'grid' && Platform.OS === 'web' ? (
                <View
                  style={
                    {
                      display: 'grid',
                      gridTemplateColumns: isNarrow
                        ? 'minmax(0, 1fr)'
                        : `repeat(${Math.max(1, columns ?? 2)}, minmax(0, 1fr))`,
                      gap: 8,
                      width: '100%',
                      minWidth: 0,
                      maxWidth: '100%',
                    } as Record<string, unknown>
                  }
                >
                  {grp.options.map(renderOption)}
                </View>
              ) : (
                <EmrRow
                  single={orientation === 'vertical' || (orientation === 'grid' && isNarrow)}
                  columns={resolvedColumns}
                >
                  {grp.options.map(renderOption)}
                </EmrRow>
              )}
            </View>
          );
        })}
      </View>
    </FieldChrome>
  );
}

// ---------------------------------------------------------------------------
// 8. EmrPagination
// ---------------------------------------------------------------------------

function buildPageButtons(current: number, totalPages: number): readonly (number | 'ellipsis-start' | 'ellipsis-end')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items: (number | 'ellipsis-start' | 'ellipsis-end')[] = [1];
  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(totalPages - 1, current + 1);
  if (windowStart > 2) items.push('ellipsis-start');
  for (let p = windowStart; p <= windowEnd; p++) items.push(p);
  if (windowEnd < totalPages - 1) items.push('ellipsis-end');
  items.push(totalPages);
  return items;
}

export function EmrPagination({
  page,
  pageSize,
  totalItems,
  pageSizeOptions,
  ariaLabel = 'Pagination',
  disabled,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: readonly number[];
  ariaLabel?: string;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}) {
  const t = useEmrTheme();
  const safeSize = Math.max(1, pageSize);
  const safeTotal = Math.max(0, totalItems);
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeSize));
  const currentPage = Math.min(totalPages, Math.max(1, page));
  const rangeStart = safeTotal === 0 ? 0 : (currentPage - 1) * safeSize + 1;
  const rangeEnd = Math.min(safeTotal, currentPage * safeSize);
  const pages = buildPageButtons(currentPage, totalPages);
  const minDim = Math.max(44, t.controlHeight);

  const canPrev = !disabled && currentPage > 1;
  const canNext = !disabled && currentPage < totalPages;

  return (
    <View role="navigation" aria-label={ariaLabel} style={styles.paginationBar}>
      <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>
        {safeTotal === 0 ? '0 items' : `${rangeStart}–${rangeEnd} of ${safeTotal}`}
      </Text>
      <View style={styles.paginationControls}>
        {pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange ? (
          <View style={styles.pageSizeWrap}>
            <EmrSelect
              label="Rows per page"
              labelHidden
              options={pageSizeOptions.map(sz => ({ value: String(sz), label: `${sz} / page` }))}
              value={String(safeSize)}
              disabled={disabled}
              onChange={next => {
                if (next) onPageSizeChange(Number(next));
              }}
            />
          </View>
        ) : null}
        <Pressable
          role="button"
          aria-label="Previous page"
          aria-disabled={!canPrev || undefined}
          disabled={!canPrev}
          onPress={() => {
            if (canPrev) onPageChange(currentPage - 1);
          }}
          style={({ pressed, focused }: PressState) => [
            styles.pageBtn,
            focusRing(t, focused),
            {
              minWidth: minDim,
              minHeight: minDim,
              borderColor: t.border,
              backgroundColor: pressed && canPrev ? t.surfaceRaised : t.surface,
              opacity: canPrev ? 1 : 0.45,
            },
          ]}
        >
          <SvgIcon name="chevron-left" size={16} color={t.text} />
        </Pressable>
        {pages.map(item =>
          typeof item === 'string' ? (
            <View key={item} aria-hidden style={[styles.ellipsisBox, { minHeight: minDim }]}>
              <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>…</Text>
            </View>
          ) : (
            <Pressable
              key={item}
              role="button"
              aria-label={`Page ${item}`}
              aria-current={item === currentPage ? 'page' : undefined}
              aria-disabled={disabled || undefined}
              disabled={disabled}
              onPress={() => {
                if (!disabled && item !== currentPage) onPageChange(item);
              }}
              style={({ pressed, focused }: PressState) => [
                styles.pageBtn,
                focusRing(t, focused),
                {
                  minWidth: minDim,
                  minHeight: minDim,
                  borderColor: item === currentPage ? t.primary : t.border,
                  backgroundColor:
                    item === currentPage
                      ? t.primarySoft
                      : pressed && !disabled
                        ? t.surfaceRaised
                        : t.surface,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: item === currentPage ? t.primaryContrast : t.text,
                  fontSize: t.textSm,
                  fontWeight: fontWeight(item === currentPage ? t.weightBold : t.weightMedium),
                  fontFamily: fontFamily(t),
                }}
              >
                {item}
              </Text>
            </Pressable>
          ),
        )}
        <Pressable
          role="button"
          aria-label="Next page"
          aria-disabled={!canNext || undefined}
          disabled={!canNext}
          onPress={() => {
            if (canNext) onPageChange(currentPage + 1);
          }}
          style={({ pressed, focused }: PressState) => [
            styles.pageBtn,
            focusRing(t, focused),
            {
              minWidth: minDim,
              minHeight: minDim,
              borderColor: t.border,
              backgroundColor: pressed && canNext ? t.surfaceRaised : t.surface,
              opacity: canNext ? 1 : 0.45,
            },
          ]}
        >
          <SvgIcon name="chevron-right" size={16} color={t.text} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 9. EmrFileTrigger
// ---------------------------------------------------------------------------

interface WebFileInputHandle {
  click?: () => void;
  value?: string;
}

function toSelectionItems(rawFiles: readonly File[]): EmrFileSelectionItem[] {
  return rawFiles.map(f => ({
    name: f.name,
    sizeBytes: f.size,
    mimeType: f.type || 'application/octet-stream',
    ...(typeof f.lastModified === 'number' ? { lastModified: f.lastModified } : {}),
  }));
}

export function EmrFileTrigger({
  controlId,
  label,
  buttonLabel,
  dropHint,
  accept,
  multiple,
  readOnly,
  disabled,
  hint,
  error,
  onFilesSelected,
  onNativeFilesSelected,
}: {
  controlId?: string;
  label?: string;
  buttonLabel?: string;
  dropHint?: string;
  accept?: string;
  multiple?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  onFilesSelected: (files: readonly EmrFileSelectionItem[]) => void;
  onNativeFilesSelected?: (files: readonly File[]) => void;
}) {
  const t = useEmrTheme();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const resolvedButtonLabel = buttonLabel ?? (multiple ? 'Choose files' : 'Choose file');
  const fileInputRef = useRef<WebFileInputHandle | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const interactive = !disabled && !readOnly;

  const emitFiles = (fileList: ArrayLike<File> | null | undefined) => {
    if (!interactive || !fileList) return;
    const raw = Array.from(fileList);
    if (raw.length === 0) return;
    const picked = multiple ? raw : raw.slice(0, 1);
    onFilesSelected(toSelectionItems(picked));
    onNativeFilesSelected?.(picked);
  };

  const triggerPicker = () => {
    if (!interactive) return;
    if (Platform.OS === 'web') {
      fileInputRef.current?.click?.();
    }
  };

  const dropWebHandlers =
    Platform.OS === 'web'
      ? {
          onDragOver: (e: { preventDefault: () => void }) => {
            if (!interactive) return;
            e.preventDefault();
            setDragActive(true);
          },
          onDragLeave: () => setDragActive(false),
          onDrop: (e: { preventDefault: () => void; dataTransfer?: { files?: ArrayLike<File> } }) => {
            e.preventDefault();
            setDragActive(false);
            emitFiles(e.dataTransfer?.files);
          },
        }
      : null;

  const zone = (
    <View
      {...(dropWebHandlers as object)}
      style={[
        styles.dropZone,
        {
          minHeight: Math.max(56, t.controlHeight),
          borderColor: dragActive ? t.primary : error ? t.danger : t.border,
          backgroundColor: dragActive ? t.primarySoft : readOnly ? t.surfaceSoft : t.surface,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      {Platform.OS === 'web'
        ? createElement('input', {
            ref: (el: WebFileInputHandle | null) => {
              fileInputRef.current = el;
            },
            id: `${id}-file-input`,
            type: 'file',
            accept,
            multiple: Boolean(multiple),
            disabled: !interactive,
            tabIndex: -1,
            'aria-hidden': true,
            style: {
              position: 'absolute',
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: 'none',
            },
            onChange: (e: { target?: { files?: ArrayLike<File>; value?: string } }) => {
              emitFiles(e.target?.files);
              if (e.target) e.target.value = '';
            },
          })
        : null}
      <Pressable
        id={id}
        role="button"
        aria-label={label ? `${resolvedButtonLabel}: ${label}` : resolvedButtonLabel}
        aria-disabled={!interactive || undefined}
        disabled={disabled}
        onPress={interactive ? triggerPicker : undefined}
        style={({ pressed, focused }: PressState) => [
          styles.fileBtn,
          focusRing(t, focused),
          {
            minHeight: Math.max(44, t.controlHeight),
            minWidth: 44,
            borderColor: t.primaryBorder,
            backgroundColor: pressed && interactive ? t.surfaceRaised : t.surfaceBlue,
          },
        ]}
      >
        <SvgIcon name="upload" size={16} color={t.primary} />
        <Text
          style={{
            color: t.primary,
            fontSize: t.textSm,
            fontWeight: fontWeight(t.weightBold),
            fontFamily: fontFamily(t),
          }}
        >
          {resolvedButtonLabel}
        </Text>
      </Pressable>
      {dropHint ? (
        <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t), flexShrink: 1 }}>
          {dropHint}
        </Text>
      ) : null}
    </View>
  );

  if (!label && !hint && !error) return zone;
  return (
    <FieldChrome controlId={id} label={label} hint={hint} error={error}>
      {zone}
    </FieldChrome>
  );
}

const styles = StyleSheet.create({
  textareaWrap: { gap: 4 },
  charCount: { alignSelf: 'flex-end' },
  iconButton: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  segmentedGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: '100%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  segmentedGroupVertical: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
  },
  segmentBtnFullWidth: {
    flex: 1,
  },
  segmentBtnVertical: {
    width: '100%',
    justifyContent: 'flex-start',
  },
  segmentBadge: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  toggleGroupRow: {
    gap: 10,
  },
  toggleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  toggleTrack: {
    borderWidth: 1,
    justifyContent: 'center',
    flexShrink: 0,
  },
  toggleThumb: {},
  toggleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  checkboxGroupStack: {
    gap: 8,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    borderWidth: 0,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  selectAllBox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adornedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  leadingIcon: {
    paddingLeft: 12,
    paddingRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    paddingRight: 8,
  },
  passwordPadding: {
    paddingLeft: 12,
  },
  trailingSpinner: {
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adornBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealBtn: {
    borderLeftWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
    maxWidth: '100%',
  },
  paginationControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  pageSizeWrap: {
    minWidth: 124,
    marginRight: 4,
  },
  pageBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ellipsisBox: {
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZone: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  fileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 8,
  },
});
