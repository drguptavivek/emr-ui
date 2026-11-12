import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import type { IdentifierEntryIntent, IdentifierEntryView } from '@drguptavivek/emr-controller';
import { EmrFieldFrameComponent } from './emr-field-frame.component';

/** English fallbacks for built-in strings; every one is overridable through the `labels` input. */
const DEFAULT_LABELS = { scan: 'Scan', normalised: 'Recognised as' };
export type EmrIdentifierEntryLabels = typeof DEFAULT_LABELS;

/** Typing is folded into the single intent stream so the field has one output, like every L4. */
export type EmrIdentifierEntryEvent = IdentifierEntryIntent;

let nextId = 0;

/**
 * L2 barcode / ID entry: raw text input plus a Scan request. Validator-agnostic: the app's normaliser supplies
 * normalisedValue, error and warning (hint stays visible alongside validation messages). The type picker shows
 * only when typeOptions exist. Never normalises or validates itself.
 * Output: `intent` (valueChanged, scanRequested, typeSelected).
 */
@Component({
  selector: 'emr-identifier-entry',
  standalone: true,
  imports: [EmrFieldFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    <emr-field-frame
      [label]="m.label"
      [controlId]="id()"
      [hint]="m.hint"
      [warning]="m.warning"
      [error]="m.error"
    >
      @if (m.typeOptions?.length) {
        <div class="ie__types" role="radiogroup" [attr.aria-label]="m.label">
          @for (o of m.typeOptions; track o.id) {
            <label class="emr-radio">
              <input
                #typeRadio
                type="radio"
                [name]="id() + '-type'"
                [value]="o.id"
                [checked]="o.id === m.selectedType"
                [disabled]="!!m.readOnly"
                (click)="onRadioClick($event)"
                (change)="onTypeChange(o.id)"
              />
              <span>{{ o.label }}</span>
            </label>
          }
        </div>
      }
      <div class="ie__entry">
        <input
          #entryInput
          class="emr-control ie__input"
          type="text"
          [id]="id()"
          [value]="m.value"
          [readOnly]="!!m.readOnly"
          autocapitalize="characters"
          autocomplete="off"
          spellcheck="false"
          [attr.aria-invalid]="m.error ? 'true' : null"
          [attr.aria-describedby]="hasMessage() ? id() + '-message' : null"
          (input)="onValueInput($event)"
          (blur)="syncDom()"
        />
        @if (!m.readOnly) {
          <button
            class="emr-button emr-button--outline"
            type="button"
            [attr.aria-label]="l.scan + ': ' + m.label"
            (click)="intent.emit({ type: 'scanRequested' })"
          >
            {{ l.scan }}
          </button>
        }
      </div>
      @if (m.normalisedValue) {
        <p class="ie__normalised" aria-live="polite">
          <span aria-hidden="true">✓ </span>
          <span class="emr-sr-only">{{ l.normalised }} </span>{{ m.normalisedValue }}
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
        align-items: flex-start;
        gap: 8px;
      }
      .ie__input {
        flex: 1;
        min-width: 0;
      }
      .ie__types {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 8px;
      }
      .ie__normalised {
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
  readonly labels = input<Partial<EmrIdentifierEntryLabels>>({});
  readonly intent = output<EmrIdentifierEntryEvent>();

  private readonly auto = `emr-identifier-entry-${++nextId}`;
  readonly id = computed(() => this.controlId() || this.auto);
  readonly text = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));
  readonly hasMessage = computed(() => {
    const m = this.model();
    return Boolean(m.error || m.warning || m.hint);
  });

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('entryInput');
  private readonly radioRefs = viewChildren<ElementRef<HTMLInputElement>>('typeRadio');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onRadioClick(event: MouseEvent): void {
    if (this.model().readOnly) {
      event.preventDefault();
      this.syncDom();
    }
  }

  protected onTypeChange(typeId: string): void {
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    this.scheduleSync();
    this.intent.emit({ type: 'typeSelected', id: typeId });
  }

  protected onValueInput(event: Event): void {
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    const rawValue = (event.target as HTMLInputElement).value;
    this.scheduleSync();
    this.intent.emit({ type: 'valueChanged', raw: rawValue });
  }

  protected syncDom(): void {
    const m = this.model();
    const inputEl = this.inputRef()?.nativeElement;
    if (inputEl && inputEl.value !== m.value) {
      inputEl.value = m.value;
    }
    for (const ref of this.radioRefs()) {
      const radio = ref.nativeElement;
      const expected = radio.value === m.selectedType;
      if (radio.checked !== expected) {
        radio.checked = expected;
      }
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
