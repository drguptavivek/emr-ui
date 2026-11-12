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
  viewChildren,
} from '@angular/core';
import type { EmrSliderMark } from '@drguptavivek/emr-controller';
import {
  applyInputMask,
  applyOtpSlotEdit,
  clampRangeSliderPair,
  clampSliderValue,
  normalizeOtpSlots,
} from './emr-wave2.logic';

let nextWave2FormattedId = 0;

@Component({
  selector: 'emr-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="emr-field">
      <div class="emr-choice-header">
        <label class="emr-field__label" [class.emr-sr-only]="labelHidden()" [for]="resolvedId()">
          {{ label() }}
          @if (required()) {
            <span class="emr-field__required" aria-hidden="true">*</span>
          }
        </label>
        <div class="emr-chip-row">
          @if (value() !== null && value() !== undefined) {
            <span class="emr-badge emr-tone-neutral" aria-live="polite">
              {{ value() }}{{ unit() ? ' ' + unit() : '' }}
            </span>
          }
          @if (showClear()) {
            <button
              type="button"
              class="emr-choice-clear"
              [attr.aria-label]="'Clear ' + (label() || 'slider')"
              (click)="clearValue()"
            >
              Clear
            </button>
          }
        </div>
      </div>
      <div class="emr-slider-track">
        <input
          #rangeInput
          type="range"
          style="width: 100%; cursor: pointer"
          [id]="resolvedId()"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [value]="domNumericValue()"
          [disabled]="disabled()"
          [attr.aria-label]="labelHidden() ? (label() || 'Slider') : null"
          [attr.aria-valuemin]="min()"
          [attr.aria-valuemax]="max()"
          [attr.aria-valuenow]="value() ?? min()"
          [attr.aria-readonly]="readOnly() || null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (input)="onInput($event)"
          (change)="onInput($event)"
        />
      </div>
      @if (marks().length > 0) {
        <div class="emr-choice-header" aria-hidden="true">
          @for (mark of marks(); track mark.value) {
            <span class="emr-field__hint">{{ mark.label ?? mark.value }}</span>
          }
        </div>
      }
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </div>
  `,
})
export class EmrSliderComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly value = input<number | null>(null);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly unit = input('');
  readonly marks = input<readonly EmrSliderMark[]>([]);
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<number | null>();
  readonly cleared = output<void>();

  private readonly fallbackId = `emr-slider-${++nextWave2FormattedId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly domNumericValue = computed(() => {
    const v = this.value();
    return v === null || v === undefined ? String(this.min()) : String(v);
  });

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
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly rangeRef = viewChild<ElementRef<HTMLInputElement>>('rangeInput');
  private needsDomSync = false;

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
    const raw = Number(target.value);
    const clamped = clampSliderValue(raw, this.min(), this.max(), this.step());
    this.scheduleDomSync();
    this.valueChange.emit(clamped);
  }

  protected clearValue(): void {
    if (this.readOnly() || this.disabled()) return;
    this.scheduleDomSync();
    this.valueChange.emit(null);
    this.cleared.emit();
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
    const el = this.rangeRef()?.nativeElement;
    if (!el) return;
    const expected = this.domNumericValue();
    if (el.value !== expected) el.value = expected;
  }
}

@Component({
  selector: 'emr-range-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="emr-field" [id]="resolvedId()" role="group" [attr.aria-label]="label() || 'Range slider'">
      <div class="emr-choice-header">
        <span class="emr-field__label" [class.emr-sr-only]="labelHidden()">
          {{ label() }}
          @if (required()) {
            <span class="emr-field__required" aria-hidden="true">*</span>
          }
        </span>
        <span class="emr-badge emr-tone-neutral" aria-live="polite">
          {{ value()[0] }} – {{ value()[1] }}{{ unit() ? ' ' + unit() : '' }}
        </span>
      </div>
      <div class="emr-quantity">
        <input
          #lowRange
          type="range"
          style="flex: 1; cursor: pointer"
          [id]="resolvedId() + '-low'"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [value]="value()[0]"
          [disabled]="disabled()"
          [attr.aria-label]="(label() || 'Range') + ' minimum'"
          [attr.aria-valuemin]="min()"
          [attr.aria-valuemax]="max()"
          [attr.aria-valuenow]="value()[0]"
          [attr.aria-readonly]="readOnly() || null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (input)="onThumbInput('low', $event)"
          (change)="onThumbInput('low', $event)"
        />
        <input
          #highRange
          type="range"
          style="flex: 1; cursor: pointer"
          [id]="resolvedId() + '-high'"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [value]="value()[1]"
          [disabled]="disabled()"
          [attr.aria-label]="(label() || 'Range') + ' maximum'"
          [attr.aria-valuemin]="min()"
          [attr.aria-valuemax]="max()"
          [attr.aria-valuenow]="value()[1]"
          [attr.aria-readonly]="readOnly() || null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (input)="onThumbInput('high', $event)"
          (change)="onThumbInput('high', $event)"
        />
      </div>
      @if (marks().length > 0) {
        <div class="emr-choice-header" aria-hidden="true">
          @for (mark of marks(); track mark.value) {
            <span class="emr-field__hint">{{ mark.label ?? mark.value }}</span>
          }
        </div>
      }
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </div>
  `,
})
export class EmrRangeSliderComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly value = input<readonly [number, number]>([0, 100]);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly minDistance = input(0);
  readonly unit = input('');
  readonly marks = input<readonly EmrSliderMark[]>([]);
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<readonly [number, number]>();

  private readonly fallbackId = `emr-range-slider-${++nextWave2FormattedId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly lowRef = viewChild<ElementRef<HTMLInputElement>>('lowRange');
  private readonly highRef = viewChild<ElementRef<HTMLInputElement>>('highRange');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onThumbInput(thumb: 'low' | 'high', event: Event): void {
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    const raw = Number((event.target as HTMLInputElement).value);
    const [curLow, curHigh] = this.value();
    const pair = clampRangeSliderPair(
      thumb === 'low' ? raw : curLow,
      thumb === 'high' ? raw : curHigh,
      this.min(),
      this.max(),
      this.step(),
      this.minDistance(),
      thumb,
    );
    this.scheduleDomSync();
    this.valueChange.emit(pair);
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
    const [low, high] = this.value();
    const lowEl = this.lowRef()?.nativeElement;
    if (lowEl && lowEl.value !== String(low)) lowEl.value = String(low);
    const highEl = this.highRef()?.nativeElement;
    if (highEl && highEl.value !== String(high)) highEl.value = String(high);
  }
}

@Component({
  selector: 'emr-masked-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
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
            [attr.aria-label]="'Clear ' + (label() || 'value')"
            (click)="clearValue()"
          >
            Clear
          </button>
        }
      </div>
      <input
        #maskEl
        class="emr-control"
        type="text"
        autocomplete="off"
        [id]="resolvedId()"
        [value]="maskedDisplay()"
        [placeholder]="placeholder() || mask()"
        [required]="required()"
        [disabled]="disabled()"
        [readOnly]="readOnly()"
        [attr.aria-label]="labelHidden() ? (label() || null) : null"
        [attr.aria-invalid]="!!error() || null"
        [attr.aria-describedby]="describedBy()"
        (input)="onInput($event)"
        (blur)="onBlur()"
      />
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </div>
  `,
})
export class EmrMaskedInputComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly placeholder = input('');
  readonly mask = input.required<string>();
  readonly value = input<string | null>(null);
  readonly unmask = input(false, { transform: booleanAttribute });
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<string | null>();
  readonly completed = output<string>();
  readonly cleared = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-masked-${++nextWave2FormattedId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly maskState = computed(() => applyInputMask(this.value(), this.mask()));
  protected readonly maskedDisplay = computed(() => this.maskState().masked);

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
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('maskEl');
  private needsDomSync = false;

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
    const result = applyInputMask(target.value, this.mask());
    if (target.value !== result.masked) {
      target.value = result.masked;
    }
    this.scheduleDomSync();
    const emitted = this.unmask() ? result.unmasked : result.masked;
    this.valueChange.emit(emitted.length > 0 ? emitted : null);
    if (result.complete && emitted.length > 0) {
      this.completed.emit(emitted);
    }
  }

  protected clearValue(): void {
    if (this.readOnly() || this.disabled()) return;
    this.scheduleDomSync();
    this.valueChange.emit(null);
    this.cleared.emit();
  }

  protected onBlur(): void {
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
    if (el.value !== expected) el.value = expected;
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
      [attr.aria-invalid]="!!error() || null"
      [attr.aria-describedby]="describedBy()"
    >
      <legend class="emr-field__label" [class.emr-sr-only]="labelHidden()">
        {{ label() || 'Verification code' }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </legend>
      <div class="emr-otp-row">
        @for (slot of slots(); track idx; let idx = $index) {
          <input
            #slotInput
            class="emr-otp-slot"
            [attr.type]="secret() ? 'password' : 'text'"
            [attr.inputmode]="numericOnly() ? 'numeric' : 'text'"
            autocomplete="one-time-code"
            maxlength="1"
            [value]="slot"
            [disabled]="disabled()"
            [readOnly]="readOnly()"
            [attr.aria-label]="(label() || 'Digit') + ' ' + (idx + 1) + ' of ' + length()"
            (input)="onSlotInput(idx, $event)"
            (keydown)="onSlotKeydown(idx, $event)"
            (paste)="onSlotPaste(idx, $event)"
            (blur)="syncDom()"
          />
        }
      </div>
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </fieldset>
  `,
})
export class EmrOtpInputComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly value = input<string | null>('');
  readonly length = input(6);
  readonly numericOnly = input(true, { transform: booleanAttribute });
  readonly secret = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<string>();
  readonly completed = output<string>();

  private readonly fallbackId = `emr-otp-${++nextWave2FormattedId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly slots = computed(() => normalizeOtpSlots(this.value(), this.length()));

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly slotRefs = viewChildren<ElementRef<HTMLInputElement>>('slotInput');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onSlotInput(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    const result = applyOtpSlotEdit(
      this.value(),
      index,
      target.value,
      this.length(),
      this.numericOnly(),
    );
    this.scheduleDomSync();
    this.valueChange.emit(result.value);
    if (result.completed) {
      this.completed.emit(result.value);
    }
    this.focusSlot(result.nextFocusIndex);
  }

  protected onSlotKeydown(index: number, event: KeyboardEvent): void {
    if (this.disabled()) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.focusSlot(Math.max(0, index - 1));
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.focusSlot(Math.min(this.length() - 1, index + 1));
      return;
    }
    if (event.key === 'Backspace' && !this.readOnly()) {
      const currentSlots = this.slots();
      if (!currentSlots[index] && index > 0) {
        event.preventDefault();
        const prevIdx = index - 1;
        const result = applyOtpSlotEdit(
          this.value(),
          prevIdx,
          '',
          this.length(),
          this.numericOnly(),
        );
        this.scheduleDomSync();
        this.valueChange.emit(result.value);
        this.focusSlot(prevIdx);
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
      this.length(),
      this.numericOnly(),
    );
    this.scheduleDomSync();
    this.valueChange.emit(result.value);
    if (result.completed) {
      this.completed.emit(result.value);
    }
    this.focusSlot(result.nextFocusIndex);
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
