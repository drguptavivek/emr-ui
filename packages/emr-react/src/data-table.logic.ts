/** Pure helpers for the data table (no React, no DOM). Nothing here orders or fetches rows. */
import {
  canChangeDataTablePage,
  canChangeDataTablePageSize,
  canMutateDataTableFilters,
  canMutateDataTableSavedFilter,
  canSelectDataTableRows,
  canSortDataTableColumn,
  canTriggerDataTableBulkAction,
  nextDataTableRowIndex,
  nextDataTableSortDirection,
  resolveDataTableColumnWidth,
  resolveDataTableHeadingId,
  resolveDataTableId,
  selectAllDataTableState,
  toggleAllDataTableSelection,
  toggleDataTableRowSelection,
  type EmrDataTableSelectAllState,
  type EmrDataTableSortDirection,
} from '@drguptavivek/emr-controller';

export type SelectAllState = EmrDataTableSelectAllState;

export {
  canChangeDataTablePage,
  canChangeDataTablePageSize,
  canMutateDataTableFilters,
  canMutateDataTableSavedFilter,
  canSelectDataTableRows,
  canSortDataTableColumn,
  canTriggerDataTableBulkAction,
  resolveDataTableColumnWidth,
  resolveDataTableHeadingId,
  resolveDataTableId,
};

/** Tri-state of the select-all-on-page box. An empty page is 'none'. */
export function selectAllState(pageIds: readonly string[], selected: readonly string[]): SelectAllState {
  return selectAllDataTableState(pageIds, selected);
}

/** Selection after toggling select-all: 'all' clears the page's rows, otherwise selects them. Off-page picks survive. */
export function toggleSelectAll(pageIds: readonly string[], selected: readonly string[]): string[] {
  return toggleAllDataTableSelection(pageIds, selected);
}

export function toggleId(selected: readonly string[], id: string): string[] {
  return toggleDataTableRowSelection(selected, id);
}

/** Roving row index after a key; clamped, never wraps. Unknown keys keep the index. */
export function nextRowIndex(current: number, count: number, key: string): number {
  return nextDataTableRowIndex(current, count, key);
}

/** Header press: flip the active column, otherwise start ascending. */
export function nextSortDirection(
  current: { columnId: string; direction: EmrDataTableSortDirection } | undefined,
  columnId: string,
): EmrDataTableSortDirection {
  return nextDataTableSortDirection(current, columnId);
}

export function nextMenuIndex(current: number, count: number, key: string): number | null {
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
