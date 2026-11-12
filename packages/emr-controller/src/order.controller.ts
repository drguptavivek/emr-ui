import { StateController } from './contracts.js';
import type { LiveSearchOptions } from './search.controller.js';
import {
  EmrOption,
  GroupAddPreview,
  HierarchyNode,
  HierarchyOrderIntent,
  HierarchyOrderViewModel,
  SelectedOrder
} from './models.js';

export interface OrderCatalogueRepository {
  roots(query: string, signal: AbortSignal): Promise<readonly HierarchyNode[]>;
  children(nodeId: string, signal: AbortSignal): Promise<readonly HierarchyNode[]>;
  previewGroup(nodeId: string, signal: AbortSignal): Promise<GroupAddPreview>;
  resolveItem(nodeId: string, signal: AbortSignal): Promise<SelectedOrder>;
}

export class HierarchyOrderController extends StateController<
  HierarchyOrderViewModel,
  HierarchyOrderIntent
> {
  private request?: AbortController;
  private timer?: ReturnType<typeof setTimeout>;
  private queryGeneration = 0;

  constructor(
    title: string,
    private readonly repository: OrderCatalogueRepository,
    initial?: Partial<HierarchyOrderViewModel>,
    private readonly orderKind: SelectedOrder['kind'] = 'laboratory',
    private readonly liveSearch?: LiveSearchOptions
  ) {
    super({
      title,
      query: '',
      roots: [],
      selected: [],
      loading: false,
      ...initial
    });
  }

  dispatch(intent: HierarchyOrderIntent): void {
    if (this.isDestroyed()) return;
    switch (intent.type) {
      case 'queryChanged': {
        const generation = ++this.queryGeneration;
        const request = this.request;
        this.request?.abort();
        clearTimeout(this.timer);
        const debounce = this.liveSearch && intent.query.trim().length >= (this.liveSearch.minChars ?? 0)
          ? this.liveSearch.debounceMs : undefined;
        this.setState(state => ({ ...state, query: intent.query, roots: [], preview: undefined, loading: debounce !== undefined, error: undefined }));
        if (!this.isDestroyed() && generation === this.queryGeneration && request === this.request && debounce !== undefined) {
          this.timer = setTimeout(() => void this.search(), Math.max(0, debounce));
        }
        return;
      }
      case 'searchRequested':
      case 'retryRequested':
        void this.search();
        return;
      case 'nodeExpansionRequested':
        void this.expand(intent.nodeId, intent.expanded);
        return;
      case 'itemAddRequested':
        void this.addItem(intent.nodeId);
        return;
      case 'groupPreviewRequested':
        void this.preview(intent.nodeId);
        return;
      case 'groupPreviewDismissed':
        this.setState(state => ({ ...state, preview: undefined }));
        return;
      case 'groupAddConfirmed':
        this.confirmGroup(intent.groupId);
        return;
      case 'orderRemoveRequested':
        this.setState(state => ({
          ...state,
          selected: state.selected.filter(item => item.id !== intent.orderId)
        }));
        return;
      case 'orderDetailChanged':
        this.setState(state => ({
          ...state,
          selected: state.selected.map(item =>
            item.id === intent.orderId
              ? { ...item, details: { ...item.details, [intent.field]: intent.value } }
              : item
          )
        }));
        return;
    }
  }

  private async run<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    apply: (state: HierarchyOrderViewModel, value: T) => HierarchyOrderViewModel
  ): Promise<void> {
    if (this.isDestroyed()) return;
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    this.setState(state => ({ ...state, loading: true, error: undefined }));
    if (request.signal.aborted || this.isDestroyed()) return;
    try {
      const value = await operation(request.signal);
      if (request.signal.aborted) return;
      this.setState(state => ({ ...apply(state, value), loading: false }));
    } catch (error: unknown) {
      if (request.signal.aborted) return;
      this.setState(state => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to load catalogue'
      }));
    }
  }

  private async search(): Promise<void> {
    clearTimeout(this.timer);
    const query = this.getSnapshot().query;
    const generation = this.queryGeneration;
    const request = this.request;
    this.setState(state => ({ ...state, roots: [], preview: undefined }));
    if (this.isDestroyed() || generation !== this.queryGeneration || request !== this.request) return;
    await this.run(signal => this.repository.roots(query, signal),
      (state, roots) => ({ ...state, roots: [...roots] }));
  }

  private async expand(nodeId: string, expanded: boolean): Promise<void> {
    if (!expanded) {
      this.setState(state => ({ ...state, roots: updateNode(state.roots, nodeId, { expanded: false }) }));
      return;
    }
    const node = findNode(this.getSnapshot().roots, nodeId);
    if (node?.children) {
      this.setState(state => ({ ...state, roots: updateNode(state.roots, nodeId, { expanded: true }) }));
      return;
    }
    await this.run(signal => this.repository.children(nodeId, signal),
      (state, children) => ({
        ...state, roots: updateNode(state.roots, nodeId, { expanded: true, children: [...children] })
      }));
  }

  private async addItem(nodeId: string): Promise<void> {
    await this.run(signal => this.repository.resolveItem(nodeId, signal),
      (state, item) => state.selected.some(existing => existing.catalogueId === item.catalogueId)
      ? state
      : { ...state, selected: [...state.selected, item] });
  }

  private async preview(nodeId: string): Promise<void> {
    await this.run(signal => this.repository.previewGroup(nodeId, signal),
      (state, preview) => ({ ...state, preview }));
  }

  private confirmGroup(groupId: string): void {
    const preview = this.getSnapshot().preview;
    if (!preview || preview.groupId !== groupId) return;
    this.setState(state => {
      const existingIds = new Set(state.selected.map(item => item.catalogueId));
      const added: SelectedOrder[] = preview.items
        .filter(item => !existingIds.has(item.catalogueId))
        .map(item => ({
          id: `order-${item.catalogueId}`,
          catalogueId: item.catalogueId,
          label: item.label,
          code: item.code,
          kind: this.orderKind
        }));
      return { ...state, selected: [...state.selected, ...added], preview: undefined };
    });
  }

  protected override onDestroy(): void {
    clearTimeout(this.timer);
    this.request?.abort();
  }
}

function findNode(nodes: readonly HierarchyNode[], id: string): HierarchyNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = node.children && findNode(node.children, id);
    if (child) return child;
  }
  return undefined;
}

/** Filter a preloaded tree by label or code, retaining and expanding matching paths. */
export function filterHierarchy(nodes: readonly HierarchyNode[], query: string): readonly HierarchyNode[] {
  const term = query.trim().toLowerCase();
  if (!term) return nodes;
  return nodes.flatMap(node => {
    if (node.label.toLowerCase().includes(term) || node.code?.toLowerCase().includes(term)) {
      return [node.children?.length ? { ...node, expanded: true } : node];
    }
    const children = node.children ? filterHierarchy(node.children, term) : [];
    return children.length ? [{ ...node, children, expanded: true }] : [];
  });
}

/** Return matching selectable leaves with their ancestor labels as a breadcrumb. */
export function hierarchySearchOptions(nodes: readonly HierarchyNode[], query: string): readonly EmrOption[] {
  const term = query.trim().toLocaleLowerCase();
  const visit = (entries: readonly HierarchyNode[], ancestors: readonly string[]): EmrOption[] =>
    entries.flatMap(node => {
      if (node.children?.length) return visit(node.children, [...ancestors, node.label]);
      if (node.kind !== 'item' || !node.selectable) return [];
      if (term && ![...ancestors, node.label, node.code ?? ''].some(value => value.toLocaleLowerCase().includes(term))) return [];
      return [{ value: node.id, label: node.label, description: ancestors.join(' › ') || undefined, disabled: node.disabled }];
    });
  return visit(nodes, []);
}

function updateNode(
  nodes: readonly HierarchyNode[],
  id: string,
  patch: Partial<HierarchyNode>
): readonly HierarchyNode[] {
  return nodes.map(node => {
    if (node.id === id) return { ...node, ...patch };
    if (!node.children) return node;
    return { ...node, children: updateNode(node.children, id, patch) };
  });
}
