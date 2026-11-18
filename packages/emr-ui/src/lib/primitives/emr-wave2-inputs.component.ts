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
import type {
  EmrBadge,
  EmrControlVariant,
  EmrDateRangePreset,
  EmrDateRangeValue,
  EmrMatchHighlightSegment,
  EmrOption,
  EmrScoredOption,
  EmrSearchSelectFilterMode,
  EmrSearchSelectSize,
  EmrTagInputSize,
  EmrTagInputVariant,
  EmrTone,
} from '@drguptavivek/emr-controller';
import { emptyToNull } from './emr-inputs.logic';
import {
  addTagValues,
  buildCalendarMonthCells,
  clearUnlockedTags,
  commitTagInputValues,
  filterOptionsLocally,
  findNextEnabledSearchOptionIndex,
  groupOptions,
  isIsoDateInRange,
  isIsoRangeEdge,
  isTagLocked,
  normalizeDateRangeSelection,
  popLastUnlockedTag,
  rankAndFilterOptions,
  rankTagSuggestions,
  removeTagInputAtIndex,
  resolveComboboxDisplayValue,
  resolveCustomSearchCandidate,
  resolveDefaultActiveOptionIndex,
  resolveEmrTagsValue,
  splitMatchHighlightSegments,
  splitTagTokens,
} from './emr-wave2.logic';

let nextWave2InputId = 0;

function optionalBooleanAttribute(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return booleanAttribute(value);
}

@Component({
  selector: 'emr-date-range-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="emr-field" [id]="resolvedId()" role="group" [attr.aria-label]="label() || 'Date range'">
      @if (label() || showClear()) {
        <div [class.emr-choice-header]="showClear()">
          @if (label()) {
            <span class="emr-field__label" [class.emr-sr-only]="labelHidden()">
              {{ label() }}
              @if (required()) {
                <span class="emr-field__required" aria-hidden="true">*</span>
              }
            </span>
          }
          @if (showClear()) {
            <button
              type="button"
              class="emr-choice-clear"
              [attr.aria-label]="'Clear ' + (label() || 'date range')"
              (click)="clearRange()"
            >
              Clear
            </button>
          }
        </div>
      }

      @if (presets().length > 0 && !readOnly()) {
        <div class="emr-date-range__presets">
          @for (preset of presets(); track preset.id) {
            <button
              type="button"
              class="emr-button emr-button--small emr-button--outline"
              [disabled]="disabled()"
              (click)="applyPreset(preset)"
            >
              {{ preset.label }}
            </button>
          }
        </div>
      }

      <div class="emr-quantity">
        <input
          #startInput
          class="emr-control"
          [id]="resolvedId() + '-start'"
          [attr.type]="mode() === 'datetime' ? 'datetime-local' : 'date'"
          [value]="startDomValue()"
          [attr.min]="min() ?? null"
          [attr.max]="max() ?? null"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="(label() || 'Date range') + ' start'"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (input)="onBoundInput('start', $event)"
          (blur)="syncDom()"
        />
        <span class="emr-field__hint" aria-hidden="true">→</span>
        <input
          #endInput
          class="emr-control"
          [id]="resolvedId() + '-end'"
          [attr.type]="mode() === 'datetime' ? 'datetime-local' : 'date'"
          [value]="endDomValue()"
          [attr.min]="min() ?? null"
          [attr.max]="max() ?? null"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="(label() || 'Date range') + ' end'"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (input)="onBoundInput('end', $event)"
          (blur)="syncDom()"
        />
        @if (showCalendar()) {
          <button
            type="button"
            class="emr-button emr-button--outline emr-button--small"
            [disabled]="disabled()"
            [attr.aria-expanded]="calendarOpen()"
            aria-label="Toggle calendar"
            (click)="calendarOpen.set(!calendarOpen())"
          >
            Calendar
          </button>
        }
      </div>

      @if (showCalendar() && calendarOpen()) {
        <div
          class="emr-popover__panel"
          style="position: static; max-width: 100%"
          role="region"
          aria-label="Range calendar"
        >
          <div class="emr-choice-header">
            <button
              type="button"
              class="emr-button emr-button--ghost emr-button--small"
              aria-label="Previous month"
              (click)="stepMonth(-1)"
            >
              ‹
            </button>
            <strong>{{ calendarTitle() }}</strong>
            <button
              type="button"
              class="emr-button emr-button--ghost emr-button--small"
              aria-label="Next month"
              (click)="stepMonth(1)"
            >
              ›
            </button>
          </div>
          <div
            class="emr-choice-list--grid"
            style="--emr-choice-cols: 7; gap: 4px"
            role="grid"
            [attr.aria-label]="calendarTitle()"
          >
            @for (cell of calendarCells(); track cell.iso) {
              <button
                type="button"
                class="emr-button emr-button--small"
                [class.emr-button--primary]="isEdgeCell(cell.iso)"
                [class.emr-button--secondary]="!isEdgeCell(cell.iso) && isInRangeCell(cell.iso)"
                [class.emr-button--ghost]="!isEdgeCell(cell.iso) && !isInRangeCell(cell.iso)"
                [disabled]="disabled() || readOnly() || isDateOutOfBounds(cell.iso)"
                [attr.data-iso]="cell.iso"
                [attr.data-in-range]="isInRangeCell(cell.iso) || null"
                [attr.data-range-edge]="rangeEdgeFor(cell.iso)"
                [attr.aria-pressed]="isEdgeCell(cell.iso) || isInRangeCell(cell.iso)"
                (click)="onCalendarDayClick(cell.iso)"
              >
                {{ cell.day }}
              </button>
            }
          </div>
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
export class EmrDateRangeInputComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly mode = input<'date' | 'datetime'>('date');
  readonly value = input<EmrDateRangeValue | null>(null);
  readonly min = input<string>();
  readonly max = input<string>();
  readonly presets = input<readonly EmrDateRangePreset[]>([]);
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly showCalendar = input(true, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<EmrDateRangeValue | null>();
  readonly cleared = output<void>();

  private readonly fallbackId = `emr-date-range-${++nextWave2InputId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly calendarOpen = signal(false);
  protected readonly calendarYear = signal(2026);
  protected readonly calendarMonth0 = signal(10); // Nov (0-indexed)

  protected readonly startDomValue = computed(() => this.value()?.start ?? '');
  protected readonly endDomValue = computed(() => this.value()?.end ?? '');

  protected readonly showClear = computed(() => {
    const v = this.value();
    return Boolean(
      this.clearable() &&
        !this.readOnly() &&
        !this.disabled() &&
        (v?.start || v?.end),
    );
  });

  protected readonly calendarTitle = computed(() => {
    const y = this.calendarYear();
    const m = String(this.calendarMonth0() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  protected readonly calendarCells = computed(() =>
    buildCalendarMonthCells(this.calendarYear(), this.calendarMonth0()),
  );

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly startInputRef = viewChild<ElementRef<HTMLInputElement>>('startInput');
  private readonly endInputRef = viewChild<ElementRef<HTMLInputElement>>('endInput');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onBoundInput(edge: 'start' | 'end', event: Event): void {
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    const raw = emptyToNull((event.target as HTMLInputElement).value);
    const cur = this.value() ?? { start: null, end: null };
    let nextStart = edge === 'start' ? raw : cur.start;
    let nextEnd = edge === 'end' ? raw : cur.end;
    if (nextStart && nextEnd && nextEnd < nextStart) {
      if (edge === 'start') nextEnd = nextStart;
      else nextStart = nextEnd;
    }
    this.scheduleDomSync();
    if (!nextStart && !nextEnd) {
      this.valueChange.emit(null);
    } else {
      this.valueChange.emit({ start: nextStart, end: nextEnd });
    }
  }

  protected onCalendarDayClick(iso: string): void {
    if (this.readOnly() || this.disabled() || this.isDateOutOfBounds(iso)) return;
    const next = normalizeDateRangeSelection(this.value(), iso);
    this.scheduleDomSync();
    this.valueChange.emit(next);
  }

  protected applyPreset(preset: EmrDateRangePreset): void {
    if (this.readOnly() || this.disabled()) return;
    this.scheduleDomSync();
    this.valueChange.emit({
      start: preset.range.start,
      end: preset.range.end,
    });
  }

  protected clearRange(): void {
    if (this.readOnly() || this.disabled()) return;
    this.scheduleDomSync();
    this.valueChange.emit(null);
    this.cleared.emit();
  }

  protected stepMonth(delta: -1 | 1): void {
    let m = this.calendarMonth0() + delta;
    let y = this.calendarYear();
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    this.calendarYear.set(y);
    this.calendarMonth0.set(m);
  }

  protected isInRangeCell(iso: string): boolean {
    const dateRange = this.toDateOnlyRange();
    return isIsoDateInRange(iso, dateRange);
  }

  protected rangeEdgeFor(iso: string): 'start' | 'end' | 'both' | null {
    return isIsoRangeEdge(iso, this.toDateOnlyRange());
  }

  protected isEdgeCell(iso: string): boolean {
    return this.rangeEdgeFor(iso) !== null;
  }

  protected isDateOutOfBounds(iso: string): boolean {
    const min = this.min()?.slice(0, 10);
    const max = this.max()?.slice(0, 10);
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  }

  private toDateOnlyRange(): EmrDateRangeValue | null {
    const v = this.value();
    if (!v) return null;
    return {
      start: v.start ? v.start.slice(0, 10) : null,
      end: v.end ? v.end.slice(0, 10) : null,
    };
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
    const startEl = this.startInputRef()?.nativeElement;
    if (startEl && startEl.value !== this.startDomValue()) {
      startEl.value = this.startDomValue();
    }
    const endEl = this.endInputRef()?.nativeElement;
    if (endEl && endEl.value !== this.endDomValue()) {
      endEl.value = this.endDomValue();
    }
  }
}

@Component({
  selector: 'emr-combobox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div
      class="emr-field emr-combobox"
      [class.emr-combobox--sm]="size() === 'sm'"
      [class.emr-combobox--filled]="variant() === 'filled'"
      [class.emr-combobox--subtle]="variant() === 'subtle'"
      [class.emr-combobox--loading]="loading()"
      [class.emr-combobox--invalid]="isInvalid()"
      [class.emr-combobox--warning]="!isInvalid() && !!warning()"
      [class.emr-combobox--readonly]="readOnly()"
    >
      @if (label()) {
        <label class="emr-field__label" [class.emr-sr-only]="labelHidden()" [for]="resolvedId()">
          {{ label() }}
          @if (required()) {
            <span class="emr-field__required" aria-hidden="true">*</span>
          }
        </label>
      }
      <div class="emr-combobox__bar">
        <div class="emr-combobox__input-wrap">
          <input
            #comboInput
            class="emr-control emr-combobox__input"
            type="text"
            role="combobox"
            autocomplete="off"
            [id]="resolvedId()"
            [value]="displayedText()"
            [placeholder]="placeholder()"
            [required]="required()"
            [disabled]="disabled()"
            [readOnly]="readOnly()"
            [attr.aria-label]="!label() ? (ariaLabel() || placeholder() || 'Combobox') : null"
            [attr.aria-expanded]="isPanelOpen()"
            [attr.aria-controls]="isPanelOpen() ? resolvedId() + '-listbox' : null"
            [attr.aria-activedescendant]="activeDescendantId()"
            [attr.aria-autocomplete]="'list'"
            [attr.aria-busy]="loading() || null"
            [attr.aria-invalid]="isInvalid() || null"
            [attr.aria-describedby]="describedBy()"
            (focus)="onFocus()"
            (blur)="onBlur()"
            (input)="onInput($event)"
            (keydown)="onInputKeydown($event)"
          />
          @if (loading()) {
            <span class="emr-combobox__trigger-spinner" aria-hidden="true">
              <svg class="emr-search-select__spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </span>
          }
        </div>
        @if (showClear()) {
          <button
            type="button"
            class="emr-button emr-button--outline emr-button--small emr-combobox__icon-btn"
            [attr.aria-label]="clearLabel() + ' ' + (ariaLabel() || label() || 'value')"
            (click)="clearValue()"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        }
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small emr-combobox__icon-btn"
          [disabled]="disabled() || readOnly()"
          [attr.aria-label]="(isPanelOpen() ? 'Close ' : 'Open ') + (ariaLabel() || label() || 'suggestions')"
          [attr.aria-expanded]="isPanelOpen()"
          (click)="toggleOpen()"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            @if (isPanelOpen()) {
              <path d="m18 15-6-6-6 6" />
            } @else {
              <path d="m6 9 6 6 6-6" />
            }
          </svg>
        </button>
      </div>
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">{{ error() }}</span>
      }
      @if (!labelHidden() && warning()) {
        <span class="emr-field__warning" [id]="resolvedId() + '-warning'">{{ warning() }}</span>
      }
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (isPanelOpen()) {
        <div
          class="emr-combobox__panel"
          [id]="resolvedId() + '-listbox'"
          role="listbox"
          [attr.aria-label]="ariaLabel() || label() || 'Suggestions'"
          [attr.aria-busy]="loading() || null"
        >
          @if (loading()) {
            <div class="emr-search-select__loading" role="status">
              <svg class="emr-search-select__spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span>{{ loadingMessage() }}</span>
            </div>
          } @else if (optionGroups().length === 0 && !customCandidate()) {
            <div class="emr-search-select__empty">
              @if (effectiveAllowCustomValue() && trimmedQuery()) {
                Using custom value "{{ trimmedQuery() }}"
              } @else {
                {{ emptyMessage() }}
              }
            </div>
          } @else {
            @for (grp of optionGroups(); track grp.label ?? '__ungrouped__') {
              @if (grp.label !== null) {
                <div class="emr-search-select__group-header" role="presentation">{{ grp.label }}</div>
              }
              @for (option of grp.options; track option.value) {
                @let optIdx = flatOptionIndex(option.value);
                @let isOptSelected = value() === option.value;
                @let isOptActive = activeIndex() === optIdx;
                <button
                  type="button"
                  class="emr-search-select__option"
                  [class.emr-search-select__option--selected]="isOptSelected"
                  [class.emr-search-select__option--active]="isOptActive"
                  [class.emr-search-select__option--disabled]="option.disabled"
                  [class.emr-search-select__option--readonly]="option.readOnly"
                  role="option"
                  [id]="resolvedId() + '-opt-' + optIdx"
                  [disabled]="option.disabled"
                  [attr.aria-selected]="isOptSelected"
                  [attr.aria-readonly]="option.readOnly || null"
                  (mousedown)="onOptionMouseDown($event)"
                  (click)="selectSuggestion(option)"
                >
                  <span class="emr-search-select__option-check" aria-hidden="true">
                    @if (isOptSelected) {
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
                      @if (isBestMatchOption(option.value)) {
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
                    @if (option.badge) {
                      @let b = optionBadge(option.badge);
                      <span [class]="'emr-badge emr-tone-' + (b.tone || 'neutral')">{{ b.label }}</span>
                    } @else if (option.tone) {
                      <span [class]="'emr-badge emr-tone-' + option.tone">{{ option.tone }}</span>
                    }
                    @if (option.readOnly) {
                      <span class="emr-search-select__lock" aria-label="Read-only option">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                    }
                  </span>
                </button>
              }
            }
            @if (customCandidate(); as customVal) {
              @let customIdx = visibleFlatCount();
              <button
                type="button"
                class="emr-search-select__option"
                data-custom-option="true"
                [class.emr-search-select__option--active]="activeIndex() === customIdx"
                role="option"
                [id]="resolvedId() + '-opt-' + customIdx"
                aria-selected="false"
                (mousedown)="onOptionMouseDown($event)"
                (click)="commitCustomValue(customVal)"
              >
                <span class="emr-search-select__option-check" aria-hidden="true"></span>
                <span class="emr-search-select__option-body">
                  <span class="emr-search-select__option-label">Use "{{ customVal }}"</span>
                </span>
              </button>
            }
          }
        </div>
      }
    </div>
  `,
})
export class EmrComboboxComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly ariaLabel = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly placeholder = input('Type or select…');
  readonly value = input<string | null>(null);
  readonly options = input<readonly EmrOption[]>([]);
  readonly variant = input<EmrControlVariant>('outline');
  readonly size = input<EmrSearchSelectSize>('md');
  readonly filterMode = input<EmrSearchSelectFilterMode>('local');
  readonly allowCustomValue = input(true, { transform: booleanAttribute });
  readonly creatable = input<boolean | undefined, unknown>(undefined, { transform: optionalBooleanAttribute });
  readonly highlightMatch = input(true, { transform: booleanAttribute });
  readonly autoHighlight = input(true, { transform: booleanAttribute });
  readonly clearable = input(true, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly loadingMessage = input('Loading suggestions…');
  readonly emptyMessage = input('No matching options');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly warning = input('');
  readonly open = input<boolean | undefined, unknown>(undefined, { transform: optionalBooleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<string | null>();
  readonly optionSelected = output<EmrOption>();
  readonly cleared = output<void>();
  readonly openChange = output<boolean>();
  readonly queryChange = output<string>();
  readonly customValueCommitted = output<string>();
  readonly submitted = output<string>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fallbackId = `emr-combobox-${++nextWave2InputId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly localOpen = signal(false);
  protected readonly isActivelyTyping = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(-1);

  protected readonly effectiveAllowCustomValue = computed(
    () => this.creatable() ?? this.allowCustomValue(),
  );

  protected readonly isInvalid = computed(() => this.invalid() || Boolean(this.error()));

  protected readonly isPanelOpen = computed(() => {
    if (this.readOnly() || this.disabled()) return false;
    const controlled = this.open();
    return controlled !== undefined ? controlled : this.localOpen();
  });

  protected readonly displayedText = computed(() =>
    resolveComboboxDisplayValue({
      isActivelyTyping: this.isActivelyTyping(),
      query: this.query(),
      value: this.value(),
      options: this.options(),
    }),
  );

  protected readonly trimmedQuery = computed(() => this.query().trim());

  private readonly scoredResults = computed<readonly EmrScoredOption[]>(() =>
    rankAndFilterOptions(this.options(), this.isActivelyTyping() ? this.query() : '', this.filterMode()),
  );

  private readonly bestMatchValue = computed<string | null>(() => {
    if (!this.isActivelyTyping() || !this.trimmedQuery() || this.filterMode() !== 'local') {
      return null;
    }
    return this.scoredResults().find((r) => r.isBestMatch)?.option.value ?? null;
  });

  protected readonly filteredOptions = computed(() =>
    this.scoredResults().map((r) => r.option),
  );
  protected readonly optionGroups = computed(() => groupOptions(this.filteredOptions()));
  protected readonly visibleFlatOptions = computed(() =>
    this.optionGroups().flatMap((g) => g.options),
  );
  protected readonly visibleFlatCount = computed(() => this.visibleFlatOptions().length);

  private readonly flatIndexMap = computed(() => {
    const map = new Map<string, number>();
    this.visibleFlatOptions().forEach((opt, idx) => map.set(opt.value, idx));
    return map;
  });

  protected readonly customCandidate = computed(() =>
    this.isActivelyTyping()
      ? resolveCustomSearchCandidate(this.query(), this.options(), this.effectiveAllowCustomValue())
      : null,
  );

  protected readonly activeDescendantId = computed(() => {
    if (!this.isPanelOpen()) return null;
    const idx = this.activeIndex();
    const total = this.visibleFlatCount() + (this.customCandidate() ? 1 : 0);
    if (idx < 0 || idx >= total) return null;
    return `${this.resolvedId()}-opt-${idx}`;
  });

  protected readonly showClear = computed(
    () => Boolean(this.clearable() && (this.value() || this.displayedText()) && !this.readOnly() && !this.disabled()),
  );

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.error()) ids.push(`${id}-error`);
    if (this.warning()) ids.push(`${id}-warning`);
    if (this.hint()) ids.push(`${id}-hint`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('comboInput');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected flatOptionIndex(value: string): number {
    return this.flatIndexMap().get(value) ?? -1;
  }

  protected isBestMatchOption(value: string): boolean {
    return this.bestMatchValue() === value;
  }

  protected highlightSegments(text: string): readonly EmrMatchHighlightSegment[] {
    if (!this.highlightMatch() || !this.isActivelyTyping()) {
      return [{ text, matched: false }];
    }
    return splitMatchHighlightSegments(text, this.query());
  }

  protected optionBadge(badge: string | EmrBadge): EmrBadge {
    return typeof badge === 'string' ? { label: badge, tone: 'neutral' } : badge;
  }

  private setOpen(next: boolean): void {
    if (this.open() === undefined) {
      this.localOpen.set(next);
    }
    this.openChange.emit(next);
    if (next) {
      const selectedValues = this.value() ? [this.value()!] : [];
      this.activeIndex.set(
        resolveDefaultActiveOptionIndex(
          this.visibleFlatOptions(),
          selectedValues,
          this.isActivelyTyping() ? this.query() : '',
          this.autoHighlight(),
        ),
      );
    } else {
      this.activeIndex.set(-1);
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isPanelOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.isActivelyTyping.set(false);
      this.setOpen(false);
    }
  }

  protected onFocus(): void {
    if (this.readOnly() || this.disabled()) return;
    const current = resolveComboboxDisplayValue({
      isActivelyTyping: false,
      query: '',
      value: this.value(),
      options: this.options(),
    });
    this.query.set(current);
    this.focused.emit();
    this.setOpen(true);
  }

  protected onBlur(): void {
    this.isActivelyTyping.set(false);
    this.setOpen(false);
    this.syncDom();
    this.blurred.emit();
  }

  protected toggleOpen(): void {
    if (this.readOnly() || this.disabled()) return;
    const next = !this.isPanelOpen();
    if (next) {
      const current = resolveComboboxDisplayValue({
        isActivelyTyping: false,
        query: '',
        value: this.value(),
        options: this.options(),
      });
      this.query.set(current);
    } else {
      this.isActivelyTyping.set(false);
    }
    this.setOpen(next);
    this.inputRef()?.nativeElement.focus();
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    const nextQuery = target.value;
    this.isActivelyTyping.set(true);
    this.query.set(nextQuery);
    this.queryChange.emit(nextQuery);
    this.setOpen(true);
    this.scheduleDomSync();
    if (this.effectiveAllowCustomValue()) {
      this.valueChange.emit(emptyToNull(nextQuery));
    }
  }

  protected onOptionMouseDown(event: MouseEvent): void {
    event.preventDefault();
  }

  protected selectSuggestion(option: EmrOption): void {
    if (this.readOnly() || this.disabled() || option.disabled || option.readOnly) return;
    this.isActivelyTyping.set(false);
    this.query.set(option.label);
    this.setOpen(false);
    this.scheduleDomSync();
    this.optionSelected.emit(option);
    this.valueChange.emit(option.value);
    this.submitted.emit(option.value);
  }

  protected commitCustomValue(customVal: string): void {
    if (this.readOnly() || this.disabled()) return;
    const trimmed = customVal.trim();
    if (!trimmed) return;
    this.isActivelyTyping.set(false);
    this.query.set(trimmed);
    this.setOpen(false);
    this.scheduleDomSync();
    this.customValueCommitted.emit(trimmed);
    this.valueChange.emit(trimmed);
    this.submitted.emit(trimmed);
  }

  protected clearValue(): void {
    if (this.readOnly() || this.disabled()) return;
    this.isActivelyTyping.set(false);
    this.query.set('');
    this.setOpen(false);
    this.scheduleDomSync();
    this.valueChange.emit(null);
    this.queryChange.emit('');
    this.cleared.emit();
    this.inputRef()?.nativeElement.focus();
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (this.readOnly() || this.disabled()) return;
    const flat = this.visibleFlatOptions();
    const custom = this.customCandidate();
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (!this.isPanelOpen()) {
        this.setOpen(true);
        return;
      }
      const next = findNextEnabledSearchOptionIndex(flat, this.activeIndex(), event.key);
      if (next !== null) {
        this.activeIndex.set(next);
      } else if (custom && event.key === 'ArrowDown') {
        this.activeIndex.set(flat.length);
      }
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.activeIndex();
      if (this.isPanelOpen() && idx >= 0 && idx < flat.length) {
        const opt = flat[idx];
        if (opt && !opt.disabled && !opt.readOnly) {
          this.selectSuggestion(opt);
        }
        return;
      }
      if (this.isPanelOpen() && custom && idx === flat.length) {
        this.commitCustomValue(custom);
        return;
      }
      const trimmed = this.trimmedQuery();
      if (this.effectiveAllowCustomValue() && trimmed) {
        this.commitCustomValue(trimmed);
        return;
      }
      const firstEnabled = flat.find((o) => !o.disabled && !o.readOnly);
      if (firstEnabled) {
        this.selectSuggestion(firstEnabled);
      }
      return;
    }
    if (event.key === 'Escape' && this.isPanelOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.isActivelyTyping.set(false);
      this.setOpen(false);
    }
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
    const el = this.inputRef()?.nativeElement;
    if (!el) return;
    const expected = this.displayedText();
    if (el.value !== expected) el.value = expected;
  }
}

@Component({
  selector: 'emr-tag-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="emr-field emr-tag-input-root"
      [class.emr-tag-input--sm]="size() === 'sm'"
      [class.emr-tag-input--filled]="variant() === 'filled'"
      [class.emr-tag-input--subtle]="variant() === 'subtle'"
      [class.emr-tag-input--readonly]="readOnly()"
      [class.emr-tag-input--disabled]="disabled()"
      [class.emr-tag-input--invalid]="isInvalid()"
      [class.emr-tag-input--warning]="!isInvalid() && !!warning()"
    >
      @if (label() || showClear()) {
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
              class="emr-choice-clear emr-tag-input__clear"
              [attr.aria-label]="clearLabel() + ' ' + (label() || 'tags')"
              (click)="clearAll()"
            >
              {{ clearLabel() }}
            </button>
          }
        </div>
      }
      <div class="emr-tag-input-wrap">
        <div class="emr-tag-input" role="list" [attr.aria-label]="resolvedAriaLabel()">
          @for (tag of resolvedTags(); track $index; let idx = $index) {
            @let locked = isLockedTag(tag);
            <span
              role="listitem"
              [class]="'emr-chip emr-tag-input__chip emr-tone-' + chipTone()"
              [class.emr-tag-input__chip--locked]="locked"
            >
              @if (locked) {
                <span class="emr-tag-input__chip-lock" aria-label="Locked tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
              }
              <span class="emr-tag-input__chip-label">{{ tag }}</span>
              @if (!readOnly() && !disabled() && !locked) {
                <button
                  #chipRemoveBtn
                  type="button"
                  class="emr-tag-input__chip-remove"
                  [attr.aria-label]="'Remove ' + tag"
                  (click)="removeTagAt(idx)"
                  (keydown)="onChipRemoveKeydown($event, idx)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              }
            </span>
          }
          <input
            #tagInputEl
            class="emr-tag-input__field"
            type="text"
            role="combobox"
            autocomplete="off"
            [id]="resolvedId()"
            [value]="draftText()"
            [placeholder]="isMaxReached() ? '' : placeholder()"
            [disabled]="disabled()"
            [readOnly]="readOnly() || isMaxReached()"
            [attr.aria-readonly]="readOnly() ? 'true' : null"
            [attr.maxlength]="maxTagLength() ?? null"
            [attr.aria-label]="labelHidden() || !label() ? resolvedAriaLabel() : null"
            [attr.aria-required]="required() ? 'true' : null"
            [attr.aria-invalid]="isInvalid() || null"
            [attr.aria-describedby]="describedBy()"
            [attr.aria-expanded]="isDropdownOpen()"
            [attr.aria-controls]="isDropdownOpen() ? resolvedId() + '-listbox' : null"
            [attr.aria-activedescendant]="activeSuggestionId()"
            (focus)="onFocus()"
            (input)="onDraftInput($event)"
            (paste)="onPaste($event)"
            (keydown)="onKeydown($event)"
            (blur)="onBlur()"
          />
        </div>
        @if (isDropdownOpen()) {
          <div
            class="emr-search-select__dropdown emr-tag-input__dropdown"
            role="listbox"
            [id]="resolvedId() + '-listbox'"
            aria-label="Tag suggestions"
          >
            @for (sug of rankedSuggestions(); track sug.value; let i = $index) {
              <button
                type="button"
                class="emr-search-select__option emr-tag-input__option"
                [class.emr-search-select__option--active]="activeSuggestionIndex() === i"
                role="option"
                [id]="resolvedId() + '-opt-' + i"
                [attr.aria-selected]="activeSuggestionIndex() === i"
                (mousedown)="onSuggestionMouseDown($event)"
                (click)="selectSuggestion(sug.value)"
              >
                <span class="emr-search-select__option-body">
                  <span class="emr-search-select__option-label">
                    @for (seg of highlightSegments(sug.value); track $index) {
                      @if (seg.matched) {
                        <mark class="emr-match-highlight">{{ seg.text }}</mark>
                      } @else {
                        {{ seg.text }}
                      }
                    }
                  </span>
                </span>
                @if (sug.isBestMatch) {
                  <span class="emr-search-select__option-meta">
                    <span class="emr-search-select__best-match">Best match</span>
                  </span>
                }
              </button>
            }
          </div>
        }
      </div>
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && warning() && !error()) {
        <span class="emr-field__warning" role="status" [id]="resolvedId() + '-warning'">{{ warning() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" role="alert" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </div>
  `,
})
export class EmrTagInputComponent {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly ariaLabel = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly placeholder = input('Add tag and press Enter…');
  readonly value = input<readonly string[]>([]);
  readonly tags = input<readonly string[] | undefined>(undefined);
  readonly suggestions = input<readonly string[]>([]);
  readonly separators = input<readonly string[] | undefined>(undefined);
  readonly delimiters = input<readonly string[]>([',', ';']);
  readonly allowDuplicates = input(false, { transform: booleanAttribute });
  readonly maxTags = input<number | undefined>(undefined);
  readonly maxTagLength = input<number | undefined>(undefined);
  readonly lockedTags = input<readonly string[]>([]);
  readonly variant = input<EmrTagInputVariant>('outline');
  readonly size = input<EmrTagInputSize>('md');
  readonly chipTone = input<EmrTone>('neutral');
  readonly filterSuggestions = input(true, { transform: booleanAttribute });
  readonly highlightMatch = input(true, { transform: booleanAttribute });
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly warning = input('');
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<readonly string[]>();
  readonly tagsChange = output<readonly string[]>();
  readonly tagAdded = output<string>();
  readonly tagRemoved = output<string>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly tagInputEl = viewChild<ElementRef<HTMLInputElement>>('tagInputEl');
  private readonly chipRemoveBtns = viewChildren<ElementRef<HTMLButtonElement>>('chipRemoveBtn');

  private readonly fallbackId = `emr-tag-input-${++nextWave2InputId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly draftText = signal('');
  protected readonly isFocused = signal(false);
  protected readonly dropdownDismissed = signal(false);
  protected readonly activeSuggestionIndex = signal(-1);

  protected readonly resolvedTags = computed(() => resolveEmrTagsValue(this.tags(), this.value()));
  protected readonly resolvedSeparators = computed(() => this.separators() ?? this.delimiters());
  protected readonly isInvalid = computed(() => this.invalid() || Boolean(this.error()));
  protected readonly resolvedAriaLabel = computed(() => this.ariaLabel() || this.label() || 'Tags');

  protected readonly isMaxReached = computed(() => {
    const max = this.maxTags();
    return max !== undefined && this.resolvedTags().length >= max;
  });

  protected readonly showClear = computed(() => {
    if (!this.clearable() || this.readOnly() || this.disabled()) return false;
    const locked = this.lockedTags();
    return this.resolvedTags().some((tag) => !isTagLocked(tag, locked));
  });

  protected readonly rankedSuggestions = computed(() =>
    rankTagSuggestions(this.suggestions(), this.resolvedTags(), this.draftText(), {
      allowDuplicates: this.allowDuplicates(),
      filterSuggestions: this.filterSuggestions(),
    }),
  );

  protected readonly isDropdownOpen = computed(
    () =>
      this.isFocused() &&
      !this.dropdownDismissed() &&
      !this.readOnly() &&
      !this.disabled() &&
      !this.isMaxReached() &&
      this.rankedSuggestions().length > 0,
  );

  protected readonly activeSuggestionId = computed(() => {
    const idx = this.activeSuggestionIndex();
    if (!this.isDropdownOpen() || idx < 0 || idx >= this.rankedSuggestions().length) {
      return null;
    }
    return `${this.resolvedId()}-opt-${idx}`;
  });

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.warning() && !this.error()) ids.push(`${id}-warning`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  protected isLockedTag(tag: string): boolean {
    return isTagLocked(tag, this.lockedTags());
  }

  protected highlightSegments(text: string): readonly EmrMatchHighlightSegment[] {
    if (!this.highlightMatch()) {
      return [{ text, matched: false }];
    }
    return splitMatchHighlightSegments(text, this.draftText());
  }

  private emitTags(next: readonly string[]): void {
    this.valueChange.emit(next);
    this.tagsChange.emit(next);
  }

  protected onFocus(): void {
    this.isFocused.set(true);
    this.dropdownDismissed.set(false);
    this.focused.emit();
  }

  protected onBlur(): void {
    this.isFocused.set(false);
    this.activeSuggestionIndex.set(-1);
    this.commitDraftOnBlur();
    this.blurred.emit();
  }

  protected onSuggestionMouseDown(event: MouseEvent): void {
    event.preventDefault();
  }

  protected selectSuggestion(value: string): void {
    this.draftText.set('');
    this.activeSuggestionIndex.set(-1);
    this.addCandidateTags([value]);
    this.tagInputEl()?.nativeElement.focus();
  }

  protected onDraftInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      target.value = '';
      return;
    }
    this.dropdownDismissed.set(false);
    this.activeSuggestionIndex.set(-1);
    const raw = target.value;
    const seps = this.resolvedSeparators();
    if (seps.some((d) => raw.includes(d))) {
      this.draftText.set('');
      target.value = '';
      this.commitRawCandidates(raw);
      return;
    }
    const maxLen = this.maxTagLength();
    const nextDraft = maxLen !== undefined && maxLen >= 0 ? raw.slice(0, maxLen) : raw;
    if (nextDraft !== raw) {
      target.value = nextDraft;
    }
    this.draftText.set(nextDraft);
  }

  protected onPaste(event: ClipboardEvent): void {
    if (this.readOnly() || this.disabled()) return;
    const text = event.clipboardData?.getData('text') ?? '';
    const seps = this.resolvedSeparators();
    if (text && seps.some((s) => text.includes(s))) {
      event.preventDefault();
      this.draftText.set('');
      this.commitRawCandidates(text);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.readOnly() || this.disabled()) return;
    const suggestions = this.rankedSuggestions();

    if (event.key === 'ArrowDown' && suggestions.length > 0 && !this.isMaxReached()) {
      event.preventDefault();
      this.dropdownDismissed.set(false);
      const nextIdx =
        this.activeSuggestionIndex() < suggestions.length - 1
          ? this.activeSuggestionIndex() + 1
          : 0;
      this.activeSuggestionIndex.set(nextIdx);
      return;
    }

    if (event.key === 'ArrowUp' && suggestions.length > 0 && !this.isMaxReached()) {
      event.preventDefault();
      this.dropdownDismissed.set(false);
      const prevIdx =
        this.activeSuggestionIndex() > 0
          ? this.activeSuggestionIndex() - 1
          : suggestions.length - 1;
      this.activeSuggestionIndex.set(prevIdx);
      return;
    }

    if (event.key === 'Escape') {
      if (this.isDropdownOpen()) {
        event.preventDefault();
        this.dropdownDismissed.set(true);
        this.activeSuggestionIndex.set(-1);
      }
      return;
    }

    if (event.key === 'Enter') {
      const activeIdx = this.activeSuggestionIndex();
      if (this.isDropdownOpen() && activeIdx >= 0 && activeIdx < suggestions.length) {
        event.preventDefault();
        this.selectSuggestion(suggestions[activeIdx]!.value);
        return;
      }
      const text = this.draftText().trim();
      if (text) {
        event.preventDefault();
        this.draftText.set('');
        this.commitRawCandidates(text);
      }
      return;
    }

    if (event.key === 'Backspace' && this.draftText() === '' && this.resolvedTags().length > 0) {
      event.preventDefault();
      const res = popLastUnlockedTag(this.resolvedTags(), this.lockedTags());
      if (res.removed !== null) {
        this.tagRemoved.emit(res.removed);
        this.emitTags(res.next);
      }
      return;
    }

    if (event.key === 'ArrowLeft' && this.draftText() === '') {
      const btns = this.chipRemoveBtns();
      if (btns.length > 0) {
        event.preventDefault();
        btns[btns.length - 1]?.nativeElement.focus();
      }
    }
  }

  protected onChipRemoveKeydown(event: KeyboardEvent, _idx: number): void {
    const btns = this.chipRemoveBtns();
    const btnIdx = btns.findIndex((b) => b.nativeElement === event.currentTarget);
    if (event.key === 'ArrowLeft' && btnIdx > 0) {
      event.preventDefault();
      btns[btnIdx - 1]?.nativeElement.focus();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (btnIdx >= 0 && btnIdx < btns.length - 1) {
        btns[btnIdx + 1]?.nativeElement.focus();
      } else {
        this.tagInputEl()?.nativeElement.focus();
      }
    }
  }

  protected commitDraftOnBlur(): void {
    if (this.readOnly() || this.disabled()) return;
    const text = this.draftText().trim();
    if (!text) return;
    this.draftText.set('');
    this.commitRawCandidates(text);
  }

  private commitRawCandidates(raw: string): void {
    const res = commitTagInputValues(this.resolvedTags(), raw, {
      separators: this.resolvedSeparators(),
      allowDuplicates: this.allowDuplicates(),
      maxTags: this.maxTags(),
      maxTagLength: this.maxTagLength(),
    });
    if (res.added.length > 0) {
      for (const added of res.added) {
        this.tagAdded.emit(added);
      }
      this.emitTags(res.next);
    }
  }

  protected addCandidateTags(candidates: readonly string[]): void {
    if (this.readOnly() || this.disabled() || candidates.length === 0) return;
    const res = commitTagInputValues(this.resolvedTags(), candidates, {
      separators: this.resolvedSeparators(),
      allowDuplicates: this.allowDuplicates(),
      maxTags: this.maxTags(),
      maxTagLength: this.maxTagLength(),
    });
    if (res.added.length > 0) {
      for (const added of res.added) {
        this.tagAdded.emit(added);
      }
      this.emitTags(res.next);
    }
  }

  protected removeTagAt(idx: number): void {
    if (this.readOnly() || this.disabled()) return;
    const res = removeTagInputAtIndex(this.resolvedTags(), idx, this.lockedTags());
    if (res.removed !== null) {
      this.tagRemoved.emit(res.removed);
      this.emitTags(res.next);
    }
  }

  protected clearAll(): void {
    if (this.readOnly() || this.disabled()) return;
    this.draftText.set('');
    const res = clearUnlockedTags(this.resolvedTags(), this.lockedTags());
    if (res.removed.length > 0) {
      this.emitTags(res.next);
    }
    this.cleared.emit();
  }
}
