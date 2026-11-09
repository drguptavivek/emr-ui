'use client';

import { useId } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { ClinicalOption } from '@drguptavivek/emr-controller';
import { EmrDateTimeText, EmrTypedText, NumberInput, ThemedInput } from './inputs-core';
import {
  resolveDateFormat,
  type DateDisplayFormat,
  type DatePrecision,
  type TimePrecision,
} from './l1-inputs.logic';
import { useEmrLabels } from './labels';
import { EmrOptionChip, EmrRow, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import { EmrFieldFrame } from './typed-field';

/** Built-in strings these inputs render. Override per locale via the matching prop; ponytail: fold into labels.tsx. */
const DEFAULTS = { unitLabel: 'unit' } as const;

type PressState = PressableStateCallbackType & { focused?: boolean };

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
    <EmrFieldFrame label={p.label} labelHidden={p.labelHidden} controlId={id} required={p.required}
      hint={p.hint || undefined} warning={p.warning || undefined} error={p.error || undefined}>
      {children}
    </EmrFieldFrame>
  );
}

// ---- text, number -------------------------------------------------------------------------

export function EmrTextInput(p: EmrFieldProps & { value: string | null; onValueChange: (value: string | null) => void }) {
  const { id, input } = useControl(p);
  return (
    <Frame id={id} p={p}>
      <ThemedInput {...input} value={p.value ?? ''} onChangeText={text => p.onValueChange(text === '' ? null : text)} />
    </Frame>
  );
}

/** Supports integer or decimal modes with − / + stepper buttons and min/max/step bounds. */
export function EmrNumberInput(p: EmrFieldProps & {
  value: number | null;
  mode?: 'integer' | 'decimal';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onValueChange: (value: number | null) => void;
}) {
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
export function EmrDateInput(p: EmrFieldProps & {
  value: string | null;
  displayFormat?: DateDisplayFormat;
  precision?: DatePrecision;
  onValueChange: (value: string | null) => void;
}) {
  const { id, input } = useControl(p);
  const baseFormat = p.displayFormat ?? useEmrLabels().dateFormat;
  const format = resolveDateFormat(baseFormat, p.precision ?? 'day');
  return (
    <Frame id={id} p={p}>
      {/* key: switching the display order or precision re-seeds the draft from the value. */}
      <EmrTypedText key={format} {...input} placeholder={p.placeholder ?? format} mode={format} value={p.value} onValueChange={p.onValueChange} />
    </Frame>
  );
}

/** `value` is `HH:mm` (or `HH:mm:ss` when `precision="second"`). */
export function EmrTimeInput(p: EmrFieldProps & {
  value: string | null;
  precision?: TimePrecision;
  onValueChange: (value: string | null) => void;
}) {
  const { id, input } = useControl(p);
  const withSeconds = p.precision === 'second';
  const mode = withSeconds ? 'time-seconds' : 'time';
  const defaultPlaceholder = withSeconds ? 'hh:mm:ss' : 'hh:mm';
  return (
    <Frame id={id} p={p}>
      <EmrTypedText key={mode} {...input} placeholder={p.placeholder ?? defaultPlaceholder} mode={mode} value={p.value} onValueChange={p.onValueChange} />
    </Frame>
  );
}

/** Date + time of a UTC instant: `value` is ISO-8601 with Z; shown and typed as local date and time (`hh:mm` or `hh:mm:ss`). */
export function EmrDateTimeInput(p: EmrFieldProps & {
  value: string | null;
  displayFormat?: DateDisplayFormat;
  timePrecision?: TimePrecision;
  dateLabel?: string;
  timeLabel?: string;
  onValueChange: (value: string | null) => void;
}) {
  const { id } = useControl(p);
  const labels = useEmrLabels();
  return (
    <Frame id={id} p={p}>
      <EmrDateTimeText
        value={p.value}
        format={p.displayFormat ?? labels.dateFormat}
        timePrecision={p.timePrecision ?? 'minute'}
        label={p.label}
        dateLabel={p.dateLabel ?? labels.dateLabel}
        timeLabel={p.timeLabel ?? labels.timeLabel}
        invalid={!!p.error}
        readOnly={p.readOnly}
        editable={!p.disabled}
        onFocus={p.onFocus}
        onValueChange={p.onValueChange}
      />
    </Frame>
  );
}

// ---- quantity, paired ---------------------------------------------------------------------

/** Number plus a unit choice. Unit and value change independently. */
export function EmrQuantityInput(p: EmrFieldProps & {
  value: number | null;
  unit: string | null;
  units: readonly ClinicalOption[];
  unitLabel?: string;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number | null) => void;
  onUnitChange: (unit: string | null) => void;
}) {
  const { id, input } = useControl(p);
  const t = useEmrTheme();
  return (
    <Frame id={id} p={p}>
      <View style={[styles.pair, { maxWidth: 320 }]}>
        <NumberInput {...input} min={p.min} max={p.max} step={p.step} integer={false} value={p.value ?? undefined} onNumber={p.onValueChange} />
        <View style={{ minWidth: t.controlHeight * 2.2 }}>
          <EmrSelect label={`${p.label} ${p.unitLabel ?? DEFAULTS.unitLabel}`} options={p.units} value={p.unit} invalid={!!p.error}
            readOnly={p.readOnly} disabled={p.disabled} onChange={p.onUnitChange} />
        </View>
      </View>
    </Frame>
  );
}

/** Two text inputs sharing one label (e.g. OD / OS), joined by `separator`. */
export function EmrPairedInput(p: EmrFieldProps & {
  firstLabel: string;
  secondLabel: string;
  firstValue: string | null;
  secondValue: string | null;
  separator?: string;
  onFirstValueChange: (value: string | null) => void;
  onSecondValueChange: (value: string | null) => void;
}) {
  const { id, input } = useControl(p);
  const t = useEmrTheme();
  const { 'aria-labelledby': _labelledBy, placeholder: _placeholder, ...rest } = input;
  const side = (key: 'first' | 'second', sideLabel: string, value: string | null, change: (value: string | null) => void) => (
    <View style={styles.pair}>
      <Text aria-hidden style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{sideLabel}</Text>
      <View style={styles.flex}>
        <ThemedInput {...rest} id={`${id}-${key}`} aria-label={`${p.label}, ${sideLabel}`} value={value ?? ''}
          onChangeText={text => change(text === '' ? null : text)} />
      </View>
    </View>
  );
  return (
    <Frame id={id} p={p}>
      <View role="group" aria-labelledby={p.labelHidden ? undefined : `${id}-label`} aria-label={input['aria-label']} style={[styles.pair, { maxWidth: 360 }]}>
        <View style={styles.flex}>{side('first', p.firstLabel, p.firstValue, p.onFirstValueChange)}</View>
        <Text aria-hidden style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{p.separator ?? '/'}</Text>
        <View style={styles.flex}>{side('second', p.secondLabel, p.secondValue, p.onSecondValueChange)}</View>
      </View>
    </Frame>
  );
}

// ---- checkbox, toggle, radio group --------------------------------------------------------

interface EmrSwitchLikeProps extends Omit<EmrFieldProps, 'placeholder' | 'labelHidden'> {
  value: boolean | null;
  onValueChange: (value: boolean) => void;
  /** Checkbox only: some but not all of what it controls is ticked (aria-checked="mixed"). */
  mixed?: boolean;
}

/** One shared equal-width bordered card row for checkbox and toggle: control, label, and hint/error beneath. */
function BooleanRow({ p, role, glyph }: { p: EmrSwitchLikeProps; role: 'checkbox' | 'switch'; glyph: (checked: boolean) => React.ReactNode }) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generated = useId();
  const id = p.controlId ?? generated;
  const checked = p.value === true;
  const hasMessage = !!(p.error || p.warning || p.hint);
  return (
    <EmrFieldFrame label={p.label} labelHidden controlId={id} hint={p.hint || undefined} warning={p.warning || undefined} error={p.error || undefined}>
      <Pressable
        id={id}
        role={role}
        aria-checked={p.mixed && !checked ? 'mixed' : checked}
        aria-label={p.required ? `${p.label}, ${labels.required}` : p.label}
        aria-describedby={hasMessage ? `${id}-message` : undefined}
        aria-invalid={p.error ? true : undefined}
        aria-disabled={p.disabled}
        aria-readonly={p.readOnly}
        disabled={p.disabled}
        onFocus={p.onFocus}
        // Read-only stays focusable and announced; it just does nothing on press.
        onPress={p.readOnly ? undefined : () => p.onValueChange(!checked)}
        style={({ focused }: PressState) => [
          styles.booleanRow,
          focusRing(t, focused),
          {
            minHeight: t.controlHeight,
            borderColor: p.error ? t.danger : checked ? t.primary : t.border,
            backgroundColor: checked ? t.primarySoft : p.readOnly ? t.surfaceSoft : t.surface,
            opacity: p.disabled ? 0.6 : 1,
          },
        ]}>
        {glyph(checked)}
        <Text numberOfLines={1} style={[styles.flex, { color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }]}>
          {p.label}{p.required ? <Text style={{ color: t.danger }}> *</Text> : null}
        </Text>
      </Pressable>
    </EmrFieldFrame>
  );
}

export function EmrCheckbox(p: EmrSwitchLikeProps) {
  const t = useEmrTheme();
  return (
    <BooleanRow p={p} role="checkbox" glyph={checked => (
      <View aria-hidden style={[styles.box, { borderColor: p.error ? t.danger : checked ? t.primary : t.border, backgroundColor: checked ? t.primary : t.surface }]}>
        {checked || p.mixed ? <Text style={{ color: checked ? t.surface : t.primary, fontSize: 11, lineHeight: 13, fontWeight: fontWeight(t.weightBold) }}>{checked ? '✓' : '–'}</Text> : null}
      </View>
    )} />
  );
}

/** Switch semantics: same value contract as the checkbox, drawn as a track and thumb. */
export function EmrToggle(p: EmrSwitchLikeProps) {
  const t = useEmrTheme();
  return (
    <BooleanRow p={p} role="switch" glyph={checked => (
      <View aria-hidden style={[styles.track, { backgroundColor: checked ? t.primary : t.border, alignItems: checked ? 'flex-end' : 'flex-start' }]}>
        <View style={[styles.thumb, { backgroundColor: t.surface }]} />
      </View>
    )} />
  );
}

/** Single choice from a few options, as chips in an equal-width grid (horizontal or vertical). Selection is never cleared by pressing again. */
const LONG_CHIP_LABEL = 24;

export function EmrRadioGroup(p: Omit<EmrFieldProps, 'placeholder'> & {
  value: string | null;
  options: readonly ClinicalOption[];
  orientation?: 'horizontal' | 'vertical';
  columns?: number;
  onValueChange: (value: string) => void;
}) {
  const generated = useId();
  const id = p.controlId ?? generated;
  const hasMessage = !!(p.error || p.warning || p.hint);
  const single = p.orientation === 'vertical' || (p.orientation !== 'horizontal' && p.options.some(o => o.label.length > LONG_CHIP_LABEL));
  return (
    <Frame id={id} p={p}>
      <View role="radiogroup" aria-labelledby={p.labelHidden ? undefined : `${id}-label`} aria-label={p.label}
        aria-describedby={hasMessage ? `${id}-message` : undefined} aria-invalid={p.error ? true : undefined}
        aria-required={p.required} aria-readonly={p.readOnly} aria-disabled={p.disabled}>
        <EmrRow single={single} columns={p.columns}>
          {p.options.map(option => (
            <EmrOptionChip key={option.value} label={option.label} selected={p.value === option.value} readOnly={p.readOnly}
              disabled={p.disabled || option.disabled} onPress={() => { p.onFocus?.(); p.onValueChange(option.value); }} />
          ))}
        </EmrRow>
      </View>
    </Frame>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pair: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  booleanRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
  box: { width: 18, height: 18, borderWidth: 1.5, borderRadius: 4, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  track: { width: 40, height: 22, borderRadius: 11, padding: 2, justifyContent: 'center', flexShrink: 0 },
  thumb: { width: 18, height: 18, borderRadius: 9 },
});
