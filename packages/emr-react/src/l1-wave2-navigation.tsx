'use client';

import type {
  EmrAccordionItem,
  EmrBreadcrumbItem,
  EmrCollapsedBreadcrumbs,
  EmrColorSwatch,
  EmrMenuItem,
} from '@drguptavivek/emr-controller';
import { type ComponentRef, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableStateCallbackType,
} from 'react-native';
import { isEmrIconName, SvgIcon } from './icons';
import { FieldChrome, type FieldValidationLine } from './l1-field-chrome';
import { webProps, type WebKeyEvent } from './l1-interactive-shared';
import {
  canClearEmrColorPicker,
  canCopyEmrValue,
  canOpenEmrMenu,
  canOpenEmrSplitMenu,
  canSelectEmrBreadcrumb,
  canSelectEmrMenuItem,
  canToggleAccordionItem,
  canTriggerEmrSplitPrimary,
  collapseBreadcrumbs,
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  findEmrMenuTypeaheadIndex,
  formatCopyButtonLabel,
  getContrastCheckTone,
  moveAccordionFocusIndex,
  moveColorSwatchFocusIndex,
  moveEmrMenuFocusIndex,
  normalizeHexColor,
  resolveAccordionExpandedIds,
  resolveColorSwatchTabStopIndex,
  resolveCopyFeedbackDurationMs,
  toggleAccordionId,
} from './l1-wave2.logic';
import { EmrBadgeView, resolveButtonPalette, type EmrButtonVariant } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

type PressState = PressableStateCallbackType & { focused?: boolean; hovered?: boolean };

export type {
  EmrAccordionItem,
  EmrBreadcrumbItem,
  EmrCollapsedBreadcrumbs,
  EmrColorSwatch,
  EmrMenuItem,
};

function focusNodeRef(node: unknown): void {
  (node as { focus?: () => void } | null | undefined)?.focus?.();
}

function containsDomNode(container: unknown, target: unknown): boolean {
  const el = container as { contains?: (n: unknown) => boolean } | null | undefined;
  return Boolean(el && typeof el.contains === 'function' && el.contains(target));
}

function renderOptionalSvgIcon(name: string | undefined, size: number, color: string) {
  if (!name || !isEmrIconName(name)) return null;
  return <SvgIcon name={name} size={size} color={color} />;
}

// ─────────────────────────────────────────────────────────────
// 1. EmrMenu
// ─────────────────────────────────────────────────────────────

export interface EmrMenuProps {
  readonly items: readonly EmrMenuItem[];
  readonly label?: string;
  /** @deprecated Use `label`. */
  readonly triggerLabel?: string;
  readonly ariaLabel?: string;
  readonly triggerIcon?: string;
  readonly variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** @deprecated Use `variant`. */
  readonly triggerVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  readonly size?: 'sm' | 'md';
  readonly align?: 'start' | 'end';
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly readOnly?: boolean;
  readonly disabled?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onItemSelected?: (item: EmrMenuItem) => void;
  /** @deprecated Use `onItemSelected`. */
  readonly onSelect?: (id: string, item: EmrMenuItem) => void;
  readonly onFocused?: () => void;
  readonly onBlurred?: () => void;
  readonly controlId?: string;
}

export function EmrMenu({
  items,
  label,
  triggerLabel,
  ariaLabel,
  triggerIcon,
  variant,
  triggerVariant,
  size = 'md',
  align = 'start',
  open,
  defaultOpen = false,
  readOnly = false,
  disabled = false,
  onOpenChange,
  onItemSelected,
  onSelect,
  onFocused,
  onBlurred,
  controlId,
}: EmrMenuProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-menu-${reactId}`;

  const resolvedLabel = label ?? triggerLabel ?? 'Actions';
  const resolvedVariant = variant ?? triggerVariant ?? 'outline';
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const canOpen = canOpenEmrMenu({ disabled, readOnly, itemsCount: items.length });
  const isOpen = canOpen && (open ?? uncontrolledOpen);
  const monoFont = Platform.OS === 'web' ? t.fontMono : undefined;

  const containerRef = useRef<ComponentRef<typeof View> | null>(null);
  const triggerRef = useRef<ComponentRef<typeof Pressable> | null>(null);
  const itemRefs = useRef<Array<unknown>>([]);
  const focusWithinRef = useRef(false);

  const setMenuOpen = (next: boolean) => {
    if (next && !canOpen) return;
    if (open === undefined) {
      setUncontrolledOpen(next);
    }
    if (isOpen !== next) {
      onOpenChange?.(next);
    }
  };

  useEffect(() => {
    if (!isOpen || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onPointerDown = (ev: Event) => {
      if (!containsDomNode(containerRef.current, ev.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  });

  const handleSelectItem = (item: EmrMenuItem) => {
    if (!canSelectEmrMenuItem(item, disabled, readOnly)) return;
    onItemSelected?.(item);
    onSelect?.(item.id, item);
    setMenuOpen(false);
    if (Platform.OS === 'web') {
      setTimeout(() => focusNodeRef(triggerRef.current), 0);
    }
  };

  const openAndFocus = (edge: 'Home' | 'End') => {
    if (!canOpen) return;
    setMenuOpen(true);
    const targetIdx = moveEmrMenuFocusIndex(items, -1, edge);
    if (targetIdx >= 0 && Platform.OS === 'web') {
      setTimeout(() => focusNodeRef(itemRefs.current[targetIdx]), 0);
    }
  };

  const handleFocusIn = () => {
    if (!focusWithinRef.current) {
      focusWithinRef.current = true;
      onFocused?.();
    }
  };

  const handleFocusOut = (ev: { relatedTarget?: unknown }) => {
    if (ev.relatedTarget && containsDomNode(containerRef.current, ev.relatedTarget)) return;
    if (focusWithinRef.current) {
      focusWithinRef.current = false;
      onBlurred?.();
    }
  };

  const triggerHeight = Math.max(44, t.controlHeight);
  const triggerPadX = size === 'sm' ? 12 : 16;

  return (
    <View
      ref={containerRef}
      style={[
        styles.menuContainer,
        Platform.OS === 'web' && isOpen ? ({ zIndex: 70 } as object) : null,
      ]}
      {...webProps({
        id,
        onFocus: handleFocusIn,
        onBlur: handleFocusOut,
      })}
    >
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel={ariaLabel ?? (resolvedLabel || 'Actions')}
        accessibilityState={{ expanded: isOpen, disabled }}
        disabled={disabled}
        onPress={() => {
          if (canOpen) setMenuOpen(!isOpen);
        }}
        {...webProps({
          id: `${id}-trigger`,
          'aria-haspopup': 'menu',
          'aria-controls': `${id}-menu`,
          'aria-readonly': readOnly || undefined,
          onKeyDown: (e: WebKeyEvent) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              openAndFocus('Home');
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              openAndFocus('End');
            } else if (e.key === 'Escape' && isOpen) {
              e.preventDefault();
              setMenuOpen(false);
            }
          },
        })}
        style={({ pressed, hovered, focused }: PressState) => {
          const pal = resolveButtonPalette(
            t,
            resolvedVariant,
            Boolean((pressed || hovered) && !disabled && !readOnly),
          );
          return [
            styles.menuTriggerBtn,
            focusRing(t, focused),
            {
              minHeight: triggerHeight,
              paddingHorizontal: triggerPadX,
              backgroundColor: pal.backgroundColor,
              borderColor: pal.borderColor,
              opacity: disabled ? 0.55 : 1,
            },
          ];
        }}
      >
        {({ pressed, hovered }: PressState) => {
          const pal = resolveButtonPalette(
            t,
            resolvedVariant,
            Boolean((pressed || hovered) && !disabled && !readOnly),
          );
          return (
            <View style={styles.menuTriggerInner}>
              {renderOptionalSvgIcon(triggerIcon, 16, pal.textColor)}
              {resolvedLabel ? (
                <Text
                  numberOfLines={1}
                  style={{
                    color: pal.textColor,
                    fontSize: size === 'sm' ? t.textSm : t.textMd,
                    fontWeight: fontWeight(t.weightBold),
                    fontFamily: fontFamily(t),
                  }}
                >
                  {resolvedLabel}
                </Text>
              ) : null}
              <SvgIcon
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={pal.textColor}
              />
            </View>
          );
        }}
      </Pressable>

      {isOpen ? (
        <View
          style={[
            styles.menuSurface,
            Platform.OS === 'web'
              ? ({
                  position: 'absolute',
                  top: '100%',
                  marginTop: 4,
                  zIndex: 70,
                  maxWidth: 320,
                  ...(align === 'end' ? { right: 0 } : { left: 0 }),
                } as object)
              : null,
            {
              backgroundColor: t.surface,
              borderColor: t.border,
              borderRadius: 10,
            },
          ]}
          {...webProps({
            id: `${id}-menu`,
            role: 'menu',
            'aria-labelledby': `${id}-trigger`,
            'aria-label': ariaLabel ?? (resolvedLabel || 'Menu'),
            onKeyDown: (e: WebKeyEvent) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setMenuOpen(false);
                focusNodeRef(triggerRef.current);
              } else if (e.key === 'Tab') {
                setMenuOpen(false);
              }
            },
          })}
        >
          {items.map((item, idx) => {
            const isDanger = item.tone === 'danger';
            return (
              <View key={item.id}>
                {item.dividerBefore ? (
                  <View style={[styles.menuDivider, { backgroundColor: t.border }]} />
                ) : null}
                <Pressable
                  ref={(el: unknown) => {
                    itemRefs.current[idx] = el;
                  }}
                  accessibilityRole="menuitem"
                  accessibilityState={{ disabled: Boolean(item.disabled) }}
                  disabled={item.disabled}
                  onPress={() => handleSelectItem(item)}
                  {...webProps({
                    'aria-disabled': item.disabled || undefined,
                    onKeyDown: (e: WebKeyEvent & { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean }) => {
                      if (
                        e.key === 'ArrowDown' ||
                        e.key === 'ArrowUp' ||
                        e.key === 'Home' ||
                        e.key === 'End'
                      ) {
                        const nextIdx = moveEmrMenuFocusIndex(items, idx, e.key);
                        if (nextIdx >= 0) {
                          e.preventDefault();
                          focusNodeRef(itemRefs.current[nextIdx]);
                        }
                        return;
                      }
                      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        const matchIdx = findEmrMenuTypeaheadIndex(items, e.key, idx);
                        if (matchIdx >= 0) {
                          e.preventDefault();
                          focusNodeRef(itemRefs.current[matchIdx]);
                        }
                      }
                    },
                  })}
                  style={({ hovered, focused }: PressState) => [
                    styles.menuItemRow,
                    focusRing(t, focused),
                    {
                      backgroundColor: hovered && !item.disabled ? t.surfaceRaised : 'transparent',
                      opacity: item.disabled ? 0.48 : 1,
                    },
                  ]}
                >
                  <View style={styles.menuItemLead}>
                    {item.icon && isEmrIconName(item.icon) ? (
                      <View style={{ paddingTop: 2 }}>
                        <SvgIcon
                          name={item.icon}
                          size={15}
                          color={isDanger ? t.danger : t.text}
                        />
                      </View>
                    ) : null}
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={{
                          fontSize: t.textSm,
                          fontWeight: fontWeight(t.weightMedium),
                          color: isDanger ? t.danger : t.text,
                          fontFamily: fontFamily(t),
                        }}
                      >
                        {item.label}
                      </Text>
                      {item.description ? (
                        <Text
                          style={{
                            fontSize: t.textXs,
                            color: t.textMuted,
                            fontFamily: fontFamily(t),
                          }}
                        >
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  {item.shortcut ? (
                    <Text
                      style={{
                        fontSize: t.text2xs,
                        color: t.textMuted,
                        fontFamily: monoFont,
                      }}
                    >
                      {item.shortcut}
                    </Text>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. EmrSplitButton
// ─────────────────────────────────────────────────────────────

export interface EmrSplitButtonProps {
  readonly label: string;
  readonly menuLabel?: string;
  readonly items: readonly EmrMenuItem[];
  readonly variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly align?: 'start' | 'end';
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly loading?: boolean;
  readonly readOnly?: boolean;
  readonly disabled?: boolean;
  readonly onClicked?: () => void;
  /** @deprecated Use `onClicked`. */
  readonly onPress?: () => void;
  readonly onItemSelected?: (item: EmrMenuItem) => void;
  /** @deprecated Use `onItemSelected`. */
  readonly onSelect?: (id: string, item: EmrMenuItem) => void;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onFocused?: () => void;
  readonly onBlurred?: () => void;
  readonly controlId?: string;
}

export function EmrSplitButton({
  label,
  menuLabel,
  items,
  variant = 'primary',
  size = 'md',
  align = 'end',
  open,
  defaultOpen = false,
  loading = false,
  readOnly = false,
  disabled = false,
  onClicked,
  onPress,
  onItemSelected,
  onSelect,
  onOpenChange,
  onFocused,
  onBlurred,
  controlId,
}: EmrSplitButtonProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-split-btn-${reactId}`;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const canPrimary = canTriggerEmrSplitPrimary({ disabled, readOnly, loading });
  const canMenu = canOpenEmrSplitMenu({ disabled, readOnly, loading, itemsCount: items.length });
  const menuOpen = canMenu && (open ?? uncontrolledOpen);
  const monoFont = Platform.OS === 'web' ? t.fontMono : undefined;

  const containerRef = useRef<ComponentRef<typeof View> | null>(null);
  const toggleRef = useRef<ComponentRef<typeof Pressable> | null>(null);
  const itemRefs = useRef<Array<unknown>>([]);
  const focusWithinRef = useRef(false);

  const setMenuOpen = (next: boolean) => {
    if (next && !canMenu) return;
    if (open === undefined) {
      setUncontrolledOpen(next);
    }
    if (menuOpen !== next) {
      onOpenChange?.(next);
    }
  };

  useEffect(() => {
    if (!menuOpen || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onPointerDown = (ev: Event) => {
      if (!containsDomNode(containerRef.current, ev.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  });

  const openAndFocus = (edge: 'Home' | 'End') => {
    if (!canMenu) return;
    setMenuOpen(true);
    const targetIdx = moveEmrMenuFocusIndex(items, -1, edge);
    if (targetIdx >= 0 && Platform.OS === 'web') {
      setTimeout(() => focusNodeRef(itemRefs.current[targetIdx]), 0);
    }
  };

  const handleFocusIn = () => {
    if (!focusWithinRef.current) {
      focusWithinRef.current = true;
      onFocused?.();
    }
  };

  const handleFocusOut = (ev: { relatedTarget?: unknown }) => {
    if (ev.relatedTarget && containsDomNode(containerRef.current, ev.relatedTarget)) return;
    if (focusWithinRef.current) {
      focusWithinRef.current = false;
      onBlurred?.();
    }
  };

  const height = Math.max(44, size === 'lg' ? 48 : t.controlHeight);
  const padX = size === 'sm' ? 12 : size === 'lg' ? 20 : 14;
  const textSize = size === 'sm' ? t.textSm : size === 'lg' ? t.textLg : t.textMd;
  const basePalette = resolveButtonPalette(t, variant as EmrButtonVariant, false);
  const inert = Boolean(disabled || loading);

  return (
    <View
      ref={containerRef}
      style={[
        styles.splitWrap,
        Platform.OS === 'web' && menuOpen ? ({ zIndex: 70 } as object) : null,
      ]}
      {...webProps({
        id,
        role: 'group',
        'aria-label': label,
        onFocus: handleFocusIn,
        onBlur: handleFocusOut,
      })}
    >
      <View
        style={[
          styles.splitButtonBar,
          {
            borderColor: basePalette.borderColor,
            borderRadius: 8,
            opacity: disabled ? 0.55 : 1,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled: inert, busy: loading }}
          disabled={inert}
          onPress={() => {
            if (!canPrimary) return;
            setMenuOpen(false);
            onClicked?.();
            onPress?.();
          }}
          {...webProps({
            id: `${id}-primary`,
            'aria-readonly': readOnly || undefined,
            'aria-busy': loading || undefined,
          })}
          style={({ pressed, hovered, focused }: PressState) => {
            const pal = resolveButtonPalette(
              t,
              variant as EmrButtonVariant,
              Boolean((pressed || hovered) && canPrimary),
            );
            return [
              styles.splitPrimaryHit,
              focusRing(t, focused),
              {
                backgroundColor: pal.backgroundColor,
                minHeight: height,
                paddingHorizontal: padX,
              },
            ];
          }}
        >
          {({ pressed, hovered }: PressState) => {
            const pal = resolveButtonPalette(
              t,
              variant as EmrButtonVariant,
              Boolean((pressed || hovered) && canPrimary),
            );
            return (
              <View style={styles.splitPrimaryInner}>
                {loading ? <ActivityIndicator size="small" color={pal.textColor} /> : null}
                <Text
                  style={{
                    fontSize: textSize,
                    fontWeight: fontWeight(t.weightBold),
                    color: pal.textColor,
                    fontFamily: fontFamily(t),
                  }}
                >
                  {label}
                </Text>
              </View>
            );
          }}
        </Pressable>

        <View
          style={{
            width: 1,
            backgroundColor: basePalette.borderColor,
          }}
        />

        <Pressable
          ref={toggleRef}
          accessibilityRole="button"
          accessibilityLabel={menuLabel ?? `${label} options`}
          accessibilityState={{ expanded: menuOpen, disabled: inert }}
          disabled={inert}
          onPress={() => {
            if (canMenu) setMenuOpen(!menuOpen);
          }}
          {...webProps({
            id: `${id}-toggle`,
            'aria-haspopup': 'menu',
            'aria-controls': `${id}-menu`,
            'aria-readonly': readOnly || undefined,
            onKeyDown: (e: WebKeyEvent) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                openAndFocus('Home');
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                openAndFocus('End');
              } else if (e.key === 'Escape' && menuOpen) {
                e.preventDefault();
                setMenuOpen(false);
              }
            },
          })}
          style={({ pressed, hovered, focused }: PressState) => {
            const pal = resolveButtonPalette(
              t,
              variant as EmrButtonVariant,
              Boolean((pressed || hovered) && canMenu),
            );
            return [
              styles.splitChevronHit,
              focusRing(t, focused),
              {
                backgroundColor: pal.backgroundColor,
                minHeight: height,
              },
            ];
          }}
        >
          {({ pressed, hovered }: PressState) => {
            const pal = resolveButtonPalette(
              t,
              variant as EmrButtonVariant,
              Boolean((pressed || hovered) && canMenu),
            );
            return (
              <SvgIcon
                name={menuOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={pal.textColor}
              />
            );
          }}
        </Pressable>
      </View>

      {menuOpen ? (
        <View
          style={[
            styles.menuSurface,
            Platform.OS === 'web'
              ? ({
                  position: 'absolute',
                  top: '100%',
                  marginTop: 4,
                  zIndex: 70,
                  maxWidth: 320,
                  ...(align === 'end' ? { right: 0 } : { left: 0 }),
                } as object)
              : null,
            {
              backgroundColor: t.surface,
              borderColor: t.border,
              borderRadius: 10,
            },
          ]}
          {...webProps({
            id: `${id}-menu`,
            role: 'menu',
            'aria-label': menuLabel ?? `${label} options`,
            onKeyDown: (e: WebKeyEvent) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setMenuOpen(false);
                focusNodeRef(toggleRef.current);
              } else if (e.key === 'Tab') {
                setMenuOpen(false);
              }
            },
          })}
        >
          {items.map((item, idx) => {
            const isDanger = item.tone === 'danger';
            return (
              <View key={item.id}>
                {item.dividerBefore ? (
                  <View style={[styles.menuDivider, { backgroundColor: t.border }]} />
                ) : null}
                <Pressable
                  ref={(el: unknown) => {
                    itemRefs.current[idx] = el;
                  }}
                  accessibilityRole="menuitem"
                  accessibilityState={{ disabled: Boolean(item.disabled) }}
                  disabled={item.disabled}
                  onPress={() => {
                    if (loading || !canSelectEmrMenuItem(item, disabled, readOnly)) return;
                    onItemSelected?.(item);
                    onSelect?.(item.id, item);
                    setMenuOpen(false);
                    if (Platform.OS === 'web') {
                      setTimeout(() => focusNodeRef(toggleRef.current), 0);
                    }
                  }}
                  {...webProps({
                    'aria-disabled': item.disabled || undefined,
                    onKeyDown: (e: WebKeyEvent & { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean }) => {
                      if (
                        e.key === 'ArrowDown' ||
                        e.key === 'ArrowUp' ||
                        e.key === 'Home' ||
                        e.key === 'End'
                      ) {
                        const nextIdx = moveEmrMenuFocusIndex(items, idx, e.key);
                        if (nextIdx >= 0) {
                          e.preventDefault();
                          focusNodeRef(itemRefs.current[nextIdx]);
                        }
                        return;
                      }
                      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        const matchIdx = findEmrMenuTypeaheadIndex(items, e.key, idx);
                        if (matchIdx >= 0) {
                          e.preventDefault();
                          focusNodeRef(itemRefs.current[matchIdx]);
                        }
                      }
                    },
                  })}
                  style={({ hovered, focused }: PressState) => [
                    styles.menuItemRow,
                    focusRing(t, focused),
                    {
                      backgroundColor: hovered && !item.disabled ? t.surfaceRaised : 'transparent',
                      opacity: item.disabled ? 0.48 : 1,
                    },
                  ]}
                >
                  <View style={styles.menuItemLead}>
                    {item.icon && isEmrIconName(item.icon) ? (
                      <View style={{ paddingTop: 2 }}>
                        <SvgIcon
                          name={item.icon}
                          size={15}
                          color={isDanger ? t.danger : t.text}
                        />
                      </View>
                    ) : null}
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={{
                          fontSize: t.textSm,
                          fontWeight: fontWeight(t.weightMedium),
                          color: isDanger ? t.danger : t.text,
                          fontFamily: fontFamily(t),
                        }}
                      >
                        {item.label}
                      </Text>
                      {item.description ? (
                        <Text
                          style={{
                            fontSize: t.textXs,
                            color: t.textMuted,
                            fontFamily: fontFamily(t),
                          }}
                        >
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  {item.shortcut ? (
                    <Text
                      style={{
                        fontSize: t.text2xs,
                        color: t.textMuted,
                        fontFamily: monoFont,
                      }}
                    >
                      {item.shortcut}
                    </Text>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. EmrAccordion
// ─────────────────────────────────────────────────────────────

export interface EmrAccordionProps {
  readonly items: readonly EmrAccordionItem[];
  readonly expandedIds?: readonly string[];
  readonly defaultExpandedIds?: readonly string[];
  readonly onExpandedIdsChange?: (expandedIds: readonly string[]) => void;
  /** @deprecated Use `onExpandedIdsChange`. */
  readonly onExpandedChange?: (expandedIds: readonly string[]) => void;
  readonly onItemToggled?: (event: { readonly id: string; readonly expanded: boolean }) => void;
  readonly onFocused?: () => void;
  readonly onBlurred?: () => void;
  readonly multiple?: boolean;
  readonly variant?: 'outlined' | 'flush' | 'card';
  readonly size?: 'sm' | 'md';
  readonly headingLevel?: 2 | 3 | 4 | 5 | 6;
  readonly readOnly?: boolean;
  readonly disabled?: boolean;
  readonly renderContent?: (item: EmrAccordionItem) => ReactNode;
  readonly controlId?: string;
}

export function EmrAccordion({
  items,
  expandedIds,
  defaultExpandedIds = [],
  onExpandedIdsChange,
  onExpandedChange,
  onItemToggled,
  onFocused,
  onBlurred,
  multiple = false,
  variant = 'outlined',
  size = 'md',
  headingLevel = 3,
  readOnly = false,
  disabled = false,
  renderContent,
  controlId,
}: EmrAccordionProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-accordion-${reactId}`;

  const [uncontrolledIds, setUncontrolledIds] =
    useState<readonly string[]>(defaultExpandedIds);
  const activeIds = resolveAccordionExpandedIds(
    items,
    expandedIds ?? uncontrolledIds,
    multiple,
  );

  const containerRef = useRef<ComponentRef<typeof View> | null>(null);
  const headerRefs = useRef<Array<unknown>>([]);
  const focusWithinRef = useRef(false);

  const handleToggle = (item: EmrAccordionItem) => {
    if (!canToggleAccordionItem(item, disabled, readOnly)) return;
    const next = toggleAccordionId(activeIds, item.id, multiple);
    if (expandedIds === undefined) {
      setUncontrolledIds(next);
    }
    const expanded = next.includes(item.id);
    onItemToggled?.({ id: item.id, expanded });
    onExpandedIdsChange?.(next);
    onExpandedChange?.(next);
  };

  const handleFocusIn = () => {
    if (!focusWithinRef.current) {
      focusWithinRef.current = true;
      onFocused?.();
    }
  };

  const handleFocusOut = (ev: { relatedTarget?: unknown }) => {
    if (ev.relatedTarget && containsDomNode(containerRef.current, ev.relatedTarget)) return;
    if (focusWithinRef.current) {
      focusWithinRef.current = false;
      onBlurred?.();
    }
  };

  const isFlush = variant === 'flush';
  const isCard = variant === 'card';
  const headerMinHeight = size === 'sm' ? 44 : 48;

  return (
    <View
      ref={containerRef}
      style={[
        styles.accordionBox,
        isFlush
          ? {
              borderWidth: 0,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: t.border,
              borderRadius: 0,
              backgroundColor: 'transparent',
            }
          : isCard
            ? {
                borderWidth: 0,
                gap: 10,
                backgroundColor: 'transparent',
              }
            : {
                borderColor: t.border,
                borderRadius: 10,
                backgroundColor: t.surface,
              },
        { opacity: disabled ? 0.6 : 1 },
      ]}
      {...webProps({
        id,
        onFocus: handleFocusIn,
        onBlur: handleFocusOut,
      })}
    >
      {items.map((item, idx) => {
        const isExpanded = activeIds.includes(item.id);
        const headerId = `${id}-header-${item.id}`;
        const panelId = `${id}-panel-${item.id}`;
        const itemDisabled = Boolean(disabled || item.disabled);
        return (
          <View
            key={item.id}
            style={[
              isCard
                ? {
                    borderWidth: 1,
                    borderColor: t.border,
                    borderRadius: 10,
                    backgroundColor: t.surface,
                    overflow: 'hidden',
                  }
                : idx > 0
                  ? { borderTopWidth: 1, borderTopColor: t.border }
                  : null,
            ]}
          >
            <View
              accessibilityRole="header"
              {...webProps({
                role: 'heading',
                'aria-level': headingLevel,
              })}
            >
              <Pressable
                ref={(el: unknown) => {
                  headerRefs.current[idx] = el;
                }}
                accessibilityRole="button"
                accessibilityState={{
                  expanded: isExpanded,
                  disabled: itemDisabled,
                }}
                disabled={itemDisabled}
                onPress={() => handleToggle(item)}
                {...webProps({
                  id: headerId,
                  'aria-controls': panelId,
                  'aria-readonly': readOnly || undefined,
                  onKeyDown: (e: WebKeyEvent) => {
                    if (
                      e.key === 'ArrowDown' ||
                      e.key === 'ArrowUp' ||
                      e.key === 'Home' ||
                      e.key === 'End'
                    ) {
                      if (disabled) return;
                      const nextIdx = moveAccordionFocusIndex(items, idx, e.key);
                      if (nextIdx >= 0) {
                        e.preventDefault();
                        focusNodeRef(headerRefs.current[nextIdx]);
                      }
                    }
                  },
                })}
                style={({ hovered, focused }: PressState) => [
                  styles.accordionHeader,
                  focusRing(t, focused),
                  {
                    minHeight: headerMinHeight,
                    backgroundColor:
                      hovered && !itemDisabled
                        ? t.surfaceRaised
                        : isExpanded
                          ? t.surfaceSoft
                          : isFlush
                            ? 'transparent'
                            : t.surface,
                    opacity: item.disabled ? 0.5 : 1,
                  },
                ]}
              >
                <View style={styles.accordionTitleLead}>
                  {renderOptionalSvgIcon(item.icon, 16, t.text)}
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.accordionTitleRow}>
                      <Text
                        style={{
                          fontSize: size === 'sm' ? t.textSm : t.textMd,
                          fontWeight: fontWeight(t.weightBold),
                          color: t.text,
                          fontFamily: fontFamily(t),
                        }}
                      >
                        {item.title}
                      </Text>
                      {item.badge ? <EmrBadgeView badge={item.badge} /> : null}
                    </View>
                    {item.subtitle ? (
                      <Text
                        style={{
                          fontSize: t.textXs,
                          color: t.textMuted,
                          fontFamily: fontFamily(t),
                        }}
                      >
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <SvgIcon
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={t.textMuted}
                />
              </Pressable>
            </View>

            {Platform.OS === 'web' || isExpanded ? (
              <View
                nativeID={panelId}
                style={[
                  styles.accordionPanel,
                  { borderTopColor: t.border },
                  Platform.OS === 'web' && !isExpanded ? ({ display: 'none' } as object) : null,
                ]}
                {...webProps({
                  role: 'region',
                  'aria-labelledby': headerId,
                  hidden: !isExpanded || undefined,
                  className: 'emr-accordion__panel',
                })}
              >
                {renderContent ? (
                  renderContent(item)
                ) : item.content ? (
                  <Text
                    style={{
                      fontSize: size === 'sm' ? t.textXs : t.textSm,
                      color: t.text,
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {item.content}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. EmrBreadcrumbs
// ─────────────────────────────────────────────────────────────

export interface EmrBreadcrumbsProps {
  readonly items: readonly EmrBreadcrumbItem[];
  readonly ariaLabel?: string;
  readonly maxItems?: number;
  readonly separator?: string;
  readonly size?: 'sm' | 'md';
  readonly onItemSelected?: (item: EmrBreadcrumbItem) => void;
  /** @deprecated Use `onItemSelected`. */
  readonly onNavigate?: (id: string, item: EmrBreadcrumbItem) => void;
  readonly onOverflowExpanded?: (revealed: readonly EmrBreadcrumbItem[]) => void;
  readonly controlId?: string;
}

export function EmrBreadcrumbs({
  items,
  ariaLabel = 'Breadcrumb',
  maxItems,
  separator = '/',
  size = 'md',
  onItemSelected,
  onNavigate,
  onOverflowExpanded,
  controlId,
}: EmrBreadcrumbsProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-breadcrumbs-${reactId}`;

  const [expandedAll, setExpandedAll] = useState(false);
  const crumbRefs = useRef<Record<string, unknown>>({});

  useEffect(() => {
    setExpandedAll(false);
  }, [items, maxItems]);

  const collapsed = collapseBreadcrumbs(
    items,
    expandedAll ? undefined : maxItems,
  );

  const renderSeparator = () =>
    separator === 'chevron' ? (
      <SvgIcon name="chevron-right" size={14} color={t.textMuted} />
    ) : (
      <Text
        style={{
          fontSize: t.textXs,
          color: t.textMuted,
          fontFamily: fontFamily(t),
        }}
      >
        {separator}
      </Text>
    );

  const textSize = size === 'sm' ? t.textXs : t.textSm;

  const renderCrumb = (item: EmrBreadcrumbItem, isCurrent: boolean) => {
    if (isCurrent) {
      return (
        <View key={item.id} style={styles.crumbCurrentWrap}>
          {renderOptionalSvgIcon(item.icon, 14, t.text)}
          <Text
            accessibilityRole="text"
            {...webProps({ 'aria-current': 'page' })}
            style={{
              fontSize: textSize,
              fontWeight: fontWeight(t.weightBold),
              color: t.text,
              fontFamily: fontFamily(t),
            }}
          >
            {item.label}
          </Text>
        </View>
      );
    }

    const canSelect = canSelectEmrBreadcrumb(item, isCurrent);
    return (
      <Pressable
        key={item.id}
        ref={(el: unknown) => {
          crumbRefs.current[item.id] = el;
        }}
        accessibilityRole="link"
        accessibilityState={{ disabled: Boolean(item.disabled) }}
        disabled={item.disabled}
        onPress={() => {
          if (!canSelect) return;
          onItemSelected?.(item);
          onNavigate?.(item.id, item);
        }}
        {...webProps({
          'aria-disabled': item.disabled || undefined,
          ...(item.href && !item.disabled
            ? {
                href: item.href,
                onClick: (ev: {
                  metaKey?: boolean;
                  ctrlKey?: boolean;
                  shiftKey?: boolean;
                  altKey?: boolean;
                  preventDefault?: () => void;
                }) => {
                  if (!ev.metaKey && !ev.ctrlKey && !ev.shiftKey && !ev.altKey) {
                    ev.preventDefault?.();
                  }
                },
              }
            : null),
        })}
        style={({ hovered, focused }: PressState) => [
          styles.crumbHit,
          focusRing(t, focused),
          {
            backgroundColor: hovered && canSelect ? t.surfaceSoft : 'transparent',
            borderRadius: 6,
            opacity: item.disabled ? 0.5 : 1,
          },
        ]}
      >
        <View style={styles.crumbInner}>
          {renderOptionalSvgIcon(item.icon, 14, t.primaryContrast)}
          <Text
            style={{
              fontSize: textSize,
              fontWeight: fontWeight(t.weightMedium),
              color: t.primaryContrast,
              fontFamily: fontFamily(t),
            }}
          >
            {item.label}
          </Text>
        </View>
      </Pressable>
    );
  };

  const lastId = items[items.length - 1]?.id;

  const handleExpandOverflow = () => {
    const hidden = collapsed.hidden;
    const firstHidden = hidden.find((c) => !c.disabled);
    setExpandedAll(true);
    onOverflowExpanded?.(hidden);
    if (firstHidden && Platform.OS === 'web') {
      setTimeout(() => focusNodeRef(crumbRefs.current[firstHidden.id]), 0);
    }
  };

  return (
    <View
      style={styles.breadcrumbsBar}
      {...webProps({
        id,
        role: 'navigation',
        'aria-label': ariaLabel || 'Breadcrumb',
      })}
    >
      {collapsed.leading.map((item, idx) => (
        <View key={item.id} style={styles.crumbSegment}>
          {idx > 0 ? renderSeparator() : null}
          {renderCrumb(item, item.id === lastId)}
        </View>
      ))}

      {collapsed.hidden.length > 0 ? (
        <View style={styles.crumbSegment}>
          {renderSeparator()}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Show ${collapsed.hidden.length} hidden levels`}
            onPress={handleExpandOverflow}
            style={({ hovered, focused }: PressState) => [
              styles.ellipsisBtn,
              focusRing(t, focused),
              {
                backgroundColor: hovered ? t.surfaceRaised : t.surfaceSoft,
                borderColor: t.border,
                borderRadius: 6,
              },
            ]}
          >
            <SvgIcon name="more-horizontal" size={16} color={t.text} />
          </Pressable>
        </View>
      ) : null}

      {collapsed.trailing.map((item) => (
        <View key={item.id} style={styles.crumbSegment}>
          {renderSeparator()}
          {renderCrumb(item, item.id === lastId)}
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. EmrColorPicker
// ─────────────────────────────────────────────────────────────

export interface EmrColorPickerProps {
  readonly value?: string | null;
  readonly onValueChange?: (value: string | null) => void;
  readonly swatches?: readonly EmrColorSwatch[];
  readonly allowCustomHex?: boolean;
  readonly clearable?: boolean;
  readonly size?: 'sm' | 'md';
  readonly onCleared?: () => void;
  readonly onFocused?: () => void;
  readonly onBlurred?: () => void;
  readonly label?: string;
  readonly labelHidden?: boolean;
  readonly hint?: string;
  readonly error?: string;
  readonly warning?: string;
  readonly info?: string;
  readonly messages?: readonly FieldValidationLine[];
  readonly required?: boolean;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly controlId?: string;
}

export function EmrColorPicker({
  value = null,
  onValueChange,
  swatches = DEFAULT_CLINICAL_COLOR_SWATCHES,
  allowCustomHex = true,
  clearable = true,
  size = 'md',
  onCleared,
  onFocused,
  onBlurred,
  label = 'Color',
  labelHidden = false,
  hint,
  error,
  warning,
  info,
  messages,
  required,
  invalid = false,
  disabled = false,
  readOnly = false,
  controlId,
}: EmrColorPickerProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-color-picker-${reactId}`;

  const [hexDraft, setHexDraft] = useState(value ?? '');
  const [draftInvalid, setDraftInvalid] = useState(false);

  const containerRef = useRef<ComponentRef<typeof View> | null>(null);
  const swatchRefs = useRef<Array<unknown>>([]);
  const focusWithinRef = useRef(false);

  const interactive = !disabled && !readOnly;
  const activeHex = normalizeHexColor(value);
  const isInvalid = Boolean(invalid || error);
  const showWarning = isInvalid ? undefined : warning;
  const tabStopIndex = resolveColorSwatchTabStopIndex(swatches, value, disabled);
  const showClear = canClearEmrColorPicker({ clearable, value, disabled, readOnly });
  const monoFont = Platform.OS === 'web' ? t.fontMono : undefined;

  useEffect(() => {
    const normalized = normalizeHexColor(value) ?? value ?? '';
    if (!interactive || !draftInvalid) {
      setHexDraft(normalized);
      setDraftInvalid(false);
    }
  }, [value, interactive]);

  const handleSelectSwatch = (hex: string) => {
    if (!interactive) return;
    const normalized = normalizeHexColor(hex) ?? hex;
    setHexDraft(normalized);
    setDraftInvalid(false);
    onValueChange?.(normalized);
  };

  const handleHexInputChange = (raw: string) => {
    if (!interactive) return;
    setHexDraft(raw);
    if (!raw.trim()) {
      setDraftInvalid(false);
      if (clearable) {
        onValueChange?.(null);
        onCleared?.();
      }
      return;
    }
    const normalized = normalizeHexColor(raw);
    if (normalized) {
      setDraftInvalid(false);
      onValueChange?.(normalized);
    } else {
      setDraftInvalid(true);
    }
  };

  const handleHexBlur = () => {
    const expected = activeHex ?? value ?? '';
    setHexDraft(expected);
    setDraftInvalid(false);
  };

  const handleClear = () => {
    if (!interactive) return;
    setHexDraft('');
    setDraftInvalid(false);
    onValueChange?.(null);
    onCleared?.();
  };

  const handleFocusIn = () => {
    if (!focusWithinRef.current) {
      focusWithinRef.current = true;
      onFocused?.();
    }
  };

  const handleFocusOut = (ev: { relatedTarget?: unknown }) => {
    if (ev.relatedTarget && containsDomNode(containerRef.current, ev.relatedTarget)) return;
    if (focusWithinRef.current) {
      focusWithinRef.current = false;
      onBlurred?.();
    }
  };

  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={error}
      warning={showWarning}
      info={info}
      messages={messages}
      required={required}
    >
      <View
        ref={containerRef}
        style={[styles.colorWrap, { opacity: disabled ? 0.55 : 1 }]}
        {...webProps({
          onFocus: handleFocusIn,
          onBlur: handleFocusOut,
        })}
      >
        <View
          style={styles.swatchGrid}
          {...webProps({
            id,
            role: 'radiogroup',
            'aria-label': label || 'Color',
            'aria-required': required || undefined,
            'aria-readonly': readOnly || undefined,
            'aria-invalid': isInvalid || undefined,
          })}
        >
          {swatches.map((swatch, idx) => {
            const normalizedSwatch = normalizeHexColor(swatch.value) ?? swatch.value;
            const isSelected = Boolean(activeHex && activeHex === normalizedSwatch);
            const checkTone = getContrastCheckTone(swatch.value);
            const checkColor = checkTone === 'dark' ? '#0f172a' : '#ffffff';
            return (
              <Pressable
                key={swatch.value}
                ref={(el: unknown) => {
                  swatchRefs.current[idx] = el;
                }}
                accessibilityRole="radio"
                accessibilityLabel={`${swatch.label} (${swatch.value})`}
                accessibilityState={{
                  selected: isSelected,
                  checked: isSelected,
                  disabled,
                }}
                disabled={disabled}
                onPress={() => handleSelectSwatch(swatch.value)}
                {...webProps({
                  'aria-checked': isSelected,
                  tabIndex: disabled ? -1 : idx === tabStopIndex ? 0 : -1,
                  'aria-readonly': readOnly || undefined,
                  onKeyDown: (e: WebKeyEvent) => {
                    if (
                      e.key !== 'ArrowLeft' &&
                      e.key !== 'ArrowRight' &&
                      e.key !== 'ArrowUp' &&
                      e.key !== 'ArrowDown' &&
                      e.key !== 'Home' &&
                      e.key !== 'End'
                    ) {
                      return;
                    }
                    const nextIdx = moveColorSwatchFocusIndex(swatches, idx, e.key, disabled);
                    if (nextIdx < 0) return;
                    e.preventDefault();
                    focusNodeRef(swatchRefs.current[nextIdx]);
                    const nextSwatch = swatches[nextIdx];
                    if (nextSwatch && interactive) {
                      handleSelectSwatch(nextSwatch.value);
                    }
                  },
                })}
                style={({ focused }: PressState) => [
                  styles.swatchTile,
                  focusRing(t, focused),
                  {
                    backgroundColor: swatch.value,
                    borderColor: isSelected ? t.text : t.border,
                    borderWidth: isSelected ? 2.5 : 1.5,
                  },
                ]}
              >
                {isSelected ? <SvgIcon name="check" size={16} color={checkColor} /> : null}
              </Pressable>
            );
          })}
        </View>

        {allowCustomHex || showClear ? (
          <View style={styles.hexRow}>
            {allowCustomHex ? (
              <>
                <View
                  style={[
                    styles.colorPreviewChip,
                    {
                      backgroundColor: activeHex ?? t.surfaceSoft,
                      borderColor: t.border,
                      borderRadius: 8,
                    },
                  ]}
                />
                <TextInput
                  value={hexDraft}
                  editable={interactive}
                  maxLength={7}
                  placeholder="#RRGGBB"
                  placeholderTextColor={t.textMuted}
                  accessibilityLabel={`${label || 'Color'} hex code`}
                  onChangeText={handleHexInputChange}
                  onBlur={handleHexBlur}
                  {...webProps({
                    readOnly,
                    'aria-invalid': isInvalid || draftInvalid || undefined,
                  })}
                  style={[
                    styles.hexInput,
                    {
                      minHeight: size === 'sm' ? 44 : Math.max(44, t.controlHeight),
                      fontSize: size === 'sm' ? t.textXs : t.textSm,
                      color: t.text,
                      backgroundColor: readOnly ? t.surfaceSoft : t.surface,
                      borderColor: isInvalid || draftInvalid ? t.danger : t.border,
                      borderRadius: 8,
                      fontFamily: monoFont,
                    },
                  ]}
                />
              </>
            ) : null}
            {showClear ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Clear ${label || 'color'}`}
                onPress={handleClear}
                style={({ hovered, focused }: PressState) => [
                  styles.colorClearBtn,
                  focusRing(t, focused),
                  {
                    backgroundColor: hovered ? t.surfaceRaised : t.surfaceSoft,
                    borderColor: t.border,
                    borderRadius: 8,
                  },
                ]}
              >
                <SvgIcon name="close" size={14} color={t.text} />
                <Text
                  style={{
                    fontSize: t.textXs,
                    fontWeight: fontWeight(t.weightMedium),
                    color: t.text,
                    fontFamily: fontFamily(t),
                  }}
                >
                  Clear
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </FieldChrome>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. EmrCopyButton
// ─────────────────────────────────────────────────────────────

export interface EmrCopyButtonProps {
  readonly value: string;
  readonly label?: string;
  readonly copiedLabel?: string;
  readonly iconOnly?: boolean;
  readonly ariaLabel?: string;
  readonly variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly feedbackDurationMs?: number;
  readonly disabled?: boolean;
  readonly onCopied?: (value: string) => void;
  readonly onFocused?: () => void;
  readonly onBlurred?: () => void;
  readonly controlId?: string;
}

export function EmrCopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  iconOnly = false,
  ariaLabel,
  variant = 'outline',
  size = 'sm',
  feedbackDurationMs = 2000,
  disabled = false,
  onCopied,
  onFocused,
  onBlurred,
  controlId,
}: EmrCopyButtonProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-copy-button-${reactId}`;

  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    clearTimer();
    setCopied(false);
  }, [value]);

  useEffect(() => () => clearTimer(), []);

  const canCopy = canCopyEmrValue(value, disabled);
  const displayLabel = formatCopyButtonLabel(copied, label, copiedLabel);
  const resolvedAriaLabel = ariaLabel ?? displayLabel;

  const handleCopy = () => {
    if (!canCopy) return;
    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      void navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopied(true);
    onCopied?.(value);
    clearTimer();
    const ms = resolveCopyFeedbackDurationMs(feedbackDurationMs);
    if (ms > 0) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setCopied(false);
      }, ms);
    }
  };

  const height = Math.max(44, size === 'lg' ? 48 : t.controlHeight);
  const padX = iconOnly ? 0 : size === 'sm' ? 12 : size === 'lg' ? 20 : 16;
  const textSize = size === 'sm' ? t.textSm : size === 'lg' ? t.textLg : t.textMd;

  return (
    <View style={styles.copyWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={resolvedAriaLabel}
        accessibilityState={{ disabled: !canCopy }}
        disabled={!canCopy}
        onPress={handleCopy}
        onFocus={onFocused}
        onBlur={onBlurred}
        {...webProps({
          id,
          type: 'button',
          'data-copied': copied ? 'true' : 'false',
        })}
        style={({ pressed, hovered, focused }: PressState) => {
          const pal = resolveButtonPalette(
            t,
            variant,
            Boolean((pressed || hovered) && canCopy),
          );
          return [
            styles.copyButton,
            focusRing(t, focused),
            {
              minHeight: height,
              minWidth: 44,
              width: iconOnly ? height : undefined,
              paddingHorizontal: padX,
              backgroundColor: pal.backgroundColor,
              borderColor: copied ? t.success : pal.borderColor,
              opacity: canCopy ? 1 : 0.55,
            },
          ];
        }}
      >
        {({ pressed, hovered }: PressState) => {
          const pal = resolveButtonPalette(
            t,
            variant,
            Boolean((pressed || hovered) && canCopy),
          );
          const fg = copied ? t.success : pal.textColor;
          return (
            <View style={styles.copyInner}>
              <SvgIcon name={copied ? 'check' : 'copy'} size={14} color={fg} />
              {!iconOnly ? (
                <Text
                  numberOfLines={1}
                  style={{
                    color: fg,
                    fontSize: textSize,
                    fontWeight: fontWeight(t.weightBold),
                    fontFamily: fontFamily(t),
                  }}
                >
                  {displayLabel}
                </Text>
              ) : null}
            </View>
          );
        }}
      </Pressable>
      {Platform.OS === 'web' ? (
        <View
          role="status"
          aria-live="polite"
          style={styles.srOnly}
        >
          <Text>{copied ? copiedLabel : ''}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    gap: 4,
  },
  menuTriggerBtn: {
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTriggerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  menuSurface: {
    minWidth: 210,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
  menuItemRow: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  menuItemLead: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  splitWrap: {
    position: 'relative',
    alignSelf: 'flex-start',
    gap: 4,
  },
  splitButtonBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    overflow: 'hidden',
  },
  splitPrimaryHit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitPrimaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  splitChevronHit: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionBox: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  accordionHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  accordionTitleLead: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  accordionPanel: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  breadcrumbsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  crumbSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  crumbHit: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  crumbInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crumbCurrentWrap: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  ellipsisBtn: {
    minWidth: 44,
    minHeight: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorWrap: {
    gap: 8,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatchTile: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  colorPreviewChip: {
    width: 44,
    height: 44,
    borderWidth: 1,
  },
  hexInput: {
    width: 140,
    minHeight: 44,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  colorClearBtn: {
    minWidth: 44,
    minHeight: 44,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  copyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  copyButton: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
});
