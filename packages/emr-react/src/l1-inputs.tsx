'use client';

import { useId } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  EmrDateTimeDisplayFormat,
  EmrDateTimeHourCycle,
  EmrDateTimeSize,
  EmrDateTimeWireFormat,
  EmrOption,
  EmrQuantityNumericMode,
  EmrQuantitySize,
  EmrTimeHourCycle,
  EmrTimePrecision,
  EmrTimeSize,
} from '@drguptavivek/emr-controller';
import { resolveQuantityStep, resolveTimePlaceholder } from './l1-inputs.logic';
import { SvgIcon } from './icons';
import { EmrDateTimeText, EmrTypedText, NumberInput, ThemedInput } from './inputs-core';
import { FieldChrome } from './l1-field-chrome';
import {
  resolveDateFormat,
  type DateDisplayFormat,
  type DatePrecision,
  type TimePrecision,
} from './l1-inputs.logic';
import { useEmrLabels } from './labels';
import {
  EmrCheckbox,
  EmrRadioGroup,
  EmrSelect,
  EmrToggle,
  type EmrBooleanInputProps,
  type EmrCheckboxProps,
  type EmrToggleProps,
} from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

export {
  EmrCheckbox,
  EmrRadioGroup,
  EmrToggle,
  type EmrBooleanInputProps,
  type EmrCheckboxProps,
  type EmrToggleProps,
};

/** Built-in strings these inputs render. Override per locale via the matching prop; ponytail: fold into labels.tsx. */
const DEFAULTS = { unitLabel: 'unit' } as const;

/** Shared L1 field props. Everything but `value` and `onValueChange` is optional. */
export interface EmrFieldProps {
  controlId?: string;
  label: string;
  /** Matrix cells: the headers are the visible label; the control keeps it as its accessible name. */
  labelHidden?: boolean;
  hint?: string;
  warning?: string;
  error?: string;
  required?: boolean;
  /** Stays focusable and announced; never collapsed into `disabled`. */
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onFocus?: () => void;
}

/** Id, accessible name and the props every themed input in this file shares. */
function useControl(p: EmrFieldProps) {
  const labels = useEmrLabels();
  const generated = useId();
  const id = p.controlId ?? generated;
  const hasMessage = !!(p.error || p.warning || p.hint);
  const input = {
    id,
    'aria-labelledby': p.labelHidden ? undefined : `${id}-label`,
    'aria-describedby': hasMessage ? `${id}-message` : undefined,
    'aria-label': p.required ? `${p.label}, ${labels.required}` : p.label,
    invalid: !!p.error,
    readOnly: !!p.readOnly,
    editable: !p.disabled && !p.readOnly,
    placeholder: p.placeholder,
    onFocus: p.onFocus,
  } as const;
  return { id, input };
}

function Frame({ id, p, children }: { id: string; p: EmrFieldProps; children: React.ReactNode }) {
  return (
    <FieldChrome
      label={p.label}
      labelHidden={p.labelHidden}
      controlId={id}
      required={p.required}
      hint={p.hint || undefined}
      warning={p.warning || undefined}
      error={p.error || undefined}
    >
      {children}
    </FieldChrome>
  );
}

// ---- text, number -------------------------------------------------------------------------

export function EmrTextInput(
  p: EmrFieldProps & {
    value: string | null;
    type?: 'text' | 'email' | 'tel' | 'url';
    maxLength?: number;
    showCount?: boolean;
    clearable?: boolean;
    prefix?: string;
    suffix?: string;
    autoComplete?: string;
    onValueChange: (value: string | null) => void;
    onCleared?: () => void;
    onSubmit?: () => void;
    onBlur?: () => void;
  },
) {
  const { id, input } = useControl(p);
  const t = useEmrTheme();
  const canEdit = !p.disabled && !p.readOnly;
  const hasAffix = Boolean(p.prefix || p.suffix || (p.clearable && p.value && canEdit));
  const keyboardType = p.type === 'email' ? 'email-address' : p.type === 'tel' ? 'phone-pad' : p.type === 'url' ? 'url' : 'default';
  const inputEl = (
    <ThemedInput
      {...input}
      style={hasAffix ? { flex: 1, borderWidth: 0, minHeight: Math.max(42, t.controlHeight - 2) } : undefined}
      value={p.value ?? ''}
      maxLength={p.maxLength}
      keyboardType={keyboardType}
      autoComplete={p.autoComplete as never}
      onBlur={() => p.onBlur?.()}
      onSubmitEditing={() => p.onSubmit?.()}
      onChangeText={text => p.onValueChange(text === '' ? null : text)}
    />
  );
  return (
    <Frame id={id} p={p}>
      {p.prefix || p.suffix || p.clearable ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: t.controlHeight,
            borderWidth: 1,
            borderRadius: 8,
            borderColor: p.error ? t.danger : t.border,
            backgroundColor: p.disabled ? t.surfaceRaised : p.readOnly ? t.surfaceSoft : t.surface,
            overflow: 'hidden',
          }}
        >
          {p.prefix ? (
            <Text style={{ paddingHorizontal: 10, color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
              {p.prefix}
            </Text>
          ) : null}
          <View style={{ flex: 1, minWidth: 0 }}>{inputEl}</View>
          {p.clearable && p.value && canEdit ? (
            <Pressable
              role="button"
              aria-label="Clear"
              onPress={() => {
                p.onValueChange(null);
                p.onCleared?.();
              }}
              style={({ hovered }: PressableStateCallbackType & { hovered?: boolean }) => ({
                minWidth: 44,
                minHeight: Math.max(42, t.controlHeight - 2),
                alignItems: 'center',
                justifyContent: 'center',
                borderLeftWidth: 1,
                borderColor: t.border,
                backgroundColor: hovered ? t.primaryHover : t.surfaceSoft,
              })}
            >
              <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>×</Text>
            </Pressable>
          ) : null}
          {p.suffix ? (
            <Text style={{ paddingHorizontal: 10, color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
              {p.suffix}
            </Text>
          ) : null}
        </View>
      ) : (
        inputEl
      )}
      {!p.labelHidden && p.showCount && p.maxLength ? (
        <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t), marginTop: 2 }}>
          {(p.value ?? '').length} / {p.maxLength}
        </Text>
      ) : null}
    </Frame>
  );
}

/** Supports integer or decimal modes with − / + stepper buttons and min/max/step bounds. */
export function EmrNumberInput(
  p: EmrFieldProps & {
    value: number | null;
    mode?: 'integer' | 'decimal';
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    onValueChange: (value: number | null) => void;
  },
) {
  const { id, input } = useControl(p);
  return (
    <Frame id={id} p={p}>
      <NumberInput
        {...input}
        min={p.min}
        max={p.max}
        step={p.step}
        unit={p.unit}
        integer={p.mode === 'integer'}
        value={p.value ?? undefined}
        onNumber={p.onValueChange}
      />
    </Frame>
  );
}

// ---- date, time, datetime -----------------------------------------------------------------

/**
 * Shows and accepts full date (`dd-mm-yyyy` / `yyyy-mm-dd`), year-month (`mm-yyyy` / `yyyy-mm`),
 * or year-only (`yyyy`). `value` is always ISO (`YYYY-MM-DD`, `YYYY-MM`, or `YYYY`).
 */
export function EmrDateInput(
  p: EmrFieldProps & {
    value: string | null;
    min?: string;
    max?: string;
    displayFormat?: DateDisplayFormat;
    precision?: DatePrecision;
    onValueChange: (value: string | null) => void;
  },
) {
  const { id, input } = useControl(p);
  const baseFormat = p.displayFormat ?? useEmrLabels().dateFormat;
  const format = resolveDateFormat(baseFormat, p.precision ?? 'day');
  return (
    <Frame id={id} p={p}>
      {/* key: switching the display order or precision re-seeds the draft from the value. */}
      <EmrTypedText
        key={format}
        {...input}
        placeholder={p.placeholder ?? format}
        mode={format}
        min={p.min}
        max={p.max}
        value={p.value}
        onValueChange={p.onValueChange}
      />
    </Frame>
  );
}

/** `value` is `HH:mm` (or `HH:mm:ss` when `precision="second"`). */
export function EmrTimeInput(
  p: EmrFieldProps & {
    value: string | null;
    precision?: EmrTimePrecision;
    hourCycle?: EmrTimeHourCycle;
    min?: string;
    max?: string;
    step?: number;
    size?: EmrTimeSize;
    clearable?: boolean;
    onValueChange: (value: string | null) => void;
    onCleared?: () => void;
    onBlur?: () => void;
    onSubmit?: () => void;
  },
) {
  const { id, input } = useControl(p);
  const precision = p.precision ?? 'minute';
  const hourCycle = p.hourCycle ?? '24';
  const mode = precision === 'second' ? 'time-seconds' : 'time';
  const defaultPlaceholder = resolveTimePlaceholder(precision, hourCycle);
  return (
    <Frame id={id} p={p}>
      <EmrTypedText
        key={`${mode}-${hourCycle}`}
        {...input}
        placeholder={p.placeholder ?? defaultPlaceholder}
        mode={mode}
        hourCycle={hourCycle}
        min={p.min}
        max={p.max}
        step={p.step}
        size={p.size}
        clearable={p.clearable}
        warning={Boolean(p.warning && !p.error && !input.invalid)}
        value={p.value}
        onValueChange={p.onValueChange}
        onCleared={p.onCleared}
        onBlur={() => p.onBlur?.()}
        onSubmitEditing={() => p.onSubmit?.()}
      />
    </Frame>
  );
}

/** Date + time input supporting displayFormat, hourCycle, timePrecision, wireFormat, min/max, clearable, size, warning/invalid. */
export function EmrDateTimeInput(
  p: EmrFieldProps & {
    value: string | null;
    ariaLabel?: string;
    displayFormat?: EmrDateTimeDisplayFormat;
    timePrecision?: TimePrecision;
    hourCycle?: EmrDateTimeHourCycle;
    wireFormat?: EmrDateTimeWireFormat;
    min?: string;
    max?: string;
    size?: EmrDateTimeSize;
    clearable?: boolean;
    invalid?: boolean;
    dateLabel?: string;
    timeLabel?: string;
    onValueChange: (value: string | null) => void;
    onCleared?: () => void;
    onBlurred?: () => void;
    onSubmitted?: () => void;
  },
) {
  const { id, input } = useControl(p);
  const labels = useEmrLabels();
  return (
    <Frame id={id} p={p}>
      <EmrDateTimeText
        value={p.value}
        format={p.displayFormat ?? labels.dateFormat}
        timePrecision={p.timePrecision ?? 'minute'}
        hourCycle={p.hourCycle ?? '24'}
        wireFormat={p.wireFormat ?? 'utc'}
        min={p.min}
        max={p.max}
        size={p.size}
        clearable={p.clearable}
        warning={Boolean(p.warning && !p.error && !p.invalid && !input.invalid)}
        label={p.ariaLabel ?? p.label}
        dateLabel={p.dateLabel ?? labels.dateLabel}
        timeLabel={p.timeLabel ?? labels.timeLabel}
        invalid={Boolean(p.invalid || p.error || input.invalid)}
        readOnly={p.readOnly}
        editable={!p.disabled}
        onFocus={p.onFocus}
        onBlur={p.onBlurred}
        onCleared={p.onCleared}
        onSubmit={p.onSubmitted}
        onValueChange={p.onValueChange}
      />
    </Frame>
  );
}

// ---- quantity, paired ---------------------------------------------------------------------

/** Number plus a unit choice. Unit and value change independently. */
export function EmrQuantityInput(
  p: EmrFieldProps & {
    value: number | null;
    unit: string | null;
    units: readonly EmrOption[];
    mode?: EmrQuantityNumericMode;
    precision?: number;
    showSteppers?: boolean;
    size?: EmrQuantitySize;
    clearable?: boolean;
    clearLabel?: string;
    unitLabel?: string;
    unitPlaceholder?: string;
    valueRequired?: boolean;
    unitRequired?: boolean;
    unitReadOnly?: boolean;
    warning?: string;
    valueError?: string;
    unitError?: string;
    min?: number;
    max?: number;
    step?: number;
    onValueChange: (value: number | null) => void;
    onUnitChange: (unit: string | null) => void;
    onCleared?: () => void;
    onBlurred?: () => void;
    onSubmitted?: () => void;
  },
) {
  const { id, input } = useControl(p);
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const mode = p.mode ?? 'decimal';
  const size = p.size ?? 'md';
  const showSteppers = p.showSteppers ?? true;
  const effectiveStep = resolveQuantityStep({ mode, precision: p.precision, step: p.step });
  const numericInvalid = Boolean(p.error || p.valueError);
  const unitInvalid = Boolean(p.error || p.unitError);
  const combinedError = [p.error, p.valueError, p.unitError].filter(Boolean).join(' · ') || undefined;
  const maxWidth = size === 'sm' ? 300 : size === 'lg' ? 400 : 360;
  const targetSize = size === 'lg' ? 48 : Math.max(44, t.controlHeight);
  const canClear =
    Boolean(p.clearable) &&
    !p.disabled &&
    !p.readOnly &&
    (p.value !== null || (p.unit !== null && !p.unitReadOnly));

  return (
    <Frame id={id} p={{ ...p, error: combinedError, warning: combinedError ? undefined : p.warning }}>
      <View style={[styles.pair, { flexWrap: 'wrap', alignItems: 'stretch', width: '100%', maxWidth }]}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 168, minWidth: 168 }}>
          <NumberInput
            {...input}
            invalid={numericInvalid}
            warning={!numericInvalid && Boolean(p.warning)}
            min={p.min}
            max={p.max}
            step={effectiveStep}
            precision={p.precision}
            integer={mode === 'integer'}
            showSteppers={showSteppers}
            size={size}
            maxWidth="none"
            value={p.value ?? undefined}
            onNumber={p.onValueChange}
            onBlur={() => p.onBlurred?.()}
            onSubmitted={p.onSubmitted}
          />
        </View>
        <View style={{ flexGrow: 0, flexShrink: 1, flexBasis: 116, minWidth: 88 }}>
          <EmrSelect
            label={`${p.label} ${p.unitLabel ?? 'Unit'}`}
            labelHidden
            placeholder={p.unitPlaceholder ?? 'Unit'}
            options={p.units}
            value={p.unit}
            required={p.unitRequired ?? p.required}
            invalid={unitInvalid}
            readOnly={Boolean(p.readOnly || p.unitReadOnly)}
            disabled={p.disabled}
            onChange={(next) => {
              p.onUnitChange(next);
            }}
          />
        </View>
        {canClear ? (
          <Pressable
            role="button"
            aria-label={`${p.clearLabel ?? labels.clear ?? 'Clear'} ${p.label || 'quantity'}`}
            onPress={() => {
              p.onValueChange(null);
              if (!p.unitReadOnly && p.unit !== null) {
                p.onUnitChange(null);
              }
              p.onCleared?.();
            }}
            style={({ pressed, hovered }: PressableStateCallbackType & { hovered?: boolean }) => ({
              minWidth: targetSize,
              minHeight: targetSize,
              borderWidth: 1,
              borderColor: hovered ? t.focus : t.border,
              borderRadius: 8,
              backgroundColor: pressed ? t.surfaceRaised : hovered ? t.surfaceSoft : t.surface,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            })}
          >
            <SvgIcon name="close" size={14} color={t.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </Frame>
  );
}

/** Two text inputs sharing one label (e.g. OD / OS), joined by `separator`. */
export type PairedSideInputType = 'text' | 'integer' | 'decimal';

export function EmrPairedInput(
  p: EmrFieldProps & {
    firstLabel: string;
    secondLabel: string;
    firstValue: string | null;
    secondValue: string | null;
    firstPlaceholder?: string;
    secondPlaceholder?: string;
    inputType?: PairedSideInputType;
    firstInputType?: PairedSideInputType;
    secondInputType?: PairedSideInputType;
    min?: number;
    max?: number;
    firstMin?: number;
    firstMax?: number;
    secondMin?: number;
    secondMax?: number;
    firstRequired?: boolean;
    secondRequired?: boolean;
    firstError?: string;
    secondError?: string;
    separator?: string;
    onFirstValueChange: (value: string | null) => void;
    onSecondValueChange: (value: string | null) => void;
  },
) {
  const combinedError = [p.error, p.firstError, p.secondError].filter(Boolean).join(' · ') || undefined;
  const frameProps: EmrFieldProps = { ...p, error: combinedError };
  const { id, input } = useControl(frameProps);
  const t = useEmrTheme();
  const { 'aria-labelledby': _labelledBy, placeholder: _placeholder, ...rest } = input;
  const side = (
    key: 'first' | 'second',
    sideLabel: string,
    value: string | null,
    change: (value: string | null) => void,
    sideType: PairedSideInputType,
    sideError: string | undefined,
    sideRequired: boolean | undefined,
    sidePlaceholder: string | undefined,
  ) => (
    <View style={styles.pair}>
      <Text aria-hidden style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
        {sideLabel}
      </Text>
      <View style={styles.flex}>
        <ThemedInput
          {...rest}
          id={`${id}-${key}`}
          placeholder={sidePlaceholder ?? p.placeholder}
          invalid={Boolean(sideError || p.error)}
          aria-required={sideRequired ?? p.required}
          inputMode={sideType === 'integer' ? 'numeric' : sideType === 'decimal' ? 'decimal' : undefined}
          aria-label={`${p.label}, ${sideLabel}`}
          value={value ?? ''}
          onChangeText={text => change(text === '' ? null : text)}
        />
      </View>
    </View>
  );
  return (
    <Frame id={id} p={frameProps}>
      <View
        role="group"
        aria-labelledby={p.labelHidden ? undefined : `${id}-label`}
        aria-label={input['aria-label']}
        style={[styles.pair, { maxWidth: 360 }]}
      >
        <View style={styles.flex}>
          {side(
            'first',
            p.firstLabel,
            p.firstValue,
            p.onFirstValueChange,
            p.firstInputType ?? p.inputType ?? 'text',
            p.firstError,
            p.firstRequired,
            p.firstPlaceholder,
          )}
        </View>
        <Text aria-hidden style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>
          {p.separator ?? '/'}
        </Text>
        <View style={styles.flex}>
          {side(
            'second',
            p.secondLabel,
            p.secondValue,
            p.onSecondValueChange,
            p.secondInputType ?? p.inputType ?? 'text',
            p.secondError,
            p.secondRequired,
            p.secondPlaceholder,
          )}
        </View>
      </View>
    </Frame>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pair: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
