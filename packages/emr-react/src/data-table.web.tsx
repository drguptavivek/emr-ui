'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { SvgIcon } from './icons';
import { EmrBadgeView } from './primitives';
import { useEmrTheme } from './theme';
import {
  canChangeDataTablePage,
  canChangeDataTablePageSize,
  canMutateDataTableFilters,
  canMutateDataTableSavedFilter,
  canSelectDataTableRows,
  canSortDataTableColumn,
  canTriggerDataTableBulkAction,
  nextMenuIndex,
  nextRowIndex,
  nextSortDirection,
  resolveDataTableColumnWidth,
  resolveDataTableHeadingId,
  resolveDataTableId,
  selectAllState,
  toggleId,
  toggleSelectAll,
} from './data-table.logic';
import type { EmrDataTableCell, EmrDataTableLabels, EmrDataTableProps } from './data-table.types';

export type * from './data-table.types';

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

const SKELETON_ROWS = 5;
const hidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};
const textAlign = { start: 'left', end: 'right', center: 'center' } as const;

const DATA_TABLE_CSS = `
.emr-dt-root {
  container-type: inline-size;
  font-variant-numeric: tabular-nums;
}
.emr-dt-root .emr-dt-menu {
  left: 0;
}
.emr-dt-root .emr-dt-menu-item:hover:not([aria-disabled="true"]) {
  background: var(--emr-surface-raised, #eff3f5) !important;
}
.emr-dt-root .emr-dt-row:hover {
  background: var(--emr-surface-soft, #f1f4f5);
}
@container (max-width: 560px) {
  .emr-dt-root .emr-dt-spacer {
    display: none;
  }
  .emr-dt-root .emr-dt-toolbar,
  .emr-dt-root .emr-dt-nav {
    gap: 6px;
  }
}
@container (max-width: 400px) {
  .emr-dt-root .emr-dt-toolbar {
    position: relative;
  }
  .emr-dt-root .emr-dt-menu-wrap {
    position: static !important;
  }
  .emr-dt-root .emr-dt-menu {
    left: 0;
    right: auto;
    top: calc(100% + 4px) !important;
    min-width: 0 !important;
    width: min(220px, 100%);
    max-width: 100%;
    margin-top: 0 !important;
  }
}
.emr-print .emr-dt-root [data-emr-print="hide"],
.emr-print .emr-dt-root .emr-dt-check-col {
  display: none !important;
}
.emr-print .emr-dt-root .emr-dt-scroll {
  overflow: visible !important;
  max-height: none !important;
}
.emr-print .emr-dt-root .emr-dt-row {
  break-inside: avoid;
  page-break-inside: avoid;
}
.emr-print .emr-dt-root thead {
  display: table-header-group;
}
@media print {
  .emr-dt-root [data-emr-print="hide"],
  .emr-dt-root .emr-dt-check-col {
    display: none !important;
  }
  .emr-dt-root .emr-dt-scroll {
    overflow: visible !important;
    max-height: none !important;
  }
  .emr-dt-root .emr-dt-row {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .emr-dt-root thead {
    display: table-header-group;
  }
}
`;

/**
 * Web L3 controlled data table. Semantic <table>; the controller owns data, order, filters and paging, and
 * this component only emits intents. Rows are a roving-tabindex set (arrows move, Space selects, Enter opens).
 */
export function EmrDataTable({
  model,
  onIntent,
  headingId,
  idPrefix = '',
  labels,
  onFocus,
  onBlur,
}: EmrDataTableProps) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const reactUid = useId();
  const tableId = resolveDataTableId(idPrefix, `emr-dt-${reactUid.replace(/:/g, '')}`);
  const captionId = resolveDataTableHeadingId(idPrefix, headingId, tableId);

  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const focusWithinRef = useRef(false);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pendingMenuFocusRef = useRef<number | null>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

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
  const activeRow = Math.min(active, Math.max(rowIds.length - 1, 0));

  const hitSize = Math.max(44, t.controlHeight);
  const font: CSSProperties = { fontFamily: t.fontFamily, fontSize: t.textMd, color: t.text };
  const smFont: CSSProperties = { fontFamily: t.fontFamily, fontSize: t.textSm, color: t.text };
  const pad = compact ? '4px 10px' : '8px 12px';

  useEffect(() => {
    if (menuOpen && pendingMenuFocusRef.current !== null) {
      const idx = pendingMenuFocusRef.current;
      pendingMenuFocusRef.current = null;
      menuItemRefs.current[idx]?.focus();
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen || typeof document === 'undefined') return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target && !menuWrapRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  const handleRootFocus = () => {
    if (!focusWithinRef.current) {
      focusWithinRef.current = true;
      onFocus?.();
    }
  };

  const handleRootBlur = (e: FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && rootRef.current?.contains(next)) return;
    if (focusWithinRef.current) {
      focusWithinRef.current = false;
      setMenuOpen(false);
      onBlur?.();
    }
  };

  const ring = (key: string, offset = 2): CSSProperties =>
    focusKey === key ? { outline: `3px solid ${t.focus}`, outlineOffset: offset } : {};
  const focusProps = (key: string) => ({
    onFocus: (e: { target: unknown; currentTarget: unknown }) => {
      if (e.target === e.currentTarget) setFocusKey(key);
    },
    onBlur: () => setFocusKey((k) => (k === key ? null : k)),
  });

  const btn = (key: string, over?: CSSProperties): CSSProperties => ({
    ...smFont,
    minHeight: hitSize,
    minWidth: 44,
    padding: '0 12px',
    borderRadius: 6,
    cursor: 'pointer',
    border: `1px solid ${t.border}`,
    background: t.surface,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...ring(key),
    ...over,
  });

  const button = (
    key: string,
    label: string,
    onClick: () => void,
    opts: {
      inert?: boolean;
      pressed?: boolean;
      popup?: boolean;
      expanded?: boolean;
      controls?: string;
      buttonRef?: (el: HTMLButtonElement | null) => void;
      onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
    } = {},
  ) => (
    <button
      key={key}
      ref={opts.buttonRef}
      type="button"
      onClick={() => {
        if (opts.inert) return;
        onClick();
      }}
      onKeyDown={opts.onKeyDown}
      aria-disabled={opts.inert || undefined}
      aria-pressed={opts.pressed}
      aria-haspopup={opts.popup ? 'menu' : undefined}
      aria-expanded={opts.expanded}
      aria-controls={opts.controls}
      style={btn(key, {
        ...(opts.pressed ? { background: t.primarySoft, borderColor: t.primaryBorder, fontWeight: t.weightBold } : null),
        ...(opts.inert ? { opacity: 0.52, cursor: 'not-allowed' } : null),
      })}
      {...focusProps(key)}
    >
      {label}
    </button>
  );

  const checkbox = (
    key: string,
    label: string,
    state: 'none' | 'some' | 'all',
    onChange: () => void,
  ) => (
    <label
      style={{
        minWidth: hitSize,
        minHeight: hitSize,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: canSelectRows ? 'pointer' : 'not-allowed',
        opacity: canSelectRows ? 1 : 0.55,
      }}
    >
      <input
        type="checkbox"
        aria-label={label}
        aria-disabled={!canSelectRows || undefined}
        checked={state === 'all'}
        aria-checked={state === 'some' ? 'mixed' : state === 'all'}
        ref={(el) => {
          if (el) el.indeterminate = state === 'some';
        }}
        onChange={(e) => {
          if (!canSelectRows) {
            e.target.checked = state === 'all';
            return;
          }
          onChange();
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!canSelectRows) e.preventDefault();
        }}
        style={{
          width: 20,
          height: 20,
          margin: 0,
          cursor: 'inherit',
          accentColor: t.primary,
          ...ring(key),
        }}
        {...focusProps(key)}
      />
    </label>
  );

  const cellView = (c: EmrDataTableCell | undefined): ReactNode => {
    if (c === undefined) return null;
    if (typeof c === 'string') return c;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: c.text ? 8 : 0, flexWrap: 'wrap' }}>
        {c.text ? <span>{c.text}</span> : null}
        {c.badge ? <EmrBadgeView badge={c.badge} /> : null}
      </span>
    );
  };

  const onRowKey = (e: KeyboardEvent<HTMLTableRowElement>, i: number, id: string) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === ' ') {
      e.preventDefault();
      if (!canSelectRows) return;
      onIntent({ type: 'selectionChanged', selectedIds: toggleId(selected, id) });
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      onIntent({ type: 'rowActivated', id });
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const n = nextRowIndex(i, rowIds.length, e.key);
    setActive(n);
    rowRefs.current[n]?.focus();
  };

  const menuId = `${tableId}-saved-menu`;
  const menuItems = [
    ...model.savedFilters.map((s) => ({
      id: s.id,
      label: s.label,
      inert: false,
      run: () => onIntent({ type: 'savedFilterSelected', id: s.id }),
    })),
    {
      id: '__save',
      label: l.saveFilter,
      inert: !canSaveFilters,
      run: () => {
        if (canSaveFilters) onIntent({ type: 'saveFilterRequested' });
      },
    },
  ];

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const targetIdx = e.key === 'ArrowUp' ? Math.max(0, menuItems.length - 1) : 0;
      if (menuOpen) {
        menuItemRefs.current[targetIdx]?.focus();
      } else {
        pendingMenuFocusRef.current = targetIdx;
        setMenuOpen(true);
      }
    } else if (e.key === 'Escape' && menuOpen) {
      e.preventDefault();
      e.stopPropagation();
      setMenuOpen(false);
    }
  };

  const onMenuItemKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setMenuOpen(false);
      menuTriggerRef.current?.focus();
      return;
    }
    if (e.key === 'Tab') {
      setMenuOpen(false);
      return;
    }
    const nextIdx = nextMenuIndex(idx, menuItems.length, e.key);
    if (nextIdx === null) return;
    e.preventDefault();
    menuItemRefs.current[nextIdx]?.focus();
  };

  const th: CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    background: t.surfaceRaised,
    borderBottom: `2px solid ${t.border}`,
    padding: compact ? '2px 10px' : '4px 12px',
    fontSize: t.textSm,
    fontWeight: t.weightBold,
    whiteSpace: 'nowrap',
  };
  const rowHeight = compact ? 36 : 44;
  const colCount = model.columns.length + 1;
  const empty = !loading && !failed && model.rows.length === 0;
  const msg = (role: 'status' | 'alert', title: string, body?: string, extra?: ReactNode) => (
    <div role={role} style={{ ...font, padding: 32, textAlign: 'center', display: 'grid', gap: 8, justifyItems: 'center' }}>
      <strong>{title}</strong>
      {body ? <span style={{ color: t.textMuted, fontSize: t.textSm }}>{body}</span> : null}
      {extra}
    </div>
  );

  return (
    <div
      ref={rootRef}
      id={tableId}
      className="emr-dt-root"
      onFocus={handleRootFocus}
      onBlur={handleRootBlur}
      style={{
        ...font,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: 12,
        minWidth: 0,
        maxWidth: '100%',
      }}
    >
      <style>{DATA_TABLE_CSS}</style>

      <div
        className="emr-dt-toolbar"
        data-emr-print="hide"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', minWidth: 0 }}
      >
        <ul aria-label={l.filters} style={{ display: 'contents', listStyle: 'none', margin: 0, padding: 0 }}>
          {model.filters.map((f) => (
            <li
              key={f.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                minHeight: hitSize,
                fontSize: t.textSm,
                border: `1px solid ${t.primaryBorder}`,
                background: t.primarySoft,
                borderRadius: 999,
                paddingLeft: 12,
              }}
            >
              <span>
                <strong>{f.label}:</strong> {f.valueLabel}
              </span>
              <button
                type="button"
                aria-label={`${l.removeFilter}: ${f.label} ${f.valueLabel}`}
                aria-disabled={!canEditFilters || undefined}
                onClick={() => {
                  if (!canEditFilters) return;
                  onIntent({ type: 'filterRemoved', id: f.id });
                }}
                style={{
                  ...smFont,
                  minWidth: hitSize,
                  minHeight: hitSize,
                  display: 'inline-grid',
                  placeItems: 'center',
                  border: 0,
                  background: 'transparent',
                  cursor: canEditFilters ? 'pointer' : 'not-allowed',
                  opacity: canEditFilters ? 1 : 0.52,
                  borderRadius: 999,
                  ...ring(`f${f.id}`, -3),
                }}
                {...focusProps(`f${f.id}`)}
              >
                <SvgIcon name="close" size={14} color={t.text} />
              </button>
            </li>
          ))}
        </ul>
        {button(
          'addFilter',
          l.addFilter,
          () => onIntent({ type: 'filterAddRequested' }),
          { inert: !canEditFilters },
        )}
        <div
          ref={menuWrapRef}
          className="emr-dt-menu-wrap"
          style={{ position: 'relative' }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && menuOpen) {
              e.stopPropagation();
              setMenuOpen(false);
              menuTriggerRef.current?.focus();
            }
          }}
        >
          {button('saved', l.savedFilters, () => setMenuOpen((o) => !o), {
            popup: true,
            expanded: menuOpen,
            controls: menuId,
            buttonRef: (el) => {
              menuTriggerRef.current = el;
            },
            onKeyDown: onTriggerKeyDown,
          })}
          {menuOpen ? (
            <ul
              id={menuId}
              className="emr-dt-menu"
              role="menu"
              aria-label={l.savedFilters}
              style={{
                position: 'absolute',
                zIndex: 5,
                top: '100%',
                minWidth: 220,
                margin: '4px 0 0',
                padding: 4,
                listStyle: 'none',
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                boxShadow: t.shadow,
              }}
            >
              {menuItems.map((item, idx) => (
                <li key={item.id} role="none">
                  <button
                    ref={(el) => {
                      menuItemRefs.current[idx] = el;
                    }}
                    className="emr-dt-menu-item"
                    type="button"
                    role="menuitem"
                    aria-disabled={item.inert || undefined}
                    onClick={() => {
                      if (item.inert) return;
                      setMenuOpen(false);
                      item.run();
                    }}
                    onKeyDown={(e) => onMenuItemKeyDown(e, idx)}
                    style={{
                      ...smFont,
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      textAlign: 'left',
                      minHeight: hitSize,
                      padding: '0 12px',
                      border: 0,
                      borderRadius: 6,
                      background: 'transparent',
                      cursor: item.inert ? 'not-allowed' : 'pointer',
                      opacity: item.inert ? 0.52 : 1,
                      ...ring(`m${item.id}`, -3),
                    }}
                    {...focusProps(`m${item.id}`)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div
        className="emr-dt-toolbar"
        data-emr-print="hide"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', minWidth: 0 }}
      >
        <div role="group" aria-label={l.bulkActions} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {model.bulkActions.map((a) =>
            button(
              `b${a.id}`,
              a.label,
              () => onIntent({ type: 'bulkActionRequested', id: a.id }),
              { inert: !canBulkAction },
            ),
          )}
          {selected.length ? (
            <span role="status" style={{ color: t.textMuted, fontSize: t.textSm }}>
              {l.selectedCount.replace('{count}', String(selected.length))}
            </span>
          ) : null}
        </div>
        <div className="emr-dt-spacer" style={{ flex: 1 }} />
        {button('export', l.exportCsv, () => onIntent({ type: 'exportRequested', format: 'csv' }))}
        <div role="group" aria-label={l.density} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {button('dc', l.comfortable, () => onIntent({ type: 'densityChanged', density: 'comfortable' }), { pressed: !compact })}
          {button('dk', l.compact, () => onIntent({ type: 'densityChanged', density: 'compact' }), { pressed: compact })}
        </div>
      </div>

      <div
        className="emr-dt-scroll"
        aria-busy={loading}
        style={{
          overflow: 'auto',
          maxHeight: '70vh',
          maxWidth: '100%',
          minWidth: 0,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          background: t.surface,
        }}
      >
        <table
          aria-labelledby={captionId}
          style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}
        >
          <caption id={captionId} style={hidden}>
            {model.caption}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="emr-dt-check-col" style={{ ...th, width: 52, paddingInline: 4 }}>
                {checkbox('all', l.selectAll, all, () =>
                  onIntent({ type: 'selectionChanged', selectedIds: toggleSelectAll(rowIds, selected) }),
                )}
              </th>
              {model.columns.map((c) => {
                const dir = model.sort?.columnId === c.id ? model.sort.direction : undefined;
                const colWidth = resolveDataTableColumnWidth(c.width);
                const sortInert = loading || failed;
                return (
                  <th
                    key={c.id}
                    scope="col"
                    style={{ ...th, textAlign: textAlign[c.align ?? 'start'], width: colWidth }}
                    aria-sort={
                      c.sortable
                        ? dir === 'asc'
                          ? 'ascending'
                          : dir === 'desc'
                            ? 'descending'
                            : 'none'
                        : undefined
                    }
                  >
                    {c.sortable ? (
                      <button
                        type="button"
                        aria-disabled={sortInert || undefined}
                        onClick={() => {
                          if (!canSortDataTableColumn(model, c.id)) return;
                          onIntent({
                            type: 'sortChanged',
                            columnId: c.id,
                            direction: nextSortDirection(model.sort, c.id),
                          });
                        }}
                        style={{
                          ...smFont,
                          fontWeight: t.weightBold,
                          minHeight: hitSize,
                          minWidth: 44,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '0 6px',
                          border: 0,
                          borderRadius: 6,
                          background: 'transparent',
                          cursor: sortInert ? 'not-allowed' : 'pointer',
                          opacity: sortInert ? 0.55 : 1,
                          ...ring(`s${c.id}`),
                        }}
                        {...focusProps(`s${c.id}`)}
                      >
                        <span style={hidden}>{l.sortBy} </span>
                        <span>{c.label}</span>
                        <SvgIcon
                          name={dir === 'asc' ? 'chevron-up' : dir === 'desc' ? 'chevron-down' : 'chevrons-up-down'}
                          size={15}
                          color={dir ? t.primary : t.textMuted}
                        />
                        {dir ? (
                          <span style={hidden}>
                            , {dir === 'asc' ? l.sortedAscending : l.sortedDescending}
                          </span>
                        ) : null}
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                  <tr key={i} className="emr-dt-row" aria-hidden="true">
                    <td
                      className="emr-dt-check-col"
                      style={{ padding: pad, height: rowHeight, borderBottom: `1px solid ${t.border}` }}
                    >
                      <div style={{ height: 20, width: 20, marginInline: 'auto', borderRadius: 4, background: t.neutralSoft }} />
                    </td>
                    {Array.from({ length: colCount - 1 }, (_, j) => (
                      <td
                        key={j}
                        style={{ padding: pad, height: rowHeight, borderBottom: `1px solid ${t.border}` }}
                      >
                        <div style={{ height: 14, width: '72%', borderRadius: 4, background: t.neutralSoft }} />
                      </td>
                    ))}
                  </tr>
                ))
              : failed || empty
                ? null
                : model.rows.map((r, i) => {
                    const on = selected.includes(r.id);
                    return (
                      <tr
                        key={r.id}
                        className="emr-dt-row"
                        ref={(el) => {
                          rowRefs.current[i] = el;
                        }}
                        tabIndex={i === activeRow ? 0 : -1}
                        onFocus={(e) => {
                          if (e.target === e.currentTarget) {
                            setActive(i);
                            setFocusKey(`r${r.id}`);
                          }
                        }}
                        onBlur={() => setFocusKey((k) => (k === `r${r.id}` ? null : k))}
                        onKeyDown={(e) => onRowKey(e, i, r.id)}
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest('input,button,label')) {
                            onIntent({ type: 'rowActivated', id: r.id });
                          }
                        }}
                        style={{
                          cursor: 'pointer',
                          background: on ? t.primarySoft : undefined,
                          ...ring(`r${r.id}`, -3),
                        }}
                      >
                        <td
                          className="emr-dt-check-col"
                          style={{ padding: '4px', height: rowHeight, borderBottom: `1px solid ${t.border}` }}
                        >
                          {checkbox(`c${r.id}`, `${l.selectRow} ${i + 1}`, on ? 'all' : 'none', () =>
                            onIntent({ type: 'selectionChanged', selectedIds: toggleId(selected, r.id) }),
                          )}
                        </td>
                        {model.columns.map((c) => (
                          <td
                            key={c.id}
                            style={{
                              padding: pad,
                              height: rowHeight,
                              fontSize: compact ? t.textSm : t.textMd,
                              borderBottom: `1px solid ${t.border}`,
                              textAlign: textAlign[c.align ?? 'start'],
                            }}
                          >
                            {cellView(r.cells[c.id])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
          </tbody>
        </table>
        {loading ? <span role="status" style={hidden}>{l.loading}</span> : null}
        {empty ? msg('status', l.emptyTitle, l.emptyMessage) : null}
        {failed
          ? msg(
              'alert',
              l.errorTitle,
              model.error,
              <button
                type="button"
                data-emr-print="hide"
                onClick={() => onIntent({ type: 'retryRequested' })}
                {...focusProps('retry')}
                style={btn('retry', {
                  borderColor: t.primaryBorder,
                  color: t.primary,
                  borderRadius: 8,
                  fontWeight: t.weightBold,
                })}
              >
                {l.retry}
              </button>,
            )
          : null}
      </div>

      <nav
        className="emr-dt-nav"
        data-emr-print="hide"
        aria-label={model.caption}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', minWidth: 0 }}
      >
        <span role="status" style={{ color: t.textMuted, fontSize: t.textSm }}>
          {model.summaryLabel}
        </span>
        <div className="emr-dt-spacer" style={{ flex: 1 }} />
        {model.pageSizeOptions.length ? (
          <label
            htmlFor={`${tableId}-ps`}
            style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: t.textSm }}
          >
            <span>{l.rowsPerPage}</span>
            <select
              id={`${tableId}-ps`}
              value={model.pageSize}
              aria-disabled={loading || failed || undefined}
              onChange={(e) => {
                const nextSize = Number(e.target.value);
                if (!canChangeDataTablePageSize(model, nextSize)) {
                  e.target.value = String(model.pageSize);
                  return;
                }
                onIntent({ type: 'pageSizeChanged', pageSize: nextSize });
              }}
              style={btn('ps', { padding: '0 8px', minWidth: 72 })}
              {...focusProps('ps')}
            >
              {model.pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {button(
          'prev',
          l.previous,
          () => onIntent({ type: 'pageChanged', page: model.page - 1 }),
          { inert: !canPrev },
        )}
        <span role="status" aria-live="polite" style={{ fontSize: t.textSm }}>
          {l.pageOf.replace('{page}', String(model.page)).replace('{pageCount}', String(model.pageCount))}
        </span>
        {button(
          'next',
          l.next,
          () => onIntent({ type: 'pageChanged', page: model.page + 1 }),
          { inert: !canNext },
        )}
      </nav>
    </div>
  );
}
