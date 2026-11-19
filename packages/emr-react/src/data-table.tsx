'use client';

import { useId } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgIcon } from './icons';
import { EmrCard, EmrChip, EmrStateMessage } from './l1-display';
import { EmrCheckbox } from './l1-inputs';
import { EmrBadgeView, EmrButton, EmrRow, EmrSelect } from './primitives';
import {
  canChangeDataTablePage,
  canChangeDataTablePageSize,
  canMutateDataTableFilters,
  canMutateDataTableSavedFilter,
  canSelectDataTableRows,
  canSortDataTableColumn,
  canTriggerDataTableBulkAction,
  nextSortDirection,
  resolveDataTableId,
  selectAllState,
  toggleId,
  toggleSelectAll,
} from './data-table.logic';
import { fontFamily, fontWeight, useEmrTheme } from './theme';
import type { EmrDataTableCell, EmrDataTableLabels, EmrDataTableProps } from './data-table.types';

export type * from './data-table.types';

const RESOLVED_MONO_FONT = (webMono: string): string | undefined =>
  Platform.OS === 'web'
    ? webMono
    : Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const DEFAULTS: Required<EmrDataTableLabels> = {
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

function CellView({
  cell,
  compact,
  tabular,
}: {
  cell: EmrDataTableCell | undefined;
  compact: boolean;
  tabular?: boolean;
}) {
  const t = useEmrTheme();
  const monoFont = RESOLVED_MONO_FONT(t.fontMono);
  if (cell === undefined) return null;
  const textStyle = {
    color: t.text,
    fontSize: compact ? t.textSm : t.textMd,
    fontFamily: tabular ? monoFont : fontFamily(t),
    ...(tabular ? ({ fontVariant: ['tabular-nums'] } as object) : null),
  };
  if (typeof cell === 'string') {
    return <Text style={textStyle}>{cell}</Text>;
  }
  return (
    <View style={styles.wrap}>
      {cell.text ? <Text style={textStyle}>{cell.text}</Text> : null}
      {cell.badge ? <EmrBadgeView badge={cell.badge} /> : null}
    </View>
  );
}

/**
 * Native L3 data table: renders filters, saved filters, density switcher, bulk actions, sort controls,
 * always-accessible select-all, selectable row cards, rows-per-page selector, and pagination using
 * React Native Views so phone/tablet Expo screens have full parity with `data-table.web.tsx`.
 */
export function EmrDataTable({
  model,
  onIntent,
  idPrefix = '',
  labels,
  onFocus,
  onBlur,
}: EmrDataTableProps) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const reactUid = useId();
  const tableId = resolveDataTableId(idPrefix, `emr-dt-${reactUid.replace(/:/g, '')}`);
  const monoFont = RESOLVED_MONO_FONT(t.fontMono);

  const loading = model.status === 'loading';
  const failed = model.status === 'error';
  const compact = model.density === 'compact';
  const canSelectRows = canSelectDataTableRows(model);
  const canEditFilters = canMutateDataTableFilters(model);
  const canSaveFilters = canMutateDataTableSavedFilter(model);
  const canBulkAction = canTriggerDataTableBulkAction(model);
  const canPrev = canChangeDataTablePage(model, model.page - 1);
  const canNext = canChangeDataTablePage(model, model.page + 1);

  const rowIds = model.rows.map((r) => r.id);
  const selected = model.selectedIds;
  const all = selectAllState(rowIds, selected);
  const minHit = Math.max(44, t.controlHeight);

  const base = { color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t) };
  const muted = { color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) };
  const tabularMuted = {
    ...muted,
    fontFamily: monoFont,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  };
  const boldTabular = {
    ...base,
    fontFamily: monoFont,
    fontWeight: fontWeight(t.weightBold),
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  };
  const sortableCols = model.columns.filter((c) => c.sortable);

  return (
    <View
      nativeID={tableId}
      role="region"
      aria-label={model.caption}
      style={[styles.stack, { gap: compact ? 8 : 10 }]}
      {...(Platform.OS === 'web' ? ({ onFocus, onBlur } as object) : null)}
    >
      {/* Active filters & filter actions */}
      <View style={styles.wrap}>
        {model.filters.map((f) => (
          <View key={f.id} style={styles.chipPair}>
            <EmrChip>{`${f.label}: ${f.valueLabel}`}</EmrChip>
            <EmrButton
              small
              variant="ghost"
              disabled={!canEditFilters}
              accessibilityLabel={`${l.removeFilter}: ${f.label} ${f.valueLabel}`}
              onPress={() => {
                if (canEditFilters) onIntent({ type: 'filterRemoved', id: f.id });
              }}
            >
              <SvgIcon name="close" size={14} color={t.text} />
            </EmrButton>
          </View>
        ))}
        <EmrButton
          small
          variant="outline"
          disabled={!canEditFilters}
          label={l.addFilter}
          onPress={() => {
            if (canEditFilters) onIntent({ type: 'filterAddRequested' });
          }}
        />
        <EmrButton
          small
          variant="outline"
          label={l.exportCsv}
          onPress={() => onIntent({ type: 'exportRequested', format: 'csv' })}
        />
      </View>

      {/* Saved filters */}
      {model.savedFilters.length > 0 || canSaveFilters ? (
        <View role="group" aria-label={l.savedFilters} style={styles.wrap}>
          <Text style={muted}>{l.savedFilters}:</Text>
          {model.savedFilters.map((sf) => (
            <EmrButton
              key={sf.id}
              small
              variant="outline"
              label={sf.label}
              onPress={() => onIntent({ type: 'savedFilterSelected', id: sf.id })}
            />
          ))}
          <EmrButton
            small
            variant="outline"
            disabled={!canSaveFilters}
            label={l.saveFilter}
            onPress={() => {
              if (canSaveFilters) onIntent({ type: 'saveFilterRequested' });
            }}
          />
        </View>
      ) : null}

      {/* Density toggle */}
      <View role="group" aria-label={l.density} style={styles.wrap}>
        <EmrButton
          small
          variant={!compact ? 'primary' : 'outline'}
          pressed={!compact}
          label={l.comfortable}
          onPress={() => onIntent({ type: 'densityChanged', density: 'comfortable' })}
        />
        <EmrButton
          small
          variant={compact ? 'primary' : 'outline'}
          pressed={compact}
          label={l.compact}
          onPress={() => onIntent({ type: 'densityChanged', density: 'compact' })}
        />
      </View>

      {/* Always-accessible Select-All & Bulk actions */}
      {model.rows.length > 0 || model.bulkActions.length > 0 ? (
        <View role="group" aria-label={l.bulkActions} style={styles.wrap}>
          <EmrCheckbox
            label={l.selectAll}
            value={all === 'all'}
            mixed={all === 'some'}
            readOnly={!canSelectRows}
            onValueChange={() => {
              if (!canSelectRows) return;
              onIntent({ type: 'selectionChanged', selectedIds: toggleSelectAll(rowIds, selected) });
            }}
          />
          {model.bulkActions.map((a) => (
            <EmrButton
              key={a.id}
              small
              variant="outline"
              disabled={!canBulkAction}
              label={a.label}
              onPress={() => {
                if (canBulkAction) onIntent({ type: 'bulkActionRequested', id: a.id });
              }}
            />
          ))}
          {selected.length ? (
            <Text style={tabularMuted}>{l.selectedCount.replace('{count}', String(selected.length))}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Sortable column chips */}
      {sortableCols.length ? (
        <View role="group" aria-label={l.sortBy}>
          <EmrRow>
            {sortableCols.map((c) => {
              const dir = model.sort?.columnId === c.id ? model.sort.direction : undefined;
              const sortLabel = dir
                ? `${c.label}, ${dir === 'asc' ? l.sortedAscending : l.sortedDescending}`
                : `${l.sortBy} ${c.label}`;
              return (
                <EmrButton
                  key={c.id}
                  small
                  variant={dir ? 'primary' : 'outline'}
                  pressed={Boolean(dir)}
                  disabled={loading || failed}
                  accessibilityLabel={sortLabel}
                  onPress={() => {
                    if (!canSortDataTableColumn(model, c.id)) return;
                    onIntent({
                      type: 'sortChanged',
                      columnId: c.id,
                      direction: nextSortDirection(model.sort, c.id),
                    });
                  }}
                >
                  <Text
                    style={{
                      color: dir ? t.primaryContrast : t.text,
                      fontSize: t.textSm,
                      fontWeight: fontWeight(650),
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {c.label}
                  </Text>
                  <SvgIcon
                    name={dir === 'asc' ? 'chevron-up' : dir === 'desc' ? 'chevron-down' : 'chevrons-up-down'}
                    size={14}
                    color={dir ? t.primaryContrast : t.textMuted}
                  />
                </EmrButton>
              );
            })}
          </EmrRow>
        </View>
      ) : null}

      {/* Body states */}
      {loading ? (
        <EmrStateMessage kind="loading" title={l.loading} />
      ) : failed ? (
        <EmrStateMessage kind="error" title={l.errorTitle} message={model.error}>
          <EmrButton variant="outline" label={l.retry} onPress={() => onIntent({ type: 'retryRequested' })} />
        </EmrStateMessage>
      ) : model.rows.length === 0 ? (
        <EmrStateMessage kind="empty" title={l.emptyTitle} message={l.emptyMessage} />
      ) : (
        <View style={[styles.stack, { gap: compact ? 6 : 10 }]}>
          {model.rows.map((row, idx) => {
            const on = selected.includes(row.id);
            return (
              <EmrCard key={row.id} padding={compact ? 'sm' : 'md'}>
                <View style={[styles.stack, { gap: compact ? 6 : 8 }]}>
                  <View style={styles.between}>
                    <EmrCheckbox
                      label={`${l.selectRow} ${idx + 1}`}
                      value={on}
                      readOnly={!canSelectRows}
                      onValueChange={() => {
                        if (!canSelectRows) return;
                        onIntent({ type: 'selectionChanged', selectedIds: toggleId(selected, row.id) });
                      }}
                    />
                  </View>
                  <Pressable
                    role="button"
                    aria-label={model.columns
                      .map((c) => {
                        const v = row.cells[c.id];
                        return typeof v === 'string' ? `${c.label}: ${v}` : v?.text ? `${c.label}: ${v.text}` : '';
                      })
                      .filter(Boolean)
                      .join(', ')}
                    onPress={() => onIntent({ type: 'rowActivated', id: row.id })}
                    style={[styles.stack, { minHeight: minHit, gap: compact ? 4 : 6 }]}
                  >
                    {model.columns.map((c) => (
                      <View key={c.id} style={styles.wrap}>
                        <Text style={[muted, styles.colLabel]}>{c.label}:</Text>
                        <View style={styles.shrink}>
                          <CellView cell={row.cells[c.id]} compact={compact} tabular={c.align === 'end'} />
                        </View>
                      </View>
                    ))}
                  </Pressable>
                </View>
              </EmrCard>
            );
          })}
        </View>
      )}

      {/* Pagination & Rows per page */}
      <View role="navigation" aria-label={model.caption} style={styles.between}>
        <Text style={tabularMuted}>{model.summaryLabel}</Text>
        <View style={styles.wrap}>
          {model.pageSizeOptions.length > 0 ? (
            <View style={styles.pageSizeWrap}>
              <Text style={muted}>{l.rowsPerPage}</Text>
              <View style={styles.pageSizeSelect}>
                <EmrSelect
                  controlId={`${tableId}-ps`}
                  label={l.rowsPerPage}
                  labelHidden
                  size="sm"
                  tabularNums
                  disabled={loading || failed}
                  options={model.pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
                  value={String(model.pageSize)}
                  onValueChange={(val) => {
                    if (!val) return;
                    const nextSize = Number(val);
                    if (canChangeDataTablePageSize(model, nextSize)) {
                      onIntent({ type: 'pageSizeChanged', pageSize: nextSize });
                    }
                  }}
                />
              </View>
            </View>
          ) : null}
          <EmrButton
            small
            variant="outline"
            label={l.previous}
            disabled={!canPrev}
            onPress={() => {
              if (canPrev) onIntent({ type: 'pageChanged', page: model.page - 1 });
            }}
          />
          <Text style={boldTabular}>
            {l.pageOf.replace('{page}', String(model.page)).replace('{pageCount}', String(model.pageCount))}
          </Text>
          <EmrButton
            small
            variant="outline"
            label={l.next}
            disabled={!canNext}
            onPress={() => {
              if (canNext) onIntent({ type: 'pageChanged', page: model.page + 1 });
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  chipPair: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  between: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  colLabel: { minWidth: 96 },
  shrink: { flexShrink: 1, minWidth: 0 },
  pageSizeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pageSizeSelect: { minWidth: 84 },
});
