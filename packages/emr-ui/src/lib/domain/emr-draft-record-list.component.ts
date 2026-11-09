import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { DraftRecordListIntent, DraftRecordListViewModel } from '@drguptavivek/emr-controller';
import { EmrRightFlyoutComponent } from './emr-right-flyout.component';

/** Built-in English; the app overrides any of it through the `labels` input. */
const DEFAULT_LABELS = {
  region: 'Draft records',
  open: 'Open',
  move: 'Move to another patient',
  discard: 'Discard',
  updated: 'Updated',
  retry: 'Retry',
  loadingTitle: 'Loading drafts',
  emptyTitle: 'No drafts',
  errorTitle: 'Drafts could not be loaded'
};
export type EmrDraftRecordListLabels = typeof DEFAULT_LABELS;

let nextId = 0;

/** L4 controlled list of offline drafts and sent records. The app decides which actions each row allows and the discard wording. */
@Component({
  selector: 'emr-draft-record-list',
  standalone: true,
  imports: [EmrRightFlyoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="drl" [attr.aria-label]="l().region" [attr.aria-busy]="model().state === 'loading' ? 'true' : null">
      @switch (model().state) {
        @case ('loading') { <div class="emr-empty" role="status"><div><strong>{{ l().loadingTitle }}</strong>@if (model().message) { <div>{{ model().message }}</div> }</div></div> }
        @case ('empty') { <div class="emr-empty" role="status"><div><strong>{{ l().emptyTitle }}</strong>@if (model().message) { <div>{{ model().message }}</div> }</div></div> }
        @case ('error') {
          <div class="emr-empty" role="alert"><div><strong>{{ l().errorTitle }}</strong>@if (model().message) { <div>{{ model().message }}</div> }
            <button type="button" class="emr-button emr-button--small emr-button--outline" (click)="intent.emit({ type: 'retryRequested' })">{{ l().retry }}</button></div></div>
        }
        @default {
          <ul class="drl__list">
            @for (r of model().rows; track r.id) {
              <li class="drl__card">
                <div class="drl__head">
                  <strong class="drl__title">{{ r.title }}</strong>
                  <span class="emr-badge" [class]="'emr-badge emr-tone-' + r.stateBadge.tone">{{ r.stateBadge.label }}</span>
                </div>
                @if (r.subtitle) { <div class="drl__sub">{{ r.subtitle }}</div> }
                <div class="drl__meta">
                  @if (r.patientLabel) { <span>{{ r.patientLabel }}</span> }
                  <span>{{ l().updated }} {{ r.updatedAtLabel }}</span>
                </div>
                @if (r.canOpen || r.canMove || r.canDiscard) {
                  <div class="drl__actions">
                    @if (r.canOpen) { <button type="button" class="emr-button emr-button--small" (click)="intent.emit({ type: 'rowOpened', id: r.id })"><span>{{ l().open }}</span><span class="emr-sr-only"> {{ r.title }}</span></button> }
                    @if (r.canMove) { <button type="button" class="emr-button emr-button--small emr-button--outline" (click)="intent.emit({ type: 'moveToPatientRequested', id: r.id })"><span>{{ l().move }}</span><span class="emr-sr-only"> {{ r.title }}</span></button> }
                    @if (r.canDiscard) { <button type="button" class="emr-button emr-button--small emr-button--outline" (click)="intent.emit({ type: 'discardRequested', id: r.id })"><span>{{ l().discard }}</span><span class="emr-sr-only"> {{ r.title }}</span></button> }
                  </div>
                }
              </li>
            }
          </ul>
        }
      }
    </section>
    <emr-right-flyout [open]="!!model().pendingDiscard" [title]="model().pendingDiscard?.title ?? ''" [headingId]="uid + '-flyout'" [showFooter]="true"
      (closeRequested)="intent.emit({ type: 'discardDismissed' })">
      @if (model().pendingDiscard; as p) {
        <p class="drl__confirm">{{ p.body }}</p>
      }
      <div emrFlyoutFooter class="drl__confirm-actions">
        @if (model().pendingDiscard; as p) {
          <button type="button" class="emr-button emr-button--outline" (click)="intent.emit({ type: 'discardDismissed' })">{{ p.cancelLabel }}</button>
          <button type="button" class="emr-button emr-button--danger" (click)="intent.emit({ type: 'discardConfirmed', id: p.id })">{{ p.confirmLabel }}</button>
        }
      </div>
    </emr-right-flyout>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}
    .drl__list{list-style:none;margin:0;padding:0;display:grid;gap:12px}
    .drl__card{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:12px 16px;display:grid;gap:8px;break-inside:avoid}
    .drl__head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}
    .drl__title{font-size:var(--emr-text-md);overflow-wrap:anywhere}
    .drl__sub{font-size:var(--emr-text-sm)}
    .drl__meta{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:var(--emr-text-xs);color:var(--emr-text-muted)}
    .drl__actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}
    .drl__confirm{margin:0;font-size:var(--emr-text-md);line-height:var(--emr-leading-normal)}
    .drl__confirm-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}
    @media print{.drl__actions{display:none}}
  `]
})
export class EmrDraftRecordListComponent {
  readonly model = input.required<DraftRecordListViewModel>();
  readonly labels = input<Partial<EmrDraftRecordListLabels>>({});
  readonly intent = output<DraftRecordListIntent>();
  protected readonly uid = `emr-drafts-${++nextId}`;
  protected readonly l = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));
}
