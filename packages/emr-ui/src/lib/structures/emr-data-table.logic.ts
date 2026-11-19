import type {
  EmrDataTableLabels,
  EmrDataTableModel,
  EmrDataTableSelectAllState,
  EmrDataTableSort,
  EmrDataTableSortDirection,
} from '@drguptavivek/emr-controller';

export const DEFAULT_DATA_TABLE_LABELS: Required<EmrDataTableLabels> = {
  selectAll: 'Select all rows on this page',
  selectRow: 'Select row',
  filters: 'Active filters',
  removeFilter: 'Remove filter',
  addFilter: 'Add filter',
  savedFilters: 'Saved filters',
  saveFilter: 'Save current filter',
  exportCsv: 'Export CSV',
  density: 'Row density',
  comfortable: 'Comfortable',
  compact: 'Compact',
  bulkActions: 'Bulk actions',
  selectedCount: '{count} selected',
  sortedAscending: 'sorted ascending',
  sortedDescending: 'sorted descending',
  sortBy: 'Sort by',
  previous: 'Previous',
  next: 'Next',
  rowsPerPage: 'Rows per page',
  pageOf: 'Page {page} of {pageCount}',
  loading: 'Loading rows',
  emptyTitle: 'No rows to show',
  emptyMessage: 'Try removing a filter.',
  errorTitle: 'Could not load rows',
  retry: 'Retry',
  nativeUnavailable: 'This table is available on the web app.',
};

export function resolveDataTableLabels(
  labels?: Partial<EmrDataTableLabels>,
): Required<EmrDataTableLabels> {
  return { ...DEFAULT_DATA_TABLE_LABELS, ...labels };
}

export function resolveDataTableId(idPrefix = '', fallbackId = ''): string {
  const prefix = idPrefix.trim().replace(/-+$/, '');
  if (prefix) return `${prefix}-emr-data-table`;
  return fallbackId.trim() || 'emr-data-table';
}

export function resolveDataTableHeadingId(
  idPrefix = '',
  headingId?: string | null,
  fallbackId = '',
): string {
  const explicit = headingId?.trim();
  if (explicit) return explicit;
  return `${resolveDataTableId(idPrefix, fallbackId)}-caption`;
}

export function resolveDataTableColumnWidth(width?: number | string): string | null {
  if (width === undefined || width === null || width === '') return null;
  return typeof width === 'number' ? `${width}px` : width;
}

export function canSelectDataTableRows(
  model: Pick<EmrDataTableModel, 'readOnly' | 'status'>,
): boolean {
  return !model.readOnly && model.status !== 'loading' && model.status !== 'error';
}

export function canMutateDataTableFilters(
  model: Pick<EmrDataTableModel, 'readOnly' | 'status'>,
): boolean {
  return !model.readOnly && model.status !== 'loading';
}

export function canMutateDataTableSavedFilter(
  model: Pick<EmrDataTableModel, 'readOnly' | 'status'>,
): boolean {
  return !model.readOnly && model.status !== 'loading';
}

export function canTriggerDataTableBulkAction(
  model: Pick<EmrDataTableModel, 'readOnly' | 'status' | 'selectedIds'>,
): boolean {
  return !model.readOnly && model.status !== 'loading' && model.status !== 'error' && model.selectedIds.length > 0;
}

export function canSortDataTableColumn(
  model: Pick<EmrDataTableModel, 'columns' | 'status'>,
  columnId: string,
): boolean {
  if (model.status === 'loading' || model.status === 'error') return false;
  return model.columns.some((col) => col.id === columnId && Boolean(col.sortable));
}

export function canChangeDataTablePage(
  model: Pick<EmrDataTableModel, 'page' | 'pageCount' | 'status'>,
  targetPage: number,
): boolean {
  if (model.status === 'loading' || model.status === 'error') return false;
  return targetPage >= 1 && targetPage <= model.pageCount && targetPage !== model.page;
}

export function canChangeDataTablePageSize(
  model: Pick<EmrDataTableModel, 'pageSizeOptions' | 'status'>,
  pageSize: number,
): boolean {
  if (model.status === 'loading' || model.status === 'error') return false;
  return model.pageSizeOptions.includes(pageSize);
}

export function selectAllDataTableState(
  pageIds: readonly string[],
  selected: readonly string[],
): EmrDataTableSelectAllState {
  if (pageIds.length === 0) return 'none';
  const set = new Set(selected);
  const count = pageIds.filter((id) => set.has(id)).length;
  return count === 0 ? 'none' : count === pageIds.length ? 'all' : 'some';
}

export function toggleAllDataTableSelection(
  pageIds: readonly string[],
  selected: readonly string[],
): string[] {
  const pageSet = new Set(pageIds);
  const rest = selected.filter((id) => !pageSet.has(id));
  return selectAllDataTableState(pageIds, selected) === 'all' ? rest : [...rest, ...pageIds];
}

export function toggleDataTableRowSelection(selected: readonly string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
}

export function nextDataTableRowIndex(current: number, count: number, key: string): number | null {
  if (count <= 0) return null;
  const clamped = current >= 0 && current < count ? current : 0;
  switch (key) {
    case 'ArrowDown':
      return Math.min(clamped + 1, count - 1);
    case 'ArrowUp':
      return Math.max(clamped - 1, 0);
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

export function nextDataTableSortDirection(
  current: EmrDataTableSort | undefined,
  columnId: string,
): EmrDataTableSortDirection {
  return current?.columnId === columnId && current.direction === 'asc' ? 'desc' : 'asc';
}

export function nextDataTableMenuIndex(current: number, count: number, key: string): number | null {
  if (count <= 0) return null;
  switch (key) {
    case 'ArrowDown':
      return (current + 1) % count;
    case 'ArrowUp':
      return (current - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}
