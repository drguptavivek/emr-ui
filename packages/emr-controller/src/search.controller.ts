import {
  SearchRepository,
  StateController
} from './contracts.js';

export interface AsyncSearchState<Item> {
  query: string;
  options: readonly Item[];
  selected: readonly Item[];
  loading: boolean;
  error?: string;
  page: number;
  pageSize: number;
  total: number;
}

export type AsyncSearchIntent<Item> =
  | { type: 'queryChanged'; query: string }
  | { type: 'searchRequested' }
  | { type: 'pageChanged'; page: number }
  | { type: 'selectionChanged'; selected: readonly Item[] }
  | { type: 'retryRequested' };

export interface LiveSearchOptions {
  debounceMs: number;
  minChars?: number;
}

export class AsyncSearchController<Item> extends StateController<
  AsyncSearchState<Item>,
  AsyncSearchIntent<Item>
> {
  private request?: AbortController;
  private requestSequence = 0;
  private timer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly repository: SearchRepository<Item>,
    initial?: Partial<AsyncSearchState<Item>>,
    private readonly liveSearch?: LiveSearchOptions
  ) {
    super({
      query: '',
      options: [],
      selected: [],
      loading: false,
      page: 1,
      pageSize: 20,
      total: 0,
      ...initial
    });
  }

  dispatch(intent: AsyncSearchIntent<Item>): void {
    if (this.isDestroyed()) return;
    switch (intent.type) {
      case 'queryChanged': {
        // A response for the previous query must never populate under the new one.
        this.request?.abort();
        const querySequence = ++this.requestSequence;
        clearTimeout(this.timer);
        const debounce = this.liveSearch && intent.query.trim().length >= (this.liveSearch.minChars ?? 0)
          ? this.liveSearch.debounceMs : undefined;
        this.setState(state => ({ ...state, query: intent.query, page: 1, options: [], total: 0, loading: debounce !== undefined, error: undefined }));
        if (!this.isDestroyed() && querySequence === this.requestSequence && debounce !== undefined) {
          this.timer = setTimeout(() => void this.search(), Math.max(0, debounce));
        }
        return;
      }
      case 'pageChanged':
        this.setState(state => ({ ...state, page: intent.page }));
        void this.search();
        return;
      case 'selectionChanged':
        this.setState(state => ({ ...state, selected: [...intent.selected] }));
        return;
      case 'searchRequested':
      case 'retryRequested':
        void this.search();
        return;
    }
  }

  private async search(): Promise<void> {
    if (this.isDestroyed()) return;
    clearTimeout(this.timer);
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    const sequence = ++this.requestSequence;
    const snapshot = this.getSnapshot();
    this.setState(state => ({ ...state, loading: true, error: undefined }));

    if (request.signal.aborted || this.isDestroyed()) return;
    try {
      const result = await this.repository.search({
        query: snapshot.query,
        page: snapshot.page,
        pageSize: snapshot.pageSize,
        signal: request.signal
      });
      if (sequence !== this.requestSequence || request.signal.aborted) return;
      this.setState(state => ({
        ...state,
        options: [...result.items],
        total: result.total,
        loading: false
      }));
    } catch (error: unknown) {
      if (request.signal.aborted || sequence !== this.requestSequence) return;
      this.setState(state => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : 'Search failed'
      }));
    }
  }

  protected override onDestroy(): void {
    clearTimeout(this.timer);
    this.request?.abort();
  }
}
