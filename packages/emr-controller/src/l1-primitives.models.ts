import type {
  ClinicalAssessmentStatus,
  EmrBadge,
  EmrBadgeShape,
  EmrBadgeSize,
  EmrBadgeVariant,
  EmrOption,
  EmrTone,
} from './models.js';
import type { ClinicalAssessmentStatusOption } from './clinical-form.models.js';
import type { EmrFieldDefinition } from './field-contract.models.js';
import type { EmrValidationMessage } from './validation.models.js';
import type { EmrFileSelectionItem, FieldFrameLayout } from './l2-fields.models.js';

// ─────────────────────────────────────────────────────────────
// 1. Option Grouping, Local Filtering & Choice Group Logic
// ─────────────────────────────────────────────────────────────

export interface EmrOptionGroup<Value extends string = string> {
  readonly label: string | null;
  readonly options: readonly EmrOption<Value>[];
}

export function groupOptions<Value extends string = string>(
  options: readonly EmrOption<Value>[]
): readonly EmrOptionGroup<Value>[] {
  const ungrouped: EmrOption<Value>[] = [];
  const groups = new Map<string, EmrOption<Value>[]>();
  for (const opt of options) {
    const g = opt.group?.trim();
    if (!g) {
      ungrouped.push(opt);
    } else {
      const bucket = groups.get(g);
      if (bucket) bucket.push(opt);
      else groups.set(g, [opt]);
    }
  }
  const result: EmrOptionGroup<Value>[] = [];
  if (ungrouped.length > 0) {
    result.push({ label: null, options: ungrouped });
  }
  for (const [label, items] of groups.entries()) {
    result.push({ label, options: items });
  }
  return result;
}

export function filterOptionsLocally<Value extends string = string>(
  options: readonly EmrOption<Value>[],
  query: string | null | undefined
): readonly EmrOption<Value>[] {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return options;
  return options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(q) ||
      opt.value.toLowerCase().includes(q) ||
      (opt.description?.toLowerCase().includes(q) ?? false) ||
      (opt.group?.toLowerCase().includes(q) ?? false)
  );
}

export type EmrSelectAllState = 'none' | 'mixed' | 'all';
export type EmrCheckboxGroupVariant = 'tile' | 'inline' | 'card' | 'chip';
export type EmrCheckboxGroupOrientation = 'vertical' | 'horizontal' | 'grid';
export type EmrCheckboxGroupSize = EmrCheckboxSize;
export type EmrCheckboxGroupLabelPlacement = EmrCheckboxLabelPlacement;

export interface EmrCheckboxGroupSelectionValidation {
  readonly valid: boolean;
  readonly count: number;
  readonly minViolated: boolean;
  readonly maxViolated: boolean;
  readonly message: string | null;
}

export interface EmrCheckboxGroupToggleOptions {
  readonly exclusiveValues?: readonly string[];
  readonly maxSelections?: number;
}

export function normalizeCheckboxGroupVariant(variant?: unknown): EmrCheckboxGroupVariant {
  if (variant === 'inline' || variant === 'card' || variant === 'chip') {
    return variant;
  }
  return 'tile';
}

export function isCheckboxOptionLocked(option: EmrOption): boolean {
  return Boolean(option.disabled || option.readOnly);
}

export function isCheckboxOptionBlockedByMax(
  optionValue: string,
  current: readonly string[],
  maxSelections?: number
): boolean {
  if (typeof maxSelections !== 'number' || !Number.isFinite(maxSelections) || maxSelections < 1) {
    return false;
  }
  if (current.includes(optionValue)) {
    return false;
  }
  return current.length >= Math.trunc(maxSelections);
}

export function clearCheckboxGroupValue(
  current: readonly string[],
  options: readonly EmrOption[]
): readonly string[] {
  const currentSet = new Set(current);
  return options
    .filter((o) => isCheckboxOptionLocked(o) && currentSet.has(o.value))
    .map((o) => o.value);
}

export function validateCheckboxGroupSelection(
  current: readonly string[],
  minSelections?: number,
  maxSelections?: number
): EmrCheckboxGroupSelectionValidation {
  const count = current.length;
  const min =
    typeof minSelections === 'number' && Number.isFinite(minSelections) && minSelections > 0
      ? Math.trunc(minSelections)
      : null;
  const max =
    typeof maxSelections === 'number' && Number.isFinite(maxSelections) && maxSelections > 0
      ? Math.trunc(maxSelections)
      : null;
  const minViolated = min !== null && count < min;
  const maxViolated = max !== null && count > max;
  let message: string | null = null;
  if (minViolated) {
    message = min === 1 ? 'Select at least 1 option.' : `Select at least ${min} options.`;
  } else if (maxViolated) {
    message = max === 1 ? 'Select at most 1 option.' : `Select at most ${max} options.`;
  }
  return {
    valid: !minViolated && !maxViolated,
    count,
    minViolated,
    maxViolated,
    message,
  };
}

export function formatCheckboxSelectionCount(
  current: readonly string[],
  maxSelections?: number
): string {
  const count = current.length;
  if (typeof maxSelections === 'number' && Number.isFinite(maxSelections) && maxSelections >= 1) {
    return `${count} of ${Math.trunc(maxSelections)} selected`;
  }
  return `${count} selected`;
}

function resolveCheckboxToggleOptions(
  exclusiveOrOptions?: readonly string[] | EmrCheckboxGroupToggleOptions
): { exclusiveSet: Set<string>; maxSelections?: number } {
  if (Array.isArray(exclusiveOrOptions)) {
    return { exclusiveSet: new Set(exclusiveOrOptions) };
  }
  if (exclusiveOrOptions && typeof exclusiveOrOptions === 'object') {
    const opts = exclusiveOrOptions as EmrCheckboxGroupToggleOptions;
    return {
      exclusiveSet: new Set(opts.exclusiveValues ?? []),
      maxSelections: opts.maxSelections,
    };
  }
  return { exclusiveSet: new Set() };
}

export function computeSelectAllState(
  current: readonly string[],
  options: readonly EmrOption[],
  exclusiveValues: readonly string[] = []
): EmrSelectAllState {
  const exclusiveSet = new Set(exclusiveValues);
  const selectable = options
    .filter((o) => !isCheckboxOptionLocked(o) && !exclusiveSet.has(o.value))
    .map((o) => o.value);
  if (selectable.length === 0) return 'none';
  const currentSet = new Set(current);
  let count = 0;
  for (const v of selectable) {
    if (currentSet.has(v)) count += 1;
  }
  if (count === 0) return 'none';
  if (count === selectable.length) return 'all';
  return 'mixed';
}

export function toggleSelectAllValues(
  current: readonly string[],
  options: readonly EmrOption[],
  exclusiveOrOptions: readonly string[] | EmrCheckboxGroupToggleOptions = []
): readonly string[] {
  const { exclusiveSet, maxSelections } = resolveCheckboxToggleOptions(exclusiveOrOptions);
  const state = computeSelectAllState(current, options, [...exclusiveSet]);
  const currentSet = new Set(current);
  if (state === 'all') {
    return options
      .filter((o) => isCheckboxOptionLocked(o) && currentSet.has(o.value))
      .map((o) => o.value);
  }
  const max =
    typeof maxSelections === 'number' && Number.isFinite(maxSelections) && maxSelections >= 1
      ? Math.trunc(maxSelections)
      : null;
  const lockedSelected = new Set(
    options.filter((o) => isCheckboxOptionLocked(o) && currentSet.has(o.value)).map((o) => o.value)
  );
  let remaining = max !== null ? Math.max(0, max - lockedSelected.size) : Number.POSITIVE_INFINITY;
  const next: string[] = [];
  for (const o of options) {
    if (lockedSelected.has(o.value)) {
      next.push(o.value);
    } else if (!isCheckboxOptionLocked(o) && !exclusiveSet.has(o.value)) {
      if (remaining > 0) {
        next.push(o.value);
        remaining -= 1;
      }
    }
  }
  return next;
}

export function toggleCheckboxGroupValue(
  current: readonly string[],
  toggledValue: string,
  options: readonly EmrOption[],
  exclusiveOrOptions: readonly string[] | EmrCheckboxGroupToggleOptions = []
): readonly string[] {
  const targetOption = options.find((o) => o.value === toggledValue);
  if (targetOption && isCheckboxOptionLocked(targetOption)) {
    return current;
  }
  const { exclusiveSet, maxSelections } = resolveCheckboxToggleOptions(exclusiveOrOptions);
  const lockedValues = new Set(
    options.filter((o) => isCheckboxOptionLocked(o)).map((o) => o.value)
  );
  const max =
    typeof maxSelections === 'number' && Number.isFinite(maxSelections) && maxSelections >= 1
      ? Math.trunc(maxSelections)
      : null;
  const nextSet = new Set(current);
  const wasChecked = nextSet.has(toggledValue);
  if (wasChecked) {
    nextSet.delete(toggledValue);
  } else if (exclusiveSet.has(toggledValue)) {
    for (const val of [...nextSet]) {
      if (!lockedValues.has(val)) {
        nextSet.delete(val);
      }
    }
    if (max !== null && nextSet.size >= max) {
      return current;
    }
    nextSet.add(toggledValue);
  } else {
    for (const ex of exclusiveSet) {
      if (!lockedValues.has(ex)) {
        nextSet.delete(ex);
      }
    }
    if (max !== null && nextSet.size >= max) {
      return current;
    }
    nextSet.add(toggledValue);
  }
  const ordered = options.map((o) => o.value).filter((v) => nextSet.has(v));
  const extras = [...nextSet].filter((v) => !ordered.includes(v));
  return [...ordered, ...extras];
}

// ─────────────────────────────────────────────────────────────
// 1b. Toggle Group Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrToggleGroupVariant = 'tile' | 'inline' | 'card';
export type EmrToggleGroupSize = EmrCheckboxSize;
export type EmrToggleGroupOrientation = EmrCheckboxGroupOrientation;
export type EmrToggleGroupLabelPlacement = EmrCheckboxLabelPlacement;
export type EmrToggleGroupSelectionValidation = EmrCheckboxGroupSelectionValidation;

export function normalizeEmrToggleGroupVariant(variant?: unknown): EmrToggleGroupVariant {
  if (variant === 'inline' || variant === 'card') {
    return variant;
  }
  return 'tile';
}

export function normalizeEmrToggleGroupSize(size?: unknown): EmrToggleGroupSize {
  return size === 'sm' ? 'sm' : 'md';
}

export function normalizeEmrToggleGroupOrientation(orientation?: unknown): EmrToggleGroupOrientation {
  if (orientation === 'horizontal' || orientation === 'grid') {
    return orientation;
  }
  return 'vertical';
}

export function normalizeEmrToggleGroupLabelPlacement(
  placement?: unknown,
): EmrToggleGroupLabelPlacement {
  if (placement === 'end' || placement === 'start') {
    return placement;
  }
  return 'space-between';
}

function dedupeToggleValues(items: readonly unknown[]): readonly string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    if (typeof item === 'string' && item !== '' && !seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

export function resolveEmrToggleGroupValues(params: {
  readonly value?: readonly string[] | string | null;
  readonly values?: readonly string[];
  readonly multiple?: boolean;
}): readonly string[] {
  const { value, values, multiple = true } = params;
  if (!multiple) {
    if (value !== undefined) {
      if (typeof value === 'string') return value !== '' ? [value] : [];
      if (Array.isArray(value)) {
        const first = value.find((v): v is string => typeof v === 'string' && v !== '');
        return first ? [first] : [];
      }
      return [];
    }
    if (Array.isArray(values)) {
      const first = values.find((v): v is string => typeof v === 'string' && v !== '');
      return first ? [first] : [];
    }
    return [];
  }
  if (values !== undefined) {
    return dedupeToggleValues(values);
  }
  if (Array.isArray(value)) {
    return dedupeToggleValues(value);
  }
  if (typeof value === 'string' && value !== '') {
    return [value];
  }
  return [];
}

export function toggleEmrToggleGroupValue(params: {
  readonly current: readonly string[];
  readonly toggledValue: string;
  readonly options: readonly EmrOption[];
  readonly multiple?: boolean;
  readonly allowEmpty?: boolean;
  readonly exclusiveValues?: readonly string[];
  readonly maxSelections?: number;
}): readonly string[] {
  const {
    current,
    toggledValue,
    options,
    multiple = true,
    allowEmpty = true,
    exclusiveValues = [],
    maxSelections,
  } = params;
  const targetOption = options.find((o) => o.value === toggledValue);
  if (targetOption && isCheckboxOptionLocked(targetOption)) {
    return current;
  }
  if (!multiple) {
    const isActive = current.includes(toggledValue);
    if (isActive) {
      return allowEmpty ? [] : current;
    }
    if (typeof maxSelections === 'number' && Number.isFinite(maxSelections) && Math.trunc(maxSelections) < 1) {
      return current;
    }
    return [toggledValue];
  }
  if (!allowEmpty && current.includes(toggledValue) && current.length <= 1) {
    return current;
  }
  return toggleCheckboxGroupValue(current, toggledValue, options, {
    exclusiveValues,
    maxSelections,
  });
}

export function clearEmrToggleGroupValues(
  current: readonly string[],
  options: readonly EmrOption[],
): readonly string[] {
  return clearCheckboxGroupValue(current, options);
}

export function validateEmrToggleGroupSelection(
  current: readonly string[],
  minSelections?: number,
  maxSelections?: number,
): EmrToggleGroupSelectionValidation {
  return validateCheckboxGroupSelection(current, minSelections, maxSelections);
}

// ─────────────────────────────────────────────────────────────
// 2. Hierarchical Tree View & Tree Select Models + Algorithms
// ─────────────────────────────────────────────────────────────

export interface EmrTreeNode {
  readonly id: string;
  readonly label: string;
  readonly code?: string;
  readonly description?: string;
  readonly icon?: string;
  readonly selectable?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly badge?: EmrBadge | string;
  readonly tone?: EmrTone;
  readonly keywords?: readonly string[];
  readonly children?: readonly EmrTreeNode[];
}

export type EmrTreeCheckStrategy = 'all' | 'cascade' | 'leaf';
export type EmrTreeCheckState = 'unchecked' | 'checked' | 'mixed';

export interface EmrFlatTreeRow {
  readonly node: EmrTreeNode;
  readonly depth: number;
  readonly parentId: string | null;
  readonly hasChildren: boolean;
  readonly expanded: boolean;
  readonly selectable: boolean;
  readonly pathIds: readonly string[];
  readonly pathLabels: readonly string[];
  readonly checkState: EmrTreeCheckState;
}

function collectEnabledLeafOrSelectableIds(
  node: EmrTreeNode,
  strategy: EmrTreeCheckStrategy,
  acc: string[] = [],
  mutableOnly = false,
): string[] {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isSelectable =
    node.selectable !== undefined
      ? node.selectable
      : strategy === 'leaf'
        ? !hasChildren
        : true;
  if (!node.disabled && (!mutableOnly || !node.readOnly) && isSelectable) {
    acc.push(node.id);
  }
  if (node.children && !node.disabled) {
    for (const child of node.children) {
      collectEnabledLeafOrSelectableIds(child, strategy, acc, mutableOnly);
    }
  }
  return acc;
}

function collectMutablePostOrderIds(
  node: EmrTreeNode,
  strategy: EmrTreeCheckStrategy,
  acc: string[] = [],
): string[] {
  if (node.disabled) return acc;
  if (node.children) {
    for (const child of node.children) {
      collectMutablePostOrderIds(child, strategy, acc);
    }
  }
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isSelectable =
    node.selectable !== undefined
      ? node.selectable
      : strategy === 'leaf'
        ? !hasChildren
        : true;
  if (!node.readOnly && isSelectable) {
    acc.push(node.id);
  }
  return acc;
}

function findTreeNodeById(list: readonly EmrTreeNode[], targetId: string): EmrTreeNode | null {
  for (const n of list) {
    if (n.id === targetId) return n;
    if (n.children) {
      const found = findTreeNodeById(n.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

function collectCanonicalTreeOrder(
  nodes: readonly EmrTreeNode[],
  selectedSet: ReadonlySet<string>,
): readonly string[] {
  const canonical: string[] = [];
  const seen = new Set<string>();
  const walk = (list: readonly EmrTreeNode[]) => {
    for (const n of list) {
      if (selectedSet.has(n.id)) {
        canonical.push(n.id);
        seen.add(n.id);
      }
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  for (const id of selectedSet) {
    if (!seen.has(id)) canonical.push(id);
  }
  return canonical;
}

function treeNodeMatchesQuery(node: EmrTreeNode, query: string): boolean {
  return (
    node.label.toLowerCase().includes(query) ||
    (node.code?.toLowerCase().includes(query) ?? false) ||
    (node.description?.toLowerCase().includes(query) ?? false) ||
    (node.keywords?.some((k) => k.toLowerCase().includes(query)) ?? false)
  );
}

export function computeTreeNodeCheckState(
  node: EmrTreeNode,
  selectedSet: ReadonlySet<string>,
  strategy: EmrTreeCheckStrategy = 'cascade',
): EmrTreeCheckState {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  if (strategy !== 'cascade' || !hasChildren) {
    return selectedSet.has(node.id) ? 'checked' : 'unchecked';
  }
  const descendantIds = collectEnabledLeafOrSelectableIds(node, 'cascade');
  if (descendantIds.length === 0) {
    return selectedSet.has(node.id) ? 'checked' : 'unchecked';
  }
  let checkedCount = 0;
  for (const id of descendantIds) {
    if (selectedSet.has(id)) checkedCount += 1;
  }
  if (checkedCount === 0) return 'unchecked';
  if (checkedCount === descendantIds.length) return 'checked';
  return 'mixed';
}

export function flattenVisibleTreeNodes(
  nodes: readonly EmrTreeNode[],
  expandedIds: readonly string[],
  options: {
    readonly searchQuery?: string | null;
    readonly selectedIds?: readonly string[];
    readonly checkStrategy?: EmrTreeCheckStrategy;
  } = {},
): readonly EmrFlatTreeRow[] {
  const query = (options.searchQuery ?? '').trim().toLowerCase();
  const expandedSet = new Set(expandedIds);
  const selectedSet = new Set(options.selectedIds ?? []);
  const strategy = options.checkStrategy ?? 'cascade';

  const matchingSubtreeIds = new Set<string>();
  const autoExpandedIds = new Set<string>();

  if (query) {
    const visitMatch = (node: EmrTreeNode): boolean => {
      const selfMatches = treeNodeMatchesQuery(node, query);
      let childMatches = false;
      for (const child of node.children ?? []) {
        if (visitMatch(child)) childMatches = true;
      }
      if (childMatches) {
        autoExpandedIds.add(node.id);
      }
      if (selfMatches || childMatches) {
        matchingSubtreeIds.add(node.id);
        return true;
      }
      return false;
    };
    for (const root of nodes) visitMatch(root);
  }

  const rows: EmrFlatTreeRow[] = [];
  const walk = (
    list: readonly EmrTreeNode[],
    depth: number,
    parentId: string | null,
    pathIds: readonly string[],
    pathLabels: readonly string[],
    ancestorMatchedSearch: boolean,
  ) => {
    for (const node of list) {
      if (query && !ancestorMatchedSearch && !matchingSubtreeIds.has(node.id)) {
        continue;
      }
      const selfMatched = query.length > 0 && treeNodeMatchesQuery(node, query);
      const hasChildren = Boolean(node.children && node.children.length > 0);
      const expanded =
        hasChildren &&
        (query ? autoExpandedIds.has(node.id) || expandedSet.has(node.id) : expandedSet.has(node.id));
      const selectable =
        node.selectable !== undefined
          ? node.selectable
          : strategy === 'leaf'
            ? !hasChildren
            : true;
      const nextPathIds = [...pathIds, node.id];
      const nextPathLabels = [...pathLabels, node.label];
      rows.push({
        node,
        depth,
        parentId,
        hasChildren,
        expanded,
        selectable,
        pathIds: nextPathIds,
        pathLabels: nextPathLabels,
        checkState: computeTreeNodeCheckState(node, selectedSet, strategy),
      });
      if (hasChildren && expanded && node.children) {
        walk(
          node.children,
          depth + 1,
          node.id,
          nextPathIds,
          nextPathLabels,
          ancestorMatchedSearch || selfMatched,
        );
      }
    }
  };

  walk(nodes, 0, null, [], [], false);
  return rows;
}

function reconcileCascadeParents(
  nodes: readonly EmrTreeNode[],
  selected: Set<string>,
  max: number | null,
): void {
  const walk = (list: readonly EmrTreeNode[]): void => {
    for (const n of list) {
      if (n.children && n.children.length > 0) {
        walk(n.children);
        const childSelectableIds = n.children.flatMap((c) =>
          collectEnabledLeafOrSelectableIds(c, 'cascade'),
        );
        if (childSelectableIds.length > 0 && n.selectable !== false && !n.disabled && !n.readOnly) {
          const allChildrenChecked = childSelectableIds.every((id) => selected.has(id));
          if (allChildrenChecked) {
            if (max === null || selected.has(n.id) || selected.size < max) {
              selected.add(n.id);
            }
          } else {
            selected.delete(n.id);
          }
        }
      }
    }
  };
  walk(nodes);
}

export function toggleTreeNodeCheck(
  nodes: readonly EmrTreeNode[],
  currentIds: readonly string[],
  targetId: string,
  strategy: EmrTreeCheckStrategy = 'cascade',
  maxSelections?: number,
): readonly string[] {
  const target = findTreeNodeById(nodes, targetId);
  if (!target || target.disabled || target.readOnly) return currentIds;

  const selected = new Set(currentIds);
  const max =
    typeof maxSelections === 'number' && Number.isFinite(maxSelections) && maxSelections >= 1
      ? Math.trunc(maxSelections)
      : null;

  if (strategy === 'all' || strategy === 'leaf') {
    const hasChildren = Boolean(target.children && target.children.length > 0);
    if (strategy === 'leaf' && hasChildren && target.selectable !== true) {
      return currentIds;
    }
    if (target.selectable === false) {
      return currentIds;
    }
    if (selected.has(targetId)) {
      selected.delete(targetId);
    } else {
      if (max !== null && selected.size >= max) {
        return currentIds;
      }
      selected.add(targetId);
    }
    return collectCanonicalTreeOrder(nodes, selected);
  }

  // Cascade mode: toggle target + mutable enabled descendants, then reconcile ancestor parent states
  const mutableSubtreeIds = collectMutablePostOrderIds(target, 'cascade');
  if (mutableSubtreeIds.length === 0) return currentIds;

  const allMutableChecked = mutableSubtreeIds.every((id) => selected.has(id));
  const shouldCheck = !allMutableChecked;
  if (shouldCheck) {
    if (max !== null && selected.size >= max) {
      return currentIds;
    }
    for (const id of mutableSubtreeIds) {
      if (max !== null && !selected.has(id) && selected.size >= max) {
        break;
      }
      selected.add(id);
    }
  } else {
    for (const id of mutableSubtreeIds) {
      selected.delete(id);
    }
  }

  reconcileCascadeParents(nodes, selected, max);
  return collectCanonicalTreeOrder(nodes, selected);
}

export function clearTreeSelection(
  nodes: readonly EmrTreeNode[],
  currentIds: readonly string[],
): readonly string[] {
  if (currentIds.length === 0) return [];
  const currentSet = new Set(currentIds);
  const lockedSelected = new Set<string>();
  const walk = (list: readonly EmrTreeNode[]) => {
    for (const n of list) {
      if ((n.readOnly || n.disabled) && currentSet.has(n.id)) {
        lockedSelected.add(n.id);
      }
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return collectCanonicalTreeOrder(nodes, lockedSelected);
}

export function resolveDefaultExpandedTreeIds(
  nodes: readonly EmrTreeNode[],
  defaultExpandedIds?: readonly string[],
): readonly string[] {
  if (defaultExpandedIds !== undefined) {
    return [...defaultExpandedIds];
  }
  return nodes
    .filter((n) => Boolean(n.children && n.children.length > 0))
    .map((n) => n.id);
}

export function findNextTreeRowIndex(
  rows: readonly EmrFlatTreeRow[],
  currentIndex: number,
  key: 'ArrowDown' | 'ArrowUp' | 'Home' | 'End',
): number {
  const enabledIndices: number[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    if (!rows[i]!.node.disabled) enabledIndices.push(i);
  }
  if (enabledIndices.length === 0) return -1;
  if (key === 'Home') return enabledIndices[0]!;
  if (key === 'End') return enabledIndices[enabledIndices.length - 1]!;
  if (key === 'ArrowDown') {
    const next = enabledIndices.find((idx) => idx > currentIndex);
    return next !== undefined ? next : enabledIndices[enabledIndices.length - 1]!;
  }
  for (let i = enabledIndices.length - 1; i >= 0; i -= 1) {
    if (enabledIndices[i]! < currentIndex) return enabledIndices[i]!;
  }
  return enabledIndices[0]!;
}

export function findTypeaheadTreeRowIndex(
  rows: readonly EmrFlatTreeRow[],
  query: string,
  startIndex = -1,
): number {
  const q = query.trim().toLowerCase();
  if (!q || rows.length === 0) return -1;
  const len = rows.length;
  const start = startIndex >= 0 && startIndex < len ? (startIndex + 1) % len : 0;
  for (let offset = 0; offset < len; offset += 1) {
    const idx = (start + offset) % len;
    const row = rows[idx]!;
    if (row.node.disabled) continue;
    if (row.node.label.toLowerCase().startsWith(q)) return idx;
  }
  return -1;
}

export function removeTreeSelectionChip(
  nodes: readonly EmrTreeNode[],
  currentIds: readonly string[],
  targetId: string,
  strategy: EmrTreeCheckStrategy = 'cascade',
): readonly string[] {
  const target = findTreeNodeById(nodes, targetId);
  if (target && (target.disabled || target.readOnly)) {
    return currentIds;
  }
  if (!currentIds.includes(targetId)) {
    return currentIds;
  }
  if (strategy !== 'cascade' || !target) {
    return currentIds.filter((id) => id !== targetId);
  }
  const selected = new Set(currentIds);
  const mutableSubtreeIds = collectMutablePostOrderIds(target, 'cascade');
  for (const id of mutableSubtreeIds) {
    selected.delete(id);
  }
  selected.delete(targetId);
  reconcileCascadeParents(nodes, selected, null);
  return collectCanonicalTreeOrder(nodes, selected);
}

export function collectAllExpandableTreeIds(nodes: readonly EmrTreeNode[]): readonly string[] {
  const ids: string[] = [];
  const walk = (list: readonly EmrTreeNode[]) => {
    for (const n of list) {
      if (n.children && n.children.length > 0) {
        ids.push(n.id);
        walk(n.children);
      }
    }
  };
  walk(nodes);
  return ids;
}

export function resolveTreeNodePath(
  nodes: readonly EmrTreeNode[],
  targetId: string | null | undefined,
): readonly EmrTreeNode[] {
  if (!targetId) return [];
  const walk = (list: readonly EmrTreeNode[], trail: readonly EmrTreeNode[]): readonly EmrTreeNode[] | null => {
    for (const n of list) {
      const next = [...trail, n];
      if (n.id === targetId) return next;
      if (n.children) {
        const found = walk(n.children, next);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(nodes, []) ?? [];
}

export function formatTreeSelectionLabel(
  nodes: readonly EmrTreeNode[],
  targetId: string | null | undefined,
  displayMode: 'path' | 'leaf' = 'path',
  separator = ' / ',
): string {
  const trail = resolveTreeNodePath(nodes, targetId);
  if (trail.length === 0) return '';
  return displayMode === 'leaf'
    ? trail[trail.length - 1]!.label
    : trail.map((n) => n.label).join(separator);
}

export interface EmrTreeSelectChipItem {
  readonly id: string;
  readonly label: string;
  readonly readOnly: boolean;
  readonly disabled: boolean;
}

export interface EmrTreeSelectSummary {
  readonly hasSelection: boolean;
  readonly text: string;
  readonly visibleChips: readonly EmrTreeSelectChipItem[];
  readonly overflowCount: number;
}

export function buildEmrTreeSelectSummary(params: {
  readonly nodes: readonly EmrTreeNode[];
  readonly multiple: boolean;
  readonly value?: string | null;
  readonly values?: readonly string[];
  readonly displayMode?: 'path' | 'leaf';
  readonly separator?: string;
  readonly placeholder: string;
  readonly maxTagCount?: number;
}): EmrTreeSelectSummary {
  const {
    nodes,
    multiple,
    value,
    values = [],
    displayMode = 'path',
    separator = ' / ',
    placeholder,
    maxTagCount,
  } = params;
  if (!multiple) {
    if (!value) {
      return { hasSelection: false, text: placeholder, visibleChips: [], overflowCount: 0 };
    }
    const label = formatTreeSelectionLabel(nodes, value, displayMode, separator) || value;
    return { hasSelection: true, text: label, visibleChips: [], overflowCount: 0 };
  }
  if (values.length === 0) {
    return { hasSelection: false, text: placeholder, visibleChips: [], overflowCount: 0 };
  }
  const chips: EmrTreeSelectChipItem[] = values.map((id) => {
    const node = findTreeNodeById(nodes, id);
    const label = formatTreeSelectionLabel(nodes, id, displayMode, separator) || id;
    return {
      id,
      label,
      readOnly: Boolean(node?.readOnly),
      disabled: Boolean(node?.disabled),
    };
  });
  const cap =
    typeof maxTagCount === 'number' && Number.isFinite(maxTagCount) && maxTagCount >= 0
      ? Math.trunc(maxTagCount)
      : chips.length;
  const visibleChips = chips.slice(0, cap);
  const overflowCount = Math.max(0, chips.length - visibleChips.length);
  const text =
    cap === 0 ? `${chips.length} selected` : chips.map((c) => c.label).join(', ');
  return {
    hasSelection: true,
    text,
    visibleChips,
    overflowCount,
  };
}

export function resolveEmrTreeSelectDefaultExpanded(
  nodes: readonly EmrTreeNode[],
  value?: string | null,
  values?: readonly string[],
  defaultExpandedIds?: readonly string[],
): readonly string[] {
  if (defaultExpandedIds !== undefined) {
    return [...defaultExpandedIds];
  }
  const ids = new Set<string>();
  const targets = [
    ...(value ? [value] : []),
    ...(values ?? []),
  ];
  for (const targetId of targets) {
    const trail = resolveTreeNodePath(nodes, targetId);
    for (let i = 0; i < trail.length - 1; i += 1) {
      const node = trail[i]!;
      if (node.children && node.children.length > 0) {
        ids.add(node.id);
      }
    }
  }
  if (ids.size > 0) {
    return [...ids];
  }
  return resolveDefaultExpandedTreeIds(nodes);
}

export function isEmrTreeClearable(params: {
  readonly clearable: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly multiple: boolean;
  readonly value?: string | null;
  readonly values?: readonly string[];
  readonly nodes: readonly EmrTreeNode[];
}): boolean {
  const { clearable, disabled, readOnly, multiple, value, values = [], nodes } = params;
  if (!clearable || disabled || readOnly) return false;
  const selectedIds = multiple ? values : value ? [value] : [];
  if (selectedIds.length === 0) return false;
  return selectedIds.some((id) => {
    const node = findTreeNodeById(nodes, id);
    return !(node?.readOnly || node?.disabled);
  });
}

// ─────────────────────────────────────────────────────────────
// 3. Image Viewer, Cropper, Upload & L2 EmrImageField Models
// ─────────────────────────────────────────────────────────────

export interface EmrImageItem {
  readonly id: string;
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
  readonly width?: number;
  readonly height?: number;
}

export interface EmrImageViewportState {
  readonly zoom: number;
  readonly panX: number;
  readonly panY: number;
  readonly rotationDeg: number;
  readonly flipH: boolean;
  readonly flipV: boolean;
}

export const DEFAULT_IMAGE_VIEWPORT: EmrImageViewportState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  rotationDeg: 0,
  flipH: false,
  flipV: false,
};

export function stepImageZoom(
  currentZoom: number,
  delta: number,
  minZoom = 0.25,
  maxZoom = 5
): number {
  const next = Math.round((currentZoom + delta) * 100) / 100;
  return Math.max(minZoom, Math.min(maxZoom, next));
}

export function rotateImage90(currentDeg: number, clockwise: boolean): number {
  const delta = clockwise ? 90 : -90;
  const normalized = (((currentDeg + delta) % 360) + 360) % 360;
  return normalized > 180 ? normalized - 360 : normalized;
}

export function clampStraightenAngle(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  return Math.max(-180, Math.min(180, Math.round(deg * 10) / 10));
}

export function splitRotationDegrees(totalDeg: number): {
  readonly base90: number;
  readonly straighten: number;
} {
  if (!Number.isFinite(totalDeg)) {
    return { base90: 0, straighten: 0 };
  }
  let norm = ((totalDeg % 360) + 360) % 360;
  if (norm > 180) norm -= 360;
  const rawBase90 = Math.round(norm / 90) * 90;
  const straighten = Math.round((norm - rawBase90) * 10) / 10;
  const base90 = rawBase90 === -180 && straighten <= 0 ? 180 : rawBase90;
  return { base90, straighten };
}

export function formatImageTransformCss(state: EmrImageViewportState): string {
  const sx = (state.flipH ? -1 : 1) * state.zoom;
  const sy = (state.flipV ? -1 : 1) * state.zoom;
  return `translate(${state.panX}px, ${state.panY}px) rotate(${state.rotationDeg}deg) scale(${sx}, ${sy})`;
}

export interface EmrImageCropRect {
  /** Normalized 0..1 left offset */
  readonly x: number;
  /** Normalized 0..1 top offset */
  readonly y: number;
  /** Normalized 0.05..1 width */
  readonly width: number;
  /** Normalized 0.05..1 height */
  readonly height: number;
}

export interface EmrImageCropTransform {
  readonly rect: EmrImageCropRect;
  readonly rotationDeg: number;
  readonly zoom: number;
  readonly panX: number;
  readonly panY: number;
  readonly flipH: boolean;
  readonly flipV: boolean;
  readonly aspectRatio: number | null;
}

export interface EmrAspectPreset {
  readonly id: string;
  readonly label: string;
  readonly ratio: number | null;
}

export const DEFAULT_ASPECT_PRESETS: readonly EmrAspectPreset[] = [
  { id: 'free', label: 'Free', ratio: null },
  { id: '1:1', label: '1:1 Square', ratio: 1 },
  { id: '4:3', label: '4:3 Clinical', ratio: 4 / 3 },
  { id: '16:9', label: '16:9 Wide', ratio: 16 / 9 },
  { id: '3:4', label: '3:4 Portrait', ratio: 3 / 4 },
];

export const DEFAULT_IMAGE_CROP_TRANSFORM: EmrImageCropTransform = {
  rect: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
  rotationDeg: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
  flipH: false,
  flipV: false,
  aspectRatio: null,
};

export function clampCropRect(
  rect: EmrImageCropRect,
  aspectRatio: number | null = null,
  minSize = 0.1
): EmrImageCropRect {
  let width = Math.max(minSize, Math.min(1, Number.isFinite(rect.width) ? rect.width : 0.8));
  let height = Math.max(minSize, Math.min(1, Number.isFinite(rect.height) ? rect.height : 0.8));
  if (aspectRatio !== null && aspectRatio > 0) {
    height = width / aspectRatio;
    if (height > 1) {
      height = 1;
      width = Math.max(minSize, Math.min(1, height * aspectRatio));
    }
    if (height < minSize) {
      height = minSize;
      width = Math.max(minSize, Math.min(1, height * aspectRatio));
    }
  }
  const x = Math.max(0, Math.min(1 - width, Number.isFinite(rect.x) ? rect.x : 0));
  const y = Math.max(0, Math.min(1 - height, Number.isFinite(rect.y) ? rect.y : 0));
  return {
    x: Math.round(x * 1000) / 1000,
    y: Math.round(y * 1000) / 1000,
    width: Math.round(width * 1000) / 1000,
    height: Math.round(height * 1000) / 1000,
  };
}

export function computeAspectLockedCropRect(
  prevRect: EmrImageCropRect,
  nextRect: EmrImageCropRect,
  aspectRatio: number | null = null,
  minSize = 0.1
): EmrImageCropRect {
  if (aspectRatio === null || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return clampCropRect(nextRect, null, minSize);
  }
  const prevW = Number.isFinite(prevRect.width) ? prevRect.width : 0.8;
  const prevH = Number.isFinite(prevRect.height) ? prevRect.height : 0.8;
  const candW = Number.isFinite(nextRect.width) ? nextRect.width : prevW;
  const candH = Number.isFinite(nextRect.height) ? nextRect.height : prevH;
  const dw = Math.abs(candW - prevW);
  const dh = Math.abs(candH - prevH);

  let width: number;
  let height: number;
  if (dh > dw) {
    height = Math.max(minSize, Math.min(1, candH));
    width = height * aspectRatio;
    if (width > 1) {
      width = 1;
      height = width / aspectRatio;
    }
    if (width < minSize) {
      width = minSize;
      height = width / aspectRatio;
    }
  } else {
    width = Math.max(minSize, Math.min(1, candW));
    height = width / aspectRatio;
    if (height > 1) {
      height = 1;
      width = height * aspectRatio;
    }
    if (height < minSize) {
      height = minSize;
      width = height * aspectRatio;
    }
  }

  const candX = Number.isFinite(nextRect.x) ? nextRect.x : prevRect.x;
  const candY = Number.isFinite(nextRect.y) ? nextRect.y : prevRect.y;
  const leftMoved =
    Math.abs(candX - prevRect.x) > 1e-4 &&
    Math.abs(candX + candW - (prevRect.x + prevW)) < 1e-3;
  const topMoved =
    Math.abs(candY - prevRect.y) > 1e-4 &&
    Math.abs(candY + candH - (prevRect.y + prevH)) < 1e-3;

  const rawX = leftMoved ? prevRect.x + prevW - width : candX;
  const rawY = topMoved ? prevRect.y + prevH - height : candY;
  const x = Math.max(0, Math.min(1 - width, rawX));
  const y = Math.max(0, Math.min(1 - height, rawY));

  return {
    x: Math.round(x * 1000) / 1000,
    y: Math.round(y * 1000) / 1000,
    width: Math.round(width * 1000) / 1000,
    height: Math.round(height * 1000) / 1000,
  };
}

export interface EmrCroppedCanvasPlan {
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly outputWidth: number;
  readonly outputHeight: number;
  readonly drawWidth: number;
  readonly drawHeight: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly rotationRad: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly rect: EmrImageCropRect;
}

export function computeCroppedCanvasPlan(
  naturalWidth: number,
  naturalHeight: number,
  transform: EmrImageCropTransform,
  maxOutputDim = 2048
): EmrCroppedCanvasPlan {
  const sourceWidth =
    Number.isFinite(naturalWidth) && naturalWidth > 0 ? Math.round(naturalWidth) : 360;
  const sourceHeight =
    Number.isFinite(naturalHeight) && naturalHeight > 0 ? Math.round(naturalHeight) : 260;
  const rect = clampCropRect(transform.rect, transform.aspectRatio);
  const rawW = Math.max(1, Math.round(rect.width * sourceWidth));
  const rawH = Math.max(1, Math.round(rect.height * sourceHeight));
  const limit = Number.isFinite(maxOutputDim) && maxOutputDim >= 1 ? Math.round(maxOutputDim) : 2048;
  const downscale = Math.max(rawW, rawH) > limit ? limit / Math.max(rawW, rawH) : 1;
  const outputWidth = Math.max(1, Math.round(rawW * downscale));
  const outputHeight = Math.max(1, Math.round(rawH * downscale));
  const drawWidth = sourceWidth * downscale;
  const drawHeight = sourceHeight * downscale;
  const zoom = stepImageZoom(transform.zoom, 0);

  return {
    sourceWidth,
    sourceHeight,
    outputWidth,
    outputHeight,
    drawWidth,
    drawHeight,
    offsetX: -rect.x * drawWidth,
    offsetY: -rect.y * drawHeight,
    centerX: drawWidth / 2 + transform.panX * downscale,
    centerY: drawHeight / 2 + transform.panY * downscale,
    rotationRad: (clampStraightenAngle(transform.rotationDeg) * Math.PI) / 180,
    scaleX: (transform.flipH ? -1 : 1) * zoom,
    scaleY: (transform.flipV ? -1 : 1) * zoom,
    rect,
  };
}

function formatImageSizeLabel(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${Math.max(0, Math.round(bytes))} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateUploadedImageFile(
  file: { readonly name: string; readonly sizeBytes: number; readonly mimeType: string },
  opts: { readonly accept?: string; readonly maxSizeBytes?: number } = {}
): string | null {
  const acceptRaw = (opts.accept ?? '').trim();
  if (acceptRaw) {
    const tokens = acceptRaw
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    if (tokens.length > 0 && !tokens.includes('*/*') && !tokens.includes('*')) {
      const mime = (file.mimeType || '').trim().toLowerCase();
      const extMatch = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? '';
      const accepted = tokens.some((tok) => {
        if (tok.startsWith('.')) return extMatch === tok;
        if (tok.endsWith('/*')) {
          const prefix = tok.slice(0, -1);
          if (mime.startsWith(prefix)) return true;
          if (
            prefix === 'image/' &&
            /\.(png|jpe?g|gif|webp|svg|bmp|avif|heic|heif|tiff?)$/i.test(file.name)
          ) {
            return true;
          }
          return false;
        }
        return mime === tok;
      });
      if (!accepted) {
        return `"${file.name}" is not an accepted file type (${acceptRaw}).`;
      }
    }
  }
  if (
    opts.maxSizeBytes !== undefined &&
    Number.isFinite(opts.maxSizeBytes) &&
    opts.maxSizeBytes > 0 &&
    file.sizeBytes > opts.maxSizeBytes
  ) {
    return `"${file.name}" exceeds the maximum file size (${formatImageSizeLabel(opts.maxSizeBytes)}).`;
  }
  return null;
}

export interface EmrImageCropResult {
  readonly transform: EmrImageCropTransform;
  readonly croppedDataUrl?: string | null;
}

export interface EmrUploadedImageItem {
  readonly id: string;
  readonly name: string;
  readonly src: string;
  readonly previewSrc?: string;
  readonly mimeType: string;
  readonly sizeBytes?: number;
  readonly alt?: string;
  readonly caption?: string;
  readonly cropTransform?: EmrImageCropTransform;
}

// L2 EmrImageField ViewModel & Intent
export interface ImageFieldViewModel {
  readonly definition?: EmrFieldDefinition;
  readonly label: string;
  readonly labelHidden?: boolean;
  readonly layout?: FieldFrameLayout;
  readonly showMetadata?: boolean;
  readonly items: readonly EmrUploadedImageItem[];
  readonly accept?: string;
  readonly multiple?: boolean;
  readonly maxFiles?: number;
  readonly maxSizeBytes?: number;
  readonly allowCamera?: boolean;
  readonly aspectPresets?: readonly EmrAspectPreset[];
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type ImageFieldIntent =
  | { readonly type: 'filesSelected'; readonly files: readonly EmrFileSelectionItem[] }
  | { readonly type: 'itemsChangeRequested'; readonly items: readonly EmrUploadedImageItem[] }
  | {
      readonly type: 'imageCropped';
      readonly id: string;
      readonly result: EmrImageCropResult;
    }
  | { readonly type: 'captionChangeRequested'; readonly id: string; readonly caption: string }
  | { readonly type: 'itemRemoveRequested'; readonly id: string }
  | { readonly type: 'captureRequested'; readonly mode: 'camera' }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

// ─────────────────────────────────────────────────────────────
// 4. Date Range Picker Models & Helpers
// ─────────────────────────────────────────────────────────────

export interface EmrDateRangeValue {
  readonly start: string | null;
  readonly end: string | null;
}

export interface EmrDateRangePreset {
  readonly id: string;
  readonly label: string;
  readonly range: EmrDateRangeValue;
}

export function normalizeDateRangeSelection(
  current: EmrDateRangeValue | null | undefined,
  clickedIso: string
): EmrDateRangeValue {
  const start = current?.start ?? null;
  const end = current?.end ?? null;
  if (!start || (start && end)) {
    return { start: clickedIso, end: null };
  }
  if (clickedIso < start) {
    return { start: clickedIso, end: start };
  }
  return { start, end: clickedIso };
}

export function isIsoDateInRange(
  iso: string,
  range: EmrDateRangeValue | null | undefined
): boolean {
  if (!range?.start || !range?.end) return false;
  const startCmp = iso.length === 10 && range.start.length > 10 ? range.start.slice(0, 10) : range.start;
  const endCmp = iso.length === 10 && range.end.length > 10 ? range.end.slice(0, 10) : range.end;
  return iso >= startCmp && iso <= endCmp;
}

export function isIsoRangeEdge(
  iso: string,
  range: EmrDateRangeValue | null | undefined
): 'start' | 'end' | 'both' | null {
  if (!range) return null;
  const startCmp = range.start && iso.length === 10 && range.start.length > 10 ? range.start.slice(0, 10) : range.start;
  const endCmp = range.end && iso.length === 10 && range.end.length > 10 ? range.end.slice(0, 10) : range.end;
  const isStart = startCmp === iso;
  const isEnd = endCmp === iso;
  if (isStart && isEnd) return 'both';
  if (isStart) return 'start';
  if (isEnd) return 'end';
  return null;
}

export interface EmrDateRangeCalendarCell {
  readonly iso: string;
  readonly day: number;
  readonly inCurrentMonth: boolean;
}

const DATE_RANGE_WEEKDAYS_SUN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const DATE_RANGE_WEEKDAYS_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
const DATE_RANGE_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const drPad2 = (n: number): string => String(n).padStart(2, '0');
const drPad4 = (n: number): string => String(n).padStart(4, '0');

export function getDateRangeWeekdays(weekStartsOn: 0 | 1 = 0): readonly string[] {
  return weekStartsOn === 1 ? DATE_RANGE_WEEKDAYS_MON : DATE_RANGE_WEEKDAYS_SUN;
}

export function buildDateRangeCalendarGrid(
  year: number,
  monthIndex0: number,
  weekStartsOn: 0 | 1 = 0,
): readonly EmrDateRangeCalendarCell[] {
  const firstOfMonth = new Date(Date.UTC(year, monthIndex0, 1));
  const rawDow = firstOfMonth.getUTCDay(); // 0 = Sun .. 6 = Sat
  const offset = weekStartsOn === 1 ? (rawDow + 6) % 7 : rawDow;
  const cells: EmrDateRangeCalendarCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(Date.UTC(year, monthIndex0, 1 - offset + i));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const day = d.getUTCDate();
    cells.push({
      iso: `${drPad4(y)}-${drPad2(m + 1)}-${drPad2(day)}`,
      day,
      inCurrentMonth: m === monthIndex0 && y === year,
    });
  }
  return cells;
}

export function stepCalendarMonth(
  year: number,
  monthIndex0: number,
  delta: number,
): { readonly year: number; readonly month0: number } {
  const totalMonths = year * 12 + monthIndex0 + Math.trunc(delta);
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth0 = ((totalMonths % 12) + 12) % 12;
  return { year: nextYear, month0: nextMonth0 };
}

export function resolveInitialCalendarMonth(
  value?: EmrDateRangeValue | null,
  min?: string,
  fallbackTodayIso?: string,
): { readonly year: number; readonly month0: number } {
  const candidates = [value?.start, value?.end, min, fallbackTodayIso];
  for (const cand of candidates) {
    if (!cand) continue;
    const m = /^(\d{4})-(\d{2})/.exec(cand.trim());
    if (m) {
      const year = Number(m[1]);
      const month = Number(m[2]);
      if (month >= 1 && month <= 12) {
        return { year, month0: month - 1 };
      }
    }
  }
  const now = new Date();
  return { year: now.getUTCFullYear(), month0: now.getUTCMonth() };
}

export function formatDateRangeMonthTitle(year: number, monthIndex0: number): string {
  const normalized = stepCalendarMonth(year, monthIndex0, 0);
  const name = DATE_RANGE_MONTH_NAMES[normalized.month0] ?? drPad2(normalized.month0 + 1);
  return `${name} ${normalized.year}`;
}

export function normalizeDateRangeEndpoint(
  raw: string | null | undefined,
  mode: 'date' | 'datetime' = 'date',
): string | null {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) return null;
  if (mode === 'datetime') {
    const dtMatch = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2})?/.exec(trimmed);
    if (dtMatch) return `${dtMatch[1]}T${dtMatch[2]}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00`;
    return trimmed;
  }
  const dMatch = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  return dMatch ? dMatch[1]! : trimmed;
}

export function isValidDateRangeEndpoint(
  raw: string | null | undefined,
  mode: 'date' | 'datetime' = 'date',
): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (mode === 'datetime') {
    return /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?$/.test(trimmed);
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
}

function compareBoundEndpoint(value: string, bound: string, mode: 'date' | 'datetime'): number {
  const normVal = normalizeDateRangeEndpoint(value, mode) ?? value;
  const normBound = normalizeDateRangeEndpoint(bound, mode) ?? bound;
  if (normVal < normBound) return -1;
  if (normVal > normBound) return 1;
  return 0;
}

export interface EmrDateRangeCommitResult {
  readonly value: EmrDateRangeValue | null;
  readonly swapped: boolean;
  readonly startOutOfBounds: boolean;
  readonly endOutOfBounds: boolean;
}

export function commitDateRangeEndpoint(
  current: EmrDateRangeValue | null | undefined,
  edge: 'start' | 'end',
  raw: string | null | undefined,
  mode: 'date' | 'datetime' = 'date',
  min?: string,
  max?: string,
): EmrDateRangeCommitResult {
  const normalizedInput = normalizeDateRangeEndpoint(raw, mode);
  const curStart = current?.start ? normalizeDateRangeEndpoint(current.start, mode) : null;
  const curEnd = current?.end ? normalizeDateRangeEndpoint(current.end, mode) : null;
  let nextStart = edge === 'start' ? normalizedInput : curStart;
  let nextEnd = edge === 'end' ? normalizedInput : curEnd;
  let swapped = false;

  if (nextStart && nextEnd && nextEnd < nextStart) {
    const tmp = nextStart;
    nextStart = nextEnd;
    nextEnd = tmp;
    swapped = true;
  }

  const startOutOfBounds = Boolean(
    nextStart &&
      ((min && compareBoundEndpoint(nextStart, min, mode) < 0) ||
        (max && compareBoundEndpoint(nextStart, max, mode) > 0)),
  );
  const endOutOfBounds = Boolean(
    nextEnd &&
      ((min && compareBoundEndpoint(nextEnd, min, mode) < 0) ||
        (max && compareBoundEndpoint(nextEnd, max, mode) > 0)),
  );

  const value = !nextStart && !nextEnd ? null : { start: nextStart, end: nextEnd };
  return { value, swapped, startOutOfBounds, endOutOfBounds };
}

export function selectDateRangeCalendarDay(
  current: EmrDateRangeValue | null | undefined,
  clickedIso: string,
  mode: 'date' | 'datetime' = 'date',
  min?: string,
  max?: string,
): EmrDateRangeValue | null {
  const dateOnlyClicked = clickedIso.slice(0, 10);
  const minDate = min?.slice(0, 10);
  const maxDate = max?.slice(0, 10);
  if ((minDate && dateOnlyClicked < minDate) || (maxDate && dateOnlyClicked > maxDate)) {
    return current ?? null;
  }
  const baseRange: EmrDateRangeValue | null = current
    ? {
        start: current.start ? current.start.slice(0, 10) : null,
        end: current.end ? current.end.slice(0, 10) : null,
      }
    : null;
  const nextDateRange = normalizeDateRangeSelection(baseRange, dateOnlyClicked);
  if (mode !== 'datetime') {
    return nextDateRange;
  }
  const extractTime = (iso: string | null | undefined, fallback: string): string => {
    if (!iso) return fallback;
    const m = /[T ](\d{2}:\d{2})/.exec(iso);
    return m ? m[1]! : fallback;
  };
  const startTime = extractTime(current?.start, '00:00');
  const endTime = extractTime(current?.end, '23:59');
  return {
    start: nextDateRange.start ? `${nextDateRange.start}T${startTime}` : null,
    end: nextDateRange.end ? `${nextDateRange.end}T${endTime}` : null,
  };
}

// ─────────────────────────────────────────────────────────────
// 5. Tag Input, Slider, Range Slider, Masked & OTP Helpers
// ─────────────────────────────────────────────────────────────

export function splitTagTokens(
  raw: string,
  delimiters: readonly string[] = [',', ';']
): readonly string[] {
  if (!raw) return [];
  const escaped = delimiters.map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = escaped.length > 0 ? new RegExp(`[${escaped.join('')}]`, 'g') : null;
  const parts = pattern ? raw.split(pattern) : [raw];
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

export function addTagValues(
  current: readonly string[],
  candidates: readonly string[],
  options: { readonly allowDuplicates?: boolean; readonly maxTags?: number } = {}
): readonly string[] {
  const next = [...current];
  const lowerSet = new Set(current.map((t) => t.toLowerCase()));
  for (const raw of candidates) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (options.maxTags !== undefined && next.length >= options.maxTags) break;
    if (!options.allowDuplicates && lowerSet.has(trimmed.toLowerCase())) continue;
    next.push(trimmed);
    lowerSet.add(trimmed.toLowerCase());
  }
  return next;
}

export type EmrTagInputSize = 'md' | 'sm';
export type EmrTagInputVariant = 'outline' | 'filled' | 'subtle';

export interface EmrTagSuggestionItem {
  readonly value: string;
  readonly isBestMatch: boolean;
}

export function resolveEmrTagsValue(
  tags?: readonly string[] | null,
  value?: readonly string[] | null,
  values?: readonly string[] | null,
): readonly string[] {
  const hasTags = Array.isArray(tags);
  const hasValue = Array.isArray(value);
  const hasValues = Array.isArray(values);
  if (
    hasTags &&
    (tags.length > 0 || ((!hasValue || value.length === 0) && (!hasValues || values.length === 0)))
  ) {
    return tags;
  }
  if (hasValue && (value.length > 0 || !hasValues || values.length === 0)) {
    return value;
  }
  if (hasValues) {
    return values;
  }
  return [];
}

export function normalizeTagInputDraft(raw: string, maxTagLength?: number): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (maxTagLength !== undefined && maxTagLength >= 0) {
    return trimmed.slice(0, maxTagLength).trim();
  }
  return trimmed;
}

export function commitTagInputValues(
  current: readonly string[],
  rawCandidates: string | readonly string[],
  options: {
    readonly separators?: readonly string[];
    readonly delimiters?: readonly string[];
    readonly allowDuplicates?: boolean;
    readonly maxTags?: number;
    readonly maxTagLength?: number;
  } = {},
): { readonly next: readonly string[]; readonly added: readonly string[] } {
  const seps = options.separators ?? options.delimiters ?? [',', ';'];
  const rawList = typeof rawCandidates === 'string'
    ? splitTagTokens(rawCandidates, seps)
    : rawCandidates.flatMap((item) => splitTagTokens(item, seps));
  const normalized = rawList
    .map((item) => normalizeTagInputDraft(item, options.maxTagLength))
    .filter((item) => item.length > 0);
  if (normalized.length === 0) {
    return { next: current, added: [] };
  }
  const next = addTagValues(current, normalized, {
    allowDuplicates: options.allowDuplicates,
    maxTags: options.maxTags,
  });
  return {
    next,
    added: next.slice(current.length),
  };
}

export function isTagLocked(tag: string, lockedTags?: readonly string[]): boolean {
  if (!lockedTags || lockedTags.length === 0) return false;
  const target = tag.toLowerCase();
  return lockedTags.some((locked) => locked.toLowerCase() === target);
}

export function removeTagInputAtIndex(
  current: readonly string[],
  index: number,
  lockedTags?: readonly string[],
): { readonly next: readonly string[]; readonly removed: string | null } {
  if (index < 0 || index >= current.length) {
    return { next: current, removed: null };
  }
  const tag = current[index]!;
  if (isTagLocked(tag, lockedTags)) {
    return { next: current, removed: null };
  }
  return {
    next: current.filter((_, i) => i !== index),
    removed: tag,
  };
}

export function popLastUnlockedTag(
  current: readonly string[],
  lockedTags?: readonly string[],
): { readonly next: readonly string[]; readonly removed: string | null; readonly index: number } {
  for (let i = current.length - 1; i >= 0; i -= 1) {
    const tag = current[i]!;
    if (!isTagLocked(tag, lockedTags)) {
      return {
        next: current.filter((_, idx) => idx !== i),
        removed: tag,
        index: i,
      };
    }
  }
  return { next: current, removed: null, index: -1 };
}

export function clearUnlockedTags(
  current: readonly string[],
  lockedTags?: readonly string[],
): { readonly next: readonly string[]; readonly removed: readonly string[] } {
  if (current.length === 0) {
    return { next: current, removed: [] };
  }
  const next: string[] = [];
  const removed: string[] = [];
  for (const tag of current) {
    if (isTagLocked(tag, lockedTags)) {
      next.push(tag);
    } else {
      removed.push(tag);
    }
  }
  if (removed.length === 0) {
    return { next: current, removed: [] };
  }
  return { next, removed };
}

export function rankTagSuggestions(
  suggestions: readonly string[],
  currentTags: readonly string[],
  query: string,
  options: { readonly allowDuplicates?: boolean; readonly filterSuggestions?: boolean } = {},
): readonly EmrTagSuggestionItem[] {
  const existing = new Set(currentTags.map((t) => t.toLowerCase()));
  const available = suggestions.filter(
    (s) => options.allowDuplicates || !existing.has(s.toLowerCase()),
  );
  if (options.filterSuggestions === false) {
    return available.map((value) => ({ value, isBestMatch: false }));
  }
  const asOptions: readonly EmrOption[] = available.map((s) => ({ value: s, label: s }));
  const ranked = rankAndFilterOptions(asOptions, query, 'local');
  return ranked.map((entry) => ({
    value: entry.option.value,
    isBestMatch: entry.isBestMatch,
  }));
}

export interface EmrSliderMark {
  readonly value: number;
  readonly label?: string;
}

export function countSliderStepDecimals(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 0;
  const s = String(step).toLowerCase();
  const expIdx = s.indexOf('e-');
  if (expIdx !== -1) {
    const mantissa = s.slice(0, expIdx);
    const exp = Number(s.slice(expIdx + 2));
    const frac = (mantissa.split('.')[1] ?? '').length;
    return Math.min(10, Math.max(0, exp + frac));
  }
  return Math.min(10, (s.split('.')[1] ?? '').length);
}

export function clampSliderValue(
  value: number,
  min = 0,
  max = 100,
  step = 1,
): number {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 100;
  const lo = Math.min(safeMin, safeMax);
  const hi = Math.max(safeMin, safeMax);
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  if (!Number.isFinite(value)) return lo;
  const clamped = Math.max(lo, Math.min(hi, value));
  const stepped = lo + Math.round((clamped - lo) / safeStep) * safeStep;
  const decimals = Math.max(countSliderStepDecimals(safeStep), countSliderStepDecimals(lo));
  return Number(Math.max(lo, Math.min(hi, stepped)).toFixed(decimals));
}

export function sliderValuePercent(
  value: number | null | undefined,
  min = 0,
  max = 100,
): number {
  if (value === null || value === undefined || !Number.isFinite(value)) return 0;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  if (hi <= lo) return 0;
  return Math.max(0, Math.min(100, ((value - lo) / (hi - lo)) * 100));
}

export function formatSliderValue(
  value: number | null | undefined,
  unit = '',
  precision?: number,
  unsetLabel = '—',
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return unsetLabel;
  const formatted =
    precision !== undefined && Number.isFinite(precision) && precision >= 0
      ? value.toFixed(Math.min(10, Math.trunc(precision)))
      : String(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function resolveSliderKeyStepValue(
  key: string,
  current: number | null | undefined,
  min = 0,
  max = 100,
  step = 1,
): number | null {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const base = current !== null && current !== undefined && Number.isFinite(current) ? current : lo;
  const coarse = Math.max(safeStep, clampSliderValue(lo + (hi - lo) / 10, lo, hi, safeStep) - lo || safeStep);
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return clampSliderValue(base + safeStep, lo, hi, safeStep);
    case 'ArrowLeft':
    case 'ArrowDown':
      return clampSliderValue(base - safeStep, lo, hi, safeStep);
    case 'PageUp':
      return clampSliderValue(base + coarse, lo, hi, safeStep);
    case 'PageDown':
      return clampSliderValue(base - coarse, lo, hi, safeStep);
    case 'Home':
      return clampSliderValue(lo, lo, hi, safeStep);
    case 'End':
      return clampSliderValue(hi, lo, hi, safeStep);
    default:
      return null;
  }
}

export function clampRangeSliderPair(
  low: number,
  high: number,
  min = 0,
  max = 100,
  step = 1,
  minDistance = 0,
  movedThumb: 'low' | 'high' = 'low',
): readonly [number, number] {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 100;
  const lo = Math.min(safeMin, safeMax);
  const hi = Math.max(safeMin, safeMax);
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const span = Math.max(0, hi - lo);
  const safeMinDist = Math.min(
    span,
    Math.max(0, Number.isFinite(minDistance) ? minDistance : 0),
  );

  let nextLow = clampSliderValue(Number.isFinite(low) ? low : lo, lo, hi, safeStep);
  let nextHigh = clampSliderValue(Number.isFinite(high) ? high : hi, lo, hi, safeStep);

  if (movedThumb === 'low') {
    const minHigh = clampSliderValue(lo + safeMinDist, lo, hi, safeStep);
    if (nextHigh < minHigh) nextHigh = minHigh;
    const maxLow = clampSliderValue(nextHigh - safeMinDist, lo, hi, safeStep);
    if (nextLow > maxLow) nextLow = maxLow;
    if (nextHigh - nextLow < safeMinDist - 1e-9) {
      nextLow = clampSliderValue(nextLow - safeStep, lo, hi, safeStep);
    }
  } else {
    const maxLow = clampSliderValue(hi - safeMinDist, lo, hi, safeStep);
    if (nextLow > maxLow) nextLow = maxLow;
    const minHigh = clampSliderValue(nextLow + safeMinDist, lo, hi, safeStep);
    if (nextHigh < minHigh) nextHigh = minHigh;
    if (nextHigh - nextLow < safeMinDist - 1e-9) {
      nextHigh = clampSliderValue(nextHigh + safeStep, lo, hi, safeStep);
    }
  }

  if (nextLow > nextHigh) {
    const mid = clampSliderValue((nextLow + nextHigh) / 2, lo, hi, safeStep);
    return [mid, mid];
  }
  return [nextLow, nextHigh];
}

export function resolveClosestRangeThumb(
  offsetFraction: number,
  lowPct: number,
  highPct: number,
): 'low' | 'high' {
  const pct = Math.max(0, Math.min(100, offsetFraction * 100));
  if (pct <= lowPct && lowPct < highPct) return 'low';
  if (pct >= highPct && lowPct < highPct) return 'high';
  if (Math.abs(lowPct - highPct) < 1e-6) {
    return pct < lowPct ? 'low' : 'high';
  }
  return Math.abs(pct - lowPct) <= Math.abs(pct - highPct) ? 'low' : 'high';
}

export function resolveRangeThumbKeyValue(
  thumb: 'low' | 'high',
  key: string,
  pair: readonly [number, number],
  min = 0,
  max = 100,
  step = 1,
  minDistance = 0,
): readonly [number, number] | null {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const safeDist = Math.min(hi - lo, Math.max(0, minDistance));
  const [curLow, curHigh] = pair;
  if (thumb === 'low') {
    const thumbMax = Math.max(lo, curHigh - safeDist);
    const next =
      key === 'End'
        ? clampSliderValue(thumbMax, lo, hi, step)
        : resolveSliderKeyStepValue(key, curLow, lo, hi, step);
    if (next === null) return null;
    return clampRangeSliderPair(next, curHigh, lo, hi, step, safeDist, 'low');
  }
  const thumbMin = Math.min(hi, curLow + safeDist);
  const next =
    key === 'Home'
      ? clampSliderValue(thumbMin, lo, hi, step)
      : resolveSliderKeyStepValue(key, curHigh, lo, hi, step);
  if (next === null) return null;
  return clampRangeSliderPair(curLow, next, lo, hi, step, safeDist, 'high');
}

export interface EmrMaskOptions {
  readonly uppercase?: boolean;
  readonly definitions?: Readonly<Record<string, string>>;
}

interface ParsedMaskToken {
  readonly kind: 'token' | 'literal';
  readonly char: string;
}

function parseMaskPattern(
  mask: string,
  definitions?: Readonly<Record<string, string>>,
): readonly ParsedMaskToken[] {
  const out: ParsedMaskToken[] = [];
  for (let i = 0; i < mask.length; i += 1) {
    const ch = mask[i]!;
    if (ch === '\\' && i + 1 < mask.length) {
      i += 1;
      out.push({ kind: 'literal', char: mask[i]! });
      continue;
    }
    if (ch === '9' || ch === 'A' || ch === '*' || Boolean(definitions && ch in definitions)) {
      out.push({ kind: 'token', char: ch });
    } else {
      out.push({ kind: 'literal', char: ch });
    }
  }
  return out;
}

function compileCustomMaskDef(pattern: string): RegExp | null {
  try {
    return new RegExp(`^(?:${pattern})$`);
  } catch {
    return null;
  }
}

const matchesMaskToken = (
  token: string,
  char: string,
  definitions?: Readonly<Record<string, string>>,
): boolean => {
  if (definitions && token in definitions) {
    const rx = compileCustomMaskDef(definitions[token]!);
    return rx ? rx.test(char) : false;
  }
  if (token === '9') return /^[0-9]$/.test(char);
  if (token === 'A') return /^[A-Za-z]$/.test(char);
  if (token === '*') return /^[A-Za-z0-9]$/.test(char);
  return false;
};

export interface EmrMaskResult {
  readonly masked: string;
  readonly unmasked: string;
  readonly complete: boolean;
}

/**
 * Applies a pattern mask where `'9'` = digit, `'A'` = ASCII letter, `'*'` = alphanumeric,
 * `\` escapes a literal token char (`\9`, `\A`, `\*`, `\\`), and all other characters are literals.
 */
export function applyInputMask(
  raw: string | null | undefined,
  mask: string,
  options: EmrMaskOptions = {},
): EmrMaskResult {
  const input = raw ?? '';
  if (!mask) {
    const finalVal = options.uppercase ? input.toUpperCase() : input;
    return { masked: finalVal, unmasked: finalVal, complete: finalVal.length > 0 };
  }
  const parsed = parseMaskPattern(mask, options.definitions);
  const requiredTokens = parsed.filter((t) => t.kind === 'token').length;
  if (!input) {
    return { masked: '', unmasked: '', complete: requiredTokens === 0 };
  }

  let rawIdx = 0;
  let masked = '';
  let unmasked = '';
  let matchedTokens = 0;
  const emittedIsToken: boolean[] = [];

  for (let pIdx = 0; pIdx < parsed.length; pIdx += 1) {
    const part = parsed[pIdx]!;
    if (part.kind === 'token') {
      let found: string | null = null;
      while (rawIdx < input.length) {
        const candidate = input[rawIdx]!;
        rawIdx += 1;
        if (matchesMaskToken(part.char, candidate, options.definitions)) {
          found = options.uppercase ? candidate.toUpperCase() : candidate;
          break;
        }
      }
      if (found === null) break;
      masked += found;
      unmasked += found;
      emittedIsToken.push(true);
      matchedTokens += 1;
    } else {
      if (rawIdx < input.length) {
        if (input[rawIdx] === part.char) {
          rawIdx += 1;
        }
        masked += part.char;
        emittedIsToken.push(false);
      }
    }
  }

  // Strip trailing literals when no token characters were matched at all
  while (masked.length > 0 && !emittedIsToken[masked.length - 1] && unmasked.length === 0) {
    masked = masked.slice(0, -1);
    emittedIsToken.pop();
  }

  return {
    masked,
    unmasked,
    complete: matchedTokens === requiredTokens,
  };
}

export function inferMaskInputMode(
  mask: string,
  definitions?: Readonly<Record<string, string>>,
): 'numeric' | 'text' {
  const tokens = parseMaskPattern(mask, definitions).filter((p) => p.kind === 'token');
  if (tokens.length === 0) return 'text';
  return tokens.every((t) => t.char === '9') ? 'numeric' : 'text';
}

export function resolveMaskedCaretPosition(
  prevMasked: string,
  nextMasked: string,
  prevCaret: number,
  mask: string,
  options: EmrMaskOptions = {},
): number {
  const safeCaret = Math.max(0, Math.min(prevMasked.length, prevCaret));
  const prefixUnmasked = applyInputMask(prevMasked.slice(0, safeCaret), mask, options).unmasked.length;
  if (prefixUnmasked === 0) {
    return 0;
  }
  const parsed = parseMaskPattern(mask, options.definitions);
  let tokenCount = 0;
  let maskIdx = 0;
  for (let i = 0; i < nextMasked.length; i += 1) {
    while (maskIdx < parsed.length && parsed[maskIdx]!.kind === 'literal') {
      if (nextMasked[i] === parsed[maskIdx]!.char) {
        maskIdx += 1;
        break;
      }
      maskIdx += 1;
    }
    const curPart = parsed[maskIdx];
    if (curPart?.kind === 'token' && nextMasked[i] !== undefined) {
      tokenCount += 1;
      maskIdx += 1;
      if (tokenCount >= prefixUnmasked) {
        let pos = i + 1;
        while (pos < nextMasked.length && maskIdx < parsed.length && parsed[maskIdx]!.kind === 'literal') {
          if (nextMasked[pos] === parsed[maskIdx]!.char) {
            pos += 1;
            maskIdx += 1;
          } else {
            break;
          }
        }
        return pos;
      }
    }
  }
  return nextMasked.length;
}

export function editMaskedInputWithCaret(
  prevMasked: string,
  rawNext: string,
  rawCaret: number,
  mask: string,
  options: EmrMaskOptions = {},
): { readonly result: EmrMaskResult; readonly caret: number } {
  const prevRes = applyInputMask(prevMasked, mask, options);
  const nextRes = applyInputMask(rawNext, mask, options);
  const safeRawCaret = Math.max(0, Math.min(rawNext.length, rawCaret));

  // Backspace across a literal separator: user deleted a separator while unmasked token count stayed equal
  if (
    rawNext.length < prevMasked.length &&
    nextRes.unmasked === prevRes.unmasked &&
    prevRes.unmasked.length > 0
  ) {
    const tokensBefore = applyInputMask(rawNext.slice(0, safeRawCaret), mask, options).unmasked.length;
    const dropIdx = Math.max(0, tokensBefore - 1);
    const trimmedUnmasked =
      prevRes.unmasked.slice(0, dropIdx) + prevRes.unmasked.slice(dropIdx + 1);
    const adjusted = applyInputMask(trimmedUnmasked, mask, options);
    const caret = resolveMaskedCaretPosition(
      rawNext.slice(0, safeRawCaret).slice(0, Math.max(0, safeRawCaret - 1)),
      adjusted.masked,
      Math.max(0, safeRawCaret - 1),
      mask,
      options,
    );
    return { result: adjusted, caret };
  }

  const caret = resolveMaskedCaretPosition(rawNext, nextRes.masked, safeRawCaret, mask, options);
  return { result: nextRes, caret };
}

export function normalizeOtpSlots(
  value: string | null | undefined,
  length = 6,
): readonly string[] {
  const safeLen = Math.max(1, Math.min(12, Math.floor(length)));
  const chars = [...(value ?? '')];
  return Array.from({ length: safeLen }, (_, i) => {
    const ch = chars[i] ?? '';
    return ch === ' ' ? '' : ch;
  });
}

function encodeOtpSlots(slots: readonly string[]): string {
  return slots
    .map((s) => (s && s.length === 1 ? s : ' '))
    .join('')
    .replace(/ +$/g, '');
}

export interface EmrOtpEditResult {
  readonly value: string;
  readonly slots: readonly string[];
  readonly nextFocusIndex: number;
  readonly completed: boolean;
}

export function extractOtpTypedInput(previousSlotChar: string, rawDomValue: string): string {
  if (!rawDomValue) return '';
  if (!previousSlotChar || rawDomValue.length > 2) return rawDomValue;
  if (rawDomValue.length === 2) {
    if (rawDomValue[0] === previousSlotChar) return rawDomValue[1]!;
    if (rawDomValue[1] === previousSlotChar) return rawDomValue[0]!;
  }
  return rawDomValue;
}

export function resolveOtpClearSlot(
  slots: readonly string[],
  slotIndex: number,
  key: 'Backspace' | 'Delete',
): { readonly targetIndex: number; readonly nextFocusIndex: number } | null {
  if (slotIndex < 0 || slotIndex >= slots.length) return null;
  if (key === 'Backspace') {
    if (slots[slotIndex]) {
      return { targetIndex: slotIndex, nextFocusIndex: slotIndex };
    }
    if (slotIndex > 0) {
      return { targetIndex: slotIndex - 1, nextFocusIndex: slotIndex - 1 };
    }
    return null;
  }
  if (slots[slotIndex]) {
    return { targetIndex: slotIndex, nextFocusIndex: slotIndex };
  }
  if (slotIndex < slots.length - 1) {
    return { targetIndex: slotIndex + 1, nextFocusIndex: slotIndex };
  }
  return null;
}

export function applyOtpSlotEdit(
  currentValue: string | null | undefined,
  slotIndex: number,
  typed: string,
  length = 6,
  numericOnly = true,
  options: { readonly uppercase?: boolean } = {},
): EmrOtpEditResult {
  const safeLen = Math.max(1, Math.min(12, Math.floor(length)));
  const slots = [...normalizeOtpSlots(currentValue, safeLen)];
  const cleaned = [...typed]
    .filter((ch) => (numericOnly ? /^[0-9]$/.test(ch) : /^[A-Za-z0-9]$/.test(ch)))
    .map((ch) => (!numericOnly && options.uppercase ? ch.toUpperCase() : ch));

  if (cleaned.length === 0) {
    if (slotIndex >= 0 && slotIndex < safeLen) {
      slots[slotIndex] = '';
    }
    const value = encodeOtpSlots(slots);
    return {
      value,
      slots,
      nextFocusIndex: Math.max(0, slotIndex),
      completed: slots.every((s) => s.length === 1),
    };
  }

  let cursor = Math.max(0, Math.min(safeLen - 1, slotIndex));
  for (const ch of cleaned) {
    if (cursor >= safeLen) break;
    slots[cursor] = ch;
    cursor += 1;
  }
  const value = encodeOtpSlots(slots);
  return {
    value,
    slots,
    nextFocusIndex: Math.min(safeLen - 1, cursor),
    completed: slots.every((s) => s.length === 1),
  };
}

// ─────────────────────────────────────────────────────────────
// 6. Menu, SplitButton, Accordion, Breadcrumbs, ColorPicker & CopyButton
// ─────────────────────────────────────────────────────────────

export interface EmrMenuItem {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly shortcut?: string;
  readonly icon?: string;
  readonly tone?: 'default' | 'danger';
  readonly disabled?: boolean;
  readonly dividerBefore?: boolean;
}

export function canOpenEmrMenu(params: {
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly itemsCount: number;
}): boolean {
  return !params.disabled && !params.readOnly && params.itemsCount > 0;
}

export function canSelectEmrMenuItem(
  item: Pick<EmrMenuItem, 'disabled'>,
  menuDisabled = false,
  menuReadOnly = false
): boolean {
  return !menuDisabled && !menuReadOnly && !item.disabled;
}

export function getEnabledMenuIndices(items: readonly EmrMenuItem[]): readonly number[] {
  const indices: number[] = [];
  for (let i = 0; i < items.length; i += 1) {
    if (!items[i]?.disabled) indices.push(i);
  }
  return indices;
}

export function moveEmrMenuFocusIndex(
  items: readonly EmrMenuItem[],
  currentIndex: number,
  key: 'ArrowUp' | 'ArrowDown' | 'Home' | 'End'
): number {
  const enabled = getEnabledMenuIndices(items);
  if (enabled.length === 0) return -1;
  if (key === 'Home') return enabled[0]!;
  if (key === 'End') return enabled[enabled.length - 1]!;
  const pos = enabled.indexOf(currentIndex);
  if (pos < 0) {
    return key === 'ArrowUp' ? enabled[enabled.length - 1]! : enabled[0]!;
  }
  const delta = key === 'ArrowDown' ? 1 : -1;
  return enabled[(pos + delta + enabled.length) % enabled.length]!;
}

export function findEmrMenuTypeaheadIndex(
  items: readonly EmrMenuItem[],
  query: string,
  fromIndex = -1
): number {
  const q = query.trim().toLowerCase();
  if (!q || items.length === 0) return -1;
  const start = fromIndex >= 0 && fromIndex < items.length ? fromIndex + 1 : 0;
  for (let offset = 0; offset < items.length; offset += 1) {
    const idx = (start + offset) % items.length;
    const item = items[idx];
    if (!item || item.disabled) continue;
    if (item.label.trim().toLowerCase().startsWith(q)) return idx;
  }
  return -1;
}

export function canTriggerEmrSplitPrimary(params: {
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly loading?: boolean;
}): boolean {
  return !params.disabled && !params.readOnly && !params.loading;
}

export function canOpenEmrSplitMenu(params: {
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly loading?: boolean;
  readonly itemsCount: number;
}): boolean {
  return !params.disabled && !params.readOnly && !params.loading && params.itemsCount > 0;
}

export interface EmrAccordionItem {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly badge?: EmrBadge;
  readonly content?: string;
  readonly disabled?: boolean;
  readonly icon?: string;
}

export function toggleAccordionId(
  currentIds: readonly string[],
  id: string,
  multiple = false
): readonly string[] {
  const exists = currentIds.includes(id);
  if (multiple) {
    return exists ? currentIds.filter((item) => item !== id) : [...currentIds, id];
  }
  return exists ? [] : [id];
}

export function resolveAccordionExpandedIds(
  items: readonly EmrAccordionItem[],
  expandedIds: readonly string[],
  multiple = false
): readonly string[] {
  const validIds = new Set(items.map((item) => item.id));
  const unique: string[] = [];
  for (const id of expandedIds) {
    if (validIds.has(id) && !unique.includes(id)) {
      unique.push(id);
    }
  }
  return multiple ? unique : unique.slice(0, 1);
}

export function canToggleAccordionItem(
  item: Pick<EmrAccordionItem, 'disabled'>,
  disabled = false,
  readOnly = false
): boolean {
  return !disabled && !readOnly && !item.disabled;
}

export function moveAccordionFocusIndex(
  items: readonly EmrAccordionItem[],
  currentIndex: number,
  key: 'ArrowUp' | 'ArrowDown' | 'Home' | 'End'
): number {
  const enabled: number[] = [];
  for (let i = 0; i < items.length; i += 1) {
    if (!items[i]?.disabled) enabled.push(i);
  }
  if (enabled.length === 0) return -1;
  if (key === 'Home') return enabled[0]!;
  if (key === 'End') return enabled[enabled.length - 1]!;
  const pos = enabled.indexOf(currentIndex);
  if (pos < 0) {
    return key === 'ArrowUp' ? enabled[enabled.length - 1]! : enabled[0]!;
  }
  const delta = key === 'ArrowDown' ? 1 : -1;
  return enabled[(pos + delta + enabled.length) % enabled.length]!;
}

export interface EmrBreadcrumbItem {
  readonly id: string;
  readonly label: string;
  readonly href?: string;
  readonly disabled?: boolean;
  readonly icon?: string;
}

export interface EmrCollapsedBreadcrumbs {
  readonly leading: readonly EmrBreadcrumbItem[];
  readonly hidden: readonly EmrBreadcrumbItem[];
  readonly trailing: readonly EmrBreadcrumbItem[];
}

export function collapseBreadcrumbs(
  items: readonly EmrBreadcrumbItem[],
  maxItems?: number
): EmrCollapsedBreadcrumbs {
  if (!maxItems || maxItems < 2 || items.length <= maxItems) {
    return { leading: items, hidden: [], trailing: [] };
  }
  const tailCount = Math.max(1, maxItems - 1);
  return {
    leading: items.slice(0, 1),
    hidden: items.slice(1, items.length - tailCount),
    trailing: items.slice(items.length - tailCount),
  };
}

export function canSelectEmrBreadcrumb(
  item: Pick<EmrBreadcrumbItem, 'disabled'>,
  isCurrent: boolean
): boolean {
  return !item.disabled && !isCurrent;
}

export interface EmrColorSwatch {
  readonly value: string;
  readonly label: string;
}

export const DEFAULT_CLINICAL_COLOR_SWATCHES: readonly EmrColorSwatch[] = [
  { value: '#dc2626', label: 'Arterial Red' },
  { value: '#2563eb', label: 'Venous Blue' },
  { value: '#16a34a', label: 'Fluorescein Green' },
  { value: '#d97706', label: 'Amber Highlight' },
  { value: '#7c3aed', label: 'Violet Marker' },
  { value: '#0d9488', label: 'Teal Accent' },
  { value: '#db2777', label: 'Magenta' },
  { value: '#334155', label: 'Slate Ink' },
];

export function normalizeHexColor(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) {
    return withHash.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const r = withHash[1]!;
    const g = withHash[2]!;
    const b = withHash[3]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

export function isHexColorValid(raw: string | null | undefined): boolean {
  return normalizeHexColor(raw) !== null;
}

export function getContrastCheckTone(hex: string): 'light' | 'dark' {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return 'light';
  const r8 = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const g8 = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const b8 = Number.parseInt(normalized.slice(5, 7), 16) / 255;
  const toLin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * toLin(r8) + 0.7152 * toLin(g8) + 0.0722 * toLin(b8);
  return luminance > 0.179 ? 'dark' : 'light';
}

export function resolveColorSwatchTabStopIndex(
  swatches: readonly EmrColorSwatch[],
  value: string | null | undefined,
  disabled = false
): number {
  if (disabled || swatches.length === 0) return -1;
  const normalized = normalizeHexColor(value);
  if (normalized) {
    const idx = swatches.findIndex((s) => normalizeHexColor(s.value) === normalized);
    if (idx >= 0) return idx;
  }
  return 0;
}

export function moveColorSwatchFocusIndex(
  swatches: readonly EmrColorSwatch[],
  currentIndex: number,
  key: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End',
  disabled = false
): number {
  if (disabled || swatches.length === 0) return -1;
  if (key === 'Home') return 0;
  if (key === 'End') return swatches.length - 1;
  const base = currentIndex >= 0 && currentIndex < swatches.length ? currentIndex : 0;
  const delta = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1;
  return (base + delta + swatches.length) % swatches.length;
}

export function canClearEmrColorPicker(params: {
  readonly clearable?: boolean;
  readonly value: string | null | undefined;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
}): boolean {
  return Boolean(params.clearable && params.value && !params.disabled && !params.readOnly);
}

export function canCopyEmrValue(
  value: string | null | undefined,
  disabled = false
): boolean {
  return Boolean(!disabled && value && value.length > 0);
}

export const canTriggerCopy = canCopyEmrValue;

export function resolveCopyFeedbackDurationMs(ms?: number): number {
  return typeof ms === 'number' && Number.isFinite(ms) && ms >= 0 ? Math.trunc(ms) : 2000;
}

export function formatCopyButtonLabel(
  copied: boolean,
  label = 'Copy',
  copiedLabel = 'Copied'
): string {
  return copied ? copiedLabel || 'Copied' : label || 'Copy';
}

// ─────────────────────────────────────────────────────────────
// Quantity & Numeric Input Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrQuantitySize = 'sm' | 'md' | 'lg';
export type EmrQuantityNumericMode = 'decimal' | 'integer';

export function resolveQuantityStep(options: {
  readonly mode?: EmrQuantityNumericMode;
  readonly precision?: number;
  readonly step?: number;
}): number {
  const { mode = 'decimal', precision, step } = options;
  if (typeof step === 'number' && Number.isFinite(step) && step > 0) {
    return mode === 'integer' ? Math.max(1, Math.round(step)) : step;
  }
  if (mode === 'integer' || precision === 0) return 1;
  if (typeof precision === 'number' && Number.isFinite(precision) && precision > 0) {
    return Number((10 ** -Math.min(10, Math.floor(precision))).toFixed(Math.min(10, Math.floor(precision))));
  }
  return 1;
}

export function sanitizeQuantityText(
  raw: string,
  mode: EmrQuantityNumericMode,
  options?: { readonly allowNegative?: boolean },
): string {
  const allowNegative = options?.allowNegative ?? true;
  const noSpaces = raw.replace(/[\s\u00A0\u202F]+/g, '');
  const normalized =
    mode === 'decimal' && !noSpaces.includes('.') && noSpaces.includes(',')
      ? noSpaces.replace(',', '.')
      : noSpaces;
  let out = '';
  let seenDot = false;
  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (ch >= '0' && ch <= '9') {
      out += ch;
    } else if (ch === '-' && allowNegative && out.length === 0) {
      out += ch;
    } else if (ch === '.' && mode === 'decimal' && !seenDot) {
      out += ch;
      seenDot = true;
    }
  }
  return out;
}

export function normalizeQuantityPrecision(
  value: number,
  mode: EmrQuantityNumericMode,
  precision?: number,
): number {
  if (!Number.isFinite(value)) return 0;
  if (mode === 'integer') return Math.round(value);
  if (typeof precision === 'number' && Number.isFinite(precision) && precision >= 0) {
    const decimals = Math.min(10, Math.floor(precision));
    return Number(value.toFixed(decimals));
  }
  return Number(value.toPrecision(12));
}

export function parseQuantityDraft(
  raw: string,
  mode: EmrQuantityNumericMode,
  options?: { readonly allowNegative?: boolean },
): number | null | 'incomplete' {
  const clean = sanitizeQuantityText(raw.trim(), mode, options);
  if (clean === '') return null;
  if (clean === '-' || clean === '.' || clean === '-.') return 'incomplete';
  if (mode === 'decimal' && clean.endsWith('.')) return 'incomplete';
  const n = Number(clean);
  if (!Number.isFinite(n)) return 'incomplete';
  return mode === 'integer' ? Math.trunc(n) : n;
}

export function stepQuantityValue(options: {
  readonly current: number | null;
  readonly delta: 1 | -1;
  readonly mode?: EmrQuantityNumericMode;
  readonly precision?: number;
  readonly step?: number;
  readonly min?: number;
  readonly max?: number;
}): number {
  const mode = options.mode ?? 'decimal';
  const step = resolveQuantityStep({ mode, precision: options.precision, step: options.step });
  const base = options.current !== null && Number.isFinite(options.current) ? options.current : (options.min ?? 0);
  const raw = options.current === null && options.min !== undefined ? options.min : base + options.delta * step;
  const rounded = normalizeQuantityPrecision(
    raw,
    mode,
    options.precision ?? (String(step).includes('.') ? String(step).split('.')[1]?.length : undefined),
  );
  let clamped = rounded;
  if (options.min !== undefined && clamped < options.min) clamped = options.min;
  if (options.max !== undefined && clamped > options.max) clamped = options.max;
  return clamped;
}

// ─────────────────────────────────────────────────────────────
// Checkbox Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrCheckboxVariant = 'tile' | 'inline';
export type EmrCheckboxSize = 'md' | 'sm';
export type EmrCheckboxLabelPlacement = 'end' | 'start' | 'space-between';

export function resolveEmrCheckboxChecked(value?: boolean | null, checked?: boolean): boolean {
  return value !== undefined ? Boolean(value) : Boolean(checked);
}

export function resolveEmrCheckboxToggle(checked: boolean, mixed?: boolean): boolean {
  return mixed ? true : !checked;
}

export function normalizeEmrCheckboxVariant(variant?: unknown): EmrCheckboxVariant {
  return variant === 'inline' ? 'inline' : 'tile';
}

export function normalizeEmrCheckboxSize(size?: unknown): EmrCheckboxSize {
  return size === 'sm' ? 'sm' : 'md';
}

export function normalizeEmrCheckboxLabelPlacement(placement?: unknown): EmrCheckboxLabelPlacement {
  return placement === 'start' || placement === 'space-between' ? placement : 'end';
}

export function resolveEmrCheckboxAriaChecked(checked: boolean, mixed?: boolean): 'mixed' | 'true' | 'false' {
  if (mixed) return 'mixed';
  return checked ? 'true' : 'false';
}

export function canMutateEmrCheckbox(readOnly?: boolean, disabled?: boolean): boolean {
  return !readOnly && !disabled;
}

export type EmrToggleVariant = EmrCheckboxVariant;
export type EmrToggleSize = EmrCheckboxSize;
export type EmrToggleLabelPlacement = EmrCheckboxLabelPlacement;

export function resolveEmrToggleChecked(value?: boolean | null, checked?: boolean): boolean {
  return value !== undefined ? Boolean(value) : Boolean(checked);
}

export function resolveEmrToggleNext(checked: boolean): boolean {
  return !checked;
}

export function normalizeEmrToggleVariant(variant?: unknown): EmrToggleVariant {
  return normalizeEmrCheckboxVariant(variant);
}

export function normalizeEmrToggleSize(size?: unknown): EmrToggleSize {
  return normalizeEmrCheckboxSize(size);
}

export function normalizeEmrToggleLabelPlacement(placement?: unknown): EmrToggleLabelPlacement {
  return normalizeEmrCheckboxLabelPlacement(placement);
}

export function canMutateEmrToggle(readOnly?: boolean, disabled?: boolean, loading?: boolean): boolean {
  return !readOnly && !disabled && !loading;
}

export function resolveEmrToggleAriaChecked(checked: boolean): 'true' | 'false' {
  return checked ? 'true' : 'false';
}

export function resolveEmrToggleStateLabel(checked: boolean, onLabel = 'On', offLabel = 'Off'): string {
  return checked ? (onLabel || 'On') : (offLabel || 'Off');
}

export function resolveEmrToggleValidationState(params: {
  error?: string;
  warning?: string;
  invalid?: boolean;
}): { isInvalid: boolean; hasWarning: boolean } {
  const isInvalid = Boolean(params.invalid) || Boolean(params.error);
  const hasWarning = !isInvalid && Boolean(params.warning);
  return { isInvalid, hasWarning };
}

export type EmrRadioGroupOrientation = 'vertical' | 'horizontal' | 'grid';
export type EmrRadioGroupVariant = 'tile' | 'inline' | 'card' | 'pill' | 'segmented';
export type EmrRadioGroupSize = 'md' | 'sm';
export type EmrRadioGroupLabelPlacement = 'end' | 'start' | 'space-between';

export function normalizeRadioGroupVariant(variant?: unknown): EmrRadioGroupVariant {
  if (variant === 'inline' || variant === 'card' || variant === 'pill' || variant === 'segmented') {
    return variant;
  }
  return 'tile';
}

export function isRadioOptionLocked(option: EmrOption): boolean {
  return Boolean(option.disabled || option.readOnly);
}

export function resolveRadioGroupTabStopValue(
  options: readonly EmrOption[],
  value: string | null | undefined,
  groupDisabled = false,
): string | null {
  if (groupDisabled) return null;
  const enabled = options.filter((o) => !o.disabled);
  if (enabled.length === 0) return null;
  if (value !== null && value !== undefined && enabled.some((o) => o.value === value)) {
    return value;
  }
  return enabled[0]!.value;
}

export function moveRadioGroupFocusIndex(
  options: readonly EmrOption[],
  currentIndex: number,
  direction: 1 | -1,
  groupDisabled = false,
): number {
  const len = options.length;
  if (groupDisabled || len === 0) return -1;
  let idx = currentIndex >= 0 && currentIndex < len ? currentIndex : direction === 1 ? -1 : 0;
  for (let step = 0; step < len; step += 1) {
    idx = (idx + direction + len) % len;
    if (!options[idx]!.disabled) {
      return idx;
    }
  }
  return -1;
}

export function canClearRadioGroupValue(
  value: string | null | undefined,
  options: readonly EmrOption[],
  clearable = false,
  groupReadOnly = false,
  groupDisabled = false,
): boolean {
  if (!clearable || groupReadOnly || groupDisabled) return false;
  if (value === null || value === undefined || value === '') return false;
  const selectedOpt = options.find((o) => o.value === value);
  if (selectedOpt && isRadioOptionLocked(selectedOpt)) return false;
  return true;
}

export function resolveEmrRadioNext(
  currentValue: string | null | undefined,
  optionValue: string,
  allowDeselect?: boolean,
): string | null {
  if (allowDeselect && currentValue === optionValue) return null;
  return optionValue;
}

// ─────────────────────────────────────────────────────────────
// Badge Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

const VALID_BADGE_TONES = new Set<EmrTone>(['neutral', 'info', 'success', 'warning', 'danger']);
const VALID_BADGE_VARIANTS = new Set<EmrBadgeVariant>(['soft', 'solid', 'outline']);
const VALID_BADGE_SIZES = new Set<EmrBadgeSize>(['sm', 'md']);
const VALID_BADGE_SHAPES = new Set<EmrBadgeShape>(['pill', 'rounded']);

export function normalizeEmrBadgeTone(tone?: string | null): EmrTone {
  return tone && VALID_BADGE_TONES.has(tone as EmrTone) ? (tone as EmrTone) : 'neutral';
}

export function normalizeEmrBadgeVariant(variant?: string | null): EmrBadgeVariant {
  return variant && VALID_BADGE_VARIANTS.has(variant as EmrBadgeVariant) ? (variant as EmrBadgeVariant) : 'soft';
}

export function normalizeEmrBadgeSize(size?: string | null): EmrBadgeSize {
  return size && VALID_BADGE_SIZES.has(size as EmrBadgeSize) ? (size as EmrBadgeSize) : 'md';
}

export function normalizeEmrBadgeShape(shape?: string | null): EmrBadgeShape {
  return shape && VALID_BADGE_SHAPES.has(shape as EmrBadgeShape) ? (shape as EmrBadgeShape) : 'pill';
}

export function formatEmrBadgeCount(
  count: number | undefined,
  maxCount = 99,
  showZero = false,
): { visible: boolean; text: string | null } {
  if (typeof count !== 'number' || !Number.isFinite(count)) {
    return { visible: true, text: null };
  }
  const intCount = Math.max(0, Math.trunc(count));
  if (intCount === 0 && !showZero) {
    return { visible: false, text: null };
  }
  const resolvedMax = typeof maxCount === 'number' && Number.isFinite(maxCount) && maxCount >= 1 ? Math.trunc(maxCount) : 99;
  return {
    visible: true,
    text: intCount > resolvedMax ? `${resolvedMax}+` : String(intCount),
  };
}

// ─────────────────────────────────────────────────────────────
// Tabs Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrTabsVariant = 'underline' | 'pill' | 'soft';
export type EmrTabsSize = 'sm' | 'md' | 'lg';
export type EmrTabsOrientation = 'horizontal' | 'vertical';
export type EmrTabsActivationMode = 'automatic' | 'manual';
export type EmrTabsIconPosition = 'start' | 'end';

export interface EmrTabOption extends Omit<EmrOption, 'badge'> {
  readonly icon?: string;
  readonly badge?: EmrBadge | string | number;
  readonly badgeTone?: EmrTone;
  readonly panelId?: string;
}

export function resolveActiveTabValue(
  _tabs: readonly EmrTabOption[],
  value?: string | null,
  legacyActive?: string | null,
): string {
  if (value !== undefined && value !== null) return value;
  if (legacyActive !== undefined && legacyActive !== null) return legacyActive;
  return '';
}

export function resolveTabStopIndex(
  tabs: readonly EmrTabOption[],
  activeValue: string,
  groupDisabled = false,
): number {
  if (groupDisabled || tabs.length === 0) return -1;
  const activeIdx = tabs.findIndex((t) => t.value === activeValue && !t.disabled);
  if (activeIdx >= 0) return activeIdx;
  return tabs.findIndex((t) => !t.disabled);
}

export function getNextTabIndex(
  tabs: readonly EmrTabOption[],
  currentIndex: number,
  key: string,
  options: { readonly orientation: EmrTabsOrientation; readonly loop: boolean },
): number | null {
  const { orientation, loop } = options;
  const isHorizontal = orientation === 'horizontal';
  const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
  const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

  const enabledIndices = tabs
    .map((t, i) => (t.disabled ? -1 : i))
    .filter((i) => i >= 0);
  if (enabledIndices.length === 0) return null;

  if (key === 'Home') return enabledIndices[0]!;
  if (key === 'End') return enabledIndices[enabledIndices.length - 1]!;
  if (key !== prevKey && key !== nextKey) return null;

  const pos = enabledIndices.indexOf(currentIndex);
  if (pos < 0) return enabledIndices[0]!;

  const delta = key === nextKey ? 1 : -1;
  const nextPos = pos + delta;
  if (nextPos < 0) return loop ? enabledIndices[enabledIndices.length - 1]! : enabledIndices[0]!;
  if (nextPos >= enabledIndices.length) return loop ? enabledIndices[0]! : enabledIndices[enabledIndices.length - 1]!;
  return enabledIndices[nextPos]!;
}

export function canActivateTab(
  tab: EmrTabOption | undefined,
  groupDisabled: boolean,
  readOnly: boolean,
): boolean {
  return Boolean(tab && !tab.disabled && !groupDisabled && !readOnly);
}

// ─────────────────────────────────────────────────────────────
// Likert Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export interface EmrLikertAnchor {
  readonly value: number;
  readonly label: string;
  readonly assistiveLabel?: string;
}

export type EmrLikertSize = 'sm' | 'md' | 'lg';

export interface EmrLikertPoint {
  readonly value: number;
  readonly label: string;
  readonly assistiveLabel: string;
  readonly selected: boolean;
  readonly tone: EmrTone | undefined;
  readonly anchorLabel: string | undefined;
}

export interface EmrLikertAnchorsSummary {
  readonly start: EmrLikertAnchor | null;
  readonly mid: EmrLikertAnchor | null;
  readonly end: EmrLikertAnchor | null;
}

export function buildLikertPoints(options: {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly value?: number | null;
  readonly anchors?: readonly EmrLikertAnchor[];
  readonly tone?: EmrTone;
  readonly optionTones?: Readonly<Record<number, EmrTone>>;
  readonly maxPoints?: number;
}): readonly EmrLikertPoint[] {
  const min = Number.isFinite(options.min) ? Math.trunc(options.min!) : 0;
  const max = Number.isFinite(options.max) ? Math.trunc(options.max!) : 10;
  if (max < min) return [];
  const step = Number.isFinite(options.step) && options.step! >= 1 ? Math.trunc(options.step!) : 1;
  const cap = options.maxPoints ?? 101;
  const anchorMap = new Map<number, EmrLikertAnchor>();
  for (const a of options.anchors ?? []) {
    anchorMap.set(a.value, a);
  }
  const points: EmrLikertPoint[] = [];
  for (let n = min; n <= max && points.length < cap; n += step) {
    const anchor = anchorMap.get(n);
    const label = String(n);
    const assistiveText = anchor ? (anchor.assistiveLabel ?? anchor.label) : '';
    points.push({
      value: n,
      label,
      assistiveLabel: assistiveText ? `${label} — ${assistiveText}` : label,
      selected: options.value === n,
      tone: options.optionTones?.[n] ?? options.tone,
      anchorLabel: anchor?.label,
    });
  }
  return points;
}

export function resolveLikertAnchors(
  points: readonly EmrLikertPoint[],
  anchors: readonly EmrLikertAnchor[] = [],
): EmrLikertAnchorsSummary {
  if (points.length === 0 || anchors.length === 0) {
    return { start: null, mid: null, end: null };
  }
  const firstVal = points[0]!.value;
  const lastVal = points[points.length - 1]!.value;
  const midVal = points.length > 2 ? points[Math.floor(points.length / 2)]!.value : undefined;
  const byVal = new Map(anchors.map((a) => [a.value, a]));
  return {
    start: byVal.get(firstVal) ?? null,
    mid: midVal !== undefined && midVal !== firstVal && midVal !== lastVal ? (byVal.get(midVal) ?? null) : null,
    end: lastVal !== firstVal ? (byVal.get(lastVal) ?? null) : null,
  };
}

export function resolveLikertTabStopIndex(
  points: readonly EmrLikertPoint[],
  value: number | null | undefined,
  disabled = false,
): number {
  if (disabled || points.length === 0) return -1;
  const idx = points.findIndex((p) => p.value === value);
  return idx >= 0 ? idx : 0;
}

export function resolveNextLikertValue(
  points: readonly EmrLikertPoint[],
  currentValue: number | null | undefined,
  key: string,
  options: { readonly loop?: boolean } = {},
): number | null {
  if (points.length === 0) return null;
  const loop = options.loop ?? true;
  if (key === 'Home') return points[0]!.value;
  if (key === 'End') return points[points.length - 1]!.value;
  const isPrev = key === 'ArrowLeft' || key === 'ArrowUp';
  const isNext = key === 'ArrowRight' || key === 'ArrowDown';
  if (!isPrev && !isNext) return null;

  const curIdx = points.findIndex((p) => p.value === currentValue);
  if (curIdx < 0) return isNext ? points[0]!.value : points[points.length - 1]!.value;
  const nextIdx = curIdx + (isNext ? 1 : -1);
  if (nextIdx < 0) return loop ? points[points.length - 1]!.value : points[0]!.value;
  if (nextIdx >= points.length) return loop ? points[0]!.value : points[points.length - 1]!.value;
  return points[nextIdx]!.value;
}

export function canMutateLikert(disabled: boolean, readOnly: boolean): boolean {
  return !disabled && !readOnly;
}

// ─────────────────────────────────────────────────────────────
// VAS (Visual Analogue Scale) Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrVasOrientation = 'horizontal' | 'vertical';
export type EmrVasSize = 'sm' | 'md' | 'lg';

export interface EmrVasAnchor {
  readonly value: number;
  readonly label: string;
}

export interface EmrVasObjectAnchors {
  readonly minLabel?: string;
  readonly midLabel?: string;
  readonly maxLabel?: string;
}

export type EmrVasAnchorsProp = readonly EmrVasAnchor[] | EmrVasObjectAnchors;

export interface EmrVasAnchorsSummary {
  readonly minLabel: string | null;
  readonly midLabel: string | null;
  readonly maxLabel: string | null;
}

export const EMR_VAS_MAX_TICKS = 400;
export const EMR_VAS_TRACK_INSET_PX = 14;

export interface EmrVasTick {
  readonly value: number;
  readonly percent: number;
  readonly major: boolean;
  readonly label: string | null;
}

export function resolveVasStep(min: number, max: number, step?: number): number {
  if (typeof step === 'number' && Number.isFinite(step) && step >= 0) return step;
  return Math.abs(max - min) <= 20 ? 0.1 : 1;
}

export function vasPercent(value: number, min: number, max: number): number {
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return 0;
  return Math.max(0, Math.min(100, ((value - min) / span) * 100));
}

export function snapVasValue(raw: number, min: number, max: number, step: number): number {
  const clamped = Math.max(min, Math.min(max, raw));
  if (!Number.isFinite(step) || step <= 0) return Number(clamped.toFixed(4));
  const snapped = min + Math.round((clamped - min) / step) * step;
  const bounded = Math.max(min, Math.min(max, snapped));
  return Number(bounded.toFixed(6));
}

export function vasValueFromOffset(
  offset: number,
  length: number,
  min: number,
  max: number,
  step: number,
  vertical = false,
  inset = EMR_VAS_TRACK_INSET_PX,
): number {
  const effectiveLength = Math.max(1, length - inset * 2);
  const clampedOffset = Math.max(inset, Math.min(length - inset, offset));
  const rawFraction = (clampedOffset - inset) / effectiveLength;
  const fraction = vertical ? 1 - rawFraction : rawFraction;
  return snapVasValue(min + fraction * (max - min), min, max, step);
}

export function resolveVasAnchors(
  anchors: EmrVasAnchorsProp | undefined,
  min: number,
  max: number,
): EmrVasAnchorsSummary {
  if (!anchors) return { minLabel: null, midLabel: null, maxLabel: null };
  if (!Array.isArray(anchors)) {
    const obj = anchors as EmrVasObjectAnchors;
    return {
      minLabel: obj.minLabel ?? null,
      midLabel: obj.midLabel ?? null,
      maxLabel: obj.maxLabel ?? null,
    };
  }
  if (anchors.length === 0) return { minLabel: null, midLabel: null, maxLabel: null };
  const midTarget = min + (max - min) / 2;
  const span = Math.max(1e-6, Math.abs(max - min));
  let minLabel: string | null = null;
  let midLabel: string | null = null;
  let maxLabel: string | null = null;
  for (const a of anchors) {
    if (Math.abs(a.value - min) <= span * 0.05) {
      minLabel = a.label;
    } else if (Math.abs(a.value - max) <= span * 0.05) {
      maxLabel = a.label;
    } else if (Math.abs(a.value - midTarget) <= span * 0.15) {
      midLabel = a.label;
    }
  }
  return { minLabel, midLabel, maxLabel };
}

export function formatVasValue(
  value: number | null | undefined,
  step: number,
  unmarkedLabel = 'Unmarked',
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return unmarkedLabel;
  if (step > 0 && step < 1) {
    const decimals = Math.min(3, Math.max(1, Math.ceil(-Math.log10(step))));
    return value.toFixed(decimals);
  }
  return String(Number(value.toFixed(2)));
}

export function canMutateVas(disabled: boolean, readOnly: boolean): boolean {
  return !disabled && !readOnly;
}

export function resolveVasTicks(
  min: number,
  max: number,
  majorInterval = 10,
  minorInterval?: number,
  maxTicks = EMR_VAS_MAX_TICKS,
): readonly EmrVasTick[] {
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return [];
  const major = Number.isFinite(majorInterval) && majorInterval > 0 ? majorInterval : span;
  const minor =
    typeof minorInterval === 'number' && Number.isFinite(minorInterval) && minorInterval > 0
      ? minorInterval
      : major;
  const step = Math.min(major, minor);
  const count = Math.min(maxTicks, Math.floor(span / step + 1e-6) + 1);
  const ticks: EmrVasTick[] = [];
  for (let i = 0; i < count; i += 1) {
    const val = Number((min + i * step).toFixed(6));
    if (val > max + 1e-6) break;
    const isMajor = Math.abs(((val - min) / major) - Math.round((val - min) / major)) < 1e-4;
    ticks.push({
      value: val,
      percent: vasPercent(val, min, max),
      major: isMajor,
      label: isMajor ? String(Number(val.toFixed(4))) : null,
    });
  }
  return ticks;
}

export function resolveVasKeyValue(
  key: string,
  currentValue: number | null | undefined,
  options: { readonly min: number; readonly max: number; readonly step: number; readonly majorInterval?: number },
): number | null {
  const { min, max, step, majorInterval = 10 } = options;
  const fine = step > 0 ? step : Math.abs(max - min) <= 20 ? 0.1 : 1;
  const coarse = majorInterval > 0 ? majorInterval : fine * 10;
  const cur = currentValue !== null && currentValue !== undefined && Number.isFinite(currentValue) ? currentValue : min;
  switch (key) {
    case 'Home':
      return min;
    case 'End':
      return max;
    case 'ArrowRight':
    case 'ArrowUp':
      return snapVasValue(currentValue == null ? min : cur + fine, min, max, step);
    case 'ArrowLeft':
    case 'ArrowDown':
      return snapVasValue(currentValue == null ? max : cur - fine, min, max, step);
    case 'PageUp':
      return snapVasValue(cur + coarse, min, max, step);
    case 'PageDown':
      return snapVasValue(cur - coarse, min, max, step);
    default:
      return null;
  }
}

export function resolveNextRadioOptionValue<Value extends string = string>(
  options: readonly EmrOption<Value>[],
  currentValue: Value | null | undefined,
  direction: 1 | -1,
): Value | null {
  const enabled = options.filter((o) => !o.disabled);
  if (enabled.length === 0) return null;
  const idx = enabled.findIndex((o) => o.value === currentValue);
  if (idx < 0) {
    return direction > 0 ? enabled[0].value : enabled[enabled.length - 1].value;
  }
  const nextIdx = (idx + direction + enabled.length) % enabled.length;
  return enabled[nextIdx].value;
}

// ─────────────────────────────────────────────────────────────
// Search Select Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrSearchSelectFilterMode = 'remote' | 'local' | 'none';
export type EmrSearchSelectSize = 'md' | 'sm';
export type EmrControlVariant = 'outline' | 'filled' | 'subtle';

export interface EmrMatchHighlightSegment {
  readonly text: string;
  readonly matched: boolean;
}

export interface EmrScoredOption<Value extends string = string> {
  readonly option: EmrOption<Value>;
  readonly score: number;
  readonly isBestMatch: boolean;
}

function escapeSearchRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function rankAndFilterOptions<Value extends string = string>(
  options: readonly EmrOption<Value>[],
  query: string,
  filterMode: EmrSearchSelectFilterMode = 'local',
): readonly EmrScoredOption<Value>[] {
  const trimmed = query.trim();
  if (!trimmed || filterMode === 'none' || filterMode === 'remote') {
    return options.map((option) => ({ option, score: 0, isBestMatch: false }));
  }

  const q = trimmed.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  const wordBoundaryRe = new RegExp(`(?:^|[\\s\\-_/:(.,])${escapeSearchRegExp(q)}`);

  const scored: { option: EmrOption<Value>; score: number }[] = [];
  for (const option of options) {
    const label = option.label.toLowerCase();
    const value = option.value.toLowerCase();
    const code = (option.code ?? '').toLowerCase();
    const desc = (option.description ?? '').toLowerCase();
    const group = (option.group ?? '').toLowerCase();
    const keywords = (option.keywords ?? []).map((k) => k.toLowerCase());

    let tier = 0;
    if (label === q) {
      tier = 1000;
    } else if (code === q || value === q) {
      tier = 950;
    } else if (label.startsWith(q)) {
      tier = 800;
    } else if (wordBoundaryRe.test(label)) {
      tier = 650;
    } else if (code.startsWith(q) || value.startsWith(q)) {
      tier = 600;
    } else if (keywords.some((k) => k === q || k.startsWith(q))) {
      tier = 500;
    } else {
      const labelIdx = label.indexOf(q);
      if (labelIdx >= 0) {
        tier = Math.max(1, 400 - labelIdx);
      } else if (code.includes(q) || value.includes(q)) {
        tier = 320;
      } else if (desc.includes(q) || group.includes(q) || keywords.some((k) => k.includes(q))) {
        tier = 180;
      }
    }

    let multiTokenBonus = 0;
    if (tokens.length > 1) {
      const haystack = [label, code, value, desc, group, ...keywords].join(' ');
      if (tokens.every((t) => haystack.includes(t))) {
        multiTokenBonus = 100;
      }
    }

    const total = tier + multiTokenBonus;
    if (total > 0) {
      scored.push({ option, score: total });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  let assignedBest = false;
  return scored.map((entry) => {
    if (!assignedBest && !entry.option.disabled) {
      assignedBest = true;
      return { option: entry.option, score: entry.score, isBestMatch: true };
    }
    return { option: entry.option, score: entry.score, isBestMatch: false };
  });
}

export function splitMatchHighlightSegments(
  text: string,
  query: string,
): readonly EmrMatchHighlightSegment[] {
  if (!text) return [];
  const trimmed = query.trim();
  if (!trimmed) return [{ text, matched: false }];

  const buildSegments = (pattern: RegExp): readonly EmrMatchHighlightSegment[] => {
    const segments: EmrMatchHighlightSegment[] = [];
    let lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const idx = match.index ?? 0;
      const val = match[0];
      if (!val) continue;
      if (idx > lastIndex) {
        segments.push({ text: text.slice(lastIndex, idx), matched: false });
      }
      segments.push({ text: val, matched: true });
      lastIndex = idx + val.length;
    }
    if (lastIndex === 0) return [];
    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), matched: false });
    }
    return segments;
  };

  const fullPattern = new RegExp(escapeSearchRegExp(trimmed), 'gi');
  const fullSegments = buildSegments(fullPattern);
  if (fullSegments.length > 0) return fullSegments;

  const tokens = Array.from(new Set(trimmed.split(/\s+/).filter(Boolean))).sort(
    (a, b) => b.length - a.length,
  );
  if (tokens.length > 1) {
    const tokenPattern = new RegExp(tokens.map(escapeSearchRegExp).join('|'), 'gi');
    const tokenSegments = buildSegments(tokenPattern);
    if (tokenSegments.length > 0) return tokenSegments;
  }

  return [{ text, matched: false }];
}

export function resolveSearchSelectValues<Value extends string = string>(
  multiple: boolean,
  value?: Value | readonly Value[] | null,
  selected: readonly EmrOption<Value>[] = [],
): readonly Value[] {
  if (Array.isArray(value)) {
    return multiple ? [...value] : value.length > 0 ? [value[0]] : [];
  }
  if (typeof value === 'string' && value !== '') {
    return [value as Value];
  }
  if (selected.length > 0) {
    return multiple ? selected.map((o) => o.value) : [selected[0].value];
  }
  return [];
}

export function resolveDefaultActiveOptionIndex<Value extends string = string>(
  options: readonly EmrOption<Value>[],
  selectedValues: readonly string[],
  query: string,
  autoHighlight = true,
): number {
  if (options.length === 0) return -1;
  if (query.trim().length > 0 && autoHighlight) {
    return options.findIndex((o) => !o.disabled);
  }
  if (selectedValues.length > 0) {
    const selectedSet = new Set(selectedValues);
    const idx = options.findIndex((o) => !o.disabled && selectedSet.has(o.value));
    if (idx >= 0) return idx;
  }
  return -1;
}

export function findNextEnabledSearchOptionIndex<Value extends string = string>(
  options: readonly EmrOption<Value>[],
  currentIndex: number,
  key: string,
): number | null {
  const len = options.length;
  if (len === 0) return null;
  const hasEnabled = options.some((o) => !o.disabled);
  if (!hasEnabled) return null;

  if (key === 'Home') {
    return options.findIndex((o) => !o.disabled);
  }
  if (key === 'End') {
    for (let i = len - 1; i >= 0; i -= 1) {
      if (!options[i].disabled) return i;
    }
    return null;
  }
  if (key === 'ArrowDown') {
    const start = currentIndex < 0 ? 0 : (currentIndex + 1) % len;
    for (let step = 0; step < len; step += 1) {
      const idx = (start + step) % len;
      if (!options[idx].disabled) return idx;
    }
    return null;
  }
  if (key === 'ArrowUp') {
    const start = currentIndex < 0 ? len - 1 : (currentIndex - 1 + len) % len;
    for (let step = 0; step < len; step += 1) {
      const idx = (start - step + len) % len;
      if (!options[idx].disabled) return idx;
    }
    return null;
  }
  return null;
}

export function formatCreatableLabel(template: string, query: string): string {
  const base = template && template.trim().length > 0 ? template : 'Create "{query}"';
  return base.replace(/\{query\}/g, query.trim());
}

export function resolveSearchSelectDisplayValue<Value extends string = string>(params: {
  readonly filterMode: EmrSearchSelectFilterMode;
  readonly isActivelyTyping: boolean;
  readonly query: string;
  readonly value?: Value | readonly Value[] | null;
  readonly selected?: readonly EmrOption<Value>[];
  readonly options?: readonly EmrOption<Value>[];
  readonly multiple?: boolean;
}): string {
  const { filterMode, isActivelyTyping, query, value, selected = [], options = [], multiple = false } = params;
  if (multiple || isActivelyTyping) return query;
  if (query.length > 0) return query;
  const singleValue = Array.isArray(value) ? (value[0] ?? null) : value;
  if (singleValue !== null && singleValue !== undefined && singleValue !== '') {
    const match = options.find((o) => o.value === singleValue) ?? selected.find((o) => o.value === singleValue);
    return match?.label ?? String(singleValue);
  }
  if ((filterMode === 'local' || filterMode === 'none') && selected.length === 1) {
    return selected[0].label;
  }
  return '';
}

export function resolveComboboxDisplayValue<Value extends string = string>(params: {
  readonly isActivelyTyping: boolean;
  readonly query: string;
  readonly value?: Value | null;
  readonly options?: readonly EmrOption<Value>[];
}): string {
  const { isActivelyTyping, query, value, options = [] } = params;
  if (isActivelyTyping) return query;
  if (value !== null && value !== undefined && value !== '') {
    const match = options.find((o) => o.value === value);
    return match?.label ?? String(value);
  }
  return '';
}

export function resolveCustomSearchCandidate<Value extends string = string>(
  query: string,
  options: readonly EmrOption<Value>[],
  allowCustomValue: boolean,
  minQueryLength = 0,
): string | null {
  if (!allowCustomValue) return null;
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < Math.max(0, minQueryLength)) return null;
  const lower = trimmed.toLowerCase();
  const exactMatch = options.some(
    (o) =>
      o.value.toLowerCase() === lower ||
      o.label.toLowerCase() === lower ||
      (o.code ? o.code.toLowerCase() === lower : false),
  );
  return exactMatch ? null : trimmed;
}

export function isSearchOptionSelected<Value extends string = string>(
  optionValue: Value,
  value?: Value | readonly Value[] | null,
  selected: readonly EmrOption<Value>[] = [],
): boolean {
  if (Array.isArray(value)) {
    if (value.includes(optionValue)) return true;
  } else if (value !== null && value !== undefined && value !== '' && value === optionValue) {
    return true;
  }
  return selected.some((o) => o.value === optionValue);
}

export function hasSearchSelectClearableValue<Value extends string = string>(params: {
  readonly clearable: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly value?: Value | readonly Value[] | null;
  readonly selected?: readonly EmrOption<Value>[];
  readonly query?: string;
}): boolean {
  const { clearable, disabled, readOnly, value, selected = [], query = '' } = params;
  if (!clearable || disabled || readOnly) return false;
  const hasVal = Array.isArray(value)
    ? value.length > 0
    : value !== null && value !== undefined && value !== '';
  return Boolean(hasVal || selected.length > 0 || query.length > 0);
}

export function resolveNextSearchOptionIndex(
  currentIndex: number,
  key: string,
  totalCount: number,
): number | null {
  if (totalCount <= 0) return null;
  switch (key) {
    case 'ArrowDown':
      return currentIndex < 0 ? 0 : Math.min(totalCount - 1, currentIndex + 1);
    case 'ArrowUp':
      return currentIndex < 0 ? totalCount - 1 : Math.max(0, currentIndex - 1);
    case 'Home':
      return 0;
    case 'End':
      return totalCount - 1;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Time Input Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrTimePrecision = 'minute' | 'second';
export type EmrTimeHourCycle = '24' | '12';
export type EmrTimeSize = 'sm' | 'md' | 'lg';

export type EmrTimeTextParse =
  | { readonly kind: 'empty' }
  | { readonly kind: 'valid'; readonly value: string }
  | { readonly kind: 'draft' };

function pad2Time(n: number): string {
  return String(n).padStart(2, '0');
}

function normalizeTimeComparison(val: string | null | undefined): string | null {
  if (!val) return null;
  const m = val.trim().match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  return `${m[1]}:${m[2]}:${m[3] ?? '00'}`;
}

export function sanitizeTimeText(
  raw: string,
  options: { readonly precision?: EmrTimePrecision; readonly hourCycle?: EmrTimeHourCycle } = {},
): string {
  const { hourCycle = '24' } = options;
  if (hourCycle === '12') {
    return raw.replace(/[^\d:. aApPmM]/g, '');
  }
  return raw.replace(/[^\d:. ]/g, '');
}

export function parseTimeText(
  raw: string,
  options: { readonly precision?: EmrTimePrecision; readonly hourCycle?: EmrTimeHourCycle } = {},
): EmrTimeTextParse {
  const { precision = 'minute', hourCycle = '24' } = options;
  const trimmed = raw.trim();
  if (!trimmed) return { kind: 'empty' };

  const m12 = trimmed.match(/^(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([aApP]\.?[mM]\.?)$/);
  if (m12) {
    let hh = Number(m12[1]);
    const mm = Number(m12[2]);
    const ss = m12[3] !== undefined ? Number(m12[3]) : 0;
    const isPm = m12[4]!.toLowerCase().startsWith('p');
    if (hh < 1 || hh > 12 || mm > 59 || ss > 59) return { kind: 'draft' };
    if (hh === 12) hh = isPm ? 12 : 0;
    else if (isPm) hh += 12;
    const base = `${pad2Time(hh)}:${pad2Time(mm)}`;
    return { kind: 'valid', value: precision === 'second' ? `${base}:${pad2Time(ss)}` : base };
  }

  if (hourCycle === '12') {
    return { kind: 'draft' };
  }

  const m24 = trimmed.match(/^(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?$/);
  if (!m24) return { kind: 'draft' };
  const hh = Number(m24[1]);
  const mm = Number(m24[2]);
  const ss = m24[3] !== undefined ? Number(m24[3]) : 0;
  if (hh > 23 || mm > 59 || ss > 59) return { kind: 'draft' };
  if (precision === 'second' && m24[3] === undefined) {
    return { kind: 'valid', value: `${pad2Time(hh)}:${pad2Time(mm)}:00` };
  }
  const base = `${pad2Time(hh)}:${pad2Time(mm)}`;
  return { kind: 'valid', value: precision === 'second' ? `${base}:${pad2Time(ss)}` : base };
}

export function formatTimeDisplay(
  value: string | null | undefined,
  options: { readonly precision?: EmrTimePrecision; readonly hourCycle?: EmrTimeHourCycle } = {},
): string {
  const { precision = 'minute', hourCycle = '24' } = options;
  if (!value) return '';
  const m = value.trim().match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return value;
  const hh24 = Number(m[1]);
  const mm = m[2]!;
  const ss = m[3] ?? '00';
  if (hourCycle === '12') {
    const period = hh24 >= 12 ? 'PM' : 'AM';
    const hh12 = hh24 % 12 === 0 ? 12 : hh24 % 12;
    const base = `${pad2Time(hh12)}:${mm}`;
    return precision === 'second' ? `${base}:${ss} ${period}` : `${base} ${period}`;
  }
  const base = `${pad2Time(hh24)}:${mm}`;
  return precision === 'second' ? `${base}:${ss}` : base;
}

export function isTimeOutOfBounds(
  value: string | null | undefined,
  min?: string,
  max?: string,
): boolean {
  const norm = normalizeTimeComparison(value);
  if (!norm) return false;
  const normMin = normalizeTimeComparison(min);
  const normMax = normalizeTimeComparison(max);
  if (normMin && norm < normMin) return true;
  if (normMax && norm > normMax) return true;
  return false;
}

export function resolveTimePlaceholder(
  precision: EmrTimePrecision = 'minute',
  hourCycle: EmrTimeHourCycle = '24',
  explicit?: string,
): string {
  if (explicit && explicit.trim()) return explicit;
  if (hourCycle === '12') {
    return precision === 'second' ? 'hh:mm:ss AM' : 'hh:mm AM';
  }
  return precision === 'second' ? 'hh:mm:ss' : 'hh:mm';
}

// ─────────────────────────────────────────────────────────────
// DateTime Input Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrDateTimeDisplayFormat = 'dd-mm-yyyy' | 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'mm/dd/yyyy';
export type EmrDateTimePrecision = 'minute' | 'second';
export type EmrDateTimeHourCycle = '24' | '12';
export type EmrDateTimeWireFormat = 'utc' | 'local';
export type EmrDateTimeSize = 'sm' | 'md' | 'lg';

function pad4Year(n: number): string {
  return String(n).padStart(4, '0');
}

function isValidYmd(y: number, m: number, d: number): boolean {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (y < 1 || y > 9999 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function sanitizeDateDisplayText(raw: string, format: EmrDateTimeDisplayFormat = 'dd-mm-yyyy'): string {
  const sep = format.includes('/') ? '/' : '-';
  return raw.replace(/[^\d/-]/g, '').replace(/[/-]/g, sep);
}

export function formatIsoDateDisplay(
  isoDate: string | null | undefined,
  format: EmrDateTimeDisplayFormat = 'dd-mm-yyyy',
): string {
  if (!isoDate) return '';
  const m = isoDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  const [, yyyy, mm, dd] = m;
  switch (format) {
    case 'dd/mm/yyyy':
      return `${dd}/${mm}/${yyyy}`;
    case 'mm/dd/yyyy':
      return `${mm}/${dd}/${yyyy}`;
    case 'yyyy-mm-dd':
      return `${yyyy}-${mm}-${dd}`;
    case 'dd-mm-yyyy':
    default:
      return `${dd}-${mm}-${yyyy}`;
  }
}

export function parseDateDisplayText(
  raw: string,
  format: EmrDateTimeDisplayFormat = 'dd-mm-yyyy',
): { readonly kind: 'empty' } | { readonly kind: 'valid'; readonly value: string } | { readonly kind: 'draft' } {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: 'empty' };
  const parts = trimmed.split(/[/-]/);
  if (parts.length !== 3 || parts.some((p) => !/^\d+$/.test(p))) return { kind: 'draft' };

  let y: number;
  let m: number;
  let d: number;
  if (format === 'yyyy-mm-dd') {
    if (parts[0]!.length !== 4) return { kind: 'draft' };
    y = Number(parts[0]);
    m = Number(parts[1]);
    d = Number(parts[2]);
  } else if (format === 'mm/dd/yyyy') {
    if (parts[2]!.length !== 4) return { kind: 'draft' };
    m = Number(parts[0]);
    d = Number(parts[1]);
    y = Number(parts[2]);
  } else {
    if (parts[2]!.length !== 4) return { kind: 'draft' };
    d = Number(parts[0]);
    m = Number(parts[1]);
    y = Number(parts[2]);
  }
  if (!isValidYmd(y, m, d)) return { kind: 'draft' };
  return { kind: 'valid', value: `${pad4Year(y)}-${pad2Time(m)}-${pad2Time(d)}` };
}

export function splitDateTimeParts(
  value: string | null | undefined,
  timePrecision: EmrDateTimePrecision = 'minute',
): { readonly date: string | null; readonly time: string | null } {
  if (!value) return { date: null, time: null };
  const trimmed = value.trim();
  if (!trimmed) return { date: null, time: null };
  const zoned = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  if (!zoned) {
    const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(trimmed);
    if (!m) return { date: null, time: null };
    const hm = `${m[2]}:${m[3]}`;
    return {
      date: m[1]!,
      time: timePrecision === 'second' ? `${hm}:${m[4] ?? '00'}` : hm,
    };
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return { date: null, time: null };
  const date = `${pad4Year(d.getFullYear())}-${pad2Time(d.getMonth() + 1)}-${pad2Time(d.getDate())}`;
  const hm = `${pad2Time(d.getHours())}:${pad2Time(d.getMinutes())}`;
  const time = timePrecision === 'second' ? `${hm}:${pad2Time(d.getSeconds())}` : hm;
  return { date, time };
}

export function joinDateTimeParts(
  dateIso: string | null | undefined,
  time24: string | null | undefined,
  wireFormat: EmrDateTimeWireFormat = 'utc',
  timePrecision: EmrDateTimePrecision = 'minute',
): string | null {
  if (!dateIso || !time24) return null;
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso.trim());
  const tm = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time24.trim());
  if (!dm || !tm) return null;
  const sec = tm[3] ?? '00';
  const localStr =
    timePrecision === 'second'
      ? `${dm[1]}-${dm[2]}-${dm[3]}T${tm[1]}:${tm[2]}:${sec}`
      : `${dm[1]}-${dm[2]}-${dm[3]}T${tm[1]}:${tm[2]}`;
  if (wireFormat === 'local') return localStr;
  const instant = new Date(
    Number(dm[1]),
    Number(dm[2]) - 1,
    Number(dm[3]),
    Number(tm[1]),
    Number(tm[2]),
    Number(sec),
  );
  if (Number.isNaN(instant.getTime())) return null;
  return instant.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function isDateTimeOutOfBounds(
  value: string | null | undefined,
  min?: string,
  max?: string,
  wireFormat: EmrDateTimeWireFormat = 'utc',
): boolean {
  if (!value) return false;
  if (!min && !max) return false;
  if (wireFormat === 'utc') {
    const t = Date.parse(value);
    if (Number.isNaN(t)) return false;
    if (min) {
      const tMin = Date.parse(min);
      if (!Number.isNaN(tMin) && t < tMin) return true;
    }
    if (max) {
      const tMax = Date.parse(max);
      if (!Number.isNaN(tMax) && t > tMax) return true;
    }
    return false;
  }
  const normLocal = (v?: string) => {
    if (!v) return null;
    const m = v.trim().match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    return m ? `${m[1]}T${m[2]}:${m[3]}:${m[4] ?? '00'}` : null;
  };
  const nVal = normLocal(value);
  if (!nVal) return false;
  const nMin = normLocal(min);
  const nMax = normLocal(max);
  if (nMin && nVal < nMin) return true;
  if (nMax && nVal > nMax) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────
// Chip Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrChipVariant = 'soft' | 'solid' | 'outline';
export type EmrChipSize = 'sm' | 'md';

export function normalizeEmrChipTone(tone?: string | null): EmrTone {
  return normalizeEmrBadgeTone(tone);
}

export function normalizeEmrChipVariant(variant?: string | null): EmrChipVariant {
  return normalizeEmrBadgeVariant(variant);
}

export function normalizeEmrChipSize(size?: string | null): EmrChipSize {
  return normalizeEmrBadgeSize(size);
}

export function canMutateEmrChip(disabled: boolean, readOnly: boolean): boolean {
  return !disabled && !readOnly;
}

export function resolveEmrChipRemoveLabel(removeLabel?: string | null, label?: string | null): string {
  if (removeLabel && removeLabel.trim()) return removeLabel.trim();
  if (label && label.trim()) return `Remove ${label.trim()}`;
  return 'Remove';
}

// ─────────────────────────────────────────────────────────────
// State Message Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrStateMessageKind = 'empty' | 'loading' | 'error';
export type EmrStateMessageSize = 'sm' | 'md';

export const EMR_STATE_MESSAGE_DEFAULTS = {
  emptyTitle: 'Nothing to show',
  loadingTitle: 'Loading…',
  errorTitle: 'Something went wrong',
} as const;

export function normalizeEmrStateMessageKind(kind?: string | null): EmrStateMessageKind {
  if (kind === 'loading' || kind === 'error' || kind === 'empty') return kind;
  return 'empty';
}

export function normalizeEmrStateMessageSize(size?: string | null, compact = false): EmrStateMessageSize {
  if (compact || size === 'sm') return 'sm';
  return 'md';
}

export function resolveEmrStateMessageTitle(kind: EmrStateMessageKind, title?: string | null): string {
  if (title && title.trim()) return title.trim();
  if (kind === 'loading') return EMR_STATE_MESSAGE_DEFAULTS.loadingTitle;
  if (kind === 'error') return EMR_STATE_MESSAGE_DEFAULTS.errorTitle;
  return EMR_STATE_MESSAGE_DEFAULTS.emptyTitle;
}

export function resolveEmrStateMessageRole(kind: EmrStateMessageKind): 'alert' | 'status' {
  return kind === 'error' ? 'alert' : 'status';
}

// ─────────────────────────────────────────────────────────────
// Separator Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrSeparatorOrientation = 'horizontal' | 'vertical';
export type EmrSeparatorLabelAlign = 'start' | 'center' | 'end';
export type EmrSeparatorVariant = 'solid' | 'dashed' | 'subtle';

export function normalizeEmrSeparatorOrientation(value?: string | null): EmrSeparatorOrientation {
  return value === 'vertical' ? 'vertical' : 'horizontal';
}

export function normalizeEmrSeparatorLabelAlign(value?: string | null): EmrSeparatorLabelAlign {
  if (value === 'start' || value === 'end' || value === 'center') return value;
  return 'center';
}

export function normalizeEmrSeparatorVariant(value?: string | null): EmrSeparatorVariant {
  if (value === 'dashed' || value === 'subtle' || value === 'solid') return value;
  return 'solid';
}

// ─────────────────────────────────────────────────────────────
// Card Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrCardVariant = 'outlined' | 'elevated' | 'filled' | 'subtle';
export type EmrCardPadding = 'none' | 'sm' | 'md' | 'lg';

export function normalizeEmrCardVariant(variant?: string | null): EmrCardVariant {
  if (variant === 'elevated' || variant === 'filled' || variant === 'subtle' || variant === 'outlined') return variant;
  return 'outlined';
}

export function normalizeEmrCardPadding(padding?: string | null, padded = true): EmrCardPadding {
  if (!padded) return 'none';
  if (padding === 'none' || padding === 'sm' || padding === 'md' || padding === 'lg') return padding;
  return 'md';
}

export function normalizeEmrCardTone(tone?: string | null): EmrTone {
  return normalizeEmrBadgeTone(tone);
}

export function canActivateEmrCard(interactive: boolean, disabled: boolean, readOnly: boolean): boolean {
  return interactive && !disabled && !readOnly;
}

export function resolveEmrCardLabel(label?: string | null, title?: string | null, cardTitle?: string | null): string | undefined {
  if (label && label.trim()) return label;
  if (title && title.trim()) return title;
  if (cardTitle && cardTitle.trim()) return cardTitle;
  return undefined;
}

// ─────────────────────────────────────────────────────────────
// Columns Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrColumnsAlign = 'stretch' | 'start' | 'center' | 'end';
export type EmrColumnsTrackWidth = number | string;

export function normalizeEmrColumnsCount(count?: number | null): number {
  if (typeof count !== 'number' || !Number.isFinite(count)) return 2;
  return Math.max(1, Math.min(6, Math.trunc(count)));
}

export function normalizeEmrColumnsAlign(align?: string | null): EmrColumnsAlign {
  if (align === 'start' || align === 'center' || align === 'end' || align === 'stretch') return align;
  return 'stretch';
}

export function normalizeEmrColumnsGap(gap?: number | string | null): { readonly css: string; readonly px: number } {
  if (typeof gap === 'number' && Number.isFinite(gap)) {
    const px = Math.max(0, gap);
    return { css: `${px}px`, px };
  }
  if (typeof gap === 'string' && gap.trim()) {
    const css = gap.trim();
    const m = /^(\d*\.?\d+)px$/i.exec(css);
    return { css, px: m ? Number(m[1]) : 16 };
  }
  return { css: '16px', px: 16 };
}

export function normalizeEmrColumnsCollapseBelow(collapseBelow?: number | null): number {
  if (typeof collapseBelow !== 'number' || !Number.isFinite(collapseBelow)) return 640;
  return Math.max(0, collapseBelow);
}

export function resolveEmrColumnsCssTemplate(
  count?: number | null,
  widths?: readonly EmrColumnsTrackWidth[] | null,
): string {
  if (widths && widths.length > 0) {
    return widths
      .map((w) => (typeof w === 'number' && Number.isFinite(w) ? `${Math.max(0, w)}px` : String(w)))
      .join(' ');
  }
  const c = normalizeEmrColumnsCount(count);
  return `repeat(${c}, minmax(0, 1fr))`;
}

// ─────────────────────────────────────────────────────────────
// FieldValueRow Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrFieldValueRowSize = 'sm' | 'md' | 'lg';
export type EmrFieldValueRowIntent = { readonly type: 'rowActivated'; readonly id?: string };

export function normalizeEmrFieldValueRowSize(size?: string | null): EmrFieldValueRowSize {
  if (size === 'sm' || size === 'md' || size === 'lg') return size;
  return 'md';
}

export function normalizeEmrFieldValueRowTone(tone?: string | null): EmrTone {
  return normalizeEmrBadgeTone(tone);
}

export function canActivateEmrFieldValueRow(interactive: boolean, readOnly: boolean): boolean {
  return interactive && !readOnly;
}

export function resolveEmrFieldValueRowValue(
  value: string | number | null | undefined,
  heading: boolean,
  placeholder = '—',
): { readonly text: string; readonly isPlaceholder: boolean } {
  if (heading) {
    return { text: value == null ? '' : String(value), isPlaceholder: false };
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) return { text: String(value), isPlaceholder: false };
    return { text: placeholder, isPlaceholder: true };
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return { text: value, isPlaceholder: false };
  }
  return { text: placeholder, isPlaceholder: true };
}

// ─────────────────────────────────────────────────────────────
// StatusCell Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrStatusCellSize = 'sm' | 'md';

export function normalizeEmrStatusCellSize(size?: string | null): EmrStatusCellSize {
  return size === 'sm' ? 'sm' : 'md';
}

export function formatEmrStatusCellAttribution(
  attribution?:
    | string
    | {
        readonly nameLabel?: string;
        readonly roleLabel?: string;
        readonly timeLabel?: string;
        readonly author?: string;
        readonly timestamp?: string;
      }
    | null,
): string {
  if (!attribution) return '';
  if (typeof attribution === 'string') return attribution.trim();
  return [
    attribution.nameLabel ?? attribution.author,
    attribution.roleLabel,
    attribution.timeLabel ?? attribution.timestamp,
  ]
    .filter((v) => typeof v === 'string' && v.trim().length > 0)
    .join(' · ');
}

export function resolveEmrStatusCellHiddenText(
  compact: boolean,
  valueLabel?: string | null,
  attributionText?: string | null,
  secondaryNote?: string | null,
): string {
  if (!compact) return '';
  return [valueLabel, attributionText, secondaryNote]
    .filter((v) => typeof v === 'string' && v.trim().length > 0)
    .join('. ');
}

export function canSelectEmrStatusCell(selectable: boolean, readOnly: boolean, disabled: boolean): boolean {
  return selectable && !readOnly && !disabled;
}

export function canTriggerEmrStatusCellAction(
  hasAction: boolean,
  compact: boolean,
  readOnly: boolean,
  disabled: boolean,
): boolean {
  return hasAction && !compact && !readOnly && !disabled;
}

// ─────────────────────────────────────────────────────────────
// StageStepper Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrStageStepperOrientation = 'horizontal' | 'vertical';
export type EmrStageStepperSize = 'sm' | 'md';
export type EmrStageStepperIntent = { readonly type: 'stageSelected'; readonly stageId: string };

export function normalizeEmrStageStepperOrientation(orientation?: string | null): EmrStageStepperOrientation {
  return orientation === 'vertical' ? 'vertical' : 'horizontal';
}

export function normalizeEmrStageStepperSize(size?: string | null): EmrStageStepperSize {
  return size === 'sm' ? 'sm' : 'md';
}

export function canSelectEmrStage(
  stage: { readonly id: string; readonly disabled?: boolean },
  opts: {
    readonly readOnly?: boolean;
    readonly disabled?: boolean;
    readonly clickable?: boolean;
    readonly linear?: boolean;
    readonly activeId?: string;
    readonly stages?: readonly { readonly id: string; readonly disabled?: boolean }[];
    readonly completedIds?: readonly string[];
  },
): boolean {
  if (opts.readOnly || opts.disabled || stage.disabled || opts.clickable === false) return false;
  if (!opts.linear) return true;
  if (stage.id === opts.activeId || opts.completedIds?.includes(stage.id)) return true;
  const list = opts.stages ?? [];
  const activeIdx = opts.activeId ? list.findIndex((s) => s.id === opts.activeId) : -1;
  const targetIdx = list.findIndex((s) => s.id === stage.id);
  if (activeIdx < 0) {
    const firstEnabled = list.findIndex((s) => !s.disabled);
    return targetIdx === firstEnabled;
  }
  return targetIdx <= activeIdx + 1;
}

export function resolveStageStepperTabStopId(
  stages: readonly { readonly id: string; readonly disabled?: boolean }[],
  focusedId?: string | null,
  activeId?: string | null,
  groupDisabled?: boolean,
): string | undefined {
  if (groupDisabled) return undefined;
  const enabled = stages.filter((s) => !s.disabled);
  if (!enabled.length) return undefined;
  if (focusedId && enabled.some((s) => s.id === focusedId)) return focusedId;
  if (activeId && enabled.some((s) => s.id === activeId)) return activeId;
  return enabled[0]!.id;
}

export function getNextStageStepperIndex(
  stages: readonly { readonly disabled?: boolean }[],
  currentIndex: number,
  key: string,
  groupDisabled?: boolean,
): number | null {
  if (groupDisabled || !stages.length) return null;
  const enabledIndices = stages
    .map((s, idx) => (s.disabled ? -1 : idx))
    .filter((idx) => idx >= 0);
  if (!enabledIndices.length) return null;
  if (key === 'Home') return enabledIndices[0]!;
  if (key === 'End') return enabledIndices[enabledIndices.length - 1]!;
  const isNext = key === 'ArrowRight' || key === 'ArrowDown';
  const isPrev = key === 'ArrowLeft' || key === 'ArrowUp';
  if (!isNext && !isPrev) return null;
  const pos = enabledIndices.indexOf(currentIndex);
  if (pos < 0) return enabledIndices[0]!;
  const nextPos = Math.min(enabledIndices.length - 1, Math.max(0, pos + (isNext ? 1 : -1)));
  return enabledIndices[nextPos]!;
}

// ─────────────────────────────────────────────────────────────
// StatTile Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export function normalizeEmrStatTileSize(size?: string | null): 'sm' | 'md' | 'lg' {
  if (size === 'sm' || size === 'lg') return size;
  return 'md';
}

export function normalizeEmrStatTileTone(tone?: string | null, modelTone?: string | null): EmrTone {
  return normalizeEmrBadgeTone(tone ?? modelTone);
}

export function canActivateEmrStatTile(
  interactive: boolean,
  disabled: boolean,
  readOnly: boolean,
  loading: boolean,
): boolean {
  return interactive && !disabled && !readOnly && !loading;
}

export function resolveEmrStatTileAriaLabel(
  model: {
    readonly label: string;
    readonly value: string;
    readonly sub?: string;
    readonly status?: { readonly label: string };
    readonly trend?: { readonly label: string };
    readonly accessibilityLabel?: string;
  },
  ariaLabel?: string | null,
): string {
  if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();
  if (model.accessibilityLabel && model.accessibilityLabel.trim()) return model.accessibilityLabel.trim();
  return [model.label, model.value, model.trend?.label, model.sub, model.status?.label]
    .filter((v) => typeof v === 'string' && v.trim().length > 0)
    .join(', ');
}

// ─────────────────────────────────────────────────────────────
// EmrSelect Helpers (Single & Multi-Select, shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrSelectSize = 'md' | 'sm';
export type EmrSelectVariant = 'outline' | 'filled' | 'subtle';
export type EmrSelectValue = string | readonly string[] | null;

export function normalizeEmrSelectSingleValue(value: EmrSelectValue | undefined): string | null {
  if (typeof value === 'string') {
    return value === '' ? null : value;
  }
  if (Array.isArray(value)) {
    const first = value.find((v): v is string => typeof v === 'string' && v !== '');
    return first ?? null;
  }
  return null;
}

export function normalizeEmrSelectMultiValue(value: EmrSelectValue | undefined): readonly string[] {
  if (Array.isArray(value)) {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of value) {
      if (typeof item === 'string' && item !== '' && !seen.has(item)) {
        seen.add(item);
        out.push(item);
      }
    }
    return out;
  }
  if (typeof value === 'string' && value !== '') {
    return [value];
  }
  return [];
}

export function resolveEmrSelectCloseOnSelect(
  multiple: boolean,
  closeOnSelect?: boolean,
): boolean {
  if (typeof closeOnSelect === 'boolean') return closeOnSelect;
  return !multiple;
}

export function isEmrSelectOptionBlockedByMax(
  optionValue: string,
  selectedValues: readonly string[],
  maxSelections?: number,
): boolean {
  if (typeof maxSelections !== 'number' || !Number.isFinite(maxSelections) || maxSelections < 1) {
    return false;
  }
  if (selectedValues.includes(optionValue)) return false;
  return selectedValues.length >= Math.trunc(maxSelections);
}

export function isEmrSelectClearable(params: {
  readonly clearable: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly multiple: boolean;
  readonly value: EmrSelectValue | undefined;
  readonly options?: readonly EmrOption[];
}): boolean {
  const { clearable, disabled, readOnly, multiple, value, options = [] } = params;
  if (!clearable || disabled || readOnly) return false;
  if (multiple) {
    const current = normalizeEmrSelectMultiValue(value);
    if (current.length === 0) return false;
    return current.some((val) => {
      const opt = options.find((o) => o.value === val);
      return !(opt?.readOnly || opt?.disabled);
    });
  }
  const single = normalizeEmrSelectSingleValue(value);
  if (single === null) return false;
  const opt = options.find((o) => o.value === single);
  if (opt?.readOnly || opt?.disabled) return false;
  return true;
}

export function toggleEmrSelectOption(params: {
  readonly optionValue: string;
  readonly current: readonly string[];
  readonly options: readonly EmrOption[];
  readonly maxSelections?: number;
}): readonly string[] {
  const { optionValue, current, options, maxSelections } = params;
  const opt = options.find((o) => o.value === optionValue);
  if (opt?.disabled || opt?.readOnly) return current;
  if (current.includes(optionValue)) {
    return current.filter((v) => v !== optionValue);
  }
  if (isEmrSelectOptionBlockedByMax(optionValue, current, maxSelections)) {
    return current;
  }
  return [...current, optionValue];
}

export function clearEmrSelectValue(params: {
  readonly multiple: boolean;
  readonly value: EmrSelectValue | undefined;
  readonly options: readonly EmrOption[];
}): string | readonly string[] | null {
  const { multiple, value, options } = params;
  if (!multiple) {
    const single = normalizeEmrSelectSingleValue(value);
    if (single !== null) {
      const opt = options.find((o) => o.value === single);
      if (opt?.readOnly || opt?.disabled) return single;
    }
    return null;
  }
  const current = normalizeEmrSelectMultiValue(value);
  return current.filter((val) => {
    const opt = options.find((o) => o.value === val);
    return Boolean(opt?.readOnly || opt?.disabled);
  });
}

export function removeEmrSelectChip(params: {
  readonly optionValue: string;
  readonly current: readonly string[];
  readonly options: readonly EmrOption[];
}): readonly string[] {
  const { optionValue, current, options } = params;
  const opt = options.find((o) => o.value === optionValue);
  if (opt?.disabled || opt?.readOnly) return current;
  return current.filter((v) => v !== optionValue);
}

export interface EmrSelectTriggerSummary {
  readonly hasSelection: boolean;
  readonly text: string;
  readonly visibleChips: readonly EmrOption[];
  readonly overflowCount: number;
}

export function buildEmrSelectTriggerSummary(params: {
  readonly multiple: boolean;
  readonly value: EmrSelectValue | undefined;
  readonly options: readonly EmrOption[];
  readonly placeholder: string;
  readonly maxTagCount?: number;
}): EmrSelectTriggerSummary {
  const { multiple, value, options, placeholder, maxTagCount } = params;
  if (!multiple) {
    const single = normalizeEmrSelectSingleValue(value);
    if (single === null) {
      return { hasSelection: false, text: placeholder, visibleChips: [], overflowCount: 0 };
    }
    const matched = options.find((o) => o.value === single);
    return {
      hasSelection: true,
      text: matched?.label ?? single,
      visibleChips: [],
      overflowCount: 0,
    };
  }
  const selected = normalizeEmrSelectMultiValue(value);
  if (selected.length === 0) {
    return { hasSelection: false, text: placeholder, visibleChips: [], overflowCount: 0 };
  }
  const resolved: EmrOption[] = selected.map((val) => {
    const found = options.find((o) => o.value === val);
    return found ?? { value: val, label: val };
  });
  const cap =
    typeof maxTagCount === 'number' && Number.isFinite(maxTagCount) && maxTagCount >= 0
      ? Math.trunc(maxTagCount)
      : resolved.length;
  const visibleChips = resolved.slice(0, cap);
  const overflowCount = Math.max(0, resolved.length - visibleChips.length);
  const text = resolved.map((o) => o.label).join(', ');
  return {
    hasSelection: true,
    text,
    visibleChips,
    overflowCount,
  };
}

export function findNextEnabledEmrSelectOptionIndex(
  options: readonly EmrOption[],
  currentIndex: number,
  key: 'ArrowDown' | 'ArrowUp' | 'Home' | 'End',
): number {
  const enabledIndices: number[] = [];
  for (let i = 0; i < options.length; i++) {
    if (!options[i]!.disabled) enabledIndices.push(i);
  }
  if (enabledIndices.length === 0) return -1;
  if (key === 'Home') return enabledIndices[0]!;
  if (key === 'End') return enabledIndices[enabledIndices.length - 1]!;
  const step = key === 'ArrowDown' ? 1 : -1;
  const pos = enabledIndices.indexOf(currentIndex);
  if (pos < 0) {
    return step > 0 ? enabledIndices[0]! : enabledIndices[enabledIndices.length - 1]!;
  }
  const nextPos = (pos + step + enabledIndices.length) % enabledIndices.length;
  return enabledIndices[nextPos]!;
}

export function findTypeaheadEmrSelectOptionIndex(
  options: readonly EmrOption[],
  query: string,
  startIndex = -1,
): number {
  const q = query.trim().toLowerCase();
  if (!q || options.length === 0) return -1;
  const len = options.length;
  const start = startIndex >= 0 && startIndex < len ? (startIndex + 1) % len : 0;
  for (let offset = 0; offset < len; offset++) {
    const idx = (start + offset) % len;
    const opt = options[idx]!;
    if (opt.disabled) continue;
    if (opt.label.toLowerCase().startsWith(q)) return idx;
  }
  return -1;
}

// ─────────────────────────────────────────────────────────────
// Segmented Control Helpers (shared across renderers)
// ─────────────────────────────────────────────────────────────

export type EmrSegmentedSize = 'sm' | 'md' | 'lg';
export type EmrSegmentedVariant = 'default' | 'outline' | 'soft';
export type EmrSegmentedShape = 'default' | 'pill';
export type EmrSegmentedOrientation = 'horizontal' | 'vertical';

export interface EmrSegmentedOption<Value extends string = string> {
  readonly value: Value;
  readonly label: string;
  readonly description?: string;
  readonly icon?: string;
  readonly badge?: EmrBadge | string | number;
  readonly tone?: EmrTone;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly ariaLabel?: string;
}

export interface EmrSegmentedValidationState {
  readonly isInvalid: boolean;
  readonly hasWarning: boolean;
}

export interface EmrSegmentedBadgePresentation {
  readonly text: string;
  readonly tone: EmrTone;
  readonly variant: EmrBadgeVariant;
}

export function normalizeEmrSegmentedSize(size?: unknown): EmrSegmentedSize {
  if (size === 'sm' || size === 'lg') return size;
  return 'md';
}

export function normalizeEmrSegmentedVariant(variant?: unknown): EmrSegmentedVariant {
  if (variant === 'outline' || variant === 'soft') return variant;
  return 'default';
}

export function normalizeEmrSegmentedShape(shape?: unknown): EmrSegmentedShape {
  return shape === 'pill' ? 'pill' : 'default';
}

export function normalizeEmrSegmentedOrientation(orientation?: unknown): EmrSegmentedOrientation {
  return orientation === 'vertical' ? 'vertical' : 'horizontal';
}

export function resolveEmrSegmentedValidationState(params: {
  error?: string;
  warning?: string;
  invalid?: boolean;
  hasWarning?: boolean;
}): EmrSegmentedValidationState {
  const isInvalid = Boolean(params.invalid) || Boolean(params.error);
  const hasWarning = !isInvalid && (Boolean(params.hasWarning) || Boolean(params.warning));
  return { isInvalid, hasWarning };
}

export function isEmrSegmentedOptionDisabled(
  option: Pick<EmrSegmentedOption, 'disabled'>,
  groupDisabled = false,
): boolean {
  return Boolean(groupDisabled || option.disabled);
}

export function isEmrSegmentedOptionLocked(
  option: Pick<EmrSegmentedOption, 'disabled' | 'readOnly'>,
  groupDisabled = false,
  groupReadOnly = false,
): boolean {
  return Boolean(groupDisabled || groupReadOnly || option.disabled || option.readOnly);
}

export function resolveEmrSegmentedTabStopValue(
  options: readonly EmrSegmentedOption[],
  value: string | null | undefined,
  groupDisabled = false,
): string | null {
  if (groupDisabled) return null;
  const enabled = options.filter((o) => !o.disabled);
  if (enabled.length === 0) return null;
  if (value !== null && value !== undefined && value !== '' && enabled.some((o) => o.value === value)) {
    return value;
  }
  return enabled[0]!.value;
}

export function moveEmrSegmentedFocusIndex(
  options: readonly EmrSegmentedOption[],
  currentIndex: number,
  key: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End',
  groupDisabled = false,
): number {
  if (groupDisabled || options.length === 0) return -1;
  const enabledIndices: number[] = [];
  for (let i = 0; i < options.length; i += 1) {
    if (!options[i]!.disabled) enabledIndices.push(i);
  }
  if (enabledIndices.length === 0) return -1;
  if (key === 'Home') return enabledIndices[0]!;
  if (key === 'End') return enabledIndices[enabledIndices.length - 1]!;
  const direction = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1;
  const pos = enabledIndices.indexOf(currentIndex);
  if (pos < 0) {
    return direction > 0 ? enabledIndices[0]! : enabledIndices[enabledIndices.length - 1]!;
  }
  const nextPos = (pos + direction + enabledIndices.length) % enabledIndices.length;
  return enabledIndices[nextPos]!;
}

export function canClearEmrSegmentedControl(params: {
  clearable?: boolean;
  value: string | null | undefined;
  disabled?: boolean;
  readOnly?: boolean;
}): boolean {
  return Boolean(
    params.clearable &&
      params.value !== null &&
      params.value !== undefined &&
      params.value !== '' &&
      !params.disabled &&
      !params.readOnly,
  );
}

export function resolveEmrSegmentedSelectAction(params: {
  option: EmrSegmentedOption;
  currentValue: string | null | undefined;
  allowDeselect?: boolean;
  groupDisabled?: boolean;
  groupReadOnly?: boolean;
}): { readonly kind: 'noop' } | { readonly kind: 'select'; readonly value: string } | { readonly kind: 'clear' } {
  if (isEmrSegmentedOptionLocked(params.option, params.groupDisabled, params.groupReadOnly)) {
    return { kind: 'noop' };
  }
  if (params.currentValue === params.option.value) {
    return params.allowDeselect ? { kind: 'clear' } : { kind: 'noop' };
  }
  return { kind: 'select', value: params.option.value };
}

export function formatEmrSegmentedBadge(
  badge: EmrBadge | string | number | null | undefined,
  fallbackTone?: EmrTone,
): EmrSegmentedBadgePresentation | null {
  if (badge === null || badge === undefined) return null;
  const defaultTone = normalizeEmrBadgeTone(fallbackTone);
  if (typeof badge === 'number') {
    if (!Number.isFinite(badge)) return null;
    return { text: String(badge), tone: defaultTone, variant: 'soft' };
  }
  if (typeof badge === 'string') {
    if (!badge.trim()) return null;
    return { text: badge, tone: defaultTone, variant: 'soft' };
  }
  const countInfo = formatEmrBadgeCount(badge.count, badge.maxCount, badge.showZero);
  const label = badge.label?.trim() ?? '';
  const text = label && countInfo.text ? `${label} ${countInfo.text}` : label || countInfo.text || '';
  if (!text) return null;
  return {
    text,
    tone: normalizeEmrBadgeTone(badge.tone ?? fallbackTone),
    variant: normalizeEmrBadgeVariant(badge.variant),
  };
}
