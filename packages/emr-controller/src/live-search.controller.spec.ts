import { afterEach, describe, expect, it, vi } from 'vitest';
import { AsyncSearchController, filterHierarchy, hierarchySearchOptions, HierarchyOrderController, type HierarchyNode } from './index';

afterEach(() => vi.useRealTimers());

describe('live search', () => {
  it('debounces, observes minimum length, clears stale results, and cancels on destroy', async () => {
    vi.useFakeTimers();
    const search = vi.fn(async ({ query }: { query: string }) => ({ items: [query], total: 1 }));
    const controller = new AsyncSearchController({ search }, undefined, { debounceMs: 100, minChars: 2 });
    controller.dispatch({ type: 'queryChanged', query: 'a' });
    await vi.advanceTimersByTimeAsync(100);
    expect(search).not.toHaveBeenCalled();
    controller.dispatch({ type: 'queryChanged', query: 'ab' });
    controller.dispatch({ type: 'queryChanged', query: 'abc' });
    await vi.advanceTimersByTimeAsync(99);
    expect(search).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(controller.getSnapshot().options).toEqual(['abc']);
    controller.dispatch({ type: 'queryChanged', query: '' });
    expect(controller.getSnapshot()).toMatchObject({ options: [], total: 0, error: undefined });
    controller.dispatch({ type: 'queryChanged', query: 'later' });
    controller.destroy();
    await vi.advanceTimersByTimeAsync(100);
    expect(search).toHaveBeenCalledTimes(1);
  });

  it('does not queue live search when a subscriber tears down the controller during query publication', () => {
    vi.useFakeTimers();
    const search = vi.fn(async () => ({ items: [], total: 0 }));
    const roots = vi.fn(async () => []);
    const text = new AsyncSearchController({ search }, undefined, { debounceMs: 100 });
    const tree = new HierarchyOrderController('Orders', {
      roots, children: async () => [],
      previewGroup: async () => ({ groupId: 'g', groupLabel: 'Group', items: [], duplicateIds: [] }),
      resolveItem: async () => ({ id: 'i', catalogueId: 'i', label: 'Item', kind: 'laboratory' }),
    }, undefined, 'laboratory', { debounceMs: 100 });
    text.subscribe(state => { if (state.query) text.destroy(); });
    tree.subscribe(state => { if (state.query) tree.destroy(); });
    text.dispatch({ type: 'queryChanged', query: 'cbc' });
    tree.dispatch({ type: 'queryChanged', query: 'cbc' });
    expect(vi.getTimerCount()).toBe(0);
    expect(search).not.toHaveBeenCalled();
    expect(roots).not.toHaveBeenCalled();
  });

  it('keeps ancestors and expands paths to matching labels and codes', () => {
    const nodes: HierarchyNode[] = [{ id: 'a', label: 'Root', kind: 'group', selectable: false, children: [
      { id: 'b', label: 'Branch', kind: 'group', selectable: false, children: [
        { id: 'c', label: 'Glucose', code: 'GLU', kind: 'item', selectable: true },
        { id: 'd', label: 'Other', kind: 'item', selectable: true }
      ] }
    ] }];
    expect(filterHierarchy(nodes, '')).toEqual(nodes);
    expect(filterHierarchy(nodes, 'glu')).toMatchObject([{ id: 'a', expanded: true, children: [{ id: 'b', expanded: true, children: [{ id: 'c' }] }] }]);
    expect(filterHierarchy(nodes, 'missing')).toEqual([]);
  });

  it('returns matching selectable leaves with stable IDs and ancestor breadcrumbs', () => {
    const nodes: HierarchyNode[] = [{ id: 'a', label: 'Laboratory', kind: 'group', selectable: false, children: [
      { id: 'b', label: 'Chemistry', kind: 'group', selectable: false, children: [
        { id: 'glucose', label: 'Glucose', code: 'GLU', kind: 'item', selectable: true, disabled: true },
        { id: 'other', label: 'Other', kind: 'item', selectable: false }
      ] }
    ] }];
    expect(hierarchySearchOptions(nodes, 'glu')).toEqual([{ value: 'glucose', label: 'Glucose', description: 'Laboratory › Chemistry', disabled: true }]);
    expect(hierarchySearchOptions(nodes, 'chemistry')).toHaveLength(1);
    expect(hierarchySearchOptions(nodes, 'missing')).toEqual([]);
    expect(hierarchySearchOptions([], '')).toEqual([]);
  });

  it('reopens filtered children without fetching unrelated siblings and fetches unloaded branches', async () => {
    const match: HierarchyNode = { id: 'cbc', label: 'Blood count', code: 'CBC', kind: 'item', selectable: true };
    const children = vi.fn(async () => [match, { id: 'esr', label: 'ESR', kind: 'item' as const, selectable: true }]);
    const controller = new HierarchyOrderController('Orders', {
      roots: async () => [], children,
      previewGroup: async () => ({ groupId: 'g', groupLabel: 'Group', items: [], duplicateIds: [] }),
      resolveItem: async () => ({ id: 'i', catalogueId: 'i', label: 'Item', kind: 'laboratory' })
    }, { roots: [
      { id: 'filtered', label: 'Filtered', kind: 'group', selectable: false, expanded: true, children: [match] },
      { id: 'lazy', label: 'Lazy', kind: 'group', selectable: false }
    ] });
    controller.dispatch({ type: 'nodeExpansionRequested', nodeId: 'filtered', expanded: false });
    controller.dispatch({ type: 'nodeExpansionRequested', nodeId: 'filtered', expanded: true });
    expect(children).not.toHaveBeenCalled();
    expect(controller.getSnapshot().roots[0]).toMatchObject({ expanded: true, children: [match] });
    controller.dispatch({ type: 'nodeExpansionRequested', nodeId: 'lazy', expanded: true });
    await Promise.resolve(); await Promise.resolve();
    expect(children).toHaveBeenCalledWith('lazy', expect.any(AbortSignal));
    expect(controller.getSnapshot().roots[1]?.children).toHaveLength(2);
  });

  it('aborts stale hierarchy work and clears its preview when the query changes', async () => {
    vi.useFakeTimers();
    let resolveRoots!: (nodes: readonly HierarchyNode[]) => void;
    let signal: AbortSignal | undefined;
    const roots = vi.fn((_query: string, current: AbortSignal) => {
      signal = current;
      return new Promise<readonly HierarchyNode[]>(resolve => { resolveRoots = resolve; });
    });
    const controller = new HierarchyOrderController('Orders', {
      roots, children: async () => [],
      previewGroup: async () => ({ groupId: 'g', groupLabel: 'Group', items: [], duplicateIds: [] }),
      resolveItem: async () => ({ id: 'i', catalogueId: 'i', label: 'Item', kind: 'laboratory' })
    }, undefined, 'laboratory', { debounceMs: 50 });
    controller.dispatch({ type: 'groupPreviewRequested', nodeId: 'g' });
    await Promise.resolve(); await Promise.resolve();
    controller.dispatch({ type: 'searchRequested' });
    controller.dispatch({ type: 'queryChanged', query: 'new' });
    expect(signal?.aborted).toBe(true);
    resolveRoots([{ id: 'old', label: 'Old', kind: 'item', selectable: true }]);
    await Promise.resolve(); await Promise.resolve();
    expect(controller.getSnapshot()).toMatchObject({ roots: [], preview: undefined, loading: true });
    controller.destroy();
    await vi.advanceTimersByTimeAsync(50);
    expect(roots).toHaveBeenCalledTimes(1);
  });

  it('does not commit a completed search after a queued query change', async () => {
    let resolveRoots!: (nodes: readonly HierarchyNode[]) => void;
    const controller = new HierarchyOrderController('Orders', {
      roots: () => new Promise(resolve => { resolveRoots = resolve; }),
      children: async () => [],
      previewGroup: async () => ({ groupId: 'g', groupLabel: 'Group', items: [], duplicateIds: [] }),
      resolveItem: async () => ({ id: 'i', catalogueId: 'i', label: 'Item', kind: 'laboratory' })
    });
    controller.dispatch({ type: 'queryChanged', query: 'cbc' });
    controller.dispatch({ type: 'searchRequested' });
    resolveRoots([{ id: 'cbc', label: 'CBC', kind: 'item', selectable: true }]);
    queueMicrotask(() => controller.dispatch({ type: 'queryChanged', query: 'esr' }));
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(controller.getSnapshot()).toMatchObject({ query: 'esr', roots: [], loading: false });
  });
});
