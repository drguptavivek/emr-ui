import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { EmrTone, PatientIdentityIntent, PatientIdentityViewModel } from '@drguptavivek/emr-controller';

/** English fallbacks for built-in strings; every one is overridable through the `labels` input. */
const DEFAULT_LABELS = {
  confirmPatient: 'Confirm patient',
  notThisPatient: 'Not this patient',
  addIdentifier: 'Add identifier',
  primaryIdentifier: 'Primary identifier',
  moreIdentifiers: 'more identifiers'
};
export type EmrPatientIdentityLabels = typeof DEFAULT_LABELS;

/** Glyph per tone so a notice never relies on colour alone. Shared by the identity components. */
export const toneGlyph = (tone: EmrTone): string =>
  ({ danger: '✕', warning: '⚠', success: '✓', info: 'ℹ', neutral: '•' } as Record<string, string>)[tone] ?? '•';

/**
 * L4 identity card: who this is, by identifier. The first identifier is primary. `full` shows every identifier,
 * demographics, alerts and the confirm / not-this-patient / add-identifier actions. `compact` is one wrapping line
 * with a "+N" chip and alerts, and fits 360px. Output: one `intent` stream.
 */
@Component({
  selector: 'emr-patient-identity-card',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    @let p = primary();
    @if (mode() === 'compact') {
      <section class="pic pic--compact" [attr.aria-label]="m.name">
        <div class="pic__wrap">
          <strong class="pic__name">{{ m.name }}</strong>
          <span class="pic__muted">{{ compactLine() }}</span>
          @if (p?.statusBadge; as b) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + b.tone">{{ b.label }}@if (b.assistiveText) { <span class="emr-sr-only"> {{ b.assistiveText }}</span> }</span> }
          @if (others().length) { <span class="emr-chip emr-tone-neutral">+{{ others().length }}<span class="emr-sr-only"> {{ l.moreIdentifiers }}</span></span> }
        </div>
        <ng-container *ngTemplateOutlet="alertsTpl" />
      </section>
    } @else {
      <section class="pic" [attr.aria-label]="m.name">
        <h3 class="pic__title">{{ m.name }}</h3>
        <p class="pic__muted">{{ demographics() }}</p>
        @if (m.aliases?.length) { <p class="pic__muted">{{ m.aliases!.join(', ') }}</p> }
        @if (p) {
          <div class="pic__primary" role="group" [attr.aria-label]="l.primaryIdentifier">
            <span class="pic__muted">{{ p.label }}</span>
            <div class="pic__wrap"><strong class="pic__big">{{ p.display }}</strong>
              @if (p.statusBadge; as b) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + b.tone">{{ b.label }}@if (b.assistiveText) { <span class="emr-sr-only"> {{ b.assistiveText }}</span> }</span> }
            </div>
          </div>
        }
        @for (i of others(); track i.system + ':' + i.display) {
          <div class="pic__wrap"><span class="pic__muted">{{ i.label }}</span><span class="pic__id">{{ i.display }}</span>
            @if (i.statusBadge; as b) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + b.tone">{{ b.label }}@if (b.assistiveText) { <span class="emr-sr-only"> {{ b.assistiveText }}</span> }</span> }
          </div>
        }
        @if (details()) { <p class="pic__muted">{{ details() }}</p> }
        <ng-container *ngTemplateOutlet="alertsTpl" />
        <div class="pic__wrap">
          <button class="emr-button" type="button" (click)="intent.emit({ type: 'confirmRequested' })">{{ l.confirmPatient }}</button>
          <button class="emr-button emr-button--outline" type="button" (click)="intent.emit({ type: 'notThisPatientRequested' })">{{ l.notThisPatient }}</button>
        </div>
        @if (m.addableSystems?.length) {
          <div class="pic__wrap">
            @for (a of m.addableSystems; track a.system) {
              <button class="emr-button emr-button--ghost" type="button" (click)="intent.emit({ type: 'addIdentifierRequested', system: a.system })">{{ l.addIdentifier }}: {{ a.label }}</button>
            }
          </div>
        }
      </section>
    }
    <ng-template #alertsTpl>
      @if (model().alerts?.length) {
        <div class="pic__alerts">
          @for (a of model().alerts; track a.id) {
            <div class="emr-alert" [class]="'emr-alert emr-tone-' + a.tone" role="status">
              <span aria-hidden="true">{{ glyph(a.tone) }}</span>
              <div class="emr-alert__body pic__alert-body">{{ a.text }}</div>
              @if (a.actionLabel) {
                <button class="emr-button emr-button--outline" type="button" [attr.aria-label]="a.actionLabel + ': ' + a.text"
                  (click)="intent.emit({ type: 'alertActionRequested', id: a.id })">{{ a.actionLabel }}</button>
              }
            </div>
          }
        </div>
      }
    </ng-template>
  `,
  styles: [`
    :host{display:block;min-width:0;color:var(--emr-text);font-family:var(--emr-font-family)}
    .pic{display:grid;gap:8px;min-width:0;padding:12px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface)}
    .pic--compact{padding:8px}
    .pic__title{margin:0;font-size:var(--emr-text-lg);font-weight:var(--emr-weight-bold)}
    .pic__big{font-size:var(--emr-text-xl);font-weight:var(--emr-weight-bold);overflow-wrap:anywhere}
    .pic__id{overflow-wrap:anywhere}
    .pic__name{min-width:0;overflow-wrap:anywhere}
    .pic__muted{margin:0;font-size:var(--emr-text-sm);color:var(--emr-text-muted);overflow-wrap:anywhere}
    .pic__primary{display:grid;gap:2px}
    .pic__wrap{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0}
    .pic__alerts{display:grid;gap:8px}
    .pic__alert-body{flex:1;min-width:0;overflow-wrap:anywhere}
  `]
})
export class EmrPatientIdentityCardComponent {
  readonly model = input.required<PatientIdentityViewModel>();
  /** Presentation only, like EmrPatientBanner's compact. */
  readonly mode = input<'full' | 'compact'>('full');
  readonly labels = input<Partial<EmrPatientIdentityLabels>>({});
  readonly intent = output<PatientIdentityIntent>();

  readonly text = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));
  readonly primary = computed(() => this.model().identifiers[0]);
  readonly others = computed(() => this.model().identifiers.slice(1));
  readonly demographics = computed(() => [this.model().ageLabel, this.model().sexLabel].filter(Boolean).join(' · '));
  readonly compactLine = computed(() => [this.demographics(), this.primary()?.display].filter(Boolean).join(' · '));
  readonly details = computed(() => { const m = this.model(); return [m.phone, m.centreName, m.lastVisitDate].filter(Boolean).join(' · '); });
  readonly glyph = toneGlyph;
}
