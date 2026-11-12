import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import type { EmrOption } from '@drguptavivek/emr-controller';
import {
  emptyToNull,
  formatDateTimeEmission,
  parseDateInputDomValue,
  stepNumberValue,
  toDateBoundDomValue,
  toDateInputDomValue,
  toLocalDateTimeInputValue,
} from './emr-inputs.logic';
import { groupOptions } from './emr-wave2.logic';

let nextFieldBaseId = 0;

interface PendingDomSync {
  readonly element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  readonly getCanonical: () => string;
  readonly allowNumericEquivalent?: () => number | null;
}

@Directive()
abstract class EmrSignalFieldBase implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');
  readonly placeholder = input('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });

  private readonly fallbackId = `emr-field-${++nextFieldBaseId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private pendingSyncs: PendingDomSync[] = [];

  ngAfterViewChecked(): void {
    this.flushPendingSyncs(false);
  }

  protected scheduleDomSync(
    element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    getCanonical: () => string,
    allowNumericEquivalent?: () => number | null,
  ): void {
    const sync: PendingDomSync = { element, getCanonical, allowNumericEquivalent };
    this.pendingSyncs = [...this.pendingSyncs.filter((item) => item.element !== element), sync];
    queueMicrotask(() => this.flushPendingSyncs(false));
  }

  protected syncElementNow(
    element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    canonical: string,
  ): void {
    this.pendingSyncs = this.pendingSyncs.filter((item) => item.element !== element);
    if (element.value !== canonical) {
      element.value = canonical;
    }
  }

  private flushPendingSyncs(forceExact: boolean): void {
    if (this.pendingSyncs.length === 0) return;
    const current = this.pendingSyncs;
    this.pendingSyncs = [];
    for (const item of current) {
      const canonical = item.getCanonical();
      if (!forceExact && item.allowNumericEquivalent) {
        const acceptedNum = item.allowNumericEquivalent();
        const raw = item.element.value.trim();
        if (acceptedNum !== null && raw !== '' && Number(raw) === acceptedNum) {
          continue;
        }
      }
      if (item.element.value !== canonical) {
        item.element.value = canonical;
      }
    }
  }
}

@Component({
  selector: 'emr-text-input',
  standalone: true,
  template: `
    <label class="emr-field" [for]="resolvedId()">
      <span class="emr-field__label" [class.emr-sr-only]="labelHidden()">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </span>
      <input
        class="emr-control"
        type="text"
        [id]="resolvedId()"
        [value]="value() ?? ''"
        [placeholder]="placeholder()"
        [required]="required()"
        [disabled]="disabled()"
        [readOnly]="readOnly()"
        [attr.aria-label]="labelHidden() ? (label() || null) : null"
        [attr.aria-invalid]="!!error() || null"
        [attr.aria-describedby]="describedBy()"
        (input)="onInput($event)"
        (blur)="onBlur($event)"
      />
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrTextInputComponent extends EmrSignalFieldBase {
  readonly value = input<string | null>(null);
  readonly valueChange = output<string | null>();
  readonly blurred = output<void>();

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncElementNow(target, this.value() ?? '');
      return;
    }
    const next = emptyToNull(target.value);
    this.scheduleDomSync(target, () => this.value() ?? '');
    this.valueChange.emit(next);
  }

  protected onBlur(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.syncElementNow(target, this.value() ?? '');
    this.blurred.emit();
  }
}

@Component({
  selector: 'emr-number-input',
  standalone: true,
  template: `
    <div class="emr-field">
      <label class="emr-field__label" [class.emr-sr-only]="labelHidden()" [for]="resolvedId()">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </label>
      @if (showSteppers()) {
        <div
          class="emr-input-affix"
          [attr.data-invalid]="!!error() || null"
          [attr.data-readonly]="readOnly() || null"
        >
          <button
            type="button"
            class="emr-input-affix__btn emr-input-affix__btn--leading"
            [disabled]="disabled() || readOnly() || !canDecrement()"
            [attr.aria-label]="'Decrease ' + (label() || 'value')"
            (click)="stepBy(-1)"
          >
            −
          </button>
          <input
            class="emr-input-affix__field"
            [id]="resolvedId()"
            type="number"
            [attr.inputmode]="mode() === 'integer' ? 'numeric' : 'decimal'"
            [attr.step]="effectiveStep()"
            [attr.min]="min() ?? null"
            [attr.max]="max() ?? null"
            [value]="domValue()"
            [placeholder]="placeholder()"
            [required]="required()"
            [disabled]="disabled()"
            [readOnly]="readOnly()"
            [attr.aria-label]="labelHidden() ? (label() || null) : null"
            [attr.aria-invalid]="!!error() || null"
            [attr.aria-describedby]="describedBy()"
            (wheel)="onWheel($event)"
            (input)="onInput($event)"
            (blur)="onBlur($event)"
          />
          @if (unit()) {
            <span class="emr-input-affix__unit" aria-hidden="true">{{ unit() }}</span>
          }
          <button
            type="button"
            class="emr-input-affix__btn"
            [disabled]="disabled() || readOnly() || !canIncrement()"
            [attr.aria-label]="'Increase ' + (label() || 'value')"
            (click)="stepBy(1)"
          >
            +
          </button>
        </div>
      } @else {
        <input
          class="emr-control"
          [id]="resolvedId()"
          type="number"
          [attr.inputmode]="mode() === 'integer' ? 'numeric' : 'decimal'"
          [attr.step]="effectiveStep()"
          [attr.min]="min() ?? null"
          [attr.max]="max() ?? null"
          [value]="domValue()"
          [placeholder]="placeholder()"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="labelHidden() ? (label() || null) : null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (wheel)="onWheel($event)"
          (input)="onInput($event)"
          (blur)="onBlur($event)"
        />
      }
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrNumberInputComponent extends EmrSignalFieldBase {
  readonly mode = input<'integer' | 'decimal'>('decimal');
  readonly value = input<number | null>(null);
  readonly min = input<number>();
  readonly max = input<number>();
  readonly step = input(0.01);
  readonly showSteppers = input(false, { transform: booleanAttribute });
  readonly unit = input('');
  readonly valueChange = output<number | null>();
  readonly blurred = output<void>();

  protected readonly effectiveStep = computed(() =>
    this.mode() === 'integer' ? Math.max(1, Math.round(this.step() >= 1 ? this.step() : 1)) : this.step(),
  );

  protected readonly domValue = computed(() => {
    const v = this.value();
    return v === null || v === undefined || Number.isNaN(v) ? '' : String(v);
  });

  protected readonly canDecrement = computed(() => {
    const min = this.min();
    const cur = this.value();
    if (min === undefined || cur === null || cur === undefined) return true;
    return cur - this.effectiveStep() >= min - 1e-9;
  });

  protected readonly canIncrement = computed(() => {
    const max = this.max();
    const cur = this.value();
    if (max === undefined || cur === null || cur === undefined) return true;
    return cur + this.effectiveStep() <= max + 1e-9;
  });

  protected onWheel(event: WheelEvent): void {
    (event.currentTarget as HTMLInputElement).blur();
  }

  protected stepBy(direction: -1 | 1): void {
    if (this.disabled() || this.readOnly()) return;
    const next = stepNumberValue(this.value(), direction, {
      step: this.effectiveStep(),
      min: this.min(),
      max: this.max(),
      mode: this.mode(),
    });
    this.valueChange.emit(next);
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncElementNow(target, this.domValue());
      return;
    }
    if (target.validity?.badInput) return;
    const raw = target.value.trim();
    if (raw === '') {
      this.scheduleDomSync(target, () => this.domValue(), () => this.value());
      this.valueChange.emit(null);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      this.syncElementNow(target, this.domValue());
      return;
    }
    const normalized = this.mode() === 'integer' ? Math.trunc(parsed) : parsed;
    this.scheduleDomSync(target, () => this.domValue(), () => this.value());
    this.valueChange.emit(normalized);
  }

  protected onBlur(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.syncElementNow(target, this.domValue());
    this.blurred.emit();
  }
}

@Component({
  selector: 'emr-date-input',
  standalone: true,
  template: `
    <label class="emr-field" [for]="resolvedId()">
      <span class="emr-field__label" [class.emr-sr-only]="labelHidden()">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </span>
      @if (precision() === 'year') {
        <input
          class="emr-control"
          [id]="resolvedId()"
          type="number"
          inputmode="numeric"
          step="1"
          [attr.min]="boundMin() ?? '1000'"
          [attr.max]="boundMax() ?? '9999'"
          [value]="domValue()"
          [placeholder]="placeholder() || 'YYYY'"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="labelHidden() ? (label() || null) : null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (wheel)="onWheel($event)"
          (input)="onInput($event)"
          (blur)="onBlur($event)"
        />
      } @else {
        <input
          class="emr-control"
          [id]="resolvedId()"
          [attr.type]="precision() === 'month' ? 'month' : 'date'"
          [value]="domValue()"
          [attr.min]="boundMin()"
          [attr.max]="boundMax()"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="labelHidden() ? (label() || null) : null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (input)="onInput($event)"
          (blur)="onBlur($event)"
        />
      }
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrDateInputComponent extends EmrSignalFieldBase {
  readonly value = input<string | null>(null);
  readonly min = input<string>();
  readonly max = input<string>();
  readonly precision = input<'day' | 'month' | 'year'>('day');
  readonly valueChange = output<string | null>();
  readonly blurred = output<void>();

  protected readonly domValue = computed(() => toDateInputDomValue(this.value(), this.precision()));
  protected readonly boundMin = computed(() => toDateBoundDomValue(this.min(), this.precision()));
  protected readonly boundMax = computed(() => toDateBoundDomValue(this.max(), this.precision()));

  protected onWheel(event: WheelEvent): void {
    (event.currentTarget as HTMLInputElement).blur();
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncElementNow(target, this.domValue());
      return;
    }
    const parsed = parseDateInputDomValue(target.value, this.precision());
    if (parsed === undefined) {
      return;
    }
    this.scheduleDomSync(target, () => this.domValue());
    this.valueChange.emit(parsed);
  }

  protected onBlur(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.syncElementNow(target, this.domValue());
    this.blurred.emit();
  }
}

/** Native time-of-day control. Value is `'HH:mm'` (or `'HH:mm:ss'` when `step` is under 60) or `null`. */
@Component({
  selector: 'emr-time-input',
  standalone: true,
  template: `
    <label class="emr-field" [for]="resolvedId()">
      <span class="emr-field__label" [class.emr-sr-only]="labelHidden()">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </span>
      <input
        class="emr-control"
        [id]="resolvedId()"
        type="time"
        [value]="value() ?? ''"
        [attr.min]="min() ?? null"
        [attr.max]="max() ?? null"
        [attr.step]="step() ?? null"
        [required]="required()"
        [disabled]="disabled()"
        [readOnly]="readOnly()"
        [attr.aria-label]="labelHidden() ? (label() || null) : null"
        [attr.aria-invalid]="!!error() || null"
        [attr.aria-describedby]="describedBy()"
        (input)="onInput($event)"
        (blur)="onBlur($event)"
      />
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrTimeInputComponent extends EmrSignalFieldBase {
  readonly value = input<string | null>(null);
  readonly min = input<string>();
  readonly max = input<string>();
  /** Granularity in seconds, forwarded to the native `step`. Browser default is 60. */
  readonly step = input<number>();
  /** Empty input clears to `null`, never `''`, so "not entered" stays distinct from a value. */
  readonly valueChange = output<string | null>();
  readonly blurred = output<void>();

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncElementNow(target, this.value() ?? '');
      return;
    }
    const next = emptyToNull(target.value);
    this.scheduleDomSync(target, () => this.value() ?? '');
    this.valueChange.emit(next);
  }

  protected onBlur(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.syncElementNow(target, this.value() ?? '');
    this.blurred.emit();
  }
}

/**
 * Controlled date-and-time primitive.
 * Projects UTC/offset ISO-8601 instants (`'2026-10-14T09:30:00Z'`) or zone-less local strings
 * (`'2026-03-14T10:25'`) into native `datetime-local`, emitting canonical UTC ISO-8601 (`wireFormat='utc'`)
 * or local wall-clock (`wireFormat='local'`) strings, and `null` when cleared.
 */
@Component({
  selector: 'emr-datetime-input',
  standalone: true,
  template: `
    <label class="emr-field" [for]="resolvedId()">
      <span class="emr-field__label" [class.emr-sr-only]="labelHidden()">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </span>
      <input
        class="emr-control"
        [id]="resolvedId()"
        type="datetime-local"
        [value]="domValue()"
        [attr.min]="boundMin()"
        [attr.max]="boundMax()"
        [attr.step]="precision() === 'second' ? 1 : null"
        [required]="required()"
        [disabled]="disabled()"
        [readOnly]="readOnly()"
        [attr.aria-label]="labelHidden() ? (label() || null) : null"
        [attr.aria-invalid]="!!error() || null"
        [attr.aria-describedby]="describedBy()"
        (input)="onInput($event)"
        (blur)="onBlur($event)"
      />
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrDateTimeInputComponent extends EmrSignalFieldBase {
  readonly value = input<string | null>(null);
  readonly min = input<string>();
  readonly max = input<string>();
  readonly wireFormat = input<'utc' | 'local'>('utc');
  readonly precision = input<'minute' | 'second'>('minute');
  readonly valueChange = output<string | null>();
  readonly blurred = output<void>();

  protected readonly domValue = computed(() =>
    toLocalDateTimeInputValue(this.value(), this.precision()),
  );
  protected readonly boundMin = computed(
    () => toLocalDateTimeInputValue(this.min(), this.precision()) || null,
  );
  protected readonly boundMax = computed(
    () => toLocalDateTimeInputValue(this.max(), this.precision()) || null,
  );

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncElementNow(target, this.domValue());
      return;
    }
    const next = formatDateTimeEmission(target.value, this.wireFormat(), this.precision());
    this.scheduleDomSync(target, () => this.domValue());
    this.valueChange.emit(next);
  }

  protected onBlur(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.syncElementNow(target, this.domValue());
    this.blurred.emit();
  }
}

@Component({
  selector: 'emr-select',
  standalone: true,
  template: `
    <div class="emr-field">
      <div [class.emr-choice-header]="showClear()">
        <label class="emr-field__label" [class.emr-sr-only]="labelHidden()" [for]="resolvedId()">
          {{ label() }}
          @if (required()) {
            <span class="emr-field__required" aria-hidden="true">*</span>
          }
        </label>
        @if (showClear()) {
          <button
            type="button"
            class="emr-choice-clear"
            [attr.aria-label]="'Clear ' + (label() || 'selection')"
            (click)="clearSelection()"
          >
            Clear
          </button>
        }
      </div>
      <select
        #selectEl
        class="emr-select"
        [id]="resolvedId()"
        [value]="value() ?? ''"
        [disabled]="disabled()"
        [required]="required()"
        [attr.aria-label]="labelHidden() ? (label() || null) : null"
        [attr.aria-readonly]="readOnly() || null"
        [attr.aria-invalid]="!!error() || null"
        [attr.aria-describedby]="describedBy()"
        (change)="onSelectChange($event)"
        (blur)="onBlur($event)"
      >
        @if (placeholder() || !value()) {
          <option value="" [selected]="!value()">{{ placeholder() }}</option>
        }
        @for (grp of optionGroups(); track grp.label ?? '__ungrouped__') {
          @if (grp.label !== null) {
            <optgroup [label]="grp.label">
              @for (option of grp.options; track option.value) {
                <option
                  [value]="option.value"
                  [selected]="option.value === value()"
                  [disabled]="option.disabled"
                >
                  {{ option.label }}
                </option>
              }
            </optgroup>
          } @else {
            @for (option of grp.options; track option.value) {
              <option
                [value]="option.value"
                [selected]="option.value === value()"
                [disabled]="option.disabled"
              >
                {{ option.label }}
              </option>
            }
          }
        }
      </select>
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrSelectComponent extends EmrSignalFieldBase {
  readonly value = input<string | null>(null);
  readonly options = input<readonly EmrOption[]>([]);
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string | null>();
  readonly cleared = output<void>();
  readonly blurred = output<void>();

  private readonly selectRef = viewChild<ElementRef<HTMLSelectElement>>('selectEl');

  protected readonly optionGroups = computed(() => groupOptions(this.options()));
  protected readonly showClear = computed(
    () => Boolean(this.clearable() && this.value() && !this.readOnly() && !this.disabled()),
  );

  /** `<select>` has no native readonly: keep it focusable/announceable, but revert any change. */
  protected onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (this.readOnly() || this.disabled()) {
      this.syncElementNow(target, this.value() ?? '');
      return;
    }
    const next = emptyToNull(target.value);
    this.scheduleDomSync(target, () => this.value() ?? '');
    this.valueChange.emit(next);
  }

  protected clearSelection(): void {
    if (this.readOnly() || this.disabled()) return;
    const el = this.selectRef()?.nativeElement;
    if (el) {
      this.scheduleDomSync(el, () => this.value() ?? '');
    }
    this.valueChange.emit(null);
    this.cleared.emit();
  }

  protected onBlur(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.syncElementNow(target, this.value() ?? '');
    this.blurred.emit();
  }
}

@Component({
  selector: 'emr-quantity-input',
  standalone: true,
  template: `
    <div class="emr-field">
      <label
        class="emr-field__label"
        [class.emr-sr-only]="labelHidden()"
        [for]="resolvedId() + '-value'"
      >
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </label>
      <div class="emr-quantity">
        <input
          class="emr-control"
          [id]="resolvedId() + '-value'"
          type="number"
          inputmode="decimal"
          [attr.min]="min() ?? null"
          [attr.max]="max() ?? null"
          [attr.step]="step() ?? null"
          [value]="domValue()"
          [placeholder]="placeholder()"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="(label() || 'Quantity') + ' value'"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (wheel)="onWheel($event)"
          (input)="emitQuantityValue($event)"
          (blur)="onValueBlur($event)"
        />
        <select
          class="emr-select"
          [id]="resolvedId() + '-unit'"
          [value]="unit() ?? ''"
          [disabled]="disabled()"
          [attr.aria-readonly]="readOnly() || null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-label]="(label() || 'Quantity') + ' unit'"
          [attr.aria-describedby]="describedBy()"
          (change)="emitUnit($event)"
          (blur)="onUnitBlur($event)"
        >
          @if (!unit()) {
            <option value="" selected></option>
          }
          @for (option of units(); track option.value) {
            <option
              [value]="option.value"
              [selected]="option.value === unit()"
              [disabled]="option.disabled"
            >
              {{ option.label }}
            </option>
          }
        </select>
      </div>
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrQuantityInputComponent extends EmrSignalFieldBase {
  readonly value = input<number | null>(null);
  readonly unit = input<string | null>(null);
  readonly units = input<readonly EmrOption[]>([]);
  readonly min = input<number>();
  readonly max = input<number>();
  readonly step = input<number>();
  readonly valueChange = output<number | null>();
  readonly unitChange = output<string | null>();
  readonly blurred = output<void>();

  protected readonly domValue = computed(() => {
    const v = this.value();
    return v === null || v === undefined || Number.isNaN(v) ? '' : String(v);
  });

  protected onWheel(event: WheelEvent): void {
    (event.currentTarget as HTMLInputElement).blur();
  }

  protected emitQuantityValue(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncElementNow(target, this.domValue());
      return;
    }
    if (target.validity?.badInput) return;
    const raw = target.value.trim();
    const next = raw === '' ? null : Number(raw);
    if (next !== null && !Number.isFinite(next)) {
      this.syncElementNow(target, this.domValue());
      return;
    }
    this.scheduleDomSync(target, () => this.domValue(), () => this.value());
    this.valueChange.emit(next);
  }

  protected onValueBlur(event: Event): void {
    this.syncElementNow(event.target as HTMLInputElement, this.domValue());
    this.blurred.emit();
  }

  protected emitUnit(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (this.readOnly() || this.disabled()) {
      this.syncElementNow(target, this.unit() ?? '');
      return;
    }
    const next = emptyToNull(target.value);
    this.scheduleDomSync(target, () => this.unit() ?? '');
    this.unitChange.emit(next);
  }

  protected onUnitBlur(event: Event): void {
    this.syncElementNow(event.target as HTMLSelectElement, this.unit() ?? '');
    this.blurred.emit();
  }
}

@Component({
  selector: 'emr-paired-input',
  standalone: true,
  template: `
    <div class="emr-field">
      <label
        class="emr-field__label"
        [class.emr-sr-only]="labelHidden()"
        [for]="resolvedId() + '-first'"
      >
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </label>
      <div class="emr-paired-control">
        <span class="emr-paired-control__prefix" aria-hidden="true">{{ firstLabel() }}</span>
        <input
          class="emr-control"
          [id]="resolvedId() + '-first'"
          [value]="firstValue() ?? ''"
          [placeholder]="placeholder()"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="(label() ? label() + ', ' : '') + firstLabel()"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (input)="onFirstInput($event)"
          (blur)="onFirstBlur($event)"
        />
        <span class="emr-field-row__separator" aria-hidden="true">{{ separator() }}</span>
        <span class="emr-paired-control__prefix" aria-hidden="true">{{ secondLabel() }}</span>
        <input
          class="emr-control"
          [id]="resolvedId() + '-second'"
          [value]="secondValue() ?? ''"
          [placeholder]="placeholder()"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="(label() ? label() + ', ' : '') + secondLabel()"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (input)="onSecondInput($event)"
          (blur)="onSecondBlur($event)"
        />
      </div>
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrPairedInputComponent extends EmrSignalFieldBase {
  readonly firstLabel = input('First');
  readonly secondLabel = input('Second');
  readonly firstValue = input<string | null>(null);
  readonly secondValue = input<string | null>(null);
  readonly separator = input('/');
  readonly firstValueChange = output<string | null>();
  readonly secondValueChange = output<string | null>();
  readonly blurred = output<void>();

  protected onFirstInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncElementNow(target, this.firstValue() ?? '');
      return;
    }
    const next = emptyToNull(target.value);
    this.scheduleDomSync(target, () => this.firstValue() ?? '');
    this.firstValueChange.emit(next);
  }

  protected onSecondInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncElementNow(target, this.secondValue() ?? '');
      return;
    }
    const next = emptyToNull(target.value);
    this.scheduleDomSync(target, () => this.secondValue() ?? '');
    this.secondValueChange.emit(next);
  }

  protected onFirstBlur(event: Event): void {
    this.syncElementNow(event.target as HTMLInputElement, this.firstValue() ?? '');
    this.blurred.emit();
  }

  protected onSecondBlur(event: Event): void {
    this.syncElementNow(event.target as HTMLInputElement, this.secondValue() ?? '');
    this.blurred.emit();
  }
}
