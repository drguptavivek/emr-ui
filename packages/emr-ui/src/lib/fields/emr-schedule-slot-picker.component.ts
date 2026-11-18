import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { DoseSlot } from '@drguptavivek/emr-controller';
import { applySlotPreset, setSlotAmount, toggleSlot } from './schedule-slot.logic';
import type { ScheduleAmountMode, ScheduleSlotDefinition, ScheduleSlotPreset, ScheduleSlotSeed } from '@drguptavivek/emr-controller';

let nextSlotPickerId = 0;

interface SlotRow {
  readonly definition: ScheduleSlotDefinition;
  readonly slot: DoseSlot | undefined;
}

/**
 * Input half of `emr-dose-schedule`: ticks dose slots and sets an amount per slot, emitting a new
 * `DoseSlot[]` in `slots` order (unticked slots omitted). It never derives frequency text, totals or
 * presets from the selection; the controller does that from the emitted value.
 */
@Component({
  selector: 'emr-schedule-slot-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset
      class="ssp"
      [id]="id()"
      [attr.aria-invalid]="error() ? 'true' : null"
      [attr.aria-required]="required() ? 'true' : null"
      [attr.aria-describedby]="describedBy()"
    >
      <legend class="ssp__legend">
        {{ label() }}
        @if (required()) { <span class="ssp__required" aria-hidden="true">*</span><span class="emr-sr-only">Required</span> }
      </legend>

      @if (presets().length && !readOnly()) {
        <div class="ssp__presets" role="group" [attr.aria-label]="label() + ' presets'">
          @for (preset of presets(); track preset.id) {
            <button type="button" class="emr-button emr-button--outline emr-button--small ssp__preset" [attr.aria-pressed]="isActive(preset)" (click)="applyPreset(preset)">
              @if (isActive(preset)) {
                <svg class="ssp__tick" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                </svg>
              }
              {{ preset.label }}
            </button>
          }
        </div>
      }

      <ul class="ssp__slots">
        @for (row of rows(); track row.definition.id) {
          <li class="ssp__slot" [class.ssp__slot--on]="row.slot">
            @if (readOnly()) {
              <span class="ssp__name">{{ row.definition.label }}
                @if (row.definition.timeHint) { <span class="ssp__time">{{ row.definition.timeHint }}</span> }
              </span>
              <span class="ssp__readout">{{ row.slot ? readout(row.slot) : 'Not selected' }}</span>
            } @else {
              <label class="ssp__toggle" [for]="id() + '-' + row.definition.id">
                <input type="checkbox" class="ssp__check" [id]="id() + '-' + row.definition.id" [checked]="!!row.slot" (change)="toggle(row.definition.id, $event)" />
                <span class="ssp__name">{{ row.definition.label }}
                  @if (row.definition.timeHint) { <span class="ssp__time">{{ row.definition.timeHint }}</span> }
                </span>
              </label>
              @if (row.slot; as slot) {
                <span class="ssp__amount">
                  @if (amountMode() === 'numeric') {
                    <input class="emr-control ssp__amount-input" type="number" inputmode="decimal" min="0" step="any"
                      [id]="id() + '-' + row.definition.id + '-amount'" [value]="slot.amount ?? ''"
                      [attr.aria-label]="row.definition.label + ' amount' + (unitLabel() ? ' in ' + unitLabel() : '')"
                      (input)="numericAmount(row.definition.id, $event)" />
                    @if (unitLabel()) { <span class="ssp__unit" aria-hidden="true">{{ unitLabel() }}</span> }
                  } @else {
                    <input class="emr-control ssp__amount-input ssp__amount-input--label" type="text"
                      [id]="id() + '-' + row.definition.id + '-amount'" [value]="slot.amountLabel ?? ''"
                      [attr.aria-label]="row.definition.label + ' amount'"
                      (input)="labelAmount(row.definition.id, $event)" />
                  }
                </span>
              }
            }
          </li>
        }
      </ul>

      <div class="ssp__messages" aria-live="polite">
        @if (hint()) {
          <span class="emr-field__hint" [id]="hintId()">{{ hint() }}</span>
        }
        @if (error()) {
          <span class="emr-field__error" role="alert" [id]="errorId()">Error: {{ error() }}</span>
        }
      </div>
    </fieldset>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);font-family:var(--emr-font-family)}
    .ssp{display:grid;gap:10px;min-width:0;margin:0;padding:0;border:0}
    .ssp__legend{padding:0;margin-bottom:6px;font-size:var(--emr-text-sm);font-weight:var(--emr-weight-bold)}
    .ssp__required{margin-left:2px;color:var(--emr-danger)}
    .ssp__presets{display:flex;flex-wrap:wrap;gap:6px}
    .ssp__preset{min-height:44px;min-width:44px;background:var(--emr-surface);color:var(--emr-text);border:1px solid var(--emr-border)}
    .ssp__preset[aria-pressed="true"]{background:var(--emr-primary-soft);border-color:var(--emr-primary);color:var(--emr-primary-contrast);border-width:2px;font-weight:var(--emr-weight-bold)}
    .ssp__tick{margin-right:4px;flex:0 0 auto}
    .ssp__slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr));gap:8px;margin:0;padding:0;list-style:none}
    .ssp__slot{display:grid;align-content:start;gap:6px;min-width:0;padding:4px 10px 8px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface)}
    .ssp__slot--on{border-color:var(--emr-primary-border);background:var(--emr-surface-soft)}
    .ssp__toggle{display:flex;align-items:center;gap:10px;min-height:44px;cursor:pointer}
    .ssp__check{flex:0 0 auto;width:20px;height:20px;margin:0;accent-color:var(--emr-primary)}
    .ssp__check:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .ssp__name{display:grid;font-size:var(--emr-text-md);font-weight:var(--emr-weight-medium);line-height:var(--emr-leading-tight);overflow-wrap:anywhere}
    .ssp__time{font-size:var(--emr-text-xs);font-weight:var(--emr-weight-regular);color:var(--emr-text-muted)}
    .ssp__readout{font-size:var(--emr-text-md);overflow-wrap:anywhere}
    .ssp__amount{display:flex;align-items:center;gap:6px;min-width:0}
    .ssp__amount-input{width:6em;min-width:0}
    .ssp__amount-input--label{width:100%}
    .ssp__unit{font-size:var(--emr-text-sm);color:var(--emr-text-muted);overflow-wrap:anywhere}
    .ssp__messages:empty{display:none}
  `],
})
export class EmrScheduleSlotPickerComponent {
  readonly controlId = input<string>();
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly required = input(false);
  readonly readOnly = input(false);
  readonly value = input<readonly DoseSlot[] | null>(null);
  /** Available slots in display order: the four standard slots, hourly slots, or a single 'PRN'. */
  readonly slots = input.required<readonly ScheduleSlotDefinition[]>();
  /** Shown after numeric amounts, e.g. 'tablets'. Controller-supplied; never pluralised here. */
  readonly unitLabel = input<string>();
  readonly amountMode = input<ScheduleAmountMode>('numeric');
  readonly presets = input<readonly ScheduleSlotPreset[]>([]);
  /** Amount a newly ticked slot starts with in `numeric` mode. */
  readonly defaultAmount = input(1);
  /** Text a newly ticked slot starts with in `label` mode, e.g. 'thin layer'. */
  readonly defaultAmountLabel = input('');

  readonly valueChange = output<readonly DoseSlot[]>();

  private readonly fallbackId = `emr-schedule-slot-picker-${++nextSlotPickerId}`;
  readonly id = computed(() => this.controlId() ?? this.fallbackId);
  readonly hintId = computed(() => `${this.id()}-hint`);
  readonly errorId = computed(() => `${this.id()}-error`);
  readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint()) ids.push(this.hintId());
    if (this.error()) ids.push(this.errorId());
    return ids.length ? ids.join(' ') : null;
  });

  readonly rows = computed<readonly SlotRow[]>(() => {
    const byId = new Map((this.value() ?? []).map((slot) => [slot.id, slot]));
    return this.slots().map((definition) => ({ definition, slot: byId.get(definition.id) }));
  });

  private readonly ticked = computed(() => new Set((this.value() ?? []).map((slot) => slot.id)));

  /** Mechanical set equality, used only for `aria-pressed`; it says nothing about clinical frequency. */
  isActive(preset: ScheduleSlotPreset): boolean {
    const ticked = this.ticked();
    return ticked.size === new Set(preset.slotIds).size && preset.slotIds.every((id) => ticked.has(id));
  }

  readout(slot: DoseSlot): string {
    if (slot.amountLabel) return slot.amountLabel;
    if (slot.amount === null) return 'Selected, no amount';
    return this.unitLabel() ? `${slot.amount} ${this.unitLabel()}` : String(slot.amount);
  }

  toggle(slotId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.valueChange.emit(toggleSlot(this.value(), this.slots(), slotId, checked, this.seed()));
  }

  applyPreset(preset: ScheduleSlotPreset): void {
    this.valueChange.emit(applySlotPreset(this.value(), this.slots(), preset, this.seed()));
  }

  numericAmount(slotId: string, event: Event): void {
    const field = event.target as HTMLInputElement;
    // Mid-typing states such as '0.' read as '' with badInput set; emitting null would wipe the field.
    if (field.validity.badInput) return;
    const text = field.value.trim();
    const amount = text !== '' && Number.isFinite(Number(text)) ? Number(text) : null;
    this.valueChange.emit(setSlotAmount(this.value(), this.slots(), slotId, { amount }));
  }

  labelAmount(slotId: string, event: Event): void {
    const amountLabel = (event.target as HTMLInputElement).value;
    this.valueChange.emit(setSlotAmount(this.value(), this.slots(), slotId, { amount: null, amountLabel }));
  }

  private seed(): ScheduleSlotSeed {
    return this.amountMode() === 'numeric' ? { amount: this.defaultAmount() } : { amount: null, amountLabel: this.defaultAmountLabel() };
  }
}
