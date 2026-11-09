import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { MergeCompareIntent, MergeCompareViewModel, MergeSourceView } from '@drguptavivek/emr-controller';

/** Built-in English; the app overrides any of it through the `labels` input. */
const DEFAULT_LABELS = {
  region: 'Compare records',
  survivor: 'Keep as surviving record',
  field: 'Field',
  differs: '≠ Differs',
  same: 'Same',
  use: 'Use',
  confirm: 'Confirm merge',
  reject: 'Reject',
  cancel: 'Cancel'
};
export type EmrMergeCompareLabels = typeof DEFAULT_LABELS;

let nextId = 0;

/**
 * L4 controlled comparison of 2–4 patient records. Whether a row differs, which value wins and
 * whether the merge may be confirmed are the app's decisions; values are never compared here.
 * Wide containers show a table; narrow ones stack one card per row.
 */
@Component({
  selector: 'emr-merge-compare',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc" [attr.aria-label]="l().region">
      <div class="mc__table-wrap">
        <table class="mc__table">
          <thead>
            <tr>
              <th scope="col">{{ l().field }}</th>
              @for (s of model().sources; track s.id) {
                <th scope="col">
                  <div class="mc__who">
                    <strong>{{ s.label ? s.label + ': ' : '' }}{{ s.name }}</strong>
                    <span>{{ identity(s) }}</span>
                  </div>
                  <label class="mc__radio"><input type="radio" [name]="uid + '-survivor'" [checked]="model().survivorSourceId === s.id"
                    (change)="intent.emit({ type: 'survivorChosen', sourceId: s.id })" /><span>{{ l().survivor }}</span></label>
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (r of model().rows; track r.id) {
              <tr [class.mc__row--differs]="r.differs">
                <th scope="row">{{ r.label }}<span class="emr-badge" [class]="r.differs ? 'emr-badge emr-tone-warning' : 'emr-badge emr-tone-neutral'">{{ r.differs ? l().differs : l().same }}</span></th>
                @for (s of model().sources; track s.id) {
                  <td>
                    <div>{{ r.values[s.id] }}</div>
                    @if (r.differs) {
                      <label class="mc__radio"><input type="radio" [name]="uid + '-t-' + r.id" [checked]="r.chosenSourceId === s.id"
                        (change)="intent.emit({ type: 'fieldChosen', rowId: r.id, sourceId: s.id })" /><span>{{ l().use }}<span class="emr-sr-only"> {{ r.label }}: {{ s.label || s.name }}</span></span></label>
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="mc__cards">
        <div class="mc__card mc__card--sources">
          @for (s of model().sources; track s.id) {
            <label class="mc__radio mc__radio--block"><input type="radio" [name]="uid + '-c-survivor'" [checked]="model().survivorSourceId === s.id"
              (change)="intent.emit({ type: 'survivorChosen', sourceId: s.id })" /><span><strong>{{ s.label ? s.label + ': ' : '' }}{{ s.name }}</strong><br />{{ identity(s) }}<br />{{ l().survivor }}</span></label>
          }
        </div>
        @for (r of model().rows; track r.id) {
          <div class="mc__card" role="group" [attr.aria-label]="r.label">
            <div class="mc__card-head"><strong>{{ r.label }}</strong>
              <span class="emr-badge" [class]="r.differs ? 'emr-badge emr-tone-warning' : 'emr-badge emr-tone-neutral'">{{ r.differs ? l().differs : l().same }}</span></div>
            @for (s of model().sources; track s.id) {
              @if (r.differs) {
                <label class="mc__radio mc__radio--block"><input type="radio" [name]="uid + '-c-' + r.id" [checked]="r.chosenSourceId === s.id"
                  (change)="intent.emit({ type: 'fieldChosen', rowId: r.id, sourceId: s.id })" /><span>{{ s.label || s.name }}: {{ r.values[s.id] }} <span class="mc__use">({{ l().use }})</span></span></label>
              } @else if ($first) {
                <div>{{ r.values[s.id] }}</div>
              }
            }
          </div>
        }
      </div>
      <div class="mc__actions">
        <button type="button" class="emr-button emr-button--outline" (click)="intent.emit({ type: 'cancelled' })">{{ l().cancel }}</button>
        <button type="button" class="emr-button emr-button--outline" (click)="intent.emit({ type: 'rejected' })">{{ l().reject }}</button>
        <button type="button" class="emr-button" [disabled]="!model().canConfirm" (click)="intent.emit({ type: 'mergeConfirmed' })">{{ l().confirm }}</button>
      </div>
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);container-type:inline-size}
    .mc{display:grid;gap:16px}
    .mc__table-wrap{overflow-x:auto}
    .mc__table{width:100%;border-collapse:collapse;font-size:var(--emr-text-sm)}
    .mc__table th,.mc__table td{border:1px solid var(--emr-border);padding:8px 12px;text-align:left;vertical-align:top;overflow-wrap:anywhere}
    .mc__table thead th{background:var(--emr-surface-slate)}
    .mc__row--differs th,.mc__row--differs td{background:var(--emr-warning-soft)}
    .mc__who{display:grid;gap:2px;margin-bottom:8px;font-weight:var(--emr-weight-regular)}
    .mc__who strong{font-weight:var(--emr-weight-bold)}
    .mc__radio{display:inline-flex;align-items:center;gap:8px;min-height:44px;cursor:pointer;font-weight:var(--emr-weight-regular)}
    .mc__radio input{width:24px;height:24px;flex:none;margin:0}
    .mc__radio input:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .mc__radio--block{display:flex}
    .mc__use{color:var(--emr-text-muted)}
    .mc__cards{display:none;gap:12px}
    .mc__card{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:12px 16px;display:grid;gap:4px}
    .mc__card-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}
    .mc__actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}
    @container (max-width:720px){
      .mc__table-wrap{display:none}
      .mc__cards{display:grid}
    }
    @media print{.mc__actions{display:none}}
  `]
})
export class EmrMergeCompareComponent {
  readonly model = input.required<MergeCompareViewModel>();
  readonly labels = input<Partial<EmrMergeCompareLabels>>({});
  readonly intent = output<MergeCompareIntent>();
  protected readonly uid = `emr-merge-${++nextId}`;
  protected readonly l = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));
  /** Compact identity: primary identifier, then age · sex. */
  protected identity(s: MergeSourceView): string {
    const id = s.identifiers[0];
    return [id ? `${id.label} ${id.display}` : '', `${s.ageLabel} · ${s.sexLabel}`].filter(Boolean).join(' · ');
  }
}
