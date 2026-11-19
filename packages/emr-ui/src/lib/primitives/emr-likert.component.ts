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
  viewChildren,
} from '@angular/core';
import type { EmrLikertAnchor, EmrLikertOption, EmrLikertSize, EmrTone } from '@drguptavivek/emr-controller';
import { buildLikertPoints, resolveLikertAnchors } from './emr-likert.logic';

export type { EmrLikertAnchor, EmrLikertOption };

@Component({
  selector: 'emr-likert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <fieldset
      class="emr-likert"
      [class.emr-likert--sm]="size() === 'sm'"
      [class.emr-likert--lg]="size() === 'lg'"
      [class.emr-likert--full-width]="fullWidth()"
      role="radiogroup"
      [id]="resolvedId()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel() || (labelHidden() ? (label() || null) : null)"
      [attr.aria-required]="required() || null"
      [attr.aria-readonly]="readOnly() || null"
      [attr.aria-invalid]="!!error() || invalid() ? 'true' : null"
      [attr.data-warning]="!error() && !invalid() && !!warning() ? 'true' : null"
      [attr.aria-describedby]="describedBy()"
      (focusin)="onFocusIn()"
      (focusout)="onFocusOut($event)"
    >
      <div class="emr-choice-fieldset__top">
        <legend class="emr-likert__legend" [class.emr-sr-only]="labelHidden()">
          {{ label() }}
          @if (required()) {
            <span class="emr-likert__required" aria-hidden="true">*</span>
            <span class="emr-sr-only">Required</span>
          }
        </legend>

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

      <div class="emr-likert__track">
        @for (point of points(); track point.value) {
          <label
            class="emr-likert__option"
            [class.emr-likert__option--selected]="point.selected"
            [attr.data-tone]="point.selected ? (point.tone ?? null) : null"
          >
            <input
              #radioInput
              type="radio"
              class="emr-sr-only"
              [name]="resolvedName()"
              [value]="point.value"
              [checked]="point.selected"
              [disabled]="disabled()"
              [attr.aria-readonly]="readOnly() || null"
              [attr.aria-label]="point.assistiveLabel"
              (click)="onClick($event)"
              (keydown)="onKeydown($event)"
              (change)="onSelect(point.value)"
            />
            <span class="emr-likert__pip" [class.emr-likert__pip--has-text]="!!point.description || point.label.length > 3" aria-hidden="true">
              <span>{{ point.label }}</span>
              @if (point.description) {
                <span class="emr-likert__desc">{{ point.description }}</span>
              }
            </span>
          </label>
        }
      </div>

      @if (anchorsSummary().start || anchorsSummary().mid || anchorsSummary().end) {
        <div class="emr-likert__anchors" aria-hidden="true">
          <span class="emr-likert__anchor">{{ anchorsSummary().start?.label }}</span>
          @if (anchorsSummary().mid) {
            <span class="emr-likert__anchor">{{ anchorsSummary().mid?.label }}</span>
          }
          <span class="emr-likert__anchor">{{ anchorsSummary().end?.label }}</span>
        </div>
      }

      @if (!labelHidden() && (hint() || warning() || error())) {
        <div class="emr-likert__messages">
          @if (hint()) {
            <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
          }
          @if (warning()) {
            <span class="emr-field__warning" [id]="resolvedId() + '-warning'" role="status">{{ warning() }}</span>
          }
          @if (error()) {
            <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">{{ error() }}</span>
          }
        </div>
      }
    </fieldset>
  `,
})
export class EmrLikertComponent implements AfterViewChecked {
  static _idSeq = 0;
  readonly ariaDescribedBy = input<string | undefined>(undefined);

  readonly controlId = input<string>();
  /** Radio-group name. Defaults to a per-instance id so two likerts never share a native group. */
  readonly name = input<string>('');
  readonly label = input<string>('');
  readonly ariaLabel = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly hint = input<string>();
  readonly warning = input<string>();
  readonly error = input<string>();
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly min = input<number>(0);
  readonly max = input<number>(10);
  readonly step = input<number>(1);
  readonly size = input<EmrLikertSize>('md');
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly value = input<number | null>(null);
  readonly anchors = input<readonly EmrLikertAnchor[]>([]);
  readonly options = input<readonly EmrLikertOption[]>([]);
  readonly showOptionLabels = input(false, { transform: booleanAttribute });
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input<string>('Clear');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  /** Controller-supplied tone for the selected pip. Absent -> neutral selection styling. */
  readonly tone = input<EmrTone>();
  /** Optional per-score tone lookup supplied by the controller. */
  readonly optionTones = input<Readonly<Record<number, EmrTone>>>();

  readonly valueChange = output<number | null>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  readonly groupId = `emr-likert-${++EmrLikertComponent._idSeq}`;
  readonly resolvedId = computed(() => this.controlId() || this.groupId);
  readonly resolvedName = computed(() => this.name() || this.resolvedId());
  private hasFocus = false;

  protected readonly showClear = computed(
    () =>
      Boolean(
        this.clearable() &&
          this.value() !== null &&
          this.value() !== undefined &&
          !this.readOnly() &&
          !this.disabled(),
      ),
  );

  readonly points = computed(() =>
    buildLikertPoints({
      min: this.min(),
      max: this.max(),
      step: this.step(),
      value: this.value(),
      anchors: this.anchors(),
      options: this.options(),
      showOptionLabels: this.showOptionLabels(),
      tone: this.tone(),
      optionTones: this.optionTones(),
    }),
  );

  protected readonly anchorsSummary = computed(() =>
    resolveLikertAnchors(this.points(), this.anchors()),
  );

  protected readonly describedBy = computed(() => {
    const ext = this.ariaDescribedBy();
    if (this.labelHidden()) return ext || null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.warning()) ids.push(`${id}-warning`);
    if (this.error()) ids.push(`${id}-error`);
    if (ext) ids.push(ext);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly radioRefs = viewChildren<ElementRef<HTMLInputElement>>('radioInput');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncRadios();
    }
  }

  protected onFocusIn(): void {
    if (!this.hasFocus) {
      this.hasFocus = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const cur = event.currentTarget as HTMLElement | null;
    const rel = event.relatedTarget as Node | null;
    if (!cur || !rel || !cur.contains(rel)) {
      this.hasFocus = false;
      this.syncRadios();
      this.blurred.emit();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.readOnly() || this.disabled()) {
      if (
        event.key === ' ' ||
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown'
      ) {
        event.preventDefault();
        this.syncRadios();
      }
    }
  }

  /** Read-only keeps the control focusable and announceable, but blocks the native toggle. */
  protected onClick(event: Event): void {
    if (this.readOnly() || this.disabled()) {
      event.preventDefault();
      this.syncRadios();
    }
  }

  protected onSelect(point: number): void {
    if (this.disabled() || this.readOnly()) {
      this.syncRadios();
      return;
    }
    this.scheduleRadioSync();
    this.valueChange.emit(point);
  }

  protected clearSelection(): void {
    if (this.disabled() || this.readOnly()) return;
    this.scheduleRadioSync();
    this.valueChange.emit(null);
    this.cleared.emit();
  }

  private scheduleRadioSync(): void {
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncRadios();
      }
    });
  }

  protected syncRadios(): void {
    const active = this.value();
    for (const ref of this.radioRefs()) {
      const el = ref.nativeElement;
      const shouldCheck = active !== null && active !== undefined && Number(el.value) === active;
      if (el.checked !== shouldCheck) el.checked = shouldCheck;
    }
  }
}
