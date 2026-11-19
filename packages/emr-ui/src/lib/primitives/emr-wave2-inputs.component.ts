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
  buildDateRangeCalendarGrid,
  clearUnlockedTags,
  commitDateRangeEndpoint,
  commitTagInputValues,
  filterOptionsLocally,
  findNextEnabledSearchOptionIndex,
  formatDateRangeMonthTitle,
  getDateRangeWeekdays,
  groupOptions,
  isIsoDateInRange,
  isIsoRangeEdge,
  isTagLocked,
  popLastUnlockedTag,
  rankAndFilterOptions,
  rankTagSuggestions,
  removeTagInputAtIndex,
  resolveComboboxDisplayValue,
  resolveCustomSearchCandidate,
  resolveDefaultActiveOptionIndex,
  resolveEmrTagsValue,
  resolveInitialCalendarMonth,
  selectDateRangeCalendarDay,
  splitMatchHighlightSegments,
  splitTagTokens,
  stepCalendarMonth,
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
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div
      class="emr-field emr-date-range"
      [class.emr-date-range--sm]="size() === 'sm'"
      [class.emr-date-range--lg]="size() === 'lg'"
      [class.emr-date-range--filled]="variant() === 'filled'"
      [class.emr-date-range--subtle]="variant() === 'subtle'"
      [class.emr-date-range--invalid]="isGroupInvalid()"
      [class.emr-date-range--warning]="!isGroupInvalid() && !!warning()"
      [class.emr-date-range--readonly]="readOnly()"
      [class.emr-date-range--disabled]="disabled()"
      [id]="resolvedId()"
      role="group"
      [attr.aria-label]="resolvedAriaLabel()"
      [attr.aria-required]="required() || null"
      [attr.data-warning]="!isGroupInvalid() && !!warning() ? 'true' : null"
      (focusin)="onGroupFocusIn()"
      (focusout)="onGroupFocusOut($event)"
      (keydown)="onGroupKeydown($event)"
    >
      @if (label()) {
        <span class="emr-field__label" [class.emr-sr-only]="labelHidden()">
          {{ label() }}
          @if (required()) {
            <span class="emr-field__required" aria-hidden="true">*</span>
          }
        </span>
      }

      @if (presets().length > 0 && !readOnly()) {
        <div class="emr-date-range__presets" data-emr-print="hide">
          @for (preset of presets(); track preset.id) {
            @let isActivePreset = isPresetActive(preset);
            <button
              type="button"
              class="emr-button emr-button--small"
              [class.emr-button--primary]="isActivePreset"
              [class.emr-button--outline]="!isActivePreset"
              [disabled]="disabled() || isPresetOutOfBounds(preset)"
              (click)="applyPreset(preset)"
            >
              {{ preset.label }}
            </button>
          }
        </div>
      }

      <div class="emr-date-range__bar">
        <input
          #startInput
          class="emr-control emr-date-range__input"
          [id]="resolvedId() + '-start'"
          [attr.type]="mode() === 'datetime' ? 'datetime-local' : 'date'"
          [value]="startDomValue()"
          [attr.placeholder]="resolvedStartPlaceholder()"
          [attr.min]="min() ?? null"
          [attr.max]="max() ?? null"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="resolvedAriaLabel() + ' start'"
          [attr.aria-required]="required() || null"
          [attr.aria-invalid]="isStartInvalid() || null"
          [attr.data-warning]="!isStartInvalid() && !!warning() ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          (input)="onBoundInput('start', $event)"
          (keydown)="onBoundKeydown($event)"
          (blur)="syncDom()"
        />
        <span class="emr-date-range__sep" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </span>
        <input
          #endInput
          class="emr-control emr-date-range__input"
          [id]="resolvedId() + '-end'"
          [attr.type]="mode() === 'datetime' ? 'datetime-local' : 'date'"
          [value]="endDomValue()"
          [attr.placeholder]="resolvedEndPlaceholder()"
          [attr.min]="min() ?? null"
          [attr.max]="max() ?? null"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="resolvedAriaLabel() + ' end'"
          [attr.aria-required]="required() || null"
          [attr.aria-invalid]="isEndInvalid() || null"
          [attr.data-warning]="!isEndInvalid() && !!warning() ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          (input)="onBoundInput('end', $event)"
          (keydown)="onBoundKeydown($event)"
          (blur)="syncDom()"
        />
        @if (showClear()) {
          <button
            type="button"
            class="emr-button emr-button--outline emr-button--small emr-date-range__icon-btn"
            data-emr-print="hide"
            [attr.aria-label]="clearLabel() + ' ' + resolvedAriaLabel()"
            (click)="clearRange()"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        }
        @if (showCalendar()) {
          <button
            #calendarToggle
            type="button"
            class="emr-button emr-button--outline emr-button--small emr-date-range__icon-btn"
            data-emr-print="hide"
            [id]="resolvedId() + '-toggle'"
            [disabled]="disabled() || readOnly()"
            [attr.aria-expanded]="isCalendarOpen()"
            [attr.aria-label]="(isCalendarOpen() ? 'Close ' : 'Open ') + resolvedAriaLabel() + ' calendar'"
            (click)="toggleCalendar()"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </button>
        }
      </div>

      @if (showCalendar() && isCalendarOpen()) {
        <div
          class="emr-popover__panel emr-date-range__popover"
          data-emr-print="hide"
          role="region"
          [attr.aria-label]="resolvedAriaLabel() + ' calendar'"
        >
          <div class="emr-date-range__cal-header">
            <button
              type="button"
              class="emr-button emr-button--ghost emr-button--small emr-date-range__icon-btn"
              aria-label="Previous month"
              (click)="stepMonth(-1)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <strong>{{ calendarTitle() }}</strong>
            <button
              type="button"
              class="emr-button emr-button--ghost emr-button--small emr-date-range__icon-btn"
              aria-label="Next month"
              (click)="stepMonth(1)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
          <div
            class="emr-date-range__cal-grid"
            role="grid"
            [attr.aria-label]="calendarTitle()"
            (keydown)="onGridKeydown($event)"
          >
            @for (wd of weekdayLabels(); track wd) {
              <span class="emr-date-range__weekday" role="columnheader">{{ wd }}</span>
            }
            @for (cell of calendarCells(); track cell.iso; let idx = $index) {
              <button
                #dayCell
                type="button"
                class="emr-button emr-button--small emr-date-range__cell"
                [class.emr-button--primary]="isEdgeCell(cell.iso)"
                [class.emr-button--secondary]="!isEdgeCell(cell.iso) && isInRangeCell(cell.iso)"
                [class.emr-button--ghost]="!isEdgeCell(cell.iso) && !isInRangeCell(cell.iso)"
                [class.emr-date-range__cell--outside]="!cell.inCurrentMonth"
                [class.emr-date-range__cell--today]="cell.iso === todayIso"
                [disabled]="disabled() || readOnly() || isDateOutOfBounds(cell.iso)"
                [attr.data-iso]="cell.iso"
                [attr.data-outside-month]="!cell.inCurrentMonth ? 'true' : null"
                [attr.data-in-range]="isInRangeCell(cell.iso) || null"
                [attr.data-range-edge]="rangeEdgeFor(cell.iso)"
                [attr.aria-current]="cell.iso === todayIso ? 'date' : null"
                [attr.aria-label]="cell.iso"
                [attr.aria-pressed]="isEdgeCell(cell.iso) || isInRangeCell(cell.iso)"
                (click)="onCalendarDayClick(cell.iso)"
              >
                {{ cell.day }}
              </button>
            }
          </div>
        </div>
      }

      @if (error() || startError() || endError()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">
          {{ error() || startError() || endError() }}
        </span>
      }
      @if (warning()) {
        <span class="emr-field__warning" [id]="resolvedId() + '-warning'" role="status">{{ warning() }}</span>
      }
      @if (hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
    </div>
  `,
})
export class EmrDateRangeInputComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly ariaLabel = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly mode = input<'date' | 'datetime'>('date');
  readonly value = input<EmrDateRangeValue | null>(null);
  readonly min = input<string>();
  readonly max = input<string>();
  readonly presets = input<readonly EmrDateRangePreset[]>([]);
  readonly startPlaceholder = input('');
  readonly endPlaceholder = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly variant = input<EmrControlVariant>('outline');
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly showCalendar = input(true, { transform: booleanAttribute });
  readonly open = input<boolean | undefined, unknown>(undefined, { transform: optionalBooleanAttribute });
  readonly weekStartsOn = input<0 | 1>(0);
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly startError = input('');
  readonly endError = input('');
  readonly warning = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly ariaDescribedBy = input<string>();

  readonly valueChange = output<EmrDateRangeValue | null>();
  readonly cleared = output<void>();
  readonly openChange = output<boolean>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
  readonly submitted = output<EmrDateRangeValue | null>();

  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly fallbackId = `emr-date-range-${++nextWave2InputId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  protected readonly todayIso = new Date().toISOString().slice(0, 10);

  private readonly initialMonth = resolveInitialCalendarMonth(null, undefined, this.todayIso);
  protected readonly localOpen = signal(false);
  protected readonly calendarYear = signal(this.initialMonth.year);
  protected readonly calendarMonth0 = signal(this.initialMonth.month0);
  private readonly startOob = signal(false);
  private readonly endOob = signal(false);
  private calendarSeeded = false;
  private groupFocused = false;

  protected readonly isCalendarOpen = computed(() => {
    if (this.disabled() || this.readOnly() || !this.showCalendar()) return false;
    const controlled = this.open();
    return controlled !== undefined ? controlled : this.localOpen();
  });

  protected readonly resolvedAriaLabel = computed(() => this.ariaLabel() || this.label() || 'Date range');
  protected readonly resolvedStartPlaceholder = computed(
    () => this.startPlaceholder() || (this.mode() === 'datetime' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'),
  );
  protected readonly resolvedEndPlaceholder = computed(
    () => this.endPlaceholder() || (this.mode() === 'datetime' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'),
  );

  protected readonly startDomValue = computed(() => this.value()?.start ?? '');
  protected readonly endDomValue = computed(() => this.value()?.end ?? '');

  protected readonly isGroupInvalid = computed(() =>
    Boolean(this.invalid() || this.error() || this.startError() || this.endError() || this.startOob() || this.endOob()),
  );
  protected readonly isStartInvalid = computed(() =>
    Boolean(this.invalid() || this.error() || this.startError() || this.startOob()),
  );
  protected readonly isEndInvalid = computed(() =>
    Boolean(this.invalid() || this.error() || this.endError() || this.endOob()),
  );

  protected readonly showClear = computed(() => {
    const v = this.value();
    return Boolean(
      this.clearable() &&
        !this.readOnly() &&
        !this.disabled() &&
        (v?.start || v?.end),
    );
  });

  protected readonly weekdayLabels = computed(() => getDateRangeWeekdays(this.weekStartsOn()));
  protected readonly calendarTitle = computed(() =>
    formatDateRangeMonthTitle(this.calendarYear(), this.calendarMonth0()),
  );
  protected readonly calendarCells = computed(() =>
    buildDateRangeCalendarGrid(this.calendarYear(), this.calendarMonth0(), this.weekStartsOn()),
  );

  protected readonly describedBy = computed(() => {
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.error() || this.startError() || this.endError()) ids.push(`${id}-error`);
    if (this.warning()) ids.push(`${id}-warning`);
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.ariaDescribedBy()) ids.push(this.ariaDescribedBy()!);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly startInputRef = viewChild<ElementRef<HTMLInputElement>>('startInput');
  private readonly endInputRef = viewChild<ElementRef<HTMLInputElement>>('endInput');
  private readonly toggleBtnRef = viewChild<ElementRef<HTMLButtonElement>>('calendarToggle');
  private readonly dayCellRefs = viewChildren<ElementRef<HTMLButtonElement>>('dayCell');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isCalendarOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.setCalendarOpen(false);
    }
  }

  protected onGroupFocusIn(): void {
    if (!this.groupFocused) {
      this.groupFocused = true;
      this.focused.emit();
    }
  }

  protected onGroupFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (!related || !this.hostRef.nativeElement.contains(related)) {
      this.groupFocused = false;
      this.blurred.emit();
    }
  }

  protected onGroupKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isCalendarOpen()) {
      event.preventDefault();
      this.setCalendarOpen(false);
      this.toggleBtnRef()?.nativeElement.focus();
    }
  }

  protected toggleCalendar(): void {
    if (this.readOnly() || this.disabled()) return;
    const next = !this.isCalendarOpen();
    if (next) {
      const seed = resolveInitialCalendarMonth(this.value(), this.min(), this.todayIso);
      if (!this.calendarSeeded || this.value()?.start || this.value()?.end) {
        this.calendarYear.set(seed.year);
        this.calendarMonth0.set(seed.month0);
        this.calendarSeeded = true;
      }
    }
    this.setCalendarOpen(next);
  }

  private setCalendarOpen(next: boolean): void {
    if (this.open() === undefined) {
      this.localOpen.set(next);
    }
    this.openChange.emit(next);
  }

  protected onBoundKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.readOnly() && !this.disabled()) {
      this.submitted.emit(this.value());
    }
  }

  protected onBoundInput(edge: 'start' | 'end', event: Event): void {
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    const raw = emptyToNull((event.target as HTMLInputElement).value);
    const res = commitDateRangeEndpoint(
      this.value(),
      edge,
      raw,
      this.mode(),
      this.min(),
      this.max(),
    );
    this.startOob.set(res.startOutOfBounds);
    this.endOob.set(res.endOutOfBounds);
    this.scheduleDomSync();
    this.valueChange.emit(res.value);
  }

  protected onCalendarDayClick(iso: string): void {
    if (this.readOnly() || this.disabled() || this.isDateOutOfBounds(iso)) return;
    const next = selectDateRangeCalendarDay(
      this.value(),
      iso,
      this.mode(),
      this.min(),
      this.max(),
    );
    this.startOob.set(false);
    this.endOob.set(false);
    this.scheduleDomSync();
    this.valueChange.emit(next);
  }

  protected onGridKeydown(event: KeyboardEvent): void {
    const cells = this.calendarCells();
    const target = event.target as HTMLElement | null;
    const iso = target?.getAttribute('data-iso');
    const curIdx = iso ? cells.findIndex((c) => c.iso === iso) : -1;
    if (curIdx < 0) return;

    let nextIdx = curIdx;
    if (event.key === 'ArrowRight') nextIdx = Math.min(cells.length - 1, curIdx + 1);
    else if (event.key === 'ArrowLeft') nextIdx = Math.max(0, curIdx - 1);
    else if (event.key === 'ArrowDown') nextIdx = Math.min(cells.length - 1, curIdx + 7);
    else if (event.key === 'ArrowUp') nextIdx = Math.max(0, curIdx - 7);
    else if (event.key === 'Home') nextIdx = Math.floor(curIdx / 7) * 7;
    else if (event.key === 'End') nextIdx = Math.min(cells.length - 1, Math.floor(curIdx / 7) * 7 + 6);
    else if (event.key === 'PageUp') {
      event.preventDefault();
      this.stepMonth(-1);
      return;
    } else if (event.key === 'PageDown') {
      event.preventDefault();
      this.stepMonth(1);
      return;
    } else {
      return;
    }
    event.preventDefault();
    const btns = this.dayCellRefs();
    btns[nextIdx]?.nativeElement.focus();
  }

  protected isPresetActive(preset: EmrDateRangePreset): boolean {
    const v = this.value();
    return Boolean(v && v.start === preset.range.start && v.end === preset.range.end);
  }

  protected isPresetOutOfBounds(preset: EmrDateRangePreset): boolean {
    const s = preset.range.start?.slice(0, 10);
    const e = preset.range.end?.slice(0, 10);
    return Boolean((s && this.isDateOutOfBounds(s)) || (e && this.isDateOutOfBounds(e)));
  }

  protected applyPreset(preset: EmrDateRangePreset): void {
    if (this.readOnly() || this.disabled() || this.isPresetOutOfBounds(preset)) return;
    this.startOob.set(false);
    this.endOob.set(false);
    this.scheduleDomSync();
    this.valueChange.emit({
      start: preset.range.start,
      end: preset.range.end,
    });
  }

  protected clearRange(): void {
    if (this.readOnly() || this.disabled()) return;
    this.startOob.set(false);
    this.endOob.set(false);
    this.scheduleDomSync();
    this.valueChange.emit(null);
    this.cleared.emit();
  }

  protected stepMonth(delta: number): void {
    const next = stepCalendarMonth(this.calendarYear(), this.calendarMonth0(), delta);
    this.calendarYear.set(next.year);
    this.calendarMonth0.set(next.month0);
  }

  protected isInRangeCell(iso: string): boolean {
    return isIsoDateInRange(iso, this.toDateOnlyRange());
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
