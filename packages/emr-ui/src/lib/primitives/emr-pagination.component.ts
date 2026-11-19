import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';

let nextPaginationId = 0;

@Component({
  selector: 'emr-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <nav class="emr-pagination" [attr.id]="resolvedId()" [attr.aria-label]="ariaLabel()">
      <span class="emr-pagination__summary" role="status" aria-live="polite">
        {{ rangeSummary() }}
      </span>

      <div class="emr-pagination__controls">
        @if (pageSizeOptions().length > 0) {
          <label class="emr-pagination__size" [for]="resolvedId() + '-size'">
            <span class="emr-sr-only">Items per page</span>
            <select
              #sizeSelect
              class="emr-select"
              [id]="resolvedId() + '-size'"
              [value]="String(safePageSize())"
              [disabled]="disabled()"
              aria-label="Items per page"
              (change)="onPageSizeChange($event)"
              (blur)="syncSelectDom()"
            >
              @for (opt of pageSizeOptions(); track opt) {
                <option [value]="opt" [selected]="opt === safePageSize()">{{ opt }} / page</option>
              }
            </select>
          </label>
        }

        <button
          type="button"
          class="emr-pagination__page-btn"
          [disabled]="disabled() || safePage() <= 1"
          aria-label="Previous page"
          (click)="goToPage(safePage() - 1)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        @for (item of pageButtons(); track item) {
          @if (item === 'ellipsis-start' || item === 'ellipsis-end') {
            <span class="emr-pagination__ellipsis" aria-hidden="true">…</span>
          } @else {
            <button
              type="button"
              class="emr-pagination__page-btn"
              [disabled]="disabled()"
              [attr.aria-current]="item === safePage() ? 'page' : null"
              [attr.aria-label]="'Page ' + item"
              (click)="goToPage(item)"
            >
              {{ item }}
            </button>
          }
        }

        <button
          type="button"
          class="emr-pagination__page-btn"
          [disabled]="disabled() || safePage() >= totalPages()"
          aria-label="Next page"
          (click)="goToPage(safePage() + 1)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </nav>
  `,
})
export class EmrPaginationComponent implements AfterViewChecked {
  protected readonly String = String;

  readonly controlId = input<string>();
  readonly page = input(1);
  readonly pageSize = input(20);
  readonly totalItems = input(0);
  readonly pageSizeOptions = input<readonly number[]>([]);
  readonly ariaLabel = input('Pagination');
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  private readonly fallbackId = `emr-pagination-${++nextPaginationId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly safePageSize = computed(() => Math.max(1, Math.trunc(this.pageSize() || 20)));
  protected readonly safeTotal = computed(() => Math.max(0, Math.trunc(this.totalItems() || 0)));
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.safeTotal() / this.safePageSize())),
  );
  protected readonly safePage = computed(() =>
    Math.min(this.totalPages(), Math.max(1, Math.trunc(this.page() || 1))),
  );

  protected readonly rangeSummary = computed(() => {
    const total = this.safeTotal();
    if (total === 0) return '0 of 0';
    const start = (this.safePage() - 1) * this.safePageSize() + 1;
    const end = Math.min(total, start + this.safePageSize() - 1);
    return `${start}–${end} of ${total}`;
  });

  protected readonly pageButtons = computed<readonly (number | 'ellipsis-start' | 'ellipsis-end')[]>(() => {
    const total = this.totalPages();
    const current = this.safePage();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const items: (number | 'ellipsis-start' | 'ellipsis-end')[] = [1];
    const windowStart = Math.max(2, current - 1);
    const windowEnd = Math.min(total - 1, current + 1);
    if (windowStart > 2) items.push('ellipsis-start');
    for (let p = windowStart; p <= windowEnd; p += 1) items.push(p);
    if (windowEnd < total - 1) items.push('ellipsis-end');
    items.push(total);
    return items;
  });

  private readonly sizeSelectRef = viewChild<ElementRef<HTMLSelectElement>>('sizeSelect');
  private needsSelectSync = false;

  ngAfterViewChecked(): void {
    if (this.needsSelectSync) {
      this.needsSelectSync = false;
      this.syncSelectDom();
    }
  }

  protected goToPage(target: number): void {
    if (this.disabled()) return;
    if (target < 1 || target > this.totalPages() || target === this.safePage()) return;
    this.pageChange.emit(target);
  }

  protected onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (this.disabled()) {
      this.syncSelectDom();
      return;
    }
    const nextSize = Number(target.value);
    if (!Number.isFinite(nextSize) || nextSize <= 0) {
      this.syncSelectDom();
      return;
    }
    this.needsSelectSync = true;
    queueMicrotask(() => {
      if (this.needsSelectSync) {
        this.needsSelectSync = false;
        this.syncSelectDom();
      }
    });
    this.pageSizeChange.emit(nextSize);
  }

  protected syncSelectDom(): void {
    const el = this.sizeSelectRef()?.nativeElement;
    if (!el) return;
    const expected = String(this.safePageSize());
    if (el.value !== expected) el.value = expected;
  }
}
