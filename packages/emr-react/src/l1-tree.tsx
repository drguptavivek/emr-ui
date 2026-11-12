'use client';

import type {
  EmrFlatTreeRow,
  EmrTreeCheckStrategy,
  EmrTreeNode,
} from '@drguptavivek/emr-controller';
import { createElement, useEffect, useId, useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SvgIcon } from './icons';
import { FieldChrome, type FieldValidationLine } from './l1-field-chrome';
import {
  collectAllExpandableTreeIds,
  flattenVisibleTreeNodes,
  formatTreeSelectionLabel,
  resolveTreeNodePath,
  toggleTreeNodeCheck,
} from './l1-wave2.logic';
import { EmrBadgeView, EmrButton } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

export type { EmrFlatTreeRow, EmrTreeCheckStrategy, EmrTreeNode };

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
  /** Controlled or uncontrolled expanded node IDs */
  readonly expandedIds?: readonly string[];
  readonly defaultExpandedIds?: readonly string[];
  readonly onExpandedChange?: (expandedIds: readonly string[]) => void;
  /** Built-in search filter that auto-expands matching ancestor branches */
  readonly searchable?: boolean;
  readonly searchPlaceholder?: string;
  readonly searchQuery?: string;
  readonly onSearchQueryChange?: (query: string) => void;
  /** Expand All / Collapse All toolbar buttons */
  readonly showExpandControls?: boolean;
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
  expandedIds,
  defaultExpandedIds,
  onExpandedChange,
  searchable = false,
  searchPlaceholder = 'Filter hierarchy…',
  searchQuery,
  onSearchQueryChange,
  showExpandControls = false,
  clearable = false,
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
  maxHeight = 320,
  emptyMessage = 'No matching tree items.',
  controlId,
}: EmrTreeViewProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-treeview-${reactId}`;

  const [uncontrolledExpanded, setUncontrolledExpanded] = useState<readonly string[]>(
    () => defaultExpandedIds ?? nodes.slice(0, 2).map((n) => n.id)
  );
  const [uncontrolledQuery, setUncontrolledQuery] = useState('');
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const activeExpanded = expandedIds ?? uncontrolledExpanded;
  const activeQuery = searchQuery !== undefined ? searchQuery : uncontrolledQuery;
  const selectedIds = multiple ? values : value ? [value] : [];

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
    if (!focusedNodeId || !visibleRows.some((r) => r.node.id === focusedNodeId)) {
      const preferred =
        (value && visibleRows.find((r) => r.node.id === value)?.node.id) ??
        visibleRows[0]?.node.id ??
        null;
      setFocusedNodeId(preferred);
    }
  }, [visibleRows, focusedNodeId, value]);

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
    if (readOnly) return;

    if (multiple) {
      if (!row.selectable && checkStrategy === 'leaf' && row.hasChildren) {
        toggleExpand(row.node.id);
        return;
      }
      const next = toggleTreeNodeCheck(nodes, values, row.node.id, checkStrategy);
      onValuesChange?.(next);
      return;
    }

    if (!row.selectable) {
      if (row.hasChildren) {
        toggleExpand(row.node.id);
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
      onValuesChange?.([]);
    } else {
      onValueChange?.(null);
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

  const handleKeyDown = (e: unknown, row: EmrFlatTreeRow, idx: number) => {
    if (disabled) return;
    const ev = e as { key?: string; preventDefault?: () => void };
    const key = ev.key;
    if (!key) return;

    if (key === 'ArrowDown') {
      ev.preventDefault?.();
      const nextRow = visibleRows[Math.min(visibleRows.length - 1, idx + 1)];
      if (nextRow) setFocusedNodeId(nextRow.node.id);
    } else if (key === 'ArrowUp') {
      ev.preventDefault?.();
      const prevRow = visibleRows[Math.max(0, idx - 1)];
      if (prevRow) setFocusedNodeId(prevRow.node.id);
    } else if (key === 'ArrowRight') {
      ev.preventDefault?.();
      if (row.hasChildren && !row.expanded) {
        toggleExpand(row.node.id);
      } else if (row.hasChildren && row.expanded) {
        const firstChild = visibleRows[idx + 1];
        if (firstChild && firstChild.parentId === row.node.id) {
          setFocusedNodeId(firstChild.node.id);
        }
      }
    } else if (key === 'ArrowLeft') {
      ev.preventDefault?.();
      if (row.hasChildren && row.expanded) {
        toggleExpand(row.node.id);
      } else if (row.parentId) {
        setFocusedNodeId(row.parentId);
      }
    } else if (key === 'Home') {
      ev.preventDefault?.();
      if (visibleRows[0]) setFocusedNodeId(visibleRows[0].node.id);
    } else if (key === 'End') {
      ev.preventDefault?.();
      const last = visibleRows[visibleRows.length - 1];
      if (last) setFocusedNodeId(last.node.id);
    } else if (key === 'Enter' || key === ' ') {
      ev.preventDefault?.();
      handleRowSelect(row);
    }
  };

  const hasSelection = multiple ? values.length > 0 : Boolean(value);

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
      <View
        style={[
          styles.container,
          {
            backgroundColor: t.surface,
            borderColor: error ? t.danger : t.border,
            borderRadius: 8,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        {(searchable || showExpandControls || (clearable && hasSelection)) ? (
          <View
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
                  editable={!disabled}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={t.textMuted}
                  accessibilityLabel={searchPlaceholder}
                  style={{
                    flex: 1,
                    minHeight: 36,
                    fontSize: t.textSm,
                    color: t.text,
                    fontFamily: fontFamily(t),
                    paddingVertical: 4,
                  }}
                />
                {activeQuery.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear tree search"
                    onPress={() => updateQuery('')}
                    style={styles.iconHit}
                  >
                    <SvgIcon name="close" size={14} color={t.textMuted} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

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
              {clearable && hasSelection && !readOnly && !disabled ? (
                <EmrButton label="Clear" variant="ghost" onPress={handleClear} />
              ) : null}
            </View>
          </View>
        ) : null}

        <ScrollView
          style={{ maxHeight }}
          contentContainerStyle={styles.treeList}
          {...(Platform.OS === 'web'
            ? ({
                role: 'tree',
                'aria-label': label ?? 'Hierarchical tree',
                'aria-multiselectable': multiple || undefined,
                'aria-readonly': readOnly || undefined,
              } as Record<string, unknown>)
            : null)}
        >
          {visibleRows.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text
                style={{
                  fontSize: t.textSm,
                  color: t.textMuted,
                  fontFamily: fontFamily(t),
                }}
              >
                {emptyMessage}
              </Text>
            </View>
          ) : (
            visibleRows.map((row, idx) => {
              const isSelected = multiple
                ? row.checkState === 'checked'
                : value === row.node.id;
              const isMixed = multiple && row.checkState === 'mixed';
              const isFocused = focusedNodeId === row.node.id;

              return (
                <View
                  key={row.node.id}
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
                      opacity: row.node.disabled ? 0.45 : 1,
                    },
                  ]}
                  {...(Platform.OS === 'web'
                    ? ({
                        role: 'treeitem',
                        'aria-level': row.depth + 1,
                        'aria-expanded': row.hasChildren ? row.expanded : undefined,
                        'aria-selected': isSelected,
                        'aria-checked': multiple
                          ? isMixed
                            ? 'mixed'
                            : isSelected
                          : undefined,
                        'aria-disabled': row.node.disabled || undefined,
                        tabIndex: isFocused ? 0 : -1,
                        onKeyDown: (e: unknown) => handleKeyDown(e, row, idx),
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
                      disabled: Boolean(disabled || row.node.disabled),
                      selected: isSelected,
                      checked: multiple ? (isMixed ? 'mixed' : isSelected) : undefined,
                    }}
                    disabled={disabled || row.node.disabled}
                    onPress={() => handleRowSelect(row)}
                    style={styles.rowBodyHit}
                  >
                    {multiple && (row.selectable || checkStrategy === 'cascade') ? (
                      <View
                        style={[
                          styles.checkboxIndicator,
                          {
                            borderColor:
                              isSelected || isMixed ? t.primary : t.border,
                            backgroundColor:
                              isSelected || isMixed ? t.primary : t.surface,
                          },
                        ]}
                      >
                        {isMixed ? (
                          <SvgIcon name="minus" size={12} color="#ffffff" />
                        ) : isSelected ? (
                          <SvgIcon name="check" size={12} color="#ffffff" />
                        ) : null}
                      </View>
                    ) : null}

                    <View style={styles.rowTextWrap}>
                      <View style={styles.rowTitleLine}>
                        <Text
                          style={{
                            fontSize: t.textSm,
                            fontWeight: fontWeight(
                              isSelected ? t.weightBold : t.weightMedium
                            ),
                            color: isSelected ? t.primaryContrast : t.text,
                            fontFamily: fontFamily(t),
                          }}
                        >
                          {row.node.label}
                        </Text>
                        {row.node.code ? (
                          <EmrBadgeView
                            badge={{ label: row.node.code, tone: 'neutral' }}
                          />
                        ) : null}
                      </View>
                      {row.node.description ? (
                        <Text
                          style={{
                            fontSize: t.textXs,
                            color: t.textMuted,
                            fontFamily: fontFamily(t),
                          }}
                        >
                          {row.node.description}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
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
  readonly placeholder?: string;
  readonly searchable?: boolean;
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

export function EmrTreeSelect({
  nodes,
  value = null,
  onValueChange,
  multiple = false,
  values = [],
  onValuesChange,
  checkStrategy = 'cascade',
  displayMode = 'path',
  placeholder = 'Select from hierarchy…',
  searchable = true,
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
}: EmrTreeSelectProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-treeselect-${reactId}`;

  const [open, setOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<readonly string[]>(() => {
    const initialTarget = multiple ? values[0] : value;
    const trail = resolveTreeNodePath(nodes, initialTarget);
    if (trail.length > 1) {
      return trail.slice(0, -1).map((n) => n.id);
    }
    return nodes.slice(0, 2).map((n) => n.id);
  });
  const wrapRef = useRef<ComponentRef<typeof View> | null>(null);

  useEffect(() => {
    if (!open || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onMouseDown = (ev: MouseEvent) => {
      const el = wrapRef.current as unknown as { contains?: (target: unknown) => boolean } | null;
      if (el && typeof el.contains === 'function' && !el.contains(ev.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const singleDisplay = value
    ? formatTreeSelectionLabel(nodes, value, displayMode) || value
    : '';

  const hasSelection = multiple ? values.length > 0 : Boolean(value);

  const handleRemoveChip = (targetId: string) => {
    if (disabled || readOnly) return;
    const next = values.filter((v) => v !== targetId);
    onValuesChange?.(next);
  };

  const handleClearAll = () => {
    if (disabled || readOnly) return;
    if (multiple) {
      onValuesChange?.([]);
    } else {
      onValueChange?.(null);
    }
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
      <View ref={wrapRef} style={styles.selectWrap}>
        <View
          style={[
            styles.triggerRow,
            {
              minHeight: Math.max(44, t.controlHeight),
              backgroundColor: readOnly ? t.surfaceSoft : t.surface,
              borderColor: error ? t.danger : open ? t.focus : t.border,
              borderRadius: 8,
              opacity: disabled ? 0.55 : 1,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label ?? placeholder}
            accessibilityState={{ expanded: open, disabled }}
            disabled={disabled}
            onPress={() => {
              if (!disabled && !readOnly) {
                setOpen((prev) => !prev);
              }
            }}
            style={styles.triggerMain}
          >
            {multiple ? (
              values.length > 0 ? (
                <View style={styles.chipRow}>
                  {values.map((idItem) => {
                    const text =
                      formatTreeSelectionLabel(nodes, idItem, displayMode) || idItem;
                    return (
                      <View
                        key={idItem}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: t.primarySoft,
                            borderColor: t.primary,
                            borderRadius: 6,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: t.textXs,
                            color: t.primaryContrast,
                            fontWeight: fontWeight(t.weightMedium),
                            fontFamily: fontFamily(t),
                          }}
                        >
                          {text}
                        </Text>
                        {!readOnly && !disabled ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${text}`}
                            onPress={() => handleRemoveChip(idItem)}
                            style={styles.chipRemoveHit}
                          >
                            <SvgIcon name="close" size={12} color={t.primaryContrast} />
                          </Pressable>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text
                  style={{
                    fontSize: t.textSm,
                    color: t.textMuted,
                    fontFamily: fontFamily(t),
                  }}
                >
                  {placeholder}
                </Text>
              )
            ) : singleDisplay ? (
              <Text
                style={{
                  fontSize: t.textSm,
                  color: t.text,
                  fontWeight: fontWeight(t.weightMedium),
                  fontFamily: fontFamily(t),
                }}
              >
                {singleDisplay}
              </Text>
            ) : (
              <Text
                style={{
                  fontSize: t.textSm,
                  color: t.textMuted,
                  fontFamily: fontFamily(t),
                }}
              >
                {placeholder}
              </Text>
            )}
          </Pressable>

          {clearable && hasSelection && !readOnly && !disabled ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Clear ${label ?? 'selection'}`}
              onPress={handleClearAll}
              style={styles.iconHit}
            >
              <SvgIcon name="close" size={15} color={t.textMuted} />
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={open ? 'Close hierarchy picker' : 'Open hierarchy picker'}
            disabled={disabled || readOnly}
            onPress={() => {
              if (!disabled && !readOnly) setOpen((prev) => !prev);
            }}
            style={styles.iconHit}
          >
            <SvgIcon
              name={open ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={t.textMuted}
            />
          </Pressable>
        </View>

        {open && !readOnly && !disabled ? (
          <View
            style={[
              styles.popover,
              {
                backgroundColor: t.surface,
                borderColor: t.border,
                borderRadius: 8,
              },
            ]}
          >
            <EmrTreeView
              nodes={nodes}
              value={value}
              onValueChange={(next) => {
                onValueChange?.(next);
                if (!multiple && next !== null) {
                  setOpen(false);
                }
              }}
              multiple={multiple}
              values={values}
              onValuesChange={onValuesChange}
              checkStrategy={checkStrategy}
              expandedIds={expandedIds}
              onExpandedChange={setExpandedIds}
              searchable={searchable}
              showExpandControls
              clearable={clearable}
              onCleared={onCleared}
              maxHeight={260}
            />
          </View>
        ) : null}

        {Platform.OS === 'web'
          ? createElement('input', {
              type: 'hidden',
              name: id,
              value: multiple ? values.join(',') : (value ?? ''),
            })
          : null}
      </View>
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
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    minHeight: 44,
  },
  toolbarActions: {
    flexDirection: 'row',
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
    width: 28,
    height: 28,
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
  selectWrap: {
    position: 'relative',
    gap: 6,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 4,
  },
  triggerMain: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  chipRemoveHit: {
    padding: 4,
  },
  iconHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popover: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
