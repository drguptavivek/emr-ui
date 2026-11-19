import type {
  EmrCommandCategory,
  EmrCommandGroup,
  EmrCommandItem,
  EmrCommandPaletteLabels,
  EmrCommandPalettePresentation,
  EmrCommandPaletteViewModel,
  EmrMasterDetailItem,
  EmrMasterDetailLabels,
  EmrMasterDetailViewModel,
  EmrSplitWorkspaceLabels,
  EmrSplitWorkspacePane,
  EmrSplitWorkspacePreset,
  EmrSplitWorkspaceViewModel,
  EmrSynchronizedTimeGridLabels,
  EmrTimeGridColumn,
  EmrTimeGridResolution,
  EmrTone,
} from '@drguptavivek/emr-controller';

export const SPLIT_WORKSPACE_PRESETS: readonly {
  readonly id: EmrSplitWorkspacePreset;
  readonly label: string;
}[] = [
  { id: '2-pane-50-50', label: '50 / 50' },
  { id: '2-pane-40-60', label: '40 / 60' },
  { id: '3-pane', label: '3-Pane' },
  { id: 'focus-primary', label: 'Focus Primary' },
];

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

export const TIME_GRID_RESOLUTIONS: readonly EmrTimeGridResolution[] = [
  '15m',
  '1h',
  '4h',
  '24h',
];

const DEFAULT_SPLIT_WORKSPACE_LABELS: Required<EmrSplitWorkspaceLabels> = {
  tag: 'WORKSTATION',
  defaultTitle: 'Clinical Encounter Split Workspace',
  presetsLabel: 'Workspace layout presets',
  mobileTabsLabel: 'Mobile workspace panes',
  collapse: 'Collapse',
  expand: 'Expand',
  resizeDividerLabel: 'Resize divider',
  shrinkPaneLabel: 'Shrink',
  growPaneLabel: 'Grow',
};

const DEFAULT_COMMAND_PALETTE_LABELS: Required<EmrCommandPaletteLabels> = {
  defaultTitle: 'Quick Orders, SmartPhrases & Navigation',
  defaultPlaceholder: 'Type a command, order, SmartPhrase (.iop), or patient route...',
  closeLabel: 'Close command palette (Escape)',
  searchLabel: 'Search clinical commands',
  categoriesLabel: 'Command categories',
  resultsLabel: 'Matching clinical commands',
  emptyMessage: 'No matching commands, orders, or SmartPhrases.',
  pinnedLabel: 'Pinned',
  recentLabel: 'Recent',
};

const DEFAULT_MASTER_DETAIL_LABELS: Required<EmrMasterDetailLabels> = {
  searchPlaceholder: 'Filter work queue or inbox items...',
  searchLabel: 'Search master list',
  filtersLabel: 'List filters',
  listLabelSuffix: ' items',
  detailLabel: 'Selected item detail inspector',
  backToList: 'Back to list',
  unreadLabel: 'Unread',
  emptyListMessage: 'No matching queue items.',
  emptyDetailMessage: 'Select an item from the list to inspect details.',
};

const DEFAULT_TIME_GRID_LABELS: Required<EmrSynchronizedTimeGridLabels> = {
  resolutionGroupLabel: 'Time resolution zoom',
  scrollGroupLabel: 'Time window scroll',
  earlier: 'Earlier',
  later: 'Later',
  timeAxisPrefix: 'Time Axis',
  nowBadge: 'NOW',
};

export function resolveSplitWorkspaceLabels(
  labels?: Partial<EmrSplitWorkspaceLabels>,
): Required<EmrSplitWorkspaceLabels> {
  return { ...DEFAULT_SPLIT_WORKSPACE_LABELS, ...labels };
}

export function resolveCommandPaletteLabels(
  labels?: Partial<EmrCommandPaletteLabels>,
): Required<EmrCommandPaletteLabels> {
  return { ...DEFAULT_COMMAND_PALETTE_LABELS, ...labels };
}

export function resolveMasterDetailLabels(
  labels?: Partial<EmrMasterDetailLabels>,
): Required<EmrMasterDetailLabels> {
  return { ...DEFAULT_MASTER_DETAIL_LABELS, ...labels };
}

export function resolveSynchronizedTimeGridLabels(
  labels?: Partial<EmrSynchronizedTimeGridLabels>,
): Required<EmrSynchronizedTimeGridLabels> {
  return { ...DEFAULT_TIME_GRID_LABELS, ...labels };
}

export function isWorkstationNarrow(containerWidth: number | null, windowWidth = 0): boolean {
  if (containerWidth !== null && containerWidth > 0) {
    return containerWidth <= 720;
  }
  if (windowWidth > 0) {
    return windowWidth <= 720;
  }
  return false;
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

export function resolveSplitWorkspacePresetSizes(
  preset: EmrSplitWorkspacePreset,
  paneCount = 3,
): readonly number[] {
  if (paneCount <= 1) return [100];
  if (paneCount === 2) {
    if (preset === '2-pane-40-60' || preset === '3-pane') return [40, 60];
    if (preset === 'focus-primary') return [75, 25];
    return [50, 50];
  }
  if (preset === '3-pane') return [25, 50, 25];
  if (preset === 'focus-primary') return [70, 15, 15];
  if (preset === '2-pane-40-60') return [35, 45, 20];
  return [40, 40, 20];
}

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

export function stepSplitWorkspacePaneSizes(
  sizes: readonly number[],
  dividerIndex: number,
  deltaPct: number,
  minPctOrPanes: number | readonly Pick<EmrSplitWorkspacePane, 'minWidthPct'>[] = 15,
  defaultMinPct = 15,
): readonly number[] {
  if (dividerIndex < 0 || dividerIndex >= sizes.length - 1) return [...sizes];
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

export function visibleSplitWorkspacePanes(
  panes: readonly EmrSplitWorkspacePane[],
  preset: EmrSplitWorkspacePreset,
): readonly EmrSplitWorkspacePane[] {
  return preset === '3-pane' ? panes.slice(0, 3) : panes.slice(0, 2);
}

export function canMutateSplitWorkspace(model: Pick<EmrSplitWorkspaceViewModel, 'readOnly'>): boolean {
  return !model.readOnly;
}

export function resolveCommandPalettePresentation(
  model: Pick<EmrCommandPaletteViewModel, 'presentation'>,
): EmrCommandPalettePresentation {
  return model.presentation === 'inline' ? 'inline' : 'modal';
}

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

export function canExecuteCommandItem(
  model: Pick<EmrCommandPaletteViewModel, 'readOnly'>,
  item?: Pick<EmrCommandItem, 'disabled'>,
): boolean {
  return !model.readOnly && Boolean(item && !item.disabled);
}

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

export function toggleMasterDetailCheckedId(
  checkedIds: readonly string[],
  itemId: string,
): readonly string[] {
  return checkedIds.includes(itemId)
    ? checkedIds.filter((id) => id !== itemId)
    : [...checkedIds, itemId];
}

export function canMutateMasterDetail(model: Pick<EmrMasterDetailViewModel, 'readOnly'>): boolean {
  return !model.readOnly;
}

export function clampTimeGridScrollOffset(
  offset: number,
  totalColumns: number,
  visibleColumnCount = 6,
): number {
  const maxOffset = Math.max(0, totalColumns - Math.max(1, visibleColumnCount));
  return Math.max(0, Math.min(maxOffset, Math.round(offset)));
}

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

export function resolveTimeGridVisibleColumns(
  columns: readonly EmrTimeGridColumn[],
  scrollOffset: number,
  visibleColumnCount?: number,
): readonly EmrTimeGridColumn[] {
  const count = visibleColumnCount ?? columns.length;
  const start = clampTimeGridScrollOffset(scrollOffset, columns.length, count);
  return columns.slice(start, start + count);
}

export function clampSparklineNorm(value?: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, value));
}

export function normalizeTone(tone?: EmrTone): EmrTone {
  return tone ?? 'neutral';
}
