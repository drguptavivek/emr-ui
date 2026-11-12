/**
 * Pure mechanical helpers and default constants for Wave 2 L1 primitives.
 * Zero runtime imports from @drguptavivek/emr-controller so SSR and registry bundles remain type-only.
 */
import type {
  EmrAccordionItem,
  EmrAspectPreset,
  EmrBreadcrumbItem,
  EmrCollapsedBreadcrumbs,
  EmrColorSwatch,
  EmrDateRangeValue,
  EmrFlatTreeRow,
  EmrImageCropRect,
  EmrImageCropTransform,
  EmrImageViewportState,
  EmrMaskResult,
  EmrOption,
  EmrOptionGroup,
  EmrOtpEditResult,
  EmrSelectAllState,
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

export function computeSelectAllState(
  current: readonly string[],
  options: readonly EmrOption[],
  exclusiveValues: readonly string[] = [],
): EmrSelectAllState {
  const exclusiveSet = new Set(exclusiveValues);
  const selectable = options
    .filter((o) => !o.disabled && !exclusiveSet.has(o.value))
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
  exclusiveValues: readonly string[] = [],
): readonly string[] {
  const state = computeSelectAllState(current, options, exclusiveValues);
  const exclusiveSet = new Set(exclusiveValues);
  if (state === 'all') {
    return options
      .filter((o) => o.disabled && current.includes(o.value))
      .map((o) => o.value);
  }
  const next: string[] = [];
  for (const o of options) {
    if (exclusiveSet.has(o.value)) continue;
    if (!o.disabled || current.includes(o.value)) {
      next.push(o.value);
    }
  }
  return next;
}

export function toggleCheckboxGroupValue(
  current: readonly string[],
  toggledValue: string,
  options: readonly EmrOption[],
  exclusiveValues: readonly string[] = [],
): readonly string[] {
  const exclusiveSet = new Set(exclusiveValues);
  const nextSet = new Set(current);
  const wasChecked = nextSet.has(toggledValue);
  if (wasChecked) {
    nextSet.delete(toggledValue);
  } else if (exclusiveSet.has(toggledValue)) {
    nextSet.clear();
    nextSet.add(toggledValue);
  } else {
    for (const ex of exclusiveSet) {
      nextSet.delete(ex);
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

export type { EmrAccordionItem };
