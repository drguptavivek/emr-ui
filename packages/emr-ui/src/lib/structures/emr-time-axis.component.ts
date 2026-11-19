import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroChevronLeft, heroChevronRight } from '@ng-icons/heroicons/outline';
import type {
  EmrTimeAxisLabels,
  TimeAxisIntent,
  TimeAxisTick,
  TimeAxisViewModel,
} from '@drguptavivek/emr-controller';
import {
  canChangeTimeAxisStep,
  canPanTimeAxis,
  canSelectTimeAxisSlot,
  resolveTimeAxisHeadingId,
  resolveTimeAxisId,
  resolveTimeAxisLabels,
  resolveTimeAxisNextIndex,
  resolveTimeAxisStepSelectId,
  resolveTimeAxisTabStopId,
  resolveTimeAxisTickId,
} from './emr-time-axis.logic';

/**
 * Horizontal time scale for inpatient charts. Renders controller-supplied ticks in fixed-width
 * columns so a flowsheet or trend can be stacked underneath and line up: set
 * `--emr-time-axis-col` to the column width below (default 5.5rem, the flowsheet's) and
 * `--emr-time-axis-lead` to the width of any row-header gutter (default 0).
 * ArrowLeft, ArrowRight, Home and End move between ticks (roving tab stop); Enter, Space or click selects.
 */
@Component({
  selector: 'emr-time-axis',
  standalone: true,
  imports: [NgTemplateOutlet, NgIcon],
  providers: [...provideIcons({ heroChevronLeft, heroChevronRight })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusin)': 'onHostFocusIn()',
    '(focusout)': 'onHostFocusOut($event)',
  },
  template: `
    @let m = model();
    @let l = resolvedLabels();
    <section class="ta" [id]="resolvedAxisId()" [attr.aria-labelledby]="titleId()">
      <header class="ta__head">
        <h3 class="ta__title" [class.emr-sr-only]="!m.title" [id]="titleId()">{{ m.title || l.title }}</h3>
        <div class="ta__controls">
          @if (!m.readOnly && m.steps?.length) {
            <label class="ta__step" data-emr-print="hide" [for]="stepSelectId()">
              <span class="ta__steplabel">{{ l.step }}</span>
              <select
                class="emr-select ta__select"
                [id]="stepSelectId()"
                [value]="m.selectedStepId ?? ''"
                (change)="stepChanged($event)"
              >
                @for (s of m.steps; track s.id) {
                  <option [value]="s.id" [selected]="s.id === m.selectedStepId">{{ s.label }}</option>
                }
              </select>
            </label>
          } @else if (m.stepLabel) {
            <span class="ta__steplabel">{{ l.stepValue(m.stepLabel) }}</span>
          }
          @if (!m.readOnly) {
            <button
              type="button"
              class="emr-button emr-button--outline emr-button--small ta__btn"
              data-emr-print="hide"
              [attr.aria-label]="l.earlier"
              [attr.aria-disabled]="!canPanEarlier() ? 'true' : null"
              (click)="shiftEarlier()"
            >
              <ng-icon name="heroChevronLeft" aria-hidden="true" />
              <span>{{ l.earlier }}</span>
            </button>
            <button
              type="button"
              class="emr-button emr-button--outline emr-button--small ta__btn"
              data-emr-print="hide"
              [attr.aria-label]="l.later"
              [attr.aria-disabled]="!canPanLater() ? 'true' : null"
              (click)="shiftLater()"
            >
              <span>{{ l.later }}</span>
              <ng-icon name="heroChevronRight" aria-hidden="true" />
            </button>
          }
        </div>
      </header>

      @if (!m.ticks.length) {
        <p class="ta__empty">{{ l.empty }}</p>
      } @else if (m.readOnly) {
        <div class="ta__scroll" data-emr-print="expand" role="region" tabindex="0" [attr.aria-labelledby]="titleId()">
          <ol class="ta__strip">
            @for (t of m.ticks; track t.id) {
              <li
                class="ta__tick"
                [id]="tickDomId(t.id)"
                [class.ta__tick--current]="t.current"
                [class.ta__tick--selected]="t.id === m.selectedTickId"
                [attr.aria-current]="t.current ? 'time' : null"
              >
                <ng-container *ngTemplateOutlet="tickBody; context: { $implicit: t, selected: t.id === m.selectedTickId }" />
              </li>
            }
          </ol>
        </div>
      } @else {
        <div class="ta__scroll" data-emr-print="expand">
          <div
            class="ta__strip"
            role="listbox"
            aria-orientation="horizontal"
            [attr.aria-labelledby]="titleId()"
            (keydown)="onKey($event)"
          >
            @for (t of m.ticks; track t.id) {
              <div
                #tick
                class="ta__tick ta__tick--option"
                role="option"
                [id]="tickDomId(t.id)"
                [class.ta__tick--current]="t.current"
                [class.ta__tick--selected]="t.id === m.selectedTickId"
                [attr.aria-selected]="t.id === m.selectedTickId ? 'true' : 'false'"
                [attr.aria-current]="t.current ? 'time' : null"
                [attr.tabindex]="t.id === tabStopId() ? 0 : -1"
                (focus)="focusedId.set(t.id)"
                (click)="select(t)"
              >
                <ng-container *ngTemplateOutlet="tickBody; context: { $implicit: t, selected: false }" />
              </div>
            }
          </div>
        </div>
      }
    </section>

    <ng-template #tickBody let-t let-selected="selected">
      <span class="ta__label">{{ t.label }}</span>
      @if (t.sublabel) { <span class="ta__sub">{{ t.sublabel }}</span> }
      @if (t.current) { <span class="ta__now">{{ resolvedLabels().current }}</span> }
      <!-- Options announce selection via aria-selected; the read-only list says it in words. -->
      @if (selected) { <span class="emr-sr-only">, {{ resolvedLabels().selected }}</span> }
    </ng-template>
  `,
  styles: [`
    :host{display:block;min-width:0;max-width:100%;color:var(--emr-text);font-family:var(--emr-font-family);font-variant-numeric:tabular-nums;container-type:inline-size}
    .ta{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;min-width:0}
    .ta__head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;min-width:0}
    .ta__title{margin:0;font-size:var(--emr-text-lg);line-height:var(--emr-leading-tight);min-width:0}
    .ta__controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0}
    .ta__step{display:inline-flex;align-items:center;gap:6px;min-height:44px}
    .ta__select{width:auto;min-width:96px;min-height:44px;font-variant-numeric:tabular-nums}
    .ta__steplabel{color:var(--emr-text-muted);font-size:var(--emr-text-sm)}
    .ta__btn{display:inline-flex;align-items:center;gap:4px;min-height:44px;height:auto;min-width:44px;--ng-icon__size:16px;transition:border-color 150ms ease,transform 100ms ease}
    .ta__btn[aria-disabled="true"]{opacity:.52;cursor:not-allowed}
    .ta__btn[aria-disabled="true"]:hover{background-color:var(--emr-surface)}
    .ta__btn[aria-disabled="true"]:active{transform:none}
    .ta__empty{margin:0;color:var(--emr-text-muted);font-style:italic;font-size:var(--emr-text-sm)}
    .ta__scroll{overflow-x:auto;max-width:100%;min-width:0;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface-raised);overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
    .ta__scroll:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .ta__strip{display:flex;width:max-content;margin:0;padding:0 0 0 var(--emr-time-axis-lead,0px);list-style:none}
    .ta__tick{box-sizing:border-box;flex:0 0 var(--emr-time-axis-col,5.5rem);width:var(--emr-time-axis-col,5.5rem);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:44px;padding:6px;border-right:1px solid var(--emr-border);text-align:center;font-size:var(--emr-text-xs);line-height:var(--emr-leading-tight);font-variant-numeric:tabular-nums}
    .ta__strip > .ta__tick:first-child{border-left:1px solid var(--emr-border)}
    .ta__tick--option{cursor:pointer}
    .ta__tick--option:hover{background:var(--emr-primary-soft)}
    .ta__tick--option:focus-visible{outline:3px solid var(--emr-focus);outline-offset:-3px}
    .ta__tick--current{box-shadow:inset 3px 0 0 var(--emr-primary);background:var(--emr-primary-soft)}
    .ta__tick--selected{box-shadow:inset 0 0 0 2px var(--emr-primary);background:var(--emr-primary-soft)}
    .ta__tick--current.ta__tick--selected{box-shadow:inset 5px 0 0 var(--emr-primary),inset 0 0 0 2px var(--emr-primary)}
    .ta__label{font-weight:var(--emr-weight-bold);overflow-wrap:anywhere}
    .ta__sub{color:var(--emr-text-muted);overflow-wrap:anywhere}
    .ta__tick--current .ta__sub,.ta__tick--selected .ta__sub{color:var(--emr-text)}
    .ta__now{font-size:var(--emr-text-2xs);font-weight:var(--emr-weight-bold);text-transform:uppercase;letter-spacing:.06em;color:var(--emr-primary)}
    @container (max-width:480px){.ta__head{flex-direction:column;align-items:stretch}.ta__controls{justify-content:flex-start}}
    :host-context(.emr-print) [data-emr-print="hide"],:host-context(.emr-print) .ta__controls .emr-button{display:none !important}
    :host-context(.emr-print) .ta,:host-context(.emr-print) .ta__tick{break-inside:avoid;page-break-inside:avoid}
    :host-context(.emr-print) .ta__scroll{overflow:visible !important;max-width:none !important}
    @media print{[data-emr-print="hide"],.ta__controls .emr-button{display:none !important}.ta,.ta__tick{break-inside:avoid;page-break-inside:avoid}.ta__scroll{overflow:visible !important;max-width:none !important}}
  `],
})
export class EmrTimeAxisComponent {
  readonly model = input.required<TimeAxisViewModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly labels = input<EmrTimeAxisLabels>();

  readonly intent = output<TimeAxisIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  /** Tick the user last focused; only moves focus, never selection. */
  protected readonly focusedId = signal<string | null>(null);
  private readonly tickEls = viewChildren<ElementRef<HTMLElement>>('tick');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private isFocusWithin = false;

  protected readonly resolvedLabels = computed(() => resolveTimeAxisLabels(this.labels()));
  protected readonly resolvedAxisId = computed(() => resolveTimeAxisId(this.model().id, this.idPrefix()));
  protected readonly titleId = computed(() =>
    resolveTimeAxisHeadingId(this.model().id, this.idPrefix(), this.headingId()),
  );
  protected readonly stepSelectId = computed(() =>
    resolveTimeAxisStepSelectId(this.model().id, this.idPrefix()),
  );
  protected readonly canPanEarlier = computed(() => canPanTimeAxis(this.model(), 'earlier'));
  protected readonly canPanLater = computed(() => canPanTimeAxis(this.model(), 'later'));

  /** The single tab stop: last focused tick, else the selected one, else "now", else the first. */
  protected readonly tabStopId = computed(() =>
    resolveTimeAxisTabStopId(this.model().ticks, this.focusedId(), this.model().selectedTickId),
  );

  protected tickDomId(tickId: string): string {
    return resolveTimeAxisTickId(this.model().id, tickId, this.idPrefix());
  }

  protected select(tick: TimeAxisTick): void {
    if (!canSelectTimeAxisSlot(this.model(), tick.id)) return;
    this.intent.emit({ type: 'tickSelected', tickId: tick.id });
  }

  protected shiftEarlier(): void {
    if (!canPanTimeAxis(this.model(), 'earlier')) return;
    this.intent.emit({ type: 'shiftEarlierRequested' });
  }

  protected shiftLater(): void {
    if (!canPanTimeAxis(this.model(), 'later')) return;
    this.intent.emit({ type: 'shiftLaterRequested' });
  }

  protected stepChanged(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const stepId = target.value;
    target.value = this.model().selectedStepId ?? '';
    if (canChangeTimeAxisStep(this.model(), stepId)) {
      this.intent.emit({ type: 'stepChangeRequested', stepId });
    }
  }

  protected onKey(event: KeyboardEvent): void {
    const ticks = this.model().ticks;
    const currentIndex = ticks.findIndex((t) => t.id === this.tabStopId());
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (currentIndex >= 0 && ticks[currentIndex]) {
        this.select(ticks[currentIndex]);
      }
      return;
    }
    const next = resolveTimeAxisNextIndex(event.key, currentIndex, ticks.length);
    if (next === null || !ticks[next]) return;
    event.preventDefault();
    this.focusedId.set(ticks[next].id);
    this.tickEls()[next]?.nativeElement.focus();
  }

  protected onHostFocusIn(): void {
    if (!this.isFocusWithin) {
      this.isFocusWithin = true;
      this.focused.emit();
    }
  }

  protected onHostFocusOut(e: FocusEvent): void {
    const next = e.relatedTarget as Node | null;
    if (next && this.host.nativeElement.contains(next)) return;
    if (this.isFocusWithin) {
      this.isFocusWithin = false;
      this.blurred.emit();
    }
  }
}
