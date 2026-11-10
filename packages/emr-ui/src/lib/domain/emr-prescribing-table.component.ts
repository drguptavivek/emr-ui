import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type {
  DoseForm,
  PrescribingRow,
  PrescribingTableIntent,
  PrescribingTableViewModel,
} from '@drguptavivek/emr-controller';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';
import { EmrButtonComponent } from '../primitives/emr-button.component';

/**
 * L4. Multi-row clinical prescribing table (`emr-prescribing-table`).
 * Renders a controlled prescription grid with per-row move up (`↑`), move down (`↓`),
 * insert below (`+`), remove (`−`), inline slot dose steppers (`−` / `+`), quick frequency
 * presets, duration stepper (`−` / `+`), eye site pills, and an expandable taper schedule.
 */
@Component({
  selector: 'emr-prescribing-table',
  standalone: true,
  imports: [EmrBadgeComponent, EmrButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rx-table" [attr.aria-labelledby]="headingId() ?? 'emr-rx-table-title'">
      <header class="rx-table__header">
        <div class="rx-table__title-group">
          <span class="rx-table__badge" aria-hidden="true">Rx</span>
          <div>
            <h3 class="rx-table__title" [id]="headingId() ?? 'emr-rx-table-title'">
              {{ model().title ?? 'Medication Prescribing Table' }}
            </h3>
            <p class="rx-table__subtitle">
              Use − / + to step doses &amp; duration, and ↑ / ↓ / + / − to reorder or remove rows.
            </p>
          </div>
        </div>

        <div class="rx-table__actions">
          @if (model().favourites?.length && !model().readOnly) {
            <div class="rx-table__favs" role="group" aria-label="Favourite order sets">
              @for (fav of model().favourites!; track fav.id) {
                <button
                  type="button"
                  class="emr-button emr-button--outline emr-button--small"
                  (click)="intent.emit({ type: 'favouriteApplied', favouriteId: fav.id })"
                >
                  + {{ fav.label }}
                </button>
              }
            </div>
          }
          @if (model().status; as st) {
            <emr-badge [tone]="st.tone">{{ st.label }}</emr-badge>
          }
        </div>
      </header>

      <div class="rx-table__scroll">
        <table class="rx-table__grid">
          <thead>
            <tr>
              <th scope="col">Drug Name &amp; Strength</th>
              <th scope="col">Dose (Qty &amp; Unit)</th>
              <th scope="col">Frequency (OD/BD/TDS/HS/SOS · M–A–E–N)</th>
              <th scope="col">Route &amp; Site</th>
              <th scope="col">Duration (− / +)</th>
              <th scope="col">Spcl Instructions</th>
              <th scope="col">+ / − / ↑ / ↓</th>
            </tr>
          </thead>
          <tbody>
            @for (row of model().rows; track row.id; let idx = $index; let first = $first; let last = $last) {
              <tr class="rx-table__row">
                <td class="rx-table__cell-drug">
                  <div class="rx-table__drug-inputs">
                    <span class="rx-table__num">{{ idx + 1 }}</span>
                    <input
                      type="text"
                      class="emr-control"
                      [value]="row.drugName"
                      [readOnly]="!!model().readOnly"
                      placeholder="Search or type medicine…"
                      [attr.aria-label]="'Row ' + (idx + 1) + ' medicine name'"
                      (input)="onDrugInput(row.id, $event)"
                    />
                    <input
                      type="text"
                      class="emr-control rx-table__strength"
                      [value]="row.strength"
                      [readOnly]="!!model().readOnly"
                      placeholder="500 mg"
                      [attr.aria-label]="'Row ' + (idx + 1) + ' strength'"
                      (input)="onStrengthInput(row.id, $event)"
                    />
                  </div>
                </td>

                <td class="rx-table__cell-dose">
                  <div class="rx-table__stepper">
                    @if (!model().readOnly) {
                      <button
                        type="button"
                        class="rx-table__step-btn"
                        [attr.aria-label]="'Decrease dose for row ' + (idx + 1)"
                        (click)="intent.emit({ type: 'doseStepped', rowId: row.id, delta: stepFor(row.form) * -1 })"
                      >−</button>
                    }
                    <span class="rx-table__step-val">{{ row.doseAmount ?? 1 }}{{ row.unitLabel ? ' ' + row.unitLabel : '' }}</span>
                    @if (!model().readOnly) {
                      <button
                        type="button"
                        class="rx-table__step-btn"
                        [attr.aria-label]="'Increase dose for row ' + (idx + 1)"
                        (click)="intent.emit({ type: 'doseStepped', rowId: row.id, delta: stepFor(row.form) })"
                      >+</button>
                    }
                  </div>
                </td>

                <td class="rx-table__cell-frequency">
                  @if (model().presets?.length && !model().readOnly) {
                    <div class="rx-table__presets">
                      @for (preset of model().presets!; track preset.id) {
                        <button
                          type="button"
                          class="rx-table__pill"
                          [attr.aria-pressed]="row.frequencyCode?.toLowerCase() === preset.id.toLowerCase()"
                          (click)="intent.emit({ type: 'presetApplied', rowId: row.id, presetId: preset.id })"
                        >{{ preset.label }}</button>
                      }
                      @if (row.patternLabel) {
                        <span class="rx-table__pattern">{{ row.patternLabel }}</span>
                      }
                    </div>
                  }
                  <div class="rx-table__slots">
                    @for (def of model().slotDefinitions; track def.id) {
                      <div class="rx-table__slot">
                        <span class="rx-table__slot-label">{{ def.shortLabel ?? def.label }}</span>
                        <div class="rx-table__stepper">
                          @if (!model().readOnly) {
                            <button
                              type="button"
                              class="rx-table__step-btn"
                              [attr.aria-label]="'Decrease ' + def.label + ' dose'"
                              (click)="intent.emit({ type: 'slotStepped', rowId: row.id, slotId: def.id, delta: stepFor(row.form) * -1 })"
                            >−</button>
                          }
                          <span class="rx-table__step-val">{{ slotAmount(row, def.id) }}</span>
                          @if (!model().readOnly) {
                            <button
                              type="button"
                              class="rx-table__step-btn"
                              [attr.aria-label]="'Increase ' + def.label + ' dose'"
                              (click)="intent.emit({ type: 'slotStepped', rowId: row.id, slotId: def.id, delta: stepFor(row.form) })"
                            >+</button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </td>

                <td class="rx-table__cell-route">
                  <span class="rx-table__pattern">{{ row.route }}</span>
                </td>

                <td class="rx-table__cell-duration">
                  <div class="rx-table__stepper">
                    @if (!model().readOnly) {
                      <button
                        type="button"
                        class="rx-table__step-btn"
                        [attr.aria-label]="'Decrease duration for row ' + (idx + 1)"
                        (click)="intent.emit({ type: 'durationStepped', rowId: row.id, delta: -1 })"
                      >−</button>
                    }
                    <span class="rx-table__step-val">{{ row.durationCount ?? '—' }} {{ row.durationUnit }}</span>
                    @if (!model().readOnly) {
                      <button
                        type="button"
                        class="rx-table__step-btn"
                        [attr.aria-label]="'Increase duration for row ' + (idx + 1)"
                        (click)="intent.emit({ type: 'durationStepped', rowId: row.id, delta: 1 })"
                      >+</button>
                    }
                  </div>
                </td>

                <td class="rx-table__cell-timing">
                  <div class="rx-table__timing-row">
                    <input
                      type="text"
                      class="emr-control"
                      [value]="row.instructions"
                      [readOnly]="!!model().readOnly"
                      placeholder="Spcl instructions…"
                      [attr.aria-label]="'Row ' + (idx + 1) + ' instructions'"
                      (input)="onInstructionsInput(row.id, $event)"
                    />
                    <button
                      type="button"
                      class="rx-table__pill"
                      [attr.aria-pressed]="!!row.taperExpanded"
                      (click)="intent.emit({ type: 'taperToggleRequested', rowId: row.id })"
                    >Taper</button>
                  </div>
                </td>

                <td class="rx-table__cell-order">
                  @if (!model().readOnly) {
                    <div class="rx-table__btn-row">
                      <button
                        type="button"
                        class="rx-table__icon-btn"
                        [attr.aria-label]="'Insert medicine below row ' + (idx + 1)"
                        (click)="intent.emit({ type: 'rowAddRequested', afterRowId: row.id })"
                      >+</button>
                      <button
                        type="button"
                        class="rx-table__icon-btn rx-table__icon-btn--danger"
                        [disabled]="model().rows.length <= 1"
                        [attr.aria-label]="'Remove row ' + (idx + 1)"
                        (click)="intent.emit({ type: 'rowRemoveRequested', rowId: row.id })"
                      >−</button>
                      <button
                        type="button"
                        class="rx-table__icon-btn"
                        [disabled]="first"
                        [attr.aria-label]="'Move row ' + (idx + 1) + ' up'"
                        (click)="intent.emit({ type: 'rowMoveRequested', rowId: row.id, direction: 'up' })"
                      >↑</button>
                      <button
                        type="button"
                        class="rx-table__icon-btn"
                        [disabled]="last"
                        [attr.aria-label]="'Move row ' + (idx + 1) + ' down'"
                        (click)="intent.emit({ type: 'rowMoveRequested', rowId: row.id, direction: 'down' })"
                      >↓</button>
                    </div>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <footer class="rx-table__footer">
        @if (!model().readOnly) {
          <emr-button variant="secondary" (clicked)="intent.emit({ type: 'rowAddRequested' })">
            + Add medicine row
          </emr-button>
        }
        @if (!model().readOnly && model().canSign) {
          <emr-button (clicked)="intent.emit({ type: 'signRequested' })">
            Sign prescription
          </emr-button>
        }
        @if (!model().readOnly && model().canAmend) {
          <emr-button variant="outline" (clicked)="intent.emit({ type: 'amendRequested' })">
            Amend prescription
          </emr-button>
        }
      </footer>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .rx-table { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; }
    .rx-table__header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); }
    .rx-table__title-group { display: flex; align-items: center; gap: 12px; }
    .rx-table__badge { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: var(--emr-primary); color: var(--emr-surface); font-family: var(--emr-font-mono); font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .rx-table__title { margin: 0; font-size: var(--emr-text-lg); font-weight: var(--emr-weight-bold); }
    .rx-table__subtitle { margin: 2px 0 0; font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
    .rx-table__actions, .rx-table__favs { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
    .rx-table__scroll { overflow-x: auto; }
    .rx-table__grid { width: 100%; border-collapse: collapse; min-width: 920px; }
    .rx-table__grid th { text-align: left; padding: 8px 12px; font-size: var(--emr-text-xs); color: var(--emr-text-muted); background: var(--emr-surface-raised); border-bottom: 1px solid var(--emr-border); }
    .rx-table__row td { padding: 10px 12px; border-bottom: 1px solid var(--emr-border); vertical-align: top; }
    .rx-table__num { display: inline-flex; align-items: center; justify-content: center; min-width: 26px; height: 24px; border-radius: 6px; background: var(--emr-primary-soft); color: var(--emr-primary-contrast); font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); margin-bottom: 6px; }
    .rx-table__btn-row { display: flex; gap: 4px; }
    .rx-table__icon-btn { width: 28px; height: 28px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); cursor: pointer; font-size: var(--emr-text-xs); }
    .rx-table__icon-btn--danger { border-color: var(--emr-danger); color: var(--emr-danger); }
    .rx-table__drug-inputs { display: flex; gap: 6px; }
    .rx-table__strength { width: 88px; font-family: var(--emr-font-mono); }
    .rx-table__presets { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-bottom: 6px; }
    .rx-table__pill { padding: 2px 8px; min-height: 26px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font-size: var(--emr-text-xs); cursor: pointer; }
    .rx-table__pill[aria-pressed="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary-contrast); }
    .rx-table__pattern { padding: 2px 8px; border: 1px solid var(--emr-primary-border); border-radius: 6px; background: var(--emr-surface-soft); font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); }
    .rx-table__slots { display: flex; gap: 6px; }
    .rx-table__slot { flex: 1; border: 1px solid var(--emr-border); border-radius: 6px; padding: 4px; background: var(--emr-surface-soft); }
    .rx-table__slot-label { display: block; font-size: var(--emr-text-2xs); color: var(--emr-text-muted); margin-bottom: 4px; }
    .rx-table__stepper { display: flex; align-items: center; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); overflow: hidden; height: 30px; }
    .rx-table__step-btn { width: 26px; height: 100%; border: 0; background: var(--emr-surface-soft); color: var(--emr-text); cursor: pointer; font-size: var(--emr-text-sm); }
    .rx-table__step-val { flex: 1; text-align: center; font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); padding: 0 4px; }
    .rx-table__timing-row { display: flex; gap: 6px; align-items: center; }
    .rx-table__footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding: 12px 16px; background: var(--emr-surface-soft); }
  `],
})
export class EmrPrescribingTableComponent {
  readonly model = input.required<PrescribingTableViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<PrescribingTableIntent>();

  stepFor(form: DoseForm): number {
    return form === 'tablet' ? 0.5 : 1;
  }

  slotAmount(row: PrescribingRow, slotId: string): string {
    const n = row.slots.find((s) => s.id === slotId)?.amount ?? 0;
    if (n <= 0) return '0';
    if (n === 0.5) return '½';
    return String(n);
  }

  onDrugInput(rowId: string, event: Event): void {
    this.intent.emit({ type: 'drugNameChanged', rowId, drugName: (event.target as HTMLInputElement).value });
  }

  onStrengthInput(rowId: string, event: Event): void {
    this.intent.emit({ type: 'strengthChanged', rowId, strength: (event.target as HTMLInputElement).value });
  }

  onInstructionsInput(rowId: string, event: Event): void {
    this.intent.emit({ type: 'instructionsChanged', rowId, instructions: (event.target as HTMLInputElement).value });
  }
}
