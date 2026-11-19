'use client';

import type {
  EmrFlatTreeRow,
  EmrTone,
  EmrTreeCheckStrategy,
  EmrTreeNode,
} from '@drguptavivek/emr-controller';
import { createElement, useEffect, useId, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type PressableStateCallbackType,
} from 'react-native';
import { isEmrIconName, SvgIcon } from './icons';
import { FieldChrome, type FieldValidationLine } from './l1-field-chrome';
import { webProps, type WebKeyEvent } from './l1-interactive-shared';
import {
  buildEmrTreeSelectSummary,
  clearTreeSelection,
  collectAllExpandableTreeIds,
  findNextTreeRowIndex,
  findTypeaheadTreeRowIndex,
  flattenVisibleTreeNodes,
  formatEmrSegmentedBadge,
  isEmrTreeClearable,
  removeTreeSelectionChip,
  resolveDefaultExpandedTreeIds,
  resolveEmrSelectCloseOnSelect,
  resolveEmrTreeSelectDefaultExpanded,
  splitMatchHighlightSegments,
  toggleTreeNodeCheck,
} from './l1-wave2.logic';
import { useEmrLabels } from './labels';
import { EmrButton, resolveButtonPalette } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme, type EmrTheme } from './theme';

export type { EmrFlatTreeRow, EmrTreeCheckStrategy, EmrTreeNode };

type PressState = PressableStateCallbackType & { focused?: boolean; hovered?: boolean };

function withAlpha(color: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function resolveTreeToneColor(t: EmrTheme, tone?: EmrTone): string | undefined {
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

export interface EmrTreeViewProps {
  readonly nodes: readonly EmrTreeNode[];
  /** Single-select active node ID */
  readonly value?: string | null;
  readonly onValueChange?: (value: string | null) => void;
  /** Multi-select checked node IDs */
  readonly multiple?: boolean;
  readonly values?: readonly string[];
  readonly onValuesChange?: (values: readonly string[]) => void;
  readonly checkStrategy?: EmrTreeCheckStrategy;
  readonly maxSelections?: number;
  /** Controlled or uncontrolled expanded node IDs */
  readonly expandedIds?: readonly string[];
  readonly defaultExpandedIds?: readonly string[];
  readonly onExpandedChange?: (expandedIds: readonly string[]) => void;
  /** Built-in search filter that auto-expands matching ancestor branches */
  readonly searchable?: boolean;
  readonly searchPlaceholder?: string;
  readonly searchQuery?: string;
  readonly onSearchQueryChange?: (query: string) => void;
  readonly highlightMatch?: boolean;
  /** Expand All / Collapse All toolbar buttons */
  readonly showExpandControls?: boolean;
  readonly clearable?: boolean;
  readonly clearLabel?: string;
  readonly onCleared?: () => void;
  readonly onNodeSelected?: (node: EmrTreeNode) => void;
  readonly onFocused?: () => void;
  readonly onBlurred?: () => void;
  readonly size?: 'md' | 'sm';
  readonly label?: string;
  readonly labelHidden?: boolean;
  readonly ariaLabel?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly warning?: string;
  readonly info?: string;
  readonly invalid?: boolean;
  readonly messages?: readonly FieldValidationLine[];
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly maxHeight?: number;
  readonly emptyMessage?: string;
  readonly controlId?: string;
}

export function EmrTreeView({
  nodes,
  value = null,
  onValueChange,
  multiple = false,
  values = [],
  onValuesChange,
  checkStrategy = 'cascade',
  maxSelections,
  expandedIds,
  defaultExpandedIds,
  onExpandedChange,
  searchable = false,
  searchPlaceholder = 'Filter hierarchy…',
  searchQuery,
  onSearchQueryChange,
  highlightMatch = true,
  showExpandControls = false,
  clearable = false,
  clearLabel = 'Clear',
  onCleared,
  onNodeSelected,
  onFocused,
  onBlurred,
  size = 'md',
  label,
  labelHidden,
  ariaLabel,
  hint,
  error,
  warning,
  info,
  invalid,
  messages,
  required,
  disabled = false,
  readOnly = false,
  maxHeight = 320,
  emptyMessage = 'No matching tree items.',
  controlId,
}: EmrTreeViewProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-treeview-${reactId}`;

  const [uncontrolledExpanded, setUncontrolledExpanded] = useState<readonly string[]>(() =>
    resolveDefaultExpandedTreeIds(nodes, defaultExpandedIds),
  );
  const [uncontrolledQuery, setUncontrolledQuery] = useState('');
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, { focus?: () => void } | null>>({});
  const typeaheadRef = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | null }>({
    buffer: '',
    timer: null,
  });
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

  const activeExpanded = expandedIds ?? uncontrolledExpanded;
  const activeQuery = searchQuery !== undefined ? searchQuery : uncontrolledQuery;
  const selectedIds = multiple ? values : value ? [value] : [];
  const isInvalid = Boolean(invalid || error);
  const isWarning = Boolean(!isInvalid && warning);
  const isSm = size === 'sm';
  const hasMessage = Boolean(!labelHidden && (hint || warning || error));

  const updateExpanded = (next: readonly string[]) => {
    if (expandedIds === undefined) {
      setUncontrolledExpanded(next);
    }
    onExpandedChange?.(next);
  };

  const updateQuery = (next: string) => {
    if (searchQuery === undefined) {
      setUncontrolledQuery(next);
    }
    onSearchQueryChange?.(next);
  };

  const visibleRows = flattenVisibleTreeNodes(nodes, activeExpanded, {
    searchQuery: activeQuery,
    selectedIds,
    checkStrategy,
  });

  useEffect(() => {
    if (visibleRows.length === 0) {
      setFocusedNodeId(null);
      return;
    }
    if (!focusedNodeId || !visibleRows.some((r) => r.node.id === focusedNodeId && !r.node.disabled)) {
      const preferred =
        (value && visibleRows.find((r) => r.node.id === value && !r.node.disabled)?.node.id) ??
        visibleRows.find((r) => !r.node.disabled)?.node.id ??
        visibleRows[0]?.node.id ??
        null;
      setFocusedNodeId(preferred);
    }
  }, [visibleRows, focusedNodeId, value]);

  const focusNode = (nodeId: string) => {
    setFocusedNodeId(nodeId);
    if (Platform.OS === 'web') {
      rowRefs.current[nodeId]?.focus?.();
    }
  };

  const toggleExpand = (nodeId: string) => {
    if (disabled) return;
    const exists = activeExpanded.includes(nodeId);
    const next = exists
      ? activeExpanded.filter((item) => item !== nodeId)
      : [...activeExpanded, nodeId];
    updateExpanded(next);
  };

  const handleRowSelect = (row: EmrFlatTreeRow) => {
    if (disabled || row.node.disabled) return;
    setFocusedNodeId(row.node.id);
    if (!row.selectable && row.hasChildren && checkStrategy !== 'cascade') {
      toggleExpand(row.node.id);
      return;
    }
    if (readOnly || row.node.readOnly) return;
    onNodeSelected?.(row.node);

    if (multiple) {
      const next = toggleTreeNodeCheck(nodes, values, row.node.id, checkStrategy, maxSelections);
      if (next !== values) {
        onValuesChange?.(next);
      }
      return;
    }

    const nextVal = value === row.node.id && clearable ? null : row.node.id;
    onValueChange?.(nextVal);
    if (nextVal === null) onCleared?.();
  };

  const handleClear = () => {
    if (disabled || readOnly) return;
    if (multiple) {
      const next = clearTreeSelection(nodes, values);
      onValuesChange?.(next);
    } else {
      const kept = value ? clearTreeSelection(nodes, [value]) : [];
      onValueChange?.(kept[0] ?? null);
    }
    onCleared?.();
  };

  const handleExpandAll = () => {
    if (disabled) return;
    updateExpanded(collectAllExpandableTreeIds(nodes));
  };

  const handleCollapseAll = () => {
    if (disabled) return;
    updateExpanded([]);
  };

  const handleKeyDown = (
    e: WebKeyEvent & { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean },
    row: EmrFlatTreeRow,
    idx: number,
  ) => {
    if (disabled) return;
    const key = e.key ?? '';
    if (!key) return;

    if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
      e.preventDefault?.();
      const nextIdx = findNextTreeRowIndex(visibleRows, idx, key);
      if (nextIdx >= 0) focusNode(visibleRows[nextIdx]!.node.id);
      return;
    }
    if (key === 'ArrowRight') {
      e.preventDefault?.();
      if (row.hasChildren && !row.expanded) {
        toggleExpand(row.node.id);
      } else if (row.hasChildren && row.expanded) {
        const nextIdx = findNextTreeRowIndex(visibleRows, idx, 'ArrowDown');
        if (nextIdx > idx && visibleRows[nextIdx]!.depth > row.depth) {
          focusNode(visibleRows[nextIdx]!.node.id);
        }
      }
      return;
    }
    if (key === 'ArrowLeft') {
      e.preventDefault?.();
      if (row.hasChildren && row.expanded) {
        toggleExpand(row.node.id);
      } else if (row.parentId) {
        const parentRow = visibleRows.find((r) => r.node.id === row.parentId);
        if (parentRow && !parentRow.node.disabled) {
          focusNode(parentRow.node.id);
        }
      }
      return;
    }
    if (key === 'Enter' || key === ' ') {
      e.preventDefault?.();
      handleRowSelect(row);
      return;
    }
    if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      typeaheadRef.current.buffer += key;
      if (typeaheadRef.current.timer) clearTimeout(typeaheadRef.current.timer);
      typeaheadRef.current.timer = setTimeout(() => {
        typeaheadRef.current.buffer = '';
        typeaheadRef.current.timer = null;
      }, 500);
      const matchIdx = findTypeaheadTreeRowIndex(visibleRows, typeaheadRef.current.buffer, idx);
      if (matchIdx >= 0) focusNode(visibleRows[matchIdx]!.node.id);
    }
  };

  const canClear = isEmrTreeClearable({
    clearable,
    disabled,
    readOnly,
    multiple,
    value,
    values,
    nodes,
  });

  const renderHighlighted = (
    text: string,
    baseStyle: Record<string, unknown>,
    numberOfLines?: number,
  ) => {
    const segments =
      highlightMatch && activeQuery
        ? splitMatchHighlightSegments(text, activeQuery)
        : [{ text, matched: false }];
    return (
      <Text numberOfLines={numberOfLines} style={baseStyle}>
        {segments.map((seg, i) =>
          seg.matched ? (
            <Text
              key={i}
              style={{
                backgroundColor: t.primarySoft,
                color: t.primaryContrast,
                fontWeight: fontWeight(t.weightBold),
              }}
            >
              {seg.text}
            </Text>
          ) : (
            seg.text
          ),
        )}
      </Text>
    );
  };

  const containerNode = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: readOnly ? t.surfaceSoft : t.surface,
          borderColor: isInvalid ? t.danger : isWarning ? t.warning : t.border,
          borderStyle: readOnly ? 'dashed' : 'solid',
          borderRadius: 8,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      {(searchable || (!labelHidden && (showExpandControls || canClear))) ? (
        <View
          {...(Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : {})}
          style={[
            styles.toolbar,
            {
              borderBottomColor: t.border,
              backgroundColor: t.surfaceSoft,
            },
          ]}
        >
          {searchable ? (
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: t.surface,
                  borderColor: t.border,
                  borderRadius: 6,
                },
              ]}
            >
              <SvgIcon name="search" size={15} color={t.textMuted} />
              <TextInput
                value={activeQuery}
                onChangeText={updateQuery}
                onFocus={handleChildFocus}
                onBlur={handleChildBlur}
                editable={!disabled}
                placeholder={searchPlaceholder}
                placeholderTextColor={t.textMuted}
                accessibilityLabel={searchPlaceholder}
                {...webProps({
                  onKeyDown: (e: WebKeyEvent) => {
                    if (e.key === 'ArrowDown') {
                      const firstIdx = findNextTreeRowIndex(visibleRows, -1, 'ArrowDown');
                      if (firstIdx >= 0) {
                        e.preventDefault();
                        focusNode(visibleRows[firstIdx]!.node.id);
                      }
                    }
                  },
                })}
                style={{
                  flex: 1,
                  minHeight: 36,
                  fontSize: isSm ? t.textSm : t.textMd,
                  color: t.text,
                  fontFamily: fontFamily(t),
                  paddingVertical: 4,
                }}
              />
              {activeQuery.length > 0 && !disabled ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear tree search"
                  onFocus={handleChildFocus}
                  onBlur={handleChildBlur}
                  onPress={() => updateQuery('')}
                  style={({ focused }: PressState) => [styles.iconHit, focusRing(t, focused)]}
                >
                  <SvgIcon name="close" size={14} color={t.textMuted} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {!labelHidden && (showExpandControls || canClear) ? (
            <View style={styles.toolbarActions}>
              {showExpandControls ? (
                <>
                  <EmrButton
                    label="Expand all"
                    variant="ghost"
                    disabled={disabled}
                    onPress={handleExpandAll}
                  />
                  <EmrButton
                    label="Collapse all"
                    variant="ghost"
                    disabled={disabled}
                    onPress={handleCollapseAll}
                  />
                </>
              ) : null}
              {canClear ? (
                <EmrButton label={clearLabel} variant="ghost" onPress={handleClear} />
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      <ScrollView
        style={{ maxHeight }}
        contentContainerStyle={styles.treeList}
        {...(Platform.OS === 'web'
          ? ({
              id,
              role: 'tree',
              'aria-labelledby': !ariaLabel && label && !labelHidden ? `${id}-label` : undefined,
              'aria-label': ariaLabel ?? (label || 'Hierarchical tree'),
              'aria-multiselectable': multiple || undefined,
              'aria-required': required || undefined,
              'aria-readonly': readOnly || undefined,
              'aria-invalid': isInvalid || undefined,
              'aria-describedby': hasMessage ? `${id}-message` : undefined,
              dataSet: { 'emr-print': 'expand' },
            } as Record<string, unknown>)
          : null)}
      >
        {visibleRows.length === 0 ? (
          <View style={styles.emptyBox} role="status">
            <Text
              style={{
                fontSize: isSm ? t.textSm : t.textMd,
                color: t.textMuted,
                fontFamily: fontFamily(t),
              }}
            >
              {emptyMessage}
            </Text>
          </View>
        ) : (
          visibleRows.map((row, idx) => {
            const isSelected = multiple ? row.checkState === 'checked' : value === row.node.id;
            const isMixed = multiple && row.checkState === 'mixed';
            const isFocused = focusedNodeId === row.node.id;
            const rowDisabled = Boolean(disabled || row.node.disabled);
            const rowReadOnly = Boolean(readOnly || row.node.readOnly);
            const showCheckbox = multiple && (row.selectable || checkStrategy === 'cascade');
            const badge = formatEmrSegmentedBadge(row.node.badge, row.node.tone);
            const toneColor = resolveTreeToneColor(t, row.node.tone);

            return (
              <View
                key={row.node.id}
                ref={(el: { focus?: () => void } | null) => {
                  rowRefs.current[row.node.id] = el;
                }}
                style={[
                  styles.treeRow,
                  {
                    paddingLeft: 8 + row.depth * 20,
                    backgroundColor: isSelected
                      ? t.primarySoft
                      : isFocused
                        ? t.surfaceSoft
                        : 'transparent',
                    borderRadius: 6,
                    borderWidth: row.node.readOnly ? 1 : 0,
                    borderStyle: row.node.readOnly ? 'dashed' : 'solid',
                    borderColor: row.node.readOnly ? t.border : 'transparent',
                    opacity: row.node.disabled ? 0.45 : 1,
                  },
                ]}
                {...(Platform.OS === 'web'
                  ? ({
                      role: 'treeitem',
                      'aria-level': row.depth + 1,
                      'aria-expanded': row.hasChildren ? row.expanded : undefined,
                      'aria-selected': isSelected,
                      'aria-checked': showCheckbox ? (isMixed ? 'mixed' : isSelected) : undefined,
                      'aria-readonly': rowReadOnly || undefined,
                      'aria-disabled': rowDisabled || undefined,
                      tabIndex: rowDisabled ? -1 : (isFocused ? 0 : -1),
                      onFocus: () => {
                        setFocusedNodeId(row.node.id);
                        handleChildFocus();
                      },
                      onBlur: handleChildBlur,
                      onKeyDown: (e: WebKeyEvent) => handleKeyDown(e, row, idx),
                    } as Record<string, unknown>)
                  : null)}
              >
                {row.hasChildren ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      row.expanded ? `Collapse ${row.node.label}` : `Expand ${row.node.label}`
                    }
                    disabled={disabled}
                    onPress={() => toggleExpand(row.node.id)}
                    {...(Platform.OS === 'web' ? ({ tabIndex: -1 } as object) : {})}
                    style={styles.chevronBtn}
                  >
                    <SvgIcon
                      name={row.expanded ? 'chevron-down' : 'chevron-right'}
                      size={16}
                      color={t.textMuted}
                    />
                  </Pressable>
                ) : (
                  <View style={styles.chevronSpacer} />
                )}

                <Pressable
                  accessibilityRole={multiple ? 'checkbox' : 'button'}
                  accessibilityState={{
                    disabled: rowDisabled,
                    selected: isSelected,
                    checked: showCheckbox ? (isMixed ? 'mixed' : isSelected) : undefined,
                  }}
                  disabled={rowDisabled}
                  onPress={() => handleRowSelect(row)}
                  {...(Platform.OS === 'web' ? ({ tabIndex: -1 } as object) : {})}
                  style={styles.rowBodyHit}
                >
                  {showCheckbox ? (
                    <View
                      style={[
                        styles.checkboxIndicator,
                        {
                          borderColor: isSelected || isMixed ? t.primary : t.border,
                          backgroundColor: isSelected || isMixed ? t.primary : t.surface,
                        },
                      ]}
                    >
                      {isMixed ? (
                        <SvgIcon name="minus" size={12} color={t.surface} />
                      ) : isSelected ? (
                        <SvgIcon name="check" size={12} color={t.surface} />
                      ) : null}
                    </View>
                  ) : null}

                  {row.node.icon && isEmrIconName(row.node.icon) ? (
                    <SvgIcon
                      name={row.node.icon}
                      size={15}
                      color={isSelected ? t.primary : (toneColor ?? t.textMuted)}
                    />
                  ) : null}

                  <View style={styles.rowTextWrap}>
                    <View style={styles.rowTitleLine}>
                      {renderHighlighted(row.node.label, {
                        fontSize: isSm ? t.textSm : t.textMd,
                        fontWeight: fontWeight(isSelected ? t.weightBold : t.weightMedium),
                        color: isSelected ? t.primaryContrast : t.text,
                        fontFamily: fontFamily(t),
                      })}
                      {row.node.code ? (
                        <View
                          style={[
                            styles.codePill,
                            { backgroundColor: t.neutralSoft, borderColor: t.border },
                          ]}
                        >
                          {renderHighlighted(row.node.code, {
                            fontSize: t.textXs,
                            color: t.textMuted,
                            fontFamily: fontFamily(t),
                            fontWeight: fontWeight(t.weightMedium),
                          })}
                        </View>
                      ) : null}
                      {row.node.readOnly ? (
                        <SvgIcon name="lock" size={12} color={t.textMuted} />
                      ) : null}
                      {badge ? (
                        <View
                          style={[
                            styles.codePill,
                            {
                              backgroundColor: withAlpha(
                                resolveTreeToneColor(t, badge.tone) ?? t.textMuted,
                                0.14,
                              ),
                              borderColor: resolveTreeToneColor(t, badge.tone) ?? t.border,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: t.text2xs,
                              color: resolveTreeToneColor(t, badge.tone) ?? t.textMuted,
                              fontWeight: fontWeight(t.weightBold),
                              fontFamily: fontFamily(t),
                            }}
                          >
                            {badge.text}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {row.node.description
                      ? renderHighlighted(row.node.description, {
                          fontSize: t.textXs,
                          color: t.textMuted,
                          fontFamily: fontFamily(t),
                        })
                      : null}
                  </View>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );

  if (!label && !hint && !warning && !error && !info && !messages?.length) {
    return containerNode;
  }

  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={!label || labelHidden}
      hint={labelHidden ? undefined : hint}
      error={labelHidden ? undefined : error}
      warning={labelHidden ? undefined : warning}
      info={labelHidden ? undefined : info}
      messages={labelHidden ? undefined : messages}
      required={required}
    >
      {containerNode}
    </FieldChrome>
  );
}

export interface EmrTreeSelectProps {
  readonly nodes: readonly EmrTreeNode[];
  readonly value?: string | null;
  readonly onValueChange?: (value: string | null) => void;
  readonly multiple?: boolean;
  readonly values?: readonly string[];
  readonly onValuesChange?: (values: readonly string[]) => void;
  readonly checkStrategy?: EmrTreeCheckStrategy;
  readonly displayMode?: 'path' | 'leaf';
  readonly separator?: string;
  readonly closeOnSelect?: boolean;
  readonly maxTagCount?: number;
  readonly maxSelections?: number;
  readonly expandedIds?: readonly string[];
  readonly defaultExpandedIds?: readonly string[];
  readonly onExpandedChange?: (expandedIds: readonly string[]) => void;
  readonly placeholder?: string;
  readonly searchable?: boolean;
  readonly searchPlaceholder?: string;
  readonly showExpandControls?: boolean;
  readonly clearable?: boolean;
  readonly clearLabel?: string;
  readonly onCleared?: () => void;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly variant?: 'outline' | 'filled' | 'subtle';
  readonly size?: 'md' | 'sm';
  readonly loading?: boolean;
  readonly emptyMessage?: string;
  readonly label?: string;
  readonly labelHidden?: boolean;
  readonly ariaLabel?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly warning?: string;
  readonly info?: string;
  readonly invalid?: boolean;
  readonly messages?: readonly FieldValidationLine[];
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly controlId?: string;
  readonly onFocused?: () => void;
  readonly onBlurred?: () => void;
}

export function EmrTreeSelect({
  nodes,
  value = null,
  onValueChange,
  multiple = false,
  values = [],
  onValuesChange,
  checkStrategy = 'cascade',
  displayMode = 'path',
  separator = ' / ',
  closeOnSelect,
  maxTagCount,
  maxSelections,
  expandedIds: controlledExpandedIds,
  defaultExpandedIds,
  onExpandedChange,
  placeholder = 'Select item…',
  searchable = true,
  searchPlaceholder = 'Filter options…',
  showExpandControls = false,
  clearable = false,
  clearLabel,
  onCleared,
  open: controlledOpen,
  onOpenChange,
  variant = 'outline',
  size = 'md',
  loading = false,
  emptyMessage = 'No matching items',
  label,
  labelHidden,
  ariaLabel,
  hint,
  error,
  warning,
  info,
  invalid,
  messages,
  required,
  disabled = false,
  readOnly = false,
  controlId,
  onFocused,
  onBlurred,
}: EmrTreeSelectProps) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const { width: winW, height: winH } = useWindowDimensions();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-treeselect-${reactId}`;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const [uncontrolledExpanded, setUncontrolledExpanded] = useState<readonly string[]>(() =>
    resolveEmrTreeSelectDefaultExpanded(nodes, value, values, defaultExpandedIds),
  );
  const activeExpanded = controlledExpandedIds ?? uncontrolledExpanded;

  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const triggerWrapRef = useRef<ComponentRef<typeof View> | null>(null);
  const triggerBtnRef = useRef<ComponentRef<typeof Pressable> | null>(null);

  const setOpen = (next: boolean, restoreFocus = false) => {
    if (next && (disabled || readOnly)) return;
    if (controlledOpen === undefined) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
    if (!next && restoreFocus && Platform.OS === 'web') {
      setTimeout(() => {
        (triggerBtnRef.current as unknown as { focus?: () => void } | null)?.focus?.();
      }, 0);
    }
  };

  useEffect(() => {
    if (!open || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        setOpen(false, true);
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open]);

  const openDropdown = () => {
    if (readOnly || disabled) return;
    if (triggerWrapRef.current && typeof triggerWrapRef.current.measureInWindow === 'function') {
      triggerWrapRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) setAnchor({ x, y, width, height });
        else setAnchor(null);
        setOpen(true);
      });
    } else {
      setAnchor(null);
      setOpen(true);
    }
  };

  const summary = buildEmrTreeSelectSummary({
    nodes,
    multiple,
    value,
    values,
    displayMode,
    separator,
    placeholder,
    maxTagCount,
  });

  const canClear = isEmrTreeClearable({
    clearable,
    disabled,
    readOnly,
    multiple,
    value,
    values,
    nodes,
  });

  const handleRemoveChip = (targetId: string) => {
    if (disabled || readOnly) return;
    const next = removeTreeSelectionChip(nodes, values, targetId, checkStrategy);
    if (next !== values) {
      onValuesChange?.(next);
    }
  };

  const handleClearAll = () => {
    if (disabled || readOnly) return;
    if (multiple) {
      const next = clearTreeSelection(nodes, values);
      onValuesChange?.(next);
    } else {
      const kept = value ? clearTreeSelection(nodes, [value]) : [];
      onValueChange?.(kept[0] ?? null);
    }
    onCleared?.();
  };

  const isInvalid = Boolean(invalid || error);
  const isWarning = Boolean(!isInvalid && warning);
  const isSm = size === 'sm';
  const minHeight = Math.max(44, t.controlHeight);
  const hasMessage = Boolean(!labelHidden && (hint || warning || error));
  const baseAriaLabel = (ariaLabel ?? '').trim() || label || placeholder;

  const useAnchoredMenu = Boolean(anchor && winW >= 520);
  const menuMaxH = 340;
  const menuWidth = anchor ? Math.min(Math.max(anchor.width, 240), Math.max(240, winW - 24)) : 320;
  const flipUp = Boolean(anchor && anchor.y + anchor.height + menuMaxH + 12 > winH && anchor.y > menuMaxH);
  const anchoredLeft = anchor ? Math.max(12, Math.min(anchor.x, winW - menuWidth - 12)) : 0;
  const anchoredTop = anchor
    ? flipUp
      ? Math.max(12, anchor.y - menuMaxH - 4)
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

  const treeSelectControl = (
    <View ref={triggerWrapRef} collapsable={false} style={styles.selectWrap}>
      <View
        style={[
          styles.selectShell,
          {
            minHeight,
            backgroundColor: shellBg,
            borderColor: shellBorder,
            borderStyle: readOnly ? 'dashed' : 'solid',
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        {multiple && (summary.visibleChips.length > 0 || summary.overflowCount > 0) ? (
          <View style={styles.selectChips} aria-label={`${baseAriaLabel} selected items`}>
            {summary.visibleChips.map((chip) => {
              const chipLocked = Boolean(readOnly || disabled || chip.readOnly || chip.disabled);
              return (
                <View
                  key={chip.id}
                  style={[
                    styles.selectChip,
                    {
                      backgroundColor: t.surfaceSoft,
                      borderColor: t.border,
                      borderStyle: chip.readOnly ? 'dashed' : 'solid',
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: t.textXs,
                      color: t.text,
                      fontWeight: fontWeight(t.weightMedium),
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {chip.label}
                  </Text>
                  {chip.readOnly ? (
                    <SvgIcon name="lock" size={11} color={t.textMuted} />
                  ) : !chipLocked ? (
                    <Pressable
                      role="button"
                      aria-label={`Remove ${chip.label}`}
                      onPress={() => handleRemoveChip(chip.id)}
                      style={({ focused }: PressState) => [styles.selectChipRemove, focusRing(t, focused)]}
                    >
                      <SvgIcon name="close" size={12} color={t.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
            {summary.overflowCount > 0 ? (
              <View style={[styles.selectChip, { backgroundColor: t.surfaceSoft, borderColor: t.border }]}>
                <Text
                  style={{
                    color: t.textMuted,
                    fontSize: t.textXs,
                    fontFamily: fontFamily(t),
                    fontWeight: fontWeight(t.weightMedium),
                  }}
                >
                  +{summary.overflowCount}
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
          aria-haspopup="tree"
          aria-controls={open ? `${id}-panel` : undefined}
          aria-busy={loading ? true : undefined}
          aria-label={`${baseAriaLabel}, ${summary.text}`}
          aria-describedby={hasMessage ? `${id}-message` : undefined}
          aria-invalid={isInvalid || undefined}
          aria-required={required || undefined}
          aria-readonly={readOnly || undefined}
          aria-disabled={disabled || undefined}
          disabled={disabled}
          onPress={
            readOnly
              ? undefined
              : () => {
                  if (open) setOpen(false, true);
                  else openDropdown();
                }
          }
          onFocus={() => onFocused?.()}
          onBlur={() => onBlurred?.()}
          {...webProps({
            onKeyDown: (e: WebKeyEvent) => {
              if (disabled || readOnly) return;
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
                if (!open) {
                  e.preventDefault();
                  openDropdown();
                }
              } else if (e.key === 'Escape' && open) {
                e.preventDefault();
                setOpen(false, true);
              }
            },
          })}
          style={({ hovered, focused }: PressState) => [
            styles.selectTrigger,
            focusRing(t, focused),
            {
              minHeight: Math.max(44, minHeight),
              backgroundColor: hovered && !disabled && !readOnly ? t.surfaceSoft : undefined,
            },
          ]}
        >
          {!multiple || (summary.visibleChips.length === 0 && summary.overflowCount === 0) ? (
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: isSm ? t.textSm : t.textMd,
                color: summary.hasSelection ? t.text : t.textMuted,
                fontWeight: fontWeight(summary.hasSelection ? t.weightMedium : t.weightRegular),
                fontFamily: fontFamily(t),
              }}
            >
              {summary.text}
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
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
            onPress={handleClearAll}
            style={({ pressed, focused }: PressState) => [
              styles.iconHit,
              focusRing(t, focused),
              {
                borderLeftWidth: 1,
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
        visible={open && !readOnly && !disabled}
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
          <Pressable
            id={`${id}-panel`}
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
                    borderRadius: 10,
                    padding: 6,
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
            {!useAnchoredMenu && label ? (
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
            <EmrTreeView
              nodes={nodes}
              value={value}
              onValueChange={(next) => {
                onValueChange?.(next);
                if (resolveEmrSelectCloseOnSelect(multiple, closeOnSelect)) {
                  setOpen(false, true);
                }
              }}
              multiple={multiple}
              values={values}
              onValuesChange={(next) => {
                onValuesChange?.(next);
                if (resolveEmrSelectCloseOnSelect(multiple, closeOnSelect)) {
                  setOpen(false, true);
                }
              }}
              checkStrategy={checkStrategy}
              maxSelections={maxSelections}
              expandedIds={activeExpanded}
              onExpandedChange={(next) => {
                if (controlledExpandedIds === undefined) setUncontrolledExpanded(next);
                onExpandedChange?.(next);
              }}
              searchable={searchable}
              searchPlaceholder={searchPlaceholder}
              showExpandControls={showExpandControls}
              clearable={clearable}
              clearLabel={clearLabel}
              onCleared={onCleared}
              size={size}
              emptyMessage={emptyMessage}
              maxHeight={useAnchoredMenu ? 260 : 300}
            />
            {!useAnchoredMenu ? (
              <View style={[styles.sheetFooter, { borderTopColor: t.border }]}>
                {canClear ? (
                  <Pressable
                    role="button"
                    onPress={handleClearAll}
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

      {Platform.OS === 'web'
        ? createElement('input', {
            type: 'hidden',
            name: id,
            value: multiple ? values.join(',') : (value ?? ''),
          })
        : null}
    </View>
  );

  if (!label && !hint && !warning && !error && !info && !messages?.length) {
    return treeSelectControl;
  }

  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={!label || labelHidden}
      hint={labelHidden ? undefined : hint}
      error={labelHidden ? undefined : error}
      warning={labelHidden ? undefined : warning}
      info={labelHidden ? undefined : info}
      messages={labelHidden ? undefined : messages}
      required={required}
    >
      {treeSelectControl}
    </FieldChrome>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchBox: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    minHeight: 44,
  },
  toolbarActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  treeList: {
    padding: 6,
    gap: 2,
  },
  emptyBox: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  treeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingRight: 8,
  },
  chevronBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronSpacer: {
    width: 44,
    height: 44,
  },
  rowBodyHit: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  checkboxIndicator: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: {
    flex: 1,
    gap: 2,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  codePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  selectWrap: {
    position: 'relative',
    gap: 6,
  },
  selectShell: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingVertical: 6,
    maxWidth: '80%',
  },
  selectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 28,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 999,
    maxWidth: '100%',
  },
  selectChipRemove: {
    minWidth: 24,
    minHeight: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectTrigger: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anchoredBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: 16,
    maxHeight: '82%',
    gap: 12,
  },
  sheetTitle: {
    marginBottom: 4,
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  sheetFooterBtn: {
    minHeight: 44,
    minWidth: 88,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
