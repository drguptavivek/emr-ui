import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { LinkCardsIntent, LinkCardsViewModel } from '@drguptavivek/emr-controller';
import { EmrIdentifierEntryComponent } from '../fields/emr-identifier-entry.component';
import { EmrPatientIdentityCardComponent } from './emr-patient-identity-card.component';

let nextId = 0;

/** English fallbacks for built-in strings; every one is overridable through the `labels` input. */
const DEFAULT_LABELS = {
  addCard: 'Add card',
  remove: 'Remove',
  primary: 'Primary card',
  checking: 'Checking this card…',
  samePerson: 'Same person',
  notSamePerson: 'Not the same person',
  submit: 'Link cards',
  cancel: 'Cancel',
  cards: 'Cards to link'
};
export type EmrLinkCardsLabels = typeof DEFAULT_LABELS;

/**
 * L4 "link several cards to one patient": the patient, an entry for the next card, and the list of cards with
 * per-card state (checking / invalid / on another patient). The app decides every rule; the component emits
 * intents. Submit is offered only when canSubmit, otherwise submitError shows. Output: one `intent` stream.
 */
@Component({
  selector: 'emr-link-cards',
  standalone: true,
  imports: [EmrIdentifierEntryComponent, EmrPatientIdentityCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    <div class="lc">
      <emr-patient-identity-card [model]="m.patient" mode="compact" />
      <div class="lc__entry">
        <emr-identifier-entry class="lc__field" [model]="m.entry" [controlId]="id + '-entry'"
          (intent)="onEntry($event)" (keydown.enter)="onEnter($event)" />
        <button class="emr-button" type="button" (click)="intent.emit({ type: 'cardEntered' })">{{ l.addCard }}</button>
      </div>
      @if (m.cards.length) {
        <ul class="lc__list" [attr.aria-label]="l.cards">
          @for (c of m.cards; track c.id) {
            <li class="lc__card" [attr.aria-busy]="c.state === 'checking' ? true : null">
              <div class="lc__row">
                <strong class="lc__display">{{ c.display }}</strong>
                <span class="emr-badge" [class]="'emr-badge emr-tone-' + c.statusBadge.tone">{{ c.statusBadge.label }}@if (c.statusBadge.assistiveText) { <span class="emr-sr-only"> {{ c.statusBadge.assistiveText }}</span> }</span>
              </div>
              @if (c.state === 'checking') { <p class="lc__muted" role="status">{{ l.checking }}</p> }
              @if (c.message) { <p class="lc__muted">{{ c.message }}</p> }
              @for (w of c.warnings; track w) { <p class="lc__warn"><span aria-hidden="true">⚠ </span>{{ w }}</p> }
              @if (c.state === 'on_other_patient' && c.candidate; as cand) {
                <emr-patient-identity-card [model]="cand" mode="compact" />
                <div class="lc__row">
                  <button class="emr-button emr-button--outline" type="button" (click)="intent.emit({ type: 'sameConfirmed', id: c.id })">{{ l.samePerson }}</button>
                  <button class="emr-button emr-button--outline" type="button" (click)="intent.emit({ type: 'notSameConfirmed', id: c.id })">{{ l.notSamePerson }}</button>
                </div>
              }
              <div class="lc__row">
                <label class="emr-radio"><input type="radio" [name]="id + '-primary'" [value]="c.id" [checked]="c.id === m.primaryCardId"
                  (change)="intent.emit({ type: 'primarySelected', id: c.id })" /><span>{{ l.primary }}</span></label>
                <button class="emr-button emr-button--ghost" type="button" [attr.aria-label]="l.remove + ': ' + c.display"
                  (click)="intent.emit({ type: 'cardRemoved', id: c.id })">{{ l.remove }}</button>
              </div>
            </li>
          }
        </ul>
      }
      @if (!m.canSubmit && m.submitError) { <p class="emr-field__error" role="alert">{{ m.submitError }}</p> }
      <div class="lc__row">
        @if (m.canSubmit) { <button class="emr-button" type="button" (click)="intent.emit({ type: 'submitRequested' })">{{ l.submit }}</button> }
        <button class="emr-button emr-button--ghost" type="button" (click)="intent.emit({ type: 'cancelled' })">{{ l.cancel }}</button>
      </div>
    </div>
  `,
  styles: [`
    :host{display:block;min-width:0;color:var(--emr-text);font-family:var(--emr-font-family)}
    .lc{display:grid;gap:12px;min-width:0}
    .lc__entry{display:flex;flex-wrap:wrap;align-items:flex-start;gap:8px}
    .lc__field{flex:1 1 220px;min-width:0}
    .lc__list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
    .lc__card{display:grid;gap:8px;padding:12px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);min-width:0}
    .lc__row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0}
    .lc__display{overflow-wrap:anywhere}
    .lc__muted,.lc__warn{margin:0;font-size:var(--emr-text-sm);overflow-wrap:anywhere}
    .lc__muted{color:var(--emr-text-muted)}
    .lc__warn{color:var(--emr-warning)}
  `]
})
export class EmrLinkCardsComponent {
  readonly model = input.required<LinkCardsViewModel>();
  readonly labels = input<Partial<EmrLinkCardsLabels>>({});
  readonly intent = output<LinkCardsIntent>();

  readonly id = `emr-link-cards-${++nextId}`;
  readonly text = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));

  onEntry(e: { type: string; raw?: string; id?: string }): void {
    if (e.type === 'valueChanged') this.intent.emit({ type: 'entryChanged', raw: e.raw ?? '' });
    else if (e.type === 'scanRequested') this.intent.emit({ type: 'scanRequested' });
    else if (e.type === 'typeSelected') this.intent.emit({ type: 'typeSelected', id: e.id ?? '' });
  }

  /** Enter in the text box adds the card; Enter on the Scan button or a type radio keeps its own meaning. */
  onEnter(event: Event): void {
    const t = event.target as HTMLInputElement;
    if (t.tagName === 'INPUT' && t.type === 'text') this.intent.emit({ type: 'cardEntered' });
  }
}
