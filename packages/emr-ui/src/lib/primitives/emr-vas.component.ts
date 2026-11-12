import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import type { EmrTone } from '@drguptavivek/emr-controller';

export interface EmrVasAnchor {
  /** Value this label is anchored to (typically `min` or `max`). */
  value: number;
  label: string;
  /** Read by screen readers in place of the visible label. */
  assistiveLabel?: string;
}

interface EmrVasTick {
  value: number;
  percent: number;
  major: boolean;
  label: string | null;
}

/** Pathological interval inputs must not generate an unbounded DOM. */
const MAX_TICKS = 400;
let nextVasId = 0;

@Component({
  selector: 'emr-vas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="emr-vas"
      [class.emr-vas--vertical]="orientation() === 'vertical'"
      [attr.data-tone]="tone() ?? null"
    >
      <div [class.emr-choice-header]="showClear()">
        <span class="emr-vas__label" [class.emr-sr-only]="labelHidden()" [id]="labelId()">
          {{ label() }}
          @if (required()) {
            <span class="emr-vas__required" aria-hidden="true">*</span>
            <span class="emr-sr-only">Required</span>
          }
        </span>
        @if (showClear()) {
          <button
            type="button"
            class="emr-choice-clear"
            [attr.aria-label]="'Clear ' + (label() || 'selection')"
            (click)="clearSelection()"
          >
            {{ clearLabel() }}
          </button>
        }
      </div>

      <div class="emr-vas__frame">
        <div
          class="emr-vas__track"
          [id]="resolvedId()"
          role="slider"
          [attr.tabindex]="disabled() ? null : 0"
          [attr.aria-orientation]="orientation()"
          [attr.aria-labelledby]="labelId()"
          [attr.aria-describedby]="describedBy()"
          [attr.aria-valuemin]="min()"
          [attr.aria-valuemax]="max()"
          [attr.aria-valuenow]="value() ?? null"
          [attr.aria-valuetext]="valueText() ?? null"
          [attr.aria-readonly]="readOnly() || null"
          [attr.aria-disabled]="disabled() || null"
          [attr.aria-invalid]="error() ? 'true' : null"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerUp($event)"
          (pointercancel)="onPointerUp($event)"
          (keydown)="onKeyDown($event)"
        >
          <span class="emr-vas__rule" aria-hidden="true"></span>

          @for (tick of ticks(); track tick.value) {
            <span
              class="emr-vas__tick"
              [class.emr-vas__tick--major]="tick.major"
              [style.--emr-vas-pos.%]="tick.percent"
              aria-hidden="true"
            ></span>
            @if (tick.label !== null) {
              <span
                class="emr-vas__tick-label"
                [style.--emr-vas-pos.%]="tick.percent"
                aria-hidden="true"
              >
                {{ tick.label }}
              </span>
            }
          }

          @if (percent() !== null) {
            <span class="emr-vas__mark" [style.--emr-vas-pos.%]="percent()" aria-hidden="true"></span>
            <span class="emr-vas__thumb" [style.--emr-vas-pos.%]="percent()" aria-hidden="true"></span>
          }
        </div>

        @if (minAnchor() || maxAnchor()) {
          <div class="emr-vas__anchors" aria-hidden="true">
            <span class="emr-vas__anchor emr-vas__anchor--max">{{ maxAnchor()?.label }}</span>
            <span class="emr-vas__anchor emr-vas__anchor--min">{{ minAnchor()?.label }}</span>
          </div>
        }
      </div>

      @if (!labelHidden()) {
        <div class="emr-vas__messages" aria-live="polite">
          @if (error()) {
            <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
          } @else if (hint()) {
            <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
          }
        </div>
      }
    </div>
  `,
})
export class EmrVasComponent {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly min = input(0);
  readonly max = input(100);
  readonly value = input<number | null>(null);
  /** Snap granularity. `0` records the raw continuous position. */
  readonly step = input(1);
  /** Labelled marker interval — the numbers printed along the ruler. */
  readonly majorInterval = input(10);
  /** Unlabelled marker interval between the major ones. */
  readonly minorInterval = input(2);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly anchors = input<readonly EmrVasAnchor[]>([]);
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  /** Controller-supplied tone for the recorded mark. The primitive derives no severity. */
  readonly tone = input<EmrTone>();
  /** Controller-supplied spoken value (`aria-valuetext`), e.g. "72 out of 100". */
  readonly valueText = input<string>();

  readonly valueChange = output<number | null>();
  readonly cleared = output<void>();

  private readonly fallbackId = `emr-vas-${++nextVasId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly showClear = computed(
    () =>
      Boolean(
        this.clearable() &&
          this.value() !== null &&
          this.value() !== undefined &&
          !this.readOnly() &&
          !this.disabled(),
      ),
  );

  protected clearSelection(): void {
    if (!this.interactive()) return;
    this.valueChange.emit(null);
    this.cleared.emit();
  }

  protected readonly labelId = computed(() => `${this.resolvedId()}-label`);

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    if (this.error()) return `${this.resolvedId()}-error`;
    if (this.hint()) return `${this.resolvedId()}-hint`;
    return null;
  });

  protected readonly percent = computed(() => {
    const value = this.value();
    return value === null || value === undefined ? null : this.toPercent(value);
  });

  protected readonly minAnchor = computed(() =>
    this.anchors().find((anchor) => anchor.value === this.min()),
  );
  protected readonly maxAnchor = computed(() =>
    this.anchors().find((anchor) => anchor.value === this.max()),
  );

  protected readonly ticks = computed<EmrVasTick[]>(() => {
    const min = this.min();
    const max = this.max();
    const span = max - min;
    if (!(span > 0)) return [];

    const major = this.majorInterval() > 0 ? this.majorInterval() : span;
    const minor = this.minorInterval() > 0 ? this.minorInterval() : major;
    const smallest = Math.min(major, minor);
    const stride = span / smallest > MAX_TICKS ? span / MAX_TICKS : smallest;

    const ticks: EmrVasTick[] = [];
    for (let value = min; value <= max + stride / 1000; value += stride) {
      const rounded = Number(value.toFixed(6));
      const isMajor = this.isMultiple(rounded - min, major);
      ticks.push({
        value: rounded,
        percent: this.toPercent(rounded),
        major: isMajor,
        label: isMajor ? this.formatTick(rounded) : null,
      });
    }
    return ticks;
  });

  protected onPointerDown(event: PointerEvent): void {
    if (!this.interactive()) return;
    const target = event.currentTarget as HTMLElement;
    if (typeof target.setPointerCapture === 'function') {
      target.setPointerCapture(event.pointerId);
    }
    target.focus();
    event.preventDefault();
    this.emitFromPointer(event, target);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.interactive()) return;
    const target = event.currentTarget as HTMLElement;
    if (typeof target.hasPointerCapture === 'function' && !target.hasPointerCapture(event.pointerId)) {
      return;
    }
    event.preventDefault();
    this.emitFromPointer(event, target);
  }

  protected onPointerUp(event: PointerEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (
      typeof target.hasPointerCapture === 'function' &&
      typeof target.releasePointerCapture === 'function' &&
      target.hasPointerCapture(event.pointerId)
    ) {
      target.releasePointerCapture(event.pointerId);
    }
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (!this.interactive()) return;
    const stepSize = this.step() > 0 ? this.step() : 1;
    const page = this.majorInterval() > 0 ? this.majorInterval() : stepSize;
    const current = this.value() ?? this.min();
    let next: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = current + stepSize;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = current - stepSize;
        break;
      case 'PageUp':
        next = current + page;
        break;
      case 'PageDown':
        next = current - page;
        break;
      case 'Home':
        next = this.min();
        break;
      case 'End':
        next = this.max();
        break;
      default:
        return;
    }

    event.preventDefault();
    this.emit(next);
  }

  private interactive(): boolean {
    return !this.disabled() && !this.readOnly();
  }

  private emitFromPointer(event: PointerEvent, target: HTMLElement): void {
    const rect = target.getBoundingClientRect();
    const ratio =
      this.orientation() === 'vertical'
        ? rect.height > 0
          ? (rect.bottom - event.clientY) / rect.height
          : 0
        : rect.width > 0
          ? (event.clientX - rect.left) / rect.width
          : 0;
    this.emit(this.min() + ratio * (this.max() - this.min()));
  }

  private emit(raw: number): void {
    const next = this.snap(raw);
    if (next === this.value()) return;
    this.valueChange.emit(next);
  }

  private snap(raw: number): number {
    const min = this.min();
    const max = this.max();
    const bounded = Math.min(Math.max(raw, Math.min(min, max)), Math.max(min, max));
    const step = this.step();
    if (!(step > 0)) return Number(bounded.toFixed(4));
    return Number((min + Math.round((bounded - min) / step) * step).toFixed(4));
  }

  private toPercent(value: number): number {
    const span = this.max() - this.min();
    if (!(span > 0)) return 0;
    const ratio = (value - this.min()) / span;
    return Math.min(100, Math.max(0, ratio * 100));
  }

  private isMultiple(offset: number, interval: number): boolean {
    if (!(interval > 0)) return false;
    const remainder = Math.abs(offset % interval);
    return remainder < interval / 1000 || Math.abs(remainder - interval) < interval / 1000;
  }

  private formatTick(value: number): string {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
  }
}
