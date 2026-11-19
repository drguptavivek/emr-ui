import { describe, expect, it } from 'vitest';
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
  type EmrDataTableModel,
} from './surface-contracts.models.js';

const baseModel: EmrDataTableModel = {
  caption: 'Referrals',
  columns: [
    { id: 'patient', label: 'Patient', sortable: true, width: 180 },
    { id: 'status', label: 'Status', width: '25%' },
  ],
  rows: [
    { id: 'r1', cells: { patient: 'Meera Nair', status: 'Pending' } },
    { id: 'r2', cells: { patient: 'Rohan Iyer', status: 'Booked' } },
  ],
  selectedIds: ['r1'],
  sort: { columnId: 'patient', direction: 'asc' },
  filters: [{ id: 'pending', label: 'Status', valueLabel: 'Pending' }],
  savedFilters: [{ id: 'pending', label: 'Pending only' }],
  bulkActions: [{ id: 'assign', label: 'Assign' }],
  density: 'comfortable',
  page: 1,
  pageCount: 3,
  pageSize: 10,
  pageSizeOptions: [5, 10, 25],
  summaryLabel: 'Showing 1-2 of 24',
  status: 'ready',
};

describe('EmrDataTable controller contract helpers', () => {
  it('gates row selection, filter mutation, saved-filter mutation, and bulk actions on readOnly and status', () => {
    expect(canSelectDataTableRows(baseModel)).toBe(true);
    expect(canMutateDataTableFilters(baseModel)).toBe(true);
    expect(canMutateDataTableSavedFilter(baseModel)).toBe(true);
    expect(canTriggerDataTableBulkAction(baseModel)).toBe(true);

    const readOnly = { ...baseModel, readOnly: true };
    expect(canSelectDataTableRows(readOnly)).toBe(false);
    expect(canMutateDataTableFilters(readOnly)).toBe(false);
    expect(canMutateDataTableSavedFilter(readOnly)).toBe(false);
    expect(canTriggerDataTableBulkAction(readOnly)).toBe(false);

    const loading = { ...baseModel, status: 'loading' as const };
    expect(canSelectDataTableRows(loading)).toBe(false);
    expect(canMutateDataTableFilters(loading)).toBe(false);
    expect(canMutateDataTableSavedFilter(loading)).toBe(false);
    expect(canTriggerDataTableBulkAction(loading)).toBe(false);

    const emptySel = { ...baseModel, selectedIds: [] };
    expect(canTriggerDataTableBulkAction(emptySel)).toBe(false);
  });

  it('keeps sort, page, and pageSize guards active in readOnly while rejecting invalid targets', () => {
    const readOnly = { ...baseModel, readOnly: true };
    expect(canSortDataTableColumn(readOnly, 'patient')).toBe(true);
    expect(canSortDataTableColumn(readOnly, 'status')).toBe(false);
    expect(canSortDataTableColumn(readOnly, 'missing')).toBe(false);
    expect(canSortDataTableColumn({ ...readOnly, status: 'loading' }, 'patient')).toBe(false);

    expect(canChangeDataTablePage(readOnly, 2)).toBe(true);
    expect(canChangeDataTablePage(readOnly, 1)).toBe(false);
    expect(canChangeDataTablePage(readOnly, 0)).toBe(false);
    expect(canChangeDataTablePage(readOnly, 4)).toBe(false);

    expect(canChangeDataTablePageSize(readOnly, 25)).toBe(true);
    expect(canChangeDataTablePageSize(readOnly, 100)).toBe(false);
  });

  it('resolves deterministic IDs, heading IDs, and column widths', () => {
    expect(resolveDataTableId('ward-a-')).toBe('ward-a-emr-data-table');
    expect(resolveDataTableId('', 'fallback-1')).toBe('fallback-1');
    expect(resolveDataTableHeadingId('ward-a', 'custom-cap')).toBe('custom-cap');
    expect(resolveDataTableHeadingId('ward-a', undefined)).toBe('ward-a-emr-data-table-caption');
    expect(resolveDataTableColumnWidth(160)).toBe('160px');
    expect(resolveDataTableColumnWidth('20%')).toBe('20%');
    expect(resolveDataTableColumnWidth(undefined)).toBeUndefined();
  });

  it('computes tri-state select-all, preserves off-page selections, roving index, and sort toggle', () => {
    expect(selectAllDataTableState(['r1', 'r2'], [])).toBe('none');
    expect(selectAllDataTableState(['r1', 'r2'], ['r1', 'other'])).toBe('some');
    expect(selectAllDataTableState(['r1', 'r2'], ['r2', 'r1'])).toBe('all');
    expect(selectAllDataTableState([], ['r1'])).toBe('none');

    expect(toggleAllDataTableSelection(['r1', 'r2'], ['other'])).toEqual(['other', 'r1', 'r2']);
    expect(toggleAllDataTableSelection(['r1', 'r2'], ['r1', 'r2', 'other'])).toEqual(['other']);
    expect(toggleDataTableRowSelection(['r1'], 'r2')).toEqual(['r1', 'r2']);
    expect(toggleDataTableRowSelection(['r1', 'r2'], 'r1')).toEqual(['r2']);

    expect(nextDataTableRowIndex(0, 3, 'ArrowUp')).toBe(0);
    expect(nextDataTableRowIndex(1, 3, 'ArrowDown')).toBe(2);
    expect(nextDataTableRowIndex(1, 3, 'Home')).toBe(0);
    expect(nextDataTableRowIndex(0, 3, 'End')).toBe(2);

    expect(nextDataTableSortDirection(undefined, 'patient')).toBe('asc');
    expect(nextDataTableSortDirection({ columnId: 'patient', direction: 'asc' }, 'patient')).toBe('desc');
    expect(nextDataTableSortDirection({ columnId: 'patient', direction: 'desc' }, 'patient')).toBe('asc');
  });
});
