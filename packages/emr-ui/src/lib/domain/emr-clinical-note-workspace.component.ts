import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ClinicalNoteWorkspaceIntent, ClinicalNoteWorkspaceViewModel } from '@drguptavivek/emr-controller';

@Component({
  selector: 'emr-clinical-note-workspace',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #signatures let-items>
      @for (signature of items ?? []; track signature.signerId + ':' + signature.purpose) {
        <p class="note__signature">
          {{ signature.purpose === 'co-sign' ? 'Co-signed by' : 'Signed by' }} {{ signature.name }} · {{ signature.role }} · {{ signature.signedAtLabel }}
          @if (signature.verification; as verification) {
            <span>{{ verification.label }}@if (verification.status === 'verified') { · {{ verification.verifiedAtLabel }} }</span>
          }
        </p>
      }
    </ng-template>
    <section class="note" [attr.aria-label]="headingId() ? null : model().title" [attr.aria-labelledby]="headingId()">
      <header class="note__header">
        <div class="note__heading">
          <p class="note__context">{{ model().context }}</p>
          <h2 [attr.id]="headingId()">{{ model().title }}</h2>
          <p class="note__status" role="status">{{ model().status }}</p>
        </div>
        @if (model().metadata.length) {
          <ul class="note__inline-meta">
            @for (item of model().metadata; track $index) { <li>{{ item }}</li> }
          </ul>
        }
        <ng-container [ngTemplateOutlet]="signatures" [ngTemplateOutletContext]="{ $implicit: model().signatures }" />
      </header>

      @if (model().message) { <p class="note__message" role="status">{{ model().message }}</p> }
      @if (model().error) { <p class="note__error" role="alert">{{ model().error }}</p> }

      @if (model().actions.length) {
        <nav class="note__actions note__screen-only" aria-label="Clinical note actions">
          @for (action of model().actions; track action.id) { <button class="note__button" [class.note__button--primary]="action.primary" type="button" (click)="actionRequested(action.id)">{{ action.label }}</button> }
        </nav>
      }

      @if (model().current; as current) {
        <article class="note__document" aria-label="Current note">
          <h3>{{ current.title }}</h3>
          @if (current.metadata.length) { <ul class="note__inline-meta" aria-label="Note attribution">@for (item of current.metadata; track item) { <li>{{ item }}</li> }</ul> }
          <ng-container [ngTemplateOutlet]="signatures" [ngTemplateOutletContext]="{ $implicit: current.signatures }" />
          <div class="note__sections">
            @for (section of current.sections; track section.id) {
              <section class="note__section"><h4>{{ section.label }}</h4><p>{{ section.value || 'Not supplied' }}</p></section>
            }
          </div>
        </article>
      }

      @for (addendum of model().addenda; track addendum.id) {
        <article class="note__addendum" [attr.aria-label]="addendum.title">
          <h3>{{ addendum.title }}</h3>
          @if (addendum.metadata.length) { <ul class="note__inline-meta">@for (item of addendum.metadata; track item) { <li>{{ item }}</li> }</ul> }
          <ng-container [ngTemplateOutlet]="signatures" [ngTemplateOutletContext]="{ $implicit: addendum.signatures }" />
          @for (section of addendum.sections; track section.id) { <section class="note__section"><h4>{{ section.label }}</h4><p>{{ section.value || 'Not supplied' }}</p></section> }
        </article>
      }

      @if (model().review; as review) {
        <article class="note__review" aria-label="Note for review">
          <h3>{{ review.title }}</h3>
          @if (review.metadata.length) { <ul class="note__inline-meta">@for (item of review.metadata; track item) { <li>{{ item }}</li> }</ul> }
          <ng-container [ngTemplateOutlet]="signatures" [ngTemplateOutletContext]="{ $implicit: review.signatures }" />
          @for (section of review.sections; track section.id) { <section class="note__section"><h4>{{ section.label }}</h4><p>{{ section.value || 'Not supplied' }}</p></section> }
        </article>
      }

      @if (model().form; as form) {
        <section class="note__form" [attr.aria-label]="form.title">
          <h3>{{ form.title }}</h3>
          @for (field of form.fields; track field.id) {
            <label class="note__field"><span>{{ field.label }}</span>
              @if (field.multiline) {
                <textarea [value]="field.value" [attr.aria-label]="field.label" rows="4" (input)="fieldChanged(field.id, $event)"></textarea>
              } @else {
                <input [value]="field.value" [attr.aria-label]="field.label" (input)="fieldChanged(field.id, $event)" />
              }
            </label>
          }
          @if (form.actions.length) { <div class="note__actions" aria-label="Draft actions">@for (action of form.actions; track action.id) { <button class="note__button" [class.note__button--primary]="action.primary" type="button" (click)="actionRequested(action.id)">{{ action.label }}</button> }</div> }
        </section>
      }

      <aside class="note__queue note__screen-only" [attr.aria-label]="model().queue.title">
        <h3>{{ model().queue.title }}</h3>
        @if (!model().queue.entries.length) { <p>{{ model().queue.emptyLabel }}</p> }
        @for (entry of model().queue.entries; track entry.id) {
          <article class="note__queue-item"><div><h4>{{ entry.title }}</h4><p>{{ entry.metadata.join(' · ') }}</p>@if (entry.reason) { <p>Reason: {{ entry.reason }}</p> }</div><div class="note__actions">@for (action of entry.actions; track action.id) { <button class="note__button" type="button" (click)="actionRequested(action.id)">{{ action.label }}</button> }</div></article>
        }
      </aside>

      @if (model().history; as history) {
        <section class="note__history note__screen-only" [attr.aria-label]="history.title">
          <h3>{{ history.title }}</h3>
          @if (history.entries.length) {
            <ol class="note__timeline">
              @for (entry of history.entries; track entry.id) {
                <li><div><h4>{{ entry.title }}</h4><p>{{ entry.metadata.join(' · ') }}</p>@if (entry.reason) { <p>Reason: {{ entry.reason }}</p> }</div><div class="note__actions">@for (action of entry.actions; track action.id) { <button class="note__button" type="button" (click)="actionRequested(action.id)">{{ action.label }}</button> }</div></li>
              }
            </ol>
          } @else { <p>No note history recorded.</p> }

          @if (history.snapshot; as snapshot) {
            <article class="note__snapshot"><h4>{{ snapshot.title }}</h4><ul class="note__inline-meta">@for (item of snapshot.metadata; track item) { <li>{{ item }}</li> }</ul><ng-container [ngTemplateOutlet]="signatures" [ngTemplateOutletContext]="{ $implicit: snapshot.signatures }" />@for (section of snapshot.sections; track section.id) { <section class="note__section"><h5>{{ section.label }}</h5><p>{{ section.value || 'Not supplied' }}</p></section> }</article>
          }

          @if (history.comparison; as comparison) {
            <div class="note__comparison" [attr.aria-label]="comparison.title">
              <h4>{{ comparison.title }}</h4><div class="note__comparison-head"><span>Section</span><span>{{ comparison.previousLabel }}</span><span>{{ comparison.currentLabel }}</span></div>
              @for (row of comparison.rows; track row.id) { <div class="note__comparison-row"><strong>{{ row.label }}</strong><span>{{ row.previous ?? 'Section absent' }}</span><span>{{ row.current ?? 'Section absent' }}</span></div> }
              @if (!comparison.rows.length) { <p>No sections changed.</p> }
            </div>
          }
        </section>
      }
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);font-family:var(--emr-font-family)}
    .note{display:grid;gap:16px;min-width:0;border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:20px}
    .note__header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border-bottom:1px solid var(--emr-border);padding-bottom:16px}
    .note__heading h2{margin:3px 0;font-size:var(--emr-text-xl)}.note__context,.note__status{margin:0;color:var(--emr-text-muted);font-size:var(--emr-text-sm)}.note__status{font-weight:var(--emr-weight-bold);color:var(--emr-primary)}
    .note__document,.note__addendum,.note__review,.note__form,.note__queue,.note__history{min-width:0;border:1px solid var(--emr-border);border-radius:10px;background:var(--emr-surface);padding:16px}
    .note__document{background:var(--emr-surface-soft)}.note__addendum{border-inline-start:4px solid var(--emr-info)}.note__review{border-inline-start:4px solid var(--emr-warning)}
    h3{margin:0 0 10px;font-size:var(--emr-text-md)}h4,h5{margin:0 0 4px;font-size:var(--emr-text-sm)}
    .note__inline-meta{display:flex;flex-wrap:wrap;gap:4px 14px;list-style:none;margin:0 0 14px;padding:0;color:var(--emr-text-muted);font-size:var(--emr-text-xs)}
    .note__sections{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:12px 20px}.note__section{min-width:0;break-inside:avoid}.note__section p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font-size:var(--emr-text-sm);line-height:1.55}
    .note__signature{margin:4px 0 8px;font-size:var(--emr-text-sm)}.note__signature span{display:block;color:var(--emr-text-muted)}
    .note__form{display:grid;gap:12px}.note__field{display:grid;gap:5px;font-size:var(--emr-text-sm);font-weight:var(--emr-weight-bold)}.note__field input,.note__field textarea{box-sizing:border-box;width:100%;min-height:var(--emr-control-height);border:1px solid var(--emr-border);border-radius:8px;padding:10px 12px;background:var(--emr-surface);color:var(--emr-text);font:inherit;font-weight:400}.note__field textarea{resize:vertical}.note__field :focus-visible,.note__button:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .note__actions{display:flex;flex-wrap:wrap;gap:8px}.note__button{min-height:var(--emr-control-height);border:1px solid var(--emr-border);border-radius:8px;padding:8px 14px;background:transparent;color:var(--emr-text);font:inherit;font-weight:var(--emr-weight-bold);cursor:pointer}.note__button--primary{background:var(--emr-primary-soft);color:var(--emr-primary-contrast)}
    .note__queue-item{display:flex;justify-content:space-between;align-items:center;gap:14px;border-top:1px solid var(--emr-border);padding:12px 0}.note__queue-item h4,.note__queue-item p{margin:0 0 3px}.note__queue-item p,.note__timeline p{color:var(--emr-text-muted);font-size:var(--emr-text-xs)}
    .note__timeline{list-style:none;margin:0;padding:0 0 0 14px;border-inline-start:2px solid var(--emr-border)}.note__timeline li{position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:0 0 18px 14px;break-inside:avoid}.note__timeline li::before{position:absolute;inset-inline-start:-20px;top:3px;width:9px;height:9px;border-radius:50%;background:var(--emr-primary);content:''}.note__timeline p{margin:3px 0}.note__snapshot,.note__comparison{margin-top:16px;border-top:1px solid var(--emr-border);padding-top:14px}
    .note__comparison-head,.note__comparison-row{display:grid;grid-template-columns:minmax(110px,1fr) repeat(2,minmax(0,2fr));gap:10px;padding:9px 0;border-bottom:1px solid var(--emr-border);font-size:var(--emr-text-sm)}.note__comparison-head{font-weight:var(--emr-weight-bold);color:var(--emr-text-muted)}.note__comparison-row span{white-space:pre-wrap;overflow-wrap:anywhere}
    .note__message,.note__error{margin:0;padding:10px 12px;border-radius:8px;background:var(--emr-info-soft);font-size:var(--emr-text-sm)}.note__error{background:var(--emr-danger-soft);color:var(--emr-danger)}
    @media(max-width:640px){.note{padding:14px}.note__header,.note__queue-item{display:grid}.note__comparison-head,.note__comparison-row{grid-template-columns:minmax(80px,1fr) repeat(2,minmax(0,1.5fr));gap:6px;font-size:var(--emr-text-xs)}}
    @media print{.note{border:0;padding:0;gap:10px}.note__header,.note__document,.note__addendum{break-inside:avoid}.note__document,.note__addendum{background:var(--emr-surface);border:0;border-top:1px solid var(--emr-border);border-radius:0;padding:10px 0}.note__screen-only,.note__form,.note__review,.note__message,.note__error{display:none!important}.note__inline-meta,.note__section p{color:var(--emr-text)}.note__context,.note__status{color:var(--emr-text)}}
    :host-context(.emr-print) .note{border:0;padding:0;gap:10px}
    :host-context(.emr-print) .note__header,:host-context(.emr-print) .note__document,:host-context(.emr-print) .note__addendum{break-inside:avoid}
    :host-context(.emr-print) .note__document,:host-context(.emr-print) .note__addendum{background:var(--emr-surface);border:0;border-top:1px solid var(--emr-border);border-radius:0;padding:10px 0}
    :host-context(.emr-print) .note__screen-only,:host-context(.emr-print) .note__form,:host-context(.emr-print) .note__review,:host-context(.emr-print) .note__message,:host-context(.emr-print) .note__error{display:none!important}
    :host-context(.emr-print) .note__inline-meta,:host-context(.emr-print) .note__section p,:host-context(.emr-print) .note__context,:host-context(.emr-print) .note__status{color:var(--emr-text)}
  `]
})
export class EmrClinicalNoteWorkspaceComponent {
  readonly model = input.required<ClinicalNoteWorkspaceViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<ClinicalNoteWorkspaceIntent>();

  actionRequested(actionId: string): void {
    const { actions, form, queue, history } = this.model();
    const available = [
      ...actions,
      ...(form?.actions ?? []),
      ...queue.entries.flatMap(entry => entry.actions),
      ...(history?.entries.flatMap(entry => entry.actions) ?? [])
    ];
    if (available.some(action => action.id === actionId)) this.intent.emit({ type: 'actionRequested', actionId });
  }

  fieldChanged(fieldId: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const field = this.model().form?.fields.find(candidate => candidate.id === fieldId);
    if (!field) return;
    const requested = target.value;
    this.intent.emit({ type: 'fieldChanged', fieldId, value: requested });
    queueMicrotask(() => {
      const accepted = this.model().form?.fields.find(candidate => candidate.id === fieldId)?.value;
      if (accepted !== undefined && target.isConnected && target.value === requested && accepted !== requested) {
        target.value = accepted;
      }
    });
  }
}
