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
import type {
  EmrBadge,
  EmrCheckboxGroupLabelPlacement,
  EmrCheckboxGroupOrientation,
  EmrCheckboxGroupSize,
  EmrCheckboxGroupVariant,
  EmrOption,
  EmrSegmentedBadgePresentation,
  EmrSegmentedOption,
  EmrSegmentedOrientation,
  EmrSegmentedShape,
  EmrSegmentedSize,
  EmrSegmentedVariant,
  EmrToggleGroupLabelPlacement,
  EmrToggleGroupOrientation,
  EmrToggleGroupSize,
  EmrToggleGroupVariant,
} from '@drguptavivek/emr-controller';
import {
  canClearEmrSegmentedControl,
  clearCheckboxGroupValue,
  clearEmrToggleGroupValues,
  computeSelectAllState,
  formatCheckboxSelectionCount,
  formatEmrSegmentedBadge,
  groupOptions,
  isCheckboxOptionBlockedByMax,
  isCheckboxOptionLocked,
  isEmrSegmentedOptionDisabled,
  moveEmrSegmentedFocusIndex,
  normalizeCheckboxGroupVariant,
  normalizeEmrSegmentedOrientation,
  normalizeEmrSegmentedShape,
  normalizeEmrSegmentedSize,
  normalizeEmrSegmentedVariant,
  normalizeEmrToggleGroupLabelPlacement,
  normalizeEmrToggleGroupOrientation,
  normalizeEmrToggleGroupSize,
  normalizeEmrToggleGroupVariant,
  resolveEmrSegmentedSelectAction,
  resolveEmrSegmentedTabStopValue,
  resolveEmrSegmentedValidationState,
  resolveEmrToggleGroupValues,
  resolveEmrToggleStateLabel,
  toggleCheckboxGroupValue,
  toggleEmrToggleGroupValue,
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
    <div
      class="emr-field"
      (focusin)="onFocusIn()"
      (focusout)="onFocusOut($event)"
    >
      @if (label() || showClear()) {
        <div [class.emr-choice-header]="showClear()">
          @if (label()) {
            <span
              class="emr-field__label"
              [class.emr-sr-only]="labelHidden()"
              [id]="resolvedId() + '-label'"
            >
              {{ label() }}
              @if (required()) {
                <span class="emr-field__required" aria-hidden="true">*</span>
              }
            </span>
          } @else if (showClear()) {
            <span></span>
          }
          @if (showClear()) {
            <button
              type="button"
              class="emr-choice-clear"
              data-emr-print="hide"
              [attr.aria-label]="clearLabel() + ' ' + (label() || ariaLabel() || 'selection')"
              (click)="clearSelection()"
            >
              <svg class="emr-segmented__clear-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
              </svg>
              <span>{{ clearLabel() }}</span>
            </button>
          }
        </div>
      }
      <div
        class="emr-segmented"
        [class.emr-segmented--sm]="resolvedSize() === 'sm'"
        [class.emr-segmented--lg]="resolvedSize() === 'lg'"
        [class.emr-segmented--outline]="resolvedVariant() === 'outline'"
        [class.emr-segmented--soft]="resolvedVariant() === 'soft'"
        [class.emr-segmented--pill]="resolvedShape() === 'pill'"
        [class.emr-segmented--vertical]="resolvedOrientation() === 'vertical'"
        [class.emr-segmented--full-width]="fullWidth()"
        [class.emr-segmented--invalid]="validationState().isInvalid"
        [class.emr-segmented--warning]="validationState().hasWarning"
        [class.emr-segmented--readonly]="readOnly()"
        [class.emr-segmented--disabled]="disabled()"
        [id]="resolvedId()"
        role="radiogroup"
        [attr.data-name]="name() || null"
        [attr.data-invalid]="validationState().isInvalid ? 'true' : null"
        [attr.data-warning]="validationState().hasWarning ? 'true' : null"
        [attr.data-readonly]="readOnly() ? 'true' : null"
        [attr.data-disabled]="disabled() ? 'true' : null"
        [attr.aria-labelledby]="ariaLabelledBy() || (!ariaLabel() && !labelHidden() && label() ? resolvedId() + '-label' : null)"
        [attr.aria-label]="ariaLabel() || (!ariaLabelledBy() ? (labelHidden() ? (label() || 'Options') : (!label() ? 'Options' : null)) : null)"
        [attr.aria-required]="required() || null"
        [attr.aria-disabled]="disabled() || null"
        [attr.aria-orientation]="resolvedOrientation()"
        [attr.aria-readonly]="readOnly() || null"
        [attr.aria-invalid]="validationState().isInvalid || null"
        [attr.aria-describedby]="describedBy()"
      >
        @for (option of options(); track option.value; let idx = $index) {
          <button
            #segmentBtn
            type="button"
            role="radio"
            class="emr-segmented__item"
            [class.emr-segmented__item--has-desc]="!!option.description"
            [disabled]="isOptionDisabled(option)"
            [attr.data-tone]="option.tone || null"
            [attr.data-readonly]="option.readOnly ? 'true' : null"
            [attr.aria-label]="option.ariaLabel || null"
            [attr.aria-checked]="value() === option.value"
            [attr.aria-readonly]="readOnly() || option.readOnly || null"
            [attr.tabindex]="tabStopValue() === option.value ? 0 : -1"
            (click)="onSelect(option)"
            (keydown)="onKeydown($event, idx, option)"
          >
            @if (option.icon) {
              <svg
                class="emr-segmented__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                @switch (option.icon) {
                  @case ('eye') {
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  }
                  @case ('eye-off') {
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.4 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  }
                  @case ('lock') {
                    <rect x="4" y="11" width="16" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  }
                  @case ('check') {
                    <polyline points="20 6 9 17 4 12" />
                  }
                  @case ('warning') {
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  }
                  @case ('info') {
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  }
                  @case ('danger') {
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  }
                  @case ('clock') {
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15.5 14" />
                  }
                  @case ('calendar') {
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  }
                  @case ('star') {
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  }
                  @case ('user') {
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  }
                  @default {
                    <circle cx="12" cy="12" r="7" />
                  }
                }
              </svg>
            }
            <span class="emr-segmented__content">
              <span class="emr-segmented__label">{{ option.label }}</span>
              @if (option.description) {
                <span class="emr-segmented__desc">{{ option.description }}</span>
              }
            </span>
            @if (optionBadge(option); as badge) {
              <span [class]="'emr-badge emr-badge--sm emr-badge--' + badge.variant + ' emr-tone-' + badge.tone">
                {{ badge.text }}
              </span>
            }
          </button>
        }
      </div>
      @if (hint()) {
        <span
          class="emr-field__hint"
          [class.emr-sr-only]="labelHidden()"
          [id]="resolvedId() + '-hint'"
        >{{ hint() }}</span>
      }
      @if (validationState().hasWarning && warning()) {
        <span
          class="emr-field__warning"
          [class.emr-sr-only]="labelHidden()"
          [id]="resolvedId() + '-warning'"
          role="status"
        >{{ warning() }}</span>
      }
      @if (error()) {
        <span
          class="emr-field__error"
          [class.emr-sr-only]="labelHidden()"
          [id]="resolvedId() + '-error'"
          role="alert"
        >{{ error() }}</span>
      }
    </div>
  `,
})
export class EmrSegmentedControlComponent {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string>();
  readonly ariaLabelledBy = input<string | null | undefined>(undefined);
  readonly ariaDescribedBy = input<string | null | undefined>(undefined);
  readonly options = input<readonly EmrSegmentedOption[]>([]);
  readonly value = input<string | null>(null);
  readonly size = input<EmrSegmentedSize>('md');
  readonly variant = input<EmrSegmentedVariant>('default');
  readonly shape = input<EmrSegmentedShape>('default');
  readonly orientation = input<EmrSegmentedOrientation>('horizontal');
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly name = input<string | undefined>(undefined);
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly allowDeselect = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly hasWarning = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly warning = input('');
  readonly error = input('');

  readonly valueChange = output<string | null>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-segmented-${++nextActionControlId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  private isFocusedInside = false;

  protected readonly resolvedSize = computed(() => normalizeEmrSegmentedSize(this.size()));
  protected readonly resolvedVariant = computed(() => normalizeEmrSegmentedVariant(this.variant()));
  protected readonly resolvedShape = computed(() => normalizeEmrSegmentedShape(this.shape()));
  protected readonly resolvedOrientation = computed(() => normalizeEmrSegmentedOrientation(this.orientation()));
  protected readonly validationState = computed(() =>
    resolveEmrSegmentedValidationState({
      error: this.error(),
      warning: this.warning(),
      invalid: this.invalid(),
      hasWarning: this.hasWarning(),
    }),
  );

  protected readonly showClear = computed(() =>
    canClearEmrSegmentedControl({
      clearable: this.clearable(),
      value: this.value(),
      disabled: this.disabled(),
      readOnly: this.readOnly(),
    }),
  );

  protected readonly tabStopValue = computed(() =>
    resolveEmrSegmentedTabStopValue(this.options(), this.value(), this.disabled()),
  );

  protected readonly describedBy = computed(() => {
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.ariaDescribedBy()) ids.push(this.ariaDescribedBy()!);
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.validationState().hasWarning && this.warning()) ids.push(`${id}-warning`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly segmentButtons = viewChildren<ElementRef<HTMLButtonElement>>('segmentBtn');

  protected isOptionDisabled(option: EmrSegmentedOption): boolean {
    return isEmrSegmentedOptionDisabled(option, this.disabled());
  }

  protected optionBadge(option: EmrSegmentedOption): EmrSegmentedBadgePresentation | null {
    return formatEmrSegmentedBadge(option.badge, option.tone);
  }

  protected onSelect(option: EmrSegmentedOption): void {
    const action = resolveEmrSegmentedSelectAction({
      option,
      currentValue: this.value(),
      allowDeselect: this.allowDeselect(),
      groupDisabled: this.disabled(),
      groupReadOnly: this.readOnly(),
    });
    if (action.kind === 'select') {
      this.valueChange.emit(action.value);
    } else if (action.kind === 'clear') {
      this.valueChange.emit(null);
      this.cleared.emit();
    }
  }

  protected clearSelection(): void {
    if (this.disabled() || this.readOnly()) return;
    this.valueChange.emit(null);
    this.cleared.emit();
  }

  protected onFocusIn(): void {
    if (!this.isFocusedInside) {
      this.isFocusedInside = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const currentTarget = event.currentTarget as HTMLElement | null;
    const relatedTarget = event.relatedTarget as Node | null;
    if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    if (this.isFocusedInside) {
      this.isFocusedInside = false;
      this.blurred.emit();
    }
  }

  protected onKeydown(event: KeyboardEvent, currentIndex: number, option: EmrSegmentedOption): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.onSelect(option);
      return;
    }
    if (
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'ArrowUp' &&
      event.key !== 'ArrowDown' &&
      event.key !== 'Home' &&
      event.key !== 'End'
    ) {
      return;
    }
    const nextIndex = moveEmrSegmentedFocusIndex(
      this.options(),
      currentIndex,
      event.key,
      this.disabled(),
    );
    if (nextIndex < 0) return;
    const target = this.options()[nextIndex];
    if (!target) return;
    event.preventDefault();
    if (!this.readOnly() && !this.disabled() && !target.readOnly) {
      this.valueChange.emit(target.value);
    }
    this.segmentButtons()[nextIndex]?.nativeElement.focus();
  }
}

@Component({
  selector: 'emr-checkbox-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset
      class="emr-field emr-choice-fieldset"
      role="group"
      [id]="resolvedId()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel() || (labelHidden() ? (label() || null) : null)"
      [attr.aria-labelledby]="!ariaLabel() && !labelHidden() && label() ? resolvedId() + '-label' : null"
      [attr.aria-required]="required() || null"
      [attr.aria-readonly]="readOnly() || null"
      [attr.aria-invalid]="isInvalid() || null"
      [attr.aria-describedby]="describedBy()"
      (focusin)="onFocusIn()"
      (focusout)="onFocusOut($event)"
    >
      <div class="emr-choice-fieldset__top">
        <legend
          class="emr-field__label"
          [id]="resolvedId() + '-label'"
          [class.emr-sr-only]="labelHidden()"
        >
          {{ label() }}
          @if (required()) {
            <span class="emr-field__required" aria-hidden="true">*</span>
          }
        </legend>
        @if (!labelHidden() && (showSelectionCount() || showClear())) {
          <div class="emr-choice-header__actions">
            @if (showSelectionCount()) {
              <span class="emr-choice-count">{{ selectionCountText() }}</span>
            }
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
        }
      </div>
      @if (showSelectAll()) {
        <div class="emr-choice-header">
          <label
            class="emr-checkbox emr-checkbox--inline"
            [class.emr-checkbox--sm]="size() === 'sm'"
            [attr.data-checked]="selectAllState() === 'all' ? 'true' : null"
            [attr.data-mixed]="selectAllState() === 'mixed' ? 'true' : null"
            [attr.data-readonly]="readOnly() ? 'true' : null"
            [attr.data-disabled]="disabled() ? 'true' : null"
          >
            <input
              #selectAllInput
              class="emr-checkbox__native"
              type="checkbox"
              [checked]="selectAllState() === 'all'"
              [indeterminate]="selectAllState() === 'mixed'"
              [disabled]="disabled()"
              [attr.aria-checked]="
                selectAllState() === 'mixed' ? 'mixed' : selectAllState() === 'all'
              "
              [attr.aria-readonly]="readOnly() || null"
              (click)="onSelectAllClick($event)"
              (keydown.enter)="onSelectAllEnterKey($event)"
              (change)="onSelectAllToggle()"
            />
            <span class="emr-checkbox__box" aria-hidden="true">
              @if (selectAllState() === 'mixed') {
                <svg [attr.width]="size() === 'sm' ? 11 : 12" [attr.height]="size() === 'sm' ? 11 : 12" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 8h9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              } @else if (selectAllState() === 'all') {
                <svg [attr.width]="size() === 'sm' ? 11 : 12" [attr.height]="size() === 'sm' ? 11 : 12" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              }
            </span>
            <span class="emr-checkbox__text">{{ selectAllLabel() }}</span>
          </label>
        </div>
      }
      <div
        class="emr-choice-list"
        [class.emr-choice-list--horizontal]="orientation() === 'horizontal'"
        [class.emr-choice-list--grid]="orientation() === 'grid'"
        [style.--emr-choice-cols]="orientation() === 'grid' ? columns() : null"
      >
        @for (grp of optionGroups(); track grp.label ?? '__ungrouped') {
          @if (grp.label) {
            <div class="emr-choice-group-label" style="grid-column: 1 / -1;">{{ grp.label }}</div>
          }
          @for (option of grp.options; track option.value) {
            <label
              [class]="optionRowClasses(option)"
              [attr.data-checked]="isSelected(option.value) ? 'true' : null"
              [attr.data-invalid]="isInvalid() ? 'true' : null"
              [attr.data-warning]="!isInvalid() && !!warning() ? 'true' : null"
              [attr.data-readonly]="isOptionReadOnly(option) ? 'true' : null"
              [attr.data-disabled]="isOptionDisabled(option) ? 'true' : null"
              [attr.data-tone]="option.tone || null"
            >
              <input
                #checkInput
                class="emr-checkbox__native"
                type="checkbox"
                [value]="option.value"
                [checked]="isSelected(option.value)"
                [disabled]="isOptionDisabled(option)"
                [attr.aria-readonly]="isOptionReadOnly(option) || null"
                (click)="onOptionClick($event, option)"
                (keydown.enter)="onOptionEnterKey($event, option)"
                (change)="onOptionToggle(option.value)"
              />
              <span class="emr-checkbox__box" aria-hidden="true">
                @if (isSelected(option.value)) {
                  <svg [attr.width]="size() === 'sm' ? 11 : 12" [attr.height]="size() === 'sm' ? 11 : 12" viewBox="0 0 16 16" fill="none">
                    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                }
              </span>
              <span class="emr-choice-option-copy">
                <span class="emr-choice-option-title">
                  <span>{{ option.label }}</span>
                  @if (optionBadgeText(option)) {
                    <span [class]="optionBadgeClasses(option)">{{ optionBadgeText(option) }}</span>
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
})
export class EmrCheckboxGroupComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly ariaLabel = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly options = input<readonly EmrOption[]>([]);
  readonly value = input<readonly string[]>([]);
  readonly orientation = input<EmrCheckboxGroupOrientation>('vertical');
  readonly columns = input<number>(2);
  readonly variant = input<EmrCheckboxGroupVariant | 'standard'>('tile');
  readonly size = input<EmrCheckboxGroupSize>('md');
  readonly labelPlacement = input<EmrCheckboxGroupLabelPlacement>('end');
  readonly showSelectAll = input(false, { transform: booleanAttribute });
  readonly selectAllLabel = input('Select all');
  readonly exclusiveValues = input<readonly string[]>([]);
  readonly minSelections = input<number>();
  readonly maxSelections = input<number>();
  readonly showSelectionCount = input(false, { transform: booleanAttribute });
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly warning = input('');
  readonly error = input('');

  readonly valueChange = output<readonly string[]>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-checkbox-group-${++nextActionControlId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  protected readonly normalizedVariant = computed(() => normalizeCheckboxGroupVariant(this.variant()));
  protected readonly optionGroups = computed(() => groupOptions(this.options()));
  private readonly selectedSet = computed(() => new Set(this.value()));
  protected readonly isInvalid = computed(() => this.invalid() || Boolean(this.error()));
  protected readonly selectAllState = computed(() =>
    computeSelectAllState(this.value(), this.options(), this.exclusiveValues()),
  );
  protected readonly selectionCountText = computed(() =>
    formatCheckboxSelectionCount(this.value(), this.maxSelections()),
  );
  protected readonly showClear = computed(() => {
    if (!this.clearable() || this.readOnly() || this.disabled()) return false;
    const selected = this.selectedSet();
    return this.options().some((o) => selected.has(o.value) && !isCheckboxOptionLocked(o));
  });

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.warning()) ids.push(`${id}-warning`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly selectAllRef = viewChild<ElementRef<HTMLInputElement>>('selectAllInput');
  private readonly checkRefs = viewChildren<ElementRef<HTMLInputElement>>('checkInput');
  private needsDomSync = false;
  private isFocusedInside = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncChecks();
    }
  }

  protected isSelected(optionValue: string): boolean {
    return this.selectedSet().has(optionValue);
  }

  protected isOptionReadOnly(option: EmrOption): boolean {
    return Boolean(this.readOnly() || option.readOnly);
  }

  protected isOptionDisabled(option: EmrOption): boolean {
    return Boolean(
      this.disabled() ||
        option.disabled ||
        isCheckboxOptionBlockedByMax(option.value, this.value(), this.maxSelections()),
    );
  }

  protected optionRowClasses(option: EmrOption): string {
    const v = this.normalizedVariant();
    const classes: string[] = [];
    if (v === 'card') {
      classes.push('emr-choice-card');
    } else if (v === 'chip') {
      classes.push('emr-choice-pill');
    } else if (v === 'inline') {
      classes.push('emr-checkbox', 'emr-checkbox--inline');
    } else {
      classes.push('emr-checkbox', 'emr-checkbox--tile');
    }
    if (this.size() === 'sm') classes.push('emr-checkbox--sm');
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

  protected onFocusIn(): void {
    if (!this.isFocusedInside) {
      this.isFocusedInside = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const currentTarget = event.currentTarget as HTMLElement | null;
    const relatedTarget = event.relatedTarget as Node | null;
    if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    if (this.isFocusedInside) {
      this.isFocusedInside = false;
      this.blurred.emit();
    }
  }

  protected onSelectAllClick(event: MouseEvent): void {
    if (this.readOnly() || this.disabled()) {
      event.preventDefault();
      this.syncChecks();
    }
  }

  protected onSelectAllEnterKey(event: Event): void {
    event.preventDefault();
    this.onSelectAllToggle();
  }

  protected onOptionClick(event: MouseEvent, option: EmrOption): void {
    if (this.readOnly() || this.disabled() || isCheckboxOptionLocked(option)) {
      event.preventDefault();
      this.syncChecks();
    }
  }

  protected onOptionEnterKey(event: Event, option: EmrOption): void {
    event.preventDefault();
    if (this.readOnly() || this.disabled() || isCheckboxOptionLocked(option)) {
      return;
    }
    this.onOptionToggle(option.value);
  }

  protected onSelectAllToggle(): void {
    if (this.readOnly() || this.disabled()) {
      this.syncChecks();
      return;
    }
    const next = toggleSelectAllValues(this.value(), this.options(), {
      exclusiveValues: this.exclusiveValues(),
      maxSelections: this.maxSelections(),
    });
    this.scheduleCheckSync();
    this.valueChange.emit(next);
  }

  protected onOptionToggle(optionValue: string): void {
    const targetOption = this.options().find((o) => o.value === optionValue);
    if (
      this.readOnly() ||
      this.disabled() ||
      (targetOption && isCheckboxOptionLocked(targetOption))
    ) {
      this.syncChecks();
      return;
    }
    const next = toggleCheckboxGroupValue(this.value(), optionValue, this.options(), {
      exclusiveValues: this.exclusiveValues(),
      maxSelections: this.maxSelections(),
    });
    this.scheduleCheckSync();
    this.valueChange.emit(next);
  }

  protected clearSelection(): void {
    if (this.readOnly() || this.disabled()) return;
    const next = clearCheckboxGroupValue(this.value(), this.options());
    this.scheduleCheckSync();
    this.valueChange.emit(next);
    this.cleared.emit();
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
      role="group"
      [id]="resolvedId()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel() || (labelHidden() ? (label() || null) : null)"
      [attr.aria-labelledby]="!ariaLabel() && !labelHidden() && label() ? resolvedId() + '-label' : null"
      [attr.aria-required]="required() || null"
      [attr.aria-readonly]="readOnly() || null"
      [attr.aria-invalid]="isInvalid() || null"
      [attr.aria-describedby]="describedBy()"
      (focusin)="onFocusIn()"
      (focusout)="onFocusOut($event)"
    >
      <div class="emr-choice-fieldset__top">
        <legend
          class="emr-field__label"
          [id]="resolvedId() + '-label'"
          [class.emr-sr-only]="labelHidden()"
        >
          {{ label() }}
          @if (required()) {
            <span class="emr-field__required" aria-hidden="true">*</span>
          }
        </legend>
        @if (!labelHidden() && (showSelectionCount() || showClear())) {
          <div class="emr-choice-header__actions">
            @if (showSelectionCount()) {
              <span class="emr-choice-count">{{ selectionCountText() }}</span>
            }
            @if (showClear()) {
              <button
                type="button"
                class="emr-choice-clear"
                data-emr-print="hide"
                [attr.aria-label]="clearLabel() + ' ' + (label() || ariaLabel() || 'selection')"
                (click)="clearSelection()"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
                </svg>
                <span>{{ clearLabel() }}</span>
              </button>
            }
          </div>
        }
      </div>
      @if (showSelectAll() && multiple()) {
        <div class="emr-choice-header">
          <label
            class="emr-checkbox emr-checkbox--inline"
            [class.emr-checkbox--sm]="normalizedSize() === 'sm'"
            [attr.data-checked]="selectAllState() === 'all' ? 'true' : null"
            [attr.data-mixed]="selectAllState() === 'mixed' ? 'true' : null"
            [attr.data-readonly]="readOnly() ? 'true' : null"
            [attr.data-disabled]="disabled() ? 'true' : null"
          >
            <input
              #selectAllInput
              class="emr-checkbox__native"
              type="checkbox"
              [checked]="selectAllState() === 'all'"
              [indeterminate]="selectAllState() === 'mixed'"
              [disabled]="disabled()"
              [attr.aria-checked]="
                selectAllState() === 'mixed' ? 'mixed' : selectAllState() === 'all'
              "
              [attr.aria-readonly]="readOnly() || null"
              (click)="onSelectAllClick($event)"
              (keydown.enter)="onSelectAllEnterKey($event)"
              (change)="onSelectAllToggle()"
            />
            <span class="emr-checkbox__box" aria-hidden="true">
              @if (selectAllState() === 'mixed') {
                <svg [attr.width]="normalizedSize() === 'sm' ? 11 : 12" [attr.height]="normalizedSize() === 'sm' ? 11 : 12" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 8h9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              } @else if (selectAllState() === 'all') {
                <svg [attr.width]="normalizedSize() === 'sm' ? 11 : 12" [attr.height]="normalizedSize() === 'sm' ? 11 : 12" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              }
            </span>
            <span class="emr-checkbox__text">{{ selectAllLabel() }}</span>
          </label>
        </div>
      }
      <div
        class="emr-choice-list"
        [class.emr-choice-list--horizontal]="normalizedOrientation() === 'horizontal'"
        [class.emr-choice-list--grid]="normalizedOrientation() === 'grid'"
        [style.--emr-choice-cols]="normalizedOrientation() === 'grid' ? columns() : null"
      >
        @for (grp of optionGroups(); track grp.label ?? '__ungrouped') {
          @if (grp.label) {
            <div class="emr-choice-group-label" style="grid-column: 1 / -1;">{{ grp.label }}</div>
          }
          @for (option of grp.options; track option.value) {
            <label
              [class]="optionRowClasses(option)"
              [attr.data-checked]="isSelected(option.value) ? 'true' : null"
              [attr.data-invalid]="isInvalid() ? 'true' : null"
              [attr.data-warning]="!isInvalid() && !!warning() ? 'true' : null"
              [attr.data-readonly]="isOptionReadOnly(option) ? 'true' : null"
              [attr.data-disabled]="isOptionDisabled(option) ? 'true' : null"
              [attr.data-tone]="option.tone || null"
            >
              <input
                #toggleInput
                type="checkbox"
                role="switch"
                [value]="option.value"
                [checked]="isSelected(option.value)"
                [disabled]="isOptionDisabled(option)"
                [attr.aria-checked]="isSelected(option.value)"
                [attr.aria-readonly]="isOptionReadOnly(option) || null"
                (click)="onOptionClick($event, option)"
                (keydown.enter)="onOptionEnterKey($event, option)"
                (change)="onOptionToggle(option.value)"
              />
              <span class="emr-toggle__cluster" aria-hidden="true">
                <span class="emr-toggle__track">
                  <span class="emr-toggle__thumb"></span>
                </span>
                @if (showStateLabels()) {
                  <span class="emr-toggle__state">{{ stateLabelFor(option.value) }}</span>
                }
              </span>
              <span class="emr-choice-option-copy">
                <span class="emr-choice-option-title">
                  @if (option.icon) {
                    <span class="emr-choice-option-icon" aria-hidden="true">
                      @switch (option.icon) {
                        @case ('eye') {
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                        }
                        @case ('lock') {
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                        }
                        @case ('warning') {
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 16H3Z" /><path d="M12 10v4M12 17h.01" /></svg>
                        }
                        @case ('info') {
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
                        }
                        @case ('phone') {
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>
                        }
                        @case ('clock') {
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
                        }
                        @case ('calendar') {
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        }
                        @default {
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        }
                      }
                    </span>
                  }
                  <span>{{ option.label }}</span>
                  @if (option.readOnly) {
                    <span class="emr-choice-option-icon" aria-label="Read-only option">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                    </span>
                  }
                  @if (optionBadge(option); as badge) {
                    <span [class]="'emr-badge emr-badge--sm emr-badge--' + badge.variant + ' emr-tone-' + badge.tone">{{ badge.text }}</span>
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
})
export class EmrToggleGroupComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly ariaLabel = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly options = input<readonly EmrOption[]>([]);
  readonly value = input<readonly string[] | string | null>([]);
  readonly values = input<readonly string[] | undefined>(undefined);
  readonly multiple = input(true, { transform: booleanAttribute });
  readonly allowEmpty = input(true, { transform: booleanAttribute });
  readonly orientation = input<EmrToggleGroupOrientation>('vertical');
  readonly columns = input<number>(2);
  readonly variant = input<EmrToggleGroupVariant | 'standard'>('tile');
  readonly size = input<EmrToggleGroupSize>('md');
  readonly labelPlacement = input<EmrToggleGroupLabelPlacement>('space-between');
  readonly showStateLabels = input(false, { transform: booleanAttribute });
  readonly onLabel = input('On');
  readonly offLabel = input('Off');
  readonly showSelectAll = input(false, { transform: booleanAttribute });
  readonly selectAllLabel = input('Enable all');
  readonly exclusiveValues = input<readonly string[]>([]);
  readonly minSelections = input<number>();
  readonly maxSelections = input<number>();
  readonly showSelectionCount = input(false, { transform: booleanAttribute });
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly warning = input('');
  readonly error = input('');

  readonly valueChange = output<readonly string[]>();
  readonly valuesChange = output<readonly string[]>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-toggle-group-${++nextActionControlId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  protected readonly normalizedVariant = computed(() => normalizeEmrToggleGroupVariant(this.variant()));
  protected readonly normalizedSize = computed(() => normalizeEmrToggleGroupSize(this.size()));
  protected readonly normalizedOrientation = computed(() =>
    normalizeEmrToggleGroupOrientation(this.orientation()),
  );
  protected readonly normalizedPlacement = computed(() =>
    normalizeEmrToggleGroupLabelPlacement(this.labelPlacement()),
  );
  protected readonly effectiveValues = computed(() =>
    resolveEmrToggleGroupValues({
      value: this.value(),
      values: this.values(),
      multiple: this.multiple(),
    }),
  );
  protected readonly optionGroups = computed(() => groupOptions(this.options()));
  private readonly selectedSet = computed(() => new Set(this.effectiveValues()));
  protected readonly isInvalid = computed(() => this.invalid() || Boolean(this.error()));
  protected readonly selectAllState = computed(() =>
    computeSelectAllState(this.effectiveValues(), this.options(), this.exclusiveValues()),
  );
  protected readonly selectionCountText = computed(() =>
    formatCheckboxSelectionCount(this.effectiveValues(), this.maxSelections()),
  );
  protected readonly showClear = computed(() => {
    if (!this.clearable() || this.readOnly() || this.disabled()) return false;
    const selected = this.selectedSet();
    return this.options().some((o) => selected.has(o.value) && !isCheckboxOptionLocked(o));
  });

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.warning()) ids.push(`${id}-warning`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly selectAllRef = viewChild<ElementRef<HTMLInputElement>>('selectAllInput');
  private readonly toggleRefs = viewChildren<ElementRef<HTMLInputElement>>('toggleInput');
  private needsDomSync = false;
  private isFocusedInside = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncToggles();
    }
  }

  protected isSelected(optionValue: string): boolean {
    return this.selectedSet().has(optionValue);
  }

  protected stateLabelFor(optionValue: string): string {
    return resolveEmrToggleStateLabel(this.isSelected(optionValue), this.onLabel(), this.offLabel());
  }

  protected isOptionReadOnly(option: EmrOption): boolean {
    return Boolean(this.readOnly() || option.readOnly);
  }

  protected isOptionDisabled(option: EmrOption): boolean {
    return Boolean(
      this.disabled() ||
        option.disabled ||
        (this.multiple() &&
          isCheckboxOptionBlockedByMax(option.value, this.effectiveValues(), this.maxSelections())),
    );
  }

  protected optionRowClasses(option: EmrOption): string {
    const v = this.normalizedVariant();
    const classes: string[] = ['emr-toggle'];
    if (v === 'card') {
      classes.push('emr-choice-card');
    } else if (v === 'inline') {
      classes.push('emr-toggle--inline');
    } else {
      classes.push('emr-toggle--tile');
    }
    if (this.normalizedSize() === 'sm') classes.push('emr-toggle--sm');
    if (this.normalizedPlacement() === 'start') classes.push('emr-choice--label-start');
    if (this.normalizedPlacement() === 'space-between') classes.push('emr-choice--space-between');
    if (option.tone) classes.push(`emr-choice-tone-${option.tone}`);
    return classes.join(' ');
  }

  protected optionBadge(option: EmrOption): EmrSegmentedBadgePresentation | null {
    return formatEmrSegmentedBadge(option.badge, option.tone);
  }

  protected onFocusIn(): void {
    if (!this.isFocusedInside) {
      this.isFocusedInside = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const currentTarget = event.currentTarget as HTMLElement | null;
    const relatedTarget = event.relatedTarget as Node | null;
    if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    if (this.isFocusedInside) {
      this.isFocusedInside = false;
      this.blurred.emit();
    }
  }

  protected onSelectAllClick(event: MouseEvent): void {
    if (this.readOnly() || this.disabled()) {
      event.preventDefault();
      this.syncToggles();
    }
  }

  protected onSelectAllEnterKey(event: Event): void {
    event.preventDefault();
    this.onSelectAllToggle();
  }

  protected onOptionClick(event: MouseEvent, option: EmrOption): void {
    if (this.readOnly() || this.disabled() || isCheckboxOptionLocked(option)) {
      event.preventDefault();
      this.syncToggles();
    }
  }

  protected onOptionEnterKey(event: Event, option: EmrOption): void {
    event.preventDefault();
    if (this.readOnly() || this.disabled() || isCheckboxOptionLocked(option)) {
      this.syncToggles();
      return;
    }
    this.onOptionToggle(option.value);
  }

  protected clearSelection(): void {
    if (this.readOnly() || this.disabled()) return;
    const next = clearEmrToggleGroupValues(this.effectiveValues(), this.options());
    this.scheduleToggleSync();
    this.valueChange.emit(next);
    this.valuesChange.emit(next);
    this.cleared.emit();
  }

  protected onSelectAllToggle(): void {
    if (this.readOnly() || this.disabled() || !this.multiple()) {
      this.syncToggles();
      return;
    }
    const next = toggleSelectAllValues(this.effectiveValues(), this.options(), {
      exclusiveValues: this.exclusiveValues(),
      maxSelections: this.maxSelections(),
    });
    this.scheduleToggleSync();
    this.valueChange.emit(next);
    this.valuesChange.emit(next);
  }

  protected onOptionToggle(optionValue: string): void {
    const targetOption = this.options().find((o) => o.value === optionValue);
    if (this.readOnly() || this.disabled() || (targetOption && isCheckboxOptionLocked(targetOption))) {
      this.syncToggles();
      return;
    }
    const next = toggleEmrToggleGroupValue({
      current: this.effectiveValues(),
      toggledValue: optionValue,
      options: this.options(),
      multiple: this.multiple(),
      allowEmpty: this.allowEmpty(),
      exclusiveValues: this.exclusiveValues(),
      maxSelections: this.maxSelections(),
    });
    this.scheduleToggleSync();
    if (next !== this.effectiveValues()) {
      this.valueChange.emit(next);
      this.valuesChange.emit(next);
    }
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
