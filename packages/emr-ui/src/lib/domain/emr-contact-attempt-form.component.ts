import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ContactAttemptIntent, ContactAttemptViewModel } from '@drguptavivek/emr-controller';
import { EmrDateInputComponent } from '../primitives/emr-inputs.component';
import { EmrRadioGroupComponent, EmrToggleComponent } from '../primitives/emr-choice.component';

/** Built-in English; the app overrides any of it through the `labels` input. */
const DEFAULT_LABELS = {
  number: 'Number',
  call: 'Call',
  channel: 'Channel',
  reached: 'Patient was reached',
  outcome: 'Outcome',
  nextActionDate: 'Next action date',
  note: 'Note',
  submit: 'Save attempt',
  cancel: 'Cancel'
};
export type EmrContactAttemptFormLabels = typeof DEFAULT_LABELS;

let nextId = 0;

/** L4 controlled form for logging a contact attempt. Dialling, outcome rules and the consequence wording are the app's; the date is emitted as ISO. */
@Component({
  selector: 'emr-contact-attempt-form',
  standalone: true,
  imports: [EmrRadioGroupComponent, EmrToggleComponent, EmrDateInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="caf" novalidate (submit)="$event.preventDefault()" [attr.aria-labelledby]="uid + '-title'">
      <h3 class="caf__title" [id]="uid + '-title'">{{ model().reasonLabel }}</h3>
      <div class="caf__number">
        <emr-radio-group [name]="uid + '-number'" [label]="l().number" [options]="numberOpts()" [value]="model().selectedNumber ?? null"
          (valueChange)="intent.emit({ type: 'numberSelected', id: $event })" />
        @if (model().selectedNumber; as n) {
          <button type="button" class="emr-button emr-button--outline" (click)="intent.emit({ type: 'callRequested', numberId: n })">{{ l().call }}: {{ numberLabel(n) }}</button>
        }
      </div>
      <emr-radio-group [name]="uid + '-channel'" [label]="l().channel" [options]="channelOpts()" [value]="model().selectedChannel ?? null"
        (valueChange)="intent.emit({ type: 'channelSelected', id: $event })" />
      <emr-toggle [label]="l().reached" [checked]="model().reached ?? false" (checkedChange)="intent.emit({ type: 'reachedChanged', reached: $event })" />
      <emr-radio-group [name]="uid + '-outcome'" [label]="l().outcome" [options]="outcomeOpts()" [value]="model().selectedOutcome ?? null"
        (valueChange)="intent.emit({ type: 'outcomeSelected', id: $event })" />
      @if (model().consequence; as c) { <div class="emr-alert emr-tone-info" role="status"><div>{{ c }}</div></div> }
      <emr-date-input [controlId]="uid + '-date'" [label]="l().nextActionDate" [value]="model().nextActionDate ?? ''" [error]="model().nextActionDateError ?? ''"
        (valueChange)="intent.emit({ type: 'nextActionDateChanged', date: $event || null })" />
      <label class="emr-field" [for]="uid + '-note'">
        <span class="emr-field__label">{{ l().note }}</span>
        <textarea class="emr-control caf__note" [id]="uid + '-note'" rows="3" [value]="model().note ?? ''" (input)="intent.emit({ type: 'noteChanged', note: noteValue($event) })"></textarea>
      </label>
      @if (model().submitError; as e) { <div class="emr-alert emr-tone-danger" role="alert"><div>{{ e }}</div></div> }
      <div class="caf__actions">
        <button type="button" class="emr-button emr-button--outline" (click)="intent.emit({ type: 'cancelled' })">{{ l().cancel }}</button>
        <button type="button" class="emr-button" [disabled]="!model().canSubmit" (click)="intent.emit({ type: 'submitRequested' })">{{ l().submit }}</button>
      </div>
    </form>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}
    .caf{display:grid;gap:16px;max-width:640px}
    .caf__title{margin:0;font-size:var(--emr-text-lg)}
    .caf__number{display:grid;gap:8px;justify-items:start}
    .caf__note{resize:vertical;min-height:88px}
    .caf__actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}
  `]
})
export class EmrContactAttemptFormComponent {
  readonly model = input.required<ContactAttemptViewModel>();
  readonly labels = input<Partial<EmrContactAttemptFormLabels>>({});
  readonly intent = output<ContactAttemptIntent>();
  protected readonly uid = `emr-caf-${++nextId}`;
  protected readonly l = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));
  protected readonly numberOpts = computed(() => this.model().numberOptions.map(o => ({ value: o.id, label: o.label })));
  protected readonly channelOpts = computed(() => this.model().channelOptions.map(o => ({ value: o.id, label: o.label })));
  protected readonly outcomeOpts = computed(() => this.model().outcomeOptions.map(o => ({ value: o.id, label: o.label })));
  protected numberLabel(id: string): string { return this.model().numberOptions.find(o => o.id === id)?.label ?? ''; }
  protected noteValue(e: Event): string { return (e.target as HTMLTextAreaElement).value; }
}
