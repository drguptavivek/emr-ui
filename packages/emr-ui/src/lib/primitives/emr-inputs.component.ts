import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type {
  EmrBadge,
  EmrDateTimeDisplayFormat,
  EmrDateTimeHourCycle,
  EmrDateTimePrecision,
  EmrDateTimeSize,
  EmrDateTimeWireFormat,
  EmrOption,
  EmrQuantityNumericMode,
  EmrQuantitySize,
  EmrSelectSize,
  EmrSelectValue,
  EmrSelectVariant,
  EmrTimeHourCycle,
  EmrTimePrecision,
  EmrTimeSize,
  EmrTone,
} from '@drguptavivek/emr-controller';
import {
  emptyToNull,
  formatDateTimeEmission,
  formatIsoDateDisplay,
  formatTimeDisplay,
  isDateTimeOutOfBounds,
  isTimeOutOfBounds,
  joinDateTimeParts,
  parseDateDisplayText,
  parseDateInputDomValue,
  parseQuantityDraft,
  parseTimeText,
  resolveQuantityStep,
  resolveTimePlaceholder,
  sanitizeDateDisplayText,
  sanitizeQuantityText,
  sanitizeTimeText,
  splitDateTimeParts,
  stepNumberValue,
  toDateBoundDomValue,
  toDateInputDomValue,
  toLocalDateTimeInputValue,
} from './emr-inputs.logic';
import {
  buildEmrSelectTriggerSummary,
  clearEmrSelectValue,
  findNextEnabledEmrSelectOptionIndex,
  findTypeaheadEmrSelectOptionIndex,
  groupOptions,
  isEmrSelectClearable,
  isEmrSelectOptionBlockedByMax,
  normalizeEmrSelectMultiValue,
  normalizeEmrSelectSingleValue,
  removeEmrSelectChip,
  resolveEmrSelectCloseOnSelect,
  toggleEmrSelectOption,
} from './emr-wave2.logic';

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
      @if (prefix() || suffix() || clearable()) {
        <div
          class="emr-input-affix"
          [attr.data-invalid]="!!error() || null"
          [attr.data-readonly]="readOnly() || null"
        >
          @if (prefix()) {
            <span class="emr-input-affix__unit emr-input-affix__btn--leading" aria-hidden="true">{{ prefix() }}</span>
          }
          <input
            class="emr-input-affix__field"
            [type]="type()"
            [id]="resolvedId()"
            [value]="value() ?? ''"
            [placeholder]="placeholder()"
            [attr.maxlength]="maxLength() ?? null"
            [attr.autocomplete]="autocomplete() || null"
            [required]="required()"
            [disabled]="disabled()"
            [readOnly]="readOnly()"
            [attr.aria-label]="labelHidden() ? (label() || null) : null"
            [attr.aria-invalid]="!!error() || null"
            [attr.aria-describedby]="describedBy()"
            (input)="onInput($event)"
            (focus)="focused.emit()"
            (blur)="onBlur($event)"
            (keydown.enter)="submitted.emit()"
          />
          @if (clearable() && value() && !readOnly() && !disabled()) {
            <button
              type="button"
              class="emr-input-affix__btn"
              aria-label="Clear"
              (click)="onClear()"
            >
              ×
            </button>
          }
          @if (suffix()) {
            <span class="emr-input-affix__unit" aria-hidden="true">{{ suffix() }}</span>
          }
        </div>
      } @else {
        <input
          class="emr-control"
          [type]="type()"
          [id]="resolvedId()"
          [value]="value() ?? ''"
          [placeholder]="placeholder()"
          [attr.maxlength]="maxLength() ?? null"
          [attr.autocomplete]="autocomplete() || null"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="labelHidden() ? (label() || null) : null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (input)="onInput($event)"
          (focus)="focused.emit()"
          (blur)="onBlur($event)"
          (keydown.enter)="submitted.emit()"
        />
      }
      @if (!labelHidden() && showCount() && maxLength()) {
        <span class="emr-field__hint">{{ (value() ?? '').length }} / {{ maxLength() }}</span>
      }
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && warning()) {
        <span class="emr-field__warning" role="status">{{ warning() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" role="alert" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrTextInputComponent extends EmrSignalFieldBase {
  readonly value = input<string | null>(null);
  readonly type = input<'text' | 'email' | 'tel' | 'url'>('text');
  readonly maxLength = input<number>();
  readonly showCount = input(false, { transform: booleanAttribute });
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly prefix = input('');
  readonly suffix = input('');
  readonly autocomplete = input('');
  readonly warning = input('');
  readonly valueChange = output<string | null>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
  readonly submitted = output<void>();

  protected onClear(): void {
    if (this.readOnly() || this.disabled()) return;
    this.valueChange.emit(null);
    this.cleared.emit();
  }

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
        <div class="emr-number-stepper-row">
          <div
            class="emr-input-affix emr-input-affix--compact"
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
              class="emr-input-affix__field emr-input-affix__field--centered"
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
          @if (unit()) {
            <span class="emr-number-stepper-row__unit" aria-hidden="true">{{ unit() }}</span>
          }
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

/** Controlled time-of-day input. Wire value is always 24-hour `'HH:mm'` (or `'HH:mm:ss'`) or `null`. */
@Component({
  selector: 'emr-time-input',
  standalone: true,
  template: `
    <label
      class="emr-field emr-time-input"
      [class.emr-time-input--sm]="size() === 'sm'"
      [class.emr-time-input--lg]="size() === 'lg'"
      [class.emr-time-input--invalid]="isInvalid()"
      [class.emr-time-input--warning]="!isInvalid() && !!warning()"
      [class.emr-time-input--readonly]="readOnly()"
      [class.emr-time-input--disabled]="disabled()"
      [for]="resolvedId()"
    >
      <span class="emr-field__label" [class.emr-sr-only]="labelHidden()">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </span>
      <div class="emr-time-input__wrap" [style.max-width.px]="containerMaxWidth()">
        <input
          #textInput
          class="emr-time-input__field"
          [id]="resolvedId()"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          [value]="displayedText()"
          [placeholder]="resolvedPlaceholder()"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="ariaLabel() || (labelHidden() ? (label() || null) : null)"
          [attr.aria-required]="required() || null"
          [attr.aria-readonly]="readOnly() || null"
          [attr.aria-invalid]="isInvalid() ? 'true' : null"
          [attr.aria-describedby]="timeDescribedBy()"
          (focus)="onFocus()"
          (input)="onInput($event)"
          (blur)="onBlur($event)"
          (keydown.enter)="onEnter()"
        />
        @if (showClear()) {
          <button
            type="button"
            class="emr-time-input__clear"
            [attr.aria-label]="'Clear ' + (ariaLabel() || label() || 'time')"
            (click)="onClear($event)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        }
        <span class="emr-time-input__picker-btn" [class.emr-time-input__picker-btn--disabled]="disabled() || readOnly()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          @if (!disabled() && !readOnly()) {
            <input
              type="time"
              class="emr-time-input__native-picker"
              tabindex="-1"
              aria-hidden="true"
              [value]="value() ?? ''"
              [attr.min]="min() ?? null"
              [attr.max]="max() ?? null"
              [attr.step]="resolvedStep()"
              (change)="onNativePick($event)"
            />
          }
        </span>
      </div>
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">{{ error() }}</span>
      } @else if (!labelHidden() && warning()) {
        <span class="emr-field__warning" [id]="resolvedId() + '-warning'" role="status">{{ warning() }}</span>
      } @else if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrTimeInputComponent extends EmrSignalFieldBase {
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly value = input<string | null>(null);
  readonly precision = input<EmrTimePrecision>('minute');
  readonly hourCycle = input<EmrTimeHourCycle>('24');
  readonly min = input<string | undefined>(undefined);
  readonly max = input<string | undefined>(undefined);
  readonly step = input<number | undefined>(undefined);
  readonly size = input<EmrTimeSize>('md');
  readonly clearable = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly invalid = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly warning = input<string>('');

  readonly valueChange = output<string | null>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
  readonly submitted = output<void>();

  private readonly textInputRef = viewChild<ElementRef<HTMLInputElement>>('textInput');
  private draftText: string | null = null;
  private isFocused = false;
  private leftInvalid = false;

  protected readonly resolvedStep = computed(() =>
    this.step() ?? (this.precision() === 'second' ? 1 : 60),
  );
  protected readonly resolvedPlaceholder = computed(() =>
    resolveTimePlaceholder(this.precision(), this.hourCycle(), this.placeholder()),
  );
  protected readonly displayedText = computed(() =>
    formatTimeDisplay(this.value(), { precision: this.precision(), hourCycle: this.hourCycle() }),
  );
  protected readonly showClear = computed(() =>
    Boolean(this.clearable() && this.value() && !this.readOnly() && !this.disabled()),
  );
  protected readonly isInvalid = computed(() => Boolean(this.invalid() || this.error() || this.leftInvalid));
  protected readonly containerMaxWidth = computed(() => {
    const base = this.precision() === 'second' || this.hourCycle() === '12' ? 210 : 176;
    return this.clearable() ? base + 36 : base;
  });
  protected readonly timeDescribedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    if (this.error()) return `${id}-error`;
    if (this.warning()) return `${id}-warning`;
    if (this.hint()) return `${id}-hint`;
    return null;
  });

  protected onFocus(): void {
    if (this.disabled()) return;
    this.isFocused = true;
    this.focused.emit();
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncElementNow(target, this.displayedText());
      return;
    }
    const cleaned = sanitizeTimeText(target.value, this.hourCycle());
    if (target.value !== cleaned) target.value = cleaned;
    this.draftText = cleaned;
    this.leftInvalid = false;
    const parsed = parseTimeText(cleaned, { precision: this.precision(), hourCycle: this.hourCycle() });
    if (parsed.kind === 'empty') {
      this.valueChange.emit(null);
      return;
    }
    if (parsed.kind === 'valid' && !isTimeOutOfBounds(parsed.value, this.min(), this.max())) {
      if (parsed.value !== this.value()) {
        this.valueChange.emit(parsed.value);
      }
    }
  }

  protected onBlur(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.isFocused = false;
    const raw = this.draftText ?? target.value;
    const parsed = parseTimeText(raw, { precision: this.precision(), hourCycle: this.hourCycle() });
    const oob = parsed.kind === 'valid' && isTimeOutOfBounds(parsed.value, this.min(), this.max());
    if (!this.readOnly() && !this.disabled() && (parsed.kind === 'draft' || oob)) {
      this.leftInvalid = true;
    } else {
      this.leftInvalid = false;
      this.draftText = null;
      this.syncElementNow(target, this.displayedText());
    }
    this.blurred.emit();
  }

  protected onEnter(): void {
    if (this.readOnly() || this.disabled()) return;
    this.submitted.emit();
  }

  protected onClear(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.readOnly() || this.disabled()) return;
    this.draftText = null;
    this.leftInvalid = false;
    const el = this.textInputRef()?.nativeElement;
    if (el) this.syncElementNow(el, '');
    this.valueChange.emit(null);
    this.cleared.emit();
  }

  protected onNativePick(event: Event): void {
    if (this.readOnly() || this.disabled()) return;
    const target = event.target as HTMLInputElement;
    const raw = emptyToNull(target.value);
    if (!raw) {
      this.valueChange.emit(null);
      return;
    }
    if (isTimeOutOfBounds(raw, this.min(), this.max())) return;
    const normalized = this.precision() === 'second' && raw.length === 5 ? `${raw}:00` : this.precision() === 'minute' ? raw.slice(0, 5) : raw;
    this.draftText = null;
    this.leftInvalid = false;
    this.valueChange.emit(normalized);
  }
}

/**
 * Controlled date-and-time primitive.
 * Renders paired Date + Time controls matching `displayFormat`, `timePrecision`, and `hourCycle`,
 * emitting canonical UTC ISO-8601 (`wireFormat='utc'`) or local wall-clock (`wireFormat='local'`) strings, and `null` when cleared.
 */
@Component({
  selector: 'emr-datetime-input',
  standalone: true,
  template: `
    <div
      class="emr-field emr-datetime-input"
      [class.emr-time-input--sm]="size() === 'sm'"
      [class.emr-time-input--lg]="size() === 'lg'"
      [class.emr-time-input--invalid]="isInvalid()"
      [class.emr-time-input--warning]="!isInvalid() && !!warning()"
      [class.emr-time-input--readonly]="readOnly()"
      [class.emr-time-input--disabled]="disabled()"
      role="group"
      [attr.aria-label]="ariaLabel() || label() || null"
      (focusin)="onGroupFocusIn()"
      (focusout)="onGroupFocusOut($event)"
    >
      <span class="emr-field__label" [class.emr-sr-only]="labelHidden()" [id]="resolvedId() + '-label'">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </span>
      <div class="emr-datetime-input__row">
        <div class="emr-time-input__wrap emr-datetime-input__date-box">
          <input
            #dateInput
            class="emr-time-input__field"
            [id]="resolvedId() + '-date'"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            [value]="displayedDate()"
            [placeholder]="displayFormat()"
            [required]="required()"
            [disabled]="disabled()"
            [readOnly]="readOnly()"
            [attr.aria-label]="(ariaLabel() || label() || 'Date and time') + ', ' + dateLabel()"
            [attr.aria-required]="required() || null"
            [attr.aria-readonly]="readOnly() || null"
            [attr.aria-invalid]="isInvalid() ? 'true' : null"
            [attr.aria-describedby]="dtDescribedBy()"
            (input)="onDateInput($event)"
            (blur)="onDateBlur($event)"
            (keydown.enter)="onEnter()"
          />
          <span class="emr-time-input__picker-btn" [class.emr-time-input__picker-btn--disabled]="disabled() || readOnly()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            @if (!disabled() && !readOnly()) {
              <input
                type="date"
                class="emr-time-input__native-picker"
                tabindex="-1"
                aria-hidden="true"
                [value]="parts().date ?? ''"
                (change)="onNativeDatePick($event)"
              />
            }
          </span>
        </div>

        <div class="emr-time-input__wrap emr-datetime-input__time-box" [style.max-width.px]="timeBoxMaxWidth()">
          <input
            #timeInput
            class="emr-time-input__field"
            [id]="resolvedId() + '-time'"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            [value]="displayedTime()"
            [placeholder]="resolvedTimePlaceholder()"
            [required]="required()"
            [disabled]="disabled()"
            [readOnly]="readOnly()"
            [attr.aria-label]="(ariaLabel() || label() || 'Date and time') + ', ' + timeLabel()"
            [attr.aria-required]="required() || null"
            [attr.aria-readonly]="readOnly() || null"
            [attr.aria-invalid]="isInvalid() ? 'true' : null"
            [attr.aria-describedby]="dtDescribedBy()"
            (input)="onTimeInput($event)"
            (blur)="onTimeBlur($event)"
            (keydown.enter)="onEnter()"
          />
          <span class="emr-time-input__picker-btn" [class.emr-time-input__picker-btn--disabled]="disabled() || readOnly()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            @if (!disabled() && !readOnly()) {
              <input
                type="time"
                class="emr-time-input__native-picker"
                tabindex="-1"
                aria-hidden="true"
                [value]="parts().time ?? ''"
                [attr.step]="effectivePrecision() === 'second' ? 1 : 60"
                (change)="onNativeTimePick($event)"
              />
            }
          </span>
        </div>

        @if (showClear()) {
          <button
            type="button"
            class="emr-datetime-input__clear"
            [attr.aria-label]="'Clear ' + (ariaLabel() || label() || 'date and time')"
            (click)="onClear($event)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        }
      </div>
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">{{ error() }}</span>
      } @else if (!labelHidden() && warning()) {
        <span class="emr-field__warning" [id]="resolvedId() + '-warning'" role="status">{{ warning() }}</span>
      } @else if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrDateTimeInputComponent extends EmrSignalFieldBase {
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly value = input<string | null>(null);
  readonly displayFormat = input<EmrDateTimeDisplayFormat>('dd-mm-yyyy');
  readonly timePrecision = input<EmrDateTimePrecision>('minute');
  readonly precision = input<EmrDateTimePrecision | undefined>(undefined);
  readonly hourCycle = input<EmrDateTimeHourCycle>('24');
  readonly wireFormat = input<EmrDateTimeWireFormat>('utc');
  readonly min = input<string | undefined>(undefined);
  readonly max = input<string | undefined>(undefined);
  readonly size = input<EmrDateTimeSize>('md');
  readonly clearable = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly dateLabel = input<string>('Date');
  readonly timeLabel = input<string>('Time');
  readonly invalid = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly warning = input<string>('');

  readonly valueChange = output<string | null>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
  readonly submitted = output<void>();

  private readonly dateInputRef = viewChild<ElementRef<HTMLInputElement>>('dateInput');
  private readonly timeInputRef = viewChild<ElementRef<HTMLInputElement>>('timeInput');
  private dateDraft: string | null = null;
  private timeDraft: string | null = null;
  private leftInvalid = false;
  private focusInside = false;

  protected readonly effectivePrecision = computed<EmrDateTimePrecision>(
    () => this.precision() ?? this.timePrecision(),
  );
  protected readonly parts = computed(() => splitDateTimeParts(this.value(), this.effectivePrecision()));
  protected readonly displayedDate = computed(() =>
    formatIsoDateDisplay(this.parts().date, this.displayFormat()),
  );
  protected readonly displayedTime = computed(() =>
    formatTimeDisplay(this.parts().time, { precision: this.effectivePrecision(), hourCycle: this.hourCycle() }),
  );
  protected readonly resolvedTimePlaceholder = computed(() =>
    resolveTimePlaceholder(this.effectivePrecision(), this.hourCycle()),
  );
  protected readonly timeBoxMaxWidth = computed(() =>
    this.effectivePrecision() === 'second' || this.hourCycle() === '12' ? 200 : 168,
  );
  protected readonly showClear = computed(() =>
    Boolean(this.clearable() && this.value() && !this.readOnly() && !this.disabled()),
  );
  protected readonly isInvalid = computed(() => Boolean(this.invalid() || this.error() || this.leftInvalid));
  protected readonly dtDescribedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    if (this.error()) return `${id}-error`;
    if (this.warning()) return `${id}-warning`;
    if (this.hint()) return `${id}-hint`;
    return null;
  });

  protected onGroupFocusIn(): void {
    if (!this.focusInside && !this.disabled()) {
      this.focusInside = true;
      this.focused.emit();
    }
  }

  protected onGroupFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    const cur = event.currentTarget as HTMLElement | null;
    if (next && cur?.contains(next)) return;
    this.focusInside = false;
    this.blurred.emit();
  }

  private tryCommit(nextDateIso: string | null, nextTime24: string | null, dateEmpty: boolean, timeEmpty: boolean): void {
    if (dateEmpty && timeEmpty) {
      this.leftInvalid = false;
      if (this.value() !== null) this.valueChange.emit(null);
      return;
    }
    if (!nextDateIso || !nextTime24) return;
    const joined = joinDateTimeParts(nextDateIso, nextTime24, this.wireFormat(), this.effectivePrecision());
    if (!joined) return;
    if (isDateTimeOutOfBounds(joined, this.min(), this.max(), this.wireFormat())) {
      this.leftInvalid = true;
      return;
    }
    this.leftInvalid = false;
    if (joined !== this.value()) {
      this.valueChange.emit(joined);
    }
  }

  protected onDateInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncElementNow(target, this.displayedDate());
      return;
    }
    const clean = sanitizeDateDisplayText(target.value, this.displayFormat());
    if (target.value !== clean) target.value = clean;
    this.dateDraft = clean;
    this.leftInvalid = false;

    const dp = parseDateDisplayText(clean, this.displayFormat());
    const tRaw = this.timeDraft ?? this.displayedTime();
    const tp = parseTimeText(tRaw, { precision: this.effectivePrecision(), hourCycle: this.hourCycle() });
    this.tryCommit(
      dp.kind === 'valid' ? dp.value : null,
      tp.kind === 'valid' ? tp.value : null,
      dp.kind === 'empty',
      tp.kind === 'empty',
    );
  }

  protected onDateBlur(event: Event): void {
    const target = event.target as HTMLInputElement;
    const raw = this.dateDraft ?? target.value;
    const dp = parseDateDisplayText(raw, this.displayFormat());
    const tRaw = this.timeDraft ?? this.displayedTime();
    const tp = parseTimeText(tRaw, { precision: this.effectivePrecision(), hourCycle: this.hourCycle() });
    const halfTyped = (dp.kind === 'valid' && tp.kind === 'empty') || (dp.kind === 'empty' && tp.kind === 'valid');
    if (!this.readOnly() && !this.disabled() && (dp.kind === 'draft' || halfTyped)) {
      this.leftInvalid = true;
    } else if (dp.kind === 'empty' && tp.kind === 'empty') {
      this.leftInvalid = false;
      this.dateDraft = null;
      this.syncElementNow(target, '');
    } else if (dp.kind === 'valid') {
      this.dateDraft = null;
      this.syncElementNow(target, formatIsoDateDisplay(dp.value, this.displayFormat()));
    }
  }

  protected onTimeInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncElementNow(target, this.displayedTime());
      return;
    }
    const clean = sanitizeTimeText(target.value, this.hourCycle());
    if (target.value !== clean) target.value = clean;
    this.timeDraft = clean;
    this.leftInvalid = false;

    const tp = parseTimeText(clean, { precision: this.effectivePrecision(), hourCycle: this.hourCycle() });
    const dRaw = this.dateDraft ?? this.displayedDate();
    const dp = parseDateDisplayText(dRaw, this.displayFormat());
    this.tryCommit(
      dp.kind === 'valid' ? dp.value : null,
      tp.kind === 'valid' ? tp.value : null,
      dp.kind === 'empty',
      tp.kind === 'empty',
    );
  }

  protected onTimeBlur(event: Event): void {
    const target = event.target as HTMLInputElement;
    const raw = this.timeDraft ?? target.value;
    const tp = parseTimeText(raw, { precision: this.effectivePrecision(), hourCycle: this.hourCycle() });
    const dRaw = this.dateDraft ?? this.displayedDate();
    const dp = parseDateDisplayText(dRaw, this.displayFormat());
    const halfTyped = (dp.kind === 'valid' && tp.kind === 'empty') || (dp.kind === 'empty' && tp.kind === 'valid');
    if (!this.readOnly() && !this.disabled() && (tp.kind === 'draft' || halfTyped)) {
      this.leftInvalid = true;
    } else if (dp.kind === 'empty' && tp.kind === 'empty') {
      this.leftInvalid = false;
      this.timeDraft = null;
      this.syncElementNow(target, '');
    } else if (tp.kind === 'valid') {
      this.timeDraft = null;
      this.syncElementNow(
        target,
        formatTimeDisplay(tp.value, { precision: this.effectivePrecision(), hourCycle: this.hourCycle() }),
      );
    }
  }

  protected onNativeDatePick(event: Event): void {
    if (this.readOnly() || this.disabled()) return;
    const picked = emptyToNull((event.target as HTMLInputElement).value);
    if (!picked) {
      this.dateDraft = '';
      this.tryCommit(null, null, true, true);
      return;
    }
    this.dateDraft = null;
    const el = this.dateInputRef()?.nativeElement;
    if (el) this.syncElementNow(el, formatIsoDateDisplay(picked, this.displayFormat()));
    const timeVal = this.parts().time ?? (this.effectivePrecision() === 'second' ? '09:00:00' : '09:00');
    this.tryCommit(picked, timeVal, false, false);
  }

  protected onNativeTimePick(event: Event): void {
    if (this.readOnly() || this.disabled()) return;
    const picked = emptyToNull((event.target as HTMLInputElement).value);
    if (!picked) return;
    this.timeDraft = null;
    const normalizedTime =
      this.effectivePrecision() === 'second' && picked.length === 5
        ? `${picked}:00`
        : this.effectivePrecision() === 'minute'
          ? picked.slice(0, 5)
          : picked;
    const el = this.timeInputRef()?.nativeElement;
    if (el) {
      this.syncElementNow(
        el,
        formatTimeDisplay(normalizedTime, { precision: this.effectivePrecision(), hourCycle: this.hourCycle() }),
      );
    }
    const dateVal = this.parts().date;
    if (dateVal) this.tryCommit(dateVal, normalizedTime, false, false);
  }

  protected onEnter(): void {
    if (this.readOnly() || this.disabled()) return;
    this.submitted.emit();
  }

  protected onClear(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.readOnly() || this.disabled()) return;
    this.dateDraft = null;
    this.timeDraft = null;
    this.leftInvalid = false;
    const dEl = this.dateInputRef()?.nativeElement;
    const tEl = this.timeInputRef()?.nativeElement;
    if (dEl) this.syncElementNow(dEl, '');
    if (tEl) this.syncElementNow(tEl, '');
    this.valueChange.emit(null);
    this.cleared.emit();
  }
}

@Component({
  selector: 'emr-select',
  standalone: true,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onDocumentEscape($event)',
  },
  template: `
    <div
      class="emr-field emr-select-field"
      [class.emr-select-field--sm]="size() === 'sm'"
      [class.emr-select-field--filled]="variant() === 'filled'"
      [class.emr-select-field--subtle]="variant() === 'subtle'"
      [class.emr-select-field--invalid]="isInvalid()"
      [class.emr-select-field--warning]="!isInvalid() && !!warning()"
      [class.emr-select-field--readonly]="readOnly()"
      [class.emr-select-field--disabled]="disabled()"
      [class.emr-select-field--open]="open()"
    >
      @if (label()) {
        <label class="emr-field__label" [class.emr-sr-only]="labelHidden()" [for]="resolvedId()">
          {{ label() }}
          @if (required()) {
            <span class="emr-field__required" aria-hidden="true">*</span>
            <span class="emr-sr-only">Required</span>
          }
        </label>
      }
      <div class="emr-select-root">
        <div
          class="emr-select-shell"
          [attr.data-open]="open() ? 'true' : null"
          [attr.data-invalid]="isInvalid() ? 'true' : null"
          [attr.data-warning]="!isInvalid() && !!warning() ? 'true' : null"
          [attr.data-readonly]="readOnly() ? 'true' : null"
          [attr.data-disabled]="disabled() ? 'true' : null"
        >
          @if (multiple() && (triggerSummary().visibleChips.length || triggerSummary().overflowCount > 0)) {
            <div class="emr-select-chips" [attr.aria-label]="(label() || ariaLabel() || 'Selected') + ' items'">
              @for (chip of triggerSummary().visibleChips; track chip.value) {
                <span
                  class="emr-select-chip"
                  [attr.data-tone]="chip.tone ?? null"
                  [attr.data-readonly]="chip.readOnly ? 'true' : null"
                >
                  <span class="emr-select-chip__label">{{ chip.label }}</span>
                  @if (!readOnly() && !disabled() && !chip.readOnly && !chip.disabled) {
                    <button
                      type="button"
                      class="emr-select-chip__remove"
                      [attr.aria-label]="'Remove ' + chip.label"
                      (click)="onRemoveChip(chip.value)"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
                      </svg>
                    </button>
                  }
                </span>
              }
              @if (triggerSummary().overflowCount > 0) {
                <span class="emr-select-chip emr-select-chip--overflow">+{{ triggerSummary().overflowCount }}</span>
              }
            </div>
          }
          <button
            #triggerEl
            type="button"
            class="emr-select-trigger"
            [id]="resolvedId()"
            role="combobox"
            [attr.aria-expanded]="open()"
            aria-haspopup="listbox"
            [attr.aria-busy]="loading() ? 'true' : null"
            [attr.aria-controls]="open() ? resolvedId() + '-listbox' : null"
            [attr.aria-activedescendant]="activeDescendantId()"
            [attr.aria-label]="resolvedAriaLabel()"
            [attr.aria-required]="required() ? 'true' : null"
            [attr.aria-readonly]="readOnly() ? 'true' : null"
            [attr.aria-invalid]="isInvalid() ? 'true' : null"
            [attr.aria-describedby]="describedBy()"
            [disabled]="disabled()"
            (click)="toggleOpen()"
            (keydown)="onTriggerKeyDown($event)"
            (focus)="onTriggerFocus()"
            (blur)="onTriggerBlur($event)"
          >
            @if (!multiple() || (!triggerSummary().visibleChips.length && triggerSummary().overflowCount === 0)) {
              <span
                class="emr-select-trigger__text"
                [class.emr-select-trigger__text--placeholder]="!triggerSummary().hasSelection"
              >
                {{ triggerSummary().text }}
              </span>
            } @else {
              <span class="emr-select-trigger__spacer" aria-hidden="true"></span>
            }
            <span class="emr-select-trigger__chevron" aria-hidden="true">
              @if (loading()) {
                <svg class="emr-select-spinner" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity="0.25" stroke-width="2" />
                  <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              } @else {
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    [attr.d]="open() ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              }
            </span>
          </button>
          @if (showClear()) {
            <button
              type="button"
              class="emr-select-clear"
              [attr.aria-label]="clearLabel() + ' ' + (label() || ariaLabel() || 'selection')"
              (click)="clearSelection()"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
              </svg>
            </button>
          }
        </div>
        @if (open() && !readOnly() && !disabled()) {
          <div
            class="emr-select-menu"
            role="listbox"
            [id]="resolvedId() + '-listbox'"
            [attr.aria-label]="label() || ariaLabel() || 'Options'"
            [attr.aria-multiselectable]="multiple() ? 'true' : null"
            (keydown)="onMenuKeyDown($event)"
          >
            @if (loading()) {
              <div class="emr-select-state" role="status">
                <svg class="emr-select-spinner" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity="0.25" stroke-width="2" />
                  <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
                <span>Loading…</span>
              </div>
            } @else if (options().length === 0) {
              <div class="emr-select-state">{{ emptyMessage() }}</div>
            } @else {
              @for (grp of optionGroups(); track grp.label ?? '__ungrouped__'; let gIdx = $index) {
                @if (grp.label !== null) {
                  <div class="emr-select__group" role="group" [attr.aria-labelledby]="resolvedId() + '-grp-' + gIdx">
                    <div class="emr-select__group-label" [id]="resolvedId() + '-grp-' + gIdx">{{ grp.label }}</div>
                    @for (option of grp.options; track option.value) {
                      <button
                        type="button"
                        role="option"
                        class="emr-select-option"
                        [id]="optionDomId(option.value)"
                        [class.emr-select-option--selected]="isOptionSelected(option.value)"
                        [class.emr-select-option--active]="isOptionActive(option.value)"
                        [class.emr-select-option--readonly]="!!option.readOnly"
                        [attr.data-tone]="option.tone ?? null"
                        [attr.aria-selected]="isOptionSelected(option.value)"
                        [attr.aria-readonly]="option.readOnly ? 'true' : null"
                        [disabled]="isOptionDisabled(option)"
                        (click)="onSelectOption(option)"
                        (mouseenter)="setActiveByValue(option.value)"
                      >
                        <span class="emr-select-option__tick" aria-hidden="true">
                          @if (isOptionSelected(option.value)) {
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                              <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                          }
                        </span>
                        <span class="emr-select-option__body">
                          <span class="emr-select-option__row">
                            <span class="emr-select-option__label">{{ option.label }}</span>
                            @if (badgeLabel(option.badge); as bText) {
                              <span class="emr-select-option__badge" [attr.data-tone]="badgeTone(option)">{{ bText }}</span>
                            }
                          </span>
                          @if (option.description) {
                            <span class="emr-select-option__desc">{{ option.description }}</span>
                          }
                        </span>
                      </button>
                    }
                  </div>
                } @else {
                  @for (option of grp.options; track option.value) {
                    <button
                      type="button"
                      role="option"
                      class="emr-select-option"
                      [id]="optionDomId(option.value)"
                      [class.emr-select-option--selected]="isOptionSelected(option.value)"
                      [class.emr-select-option--active]="isOptionActive(option.value)"
                      [class.emr-select-option--readonly]="!!option.readOnly"
                      [attr.data-tone]="option.tone ?? null"
                      [attr.aria-selected]="isOptionSelected(option.value)"
                      [attr.aria-readonly]="option.readOnly ? 'true' : null"
                      [disabled]="isOptionDisabled(option)"
                      (click)="onSelectOption(option)"
                      (mouseenter)="setActiveByValue(option.value)"
                    >
                      <span class="emr-select-option__tick" aria-hidden="true">
                        @if (isOptionSelected(option.value)) {
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        }
                      </span>
                      <span class="emr-select-option__body">
                        <span class="emr-select-option__row">
                          <span class="emr-select-option__label">{{ option.label }}</span>
                          @if (badgeLabel(option.badge); as bText) {
                            <span class="emr-select-option__badge" [attr.data-tone]="badgeTone(option)">{{ bText }}</span>
                          }
                        </span>
                        @if (option.description) {
                          <span class="emr-select-option__desc">{{ option.description }}</span>
                        }
                      </span>
                    </button>
                  }
                }
              }
            }
          </div>
        }
      </div>
      @if (hint()) {
        <span class="emr-field__hint" [class.emr-sr-only]="labelHidden()" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (warning()) {
        <span class="emr-field__warning" [class.emr-sr-only]="labelHidden()" role="status" [id]="resolvedId() + '-warning'">{{ warning() }}</span>
      }
      @if (error()) {
        <span class="emr-field__error" [class.emr-sr-only]="labelHidden()" role="alert" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrSelectComponent extends EmrSignalFieldBase {
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('triggerEl');

  readonly ariaLabel = input('');
  readonly options = input<readonly EmrOption[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly value = input<EmrSelectValue>(null);
  override readonly placeholder = input('Select…');
  readonly size = input<EmrSelectSize>('md');
  readonly variant = input<EmrSelectVariant>('outline');
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly closeOnSelect = input<boolean | undefined>(undefined);
  readonly maxSelections = input<number | undefined>(undefined);
  readonly maxTagCount = input<number | undefined>(undefined);
  readonly emptyMessage = input('No options available');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly warning = input('');

  readonly valueChange = output<EmrSelectValue>();
  readonly cleared = output<void>();
  readonly openChange = output<boolean>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);
  private typeaheadBuffer = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  protected override readonly describedBy = computed(() => {
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.warning()) ids.push(`${id}-warning`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  protected readonly isInvalid = computed(() => Boolean(this.invalid() || this.error()));
  protected readonly optionGroups = computed(() => groupOptions(this.options()));
  protected readonly flatOptions = computed(() => this.optionGroups().flatMap((g) => g.options));

  protected readonly selectedValues = computed<readonly string[]>(() => {
    if (this.multiple()) {
      return normalizeEmrSelectMultiValue(this.value());
    }
    const single = normalizeEmrSelectSingleValue(this.value());
    return single === null ? [] : [single];
  });

  protected readonly triggerSummary = computed(() =>
    buildEmrSelectTriggerSummary({
      multiple: this.multiple(),
      value: this.value(),
      options: this.options(),
      placeholder: this.placeholder() || 'Select…',
      maxTagCount: this.maxTagCount(),
    }),
  );

  protected readonly showClear = computed(() =>
    isEmrSelectClearable({
      clearable: this.clearable(),
      disabled: this.disabled(),
      readOnly: this.readOnly(),
      multiple: this.multiple(),
      value: this.value(),
      options: this.options(),
    }),
  );

  protected readonly resolvedAriaLabel = computed(() => {
    const base = this.ariaLabel().trim() || this.label().trim();
    const summary = this.triggerSummary().text;
    return base ? `${base}, ${summary}` : summary;
  });

  protected readonly activeDescendantId = computed(() => {
    if (!this.open()) return null;
    const idx = this.activeIndex();
    const list = this.flatOptions();
    const opt = idx >= 0 && idx < list.length ? list[idx] : undefined;
    return opt ? this.optionDomId(opt.value) : null;
  });

  protected optionDomId(val: string): string {
    return `${this.resolvedId()}-opt-${val.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }

  protected isOptionSelected(val: string): boolean {
    return this.selectedValues().includes(val);
  }

  protected isOptionActive(val: string): boolean {
    const idx = this.activeIndex();
    const list = this.flatOptions();
    return idx >= 0 && idx < list.length && list[idx]?.value === val;
  }

  protected isOptionDisabled(option: EmrOption): boolean {
    if (option.disabled) return true;
    if (this.multiple() && isEmrSelectOptionBlockedByMax(option.value, this.selectedValues(), this.maxSelections())) {
      return true;
    }
    return false;
  }

  protected badgeLabel(badge: EmrBadge | string | undefined): string {
    if (!badge) return '';
    return typeof badge === 'string' ? badge : badge.label;
  }

  protected badgeTone(option: EmrOption): EmrTone {
    if (option.badge && typeof option.badge !== 'string') return option.badge.tone;
    return option.tone ?? 'neutral';
  }

  protected setActiveByValue(val: string): void {
    const idx = this.flatOptions().findIndex((o) => o.value === val);
    if (idx >= 0) this.activeIndex.set(idx);
  }

  protected toggleOpen(): void {
    if (this.readOnly() || this.disabled()) return;
    if (this.open()) {
      this.closeDropdown(true);
    } else {
      this.openDropdown();
    }
  }

  private openDropdown(): void {
    if (this.readOnly() || this.disabled() || this.open()) return;
    const list = this.flatOptions();
    const selectedIdx = list.findIndex((o) => !o.disabled && this.selectedValues().includes(o.value));
    const initialIdx =
      selectedIdx >= 0 ? selectedIdx : findNextEnabledEmrSelectOptionIndex(list, -1, 'ArrowDown');
    this.activeIndex.set(initialIdx);
    this.open.set(true);
    this.openChange.emit(true);
  }

  private closeDropdown(restoreFocus: boolean): void {
    if (!this.open()) return;
    this.open.set(false);
    this.activeIndex.set(-1);
    this.openChange.emit(false);
    if (restoreFocus) {
      this.triggerRef()?.nativeElement.focus();
    }
  }

  protected onDocumentClick(event: Event): void {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (target && !this.hostEl.nativeElement.contains(target)) {
      this.closeDropdown(false);
    }
  }

  protected onDocumentEscape(event: Event): void {
    if (!this.open()) return;
    event.stopPropagation();
    this.closeDropdown(true);
  }

  protected onTriggerFocus(): void {
    this.focused.emit();
  }

  protected onTriggerBlur(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (related && this.hostEl.nativeElement.contains(related)) return;
    this.blurred.emit();
  }

  protected onTriggerKeyDown(event: KeyboardEvent): void {
    if (this.readOnly() || this.disabled()) return;
    const list = this.flatOptions();
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (!this.open()) {
        this.openDropdown();
        if (event.key === 'End') {
          this.activeIndex.set(findNextEnabledEmrSelectOptionIndex(list, -1, 'End'));
        }
        return;
      }
      const next = findNextEnabledEmrSelectOptionIndex(list, this.activeIndex(), event.key);
      if (next >= 0) this.activeIndex.set(next);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.open()) {
        this.openDropdown();
      } else {
        const idx = this.activeIndex();
        const opt = idx >= 0 && idx < list.length ? list[idx] : undefined;
        if (opt) this.onSelectOption(opt);
      }
      return;
    }
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      event.stopPropagation();
      this.closeDropdown(true);
      return;
    }
    this.handleTypeahead(event);
  }

  protected onMenuKeyDown(event: KeyboardEvent): void {
    if (this.readOnly() || this.disabled()) return;
    const list = this.flatOptions();
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const next = findNextEnabledEmrSelectOptionIndex(list, this.activeIndex(), event.key);
      if (next >= 0) this.activeIndex.set(next);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const idx = this.activeIndex();
      const opt = idx >= 0 && idx < list.length ? list[idx] : undefined;
      if (opt) this.onSelectOption(opt);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeDropdown(true);
      return;
    }
    this.handleTypeahead(event);
  }

  private handleTypeahead(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
    const list = this.flatOptions();
    if (list.length === 0) return;
    this.typeaheadBuffer += event.key;
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = setTimeout(() => {
      this.typeaheadBuffer = '';
      this.typeaheadTimer = null;
    }, 500);
    const match = findTypeaheadEmrSelectOptionIndex(list, this.typeaheadBuffer, this.activeIndex());
    if (match >= 0) {
      if (!this.open()) {
        this.open.set(true);
        this.openChange.emit(true);
      }
      this.activeIndex.set(match);
    }
  }

  protected onSelectOption(option: EmrOption): void {
    if (this.readOnly() || this.disabled() || option.disabled || option.readOnly) return;
    const shouldClose = resolveEmrSelectCloseOnSelect(this.multiple(), this.closeOnSelect());
    if (this.multiple()) {
      const current = this.selectedValues();
      const next = toggleEmrSelectOption({
        optionValue: option.value,
        current,
        options: this.options(),
        maxSelections: this.maxSelections(),
      });
      if (next !== current) {
        this.valueChange.emit(next);
      }
      if (shouldClose) this.closeDropdown(true);
      return;
    }
    const single = normalizeEmrSelectSingleValue(this.value());
    if (shouldClose) this.closeDropdown(true);
    if (option.value !== single) {
      this.valueChange.emit(option.value);
    }
  }

  protected onRemoveChip(optionValue: string): void {
    if (this.readOnly() || this.disabled() || !this.multiple()) return;
    const current = this.selectedValues();
    const next = removeEmrSelectChip({ optionValue, current, options: this.options() });
    if (next !== current) {
      this.valueChange.emit(next);
    }
  }

  protected clearSelection(): void {
    if (!this.showClear()) return;
    const next = clearEmrSelectValue({
      multiple: this.multiple(),
      value: this.value(),
      options: this.options(),
    });
    this.closeDropdown(true);
    this.valueChange.emit(next);
    this.cleared.emit();
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
        @if (required() || valueRequired() || unitRequired()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </label>
      <div
        class="emr-quantity"
        [class.emr-quantity--sm]="size() === 'sm'"
        [class.emr-quantity--lg]="size() === 'lg'"
      >
        @if (showSteppers()) {
          <div
            class="emr-input-affix emr-quantity__value"
            [attr.data-invalid]="numericInvalid() ? 'true' : null"
            [attr.data-warning]="!numericInvalid() && !!warning() ? 'true' : null"
            [attr.data-readonly]="readOnly() ? 'true' : null"
          >
            <button
              type="button"
              class="emr-input-affix__btn emr-input-affix__btn--leading"
              data-emr-print="hide"
              [disabled]="disabled() || readOnly() || !canDecrement()"
              [attr.aria-disabled]="readOnly() ? 'true' : null"
              [attr.aria-label]="'Decrease ' + (label() || 'value')"
              (click)="stepBy(-1)"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3.5 8h9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
              </svg>
            </button>
            <input
              #valInput
              class="emr-input-affix__field emr-input-affix__field--centered"
              [id]="resolvedId() + '-value'"
              type="text"
              role="spinbutton"
              [attr.inputmode]="mode() === 'integer' ? 'numeric' : 'decimal'"
              [attr.aria-valuemin]="min() ?? null"
              [attr.aria-valuemax]="max() ?? null"
              [attr.aria-valuenow]="value() ?? null"
              [value]="domValue()"
              [placeholder]="placeholder()"
              [required]="valueRequired() ?? required()"
              [disabled]="disabled()"
              [readOnly]="readOnly()"
              [attr.aria-readonly]="readOnly() ? 'true' : null"
              [attr.aria-label]="(label() || 'Quantity') + ' value'"
              [attr.aria-invalid]="numericInvalid() ? 'true' : null"
              [attr.aria-describedby]="quantityDescribedBy()"
              (input)="emitQuantityValue($event)"
              (keydown)="onValueKeydown($event)"
              (focus)="focused.emit()"
              (blur)="onValueBlur($event)"
            />
            <button
              type="button"
              class="emr-input-affix__btn"
              data-emr-print="hide"
              [disabled]="disabled() || readOnly() || !canIncrement()"
              [attr.aria-disabled]="readOnly() ? 'true' : null"
              [attr.aria-label]="'Increase ' + (label() || 'value')"
              (click)="stepBy(1)"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        } @else {
          <input
            #valInput
            class="emr-control emr-quantity__value"
            [id]="resolvedId() + '-value'"
            type="text"
            role="spinbutton"
            [attr.inputmode]="mode() === 'integer' ? 'numeric' : 'decimal'"
            [attr.aria-valuemin]="min() ?? null"
            [attr.aria-valuemax]="max() ?? null"
            [attr.aria-valuenow]="value() ?? null"
            [value]="domValue()"
            [placeholder]="placeholder()"
            [required]="valueRequired() ?? required()"
            [disabled]="disabled()"
            [readOnly]="readOnly()"
            [attr.aria-readonly]="readOnly() ? 'true' : null"
            [attr.aria-label]="(label() || 'Quantity') + ' value'"
            [attr.aria-invalid]="numericInvalid() ? 'true' : null"
            [attr.data-warning]="!numericInvalid() && !!warning() ? 'true' : null"
            [attr.aria-describedby]="quantityDescribedBy()"
            (input)="emitQuantityValue($event)"
            (keydown)="onValueKeydown($event)"
            (focus)="focused.emit()"
            (blur)="onValueBlur($event)"
          />
        }

        <select
          class="emr-select emr-quantity__unit"
          [id]="resolvedId() + '-unit'"
          [value]="unit() ?? ''"
          [required]="unitRequired() ?? required()"
          [disabled]="disabled()"
          [attr.aria-readonly]="readOnly() || unitReadOnly() ? 'true' : null"
          [attr.aria-invalid]="unitInvalid() ? 'true' : null"
          [attr.data-warning]="!unitInvalid() && !!warning() ? 'true' : null"
          [attr.aria-label]="(label() || 'Quantity') + ' ' + (unitLabel() || 'Unit')"
          [attr.aria-describedby]="quantityDescribedBy()"
          (mousedown)="guardReadOnlySelect($event)"
          (keydown)="guardReadOnlySelectKey($event)"
          (change)="emitUnit($event)"
          (focus)="focused.emit()"
          (blur)="onUnitBlur($event)"
        >
          @if (!unit() || (clearable() && !(unitRequired() ?? required()))) {
            <option value="" [selected]="!unit()">{{ unitPlaceholder() || 'Unit' }}</option>
          }
          @for (grp of unitGroups(); track grp.label ?? '__ungrouped') {
            @if (grp.label) {
              <optgroup [label]="grp.label">
                @for (option of grp.options; track option.value) {
                  <option
                    [value]="option.value"
                    [selected]="option.value === unit()"
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
                  [selected]="option.value === unit()"
                  [disabled]="option.disabled"
                >
                  {{ option.label }}
                </option>
              }
            }
          }
        </select>

        @if (showClearButton()) {
          <button
            type="button"
            class="emr-quantity__clear"
            data-emr-print="hide"
            [attr.aria-label]="clearLabel() + ' ' + (label() || 'quantity')"
            (click)="onClear()"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
            </svg>
          </button>
        }
      </div>
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && warning() && !combinedError()) {
        <span class="emr-field__warning" [id]="resolvedId() + '-warning'" role="status">{{ warning() }}</span>
      }
      @if (!labelHidden() && combinedError()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">{{ combinedError() }}</span>
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
  readonly mode = input<EmrQuantityNumericMode>('decimal');
  readonly precision = input<number>();
  readonly min = input<number>();
  readonly max = input<number>();
  readonly step = input<number>();
  readonly showSteppers = input(true, { transform: booleanAttribute });
  readonly size = input<EmrQuantitySize>('md');
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly unitLabel = input('Unit');
  readonly unitPlaceholder = input('Unit');
  readonly valueRequired = input<boolean | undefined>(undefined);
  readonly unitRequired = input<boolean | undefined>(undefined);
  readonly unitReadOnly = input(false, { transform: booleanAttribute });
  readonly warning = input('');
  readonly valueError = input('');
  readonly unitError = input('');

  readonly valueChange = output<number | null>();
  readonly unitChange = output<string | null>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
  readonly submitted = output<void>();

  private readonly valInputRef = viewChild<ElementRef<HTMLInputElement>>('valInput');

  protected readonly effectiveStep = computed(() =>
    resolveQuantityStep({ mode: this.mode(), precision: this.precision(), step: this.step() }),
  );

  protected readonly unitGroups = computed(() => groupOptions(this.units()));

  protected readonly numericInvalid = computed(() => Boolean(this.error() || this.valueError()));
  protected readonly unitInvalid = computed(() => Boolean(this.error() || this.unitError()));
  protected readonly combinedError = computed(() =>
    [this.error(), this.valueError(), this.unitError()].filter(Boolean).join(' · '),
  );

  protected readonly quantityDescribedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.warning() && !this.combinedError()) ids.push(`${id}-warning`);
    if (this.combinedError()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

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

  protected readonly showClearButton = computed(
    () =>
      this.clearable() &&
      !this.disabled() &&
      !this.readOnly() &&
      (this.value() !== null || (this.unit() !== null && !this.unitReadOnly())),
  );

  protected stepBy(direction: -1 | 1): void {
    if (this.readOnly() || this.disabled()) return;
    const next = stepNumberValue(this.value(), direction, {
      mode: this.mode(),
      precision: this.precision(),
      step: this.step(),
      min: this.min(),
      max: this.max(),
    });
    const el = this.valInputRef()?.nativeElement;
    if (el) {
      this.scheduleDomSync(el, () => this.domValue(), () => this.value());
    }
    this.valueChange.emit(next);
  }

  protected onValueKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.disabled()) {
      this.submitted.emit();
    } else if (event.key === 'ArrowUp' && !this.readOnly() && !this.disabled()) {
      event.preventDefault();
      this.stepBy(1);
    } else if (event.key === 'ArrowDown' && !this.readOnly() && !this.disabled()) {
      event.preventDefault();
      this.stepBy(-1);
    }
  }

  protected emitQuantityValue(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncElementNow(target, this.domValue());
      return;
    }
    const sanitized = sanitizeQuantityText(target.value, this.mode());
    if (target.value !== sanitized) {
      target.value = sanitized;
    }
    const parsed = parseQuantityDraft(sanitized, this.mode());
    if (parsed === 'incomplete') return;
    this.scheduleDomSync(target, () => this.domValue(), () => this.value());
    this.valueChange.emit(parsed);
  }

  protected onValueBlur(event: Event): void {
    this.syncElementNow(event.target as HTMLInputElement, this.domValue());
    this.blurred.emit();
  }

  protected guardReadOnlySelect(event: MouseEvent): void {
    if (this.readOnly() || this.unitReadOnly() || this.disabled()) {
      event.preventDefault();
    }
  }

  protected guardReadOnlySelectKey(event: KeyboardEvent): void {
    if ((this.readOnly() || this.unitReadOnly() || this.disabled()) && event.key !== 'Tab') {
      event.preventDefault();
    }
  }

  protected emitUnit(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (this.readOnly() || this.unitReadOnly() || this.disabled()) {
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

  protected onClear(): void {
    if (this.readOnly() || this.disabled()) return;
    this.valueChange.emit(null);
    if (!this.unitReadOnly() && this.unit() !== null) {
      this.unitChange.emit(null);
    }
    this.cleared.emit();
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
          [attr.inputmode]="effectiveFirstMode() === 'integer' ? 'numeric' : effectiveFirstMode() === 'decimal' ? 'decimal' : null"
          [value]="firstValue() ?? ''"
          [placeholder]="firstPlaceholder() || placeholder()"
          [required]="firstRequired() ?? required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="(label() ? label() + ', ' : '') + firstLabel()"
          [attr.aria-invalid]="!!(firstError() || error()) || null"
          [attr.aria-describedby]="describedBy()"
          (input)="onFirstInput($event)"
          (blur)="onFirstBlur($event)"
        />
        <span class="emr-field-row__separator" aria-hidden="true">{{ separator() }}</span>
        <span class="emr-paired-control__prefix" aria-hidden="true">{{ secondLabel() }}</span>
        <input
          class="emr-control"
          [id]="resolvedId() + '-second'"
          [attr.inputmode]="effectiveSecondMode() === 'integer' ? 'numeric' : effectiveSecondMode() === 'decimal' ? 'decimal' : null"
          [value]="secondValue() ?? ''"
          [placeholder]="secondPlaceholder() || placeholder()"
          [required]="secondRequired() ?? required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="(label() ? label() + ', ' : '') + secondLabel()"
          [attr.aria-invalid]="!!(secondError() || error()) || null"
          [attr.aria-describedby]="describedBy()"
          (input)="onSecondInput($event)"
          (blur)="onSecondBlur($event)"
        />
      </div>
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && resolvedError()) {
        <span class="emr-field__error" role="alert" [id]="resolvedId() + '-error'">{{ resolvedError() }}</span>
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
  readonly firstPlaceholder = input('');
  readonly secondPlaceholder = input('');
  readonly inputType = input<'text' | 'integer' | 'decimal'>('text');
  readonly firstInputType = input<'text' | 'integer' | 'decimal'>();
  readonly secondInputType = input<'text' | 'integer' | 'decimal'>();
  readonly min = input<number>();
  readonly max = input<number>();
  readonly firstMin = input<number>();
  readonly firstMax = input<number>();
  readonly secondMin = input<number>();
  readonly secondMax = input<number>();
  readonly firstRequired = input<boolean>();
  readonly secondRequired = input<boolean>();
  readonly firstError = input<string>();
  readonly secondError = input<string>();
  readonly separator = input('/');
  readonly firstValueChange = output<string | null>();
  readonly secondValueChange = output<string | null>();
  readonly blurred = output<void>();

  protected readonly effectiveFirstMode = computed(() => this.firstInputType() ?? this.inputType());
  protected readonly effectiveSecondMode = computed(() => this.secondInputType() ?? this.inputType());
  protected readonly resolvedError = computed(() =>
    [this.error(), this.firstError(), this.secondError()].filter(Boolean).join(' · '),
  );

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
