import { ChangeDetectionStrategy, Component, ElementRef, QueryList, ViewChildren, computed, input, output, signal } from '@angular/core';
import type {
  EmrDataTableCell,
  EmrDataTableIntent,
  EmrDataTableModel,
  EmrDataTableSortDirection,
} from '@drguptavivek/emr-controller';

const DEFAULT_LABELS = {
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
};
export type EmrDataTableLabels = typeof DEFAULT_LABELS;

let nextTableId = 0;

/**
 * L3 controlled data table: renders controller-supplied rows, active filter chips, saved-filter menu,
 * bulk actions, density switcher, sortable headers, multi-row selection, roving-tabindex keyboard
 * navigation, and pagination. Never sorts, filters, slices, or fetches rows itself.
 */
@Component({
  selector: 'emr-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    @let compact = m.density === 'compact';
    <div class="emr-dt" [class.emr-dt--compact]="compact">
      <div class="emr-dt__toolbar">
        <ul class="emr-dt__filters" [attr.aria-label]="l.filters">
          @for (f of m.filters; track f.id) {
            <li class="emr-dt__filter-chip">
              <span><strong>{{ f.label }}:</strong> {{ f.valueLabel }}</span>
              <button
                type="button"
                class="emr-dt__chip-remove"
                [attr.aria-label]="l.removeFilter + ': ' + f.label + ' ' + f.valueLabel"
                (click)="intent.emit({ type: 'filterRemoved', id: f.id })"
              ><span aria-hidden="true">×</span></button>
            </li>
          }
        </ul>
        <button type="button" class="emr-button emr-button--outline emr-button--small" (click)="intent.emit({ type: 'filterAddRequested' })">{{ l.addFilter }}</button>
        <div class="emr-dt__menu-wrap" (keydown.escape)="menuOpen.set(false)">
          <button
            type="button"
            class="emr-button emr-button--outline emr-button--small"
            aria-haspopup="menu"
            [attr.aria-expanded]="menuOpen()"
            (click)="menuOpen.set(!menuOpen())"
          >{{ l.savedFilters }}</button>
          @if (menuOpen()) {
            <ul role="menu" class="emr-dt__menu" [attr.aria-label]="l.savedFilters">
              @for (s of m.savedFilters; track s.id) {
                <li role="none">
                  <button type="button" role="menuitem" class="emr-dt__menu-item" (click)="menuOpen.set(false); intent.emit({ type: 'savedFilterSelected', id: s.id })">{{ s.label }}</button>
                </li>
              }
              <li role="none">
                <button type="button" role="menuitem" class="emr-dt__menu-item" (click)="menuOpen.set(false); intent.emit({ type: 'saveFilterRequested' })">{{ l.saveFilter }}</button>
              </li>
            </ul>
          }
        </div>
      </div>

      <div class="emr-dt__toolbar">
        <div role="group" class="emr-dt__bulk" [attr.aria-label]="l.bulkActions">
          @for (a of m.bulkActions; track a.id) {
            <button
              type="button"
              class="emr-button emr-button--outline emr-button--small"
              [disabled]="m.selectedIds.length === 0"
              (click)="intent.emit({ type: 'bulkActionRequested', id: a.id })"
            >{{ a.label }}</button>
          }
          @if (m.selectedIds.length) {
            <span role="status" class="emr-dt__muted">{{ selectedText() }}</span>
          }
        </div>
        <div class="emr-dt__spacer"></div>
        <button type="button" class="emr-button emr-button--outline emr-button--small" (click)="intent.emit({ type: 'exportRequested', format: 'csv' })">{{ l.exportCsv }}</button>
        <div role="group" class="emr-dt__density" [attr.aria-label]="l.density">
          <button
            type="button"
            class="emr-button emr-button--outline emr-button--small"
            [attr.aria-pressed]="!compact"
            (click)="intent.emit({ type: 'densityChanged', density: 'comfortable' })"
          >{{ l.comfortable }}</button>
          <button
            type="button"
            class="emr-button emr-button--outline emr-button--small"
            [attr.aria-pressed]="compact"
            (click)="intent.emit({ type: 'densityChanged', density: 'compact' })"
          >{{ l.compact }}</button>
        </div>
      </div>

      <div class="emr-dt__scroll" [attr.aria-busy]="m.status === 'loading'">
        <table class="emr-dt__table">
          <caption class="emr-sr-only" [id]="headingId() ?? uid + '-caption'">{{ m.caption }}</caption>
          <thead>
            <tr>
              <th scope="col" class="emr-dt__th emr-dt__th--check">
                <input
                  type="checkbox"
                  class="emr-dt__checkbox"
                  [attr.aria-label]="l.selectAll"
                  [checked]="allState() === 'all'"
                  [indeterminate]="allState() === 'some'"
                  [attr.aria-checked]="allState() === 'some' ? 'mixed' : allState() === 'all'"
                  (change)="onToggleAll()"
                />
              </th>
              @for (c of m.columns; track c.id) {
                @let dir = m.sort?.columnId === c.id ? m.sort.direction : undefined;
                <th
                  scope="col"
                  class="emr-dt__th"
                  [class.emr-dt__cell--end]="c.align === 'end'"
                  [class.emr-dt__cell--center]="c.align === 'center'"
                  [attr.aria-sort]="c.sortable ? (dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none') : null"
                >
                  @if (c.sortable) {
                    <button type="button" class="emr-dt__sort-btn" (click)="onSort(c.id)">
                      <span class="emr-sr-only">{{ l.sortBy }} </span>{{ c.label }}
                      <span aria-hidden="true">{{ dir === 'asc' ? ' ▲' : dir === 'desc' ? ' ▼' : ' ↕' }}</span>
                      @if (dir) {
                        <span class="emr-sr-only">, {{ dir === 'asc' ? l.sortedAscending : l.sortedDescending }}</span>
                      }
                    </button>
                  } @else {
                    {{ c.label }}
                  }
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @if (m.status !== 'loading' && m.status !== 'error') {
              @for (r of m.rows; track r.id; let i = $index) {
                @let selected = isSelected(r.id);
                <tr
                  #rowEl
                  class="emr-dt__row"
                  [class.emr-dt__row--selected]="selected"
                  [attr.tabindex]="i === activeIndex() ? 0 : -1"
                  (focus)="activeIndex.set(i)"
                  (keydown)="onRowKey($event, i, r.id)"
                  (click)="onRowClick($event, r.id)"
                >
                  <td class="emr-dt__td emr-dt__td--check">
                    <input
                      type="checkbox"
                      class="emr-dt__checkbox"
                      [attr.aria-label]="l.selectRow"
                      [checked]="selected"
                      (change)="onToggleRow(r.id)"
                      (click)="$event.stopPropagation()"
                    />
                  </td>
                  @for (c of m.columns; track c.id) {
                    @let cell = r.cells[c.id];
                    <td
                      class="emr-dt__td"
                      [class.emr-dt__cell--end]="c.align === 'end'"
                      [class.emr-dt__cell--center]="c.align === 'center'"
                    >
                      @if (cell !== undefined) {
                        @if (isTextCell(cell)) {
                          {{ cell }}
                        } @else {
                          <span>{{ cell.text }}</span>
                          @if (cell.badge; as b) {
                            <span class="emr-badge emr-tone-{{ b.tone }} emr-dt__badge">
                              {{ b.label }}
                              @if (b.assistiveText) { <span class="emr-sr-only"> ({{ b.assistiveText }})</span> }
                            </span>
                          }
                        }
                      }
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
        @if (m.status === 'loading') {
          <div role="status" class="emr-dt__state"><strong>{{ l.loading }}</strong></div>
        } @else if (m.status === 'error') {
          <div role="alert" class="emr-dt__state">
            <strong>{{ l.errorTitle }}</strong>
            @if (m.error) { <span class="emr-dt__muted">{{ m.error }}</span> }
            <button type="button" class="emr-button emr-button--outline emr-button--small" (click)="intent.emit({ type: 'retryRequested' })">{{ l.retry }}</button>
          </div>
        } @else if (m.rows.length === 0) {
          <div role="status" class="emr-dt__state">
            <strong>{{ l.emptyTitle }}</strong>
            <span class="emr-dt__muted">{{ l.emptyMessage }}</span>
          </div>
        }
      </div>

      <nav class="emr-dt__nav" [attr.aria-label]="m.caption">
        <span class="emr-dt__muted">{{ m.summaryLabel }}</span>
        <div class="emr-dt__spacer"></div>
        <label class="emr-dt__page-size" [for]="uid + '-ps'">
          <span>{{ l.rowsPerPage }}</span>
          <select
            class="emr-select emr-dt__select"
            [id]="uid + '-ps'"
            [value]="m.pageSize"
            (change)="onPageSizeChange($event)"
          >
            @for (n of m.pageSizeOptions; track n) {
              <option [value]="n" [selected]="n === m.pageSize">{{ n }}</option>
            }
          </select>
        </label>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [disabled]="m.page <= 1"
          (click)="intent.emit({ type: 'pageChanged', page: m.page - 1 })"
        >{{ l.previous }}</button>
        <span aria-live="polite">{{ pageOfText() }}</span>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [disabled]="m.page >= m.pageCount"
          (click)="intent.emit({ type: 'pageChanged', page: m.page + 1 })"
        >{{ l.next }}</button>
      </nav>
    </div>
  `,
  styles: [
    `
      :host { display: block; color: var(--emr-text); min-width: 0; }
      .emr-dt { display: grid; gap: 12px; font-size: var(--emr-text-sm); min-width: 0; }
      .emr-dt__toolbar, .emr-dt__bulk, .emr-dt__density, .emr-dt__nav { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .emr-dt__filters { display: contents; list-style: none; margin: 0; padding: 0; }
      .emr-dt__filter-chip { display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--emr-primary-border); background: var(--emr-primary-soft); border-radius: 999px; padding-left: 12px; min-height: var(--emr-control-height); }
      .emr-dt__chip-remove { min-width: 44px; min-height: var(--emr-control-height); border: 0; background: transparent; color: var(--emr-text); cursor: pointer; border-radius: 999px; font: inherit; }
      .emr-dt__chip-remove:focus-visible, .emr-dt__sort-btn:focus-visible, .emr-dt__row:focus-visible, .emr-dt__checkbox:focus-visible, .emr-dt__menu-item:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
      .emr-dt__menu-wrap { position: relative; }
      .emr-dt__menu { position: absolute; z-index: 3; top: 100%; left: 0; min-width: 220px; margin: 4px 0 0; padding: 4px; list-style: none; background: var(--emr-surface); border: 1px solid var(--emr-border); border-radius: 8px; box-shadow: var(--emr-shadow); }
      .emr-dt__menu-item { display: block; width: 100%; text-align: left; min-height: var(--emr-control-height); padding: 0 12px; border: 0; background: transparent; color: var(--emr-text); font: inherit; cursor: pointer; border-radius: 6px; }
      .emr-dt__menu-item:hover { background: var(--emr-surface-raised); }
      .emr-dt__spacer { flex: 1; }
      .emr-dt__muted { color: var(--emr-text-muted); }
      .emr-dt__scroll { overflow-x: auto; max-width: 100%; border: 1px solid var(--emr-border); border-radius: 8px; background: var(--emr-surface); }
      .emr-dt__table { width: 100%; border-collapse: separate; border-spacing: 0; }
      .emr-dt__th { position: sticky; top: 0; z-index: 1; background: var(--emr-surface-raised); border-bottom: 2px solid var(--emr-border); padding: 8px 12px; font-weight: var(--emr-weight-bold); text-align: left; white-space: nowrap; }
      .emr-dt--compact .emr-dt__th, .emr-dt--compact .emr-dt__td { padding: 4px 10px; }
      .emr-dt__th--check, .emr-dt__td--check { width: 48px; }
      .emr-dt__td { padding: 8px 12px; min-height: var(--emr-control-height); border-bottom: 1px solid var(--emr-border); text-align: left; }
      .emr-dt__cell--end { text-align: right; }
      .emr-dt__cell--center { text-align: center; }
      .emr-dt__sort-btn { font: inherit; font-weight: var(--emr-weight-bold); color: var(--emr-text); min-height: 36px; padding: 0 4px; border: 0; background: transparent; cursor: pointer; }
      .emr-dt__row { cursor: pointer; }
      .emr-dt__row--selected { background: var(--emr-primary-soft); }
      .emr-dt__checkbox { width: 20px; height: 20px; margin: 0; cursor: pointer; accent-color: var(--emr-primary); }
      .emr-dt__badge { margin-left: 8px; }
      .emr-dt__state { padding: 24px; text-align: center; display: grid; gap: 8px; justify-items: center; }
      .emr-dt__page-size { display: inline-flex; gap: 8px; align-items: center; }
      .emr-dt__select { width: auto; min-width: 72px; }
      .emr-dt button[aria-pressed="true"] { background: var(--emr-primary-soft); border-color: var(--emr-primary-border); font-weight: var(--emr-weight-bold); }
    `
  ]
})
export class EmrDataTableComponent {
  readonly model = input.required<EmrDataTableModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>();
  readonly labels = input<Partial<EmrDataTableLabels>>({});
  readonly intent = output<EmrDataTableIntent>();

  @ViewChildren('rowEl') private readonly rowElements?: QueryList<ElementRef<HTMLTableRowElement>>;

  private readonly autoUid = `emr-dt-${++nextTableId}`;
  protected get uid(): string {
    return this.idPrefix() || this.autoUid;
  }

  protected readonly menuOpen = signal(false);
  protected readonly activeIndex = signal(0);
  protected readonly text = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));

  protected readonly allState = computed<'none' | 'some' | 'all'>(() => {
    const m = this.model();
    const pageIds = m.rows.map(r => r.id);
    if (pageIds.length === 0) return 'none';
    const set = new Set(m.selectedIds);
    const count = pageIds.filter(id => set.has(id)).length;
    return count === 0 ? 'none' : count === pageIds.length ? 'all' : 'some';
  });

  protected readonly selectedText = computed(() =>
    this.text().selectedCount.replace('{count}', String(this.model().selectedIds.length))
  );

  protected readonly pageOfText = computed(() => {
    const m = this.model();
    return this.text().pageOf.replace('{page}', String(m.page)).replace('{pageCount}', String(m.pageCount));
  });

  protected isSelected(id: string): boolean {
    return this.model().selectedIds.includes(id);
  }

  protected isTextCell(cell: EmrDataTableCell): cell is string {
    return typeof cell === 'string';
  }

  protected onToggleAll(): void {
    const m = this.model();
    const pageIds = m.rows.map(r => r.id);
    const pageSet = new Set(pageIds);
    const rest = m.selectedIds.filter(id => !pageSet.has(id));
    const next = this.allState() === 'all' ? rest : [...rest, ...pageIds];
    this.intent.emit({ type: 'selectionChanged', selectedIds: next });
  }

  protected onToggleRow(id: string): void {
    const selected = this.model().selectedIds;
    const next = selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id];
    this.intent.emit({ type: 'selectionChanged', selectedIds: next });
  }

  protected onSort(columnId: string): void {
    const current = this.model().sort;
    const direction: EmrDataTableSortDirection =
      current?.columnId === columnId && current.direction === 'asc' ? 'desc' : 'asc';
    this.intent.emit({ type: 'sortChanged', columnId, direction });
  }

  protected onRowClick(event: MouseEvent, id: string): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('input,button')) return;
    this.intent.emit({ type: 'rowActivated', id });
  }

  protected onRowKey(event: KeyboardEvent, index: number, id: string): void {
    if (event.target !== event.currentTarget) return;
    if (event.key === ' ') {
      event.preventDefault();
      this.onToggleRow(id);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.intent.emit({ type: 'rowActivated', id });
      return;
    }
    const count = this.model().rows.length;
    if (count <= 0) return;
    let next = index;
    if (event.key === 'ArrowDown') next = Math.min(index + 1, count - 1);
    else if (event.key === 'ArrowUp') next = Math.max(index - 1, 0);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else return;
    event.preventDefault();
    this.activeIndex.set(next);
    this.rowElements?.get(next)?.nativeElement.focus();
  }

  protected onPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.intent.emit({ type: 'pageSizeChanged', pageSize: value });
  }
}
