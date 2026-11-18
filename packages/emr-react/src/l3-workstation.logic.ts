import type {
  EmrCommandCategory,
  EmrCommandGroup,
  EmrCommandItem,
  EmrMasterDetailItem,
  EmrSplitWorkspacePane,
  EmrSplitWorkspacePreset,
  EmrTimeGridResolution,
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

export function stepSplitWorkspacePaneSizes(
  sizes: readonly number[],
  dividerIndex: number,
  deltaPct: number,
  minPct = 15,
): readonly number[] {
  if (dividerIndex < 0 || dividerIndex >= sizes.length - 1) return [...sizes];
  const left = sizes[dividerIndex]!;
  const right = sizes[dividerIndex + 1]!;
  const combined = left + right;
  const clampedMin = Math.min(minPct, combined / 2);
  const nextLeft = Math.max(clampedMin, Math.min(combined - clampedMin, Math.round(left + deltaPct)));
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
  let next = currentIndex;
  for (let i = 0; i < count; i++) {
    next = (((next + delta) % count) + count) % count;
    if (!items[next]?.disabled) return next;
  }
  return -1;
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

export function clampTimeGridScrollOffset(
  offset: number,
  totalColumns: number,
  visibleColumnCount = 6,
): number {
  const maxOffset = Math.max(0, totalColumns - Math.max(1, visibleColumnCount));
  return Math.max(0, Math.min(maxOffset, Math.round(offset)));
}
