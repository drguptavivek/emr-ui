'use client';

import { createElement, useId, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableStateCallbackType,
  type TextInputContentSizeChangeEvent,
} from 'react-native';
import type { EmrFileSelectionItem, EmrOption, EmrSegmentedOption } from '@drguptavivek/emr-controller';
import { NumberInput, ThemedInput } from './inputs-core';
import { isEmrIconName, SvgIcon, type IconName } from './icons';
import { FieldChrome } from './l1-field-chrome';
import { computePrecisionStep } from './l1-inputs.logic';
import { rovingTarget } from './l1-interactive.logic';
import { webProps, type WebKeyEvent } from './l1-interactive-shared';
import {
  computeSelectAllState,
  toggleCheckboxGroupValue,
  toggleSelectAllValues,
} from './l1-wave2.logic';
import { useEmrLabels } from './labels';
import { EmrOptionChip, EmrRow, EmrSelect, resolveButtonPalette, type EmrButtonSize, type EmrButtonVariant } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

export type { EmrFileSelectionItem, EmrSegmentedOption };

type PressState = PressableStateCallbackType & { focused?: boolean };
type FocusRef = ({ focus(): void } | null)[];

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
            minWidth: dim,
            minHeight: dim,
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
  options,
  value,
  clearable,
  readOnly,
  disabled,
  hint,
  error,
  onValueChange,
  onCleared,
}: {
  controlId?: string;
  label?: string;
  labelHidden?: boolean;
  ariaLabel?: string;
  options: readonly EmrSegmentedOption[];
  value: string | null;
  clearable?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  onValueChange: (v: string | null) => void;
  onCleared?: () => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const refs = useRef<FocusRef>([]);
  const interactive = !disabled && !readOnly;
  const canClear = Boolean(clearable && value !== null && value !== undefined && value !== '' && interactive);

  const onKey = (e: WebKeyEvent, index: number) => {
    if (!interactive) return;
    const target = rovingTarget(
      e.key,
      index,
      options.map(o => !o.disabled),
    );
    if (target === null) return;
    e.preventDefault();
    const chosen = options[target];
    if (chosen) {
      onValueChange(chosen.value);
      refs.current[target]?.focus();
    }
  };

  const firstEnabledIdx = options.findIndex(o => !o.disabled);
  const selectedIdx = options.findIndex(o => o.value === value && !o.disabled);
  const activeStopIdx = selectedIdx >= 0 ? selectedIdx : firstEnabledIdx;

  const control = (
    <View style={styles.segmentedRow}>
      <View
        id={id}
        role="radiogroup"
        aria-labelledby={label && !labelHidden ? `${id}-label` : undefined}
        aria-label={ariaLabel ?? label ?? 'Segmented options'}
        aria-readonly={readOnly}
        aria-disabled={disabled}
        style={[
          styles.segmentedGroup,
          styles.segmentedGrow,
          {
            borderColor: error ? t.danger : t.border,
            backgroundColor: t.surfaceRaised,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        {options.map((opt, idx) => {
          const selected = opt.value === value;
          const optDisabled = Boolean(disabled || opt.disabled);
          return (
            <Pressable
              key={opt.value}
              ref={el => {
                refs.current[idx] = el;
              }}
              role="radio"
              aria-checked={selected}
              aria-disabled={optDisabled || undefined}
              aria-readonly={readOnly}
              disabled={optDisabled}
              onPress={interactive && !optDisabled ? () => { if (!selected) onValueChange(opt.value); } : undefined}
              {...webProps({
                tabIndex: idx === activeStopIdx ? 0 : -1,
                onKeyDown: (e: WebKeyEvent) => onKey(e, idx),
              })}
              style={({ pressed, focused }: PressState) => [
                styles.segmentBtn,
                focusRing(t, focused),
                {
                  minHeight: Math.max(44, t.controlHeight),
                  minWidth: 44,
                  backgroundColor: selected
                    ? t.surface
                    : pressed && interactive && !optDisabled
                      ? t.surfaceSoft
                      : 'transparent',
                  borderColor: selected ? t.primary : 'transparent',
                  opacity: opt.disabled && !disabled ? 0.5 : 1,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: selected ? t.primary : t.text,
                  fontSize: t.textSm,
                  fontWeight: fontWeight(selected ? t.weightBold : t.weightMedium),
                  fontFamily: fontFamily(t),
                }}
              >
                {opt.label}
              </Text>
              {opt.badge ? (
                <View style={[styles.segmentBadge, { backgroundColor: selected ? t.primarySoft : t.neutralSoft }]}>
                  <Text
                    style={{
                      color: selected ? t.primary : t.textMuted,
                      fontSize: t.text2xs,
                      fontWeight: fontWeight(t.weightBold),
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {opt.badge}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {canClear ? (
        <Pressable
          role="button"
          aria-label={`${labels.clear} ${ariaLabel ?? label ?? 'selection'}`}
          onPress={() => {
            onValueChange(null);
            onCleared?.();
          }}
          style={({ pressed, focused }: PressState) => [
            styles.pageBtn,
            focusRing(t, focused),
            {
              minWidth: 44,
              minHeight: Math.max(44, t.controlHeight),
              borderColor: t.border,
              backgroundColor: pressed ? t.surfaceRaised : t.surfaceSoft,
            },
          ]}
        >
          <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
            {labels.clear}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (!label && !hint && !error) return control;
  return (
    <FieldChrome controlId={id} label={label} labelHidden={!label || labelHidden} hint={hint} error={error}>
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
  orientation = 'horizontal',
  size = 'md',
  clearable,
  required,
  readOnly,
  disabled,
  hint,
  error,
  onValueChange,
  onValuesChange,
  onCleared,
}: {
  controlId?: string;
  label?: string;
  labelHidden?: boolean;
  ariaLabel?: string;
  options: readonly (EmrSegmentedOption & { readonly icon?: string })[];
  multiple?: boolean;
  value?: string | null;
  values?: readonly string[];
  allowEmpty?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: EmrButtonSize;
  clearable?: boolean;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  onValueChange?: (v: string | null) => void;
  onValuesChange?: (v: readonly string[]) => void;
  onCleared?: () => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const isMulti = multiple ?? (values !== undefined || onValuesChange !== undefined);
  const selectedList: readonly string[] = isMulti
    ? (values ?? (value ? [value] : []))
    : value != null && value !== ''
      ? [value]
      : [];
  const selectedSet = new Set(selectedList);
  const interactive = !disabled && !readOnly;
  const minHeight = Math.max(44, size === 'lg' ? 48 : t.controlHeight);
  const canClear = Boolean(clearable && selectedList.length > 0 && interactive);

  const toggleItem = (itemValue: string) => {
    if (!interactive) return;
    if (isMulti) {
      const exists = selectedSet.has(itemValue);
      if (exists && !allowEmpty && selectedList.length <= 1) return;
      const next = exists ? selectedList.filter(v => v !== itemValue) : [...selectedList, itemValue];
      onValuesChange?.(next);
      onValueChange?.(next[0] ?? null);
    } else {
      const exists = value === itemValue;
      if (exists) {
        if (!allowEmpty) return;
        onValueChange?.(null);
        onValuesChange?.([]);
        onCleared?.();
      } else {
        onValueChange?.(itemValue);
        onValuesChange?.([itemValue]);
      }
    }
  };

  const handleClear = () => {
    if (!canClear) return;
    onValueChange?.(null);
    onValuesChange?.([]);
    onCleared?.();
  };

  const groupNode = (
    <View style={styles.segmentedRow}>
      <View
        id={id}
        role="group"
        aria-labelledby={label && !labelHidden ? `${id}-label` : undefined}
        aria-label={ariaLabel ?? label ?? 'Toggle group'}
        aria-readonly={readOnly}
        aria-disabled={disabled}
        style={[
          styles.toggleGroupBar,
          orientation === 'vertical' && styles.toggleGroupVertical,
          { opacity: disabled ? 0.6 : 1 },
        ]}
      >
        {options.map(opt => {
          const active = selectedSet.has(opt.value);
          const optDisabled = Boolean(disabled || opt.disabled);
          return (
            <Pressable
              key={opt.value}
              role="button"
              aria-pressed={active}
              aria-disabled={optDisabled || undefined}
              disabled={optDisabled}
              onPress={interactive && !optDisabled ? () => toggleItem(opt.value) : undefined}
              style={({ pressed, focused }: PressState) => [
                styles.toggleGroupBtn,
                focusRing(t, focused),
                {
                  minHeight,
                  minWidth: 44,
                  borderColor: active ? t.primary : error ? t.danger : t.border,
                  backgroundColor: active
                    ? t.primarySoft
                    : pressed && interactive && !optDisabled
                      ? t.surfaceRaised
                      : t.surface,
                  opacity: opt.disabled && !disabled ? 0.5 : 1,
                },
              ]}
            >
              {opt.icon && isEmrIconName(opt.icon) ? (
                <SvgIcon name={opt.icon} size={15} color={active ? t.primary : t.textMuted} />
              ) : null}
              <Text
                numberOfLines={1}
                style={{
                  color: active ? t.primaryContrast : t.text,
                  fontSize: size === 'sm' ? t.textXs : size === 'lg' ? t.textLg : t.textSm,
                  fontWeight: fontWeight(active ? t.weightBold : t.weightMedium),
                  fontFamily: fontFamily(t),
                }}
              >
                {opt.label}
              </Text>
              {opt.badge ? (
                <View style={[styles.segmentBadge, { backgroundColor: active ? t.surface : t.neutralSoft }]}>
                  <Text
                    style={{
                      color: active ? t.primary : t.textMuted,
                      fontSize: t.text2xs,
                      fontWeight: fontWeight(t.weightBold),
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {opt.badge}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {canClear ? (
        <Pressable
          role="button"
          aria-label={`${labels.clear} ${ariaLabel ?? label ?? 'toggle group'}`}
          onPress={handleClear}
          style={({ pressed, focused }: PressState) => [
            styles.pageBtn,
            focusRing(t, focused),
            {
              minWidth: 44,
              minHeight,
              borderColor: t.border,
              backgroundColor: pressed ? t.surfaceRaised : t.surfaceSoft,
            },
          ]}
        >
          <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
            {labels.clear}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (!label && !hint && !error) return groupNode;
  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={!label || labelHidden}
      required={required}
      hint={hint}
      error={error}
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
  labelHidden,
  options,
  value,
  orientation = 'horizontal',
  columns,
  variant = 'standard',
  showSelectAll,
  selectAllLabel = 'Select all',
  exclusiveValues = [],
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
  options: readonly EmrOption[];
  value: readonly string[];
  orientation?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  variant?: 'standard' | 'card' | 'chip';
  showSelectAll?: boolean;
  selectAllLabel?: string;
  exclusiveValues?: readonly string[];
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  onValueChange: (v: readonly string[]) => void;
}) {
  const t = useEmrTheme();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const hasMessage = Boolean(hint || error);
  const selectedSet = new Set(value);
  const selectAllState = computeSelectAllState(value, options, exclusiveValues);
  const resolvedColumns = orientation === 'grid' ? (columns ?? 2) : columns;

  const toggle = (itemValue: string) => {
    if (readOnly || disabled) return;
    onValueChange(toggleCheckboxGroupValue(value, itemValue, options, exclusiveValues));
  };

  const handleSelectAll = () => {
    if (readOnly || disabled) return;
    onValueChange(toggleSelectAllValues(value, options, exclusiveValues));
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
      <View
        id={id}
        role="group"
        aria-labelledby={label && !labelHidden ? `${id}-label` : undefined}
        aria-label={label ?? 'Checkbox options'}
        aria-describedby={hasMessage ? `${id}-message` : undefined}
        aria-required={required}
        aria-readonly={readOnly}
        aria-disabled={disabled}
        aria-invalid={error ? true : undefined}
        style={styles.checkboxGroupStack}
      >
        {showSelectAll ? (
          <Pressable
            role="checkbox"
            aria-checked={selectAllState === 'all' ? true : selectAllState === 'mixed' ? 'mixed' : false}
            aria-disabled={disabled}
            aria-readonly={readOnly}
            disabled={disabled}
            onPress={readOnly ? undefined : handleSelectAll}
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
                  borderColor: selectAllState !== 'none' ? t.primary : t.border,
                  backgroundColor: selectAllState === 'all' ? t.primary : t.surface,
                },
              ]}
            >
              {selectAllState !== 'none' ? (
                <Text
                  style={{
                    color: selectAllState === 'all' ? t.surface : t.primary,
                    fontSize: t.text2xs,
                    lineHeight: 12,
                    fontWeight: fontWeight(t.weightBold),
                  }}
                >
                  {selectAllState === 'all' ? '✓' : '–'}
                </Text>
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
        <EmrRow single={orientation === 'vertical'} columns={resolvedColumns}>
          {options.map(opt => (
            <EmrOptionChip
              key={opt.value}
              label={opt.label}
              description={opt.description}
              variant={variant}
              multiple
              selected={selectedSet.has(opt.value)}
              readOnly={readOnly}
              disabled={disabled || opt.disabled}
              onPress={() => toggle(opt.value)}
            />
          ))}
        </EmrRow>
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
  buttonLabel = 'Choose file',
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
        aria-label={label ? `${buttonLabel}: ${label}` : buttonLabel}
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
          {buttonLabel}
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
  segmentedGrow: {
    flex: 1,
    minWidth: 0,
  },
  segmentedGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  segmentBtn: {
    flexGrow: 1,
    flexBasis: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
    borderWidth: 1,
  },
  segmentBadge: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  toggleGroupBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  toggleGroupVertical: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  toggleGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  checkboxGroupStack: {
    gap: 8,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
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
  },
  paginationControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
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
