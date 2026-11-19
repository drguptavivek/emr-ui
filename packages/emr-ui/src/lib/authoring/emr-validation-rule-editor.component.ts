import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  FieldValidationRule,
  ValidationRuleEditorIntent,
  ValidationRuleEditorViewModel,
} from '@drguptavivek/emr-controller';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroPlus, heroTrash } from '@ng-icons/heroicons/outline';
import {
  AUTHORING_VALIDATION_RULE_KINDS,
  VALIDATION_EDITOR_DEFAULTS,
  buildValidationRule,
  canAddValidationRule,
  summarizeValidationRule,
  type EmrValidationRuleEditorLabels,
} from './emr-authoring.logic';

type RuleKind = FieldValidationRule['kind'];

@Component({
  selector: 'emr-validation-rule-editor',
  standalone: true,
  imports: [NgIcon],
  providers: [...provideIcons({ heroPlus, heroTrash })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    @let m = model();
    @let l = text();
    @let locked = effectiveReadOnly();
    <section
      class="emr-authoring-card"
      [attr.aria-labelledby]="resolvedHeadingId()"
      [attr.data-emr-print]="'expand'"
    >
      <div class="emr-authoring-card__heading">
        <div>
          <p class="emr-eyebrow">{{ l.eyebrow }}</p>
          <h3 [id]="resolvedHeadingId()">{{ l.heading }}</h3>
        </div>
        <span class="emr-authoring-status">{{ m.rules.length }} {{ m.rules.length === 1 ? 'rule' : 'rules' }}</span>
      </div>

      <div class="emr-authoring-grid emr-authoring-grid--rule">
        <label class="emr-field-frame__label" [for]="id('emr-rule-kind')">{{ l.ruleTypeLabel }}</label>
        <select
          class="emr-select"
          [id]="id('emr-rule-kind')"
          [value]="kind"
          [attr.aria-disabled]="locked ? 'true' : null"
          (mousedown)="guardReadOnlySelect($event, locked)"
          (keydown)="guardReadOnlySelectKey($event, locked)"
          (change)="kindChanged($event)"
        >
          @for (option of ruleKinds; track option) {
            <option [value]="option" [selected]="option === kind">{{ l.ruleLabels[option] }}</option>
          }
        </select>

        @if (kind === 'custom') {
          <label class="emr-field-frame__label" [for]="id('emr-rule-value')">{{ l.validatorIdLabel }}</label>
          <input
            class="emr-control"
            [id]="id('emr-rule-value')"
            [value]="value"
            [readonly]="locked"
            [placeholder]="l.validatorIdPlaceholder"
            (input)="valueChanged($event)"
          />
        } @else if (kind === 'pattern') {
          <label class="emr-field-frame__label" [for]="id('emr-rule-value')">{{ l.regexLabel }}</label>
          <input
            class="emr-control"
            [id]="id('emr-rule-value')"
            [value]="value"
            [readonly]="locked"
            [placeholder]="l.regexPlaceholder"
            (input)="valueChanged($event)"
          />
        } @else if (kind === 'earliest-date' || kind === 'latest-date') {
          <label class="emr-field-frame__label" [for]="id('emr-rule-value')">{{ l.dateLabel }}</label>
          <input
            class="emr-control"
            [id]="id('emr-rule-value')"
            type="date"
            [value]="value"
            [readonly]="locked"
            (input)="valueChanged($event)"
          />
        } @else if (kind === 'allowed-values') {
          <label class="emr-field-frame__label" [for]="id('emr-rule-value')">{{ l.allowedValuesLabel }}</label>
          <input
            class="emr-control"
            [id]="id('emr-rule-value')"
            [value]="value"
            [readonly]="locked"
            [placeholder]="l.allowedValuesPlaceholder"
            (input)="valueChanged($event)"
          />
        } @else {
          <label class="emr-field-frame__label" [for]="id('emr-rule-value')">{{ l.valueLabel }}</label>
          <input
            class="emr-control"
            [id]="id('emr-rule-value')"
            type="number"
            [value]="value"
            [readonly]="locked"
            (input)="valueChanged($event)"
          />
        }

        <label class="emr-field-frame__label" [for]="id('emr-rule-message')">
          {{ l.messageLabel }} <span class="emr-field__hint">{{ l.messageOptional }}</span>
        </label>
        <input
          class="emr-control"
          [id]="id('emr-rule-message')"
          [value]="message"
          [readonly]="locked"
          [placeholder]="l.messagePlaceholder"
          (input)="messageChanged($event)"
        />
      </div>

      @if (kind === 'custom') {
        <p class="emr-authoring-message">{{ l.customNote }}</p>
      }

      <button
        class="emr-button emr-button--secondary emr-validation-add"
        type="button"
        data-emr-print="hide"
        [attr.aria-disabled]="(locked || !canAdd()) ? 'true' : null"
        (click)="addRule()"
      >
        <ng-icon name="heroPlus" size="16" aria-hidden="true" />
        <span>{{ l.addRule }}</span>
      </button>

      @if (m.rules.length) {
        <div class="emr-validation-rules" role="list" [attr.aria-label]="l.currentRulesGroup">
          @for (rule of m.rules; track rule.id) {
            <div class="emr-validation-rule" role="listitem">
              <div>
                <strong>{{ l.ruleLabels[rule.kind] }}</strong>
                <span>{{ summary(rule) }}</span>
                @if (rule.message) {
                  <small>{{ rule.message }}</small>
                }
              </div>
              <button
                class="emr-button emr-button--ghost"
                type="button"
                data-emr-print="hide"
                [attr.aria-disabled]="locked ? 'true' : null"
                (click)="removeRule(rule.id)"
              >
                <ng-icon name="heroTrash" size="16" aria-hidden="true" />
                <span>{{ l.remove }}</span>
              </button>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    :host{display:block;container-type:inline-size;max-width:100%}
    .emr-authoring-card{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:18px;min-width:0;max-width:100%;font-family:var(--emr-font-family);color:var(--emr-text)}
    .emr-authoring-card__heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px;flex-wrap:wrap}
    .emr-authoring-card h3{margin:2px 0 0;color:var(--emr-text);font-size:var(--emr-text-lg)}
    .emr-eyebrow{margin:0 0 4px;color:var(--emr-text-muted);font-size:var(--emr-text-2xs);font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    .emr-authoring-status{color:var(--emr-text-muted);font-size:var(--emr-text-sm)}
    .emr-authoring-grid{display:grid;grid-template-columns:minmax(110px,150px) minmax(0,1fr);gap:10px 12px;align-items:center}
    .emr-control,.emr-select,.emr-button{min-height:var(--emr-control-height,44px)}
    .emr-button{min-width:44px;display:inline-flex;align-items:center;gap:6px}
    .emr-button[aria-disabled="true"],.emr-select[aria-disabled="true"]{cursor:not-allowed;opacity:.55}
    .emr-validation-add{margin-top:14px}
    .emr-authoring-message{margin:12px 0 0;padding:10px 12px;border-radius:8px;background:var(--emr-surface-raised);color:var(--emr-text-muted);font-size:var(--emr-text-sm)}
    .emr-validation-rules{display:grid;gap:7px;margin-top:14px}
    .emr-validation-rule{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface-raised);flex-wrap:wrap}
    .emr-validation-rule>div{display:grid;gap:2px;min-width:0}
    .emr-validation-rule span,.emr-validation-rule small{color:var(--emr-text-muted);font-size:var(--emr-text-sm);overflow-wrap:anywhere}
    .emr-validation-rule small{font-style:italic}
    @container (max-width: 720px){
      .emr-authoring-card{padding:14px}
      .emr-authoring-grid{grid-template-columns:1fr;gap:6px}
      .emr-validation-rule{align-items:flex-start}
    }
    @media (max-width: 640px){
      .emr-authoring-grid{grid-template-columns:1fr;gap:6px}
      .emr-validation-rule{align-items:flex-start}
    }
    :host-context(.emr-print) [data-emr-print="hide"]{display:none !important}
    @media print{[data-emr-print="hide"]{display:none !important}}
  `],
})
export class EmrValidationRuleEditorComponent {
  readonly model = input.required<ValidationRuleEditorViewModel>();
  readonly headingId = input<string>('emr-validation-heading');
  readonly idPrefix = input<string>('emr-validation');
  readonly labels = input<Partial<EmrValidationRuleEditorLabels>>({});

  readonly intent = output<ValidationRuleEditorIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private isFocusWithin = false;

  readonly ruleKinds = AUTHORING_VALIDATION_RULE_KINDS;
  kind: RuleKind = 'minimum';
  value = '';
  message = '';

  protected readonly text = computed(() => ({ ...VALIDATION_EDITOR_DEFAULTS, ...this.labels() }));
  protected readonly effectiveReadOnly = computed(() => !!this.model().readOnly);
  protected readonly resolvedPrefix = computed(() => this.idPrefix().trim() || 'emr-validation');
  protected readonly resolvedHeadingId = computed(() => {
    const h = this.headingId().trim();
    return h && h !== 'emr-validation-heading'
      ? h
      : `${this.resolvedPrefix()}-heading`;
  });

  id(suffix: string): string {
    return `${this.resolvedPrefix()}-${suffix}`;
  }

  guardReadOnlySelect(event: Event, locked: boolean): void {
    if (locked) event.preventDefault();
  }

  guardReadOnlySelectKey(event: KeyboardEvent, locked: boolean): void {
    if (locked && [' ', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
    }
  }

  kindChanged(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.effectiveReadOnly()) {
      select.value = this.kind;
      return;
    }
    this.kind = select.value as RuleKind;
    this.value = '';
  }

  valueChanged(event: Event): void {
    if (this.effectiveReadOnly()) return;
    this.value = (event.target as HTMLInputElement).value;
  }

  messageChanged(event: Event): void {
    if (this.effectiveReadOnly()) return;
    this.message = (event.target as HTMLInputElement).value;
  }

  canAdd(): boolean {
    return !this.effectiveReadOnly() && canAddValidationRule(this.kind, this.value, this.message);
  }

  addRule(): void {
    if (!this.canAdd()) return;
    const rule = buildValidationRule(this.kind, this.value, this.message, this.text().defaultPatternMessage);
    this.intent.emit({ type: 'validationRuleAdded', rule });
    this.value = '';
    this.message = '';
  }

  removeRule(ruleId: string): void {
    if (this.effectiveReadOnly()) return;
    this.intent.emit({ type: 'validationRuleRemoved', ruleId });
  }

  summary(rule: FieldValidationRule): string {
    return summarizeValidationRule(rule);
  }

  protected onFocusIn(): void {
    if (!this.isFocusWithin) {
      this.isFocusWithin = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.hostRef.nativeElement.contains(next)) return;
    if (this.isFocusWithin) {
      this.isFocusWithin = false;
      this.blurred.emit();
    }
  }
}
