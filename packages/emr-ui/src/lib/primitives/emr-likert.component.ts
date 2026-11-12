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
  viewChildren,
} from '@angular/core';
import type { EmrTone } from '@drguptavivek/emr-controller';

/**
 * Controlled Likert / numeric rating scale.
 *
 * Uses native <fieldset role="radiogroup">/<legend> for accessible radiogroup semantics
 * without invalid aria-required/aria-readonly attributes on inner generic <div> wrappers.
 */
export interface EmrLikertAnchor {
  /** Value this label is anchored to (typically `min` or `max`). */
  value: number;
  label: string;
  /** Short description read by screen readers in place of the numeric label. */
  assistiveLabel?: string;
}

@Component({
  selector: 'emr-likert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <fieldset
      class="emr-likert"
      role="radiogroup"
      [id]="resolvedId()"
      [disabled]="disabled()"
      [attr.aria-required]="required() || null"
      [attr.aria-invalid]="error() ? 'true' : null"
      [attr.aria-describedby]="describedBy()"
    >
      <legend class="emr-likert__legend" [class.emr-sr-only]="labelHidden()">
        {{ label() }}
        @if (required()) {
          <span class="emr-likert__required" aria-hidden="true">*</span>
          <span class="emr-sr-only">Required</span>
        }
      </legend>

      @if (showClear()) {
        <div class="emr-choice-header">
          <button
            type="button"
            class="emr-choice-clear"
            [attr.aria-label]="'Clear ' + (label() || 'selection')"
            (click)="clearSelection()"
          >
            {{ clearLabel() }}
          </button>
        </div>
      }

      <div class="emr-likert__track">
        @for (point of points(); track point) {
          <label
            class="emr-likert__option"
            [class.emr-likert__option--selected]="value() === point"
            [attr.data-tone]="value() === point ? (toneFor(point) ?? null) : null"
          >
            <input
              #radioInput
              type="radio"
              class="emr-sr-only"
              [name]="resolvedName()"
              [value]="point"
              [checked]="value() === point"
              [disabled]="disabled()"
              [attr.aria-readonly]="readOnly() || null"
              [attr.aria-label]="ariaLabelFor(point)"
              (click)="onClick($event)"
              (change)="onSelect(point)"
            />
            <span class="emr-likert__pip" aria-hidden="true">{{ point }}</span>
          </label>
        }
      </div>

      @if (!disabled() && (minAnchor() || maxAnchor())) {
        <div class="emr-likert__anchors" aria-hidden="true">
          <span class="emr-likert__anchor">{{ minAnchor()?.label }}</span>
          <span class="emr-likert__anchor">{{ maxAnchor()?.label }}</span>
        </div>
      }

      @if (!labelHidden()) {
        <div class="emr-likert__messages" aria-live="polite">
          @if (error()) {
            <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
          } @else if (!disabled() && hint()) {
            <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
          }
        </div>
      }
    </fieldset>
  `,
})
export class EmrLikertComponent implements AfterViewChecked {
  static _idSeq = 0;

  readonly controlId = input<string>();
  /** Radio-group name. Defaults to a per-instance id so two likerts never share a native group. */
  readonly name = input('');
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly min = input(0);
  readonly max = input(10);
  readonly value = input<number | null>(null);
  readonly anchors = input<readonly EmrLikertAnchor[]>([]);
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  /** Controller-supplied tone for the selected pip. Absent -> neutral selection styling. */
  readonly tone = input<EmrTone>();
  /** Optional per-score tone lookup supplied by the controller. */
  readonly optionTones = input<Readonly<Record<number, EmrTone>>>();

  readonly valueChange = output<number | null>();
  readonly cleared = output<void>();

  readonly groupId = `emr-likert-${++EmrLikertComponent._idSeq}`;
  readonly resolvedId = computed(() => this.controlId() || this.groupId);
  readonly resolvedName = computed(() => this.name() || this.resolvedId());

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

  readonly points = computed<readonly number[]>(() => {
    const pts: number[] = [];
    const lo = this.min();
    const hi = this.max();
    for (let i = lo; i <= hi; i++) pts.push(i);
    return pts;
  });

  readonly minAnchor = computed(() => this.anchors().find((a) => a.value === this.min()));
  readonly maxAnchor = computed(() => this.anchors().find((a) => a.value === this.max()));

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    if (this.error()) return `${this.resolvedId()}-error`;
    if (!this.disabled() && this.hint()) return `${this.resolvedId()}-hint`;
    return null;
  });

  private readonly radioRefs = viewChildren<ElementRef<HTMLInputElement>>('radioInput');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncRadios();
    }
  }

  protected toneFor(point: number): EmrTone | undefined {
    return this.optionTones()?.[point] ?? this.tone();
  }

  protected ariaLabelFor(point: number): string {
    const anchor = this.anchors().find((a) => a.value === point);
    const base = anchor?.assistiveLabel ?? anchor?.label ?? String(point);
    return `${point} – ${base}`;
  }

  /** Read-only keeps the control focusable and announceable, but blocks the native toggle. */
  protected onClick(event: Event): void {
    if (this.readOnly() || this.disabled()) {
      event.preventDefault();
      this.syncRadios();
    }
  }

  protected onSelect(point: number): void {
    if (this.disabled() || this.readOnly()) {
      this.syncRadios();
      return;
    }
    this.scheduleRadioSync();
    this.valueChange.emit(point);
  }

  protected clearSelection(): void {
    if (this.disabled() || this.readOnly()) return;
    this.scheduleRadioSync();
    this.valueChange.emit(null);
    this.cleared.emit();
  }

  private scheduleRadioSync(): void {
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncRadios();
      }
    });
  }

  protected syncRadios(): void {
    const active = this.value();
    for (const ref of this.radioRefs()) {
      const el = ref.nativeElement;
      const shouldCheck = active !== null && active !== undefined && Number(el.value) === active;
      if (el.checked !== shouldCheck) el.checked = shouldCheck;
    }
  }
}
