import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import type {
  EmrTabOption,
  EmrTabsActivationMode,
  EmrTabsIconPosition,
  EmrTabsOrientation,
  EmrTabsSize,
  EmrTabsVariant,
} from '@drguptavivek/emr-controller';
import {
  canActivateTab,
  getNextTabIndex,
  resolveActiveTabValue,
  resolveTabStopIndex,
} from './emr-tabs.logic';

let nextTabsId = 0;

@Component({
  selector: 'emr-tabs',
  standalone: true,
  template: `
    <div class="emr-tabs-scroll" [class.emr-tabs-scroll--vertical]="orientation() === 'vertical'">
      @if (orientation() === 'horizontal' && canScrollLeft()) {
        <button
          type="button"
          class="emr-tabs-nav-btn"
          data-emr-print="hide"
          aria-label="Scroll tabs left"
          (click)="scrollTabs(-1)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      }
      <div
        #tablistEl
        class="emr-tabs"
        [class.emr-tabs--pill]="variant() === 'pill'"
        [class.emr-tabs--soft]="variant() === 'soft'"
        [class.emr-tabs--sm]="size() === 'sm'"
        [class.emr-tabs--lg]="size() === 'lg'"
        [class.emr-tabs--vertical]="orientation() === 'vertical'"
        [class.emr-tabs--fitted]="fitted() && orientation() === 'horizontal'"
        [class.emr-tabs--readonly]="readOnly()"
        role="tablist"
        [attr.id]="resolvedId()"
        [attr.aria-orientation]="orientation()"
        [attr.aria-label]="ariaLabelledBy() ? null : ariaLabel()"
        [attr.aria-labelledby]="ariaLabelledBy() || null"
        [attr.aria-readonly]="readOnly() ? 'true' : null"
        [attr.aria-disabled]="disabled() ? 'true' : null"
        (scroll)="updateScrollOverflow()"
        (focusin)="onFocusIn()"
        (focusout)="onFocusOut($event)"
      >
        @for (tab of tabs(); track tab.value; let idx = $index) {
          <button
            #tabButton
            class="emr-tab"
            type="button"
            role="tab"
            [id]="resolvedId() + '-tab-' + idx"
            [disabled]="disabled() || !!tab.disabled"
            [attr.aria-selected]="resolvedActive() === tab.value"
            [attr.aria-controls]="tab.panelId || null"
            [attr.aria-disabled]="disabled() || tab.disabled || (readOnly() && resolvedActive() !== tab.value) ? 'true' : null"
            [attr.tabindex]="idx === tabStopIndex() ? 0 : -1"
            (click)="onTabClick(tab)"
            (keydown)="onKeydown($event, idx)"
          >
            @if (iconPosition() === 'end') {
              <span>{{ tab.label }}</span>
            }
            @if (tab.icon) {
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.5" />
              </svg>
            }
            @if (iconPosition() !== 'end') {
              <span>{{ tab.label }}</span>
            }
            @if (tab.badge !== undefined && tab.badge !== null && tab.badge !== '') {
              <span class="emr-tab__badge">{{ tab.badge }}</span>
            }
          </button>
        }
      </div>
      @if (orientation() === 'horizontal' && canScrollRight()) {
        <button
          type="button"
          class="emr-tabs-nav-btn"
          data-emr-print="hide"
          aria-label="Scroll tabs right"
          (click)="scrollTabs(1)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrTabsComponent implements OnDestroy {
  readonly controlId = input<string>();
  readonly ariaLabel = input<string>('Sections');
  readonly ariaLabelledBy = input<string>();
  readonly tabs = input<readonly EmrTabOption[]>([]);
  readonly value = input<string | undefined>(undefined);
  readonly active = input<string | undefined>(undefined);
  readonly variant = input<EmrTabsVariant>('underline');
  readonly size = input<EmrTabsSize>('md');
  readonly orientation = input<EmrTabsOrientation>('horizontal');
  readonly fitted = input(false, { transform: booleanAttribute });
  readonly activationMode = input<EmrTabsActivationMode>('automatic');
  readonly loop = input(true, { transform: booleanAttribute });
  readonly iconPosition = input<EmrTabsIconPosition>('start');
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly valueChange = output<string>();
  readonly tabChange = output<string>();
  readonly tabChanged = output<string>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-tabs-${++nextTabsId}`;
  protected readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  protected readonly resolvedActive = computed(() =>
    resolveActiveTabValue(this.tabs(), this.value(), this.active()),
  );
  protected readonly tabStopIndex = computed(() =>
    resolveTabStopIndex(this.tabs(), this.resolvedActive(), this.disabled()),
  );

  private readonly tablistRef = viewChild<ElementRef<HTMLDivElement>>('tablistEl');
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');
  private hasFocus = false;
  protected readonly canScrollLeft = signal(false);
  protected readonly canScrollRight = signal(false);
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => {
      const el = this.tablistRef()?.nativeElement;
      if (!el) return;
      this.updateScrollOverflow();
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.updateScrollOverflow());
        this.resizeObserver.observe(el);
      }
    });
    effect(() => {
      this.tabs();
      this.size();
      this.fitted();
      this.orientation();
      queueMicrotask(() => this.updateScrollOverflow());
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  protected updateScrollOverflow(): void {
    const el = this.tablistRef()?.nativeElement;
    if (!el || this.orientation() !== 'horizontal') {
      this.canScrollLeft.set(false);
      this.canScrollRight.set(false);
      return;
    }
    this.canScrollLeft.set(el.scrollLeft > 2);
    this.canScrollRight.set(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }

  protected scrollTabs(dir: -1 | 1): void {
    const el = this.tablistRef()?.nativeElement;
    if (!el) return;
    el.scrollBy?.({ left: dir * Math.max(140, Math.round(el.clientWidth * 0.65)), behavior: 'smooth' });
  }

  protected onFocusIn(): void {
    if (!this.hasFocus) {
      this.hasFocus = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const current = event.currentTarget as HTMLElement | null;
    const related = event.relatedTarget as Node | null;
    if (!current || !related || !current.contains(related)) {
      this.hasFocus = false;
      this.blurred.emit();
    }
  }

  protected onTabClick(tab: EmrTabOption): void {
    if (!canActivateTab(tab, this.disabled(), this.readOnly())) return;
    if (tab.value !== this.resolvedActive()) {
      this.emitTab(tab.value);
    }
  }

  protected onKeydown(event: KeyboardEvent, currentIndex: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      const tab = this.tabs()[currentIndex];
      if (canActivateTab(tab, this.disabled(), this.readOnly()) && tab!.value !== this.resolvedActive()) {
        event.preventDefault();
        this.emitTab(tab!.value);
      }
      return;
    }

    const nextIdx = getNextTabIndex(this.tabs(), currentIndex, event.key, {
      orientation: this.orientation(),
      loop: this.loop(),
    });
    if (nextIdx === null) return;
    event.preventDefault();
    const buttons = this.tabButtons().map((ref) => ref.nativeElement);
    const targetBtn = buttons[nextIdx];
    targetBtn?.focus();
    targetBtn?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });

    if (this.activationMode() === 'automatic') {
      const targetTab = this.tabs()[nextIdx];
      if (canActivateTab(targetTab, this.disabled(), this.readOnly()) && targetTab!.value !== this.resolvedActive()) {
        this.emitTab(targetTab!.value);
      }
    }
  }

  private emitTab(value: string): void {
    this.valueChange.emit(value);
    this.tabChange.emit(value);
    this.tabChanged.emit(value);
  }
}
