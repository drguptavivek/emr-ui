import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import type { EmrTone, EmrVasAnchor, EmrVasAnchorsProp, EmrVasOrientation, EmrVasPrecision, EmrVasSize } from '@drguptavivek/emr-controller';
import {
  EMR_VAS_TRACK_INSET_PX,
  canMutateVas,
  formatVasValue,
  resolveVasAnchors,
  resolveVasKeyValue,
  resolveVasStep,
  resolveVasTicks,
  snapVasValue,
  vasPercent,
  vasValueFromOffset,
} from './emr-vas.logic';

export type { EmrVasAnchor };

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
      [class.emr-vas--sm]="size() === 'sm'"
      [class.emr-vas--lg]="size() === 'lg'"
      [class.emr-vas--invalid]="isInvalid()"
      [class.emr-vas--warning]="!isInvalid() && !!warning()"
      [attr.data-tone]="tone() ?? null"
    >
      <div class="emr-vas__header">
        <span class="emr-vas__label" [class.emr-sr-only]="labelHidden()" [id]="labelId()">
          {{ label() }}
          @if (required()) {
            <span class="emr-vas__required" aria-hidden="true">*</span>
            <span class="emr-sr-only">Required</span>
          }
        </span>
        <div class="emr-vas__header-actions">
          @if (showValue()) {
            <span class="emr-vas__value-badge" [class.emr-vas__value-badge--unmarked]="value() === null || value() === undefined">
              {{ formattedValue() }}
            </span>
          }
          @if (showClear()) {
            <button
              type="button"
              class="emr-choice-clear emr-vas__clear"
              [attr.aria-label]="'Clear ' + (ariaLabel() || label() || 'selection')"
              (click)="clearSelection()"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              <span>{{ clearLabel() }}</span>
            </button>
          }
        </div>
      </div>

      <div class="emr-vas__frame">
        <div
          class="emr-vas__track"
          [id]="resolvedId()"
          role="slider"
          [attr.tabindex]="disabled() ? null : 0"
          [attr.aria-orientation]="orientation()"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-labelledby]="ariaLabel() ? null : (ariaLabelledBy() || labelId())"
          [attr.aria-describedby]="describedBy()"
          [attr.aria-required]="required() ? 'true' : null"
          [attr.aria-valuemin]="min()"
          [attr.aria-valuemax]="max()"
          [attr.aria-valuenow]="value() ?? null"
          [attr.aria-valuetext]="valueText() ?? null"
          [attr.aria-readonly]="readOnly() || null"
          [attr.aria-disabled]="disabled() || null"
          [attr.aria-invalid]="isInvalid() ? 'true' : null"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerUp($event)"
          (pointercancel)="onPointerUp($event)"
          (keydown)="onKeyDown($event)"
          (focus)="focused.emit()"
          (blur)="blurred.emit()"
        >
          <div class="emr-vas__ruler">
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
              <span class="emr-vas__thumb" [style.--emr-vas-pos.%]="percent()" aria-hidden="true">{{ formattedValue() }}</span>
            }
          </div>
        </div>

        @if (resolvedAnchors().minLabel || resolvedAnchors().midLabel || resolvedAnchors().maxLabel) {
          <div class="emr-vas__anchors" aria-hidden="true">
            <span class="emr-vas__anchor emr-vas__anchor--max">{{ resolvedAnchors().maxLabel }}</span>
            @if (resolvedAnchors().midLabel) {
              <span class="emr-vas__anchor emr-vas__anchor--mid">{{ resolvedAnchors().midLabel }}</span>
            }
            <span class="emr-vas__anchor emr-vas__anchor--min">{{ resolvedAnchors().minLabel }}</span>
          </div>
        }
      </div>

      @if (!labelHidden()) {
        <div class="emr-vas__messages" aria-live="polite">
          @if (error()) {
            <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
          } @else if (warning()) {
            <span class="emr-field__warning" [id]="resolvedId() + '-warning'">{{ warning() }}</span>
          } @else if (hint()) {
            <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
          }
        </div>
      }
    </div>
  `,
})
export class EmrVasComponent {
  readonly controlId = input<string | undefined>(undefined);
  readonly label = input<string>('');
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly labelHidden = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly ariaLabelledBy = input<string | undefined>(undefined);
  readonly ariaDescribedBy = input<string | undefined>(undefined);
  readonly hint = input<string | undefined>(undefined);
  readonly warning = input<string | undefined>(undefined);
  readonly error = input<string | undefined>(undefined);
  readonly invalid = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly min = input<number>(0);
  readonly max = input<number>(100);
  readonly value = input<number | null>(null);
  /** Snap granularity. `0` records the raw continuous position. */
  readonly step = input<number | undefined>(undefined);
  readonly precision = input<EmrVasPrecision>('integer');
  /** Labelled marker interval — the numbers printed along the ruler. */
  readonly majorInterval = input<number>(10);
  /** Unlabelled marker interval between the major ones. */
  readonly minorInterval = input<number | undefined>(undefined);
  readonly orientation = input<EmrVasOrientation>('horizontal');
  readonly size = input<EmrVasSize>('md');
  readonly anchors = input<EmrVasAnchorsProp>([]);
  readonly showValue = input<boolean, unknown>(true, { transform: booleanAttribute });
  readonly unmarkedLabel = input<string>('Unmarked');
  readonly clearable = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly clearLabel = input<string>('Clear');
  readonly readOnly = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly required = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Controller-supplied tone for the recorded mark. The primitive derives no severity. */
  readonly tone = input<EmrTone | undefined>(undefined);
  /** Controller-supplied spoken value (`aria-valuetext`), e.g. "72 out of 100". */
  readonly valueText = input<string | undefined>(undefined);

  readonly valueChange = output<number | null>();
  readonly committed = output<number | null>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-vas-${++nextVasId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly resolvedStep = computed(() =>
    resolveVasStep(this.min(), this.max(), this.step(), this.precision()),
  );
  protected readonly isInvalid = computed(() => Boolean(this.invalid() || this.error()));

  protected readonly showClear = computed(
    () =>
      Boolean(
        this.clearable() &&
          this.value() !== null &&
          this.value() !== undefined &&
          canMutateVas(this.disabled(), this.readOnly()),
      ),
  );

  protected readonly formattedValue = computed(() =>
    formatVasValue(this.value(), this.resolvedStep(), this.unmarkedLabel()),
  );

  protected clearSelection(): void {
    if (!this.interactive()) return;
    this.valueChange.emit(null);
    this.committed.emit(null);
    this.cleared.emit();
  }

  protected readonly labelId = computed(() => `${this.resolvedId()}-label`);

  protected readonly describedBy = computed(() => {
    const ext = this.ariaDescribedBy();
    if (this.labelHidden()) return ext || null;
    if (this.error()) return `${this.resolvedId()}-error`;
    if (this.warning()) return `${this.resolvedId()}-warning`;
    if (this.hint()) return `${this.resolvedId()}-hint`;
    return ext || null;
  });

  protected readonly percent = computed(() => {
    const value = this.value();
    return value === null || value === undefined ? null : vasPercent(value, this.min(), this.max());
  });

  protected readonly resolvedAnchors = computed(() =>
    resolveVasAnchors(this.anchors(), this.min(), this.max()),
  );

  protected readonly ticks = computed(() => {
    const span = Math.abs(this.max() - this.min());
    const effMinor = this.minorInterval() ?? (this.precision() === 'integer' && span <= 20 ? 1 : span <= 20 ? 0.5 : 2);
    return resolveVasTicks(this.min(), this.max(), this.majorInterval(), effMinor);
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
      if (this.interactive()) {
        this.committed.emit(this.value());
      }
    }
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (!this.interactive()) return;
    const next = resolveVasKeyValue(event.key, this.value(), {
      min: this.min(),
      max: this.max(),
      step: this.resolvedStep(),
      majorInterval: this.majorInterval(),
    });
    if (next === null) return;
    event.preventDefault();
    this.emit(next, true);
  }

  private interactive(): boolean {
    return canMutateVas(this.disabled(), this.readOnly());
  }

  private emitFromPointer(event: PointerEvent, target: HTMLElement): void {
    const rect = target.getBoundingClientRect();
    const isVert = this.orientation() === 'vertical';
    const offset = isVert ? event.clientY - rect.top : event.clientX - rect.left;
    const length = isVert ? rect.height : rect.width;
    const next = vasValueFromOffset(
      offset,
      length,
      this.min(),
      this.max(),
      this.resolvedStep(),
      isVert,
      EMR_VAS_TRACK_INSET_PX,
    );
    this.emit(next);
  }

  private emit(raw: number, commit = false): void {
    const next = snapVasValue(raw, this.min(), this.max(), this.resolvedStep());
    if (next !== this.value()) {
      this.valueChange.emit(next);
    }
    if (commit) {
      this.committed.emit(next);
    }
  }
}
