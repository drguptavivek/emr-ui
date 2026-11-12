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
} from '@angular/core';
import { emptyToNull } from './emr-inputs.logic';

let nextTextareaId = 0;

@Component({
  selector: 'emr-textarea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="emr-field">
      <label class="emr-field__label" [class.emr-sr-only]="labelHidden()" [for]="resolvedId()">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </label>
      <textarea
        #textareaEl
        class="emr-control emr-textarea"
        [id]="resolvedId()"
        [rows]="rows()"
        [value]="value() ?? ''"
        [placeholder]="placeholder()"
        [attr.maxlength]="maxLength() ?? null"
        [required]="required()"
        [disabled]="disabled()"
        [readOnly]="readOnly()"
        [attr.aria-label]="labelHidden() ? (label() || null) : null"
        [attr.aria-invalid]="!!error() || null"
        [attr.aria-describedby]="describedBy()"
        (input)="onInput($event)"
        (blur)="onBlur()"
      ></textarea>
      @if (!labelHidden() && (hint() || error() || maxLength() !== undefined)) {
        <div class="emr-textarea__footer">
          <div>
            @if (hint()) {
              <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
            }
            @if (error()) {
              <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
            }
          </div>
          @if (maxLength() !== undefined) {
            <span class="emr-textarea__counter" [id]="resolvedId() + '-counter'">
              {{ charCount() }} / {{ maxLength() }}
            </span>
          }
        </div>
      }
    </div>
  `,
})
export class EmrTextareaComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly value = input<string | null>(null);
  readonly rows = input(4);
  readonly maxLength = input<number>();
  readonly autoResize = input(false, { transform: booleanAttribute });
  readonly placeholder = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly valueChange = output<string | null>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-textarea-${++nextTextareaId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  protected readonly charCount = computed(() => (this.value() ?? '').length);

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    if (this.maxLength() !== undefined) ids.push(`${id}-counter`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('textareaEl');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    const next = emptyToNull(target.value);
    if (this.autoResize()) {
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom();
      }
    });
    this.valueChange.emit(next);
  }

  protected onBlur(): void {
    this.syncDom();
    this.blurred.emit();
  }

  private syncDom(): void {
    const el = this.textareaRef()?.nativeElement;
    if (!el) return;
    const expected = this.value() ?? '';
    if (el.value !== expected) {
      el.value = expected;
    }
  }
}
