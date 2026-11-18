import type {
  EmrTabOption,
  EmrTabsOrientation,
} from '@drguptavivek/emr-controller';

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
