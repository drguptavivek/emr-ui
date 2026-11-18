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
import type { IdentifierEntryIntent, IdentifierEntryView } from '@drguptavivek/emr-controller';
import { EmrFieldFrameComponent } from './emr-field-frame.component';

/** English fallbacks for built-in strings; every one is overridable through the `labels` input. */
const DEFAULT_LABELS = {
  scan: 'Scan',
  identifierType: 'Identifier type',
  normalised: 'Recognised as',
  clear: 'Clear identifier',
};
export type EmrIdentifierEntryLabels = typeof DEFAULT_LABELS;

/** Typing is folded into the single intent stream so the field has one output, like every L4. */
export type EmrIdentifierEntryEvent = IdentifierEntryIntent;

let nextId = 0;

/**
 * L2 barcode / ID entry: raw text input plus a Scan request. Validator-agnostic: the app's normaliser supplies
 * normalisedValue, error and warning (hint stays visible alongside validation messages). The type picker shows
 * only when typeOptions exist. Never normalises or validates itself.
 * Output: `intent` (valueChanged, scanRequested, typeSelected, cleared, submitted, focused, blurred).
 */
@Component({
  selector: 'emr-identifier-entry',
  standalone: true,
  imports: [EmrFieldFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    @let locked = effectiveReadOnly();
    <emr-field-frame
      [label]="m.label"
      [controlId]="id()"
      [required]="!!m.required"
      [readOnly]="locked"
      [hint]="m.hint"
      [warning]="m.warning"
      [error]="m.error"
      [messages]="m.messages ?? []"
    >
      @if (m.typeOptions?.length) {
        <div
          class="ie__types"
          role="radiogroup"
          [attr.aria-label]="m.label + ': ' + l.identifierType"
          [attr.aria-readonly]="locked ? 'true' : null"
        >
          @for (o of m.typeOptions; track o.id; let idx = $index) {
            @let selected = o.id === m.selectedType;
            <button
              #typeRadio
              type="button"
              role="radio"
              class="ie__type-chip"
              [class.ie__type-chip--selected]="selected"
              [class.ie__type-chip--readonly]="locked"
              [attr.aria-checked]="selected ? 'true' : 'false'"
              [attr.aria-readonly]="locked ? 'true' : null"
              [attr.tabindex]="selected || (!hasSelectedType() && idx === 0) ? 0 : -1"
              (click)="onTypeSelect(o.id)"
              (keydown)="onRadioKeyDown($event, idx)"
            >
              <span class="ie__radio-dot" aria-hidden="true">
                @if (selected) { <span class="ie__radio-dot-inner"></span> }
              </span>
              <span>{{ o.label }}</span>
            </button>
          }
        </div>
      }
      <div class="ie__entry">
        <div class="ie__input-wrap">
          <input
            #entryInput
            class="emr-control ie__input"
            [class.ie__input--clearable]="!!(m.clearable && m.value && !locked)"
            type="text"
            [id]="id()"
            [value]="m.value"
            [placeholder]="m.placeholder ?? ''"
            [attr.maxlength]="m.maxLength ?? null"
            [readOnly]="locked"
            autocapitalize="characters"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
            [attr.aria-required]="m.required ? 'true' : null"
            [attr.aria-readonly]="locked ? 'true' : null"
            [attr.aria-invalid]="hasError() ? 'true' : null"
            [attr.aria-describedby]="hasMessage() ? id() + '-message' : null"
            [attr.data-warning]="!hasError() && hasWarning() ? 'true' : null"
            (input)="onValueInput($event)"
            (focus)="intent.emit({ type: 'focused' })"
            (blur)="onBlur()"
            (keydown.enter)="onEnter($event)"
          />
          @if (m.clearable && m.value && !locked) {
            <button
              type="button"
              class="ie__clear"
              [attr.aria-label]="l.clear"
              (click)="onClear()"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          }
        </div>
        @if (!locked) {
          <button
            class="emr-button emr-button--outline ie__scan"
            type="button"
            [attr.aria-label]="l.scan + ': ' + m.label"
            (click)="intent.emit({ type: 'scanRequested' })"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="4 7 4 4 7 4" />
              <polyline points="17 4 20 4 20 7" />
              <polyline points="20 17 20 20 17 20" />
              <polyline points="7 20 4 20 4 17" />
              <line x1="3" y1="12" x2="21" y2="12" />
            </svg>
            <span>{{ l.scan }}</span>
          </button>
        }
      </div>
      @if (m.normalisedValue) {
        <p class="ie__normalised" aria-live="polite">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
          </svg>
          <span class="emr-sr-only">{{ l.normalised }} </span>
          <span>{{ m.normalisedValue }}</span>
        </p>
      }
    </emr-field-frame>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      .ie__entry {
        display: flex;
        align-items: stretch;
        flex-wrap: wrap;
        gap: 8px;
      }
      .ie__input-wrap {
        position: relative;
        flex: 1 1 200px;
        min-width: 0;
        display: flex;
        align-items: center;
      }
      .ie__input {
        width: 100%;
        min-width: 0;
      }
      .ie__input--clearable {
        padding-right: 44px;
      }
      .ie__clear {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 44px;
        height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: 0;
        border-radius: 8px;
        color: var(--emr-text-muted);
        cursor: pointer;
      }
      .ie__clear:hover {
        color: var(--emr-text);
      }
      .ie__clear:focus-visible {
        outline: 3px solid var(--emr-focus);
        outline-offset: -2px;
      }
      .ie__scan {
        flex: 0 0 auto;
        white-space: nowrap;
        min-height: 44px;
        background: var(--emr-surface);
        color: var(--emr-primary);
        border: 1px solid var(--emr-primary-border);
      }
      .ie__scan:hover {
        background: var(--emr-surface-soft);
      }
      .ie__types {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 8px;
      }
      .ie__type-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 12px;
        border: 1px solid var(--emr-border);
        border-radius: 999px;
        background: var(--emr-surface);
        color: var(--emr-text);
        font: inherit;
        font-size: var(--emr-text-md);
        font-weight: var(--emr-weight-medium);
        cursor: pointer;
      }
      .ie__type-chip:hover:not(.ie__type-chip--readonly) {
        border-color: var(--emr-border-strong, var(--emr-primary-border));
        background: var(--emr-surface-soft);
      }
      .ie__type-chip--selected {
        border-color: var(--emr-primary);
        background: var(--emr-primary-soft);
        color: var(--emr-primary-contrast);
        font-weight: var(--emr-weight-bold);
      }
      .ie__type-chip--readonly {
        border-style: dashed;
        background: var(--emr-surface-soft);
        cursor: default;
      }
      .ie__type-chip:focus-visible {
        outline: 3px solid var(--emr-focus);
        outline-offset: 2px;
      }
      .ie__radio-dot {
        width: 16px;
        height: 16px;
        border-radius: 999px;
        border: 1.5px solid currentColor;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
      }
      .ie__radio-dot-inner {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: currentColor;
      }
      .ie__normalised {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 4px 0 0;
        font-size: var(--emr-text-sm);
        color: var(--emr-success);
        overflow-wrap: anywhere;
      }
    `,
  ],
})
export class EmrIdentifierEntryComponent implements AfterViewChecked {
  readonly model = input.required<IdentifierEntryView>();
  readonly controlId = input<string>();
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly labels = input<Partial<EmrIdentifierEntryLabels>>({});
  readonly intent = output<EmrIdentifierEntryEvent>();

  private readonly auto = `emr-identifier-entry-${++nextId}`;
  readonly id = computed(() => this.controlId() || this.auto);
  readonly effectiveReadOnly = computed(() => this.readOnly() || Boolean(this.model().readOnly));
  readonly text = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));
  readonly hasSelectedType = computed(() => {
    const m = this.model();
    return Boolean(m.selectedType && m.typeOptions?.some((o) => o.id === m.selectedType));
  });
  readonly hasError = computed(() => {
    const m = this.model();
    return Boolean(m.error || m.messages?.some((msg) => msg.severity === 'error'));
  });
  readonly hasWarning = computed(() => {
    const m = this.model();
    return Boolean(m.warning || m.messages?.some((msg) => msg.severity === 'warning'));
  });
  readonly hasMessage = computed(() => {
    const m = this.model();
    return Boolean(m.error || m.warning || m.hint || m.messages?.length);
  });

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('entryInput');
  private readonly radioRefs = viewChildren<ElementRef<HTMLButtonElement>>('typeRadio');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onTypeSelect(typeId: string): void {
    if (this.effectiveReadOnly()) return;
    this.intent.emit({ type: 'typeSelected', id: typeId });
  }

  protected onRadioKeyDown(event: KeyboardEvent, currentIndex: number): void {
    const opts = this.model().typeOptions ?? [];
    if (!opts.length) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIdx =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? opts.length - 1
          : (currentIndex + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
    const buttons = this.radioRefs();
    buttons[nextIdx]?.nativeElement.focus();
    if (!this.effectiveReadOnly()) {
      this.intent.emit({ type: 'typeSelected', id: opts[nextIdx]!.id });
    }
  }

  protected onValueInput(event: Event): void {
    if (this.effectiveReadOnly()) {
      this.syncDom();
      return;
    }
    const rawValue = (event.target as HTMLInputElement).value;
    this.scheduleSync();
    this.intent.emit({ type: 'valueChanged', raw: rawValue });
  }

  protected onClear(): void {
    if (this.effectiveReadOnly()) return;
    this.intent.emit({ type: 'valueChanged', raw: '' });
    this.intent.emit({ type: 'cleared' });
    this.inputRef()?.nativeElement.focus();
  }

  protected onBlur(): void {
    this.syncDom();
    this.intent.emit({ type: 'blurred' });
  }

  protected onEnter(event: Event): void {
    if (this.effectiveReadOnly()) return;
    event.preventDefault();
    this.intent.emit({ type: 'submitted', raw: this.model().value });
  }

  protected syncDom(): void {
    const m = this.model();
    const inputEl = this.inputRef()?.nativeElement;
    if (inputEl && inputEl.value !== m.value) {
      inputEl.value = m.value;
    }
  }

  private scheduleSync(): void {
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom();
      }
    });
  }
}
