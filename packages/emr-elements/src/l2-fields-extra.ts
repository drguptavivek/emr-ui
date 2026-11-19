import { html, css, svg, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import {
  DEFAULT_ADDRESS_REQUIRED_PARTS,
  DEFAULT_ADDRESS_USE_OPTIONS,
  DEFAULT_ASPECT_PRESETS,
  DEFAULT_LATERALITY_CONFIRMATION_LABEL,
  DEFAULT_PARTIAL_DATE_PRECISION_OPTIONS,
  REFRACTION_DEFAULT_BOUNDS,
  adaptPartialDateForPrecision,
  extractActiveMacroTrigger,
  extractDurationPartValidation,
  formatByteSize,
  formatRefractionPartDisplay,
  formatSignatureAttestation,
  hasAnyAddressValue,
  hasMacroValidationState,
  hasPhoneClearableValue,
  hasRefractionValue,
  hasSignatureValidationState,
  isAddressPartInvalid,
  isPhoneExtensionVisible,
  isSignaturePadLocked,
  mapPointerToSignaturePoint,
  normalizeFieldFrameLayout,
  parsePairedNumberDraft,
  resolveAddressPartValidation,
  resolveAddressRootMessages,
  resolveDurationFieldConfig,
  resolveLateralityOptions,
  resolveLateralityValidation,
  resolvePairedNumberStep,
  resolvePairedSideMode,
  resolvePairedSideValidation,
  resolvePhonePartValidation,
  resolveRangeFieldMessages,
  resolveRangeSideValidation,
  resolveRefractionEyeDescription,
  resolveRefractionPartValidation,
  resolveSignatureCanvasGeometry,
  resolveVisualAcuityEyeDescription,
  resolveVisualAcuityPartValidation,
  sanitizePairedNumberText,
  stepPairedNumber,
  stepRefractionPart,
  type AddressFieldIntent,
  AddressFieldViewModel,
  AttachmentFieldIntent,
  AttachmentFieldViewModel,
  ClinicalAssessmentStatus,
  ClinicalAssessmentStatusOption,
  DurationFieldIntent,
  DurationFieldViewModel,
  EmrAcuityCorrection,
  EmrAcuityNotation,
  EmrAddressPart,
  EmrAddressUse,
  EmrAddressValue,
  EmrDateTimeDisplayFormat,
  EmrDateTimeWireFormat,
  EmrDurationUnit,
  EmrFieldDefinition,
  EmrFileSelectionItem,
  EmrImageCropResult,
  EmrLateralityCode,
  EmrOption,
  EmrPhoneChannel,
  EmrQuantityNumericMode,
  EmrQuantitySize,
  EmrRefractionPart,
  EmrSegmentedOption,
  EmrSegmentedSize,
  EmrSignaturePoint,
  EmrSignatureStroke,
  EmrTimeHourCycle,
  EmrTimePrecision,
  EmrUploadedImageItem,
  FieldFrameLayout,
  ImageFieldIntent,
  ImageFieldViewModel,
  LateralityFieldIntent,
  LateralityFieldViewModel,
  MacroTextFieldIntent,
  MacroTextFieldViewModel,
  PairedFieldIntent,
  PairedFieldMode,
  PairedFieldViewModel,
  PartialDateFieldIntent,
  PartialDateFieldViewModel,
  PhoneFieldIntent,
  PhoneFieldViewModel,
  RangeFieldIntent,
  RangeFieldViewModel,
  RefractionFieldIntent,
  RefractionFieldViewModel,
  ScaleFieldIntent,
  ScaleFieldViewModel,
  SignatureCaptureIntent,
  SignatureCaptureViewModel,
  VisualAcuityFieldIntent,
  VisualAcuityFieldViewModel,
} from '@drguptavivek/emr-controller';
import { EmrLitElement, defineEmrElement, emrShadowStyles } from './foundations.js';
import { renderEmrSvgIcon } from './icons.js';

let l2ExtraIdSeq = 0;
const nextL2ExtraId = (prefix: string): string => `${prefix}-${++l2ExtraIdSeq}`;

const l2ExtraStyles = css`
  .l2-stack {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .l2-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .l2-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .l2-grid-4 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(156px, 1fr));
    gap: 10px;
  }
  @media (max-width: 768px) {
    .l2-grid-2,
    .l2-grid-4 {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .sub-field {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .sub-label {
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-semibold);
    color: var(--emr-text-muted);
  }
  .va-context {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }
  .va-modifiers {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 10px 16px;
    min-width: 0;
  }
  .va-modifier {
    display: grid;
    gap: 4px;
    flex: 1 1 220px;
    min-width: 0;
    max-width: 100%;
  }
  .va-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    min-width: 0;
  }
  .va-grid--paired {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 640px) {
    .va-grid--paired {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .va-sub-label {
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    color: var(--emr-text-muted);
  }
  .status-strip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .attachment-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .attachment-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
  }
  .attachment-select-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0 8px;
    border: 0;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-semibold);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    text-align: left;
  }
  .attachment-select-btn:hover {
    background: var(--emr-primary-soft);
  }
  .attachment-select-btn:focus-visible,
  .macro-option:focus-visible,
  .sig-pad:focus-visible {
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }

  .sig-pad-wrap {
    position: relative;
    min-width: 0;
  }
  .sig-pad {
    display: block;
    width: 100%;
    max-width: 100%;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    touch-action: none;
    cursor: crosshair;
  }
  .sig-pad:hover:not(.sig-pad--readonly) {
    border-color: var(--emr-focus);
  }
  .sig-pad[data-invalid='true'] {
    border-color: var(--emr-danger);
  }
  .sig-pad[data-warning='true']:not([data-invalid='true']) {
    border-color: var(--emr-warning);
  }
  .sig-pad--readonly {
    background: var(--emr-surface-soft);
    border-style: dashed;
    cursor: default;
  }
  .sig-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    text-align: center;
    pointer-events: none;
    color: var(--emr-text-muted);
    font-size: var(--emr-text-sm);
  }
  .sig-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .sig-actions {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .sig-btn {
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .macro-wrap {
    position: relative;
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  .macro-wrap--open {
    z-index: 40;
  }
  .macro-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
  .macro-helper {
    margin: 0;
    font-size: var(--emr-text-2xs);
    color: var(--emr-text-muted);
  }
  .macro-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .macro-anchor {
    position: relative;
    min-width: 0;
  }
  .macro-popover {
    margin-top: 6px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    box-shadow: var(--emr-shadow);
    overflow: hidden;
  }
  .macro-popover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-inline: 12px 4px;
    border-bottom: 1px solid var(--emr-border);
    background: var(--emr-surface-accent);
  }
  .macro-popover-title {
    font-size: var(--emr-text-2xs);
    font-weight: var(--emr-weight-bold);
    color: var(--emr-text-muted);
    letter-spacing: 0.04em;
  }
  .macro-popover-close {
    min-width: 44px;
    min-height: 44px;
    width: 44px;
    height: 44px;
    border: 1px solid transparent;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-text-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .macro-popover-close:hover {
    background: var(--emr-surface-soft);
    color: var(--emr-text);
  }
  .macro-popover-close:focus-visible {
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }
  .macro-list {
    display: grid;
    gap: 4px;
    padding: 6px;
    max-height: 220px;
    overflow-y: auto;
  }
  .macro-option {
    width: 100%;
    min-height: 44px;
    padding: 8px 10px;
    border: 1px solid transparent;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    display: grid;
    gap: 2px;
    text-align: left;
    cursor: pointer;
  }
  .macro-option:hover,
  .macro-option[aria-selected="true"] {
    background: var(--emr-primary-soft);
    border-color: var(--emr-primary-border);
  }
  .macro-option-head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .macro-trigger {
    padding: 2px 6px;
    border-radius: var(--emr-radius-sm);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
    font-family: var(--emr-font-mono);
    font-size: var(--emr-text-2xs);
    font-weight: var(--emr-weight-bold);
  }
  .macro-category {
    margin-inline-start: auto;
    padding: 1px 6px;
    border-radius: 999px;
    border: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    font-size: var(--emr-text-2xs);
    color: var(--emr-text-muted);
  }
  .macro-empty {
    padding: 12px;
    font-size: var(--emr-text-sm);
    color: var(--emr-text-muted);
  }
  .macro-footer {
    display: flex;
    justify-content: flex-end;
  }
  .macro-counter {
    color: var(--emr-text-muted);
    font-size: var(--emr-text-2xs);
    font-variant-numeric: tabular-nums;
  }
  .macro-counter--warn {
    color: var(--emr-warning);
    font-weight: var(--emr-weight-semibold);
  }

  .pf-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
  }
  .pf-row .sub-field {
    flex: 1 1 88px;
    min-width: 88px;
  }
  .rf-row .sub-field {
    flex: 1 1 132px;
    min-width: 0;
  }
  .rf-row .sub-field--datetime {
    flex: 1 1 240px;
  }
  .pf-sep,
  .pf-unit {
    min-height: var(--emr-control-height);
    display: inline-flex;
    align-items: center;
    color: var(--emr-text-muted);
  }
  .pf-sep {
    font-weight: var(--emr-weight-bold);
  }
  .pf-unit {
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
  }
  .pf-affix {
    display: flex;
    align-items: stretch;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    min-height: var(--emr-control-height);
    overflow: hidden;
  }
  .pf-affix:focus-within {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: 2px;
  }
  .pf-affix[data-invalid="true"] {
    border-color: var(--emr-danger);
  }
  .pf-affix[data-warning="true"]:not([data-invalid="true"]) {
    border-color: var(--emr-warning);
  }
  .pf-affix[data-readonly="true"] {
    background: var(--emr-surface-soft);
    border-style: dashed;
  }
  .pf-affix-field {
    flex: 1 1 auto;
    min-width: 0;
    min-height: var(--emr-control-height);
    border: 0;
    padding: 0 8px;
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    font-variant-numeric: tabular-nums;
    text-align: center;
    outline: none;
  }
  .pf-affix-btn {
    min-width: 44px;
    min-height: var(--emr-control-height);
    border: 0;
    background: var(--emr-surface-raised);
    color: var(--emr-text);
    font: inherit;
    font-weight: var(--emr-weight-bold);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 10px;
  }
  .pf-affix-btn--leading {
    border-inline-end: 1px solid var(--emr-border);
  }
  .pf-affix-btn--trailing {
    border-inline-start: 1px solid var(--emr-border);
  }
  .pf-affix-btn:hover:not(:disabled) {
    background: var(--emr-primary-hover);
  }
  .pf-affix-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .pf-clear {
    min-width: 44px;
    min-height: var(--emr-control-height);
    width: var(--emr-control-height);
    height: var(--emr-control-height);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    cursor: pointer;
  }
  .pf-clear:hover {
    border-color: var(--emr-focus);
    color: var(--emr-text);
    background: var(--emr-surface-soft);
  }
  .pf-clear:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
    outline-offset: 2px;
  }
  .pf-row--lg .emr-control,
  .pf-row--lg .pf-affix,
  .pf-row--lg .pf-affix-field,
  .pf-row--lg .pf-affix-btn,
  .pf-row--lg .pf-clear,
  .pf-row--lg .pf-sep,
  .pf-row--lg .pf-unit,
  .ref-lg .pf-affix,
  .ref-lg .pf-affix-field,
  .ref-lg .pf-affix-btn,
  .ref-lg .pf-clear {
    min-height: 48px;
    height: 48px;
  }
  .ref-lg .pf-affix-btn,
  .ref-lg .pf-clear {
    min-width: 48px;
  }
  .ref-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .ref-clear {
    margin-inline-start: auto;
  }
  .ref-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(196px, 1fr));
    gap: 10px;
    min-width: 0;
  }
  .ref-affix {
    width: 100%;
    min-width: 0;
    transition: border-color 120ms ease;
  }
  .ref-affix:hover:not([data-readonly="true"]):not([data-invalid="true"]):not([data-warning="true"]) {
    border-color: var(--emr-border-strong, var(--emr-focus));
  }
  .ref-unit {
    display: inline-flex;
    align-items: center;
    padding: 0 7px;
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
    border-inline-start: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    white-space: nowrap;
    flex: 0 0 auto;
  }
  :host-context(.emr-print) .ref-unit {
    background: transparent;
  }
  .ph-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .ph-row--sm .emr-control {
    font-size: var(--emr-text-sm);
  }
  .ph-row--lg {
    --emr-control-height: 48px;
  }
  .ph-row--lg .emr-control,
  .ph-row--lg .pf-clear {
    min-height: 48px;
    height: 48px;
  }
  .ph-row--lg .pf-clear {
    min-width: 48px;
    width: 48px;
  }
  .ph-country {
    flex: 0 1 auto;
    min-width: 120px;
    max-width: 100%;
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
    border-radius: var(--emr-radius);
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
  .ph-channel[aria-checked="true"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
    font-weight: var(--emr-weight-semibold);
  }
  .ph-channel[aria-readonly="true"] {
    background: var(--emr-surface-soft);
    border-style: dashed;
    cursor: default;
  }
  .ph-channel[data-invalid="true"] {
    border-color: var(--emr-danger);
  }
  .ph-channel[data-warning="true"]:not([data-invalid="true"]) {
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
  .ph-channel[aria-checked="true"] .ph-channel-box {
    border-color: var(--emr-primary);
    background: var(--emr-primary);
    color: var(--emr-on-primary);
  }
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
  .addr-postal {
    font-variant-numeric: tabular-nums;
  }
  @media (max-width: 640px) {
    .addr-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;

function renderAssessmentStatusStrip(
  status: ClinicalAssessmentStatus | undefined,
  options: readonly ClinicalAssessmentStatusOption[] | undefined,
  locked: boolean,
  onChange: (next: ClinicalAssessmentStatus | undefined) => void,
) {
  const opts = options ?? [];
  if (!status && opts.length === 0) return nothing;
  const activeOpt = opts.find(o => o.value === status);
  const badgeTone = activeOpt?.tone ?? 'neutral';
  const badgeLabel = activeOpt?.label ?? status ?? '';

  return html`<div class="status-strip" role="group" aria-label="Assessment status">
    ${status ? html`<span class=${`emr-badge emr-badge--${badgeTone}`}>${badgeLabel}</span>` : nothing}
    ${!locked && opts.length > 0
      ? opts.map(
          opt => html`<button
            type="button"
            class="emr-btn emr-btn--secondary emr-btn--sm"
            aria-pressed=${String(status === opt.value)}
            @click=${() => onChange(status === opt.value ? undefined : opt.value)}
          >${opt.label}</button>`,
        )
      : nothing}
  </div>`;
}

/** 1. EmrScaleFieldElement (`emr-scale-field`) */
export class EmrScaleFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-scale-field');

  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) layout: 'vertical' | 'horizontal' | 'inline' = 'vertical';
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ attribute: false }) definition?: ScaleFieldViewModel['definition'];
  @property({ attribute: false }) model?: ScaleFieldViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const resolvedDef = this.definition ?? m.definition;
    const resolvedLabel = m.label || resolvedDef?.presentation?.label || '';
    const resolvedVariant = m.variant ?? (resolvedDef?.presentation?.widget === 'vas' ? 'vas' : 'likert');
    const locked = this.readOnly || !!m.readOnly || !!resolvedDef?.contract?.readOnly;
    const minCard = resolvedDef?.contract?.cardinality?.min;
    const required = Boolean(m.required || (minCard !== undefined && minCard >= 1));
    const resolvedTone = (m.value !== null ? m.optionTones?.[m.value] : undefined) ?? m.tone ?? 'neutral';
    const firstError = m.messages?.find(msg => msg.severity === 'error')?.message ?? '';
    const firstWarning = m.messages?.find(msg => msg.severity === 'warning')?.message ?? '';

    return html`<emr-field-frame
      .controlId=${id}
      .label=${resolvedLabel}
      .labelHidden=${this.labelHidden}
      .labelNamesControl=${false}
      .layout=${this.layout}
      .showMetadata=${this.showMetadata}
      .unit=${m.unit ?? resolvedDef?.presentation?.unitDisplay ?? ''}
      .readOnly=${locked}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      .assessmentStatus=${m.status}
      .assessmentStatusOptions=${m.statusOptions ?? []}
      ?required=${required}
      @intent=${(e: CustomEvent<{ type?: string; status?: ClinicalAssessmentStatus }>) => {
        if (e.detail?.type === 'statusChangeRequested') {
          e.stopPropagation();
          if (!locked) {
            this.emitIntent<ScaleFieldIntent>({ type: 'statusChangeRequested', status: e.detail.status });
          }
        }
      }}
    >
      <div class="l2-stack">
        ${resolvedVariant === 'vas'
          ? html`<emr-vas
              .controlId=${`${id}-control`}
              .label=${resolvedLabel}
              .labelHidden=${true}
              .value=${m.value}
              .min=${m.min}
              .max=${m.max}
              .step=${m.step}
              .majorInterval=${m.majorInterval ?? 10}
              .minorInterval=${m.minorInterval ?? 2}
              .orientation=${m.orientation ?? 'horizontal'}
              .anchors=${m.anchors}
              .tone=${resolvedTone}
              .readOnly=${locked}
              .required=${required}
              .error=${firstError}
              .warning=${!firstError ? firstWarning : ''}
              .hint=${m.hint ?? ''}
              @valueChange=${(e: CustomEvent<number | null>) => {
                e.stopPropagation();
                if (!locked) {
                  this.emitIntent<ScaleFieldIntent>({ type: 'valueChangeRequested', value: e.detail });
                }
              }}
            ></emr-vas>`
          : html`<emr-likert
              .controlId=${`${id}-control`}
              .label=${resolvedLabel}
              .labelHidden=${true}
              .value=${m.value}
              .min=${m.min}
              .max=${m.max}
              .step=${m.step ?? 1}
              .anchors=${m.anchors}
              .optionTones=${m.optionTones}
              .tone=${resolvedTone}
              .readOnly=${locked}
              .required=${required}
              .error=${firstError}
              .warning=${!firstError ? firstWarning : ''}
              .hint=${m.hint ?? ''}
              @valueChange=${(e: CustomEvent<number>) => {
                e.stopPropagation();
                if (!locked) {
                  this.emitIntent<ScaleFieldIntent>({ type: 'valueChangeRequested', value: e.detail });
                }
              }}
            ></emr-likert>`}
        ${m.value !== null && !locked && m.clearable !== false
          ? html`<div class="l2-row">
              <button
                type="button"
                class="emr-btn emr-btn--ghost emr-btn--sm"
                style="min-height:44px;min-width:44px;display:inline-flex;align-items:center;gap:6px;"
                aria-label=${`Clear ${resolvedLabel}`}
                @click=${() => {
                  if (!locked) {
                    this.emitIntent<ScaleFieldIntent>({ type: 'valueChangeRequested', value: null });
                  }
                }}
              >${renderEmrSvgIcon('close', 14)}<span>Clear</span></button>
            </div>`
          : nothing}
      </div>
    </emr-field-frame>`;
  }
}

/** 2. EmrPartialDateFieldElement (`emr-partial-date-field`) */
export class EmrPartialDateFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-partial-date');

  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) layout: 'vertical' | 'horizontal' | 'inline' = 'vertical';
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: String }) defaultPrecision: 'year' | 'month' | 'day' = 'day';
  @property({ type: String }) displayFormat: 'dd-mm-yyyy' | 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'mm/dd/yyyy' = 'dd-mm-yyyy';
  @property({ type: Boolean }) clearable = true;
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ attribute: false }) definition?: PartialDateFieldViewModel['definition'];
  @property({ attribute: false }) model?: PartialDateFieldViewModel;

  @state() private draftPrecision?: 'year' | 'month' | 'day';

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const resolvedDef = this.definition ?? m.definition;
    const resolvedLabel = m.label || resolvedDef?.presentation?.label || '';
    const locked = this.readOnly || !!m.readOnly || !!resolvedDef?.contract?.readOnly;
    const minCard = resolvedDef?.contract?.cardinality?.min;
    const required = Boolean(m.required || (minCard !== undefined && minCard >= 1));
    const precision = m.value?.precision ?? this.draftPrecision ?? m.defaultPrecision ?? this.defaultPrecision;
    const firstError = m.messages?.find(msg => msg.severity === 'error')?.message ?? '';
    const resolvedDisplayFormat = m.displayFormat ?? this.displayFormat;
    const resolvedClearable = m.clearable ?? this.clearable;

    return html`<emr-field-frame
      .controlId=${id}
      .label=${resolvedLabel}
      .labelHidden=${this.labelHidden}
      .labelNamesControl=${false}
      .layout=${this.layout}
      .showMetadata=${this.showMetadata}
      .readOnly=${locked}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      .assessmentStatus=${m.status}
      .assessmentStatusOptions=${m.statusOptions ?? []}
      ?required=${required}
      @intent=${(e: CustomEvent<{ type?: string; status?: ClinicalAssessmentStatus }>) => {
        if (e.detail?.type === 'statusChangeRequested') {
          e.stopPropagation();
          if (!locked) {
            this.emitIntent<PartialDateFieldIntent>({ type: 'statusChangeRequested', status: e.detail.status });
          }
        }
      }}
    >
      <div class="l2-stack">
        <emr-segmented-control
          .controlId=${`${id}-precision`}
          .label=${`${resolvedLabel} precision`}
          .labelHidden=${true}
          .options=${DEFAULT_PARTIAL_DATE_PRECISION_OPTIONS}
          .value=${precision}
          .readOnly=${locked}
          @valueChange=${(e: CustomEvent<string>) => {
            e.stopPropagation();
            if (locked) return;
            const next = e.detail as 'year' | 'month' | 'day';
            this.draftPrecision = next;
            this.emitIntent<PartialDateFieldIntent>({
              type: 'precisionChangeRequested',
              precision: next,
            });
            if (m.value) {
              this.emitIntent<PartialDateFieldIntent>({
                type: 'valueChangeRequested',
                value: adaptPartialDateForPrecision(m.value, next),
              });
            }
          }}
        ></emr-segmented-control>
        <div class="l2-row">
          <emr-date-input
            .controlId=${`${id}-control`}
            .label=${resolvedLabel}
            .labelHidden=${true}
            .precision=${precision}
            .displayFormat=${resolvedDisplayFormat}
            .value=${m.value?.value ?? null}
            .min=${m.min ?? ''}
            .max=${m.max ?? ''}
            .required=${required}
            .error=${firstError}
            .hint=${m.hint ?? ''}
            .readOnly=${locked}
            @valueChange=${(e: CustomEvent<string | null>) => {
              e.stopPropagation();
              if (!locked) {
                this.emitIntent<PartialDateFieldIntent>({
                  type: 'valueChangeRequested',
                  value: e.detail ? { value: e.detail, precision } : null,
                });
              }
            }}
          ></emr-date-input>
          ${m.value !== null && !locked && resolvedClearable
            ? html`<button
                type="button"
                class="emr-btn emr-btn--ghost emr-btn--sm"
                style="min-height:44px;min-width:44px;display:inline-flex;align-items:center;gap:6px;"
                aria-label=${`Clear ${resolvedLabel}`}
                @click=${() => {
                  if (!locked) {
                    this.emitIntent<PartialDateFieldIntent>({ type: 'valueChangeRequested', value: null });
                  }
                }}
              >${renderEmrSvgIcon('close', 14)}<span>Clear</span></button>`
            : nothing}
        </div>
      </div>
    </emr-field-frame>`;
  }
}

/** 3. EmrAttachmentFieldElement (`emr-attachment-field`) */
export class EmrAttachmentFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-attachment-field');

  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) layout: 'vertical' | 'horizontal' | 'inline' = 'vertical';
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ attribute: false }) definition?: AttachmentFieldViewModel['definition'];
  @property({ attribute: false }) model?: AttachmentFieldViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const resolvedDef = this.definition ?? m.definition;
    const resolvedLabel = m.label || resolvedDef?.presentation?.label || '';
    const locked = this.readOnly || !!m.readOnly || !!resolvedDef?.contract?.readOnly;
    const minCard = resolvedDef?.contract?.cardinality?.min;
    const maxCard = resolvedDef?.contract?.cardinality?.max;
    const required = Boolean(m.required || (minCard !== undefined && minCard >= 1));
    const effectiveMaxItems = m.maxItems ?? (typeof maxCard === 'number' ? maxCard : undefined);
    const effectiveMultiple = m.multiple ?? effectiveMaxItems !== 1;
    const atCapacity = effectiveMaxItems !== undefined && m.items.length >= effectiveMaxItems;
    const firstError = m.messages?.find(msg => msg.severity === 'error')?.message ?? '';

    return html`<emr-field-frame
      .controlId=${id}
      .label=${resolvedLabel}
      .labelHidden=${this.labelHidden}
      .labelNamesControl=${false}
      .layout=${m.layout ?? this.layout}
      .showMetadata=${this.showMetadata || Boolean(m.showMetadata)}
      .readOnly=${locked}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      .assessmentStatus=${m.status}
      .assessmentStatusOptions=${m.statusOptions ?? []}
      ?required=${required}
      @intent=${(e: CustomEvent<{ type?: string; status?: ClinicalAssessmentStatus }>) => {
        if (e.detail?.type === 'statusChangeRequested') {
          e.stopPropagation();
          if (!locked) {
            this.emitIntent<AttachmentFieldIntent>({ type: 'statusChangeRequested', status: e.detail.status });
          }
        }
      }}
    >
      <div class="l2-stack">
        ${m.items.length > 0
          ? html`<ul class="attachment-list" aria-label=${`${resolvedLabel} attachments`}>
              ${m.items.map(item => {
                const meta = [item.contentType, formatByteSize(item.sizeBytes), item.uploadedAt]
                  .filter(Boolean)
                  .join(' · ');
                return html`<li class="attachment-item">
                  <button
                    type="button"
                    class="attachment-select-btn"
                    aria-label=${`Open ${item.title}`}
                    @click=${() => this.emitIntent<AttachmentFieldIntent>({ type: 'itemSelected', id: item.id })}
                  >
                    ${renderEmrSvgIcon('file', 16)}
                    <span>${item.title}</span>
                  </button>
                  <div class="l2-row">
                    ${meta ? html`<span class="emr-muted">${meta}</span>` : nothing}
                    ${item.statusBadge ? html`<emr-badge .badge=${item.statusBadge}></emr-badge>` : nothing}
                    ${!locked
                      ? html`<button
                          type="button"
                          data-emr-print="hide"
                          class="emr-btn emr-btn--ghost emr-btn--sm"
                          style="min-height:44px;min-width:44px;display:inline-flex;align-items:center;gap:6px;"
                          aria-label=${`Remove ${item.title}`}
                          @click=${() => {
                            if (!locked) {
                              this.emitIntent<AttachmentFieldIntent>({ type: 'itemRemoveRequested', id: item.id });
                            }
                          }}
                        >${renderEmrSvgIcon('trash', 15)}<span>Remove</span></button>`
                      : nothing}
                  </div>
                </li>`;
              })}
            </ul>`
          : locked && !m.status
            ? html`<span class="emr-muted">No attachments recorded.</span>`
            : nothing}

        ${!locked
          ? html`<div class="l2-row" data-emr-print="hide">
              <emr-file-trigger
                .controlId=${`${id}-trigger`}
                .label=${resolvedLabel}
                .labelHidden=${true}
                .accept=${m.accept ?? ''}
                .multiple=${effectiveMultiple}
                .disabled=${atCapacity}
                .error=${firstError}
                .hint=${effectiveMaxItems !== undefined ? `${m.items.length} of ${effectiveMaxItems} attached` : ''}
                @filesSelected=${(e: CustomEvent<readonly EmrFileSelectionItem[]>) => {
                  e.stopPropagation();
                  if (!locked && !atCapacity) {
                    this.emitIntent<AttachmentFieldIntent>({ type: 'filesSelected', files: e.detail });
                  }
                }}
                @nativeFilesSelected=${(e: CustomEvent<readonly File[]>) => {
                  e.stopPropagation();
                  if (!locked && !atCapacity) {
                    this.dispatchEvent(new CustomEvent('nativeFilesSelected', { detail: e.detail, bubbles: true, composed: true }));
                  }
                }}
              ></emr-file-trigger>
              ${m.allowCamera
                ? html`
                    <button
                      type="button"
                      class="emr-btn emr-btn--outline"
                      style="min-height:44px;min-width:44px;"
                      ?disabled=${atCapacity}
                      aria-label=${`Capture photo for ${resolvedLabel}`}
                      @click=${() => {
                        if (!locked && !atCapacity) {
                          this.emitIntent<AttachmentFieldIntent>({ type: 'captureRequested', mode: 'camera' });
                        }
                      }}
                    >${renderEmrSvgIcon('camera', 16)}<span>Camera</span></button>
                    <button
                      type="button"
                      class="emr-btn emr-btn--outline"
                      style="min-height:44px;min-width:44px;"
                      ?disabled=${atCapacity}
                      aria-label=${`Scan document for ${resolvedLabel}`}
                      @click=${() => {
                        if (!locked && !atCapacity) {
                          this.emitIntent<AttachmentFieldIntent>({ type: 'captureRequested', mode: 'scanner' });
                        }
                      }}
                    >${renderEmrSvgIcon('scanner', 16)}<span>Scanner</span></button>
                  `
                : nothing}
            </div>`
          : nothing}
      </div>
    </emr-field-frame>`;
  }
}

/** 4. EmrPairedFieldElement (`emr-paired-field`) */
export class EmrPairedFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-paired-field');

  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) layout: 'vertical' | 'horizontal' | 'inline' = 'vertical';
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: Boolean }) clearable?: boolean;
  @property({ attribute: false }) definition?: PairedFieldViewModel['definition'];
  @property({ attribute: false }) model?: PairedFieldViewModel;

  private firstDraft?: { text: string; base: string | number | null; parsed: string | number | null | undefined };
  private secondDraft?: { text: string; base: string | number | null; parsed: string | number | null | undefined };

  private emitFocus(focused: boolean): void {
    this.dispatchEvent(new CustomEvent(focused ? 'focused' : 'blurred', { bubbles: true, composed: true }));
  }

  private renderSide(params: {
    part: 'first' | 'second';
    inputId: string;
    sideLabel: string;
    placeholder: string;
    mode: PairedFieldMode;
    min: number | undefined;
    max: number | undefined;
    step: number | undefined;
    precision: number | undefined;
    maxLength: number | undefined;
    required: boolean;
    locked: boolean;
    hasError: boolean;
    hasWarning: boolean;
    describedBy: string | undefined;
    showSteppers: boolean;
    rawValue: string | number | null;
  }) {
    const {
      part,
      inputId,
      sideLabel,
      placeholder,
      mode,
      min,
      max,
      step,
      precision,
      maxLength,
      required,
      locked,
      hasError,
      hasWarning,
      describedBy,
      showSteppers,
      rawValue,
    } = params;
    const isNumeric = mode !== 'text';
    const externalText = rawValue == null ? '' : String(rawValue);
    const activeDraft = part === 'first' ? this.firstDraft : this.secondDraft;
    if (locked) {
      if (part === 'first') this.firstDraft = undefined;
      else this.secondDraft = undefined;
    } else if (activeDraft && rawValue !== activeDraft.base && rawValue !== activeDraft.parsed) {
      if (part === 'first') this.firstDraft = undefined;
      else this.secondDraft = undefined;
    }
    const currentDraft = part === 'first' ? this.firstDraft : this.secondDraft;
    const displayedText =
      !locked && currentDraft && (rawValue === currentDraft.base || rawValue === currentDraft.parsed)
        ? currentDraft.text
        : externalText;
    const numericCur = typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : null;
    const effStep = isNumeric ? resolvePairedNumberStep({ mode, precision, step }) : 1;
    const canDec = !locked && isNumeric && (min === undefined || numericCur === null || numericCur - effStep >= min - 1e-9);
    const canInc = !locked && isNumeric && (max === undefined || numericCur === null || numericCur + effStep <= max + 1e-9);

    const stepBy = (delta: -1 | 1) => {
      if (locked || !isNumeric) return;
      if (part === 'first') this.firstDraft = undefined;
      else this.secondDraft = undefined;
      const next = stepPairedNumber({ current: numericCur, delta, mode, step, precision, min, max });
      this.emitIntent<PairedFieldIntent>({
        type: part === 'first' ? 'firstChangeRequested' : 'secondChangeRequested',
        value: next,
      });
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (locked) {
        target.value = externalText;
        return;
      }
      if (mode === 'text') {
        const next = target.value === '' ? null : target.value;
        if (part === 'first') {
          this.firstDraft = { text: target.value, base: rawValue, parsed: next };
          this.emitIntent<PairedFieldIntent>({ type: 'firstChangeRequested', value: next });
        } else {
          this.secondDraft = { text: target.value, base: rawValue, parsed: next };
          this.emitIntent<PairedFieldIntent>({ type: 'secondChangeRequested', value: next });
        }
        return;
      }
      const clean = sanitizePairedNumberText(target.value, mode);
      if (target.value !== clean) {
        target.value = clean;
      }
      const parsed = parsePairedNumberDraft(clean, mode);
      const draftObj = {
        text: clean,
        base: rawValue,
        parsed: parsed.complete ? parsed.value : undefined,
      };
      if (part === 'first') this.firstDraft = draftObj;
      else this.secondDraft = draftObj;
      if (parsed.complete) {
        this.emitIntent<PairedFieldIntent>({
          type: part === 'first' ? 'firstChangeRequested' : 'secondChangeRequested',
          value: parsed.value,
        });
      }
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (locked || !isNumeric) return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        stepBy(1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        stepBy(-1);
      }
    };

    const handleBlur = (e: Event) => {
      if (part === 'first') this.firstDraft = undefined;
      else this.secondDraft = undefined;
      (e.target as HTMLInputElement).value = externalText;
      this.emitFocus(false);
    };

    const handleWheel = (e: WheelEvent) => {
      if (isNumeric) {
        (e.currentTarget as HTMLInputElement).blur();
      }
    };

    const inputEl = (cls: string) => html`<input
      id=${inputId}
      class=${cls}
      type="text"
      role=${isNumeric ? 'spinbutton' : nothing}
      inputmode=${mode === 'integer' ? 'numeric' : mode === 'decimal' ? 'decimal' : nothing}
      .value=${live(displayedText)}
      .placeholder=${placeholder}
      maxlength=${maxLength ?? nothing}
      aria-valuemin=${isNumeric && min !== undefined ? String(min) : nothing}
      aria-valuemax=${isNumeric && max !== undefined ? String(max) : nothing}
      aria-valuenow=${isNumeric && numericCur !== null ? String(numericCur) : nothing}
      ?required=${required}
      ?readonly=${locked}
      aria-required=${required ? 'true' : nothing}
      aria-readonly=${locked ? 'true' : nothing}
      aria-invalid=${hasError ? 'true' : nothing}
      data-warning=${!hasError && hasWarning ? 'true' : nothing}
      aria-describedby=${describedBy || nothing}
      @wheel=${handleWheel}
      @keydown=${handleKeydown}
      @input=${handleInput}
      @focus=${() => this.emitFocus(true)}
      @blur=${handleBlur}
    />`;

    return html`<div class="sub-field">
      <label class="sub-label" for=${inputId}>
        ${sideLabel}${required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
      </label>
      ${showSteppers && isNumeric
        ? html`<div
            class="pf-affix"
            data-invalid=${hasError ? 'true' : nothing}
            data-warning=${!hasError && hasWarning ? 'true' : nothing}
            data-readonly=${locked ? 'true' : nothing}
          >
            <button
              type="button"
              class="pf-affix-btn pf-affix-btn--leading"
              ?disabled=${locked || !canDec}
              aria-label=${`Decrease ${sideLabel}`}
              @click=${() => stepBy(-1)}
            >−</button>
            ${inputEl('pf-affix-field')}
            <button
              type="button"
              class="pf-affix-btn pf-affix-btn--trailing"
              ?disabled=${locked || !canInc}
              aria-label=${`Increase ${sideLabel}`}
              @click=${() => stepBy(1)}
            >+</button>
          </div>`
        : inputEl('emr-control')}
    </div>`;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const resolvedDef = this.definition ?? m.definition;
    const resolvedLabel = m.label || resolvedDef?.presentation?.label || '';
    const resolvedUnit = m.unit ?? resolvedDef?.presentation?.unitDisplay;
    const resolvedLayout = m.layout ?? this.layout;
    const resolvedShowMetadata = this.showMetadata && m.showMetadata !== false;
    const resolvedSize = m.size ?? this.size;
    const resolvedClearable = this.clearable ?? m.clearable ?? false;
    const locked = !!(this.readOnly || m.readOnly || resolvedDef?.contract?.readOnly);
    const firstLocked = locked || !!m.firstReadOnly;
    const secondLocked = locked || !!m.secondReadOnly;
    const minCard = resolvedDef?.contract?.cardinality?.min;
    const resolvedRequired = Boolean(m.required || (minCard !== undefined && minCard >= 1));
    const firstRequired = m.firstRequired ?? resolvedRequired;
    const secondRequired = m.secondRequired ?? resolvedRequired;
    const firstMode = resolvePairedSideMode(m.firstMode, m.mode, resolvedDef);
    const secondMode = resolvePairedSideMode(m.secondMode, m.mode, resolvedDef);
    const sv = resolvePairedSideValidation(m.messages);
    const hasMessage = Boolean(m.hint || m.messages?.length);
    const describedBy = hasMessage ? `${id}-message` : undefined;
    const sep = m.separator ?? '/';
    const firstVal = m.value?.first ?? null;
    const secondVal = m.value?.second ?? null;
    const showClear =
      resolvedClearable &&
      !locked &&
      ((!firstLocked && firstVal !== null && firstVal !== '') ||
        (!secondLocked && secondVal !== null && secondVal !== ''));

    return html`<emr-field-frame
      .controlId=${id}
      .label=${resolvedLabel}
      .labelHidden=${this.labelHidden}
      .labelNamesControl=${false}
      .layout=${resolvedLayout}
      .showMetadata=${resolvedShowMetadata}
      .readOnly=${locked}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      .assessmentStatus=${m.status}
      .assessmentStatusOptions=${m.statusOptions ?? []}
      ?required=${resolvedRequired}
      @intent=${(e: CustomEvent<{ type?: string; status?: ClinicalAssessmentStatus }>) => {
        if (e.detail?.type === 'statusChangeRequested') {
          e.stopPropagation();
          if (!locked) {
            this.emitIntent<PairedFieldIntent>({ type: 'statusChangeRequested', status: e.detail.status });
          }
        }
      }}
    >
      <div class="l2-stack">
        <div
          class=${`pf-row${resolvedSize === 'lg' ? ' pf-row--lg' : ''}`}
          role="group"
          aria-labelledby=${this.headingId || nothing}
          aria-label=${resolvedLabel}
        >
          ${this.renderSide({
            part: 'first',
            inputId: `${id}-first`,
            sideLabel: m.firstLabel,
            placeholder: m.firstPlaceholder ?? '',
            mode: firstMode,
            min: m.firstMin ?? m.min,
            max: m.firstMax ?? m.max,
            step: m.firstStep ?? m.step,
            precision: m.firstPrecision ?? m.precision,
            maxLength: m.firstMaxLength ?? m.maxLength,
            required: firstRequired,
            locked: firstLocked,
            hasError: sv.firstHasError,
            hasWarning: sv.firstHasWarning,
            describedBy,
            showSteppers: m.showSteppers === true,
            rawValue: firstVal,
          })}
          <strong class="pf-sep" aria-hidden="true">${sep}</strong>
          ${this.renderSide({
            part: 'second',
            inputId: `${id}-second`,
            sideLabel: m.secondLabel,
            placeholder: m.secondPlaceholder ?? '',
            mode: secondMode,
            min: m.secondMin ?? m.min,
            max: m.secondMax ?? m.max,
            step: m.secondStep ?? m.step,
            precision: m.secondPrecision ?? m.precision,
            maxLength: m.secondMaxLength ?? m.maxLength,
            required: secondRequired,
            locked: secondLocked,
            hasError: sv.secondHasError,
            hasWarning: sv.secondHasWarning,
            describedBy,
            showSteppers: m.showSteppers === true,
            rawValue: secondVal,
          })}
          ${resolvedUnit ? html`<span class="pf-unit" aria-hidden="true">${resolvedUnit}</span>` : nothing}
          ${showClear
            ? html`<button
                type="button"
                class="pf-clear"
                data-emr-print="hide"
                aria-label=${`Clear ${resolvedLabel}`}
                @click=${() => {
                  if (!locked) {
                    this.firstDraft = undefined;
                    this.secondDraft = undefined;
                    this.emitIntent<PairedFieldIntent>({ type: 'clearRequested' });
                  }
                }}
              >${renderEmrSvgIcon('close', 14)}</button>`
            : nothing}
        </div>
      </div>
    </emr-field-frame>`;
  }
}

/** 5. EmrDurationInputElement (`emr-duration-input`) */
export class EmrDurationInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-duration-input');

  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) layout?: FieldFrameLayout;
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: String }) size?: EmrQuantitySize;
  @property({ type: Boolean }) clearable?: boolean;
  @property({ type: Boolean }) showSteppers?: boolean;
  @property({ type: String }) mode?: EmrQuantityNumericMode;
  @property({ type: Number }) precision?: number;
  @property({ type: String }) placeholder?: string;
  @property({ type: String }) unitPlaceholder?: string;
  @property({ type: String }) hint?: string;
  @property({ type: String }) warning = '';
  @property({ type: String }) error = '';
  @property({ attribute: false }) definition?: EmrFieldDefinition;
  @property({ attribute: false }) model?: DurationFieldViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const cfg = resolveDurationFieldConfig(m, {
      definition: this.definition,
      layout: this.layout,
      showMetadata: this.showMetadata,
      readOnly: this.readOnly,
      size: this.size,
      clearable: this.clearable,
      showSteppers: this.showSteppers,
      mode: this.mode,
      precision: this.precision,
      placeholder: this.placeholder,
      unitPlaceholder: this.unitPlaceholder,
      hint: this.hint,
      labelHidden: this.labelHidden,
    });
    const pv = extractDurationPartValidation(m.messages, {
      error: this.error,
      warning: this.warning,
    });
    const unitOpts: EmrOption[] = m.unitOptions.map((u) => ({
      value: u.value,
      label: u.label,
    }));
    const hasMessage = Boolean(cfg.hint || this.warning || this.error || m.messages?.length);
    const describedBy = hasMessage ? `${id}-message` : '';

    return html`<emr-field-frame
      .controlId=${id}
      .label=${cfg.label}
      .labelHidden=${cfg.labelHidden}
      .labelNamesControl=${false}
      .layout=${cfg.layout}
      .showMetadata=${cfg.showMetadata}
      .readOnly=${cfg.readOnly}
      .hint=${cfg.hint ?? ''}
      .warning=${this.warning}
      .error=${this.error}
      .messages=${m.messages ?? []}
      .assessmentStatus=${m.status}
      .assessmentStatusOptions=${m.statusOptions ?? []}
      ?required=${cfg.required}
      @intent=${(e: CustomEvent<{ type?: string; status?: ClinicalAssessmentStatus }>) => {
        if (e.detail?.type === 'statusChangeRequested') {
          e.stopPropagation();
          if (!cfg.readOnly) {
            this.emitIntent<DurationFieldIntent>({
              type: 'statusChangeRequested',
              status: e.detail.status,
            });
          }
        }
      }}
    >
      <div class="l2-stack">
        <div
          role="group"
          aria-labelledby=${this.headingId || nothing}
          aria-label=${cfg.label || nothing}
        >
          <emr-quantity-input
            .controlId=${id}
            .label=${cfg.label}
            .labelHidden=${true}
            .ariaDescribedBy=${describedBy}
            .value=${m.value?.amount ?? null}
            .unit=${m.value?.unit ?? null}
            .units=${unitOpts}
            .mode=${cfg.mode}
            .precision=${cfg.precision}
            .min=${cfg.min}
            .max=${cfg.max}
            .step=${cfg.step}
            .allowNegative=${cfg.allowNegative}
            .showSteppers=${cfg.showSteppers}
            .size=${cfg.size}
            .clearable=${cfg.clearable}
            .clearEmitsChanges=${false}
            .placeholder=${cfg.placeholder}
            .unitPlaceholder=${cfg.unitPlaceholder}
            .unitLabel=${cfg.unitLabel}
            .required=${cfg.required}
            .readOnly=${cfg.readOnly}
            .valueError=${pv.amountError}
            .unitError=${pv.unitError}
            .valueWarning=${pv.amountWarning}
            .unitWarning=${pv.unitWarning}
            @valueChange=${(e: CustomEvent<number | null>) => {
              e.stopPropagation();
              if (!cfg.readOnly) {
                this.emitIntent<DurationFieldIntent>({
                  type: 'amountChangeRequested',
                  amount: e.detail,
                });
              }
            }}
            @unitChange=${(e: CustomEvent<string | null>) => {
              e.stopPropagation();
              if (cfg.readOnly) return;
              if (e.detail == null) {
                this.emitIntent<DurationFieldIntent>({ type: 'clearRequested' });
                this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
                return;
              }
              this.emitIntent<DurationFieldIntent>({
                type: 'unitChangeRequested',
                unit: e.detail as EmrDurationUnit,
              });
            }}
            @cleared=${(e: Event) => {
              e.stopPropagation();
              if (!cfg.readOnly) {
                this.emitIntent<DurationFieldIntent>({ type: 'clearRequested' });
                this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
              }
            }}
            @focused=${(e: Event) => {
              e.stopPropagation();
              this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
            }}
            @blurred=${(e: Event) => {
              e.stopPropagation();
              this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
            }}
            @submitted=${(e: Event) => {
              e.stopPropagation();
              this.dispatchEvent(new CustomEvent('submitted', { bubbles: true, composed: true }));
            }}
          ></emr-quantity-input>
        </div>
      </div>
    </emr-field-frame>`;
  }
}

/** 6. EmrRangeFieldElement (`emr-range-field`) */
export class EmrRangeFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-range-field');

  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) layout: FieldFrameLayout = 'vertical';
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: Boolean }) clearable?: boolean;
  @property({ type: Boolean }) showSteppers?: boolean;
  @property({ type: String }) displayFormat: EmrDateTimeDisplayFormat = 'dd-mm-yyyy';
  @property({ type: String }) timePrecision: EmrTimePrecision = 'minute';
  @property({ type: String }) hourCycle: EmrTimeHourCycle = '24';
  @property({ type: String }) wireFormat: EmrDateTimeWireFormat = 'utc';
  @property({ attribute: false }) definition?: RangeFieldViewModel['definition'];
  @property({ attribute: false }) model?: RangeFieldViewModel;

  private lowDraft?: { text: string; base: number | string | null; parsed: number | null | undefined };
  private highDraft?: { text: string; base: number | string | null; parsed: number | null | undefined };
  private focusInside = false;

  private onGroupFocusIn(): void {
    if (!this.focusInside) {
      this.focusInside = true;
      this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
    }
  }

  private onGroupFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    const cur = event.currentTarget as HTMLElement | null;
    if (next && cur?.contains(next)) return;
    if (this.focusInside) {
      this.focusInside = false;
      this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
    }
  }

  private emitSubmitted(): void {
    this.dispatchEvent(new CustomEvent('submitted', { bubbles: true, composed: true }));
  }

  private renderNumberSide(params: {
    bound: 'low' | 'high';
    inputId: string;
    resolvedLabel: string;
    subLabel: string;
    placeholder: string;
    mode: 'decimal' | 'integer';
    min: number | undefined;
    max: number | undefined;
    step: number | undefined;
    precision: number | undefined;
    required: boolean;
    locked: boolean;
    hasError: boolean;
    hasWarning: boolean;
    describedBy: string | undefined;
    showSteppers: boolean;
    rawValue: number | string | null;
  }) {
    const {
      bound,
      inputId,
      resolvedLabel,
      subLabel,
      placeholder,
      mode,
      min,
      max,
      step,
      precision,
      required,
      locked,
      hasError,
      hasWarning,
      describedBy,
      showSteppers,
      rawValue,
    } = params;
    const externalText = rawValue == null ? '' : String(rawValue);
    const activeDraft = bound === 'low' ? this.lowDraft : this.highDraft;
    if (locked) {
      if (bound === 'low') this.lowDraft = undefined;
      else this.highDraft = undefined;
    } else if (activeDraft && rawValue !== activeDraft.base && rawValue !== activeDraft.parsed) {
      if (bound === 'low') this.lowDraft = undefined;
      else this.highDraft = undefined;
    }
    const currentDraft = bound === 'low' ? this.lowDraft : this.highDraft;
    const displayedText =
      !locked && currentDraft && (rawValue === currentDraft.base || rawValue === currentDraft.parsed)
        ? currentDraft.text
        : externalText;
    const numericCur = typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : null;
    const effStep = resolvePairedNumberStep({ mode, precision, step });
    const canDec = !locked && (min === undefined || numericCur === null || numericCur - effStep >= min - 1e-9);
    const canInc = !locked && (max === undefined || numericCur === null || numericCur + effStep <= max + 1e-9);

    const stepBy = (delta: -1 | 1) => {
      if (locked) return;
      if (bound === 'low') this.lowDraft = undefined;
      else this.highDraft = undefined;
      const next = stepPairedNumber({ current: numericCur, delta, mode, step, precision, min, max });
      if (bound === 'low') {
        this.emitIntent<RangeFieldIntent>({ type: 'lowChangeRequested', low: next });
      } else {
        this.emitIntent<RangeFieldIntent>({ type: 'highChangeRequested', high: next });
      }
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (locked) {
        target.value = externalText;
        return;
      }
      const clean = sanitizePairedNumberText(target.value, mode);
      if (target.value !== clean) {
        target.value = clean;
      }
      const parsed = parsePairedNumberDraft(clean, mode);
      const draftObj = {
        text: clean,
        base: rawValue,
        parsed: parsed.complete ? parsed.value : undefined,
      };
      if (bound === 'low') this.lowDraft = draftObj;
      else this.highDraft = draftObj;
      if (parsed.complete) {
        if (bound === 'low') {
          this.emitIntent<RangeFieldIntent>({ type: 'lowChangeRequested', low: parsed.value });
        } else {
          this.emitIntent<RangeFieldIntent>({ type: 'highChangeRequested', high: parsed.value });
        }
      }
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (locked) return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        stepBy(1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        stepBy(-1);
      } else if (e.key === 'Enter') {
        this.emitSubmitted();
      }
    };

    const handleBlur = (e: Event) => {
      if (bound === 'low') this.lowDraft = undefined;
      else this.highDraft = undefined;
      (e.target as HTMLInputElement).value = externalText;
    };

    const handleWheel = (e: WheelEvent) => {
      (e.currentTarget as HTMLInputElement).blur();
    };

    const inputEl = (cls: string) => html`<input
      id=${inputId}
      class=${cls}
      type="text"
      role="spinbutton"
      inputmode=${mode === 'integer' ? 'numeric' : 'decimal'}
      .value=${live(displayedText)}
      .placeholder=${placeholder}
      aria-label=${`${resolvedLabel}, ${subLabel}`}
      aria-valuemin=${min !== undefined ? String(min) : nothing}
      aria-valuemax=${max !== undefined ? String(max) : nothing}
      aria-valuenow=${numericCur !== null ? String(numericCur) : nothing}
      ?required=${required}
      ?readonly=${locked}
      aria-required=${required ? 'true' : nothing}
      aria-readonly=${locked ? 'true' : nothing}
      aria-invalid=${hasError ? 'true' : nothing}
      data-warning=${!hasError && hasWarning ? 'true' : nothing}
      aria-describedby=${describedBy || nothing}
      @wheel=${handleWheel}
      @keydown=${handleKeydown}
      @input=${handleInput}
      @blur=${handleBlur}
    />`;

    return showSteppers
      ? html`<div
          class="pf-affix"
          data-invalid=${hasError ? 'true' : nothing}
          data-warning=${!hasError && hasWarning ? 'true' : nothing}
          data-readonly=${locked ? 'true' : nothing}
        >
          <button
            type="button"
            class="pf-affix-btn pf-affix-btn--leading"
            ?disabled=${locked || !canDec}
            aria-label=${`Decrease ${subLabel}`}
            @click=${() => stepBy(-1)}
          >−</button>
          ${inputEl('pf-affix-field')}
          <button
            type="button"
            class="pf-affix-btn pf-affix-btn--trailing"
            ?disabled=${locked || !canInc}
            aria-label=${`Increase ${subLabel}`}
            @click=${() => stepBy(1)}
          >+</button>
        </div>`
      : inputEl('emr-control');
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const resolvedDef = this.definition ?? m.definition;
    const resolvedLabel = m.label || resolvedDef?.presentation?.label || '';
    const resolvedUnit = m.unit ?? resolvedDef?.presentation?.unitDisplay;
    const resolvedHint = m.hint ?? resolvedDef?.presentation?.hint;
    const resolvedLayout = m.layout ?? this.layout;
    const resolvedShowMetadata = this.showMetadata && m.showMetadata !== false;
    const resolvedSize = m.size ?? this.size;
    const resolvedClearable = this.clearable ?? m.clearable ?? true;
    const resolvedShowSteppers = this.showSteppers ?? m.showSteppers ?? false;
    const resolvedDisplayFormat = m.displayFormat ?? this.displayFormat;
    const resolvedTimePrecision = m.timePrecision ?? this.timePrecision;
    const resolvedHourCycle = m.hourCycle ?? this.hourCycle;
    const resolvedWireFormat = m.wireFormat ?? this.wireFormat;
    const locked = Boolean(this.readOnly || m.readOnly || resolvedDef?.contract?.readOnly);

    const minCard = resolvedDef?.contract?.cardinality?.min;
    const resolvedRequired = Boolean(m.required || (minCard !== undefined && minCard >= 1));
    const lowRequired = Boolean(m.lowRequired ?? resolvedRequired);
    const highRequired = Boolean(m.highRequired ?? resolvedRequired);

    const lowLabel = m.lowLabel ?? (m.kind === 'number' ? 'Low' : 'From');
    const highLabel = m.highLabel ?? (m.kind === 'number' ? 'High' : 'To');

    const resolvedPrecision = m.precision ?? resolvedDef?.presentation?.precision;
    const numericMode: 'decimal' | 'integer' =
      m.numericMode === 'integer' || m.numericMode === 'decimal'
        ? m.numericMode
        : resolvedPrecision === 0 || resolvedDef?.contract?.valueType === 'integer'
          ? 'integer'
          : 'decimal';
    const resolvedStep = m.step ?? resolvedDef?.presentation?.step;

    const resolvedMessages = resolveRangeFieldMessages(m);
    const sv = resolveRangeSideValidation(resolvedMessages);
    const hasMessage = Boolean(resolvedHint || resolvedMessages.length > 0);
    const describedBy = hasMessage ? `${id}-message` : undefined;

    const lowVal = m.value?.low ?? null;
    const highVal = m.value?.high ?? null;
    const hasAnyValue =
      (lowVal !== null && lowVal !== undefined && lowVal !== '') ||
      (highVal !== null && highVal !== undefined && highVal !== '');
    const showClear = resolvedClearable && !locked && hasAnyValue;

    const defNumMin = m.kind === 'number' ? resolvedDef?.presentation?.min : undefined;
    const defNumMax = m.kind === 'number' ? resolvedDef?.presentation?.max : undefined;
    const lowNumMin = typeof (m.lowMin ?? m.min ?? defNumMin) === 'number' ? ((m.lowMin ?? m.min ?? defNumMin) as number) : undefined;
    const lowNumMax = typeof (m.lowMax ?? m.max ?? defNumMax) === 'number' ? ((m.lowMax ?? m.max ?? defNumMax) as number) : undefined;
    const highNumMin = typeof (m.highMin ?? m.min ?? defNumMin) === 'number' ? ((m.highMin ?? m.min ?? defNumMin) as number) : undefined;
    const highNumMax = typeof (m.highMax ?? m.max ?? defNumMax) === 'number' ? ((m.highMax ?? m.max ?? defNumMax) as number) : undefined;

    const lowStrMin = typeof (m.lowMin ?? m.min) === 'string' ? ((m.lowMin ?? m.min) as string) : '';
    const lowStrMax = typeof (m.lowMax ?? m.max) === 'string' ? ((m.lowMax ?? m.max) as string) : '';
    const highStrMin = typeof (m.highMin ?? m.min) === 'string' ? ((m.highMin ?? m.min) as string) : '';
    const highStrMax = typeof (m.highMax ?? m.max) === 'string' ? ((m.highMax ?? m.max) as string) : '';

    const emitTemporal = (bound: 'low' | 'high', val: string | null) => {
      if (locked) return;
      if (bound === 'low') {
        this.emitIntent<RangeFieldIntent>({ type: 'lowChangeRequested', low: val });
      } else {
        this.emitIntent<RangeFieldIntent>({ type: 'highChangeRequested', high: val });
      }
    };

    const renderBoundControl = (bound: 'low' | 'high') => {
      const isLow = bound === 'low';
      const boundId = `${id}-${bound}`;
      const subLabel = isLow ? lowLabel : highLabel;
      const req = isLow ? lowRequired : highRequired;
      const hasErr = isLow ? sv.lowInvalid : sv.highInvalid;
      const hasWarn = isLow ? sv.lowWarning : sv.highWarning;
      const strVal = isLow ? (typeof lowVal === 'string' ? lowVal : null) : (typeof highVal === 'string' ? highVal : null);
      const strMin = isLow ? lowStrMin : highStrMin;
      const strMax = isLow ? lowStrMax : highStrMax;
      const placeholder = isLow ? (m.lowPlaceholder ?? '') : (m.highPlaceholder ?? '');

      if (m.kind === 'date') {
        return html`<emr-date-input
          .controlId=${boundId}
          .label=${subLabel}
          .ariaLabel=${`${resolvedLabel}, ${subLabel}`}
          .ariaDescribedBy=${describedBy ?? ''}
          .labelHidden=${true}
          .fullWidth=${true}
          .size=${resolvedSize}
          .displayFormat=${resolvedDisplayFormat}
          .value=${strVal}
          .min=${strMin}
          .max=${strMax}
          .placeholder=${placeholder}
          .invalid=${hasErr}
          .warning=${hasWarn ? 'warning' : ''}
          .required=${req}
          .readOnly=${locked}
          @valueChange=${(e: CustomEvent<string | null>) => {
            e.stopPropagation();
            emitTemporal(bound, e.detail);
          }}
          @submitted=${(e: Event) => {
            e.stopPropagation();
            if (!locked) this.emitSubmitted();
          }}
        ></emr-date-input>`;
      }

      if (m.kind === 'time') {
        return html`<emr-time-input
          .controlId=${boundId}
          .label=${subLabel}
          .ariaLabel=${`${resolvedLabel}, ${subLabel}`}
          .ariaDescribedBy=${describedBy ?? ''}
          .labelHidden=${true}
          .fullWidth=${true}
          .size=${resolvedSize}
          .clearable=${false}
          .precision=${resolvedTimePrecision}
          .hourCycle=${resolvedHourCycle}
          .value=${strVal}
          .min=${strMin}
          .max=${strMax}
          .step=${resolvedStep}
          .placeholder=${placeholder}
          .invalid=${hasErr}
          .warning=${hasWarn ? 'warning' : ''}
          .required=${req}
          .readOnly=${locked}
          @valueChange=${(e: CustomEvent<string | null>) => {
            e.stopPropagation();
            emitTemporal(bound, e.detail);
          }}
          @submitted=${(e: Event) => {
            e.stopPropagation();
            if (!locked) this.emitSubmitted();
          }}
        ></emr-time-input>`;
      }

      if (m.kind === 'datetime') {
        return html`<emr-datetime-input
          .controlId=${boundId}
          .label=${subLabel}
          .ariaLabel=${`${resolvedLabel}, ${subLabel}`}
          .ariaDescribedBy=${describedBy ?? ''}
          .labelHidden=${true}
          .size=${resolvedSize}
          .clearable=${false}
          .displayFormat=${resolvedDisplayFormat}
          .timePrecision=${resolvedTimePrecision}
          .hourCycle=${resolvedHourCycle}
          .wireFormat=${resolvedWireFormat}
          .value=${strVal}
          .min=${strMin}
          .max=${strMax}
          .invalid=${hasErr}
          .warning=${hasWarn ? 'warning' : ''}
          .required=${req}
          .readOnly=${locked}
          @valueChange=${(e: CustomEvent<string | null>) => {
            e.stopPropagation();
            emitTemporal(bound, e.detail);
          }}
          @submitted=${(e: Event) => {
            e.stopPropagation();
            if (!locked) this.emitSubmitted();
          }}
        ></emr-datetime-input>`;
      }

      return this.renderNumberSide({
        bound,
        inputId: boundId,
        resolvedLabel,
        subLabel,
        placeholder: placeholder || (isLow ? 'Min' : 'Max'),
        mode: numericMode,
        min: isLow ? lowNumMin : highNumMin,
        max: isLow ? lowNumMax : highNumMax,
        step: resolvedStep,
        precision: resolvedPrecision,
        required: req,
        locked,
        hasError: hasErr,
        hasWarning: hasWarn,
        describedBy,
        showSteppers: resolvedShowSteppers,
        rawValue: isLow ? lowVal : highVal,
      });
    };

    const cellCls = m.kind === 'datetime' ? 'sub-field sub-field--datetime' : 'sub-field';
    const lowFor = m.kind === 'datetime' ? `${id}-low-date` : `${id}-low`;
    const highFor = m.kind === 'datetime' ? `${id}-high-date` : `${id}-high`;

    return html`<emr-field-frame
      .controlId=${id}
      .label=${resolvedLabel}
      .labelHidden=${this.labelHidden}
      .labelNamesControl=${false}
      .layout=${resolvedLayout}
      .showMetadata=${resolvedShowMetadata}
      .unit=${resolvedUnit ?? ''}
      .readOnly=${locked}
      .hint=${resolvedHint ?? ''}
      .messages=${resolvedMessages}
      .assessmentStatus=${m.status}
      .assessmentStatusOptions=${m.statusOptions ?? []}
      ?required=${resolvedRequired}
      @intent=${(e: CustomEvent<{ type?: string; status?: ClinicalAssessmentStatus }>) => {
        if (e.detail?.type === 'statusChangeRequested') {
          e.stopPropagation();
          if (!locked) {
            this.emitIntent<RangeFieldIntent>({ type: 'statusChangeRequested', status: e.detail.status });
          }
        }
      }}
    >
      <div class="l2-stack">
        <div
          class=${`pf-row rf-row${resolvedSize === 'lg' ? ' pf-row--lg' : ''}`}
          role="group"
          aria-labelledby=${this.headingId || (!this.labelHidden && resolvedLabel ? `${id}-label` : nothing)}
          aria-label=${resolvedLabel}
          @focusin=${() => this.onGroupFocusIn()}
          @focusout=${(e: FocusEvent) => this.onGroupFocusOut(e)}
        >
          <div class=${cellCls}>
            <label class="sub-label" for=${lowFor}>
              ${lowLabel}${lowRequired ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
            </label>
            ${renderBoundControl('low')}
          </div>
          <strong class="pf-sep" aria-hidden="true">–</strong>
          <div class=${cellCls}>
            <label class="sub-label" for=${highFor}>
              ${highLabel}${highRequired ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
            </label>
            ${renderBoundControl('high')}
          </div>
          ${showClear
            ? html`<button
                type="button"
                class="pf-clear"
                data-emr-print="hide"
                aria-label=${`Clear ${resolvedLabel}`}
                @click=${() => {
                  if (!locked) {
                    this.lowDraft = undefined;
                    this.highDraft = undefined;
                    this.emitIntent<RangeFieldIntent>({ type: 'clearRequested' });
                    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
                  }
                }}
              >${renderEmrSvgIcon('close', 14)}</button>`
            : nothing}
        </div>
      </div>
    </emr-field-frame>`;
  }
}

/** 7. EmrSignatureCaptureFieldElement (`emr-signature-capture-field`) */
export class EmrSignatureCaptureFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-signature-capture');

  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) layout?: FieldFrameLayout;
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ attribute: false }) definition?: EmrFieldDefinition;
  @property({ attribute: false }) model?: SignatureCaptureViewModel;

  @state() private activePoints: EmrSignaturePoint[] = [];
  private activePointerId: number | null = null;

  private get resolvedDefinition(): EmrFieldDefinition | undefined {
    return this.definition ?? this.model?.definition;
  }

  private get locked(): boolean {
    if (!this.model) return Boolean(this.readOnly || this.definition?.contract?.readOnly);
    return isSignaturePadLocked(
      { readOnly: this.model.readOnly, definition: this.resolvedDefinition },
      this.readOnly,
    );
  }

  private toPadPoint(event: PointerEvent, padEl: SVGSVGElement, w: number, h: number): EmrSignaturePoint {
    return mapPointerToSignaturePoint(
      event.clientX,
      event.clientY,
      padEl.getBoundingClientRect(),
      w,
      h,
    );
  }

  private cancelActiveStroke(padEl: SVGSVGElement, pointerId: number | null): void {
    if (
      typeof pointerId === 'number' &&
      padEl.hasPointerCapture?.(pointerId)
    ) {
      padEl.releasePointerCapture(pointerId);
    }
    this.activePointerId = null;
    this.activePoints = [];
  }

  private finishStroke(event: PointerEvent, padEl: SVGSVGElement): void {
    const pid = typeof event.pointerId === 'number' ? event.pointerId : 0;
    if (this.activePointerId !== pid) return;
    if (typeof event.pointerId === 'number' && padEl.hasPointerCapture?.(event.pointerId)) {
      padEl.releasePointerCapture(event.pointerId);
    }
    this.activePointerId = null;
    const completed = this.activePoints;
    this.activePoints = [];
    if (!this.locked && this.model && completed.length > 0) {
      const stroke: EmrSignatureStroke = { points: completed };
      this.emitIntent<SignatureCaptureIntent>({
        type: 'strokeAdded',
        stroke,
      });
      this.dispatchEvent(
        new CustomEvent<readonly EmrSignatureStroke[]>('value-change', {
          detail: [...this.model.strokes, stroke],
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private emitUndo(): void {
    if (!this.model || this.locked || this.model.undoable === false || this.model.strokes.length === 0) {
      return;
    }
    this.emitIntent<SignatureCaptureIntent>({ type: 'undoRequested' });
    this.dispatchEvent(
      new CustomEvent<readonly EmrSignatureStroke[]>('value-change', {
        detail: this.model.strokes.slice(0, -1),
        bubbles: true,
        composed: true,
      }),
    );
  }

  private emitClear(): void {
    if (!this.model || this.locked || this.model.clearable === false || this.model.strokes.length === 0) {
      return;
    }
    this.emitIntent<SignatureCaptureIntent>({ type: 'clearRequested' });
    this.dispatchEvent(
      new CustomEvent<readonly EmrSignatureStroke[]>('value-change', {
        detail: [],
        bubbles: true,
        composed: true,
      }),
    );
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const def = this.resolvedDefinition;
    const resolvedLabel = m.label || def?.presentation?.label || '';
    const resolvedLabelHidden = Boolean(this.labelHidden || m.labelHidden);
    const resolvedHint = m.hint ?? def?.presentation?.hint;
    const resolvedLayout = normalizeFieldFrameLayout(this.layout ?? m.layout);
    const resolvedShowMetadata = this.showMetadata && m.showMetadata !== false;
    const locked = this.locked;
    const minCard = def?.contract?.cardinality?.min;
    const resolvedRequired = Boolean(m.required || (minCard !== undefined && minCard >= 1));
    const geom = resolveSignatureCanvasGeometry(m.width, m.height);
    const penWidth =
      typeof m.penWidth === 'number' && Number.isFinite(m.penWidth) && m.penWidth > 0
        ? m.penWidth
        : 2.25;
    const dotRadius = Number(Math.max(1.25, penWidth * 0.78).toFixed(2));
    const validation = hasSignatureValidationState(m.messages);
    const hasMessages = Boolean(resolvedHint || m.messages?.length);
    const describedBy = hasMessages ? `${id}-message` : '';
    const labelledBy =
      this.headingId || (!resolvedLabelHidden && resolvedLabel ? `${id}-label` : '');
    const attestation = formatSignatureAttestation(m);
    const isEmptyPad = m.strokes.length === 0 && this.activePoints.length === 0;
    const emptyPrompt =
      m.emptyPrompt?.trim() ||
      (locked ? 'No signature captured' : 'Sign here with stylus, mouse, or finger');
    const canUndo = !locked && m.undoable !== false;
    const canClear = !locked && m.clearable !== false;

    const toAttr = (pts: readonly EmrSignaturePoint[]) => pts.map(p => `${p.x},${p.y}`).join(' ');

    return html`<emr-field-frame
      .controlId=${id}
      .label=${resolvedLabel}
      .labelHidden=${resolvedLabelHidden}
      .labelNamesControl=${false}
      .layout=${resolvedLayout}
      .showMetadata=${resolvedShowMetadata}
      .readOnly=${locked}
      .hint=${resolvedHint ?? ''}
      .messages=${m.messages ?? []}
      .assessmentStatus=${m.status}
      .assessmentStatusOptions=${m.statusOptions ?? []}
      ?required=${resolvedRequired}
      @intent=${(e: CustomEvent<{ type?: string; status?: ClinicalAssessmentStatus }>) => {
        if (e.detail?.type === 'statusChangeRequested') {
          e.stopPropagation();
          if (!locked) {
            this.emitIntent<SignatureCaptureIntent>({
              type: 'statusChangeRequested',
              status: e.detail.status,
            });
          }
        }
      }}
    >
      <div class="l2-stack">
        <div class="sig-pad-wrap">
          <svg
            id=${id}
            part="pad"
            tabindex="0"
            role=${locked ? 'img' : 'region'}
            aria-roledescription=${locked ? nothing : 'signature pad'}
            aria-labelledby=${labelledBy || nothing}
            aria-label=${labelledBy ? nothing : `${resolvedLabel} signature pad`}
            aria-invalid=${validation.hasError ? 'true' : nothing}
            aria-required=${!locked && resolvedRequired ? 'true' : nothing}
            aria-readonly=${locked ? 'true' : nothing}
            aria-describedby=${describedBy || nothing}
            data-invalid=${validation.hasError ? 'true' : nothing}
            data-warning=${validation.hasWarning ? 'true' : nothing}
            data-readonly=${locked ? 'true' : nothing}
            class=${`sig-pad${locked ? ' sig-pad--readonly' : ''}`}
            viewBox=${`0 0 ${geom.width} ${geom.height}`}
            preserveAspectRatio="xMidYMid meet"
            style=${`width: 100%; height: ${geom.height}px;`}
            @focusin=${() => {
              this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
            }}
            @focusout=${() => {
              this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
            }}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Escape' && (this.activePointerId !== null || this.activePoints.length > 0)) {
                e.preventDefault();
                this.cancelActiveStroke(e.currentTarget as SVGSVGElement, this.activePointerId);
                return;
              }
              if (locked) return;
              if ((e.key === 'Delete' || e.key === 'Backspace') && canClear && m.strokes.length > 0) {
                e.preventDefault();
                this.emitClear();
                return;
              }
              if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && canUndo && m.strokes.length > 0) {
                e.preventDefault();
                this.emitUndo();
              }
            }}
            @pointerdown=${(e: PointerEvent) => {
              if (locked) return;
              if (e.pointerType === 'mouse' && e.button !== 0) return;
              const pad = e.currentTarget as SVGSVGElement;
              const pid = typeof e.pointerId === 'number' ? e.pointerId : 0;
              this.activePointerId = pid;
              if (typeof e.pointerId === 'number') {
                pad.setPointerCapture?.(e.pointerId);
              }
              e.preventDefault();
              pad.focus?.({ preventScroll: true });
              this.activePoints = [this.toPadPoint(e, pad, geom.width, geom.height)];
            }}
            @pointermove=${(e: PointerEvent) => {
              const pid = typeof e.pointerId === 'number' ? e.pointerId : 0;
              if (locked || this.activePointerId !== pid) return;
              const pad = e.currentTarget as SVGSVGElement;
              e.preventDefault();
              const pt = this.toPadPoint(e, pad, geom.width, geom.height);
              const last = this.activePoints[this.activePoints.length - 1];
              if (last && last.x === pt.x && last.y === pt.y) return;
              this.activePoints = [...this.activePoints, pt];
            }}
            @pointerup=${(e: PointerEvent) => this.finishStroke(e, e.currentTarget as SVGSVGElement)}
            @pointercancel=${(e: PointerEvent) => {
              const pid = typeof e.pointerId === 'number' ? e.pointerId : 0;
              if (this.activePointerId !== pid) return;
              this.cancelActiveStroke(e.currentTarget as SVGSVGElement, e.pointerId);
            }}
          >
            <line
              x1=${String(geom.baselineInset)}
              y1=${String(geom.baselineY)}
              x2=${String(geom.width - geom.baselineInset)}
              y2=${String(geom.baselineY)}
              stroke="var(--emr-border)"
              stroke-width="1"
              stroke-dasharray="4 4"
            />
            ${m.strokes.map(stroke =>
              stroke.points.length === 1
                ? svg`<circle cx=${String(stroke.points[0]!.x)} cy=${String(stroke.points[0]!.y)} r=${String(dotRadius)} fill="var(--emr-text)" />`
                : stroke.points.length > 1
                  ? svg`<polyline fill="none" stroke="var(--emr-text)" stroke-width=${String(penWidth)} stroke-linecap="round" stroke-linejoin="round" points=${toAttr(stroke.points)} />`
                  : nothing,
            )}
            ${this.activePoints.length === 1
              ? svg`<circle cx=${String(this.activePoints[0]!.x)} cy=${String(this.activePoints[0]!.y)} r=${String(dotRadius)} fill="var(--emr-primary)" />`
              : this.activePoints.length > 1
                ? svg`<polyline fill="none" stroke="var(--emr-primary)" stroke-width=${String(penWidth)} stroke-linecap="round" stroke-linejoin="round" points=${toAttr(this.activePoints)} />`
                : nothing}
          </svg>
          ${isEmptyPad ? html`<div class="sig-empty" aria-hidden="true">${emptyPrompt}</div>` : nothing}
        </div>
        <div class="sig-footer">
          <span class="emr-muted">${attestation}</span>
          ${!locked && (canUndo || canClear)
            ? html`<div class="sig-actions" data-emr-print="hide">
                ${canUndo
                  ? html`<button
                      type="button"
                      class="emr-btn emr-btn--outline emr-btn--sm sig-btn"
                      ?disabled=${m.strokes.length === 0}
                      aria-label=${`Undo last stroke on ${resolvedLabel}`}
                      @click=${() => this.emitUndo()}
                    >${renderEmrSvgIcon('undo', 14)}<span>Undo</span></button>`
                  : nothing}
                ${canClear
                  ? html`<button
                      type="button"
                      class="emr-btn emr-btn--outline emr-btn--sm sig-btn"
                      ?disabled=${m.strokes.length === 0}
                      aria-label=${`Clear ${resolvedLabel}`}
                      @click=${() => this.emitClear()}
                    >${renderEmrSvgIcon('trash', 14)}<span>Clear</span></button>`
                  : nothing}
              </div>`
            : nothing}
        </div>
      </div>
    </emr-field-frame>`;
  }
}

/** 8. EmrPhoneInputElement (`emr-phone-input`) */
export class EmrPhoneInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-phone-input');

  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) layout?: FieldFrameLayout;
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: String }) size?: 'sm' | 'md' | 'lg';
  @property({ type: Boolean }) clearable?: boolean;
  @property({ attribute: false }) definition?: EmrFieldDefinition;
  @property({ attribute: false }) model?: PhoneFieldViewModel;

  private focusInside = false;

  private onGroupFocusIn(): void {
    if (!this.focusInside) {
      this.focusInside = true;
      this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
    }
  }

  private onGroupFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    const cur = event.currentTarget as HTMLElement | null;
    if (next && cur?.contains(next)) return;
    if (this.focusInside) {
      this.focusInside = false;
      this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
    }
  }

  private emitSubmitted(): void {
    this.dispatchEvent(new CustomEvent('submitted', { bubbles: true, composed: true }));
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const resolvedDef = this.definition ?? m.definition;
    const resolvedLabel = m.label || resolvedDef?.presentation?.label || '';
    const resolvedUnit = resolvedDef?.presentation?.unitDisplay ?? '';
    const resolvedHint = m.hint ?? resolvedDef?.presentation?.hint ?? '';
    const resolvedLayout = m.layout ?? this.layout ?? 'vertical';
    const resolvedShowMetadata = this.showMetadata && m.showMetadata !== false;
    const resolvedSize = this.size ?? m.size ?? 'md';
    const resolvedClearable = this.clearable ?? m.clearable ?? false;
    const locked = Boolean(this.readOnly || m.readOnly || resolvedDef?.contract?.readOnly);
    const minCard = resolvedDef?.contract?.cardinality?.min;
    const resolvedRequired = Boolean(m.required || (minCard !== undefined && minCard >= 1));
    const resolvedPlaceholder = m.placeholder ?? resolvedDef?.presentation?.placeholder ?? 'Phone number';
    const resolvedExtPlaceholder = m.extensionPlaceholder ?? 'Ext.';
    const showPhoneIcon = m.showPhoneIcon !== false;
    const extensionVisible = isPhoneExtensionVisible(m.showExtension, m.extension);
    const showClear =
      resolvedClearable &&
      !locked &&
      hasPhoneClearableValue(m.nationalNumber, m.extension);
    const pv = resolvePhonePartValidation(m.messages);
    const hasMessage = Boolean(resolvedHint || m.messages?.length);
    const describedBy = hasMessage ? `${id}-message` : '';
    const groupLabelledBy =
      this.headingId || (!this.labelHidden && resolvedLabel ? `${id}-label` : '');
    const countryOpts: EmrOption[] = m.countryOptions.map(c => ({
      value: c.code,
      label: c.label,
      keywords: c.keywords,
      description: c.description,
      disabled: c.disabled,
      readOnly: c.readOnly,
      badge: c.badge,
      tone: c.tone,
      group: c.group,
    }));
    const activeChannels = new Set(m.channels ?? []);
    const rowCls = [
      'ph-row',
      resolvedSize === 'sm' ? 'ph-row--sm' : '',
      resolvedSize === 'lg' ? 'ph-row--lg' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`<emr-field-frame
      .controlId=${id}
      .label=${resolvedLabel}
      .labelHidden=${this.labelHidden}
      .labelNamesControl=${false}
      .layout=${resolvedLayout}
      .showMetadata=${resolvedShowMetadata}
      .unit=${resolvedUnit}
      .readOnly=${locked}
      .hint=${resolvedHint}
      .messages=${m.messages ?? []}
      .assessmentStatus=${m.status}
      .assessmentStatusOptions=${m.statusOptions ?? []}
      ?required=${resolvedRequired}
      @intent=${(e: CustomEvent<{ type?: string; status?: ClinicalAssessmentStatus }>) => {
        if (e.detail?.type === 'statusChangeRequested') {
          e.stopPropagation();
          if (!locked) {
            this.emitIntent<PhoneFieldIntent>({
              type: 'statusChangeRequested',
              status: e.detail.status,
            });
          }
        }
      }}
    >
      <div
        class="l2-stack"
        role="group"
        aria-labelledby=${groupLabelledBy || nothing}
        aria-label=${resolvedLabel || nothing}
        aria-describedby=${describedBy || nothing}
        @focusin=${this.onGroupFocusIn}
        @focusout=${this.onGroupFocusOut}
      >
        <div class=${rowCls}>
          <div class="ph-country">
            <emr-select
              .controlId=${`${id}-country`}
              .label=${`${resolvedLabel} country code`}
              .labelHidden=${true}
              .options=${countryOpts}
              .value=${m.countryCode}
              .size=${resolvedSize === 'sm' ? 'sm' : 'md'}
              .required=${resolvedRequired}
              .readOnly=${locked}
              .invalid=${pv.countryCodeInvalid}
              .hasWarning=${pv.countryCodeWarning}
              .ariaDescribedBy=${describedBy}
              @focused=${(e: Event) => e.stopPropagation()}
              @blurred=${(e: Event) => e.stopPropagation()}
              @valueChange=${(e: CustomEvent<string | null>) => {
                e.stopPropagation();
                if (!locked && e.detail && e.detail !== m.countryCode) {
                  this.emitIntent<PhoneFieldIntent>({
                    type: 'countryCodeChangeRequested',
                    countryCode: e.detail,
                  });
                }
              }}
            ></emr-select>
          </div>
          <div class="ph-number-wrap">
            ${showPhoneIcon
              ? html`<span class="ph-leading-icon" aria-hidden="true">${renderEmrSvgIcon('phone', 15)}</span>`
              : nothing}
            <input
              id=${id}
              class=${`emr-control ph-number${showPhoneIcon ? ' ph-number--with-icon' : ''}`}
              type="tel"
              inputmode="tel"
              autocomplete="tel-national"
              placeholder=${resolvedPlaceholder}
              maxlength=${m.maxLength ?? nothing}
              aria-label=${resolvedLabel}
              ?required=${resolvedRequired}
              ?readonly=${locked}
              aria-required=${resolvedRequired ? 'true' : nothing}
              aria-readonly=${locked ? 'true' : nothing}
              aria-invalid=${pv.nationalNumberInvalid ? 'true' : nothing}
              data-warning=${pv.nationalNumberWarning ? 'true' : nothing}
              aria-describedby=${describedBy || nothing}
              .value=${locked ? live(m.nationalNumber) : m.nationalNumber}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter' && !locked) {
                  e.preventDefault();
                  this.emitSubmitted();
                }
              }}
              @blur=${(e: Event) => {
                (e.target as HTMLInputElement).value = this.model?.nationalNumber ?? '';
              }}
              @input=${(e: Event) => {
                if (locked) {
                  (e.target as HTMLInputElement).value = m.nationalNumber;
                  return;
                }
                this.emitIntent<PhoneFieldIntent>({
                  type: 'numberChangeRequested',
                  nationalNumber: (e.target as HTMLInputElement).value,
                });
              }}
            />
          </div>
          ${extensionVisible
            ? html`<input
                id=${`${id}-ext`}
                class="emr-control ph-ext"
                type="text"
                inputmode="numeric"
                autocomplete="tel-extension"
                placeholder=${resolvedExtPlaceholder}
                maxlength=${m.extensionMaxLength ?? nothing}
                aria-label=${`${resolvedLabel} extension`}
                ?readonly=${locked}
                aria-readonly=${locked ? 'true' : nothing}
                aria-invalid=${pv.extensionInvalid ? 'true' : nothing}
                data-warning=${pv.extensionWarning ? 'true' : nothing}
                aria-describedby=${describedBy || nothing}
                .value=${locked ? live(m.extension ?? '') : (m.extension ?? '')}
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === 'Enter' && !locked) {
                    e.preventDefault();
                    this.emitSubmitted();
                  }
                }}
                @blur=${(e: Event) => {
                  (e.target as HTMLInputElement).value = this.model?.extension ?? '';
                }}
                @input=${(e: Event) => {
                  if (locked) {
                    (e.target as HTMLInputElement).value = m.extension ?? '';
                    return;
                  }
                  this.emitIntent<PhoneFieldIntent>({
                    type: 'extensionChangeRequested',
                    extension: (e.target as HTMLInputElement).value,
                  });
                }}
              />`
            : nothing}
          ${showClear
            ? html`<button
                type="button"
                class="pf-clear"
                data-emr-print="hide"
                aria-label=${`Clear ${resolvedLabel}`}
                @click=${() => {
                  if (!locked) {
                    this.emitIntent<PhoneFieldIntent>({ type: 'clearRequested' });
                  }
                }}
              >${renderEmrSvgIcon('close', 14)}</button>`
            : nothing}
          ${m.verifiedBadge ? html`<emr-badge .badge=${m.verifiedBadge}></emr-badge>` : nothing}
        </div>

        ${m.formattedPreview
          ? html`<div class="ph-preview" id=${`${id}-preview`}>${m.formattedPreview}</div>`
          : nothing}

        ${m.availableChannels && m.availableChannels.length > 0
          ? html`<div
              class="ph-channels"
              role="group"
              aria-label=${`${resolvedLabel} messaging channels`}
              aria-invalid=${pv.channelsInvalid ? 'true' : nothing}
              data-warning=${pv.channelsWarning ? 'true' : nothing}
            >
              ${m.availableChannels.map(ch => {
                const selected = activeChannels.has(ch.id);
                const chLocked = locked || Boolean(ch.readOnly);
                const chDisabled = Boolean(ch.disabled);
                return html`<button
                  type="button"
                  role="checkbox"
                  class="ph-channel"
                  aria-checked=${String(selected)}
                  aria-readonly=${chLocked ? 'true' : nothing}
                  aria-disabled=${chDisabled ? 'true' : nothing}
                  data-invalid=${pv.channelsInvalid ? 'true' : nothing}
                  data-warning=${pv.channelsWarning ? 'true' : nothing}
                  ?disabled=${chDisabled}
                  @click=${() => {
                    if (!chLocked && !chDisabled) {
                      this.emitIntent<PhoneFieldIntent>({
                        type: 'channelToggleRequested',
                        channel: ch.id as EmrPhoneChannel,
                      });
                    }
                  }}
                >
                  <span class="ph-channel-box" aria-hidden="true">${selected ? renderEmrSvgIcon('check', 12) : nothing}</span>
                  <span>${ch.label}</span>
                </button>`;
              })}
            </div>`
          : nothing}
      </div>
    </emr-field-frame>`;
  }
}

/** 9. EmrAddressFieldElement (`emr-address-field`) */
export class EmrAddressFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-address-field');

  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) layout?: FieldFrameLayout;
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ attribute: false }) definition?: EmrFieldDefinition;
  @property({ attribute: false }) model?: AddressFieldViewModel;

  private focusInside = false;

  private onGroupFocusIn(): void {
    if (!this.focusInside) {
      this.focusInside = true;
      this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
    }
  }

  private onGroupFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    const cur = event.currentTarget as HTMLElement | null;
    if (next && cur?.contains(next)) return;
    if (this.focusInside) {
      this.focusInside = false;
      this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
    }
  }

  private isLocked(): boolean {
    const m = this.model;
    const def = this.definition ?? m?.definition;
    return Boolean(this.readOnly || m?.readOnly || def?.contract?.readOnly);
  }

  private emitPart(part: EmrAddressPart, value: string): void {
    if (this.isLocked()) return;
    this.emitIntent<AddressFieldIntent>({ type: 'fieldChangeRequested', part, value });
  }

  private renderPartInput(opts: {
    readonly part: EmrAddressPart;
    readonly inputId: string;
    readonly cellClass: string;
    readonly label: string;
    readonly value: string;
    readonly placeholder: string;
    readonly autocomplete: string;
    readonly autocapitalize?: string;
    readonly extraClass?: string;
    readonly maxLength?: number;
    readonly required: boolean;
    readonly locked: boolean;
    readonly invalid: boolean;
    readonly warning: boolean;
    readonly describedBy: string;
  }) {
    const cls = ['emr-control', opts.extraClass ?? ''].filter(Boolean).join(' ');
    return html`<div class=${opts.cellClass}>
      <label class="sub-label" for=${opts.inputId}>
        ${opts.label}${opts.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
      </label>
      <input
        id=${opts.inputId}
        class=${cls}
        type="text"
        autocomplete=${opts.autocomplete}
        autocapitalize=${opts.autocapitalize ?? nothing}
        placeholder=${opts.placeholder}
        maxlength=${opts.maxLength ?? nothing}
        ?required=${opts.required}
        ?readonly=${opts.locked}
        aria-required=${opts.required ? 'true' : nothing}
        aria-readonly=${opts.locked ? 'true' : nothing}
        aria-invalid=${opts.invalid ? 'true' : nothing}
        data-warning=${!opts.invalid && opts.warning ? 'true' : nothing}
        aria-describedby=${opts.describedBy || nothing}
        .value=${opts.locked ? live(opts.value) : opts.value}
        @blur=${(e: Event) => {
          const curVal = this.model?.value?.[opts.part] ?? '';
          (e.target as HTMLInputElement).value = curVal;
        }}
        @input=${(e: Event) => {
          const inp = e.target as HTMLInputElement;
          if (this.isLocked()) {
            inp.value = this.model?.value?.[opts.part] ?? '';
            return;
          }
          this.emitPart(opts.part, inp.value);
        }}
      />
    </div>`;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const resolvedDef = this.definition ?? m.definition;
    const resolvedLabel = m.label || resolvedDef?.presentation?.label || '';
    const resolvedUnit = resolvedDef?.presentation?.unitDisplay ?? '';
    const resolvedHint = m.hint ?? resolvedDef?.presentation?.hint ?? '';
    const resolvedLayout = normalizeFieldFrameLayout(this.layout ?? m.layout);
    const resolvedShowMetadata = this.showMetadata && m.showMetadata !== false;
    const locked = this.isLocked();
    const minCard = resolvedDef?.contract?.cardinality?.min;
    const effectiveRequired = Boolean(m.required || (minCard !== undefined && minCard >= 1));
    const mergedMessages = resolveAddressRootMessages(m);
    const pv = resolveAddressPartValidation(mergedMessages);
    const hasMessage = Boolean(resolvedHint || mergedMessages.length > 0);
    const describedBy = hasMessage ? `${id}-message` : '';
    const groupLabelledBy =
      this.headingId || (!this.labelHidden && resolvedLabel ? `${id}-label` : '');
    const addr = m.value;

    const useOptions =
      m.useOptions !== undefined
        ? m.useOptions
        : m.use !== undefined
          ? DEFAULT_ADDRESS_USE_OPTIONS
          : [];
    const districtVisible =
      m.showDistrict !== undefined ? Boolean(m.showDistrict) : Boolean(addr.district);
    const showClear = Boolean(m.clearable && !locked && hasAnyAddressValue(addr));

    const isPartRequired = (part: EmrAddressPart): boolean =>
      m.requiredParts !== undefined
        ? m.requiredParts.includes(part)
        : effectiveRequired && DEFAULT_ADDRESS_REQUIRED_PARTS.includes(part);
    const partLabel = (part: EmrAddressPart, fallback: string): string => m.labels?.[part] || fallback;
    const partPlaceholder = (part: EmrAddressPart, fallback: string): string => m.placeholders?.[part] ?? fallback;

    const stateLabel = partLabel('state', 'State / Province');
    const stateReq = isPartRequired('state');
    const stateInvalid = isAddressPartInvalid(pv, 'state');
    const countryLabel = partLabel('country', 'Country');
    const countryReq = isPartRequired('country');
    const countryInvalid = isAddressPartInvalid(pv, 'country');

    return html`<emr-field-frame
      .controlId=${id}
      .label=${resolvedLabel}
      .labelHidden=${this.labelHidden}
      .labelNamesControl=${false}
      .layout=${resolvedLayout}
      .showMetadata=${resolvedShowMetadata}
      .unit=${resolvedUnit}
      .readOnly=${locked}
      .hint=${resolvedHint}
      .messages=${mergedMessages}
      .assessmentStatus=${m.status}
      .assessmentStatusOptions=${m.statusOptions ?? []}
      ?required=${effectiveRequired}
      @intent=${(e: CustomEvent<{ type?: string; status?: ClinicalAssessmentStatus }>) => {
        if (e.detail?.type === 'statusChangeRequested') {
          e.stopPropagation();
          if (!locked) {
            this.emitIntent<AddressFieldIntent>({
              type: 'statusChangeRequested',
              status: e.detail.status,
            });
          }
        }
      }}
    >
      <div
        class="l2-stack"
        role="group"
        aria-labelledby=${groupLabelledBy || nothing}
        aria-label=${resolvedLabel || nothing}
        aria-describedby=${describedBy || nothing}
        @focusin=${this.onGroupFocusIn}
        @focusout=${this.onGroupFocusOut}
      >
        ${useOptions.length > 0 || showClear
          ? html`<div class=${`addr-header${useOptions.length === 0 ? ' addr-header--end' : ''}`}>
              ${useOptions.length > 0
                ? html`<emr-segmented-control
                    .controlId=${`${id}-use`}
                    .label=${m.labels?.use || `${resolvedLabel} use`}
                    .labelHidden=${true}
                    .options=${useOptions}
                    .value=${m.use ?? null}
                    .readOnly=${locked}
                    @focused=${(e: Event) => e.stopPropagation()}
                    @blurred=${(e: Event) => e.stopPropagation()}
                    @valueChange=${(e: CustomEvent<string | null>) => {
                      e.stopPropagation();
                      const next = e.detail;
                      if (!locked && (next === 'home' || next === 'work' || next === 'temp' || next === 'billing')) {
                        this.emitIntent<AddressFieldIntent>({
                          type: 'useChangeRequested',
                          use: next as EmrAddressUse,
                        });
                      }
                    }}
                  ></emr-segmented-control>`
                : nothing}
              ${showClear
                ? html`<button
                    type="button"
                    class="pf-clear"
                    data-emr-print="hide"
                    aria-label=${`${m.labels?.clear ?? 'Clear'} ${resolvedLabel}`}
                    @click=${() => {
                      if (!locked) {
                        this.emitIntent<AddressFieldIntent>({ type: 'cleared' });
                      }
                    }}
                  >${renderEmrSvgIcon('close', 14)}</button>`
                : nothing}
            </div>`
          : nothing}

        <div class="addr-grid">
          ${this.renderPartInput({
            part: 'line1',
            inputId: id,
            cellClass: 'addr-cell addr-cell--full',
            label: partLabel('line1', 'Address line 1'),
            value: addr.line1 ?? '',
            placeholder: partPlaceholder('line1', 'Street, building, house number'),
            autocomplete: 'address-line1',
            maxLength: m.maxLengths?.line1,
            required: isPartRequired('line1'),
            locked,
            invalid: isAddressPartInvalid(pv, 'line1'),
            warning: pv.line1Warning,
            describedBy,
          })}

          ${this.renderPartInput({
            part: 'line2',
            inputId: `${id}-line2`,
            cellClass: 'addr-cell addr-cell--full',
            label: partLabel('line2', 'Address line 2'),
            value: addr.line2 ?? '',
            placeholder: partPlaceholder('line2', 'Apartment, landmark, locality (optional)'),
            autocomplete: 'address-line2',
            maxLength: m.maxLengths?.line2,
            required: isPartRequired('line2'),
            locked,
            invalid: isAddressPartInvalid(pv, 'line2'),
            warning: pv.line2Warning,
            describedBy,
          })}

          ${this.renderPartInput({
            part: 'city',
            inputId: `${id}-city`,
            cellClass: districtVisible ? 'addr-cell' : 'addr-cell addr-cell--full',
            label: partLabel('city', 'City / Town'),
            value: addr.city ?? '',
            placeholder: partPlaceholder('city', 'City'),
            autocomplete: 'address-level2',
            maxLength: m.maxLengths?.city,
            required: isPartRequired('city'),
            locked,
            invalid: isAddressPartInvalid(pv, 'city'),
            warning: pv.cityWarning,
            describedBy,
          })}

          ${districtVisible
            ? this.renderPartInput({
                part: 'district',
                inputId: `${id}-district`,
                cellClass: 'addr-cell',
                label: partLabel('district', 'District'),
                value: addr.district ?? '',
                placeholder: partPlaceholder('district', 'District'),
                autocomplete: 'address-level3',
                maxLength: m.maxLengths?.district,
                required: isPartRequired('district'),
                locked,
                invalid: isAddressPartInvalid(pv, 'district'),
                warning: pv.districtWarning,
                describedBy,
              })
            : nothing}

          ${m.stateOptions && m.stateOptions.length > 0
            ? html`<div class="addr-cell">
                <span class="sub-label">
                  ${stateLabel}${stateReq ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
                </span>
                <emr-select
                  .controlId=${`${id}-state`}
                  .label=${stateLabel}
                  .labelHidden=${true}
                  .options=${m.stateOptions}
                  .value=${addr.state || null}
                  .placeholder=${partPlaceholder('state', 'Select')}
                  .required=${stateReq}
                  .readOnly=${locked}
                  .invalid=${stateInvalid}
                  .hasWarning=${!stateInvalid && pv.stateWarning}
                  .ariaDescribedBy=${describedBy}
                  @focused=${(e: Event) => e.stopPropagation()}
                  @blurred=${(e: Event) => e.stopPropagation()}
                  @valueChange=${(e: CustomEvent<string | null>) => {
                    e.stopPropagation();
                    this.emitPart('state', e.detail ?? '');
                  }}
                ></emr-select>
              </div>`
            : this.renderPartInput({
                part: 'state',
                inputId: `${id}-state`,
                cellClass: 'addr-cell',
                label: stateLabel,
                value: addr.state ?? '',
                placeholder: partPlaceholder('state', 'State'),
                autocomplete: 'address-level1',
                maxLength: m.maxLengths?.state,
                required: stateReq,
                locked,
                invalid: stateInvalid,
                warning: pv.stateWarning,
                describedBy,
              })}

          ${this.renderPartInput({
            part: 'postalCode',
            inputId: `${id}-postalCode`,
            cellClass: 'addr-cell',
            label: partLabel('postalCode', 'Postal / PIN code'),
            value: addr.postalCode ?? '',
            placeholder: partPlaceholder('postalCode', 'Postal / PIN'),
            autocomplete: 'postal-code',
            autocapitalize: 'characters',
            extraClass: 'addr-postal',
            maxLength: m.maxLengths?.postalCode,
            required: isPartRequired('postalCode'),
            locked,
            invalid: isAddressPartInvalid(pv, 'postalCode'),
            warning: pv.postalCodeWarning,
            describedBy,
          })}

          ${m.countryOptions && m.countryOptions.length > 0
            ? html`<div class="addr-cell">
                <span class="sub-label">
                  ${countryLabel}${countryReq ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
                </span>
                <emr-select
                  .controlId=${`${id}-country`}
                  .label=${countryLabel}
                  .labelHidden=${true}
                  .options=${m.countryOptions}
                  .value=${addr.country || null}
                  .placeholder=${partPlaceholder('country', 'Select')}
                  .required=${countryReq}
                  .readOnly=${locked}
                  .invalid=${countryInvalid}
                  .hasWarning=${!countryInvalid && pv.countryWarning}
                  .ariaDescribedBy=${describedBy}
                  @focused=${(e: Event) => e.stopPropagation()}
                  @blurred=${(e: Event) => e.stopPropagation()}
                  @valueChange=${(e: CustomEvent<string | null>) => {
                    e.stopPropagation();
                    this.emitPart('country', e.detail ?? '');
                  }}
                ></emr-select>
              </div>`
            : this.renderPartInput({
                part: 'country',
                inputId: `${id}-country`,
                cellClass: 'addr-cell',
                label: countryLabel,
                value: addr.country ?? '',
                placeholder: partPlaceholder('country', 'Country'),
                autocomplete: 'country-name',
                maxLength: m.maxLengths?.country,
                required: countryReq,
                locked,
                invalid: countryInvalid,
                warning: pv.countryWarning,
                describedBy,
              })}
        </div>
      </div>
    </emr-field-frame>`;
  }
}

/** 10. EmrMacroTextFieldElement (`emr-macro-text-field`) */
export class EmrMacroTextFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-macro-text-field');

  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) layout?: FieldFrameLayout;
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Number }) rows?: number;
  @property({ type: Number }) maxLength?: number;
  @property({ type: Boolean }) clearable?: boolean;
  @property({ type: Boolean }) autoResize?: boolean;
  @property({ attribute: false }) definition?: EmrFieldDefinition;
  @property({ attribute: false }) model?: MacroTextFieldViewModel;

  @state() private activeIndex = 0;

  private get resolvedId(): string {
    return this.controlId || this.fallbackId;
  }

  private get resolvedDefinition(): EmrFieldDefinition | undefined {
    return this.definition ?? this.model?.definition;
  }

  private get locked(): boolean {
    return Boolean(
      this.readOnly || this.model?.readOnly || this.resolvedDefinition?.contract?.readOnly,
    );
  }

  private applyAutoResize(target?: HTMLTextAreaElement | null): void {
    const area = target ?? (this.shadowRoot?.getElementById(this.resolvedId) as HTMLTextAreaElement | null);
    if (!area) return;
    area.style.height = 'auto';
    if (area.scrollHeight > 0) {
      area.style.height = `${area.scrollHeight}px`;
    }
  }

  override updated(): void {
    if (!this.model) return;
    if (this.autoResize ?? this.model.autoResize ?? false) {
      this.applyAutoResize();
    }
  }

  private dismissMacros(restoreFocus = false): void {
    if (this.model?.suggestionsOpen) {
      this.emitIntent<MacroTextFieldIntent>({ type: 'macroDismissRequested' });
    }
    if (restoreFocus) {
      (this.shadowRoot?.getElementById(this.resolvedId) as HTMLTextAreaElement | null)?.focus();
    }
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.resolvedId;
    const resolvedDef = this.resolvedDefinition;
    const resolvedLabel = m.label || resolvedDef?.presentation?.label || '';
    const resolvedUnit = resolvedDef?.presentation?.unitDisplay ?? '';
    const resolvedHint = m.hint ?? resolvedDef?.presentation?.hint ?? '';
    const resolvedPlaceholder = m.placeholder ?? resolvedDef?.presentation?.placeholder ?? '';
    const resolvedLayout = normalizeFieldFrameLayout(this.layout ?? m.layout);
    const resolvedShowMetadata = this.showMetadata && m.showMetadata !== false;
    const locked = this.locked;
    const minCard = resolvedDef?.contract?.cardinality?.min;
    const resolvedRequired = Boolean(m.required || (minCard !== undefined && minCard >= 1));
    const resolvedRows = Math.max(
      2,
      this.rows ?? m.rows ?? resolvedDef?.presentation?.rows ?? 4,
    );
    const resolvedMaxLength = this.maxLength ?? m.maxLength;
    const resolvedClearable = this.clearable ?? m.clearable ?? false;
    const resolvedAutoResize = this.autoResize ?? m.autoResize ?? false;
    const dictationVisible = m.dictationEnabled !== false;
    const val = m.value ?? '';
    const showClear = resolvedClearable && !locked && val.length > 0;
    const showCounter =
      m.showCounter !== false && (resolvedMaxLength !== undefined || m.showCounter === true);
    const vs = hasMacroValidationState(m.messages);

    const popupOpen = Boolean(m.suggestionsOpen && !locked);
    const hasSuggestions = m.suggestions.length > 0;
    const clampedIdx = hasSuggestions
      ? Math.max(0, Math.min(this.activeIndex, m.suggestions.length - 1))
      : -1;
    const listboxId = `${id}-macros`;
    const counterId = `${id}-counter`;
    const activeDescendant = popupOpen && hasSuggestions && clampedIdx >= 0 ? `${id}-macro-${clampedIdx}` : '';
    const hasMessages = Boolean(resolvedHint || m.messages?.length);
    const describedBy = [hasMessages ? `${id}-message` : '', showCounter ? counterId : '']
      .filter(Boolean)
      .join(' ');

    return html`<emr-field-frame
      .controlId=${id}
      .label=${resolvedLabel}
      .labelHidden=${this.labelHidden}
      .labelNamesControl=${true}
      .layout=${resolvedLayout}
      .showMetadata=${resolvedShowMetadata}
      .unit=${resolvedUnit}
      .readOnly=${locked}
      .hint=${resolvedHint}
      .messages=${m.messages ?? []}
      .assessmentStatus=${m.status}
      .assessmentStatusOptions=${m.statusOptions ?? []}
      ?required=${resolvedRequired}
      @intent=${(e: CustomEvent<{ type?: string; status?: ClinicalAssessmentStatus }>) => {
        if (e.detail?.type === 'statusChangeRequested') {
          e.stopPropagation();
          if (!locked) {
            this.emitIntent<MacroTextFieldIntent>({
              type: 'statusChangeRequested',
              status: e.detail.status,
            });
          }
        }
      }}
    >
      <div class=${`macro-wrap${popupOpen ? ' macro-wrap--open' : ''}`}>
        ${!locked
          ? html`<div class="macro-toolbar" data-emr-print="hide">
              <span class="macro-helper">Type <strong>.</strong> or <strong>/</strong> for SmartPhrases</span>
              <div class="macro-actions">
                ${showClear
                  ? html`<button
                      type="button"
                      class="pf-clear"
                      data-emr-print="hide"
                      aria-label=${`Clear ${resolvedLabel}`}
                      @click=${() => {
                        if (!this.locked) {
                          this.emitIntent<MacroTextFieldIntent>({ type: 'clearRequested' });
                          (this.shadowRoot?.getElementById(id) as HTMLTextAreaElement | null)?.focus();
                        }
                      }}
                    >${renderEmrSvgIcon('close', 14)}</button>`
                  : nothing}
                ${dictationVisible
                  ? html`<button
                      type="button"
                      class=${`emr-btn emr-btn--sm ${m.dictating ? 'emr-btn--danger' : 'emr-btn--outline'}`}
                      aria-pressed=${m.dictating ? 'true' : 'false'}
                      aria-label=${`${m.dictating ? 'Stop dictation' : 'Start dictation'} for ${resolvedLabel}`}
                      @click=${() => {
                        if (!this.locked) {
                          this.emitIntent<MacroTextFieldIntent>({ type: 'dictationToggleRequested' });
                        }
                      }}
                    >${renderEmrSvgIcon('mic', 15)} ${m.dictating ? 'Stop dictation' : 'Start dictation'}</button>`
                  : nothing}
              </div>
            </div>`
          : nothing}

        <div class="macro-anchor">
          <textarea
            id=${id}
            class="emr-control"
            rows=${resolvedRows}
            maxlength=${resolvedMaxLength ?? nothing}
            placeholder=${resolvedPlaceholder}
            aria-label=${resolvedLabel}
            aria-labelledby=${this.headingId || nothing}
            role="combobox"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded=${popupOpen ? 'true' : 'false'}
            aria-controls=${popupOpen && hasSuggestions ? listboxId : nothing}
            aria-activedescendant=${activeDescendant || nothing}
            aria-describedby=${describedBy || nothing}
            aria-required=${resolvedRequired ? 'true' : nothing}
            aria-readonly=${locked ? 'true' : nothing}
            aria-invalid=${vs.hasError ? 'true' : nothing}
            data-warning=${vs.hasWarning ? 'true' : nothing}
            .value=${live(val)}
            ?required=${resolvedRequired}
            ?readonly=${locked}
            @focus=${() => {
              this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
            }}
            @blur=${(e: Event) => {
              (e.target as HTMLTextAreaElement).value = this.model?.value ?? '';
              this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
            }}
            @keydown=${(e: KeyboardEvent) => {
              if (this.locked) return;
              if (!popupOpen) {
                if (e.key === 'Escape' && this.model?.suggestionsOpen) {
                  e.preventDefault();
                  this.emitIntent<MacroTextFieldIntent>({ type: 'macroDismissRequested' });
                }
                return;
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                this.emitIntent<MacroTextFieldIntent>({ type: 'macroDismissRequested' });
                return;
              }
              const list = this.model?.suggestions ?? [];
              if (list.length === 0) return;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.activeIndex = (this.activeIndex + 1) % list.length;
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.activeIndex = (this.activeIndex - 1 + list.length) % list.length;
              } else if (e.key === 'Enter') {
                const chosen = list[Math.max(0, Math.min(this.activeIndex, list.length - 1))];
                if (chosen) {
                  e.preventDefault();
                  this.emitIntent<MacroTextFieldIntent>({
                    type: 'macroSelected',
                    trigger: chosen.trigger,
                  });
                }
              }
            }}
            @input=${(e: Event) => {
              const area = e.target as HTMLTextAreaElement;
              if (this.locked) {
                area.value = this.model?.value ?? '';
                return;
              }
              const nextVal = area.value;
              if (resolvedAutoResize) {
                this.applyAutoResize(area);
              }
              this.emitIntent<MacroTextFieldIntent>({ type: 'valueChangeRequested', value: nextVal });
              const caret = area.selectionStart ?? nextVal.length;
              const trigger = extractActiveMacroTrigger(nextVal, caret);
              if (trigger) {
                this.activeIndex = 0;
                this.emitIntent<MacroTextFieldIntent>({
                  type: 'macroQueryRequested',
                  trigger,
                });
              } else if (this.model?.suggestionsOpen) {
                this.emitIntent<MacroTextFieldIntent>({ type: 'macroDismissRequested' });
              }
            }}
          ></textarea>

          ${popupOpen
            ? html`<div class="macro-popover" data-emr-print="hide">
                <div class="macro-popover-header">
                  <span class="macro-popover-title">SMARTPHRASES</span>
                  <button
                    type="button"
                    class="macro-popover-close"
                    aria-label="Close SmartPhrases"
                    @mousedown=${(e: Event) => e.preventDefault()}
                    @click=${() => this.dismissMacros(true)}
                  >${renderEmrSvgIcon('close', 14)}</button>
                </div>
                ${hasSuggestions
                  ? html`<div
                      id=${listboxId}
                      class="macro-list"
                      role="listbox"
                      aria-label=${`${resolvedLabel} macro suggestions`}
                    >
                      ${m.suggestions.map(
                        (s, idx) => html`<button
                          type="button"
                          role="option"
                          id=${`${id}-macro-${idx}`}
                          class="macro-option"
                          aria-selected=${idx === clampedIdx ? 'true' : 'false'}
                          @mousedown=${(e: Event) => e.preventDefault()}
                          @click=${() => {
                            if (!this.locked) {
                              this.emitIntent<MacroTextFieldIntent>({
                                type: 'macroSelected',
                                trigger: s.trigger,
                              });
                            }
                          }}
                        >
                          <div class="macro-option-head">
                            <code class="macro-trigger">${s.trigger}</code>
                            <strong>${s.label}</strong>
                            ${s.category
                              ? html`<span class="macro-category">${s.category}</span>`
                              : nothing}
                          </div>
                          <span class="emr-muted">${s.expansionPreview}</span>
                        </button>`,
                      )}
                    </div>`
                  : html`<div class="macro-empty" role="status">No matching SmartPhrases</div>`}
              </div>`
            : nothing}
        </div>

        ${showCounter
          ? html`<div class="macro-footer">
              <span
                id=${counterId}
                class=${`macro-counter${resolvedMaxLength !== undefined && val.length >= resolvedMaxLength ? ' macro-counter--warn' : ''}`}
              >${resolvedMaxLength !== undefined ? `${val.length} / ${resolvedMaxLength}` : `${val.length}`}</span>
            </div>`
          : nothing}
      </div>
    </emr-field-frame>`;
  }
}

/** 11. EmrLateralityFieldElement (`emr-laterality-field`) */
export class EmrLateralityFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-laterality-field');
  private focusInside = false;

  @property({ attribute: false }) definition?: EmrFieldDefinition;
  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) layout?: FieldFrameLayout;
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: String }) size?: EmrSegmentedSize;
  @property({ attribute: false }) clearable?: boolean;
  @property({ attribute: false }) model?: LateralityFieldViewModel;

  private get locked(): boolean {
    const resolvedDef = this.definition ?? this.model?.definition;
    return Boolean(this.readOnly || this.model?.readOnly || resolvedDef?.contract?.readOnly);
  }

  private onGroupFocusIn = (): void => {
    if (!this.focusInside) {
      this.focusInside = true;
      this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
    }
  };

  private onGroupFocusOut = (event: FocusEvent): void => {
    const currentTarget = event.currentTarget as HTMLElement | null;
    const relatedTarget = event.relatedTarget as Node | null;
    if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    if (this.focusInside) {
      this.focusInside = false;
      this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
    }
  };

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const resolvedDef = this.definition ?? m.definition;
    const resolvedLabel = m.label || resolvedDef?.presentation?.label || '';
    const resolvedUnit = resolvedDef?.presentation?.unitDisplay ?? '';
    const resolvedHint = m.hint ?? resolvedDef?.presentation?.hint ?? '';
    const resolvedLayout = normalizeFieldFrameLayout(this.layout ?? m.layout);
    const resolvedShowMetadata = this.showMetadata && m.showMetadata !== false;
    const locked = this.locked;
    const minCard = resolvedDef?.contract?.cardinality?.min;
    const resolvedRequired = Boolean(m.required || (minCard !== undefined && minCard >= 1));
    const resolvedSize: EmrSegmentedSize = this.size ?? m.size ?? 'md';
    const resolvedClearable = this.clearable ?? m.clearable ?? !resolvedRequired;
    const resolvedOrientation = m.orientation ?? 'horizontal';
    const resolvedConfirmationLabel =
      m.confirmationLabel || DEFAULT_LATERALITY_CONFIRMATION_LABEL;

    const segmentedOptions: EmrSegmentedOption[] = resolveLateralityOptions(m).map((opt) => ({
      value: opt.code,
      label: opt.label,
      badge: opt.shortLabel,
      description: opt.description,
      icon: opt.icon,
      ariaLabel: opt.ariaLabel,
      readOnly: opt.readOnly,
      disabled: opt.disabled,
      tone: opt.tone,
    }));

    const validation = resolveLateralityValidation(m.messages);
    const hasMessages = Boolean(resolvedHint || m.messages?.length);
    const describedBy = hasMessages ? `${id}-message` : '';
    const groupLabelledBy =
      this.headingId || (!this.labelHidden && resolvedLabel ? `${id}-label` : '');

    return html`<emr-field-frame
      .controlId=${id}
      .label=${resolvedLabel}
      .labelHidden=${this.labelHidden}
      .labelNamesControl=${false}
      .layout=${resolvedLayout}
      .showMetadata=${resolvedShowMetadata}
      .unit=${resolvedUnit}
      .readOnly=${locked}
      .hint=${resolvedHint}
      .messages=${m.messages ?? []}
      .assessmentStatus=${m.status}
      .assessmentStatusOptions=${m.statusOptions ?? []}
      ?required=${resolvedRequired}
      @intent=${(e: CustomEvent<{ type?: string; status?: ClinicalAssessmentStatus }>) => {
        if (e.detail?.type === 'statusChangeRequested') {
          e.stopPropagation();
          if (!locked) {
            this.emitIntent<LateralityFieldIntent>({
              type: 'statusChangeRequested',
              status: e.detail.status,
            });
          }
        }
      }}
    >
      <div class="l2-stack" @focusin=${this.onGroupFocusIn} @focusout=${this.onGroupFocusOut}>
        <emr-segmented-control
          .controlId=${`${id}-control`}
          .ariaLabel=${resolvedLabel}
          .ariaLabelledBy=${groupLabelledBy}
          .ariaDescribedBy=${describedBy}
          .options=${segmentedOptions}
          .value=${m.value}
          .size=${resolvedSize}
          .orientation=${resolvedOrientation}
          .clearable=${resolvedClearable}
          .allowDeselect=${false}
          ?required=${resolvedRequired}
          .readOnly=${locked}
          .invalid=${validation.groupHasError}
          .hasWarning=${validation.groupHasWarning}
          @focused=${(e: Event) => e.stopPropagation()}
          @blurred=${(e: Event) => e.stopPropagation()}
          @valueChange=${(e: CustomEvent<string | null>) => {
            e.stopPropagation();
            if (locked) return;
            this.emitIntent<LateralityFieldIntent>({
              type: 'lateralitySelected',
              code: (e.detail as EmrLateralityCode | null) ?? null,
            });
          }}
          @cleared=${(e: Event) => {
            e.stopPropagation();
            if (!locked) {
              this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
            }
          }}
        ></emr-segmented-control>

        ${m.requiresConfirmation
          ? html`<emr-checkbox
              .controlId=${`${id}-confirm`}
              .label=${resolvedConfirmationLabel}
              .checked=${!!m.confirmed}
              .readOnly=${locked}
              .required=${resolvedRequired}
              .invalid=${validation.confirmationHasError}
              .hasWarning=${validation.confirmationHasWarning}
              .ariaDescribedBy=${describedBy}
              @focused=${(e: Event) => e.stopPropagation()}
              @blurred=${(e: Event) => e.stopPropagation()}
              @checkedChange=${(e: CustomEvent<boolean>) => {
                e.stopPropagation();
                if (!locked) {
                  this.emitIntent<LateralityFieldIntent>({
                    type: 'confirmationChangeRequested',
                    confirmed: e.detail,
                  });
                }
              }}
            ></emr-checkbox>`
          : nothing}
      </div>
    </emr-field-frame>`;
  }
}

/** 12. EmrVisualAcuityFieldElement (`emr-visual-acuity-field`) */
export class EmrVisualAcuityFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-visual-acuity');
  private focusInside = false;

  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) layout?: FieldFrameLayout;
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: String }) size?: 'sm' | 'md' | 'lg';
  @property({ attribute: false }) clearable?: boolean;
  @property({ attribute: false }) definition?: EmrFieldDefinition;
  @property({ attribute: false }) model?: VisualAcuityFieldViewModel;

  private get locked(): boolean {
    const def = this.definition ?? this.model?.definition;
    return Boolean(this.readOnly || this.model?.readOnly || def?.contract?.readOnly);
  }

  private onGroupFocusIn = (): void => {
    if (!this.focusInside) {
      this.focusInside = true;
      this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
    }
  };

  private onGroupFocusOut = (event: FocusEvent): void => {
    const currentTarget = event.currentTarget as HTMLElement | null;
    const relatedTarget = event.relatedTarget as Node | null;
    if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    if (this.focusInside) {
      this.focusInside = false;
      this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
    }
  };

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const resolvedDef = this.definition ?? m.definition;
    const resolvedLabel = m.label || resolvedDef?.presentation?.label || '';
    const resolvedUnit = resolvedDef?.presentation?.unitDisplay ?? '';
    const resolvedHint = m.hint ?? resolvedDef?.presentation?.hint ?? '';
    const resolvedLayout = normalizeFieldFrameLayout(this.layout ?? m.layout);
    const resolvedShowMetadata = this.showMetadata && m.showMetadata !== false;
    const locked = this.locked;
    const minCard = resolvedDef?.contract?.cardinality?.min;
    const resolvedRequired = Boolean(m.required || (minCard !== undefined && minCard >= 1));
    const resolvedSize: 'sm' | 'md' | 'lg' = this.size ?? m.size ?? 'md';
    const resolvedClearable = this.clearable ?? m.clearable ?? true;

    const pv = resolveVisualAcuityPartValidation(m.messages);
    const hasMessages = Boolean(resolvedHint || m.messages?.length);
    const describedBy = hasMessages ? `${id}-message` : '';
    const groupLabelledBy =
      this.headingId || (!this.labelHidden && resolvedLabel ? `${id}-label` : '');

    const notationLabel = m.labels?.notationLabel ?? 'Notation';
    const correctionLabel = m.labels?.correctionLabel ?? 'Correction';
    const valueLabel = m.labels?.valueLabel ?? 'Acuity';
    const pinholeLabel = m.labels?.pinholeLabel ?? 'Pinhole (PH)';
    const derivedLabel = m.labels?.derivedLabel ?? 'Equivalent';
    const clearLabel = m.labels?.clearLabel ?? 'Clear';
    const valuePlaceholder = m.valuePlaceholder ?? 'Select acuity';
    const pinholePlaceholder = m.pinholePlaceholder ?? 'Not tested';
    const pinholeOptions = m.pinholeOptions ?? m.valueOptions;

    return html`<emr-field-frame
      .controlId=${id}
      .label=${resolvedLabel}
      .labelHidden=${this.labelHidden}
      .labelNamesControl=${false}
      .layout=${resolvedLayout}
      .showMetadata=${resolvedShowMetadata}
      .unit=${resolvedUnit}
      .readOnly=${locked}
      .hint=${resolvedHint}
      .messages=${m.messages ?? []}
      .assessmentStatus=${m.status}
      .assessmentStatusOptions=${m.statusOptions ?? []}
      ?required=${resolvedRequired}
      @intent=${(e: CustomEvent<{ type?: string; status?: ClinicalAssessmentStatus }>) => {
        if (e.detail?.type === 'statusChangeRequested') {
          e.stopPropagation();
          if (!locked) {
            this.emitIntent<VisualAcuityFieldIntent>({
              type: 'statusChangeRequested',
              status: e.detail.status,
            });
          }
        }
      }}
    >
      <div
        class="l2-stack"
        role="group"
        aria-labelledby=${groupLabelledBy || nothing}
        aria-label=${resolvedLabel}
        @focusin=${this.onGroupFocusIn}
        @focusout=${this.onGroupFocusOut}
      >
        ${m.eye || m.derivedDisplay
          ? html`<div class="va-context">
              ${m.eye
                ? html`<emr-badge
                    tone="info"
                    icon="eye"
                    .label=${m.eye}
                    .assistiveText=${resolveVisualAcuityEyeDescription(m.eye, m.labels)}
                  ></emr-badge>`
                : nothing}
              ${m.derivedDisplay
                ? html`<emr-badge
                    .tone=${m.derivedTone ?? 'neutral'}
                    .label=${m.derivedDisplay}
                    .assistiveText=${`${derivedLabel}: ${m.derivedDisplay}`}
                    .tabularNums=${true}
                  ></emr-badge>`
                : nothing}
            </div>`
          : nothing}

        ${m.notationOptions.length > 0 || m.correctionOptions.length > 0
          ? html`<div class="va-modifiers">
              ${m.notationOptions.length > 0
                ? html`<div class="va-modifier">
                    <span class="va-sub-label" id=${`${id}-notation-label`}>${notationLabel}</span>
                    <emr-segmented-control
                      .controlId=${`${id}-notation`}
                      .ariaLabel=${`${resolvedLabel} ${notationLabel}`}
                      .ariaLabelledBy=${`${id}-notation-label`}
                      .ariaDescribedBy=${describedBy}
                      .options=${m.notationOptions}
                      .value=${m.notation}
                      .size=${resolvedSize}
                      .allowDeselect=${false}
                      .readOnly=${locked}
                      .invalid=${pv.notationHasError}
                      .hasWarning=${pv.notationHasWarning}
                      @focused=${(e: Event) => e.stopPropagation()}
                      @blurred=${(e: Event) => e.stopPropagation()}
                      @valueChange=${(e: CustomEvent<string | null>) => {
                        e.stopPropagation();
                        if (!locked && e.detail) {
                          this.emitIntent<VisualAcuityFieldIntent>({
                            type: 'notationChangeRequested',
                            notation: e.detail as EmrAcuityNotation,
                          });
                        }
                      }}
                    ></emr-segmented-control>
                  </div>`
                : nothing}

              ${m.correctionOptions.length > 0
                ? html`<div class="va-modifier">
                    <span class="va-sub-label" id=${`${id}-correction-label`}>${correctionLabel}</span>
                    <emr-segmented-control
                      .controlId=${`${id}-correction`}
                      .ariaLabel=${`${resolvedLabel} ${correctionLabel}`}
                      .ariaLabelledBy=${`${id}-correction-label`}
                      .ariaDescribedBy=${describedBy}
                      .options=${m.correctionOptions}
                      .value=${m.correction}
                      .size=${resolvedSize}
                      .allowDeselect=${false}
                      .readOnly=${locked}
                      .invalid=${pv.correctionHasError}
                      .hasWarning=${pv.correctionHasWarning}
                      @focused=${(e: Event) => e.stopPropagation()}
                      @blurred=${(e: Event) => e.stopPropagation()}
                      @valueChange=${(e: CustomEvent<string | null>) => {
                        e.stopPropagation();
                        if (!locked && e.detail) {
                          this.emitIntent<VisualAcuityFieldIntent>({
                            type: 'correctionChangeRequested',
                            correction: e.detail as EmrAcuityCorrection,
                          });
                        }
                      }}
                    ></emr-segmented-control>
                  </div>`
                : nothing}
            </div>`
          : nothing}

        <div class=${`va-grid${m.showPinhole ? ' va-grid--paired' : ''}`}>
          <div class="sub-field">
            <label class="va-sub-label" for=${`${id}-value`}>
              ${valueLabel}${resolvedRequired ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
            </label>
            <emr-select
              .controlId=${`${id}-value`}
              .label=${`${resolvedLabel} ${valueLabel}`}
              .labelHidden=${true}
              .options=${m.valueOptions}
              .value=${m.value}
              .placeholder=${valuePlaceholder}
              .size=${resolvedSize}
              .clearable=${resolvedClearable}
              .clearLabel=${clearLabel}
              ?required=${resolvedRequired}
              .readOnly=${locked}
              .invalid=${pv.valueHasError}
              .hasWarning=${pv.valueHasWarning}
              .ariaDescribedBy=${describedBy}
              .tabularNums=${true}
              @focused=${(e: Event) => e.stopPropagation()}
              @blurred=${(e: Event) => e.stopPropagation()}
              @valueChange=${(e: CustomEvent<string | null>) => {
                e.stopPropagation();
                if (!locked) {
                  this.emitIntent<VisualAcuityFieldIntent>({
                    type: 'valueChangeRequested',
                    value: e.detail,
                  });
                }
              }}
            ></emr-select>
          </div>

          ${m.showPinhole
            ? html`<div class="sub-field">
                <label class="va-sub-label" for=${`${id}-pinhole`}>
                  ${pinholeLabel}${m.pinholeRequired ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}
                </label>
                <emr-select
                  .controlId=${`${id}-pinhole`}
                  .label=${`${resolvedLabel} ${pinholeLabel}`}
                  .labelHidden=${true}
                  .options=${pinholeOptions}
                  .value=${m.pinholeValue ?? null}
                  .placeholder=${pinholePlaceholder}
                  .size=${resolvedSize}
                  .clearable=${resolvedClearable}
                  .clearLabel=${clearLabel}
                  ?required=${Boolean(m.pinholeRequired)}
                  .readOnly=${locked}
                  .invalid=${pv.pinholeHasError}
                  .hasWarning=${pv.pinholeHasWarning}
                  .ariaDescribedBy=${describedBy}
                  .tabularNums=${true}
                  @focused=${(e: Event) => e.stopPropagation()}
                  @blurred=${(e: Event) => e.stopPropagation()}
                  @valueChange=${(e: CustomEvent<string | null>) => {
                    e.stopPropagation();
                    if (!locked) {
                      this.emitIntent<VisualAcuityFieldIntent>({
                        type: 'pinholeChangeRequested',
                        value: e.detail,
                      });
                    }
                  }}
                ></emr-select>
              </div>`
            : nothing}
        </div>
      </div>
    </emr-field-frame>`;
  }
}

/** 13. EmrRefractionFieldElement (`emr-refraction-field`) */
export class EmrRefractionFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-refraction-field');
  private focusInside = false;
  private focusedPart: EmrRefractionPart | null = null;
  private drafts: Partial<
    Record<EmrRefractionPart, { text: string; base: number | null; parsed: number | null | undefined }>
  > = {};

  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) layout?: FieldFrameLayout;
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: String }) size?: 'sm' | 'md' | 'lg';
  @property({ attribute: false }) clearable?: boolean;
  @property({ attribute: false }) definition?: EmrFieldDefinition;
  @property({ attribute: false }) model?: RefractionFieldViewModel;

  private get locked(): boolean {
    const def = this.definition ?? this.model?.definition;
    return Boolean(this.readOnly || this.model?.readOnly || def?.contract?.readOnly);
  }

  private onGroupFocusIn = (): void => {
    if (!this.focusInside) {
      this.focusInside = true;
      this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }));
    }
  };

  private onGroupFocusOut = (event: FocusEvent): void => {
    const currentTarget = event.currentTarget as HTMLElement | null;
    const relatedTarget = event.relatedTarget as Node | null;
    if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    if (this.focusInside) {
      this.focusInside = false;
      this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
    }
  };

  private emitPartIntent(part: EmrRefractionPart, val: number | null): void {
    if (part === 'sphere') this.emitIntent<RefractionFieldIntent>({ type: 'sphereChangeRequested', sphere: val });
    else if (part === 'cylinder') this.emitIntent<RefractionFieldIntent>({ type: 'cylinderChangeRequested', cylinder: val });
    else if (part === 'axis') this.emitIntent<RefractionFieldIntent>({ type: 'axisChangeRequested', axis: val });
    else this.emitIntent<RefractionFieldIntent>({ type: 'nearAddChangeRequested', nearAdd: val });
  }

  private renderPart(params: {
    part: EmrRefractionPart;
    inputId: string;
    rawValue: number | null | undefined;
    min: number;
    max: number;
    step: number;
    locked: boolean;
    required: boolean;
    hasError: boolean;
    hasWarning: boolean;
    describedBy: string;
  }) {
    const {
      part,
      inputId,
      rawValue,
      min,
      max,
      step,
      locked,
      required,
      hasError,
      hasWarning,
      describedBy,
    } = params;
    const cfg = REFRACTION_DEFAULT_BOUNDS[part];
    const mode: 'decimal' | 'integer' = cfg.precision === 0 ? 'integer' : 'decimal';
    const numericVal = typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : null;
    const formatted = formatRefractionPartDisplay(numericVal, cfg.precision);

    if (locked) {
      delete this.drafts[part];
    } else {
      const existing = this.drafts[part];
      if (existing && numericVal !== existing.base && numericVal !== existing.parsed) {
        delete this.drafts[part];
      }
    }
    const activeDraft = this.drafts[part];
    const shown =
      !locked &&
      this.focusedPart === part &&
      activeDraft &&
      (numericVal === activeDraft.base || numericVal === activeDraft.parsed)
        ? activeDraft.text
        : formatted;

    const canDec = !locked && (numericVal === null || numericVal - step >= min - 1e-9);
    const canInc = !locked && (numericVal === null || numericVal + step <= max + 1e-9);

    const stepBy = (delta: -1 | 1) => {
      if (locked) return;
      delete this.drafts[part];
      const next = stepRefractionPart({
        current: numericVal,
        delta,
        part,
        step,
        min,
        max,
      });
      this.emitPartIntent(part, next);
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (locked) {
        target.value = formatted;
        return;
      }
      const clean = sanitizePairedNumberText(target.value, mode);
      if (target.value !== clean) {
        target.value = clean;
      }
      const parsed = parsePairedNumberDraft(clean, mode);
      this.drafts[part] = {
        text: clean,
        base: numericVal,
        parsed: parsed.complete ? parsed.value : undefined,
      };
      if (parsed.complete) {
        this.emitPartIntent(part, parsed.value);
      }
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (locked) return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        stepBy(1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        stepBy(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        delete this.drafts[part];
        (e.target as HTMLInputElement).value = formatted;
      }
    };

    return html`<div class="sub-field">
      <label class="sub-label" for=${inputId}>${cfg.label}</label>
      <div
        class="pf-affix ref-affix"
        data-invalid=${hasError ? 'true' : nothing}
        data-warning=${!hasError && hasWarning ? 'true' : nothing}
        data-readonly=${locked ? 'true' : nothing}
      >
        <button
          type="button"
          class="pf-affix-btn pf-affix-btn--leading"
          data-emr-print="hide"
          ?disabled=${locked || !canDec}
          aria-label=${`Decrease ${cfg.label}`}
          @click=${() => stepBy(-1)}
        >${renderEmrSvgIcon('minus', 14)}</button>
        <input
          id=${inputId}
          data-part=${part}
          class="pf-affix-field"
          type="text"
          role="spinbutton"
          inputmode=${cfg.precision === 0 ? 'numeric' : 'decimal'}
          .value=${live(shown)}
          aria-valuemin=${String(min)}
          aria-valuemax=${String(max)}
          aria-valuenow=${numericVal !== null ? String(numericVal) : nothing}
          ?required=${required}
          ?readonly=${locked}
          aria-required=${required ? 'true' : nothing}
          aria-readonly=${locked ? 'true' : nothing}
          aria-invalid=${hasError ? 'true' : nothing}
          data-warning=${!hasError && hasWarning ? 'true' : nothing}
          aria-describedby=${describedBy || nothing}
          @wheel=${(e: WheelEvent) => (e.currentTarget as HTMLInputElement).blur()}
          @keydown=${handleKeydown}
          @input=${handleInput}
          @focus=${() => {
            this.focusedPart = part;
          }}
          @blur=${(e: Event) => {
            delete this.drafts[part];
            if (this.focusedPart === part) this.focusedPart = null;
            (e.target as HTMLInputElement).value = formatted;
          }}
        />
        <span class="ref-unit" aria-hidden="true">${cfg.unit}</span>
        <button
          type="button"
          class="pf-affix-btn pf-affix-btn--trailing"
          data-emr-print="hide"
          ?disabled=${locked || !canInc}
          aria-label=${`Increase ${cfg.label}`}
          @click=${() => stepBy(1)}
        >${renderEmrSvgIcon('plus', 14)}</button>
      </div>
    </div>`;
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const resolvedDef = this.definition ?? m.definition;
    const resolvedLabel = m.label || resolvedDef?.presentation?.label || 'Refraction';
    const resolvedUnit = resolvedDef?.presentation?.unitDisplay ?? '';
    const resolvedHint = m.hint ?? resolvedDef?.presentation?.hint ?? '';
    const resolvedLayout = normalizeFieldFrameLayout(this.layout ?? m.layout);
    const resolvedShowMetadata = this.showMetadata && m.showMetadata !== false;
    const locked = this.locked;
    const minCard = resolvedDef?.contract?.cardinality?.min;
    const resolvedRequired = Boolean(m.required || (minCard !== undefined && minCard >= 1));
    const resolvedSize: 'sm' | 'md' | 'lg' = this.size ?? m.size ?? 'md';
    const resolvedClearable = this.clearable ?? m.clearable ?? false;
    const showClear = resolvedClearable && !locked && hasRefractionValue(m.value, m.showNearAdd);

    const hasMessages = Boolean(resolvedHint || m.messages?.length);
    const describedBy = hasMessages ? `${id}-message` : '';
    const groupLabelledBy =
      this.headingId || (!this.labelHidden && resolvedLabel ? `${id}-label` : '');
    const groupAriaLabel = m.eye ? `${resolvedLabel} (${m.eye})` : resolvedLabel;

    const parts: readonly EmrRefractionPart[] = m.showNearAdd
      ? ['sphere', 'cylinder', 'axis', 'nearAdd']
      : ['sphere', 'cylinder', 'axis'];

    return html`<emr-field-frame
      .controlId=${id}
      .label=${resolvedLabel}
      .labelHidden=${this.labelHidden}
      .labelNamesControl=${false}
      .layout=${resolvedLayout}
      .showMetadata=${resolvedShowMetadata}
      .unit=${resolvedUnit}
      .readOnly=${locked}
      .hint=${resolvedHint}
      .messages=${m.messages ?? []}
      .assessmentStatus=${m.status}
      .assessmentStatusOptions=${m.statusOptions ?? []}
      ?required=${resolvedRequired}
      @intent=${(e: CustomEvent<{ type?: string; status?: ClinicalAssessmentStatus }>) => {
        if (e.detail?.type === 'statusChangeRequested') {
          e.stopPropagation();
          if (!locked) {
            this.emitIntent<RefractionFieldIntent>({
              type: 'statusChangeRequested',
              status: e.detail.status,
            });
          }
        }
      }}
    >
      <div
        class=${`l2-stack${resolvedSize === 'lg' ? ' ref-lg' : ''}`}
        role="group"
        aria-labelledby=${groupLabelledBy || nothing}
        aria-label=${groupAriaLabel}
        aria-required=${resolvedRequired ? 'true' : nothing}
        aria-describedby=${describedBy || nothing}
        @focusin=${this.onGroupFocusIn}
        @focusout=${this.onGroupFocusOut}
      >
        ${m.eye || m.formattedSummary || showClear
          ? html`<div class="ref-header">
              ${m.eye
                ? html`<emr-badge
                    tone="info"
                    icon="eye"
                    .label=${m.eye}
                    .assistiveText=${resolveRefractionEyeDescription(m.eye)}
                  ></emr-badge>`
                : nothing}
              ${m.formattedSummary
                ? html`<emr-badge
                    tone="neutral"
                    .label=${m.formattedSummary}
                    .assistiveText=${`Summary: ${m.formattedSummary}`}
                    .tabularNums=${true}
                  ></emr-badge>`
                : nothing}
              ${showClear
                ? html`<button
                    type="button"
                    class="pf-clear ref-clear"
                    data-emr-print="hide"
                    aria-label=${`Clear ${resolvedLabel}`}
                    @click=${() => {
                      if (!locked) {
                        this.drafts = {};
                        this.emitIntent<RefractionFieldIntent>({ type: 'clearRequested' });
                      }
                    }}
                  >${renderEmrSvgIcon('close', 14)}</button>`
                : nothing}
            </div>`
          : nothing}

        <div class="ref-grid">
          ${parts.map((part) => {
            const cfg = REFRACTION_DEFAULT_BOUNDS[part];
            const pv = resolveRefractionPartValidation(m.messages, part);
            const rawValue =
              part === 'sphere'
                ? m.value.sphere
                : part === 'cylinder'
                  ? m.value.cylinder
                  : part === 'axis'
                    ? m.value.axis
                    : m.value.nearAdd;
            const min =
              part === 'sphere'
                ? (m.sphereMin ?? cfg.min)
                : part === 'cylinder'
                  ? (m.cylinderMin ?? cfg.min)
                  : part === 'axis'
                    ? (m.axisMin ?? cfg.min)
                    : (m.nearAddMin ?? cfg.min);
            const max =
              part === 'sphere'
                ? (m.sphereMax ?? cfg.max)
                : part === 'cylinder'
                  ? (m.cylinderMax ?? cfg.max)
                  : part === 'axis'
                    ? (m.axisMax ?? cfg.max)
                    : (m.nearAddMax ?? cfg.max);
            const step =
              part === 'sphere'
                ? (m.sphereStep ?? cfg.step)
                : part === 'cylinder'
                  ? (m.cylinderStep ?? cfg.step)
                  : part === 'axis'
                    ? (m.axisStep ?? cfg.step)
                    : (m.nearAddStep ?? cfg.step);
            return this.renderPart({
              part,
              inputId: `${id}-${part}`,
              rawValue,
              min,
              max,
              step,
              locked,
              required: resolvedRequired,
              hasError: pv.hasError,
              hasWarning: pv.hasWarning,
              describedBy,
            });
          })}
        </div>
      </div>
    </emr-field-frame>`;
  }
}

/** 14. EmrImageFieldElement (`emr-image-field`) */
export class EmrImageFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-image-field');

  @property({ type: String }) controlId = '';
  @property({ type: String }) headingId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) layout?: FieldFrameLayout;
  @property({ type: Boolean }) showMetadata = true;
  @property({ type: Boolean }) readOnly = false;
  @property({ attribute: false }) definition?: EmrFieldDefinition;
  @property({ attribute: false }) model?: ImageFieldViewModel;

  private get resolvedDefinition(): EmrFieldDefinition | undefined {
    return this.definition ?? this.model?.definition;
  }

  private get locked(): boolean {
    if (!this.model) return Boolean(this.readOnly || this.definition?.contract?.readOnly);
    return Boolean(
      this.readOnly || this.model.readOnly || this.resolvedDefinition?.contract?.readOnly,
    );
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const def = this.resolvedDefinition;
    const resolvedLabel = m.label || def?.presentation?.label || '';
    const resolvedLabelHidden = Boolean(this.labelHidden || m.labelHidden);
    const resolvedHint = m.hint ?? def?.presentation?.hint;
    const resolvedLayout = normalizeFieldFrameLayout(this.layout ?? m.layout);
    const resolvedShowMetadata = this.showMetadata && m.showMetadata !== false;
    const locked = this.locked;
    const minCard = def?.contract?.cardinality?.min;
    const resolvedRequired = Boolean(m.required || (minCard !== undefined && minCard >= 1));
    const maxCard = def?.contract?.cardinality?.max;
    const resolvedMultiple =
      m.multiple !== undefined ? m.multiple : maxCard === undefined || maxCard !== 1;
    const resolvedPresets = m.aspectPresets?.length ? m.aspectPresets : DEFAULT_ASPECT_PRESETS;
    const hasError = Boolean(m.messages?.some((msg) => msg.severity === 'error'));

    return html`<emr-field-frame
      .controlId=${id}
      .label=${resolvedLabel}
      .labelHidden=${resolvedLabelHidden}
      .labelNamesControl=${false}
      .layout=${resolvedLayout}
      .showMetadata=${resolvedShowMetadata}
      .readOnly=${locked}
      .hint=${resolvedHint ?? ''}
      .messages=${m.messages ?? []}
      .assessmentStatus=${m.status}
      .assessmentStatusOptions=${m.statusOptions ?? []}
      ?required=${resolvedRequired}
      @intent=${(e: CustomEvent<{ type?: string; status?: ClinicalAssessmentStatus }>) => {
        if (e.detail?.type === 'statusChangeRequested') {
          e.stopPropagation();
          if (!locked) {
            this.emitIntent<ImageFieldIntent>({
              type: 'statusChangeRequested',
              status: e.detail.status,
            });
          }
        }
      }}
    >
      <div
        class="l2-stack"
        aria-labelledby=${this.headingId || nothing}
        @focusin=${() => this.dispatchEvent(new CustomEvent('focused', { bubbles: true, composed: true }))}
        @focusout=${() => this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }))}
      >
        <emr-image-upload
          .controlId=${`${id}-upload`}
          .label=${resolvedLabel}
          .labelHidden=${true}
          .items=${m.items ?? []}
          .accept=${m.accept ?? 'image/*'}
          .multiple=${resolvedMultiple}
          .maxFiles=${m.maxFiles}
          .maxSizeBytes=${m.maxSizeBytes}
          .allowCamera=${!!m.allowCamera}
          .aspectPresets=${resolvedPresets}
          .required=${resolvedRequired}
          .readOnly=${locked}
          .invalid=${hasError}
          @filesSelected=${(e: CustomEvent<readonly EmrFileSelectionItem[]>) => {
            e.stopPropagation();
            if (!locked) {
              this.emitIntent<ImageFieldIntent>({ type: 'filesSelected', files: e.detail });
            }
          }}
          @nativeFilesSelected=${(e: CustomEvent<readonly File[]>) => {
            e.stopPropagation();
            if (!locked) {
              this.dispatchEvent(
                new CustomEvent<readonly File[]>('nativeFilesSelected', {
                  detail: e.detail,
                  bubbles: true,
                  composed: true,
                }),
              );
            }
          }}
          @itemsChange=${(e: CustomEvent<readonly EmrUploadedImageItem[]>) => {
            e.stopPropagation();
            if (!locked) {
              this.emitIntent<ImageFieldIntent>({ type: 'itemsChangeRequested', items: e.detail });
            }
          }}
          @imageCropped=${(e: CustomEvent<{ id: string; result: EmrImageCropResult }>) => {
            e.stopPropagation();
            if (!locked) {
              this.emitIntent<ImageFieldIntent>({
                type: 'imageCropped',
                id: e.detail.id,
                result: e.detail.result,
              });
            }
          }}
          @captionChange=${(e: CustomEvent<{ id: string; caption: string }>) => {
            e.stopPropagation();
            if (!locked) {
              this.emitIntent<ImageFieldIntent>({
                type: 'captionChangeRequested',
                id: e.detail.id,
                caption: e.detail.caption,
              });
            }
          }}
          @removeRequested=${(e: CustomEvent<string>) => {
            e.stopPropagation();
            if (!locked) {
              this.emitIntent<ImageFieldIntent>({ type: 'itemRemoveRequested', id: e.detail });
            }
          }}
          @captureRequested=${(e: CustomEvent<'camera'>) => {
            e.stopPropagation();
            if (!locked) {
              this.emitIntent<ImageFieldIntent>({ type: 'captureRequested', mode: e.detail });
            }
          }}
        ></emr-image-upload>
      </div>
    </emr-field-frame>`;
  }
}

export function registerL2ExtraElements(): void {
  defineEmrElement('emr-scale-field', EmrScaleFieldElement);
  defineEmrElement('emr-partial-date-field', EmrPartialDateFieldElement);
  defineEmrElement('emr-attachment-field', EmrAttachmentFieldElement);
  defineEmrElement('emr-paired-field', EmrPairedFieldElement);
  defineEmrElement('emr-duration-input', EmrDurationInputElement);
  defineEmrElement('emr-range-field', EmrRangeFieldElement);
  defineEmrElement('emr-signature-capture-field', EmrSignatureCaptureFieldElement);
  defineEmrElement('emr-phone-input', EmrPhoneInputElement);
  defineEmrElement('emr-address-field', EmrAddressFieldElement);
  defineEmrElement('emr-macro-text-field', EmrMacroTextFieldElement);
  defineEmrElement('emr-laterality-field', EmrLateralityFieldElement);
  defineEmrElement('emr-visual-acuity-field', EmrVisualAcuityFieldElement);
  defineEmrElement('emr-refraction-field', EmrRefractionFieldElement);
  defineEmrElement('emr-image-field', EmrImageFieldElement);
}
