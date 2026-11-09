'use client';

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmrCard, EmrChip, EmrStateMessage } from './l1-display';
import { EmrCheckbox } from './l1-inputs';
import { EmrBadgeView, EmrButton, EmrOptionChip, EmrRow } from './primitives';
import { nextSortDirection, selectAllState, toggleId, toggleSelectAll } from './data-table.logic';
import { fontFamily, fontWeight, useEmrTheme } from './theme';
import type { EmrDataTableCell, EmrDataTableLabels, EmrDataTableProps } from './data-table.types';

export type * from './data-table.types';

const DEFAULTS: EmrDataTableLabels = {
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

function CellView({ cell }: { cell: EmrDataTableCell | undefined }) {
  const t = useEmrTheme();
  if (cell === undefined) return null;
  if (typeof cell === 'string') {
    return <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{cell}</Text>;
  }
  return (
    <View style={styles.wrap}>
      {cell.text ? <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{cell.text}</Text> : null}
      {cell.badge ? <EmrBadgeView badge={cell.badge} /> : null}
    </View>
  );
}

/**
 * Native L3 data table: renders filters, bulk actions, sort chips, selectable row cards, and pagination
 * using React Native Views so phone/tablet Expo screens have full parity with `data-table.web.tsx`.
 */
export function EmrDataTable({ model, onIntent, labels }: EmrDataTableProps) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const loading = model.status === 'loading';
  const failed = model.status === 'error';
  const rowIds = model.rows.map(r => r.id);
  const selected = model.selectedIds;
  const all = selectAllState(rowIds, selected);
  const base = { color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t) };
  const muted = { color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) };
  const bold = { ...base, fontWeight: fontWeight(t.weightBold) };
  const sortableCols = model.columns.filter(c => c.sortable);

  return (
    <View role="region" aria-label={model.caption} style={styles.stack}>
      <View style={styles.wrap}>
        {model.filters.map(f => (
          <View key={f.id} style={styles.wrap}>
            <EmrChip>{`${f.label}: ${f.valueLabel}`}</EmrChip>
            <EmrButton
              small
              variant="ghost"
              label="×"
              accessibilityLabel={`${l.removeFilter}: ${f.label} ${f.valueLabel}`}
              onPress={() => onIntent({ type: 'filterRemoved', id: f.id })}
            />
          </View>
        ))}
        <EmrButton small variant="outline" label={l.addFilter} onPress={() => onIntent({ type: 'filterAddRequested' })} />
        <EmrButton small variant="outline" label={l.exportCsv} onPress={() => onIntent({ type: 'exportRequested', format: 'csv' })} />
      </View>

      {model.bulkActions.length ? (
        <View role="group" aria-label={l.bulkActions} style={styles.wrap}>
          <EmrCheckbox
            label={l.selectAll}
            value={all === 'all'}
            onValueChange={() => onIntent({ type: 'selectionChanged', selectedIds: toggleSelectAll(rowIds, selected) })}
          />
          {model.bulkActions.map(a => (
            <EmrButton
              key={a.id}
              small
              variant="outline"
              disabled={selected.length === 0}
              label={a.label}
              onPress={() => onIntent({ type: 'bulkActionRequested', id: a.id })}
            />
          ))}
          {selected.length ? <Text style={muted}>{l.selectedCount.replace('{count}', String(selected.length))}</Text> : null}
        </View>
      ) : null}

      {sortableCols.length ? (
        <View role="group" aria-label={l.sortBy}>
          <EmrRow>
            {sortableCols.map(c => {
              const dir = model.sort?.columnId === c.id ? model.sort.direction : undefined;
              const arrow = dir === 'asc' ? ' ▲' : dir === 'desc' ? ' ▼' : '';
              return (
                <EmrOptionChip
                  key={c.id}
                  label={`${c.label}${arrow}`}
                  selected={!!dir}
                  onPress={() => onIntent({ type: 'sortChanged', columnId: c.id, direction: nextSortDirection(model.sort, c.id) })}
                />
              );
            })}
          </EmrRow>
        </View>
      ) : null}

      {loading ? (
        <EmrStateMessage kind="loading" title={l.loading} />
      ) : failed ? (
        <EmrStateMessage kind="error" title={l.errorTitle} message={model.error}>
          <EmrButton variant="outline" label={l.retry} onPress={() => onIntent({ type: 'retryRequested' })} />
        </EmrStateMessage>
      ) : model.rows.length === 0 ? (
        <EmrStateMessage kind="empty" title={l.emptyTitle} message={l.emptyMessage} />
      ) : (
        <View style={styles.stack}>
          {model.rows.map(row => {
            const on = selected.includes(row.id);
            return (
              <EmrCard key={row.id}>
                <View style={styles.stack}>
                  <View style={styles.between}>
                    <EmrCheckbox
                      label={l.selectRow}
                      value={on}
                      onValueChange={() => onIntent({ type: 'selectionChanged', selectedIds: toggleId(selected, row.id) })}
                    />
                  </View>
                  <Pressable
                    role="button"
                    aria-label={model.columns.map(c => {
                      const v = row.cells[c.id];
                      return typeof v === 'string' ? `${c.label}: ${v}` : v?.text ? `${c.label}: ${v.text}` : '';
                    }).filter(Boolean).join(', ')}
                    onPress={() => onIntent({ type: 'rowActivated', id: row.id })}
                    style={styles.stack}
                  >
                    {model.columns.map(c => (
                      <View key={c.id} style={styles.wrap}>
                        <Text style={[muted, styles.colLabel]}>{c.label}:</Text>
                        <View style={styles.shrink}><CellView cell={row.cells[c.id]} /></View>
                      </View>
                    ))}
                  </Pressable>
                </View>
              </EmrCard>
            );
          })}
        </View>
      )}

      <View role="navigation" aria-label={model.caption} style={styles.between}>
        <Text style={muted}>{model.summaryLabel}</Text>
        <View style={styles.wrap}>
          <EmrButton
            small
            variant="outline"
            label={l.previous}
            disabled={model.page <= 1}
            onPress={() => onIntent({ type: 'pageChanged', page: model.page - 1 })}
          />
          <Text style={bold}>{l.pageOf.replace('{page}', String(model.page)).replace('{pageCount}', String(model.pageCount))}</Text>
          <EmrButton
            small
            variant="outline"
            label={l.next}
            disabled={model.page >= model.pageCount}
            onPress={() => onIntent({ type: 'pageChanged', page: model.page + 1 })}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  colLabel: { minWidth: 96 },
  shrink: { flexShrink: 1, minWidth: 0 },
});
