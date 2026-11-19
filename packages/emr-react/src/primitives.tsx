'use client';

import { Children, useEffect, useId, useRef, useState, type ComponentRef, type ReactElement, type ReactNode } from 'react';
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
import type {
  ClinicalOption,
  EmrBadge as EmrBadgeModel,
  EmrBadgeShape,
  EmrBadgeSize,
  EmrBadgeVariant,
  EmrCheckboxLabelPlacement,
  EmrCheckboxSize,
  EmrCheckboxVariant,
  EmrOption,
  EmrRadioGroupLabelPlacement,
  EmrRadioGroupOrientation,
  EmrRadioGroupSize,
  EmrRadioGroupVariant,
  EmrSelectSize,
  EmrSelectValue,
  EmrSelectVariant,
  EmrTone,
} from '@drguptavivek/emr-controller';
import {
  formatEmrBadgeCount,
  normalizeEmrBadgeShape,
  normalizeEmrBadgeSize,
  normalizeEmrBadgeTone,
  normalizeEmrBadgeVariant,
  resolveEmrCheckboxChecked,
  resolveEmrCheckboxToggle,
  resolveEmrToggleChecked,
} from './l1-controller.logic';
import { SvgIcon, type EmrIconName } from './icons';
import { FieldChrome } from './l1-field-chrome';
import {
  buildEmrSelectTriggerSummary,
  canClearRadioGroupValue,
  canMutateEmrToggle,
  clearEmrSelectValue,
  findNextEnabledEmrSelectOptionIndex,
  findTypeaheadEmrSelectOptionIndex,
  groupOptions,
  isEmrSelectClearable,
  isEmrSelectOptionBlockedByMax,
  isRadioOptionLocked,
  moveRadioGroupFocusIndex,
  normalizeEmrSelectMultiValue,
  normalizeEmrSelectSingleValue,
  normalizeEmrToggleLabelPlacement,
  normalizeEmrToggleSize,
  normalizeEmrToggleVariant,
  normalizeRadioGroupVariant,
  removeEmrSelectChip,
  resolveEmrSelectCloseOnSelect,
  resolveEmrToggleNext,
  resolveEmrToggleValidationState,
  resolveRadioGroupTabStopValue,
  toggleEmrSelectOption,
} from './l1-wave2.logic';
import { useEmrLabels } from './labels';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme, type EmrTheme } from './theme';

/** RNW adds `focused` to the Pressable state; RN's types only declare `pressed`. */
type PressState = PressableStateCallbackType & { focused?: boolean };

export interface EmrBadgeProps {
  badge?: EmrBadgeModel;
  tone?: EmrTone;
  label?: string;
  children?: ReactNode;
  variant?: EmrBadgeVariant;
  size?: EmrBadgeSize;
  shape?: EmrBadgeShape;
  icon?: string;
  dot?: boolean;
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  assistiveText?: string;
  controlId?: string;
  tabularNums?: boolean;
}

/** L1. Tone is controller-supplied; the label always carries the meaning, never colour alone. */
export function EmrBadgeView(p: EmrBadgeProps) {
  const t = useEmrTheme();
  const tone = normalizeEmrBadgeTone(p.badge?.tone ?? p.tone);
  const variant = normalizeEmrBadgeVariant(p.badge?.variant ?? p.variant);
  const size = normalizeEmrBadgeSize(p.badge?.size ?? p.size);
  const shape = normalizeEmrBadgeShape(p.badge?.shape ?? p.shape);
  const resolvedLabel = p.badge?.label ?? p.label;
  const rawIcon = p.badge?.icon ?? p.icon;
  const icon = rawIcon && rawIcon !== 'none' ? rawIcon : undefined;
  const dot = Boolean(p.badge?.dot ?? p.dot);
  const assistiveText = p.badge?.assistiveText ?? p.assistiveText;
  const countInfo = formatEmrBadgeCount(
    p.badge?.count ?? p.count,
    p.badge?.maxCount ?? p.maxCount ?? 99,
    p.badge?.showZero ?? p.showZero ?? false,
  );
  const hasVisibleContent = countInfo.text !== null || Boolean(resolvedLabel) || Boolean(p.children);
  if (!countInfo.visible && !resolvedLabel && !p.children && !dot) return null;
  const dotOnly = dot && !hasVisibleContent;

  const c = toneColors(t, tone);
  const isDark = t.background === '#020617';
  const solidBg = tone === 'neutral' ? t.text : c.color;
  const solidFg = tone === 'neutral' ? t.surface : isDark ? t.surface : '#ffffff';
  const bg = variant === 'solid' ? solidBg : variant === 'outline' ? 'transparent' : c.backgroundColor;
  const fg = variant === 'solid' ? solidFg : tone === 'neutral' ? t.text : c.color;
  const borderColor = variant === 'outline' ? (tone === 'neutral' ? t.border : c.color) : 'transparent';
  const isSm = size === 'sm';

  return (
    <View style={styles.badgeWrap}>
      <View
        nativeID={p.controlId}
        role={dotOnly ? 'img' : undefined}
        aria-label={dotOnly ? assistiveText || 'Status indicator' : undefined}
        style={[
          styles.badge,
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: isSm ? 4 : 5,
            minHeight: dotOnly ? (isSm ? 8 : 10) : isSm ? 20 : 24,
            minWidth: dotOnly ? (isSm ? 8 : 10) : undefined,
            width: dotOnly ? (isSm ? 8 : 10) : undefined,
            height: dotOnly ? (isSm ? 8 : 10) : undefined,
            paddingHorizontal: dotOnly ? 0 : isSm ? 8 : 10,
            paddingVertical: dotOnly ? 0 : isSm ? 2 : 3,
            borderRadius: shape === 'rounded' && !dotOnly ? 6 : 999,
            borderWidth: 1,
            borderColor,
            backgroundColor: bg,
            maxWidth: '100%',
          },
        ]}
      >
        {dot && !dotOnly ? (
          <View
            aria-hidden
            style={{
              width: isSm ? 6 : 7,
              height: isSm ? 6 : 7,
              borderRadius: 999,
              backgroundColor: fg,
            }}
          />
        ) : null}
        {icon ? <SvgIcon name={icon as EmrIconName} size={isSm ? 11 : 13} color={fg} /> : null}
        {countInfo.text !== null ? (
          <Text
            numberOfLines={1}
            style={[
              {
                color: fg,
                fontSize: isSm ? t.text2xs : t.textXs,
                lineHeight: isSm ? t.text2xs : t.textXs,
                fontWeight: fontWeight(t.weightBold),
                fontFamily: fontFamily(t),
              },
              Platform.OS === 'web' ? ({ fontVariantNumeric: 'tabular-nums' } as unknown as object) : null,
            ]}
          >
            {countInfo.text}
          </Text>
        ) : resolvedLabel ? (
          <Text
            numberOfLines={1}
            style={[
              {
                color: fg,
                fontSize: isSm ? t.text2xs : t.textXs,
                lineHeight: isSm ? t.text2xs : t.textXs,
                fontWeight: fontWeight(t.weightBold),
                fontFamily: fontFamily(t),
              },
              p.tabularNums
                ? Platform.OS === 'web'
                  ? ({ fontVariantNumeric: 'tabular-nums' } as unknown as object)
                  : ({ fontVariant: ['tabular-nums'] } as object)
                : null,
            ]}
          >
            {resolvedLabel}
          </Text>
        ) : p.children ? (
          typeof p.children === 'string' || typeof p.children === 'number' ? (
            <Text
              numberOfLines={1}
              style={{
                color: fg,
                fontSize: isSm ? t.text2xs : t.textXs,
                lineHeight: isSm ? t.text2xs : t.textXs,
                fontWeight: fontWeight(t.weightBold),
                fontFamily: fontFamily(t),
              }}
            >
              {p.children}
            </Text>
          ) : (
            p.children
          )
        ) : null}
        {!dotOnly && assistiveText ? (
          <Text
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              overflow: 'hidden',
              opacity: 0,
            }}
          >
            {` ${assistiveText}`}
          </Text>
        ) : null}
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
        backgroundColor: pressed ? t.primaryHover : t.surfaceBlue,
        borderColor: t.border,
        textColor: t.text,
      };
    case 'outline':
      return {
        backgroundColor: pressed ? t.primaryHover : t.surface,
        borderColor: t.primaryBorder,
        textColor: t.primary,
      };
    case 'ghost':
      return {
        backgroundColor: pressed ? t.surfaceSoft : 'transparent',
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
  onFocus,
  onBlur,
  variant = 'primary',
  size,
  shape = 'default',
  pressed: ariaPressed,
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
  onFocus?: () => void;
  onBlur?: () => void;
  variant?: EmrButtonVariant;
  size?: EmrButtonSize;
  shape?: 'default' | 'pill';
  pressed?: boolean;
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
      aria-pressed={ariaPressed}
      disabled={disabled}
      onPress={inert ? undefined : onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      {...(Platform.OS === 'web' && type ? ({ type } as object) : null)}
      style={({ pressed, hovered, focused }: PressState & { hovered?: boolean }) => {
        const palette = resolveButtonPalette(t, variant, Boolean((pressed || hovered) && !inert));
        return [
          styles.button,
          focusRing(t, focused),
          {
            minHeight: height,
            minWidth: 44,
            paddingHorizontal: horizontalPad,
            borderRadius: shape === 'pill' ? 999 : 8,
            alignSelf: block ? 'stretch' : undefined,
            width: block ? '100%' : undefined,
            backgroundColor: palette.backgroundColor,
            borderColor: palette.borderColor,
            opacity: disabled ? 0.6 : 1,
          },
        ];
      }}
    >
      {({ pressed, hovered }: PressState & { hovered?: boolean }) => {
        const { textColor } = resolveButtonPalette(t, variant, Boolean((pressed || hovered) && !inert));
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

/** Convert a #RRGGBB hex token to rgba() so react-native-web and native both render translucent surfaces. */
function withAlpha(color: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** L1. A selectable chip: radio inside a radiogroup, checkbox for multi-select. */
export function EmrOptionChip({
  label,
  description,
  badge,
  tone,
  variant = 'standard',
  size = 'md',
  labelPlacement = 'end',
  selected,
  multiple,
  invalid,
  warning,
  readOnly,
  disabled,
  tabIndex,
  buttonRef,
  onKeyDown,
  onPress,
  onFocus,
  onBlur,
}: {
  label: string;
  description?: string;
  badge?: EmrBadgeModel | string;
  tone?: EmrTone;
  variant?: 'tile' | 'inline' | 'standard' | 'card' | 'pill' | 'chip';
  size?: EmrRadioGroupSize;
  labelPlacement?: EmrRadioGroupLabelPlacement;
  selected: boolean;
  multiple?: boolean;
  invalid?: boolean;
  warning?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  tabIndex?: number;
  buttonRef?: (el: { focus?: () => void } | null) => void;
  onKeyDown?: (event: { key?: string; preventDefault?: () => void }) => void;
  onPress: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const t = useEmrTheme();
  const minTarget = Math.max(44, t.controlHeight);
  const isInline = variant === 'inline';
  const isPill = variant === 'pill' || variant === 'chip';
  const isCard = variant === 'card' || Boolean(description);
  const isSm = size === 'sm';
  const indicatorSize = isSm ? 16 : 20;
  const tonePalette = tone ? toneColors(t, tone) : null;
  const badgeLabel =
    typeof badge === 'string'
      ? badge
      : badge?.label ?? (badge?.count !== undefined ? String(badge.count) : undefined);
  const badgeTone = (typeof badge === 'object' && badge?.tone) || tone || 'neutral';
  const badgeTonePalette = toneColors(t, badgeTone);

  const handleWebKeyDown = (event: { key?: string; preventDefault?: () => void }) => {
    if (onKeyDown) {
      onKeyDown(event);
      return;
    }
    if (disabled || readOnly) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault?.();
      onPress();
    }
  };
  const indicatorNode = (
    <View
      aria-hidden
      style={[
        styles.chipIndicator,
        isCard && styles.chipIndicatorTop,
        {
          width: indicatorSize,
          height: indicatorSize,
          borderRadius: multiple ? 4 : indicatorSize / 2,
          borderColor: invalid ? t.danger : selected ? t.primary : t.border,
          backgroundColor: multiple && selected ? t.primary : t.surface,
        },
      ]}
    >
      {selected ? (
        multiple ? (
          <SvgIcon name="check" size={isSm ? 10 : 12} color={t.surface} />
        ) : (
          <View
            style={{
              width: isSm ? 8 : 10,
              height: isSm ? 8 : 10,
              borderRadius: isSm ? 4 : 5,
              backgroundColor: t.primary,
            }}
          />
        )
      ) : null}
    </View>
  );
  const copyNode = (
    <View style={[labelPlacement !== 'start' && styles.flex, { minWidth: 0, flexShrink: 1 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Text
          style={{
            color: selected ? t.primaryContrast : t.text,
            fontSize: isSm ? t.textSm : t.textMd,
            fontFamily: fontFamily(t),
            fontWeight: fontWeight(selected && isCard ? t.weightBold : t.weightMedium),
            flexShrink: 1,
          }}
        >
          {label}
        </Text>
        {badgeLabel ? (
          <View
            style={{
              paddingHorizontal: 7,
              paddingVertical: 2,
              borderRadius: 999,
              backgroundColor: withAlpha(badgeTonePalette.color, 0.14),
            }}
          >
            <Text
              style={{
                color: badgeTonePalette.color,
                fontSize: t.text2xs,
                fontFamily: fontFamily(t),
                fontWeight: fontWeight(t.weightBold),
              }}
            >
              {badgeLabel}
            </Text>
          </View>
        ) : null}
      </View>
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
  );
  return (
    <Pressable
      ref={buttonRef as never}
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      aria-disabled={disabled}
      aria-readonly={readOnly}
      disabled={disabled}
      {...(Platform.OS === 'web'
        ? ({
            ...(tabIndex !== undefined ? { tabIndex } : {}),
            onKeyDown: handleWebKeyDown,
          } as Record<string, unknown>)
        : {})}
      onFocus={onFocus}
      onBlur={onBlur}
      // Read-only stays focusable and announced; it just does nothing on press.
      onPress={readOnly ? undefined : onPress}
      style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
        styles.chip,
        isCard && styles.chipCard,
        isInline && { paddingHorizontal: 2, backgroundColor: 'transparent' },
        isSm && { paddingHorizontal: isInline ? 2 : 10, gap: 8 },
        labelPlacement === 'space-between' && { justifyContent: 'space-between', width: '100%' },
        focusRing(t, focused),
        {
          minHeight: minTarget,
          minWidth: minTarget,
          maxWidth: '100%',
          borderRadius: isPill ? 999 : isCard ? 10 : 8,
          borderColor: isInline
            ? 'transparent'
            : invalid
              ? t.danger
              : warning
                ? t.warning
                : selected
                  ? (tonePalette?.color ?? t.primary)
                  : hovered && !disabled && !readOnly
                    ? t.focus
                    : t.border,
          borderStyle: readOnly && !selected && !isInline ? 'dashed' : 'solid',
          borderWidth: isInline ? 0 : 1,
          backgroundColor: isInline
            ? 'transparent'
            : selected
              ? (tonePalette ? withAlpha(tonePalette.color, 0.12) : t.primarySoft)
              : readOnly
                ? t.surfaceSoft
                : hovered && !disabled
                  ? t.surfaceSoft
                  : t.surface,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      {labelPlacement === 'end' ? (
        <>
          {indicatorNode}
          {copyNode}
        </>
      ) : (
        <>
          {copyNode}
          {indicatorNode}
        </>
      )}
    </Pressable>
  );
}

export interface EmrSelectBaseProps {
  controlId?: string;
  label: string;
  labelHidden?: boolean;
  ariaLabel?: string;
  options: readonly EmrOption[];
  placeholder?: string;
  size?: EmrSelectSize | 'lg';
  tabularNums?: boolean;
  variant?: EmrSelectVariant;
  clearable?: boolean;
  clearLabel?: string;
  closeOnSelect?: boolean;
  maxSelections?: number;
  maxTagCount?: number;
  emptyMessage?: string;
  loading?: boolean;
  hint?: string;
  warning?: string;
  hasWarning?: boolean;
  error?: string;
  ariaDescribedBy?: string;
  required?: boolean;
  invalid?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  defaultOpen?: boolean;
  onCleared?: () => void;
  onOpenChange?: (open: boolean) => void;
  onFocused?: () => void;
  onBlurred?: () => void;
}

export interface EmrSelectSingleProps extends EmrSelectBaseProps {
  multiple?: false;
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  onChange?: (value: string | null) => void;
}

export interface EmrSelectMultiProps extends EmrSelectBaseProps {
  multiple: true;
  value?: readonly string[] | null;
  onValueChange?: (value: readonly string[]) => void;
  onChange?: (value: readonly string[]) => void;
}

export interface EmrSelectDynamicProps extends EmrSelectBaseProps {
  multiple?: boolean;
  value?: EmrSelectValue;
  onValueChange?: (value: EmrSelectValue) => void;
  onChange?: (value: EmrSelectValue) => void;
}

export type EmrSelectProps = EmrSelectSingleProps | EmrSelectMultiProps | EmrSelectDynamicProps;

/** L1. Single- or multi-choice dropdown: a field-shaped trigger that opens an anchored listbox on desktop/web or a compact sheet on narrow viewports. */
export function EmrSelect(props: EmrSelectSingleProps): ReactElement;
export function EmrSelect(props: EmrSelectMultiProps): ReactElement;
export function EmrSelect(props: EmrSelectDynamicProps): ReactElement;
export function EmrSelect(props: EmrSelectProps): ReactElement {
  const {
    controlId,
    label,
    labelHidden,
    ariaLabel,
    options,
    multiple = false,
    value,
    placeholder,
    size = 'md',
    tabularNums = false,
    variant = 'outline',
    clearable,
    clearLabel,
    closeOnSelect,
    maxSelections,
    maxTagCount,
    emptyMessage,
    loading = false,
    hint,
    warning,
    hasWarning,
    error,
    ariaDescribedBy,
    required,
    invalid,
    readOnly,
    disabled,
    defaultOpen = false,
    onValueChange,
    onChange,
    onCleared,
    onOpenChange,
    onFocused,
    onBlurred,
  } = props as EmrSelectDynamicProps;
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const { width: winW, height: winH } = useWindowDimensions();
  const [open, setOpenState] = useState(defaultOpen);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const triggerWrapRef = useRef<ComponentRef<typeof View>>(null);
  const triggerBtnRef = useRef<ComponentRef<typeof Pressable>>(null);
  const typeaheadRef = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | null }>({
    buffer: '',
    timer: null,
  });
  const suppressNextEnterPressRef = useRef(false);

  const setOpen = (next: boolean, restoreFocus = false) => {
    setOpenState(prev => {
      if (prev !== next) onOpenChange?.(next);
      return next;
    });
    if (!next) {
      setActiveIndex(-1);
      if (restoreFocus && Platform.OS === 'web') {
        const node = triggerBtnRef.current as unknown as { focus?: () => void } | null;
        node?.focus?.();
      }
    }
  };

  const groups = groupOptions(options);
  const flatOptions = groups.flatMap(g => g.options);
  const selectedValues: readonly string[] = multiple
    ? normalizeEmrSelectMultiValue(value)
    : (() => {
        const s = normalizeEmrSelectSingleValue(value);
        return s === null ? [] : [s];
      })();

  const optionDomId = (val: string) => `${id}-opt-${val.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const activeDescendantId =
    open && activeIndex >= 0 && activeIndex < flatOptions.length
      ? optionDomId(flatOptions[activeIndex]!.value)
      : undefined;

  const keyDownRef = useRef<(e: {
    key?: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    preventDefault?: () => void;
    stopPropagation?: () => void;
  }) => void>(() => {});

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const g = globalThis as {
      addEventListener?: (type: string, fn: (e: KeyboardEvent) => void, capture?: boolean) => void;
      removeEventListener?: (type: string, fn: (e: KeyboardEvent) => void, capture?: boolean) => void;
    };
    const onKey = (e: KeyboardEvent) => {
      keyDownRef.current(e);
    };
    g.addEventListener?.('keydown', onKey, true);
    return () => g.removeEventListener?.('keydown', onKey, true);
  }, [open]);

  const openDropdown = () => {
    if (readOnly || disabled) return;
    const selectedIdx = flatOptions.findIndex(o => !o.disabled && selectedValues.includes(o.value));
    setActiveIndex(selectedIdx >= 0 ? selectedIdx : findNextEnabledEmrSelectOptionIndex(flatOptions, -1, 'ArrowDown'));
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

  const emptyText = placeholder ?? labels.select;
  const triggerSummary = buildEmrSelectTriggerSummary({
    multiple,
    value,
    options,
    placeholder: emptyText,
    maxTagCount,
  });
  const canClear = isEmrSelectClearable({
    clearable: Boolean(clearable),
    disabled: Boolean(disabled),
    readOnly: Boolean(readOnly),
    multiple,
    value,
    options,
  });

  const emitValue = (next: EmrSelectValue) => {
    onValueChange?.(next);
    onChange?.(next);
  };

  const pickOption = (option: EmrOption) => {
    if (readOnly || disabled || option.disabled || option.readOnly) return;
    const shouldClose = resolveEmrSelectCloseOnSelect(multiple, closeOnSelect);
    if (multiple) {
      const next = toggleEmrSelectOption({
        optionValue: option.value,
        current: selectedValues,
        options,
        maxSelections,
      });
      if (next !== selectedValues) emitValue(next);
      if (shouldClose) setOpen(false, true);
      return;
    }
    const single = normalizeEmrSelectSingleValue(value);
    if (shouldClose) setOpen(false, true);
    if (option.value !== single) emitValue(option.value);
  };

  const handleRemoveChip = (optionValue: string) => {
    if (readOnly || disabled || !multiple) return;
    const next = removeEmrSelectChip({ optionValue, current: selectedValues, options });
    if (next !== selectedValues) emitValue(next);
  };

  const handleClear = () => {
    if (!canClear) return;
    const next = clearEmrSelectValue({ multiple, value, options });
    setOpen(false, true);
    emitValue(next);
    onCleared?.();
  };

  const handleWebKeyDown = (e: {
    key?: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    preventDefault?: () => void;
    stopPropagation?: () => void;
  }) => {
    if (readOnly || disabled) return;
    const key = e.key ?? '';
    if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
      e.preventDefault?.();
      if (!open) {
        openDropdown();
        if (key === 'End') {
          setActiveIndex(findNextEnabledEmrSelectOptionIndex(flatOptions, -1, 'End'));
        }
        return;
      }
      const next = findNextEnabledEmrSelectOptionIndex(flatOptions, activeIndex, key);
      if (next >= 0) setActiveIndex(next);
      return;
    }
    if (key === 'Enter' || key === ' ') {
      e.preventDefault?.();
      e.stopPropagation?.();
      if (key === 'Enter') {
        suppressNextEnterPressRef.current = true;
        setTimeout(() => {
          suppressNextEnterPressRef.current = false;
        }, 100);
      }
      if (!open) {
        openDropdown();
      } else if (activeIndex >= 0 && activeIndex < flatOptions.length) {
        pickOption(flatOptions[activeIndex]!);
      }
      return;
    }
    if (key === 'Escape' && open) {
      e.preventDefault?.();
      e.stopPropagation?.();
      setOpen(false, true);
      return;
    }
    if (!e.ctrlKey && !e.metaKey && !e.altKey && key.length === 1 && flatOptions.length > 0) {
      e.preventDefault?.();
      typeaheadRef.current.buffer += key;
      if (typeaheadRef.current.timer) clearTimeout(typeaheadRef.current.timer);
      typeaheadRef.current.timer = setTimeout(() => {
        typeaheadRef.current.buffer = '';
        typeaheadRef.current.timer = null;
      }, 500);
      const match = findTypeaheadEmrSelectOptionIndex(flatOptions, typeaheadRef.current.buffer, activeIndex);
      if (match >= 0) {
        if (!open) openDropdown();
        setActiveIndex(match);
      }
    }
  };
  keyDownRef.current = handleWebKeyDown;

  const isInvalid = Boolean(invalid || error);
  const isWarning = Boolean(!isInvalid && (hasWarning || warning));
  const minHeight = size === 'lg' ? Math.max(48, t.controlHeight) : Math.max(44, t.controlHeight);
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

  const shellBg = disabled
    ? t.surfaceRaised
    : readOnly
      ? t.surfaceSoft
      : variant === 'filled'
        ? t.surfaceSoft
        : variant === 'subtle'
          ? 'transparent'
          : t.surface;

  const shellBorder = open
    ? t.primary
    : isInvalid
      ? t.danger
      : isWarning
        ? t.warning
        : variant === 'filled' || variant === 'subtle'
          ? 'transparent'
          : t.border;

  const renderOption = (option: EmrOption) => {
    const selected = selectedValues.includes(option.value);
    const blockedByMax = multiple && isEmrSelectOptionBlockedByMax(option.value, selectedValues, maxSelections);
    const optionDisabled = Boolean(option.disabled || blockedByMax);
    const isActive = activeIndex >= 0 && flatOptions[activeIndex]?.value === option.value;
    const badgeText = option.badge ? (typeof option.badge === 'string' ? option.badge : option.badge.label) : '';
    const badgeTone =
      option.badge && typeof option.badge !== 'string' ? option.badge.tone : (option.tone ?? 'neutral');
    const badgePalette = toneColors(t, badgeTone);

    return (
      <Pressable
        key={option.value}
        id={optionDomId(option.value)}
        role="option"
        aria-selected={selected}
        aria-readonly={option.readOnly ? true : undefined}
        aria-disabled={optionDisabled}
        disabled={optionDisabled}
        onPress={() => pickOption(option)}
        style={({ pressed, focused }: PressState) => [
          styles.option,
          focusRing(t, focused),
          {
            minHeight,
            borderRadius: 6,
            backgroundColor: selected
              ? t.primarySoft
              : pressed || isActive
                ? t.surfaceRaised
                : t.surface,
            opacity: optionDisabled ? 0.5 : option.readOnly ? 0.85 : 1,
          },
        ]}
      >
        <View aria-hidden style={styles.optionTick}>
          {selected ? <SvgIcon name="check" size={14} color={t.primary} /> : null}
        </View>
        <View style={styles.flex}>
          <View style={styles.optionRow}>
            <Text
              numberOfLines={1}
              style={[
                {
                  flex: 1,
                  color: selected ? t.primaryContrast : t.text,
                  fontSize: size === 'sm' ? t.textSm : t.textMd,
                  fontFamily: fontFamily(t),
                  fontWeight: fontWeight(selected ? t.weightBold : t.weightMedium),
                },
                tabularNums
                  ? Platform.OS === 'web'
                    ? ({ fontVariantNumeric: 'tabular-nums' } as unknown as object)
                    : ({ fontVariant: ['tabular-nums'] } as object)
                  : null,
              ]}
            >
              {option.label}
            </Text>
            {badgeText ? (
              <View
                style={[
                  styles.optionBadge,
                  {
                    backgroundColor: withAlpha(badgePalette.color, 0.12),
                    borderColor: badgePalette.color,
                  },
                ]}
              >
                <Text
                  style={{
                    color: badgePalette.color,
                    fontSize: t.textXs,
                    fontFamily: fontFamily(t),
                    fontWeight: fontWeight(t.weightBold),
                  }}
                >
                  {badgeText}
                </Text>
              </View>
            ) : null}
          </View>
          {option.description ? (
            <Text
              numberOfLines={2}
              style={{
                color: t.textMuted,
                fontSize: t.textXs,
                fontFamily: fontFamily(t),
              }}
            >
              {option.description}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const shouldRenderChrome =
    labelHidden === false ||
    (labelHidden !== true &&
      (hint !== undefined ||
        warning !== undefined ||
        error !== undefined ||
        required !== undefined ||
        controlId !== undefined ||
        (onValueChange !== undefined && onChange === undefined)));

  const baseAriaLabel = (ariaLabel ?? '').trim() || label;

  const combobox = (
    <View ref={triggerWrapRef} collapsable={false}>
      <View
        style={[
          styles.selectShell,
          {
            minHeight,
            borderColor: shellBorder,
            backgroundColor: shellBg,
            borderStyle: readOnly ? 'dashed' : 'solid',
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        {multiple && (triggerSummary.visibleChips.length > 0 || triggerSummary.overflowCount > 0) ? (
          <View style={styles.selectChips} aria-label={`${baseAriaLabel} selected items`}>
            {triggerSummary.visibleChips.map(chip => {
              const chipPalette = chip.tone ? toneColors(t, chip.tone) : null;
              const chipLocked = Boolean(readOnly || disabled || chip.readOnly || chip.disabled);
              return (
                <View
                  key={chip.value}
                  style={[
                    styles.selectChip,
                    {
                      backgroundColor: chipPalette ? withAlpha(chipPalette.color, 0.12) : t.surfaceSoft,
                      borderColor: chipPalette ? chipPalette.color : t.border,
                      borderStyle: chip.readOnly ? 'dashed' : 'solid',
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: chipPalette ? chipPalette.color : t.text,
                      fontSize: t.textXs,
                      fontFamily: fontFamily(t),
                      fontWeight: fontWeight(t.weightMedium),
                    }}
                  >
                    {chip.label}
                  </Text>
                  {!chipLocked ? (
                    <Pressable
                      role="button"
                      aria-label={`Remove ${chip.label}`}
                      onPress={() => handleRemoveChip(chip.value)}
                      style={({ focused }: PressState) => [styles.selectChipRemove, focusRing(t, focused)]}
                    >
                      <SvgIcon name="close" size={12} color={chipPalette ? chipPalette.color : t.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
            {triggerSummary.overflowCount > 0 ? (
              <View style={[styles.selectChip, { backgroundColor: t.surfaceSoft, borderColor: t.border }]}>
                <Text
                  style={{
                    color: t.textMuted,
                    fontSize: t.textXs,
                    fontFamily: fontFamily(t),
                    fontWeight: fontWeight(t.weightMedium),
                  }}
                >
                  +{triggerSummary.overflowCount}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <Pressable
          ref={triggerBtnRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-busy={loading ? true : undefined}
          aria-activedescendant={activeDescendantId}
          aria-label={`${baseAriaLabel}, ${triggerSummary.text}`}
          aria-describedby={ariaDescribedBy}
          aria-invalid={isInvalid || undefined}
          aria-required={required || undefined}
          aria-disabled={disabled}
          aria-readonly={readOnly}
          disabled={disabled}
          onPress={
            readOnly
              ? undefined
              : () => {
                  if (suppressNextEnterPressRef.current) {
                    suppressNextEnterPressRef.current = false;
                    return;
                  }
                  if (open) setOpen(false, true);
                  else openDropdown();
                }
          }
          onFocus={() => onFocused?.()}
          onBlur={e => (onBlurred as ((ev?: unknown) => void) | undefined)?.(e)}
          {...(Platform.OS === 'web' ? ({ onKeyDown: handleWebKeyDown } as object) : {})}
          style={({ hovered, focused }: PressState & { hovered?: boolean }) => [
            styles.selectTrigger,
            focusRing(t, focused),
            {
              minHeight: Math.max(44, minHeight),
              backgroundColor: hovered && !disabled && !readOnly ? t.surfaceSoft : undefined,
            },
          ]}
        >
          {!multiple || (triggerSummary.visibleChips.length === 0 && triggerSummary.overflowCount === 0) ? (
            <Text
              numberOfLines={1}
              style={[
                styles.flex,
                {
                  color: triggerSummary.hasSelection ? t.text : t.textMuted,
                  fontSize: size === 'sm' ? t.textSm : t.textMd,
                  fontFamily: fontFamily(t),
                },
                tabularNums
                  ? Platform.OS === 'web'
                    ? ({ fontVariantNumeric: 'tabular-nums' } as unknown as object)
                    : ({ fontVariant: ['tabular-nums'] } as object)
                  : null,
              ]}
            >
              {triggerSummary.text}
            </Text>
          ) : (
            <View style={styles.flex} />
          )}
          {loading ? (
            <ActivityIndicator size="small" color={t.textMuted} />
          ) : (
            <SvgIcon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={t.textMuted} />
          )}
        </Pressable>
        {canClear ? (
          <Pressable
            role="button"
            aria-label={`${clearLabel ?? labels.clear} ${baseAriaLabel}`}
            {...(Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : {})}
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
        onRequestClose={() => setOpen(false, true)}
      >
        <Pressable
          aria-label={labels.close}
          focusable={false}
          {...(Platform.OS === 'web' ? ({ tabIndex: -1 } as object) : {})}
          style={useAnchoredMenu ? styles.anchoredBackdrop : styles.backdrop}
          onPress={() => setOpen(false, true)}
        >
          {/* Inner Pressable swallows taps so only the backdrop closes the listbox. */}
          <Pressable
            {...({ role: 'listbox', 'aria-multiselectable': multiple ? true : undefined } as object)}
            aria-label={baseAriaLabel}
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
              {loading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="small" color={t.textMuted} />
                  <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>
                    Loading…
                  </Text>
                </View>
              ) : options.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>
                    {emptyMessage ?? 'No options available'}
                  </Text>
                </View>
              ) : (
                groups.map((grp, gIdx) =>
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
                      {grp.options.map(renderOption)}
                    </View>
                  ) : (
                    grp.options.map(renderOption)
                  ),
                )
              )}
            </ScrollView>
            {!useAnchoredMenu ? (
              <View style={[styles.sheetFooter, { borderTopColor: t.border }]}>
                {canClear ? (
                  <Pressable
                    role="button"
                    onPress={handleClear}
                    style={[styles.sheetFooterBtn, { borderColor: t.border, backgroundColor: t.surfaceSoft }]}
                  >
                    <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t), fontWeight: fontWeight(t.weightMedium) }}>
                      {clearLabel ?? labels.clear}
                    </Text>
                  </Pressable>
                ) : null}
                {(() => {
                  const donePalette = resolveButtonPalette(t, 'primary', false);
                  return (
                    <Pressable
                      role="button"
                      onPress={() => setOpen(false, true)}
                      style={[
                        styles.sheetFooterBtn,
                        { borderColor: donePalette.borderColor, backgroundColor: donePalette.backgroundColor },
                      ]}
                    >
                      <Text
                        style={{
                          color: donePalette.textColor,
                          fontSize: t.textMd,
                          fontFamily: fontFamily(t),
                          fontWeight: fontWeight(t.weightBold),
                        }}
                      >
                        Done
                      </Text>
                    </Pressable>
                  );
                })()}
              </View>
            ) : null}
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
      warning={warning}
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
  label?: string;
  description?: string;
  labelHidden?: boolean;
  ariaLabel?: string;
  variant?: EmrCheckboxVariant;
  size?: EmrCheckboxSize;
  hint?: string;
  warning?: string;
  hasWarning?: boolean;
  error?: string;
  ariaDescribedBy?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  loading?: boolean;
  invalid?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onFocused?: () => void;
  onBlurred?: () => void;
  checked?: boolean;
  onCheckedChange?: (value: boolean) => void;
  value?: boolean | null;
  onValueChange?: (value: boolean) => void;
  labelPlacement?: EmrCheckboxLabelPlacement;
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
  glyph: (checked: boolean, interaction: { hovered?: boolean; pressed?: boolean }) => ReactNode;
}) {
  const t = useEmrTheme();
  const generated = useId();
  const id = p.controlId ?? generated;
  const checked = resolveEmrCheckboxChecked(p.value, p.checked);
  const isMixed = role === 'checkbox' && Boolean(mixed);
  const isVisualActive = checked || isMixed;
  const hasMessage = !!(p.error || p.warning || p.hint);
  const ariaChecked: boolean | 'mixed' = isMixed ? 'mixed' : checked;
  const placement = normalizeEmrToggleLabelPlacement(p.labelPlacement);
  const variant = normalizeEmrToggleVariant(p.variant);
  const size = normalizeEmrToggleSize(p.size);
  const labelText = p.label ?? '';
  const validation = resolveEmrToggleValidationState({
    error: p.error,
    warning: p.warning,
    invalid: p.invalid,
  });
  const isInvalid = validation.isInvalid;
  const hasWarning = !isInvalid && (validation.hasWarning || Boolean(p.hasWarning));
  const describedByIds =
    [p.ariaDescribedBy, hasMessage && !p.labelHidden ? `${id}-message` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  const canMutate = role === 'switch' ? canMutateEmrToggle(p.readOnly, p.disabled, p.loading) : !p.disabled && !p.readOnly && !p.loading;

  const handleToggle = () => {
    if (!canMutate) return;
    const next = role === 'checkbox' ? resolveEmrCheckboxToggle(checked, mixed) : resolveEmrToggleNext(checked);
    p.onCheckedChange?.(next);
    p.onValueChange?.(next);
  };

  const handleWebKeyDown = (event: { key?: string; preventDefault?: () => void }) => {
    if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter') {
      event.preventDefault?.();
      handleToggle();
    }
  };

  const labelNode = p.labelHidden ? null : (
    <View style={[(variant === 'tile' || placement === 'space-between') && styles.flex, { minWidth: 0, flexShrink: 1, gap: 2 }]}>
      <Text
        style={{
          color: t.text,
          fontSize: size === 'sm' ? t.textSm : t.textMd,
          lineHeight: Math.round((size === 'sm' ? t.textSm : t.textMd) * 1.45),
          fontWeight: fontWeight(t.weightRegular),
          fontFamily: fontFamily(t),
        }}
      >
        {labelText}
        {p.required ? <Text aria-hidden style={{ color: t.danger }}> *</Text> : null}
      </Text>
      {p.description ? (
        <Text
          style={{
            color: t.textMuted,
            fontSize: t.textXs,
            lineHeight: Math.round(t.textXs * 1.4),
            fontFamily: fontFamily(t),
          }}
        >
          {p.description}
        </Text>
      ) : null}
    </View>
  );

  const stateNode = !p.labelHidden && stateText ? (
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
  ) : null;

  return (
    <FieldChrome
      label={labelText}
      labelHidden
      controlId={id}
      hint={p.labelHidden ? undefined : p.hint || undefined}
      warning={p.labelHidden ? undefined : p.warning || undefined}
      error={p.labelHidden ? undefined : p.error || undefined}
    >
      <Pressable
        id={id}
        role={role}
        accessibilityRole={role}
        accessibilityState={{
          checked: isMixed ? 'mixed' : checked,
          disabled: !!p.disabled,
          busy: !!p.loading,
        }}
        aria-checked={ariaChecked}
        aria-required={p.required || undefined}
        aria-label={p.ariaLabel || (p.labelHidden ? labelText || undefined : undefined)}
        aria-describedby={describedByIds}
        aria-invalid={isInvalid || undefined}
        aria-busy={p.loading || undefined}
        aria-disabled={p.disabled || undefined}
        aria-readonly={p.readOnly || undefined}
        disabled={p.disabled}
        onFocus={() => {
          p.onFocus?.();
          p.onFocused?.();
        }}
        onBlur={() => {
          p.onBlur?.();
          p.onBlurred?.();
        }}
        onPress={Platform.OS === 'web' ? undefined : handleToggle}
        {...(Platform.OS === 'web' ? ({ onClick: handleToggle, onKeyDown: handleWebKeyDown } as object) : {})}
        style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
          styles.booleanRow,
          variant === 'inline' && {
            borderWidth: 0,
            backgroundColor: 'transparent',
            paddingHorizontal: 2,
            paddingVertical: size === 'sm' ? 8 : 10,
            width: placement === 'space-between' && !p.labelHidden ? '100%' : 'auto',
            maxWidth: '100%',
            alignSelf: placement === 'space-between' && !p.labelHidden ? 'stretch' : 'flex-start',
          },
          size === 'md' && variant === 'tile' && { paddingHorizontal: 12, paddingVertical: 10 },
          size === 'sm' && variant === 'tile' && { paddingHorizontal: 10, paddingVertical: 8 },
          placement === 'space-between' && !p.labelHidden && styles.booleanRowBetween,
          p.labelHidden && { justifyContent: 'center', alignItems: 'center', width: 'auto', alignSelf: 'flex-start' },
          !p.labelHidden && { alignItems: role === 'checkbox' ? 'flex-start' : 'center' },
          focusRing(t, focused),
          {
            minHeight: Math.max(44, t.controlHeight),
            minWidth: Math.max(44, t.controlHeight),
            borderColor:
              variant === 'inline'
                ? 'transparent'
                : isInvalid
                  ? t.danger
                  : hasWarning
                    ? t.warning
                    : isVisualActive
                      ? t.primary
                      : hovered && canMutate
                        ? t.focus
                        : t.border,
            borderStyle: p.readOnly && variant === 'tile' ? 'dashed' : 'solid',
            backgroundColor:
              variant === 'inline'
                ? 'transparent'
                : isVisualActive
                  ? t.primarySoft
                  : p.readOnly
                    ? t.surfaceSoft
                    : hovered && canMutate
                      ? t.surfaceSoft
                      : t.surface,
            opacity: p.disabled ? 0.6 : 1,
          },
          Platform.OS === 'web' && p.loading ? ({ cursor: 'progress' } as Record<string, unknown>) : undefined,
        ]}
      >
        {({ hovered, pressed }: PressState & { hovered?: boolean }) => {
          const glyphEl = glyph(checked, { hovered, pressed });
          const glyphNode = stateNode ? (
            <View style={styles.toggleGlyphRow}>
              {placement === 'end' ? (
                <>
                  {glyphEl}
                  {stateNode}
                </>
              ) : (
                <>
                  {stateNode}
                  {glyphEl}
                </>
              )}
            </View>
          ) : (
            glyphEl
          );
          return placement === 'end' ? (
            <>
              {glyphNode}
              {labelNode}
            </>
          ) : (
            <>
              {labelNode}
              {glyphNode}
            </>
          );
        }}
      </Pressable>
    </FieldChrome>
  );
}

export function EmrCheckbox(p: EmrCheckboxProps) {
  const t = useEmrTheme();
  const boxSize = p.size === 'sm' ? 16 : 18;
  const iconSize = p.size === 'sm' ? 11 : 12;
  return (
    <BooleanRow
      p={p}
      role="checkbox"
      mixed={p.mixed}
      glyph={(checked, { hovered, pressed }) => {
        const active = checked || Boolean(p.mixed);
        const interactive = !p.disabled && !p.readOnly;
        return (
          <View
            aria-hidden
            style={[
              styles.box,
              {
                width: boxSize,
                height: boxSize,
                marginTop: p.labelHidden ? 0 : 2,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: (p.invalid || p.error)
                  ? t.danger
                  : active
                    ? t.primary
                    : (p.hasWarning || p.warning)
                      ? t.warning
                      : hovered && interactive
                        ? t.primary
                        : t.border,
                backgroundColor: active ? t.primary : t.surface,
                transform: pressed && interactive ? [{ scale: 0.95 }] : undefined,
              },
            ]}
          >
            {active ? (
              <SvgIcon
                name={p.mixed ? 'minus' : 'check'}
                size={iconSize}
                color={t.surface}
                strokeWidth={2.5}
              />
            ) : null}
          </View>
        );
      }}
    />
  );
}

/** Switch semantics: boolean aria-checked only (never 'mixed'), drawn as a track and thumb. */
export function EmrToggle(p: EmrToggleProps) {
  const t = useEmrTheme();
  const checked = resolveEmrToggleChecked(p.value, p.checked);
  const stateText = checked ? p.onLabel : p.offLabel;
  const size = normalizeEmrToggleSize(p.size);
  const isSm = size === 'sm';
  const validation = resolveEmrToggleValidationState({
    error: p.error,
    warning: p.warning,
    invalid: p.invalid,
  });
  const canMutate = canMutateEmrToggle(p.readOnly, p.disabled, p.loading);
  const trackStyle = isSm
    ? { width: 38, height: 22, borderRadius: 11, padding: 2 }
    : undefined;
  const thumbStyle = isSm
    ? { width: 16, height: 16, borderRadius: 8 }
    : undefined;
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
  return (
    <BooleanRow
      p={p}
      role="switch"
      stateText={stateText}
      glyph={(isChecked, { hovered, pressed }) => (
        <View
          aria-hidden
          style={[
            styles.track,
            trackStyle,
            {
              borderWidth: 1,
              borderColor: validation.isInvalid
                ? t.danger
                : validation.hasWarning
                  ? t.warning
                  : hovered && canMutate && !isChecked
                    ? t.primary
                    : 'transparent',
              backgroundColor: isChecked ? t.primary : t.border,
              alignItems: isChecked ? 'flex-end' : 'flex-start',
            },
          ]}
        >
          <View
            style={[
              styles.thumb,
              thumbStyle,
              thumbShadow,
              {
                backgroundColor: t.surface,
                transform: pressed && canMutate ? [{ scale: 0.95 }] : undefined,
              },
            ]}
          >
            {p.loading ? (
              <ActivityIndicator
                size="small"
                color={t.primary}
                style={{ transform: [{ scale: isSm ? 0.52 : 0.6 }] }}
              />
            ) : null}
          </View>
        </View>
      )}
    />
  );
}

const LONG_CHIP_LABEL = 24;

export function EmrRadioGroup(p: {
  controlId?: string;
  name?: string;
  label: string;
  ariaLabel?: string;
  labelHidden?: boolean;
  hint?: string;
  warning?: string;
  error?: string;
  invalid?: boolean;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onFocused?: () => void;
  onBlurred?: () => void;
  value: string | null;
  options: readonly EmrOption[];
  orientation?: EmrRadioGroupOrientation;
  columns?: number;
  variant?: EmrRadioGroupVariant | 'standard';
  size?: EmrRadioGroupSize;
  labelPlacement?: EmrRadioGroupLabelPlacement;
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
  const { width: winWidth } = useWindowDimensions();
  const isNarrow = winWidth > 0 && winWidth <= 480;
  const hasMessage = !!(p.error || p.warning || p.hint);
  const orientation = p.orientation ?? 'vertical';
  const normalizedVariant = normalizeRadioGroupVariant(p.variant);
  const isSegmented = normalizedVariant === 'segmented';
  const isInvalid = Boolean(p.error || p.invalid);
  const isWarning = !isInvalid && Boolean(p.warning);
  const canClear = canClearRadioGroupValue(
    p.value,
    p.options,
    p.clearable,
    p.readOnly,
    p.disabled,
  );
  const groups = groupOptions(p.options);
  const tabStopValue = resolveRadioGroupTabStopValue(p.options, p.value, p.disabled);
  const optionRefs = useRef<Record<string, { focus?: () => void } | null>>({});
  const hasFocusRef = useRef(false);

  const handleOptionFocus = () => {
    if (!hasFocusRef.current) {
      hasFocusRef.current = true;
      p.onFocused?.();
    }
    p.onFocus?.();
  };

  const handleOptionBlur = () => {
    hasFocusRef.current = false;
    p.onBlurred?.();
    p.onBlur?.();
  };

  const handleClear = () => {
    if (p.readOnly || p.disabled) return;
    p.onValueChange(null);
    p.onCleared?.();
  };

  const handleOptionKeyDown = (event: { key?: string; preventDefault?: () => void }, option: EmrOption) => {
    const key = event.key;
    if (key === 'ArrowDown' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowLeft') {
      event.preventDefault?.();
      const dir = key === 'ArrowDown' || key === 'ArrowRight' ? 1 : -1;
      const curIdx = p.options.findIndex((o) => o.value === option.value);
      const nextIdx = moveRadioGroupFocusIndex(p.options, curIdx, dir, p.disabled);
      if (nextIdx >= 0) {
        const nextOpt = p.options[nextIdx]!;
        optionRefs.current[nextOpt.value]?.focus?.();
        if (!p.readOnly && !p.disabled && !isRadioOptionLocked(nextOpt) && p.value !== nextOpt.value) {
          p.onValueChange(nextOpt.value);
        }
      }
      return;
    }
    if (p.readOnly || p.disabled || isRadioOptionLocked(option)) return;
    if (key === ' ' || key === 'Enter') {
      event.preventDefault?.();
      if (p.value === option.value && p.allowDeselect) {
        handleClear();
      } else if (p.value !== option.value) {
        p.onValueChange(option.value);
      }
    }
  };

  const renderSegmentedOption = (option: EmrOption) => {
    const selected = p.value === option.value;
    const optDisabled = Boolean(p.disabled || option.disabled);
    const optReadOnly = Boolean(p.readOnly || option.readOnly);
    const minTarget = Math.max(44, t.controlHeight);
    const isSm = p.size === 'sm';
    const tonePalette = option.tone ? toneColors(t, option.tone) : null;
    const badgeLabel =
      typeof option.badge === 'string'
        ? option.badge
        : option.badge?.label ?? (option.badge?.count !== undefined ? String(option.badge.count) : undefined);
    const badgeTone = (typeof option.badge === 'object' && option.badge?.tone) || option.tone || 'neutral';
    const badgeTonePalette = toneColors(t, badgeTone);

    return (
      <Pressable
        key={option.value}
        ref={(el) => {
          optionRefs.current[option.value] = el as { focus?: () => void } | null;
        }}
        role="radio"
        aria-checked={selected}
        aria-disabled={optDisabled || undefined}
        aria-readonly={optReadOnly || undefined}
        disabled={optDisabled}
        onFocus={handleOptionFocus}
        onBlur={handleOptionBlur}
        onPress={
          optReadOnly || optDisabled
            ? undefined
            : () => {
                if (selected && p.allowDeselect) {
                  handleClear();
                } else if (!selected) {
                  p.onValueChange(option.value);
                }
              }
        }
        {...(Platform.OS === 'web'
          ? ({
              tabIndex: optDisabled ? -1 : option.value === tabStopValue ? 0 : -1,
              onKeyDown: (e: { key?: string; preventDefault?: () => void }) => handleOptionKeyDown(e, option),
            } as Record<string, unknown>)
          : {})}
        style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
          focusRing(t, focused),
          {
            minHeight: minTarget,
            minWidth: 44,
            flexGrow: 1,
            flexShrink: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isSm ? 6 : 8,
            paddingHorizontal: isSm ? 10 : 14,
            paddingVertical: isSm ? 4 : 6,
            borderRadius: 7,
            borderWidth: 1,
            borderStyle: optReadOnly && !selected ? 'dashed' : 'solid',
            borderColor: selected
              ? (tonePalette?.color ?? t.border)
              : optReadOnly
                ? t.border
                : 'transparent',
            backgroundColor: selected
              ? (tonePalette ? withAlpha(tonePalette.color, 0.14) : t.surface)
              : hovered && !optDisabled && !optReadOnly
                ? withAlpha(t.surface, 0.55)
                : 'transparent',
            opacity: optDisabled ? 0.55 : 1,
            ...(selected
              ? Platform.OS === 'web'
                ? ({ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } as Record<string, unknown>)
                : { elevation: 1 }
              : {}),
          },
        ]}
      >
        <View style={{ alignItems: 'center', minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text
              style={{
                color: selected ? (tonePalette?.color ?? t.text) : t.textMuted,
                fontSize: isSm ? t.textSm : t.textMd,
                fontFamily: fontFamily(t),
                fontWeight: fontWeight(selected ? t.weightBold : t.weightMedium),
              }}
            >
              {option.label}
            </Text>
            {badgeLabel ? (
              <View
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: withAlpha(badgeTonePalette.color, 0.14),
                }}
              >
                <Text
                  style={{
                    color: badgeTonePalette.color,
                    fontSize: t.text2xs,
                    fontFamily: fontFamily(t),
                    fontWeight: fontWeight(t.weightBold),
                  }}
                >
                  {badgeLabel}
                </Text>
              </View>
            ) : null}
          </View>
          {option.description ? (
            <Text
              style={{
                color: t.textMuted,
                fontSize: t.textXs,
                fontFamily: fontFamily(t),
                marginTop: 2,
              }}
            >
              {option.description}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const renderOption = (option: EmrOption) => {
    if (isSegmented) return renderSegmentedOption(option);
    const selected = p.value === option.value;
    const optDisabled = Boolean(p.disabled || option.disabled);
    const optReadOnly = Boolean(p.readOnly || option.readOnly);
    return (
      <EmrOptionChip
        key={option.value}
        label={option.label}
        description={option.description}
        badge={option.badge}
        tone={option.tone}
        variant={normalizedVariant}
        size={p.size}
        labelPlacement={p.labelPlacement}
        selected={selected}
        invalid={isInvalid}
        warning={isWarning}
        readOnly={optReadOnly}
        disabled={optDisabled}
        tabIndex={optDisabled ? -1 : option.value === tabStopValue ? 0 : -1}
        buttonRef={(el) => {
          optionRefs.current[option.value] = el;
        }}
        onKeyDown={(e) => handleOptionKeyDown(e, option)}
        onFocus={handleOptionFocus}
        onBlur={handleOptionBlur}
        onPress={() => {
          if (optReadOnly || optDisabled) return;
          if (selected && p.allowDeselect) {
            handleClear();
          } else if (!selected) {
            p.onValueChange(option.value);
          }
        }}
      />
    );
  };

  const clearButtonNode = canClear ? (
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
          flexDirection: 'row',
          gap: 6,
          flexShrink: 0,
          borderColor: t.border,
          backgroundColor: pressed ? t.surfaceRaised : t.surfaceSoft,
        },
      ]}
    >
      <SvgIcon name="close" size={14} color={t.textMuted} />
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
  ) : null;

  const useInlineHeaderRow = !p.labelHidden && Boolean(p.label) && canClear;

  return (
    <FieldChrome
      label={useInlineHeaderRow ? undefined : p.label}
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
        aria-label={p.ariaLabel || (p.labelHidden ? p.label : undefined)}
        aria-describedby={hasMessage && !p.labelHidden ? `${id}-message` : undefined}
        aria-invalid={isInvalid ? true : undefined}
        aria-required={p.required}
        aria-readonly={p.readOnly}
        aria-disabled={p.disabled}
        style={styles.radioStack}
      >
        {useInlineHeaderRow ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Text
              nativeID={`${id}-label`}
              numberOfLines={1}
              aria-label={p.required ? `${p.label}, ${labels.required}` : p.label}
              style={{
                color: t.text,
                fontSize: t.textSm,
                lineHeight: 20,
                minHeight: 20,
                fontWeight: fontWeight(t.weightMedium),
                fontFamily: fontFamily(t),
                flexShrink: 1,
              }}
            >
              {p.label}
              {p.required ? (
                <Text style={{ color: t.danger, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}> *</Text>
              ) : null}
            </Text>
            {clearButtonNode}
          </View>
        ) : clearButtonNode ? (
          <View style={[styles.radioClearRow, { justifyContent: 'flex-end' }]}>{clearButtonNode}</View>
        ) : null}
        {groups.map(grp => (
          <View key={grp.label ?? '__ungrouped'} style={{ gap: 6 }}>
            {grp.label ? (
              <Text
                style={{
                  color: t.textMuted,
                  fontSize: t.textXs,
                  fontWeight: fontWeight(t.weightBold),
                  fontFamily: fontFamily(t),
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {grp.label}
              </Text>
            ) : null}
            {isSegmented ? (
              <View
                style={
                  orientation === 'grid' && Platform.OS === 'web'
                    ? ({
                        display: 'grid',
                        gridTemplateColumns: isNarrow
                          ? 'minmax(0, 1fr)'
                          : `repeat(${Math.max(1, p.columns ?? 2)}, minmax(0, 1fr))`,
                        gap: 4,
                        padding: 4,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: isInvalid ? t.danger : isWarning ? t.warning : t.border,
                        backgroundColor: t.surfaceSoft,
                      } as unknown as Record<string, unknown>)
                    : {
                        flexDirection: orientation === 'vertical' || (orientation === 'grid' && isNarrow) ? 'column' : 'row',
                        flexWrap: orientation === 'horizontal' ? 'wrap' : undefined,
                        alignItems: 'stretch',
                        gap: 4,
                        padding: 4,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: isInvalid ? t.danger : isWarning ? t.warning : t.border,
                        backgroundColor: t.surfaceSoft,
                      }
                }
              >
                {grp.options.map(renderOption)}
              </View>
            ) : orientation === 'horizontal' ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {grp.options.map(renderOption)}
              </View>
            ) : orientation === 'grid' && Platform.OS === 'web' ? (
              <View
                style={
                  {
                    display: 'grid',
                    gridTemplateColumns: isNarrow
                      ? 'minmax(0, 1fr)'
                      : `repeat(${Math.max(1, p.columns ?? 2)}, minmax(0, 1fr))`,
                    gap: 8,
                  } as unknown as Record<string, unknown>
                }
              >
                {grp.options.map(renderOption)}
              </View>
            ) : (
              <EmrRow
                single={orientation === 'vertical' || isNarrow}
                columns={orientation === 'grid' ? (isNarrow ? 1 : (p.columns ?? 2)) : undefined}
              >
                {grp.options.map(renderOption)}
              </EmrRow>
            )}
          </View>
        ))}
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
  selectShell: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  selectChips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingLeft: 10, paddingVertical: 6 },
  selectChip: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 28, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  selectChipRemove: { minWidth: 24, minHeight: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  selectTrigger: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, minWidth: 60 },
  clearBtn: { borderLeftWidth: 1, alignItems: 'center', justifyContent: 'center' },
  anchoredBackdrop: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { alignSelf: 'center', width: '100%', maxWidth: 480, maxHeight: '80%', borderWidth: 1, borderRadius: 12, paddingVertical: 8, overflow: 'hidden' },
  sheetTitle: { paddingHorizontal: 16, paddingVertical: 8 },
  sheetFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, borderTopWidth: 1 },
  sheetFooterBtn: { minHeight: 44, minWidth: 80, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  emptyState: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  groupBlock: { paddingTop: 4 },
  groupHeader: { paddingHorizontal: 12, paddingVertical: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  optionBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
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
  track: { width: 42, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center', flexShrink: 0 },
  thumb: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
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
