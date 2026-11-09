import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { IdentifierCheckIntent, IdentifierCheckViewModel } from '@drguptavivek/emr-controller';
import { EmrCheckboxComponent } from '../primitives/emr-choice.component';
import { EmrPatientIdentityCardComponent, toneGlyph } from './emr-patient-identity-card.component';

/** English fallbacks for built-in strings; every one is overridable through the `labels` input. */
const DEFAULT_LABELS = {
  acknowledge: 'I have reviewed this',
  confirmIdentifier: 'Confirm identifier',
  cancel: 'Cancel',
  mergeRequest: 'Same person: request merge',
  reenter: 'Wrong ID: re-enter',
  addAsAdditional: 'Add as additional',
  replaceExisting: 'Replace existing',
  blockedTitle: 'Identifier cannot be used',
  warningsTitle: 'Review before continuing',
  okTitle: 'Identifier can be used'
};
export type EmrIdentifierCheckLabels = typeof DEFAULT_LABELS;

const OUTCOME = {
  blocked: { tone: 'danger', title: 'blockedTitle' },
  warnings: { tone: 'warning', title: 'warningsTitle' },
  ok: { tone: 'success', title: 'okTitle' }
} as const;

/**
 * L4 duplicate-check result for an identifier. Blocked has no confirm path (merge per candidate, re-enter, cancel);
 * warnings need a per-finding acknowledgement, which the component only emits and never toggles itself; Confirm,
 * Add as additional and Replace existing appear only when the model says so. Output: one `intent` stream.
 */
@Component({
  selector: 'emr-identifier-check-prompt',
  standalone: true,
  imports: [EmrCheckboxComponent, EmrPatientIdentityCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    @let o = outcome();
    <div class="icp" role="group" [attr.aria-label]="m.identifier.label + ': ' + m.identifier.display">
      <div class="emr-alert" [class]="'emr-alert emr-tone-' + o.tone" role="status">
        <span aria-hidden="true">{{ glyph(o.tone) }}</span>
        <div><div class="emr-alert__title">{{ l[o.title] }}</div><div class="emr-alert__body">{{ m.identifier.label }}: {{ m.identifier.display }}</div></div>
      </div>
      @for (f of m.findings; track f.id) {
        <div class="icp__card">
          <strong>{{ f.message }}</strong>
          @for (e of f.evidence; track e.label) {
            <div class="icp__row"><span class="icp__muted">{{ e.label }}</span><span class="icp__value">{{ e.value }}</span></div>
          }
          @if (f.candidate; as c) { <emr-patient-identity-card [model]="c" mode="compact" /> }
          @if (m.outcome === 'warnings') {
            <emr-checkbox [label]="l.acknowledge" [checked]="!!f.acknowledged"
              (checkedChange)="intent.emit({ type: 'findingAcknowledged', findingId: f.id })" />
          }
          @if (m.outcome === 'blocked' && f.candidate; as c) {
            <div><button class="emr-button emr-button--outline" type="button" (click)="intent.emit({ type: 'mergeRequested', candidateId: c.id })">{{ l.mergeRequest }}</button></div>
          }
        </div>
      }
      <div class="icp__row">
        @if (m.outcome === 'blocked') {
          <button class="emr-button" type="button" (click)="intent.emit({ type: 'reenterRequested' })">{{ l.reenter }}</button>
        } @else {
          @if (m.canConfirm) { <button class="emr-button" type="button" (click)="intent.emit({ type: 'confirmRequested' })">{{ l.confirmIdentifier }}</button> }
          @if (m.canAddAsAdditional) { <button class="emr-button emr-button--outline" type="button" (click)="intent.emit({ type: 'addAsAdditional' })">{{ l.addAsAdditional }}</button> }
          @if (m.canReplaceExisting) { <button class="emr-button emr-button--outline" type="button" (click)="intent.emit({ type: 'replaceExisting' })">{{ l.replaceExisting }}</button> }
        }
        <button class="emr-button emr-button--ghost" type="button" (click)="intent.emit({ type: 'cancelled' })">{{ l.cancel }}</button>
      </div>
    </div>
  `,
  styles: [`
    :host{display:block;min-width:0;color:var(--emr-text);font-family:var(--emr-font-family)}
    .icp{display:grid;gap:12px;min-width:0}
    .icp__card{display:grid;gap:8px;padding:12px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);min-width:0}
    .icp__row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0}
    .icp__muted{font-size:var(--emr-text-sm);color:var(--emr-text-muted)}
    .icp__value{overflow-wrap:anywhere;min-width:0}
  `]
})
export class EmrIdentifierCheckPromptComponent {
  readonly model = input.required<IdentifierCheckViewModel>();
  readonly labels = input<Partial<EmrIdentifierCheckLabels>>({});
  readonly intent = output<IdentifierCheckIntent>();

  readonly text = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));
  readonly outcome = computed(() => OUTCOME[this.model().outcome]);
  readonly glyph = toneGlyph;
}
