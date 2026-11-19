import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroChevronDown,
  heroChevronUp,
  heroChevronUpDown,
  heroXMark,
} from '@ng-icons/heroicons/outline';
import type {
  EmrDataTableCell,
  EmrDataTableIntent,
  EmrDataTableLabels,
  EmrDataTableModel,
} from '@drguptavivek/emr-controller';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';
import {
  canChangeDataTablePage,
  canChangeDataTablePageSize,
  canMutateDataTableFilters,
  canMutateDataTableSavedFilter,
  canSelectDataTableRows,
  canSortDataTableColumn,
  canTriggerDataTableBulkAction,
  nextDataTableMenuIndex,
  nextDataTableRowIndex,
  nextDataTableSortDirection,
  resolveDataTableColumnWidth,
  resolveDataTableHeadingId,
  resolveDataTableId,
  resolveDataTableLabels,
  selectAllDataTableState,
  toggleAllDataTableSelection,
  toggleDataTableRowSelection,
} from './emr-data-table.logic';

export type { EmrDataTableLabels };

let nextTableId = 0;

/**
 * L3 controlled data table: renders controller-supplied rows, active filter chips, saved-filter menu,
 * bulk actions, density switcher, sortable headers, multi-row selection, roving-tabindex keyboard
 * navigation, loading skeleton, and pagination. Never sorts, filters, slices, or fetches rows itself.
 */
@Component({
  selector: 'emr-data-table',
  standalone: true,
  imports: [EmrBadgeComponent, NgIcon],
  providers: [...provideIcons({ heroXMark, heroChevronUp, heroChevronDown, heroChevronUpDown })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusin)': 'onHostFocusIn()',
    '(focusout)': 'onHostFocusOut($event)',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
  template: `
    @let m = model();
    @let l = text();
    @let compact = m.density === 'compact';
    @let canSelect = canSelectRows();
    @let canMutateFilters = canEditFilters();
    @let canMutateSaved = canSaveFilters();
    @let isLoading = m.status === 'loading';
    @let isError = m.status === 'error';
    <div class="emr-dt" [id]="resolvedTableId()" [class.emr-dt--compact]="compact">
      <div class="emr-dt__toolbar" data-emr-print="hide">
        <ul class="emr-dt__filters" [attr.aria-label]="l.filters">
          @for (f of m.filters; track f.id) {
            <li class="emr-dt__filter-chip">
              <span><strong>{{ f.label }}:</strong> {{ f.valueLabel }}</span>
              <button
                type="button"
                class="emr-dt__chip-remove"
                [attr.aria-label]="l.removeFilter + ': ' + f.label + ' ' + f.valueLabel"
                [attr.aria-disabled]="!canMutateFilters ? 'true' : null"
                (click)="onRemoveFilter(f.id)"
              >
                <ng-icon name="heroXMark" size="14" aria-hidden="true" />
              </button>
            </li>
          }
        </ul>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [attr.aria-disabled]="!canMutateFilters ? 'true' : null"
          (click)="onAddFilter()"
        >{{ l.addFilter }}</button>
        <div #menuWrapEl class="emr-dt__menu-wrap" (keydown.escape)="closeMenu(true)">
          <button
            #menuTriggerEl
            type="button"
            class="emr-button emr-button--outline emr-button--small"
            aria-haspopup="menu"
            [attr.aria-expanded]="menuOpen()"
            [attr.aria-controls]="resolvedTableId() + '-saved-menu'"
            (click)="toggleMenu()"
            (keydown)="onMenuTriggerKeydown($event)"
          >{{ l.savedFilters }}</button>
          @if (menuOpen()) {
            <ul
              role="menu"
              [id]="resolvedTableId() + '-saved-menu'"
              class="emr-dt__menu"
              [attr.aria-label]="l.savedFilters"
              (keydown)="onMenuKeydown($event)"
            >
              @for (s of m.savedFilters; track s.id; let idx = $index) {
                <li role="none">
                  <button
                    #menuItemEl
                    type="button"
                    role="menuitem"
                    class="emr-dt__menu-item"
                    (click)="onSavedFilterSelect(s.id)"
                    (keydown)="onMenuItemKeydown($event, idx)"
                  >{{ s.label }}</button>
                </li>
              }
              <li role="none">
                <button
                  #menuItemEl
                  type="button"
                  role="menuitem"
                  class="emr-dt__menu-item"
                  [attr.aria-disabled]="!canMutateSaved ? 'true' : null"
                  (click)="onSaveFilterRequest()"
                  (keydown)="onMenuItemKeydown($event, m.savedFilters.length)"
                >{{ l.saveFilter }}</button>
              </li>
            </ul>
          }
        </div>
      </div>

      <div class="emr-dt__toolbar" data-emr-print="hide">
        <div role="group" class="emr-dt__bulk" [attr.aria-label]="l.bulkActions">
          @for (a of m.bulkActions; track a.id) {
            <button
              type="button"
              class="emr-button emr-button--outline emr-button--small"
              [attr.aria-disabled]="!canBulkAction() ? 'true' : null"
              (click)="onBulkAction(a.id)"
            >{{ a.label }}</button>
          }
          @if (m.selectedIds.length) {
            <span role="status" class="emr-dt__muted">{{ selectedText() }}</span>
          }
        </div>
        <div class="emr-dt__spacer"></div>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          (click)="intent.emit({ type: 'exportRequested', format: 'csv' })"
        >{{ l.exportCsv }}</button>
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

      <div class="emr-dt__scroll" [attr.aria-busy]="isLoading ? 'true' : 'false'">
        <table class="emr-dt__table" [attr.aria-labelledby]="resolvedHeadingId()">
          <caption class="emr-sr-only" [id]="resolvedHeadingId()">{{ m.caption }}</caption>
          <thead>
            <tr>
              <th scope="col" class="emr-dt__th emr-dt__th--check">
                <label class="emr-dt__check-hit" [attr.data-disabled]="!canSelect ? 'true' : null">
                  <input
                    type="checkbox"
                    class="emr-dt__checkbox"
                    [attr.aria-label]="l.selectAll"
                    [attr.aria-disabled]="!canSelect ? 'true' : null"
                    [checked]="allState() === 'all'"
                    [indeterminate]="allState() === 'some'"
                    [attr.aria-checked]="allState() === 'some' ? 'mixed' : allState() === 'all' ? 'true' : 'false'"
                    (click)="onCheckboxClick($event)"
                    (change)="onToggleAll($event)"
                  />
                </label>
              </th>
              @for (c of m.columns; track c.id) {
                @let dir = m.sort?.columnId === c.id ? m.sort.direction : undefined;
                <th
                  scope="col"
                  class="emr-dt__th"
                  [style.width]="colWidth(c.width)"
                  [class.emr-dt__cell--end]="c.align === 'end'"
                  [class.emr-dt__cell--center]="c.align === 'center'"
                  [attr.aria-sort]="c.sortable ? (dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none') : null"
                >
                  @if (c.sortable) {
                    <button
                      type="button"
                      class="emr-dt__sort-btn"
                      [attr.aria-disabled]="isLoading || isError ? 'true' : null"
                      (click)="onSort(c.id)"
                    >
                      <span class="emr-sr-only">{{ l.sortBy }} </span>
                      <span>{{ c.label }}</span>
                      <ng-icon
                        [name]="dir === 'asc' ? 'heroChevronUp' : dir === 'desc' ? 'heroChevronDown' : 'heroChevronUpDown'"
                        size="15"
                        aria-hidden="true"
                      />
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
            @if (isLoading) {
              @for (sk of skeletonRows; track sk) {
                <tr class="emr-dt__row emr-dt__row--skeleton" aria-hidden="true">
                  <td class="emr-dt__td emr-dt__td--check">
                    <span class="emr-dt__skeleton emr-dt__skeleton--check"></span>
                  </td>
                  @for (c of m.columns; track c.id) {
                    <td class="emr-dt__td">
                      <span class="emr-dt__skeleton"></span>
                    </td>
                  }
                </tr>
              }
            } @else if (!isError) {
              @for (r of m.rows; track r.id; let i = $index) {
                @let selected = isSelected(r.id);
                <tr
                  #rowEl
                  class="emr-dt__row"
                  [class.emr-dt__row--selected]="selected"
                  [attr.tabindex]="i === activeRowIndex() ? 0 : -1"
                  (focus)="activeIndex.set(i)"
                  (keydown)="onRowKey($event, i, r.id)"
                  (click)="onRowClick($event, r.id)"
                >
                  <td class="emr-dt__td emr-dt__td--check">
                    <label class="emr-dt__check-hit" [attr.data-disabled]="!canSelect ? 'true' : null">
                      <input
                        type="checkbox"
                        class="emr-dt__checkbox"
                        [attr.aria-label]="l.selectRow + ' ' + (i + 1)"
                        [attr.aria-disabled]="!canSelect ? 'true' : null"
                        [checked]="selected"
                        (click)="onCheckboxClick($event)"
                        (change)="onToggleRow($event, r.id)"
                      />
                    </label>
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
                          <span class="emr-dt__cell-wrap">
                            @if (cell.text) { <span>{{ cell.text }}</span> }
                            @if (cell.badge; as b) {
                              <emr-badge [badge]="b" class="emr-dt__badge" />
                            }
                          </span>
                        }
                      }
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
        @if (isLoading) {
          <div role="status" class="emr-sr-only">{{ l.loading }}</div>
        } @else if (isError) {
          <div role="alert" class="emr-dt__state">
            <strong>{{ l.errorTitle }}</strong>
            @if (m.error) { <span class="emr-dt__muted">{{ m.error }}</span> }
            <button
              type="button"
              class="emr-button emr-button--outline emr-button--small"
              (click)="intent.emit({ type: 'retryRequested' })"
            >{{ l.retry }}</button>
          </div>
        } @else if (m.rows.length === 0) {
          <div role="status" class="emr-dt__state">
            <strong>{{ l.emptyTitle }}</strong>
            <span class="emr-dt__muted">{{ l.emptyMessage }}</span>
          </div>
        }
      </div>

      <nav class="emr-dt__nav" data-emr-print="hide" [attr.aria-label]="m.caption">
        <span class="emr-dt__muted" role="status">{{ m.summaryLabel }}</span>
        <div class="emr-dt__spacer"></div>
        @if (m.pageSizeOptions.length) {
          <label class="emr-dt__page-size" [for]="resolvedTableId() + '-ps'">
            <span>{{ l.rowsPerPage }}</span>
            <select
              class="emr-select emr-dt__select"
              [id]="resolvedTableId() + '-ps'"
              [value]="m.pageSize"
              [attr.aria-disabled]="isLoading || isError ? 'true' : null"
              (change)="onPageSizeChange($event)"
            >
              @for (n of m.pageSizeOptions; track n) {
                <option [value]="n" [selected]="n === m.pageSize">{{ n }}</option>
              }
            </select>
          </label>
        }
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [attr.aria-disabled]="!canPrevPage() ? 'true' : null"
          (click)="onPageStep(-1)"
        >{{ l.previous }}</button>
        <span class="emr-dt__page-status" role="status" aria-live="polite">{{ pageOfText() }}</span>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [attr.aria-disabled]="!canNextPage() ? 'true' : null"
          (click)="onPageStep(1)"
        >{{ l.next }}</button>
      </nav>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        color: var(--emr-text);
        min-width: 0;
        max-width: 100%;
        container-type: inline-size;
        font-variant-numeric: tabular-nums;
      }
      .emr-dt {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
        font-size: var(--emr-text-md);
        min-width: 0;
        max-width: 100%;
      }
      .emr-dt__toolbar,
      .emr-dt__bulk,
      .emr-dt__density,
      .emr-dt__nav {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        min-width: 0;
      }
      .emr-dt__filters {
        display: contents;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .emr-dt__filter-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: 1px solid var(--emr-primary-border);
        background: var(--emr-primary-soft);
        border-radius: 999px;
        padding-left: 12px;
        min-height: var(--emr-control-height);
        font-size: var(--emr-text-sm);
      }
      .emr-dt__chip-remove {
        min-width: 44px;
        min-height: var(--emr-control-height);
        display: inline-grid;
        place-items: center;
        border: 0;
        background: transparent;
        color: var(--emr-text);
        cursor: pointer;
        border-radius: 999px;
        font: inherit;
      }
      .emr-dt__chip-remove[aria-disabled='true'],
      .emr-dt__sort-btn[aria-disabled='true'],
      .emr-dt__menu-item[aria-disabled='true'],
      .emr-dt button[aria-disabled='true'] {
        opacity: 0.52;
        cursor: not-allowed;
      }
      .emr-dt__chip-remove:focus-visible,
      .emr-dt__sort-btn:focus-visible,
      .emr-dt__row:focus-visible,
      .emr-dt__checkbox:focus-visible,
      .emr-dt__menu-item:focus-visible {
        outline: 3px solid var(--emr-focus);
        outline-offset: 2px;
      }
      .emr-dt__menu-wrap {
        position: relative;
      }
      .emr-dt__menu {
        position: absolute;
        z-index: 5;
        top: 100%;
        left: 0;
        min-width: 220px;
        margin: 4px 0 0;
        padding: 4px;
        list-style: none;
        background: var(--emr-surface);
        border: 1px solid var(--emr-border);
        border-radius: 8px;
        box-shadow: var(--emr-shadow);
      }
      .emr-dt__menu-item {
        display: flex;
        align-items: center;
        width: 100%;
        text-align: left;
        min-height: var(--emr-control-height);
        padding: 0 12px;
        border: 0;
        background: transparent;
        color: var(--emr-text);
        font: inherit;
        font-size: var(--emr-text-sm);
        cursor: pointer;
        border-radius: 6px;
      }
      .emr-dt__menu-item:hover:not([aria-disabled='true']) {
        background: var(--emr-surface-raised);
      }
      .emr-dt__spacer {
        flex: 1;
      }
      .emr-dt__muted {
        color: var(--emr-text-muted);
        font-size: var(--emr-text-sm);
      }
      .emr-dt__scroll {
        overflow-x: auto;
        max-width: 100%;
        min-width: 0;
        border: 1px solid var(--emr-border);
        border-radius: 8px;
        background: var(--emr-surface);
      }
      .emr-dt__table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }
      .emr-dt__th {
        position: sticky;
        top: 0;
        z-index: 1;
        background: var(--emr-surface-raised);
        border-bottom: 2px solid var(--emr-border);
        padding: 4px 12px;
        font-size: var(--emr-text-sm);
        font-weight: var(--emr-weight-bold);
        text-align: left;
        white-space: nowrap;
      }
      .emr-dt__th--check,
      .emr-dt__td--check {
        width: 52px;
        padding-inline: 4px;
      }
      .emr-dt__td {
        padding: 8px 12px;
        min-height: var(--emr-control-height);
        border-bottom: 1px solid var(--emr-border);
        font-size: var(--emr-text-md);
        text-align: left;
        vertical-align: middle;
      }
      .emr-dt--compact .emr-dt__th {
        padding: 2px 10px;
      }
      .emr-dt--compact .emr-dt__td {
        padding: 4px 10px;
        font-size: var(--emr-text-sm);
      }
      .emr-dt__cell--end {
        text-align: right;
      }
      .emr-dt__cell--center {
        text-align: center;
      }
      .emr-dt__cell-wrap {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .emr-dt__sort-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font: inherit;
        font-weight: var(--emr-weight-bold);
        color: var(--emr-text);
        min-height: var(--emr-control-height);
        min-width: 44px;
        padding: 0 6px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        cursor: pointer;
      }
      .emr-dt__sort-btn:hover:not([aria-disabled='true']) {
        background: var(--emr-surface-soft);
      }
      .emr-dt__row {
        cursor: pointer;
      }
      .emr-dt__row:hover:not(.emr-dt__row--skeleton) {
        background: var(--emr-surface-soft);
      }
      .emr-dt__row--selected {
        background: var(--emr-primary-soft);
      }
      .emr-dt__row--skeleton {
        cursor: default;
      }
      .emr-dt__check-hit {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 44px;
        min-height: var(--emr-control-height);
        cursor: pointer;
      }
      .emr-dt__check-hit[data-disabled='true'] {
        cursor: not-allowed;
        opacity: 0.55;
      }
      .emr-dt__checkbox {
        width: 20px;
        height: 20px;
        margin: 0;
        cursor: inherit;
        accent-color: var(--emr-primary);
      }
      .emr-dt__skeleton {
        display: block;
        height: 14px;
        width: 72%;
        border-radius: 4px;
        background: var(--emr-neutral-soft);
      }
      .emr-dt__skeleton--check {
        width: 20px;
        height: 20px;
        margin-inline: auto;
      }
      .emr-dt__state {
        padding: 24px;
        text-align: center;
        display: grid;
        gap: 8px;
        justify-items: center;
      }
      .emr-dt__page-size {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        font-size: var(--emr-text-sm);
      }
      .emr-dt__select {
        width: auto;
        min-width: 72px;
        min-height: var(--emr-control-height);
      }
      .emr-dt__page-status {
        font-size: var(--emr-text-sm);
      }
      .emr-dt button[aria-pressed='true'] {
        background: var(--emr-primary-soft);
        border-color: var(--emr-primary-border);
        font-weight: var(--emr-weight-bold);
      }
      @container (max-width: 560px) {
        .emr-dt__spacer {
          display: none;
        }
        .emr-dt__toolbar,
        .emr-dt__nav {
          gap: 6px;
        }
        .emr-dt__bulk,
        .emr-dt__density {
          flex-wrap: wrap;
        }
      }
      @container (max-width: 400px) {
        .emr-dt__toolbar {
          position: relative;
        }
        .emr-dt__menu-wrap {
          position: static;
        }
        .emr-dt__menu {
          left: 0;
          right: auto;
          top: calc(100% + 4px);
          min-width: 0;
          width: min(220px, 100%);
          max-width: 100%;
          margin-top: 0;
        }
      }
      :host-context(.emr-print) [data-emr-print='hide'],
      :host-context(.emr-print) .emr-dt__th--check,
      :host-context(.emr-print) .emr-dt__td--check {
        display: none !important;
      }
      :host-context(.emr-print) .emr-dt__scroll {
        overflow: visible !important;
        max-height: none !important;
      }
      :host-context(.emr-print) .emr-dt__row {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      :host-context(.emr-print) thead {
        display: table-header-group;
      }
      @media print {
        [data-emr-print='hide'],
        .emr-dt__th--check,
        .emr-dt__td--check {
          display: none !important;
        }
        .emr-dt__scroll {
          overflow: visible !important;
          max-height: none !important;
        }
        .emr-dt__row {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        thead {
          display: table-header-group;
        }
      }
    `,
  ],
})
export class EmrDataTableComponent {
  readonly model = input.required<EmrDataTableModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>();
  readonly labels = input<Partial<EmrDataTableLabels>>({});
  readonly intent = output<EmrDataTableIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly menuWrapRef = viewChild<ElementRef<HTMLElement>>('menuWrapEl');
  private readonly menuTriggerRef = viewChild<ElementRef<HTMLButtonElement>>('menuTriggerEl');
  private readonly menuItemRefs = viewChildren<ElementRef<HTMLButtonElement>>('menuItemEl');
  private readonly rowRefs = viewChildren<ElementRef<HTMLTableRowElement>>('rowEl');

  private readonly autoUid = `emr-dt-${++nextTableId}`;
  private isFocusedWithin = false;

  protected readonly skeletonRows = [0, 1, 2, 3, 4] as const;
  protected readonly menuOpen = signal(false);
  protected readonly activeIndex = signal(0);

  protected readonly resolvedTableId = computed(() =>
    resolveDataTableId(this.idPrefix() ?? '', this.autoUid),
  );
  protected readonly resolvedHeadingId = computed(() =>
    resolveDataTableHeadingId(this.idPrefix() ?? '', this.headingId(), this.autoUid),
  );
  protected readonly text = computed(() => resolveDataTableLabels(this.labels()));

  protected readonly canSelectRows = computed(() => canSelectDataTableRows(this.model()));
  protected readonly canEditFilters = computed(() => canMutateDataTableFilters(this.model()));
  protected readonly canSaveFilters = computed(() => canMutateDataTableSavedFilter(this.model()));
  protected readonly canBulkAction = computed(() => canTriggerDataTableBulkAction(this.model()));
  protected readonly canPrevPage = computed(() =>
    canChangeDataTablePage(this.model(), this.model().page - 1),
  );
  protected readonly canNextPage = computed(() =>
    canChangeDataTablePage(this.model(), this.model().page + 1),
  );

  protected readonly activeRowIndex = computed(() => {
    const count = this.model().rows.length;
    if (count <= 0) return 0;
    return Math.min(Math.max(this.activeIndex(), 0), count - 1);
  });

  protected readonly allState = computed(() => {
    const m = this.model();
    return selectAllDataTableState(
      m.rows.map((r) => r.id),
      m.selectedIds,
    );
  });

  protected readonly selectedText = computed(() =>
    this.text().selectedCount.replace('{count}', String(this.model().selectedIds.length)),
  );

  protected readonly pageOfText = computed(() => {
    const m = this.model();
    return this.text()
      .pageOf.replace('{page}', String(m.page))
      .replace('{pageCount}', String(m.pageCount));
  });

  protected colWidth(width?: number | string): string | null {
    return resolveDataTableColumnWidth(width);
  }

  protected isSelected(id: string): boolean {
    return this.model().selectedIds.includes(id);
  }

  protected isTextCell(cell: EmrDataTableCell): cell is string {
    return typeof cell === 'string';
  }

  protected onHostFocusIn(): void {
    if (!this.isFocusedWithin) {
      this.isFocusedWithin = true;
      this.focused.emit();
    }
  }

  protected onHostFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.hostRef.nativeElement.contains(next)) return;
    if (this.isFocusedWithin) {
      this.isFocusedWithin = false;
      this.menuOpen.set(false);
      this.blurred.emit();
    }
  }

  protected onDocumentPointerDown(event: Event): void {
    if (!this.menuOpen()) return;
    const target = event.target as Node | null;
    const wrap = this.menuWrapRef()?.nativeElement ?? this.hostRef.nativeElement;
    if (target && !wrap.contains(target)) {
      this.menuOpen.set(false);
    }
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(restoreFocus = false): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    if (restoreFocus) {
      this.menuTriggerRef()?.nativeElement.focus();
    }
  }

  protected onMenuTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const wasOpen = this.menuOpen();
      this.menuOpen.set(true);
      const count = this.model().savedFilters.length + 1;
      const targetIdx = event.key === 'ArrowUp' ? Math.max(0, count - 1) : 0;
      const focusItem = () => this.menuItemRefs()[targetIdx]?.nativeElement.focus();
      if (wasOpen) focusItem();
      else queueMicrotask(focusItem);
    } else if (event.key === 'Escape' && this.menuOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.closeMenu(true);
    }
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeMenu(true);
    } else if (event.key === 'Tab') {
      this.menuOpen.set(false);
    }
  }

  protected onMenuItemKeydown(event: KeyboardEvent, index: number): void {
    const count = this.model().savedFilters.length + 1;
    const nextIdx = nextDataTableMenuIndex(index, count, event.key);
    if (nextIdx === null) return;
    event.preventDefault();
    this.menuItemRefs()[nextIdx]?.nativeElement.focus();
  }

  protected onSavedFilterSelect(id: string): void {
    this.menuOpen.set(false);
    this.intent.emit({ type: 'savedFilterSelected', id });
  }

  protected onSaveFilterRequest(): void {
    if (!this.canSaveFilters()) return;
    this.menuOpen.set(false);
    this.intent.emit({ type: 'saveFilterRequested' });
  }

  protected onRemoveFilter(id: string): void {
    if (!this.canEditFilters()) return;
    this.intent.emit({ type: 'filterRemoved', id });
  }

  protected onAddFilter(): void {
    if (!this.canEditFilters()) return;
    this.intent.emit({ type: 'filterAddRequested' });
  }

  protected onBulkAction(id: string): void {
    if (!this.canBulkAction()) return;
    this.intent.emit({ type: 'bulkActionRequested', id });
  }

  protected onCheckboxClick(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.canSelectRows()) {
      event.preventDefault();
    }
  }

  protected onToggleAll(event: Event): void {
    const m = this.model();
    const target = event.target as HTMLInputElement;
    if (!canSelectDataTableRows(m)) {
      target.checked = this.allState() === 'all';
      return;
    }
    const pageIds = m.rows.map((r) => r.id);
    const next = toggleAllDataTableSelection(pageIds, m.selectedIds);
    this.intent.emit({ type: 'selectionChanged', selectedIds: next });
  }

  protected onToggleRow(event: Event, id: string): void {
    const m = this.model();
    const target = event.target as HTMLInputElement;
    if (!canSelectDataTableRows(m)) {
      target.checked = this.isSelected(id);
      return;
    }
    const next = toggleDataTableRowSelection(m.selectedIds, id);
    this.intent.emit({ type: 'selectionChanged', selectedIds: next });
  }

  protected onSort(columnId: string): void {
    const m = this.model();
    if (!canSortDataTableColumn(m, columnId)) return;
    const direction = nextDataTableSortDirection(m.sort, columnId);
    this.intent.emit({ type: 'sortChanged', columnId, direction });
  }

  protected onRowClick(event: MouseEvent, id: string): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('input,button,label')) return;
    this.intent.emit({ type: 'rowActivated', id });
  }

  protected onRowKey(event: KeyboardEvent, index: number, id: string): void {
    if (event.target !== event.currentTarget) return;
    if (event.key === ' ') {
      event.preventDefault();
      if (!this.canSelectRows()) return;
      const next = toggleDataTableRowSelection(this.model().selectedIds, id);
      this.intent.emit({ type: 'selectionChanged', selectedIds: next });
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.intent.emit({ type: 'rowActivated', id });
      return;
    }
    const next = nextDataTableRowIndex(index, this.model().rows.length, event.key);
    if (next === null) return;
    event.preventDefault();
    this.activeIndex.set(next);
    this.rowRefs()[next]?.nativeElement.focus();
  }

  protected onPageStep(delta: -1 | 1): void {
    const m = this.model();
    const target = m.page + delta;
    if (!canChangeDataTablePage(m, target)) return;
    this.intent.emit({ type: 'pageChanged', page: target });
  }

  protected onPageSizeChange(event: Event): void {
    const m = this.model();
    const select = event.target as HTMLSelectElement;
    const value = Number(select.value);
    if (!canChangeDataTablePageSize(m, value)) {
      select.value = String(m.pageSize);
      return;
    }
    this.intent.emit({ type: 'pageSizeChanged', pageSize: value });
  }
}
