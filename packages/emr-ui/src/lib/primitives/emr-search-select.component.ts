import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import type {
  EmrBadge,
  EmrControlVariant,
  EmrMatchHighlightSegment,
  EmrOption,
  EmrScoredOption,
  EmrSearchSelectFilterMode,
  EmrSearchSelectSize,
} from '@drguptavivek/emr-controller';
import {
  findNextEnabledSearchOptionIndex,
  formatCreatableLabel,
  groupOptions,
  hasSearchSelectClearableValue,
  isSearchOptionSelected,
  rankAndFilterOptions,
  resolveCustomSearchCandidate,
  resolveDefaultActiveOptionIndex,
  resolveSearchSelectDisplayValue,
  resolveSearchSelectValues,
  splitMatchHighlightSegments,
} from './emr-wave2.logic';

let nextSearchSelectId = 0;

function optionalBooleanAttribute(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return booleanAttribute(value);
}

@Component({
  selector: 'emr-search-select',
  standalone: true,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div
      class="emr-field emr-search-select"
      [class.emr-search-select--sm]="normalizedSize() === 'sm'"
      [class.emr-search-select--lg]="size() === 'lg'"
      [class.emr-search-select--filled]="variant() === 'filled'"
      [class.emr-search-select--subtle]="variant() === 'subtle'"
      [class.emr-search-select--loading]="loading()"
      [class.emr-search-select--invalid]="isInvalid()"
      [class.emr-search-select--warning]="!isInvalid() && !!warning()"
      [class.emr-search-select--readonly]="readOnly()"
    >
      <label class="emr-field__label" [class.emr-sr-only]="labelHidden()" [for]="resolvedId()" [id]="resolvedId() + '-label'">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
          <span class="emr-sr-only">Required</span>
        }
      </label>
      @if (multiple() && selectedChips().length) {
        <div class="emr-chip-row" aria-label="Selected options">
          @for (item of visibleChips(); track item.value) {
            <span class="emr-chip emr-tone-neutral emr-search-select__chip">
              <span>{{ item.label }}</span>
              @if (!readOnly() && !item.readOnly) {
                <button
                  class="emr-search-select__chip-remove"
                  type="button"
                  [attr.aria-label]="'Remove ' + item.label"
                  [disabled]="disabled()"
                  (click)="onRemove(item.value)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              }
            </span>
          }
          @if (overflowChipCount() > 0) {
            <span class="emr-chip emr-search-select__chip emr-search-select__chip--overflow" [attr.aria-label]="overflowChipCount() + ' more selected'">
              +{{ overflowChipCount() }}
            </span>
          }
        </div>
      }
      <div class="emr-search-select__bar">
        <div class="emr-search-select__input-wrap">
          <span class="emr-search-select__leading-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
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
            [attr.aria-label]="ariaLabel() || null"
            [attr.aria-expanded]="isPanelOpen()"
            [attr.aria-controls]="resolvedId() + '-listbox'"
            [attr.aria-autocomplete]="'list'"
            [attr.aria-activedescendant]="activeDescendantId()"
            [attr.aria-required]="required() ? 'true' : null"
            [attr.aria-readonly]="readOnly() ? 'true' : null"
            [attr.aria-disabled]="disabled() ? 'true' : null"
            [attr.aria-busy]="loading() ? 'true' : null"
            [attr.aria-invalid]="isInvalid() ? 'true' : null"
            [attr.aria-describedby]="describedBy()"
            (focus)="onFocus()"
            (input)="onQueryInput($event)"
            (blur)="onInputBlur()"
            (keydown)="onInputKeydown($event)"
          />
          @if (loading()) {
            <span class="emr-search-select__trigger-spinner" aria-hidden="true">
              <svg class="emr-search-select__spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </span>
          }
        </div>
        @if (showClearButton()) {
          <button
            class="emr-button emr-button--outline emr-button--small emr-search-select__icon-btn"
            type="button"
            [attr.aria-label]="clearLabel() + ' ' + (ariaLabel() || label() || 'selection')"
            (click)="onClear()"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        }
        @if (filterMode() === 'remote') {
          <button
            class="emr-button emr-button--secondary emr-search-select__action-btn"
            type="button"
            [disabled]="disabled() || readOnly() || loading()"
            (click)="onSearchClick()"
          >
            @if (loading()) {
              <svg class="emr-search-select__spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            }
            <span>{{ loading() ? loadingMessage() : 'Search' }}</span>
          </button>
        } @else {
          <button
            class="emr-button emr-button--outline emr-button--small emr-search-select__icon-btn"
            type="button"
            [disabled]="disabled() || readOnly()"
            [attr.aria-label]="'Toggle ' + (ariaLabel() || label() || 'options')"
            [attr.aria-expanded]="isPanelOpen()"
            (click)="togglePanel()"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              @if (isPanelOpen()) {
                <path d="m18 15-6-6-6 6" />
              } @else {
                <path d="m6 9 6 6 6-6" />
              }
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
      @if (isPanelOpen()) {
        <div
          class="emr-search-select__panel"
          [id]="resolvedId() + '-listbox'"
          role="listbox"
          [attr.aria-busy]="loading() || null"
          [attr.aria-multiselectable]="multiple()"
        >
          @if (loading() && visibleFlatCount() === 0) {
            <div class="emr-search-select__loading" role="status">
              <svg class="emr-search-select__spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span>{{ loadingMessage() }}</span>
            </div>
          } @else if (!loading() && visibleFlatCount() === 0 && !customCandidate()) {
            <div class="emr-search-select__empty">{{ emptyMessage() }}</div>
          }
          @for (grp of visibleGroups(); track grp.label ?? '__ungrouped__') {
            <div [attr.role]="grp.label !== null ? 'group' : null" [attr.aria-label]="grp.label ?? null">
              @if (grp.label !== null) {
                <div class="emr-search-select__group-header">{{ grp.label }}</div>
              }
              @for (option of grp.options; track option.value) {
                @let flatIdx = optionIndexMap().get(option.value) ?? -1;
                @let isBest = bestMatchValue() === option.value;
                @let isOptSelected = isSelected(option.value);
                @let isOptActive = activeIndex() === flatIdx;
                @let isMaxBlocked = isOptionBlockedByMax(option.value, isOptSelected);
                <button
                  #optionButton
                  [id]="resolvedId() + '-opt-' + flatIdx"
                  class="emr-search-select__option"
                  [class.emr-search-select__option--selected]="isOptSelected"
                  [class.emr-search-select__option--active]="isOptActive"
                  [class.emr-search-select__option--disabled]="option.disabled || isMaxBlocked"
                  [class.emr-search-select__option--readonly]="option.readOnly"
                  type="button"
                  tabindex="-1"
                  role="option"
                  [disabled]="option.disabled || isMaxBlocked"
                  [attr.aria-selected]="isOptSelected"
                  [attr.aria-readonly]="option.readOnly ? 'true' : null"
                  [attr.aria-disabled]="option.disabled || option.readOnly || isMaxBlocked || null"
                  (mouseenter)="onOptionMouseEnter(flatIdx)"
                  (click)="onSelectOption(option)"
                >
                  <span class="emr-search-select__option-check" aria-hidden="true">
                    @if (isOptSelected) {
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    }
                  </span>
                  <span class="emr-search-select__option-body">
                    <span class="emr-search-select__option-top">
                      <span class="emr-search-select__option-label">
                        @for (seg of highlightSegments(option.label); track $index) {
                          @if (seg.matched) {
                            <mark class="emr-match-highlight">{{ seg.text }}</mark>
                          } @else {
                            {{ seg.text }}
                          }
                        }
                      </span>
                      @if (option.code) {
                        <span class="emr-search-select__option-code">
                          @for (seg of highlightSegments(option.code); track $index) {
                            @if (seg.matched) {
                              <mark class="emr-match-highlight">{{ seg.text }}</mark>
                            } @else {
                              {{ seg.text }}
                            }
                          }
                        </span>
                      }
                      @if (isBest) {
                        <span class="emr-search-select__best-match">Best match</span>
                      }
                    </span>
                    @if (option.description) {
                      <span class="emr-search-select__description">
                        @for (seg of highlightSegments(option.description); track $index) {
                          @if (seg.matched) {
                            <mark class="emr-match-highlight">{{ seg.text }}</mark>
                          } @else {
                            {{ seg.text }}
                          }
                        }
                      </span>
                    }
                  </span>
                  <span class="emr-search-select__option-meta">
                    @if (optionBadgeLabel(option); as badgeText) {
                      <span [class]="'emr-badge emr-tone-' + optionBadgeTone(option)">{{ badgeText }}</span>
                    }
                    @if (option.readOnly) {
                      <span class="emr-search-select__lock" aria-label="Read-only option">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                    }
                  </span>
                </button>
              }
            </div>
          }
          @if (customCandidate(); as customText) {
            <button
              #optionButton
              [id]="resolvedId() + '-opt-' + visibleFlatCount()"
              class="emr-search-select__option"
              [class.emr-search-select__option--active]="activeIndex() === visibleFlatCount()"
              type="button"
              tabindex="-1"
              role="option"
              aria-selected="false"
              (mouseenter)="onOptionMouseEnter(visibleFlatCount())"
              (click)="onCommitCustomValue(customText)"
            >
              <span class="emr-search-select__option-check" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span class="emr-search-select__option-body">
                <strong>{{ formattedCreateLabel(customText) }}</strong>
              </span>
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
  readonly controlId = input<string | undefined>(undefined);
  readonly label = input<string>('Search');
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Keep the label for assistive tech but hide it visually when a surrounding frame already shows one. */
  readonly labelHidden = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly placeholder = input<string>('Type to search');
  readonly variant = input<EmrControlVariant>('outline');
  readonly size = input<EmrSearchSelectSize | 'lg'>('md');

  readonly multiple = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly value = input<string | readonly string[] | null | undefined>(undefined);
  readonly selected = input<readonly EmrOption[]>([]);
  readonly options = input<readonly EmrOption[]>([]);
  readonly maxSelections = input<number | undefined>(undefined);
  readonly maxTagCount = input<number | undefined>(undefined);
  readonly closeOnSelect = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly clearable = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly clearLabel = input<string>('Clear');

  readonly query = input<string>('');
  readonly searchQuery = input<string | undefined>(undefined);
  readonly filterMode = input<EmrSearchSelectFilterMode>('remote');
  readonly highlightMatch = input<boolean, unknown>(true, { transform: booleanAttribute });
  readonly autoHighlight = input<boolean, unknown>(true, { transform: booleanAttribute });
  readonly debounceMs = input<number>(200);
  readonly minQueryLength = input<number>(0);
  readonly open = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });

  readonly creatable = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly allowCreate = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly allowCustomValue = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly createLabel = input<string>('Create "{query}"');

  readonly loading = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly loadingMessage = input<string>('Searching…');
  readonly emptyMessage = input<string>('No matching options');
  readonly required = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly readOnly = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly invalid = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly hint = input<string>('');
  readonly warning = input<string>('');
  readonly error = input<string>('');

  readonly valueChange = output<string | readonly string[] | null>();
  readonly queryChange = output<string>();
  readonly queryChanged = output<string>();
  readonly searchRequested = output<void>();
  readonly openChange = output<boolean>();
  readonly openRequested = output<void>();
  readonly closeRequested = output<void>();
  readonly optionSelected = output<string>();
  readonly removeRequested = output<string>();
  readonly selectionRemoved = output<string>();
  readonly createRequested = output<string>();
  readonly customValueCommitted = output<string>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
  readonly submitted = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fallbackId = `emr-search-${++nextSearchSelectId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly localOpen = signal(false);
  protected readonly localQuery = signal('');
  protected readonly isActivelyTyping = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly isInvalid = computed(() => Boolean(this.invalid() || this.error()));
  protected readonly normalizedSize = computed<EmrSearchSelectSize>(() =>
    this.size() === 'sm' ? 'sm' : 'md',
  );
  protected readonly isCreatable = computed(() =>
    Boolean(this.creatable() || this.allowCreate() || this.allowCustomValue()),
  );
  protected readonly resolvedCloseOnSelect = computed(
    () => this.closeOnSelect() ?? !this.multiple(),
  );
  protected readonly effectiveExternalQuery = computed(() =>
    this.searchQuery() !== undefined ? (this.searchQuery() ?? '') : this.query(),
  );

  protected readonly activeFilterQuery = computed(() => {
    if (this.filterMode() !== 'remote') {
      return this.isActivelyTyping() ? this.localQuery() : this.effectiveExternalQuery();
    }
    return this.effectiveExternalQuery();
  });

  protected readonly selectedValues = computed(() =>
    resolveSearchSelectValues(this.multiple(), this.value(), this.selected()),
  );

  protected readonly selectedChips = computed<readonly EmrOption[]>(() => {
    const vals = this.selectedValues();
    if (!vals.length) return this.selected();
    const byVal = new Map<string, EmrOption>();
    for (const o of this.selected()) byVal.set(o.value, o);
    for (const o of this.options()) if (!byVal.has(o.value)) byVal.set(o.value, o);
    return vals.map((v) => byVal.get(v) ?? { value: v, label: v });
  });

  protected readonly visibleChips = computed(() => {
    const chips = this.selectedChips();
    const maxTags = this.maxTagCount();
    if (typeof maxTags === 'number' && maxTags >= 0 && chips.length > maxTags) {
      return chips.slice(0, maxTags);
    }
    return chips;
  });

  protected readonly overflowChipCount = computed(() => {
    const chips = this.selectedChips();
    const maxTags = this.maxTagCount();
    if (typeof maxTags === 'number' && maxTags >= 0 && chips.length > maxTags) {
      return chips.length - maxTags;
    }
    return 0;
  });

  protected readonly displayedInputValue = computed(() =>
    resolveSearchSelectDisplayValue({
      filterMode: this.filterMode(),
      isActivelyTyping: this.isActivelyTyping(),
      query:
        this.filterMode() !== 'remote' && this.isActivelyTyping()
          ? this.localQuery()
          : this.effectiveExternalQuery(),
      value: this.value(),
      selected: this.selected(),
      options: this.options(),
      multiple: this.multiple(),
    }),
  );

  protected readonly isPanelOpen = computed(() => {
    if (this.readOnly() || this.disabled()) return false;
    const controlled = this.open();
    return controlled !== undefined ? controlled : this.localOpen();
  });

  protected readonly rankedOptions = computed<readonly EmrScoredOption[]>(() =>
    rankAndFilterOptions(this.options(), this.activeFilterQuery(), this.filterMode()),
  );

  protected readonly filteredOptions = computed<readonly EmrOption[]>(() =>
    this.rankedOptions().map((entry) => entry.option),
  );

  protected readonly bestMatchValue = computed<string | null>(() => {
    if (!this.activeFilterQuery().trim()) return null;
    return this.rankedOptions().find((entry) => entry.isBestMatch)?.option.value ?? null;
  });

  protected readonly visibleGroups = computed(() => groupOptions(this.filteredOptions()));
  protected readonly visibleFlatCount = computed(() => this.filteredOptions().length);

  protected readonly optionIndexMap = computed(() => {
    const map = new Map<string, number>();
    let idx = 0;
    for (const grp of this.visibleGroups()) {
      for (const opt of grp.options) {
        map.set(opt.value, idx);
        idx += 1;
      }
    }
    return map;
  });

  protected readonly flatDisplayedOptions = computed<readonly EmrOption[]>(() => {
    const list: EmrOption[] = [];
    for (const grp of this.visibleGroups()) {
      for (const opt of grp.options) list.push(opt);
    }
    return list;
  });

  protected readonly customCandidate = computed<string | null>(() =>
    resolveCustomSearchCandidate(
      this.activeFilterQuery(),
      this.options(),
      this.isCreatable(),
      this.minQueryLength(),
    ),
  );

  protected readonly activeDescendantId = computed<string | null>(() => {
    if (!this.isPanelOpen()) return null;
    const idx = this.activeIndex();
    const total = this.flatDisplayedOptions().length + (this.customCandidate() ? 1 : 0);
    if (idx < 0 || idx >= total) return null;
    return `${this.resolvedId()}-opt-${idx}`;
  });

  protected readonly showClearButton = computed(() =>
    hasSearchSelectClearableValue({
      clearable: this.clearable(),
      disabled: this.disabled(),
      readOnly: this.readOnly(),
      value: this.value(),
      selected: this.selected(),
      query: this.activeFilterQuery(),
    }),
  );

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    if (this.error()) return `${id}-error`;
    if (this.warning()) return `${id}-warning`;
    if (this.hint()) return `${id}-hint`;
    return null;
  });

  private readonly queryInputRef = viewChild<ElementRef<HTMLInputElement>>('queryInput');
  private readonly optionButtons = viewChildren<ElementRef<HTMLButtonElement>>('optionButton');
  private needsQuerySync = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.debounceTimer !== null) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
    });

    effect(() => {
      const openNow = this.isPanelOpen();
      const opts = this.flatDisplayedOptions();
      const q = this.activeFilterQuery();
      const auto = this.autoHighlight();
      if (!openNow) {
        this.activeIndex.set(-1);
        return;
      }
      this.activeIndex.set(
        resolveDefaultActiveOptionIndex(opts, this.selectedValues(), q, auto),
      );
    });
  }

  ngAfterViewChecked(): void {
    if (this.needsQuerySync) {
      this.needsQuerySync = false;
      this.syncQueryDom();
    }
  }

  private setPanelOpen(next: boolean): void {
    if (this.open() === undefined) {
      this.localOpen.set(next);
    }
    this.openChange.emit(next);
    if (next) {
      this.openRequested.emit();
    } else {
      this.closeRequested.emit();
    }
  }

  protected highlightSegments(text: string): readonly EmrMatchHighlightSegment[] {
    if (!this.highlightMatch()) return [{ text, matched: false }];
    return splitMatchHighlightSegments(text, this.activeFilterQuery());
  }

  protected formattedCreateLabel(queryText: string): string {
    return formatCreatableLabel(this.createLabel(), queryText);
  }

  protected optionBadgeLabel(option: EmrOption): string | null {
    if (!option.badge) return null;
    return typeof option.badge === 'string' ? option.badge : option.badge.label;
  }

  protected optionBadgeTone(option: EmrOption): string {
    if (option.badge && typeof option.badge !== 'string' && option.badge.tone) {
      return option.badge.tone;
    }
    return option.tone ?? 'neutral';
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isPanelOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      if (this.filterMode() !== 'remote') {
        this.isActivelyTyping.set(false);
        this.localQuery.set('');
      }
      this.setPanelOpen(false);
    }
  }

  protected onFocus(): void {
    if (this.readOnly() || this.disabled()) return;
    this.focused.emit();
    if (!this.isPanelOpen()) {
      this.setPanelOpen(true);
    }
  }

  protected togglePanel(): void {
    if (this.readOnly() || this.disabled()) return;
    const next = !this.isPanelOpen();
    if (!next) {
      this.isActivelyTyping.set(false);
      this.localQuery.set('');
    }
    this.setPanelOpen(next);
    if (next) {
      this.queryInputRef()?.nativeElement.focus();
    }
  }

  protected onQueryInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncQueryDom();
      return;
    }
    const next = target.value;
    if (this.filterMode() !== 'remote') {
      this.isActivelyTyping.set(true);
      this.localQuery.set(next);
      if (!this.isPanelOpen()) {
        this.setPanelOpen(true);
      }
    } else {
      if (!this.isPanelOpen()) {
        this.setPanelOpen(true);
      }
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

    if (this.filterMode() === 'remote') {
      if (this.debounceTimer !== null) {
        clearTimeout(this.debounceTimer);
      }
      const minLen = Math.max(0, this.minQueryLength());
      if (next.trim().length >= minLen) {
        const delay = Math.max(0, this.debounceMs());
        this.debounceTimer = setTimeout(() => {
          this.debounceTimer = null;
          this.searchRequested.emit();
        }, delay);
      }
    }
  }

  protected onInputBlur(): void {
    if (this.filterMode() === 'remote') {
      this.syncQueryDom();
    }
    this.blurred.emit();
  }

  protected syncQueryDom(): void {
    const el = this.queryInputRef()?.nativeElement;
    if (!el) return;
    const expected = this.displayedInputValue();
    if (el.value !== expected) el.value = expected;
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (this.readOnly() || this.disabled()) return;
    const key = event.key;
    if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
      event.preventDefault();
      if (!this.isPanelOpen()) {
        this.setPanelOpen(true);
        return;
      }
      const opts = this.flatDisplayedOptions();
      const nextIdx = findNextEnabledSearchOptionIndex(opts, this.activeIndex(), key);
      if (nextIdx !== null) {
        this.activeIndex.set(nextIdx);
        this.scrollActiveOptionIntoView(nextIdx);
      }
      return;
    }
    if (key === 'Escape') {
      event.stopPropagation();
      if (this.filterMode() !== 'remote') {
        this.isActivelyTyping.set(false);
        this.localQuery.set('');
        this.needsQuerySync = true;
      }
      this.setPanelOpen(false);
      return;
    }
    if (key === 'Enter') {
      event.preventDefault();
      const opts = this.flatDisplayedOptions();
      const idx = this.activeIndex();
      if (this.isPanelOpen() && idx >= 0 && idx < opts.length) {
        this.onSelectOption(opts[idx]);
        this.submitted.emit();
        return;
      }
      const custom = this.customCandidate();
      if (custom && (idx === opts.length || opts.length === 0)) {
        this.onCommitCustomValue(custom);
        this.submitted.emit();
        return;
      }
      if (this.filterMode() === 'local') {
        const firstEnabled = opts.find((o) => !o.disabled);
        if (firstEnabled) {
          this.onSelectOption(firstEnabled);
        }
        this.submitted.emit();
        return;
      }
      this.searchRequested.emit();
      this.submitted.emit();
    }
  }

  private scrollActiveOptionIntoView(index: number): void {
    const btn = this.optionButtons()[index]?.nativeElement;
    if (btn && typeof btn.scrollIntoView === 'function') {
      btn.scrollIntoView({ block: 'nearest' });
    }
  }

  protected onOptionMouseEnter(index: number): void {
    if (index >= 0) {
      this.activeIndex.set(index);
    }
  }

  protected onSearchClick(): void {
    if (this.readOnly() || this.disabled() || this.loading()) return;
    if (!this.isPanelOpen()) {
      this.setPanelOpen(true);
    }
    this.searchRequested.emit();
  }

  protected onSelectOption(option: EmrOption): void {
    if (this.readOnly() || this.disabled() || option.disabled || option.readOnly) return;
    const val = option.value;
    const shouldClose = this.resolvedCloseOnSelect();
    if (this.filterMode() !== 'remote') {
      this.isActivelyTyping.set(false);
      this.localQuery.set('');
      this.needsQuerySync = true;
    }

    if (this.multiple()) {
      const current = this.selectedValues();
      const exists = current.includes(val);
      const maxSel = this.maxSelections();
      if (!exists && typeof maxSel === 'number' && maxSel >= 1 && current.length >= maxSel) {
        return;
      }
      const next = exists ? current.filter((v) => v !== val) : [...current, val];
      if (exists) {
        this.removeRequested.emit(val);
        this.selectionRemoved.emit(val);
      } else {
        this.optionSelected.emit(val);
      }
      this.valueChange.emit(next);
    } else {
      this.optionSelected.emit(val);
      this.valueChange.emit(val);
    }

    if (shouldClose) {
      this.setPanelOpen(false);
    }
  }

  protected onCommitCustomValue(customText: string): void {
    if (this.readOnly() || this.disabled()) return;
    this.isActivelyTyping.set(false);
    this.localQuery.set('');
    this.needsQuerySync = true;
    this.createRequested.emit(customText);
    this.customValueCommitted.emit(customText);
    this.optionSelected.emit(customText);
    if (this.multiple()) {
      const current = this.selectedValues();
      const next = current.includes(customText) ? current : [...current, customText];
      this.valueChange.emit(next);
    } else {
      this.valueChange.emit(customText);
    }
    if (this.resolvedCloseOnSelect()) {
      this.setPanelOpen(false);
    }
  }

  protected onClear(): void {
    if (this.readOnly() || this.disabled()) return;
    this.isActivelyTyping.set(false);
    this.localQuery.set('');
    this.needsQuerySync = true;
    this.queryChange.emit('');
    this.queryChanged.emit('');
    if (this.multiple()) {
      const preserved = this.selectedChips()
        .filter((item) => item.readOnly)
        .map((item) => item.value);
      this.valueChange.emit(preserved.length ? preserved : []);
    } else {
      const currentVal = this.selectedValues()[0];
      const currentOpt = this.selectedChips().find((item) => item.value === currentVal);
      if (!currentOpt?.readOnly) {
        this.valueChange.emit(null);
      }
    }
    this.cleared.emit();
    this.setPanelOpen(false);
  }

  protected onRemove(val: string): void {
    if (this.readOnly() || this.disabled()) return;
    const item = this.selectedChips().find((o) => o.value === val);
    if (item?.readOnly) return;
    this.removeRequested.emit(val);
    this.selectionRemoved.emit(val);
    if (this.multiple()) {
      const next = this.selectedValues().filter((v) => v !== val);
      this.valueChange.emit(next);
    }
  }

  protected isSelected(optionValue: string): boolean {
    return isSearchOptionSelected(optionValue, this.value(), this.selected());
  }

  protected isOptionBlockedByMax(_optionValue: string, isOptSelected: boolean): boolean {
    if (!this.multiple() || isOptSelected) return false;
    const maxSel = this.maxSelections();
    return typeof maxSel === 'number' && maxSel >= 1 && this.selectedValues().length >= maxSel;
  }
}
