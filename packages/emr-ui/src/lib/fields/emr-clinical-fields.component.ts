import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type {
  AddressFieldIntent,
  AddressFieldViewModel,
  EmrAddressPart,
  EmrAddressUse,
  EmrAddressValue,
  EmrFieldDefinition,
  EmrOption,
  EmrPhoneChannel,
  EmrPhoneChannelOption,
  EmrSegmentedOption,
  EmrSelectValue,
  FieldFrameIntent,
  FieldFrameLayout,
  MacroTextFieldIntent,
  MacroTextFieldViewModel,
  PhoneFieldIntent,
  PhoneFieldViewModel,
} from '@drguptavivek/emr-controller';
import { EmrSegmentedControlComponent } from '../primitives/emr-action-controls.component';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';
import { EmrSelectComponent } from '../primitives/emr-inputs.component';
import { EmrFieldFrameComponent } from './emr-field-frame.component';
import {
  DEFAULT_ADDRESS_REQUIRED_PARTS,
  DEFAULT_ADDRESS_USE_OPTIONS,
  extractActiveMacroTrigger,
  hasAnyAddressValue,
  hasMacroValidationState,
  hasPhoneClearableValue,
  isPhoneExtensionVisible,
  normalizeFieldLayout,
  resolveAddressPartValidation,
  resolveAddressRootMessages,
  resolvePhonePartValidation,
} from './emr-fields.logic';

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
  imports: [EmrFieldFrameComponent, EmrSelectComponent, EmrBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let locked = effectiveReadOnly();
    @let pv = partValidation();
    <emr-field-frame
      [label]="resolvedLabel()"
      [controlId]="resolvedId()"
      [labelHidden]="labelHidden()"
      [labelNamesControl]="false"
      [layout]="resolvedLayout()"
      [showMetadata]="resolvedShowMetadata()"
      [unit]="resolvedUnit()"
      [required]="effectiveRequired()"
      [readOnly]="locked"
      [hint]="resolvedHint()"
      [messages]="m.messages ?? []"
      [assessmentStatus]="m.status"
      [assessmentStatusOptions]="m.statusOptions ?? []"
      (intent)="onFrameIntent($event)"
    >
      <div
        class="clf-stack"
        role="group"
        [attr.aria-labelledby]="groupLabelledBy()"
        [attr.aria-label]="resolvedLabel()"
        [attr.aria-describedby]="describedBy()"
        (focusin)="onGroupFocusIn()"
        (focusout)="onGroupFocusOut($event)"
      >
        <div
          class="ph-row"
          [class.ph-row--sm]="resolvedSize() === 'sm'"
          [class.ph-row--lg]="resolvedSize() === 'lg'"
        >
          <div class="ph-country">
            <emr-select
              [controlId]="resolvedId() + '-country'"
              [label]="resolvedLabel() + ' country code'"
              [labelHidden]="true"
              [options]="countrySelectOptions()"
              [value]="m.countryCode"
              [size]="resolvedSize() === 'sm' ? 'sm' : 'md'"
              [required]="effectiveRequired()"
              [readOnly]="locked"
              [invalid]="pv.countryCodeInvalid"
              [hasWarning]="pv.countryCodeWarning"
              [ariaDescribedBy]="describedBy()"
              (valueChange)="onCountryChange($event)"
            />
          </div>

          <div class="ph-number-wrap">
            @if (showPhoneIcon()) {
              <span class="ph-leading-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
            }
            <input
              #numberInput
              class="emr-control ph-number"
              [class.ph-number--with-icon]="showPhoneIcon()"
              [class.emr-control--sm]="resolvedSize() === 'sm'"
              [class.emr-control--lg]="resolvedSize() === 'lg'"
              type="tel"
              inputmode="tel"
              autocomplete="tel-national"
              [id]="resolvedId()"
              [value]="m.nationalNumber"
              [placeholder]="resolvedPlaceholder()"
              [attr.maxlength]="m.maxLength ?? null"
              [required]="effectiveRequired()"
              [readOnly]="locked"
              [attr.aria-label]="resolvedLabel()"
              [attr.aria-required]="effectiveRequired() ? 'true' : null"
              [attr.aria-readonly]="locked ? 'true' : null"
              [attr.aria-invalid]="pv.nationalNumberInvalid ? 'true' : null"
              [attr.data-warning]="pv.nationalNumberWarning ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (input)="onNumberInput($event)"
              (keydown.enter)="onEnterKey($event)"
              (blur)="syncDom()"
            />
          </div>

          @if (extensionVisible()) {
            <input
              #extInput
              class="emr-control ph-ext"
              [class.emr-control--sm]="resolvedSize() === 'sm'"
              [class.emr-control--lg]="resolvedSize() === 'lg'"
              type="text"
              inputmode="numeric"
              autocomplete="tel-extension"
              [id]="resolvedId() + '-ext'"
              [placeholder]="resolvedExtPlaceholder()"
              [attr.maxlength]="m.extensionMaxLength ?? null"
              [value]="m.extension ?? ''"
              [readOnly]="locked"
              [attr.aria-readonly]="locked ? 'true' : null"
              [attr.aria-invalid]="pv.extensionInvalid ? 'true' : null"
              [attr.data-warning]="pv.extensionWarning ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              [attr.aria-label]="resolvedLabel() + ' extension'"
              (input)="onExtensionInput($event)"
              (keydown.enter)="onEnterKey($event)"
              (blur)="syncDom()"
            />
          }

          @if (showClearButton()) {
            <button
              type="button"
              class="ph-clear"
              data-emr-print="hide"
              [attr.aria-label]="'Clear ' + resolvedLabel()"
              (click)="onClear()"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          }

          @if (m.verifiedBadge; as badge) {
            <emr-badge [badge]="badge" />
          }
        </div>

        @if (m.formattedPreview) {
          <div class="ph-preview" [attr.id]="resolvedId() + '-preview'">{{ m.formattedPreview }}</div>
        }

        @if (m.availableChannels?.length) {
          <div
            class="ph-channels"
            role="group"
            [attr.aria-label]="resolvedLabel() + ' messaging channels'"
            [attr.aria-invalid]="pv.channelsInvalid ? 'true' : null"
            [attr.data-warning]="pv.channelsWarning ? 'true' : null"
          >
            @for (ch of m.availableChannels; track ch.id) {
              @let chSelected = hasChannel(ch.id);
              @let chLocked = locked || !!ch.readOnly;
              @let chDisabled = !!ch.disabled;
              <button
                type="button"
                role="checkbox"
                class="ph-channel"
                [class.ph-channel--selected]="chSelected"
                [class.ph-channel--readonly]="chLocked"
                [class.ph-channel--invalid]="pv.channelsInvalid"
                [class.ph-channel--warning]="pv.channelsWarning"
                [attr.aria-checked]="chSelected ? 'true' : 'false'"
                [attr.aria-readonly]="chLocked ? 'true' : null"
                [attr.aria-disabled]="chDisabled ? 'true' : null"
                [disabled]="chDisabled"
                (click)="onChannelToggle(ch)"
              >
                <span class="ph-channel-box" aria-hidden="true">
                  @if (chSelected) {
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  }
                </span>
                <span>{{ ch.label }}</span>
              </button>
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
        min-width: 120px;
        max-width: 100%;
        flex: 0 1 auto;
      }
      .ph-number-wrap {
        position: relative;
        flex: 1 1 168px;
        min-width: 0;
        max-width: 100%;
        display: flex;
        align-items: center;
      }
      .ph-leading-icon {
        position: absolute;
        inset-inline-start: 11px;
        color: var(--emr-text-muted);
        pointer-events: none;
        display: inline-flex;
        align-items: center;
      }
      .ph-number {
        width: 100%;
        min-width: 0;
      }
      .ph-number--with-icon {
        padding-inline-start: 34px;
      }
      .ph-ext {
        width: 96px;
        max-width: 100%;
        flex: 0 0 auto;
      }
      .ph-clear {
        min-width: 44px;
        min-height: var(--emr-control-height, 44px);
        width: var(--emr-control-height, 44px);
        height: var(--emr-control-height, 44px);
        border: 1px solid var(--emr-border);
        border-radius: 8px;
        background: var(--emr-surface);
        color: var(--emr-text-muted);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        cursor: pointer;
      }
      .ph-clear:hover {
        border-color: var(--emr-focus);
        color: var(--emr-text);
        background: var(--emr-surface-soft);
      }
      .ph-clear:focus-visible {
        outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
        outline-offset: 2px;
      }
      .ph-row--lg .emr-control,
      .ph-row--lg .ph-clear {
        min-height: 48px;
        height: 48px;
      }
      .ph-row--lg .ph-clear {
        min-width: 48px;
        width: 48px;
      }
      .ph-preview {
        font-size: var(--emr-text-xs);
        color: var(--emr-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .ph-channels {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .ph-channel {
        min-height: 44px;
        padding: 0 12px;
        border: 1.5px solid var(--emr-border);
        border-radius: var(--emr-radius, 8px);
        background: var(--emr-surface);
        color: var(--emr-text);
        font: inherit;
        font-size: var(--emr-text-sm);
        font-weight: var(--emr-weight-medium);
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }
      .ph-channel:hover:not(:disabled):not([aria-readonly="true"]) {
        border-color: var(--emr-focus);
        background: var(--emr-surface-soft);
      }
      .ph-channel:focus-visible {
        outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
        outline-offset: 2px;
      }
      .ph-channel--selected {
        border-color: var(--emr-primary);
        background: var(--emr-primary-soft);
        color: var(--emr-primary-contrast);
        font-weight: var(--emr-weight-semibold);
      }
      .ph-channel--readonly {
        background: var(--emr-surface-soft);
        border-style: dashed;
        cursor: default;
      }
      .ph-channel--invalid {
        border-color: var(--emr-danger);
      }
      .ph-channel--warning:not(.ph-channel--invalid) {
        border-color: var(--emr-warning);
      }
      .ph-channel:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .ph-channel-box {
        width: 16px;
        height: 16px;
        border-radius: 4px;
        border: 1.5px solid var(--emr-border);
        background: var(--emr-surface);
        color: var(--emr-on-primary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .ph-channel--selected .ph-channel-box {
        border-color: var(--emr-primary);
        background: var(--emr-primary);
        color: var(--emr-on-primary);
      }
    `,
  ],
})
export class EmrPhoneInputComponent implements AfterViewChecked {
  readonly model = input.required<PhoneFieldViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly layout = input<FieldFrameLayout>();
  readonly showMetadata = input(true, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly clearable = input<boolean | undefined, unknown>(undefined, {
    transform: (v) => (v === undefined || v === null ? undefined : booleanAttribute(v)),
  });
  readonly intent = output<PhoneFieldIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
  readonly submitted = output<void>();

  private readonly fallbackId = `emr-phone-input-${++nextClinicalFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly resolvedDefinition = computed(() => this.definition() ?? this.model().definition);
  protected readonly resolvedLabel = computed(
    () => this.model().label || this.resolvedDefinition()?.presentation?.label || '',
  );
  protected readonly resolvedUnit = computed(
    () => this.resolvedDefinition()?.presentation?.unitDisplay,
  );
  protected readonly resolvedHint = computed(
    () => this.model().hint ?? this.resolvedDefinition()?.presentation?.hint,
  );
  protected readonly resolvedLayout = computed<FieldFrameLayout>(() =>
    normalizeFieldLayout(this.layout() ?? this.model().layout),
  );
  protected readonly resolvedShowMetadata = computed(
    () => this.showMetadata() && this.model().showMetadata !== false,
  );
  protected readonly resolvedSize = computed<'sm' | 'md' | 'lg'>(
    () => this.size() ?? this.model().size ?? 'md',
  );
  protected readonly resolvedClearable = computed(
    () => this.clearable() ?? this.model().clearable ?? false,
  );
  protected readonly effectiveReadOnly = computed(() =>
    Boolean(this.readOnly() || this.model().readOnly || this.resolvedDefinition()?.contract?.readOnly),
  );
  protected readonly effectiveRequired = computed(() => {
    const min = this.resolvedDefinition()?.contract?.cardinality?.min;
    return Boolean(this.model().required || (min !== undefined && min >= 1));
  });
  protected readonly resolvedPlaceholder = computed(
    () => this.model().placeholder ?? this.resolvedDefinition()?.presentation?.placeholder ?? 'Phone number',
  );
  protected readonly resolvedExtPlaceholder = computed(
    () => this.model().extensionPlaceholder ?? 'Ext.',
  );
  protected readonly showPhoneIcon = computed(() => this.model().showPhoneIcon !== false);
  protected readonly extensionVisible = computed(() =>
    isPhoneExtensionVisible(this.model().showExtension, this.model().extension),
  );
  protected readonly showClearButton = computed(
    () =>
      this.resolvedClearable() &&
      !this.effectiveReadOnly() &&
      hasPhoneClearableValue(this.model().nationalNumber, this.model().extension),
  );
  protected readonly partValidation = computed(() =>
    resolvePhonePartValidation(this.model().messages),
  );
  protected readonly countrySelectOptions = computed<readonly EmrOption[]>(() =>
    this.model().countryOptions.map((c) => ({
      value: c.code,
      label: c.label,
      keywords: c.keywords,
      description: c.description,
      disabled: c.disabled,
      readOnly: c.readOnly,
      badge: c.badge,
      tone: c.tone,
      group: c.group,
    })),
  );
  protected readonly describedBy = computed(() => {
    const m = this.model();
    return this.resolvedHint() || (m.messages && m.messages.length > 0)
      ? `${this.resolvedId()}-message`
      : null;
  });
  protected readonly groupLabelledBy = computed(() =>
    this.headingId() || (!this.labelHidden() && this.resolvedLabel() ? `${this.resolvedId()}-label` : null),
  );

  private readonly numberRef = viewChild<ElementRef<HTMLInputElement>>('numberInput');
  private readonly extRef = viewChild<ElementRef<HTMLInputElement>>('extInput');
  private needsDomSync = false;
  private focusInside = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected hasChannel(channel: EmrPhoneChannel): boolean {
    return (this.model().channels ?? []).includes(channel);
  }

  protected onGroupFocusIn(): void {
    if (!this.focusInside) {
      this.focusInside = true;
      this.focused.emit();
    }
  }

  protected onGroupFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    const cur = event.currentTarget as HTMLElement | null;
    if (next && cur?.contains(next)) return;
    if (this.focusInside) {
      this.focusInside = false;
      this.blurred.emit();
    }
  }

  protected onFrameIntent(ev: FieldFrameIntent): void {
    if (this.effectiveReadOnly()) return;
    if (ev.type === 'statusChangeRequested') {
      this.intent.emit({ type: 'statusChangeRequested', status: ev.status });
    }
  }

  protected onCountryChange(val: EmrSelectValue): void {
    if (this.effectiveReadOnly()) return;
    if (typeof val === 'string' && val.length > 0 && val !== this.model().countryCode) {
      this.intent.emit({ type: 'countryCodeChangeRequested', countryCode: val });
    }
  }

  protected onNumberInput(event: Event): void {
    if (this.effectiveReadOnly()) {
      this.syncDom();
      return;
    }
    const nationalNumber = (event.target as HTMLInputElement).value;
    this.scheduleSync();
    this.intent.emit({ type: 'numberChangeRequested', nationalNumber });
  }

  protected onExtensionInput(event: Event): void {
    if (this.effectiveReadOnly()) {
      this.syncDom();
      return;
    }
    const extension = (event.target as HTMLInputElement).value;
    this.scheduleSync();
    this.intent.emit({ type: 'extensionChangeRequested', extension });
  }

  protected onEnterKey(event: Event): void {
    event.preventDefault();
    if (!this.effectiveReadOnly()) {
      this.submitted.emit();
    }
  }

  protected onClear(): void {
    if (this.effectiveReadOnly()) return;
    this.scheduleSync();
    this.intent.emit({ type: 'clearRequested' });
  }

  protected onChannelToggle(ch: EmrPhoneChannelOption): void {
    if (this.effectiveReadOnly() || ch.readOnly || ch.disabled) return;
    this.intent.emit({ type: 'channelToggleRequested', channel: ch.id });
  }

  protected syncDom(): void {
    const m = this.model();
    const numberEl = this.numberRef()?.nativeElement;
    if (numberEl && numberEl.value !== m.nationalNumber) numberEl.value = m.nationalNumber;
    const extEl = this.extRef()?.nativeElement;
    if (extEl && extEl.value !== (m.extension ?? '')) {
      extEl.value = m.extension ?? '';
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
  imports: [EmrFieldFrameComponent, EmrSegmentedControlComponent, EmrSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let locked = effectiveReadOnly();
    @let pv = partValidation();
    <emr-field-frame
      [label]="resolvedLabel()"
      [controlId]="resolvedId()"
      [labelHidden]="labelHidden()"
      [labelNamesControl]="false"
      [layout]="resolvedLayout()"
      [showMetadata]="resolvedShowMetadata()"
      [unit]="resolvedUnit()"
      [required]="effectiveRequired()"
      [readOnly]="locked"
      [hint]="resolvedHint()"
      [messages]="mergedMessages()"
      [assessmentStatus]="m.status"
      [assessmentStatusOptions]="m.statusOptions ?? []"
      (intent)="onFrameIntent($event)"
    >
      <div
        class="clf-stack"
        role="group"
        [attr.aria-labelledby]="groupLabelledBy()"
        [attr.aria-label]="resolvedLabel()"
        [attr.aria-describedby]="describedBy()"
        (focusin)="onGroupFocusIn()"
        (focusout)="onGroupFocusOut($event)"
      >
        @if (useOptions().length > 0 || showClearButton()) {
          <div class="addr-header" [class.addr-header--end]="useOptions().length === 0">
            @if (useOptions().length > 0) {
              <emr-segmented-control
                [controlId]="resolvedId() + '-use'"
                [ariaLabel]="m.labels?.use || (resolvedLabel() + ' use')"
                [labelHidden]="true"
                [options]="useOptions()"
                [value]="m.use ?? null"
                [readOnly]="locked"
                (valueChange)="onUseChange($event)"
              />
            }
            @if (showClearButton()) {
              <button
                type="button"
                class="addr-clear"
                data-emr-print="hide"
                [attr.aria-label]="(m.labels?.clear || 'Clear') + ' ' + resolvedLabel()"
                (click)="onClear()"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            }
          </div>
        }

        <div class="addr-grid">
          @let line1Req = isPartRequired('line1');
          <div class="addr-cell addr-cell--full">
            <label class="clf-sub" [for]="resolvedId()">
              {{ partLabel('line1', 'Address line 1') }}@if (line1Req) {<span class="emr-field__required" aria-hidden="true"> *</span>}
            </label>
            <input
              #line1El
              class="emr-control"
              [class.addr-ctrl--readonly]="locked"
              type="text"
              autocomplete="address-line1"
              [id]="resolvedId()"
              [value]="m.value.line1"
              [placeholder]="partPlaceholder('line1', 'Street, building, house number')"
              [attr.maxlength]="partMaxLength('line1')"
              [required]="line1Req"
              [readOnly]="locked"
              [attr.aria-required]="line1Req ? 'true' : null"
              [attr.aria-readonly]="locked ? 'true' : null"
              [attr.aria-invalid]="pv.line1Invalid ? 'true' : null"
              [attr.data-warning]="pv.line1Warning ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (input)="onFieldInput('line1', $event)"
              (blur)="syncDom()"
            />
          </div>

          @let line2Req = isPartRequired('line2');
          <div class="addr-cell addr-cell--full">
            <label class="clf-sub" [for]="resolvedId() + '-line2'">
              {{ partLabel('line2', 'Address line 2') }}@if (line2Req) {<span class="emr-field__required" aria-hidden="true"> *</span>}
            </label>
            <input
              #line2El
              class="emr-control"
              [class.addr-ctrl--readonly]="locked"
              type="text"
              autocomplete="address-line2"
              [id]="resolvedId() + '-line2'"
              [value]="m.value.line2 ?? ''"
              [placeholder]="partPlaceholder('line2', 'Apartment, landmark, locality (optional)')"
              [attr.maxlength]="partMaxLength('line2')"
              [required]="line2Req"
              [readOnly]="locked"
              [attr.aria-required]="line2Req ? 'true' : null"
              [attr.aria-readonly]="locked ? 'true' : null"
              [attr.aria-invalid]="pv.line2Invalid ? 'true' : null"
              [attr.data-warning]="pv.line2Warning ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (input)="onFieldInput('line2', $event)"
              (blur)="syncDom()"
            />
          </div>

          @let cityReq = isPartRequired('city');
          <div class="addr-cell" [class.addr-cell--full]="!districtVisible()">
            <label class="clf-sub" [for]="resolvedId() + '-city'">
              {{ partLabel('city', 'City / Town') }}@if (cityReq) {<span class="emr-field__required" aria-hidden="true"> *</span>}
            </label>
            <input
              #cityEl
              class="emr-control"
              [class.addr-ctrl--readonly]="locked"
              type="text"
              autocomplete="address-level2"
              [id]="resolvedId() + '-city'"
              [value]="m.value.city"
              [placeholder]="partPlaceholder('city', 'City')"
              [attr.maxlength]="partMaxLength('city')"
              [required]="cityReq"
              [readOnly]="locked"
              [attr.aria-required]="cityReq ? 'true' : null"
              [attr.aria-readonly]="locked ? 'true' : null"
              [attr.aria-invalid]="pv.cityInvalid ? 'true' : null"
              [attr.data-warning]="pv.cityWarning ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (input)="onFieldInput('city', $event)"
              (blur)="syncDom()"
            />
          </div>

          @if (districtVisible()) {
            @let districtReq = isPartRequired('district');
            <div class="addr-cell">
              <label class="clf-sub" [for]="resolvedId() + '-district'">
                {{ partLabel('district', 'District') }}@if (districtReq) {<span class="emr-field__required" aria-hidden="true"> *</span>}
              </label>
              <input
                #districtEl
                class="emr-control"
                [class.addr-ctrl--readonly]="locked"
                type="text"
                autocomplete="address-level3"
                [id]="resolvedId() + '-district'"
                [value]="m.value.district ?? ''"
                [placeholder]="partPlaceholder('district', 'District')"
                [attr.maxlength]="partMaxLength('district')"
                [required]="districtReq"
                [readOnly]="locked"
                [attr.aria-required]="districtReq ? 'true' : null"
                [attr.aria-readonly]="locked ? 'true' : null"
                [attr.aria-invalid]="pv.districtInvalid ? 'true' : null"
                [attr.data-warning]="pv.districtWarning ? 'true' : null"
                [attr.aria-describedby]="describedBy()"
                (input)="onFieldInput('district', $event)"
                (blur)="syncDom()"
              />
            </div>
          }

          @let stateReq = isPartRequired('state');
          @let stateLbl = partLabel('state', 'State / Province');
          <div class="addr-cell">
            @if (stateSelectOptions().length > 0) {
              <span class="clf-sub">
                {{ stateLbl }}@if (stateReq) {<span class="emr-field__required" aria-hidden="true"> *</span>}
              </span>
              <emr-select
                [controlId]="resolvedId() + '-state'"
                [label]="stateLbl"
                [labelHidden]="true"
                [options]="stateSelectOptions()"
                [value]="m.value.state || null"
                [placeholder]="partPlaceholder('state', 'Select')"
                [required]="stateReq"
                [readOnly]="locked"
                [invalid]="pv.stateInvalid"
                [hasWarning]="pv.stateWarning"
                [ariaDescribedBy]="describedBy()"
                (valueChange)="onSelectPartChange('state', $event)"
              />
            } @else {
              <label class="clf-sub" [for]="resolvedId() + '-state'">
                {{ stateLbl }}@if (stateReq) {<span class="emr-field__required" aria-hidden="true"> *</span>}
              </label>
              <input
                #stateInputEl
                class="emr-control"
                [class.addr-ctrl--readonly]="locked"
                type="text"
                autocomplete="address-level1"
                [id]="resolvedId() + '-state'"
                [value]="m.value.state"
                [placeholder]="partPlaceholder('state', 'State')"
                [attr.maxlength]="partMaxLength('state')"
                [required]="stateReq"
                [readOnly]="locked"
                [attr.aria-required]="stateReq ? 'true' : null"
                [attr.aria-readonly]="locked ? 'true' : null"
                [attr.aria-invalid]="pv.stateInvalid ? 'true' : null"
                [attr.data-warning]="pv.stateWarning ? 'true' : null"
                [attr.aria-describedby]="describedBy()"
                (input)="onFieldInput('state', $event)"
                (blur)="syncDom()"
              />
            }
          </div>

          @let postalReq = isPartRequired('postalCode');
          <div class="addr-cell">
            <label class="clf-sub" [for]="resolvedId() + '-postal'">
              {{ partLabel('postalCode', 'Postal / PIN code') }}@if (postalReq) {<span class="emr-field__required" aria-hidden="true"> *</span>}
            </label>
            <input
              #postalEl
              class="emr-control addr-postal"
              [class.addr-ctrl--readonly]="locked"
              type="text"
              autocomplete="postal-code"
              autocapitalize="characters"
              [id]="resolvedId() + '-postal'"
              [value]="m.value.postalCode"
              [placeholder]="partPlaceholder('postalCode', 'Postal / PIN')"
              [attr.maxlength]="partMaxLength('postalCode')"
              [required]="postalReq"
              [readOnly]="locked"
              [attr.aria-required]="postalReq ? 'true' : null"
              [attr.aria-readonly]="locked ? 'true' : null"
              [attr.aria-invalid]="pv.postalCodeInvalid ? 'true' : null"
              [attr.data-warning]="pv.postalCodeWarning ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (input)="onFieldInput('postalCode', $event)"
              (blur)="syncDom()"
            />
          </div>

          @let countryReq = isPartRequired('country');
          @let countryLbl = partLabel('country', 'Country');
          <div class="addr-cell">
            @if (countrySelectOptions().length > 0) {
              <span class="clf-sub">
                {{ countryLbl }}@if (countryReq) {<span class="emr-field__required" aria-hidden="true"> *</span>}
              </span>
              <emr-select
                [controlId]="resolvedId() + '-country'"
                [label]="countryLbl"
                [labelHidden]="true"
                [options]="countrySelectOptions()"
                [value]="m.value.country || null"
                [placeholder]="partPlaceholder('country', 'Select')"
                [required]="countryReq"
                [readOnly]="locked"
                [invalid]="pv.countryInvalid"
                [hasWarning]="pv.countryWarning"
                [ariaDescribedBy]="describedBy()"
                (valueChange)="onSelectPartChange('country', $event)"
              />
            } @else {
              <label class="clf-sub" [for]="resolvedId() + '-country'">
                {{ countryLbl }}@if (countryReq) {<span class="emr-field__required" aria-hidden="true"> *</span>}
              </label>
              <input
                #countryInputEl
                class="emr-control"
                [class.addr-ctrl--readonly]="locked"
                type="text"
                autocomplete="country-name"
                [id]="resolvedId() + '-country'"
                [value]="m.value.country"
                [placeholder]="partPlaceholder('country', 'Country')"
                [attr.maxlength]="partMaxLength('country')"
                [required]="countryReq"
                [readOnly]="locked"
                [attr.aria-required]="countryReq ? 'true' : null"
                [attr.aria-readonly]="locked ? 'true' : null"
                [attr.aria-invalid]="pv.countryInvalid ? 'true' : null"
                [attr.data-warning]="pv.countryWarning ? 'true' : null"
                [attr.aria-describedby]="describedBy()"
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
      .addr-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .addr-header--end {
        justify-content: flex-end;
      }
      .addr-clear {
        min-width: 44px;
        min-height: var(--emr-control-height, 44px);
        width: var(--emr-control-height, 44px);
        height: var(--emr-control-height, 44px);
        border: 1px solid var(--emr-border);
        border-radius: 8px;
        background: var(--emr-surface);
        color: var(--emr-text-muted);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        cursor: pointer;
      }
      .addr-clear:hover {
        border-color: var(--emr-focus);
        color: var(--emr-text);
        background: var(--emr-surface-soft);
      }
      .addr-clear:focus-visible {
        outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
        outline-offset: 2px;
      }
      .addr-ctrl--readonly {
        background: var(--emr-surface-soft);
        border-style: dashed;
      }
      .addr-postal {
        font-variant-numeric: tabular-nums;
      }
      .addr-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .addr-cell {
        display: grid;
        gap: 4px;
        min-width: 0;
        align-content: start;
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
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly layout = input<FieldFrameLayout>();
  readonly showMetadata = input(true, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly intent = output<AddressFieldIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-address-field-${++nextClinicalFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly resolvedDefinition = computed(() => this.definition() ?? this.model().definition);
  protected readonly resolvedLabel = computed(
    () => this.model().label || this.resolvedDefinition()?.presentation?.label || '',
  );
  protected readonly resolvedUnit = computed(
    () => this.resolvedDefinition()?.presentation?.unitDisplay,
  );
  protected readonly resolvedHint = computed(
    () => this.model().hint ?? this.resolvedDefinition()?.presentation?.hint,
  );
  protected readonly resolvedLayout = computed<FieldFrameLayout>(() =>
    normalizeFieldLayout(this.layout() ?? this.model().layout),
  );
  protected readonly resolvedShowMetadata = computed(
    () => this.showMetadata() && this.model().showMetadata !== false,
  );
  protected readonly effectiveReadOnly = computed(() =>
    Boolean(this.readOnly() || this.model().readOnly || this.resolvedDefinition()?.contract?.readOnly),
  );
  protected readonly effectiveRequired = computed(() => {
    const min = this.resolvedDefinition()?.contract?.cardinality?.min;
    return Boolean(this.model().required || (min !== undefined && min >= 1));
  });
  protected readonly mergedMessages = computed(() => resolveAddressRootMessages(this.model()));
  protected readonly partValidation = computed(() =>
    resolveAddressPartValidation(this.mergedMessages()),
  );
  protected readonly useOptions = computed<readonly EmrSegmentedOption[]>(() => {
    const m = this.model();
    const opts =
      m.useOptions !== undefined
        ? m.useOptions
        : m.use !== undefined
          ? DEFAULT_ADDRESS_USE_OPTIONS
          : [];
    return opts.map((o) => ({ value: o.value, label: o.label }));
  });
  protected readonly districtVisible = computed(() =>
    this.model().showDistrict !== undefined
      ? Boolean(this.model().showDistrict)
      : Boolean(this.model().value?.district),
  );
  protected readonly showClearButton = computed(() =>
    Boolean(this.model().clearable && !this.effectiveReadOnly() && hasAnyAddressValue(this.model().value)),
  );
  protected readonly stateSelectOptions = computed<readonly EmrOption[]>(() =>
    (this.model().stateOptions ?? []).map((o) => ({
      value: o.value,
      label: o.label,
      disabled: o.disabled,
    })),
  );
  protected readonly countrySelectOptions = computed<readonly EmrOption[]>(() =>
    (this.model().countryOptions ?? []).map((o) => ({
      value: o.value,
      label: o.label,
      disabled: o.disabled,
    })),
  );
  protected readonly describedBy = computed(() =>
    this.resolvedHint() || this.mergedMessages().length > 0
      ? `${this.resolvedId()}-message`
      : null,
  );
  protected readonly groupLabelledBy = computed(() =>
    this.headingId() || (!this.labelHidden() && this.resolvedLabel() ? `${this.resolvedId()}-label` : null),
  );

  private readonly line1Ref = viewChild<ElementRef<HTMLInputElement>>('line1El');
  private readonly line2Ref = viewChild<ElementRef<HTMLInputElement>>('line2El');
  private readonly cityRef = viewChild<ElementRef<HTMLInputElement>>('cityEl');
  private readonly districtRef = viewChild<ElementRef<HTMLInputElement>>('districtEl');
  private readonly stateInputRef = viewChild<ElementRef<HTMLInputElement>>('stateInputEl');
  private readonly postalRef = viewChild<ElementRef<HTMLInputElement>>('postalEl');
  private readonly countryInputRef = viewChild<ElementRef<HTMLInputElement>>('countryInputEl');
  private needsDomSync = false;
  private focusInside = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected isPartRequired(part: EmrAddressPart): boolean {
    const m = this.model();
    if (m.requiredParts !== undefined) return m.requiredParts.includes(part);
    return this.effectiveRequired() && DEFAULT_ADDRESS_REQUIRED_PARTS.includes(part);
  }

  protected partLabel(part: EmrAddressPart, fallback: string): string {
    return this.model().labels?.[part] || fallback;
  }

  protected partPlaceholder(part: EmrAddressPart, fallback: string): string {
    return this.model().placeholders?.[part] ?? fallback;
  }

  protected partMaxLength(part: EmrAddressPart): number | null {
    return this.model().maxLengths?.[part] ?? null;
  }

  protected onGroupFocusIn(): void {
    if (!this.focusInside) {
      this.focusInside = true;
      this.focused.emit();
    }
  }

  protected onGroupFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    const cur = event.currentTarget as HTMLElement | null;
    if (next && cur?.contains(next)) return;
    if (this.focusInside) {
      this.focusInside = false;
      this.blurred.emit();
    }
  }

  protected onFrameIntent(ev: FieldFrameIntent): void {
    if (this.effectiveReadOnly()) return;
    if (ev.type === 'statusChangeRequested') {
      this.intent.emit({ type: 'statusChangeRequested', status: ev.status });
    }
  }

  protected onUseChange(next: string | null): void {
    if (this.effectiveReadOnly() || !next) return;
    if (next === 'home' || next === 'work' || next === 'temp' || next === 'billing') {
      this.intent.emit({ type: 'useChangeRequested', use: next as EmrAddressUse });
    }
  }

  protected onSelectPartChange(part: 'state' | 'country', val: EmrSelectValue): void {
    if (this.effectiveReadOnly()) return;
    const value = typeof val === 'string' ? val : '';
    if (value !== (this.model().value[part] ?? '')) {
      this.intent.emit({ type: 'fieldChangeRequested', part, value });
    }
  }

  protected onClear(): void {
    if (this.effectiveReadOnly()) return;
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom();
      }
    });
    this.intent.emit({ type: 'cleared' });
  }

  protected onFieldInput(part: EmrAddressPart, event: Event): void {
    if (this.effectiveReadOnly()) {
      this.syncDom();
      return;
    }
    const value = (event.target as HTMLInputElement).value;
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
    const sync = (el: HTMLInputElement | undefined, expected: string): void => {
      if (el && el.value !== expected) el.value = expected;
    };
    sync(this.line1Ref()?.nativeElement, v.line1 ?? '');
    sync(this.line2Ref()?.nativeElement, v.line2 ?? '');
    sync(this.cityRef()?.nativeElement, v.city ?? '');
    sync(this.districtRef()?.nativeElement, v.district ?? '');
    sync(this.stateInputRef()?.nativeElement, v.state ?? '');
    sync(this.postalRef()?.nativeElement, v.postalCode ?? '');
    sync(this.countryInputRef()?.nativeElement, v.country ?? '');
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
    @let locked = effectiveReadOnly();
    @let vs = validationState();
    <emr-field-frame
      [label]="resolvedLabel()"
      [controlId]="resolvedId()"
      [labelHidden]="labelHidden()"
      [labelNamesControl]="true"
      [layout]="resolvedLayout()"
      [showMetadata]="resolvedShowMetadata()"
      [unit]="resolvedUnit()"
      [required]="effectiveRequired()"
      [readOnly]="locked"
      [hint]="resolvedHint()"
      [messages]="m.messages ?? []"
      [assessmentStatus]="m.status"
      [assessmentStatusOptions]="m.statusOptions ?? []"
      (intent)="onFrameIntent($event)"
    >
      <div class="mtf-wrap" [class.mtf-wrap--open]="popupOpen()">
        @if (!locked) {
          <div class="mtf-toolbar" data-emr-print="hide">
            <span class="mtf-helper">Type <strong>.</strong> or <strong>/</strong> for SmartPhrases</span>
            <div class="mtf-actions">
              @if (showClearButton()) {
                <button
                  type="button"
                  class="mtf-clear"
                  data-emr-print="hide"
                  [attr.aria-label]="'Clear ' + resolvedLabel()"
                  (click)="onClear()"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              }
              @if (dictationVisible()) {
                <button
                  type="button"
                  class="emr-button emr-button--small mtf-dictate"
                  [class.emr-button--outline]="!m.dictating"
                  [class.emr-button--danger]="!!m.dictating"
                  [attr.aria-pressed]="m.dictating ? 'true' : 'false'"
                  [attr.aria-label]="(m.dictating ? 'Stop dictation' : 'Start dictation') + ' for ' + resolvedLabel()"
                  (click)="onDictateToggle()"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="9" y="2" width="6" height="11" rx="3" />
                    <path d="M19 10a7 7 0 0 1-14 0" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                  <span>{{ m.dictating ? 'Stop dictation' : 'Start dictation' }}</span>
                </button>
              }
            </div>
          </div>
        }

        <div class="mtf-anchor">
          <textarea
            #noteArea
            class="emr-control emr-textarea"
            [id]="resolvedId()"
            [rows]="resolvedRows()"
            [value]="m.value"
            [placeholder]="resolvedPlaceholder()"
            [attr.maxlength]="resolvedMaxLength() ?? null"
            [required]="effectiveRequired()"
            [readOnly]="locked"
            role="combobox"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            [attr.aria-expanded]="popupOpen() ? 'true' : 'false'"
            [attr.aria-controls]="popupOpen() && hasSuggestions() ? resolvedId() + '-macros' : null"
            [attr.aria-activedescendant]="activeDescendantId()"
            [attr.aria-labelledby]="headingId() || null"
            [attr.aria-required]="effectiveRequired() ? 'true' : null"
            [attr.aria-readonly]="locked ? 'true' : null"
            [attr.aria-invalid]="vs.hasError ? 'true' : null"
            [attr.data-warning]="vs.hasWarning ? 'true' : null"
            [attr.aria-describedby]="describedBy()"
            (input)="onTextInput($event)"
            (keydown)="onKeyDown($event)"
            (focus)="onFocus()"
            (blur)="onBlur()"
          ></textarea>

          @if (popupOpen()) {
            <div class="mtf-popup" data-emr-print="hide">
              <div class="mtf-popup__header">
                <span class="mtf-popup__title">SMARTPHRASES</span>
                <button
                  type="button"
                  class="mtf-popup__close"
                  aria-label="Close SmartPhrases"
                  (mousedown)="$event.preventDefault()"
                  (click)="dismissMacros(true)"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              @if (hasSuggestions()) {
                <ul
                  class="mtf-list"
                  role="listbox"
                  [id]="resolvedId() + '-macros'"
                  [attr.aria-label]="resolvedLabel() + ' macro suggestions'"
                >
                  @for (suggestion of m.suggestions; track suggestion.trigger; let idx = $index) {
                    <li
                      role="option"
                      [id]="resolvedId() + '-macro-' + idx"
                      class="mtf-option"
                      [attr.aria-selected]="clampedActiveIndex() === idx ? 'true' : 'false'"
                      (mousedown)="$event.preventDefault()"
                      (click)="selectMacro(suggestion.trigger)"
                    >
                      <div class="mtf-option__head">
                        <code class="mtf-option__trigger">{{ suggestion.trigger }}</code>
                        <strong>{{ suggestion.label }}</strong>
                        @if (suggestion.category) {
                          <span class="mtf-option__category">{{ suggestion.category }}</span>
                        }
                      </div>
                      <span class="mtf-option__preview">{{ suggestion.expansionPreview }}</span>
                    </li>
                  }
                </ul>
              } @else {
                <div class="mtf-empty" role="status">No matching SmartPhrases</div>
              }
            </div>
          }
        </div>

        @if (showCounterFooter()) {
          <div class="emr-textarea__footer">
            <span
              class="emr-textarea__counter"
              [class.mtf-counter--warn]="resolvedMaxLength() !== undefined && m.value.length >= resolvedMaxLength()!"
              [id]="resolvedId() + '-counter'"
            >
              @if (resolvedMaxLength() !== undefined) {
                {{ m.value.length }} / {{ resolvedMaxLength() }}
              } @else {
                {{ m.value.length }}
              }
            </span>
          </div>
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
        min-width: 0;
      }
      .mtf-wrap--open {
        z-index: 40;
      }
      .mtf-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
      }
      .mtf-helper {
        font-size: var(--emr-text-2xs);
        color: var(--emr-text-muted);
      }
      .mtf-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .mtf-clear,
      .mtf-popup__close {
        min-width: 44px;
        min-height: 44px;
        width: 44px;
        height: 44px;
        border: 1px solid var(--emr-border);
        border-radius: var(--emr-radius, 8px);
        background: var(--emr-surface);
        color: var(--emr-text-muted);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex: 0 0 auto;
      }
      .mtf-popup__close {
        border-color: transparent;
        background: transparent;
      }
      .mtf-clear:hover,
      .mtf-popup__close:hover {
        border-color: var(--emr-focus);
        color: var(--emr-text);
        background: var(--emr-surface-soft);
      }
      .mtf-clear:focus-visible,
      .mtf-popup__close:focus-visible {
        outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
        outline-offset: 2px;
      }
      .mtf-dictate {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 44px;
      }
      .mtf-anchor {
        position: relative;
        min-width: 0;
      }
      .mtf-popup {
        margin-top: 6px;
        border: 1px solid var(--emr-border);
        border-radius: var(--emr-radius, 8px);
        background: var(--emr-surface);
        box-shadow: var(--emr-shadow);
        overflow: hidden;
      }
      .mtf-popup__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-inline: 12px 4px;
        border-bottom: 1px solid var(--emr-border);
        background: var(--emr-surface-accent);
      }
      .mtf-popup__title {
        font-size: var(--emr-text-2xs);
        font-weight: var(--emr-weight-bold);
        color: var(--emr-text-muted);
        letter-spacing: 0.04em;
      }
      .mtf-list {
        list-style: none;
        margin: 0;
        padding: 6px;
        max-height: 220px;
        overflow-y: auto;
        display: grid;
        gap: 4px;
      }
      .mtf-option {
        min-height: 44px;
        padding: 8px 10px;
        border: 1px solid transparent;
        border-radius: var(--emr-radius-sm, 6px);
        cursor: pointer;
        display: grid;
        gap: 2px;
      }
      .mtf-option:hover,
      .mtf-option[aria-selected='true'] {
        background: var(--emr-primary-soft);
        border-color: var(--emr-primary-border);
      }
      .mtf-option__head {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        font-size: var(--emr-text-sm);
      }
      .mtf-option__trigger {
        padding: 2px 6px;
        border-radius: 6px;
        background: var(--emr-primary-soft);
        color: var(--emr-primary-contrast);
        font-family: var(--emr-font-mono);
        font-size: var(--emr-text-2xs);
        font-weight: var(--emr-weight-bold);
      }
      .mtf-option__category {
        margin-inline-start: auto;
        padding: 1px 6px;
        border-radius: 999px;
        border: 1px solid var(--emr-border);
        background: var(--emr-surface-soft);
        font-size: var(--emr-text-2xs);
        color: var(--emr-text-muted);
      }
      .mtf-option__preview {
        font-size: var(--emr-text-xs);
        color: var(--emr-text-muted);
      }
      .mtf-empty {
        padding: 12px;
        font-size: var(--emr-text-sm);
        color: var(--emr-text-muted);
      }
      .mtf-counter--warn {
        color: var(--emr-warning);
        font-weight: var(--emr-weight-semibold);
      }
    `,
  ],
})
export class EmrMacroTextFieldComponent implements AfterViewChecked {
  readonly model = input.required<MacroTextFieldViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly layout = input<FieldFrameLayout>();
  readonly showMetadata = input(true, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly rows = input<number>();
  readonly maxLength = input<number>();
  readonly clearable = input<boolean | undefined, unknown>(undefined, {
    transform: (v) => (v === undefined || v === null ? undefined : booleanAttribute(v)),
  });
  readonly autoResize = input<boolean | undefined, unknown>(undefined, {
    transform: (v) => (v === undefined || v === null ? undefined : booleanAttribute(v)),
  });
  readonly intent = output<MacroTextFieldIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-macro-text-${++nextClinicalFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly resolvedDefinition = computed(() => this.definition() ?? this.model().definition);
  protected readonly resolvedLabel = computed(
    () => this.model().label || this.resolvedDefinition()?.presentation?.label || '',
  );
  protected readonly resolvedUnit = computed(() => this.resolvedDefinition()?.presentation?.unitDisplay);
  protected readonly resolvedHint = computed(
    () => this.model().hint ?? this.resolvedDefinition()?.presentation?.hint,
  );
  protected readonly resolvedPlaceholder = computed(
    () => this.model().placeholder ?? this.resolvedDefinition()?.presentation?.placeholder ?? '',
  );
  protected readonly resolvedLayout = computed<FieldFrameLayout>(() =>
    normalizeFieldLayout(this.layout() ?? this.model().layout),
  );
  protected readonly resolvedShowMetadata = computed(
    () => this.showMetadata() && this.model().showMetadata !== false,
  );
  protected readonly effectiveReadOnly = computed(() =>
    Boolean(this.readOnly() || this.model().readOnly || this.resolvedDefinition()?.contract?.readOnly),
  );
  protected readonly effectiveRequired = computed(() => {
    const min = this.resolvedDefinition()?.contract?.cardinality?.min;
    return Boolean(this.model().required || (min !== undefined && min >= 1));
  });
  protected readonly resolvedRows = computed(() =>
    Math.max(2, this.rows() ?? this.model().rows ?? this.resolvedDefinition()?.presentation?.rows ?? 4),
  );
  protected readonly resolvedMaxLength = computed(() => this.maxLength() ?? this.model().maxLength);
  protected readonly resolvedClearable = computed(() => this.clearable() ?? this.model().clearable ?? false);
  protected readonly resolvedAutoResize = computed(() => this.autoResize() ?? this.model().autoResize ?? false);
  protected readonly dictationVisible = computed(() => this.model().dictationEnabled !== false);
  protected readonly showClearButton = computed(
    () => this.resolvedClearable() && !this.effectiveReadOnly() && this.model().value.length > 0,
  );
  protected readonly showCounterFooter = computed(() => {
    const m = this.model();
    const ml = this.resolvedMaxLength();
    return m.showCounter !== false && (ml !== undefined || m.showCounter === true);
  });

  protected readonly activeIndex = signal(0);
  protected readonly hasSuggestions = computed(() => this.model().suggestions.length > 0);
  protected readonly popupOpen = computed(
    () => !this.effectiveReadOnly() && this.model().suggestionsOpen,
  );
  protected readonly clampedActiveIndex = computed(() => {
    const len = this.model().suggestions.length;
    if (len === 0) return -1;
    return Math.max(0, Math.min(this.activeIndex(), len - 1));
  });
  protected readonly activeDescendantId = computed(() => {
    if (!this.popupOpen() || !this.hasSuggestions()) return null;
    const idx = this.clampedActiveIndex();
    return idx >= 0 ? `${this.resolvedId()}-macro-${idx}` : null;
  });

  protected readonly validationState = computed(() => hasMacroValidationState(this.model().messages));
  protected readonly describedBy = computed(() => {
    const m = this.model();
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.resolvedHint() || (m.messages && m.messages.length > 0)) {
      ids.push(`${id}-message`);
    }
    if (this.showCounterFooter()) {
      ids.push(`${id}-counter`);
    }
    return ids.length ? ids.join(' ') : null;
  });

  private readonly noteRef = viewChild<ElementRef<HTMLTextAreaElement>>('noteArea');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    } else if (this.resolvedAutoResize()) {
      this.applyAutoResize();
    }
  }

  protected onFrameIntent(ev: FieldFrameIntent): void {
    if (this.effectiveReadOnly()) return;
    if (ev.type === 'statusChangeRequested') {
      this.intent.emit({ type: 'statusChangeRequested', status: ev.status });
    }
  }

  protected onClear(): void {
    if (this.effectiveReadOnly()) return;
    this.scheduleSync();
    this.intent.emit({ type: 'clearRequested' });
    this.noteRef()?.nativeElement?.focus();
  }

  protected onDictateToggle(): void {
    if (this.effectiveReadOnly()) return;
    this.intent.emit({ type: 'dictationToggleRequested' });
  }

  protected dismissMacros(restoreFocus = false): void {
    if (this.model().suggestionsOpen) {
      this.intent.emit({ type: 'macroDismissRequested' });
    }
    if (restoreFocus) {
      this.noteRef()?.nativeElement?.focus();
    }
  }

  protected onFocus(): void {
    this.focused.emit();
  }

  protected onBlur(): void {
    this.syncDom();
    this.blurred.emit();
  }

  protected onTextInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    if (this.effectiveReadOnly()) {
      this.syncDom();
      return;
    }
    const nextValue = target.value;
    const cursor = target.selectionStart ?? nextValue.length;
    if (this.resolvedAutoResize()) {
      this.applyAutoResize(target);
    }
    this.scheduleSync();
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
    if (this.effectiveReadOnly()) return;
    if (!this.popupOpen()) {
      if (event.key === 'Escape' && this.model().suggestionsOpen) {
        event.preventDefault();
        this.intent.emit({ type: 'macroDismissRequested' });
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.intent.emit({ type: 'macroDismissRequested' });
      return;
    }

    const total = this.model().suggestions.length;
    if (total === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((i) => (i + 1) % total);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((i) => (i - 1 + total) % total);
    } else if (event.key === 'Enter') {
      const idx = this.clampedActiveIndex();
      const chosen = idx >= 0 ? this.model().suggestions[idx] : undefined;
      if (chosen) {
        event.preventDefault();
        this.selectMacro(chosen.trigger);
      }
    }
  }

  protected selectMacro(trigger: string): void {
    if (this.effectiveReadOnly()) return;
    this.scheduleSync();
    this.intent.emit({ type: 'macroSelected', trigger });
  }

  protected syncDom(): void {
    const el = this.noteRef()?.nativeElement;
    if (!el) return;
    const expected = this.model().value;
    if (el.value !== expected) el.value = expected;
    if (this.resolvedAutoResize()) {
      this.applyAutoResize(el);
    }
  }

  private applyAutoResize(target?: HTMLTextAreaElement): void {
    const el = target ?? this.noteRef()?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    if (el.scrollHeight > 0) {
      el.style.height = `${el.scrollHeight}px`;
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
