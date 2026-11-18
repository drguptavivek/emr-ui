'use client';

import { Children, createElement, useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import {
  canActivateEmrCard,
  canActivateEmrFieldValueRow,
  canMutateEmrChip,
  canSelectEmrStatusCell,
  canTriggerEmrStatusCellAction,
  formatEmrStatusCellAttribution,
  normalizeEmrCardPadding,
  normalizeEmrCardTone,
  normalizeEmrCardVariant,
  normalizeEmrChipSize,
  normalizeEmrChipTone,
  normalizeEmrChipVariant,
  normalizeEmrColumnsAlign,
  normalizeEmrColumnsCollapseBelow,
  normalizeEmrColumnsCount,
  normalizeEmrColumnsGap,
  normalizeEmrFieldValueRowSize,
  normalizeEmrFieldValueRowTone,
  normalizeEmrSeparatorLabelAlign,
  normalizeEmrSeparatorOrientation,
  normalizeEmrSeparatorVariant,
  normalizeEmrStateMessageKind,
  normalizeEmrStateMessageSize,
  normalizeEmrStatusCellSize,
  resolveEmrCardLabel,
  resolveEmrChipRemoveLabel,
  resolveEmrColumnsCssTemplate,
  resolveEmrFieldValueRowValue,
  resolveEmrStateMessageRole,
  resolveEmrStateMessageTitle,
  resolveEmrStatusCellHiddenText,
  type EmrBadge,
  type EmrCardPadding,
  type EmrCardVariant,
  type EmrChipSize,
  type EmrFieldValueRowIntent,
  type EmrFieldValueRowSize,
  type EmrChipVariant,
  type EmrColumnsAlign,
  type EmrColumnsTrackWidth,
  type EmrSeparatorLabelAlign,
  type EmrSeparatorOrientation,
  type EmrSeparatorVariant,
  type EmrStateMessageKind,
  type EmrStateMessageSize,
  type EmrStatusCellAction,
  type EmrStatusCellAttribution,
  type EmrStatusCellIntent,
  type EmrStatusCellSize,
  type EmrTone,
} from '@drguptavivek/emr-controller';
import { SvgIcon, type EmrIconName } from './icons';
import { EmrBadgeView, EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';

/** English fallbacks for built-in strings; every one is overridable by a prop. */
export const L1_DISPLAY_DEFAULTS = {
  emptyTitle: 'Nothing to show',
  loadingTitle: 'Loading…',
  errorTitle: 'Something went wrong',
} as const;

type PressState = PressableStateCallbackType & { focused?: boolean };

/** Glyph paired with the text so tone is never colour alone. Neutral carries none. */
const TONE_GLYPH: Record<EmrTone, string> = { neutral: '', info: 'ℹ', success: '✓', warning: '⚠', danger: '!' };

/** L1. Interactive or informational pill/tag; supports variants, sizes, leadingIcon/avatar, selectable & removable modes. */
export function EmrChip({
  controlId,
  label,
  ariaLabel,
  tone: toneProp = 'neutral',
  variant: variantProp = 'soft',
  size: sizeProp = 'md',
  leadingIcon,
  avatar,
  selectable,
  selected,
  removable,
  disabled,
  readOnly,
  removeLabel,
  onSelectedChange,
  onRemove,
  children,
}: {
  controlId?: string;
  label?: string;
  ariaLabel?: string;
  tone?: EmrTone;
  variant?: EmrChipVariant;
  size?: EmrChipSize;
  leadingIcon?: EmrIconName;
  avatar?: string | ReactNode;
  selectable?: boolean;
  selected?: boolean;
  removable?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  removeLabel?: string;
  onSelectedChange?: (selected: boolean) => void;
  onRemove?: () => void;
  children?: ReactNode;
}) {
  const t = useEmrTheme();
  const tone = normalizeEmrChipTone(toneProp);
  const variant = normalizeEmrChipVariant(variantProp);
  const size = normalizeEmrChipSize(sizeProp);
  const c = toneColors(t, tone);
  const interactive = Boolean(selectable || removable);
  const canMutate = canMutateEmrChip(Boolean(disabled), Boolean(readOnly));

  const bg =
    variant === 'solid'
      ? (tone === 'neutral' ? t.text : c.color)
      : variant === 'outline'
        ? 'transparent'
        : c.backgroundColor;
  const fg =
    variant === 'solid'
      ? t.surface
      : c.color;
  const borderColor =
    variant === 'outline'
      ? (tone === 'neutral' ? t.border : c.color)
      : selected
        ? fg
        : 'transparent';

  const iconName: EmrIconName | undefined =
    leadingIcon ?? (selectable && selected ? 'check' : undefined);

  const labelContent = label ?? children;
  const textFallback = typeof labelContent === 'string' ? labelContent : undefined;
  const resolvedRemoveLabel = resolveEmrChipRemoveLabel(removeLabel, label ?? textFallback);

  const bodyContent = (
    <>
      {avatar ? (
        typeof avatar === 'string' ? (
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: t.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: fg, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{avatar}</Text>
          </View>
        ) : (
          avatar
        )
      ) : null}
      {iconName ? <SvgIcon name={iconName} size={13} color={fg} /> : null}
      <Text
        numberOfLines={1}
        style={{
          color: fg,
          fontSize: size === 'sm' ? t.textXs : t.textSm,
          fontWeight: fontWeight(selected ? 650 : 600),
          fontFamily: fontFamily(t),
        }}
      >
        {labelContent}
      </Text>
    </>
  );

  return (
    <View
      nativeID={controlId}
      style={[
        styles.chip,
        interactive && styles.chipRemovable,
        {
          backgroundColor: bg,
          borderWidth: 1,
          borderColor,
          borderStyle: readOnly ? 'dashed' : 'solid',
          minHeight: interactive ? Math.max(44, t.controlHeight) : size === 'sm' ? 28 : 32,
          paddingHorizontal: interactive ? 4 : size === 'sm' ? 8 : 10,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      {selectable ? (
        <Pressable
          role="button"
          aria-label={ariaLabel ?? textFallback}
          aria-pressed={Boolean(selected)}
          aria-readonly={readOnly}
          aria-disabled={disabled}
          disabled={disabled}
          onPress={canMutate ? () => onSelectedChange?.(!selected) : undefined}
          style={({ pressed, focused }: PressState) => [
            focusRing(t, focused),
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              minHeight: Math.max(44, t.controlHeight),
              paddingHorizontal: 8,
              borderRadius: 999,
              backgroundColor: pressed && canMutate ? t.surfaceRaised : 'transparent',
            },
          ]}
        >
          {bodyContent}
        </Pressable>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: interactive ? 8 : 0 }}>
          {bodyContent}
        </View>
      )}
      {removable ? (
        <Pressable
          role="button"
          aria-label={resolvedRemoveLabel}
          aria-disabled={disabled}
          aria-readonly={readOnly}
          disabled={disabled}
          onPress={canMutate ? onRemove : undefined}
          style={({ pressed, focused }: PressState) => [
            styles.chipRemoveBtn,
            focusRing(t, focused),
            {
              minWidth: 44,
              minHeight: 44,
              backgroundColor: pressed && canMutate ? t.surfaceRaised : 'transparent',
            },
          ]}
        >
          <SvgIcon name="close" size={12} color={fg} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Convert a #RRGGBB hex token to rgba() so react-native-web and native both render translucent glass surfaces. */
function withAlpha(color: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** L1. Tone-edged message block; role status as in Angular. `title` is the headline, children the body. */
export function EmrAlert({ tone = 'info', title = '', children }: { tone?: EmrTone; title?: string; children?: ReactNode }) {
  const t = useEmrTheme();
  const c = toneColors(t, tone);
  const glyph = TONE_GLYPH[tone];
  const glassBg = withAlpha(c.backgroundColor, 0.78);
  const glassWebStyle =
    Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(10px) saturate(140%)', WebkitBackdropFilter: 'blur(10px) saturate(140%)' } as unknown as object)
      : undefined;
  return (
    <View
      role="status"
      style={[
        styles.alert,
        !title && styles.alertSingleLine,
        { backgroundColor: glassBg, borderBottomColor: c.color, borderRightColor: c.color },
        glassWebStyle,
      ]}
    >
      {glyph ? <Text aria-hidden style={{ color: c.color, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>{glyph}</Text> : null}
      <View style={styles.flex}>
        {title ? <Text style={{ color: c.color, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{title}</Text> : null}
        {children ? <View><TextOrNode color={t.textMuted} size={t.textMd} family={fontFamily(t)}>{children}</TextOrNode></View> : null}
      </View>
    </View>
  );
}

/** Plain strings get themed Text; elements pass through. */
function TextOrNode({ children, color, size, family }: { children: ReactNode; color: string; size: number; family: string | undefined }) {
  return typeof children === 'string' ? <Text style={{ color, fontSize: size, fontFamily: family }}>{children}</Text> : <>{children}</>;
}

/** L1. Empty / loading / error placeholder. Error announces as alert, others as status. */
export function EmrStateMessage({
  controlId,
  kind: kindProp = 'empty',
  title,
  message,
  size: sizeProp = 'md',
  compact = false,
  icon,
  actionLabel,
  actionDisabled,
  onAction,
  children,
}: {
  controlId?: string;
  kind?: EmrStateMessageKind;
  title?: string;
  message?: string;
  size?: EmrStateMessageSize;
  compact?: boolean;
  icon?: EmrIconName | 'none';
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
  children?: ReactNode;
}) {
  const t = useEmrTheme();
  const kind = normalizeEmrStateMessageKind(kindProp);
  const size = normalizeEmrStateMessageSize(sizeProp, compact);
  const heading = resolveEmrStateMessageTitle(kind, title);
  const role = resolveEmrStateMessageRole(kind);
  const iconSize = size === 'sm' ? 20 : 24;
  return (
    <View nativeID={controlId} role={role} style={[styles.state, size === 'sm' && styles.stateCompact]}>
      {icon === 'none' ? null : kind === 'loading' && !icon ? (
        <ActivityIndicator color={t.primary} />
      ) : (
        <SvgIcon
          name={icon ?? (kind === 'error' ? 'danger' : 'info')}
          size={iconSize}
          color={kind === 'error' ? t.danger : t.textMuted}
        />
      )}
      <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t), textAlign: 'center' }}>
        {heading}
      </Text>
      {message ? (
        <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t), textAlign: 'center', maxWidth: 420 }}>
          {message}
        </Text>
      ) : null}
      {actionLabel ? (
        <View style={{ marginTop: 4 }}>
          <EmrButton
            variant="outline"
            label={actionLabel}
            disabled={actionDisabled}
            onPress={() => { if (!actionDisabled) onAction?.(); }}
          />
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** L1. Divider. Renders a plain rule, optional horizontal label (`start | center | end`), or vertical rule. */
export function EmrSeparator({
  controlId,
  orientation: orientationProp = 'horizontal',
  label,
  labelAlign: alignProp = 'center',
  variant: variantProp = 'solid',
  decorative = false,
  children,
}: {
  controlId?: string;
  orientation?: EmrSeparatorOrientation;
  label?: string;
  labelAlign?: EmrSeparatorLabelAlign;
  variant?: EmrSeparatorVariant;
  decorative?: boolean;
  children?: ReactNode;
}) {
  const t = useEmrTheme();
  const orientation = normalizeEmrSeparatorOrientation(orientationProp);
  const labelAlign = normalizeEmrSeparatorLabelAlign(alignProp);
  const variant = normalizeEmrSeparatorVariant(variantProp);
  const borderStyle = variant === 'dashed' ? 'dashed' : 'solid';
  const borderColor = variant === 'subtle' ? withAlpha(t.border, 0.55) : t.border;
  const a11y = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'separator' as const, 'aria-orientation': orientation };

  if (orientation === 'vertical') {
    return (
      <View
        nativeID={controlId}
        {...a11y}
        style={{
          width: 0,
          alignSelf: 'stretch',
          minHeight: 16,
          marginHorizontal: 12,
          borderLeftWidth: 1,
          borderLeftColor: borderColor,
          borderStyle,
        }}
      />
    );
  }

  const hasLabel = Boolean(label) || Boolean(children);
  if (hasLabel) {
    return (
      <View
        nativeID={controlId}
        {...a11y}
        aria-label={decorative ? undefined : label}
        style={[styles.labelled, { minWidth: 0 }]}
      >
        <View
          aria-hidden
          style={[
            labelAlign === 'start' ? { width: 16, flexGrow: 0, flexShrink: 0 } : styles.line,
            { height: 0, borderTopWidth: 1, borderTopColor: borderColor, borderStyle },
          ]}
        />
        {label ? (
          <Text
            numberOfLines={1}
            style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(650), fontFamily: fontFamily(t), flexShrink: 1 }}
          >
            {label}
          </Text>
        ) : (
          children
        )}
        <View
          aria-hidden
          style={[
            labelAlign === 'end' ? { width: 16, flexGrow: 0, flexShrink: 0 } : styles.line,
            { height: 0, borderTopWidth: 1, borderTopColor: borderColor, borderStyle },
          ]}
        />
      </View>
    );
  }

  return (
    <View
      nativeID={controlId}
      {...a11y}
      style={{
        height: 0,
        alignSelf: 'stretch',
        marginVertical: 16,
        borderTopWidth: 1,
        borderTopColor: borderColor,
        borderStyle,
      }}
    />
  );
}

/** L1. Card surface with optional heading, subtitle, variants, tone, header/footer slots, and interactive mode. */
export function EmrCard({
  controlId,
  label,
  title,
  cardTitle,
  subtitle,
  headingId,
  ariaLabel,
  variant: variantProp = 'outlined',
  padding: paddingProp = 'md',
  padded = true,
  tone: toneProp = 'neutral',
  interactive = false,
  selected = false,
  disabled = false,
  readOnly = false,
  header,
  footer,
  onPress,
  onActivated,
  children,
}: {
  controlId?: string;
  label?: string;
  title?: string;
  cardTitle?: string;
  subtitle?: string;
  headingId?: string;
  ariaLabel?: string;
  variant?: EmrCardVariant;
  padding?: EmrCardPadding;
  padded?: boolean;
  tone?: EmrTone;
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  onPress?: () => void;
  onActivated?: () => void;
  children?: ReactNode;
}) {
  const t = useEmrTheme();
  const resolvedLabel = resolveEmrCardLabel(label, title, cardTitle);
  const variant = normalizeEmrCardVariant(variantProp);
  const padding = normalizeEmrCardPadding(paddingProp, padded);
  const tone = normalizeEmrCardTone(toneProp);
  const canActivate = canActivateEmrCard(interactive, disabled, readOnly);
  const toneColor = tone !== 'neutral' ? toneColors(t, tone).color : undefined;

  const surfaceBg = variant === 'filled' ? t.surfaceRaised : variant === 'subtle' ? t.surfaceSoft : t.surface;
  const bodyPad = padding === 'none' ? 0 : padding === 'sm' ? 10 : padding === 'lg' ? 24 : 16;
  const baseBorder = selected ? t.primary : toneColor ? withAlpha(toneColor, 0.45) : t.border;

  const content = (
    <>
      {resolvedLabel || subtitle || header ? (
        <View
          style={[
            styles.cardTitle,
            {
              minHeight: Math.max(44, t.controlHeight),
              backgroundColor: selected ? t.primarySoft : t.surfaceAccent,
              borderBottomColor: t.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            },
          ]}
        >
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            {resolvedLabel ? (
              <Text
                nativeID={headingId}
                role="heading"
                style={{ color: t.text, fontSize: t.textMd, lineHeight: 19, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}
              >
                {resolvedLabel}
              </Text>
            ) : null}
            {subtitle ? (
              <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>{subtitle}</Text>
            ) : null}
          </View>
          {header}
        </View>
      ) : null}
      <View style={bodyPad > 0 ? { padding: bodyPad } : undefined}>{children}</View>
      {footer ? (
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.surfaceSoft }}>
          {footer}
        </View>
      ) : null}
    </>
  );

  const shadowStyle =
    variant === 'elevated'
      ? {
          shadowColor: '#0f172a',
          shadowOpacity: 0.14,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        }
      : undefined;

  if (interactive) {
    return (
      <Pressable
        nativeID={controlId}
        role="button"
        aria-label={ariaLabel ?? resolvedLabel}
        aria-pressed={selected}
        aria-disabled={disabled}
        aria-readonly={readOnly}
        disabled={disabled}
        onPress={canActivate ? () => { onPress?.(); onActivated?.(); } : undefined}
        style={({ pressed, focused }: PressState) => [
          styles.card,
          shadowStyle,
          focusRing(t, focused),
          {
            minHeight: Math.max(44, t.controlHeight),
            borderColor: selected ? t.primary : baseBorder,
            borderStyle: readOnly ? 'dashed' : 'solid',
            backgroundColor: pressed && canActivate ? t.surfaceRaised : surfaceBg,
            opacity: disabled ? 0.55 : 1,
          },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      nativeID={controlId}
      aria-label={ariaLabel}
      style={[
        styles.card,
        shadowStyle,
        {
          borderColor: baseBorder,
          borderStyle: readOnly ? 'dashed' : 'solid',
          backgroundColor: surfaceBg,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      {content}
    </View>
  );
}

/** Track size: number = px, "2fr" = share of free space, "120px"/"30%" literal, anything else = 1fr. */
function track(width: number | string): object {
  if (typeof width === 'number') return { width, flexShrink: 1 };
  const fr = /^(\d*\.?\d+)fr$/.exec(width);
  if (fr) return { flexGrow: Number(fr[1]), flexBasis: 0, minWidth: 0 };
  const px = /^(\d*\.?\d+)px$/.exec(width);
  if (px) return { width: Number(px[1]), flexShrink: 1 };
  if (/^\d*\.?\d+%$/.test(width)) return { width, flexShrink: 1 };
  return { flexGrow: 1, flexBasis: 0, minWidth: 0 };
}

/**
 * L1. Equal-width or custom-track columns (supports 1 to 6 columns). `widths` overrides `count`.
 * Stacks to one column when the container is narrower than `collapseBelow`; until measured it renders as columns.
 * If more children are passed than `count`, they wrap into equal-column rows.
 */
export function EmrColumns({
  controlId,
  count = 2,
  columns,
  widths,
  gap: gapProp = 16,
  align: alignProp = 'stretch',
  collapseBelow: collapseProp = 640,
  children,
}: {
  controlId?: string;
  count?: 1 | 2 | 3 | 4 | 5 | 6 | number;
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | number;
  widths?: readonly EmrColumnsTrackWidth[];
  gap?: number | string;
  align?: EmrColumnsAlign;
  collapseBelow?: number;
  children?: ReactNode;
}) {
  const [width, setWidth] = useState<number | null>(null);
  const collapseBelow = normalizeEmrColumnsCollapseBelow(collapseProp);
  const stacked = collapseBelow > 0 && width !== null && width < collapseBelow;
  const items = Children.toArray(children);
  const clampedCount = normalizeEmrColumnsCount(columns ?? count);
  const tracks = widths && widths.length > 0 ? widths : Array.from({ length: clampedCount }, () => '1fr');
  const colsPerRow = tracks.length;
  const gap = normalizeEmrColumnsGap(gapProp).px;
  const align = normalizeEmrColumnsAlign(alignProp);
  const alignItems =
    align === 'start'
      ? 'flex-start'
      : align === 'end'
        ? 'flex-end'
        : align === 'center'
          ? 'center'
          : 'stretch';

  if (Platform.OS === 'web') {
    const template = stacked ? 'minmax(0, 1fr)' : resolveEmrColumnsCssTemplate(clampedCount, widths);
    return (
      <View nativeID={controlId} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
        {createElement(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: template,
              gap,
              alignItems,
              width: '100%',
            },
          },
          items.map((child, i) =>
            createElement(
              'div',
              {
                key: i,
                style: {
                  minWidth: 0,
                  ...(align === 'stretch' ? { display: 'grid' } : {}),
                },
              },
              child,
            ),
          ),
        )}
      </View>
    );
  }

  if (stacked || colsPerRow === 1) {
    return (
      <View nativeID={controlId} onLayout={e => setWidth(e.nativeEvent.layout.width)} style={{ flexDirection: 'column', alignItems: 'stretch', gap }}>
        {items.map((child, i) => <View key={i} style={{ minWidth: 0 }}>{child}</View>)}
      </View>
    );
  }

  const rows: ReactNode[][] = [];
  for (let i = 0; i < items.length; i += colsPerRow) {
    rows.push(items.slice(i, i + colsPerRow));
  }

  return (
    <View nativeID={controlId} onLayout={e => setWidth(e.nativeEvent.layout.width)} style={{ gap }}>
      {rows.map((rowItems, rIdx) => (
        <View key={rIdx} style={{ flexDirection: 'row', alignItems, gap }}>
          {rowItems.map((child, i) => <View key={i} style={track(tracks[i % tracks.length]!)}>{child}</View>)}
          {rowItems.length < colsPerRow
            ? Array.from({ length: colsPerRow - rowItems.length }, (_, k) => (
                <View key={`pad-${k}`} style={track(tracks[(rowItems.length + k) % tracks.length]!)} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

/** L1. Field / value / remarks / notes row. `heading` styles it as the column-title row and skips the placeholder. */
export function EmrFieldValueRow({
  controlId,
  field = '',
  value = '',
  remarks = '',
  notes = '',
  heading = false,
  placeholder = '—',
  tone: toneProp = 'neutral',
  size: sizeProp = 'md',
  truncate = false,
  interactive = false,
  readOnly = false,
  ariaLabel,
  onPress,
  onIntent,
}: {
  controlId?: string;
  field?: string;
  value?: string | number | null;
  remarks?: string | null;
  notes?: string | null;
  heading?: boolean;
  placeholder?: string;
  tone?: EmrTone;
  size?: EmrFieldValueRowSize;
  truncate?: boolean;
  interactive?: boolean;
  readOnly?: boolean;
  ariaLabel?: string;
  onPress?: () => void;
  onIntent?: (intent: EmrFieldValueRowIntent) => void;
}) {
  const t = useEmrTheme();
  const [rowWidth, setRowWidth] = useState<number | null>(null);
  const stacked = rowWidth !== null && rowWidth < 400;
  if (stacked && heading) return null;

  const size = normalizeEmrFieldValueRowSize(sizeProp);
  const tone = normalizeEmrFieldValueRowTone(toneProp);
  const resolvedVal = resolveEmrFieldValueRowValue(value, heading, placeholder);
  const canAct = canActivateEmrFieldValueRow(interactive, readOnly);

  const minHeight = size === 'sm' ? 36 : size === 'lg' ? 48 : 44;
  const padV = size === 'sm' ? 6 : size === 'lg' ? 12 : 10;
  const padH = size === 'sm' ? 10 : size === 'lg' ? 14 : 12;
  const fontSize = heading ? t.text2xs : size === 'sm' ? t.textSm : t.textMd;

  const toneColor =
    tone === 'info'
      ? t.info
      : tone === 'success'
        ? t.success
        : tone === 'warning'
          ? t.warning
          : tone === 'danger'
            ? t.danger
            : t.text;

  const trigger = () => {
    if (!canAct) return;
    onPress?.();
    onIntent?.({ type: 'rowActivated', id: controlId });
  };

  const renderCell = (
    text: string,
    key: string,
    label: string,
    role: 'columnheader' | 'rowheader' | 'cell',
    opts?: { first?: boolean; isField?: boolean; isValue?: boolean; isMuted?: boolean },
  ) => (
    <View
      key={key}
      role={role}
      style={{
        flex: stacked ? undefined : opts?.isValue ? 1.6 : 1.4,
        minWidth: 0,
        minHeight,
        paddingVertical: padV,
        paddingHorizontal: padH,
        justifyContent: 'center',
        borderLeftWidth: !stacked && !opts?.first ? 1 : 0,
        borderTopWidth: stacked && !opts?.first ? 1 : 0,
        borderColor: t.border,
        backgroundColor: heading ? t.surfaceAccent : opts?.isField ? t.surfaceSlate : undefined,
      }}
    >
      <Text
        numberOfLines={truncate ? 1 : undefined}
        style={{
          color: heading
            ? t.text
            : opts?.isValue && !resolvedVal.isPlaceholder
              ? toneColor
              : opts?.isMuted || (opts?.isValue && resolvedVal.isPlaceholder)
                ? t.textMuted
                : t.text,
          fontSize,
          fontFamily: fontFamily(t),
          fontWeight: fontWeight(
            heading
              ? t.weightBold
              : opts?.isField || (opts?.isValue && !resolvedVal.isPlaceholder && tone !== 'neutral')
                ? 650
                : t.weightRegular,
          ),
          textTransform: heading ? 'uppercase' : undefined,
          letterSpacing: heading ? 0.4 : undefined,
          fontVariant: ['tabular-nums'],
        }}
      >
        {stacked ? `${label}: ${text}` : text}
      </Text>
    </View>
  );

  const cells = (
    <>
      {renderCell(field, 'f', 'Field', heading ? 'columnheader' : 'rowheader', { first: true, isField: true })}
      {renderCell(resolvedVal.text, 'v', 'Value', heading ? 'columnheader' : 'cell', { isValue: true })}
      {renderCell(remarks ?? '', 'r', 'Remarks', heading ? 'columnheader' : 'cell', { isMuted: true })}
      {renderCell(notes ?? '', 'n', 'Notes', heading ? 'columnheader' : 'cell', { isMuted: true })}
    </>
  );

  const containerStyle = [
    {
      flexDirection: (stacked ? 'column' : 'row') as 'column' | 'row',
      borderWidth: 1,
      borderTopWidth: heading || stacked ? 1 : 0,
      borderColor: t.border,
      borderStyle: (interactive && readOnly ? 'dashed' : 'solid') as 'dashed' | 'solid',
      opacity: interactive && readOnly ? 0.92 : 1,
      overflow: 'hidden' as const,
      borderTopLeftRadius: heading || stacked ? 8 : 0,
      borderTopRightRadius: heading || stacked ? 8 : 0,
      marginBottom: stacked ? 8 : 0,
    },
  ];

  if (interactive) {
    return (
      <Pressable
        nativeID={controlId}
        role="row"
        aria-label={ariaLabel}
        aria-readonly={readOnly || undefined}
        disabled={!canAct}
        onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
        onPress={trigger}
        style={(state: PressableStateCallbackType) => [
          ...containerStyle,
          canAct && (state.pressed || (state as unknown as { hovered?: boolean }).hovered)
            ? { backgroundColor: t.surfaceAccent }
            : undefined,
        ]}
      >
        {cells}
      </Pressable>
    );
  }

  return (
    <View
      nativeID={controlId}
      role="row"
      onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
      style={containerStyle}
    >
      {cells}
    </View>
  );
}

export type { EmrStatusCellAction, EmrStatusCellAttribution, EmrStatusCellIntent };

/**
 * L1. Caller-supplied badge, optional value, attribution, ONE action. `selectable` makes the body a
 * button (the action stays a sibling, never nested). `compact` hides detail visually; it stays in the label for AT.
 */
export function EmrStatusCell({
  controlId,
  status,
  valueLabel,
  attribution,
  action,
  secondaryNote,
  readOnly = false,
  disabled = false,
  compact = false,
  selectable = false,
  interactive = false,
  selected = false,
  size: sizeProp = 'md',
  ariaLabel,
  onIntent,
  onSelected,
  onAction,
}: {
  controlId?: string;
  status: EmrBadge;
  valueLabel?: string;
  attribution?: EmrStatusCellAttribution | string;
  action?: EmrStatusCellAction;
  secondaryNote?: string;
  readOnly?: boolean;
  disabled?: boolean;
  compact?: boolean;
  selectable?: boolean;
  interactive?: boolean;
  selected?: boolean;
  size?: EmrStatusCellSize;
  ariaLabel?: string;
  onIntent?: (intent: EmrStatusCellIntent) => void;
  onSelected?: () => void;
  onAction?: () => void;
}) {
  const t = useEmrTheme();
  const size = normalizeEmrStatusCellSize(sizeProp);
  const isSelectable = selectable || interactive;
  const canSelect = canSelectEmrStatusCell(isSelectable, readOnly, disabled);
  const canAct = canTriggerEmrStatusCellAction(Boolean(action), compact, readOnly, disabled);
  const attributionText = formatEmrStatusCellAttribution(attribution);
  const meta = {
    color: t.textMuted,
    fontSize: size === 'sm' ? t.text2xs : t.textXs,
    fontFamily: fontFamily(t),
  };
  const body = (
    <>
      <View style={styles.statusMain}>
        <EmrBadgeView badge={status} />
        {!compact && valueLabel ? (
          <Text
            style={{
              color: t.text,
              fontSize: size === 'sm' ? t.textXs : t.textSm,
              fontWeight: fontWeight(650),
              fontFamily: fontFamily(t),
            }}
          >
            {valueLabel}
          </Text>
        ) : null}
      </View>
      {!compact && attributionText ? <Text style={meta}>{attributionText}</Text> : null}
      {!compact && secondaryNote ? <Text style={meta}>{secondaryNote}</Text> : null}
    </>
  );
  // Compact drops detail visually, so the full text moves into the accessible name.
  const hidden = resolveEmrStatusCellHiddenText(compact, valueLabel, attributionText, secondaryNote);
  const label = ariaLabel?.trim() || (hidden ? [status.label, status.assistiveText, hidden].filter(Boolean).join('. ') : undefined);
  const bodyToneStyle = [
    styles.statusBody,
    { borderRadius: 8 },
    selected
      ? { borderWidth: 1, borderColor: t.primary, backgroundColor: t.primarySoft, paddingHorizontal: 8, paddingVertical: 6 }
      : isSelectable && readOnly
        ? { borderWidth: 1, borderStyle: 'dashed' as const, borderColor: t.border, paddingHorizontal: 8, paddingVertical: 6 }
        : isSelectable
          ? { borderWidth: 1, borderColor: 'transparent', paddingHorizontal: 8, paddingVertical: 6 }
          : undefined,
  ];
  const triggerSelect = () => {
    if (!canSelect) return;
    onSelected?.();
    onIntent?.('selected');
  };
  const triggerAction = () => {
    if (!canAct) return;
    onAction?.();
    onIntent?.('action');
  };
  return (
    <View style={[styles.status, disabled ? { opacity: 0.55 } : undefined]}>
      {isSelectable ? (
        <Pressable
          nativeID={controlId}
          role="button"
          aria-label={label}
          aria-pressed={selected}
          aria-readonly={readOnly || undefined}
          aria-disabled={disabled || undefined}
          disabled={!canSelect}
          onPress={triggerSelect}
          style={(state: PressState) => [
            ...bodyToneStyle,
            focusRing(t, state.focused),
            { minHeight: t.controlHeight, minWidth: t.controlHeight, justifyContent: 'center' },
            canSelect && ((state as unknown as { hovered?: boolean }).hovered || state.pressed)
              ? { backgroundColor: t.surfaceAccent }
              : undefined,
          ]}
        >
          {body}
        </Pressable>
      ) : (
        <View nativeID={controlId} aria-label={label} style={bodyToneStyle}>
          {body}
        </View>
      )}
      {canAct && action ? (
        <EmrButton variant="outline" onPress={triggerAction}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {action.icon ? <SvgIcon name={action.icon as EmrIconName} size={14} color={t.text} /> : null}
            <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: fontFamily(t) }}>
              {action.label}
            </Text>
          </View>
        </EmrButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  chip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  chipRemovable: { paddingLeft: 12, paddingRight: 0, paddingVertical: 0, overflow: 'hidden' },
  chipRemovableText: { paddingVertical: 4 },
  chipRemoveBtn: { alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  alert: { flexDirection: 'row', gap: 10, borderRightWidth: 1, borderBottomWidth: 2, borderRadius: 2, padding: 12 },
  alertSingleLine: { alignItems: 'center' },
  state: { alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 160, padding: 24, width: '100%' },
  stateCompact: { minHeight: 96, padding: 16, gap: 6 },
  labelled: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  line: { flex: 1, height: 1 },
  card: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  cardTitle: { justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  cardBody: { padding: 16 },
  // Four columns until a cell would drop under ~120dp (a phone card), then two per line: no mid-word breaks.
  fvr: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1 },
  fvrCell: { flexGrow: 1, flexBasis: 120, minWidth: 0 },
  status: { alignItems: 'flex-start', gap: 4, minWidth: 0 },
  statusBody: { gap: 2, minWidth: 0, maxWidth: '100%' },
  statusMain: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
});
