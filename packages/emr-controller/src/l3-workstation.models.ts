import type { EmrBadge, EmrTone } from './models.js';

// ===========================================================================
// 1. EmrSplitWorkspace — Resizable 2- or 3-pane encounter workstation layout
// ===========================================================================

export type EmrSplitWorkspacePreset =
  | '2-pane-50-50'
  | '2-pane-40-60'
  | '3-pane'
  | 'focus-primary';

export type EmrSplitWorkspaceSlotName =
  | 'pane-primary'
  | 'pane-secondary'
  | 'pane-tertiary';

export interface EmrSplitWorkspacePane {
  readonly id: string;
  readonly slot: EmrSplitWorkspaceSlotName;
  readonly title: string;
  readonly subtitle?: string;
  readonly badge?: EmrBadge;
  readonly collapsed?: boolean;
  readonly collapsible?: boolean;
  readonly minWidthPct?: number;
  readonly summaryItems?: readonly string[];
}

export interface EmrSplitWorkspaceViewModel {
  readonly id: string;
  readonly title?: string;
  readonly preset: EmrSplitWorkspacePreset;
  /** Pane width percentages (e.g. [40, 60] or [25, 50, 25]). */
  readonly paneSizes: readonly number[];
  readonly panes: readonly EmrSplitWorkspacePane[];
  /** Active pane id when rendered in narrow/mobile tab layout. */
  readonly mobileActivePaneId?: string;
  readonly readOnly?: boolean;
}

export type EmrSplitWorkspaceIntent =
  | { readonly type: 'presetChanged'; readonly preset: EmrSplitWorkspacePreset; readonly paneSizes: readonly number[] }
  | { readonly type: 'paneResized'; readonly dividerIndex: number; readonly deltaPct: number; readonly paneSizes: readonly number[] }
  | { readonly type: 'paneCollapsedToggled'; readonly paneId: string; readonly collapsed: boolean }
  | { readonly type: 'mobilePaneSelected'; readonly paneId: string };

export const SPLIT_WORKSPACE_PRESET_SIZES: Readonly<Record<EmrSplitWorkspacePreset, readonly number[]>> = {
  '2-pane-50-50': [50, 50],
  '2-pane-40-60': [40, 60],
  '3-pane': [25, 50, 25],
  'focus-primary': [75, 25],
};

/** Returns normalized pane percentages for a preset and pane count. */
export function resolveSplitWorkspacePresetSizes(
  preset: EmrSplitWorkspacePreset,
  paneCount = 3,
): readonly number[] {
  const base = SPLIT_WORKSPACE_PRESET_SIZES[preset];
  if (paneCount <= 1) return [100];
  if (paneCount === 2) {
    if (preset === '3-pane') return [40, 60];
    return [base[0] ?? 50, base[1] ?? 50];
  }
  if (preset === '3-pane') return [25, 50, 25];
  if (preset === 'focus-primary') return [70, 15, 15];
  if (preset === '2-pane-40-60') return [35, 45, 20];
  return [40, 40, 20];
}

export interface EmrSplitWorkspaceLabels {
  readonly tag?: string;
  readonly defaultTitle?: string;
  readonly presetsLabel?: string;
  readonly mobileTabsLabel?: string;
  readonly collapse?: string;
  readonly expand?: string;
  readonly resizeDividerLabel?: string;
  readonly shrinkPaneLabel?: string;
  readonly growPaneLabel?: string;
}

/** Returns panes visible under the active layout preset (3 for 3-pane, 2 otherwise). */
export function visibleSplitWorkspacePanes(
  panes: readonly EmrSplitWorkspacePane[],
  preset: EmrSplitWorkspacePreset,
): readonly EmrSplitWorkspacePane[] {
  return preset === '3-pane' ? panes.slice(0, 3) : panes.slice(0, 2);
}

/** Resolves min/max/current percentage bounds for a split-workspace divider. */
export function resolveSplitWorkspaceDividerBounds(
  sizes: readonly number[],
  dividerIndex: number,
  minPctOrPanes: number | readonly Pick<EmrSplitWorkspacePane, 'minWidthPct'>[] = 15,
  defaultMinPct = 15,
): { readonly min: number; readonly max: number; readonly now: number } {
  if (dividerIndex < 0 || dividerIndex >= sizes.length - 1) {
    return { min: 0, max: 100, now: 50 };
  }
  const left = sizes[dividerIndex]!;
  const right = sizes[dividerIndex + 1]!;
  const combined = left + right;
  const rawLeftMin = Array.isArray(minPctOrPanes)
    ? (minPctOrPanes[dividerIndex]?.minWidthPct ?? defaultMinPct)
    : (typeof minPctOrPanes === 'number' ? minPctOrPanes : defaultMinPct);
  const rawRightMin = Array.isArray(minPctOrPanes)
    ? (minPctOrPanes[dividerIndex + 1]?.minWidthPct ?? defaultMinPct)
    : (typeof minPctOrPanes === 'number' ? minPctOrPanes : defaultMinPct);

  let leftMin = Math.max(0, rawLeftMin);
  let rightMin = Math.max(0, rawRightMin);
  if (leftMin + rightMin > combined) {
    const total = leftMin + rightMin;
    leftMin = total > 0 ? Math.round((leftMin / total) * combined) : combined / 2;
    rightMin = combined - leftMin;
  }
  return {
    min: leftMin,
    max: Math.max(leftMin, combined - rightMin),
    now: left,
  };
}

/** Steps a divider by `deltaPct` (e.g. ±5%), respecting per-pane `minWidthPct` (default 15%). */
export function stepSplitWorkspacePaneSizes(
  sizes: readonly number[],
  dividerIndex: number,
  deltaPct: number,
  minPctOrPanes: number | readonly Pick<EmrSplitWorkspacePane, 'minWidthPct'>[] = 15,
  defaultMinPct = 15,
): readonly number[] {
  if (dividerIndex < 0 || dividerIndex >= sizes.length - 1) {
    return [...sizes];
  }
  const left = sizes[dividerIndex]!;
  const right = sizes[dividerIndex + 1]!;
  const combined = left + right;
  const bounds = resolveSplitWorkspaceDividerBounds(sizes, dividerIndex, minPctOrPanes, defaultMinPct);
  const nextLeft = Math.max(bounds.min, Math.min(bounds.max, Math.round(left + deltaPct)));
  const nextRight = combined - nextLeft;
  return sizes.map((v, idx) => {
    if (idx === dividerIndex) return nextLeft;
    if (idx === dividerIndex + 1) return nextRight;
    return v;
  });
}

export function resolveSplitWorkspaceId(workspaceId: string, idPrefix = ''): string {
  const prefix = idPrefix.trim().replace(/-+$/, '');
  const cleanId = workspaceId.trim() || 'split-workspace';
  return prefix ? `${prefix}-emr-split-ws-${cleanId}` : `emr-split-ws-${cleanId}`;
}

export function resolveSplitWorkspaceHeadingId(
  workspaceId: string,
  idPrefix = '',
  headingId?: string | null,
): string {
  const explicit = headingId?.trim();
  if (explicit) return explicit;
  return `${resolveSplitWorkspaceId(workspaceId, idPrefix)}-heading`;
}

export function canMutateSplitWorkspace(model: Pick<EmrSplitWorkspaceViewModel, 'readOnly'>): boolean {
  return !model.readOnly;
}

// ===========================================================================
// 2. EmrCommandPalette — Cmd+K / Ctrl+K quick-order, SmartPhrase & launcher
// ===========================================================================

export type EmrCommandCategory =
  | 'all'
  | 'orders'
  | 'navigation'
  | 'smartphrases'
  | 'calculators'
  | 'actions';

export interface EmrCommandItem {
  readonly id: string;
  readonly label: string;
  readonly subtitle?: string;
  readonly category: Exclude<EmrCommandCategory, 'all'>;
  readonly groupLabel?: string;
  /** Keyboard shortcut badge text, e.g. '⌘O', '.iop', 'Enter'. */
  readonly shortcut?: string;
  readonly badge?: EmrBadge;
  readonly pinned?: boolean;
  readonly recent?: boolean;
  readonly disabled?: boolean;
}

export type EmrCommandPalettePresentation = 'modal' | 'inline';

export interface EmrCommandPaletteViewModel {
  readonly id: string;
  readonly title?: string;
  readonly presentation?: EmrCommandPalettePresentation;
  readonly open: boolean;
  readonly query: string;
  readonly placeholder?: string;
  readonly activeCategory: EmrCommandCategory;
  readonly activeIndex: number;
  readonly items: readonly EmrCommandItem[];
  readonly emptyMessage?: string;
  readonly readOnly?: boolean;
}

export interface EmrCommandPaletteLabels {
  readonly defaultTitle?: string;
  readonly defaultPlaceholder?: string;
  readonly closeLabel?: string;
  readonly searchLabel?: string;
  readonly categoriesLabel?: string;
  readonly resultsLabel?: string;
  readonly emptyMessage?: string;
  readonly pinnedLabel?: string;
  readonly recentLabel?: string;
}

export type EmrCommandPaletteIntent =
  | { readonly type: 'queryChanged'; readonly query: string }
  | { readonly type: 'categoryChanged'; readonly category: EmrCommandCategory }
  | { readonly type: 'itemHighlighted'; readonly index: number; readonly itemId: string }
  | { readonly type: 'commandExecuted'; readonly itemId: string; readonly item: EmrCommandItem }
  | { readonly type: 'dismissed' };

export const COMMAND_PALETTE_CATEGORIES: readonly {
  readonly id: EmrCommandCategory;
  readonly label: string;
}[] = [
  { id: 'all', label: 'All' },
  { id: 'orders', label: 'Orders' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'smartphrases', label: 'SmartPhrases' },
  { id: 'calculators', label: 'Calculators' },
  { id: 'actions', label: 'Actions' },
];

/** Filters command items by category and case-insensitive query across label, subtitle, shortcut, and groupLabel. */
export function filterCommandPaletteItems(
  items: readonly EmrCommandItem[],
  category: EmrCommandCategory,
  query: string,
): readonly EmrCommandItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (!q) return true;
    const haystack = [
      item.label,
      item.subtitle ?? '',
      item.shortcut ?? '',
      item.groupLabel ?? '',
      item.category,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export interface EmrCommandGroup {
  readonly label: string;
  readonly items: readonly { readonly item: EmrCommandItem; readonly flatIndex: number }[];
}

/** Groups filtered command items into Pinned/Recent + category/group sections while preserving flat highlight indices. */
export function groupCommandPaletteItems(
  filteredItems: readonly EmrCommandItem[],
): readonly EmrCommandGroup[] {
  const groups: { label: string; items: { item: EmrCommandItem; flatIndex: number }[] }[] = [];
  const byLabel = new Map<string, { item: EmrCommandItem; flatIndex: number }[]>();

  filteredItems.forEach((item, flatIndex) => {
    const label =
      item.groupLabel ??
      (item.pinned ? 'Pinned' : item.recent ? 'Recent' : item.category.toUpperCase());
    let bucket = byLabel.get(label);
    if (!bucket) {
      bucket = [];
      byLabel.set(label, bucket);
      groups.push({ label, items: bucket });
    }
    bucket.push({ item, flatIndex });
  });

  return groups;
}

/** Moves the active command index by `delta` (+1 / -1) with wrap-around across enabled items. */
export function stepCommandPaletteIndex(
  items: readonly EmrCommandItem[],
  currentIndex: number,
  delta: 1 | -1,
): number {
  const count = items.length;
  if (count === 0) return -1;
  let next = currentIndex < 0 ? (delta === 1 ? -1 : 0) : currentIndex;
  for (let i = 0; i < count; i++) {
    next = (((next + delta) % count) + count) % count;
    if (!items[next]?.disabled) return next;
  }
  return -1;
}

export function resolveCommandPalettePresentation(
  model: Pick<EmrCommandPaletteViewModel, 'presentation'>,
): EmrCommandPalettePresentation {
  return model.presentation === 'inline' ? 'inline' : 'modal';
}

export function resolveCommandPaletteId(paletteId: string, idPrefix = ''): string {
  const prefix = idPrefix.trim().replace(/-+$/, '');
  const cleanId = paletteId.trim() || 'command-palette';
  return prefix ? `${prefix}-emr-cmd-${cleanId}` : `emr-cmd-${cleanId}`;
}

export function resolveCommandPaletteHeadingId(
  paletteId: string,
  idPrefix = '',
  headingId?: string | null,
): string {
  const explicit = headingId?.trim();
  if (explicit) return explicit;
  return `${resolveCommandPaletteId(paletteId, idPrefix)}-heading`;
}

export function resolveCommandPaletteListboxId(paletteId: string, idPrefix = ''): string {
  return `${resolveCommandPaletteId(paletteId, idPrefix)}-listbox`;
}

export function resolveCommandPaletteOptionId(
  paletteId: string,
  itemId: string,
  idPrefix = '',
): string {
  return `${resolveCommandPaletteId(paletteId, idPrefix)}-opt-${itemId}`;
}

export function canExecuteCommandItem(
  model: Pick<EmrCommandPaletteViewModel, 'readOnly'>,
  item?: Pick<EmrCommandItem, 'disabled'>,
): boolean {
  return !model.readOnly && Boolean(item && !item.disabled);
}

// ===========================================================================
// 3. EmrMasterDetail — Split inbox / work-queue master list + detail inspector
// ===========================================================================

export interface EmrMasterDetailFilter {
  readonly id: string;
  readonly label: string;
  readonly count?: number;
}

export interface EmrMasterDetailAction {
  readonly id: string;
  readonly label: string;
  readonly tone?: EmrTone;
  readonly primary?: boolean;
}

export interface EmrMasterDetailItem {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly timestampLabel?: string;
  readonly unread?: boolean;
  readonly priorityBadge?: EmrBadge;
  readonly statusBadge?: EmrBadge;
  readonly filterId?: string;
  readonly summaryFields?: readonly { readonly label: string; readonly value: string }[];
  readonly detailBody?: string;
  readonly actions?: readonly EmrMasterDetailAction[];
}

export interface EmrMasterDetailViewModel {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly searchQuery: string;
  readonly searchPlaceholder?: string;
  readonly activeFilterId: string;
  readonly filters: readonly EmrMasterDetailFilter[];
  readonly items: readonly EmrMasterDetailItem[];
  readonly selectedId?: string;
  readonly checkedIds?: readonly string[];
  readonly batchActions?: readonly EmrMasterDetailAction[];
  /** True when the detail pane is open on narrow/mobile viewports. */
  readonly mobileDetailOpen?: boolean;
  readonly emptyListMessage?: string;
  readonly emptyDetailMessage?: string;
  readonly readOnly?: boolean;
}

export type EmrMasterDetailIntent =
  | { readonly type: 'searchChanged'; readonly query: string }
  | { readonly type: 'filterChanged'; readonly filterId: string }
  | { readonly type: 'itemSelected'; readonly itemId: string }
  | { readonly type: 'detailClosed' }
  | { readonly type: 'batchSelectionToggled'; readonly itemId: string; readonly checkedIds: readonly string[] }
  | { readonly type: 'actionTriggered'; readonly actionId: string; readonly itemIds: readonly string[] };

export interface EmrMasterDetailLabels {
  readonly searchPlaceholder?: string;
  readonly searchLabel?: string;
  readonly filtersLabel?: string;
  readonly listLabelSuffix?: string;
  readonly detailLabel?: string;
  readonly backToList?: string;
  readonly unreadLabel?: string;
  readonly emptyListMessage?: string;
  readonly emptyDetailMessage?: string;
}

/** Filters master-detail items by activeFilterId ('all' matches everything) and searchQuery. */
export function filterMasterDetailItems(
  items: readonly EmrMasterDetailItem[],
  activeFilterId: string,
  searchQuery: string,
): readonly EmrMasterDetailItem[] {
  const q = searchQuery.trim().toLowerCase();
  return items.filter((item) => {
    if (activeFilterId && activeFilterId !== 'all' && item.filterId && item.filterId !== activeFilterId) {
      return false;
    }
    if (!q) return true;
    const text = [item.title, item.subtitle ?? '', item.detailBody ?? '', item.timestampLabel ?? '']
      .join(' ')
      .toLowerCase();
    return text.includes(q);
  });
}

/** Toggles an item ID inside the checkedIds list for batch operations. */
export function toggleMasterDetailCheckedId(
  checkedIds: readonly string[],
  itemId: string,
): readonly string[] {
  return checkedIds.includes(itemId)
    ? checkedIds.filter((id) => id !== itemId)
    : [...checkedIds, itemId];
}

export function resolveMasterDetailId(masterDetailId: string, idPrefix = ''): string {
  const prefix = idPrefix.trim().replace(/-+$/, '');
  const cleanId = masterDetailId.trim() || 'master-detail';
  return prefix ? `${prefix}-emr-md-${cleanId}` : `emr-md-${cleanId}`;
}

export function resolveMasterDetailHeadingId(
  masterDetailId: string,
  idPrefix = '',
  headingId?: string | null,
): string {
  const explicit = headingId?.trim();
  if (explicit) return explicit;
  return `${resolveMasterDetailId(masterDetailId, idPrefix)}-heading`;
}

export function canMutateMasterDetail(model: Pick<EmrMasterDetailViewModel, 'readOnly'>): boolean {
  return !model.readOnly;
}

// ===========================================================================
// 4. EmrSynchronizedTimeGrid — Scroll-synced longitudinal clinical time grid
// ===========================================================================

export type EmrTimeGridResolution = '15m' | '1h' | '4h' | '24h';

export type EmrTimeGridTrackKind = 'vitals' | 'trend' | 'medications' | 'events';

export interface EmrTimeGridColumn {
  readonly id: string;
  readonly timestamp: string;
  readonly label: string;
  readonly shiftBadge?: string;
  readonly encounterBadge?: string;
  readonly isCurrentTime?: boolean;
}

export interface EmrTimeGridCell {
  readonly columnId: string;
  readonly valueLabel: string;
  readonly secondaryLabel?: string;
  readonly badge?: EmrBadge;
  readonly abnormalTone?: EmrTone;
  readonly sparklineNorm?: number;
  readonly note?: string;
}

export interface EmrTimeGridRow {
  readonly id: string;
  readonly label: string;
  readonly unitLabel?: string;
  readonly referenceRangeLabel?: string;
  readonly cells: Readonly<Record<string, EmrTimeGridCell>>;
}

export interface EmrTimeGridTrack {
  readonly id: string;
  readonly title: string;
  readonly kind: EmrTimeGridTrackKind;
  readonly badge?: EmrBadge;
  readonly collapsed?: boolean;
  readonly rows: readonly EmrTimeGridRow[];
}

export interface EmrSynchronizedTimeGridViewModel {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly resolution: EmrTimeGridResolution;
  readonly availableResolutions?: readonly EmrTimeGridResolution[];
  readonly columns: readonly EmrTimeGridColumn[];
  readonly selectedColumnId?: string;
  readonly selectedCell?: {
    readonly trackId: string;
    readonly rowId: string;
    readonly columnId: string;
  };
  /** Synchronized horizontal column/scroll offset index. */
  readonly scrollOffset: number;
  readonly visibleColumnCount?: number;
  readonly tracks: readonly EmrTimeGridTrack[];
  readonly readOnly?: boolean;
}

export type EmrSynchronizedTimeGridIntent =
  | { readonly type: 'resolutionChanged'; readonly resolution: EmrTimeGridResolution }
  | { readonly type: 'scrollOffsetChanged'; readonly offset: number }
  | { readonly type: 'columnSelected'; readonly columnId: string }
  | { readonly type: 'trackToggled'; readonly trackId: string; readonly collapsed: boolean }
  | {
      readonly type: 'cellSelected';
      readonly trackId: string;
      readonly rowId: string;
      readonly columnId: string;
      readonly cell?: EmrTimeGridCell;
    };

export const TIME_GRID_RESOLUTIONS: readonly {
  readonly id: EmrTimeGridResolution;
  readonly label: string;
}[] = [
  { id: '15m', label: '15m' },
  { id: '1h', label: '1h' },
  { id: '4h', label: '4h' },
  { id: '24h', label: '24h' },
];

export interface EmrSynchronizedTimeGridLabels {
  readonly resolutionGroupLabel?: string;
  readonly scrollGroupLabel?: string;
  readonly earlier?: string;
  readonly later?: string;
  readonly timeAxisPrefix?: string;
  readonly nowBadge?: string;
}

/** Clamps horizontal column offset so visible window stays within `columns.length`. */
export function clampTimeGridScrollOffset(
  offset: number,
  totalColumns: number,
  visibleColumnCount = 6,
): number {
  const maxOffset = Math.max(0, totalColumns - Math.max(1, visibleColumnCount));
  return Math.max(0, Math.min(maxOffset, Math.round(offset)));
}

/** Returns true when the synchronized time grid can step earlier (-1) or later (+1). */
export function canStepTimeGridScroll(
  scrollOffset: number,
  totalColumns: number,
  visibleColumnCount: number | undefined,
  delta: -1 | 1,
): boolean {
  const count = Math.max(1, visibleColumnCount ?? totalColumns);
  const maxOffset = Math.max(0, totalColumns - count);
  const current = Math.max(0, Math.min(maxOffset, Math.round(scrollOffset)));
  return delta < 0 ? current > 0 : current < maxOffset;
}

/** Slices the visible time columns according to `scrollOffset` and `visibleColumnCount`. */
export function resolveTimeGridVisibleColumns(
  columns: readonly EmrTimeGridColumn[],
  scrollOffset: number,
  visibleColumnCount?: number,
): readonly EmrTimeGridColumn[] {
  const count = visibleColumnCount ?? columns.length;
  const start = clampTimeGridScrollOffset(scrollOffset, columns.length, count);
  return columns.slice(start, start + count);
}

export function resolveSynchronizedTimeGridId(gridId: string, idPrefix = ''): string {
  const prefix = idPrefix.trim().replace(/-+$/, '');
  const cleanId = gridId.trim() || 'time-grid';
  return prefix ? `${prefix}-emr-stg-${cleanId}` : `emr-stg-${cleanId}`;
}

export function resolveSynchronizedTimeGridHeadingId(
  gridId: string,
  idPrefix = '',
  headingId?: string | null,
): string {
  const explicit = headingId?.trim();
  if (explicit) return explicit;
  return `${resolveSynchronizedTimeGridId(gridId, idPrefix)}-heading`;
}
