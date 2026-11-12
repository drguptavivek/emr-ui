'use client';

import { Children, useEffect, useId, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type PressableStateCallbackType,
} from 'react-native';
import type { ClinicalOption, EmrBadge as EmrBadgeModel } from '@drguptavivek/emr-controller';
import { SvgIcon } from './icons';
import { FieldChrome } from './l1-field-chrome';
import { groupOptions } from './l1-wave2.logic';
import { useEmrLabels } from './labels';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme, type EmrTheme } from './theme';

/** RNW adds `focused` to the Pressable state; RN's types only declare `pressed`. */
type PressState = PressableStateCallbackType & { focused?: boolean };

/** L1. Tone is controller-supplied; the label always carries the meaning, never colour alone. */
export function EmrBadgeView({ badge }: { badge: EmrBadgeModel }) {
  const t = useEmrTheme();
  return (
    // The transparent row wrapper takes the parent's alignment (centred in rows) while the pill
    // inside keeps its content width (no stretching in columns).
    <View style={styles.badgeWrap}>
      <View
        aria-label={badge.assistiveText}
        style={[styles.badge, { backgroundColor: toneColors(t, badge.tone).backgroundColor }]}
      >
        <Text
          style={{
            color: toneColors(t, badge.tone).color,
            fontSize: t.textXs,
            fontWeight: fontWeight(t.weightBold),
            fontFamily: fontFamily(t),
          }}
        >
          {badge.label}
        </Text>
      </View>
    </View>
  );
}

export const EmrBadge = EmrBadgeView;

export type EmrButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type EmrButtonSize = 'sm' | 'md' | 'lg';

export function resolveButtonPalette(
  t: EmrTheme,
  variant: EmrButtonVariant,
  pressed: boolean,
): { backgroundColor: string; borderColor: string; textColor: string } {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: pressed ? t.primaryHover : t.primarySoft,
        borderColor: t.primaryBorder,
        textColor: t.primaryContrast,
      };
    case 'secondary':
      return {
        backgroundColor: pressed ? t.surfaceRaised : t.surfaceBlue,
        borderColor: t.border,
        textColor: t.text,
      };
    case 'outline':
      return {
        backgroundColor: pressed ? t.surfaceRaised : t.surface,
        borderColor: t.primaryBorder,
        textColor: t.primary,
      };
    case 'ghost':
      return {
        backgroundColor: pressed ? t.surfaceRaised : 'transparent',
        borderColor: 'transparent',
        textColor: t.text,
      };
    case 'danger':
      return {
        backgroundColor: pressed ? t.dangerHover : t.dangerSoft,
        borderColor: pressed ? t.dangerHover : t.danger,
        textColor: pressed ? t.dangerHoverText : t.danger,
      };
  }
}

/** L1. `disabled` is allowed here (below L2), and is the only way a button leaves the flow. */
export function EmrButton({
  label,
  children,
  onPress,
  variant = 'primary',
  size,
  small,
  loading,
  block,
  type,
  disabled,
  accessibilityLabel,
  expanded,
}: {
  label?: string;
  children?: ReactNode;
  onPress?: () => void;
  variant?: EmrButtonVariant;
  size?: EmrButtonSize;
  small?: boolean;
  loading?: boolean;
  block?: boolean;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  accessibilityLabel?: string;
  expanded?: boolean;
}) {
  const t = useEmrTheme();
  const resolvedSize: EmrButtonSize = size ?? (small ? 'sm' : 'md');
  // Small changes text and padding only: hitSlop does not apply on web, so the target height stays >=44 everywhere.
  const height = Math.max(44, resolvedSize === 'lg' ? 48 : t.controlHeight);
  const horizontalPad = resolvedSize === 'sm' ? 12 : resolvedSize === 'lg' ? 20 : 16;
  const textSize = resolvedSize === 'sm' ? t.textSm : resolvedSize === 'lg' ? t.textLg : t.textMd;
  const inert = Boolean(disabled || loading);

  return (
    <Pressable
      role="button"
      aria-label={accessibilityLabel}
      aria-disabled={inert || undefined}
      aria-busy={loading || undefined}
      aria-expanded={expanded}
      disabled={disabled}
      onPress={inert ? undefined : onPress}
      {...(Platform.OS === 'web' && type ? ({ type } as object) : null)}
      style={({ pressed, focused }: PressState) => {
        const palette = resolveButtonPalette(t, variant, Boolean(pressed && !inert));
        return [
          styles.button,
          focusRing(t, focused),
          {
            minHeight: height,
            minWidth: 44,
            paddingHorizontal: horizontalPad,
            alignSelf: block ? 'stretch' : undefined,
            width: block ? '100%' : undefined,
            backgroundColor: palette.backgroundColor,
            borderColor: palette.borderColor,
            opacity: disabled ? 0.6 : 1,
          },
        ];
      }}
    >
      {({ pressed }: PressState) => {
        const { textColor } = resolveButtonPalette(t, variant, Boolean(pressed && !inert));
        return (
          <View style={styles.buttonInner}>
            {loading ? <ActivityIndicator size="small" color={textColor} /> : null}
            {label !== undefined ? (
              <Text
                numberOfLines={1}
                style={{
                  color: textColor,
                  fontSize: textSize,
                  fontWeight: fontWeight(650),
                  fontFamily: fontFamily(t),
                }}
              >
                {label}
              </Text>
            ) : null}
            {typeof children === 'string' || typeof children === 'number' ? (
              <Text
                numberOfLines={1}
                style={{
                  color: textColor,
                  fontSize: textSize,
                  fontWeight: fontWeight(650),
                  fontFamily: fontFamily(t),
                }}
              >
                {children}
              </Text>
            ) : (
              children
            )}
          </View>
        );
      }}
    </Pressable>
  );
}

/** L1. A selectable chip: radio inside a radiogroup, checkbox for multi-select. */
export function EmrOptionChip({
  label,
  description,
  variant = 'standard',
  selected,
  multiple,
  readOnly,
  disabled,
  onPress,
}: {
  label: string;
  description?: string;
  variant?: 'standard' | 'card' | 'pill' | 'chip';
  selected: boolean;
  multiple?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const t = useEmrTheme();
  const minTarget = Math.max(44, t.controlHeight);
  const isPill = variant === 'pill' || variant === 'chip';
  const isCard = variant === 'card' || Boolean(description);
  return (
    <Pressable
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      aria-disabled={disabled}
      aria-readonly={readOnly}
      disabled={disabled}
      // Read-only stays focusable and announced; it just does nothing on press.
      onPress={readOnly ? undefined : onPress}
      style={({ focused }: PressState) => [
        styles.chip,
        isCard && styles.chipCard,
        focusRing(t, focused),
        {
          minHeight: minTarget,
          minWidth: minTarget,
          borderRadius: isPill ? 999 : isCard ? 10 : 8,
          borderColor: selected ? t.primary : t.border,
          borderWidth: 1,
          backgroundColor: selected ? t.primarySoft : t.surface,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View
        aria-hidden
        style={[
          styles.chipIndicator,
          isCard && styles.chipIndicatorTop,
          {
            borderRadius: multiple ? 4 : 8,
            borderColor: selected ? t.primary : t.border,
            backgroundColor: selected ? t.primary : t.surface,
          },
        ]}
      >
        {selected ? (
          multiple ? (
            <Text
              style={{
                color: t.surface,
                fontSize: t.text2xs,
                lineHeight: 12,
                fontWeight: fontWeight(t.weightBold),
              }}
            >
              ✓
            </Text>
          ) : (
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.surface }} />
          )
        ) : null}
      </View>
      <View style={styles.flex}>
        <Text
          numberOfLines={isCard ? 2 : 1}
          style={{
            color: selected ? t.primaryContrast : t.text,
            fontSize: t.textSm,
            fontFamily: fontFamily(t),
            fontWeight: fontWeight(selected && isCard ? t.weightBold : t.weightMedium),
            flexShrink: 1,
          }}
        >
          {label}
        </Text>
        {description ? (
          <Text
            style={{
              color: t.textMuted,
              fontSize: t.textXs,
              fontFamily: fontFamily(t),
              marginTop: 2,
            }}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export interface EmrSelectProps {
  controlId?: string;
  label: string;
  labelHidden?: boolean;
  options: readonly ClinicalOption[];
  value: string | null | undefined;
  placeholder?: string;
  clearable?: boolean;
  hint?: string;
  error?: string;
  required?: boolean;
  invalid?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  defaultOpen?: boolean;
  onValueChange?: (value: string | null) => void;
  onChange?: (value: string | null) => void;
  onCleared?: () => void;
}

/** L1. Single-choice dropdown: a field-shaped trigger that opens an anchored listbox on desktop/web or a compact sheet on narrow viewports. */
export function EmrSelect({
  controlId,
  label,
  labelHidden,
  options,
  value,
  placeholder,
  clearable,
  hint,
  error,
  required,
  invalid,
  readOnly,
  disabled,
  defaultOpen = false,
  onValueChange,
  onChange,
  onCleared,
}: EmrSelectProps) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const { width: winW, height: winH } = useWindowDimensions();
  const [open, setOpen] = useState(defaultOpen);
  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const triggerWrapRef = useRef<ComponentRef<typeof View>>(null);

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const g = globalThis as {
      addEventListener?: (type: string, fn: (e: { key?: string }) => void) => void;
      removeEventListener?: (type: string, fn: (e: { key?: string }) => void) => void;
    };
    const onKey = (e: { key?: string }) => {
      if (e.key === 'Escape') setOpen(false);
    };
    g.addEventListener?.('keydown', onKey);
    return () => g.removeEventListener?.('keydown', onKey);
  }, [open]);

  const openDropdown = () => {
    if (readOnly || disabled) return;
    if (triggerWrapRef.current && typeof triggerWrapRef.current.measureInWindow === 'function') {
      triggerWrapRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          setAnchor({ x, y, width, height });
        } else {
          setAnchor(null);
        }
        setOpen(true);
      });
    } else {
      setAnchor(null);
      setOpen(true);
    }
  };

  const normalizedValue = value === '' || value == null ? null : value;
  const emptyText = placeholder ?? labels.select;
  const current = options.find(option => option.value === normalizedValue)?.label;
  const groups = groupOptions(options);
  const canClear = Boolean(clearable && normalizedValue !== null && !readOnly && !disabled);

  const pick = (next: string | null) => {
    const normalizedNext = next === '' || next == null ? null : next;
    setOpen(false);
    if (normalizedNext !== normalizedValue) {
      onValueChange?.(normalizedNext);
      onChange?.(normalizedNext);
      if (normalizedNext === null) {
        onCleared?.();
      }
    }
  };

  const handleClear = () => {
    if (!canClear) return;
    setOpen(false);
    onValueChange?.(null);
    onChange?.(null);
    onCleared?.();
  };

  const isInvalid = Boolean(invalid || error);
  const minHeight = Math.max(44, t.controlHeight);
  const useAnchoredMenu = Boolean(anchor && winW >= 520);
  const menuMaxH = 280;
  const menuWidth = anchor ? Math.min(Math.max(anchor.width, 200), Math.max(200, winW - 24)) : 320;
  const flipUp = Boolean(anchor && anchor.y + anchor.height + menuMaxH + 12 > winH && anchor.y > menuMaxH);
  const anchoredLeft = anchor ? Math.max(12, Math.min(anchor.x, winW - menuWidth - 12)) : 0;
  const anchoredTop = anchor
    ? flipUp
      ? Math.max(12, anchor.y - Math.min(menuMaxH, (options.length + 1) * minHeight + 12) - 4)
      : anchor.y + anchor.height + 4
    : 0;

  const row = (
    key: string,
    text: string,
    selected: boolean,
    next: string | null,
    optionDisabled?: boolean,
    optionDescription?: string,
  ) => (
    <Pressable
      key={key}
      role="option"
      aria-selected={selected}
      aria-disabled={optionDisabled}
      disabled={optionDisabled}
      onPress={() => pick(next)}
      style={({ pressed, focused }: PressState) => [
        styles.option,
        focusRing(t, focused),
        {
          minHeight,
          borderRadius: 6,
          backgroundColor: selected ? t.primarySoft : pressed ? t.surfaceRaised : t.surface,
          opacity: optionDisabled ? 0.55 : 1,
        },
      ]}
    >
      <View aria-hidden style={styles.optionTick}>
        {selected ? <SvgIcon name="check" size={14} color={t.primary} /> : null}
      </View>
      <View style={styles.flex}>
        <Text
          numberOfLines={1}
          style={{
            color: next === null ? t.textMuted : selected ? t.primaryContrast : t.text,
            fontSize: t.textMd,
            fontFamily: fontFamily(t),
            fontWeight: fontWeight(selected ? t.weightBold : t.weightMedium),
          }}
        >
          {text}
        </Text>
        {optionDescription ? (
          <Text
            numberOfLines={2}
            style={{
              color: t.textMuted,
              fontSize: t.textXs,
              fontFamily: fontFamily(t),
            }}
          >
            {optionDescription}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );

  const shouldRenderChrome =
    labelHidden === false ||
    (labelHidden !== true &&
      (hint !== undefined ||
        error !== undefined ||
        required !== undefined ||
        controlId !== undefined ||
        (onValueChange !== undefined && onChange === undefined)));

  const combobox = (
    <View ref={triggerWrapRef} collapsable={false}>
      <View
        style={[
          styles.selectShell,
          {
            minHeight,
            borderColor: open ? t.primary : isInvalid ? t.danger : t.border,
            backgroundColor: disabled ? t.surfaceRaised : readOnly ? t.surfaceSoft : t.surface,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Pressable
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={`${label}, ${current ?? emptyText}`}
          aria-invalid={isInvalid || undefined}
          aria-required={required || undefined}
          aria-disabled={disabled}
          aria-readonly={readOnly}
          disabled={disabled}
          onPress={readOnly ? undefined : openDropdown}
          style={({ focused }: PressState) => [
            styles.selectTrigger,
            focusRing(t, focused),
            { minHeight },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[styles.flex, { color: current ? t.text : t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }]}
          >
            {current ?? emptyText}
          </Text>
          <SvgIcon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={t.textMuted} />
        </Pressable>
        {canClear ? (
          <Pressable
            role="button"
            aria-label={`${labels.clear} ${label}`}
            onPress={handleClear}
            style={({ pressed, focused }: PressState) => [
              styles.clearBtn,
              focusRing(t, focused),
              {
                minWidth: 44,
                minHeight,
                borderLeftColor: t.border,
                backgroundColor: pressed ? t.surfaceRaised : 'transparent',
              },
            ]}
          >
            <SvgIcon name="close" size={16} color={t.textMuted} />
          </Pressable>
        ) : null}
      </View>
      <Modal
        visible={open}
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          aria-label={labels.close}
          style={useAnchoredMenu ? styles.anchoredBackdrop : styles.backdrop}
          onPress={() => setOpen(false)}
        >
          {/* Inner Pressable swallows taps so only the backdrop closes the listbox. */}
          <Pressable
            {...({ role: 'listbox' } as object)}
            aria-label={label}
            style={[
              useAnchoredMenu
                ? {
                    position: 'absolute',
                    left: anchoredLeft,
                    top: anchoredTop,
                    width: menuWidth,
                    maxHeight: menuMaxH,
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 4,
                    overflow: 'hidden',
                    shadowColor: '#0f172a',
                    shadowOpacity: 0.16,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 8,
                  }
                : styles.sheet,
              { backgroundColor: t.surface, borderColor: t.border },
            ]}
          >
            {!useAnchoredMenu ? (
              <Text
                role="heading"
                style={[
                  styles.sheetTitle,
                  { color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) },
                ]}
              >
                {label}
              </Text>
            ) : null}
            <ScrollView style={useAnchoredMenu ? { maxHeight: menuMaxH - 8 } : undefined}>
              {row('', emptyText, normalizedValue === null, null)}
              {groups.map((grp, gIdx) =>
                grp.label ? (
                  <View key={`group-${grp.label}-${gIdx}`} role="group" aria-label={grp.label} style={styles.groupBlock}>
                    <Text
                      style={[
                        styles.groupHeader,
                        {
                          color: t.textMuted,
                          fontSize: t.textXs,
                          fontWeight: fontWeight(t.weightBold),
                          fontFamily: fontFamily(t),
                        },
                      ]}
                    >
                      {grp.label}
                    </Text>
                    {grp.options.map(option =>
                      row(
                        option.value,
                        option.label,
                        option.value === normalizedValue,
                        option.value,
                        option.disabled,
                        option.description,
                      ),
                    )}
                  </View>
                ) : (
                  grp.options.map(option =>
                    row(
                      option.value,
                      option.label,
                      option.value === normalizedValue,
                      option.value,
                      option.disabled,
                      option.description,
                    ),
                  )
                ),
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );

  if (!shouldRenderChrome) return combobox;
  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={labelHidden}
      required={required}
      hint={hint}
      error={error}
    >
      {combobox}
    </FieldChrome>
  );
}

/** Chips lay out as equal-width columns, so wrapped rows line up instead of going ragged. */
const CHIP_COLUMN_MIN = 140;
const ROW_GAP = 8;

/** `single`: one chip per line, for labels too long to share a row (a phone number must not break mid-digits). */
export function EmrRow({
  children,
  single,
  columns: fixedColumns,
}: {
  children: ReactNode;
  single?: boolean;
  columns?: number;
}) {
  const [width, setWidth] = useState(0);
  const items = Children.toArray(children);
  const autoCols = Math.max(1, Math.min(items.length || 1, Math.floor((width + ROW_GAP) / (CHIP_COLUMN_MIN + ROW_GAP))));
  const columns = single ? 1 : fixedColumns ? Math.max(1, fixedColumns) : autoCols;
  // Floor: cells that sum to the exact row width wrap on a sub-pixel rounding (seen on Android).
  const cell = width ? Math.floor((width - ROW_GAP * (columns - 1)) / columns) : undefined;
  return (
    <View style={styles.row} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {Children.map(children, child => (
        <View style={cell ? { width: cell } : styles.cellFallback}>{child}</View>
      ))}
    </View>
  );
}

export interface EmrBooleanInputProps {
  controlId?: string;
  label: string;
  hint?: string;
  warning?: string;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  onFocus?: () => void;
  checked?: boolean;
  onCheckedChange?: (value: boolean) => void;
  value?: boolean | null;
  onValueChange?: (value: boolean) => void;
  labelPlacement?: 'end' | 'start' | 'space-between';
}

export interface EmrCheckboxProps extends EmrBooleanInputProps {
  /** Checkbox only: some but not all of what it controls is ticked (aria-checked="mixed"). */
  mixed?: boolean;
}

export interface EmrToggleProps extends EmrBooleanInputProps {
  onLabel?: string;
  offLabel?: string;
}

/** One shared equal-width bordered card row for checkbox and toggle: control, label, and hint/error beneath. */
function BooleanRow({
  p,
  role,
  mixed,
  stateText,
  glyph,
}: {
  p: EmrBooleanInputProps;
  role: 'checkbox' | 'switch';
  mixed?: boolean;
  stateText?: string;
  glyph: (checked: boolean) => ReactNode;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generated = useId();
  const id = p.controlId ?? generated;
  const checked = (p.checked ?? p.value) === true;
  const hasMessage = !!(p.error || p.warning || p.hint);
  const ariaChecked: boolean | 'mixed' = role === 'checkbox' && mixed && !checked ? 'mixed' : checked;
  const placement = p.labelPlacement ?? 'end';

  const handleToggle = () => {
    const next = !checked;
    p.onCheckedChange?.(next);
    p.onValueChange?.(next);
  };

  const labelNode = (
    <Text
      numberOfLines={1}
      style={[
        styles.flex,
        { color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) },
      ]}
    >
      {p.label}
      {p.required ? <Text style={{ color: t.danger }}> *</Text> : null}
    </Text>
  );

  const glyphWithState = stateText ? (
    <View style={styles.toggleGlyphRow}>
      {glyph(checked)}
      <Text
        style={{
          color: checked ? t.primary : t.textMuted,
          fontSize: t.textXs,
          fontWeight: fontWeight(t.weightBold),
          fontFamily: fontFamily(t),
        }}
      >
        {stateText}
      </Text>
    </View>
  ) : (
    glyph(checked)
  );

  return (
    <FieldChrome
      label={p.label}
      labelHidden
      controlId={id}
      hint={p.hint || undefined}
      warning={p.warning || undefined}
      error={p.error || undefined}
    >
      <Pressable
        id={id}
        role={role}
        aria-checked={ariaChecked}
        aria-label={p.required ? `${p.label}, ${labels.required}` : p.label}
        aria-describedby={hasMessage ? `${id}-message` : undefined}
        aria-invalid={p.error ? true : undefined}
        aria-disabled={p.disabled}
        aria-readonly={p.readOnly}
        disabled={p.disabled}
        onFocus={p.onFocus}
        onPress={p.readOnly ? undefined : handleToggle}
        style={({ focused }: PressState) => [
          styles.booleanRow,
          placement === 'space-between' && styles.booleanRowBetween,
          focusRing(t, focused),
          {
            minHeight: Math.max(44, t.controlHeight),
            borderColor: p.error ? t.danger : checked ? t.primary : t.border,
            backgroundColor: checked ? t.primarySoft : p.readOnly ? t.surfaceSoft : t.surface,
            opacity: p.disabled ? 0.6 : 1,
          },
        ]}
      >
        {placement === 'end' ? (
          <>
            {glyphWithState}
            {labelNode}
          </>
        ) : (
          <>
            {labelNode}
            {glyphWithState}
          </>
        )}
      </Pressable>
    </FieldChrome>
  );
}

export function EmrCheckbox(p: EmrCheckboxProps) {
  const t = useEmrTheme();
  return (
    <BooleanRow
      p={p}
      role="checkbox"
      mixed={p.mixed}
      glyph={checked => (
        <View
          aria-hidden
          style={[
            styles.box,
            {
              borderColor: p.error ? t.danger : checked ? t.primary : t.border,
              backgroundColor: checked ? t.primary : t.surface,
            },
          ]}
        >
          {checked || p.mixed ? (
            <Text
              style={{
                color: checked ? t.surface : t.primary,
                fontSize: t.text2xs,
                lineHeight: 13,
                fontWeight: fontWeight(t.weightBold),
              }}
            >
              {checked ? '✓' : '–'}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}

/** Switch semantics: boolean aria-checked only (never 'mixed'), drawn as a track and thumb. */
export function EmrToggle(p: EmrToggleProps) {
  const t = useEmrTheme();
  const checked = (p.checked ?? p.value) === true;
  const stateText = checked ? p.onLabel : p.offLabel;
  return (
    <BooleanRow
      p={p}
      role="switch"
      stateText={stateText}
      glyph={isChecked => (
        <View
          aria-hidden
          style={[
            styles.track,
            { backgroundColor: isChecked ? t.primary : t.border, alignItems: isChecked ? 'flex-end' : 'flex-start' },
          ]}
        >
          <View style={[styles.thumb, { backgroundColor: t.surface }]} />
        </View>
      )}
    />
  );
}

const LONG_CHIP_LABEL = 24;

export function EmrRadioGroup(p: {
  controlId?: string;
  label: string;
  labelHidden?: boolean;
  hint?: string;
  warning?: string;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  onFocus?: () => void;
  value: string | null;
  options: readonly (ClinicalOption & { readonly description?: string; readonly group?: string })[];
  orientation?: 'horizontal' | 'vertical' | 'grid';
  columns?: number;
  variant?: 'standard' | 'card' | 'pill';
  clearable?: boolean;
  clearLabel?: string;
  allowDeselect?: boolean;
  onCleared?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onValueChange: (value: any) => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generated = useId();
  const id = p.controlId ?? generated;
  const hasMessage = !!(p.error || p.warning || p.hint);
  const single =
    p.orientation === 'vertical' ||
    (p.orientation === undefined && p.columns === undefined && p.options.some(o => o.label.length > LONG_CHIP_LABEL));
  const resolvedColumns = p.orientation === 'grid' ? (p.columns ?? 2) : p.columns;
  const hasSelection = p.value !== null && p.value !== undefined && p.value !== '';
  const canClear = Boolean(p.clearable && hasSelection && !p.readOnly && !p.disabled);

  const handleClear = () => {
    if (p.readOnly || p.disabled) return;
    p.onValueChange(null);
    p.onCleared?.();
  };

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
      <View
        role="radiogroup"
        aria-labelledby={p.labelHidden ? undefined : `${id}-label`}
        aria-label={p.label}
        aria-describedby={hasMessage ? `${id}-message` : undefined}
        aria-invalid={p.error ? true : undefined}
        aria-required={p.required}
        aria-readonly={p.readOnly}
        aria-disabled={p.disabled}
        style={styles.radioStack}
      >
        <EmrRow single={single} columns={resolvedColumns}>
          {p.options.map(option => {
            const selected = p.value === option.value;
            return (
              <EmrOptionChip
                key={option.value}
                label={option.label}
                description={option.description}
                variant={p.variant}
                selected={selected}
                readOnly={p.readOnly}
                disabled={p.disabled || option.disabled}
                onPress={() => {
                  p.onFocus?.();
                  if (selected && p.allowDeselect) {
                    p.onValueChange(null);
                    p.onCleared?.();
                  } else if (!selected) {
                    p.onValueChange(option.value);
                  }
                }}
              />
            );
          })}
        </EmrRow>
        {canClear ? (
          <View style={styles.radioClearRow}>
            <Pressable
              role="button"
              aria-label={`${p.clearLabel ?? labels.clear} ${p.label}`}
              onPress={handleClear}
              style={({ pressed, focused }: PressState) => [
                styles.radioClearBtn,
                focusRing(t, focused),
                {
                  minHeight: Math.max(44, t.controlHeight),
                  minWidth: 44,
                  borderColor: t.border,
                  backgroundColor: pressed ? t.surfaceRaised : t.surfaceSoft,
                },
              ]}
            >
              <Text
                style={{
                  color: t.textMuted,
                  fontSize: t.textXs,
                  fontWeight: fontWeight(t.weightBold),
                  fontFamily: fontFamily(t),
                }}
              >
                {p.clearLabel ?? labels.clear}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </FieldChrome>
  );
}

const styles = StyleSheet.create({
  badgeWrap: { flexDirection: 'row' },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  button: { borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  chip: { flexDirection: 'row', gap: 8, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'flex-start', alignItems: 'center' },
  chipCard: { paddingVertical: 10, paddingHorizontal: 14, alignItems: 'flex-start' },
  chipIndicator: { width: 16, height: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chipIndicatorTop: { marginTop: 2 },
  // alignSelf stretch: the columns are computed from this row's own width, so it must not shrink to its chips.
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: ROW_GAP, alignSelf: 'stretch' },
  cellFallback: { flexGrow: 1, flexBasis: CHIP_COLUMN_MIN, minWidth: 0 },
  flex: { flex: 1, minWidth: 0 },
  selectShell: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  selectTrigger: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, minWidth: 0 },
  clearBtn: { borderLeftWidth: 1, alignItems: 'center', justifyContent: 'center' },
  anchoredBackdrop: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { alignSelf: 'center', width: '100%', maxWidth: 480, maxHeight: '80%', borderWidth: 1, borderRadius: 12, paddingVertical: 8, overflow: 'hidden' },
  sheetTitle: { paddingHorizontal: 16, paddingVertical: 8 },
  groupBlock: { paddingTop: 4 },
  groupHeader: { paddingHorizontal: 12, paddingVertical: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6 },
  optionTick: { width: 18, alignItems: 'center', justifyContent: 'center' },
  booleanRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  booleanRowBetween: {
    justifyContent: 'space-between',
  },
  toggleGlyphRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  box: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  track: { width: 40, height: 22, borderRadius: 11, padding: 2, justifyContent: 'center', flexShrink: 0 },
  thumb: { width: 18, height: 18, borderRadius: 9 },
  radioStack: { gap: 6 },
  radioClearRow: { flexDirection: 'row', alignItems: 'center' },
  radioClearBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
