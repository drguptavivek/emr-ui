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
import type { EmrOption } from '@drguptavivek/emr-controller';

let nextChoiceId = 0;

@Component({
  selector: 'emr-checkbox',
  standalone: true,
  template: `
    <div class="emr-field">
      <label
        class="emr-checkbox"
        [class.emr-choice--label-start]="labelPlacement() === 'start'"
        [class.emr-choice--space-between]="labelPlacement() === 'space-between'"
        [for]="resolvedId()"
      >
        <input
          #checkboxInput
          type="checkbox"
          [id]="resolvedId()"
          [checked]="isChecked()"
          [indeterminate]="mixed()"
          [required]="required()"
          [disabled]="disabled()"
          [attr.aria-checked]="mixed() ? 'mixed' : isChecked()"
          [attr.aria-readonly]="readOnly() || null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-label]="ariaLabel() || (labelHidden() ? (label() || null) : null)"
          [attr.aria-describedby]="describedBy()"
          (click)="onClick($event)"
          (change)="onChange($event)"
          (blur)="syncDom()"
        />
        <span [class.emr-sr-only]="labelHidden()">
          {{ label() }}
          @if (required()) {
            <span class="emr-field__required" aria-hidden="true">*</span>
          }
        </span>
      </label>
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
export class EmrCheckboxComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly labelPlacement = input<'end' | 'start' | 'space-between'>('end');
  readonly ariaLabel = input<string>();
  readonly checked = input<boolean | undefined>(undefined);
  readonly value = input<boolean | undefined>(undefined);
  readonly mixed = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly checkedChange = output<boolean>();
  readonly valueChange = output<boolean>();

  private readonly fallbackId = `emr-checkbox-${++nextChoiceId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  readonly isChecked = computed(() => Boolean(this.value() ?? this.checked()));

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('checkboxInput');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onClick(event: MouseEvent): void {
    if (this.readOnly() || this.disabled()) {
      event.preventDefault();
      this.syncDom();
    }
  }

  protected onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    const next = target.checked;
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom();
      }
    });
    this.checkedChange.emit(next);
    this.valueChange.emit(next);
  }

  protected syncDom(): void {
    const el = this.inputRef()?.nativeElement;
    if (!el) return;
    const expectedChecked = this.isChecked();
    const expectedIndeterminate = this.mixed();
    if (el.checked !== expectedChecked) el.checked = expectedChecked;
    if (el.indeterminate !== expectedIndeterminate) el.indeterminate = expectedIndeterminate;
  }
}

@Component({
  selector: 'emr-toggle',
  standalone: true,
  template: `
    <div class="emr-field">
      <label
        class="emr-toggle"
        [class.emr-choice--label-start]="labelPlacement() === 'start'"
        [class.emr-choice--space-between]="labelPlacement() === 'space-between'"
        [for]="resolvedId()"
      >
        <input
          #toggleInput
          type="checkbox"
          role="switch"
          [id]="resolvedId()"
          [checked]="isChecked()"
          [required]="required()"
          [disabled]="disabled()"
          [attr.aria-checked]="isChecked()"
          [attr.aria-readonly]="readOnly() || null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-label]="ariaLabel() || (labelHidden() ? (label() || null) : null)"
          [attr.aria-describedby]="describedBy()"
          (click)="onClick($event)"
          (change)="onChange($event)"
          (blur)="syncDom()"
        />
        <span class="emr-toggle__track" aria-hidden="true"><span class="emr-toggle__thumb"></span></span>
        <span class="emr-choice-option-copy">
          <span [class.emr-sr-only]="labelHidden()">
            {{ label() }}
            @if (required()) {
              <span class="emr-field__required" aria-hidden="true">*</span>
            }
          </span>
          @if (stateLabel()) {
            <span class="emr-choice-option-desc">{{ stateLabel() }}</span>
          }
        </span>
      </label>
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
export class EmrToggleComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly labelPlacement = input<'end' | 'start' | 'space-between'>('end');
  readonly onLabel = input('');
  readonly offLabel = input('');
  readonly ariaLabel = input<string>();
  readonly checked = input<boolean | undefined>(undefined);
  readonly value = input<boolean | undefined>(undefined);
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly checkedChange = output<boolean>();
  readonly valueChange = output<boolean>();

  private readonly fallbackId = `emr-toggle-${++nextChoiceId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  readonly isChecked = computed(() => Boolean(this.value() ?? this.checked()));
  protected readonly stateLabel = computed(() =>
    this.isChecked() ? this.onLabel() : this.offLabel(),
  );

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('toggleInput');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onClick(event: MouseEvent): void {
    if (this.readOnly() || this.disabled()) {
      event.preventDefault();
      this.syncDom();
    }
  }

  protected onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    const next = target.checked;
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom();
      }
    });
    this.checkedChange.emit(next);
    this.valueChange.emit(next);
  }

  protected syncDom(): void {
    const el = this.inputRef()?.nativeElement;
    if (!el) return;
    const expected = this.isChecked();
    if (el.checked !== expected) el.checked = expected;
  }
}

@Component({
  selector: 'emr-radio-group',
  standalone: true,
  template: `
    <fieldset
      class="emr-field emr-choice-fieldset"
      [id]="resolvedId()"
      [disabled]="disabled()"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-invalid]="!!error() || null"
    >
      <legend class="emr-field__label" [class.emr-sr-only]="labelHidden()">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </legend>
      @if (showClear()) {
        <div class="emr-choice-header">
          <button
            type="button"
            class="emr-choice-clear"
            (click)="clearSelection()"
          >
            {{ clearLabel() }}
          </button>
        </div>
      }
      <div
        class="emr-choice-list"
        [class.emr-choice-list--horizontal]="orientation() === 'horizontal'"
        [class.emr-choice-list--grid]="orientation() === 'grid'"
        [style.--emr-choice-cols]="orientation() === 'grid' ? columns() : null"
      >
        @for (option of options(); track option.value) {
          <label
            [class.emr-radio]="variant() === 'standard'"
            [class.emr-choice-card]="variant() === 'card'"
            [class.emr-choice-pill]="variant() === 'pill'"
            [attr.data-checked]="
              variant() === 'card' || variant() === 'pill'
                ? value() === option.value
                : null
            "
          >
            <input
              #radioInput
              type="radio"
              [name]="resolvedName()"
              [value]="option.value"
              [checked]="value() === option.value"
              [required]="required()"
              [disabled]="disabled() || !!option.disabled"
              [attr.aria-readonly]="readOnly() || null"
              (click)="onOptionClick($event, option.value)"
              (change)="onOptionChange(option.value)"
            />
            <span class="emr-choice-option-copy">
              <span>{{ option.label }}</span>
              @if (option.description) {
                <span class="emr-choice-option-desc">{{ option.description }}</span>
              }
            </span>
          </label>
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrRadioGroupComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly name = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly value = input<string | null>(null);
  readonly options = input<readonly EmrOption[]>([]);
  readonly orientation = input<'vertical' | 'horizontal' | 'grid'>('vertical');
  readonly columns = input<number>(2);
  readonly variant = input<'standard' | 'card' | 'pill'>('standard');
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly allowDeselect = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<string | null>();
  readonly cleared = output<void>();

  private readonly fallbackId = `emr-radio-${++nextChoiceId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  readonly resolvedName = computed(() => this.name() || this.resolvedId());

  protected readonly showClear = computed(() => {
    const val = this.value();
    return Boolean(
      this.clearable() &&
        val !== null &&
        val !== undefined &&
        val !== '' &&
        !this.readOnly() &&
        !this.disabled(),
    );
  });

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly radioRefs = viewChildren<ElementRef<HTMLInputElement>>('radioInput');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncRadios();
    }
  }

  protected onOptionClick(event: MouseEvent, optionValue: string): void {
    if (this.readOnly() || this.disabled()) {
      event.preventDefault();
      this.syncRadios();
      return;
    }
    if (this.allowDeselect() && this.value() === optionValue) {
      event.preventDefault();
      this.scheduleRadioSync();
      this.valueChange.emit(null);
      this.cleared.emit();
    }
  }

  protected onOptionChange(optionValue: string): void {
    if (this.readOnly() || this.disabled()) {
      this.syncRadios();
      return;
    }
    this.scheduleRadioSync();
    this.valueChange.emit(optionValue);
  }

  protected clearSelection(): void {
    if (this.readOnly() || this.disabled()) return;
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
      const shouldCheck = el.value === active;
      if (el.checked !== shouldCheck) el.checked = shouldCheck;
    }
  }
}
