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
  signal,
  viewChild,
} from '@angular/core';
import type { EmrFileSelectionItem } from '@drguptavivek/emr-controller';
import { emptyToNull, stepNumberValue } from './emr-inputs.logic';

let nextSpecializedInputId = 0;

@Component({
  selector: 'emr-search-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="emr-field">
      @if (label()) {
        <label class="emr-field__label" [class.emr-sr-only]="labelHidden()" [for]="resolvedId()">
          {{ label() }}
        </label>
      }
      <div
        class="emr-input-affix"
        [attr.data-invalid]="!!error() || null"
        [attr.data-readonly]="readOnly() || null"
      >
        <input
          #searchEl
          class="emr-input-affix__field"
          type="search"
          autocomplete="off"
          [id]="resolvedId()"
          [value]="value() ?? ''"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="!label() || labelHidden() ? label() || placeholder() || 'Search' : null"
          [attr.aria-busy]="loading() || null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (input)="onInput($event)"
          (blur)="syncDom()"
          (keydown.enter)="onEnter($event)"
          (keydown.escape)="onEscape($event)"
        />
        @if (value() && !readOnly() && !disabled()) {
          <button
            type="button"
            class="emr-input-affix__btn"
            aria-label="Clear search"
            (click)="clear()"
          >
            ✕
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
export class EmrSearchInputComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly value = input<string | null>(null);
  readonly placeholder = input('Search…');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<string | null>();
  readonly submitted = output<string | null>();
  readonly cleared = output<void>();

  private readonly fallbackId = `emr-search-input-${++nextSpecializedInputId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('searchEl');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    const next = emptyToNull(target.value);
    this.scheduleSync();
    this.valueChange.emit(next);
  }

  protected onEnter(event: Event): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.submitted.emit(emptyToNull(this.value()));
  }

  protected onEscape(event: Event): void {
    if (this.readOnly() || this.disabled() || !this.value()) return;
    event.preventDefault();
    this.clear();
  }

  protected clear(): void {
    if (this.readOnly() || this.disabled()) return;
    this.scheduleSync();
    this.valueChange.emit(null);
    this.cleared.emit();
  }

  protected syncDom(): void {
    const el = this.inputRef()?.nativeElement;
    if (!el) return;
    const expected = this.value() ?? '';
    if (el.value !== expected) el.value = expected;
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

@Component({
  selector: 'emr-password-input',
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
      <div
        class="emr-input-affix"
        [attr.data-invalid]="!!error() || null"
        [attr.data-readonly]="readOnly() || null"
      >
        <input
          #passwordEl
          class="emr-input-affix__field"
          [id]="resolvedId()"
          [attr.type]="revealed() ? 'text' : 'password'"
          [value]="value() ?? ''"
          [placeholder]="placeholder()"
          [attr.autocomplete]="autocomplete()"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="labelHidden() ? (label() || 'Password') : null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (input)="onInput($event)"
          (blur)="onBlur()"
        />
        <button
          type="button"
          class="emr-input-affix__btn"
          [disabled]="disabled()"
          [attr.aria-pressed]="revealed()"
          [attr.aria-label]="revealed() ? 'Hide password' : 'Show password'"
          (click)="toggleReveal()"
        >
          {{ revealed() ? 'Hide' : 'Show' }}
        </button>
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
export class EmrPasswordInputComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly value = input<string | null>(null);
  readonly placeholder = input('');
  readonly autocomplete = input('current-password');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<string | null>();
  readonly blurred = output<void>();

  protected readonly revealed = signal(false);

  private readonly fallbackId = `emr-password-${++nextSpecializedInputId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('passwordEl');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected toggleReveal(): void {
    if (this.disabled()) return;
    this.revealed.update((v) => !v);
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    const next = emptyToNull(target.value);
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
    const el = this.inputRef()?.nativeElement;
    if (!el) return;
    const expected = this.value() ?? '';
    if (el.value !== expected) el.value = expected;
  }
}

@Component({
  selector: 'emr-numeric-stepper',
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
      <div
        class="emr-input-affix"
        [attr.data-invalid]="!!error() || null"
        [attr.data-readonly]="readOnly() || null"
      >
        <button
          type="button"
          class="emr-input-affix__btn emr-input-affix__btn--leading"
          [disabled]="disabled() || readOnly() || !canDecrement()"
          [attr.aria-label]="'Decrease ' + (label() || 'value')"
          (click)="stepBy(-1)"
        >
          −
        </button>
        <input
          #stepperEl
          class="emr-input-affix__field"
          type="number"
          [attr.inputmode]="precision() === 0 ? 'numeric' : 'decimal'"
          [id]="resolvedId()"
          [value]="domValue()"
          [attr.min]="min() ?? null"
          [attr.max]="max() ?? null"
          [attr.step]="step()"
          [required]="required()"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [attr.aria-label]="labelHidden() ? (label() || 'Value') : null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (wheel)="onWheel($event)"
          (input)="onInput($event)"
          (blur)="syncDom(true)"
        />
        @if (unit()) {
          <span class="emr-input-affix__unit" aria-hidden="true">{{ unit() }}</span>
        }
        <button
          type="button"
          class="emr-input-affix__btn"
          [disabled]="disabled() || readOnly() || !canIncrement()"
          [attr.aria-label]="'Increase ' + (label() || 'value')"
          (click)="stepBy(1)"
        >
          +
        </button>
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
export class EmrNumericStepperComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly value = input<number | null>(null);
  readonly min = input<number>();
  readonly max = input<number>();
  readonly step = input(1);
  readonly precision = input<number>();
  readonly unit = input('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<number | null>();

  private readonly fallbackId = `emr-stepper-${++nextSpecializedInputId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly domValue = computed(() => {
    const v = this.value();
    if (v === null || v === undefined || Number.isNaN(v)) return '';
    const p = this.precision();
    return p !== undefined && p >= 0 ? v.toFixed(p) : String(v);
  });

  protected readonly canDecrement = computed(() => {
    const min = this.min();
    const cur = this.value();
    if (min === undefined || cur === null || cur === undefined) return true;
    return cur - this.step() >= min - 1e-9;
  });

  protected readonly canIncrement = computed(() => {
    const max = this.max();
    const cur = this.value();
    if (max === undefined || cur === null || cur === undefined) return true;
    return cur + this.step() <= max + 1e-9;
  });

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('stepperEl');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom(false);
    }
  }

  protected onWheel(event: WheelEvent): void {
    (event.currentTarget as HTMLInputElement).blur();
  }

  protected stepBy(direction: -1 | 1): void {
    if (this.disabled() || this.readOnly()) return;
    const next = stepNumberValue(this.value(), direction, {
      step: this.step(),
      min: this.min(),
      max: this.max(),
      precision: this.precision(),
    });
    this.valueChange.emit(next);
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncDom(true);
      return;
    }
    if (target.validity?.badInput) return;
    const raw = target.value.trim();
    if (raw === '') {
      this.scheduleSync();
      this.valueChange.emit(null);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      this.syncDom(true);
      return;
    }
    const p = this.precision();
    const normalized = p !== undefined && p >= 0 ? Number(parsed.toFixed(p)) : parsed;
    this.scheduleSync();
    this.valueChange.emit(normalized);
  }

  protected syncDom(forceExact: boolean): void {
    const el = this.inputRef()?.nativeElement;
    if (!el) return;
    const cur = this.value();
    if (!forceExact && cur !== null && cur !== undefined && el.value.trim() !== '' && Number(el.value) === cur) {
      return;
    }
    const expected = this.domValue();
    if (el.value !== expected) el.value = expected;
  }

  private scheduleSync(): void {
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom(false);
      }
    });
  }
}

@Component({
  selector: 'emr-file-trigger',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="emr-field">
      @if (label()) {
        <label class="emr-field__label" [class.emr-sr-only]="labelHidden()" [for]="resolvedId()">
          {{ label() }}
        </label>
      }
      <div
        class="emr-file-trigger"
        [attr.data-dragover]="dragOver() || null"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <input
          #fileInput
          class="emr-sr-only"
          type="file"
          [id]="resolvedId()"
          [attr.accept]="accept() || null"
          [multiple]="multiple()"
          [disabled]="disabled() || readOnly()"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (change)="onFileChange($event)"
        />
        <button
          type="button"
          class="emr-button emr-button--outline"
          [disabled]="disabled() || readOnly()"
          (click)="openFileDialog()"
        >
          {{ buttonLabel() }}
        </button>
        @if (dropHint()) {
          <span class="emr-field__hint">{{ dropHint() }}</span>
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
export class EmrFileTriggerComponent {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly buttonLabel = input('Choose files');
  readonly dropHint = input('or drag and drop files here');
  readonly accept = input<string>();
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly filesSelected = output<readonly EmrFileSelectionItem[]>();
  readonly nativeFilesSelected = output<readonly File[]>();

  protected readonly dragOver = signal(false);

  private readonly fallbackId = `emr-file-trigger-${++nextSpecializedInputId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected openFileDialog(): void {
    if (this.disabled() || this.readOnly()) return;
    this.fileInputRef()?.nativeElement.click();
  }

  protected onFileChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (this.disabled() || this.readOnly()) {
      inputEl.value = '';
      return;
    }
    const list = inputEl.files ? Array.from(inputEl.files) : [];
    inputEl.value = '';
    this.emitFiles(list);
  }

  protected onDragOver(event: DragEvent): void {
    if (this.disabled() || this.readOnly()) return;
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    if (this.disabled() || this.readOnly()) return;
    const rawFiles = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
    this.emitFiles(this.multiple() ? rawFiles : rawFiles.slice(0, 1));
  }

  private emitFiles(files: readonly File[]): void {
    if (files.length === 0) return;
    const items: EmrFileSelectionItem[] = files.map((file) => ({
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      lastModified: file.lastModified,
    }));
    this.filesSelected.emit(items);
    this.nativeFilesSelected.emit(files);
  }
}
