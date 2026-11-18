import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output } from '@angular/core';
import type {
  ClinicalAssessmentStatus,
  ClinicalAssessmentStatusOption,
  ClinicalFieldDefinition,
  ClinicalFieldState,
  EmrValidationMessage,
  FieldFrameIntent,
  FieldFrameLayout,
} from '@drguptavivek/emr-controller';

let nextFieldFrameId = 0;

@Component({
  selector: 'emr-field-frame',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'emr-field-frame',
    '[class.emr-field-frame--horizontal]': 'resolvedLayout() === "horizontal"',
    '[class.emr-field-frame--inline]': 'resolvedLayout() === "inline"',
    '[attr.data-readonly]': 'resolvedReadOnly() ? "true" : null',
  },
  template: `
    @if (!labelHidden() && resolvedLabel()) {
      <div class="emr-field-frame__heading">
        <label
          class="emr-field-frame__label"
          [attr.id]="resolvedControlId() + '-label'"
          [attr.for]="labelNamesControl() ? resolvedControlId() : null"
        >
          {{ resolvedLabel() }}
          @if (resolvedRequired()) {
            <span class="emr-field__required" aria-hidden="true">*</span>
          }
        </label>
        @if (showMetadata() && resolvedUnit()) {
          <span class="emr-field-frame__unit">{{ resolvedUnit() }}</span>
        }
        @if (resolvedRequired()) {
          <span class="emr-sr-only">Required</span>
        }
      </div>
    } @else if (labelHidden() && resolvedLabel()) {
      <label
        class="emr-sr-only"
        [attr.id]="resolvedControlId() + '-label'"
        [attr.for]="resolvedControlId()"
      >
        {{ resolvedLabel() }}
        @if (resolvedRequired()) { Required }
      </label>
    }
    <div class="emr-field-frame__control">
      <ng-content />
      @if (showMetadata() && (resolvedStatus() || (!resolvedReadOnly() && resolvedStatusOptions().length > 0))) {
        <div class="emr-field-frame__status-strip">
          @if (resolvedStatus(); as st) {
            <span class="emr-badge emr-tone-{{ statusTone(st) }}">{{ statusLabel(st) }}</span>
            @if (!resolvedReadOnly()) {
              <button
                type="button"
                class="emr-button emr-button--ghost emr-field-frame__clear"
                (click)="intent.emit({ type: 'statusChangeRequested', status: undefined })"
              >
                Clear
              </button>
            }
          }
          @if (!resolvedReadOnly() && resolvedStatusOptions().length > 0) {
            <div class="emr-field-frame__status-options" role="radiogroup" [attr.aria-label]="resolvedLabel() + ' status'">
              @for (opt of resolvedStatusOptions(); track opt.value) {
                <button
                  type="button"
                  role="radio"
                  class="emr-chip"
                  [class.emr-chip--selected]="resolvedStatus() === opt.value"
                  [attr.aria-checked]="resolvedStatus() === opt.value ? 'true' : 'false'"
                  (click)="onStatusToggle(opt.value)"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
    <div class="emr-field-frame__messages" aria-live="polite">
      @if (hasAnyMessage()) {
        <div [id]="messageId()">
          @if (resolvedHint()) {
            <div [id]="resolvedControlId() + '-hint'" class="emr-field__hint">{{ resolvedHint() }}</div>
          }
          @if (note()) {
            <div [id]="resolvedControlId() + '-note'" class="emr-field__hint">{{ note() }}</div>
          }
          @for (msg of resolvedMessages(); track $index) {
            <div
              [id]="resolvedControlId() + '-msg-' + $index"
              [class]="'emr-field__' + msg.severity"
              [attr.role]="msg.severity === 'error' ? 'alert' : 'status'"
            >
              {{ msg.message }}
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class EmrFieldFrameComponent {
  readonly label = input<string>('');
  readonly controlId = input<string>();
  readonly definition = input<ClinicalFieldDefinition>();
  readonly model = input<ClinicalFieldState>();
  readonly required = input(false, { transform: booleanAttribute });
  /** Matrix cells: row and column headers are the visible label; the <label> stays for assistive tech. */
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly labelNamesControl = input(true, { transform: booleanAttribute });
  readonly unit = input<string>();
  readonly note = input<string>();
  readonly showMetadata = input(true, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly layout = input<FieldFrameLayout>('vertical');
  readonly assessmentStatus = input<ClinicalAssessmentStatus>();
  readonly assessmentStatusOptions = input<readonly ClinicalAssessmentStatusOption[]>([]);
  readonly hint = input<string>();
  readonly info = input<string>();
  readonly warning = input<string>();
  readonly error = input<string>();
  readonly messages = input<readonly EmrValidationMessage[]>([]);

  readonly intent = output<FieldFrameIntent>();

  private readonly fallbackId = `emr-field-frame-${++nextFieldFrameId}`;
  readonly resolvedControlId = computed(() => this.controlId() || this.fallbackId);
  readonly messageId = computed(() => `${this.resolvedControlId()}-message`);

  protected readonly resolvedLayout = computed<FieldFrameLayout>(() => {
    const l = this.layout();
    return l === 'horizontal' || l === 'inline' ? l : 'vertical';
  });

  protected readonly resolvedLabel = computed(() => this.label() || this.definition()?.label || '');
  protected readonly resolvedUnit = computed(() => this.unit() ?? this.definition()?.unit);
  protected readonly resolvedHint = computed(() => this.hint() ?? this.definition()?.hint);
  protected readonly resolvedRequired = computed(() => this.required() || Boolean(this.definition()?.required));
  protected readonly resolvedReadOnly = computed(() => this.readOnly());
  protected readonly resolvedStatus = computed(() => this.assessmentStatus() ?? this.model()?.assessmentStatus);
  protected readonly resolvedStatusOptions = computed(() =>
    this.assessmentStatusOptions().length > 0
      ? this.assessmentStatusOptions()
      : (this.definition()?.assessmentStatusOptions ?? []),
  );

  protected readonly resolvedMessages = computed<readonly EmrValidationMessage[]>(() => {
    const out: EmrValidationMessage[] = [];
    const push = (severity: 'error' | 'warning' | 'info', msg?: string, path: readonly (string | number)[] = []) => {
      const trimmed = typeof msg === 'string' ? msg.trim() : '';
      if (!trimmed) return;
      if (!out.some((m) => m.severity === severity && m.message === trimmed)) {
        out.push({ path, severity, message: trimmed });
      }
    };
    push('error', this.error() ?? this.model()?.error);
    push('warning', this.warning() ?? this.model()?.warning);
    push('info', this.info());
    for (const m of this.messages()) {
      push(m.severity, m.message, m.path);
    }
    return out;
  });

  readonly hasAnyMessage = computed(() =>
    Boolean(this.resolvedHint() || this.note() || this.resolvedMessages().length > 0),
  );

  protected statusLabel(status: ClinicalAssessmentStatus): string {
    const matched = this.resolvedStatusOptions().find((o) => o.value === status);
    return matched?.label ?? String(status).replaceAll('-', ' ');
  }

  protected statusTone(status: ClinicalAssessmentStatus): string {
    return this.resolvedStatusOptions().find((o) => o.value === status)?.tone ?? 'neutral';
  }

  protected onStatusToggle(val: ClinicalAssessmentStatus): void {
    if (this.resolvedReadOnly()) return;
    this.intent.emit({
      type: 'statusChangeRequested',
      status: this.resolvedStatus() === val ? undefined : val,
    });
  }
}
