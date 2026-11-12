'use client';

import type {
  EmrAccordionItem,
  EmrBreadcrumbItem,
  EmrCollapsedBreadcrumbs,
  EmrColorSwatch,
  EmrMenuItem,
} from '@drguptavivek/emr-controller';
import { type ReactNode, useEffect, useId, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SvgIcon } from './icons';
import { FieldChrome, type FieldValidationLine } from './l1-field-chrome';
import {
  collapseBreadcrumbs,
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  normalizeHexColor,
  toggleAccordionId,
} from './l1-wave2.logic';
import { EmrBadgeView, EmrButton } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

export type {
  EmrAccordionItem,
  EmrBreadcrumbItem,
  EmrCollapsedBreadcrumbs,
  EmrColorSwatch,
  EmrMenuItem,
};

// ─────────────────────────────────────────────────────────────
// 1. EmrMenu
// ─────────────────────────────────────────────────────────────

export interface EmrMenuProps {
  readonly items: readonly EmrMenuItem[];
  readonly triggerLabel?: string;
  readonly triggerVariant?: 'primary' | 'secondary' | 'ghost';
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onSelect?: (id: string, item: EmrMenuItem) => void;
  readonly disabled?: boolean;
  readonly controlId?: string;
}

export function EmrMenu({
  items,
  triggerLabel = 'Actions',
  triggerVariant = 'secondary',
  open,
  defaultOpen = false,
  onOpenChange,
  onSelect,
  disabled = false,
  controlId,
}: EmrMenuProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-menu-${reactId}`;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;
  const monoFont = Platform.OS === 'web' ? t.fontMono : undefined;

  const setMenuOpen = (next: boolean) => {
    if (disabled) return;
    if (open === undefined) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  const handleSelectItem = (item: EmrMenuItem) => {
    if (disabled || item.disabled) return;
    onSelect?.(item.id, item);
    setMenuOpen(false);
  };

  return (
    <View style={styles.menuContainer}>
      <EmrButton
        label={triggerLabel}
        variant={triggerVariant}
        disabled={disabled}
        expanded={isOpen}
        onPress={() => setMenuOpen(!isOpen)}
      />

      {isOpen && !disabled ? (
        <View
          style={[
            styles.menuSurface,
            {
              backgroundColor: t.surface,
              borderColor: t.border,
              borderRadius: 8,
            },
          ]}
          {...(Platform.OS === 'web'
            ? ({
                id: `${id}-menu`,
                role: 'menu',
                'aria-label': triggerLabel,
              } as Record<string, unknown>)
            : null)}
        >
          {items.map((item) => {
            const isDanger = item.tone === 'danger';
            return (
              <View key={item.id}>
                {item.dividerBefore ? (
                  <View
                    style={[
                      styles.menuDivider,
                      { backgroundColor: t.border },
                    ]}
                  />
                ) : null}
                <Pressable
                  accessibilityRole="menuitem"
                  accessibilityState={{ disabled: Boolean(item.disabled) }}
                  disabled={item.disabled}
                  onPress={() => handleSelectItem(item)}
                  style={[
                    styles.menuItemRow,
                    {
                      opacity: item.disabled ? 0.45 : 1,
                    },
                  ]}
                >
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
  readonly items: readonly EmrMenuItem[];
  readonly variant?: 'primary' | 'secondary';
  readonly disabled?: boolean;
  readonly defaultOpen?: boolean;
  readonly onPress?: () => void;
  readonly onSelect?: (id: string, item: EmrMenuItem) => void;
  readonly controlId?: string;
}

export function EmrSplitButton({
  label,
  items,
  variant = 'primary',
  disabled = false,
  defaultOpen = false,
  onPress,
  onSelect,
  controlId,
}: EmrSplitButtonProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-split-btn-${reactId}`;

  const [menuOpen, setMenuOpen] = useState(defaultOpen);
  const isPrimary = variant === 'primary';
  const bg = isPrimary ? t.primary : t.surface;
  const fg = isPrimary ? '#ffffff' : t.text;
  const borderCol = isPrimary ? t.primary : t.border;
  const monoFont = Platform.OS === 'web' ? t.fontMono : undefined;

  return (
    <View style={styles.splitWrap}>
      <View
        style={[
          styles.splitButtonBar,
          {
            borderColor: borderCol,
            borderRadius: 8,
            opacity: disabled ? 0.55 : 1,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          disabled={disabled}
          onPress={() => {
            if (!disabled) onPress?.();
          }}
          style={[
            styles.splitPrimaryHit,
            {
              backgroundColor: bg,
              minHeight: Math.max(44, t.controlHeight),
            },
          ]}
        >
          <Text
            style={{
              fontSize: t.textSm,
              fontWeight: fontWeight(t.weightBold),
              color: fg,
              fontFamily: fontFamily(t),
            }}
          >
            {label}
          </Text>
        </Pressable>

        <View
          style={{
            width: 1,
            backgroundColor: isPrimary ? 'rgba(255,255,255,0.28)' : t.border,
          }}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`More options for ${label}`}
          accessibilityState={{ expanded: menuOpen, disabled }}
          disabled={disabled}
          onPress={() => {
            if (!disabled) setMenuOpen((prev) => !prev);
          }}
          style={[
            styles.splitChevronHit,
            {
              backgroundColor: bg,
              minHeight: Math.max(44, t.controlHeight),
            },
          ]}
        >
          <SvgIcon
            name={menuOpen ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={fg}
          />
        </Pressable>
      </View>

      {menuOpen && !disabled ? (
        <View
          style={[
            styles.menuSurface,
            {
              backgroundColor: t.surface,
              borderColor: t.border,
              borderRadius: 8,
            },
          ]}
          {...(Platform.OS === 'web'
            ? ({
                id: `${id}-menu`,
                role: 'menu',
                'aria-label': `${label} options`,
              } as Record<string, unknown>)
            : null)}
        >
          {items.map((item) => {
            const isDanger = item.tone === 'danger';
            return (
              <Pressable
                key={item.id}
                accessibilityRole="menuitem"
                accessibilityState={{ disabled: Boolean(item.disabled) }}
                disabled={item.disabled}
                onPress={() => {
                  if (!item.disabled) {
                    onSelect?.(item.id, item);
                    setMenuOpen(false);
                  }
                }}
                style={[
                  styles.menuItemRow,
                  { opacity: item.disabled ? 0.45 : 1 },
                ]}
              >
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
  readonly onExpandedChange?: (expandedIds: readonly string[]) => void;
  readonly multiple?: boolean;
  readonly disabled?: boolean;
  readonly renderContent?: (item: EmrAccordionItem) => ReactNode;
  readonly controlId?: string;
}

export function EmrAccordion({
  items,
  expandedIds,
  defaultExpandedIds = [],
  onExpandedChange,
  multiple = false,
  disabled = false,
  renderContent,
  controlId,
}: EmrAccordionProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-accordion-${reactId}`;

  const [uncontrolledIds, setUncontrolledIds] =
    useState<readonly string[]>(defaultExpandedIds);
  const activeIds = expandedIds ?? uncontrolledIds;

  const handleToggle = (itemId: string, itemDisabled?: boolean) => {
    if (disabled || itemDisabled) return;
    const next = toggleAccordionId(activeIds, itemId, multiple);
    if (expandedIds === undefined) {
      setUncontrolledIds(next);
    }
    onExpandedChange?.(next);
  };

  return (
    <View
      style={[
        styles.accordionBox,
        {
          borderColor: t.border,
          borderRadius: 8,
          backgroundColor: t.surface,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      {items.map((item, idx) => {
        const isExpanded = activeIds.includes(item.id);
        return (
          <View
            key={item.id}
            style={[
              idx > 0
                ? { borderTopWidth: 1, borderTopColor: t.border }
                : null,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                expanded: isExpanded,
                disabled: Boolean(disabled || item.disabled),
              }}
              disabled={disabled || item.disabled}
              onPress={() => handleToggle(item.id, item.disabled)}
              style={[
                styles.accordionHeader,
                {
                  backgroundColor: isExpanded ? t.surfaceSoft : t.surface,
                  opacity: item.disabled ? 0.5 : 1,
                },
              ]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.accordionTitleRow}>
                  <Text
                    style={{
                      fontSize: t.textSm,
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
              <SvgIcon
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={t.textMuted}
              />
            </Pressable>

            {isExpanded ? (
              <View
                nativeID={`${id}-panel-${item.id}`}
                style={[
                  styles.accordionPanel,
                  { borderTopColor: t.border },
                ]}
              >
                {renderContent ? (
                  renderContent(item)
                ) : item.content ? (
                  <Text
                    style={{
                      fontSize: t.textSm,
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
  readonly maxItems?: number;
  readonly separator?: string;
  readonly onNavigate?: (id: string, item: EmrBreadcrumbItem) => void;
  readonly controlId?: string;
}

export function EmrBreadcrumbs({
  items,
  maxItems,
  separator = '/',
  onNavigate,
  controlId,
}: EmrBreadcrumbsProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-breadcrumbs-${reactId}`;

  const [expandedAll, setExpandedAll] = useState(false);

  const collapsed = collapseBreadcrumbs(
    items,
    expandedAll ? undefined : maxItems
  );

  const renderCrumb = (item: EmrBreadcrumbItem, isCurrent: boolean) => (
    <Pressable
      key={item.id}
      accessibilityRole={isCurrent ? 'text' : 'link'}
      accessibilityState={{
        disabled: Boolean(item.disabled || isCurrent),
        selected: isCurrent,
      }}
      disabled={item.disabled || isCurrent}
      onPress={() => {
        if (!item.disabled && !isCurrent) {
          onNavigate?.(item.id, item);
        }
      }}
      style={styles.crumbHit}
      {...(Platform.OS === 'web' && isCurrent
        ? ({ 'aria-current': 'page' } as Record<string, unknown>)
        : null)}
    >
      <Text
        style={{
          fontSize: t.textSm,
          fontWeight: fontWeight(isCurrent ? t.weightBold : t.weightMedium),
          color: isCurrent ? t.text : t.primary,
          fontFamily: fontFamily(t),
        }}
      >
        {item.label}
      </Text>
    </Pressable>
  );

  const lastId = items[items.length - 1]?.id;

  return (
    <View
      style={styles.breadcrumbsBar}
      {...(Platform.OS === 'web'
        ? ({
            id,
            role: 'navigation',
            'aria-label': 'Breadcrumb',
          } as Record<string, unknown>)
        : null)}
    >
      {collapsed.leading.map((item, idx) => (
        <View key={item.id} style={styles.crumbSegment}>
          {idx > 0 ? (
            <Text
              style={{
                fontSize: t.textXs,
                color: t.textMuted,
                fontFamily: fontFamily(t),
              }}
            >
              {separator}
            </Text>
          ) : null}
          {renderCrumb(item, item.id === lastId)}
        </View>
      ))}

      {collapsed.hidden.length > 0 ? (
        <View style={styles.crumbSegment}>
          <Text
            style={{
              fontSize: t.textXs,
              color: t.textMuted,
              fontFamily: fontFamily(t),
            }}
          >
            {separator}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Show ${collapsed.hidden.length} hidden breadcrumbs`}
            onPress={() => setExpandedAll(true)}
            style={[
              styles.ellipsisBtn,
              {
                backgroundColor: t.surfaceSoft,
                borderColor: t.border,
                borderRadius: 6,
              },
            ]}
          >
            <Text
              style={{
                fontSize: t.textXs,
                fontWeight: fontWeight(t.weightBold),
                color: t.text,
                fontFamily: fontFamily(t),
              }}
            >
              …
            </Text>
          </Pressable>
        </View>
      ) : null}

      {collapsed.trailing.map((item) => (
        <View key={item.id} style={styles.crumbSegment}>
          <Text
            style={{
              fontSize: t.textXs,
              color: t.textMuted,
              fontFamily: fontFamily(t),
            }}
          >
            {separator}
          </Text>
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

export function EmrColorPicker({
  value = null,
  onValueChange,
  swatches = DEFAULT_CLINICAL_COLOR_SWATCHES,
  allowCustomHex = true,
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
}: EmrColorPickerProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-color-picker-${reactId}`;

  const [hexDraft, setHexDraft] = useState(value ?? '');
  useEffect(() => {
    setHexDraft(value ?? '');
  }, [value]);

  const interactive = !disabled && !readOnly;
  const activeHex = normalizeHexColor(value);
  const monoFont = Platform.OS === 'web' ? t.fontMono : undefined;

  const handleSelectSwatch = (hex: string) => {
    if (!interactive) return;
    const normalized = normalizeHexColor(hex) ?? hex;
    setHexDraft(normalized);
    onValueChange?.(normalized);
  };

  const handleHexInputChange = (raw: string) => {
    if (!interactive) return;
    setHexDraft(raw);
    if (!raw.trim()) {
      onValueChange?.(null);
      return;
    }
    const normalized = normalizeHexColor(raw);
    if (normalized) {
      onValueChange?.(normalized);
    }
  };

  const handleClear = () => {
    if (!interactive) return;
    setHexDraft('');
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
      <View style={[styles.colorWrap, { opacity: disabled ? 0.55 : 1 }]}>
        <View style={styles.swatchGrid}>
          {swatches.map((swatch) => {
            const normalizedSwatch = normalizeHexColor(swatch.value) ?? swatch.value;
            const isSelected = activeHex === normalizedSwatch;
            return (
              <Pressable
                key={swatch.value}
                accessibilityRole="button"
                accessibilityLabel={`${swatch.label} (${swatch.value})`}
                accessibilityState={{
                  selected: isSelected,
                  disabled: !interactive,
                }}
                disabled={!interactive}
                onPress={() => handleSelectSwatch(swatch.value)}
                style={[
                  styles.swatchButton,
                  {
                    borderColor: isSelected ? t.primary : t.border,
                    backgroundColor: isSelected ? t.primarySoft : t.surface,
                    borderRadius: 6,
                  },
                ]}
              >
                <View
                  style={[
                    styles.swatchDot,
                    {
                      backgroundColor: swatch.value,
                      borderColor: t.border,
                    },
                  ]}
                />
                <Text
                  style={{
                    fontSize: t.textXs,
                    fontWeight: fontWeight(
                      isSelected ? t.weightBold : t.weightRegular
                    ),
                    color: t.text,
                    fontFamily: fontFamily(t),
                  }}
                >
                  {swatch.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {allowCustomHex ? (
          <View style={styles.hexRow}>
            <View
              style={[
                styles.colorPreviewChip,
                {
                  backgroundColor: activeHex ?? t.surfaceSoft,
                  borderColor: t.border,
                  borderRadius: 6,
                },
              ]}
            />
            <TextInput
              value={hexDraft}
              editable={interactive}
              placeholder="#RRGGBB"
              placeholderTextColor={t.textMuted}
              accessibilityLabel={`${label ?? 'Color'} hex value`}
              onChangeText={handleHexInputChange}
              style={[
                styles.hexInput,
                {
                  fontSize: t.textSm,
                  color: t.text,
                  backgroundColor: readOnly ? t.surfaceSoft : t.surface,
                  borderColor: error ? t.danger : t.border,
                  borderRadius: 6,
                  fontFamily: monoFont,
                },
              ]}
            />
            {clearable && Boolean(value) && interactive ? (
              <EmrButton label="Clear" variant="ghost" onPress={handleClear} />
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
  readonly variant?: 'primary' | 'secondary' | 'ghost';
  readonly disabled?: boolean;
  readonly onCopied?: (value: string) => void;
  readonly controlId?: string;
}

export function EmrCopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  variant = 'secondary',
  disabled = false,
  onCopied,
}: EmrCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (disabled) return;
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
  };

  return (
    <EmrButton
      label={copied ? copiedLabel : label}
      variant={variant}
      disabled={disabled}
      onPress={handleCopy}
    />
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    gap: 4,
  },
  menuSurface: {
    minWidth: 220,
    borderWidth: 1,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
  menuItemRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
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
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 6,
  },
  crumbSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crumbHit: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
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
  swatchButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
  },
  swatchDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
  hexRow: {
    flexDirection: 'row',
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
});
