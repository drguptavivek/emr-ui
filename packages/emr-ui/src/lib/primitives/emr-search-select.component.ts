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
import type { EmrOption } from '@drguptavivek/emr-controller';
import { filterOptionsLocally, groupOptions } from './emr-wave2.logic';

let nextSearchSelectId = 0;

@Component({
  selector: 'emr-search-select',
  standalone: true,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div class="emr-field emr-search-select">
      <label class="emr-field__label" [class.emr-sr-only]="labelHidden()" [for]="resolvedId()">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </label>
      @if (multiple() && selected().length) {
        <div class="emr-chip-row" aria-label="Selected options">
          @for (item of selected(); track item.value) {
            <span class="emr-chip emr-tone-neutral">
              {{ item.label }}
              @if (!readOnly()) {
                <button
                  class="emr-button emr-button--small emr-button--ghost"
                  type="button"
                  [attr.aria-label]="'Remove ' + item.label"
                  [disabled]="disabled()"
                  (click)="onRemove(item.value)"
                >
                  Remove
                </button>
              }
            </span>
          }
        </div>
      }
      <div class="emr-search-select__bar">
        <input
          #queryInput
          class="emr-search-input"
          type="search"
          autocomplete="off"
          role="combobox"
          [id]="resolvedId()"
          [value]="displayedInputValue()"
          [placeholder]="placeholder()"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-expanded]="isPanelOpen()"
          [attr.aria-controls]="resolvedId() + '-listbox'"
          [attr.aria-autocomplete]="'list'"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (focus)="onFocus()"
          (input)="onQueryInput($event)"
          (blur)="onInputBlur()"
          (keydown.enter)="onSearchEnter($event)"
          (keydown.arrowdown)="onArrowDownFromInput($event)"
          (keydown.escape)="onEscape($event)"
        />
        @if (showClearButton()) {
          <button
            class="emr-button emr-button--ghost emr-button--small"
            type="button"
            [attr.aria-label]="'Clear ' + (label() || 'selection')"
            (click)="onClear()"
          >
            ✕
          </button>
        }
        @if (filterMode() === 'remote') {
          <button
            class="emr-button emr-button--secondary"
            type="button"
            [disabled]="disabled() || readOnly() || loading()"
            (click)="onSearchClick()"
          >
            {{ loading() ? 'Searching…' : 'Search' }}
          </button>
        } @else {
          <button
            class="emr-button emr-button--outline emr-button--small"
            type="button"
            [disabled]="disabled() || readOnly()"
            [attr.aria-label]="'Toggle ' + (label() || 'options')"
            [attr.aria-expanded]="isPanelOpen()"
            (click)="toggleLocalPanel()"
          >
            ▾
          </button>
        }
      </div>
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">{{ error() }}</span>
      }
      @if (isPanelOpen()) {
        <div
          class="emr-search-select__panel"
          [id]="resolvedId() + '-listbox'"
          role="listbox"
          [attr.aria-multiselectable]="multiple()"
        >
          @if (!loading() && visibleFlatCount() === 0 && !customCandidate()) {
            <div class="emr-empty">{{ emptyMessage() }}</div>
          }
          @for (grp of visibleGroups(); track grp.label ?? '__ungrouped__') {
            @if (grp.label !== null) {
              <div class="emr-field__hint" role="presentation">{{ grp.label }}</div>
            }
            @for (option of grp.options; track option.value) {
              <button
                #optionButton
                class="emr-search-select__option"
                type="button"
                role="option"
                [disabled]="option.disabled"
                [attr.aria-selected]="isSelected(option.value)"
                (click)="onSelectOption(option.value)"
                (keydown.arrowdown)="moveOptionFocus($event, 1)"
                (keydown.arrowup)="moveOptionFocus($event, -1)"
                (keydown.home)="focusOption($event, 0)"
                (keydown.end)="focusOption($event, totalFocusableCount() - 1)"
                (keydown.escape)="onEscape($event)"
              >
                <strong>{{ option.label }}</strong>
                @if (option.description) {
                  <span class="emr-search-select__description">{{ option.description }}</span>
                }
              </button>
            }
          }
          @if (customCandidate(); as customText) {
            <button
              #optionButton
              class="emr-search-select__option"
              type="button"
              role="option"
              aria-selected="false"
              (click)="onCommitCustomValue(customText)"
              (keydown.arrowdown)="moveOptionFocus($event, 1)"
              (keydown.arrowup)="moveOptionFocus($event, -1)"
              (keydown.escape)="onEscape($event)"
            >
              <strong>Use "{{ customText }}"</strong>
            </button>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrSearchSelectComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('Search');
  /** Keep the label for assistive tech but hide it visually when a surrounding frame already shows one. */
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly placeholder = input('Type to search');
  readonly query = input('');
  readonly options = input<readonly EmrOption[]>([]);
  readonly selected = input<readonly EmrOption[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly open = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly filterMode = input<'remote' | 'local'>('remote');
  readonly value = input<string | null | undefined>(undefined);
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly allowCustomValue = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');
  readonly emptyMessage = input('No matching options');

  readonly queryChange = output<string>();
  readonly queryChanged = output<string>();
  readonly searchRequested = output<void>();
  readonly openRequested = output<void>();
  readonly closeRequested = output<void>();
  readonly optionSelected = output<string>();
  readonly removeRequested = output<string>();
  readonly valueChange = output<string | null>();
  readonly cleared = output<void>();
  readonly customValueCommitted = output<string>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fallbackId = `emr-search-${++nextSearchSelectId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly localOpen = signal(false);
  protected readonly localQuery = signal('');
  protected readonly isActivelyTyping = signal(false);

  protected readonly activeFilterQuery = computed(() => {
    if (this.filterMode() === 'local') {
      return this.isActivelyTyping() ? this.localQuery() : this.query();
    }
    return this.query();
  });

  protected readonly displayedInputValue = computed(() => {
    if (this.filterMode() === 'remote') {
      if (this.query()) return this.query();
      const val = this.value();
      if (val !== null && val !== undefined && val !== '') {
        return this.options().find((o) => o.value === val)?.label ?? val;
      }
      return '';
    }
    if (this.isActivelyTyping()) {
      return this.localQuery();
    }
    if (this.query()) {
      return this.query();
    }
    const val = this.value();
    if (val !== null && val !== undefined && val !== '') {
      return this.options().find((o) => o.value === val)?.label ?? val;
    }
    return '';
  });

  protected readonly isPanelOpen = computed(() => {
    if (this.readOnly()) return false;
    if (this.filterMode() === 'local') {
      return !this.disabled() && (this.open() || this.localOpen());
    }
    return this.open();
  });

  protected readonly filteredOptions = computed(() => {
    if (this.filterMode() === 'local') {
      return filterOptionsLocally(this.options(), this.activeFilterQuery());
    }
    return this.options();
  });

  protected readonly visibleGroups = computed(() => groupOptions(this.filteredOptions()));
  protected readonly visibleFlatCount = computed(() => this.filteredOptions().length);

  protected readonly customCandidate = computed<string | null>(() => {
    if (!this.allowCustomValue()) return null;
    const raw = this.activeFilterQuery().trim();
    if (!raw) return null;
    const lower = raw.toLowerCase();
    const exactMatch = this.options().some(
      (opt) => opt.value.toLowerCase() === lower || opt.label.toLowerCase() === lower,
    );
    return exactMatch ? null : raw;
  });

  protected readonly totalFocusableCount = computed(
    () => this.filteredOptions().filter((o) => !o.disabled).length + (this.customCandidate() ? 1 : 0),
  );

  protected readonly showClearButton = computed(() => {
    if (!this.clearable() || this.readOnly() || this.disabled()) return false;
    const val = this.value();
    return Boolean(
      (val !== null && val !== undefined && val !== '') ||
        this.selected().length > 0 ||
        this.activeFilterQuery().length > 0,
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

  private readonly queryInputRef = viewChild<ElementRef<HTMLInputElement>>('queryInput');
  private readonly optionButtons = viewChildren<ElementRef<HTMLButtonElement>>('optionButton');
  private needsQuerySync = false;

  ngAfterViewChecked(): void {
    if (this.needsQuerySync) {
      this.needsQuerySync = false;
      this.syncQueryDom();
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.filterMode() !== 'local' || !this.localOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.localOpen.set(false);
      this.isActivelyTyping.set(false);
      this.localQuery.set('');
      this.closeRequested.emit();
    }
  }

  protected onFocus(): void {
    if (this.readOnly() || this.disabled()) return;
    if (this.filterMode() === 'local') {
      this.localOpen.set(true);
    }
    this.openRequested.emit();
  }

  protected toggleLocalPanel(): void {
    if (this.readOnly() || this.disabled()) return;
    const next = !this.isPanelOpen();
    this.localOpen.set(next);
    if (next) {
      this.openRequested.emit();
      this.queryInputRef()?.nativeElement.focus();
    } else {
      this.isActivelyTyping.set(false);
      this.localQuery.set('');
      this.closeRequested.emit();
    }
  }

  protected onQueryInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncQueryDom();
      return;
    }
    const next = target.value;
    if (this.filterMode() === 'local') {
      this.isActivelyTyping.set(true);
      this.localQuery.set(next);
      this.localOpen.set(true);
    } else {
      this.needsQuerySync = true;
      queueMicrotask(() => {
        if (this.needsQuerySync) {
          this.needsQuerySync = false;
          this.syncQueryDom();
        }
      });
    }
    this.queryChange.emit(next);
    this.queryChanged.emit(next);
  }

  protected onInputBlur(): void {
    if (this.filterMode() === 'remote') {
      this.syncQueryDom();
    }
  }

  protected syncQueryDom(): void {
    const el = this.queryInputRef()?.nativeElement;
    if (!el) return;
    const expected = this.displayedInputValue();
    if (el.value !== expected) el.value = expected;
  }

  protected onSearchEnter(event: Event): void {
    if (this.readOnly() || this.disabled()) return;
    event.preventDefault();
    if (this.filterMode() === 'local') {
      const firstEnabled = this.filteredOptions().find((o) => !o.disabled);
      if (firstEnabled) {
        this.onSelectOption(firstEnabled.value);
      } else {
        const custom = this.customCandidate();
        if (custom) {
          this.onCommitCustomValue(custom);
        }
      }
      return;
    }
    this.searchRequested.emit();
  }

  protected onSearchClick(): void {
    if (this.readOnly() || this.disabled() || this.loading()) return;
    this.searchRequested.emit();
  }

  protected onArrowDownFromInput(event: Event): void {
    if (this.readOnly() || this.disabled()) return;
    if (this.filterMode() === 'local' && !this.isPanelOpen()) {
      event.preventDefault();
      this.localOpen.set(true);
      this.openRequested.emit();
      return;
    }
    this.focusOption(event, 0);
  }

  protected onEscape(event: Event): void {
    event.stopPropagation();
    if (this.filterMode() === 'local') {
      this.localOpen.set(false);
      this.isActivelyTyping.set(false);
      this.localQuery.set('');
      this.needsQuerySync = true;
    }
    this.closeRequested.emit();
  }

  protected onSelectOption(val: string): void {
    if (this.readOnly() || this.disabled()) return;
    if (this.filterMode() === 'local') {
      this.isActivelyTyping.set(false);
      this.localQuery.set('');
      if (!this.multiple()) {
        this.localOpen.set(false);
      }
      this.needsQuerySync = true;
    }
    this.optionSelected.emit(val);
    this.valueChange.emit(val);
  }

  protected onCommitCustomValue(customText: string): void {
    if (this.readOnly() || this.disabled()) return;
    this.isActivelyTyping.set(false);
    this.localQuery.set('');
    this.localOpen.set(false);
    this.needsQuerySync = true;
    this.customValueCommitted.emit(customText);
    this.optionSelected.emit(customText);
    this.valueChange.emit(customText);
  }

  protected onClear(): void {
    if (this.readOnly() || this.disabled()) return;
    this.isActivelyTyping.set(false);
    this.localQuery.set('');
    this.localOpen.set(false);
    this.needsQuerySync = true;
    this.queryChange.emit('');
    this.queryChanged.emit('');
    this.valueChange.emit(null);
    this.cleared.emit();
  }

  protected onRemove(val: string): void {
    if (this.readOnly() || this.disabled()) return;
    this.removeRequested.emit(val);
  }

  protected isSelected(optionValue: string): boolean {
    if (this.value() === optionValue) return true;
    return this.selected().some((item) => item.value === optionValue);
  }

  protected focusOption(event: Event, index: number): void {
    if (this.readOnly() || this.disabled()) return;
    const enabled = this.optionButtons()
      .map((item) => item.nativeElement)
      .filter((button) => !button.disabled);
    if (!enabled.length) return;
    event.preventDefault();
    enabled[Math.max(0, Math.min(index, enabled.length - 1))]?.focus();
  }

  protected moveOptionFocus(event: Event, direction: -1 | 1): void {
    const enabled = this.optionButtons()
      .map((item) => item.nativeElement)
      .filter((button) => !button.disabled);
    const current = enabled.indexOf(event.currentTarget as HTMLButtonElement);
    if (current < 0) return;
    this.focusOption(event, current + direction);
  }
}
