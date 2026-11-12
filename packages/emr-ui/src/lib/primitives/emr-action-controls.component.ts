import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import type { EmrOption, EmrSegmentedOption } from '@drguptavivek/emr-controller';
import {
  computeSelectAllState,
  toggleCheckboxGroupValue,
  toggleSelectAllValues,
} from './emr-wave2.logic';

let nextActionControlId = 0;

@Component({
  selector: 'emr-icon-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="emr-icon-button"
      [class]="'emr-icon-button emr-icon-button--' + variant() + ' emr-icon-button--size-' + size()"
      [attr.id]="controlId() || null"
      [attr.type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-pressed]="pressed() === undefined ? null : pressed()"
      [attr.aria-busy]="loading() || null"
      (click)="onClick()"
    >
      @if (loading()) {
        <span aria-hidden="true">•••</span>
      } @else if (icon()) {
        <span aria-hidden="true">{{ icon() }}</span>
      }
      <ng-content />
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .emr-icon-button {
        box-sizing: border-box;
        min-width: 44px;
        min-height: 44px;
        padding: 0 10px;
        border-width: 1px;
        border-style: solid;
        border-radius: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        font: inherit;
        font-size: var(--emr-text-md);
        font-weight: var(--emr-weight-bold);
        cursor: pointer;
      }
      .emr-icon-button--size-lg {
        min-width: 48px;
        min-height: 48px;
        font-size: var(--emr-text-lg);
      }
      .emr-icon-button--size-sm {
        font-size: var(--emr-text-sm);
      }
      .emr-icon-button:focus-visible {
        outline: 3px solid var(--emr-focus);
        outline-offset: 2px;
      }
      .emr-icon-button:disabled {
        opacity: 0.52;
        cursor: not-allowed;
      }
    `,
  ],
})
export class EmrIconButtonComponent {
  readonly controlId = input<string>();
  readonly ariaLabel = input.required<string>();
  readonly icon = input<string>();
  readonly variant = input<'ghost' | 'outline' | 'secondary' | 'primary' | 'danger'>('ghost');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly pressed = input<boolean | undefined>(undefined);
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  readonly clicked = output<void>();

  protected onClick(): void {
    if (this.disabled() || this.loading()) return;
    this.clicked.emit();
  }
}

@Component({
  selector: 'emr-segmented-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="emr-field">
      @if (label() || showClear()) {
        <div [class.emr-choice-header]="showClear()">
          @if (label()) {
            <span
              class="emr-field__label"
              [class.emr-sr-only]="labelHidden()"
              [id]="resolvedId() + '-label'"
            >
              {{ label() }}
            </span>
          }
          @if (showClear()) {
            <button
              type="button"
              class="emr-choice-clear"
              [attr.aria-label]="'Clear ' + (label() || ariaLabel() || 'selection')"
              (click)="clearSelection()"
            >
              {{ clearLabel() }}
            </button>
          }
        </div>
      }
      <div
        class="emr-segmented"
        [id]="resolvedId()"
        role="radiogroup"
        [attr.aria-labelledby]="label() ? resolvedId() + '-label' : null"
        [attr.aria-label]="!label() ? ariaLabel() || 'Options' : null"
        [attr.aria-readonly]="readOnly() || null"
        [attr.aria-invalid]="!!error() || null"
        [attr.aria-describedby]="describedBy()"
      >
        @for (option of options(); track option.value) {
          <button
            #segmentBtn
            type="button"
            role="radio"
            class="emr-segmented__item"
            [disabled]="disabled() || !!option.disabled"
            [attr.aria-checked]="value() === option.value"
            [attr.aria-readonly]="readOnly() || null"
            [attr.tabindex]="tabStopValue() === option.value ? 0 : -1"
            (click)="onSelect(option)"
            (keydown)="onKeydown($event, option.value)"
          >
            <span>{{ option.label }}</span>
            @if (option.badge) {
              <span class="emr-badge emr-tone-neutral">{{ option.badge }}</span>
            }
          </button>
        }
      </div>
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </div>
  `,
})
export class EmrSegmentedControlComponent {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string>();
  readonly options = input<readonly EmrSegmentedOption[]>([]);
  readonly value = input<string | null>(null);
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly allowDeselect = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<string | null>();
  readonly cleared = output<void>();

  private readonly fallbackId = `emr-segmented-${++nextActionControlId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

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

  protected readonly tabStopValue = computed(() => {
    const enabled = this.options().filter((o) => !o.disabled);
    const current = this.value();
    if (current && enabled.some((o) => o.value === current)) return current;
    return enabled[0]?.value ?? null;
  });

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly segmentButtons = viewChildren<ElementRef<HTMLButtonElement>>('segmentBtn');

  protected onSelect(option: EmrSegmentedOption): void {
    if (this.disabled() || this.readOnly() || option.disabled) return;
    if (this.value() === option.value) {
      if (this.allowDeselect()) {
        this.valueChange.emit(null);
        this.cleared.emit();
      }
      return;
    }
    this.valueChange.emit(option.value);
  }

  protected clearSelection(): void {
    if (this.disabled() || this.readOnly()) return;
    this.valueChange.emit(null);
    this.cleared.emit();
  }

  protected onKeydown(event: KeyboardEvent, currentValue: string): void {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return;
    }
    const enabled = this.options().filter((o) => !o.disabled);
    if (!enabled.length) return;
    const currentIndex = Math.max(
      0,
      enabled.findIndex((o) => o.value === currentValue),
    );
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? enabled.length - 1
          : event.key === 'ArrowRight' || event.key === 'ArrowDown'
            ? (currentIndex + 1) % enabled.length
            : (currentIndex - 1 + enabled.length) % enabled.length;
    const target = enabled[nextIndex];
    if (!target) return;
    event.preventDefault();
    if (!this.readOnly() && !this.disabled()) {
      this.valueChange.emit(target.value);
    }
    const enabledButtons = this.segmentButtons()
      .map((ref) => ref.nativeElement)
      .filter((btn) => !btn.disabled);
    enabledButtons[nextIndex]?.focus();
  }
}

@Component({
  selector: 'emr-checkbox-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset
      class="emr-field emr-choice-fieldset"
      [id]="resolvedId()"
      [disabled]="disabled()"
      [attr.aria-invalid]="!!error() || null"
      [attr.aria-describedby]="describedBy()"
    >
      <legend class="emr-field__label" [class.emr-sr-only]="labelHidden()">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </legend>
      @if (showSelectAll()) {
        <div class="emr-choice-header">
          <label class="emr-checkbox">
            <input
              #selectAllInput
              type="checkbox"
              [checked]="selectAllState() === 'all'"
              [indeterminate]="selectAllState() === 'mixed'"
              [disabled]="disabled()"
              [attr.aria-checked]="
                selectAllState() === 'mixed' ? 'mixed' : selectAllState() === 'all'
              "
              [attr.aria-readonly]="readOnly() || null"
              (click)="onOptionClick($event)"
              (change)="onSelectAllToggle()"
            />
            <span>{{ selectAllLabel() }}</span>
          </label>
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
            [class.emr-checkbox]="variant() === 'standard'"
            [class.emr-choice-card]="variant() === 'card'"
            [class.emr-choice-pill]="variant() === 'chip'"
            [attr.data-checked]="
              variant() === 'card' || variant() === 'chip' ? isSelected(option.value) : null
            "
          >
            <input
              #checkInput
              type="checkbox"
              [value]="option.value"
              [checked]="isSelected(option.value)"
              [disabled]="disabled() || !!option.disabled"
              [attr.aria-readonly]="readOnly() || null"
              (click)="onOptionClick($event)"
              (change)="onOptionToggle(option.value)"
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
})
export class EmrCheckboxGroupComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly options = input<readonly EmrOption[]>([]);
  readonly value = input<readonly string[]>([]);
  readonly orientation = input<'vertical' | 'horizontal' | 'grid'>('vertical');
  readonly columns = input<number>(2);
  readonly variant = input<'standard' | 'card' | 'chip'>('standard');
  readonly showSelectAll = input(false, { transform: booleanAttribute });
  readonly selectAllLabel = input('Select all');
  readonly exclusiveValues = input<readonly string[]>([]);
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<readonly string[]>();

  private readonly fallbackId = `emr-checkbox-group-${++nextActionControlId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  private readonly selectedSet = computed(() => new Set(this.value()));
  protected readonly selectAllState = computed(() =>
    computeSelectAllState(this.value(), this.options(), this.exclusiveValues()),
  );

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly selectAllRef = viewChild<ElementRef<HTMLInputElement>>('selectAllInput');
  private readonly checkRefs = viewChildren<ElementRef<HTMLInputElement>>('checkInput');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncChecks();
    }
  }

  protected isSelected(optionValue: string): boolean {
    return this.selectedSet().has(optionValue);
  }

  protected onOptionClick(event: MouseEvent): void {
    if (this.readOnly() || this.disabled()) {
      event.preventDefault();
      this.syncChecks();
    }
  }

  protected onSelectAllToggle(): void {
    if (this.readOnly() || this.disabled()) {
      this.syncChecks();
      return;
    }
    const next = toggleSelectAllValues(this.value(), this.options(), this.exclusiveValues());
    this.scheduleCheckSync();
    this.valueChange.emit(next);
  }

  protected onOptionToggle(optionValue: string): void {
    if (this.readOnly() || this.disabled()) {
      this.syncChecks();
      return;
    }
    const next = toggleCheckboxGroupValue(
      this.value(),
      optionValue,
      this.options(),
      this.exclusiveValues(),
    );
    this.scheduleCheckSync();
    this.valueChange.emit(next);
  }

  private scheduleCheckSync(): void {
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncChecks();
      }
    });
  }

  private syncChecks(): void {
    const selected = this.selectedSet();
    for (const ref of this.checkRefs()) {
      const el = ref.nativeElement;
      const expected = selected.has(el.value);
      if (el.checked !== expected) el.checked = expected;
    }
    const allEl = this.selectAllRef()?.nativeElement;
    if (allEl) {
      const state = this.selectAllState();
      const expectedChecked = state === 'all';
      const expectedIndeterminate = state === 'mixed';
      if (allEl.checked !== expectedChecked) allEl.checked = expectedChecked;
      if (allEl.indeterminate !== expectedIndeterminate) {
        allEl.indeterminate = expectedIndeterminate;
      }
    }
  }
}

@Component({
  selector: 'emr-toggle-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset
      class="emr-field emr-choice-fieldset"
      [id]="resolvedId()"
      [disabled]="disabled()"
      [attr.aria-invalid]="!!error() || null"
      [attr.aria-describedby]="describedBy()"
    >
      <legend class="emr-field__label" [class.emr-sr-only]="labelHidden()">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </legend>
      @if (showSelectAll()) {
        <div class="emr-choice-header">
          <label class="emr-checkbox">
            <input
              #selectAllInput
              type="checkbox"
              [checked]="selectAllState() === 'all'"
              [indeterminate]="selectAllState() === 'mixed'"
              [disabled]="disabled()"
              [attr.aria-checked]="
                selectAllState() === 'mixed' ? 'mixed' : selectAllState() === 'all'
              "
              [attr.aria-readonly]="readOnly() || null"
              (click)="onOptionClick($event)"
              (change)="onSelectAllToggle()"
            />
            <span>{{ selectAllLabel() }}</span>
          </label>
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
            class="emr-toggle"
            [class.emr-choice-card]="variant() === 'card'"
            [class.emr-choice--label-start]="labelPlacement() === 'start'"
            [class.emr-choice--space-between]="labelPlacement() === 'space-between'"
            [attr.data-checked]="variant() === 'card' ? isSelected(option.value) : null"
          >
            <input
              #toggleInput
              type="checkbox"
              role="switch"
              [value]="option.value"
              [checked]="isSelected(option.value)"
              [disabled]="disabled() || !!option.disabled"
              [attr.aria-checked]="isSelected(option.value)"
              [attr.aria-readonly]="readOnly() || null"
              (click)="onOptionClick($event)"
              (change)="onOptionToggle(option.value)"
            />
            <span class="emr-toggle__track" aria-hidden="true">
              <span class="emr-toggle__thumb"></span>
            </span>
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
})
export class EmrToggleGroupComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly options = input<readonly EmrOption[]>([]);
  readonly value = input<readonly string[]>([]);
  readonly orientation = input<'vertical' | 'horizontal' | 'grid'>('vertical');
  readonly columns = input<number>(2);
  readonly variant = input<'standard' | 'card'>('standard');
  readonly labelPlacement = input<'end' | 'start' | 'space-between'>('space-between');
  readonly showSelectAll = input(false, { transform: booleanAttribute });
  readonly selectAllLabel = input('Enable all');
  readonly exclusiveValues = input<readonly string[]>([]);
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<readonly string[]>();

  private readonly fallbackId = `emr-toggle-group-${++nextActionControlId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  private readonly selectedSet = computed(() => new Set(this.value()));
  protected readonly selectAllState = computed(() =>
    computeSelectAllState(this.value(), this.options(), this.exclusiveValues()),
  );

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly selectAllRef = viewChild<ElementRef<HTMLInputElement>>('selectAllInput');
  private readonly toggleRefs = viewChildren<ElementRef<HTMLInputElement>>('toggleInput');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncToggles();
    }
  }

  protected isSelected(optionValue: string): boolean {
    return this.selectedSet().has(optionValue);
  }

  protected onOptionClick(event: MouseEvent): void {
    if (this.readOnly() || this.disabled()) {
      event.preventDefault();
      this.syncToggles();
    }
  }

  protected onSelectAllToggle(): void {
    if (this.readOnly() || this.disabled()) {
      this.syncToggles();
      return;
    }
    const next = toggleSelectAllValues(this.value(), this.options(), this.exclusiveValues());
    this.scheduleToggleSync();
    this.valueChange.emit(next);
  }

  protected onOptionToggle(optionValue: string): void {
    if (this.readOnly() || this.disabled()) {
      this.syncToggles();
      return;
    }
    const next = toggleCheckboxGroupValue(
      this.value(),
      optionValue,
      this.options(),
      this.exclusiveValues(),
    );
    this.scheduleToggleSync();
    this.valueChange.emit(next);
  }

  private scheduleToggleSync(): void {
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncToggles();
      }
    });
  }

  private syncToggles(): void {
    const selected = this.selectedSet();
    for (const ref of this.toggleRefs()) {
      const el = ref.nativeElement;
      const expected = selected.has(el.value);
      if (el.checked !== expected) el.checked = expected;
    }
    const allEl = this.selectAllRef()?.nativeElement;
    if (allEl) {
      const state = this.selectAllState();
      const expectedChecked = state === 'all';
      const expectedIndeterminate = state === 'mixed';
      if (allEl.checked !== expectedChecked) allEl.checked = expectedChecked;
      if (allEl.indeterminate !== expectedIndeterminate) {
        allEl.indeterminate = expectedIndeterminate;
      }
    }
  }
}
