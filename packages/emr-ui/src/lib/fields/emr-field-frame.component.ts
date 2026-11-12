import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import type { EmrValidationMessage } from '@drguptavivek/emr-controller';

let nextFieldFrameId = 0;

@Component({
  selector: 'emr-field-frame',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'emr-field-frame' },
  template: `
    <div class="emr-field-frame__heading">
      <label
        class="emr-field-frame__label"
        [class.emr-sr-only]="labelHidden()"
        [attr.for]="resolvedControlId()"
      >
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </label>
      @if (required()) {
        <span class="emr-sr-only">Required</span>
      }
    </div>
    <div class="emr-field-frame__control"><ng-content /></div>
    <div class="emr-field-frame__messages" aria-live="polite">
      @if (hasAnyMessage()) {
        <div [id]="messageId()">
          @if (hint()) {
            <div class="emr-field__hint">{{ hint() }}</div>
          }
          @if (messages().length > 0) {
            @for (msg of messages(); track $index) {
              <div [class]="'emr-field__' + msg.severity">{{ msg.message }}</div>
            }
          } @else {
            @if (error()) {
              <div class="emr-field__error">{{ error() }}</div>
            }
            @if (warning()) {
              <div class="emr-field__warning">{{ warning() }}</div>
            }
            @if (info()) {
              <div class="emr-field__info">{{ info() }}</div>
            }
          }
        </div>
      }
    </div>
  `,
})
export class EmrFieldFrameComponent {
  readonly label = input.required<string>();
  readonly controlId = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  /** Matrix cells: row and column headers are the visible label; the <label> stays for assistive tech. */
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly hint = input<string>();
  readonly info = input<string>();
  readonly warning = input<string>();
  readonly error = input<string>();
  readonly messages = input<readonly EmrValidationMessage[]>([]);

  private readonly fallbackId = `emr-field-frame-${++nextFieldFrameId}`;
  readonly resolvedControlId = computed(() => this.controlId() || this.fallbackId);
  readonly messageId = computed(() => `${this.resolvedControlId()}-message`);
  readonly hasAnyMessage = computed(() =>
    Boolean(
      this.hint() ||
        this.error() ||
        this.warning() ||
        this.info() ||
        this.messages().length > 0,
    ),
  );
}
