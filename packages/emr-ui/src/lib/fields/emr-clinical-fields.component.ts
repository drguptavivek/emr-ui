import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import type {
  AddressFieldIntent,
  AddressFieldViewModel,
  EmrAddressValue,
  EmrPhoneChannel,
  EmrSegmentedOption,
  MacroTextFieldIntent,
  MacroTextFieldViewModel,
  PhoneFieldIntent,
  PhoneFieldViewModel,
} from '@drguptavivek/emr-controller';
import { EmrSegmentedControlComponent } from '../primitives/emr-action-controls.component';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';
import { EmrFieldFrameComponent } from './emr-field-frame.component';
import { extractActiveMacroTrigger } from './typed-field.logic';

let nextClinicalFieldId = 0;

const CLINICAL_FIELD_STYLES = `
  :host {
    display: block;
    min-width: 0;
  }
  .clf-stack {
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  .clf-sub {
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
    color: var(--emr-text-muted);
  }
`;

// ─────────────────────────────────────────────────────────────
// 8. EmrPhoneInputComponent
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'emr-phone-input',
  standalone: true,
  imports: [EmrFieldFrameComponent, EmrBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <emr-field-frame
      [label]="m.label"
      [controlId]="resolvedId()"
      [required]="!!m.required"
      [hint]="m.hint"
      [messages]="m.messages ?? []"
    >
      <div class="clf-stack">
        <div class="ph-row">
          <select
            #countrySelect
            class="emr-select ph-country"
            [attr.aria-label]="m.label + ' country code'"
            [attr.aria-readonly]="m.readOnly || null"
            [value]="m.countryCode"
            (change)="onCountryChange($event)"
            (blur)="syncDom()"
          >
            @for (opt of m.countryOptions; track opt.code) {
              <option [value]="opt.code" [selected]="opt.code === m.countryCode">
                {{ opt.label }}
              </option>
            }
          </select>

          <input
            #numberInput
            class="emr-control ph-number"
            type="tel"
            inputmode="tel"
            autocomplete="tel-national"
            [id]="resolvedId()"
            [value]="m.nationalNumber"
            [required]="!!m.required"
            [readOnly]="!!m.readOnly"
            [attr.aria-invalid]="hasError() ? 'true' : null"
            [attr.aria-describedby]="describedBy()"
            (input)="onNumberInput($event)"
            (blur)="syncDom()"
          />

          @if (m.extension !== undefined) {
            <input
              #extInput
              class="emr-control ph-ext"
              type="text"
              placeholder="Ext."
              [value]="m.extension"
              [readOnly]="!!m.readOnly"
              [attr.aria-label]="m.label + ' extension'"
              (input)="onExtensionInput($event)"
              (blur)="syncDom()"
            />
          }

          @if (m.verifiedBadge; as badge) {
            <emr-badge [tone]="badge.tone">{{ badge.label }}</emr-badge>
          }
        </div>

        @if (m.availableChannels?.length) {
          <div class="ph-channels" role="group" [attr.aria-label]="m.label + ' messaging channels'">
            @for (ch of m.availableChannels; track ch.id) {
              <label class="emr-checkbox">
                <input
                  #channelCheck
                  type="checkbox"
                  [value]="ch.id"
                  [checked]="hasChannel(ch.id)"
                  [attr.aria-readonly]="m.readOnly || null"
                  (click)="guardReadOnlyClick($event)"
                  (change)="onChannelToggle(ch.id)"
                />
                <span>{{ ch.label }}</span>
              </label>
            }
          </div>
        }
      </div>
    </emr-field-frame>
  `,
  styles: [
    CLINICAL_FIELD_STYLES,
    `
      .ph-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .ph-country {
        width: auto;
        min-width: 110px;
        flex: 0 0 auto;
      }
      .ph-number {
        flex: 1 1 160px;
        min-width: 0;
      }
      .ph-ext {
        width: 96px;
        flex: 0 0 auto;
      }
      .ph-channels {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 16px;
      }
    `,
  ],
})
export class EmrPhoneInputComponent implements AfterViewChecked {
  readonly model = input.required<PhoneFieldViewModel>();
  readonly controlId = input<string>();
  readonly intent = output<PhoneFieldIntent>();

  private readonly fallbackId = `emr-phone-input-${++nextClinicalFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly hasError = computed(() =>
    Boolean(this.model().messages?.some((m) => m.severity === 'error')),
  );
  protected readonly describedBy = computed(() => {
    const m = this.model();
    return m.hint || (m.messages && m.messages.length > 0)
      ? `${this.resolvedId()}-message`
      : null;
  });

  private readonly countryRef = viewChild<ElementRef<HTMLSelectElement>>('countrySelect');
  private readonly numberRef = viewChild<ElementRef<HTMLInputElement>>('numberInput');
  private readonly extRef = viewChild<ElementRef<HTMLInputElement>>('extInput');
  private readonly channelRefs = viewChildren<ElementRef<HTMLInputElement>>('channelCheck');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected hasChannel(channel: EmrPhoneChannel): boolean {
    return (this.model().channels ?? []).includes(channel);
  }

  protected guardReadOnlyClick(event: MouseEvent): void {
    if (this.model().readOnly) {
      event.preventDefault();
      this.syncDom();
    }
  }

  protected onCountryChange(event: Event): void {
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    const countryCode = (event.target as HTMLSelectElement).value;
    this.scheduleSync();
    this.intent.emit({ type: 'countryCodeChangeRequested', countryCode });
  }

  protected onNumberInput(event: Event): void {
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    const nationalNumber = (event.target as HTMLInputElement).value;
    this.scheduleSync();
    this.intent.emit({ type: 'numberChangeRequested', nationalNumber });
  }

  protected onExtensionInput(event: Event): void {
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    const extension = (event.target as HTMLInputElement).value;
    this.scheduleSync();
    this.intent.emit({ type: 'extensionChangeRequested', extension });
  }

  protected onChannelToggle(channel: EmrPhoneChannel): void {
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    this.scheduleSync();
    this.intent.emit({ type: 'channelToggleRequested', channel });
  }

  protected syncDom(): void {
    const m = this.model();
    const countryEl = this.countryRef()?.nativeElement;
    if (countryEl && countryEl.value !== m.countryCode) countryEl.value = m.countryCode;
    const numberEl = this.numberRef()?.nativeElement;
    if (numberEl && numberEl.value !== m.nationalNumber) numberEl.value = m.nationalNumber;
    const extEl = this.extRef()?.nativeElement;
    if (extEl && m.extension !== undefined && extEl.value !== m.extension) {
      extEl.value = m.extension;
    }
    for (const ref of this.channelRefs()) {
      const el = ref.nativeElement;
      const expected = this.hasChannel(el.value as EmrPhoneChannel);
      if (el.checked !== expected) el.checked = expected;
    }
  }

  private scheduleSync(): void {
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom();
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────
// 9. EmrAddressFieldComponent
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'emr-address-field',
  standalone: true,
  imports: [EmrFieldFrameComponent, EmrSegmentedControlComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <emr-field-frame
      [label]="m.label"
      [controlId]="resolvedId()"
      [required]="!!m.required"
      [hint]="m.hint"
      [messages]="m.messages ?? []"
    >
      <div class="clf-stack" role="group" [attr.aria-label]="m.label">
        @if (useOptions().length > 0) {
          <emr-segmented-control
            [controlId]="resolvedId() + '-use'"
            [ariaLabel]="m.label + ' use'"
            [labelHidden]="true"
            [options]="useOptions()"
            [value]="m.use ?? null"
            [readOnly]="!!m.readOnly"
            (valueChange)="onUseChange($event)"
          />
        }

        <div class="addr-grid">
          <div class="addr-cell addr-cell--full">
            <label class="clf-sub" [for]="resolvedId()">Address line 1</label>
            <input
              #line1El
              class="emr-control"
              type="text"
              autocomplete="address-line1"
              [id]="resolvedId()"
              [value]="m.value.line1"
              [required]="!!m.required"
              [readOnly]="!!m.readOnly"
              [attr.aria-invalid]="hasError() ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (input)="onFieldInput('line1', $event)"
              (blur)="syncDom()"
            />
          </div>

          <div class="addr-cell addr-cell--full">
            <label class="clf-sub" [for]="resolvedId() + '-line2'">Address line 2</label>
            <input
              #line2El
              class="emr-control"
              type="text"
              autocomplete="address-line2"
              [id]="resolvedId() + '-line2'"
              [value]="m.value.line2 ?? ''"
              [readOnly]="!!m.readOnly"
              (input)="onFieldInput('line2', $event)"
              (blur)="syncDom()"
            />
          </div>

          <div class="addr-cell">
            <label class="clf-sub" [for]="resolvedId() + '-city'">City / Town</label>
            <input
              #cityEl
              class="emr-control"
              type="text"
              autocomplete="address-level2"
              [id]="resolvedId() + '-city'"
              [value]="m.value.city"
              [required]="!!m.required"
              [readOnly]="!!m.readOnly"
              (input)="onFieldInput('city', $event)"
              (blur)="syncDom()"
            />
          </div>

          @if (m.showDistrict) {
            <div class="addr-cell">
              <label class="clf-sub" [for]="resolvedId() + '-district'">District</label>
              <input
                #districtEl
                class="emr-control"
                type="text"
                [id]="resolvedId() + '-district'"
                [value]="m.value.district ?? ''"
                [readOnly]="!!m.readOnly"
                (input)="onFieldInput('district', $event)"
                (blur)="syncDom()"
              />
            </div>
          }

          <div class="addr-cell">
            <label class="clf-sub" [for]="resolvedId() + '-state'">State / Province</label>
            @if (m.stateOptions?.length) {
              <select
                #stateSelectEl
                class="emr-select"
                [id]="resolvedId() + '-state'"
                [attr.aria-readonly]="m.readOnly || null"
                [value]="m.value.state"
                (change)="onFieldInput('state', $event)"
                (blur)="syncDom()"
              >
                <option value="" [selected]="!m.value.state">Select</option>
                @for (opt of m.stateOptions; track opt.value) {
                  <option
                    [value]="opt.value"
                    [selected]="opt.value === m.value.state"
                    [disabled]="opt.disabled"
                  >
                    {{ opt.label }}
                  </option>
                }
              </select>
            } @else {
              <input
                #stateInputEl
                class="emr-control"
                type="text"
                autocomplete="address-level1"
                [id]="resolvedId() + '-state'"
                [value]="m.value.state"
                [readOnly]="!!m.readOnly"
                (input)="onFieldInput('state', $event)"
                (blur)="syncDom()"
              />
            }
          </div>

          <div class="addr-cell">
            <label class="clf-sub" [for]="resolvedId() + '-postal'">Postal / PIN code</label>
            <input
              #postalEl
              class="emr-control"
              type="text"
              autocomplete="postal-code"
              [id]="resolvedId() + '-postal'"
              [value]="m.value.postalCode"
              [readOnly]="!!m.readOnly"
              (input)="onFieldInput('postalCode', $event)"
              (blur)="syncDom()"
            />
          </div>

          <div class="addr-cell">
            <label class="clf-sub" [for]="resolvedId() + '-country'">Country</label>
            @if (m.countryOptions?.length) {
              <select
                #countrySelectEl
                class="emr-select"
                [id]="resolvedId() + '-country'"
                [attr.aria-readonly]="m.readOnly || null"
                [value]="m.value.country"
                (change)="onFieldInput('country', $event)"
                (blur)="syncDom()"
              >
                <option value="" [selected]="!m.value.country">Select</option>
                @for (opt of m.countryOptions; track opt.value) {
                  <option
                    [value]="opt.value"
                    [selected]="opt.value === m.value.country"
                    [disabled]="opt.disabled"
                  >
                    {{ opt.label }}
                  </option>
                }
              </select>
            } @else {
              <input
                #countryInputEl
                class="emr-control"
                type="text"
                autocomplete="country-name"
                [id]="resolvedId() + '-country'"
                [value]="m.value.country"
                [readOnly]="!!m.readOnly"
                (input)="onFieldInput('country', $event)"
                (blur)="syncDom()"
              />
            }
          </div>
        </div>
      </div>
    </emr-field-frame>
  `,
  styles: [
    CLINICAL_FIELD_STYLES,
    `
      .addr-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .addr-cell {
        display: grid;
        gap: 4px;
        min-width: 0;
      }
      .addr-cell--full {
        grid-column: 1 / -1;
      }
      @media (max-width: 640px) {
        .addr-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class EmrAddressFieldComponent implements AfterViewChecked {
  readonly model = input.required<AddressFieldViewModel>();
  readonly controlId = input<string>();
  readonly intent = output<AddressFieldIntent>();

  private readonly fallbackId = `emr-address-field-${++nextClinicalFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly useOptions = computed<readonly EmrSegmentedOption[]>(() =>
    (this.model().useOptions ?? []).map((o) => ({ value: o.value, label: o.label })),
  );

  protected readonly hasError = computed(() =>
    Boolean(this.model().messages?.some((m) => m.severity === 'error')),
  );
  protected readonly describedBy = computed(() => {
    const m = this.model();
    return m.hint || (m.messages && m.messages.length > 0)
      ? `${this.resolvedId()}-message`
      : null;
  });

  private readonly line1Ref = viewChild<ElementRef<HTMLInputElement>>('line1El');
  private readonly line2Ref = viewChild<ElementRef<HTMLInputElement>>('line2El');
  private readonly cityRef = viewChild<ElementRef<HTMLInputElement>>('cityEl');
  private readonly districtRef = viewChild<ElementRef<HTMLInputElement>>('districtEl');
  private readonly stateSelectRef = viewChild<ElementRef<HTMLSelectElement>>('stateSelectEl');
  private readonly stateInputRef = viewChild<ElementRef<HTMLInputElement>>('stateInputEl');
  private readonly postalRef = viewChild<ElementRef<HTMLInputElement>>('postalEl');
  private readonly countrySelectRef = viewChild<ElementRef<HTMLSelectElement>>('countrySelectEl');
  private readonly countryInputRef = viewChild<ElementRef<HTMLInputElement>>('countryInputEl');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onUseChange(next: string | null): void {
    if (this.model().readOnly || !next) return;
    if (next === 'home' || next === 'work' || next === 'temp' || next === 'billing') {
      this.intent.emit({ type: 'useChangeRequested', use: next });
    }
  }

  protected onFieldInput(part: keyof EmrAddressValue, event: Event): void {
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom();
      }
    });
    this.intent.emit({ type: 'fieldChangeRequested', part, value });
  }

  protected syncDom(): void {
    const v = this.model().value;
    const sync = (
      el: HTMLInputElement | HTMLSelectElement | undefined,
      expected: string,
    ): void => {
      if (el && el.value !== expected) el.value = expected;
    };
    sync(this.line1Ref()?.nativeElement, v.line1);
    sync(this.line2Ref()?.nativeElement, v.line2 ?? '');
    sync(this.cityRef()?.nativeElement, v.city);
    sync(this.districtRef()?.nativeElement, v.district ?? '');
    sync(this.stateSelectRef()?.nativeElement, v.state);
    sync(this.stateInputRef()?.nativeElement, v.state);
    sync(this.postalRef()?.nativeElement, v.postalCode);
    sync(this.countrySelectRef()?.nativeElement, v.country);
    sync(this.countryInputRef()?.nativeElement, v.country);
  }
}

// ─────────────────────────────────────────────────────────────
// 10. EmrMacroTextFieldComponent
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'emr-macro-text-field',
  standalone: true,
  imports: [EmrFieldFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <emr-field-frame
      [label]="m.label"
      [controlId]="resolvedId()"
      [required]="!!m.required"
      [hint]="m.hint"
      [messages]="m.messages ?? []"
    >
      <div class="mtf-wrap">
        <textarea
          #noteArea
          class="emr-control emr-textarea"
          [id]="resolvedId()"
          [rows]="m.rows ?? 4"
          [value]="m.value"
          [placeholder]="m.placeholder ?? ''"
          [required]="!!m.required"
          [readOnly]="!!m.readOnly"
          [attr.aria-invalid]="hasError() ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          [attr.aria-controls]="popupOpen() ? resolvedId() + '-macros' : null"
          [attr.aria-activedescendant]="activeDescendantId()"
          (input)="onTextInput($event)"
          (keydown)="onKeyDown($event)"
          (blur)="syncDom()"
        ></textarea>

        @if (!m.readOnly) {
          <div class="mtf-toolbar">
            <button
              type="button"
              class="emr-button emr-button--outline emr-button--small"
              [attr.aria-pressed]="!!m.dictating"
              (click)="intent.emit({ type: 'dictationToggleRequested' })"
            >
              {{ m.dictating ? 'Stop dictation' : 'Start dictation' }}
            </button>
          </div>
        }

        @if (popupOpen()) {
          <ul
            class="mtf-popup"
            role="listbox"
            [id]="resolvedId() + '-macros'"
            [attr.aria-label]="m.label + ' macro suggestions'"
          >
            @for (suggestion of m.suggestions; track suggestion.trigger; let idx = $index) {
              <li
                role="option"
                [id]="resolvedId() + '-macro-' + idx"
                class="mtf-option"
                [attr.aria-selected]="activeIndex() === idx"
                (mousedown)="$event.preventDefault()"
                (click)="selectMacro(suggestion.trigger)"
              >
                <div class="mtf-option__head">
                  <code class="mtf-option__trigger">{{ suggestion.trigger }}</code>
                  <strong>{{ suggestion.label }}</strong>
                </div>
                <span class="mtf-option__preview">{{ suggestion.expansionPreview }}</span>
              </li>
            }
          </ul>
        }
      </div>
    </emr-field-frame>
  `,
  styles: [
    CLINICAL_FIELD_STYLES,
    `
      .mtf-wrap {
        position: relative;
        display: grid;
        gap: 6px;
      }
      .mtf-toolbar {
        display: flex;
        justify-content: flex-end;
      }
      .mtf-popup {
        list-style: none;
        margin: 0;
        padding: 6px;
        border: 1px solid var(--emr-border);
        border-radius: 8px;
        background: var(--emr-surface);
        box-shadow: var(--emr-shadow);
        max-height: 240px;
        overflow-y: auto;
        display: grid;
        gap: 4px;
      }
      .mtf-option {
        min-height: 44px;
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
        display: grid;
        gap: 2px;
      }
      .mtf-option:hover,
      .mtf-option[aria-selected='true'] {
        background: var(--emr-surface-raised);
      }
      .mtf-option__head {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: var(--emr-text-sm);
      }
      .mtf-option__trigger {
        font-family: var(--emr-font-mono);
        color: var(--emr-primary);
        font-weight: var(--emr-weight-bold);
      }
      .mtf-option__preview {
        font-size: var(--emr-text-xs);
        color: var(--emr-text-muted);
      }
    `,
  ],
})
export class EmrMacroTextFieldComponent implements AfterViewChecked {
  readonly model = input.required<MacroTextFieldViewModel>();
  readonly controlId = input<string>();
  readonly intent = output<MacroTextFieldIntent>();

  private readonly fallbackId = `emr-macro-text-${++nextClinicalFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly activeIndex = signal(0);
  protected readonly popupOpen = computed(() => {
    const m = this.model();
    return !m.readOnly && m.suggestionsOpen && m.suggestions.length > 0;
  });
  protected readonly activeDescendantId = computed(() => {
    if (!this.popupOpen()) return null;
    const idx = Math.min(this.activeIndex(), this.model().suggestions.length - 1);
    return idx >= 0 ? `${this.resolvedId()}-macro-${idx}` : null;
  });

  protected readonly hasError = computed(() =>
    Boolean(this.model().messages?.some((m) => m.severity === 'error')),
  );
  protected readonly describedBy = computed(() => {
    const m = this.model();
    return m.hint || (m.messages && m.messages.length > 0)
      ? `${this.resolvedId()}-message`
      : null;
  });

  private readonly noteRef = viewChild<ElementRef<HTMLTextAreaElement>>('noteArea');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onTextInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    const nextValue = target.value;
    const cursor = target.selectionStart ?? nextValue.length;
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom();
      }
    });
    this.intent.emit({ type: 'valueChangeRequested', value: nextValue });

    const trigger = extractActiveMacroTrigger(nextValue, cursor);
    if (trigger) {
      this.activeIndex.set(0);
      this.intent.emit({ type: 'macroQueryRequested', trigger });
    } else if (this.model().suggestionsOpen) {
      this.intent.emit({ type: 'macroDismissRequested' });
    }
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (!this.popupOpen()) {
      if (event.key === 'Escape' && this.model().suggestionsOpen) {
        event.preventDefault();
        this.intent.emit({ type: 'macroDismissRequested' });
      }
      return;
    }

    const total = this.model().suggestions.length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((i) => (i + 1) % total);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((i) => (i - 1 + total) % total);
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      const idx = Math.min(this.activeIndex(), total - 1);
      const chosen = this.model().suggestions[idx];
      if (chosen) {
        event.preventDefault();
        this.selectMacro(chosen.trigger);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.intent.emit({ type: 'macroDismissRequested' });
    }
  }

  protected selectMacro(trigger: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'macroSelected', trigger });
  }

  protected syncDom(): void {
    const el = this.noteRef()?.nativeElement;
    if (!el) return;
    const expected = this.model().value;
    if (el.value !== expected) el.value = expected;
  }
}
