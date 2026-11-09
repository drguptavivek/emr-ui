import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ContactAttemptSummaryIntent, ContactAttemptSummaryView } from '@drguptavivek/emr-controller';

/** Built-in English; the app overrides any of it through the `labels` input. */
const DEFAULT_LABELS = { logAttempt: 'Log attempt' };
export type EmrContactAttemptSummaryLabels = typeof DEFAULT_LABELS;

/** L4 one-line contact-attempt summary. The text and badge are the app's; the action shows only when `actionable`. */
@Component({
  selector: 'emr-contact-attempt-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cas">
      <span class="cas__text">{{ model().text }}</span>
      @if (model().statusBadge; as b) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + b.tone">{{ b.label }}</span> }
      @if (actionable()) { <button type="button" class="emr-button emr-button--small emr-button--outline" (click)="intent.emit({ type: 'logAttemptRequested' })">{{ l().logAttempt }}</button> }
    </div>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}
    .cas{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;font-size:var(--emr-text-sm)}
    .cas__text{overflow-wrap:anywhere}
    @media print{button{display:none}}
  `]
})
export class EmrContactAttemptSummaryComponent {
  readonly model = input.required<ContactAttemptSummaryView>();
  /** The app decides whether this user may log an attempt now. */
  readonly actionable = input(false);
  readonly labels = input<Partial<EmrContactAttemptSummaryLabels>>({});
  readonly intent = output<ContactAttemptSummaryIntent>();
  protected readonly l = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));
}
