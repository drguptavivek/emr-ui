import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { EmrCardPadding, EmrCardVariant, EmrColumnsAlign, EmrColumnsTrackWidth, EmrTone } from '@drguptavivek/emr-controller';

let nextCardHeadingId = 0;

/** Presentation surface container with optional header, subtitle, footer, variants, tone, and interactive mode. */
@Component({
  selector: 'emr-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'emr-card',
    '[id]': 'controlId() ?? null',
    '[class.emr-card--elevated]': 'variant() === "elevated"',
    '[class.emr-card--filled]': 'variant() === "filled"',
    '[class.emr-card--subtle]': 'variant() === "subtle"',
    '[class.emr-card--flush]': 'resolvedPadding() === "none"',
    '[class.emr-card--pad-sm]': 'resolvedPadding() === "sm"',
    '[class.emr-card--pad-lg]': 'resolvedPadding() === "lg"',
    '[class.emr-card--interactive]': 'interactive()',
    '[class.emr-card--selected]': 'interactive() && selected()',
    '[class.emr-card--disabled]': 'disabled()',
    '[class.emr-card--readonly]': 'readOnly()',
    '[attr.data-tone]': 'tone() !== "neutral" ? tone() : null',
    '[attr.role]': 'interactive() ? "button" : null',
    '[attr.tabindex]': 'interactive() && !disabled() ? 0 : null',
    '[attr.aria-label]': 'ariaLabel() ?? null',
    '[attr.aria-labelledby]': '!ariaLabel() && resolvedLabel() ? resolvedHeadingId() : null',
    '[attr.aria-pressed]': 'interactive() ? selected() : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-readonly]': 'interactive() && readOnly() ? "true" : null',
    '(click)': 'onActivate()',
    '(keydown.enter)': 'onKeyActivate($event)',
    '(keydown.space)': 'onKeyActivate($event)',
  },
  template: `
    @if (resolvedLabel() || subtitle()) {
      <div class="emr-card__header">
        <div class="emr-card__header-main">
          @if (resolvedLabel(); as text) {
            <div class="emr-card__title" [id]="resolvedHeadingId()">{{ text }}</div>
          }
          @if (subtitle(); as sub) {
            <div class="emr-card__subtitle">{{ sub }}</div>
          }
        </div>
        <div class="emr-card__header-extra"><ng-content select="[emrCardHeader]" /></div>
      </div>
    }
    <div class="emr-card__body"><ng-content /></div>
    <div class="emr-card__footer"><ng-content select="[emrCardFooter]" /></div>
  `,
})
export class EmrCardComponent {
  readonly controlId = input<string | undefined>(undefined);
  readonly label = input<string | undefined>(undefined);
  readonly title = input<string | undefined>(undefined);
  readonly cardTitle = input<string | undefined>(undefined);
  readonly subtitle = input<string | undefined>(undefined);
  readonly headingId = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly variant = input<EmrCardVariant>('outlined');
  readonly padding = input<EmrCardPadding>('md');
  readonly padded = input<boolean, unknown>(true, { transform: booleanAttribute });
  readonly tone = input<EmrTone>('neutral');
  readonly interactive = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly selected = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly readOnly = input<boolean, unknown>(false, { transform: booleanAttribute });

  readonly activated = output<void>();

  private readonly fallbackHeadingId = `emr-card-heading-${++nextCardHeadingId}`;
  protected readonly resolvedHeadingId = computed(() => this.headingId() || this.fallbackHeadingId);
  protected readonly resolvedLabel = computed(
    () => (this.label()?.trim() ? this.label() : this.title()?.trim() ? this.title() : this.cardTitle()?.trim() ? this.cardTitle() : undefined),
  );
  protected readonly resolvedPadding = computed<EmrCardPadding>(() => (!this.padded() ? 'none' : this.padding()));

  protected onActivate(): void {
    if (!this.interactive() || this.disabled() || this.readOnly()) return;
    this.activated.emit();
  }

  protected onKeyActivate(event: Event): void {
    if (!this.interactive() || this.disabled() || this.readOnly()) return;
    event.preventDefault();
    this.activated.emit();
  }
}

/**
 * Configurable multi-column card layout. `count` covers the common 2- and
 * 3-column cases; `widths` overrides with explicit CSS track sizes
 * (e.g. `['2fr', '1fr']`). Columns stack to a single column on narrow screens.
 */
@Component({
  selector: 'emr-columns',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'emr-columns',
    '[id]': 'controlId() ?? null',
    '[style.grid-template-columns]': 'template()',
    '[style.gap]': 'resolvedGap()',
    '[style.align-items]': 'resolvedAlign()',
  },
  template: `<ng-content />`,
})
export class EmrColumnsComponent implements OnInit, OnDestroy {
  readonly controlId = input<string | undefined>(undefined);
  readonly count = input<number>(2);
  readonly columns = input<number | undefined>(undefined);
  readonly widths = input<readonly EmrColumnsTrackWidth[] | undefined>(undefined);
  readonly gap = input<number | string>('16px');
  readonly align = input<EmrColumnsAlign>('stretch');
  readonly collapseBelow = input<number>(640);

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly containerWidth = signal<number | null>(null);
  private resizeObserver?: ResizeObserver;
  private rafId = 0;

  ngOnInit(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width;
        if (typeof w === 'number' && w > 0) {
          if (this.rafId) cancelAnimationFrame(this.rafId);
          this.rafId = requestAnimationFrame(() => {
            this.rafId = 0;
            this.containerWidth.set(w);
          });
        }
      });
      this.resizeObserver.observe(this.hostRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
  }

  protected readonly resolvedAlign = computed<EmrColumnsAlign>(() => {
    const a = this.align();
    return a === 'start' || a === 'center' || a === 'end' || a === 'stretch' ? a : 'stretch';
  });

  protected readonly resolvedGap = computed(() => {
    const g = this.gap();
    if (typeof g === 'number' && Number.isFinite(g)) return `${Math.max(0, g)}px`;
    return typeof g === 'string' && g.trim() ? g.trim() : '16px';
  });

  protected readonly template = computed(() => {
    const threshold = this.collapseBelow();
    const w = this.containerWidth();
    if (threshold > 0 && w !== null && w < threshold) {
      return 'minmax(0, 1fr)';
    }
    const explicit = this.widths();
    if (explicit && explicit.length > 0) {
      return explicit
        .map((item) => (typeof item === 'number' && Number.isFinite(item) ? `${Math.max(0, item)}px` : String(item)))
        .join(' ');
    }
    const raw = this.columns() ?? this.count();
    const clamped = Math.max(1, Math.min(6, Math.trunc(Number.isFinite(raw) ? raw : 2)));
    return `repeat(${clamped}, minmax(0, 1fr))`;
  });
}

/**
 * Full-width clinical row presenting a field label, its value, remarks, and
 * notes in aligned columns. Set `heading` for the column-title row. Values are
 * controller-supplied strings; distinct clinical states must not be collapsed.
 */
@Component({
  selector: 'emr-field-value-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'emr-field-value-row',
    '[id]': 'controlId() ?? null',
    '[class.emr-field-value-row--heading]': 'heading()',
    '[class.emr-field-value-row--sm]': 'resolvedSize() === "sm"',
    '[class.emr-field-value-row--lg]': 'resolvedSize() === "lg"',
    '[class.emr-field-value-row--truncate]': 'truncate()',
    '[class.emr-field-value-row--interactive]': 'interactive()',
    '[class.emr-field-value-row--readonly]': 'interactive() && readOnly()',
    '[attr.data-tone]': 'resolvedTone()',
    role: 'row',
    '[attr.tabindex]': 'interactive() ? 0 : null',
    '[attr.aria-label]': 'ariaLabel() ?? null',
    '[attr.aria-readonly]': 'interactive() && readOnly() ? "true" : null',
    '(click)': 'onActivate()',
    '(keydown.enter)': 'onKeyActivate($event)',
    '(keydown.space)': 'onKeyActivate($event)',
  },
  template: `
    <div
      class="emr-fvr__cell emr-fvr__field"
      [attr.role]="heading() ? 'columnheader' : 'rowheader'"
      data-label="Field"
    >{{ field() }}</div>
    <div
      class="emr-fvr__cell emr-fvr__value"
      [class.emr-fvr__placeholder]="resolvedValue().isPlaceholder"
      [attr.role]="heading() ? 'columnheader' : 'cell'"
      data-label="Value"
    >{{ resolvedValue().text }}</div>
    <div
      class="emr-fvr__cell emr-fvr__remarks"
      [attr.role]="heading() ? 'columnheader' : 'cell'"
      data-label="Remarks"
    >{{ remarks() ?? '' }}</div>
    <div
      class="emr-fvr__cell emr-fvr__notes"
      [attr.role]="heading() ? 'columnheader' : 'cell'"
      data-label="Notes"
    >{{ notes() ?? '' }}</div>
  `,
})
export class EmrFieldValueRowComponent {
  readonly controlId = input<string | undefined>(undefined);
  readonly field = input<string>('');
  readonly value = input<string | number | null | undefined>('');
  readonly remarks = input<string | null | undefined>('');
  readonly notes = input<string | null | undefined>('');
  readonly heading = input(false, { transform: booleanAttribute });
  readonly placeholder = input('—');
  readonly tone = input<EmrTone>('neutral');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly truncate = input(false, { transform: booleanAttribute });
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>(undefined);

  readonly activated = output<void>();
  readonly intent = output<{ readonly type: 'rowActivated'; readonly id?: string }>();

  protected readonly resolvedSize = computed<'sm' | 'md' | 'lg'>(() => {
    const s = this.size();
    return s === 'sm' || s === 'lg' ? s : 'md';
  });

  protected readonly resolvedTone = computed<EmrTone>(() => {
    const t = this.tone();
    return t === 'info' || t === 'success' || t === 'warning' || t === 'danger' ? t : 'neutral';
  });

  protected readonly resolvedValue = computed(() => {
    const raw = this.value();
    const ph = this.placeholder() || '—';
    if (this.heading()) return { text: raw == null ? '' : String(raw), isPlaceholder: false };
    if (typeof raw === 'number') {
      return Number.isFinite(raw) ? { text: String(raw), isPlaceholder: false } : { text: ph, isPlaceholder: true };
    }
    if (typeof raw === 'string' && raw.trim().length > 0) return { text: raw, isPlaceholder: false };
    return { text: ph, isPlaceholder: true };
  });

  protected onActivate(): void {
    if (!this.interactive() || this.readOnly()) return;
    this.activated.emit();
    this.intent.emit({ type: 'rowActivated', id: this.controlId() });
  }

  protected onKeyActivate(event: Event): void {
    if (!this.interactive() || this.readOnly()) return;
    event.preventDefault();
    this.activated.emit();
    this.intent.emit({ type: 'rowActivated', id: this.controlId() });
  }
}
