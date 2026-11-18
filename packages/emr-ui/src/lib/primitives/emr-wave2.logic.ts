/**
 * Pure mechanical helpers and default constants for Wave 2 L1 primitives.
 * Zero runtime imports from @drguptavivek/emr-controller so SSR and registry bundles remain type-only.
 */
import type {
  EmrAccordionItem,
  EmrAspectPreset,
  EmrBadge,
  EmrBadgeVariant,
  EmrBreadcrumbItem,
  EmrCheckboxGroupLabelPlacement,
  EmrCheckboxGroupOrientation,
  EmrCheckboxGroupSelectionValidation,
  EmrCheckboxGroupSize,
  EmrCheckboxGroupToggleOptions,
  EmrCheckboxGroupVariant,
  EmrCollapsedBreadcrumbs,
  EmrColorSwatch,
  EmrControlVariant,
  EmrDateRangeValue,
  EmrFlatTreeRow,
  EmrImageCropRect,
  EmrImageCropTransform,
  EmrImageViewportState,
  EmrMaskResult,
  EmrMatchHighlightSegment,
  EmrOption,
  EmrOptionGroup,
  EmrOtpEditResult,
  EmrRadioGroupLabelPlacement,
  EmrRadioGroupOrientation,
  EmrRadioGroupSize,
  EmrRadioGroupVariant,
  EmrScoredOption,
  EmrSearchSelectFilterMode,
  EmrTagInputSize,
  EmrTagInputVariant,
  EmrTagSuggestionItem,
  EmrSearchSelectSize,
  EmrSegmentedBadgePresentation,
  EmrSegmentedOption,
  EmrSegmentedOrientation,
  EmrSegmentedShape,
  EmrSegmentedSize,
  EmrSegmentedValidationState,
  EmrSegmentedVariant,
  EmrSelectAllState,
  EmrSelectSize,
  EmrSelectTriggerSummary,
  EmrSelectValue,
  EmrSelectVariant,
  EmrToggleLabelPlacement,
  EmrToggleSize,
  EmrToggleVariant,
  EmrTone,
  EmrTreeCheckState,
  EmrTreeCheckStrategy,
  EmrTreeNode,
} from '@drguptavivek/emr-controller';

// ─────────────────────────────────────────────────────────────
// 1. Option Grouping, Local Filtering & Choice Group Logic
// ─────────────────────────────────────────────────────────────

export function groupOptions<Value extends string = string>(
  options: readonly EmrOption<Value>[],
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
  query: string | null | undefined,
): readonly EmrOption<Value>[] {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return options;
  return options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(q) ||
      opt.value.toLowerCase().includes(q) ||
      (opt.description?.toLowerCase().includes(q) ?? false) ||
      (opt.group?.toLowerCase().includes(q) ?? false),
  );
}

export type {
  EmrCheckboxGroupLabelPlacement,
  EmrCheckboxGroupOrientation,
  EmrCheckboxGroupSelectionValidation,
  EmrCheckboxGroupSize,
  EmrCheckboxGroupToggleOptions,
  EmrCheckboxGroupVariant,
  EmrRadioGroupLabelPlacement,
  EmrRadioGroupOrientation,
  EmrRadioGroupSize,
  EmrRadioGroupVariant,
  EmrToggleLabelPlacement,
  EmrToggleSize,
  EmrToggleVariant,
};

export function resolveEmrToggleChecked(value?: boolean | null, checked?: boolean): boolean {
  return value !== undefined ? Boolean(value) : Boolean(checked);
}

export function resolveEmrToggleNext(checked: boolean): boolean {
  return !checked;
}

export function normalizeEmrToggleVariant(variant?: unknown): EmrToggleVariant {
  return variant === 'inline' ? 'inline' : 'tile';
}

export function normalizeEmrToggleSize(size?: unknown): EmrToggleSize {
  return size === 'sm' ? 'sm' : 'md';
}

export function normalizeEmrToggleLabelPlacement(placement?: unknown): EmrToggleLabelPlacement {
  return placement === 'start' || placement === 'space-between' ? placement : 'end';
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
  maxSelections?: number,
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
  options: readonly EmrOption[],
): readonly string[] {
  const currentSet = new Set(current);
  return options
    .filter((o) => isCheckboxOptionLocked(o) && currentSet.has(o.value))
    .map((o) => o.value);
}

export function validateCheckboxGroupSelection(
  current: readonly string[],
  minSelections?: number,
  maxSelections?: number,
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
  maxSelections?: number,
): string {
  const count = current.length;
  if (typeof maxSelections === 'number' && Number.isFinite(maxSelections) && maxSelections >= 1) {
    return `${count} of ${Math.trunc(maxSelections)} selected`;
  }
  return `${count} selected`;
}

function resolveCheckboxToggleOptions(
  exclusiveOrOptions?: readonly string[] | EmrCheckboxGroupToggleOptions,
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
  exclusiveValues: readonly string[] = [],
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
  exclusiveOrOptions: readonly string[] | EmrCheckboxGroupToggleOptions = [],
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
    options.filter((o) => isCheckboxOptionLocked(o) && currentSet.has(o.value)).map((o) => o.value),
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
  exclusiveOrOptions: readonly string[] | EmrCheckboxGroupToggleOptions = [],
): readonly string[] {
  const targetOption = options.find((o) => o.value === toggledValue);
  if (targetOption && isCheckboxOptionLocked(targetOption)) {
    return current;
  }
  const { exclusiveSet, maxSelections } = resolveCheckboxToggleOptions(exclusiveOrOptions);
  const lockedValues = new Set(
    options.filter((o) => isCheckboxOptionLocked(o)).map((o) => o.value),
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
// 2. Hierarchical Tree View & Tree Select Algorithms
// ─────────────────────────────────────────────────────────────

function collectEnabledLeafOrSelectableIds(
  node: EmrTreeNode,
  strategy: EmrTreeCheckStrategy,
  acc: string[] = [],
): string[] {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isSelectable =
    node.selectable !== undefined
      ? node.selectable
      : strategy === 'leaf'
        ? !hasChildren
        : true;
  if (!node.disabled && isSelectable) {
    acc.push(node.id);
  }
  if (node.children) {
    for (const child of node.children) {
      if (!node.disabled) {
        collectEnabledLeafOrSelectableIds(child, strategy, acc);
      }
    }
  }
  return acc;
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
      const selfMatches =
        node.label.toLowerCase().includes(query) ||
        (node.code?.toLowerCase().includes(query) ?? false) ||
        (node.description?.toLowerCase().includes(query) ?? false);
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
      const selfMatched =
        query.length > 0 &&
        (node.label.toLowerCase().includes(query) ||
          (node.code?.toLowerCase().includes(query) ?? false) ||
          (node.description?.toLowerCase().includes(query) ?? false));
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

export function toggleTreeNodeCheck(
  nodes: readonly EmrTreeNode[],
  currentIds: readonly string[],
  targetId: string,
  strategy: EmrTreeCheckStrategy = 'cascade',
): readonly string[] {
  const selected = new Set(currentIds);

  const findNode = (list: readonly EmrTreeNode[]): EmrTreeNode | null => {
    for (const n of list) {
      if (n.id === targetId) return n;
      if (n.children) {
        const found = findNode(n.children);
        if (found) return found;
      }
    }
    return null;
  };

  const target = findNode(nodes);
  if (!target || target.disabled) return currentIds;

  if (strategy === 'all' || strategy === 'leaf') {
    const hasChildren = Boolean(target.children && target.children.length > 0);
    if (strategy === 'leaf' && hasChildren && target.selectable !== true) {
      return currentIds;
    }
    if (selected.has(targetId)) selected.delete(targetId);
    else selected.add(targetId);
    return [...selected];
  }

  const currentState = computeTreeNodeCheckState(target, selected, 'cascade');
  const shouldCheck = currentState !== 'checked';
  const subtreeIds = collectEnabledLeafOrSelectableIds(target, 'cascade');
  for (const id of subtreeIds) {
    if (shouldCheck) selected.add(id);
    else selected.delete(id);
  }

  const reconcileParents = (list: readonly EmrTreeNode[]): void => {
    for (const n of list) {
      if (n.children && n.children.length > 0) {
        reconcileParents(n.children);
        const childSelectableIds = n.children.flatMap((c) =>
          collectEnabledLeafOrSelectableIds(c, 'cascade'),
        );
        if (childSelectableIds.length > 0 && n.selectable !== false && !n.disabled) {
          const allChildrenChecked = childSelectableIds.every((id) => selected.has(id));
          if (allChildrenChecked) selected.add(n.id);
          else selected.delete(n.id);
        }
      }
    }
  };
  reconcileParents(nodes);

  const canonical: string[] = [];
  const collectOrder = (list: readonly EmrTreeNode[]) => {
    for (const n of list) {
      if (selected.has(n.id)) canonical.push(n.id);
      if (n.children) collectOrder(n.children);
    }
  };
  collectOrder(nodes);
  return canonical;
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
  const walk = (
    list: readonly EmrTreeNode[],
    trail: readonly EmrTreeNode[],
  ): readonly EmrTreeNode[] | null => {
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

// ─────────────────────────────────────────────────────────────
// 3. Image Viewer & Cropper Helpers
// ─────────────────────────────────────────────────────────────

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
  maxZoom = 5,
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

export function formatImageTransformCss(state: EmrImageViewportState): string {
  const sx = (state.flipH ? -1 : 1) * state.zoom;
  const sy = (state.flipV ? -1 : 1) * state.zoom;
  return `translate(${state.panX}px, ${state.panY}px) rotate(${state.rotationDeg}deg) scale(${sx}, ${sy})`;
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
  minSize = 0.1,
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

// ─────────────────────────────────────────────────────────────
// 4. Date Range Picker Helpers & Calendar Grid
// ─────────────────────────────────────────────────────────────

export function normalizeDateRangeSelection(
  current: EmrDateRangeValue | null | undefined,
  clickedIso: string,
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
  range: EmrDateRangeValue | null | undefined,
): boolean {
  if (!range?.start || !range?.end) return false;
  return iso >= range.start && iso <= range.end;
}

export function isIsoRangeEdge(
  iso: string,
  range: EmrDateRangeValue | null | undefined,
): 'start' | 'end' | 'both' | null {
  if (!range) return null;
  const isStart = range.start === iso;
  const isEnd = range.end === iso;
  if (isStart && isEnd) return 'both';
  if (isStart) return 'start';
  if (isEnd) return 'end';
  return null;
}

export interface EmrCalendarCell {
  readonly iso: string;
  readonly day: number;
  readonly inCurrentMonth: boolean;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');
const pad4 = (n: number): string => String(n).padStart(4, '0');

export function buildCalendarMonthCells(year: number, monthIndex0: number): readonly EmrCalendarCell[] {
  const firstOfMonth = new Date(Date.UTC(year, monthIndex0, 1));
  const startWeekday = firstOfMonth.getUTCDay(); // 0 = Sun .. 6 = Sat
  const cells: EmrCalendarCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(Date.UTC(year, monthIndex0, 1 - startWeekday + i));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const day = d.getUTCDate();
    cells.push({
      iso: `${pad4(y)}-${pad2(m + 1)}-${pad2(day)}`,
      day,
      inCurrentMonth: m === monthIndex0 && y === year,
    });
  }
  return cells;
}

// ─────────────────────────────────────────────────────────────
// 5. Tag Input, Slider, Range Slider, Masked & OTP Helpers
// ─────────────────────────────────────────────────────────────

export function splitTagTokens(
  raw: string,
  delimiters: readonly string[] = [',', ';'],
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
  options: { readonly allowDuplicates?: boolean; readonly maxTags?: number } = {},
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

export function clampSliderValue(
  value: number,
  min = 0,
  max = 100,
  step = 1,
): number {
  const safeStep = step > 0 ? step : 1;
  const clamped = Math.max(min, Math.min(max, value));
  const stepped = min + Math.round((clamped - min) / safeStep) * safeStep;
  const decimals = (String(safeStep).split('.')[1] ?? '').length;
  return Number(Math.max(min, Math.min(max, stepped)).toFixed(decimals));
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
  const safeMinDist = Math.max(0, minDistance);
  let nextLow = clampSliderValue(low, min, max, step);
  let nextHigh = clampSliderValue(high, min, max, step);
  if (movedThumb === 'low') {
    nextLow = Math.min(nextLow, clampSliderValue(nextHigh - safeMinDist, min, max, step));
  } else {
    nextHigh = Math.max(nextHigh, clampSliderValue(nextLow + safeMinDist, min, max, step));
  }
  if (nextLow > nextHigh) {
    const mid = clampSliderValue((nextLow + nextHigh) / 2, min, max, step);
    return [mid, mid];
  }
  return [nextLow, nextHigh];
}

const isMaskToken = (ch: string): boolean => ch === '9' || ch === 'A' || ch === '*';

const matchesMaskToken = (token: string, char: string): boolean => {
  if (token === '9') return /^[0-9]$/.test(char);
  if (token === 'A') return /^[A-Za-z]$/.test(char);
  if (token === '*') return /^[A-Za-z0-9]$/.test(char);
  return false;
};

export function applyInputMask(raw: string | null | undefined, mask: string): EmrMaskResult {
  const input = raw ?? '';
  if (!mask) {
    return { masked: input, unmasked: input, complete: input.length > 0 };
  }
  const requiredTokens = [...mask].filter(isMaskToken).length;
  if (!input) {
    return { masked: '', unmasked: '', complete: requiredTokens === 0 };
  }

  let rawIdx = 0;
  let masked = '';
  let unmasked = '';
  let matchedTokens = 0;

  for (let mIdx = 0; mIdx < mask.length; mIdx += 1) {
    const mChar = mask[mIdx]!;
    if (isMaskToken(mChar)) {
      let found: string | null = null;
      while (rawIdx < input.length) {
        const candidate = input[rawIdx]!;
        rawIdx += 1;
        if (matchesMaskToken(mChar, candidate)) {
          found = candidate;
          break;
        }
      }
      if (found === null) break;
      masked += found;
      unmasked += found;
      matchedTokens += 1;
    } else {
      if (rawIdx < input.length) {
        if (input[rawIdx] === mChar) {
          rawIdx += 1;
        }
        masked += mChar;
      }
    }
  }

  while (
    masked.length > 0 &&
    !isMaskToken(mask[masked.length - 1] ?? '9') &&
    unmasked.length === 0
  ) {
    masked = masked.slice(0, -1);
  }

  return {
    masked,
    unmasked,
    complete: matchedTokens === requiredTokens,
  };
}

export function normalizeOtpSlots(
  value: string | null | undefined,
  length = 6,
): readonly string[] {
  const safeLen = Math.max(1, Math.floor(length));
  const chars = [...(value ?? '')];
  return Array.from({ length: safeLen }, (_, i) => chars[i] ?? '');
}

export function applyOtpSlotEdit(
  currentValue: string | null | undefined,
  slotIndex: number,
  typed: string,
  length = 6,
  numericOnly = true,
): EmrOtpEditResult {
  const safeLen = Math.max(1, Math.floor(length));
  const slots = [...normalizeOtpSlots(currentValue, safeLen)];
  const cleaned = [...typed].filter((ch) =>
    numericOnly ? /^[0-9]$/.test(ch) : /^[A-Za-z0-9]$/.test(ch),
  );

  if (cleaned.length === 0) {
    if (slotIndex >= 0 && slotIndex < safeLen) {
      slots[slotIndex] = '';
    }
    const value = slots.join('');
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
  const value = slots.join('');
  return {
    value,
    slots,
    nextFocusIndex: Math.min(safeLen - 1, cursor),
    completed: slots.every((s) => s.length === 1),
  };
}

// ─────────────────────────────────────────────────────────────
// 6. Accordion, Breadcrumbs & Clinical Color Swatches
// ─────────────────────────────────────────────────────────────

export function toggleAccordionId(
  currentIds: readonly string[],
  id: string,
  multiple = false,
): readonly string[] {
  const exists = currentIds.includes(id);
  if (multiple) {
    return exists ? currentIds.filter((item) => item !== id) : [...currentIds, id];
  }
  return exists ? [] : [id];
}

export function collapseBreadcrumbs(
  items: readonly EmrBreadcrumbItem[],
  maxItems?: number,
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

export type {
  EmrAccordionItem,
  EmrControlVariant,
  EmrMatchHighlightSegment,
  EmrScoredOption,
  EmrSearchSelectFilterMode,
  EmrTagInputSize,
  EmrTagInputVariant,
  EmrTagSuggestionItem,
  EmrSearchSelectSize,
};

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

// ─────────────────────────────────────────────────────────────
// EmrSelect Pure Helpers (mirrored from @drguptavivek/emr-controller)
// ─────────────────────────────────────────────────────────────

export type { EmrSelectSize, EmrSelectTriggerSummary, EmrSelectValue, EmrSelectVariant };

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
// Segmented Control Helpers (mirrored from controller, zero runtime import)
// ─────────────────────────────────────────────────────────────

const VALID_SEG_BADGE_TONES = new Set<EmrTone>(['neutral', 'info', 'success', 'warning', 'danger']);
const VALID_SEG_BADGE_VARIANTS = new Set<EmrBadgeVariant>(['soft', 'solid', 'outline']);

export function normalizeEmrSegmentedSize(size?: unknown): EmrSegmentedSize {
  return size === 'sm' ? 'sm' : 'md';
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
}): EmrSegmentedValidationState {
  const isInvalid = Boolean(params.invalid) || Boolean(params.error);
  const hasWarning = !isInvalid && Boolean(params.warning);
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
  const defaultTone: EmrTone = fallbackTone && VALID_SEG_BADGE_TONES.has(fallbackTone) ? fallbackTone : 'neutral';
  if (typeof badge === 'number') {
    if (!Number.isFinite(badge)) return null;
    return { text: String(badge), tone: defaultTone, variant: 'soft' };
  }
  if (typeof badge === 'string') {
    if (!badge.trim()) return null;
    return { text: badge, tone: defaultTone, variant: 'soft' };
  }
  const countText = (() => {
    if (typeof badge.count !== 'number' || !Number.isFinite(badge.count)) return null;
    const intCount = Math.max(0, Math.trunc(badge.count));
    if (intCount === 0 && !badge.showZero) return null;
    const max = typeof badge.maxCount === 'number' && Number.isFinite(badge.maxCount) && badge.maxCount >= 1
      ? Math.trunc(badge.maxCount)
      : 99;
    return intCount > max ? `${max}+` : String(intCount);
  })();
  const label = badge.label?.trim() ?? '';
  const text = label && countText ? `${label} ${countText}` : label || countText || '';
  if (!text) return null;
  const tone = badge.tone && VALID_SEG_BADGE_TONES.has(badge.tone) ? badge.tone : defaultTone;
  const variant = badge.variant && VALID_SEG_BADGE_VARIANTS.has(badge.variant) ? badge.variant : 'soft';
  return { text, tone, variant };
}
