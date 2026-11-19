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
import type {
  EmrBadge,
  EmrCheckboxLabelPlacement,
  EmrCheckboxSize,
  EmrCheckboxVariant,
  EmrOption,
  EmrRadioGroupLabelPlacement,
  EmrRadioGroupOrientation,
  EmrRadioGroupSize,
  EmrRadioGroupVariant,
  EmrToggleLabelPlacement,
  EmrToggleSize,
  EmrToggleVariant,
} from '@drguptavivek/emr-controller';
import {
  canClearRadioGroupValue,
  canMutateEmrToggle,
  groupOptions,
  isRadioOptionLocked,
  moveRadioGroupFocusIndex,
  normalizeEmrToggleLabelPlacement,
  normalizeEmrToggleSize,
  normalizeEmrToggleVariant,
  normalizeRadioGroupVariant,
  resolveEmrToggleChecked,
  resolveEmrToggleNext,
  resolveEmrToggleValidationState,
  resolveRadioGroupTabStopValue,
} from './emr-wave2.logic';

let nextChoiceId = 0;

@Component({
  selector: 'emr-checkbox',
  standalone: true,
  template: `
    <div class="emr-field">
      <label
        class="emr-checkbox"
        [class.emr-checkbox--tile]="variant() === 'tile'"
        [class.emr-checkbox--inline]="variant() === 'inline'"
        [class.emr-checkbox--sm]="size() === 'sm'"
        [class.emr-choice--label-start]="labelPlacement() === 'start'"
        [class.emr-choice--space-between]="labelPlacement() === 'space-between'"
        [attr.data-checked]="!mixed() && isChecked() ? 'true' : null"
        [attr.data-mixed]="mixed() ? 'true' : null"
        [attr.data-invalid]="(invalid() || !!error()) ? 'true' : null"
        [attr.data-warning]="!(invalid() || !!error()) && (hasWarning() || !!warning()) ? 'true' : null"
        [attr.data-readonly]="readOnly() ? 'true' : null"
        [attr.data-disabled]="disabled() ? 'true' : null"
        [attr.data-label-hidden]="labelHidden() ? 'true' : null"
        [for]="resolvedId()"
      >
        <input
          #checkboxInput
          class="emr-checkbox__native"
          type="checkbox"
          [id]="resolvedId()"
          [checked]="isChecked()"
          [indeterminate]="mixed()"
          [required]="required()"
          [disabled]="disabled()"
          [attr.aria-checked]="mixed() ? 'mixed' : isChecked()"
          [attr.aria-required]="required() || null"
          [attr.aria-readonly]="readOnly() || null"
          [attr.aria-invalid]="(invalid() || !!error()) || null"
          [attr.aria-label]="ariaLabel() || (labelHidden() ? (label() || null) : null)"
          [attr.aria-describedby]="describedBy()"
          (click)="onClick($event)"
          (keydown.space)="onSpaceKey($event)"
          (keydown.enter)="onEnterKey($event)"
          (change)="onChange()"
          (focus)="focused.emit()"
          (blur)="onBlur()"
        />
        <span class="emr-checkbox__box" aria-hidden="true">
          @if (mixed()) {
            <svg [attr.width]="size() === 'sm' ? 11 : 12" [attr.height]="size() === 'sm' ? 11 : 12" viewBox="0 0 16 16" fill="none">
              <path d="M3.5 8h9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          } @else if (isChecked()) {
            <svg [attr.width]="size() === 'sm' ? 11 : 12" [attr.height]="size() === 'sm' ? 11 : 12" viewBox="0 0 16 16" fill="none">
              <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          }
        </span>
        @if (!labelHidden()) {
          <span class="emr-checkbox__text">
            <span>
              {{ label() }}
              @if (required()) {
                <span class="emr-field__required" aria-hidden="true">*</span>
              }
            </span>
            @if (description()) {
              <span class="emr-checkbox__description">{{ description() }}</span>
            }
          </span>
        }
      </label>
      @if (hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (warning()) {
        <span class="emr-field__warning" [id]="resolvedId() + '-warning'" role="status">{{ warning() }}</span>
      }
      @if (error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">{{ error() }}</span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrCheckboxComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly description = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly labelPlacement = input<EmrCheckboxLabelPlacement>('end');
  readonly variant = input<EmrCheckboxVariant>('tile');
  readonly size = input<EmrCheckboxSize>('md');
  readonly ariaLabel = input<string>();
  readonly checked = input<boolean | undefined>(undefined);
  readonly value = input<boolean | null | undefined>(undefined);
  readonly mixed = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly warning = input('');
  readonly error = input('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly hasWarning = input(false, { transform: booleanAttribute });
  readonly ariaDescribedBy = input<string | null | undefined>(undefined);

  readonly checkedChange = output<boolean>();
  readonly valueChange = output<boolean>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-checkbox-${++nextChoiceId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  readonly isChecked = computed(() =>
    this.value() !== undefined ? Boolean(this.value()) : Boolean(this.checked()),
  );

  protected readonly describedBy = computed(() => {
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.ariaDescribedBy()) ids.push(this.ariaDescribedBy()!);
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.warning()) ids.push(`${id}-warning`);
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

  protected onSpaceKey(event: Event): void {
    if (this.readOnly() || this.disabled()) {
      event.preventDefault();
      this.syncDom();
    }
  }

  protected onEnterKey(event: Event): void {
    event.preventDefault();
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    const next = this.mixed() ? true : !this.isChecked();
    this.checkedChange.emit(next);
    this.valueChange.emit(next);
  }

  protected onChange(): void {
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    const next = this.mixed() ? true : !this.isChecked();
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

  protected onBlur(): void {
    this.syncDom();
    this.blurred.emit();
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
        [class.emr-toggle--tile]="resolvedVariant() === 'tile'"
        [class.emr-toggle--inline]="resolvedVariant() === 'inline'"
        [class.emr-toggle--sm]="resolvedSize() === 'sm'"
        [class.emr-choice--label-start]="resolvedLabelPlacement() === 'start'"
        [class.emr-choice--space-between]="resolvedLabelPlacement() === 'space-between'"
        [attr.data-checked]="isChecked() ? 'true' : null"
        [attr.data-warning]="validation().hasWarning ? 'true' : null"
        [attr.data-invalid]="validation().isInvalid ? 'true' : null"
        [attr.data-readonly]="readOnly() ? 'true' : null"
        [attr.data-disabled]="disabled() ? 'true' : null"
        [attr.data-loading]="loading() ? 'true' : null"
        [attr.data-label-hidden]="labelHidden() ? 'true' : null"
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
          [attr.aria-checked]="isChecked() ? 'true' : 'false'"
          [attr.aria-required]="required() || null"
          [attr.aria-readonly]="readOnly() || null"
          [attr.aria-busy]="loading() ? 'true' : null"
          [attr.aria-invalid]="validation().isInvalid || null"
          [attr.aria-label]="ariaLabel() || (labelHidden() ? (label() || null) : null)"
          [attr.aria-describedby]="describedBy()"
          (click)="onClick($event)"
          (keydown.space)="onSpaceKey($event)"
          (keydown.enter)="onEnterKey($event)"
          (change)="onChange()"
          (focus)="focused.emit()"
          (blur)="onBlur()"
        />
        <span class="emr-toggle__cluster" aria-hidden="true">
          @if (!labelHidden() && stateLabel() && resolvedLabelPlacement() !== 'end') {
            <span class="emr-toggle__state">{{ stateLabel() }}</span>
          }
          <span class="emr-toggle__track">
            <span class="emr-toggle__thumb">
              @if (loading()) {
                <svg class="emr-toggle__spinner" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-opacity="0.25" stroke-width="2" />
                  <path d="M13.5 8a5.5 5.5 0 0 0-5.5-5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              }
            </span>
          </span>
          @if (!labelHidden() && stateLabel() && resolvedLabelPlacement() === 'end') {
            <span class="emr-toggle__state">{{ stateLabel() }}</span>
          }
        </span>
        @if (!labelHidden()) {
          <span class="emr-checkbox__text">
            <span>
              {{ label() }}
              @if (required()) {
                <span class="emr-field__required" aria-hidden="true">*</span>
              }
            </span>
            @if (description()) {
              <span class="emr-checkbox__description">{{ description() }}</span>
            }
          </span>
        }
      </label>
      @if (!labelHidden()) {
        @if (hint()) {
          <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
        }
        @if (warning()) {
          <span class="emr-field__warning" [id]="resolvedId() + '-warning'" role="status">{{ warning() }}</span>
        }
        @if (error()) {
          <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">{{ error() }}</span>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrToggleComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly description = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly labelPlacement = input<EmrToggleLabelPlacement>('end');
  readonly variant = input<EmrToggleVariant>('tile');
  readonly size = input<EmrToggleSize>('md');
  readonly onLabel = input('');
  readonly offLabel = input('');
  readonly ariaLabel = input<string>();
  readonly checked = input<boolean | undefined>(undefined);
  readonly value = input<boolean | null | undefined>(undefined);
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly warning = input('');
  readonly error = input('');

  readonly checkedChange = output<boolean>();
  readonly valueChange = output<boolean>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-toggle-${++nextChoiceId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  readonly resolvedVariant = computed(() => normalizeEmrToggleVariant(this.variant()));
  readonly resolvedSize = computed(() => normalizeEmrToggleSize(this.size()));
  readonly resolvedLabelPlacement = computed(() => normalizeEmrToggleLabelPlacement(this.labelPlacement()));
  readonly isChecked = computed(() => resolveEmrToggleChecked(this.value(), this.checked()));
  readonly validation = computed(() =>
    resolveEmrToggleValidationState({
      error: this.error(),
      warning: this.warning(),
      invalid: this.invalid(),
    }),
  );
  protected readonly stateLabel = computed(() =>
    this.isChecked() ? this.onLabel() : this.offLabel(),
  );

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.warning()) ids.push(`${id}-warning`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('toggleInput');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync || !canMutateEmrToggle(this.readOnly(), this.disabled(), this.loading())) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onClick(event: MouseEvent): void {
    if (!canMutateEmrToggle(this.readOnly(), this.disabled(), this.loading())) {
      event.preventDefault();
      this.syncDom();
    }
  }

  protected onSpaceKey(event: Event): void {
    if (!canMutateEmrToggle(this.readOnly(), this.disabled(), this.loading())) {
      event.preventDefault();
      this.syncDom();
    }
  }

  protected onEnterKey(event: Event): void {
    event.preventDefault();
    if (!canMutateEmrToggle(this.readOnly(), this.disabled(), this.loading())) {
      this.syncDom();
      return;
    }
    const next = resolveEmrToggleNext(this.isChecked());
    this.checkedChange.emit(next);
    this.valueChange.emit(next);
  }

  protected onChange(): void {
    if (!canMutateEmrToggle(this.readOnly(), this.disabled(), this.loading())) {
      this.syncDom();
      return;
    }
    const next = resolveEmrToggleNext(this.isChecked());
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

  protected onBlur(): void {
    this.syncDom();
    this.blurred.emit();
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
      [attr.aria-label]="ariaLabel() || (labelHidden() ? (label() || null) : null)"
      [attr.aria-required]="required() || null"
      [attr.aria-readonly]="readOnly() || null"
      [attr.aria-invalid]="!!error() || invalid() || null"
      [attr.aria-describedby]="describedBy()"
      (focusin)="onFocusIn()"
      (focusout)="onFocusOut($event)"
    >
      <div class="emr-choice-fieldset__top">
        <legend class="emr-field__label" [class.emr-sr-only]="labelHidden()">
          {{ label() }}
          @if (required()) {
            <span class="emr-field__required" aria-hidden="true">*</span>
          }
        </legend>
        @if (showClear()) {
          <button
            type="button"
            class="emr-choice-clear"
            data-emr-print="hide"
            [attr.aria-label]="clearLabel() + ' ' + (label() || 'selection')"
            (click)="clearSelection()"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
            </svg>
            <span>{{ clearLabel() }}</span>
          </button>
        }
      </div>
      <div
        [class]="listClasses()"
        [attr.data-invalid]="!!error() || invalid() ? 'true' : null"
        [attr.data-warning]="!error() && !invalid() && !!warning() ? 'true' : null"
        [style.--emr-choice-cols]="orientation() === 'grid' ? columns() : null"
      >
        @for (grp of optionGroups(); track grp.label ?? '__ungrouped') {
          @if (grp.label) {
            <div class="emr-choice-group-label" style="grid-column:1 / -1;">{{ grp.label }}</div>
          }
          @for (option of grp.options; track option.value) {
            <label
              style="position:relative;"
              [class]="optionClasses(option)"
              [attr.data-checked]="value() === option.value ? 'true' : null"
              [attr.data-invalid]="!!error() || invalid() ? 'true' : null"
              [attr.data-warning]="!error() && !invalid() && !!warning() ? 'true' : null"
              [attr.data-readonly]="isOptionReadOnly(option) ? 'true' : null"
              [attr.data-disabled]="isOptionDisabled(option) ? 'true' : null"
            >
              <input
                #radioInput
                class="emr-radio__native"
                type="radio"
                [name]="resolvedName()"
                [value]="option.value"
                [checked]="value() === option.value"
                [required]="required()"
                [disabled]="isOptionDisabled(option)"
                [attr.tabindex]="isOptionDisabled(option) ? -1 : option.value === tabStopValue() ? 0 : -1"
                [attr.aria-readonly]="isOptionReadOnly(option) || null"
                (click)="onOptionClick($event, option)"
                (keydown)="onOptionKeydown($event, option)"
                (change)="onOptionChange(option)"
              />
              @if (normalizedVariant() !== 'segmented') {
                <span class="emr-radio__circle" aria-hidden="true">
                  @if (value() === option.value) {
                    <span class="emr-radio__dot"></span>
                  }
                </span>
              }
              <span class="emr-choice-option-copy">
                <span class="emr-choice-option-title">
                  <span>{{ option.label }}</span>
                  @if (optionBadgeText(option); as badgeText) {
                    <span [class]="optionBadgeClasses(option)">{{ badgeText }}</span>
                  }
                </span>
                @if (option.description) {
                  <span class="emr-choice-option-desc">{{ option.description }}</span>
                }
              </span>
            </label>
          }
        }
      </div>
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && warning()) {
        <span class="emr-field__warning" [id]="resolvedId() + '-warning'" role="status">{{ warning() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">{{ error() }}</span>
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
  readonly ariaLabel = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly value = input<string | null>(null);
  readonly options = input<readonly EmrOption[]>([]);
  readonly orientation = input<EmrRadioGroupOrientation>('vertical');
  readonly columns = input<number>(2);
  readonly variant = input<EmrRadioGroupVariant | 'standard'>('tile');
  readonly size = input<EmrRadioGroupSize>('md');
  readonly labelPlacement = input<EmrRadioGroupLabelPlacement>('end');
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input<string>('Clear');
  readonly allowDeselect = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly warning = input('');
  readonly error = input('');

  readonly valueChange = output<string | null>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-radio-${++nextChoiceId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  readonly resolvedName = computed(() => this.name() || this.resolvedId());
  protected readonly normalizedVariant = computed(() => normalizeRadioGroupVariant(this.variant()));
  protected readonly optionGroups = computed(() => groupOptions(this.options()));
  protected readonly tabStopValue = computed(() =>
    resolveRadioGroupTabStopValue(this.options(), this.value(), this.disabled()),
  );
  private hasFocus = false;

  protected readonly showClear = computed(() =>
    canClearRadioGroupValue(
      this.value(),
      this.options(),
      this.clearable(),
      this.readOnly(),
      this.disabled(),
    ),
  );

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.warning()) ids.push(`${id}-warning`);
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

  protected onFocusIn(): void {
    if (!this.hasFocus) {
      this.hasFocus = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const current = event.currentTarget as HTMLElement | null;
    const related = event.relatedTarget as Node | null;
    if (!current || !related || !current.contains(related)) {
      this.hasFocus = false;
      this.syncRadios();
      this.blurred.emit();
    }
  }

  protected isOptionReadOnly(option: EmrOption): boolean {
    return Boolean(this.readOnly() || option.readOnly);
  }

  protected isOptionDisabled(option: EmrOption): boolean {
    return Boolean(this.disabled() || option.disabled);
  }

  protected listClasses(): string {
    const v = this.normalizedVariant();
    const classes: string[] = [];
    if (v === 'segmented') {
      classes.push('emr-radio-segmented');
      if (this.orientation() === 'vertical') classes.push('emr-radio-segmented--vertical');
      if (this.orientation() === 'grid') classes.push('emr-choice-list--grid');
    } else {
      classes.push('emr-choice-list');
      if (this.orientation() === 'horizontal') classes.push('emr-choice-list--horizontal');
      if (this.orientation() === 'grid') classes.push('emr-choice-list--grid');
    }
    return classes.join(' ');
  }

  protected optionClasses(option: EmrOption): string {
    const v = this.normalizedVariant();
    const classes: string[] = [];
    if (v === 'segmented') {
      classes.push('emr-radio-segment');
    } else if (v === 'card') {
      classes.push('emr-choice-card');
    } else if (v === 'pill') {
      classes.push('emr-choice-pill');
    } else if (v === 'inline') {
      classes.push('emr-radio', 'emr-radio--inline');
    } else {
      classes.push('emr-radio', 'emr-radio--tile');
    }
    if (this.size() === 'sm') classes.push('emr-radio--sm');
    if (this.labelPlacement() === 'start') classes.push('emr-choice--label-start');
    if (this.labelPlacement() === 'space-between') classes.push('emr-choice--space-between');
    if (option.tone) classes.push(`emr-choice-tone-${option.tone}`);
    return classes.join(' ');
  }

  protected optionBadgeText(option: EmrOption): string | null {
    const b = option.badge;
    if (!b) return null;
    if (typeof b === 'string') return b;
    return b.label ?? (b.count !== undefined ? String(b.count) : null);
  }

  protected optionBadgeClasses(option: EmrOption): string {
    const b: EmrBadge | string | undefined = option.badge;
    const tone = (typeof b === 'object' && b?.tone) || option.tone || 'neutral';
    const variant = (typeof b === 'object' && b?.variant) || 'soft';
    return `emr-badge emr-badge--sm emr-badge--${variant} emr-tone-${tone}`;
  }

  protected onOptionKeydown(event: KeyboardEvent, option: EmrOption): void {
    const flatOpts = this.options();
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowRight' ||
      event.key === 'ArrowUp' ||
      event.key === 'ArrowLeft'
    ) {
      event.preventDefault();
      const dir = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
      const curIdx = flatOpts.findIndex((o) => o.value === option.value);
      const nextIdx = moveRadioGroupFocusIndex(flatOpts, curIdx, dir, this.disabled());
      if (nextIdx >= 0) {
        const nextOpt = flatOpts[nextIdx]!;
        const targetRef = this.radioRefs().find((r) => r.nativeElement.value === nextOpt.value);
        targetRef?.nativeElement.focus();
        if (!this.readOnly() && !this.disabled() && !isRadioOptionLocked(nextOpt) && this.value() !== nextOpt.value) {
          this.scheduleRadioSync();
          this.valueChange.emit(nextOpt.value);
        } else {
          this.syncRadios();
        }
      }
      return;
    }
    if (this.readOnly() || this.disabled() || isRadioOptionLocked(option)) {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        this.syncRadios();
      }
      return;
    }
    if (event.key === ' ' && this.allowDeselect() && this.value() === option.value) {
      event.preventDefault();
      this.clearSelection();
      return;
    }
    if (event.key === 'Enter' && this.value() !== option.value) {
      event.preventDefault();
      this.scheduleRadioSync();
      this.valueChange.emit(option.value);
    }
  }

  protected onOptionClick(event: MouseEvent, option: EmrOption): void {
    if (this.readOnly() || this.disabled() || isRadioOptionLocked(option)) {
      event.preventDefault();
      this.syncRadios();
      return;
    }
    if (this.allowDeselect() && this.value() === option.value) {
      event.preventDefault();
      this.scheduleRadioSync();
      this.valueChange.emit(null);
      this.cleared.emit();
    }
  }

  protected onOptionChange(option: EmrOption): void {
    if (this.readOnly() || this.disabled() || isRadioOptionLocked(option)) {
      this.syncRadios();
      return;
    }
    this.scheduleRadioSync();
    this.valueChange.emit(option.value);
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
