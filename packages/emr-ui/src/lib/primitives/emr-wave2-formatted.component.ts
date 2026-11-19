import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import type { EmrControlVariant, EmrSliderMark, EmrTone } from '@drguptavivek/emr-controller';
import {
  applyInputMask,
  applyOtpSlotEdit,
  clampRangeSliderPair,
  clampSliderValue,
  countSliderStepDecimals,
  editMaskedInputWithCaret,
  extractOtpTypedInput,
  formatSliderValue,
  inferMaskInputMode,
  normalizeOtpSlots,
  resolveClosestRangeThumb,
  resolveOtpClearSlot,
  resolveRangeThumbKeyValue,
  resolveSliderKeyStepValue,
  sliderValuePercent,
} from './emr-wave2.logic';

let nextWave2FormattedId = 0;

@Component({
  selector: 'emr-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="emr-field emr-slider"
      [class.emr-slider--sm]="size() === 'sm'"
      [class.emr-slider--lg]="size() === 'lg'"
      [class.emr-slider--invalid]="isInvalid()"
      [class.emr-slider--warning]="!isInvalid() && !!warning()"
      [class.emr-slider--readonly]="readOnly()"
      [class.emr-slider--disabled]="disabled()"
      [attr.data-tone]="tone()"
    >
      <div class="emr-choice-header">
        @if (label()) {
          <span class="emr-field__label" [class.emr-sr-only]="labelHidden()" [id]="labelId()">
            {{ label() }}
            @if (required()) {
              <span class="emr-field__required" aria-hidden="true">*</span>
            }
          </span>
        }
        <div class="emr-chip-row">
          @if (showValue()) {
            <span
              class="emr-badge emr-tone-neutral emr-slider__value-badge"
              [id]="resolvedId() + '-value'"
              aria-live="polite"
            >
              {{ formattedValue() }}
            </span>
          }
          @if (showClear()) {
            <button
              type="button"
              class="emr-button emr-button--outline emr-button--small emr-slider__clear"
              data-emr-print="hide"
              [attr.aria-label]="clearLabel() + ' ' + resolvedAriaLabel()"
              (click)="clearValue()"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          }
        </div>
      </div>

      <div class="emr-slider__row">
        @if (showSteppers()) {
          <button
            type="button"
            class="emr-button emr-button--outline emr-button--small emr-slider__stepper"
            data-emr-print="hide"
            [disabled]="disabled() || readOnly() || numericValue() <= min()"
            [attr.aria-label]="'Decrease ' + resolvedAriaLabel()"
            (click)="nudge(-1)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
            </svg>
          </button>
        }

        <div
          #trackEl
          class="emr-slider__track"
          [attr.aria-readonly]="readOnly() ? 'true' : null"
          [attr.aria-disabled]="disabled() ? 'true' : null"
          (pointerdown)="onTrackPointerDown($event)"
          (pointermove)="onTrackPointerMove($event)"
          (pointerup)="onTrackPointerUp($event)"
          (pointercancel)="onTrackPointerUp($event)"
        >
          <div class="emr-slider__rail">
            <div
              class="emr-slider__fill"
              style="left: 0%"
              [style.width.%]="value() === null ? 0 : fillPercent()"
            ></div>
            <div
              #thumbEl
              class="emr-slider__thumb"
              [id]="resolvedId()"
              role="slider"
              [attr.tabindex]="disabled() ? null : 0"
              [style.--emr-pos.%]="fillPercent()"
              [attr.aria-label]="ariaLabel() || (!label() || labelHidden() ? resolvedAriaLabel() : null)"
              [attr.aria-labelledby]="!ariaLabel() && label() && !labelHidden() ? labelId() : null"
              [attr.aria-valuemin]="min()"
              [attr.aria-valuemax]="max()"
              [attr.aria-valuenow]="value() ?? min()"
              [attr.aria-valuetext]="value() === null ? 'Not set' : formattedValue()"
              [attr.aria-required]="required() || null"
              [attr.aria-readonly]="readOnly() || null"
              [attr.aria-disabled]="disabled() || null"
              [attr.aria-invalid]="isInvalid() || null"
              [attr.aria-describedby]="describedBy()"
              (keydown)="onThumbKeydown($event)"
              (focus)="focused.emit()"
              (blur)="blurred.emit()"
            ></div>
          </div>
        </div>

        @if (showSteppers()) {
          <button
            type="button"
            class="emr-button emr-button--outline emr-button--small emr-slider__stepper"
            data-emr-print="hide"
            [disabled]="disabled() || readOnly() || numericValue() >= max()"
            [attr.aria-label]="'Increase ' + resolvedAriaLabel()"
            (click)="nudge(1)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </button>
        }
      </div>

      @if (marks().length > 0) {
        <div class="emr-slider__marks" data-emr-print="hide">
          @for (mark of marks(); track mark.value) {
            @let pct = markPercent(mark.value);
            @let isMarkActive = value() !== null && Math.abs(numericValue() - mark.value) < 1e-6;
            <button
              type="button"
              class="emr-slider__mark"
              [class.emr-slider__mark--start]="pct <= 2"
              [class.emr-slider__mark--end]="pct >= 98"
              [class.emr-slider__mark--active]="isMarkActive"
              [style.--emr-pos.%]="pct"
              [disabled]="disabled() || readOnly()"
              [attr.aria-label]="'Set ' + resolvedAriaLabel() + ' to ' + (mark.label ?? mark.value)"
              (click)="selectMark(mark.value)"
            >
              {{ mark.label ?? mark.value }}
            </button>
          }
        </div>
      }

      @if (error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">{{ error() }}</span>
      }
      @if (warning()) {
        <span class="emr-field__warning" [id]="resolvedId() + '-warning'" role="status">{{ warning() }}</span>
      }
      @if (hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
    </div>
  `,
})
export class EmrSliderComponent {
  protected readonly Math = Math;

  readonly controlId = input<string>();
  readonly label = input('');
  readonly ariaLabel = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly value = input<number | null>(null);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly precision = input<number | undefined>(undefined);
  readonly unit = input('');
  readonly marks = input<readonly EmrSliderMark[]>([]);
  readonly showValue = input(true, { transform: booleanAttribute });
  readonly showSteppers = input(false, { transform: booleanAttribute });
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly tone = input<EmrTone | 'neutral'>('neutral');
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly warning = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly ariaDescribedBy = input<string>();

  readonly valueChange = output<number | null>();
  readonly committed = output<number | null>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-slider-${++nextWave2FormattedId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  protected readonly labelId = computed(() => `${this.resolvedId()}-label`);
  protected readonly resolvedAriaLabel = computed(() => this.ariaLabel() || this.label() || 'Slider');
  protected readonly isInvalid = computed(() => Boolean(this.invalid() || this.error()));

  protected readonly numericValue = computed(() => {
    const v = this.value();
    return v !== null && v !== undefined && Number.isFinite(v)
      ? clampSliderValue(v, this.min(), this.max(), this.step())
      : this.min();
  });

  protected readonly fillPercent = computed(() => {
    const v = this.value();
    if (v === null || v === undefined) return 0;
    return sliderValuePercent(this.numericValue(), this.min(), this.max());
  });

  protected readonly resolvedPrecision = computed(
    () => this.precision() ?? countSliderStepDecimals(this.step()),
  );

  protected readonly formattedValue = computed(() =>
    formatSliderValue(this.value(), this.unit(), this.resolvedPrecision()),
  );

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

  protected readonly describedBy = computed(() => {
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.error()) ids.push(`${id}-error`);
    if (this.warning()) ids.push(`${id}-warning`);
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.ariaDescribedBy()) ids.push(this.ariaDescribedBy()!);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly trackRef = viewChild<ElementRef<HTMLElement>>('trackEl');
  private readonly thumbRef = viewChild<ElementRef<HTMLElement>>('thumbEl');
  private draggingPointerId: number | null = null;
  private lastPointerVal: number | null = null;

  protected markPercent(val: number): number {
    return sliderValuePercent(val, this.min(), this.max());
  }

  protected onTrackPointerDown(event: PointerEvent): void {
    if (this.readOnly() || this.disabled()) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const track = this.trackRef()?.nativeElement;
    if (!track) return;
    this.draggingPointerId = event.pointerId;
    if (typeof track.setPointerCapture === 'function') {
      track.setPointerCapture(event.pointerId);
    }
    this.thumbRef()?.nativeElement.focus();
    const next = this.valueFromPointer(event, track);
    this.lastPointerVal = next;
    this.valueChange.emit(next);
  }

  protected onTrackPointerMove(event: PointerEvent): void {
    if (this.draggingPointerId !== event.pointerId || this.readOnly() || this.disabled()) return;
    const track = this.trackRef()?.nativeElement;
    if (!track) return;
    const next = this.valueFromPointer(event, track);
    if (next !== this.lastPointerVal) {
      this.lastPointerVal = next;
      this.valueChange.emit(next);
    }
  }

  protected onTrackPointerUp(event: PointerEvent): void {
    if (this.draggingPointerId !== event.pointerId) return;
    const track = this.trackRef()?.nativeElement;
    if (track && typeof track.releasePointerCapture === 'function') {
      try {
        track.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore if capture already released
      }
    }
    this.draggingPointerId = null;
    this.committed.emit(this.lastPointerVal ?? this.value());
    this.lastPointerVal = null;
  }

  protected onThumbKeydown(event: KeyboardEvent): void {
    if (this.readOnly() || this.disabled()) return;
    const next = resolveSliderKeyStepValue(
      event.key,
      this.value(),
      this.min(),
      this.max(),
      this.step(),
    );
    if (next === null) return;
    event.preventDefault();
    this.valueChange.emit(next);
    this.committed.emit(next);
  }

  protected nudge(direction: -1 | 1): void {
    if (this.readOnly() || this.disabled()) return;
    const base = this.value() === null ? this.min() : this.numericValue();
    const next = clampSliderValue(
      base + direction * this.step(),
      this.min(),
      this.max(),
      this.step(),
    );
    this.valueChange.emit(next);
    this.committed.emit(next);
  }

  protected selectMark(val: number): void {
    if (this.readOnly() || this.disabled()) return;
    const next = clampSliderValue(val, this.min(), this.max(), this.step());
    this.valueChange.emit(next);
    this.committed.emit(next);
  }

  protected clearValue(): void {
    if (this.readOnly() || this.disabled()) return;
    this.valueChange.emit(null);
    this.committed.emit(null);
    this.cleared.emit();
  }

  private valueFromPointer(event: PointerEvent, track: HTMLElement): number {
    const rect = track.getBoundingClientRect();
    const fraction = rect.width > 0 ? Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) : 0;
    const raw = this.min() + fraction * (this.max() - this.min());
    return clampSliderValue(raw, this.min(), this.max(), this.step());
  }
}

@Component({
  selector: 'emr-range-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="emr-field emr-slider"
      [class.emr-slider--sm]="size() === 'sm'"
      [class.emr-slider--lg]="size() === 'lg'"
      [class.emr-slider--invalid]="isGroupInvalid()"
      [class.emr-slider--warning]="!isGroupInvalid() && !!warning()"
      [class.emr-slider--readonly]="readOnly()"
      [class.emr-slider--disabled]="disabled()"
      [attr.data-tone]="tone()"
      [id]="resolvedId()"
      role="group"
      [attr.aria-label]="resolvedAriaLabel()"
      [attr.aria-required]="required() || null"
      (focusin)="onGroupFocusIn()"
      (focusout)="onGroupFocusOut($event)"
    >
      <div class="emr-choice-header">
        @if (label()) {
          <span class="emr-field__label" [class.emr-sr-only]="labelHidden()">
            {{ label() }}
            @if (required()) {
              <span class="emr-field__required" aria-hidden="true">*</span>
            }
          </span>
        }
        <div class="emr-chip-row">
          @if (showValue()) {
            <span class="emr-badge emr-tone-neutral emr-slider__value-badge" aria-live="polite">
              {{ readoutText() }}
            </span>
          }
          @if (showClear()) {
            <button
              type="button"
              class="emr-button emr-button--outline emr-button--small emr-slider__clear"
              data-emr-print="hide"
              [attr.aria-label]="clearLabel() + ' ' + resolvedAriaLabel()"
              (click)="clearValue()"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          }
        </div>
      </div>

      <div class="emr-slider__row">
        <div
          #trackEl
          class="emr-slider__track"
          [attr.aria-readonly]="readOnly() ? 'true' : null"
          [attr.aria-disabled]="disabled() ? 'true' : null"
          (pointerdown)="onTrackPointerDown($event)"
          (pointermove)="onTrackPointerMove($event)"
          (pointerup)="onTrackPointerUp($event)"
          (pointercancel)="onTrackPointerUp($event)"
        >
          <div class="emr-slider__rail">
            <div
              class="emr-slider__fill"
              [style.left.%]="lowPercent()"
              [style.width.%]="Math.max(0, highPercent() - lowPercent())"
            ></div>
            <div
              #lowThumb
              class="emr-slider__thumb"
              [class.emr-slider__thumb--active]="activeThumb() === 'low'"
              data-thumb="low"
              [id]="resolvedId() + '-low'"
              role="slider"
              [attr.tabindex]="disabled() ? null : 0"
              [style.--emr-pos.%]="lowPercent()"
              [attr.aria-label]="resolvedAriaLabel() + ' minimum'"
              [attr.aria-valuemin]="min()"
              [attr.aria-valuemax]="lowAriaMax()"
              [attr.aria-valuenow]="pair()[0]"
              [attr.aria-valuetext]="value() === null ? 'Not set' : formatVal(pair()[0])"
              [attr.aria-required]="required() || null"
              [attr.aria-readonly]="readOnly() || null"
              [attr.aria-disabled]="disabled() || null"
              [attr.aria-invalid]="isLowInvalid() || null"
              [attr.aria-describedby]="describedBy()"
              (pointerdown)="onThumbPointerDown('low', $event)"
              (keydown)="onThumbKeydown('low', $event)"
              (focus)="activeThumb.set('low')"
            ></div>
            <div
              #highThumb
              class="emr-slider__thumb"
              [class.emr-slider__thumb--active]="activeThumb() === 'high'"
              data-thumb="high"
              [id]="resolvedId() + '-high'"
              role="slider"
              [attr.tabindex]="disabled() ? null : 0"
              [style.--emr-pos.%]="highPercent()"
              [attr.aria-label]="resolvedAriaLabel() + ' maximum'"
              [attr.aria-valuemin]="highAriaMin()"
              [attr.aria-valuemax]="max()"
              [attr.aria-valuenow]="pair()[1]"
              [attr.aria-valuetext]="value() === null ? 'Not set' : formatVal(pair()[1])"
              [attr.aria-required]="required() || null"
              [attr.aria-readonly]="readOnly() || null"
              [attr.aria-disabled]="disabled() || null"
              [attr.aria-invalid]="isHighInvalid() || null"
              [attr.aria-describedby]="describedBy()"
              (pointerdown)="onThumbPointerDown('high', $event)"
              (keydown)="onThumbKeydown('high', $event)"
              (focus)="activeThumb.set('high')"
            ></div>
          </div>
        </div>
      </div>

      @if (marks().length > 0) {
        <div class="emr-slider__marks" data-emr-print="hide">
          @for (mark of marks(); track mark.value) {
            @let pct = markPercent(mark.value);
            @let isMarkActive = value() !== null && (Math.abs(pair()[0] - mark.value) < 1e-6 || Math.abs(pair()[1] - mark.value) < 1e-6);
            <button
              type="button"
              class="emr-slider__mark"
              [class.emr-slider__mark--start]="pct <= 2"
              [class.emr-slider__mark--end]="pct >= 98"
              [class.emr-slider__mark--active]="isMarkActive"
              [style.--emr-pos.%]="pct"
              [disabled]="disabled() || readOnly()"
              [attr.aria-label]="'Jump nearest thumb of ' + resolvedAriaLabel() + ' to ' + (mark.label ?? mark.value)"
              (click)="selectMark(mark.value)"
            >
              {{ mark.label ?? mark.value }}
            </button>
          }
        </div>
      }

      @if (error() || lowError() || highError()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">
          {{ error() || lowError() || highError() }}
        </span>
      }
      @if (warning()) {
        <span class="emr-field__warning" [id]="resolvedId() + '-warning'" role="status">{{ warning() }}</span>
      }
      @if (hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
    </div>
  `,
})
export class EmrRangeSliderComponent {
  protected readonly Math = Math;

  readonly controlId = input<string>();
  readonly label = input('');
  readonly ariaLabel = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly value = input<readonly [number, number] | null>([0, 100]);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly minDistance = input(0);
  readonly precision = input<number | undefined>(undefined);
  readonly unit = input('');
  readonly marks = input<readonly EmrSliderMark[]>([]);
  readonly showValue = input(true, { transform: booleanAttribute });
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly tone = input<EmrTone | 'neutral'>('neutral');
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly lowError = input('');
  readonly highError = input('');
  readonly warning = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly ariaDescribedBy = input<string>();

  readonly valueChange = output<readonly [number, number] | null>();
  readonly committed = output<readonly [number, number] | null>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly fallbackId = `emr-range-slider-${++nextWave2FormattedId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  protected readonly resolvedAriaLabel = computed(() => this.ariaLabel() || this.label() || 'Range slider');
  protected readonly activeThumb = signal<'low' | 'high'>('low');

  protected readonly pair = computed<readonly [number, number]>(() => {
    const v = this.value();
    if (!v) return [this.min(), this.max()];
    return clampRangeSliderPair(
      v[0],
      v[1],
      this.min(),
      this.max(),
      this.step(),
      this.minDistance(),
    );
  });

  protected readonly lowPercent = computed(() => sliderValuePercent(this.pair()[0], this.min(), this.max()));
  protected readonly highPercent = computed(() => sliderValuePercent(this.pair()[1], this.min(), this.max()));
  protected readonly lowAriaMax = computed(() =>
    clampSliderValue(this.pair()[1] - Math.max(0, this.minDistance()), this.min(), this.max(), this.step()),
  );
  protected readonly highAriaMin = computed(() =>
    clampSliderValue(this.pair()[0] + Math.max(0, this.minDistance()), this.min(), this.max(), this.step()),
  );

  protected readonly resolvedPrecision = computed(
    () => this.precision() ?? countSliderStepDecimals(this.step()),
  );

  protected readonly readoutText = computed(() => {
    if (this.value() === null) return '—';
    const [low, high] = this.pair();
    const lowStr = formatSliderValue(low, '', this.resolvedPrecision());
    const highStr = formatSliderValue(high, this.unit(), this.resolvedPrecision());
    return `${lowStr} – ${highStr}`;
  });

  protected readonly showClear = computed(
    () => Boolean(this.clearable() && this.value() !== null && !this.readOnly() && !this.disabled()),
  );

  protected readonly isGroupInvalid = computed(() =>
    Boolean(this.invalid() || this.error() || this.lowError() || this.highError()),
  );
  protected readonly isLowInvalid = computed(() =>
    Boolean(this.invalid() || this.error() || this.lowError()),
  );
  protected readonly isHighInvalid = computed(() =>
    Boolean(this.invalid() || this.error() || this.highError()),
  );

  protected readonly describedBy = computed(() => {
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.error() || this.lowError() || this.highError()) ids.push(`${id}-error`);
    if (this.warning()) ids.push(`${id}-warning`);
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.ariaDescribedBy()) ids.push(this.ariaDescribedBy()!);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly trackRef = viewChild<ElementRef<HTMLElement>>('trackEl');
  private readonly lowThumbRef = viewChild<ElementRef<HTMLElement>>('lowThumb');
  private readonly highThumbRef = viewChild<ElementRef<HTMLElement>>('highThumb');
  private draggingPointerId: number | null = null;
  private draggingThumb: 'low' | 'high' | null = null;
  private lastPointerPair: readonly [number, number] | null = null;
  private groupFocused = false;

  protected formatVal(v: number): string {
    return formatSliderValue(v, this.unit(), this.resolvedPrecision());
  }

  protected markPercent(val: number): number {
    return sliderValuePercent(val, this.min(), this.max());
  }

  protected onGroupFocusIn(): void {
    if (!this.groupFocused) {
      this.groupFocused = true;
      this.focused.emit();
    }
  }

  protected onGroupFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (!related || !this.hostRef.nativeElement.contains(related)) {
      this.groupFocused = false;
      this.blurred.emit();
    }
  }

  protected onThumbPointerDown(thumb: 'low' | 'high', event: PointerEvent): void {
    if (this.readOnly() || this.disabled()) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.stopPropagation();
    const track = this.trackRef()?.nativeElement;
    if (!track) return;
    this.draggingPointerId = event.pointerId;
    this.draggingThumb = thumb;
    this.activeThumb.set(thumb);
    if (typeof track.setPointerCapture === 'function') {
      track.setPointerCapture(event.pointerId);
    }
    (thumb === 'low' ? this.lowThumbRef() : this.highThumbRef())?.nativeElement.focus();
  }

  protected onTrackPointerDown(event: PointerEvent): void {
    if (this.readOnly() || this.disabled()) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const track = this.trackRef()?.nativeElement;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const fraction = rect.width > 0 ? Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) : 0;
    const thumb = resolveClosestRangeThumb(fraction, this.lowPercent(), this.highPercent());
    this.draggingPointerId = event.pointerId;
    this.draggingThumb = thumb;
    this.activeThumb.set(thumb);
    if (typeof track.setPointerCapture === 'function') {
      track.setPointerCapture(event.pointerId);
    }
    (thumb === 'low' ? this.lowThumbRef() : this.highThumbRef())?.nativeElement.focus();
    const pair = this.pairFromFraction(fraction, thumb);
    this.lastPointerPair = pair;
    this.valueChange.emit(pair);
  }

  protected onTrackPointerMove(event: PointerEvent): void {
    if (this.draggingPointerId !== event.pointerId || !this.draggingThumb || this.readOnly() || this.disabled()) {
      return;
    }
    const track = this.trackRef()?.nativeElement;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const fraction = rect.width > 0 ? Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) : 0;
    const pair = this.pairFromFraction(fraction, this.draggingThumb);
    this.lastPointerPair = pair;
    this.valueChange.emit(pair);
  }

  protected onTrackPointerUp(event: PointerEvent): void {
    if (this.draggingPointerId !== event.pointerId) return;
    const track = this.trackRef()?.nativeElement;
    if (track && typeof track.releasePointerCapture === 'function') {
      try {
        track.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore if capture already released
      }
    }
    this.draggingPointerId = null;
    this.draggingThumb = null;
    this.committed.emit(this.lastPointerPair ?? this.pair());
    this.lastPointerPair = null;
  }

  protected onThumbKeydown(thumb: 'low' | 'high', event: KeyboardEvent): void {
    if (this.readOnly() || this.disabled()) return;
    const next = resolveRangeThumbKeyValue(
      thumb,
      event.key,
      this.pair(),
      this.min(),
      this.max(),
      this.step(),
      this.minDistance(),
    );
    if (!next) return;
    event.preventDefault();
    this.valueChange.emit(next);
    this.committed.emit(next);
  }

  protected selectMark(markVal: number): void {
    if (this.readOnly() || this.disabled()) return;
    const fraction = sliderValuePercent(markVal, this.min(), this.max()) / 100;
    const thumb = resolveClosestRangeThumb(fraction, this.lowPercent(), this.highPercent());
    const [curLow, curHigh] = this.pair();
    const next = clampRangeSliderPair(
      thumb === 'low' ? markVal : curLow,
      thumb === 'high' ? markVal : curHigh,
      this.min(),
      this.max(),
      this.step(),
      this.minDistance(),
      thumb,
    );
    this.activeThumb.set(thumb);
    this.valueChange.emit(next);
    this.committed.emit(next);
  }

  protected clearValue(): void {
    if (this.readOnly() || this.disabled()) return;
    this.valueChange.emit(null);
    this.committed.emit(null);
    this.cleared.emit();
  }

  private pairFromFraction(fraction: number, thumb: 'low' | 'high'): readonly [number, number] {
    const raw = this.min() + fraction * (this.max() - this.min());
    const [curLow, curHigh] = this.pair();
    return clampRangeSliderPair(
      thumb === 'low' ? raw : curLow,
      thumb === 'high' ? raw : curHigh,
      this.min(),
      this.max(),
      this.step(),
      this.minDistance(),
      thumb,
    );
  }
}

@Component({
  selector: 'emr-masked-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="emr-field">
      @if (label()) {
        <label class="emr-field__label" [class.emr-sr-only]="labelHidden()" [for]="resolvedId()">
          {{ label() }}
          @if (required()) {
            <span class="emr-field__required" aria-hidden="true">*</span>
          }
        </label>
      }
      <div
        class="emr-input-affix"
        [class.emr-input-affix--filled]="variant() === 'filled'"
        [class.emr-input-affix--subtle]="variant() === 'subtle'"
        [class.emr-input-affix--lg]="size() === 'lg'"
        [attr.data-invalid]="isInvalid() ? 'true' : null"
        [attr.data-warning]="!isInvalid() && !!warning() ? 'true' : null"
        [attr.data-readonly]="readOnly() ? 'true' : null"
      >
        <input
          #maskEl
          class="emr-input-affix__field emr-masked-input__field"
          type="text"
          autocomplete="off"
          [id]="resolvedId()"
          [attr.inputmode]="resolvedInputMode()"
          [value]="maskedDisplay()"
          [placeholder]="placeholder() || mask()"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="ariaLabel() || (labelHidden() || !label() ? (label() || mask()) : null)"
          [attr.aria-required]="required() || null"
          [attr.aria-invalid]="isInvalid() || null"
          [attr.aria-describedby]="describedBy()"
          (input)="onInput($event)"
          (keydown)="onKeydown($event)"
          (focus)="focused.emit()"
          (blur)="onBlur()"
        />
        @if (showMaskHint()) {
          <span
            class="emr-masked-input__badge"
            [class.emr-masked-input__badge--complete]="maskState().complete"
            aria-hidden="true"
          >
            {{ mask() }}
          </span>
        }
        @if (showClear()) {
          <button
            type="button"
            class="emr-input-affix__btn"
            data-emr-print="hide"
            [attr.aria-label]="clearLabel() + ' ' + (ariaLabel() || label() || 'value')"
            (click)="clearValue()"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        }
      </div>
      @if (error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">{{ error() }}</span>
      }
      @if (warning()) {
        <span class="emr-field__warning" [id]="resolvedId() + '-warning'" role="status">{{ warning() }}</span>
      }
      @if (hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
    </div>
  `,
})
export class EmrMaskedInputComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly ariaLabel = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly placeholder = input('');
  readonly mask = input.required<string>();
  readonly definitions = input<Readonly<Record<string, string>> | undefined>(undefined);
  readonly uppercase = input(false, { transform: booleanAttribute });
  readonly value = input<string | null>(null);
  readonly unmask = input(false, { transform: booleanAttribute });
  readonly showMaskHint = input(false, { transform: booleanAttribute });
  readonly inputMode = input<'text' | 'numeric' | 'tel' | 'decimal' | undefined>(undefined);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly variant = input<EmrControlVariant>('outline');
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly warning = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly ariaDescribedBy = input<string>();

  readonly valueChange = output<string | null>();
  readonly completed = output<string>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
  readonly submitted = output<string | null>();

  private readonly fallbackId = `emr-masked-${++nextWave2FormattedId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  protected readonly isInvalid = computed(() => Boolean(this.invalid() || this.error()));
  protected readonly maskOptions = computed(() => ({
    uppercase: this.uppercase(),
    definitions: this.definitions(),
  }));
  protected readonly maskState = computed(() =>
    applyInputMask(this.value(), this.mask(), this.maskOptions()),
  );
  protected readonly maskedDisplay = computed(() => this.maskState().masked);
  protected readonly resolvedInputMode = computed(
    () => this.inputMode() ?? inferMaskInputMode(this.mask(), this.definitions()),
  );

  protected readonly showClear = computed(
    () =>
      Boolean(
        this.clearable() &&
          this.maskedDisplay().length > 0 &&
          !this.readOnly() &&
          !this.disabled(),
      ),
  );

  protected readonly describedBy = computed(() => {
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.error()) ids.push(`${id}-error`);
    if (this.warning()) ids.push(`${id}-warning`);
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.ariaDescribedBy()) ids.push(this.ariaDescribedBy()!);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('maskEl');
  private needsDomSync = false;
  private pendingCaret: number | null = null;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    const rawCaret = target.selectionStart ?? target.value.length;
    const edited = editMaskedInputWithCaret(
      this.maskedDisplay(),
      target.value,
      rawCaret,
      this.mask(),
      this.maskOptions(),
    );
    this.pendingCaret = edited.caret;
    if (target.value !== edited.result.masked) {
      target.value = edited.result.masked;
      if (typeof target.setSelectionRange === 'function') {
        target.setSelectionRange(edited.caret, edited.caret);
      }
    }
    this.scheduleDomSync();
    const emitted = this.unmask() ? edited.result.unmasked : edited.result.masked;
    this.valueChange.emit(emitted.length > 0 ? emitted : null);
    if (edited.result.complete && emitted.length > 0) {
      this.completed.emit(emitted);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.readOnly() && !this.disabled()) {
      const emitted = this.unmask() ? this.maskState().unmasked : this.maskState().masked;
      this.submitted.emit(emitted.length > 0 ? emitted : null);
    }
  }

  protected clearValue(): void {
    if (this.readOnly() || this.disabled()) return;
    this.pendingCaret = 0;
    this.scheduleDomSync();
    this.valueChange.emit(null);
    this.cleared.emit();
    this.inputRef()?.nativeElement.focus();
  }

  protected onBlur(): void {
    this.pendingCaret = null;
    this.syncDom();
    this.blurred.emit();
  }

  private scheduleDomSync(): void {
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom();
      }
    });
  }

  private syncDom(): void {
    const el = this.inputRef()?.nativeElement;
    if (!el) return;
    const expected = this.maskedDisplay();
    if (el.value !== expected) {
      el.value = expected;
    }
    if (this.pendingCaret !== null && typeof el.setSelectionRange === 'function') {
      const pos = Math.max(0, Math.min(expected.length, this.pendingCaret));
      el.setSelectionRange(pos, pos);
      this.pendingCaret = null;
    }
  }
}

@Component({
  selector: 'emr-otp-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <fieldset
      class="emr-field emr-choice-fieldset"
      [id]="resolvedId()"
      [disabled]="disabled()"
      [attr.aria-required]="required() || null"
      [attr.aria-invalid]="isInvalid() || null"
      [attr.aria-describedby]="describedBy()"
      (focusin)="onGroupFocusIn()"
      (focusout)="onGroupFocusOut($event)"
    >
      <legend class="emr-field__label" [class.emr-sr-only]="labelHidden()">
        {{ label() || ariaLabel() || 'Verification code' }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </legend>
      <div class="emr-otp-row">
        @for (slot of slots(); track idx; let idx = $index) {
          <input
            #slotInput
            class="emr-otp-slot"
            [class.emr-otp-slot--sm]="size() === 'sm'"
            [class.emr-otp-slot--lg]="size() === 'lg'"
            [class.emr-otp-slot--filled]="variant() === 'filled'"
            [class.emr-otp-slot--subtle]="variant() === 'subtle'"
            [attr.type]="secret() ? 'password' : 'text'"
            [attr.inputmode]="numericOnly() ? 'numeric' : 'text'"
            autocomplete="one-time-code"
            [attr.maxlength]="resolvedLength()"
            [value]="slot"
            [disabled]="disabled()"
            [readOnly]="readOnly()"
            [attr.aria-label]="resolvedAriaLabel() + ' digit ' + (idx + 1) + ' of ' + resolvedLength()"
            [attr.aria-required]="required() || null"
            [attr.aria-readonly]="readOnly() || null"
            [attr.aria-invalid]="isInvalid() || null"
            [attr.data-warning]="!isInvalid() && !!warning() ? 'true' : null"
            [attr.aria-describedby]="describedBy()"
            (input)="onSlotInput(idx, $event)"
            (keydown)="onSlotKeydown(idx, $event)"
            (paste)="onSlotPaste(idx, $event)"
            (blur)="syncDom()"
          />
          @if (hasSeparatorAfter(idx)) {
            <span class="emr-otp-separator" aria-hidden="true">–</span>
          }
        }
        @if (showClear()) {
          <button
            type="button"
            class="emr-button emr-button--outline emr-button--small emr-otp-clear"
            data-emr-print="hide"
            [attr.aria-label]="clearLabel() + ' ' + resolvedAriaLabel()"
            (click)="clearValue()"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        }
      </div>
      @if (error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">{{ error() }}</span>
      }
      @if (warning()) {
        <span class="emr-field__warning" [id]="resolvedId() + '-warning'" role="status">{{ warning() }}</span>
      }
      @if (hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
    </fieldset>
  `,
})
export class EmrOtpInputComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly ariaLabel = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly value = input<string | null>('');
  readonly length = input(6);
  readonly numericOnly = input(true, { transform: booleanAttribute });
  readonly secret = input(false, { transform: booleanAttribute });
  readonly uppercase = input(false, { transform: booleanAttribute });
  readonly separatorAfter = input<number | readonly number[] | undefined>(undefined);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly variant = input<EmrControlVariant>('outline');
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly warning = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly ariaDescribedBy = input<string>();

  readonly valueChange = output<string>();
  readonly completed = output<string>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
  readonly submitted = output<string>();

  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly fallbackId = `emr-otp-${++nextWave2FormattedId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  protected readonly resolvedLength = computed(() => Math.max(1, Math.min(12, Math.floor(this.length()))));
  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel() || this.label() || 'Verification code',
  );
  protected readonly isInvalid = computed(() => Boolean(this.invalid() || this.error()));
  protected readonly slots = computed(() => normalizeOtpSlots(this.value(), this.resolvedLength()));

  protected readonly showClear = computed(
    () =>
      Boolean(
        this.clearable() &&
          !this.readOnly() &&
          !this.disabled() &&
          this.slots().some((s) => s.length > 0),
      ),
  );

  protected readonly describedBy = computed(() => {
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.error()) ids.push(`${id}-error`);
    if (this.warning()) ids.push(`${id}-warning`);
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.ariaDescribedBy()) ids.push(this.ariaDescribedBy()!);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly slotRefs = viewChildren<ElementRef<HTMLInputElement>>('slotInput');
  private needsDomSync = false;
  private groupFocused = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected hasSeparatorAfter(index: number): boolean {
    const sep = this.separatorAfter();
    if (sep === undefined) return false;
    const oneBased = index + 1;
    if (oneBased >= this.resolvedLength()) return false;
    return Array.isArray(sep) ? sep.includes(oneBased) : sep === oneBased;
  }

  protected onGroupFocusIn(): void {
    if (!this.groupFocused) {
      this.groupFocused = true;
      this.focused.emit();
    }
  }

  protected onGroupFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (!related || !this.hostRef.nativeElement.contains(related)) {
      this.groupFocused = false;
      this.blurred.emit();
    }
  }

  protected onSlotInput(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    const prevChar = this.slots()[index] ?? '';
    const typed = extractOtpTypedInput(prevChar, target.value);
    const result = applyOtpSlotEdit(
      this.value(),
      index,
      typed,
      this.resolvedLength(),
      this.numericOnly(),
      { uppercase: this.uppercase() },
    );
    this.scheduleDomSync();
    this.valueChange.emit(result.value);
    if (result.completed) {
      this.completed.emit(result.value);
    }
    if (typed.length > 0) {
      this.focusSlot(result.nextFocusIndex);
    }
  }

  protected onSlotKeydown(index: number, event: KeyboardEvent): void {
    if (this.disabled()) return;
    const maxIdx = this.resolvedLength() - 1;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.focusSlot(Math.max(0, index - 1));
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.focusSlot(Math.min(maxIdx, index + 1));
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      this.focusSlot(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      this.focusSlot(maxIdx);
      return;
    }
    if (event.key === 'Enter' && !this.readOnly()) {
      this.submitted.emit(this.value() ?? '');
      return;
    }
    if ((event.key === 'Backspace' || event.key === 'Delete') && !this.readOnly()) {
      const resolution = resolveOtpClearSlot(this.slots(), index, event.key);
      if (resolution) {
        event.preventDefault();
        const result = applyOtpSlotEdit(
          this.value(),
          resolution.targetIndex,
          '',
          this.resolvedLength(),
          this.numericOnly(),
          { uppercase: this.uppercase() },
        );
        this.scheduleDomSync();
        this.valueChange.emit(result.value);
        this.focusSlot(resolution.nextFocusIndex);
      }
    }
  }

  protected onSlotPaste(index: number, event: ClipboardEvent): void {
    if (this.readOnly() || this.disabled()) return;
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (!pasted) return;
    event.preventDefault();
    const result = applyOtpSlotEdit(
      this.value(),
      index,
      pasted,
      this.resolvedLength(),
      this.numericOnly(),
      { uppercase: this.uppercase() },
    );
    this.scheduleDomSync();
    this.valueChange.emit(result.value);
    if (result.completed) {
      this.completed.emit(result.value);
    }
    this.focusSlot(result.nextFocusIndex);
  }

  protected clearValue(): void {
    if (this.readOnly() || this.disabled()) return;
    this.scheduleDomSync();
    this.valueChange.emit('');
    this.cleared.emit();
    this.focusSlot(0);
  }

  private focusSlot(index: number): void {
    const el = this.slotRefs()[index]?.nativeElement;
    el?.focus();
  }

  private scheduleDomSync(): void {
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom();
      }
    });
  }

  protected syncDom(): void {
    const currentSlots = this.slots();
    const refs = this.slotRefs();
    for (let i = 0; i < refs.length; i += 1) {
      const el = refs[i]!.nativeElement;
      const expected = currentSlots[i] ?? '';
      if (el.value !== expected) el.value = expected;
    }
  }
}
