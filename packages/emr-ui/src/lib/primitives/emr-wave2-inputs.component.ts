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
  EmrDateRangePreset,
  EmrDateRangeValue,
  EmrOption,
} from '@drguptavivek/emr-controller';
import { emptyToNull } from './emr-inputs.logic';
import {
  addTagValues,
  buildCalendarMonthCells,
  filterOptionsLocally,
  groupOptions,
  isIsoDateInRange,
  isIsoRangeEdge,
  normalizeDateRangeSelection,
  splitTagTokens,
} from './emr-wave2.logic';

let nextWave2InputId = 0;

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
    <div class="emr-field emr-search-select">
      <label class="emr-field__label" [class.emr-sr-only]="labelHidden()" [for]="resolvedId()">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </label>
      <div class="emr-search-select__bar">
        <input
          #comboInput
          class="emr-control"
          type="text"
          role="combobox"
          autocomplete="off"
          [id]="resolvedId()"
          [value]="value() ?? ''"
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
          (input)="onInput($event)"
          (blur)="syncDom()"
          (keydown.arrowdown)="onArrowDown($event)"
          (keydown.escape)="onEscape($event)"
        />
        @if (showClear()) {
          <button
            type="button"
            class="emr-choice-clear"
            [attr.aria-label]="'Clear ' + (label() || 'value')"
            (click)="clearValue()"
          >
            ✕
          </button>
        }
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [disabled]="disabled() || readOnly()"
          [attr.aria-label]="'Toggle ' + (label() || 'suggestions')"
          [attr.aria-expanded]="isPanelOpen()"
          (click)="toggleOpen()"
        >
          ▾
        </button>
      </div>
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
      @if (isPanelOpen() && filteredOptions().length > 0) {
        <div
          class="emr-search-select__panel"
          [id]="resolvedId() + '-listbox'"
          role="listbox"
        >
          @for (grp of optionGroups(); track grp.label ?? '__ungrouped__') {
            @if (grp.label !== null) {
              <div class="emr-field__hint" role="presentation">{{ grp.label }}</div>
            }
            @for (option of grp.options; track option.value) {
              <button
                #optionBtn
                type="button"
                class="emr-search-select__option"
                role="option"
                [disabled]="option.disabled"
                [attr.aria-selected]="value() === option.value || value() === option.label"
                (click)="selectSuggestion(option)"
                (keydown.arrowdown)="moveFocus($event, 1)"
                (keydown.arrowup)="moveFocus($event, -1)"
                (keydown.escape)="onEscape($event)"
              >
                <strong>{{ option.label }}</strong>
                @if (option.description) {
                  <span class="emr-search-select__description">{{ option.description }}</span>
                }
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
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly placeholder = input('');
  readonly value = input<string | null>(null);
  readonly options = input<readonly EmrOption[]>([]);
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly open = input<boolean | undefined>(undefined);
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<string | null>();
  readonly optionSelected = output<EmrOption>();
  readonly cleared = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fallbackId = `emr-combobox-${++nextWave2InputId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly localOpen = signal(false);

  protected readonly isPanelOpen = computed(() => {
    if (this.readOnly() || this.disabled()) return false;
    const controlled = this.open();
    return controlled !== undefined ? controlled : this.localOpen();
  });

  protected readonly filteredOptions = computed(() =>
    filterOptionsLocally(this.options(), this.value()),
  );
  protected readonly optionGroups = computed(() => groupOptions(this.filteredOptions()));

  protected readonly showClear = computed(
    () => Boolean(this.clearable() && this.value() && !this.readOnly() && !this.disabled()),
  );

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('comboInput');
  private readonly optionBtns = viewChildren<ElementRef<HTMLButtonElement>>('optionBtn');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.localOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.localOpen.set(false);
    }
  }

  protected onFocus(): void {
    if (this.readOnly() || this.disabled()) return;
    this.localOpen.set(true);
  }

  protected toggleOpen(): void {
    if (this.readOnly() || this.disabled()) return;
    this.localOpen.set(!this.isPanelOpen());
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    this.localOpen.set(true);
    this.scheduleDomSync();
    this.valueChange.emit(emptyToNull(target.value));
  }

  protected selectSuggestion(option: EmrOption): void {
    if (this.readOnly() || this.disabled() || option.disabled) return;
    this.localOpen.set(false);
    this.scheduleDomSync();
    this.optionSelected.emit(option);
    this.valueChange.emit(option.value);
  }

  protected clearValue(): void {
    if (this.readOnly() || this.disabled()) return;
    this.localOpen.set(false);
    this.scheduleDomSync();
    this.valueChange.emit(null);
    this.cleared.emit();
  }

  protected onArrowDown(event: Event): void {
    if (this.readOnly() || this.disabled()) return;
    event.preventDefault();
    if (!this.isPanelOpen()) {
      this.localOpen.set(true);
      return;
    }
    const enabled = this.optionBtns()
      .map((r) => r.nativeElement)
      .filter((b) => !b.disabled);
    enabled[0]?.focus();
  }

  protected moveFocus(event: Event, delta: -1 | 1): void {
    const enabled = this.optionBtns()
      .map((r) => r.nativeElement)
      .filter((b) => !b.disabled);
    const cur = enabled.indexOf(event.currentTarget as HTMLButtonElement);
    if (cur < 0) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(enabled.length - 1, cur + delta));
    enabled[next]?.focus();
  }

  protected onEscape(event: Event): void {
    event.stopPropagation();
    this.localOpen.set(false);
    this.inputRef()?.nativeElement.focus();
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
    const expected = this.value() ?? '';
    if (el.value !== expected) el.value = expected;
  }
}

@Component({
  selector: 'emr-tag-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="emr-field">
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
              class="emr-choice-clear"
              [attr.aria-label]="'Clear all ' + (label() || 'tags')"
              (click)="clearAll()"
            >
              Clear
            </button>
          }
        </div>
      }
      <div class="emr-tag-input">
        @for (tag of value(); track tag) {
          <span class="emr-chip emr-tone-neutral">
            {{ tag }}
            @if (!readOnly() && !disabled()) {
              <button
                type="button"
                class="emr-button emr-button--small emr-button--ghost"
                [attr.aria-label]="'Remove ' + tag"
                (click)="removeTag(tag)"
              >
                ✕
              </button>
            }
          </span>
        }
        <input
          #tagInputEl
          class="emr-tag-input__field"
          type="text"
          [id]="resolvedId()"
          [value]="draftText()"
          [placeholder]="isMaxReached() ? '' : placeholder()"
          [disabled]="disabled()"
          [readOnly]="readOnly() || isMaxReached()"
          [attr.aria-label]="labelHidden() ? (label() || 'Tags') : null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (input)="onDraftInput($event)"
          (keydown)="onKeydown($event)"
          (blur)="commitDraftOnBlur()"
        />
      </div>
      @if (availableSuggestions().length > 0 && !readOnly() && !disabled()) {
        <div class="emr-chip-row" aria-label="Tag suggestions">
          @for (sug of availableSuggestions(); track sug) {
            <button
              type="button"
              class="emr-button emr-button--small emr-button--outline"
              [disabled]="isMaxReached()"
              (click)="addCandidateTags([sug])"
            >
              + {{ sug }}
            </button>
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
export class EmrTagInputComponent {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly placeholder = input('Add tag and press Enter…');
  readonly value = input<readonly string[]>([]);
  readonly suggestions = input<readonly string[]>([]);
  readonly delimiters = input<readonly string[]>([',', ';']);
  readonly allowDuplicates = input(false, { transform: booleanAttribute });
  readonly maxTags = input<number | undefined>(undefined);
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<readonly string[]>();
  readonly tagAdded = output<string>();
  readonly tagRemoved = output<string>();
  readonly cleared = output<void>();

  private readonly fallbackId = `emr-tag-input-${++nextWave2InputId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly draftText = signal('');

  protected readonly isMaxReached = computed(() => {
    const max = this.maxTags();
    return max !== undefined && this.value().length >= max;
  });

  protected readonly showClear = computed(
    () => Boolean(this.clearable() && this.value().length > 0 && !this.readOnly() && !this.disabled()),
  );

  protected readonly availableSuggestions = computed(() => {
    const existing = new Set(this.value().map((v) => v.toLowerCase()));
    const q = this.draftText().trim().toLowerCase();
    return this.suggestions().filter(
      (s) => !existing.has(s.toLowerCase()) && (!q || s.toLowerCase().includes(q)),
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

  protected onDraftInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      target.value = '';
      return;
    }
    const raw = target.value;
    const hasDelimiter = this.delimiters().some((d) => raw.includes(d));
    if (hasDelimiter) {
      const tokens = splitTagTokens(raw, this.delimiters());
      this.draftText.set('');
      target.value = '';
      this.addCandidateTags(tokens);
      return;
    }
    this.draftText.set(raw);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.readOnly() || this.disabled()) return;
    if (event.key === 'Enter') {
      const text = this.draftText().trim();
      if (text) {
        event.preventDefault();
        const tokens = splitTagTokens(text, this.delimiters());
        this.draftText.set('');
        this.addCandidateTags(tokens);
      }
      return;
    }
    if (event.key === 'Backspace' && this.draftText() === '' && this.value().length > 0) {
      event.preventDefault();
      const last = this.value()[this.value().length - 1]!;
      this.removeTag(last);
    }
  }

  protected commitDraftOnBlur(): void {
    if (this.readOnly() || this.disabled()) return;
    const text = this.draftText().trim();
    if (!text) return;
    this.draftText.set('');
    this.addCandidateTags(splitTagTokens(text, this.delimiters()));
  }

  protected addCandidateTags(candidates: readonly string[]): void {
    if (this.readOnly() || this.disabled() || candidates.length === 0) return;
    const current = this.value();
    const next = addTagValues(current, candidates, {
      allowDuplicates: this.allowDuplicates(),
      maxTags: this.maxTags(),
    });
    if (next.length !== current.length) {
      for (let i = current.length; i < next.length; i += 1) {
        this.tagAdded.emit(next[i]!);
      }
      this.valueChange.emit(next);
    }
  }

  protected removeTag(tag: string): void {
    if (this.readOnly() || this.disabled()) return;
    const idx = this.value().indexOf(tag);
    if (idx < 0) return;
    const next = this.value().filter((_, i) => i !== idx);
    this.tagRemoved.emit(tag);
    this.valueChange.emit(next);
  }

  protected clearAll(): void {
    if (this.readOnly() || this.disabled()) return;
    this.draftText.set('');
    this.valueChange.emit([]);
    this.cleared.emit();
  }
}
